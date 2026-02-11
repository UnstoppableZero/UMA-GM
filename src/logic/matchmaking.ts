// src/logic/matchmaking.ts
// src/logic/matchmaking.ts
import type { Uma } from '../types';
import type { RaceEvent } from '../data/calendar';
import { shouldAIEnterRace } from './ai';

// 1. GET ALL QUALIFIED (No limits)
export function getQualifiedEntrants(allHorses: Uma[], race: RaceEvent): Uma[] {
  const candidates = allHorses.filter(uma => {
    if (uma.status !== 'active' || !uma.stats || !uma.aptitude) return false;
    
    // Strict AI Check
    if (!shouldAIEnterRace(uma, race)) return false;
    
    return true;
  });

  // Score them
  const scoredCandidates = candidates.map(uma => {
    let score = 0;
    score += uma.stats.speed;
    score += uma.stats.power * 0.5;
    score += uma.stats.stamina * 0.5;
    
    if (race.distance >= 2400) {
      if (uma.stats.stamina < 400) score -= 300;
      score += uma.stats.stamina * 0.5; 
    } else if (race.distance <= 1400) {
      score += uma.stats.speed * 0.5; 
    }

    // @ts-ignore
    const dirtApt = uma.aptitude.surface?.dirt || 0;
    // @ts-ignore
    const turfApt = uma.aptitude.surface?.turf || 0;

    if (race.surface === 'Dirt' && dirtApt < 4) score -= 800; 
    if (race.surface === 'Turf' && turfApt < 4) score -= 800;

    return { uma, score };
  });

  // Sort by Score Descending
  scoredCandidates.sort((a, b) => b.score - a.score);
  
  return scoredCandidates.map(c => c.uma);
}

// 2. CREATE DIVISIONS (The Scalability Fix)
export function createDivisions(entrants: Uma[]): Uma[][] {
  const MAX_PER_RACE = 18;
  
  // If we fit in one race, just return one group
  if (entrants.length <= MAX_PER_RACE) {
    return [entrants];
  }

  // Calculate number of divisions needed
  const numDivisions = Math.ceil(entrants.length / MAX_PER_RACE);
  const divisions: Uma[][] = Array.from({ length: numDivisions }, () => []);

  // "Snake Draft" distribution to balance the heats
  // (Prevents Heat 1 being all Elites and Heat 2 being all Scrubs)
  entrants.forEach((uma, index) => {
    const divisionIndex = index % numDivisions;
    divisions[divisionIndex].push(uma);
  });

  return divisions;
}

// ... calculateOdds remains the same
export function calculateOdds(uma: Uma, field: Uma[]): string {
    if (!uma.stats) return "99.9";
    const myScore = uma.stats.speed + uma.stats.power + uma.stats.stamina;
    const scores = field.map(u => (u.stats?.speed || 0) + (u.stats?.power || 0) + (u.stats?.stamina || 0));
    const bestScore = Math.max(...scores, 1);
    const diffRatio = bestScore / (myScore || 1);
    let odds = (diffRatio * diffRatio * 2.0).toFixed(1);
    if (parseFloat(odds) < 1.1) odds = "1.1";
    if (parseFloat(odds) > 99.9) odds = "99.9";
    return odds;
}