// src/training.ts
import type { Uma } from './types';

const MAX_STAT = 1200;  // The absolute limit (SS+)
const MAX_TOTAL_STATS = 4600; // The genetic ceiling - forces horses to have a weakness!

export function trainUma(uma: Uma, focus: 'balanced' | 'speed' | 'stamina' = 'balanced'): { uma: Uma, changes: string[] } {
  const updated = { ...uma, stats: { ...uma.stats } };
  const changes: string[] = [];

  // Track the horse's total stats so we don't exceed the genetic ceiling
  let runningTotal = updated.stats.speed + updated.stats.stamina + updated.stats.power + updated.stats.guts + updated.stats.wisdom;

  // --- HELPER: DIMINISHING RETURNS & CAPS ---
  const applyCap = (current: number, rawGain: number) => {
    // If declining (negative gain), apply it directly (with a floor of 0)
    if (rawGain <= 0) {
        const newValue = Math.max(0, current + rawGain);
        runningTotal += (newValue - current);
        return newValue;
    }

    // If they hit the absolute genetic ceiling, no positive gains allowed
    if (runningTotal >= MAX_TOTAL_STATS) return current;

    // The Elite Wall: Diminishing returns the closer you get to 1200
    // e.g., at 600 stat (50%), you get 50% of the gain. At 1100 stat, you get 8% of the gain.
    const scalingFactor = Math.max(1 - (current / MAX_STAT), 0.05);
    let actualGain = rawGain * scalingFactor;

    // Ensure we don't accidentally overflow the 4600 total cap
    if (runningTotal + actualGain > MAX_TOTAL_STATS) {
        actualGain = MAX_TOTAL_STATS - runningTotal;
    }

    const newValue = Math.min(current + actualGain, MAX_STAT);
    runningTotal += (newValue - current);
    
    return newValue;
  };

  // --- AGE LOGIC ---
  // We assume "Peak Age" is around 4-5 years into their career.
  // Age < 4: High Growth
  // Age 4-6: Plateau
  // Age > 6: Decline

  let baseGrowth = Math.floor(Math.random() * 4) + 2; // Raw gain of 2 to 5

  if (uma.age > 6) {
    baseGrowth = -2; // DECLINE! They lose stats.
    if (Math.random() < 0.1) changes.push("Age Decline..."); // Only push sometimes to avoid spam in UI
  } else if (uma.age > 4) {
    baseGrowth = 1; // Plateau - very slow growth
  }

  // If declining, we don't apply focus multipliers, just subtract directly
  if (baseGrowth < 0) {
    updated.stats.speed = applyCap(updated.stats.speed, baseGrowth);
    updated.stats.power = applyCap(updated.stats.power, baseGrowth);
    updated.stats.stamina = applyCap(updated.stats.stamina, baseGrowth);
    
    // Clean up decimals before returning
    updated.stats.speed = Math.floor(updated.stats.speed);
    updated.stats.power = Math.floor(updated.stats.power);
    updated.stats.stamina = Math.floor(updated.stats.stamina);
    return { uma: updated, changes };
  }

  // --- APPLY TRAINING ---
  // We buff the multipliers slightly to compensate for the diminishing returns!
  if (focus === 'speed') {
    updated.stats.speed = applyCap(updated.stats.speed, baseGrowth * 2.5);
    updated.stats.power = applyCap(updated.stats.power, baseGrowth * 1.0);
  } 
  else if (focus === 'stamina') {
    updated.stats.stamina = applyCap(updated.stats.stamina, baseGrowth * 2.5);
    updated.stats.guts = applyCap(updated.stats.guts, baseGrowth * 1.0);
  } 
  else {
    // Balanced
    updated.stats.speed = applyCap(updated.stats.speed, baseGrowth * 1.2);
    updated.stats.stamina = applyCap(updated.stats.stamina, baseGrowth * 1.2);
    updated.stats.power = applyCap(updated.stats.power, baseGrowth * 1.2);
    updated.stats.guts = applyCap(updated.stats.guts, baseGrowth * 1.2);
  }

  // Chance for Wisdom (Study)
  if (Math.random() < 0.2) {
    updated.stats.wisdom = applyCap(updated.stats.wisdom, baseGrowth * 1.5);
  }

  // --- CLEANUP ---
  // Floor the final values so the UI doesn't show messy decimals like "Speed: 543.27"
  updated.stats.speed = Math.floor(updated.stats.speed);
  updated.stats.stamina = Math.floor(updated.stats.stamina);
  updated.stats.power = Math.floor(updated.stats.power);
  updated.stats.guts = Math.floor(updated.stats.guts);
  updated.stats.wisdom = Math.floor(updated.stats.wisdom);

  return { uma: updated, changes };
}