// src/pages/ScoutPage.tsx
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { generateUma } from '../generator';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Uma } from '../types';

export function ScoutPage() {
  const navigate = useNavigate();
  const gameState = useLiveQuery(() => db.gameState.get(1));
  const roster = useLiveQuery(() => db.umas.toArray());
  const [selectedParentId, setSelectedParentId] = useState<string>("");

  if (!gameState || !roster) return <div>Loading...</div>;

  // Filter: Only Retired girls can be parents
  const retiredLegends = roster.filter(u => u.status === 'retired');

  const handleScout = async () => {
    const COST = 3000;
    if (gameState.money < COST) {
      alert("Not enough money!");
      return;
    }

    // Find the parent object if one is selected
    const parent = retiredLegends.find(u => u.id === selectedParentId);

    // Generate the new girl (with inheritance if parent exists)
    const newGirl = generateUma(parent);

    // Transaction
    await db.gameState.update(1, { money: gameState.money - COST });
    await db.umas.add(newGirl);

    alert(`Scouted ${newGirl.firstName} ${newGirl.lastName}!\nShe inherited stats from ${parent ? parent.lastName : "nobody"}.`);
    navigate('/roster');
  };

  return (
    <div>
      <h2 style={{ color: '#2c3e50' }}>🏢 Scouting Center</h2>
      <p>Cost: <b style={{ color: '#27ae60' }}>$3,000</b> | Bank: ${gameState.money.toLocaleString()}</p>

      <div style={{ display: 'flex', gap: '40px', marginTop: '30px' }}>
        
        {/* LEFT: Choose Parent */}
        <div style={{ flex: 1 }}>
          <h3>1. Select a Mentor (Optional)</h3>
          <p style={{ fontSize: '14px', color: '#666' }}>
            Choose a retired legend to pass on her stats (Inheritance Factor: 20%).
          </p>
          
          <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #ccc', borderRadius: '5px' }}>
            {retiredLegends.length === 0 && <div style={{padding: 20}}>No retired legends available yet.</div>}
            
            {retiredLegends.map(uma => (
              <div 
                key={uma.id} 
                onClick={() => setSelectedParentId(uma.id)}
                style={{
                  padding: '10px',
                  borderBottom: '1px solid #eee',
                  cursor: 'pointer',
                  backgroundColor: selectedParentId === uma.id ? '#d1e7dd' : 'white', // Highlight selection
                  fontWeight: selectedParentId === uma.id ? 'bold' : 'normal'
                }}
              >
                {uma.firstName} {uma.lastName} 
                <span style={{ fontSize: '12px', color: '#888', marginLeft: '10px' }}>
                  (Spd: {uma.stats.speed} / Wins: {uma.career.wins})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Confirm */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <h3>2. Sign the Contract</h3>
          <div style={{ fontSize: '50px', marginBottom: '20px' }}>✍️</div>
          
          <button 
            onClick={handleScout}
            disabled={gameState.money < 3000}
            style={{
              padding: '20px 40px',
              fontSize: '20px',
              backgroundColor: '#2980b9',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: gameState.money >= 3000 ? 'pointer' : 'not-allowed',
              opacity: gameState.money >= 3000 ? 1 : 0.5
            }}
          >
            Scout New Rookie
          </button>
        </div>

      </div>
    </div>
  );
}