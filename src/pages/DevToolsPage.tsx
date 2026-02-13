import React, { useState } from 'react';
import { generateRival } from '../generator';
import { simulateRace, type RaceOutcome } from '../race';
import { RaceViewer } from '../components/RaceViewer';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { trainUma } from '../training';
import { getRaceByWeek, TOTAL_WEEKS } from '../data/calendar';
import { getQualifiedEntrants, createOfficialField } from '../logic/matchmaking';

const TRACKS = ['Tokyo', 'Nakayama', 'Kyoto', 'Hanshin', 'Chukyo', 'Sapporo', 'Niigata', 'Fukushima', 'Kokura', 'Hakodate', 'Ohi'];
const DISTANCES = [1200, 1400, 1600, 1800, 2000, 2200, 2400, 2500, 3000, 3200];

export function DevToolsPage() {
  const [selectedTrack, setSelectedTrack] = useState('Tokyo');
  const [selectedDist, setSelectedDist] = useState(2400);
  const [selectedSurface, setSelectedSurface] = useState<'Turf' | 'Dirt'>('Turf'); 
  const [testOutcome, setTestOutcome] = useState<RaceOutcome | null>(null);

  const gameState = useLiveQuery(() => db.gameState.get(1));
  const [isSimming, setIsSimming] = useState(false);
  const [simProgress, setSimProgress] = useState(0);

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

  const fastForward = async (weeksToSim: number) => {
    if (!gameState) return;
    if (!confirm(`⚠️ WARNING: This will simulate ${weeksToSim} weeks purely mathematically. Continue?`)) return;

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

      const raceEvent = getRaceByWeek(currentWeek);
      if (raceEvent) {
          const actives = roster.filter(u => u.status === 'active');
          const qualified = getQualifiedEntrants(actives, raceEvent);
          
          // FIX: Added raceEvent as the second argument
          const { field } = createOfficialField(qualified, raceEvent);

          if (field.length >= 2) {
              const outcome = simulateRace(field, raceEvent.distance, raceEvent.surface || 'Turf');
              
              const winner = outcome.results[0].uma;
              const realWinner = roster.find(u => u.id === winner.id);
              
              if (realWinner) {
                  realWinner.career.wins += 1;
                  realWinner.career.earnings += raceEvent.purse;
                  if (realWinner.teamId === 'player') currentMoney += raceEvent.purse;
                  
                  if (!realWinner.history) realWinner.history = [];
                  realWinner.history.push({
                      year: currentYear, week: currentWeek, 
                      raceName: raceEvent.name, rank: 1, time: outcome.results[0].time
                  });
                  
                  const top3Finishers = outcome.results.slice(0, 3).map(r => ({
                      id: r.uma.id,
                      name: `${r.uma.firstName} ${r.uma.lastName}`,
                      time: r.time
                  }));

                  await db.raceHistory.add({
                      year: currentYear, week: currentWeek, raceName: raceEvent.name,
                      winnerId: realWinner.id, winnerName: `${realWinner.firstName} ${realWinner.lastName}`,
                      time: outcome.results[0].time,
                      top3: top3Finishers 
                  });

                  await db.news.add({
                      year: currentYear,
                      week: currentWeek,
                      message: `🏆 [${raceEvent.grade}] ${realWinner.firstName} ${realWinner.lastName} wins the ${raceEvent.name}!`,
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
    alert(`Simulation complete!`);
    window.location.reload();
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ borderBottom: '4px solid #7f8c8d', paddingBottom: '10px', color: '#e0e0e0' }}>🛠️ Developer Tools</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
        <div style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '10px', border: '1px solid #333' }}>
          <h2 style={{ marginTop: 0, color: '#e67e22' }}>📍 Map Calibration Lab</h2>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#bdc3c7' }}>Track Location</label>
              <select style={{ width: '100%', padding: '10px', backgroundColor: '#333', color: 'white', border: '1px solid #555' }} value={selectedTrack} onChange={(e) => setSelectedTrack(e.target.value)}>
                {TRACKS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#bdc3c7' }}>Surface</label>
              <select style={{ width: '100%', padding: '10px', backgroundColor: '#333', color: 'white', border: '1px solid #555' }} value={selectedSurface} onChange={(e) => setSelectedSurface(e.target.value as 'Turf' | 'Dirt')}>
                <option value="Turf">Turf</option>
                <option value="Dirt">Dirt</option>
              </select>
            </div>
          </div>
          <button onClick={runCalibration} style={{ width: '100%', padding: '15px', backgroundColor: '#e67e22', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>🧪 Launch Test Race</button>
        </div>

        <div style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '10px', border: '1px solid #333' }}>
          <h2 style={{ marginTop: 0, color: '#2980b9' }}>⏩ Time Warp (Quick Sim)</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button disabled={isSimming} onClick={() => fastForward(4)} style={simBtnStyle}>Sim 1 Month</button>
            <button disabled={isSimming} onClick={() => fastForward(52)} style={simBtnStyle}>Sim 1 Year</button>
          </div>
          {isSimming && <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#2c3e50', color: 'white', borderRadius: '5px', textAlign: 'center' }}>⏳ Simulating week {simProgress}...</div>}
        </div>
      </div>

      {testOutcome && (
        <RaceViewer outcome={testOutcome} location={selectedTrack as any} 
          // @ts-ignore
          distance={selectedDist} surface={selectedSurface} onClose={() => setTestOutcome(null)} />
      )}
    </div>
  );
}

const simBtnStyle = { padding: '12px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' };