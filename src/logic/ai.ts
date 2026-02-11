// src/logic/ai.ts
import type { Uma } from '../types';
import type { RaceEvent } from '../data/calendar';

export function shouldAIEnterRace(uma: Uma, race: RaceEvent): boolean {
  
  // 1. FATIGUE CHECK
  if (uma.condition < 30) return false;

  // 2. SUITABILITY CHECK
  const isDirtRace = race.surface === 'Dirt';
  const isTurfRace = race.surface === 'Turf';
  // Default to 0 if missing
  // @ts-ignore
  const dirtApt = uma.aptitude?.surface?.dirt || 0;
  // @ts-ignore
  const turfApt = uma.aptitude?.surface?.turf || 0;

  // STRICT SURFACE FILTER
  // If it's Dirt, you need at least 'C' Rank (4)
  if (isDirtRace && dirtApt < 4) return false;
  if (isTurfRace && turfApt < 4) return false;


  // 3. TIERING LOGIC (The New Strict Rules)
  const totalWins = uma.career?.wins || 0;
  const totalEarnings = uma.career?.earnings || 0;
  const statTotal = uma.stats.speed + uma.stats.stamina + uma.stats.power;

  // "Elite" = Top 30% of the league (S-Rank or High A-Rank)
  // These horses get a "Pass" to enter G1s based on raw talent.
  const isElite = statTotal > 1450; 
  
  const isG1Winner = uma.trophies?.length > 0 || totalWins > 6;


  // --- CASE A: G1 RACES ---
  if (race.grade === 'G1') {
    // QUALIFICATION: Who gets to run in a G1?
    
    // 1. Automatic: Past G1 Winners
    if (isG1Winner) return true;
    
    // 2. The "Prodigy" Rule:
    // If you have >1450 stats, you are world-class. You get in.
    if (isElite) return true;

    // 3. The "Proven Quality" Rule (The Fix):
    // You need 4+ Wins to prove consistency (2 wins isn't enough anymore).
    // OR you need >$15k earnings (implies you won a G2 or high-value races).
    if (totalWins >= 4 || totalEarnings > 15000) {
        return true;
    }

    return false; // "Go back to the G2/G3 circuit."
  }

  // --- CASE B: G2 RACES ---
  if (race.grade === 'G2') {
    // G1 Winners mostly skip G2s to save energy
    if (isG1Winner) {
        // 90% chance to skip unless they need a tune-up
        return Math.random() > 0.95; 
    }
    return true; 
  }

  // --- CASE C: G3 RACES ---
  if (race.grade === 'G3') {
    // STRICT BAN: Elites & Legends strictly forbidden.
    // This stops Oguri Cap from bullying the G3 field.
    if (isG1Winner) return false; 
    if (isElite) return false;    
    
    return true; 
  }

  return true;
}