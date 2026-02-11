// src/pages/HistoryPage.tsx
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Link } from 'react-router-dom';

export function HistoryPage() {
  // Get all history, sorted by Year (descending) then Week
  const history = useLiveQuery(() => db.raceHistory.orderBy('year').reverse().toArray());

  if (!history) return <div>Loading Archives...</div>;

  // Group data by Year: { 2: [Results...], 1: [Results...] }
  const historyByYear = history.reduce((acc, record) => {
    if (!acc[record.year]) acc[record.year] = [];
    acc[record.year].push(record);
    return acc;
  }, {} as Record<number, typeof history>);

  return (
    <div>
      <h2 style={{ color: '#2c3e50', borderBottom: '3px solid #2c3e50', paddingBottom: '10px' }}>
         🏛️ League History (G1 Archive)
      </h2>

      {Object.keys(historyByYear).map((yearStr) => {
        const year = parseInt(yearStr);
        const races = historyByYear[year].sort((a, b) => a.week - b.week);

        return (
          <div key={year} style={{ marginBottom: '40px' }}>
            <h3 style={{ backgroundColor: '#34495e', color: 'white', padding: '10px', borderRadius: '5px' }}>
              Year {year} Season
            </h3>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <thead>
                <tr style={{ backgroundColor: '#ecf0f1', textAlign: 'left', color: '#7f8c8d' }}>
                  <th style={{ padding: '10px' }}>Race</th>
                  <th style={{ padding: '10px' }}>Winner</th>
                  <th style={{ padding: '10px' }}>Time</th>
                </tr>
              </thead>
              <tbody>
                {races.map((record) => (
                  <tr key={record.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold', color: '#2c3e50' }}>
                      {record.raceName}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <Link to={`/uma/${record.winnerId}`} style={{ color: '#2980b9', fontWeight: 'bold', textDecoration: 'none' }}>
                        {record.winnerName}
                      </Link>
                    </td>
                    <td style={{ padding: '12px', fontFamily: 'monospace', color: '#555' }}>
                      {record.time.toFixed(2)}s
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}

      {history.length === 0 && (
        <p>No history yet. Simulate some races to populate the archive!</p>
      )}
    </div>
  );
}