// src/types.ts
import type { Skill } from './skills'; 

// --- NEW: TEAM DEFINITION ---
export interface Team {
  id: string;        // e.g. "spica", "rigil"
  name: string;      // "Team Spica"
  shortName: string; // "SPC"
  color: string;     // Hex code for UI
  logo: string;      // Emoji or Image URL
  prestige: number;  // 0-100 (Affects recruiting/budget)
  desc: string;      // Flavor text
  
  // Team History
  history: {
    wins: number;
    championships: number;
    earnings: number;
  };
}

// --- UPDATED: UMA DEFINITION ---
export interface RaceRecord {
  year: number;
  week: number;
  raceName: string;
  rank: number;
  time: number;
}

export interface Uma {
  id: string;
  firstName: string;
  lastName: string;
  
  // LINK TO TEAM
  teamId: string;   // <--- CHANGED: Was 'team', now links to Team.id

  color?: string;   // Jersey/Image color
  age: number;
  energy: number; // 0 to 100
fatigue: number; // 0 to 100 (Higher = more injury risk)
injuryWeeks: number; // Weeks remaining until recovered (0 = healthy)
  
  // NEW STATUS FIELDS
  status: 'active' | 'retired' | 'injured'; // <--- Added 'injured'
  condition: number; // 0-100 (100 = Perfect, <30 = Risk of Injury)

  trophies: string[];
  skills: Skill[];

  // CAREER STATS
  career: {
    races: number;
    wins: number;
    top3: number;
    earnings: number;
  };

  // RACE HISTORY LOG
  history: RaceRecord[];

  // ATTRIBUTES
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