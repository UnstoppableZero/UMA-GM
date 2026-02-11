// src/schedule.ts

export type Location = 'Tokyo' | 'Nakayama' | 'Kyoto' | 'Hanshin' | 'Chukyo' | 'Fukushima' | 'Hakodate' | 'Sapporo';

export interface GameEvent {
  week: number;
  name: string;
  type: 'race' | 'rest' | 'event';
  distance?: number;
  grade?: 'G1' | 'G2' | 'G3';
  location?: Location; // <--- NEW FIELD
}

export const SEASON_SCHEDULE: GameEvent[] = [
  { week: 1, name: "New Year's Live", type: 'event' },
  { week: 2, name: "Winter Training", type: 'rest' },
  // Satsuki Sho is at Nakayama
  { week: 6, name: "Satsuki Sho", type: 'race', distance: 2000, grade: 'G1', location: 'Nakayama' }, 
  // NHK Mile is at Tokyo
  { week: 8, name: "NHK Mile Cup", type: 'race', distance: 1600, grade: 'G1', location: 'Tokyo' },
  // Derby is at Tokyo
  { week: 10, name: "Tokyo Yushun (Derby)", type: 'race', distance: 2400, grade: 'G1', location: 'Tokyo' },
  // Takarazuka is at Hanshin
  { week: 14, name: "Takarazuka Kinen", type: 'race', distance: 2200, grade: 'G1', location: 'Hanshin' },
  // Kikuka Sho is at Kyoto
  { week: 18, name: "Kikuka Sho", type: 'race', distance: 3000, grade: 'G1', location: 'Kyoto' },
  // Tenno Sho is at Tokyo
  { week: 20, name: "Tenno Sho (Autumn)", type: 'race', distance: 2000, grade: 'G1', location: 'Tokyo' },
  // Japan Cup is at Tokyo
  { week: 22, name: "Japan Cup", type: 'race', distance: 2400, grade: 'G1', location: 'Tokyo' },
  // Arima Kinen is at Nakayama
  { week: 24, name: "Arima Kinen", type: 'race', distance: 2500, grade: 'G1', location: 'Nakayama' },
];

export const TOTAL_WEEKS_PER_YEAR = 24;