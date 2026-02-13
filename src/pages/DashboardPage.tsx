// src/pages/DashboardPage.tsx
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { getRacesByWeek } from '../data/calendar';
import { trainUma } from '../training';
import { simulateRace, type RaceOutcome } from '../race';
import { useState, useEffect } from 'react';
import { RaceViewer } from '../components/RaceViewer';
import { generateUma } from '../generator'; 
import { LEAGUE_TEAMS } from '../data/teams'; 
import type { Uma } from '../types';
import { autoAllocateHorses, calculateOdds, calculateRaceRating } from '../logic/matchmaking'; 

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
  const [isSimulating, setIsSimulating] = useState(false);
  
  // NEW: State for Multi-Race Queue
  const [raceQueue, setRaceQueue] = useState<{outcome: RaceOutcome, location: string}[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);

  // Auto-advance simulation
  useEffect(() => {
    let timer: number;
    if (isSimulating && !raceOutcome && raceQueue.length === 0) {
      timer = window.setTimeout(() => {
        advanceWeek(false);
      }, 800);
    }
    return () => clearTimeout(timer);
  }, [isSimulating, raceOutcome, raceQueue, gameState?.week]);

  if (!gameState || !roster) return <div style={{color: 'var(--text-primary)', padding: '20px'}}>Loading...</div>;

  // 1. Get ALL races for this week
  const currentEvents = getRacesByWeek(gameState.week);
  
  // 2. Pre-calculate the allocations for Display
  const allocations = roster.length > 0 ? autoAllocateHorses(roster, currentEvents) : {};

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
    let currentMoney = gameState.money; 
    const raceResults: {outcome: RaceOutcome, location: string}[] = [];

    // A. Run all races mathematically first
    for (const race of currentEvents) {
        const allocation = allocations[race.id];
        if (!allocation || allocation.field.length < 2) continue;

        const outcome = simulateRace(allocation.field, race.distance);
        (outcome as any).displayName = race.name;
        
        raceResults.push({ outcome, location: race.location });

        // Process Results
        const top3Finishers = outcome.results.slice(0, 3).map(r => ({
            id: r.uma.id, name: `${r.uma.firstName} ${r.uma.lastName}`, time: r.time
        }));

        for (const res of outcome.results) {
            const umaIndex = roster.findIndex(u => u.id === res.uma.id);
            if (umaIndex === -1) continue;
            const uma = roster[umaIndex];

            if (!uma.history) uma.history = [];
            uma.history.push({ year: gameState.year, week: gameState.week, raceName: race.name, rank: res.rank, time: res.time });
            uma.career.races = (uma.career.races || 0) + 1;
            if (res.rank === 1) uma.career.wins = (uma.career.wins || 0) + 1;
            if (res.rank <= 3) uma.career.top3 = (uma.career.top3 || 0) + 1;

            // Prize Money
            let prize = 0;
            if (res.rank === 1) prize = race.purse;
            else if (res.rank === 2) prize = race.purse * 0.4;
            else if (res.rank === 3) prize = race.purse * 0.25;

            if (prize > 0) {
                uma.career.earnings += prize;
                if (uma.teamId === 'player') currentMoney += prize;
                // Note: Team update skipped for brevity, can add back if needed
            }

            // News & History
            if (res.rank === 1) {
                const fullName = `${uma.firstName} ${uma.lastName}`;
                db.news.add({ year: gameState.year, week: gameState.week, message: `🏆 [${race.grade}] ${fullName} wins the ${race.name}!`, type: 'info' });
                db.raceHistory.add({ year: gameState.year, week: gameState.week, raceName: race.name, winnerId: uma.id, winnerName: fullName, time: res.time, top3: top3Finishers });
            }
            
            // Fatigue from racing
            uma.energy = Math.max(0, (uma.energy || 100) - 25);
            uma.fatigue = Math.min(100, (uma.fatigue || 0) + 10);
        }

        // DNQ Messages
        const myExcluded = allocation.excluded.filter(u => u.teamId === 'player');
        if (myExcluded.length > 0) {
             const names = myExcluded.map(u => u.lastName).join(", ");
             db.news.add({ year: gameState.year, week: gameState.week, message: `⚠️ DNQ: ${names} failed to qualify for ${race.name}.`, type: 'important' });
        }
    }

    // B. Train everyone else
    const racedIds = new Set(Object.values(allocations).flatMap(a => a.field.map(u => u.id)));
    
    roster.forEach(uma => {
        if (!racedIds.has(uma.id)) {
            if (uma.injuryWeeks > 0) {
                uma.injuryWeeks--;
                uma.energy = 100;
            } else if ((uma.fatigue || 0) > 50) {
                uma.energy = 100; uma.fatigue = 0; // Rest
            } else {
                // Train
                uma.energy = Math.max(0, (uma.energy || 100) - 10);
                const trainRes = trainUma(uma, 'balanced');
                // stats updated in place by reference
            }
        }
    });

    await db.umas.bulkPut(roster);

    // C. Queue Viewing
    if (viewRace && raceResults.length > 0) {
        setRaceQueue(raceResults);
        setQueueIndex(0);
        setRaceOutcome(raceResults[0].outcome);
        // Note: Location needs to be handled in the render
    } else {
        // Advance Time
        let newWeek = gameState.week + 1;
        let newYear = gameState.year;
        if (newWeek > 52) { 
            newWeek = 1; newYear++; setIsSimulating(false);
            // Retirement logic here
        }
        await db.gameState.update(1, { week: newWeek, year: newYear, money: currentMoney });
    }
  };

  const handleRaceClose = () => {
      const nextIndex = queueIndex + 1;
      if (nextIndex < raceQueue.length) {
          setQueueIndex(nextIndex);
          setRaceOutcome(raceQueue[nextIndex].outcome);
      } else {
          setRaceOutcome(null);
          setRaceQueue([]);
          // NOW advance time
          let newWeek = gameState.week + 1;
          let newYear = gameState.year;
          if (newWeek > 52) { newWeek = 1; newYear++; setIsSimulating(false); }
          db.gameState.update(1, { week: newWeek, year: newYear }); // Money already saved
      }
  };

  return (
    <div>
      {raceOutcome ? (
        <div style={{ position: 'relative' }}>
            <div style={{ position: 'fixed', top: 10, left: 20, zIndex: 4000, color: 'white', background: 'rgba(0,0,0,0.8)', padding: '5px 10px', borderRadius: 4 }}>
                📡 Broadcasting Race {queueIndex + 1} of {raceQueue.length}
            </div>
            <RaceViewer 
                outcome={raceOutcome} 
                onClose={handleRaceClose} 
                location={raceQueue[queueIndex].location as any} 
            />
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', marginBottom: '20px' }}>
           <div style={{ flex: 1 }}>
              <h1 style={{ color: 'var(--text-primary)', margin: '0 0 10px 0' }}>Year {gameState.year} - Week {gameState.week}</h1>
              
              {/* RACE CARDS CONTAINER */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {currentEvents.length > 0 ? currentEvents.map(race => {
                    const allocation = allocations[race.id];
                    const field = allocation ? allocation.field : [];
                    const excluded = allocation ? allocation.excluded : [];

                    return (
                        <div key={race.id} style={{ padding: '15px', backgroundColor: 'var(--bg-surface)', borderLeft: `5px solid ${race.grade === 'G1' ? '#3498db' : '#2ecc71'}`, borderRadius: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <span style={{ backgroundColor: race.grade === 'G1' ? '#3498db' : (race.grade === 'G2' ? '#e67e22' : '#27ae60'), color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', marginRight: '8px' }}>
                                        {race.grade}
                                    </span>
                                    <span style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{race.name}</span>
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                        {race.location} • {race.surface} {race.distance}m • {field.length} Runners
                                    </div>
                                </div>
                                {excluded.length > 0 && (
                                    <div style={{ fontSize: '12px', color: '#e74c3c', fontWeight: 'bold' }}>
                                        ⚠️ {excluded.length} Cut
                                    </div>
                                )}
                            </div>
                            {/* MINI FIELD PREVIEW */}
                            <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                <strong>Top Contender:</strong> {field.length > 0 ? `${field[0].lastName} (${calculateRaceRating(field[0], race)})` : 'None'}
                            </div>
                        </div>
                    );
                }) : (
                    <div style={{ padding: '20px', backgroundColor: 'var(--bg-surface)', borderRadius: '8px', color: 'var(--text-secondary)' }}>
                        😴 No races scheduled. Heavy training week.
                    </div>
                )}
              </div>

              {/* ACTION BAR */}
              <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                  <button onClick={() => advanceWeek(true)} style={{ padding: '12px 24px', fontSize: '16px', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                      ▶ Run Race Day
                  </button>
                  <button onClick={() => advanceWeek(false)} style={{ padding: '12px 24px', fontSize: '16px', backgroundColor: '#7f8c8d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                      ⏭️ Quick Sim
                  </button>
                  <button onClick={initLeagueMode} style={{ padding: '12px 24px', fontSize: '16px', backgroundColor: '#34495e', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                      🏆 Reset League
                  </button>
              </div>
           </div>

           {/* NEWS PANEL */}
           <div style={{ width: '300px', backgroundColor: 'var(--bg-surface)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-default)', height: '500px', overflowY: 'auto' }}>
              <h3 style={{ marginTop: 0, borderBottom: '2px solid var(--border-default)', paddingBottom: '10px', color: 'var(--text-secondary)' }}>📰 League News</h3>
              {latestNews && latestNews.length > 0 ? (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {latestNews.map(item => (
                    <li key={item.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '13px' }}>
                      <span style={{ fontWeight: 'bold', color: 'var(--text-muted)', marginRight: '8px' }}>W{item.week}</span>
                      <span style={{ color: item.type === 'important' ? '#e67e22' : 'var(--text-primary)' }}>{item.message}</span>
                    </li>
                  ))}
                </ul>
              ) : <p style={{ color: 'var(--text-muted)' }}>Waiting for history...</p>}
           </div>
        </div>
      )}
    </div>
  );
}