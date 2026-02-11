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
import { getQualifiedEntrants, createDivisions } from '../logic/matchmaking'; 

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

  useEffect(() => {
    let timer: number;
    if (isSimulating && !raceOutcome) {
      timer = window.setTimeout(() => {
        advanceWeek();
      }, 800);
    }
    return () => clearTimeout(timer);
  }, [isSimulating, raceOutcome, gameState?.week]);

  if (!gameState || !roster) return <div>Loading...</div>;

  const currentEvent = getRaceByWeek(gameState.week);

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
        newRoster.push(horse);
      }
    }
    await db.umas.bulkAdd(newRoster);
    alert("🏆 League Initialized with 10-Horse Rosters!");
    window.location.reload();
  };

  const advanceWeek = async () => {
    const trainingUpdates = roster.map(uma => {
      let aiFocus: 'speed' | 'stamina' | 'balanced' = 'balanced';
      if (uma.stats.speed < 600) aiFocus = 'speed';
      else if (uma.stats.stamina < 400) aiFocus = 'stamina';
      return trainUma(uma, aiFocus);
    });

    let currentMoney = gameState.money; 

    if (currentEvent) {
      const allActiveHorses = trainingUpdates.map(t => t.uma);
      const qualified = getQualifiedEntrants(allActiveHorses, currentEvent);
      const divisions = createDivisions(qualified);

      let mainEventOutcome: RaceOutcome | null = null;
      const allPastHistory = await db.raceHistory.toArray();

      for (let index = 0; index < divisions.length; index++) {
        const field = divisions[index];
        if (field.length < 2) continue;

        const outcome = simulateRace(field, currentEvent.distance);
        const divName = divisions.length > 1 ? ` (Div ${index + 1})` : "";
        const fullRaceName = currentEvent.name + divName;
        
        if (index === 0) {
            mainEventOutcome = outcome;
            // @ts-ignore
            setRaceLocation(currentEvent.location);
        }

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
            uma.history.push({
              year: gameState.year, week: gameState.week, raceName: fullRaceName, rank: res.rank, time: res.time
            });

            // CRITICAL FIX: Career stats derived from History Log to prevent phantom increments
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
                  db.news.add({
                      year: gameState.year, week: gameState.week,
                      message: `⏱️ COURSE RECORD! ${fullName} shatters the ${fullRaceName} record with a time of ${formatTime(res.time)}!`,
                      type: 'important' 
                  });
              } else {
                  db.news.add({
                      year: gameState.year, week: gameState.week,
                      message: `🏆 [${currentEvent.grade}] ${fullName} wins the ${fullRaceName}!`,
                      type: 'info'
                  });
              }

              if (winStreak === 3) db.news.add({ year: gameState.year, week: gameState.week, message: `🔥 HOT STREAK: ${fullName} has won 3 races in a row!`, type: 'info' });
              else if (winStreak === 5) db.news.add({ year: gameState.year, week: gameState.week, message: `🔥🔥 UNSTOPPABLE: ${fullName} secures their 5th consecutive victory!`, type: 'important' });
              else if (winStreak >= 7) db.news.add({ year: gameState.year, week: gameState.week, message: `👑 HISTORIC RUN: ${fullName} extends their legendary win streak to ${winStreak} in a row!`, type: 'important' });

              db.raceHistory.add({
                year: gameState.year, week: gameState.week, raceName: fullRaceName,
                winnerId: res.uma.id, winnerName: fullName, time: res.time, top3: top3Finishers 
              });
            }
          }
        }
      }
      if (mainEventOutcome) setRaceOutcome(mainEventOutcome);
    } else {
      setRaceOutcome(null);
    }

    await db.umas.bulkPut(trainingUpdates.map(t => t.uma));

    let newWeek = gameState.week + 1;
    let newYear = gameState.year;

    if (newWeek > 52) { 
      const allHistory = await db.raceHistory.toArray();
      const currentYearRaces = allHistory.filter(h => h.year === gameState.year);
      
      const g1Winners: Record<string, number> = {};
      currentYearRaces.forEach(race => {
          const baseName = race.raceName.split(' (Div')[0];
          const calEntry = FULL_CALENDAR.find(c => c.name === baseName);
          if (calEntry?.grade === 'G1') {
              g1Winners[race.winnerName] = (g1Winners[race.winnerName] || 0) + 1;
          }
      });

      let hoty = { name: "None", wins: 0 };
      for (const [name, wins] of Object.entries(g1Winners)) {
          if (wins > hoty.wins) { hoty = { name, wins }; }
      }

      const allTeams = await db.teams.toArray();
      const leadingStable = [...allTeams].sort((a, b) => (b.history?.earnings || 0) - (a.history?.earnings || 0))[0];

      if (hoty.wins > 0) {
          db.news.add({
              year: gameState.year, week: 52,
              message: `🌟 AWARDS: ${hoty.name} is crowned Horse of the Year with ${hoty.wins} G1 wins!`,
              type: 'important'
          });
      }
      
      db.news.add({
          year: gameState.year, week: 52,
          message: `🚩 STABLE CHAMPION: ${leadingStable.name} finishes Year ${gameState.year} at the top of the earnings table!`,
          type: 'info'
      });

      newWeek = 1;
      newYear += 1;
      setIsSimulating(false); 

      const RETIREMENT_AGE = 6;
      const retiringNames: string[] = [];
      
      const processedRoster = trainingUpdates.map(t => {
        const uma = { ...t.uma };
        uma.age += 1;
        if (uma.status === 'active' && uma.age > RETIREMENT_AGE) {
            uma.status = 'retired';
            retiringNames.push(`${uma.firstName} ${uma.lastName}`);
        }
        return uma;
      });
      await db.umas.bulkPut(processedRoster);

      if (retiringNames.length > 0) {
        db.news.add({ year: newYear, week: 1, message: `🌅 Retirements: ${retiringNames.length} legends have left the track.`, type: 'retirement' });
      }

      const newRookies: Uma[] = [];
      const activeHorses = processedRoster.filter(u => u.status === 'active');

      for (const team of allTeams) {
        const teamHorses = activeHorses.filter(u => u.teamId === team.id).length;
        if (teamHorses < 10) {
            const needed = 10 - teamHorses;
            for (let i = 0; i < needed; i++) {
                const buff = (team.prestige - 50) * 2;
                const rookie = generateRival(team.id, 400 + buff);
                rookie.age = 2; 
                newRookies.push(rookie);
            }
        }
      }
      if (newRookies.length > 0) await db.umas.bulkAdd(newRookies);
    }
    await db.gameState.update(1, { week: newWeek, year: newYear, money: currentMoney });
  };

  return (
    <div>
      {raceOutcome ? (
        <RaceViewer outcome={raceOutcome} onClose={() => setRaceOutcome(null)} location={raceLocation as any} />
      ) : (
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', marginBottom: '20px' }}>
           <div style={{ flex: 1 }}>
              <h1 style={{ color: '#2c3e50', margin: '0 0 10px 0' }}>Year {gameState.year} - Week {gameState.week}</h1>
              <div style={{ padding: '20px', backgroundColor: '#e3f2fd', borderLeft: '5px solid #2196f3', borderRadius: '8px', color: '#0d47a1' }}>
                {currentEvent ? (
                  <div>
                    <div style={{fontSize: '12px', fontWeight:'bold', color: '#7f8c8d'}}>THIS WEEK'S MAIN EVENT</div>
                    <h2 style={{ marginTop: '5px', marginBottom: '5px', fontSize: '24px' }}>
                      <span style={{ backgroundColor: currentEvent.grade === 'G1' ? '#3498db' : '#95a5a6', color: 'white', padding: '2px 8px', borderRadius: '4px', marginRight: '10px', fontSize: '16px', verticalAlign: 'middle' }}>{currentEvent.grade}</span>
                      {currentEvent.name}
                    </h2>
                    <div style={{marginBottom: '15px'}}>📍 {currentEvent.location} • {currentEvent.distance}m • 💰 ${currentEvent.purse.toLocaleString()}</div>
                  </div>
                ) : (
                  <div><h3 style={{ marginTop: 0 }}>💪 Training Week</h3><p>No major races scheduled.</p></div>
                )}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={advanceWeek} style={{ marginTop: '10px', padding: '12px 24px', fontSize: '16px', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>▶ Play Week</button>
                  <button onClick={() => setIsSimulating(!isSimulating)} style={{ marginTop: '10px', padding: '12px 24px', fontSize: '16px', backgroundColor: isSimulating ? '#e67e22' : '#27ae60', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                    {isSimulating ? '⏸ Pause Sim' : '⏩ Simulate Year'}
                  </button>
                  <button onClick={initLeagueMode} style={{ marginTop: '10px', padding: '12px 24px', fontSize: '16px', backgroundColor: '#34495e', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>🏆 Reset League</button>
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
                      <span style={{ color: item.type === 'important' ? '#e67e22' : item.type === 'retirement' ? '#7f8c8d' : '#2c3e50', fontWeight: item.type === 'important' ? 'bold' : 'normal' }}>{item.message}</span>
                    </li>
                  ))}
                </ul>
              ) : <p style={{ color: '#ccc' }}>Waiting for history to be written...</p>}
           </div>
        </div>
      )}
    </div>
  );
}