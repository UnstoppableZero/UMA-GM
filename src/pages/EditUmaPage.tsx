// src/pages/EditUmaPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../db';
import { SKILL_DATABASE } from '../skills'; 

// DEFAULTS TO PREVENT CRASHES
const DEFAULT_STATS = { speed: 600, stamina: 600, power: 600, guts: 400, wisdom: 400 };
const DEFAULT_APTITUDE = {
  surface: { turf: 1, dirt: 1 },    
  distance: { short: 1, mile: 1, medium: 1, long: 1 },
  strategy: { runner: 1, leader: 1, betweener: 1, chaser: 1 }
};

export function EditUmaPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // FORM STATE
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [color, setColor] = useState('#e91e63'); 
  
  // STATS
  const [stats, setStats] = useState(DEFAULT_STATS);

  // APTITUDES
  const [aptitude, setAptitude] = useState(DEFAULT_APTITUDE);

  // SKILLS (Now supports 2 slots)
  const [skill1, setSkill1] = useState<string>("");
  const [skill2, setSkill2] = useState<string>("");

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

      setFirstName(uma.firstName || '');
      setLastName(uma.lastName || '');
      // @ts-ignore
      setColor(uma.color || '#e91e63');
      
      setStats(uma.stats || DEFAULT_STATS);

      setAptitude({
          surface: { ...DEFAULT_APTITUDE.surface, ...(uma.aptitude?.surface || {}) },
          distance: { ...DEFAULT_APTITUDE.distance, ...(uma.aptitude?.distance || {}) },
          strategy: { ...DEFAULT_APTITUDE.strategy, ...(uma.aptitude?.strategy || {}) }
      });
      
      // LOAD SKILLS INTO SLOTS
      if (uma.skills && uma.skills.length > 0) {
        setSkill1(uma.skills[0]?.id || "");
        setSkill2(uma.skills[1]?.id || "");
      }
      
      setLoading(false);
    };
    loadData();
  }, [id, navigate]);

  const handleSave = async () => {
    if (!id) return;
    if (!firstName || !lastName) return alert("Name is required!");

    // Combine skills from both slots
    const newSkills = [];
    if (skill1) {
        const s1 = SKILL_DATABASE.find(s => s.id === skill1);
        if (s1) newSkills.push(s1);
    }
    if (skill2) {
        const s2 = SKILL_DATABASE.find(s => s.id === skill2);
        if (s2) newSkills.push(s2);
    }

    await db.umas.update(id, {
      firstName,
      lastName,
      // @ts-ignore
      color, 
      stats,
      aptitude,
      skills: newSkills
    });

    navigate(`/uma/${id}`); 
  };

  if (loading) return <div style={{color:'white'}}>Loading genetic data...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ borderBottom: '4px solid #333', paddingBottom: '10px', color: '#ecf0f1' }}>🧬 Edit DNA: {firstName}</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
        {/* LEFT COL: IDENTITY & STATS */}
        <div style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '8px', border: '1px solid #333' }}>
          <h3 style={{color:'#f1c40f'}}>Identity</h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <input placeholder="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} style={inputStyle} />
            <input placeholder="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} style={inputStyle} />
          </div>
          <div style={{ marginBottom: '20px' }}>
             <label style={{color:'#bdc3c7'}}>Uniform Color: </label>
             <input type="color" value={color} onChange={e => setColor(e.target.value)} />
          </div>

          <h3 style={{color:'#3498db'}}>Attributes</h3>
          {Object.keys(stats).map((key) => (
            <div key={key} style={{ marginBottom: '10px' }}>
              <label style={{ display: 'inline-block', width: '80px', textTransform: 'capitalize', color:'#bdc3c7' }}>{key}</label>
              {/* @ts-ignore */}
              <input type="number" value={stats[key]} onChange={e => setStats({...stats, [key]: Number(e.target.value)})} style={{ width: '60px', marginRight: '10px', backgroundColor: '#333', color: 'white', border: '1px solid #555' }} />
              {/* @ts-ignore */}
              <input type="range" min="100" max="1200" value={stats[key]} onChange={e => setStats({...stats, [key]: Number(e.target.value)})} />
            </div>
          ))}

           <h3 style={{color:'#9b59b6'}}>Skills</h3>
           
           {/* SKILL SLOT 1 */}
           <div style={{ marginBottom: '10px' }}>
             <label style={{display:'block', marginBottom:'5px', fontSize:'12px', color:'#bdc3c7'}}>Skill Slot 1</label>
             <select 
               value={skill1}
               onChange={(e) => setSkill1(e.target.value)}
               style={{ width: '100%', padding: '8px', fontSize: '14px', backgroundColor: '#333', color: 'white', border: '1px solid #555' }}
             >
               <option value="">(Empty)</option>
               {SKILL_DATABASE.map(s => (
                 <option key={s.id} value={s.id}>{s.name} ({s.type})</option>
               ))}
             </select>
           </div>

           {/* SKILL SLOT 2 */}
           <div>
             <label style={{display:'block', marginBottom:'5px', fontSize:'12px', color:'#bdc3c7'}}>Skill Slot 2</label>
             <select 
               value={skill2}
               onChange={(e) => setSkill2(e.target.value)}
               style={{ width: '100%', padding: '8px', fontSize: '14px', backgroundColor: '#333', color: 'white', border: '1px solid #555' }}
             >
               <option value="">(Empty)</option>
               {SKILL_DATABASE.map(s => (
                 <option key={s.id} value={s.id}>{s.name} ({s.type})</option>
               ))}
             </select>
           </div>

        </div>

        {/* RIGHT COL: APTITUDES */}
        <div style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '8px', border: '1px solid #333' }}>
          <h3 style={{color:'#e67e22'}}>Aptitudes</h3>
          
          <h4 style={{color:'#bdc3c7', borderBottom:'1px solid #333'}}>Surface</h4>
          <AptitudeRow label="Turf" val={aptitude.surface.turf} setVal={(v) => setAptitude({...aptitude, surface: {...aptitude.surface, turf: v}})} />
          <AptitudeRow label="Dirt" val={aptitude.surface.dirt} setVal={(v) => setAptitude({...aptitude, surface: {...aptitude.surface, dirt: v}})} />

          <h4 style={{color:'#bdc3c7', borderBottom:'1px solid #333', marginTop:'15px'}}>Distance</h4>
          <AptitudeRow label="Short" val={aptitude.distance.short} setVal={(v) => setAptitude({...aptitude, distance: {...aptitude.distance, short: v}})} />
          <AptitudeRow label="Mile" val={aptitude.distance.mile} setVal={(v) => setAptitude({...aptitude, distance: {...aptitude.distance, mile: v}})} />
          <AptitudeRow label="Medium" val={aptitude.distance.medium} setVal={(v) => setAptitude({...aptitude, distance: {...aptitude.distance, medium: v}})} />
          <AptitudeRow label="Long" val={aptitude.distance.long} setVal={(v) => setAptitude({...aptitude, distance: {...aptitude.distance, long: v}})} />

          <h4 style={{color:'#bdc3c7', borderBottom:'1px solid #333', marginTop:'15px'}}>Strategy</h4>
          <AptitudeRow label="Runner" val={aptitude.strategy.runner} setVal={(v) => setAptitude({...aptitude, strategy: {...aptitude.strategy, runner: v}})} />
          <AptitudeRow label="Leader" val={aptitude.strategy.leader} setVal={(v) => setAptitude({...aptitude, strategy: {...aptitude.strategy, leader: v}})} />
          <AptitudeRow label="Betweener" val={aptitude.strategy.betweener} setVal={(v) => setAptitude({...aptitude, strategy: {...aptitude.strategy, betweener: v}})} />
          <AptitudeRow label="Chaser" val={aptitude.strategy.chaser} setVal={(v) => setAptitude({...aptitude, strategy: {...aptitude.strategy, chaser: v}})} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        <button onClick={() => navigate(`/uma/${id}`)} style={{ ...btnStyle, backgroundColor: '#7f8c8d' }}>Cancel</button>
        <button onClick={handleSave} style={{ ...btnStyle, backgroundColor: '#2ecc71' }}>💾 SAVE CHANGES</button>
      </div>
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
const btnStyle = { flex: 1, padding: '15px', color: 'white', fontSize: '18px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };