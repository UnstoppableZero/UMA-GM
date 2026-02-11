// src/data/calendar.ts

export type RaceGrade = 'G1' | 'G2' | 'G3';
export type Surface = 'Turf' | 'Dirt';
export type DistanceCategory = 'Short' | 'Mile' | 'Medium' | 'Long';

export interface RaceEvent {
  id: string;
  name: string;
  grade: RaceGrade;
  week: number; // 1-52
  month: string; // Display only
  surface: Surface;
  distance: number;
  location: string;
  requirements?: string; // e.g., "3yo Only" (Flavor text for now)
  purse: number; // Winner's prize
}

export const FULL_CALENDAR: RaceEvent[] = [
  // --- JANUARY ---
  { id: 'kyoto_gold', name: 'Kyoto Gold Cup', grade: 'G3', week: 1, month: 'Jan', surface: 'Turf', distance: 1600, location: 'Kyoto', purse: 4100 },
  { id: 'fairy_s', name: 'Fairy Stakes', grade: 'G3', week: 2, month: 'Jan', surface: 'Turf', distance: 1600, location: 'Nakayama', requirements: '3yo Fillies', purse: 3800 },
  { id: 'ajcc', name: 'American JCC', grade: 'G2', week: 3, month: 'Jan', surface: 'Turf', distance: 2200, location: 'Nakayama', purse: 6200 },
  { id: 'negishi_s', name: 'Negishi Stakes', grade: 'G3', week: 4, month: 'Jan', surface: 'Dirt', distance: 1400, location: 'Tokyo', purse: 4000 },

  // --- FEBRUARY ---
  { id: 'tokyo_news', name: 'Tokyo Shimbun Hai', grade: 'G3', week: 5, month: 'Feb', surface: 'Turf', distance: 1600, location: 'Tokyo', purse: 4100 },
  { id: 'feb_stakes', name: 'February Stakes', grade: 'G1', week: 6, month: 'Feb', surface: 'Dirt', distance: 1600, location: 'Tokyo', purse: 12000 }, // FIRST G1
  { id: 'nakayama_kinen', name: 'Nakayama Kinen', grade: 'G2', week: 8, month: 'Feb', surface: 'Turf', distance: 1800, location: 'Nakayama', purse: 6700 },

  // --- MARCH ---
  { id: 'tulip_sho', name: 'Tulip Sho', grade: 'G2', week: 9, month: 'Mar', surface: 'Turf', distance: 1600, location: 'Hanshin', requirements: '3yo Fillies', purse: 5200 },
  { id: 'yayoi_sho', name: 'Yayoi Sho', grade: 'G2', week: 10, month: 'Mar', surface: 'Turf', distance: 2000, location: 'Nakayama', requirements: '3yo', purse: 5400 },
  { id: 'spring_s', name: 'Spring Stakes', grade: 'G2', week: 11, month: 'Mar', surface: 'Turf', distance: 1800, location: 'Nakayama', requirements: '3yo', purse: 5400 },
  { id: 'takamatsunomiya', name: 'Takamatsunomiya Kinen', grade: 'G1', week: 12, month: 'Mar', surface: 'Turf', distance: 1200, location: 'Chukyo', purse: 17000 }, // SPRINT G1
  { id: 'osaka_hai', name: 'Osaka Hai', grade: 'G1', week: 13, month: 'Mar', surface: 'Turf', distance: 2000, location: 'Hanshin', purse: 20000 }, // SENIOR G1

  // --- APRIL (CLASSIC SEASON START) ---
  { id: 'oka_sho', name: 'Oka Sho (Cherry Blossom)', grade: 'G1', week: 14, month: 'Apr', surface: 'Turf', distance: 1600, location: 'Hanshin', requirements: '3yo Fillies', purse: 14000 },
  { id: 'satsuki_sho', name: 'Satsuki Sho', grade: 'G1', week: 15, month: 'Apr', surface: 'Turf', distance: 2000, location: 'Nakayama', requirements: '3yo', purse: 15000 }, // TRIPLE CROWN 1
  { id: 'flora_s', name: 'Flora Stakes', grade: 'G2', week: 16, month: 'Apr', surface: 'Turf', distance: 2000, location: 'Tokyo', requirements: '3yo Fillies', purse: 5200 },
  { id: 'tenno_spring', name: 'Tenno Sho (Spring)', grade: 'G1', week: 17, month: 'Apr', surface: 'Turf', distance: 3200, location: 'Kyoto', purse: 22000 }, // STAYER G1

  // --- MAY ---
  { id: 'nhk_mile', name: 'NHK Mile Cup', grade: 'G1', week: 18, month: 'May', surface: 'Turf', distance: 1600, location: 'Tokyo', requirements: '3yo', purse: 13000 },
  { id: 'victoria_mile', name: 'Victoria Mile', grade: 'G1', week: 19, month: 'May', surface: 'Turf', distance: 1600, location: 'Tokyo', requirements: 'Mares', purse: 13000 },
  { id: 'yushun_himba', name: 'Yushun Himba (Oaks)', grade: 'G1', week: 20, month: 'May', surface: 'Turf', distance: 2400, location: 'Tokyo', requirements: '3yo Fillies', purse: 15000 },
  { id: 'tokyo_yushun', name: 'Tokyo Yushun (Derby)', grade: 'G1', week: 21, month: 'May', surface: 'Turf', distance: 2400, location: 'Tokyo', requirements: '3yo', purse: 30000 }, // TRIPLE CROWN 2

  // --- JUNE (SUMMER BREAK START) ---
  { id: 'yasuda_kinen', name: 'Yasuda Kinen', grade: 'G1', week: 22, month: 'Jun', surface: 'Turf', distance: 1600, location: 'Tokyo', purse: 18000 },
  { id: 'takarazuka_kinen', name: 'Takarazuka Kinen', grade: 'G1', week: 25, month: 'Jun', surface: 'Turf', distance: 2200, location: 'Hanshin', purse: 22000 }, // GRAND PRIX 1

  // --- SUMMER SERIES (G3s mainly) ---
  { id: 'radio_nikkei', name: 'Radio Nikkei Sho', grade: 'G3', week: 26, month: 'Jul', surface: 'Turf', distance: 1800, location: 'Fukushima', purse: 3800 },
  { id: 'procyon_s', name: 'Procyon Stakes', grade: 'G3', week: 27, month: 'Jul', surface: 'Dirt', distance: 1400, location: 'Chukyo', purse: 3600 },
  { id: 'hakodate_kinen', name: 'Hakodate Kinen', grade: 'G3', week: 28, month: 'Jul', surface: 'Turf', distance: 2000, location: 'Hakodate', purse: 4100 },
  { id: 'sapporo_kinen', name: 'Sapporo Kinen', grade: 'G2', week: 33, month: 'Aug', surface: 'Turf', distance: 2000, location: 'Sapporo', purse: 7000 }, // PRESTIGIOUS G2

  // --- SEPTEMBER (FALL START) ---
  { id: 'sprinters_s', name: 'Sprinters Stakes', grade: 'G1', week: 39, month: 'Sep', surface: 'Turf', distance: 1200, location: 'Nakayama', purse: 17000 },

  // --- OCTOBER ---
  { id: 'shuka_sho', name: 'Shuka Sho', grade: 'G1', week: 41, month: 'Oct', surface: 'Turf', distance: 2000, location: 'Kyoto', requirements: '3yo Fillies', purse: 11000 },
  { id: 'kikuka_sho', name: 'Kikuka Sho', grade: 'G1', week: 42, month: 'Oct', surface: 'Turf', distance: 3000, location: 'Kyoto', requirements: '3yo', purse: 15000 }, // TRIPLE CROWN 3
  { id: 'tenno_autumn', name: 'Tenno Sho (Autumn)', grade: 'G1', week: 43, month: 'Oct', surface: 'Turf', distance: 2000, location: 'Tokyo', purse: 22000 },

  // --- NOVEMBER ---
  { id: 'elizabeth_queen', name: 'Queen Elizabeth II Cup', grade: 'G1', week: 45, month: 'Nov', surface: 'Turf', distance: 2200, location: 'Kyoto', requirements: 'F&M', purse: 13000 },
  { id: 'mile_cs', name: 'Mile Championship', grade: 'G1', week: 46, month: 'Nov', surface: 'Turf', distance: 1600, location: 'Kyoto', purse: 18000 },
  { id: 'japan_cup', name: 'Japan Cup', grade: 'G1', week: 47, month: 'Nov', surface: 'Turf', distance: 2400, location: 'Tokyo', purse: 50000 }, // HIGHEST PURSE

  // --- DECEMBER ---
  { id: 'champions_cup', name: 'Champions Cup', grade: 'G1', week: 48, month: 'Dec', surface: 'Dirt', distance: 1800, location: 'Chukyo', purse: 12000 }, // DIRT G1
  { id: 'hanshin_jf', name: 'Hanshin JF', grade: 'G1', week: 49, month: 'Dec', surface: 'Turf', distance: 1600, location: 'Hanshin', requirements: '2yo Fillies', purse: 6500 },
  { id: 'asahi_fs', name: 'Asahi Hai FS', grade: 'G1', week: 50, month: 'Dec', surface: 'Turf', distance: 1600, location: 'Hanshin', requirements: '2yo', purse: 7000 },
  { id: 'arima_kinen', name: 'Arima Kinen', grade: 'G1', week: 51, month: 'Dec', surface: 'Turf', distance: 2500, location: 'Nakayama', purse: 50000 }, // GRAND FINALE
  { id: 'hopeful_s', name: 'Hopeful Stakes', grade: 'G1', week: 52, month: 'Dec', surface: 'Turf', distance: 2000, location: 'Nakayama', requirements: '2yo', purse: 7000 }
];

export function getRaceByWeek(week: number): RaceEvent | undefined {
  return FULL_CALENDAR.find(r => r.week === week);
}

// Helper to calculate total weeks
export const TOTAL_WEEKS = 52;