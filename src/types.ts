// src/types.ts
import type { Skill } from './skills'; 

// --- TEAM DEFINITION ---
export interface Team {
  id: string;        
  name: string;      
  shortName: string; 
  color: string;     
  logo: string;      
  prestige: number;  
  desc: string;      
  
  history: {
    wins: number;
    championships: number;
    earnings: number;
  };
}

// --- RACE RECORD ---
export interface RaceRecord {
  year: number;
  week: number;
  raceName: string;
  rank: number;
  time: number;
}

// --- UMA DEFINITION ---
export interface Uma {
  id: string;
  firstName: string;
  lastName: string;
  
  teamId: string;   

  color?: string;   
  age: number;
  energy: number; 
  fatigue: number; 
  injuryWeeks: number; 
  
  potential: number; 
  currentOvr: number; 
  
  // --- ADDED THIS PROPERTY TO FIX THE ERROR ---
  targetRace?: string; 
  // -------------------------------------------

  status: 'active' | 'retired' | 'injured'; 
  condition: number; 

  trophies: string[];
  skills: Skill[];

  career: {
    races: number;
    wins: number;
    top3: number;
    earnings: number;
  };

  history: RaceRecord[];

  stats: { 
    speed: number; 
    stamina: number; 
    power: number; 
    guts: number; 
    wisdom: number; 
  };
  
  aptitude: {
    surface: { turf: number; dirt: number };
    distance: { short: number; mile: number; medium: number; long: number };
    strategy: { runner: number; leader: number; betweener: number; chaser: number };
  };
}

// --- GLOBAL GAME STATE ---
export interface GameState {
  id: number;
  year: number;
  week: number;
  money: number;
  coachingPolicy?: 'balanced' | 'speed' | 'stamina';
}

export interface NewsItem {
  id?: number;
  year: number;
  week: number;
  message: string;
  type: 'info' | 'important' | 'retirement' | 'record';
}

export interface RaceHistoryRecord {
  id?: number;
  year: number;
  week: number;
  raceName: string;
  winnerId: string;
  winnerName: string;
  time: number;
}