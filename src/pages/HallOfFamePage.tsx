// src/pages/HallOfFamePage.tsx
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Link } from 'react-router-dom';
import { calculateOVR } from '../utils';

// SYNCHRONIZED G1 LIST
// Matches the exact 'name' strings from calendar.ts
const G1_NAMES = [
    // FEBRUARY
    "February Stakes",
    
    // MARCH
    "Takamatsunomiya Kinen", "Osaka Hai",
    
    // APRIL
    "Oka Sho", "Satsuki Sho", "Tenno Sho (Spring)",
    
    // MAY
    "NHK Mile Cup", "Victoria Mile", "Yushun Himba", "Tokyo Yushun",
    
    // JUNE
    "Yasuda Kinen", "Takarazuka Kinen",
    
    // SEPTEMBER
    "Sprinters Stakes",
    
    // OCTOBER
    "Shuka Sho", "Kikuka Sho", "Tenno Sho (Autumn)",
    
    // NOVEMBER
    "Queen Elizabeth II", // Matches calendar.ts (was "Cup")
    "Mile Championship", 
    "Japan Cup", 
    
    // DECEMBER
    "Champions Cup", 
    "Hanshin JF",         // Matches calendar.ts (was "Juvenile Fillies")
    "Asahi Hai FS",       // Matches calendar.ts (was "Futurity Stakes")
    "Arima Kinen", 
    "Hopeful Stakes"
];

export function HallOfFamePage() {
  const allUmas = useLiveQuery(() => db.umas.toArray());

  if (!allUmas) return <div style={{padding:'20px', color: 'white'}}>Loading Hall of Fame...</div>;

  // 1. SAFETY FILTER: Only Retired
  const retired = allUmas.filter(u => u && u.status === 'retired');

  // 2. PROCESS STATS
  const processed = retired.map(u => {
      const history = u.history || [];
      
      const g1Wins = history.filter(h => {
          if (h.rank !== 1) return false;
          
          const name = h.raceName || "";
          
          // Check 1: Explicit "G1" tag in name (if your race recorder saves it)
          if (name.includes("G1") || name.includes("Grade 1")) return true;
          
          // Check 2: Exact Match or Partial Match against Calendar List
          return G1_NAMES.some(g1 => name.includes(g1));
      }).length;

      const earnings = u.career?.earnings || 0;
      const wins = u.career?.wins || 0;
      const trophies = u.trophies || [];

      return { ...u, g1Wins, safeEarnings: earnings, safeWins: wins, safeTrophies: trophies };
  });

  // 3. TIER LOGIC
  const legends = processed.filter(u => 
      u.safeTrophies.includes("👑 Triple Crown") ||
      u.safeEarnings >= 120000 ||
      u.g1Wins >= 6
  ).sort((a,b) => b.safeEarnings - a.safeEarnings);

  const champions = processed.filter(u => 
      !legends.includes(u) && 
      u.g1Wins > 0
  ).sort((a,b) => b.safeEarnings - a.safeEarnings);

  const veterans = processed.filter(u => 
      !legends.includes(u) && 
      !champions.includes(u) &&
      u.safeEarnings >= 30000
  ).sort((a,b) => b.safeEarnings - a.safeEarnings);

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ color: '#f1c40f', textShadow: '2px 2px #000', fontSize: '3em', margin: 0 }}>
          🏆 HALL OF FAME
        </h1>
        <p style={{ color: '#bdc3c7' }}>The Greatest Horse Girls in History</p>
      </div>

      {/* LEGENDS */}
      {legends.length > 0 && (
        <div style={{ marginBottom: '50px' }}>
          <h2 style={{ borderBottom: '4px solid #f1c40f', color: '#f1c40f' }}>👑 The Pantheon</h2>
          <div style={gridStyle}>
            {legends.map(uma => (
              <div key={uma.id} style={cardStyleGold}>
                <div style={{ fontSize: '24px' }}>👑</div>
                <Link to={`/uma/${uma.id}`} style={{...linkStyle, color: '#f1c40f'}}>
                  {uma.firstName} {uma.lastName}
                </Link>
                <div style={subTextStyle}>Ret. Age {uma.age}</div>
                <div style={{marginTop:'10px', color: '#2ecc71', fontWeight:'bold'}}>${uma.safeEarnings.toLocaleString()}</div>
                <div style={{color: '#e74c3c', fontWeight:'bold'}}>{uma.g1Wins} G1 Wins</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CHAMPIONS */}
      {champions.length > 0 && (
        <div style={{ marginBottom: '50px' }}>
            <h2 style={{ borderBottom: '2px solid #e74c3c', color: '#e74c3c' }}>🏆 G1 Champions</h2>
            <div style={gridStyle}>
                {champions.map(uma => (
                <div key={uma.id} style={cardStyleSilver}>
                    <div style={{position:'absolute', top:5, right:10}}>🏆</div>
                    <Link to={`/uma/${uma.id}`} style={linkStyle}>
                    {uma.firstName} {uma.lastName}
                    </Link>
                    <div style={{marginTop:'5px', color:'#e74c3c', fontWeight:'bold'}}>{uma.g1Wins} G1 Wins</div>
                    <div style={{color:'#2ecc71'}}>${uma.safeEarnings.toLocaleString()}</div>
                </div>
                ))}
            </div>
        </div>
      )}

      {/* VETERANS */}
      {veterans.length > 0 && (
        <div>
          <h2 style={{ borderBottom: '2px solid #95a5a6', color: '#95a5a6' }}>⭐ Distinguished Veterans</h2>
          <div style={gridStyle}>
            {veterans.map(uma => (
              <div key={uma.id} style={cardStyleBronze}>
                <Link to={`/uma/${uma.id}`} style={{...linkStyle, fontSize:'16px'}}>
                  {uma.firstName} {uma.lastName}
                </Link>
                <div style={{marginTop:'5px', color:'#2ecc71'}}>${uma.safeEarnings.toLocaleString()}</div>
                <div style={subTextStyle}>{uma.safeWins} Wins</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px', marginTop: '15px' };
const linkStyle = { textDecoration: 'none', color: 'white', fontWeight: 'bold', fontSize: '18px', display: 'block' };
const subTextStyle = { fontSize: '12px', color: '#bdc3c7', marginTop: '2px' };
const cardBase = { backgroundColor: '#2c3e50', borderRadius: '10px', padding: '15px', textAlign: 'center' as const, position: 'relative' as const };
const cardStyleGold = { ...cardBase, border: '2px solid #f1c40f', boxShadow: '0 0 15px rgba(241, 196, 15, 0.2)' };
const cardStyleSilver = { ...cardBase, border: '1px solid #e74c3c' };
const cardStyleBronze = { ...cardBase, border: '1px solid #7f8c8d' };