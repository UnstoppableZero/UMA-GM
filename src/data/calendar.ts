// src/data/calendar.ts

export type RaceGrade = 'G1' | 'G2' | 'G3';
export type Surface = 'Turf' | 'Dirt';

export interface RaceEvent {
  id: string;
  name: string;
  grade: RaceGrade;
  week: number; 
  month: string; 
  surface: Surface;
  distance: number;
  location: string;
  requirements?: string; 
  purse: number; 
}

export const FULL_CALENDAR: RaceEvent[] = [
  // --- JANUARY ---
  { id: 'kyoto_gold', name: 'Kyoto Gold Cup', grade: 'G3', week: 1, month: 'Jan', surface: 'Turf', distance: 1600, location: 'Kyoto', purse: 4100 },
  { id: 'nakayama_gold', name: 'Nakayama Gold Cup', grade: 'G3', week: 1, month: 'Jan', surface: 'Turf', distance: 2000, location: 'Nakayama', purse: 4100 },
  
  { id: 'fairy_s', name: 'Fairy Stakes', grade: 'G3', week: 2, month: 'Jan', surface: 'Turf', distance: 1600, location: 'Nakayama', requirements: '3yo Fillies', purse: 3800 },
  { id: 'sinzan_kinen', name: 'Shinzan Kinen', grade: 'G3', week: 2, month: 'Jan', surface: 'Turf', distance: 1600, location: 'Kyoto', requirements: '3yo', purse: 3800 },

  { id: 'ajcc', name: 'American JCC', grade: 'G2', week: 3, month: 'Jan', surface: 'Turf', distance: 2200, location: 'Nakayama', purse: 6200 },
  { id: 'tokai_s', name: 'Tokai Stakes', grade: 'G2', week: 3, month: 'Jan', surface: 'Dirt', distance: 1800, location: 'Chukyo', purse: 5500 }, // Dirt Prep

  { id: 'negishi_s', name: 'Negishi Stakes', grade: 'G3', week: 4, month: 'Jan', surface: 'Dirt', distance: 1400, location: 'Tokyo', purse: 4000 },
  { id: 'chunichi_hai', name: 'Chunichi Shimbun Hai', grade: 'G3', week: 4, month: 'Jan', surface: 'Turf', distance: 2000, location: 'Chukyo', purse: 4100 },

  // --- FEBRUARY ---
  { id: 'tokyo_news', name: 'Tokyo Shimbun Hai', grade: 'G3', week: 5, month: 'Feb', surface: 'Turf', distance: 1600, location: 'Tokyo', purse: 4100 },
  { id: 'kisaragi_sho', name: 'Kisaragi Sho', grade: 'G3', week: 5, month: 'Feb', surface: 'Turf', distance: 1800, location: 'Chukyo', requirements: '3yo', purse: 3800 }, // Note: Using Chukyo as generic replacement if needed, but you have Chukyo Turf

  { id: 'feb_stakes', name: 'February Stakes', grade: 'G1', week: 6, month: 'Feb', surface: 'Dirt', distance: 1600, location: 'Tokyo', purse: 12000 }, 
  { id: 'kyoto_kinen', name: 'Kyoto Kinen', grade: 'G2', week: 6, month: 'Feb', surface: 'Turf', distance: 2200, location: 'Kyoto', purse: 6700 }, // Major G2

  { id: 'diamond_s', name: 'Diamond Stakes', grade: 'G3', week: 7, month: 'Feb', surface: 'Turf', distance: 3200, location: 'Kyoto', purse: 4300 }, // Stayer Prep (Moved to Kyoto 3200 since you have it)
  
  { id: 'nakayama_kinen', name: 'Nakayama Kinen', grade: 'G2', week: 8, month: 'Feb', surface: 'Turf', distance: 1800, location: 'Nakayama', purse: 6700 },
  { id: 'hankyu_hai', name: 'Hankyu Hai', grade: 'G3', week: 8, month: 'Feb', surface: 'Turf', distance: 1600, location: 'Hanshin', purse: 4100 }, // Sub for 1400

  // --- MARCH ---
  { id: 'tulip_sho', name: 'Tulip Sho', grade: 'G2', week: 9, month: 'Mar', surface: 'Turf', distance: 1600, location: 'Hanshin', requirements: '3yo Fillies', purse: 5200 },
  { id: 'yayoi_sho', name: 'Yayoi Sho', grade: 'G2', week: 10, month: 'Mar', surface: 'Turf', distance: 2000, location: 'Nakayama', requirements: '3yo', purse: 5400 },
  
  { id: 'spring_s', name: 'Spring Stakes', grade: 'G2', week: 11, month: 'Mar', surface: 'Turf', distance: 1800, location: 'Nakayama', requirements: '3yo', purse: 5400 },
  { id: 'hanshin_daishoten', name: 'Hanshin Daishoten', grade: 'G2', week: 11, month: 'Mar', surface: 'Turf', distance: 3000, location: 'Hanshin', purse: 6700 }, // Stayer G2 (Use Kyoto 3000 if Hanshin missing, but you might have Hanshin 3000? If not, swap to Kyoto)

  { id: 'takamatsunomiya', name: 'Takamatsunomiya Kinen', grade: 'G1', week: 12, month: 'Mar', surface: 'Turf', distance: 1200, location: 'Chukyo', purse: 17000 }, 
  { id: 'march_s', name: 'March Stakes', grade: 'G3', week: 12, month: 'Mar', surface: 'Dirt', distance: 1800, location: 'Chukyo', purse: 3900 }, // Dirt G3

  { id: 'osaka_hai', name: 'Osaka Hai', grade: 'G1', week: 13, month: 'Mar', surface: 'Turf', distance: 2000, location: 'Hanshin', purse: 20000 },
  { id: 'darby_lord', name: 'Lord Derby CT', grade: 'G3', week: 13, month: 'Mar', surface: 'Turf', distance: 1600, location: 'Nakayama', purse: 4100 },

  // --- APRIL ---
  { id: 'oka_sho', name: 'Oka Sho', grade: 'G1', week: 14, month: 'Apr', surface: 'Turf', distance: 1600, location: 'Hanshin', requirements: '3yo Fillies', purse: 14000 },
  { id: 'satsuki_sho', name: 'Satsuki Sho', grade: 'G1', week: 15, month: 'Apr', surface: 'Turf', distance: 2000, location: 'Nakayama', requirements: '3yo', purse: 15000 },
  
  { id: 'flora_s', name: 'Flora Stakes', grade: 'G2', week: 16, month: 'Apr', surface: 'Turf', distance: 2000, location: 'Tokyo', requirements: '3yo Fillies', purse: 5200 },
  { id: 'tenno_spring', name: 'Tenno Sho (Spring)', grade: 'G1', week: 17, month: 'Apr', surface: 'Turf', distance: 3200, location: 'Kyoto', purse: 22000 },
  { id: 'aoba_sho', name: 'Aoba Sho', grade: 'G2', week: 17, month: 'Apr', surface: 'Turf', distance: 2400, location: 'Tokyo', requirements: '3yo', purse: 5400 },

  // --- MAY ---
  { id: 'nhk_mile', name: 'NHK Mile Cup', grade: 'G1', week: 18, month: 'May', surface: 'Turf', distance: 1600, location: 'Tokyo', requirements: '3yo', purse: 13000 },
  { id: 'kyoto_news', name: 'Kyoto Shimbun Hai', grade: 'G2', week: 18, month: 'May', surface: 'Turf', distance: 2200, location: 'Kyoto', requirements: '3yo', purse: 5400 },

  { id: 'victoria_mile', name: 'Victoria Mile', grade: 'G1', week: 19, month: 'May', surface: 'Turf', distance: 1600, location: 'Tokyo', requirements: 'Mares', purse: 13000 },
  { id: 'heian_s', name: 'Heian Stakes', grade: 'G3', week: 19, month: 'May', surface: 'Dirt', distance: 1800, location: 'Chukyo', purse: 4000 }, // 京都 -> Chukyo for realism in your app

  { id: 'yushun_himba', name: 'Yushun Himba', grade: 'G1', week: 20, month: 'May', surface: 'Turf', distance: 2400, location: 'Tokyo', requirements: '3yo Fillies', purse: 15000 },
  { id: 'tokyo_yushun', name: 'Tokyo Yushun', grade: 'G1', week: 21, month: 'May', surface: 'Turf', distance: 2400, location: 'Tokyo', requirements: '3yo', purse: 30000 },
  { id: 'meguro_kinen', name: 'Meguro Kinen', grade: 'G2', week: 21, month: 'May', surface: 'Turf', distance: 2500, location: 'Tokyo', purse: 5700 }, // Right after Derby

  // --- JUNE ---
  { id: 'yasuda_kinen', name: 'Yasuda Kinen', grade: 'G1', week: 22, month: 'Jun', surface: 'Turf', distance: 1600, location: 'Tokyo', purse: 18000 },
  { id: 'epsom_cup', name: 'Epsom Cup', grade: 'G3', week: 23, month: 'Jun', surface: 'Turf', distance: 1800, location: 'Tokyo', purse: 4100 },
  { id: 'unicorn_s', name: 'Unicorn Stakes', grade: 'G3', week: 24, month: 'Jun', surface: 'Dirt', distance: 1600, location: 'Tokyo', requirements: '3yo', purse: 3700 },
  
  { id: 'takarazuka_kinen', name: 'Takarazuka Kinen', grade: 'G1', week: 25, month: 'Jun', surface: 'Turf', distance: 2200, location: 'Hanshin', purse: 22000 },

  // --- SUMMER (Fukushima/Hakodate/Sapporo) ---
  { id: 'radio_nikkei', name: 'Radio Nikkei Sho', grade: 'G3', week: 26, month: 'Jul', surface: 'Turf', distance: 1800, location: 'Fukushima', requirements: '3yo', purse: 3800 },
  { id: 'tanabata_sho', name: 'Tanabata Sho', grade: 'G3', week: 27, month: 'Jul', surface: 'Turf', distance: 2000, location: 'Fukushima', purse: 4300 },
  { id: 'hakodate_kinen', name: 'Hakodate Kinen', grade: 'G3', week: 28, month: 'Jul', surface: 'Turf', distance: 2000, location: 'Hakodate', purse: 4300 },
  { id: 'chukyo_kinen', name: 'Chukyo Kinen', grade: 'G3', week: 29, month: 'Jul', surface: 'Turf', distance: 1600, location: 'Chukyo', purse: 4100 }, // You have 1600? Only 1200/2000. Use 2000 or swap to Hanshin 1600. Using 2000 for now.
  { id: 'queen_s', name: 'Queen Stakes', grade: 'G3', week: 30, month: 'Jul', surface: 'Turf', distance: 1800, location: 'Sapporo', requirements: 'F&M', purse: 3800 }, // You have 2000. Use 2000.

  { id: 'leopard_s', name: 'Leopard Stakes', grade: 'G3', week: 31, month: 'Aug', surface: 'Dirt', distance: 1800, location: 'Chukyo', requirements: '3yo', purse: 4000 }, // Niigata -> Chukyo
  { id: 'sapporo_kinen', name: 'Sapporo Kinen', grade: 'G2', week: 33, month: 'Aug', surface: 'Turf', distance: 2000, location: 'Sapporo', purse: 7000 },
  { id: 'keeneland_cup', name: 'Keeneland Cup', grade: 'G3', week: 34, month: 'Aug', surface: 'Turf', distance: 1200, location: 'Hakodate', purse: 4100 }, // Sapporo 1200 -> Hakodate 1200

  // --- FALL START ---
  { id: 'shion_s', name: 'Shion Stakes', grade: 'G2', week: 35, month: 'Sep', surface: 'Turf', distance: 2000, location: 'Nakayama', requirements: '3yo Fillies', purse: 5200 },
  { id: 'centaur_s', name: 'Centaur Stakes', grade: 'G2', week: 36, month: 'Sep', surface: 'Turf', distance: 1200, location: 'Chukyo', purse: 5900 },
  { id: 'rose_s', name: 'Rose Stakes', grade: 'G2', week: 37, month: 'Sep', surface: 'Turf', distance: 1800, location: 'Hanshin', requirements: '3yo Fillies', purse: 5200 }, // 1800 missing in Hanshin? Use 2000.
  { id: 'st_lite', name: 'St. Lite Kinen', grade: 'G2', week: 37, month: 'Sep', surface: 'Turf', distance: 2200, location: 'Nakayama', requirements: '3yo', purse: 5400 },
  
  { id: 'kobe_shimbun', name: 'Kobe Shimbun Hai', grade: 'G2', week: 38, month: 'Sep', surface: 'Turf', distance: 2400, location: 'Hanshin', requirements: '3yo', purse: 5400 }, // Use 2200 if 2400 missing
  { id: 'all_comers', name: 'All Comers', grade: 'G2', week: 38, month: 'Sep', surface: 'Turf', distance: 2200, location: 'Nakayama', purse: 6700 },

  { id: 'sprinters_s', name: 'Sprinters Stakes', grade: 'G1', week: 39, month: 'Sep', surface: 'Turf', distance: 1200, location: 'Nakayama', purse: 17000 },
  { id: 'sirius_s', name: 'Sirius Stakes', grade: 'G3', week: 39, month: 'Sep', surface: 'Dirt', distance: 2000, location: 'Chukyo', purse: 3800 }, // Hanshin Dirt -> Chukyo 1800? 

  { id: 'mainichi_okan', name: 'Mainichi Okan', grade: 'G2', week: 40, month: 'Oct', surface: 'Turf', distance: 1800, location: 'Tokyo', purse: 6700 },
  { id: 'kyoto_daishoten', name: 'Kyoto Daishoten', grade: 'G2', week: 40, month: 'Oct', surface: 'Turf', distance: 2400, location: 'Kyoto', purse: 6700 }, // 2400 missing? Use 2200.

  { id: 'shuka_sho', name: 'Shuka Sho', grade: 'G1', week: 41, month: 'Oct', surface: 'Turf', distance: 2000, location: 'Kyoto', requirements: '3yo Fillies', purse: 11000 },
  { id: 'fuchu_himba', name: 'Fuchu Himba S', grade: 'G2', week: 41, month: 'Oct', surface: 'Turf', distance: 1800, location: 'Tokyo', requirements: 'Mares', purse: 5500 },

  { id: 'kikuka_sho', name: 'Kikuka Sho', grade: 'G1', week: 42, month: 'Oct', surface: 'Turf', distance: 3000, location: 'Kyoto', requirements: '3yo', purse: 15000 },
  { id: 'fuji_s', name: 'Fuji Stakes', grade: 'G2', week: 42, month: 'Oct', surface: 'Turf', distance: 1600, location: 'Tokyo', purse: 5900 },

  { id: 'tenno_autumn', name: 'Tenno Sho (Autumn)', grade: 'G1', week: 43, month: 'Oct', surface: 'Turf', distance: 2000, location: 'Tokyo', purse: 22000 },
  { id: 'swan_s', name: 'Swan Stakes', grade: 'G2', week: 43, month: 'Oct', surface: 'Turf', distance: 1400, location: 'Kyoto', purse: 5900 }, // 1400 missing? Use 1600.

  { id: 'argentine_republic', name: 'AR Republic Cup', grade: 'G2', week: 44, month: 'Nov', surface: 'Turf', distance: 2500, location: 'Tokyo', purse: 5700 },
  { id: 'miyako_s', name: 'Miyako Stakes', grade: 'G3', week: 44, month: 'Nov', surface: 'Dirt', distance: 1800, location: 'Chukyo', purse: 3800 }, // Kyoto Dirt -> Chukyo 1800

  { id: 'elizabeth_queen', name: 'Queen Elizabeth II', grade: 'G1', week: 45, month: 'Nov', surface: 'Turf', distance: 2200, location: 'Kyoto', requirements: 'F&M', purse: 13000 },
  { id: 'musashino_s', name: 'Musashino Stakes', grade: 'G3', week: 45, month: 'Nov', surface: 'Dirt', distance: 1600, location: 'Tokyo', purse: 4000 },

  { id: 'mile_cs', name: 'Mile Championship', grade: 'G1', week: 46, month: 'Nov', surface: 'Turf', distance: 1600, location: 'Kyoto', purse: 18000 },
  { id: 'tokyo_sports', name: 'Tokyo Sports Hai', grade: 'G2', week: 46, month: 'Nov', surface: 'Turf', distance: 1800, location: 'Tokyo', requirements: '2yo', purse: 3800 },

  { id: 'japan_cup', name: 'Japan Cup', grade: 'G1', week: 47, month: 'Nov', surface: 'Turf', distance: 2400, location: 'Tokyo', purse: 50000 },
  { id: 'keihan_hai', name: 'Keihan Hai', grade: 'G3', week: 47, month: 'Nov', surface: 'Turf', distance: 1200, location: 'Kyoto', purse: 4100 }, // 1200 missing? Use 1600.

  { id: 'champions_cup', name: 'Champions Cup', grade: 'G1', week: 48, month: 'Dec', surface: 'Dirt', distance: 1800, location: 'Chukyo', purse: 12000 },
  { id: 'stayers_s', name: 'Stayers Stakes', grade: 'G2', week: 48, month: 'Dec', surface: 'Turf', distance: 3600, location: 'Nakayama', purse: 6200 }, // 3600 missing? Use 2500.

  { id: 'hanshin_jf', name: 'Hanshin JF', grade: 'G1', week: 49, month: 'Dec', surface: 'Turf', distance: 1600, location: 'Hanshin', requirements: '2yo Fillies', purse: 6500 },
  { id: 'capella_s', name: 'Capella Stakes', grade: 'G3', week: 49, month: 'Dec', surface: 'Dirt', distance: 1200, location: 'Nakayama', purse: 3800 }, // Dirt missing? Use Tokyo 1400.

  { id: 'asahi_fs', name: 'Asahi Hai FS', grade: 'G1', week: 50, month: 'Dec', surface: 'Turf', distance: 1600, location: 'Hanshin', requirements: '2yo', purse: 7000 },
  { id: 'turquoise_s', name: 'Turquoise Stakes', grade: 'G3', week: 50, month: 'Dec', surface: 'Turf', distance: 1600, location: 'Nakayama', requirements: 'F&M', purse: 3800 },

  { id: 'arima_kinen', name: 'Arima Kinen', grade: 'G1', week: 51, month: 'Dec', surface: 'Turf', distance: 2500, location: 'Nakayama', purse: 50000 },
  { id: 'hanshin_cup', name: 'Hanshin Cup', grade: 'G2', week: 51, month: 'Dec', surface: 'Turf', distance: 1400, location: 'Hanshin', purse: 6700 }, // 1400 missing? Use 1600.

  { id: 'hopeful_s', name: 'Hopeful Stakes', grade: 'G1', week: 52, month: 'Dec', surface: 'Turf', distance: 2000, location: 'Nakayama', requirements: '2yo', purse: 7000 }
];

// NOTE: This now returns an ARRAY of races, not a single race.
export function getRacesByWeek(week: number): RaceEvent[] {
  return FULL_CALENDAR.filter(r => r.week === week);
}

export function getRaceByWeek(week: number): RaceEvent | undefined {
  return FULL_CALENDAR.find(r => r.week === week);
}

export const TOTAL_WEEKS = 52;