// src/training.ts
import type { Uma } from './types';

const MAX_STAT = 1200;  // The absolute limit (SS+)
const MAX_TOTAL_STATS = 4600; // The genetic ceiling

export function trainUma(uma: Uma, focus: 'balanced' | 'speed' | 'stamina' = 'balanced'): { uma: Uma, changes: string[] } {
  const updated = { ...uma, stats: { ...uma.stats } };
  const changes: string[] = [];

  // Track the horse's total stats
  let runningTotal = updated.stats.speed + updated.stats.stamina + updated.stats.power + updated.stats.guts + updated.stats.wisdom;

  // --- NEW: CONDITION MULTIPLIER ---
  // If energy is 100%, multiplier is 1.0. 
  // If energy is 40% (the rest threshold), multiplier is 0.4.
  // This makes managing energy vital for growth!
  const conditionMult = Math.max((uma.energy || 100) / 100, 0.2);

  // --- HELPER: DIMINISHING RETURNS & CAPS ---
  const applyCap = (current: number, rawGain: number) => {
    if (rawGain <= 0) {
        const newValue = Math.max(0, current + rawGain);
        runningTotal += (newValue - current);
        return newValue;
    }

    if (runningTotal >= MAX_TOTAL_STATS) return current;

    const scalingFactor = Math.max(1 - (current / MAX_STAT), 0.05);
    
    // Apply the condition multiplier to the gain
    let actualGain = (rawGain * conditionMult) * scalingFactor;

    if (runningTotal + actualGain > MAX_TOTAL_STATS) {
        actualGain = MAX_TOTAL_STATS - runningTotal;
    }

    const newValue = Math.min(current + actualGain, MAX_STAT);
    runningTotal += (newValue - current);
    
    return newValue;
  };

  // --- AGE LOGIC ---
  let baseGrowth = Math.floor(Math.random() * 4) + 2; 

  if (uma.age > 6) {
    baseGrowth = -2; 
    if (Math.random() < 0.1) changes.push("Age Decline...");
  } else if (uma.age > 4) {
    baseGrowth = 1; 
  }

  // If declining, ignore condition and focus, just lose stats
  if (baseGrowth < 0) {
    updated.stats.speed = applyCap(updated.stats.speed, baseGrowth);
    updated.stats.power = applyCap(updated.stats.power, baseGrowth);
    updated.stats.stamina = applyCap(updated.stats.stamina, baseGrowth);
    
    updated.stats.speed = Math.floor(updated.stats.speed);
    updated.stats.power = Math.floor(updated.stats.power);
    updated.stats.stamina = Math.floor(updated.stats.stamina);
    return { uma: updated, changes };
  }

  // --- APPLY TRAINING WITH FOCUS ---
  if (focus === 'speed') {
    updated.stats.speed = applyCap(updated.stats.speed, baseGrowth * 2.5);
    updated.stats.power = applyCap(updated.stats.power, baseGrowth * 1.0);
  } 
  else if (focus === 'stamina') {
    updated.stats.stamina = applyCap(updated.stats.stamina, baseGrowth * 2.5);
    updated.stats.guts = applyCap(updated.stats.guts, baseGrowth * 1.0);
  } 
  else {
    updated.stats.speed = applyCap(updated.stats.speed, baseGrowth * 1.2);
    updated.stats.stamina = applyCap(updated.stats.stamina, baseGrowth * 1.2);
    updated.stats.power = applyCap(updated.stats.power, baseGrowth * 1.2);
    updated.stats.guts = applyCap(updated.stats.guts, baseGrowth * 1.2);
  }

  if (Math.random() < 0.2) {
    updated.stats.wisdom = applyCap(updated.stats.wisdom, baseGrowth * 1.5);
  }

  // --- CLEANUP ---
  updated.stats.speed = Math.floor(updated.stats.speed);
  updated.stats.stamina = Math.floor(updated.stats.stamina);
  updated.stats.power = Math.floor(updated.stats.power);
  updated.stats.guts = Math.floor(updated.stats.guts);
  updated.stats.wisdom = Math.floor(updated.stats.wisdom);

  return { uma: updated, changes };
}