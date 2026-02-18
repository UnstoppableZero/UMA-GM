// src/logic/race.ts
import type { Uma } from './types';
import { getCommentary } from './commentary'; 

export interface RaceResult {
  uma: Uma;
  rank: number;
  time: number;
  splits: number[];
}

export interface LogEntry {
  message: string;
  timePct: number; 
}

export interface RaceOutcome {
  results: RaceResult[];
  log: LogEntry[]; 
}

// SIMULATION CONSTANTS
const FRAME_RATE = 10; 
const RACE_PACE = 16.5; 
const MAX_SPRINT_BONUS = 1.5;

// --- PHYSICS TUNING v15 (THE "BONK" UPDATE) ---
const STAMINA_DRAIN_RATE = 0.60; 
const LEADER_WIND_DRAG = 1.25;   // MASSIVE NERF: Leader burns 25% MORE stamina
const DRAFTING_BONUS = 0.90;     // Drafters burn 10% LESS

function getBestStrategy(apt: Uma['aptitude']): 'runner' | 'leader' | 'betweener' | 'chaser' {
    const s = apt.strategy;
    if (s.runner >= s.leader && s.runner >= s.betweener && s.runner >= s.chaser) return 'runner';
    if (s.leader >= s.runner && s.leader >= s.betweener && s.leader >= s.chaser) return 'leader';
    if (s.betweener >= s.runner && s.betweener >= s.leader && s.betweener >= s.chaser) return 'betweener';
    return 'chaser';
}

export const simulateRace = (field: Uma[], distance: number, surface: 'Turf'|'Dirt' = 'Turf'): RaceOutcome => {
  
  // 1. Setup
  let racers = field.map(uma => {
    const stamina = uma.stats.stamina;
    // @ts-ignore
    const strategy = getBestStrategy(uma.aptitude);

    let baseTriggerDist = distance - 600; 
    if (distance <= 1400) baseTriggerDist = distance - 400; 
    
    let stratOffset = 0;
    if (strategy === 'runner') stratOffset = -150;     
    else if (strategy === 'leader') stratOffset = -50; 
    else if (strategy === 'betweener') stratOffset = 100; 
    else if (strategy === 'chaser') stratOffset = 300; 

    const randomNoise = (Math.random() * 30) - 15;

    let skillTriggerMeters = baseTriggerDist + stratOffset + randomNoise;
    skillTriggerMeters = Math.max(distance * 0.5, skillTriggerMeters); 
    skillTriggerMeters = Math.min(distance - 50, skillTriggerMeters);

    return {
      uma,
      currentDist: 0,
      currentSpeed: 0,
      currentStamina: stamina,
      maxStamina: stamina, 
      strategy,
      finished: false,
      finishTime: 0,
      skillTriggered: false,
      skillTriggerMeters, 
      isSpurting: false,
      stats: uma.stats,
      isDrafting: false,
      isLeading: false
    };
  });

  let time = 0;
  let finishedCount = 0;
  const tempLogs: { message: string, time: number }[] = [];
  let hasannouncedMid = false;
  let hasAnnouncedFinal = false;
  let leaderId = "";
  let leaderDist = 0;

  tempLogs.push({ message: getCommentary('start'), time: 0.1 });

  // 2. Main Loop
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
            tempLogs.push({
                message: getCommentary('leader', { name: leader.uma.lastName }),
                time: time
            });
        }
    }
    if (!hasannouncedMid && leader.currentDist > distance * 0.5) {
        hasannouncedMid = true;
        tempLogs.push({ message: getCommentary('midRace'), time: time });
    }
    const finalStretchDist = distance > 2400 ? 400 : 200;
    if (!hasAnnouncedFinal && leader.currentDist > distance - finalStretchDist) {
        hasAnnouncedFinal = true;
        tempLogs.push({
            message: distance > 2400 ? "🔔 The final bend! Who has the legs left?" : getCommentary('finalStraight'),
            time: time
        });
    }

    // --- PHYSICS ENGINE ---
    racers.forEach(r => {
      if (r.finished) return;

      const progress = r.currentDist / distance;
      let targetSpeed = 0;
      r.isDrafting = false; 

      // ==========================================================
      // PHASE 1: THE INVISIBLE RAIL (0% - 70%)
      // ==========================================================
      if (progress < 0.70) {
          
          // 1. Establish Position Target relative to Leader
          // NERF: Tightened gaps. Chasers are now closer to the front.
          let targetGap = 0;
          if (r.strategy === 'runner') targetGap = 0;       
          else if (r.strategy === 'leader') targetGap = 3;   // Was 4
          else if (r.strategy === 'betweener') targetGap = 6; // Was 8
          else if (r.strategy === 'chaser') targetGap = 10;  // Was 12
          
          const myGap = leaderDist - r.currentDist;
          const gapDelta = myGap - targetGap;

          // 2. Base Speed
          targetSpeed = RACE_PACE;

          // 3. Rubber Band Physics
          if (gapDelta > 2) { 
             targetSpeed *= 1.04; 
             if (myGap < 5 && !r.isLeading) r.isDrafting = true;
          } else if (gapDelta < -1) {
             if (!r.isLeading) {
                 targetSpeed *= 0.96;
             }
          }

          // NERF: Removed the flat +0.1 speed bonus for Runners. 
          // They no longer get "Free Speed" just for existing.
      } 
      
      // ==========================================================
      // PHASE 2: THE RELEASE (70% - 100%)
      // ==========================================================
      else {
          const distRemaining = distance - r.currentDist;
          
          const speedBonus = (r.stats.speed / 1200) * (MAX_SPRINT_BONUS * 0.7);
          const powerBonus = (r.stats.power / 1200) * (MAX_SPRINT_BONUS * 0.3);
          
          targetSpeed = RACE_PACE + speedBonus + powerBonus;

          const sprintCostPerMeter = 0.6; 
          const canSprint = r.currentStamina > (distRemaining * sprintCostPerMeter);

          let spurtThreshold = 0.70; 
          if (r.stats.stamina > 600) spurtThreshold = 0.65; 
          if (r.stats.stamina < 450) spurtThreshold = 0.75; 

          if (progress > spurtThreshold && canSprint) {
             r.isSpurting = true;
          } else {
             r.isSpurting = false; 
          }

          if (r.isSpurting) {
             targetSpeed += 0.5; 
             
             // BUFF: Chasers get stronger "Rubber Band Snap" speed
             if (r.strategy === 'chaser') targetSpeed += 0.60; // Was 0.45
             else if (r.strategy === 'betweener') targetSpeed += 0.35; // Was 0.25
             
             r.currentStamina -= 1.0; 
          }
      }

      // ==========================================================
      // MODIFIERS & STAMINA LOGIC
      // ==========================================================

      const distMod = distance > 2400 ? 0.8 : 1.0;
      let drain = STAMINA_DRAIN_RATE * distMod * (1 / FRAME_RATE);
      
      if (r.isSpurting) drain *= 1.5; 

      if (r.isLeading) {
          drain *= LEADER_WIND_DRAG; // 25% EXTRA DRAIN for Leader
      } else if (r.isDrafting) {
          drain *= DRAFTING_BONUS;   
      }
      
      r.currentStamina -= drain;

      // --- THE "BONK" (CATASTROPHIC FAILURE) ---
      // If a Runner runs out of stamina, they hit a brick wall.
      if (r.currentStamina <= 0) {
           r.currentStamina = 0;
           
           // MASSIVE NERF: Speed drops to 60% of Pace (Walking Speed)
           // Previously was 90%. This ensures they get overtaken instantly.
           targetSpeed = Math.min(targetSpeed, RACE_PACE * 0.60); 
           
           r.isSpurting = false;
           
           // Optional: Log the collapse if leading
           if (r.isLeading && !tempLogs.some(l => l.message.includes(r.uma.lastName) && l.message.includes("collapses"))) {
               tempLogs.push({ message: `🛑 ${r.uma.lastName} hits the wall!`, time: time });
           }
      }

      if (!r.skillTriggered && r.currentDist >= r.skillTriggerMeters && r.currentStamina > 50) {
         const chance = 0.70 + (r.stats.wisdom / 4000); 
         if (Math.random() < chance) {
             r.skillTriggered = true;
             if (!tempLogs.some(l => l.message.includes(r.uma.lastName) && l.message.includes("Ultimate"))) {
                 tempLogs.push({ message: `⚡ ${r.uma.lastName} activates Ultimate!`, time: time });
             }
         }
      }

      if (r.skillTriggered) {
          targetSpeed += 0.8;
      }

      const acceleration = (r.stats.power / 200) * (1 / FRAME_RATE); 
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
    uma: r.uma,
    rank: i + 1,
    time: parseFloat(r.finishTime.toFixed(2)),
    splits: [],
  }));

  const raceEndTime = Math.max(...results.map(r => r.time));

  const finalLog: LogEntry[] = tempLogs.map(l => ({
      message: l.message,
      timePct: l.time / raceEndTime
  }));

  finalLog.unshift({ message: getCommentary('start'), timePct: 0.0 });
  finalLog.push({ message: getCommentary('winnerAnnouncement', { winner: results[0].uma.lastName }), timePct: 1.0 });

  return { results, log: finalLog };
};