// src/logic/matchmaking.ts
import type { Uma } from '../types';
import type { RaceEvent } from '../data/calendar';
import { shouldAIEnterRace } from './ai';

export function getQualifiedEntrants(allHorses: Uma[], race: RaceEvent): Uma[] {
  const candidates = allHorses.filter(uma => {
    // 1. BASIC VALIDITY
    if (uma.status !== 'active' || !uma.stats || !uma.aptitude) return false;
    
    // 2. STRICTOR ELIGIBILITY
    const wins = uma.career?.wins || 0;
    const raceGrade = race.grade as string; 

    if ((raceGrade === 'Maiden' || raceGrade === 'MDN') && wins > 0) return false;
    if ((raceGrade === 'Pre-Open' || raceGrade === 'OP') && wins > 2) return false;

    // 3. FITNESS CHECK
    if ((uma.condition || 100) < 30) return false;

    // 4. AI INTENT CHECK
    if (!shouldAIEnterRace(uma, race)) return false;
    
    return true;
  });

  // (Note: The sorting here is based on "Fit/Score", which is good for deciding WHO gets in,
  // but bad for deciding rank. We will re-sort in createDivisions.)
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

    score += (uma.condition || 100) * 2;

    return { uma, score };
  });

  // Sort by Score Descending to prioritize entry
  scoredCandidates.sort((a, b) => b.score - a.score);
  
  return scoredCandidates.map(c => c.uma);
}

// 2. CREATE DIVISIONS (STRICT RATING TIERING)
export function createDivisions(entrants: Uma[]): Uma[][] {
  const MAX_PER_RACE = 18;
  
  if (entrants.length <= MAX_PER_RACE) {
    return [entrants];
  }

  // 🔥 CRITICAL FIX: FORCE SORT BY TOTAL STATS (RATING) 🔥
  // This ignores fatigue/suitability scores and strictly ranks by raw ability.
  // This ensures Mejiro City (2135) is ALWAYS at the top of Division 1.
  const sortedEntrants = [...entrants].sort((a, b) => {
      const ratingA = (a.stats.speed + a.stats.stamina + a.stats.power + a.stats.guts + a.stats.wisdom);
      const ratingB = (b.stats.speed + b.stats.stamina + b.stats.power + b.stats.guts + b.stats.wisdom);
      return ratingB - ratingA; // Descending Order
  });

  const numDivisions = Math.ceil(sortedEntrants.length / MAX_PER_RACE);
  const divisions: Uma[][] = [];

  // 🔥 FIX 2: CHUNKING INSTEAD OF SHUFFLING
  // We slice the array into contiguous blocks. 
  // 0-18 = Div 1 (Elite)
  // 18-36 = Div 2 (Mid)
  for (let i = 0; i < numDivisions; i++) {
      const start = i * MAX_PER_RACE;
      const end = start + MAX_PER_RACE;
      const heat = sortedEntrants.slice(start, end);
      
      if (heat.length > 0) {
          divisions.push(heat);
      }
  }

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