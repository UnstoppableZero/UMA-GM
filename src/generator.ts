import { v4 as uuidv4 } from 'uuid';
import type { Uma } from './types';
import { SKILL_DATABASE } from './skills';

// --- NAME DATABASE ---
const CROWN_NAMES = [
  "Special", "Silence", "Tokai", "Gold", "Mejiro", "Narita", "Rice", "Super", "Oguri", 
  "Tamamo", "Vodka", "Daiwa", "Symboli", "Grass", "El", "T.M.", "Maya", "Manhattan", 
  "Agnes", "Eishin", "Nice", "Twin", "Matikan", "Satono", "Kitasan", "Winning",
  "King", "Seiun", "Sakura", "Tosen", "Copano", "Smart", "Daitaku", "Inari", 
  "Biwa", "Air", "Hishi", "Yaeno", "Meisho", "Admire", "Zenno", "Katsuragi", 
  "Nishino", "Shinko", "Kawakami", "Curren", "Haru", "Fine", "Marvelous", 
  "Aston", "Seeking", "Fuji", "Mihono", "Mr.", "Dantsu", "Sir", "Yukino", 
  "Biko", "Ineos", "Sweep", "Jungle", "Machikane", "Tsurumaru", "Nakayama",
  "Deep", "Orfevre", "Gentil", "Almond", "Contrail", "Efforia", "Gran", "Loves", 
  "Chrono", "Glory", "Panthalassa", "Jack", "Titleholder", "Geraldina", "Songline", 
  "Liberty", "Do", "Sol", "Justin", "Danon", "Lord", "Heart's", "Screen", "Maurice", 
  "Rulership", "Kizuna", "Epiphaneia", "Harbinger", "Suave", "Duramente"
];

const SUFFIX_NAMES = [
  "Week", "Suzuka", "Teio", "Ship", "McQueen", "Brian", "Shower", "Creek", "Cap", 
  "Cross", "Scarlet", "Rudolf", "Wonder", "Condor", "Opera", "Top Gun", "Cafe", 
  "Tachyon", "Flash", "Motion", "Nature", "Ticket", "Fukukitaru", "Diamond", "Black",
  "Halo", "Sky", "Bakushin", "Rickey", "Falcon", "Helios", "One", "Hayahide", 
  "Shakur", "Amazon", "Muteki", "Doto", "Vega", "Rob Roy", "Ace", "Flower", 
  "Windy", "Princess", "Chan", "Urara", "Digital", "Pearl", "Crown", "City", 
  "Ramonu", "Ardan", "Dober", "Palmer", "Ryan", "Taishin", "C.B.", "Bourbon", 
  "Kiseki", "Macha", "Zephyr", "Pocket", "Tannhauser", "Tsuyoshi", "Pegasus",
  "Impact", "Donna", "Eye", "Alegria", "Only You", "Genesis", "Vase", "d'Or", 
  "Holder", "Line", "Island", "Deuce", "Oriens", "Palace", "Mantar", "Force", 
  "Kanaloa", "Cry", "Hero", "Richard", "Chosan", "Jackal", "Victory", "Dream", 
  "Hope", "Soul", "Spirit", "Legend", "Myth", "Saga", "Story", "Epic", "Era",
  "Warrior", "Knight", "King", "Queen", "Prince", "Emperor", "Goddess", "Angel",
  "Devil", "Ghost", "Phantom", "Dragon", "Phoenix", "Tiger", "Lion", "Wolf", 
  "Bear", "Eagle", "Hawk", "Storm", "Thunder", "Lightning", "Rain", "Wind", 
  "Fire", "Ice", "Light", "Dark", "Shadow", "Star", "Moon", "Sun", "Shine"
];

const USED_NAMES = new Set<string>();

export function resetNameRegistry() {
    USED_NAMES.clear();
}

function generateUniqueName(): { first: string, last: string } {
    let name = "";
    let fName = "";
    let lName = "";
    let attempts = 0;
    do {
        fName = CROWN_NAMES[Math.floor(Math.random() * CROWN_NAMES.length)];
        lName = SUFFIX_NAMES[Math.floor(Math.random() * SUFFIX_NAMES.length)];
        name = `${fName} ${lName}`;
        attempts++;
    } while (USED_NAMES.has(name) && attempts < 50);
    USED_NAMES.add(name);
    return { first: fName, last: lName };
}

function getRandomSkills(count: number) {
    const skills = [];
    const pool = [...SKILL_DATABASE]; 
    for (let i = 0; i < count; i++) {
        if (pool.length === 0) break;
        const idx = Math.floor(Math.random() * pool.length);
        skills.push(pool[idx]);
        pool.splice(idx, 1); 
    }
    return skills;
}

// --- ARCHETYPE TEMPLATES (The "Anti-BBB" System) ---
const ARCHETYPES = {
    'Sprinter': { speed: 1.35, stamina: 0.60, power: 1.25, guts: 1.0, wisdom: 0.8 },
    'Stayer':   { speed: 0.85, stamina: 1.40, power: 0.9, guts: 1.25, wisdom: 0.8 },
    'Miler':    { speed: 1.20, stamina: 0.85, power: 1.10, guts: 0.9, wisdom: 0.95 },
    'Classic':  { speed: 1.05, stamina: 1.05, power: 1.0, guts: 1.0, wisdom: 0.9 },
    'Dirt':     { speed: 0.85, stamina: 1.0, power: 1.40, guts: 1.20, wisdom: 0.75 }
};

// Updated Signature: Now accepts optional 'forceArchetype'
export const generateTieredUma = (tier: 1 | 2 | 3, forceArchetype?: string): Uma => {
  const id = uuidv4();
  const names = generateUniqueName();

  let baseStatPool = 0;
  switch (tier) {
      case 1: baseStatPool = 650; break;
      case 2: baseStatPool = 550; break;
      case 3: baseStatPool = 450; break;
  }
  
  baseStatPool += Math.floor(Math.random() * 40) - 20; 

  const types = ['Sprinter', 'Miler', 'Classic', 'Stayer', 'Dirt'] as const;
  
  // FIX: Use forced archetype if provided
  let archetype: keyof typeof ARCHETYPES;
  if (forceArchetype && types.includes(forceArchetype as any)) {
      archetype = forceArchetype as keyof typeof ARCHETYPES;
  } else {
      archetype = types[Math.floor(Math.random() * types.length)];
  }

  const mults = ARCHETYPES[archetype];

  const applyStat = (mult: number) => {
      const val = (baseStatPool * mult) + (Math.floor(Math.random() * 30) - 15);
      return Math.floor(Math.min(1000, Math.max(300, val)));
  };

  const stats = {
      speed: applyStat(mults.speed),
      stamina: applyStat(mults.stamina),
      power: applyStat(mults.power),
      guts: applyStat(mults.guts),
      wisdom: applyStat(mults.wisdom)
  };

  // APTITUDES
  const aptitudes = {
      surface: { 
          turf: archetype === 'Dirt' ? 1 : 8, 
          dirt: archetype === 'Dirt' ? 8 : 1 
      },
      distance: {
          short: archetype === 'Sprinter' ? 8 : 4,
          mile: archetype === 'Miler' ? 8 : 4,
          medium: archetype === 'Classic' ? 8 : 4,
          long: archetype === 'Stayer' ? 8 : 4
      },
      strategy: {
          runner: 4, leader: 4, betweener: 4, chaser: 4
      }
  };

  const strats = ['runner', 'leader', 'betweener', 'chaser'] as const;
  aptitudes.strategy[strats[Math.floor(Math.random() * strats.length)]] = 8; 

  const currentTotal = stats.speed + stats.stamina + stats.power + stats.guts + stats.wisdom;
  const currentOvr = Math.floor(currentTotal / 50) + 10;
  const potential = Math.min(99, currentOvr + Math.floor(Math.random() * 8) + 2);

  return {
      id,
      firstName: names.first,
      lastName: names.last,
      teamId: 'free_agent', // Default, but generateUma will overwrite this
      color: '#333',
      age: 3, 
      energy: 100,
      fatigue: 0,
      injuryWeeks: 0,
      potential: potential,
      status: 'active',
      condition: 100,
      trophies: [],
      skills: getRandomSkills(tier === 1 ? (Math.random() > 0.5 ? 2 : 1) : (Math.random() > 0.8 ? 1 : 0)),
      career: { races: 0, wins: 0, top3: 0, earnings: 0 },
      history: [],
      stats: stats,
      currentOvr,
      // @ts-ignore
      aptitude: aptitudes
  };
};

export function generateRival(teamId: string, minStat: number): Uma {
    const uma = generateTieredUma(1);
    uma.teamId = teamId;
    return uma;
}

// --- REAL INHERITANCE SYSTEM ---
export function generateUma(parent?: Uma): Uma {
    // 1. If no parent, return standard rookie (Tier 2)
    if (!parent) {
        const uma = generateTieredUma(2);
        uma.teamId = 'player'; // Ensure they join the player
        return uma;
    }

    // 2. PARENT ANALYSIS
    // Determine parent's best stat to decide Child's Archetype
    const pStats = parent.stats;
    const highestStat = Object.keys(pStats).reduce((a, b) => 
        pStats[a as keyof typeof pStats] > pStats[b as keyof typeof pStats] ? a : b
    );

    let childArchetype = 'Classic';
    if (highestStat === 'speed') childArchetype = 'Sprinter';
    else if (highestStat === 'stamina') childArchetype = 'Stayer';
    else if (highestStat === 'power') childArchetype = 'Dirt';
    else if (highestStat === 'guts') childArchetype = 'Miler';

    // 3. GENERATE CHILD
    const child = generateTieredUma(2, childArchetype);
    
    // 4. APPLY INHERITANCE BONUSES
    // Bonus: +10% of parent's current stats (gives a huge head start)
    child.stats.speed += Math.floor(parent.stats.speed * 0.1);
    child.stats.stamina += Math.floor(parent.stats.stamina * 0.1);
    child.stats.power += Math.floor(parent.stats.power * 0.1);
    child.stats.guts += Math.floor(parent.stats.guts * 0.1);
    child.stats.wisdom += Math.floor(parent.stats.wisdom * 0.1);

    // 5. INHERIT APTITUDES
    // If parent was an 'S' rank in something, child gets at least an 'A'
    if (parent.aptitude.surface.dirt > 6) child.aptitude.surface.dirt = 8;
    if (parent.aptitude.distance.long > 6) child.aptitude.distance.long = 8;
    if (parent.aptitude.distance.short > 6) child.aptitude.distance.short = 8;

    // 6. INHERIT SKILL
    // 50% chance to inherit a random skill from parent
    if (parent.skills.length > 0 && Math.random() > 0.5) {
        const skillToInherit = parent.skills[Math.floor(Math.random() * parent.skills.length)];
        // Avoid duplicates
        if (!child.skills.some(s => s.id === skillToInherit.id)) {
            child.skills.push(skillToInherit);
        }
    }

    child.teamId = 'player';
    return child;
}