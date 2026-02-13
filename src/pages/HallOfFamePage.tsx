// src/pages/HallOfFamePage.tsx
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Link } from 'react-router-dom';

export function HallOfFamePage() {
  const allUmas = useLiveQuery(() => db.umas.toArray());

  if (!allUmas) return <div>Loading Legends...</div>;

  const legends = allUmas.filter(u => u.trophies && u.trophies.includes("👑 Triple Crown"));
  const elites = allUmas.filter(u => 
    !legends.includes(u) && 
    (u.career.earnings >= 5000 || u.career.wins >= 5)
  );

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ color: '#f1c40f', textShadow: '2px 2px var(--bg-base)', fontSize: '3em', margin: 0 }}>
          🏆 HALL OF FAME
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>The Greatest Horse Girls in History</p>
      </div>

      {/* SECTION 1: TRIPLE CROWN LEGENDS */}
      {legends.length > 0 && (
        <div style={{ marginBottom: '50px' }}>
          <h2 style={{ borderBottom: '4px solid #f1c40f', paddingBottom: '10px', color: '#d35400' }}>
            👑 The Triple Crown Legends
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {legends.map(uma => (
              <div key={uma.id} style={cardStyleGold}>
                <div style={{ fontSize: '24px', marginBottom: '10px' }}>👑</div>
                <Link to={`/uma/${uma.id}`} style={linkStyle}>
                  {uma.firstName} {uma.lastName}
                </Link>
                <div style={{ marginTop: '10px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  {uma.career.wins} Wins | ${uma.career.earnings.toLocaleString()}
                </div>
                <div style={{ marginTop: '10px', fontWeight: 'bold', color: '#d35400' }}>
                  TRIPLE CROWN WINNER
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 2: ELITE PERFORMERS */}
      <h2 style={{ borderBottom: '2px solid var(--border-default)', paddingBottom: '10px', color: 'var(--text-primary)' }}>
        💎 Elite Performers
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
        {elites.length > 0 ? (
          elites.sort((a,b) => b.career.earnings - a.career.earnings).map(uma => (
            <div key={uma.id} style={cardStyleSilver}>
              <Link to={`/uma/${uma.id}`} style={linkStyle}>
                {uma.firstName} {uma.lastName}
              </Link>
              <div style={{ marginTop: '5px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                {uma.career.wins} Wins
              </div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#27ae60' }}>
                ${uma.career.earnings.toLocaleString()}
              </div>
            </div>
          ))
        ) : (
          <p style={{ color: 'var(--text-muted)' }}>No elite performers yet. Keep racing!</p>
        )}
      </div>
    </div>
  );
}

const cardStyleGold = {
  backgroundColor: 'var(--bg-surface)',
  border: '2px solid #f1c40f',
  borderRadius: '10px',
  padding: '20px',
  textAlign: 'center' as const,
  boxShadow: '0 4px 8px rgba(241, 196, 15, 0.2)'
};

const cardStyleSilver = {
  backgroundColor: 'var(--bg-surface)',
  border: '1px solid var(--border-default)',
  borderRadius: '8px',
  padding: '15px',
  textAlign: 'center' as const,
  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
};

const linkStyle = {
  textDecoration: 'none',
  color: 'var(--text-primary)',
  fontWeight: 'bold',
  fontSize: '18px'
};
