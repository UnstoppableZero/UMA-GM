// src/logic/race.ts
import type { Uma } from './types';
import { getCommentary } from './commentary'; 

export interface RaceResult {
  uma: Uma; rank: number; time: number; splits: number[];
}

export interface LogEntry { message: string; timePct: number; }

export interface RaceOutcome { results: RaceResult[]; log: LogEntry[]; }

const FRAME_RATE = 10; 

// --- OVERHAUL: PUNISHING WIND & DRAFTING ---
const LEADER_WIND_DRAG = 1.35; // Leader burns 35% more stamina
const DRAFTING_BONUS = 0.80;   // Pack saves 20% stamina tucked in

function getBestStrategy(apt: Uma['aptitude']): 'runner' | 'leader' | 'betweener' | 'chaser' {
    const s = apt.strategy;
    if (s.runner >= s.leader && s.runner >= s.betweener && s.runner >= s.chaser) return 'runner';
    if (s.leader >= s.runner && s.leader >= s.betweener && s.leader >= s.chaser) return 'leader';
    if (s.betweener >= s.runner && s.betweener >= s.leader && s.betweener >= s.chaser) return 'betweener';
    return 'chaser';
}

function getDistanceType(dist: number): 'short' | 'mile' | 'medium' | 'long' {
  if (dist <= 1400) return 'short';
  if (dist <= 1600) return 'mile';
  if (dist <= 2200) return 'medium';
  return 'long';
}

export const simulateRace = (field: Uma[], distance: number, surface: 'Turf'|'Dirt' = 'Turf'): RaceOutcome => {
  
  const distCategory = getDistanceType(distance);

  // --- OVERHAUL: BIOLOGICAL BASE PACE ---
  let basePace = 16.6;
  if (distance <= 1400) basePace = 17.5;      
  else if (distance <= 1800) basePace = 17.0; 
  else if (distance <= 2400) basePace = 16.5; 
  else basePace = 16.0;                       

  let racers = field.map(uma => {
    // @ts-ignore
    const aptScore = uma.aptitude.distance[distCategory] || 1;
    let penaltyMod = 1.0;
    if (aptScore === 6) penaltyMod = 0.95;      
    else if (aptScore <= 4) penaltyMod = 0.85;  
    else if (aptScore <= 2) penaltyMod = 0.70;  

    const effectiveSpeed = uma.stats.speed * penaltyMod;
    const effectiveStamina = uma.stats.stamina * penaltyMod;
    const effectivePower = uma.stats.power * penaltyMod;
    
    // @ts-ignore
    const strategy = getBestStrategy(uma.aptitude);

    // --- OVERHAUL: DYNAMIC PREFERRED GAPS (THE TEARDROP SHAPE) ---
    let preferredGap = 0;
    if (strategy === 'runner') preferredGap = 0; 
    else if (strategy === 'leader') preferredGap = 3 + Math.random() * 5;     
    else if (strategy === 'betweener') preferredGap = 10 + Math.random() * 8; 
    else if (strategy === 'chaser') preferredGap = 20 + Math.random() * 10;   

    const wisdomModifier = (1200 - uma.stats.wisdom) / 1200; 
    const randomNoise = (Math.random() * (60 * wisdomModifier)) - (30 * wisdomModifier);

    let skillTriggerMeters = (distance - 600) + randomNoise;
    skillTriggerMeters = Math.max(distance * 0.5, skillTriggerMeters); 
    skillTriggerMeters = Math.min(distance - 50, skillTriggerMeters);

    return {
      uma,
      currentDist: 0, currentSpeed: 0,
      currentStamina: effectiveStamina, maxStamina: effectiveStamina, 
      effectiveSpeed, effectivePower, strategy, preferredGap,
      finished: false, finishTime: 0,
      inZone: false, isSpurting: false, stats: uma.stats,
      isDrafting: false, isLeading: false, hasBonked: false
    };
  });

  let time = 0;
  let finishedCount = 0;
  const tempLogs: { message: string, time: number }[] = [];
  
  let announced1000m = false;
  let hasAnnouncedFinal = false;
  let leaderDist = 0;

  tempLogs.push({ message: getCommentary('start'), time: 0.1 });

  const distanceTax = distance / 2000; 

  while (finishedCount < racers.length) {
    time += (1 / FRAME_RATE);
    if (time > 600) break; 

    const currentStandings = [...racers].sort((a, b) => b.currentDist - a.currentDist);
    const leader = currentStandings[0];
    leaderDist = leader.currentDist;
    
    racers.forEach(r => r.isLeading = (r.uma.id === leader.uma.id));

    if (leaderDist >= 1000 && !announced1000m) {
        announced1000m = true;
        let desc = "";
        if (time < 58.5) desc = getCommentary('split1000mFast', { time: time.toFixed(1) });
        else if (time > 61.5) desc = getCommentary('split1000mSlow', { time: time.toFixed(1) });
        else desc = getCommentary('split1000mNormal', { time: time.toFixed(1) });
        tempLogs.push({ message: desc, time: time });
    }

    if (!hasAnnouncedFinal && leaderDist > distance - 300) {
        hasAnnouncedFinal = true;
        tempLogs.push({ message: getCommentary('finalStraight'), time: time });
    }

    racers.forEach(r => {
      if (r.finished) return;

      const progress = r.currentDist / distance;
      let targetSpeed = 0;
      r.isDrafting = false; 

      const speedRatio = r.effectiveSpeed / 1200;
      const powerRatio = r.effectivePower / 1200;

      if (progress < 0.65) {
          const myGap = leaderDist - r.currentDist;
          
          targetSpeed = basePace;

          if (myGap > r.preferredGap + 2) { 
             targetSpeed *= 1.04; 
             if (myGap > 3 && myGap < 15 && !r.isLeading) r.isDrafting = true;
          } else if (myGap < r.preferredGap - 1) {
             if (!r.isLeading) targetSpeed *= 0.96;
          }
      } 
      else {
          const sprintCostPerMeter = 1.0 * distanceTax; 
          const distRemaining = distance - r.currentDist;
          const canSprint = r.currentStamina > (distRemaining * sprintCostPerMeter);

          if (canSprint || (r.stats.guts > 800 && progress > 0.85)) {
             r.isSpurting = true;
          } else {
             r.isSpurting = false; 
          }

          if (progress > 0.75 && !r.inZone && r.stats.guts > 750 && r.stats.wisdom > 750 && !r.hasBonked) {
              if (Math.random() < 0.002) { 
                  r.inZone = true;
                  tempLogs.push({ message: getCommentary('zoneEntered', { name: r.uma.lastName }), time: time });
              }
          }

          if (r.isSpurting || r.inZone) {
             const speedBonus = Math.pow(speedRatio, 1.6) * 2.0;
             targetSpeed = basePace + speedBonus;
             
             if (r.strategy === 'chaser') targetSpeed += 0.4; 
             if (r.inZone) targetSpeed += 0.8; 
          } else {
             targetSpeed = basePace; 
          }
      }

      let drain = 0.60 * distanceTax * (1 / FRAME_RATE);
      
      if (r.isSpurting) {
          const spurtTax = 1.0 + Math.pow(speedRatio, 2); 
          drain *= (2.0 * spurtTax); 
      }
      
      if (r.isLeading) drain *= LEADER_WIND_DRAG; 
      else if (r.isDrafting) drain *= DRAFTING_BONUS;   
      
      if (r.inZone) drain = 0; 

      const wisdomSave = Math.pow(r.stats.wisdom / 1200, 1.5) * 0.15; 
      drain *= (1 - wisdomSave);

      r.currentStamina -= drain;

      if (r.currentStamina <= 0) {
           r.currentStamina = 0;
           r.isSpurting = false;
           r.inZone = false;
           
           if (!r.hasBonked) {
               r.hasBonked = true;
               if (r.isLeading && !tempLogs.some(l => l.message.includes(r.uma.lastName) && l.message.includes("gas"))) {
                   tempLogs.push({ message: `🛑 ${r.uma.lastName} is out of gas!`, time: time });
               }
           }
           
           const gutsSurvivalRate = 0.85 + ((r.stats.guts / 1200) * 0.10); 
           targetSpeed = Math.min(targetSpeed, basePace * gutsSurvivalRate); 
      }

      const acceleration = Math.max(0.1, Math.pow(powerRatio, 1.5) * 1.5) * (1 / FRAME_RATE); 
      if (r.currentSpeed < targetSpeed) {
         r.currentSpeed = Math.min(targetSpeed, r.currentSpeed + acceleration);
      } else {
         r.currentSpeed = Math.max(targetSpeed, r.currentSpeed - (acceleration * 0.5));
      }

      r.currentDist += r.currentSpeed * (1 / FRAME_RATE);
      
      if (r.currentDist >= distance) {
        r.finished = true;
        r.finishTime = time;
        finishedCount++;
      }
    });
  }

  racers.sort((a, b) => a.finishTime - b.finishTime);

  const results = racers.map((r, i) => ({
    uma: r.uma, rank: i + 1, time: parseFloat(r.finishTime.toFixed(2)), splits: [],
  }));

  const raceEndTime = Math.max(...results.map(r => r.time));
  const finalLog: LogEntry[] = tempLogs.map(l => ({ message: l.message, timePct: l.time / raceEndTime }));
  finalLog.push({ message: getCommentary('winnerAnnouncement', { winner: results[0].uma.lastName }), timePct: 1.0 });

  return { results, log: finalLog };
};