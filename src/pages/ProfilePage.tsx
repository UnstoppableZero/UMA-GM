// src/pages/ProfilePage.tsx
import { useParams, Link, useNavigate } from 'react-router-dom'; // Added useNavigate
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';

export function ProfilePage() {
  const { id } = useParams(); 
  const navigate = useNavigate(); // Hook for navigation
  const uma = useLiveQuery(() => db.umas.get(id || ""));

  if (!uma) return <div>Loading Profile... (or Girl Retired)</div>;

  return (
    <div>
      {/* HEADER: Name & Bio */}
      <div style={{ 
        backgroundColor: 'white', padding: '20px', borderRadius: '8px', 
        marginBottom: '20px', 
        // @ts-ignore
        borderLeft: `5px solid ${uma.color || '#e91e63'}`, // Dynamic Color!
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center' // Flex layout
      }}>
        {/* Left Side: Info */}
        <div>
            <div style={{ fontSize: '14px', color: '#7f8c8d' }}>
            Age {uma.age} | {uma.career.wins} Wins | Earnings: ${uma.career.earnings.toLocaleString()}
            </div>
            <h1 style={{ margin: '5px 0', color: '#2c3e50' }}>{uma.firstName} {uma.lastName}</h1>
        </div>

        {/* Right Side: Edit Button */}
        <button 
            onClick={() => navigate(`/edit/${uma.id}`)}
            style={{
            padding: '10px 20px', 
            backgroundColor: '#34495e', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px', 
            cursor: 'pointer', 
            fontWeight: 'bold',
            fontSize: '14px'
            }}
        >
            ✏️ Edit DNA
        </button>
      </div>

      {/* TROPHY CASE */}
      {uma.trophies && uma.trophies.length > 0 && (
        <div style={{ 
          backgroundColor: '#fff3cd', 
          padding: '15px', 
          marginBottom: '20px', 
          borderRadius: '8px', 
          border: '1px solid #ffeeba',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#856404' }}>🏆 Trophy Case</h3>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap' }}>
            {uma.trophies.map((trophy, idx) => (
              <span key={idx} style={{ 
                fontSize: '16px', fontWeight: 'bold', 
                backgroundColor: 'white', padding: '5px 15px', 
                borderRadius: '20px', boxShadow: '0 2px 2px rgba(0,0,0,0.1)'
              }}>
                {trophy}
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
        {/* LEFT COLUMN: Stats & Skills */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px' }}>
          
          {/* SKILLS SECTION */}
          <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px', marginTop: 0 }}>⚡ Skills</h3>
          {uma.skills && uma.skills.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '30px' }}>
              {uma.skills.map((skill, idx) => (
                <div key={idx} style={{ 
                  backgroundColor: '#f1c40f', 
                  color: '#2c3e50',
                  padding: '10px', 
                  borderRadius: '6px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{skill.name}</div>
                  <div style={{ fontSize: '12px', opacity: 0.9 }}>{skill.description}</div>
                </div>
              ))}
            </div>
          ) : (
             <div style={{ color: '#999', fontStyle: 'italic', marginBottom: '30px' }}>No special skills yet.</div>
          )}

          <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px' }}>📊 Attributes</h3>
          <table style={{ width: '100%' }}>
            <tbody>
              <tr><td>Speed</td><td><b>{uma.stats.speed}</b></td></tr>
              <tr><td>Stamina</td><td><b>{uma.stats.stamina}</b></td></tr>
              <tr><td>Power</td><td><b>{uma.stats.power}</b></td></tr>
              <tr><td>Guts</td><td><b>{uma.stats.guts}</b></td></tr>
              <tr><td>Wisdom</td><td><b>{uma.stats.wisdom}</b></td></tr>
            </tbody>
          </table>
          
          <h3 style={{ marginTop: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>🧩 Aptitudes</h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
             <span style={badgeStyle}>Turf: {getGrade(uma.aptitude.surface.turf)}</span>
             <span style={badgeStyle}>Dist: {getGrade(uma.aptitude.distance.medium)}</span>
             <span style={badgeStyle}>Strat: {getGrade(uma.aptitude.strategy.leader)}</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Game Log */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px' }}>
          <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px', marginTop: 0 }}>📜 Race History</h3>
          
          {uma.history && uma.history.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
                  <th style={{ padding: '8px' }}>Year</th>
                  <th style={{ padding: '8px' }}>Race</th>
                  <th style={{ padding: '8px' }}>Place</th>
                </tr>
              </thead>
              <tbody>
                {[...uma.history].reverse().map((race, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '8px', color: '#7f8c8d' }}>Y{race.year}-W{race.week}</td>
                    <td style={{ padding: '8px' }}>{race.raceName}</td>
                    <td style={{ padding: '8px', fontWeight: 'bold', color: getRankColor(race.rank) }}>
                      {race.rank === 1 ? '🏆 1st' : `${race.rank}th`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: '#999' }}>No races run yet.</p>
          )}
        </div>

      </div>

      <div style={{ marginTop: '20px' }}>
        <Link to="/roster" style={{ color: '#3498db', textDecoration: 'none' }}>← Back to Roster</Link>
      </div>
    </div>
  );
}

// Helpers
const badgeStyle = {
  backgroundColor: '#ecf0f1', padding: '5px 10px', borderRadius: '15px', fontSize: '12px'
};

function getGrade(val: number) {
  if (val >= 8) return "S";
  if (val >= 6) return "A";
  if (val >= 4) return "B";
  return "C";
}

const getRankColor = (rank: number) => {
    if (rank === 1) return '#f1c40f'; // Gold
    if (rank === 2) return '#bdc3c7'; // Silver
    if (rank === 3) return '#e67e22'; // Bronze
    return '#333';
};