// src/skills.ts

export type SkillRarity = 'Common' | 'Elite' | 'Legendary';
export type SkillType = 'Speed' | 'Stamina' | 'Acceleration' | 'Start' | 'Passive' | 'Mental';

// Conditions that MUST be met for the skill to trigger
export interface SkillConditions {
  surface?: 'Turf' | 'Dirt';
  distance?: 'Short' | 'Mile' | 'Medium' | 'Long';
  strategy?: 'Runner' | 'Leader' | 'Betweener' | 'Chaser';
  phase?: 'Start' | 'Middle' | 'Final Leg' | 'Corner' | 'Straight';
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  rarity: SkillRarity;
  type: SkillType;
  triggerChance: number; // 0.1 = 10% chance per valid tick/segment
  effectValue: number;   // Magnitude of the boost (Speed m/s, Stamina recovery %, etc)
  conditions?: SkillConditions; // If undefined, works universally
}

export const SKILL_DATABASE: Skill[] = [
  // ==========================================
  // 🔵 STAMINA & RECOVERY (Endurance Management)
  // ==========================================
  { 
    id: 'sta_1', name: 'Corner Recovery', rarity: 'Common', type: 'Stamina', 
    description: 'Finds a rhythm on corners to conserve energy.', 
    triggerChance: 0.6, effectValue: 3.0, // Restores 3.0 energy
    conditions: { phase: 'Corner' }
  },
  { 
    id: 'sta_2', name: 'Arc Maestro', rarity: 'Elite', type: 'Stamina', 
    description: 'Masterful cornering technique that significantly reduces fatigue.', 
    triggerChance: 0.5, effectValue: 7.5, 
    conditions: { phase: 'Corner' }
  },
  { 
    id: 'sta_3', name: 'Deep Breaths', rarity: 'Common', type: 'Stamina', 
    description: 'Takes a moment to regulate breathing during the middle leg.', 
    triggerChance: 0.5, effectValue: 4.0, 
    conditions: { distance: 'Long', phase: 'Middle' } 
  },
  { 
    id: 'sta_4', name: 'Steel Will', rarity: 'Elite', type: 'Mental', 
    description: 'Refuses to slow down even when blocked or bumped.', 
    triggerChance: 0.4, effectValue: 5.0 
  },

  // ==========================================
  // 🟠 SPEED & VELOCITY (Top Speed Modifiers)
  // ==========================================
  { 
    id: 'spd_1', name: 'Straight Line Speed', rarity: 'Common', type: 'Speed', 
    description: 'Efficient stride on straightaways.', 
    triggerChance: 0.4, effectValue: 0.35, // +0.35 m/s top speed
    conditions: { phase: 'Straight' }
  },
  { 
    id: 'spd_2', name: 'Sprint Turbo', rarity: 'Elite', type: 'Speed', 
    description: 'Explosive burst of speed in the final furlong.', 
    triggerChance: 0.4, effectValue: 0.85, 
    conditions: { phase: 'Final Leg' } 
  },
  { 
    id: 'spd_3', name: 'Escape Artist', rarity: 'Elite', type: 'Speed', 
    description: 'Maintains a high cruising speed to break away from the pack.', 
    triggerChance: 0.45, effectValue: 0.6, 
    conditions: { strategy: 'Runner', phase: 'Middle' } 
  },
  { 
    id: 'spd_4', name: 'Shadow Break', rarity: 'Legendary', type: 'Speed', 
    description: 'Legendary turn of foot that defies physics.', 
    triggerChance: 0.3, effectValue: 1.2, 
    conditions: { phase: 'Final Leg' }
  },

  // ==========================================
  // 🟡 ACCELERATION & POSITIONING (Movement Modifiers)
  // ==========================================
  { 
    id: 'acc_1', name: 'Corner Acceleration', rarity: 'Common', type: 'Acceleration', 
    description: 'Exits corners with greater momentum.', 
    triggerChance: 0.5, effectValue: 0.2, // +0.2 m/s² acceleration
    conditions: { phase: 'Corner' }
  },
  { 
    id: 'acc_2', name: 'Storm Front', rarity: 'Elite', type: 'Acceleration', 
    description: 'Aggressive acceleration when overtaking from the outside.', 
    triggerChance: 0.35, effectValue: 0.5 
  },
  { 
    id: 'acc_3', name: 'Looming Shadow', rarity: 'Elite', type: 'Acceleration', 
    description: 'Rapidly closes the gap on the leader in the final straight.', 
    triggerChance: 0.5, effectValue: 0.45, 
    conditions: { strategy: 'Chaser', phase: 'Final Leg' } 
  },

  // ==========================================
  // 🟢 PASSIVE & START (Condition Modifiers)
  // ==========================================
  { 
    id: 'pas_1', name: 'Concentration', rarity: 'Elite', type: 'Start', 
    description: 'Perfect timing out of the gate.', 
    triggerChance: 0.8, effectValue: 0.5, // Reduces start delay by 0.5s
    conditions: { phase: 'Start' } 
  },
  { 
    id: 'pas_2', name: 'Lone Wolf', rarity: 'Common', type: 'Passive', 
    description: 'Performs better when isolated from the pack.', 
    triggerChance: 1.0, effectValue: 10, // +10 to all stats checks
  },
  { 
    id: 'pas_3', name: 'Turf Specialist', rarity: 'Common', type: 'Passive', 
    description: 'Natural affinity for turf surfaces.', 
    triggerChance: 1.0, effectValue: 15, // +15 Power/Speed on Turf
    conditions: { surface: 'Turf' } 
  },
  { 
    id: 'pas_4', name: 'Dirt Specialist', rarity: 'Common', type: 'Passive', 
    description: 'Natural affinity for dirt surfaces.', 
    triggerChance: 1.0, effectValue: 15, 
    conditions: { surface: 'Dirt' } 
  }
];

// Helper function to fetch full skill data by ID
export const getSkillById = (id: string): Skill | undefined => {
  return SKILL_DATABASE.find(s => s.id === id);
};