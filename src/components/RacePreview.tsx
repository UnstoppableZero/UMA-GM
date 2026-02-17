import React, { useState, useMemo, useEffect } from 'react';
import { getRacesByWeek, type RaceEvent } from '../data/calendar';
import { db } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { autoAllocateHorses, calculateOdds, calculateRaceRating } from '../logic/matchmaking';

interface Props {
  race: RaceEvent; // The race initially clicked
  onClose: () => void;
  onRun?: () => void;
}

export function RacePreview({ race: initialRace, onClose, onRun }: Props) {
  // State to switch between races in the same week
  const [activeRace, setActiveRace] = useState(initialRace);

  // Sync state if the parent passes a new race prop (e.g. week changed)
  useEffect(() => {
    setActiveRace(initialRace);
  }, [initialRace.id]);

  const allHorses = useLiveQuery(async () => {
    return await db.umas.toArray();
  });

  const teams = useLiveQuery(() => db.teams.toArray());
  const gameState = useLiveQuery(() => db.gameState.get(1));

  // 1. Get ALL races for the current week context
  const weeklyRaces = useMemo(() => getRacesByWeek(activeRace.week), [activeRace.week]);

  // 2. CHECK FOR PAST RESULTS (The "Leaderboard" Logic)
  const pastResults = useMemo(() => {
    if (!allHorses || !gameState) return [];
    
    // Find all horses that have a history record for this specific race & year
    const participants = allHorses.map(uma => {
      const record = uma.history.find(h => 
        h.raceName === activeRace.name && 
        h.year === gameState.year
      );
      if (record) {
        return { uma, record };
      }
      return null;
    }).filter((item): item is NonNullable<typeof item> => item !== null);

    // Sort by Rank (1st, 2nd, 3rd...)
    return participants.sort((a, b) => a.record.rank - b.record.rank);
  }, [allHorses, activeRace, gameState]);

  const hasRun = pastResults.length > 0;

  // 3. Run the "Smart Allocation" logic globally for the week (ONLY IF NOT RUN YET)
  const allocations = useMemo(() => {
    if (hasRun || !allHorses || allHorses.length === 0) return {};
    
    const currentYear = gameState?.year || 1;
    return autoAllocateHorses(allHorses, weeklyRaces, activeRace.week, currentYear);

  }, [allHorses, weeklyRaces, activeRace.week, gameState, hasRun]);

  if (!allHorses || !teams) return null;

  // 4. Extract data for the CURRENTLY selected tab
  const { field, excluded } = allocations[activeRace.id] || { field: [], excluded: [] };

  return (
    <div style={modalOverlay}>
      <div style={modalContent}>
        
        {/* --- TABS TO SWITCH RACES --- */}
        {weeklyRaces.length > 1 && (
            <div style={{ display: 'flex', backgroundColor: '#34495e', padding: '10px 10px 0 10px', gap: '5px', overflowX: 'auto', borderBottom: '1px solid #2c3e50' }}>
                {weeklyRaces.map(r => {
                    const isActive = r.id === activeRace.id;
                    // If ran, show "Done", else show count
                    // We need to calculate 'hasRun' for each tab individually to show the count correctly, 
                    // but for simplicity, we'll just show the active count or a generic indicator.
                    const tabRunnerCount = (allocations[r.id]?.field?.length || 0);
                    
                    return (
                        <button 
                            key={r.id}
                            onClick={() => setActiveRace(r)}
                            style={{
                                padding: '10px 20px',
                                border: 'none',
                                borderRadius: '8px 8px 0 0',
                                backgroundColor: isActive ? '#2c3e50' : '#455a64',
                                color: isActive ? '#f1c40f' : '#bdc3c7',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '13px',
                                transition: 'all 0.2s',
                                boxShadow: isActive ? '0 -2px 5px rgba(0,0,0,0.1)' : 'none'
                            }}
                        >
                            {r.grade} {r.name}
                        </button>
                    );
                })}
            </div>
        )}

        {/* --- HEADER --- */}
        <div style={{ backgroundColor: '#2c3e50', color: 'white', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>
                {activeRace.location} • {activeRace.distance}m • {activeRace.surface}
            </div>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                {activeRace.name}
                {hasRun && <span style={{ fontSize: '14px', backgroundColor: '#f1c40f', color: '#333', padding: '2px 8px', borderRadius: '4px' }}>🏆 FINAL RESULTS</span>}
            </h2>
            {!hasRun && excluded.length > 0 && (
               <div style={{ fontSize: '12px', color: '#e74c3c', marginTop: '5px', fontWeight: 'bold' }}>
                 ⚠️ {excluded.length} horses failed to qualify (Rating Cut).
               </div>
            )}
          </div>
          <div style={{ backgroundColor: activeRace.grade === 'G1' ? '#3498db' : '#2ecc71', padding: '5px 10px', borderRadius: '4px', fontWeight: 'bold' }}>
            {activeRace.grade}
          </div>
        </div>

        {/* --- CONTENT AREA (SWITCH BETWEEN RESULTS OR ENTRY LIST) --- */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f8f9fa', color: '#7f8c8d', fontSize: '12px', position: 'sticky', top: 0 }}>
              <tr>
                <th style={{ padding: '10px', textAlign: 'left' }}>#</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Horse</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Team</th>
                
                {/* Dynamic Columns based on State */}
                {hasRun ? (
                    <th style={{ padding: '10px', textAlign: 'right' }}>Finish Time</th>
                ) : (
                    <>
                        <th style={{ padding: '10px', textAlign: 'center' }}>Rating</th>
                        <th style={{ padding: '10px', textAlign: 'right' }}>Odds</th>
                    </>
                )}
              </tr>
            </thead>
            <tbody>
              
              {/* === STATE A: RACE HAS RUN (SHOW RESULTS) === */}
              {hasRun && pastResults.map((entry) => {
                  const { uma, record } = entry;
                  const team = teams.find(t => t.id === uma.teamId);
                  const isPlayer = uma.teamId === 'player';
                  
                  // Highlight Top 3
                  let rankDisplay = `#${record.rank}`;
                  let rowBg = isPlayer ? '#e8f6f3' : 'white';
                  
                  if (record.rank === 1) { rankDisplay = '🥇 1st'; rowBg = '#fff9c4'; }
                  else if (record.rank === 2) { rankDisplay = '🥈 2nd'; }
                  else if (record.rank === 3) { rankDisplay = '🥉 3rd'; }

                  return (
                    <tr key={uma.id} style={{ borderBottom: '1px solid #eee', backgroundColor: rowBg }}>
                        <td style={{ padding: '10px', fontWeight: record.rank <= 3 ? 'bold' : 'normal' }}>{rankDisplay}</td>
                        <td style={{ padding: '10px' }}>
                            <div style={{ fontWeight: 'bold', color: isPlayer ? '#16a085' : '#2c3e50' }}>
                                {uma.firstName} {uma.lastName}
                            </div>
                        </td>
                        <td style={{ padding: '10px' }}>
                            {team ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <span style={{ fontSize: '16px' }}>{team.logo}</span>
                                    <span style={{ fontSize: '12px', color: '#7f8c8d' }}>{team.shortName}</span>
                                </div>
                            ) : <span style={{fontSize:'10px', color:'#ccc'}}>FA</span>}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', color: '#2c3e50' }}>
                            {record.time.toFixed(2)}s
                        </td>
                    </tr>
                  );
              })}

              {/* === STATE B: UPCOMING RACE (SHOW PREDICTIONS) === */}
              {!hasRun && field.map((uma, idx) => {
                const displayRating = calculateRaceRating(uma, activeRace);
                const odds = calculateOdds(uma, field, activeRace);
                const team = teams.find(t => t.id === uma.teamId);
                const isPlayer = uma.teamId === 'player';
                
                return (
                  <tr key={uma.id} style={{ borderBottom: '1px solid #eee', backgroundColor: isPlayer ? '#e8f6f3' : 'white' }}>
                    <td style={{ padding: '10px', color: '#95a5a6' }}>{idx + 1}</td>
                    <td style={{ padding: '10px' }}><div style={{ fontWeight: 'bold', color: isPlayer ? '#16a085' : '#2c3e50' }}>{uma.firstName} {uma.lastName}</div></td>
                    <td style={{ padding: '10px' }}>
                      {team ? <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ fontSize: '16px' }}>{team.logo}</span><span style={{ fontSize: '12px', color: '#7f8c8d' }}>{team.shortName}</span></div> : <span style={{fontSize:'10px', color:'#ccc'}}>FA</span>}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center', fontSize: '12px', fontFamily: 'monospace', color: '#95a5a6' }}>{displayRating}</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', color: '#d35400', fontWeight: 'bold' }}>{odds}</td>
                  </tr>
                );
              })}
              
              {/* Excluded Horses (Only show if NOT run yet) */}
              {!hasRun && excluded.length > 0 && (
                <>
                  <tr style={{ backgroundColor: '#ffe6e6' }}><td colSpan={5} style={{ padding: '10px', textAlign: 'center', color: '#c0392b', fontWeight: 'bold', fontSize: '12px' }}>--- CUT LINE (DID NOT QUALIFY) ---</td></tr>
                  {excluded.map((uma) => (
                    <tr key={uma.id} style={{ backgroundColor: '#fff5f5', color: '#bdc3c7' }}>
                       <td style={{ padding: '10px' }}>-</td><td style={{ padding: '10px' }}>{uma.firstName} {uma.lastName}</td><td style={{ padding: '10px' }}>-</td>
                       <td style={{ padding: '10px', textAlign: 'center' }}>{calculateRaceRating(uma, activeRace)}</td>
                       <td style={{ padding: '10px', textAlign: 'right' }}>DNQ</td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
          
          {/* Empty State */}
          {!hasRun && field.length === 0 && (
              <div style={{ padding: '40px', textAlign: 'center', color: '#bdc3c7' }}>No horses entered.</div>
          )}
        </div>

        {/* --- FOOTER --- */}
        <div style={{ padding: '20px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={onClose} style={{ backgroundColor: '#95a5a6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' }}>Close</button>
          {onRun && !hasRun && <button onClick={onRun} style={{ backgroundColor: '#27ae60', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>🏁 Run Week</button>}
        </div>
      </div>
    </div>
  );
}

const modalOverlay: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' };
const modalContent: React.CSSProperties = { backgroundColor: 'white', width: '800px', maxHeight: '85vh', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column' };