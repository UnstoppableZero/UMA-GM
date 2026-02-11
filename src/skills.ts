// src/skills.ts

export type SkillRarity = 'common' | 'rare' | 'unique';
export type SkillType = 'speed' | 'acceleration' | 'stamina' | 'positioning' | 'start' | 'passive' | 'debuff';

// Conditions that MUST be met for the skill to even have a chance to trigger
export interface SkillConditions {
  surface?: 'turf' | 'dirt';
  distance?: 'short' | 'mile' | 'medium' | 'long';
  strategy?: 'runner' | 'leader' | 'betweener' | 'chaser';
  phase?: 'start' | 'middle' | 'final_leg' | 'straight';
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  rarity: SkillRarity;
  type: SkillType;
  triggerChance: number; // 0.1 = 10%
  effectValue: number;   // Time saved in seconds (Speed) OR Stamina preserved (Stamina)
  conditions?: SkillConditions; // If left undefined, the skill works in any race!
  spCost?: number; // How many Skill Points (SP) it costs to teach a horse this skill
}

export const SKILL_DATABASE: Skill[] = [
  // ==========================================
  // 🟢 RECOVERY / STAMINA SKILLS (The "Blue" Skills)
  // ==========================================
  { 
    id: 'sta_1', name: 'Corner Recovery', rarity: 'common', type: 'stamina', 
    description: 'Slightly recover stamina on corners.', triggerChance: 0.6, effectValue: 0.3, spCost: 110 
  },
  { 
    id: 'sta_2', name: '🔋 Arc Maestro', rarity: 'rare', type: 'stamina', 
    description: 'Massively recover stamina on corners. A flawless turn.', triggerChance: 0.5, effectValue: 0.8, spCost: 350 
  },
  { 
    id: 'sta_3', name: 'Deep Breaths', rarity: 'common', type: 'stamina', 
    description: 'Recover stamina during the middle leg if running Long distances.', triggerChance: 0.5, effectValue: 0.4, 
    conditions: { distance: 'long', phase: 'middle' }, spCost: 120 
  },

  // ==========================================
  // 🟠 SPEED SKILLS (The "Orange" Skills)
  // ==========================================
  { 
    id: 'spd_1', name: 'Straight Line Speed', rarity: 'common', type: 'speed', 
    description: 'Slight speed boost on straightaways.', triggerChance: 0.4, effectValue: 0.25, spCost: 100 
  },
  { 
    id: 'spd_2', name: '🚀 Sprint Turbo', rarity: 'rare', type: 'speed', 
    description: 'Massive speed boost in the final stretch.', triggerChance: 0.4, effectValue: 0.8, 
    conditions: { phase: 'final_leg' }, spCost: 320 
  },
  { 
    id: 'spd_3', name: 'Escape Artist', rarity: 'rare', type: 'speed', 
    description: 'Incredible speed boost in the middle leg to leave the pack behind.', triggerChance: 0.45, effectValue: 0.7, 
    conditions: { strategy: 'runner', phase: 'middle' }, spCost: 320 
  },

  // ==========================================
  // 🟡 ACCELERATION SKILLS
  // ==========================================
  { 
    id: 'acc_1', name: 'Corner Acceleration', rarity: 'common', type: 'acceleration', 
    description: 'Slightly increase acceleration exiting corners.', triggerChance: 0.5, effectValue: 0.2, spCost: 110 
  },
  { 
    id: 'acc_2', name: '🌪️ Storm', rarity: 'rare', type: 'acceleration', 
    description: 'Explosive acceleration when overtaking from the outside.', triggerChance: 0.35, effectValue: 0.7, spCost: 300 
  },
  { 
    id: 'acc_3', name: 'Looming Shadow', rarity: 'common', type: 'acceleration', 
    description: 'Accelerate faster when catching up to the leader.', triggerChance: 0.5, effectValue: 0.3, 
    conditions: { strategy: 'chaser' }, spCost: 130 
  },

  // ==========================================
  // 🟢 PASSIVE / START SKILLS (The "Green" Skills)
  // ==========================================
  { 
    id: 'pas_1', name: '⚡ Concentration', rarity: 'rare', type: 'start', 
    description: 'Perfect start out of the gate, preventing late starts.', triggerChance: 0.6, effectValue: 0.4, 
    conditions: { phase: 'start' }, spCost: 200 
  },
  { 
    id: 'pas_2', name: 'Lone Wolf', rarity: 'common', type: 'passive', 
    description: 'Slightly increases all stats if no other horse in the race has this skill.', triggerChance: 1.0, effectValue: 0.2, spCost: 90 
  },
  { 
    id: 'pas_3', name: 'Turf Master', rarity: 'common', type: 'passive', 
    description: 'Slight speed and power boost on Turf surfaces.', triggerChance: 1.0, effectValue: 0.25, 
    conditions: { surface: 'turf' }, spCost: 90 
  },
  { 
    id: 'pas_4', name: 'Dirt Master', rarity: 'common', type: 'passive', 
    description: 'Slight speed and power boost on Dirt surfaces.', triggerChance: 1.0, effectValue: 0.25, 
    conditions: { surface: 'dirt' }, spCost: 90 
  }
];

// Helper function to fetch full skill data by ID
export const getSkillById = (id: string): Skill | undefined => {
  return SKILL_DATABASE.find(s => s.id === id);
};