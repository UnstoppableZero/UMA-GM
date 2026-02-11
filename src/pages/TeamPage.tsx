// src/pages/TeamPage.tsx
import { useParams, Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { calculateOVR, getOVRColor } from '../utils';

export function TeamPage() {
  const { id } = useParams();
  const team = useLiveQuery(() => db.teams.get(id || ""));
  // Find all horses belonging to this team
  const roster = useLiveQuery(
    () => db.umas.where('teamId').equals(id || "").toArray(),
    [id]
  );

  if (!team || !roster) return <div>Loading Team Data...</div>;

  const activeRoster = roster.filter(u => u.status === 'active');
  const retiredRoster = roster.filter(u => u.status === 'retired');

  // Stats
  const totalWins = roster.reduce((acc, u) => acc + (u.career?.wins || 0), 0);
  const totalEarnings = roster.reduce((acc, u) => acc + (u.career?.earnings || 0), 0);

  return (
    <div>
      {/* TEAM HEADER */}
      <div style={{ 
        backgroundColor: 'white', padding: '30px', borderRadius: '8px', marginBottom: '20px',
        borderTop: `6px solid ${team.color}`, boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
        display: 'flex', alignItems: 'center', gap: '20px'
      }}>
        <div style={{ fontSize: '64px' }}>{team.logo}</div>
        <div>
           <h1 style={{ margin: '0 0 5px 0', color: '#2c3e50' }}>{team.name}</h1>
           <div style={{ color: '#7f8c8d', fontSize: '14px' }}>
              Est. 1988 | Prestige: <b style={{color: '#f1c40f'}}>{team.prestige}</b> | Total Wins: <b>{totalWins}</b>
           </div>
           <div style={{ fontSize: '14px', marginTop: '5px', fontStyle: 'italic', color: '#95a5a6' }}>
             "{team.history?.earnings ? `Total Earnings: $${team.history.earnings.toLocaleString()}` : `Current Earnings: $${totalEarnings.toLocaleString()}`}"
           </div>
        </div>
      </div>

      {/* ACTIVE ROSTER */}
      <h3 style={{ borderBottom: '2px solid #ddd', paddingBottom: '10px' }}>Active Roster ({activeRoster.length})</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px', marginBottom: '40px' }}>
        {activeRoster.map(uma => (
          <Link key={uma.id} to={`/uma/${uma.id}`} style={{ textDecoration: 'none' }}>
            <div style={{ 
              backgroundColor: 'white', padding: '15px', borderRadius: '8px', 
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #eee',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
               <div>
                 <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>{uma.firstName} {uma.lastName}</div>
                 <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                    {uma.career.wins} Wins | ${uma.career.earnings.toLocaleString()}
                 </div>
               </div>
               
               {/* OVR BADGE */}
               <div style={{ 
                 backgroundColor: getOVRColor(calculateOVR(uma)), color: 'white', 
                 padding: '5px 10px', borderRadius: '5px', fontWeight: 'bold' 
               }}>
                 {calculateOVR(uma)}
               </div>
            </div>
          </Link>
        ))}
      </div>

      {/* RETIRED LEGENDS */}
      {retiredRoster.length > 0 && (
        <>
          <h3 style={{ borderBottom: '2px solid #ddd', paddingBottom: '10px', color: '#7f8c8d' }}>Retired Legends</h3>
          <ul style={{ color: '#666' }}>
            {retiredRoster.map(u => (
               <li key={u.id}>
                 <Link to={`/uma/${u.id}`} style={{color: '#3498db', fontWeight: 'bold', textDecoration: 'none'}}>
                    {u.firstName} {u.lastName}
                 </Link> 
                 - {u.career.wins} Wins (OVR: {calculateOVR(u)})
               </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}