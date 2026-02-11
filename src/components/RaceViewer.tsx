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
  const speedRef = useRef(1); // Keeps track of speed without resetting the animation loop
  const [debugMode, setDebugMode] = useState(false); 
  
  // RESULTS & COMMENTARY
  const [showResults, setShowResults] = useState(false);
  const [currentCommentary, setCurrentCommentary] = useState("");

  // CALIBRATION STUDIO STATE
  const [calibratedPoints, setCalibratedPoints] = useState<{x:number, y:number}[]>([]);
  const [calibTarget, setCalibTarget] = useState<'turfLoop'|'dirtLoop'|'chute'>('turfLoop');
  const [calibChuteSurf, setCalibChuteSurf] = useState<'turf'|'dirt'>('turf');
  const [calibChuteDist, setCalibChuteDist] = useState(2000);

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

  // 2. Setup Colors
  const runnerColors = useRef(outcome.results.map(() => 
    `hsl(${Math.floor(Math.random() * 360)}, 80%, 50%)`
  )).current;

  // 3. BUILD THE CUSTOM RACE PATH
  const buildRacePath = () => {
    const mainLoop = raceSurface === 'Dirt' && trackConfig.dirtLoop?.length > 0 
                     ? trackConfig.dirtLoop 
                     : (trackConfig.turfLoop?.length > 0 ? trackConfig.turfLoop : []);
    
    if (mainLoop.length === 0) return []; // Uncalibrated map

    const startsData = raceSurface === 'Dirt' ? trackConfig.starts?.dirt : trackConfig.starts?.turf;
    const startConf = startsData?.[raceDistance];
    const finishIdx = trackConfig.finishLineIndex || 0;

    let path: {x:number, y:number}[] = [];

    if (startConf) {
        if (startConf.chute.length > 0) path.push(...startConf.chute);
        
        const mergeIdx = startConf.mergeIndex;
        if (mergeIdx <= finishIdx) {
            path.push(...mainLoop.slice(mergeIdx, finishIdx + 1));
        } else {
            path.push(...mainLoop.slice(mergeIdx));
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
    // FIX 1: Allow rendering even if the track path is empty so the Studio works
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

      if (!finished) {
        accumulatedTime += deltaTime * speedRef.current; // USING speedRef NOW
      }

      const raceProgress = accumulatedTime / maxTime; 
      const activeLog = outcome.log
          .filter(l => l.timePct <= raceProgress)
          .pop();

      if (activeLog) setCurrentCommentary(activeLog.message);
      else setCurrentCommentary("Waiting for start...");

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');

      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (trackImage.current) {
          ctx.drawImage(trackImage.current, 0, 0, canvas.width, canvas.height);
        } else {
           ctx.fillStyle = '#2ecc71'; ctx.fillRect(0,0,800,450);
        }

        if (debugMode) {
            if (trackConfig.turfLoop?.length > 0) {
                ctx.beginPath(); ctx.moveTo(trackConfig.turfLoop[0].x, trackConfig.turfLoop[0].y);
                trackConfig.turfLoop.forEach(p => ctx.lineTo(p.x, p.y)); ctx.closePath();
                ctx.strokeStyle = 'rgba(46, 204, 113, 0.6)'; ctx.lineWidth = 2; ctx.stroke();
            }
            if (trackConfig.dirtLoop?.length > 0) {
                ctx.beginPath(); ctx.moveTo(trackConfig.dirtLoop[0].x, trackConfig.dirtLoop[0].y);
                trackConfig.dirtLoop.forEach(p => ctx.lineTo(p.x, p.y)); ctx.closePath();
                ctx.strokeStyle = 'rgba(230, 126, 34, 0.6)'; ctx.lineWidth = 2; ctx.stroke();
            }

            if (calibratedPoints.length > 0) {
                ctx.beginPath(); ctx.moveTo(calibratedPoints[0].x, calibratedPoints[0].y);
                calibratedPoints.forEach(p => ctx.lineTo(p.x, p.y));
                ctx.strokeStyle = 'cyan'; ctx.setLineDash([5, 5]); ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]);
                calibratedPoints.forEach((p, i) => { 
                    ctx.fillStyle = 'magenta'; ctx.fillRect(p.x - 2, p.y - 2, 4, 4); 
                    ctx.fillStyle = 'yellow'; ctx.font = "10px monospace"; ctx.fillText(`${i}`, p.x + 4, p.y - 4);
                });
            }
        }

        const mainLoop = raceSurface === 'Dirt' && trackConfig.dirtLoop?.length > 0 ? trackConfig.dirtLoop : trackConfig.turfLoop;
        if (mainLoop?.length > 1) {
            const finishPt = mainLoop[trackConfig.finishLineIndex || 0];
            if (finishPt) {
                ctx.beginPath();
                ctx.moveTo(finishPt.x, finishPt.y - 20);
                ctx.lineTo(finishPt.x, finishPt.y + 20);
                ctx.strokeStyle = '#e74c3c';
                ctx.lineWidth = 4;
                ctx.stroke();
            }
        }

        // FIX 2: Only try to draw horses if there is actually a path for them to run on
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
              const dynamicLaneWidth = Math.max(1.2, 40 / totalRunners); 
              let laneOffset = (idx - (totalRunners / 2)) * dynamicLaneWidth;

              const MAX_TRACK_WIDTH = 12; 
              if (laneOffset > MAX_TRACK_WIDTH) laneOffset = MAX_TRACK_WIDTH;
              if (laneOffset < -MAX_TRACK_WIDTH) laneOffset = -MAX_TRACK_WIDTH;

              const jostle = Math.sin(accumulatedTime * 2 + idx) * 0.5;
              laneOffset += jostle;

              const perpAngle = angle + (Math.PI / 2);
              const finalX = pos.x + (Math.cos(perpAngle) * laneOffset);
              const finalY = pos.y + (Math.sin(perpAngle) * laneOffset);

              ctx.beginPath();
              ctx.arc(finalX, finalY, 6, 0, 2 * Math.PI); 
              ctx.fillStyle = runnerColors[idx];
              ctx.fill();
              ctx.strokeStyle = 'white';
              ctx.lineWidth = 1;
              ctx.stroke();
              
              if (res.skillActivations) {
                res.skillActivations.forEach(activation => {
                   const triggerTime = activation.timeOffset;
                   if (accumulatedTime >= triggerTime && accumulatedTime < triggerTime + 1.5) {
                     ctx.fillStyle = 'rgba(255, 215, 0, 0.9)'; 
                     ctx.strokeStyle = 'black';
                     const text = activation.skillName;
                     const textWidth = ctx.measureText(text).width;
                     ctx.fillRect(finalX - textWidth/2 - 4, finalY - 30, textWidth + 8, 16);
                     ctx.strokeRect(finalX - textWidth/2 - 4, finalY - 30, textWidth + 8, 16);
                     ctx.fillStyle = 'black';
                     ctx.font = 'bold 10px Arial';
                     ctx.fillText(text, finalX - textWidth/2, finalY - 18);
                   }
                });
              }

              if (debugMode || pct < 1) { 
                 ctx.fillStyle = 'white';
                 ctx.font = 'bold 9px Arial';
                 ctx.fillText(res.uma.lastName, finalX - 10, finalY - 10);
              }
            });
        }
      }

      if (accumulatedTime < maxTime + 2) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        setFinished(true);
      }
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
    
  // REMOVED 'speed' FROM THIS ARRAY
  }, [outcome, imageLoaded, runnerColors, debugMode, trackConfig, raceDistance, raceSurface, calibratedPoints]); 

  // --- CALIBRATION STUDIO LOGIC ---
  const handleCanvasClick = (e: React.MouseEvent) => {
      if (!debugMode || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = Math.round(e.clientX - rect.left);
      const y = Math.round(e.clientY - rect.top);
      setCalibratedPoints([...calibratedPoints, { x, y }]); 
  };

  const logCalibration = () => {
      console.clear();
      console.log(`--- CALIBRATION FOR ${location} ---`);
      
      if (calibTarget === 'turfLoop' || calibTarget === 'dirtLoop') {
          console.log(`Replace '${calibTarget}' array in src/tracks.ts with this:`);
          console.log(JSON.stringify(calibratedPoints, null, 2));
      } else {
          const targetLoop = calibChuteSurf === 'turf' ? trackConfig.turfLoop : trackConfig.dirtLoop;
          if (!targetLoop || targetLoop.length === 0) {
              console.error(`ERROR: Please calibrate the ${calibChuteSurf}Loop first so we know where to merge!`);
              return;
          }
          const lastPt = calibratedPoints[calibratedPoints.length - 1];
          let mergeIdx = 0;
          let minD = Infinity;
          targetLoop.forEach((p, i) => {
              const d = Math.hypot(p.x - lastPt.x, p.y - lastPt.y);
              if (d < minD) { minD = d; mergeIdx = i; }
          });
          
          console.log(`Add this inside starts.${calibChuteSurf} for ${location} in src/tracks.ts:`);
          console.log(`"${calibChuteDist}": ` + JSON.stringify({
              chute: calibratedPoints,
              mergeIndex: mergeIdx,
              laps: 0 
          }, null, 2) + ",");
      }
      alert("Calibration data printed to Browser Console (F12)!");
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: '#111', zIndex: 2000,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
    }}>
      
      {/* TOP BAR WITH SLIDER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '800px', marginBottom: '10px', alignItems: 'center' }}>
        <h2 style={{ color: 'white', margin: 0 }}>📺 LIVE: {trackConfig.name} ({raceSurface} {raceDistance}m)</h2>
        
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
             
             {/* THE NEW SLIDER */}
             <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#34495e', padding: '5px 15px', borderRadius: '50px', border: '1px solid #2c3e50' }}>
               <label style={{ color: '#f1c40f', fontWeight: 'bold', minWidth: '85px', fontSize: '14px' }}>
                 Speed: {speed.toFixed(1)}x
               </label>
               <input 
                 type="range" 
                 min="0.5" 
                 max="5" 
                 step="0.5" 
                 value={speed} 
                 onChange={(e) => {
                    const newSpeed = Number(e.target.value);
                    setSpeed(newSpeed);          // Updates the UI text
                    speedRef.current = newSpeed; // Updates the animation instantly
                 }}
                 style={{ cursor: 'pointer', accentColor: '#3498db' }}
               />
             </div>

             <button onClick={() => {
                 setDebugMode(!debugMode);
                 setCalibratedPoints([]); 
             }} style={{ ...btnStyle(debugMode), backgroundColor: debugMode ? 'red' : '#555' }}>
               {debugMode ? "Close Studio" : "🛠️ Calibrate"}
             </button>
        </div>
      </div>

      {/* PRO CALIBRATION MENU (Only shows in Debug Mode) */}
      {debugMode && (
          <div style={{ width: '800px', backgroundColor: '#34495e', padding: '10px', display: 'flex', gap: '15px', alignItems: 'center', boxSizing: 'border-box', borderBottom: '2px solid #2c3e50' }}>
              <select style={{padding: '5px'}} value={calibTarget} onChange={e => setCalibTarget(e.target.value as any)}>
                  <option value="turfLoop">Draw: Turf Loop</option>
                  <option value="dirtLoop">Draw: Dirt Loop</option>
                  <option value="chute">Draw: Start Chute</option>
              </select>
              
              {calibTarget === 'chute' && (
                  <div style={{display: 'flex', gap: '5px', alignItems: 'center'}}>
                      <span style={{color:'white', fontSize:'12px'}}>Target:</span>
                      <select style={{padding: '5px'}} value={calibChuteSurf} onChange={e => setCalibChuteSurf(e.target.value as any)}>
                          <option value="turf">Turf</option>
                          <option value="dirt">Dirt</option>
                      </select>
                      <input type="number" style={{padding: '5px', width: '60px'}} value={calibChuteDist} onChange={e => setCalibChuteDist(Number(e.target.value))} />
                      <span style={{color:'white', fontSize:'12px'}}>m</span>
                  </div>
              )}
              
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
                 <button onClick={() => setCalibratedPoints([])} style={{padding: '5px 15px', cursor: 'pointer'}}>Clear Line</button>
                 <button onClick={logCalibration} style={{padding: '5px 15px', backgroundColor: '#27ae60', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold'}}>💾 Log to Console</button>
              </div>
          </div>
      )}

      {/* CANVAS CONTAINER */}
      <div style={{ position: 'relative' }}>
        <canvas 
            ref={canvasRef} 
            width={800} 
            height={450} 
            onClick={handleCanvasClick}
            style={{ 
            border: '2px solid #555', 
            borderRadius: '4px',
            backgroundColor: '#2ecc71',
            cursor: debugMode ? 'crosshair' : 'default'
            }} 
        />
        
        {/* LIVE COMMENTARY TICKER */}
        {!showResults && (
            <div style={{
                position: 'absolute', bottom: '10px', left: '10px', right: '10px',
                backgroundColor: 'rgba(0,0,0,0.8)', padding: '10px', borderRadius: '4px',
                color: '#fff', fontSize: '16px', textAlign: 'center',
                border: '1px solid #444', minHeight: '24px'
            }}>
                🎙️ {currentCommentary || "Waiting for start..."}
            </div>
        )}

        {/* RESULTS OVERLAY */}
        {showResults && (
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.9)', 
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                color: 'white'
            }}>
                <h2 style={{ color: '#f1c40f', marginBottom: '20px' }}>🏁 RACE RESULTS 🏁</h2>
                <div style={{ maxHeight: '350px', overflowY: 'auto', width: '90%' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ borderBottom: '2px solid #555' }}>
                            <tr>
                                <th style={{padding: '10px'}}>Rank</th>
                                <th style={{padding: '10px'}}>Horse</th>
                                <th style={{padding: '10px'}}>Time</th>
                                <th style={{padding: '10px'}}>Gap</th>
                            </tr>
                        </thead>
                        <tbody>
                            {outcome.results.map((res, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #333' }}>
                                    <td style={{padding: '10px', color: idx === 0 ? '#f1c40f' : idx === 1 ? '#bdc3c7' : idx === 2 ? '#e67e22' : 'white'}}>
                                        {idx + 1}
                                    </td>
                                    <td style={{padding: '10px', fontWeight: 'bold'}}>{res.uma.firstName} {res.uma.lastName}</td>
                                    <td style={{padding: '10px'}}>{res.time.toFixed(2)}s</td>
                                    <td style={{padding: '10px', color: '#999'}}>
                                        {idx === 0 ? '-' : `+${(res.time - outcome.results[0].time).toFixed(2)}s`}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <button 
                    onClick={onClose}
                    style={{
                        marginTop: '20px', padding: '10px 30px', fontSize: '18px',
                        backgroundColor: '#e74c3c', color: 'white', border: 'none', 
                        borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'
                    }}
                >
                    Exit to Dashboard
                </button>
            </div>
        )}
      </div>
      
      {/* BOTTOM ACTION BUTTON */}
      {finished && !showResults && (
        <button 
          onClick={() => setShowResults(true)} 
          style={{
            marginTop: '20px', padding: '15px 40px', fontSize: '20px',
            backgroundColor: '#f1c40f', color: '#2c3e50', border: 'none', 
            borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold',
            boxShadow: '0 4px 15px rgba(241, 196, 15, 0.4)'
          }}
        >
          View Photo Finish & Results
        </button>
      )}

    </div>
  );
}

const btnStyle = (active: boolean) => ({
    padding: '5px 15px',
    backgroundColor: active ? '#3498db' : '#333',
    color: 'white',
    border: '1px solid #555',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold' as const
});