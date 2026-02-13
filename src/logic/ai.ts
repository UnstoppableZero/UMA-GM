// src/logic/ai.ts
import type { Uma } from '../types';
import type { RaceEvent } from '../data/calendar';
import { FULL_CALENDAR } from '../data/calendar'; 

export function shouldAIEnterRace(uma: Uma, race: RaceEvent): boolean {
  
  // 1. FATIGUE CHECK
  if ((uma.condition || 100) < 30) return false;

  // 2. SUITABILITY CHECK
  // @ts-ignore
  const dirtApt = uma.aptitude?.surface?.dirt || 1;
  // @ts-ignore
  const turfApt = uma.aptitude?.surface?.turf || 1;

  if (race.surface === 'Dirt' && dirtApt < 4) return false;
  if (race.surface === 'Turf' && turfApt < 4) return false;


  // 3. TIERING LOGIC (EARNINGS + WINS + STATS)
  const totalWins = uma.career?.wins || 0;
  const totalEarnings = uma.career?.earnings || 0;
  
  // Helper: Count G1 Wins
  const trophyNames = uma.trophies || [];
  const g1WinCount = trophyNames.filter(name => {
      const raceDef = FULL_CALENDAR.find(r => r.name === name);
      return raceDef && raceDef.grade === 'G1';
  }).length;

  const isG1Winner = g1WinCount > 0;
  
  // Stats
  const statTotal = uma.stats.speed + uma.stats.stamina + uma.stats.power + uma.stats.guts + uma.stats.wisdom;

  // THRESHOLDS
  const isTooGoodForG3Stats = statTotal > 2400; 
  const isTooGoodForG2Stats = statTotal > 2800; 
  
  // EARNINGS THRESHOLDS (The "Class" System)
  // - >8000 Earnings = "Open Class" (Approx 2x G3 wins). Too rich for G3.
  // - >20000 Earnings = "G1 Regular". Too rich for G2 farming.
  const isRich = totalEarnings > 8000;
  const isVeryRich = totalEarnings > 20000;


  // --- CASE A: G1 RACES ---
  if (race.grade === 'G1') {
    // OPEN ENTRY:
    return true; 
  }

  // --- CASE B: G2 RACES ---
  if (race.grade === 'G2') {
    // FARMING BAN:
    
    // 1. DOMINANCE: 2+ G1 Wins = You are a Legend. Stop it.
    if (g1WinCount >= 2) return false;

    // 2. WEALTH BAN: If you are super rich (>20k), you don't need G2 money.
    if (isVeryRich) return false;

    // 3. STAT BAN (for G1 Winners):
    // If you won a G1 AND have good stats, you don't need prep races.
    if (isG1Winner && isTooGoodForG2Stats) return false;

    return true; 
  }

  // --- CASE C: G3 RACES ---
  if (race.grade === 'G3') {
    // AGGRESSIVE SMURF BAN:
    
    // 1. NO G1 WINNERS.
    if (isG1Winner) return false;

    // 2. NO RICH HORSES. (The Missing Link)
    // If you have >8000 earnings, you are Open Class. G3 is beneath you.
    if (isRich) return false;

    // 3. STAT BAN (2400).
    if (isTooGoodForG3Stats) return false;

    // 4. WIN LIMIT (3 Wins).
    if (totalWins >= 3) return false;
    
    return true; 
  }

  return true;
}