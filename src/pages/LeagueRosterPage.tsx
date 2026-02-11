// src/pages/LeagueRosterPage.tsx
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Link } from 'react-router-dom'; 
import { useState, useMemo } from 'react';
import { calculateOVR, getOVRColor } from '../utils';
import type { Uma } from '../types';

export function LeagueRosterPage() {
  const roster = useLiveQuery(() => db.umas.toArray());
  const teams = useLiveQuery(() => db.teams.toArray());
  
  // --- STATE ---
  const [searchTerm, setSearchTerm] = useState('');
  const [teamFilter, setTeamFilter] = useState('all');
  const [sortKey, setSortKey] = useState<string>('ovr');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // --- POTENTIAL LOGIC ---
  const calculatePotential = (uma: Uma) => {
    const stats = [uma.stats.speed, uma.stats.stamina, uma.stats.power, uma.stats.guts, uma.stats.wisdom];
    const maxPossible = 1200 * 5;
    const currentTotal = stats.reduce((a, b) => a + b, 0);
    return Math.floor(((maxPossible - currentTotal) / maxPossible) * 100);
  };

  // --- LEAGUE LEADERS LOGIC ---
  const leaders = useMemo(() => {
    if (!roster || roster.length === 0) return null;
    const topOvr = [...roster].sort((a, b) => calculateOVR(b) - calculateOVR(a))[0];
    const topWins = [...roster].sort((a, b) => (b.career?.wins || 0) - (a.career?.wins || 0))[0];
    return { topOvr, topWins };
  }, [roster]);

  // --- SORTING & FILTERING LOGIC ---
  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const filteredRoster = useMemo(() => {
    if (!roster) return [];
    
    let filtered = roster.filter(u => {
      const matchesSearch = (u.firstName + ' ' + u.lastName).toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTeam = teamFilter === 'all' || u.teamId === teamFilter;
      return matchesSearch && matchesTeam;
    });

    return filtered.sort((a, b) => {
      let valA: any, valB: any;
      switch (sortKey) {
        case 'name': valA = a.firstName; valB = b.firstName; break;
        case 'ovr': valA = calculateOVR(a); valB = calculateOVR(b); break;
        case 'wins': valA = a.career?.wins || 0; valB = b.career?.wins || 0; break;
        case 'potential': valA = calculatePotential(a); valB = calculatePotential(b); break;
        case 'spd': valA = a.stats.speed; valB = b.stats.speed; break;
        case 'sta': valA = a.stats.stamina; valB = b.stats.stamina; break;
        case 'pow': valA = a.stats.power; valB = b.stats.power; break;
        default: valA = calculateOVR(a); valB = calculateOVR(b);
      }
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [roster, searchTerm, teamFilter, sortKey, sortDir]);

  if (!roster || !teams) return <div style={{padding: '20px'}}>Loading League Data...</div>;

  return (
    <div style={{ padding: '20px' }}>
      
      {/* LEAGUE LEADERS BANNER */}
      {leaders && (
        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
          <div style={leaderCardStyle('#f1c40f')}>
            <div style={leaderLabel}>✨ League Highest OVR</div>
            <div style={leaderName}>{leaders.topOvr.firstName} {leaders.topOvr.lastName}</div>
            <div style={leaderStat}>OVR {calculateOVR(leaders.topOvr)} • Team {leaders.topOvr.teamId}</div>
          </div>
          <div style={leaderCardStyle('#3498db')}>
            <div style={leaderLabel}>🏆 Most Career Wins</div>
            <div style={leaderName}>{leaders.topWins.firstName} {leaders.topWins.lastName}</div>
            <div style={leaderStat}>
                {leaders.topWins.career?.wins}-{ (leaders.topWins.career?.races || 0) - (leaders.topWins.career?.wins || 0) } 
                • Team {leaders.topWins.teamId}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ margin: 0, color: '#2c3e50' }}>🌎 League Roster</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="text" 
            placeholder="Search horse name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={inputStyle}
          />
          <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)} style={inputStyle}>
            <option value="all">All Teams</option>
            <option value="player">My Stable</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <thead style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #eee' }}>
          <tr>
            <th onClick={() => handleSort('name')} style={thStyle}>Name & Team</th>
            <th onClick={() => handleSort('ovr')} style={{...thStyle, textAlign: 'center'}}>OVR</th>
            <th onClick={() => handleSort('potential')} style={{...thStyle, textAlign: 'center'}}>POT</th>
            <th onClick={() => handleSort('wins')} style={{...thStyle, textAlign: 'center'}}>Record (W-L)</th>
            <th onClick={() => handleSort('spd')} style={{...thStyle, textAlign: 'center'}}>Spd</th>
            <th onClick={() => handleSort('sta')} style={{...thStyle, textAlign: 'center'}}>Sta</th>
            <th onClick={() => handleSort('pow')} style={{...thStyle, textAlign: 'center'}}>Pow</th>
          </tr>
        </thead>
        <tbody>
          {filteredRoster.map(uma => {
            const wins = uma.career?.wins || 0;
            const races = uma.career?.races || 0;
            const losses = races - wins;

            return (
              <tr key={uma.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px' }}>
                  <Link to={`/uma/${uma.id}`} style={{ textDecoration: 'none', color: '#2c3e50', fontWeight: 'bold' }}>
                      <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                          {getTeamBadge(uma.teamId)}
                          <div>
                              {uma.firstName} {uma.lastName}
                              <div style={{fontSize: '11px', color: '#95a5a6', fontWeight: 'normal'}}>
                                  {uma.teamId === 'player' ? 'Player Stable' : `Team ${uma.teamId}`}
                              </div>
                          </div>
                      </div>
                  </Link>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <span style={{ fontWeight: 'bold', color: getOVRColor(calculateOVR(uma)) }}>{calculateOVR(uma)}</span>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#8e44ad' }}>
                      {calculatePotential(uma)}%
                  </span>
                </td>
                <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#34495e' }}>
                  {wins}-{losses}
                </td>
                <td style={{ textAlign: 'center' }}>{renderGrade(uma.stats.speed)}</td>
                <td style={{ textAlign: 'center' }}>{renderGrade(uma.stats.stamina)}</td>
                <td style={{ textAlign: 'center' }}>{renderGrade(uma.stats.power)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// --- SHARED VISUAL HELPERS ---
const thStyle = { padding: '12px', textAlign: 'left' as const, fontSize: '12px', textTransform: 'uppercase' as const, cursor: 'pointer' };
const inputStyle = { padding: '8px', borderRadius: '4px', border: '1px solid #ddd' };

const leaderCardStyle = (color: string) => ({
    flex: 1, backgroundColor: 'white', padding: '15px', borderRadius: '8px', borderLeft: `5px solid ${color}`, boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
});
const leaderLabel = { fontSize: '11px', fontWeight: 'bold', color: '#7f8c8d', marginBottom: '5px' };
const leaderName = { fontSize: '18px', fontWeight: 'bold', color: '#2c3e50' };
const leaderStat = { fontSize: '13px', color: '#95a5a6', marginTop: '2px' };

function getTeamBadge(team?: string) {
  if (!team || team === 'player') return '🏠';
  const map: Record<string, string> = { 'Spica': '🌟', 'Rigil': '🦅', 'Canopus': '🛠️' };
  return <span style={{ fontSize: '16px' }}>{map[team] || '🏁'}</span>;
}

function renderGrade(val: number) {
  let grade = 'G'; let color = '#bdc3c7';
  if (val >= 1000) { grade = 'S'; color = '#f1c40f'; }
  else if (val >= 800) { grade = 'A'; color = '#e67e22'; }
  else if (val >= 600) { grade = 'B'; color = '#3498db'; }
  else if (val >= 400) { grade = 'C'; color = '#2ecc71'; }
  return <span style={{ color: color, fontWeight: 'bold' }}>{grade}</span>;
}