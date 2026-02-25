// src/logic/season.ts
import { generateTieredUma } from '../generator';
import type { Uma, NewsItem } from '../types'; // Make sure NewsItem is imported
import { LEAGUE_TEAMS } from '../data/teams';
import { generateAwardsRace } from './awards'; // <-- NEW IMPORT

// CONFIG: TARGET SIZE
const TARGET_ROSTER_SIZE = 15; 

export function replenishRosters(currentRoster: Uma[]): Uma[] {
    const newRookies: Uma[] = [];
    
    LEAGUE_TEAMS.forEach(team => {
        if (team.id === 'player') return; 

        const teamHorses = currentRoster.filter(u => u.teamId === team.id && u.status === 'active');
        
        if (teamHorses.length < TARGET_ROSTER_SIZE) {
            const needed = TARGET_ROSTER_SIZE - teamHorses.length;
            
            let tier: 1 | 2 | 3 = 3;
            if (team.prestige >= 90) tier = 1;      
            else if (team.prestige >= 60) tier = 2; 
            
            for (let i = 0; i < needed; i++) {
                const rookie = generateTieredUma(tier);
                rookie.teamId = team.id;
                rookie.age = 3; 
                rookie.career.earnings = 0;
                rookie.career.races = 0;
                rookie.history = [];
                newRookies.push(rookie);
            }
        }
    });

    return newRookies;
}

export function processWeeklyAIGrowth(roster: Uma[]): Uma[] {
    return roster.map(uma => {
        if (uma.teamId === 'player' || uma.status !== 'active') return uma;

        const currentTotal = uma.stats.speed + uma.stats.stamina + uma.stats.power + uma.stats.guts + uma.stats.wisdom;
        const currentRating = Math.floor(currentTotal / 50) + 10;

        if (uma.potential && currentRating >= uma.potential) return uma;

        let growthChance = 0;
        const gap = (uma.potential || 0) - currentRating;
        const needsCatchUp = gap > 10;

        if (uma.age === 3) growthChance = 0.40;
        else if (uma.age === 4) growthChance = 0.25;
        else if (uma.age === 5) growthChance = needsCatchUp ? 0.30 : 0.05; 
        else if (uma.age === 6) growthChance = needsCatchUp ? 0.15 : 0.0;

        if (Math.random() < growthChance) {
            const stats = ['speed', 'stamina', 'power', 'guts', 'wisdom'] as const;
            const s1 = stats[Math.floor(Math.random() * stats.length)];
            uma.stats[s1] = Math.min(1200, uma.stats[s1] + Math.floor(Math.random() * 4) + 2);

            if (needsCatchUp && Math.random() > 0.5) {
                 const s2 = stats[Math.floor(Math.random() * stats.length)];
                 uma.stats[s2] = Math.min(1200, uma.stats[s2] + Math.floor(Math.random() * 4) + 2);
            }
        }

        if (uma.age >= 7 && Math.random() < 0.15) {
             const stats = ['speed', 'stamina', 'power', 'guts', 'wisdom'] as const;
             const targetStat = stats[Math.floor(Math.random() * stats.length)];
             uma.stats[targetStat] = Math.max(50, uma.stats[targetStat] - 5);
        }

        return uma;
    });
}

export function processWeeklyPlayerUpdates(roster: Uma[]): Uma[] {
    return roster.map(uma => {
        if (uma.status === 'retired') return uma;
        if (uma.teamId !== 'player') return uma;

        if (uma.fatigue > 0) {
            uma.fatigue = Math.max(0, uma.fatigue - 5);
        }

        if (uma.injuryWeeks > 0) {
            uma.injuryWeeks -= 1;
            if (uma.injuryWeeks === 0) {
                uma.condition = 70; 
            }
            return uma; 
        }

        if (uma.fatigue > 30 && Math.random() < 0.05) {
             uma.injuryWeeks = 1;
             uma.fatigue += 10;
        }

        return uma;
    });
}

// ============================================================================
// --- NEW FUNCTION: END OF YEAR AWARDS GALA ---
// ============================================================================
export function assignEndOfYearAwards(roster: Uma[], currentYear: number): { updatedRoster: Uma[], newsData: NewsItem[] } {
    const awards = generateAwardsRace(roster, currentYear);
    const newsData: NewsItem[] = [];

    // Map through the roster so we aren't mutating directly without returning
    const updatedRoster = roster.map(uma => {
        let isAwardWinner = false;

        // 1. Check Overall HOTY
        if (awards.horseOfTheYear[0]?.uma.id === uma.id) {
            uma.trophies.push(`Year ${currentYear} Horse of the Year`);
            isAwardWinner = true;
            newsData.push({
                year: currentYear, week: 52, type: 'important',
                message: `🏆 AWARDS: ${uma.firstName} ${uma.lastName} is the Year ${currentYear} Horse of the Year!`
            });
        }

        // 2. Check 3YO Champion
        if (awards.champion3YO[0]?.uma.id === uma.id) {
            uma.trophies.push(`Year ${currentYear} Champion 3-Year-Old`);
            isAwardWinner = true;
            newsData.push({
                year: currentYear, week: 52, type: 'info',
                message: `🥇 AWARDS: ${uma.lastName} takes home the Champion 3-Year-Old title.`
            });
        }

        // 3. Check Older Champion
        if (awards.championOlder[0]?.uma.id === uma.id) {
            uma.trophies.push(`Year ${currentYear} Champion Older Horse`);
            isAwardWinner = true;
            newsData.push({
                year: currentYear, week: 52, type: 'info',
                message: `🌟 AWARDS: Veteran ${uma.lastName} named Champion Older Horse.`
            });
        }

        return uma;
    });

    return { updatedRoster, newsData };
}