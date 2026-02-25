import type { Uma } from '../types';
import { FULL_CALENDAR } from '../data/calendar';

export interface AwardCandidate {
    uma: Uma;
    score: number;
    wins: number;
    g1Wins: number;
    earningsEstimate: number;
}

export function calculateYearScore(uma: Uma, currentYear: number): AwardCandidate {
    const thisYearRaces = uma.history.filter(h => h.year === currentYear);
    let score = 0;
    let wins = 0;
    let g1Wins = 0;
    let earningsEstimate = 0;

    thisYearRaces.forEach(record => {
        // Find the race in the calendar to check its Grade and Purse
        const raceEvent = FULL_CALENDAR.find(r => record.raceName.includes(r.name));
        
        if (raceEvent) {
            // Estimate Earnings (1st = 100%, 2nd = 40%, 3rd = 25%)
            let prize = 0;
            if (record.rank === 1) prize = raceEvent.purse;
            else if (record.rank === 2) prize = raceEvent.purse * 0.4;
            else if (record.rank === 3) prize = raceEvent.purse * 0.25;

            earningsEstimate += prize;
            score += prize; // Base score is earnings

            // Massive Score Multipliers for Wins
            if (record.rank === 1) {
                wins++;
                if (raceEvent.grade === 'G1') {
                    g1Wins++;
                    score += 50000; // Big MVP boost for G1s
                } else if (raceEvent.grade === 'G2') {
                    score += 15000;
                } else if (raceEvent.grade === 'G3') {
                    score += 5000;
                }
            }
        }
    });

    return { uma, score, wins, g1Wins, earningsEstimate };
}

export function generateAwardsRace(allUmas: Uma[], currentYear: number) {
    // 1. Score every active horse
    const candidates = allUmas
        .filter(u => u.status === 'active') // Only active horses
        .map(uma => calculateYearScore(uma, currentYear))
        .filter(c => c.score > 0); // Ignore horses that haven't raced

    // 2. Sort from Highest Score to Lowest
    candidates.sort((a, b) => b.score - a.score);

    // 3. Filter into Categories
    return {
        horseOfTheYear: candidates.slice(0, 10),
        champion3YO: candidates.filter(c => c.uma.age === 3).slice(0, 5),
        championOlder: candidates.filter(c => c.uma.age > 3).slice(0, 5),
    };
}