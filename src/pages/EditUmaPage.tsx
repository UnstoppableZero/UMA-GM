// src/pages/EditUmaPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../db';
import { SKILL_DATABASE } from '../skills'; 

export function EditUmaPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // FORM STATE
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [color, setColor] = useState('#e91e63'); 
  
  // STATS
  const [stats, setStats] = useState({
    speed: 600, stamina: 600, power: 600, guts: 400, wisdom: 400
  });

  // APTITUDES
  const [aptitude, setAptitude] = useState({
    surface: { turf: 1, dirt: 1 },    
    distance: { short: 1, mile: 1, medium: 1, long: 1 },
    strategy: { runner: 1, leader: 1, betweener: 1, chaser: 1 }
  });

  // SKILL
  const [selectedSkillId, setSelectedSkillId] = useState<string>("");

  // LOAD DATA ON MOUNT
  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      const uma = await db.umas.get(id);
      if (!uma) {
        alert("Horse girl not found!");
        navigate('/roster');
        return;
      }

      setFirstName(uma.firstName);
      setLastName(uma.lastName);
      // @ts-ignore
      setColor(uma.color || '#e91e63');
      setStats(uma.stats);
      setAptitude(uma.aptitude);
      
      // Pre-select the first skill if she has one
      if (uma.skills && uma.skills.length > 0) {
        setSelectedSkillId(uma.skills[0].id);
      }
      
      setLoading(false);
    };
    loadData();
  }, [id, navigate]);

  const handleSave = async () => {
    if (!id) return;
    if (!firstName || !lastName) return alert("Name is required!");

    const updatedSkill = selectedSkillId 
      ? [SKILL_DATABASE.find(s => s.id === selectedSkillId)!] 
      : [];

    await db.umas.update(id, {
      firstName,
      lastName,
      // @ts-ignore
      color, 
      stats,
      aptitude,
      skills: updatedSkill
    });

    navigate(`/uma/${id}`); // Go back to her profile
  };

  if (loading) return <div>Loading genetic data...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ borderBottom: '4px solid #333', paddingBottom: '10px' }}>🧬 Edit DNA: {firstName}</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
        {/* LEFT COL: IDENTITY & STATS */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px' }}>
          <h3>Identity</h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <input placeholder="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} style={inputStyle} />
            <input placeholder="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} style={inputStyle} />
          </div>
          <div style={{ marginBottom: '20px' }}>
             <label>Uniform Color: </label>
             <input type="color" value={color} onChange={e => setColor(e.target.value)} />
          </div>

          <h3>Attributes</h3>
          {Object.keys(stats).map((key) => (
            <div key={key} style={{ marginBottom: '10px' }}>
              <label style={{ display: 'inline-block', width: '80px', textTransform: 'capitalize' }}>{key}</label>
              {/* @ts-ignore */}
              <input type="number" value={stats[key]} onChange={e => setStats({...stats, [key]: Number(e.target.value)})} style={{ width: '60px' }} />
              {/* @ts-ignore */}
              <input type="range" min="100" max="1200" value={stats[key]} onChange={e => setStats({...stats, [key]: Number(e.target.value)})} />
            </div>
          ))}

           <h3>Primary Skill</h3>
           <select 
             value={selectedSkillId}
             onChange={(e) => setSelectedSkillId(e.target.value)}
             style={{ width: '100%', padding: '8px', fontSize: '14px' }}
           >
             <option value="">(None)</option>
             {SKILL_DATABASE.map(s => (
               <option key={s.id} value={s.id}>{s.name} ({s.type})</option>
             ))}
           </select>
        </div>

        {/* RIGHT COL: APTITUDES */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px' }}>
          <h3>Aptitudes</h3>
          
          <h4>Surface</h4>
          <AptitudeRow label="Turf" val={aptitude.surface.turf} setVal={(v) => setAptitude({...aptitude, surface: {...aptitude.surface, turf: v}})} />
          <AptitudeRow label="Dirt" val={aptitude.surface.dirt} setVal={(v) => setAptitude({...aptitude, surface: {...aptitude.surface, dirt: v}})} />

          <h4>Distance</h4>
          <AptitudeRow label="Short" val={aptitude.distance.short} setVal={(v) => setAptitude({...aptitude, distance: {...aptitude.distance, short: v}})} />
          <AptitudeRow label="Mile" val={aptitude.distance.mile} setVal={(v) => setAptitude({...aptitude, distance: {...aptitude.distance, mile: v}})} />
          <AptitudeRow label="Medium" val={aptitude.distance.medium} setVal={(v) => setAptitude({...aptitude, distance: {...aptitude.distance, medium: v}})} />
          <AptitudeRow label="Long" val={aptitude.distance.long} setVal={(v) => setAptitude({...aptitude, distance: {...aptitude.distance, long: v}})} />

          <h4>Strategy</h4>
          <AptitudeRow label="Runner" val={aptitude.strategy.runner} setVal={(v) => setAptitude({...aptitude, strategy: {...aptitude.strategy, runner: v}})} />
          <AptitudeRow label="Leader" val={aptitude.strategy.leader} setVal={(v) => setAptitude({...aptitude, strategy: {...aptitude.strategy, leader: v}})} />
          <AptitudeRow label="Betweener" val={aptitude.strategy.betweener} setVal={(v) => setAptitude({...aptitude, strategy: {...aptitude.strategy, betweener: v}})} />
          <AptitudeRow label="Chaser" val={aptitude.strategy.chaser} setVal={(v) => setAptitude({...aptitude, strategy: {...aptitude.strategy, chaser: v}})} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        <button onClick={() => navigate(`/uma/${id}`)} style={{ ...btnStyle, backgroundColor: '#95a5a6' }}>Cancel</button>
        <button onClick={handleSave} style={{ ...btnStyle, backgroundColor: '#2ecc71' }}>💾 SAVE CHANGES</button>
      </div>
    </div>
  );
}

// Helper Components
const AptitudeRow = ({ label, val, setVal }: { label: string, val: number, setVal: (n: number) => void }) => (
  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
    <span style={{ width: '80px' }}>{label}</span>
    <input type="range" min="1" max="10" value={val} onChange={e => setVal(Number(e.target.value))} style={{ marginRight: '10px' }} />
    <span style={{ fontWeight: 'bold' }}>{val >= 10 ? 'S' : val >= 8 ? 'A' : val >= 6 ? 'B' : val >= 4 ? 'C' : 'G'}</span>
  </div>
);

const inputStyle = { padding: '10px', fontSize: '16px', borderRadius: '4px', border: '1px solid #ccc', width: '100%' };
const btnStyle = { flex: 1, padding: '15px', color: 'white', fontSize: '18px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };