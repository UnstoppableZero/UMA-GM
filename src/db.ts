// src/db.ts
import Dexie, { type Table } from 'dexie';
import type { Uma, Team } from './types'; // Import Team here

export interface GameState {
  id: number;
  year: number;
  week: number;
  money: number;
  coachingPolicy?: 'balanced' | 'speed' | 'stamina';
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

export interface NewsItem {
  id?: number;
  year: number;
  week: number;
  message: string;
  type: 'info' | 'important' | 'retirement' | 'record';
}

export class UmaDatabase extends Dexie {
  umas!: Table<Uma, string>; 
  teams!: Table<Team, string>; // <--- NEW TABLE
  gameState!: Table<GameState, number>;
  raceHistory!: Table<RaceHistoryRecord, number>;
  news!: Table<NewsItem, number>;

  constructor() {
    super('UmaGM_DB');
    
    // VERSION 6: Add 'teams' table and change 'team' to 'teamId' in umas
    this.version(6).stores({
      umas: 'id, teamId, lastName, stats.speed', // Changed 'team' -> 'teamId'
      teams: 'id, name', // <--- New Table Definition
      gameState: 'id',
      raceHistory: '++id, year, raceName',
      news: '++id, year'
    });
  }
}

export const db = new UmaDatabase();

export async function initGame() {
  const exists = await db.gameState.get(1);
  if (!exists) {
    await db.gameState.add({
      id: 1,
      year: 1,
      week: 1,
      money: 10000,
      coachingPolicy: 'balanced'
    });
    // Add welcome news
    await db.news.add({
      year: 1, week: 1, message: "Welcome to UmaGM! The new stable has officially opened.", type: 'info'
    });
  }
}