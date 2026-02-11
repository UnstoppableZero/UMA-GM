// src/pages/DevToolsPage.tsx
import React, { useState } from 'react';
import { generateRival } from '../generator';
import { simulateRace, type RaceOutcome } from '../race';
import { RaceViewer } from '../components/RaceViewer';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { trainUma } from '../training';
import { getRaceByWeek, TOTAL_WEEKS } from '../data/calendar';
// NEW IMPORTS FOR REAL MATCHMAKING
import { getQualifiedEntrants, createDivisions } from '../logic/matchmaking';

const TRACKS = ['Tokyo', 'Nakayama', 'Kyoto', 'Hanshin', 'Chukyo', 'Sapporo', 'Niigata', 'Fukushima', 'Kokura', 'Hakodate', 'Ohi'];
const DISTANCES = [1200, 1400, 1600, 1800, 2000, 2200, 2400, 2500, 3000, 3200];

export function DevToolsPage() {
  // --- CALIBRATION STATE ---
  const [selectedTrack, setSelectedTrack] = useState('Tokyo');
  const [selectedDist, setSelectedDist] = useState(2400);
  const [selectedSurface, setSelectedSurface] = useState<'Turf' | 'Dirt'>('Turf'); 
  const [testOutcome, setTestOutcome] = useState<RaceOutcome | null>(null);

  // --- FAST SIM STATE ---
  const gameState = useLiveQuery(() => db.gameState.get(1));
  const [isSimming, setIsSimming] = useState(false);
  const [simProgress, setSimProgress] = useState(0);

  // 1. MAP CALIBRATOR FUNCTION
  const runCalibration = () => {
    const field = Array.from({ length: 18 }).map((_, i) => {
      const horse = generateRival('cpu', 600); 
      horse.firstName = `Test`;
      horse.lastName = `Subject ${i + 1}`;
      const strats = ['runner', 'leader', 'betweener', 'chaser'];
      // @ts-ignore
      horse.aptitude.strategy = { runner: 5, leader: 5, betweener: 5, chaser: 5 };
      // @ts-ignore
      horse.aptitude.strategy[strats[i % 4]] = 10; 
      return horse;
    });

    const outcome = simulateRace(field, selectedDist, selectedSurface);
    setTestOutcome(outcome);
  };

  // 2. FAST SIMULATION FUNCTION
  const fastForward = async (weeksToSim: number) => {
    if (!gameState) return;
    if (!confirm(`⚠️ WARNING: This will simulate ${weeksToSim} weeks purely mathematically. You will miss race views and news popups. Continue?`)) return;

    setIsSimming(true);
    let currentWeek = gameState.week;
    let currentYear = gameState.year;
    let currentMoney = gameState.money;

    const allHorses = await db.umas.toArray();
    let roster = allHorses;

    for (let i = 0; i < weeksToSim; i++) {
      setSimProgress(i + 1);
      
      const trainingUpdates = roster.map(uma => {
         return trainUma(uma, 'balanced').uma;
      });
      roster = trainingUpdates;

      // B. RACE (Using actual matchmaking and divisions)
      const raceEvent = getRaceByWeek(currentWeek);
      if (raceEvent) {
         const actives = roster.filter(u => u.status === 'active');
         const qualified = getQualifiedEntrants(actives, raceEvent);
         const divisions = createDivisions(qualified);

         for (let divIdx = 0; divIdx < divisions.length; divIdx++) {
             const field = divisions[divIdx];
             if (field.length < 2) continue; // Skip empty heats

             const outcome = simulateRace(field, raceEvent.distance, raceEvent.surface || 'Turf');
             const divName = divisions.length > 1 ? ` (Div ${divIdx + 1})` : "";
             
             const winner = outcome.results[0].uma;
             const realWinner = roster.find(u => u.id === winner.id);
             
             if (realWinner) {
                 realWinner.career.wins += 1;
                 realWinner.career.earnings += raceEvent.purse;
                 if (realWinner.teamId === 'player') currentMoney += raceEvent.purse;
                 
                 if (!realWinner.history) realWinner.history = [];
                 realWinner.history.push({
                     year: currentYear, week: currentWeek, 
                     raceName: raceEvent.name + divName, rank: 1, time: outcome.results[0].time
                 });
                 
                // Create the Top 3 Array from the outcome results
                 const top3Finishers = outcome.results.slice(0, 3).map(r => ({
                     id: r.uma.id,
                     name: `${r.uma.firstName} ${r.uma.lastName}`,
                     time: r.time
                 }));

                 await db.raceHistory.add({
                     year: currentYear, week: currentWeek, raceName: raceEvent.name + divName,
                     winnerId: realWinner.id, winnerName: `${realWinner.firstName} ${realWinner.lastName}`,
                     time: outcome.results[0].time,
                     top3: top3Finishers // Pushing the new array to the database!
                 });

                 // PUSH TO LEAGUE NEWS
                 await db.news.add({
                     year: currentYear,
                     week: currentWeek,
                     message: `🏆 [${raceEvent.grade}] ${realWinner.firstName} ${realWinner.lastName} wins the ${raceEvent.name}${divName}!`,
                     type: 'info'
                 });
             }
         }
      }

      currentWeek++;
      if (currentWeek > TOTAL_WEEKS) {
        currentWeek = 1;
        currentYear++;
        roster.forEach(u => {
            u.age++;
            if (u.age > 6) u.status = 'retired';
        });
      }
    }

    await db.umas.bulkPut(roster);
    await db.gameState.update(1, { week: currentWeek, year: currentYear, money: currentMoney });
    
    setIsSimming(false);
    alert(`Simulation of ${weeksToSim} weeks complete!`);
    window.location.reload();
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ borderBottom: '4px solid #7f8c8d', paddingBottom: '10px' }}>🛠️ Developer Tools</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
        
        {/* --- PANEL 1: MAP CALIBRATOR --- */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
          <h2 style={{ marginTop: 0, color: '#e67e22' }}>📍 Map Calibration Lab</h2>
          <p style={{ color: '#7f8c8d', fontSize: '14px' }}>
            Instantly launch the race viewer on any map to test coordinates and animations.
          </p>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Track Location</label>
              <select 
                style={{ width: '100%', padding: '10px' }}
                value={selectedTrack}
                onChange={(e) => setSelectedTrack(e.target.value)}
              >
                {TRACKS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Surface</label>
              <select 
                style={{ width: '100%', padding: '10px' }}
                value={selectedSurface}
                onChange={(e) => setSelectedSurface(e.target.value as 'Turf' | 'Dirt')}
              >
                <option value="Turf">Turf</option>
                <option value="Dirt">Dirt</option>
              </select>
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Distance (m)</label>
              <select 
                style={{ width: '100%', padding: '10px' }}
                value={selectedDist}
                onChange={(e) => setSelectedDist(Number(e.target.value))}
              >
                {DISTANCES.map(d => <option key={d} value={d}>{d}m</option>)}
              </select>
            </div>
          </div>

          <button 
            onClick={runCalibration}
            style={{ width: '100%', padding: '15px', backgroundColor: '#e67e22', color: 'white', border: 'none', borderRadius: '5px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            🧪 Launch Test Race
          </button>
        </div>

        {/* --- PANEL 2: TIME WARP --- */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
          <h2 style={{ marginTop: 0, color: '#2980b9' }}>⏩ Time Warp (Quick Sim)</h2>
          <p style={{ color: '#7f8c8d', fontSize: '14px' }}>
            Advance the calendar rapidly. Useful for skipping to late-season events.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button disabled={isSimming} onClick={() => fastForward(4)} style={simBtnStyle}>
              Sim 1 Month (4 Weeks)
            </button>
            <button disabled={isSimming} onClick={() => fastForward(12)} style={simBtnStyle}>
              Sim 1 Season (12 Weeks)
            </button>
            <button disabled={isSimming} onClick={() => fastForward(52)} style={simBtnStyle}>
              Sim 1 Year (52 Weeks)
            </button>
          </div>

          {isSimming && (
             <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#ecf0f1', borderRadius: '5px', textAlign: 'center' }}>
               ⏳ Simulating week {simProgress}...
             </div>
          )}
        </div>

      </div>

      {/* TEST VIEWER */}
      {testOutcome && (
        <RaceViewer 
          outcome={testOutcome} 
          location={selectedTrack as any} 
          distance={selectedDist}      
          surface={selectedSurface}    
          onClose={() => setTestOutcome(null)} 
        />
      )}
    </div>
  );
}

const simBtnStyle = {
  padding: '12px', backgroundColor: '#3498db', color: 'white', 
  border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold'
};