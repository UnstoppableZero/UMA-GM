// src/generator.ts
import { v4 as uuidv4 } from 'uuid';
import type { Uma } from './types';
import { SKILL_DATABASE, type Skill } from './skills';

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
export function resetNameRegistry() { USED_NAMES.clear(); }

function generateUniqueName(): { first: string, last: string } {
    let name = ""; let fName = ""; let lName = ""; let attempts = 0;
    do {
        fName = CROWN_NAMES[Math.floor(Math.random() * CROWN_NAMES.length)];
        lName = SUFFIX_NAMES[Math.floor(Math.random() * SUFFIX_NAMES.length)];
        name = `${fName} ${lName}`;
        attempts++;
    } while (USED_NAMES.has(name) && attempts < 50);
    USED_NAMES.add(name);
    return { first: fName, last: lName };
}

// --- NEW: SMART TRAIT ASSIGNMENT ---
function getSmartTraits(apt: any, count: number): Skill[] {
    const validPool = SKILL_DATABASE.filter(trait => {
        if (trait.conditions?.surface && apt.surface[trait.conditions.surface.toLowerCase()] < 6) return false;
        if (trait.conditions?.distance && apt.distance[trait.conditions.distance.toLowerCase()] < 6) return false;
        if (trait.conditions?.strategy && apt.strategy[trait.conditions.strategy.toLowerCase()] < 6) return false;
        return true;
    });

    const selected: Skill[] = [];
    for (let i = 0; i < count; i++) {
        if (validPool.length === 0) break;
        const idx = Math.floor(Math.random() * validPool.length);
        selected.push(validPool[idx]);
        validPool.splice(idx, 1); 
    }
    return selected;
}

const ARCHETYPES = {
    'Sprinter': { speed: 1.35, stamina: 0.60, power: 1.25, guts: 1.0, wisdom: 0.8 },
    'Stayer':   { speed: 0.85, stamina: 1.40, power: 0.9, guts: 1.25, wisdom: 0.8 },
    'Miler':    { speed: 1.20, stamina: 0.85, power: 1.10, guts: 0.9, wisdom: 0.95 },
    'Classic':  { speed: 1.05, stamina: 1.05, power: 1.0, guts: 1.0, wisdom: 0.9 },
    'Dirt':     { speed: 0.85, stamina: 1.0, power: 1.40, guts: 1.20, wisdom: 0.75 }
};

export const generateTieredUma = (tier: 1 | 2 | 3, forceArchetype?: string, forceAge: number = 3, isLateBloomer: boolean = false): Uma => {
  const id = uuidv4();
  const names = generateUniqueName();

  let baseStatPool = tier === 1 ? 650 : (tier === 2 ? 550 : 450);
  if (isLateBloomer) baseStatPool = 400; 
  baseStatPool += Math.floor(Math.random() * 40) - 20; 

  const types = ['Sprinter', 'Miler', 'Classic', 'Stayer', 'Dirt'] as const;
  const archetype = (forceArchetype && types.includes(forceArchetype as any)) ? forceArchetype as keyof typeof ARCHETYPES : types[Math.floor(Math.random() * types.length)];
  const mults = ARCHETYPES[archetype];

  const applyStat = (mult: number) => Math.floor(Math.min(1000, Math.max(300, (baseStatPool * mult) + (Math.floor(Math.random() * 30) - 15))));

  const stats = { speed: applyStat(mults.speed), stamina: applyStat(mults.stamina), power: applyStat(mults.power), guts: applyStat(mults.guts), wisdom: applyStat(mults.wisdom) };

  let distApts = { short: 1, mile: 1, medium: 1, long: 1 };
  if (archetype === 'Sprinter') distApts = { short: 8, mile: 6, medium: 2, long: 1 };
  else if (archetype === 'Miler') distApts = { short: 6, mile: 8, medium: 6, long: 2 };
  else if (archetype === 'Classic') distApts = { short: 2, mile: 6, medium: 8, long: 6 };
  else if (archetype === 'Stayer') distApts = { short: 1, mile: 3, medium: 6, long: 8 };
  else if (archetype === 'Dirt') distApts = { short: 4, mile: 8, medium: 8, long: 3 }; 

  const aptitudes = {
      surface: { turf: archetype === 'Dirt' ? 1 : 8, dirt: archetype === 'Dirt' ? 8 : 1 },
      distance: distApts,
      strategy: { runner: 4, leader: 4, betweener: 4, chaser: 4 }
  };

  const strats = ['runner', 'leader', 'betweener', 'chaser'] as const;
  aptitudes.strategy[strats[Math.floor(Math.random() * strats.length)]] = 8; 

  const currentTotal = stats.speed + stats.stamina + stats.power + stats.guts + stats.wisdom;
  const currentOvr = Math.floor(currentTotal / 50) + 10;
  
  let potential = Math.min(99, currentOvr + Math.floor(Math.random() * 8) + 2);
  if (isLateBloomer) potential = Math.min(99, 78 + Math.floor(Math.random() * 9)); 

  // Smart Trait Roll
  const traitCount = tier === 1 ? (Math.random() > 0.5 ? 2 : 1) : (Math.random() > 0.8 ? 1 : 0);

  return {
      id, firstName: names.first, lastName: names.last, teamId: 'free_agent', color: '#333',
      age: forceAge, energy: 100, fatigue: 0, injuryWeeks: 0, potential: potential, isLateBloomer: isLateBloomer, 
      status: 'active', condition: 100, trophies: [],
      skills: getSmartTraits(aptitudes, traitCount),
      career: { races: 0, wins: 0, top3: 0, earnings: 0 },
      history: [], stats: stats, currentOvr,
      // @ts-ignore
      aptitude: aptitudes
  };
};

export function generateRival(teamId: string, minStat: number): Uma { return generateTieredUma(1, undefined, 3); }

export function generateUma(parent?: Uma): Uma {
    if (!parent) return generateTieredUma(2);
    const pStats = parent.stats;
    const highestStat = Object.keys(pStats).reduce((a, b) => pStats[a as keyof typeof pStats] > pStats[b as keyof typeof pStats] ? a : b);

    let childArchetype = 'Classic';
    if (highestStat === 'speed') childArchetype = 'Sprinter';
    else if (highestStat === 'stamina') childArchetype = 'Stayer';
    else if (highestStat === 'power') childArchetype = 'Dirt';
    else if (highestStat === 'guts') childArchetype = 'Miler';

    const child = generateTieredUma(2, childArchetype);
    
    child.stats.speed += Math.floor(parent.stats.speed * 0.1);
    child.stats.stamina += Math.floor(parent.stats.stamina * 0.1);
    child.stats.power += Math.floor(parent.stats.power * 0.1);
    child.stats.guts += Math.floor(parent.stats.guts * 0.1);
    child.stats.wisdom += Math.floor(parent.stats.wisdom * 0.1);

    if (parent.aptitude.surface.dirt > 6) child.aptitude.surface.dirt = 8;
    if (parent.aptitude.distance.long > 6) child.aptitude.distance.long = 8;
    if (parent.aptitude.distance.short > 6) child.aptitude.distance.short = 8;

    child.teamId = 'player';
    return child;
}