// src/pages/InjuryReportPage.tsx
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { db } from '../db';

export function InjuryReportPage() {
    const allUmas = useLiveQuery(() => db.umas.toArray());
    const teams = useLiveQuery(() => db.teams.toArray());

    if (!allUmas || !teams) return <div style={{padding: '20px', color: 'white'}}>Loading Medical Data...</div>;

    // Filter to only show active horses with > 0 injury weeks
    const injuredList = allUmas
        .filter(u => u.status === 'active' && u.injuryWeeks > 0)
        .sort((a, b) => b.injuryWeeks - a.injuryWeeks); // Sort by most severe first

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px', color: 'var(--text-primary)' }}>
            <h1 style={{ borderBottom: '3px solid var(--border-strong)', paddingBottom: '10px', marginBottom: '20px' }}>
                🚑 League Injury Report
            </h1>

            <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
                <div style={{ backgroundColor: 'var(--bg-surface)', padding: '20px', borderRadius: '8px', flex: 1, borderLeft: '4px solid #e74c3c' }}>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>Total Injured</div>
                    <div style={{ fontSize: '32px', fontWeight: '900', color: '#e74c3c' }}>{injuredList.length}</div>
                </div>
                <div style={{ backgroundColor: 'var(--bg-surface)', padding: '20px', borderRadius: '8px', flex: 1, borderLeft: '4px solid #f39c12' }}>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>Active Roster Health</div>
                    <div style={{ fontSize: '32px', fontWeight: '900', color: '#f39c12' }}>
                        {allUmas.length > 0 ? Math.floor(((allUmas.length - injuredList.length) / allUmas.length) * 100) : 0}%
                    </div>
                </div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.3)', overflow: 'hidden', border: '1px solid var(--border-default)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                        <tr>
                            <th style={{ padding: '12px 15px', borderBottom: '2px solid var(--border-default)' }}>Horse</th>
                            <th style={{ padding: '12px 15px', borderBottom: '2px solid var(--border-default)' }}>Team</th>
                            <th style={{ padding: '12px 15px', borderBottom: '2px solid var(--border-default)' }}>Age</th>
                            <th style={{ padding: '12px 15px', borderBottom: '2px solid var(--border-default)', textAlign: 'right' }}>Time Remaining</th>
                        </tr>
                    </thead>
                    <tbody>
                        {injuredList.length > 0 ? injuredList.map((uma, idx) => {
                            const team = teams.find(t => t.id === uma.teamId);
                            // Color coding severity
                            let severityColor = '#e74c3c'; // Red for catastrophic
                            if (uma.injuryWeeks <= 4) severityColor = '#f1c40f'; // Yellow for minor
                            else if (uma.injuryWeeks <= 8) severityColor = '#e67e22'; // Orange for major

                            return (
                                <tr key={uma.id} style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: idx % 2 === 0 ? 'var(--bg-elevated)' : 'transparent' }}>
                                    <td style={{ padding: '12px 15px', fontWeight: 'bold' }}>
                                        <Link to={`/uma/${uma.id}`} style={{ color: '#3498db', textDecoration: 'none' }}>
                                            {uma.firstName} {uma.lastName}
                                        </Link>
                                    </td>
                                    <td style={{ padding: '12px 15px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                        {team ? `${team.logo} ${team.shortName}` : 'Free Agent'}
                                    </td>
                                    <td style={{ padding: '12px 15px', color: 'var(--text-primary)' }}>{uma.age}</td>
                                    <td style={{ padding: '12px 15px', textAlign: 'right', fontWeight: 'bold', color: severityColor }}>
                                        Out {uma.injuryWeeks} Weeks
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan={4} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    The medical tent is empty! Everyone is healthy.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}