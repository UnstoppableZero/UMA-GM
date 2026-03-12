// src/logic/season.ts
import { generateTieredUma } from '../generator';
import type { Uma, NewsItem, Team, DraftPick } from '../types'; 
import { generateAwardsRace } from './awards'; 

// ============================================================================
// --- PRIME & DECLINE GROWTH CURVE ---
// ============================================================================
export function processWeeklyAIGrowth(roster: Uma[]): Uma[] {
    return roster.map(uma => {
        if (uma.teamId === 'player' && !uma.isLateBloomer) return uma; 
        if (uma.status !== 'active') return uma;

        const currentTotal = uma.stats.speed + uma.stats.stamina + uma.stats.power + uma.stats.guts + uma.stats.wisdom;
        const currentRating = Math.floor(currentTotal / 50) + 10;

        let declineChance = 0;
        if (uma.age === 5 && !uma.isLateBloomer) declineChance = 0.05; 
        if (uma.age === 6) declineChance = uma.isLateBloomer ? 0.05 : 0.15; 
        if (uma.age >= 7) declineChance = 0.30; 

        if (Math.random() < declineChance) {
             const stats = ['speed', 'stamina', 'power', 'guts', 'wisdom'] as const;
             const targetStat = stats[Math.floor(Math.random() * stats.length)];
             uma.stats[targetStat] = Math.max(50, uma.stats[targetStat] - 3); 
             return uma; 
        }

        if (uma.potential && currentRating >= uma.potential) return uma;

        const gap = (uma.potential || 0) - currentRating;
        let growthChance = 0;

        if (uma.isLateBloomer) {
            if (uma.age === 3) growthChance = 0.30; 
            else if (uma.age === 4) growthChance = 0.90; 
            else if (uma.age === 5) growthChance = 0.60; 
        } else {
            if (uma.teamId === 'player') return uma; 
            
            if (uma.age === 3) growthChance = 0.50; 
            else if (uma.age === 4) growthChance = 0.30; 
            else if (uma.age === 5) growthChance = gap > 10 ? 0.20 : 0.05; 
        }

        if (Math.random() < growthChance) {
            const stats = ['speed', 'stamina', 'power', 'guts', 'wisdom'] as const;
            const s1 = stats[Math.floor(Math.random() * stats.length)];
            
            // --- FIXED: THE PERFECT PENTAGON NERF ---
            if (uma.isLateBloomer && gap > 15 && uma.age >= 4) {
                 // Pick 2 random stats to surge. This ensures they grow rapidly but maintain an unbalanced shape.
                 const s2 = stats[Math.floor(Math.random() * stats.length)];
                 uma.stats[s1] = Math.min(1200, uma.stats[s1] + Math.floor(Math.random() * 8) + 4);
                 uma.stats[s2] = Math.min(1200, uma.stats[s2] + Math.floor(Math.random() * 8) + 4);
            } 
            else if (gap > 10) {
                 const s2 = stats[Math.floor(Math.random() * stats.length)];
                 uma.stats[s1] = Math.min(1200, uma.stats[s1] + Math.floor(Math.random() * 6) + 3);
                 uma.stats[s2] = Math.min(1200, uma.stats[s2] + Math.floor(Math.random() * 6) + 3);
            } 
            else {
                 uma.stats[s1] = Math.min(1200, uma.stats[s1] + Math.floor(Math.random() * 4) + 2);
            }
        }

        return uma;
    });
}

// ============================================================================
// --- BBGM-STYLE OFFSEASON (DRAFT & PURGE) ---
// ============================================================================
export function processOffseason(roster: Uma[], teams: Team[], currentYear: number) {
    let cutCount = 0;
    const draftPicks: DraftPick[] = [];
    const newRookies: Uma[] = [];

    const ROOKIE_CLASS_SIZE = 80;
    const MAX_LEAGUE_SIZE = 350;

    const activeHorses = roster.filter(u => u.status === 'active');
    
    if (activeHorses.length > (MAX_LEAGUE_SIZE - ROOKIE_CLASS_SIZE)) {
        const numToCut = activeHorses.length - (MAX_LEAGUE_SIZE - ROOKIE_CLASS_SIZE);
        
        const candidates = activeHorses.filter(u => u.age >= 5 && u.teamId !== 'player'); 
        
        candidates.sort((a, b) => {
            const aScore = a.career.earnings + (a.history.filter(h => h.rank === 1 && h.raceName.includes('G1')).length * 50000);
            const bScore = b.career.earnings + (b.history.filter(h => h.rank === 1 && h.raceName.includes('G1')).length * 50000);
            return aScore - bScore;
        });

        for (let i = 0; i < Math.min(numToCut, candidates.length); i++) {
            candidates[i].status = 'retired'; 
            cutCount++;
        }
    }

    const draftPool: Uma[] = [];
    for (let i = 0; i < ROOKIE_CLASS_SIZE; i++) {
        const isLateBloomer = Math.random() < 0.05; 
        const roll = Math.random();
        const tier = roll < 0.2 ? 1 : (roll < 0.7 ? 2 : 3); 
        draftPool.push(generateTieredUma(tier, undefined, 3, isLateBloomer)); 
    }

    const draftOrder = [...teams].sort((a, b) => a.history.earnings - b.history.earnings);
    
    let pickNumber = 1;
    const rounds = Math.floor(ROOKIE_CLASS_SIZE / draftOrder.length);

    for (let round = 1; round <= rounds; round++) {
        for (const team of draftOrder) {
            if (draftPool.length === 0) break;

            draftPool.sort((a, b) => {
                const aScore = (a.currentOvr * 0.8) + (a.potential * 0.2) + (Math.random() * 5);
                const bScore = (b.currentOvr * 0.8) + (b.potential * 0.2) + (Math.random() * 5);
                return bScore - aScore;
            });

            const draftedUma = draftPool.shift()!;
            draftedUma.teamId = team.id;
            draftedUma.draftYear = currentYear;
            draftedUma.draftPick = pickNumber;
            
            newRookies.push(draftedUma);

            draftPicks.push({
                year: currentYear,
                pick: pickNumber,
                teamId: team.id,
                umaId: draftedUma.id,
                umaName: `${draftedUma.firstName} ${draftedUma.lastName}`,
                ovr: draftedUma.currentOvr,
                pot: draftedUma.potential,
                isLateBloomer: draftedUma.isLateBloomer || false
            });

            pickNumber++;
        }
    }

    return { cutCount, newRookies, draftPicks };
}

export function assignEndOfYearAwards(roster: Uma[], currentYear: number): { updatedRoster: Uma[], newsData: NewsItem[] } {
    const awards = generateAwardsRace(roster, currentYear);
    const newsData: NewsItem[] = [];

    const updatedRoster = roster.map(uma => {
        if (awards.horseOfTheYear[0]?.uma.id === uma.id) {
            uma.trophies.push(`Year ${currentYear} Horse of the Year`);
            newsData.push({
                year: currentYear, week: 52, type: 'important',
                message: `🏆 AWARDS: ${uma.firstName} ${uma.lastName} is the Year ${currentYear} Horse of the Year!`
            });
        }
        if (awards.champion3YO[0]?.uma.id === uma.id) {
            uma.trophies.push(`Year ${currentYear} Champion 3-Year-Old`);
            newsData.push({
                year: currentYear, week: 52, type: 'info',
                message: `🥇 AWARDS: ${uma.lastName} takes home the Champion 3-Year-Old title.`
            });
        }
        if (awards.championOlder[0]?.uma.id === uma.id) {
            uma.trophies.push(`Year ${currentYear} Champion Older Horse`);
            newsData.push({
                year: currentYear, week: 52, type: 'info',
                message: `🌟 AWARDS: Veteran ${uma.lastName} named Champion Older Horse.`
            });
        }
        return uma;
    });

    return { updatedRoster, newsData };
}