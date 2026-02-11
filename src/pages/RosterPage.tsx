// src/pages/RosterPage.tsx
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Link, useNavigate } from 'react-router-dom'; 
import { useState, useEffect } from 'react';
import { calculateOVR, getOVRColor } from '../utils';

export function RosterPage() {
  const navigate = useNavigate(); 
  const roster = useLiveQuery(() => db.umas.toArray());
  const gameState = useLiveQuery(() => db.gameState.get(1));
  const [showRetired, setShowRetired] = useState(false);

  // AUTO-FIX: Run this once to clean up the long names in your database
  useEffect(() => {
    const cleanNames = async () => {
      if (!roster) return;
      const needsUpdate = roster.filter(u => u.lastName.includes('('));
      if (needsUpdate.length > 0) {
        const updates = needsUpdate.map(u => ({
          ...u,
          lastName: u.lastName.replace(/\s*\(.*?\)\s*/g, '') // Remove (TeamName)
        }));
        await db.umas.bulkPut(updates);
        console.log("🧹 Cleaned up " + updates.length + " names.");
      }
    };
    cleanNames();
  }, [roster]);

  if (!roster || !gameState) return <div>Loading Stable Data...</div>;

  const displayedRoster = roster.filter(u => showRetired ? u.status === 'retired' : u.status === 'active');

  return (
    <div>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '15px', borderBottom: '2px solid #ddd' }}>
        <div>
          <h2 style={{ color: '#2c3e50', margin: 0 }}>
            {showRetired ? "Retired Legends" : "Active Stable"}
          </h2>
          <span style={{ color: '#7f8c8d' }}>
            {displayedRoster.length} Girls {showRetired ? "(Retired)" : "(Ready to Race)"}
          </span>
          <div style={{ marginTop: '5px' }}>
            <label style={{ cursor: 'pointer', userSelect: 'none', fontSize: '14px', color: '#666' }}>
              <input 
                type="checkbox" 
                checked={showRetired} 
                onChange={(e) => setShowRetired(e.target.checked)} 
                style={{ marginRight: '8px' }}
              />
              Show Retired
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}> 
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#27ae60', marginRight: '15px' }}>
            Bank: ${gameState.money.toLocaleString()}
          </div>
          {!showRetired && (
            <>
              <button onClick={() => navigate('/scout')} style={actionBtnStyle('#2980b9')}>🔭 Scout</button>
              <button onClick={() => navigate('/create')} style={actionBtnStyle('#8e44ad')}>🧬 God Mode</button>
            </>
          )}
        </div>
      </div>

      {/* ROSTER TABLE */}
      <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', fontSize: '14px' }}>
        <thead style={{ backgroundColor: '#f8f9fa', color: '#7f8c8d', borderBottom: '2px solid #eee' }}>
          <tr>
            <th style={thStyle}>Name</th>
            <th style={thStyle}>OVR</th>
            <th style={thStyle}>Age</th>
            <th style={thStyle}>Record</th>
            <th style={thStyle}>Spd</th>
            <th style={thStyle}>Sta</th>
            <th style={thStyle}>Pow</th>
            <th style={thStyle}>Gut</th>
            <th style={thStyle}>Wis</th>
            <th style={thStyle}>Action</th>
          </tr>
        </thead>
        <tbody>
          {displayedRoster.map(uma => (
            <tr key={uma.id} style={{ borderBottom: '1px solid #eee' }}>
              
              {/* NAME */}
              <td style={{ padding: '12px' }}>
                <Link to={`/uma/${uma.id}`} style={{ textDecoration: 'none', color: '#2c3e50', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {getTeamBadge(uma.team)}
                  <span>{uma.firstName} {uma.lastName}</span>
                  {uma.trophies?.includes("👑 Triple Crown") && <span title="Triple Crown">👑</span>}
                </Link>
              </td>

              {/* OVR (The Big Number) */}
              <td style={{ textAlign: 'center' }}>
                <span style={{ 
                  fontWeight: '900', fontSize: '16px', 
                  color: getOVRColor(calculateOVR(uma)),
                  backgroundColor: '#f4f4f4', padding: '4px 8px', borderRadius: '4px'
                }}>
                  {calculateOVR(uma)}
                </span>
              </td>

              <td style={{ textAlign: 'center', color: '#7f8c8d' }}>{uma.age}</td>
              <td style={{ textAlign: 'center', fontSize: '12px' }}>
                <div>{uma.career?.wins || 0} Wins</div>
                <div style={{color:'#27ae60'}}>${(uma.career?.earnings || 0).toLocaleString()}</div>
              </td>

              {/* STAT GRADES (Replaces the raw numbers) */}
              <td style={{ textAlign: 'center' }}>{renderGrade(uma.stats.speed)}</td>
              <td style={{ textAlign: 'center' }}>{renderGrade(uma.stats.stamina)}</td>
              <td style={{ textAlign: 'center' }}>{renderGrade(uma.stats.power)}</td>
              <td style={{ textAlign: 'center' }}>{renderGrade(uma.stats.guts)}</td>
              <td style={{ textAlign: 'center' }}>{renderGrade(uma.stats.wisdom)}</td>

              <td style={{ textAlign: 'center' }}>
                <button onClick={() => { if(confirm("Delete this horse?")) db.umas.delete(uma.id) }} 
                  style={{ color: '#e74c3c', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// --- VISUAL HELPERS ---

const thStyle = { padding: '10px', textAlign: 'left' as const, fontWeight: '600', fontSize: '12px', textTransform: 'uppercase' as const };

const actionBtnStyle = (bgColor: string) => ({
  padding: '8px 16px', backgroundColor: bgColor, color: 'white', 
  border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px'
});

function getTeamBadge(team?: string) {
  if (!team || team === 'Player') return null;
  const map: Record<string, string> = { 'Spica': '🌟', 'Rigil': '🦅', 'Canopus': '🛠️' };
  return <span style={{ fontSize: '16px' }} title={`Team ${team}`}>{map[team] || '🏁'}</span>;
}

// Convert 0-1200 stats into readable Grades (S, A, B...)
function renderGrade(val: number) {
  let grade = 'G';
  let color = '#bdc3c7'; // Grey

  if (val >= 1200) { grade = 'SS'; color = '#e056fd'; } // Rainbow/Pink
  else if (val >= 1000) { grade = 'S'; color = '#f1c40f'; } // Gold
  else if (val >= 800) { grade = 'A'; color = '#e67e22'; } // Orange
  else if (val >= 600) { grade = 'B'; color = '#3498db'; } // Blue
  else if (val >= 400) { grade = 'C'; color = '#2ecc71'; } // Green

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <span style={{ color: color, fontWeight: '900', fontSize: '16px' }}>{grade}</span>
      <span style={{ color: '#bdc3c7', fontSize: '10px' }}>{val}</span>
    </div>
  );
}