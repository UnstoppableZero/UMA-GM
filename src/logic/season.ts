// src/logic/season.ts
import { generateTieredUma } from '../generator';
import type { Uma } from '../types';
import { LEAGUE_TEAMS } from '../data/teams';

// CONFIG: TARGET SIZE
// Lowered from 20 to 15 to concentrate talent.
// 11 Teams * 15 Horses = 165 Total High-Quality Horses.
const TARGET_ROSTER_SIZE = 15; 

export function replenishRosters(currentRoster: Uma[]): Uma[] {
    const newRookies: Uma[] = [];
    
    LEAGUE_TEAMS.forEach(team => {
        if (team.id === 'player') return; 

        // Count active horses on the team (Ignore retired)
        const teamHorses = currentRoster.filter(u => u.teamId === team.id && u.status === 'active');
        
        // If below TARGET, fill it back up
        if (teamHorses.length < TARGET_ROSTER_SIZE) {
            const needed = TARGET_ROSTER_SIZE - teamHorses.length;
            
            // Tier Logic: Even "Weak" teams now get Tier 2/3 hybrids, not Tier 3 trash.
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
        // SAFETY CHECK: Skip Player horses AND Retired horses
        if (uma.teamId === 'player' || uma.status !== 'active') return uma;

        const currentTotal = uma.stats.speed + uma.stats.stamina + uma.stats.power + uma.stats.guts + uma.stats.wisdom;
        const currentRating = Math.floor(currentTotal / 50) + 10;

        // STOP if at potential
        if (uma.potential && currentRating >= uma.potential) return uma;

        // --- DYNAMIC GROWTH CHANCE ---
        let growthChance = 0;
        
        // Catch-up logic for late bloomers
        const gap = (uma.potential || 0) - currentRating;
        const needsCatchUp = gap > 10;

        if (uma.age === 3) growthChance = 0.40;
        else if (uma.age === 4) growthChance = 0.25;
        else if (uma.age === 5) growthChance = needsCatchUp ? 0.30 : 0.05; 
        else if (uma.age === 6) growthChance = needsCatchUp ? 0.15 : 0.0;

        if (Math.random() < growthChance) {
            const stats = ['speed', 'stamina', 'power', 'guts', 'wisdom'] as const;
            
            // Train 1 Stat
            const s1 = stats[Math.floor(Math.random() * stats.length)];
            uma.stats[s1] = Math.min(1200, uma.stats[s1] + Math.floor(Math.random() * 4) + 2);

            // Double Train if Catch-Up is needed
            if (needsCatchUp && Math.random() > 0.5) {
                 const s2 = stats[Math.floor(Math.random() * stats.length)];
                 uma.stats[s2] = Math.min(1200, uma.stats[s2] + Math.floor(Math.random() * 4) + 2);
            }
        }

        // Regression (Age 7+)
        if (uma.age >= 7 && Math.random() < 0.15) {
             const stats = ['speed', 'stamina', 'power', 'guts', 'wisdom'] as const;
             const targetStat = stats[Math.floor(Math.random() * stats.length)];
             uma.stats[targetStat] = Math.max(50, uma.stats[targetStat] - 5);
        }

        return uma;
    });
}

// --- NEW FUNCTION: The Fix for Zombie Horses ---
// Use this function to handle your weekly updates for the player.
export function processWeeklyPlayerUpdates(roster: Uma[]): Uma[] {
    return roster.map(uma => {
        // 🛑 ZOMBIE GUARD: If retired, return immediately. Do not touch.
        if (uma.status === 'retired') return uma;

        // Only process player horses
        if (uma.teamId !== 'player') return uma;

        // 1. Natural Fatigue Recovery (Small amount per week)
        if (uma.fatigue > 0) {
            uma.fatigue = Math.max(0, uma.fatigue - 5);
        }

        // 2. Injury Recovery
        if (uma.injuryWeeks > 0) {
            uma.injuryWeeks -= 1;
            // If healed, reset condition
            if (uma.injuryWeeks === 0) {
                uma.condition = 70; // Recovered but groggy
            }
            return uma; // Injured horses don't get random events
        }

        // 3. Random Bad Events (e.g. "Tweaked a muscle")
        // Only happens if condition is poor or fatigue is high
        if (uma.fatigue > 30 && Math.random() < 0.05) {
             // Mild injury logic
             uma.injuryWeeks = 1;
             uma.fatigue += 10;
             // You can add a notification system here if needed
        }

        return uma;
    });
}