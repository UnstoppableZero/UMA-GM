// src/components/RaceViewer.tsx
import React, { useEffect, useRef, useState } from 'react';
import type { RaceOutcome } from '../race';
import { TRACKS } from '../tracks';
import type { Location } from '../schedule';

interface Props {
  outcome: RaceOutcome;
  onClose: () => void;
  location?: Location; 
  distance?: number;
  surface?: 'Turf' | 'Dirt';
}

export function RaceViewer({ outcome, onClose, location = 'Tokyo', distance, surface }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // CONFIG
  const trackConfig = TRACKS[location] || TRACKS['Tokyo'];
  const raceDistance = distance || (outcome as any).raceDistance || 2000;
  const raceSurface = surface || 'Turf';

  // STATE
  const [finished, setFinished] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [speed, setSpeed] = useState(1); 
  const speedRef = useRef(1);
  const [isTheaterMode, setIsTheaterMode] = useState(false); 
  
  const [showResults, setShowResults] = useState(false);
  const [currentCommentary, setCurrentCommentary] = useState("");

  // 1. Load Image
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
    `hsl(${Math.floor(Math.random() * 360)}, 80%, 50%)`
  )).current;

  // 3. BUILD THE CUSTOM RACE PATH
  const buildRacePath = () => {
    const mainLoop = raceSurface === 'Dirt' && trackConfig.dirtLoop?.length > 0 
                    ? trackConfig.dirtLoop 
                    : (trackConfig.turfLoop?.length > 0 ? trackConfig.turfLoop : []);
    
    if (mainLoop.length === 0) return [];

    const startsData = raceSurface === 'Dirt' ? trackConfig.starts?.dirt : trackConfig.starts?.turf;
    const startConf = startsData?.[raceDistance];
    const finishIdx = trackConfig.finishLineIndex || 0;

    let path: {x:number, y:number}[] = [];

    if (startConf) {
        if (startConf.chute.length > 0) path.push(...startConf.chute);
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

  // 4. ANIMATION LOOP
  useEffect(() => {
    if (!imageLoaded) return; 

    let animationFrameId: number;
    let lastTimestamp = 0;
    let accumulatedTime = 0; 

    const maxTime = Math.max(...outcome.results.map(r => r.time));
    const path = activePath.current;

    const render = (timestamp: number) => {
      if (!lastTimestamp) lastTimestamp = timestamp;
      const deltaTime = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;

      if (!finished) accumulatedTime += deltaTime * speedRef.current;

      const raceProgress = accumulatedTime / maxTime; 
      const activeLog = outcome.log.filter(l => l.timePct <= raceProgress).pop();
      if (activeLog) setCurrentCommentary(activeLog.message);

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');

      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (trackImage.current) {
          ctx.drawImage(trackImage.current, 0, 0, canvas.width, canvas.height);
        }

        if (path.length > 0) {
            outcome.results.forEach((res, idx) => {
              let pct = accumulatedTime / res.time;
              if (pct > 1) pct = 1;

              const currentDist = pct * totalPathLength.current;
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
              // CLAMP FIX: Scale lane density based on total runners but cap max width
              const laneSpacing = Math.min(3, 40 / totalRunners);
              let laneOffset = (idx - (totalRunners / 2)) * laneSpacing;
              
              // HARD LIMIT: Ensure they don't exit the 800x450 track visual boundaries
              laneOffset = Math.max(-15, Math.min(15, laneOffset));

              const perpAngle = angle + (Math.PI / 2);
              const finalX = pos.x + (Math.cos(perpAngle) * laneOffset);
              const finalY = pos.y + (Math.sin(perpAngle) * laneOffset);

              ctx.beginPath();
              ctx.arc(finalX, finalY, 6, 0, 2 * Math.PI); 
              ctx.fillStyle = runnerColors[idx];
              ctx.fill();
              ctx.strokeStyle = 'white';
              ctx.stroke();

              if (pct < 1) { 
                  ctx.fillStyle = 'white';
                  ctx.font = 'bold 10px Arial';
                  ctx.fillText(res.uma.lastName, finalX - 10, finalY - 10);
              }
            });
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

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.98)', zIndex: 3000,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      transition: 'all 0.3s ease'
    }}>
      
      {/* TOP UI BAR */}
      <div style={{ 
        display: 'flex', justifyContent: 'space-between', 
        width: isTheaterMode ? '98%' : '80%', 
        maxWidth: '1400px', marginBottom: '15px', alignItems: 'center' 
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

      {/* SCALEABLE CONTAINER */}
      <div style={{ 
        position: 'relative', 
        width: isTheaterMode ? '95vw' : '80vw',
        height: isTheaterMode ? '80vh' : '65vh',
        maxWidth: '1600px',
        maxHeight: '900px',
        backgroundColor: '#111',
        border: '4px solid #444',
        borderRadius: isTheaterMode ? '0px' : '12px',
        overflow: 'hidden',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
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
        
        {/* COMMENTARY */}
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

        {/* RESULTS */}
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