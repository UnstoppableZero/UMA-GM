// src/components/RaceViewer.tsx
import React, { useEffect, useRef, useState } from 'react';
import type { RaceOutcome } from '../race';
import { TRACKS } from '../tracks';
import type { Location } from '../schedule';
import type { Uma } from '../types';

interface Props {
  outcome: RaceOutcome;
  onClose: () => void;
  location?: Location; 
  distance?: number;
  surface?: 'Turf' | 'Dirt';
}

const getVisualStrategy = (uma: Uma) => {
    const s = uma.stats;
    if (s.stamina > 600 && s.power > 600) return 'betweener';
    if (s.speed > 800) return 'runner';
    if (s.power > 800) return 'chaser';
    return 'leader';
};

const getVisualProgress = (pct: number, strategy: string) => {
    if (pct >= 1) return 1;
    if (pct <= 0) return 0;
    if (strategy === 'runner') return Math.pow(pct, 0.85);
    if (strategy === 'chaser') return Math.pow(pct, 1.25);
    if (strategy === 'betweener') return Math.pow(pct, 1.1);
    return pct;
};

// Interface for the real-time leaderboard
interface LiveHorseStatus {
    id: string;
    name: string;
    distanceTraveled: number;
    color: string;
}

export function RaceViewer({ outcome, onClose, location = 'Tokyo', distance, surface }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const trackConfig = TRACKS[location] || TRACKS['Tokyo'];
  const raceDistance = distance || (outcome as any).raceDistance || 2000;
  const raceSurface = surface || 'Turf';

  const [finished, setFinished] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [speed, setSpeed] = useState(1); 
  const speedRef = useRef(1);
  const [isTheaterMode, setIsTheaterMode] = useState(false); 
  
  const [showResults, setShowResults] = useState(false);
  const [currentCommentary, setCurrentCommentary] = useState("");
  const [skillCutIn, setSkillCutIn] = useState<{name: string, text: string} | null>(null);

  // LIVE LEADERBOARD STATE
  const [liveStandings, setLiveStandings] = useState<LiveHorseStatus[]>([]);

  const trackImage = useRef<HTMLImageElement | null>(null);
  useEffect(() => {
    setImageLoaded(false); 
    const img = new Image();
    img.src = trackConfig.image; 
    img.onload = () => {
      trackImage.current = img;
      setImageLoaded(true);
    };
  }, [trackConfig]);

  const runnerColors = useRef(outcome.results.map(() => 
    `hsl(${Math.floor(Math.random() * 360)}, 85%, 60%)`
  )).current;

  const buildRacePath = () => {
    const mainLoop = raceSurface === 'Dirt' 
                    ? (trackConfig.dirtLoop || []) 
                    : (trackConfig.turfLoop || []);
    
    if (mainLoop.length === 0) return [];

    const startsData = raceSurface === 'Dirt' ? trackConfig.starts?.dirt : trackConfig.starts?.turf;
    const startConf = startsData?.[raceDistance];
    const finishIdx = trackConfig.finishLineIndex;

    let path: {x:number, y:number}[] = [];

    if (startConf) {
        if (startConf.chute && startConf.chute.length > 0) {
            path.push(...startConf.chute);
        }

        if (startConf.mergeIndex <= finishIdx) {
            path.push(...mainLoop.slice(startConf.mergeIndex, finishIdx + 1));
        } else {
            path.push(...mainLoop.slice(startConf.mergeIndex));
            path.push(...mainLoop.slice(0, finishIdx + 1));
        }

        for (let i = 0; i < startConf.laps; i++) {
            path.push(...mainLoop.slice(finishIdx + 1));
            path.push(...mainLoop.slice(0, finishIdx + 1));
        }
    } else {
        path.push(...mainLoop.slice(finishIdx));
        path.push(...mainLoop.slice(0, finishIdx + 1));
    }
    return path;
  };

  const activePath = useRef<{x:number,y:number}[]>([]);
  const totalPathLength = useRef(0);

  const getSegmentLength = (p1: {x:number, y:number}, p2: {x:number, y:number}) => 
    Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));

  useEffect(() => {
     activePath.current = buildRacePath();
     totalPathLength.current = activePath.current.reduce((acc, point, i) => {
        if (i === 0) return 0;
        return acc + getSegmentLength(activePath.current[i-1], point);
     }, 0);
  }, [trackConfig, raceDistance, raceSurface]);

  useEffect(() => {
    if (!imageLoaded) return; 

    let animationFrameId: number;
    let lastTimestamp = 0;
    let accumulatedTime = 0; 
    let lastLogIndex = -1;

    const maxTime = Math.max(...outcome.results.map(r => r.time));
    const path = activePath.current;
    const skillTimers = new Array(outcome.results.length).fill(0);

    const render = (timestamp: number) => {
      if (!lastTimestamp) lastTimestamp = timestamp;
      const deltaTime = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;

      if (!finished) accumulatedTime += deltaTime * speedRef.current;

      const raceProgress = accumulatedTime / maxTime; 
      const logIdx = outcome.log.findIndex(l => l.timePct > raceProgress);
      const activeIdx = logIdx === -1 ? outcome.log.length - 1 : logIdx - 1;
      
      if (activeIdx !== lastLogIndex && activeIdx >= 0) {
          const entry = outcome.log[activeIdx];
          setCurrentCommentary(entry.message);
          lastLogIndex = activeIdx;

          if (entry.message.includes("Ultimate")) {
              const horseResult = outcome.results.find(r => entry.message.includes(r.uma.lastName));
              if (horseResult) {
                  const idx = outcome.results.indexOf(horseResult);
                  skillTimers[idx] = 60; 
                  setSkillCutIn({
                      name: `${horseResult.uma.firstName} ${horseResult.uma.lastName}`,
                      text: "The Zone Entered!"
                  });
                  setTimeout(() => setSkillCutIn(null), 2000);
              }
          }
      }

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');

      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (trackImage.current) {
          ctx.drawImage(trackImage.current, 0, 0, canvas.width, canvas.height);
        }

        if (path.length > 0) {
            const currentStandings: LiveHorseStatus[] = [];

            outcome.results.forEach((res, idx) => {
              let rawPct = accumulatedTime / res.time;
              if (rawPct > 1) rawPct = 1;
              const strat = getVisualStrategy(res.uma);
              const visualPct = getVisualProgress(rawPct, strat);
              const currentDist = visualPct * totalPathLength.current;
              
              // Push to live standings array
              currentStandings.push({
                  id: res.uma.id,
                  name: res.uma.lastName,
                  distanceTraveled: currentDist,
                  color: runnerColors[idx]
              });

              let distTraveled = 0;
              let pos = { x: path[0].x, y: path[0].y };
              let angle = 0;

              for (let i = 1; i < path.length; i++) {
                const p1 = path[i-1];
                const p2 = path[i];
                const segLen = getSegmentLength(p1, p2);
                if (distTraveled + segLen >= currentDist) {
                  const segPct = (currentDist - distTraveled) / segLen;
                  pos.x = p1.x + (p2.x - p1.x) * segPct;
                  pos.y = p1.y + (p2.y - p1.y) * segPct;
                  angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
                  break;
                }
                distTraveled += segLen;
              }

              const totalRunners = outcome.results.length;
              const laneSpacing = Math.min(3, 40 / totalRunners);
              const wiggle = Math.sin(accumulatedTime * 2 + idx) * 0.5;
              let laneOffset = (idx - (totalRunners / 2)) * laneSpacing + wiggle;
              laneOffset = Math.max(-15, Math.min(15, laneOffset));

              const perpAngle = angle + (Math.PI / 2);
              const finalX = pos.x + (Math.cos(perpAngle) * laneOffset);
              const finalY = pos.y + (Math.sin(perpAngle) * laneOffset);

              const isSkillActive = skillTimers[idx] > 0;
              if (isSkillActive) skillTimers[idx]--;

              if (visualPct > 0.7 || isSkillActive) {
                  ctx.beginPath();
                  ctx.arc(finalX, finalY, isSkillActive ? 12 : 8, 0, 2 * Math.PI);
                  ctx.fillStyle = isSkillActive ? `rgba(255, 215, 0, 0.6)` : `rgba(255, 255, 255, 0.3)`;
                  ctx.fill();
              }

              if (visualPct > 0.8) {
                  ctx.beginPath();
                  ctx.moveTo(finalX, finalY);
                  ctx.lineTo(finalX - Math.cos(angle)*20, finalY - Math.sin(angle)*20);
                  ctx.strokeStyle = `rgba(255, 255, 255, 0.4)`;
                  ctx.lineWidth = 2;
                  ctx.stroke();
              }

              ctx.beginPath();
              ctx.arc(finalX, finalY, 6, 0, 2 * Math.PI); 
              ctx.fillStyle = isSkillActive ? '#fff' : runnerColors[idx];
              ctx.fill();
              ctx.strokeStyle = isSkillActive ? '#f1c40f' : 'white';
              ctx.lineWidth = isSkillActive ? 3 : 1;
              ctx.stroke();

              if (visualPct < 1) { 
                  ctx.fillStyle = 'white';
                  ctx.font = isSkillActive ? 'bold 12px Arial' : 'bold 10px Arial';
                  ctx.shadowColor = 'black';
                  ctx.shadowBlur = 4;
                  ctx.fillText(res.uma.lastName, finalX - 10, finalY - 10);
                  ctx.shadowBlur = 0;
              }
            });

            // Sort standings (Highest distance first) and update state
            currentStandings.sort((a, b) => b.distanceTraveled - a.distanceTraveled);
            setLiveStandings(currentStandings);
        }
      }

      if (accumulatedTime < maxTime + 1) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        setFinished(true);
      }
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [outcome, imageLoaded, runnerColors, trackConfig]); 

  // Calculate distance remaining for the leader to show on the board
  const leaderPct = liveStandings.length > 0 ? Math.min(1, liveStandings[0].distanceTraveled / totalPathLength.current) : 0;
  const metersRemaining = Math.max(0, Math.floor(raceDistance - (raceDistance * leaderPct)));

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.98)', zIndex: 3000,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      transition: 'all 0.3s ease'
    }}>
      
      {skillCutIn && (
        <div style={{
            position: 'absolute', top: '20%', left: '0', right: '0', 
            height: '150px',
            background: 'linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(243, 156, 18, 0.9) 20%, rgba(243, 156, 18, 0.9) 80%, rgba(0,0,0,0) 100%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            zIndex: 4000, transform: 'skewX(-20deg)', borderTop: '4px solid white', borderBottom: '4px solid white',
            animation: 'slideIn 0.2s ease-out'
        }}>
            <h1 style={{ color: 'white', fontStyle: 'italic', fontSize: '3rem', margin: 0, textShadow: '4px 4px #c0392b' }}>
                {skillCutIn.text}
            </h1>
            <h2 style={{ color: '#2c3e50', fontSize: '1.5rem', margin: 0, fontWeight: '900', textTransform: 'uppercase' }}>
                {skillCutIn.name}
            </h2>
        </div>
      )}

      <div style={{ 
        display: 'flex', justifyContent: 'space-between', 
        width: isTheaterMode ? '98%' : '90%', 
        maxWidth: '1600px', marginBottom: '15px', alignItems: 'center' 
      }}>
      <h2 style={{ color: 'white', margin: 0, fontSize: '1.4rem' }}>
          📺 {(outcome as any).displayName || trackConfig.name} - {raceSurface} {raceDistance}m
      </h2>
        
        <div style={{ display: 'flex', gap: '15px' }}>
          <button onClick={() => setIsTheaterMode(!isTheaterMode)} style={btnStyle(isTheaterMode)}>
            {isTheaterMode ? '📺 Exit Theater' : '🎭 Theater Mode'}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#34495e', padding: '5px 15px', borderRadius: '4px' }}>
            <label style={{ color: '#f1c40f', fontSize: '12px', fontWeight: 'bold' }}>Speed: {speed}x</label>
            <input type="range" min="0.5" max="5" step="0.5" value={speed} 
              onChange={(e) => {setSpeed(Number(e.target.value)); speedRef.current = Number(e.target.value);}} 
            />
          </div>
          <button onClick={onClose} style={{...btnStyle(false), backgroundColor: '#c0392b'}}>Close</button>
        </div>
      </div>

      <div style={{ 
        display: 'flex', gap: '20px',
        width: isTheaterMode ? '95vw' : '90vw',
        height: isTheaterMode ? '80vh' : '65vh',
        maxWidth: '1600px',
        maxHeight: '900px',
        transition: 'all 0.3s ease'
      }}>
        
        {/* === LIVE LEADERBOARD SIDEBAR === */}
        {!isTheaterMode && (
          <div style={{
              width: '250px', backgroundColor: '#1a1a1a', border: '2px solid #333', 
              borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column',
              boxShadow: '0 5px 15px rgba(0,0,0,0.5)'
          }}>
              <div style={{ backgroundColor: '#2c3e50', padding: '10px', textAlign: 'center', borderBottom: '2px solid #f39c12' }}>
                  <div style={{ color: 'white', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase' }}>Live Order</div>
                  <div style={{ color: '#f1c40f', fontSize: '20px', fontWeight: '900', fontFamily: 'monospace' }}>
                      {finished ? "FINISHED" : `${metersRemaining}m`}
                  </div>
              </div>
              
              <div style={{ flex: 1, overflowY: 'auto', padding: '5px' }}>
                  {liveStandings.map((horse, i) => (
                      <div key={horse.id} style={{
                          display: 'flex', alignItems: 'center', gap: '10px', 
                          padding: '6px 10px', marginBottom: '2px',
                          backgroundColor: i === 0 ? 'rgba(241, 196, 15, 0.1)' : 'transparent',
                          borderBottom: '1px solid #333', borderRadius: '4px'
                      }}>
                          <div style={{ 
                              width: '24px', textAlign: 'center', fontWeight: 'bold', 
                              color: i === 0 ? '#f1c40f' : (i < 3 ? '#bdc3c7' : '#555'),
                              fontSize: i === 0 ? '16px' : '14px'
                          }}>
                              {i + 1}
                          </div>
                          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: horse.color, border: '1px solid white' }} />
                          <div style={{ color: i === 0 ? 'white' : '#ccc', fontWeight: i === 0 ? 'bold' : 'normal', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {horse.name}
                          </div>
                      </div>
                  ))}
              </div>
          </div>
        )}

        {/* === MAIN CANVAS === */}
        <div style={{ 
          flex: 1, position: 'relative', 
          backgroundColor: '#111', border: '4px solid #444', 
          borderRadius: isTheaterMode ? '0px' : '8px', overflow: 'hidden', 
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <canvas 
              ref={canvasRef} 
              width={800} 
              height={450} 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'contain',
                backgroundColor: '#2ecc71'
              }} 
          />
          
          {!showResults && (
              <div style={{
                  position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)',
                  width: '70%', backgroundColor: 'rgba(0,0,0,0.85)', padding: '15px 25px', borderRadius: '50px',
                  color: '#fff', fontSize: '1.3rem', textAlign: 'center', border: '2px solid #555',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
              }}>
                  🎙️ {currentCommentary || "Waiting for the signal..."}
              </div>
          )}

          {showResults && (
              <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: 'rgba(0,0,0,0.95)', display: 'flex', flexDirection: 'column', 
                  alignItems: 'center', justifyContent: 'center', color: 'white', zIndex: 10
              }}>
                  <h1 style={{ color: '#f1c40f', fontSize: '3rem', marginBottom: '25px', textShadow: '2px 2px #000' }}>🏁 OFFICIAL RESULTS</h1>
                  <div style={{ width: '85%', maxHeight: '65%', overflowY: 'auto', backgroundColor: '#111', padding: '30px', borderRadius: '15px', border: '1px solid #333' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1.2rem' }}>
                          <thead style={{ borderBottom: '3px solid #f1c40f', color: '#f1c40f' }}>
                              <tr>
                                  <th style={{padding: '15px', textAlign: 'left'}}>Rank</th>
                                  <th style={{padding: '15px', textAlign: 'left'}}>Horse</th>
                                  <th style={{padding: '15px', textAlign: 'left'}}>Time</th>
                                  <th style={{padding: '15px', textAlign: 'right'}}>Gap</th>
                              </tr>
                          </thead>
                          <tbody>
                              {outcome.results.map((res, idx) => (
                                  <tr key={idx} style={{ borderBottom: '1px solid #222', backgroundColor: idx % 2 === 0 ? '#151515' : 'transparent' }}>
                                      <td style={{padding: '15px', fontWeight: 'bold', color: idx === 0 ? '#f1c40f' : 'white'}}>{idx + 1}</td>
                                      <td style={{padding: '15px', fontWeight: 'bold'}}>{res.uma.firstName} {res.uma.lastName}</td>
                                      <td style={{padding: '15px', fontFamily: 'monospace'}}>{res.time.toFixed(2)}s</td>
                                      <td style={{padding: '15px', textAlign: 'right', color: '#888'}}>{idx === 0 ? 'WINNER' : `+${(res.time - outcome.results[0].time).toFixed(2)}s`}</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
                  <button onClick={onClose} style={{ marginTop: '35px', padding: '18px 60px', backgroundColor: '#e74c3c', color: 'white', borderRadius: '50px', border: 'none', cursor: 'pointer', fontSize: '1.3rem', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(231, 76, 60, 0.4)' }}>
                      Return to Stable
                  </button>
              </div>
          )}
        </div>
      </div>
      
      {finished && !showResults && (
        <button onClick={() => setShowResults(true)} style={{ marginTop: '25px', padding: '20px 80px', fontSize: '1.8rem', backgroundColor: '#f1c40f', color: '#2c3e50', border: 'none', borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 5px 20px rgba(241, 196, 15, 0.5)' }}>
          Confirm Standings
        </button>
      )}
    </div>
  );
}

const btnStyle = (active: boolean) => ({
    padding: '10px 20px',
    backgroundColor: active ? '#f39c12' : '#34495e',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold' as const,
    boxShadow: active ? '0 0 10px rgba(243, 156, 18, 0.5)' : 'none'
});