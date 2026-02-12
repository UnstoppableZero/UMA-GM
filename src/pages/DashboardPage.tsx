// src/pages/DashboardPage.tsx
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { FULL_CALENDAR, getRaceByWeek } from '../data/calendar';
import { trainUma } from '../training';
import { simulateRace, type RaceOutcome } from '../race';
import { useState, useEffect } from 'react';
import { RaceViewer } from '../components/RaceViewer';
import { generateRival, generateUma } from '../generator'; 
import { LEAGUE_TEAMS } from '../data/teams'; 
import type { Uma } from '../types';
import { getQualifiedEntrants, createDivisions, calculateOdds } from '../logic/matchmaking'; 

const formatTime = (rawSeconds: number) => {
  const minutes = Math.floor(rawSeconds / 60);
  const seconds = (rawSeconds % 60).toFixed(2);
  return minutes > 0 ? `${minutes}:${seconds.padStart(5, '0')}` : `${seconds}s`;
};

export function DashboardPage() {
  const gameState = useLiveQuery(() => db.gameState.get(1));
  const roster = useLiveQuery(() => db.umas.toArray());
  
  const latestNews = useLiveQuery(async () => {
      if (!gameState) return [];
      const allNews = await db.news.toArray();
      return allNews.filter(n => n.year === gameState.year).reverse();
  }, [gameState?.year]);
  
  const [raceOutcome, setRaceOutcome] = useState<RaceOutcome | null>(null);
  const [raceLocation, setRaceLocation] = useState<string | undefined>(undefined);
  const [isSimulating, setIsSimulating] = useState(false);
  const [showOdds, setShowOdds] = useState(false);

  const [raceQueue, setRaceQueue] = useState<RaceOutcome[]>([]);
  const [currentQueueIndex, setCurrentQueueIndex] = useState(0);

  useEffect(() => {
    let timer: number;
    if (isSimulating && !raceOutcome) {
      timer = window.setTimeout(() => {
        advanceWeek(false);
      }, 800);
    }
    return () => clearTimeout(timer);
  }, [isSimulating, raceOutcome, gameState?.week]);

  if (!gameState || !roster) return <div>Loading...</div>;

  const currentEvent = getRaceByWeek(gameState.week);
  const currentQualifiedField = currentEvent ? getQualifiedEntrants(roster, currentEvent) : [];

  const initLeagueMode = async () => {
    if (!confirm("⚠️ This will WIPE everything and start 'UmaGM League Mode'. Ready?")) return;
    await db.umas.clear();
    await db.teams.clear();
    await db.gameState.update(1, { year: 1, week: 1, money: 1000000 });
    await db.news.clear();
    await db.raceHistory.clear();
    const teamsData = LEAGUE_TEAMS.map(t => ({ ...t, history: { wins: 0, championships: 0, earnings: 0 } }));
    await db.teams.bulkAdd(teamsData);
    
    const newRoster: Uma[] = [];
    for (const team of LEAGUE_TEAMS) {
      for (let i = 0; i < 10; i++) {
        const horse = generateUma();
        horse.teamId = team.id; 
        const buff = (team.prestige - 50) * 2; 
        horse.stats.speed += buff;
        horse.stats.stamina += buff;
        horse.stats.power += buff;
        horse.energy = 100;
        horse.fatigue = 0;
        horse.injuryWeeks = 0;
        newRoster.push(horse);
      }
    }
    await db.umas.bulkAdd(newRoster);
    alert("🏆 League Initialized!");
    window.location.reload();
  };

  const advanceWeek = async (viewRace = true) => {
    setShowOdds(false);
    
    const trainingUpdates = roster.map(uma => {
      // 1. INJURY RECOVERY
      if (uma.injuryWeeks > 0) {
        uma.injuryWeeks -= 1;
        uma.energy = 100; // Injuries force full rest
        uma.fatigue = 0;
        return { uma, changes: ["Recovering..."] };
      }

      const isRacing = currentQualifiedField.some(q => q.id === uma.id);
      
      if (isRacing) {
        // === SAFETY VALVE: SCRATCH IF FATIGUED ===
        // If a horse is qualified but too tired (>60), force them to skip this race.
        // This prevents the "Death Loop" of 100% fatigue during G1 season.
        if ((uma.fatigue || 0) > 60) {
            uma.energy = 100;
            uma.fatigue = 0;
            return { uma, changes: ["Scratched (Fatigue)"] };
        }

        // === RACING LOGIC (BUFFERED) ===
        // Racing now costs significantly less fatigue to survive the G1 gauntlet
        uma.energy = Math.max(0, (uma.energy || 100) - 20); // Was 30
        uma.fatigue = Math.min(100, (uma.fatigue || 0) + 5); // Was 15 -> Now +5
        
        // Lower injury risks significantly
        const riskRoll = Math.random() * 100;
        // Only risky if fatigue is critically high (>85)
        const fatiguePenalty = uma.fatigue > 85 ? 5 : 0; 
        const threshold = 0.5 + fatiguePenalty; // Base risk 0.5%

        if (riskRoll < threshold) {
           uma.injuryWeeks = Math.floor(Math.random() * 3) + 2;
           db.news.add({ 
             year: gameState.year, week: gameState.week, 
             message: `🚑 BREAKDOWN: ${uma.firstName} ${uma.lastName} injured during ${currentEvent?.name}.`, 
             type: 'important' 
           });
        }
        return { uma, changes: [] };

      } else {
        // === RESTING OR TRAINING ===
        // If they are even slightly tired, let them fully recover.
        // Threshold changed from 70 -> 50. Recovery changed from -25 -> Full Reset.
        if ((uma.fatigue || 0) > 50 || (uma.energy || 0) < 50) {
           uma.energy = 100; // Fully Restore Energy
           uma.fatigue = 0;  // Fully Clear Fatigue
           return { uma, changes: ["Full Rest"] };
        } else {
           // Training cost reduced
           uma.energy = Math.max(0, (uma.energy || 100) - 10);
           uma.fatigue = Math.min(100, (uma.fatigue || 0) + 2); // Was +5 -> Now +2
           
           let aiFocus: 'speed' | 'stamina' | 'balanced' = 'balanced';
           if (uma.stats.speed < 600) aiFocus = 'speed';
           else if (uma.stats.stamina < 400) aiFocus = 'stamina';
           return trainUma(uma, aiFocus);
        }
      }
    });

    let currentMoney = gameState.money; 

    if (currentEvent) {
      // FIX: Filter the wrapper 't' FIRST, then map to 't.uma'
      const allActiveHorses = trainingUpdates
        .filter(t => t.uma.injuryWeeks === 0 && !t.changes.includes("Scratched (Fatigue)"))
        .map(t => t.uma);
        
      const qualified = getQualifiedEntrants(allActiveHorses, currentEvent);
      
      // Sort: Best Ratings First
      qualified.sort((a, b) => {
          const statsA = a.stats.speed + a.stats.stamina + a.stats.power + a.stats.guts + a.stats.wisdom;
          const statsB = b.stats.speed + b.stats.stamina + b.stats.power + b.stats.guts + b.stats.wisdom;
          return statsB - statsA; 
      });

      const divisions = createDivisions(qualified);
      const tempQueue: RaceOutcome[] = [];
      const allPastHistory = await db.raceHistory.toArray();

      for (let index = 0; index < divisions.length; index++) {
        const field = divisions[index];
        if (field.length < 2) continue;

        const outcome = simulateRace(field, currentEvent.distance);
        const divName = divisions.length > 1 ? ` (Div ${index + 1})` : "";
        const fullRaceName = currentEvent.name + divName;
        
        (outcome as any).displayName = fullRaceName;
        tempQueue.push(outcome);
        
        if (index === 0) setRaceLocation(currentEvent.location);

        const top3Finishers = outcome.results.slice(0, 3).map(r => ({
            id: r.uma.id,
            name: `${r.uma.firstName} ${r.uma.lastName}`,
            time: r.time
        }));

        for (const res of outcome.results) {
          const trainingEntry = trainingUpdates.find(t => t.uma.id === res.uma.id);
          if (trainingEntry) {
            const uma = trainingEntry.uma;
            if (!uma.history) uma.history = [];
            uma.history.push({ year: gameState.year, week: gameState.week, raceName: fullRaceName, rank: res.rank, time: res.time });
            uma.career.races = uma.history.length;
            uma.career.wins = uma.history.filter(h => h.rank === 1).length;
            uma.career.top3 = uma.history.filter(h => h.rank <= 3).length;

            let prize = 0;
            if (res.rank === 1) prize = currentEvent.purse;
            else if (res.rank === 2) prize = currentEvent.purse * 0.4;
            else if (res.rank === 3) prize = currentEvent.purse * 0.25;

            if (prize > 0) {
              uma.career.earnings += prize;
              if (uma.teamId === 'player') currentMoney += prize;
              const team = await db.teams.get(uma.teamId);
              if (team) {
                await db.teams.update(uma.teamId, { 
                    'history.earnings': (team.history?.earnings || 0) + prize,
                    'history.wins': (team.history?.wins || 0) + (res.rank === 1 ? 1 : 0)
                });
              }
            }

            if (res.rank === 1) {
              const fullName = `${res.uma.firstName} ${res.uma.lastName}`;
              const pastRaces = allPastHistory.filter(r => r.raceName === fullRaceName);
              let isRecordBroken = false;
              if (pastRaces.length > 0) {
                  const bestPastTime = Math.min(...pastRaces.map(r => r.time));
                  if (res.time < bestPastTime) isRecordBroken = true;
              }

              let winStreak = 1;
              for (let i = uma.history.length - 2; i >= 0; i--) {
                  if (uma.history[i].rank === 1) winStreak++;
                  else break;
              }

              if (isRecordBroken) {
                  db.news.add({ year: gameState.year, week: gameState.week, message: `⏱️ COURSE RECORD! ${fullName} at ${fullRaceName}: ${formatTime(res.time)}!`, type: 'important' });
              } else {
                  db.news.add({ year: gameState.year, week: gameState.week, message: `🏆 [${currentEvent.grade}] ${fullName} wins the ${fullRaceName}!`, type: 'info' });
              }
              if (winStreak === 3) db.news.add({ year: gameState.year, week: gameState.week, message: `🔥 HOT STREAK: ${fullName} (3 in a row)`, type: 'info' });
              db.raceHistory.add({ year: gameState.year, week: gameState.week, raceName: fullRaceName, winnerId: res.uma.id, winnerName: fullName, time: res.time, top3: top3Finishers });
            }
          }
        }
      }
      
      if (tempQueue.length > 0 && viewRace) {
          setRaceQueue(tempQueue);
          setCurrentQueueIndex(0);
          setRaceOutcome(tempQueue[0]);
      }
    }

    await db.umas.bulkPut(trainingUpdates.map(t => t.uma));

    let newWeek = gameState.week + 1;
    let newYear = gameState.year;

    if (newWeek > 52) { 
      newWeek = 1; newYear += 1; setIsSimulating(false); 
      const RETIREMENT_AGE = 6;
      const processedRoster = trainingUpdates.map(t => {
        const uma = { ...t.uma };
        uma.age += 1;
        if (uma.status === 'active' && uma.age > RETIREMENT_AGE) uma.status = 'retired';
        return uma;
      });
      await db.umas.bulkPut(processedRoster);
    }
    await db.gameState.update(1, { week: newWeek, year: newYear, money: currentMoney });
  };

  const handleRaceClose = () => {
      const nextIndex = currentQueueIndex + 1;
      if (nextIndex < raceQueue.length) {
          setCurrentQueueIndex(nextIndex);
          setRaceOutcome(raceQueue[nextIndex]);
      } else {
          setRaceOutcome(null);
          setRaceQueue([]);
          setCurrentQueueIndex(0);
      }
  };

  return (
    <div>
      {raceOutcome ? (
        <div style={{ position: 'relative' }}>
            {raceQueue.length > 1 && (
                <div style={{ 
                    position: 'fixed', top: '10px', left: '20px', zIndex: 4000, 
                    color: 'white', backgroundColor: 'rgba(0,0,0,0.7)', 
                    padding: '8px 16px', borderRadius: '4px', fontSize: '14px', 
                    fontWeight: 'bold', border: '1px solid #555' 
                }}>
                    📡 Broadcast {currentQueueIndex + 1} of {raceQueue.length}
                </div>
            )}
            <RaceViewer 
                key={`race-${currentQueueIndex}`}
                outcome={raceOutcome} 
                onClose={handleRaceClose} 
                location={raceLocation as any} 
            />
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', marginBottom: '20px' }}>
           <div style={{ flex: 1 }}>
              <h1 style={{ color: '#2c3e50', margin: '0 0 10px 0' }}>Year {gameState.year} - Week {gameState.week}</h1>
              <div style={{ padding: '20px', backgroundColor: '#e3f2fd', borderLeft: '5px solid #2196f3', borderRadius: '8px', color: '#0d47a1' }}>
                {currentEvent ? (
                  <div>
                    <div style={{fontSize: '12px', fontWeight:'bold', color: '#7f8c8d'}}>NEXT MAIN EVENT</div>
                    <h2 style={{ marginTop: '5px', marginBottom: '5px', fontSize: '24px' }}>
                      <span style={{ backgroundColor: currentEvent.grade === 'G1' ? '#3498db' : '#95a5a6', color: 'white', padding: '2px 8px', borderRadius: '4px', marginRight: '10px', fontSize: '16px', verticalAlign: 'middle' }}>{currentEvent.grade}</span>
                      {currentEvent.name}
                    </h2>
                    <div style={{marginBottom: '10px'}}>📍 {currentEvent.location} • {currentEvent.distance}m</div>
                    <button onClick={() => setShowOdds(!showOdds)} style={{ padding: '6px 12px', fontSize: '12px', backgroundColor: '#9b59b6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginBottom: '10px' }}>
                      {showOdds ? '🙈 Hide Odds' : '🎲 View Field Odds'}
                    </button>
                    {showOdds && (
                      <div style={{ backgroundColor: 'rgba(255,255,255,0.6)', padding: '10px', borderRadius: '8px', marginTop: '5px', maxHeight: '180px', overflowY: 'auto', border: '1px solid #bbdefb' }}>
                        {currentQualifiedField.length > 0 ? currentQualifiedField.slice(0, 12).map(uma => (
                          <div key={uma.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid rgba(0,0,0,0.05)', padding: '4px 0' }}>
                            <span>{uma.firstName} {uma.lastName} {uma.fatigue > 60 ? '💢' : ''}</span>
                            <span style={{ fontWeight: 'bold', color: (uma.energy || 100) < 40 ? '#e67e22' : '#2c3e50' }}>{calculateOdds(uma, currentQualifiedField)}</span>
                          </div>
                        )) : <div>No qualified entrants.</div>}
                      </div>
                    )}
                  </div>
                ) : (
                  <div><h3 style={{ marginTop: 0 }}>💪 Training Week</h3><p>No major races scheduled.</p></div>
                )}
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button onClick={() => advanceWeek(true)} style={{ padding: '12px 24px', fontSize: '16px', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>▶ Play Week</button>
                  <button onClick={() => advanceWeek(false)} style={{ padding: '12px 24px', fontSize: '16px', backgroundColor: '#7f8c8d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>⏭️ Quick Sim</button>
                  <button onClick={() => setIsSimulating(!isSimulating)} style={{ padding: '12px 24px', fontSize: '16px', backgroundColor: isSimulating ? '#e67e22' : '#27ae60', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                    {isSimulating ? '⏸ Pause Sim' : '⏩ Simulate Year'}
                  </button>
                  <button onClick={initLeagueMode} style={{ padding: '12px 24px', fontSize: '16px', backgroundColor: '#34495e', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>🏆 Reset League</button>
                </div>
              </div>
           </div>
           <div style={{ flex: 1, backgroundColor: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', height: '240px', overflowY: 'auto' }}>
              <h3 style={{ marginTop: 0, borderBottom: '2px solid #eee', paddingBottom: '10px', color: '#555' }}>📰 League News</h3>
              {latestNews && latestNews.length > 0 ? (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {latestNews.map(item => (
                    <li key={item.id} style={{ padding: '10px 0', borderBottom: '1px solid #f0f0f0', fontSize: '14px' }}>
                      <span style={{ fontWeight: 'bold', color: '#999', marginRight: '10px' }}>Y{item.year}-W{item.week}</span>
                      <span style={{ color: item.type === 'important' ? '#e67e22' : '#2c3e50' }}>{item.message}</span>
                    </li>
                  ))}
                </ul>
              ) : <p style={{ color: '#ccc' }}>Waiting for history...</p>}
           </div>
        </div>
      )}
    </div>
  );
}