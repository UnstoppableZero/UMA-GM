// src/race.ts
import type { Uma } from './types';
import { getCommentary } from './commentary'; 

export interface LogEntry {
  message: string;
  timePct: number;
  type?: 'normal' | 'bad' | 'good' | 'final';
}

export interface RaceResult {
  uma: Uma;
  time: number;
  rank: number;
  skillActivations: { skillName: string; timeOffset: number }[];
}

export interface RaceOutcome {
  results: RaceResult[];
  log: LogEntry[];
  // ADDED: TypeScript now knows these exist
  raceDistance?: number; 
  surface?: 'Turf' | 'Dirt';
}

// ADDED: surface parameter with a default of 'Turf'
export function simulateRace(runners: Uma[], distance: number = 2000, surface: 'Turf' | 'Dirt' = 'Turf'): RaceOutcome {
  const log: LogEntry[] = [];
  
  // 1. START
  log.push({ message: getCommentary('start'), timePct: 0.02 });

  // Late Starts (Wisdom Check)
  runners.forEach(uma => {
    if (Math.random() > (uma.stats.wisdom / 1000) + 0.5) { 
      log.push({ 
        message: getCommentary('badStart', { name: uma.lastName }), 
        timePct: 0.05, 
        type: 'bad' 
      });
    }
  });

  // 2. CALCULATE REALISTIC TIMES
  const calculatedResults = runners.map(uma => {
    // A. BASE SPEED (World Record Pace is approx 18m/s, Average is 16m/s)
    let metersPerSecond = 16.0; 

    // B. SPEED BONUS (0 to 1200 stat adds 0 to 2.5 m/s)
    metersPerSecond += (uma.stats.speed / 1200) * 2.5;

    // C. STAMINA PENALTY
    const requiredStamina = distance / 3.5;
    if (uma.stats.stamina < requiredStamina) {
       const fatigue = (requiredStamina - uma.stats.stamina) / 100; 
       metersPerSecond -= Math.min(fatigue, 3.0); 
    }

    // D. POWER BONUS
    metersPerSecond += (uma.stats.power / 1200) * 0.5;

    // E. VARIANCE 
    const variance = (Math.random() * 0.6) - 0.3;
    metersPerSecond += variance;

    // F. CALCULATE RAW TIME
    let time = distance / metersPerSecond; 

    // G. SKILLS
    const activations: { skillName: string; timeOffset: number }[] = [];
    if (uma.skills) {
      uma.skills.forEach(skill => {
        const wisdomBonus = uma.stats.wisdom / 2000; 
        if (Math.random() < (skill.triggerChance + wisdomBonus)) {
          const timeSaved = skill.effectValue * 1.5; 
          time -= timeSaved;
          
          let timing = time * 0.5; 
          if (skill.type === 'start') timing = 1.0; 
          if (skill.type === 'speed') timing = time * 0.85; 
          activations.push({ skillName: skill.name, timeOffset: timing });
        }
      });
    }
    
    const score = metersPerSecond; 

    return { uma, time, score, skillActivations: activations };
  });

  // Sort by Time (Lowest is best)
  calculatedResults.sort((a, b) => a.time - b.time);
  
  // 3. GENERATE COMMENTARY
  const leader = calculatedResults[0].uma;
  const chaser = calculatedResults[Math.floor(Math.random() * (runners.length - 1)) + 1].uma;

  log.push({ message: getCommentary('leader', { name: leader.lastName }), timePct: 0.25 });
  log.push({ message: getCommentary('midRace'), timePct: 0.50 });
  log.push({ message: getCommentary('chaser', { name: chaser.lastName }), timePct: 0.75 });
  
  const winner = calculatedResults[0];
  const second = calculatedResults[1];
  const timeDiff = second ? (second.time - winner.time) : 10;

  log.push({ message: getCommentary('finalStraight'), timePct: 0.88, type: 'good' });

  if (timeDiff < 0.1) {
    log.push({ message: getCommentary('neckAndNeck', { winner: winner.uma.lastName, second: second.uma.lastName }), timePct: 0.96, type: 'final' });
    log.push({ message: `📸 PHOTO FINISH! ${winner.uma.lastName} wins!`, timePct: 1.0, type: 'final' });
  } else if (timeDiff < 0.5) {
    log.push({ message: getCommentary('holdOff', { winner: winner.uma.lastName, second: second.uma.lastName }), timePct: 0.95 });
    log.push({ message: getCommentary('winnerAnnouncement', { winner: winner.uma.lastName }), timePct: 1.0, type: 'final' });
  } else {
    log.push({ message: getCommentary('easyWin', { winner: winner.uma.lastName }), timePct: 0.95 });
    log.push({ message: getCommentary('winnerAnnouncement', { winner: winner.uma.lastName }), timePct: 1.0, type: 'final' });
  }

  const finalResults: RaceResult[] = calculatedResults.map((res, idx) => ({
    uma: res.uma,
    time: res.time,
    rank: idx + 1,
    skillActivations: res.skillActivations
  }));

  // ADDED: Return the distance and surface so the Viewer can read them
  return { results: finalResults, log, raceDistance: distance, surface };
}