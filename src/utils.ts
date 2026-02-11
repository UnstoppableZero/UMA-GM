// src/utils.ts
// src/utils.ts
import type { Uma } from './types';

export function calculateOVR(uma: Uma): number {
  // 1. Average the Base Stats
  const totalStats = 
    uma.stats.speed + 
    uma.stats.stamina + 
    uma.stats.power + 
    uma.stats.guts + 
    uma.stats.wisdom;

  // Formula: Map 0-1200 stats to roughly 0-100 rating
  // A generic C-rank girl (600 avg) -> 3000 total / 55 = ~54 OVR
  // An S-rank legend (1000 avg) -> 5000 total / 55 = ~90 OVR
  // Maxed out (1200 avg) -> 6000 total / 55 = 109 OVR (God tier)
  let baseOVR = totalStats / 55;

  // 2. Bonus for Skills
  // Each skill adds +2 to the OVR (making them more valuable than just raw stats)
  const skillBonus = (uma.skills ? uma.skills.length : 0) * 2;

  return Math.floor(baseOVR + skillBonus);
}

export function getOVRColor(ovr: number): string {
  if (ovr >= 90) return '#e74c3c'; // Red (Legend)
  if (ovr >= 80) return '#f1c40f'; // Gold (Star)
  if (ovr >= 70) return '#2ecc71'; // Green (Starter)
  return '#95a5a6'; // Grey (Bench)
}