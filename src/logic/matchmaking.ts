// src/logic/matchmaking.ts
import type { Uma } from '../types';
import type { RaceEvent } from '../data/calendar';
import { shouldAIEnterRace, TRIAL_MAP } from './ai'; // NEW IMPORT

export const calculateRaceRating = (uma: Uma, race: RaceEvent): number => {
  if (!uma.stats) return 0;
  
  let score = (uma.stats.speed + uma.stats.stamina + uma.stats.power + uma.stats.guts + uma.stats.wisdom);

  // @ts-ignore
  const turfApt = uma.aptitude?.surface?.turf || 1;
  // @ts-ignore
  const dirtApt = uma.aptitude?.surface?.dirt || 1;

  if (race.surface === 'Turf' && turfApt < 6) score -= (7 - turfApt) * 300;
  if (race.surface === 'Dirt' && dirtApt < 6) score -= (7 - dirtApt) * 300;

  if (race.distance >= 2400 && uma.stats.stamina < 500) score -= 300;
  if (race.distance <= 1400 && uma.stats.speed < 600) score -= 200;

  const conditionBonus = (uma.condition || 100) / 100;
  score *= (0.9 + (conditionBonus * 0.1));

  return Math.floor(Math.max(10, score)); 
};

const calculatePriorityScore = (uma: Uma, race: RaceEvent, currentYear: number): number => {
    let ability = calculateRaceRating(uma, race);
    
    let earningsWeight = race.grade === 'G1' ? 0.2 : 0.1;
    let score = ability + ((uma.career?.earnings || 0) * earningsWeight);

    if (race.grade === 'G1') {
        const trialKey = Object.keys(TRIAL_MAP).find(g1 => race.name.includes(g1));
        if (trialKey) {
            const qualifiedTrials = TRIAL_MAP[trialKey];
            const hasGoldenTicket = uma.history?.some(h => 
                h.year === currentYear && 
                qualifiedTrials.some(trial => h.raceName.includes(trial)) &&
                h.rank <= 3 
            );

            if (hasGoldenTicket) {
                score += 1000000; 
            }
        }
    }
    return score;
};

export function autoAllocateHorses(allHorses: Uma[], weeklyRaces: RaceEvent[], currentWeek: number, currentYear: number) {
  const MAX_PER_RACE = 18;
  
  const finalFieldMap: Record<string, { field: Uma[], excluded: Uma[] }> = {};
  weeklyRaces.forEach(r => {
      finalFieldMap[r.id] = { field: [], excluded: [] };
  });

  const activeRoster = allHorses.filter(u => u.status === 'active' && (u.condition || 100) >= 30);

  interface RaceApplication {
      uma: Uma;
      race: RaceEvent;
      priority: number;
  }
  
  const allApplications: RaceApplication[] = [];
  const horseTopChoice: Record<string, string> = {}; 

  activeRoster.forEach(uma => {
      const validRaces = weeklyRaces.filter(race => shouldAIEnterRace(uma, race, currentWeek, currentYear));
      
      if (validRaces.length > 0) {
          const scoredOptions = validRaces
              .map(race => ({ race, priority: calculatePriorityScore(uma, race, currentYear) }))
              .filter(opt => {
                  if (opt.priority >= 1000000) return true; // Golden Tickets bypass floor
                  
                  const rating = calculateRaceRating(uma, opt.race);
                  // FIX: Lowered G1 floor to 2200 and G2 to 1800 so fields fill out!
                  if (opt.race.grade === 'G1') return rating >= 2200;
                  if (opt.race.grade === 'G2') return rating >= 1800;
                  return rating >= 1400;
              })
              .sort((a, b) => b.priority - a.priority);

          if (scoredOptions.length > 0) {
              horseTopChoice[uma.id] = scoredOptions[0].race.id; 
              
              scoredOptions.forEach(opt => {
                  allApplications.push({ uma, race: opt.race, priority: opt.priority });
              });
          }
      }
  });

  allApplications.sort((a, b) => b.priority - a.priority);

  const assignedHorses = new Set<string>();

  allApplications.forEach(app => {
      if (assignedHorses.has(app.uma.id)) return;
      if (finalFieldMap[app.race.id].field.length >= MAX_PER_RACE) return;

      finalFieldMap[app.race.id].field.push(app.uma);
      assignedHorses.add(app.uma.id);
  });

  activeRoster.forEach(uma => {
      const topChoiceId = horseTopChoice[uma.id];
      if (topChoiceId && !assignedHorses.has(uma.id)) {
          finalFieldMap[topChoiceId].excluded.push(uma);
      }
  });

  return finalFieldMap;
}

export function createOfficialField(entrants: Uma[], race: RaceEvent, currentYear: number): { field: Uma[], excluded: Uma[] } {
  const MAX_PER_RACE = 18;
  const sortedEntrants = [...entrants].sort((a, b) => calculatePriorityScore(b, race, currentYear) - calculatePriorityScore(a, race, currentYear));
  
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