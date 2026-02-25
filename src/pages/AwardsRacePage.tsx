import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { generateAwardsRace, type AwardCandidate } from '../logic/awards';
import { Link } from 'react-router-dom';

export function AwardsRacePage() {
    const gameState = useLiveQuery(() => db.gameState.get(1));
    const allUmas = useLiveQuery(() => db.umas.toArray());
    const teams = useLiveQuery(() => db.teams.toArray());

    if (!gameState || !allUmas || !teams) return <div style={{padding: 20, color: 'white'}}>Loading Awards Race...</div>;

    const currentYear = gameState.year;
    const races = generateAwardsRace(allUmas, currentYear);

    const renderTable = (title: string, candidates: AwardCandidate[], icon: string) => (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', marginBottom: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
            <h2 style={{ marginTop: 0, color: '#2c3e50', borderBottom: '2px solid #ecf0f1', paddingBottom: '10px' }}>
                {icon} {title}
            </h2>
            
            {candidates.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ color: '#7f8c8d', fontSize: '13px', borderBottom: '1px solid #ecf0f1' }}>
                            <th style={{ padding: '10px 5px' }}>Rank</th>
                            <th style={{ padding: '10px 5px' }}>Horse</th>
                            <th style={{ padding: '10px 5px' }}>Team</th>
                            <th style={{ padding: '10px 5px', textAlign: 'center' }}>G1 Wins</th>
                            <th style={{ padding: '10px 5px', textAlign: 'center' }}>Total Wins</th>
                            <th style={{ padding: '10px 5px', textAlign: 'right' }}>Est. Earnings</th>
                            <th style={{ padding: '10px 5px', textAlign: 'right' }}>MVP Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        {candidates.map((cand, idx) => {
                            const team = teams.find(t => t.id === cand.uma.teamId);
                            const isLeader = idx === 0;

                            return (
                                <tr key={cand.uma.id} style={{ borderBottom: '1px solid #ecf0f1', backgroundColor: isLeader ? '#fff9c4' : 'transparent' }}>
                                    <td style={{ padding: '12px 5px', fontWeight: 'bold', color: isLeader ? '#f39c12' : '#95a5a6' }}>
                                        {idx + 1}
                                    </td>
                                    <td style={{ padding: '12px 5px' }}>
                                        <Link to={`/profile/${cand.uma.id}`} style={{ fontWeight: 'bold', color: '#2980b9', textDecoration: 'none' }}>
                                            {cand.uma.firstName} {cand.uma.lastName}
                                        </Link>
                                    </td>
                                    <td style={{ padding: '12px 5px' }}>
                                        {team ? <span style={{fontSize: '12px', color: '#7f8c8d'}}>{team.logo} {team.shortName}</span> : '-'}
                                    </td>
                                    <td style={{ padding: '12px 5px', textAlign: 'center', fontWeight: 'bold', color: cand.g1Wins > 0 ? '#e74c3c' : '#bdc3c7' }}>
                                        {cand.g1Wins}
                                    </td>
                                    <td style={{ padding: '12px 5px', textAlign: 'center' }}>{cand.wins}</td>
                                    <td style={{ padding: '12px 5px', textAlign: 'right', color: '#27ae60' }}>
                                        ${cand.earningsEstimate.toLocaleString()}
                                    </td>
                                    <td style={{ padding: '12px 5px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold', color: '#34495e' }}>
                                        {cand.score.toLocaleString()}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#95a5a6' }}>No candidates yet for Year {currentYear}.</div>
            )}
        </div>
    );

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
            <h1 style={{ color: 'var(--text-primary)', marginBottom: '5px' }}>🏆 Awards Race</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: 0, marginBottom: '30px' }}>
                Live MVP tracker for Year {currentYear}. Scores are based on G1 wins and total purse earnings.
            </p>

            {renderTable("Horse of the Year (Overall MVP)", races.horseOfTheYear, "👑")}
            {renderTable("Champion 3-Year-Old", races.champion3YO, "🥉")}
            {renderTable("Champion Older Horse (4yo+)", races.championOlder, "🌟")}
        </div>
    );
}