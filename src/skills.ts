// src/skills.ts

export type SkillRarity = 'Common' | 'Elite' | 'Legendary';
export type SkillType = 'Pace' | 'Positioning' | 'LateKick' | 'Passive' | 'Mental';

export interface SkillConditions {
  surface?: 'Turf' | 'Dirt';
  distance?: 'Short' | 'Mile' | 'Medium' | 'Long';
  strategy?: 'Runner' | 'Leader' | 'Betweener' | 'Chaser';
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  rarity: SkillRarity;
  type: SkillType;
  conditions?: SkillConditions; 
}

export const SKILL_DATABASE: Skill[] = [
  // PACE TRAITS
  { id: 'tr_1', name: "Front-Runner's Pride", rarity: 'Elite', type: 'Pace', description: "Relaxes and saves stamina when leading the pack completely uncontested.", conditions: { strategy: 'Runner' } },
  { id: 'tr_2', name: "Pace Dictator", rarity: 'Legendary', type: 'Pace', description: "Masterfully controls the peloton's pace, forcing others to run at their rhythm.", conditions: { strategy: 'Leader' } },
  { id: 'tr_3', name: "Patient Setup", rarity: 'Common', type: 'Pace', description: "Highly efficient stamina conservation during the middle leg.", conditions: { strategy: 'Betweener' } },

  // LATE KICK (SUEASHI) TRAITS
  { id: 'tr_4', name: "Pack Piercer", rarity: 'Elite', type: 'LateKick', description: "Accelerates sharply when finding a narrow gap between horses in the final stretch.", conditions: { strategy: 'Betweener' } },
  { id: 'tr_5', name: "Outside Sweeper", rarity: 'Elite', type: 'LateKick', description: "Maintains top speed much longer when swinging wide on the final bend.", conditions: { strategy: 'Chaser' } },
  { id: 'tr_6', name: "Relentless Shadow", rarity: 'Common', type: 'LateKick', description: "Gains a burst of motivation when locked onto the leader's slipstream.", conditions: { strategy: 'Leader' } },

  // SURFACE / DISTANCE SPECIALISTS
  { id: 'tr_7', name: "Turf Specialist", rarity: 'Common', type: 'Passive', description: "A fluid, light stride perfect for fast turf conditions.", conditions: { surface: 'Turf' } },
  { id: 'tr_8', name: "Heavy Dirt Plow", rarity: 'Common', type: 'Passive', description: "High-knee action that effortlessly cuts through deep dirt.", conditions: { surface: 'Dirt' } },
  { id: 'tr_9', name: "Marathon Lungs", rarity: 'Elite', type: 'Passive', description: "Exceptional oxygen capacity built for distances over 3000m.", conditions: { distance: 'Long' } },
  { id: 'tr_10', name: "Sprinter's Twitch", rarity: 'Elite', type: 'Passive', description: "Fast-twitch muscle fibers designed for pure, explosive speed.", conditions: { distance: 'Short' } },

  // MENTAL
  { id: 'tr_11', name: "Tenacious", rarity: 'Elite', type: 'Mental', description: "Refuses to yield; ignores heavy fatigue when running neck-and-neck." },
  { id: 'tr_12', name: "Temperamental", rarity: 'Common', type: 'Mental', description: "Massive potential, but occasionally fights the jockey or blows the start." }
];