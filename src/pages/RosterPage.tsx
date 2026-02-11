// src/pages/RosterPage.tsx
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Link, useNavigate } from 'react-router-dom'; 
import { useState, useEffect, useMemo } from 'react';
import { calculateOVR, getOVRColor } from '../utils';

export function RosterPage() {
  const navigate = useNavigate(); 
  const roster = useLiveQuery(() => db.umas.toArray());
  const gameState = useLiveQuery(() => db.gameState.get(1));
  
  // --- STATE ---
  const [showRetired, setShowRetired] = useState(false);
  const [sortKey, setSortKey] = useState<string>('ovr');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // AUTO-FIX: Run this once to clean up the long names in your database
  useEffect(() => {
    const cleanNames = async () => {
      if (!roster) return;
      const needsUpdate = roster.filter(u => u.lastName.includes('('));
      if (needsUpdate.length > 0) {
        const updates = needsUpdate.map(u => ({
          ...u,
          lastName: u.lastName.replace(/\s*\(.*?\)\s*/g, '') 
        }));
        await db.umas.bulkPut(updates);
        console.log("🧹 Cleaned up " + updates.length + " names.");
      }
    };
    cleanNames();
  }, [roster]);

  // --- SORTING LOGIC ---
  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc'); // Default to highest first for new sorts
    }
  };

  const displayedRoster = useMemo(() => {
    if (!roster) return [];
    
    // 1. Filter
    // 1. Filter to ONLY show the player's horses
    let filtered = roster.filter(u => u.teamId === 'player');
    
    // Then filter by active/retired
    filtered = filtered.filter(u => showRetired ? u.status === 'retired' : u.status === 'active');

    // 2. Sort
    return filtered.sort((a, b) => {
      let valA: any, valB: any;

      switch (sortKey) {
        case 'name': valA = a.firstName; valB = b.firstName; break;
        case 'ovr': valA = calculateOVR(a); valB = calculateOVR(b); break;
        case 'age': valA = a.age; valB = b.age; break;
        case 'wins': valA = a.career?.wins || 0; valB = b.career?.wins || 0; break;
        case 'earnings': valA = a.career?.earnings || 0; valB = b.career?.earnings || 0; break;
        case 'spd': valA = a.stats.speed; valB = b.stats.speed; break;
        case 'sta': valA = a.stats.stamina; valB = b.stats.stamina; break;
        case 'pow': valA = a.stats.power; valB = b.stats.power; break;
        case 'gut': valA = a.stats.guts; valB = b.stats.guts; break;
        case 'wis': valA = a.stats.wisdom; valB = b.stats.wisdom; break;
        default: valA = calculateOVR(a); valB = calculateOVR(b);
      }

      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [roster, showRetired, sortKey, sortDir]);

  if (!roster || !gameState) return <div>Loading Stable Data...</div>;

  // --- RENDER HELPERS ---
  const SortableHeader = ({ label, sortValue }: { label: string, sortValue: string }) => (
    <th 
      onClick={() => handleSort(sortValue)}
      style={{ ...thStyle, cursor: 'pointer', userSelect: 'none' }}
      title={`Sort by ${label}`}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: sortValue === 'name' ? 'flex-start' : 'center', gap: '5px' }}>
        {label}
        {sortKey === sortValue && (
          <span style={{ color: '#3498db', fontSize: '10px' }}>
            {sortDir === 'asc' ? '▲' : '▼'}
          </span>
        )}
      </div>
    </th>
  );

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
            <SortableHeader label="Name" sortValue="name" />
            <SortableHeader label="OVR" sortValue="ovr" />
            <SortableHeader label="Age" sortValue="age" />
            <SortableHeader label="Record" sortValue="earnings" />
            <SortableHeader label="Spd" sortValue="spd" />
            <SortableHeader label="Sta" sortValue="sta" />
            <SortableHeader label="Pow" sortValue="pow" />
            <SortableHeader label="Gut" sortValue="gut" />
            <SortableHeader label="Wis" sortValue="wis" />
            <th style={{...thStyle, textAlign: 'center'}}>Action</th>
          </tr>
        </thead>
        <tbody>
          {displayedRoster.map(uma => (
            <tr key={uma.id} style={{ borderBottom: '1px solid #eee' }}>
              
              {/* NAME & BADGES */}
              <td style={{ padding: '12px' }}>
                <Link to={`/uma/${uma.id}`} style={{ textDecoration: 'none', color: '#2c3e50', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {getTeamBadge(uma.teamId)}
                  <div>
                    <div style={{ fontSize: '15px' }}>
                        {uma.firstName} {uma.lastName} 
                        {uma.trophies?.includes("👑 Triple Crown") && <span title="Triple Crown"> 👑</span>}
                    </div>
                    {/* APTITUDE BADGES */}
                    <div style={{ marginTop: '4px', display: 'flex', gap: '4px' }}>
                        <span style={badgeStyle('#2ecc71')}>{getBestAptitude(uma.aptitude?.surface || {turf: 10}).toUpperCase()}</span>
                        <span style={badgeStyle('#e67e22')}>{getBestAptitude(uma.aptitude?.distance || {mile: 10}).toUpperCase()}</span>
                        <span style={badgeStyle('#9b59b6')}>{getBestAptitude(uma.aptitude?.strategy || {runner: 10}).toUpperCase()}</span>
                    </div>
                  </div>
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
                <div style={{ fontWeight: 'bold' }}>{uma.career?.wins || 0} Wins</div>
                <div style={{ color: '#27ae60' }}>${(uma.career?.earnings || 0).toLocaleString()}</div>
              </td>

              {/* STAT GRADES */}
              <td style={{ textAlign: 'center' }}>{renderGrade(uma.stats.speed)}</td>
              <td style={{ textAlign: 'center' }}>{renderGrade(uma.stats.stamina)}</td>
              <td style={{ textAlign: 'center' }}>{renderGrade(uma.stats.power)}</td>
              <td style={{ textAlign: 'center' }}>{renderGrade(uma.stats.guts)}</td>
              <td style={{ textAlign: 'center' }}>{renderGrade(uma.stats.wisdom)}</td>

              <td style={{ textAlign: 'center' }}>
                <button onClick={() => { if(confirm("Delete this horse?")) db.umas.delete(uma.id) }} 
                  style={{ color: '#e74c3c', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}
                  title="Release Horse">
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

// Safely extracts the highest aptitude trait even if older saves are missing data
const getBestAptitude = (aptObj?: Record<string, number>) => {
  if (!aptObj || Object.keys(aptObj).length === 0) return 'N/A';
  return Object.keys(aptObj).reduce((a, b) => aptObj[a] > aptObj[b] ? a : b);
};

const thStyle = { padding: '10px', textAlign: 'left' as const, fontWeight: '600', fontSize: '12px', textTransform: 'uppercase' as const };

const badgeStyle = (bgColor: string) => ({
  backgroundColor: bgColor, color: 'white', fontSize: '9px', padding: '2px 4px',
  borderRadius: '3px', fontWeight: 'bold' as const, letterSpacing: '0.5px'
});

const actionBtnStyle = (bgColor: string) => ({
  padding: '8px 16px', backgroundColor: bgColor, color: 'white', 
  border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px'
});

function getTeamBadge(team?: string) {
  if (!team || team === 'player') return null; 
  const map: Record<string, string> = { 'Spica': '🌟', 'Rigil': '🦅', 'Canopus': '🛠️' };
  return <span style={{ fontSize: '18px' }} title={`Team ${team}`}>{map[team] || '🏁'}</span>;
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
      <span style={{ color: '#bdc3c7', fontSize: '10px', fontWeight: 'bold' }}>{Math.floor(val)}</span>
    </div>
  );
}