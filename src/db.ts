// src/db.ts
import Dexie, { type Table } from 'dexie';
import type { Uma, Team, DraftPick } from './types'; 

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
  top3?: { id: string; name: string; time: number }[];
}

export interface NewsItem {
  id?: number;
  year: number;
  week: number;
  message: string;
  type: 'info' | 'important' | 'retirement' | 'record' | 'draft';
}

export class UmaDatabase extends Dexie {
  umas!: Table<Uma, string>; 
  teams!: Table<Team, string>; 
  gameState!: Table<GameState, number>;
  raceHistory!: Table<RaceHistoryRecord, number>;
  news!: Table<NewsItem, number>;
  draftPicks!: Table<DraftPick, number>; // <--- NEW TABLE

  constructor() {
    super('UmaGM_DB');
    
    // VERSION 7: Added draftPicks table
    this.version(7).stores({
      umas: 'id, teamId, lastName, stats.speed', 
      teams: 'id, name', 
      gameState: 'id',
      raceHistory: '++id, year, raceName',
      news: '++id, year',
      draftPicks: '++id, year, teamId, umaId' // <--- New Table Definition
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
    await db.news.add({
      year: 1, week: 1, message: "Welcome to UmaGM! The new stable has officially opened.", type: 'info'
    });
  }
}