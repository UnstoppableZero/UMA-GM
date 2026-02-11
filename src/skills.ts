// src/skills.ts

export interface Skill {
  id: string;
  name: string;
  description: string;
  type: 'speed' | 'stamina' | 'start';
  triggerChance: number; // 0.1 = 10%
  effectValue: number;   // How much time it saves (in seconds)
}

export const SKILL_DATABASE: Skill[] = [
  { id: 's1', name: '🚀 Sprint Turbo', description: 'Massive speed boost in the final stretch', type: 'speed', triggerChance: 0.4, effectValue: 0.8 },
  { id: 's2', name: '🔋 Arc Maestro', description: 'Recover stamina on corners', type: 'stamina', triggerChance: 0.5, effectValue: 0.5 },
  { id: 's3', name: '⚡ Concentration', description: 'Perfect start out of the gate', type: 'start', triggerChance: 0.6, effectValue: 0.3 },
  { id: 's4', name: '🌪️ Storm', description: 'Overtake on the outside', type: 'speed', triggerChance: 0.3, effectValue: 0.6 },
  { id: 's5', name: '🛡️ Steel Will', description: 'Resist fatigue in bad weather', type: 'stamina', triggerChance: 0.4, effectValue: 0.4 },
];