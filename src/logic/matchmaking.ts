// src/logic/matchmaking.ts
import type { Uma } from '../types';
import type { RaceEvent } from '../data/calendar';
import { shouldAIEnterRace } from './ai';

/**
 * PUBLIC: Calculates visual rating and odds (Pure Ability)
 * Used for UI display and Odds calculation.
 */
export const calculateRaceRating = (uma: Uma, race: RaceEvent): number => {
  if (!uma.stats) return 0;
  
  // Base score from stats
  let score = (uma.stats.speed + uma.stats.stamina + uma.stats.power + uma.stats.guts + uma.stats.wisdom);

  // NOTE: REMOVED EARNINGS FROM VISUAL RATING
  // This prevents the "11,000 Rating" bug.

  // 1. Surface Penalty
  // @ts-ignore
  const turfApt = uma.aptitude.surface?.turf || 1;
  // @ts-ignore
  const dirtApt = uma.aptitude.surface?.dirt || 1;

  if (race.surface === 'Turf' && turfApt < 6) score -= (7 - turfApt) * 300;
  if (race.surface === 'Dirt' && dirtApt < 6) score -= (7 - dirtApt) * 300;

  // 2. Distance Penalty
  if (race.distance >= 2400 && uma.stats.stamina < 500) score -= 300;
  if (race.distance <= 1400 && uma.stats.speed < 600) score -= 200;

  // 3. Condition Bonus
  const conditionBonus = (uma.condition || 100) / 100;
  score *= (0.9 + (conditionBonus * 0.1));

  return Math.floor(score);
};

/**
 * INTERNAL: Calculates who deserves to be in the race.
 * Includes "Class" (Earnings) to prioritize established horses.
 */
const calculatePriorityScore = (uma: Uma, race: RaceEvent): number => {
    let ability = calculateRaceRating(uma, race);
    // Add Earnings Weight (This ensures rich horses get priority entry)
    // But keeps it hidden from the UI
    return ability + (uma.career?.earnings || 0) * 0.5;
};

// Helper for initial sort
const getTotalStats = (uma: Uma) => 
  (uma.stats.speed + uma.stats.stamina + uma.stats.power + uma.stats.guts + uma.stats.wisdom);

/**
 * SMART ALLOCATION (PRIORITY QUEUE)
 */
export function autoAllocateHorses(allHorses: Uma[], weeklyRaces: RaceEvent[], currentWeek: number, currentYear: number) {
  const MAX_PER_RACE = 18;
  
  const finalFieldMap: Record<string, { field: Uma[], excluded: Uma[] }> = {};
  weeklyRaces.forEach(r => finalFieldMap[r.id] = { field: [], excluded: [] });

  const sortedRoster = [...allHorses]
    .filter(u => u.status === 'active' && (u.condition || 100) >= 30)
    .sort((a, b) => getTotalStats(b) - getTotalStats(a));

  sortedRoster.forEach(uma => {
    const options = weeklyRaces
      .filter(race => shouldAIEnterRace(uma, race, currentWeek, currentYear))
      .map(race => ({ 
          race, 
          // Use Priority Score for sorting "Best Fit"
          priority: calculatePriorityScore(uma, race) 
      }))
      // Filter by raw ability (Rating), not Priority, to ensure competence
      .filter(opt => calculateRaceRating(uma, opt.race) > 1000) 
      .sort((a, b) => b.priority - a.priority); 

    if (options.length === 0) return; 

    let placed = false;
    for (const option of options) {
      const raceId = option.race.id;
      if (finalFieldMap[raceId].field.length < MAX_PER_RACE) {
        finalFieldMap[raceId].field.push(uma);
        placed = true;
        break; 
      }
    }

    if (!placed) {
      const favoriteRaceId = options[0].race.id;
      finalFieldMap[favoriteRaceId].excluded.push(uma);
    }
  });

  return finalFieldMap;
}

export function createOfficialField(entrants: Uma[], race: RaceEvent): { field: Uma[], excluded: Uma[] } {
  const MAX_PER_RACE = 18;
  // Sort by Priority Score to cut the field
  const sortedEntrants = [...entrants].sort((a, b) => calculatePriorityScore(b, race) - calculatePriorityScore(a, race));
  
  return { 
    field: sortedEntrants.slice(0, MAX_PER_RACE), 
    excluded: sortedEntrants.slice(MAX_PER_RACE) 
  };
}

export function calculateOdds(uma: Uma, field: Uma[], race: RaceEvent): string {
    const myScore = calculateRaceRating(uma, race);
    const scores = field.map(u => calculateRaceRating(u, race));
    const bestScore = Math.max(...scores, 1);
    
    const diffRatio = bestScore / (myScore || 1);
    let odds = (Math.pow(diffRatio, 3) * 2.0).toFixed(1); 
    
    if (parseFloat(odds) < 1.1) odds = "1.1";
    if (parseFloat(odds) > 99.9) odds = "99.9";
    return odds;
}

export function getQualifiedEntrants(allHorses: Uma[], race: RaceEvent, currentWeek: number, currentYear: number): Uma[] {
  return allHorses.filter(uma => shouldAIEnterRace(uma, race, currentWeek, currentYear));
}