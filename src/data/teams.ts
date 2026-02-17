// src/data/teams.ts

export interface TeamTemplate {
  id: string;
  name: string;
  shortName: string;
  color: string;
  logo: string; 
  prestige: number; // 0-100
  desc: string;
}

export const LEAGUE_TEAMS: TeamTemplate[] = [
  // --- TIER 1: THE LEGENDS (Elite, Small Rosters) ---
  { 
    id: 'player', name: 'My God Stable', shortName: 'GOD', 
    color: '#2c3e50', logo: '🧬', prestige: 100, 
    desc: 'The Player Controlled team.' 
  },
  { 
    id: 'spica', name: 'Team Spica', shortName: 'SPC', 
    color: '#e67e22', logo: '🌟', prestige: 95, 
    desc: 'The protagonists. Home of late bloomers and legends.' 
  },
  { 
    id: 'rigil', name: 'Team Rigil', shortName: 'RGL', 
    color: '#f1c40f', logo: '🦅', prestige: 95, 
    desc: 'The absolute elites. Only S-Rank talent allowed.' 
  },

  // --- TIER 2: THE CONTENDERS (Strong, Medium Rosters) ---
  { 
    id: 'sirius', name: 'Team Sirius', shortName: 'SRS', 
    color: '#8e44ad', logo: '🐺', prestige: 80, 
    desc: 'A dark horse team known for aggressive runners.' 
  },
  { 
    id: 'canopus', name: 'Team Canopus', shortName: 'CNP', 
    color: '#c0392b', logo: '🛠️', prestige: 75, 
    desc: 'The lovable underdogs. High Guts, low budget.' 
  },
  { 
    id: 'andromeda', name: 'Andromeda', shortName: 'AND', 
    color: '#2980b9', logo: '⛓️', prestige: 70, 
    desc: ' disciplined, military-style racing academy.' 
  },

  // --- TIER 3: THE FILLERS (Massive Rosters, Average Stats) ---
  // These teams exist to fill the G3/G2 gates so races happen.
  { 
    id: 'pegasus', name: 'Pegasus Garden', shortName: 'PEG', 
    color: '#2ecc71', logo: '🌿', prestige: 50, 
    desc: 'A massive breeding farm producing turf specialists.' 
  },
  { 
    id: 'orion', name: 'Orion Stables', shortName: 'ORN', 
    color: '#34495e', logo: '🏹', prestige: 45, 
    desc: 'Focuses on dirt tracks and power runners.' 
  },
  { 
    id: 'hydra', name: 'Hydra Corp', shortName: 'HYD', 
    color: '#16a085', logo: '🐍', prestige: 40, 
    desc: 'A corporate syndicate with hundreds of horses.' 
  },
  { 
    id: 'centaur', name: 'Centaur Inst.', shortName: 'CTR', 
    color: '#7f8c8d', logo: '🏛️', prestige: 35, 
    desc: 'Old school tradition. Solid, average performers.' 
  },
  { 
    id: 'gemini', name: 'Gemini Club', shortName: 'GEM', 
    color: '#d35400', logo: '🎭', prestige: 30, 
    desc: 'Known for twin runners and erratic strategies.' 
  },
  { 
    id: 'phoenix', name: 'Phoenix Estate', shortName: 'PHX', 
    color: '#c0392b', logo: '🔥', prestige: 30, 
    desc: 'Horses that race frequently and recover fast.' 
  }
];