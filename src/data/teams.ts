// src/data/teams.ts

export interface TeamTemplate {
  id: string;
  name: string;
  shortName: string;
  color: string;
  logo: string; // Emoji for now
  prestige: number; // 0-100, affects recruiting
  desc: string;
}

export const LEAGUE_TEAMS: TeamTemplate[] = [
  { 
    id: 'spica', name: 'Team Spica', shortName: 'SPC', 
    color: '#e67e22', logo: '🌟', prestige: 90, 
    desc: 'The protagonists. Known for late bloomers and legends.' 
  },
  { 
    id: 'rigil', name: 'Team Rigil', shortName: 'RGL', 
    color: '#f1c40f', logo: '🦅', prestige: 95, 
    desc: 'The elites. Only the strongest stats get in here.' 
  },
  { 
    id: 'canopus', name: 'Team Canopus', shortName: 'CNP', 
    color: '#e74c3c', logo: '🛠️', prestige: 70, 
    desc: 'The lovable underdogs. High guts, low budget.' 
  },
  { 
    id: 'altair', name: 'Team Altair', shortName: 'ALT', 
    color: '#3498db', logo: '🌊', prestige: 60, 
    desc: 'Focuses on long-distance stayers.' 
  },
  { 
    id: 'capella', name: 'Team Capella', shortName: 'CPL', 
    color: '#9b59b6', logo: '🔮', prestige: 50, 
    desc: 'A mysterious new team using data analytics.' 
  },
  { 
    id: 'vega', name: 'Team Vega', shortName: 'VEG', 
    color: '#2ecc71', logo: '🍀', prestige: 40, 
    desc: 'Focused on turf milers and speedsters.' 
  },
  { 
    id: 'player', name: 'My God Stable', shortName: 'GOD', 
    color: '#34495e', logo: '🧬', prestige: 100, 
    desc: 'The Player Controlled God Mode team.' 
  }
];