// src/generator.ts
import type { Uma } from './types';

// Expanded Name Lists for Variety
const FIRST_NAMES = [
  "Special", "Silence", "Tokai", "Gold", "Mejiro", "Narita", "Rice", "Super", "Oguri", 
  "Tamamo", "Vodka", "Daiwa", "Symboli", "Grass", "El", "T.M.", "Maya", "Manhattan", 
  "Agnes", "Eishin", "Nice", "Twin", "Matikan", "Satono", "Kitasan", "Winning"
];
const LAST_NAMES = [
  "Week", "Suzuka", "Teio", "Ship", "McQueen", "Brian", "Shower", "Creek", "Cap", 
  "Cross", "Scarlet", "Rudolf", "Wonder", "Condor", "Opera", "Top Gun", "Cafe", 
  "Tachyon", "Flash", "Motion", "Nature", "Ticket", "Fukukitaru", "Diamond", "Black"
];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// -------------------------------------------------------------
// MAIN GENERATOR
// -------------------------------------------------------------
export function generateUma(parent?: Uma): Uma {
  // 1. DETERMINE TIER (The "Gacha" Roll)
  // UPDATED: Boosted floors to ensure horses qualify for races
  const roll = Math.random();
  let baseStatMin = 350; // Was 300
  let baseStatMax = 500; // Was 450
  
  if (roll > 0.90) { // S-Rank Monster (The "Oguri Cap" tier)
    baseStatMin = 600; // Major buff
    baseStatMax = 800;
  } else if (roll > 0.60) { // A-Rank Prospect (G1 Winner Potential)
    baseStatMin = 450;
    baseStatMax = 600;
  }

  // 2. GENERATE BASE STATS
  const speed = randomInt(baseStatMin, baseStatMax);
  const stamina = randomInt(baseStatMin, baseStatMax);
  const power = randomInt(baseStatMin, baseStatMax);
  const guts = randomInt(baseStatMin, baseStatMax);
  const wisdom = randomInt(baseStatMin, baseStatMax);
  
  // INHERITANCE LOGIC
  let bonusSpeed = 0;
  let bonusStamina = 0;
  let bonusPower = 0;
  let inheritedTrophies: string[] = [];

  if (parent) {
    bonusSpeed = Math.floor(parent.stats.speed * 0.2);
    bonusStamina = Math.floor(parent.stats.stamina * 0.2);
    bonusPower = Math.floor(parent.stats.power * 0.2);
    inheritedTrophies.push(`Daughter of ${parent.lastName}`);
  }

  // 3. GENERATE APTITUDE (Specialization)
  const isDirtSpecialist = Math.random() > 0.8; // 20% Chance for Dirt Horse
  const isSprinter = Math.random() > 0.7; // 30% Sprinter
  const isStayer = Math.random() > 0.8; // 20% Long Distance

  // 4. GENERATE NAME
  const fName = FIRST_NAMES[randomInt(0, FIRST_NAMES.length - 1)];
  const lName = LAST_NAMES[randomInt(0, LAST_NAMES.length - 1)];

  // --- RETURN OBJECT ---
  return {
    id: crypto.randomUUID(),
    firstName: fName,
    lastName: lName,
    // @ts-ignore
    color: '#333', 
    
    // NEW: Condition & Team Link
    condition: 100, // Starts at 100% Fitness
    teamId: 'free_agent', // Default
    
    age: 3, 
    status: 'active',
    skills: [], 
    trophies: inheritedTrophies,
    
    career: { races: 0, wins: 0, top3: 0, earnings: 0 },
    history: [],

    stats: {
      speed: speed + bonusSpeed,
      stamina: stamina + bonusStamina,
      power: power + bonusPower,
      guts: guts,
      wisdom: wisdom,
    },
    
    // APTITUDE (Using Number System 1-10 for AI compatibility)
    // 8-10 = A/S, 6-7 = B, 4-5 = C, 1-3 = F/G
    // Note: Used 'sprint' instead of 'short' to match standard types
    aptitude: {
       surface: { 
         turf: isDirtSpecialist ? 2 : 8, 
         dirt: isDirtSpecialist ? 8 : 1 
       },
       distance: { 
         short: isSprinter ? 8 : 4, 
         mile: 6, 
         medium: 7, 
         long: isStayer ? 8 : 3 
       },
       strategy: { 
         runner: 5, leader: 7, betweener: 5, chaser: 3 
       }
    }
  };
}

// -------------------------------------------------------------
// RIVAL GENERATOR
// -------------------------------------------------------------
export function generateRival(teamId: string, minStat: number): Uma {
  const rival = generateUma();
  
  rival.teamId = teamId; 
  
  // Force stats to match requested average (if provided)
  // Ensure they are competitive (minimum 450)
  const base = Math.max(minStat, 450); 

  rival.stats = {
    speed: base + Math.random() * 100,
    stamina: base + Math.random() * 100,
    power: base + Math.random() * 100,
    guts: base + Math.random() * 100,
    wisdom: base + Math.random() * 100,
  };
  
  return rival;
}