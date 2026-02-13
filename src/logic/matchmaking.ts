// src/logic/matchmaking.ts
import type { Uma } from '../types';
import type { RaceEvent } from '../data/calendar';
import { shouldAIEnterRace } from './ai';

/**
 * Calculates how well a horse fits a specific race.
 */
export const calculateRaceRating = (uma: Uma, race: RaceEvent): number => {
  if (!uma.stats) return 0;
  
  let score = (uma.stats.speed + uma.stats.stamina + uma.stats.power + uma.stats.guts + uma.stats.wisdom);

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

// Helper for sorting priority
const getTotalStats = (uma: Uma) => 
  (uma.stats.speed + uma.stats.stamina + uma.stats.power + uma.stats.guts + uma.stats.wisdom);

/**
 * SMART ALLOCATION (PRIORITY QUEUE):
 * 1. Sort ALL horses by raw ability (Total Stats).
 * 2. Iterate through them one by one.
 * 3. Place them in their best available race that isn't full.
 */
export function autoAllocateHorses(allHorses: Uma[], weeklyRaces: RaceEvent[]) {
  const MAX_PER_RACE = 18;
  
  // 1. Prepare result containers
  const finalFieldMap: Record<string, { field: Uma[], excluded: Uma[] }> = {};
  weeklyRaces.forEach(r => finalFieldMap[r.id] = { field: [], excluded: [] });

  // 2. Sort ALL horses by "Class" (Total Stats) so the best get first pick
  const sortedRoster = [...allHorses]
    .filter(u => u.status === 'active' && (u.condition || 100) >= 30)
    .sort((a, b) => getTotalStats(b) - getTotalStats(a));

  // 3. Assign horses
  sortedRoster.forEach(uma => {
    // Rank all valid races for this horse by suitability
    const options = weeklyRaces
      .filter(race => shouldAIEnterRace(uma, race))
      .map(race => ({ race, rating: calculateRaceRating(uma, race) }))
      .filter(opt => opt.rating > 1000) // Min competency
      .sort((a, b) => b.rating - a.rating); // Best fit first

    if (options.length === 0) return; // No valid races this week

    let placed = false;

    // Try choices in order: 1st choice, then 2nd, etc.
    for (const option of options) {
      const raceId = option.race.id;
      
      // If race is not full, enter!
      if (finalFieldMap[raceId].field.length < MAX_PER_RACE) {
        finalFieldMap[raceId].field.push(uma);
        placed = true;
        break; // Stop looking, we found a spot
      }
    }

    // If placed nowhere, they are officially Cut from their #1 choice
    if (!placed) {
      const favoriteRaceId = options[0].race.id;
      finalFieldMap[favoriteRaceId].excluded.push(uma);
    }
  });

  return finalFieldMap;
}

// Wrapper for dev tools
export function createOfficialField(entrants: Uma[], race: RaceEvent): { field: Uma[], excluded: Uma[] } {
  const MAX_PER_RACE = 18;
  const sortedEntrants = [...entrants].sort((a, b) => calculateRaceRating(b, race) - calculateRaceRating(a, race));
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

// Legacy wrapper
export function getQualifiedEntrants(allHorses: Uma[], race: RaceEvent): Uma[] {
  return allHorses.filter(uma => shouldAIEnterRace(uma, race));
}