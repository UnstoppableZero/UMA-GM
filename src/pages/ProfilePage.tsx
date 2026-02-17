import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { calculateOVR, getOVRColor } from '../utils';
import type { RaceRecord } from '../types';

// --- DYNAMIC ACHIEVEMENT CALCULATOR ---
function calculateAchievements(history: RaceRecord[]) {
  const badges = [];
  
  // Helper: Check if they won a race containing "NamePart"
  const hasWon = (namePart: string) => history.some(h => h.raceName.includes(namePart) && h.rank === 1);

  // 1. CLASSIC TRIPLE CROWN (Satsuki Sho -> Derby -> Kikuka Sho)
  if (hasWon("Satsuki Sho") && (hasWon("Tokyo Yushun") || hasWon("Japanese Derby")) && hasWon("Kikuka Sho")) {
      badges.push({ label: "Triple Crown", icon: "👑", color: "#f1c40f", border: "#f39c12" });
  }

  // 2. FILLIES TRIPLE CROWN (Oka Sho -> Oaks -> Shuka Sho)
  if (hasWon("Oka Sho") && (hasWon("Yushun Himba") || hasWon("Japanese Oaks")) && hasWon("Shuka Sho")) {
      badges.push({ label: "Fillies' Triple Crown", icon: "🎀", color: "#ff69b4", border: "#d63384" });
  }

  // 3. GRAND PRIX (Arima + Takarazuka)
  if (hasWon("Arima Kinen") && hasWon("Takarazuka Kinen")) {
      badges.push({ label: "Grand Prix Master", icon: "🔥", color: "#e74c3c", border: "#c0392b" });
  }

  // 4. TENNO SHO SHIELD (Spring + Autumn)
  if (hasWon("Tenno Sho (Spring)") && hasWon("Tenno Sho (Autumn)")) {
      badges.push({ label: "Tenno Sho Supreme", icon: "🛡️", color: "#9b59b6", border: "#8e44ad" });
  }

  // 5. MILE KING (Yasuda + Mile CS)
  if (hasWon("Yasuda Kinen") && hasWon("Mile Championship")) {
      badges.push({ label: "Mile King", icon: "🌪️", color: "#3498db", border: "#2980b9" });
  }

  // 6. SPRINT KING (Takamatsunomiya + Sprinters Stakes)
  if (hasWon("Takamatsunomiya") && hasWon("Sprinters Stakes")) {
      badges.push({ label: "Sprint King", icon: "⚡", color: "#f39c12", border: "#e67e22" });
  }

  // 7. DIRT KING (Champions Cup + February Stakes)
  if (hasWon("Champions Cup") && hasWon("February Stakes")) {
      badges.push({ label: "Dirt King", icon: "🏜️", color: "#795548", border: "#5d4037" });
  }

  return badges;
}

export function ProfilePage() {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const uma = useLiveQuery(() => db.umas.get(id || ""));

  if (!uma) return <div style={{padding: '20px'}}>Loading Profile... (or Girl Retired)</div>;

  const ovr = calculateOVR(uma);
  const ovrColor = getOVRColor(ovr);

  // --- DERIVE RACING RECORD ---
  const history = uma.history || [];
  const starts = history.length;
  const wins = history.filter(h => h.rank === 1).length;
  const seconds = history.filter(h => h.rank === 2).length;
  const thirds = history.filter(h => h.rank === 3).length;
  const recordString = `${starts} (${wins}-${seconds}-${thirds})`;

  // --- CALCULATE ACHIEVEMENTS ---
  const achievements = calculateAchievements(history);

  // --- RADAR CHART MATH ---
  const renderRadarChart = () => {
    const size = 180;
    const center = size / 2;
    const radius = 70;
    const stats = [uma.stats.speed, uma.stats.stamina, uma.stats.power, uma.stats.guts, uma.stats.wisdom];
    const maxStat = 1200;

    const getPoint = (val: number, angleIndex: number) => {
      const angle = (Math.PI * 2 * angleIndex) / 5 - Math.PI / 2; 
      const r = (val / maxStat) * radius;
      return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
    };

    const statPolygon = stats.map((stat, i) => getPoint(stat, i)).join(' ');
    const bgPolygon = [1200, 1200, 1200, 1200, 1200].map((stat, i) => getPoint(stat, i)).join(' ');
    const midPolygon = [600, 600, 600, 600, 600].map((stat, i) => getPoint(stat, i)).join(' ');

    return (
      <div style={{ position: 'relative', width: `${size}px`, height: `${size}px`, margin: '0 auto' }}>
        <svg width={size} height={size}>
          <polygon points={bgPolygon} fill="#ecf0f1" stroke="#bdc3c7" strokeWidth="1" />
          <polygon points={midPolygon} fill="none" stroke="#bdc3c7" strokeWidth="1" strokeDasharray="3,3" />
          
          {[0, 1, 2, 3, 4].map(i => (
             <line key={i} x1={center} y1={center} x2={getPoint(1200, i).split(',')[0]} y2={getPoint(1200, i).split(',')[1]} stroke="#bdc3c7" strokeWidth="1" />
          ))}

          <polygon points={statPolygon} fill="rgba(52, 152, 219, 0.5)" stroke="#2980b9" strokeWidth="2" />
        </svg>
        <div style={{...radarLabelStyle, top: '-5px', left: '50%', transform: 'translateX(-50%)'}}>SPD</div>
        <div style={{...radarLabelStyle, top: '35%', right: '-5px'}}>STA</div>
        <div style={{...radarLabelStyle, bottom: '5px', right: '15px'}}>POW</div>
        <div style={{...radarLabelStyle, bottom: '5px', left: '15px'}}>GUT</div>
        <div style={{...radarLabelStyle, top: '35%', left: '-5px'}}>WIS</div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      
      {/* =========================================
          HEADER: THE OVR BANNER & VITALS
      ========================================= */}
      <div style={{ 
        backgroundColor: 'white', padding: '20px', borderRadius: '12px', 
        marginBottom: '20px', 
        borderLeft: `8px solid ${ovrColor}`, 
        boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
            {/* MASSIVE OVR BADGE */}
            <div style={{ 
                backgroundColor: ovrColor, color: 'white', 
                width: '75px', height: '75px', borderRadius: '12px',
                display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                boxShadow: `0 4px 10px ${ovrColor}40`
            }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', opacity: 0.9 }}>OVR</span>
                <span style={{ fontSize: '34px', fontWeight: '900', lineHeight: '1' }}>{ovr}</span>
            </div>

            <div>
                <h1 style={{ margin: '0 0 5px 0', color: '#2c3e50', fontSize: '32px' }}>{uma.firstName} {uma.lastName}</h1>
                <div style={{ fontSize: '15px', color: '#7f8c8d', display: 'flex', gap: '15px', fontWeight: 'bold', alignItems: 'center' }}>
                    <span>🎂 Age {uma.age}</span>
                    {/* UPDATED RECORD DISPLAY */}
                    <span style={{color: '#34495e'}}>🏆 {recordString}</span>
                    <span style={{color: '#27ae60'}}>💰 ${uma.career.earnings.toLocaleString()}</span>
                    {uma.injuryWeeks > 0 && (
                      <span style={{ backgroundColor: '#e74c3c', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>
                        🚑 INJURED ({uma.injuryWeeks}w)
                      </span>
                    )}
                </div>

                {/* VITALS BARS */}
                <div style={{ display: 'flex', gap: '20px', marginTop: '12px' }}>
                    <div style={{ width: '140px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', textTransform: 'uppercase', color: '#95a5a6', marginBottom: '4px', fontWeight: 'bold' }}>
                          <span>Energy</span>
                          <span>{uma.energy || 0}%</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', backgroundColor: '#eee', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${uma.energy || 0}%`, height: '100%', backgroundColor: (uma.energy || 0) < 40 ? '#f1c40f' : '#2ecc71', transition: 'width 0.3s ease' }} />
                        </div>
                    </div>
                    <div style={{ width: '140px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', textTransform: 'uppercase', color: '#95a5a6', marginBottom: '4px', fontWeight: 'bold' }}>
                          <span>Fatigue</span>
                          <span>{uma.fatigue || 0}%</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', backgroundColor: '#eee', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${uma.fatigue || 0}%`, height: '100%', backgroundColor: (uma.fatigue || 0) > 60 ? '#e74c3c' : '#3498db', transition: 'width 0.3s ease' }} />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <button 
            onClick={() => navigate(`/edit/${uma.id}`)}
            style={{ padding: '10px 20px', backgroundColor: '#34495e', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
        >
            ✏️ Edit DNA
        </button>
      </div>

      {/* =========================================
          TROPHY CASE (DYNAMICALLY CALCULATED)
      ========================================= */}
      {achievements.length > 0 && (
        <div style={{ backgroundColor: '#fff3cd', padding: '15px', marginBottom: '20px', borderRadius: '12px', border: '1px solid #ffeeba', textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#856404' }}>🏆 Major Titles</h3>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap' }}>
            {achievements.map((badge, idx) => (
              <div key={idx} style={{ 
                  display: 'flex', alignItems: 'center', gap: '8px',
                  backgroundColor: 'white', color: '#333', 
                  padding: '8px 16px', borderRadius: '50px',
                  border: `2px solid ${badge.border}`, 
                  boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                  fontWeight: 'bold', fontSize: '14px'
              }}>
                  <span style={{ fontSize: '18px' }}>{badge.icon}</span>
                  <span>{badge.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================
          MAIN GRID
      ========================================= */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* STATS & RADAR CARD */}
          <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <h3 style={sectionHeaderStyle}>📊 Core Attributes</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ flex: '0 0 180px' }}>
                    {renderRadarChart()}
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <StatBar label="Speed" val={uma.stats.speed} />
                    <StatBar label="Stamina" val={uma.stats.stamina} />
                    <StatBar label="Power" val={uma.stats.power} />
                    <StatBar label="Guts" val={uma.stats.guts} />
                    <StatBar label="Wisdom" val={uma.stats.wisdom} />
                </div>
            </div>
          </div>

          {/* APTITUDE MATRIX */}
          <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <h3 style={sectionHeaderStyle}>🧩 Aptitude Matrix</h3>
            
            <div style={aptGroupStyle}>
                <div style={aptLabelStyle}>Surface</div>
                <div style={aptBadgeContainerStyle}>
                    <AptBadge label="Turf" val={uma.aptitude.surface?.turf || 0} />
                    <AptBadge label="Dirt" val={uma.aptitude.surface?.dirt || 0} />
                </div>
            </div>

            <div style={aptGroupStyle}>
                <div style={aptLabelStyle}>Distance</div>
                <div style={aptBadgeContainerStyle}>
                    <AptBadge label="Short" val={uma.aptitude.distance?.short || 0} />
                    <AptBadge label="Mile" val={uma.aptitude.distance?.mile || 0} />
                    <AptBadge label="Medium" val={uma.aptitude.distance?.medium || 0} />
                    <AptBadge label="Long" val={uma.aptitude.distance?.long || 0} />
                </div>
            </div>

            <div style={aptGroupStyle}>
                <div style={aptLabelStyle}>Strategy</div>
                <div style={aptBadgeContainerStyle}>
                    <AptBadge label="Runner" val={uma.aptitude.strategy?.runner || 0} />
                    <AptBadge label="Leader" val={uma.aptitude.strategy?.leader || 0} />
                    <AptBadge label="Betweener" val={uma.aptitude.strategy?.betweener || 0} />
                    <AptBadge label="Chaser" val={uma.aptitude.strategy?.chaser || 0} />
                </div>
            </div>
          </div>

          {/* SKILLS */}
          <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <h3 style={sectionHeaderStyle}>⚡ Special Skills</h3>
              {uma.skills && uma.skills.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {uma.skills.map((skill, idx) => (
                    <div key={idx} style={{ borderLeft: '4px solid #f1c40f', backgroundColor: '#fdfbf2', padding: '12px', borderRadius: '0 6px 6px 0' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#2c3e50' }}>{skill.name}</div>
                        <div style={{ fontSize: '13px', color: '#7f8c8d', marginTop: '4px' }}>{skill.description}</div>
                    </div>
                ))}
                </div>
              ) : (
                <div style={{ color: '#95a5a6', fontStyle: 'italic' }}>No special skills acquired yet.</div>
              )}
          </div>

        </div>

        {/* RIGHT COLUMN: Game Log */}
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={sectionHeaderStyle}>📜 Race History Log</h3>
          
          {uma.history && uma.history.length > 0 ? (
            <div style={{ maxHeight: '700px', overflowY: 'auto', paddingRight: '10px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '2px solid #bdc3c7', color: '#7f8c8d' }}>
                    <th style={{ padding: '10px 5px' }}>Date</th>
                    <th style={{ padding: '10px 5px' }}>Event</th>
                    <th style={{ padding: '10px 5px', textAlign: 'center' }}>Finish</th>
                    <th style={{ padding: '10px 5px', textAlign: 'right' }}>Time</th>
                    </tr>
                </thead>
                <tbody>
                    {[...uma.history].reverse().map((race, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #ecf0f1' }}>
                        <td style={{ padding: '12px 5px', color: '#95a5a6', fontSize: '12px' }}>Y{race.year}-W{race.week}</td>
                        <td style={{ padding: '12px 5px', fontWeight: 'bold', color: '#34495e' }}>{race.raceName}</td>
                        <td style={{ padding: '12px 5px', textAlign: 'center' }}>
                            <span style={{ 
                                backgroundColor: getRankBgColor(race.rank), color: getRankTextColor(race.rank),
                                padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold', fontSize: '12px'
                            }}>
                                {race.rank === 1 ? '1st 🏆' : `${race.rank}${getOrdinalSuffix(race.rank)}`}
                            </span>
                        </td>
                        <td style={{ padding: '12px 5px', textAlign: 'right', fontFamily: 'monospace', color: '#7f8c8d' }}>
                            {formatTime(race.time)}
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
          ) : (
            <div style={{ color: '#95a5a6', padding: '20px', textAlign: 'center', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                Has not run an official race yet.
            </div>
          )}
        </div>

      </div>

      <div style={{ marginTop: '20px' }}>
        <Link to="/roster" style={{ color: '#3498db', textDecoration: 'none', fontWeight: 'bold' }}>← Back to Roster</Link>
      </div>
    </div>
  );
}

// Sub-components
const StatBar = ({ label, val }: { label: string, val: number }) => {
    let grade = 'G'; let color = '#bdc3c7';
    if (val >= 1000) { grade = 'S'; color = '#f1c40f'; }
    else if (val >= 800) { grade = 'A'; color = '#e67e22'; }
    else if (val >= 600) { grade = 'B'; color = '#3498db'; }
    else if (val >= 400) { grade = 'C'; color = '#2ecc71'; }
    
    const fillPct = Math.min((val / 1200) * 100, 100);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px', fontWeight: 'bold' }}>
                <span style={{ color: '#7f8c8d', textTransform: 'uppercase' }}>{label}</span>
                <span style={{ color }}>{grade} <span style={{color: '#2c3e50'}}>{Math.floor(val)}</span></span>
            </div>
            <div style={{ width: '100%', height: '8px', backgroundColor: '#ecf0f1', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${fillPct}%`, height: '100%', backgroundColor: color, borderRadius: '4px' }} />
            </div>
        </div>
    );
};

const AptBadge = ({ label, val }: { label: string, val: number }) => {
    let grade = "G"; let color = "#bdc3c7";
    if (val >= 8) { grade = "S"; color = "#f1c40f"; }
    else if (val >= 6) { grade = "A"; color = "#e67e22"; }
    else if (val >= 4) { grade = "B"; color = "#3498db"; }
    else if (val >= 2) { grade = "C"; color = "#2ecc71"; }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#f8f9fa', padding: '6px 12px', borderRadius: '6px', border: '1px solid #ecf0f1', minWidth: '45px' }}>
            <span style={{ fontSize: '11px', color: '#7f8c8d', textTransform: 'uppercase', marginBottom: '2px' }}>{label}</span>
            <span style={{ fontSize: '16px', fontWeight: '900', color }}>{grade}</span>
        </div>
    )
};

const formatTime = (rawSeconds?: number) => {
    if (!rawSeconds) return '-';
    const minutes = Math.floor(rawSeconds / 60);
    const seconds = (rawSeconds % 60).toFixed(2);
    return minutes > 0 ? `${minutes}:${seconds.padStart(5, '0')}` : `${seconds}s`;
};

const getRankBgColor = (rank: number) => {
    if (rank === 1) return '#f1c40f'; 
    if (rank === 2) return '#ecf0f1'; 
    if (rank === 3) return '#e67e22'; 
    return 'transparent';
};
const getRankTextColor = (rank: number) => {
    if (rank === 1) return 'white';
    if (rank === 2) return '#7f8c8d';
    if (rank === 3) return 'white';
    return '#95a5a6';
};
const getOrdinalSuffix = (i: number) => {
    const j = i % 10, k = i % 100;
    if (j === 1 && k !== 11) return "st";
    if (j === 2 && k !== 12) return "nd";
    if (j === 3 && k !== 13) return "rd";
    return "th";
};

const sectionHeaderStyle = { borderBottom: '2px solid #ecf0f1', paddingBottom: '10px', marginTop: 0, color: '#2c3e50' };
const radarLabelStyle = { position: 'absolute' as const, fontSize: '10px', fontWeight: 'bold', color: '#7f8c8d' };
const aptGroupStyle = { display: 'flex', alignItems: 'center', borderBottom: '1px solid #ecf0f1', padding: '10px 0' };
const aptLabelStyle = { width: '80px', fontWeight: 'bold', color: '#7f8c8d', fontSize: '13px', textTransform: 'uppercase' as const };
const aptBadgeContainerStyle = { display: 'flex', gap: '8px', flexWrap: 'wrap' as const };