// src/logic/race.ts
import type { Uma } from './types';
import { getCommentary } from './commentary'; 

export interface RaceResult {
  uma: Uma; 
  rank: number; 
  time: number; 
  splits: number[];
  positionLog: number[]; // <-- NEW: Tracks exact meters traveled per second!
}

export interface LogEntry { message: string; timePct: number; }

export interface RaceOutcome { results: RaceResult[]; log: LogEntry[]; }

const FRAME_RATE = 10; 
const MAX_SPRINT_BONUS = 1.5; 

const LEADER_WIND_DRAG = 1.15;   
const DRAFTING_BONUS = 0.92;     

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

  let RACE_PACE = 16.2;
  if (distance <= 1400) RACE_PACE = 16.5;
  else if (distance <= 1800) RACE_PACE = 16.3;
  else if (distance <= 2400) RACE_PACE = 16.1;
  else RACE_PACE = 15.8;

  let racers = field.map((uma, index) => {
    // @ts-ignore
    const aptScore = uma.aptitude.distance[distCategory] || 1;
    let penaltyMod = 1.0;
    if (aptScore === 6) penaltyMod = 0.98;      
    else if (aptScore <= 4) penaltyMod = 0.95;  
    else if (aptScore <= 2) penaltyMod = 0.90;  
    
    // @ts-ignore
    const strategy = getBestStrategy(uma.aptitude);

    let preferredGap = 0;
    if (strategy === 'runner') preferredGap = 0; 
    else if (strategy === 'leader') preferredGap = 2 + Math.random() * 4;     
    else if (strategy === 'betweener') preferredGap = 8 + Math.random() * 6;  
    else if (strategy === 'chaser') preferredGap = 15 + Math.random() * 10;   

    let baseTriggerDist = distance - 600; 
    if (distance <= 1400) baseTriggerDist = distance - 400; 
    
    let stratOffset = 0;
    if (strategy === 'runner') stratOffset = -150;     
    else if (strategy === 'leader') stratOffset = -50; 
    else if (strategy === 'betweener') stratOffset = 100; 
    else if (strategy === 'chaser') stratOffset = 300; 

    const wisdomModifier = (1200 - uma.stats.wisdom) / 1200; 
    const randomNoise = (Math.random() * (60 * wisdomModifier)) - (30 * wisdomModifier);

    let skillTriggerMeters = baseTriggerDist + stratOffset + randomNoise;
    skillTriggerMeters = Math.max(distance * 0.5, skillTriggerMeters); 
    skillTriggerMeters = Math.min(distance - 50, skillTriggerMeters);

    return {
      uma,
      idx: index,
      currentDist: 0, currentSpeed: 0,
      currentStamina: uma.stats.stamina * penaltyMod, maxStamina: uma.stats.stamina * penaltyMod, 
      effectiveSpeed: uma.stats.speed * penaltyMod, effectivePower: uma.stats.power * penaltyMod,
      strategy, preferredGap,
      finished: false, finishTime: 0,
      skillTriggered: false, skillTriggerMeters, 
      isSpurting: false, stats: uma.stats,
      isDrafting: false, isLeading: false, hasBonked: false,
      positionLog: [0] // Starts at 0 meters at 0 seconds
    };
  });

  let time = 0;
  let nextLogTime = 1.0; // The tracker for our frontend payload
  let finishedCount = 0;
  const tempLogs: { message: string, time: number }[] = [];
  
  let announced1000m = false;
  let hasAnnouncedMid = false;
  let hasAnnouncedFinal = false;
  let leaderDist = 0;
  let leaderId = "";

  tempLogs.push({ message: getCommentary('start'), time: 0.1 });
  const distanceTax = distance / 1600; 

  while (finishedCount < racers.length) {
    time += (1 / FRAME_RATE);
    if (time > 600) break; 

    const currentStandings = [...racers].sort((a, b) => b.currentDist - a.currentDist);
    const leader = currentStandings[0];
    leaderDist = leader.currentDist;
    
    racers.forEach(r => r.isLeading = (r.uma.id === leader.uma.id));

    if (time % 2 < 0.1 && leader.uma.id !== leaderId && leader.currentDist > 50) {
        leaderId = leader.uma.id;
        if (leader.currentDist < distance - 200) {
            tempLogs.push({ message: getCommentary('leader', { name: leader.uma.lastName }), time: time });
        }
    }

    if (leaderDist >= 1000 && !announced1000m) {
        announced1000m = true;
        let desc = "";
        if (time < 58.5) desc = getCommentary('split1000mFast', { time: time.toFixed(1) });
        else if (time > 61.5) desc = getCommentary('split1000mSlow', { time: time.toFixed(1) });
        else desc = getCommentary('split1000mNormal', { time: time.toFixed(1) });
        tempLogs.push({ message: desc, time: time });
    }

    if (!hasAnnouncedMid && leaderDist > distance * 0.5) {
        hasAnnouncedMid = true;
        tempLogs.push({ message: getCommentary('midRace'), time: time });
    }

    const finalStretchDist = distance > 2400 ? 400 : 200;
    if (!hasAnnouncedFinal && leaderDist > distance - finalStretchDist) {
        hasAnnouncedFinal = true;
        tempLogs.push({ message: getCommentary('finalStraight'), time: time });
    }

    racers.forEach(r => {
      if (r.finished) return;

      const progress = r.currentDist / distance;
      let targetSpeed = 0;
      r.isDrafting = false; 

      // PHASE 1: JOCKEYING
      if (progress < 0.70) {
          const jockeyingWiggle = Math.sin(time * 0.5 + r.idx) * 6.0;
          const dynamicGap = Math.max(0, r.preferredGap + jockeyingWiggle);
          const myGap = leaderDist - r.currentDist;
          
          const statPaceAdvantage = ((r.effectiveSpeed + r.effectivePower) / 2400) * 0.25;
          targetSpeed = RACE_PACE + statPaceAdvantage;

          if (myGap > dynamicGap + 1.5) { 
             targetSpeed *= 1.05; 
             if (myGap > 3 && myGap < 15 && !r.isLeading) r.isDrafting = true;
          } else if (myGap < dynamicGap - 1.5) {
             if (!r.isLeading) targetSpeed *= 0.95;
          }

          if (r.stats.wisdom < 400 && Math.random() < 0.05) targetSpeed *= 1.03; 
      } 
      // PHASE 2: LATE KICK
      else {
          const distRemaining = distance - r.currentDist;
          const speedBonus = (r.effectiveSpeed / 1200) * (MAX_SPRINT_BONUS * 0.7);
          const powerBonus = (r.effectivePower / 1200) * (MAX_SPRINT_BONUS * 0.3);
          
          targetSpeed = RACE_PACE + speedBonus + powerBonus;

          const sprintCostPerMeter = 0.5 * distanceTax; 
          const canSprint = r.currentStamina > (distRemaining * sprintCostPerMeter);

          let spurtThreshold = 0.70; 
          if (r.stats.stamina > 600) spurtThreshold = 0.65; 
          if (r.stats.stamina < 450) spurtThreshold = 0.75; 

          const gutsThresholdOverride = canSprint || (r.stats.guts > 800 && progress > 0.85);

          if (progress > spurtThreshold && gutsThresholdOverride) {
             r.isSpurting = true;
          } else {
             r.isSpurting = false; 
          }

          if (r.isSpurting) {
             targetSpeed += 0.5; 
             if (r.strategy === 'runner') targetSpeed += 0.0; 
             else if (r.strategy === 'leader') targetSpeed += 0.25; 
             else if (r.strategy === 'betweener') targetSpeed += 0.65; 
             else if (r.strategy === 'chaser') targetSpeed += 1.10; 
             
             r.currentStamina -= (0.5 * distanceTax); 
          }
      }

      let drain = 0.45 * distanceTax * (1 / FRAME_RATE);
      
      if (r.isSpurting) drain *= 1.5; 
      if (r.isLeading) drain *= LEADER_WIND_DRAG; 
      else if (r.isDrafting) drain *= DRAFTING_BONUS;   
      
      const wisdomSave = (r.stats.wisdom / 1200) * 0.15; 
      drain *= (1 - wisdomSave);

      r.currentStamina -= drain;

      if (r.currentStamina <= 0) {
           r.currentStamina = 0;
           r.isSpurting = false;
           
           if (!r.hasBonked) {
               r.hasBonked = true;
               if (r.isLeading && !tempLogs.some(l => l.message.includes(r.uma.lastName) && l.message.includes("gas"))) {
                   tempLogs.push({ message: `🛑 ${r.uma.lastName} is out of gas!`, time: time });
               }
           }
           
           const gutsSurvivalRate = 0.85 + ((r.stats.guts / 1200) * 0.10); 
           targetSpeed = Math.min(targetSpeed, RACE_PACE * gutsSurvivalRate); 
      }

      if (!r.skillTriggered && r.currentDist >= r.skillTriggerMeters && r.currentStamina > 20) {
         const chance = 0.50 + (r.stats.wisdom / 2400); 
         if (Math.random() < chance) {
             r.skillTriggered = true;
             if (!tempLogs.some(l => l.message.includes(r.uma.lastName) && l.message.includes("Zone"))) {
                 tempLogs.push({ message: `⚡ ${r.uma.lastName} taps into the Zone!`, time: time });
             }
         }
      }

      if (r.skillTriggered) targetSpeed += 0.8;

      const acceleration = (r.effectivePower / 200) * (1 / FRAME_RATE); 
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

    // --- NEW: THE POSITION LOG ---
    // Every full second, we record exactly where every horse is on the track
    if (time >= nextLogTime) {
        racers.forEach(r => {
            r.positionLog.push(Math.min(distance, r.currentDist)); // Cap at finish line
        });
        nextLogTime += 1.0;
    }
  }

  racers.sort((a, b) => a.finishTime - b.finishTime);

  const results = racers.map((r, i) => ({
    uma: r.uma, 
    rank: i + 1, 
    time: parseFloat(r.finishTime.toFixed(2)), 
    splits: [],
    positionLog: r.positionLog // Send the physics log to the UI!
  }));

  const raceEndTime = Math.max(...results.map(r => r.time));
  const finalLog: LogEntry[] = tempLogs.map(l => ({ message: l.message, timePct: l.time / raceEndTime }));
  finalLog.push({ message: getCommentary('winnerAnnouncement', { winner: results[0].uma.lastName }), timePct: 1.0 });

  return { results, log: finalLog };
};