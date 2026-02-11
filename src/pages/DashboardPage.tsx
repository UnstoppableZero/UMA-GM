// src/pages/DashboardPage.tsx
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { FULL_CALENDAR, TOTAL_WEEKS, getRaceByWeek } from '../data/calendar';
import { trainUma } from '../training';
import { simulateRace, type RaceOutcome } from '../race';
import { useState } from 'react';
import { RaceViewer } from '../components/RaceViewer';
import { generateRival, generateUma } from '../generator'; 
import { ROSTER_1988 } from '../data/roster1988';
import { LEAGUE_TEAMS } from '../data/teams'; 
import type { Uma } from '../types';
// CHANGED IMPORTS
import { getQualifiedEntrants, createDivisions } from '../logic/matchmaking'; 

export function DashboardPage() {
  const gameState = useLiveQuery(() => db.gameState.get(1));
  const roster = useLiveQuery(() => db.umas.toArray());
  const latestNews = useLiveQuery(() => db.news.reverse().limit(5).toArray());
  
  const [raceOutcome, setRaceOutcome] = useState<RaceOutcome | null>(null);
  const [raceLocation, setRaceLocation] = useState<string | undefined>(undefined);

  if (!gameState || !roster) return <div>Loading...</div>;

  const currentEvent = getRaceByWeek(gameState.week);

  // ... (Init Functions: initLeagueMode, load1988Scenario remain EXACTLY THE SAME) ...
  // ... (Paste them here or keep them as is) ...

  const initLeagueMode = async () => {
    // ... (Keep existing code) ...
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
      for (let i = 0; i < 5; i++) {
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
    alert("🏆 League Initialized!");
    window.location.reload();
  };

  const load1988Scenario = async () => {
     // ... (Keep existing code) ...
     if (!confirm("⚠️ Wipe save?")) return;
     // ...
     window.location.reload(); 
  };


  // ---------------------------------------------------------
  // GAME LOOP (UPDATED FOR HEATS)
  // ---------------------------------------------------------
  const advanceWeek = async () => {
    // 1. AI TRAINING
    const trainingUpdates = roster.map(uma => {
      let aiFocus: 'speed' | 'stamina' | 'balanced' = 'balanced';
      if (uma.stats.speed < 600) aiFocus = 'speed';
      else if (uma.stats.stamina < 400) aiFocus = 'stamina';
      return trainUma(uma, aiFocus);
    });

    let currentMoney = gameState.money; 

    // 2. RACE LOGIC (MULTI-HEAT)
    if (currentEvent) {
      const allActiveHorses = trainingUpdates.map(t => t.uma);
      
      // A. Get EVERYONE who wants to run
      const qualified = getQualifiedEntrants(allActiveHorses, currentEvent);
      
      // B. Split into Divisions (Heats)
      const divisions = createDivisions(qualified);

      // C. Run Each Division
      // We only show the RaceViewer for Division 1 (The "Main Event") for now
      // But we process results for ALL divisions.
      let mainEventOutcome: RaceOutcome | null = null;

      divisions.forEach((field, index) => {
        if (field.length < 2) return; // Skip empty/solo heats

        const outcome = simulateRace(field, currentEvent.distance);
        const divName = divisions.length > 1 ? ` (Div ${index + 1})` : "";
        
        // Save the first division to show the player
        if (index === 0) {
            mainEventOutcome = outcome;
            // @ts-ignore
            setRaceLocation(currentEvent.location);
        }

        outcome.results.forEach(res => {
          const uma = trainingUpdates.find(t => t.uma.id === res.uma.id)?.uma;
          if (uma) {
            uma.career.races += 1;
            if (res.rank === 1) uma.career.wins += 1;
            if (res.rank <= 3) uma.career.top3 += 1;

            let prize = 0;
            if (res.rank === 1) prize = currentEvent.purse;
            else if (res.rank === 2) prize = currentEvent.purse * 0.4;
            else if (res.rank === 3) prize = currentEvent.purse * 0.25;

            if (prize > 0) {
              uma.career.earnings += prize;
              if (uma.teamId === 'player') currentMoney += prize;
            }

            // News & History for Winner
            if (res.rank === 1) {
              db.news.add({
                year: gameState.year,
                week: gameState.week,
                message: `🏆 [${currentEvent.grade}] ${uma.firstName} ${uma.lastName} wins the ${currentEvent.name}${divName}!`,
                type: 'info'
              });

              db.raceHistory.add({
                year: gameState.year,
                week: gameState.week,
                raceName: currentEvent.name + divName, // Unique Name per Heat
                winnerId: res.uma.id,
                winnerName: `${res.uma.firstName} ${res.uma.lastName}`,
                time: res.time
              });

              // Triple Crown Logic (Only counts for Div 1 to prevent cheese?)
              // For now, let's allow any division to count (it's simpler)
              if (currentEvent.grade === 'G1') {
                 // ... (Triple crown logic logic) ...
              }
            }
            
            // History Log
            if (!uma.history) uma.history = [];
            uma.history.push({
              year: gameState.year,
              week: gameState.week,
              raceName: currentEvent.name + divName,
              rank: res.rank,
              time: res.time
            });
          }
        });
      });

      // Show the main event
      if (mainEventOutcome) setRaceOutcome(mainEventOutcome);
      
    } else {
      setRaceOutcome(null);
    }

    await db.umas.bulkPut(trainingUpdates.map(t => t.uma));

    // TIME ADVANCEMENT
    let newWeek = gameState.week + 1;
    let newYear = gameState.year;

    if (newWeek > TOTAL_WEEKS) {
      newWeek = 1;
      newYear += 1;
      // ... Retirement Logic (Keep existing) ...
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
        db.news.add({ year: newYear, week: 1, message: `🌅 Retirements: ${retiringNames.join(", ")}`, type: 'retirement' });
      }
    }

    await db.gameState.update(1, { week: newWeek, year: newYear, money: currentMoney });
  };

  return (
    <div>
      {/* RACE MODAL */}
      {raceOutcome ? (
        <RaceViewer 
          outcome={raceOutcome} 
          onClose={() => setRaceOutcome(null)} 
          location={raceLocation as any} 
        />
      ) : (
        // DASHBOARD (Keep existing UI)
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', marginBottom: '20px' }}>
           {/* ... Keep the exact same UI code as before ... */}
           {/* Copy/Paste your existing Dashboard UI return here */}
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
                    <div style={{marginBottom: '15px'}}>📍 {currentEvent.location} • 📏 {currentEvent.distance}m • 💰 ${currentEvent.purse.toLocaleString()}</div>
                  </div>
                ) : (
                  <div><h3 style={{ marginTop: 0 }}>💪 Training Week</h3><p>No major races scheduled.</p></div>
                )}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={advanceWeek} style={{ marginTop: '10px', padding: '12px 24px', fontSize: '16px', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>▶ Play Next Week</button>
                  <button onClick={initLeagueMode} style={{ marginTop: '10px', padding: '12px 24px', fontSize: '16px', backgroundColor: '#34495e', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>🏆 Init League Mode</button>
                  <button onClick={load1988Scenario} style={{ marginTop: '10px', padding: '12px 24px', fontSize: '16px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>📜 Load 1988 Era</button>
                </div>
              </div>
           </div>
           <div style={{ flex: 1, backgroundColor: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', height: '200px', overflowY: 'auto' }}>
              <h3 style={{ marginTop: 0, borderBottom: '2px solid #eee', paddingBottom: '10px', color: '#555' }}>📰 League News</h3>
              {latestNews && latestNews.length > 0 ? (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {latestNews.map(item => (
                    <li key={item.id} style={{ padding: '10px 0', borderBottom: '1px solid #f0f0f0', fontSize: '14px' }}>
                      <span style={{ fontWeight: 'bold', color: '#999', marginRight: '10px' }}>Y{item.year}-W{item.week}</span>
                      <span style={{ color: item.type === 'important' ? '#d35400' : item.type === 'retirement' ? '#7f8c8d' : '#2c3e50', fontWeight: item.type === 'important' ? 'bold' : 'normal' }}>{item.message}</span>
                    </li>
                  ))}
                </ul>
              ) : <p style={{ color: '#ccc' }}>No news yet...</p>}
           </div>
        </div>
      )}
    </div>
  );
}