// src/data/calendar.ts

export type RaceGrade = 'G1' | 'G2' | 'G3' | 'Listed';
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
  
  // These act as "Rookie Openers" for your new 3yos
  { id: 'fairy_s', name: 'Fairy Stakes', grade: 'G3', week: 2, month: 'Jan', surface: 'Turf', distance: 1600, location: 'Nakayama', requirements: '3yo Fillies', purse: 3800 },
  { id: 'sinzan_kinen', name: 'Shinzan Kinen', grade: 'G3', week: 2, month: 'Jan', surface: 'Turf', distance: 1600, location: 'Kyoto', requirements: '3yo', purse: 3800 },

  { id: 'ajcc', name: 'American JCC', grade: 'G2', week: 3, month: 'Jan', surface: 'Turf', distance: 2200, location: 'Nakayama', purse: 6200 },
  { id: 'tokai_s', name: 'Tokai Stakes', grade: 'G2', week: 3, month: 'Jan', surface: 'Dirt', distance: 1800, location: 'Chukyo', purse: 5500 },

  // Adjusted Negishi to Tokyo 1600m Dirt (as 1400m Dirt is not mapped for Tokyo)
  { id: 'negishi_s', name: 'Negishi Stakes', grade: 'G3', week: 4, month: 'Jan', surface: 'Dirt', distance: 1600, location: 'Tokyo', purse: 4000 },
  { id: 'chunichi_hai', name: 'Chunichi Shimbun Hai', grade: 'G3', week: 4, month: 'Jan', surface: 'Turf', distance: 2000, location: 'Chukyo', purse: 4100 },

  // --- FEBRUARY ---
  { id: 'tokyo_news', name: 'Tokyo Shimbun Hai', grade: 'G3', week: 5, month: 'Feb', surface: 'Turf', distance: 1600, location: 'Tokyo', purse: 4100 },
  // Adjusted Kisaragi to Kyoto 1600m (Chukyo Turf 1800 is not mapped)
  { id: 'kisaragi_sho', name: 'Kisaragi Sho', grade: 'G3', week: 5, month: 'Feb', surface: 'Turf', distance: 1600, location: 'Kyoto', requirements: '3yo', purse: 3800 },

  { id: 'feb_stakes', name: 'February Stakes', grade: 'G1', week: 6, month: 'Feb', surface: 'Dirt', distance: 1600, location: 'Tokyo', purse: 12000 }, 
  { id: 'kyoto_kinen', name: 'Kyoto Kinen', grade: 'G2', week: 6, month: 'Feb', surface: 'Turf', distance: 2200, location: 'Kyoto', purse: 6700 },

  { id: 'diamond_s', name: 'Diamond Stakes', grade: 'G3', week: 7, month: 'Feb', surface: 'Turf', distance: 3200, location: 'Kyoto', purse: 4300 },
  
  { id: 'nakayama_kinen', name: 'Nakayama Kinen', grade: 'G2', week: 8, month: 'Feb', surface: 'Turf', distance: 1800, location: 'Nakayama', purse: 6700 },
  { id: 'hankyu_hai', name: 'Hankyu Hai', grade: 'G3', week: 8, month: 'Feb', surface: 'Turf', distance: 1600, location: 'Hanshin', purse: 4100 },

  // --- MARCH ---
  { id: 'tulip_sho', name: 'Tulip Sho', grade: 'G2', week: 9, month: 'Mar', surface: 'Turf', distance: 1600, location: 'Hanshin', requirements: '3yo Fillies', purse: 5200 },
  { id: 'yayoi_sho', name: 'Yayoi Sho', grade: 'G2', week: 10, month: 'Mar', surface: 'Turf', distance: 2000, location: 'Nakayama', requirements: '3yo', purse: 5400 },
  
  // NEW TRIAL RACES
  // Adjusted Fillies Revue to 1600m (Hanshin Turf 1400 is not mapped)
  { id: 'fillies_revue', name: "Fillies' Revue", grade: 'G2', week: 10, month: 'Mar', surface: 'Turf', distance: 1600, location: 'Hanshin', requirements: '3yo Fillies', purse: 5200 },
  { id: 'anemone_s', name: 'Anemone Stakes', grade: 'Listed', week: 10, month: 'Mar', surface: 'Turf', distance: 1600, location: 'Nakayama', requirements: '3yo Fillies', purse: 2000 },
  { id: 'kinko_sho', name: 'Kinko Sho', grade: 'G2', week: 10, month: 'Mar', surface: 'Turf', distance: 2000, location: 'Chukyo', purse: 6200 },

  { id: 'spring_s', name: 'Spring Stakes', grade: 'G2', week: 11, month: 'Mar', surface: 'Turf', distance: 1800, location: 'Nakayama', requirements: '3yo', purse: 5400 },
  // Adjusted Wakaba to Kyoto 2000m (Hanshin 2000m is mapped, but spacing it out)
  { id: 'wakaba_s', name: 'Wakaba Stakes', grade: 'Listed', week: 11, month: 'Mar', surface: 'Turf', distance: 2000, location: 'Hanshin', requirements: '3yo', purse: 2000 },
  // Adjusted Hanshin Daishoten to Kyoto 3000m (Hanshin Turf 3000 is not mapped)
  { id: 'hanshin_daishoten', name: 'Hanshin Daishoten', grade: 'G2', week: 11, month: 'Mar', surface: 'Turf', distance: 3000, location: 'Kyoto', purse: 6700 },

  { id: 'takamatsunomiya', name: 'Takamatsunomiya Kinen', grade: 'G1', week: 12, month: 'Mar', surface: 'Turf', distance: 1200, location: 'Chukyo', purse: 17000 }, 
  { id: 'march_s', name: 'March Stakes', grade: 'G3', week: 12, month: 'Mar', surface: 'Dirt', distance: 1800, location: 'Chukyo', purse: 3900 },
  { id: 'nikkei_sho', name: 'Nikkei Sho', grade: 'G2', week: 12, month: 'Mar', surface: 'Turf', distance: 2500, location: 'Nakayama', purse: 6700 },

  { id: 'osaka_hai', name: 'Osaka Hai', grade: 'G1', week: 13, month: 'Mar', surface: 'Turf', distance: 2000, location: 'Hanshin', purse: 20000 },
  { id: 'darby_lord', name: 'Lord Derby CT', grade: 'G3', week: 13, month: 'Mar', surface: 'Turf', distance: 1600, location: 'Nakayama', purse: 4100 },

  // --- APRIL ---
  { id: 'oka_sho', name: 'Oka Sho', grade: 'G1', week: 14, month: 'Apr', surface: 'Turf', distance: 1600, location: 'Hanshin', requirements: '3yo Fillies', purse: 14000 },
  { id: 'satsuki_sho', name: 'Satsuki Sho', grade: 'G1', week: 15, month: 'Apr', surface: 'Turf', distance: 2000, location: 'Nakayama', requirements: '3yo', purse: 15000 },
  
  { id: 'flora_s', name: 'Flora Stakes', grade: 'G2', week: 16, month: 'Apr', surface: 'Turf', distance: 2000, location: 'Tokyo', requirements: '3yo Fillies', purse: 5200 },
  { id: 'milers_cup', name: 'Milers Cup', grade: 'G2', week: 16, month: 'Apr', surface: 'Turf', distance: 1600, location: 'Kyoto', purse: 5900 },

  { id: 'tenno_spring', name: 'Tenno Sho (Spring)', grade: 'G1', week: 17, month: 'Apr', surface: 'Turf', distance: 3200, location: 'Kyoto', purse: 22000 },
  { id: 'aoba_sho', name: 'Aoba Sho', grade: 'G2', week: 17, month: 'Apr', surface: 'Turf', distance: 2400, location: 'Tokyo', requirements: '3yo', purse: 5400 },

  // --- MAY ---
  { id: 'nhk_mile', name: 'NHK Mile Cup', grade: 'G1', week: 18, month: 'May', surface: 'Turf', distance: 1600, location: 'Tokyo', requirements: '3yo', purse: 13000 },
  { id: 'kyoto_news', name: 'Kyoto Shimbun Hai', grade: 'G2', week: 18, month: 'May', surface: 'Turf', distance: 2200, location: 'Kyoto', requirements: '3yo', purse: 5400 },
  { id: 'sweetpea_s', name: 'Sweetpea Stakes', grade: 'Listed', week: 18, month: 'May', surface: 'Turf', distance: 1800, location: 'Tokyo', requirements: '3yo Fillies', purse: 2000 },

  { id: 'victoria_mile', name: 'Victoria Mile', grade: 'G1', week: 19, month: 'May', surface: 'Turf', distance: 1600, location: 'Tokyo', requirements: 'Mares', purse: 13000 },
  { id: 'heian_s', name: 'Heian Stakes', grade: 'G3', week: 19, month: 'May', surface: 'Dirt', distance: 1800, location: 'Chukyo', purse: 4000 },
  // Adjusted Keio Hai to 1600m (Tokyo Turf 1400 is not mapped)
  { id: 'keio_hai_spring', name: 'Keio Hai Spring Cup', grade: 'G2', week: 19, month: 'May', surface: 'Turf', distance: 1600, location: 'Tokyo', purse: 5900 },
  { id: 'principal_s', name: 'Principal Stakes', grade: 'Listed', week: 19, month: 'May', surface: 'Turf', distance: 2000, location: 'Tokyo', requirements: '3yo', purse: 2000 },


  { id: 'yushun_himba', name: 'Yushun Himba', grade: 'G1', week: 20, month: 'May', surface: 'Turf', distance: 2400, location: 'Tokyo', requirements: '3yo Fillies', purse: 15000 },
  { id: 'tokyo_yushun', name: 'Tokyo Yushun', grade: 'G1', week: 21, month: 'May', surface: 'Turf', distance: 2400, location: 'Tokyo', requirements: '3yo', purse: 30000 },
  // Adjusted Meguro Kinen to 2400m (Tokyo Turf 2500 is not mapped)
  { id: 'meguro_kinen', name: 'Meguro Kinen', grade: 'G2', week: 21, month: 'May', surface: 'Turf', distance: 2400, location: 'Tokyo', purse: 5700 },

  // --- JUNE ---
  { id: 'yasuda_kinen', name: 'Yasuda Kinen', grade: 'G1', week: 22, month: 'Jun', surface: 'Turf', distance: 1600, location: 'Tokyo', purse: 18000 },
  { id: 'epsom_cup', name: 'Epsom Cup', grade: 'G3', week: 23, month: 'Jun', surface: 'Turf', distance: 1800, location: 'Tokyo', purse: 4100 },
  { id: 'unicorn_s', name: 'Unicorn Stakes', grade: 'G3', week: 24, month: 'Jun', surface: 'Dirt', distance: 1600, location: 'Tokyo', requirements: '3yo', purse: 3700 },
  
  { id: 'takarazuka_kinen', name: 'Takarazuka Kinen', grade: 'G1', week: 25, month: 'Jun', surface: 'Turf', distance: 2200, location: 'Hanshin', purse: 22000 },

  // --- SUMMER ---
  { id: 'radio_nikkei', name: 'Radio Nikkei Sho', grade: 'G3', week: 26, month: 'Jul', surface: 'Turf', distance: 1800, location: 'Fukushima', requirements: '3yo', purse: 3800 },
  // Adjusted Tanabata Sho to 1800m to match Fukushima map
  { id: 'tanabata_sho', name: 'Tanabata Sho', grade: 'G3', week: 27, month: 'Jul', surface: 'Turf', distance: 1800, location: 'Fukushima', purse: 4300 },
  { id: 'hakodate_kinen', name: 'Hakodate Kinen', grade: 'G3', week: 28, month: 'Jul', surface: 'Turf', distance: 2000, location: 'Hakodate', purse: 4300 },
  { id: 'chukyo_kinen', name: 'Chukyo Kinen', grade: 'G3', week: 29, month: 'Jul', surface: 'Turf', distance: 1600, location: 'Chukyo', purse: 4100 },
  // Adjusted Queen Stakes to 2000m to match Sapporo map
  { id: 'queen_s', name: 'Queen Stakes', grade: 'G3', week: 30, month: 'Jul', surface: 'Turf', distance: 2000, location: 'Sapporo', requirements: 'F&M', purse: 3800 },

  { id: 'leopard_s', name: 'Leopard Stakes', grade: 'G3', week: 31, month: 'Aug', surface: 'Dirt', distance: 1800, location: 'Chukyo', requirements: '3yo', purse: 4000 },
  { id: 'sapporo_kinen', name: 'Sapporo Kinen', grade: 'G2', week: 33, month: 'Aug', surface: 'Turf', distance: 2000, location: 'Sapporo', purse: 7000 },
  // Adjusted Keeneland Cup to Hakodate 2000m (Hakodate 1200 is not mapped)
  { id: 'keeneland_cup', name: 'Keeneland Cup', grade: 'G3', week: 34, month: 'Aug', surface: 'Turf', distance: 2000, location: 'Hakodate', purse: 4100 },

  // --- FALL ---
  { id: 'shion_s', name: 'Shion Stakes', grade: 'G2', week: 35, month: 'Sep', surface: 'Turf', distance: 2000, location: 'Nakayama', requirements: '3yo Fillies', purse: 5200 },
  { id: 'centaur_s', name: 'Centaur Stakes', grade: 'G2', week: 36, month: 'Sep', surface: 'Turf', distance: 1200, location: 'Chukyo', purse: 5900 },
  // Adjusted Rose Stakes to Hanshin 2000m (Hanshin 1800 is not mapped)
  { id: 'rose_s', name: 'Rose Stakes', grade: 'G2', week: 37, month: 'Sep', surface: 'Turf', distance: 2000, location: 'Hanshin', requirements: '3yo Fillies', purse: 5200 },
  { id: 'st_lite', name: 'St. Lite Kinen', grade: 'G2', week: 37, month: 'Sep', surface: 'Turf', distance: 2200, location: 'Nakayama', requirements: '3yo', purse: 5400 },
  
  // Adjusted Kobe Shimbun Hai to Hanshin 2200m (Hanshin 2400 is not mapped)
  { id: 'kobe_shimbun', name: 'Kobe Shimbun Hai', grade: 'G2', week: 38, month: 'Sep', surface: 'Turf', distance: 2200, location: 'Hanshin', requirements: '3yo', purse: 5400 },
  { id: 'all_comers', name: 'All Comers', grade: 'G2', week: 38, month: 'Sep', surface: 'Turf', distance: 2200, location: 'Nakayama', purse: 6700 },

  // Adjusted Sprinters Stakes to Kyoto 1200m (Nakayama 1200 is not mapped)
  { id: 'sprinters_s', name: 'Sprinters Stakes', grade: 'G1', week: 39, month: 'Sep', surface: 'Turf', distance: 1200, location: 'Kyoto', purse: 17000 },
  // Adjusted Sirius Stakes to Chukyo Dirt 1800m (Chukyo Dirt 2000 is not mapped)
  { id: 'sirius_s', name: 'Sirius Stakes', grade: 'G3', week: 39, month: 'Sep', surface: 'Dirt', distance: 1800, location: 'Chukyo', purse: 3800 },

  { id: 'mainichi_okan', name: 'Mainichi Okan', grade: 'G2', week: 40, month: 'Oct', surface: 'Turf', distance: 1800, location: 'Tokyo', purse: 6700 },
  // Adjusted Kyoto Daishoten to Kyoto 2200m (Kyoto 2400 is not mapped)
  { id: 'kyoto_daishoten', name: 'Kyoto Daishoten', grade: 'G2', week: 40, month: 'Oct', surface: 'Turf', distance: 2200, location: 'Kyoto', purse: 6700 },

  { id: 'shuka_sho', name: 'Shuka Sho', grade: 'G1', week: 41, month: 'Oct', surface: 'Turf', distance: 2000, location: 'Kyoto', requirements: '3yo Fillies', purse: 11000 },
  { id: 'fuchu_himba', name: 'Fuchu Himba S', grade: 'G2', week: 41, month: 'Oct', surface: 'Turf', distance: 1800, location: 'Tokyo', requirements: 'Mares', purse: 5500 },

  { id: 'kikuka_sho', name: 'Kikuka Sho', grade: 'G1', week: 42, month: 'Oct', surface: 'Turf', distance: 3000, location: 'Kyoto', requirements: '3yo', purse: 15000 },
  { id: 'fuji_s', name: 'Fuji Stakes', grade: 'G2', week: 42, month: 'Oct', surface: 'Turf', distance: 1600, location: 'Tokyo', purse: 5900 },

  { id: 'tenno_autumn', name: 'Tenno Sho (Autumn)', grade: 'G1', week: 43, month: 'Oct', surface: 'Turf', distance: 2000, location: 'Tokyo', purse: 22000 },
  // Adjusted Swan Stakes to Kyoto 1600m (Kyoto 1400 is not mapped)
  { id: 'swan_s', name: 'Swan Stakes', grade: 'G2', week: 43, month: 'Oct', surface: 'Turf', distance: 1600, location: 'Kyoto', purse: 5900 },

  // Adjusted AR Republic Cup to Tokyo 2400m (Tokyo 2500 is not mapped)
  { id: 'argentine_republic', name: 'AR Republic Cup', grade: 'G2', week: 44, month: 'Nov', surface: 'Turf', distance: 2400, location: 'Tokyo', purse: 5700 },
  { id: 'miyako_s', name: 'Miyako Stakes', grade: 'G3', week: 44, month: 'Nov', surface: 'Dirt', distance: 1800, location: 'Chukyo', purse: 3800 },

  { id: 'elizabeth_queen', name: 'Queen Elizabeth II', grade: 'G1', week: 45, month: 'Nov', surface: 'Turf', distance: 2200, location: 'Kyoto', requirements: 'F&M', purse: 13000 },
  { id: 'musashino_s', name: 'Musashino Stakes', grade: 'G3', week: 45, month: 'Nov', surface: 'Dirt', distance: 1600, location: 'Tokyo', purse: 4000 },

  { id: 'mile_cs', name: 'Mile Championship', grade: 'G1', week: 46, month: 'Nov', surface: 'Turf', distance: 1600, location: 'Kyoto', purse: 18000 },
  
  { id: 'japan_cup', name: 'Japan Cup', grade: 'G1', week: 47, month: 'Nov', surface: 'Turf', distance: 2400, location: 'Tokyo', purse: 50000 },
  // Adjusted Keihan Hai to Kyoto 1600m (Kyoto 1200 is not mapped)
  { id: 'keihan_hai', name: 'Keihan Hai', grade: 'G3', week: 47, month: 'Nov', surface: 'Turf', distance: 1600, location: 'Kyoto', purse: 4100 },

  { id: 'champions_cup', name: 'Champions Cup', grade: 'G1', week: 48, month: 'Dec', surface: 'Dirt', distance: 1800, location: 'Chukyo', purse: 12000 },
  // Adjusted Stayers Stakes to Kyoto 3200m (Nakayama 3600 is not mapped)
  { id: 'stayers_s', name: 'Stayers Stakes', grade: 'G2', week: 48, month: 'Dec', surface: 'Turf', distance: 3200, location: 'Kyoto', purse: 6200 },

  // MOVED Capella Stakes to Chukyo 1400m Dirt (Nakayama Dirt is entirely unmapped)
  { id: 'capella_s', name: 'Capella Stakes', grade: 'G3', week: 49, month: 'Dec', surface: 'Dirt', distance: 1400, location: 'Chukyo', purse: 3800 },

  { id: 'turquoise_s', name: 'Turquoise Stakes', grade: 'G3', week: 50, month: 'Dec', surface: 'Turf', distance: 1600, location: 'Nakayama', requirements: 'F&M', purse: 3800 },

  { id: 'arima_kinen', name: 'Arima Kinen', grade: 'G1', week: 51, month: 'Dec', surface: 'Turf', distance: 2500, location: 'Nakayama', purse: 50000 },
  // Adjusted Hanshin Cup to Hanshin 1600m (Hanshin 1400 is not mapped)
  { id: 'hanshin_cup', name: 'Hanshin Cup', grade: 'G2', week: 51, month: 'Dec', surface: 'Turf', distance: 1600, location: 'Hanshin', purse: 6700 },

];

export function getRacesByWeek(week: number): RaceEvent[] {
  return FULL_CALENDAR.filter(r => r.week === week);
}

export function getRaceByWeek(week: number): RaceEvent | undefined {
  return FULL_CALENDAR.find(r => r.week === week);
}

export const TOTAL_WEEKS = 52;