// src/generator.ts
import type { Uma } from './types';
import { SKILL_DATABASE } from './skills';

// Expanded Name Lists for Variety
const FIRST_NAMES = [
  "Special", "Silence", "Tokai", "Gold", "Mejiro", "Narita", "Rice", "Super", "Oguri", 
  "Tamamo", "Vodka", "Daiwa", "Symboli", "Grass", "El", "T.M.", "Maya", "Manhattan", 
  "Agnes", "Eishin", "Nice", "Twin", "Matikan", "Satono", "Kitasan", "Winning",
  "King", "Seiun", "Sakura", "Tosen", "Copano", "Smart", "Daitaku", "Inari", 
  "Biwa", "Air", "Hishi", "Yaeno", "Meisho", "Admire", "Zenno", "Katsuragi", 
  "Nishino", "Shinko", "Kawakami", "Curren", "Haru", "Fine", "Marvelous", 
  "Aston", "Seeking", "Fuji", "Mihono", "Mr.", "Dantsu", "Sir", "Yukino", 
  "Biko", "Ineos", "Sweep", "Jungle", "Machikane", "Shinko", "Tsurumaru", "Nishino"
];

const LAST_NAMES = [
  "Week", "Suzuka", "Teio", "Ship", "McQueen", "Brian", "Shower", "Creek", "Cap", 
  "Cross", "Scarlet", "Rudolf", "Wonder", "Condor", "Opera", "Top Gun", "Cafe", 
  "Tachyon", "Flash", "Motion", "Nature", "Ticket", "Fukukitaru", "Diamond", "Black",
  "Halo", "Sky", "Bakushin", "Rickey", "Falcon", "Helios", "One", "Hayahide", 
  "Shakur", "Amazon", "Muteki", "Doto", "Vega", "Rob Roy", "Ace", "Flower", 
  "Windy", "Princess", "Chan", "Urara", "Digital", "Pearl", "Crown", "City", 
  "Ramonu", "Ardan", "Dober", "Palmer", "Ryan", "Taishin", "C.B.", "Bourbon", 
  "Kiseki", "Macha", "Zephyr", "Pocket", "Tannhauser", "Tsuyoshi", "Pegasus"
];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// -------------------------------------------------------------
// MAIN GENERATOR
// -------------------------------------------------------------
export function generateUma(parent?: Uma): Uma {
  // 1. DETERMINE TIER
  const roll = Math.random();
  let baseStatMin = 300; 
  let baseStatMax = 420; 
  
  if (roll > 0.98) { baseStatMin = 550; baseStatMax = 650; } 
  else if (roll > 0.85) { baseStatMin = 480; baseStatMax = 580; } 
  else if (roll > 0.40) { baseStatMin = 400; baseStatMax = 520; } 
  else { baseStatMin = 300; baseStatMax = 420; }

  // 2. GENERATE BASE STATS
  const speed = randomInt(baseStatMin, baseStatMax);
  const stamina = randomInt(baseStatMin, baseStatMax);
  const power = randomInt(baseStatMin, baseStatMax);
  const guts = randomInt(baseStatMin, baseStatMax);
  const wisdom = randomInt(baseStatMin, baseStatMax);
  
  // 3. INHERITANCE LOGIC
  let bonusSpeed = 0;
  let bonusStamina = 0;
  let bonusPower = 0;
  let inheritedTrophies: string[] = [];

  if (parent) {
    bonusSpeed = Math.min(Math.floor(parent.stats.speed * 0.1), 50);
    bonusStamina = Math.min(Math.floor(parent.stats.stamina * 0.1), 50);
    bonusPower = Math.min(Math.floor(parent.stats.power * 0.1), 50);
    inheritedTrophies.push(`Daughter of ${parent.lastName}`);
  }

  // 4. GENERATE APTITUDE (FIXED RANDOMIZATION)
  const isDirtSpecialist = Math.random() > 0.85; 
  const isSprinter = Math.random() > 0.7; 
  const isStayer = Math.random() > 0.8; 

  // --- NEW STRATEGY LOGIC ---
  // Pick a "Preferred Strategy" so they are good at one thing, 
  // rather than mediocre at everything.
  const styleRoll = Math.random();
  let strat = { runner: 1, leader: 1, betweener: 1, chaser: 1 };

  if (styleRoll < 0.20) {
      // RUNNER (Great Start, fades late)
      strat = {
          runner: randomInt(8, 10), // A or S
          leader: randomInt(4, 7),  // C or B
          betweener: randomInt(1, 4), 
          chaser: randomInt(1, 2)
      };
  } else if (styleRoll < 0.50) {
      // LEADER (Good positioning)
      strat = {
          runner: randomInt(4, 6),
          leader: randomInt(8, 10), // A or S
          betweener: randomInt(5, 7),
          chaser: randomInt(1, 3)
      };
  } else if (styleRoll < 0.80) {
      // BETWEENER (Mid-pack strike)
      strat = {
          runner: randomInt(1, 3),
          leader: randomInt(5, 7),
          betweener: randomInt(8, 10), // A or S
          chaser: randomInt(4, 6)
      };
  } else {
      // CHASER (Last to First)
      strat = {
          runner: randomInt(1, 2),
          leader: randomInt(2, 4),
          betweener: randomInt(5, 7),
          chaser: randomInt(8, 10) // A or S
      };
  }

  const aptitude = {
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
       strategy: strat // Use the randomized object
  };

  // 5. GENERATE INNATE SKILLS
  const totalStats = speed + stamina + power + guts + wisdom;
  let skillCount = 0;
  if (totalStats > 2800) skillCount = Math.random() > 0.4 ? 2 : 1;
  else if (totalStats > 2200) skillCount = Math.random() > 0.6 ? 1 : 0;
  else if (totalStats > 1600) skillCount = Math.random() > 0.9 ? 1 : 0;

  const innateSkills = [];
  const availableSkills = [...SKILL_DATABASE];
  
  for (let i = 0; i < skillCount; i++) {
      if (availableSkills.length === 0) break;
      const randIdx = Math.floor(Math.random() * availableSkills.length);
      innateSkills.push(availableSkills[randIdx]);
      availableSkills.splice(randIdx, 1);
  }

  const fName = FIRST_NAMES[randomInt(0, FIRST_NAMES.length - 1)];
  const lName = LAST_NAMES[randomInt(0, LAST_NAMES.length - 1)];

  return {
    id: crypto.randomUUID(),
    firstName: fName,
    lastName: lName,
    // @ts-ignore
    color: '#333', 
    condition: 100, 
    teamId: 'free_agent', 
    age: 3, 
    status: 'active',
    skills: innateSkills,
    trophies: inheritedTrophies,
    
    // PROPERTIES
    energy: 100,      
    fatigue: 0,       
    injuryWeeks: 0,   

    career: { races: 0, wins: 0, top3: 0, earnings: 0 },
    history: [],
    stats: {
      speed: speed + bonusSpeed,
      stamina: stamina + bonusStamina,
      power: power + bonusPower,
      guts: guts,
      wisdom: wisdom,
    },
    aptitude
  };
}

export function generateRival(teamId: string, minStat: number): Uma {
  const rival = generateUma();
  rival.teamId = teamId; 
  const base = Math.max(minStat, 400); 
  rival.stats = {
    speed: base + Math.random() * 80,
    stamina: base + Math.random() * 80,
    power: base + Math.random() * 80,
    guts: base + Math.random() * 80,
    wisdom: base + Math.random() * 80,
  };
  return rival;
}