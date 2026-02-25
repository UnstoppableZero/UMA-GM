// src/pages/HistoryPage.tsx
import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { db } from '../db';
import { FULL_CALENDAR } from '../data/calendar';
import type { Uma } from '../types';

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
    'G1': '#3498db', 'G2': '#e67e22', 'G3': '#2ecc71', 'Listed': '#95a5a6'
  };
  return (
    <span style={{
      backgroundColor: colors[grade] || '#95a5a6', color: 'white',
      padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', marginRight: '10px'
    }}>
      {grade}
    </span>
  );
};

export function HistoryPage() {
  const [activeTab, setActiveTab] = useState<'seasons' | 'races' | 'records'>('seasons');
  const [selectedYear, setSelectedYear] = useState<number>(1);
  const [gradeFilter, setGradeFilter] = useState<string>('All');

  const allHistory = (useLiveQuery(() => db.raceHistory.toArray()) ?? []) as any[];
  const allUmas = (useLiveQuery(() => db.umas.toArray()) ?? []) as Uma[];
  const gameState = useLiveQuery(() => db.gameState.get(1));

  const availableYears = useMemo(() => {
    const years = new Set(allHistory.map(h => h.year));
    if (gameState) years.add(gameState.year);
    return Array.from(years).sort((a, b) => b - a); // Newest first
  }, [allHistory, gameState]);

  React.useEffect(() => {
    if (gameState && selectedYear === 1 && availableYears.includes(gameState.year)) {
      setSelectedYear(gameState.year);
    }
  }, [gameState, availableYears]);

  // --- BBGM STYLE: PAST SEASONS SUMMARY ---
  const seasonSummaries = useMemo(() => {
    return availableYears.map(year => {
      // Find Award Winners by scanning trophies
      const hoty = allUmas.find(u => u.trophies?.includes(`Year ${year} Horse of the Year`));
      const c3yo = allUmas.find(u => u.trophies?.includes(`Year ${year} Champion 3-Year-Old`));
      const colder = allUmas.find(u => u.trophies?.includes(`Year ${year} Champion Older Horse`));

      // Calculate winningest horse of the year
      const yearHistory = allHistory.filter(h => h.year === year && h.rank === undefined || h.rank === 1);
      const winsByHorse: Record<string, number> = {};
      yearHistory.forEach(r => winsByHorse[r.winnerName] = (winsByHorse[r.winnerName] || 0) + 1);
      
      let topWinnerName = "-";
      let topWins = 0;
      Object.entries(winsByHorse).forEach(([name, count]) => {
          if (count > topWins) { topWins = count; topWinnerName = name; }
      });

      return { 
        year, 
        hoty, 
        c3yo, 
        colder,
        topWinner: topWins > 0 ? `${topWinnerName} (${topWins}W)` : '-',
        isCurrent: gameState?.year === year
      };
    });
  }, [availableYears, allUmas, allHistory, gameState?.year]);

  // --- RACE ARCHIVE ---
  const seasonRaces = useMemo(() => {
    let races = allHistory.filter(h => h.year === selectedYear);
    if (gradeFilter !== 'All') {
      races = races.filter(h => getRaceDetails(h.raceName)?.grade === gradeFilter);
    }
    return races.sort((a, b) => a.week - b.week);
  }, [allHistory, selectedYear, gradeFilter]);

  // --- ALL-TIME RECORDS ---
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

  const careerLeaders = useMemo<{ sortedByEarnings: Uma[], sortedByWins: Uma[], sortedByG1s: Uma[] }>(() => {
    if (!allUmas || allUmas.length === 0) return { sortedByEarnings: [], sortedByWins: [], sortedByG1s: [] };
    
    const countG1s = (u: Uma) => (u.history || []).filter(h => h.rank === 1 && getRaceDetails(h.raceName)?.grade === 'G1').length;

    const sortedByEarnings = [...allUmas].sort((a, b) => (b.career?.earnings || 0) - (a.career?.earnings || 0)).slice(0, 10);
    const sortedByWins = [...allUmas].sort((a, b) => (b.career?.wins || 0) - (a.career?.wins || 0)).slice(0, 10);
    const sortedByG1s = [...allUmas].sort((a, b) => countG1s(b) - countG1s(a)).slice(0, 10);

    return { sortedByEarnings, sortedByWins, sortedByG1s };
  }, [allUmas]);

  // --- STREAKS AND RECORDS ---
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

      // Best Undefeated (Must have run at least 3 races)
      if (races >= 3 && wins === races) {
        if (wins > maxUndefeatedWins) {
          maxUndefeatedWins = wins;
          bestUndefeated = uma;
        }
      }

      // Longest Winning Streak (Consecutive 1st Place finishes)
      if (history.length > 0) {
        let currentStreak = 0;
        let horseMaxStreak = 0;
        
        // Sort history chronologically to calculate streak properly
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
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', color: 'var(--text-primary)' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '3px solid var(--border-strong)', paddingBottom: '10px', marginBottom: '20px' }}>
        <h1 style={{ margin: 0, color: 'var(--text-primary)' }}>🏛️ League History</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setActiveTab('seasons')} style={tabStyle(activeTab === 'seasons')}>📖 Past Seasons</button>
          <button onClick={() => setActiveTab('races')} style={tabStyle(activeTab === 'races')}>📅 Race Archive</button>
          <button onClick={() => setActiveTab('records')} style={tabStyle(activeTab === 'records')}>🏆 Record Book</button>
        </div>
      </div>

      {/* =========================================
          TAB 1: PAST SEASONS (BBGM STYLE)
      ========================================= */}
      {activeTab === 'seasons' && (
        <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.3)', overflow: 'hidden', border: '1px solid var(--border-default)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                <tr>
                  <th style={thStyle}>Year</th>
                  <th style={thStyle}>👑 Horse of the Year</th>
                  <th style={thStyle}>🥉 Champion 3YO</th>
                  <th style={thStyle}>🌟 Champion Older</th>
                  <th style={thStyle}>Most Wins</th>
                  <th style={{...thStyle, textAlign: 'right'}}>Action</th>
                </tr>
              </thead>
              <tbody>
                {seasonSummaries.map((season, idx) => (
                  <tr key={season.year} style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: season.isCurrent ? 'rgba(52, 152, 219, 0.1)' : (idx % 2 === 0 ? 'var(--bg-elevated)' : 'transparent') }}>
                    <td style={{...tdStyle, fontWeight: 'bold'}}>{season.year} {season.isCurrent && '(Active)'}</td>
                    
                    <td style={tdStyle}>
                      {season.hoty ? (
                        <Link to={`/uma/${season.hoty.id}`} style={linkStyle}>{season.hoty.firstName} {season.hoty.lastName}</Link>
                      ) : <span style={{color: 'var(--text-muted)'}}>-</span>}
                    </td>
                    
                    <td style={tdStyle}>
                      {season.c3yo ? (
                        <Link to={`/uma/${season.c3yo.id}`} style={linkStyle}>{season.c3yo.firstName} {season.c3yo.lastName}</Link>
                      ) : <span style={{color: 'var(--text-muted)'}}>-</span>}
                    </td>

                    <td style={tdStyle}>
                      {season.colder ? (
                        <Link to={`/uma/${season.colder.id}`} style={linkStyle}>{season.colder.firstName} {season.colder.lastName}</Link>
                      ) : <span style={{color: 'var(--text-muted)'}}>-</span>}
                    </td>

                    <td style={{...tdStyle, color: 'var(--text-secondary)'}}>{season.topWinner}</td>
                    
                    <td style={{...tdStyle, textAlign: 'right'}}>
                        <button 
                            onClick={() => { setSelectedYear(season.year); setActiveTab('races'); }}
                            style={{ padding: '6px 12px', fontSize: '12px', backgroundColor: '#34495e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            View Races
                        </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
      )}

      {/* =========================================
          TAB 2: RACE ARCHIVE
      ========================================= */}
      {activeTab === 'races' && (
        <>
          <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', backgroundColor: 'var(--bg-elevated)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-default)' }}>
            <div>
              <label style={{ fontWeight: 'bold', marginRight: '10px', color: 'var(--text-primary)' }}>Season:</label>
              <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} style={selectStyle}>
                {availableYears.map(y => <option key={y} value={y}>Year {y}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontWeight: 'bold', marginRight: '10px', color: 'var(--text-primary)' }}>Filter:</label>
              <select value={gradeFilter} onChange={e => setGradeFilter(e.target.value)} style={selectStyle}>
                <option value="All">All Races</option>
                <option value="G1">G1 Only</option>
                <option value="G2">G2 Only</option>
                <option value="G3">G3 Only</option>
              </select>
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.3)', overflow: 'hidden', border: '1px solid var(--border-default)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                <tr>
                  <th style={thStyle}>Wk</th>
                  <th style={thStyle}>Race Event</th>
                  <th style={thStyle}>Winner</th>
                  <th style={thStyle}>Winning Time</th>
                </tr>
              </thead>
              <tbody>
                {seasonRaces.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No races found for these filters.</td></tr>
                ) : (
                  seasonRaces.map((race, idx) => {
                    const details = getRaceDetails(race.raceName);
                    // Find winner object for linking
                    const winnerUma = allUmas.find(u => u.id === race.winnerId);

                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: idx % 2 === 0 ? 'var(--bg-elevated)' : 'transparent' }}>
                        <td style={tdStyle}>{race.week}</td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <GradeBadge grade={details?.grade || '-'} />
                            <div>
                              <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{race.raceName}</div>
                              {details && (
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                  {details.location} • {details.distance}m ({details.surface})
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <div style={{ fontWeight: 'bold', fontSize: '15px' }}>
                            🥇 {winnerUma ? (
                                <Link to={`/uma/${winnerUma.id}`} style={linkStyle}>{race.winnerName}</Link>
                            ) : (
                                <span style={{color: '#2980b9'}}>{race.winnerName}</span>
                            )}
                          </div>
                          {race.top3 && race.top3.length > 1 && (
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px', lineHeight: '1.4' }}>
                              <div>
                                🥈 {race.top3[1].name} 
                                <span style={{ color: 'var(--text-muted)', marginLeft: '5px' }}>
                                  (+{(race.top3[1].time - race.time).toFixed(2)}s)
                                </span>
                              </div>
                              {race.top3[2] && (
                                <div>
                                  🥉 {race.top3[2].name} 
                                  <span style={{ color: 'var(--text-muted)', marginLeft: '5px' }}>
                                    (+{(race.top3[2].time - race.time).toFixed(2)}s)
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td style={{...tdStyle, fontFamily: 'monospace', color: '#27ae60', fontWeight: 'bold'}}>{formatTime(race.time)}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* =========================================
          TAB 3: ALL-TIME RECORDS
      ========================================= */}
      {activeTab === 'records' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* THE STREAK CARDS */}
          <div style={{ display: 'flex', gap: '20px' }}>
             <div style={{ ...summaryCardStyle, borderLeft: '5px solid #e74c3c' }}>
               <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>👑 All-Time Win Streak</div>
               {streakRecords.longestStreakHorse && streakRecords.maxOverallStreak >= 3 ? (
                 <>
                    <div style={{ fontSize: '22px', fontWeight: '900', color: 'var(--text-primary)', marginTop: '5px' }}>
                      <Link to={`/uma/${streakRecords.longestStreakHorse.id}`} style={{color: 'var(--text-primary)', textDecoration: 'none'}}>
                         {streakRecords.longestStreakHorse.firstName} {streakRecords.longestStreakHorse.lastName}
                      </Link>
                    </div>
                    <div style={{ fontSize: '16px', color: '#e74c3c', fontWeight: 'bold' }}>
                      🔥 {streakRecords.maxOverallStreak} Consecutive Wins
                    </div>
                 </>
               ) : (
                  <div style={{ color: 'var(--text-muted)', marginTop: '10px', fontStyle: 'italic' }}>No significant streaks yet.</div>
               )}
             </div>

             <div style={{ ...summaryCardStyle, borderLeft: '5px solid #2ecc71' }}>
               <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>🛡️ Best Undefeated Record</div>
               {streakRecords.bestUndefeated ? (
                 <>
                    <div style={{ fontSize: '22px', fontWeight: '900', color: 'var(--text-primary)', marginTop: '5px' }}>
                      <Link to={`/uma/${streakRecords.bestUndefeated.id}`} style={{color: 'var(--text-primary)', textDecoration: 'none'}}>
                         {streakRecords.bestUndefeated.firstName} {streakRecords.bestUndefeated.lastName}
                      </Link>
                    </div>
                    <div style={{ fontSize: '16px', color: '#27ae60', fontWeight: 'bold' }}>
                      {streakRecords.bestUndefeated.history.length}-0 Record
                    </div>
                 </>
               ) : (
                  <div style={{ color: 'var(--text-muted)', marginTop: '10px', fontStyle: 'italic' }}>No undefeated horses (Min 3 races).</div>
               )}
             </div>
          </div>

          {/* LEADERBOARDS GRID */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            
            {/* G1 WINS LEADERBOARD */}
            <div style={{ backgroundColor: 'var(--bg-surface)', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.3)', border: '1px solid var(--border-default)' }}>
              <h2 style={{ marginTop: 0, color: '#3498db', borderBottom: '2px solid var(--border-default)', paddingBottom: '10px' }}>🏆 Most G1 Wins</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {careerLeaders.sortedByG1s.filter(u => {
                      const g1s = (u.history || []).filter(h => h.rank === 1 && getRaceDetails(h.raceName)?.grade === 'G1').length;
                      return g1s > 0;
                  }).slice(0,10).map((uma: Uma, i: number) => {
                    const g1Wins = (uma.history || []).filter(h => h.rank === 1 && getRaceDetails(h.raceName)?.grade === 'G1').length;
                    return (
                      <tr key={uma.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '8px 0', fontWeight: 'bold', color: i === 0 ? '#3498db' : 'var(--text-secondary)', width: '30px' }}>{i+1}.</td>
                        <td style={{ padding: '8px 0', fontWeight: 'bold' }}>
                            <Link to={`/uma/${uma.id}`} style={linkStyle}>{uma.firstName} {uma.lastName}</Link>
                        </td>
                        <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 'bold', color: 'var(--text-primary)' }}>{g1Wins}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* EARNINGS LEADERBOARD */}
            <div style={{ backgroundColor: 'var(--bg-surface)', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.3)', border: '1px solid var(--border-default)' }}>
              <h2 style={{ marginTop: 0, color: '#f39c12', borderBottom: '2px solid var(--border-default)', paddingBottom: '10px' }}>💰 Highest Career Earnings</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {careerLeaders.sortedByEarnings.map((uma: Uma, i: number) => (
                    <tr key={uma.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '8px 0', fontWeight: 'bold', color: i === 0 ? '#f39c12' : 'var(--text-secondary)', width: '30px' }}>{i+1}.</td>
                      <td style={{ padding: '8px 0', fontWeight: 'bold' }}>
                          <Link to={`/uma/${uma.id}`} style={linkStyle}>{uma.firstName} {uma.lastName}</Link>
                      </td>
                      <td style={{ padding: '8px 0', textAlign: 'right', color: '#27ae60' }}>${uma.career.earnings.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* TOTAL WINS LEADERBOARD */}
            <div style={{ backgroundColor: 'var(--bg-surface)', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.3)', border: '1px solid var(--border-default)' }}>
              <h2 style={{ marginTop: 0, color: '#8e44ad', borderBottom: '2px solid var(--border-default)', paddingBottom: '10px' }}>🥇 Most Total Wins</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {careerLeaders.sortedByWins.map((uma: Uma, i: number) => (
                    <tr key={uma.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '8px 0', fontWeight: 'bold', color: i === 0 ? '#8e44ad' : 'var(--text-secondary)', width: '30px' }}>{i+1}.</td>
                      <td style={{ padding: '8px 0', fontWeight: 'bold' }}>
                          <Link to={`/uma/${uma.id}`} style={linkStyle}>{uma.firstName} {uma.lastName}</Link>
                      </td>
                      <td style={{ padding: '8px 0', textAlign: 'right', color: 'var(--text-primary)' }}>{uma.career.wins} Wins</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>

          {/* COURSE RECORDS */}
          <div style={{ backgroundColor: 'var(--bg-surface)', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.3)', border: '1px solid var(--border-default)' }}>
            <h2 style={{ marginTop: 0, color: '#e74c3c', borderBottom: '2px solid var(--border-default)', paddingBottom: '10px' }}>⏱️ Course Records (Fastest Times)</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
                {raceRecords.map((rec, idx) => {
                  const details = getRaceDetails(rec.raceName);
                  const winnerUma = allUmas.find(u => u.id === rec.winnerId);

                  return (
                    <div key={idx} style={{ padding: '10px', backgroundColor: 'var(--bg-elevated)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                          <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                            <GradeBadge grade={details?.grade || '-'} /> 
                            {rec.raceName.split(' (Div')[0]}
                          </div>
                          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#27ae60', fontFamily: 'monospace' }}>
                            {formatTime(rec.time)}
                          </div>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Set by {' '}
                        {winnerUma ? (
                            <Link to={`/uma/${winnerUma.id}`} style={{...linkStyle, fontSize: '12px'}}>{rec.winnerName}</Link>
                        ) : (
                            <span style={{color: '#2980b9', fontWeight: 'bold'}}>{rec.winnerName}</span>
                        )}
                        {' '}(Year {rec.year})
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

// Styles
const tabStyle = (active: boolean) => ({
  padding: '10px 20px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer',
  backgroundColor: active ? 'var(--bg-elevated)' : 'transparent',
  color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
  border: '1px solid var(--border-default)', borderRadius: '5px 5px 0 0',
  borderBottom: active ? 'none' : '1px solid var(--border-default)'
});

const linkStyle = { color: '#3498db', textDecoration: 'none', fontWeight: 'bold' };
const selectStyle = { padding: '8px', borderRadius: '4px', border: '1px solid var(--border-default)', fontSize: '14px', minWidth: '120px', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' };
const summaryCardStyle = { flex: 1, backgroundColor: 'var(--bg-surface)', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.3)', border: '1px solid var(--border-default)' };
const thStyle = { padding: '12px 15px', borderBottom: '2px solid var(--border-default)', color: 'var(--text-secondary)' };
const tdStyle = { padding: '12px 15px', verticalAlign: 'middle' as const, color: 'var(--text-primary)' };