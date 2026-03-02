// src/logic/ai.ts
import type { Uma } from '../types';
import { FULL_CALENDAR, type RaceEvent } from '../data/calendar';

// JRA REALISM CONSTANTS
const MAX_STARTS_ELITE_SOFT = 6;  
const MAX_STARTS_ELITE_HARD = 9;  
const MAX_STARTS_OPEN = 12;      

// CONFIG: REST WEEKS
const REST_WEEKS_ELITE = 4; 
const REST_WEEKS_OPEN = 2;  

const G1_NAMES = [
    "February Stakes", "Takamatsunomiya Kinen", "Osaka Hai", "Oka Sho", "Satsuki Sho",
    "Tenno Sho (Spring)", "NHK Mile Cup", "Victoria Mile", "Yushun Himba", "Japanese Oaks",
    "Tokyo Yushun", "Japanese Derby", "Yasuda Kinen", "Takarazuka Kinen", "Sprinters Stakes",
    "Shuka Sho", "Kikuka Sho", "Tenno Sho (Autumn)", "Queen Elizabeth II",
    "Mile Championship", "Japan Cup", "Champions Cup", "Arima Kinen"
];

const RESTRICTED_3YO_RACES = [
    "Oka Sho", "Satsuki Sho", "NHK Mile Cup", "Yushun Himba", "Japanese Oaks",
    "Tokyo Yushun", "Japanese Derby", "Shuka Sho", "Kikuka Sho",
    "Fairy Stakes", "Shinzan Kinen", "Kisaragi Sho", "Tulip Sho", "Yayoi Sho",
    "Spring Stakes", "Flora Stakes", "Aoba Sho", "Kyoto Shimbun Hai",
    "Unicorn Stakes", "Radio Nikkei", "Leopard Stakes", "Shion Stakes",
    "Rose Stakes", "St. Lite Kinen", "Kobe Shimbun Hai",
    "Fillies' Revue", "Anemone Stakes", "Wakaba Stakes", "Sweetpea Stakes", "Principal Stakes"
];

// EXPORTED SO MATCHMAKING CAN USE IT
export const TRIAL_MAP: Record<string, string[]> = {
    "Satsuki Sho": ["Yayoi Sho", "Spring Stakes", "Wakaba Stakes"],
    "Tokyo Yushun": ["Satsuki Sho", "Aoba Sho", "Kyoto Shimbun Hai", "Principal Stakes"],
    "Kikuka Sho": ["St. Lite Kinen", "Kobe Shimbun Hai"],
    "Oka Sho": ["Tulip Sho", "Fairy Stakes", "Fillies' Revue", "Anemone Stakes"],
    "Yushun Himba": ["Oka Sho", "Flora Stakes", "Sweetpea Stakes"],
    "Shuka Sho": ["Rose Stakes", "Shion Stakes"],
    "Tenno Sho (Spring)": ["Hanshin Daishoten", "Nikkei Sho"],
    "Tenno Sho (Autumn)": ["Mainichi Okan", "All Comers", "Kyoto Daishoten"],
    "Japan Cup": ["Kyoto Daishoten", "Tenno Sho (Autumn)"],
    "Arima Kinen": ["Japan Cup", "Kikuka Sho", "Tenno Sho (Autumn)"]
};

const getDistanceType = (dist: number): 'short' | 'mile' | 'medium' | 'long' => {
  if (dist >= 1000 && dist <= 1400) return 'short';
  if (dist === 1600) return 'mile';
  if (dist >= 1800 && dist <= 2000) return 'medium';
  if (dist >= 2200) return 'long';
  return 'medium';
};

export function shouldAIEnterRace(uma: Uma, race: RaceEvent, currentWeek: number, currentYear: number): boolean {
  if (uma.targetRace === race.name) return true;
  if (uma.injuryWeeks > 0) return false;
  
  const is3yoOnly = RESTRICTED_3YO_RACES.some(c => race.name.includes(c));
  if (is3yoOnly && uma.age !== 3) return false;
  
  const history = uma.history || [];

  // --- FIXED: THE "STRICT TARGET" GOLDEN TICKET HOLD ---
  let targetedG1ByTicket: string | null = null;

  for (const g1 of Object.keys(TRIAL_MAP)) {
      const trials = TRIAL_MAP[g1];
      
      const earnedTicket = history.some(h => 
          h.year === currentYear && 
          trials.some(t => h.raceName.includes(t)) && 
          h.rank <= 3
      );
      
      const spentTicket = history.some(h => 
          h.year === currentYear && 
          h.raceName.includes(g1)
      );

      if (earnedTicket && !spentTicket) {
          // Expiration Check: If they missed the G1 due to injury, the ticket expires
          const g1Event = FULL_CALENDAR.find(r => r.name.includes(g1));
          if (g1Event && currentWeek > g1Event.week) {
              continue; 
          }
          targetedG1ByTicket = g1;
          break; // Lock onto the specific G1
      }
  }

  // If they hold a ticket for a specific G1, they MUST run it and skip all other races
  if (targetedG1ByTicket) {
      if (race.name.includes(targetedG1ByTicket)) {
          return true; // Bypass rest & aptitude filters. They earned it, they're running.
      } else {
          return false; // Reject all other races, even other G1s.
      }
  }
  // ---------------------------------------------------

  // SUITABILITY CHECK
  // @ts-ignore
  const turfApt = uma.aptitude?.surface?.turf || 1;
  // @ts-ignore
  const dirtApt = uma.aptitude?.surface?.dirt || 1;

  if (race.surface === 'Dirt' && dirtApt < 4) return false;
  if (race.surface === 'Turf' && turfApt < 4) return false;

  const distType = getDistanceType(race.distance);
  // @ts-ignore
  const distApt = uma.aptitude?.distance?.[distType] || 1;
  
  const minApt = race.grade === 'G1' ? 4 : 3;
  if (distApt < minApt) return false;

  const g1Wins = history.filter(h => 
      h.rank === 1 && (h.raceName.includes('G1') || G1_NAMES.some(g => h.raceName.includes(g)))
  ).length;
  
  // THE "ABSOLUTE CEILING"
  const totalWins = uma.career?.wins || 0;
  const isChampion = g1Wins > 0;
  const isVeteran = totalWins >= 8;

  if (race.grade === 'G3' && (isChampion || isVeteran || totalWins >= 6)) return false; 
  if (race.grade === 'G2' && (isChampion || isVeteran)) return false;

  // --- FIXED: STANDARD CONDITION CHECK ---
  // Lowered the floor to 60 for all races so healthy horses don't skip G2/G3s.
  const minCondition = 60;
  if ((uma.condition || 100) < minCondition) return false;

  // SCHEDULE & REST LOGIC
  const thisYearRaces = history.filter(h => h.year === currentYear); 
  const lastRace = history[history.length - 1];
  
  const statTotal = uma.stats.speed + uma.stats.stamina + uma.stats.power + uma.stats.guts + uma.stats.wisdom;
  const isElite = statTotal > 3200 || (uma.career?.earnings || 0) > 20000;

  if (lastRace) {
      let weeksSince = currentWeek - lastRace.week;
      if (weeksSince < 0) weeksSince += 52;
      
      let requiredRest = isElite ? REST_WEEKS_ELITE : REST_WEEKS_OPEN;

      if (race.grade === 'G1' && weeksSince >= 3) {
          requiredRest = 3;
      }

      if (weeksSince < requiredRest) return false;
  }

  // CAREER MANAGEMENT
  if (isElite) {
      const hardCap = race.name.includes('Arima') ? MAX_STARTS_ELITE_HARD + 1 : MAX_STARTS_ELITE_HARD;
      if (thisYearRaces.length >= hardCap) return false;
      if (thisYearRaces.length >= MAX_STARTS_ELITE_SOFT && race.grade !== 'G1') return false;
      if (race.grade === 'G3' && thisYearRaces.length > 0) return false; 
  } else {
      if (thisYearRaces.length >= MAX_STARTS_OPEN) return false;
  }

  return true;
}

export function checkRetirement(uma: Uma, currentYear: number): boolean {
    const age = uma.age;
    const totalEarnings = uma.career?.earnings || 0;
    const totalRaces = uma.career?.races || 0;
    
    const g1Wins = uma.history?.filter(h => 
        h.rank === 1 && (h.raceName.includes("G1") || G1_NAMES.some(g1 => h.raceName.includes(g1)))
    )?.length || 0;

    if (age >= 8) return true; 
    
    if (g1Wins >= 6) {
        if (age >= 5) return Math.random() > 0.1; 
        if (age === 4) return Math.random() > 0.6; 
    }

    if (totalRaces > 35) {
        if (g1Wins < 3) return true; 
        return Math.random() > 0.4; 
    }
    
    if (age >= 4 && totalEarnings < 500) return true;
    
    if (age >= 6) {
        const chance = age === 6 ? 0.3 : 0.6; 
        return Math.random() < chance;
    }
    
    return false;
}