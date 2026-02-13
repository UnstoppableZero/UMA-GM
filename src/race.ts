// src/race.ts
import type { Uma } from './types';
import type { SkillType } from './skills'; // Import the type for safety
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
  raceDistance?: number; 
  surface?: 'Turf' | 'Dirt'; 
}

// HELPER: Convert number distance to Capitalized category
const getDistanceCategory = (dist: number): 'Short' | 'Mile' | 'Medium' | 'Long' => {
    if (dist <= 1400) return 'Short';
    if (dist <= 1800) return 'Mile';
    if (dist <= 2400) return 'Medium';
    return 'Long';
};

// HELPER: Find the horse's best strategy (Capitalized return)
const getBestStrategy = (strats: Record<string, number>): 'Runner' | 'Leader' | 'Betweener' | 'Chaser' => {
    let best = 'Runner';
    let max = 0;
    
    // Normalize keys to ensure we map 'runner' -> 'Runner' if needed
    const map = { runner: 'Runner', leader: 'Leader', betweener: 'Betweener', chaser: 'Chaser' };

    for (const [key, val] of Object.entries(strats)) {
        if (val > max) { 
            max = val; 
            // @ts-ignore
            best = map[key.toLowerCase()] || 'Runner'; 
        }
    }
    return best as 'Runner' | 'Leader' | 'Betweener' | 'Chaser';
};

export function simulateRace(runners: Uma[], distance: number = 2000, surface: 'Turf' | 'Dirt' = 'Turf'): RaceOutcome {
  const log: LogEntry[] = [];
  const distCategory = getDistanceCategory(distance);
  
  // 1. START
  log.push({ message: "And they're off!", timePct: 0.02 });

  // Late Starts (Wisdom Check)
  runners.forEach(uma => {
    if (Math.random() > (uma.stats.wisdom / 1000) + 0.85) { 
      log.push({ 
        message: `${uma.lastName} missed the break!`, 
        timePct: 0.05, 
        type: 'bad' 
      });
    }
  });

  // 2. CALCULATE RESULTS
  const calculatedResults = runners.map(uma => {
    // A. BASE SPEED 
    let metersPerSecond = 16.0; 
    metersPerSecond += (uma.stats.speed / 1200) * 2.5;

    // B. STAMINA PENALTY
    const requiredStamina = distance / 3.5;
    if (uma.stats.stamina < requiredStamina) {
       const fatigue = (requiredStamina - uma.stats.stamina) / 100; 
       metersPerSecond -= Math.min(fatigue, 3.0); 
    }

    // C. POWER BONUS
    metersPerSecond += (uma.stats.power / 1200) * 0.5;

    // D. VARIANCE 
    const variance = (Math.random() * 0.6) - 0.3;
    metersPerSecond += variance;

    // E. CALCULATE RAW TIME
    let time = distance / metersPerSecond; 

    // F. SKILL EVALUATION (FIXED COMPARISONS)
    const activations: { skillName: string; timeOffset: number }[] = [];
    const bestStrat = getBestStrategy(uma.aptitude?.strategy || { runner: 5, leader: 5, betweener: 5, chaser: 5 });

    if (uma.skills && uma.skills.length > 0) {
      uma.skills.forEach(skill => {
        let canTrigger = true;

        // 1. Check strict conditions (Now checking against Capitalized types)
        if (skill.conditions) {
            if (skill.conditions.surface && skill.conditions.surface !== surface) canTrigger = false;
            if (skill.conditions.distance && skill.conditions.distance !== distCategory) canTrigger = false;
            if (skill.conditions.strategy && skill.conditions.strategy !== bestStrat) canTrigger = false;
        }

        // 2. Roll for activation
        const wisdomBonus = uma.stats.wisdom / 2000; 
        if (canTrigger && Math.random() < (skill.triggerChance + wisdomBonus)) {
          // Effect: Time saved
          const timeSaved = skill.effectValue * 0.5; // Tuned down slightly
          time -= timeSaved;
          
          activations.push({ skillName: skill.name, timeOffset: timeSaved });
        }
      });
    }
    
    return { uma, time, skillActivations: activations };
  });

  // Sort by Time (Lowest is best)
  calculatedResults.sort((a, b) => a.time - b.time);
  
  // 3. GENERATE LOGS
  const winner = calculatedResults[0];
  const second = calculatedResults[1];
  const timeDiff = second ? (second.time - winner.time) : 10;

  log.push({ message: `${winner.uma.lastName} takes the lead in the final stretch!`, timePct: 0.85, type: 'good' });

  if (timeDiff < 0.1) {
    log.push({ message: `It's neck and neck between ${winner.uma.lastName} and ${second.uma.lastName}!`, timePct: 0.96, type: 'final' });
    log.push({ message: `📸 PHOTO FINISH! ${winner.uma.lastName} wins by a nose!`, timePct: 1.0, type: 'final' });
  } else if (timeDiff < 0.5) {
    log.push({ message: `${winner.uma.lastName} holds off the charge!`, timePct: 0.95 });
    log.push({ message: `🏆 ${winner.uma.lastName} crosses the line first!`, timePct: 1.0, type: 'final' });
  } else {
    log.push({ message: `${winner.uma.lastName} is running away with it!`, timePct: 0.95 });
    log.push({ message: `🏆 An easy victory for ${winner.uma.lastName}!`, timePct: 1.0, type: 'final' });
  }

  const finalResults: RaceResult[] = calculatedResults.map((res, idx) => ({
    uma: res.uma,
    time: res.time,
    rank: idx + 1,
    skillActivations: res.skillActivations
  }));

  return { results: finalResults, log, raceDistance: distance, surface };
}