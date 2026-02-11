// src/components/RaceModal.tsx
import { useEffect, useState } from 'react';
import type { RaceOutcome } from '../race';

interface Props {
  outcome: RaceOutcome;
  onClose: () => void;
}

export function RaceModal({ outcome, onClose }: Props) {
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);

  // The "Playback" Effect
  useEffect(() => {
    if (currentLineIndex < outcome.log.length) {
      const timer = setTimeout(() => {
        setCurrentLineIndex(prev => prev + 1);
      }, 1500); // 1.5 seconds per line
      return () => clearTimeout(timer);
    } else {
      // Log is finished, show the table
      setShowResults(true);
    }
  }, [currentLineIndex, outcome.log.length]);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)', // Dark background
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white', padding: '30px', borderRadius: '10px',
        width: '500px', minHeight: '300px', textAlign: 'center',
        position: 'relative'
      }}>
        <h2 style={{ color: '#2c3e50', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
          📺 Live Broadcast
        </h2>

        {/* LOG DISPLAY AREA */}
        {!showResults && (
          <div style={{ height: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
             <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#333' }}>
               {outcome.log[currentLineIndex]?.message || "..."}
             </p>
             <p style={{ fontSize: '14px', color: '#999', marginTop: '20px' }}>
               (Auto-playing...)
             </p>
          </div>
        )}

        {/* FINAL RESULTS TABLE */}
        {showResults && (
          <div>
            <h3 style={{ color: '#e67e22' }}>🏁 FINISH!</h3>
            <table style={{ width: '100%', marginTop: '10px', textAlign: 'left' }}>
              <tbody>
                {outcome.results.slice(0, 3).map(res => (
                  <tr key={res.uma.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td>{res.rank === 1 ? '🥇' : res.rank === 2 ? '🥈' : '🥉'}</td>
                    <td>{res.uma.firstName} {res.uma.lastName}</td>
                    <td>{res.time.toFixed(2)}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <button 
              onClick={onClose}
              style={{
                marginTop: '20px', padding: '10px 20px',
                backgroundColor: '#2980b9', color: 'white', border: 'none', borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Return to Office
            </button>
          </div>
        )}
      </div>
    </div>
  );
}