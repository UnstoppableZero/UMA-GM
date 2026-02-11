// src/training.ts
// src/training.ts
import type { Uma } from './types';

const MAX_STAT = 1200;  // The absolute limit (SS+)
const SOFT_CAP = 1000;  // Gains are halved after this point

// Helper to apply caps
function applyCap(current: number, gain: number): number {
  let actualGain = gain;

  // 1. Soft Cap Rule: If already high, it's harder to get higher
  if (current > SOFT_CAP) {
    actualGain = Math.floor(gain * 0.5); // 50% penalty
  }

  // 2. Hard Cap Rule: Cannot exceed 1200
  return Math.min(current + actualGain, MAX_STAT);
}

export function trainUma(uma: Uma, focus: 'balanced' | 'speed' | 'stamina' = 'balanced'): { uma: Uma, changes: string[] } {
  const updated = { ...uma, stats: { ...uma.stats } };
  const changes: string[] = [];

  // --- AGE LOGIC ---
  // We assume "Peak Age" is around 4-5 years into their career.
  // Age < 4: High Growth
  // Age 4-6: Plateau
  // Age > 6: Decline
  
  // Base Growth (Random 1-3)
  let baseGrowth = Math.floor(Math.random() * 3) + 1;

  // Age Modifier
  if (uma.age > 6) {
    baseGrowth = -1; // DECLINE! They lose stats.
    changes.push("Age Decline...");
  } else if (uma.age > 4) {
    baseGrowth = 1; // Slow growth
  }

  // If declining, we don't apply focus bonuses, just subtract
  if (baseGrowth < 0) {
    updated.stats.speed += baseGrowth;
    updated.stats.power += baseGrowth;
    updated.stats.stamina += baseGrowth;
    return { uma: updated, changes };
  }

  // --- APPLY TRAINING ---
  if (focus === 'speed') {
    updated.stats.speed = applyCap(updated.stats.speed, baseGrowth + 2);
    updated.stats.power = applyCap(updated.stats.power, 1);
  } 
  else if (focus === 'stamina') {
    updated.stats.stamina = applyCap(updated.stats.stamina, baseGrowth + 2);
    updated.stats.guts = applyCap(updated.stats.guts, 1);
  } 
  else {
    // Balanced
    updated.stats.speed = applyCap(updated.stats.speed, 1);
    updated.stats.stamina = applyCap(updated.stats.stamina, 1);
    updated.stats.power = applyCap(updated.stats.power, 1);
  }

  // Chance for Wisdom (Study)
  if (Math.random() < 0.1) {
    updated.stats.wisdom = applyCap(updated.stats.wisdom, 2);
  }

  return { uma: updated, changes };
}