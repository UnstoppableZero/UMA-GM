// src/pages/LeaguePage.tsx
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { useNavigate } from 'react-router-dom';

export function LeaguePage() {
  const navigate = useNavigate();
  const teams = useLiveQuery(() => db.teams.toArray());
  const umas = useLiveQuery(() => db.umas.toArray());

  if (!teams || !umas) return <div style={{ padding: '20px' }}>Loading League Data...</div>;

  const teamStats = teams.map(team => {
    const roster = umas.filter(u => u.teamId === team.id);
    const totalWins = roster.reduce((sum, u) => sum + (u.career?.wins || 0), 0);
    const totalEarnings = roster.reduce((sum, u) => sum + (u.career?.earnings || 0), 0);
    const activeCount = roster.filter(u => u.status === 'active').length;
    const retiredCount = roster.filter(u => u.status === 'retired').length;
    const totalOVR = roster
      .filter(u => u.status === 'active')
      .reduce((sum, u) => {
        const ovr = (u.stats.speed + u.stats.stamina + u.stats.power + u.stats.guts + u.stats.wisdom) / 55;
        return sum + ovr;
      }, 0);
    const avgOVR = activeCount > 0 ? Math.floor(totalOVR / activeCount) : 0;
    return { ...team, totalWins, totalEarnings, activeCount, retiredCount, avgOVR };
  });

  teamStats.sort((a, b) => b.totalWins - a.totalWins);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '4px solid var(--border-strong)', paddingBottom: '10px' }}>
        <div>
            <h1 style={{ margin: 0, color: 'var(--text-primary)' }}>🏆 League Standings</h1>
            <span style={{ color: 'var(--text-secondary)' }}>{teams.length} Registered Teams</span>
        </div>
        <div style={{ fontSize: '14px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
           Click a team to view their roster
        </div>
      </div>

      {/* STANDINGS TABLE */}
      <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'var(--bg-surface)', boxShadow: '0 2px 5px rgba(0,0,0,0.3)', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-default)' }}>
        <thead style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
          <tr>
            <th style={{ padding: '15px', textAlign: 'left', width: '50px' }}>#</th>
            <th style={{ padding: '15px', textAlign: 'left' }}>Team Name</th>
            <th style={{ padding: '15px', textAlign: 'center' }}>Prestige</th>
            <th style={{ padding: '15px', textAlign: 'center' }}>Avg OVR</th>
            <th style={{ padding: '15px', textAlign: 'center' }}>Roster</th>
            <th style={{ padding: '15px', textAlign: 'center' }}>Total Wins</th>
            <th style={{ padding: '15px', textAlign: 'right' }}>Total Earnings</th>
          </tr>
        </thead>
        <tbody>
          {teamStats.map((team, idx) => (
            <tr 
              key={team.id} 
              onClick={() => navigate(`/team/${team.id}`)}
              style={{ 
                borderBottom: '1px solid var(--border-subtle)', 
                cursor: 'pointer', 
                transition: 'background 0.2s',
              }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--bg-elevated)'}
              onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <td style={{ padding: '15px', fontWeight: 'bold', fontSize: '18px', color: 'var(--text-muted)' }}>
                {idx + 1}
              </td>

              <td style={{ padding: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ 
                      fontSize: '28px', 
                      width: '50px', height: '50px', 
                      backgroundColor: 'var(--bg-elevated)', borderRadius: '50%', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: `2px solid ${team.color}`
                  }}>
                    {team.logo}
                  </div>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '18px', color: 'var(--text-primary)' }}>{team.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{team.desc}</div>
                  </div>
                </div>
              </td>

              <td style={{ padding: '15px', textAlign: 'center' }}>
                <div style={{ fontWeight: 'bold', color: getPrestigeColor(team.prestige) }}>
                   {team.prestige}
                </div>
              </td>

              <td style={{ padding: '15px', textAlign: 'center' }}>
                <span style={{ 
                    backgroundColor: 'var(--bg-elevated)', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', color: 'var(--text-primary)' 
                }}>
                   {team.avgOVR}
                </span>
              </td>

              <td style={{ padding: '15px', textAlign: 'center' }}>
                <div style={{fontWeight:'bold', color: 'var(--text-primary)'}}>{team.activeCount} <span style={{fontSize:'11px', color:'var(--text-muted)', fontWeight:'normal'}}>Active</span></div>
                {team.retiredCount > 0 && (
                    <div style={{fontSize:'11px', color:'var(--text-muted)'}}>{team.retiredCount} Retired</div>
                )}
              </td>

              <td style={{ padding: '15px', textAlign: 'center', fontSize: '18px', fontWeight: 'bold', color: '#e67e22' }}>
                {team.totalWins}
              </td>

              <td style={{ padding: '15px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold', color: '#27ae60', fontSize: '16px' }}>
                ${team.totalEarnings.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function getPrestigeColor(val: number) {
    if (val >= 90) return '#e74c3c';
    if (val >= 70) return '#f1c40f';
    if (val >= 50) return '#3498db';
    return '#95a5a6';
}
