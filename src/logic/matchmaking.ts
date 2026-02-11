// src/logic/matchmaking.ts
import type { Uma } from '../types';
import type { RaceEvent } from '../data/calendar';
import { shouldAIEnterRace } from './ai';

export function getQualifiedEntrants(allHorses: Uma[], race: RaceEvent): Uma[] {
  const candidates = allHorses.filter(uma => {
    // 1. BASIC VALIDITY
    if (uma.status !== 'active' || !uma.stats || !uma.aptitude) return false;
    
   // 2. STRICTOR ELIGIBILITY (The fix for "Phantom Losses")
    const wins = uma.career?.wins || 0;
    const raceGrade = race.grade as string; // Cast to string to allow comparison

    // Use a case-insensitive check or match your specific naming convention
    if ((raceGrade === 'Maiden' || raceGrade === 'MDN') && wins > 0) {
        return false;
    }
    
    // Pre-Open/Listed often have win caps (e.g., 1-2 wins max)
    if ((raceGrade === 'Pre-Open' || raceGrade === 'OP') && wins > 2) {
        return false;
    }

    // 3. FITNESS CHECK
    // If a horse is below 30% condition, they should not be forced into a race
    if (uma.condition < 30) return false;

    // 4. AI INTENT CHECK
    // This calls your AI logic to see if the distance/surface is a good fit
    if (!shouldAIEnterRace(uma, race)) return false;
    
    return true;
  });

  // Score them for entry priority
  const scoredCandidates = candidates.map(uma => {
    let score = 0;
    // Primary Stats
    score += uma.stats.speed;
    score += uma.stats.power * 0.5;
    score += uma.stats.stamina * 0.5;
    
    // Distance Context
    if (race.distance >= 2400) {
      if (uma.stats.stamina < 400) score -= 300;
      score += uma.stats.stamina * 0.5; 
    } else if (race.distance <= 1400) {
      score += uma.stats.speed * 0.5; 
    }

    // Surface Aptitude
    // @ts-ignore
    const dirtApt = uma.aptitude.surface?.dirt || 0;
    // @ts-ignore
    const turfApt = uma.aptitude.surface?.turf || 0;

    if (race.surface === 'Dirt' && dirtApt < 4) score -= 800; 
    if (race.surface === 'Turf' && turfApt < 4) score -= 800;

    // Condition Bonus: Fresh horses are more likely to be entered
    score += (uma.condition || 100) * 2;

    return { uma, score };
  });

  // Sort by Score Descending (Highest scoring entries get priority if over-capacity)
  scoredCandidates.sort((a, b) => b.score - a.score);
  
  return scoredCandidates.map(c => c.uma);
}

// 2. CREATE DIVISIONS
export function createDivisions(entrants: Uma[]): Uma[][] {
  const MAX_PER_RACE = 18;
  
  if (entrants.length <= MAX_PER_RACE) {
    return [entrants];
  }

  const numDivisions = Math.ceil(entrants.length / MAX_PER_RACE);
  const divisions: Uma[][] = Array.from({ length: numDivisions }, () => []);

  entrants.forEach((uma, index) => {
    const divisionIndex = index % numDivisions;
    divisions[divisionIndex].push(uma);
  });

  return divisions;
}

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