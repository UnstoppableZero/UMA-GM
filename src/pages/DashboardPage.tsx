import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { getRacesByWeek } from '../data/calendar';
import { trainUma } from '../training';
import { simulateRace, type RaceOutcome } from '../race';
import { useState, useEffect } from 'react';
import { RaceViewer } from '../components/RaceViewer';
import { generateTieredUma } from '../generator'; 
import { LEAGUE_TEAMS } from '../data/teams'; 
import type { Uma } from '../types';
import { autoAllocateHorses, calculateOdds, calculateRaceRating } from '../logic/matchmaking'; 
import { replenishRosters, processWeeklyAIGrowth, assignEndOfYearAwards } from '../logic/season'; // <-- Added assignEndOfYearAwards

const formatTime = (rawSeconds: number) => {
  const minutes = Math.floor(rawSeconds / 60);
  const seconds = (rawSeconds % 60).toFixed(2);
  return minutes > 0 ? `${minutes}:${seconds.padStart(5, '0')}` : `${seconds}s`;
};

export function DashboardPage() {
  const gameState = useLiveQuery(() => db.gameState.get(1));
  const roster = useLiveQuery(() => db.umas.toArray());
  
  const latestNews = useLiveQuery(async () => {
      if (!gameState) return [];
      const allNews = await db.news.toArray();
      return allNews.filter(n => n.year === gameState.year).reverse();
  }, [gameState?.year]);
  
  const [raceOutcome, setRaceOutcome] = useState<RaceOutcome | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  
  const [raceQueue, setRaceQueue] = useState<{
      outcome: RaceOutcome, 
      location: string, 
      distance: number, 
      surface: 'Turf' | 'Dirt'
  }[]>([]);
  
  const [queueIndex, setQueueIndex] = useState(0);

  useEffect(() => {
    let timer: number;
    if (isSimulating && !raceOutcome && raceQueue.length === 0) {
      timer = window.setTimeout(() => {
        advanceWeek(false);
      }, 800);
    }
    return () => clearTimeout(timer);
  }, [isSimulating, raceOutcome, raceQueue, gameState?.week]);

  if (!gameState || !roster) return <div style={{color: 'var(--text-primary)', padding: '20px'}}>Loading...</div>;

  const currentEvents = getRacesByWeek(gameState.week);
  
  const allocations = roster.length > 0 
    ? autoAllocateHorses(roster, currentEvents, gameState.week, gameState.year) 
    : {};

  const initLeagueMode = async () => {
    if (!confirm("⚠️ This will WIPE everything and generate a balanced league (~230 horses). Ready?")) return;
    
    await db.umas.clear();
    await db.teams.clear();
    await db.gameState.update(1, { year: 1, week: 1, money: 1000000 });
    await db.news.clear();
    await db.raceHistory.clear();
    
    const teamsData = LEAGUE_TEAMS.map(t => ({ ...t, history: { wins: 0, championships: 0, earnings: 0 } }));
    await db.teams.bulkAdd(teamsData);
    
    const newRoster: Uma[] = [];

    for (let i = 0; i < 8; i++) {
        const horse = generateTieredUma(1); 
        horse.teamId = 'player';
        newRoster.push(horse);
    }

    const eliteTeams = teamsData.filter(t => t.prestige >= 90 && t.id !== 'player');
    for (const team of eliteTeams) {
        for (let i = 0; i < 10; i++) { 
            const horse = generateTieredUma(1);
            horse.teamId = team.id;
            newRoster.push(horse);
        }
    }

    const midTeams = teamsData.filter(t => t.prestige >= 60 && t.prestige < 90);
    for (const team of midTeams) {
        for (let i = 0; i < 15; i++) { 
            const horse = generateTieredUma(2);
            horse.teamId = team.id;
            newRoster.push(horse);
        }
    }

    const mobTeams = teamsData.filter(t => t.prestige < 60);
    for (const team of mobTeams) {
        for (let i = 0; i < 25; i++) { 
            const horse = generateTieredUma(3); 
            horse.teamId = team.id;
            newRoster.push(horse);
        }
    }

    await db.umas.bulkAdd(newRoster);
    alert(`🏆 League Initialized with ${newRoster.length} horses!`);
    window.location.reload();
  };

  const advanceWeek = async (viewRace = true) => {
    let currentMoney = gameState.money; 
    const raceResults: {outcome: RaceOutcome, location: string, distance: number, surface: 'Turf' | 'Dirt'}[] = [];

    for (const race of currentEvents) {
        const allocation = allocations[race.id];
        if (!allocation || allocation.field.length < 2) continue;

        const outcome = simulateRace(allocation.field, race.distance);
        (outcome as any).displayName = race.name;
        
        raceResults.push({ 
            outcome, 
            location: race.location, 
            distance: race.distance, 
            surface: race.surface as 'Turf' | 'Dirt' 
        });

        const top3Finishers = outcome.results.slice(0, 3).map(r => ({
            id: r.uma.id, name: `${r.uma.firstName} ${r.uma.lastName}`, time: r.time
        }));

        for (const res of outcome.results) {
            const umaIndex = roster.findIndex(u => u.id === res.uma.id);
            if (umaIndex === -1) continue;
            const uma = roster[umaIndex];

            const currentTotal = uma.stats.speed + uma.stats.stamina + uma.stats.power + uma.stats.guts + uma.stats.wisdom;
            const currentRating = Math.floor(currentTotal / 50) + 10;

            if (uma.potential && currentRating < uma.potential) {
                let xpGain = 1; 
                
                if (res.rank === 1) xpGain = 4;      
                else if (res.rank === 2) xpGain = 2; 
                
                if (race.grade === 'G1') xpGain += 6; 
                
                uma.stats.speed = Math.min(1200, uma.stats.speed + xpGain);
                uma.stats.stamina = Math.min(1200, uma.stats.stamina + xpGain);
                uma.stats.power = Math.min(1200, uma.stats.power + xpGain);
                uma.stats.guts = Math.min(1200, uma.stats.guts + xpGain);
                uma.stats.wisdom = Math.min(1200, uma.stats.wisdom + xpGain);
            }

            const injuryRisk = 0.01 + Math.max(0, ((uma.fatigue || 0) - 20) * 0.001);
            if (Math.random() < injuryRisk) {
                const severityRoll = Math.random();
                let weeks = 4;
                let type = "Minor";
                let potDamage = 0; 

                if (severityRoll > 0.95) { 
                    weeks = 20; type = "Catastrophic"; potDamage = 10; 
                } else if (severityRoll > 0.80) { 
                    weeks = 10; type = "Severe"; potDamage = 5; 
                } else if (severityRoll > 0.50) { 
                    weeks = 6; type = "Major"; potDamage = 0; 
                } else { 
                    weeks = 3; type = "Minor"; potDamage = 0; 
                }

                uma.injuryWeeks = weeks + Math.floor(Math.random() * 3);
                if (potDamage > 0 && uma.potential) {
                    uma.potential = Math.max(0, uma.potential - potDamage);
                }

                const damageText = potDamage > 0 ? `Potential drop: -${potDamage}.` : `Expected to fully recover.`;
                db.news.add({ 
                    year: gameState.year, week: gameState.week, 
                    message: `🚑 [${type} Injury] ${uma.firstName} ${uma.lastName} hurt a leg in the ${race.name}. Out ${uma.injuryWeeks}w. ${damageText}`, 
                    type: 'important' 
                });
            }

            if (!uma.history) uma.history = [];
            uma.history.push({ year: gameState.year, week: gameState.week, raceName: race.name, rank: res.rank, time: res.time });
            uma.career.races = (uma.career.races || 0) + 1;
            if (res.rank === 1) uma.career.wins = (uma.career.wins || 0) + 1;
            if (res.rank <= 3) uma.career.top3 = (uma.career.top3 || 0) + 1;

            let prize = 0;
            if (res.rank === 1) prize = race.purse;
            else if (res.rank === 2) prize = race.purse * 0.4;
            else if (res.rank === 3) prize = race.purse * 0.25;

            if (prize > 0) {
                uma.career.earnings += prize;
                if (uma.teamId === 'player') currentMoney += prize;
            }

            if (res.rank === 1) {
                const fullName = `${uma.firstName} ${uma.lastName}`;
                db.news.add({ year: gameState.year, week: gameState.week, message: `🏆 [${race.grade}] ${fullName} wins the ${race.name}!`, type: 'info' });
                db.raceHistory.add({ year: gameState.year, week: gameState.week, raceName: race.name, winnerId: uma.id, winnerName: fullName, time: res.time, top3: top3Finishers });
            }
            
            uma.energy = Math.max(0, (uma.energy || 100) - 25);
            uma.fatigue = Math.min(100, (uma.fatigue || 0) + 15);
        }

        const myExcluded = allocation.excluded.filter(u => u.teamId === 'player');
        if (myExcluded.length > 0) {
             const names = myExcluded.map(u => u.lastName).join(", ");
             db.news.add({ year: gameState.year, week: gameState.week, message: `⚠️ DNQ: ${names} failed to qualify for ${race.name}.`, type: 'important' });
        }
    }

    const racedIds = new Set(Object.values(allocations).flatMap(a => a.field.map(u => u.id)));
    
    roster.forEach(uma => {
        if (!racedIds.has(uma.id)) {
            if (uma.injuryWeeks > 0) {
                uma.injuryWeeks--;
                uma.energy = 100;
            } 
            else if ((uma.fatigue || 0) > 60) {
                uma.energy = 100; uma.fatigue = 0; 
            } 
            else {
                const trainInjuryRisk = (uma.fatigue || 0) > 30 ? 0.05 : 0.005; 
                if (Math.random() < trainInjuryRisk) {
                    uma.injuryWeeks = 4;
                    if (uma.teamId === 'player') {
                        db.news.add({ year: gameState.year, week: gameState.week, message: `🚑 ${uma.firstName} ${uma.lastName} tweaked a muscle training. Out 4w.`, type: 'important' });
                    }
                } else {
                    uma.energy = Math.max(0, (uma.energy || 100) - 10);
                    uma.fatigue = (uma.fatigue || 0) + 5; 
                    if (uma.teamId === 'player') {
                        trainUma(uma, 'balanced');
                    }
                }
            }
        }
    });

    const grewRoster = processWeeklyAIGrowth(roster);

    if (viewRace && raceResults.length > 0) {
        await db.umas.bulkPut(grewRoster);
        setRaceQueue(raceResults);
        setQueueIndex(0);
        setRaceOutcome(raceResults[0].outcome);
    } else {
        let newWeek = gameState.week + 1;
        let newYear = gameState.year;
        let finalRoster = [...grewRoster];
        
        if (newWeek > 52) { 
            newWeek = 1; 
            newYear++; 
            setIsSimulating(false);

            // --- END OF YEAR AWARDS (QUICK SIM LOGIC) ---
            const { updatedRoster, newsData } = assignEndOfYearAwards(finalRoster, gameState.year);
            finalRoster = updatedRoster;
            
            if (newsData.length > 0) {
                await db.news.bulkAdd(newsData);
            }
            // --------------------------------------------

            const { checkRetirement } = await import('../logic/ai');
            let retiredCount = 0;
            
            finalRoster.forEach(u => {
                u.age++;
                if (u.status === 'active' && checkRetirement(u, gameState.year)) {
                    u.status = 'retired';
                    retiredCount++;
                }
            });

            const rookies = replenishRosters(finalRoster);
            if (rookies.length > 0) {
                finalRoster.push(...rookies);
                await db.news.add({ 
                    year: newYear, week: 1, 
                    message: `📅 SEASON ${newYear} BEGINS! ${retiredCount} retired. ${rookies.length} new rookies signed.`, 
                    type: 'info' 
                });
            } else {
                 await db.news.add({ 
                    year: newYear, week: 1, 
                    message: `📅 SEASON ${newYear} BEGINS! ${retiredCount} retired.`, 
                    type: 'info' 
                });
            }
        }
        
        await db.umas.bulkPut(finalRoster);
        await db.gameState.update(1, { week: newWeek, year: newYear, money: currentMoney });
    }
  };

  const handleRaceClose = () => {
      const nextIndex = queueIndex + 1;
      if (nextIndex < raceQueue.length) {
          setQueueIndex(nextIndex);
          setRaceOutcome(raceQueue[nextIndex].outcome);
      } else {
          setRaceOutcome(null);
          setRaceQueue([]);
          
          let newWeek = gameState.week + 1;
          let newYear = gameState.year;
          
          if (newWeek > 52) { 
              newWeek = 1; 
              newYear++; 
              setIsSimulating(false);
              
              import('../logic/season').then(async ({ replenishRosters, assignEndOfYearAwards }) => {
                  import('../logic/ai').then(async ({ checkRetirement }) => {
                      let currentRoster = await db.umas.toArray();
                      
                      // --- END OF YEAR AWARDS (BROADCAST LOGIC) ---
                      const { updatedRoster, newsData } = assignEndOfYearAwards(currentRoster, gameState.year);
                      currentRoster = updatedRoster;
                      
                      if (newsData.length > 0) {
                          await db.news.bulkAdd(newsData);
                      }
                      // --------------------------------------------

                      let retiredCount = 0;
                      
                      currentRoster.forEach(u => {
                          u.age++;
                          if (u.status === 'active' && checkRetirement(u, gameState.year)) {
                              u.status = 'retired';
                              retiredCount++;
                          }
                      });
                      
                      const rookies = replenishRosters(currentRoster);
                      if (rookies.length > 0) currentRoster.push(...rookies);
                      
                      await db.news.add({ 
                          year: newYear, week: 1, 
                          message: `📅 SEASON ${newYear} BEGINS! ${retiredCount} retired. ${rookies.length} new rookies signed.`, 
                          type: 'info' 
                      });
                      
                      await db.umas.bulkPut(currentRoster);
                      await db.gameState.update(1, { week: newWeek, year: newYear }); 
                  });
              });
          } else {
              db.gameState.update(1, { week: newWeek, year: newYear }); 
          }
      }
  };

  return (
    <div>
      {raceOutcome ? (
        <div style={{ position: 'relative' }}>
            <div style={{ position: 'fixed', top: 10, left: 20, zIndex: 4000, color: 'white', background: 'rgba(0,0,0,0.8)', padding: '5px 10px', borderRadius: 4 }}>
                📡 Broadcasting Race {queueIndex + 1} of {raceQueue.length}
            </div>
            <RaceViewer 
                outcome={raceOutcome} 
                onClose={handleRaceClose} 
                location={raceQueue[queueIndex].location as any}
                distance={raceQueue[queueIndex].distance}
                surface={raceQueue[queueIndex].surface}
            />
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', marginBottom: '20px' }}>
           <div style={{ flex: 1 }}>
              <h1 style={{ color: 'var(--text-primary)', margin: '0 0 10px 0' }}>Year {gameState.year} - Week {gameState.week}</h1>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {currentEvents.length > 0 ? currentEvents.map(race => {
                    const allocation = allocations[race.id];
                    const field = allocation ? allocation.field : [];
                    const excluded = allocation ? allocation.excluded : [];

                    return (
                        <div key={race.id} style={{ padding: '15px', backgroundColor: 'var(--bg-surface)', borderLeft: `5px solid ${race.grade === 'G1' ? '#3498db' : '#2ecc71'}`, borderRadius: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <span style={{ backgroundColor: race.grade === 'G1' ? '#3498db' : (race.grade === 'G2' ? '#e67e22' : '#27ae60'), color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', marginRight: '8px' }}>
                                        {race.grade}
                                    </span>
                                    <span style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{race.name}</span>
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                        {race.location} • {race.surface} {race.distance}m • {field.length} Runners
                                    </div>
                                </div>
                                {excluded.length > 0 && (
                                    <div style={{ fontSize: '12px', color: '#e74c3c', fontWeight: 'bold' }}>
                                        ⚠️ {excluded.length} Cut
                                    </div>
                                )}
                            </div>
                            <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                <strong>Top Contender:</strong> {field.length > 0 ? `${field[0].lastName} (${calculateRaceRating(field[0], race)})` : 'None'}
                            </div>
                        </div>
                    );
                }) : (
                    <div style={{ padding: '20px', backgroundColor: 'var(--bg-surface)', borderRadius: '8px', color: 'var(--text-secondary)' }}>
                        😴 No races scheduled. Heavy training week.
                    </div>
                )}
              </div>

              <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                  <button onClick={() => advanceWeek(true)} style={{ padding: '12px 24px', fontSize: '16px', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                      ▶ Run Race Day
                  </button>
                  <button onClick={() => advanceWeek(false)} style={{ padding: '12px 24px', fontSize: '16px', backgroundColor: '#7f8c8d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                      ⏭️ Quick Sim
                  </button>
                  <button onClick={initLeagueMode} style={{ padding: '12px 24px', fontSize: '16px', backgroundColor: '#34495e', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                      🏆 Reset League
                  </button>
              </div>
           </div>

           <div style={{ width: '300px', backgroundColor: 'var(--bg-surface)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-default)', height: '500px', overflowY: 'auto' }}>
              <h3 style={{ marginTop: 0, borderBottom: '2px solid var(--border-default)', paddingBottom: '10px', color: 'var(--text-secondary)' }}>📰 League News</h3>
              {latestNews && latestNews.length > 0 ? (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {latestNews.map(item => (
                    <li key={item.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '13px' }}>
                      <span style={{ fontWeight: 'bold', color: 'var(--text-muted)', marginRight: '8px' }}>W{item.week}</span>
                      <span style={{ color: item.type === 'important' ? '#e67e22' : 'var(--text-primary)' }}>{item.message}</span>
                    </li>
                  ))}
                </ul>
              ) : <p style={{ color: 'var(--text-muted)' }}>Waiting for history...</p>}
           </div>
        </div>
      )}
    </div>
  );
}