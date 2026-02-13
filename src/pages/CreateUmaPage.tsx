// src/pages/CreateUmaPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../db';
import type { Uma } from '../types';
import { SKILL_DATABASE } from '../skills'; 

export function CreateUmaPage() {
  const navigate = useNavigate();

  // FORM STATE
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [color, setColor] = useState('#e91e63'); 
  
  // STATS (Default to C rank average)
  const [stats, setStats] = useState({
    speed: 600, stamina: 600, power: 600, guts: 400, wisdom: 400
  });

  // APTITUDES (Default to A for Turf/Mile)
  const [aptitude, setAptitude] = useState({
    surface: { turf: 8, dirt: 1 },     
    distance: { short: 1, mile: 8, medium: 8, long: 1 },
    strategy: { runner: 1, leader: 8, betweener: 8, chaser: 1 }
  });

  // SKILL SELECTION
  const [selectedSkillId, setSelectedSkillId] = useState<string>("");

  const handleSave = async () => {
    if (!firstName || !lastName) return alert("Name is required!");

    const newUma: Uma = {
        id: crypto.randomUUID(),
        firstName,
        lastName,
        // @ts-ignore
        color,
        age: 3, 
        status: 'active',
        stats,
        aptitude,
        skills: selectedSkillId ? [SKILL_DATABASE.find(s => s.id === selectedSkillId)!] : [],
        
        // --- ADDED MISSING PROPERTIES ---
        condition: 100,    // Good Motivation
        energy: 100,       // Full Energy
        fatigue: 0,        // Zero Fatigue
        injuryWeeks: 0,    // Healthy
        // --------------------------------

        career: { races: 0, wins: 0, top3: 0, earnings: 0 },
        history: [],
        trophies: [],
        teamId: 'player' // Auto-assign to your stable
    };

    await db.umas.add(newUma);
    navigate('/'); // Redirect to Dashboard
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ borderBottom: '4px solid #333', paddingBottom: '10px', color: '#ecf0f1' }}>🧬 Genetic Lab (God Mode)</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
        {/* LEFT COL: IDENTITY & STATS */}
        <div style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '8px', border: '1px solid #333' }}>
          <h3 style={{color: '#f1c40f'}}>Identity</h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <input placeholder="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} style={inputStyle} />
            <input placeholder="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} style={inputStyle} />
          </div>
          <div style={{ marginBottom: '20px' }}>
             <label style={{color: '#bdc3c7'}}>Uniform Color: </label>
             <input type="color" value={color} onChange={e => setColor(e.target.value)} />
          </div>

          <h3 style={{color: '#3498db'}}>Base Attributes (0-1200)</h3>
          {Object.keys(stats).map((key) => (
            <div key={key} style={{ marginBottom: '10px' }}>
              <label style={{ display: 'inline-block', width: '80px', textTransform: 'capitalize', color: '#bdc3c7' }}>{key}</label>
              {/* @ts-ignore */}
              <input type="number" value={stats[key]} onChange={e => setStats({...stats, [key]: Number(e.target.value)})} style={{ width: '60px', marginRight: '10px', backgroundColor: '#333', color: 'white', border: '1px solid #555' }} />
              {/* @ts-ignore */}
              <input type="range" min="100" max="1200" value={stats[key]} onChange={e => setStats({...stats, [key]: Number(e.target.value)})} />
            </div>
          ))}

           <h3 style={{color: '#9b59b6'}}>Starting Skill</h3>
           <select 
             value={selectedSkillId}
             onChange={(e) => setSelectedSkillId(e.target.value)}
             style={{ width: '100%', padding: '8px', fontSize: '14px', backgroundColor: '#333', color: 'white', border: '1px solid #555' }}
           >
             <option value="">(None)</option>
             {SKILL_DATABASE.map(s => (
               <option key={s.id} value={s.id}>{s.name} ({s.type})</option>
             ))}
           </select>
        </div>

        {/* RIGHT COL: APTITUDES */}
        <div style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '8px', border: '1px solid #333' }}>
          <h3 style={{color: '#e67e22'}}>Aptitudes (1=G, 8=A, 10=S)</h3>
          
          <h4 style={{color: '#bdc3c7', borderBottom: '1px solid #333'}}>Surface</h4>
          <AptitudeRow label="Turf" val={aptitude.surface.turf} setVal={(v) => setAptitude({...aptitude, surface: {...aptitude.surface, turf: v}})} />
          <AptitudeRow label="Dirt" val={aptitude.surface.dirt} setVal={(v) => setAptitude({...aptitude, surface: {...aptitude.surface, dirt: v}})} />

          <h4 style={{color: '#bdc3c7', borderBottom: '1px solid #333', marginTop: '15px'}}>Distance</h4>
          <AptitudeRow label="Short" val={aptitude.distance.short} setVal={(v) => setAptitude({...aptitude, distance: {...aptitude.distance, short: v}})} />
          <AptitudeRow label="Mile" val={aptitude.distance.mile} setVal={(v) => setAptitude({...aptitude, distance: {...aptitude.distance, mile: v}})} />
          <AptitudeRow label="Medium" val={aptitude.distance.medium} setVal={(v) => setAptitude({...aptitude, distance: {...aptitude.distance, medium: v}})} />
          <AptitudeRow label="Long" val={aptitude.distance.long} setVal={(v) => setAptitude({...aptitude, distance: {...aptitude.distance, long: v}})} />

          <h4 style={{color: '#bdc3c7', borderBottom: '1px solid #333', marginTop: '15px'}}>Strategy</h4>
          <AptitudeRow label="Runner" val={aptitude.strategy.runner} setVal={(v) => setAptitude({...aptitude, strategy: {...aptitude.strategy, runner: v}})} />
          <AptitudeRow label="Leader" val={aptitude.strategy.leader} setVal={(v) => setAptitude({...aptitude, strategy: {...aptitude.strategy, leader: v}})} />
          <AptitudeRow label="Betweener" val={aptitude.strategy.betweener} setVal={(v) => setAptitude({...aptitude, strategy: {...aptitude.strategy, betweener: v}})} />
          <AptitudeRow label="Chaser" val={aptitude.strategy.chaser} setVal={(v) => setAptitude({...aptitude, strategy: {...aptitude.strategy, chaser: v}})} />
        </div>
      </div>

      <button onClick={handleSave} style={{
        marginTop: '20px', width: '100%', padding: '15px', 
        backgroundColor: '#2ecc71', color: 'white', fontSize: '18px', 
        border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
      }}>
        ✨ INCUBATE NEW HORSE GIRL
      </button>
    </div>
  );
}

// Helper Components
const AptitudeRow = ({ label, val, setVal }: { label: string, val: number, setVal: (n: number) => void }) => (
  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px', color: '#ecf0f1' }}>
    <span style={{ width: '80px' }}>{label}</span>
    <input type="range" min="1" max="10" value={val} onChange={e => setVal(Number(e.target.value))} style={{ marginRight: '10px' }} />
    <span style={{ fontWeight: 'bold', color: val >= 8 ? '#f1c40f' : 'inherit' }}>{val >= 10 ? 'S' : val >= 8 ? 'A' : val >= 6 ? 'B' : val >= 4 ? 'C' : 'G'}</span>
  </div>
);

const inputStyle = { padding: '10px', fontSize: '16px', borderRadius: '4px', border: '1px solid #555', width: '100%', backgroundColor: '#333', color: 'white' };