import type { Uma } from './types';

export function calculateOVR(uma: Uma): number {
  const stats = uma.stats;
  const totalStats = stats.speed + stats.stamina + stats.power + stats.guts + stats.wisdom;

  // Old Math: (totalStats / 6000) * 100
  // NEW MATH: We grade them against a realistic Hall of Fame cap of 4400 total stats
  let ovr = Math.floor((totalStats / 4400) * 100);

  // Hard cap at 99, because 100 OVR should be literally impossible 
  // (unless you want to allow 100, then change this to 100!)
  return Math.min(ovr, 99); 
}

export function getOVRColor(ovr: number): string {
  if (ovr >= 90) return '#9b59b6'; // Purple for 90+ (Generational / S-Tier)
  if (ovr >= 80) return '#f1c40f'; // Gold for 80s (Elite / A-Tier)
  if (ovr >= 70) return '#e67e22'; // Orange for 70s (Solid / B-Tier)
  if (ovr >= 60) return '#3498db'; // Blue for 60s (Average / C-Tier)
  return '#95a5a6';                // Grey for <60 (Rookies / Scrubs)
}