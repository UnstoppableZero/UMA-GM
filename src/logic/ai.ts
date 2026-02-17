import type { Uma } from '../types';
import type { RaceEvent } from '../data/calendar';

// JRA REALISM CONSTANTS
const MAX_STARTS_ELITE_SOFT = 6;  
const MAX_STARTS_ELITE_HARD = 9;  
const MAX_STARTS_OPEN = 12;       

// CONFIG: REST WEEKS
const REST_WEEKS_ELITE = 4; 
const REST_WEEKS_OPEN = 2;  

// UPDATED G1 LIST
const G1_NAMES = [
    "February Stakes", "Takamatsunomiya Kinen", "Osaka Hai", "Oka Sho", "Satsuki Sho",
    "Tenno Sho (Spring)", "NHK Mile Cup", "Victoria Mile", "Yushun Himba", "Japanese Oaks",
    "Tokyo Yushun", "Japanese Derby", "Yasuda Kinen", "Takarazuka Kinen", "Sprinters Stakes",
    "Shuka Sho", "Kikuka Sho", "Tenno Sho (Autumn)", "Queen Elizabeth II",
    "Mile Championship", "Japan Cup", "Champions Cup", "Hanshin JF",
    "Asahi Hai FS", "Arima Kinen", "Hopeful Stakes"
];

// RACES RESTRICTED TO 3-YEAR-OLDS ONLY
const THREE_YO_CLASSICS = [
    "Oka Sho", "Satsuki Sho", "NHK Mile Cup", "Yushun Himba", "Japanese Oaks",
    "Tokyo Yushun", "Japanese Derby", "Shuka Sho", "Kikuka Sho",
    "Radio Nikkei", "Leopard Stakes", "Unicorn Stakes"
];

const getDistanceType = (dist: number): 'short' | 'mile' | 'medium' | 'long' => {
  if (dist >= 1000 && dist <= 1400) return 'short';
  if (dist === 1600) return 'mile';
  if (dist >= 1800 && dist <= 2000) return 'medium';
  if (dist >= 2200) return 'long';
  return 'medium';
};

export function shouldAIEnterRace(uma: Uma, race: RaceEvent, currentWeek: number, currentYear: number): boolean {
  
  // 0. GOD MODE OVERRIDE
  if (uma.targetRace === race.name) return true;

  // 1. PHYSICAL CHECK
  if (uma.injuryWeeks > 0) return false;
  
  // ------------------------------------------------------------------
  // 2. AGE RESTRICTIONS
  // ------------------------------------------------------------------
  const isClassic = THREE_YO_CLASSICS.some(c => race.name.includes(c));
  if (isClassic && uma.age !== 3) return false;
  // ------------------------------------------------------------------
  
  const history = uma.history || [];
  const g1Wins = history.filter(h => 
      h.rank === 1 && (h.raceName.includes('G1') || G1_NAMES.some(g => h.raceName.includes(g)))
  ).length;
  const totalEarnings = uma.career?.earnings || 0;
  
  // ------------------------------------------------------------------
  // 3. PRIORITY EVENTS (TRIPLE CROWN + GRAND PRIX)
  // ------------------------------------------------------------------
  let isPriority = false;

  const hasWon = (namePart: string) => history.some(h => h.raceName.includes(namePart) && h.rank === 1);
  const isElite3YO = uma.age === 3 && (uma.currentOvr || 0) >= 70; // "Elite" threshold

  // A. CLASSIC TRIPLE CROWN PATH
  // Logic: If you are an Elite 3YO, you contest these races. Period.
  // This ensures the winner has to beat other Elites, not just scrubs.
  if (race.name.includes('Satsuki Sho') || race.name.includes('Tokyo Yushun') || race.name.includes('Kikuka Sho')) {
      if (isElite3YO) isPriority = true;
  }

  // B. FILLIES TRIPLE CROWN PATH
  if (race.name.includes('Oka Sho') || race.name.includes('Yushun Himba') || race.name.includes('Shuka Sho')) {
      if (isElite3YO) isPriority = true;
  }

  // C. THE GRAND PRIX RULE (Japan Cup & Arima Kinen)
  if (race.name.includes("Japan Cup") || race.name.includes("Arima Kinen")) {
      const isStar = g1Wins > 0 || totalEarnings > 20000;
      
      const distType = getDistanceType(race.distance);
      // @ts-ignore
      const aptitude = uma.aptitude?.distance?.[distType] || 1;

      if (isStar && aptitude >= 4) { 
          isPriority = true;
      }
  }

  // --- THE PRIORITY BYPASS ---
  if (isPriority) {
      // Lower condition requirement, but not suicidal (was 40, now 50)
      if ((uma.condition || 100) > 50) return true; 
  }
  // ------------------------------------------------------------------

  // ------------------------------------------------------------------
  // 4. THE "ABSOLUTE CEILING" (NO FARMING)
  // ------------------------------------------------------------------
  const totalWins = uma.career?.wins || 0;
  const isChampion = g1Wins > 0;
  const isVeteran = totalWins >= 8;

  // RULE A: G3 BAN
  if (race.grade === 'G3') {
      if (isChampion) return false; 
      if (isVeteran) return false;
      if (totalWins >= 6) return false; 
  }

  // RULE B: G2 BAN
  if (race.grade === 'G2') {
      if (isChampion) return false;
      if (isVeteran) return false;
  }
  // ------------------------------------------------------------------

  // 5. STANDARD CONDITION CHECK
  const minCondition = race.grade === 'G1' ? 60 : 90;
  if ((uma.condition || 100) < minCondition) return false;

  // 6. SUITABILITY CHECK
  // @ts-ignore
  const turfApt = uma.aptitude?.surface?.turf || 1;
  // @ts-ignore
  const dirtApt = uma.aptitude?.surface?.dirt || 1;

  if (race.surface === 'Dirt' && dirtApt < 4) return false;
  if (race.surface === 'Turf' && turfApt < 4) return false;

  const distType = getDistanceType(race.distance);
  // @ts-ignore
  const distApt = uma.aptitude?.distance?.[distType] || 1;
  
  const minApt = race.grade === 'G1' ? 5 : 4;
  if (distApt < minApt) return false;

  // 7. SCHEDULE & REST LOGIC
  const thisYearRaces = history.filter(h => h.year === currentYear); 
  const lastRace = history[history.length - 1];
  
  const statTotal = uma.stats.speed + uma.stats.stamina + uma.stats.power + uma.stats.guts + uma.stats.wisdom;
  const isElite = statTotal > 3200 || (uma.career?.earnings || 0) > 20000;

  if (lastRace) {
      let weeksSince = currentWeek - lastRace.week;
      if (weeksSince < 0) weeksSince += 52;
      
      let requiredRest = isElite ? REST_WEEKS_ELITE : REST_WEEKS_OPEN;
      if (race.grade === 'G1') requiredRest = 1;

      if (weeksSince < requiredRest) return false;
  }

  // 8. CAREER MANAGEMENT (RACE CAPS)
  if (isElite) {
      const hardCap = race.name.includes('Arima') ? MAX_STARTS_ELITE_HARD + 1 : MAX_STARTS_ELITE_HARD;
      
      if (thisYearRaces.length >= hardCap) return false;

      if (thisYearRaces.length >= MAX_STARTS_ELITE_SOFT) {
          if (race.grade !== 'G1') return false;
      }
      
      if (race.grade === 'G3') {
          if (thisYearRaces.length > 0) return false; 
      }
      if (race.grade === 'G1') return true; 
  } else {
      if (thisYearRaces.length >= MAX_STARTS_OPEN) return false;
  }

  return true;
}

// --- RETIREMENT LOGIC ---
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