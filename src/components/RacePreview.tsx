// src/components/RacePreview.tsx
import React from 'react';
import type { RaceEvent } from '../data/calendar';
import { db } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { getQualifiedEntrants, createDivisions, calculateOdds } from '../logic/matchmaking'; // <--- UPDATED IMPORTS

interface Props {
  race: RaceEvent;
  onClose: () => void;
  onRun?: () => void;
}

export function RacePreview({ race, onClose, onRun }: Props) {
  const allHorses = useLiveQuery(async () => {
    return await db.umas.toArray();
  });

  const teams = useLiveQuery(() => db.teams.toArray());

  if (!allHorses || !teams) {
    return (
      <div style={modalOverlay}>
        <div style={{ color: 'white' }}>Loading Field...</div>
      </div>
    );
  }

  // 1. GET QUALIFIED & SPLIT INTO DIVISIONS
  const qualified = getQualifiedEntrants(allHorses, race);
  const divisions = createDivisions(qualified);

  // 2. FLATTEN FOR DISPLAY
  // We take the divisions array [[Heat1], [Heat2]] and flatten it into a single list
  // but we attach the "Heat Number" to each horse so we can display it.
  const displayList = divisions.flatMap((field, divIndex) => 
    field.map(uma => {
       const score = (uma.stats.speed || 0) + (uma.stats.stamina || 0) + (uma.stats.power || 0);
       // Calculate odds relative to THEIR SPECIFIC HEAT, not the whole crowd
       const odds = calculateOdds(uma, field);
       
       return { 
         uma, 
         score, 
         odds, 
         division: divIndex + 1 
       };
    })
  );

  return (
    <div style={modalOverlay}>
      <div style={modalContent}>
        {/* HEADER */}
        <div style={{ backgroundColor: '#2c3e50', color: 'white', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>{race.location} • {race.distance}m • {race.surface}</div>
            <h2 style={{ margin: 0 }}>{race.name}</h2>
            {divisions.length > 1 && (
               <div style={{ fontSize: '12px', color: '#f1c40f', marginTop: '5px' }}>
                 ⚠️ High demand! Race split into {divisions.length} heats.
               </div>
            )}
          </div>
          <div style={{ 
            backgroundColor: race.grade === 'G1' ? '#3498db' : '#2ecc71',
            padding: '5px 10px', borderRadius: '4px', fontWeight: 'bold'
          }}>
            {race.grade}
          </div>
        </div>

        {/* ENTRY LIST */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f8f9fa', color: '#7f8c8d', fontSize: '12px', position: 'sticky', top: 0 }}>
              <tr>
                <th style={{ padding: '10px', textAlign: 'left' }}>Div</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>#</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Horse</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Team</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>Rating</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Odds</th>
              </tr>
            </thead>
            <tbody>
              {displayList.map((entry, idx) => {
                const { uma, score, odds, division } = entry;
                const team = teams.find(t => t.id === uma.teamId);
                const isPlayer = uma.teamId === 'player';
                
                return (
                  <tr key={uma.id} style={{ 
                    borderBottom: '1px solid #eee',
                    backgroundColor: isPlayer ? '#e8f6f3' : 'white'
                  }}>
                    {/* NEW: DIVISION COLUMN */}
                    <td style={{ padding: '10px', fontWeight: 'bold', color: '#7f8c8d' }}>
                      {division}
                    </td>
                    <td style={{ padding: '10px', color: '#95a5a6' }}>{idx + 1}</td>
                    <td style={{ padding: '10px' }}>
                      <div style={{ fontWeight: 'bold', color: isPlayer ? '#16a085' : '#2c3e50' }}>
                        {uma.firstName} {uma.lastName}
                      </div>
                    </td>
                    <td style={{ padding: '10px' }}>
                      {team ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span style={{ fontSize: '16px' }}>{team.logo}</span>
                          <span style={{ fontSize: '12px', color: '#7f8c8d' }}>{team.shortName}</span>
                        </div>
                      ) : <span style={{fontSize:'10px', color:'#ccc'}}>FA</span>}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center', fontSize: '12px', fontFamily: 'monospace', color: '#95a5a6' }}>
                       {Math.floor(score)}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', color: '#d35400', fontWeight: 'bold' }}>
                      {odds}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* FOOTER */}
        <div style={{ padding: '20px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={onClose} style={{ backgroundColor: '#95a5a6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' }}>Close</button>
          {onRun && (
            <button onClick={onRun} style={{ backgroundColor: '#27ae60', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>🏁 Run Race</button>
          )}
        </div>
      </div>
    </div>
  );
}

// Styles
const modalOverlay: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000,
  display: 'flex', justifyContent: 'center', alignItems: 'center'
};

const modalContent: React.CSSProperties = {
  backgroundColor: 'white', width: '800px', // Widened slightly for extra column
  maxHeight: '85vh',
  borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column'
};