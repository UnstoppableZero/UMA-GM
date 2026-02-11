// src/pages/LeaguePage.tsx
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { useNavigate } from 'react-router-dom';

export function LeaguePage() {
  const navigate = useNavigate();
  // Fetch all teams and all horses to calculate stats dynamically
  const teams = useLiveQuery(() => db.teams.toArray());
  const umas = useLiveQuery(() => db.umas.toArray());

  if (!teams || !umas) return <div style={{ padding: '20px' }}>Loading League Data...</div>;

  // 1. COMPUTE STATS
  // We map over every team and count their wins/earnings from the 'umas' table
  const teamStats = teams.map(team => {
    // Filter horses belonging to this team
    const roster = umas.filter(u => u.teamId === team.id);
    
    // Sum up career stats
    const totalWins = roster.reduce((sum, u) => sum + (u.career?.wins || 0), 0);
    const totalEarnings = roster.reduce((sum, u) => sum + (u.career?.earnings || 0), 0);
    const activeCount = roster.filter(u => u.status === 'active').length;
    const retiredCount = roster.filter(u => u.status === 'retired').length;

    // Calculate Average OVR of active roster (Team Strength)
    const totalOVR = roster
      .filter(u => u.status === 'active')
      .reduce((sum, u) => {
        const ovr = (u.stats.speed + u.stats.stamina + u.stats.power + u.stats.guts + u.stats.wisdom) / 55;
        return sum + ovr;
      }, 0);
    const avgOVR = activeCount > 0 ? Math.floor(totalOVR / activeCount) : 0;
    
    return { ...team, totalWins, totalEarnings, activeCount, retiredCount, avgOVR };
  });

  // 2. SORTING (Default: Total Wins descending)
  teamStats.sort((a, b) => b.totalWins - a.totalWins);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '4px solid #2c3e50', paddingBottom: '10px' }}>
        <div>
            <h1 style={{ margin: 0, color: '#2c3e50' }}>🏆 League Standings</h1>
            <span style={{ color: '#7f8c8d' }}>{teams.length} Registered Teams</span>
        </div>
        
        {/* Helper Note */}
        <div style={{ fontSize: '14px', color: '#95a5a6', fontStyle: 'italic' }}>
           Click a team to view their roster
        </div>
      </div>

      {/* STANDINGS TABLE */}
      <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', borderRadius: '8px', overflow: 'hidden' }}>
        <thead style={{ backgroundColor: '#34495e', color: 'white' }}>
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
              onClick={() => navigate(`/team/${team.id}`)} // <--- LINK TO DETAIL PAGE
              style={{ 
                borderBottom: '1px solid #eee', 
                cursor: 'pointer', 
                transition: 'background 0.2s',
              }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = '#f8f9fa'}
              onMouseOut={e => e.currentTarget.style.backgroundColor = 'white'}
            >
              {/* RANK */}
              <td style={{ padding: '15px', fontWeight: 'bold', fontSize: '18px', color: '#bdc3c7' }}>
                {idx + 1}
              </td>

              {/* TEAM IDENTITY */}
              <td style={{ padding: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ 
                      fontSize: '28px', 
                      width: '50px', height: '50px', 
                      backgroundColor: '#f1f2f6', borderRadius: '50%', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: `2px solid ${team.color}`
                  }}>
                    {team.logo}
                  </div>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#2c3e50' }}>{team.name}</div>
                    <div style={{ fontSize: '12px', color: '#95a5a6' }}>{team.desc}</div>
                  </div>
                </div>
              </td>

              {/* PRESTIGE */}
              <td style={{ padding: '15px', textAlign: 'center' }}>
                <div style={{ fontWeight: 'bold', color: getPrestigeColor(team.prestige) }}>
                   {team.prestige}
                </div>
              </td>

               {/* TEAM STRENGTH (AVG OVR) */}
               <td style={{ padding: '15px', textAlign: 'center' }}>
                <span style={{ 
                    backgroundColor: '#ecf0f1', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', color: '#2c3e50' 
                }}>
                   {team.avgOVR}
                </span>
              </td>

              {/* ROSTER COUNT */}
              <td style={{ padding: '15px', textAlign: 'center' }}>
                <div style={{fontWeight:'bold'}}>{team.activeCount} <span style={{fontSize:'11px', color:'#999', fontWeight:'normal'}}>Active</span></div>
                {team.retiredCount > 0 && (
                    <div style={{fontSize:'11px', color:'#95a5a6'}}>{team.retiredCount} Retired</div>
                )}
              </td>

              {/* WINS */}
              <td style={{ padding: '15px', textAlign: 'center', fontSize: '18px', fontWeight: 'bold', color: '#e67e22' }}>
                {team.totalWins}
              </td>

              {/* EARNINGS */}
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

// Helper for coloring Prestige numbers
function getPrestigeColor(val: number) {
    if (val >= 90) return '#e74c3c'; // Elite (Red)
    if (val >= 70) return '#f1c40f'; // Strong (Gold)
    if (val >= 50) return '#3498db'; // Avg (Blue)
    return '#95a5a6'; // Low (Grey)
}