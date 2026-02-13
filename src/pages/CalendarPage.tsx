// src/pages/CalendarPage.tsx
import { FULL_CALENDAR, type RaceEvent } from '../data/calendar';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { useState } from 'react'; 
import { RacePreview } from '../components/RacePreview'; 

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function CalendarPage() {
  const gameState = useLiveQuery(() => db.gameState.get(1));
  const allHistory = useLiveQuery(() => db.raceHistory.toArray());
  const [selectedRace, setSelectedRace] = useState<RaceEvent | null>(null);

  if (!gameState || !allHistory) return <div>Loading Season Data...</div>;

  const history = allHistory.filter(h => h.year === gameState.year);

  return (
    <div style={{ padding: '20px', width: '100%', boxSizing: 'border-box' }}>
      
      {selectedRace && (
        <RacePreview 
          race={selectedRace} 
          onClose={() => setSelectedRace(null)} 
        />
      )}

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '4px solid var(--border-strong)', marginBottom: '20px', paddingBottom: '10px' }}>
        <h1 style={{ margin: 0, color: 'var(--text-primary)' }}>
          📅 Season Schedule <span style={{fontSize:'20px', color:'var(--text-secondary)'}}>  (Year {gameState.year})</span>
        </h1>
      </div>
      
      {/* THE GRID */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
        gap: '20px',
        alignItems: 'start'
      }}>
        {MONTHS.map((monthName) => {
          const monthRaces = FULL_CALENDAR.filter(r => r.month === monthName);
          const isCurrentMonth = monthRaces.some(r => r.week === gameState.week);

          return (
            <div key={monthName} style={{ 
              backgroundColor: 'var(--bg-surface)', 
              borderRadius: '10px', 
              boxShadow: isCurrentMonth ? '0 0 0 3px #3498db' : '0 2px 4px rgba(0,0,0,0.3)', 
              overflow: 'hidden',
              display: 'flex', flexDirection: 'column',
              height: '100%',
              border: '1px solid var(--border-default)'
            }}>
              {/* MONTH HEADER */}
              <div style={{ 
                backgroundColor: isCurrentMonth ? '#3498db' : 'var(--bg-elevated)', 
                color: isCurrentMonth ? 'white' : 'var(--text-primary)',
                padding: '12px 15px', fontWeight: 'bold', fontSize: '16px',
                display: 'flex', justifyContent: 'space-between',
                borderBottom: '1px solid var(--border-default)'
              }}>
                <span>{monthName}</span>
                {isCurrentMonth && <span style={{fontSize:'10px', backgroundColor:'rgba(255,255,255,0.2)', padding:'2px 6px', borderRadius:'4px'}}>CURRENT</span>}
              </div>

              {/* RACES LIST */}
              <div style={{ flex: 1, padding: '0' }}>
                {monthRaces.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {monthRaces.map(race => {
                      const isThisWeek = race.week === gameState.week;
                      const isPast = race.week < gameState.week;
                      const results = history.filter(h => h.raceName.startsWith(race.name));
                      const primaryResult = results[0];
                      const hasResult = results.length > 0;
                      
                      return (
                        <div 
                          key={race.id} 
                          onClick={() => setSelectedRace(race)}
                          style={{ 
                            padding: '10px 15px', 
                            borderBottom: '1px solid var(--border-subtle)',
                            backgroundColor: hasResult
                              ? 'var(--bg-elevated)'
                              : isThisWeek
                              ? 'rgba(52, 152, 219, 0.15)'
                              : 'transparent',
                            borderLeft: hasResult ? '4px solid #f1c40f' : '4px solid transparent', 
                            opacity: (isPast && !hasResult) ? 0.5 : 1, 
                            display: 'flex', gap: '10px', alignItems: 'center',
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-elevated)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = hasResult
                            ? 'var(--bg-elevated)'
                            : isThisWeek
                            ? 'rgba(52, 152, 219, 0.15)'
                            : 'transparent'}
                        >
                          {/* Grade Badge */}
                          <div style={{ minWidth: '40px', textAlign: 'center' }}>
                             <span style={{ 
                                display: 'block', backgroundColor: getGradeColor(race.grade), 
                                color: 'white', fontSize: '10px', fontWeight: 'bold', 
                                padding: '2px 0', borderRadius: '4px' 
                             }}>
                               {race.grade}
                             </span>
                             <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>W{race.week}</span>
                          </div>

                          {/* Info */}
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)', lineHeight: '1.2' }}>{race.name}</div>
                            
                            {hasResult ? (
                              <div style={{ marginTop: '4px', fontSize: '12px', color: '#e67e22', fontWeight: 'bold', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                  <span>🏆</span> 
                                  <span>{primaryResult.winnerName}</span>
                                </div>
                                {results.length > 1 && (
                                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                                    + {results.length - 1} other heats
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                {race.location} • {race.distance}m • {race.surface}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                    No Major Events
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getGradeColor(grade: string) {
  if (grade === 'G1') return '#2980b9';
  if (grade === 'G2') return '#e74c3c';
  if (grade === 'G3') return '#27ae60';
  return '#95a5a6';
}
