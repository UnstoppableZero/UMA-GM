// src/pages/HistoryPage.tsx
import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { FULL_CALENDAR } from '../data/calendar';
import type { Uma } from '../types';

// --- HELPER FUNCTIONS ---
const formatTime = (rawSeconds: number) => {
  const minutes = Math.floor(rawSeconds / 60);
  const seconds = (rawSeconds % 60).toFixed(2);
  return minutes > 0 ? `${minutes}:${seconds.padStart(5, '0')}` : `${seconds}s`;
};

const getRaceDetails = (raceName: string) => {
  const baseName = raceName.split(' (Div')[0];
  const race = FULL_CALENDAR.find(r => r.name === baseName);
  return race || null;
};

const GradeBadge = ({ grade }: { grade: string }) => {
  const colors: Record<string, string> = {
    'G1': '#3498db', 'G2': '#9b59b6', 'G3': '#2ecc71', 'Listed': '#95a5a6'
  };
  return (
    <span style={{
      backgroundColor: colors[grade] || '#95a5a6', color: 'white',
      padding: '2px 6px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', marginRight: '10px'
    }}>
      {grade}
    </span>
  );
};

export function HistoryPage() {
  const [activeTab, setActiveTab] = useState<'archive' | 'records'>('archive');
  const [selectedYear, setSelectedYear] = useState<number>(1);
  const [gradeFilter, setGradeFilter] = useState<string>('All');

  const allHistory = (useLiveQuery(() => db.raceHistory.toArray()) ?? []) as any[];
  const allUmas = (useLiveQuery(() => db.umas.toArray()) ?? []) as Uma[];
  const gameState = useLiveQuery(() => db.gameState.get(1));

  const availableYears = useMemo(() => {
    const years = new Set(allHistory.map(h => h.year));
    if (gameState) years.add(gameState.year);
    return Array.from(years).sort((a, b) => b - a);
  }, [allHistory, gameState]);

  React.useEffect(() => {
    if (gameState && selectedYear === 1 && availableYears.includes(gameState.year)) {
      setSelectedYear(gameState.year);
    }
  }, [gameState, availableYears]);

  const seasonRaces = useMemo(() => {
    let races = allHistory.filter(h => h.year === selectedYear);
    if (gradeFilter !== 'All') {
      races = races.filter(h => getRaceDetails(h.raceName)?.grade === gradeFilter);
    }
    return races.sort((a, b) => a.week - b.week);
  }, [allHistory, selectedYear, gradeFilter]);

  const seasonSummary = useMemo(() => {
    if (seasonRaces.length === 0) return null;
    const winsByHorse: Record<string, number> = {};
    seasonRaces.forEach(r => winsByHorse[r.winnerName] = (winsByHorse[r.winnerName] || 0) + 1);
    let topHorse = "None";
    let maxWins = 0;
    for (const [name, wins] of Object.entries(winsByHorse)) {
      if (wins > maxWins) { maxWins = wins; topHorse = name; }
    }
    return { topHorse, maxWins, totalRaces: seasonRaces.length };
  }, [seasonRaces]);

  const raceRecords = useMemo(() => {
    const records: Record<string, any> = {};
    allHistory.forEach(race => {
      const baseName = race.raceName.split(' (Div')[0];
      if (!records[baseName] || race.time < records[baseName].time) {
        records[baseName] = race;
      }
    });
    return Object.values(records).sort((a, b) => {
        const gradeA = getRaceDetails(a.raceName)?.grade || 'Z';
        const gradeB = getRaceDetails(b.raceName)?.grade || 'Z';
        return gradeA.localeCompare(gradeB);
    });
  }, [allHistory]);

  const careerLeaders = useMemo<{ sortedByEarnings: Uma[], sortedByWins: Uma[] }>(() => {
    if (!allUmas || allUmas.length === 0) return { sortedByEarnings: [], sortedByWins: [] };
    const sortedByEarnings = [...allUmas].sort((a, b) => (b.career?.earnings || 0) - (a.career?.earnings || 0)).slice(0, 5);
    const sortedByWins = [...allUmas].sort((a, b) => (b.career?.wins || 0) - (a.career?.wins || 0)).slice(0, 5);
    return { sortedByEarnings, sortedByWins };
  }, [allUmas]);

  // --- DERIVATIVE STREAK LOGIC ---
  const streakRecords = useMemo<{ bestUndefeated: Uma | null, longestStreakHorse: Uma | null, maxOverallStreak: number }>(() => {
    let bestUndefeated: Uma | null = null;
    let maxUndefeatedWins = 0;
    let longestStreakHorse: Uma | null = null;
    let maxOverallStreak = 0;

    if (!allUmas) return { bestUndefeated, longestStreakHorse, maxOverallStreak };

    allUmas.forEach((uma: Uma) => {
      const history = uma.history || [];
      const races = history.length;
      const wins = history.filter(h => h.rank === 1).length;

      // FIX: Use derived 'wins' and 'races' from history log
      if (races >= 3 && wins === races) {
        if (wins > maxUndefeatedWins) {
          maxUndefeatedWins = wins;
          bestUndefeated = uma;
        }
      }

      if (history.length > 0) {
        let currentStreak = 0;
        let horseMaxStreak = 0;
        const sortedHistory = [...history].sort((a, b) => (a.year * 100 + a.week) - (b.year * 100 + b.week));
        
        sortedHistory.forEach(race => {
          if (race.rank === 1) {
            currentStreak++;
            if (currentStreak > horseMaxStreak) horseMaxStreak = currentStreak;
          } else {
            currentStreak = 0; 
          }
        });

        if (horseMaxStreak > maxOverallStreak) {
          maxOverallStreak = horseMaxStreak;
          longestStreakHorse = uma;
        }
      }
    });

    return { bestUndefeated, longestStreakHorse, maxOverallStreak };
  }, [allUmas]);


  if (!allHistory || !allUmas) return <div style={{padding: '20px'}}>Loading Archives...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', color: '#2c3e50' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '3px solid #34495e', paddingBottom: '10px', marginBottom: '20px' }}>
        <h1 style={{ margin: 0, color: '#2c3e50' }}>🏛️ League History</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setActiveTab('archive')} style={tabStyle(activeTab === 'archive')}>📅 Season Archive</button>
          <button onClick={() => setActiveTab('records')} style={tabStyle(activeTab === 'records')}>🏆 Record Book</button>
        </div>
      </div>

      {activeTab === 'archive' && (
        <>
          <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', backgroundColor: '#ecf0f1', padding: '15px', borderRadius: '8px' }}>
            <div>
              <label style={{ fontWeight: 'bold', marginRight: '10px' }}>Season:</label>
              <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} style={selectStyle}>
                {availableYears.map(y => <option key={y} value={y}>Year {y}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontWeight: 'bold', marginRight: '10px' }}>Filter:</label>
              <select value={gradeFilter} onChange={e => setGradeFilter(e.target.value)} style={selectStyle}>
                <option value="All">All Races</option>
                <option value="G1">G1 Only</option>
                <option value="G2">G2 Only</option>
                <option value="G3">G3 Only</option>
              </select>
            </div>
          </div>

          {seasonSummary && (
            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
              <div style={summaryCardStyle}>
                <div style={{ fontSize: '12px', color: '#7f8c8d', textTransform: 'uppercase' }}>Most Wins (Year {selectedYear})</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#e67e22' }}>🐎 {seasonSummary.topHorse} ({seasonSummary.maxWins})</div>
              </div>
              <div style={summaryCardStyle}>
                <div style={{ fontSize: '12px', color: '#7f8c8d', textTransform: 'uppercase' }}>Races Held</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#3498db' }}>🏁 {seasonSummary.totalRaces}</div>
              </div>
            </div>
          )}

          <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ backgroundColor: '#34495e', color: 'white' }}>
                <tr>
                  <th style={thStyle}>Wk</th>
                  <th style={thStyle}>Race Event</th>
                  <th style={thStyle}>Winner</th>
                  <th style={thStyle}>Winning Time</th>
                </tr>
              </thead>
              <tbody>
                {seasonRaces.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: '#7f8c8d' }}>No races found for these filters.</td></tr>
                ) : (
                  seasonRaces.map((race, idx) => {
                    const details = getRaceDetails(race.raceName);
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #ecf0f1', backgroundColor: idx % 2 === 0 ? '#fafafa' : 'white' }}>
                        <td style={tdStyle}>{race.week}</td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <GradeBadge grade={details?.grade || '-'} />
                            <div>
                              <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>{race.raceName}</div>
                              {details && (
                                <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                                  {details.location} • {details.distance}m ({details.surface})
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <div style={{ fontWeight: 'bold', color: '#2980b9', fontSize: '15px' }}>
                            🥇 {race.winnerName}
                          </div>
                          
                          {race.top3 && race.top3.length > 1 && (
                            <div style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '6px', lineHeight: '1.4' }}>
                              <div>
                                🥈 {race.top3[1].name} 
                                <span style={{ color: '#bdc3c7', marginLeft: '5px' }}>
                                  (+{(race.top3[1].time - race.time).toFixed(2)}s)
                                </span>
                              </div>
                              {race.top3[2] && (
                                <div>
                                  🥉 {race.top3[2].name} 
                                  <span style={{ color: '#bdc3c7', marginLeft: '5px' }}>
                                    (+{(race.top3[2].time - race.time).toFixed(2)}s)
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td style={tdStyle}>{formatTime(race.time)}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'records' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ ...summaryCardStyle, borderLeft: '5px solid #e74c3c' }}>
              <div style={{ fontSize: '12px', color: '#7f8c8d', textTransform: 'uppercase', fontWeight: 'bold' }}>👑 All-Time Win Streak</div>
              {streakRecords.longestStreakHorse && streakRecords.maxOverallStreak >= 3 ? (
                <>
                   <div style={{ fontSize: '22px', fontWeight: '900', color: '#2c3e50', marginTop: '5px' }}>
                     {streakRecords.longestStreakHorse.firstName} {streakRecords.longestStreakHorse.lastName}
                   </div>
                   <div style={{ fontSize: '16px', color: '#e74c3c', fontWeight: 'bold' }}>
                     🔥 {streakRecords.maxOverallStreak} Consecutive Wins
                   </div>
                </>
              ) : (
                 <div style={{ color: '#bdc3c7', marginTop: '10px', fontStyle: 'italic' }}>No significant streaks yet.</div>
              )}
            </div>

            <div style={{ ...summaryCardStyle, borderLeft: '5px solid #2ecc71' }}>
              <div style={{ fontSize: '12px', color: '#7f8c8d', textTransform: 'uppercase', fontWeight: 'bold' }}>🛡️ Best Undefeated Record</div>
              {streakRecords.bestUndefeated ? (
                <>
                   <div style={{ fontSize: '22px', fontWeight: '900', color: '#2c3e50', marginTop: '5px' }}>
                     {streakRecords.bestUndefeated.firstName} {streakRecords.bestUndefeated.lastName}
                   </div>
                   <div style={{ fontSize: '16px', color: '#27ae60', fontWeight: 'bold' }}>
                     {streakRecords.bestUndefeated.history.length}-0 Record
                   </div>
                </>
              ) : (
                 <div style={{ color: '#bdc3c7', marginTop: '10px', fontStyle: 'italic' }}>No undefeated horses (Min 3 races).</div>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
              <h2 style={{ marginTop: 0, color: '#c0392b', borderBottom: '2px solid #ecf0f1', paddingBottom: '10px' }}>⏱️ Fastest Event Times</h2>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {raceRecords.map((rec, idx) => {
                   const details = getRaceDetails(rec.raceName);
                   return (
                     <li key={idx} style={{ padding: '10px 0', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <div>
                         <div style={{ fontWeight: 'bold' }}>
                           <GradeBadge grade={details?.grade || '-'} /> 
                           {rec.raceName.split(' (Div')[0]}
                         </div>
                         <div style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '4px' }}>
                           Held by <span style={{color: '#2980b9', fontWeight: 'bold'}}>{rec.winnerName}</span> (Year {rec.year})
                         </div>
                       </div>
                       <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#27ae60', fontFamily: 'monospace' }}>
                         {formatTime(rec.time)}
                       </div>
                     </li>
                   )
                })}
              </ul>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                <h2 style={{ marginTop: 0, color: '#f39c12', borderBottom: '2px solid #ecf0f1', paddingBottom: '10px' }}>💰 Highest Career Earnings</h2>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {careerLeaders.sortedByEarnings.map((uma: Uma, i: number) => (
                      <tr key={uma.id}>
                        <td style={{ padding: '8px 0', fontWeight: 'bold', color: i === 0 ? '#f39c12' : '#7f8c8d' }}>#{i+1}</td>
                        <td style={{ padding: '8px 0', fontWeight: 'bold' }}>{uma.firstName} {uma.lastName}</td>
                        <td style={{ padding: '8px 0', textAlign: 'right', color: '#27ae60' }}>${uma.career.earnings.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                <h2 style={{ marginTop: 0, color: '#8e44ad', borderBottom: '2px solid #ecf0f1', paddingBottom: '10px' }}>🥇 Most Career Wins</h2>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {careerLeaders.sortedByWins.map((uma: Uma, i: number) => (
                      <tr key={uma.id}>
                        <td style={{ padding: '8px 0', fontWeight: 'bold', color: i === 0 ? '#8e44ad' : '#7f8c8d' }}>#{i+1}</td>
                        <td style={{ padding: '8px 0', fontWeight: 'bold' }}>{uma.firstName} {uma.lastName}</td>
                        <td style={{ padding: '8px 0', textAlign: 'right' }}>{uma.history.filter(h => h.rank === 1).length} Wins</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- STYLING OBJECTS ---
const tabStyle = (active: boolean) => ({
  padding: '10px 20px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer',
  backgroundColor: active ? '#2c3e50' : '#ecf0f1',
  color: active ? 'white' : '#7f8c8d',
  border: 'none', borderRadius: '5px 5px 0 0',
  borderBottom: active ? 'none' : '1px solid #bdc3c7'
});

const selectStyle = { padding: '8px', borderRadius: '4px', border: '1px solid #bdc3c7', fontSize: '14px', minWidth: '120px' };
const summaryCardStyle = { flex: 1, backgroundColor: 'white', padding: '15px', borderRadius: '8px', borderLeft: '5px solid #bdc3c7', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' };
const thStyle = { padding: '12px 15px', borderBottom: '2px solid #bdc3c7' };
const tdStyle = { padding: '12px 15px', verticalAlign: 'middle' };