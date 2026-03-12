// src/pages/DraftHistoryPage.tsx
import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { db } from '../db';
import { Link } from 'react-router-dom';

export function DraftHistoryPage() {
    const gameState = useLiveQuery(() => db.gameState.get(1));
    const teams = useLiveQuery(() => db.teams.toArray());
    
    const [selectedYear, setSelectedYear] = useState<number>(0);
    const yearToView = selectedYear || (gameState ? Math.max(1, gameState.year - 1) : 1);

    const picks = useLiveQuery(() => db.draftPicks.where('year').equals(yearToView).toArray(), [yearToView]);

    if (!gameState || !teams) return <div style={{padding: 20, color: 'white'}}>Loading Draft Data...</div>;

    return (
        <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', color: 'var(--text-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid var(--border-strong)', paddingBottom: '10px', marginBottom: '20px' }}>
                <h1 style={{ margin: 0 }}>🌟 Draft History</h1>
                <select 
                    value={yearToView} 
                    onChange={e => setSelectedYear(Number(e.target.value))}
                    style={{ padding: '8px 12px', fontSize: '16px', borderRadius: '4px', backgroundColor: 'var(--bg-surface)', color: 'white', border: '1px solid var(--border-default)' }}
                >
                    {Array.from({length: gameState.year}, (_, i) => i + 1).map(y => (
                        <option key={y} value={y}>Year {y} Rookie Class</option>
                    ))}
                </select>
            </div>

            <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-default)' }}>
                {picks && picks.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                            <tr>
                                <th style={{ padding: '12px 15px', borderBottom: '2px solid var(--border-default)' }}>Pick</th>
                                <th style={{ padding: '12px 15px', borderBottom: '2px solid var(--border-default)' }}>Team</th>
                                <th style={{ padding: '12px 15px', borderBottom: '2px solid var(--border-default)' }}>Horse</th>
                                <th style={{ padding: '12px 15px', borderBottom: '2px solid var(--border-default)', textAlign: 'center' }}>OVR</th>
                                <th style={{ padding: '12px 15px', borderBottom: '2px solid var(--border-default)', textAlign: 'center' }}>POT</th>
                                <th style={{ padding: '12px 15px', borderBottom: '2px solid var(--border-default)' }}>Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {picks.sort((a, b) => a.pick - b.pick).map((pick, idx) => {
                                const team = teams.find(t => t.id === pick.teamId);
                                
                                // Color coding for the "Steal of the Draft" (Late Bloomers)
                                const isSteal = pick.isLateBloomer;

                                return (
                                    <tr key={pick.id} style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: idx % 2 === 0 ? 'var(--bg-elevated)' : 'transparent' }}>
                                        <td style={{ padding: '12px 15px', fontWeight: 'bold', color: 'var(--text-muted)' }}>#{pick.pick}</td>
                                        <td style={{ padding: '12px 15px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                            {team ? `${team.logo} ${team.shortName}` : 'FA'}
                                        </td>
                                        <td style={{ padding: '12px 15px', fontWeight: 'bold' }}>
                                            <Link to={`/uma/${pick.umaId}`} style={{ color: isSteal ? '#f39c12' : '#3498db', textDecoration: 'none' }}>
                                                {pick.umaName}
                                            </Link>
                                        </td>
                                        <td style={{ padding: '12px 15px', textAlign: 'center', color: 'var(--text-primary)' }}>{pick.ovr}</td>
                                        <td style={{ padding: '12px 15px', textAlign: 'center', fontWeight: 'bold', color: '#27ae60' }}>{pick.pot}</td>
                                        <td style={{ padding: '12px 15px', fontSize: '12px', color: '#e67e22', fontStyle: 'italic' }}>
                                            {isSteal ? "🔥 Late Bloomer / Draft Steal!" : ""}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                ) : (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No draft records found for Year {yearToView}. (Did you click Reset League?)
                    </div>
                )}
            </div>
        </div>
    );
}