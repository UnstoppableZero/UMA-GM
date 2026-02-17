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

// --- PHYSICS TUNING v14 (THE "INVISIBLE RAIL") ---
// We force everyone to run at this pace for 70% of the race.
// 16.5 m/s = ~2:25.0 for 2400m (Realistic G1 Pace)
const RACE_PACE = 16.5; 

// The maximum extra speed a 1200 Speed/Power horse can generate in the final sprint.
// +1.5 m/s means top speed is 18.0 m/s. 
// A 400 stat horse gets +0.5 m/s (17.0 m/s).
// gap over final 600m = ~2.0 seconds. PERFECT.
const MAX_SPRINT_BONUS = 1.5;

const SKILL_BONUS = 3.5; 
const STAMINA_DRAIN_RATE = 0.40; 
const DRAFTING_BONUS = 0.90; 

// Helper to determine natural strategy
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
    // Initial Stamina Setup
    const stamina = uma.stats.stamina;

    // Use Natural Aptitude for Strategy
    // @ts-ignore
    const strategy = getBestStrategy(uma.aptitude);

    // Ultimate Trigger Calculation
    let baseTriggerDist = distance - 600; 
    if (distance <= 1400) baseTriggerDist = distance - 400; 
    
    // Strategy offsets for ult trigger
    let stratOffset = 0;
    if (strategy === 'runner') stratOffset = -150;     
    else if (strategy === 'leader') stratOffset = -50; 
    else if (strategy === 'betweener') stratOffset = 100; 
    else if (strategy === 'chaser') stratOffset = 300; 

    // Tiny noise
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
      stats: uma.stats
    };
  });

  let time = 0;
  let finishedCount = 0;
  const tempLogs: { message: string, time: number }[] = [];
  let hasannouncedMid = false;
  let hasAnnouncedFinal = false;
  let leaderId = "";
  let leaderDist = 0;

  // Initial Log
  tempLogs.push({ message: getCommentary('start'), time: 0.1 });

  // 2. Main Loop
  while (finishedCount < racers.length) {
    time += (1 / FRAME_RATE);
    if (time > 600) break; // Safety break

    // Sort to find Leader
    const currentStandings = [...racers].sort((a, b) => b.currentDist - a.currentDist);
    const leader = currentStandings[0];
    leaderDist = leader.currentDist;
    
    // Commentary Triggers
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
      let isDrafting = false;

      // ==========================================================
      // PHASE 1: THE INVISIBLE RAIL (0% - 70%)
      // ==========================================================
      // Everyone is locked to RACE_PACE. 
      // Speed stats are IGNORED here to prevent blowouts.
      if (progress < 0.70) {
          
          // 1. Establish Position Target relative to Leader
          let targetGap = 0;
          if (r.strategy === 'runner') targetGap = 0;       // Front
          else if (r.strategy === 'leader') targetGap = 4;   // 4m back (approx 1.5 lengths)
          else if (r.strategy === 'betweener') targetGap = 8; // 8m back
          else if (r.strategy === 'chaser') targetGap = 12;  // 12m back (approx 5 lengths)
          
          const myGap = leaderDist - r.currentDist;
          const gapDelta = myGap - targetGap;

          // 2. Base Speed is strict RACE_PACE
          targetSpeed = RACE_PACE;

          // 3. Rubber Band Physics (The "Glue")
          if (gapDelta > 2) { 
             // We are falling behind our assigned slot -> Speed Up
             targetSpeed *= 1.04; 
             isDrafting = true;
          } else if (gapDelta < -1) {
             // We are ahead of our assigned slot -> Slow Down
             // (Unless we are the actual leader)
             if (r.uma.id !== leader.uma.id) {
                 targetSpeed *= 0.96;
             }
          }

          // Runner Logic: Slightly faster bias to ensure they are the ones setting 'leaderDist'
          if (r.strategy === 'runner') {
              targetSpeed += 0.1;
          }
      } 
      
      // ==========================================================
      // PHASE 2: THE RELEASE (70% - 100%)
      // ==========================================================
      // The Rail is gone. Stats decide the winner now.
      else {
          const distRemaining = distance - r.currentDist;
          
          // 1. Calculate Max Potential Speed based on Stats
          // Formula: Base + (Speed/1200 * Bonus) + (Power/1200 * Bonus)
          const speedBonus = (r.stats.speed / 1200) * (MAX_SPRINT_BONUS * 0.7);
          const powerBonus = (r.stats.power / 1200) * (MAX_SPRINT_BONUS * 0.3);
          
          targetSpeed = RACE_PACE + speedBonus + powerBonus;

          // 2. Check Stamina for Sprint
          const sprintCostPerMeter = 0.6; // Lowered cost
          const canSprint = r.currentStamina > (distRemaining * sprintCostPerMeter);

          let spurtThreshold = 0.70; 
          if (r.stats.stamina > 600) spurtThreshold = 0.65; // Early burst
          if (r.stats.stamina < 450) spurtThreshold = 0.75; // Late burst

          if (progress > spurtThreshold && canSprint) {
             r.isSpurting = true;
          } else {
             r.isSpurting = false; 
          }

          if (r.isSpurting) {
             // Burst Speed
             targetSpeed += 0.5; // Flat burst bonus
             
             // Strategy Closing Speed
             if (r.strategy === 'chaser') targetSpeed += 0.3; 
             else if (r.strategy === 'betweener') targetSpeed += 0.15;
             
             r.currentStamina -= 1.0; 
          }
      }

      // ==========================================================
      // MODIFIERS
      // ==========================================================

      // Soft Wall (Stamina Depletion)
      // If empty, cap speed at 95% of Race Pace. No walking.
      if (r.currentStamina <= 0) {
           r.currentStamina = 0;
           targetSpeed = Math.min(targetSpeed, RACE_PACE * 0.95);
           r.isSpurting = false;
      }

      // Ultimate Skill
      if (!r.skillTriggered && r.currentDist >= r.skillTriggerMeters && r.currentStamina > 50) {
         const chance = 0.70 + (r.stats.wisdom / 4000); 
         if (Math.random() < chance) {
             r.skillTriggered = true;
         }
      }

      if (r.skillTriggered) {
          // Skill adds flat m/s
          targetSpeed += 0.8;
      }

      // Acceleration Smoothing
      const acceleration = (r.stats.power / 200) * (1 / FRAME_RATE); 
      if (r.currentSpeed < targetSpeed) {
         r.currentSpeed = Math.min(targetSpeed, r.currentSpeed + acceleration);
      } else {
         r.currentSpeed = Math.max(targetSpeed, r.currentSpeed - (acceleration * 0.5));
      }

      r.currentDist += r.currentSpeed * (1 / FRAME_RATE);
      
      // Stamina Drain
      const distMod = distance > 2400 ? 0.8 : 1.0;
      let drain = STAMINA_DRAIN_RATE * distMod * (1 / FRAME_RATE);
      if (r.isSpurting) drain *= 1.5; // Sprinting burns more
      if (isDrafting) drain *= DRAFTING_BONUS;

      r.currentStamina -= drain;

      // Log Ultimate
      if (r.skillTriggered && !tempLogs.some(l => l.message.includes(r.uma.lastName) && l.message.includes("Ultimate"))) {
          tempLogs.push({ 
             message: `⚡ ${r.uma.lastName} activates Ultimate!`, 
             time: time 
          });
      }

      if (r.currentDist >= distance) {
        r.finished = true;
        r.finishTime = time;
        finishedCount++;
      }
    });
  }

  // 3. Finalize
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

  finalLog.unshift({ 
      message: getCommentary('start'), 
      timePct: 0.0 
  });
  
  finalLog.push({ 
      message: getCommentary('winnerAnnouncement', { winner: results[0].uma.lastName }), 
      timePct: 1.0 
  });

  return { results, log: finalLog };
};