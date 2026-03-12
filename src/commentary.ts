// src/commentary.ts

export const COMMENTARY_POOL = {
  start: [
    "🏁 And they're off! A beautiful start at the track!",
    "🏁 The gates fly open! We are underway!",
    "🏁 They break cleanly! No issues at the start!"
  ],
  badStart: [
    "⚠️ {name} stumbled out of the gate!",
    "⚠️ {name} missed the jump and is dead last!"
  ],
  split1000mFast: [
    "⏱️ 1000m passed in a blistering {time}s! This is a suicidal pace for the leaders!",
    "⏱️ {time}s for the first 1000m! They are flying out there! The closers will love this!"
  ],
  split1000mSlow: [
    "⏱️ A very tactical crawl through 1000m in {time}s. The front-runners are saving all their energy.",
    "⏱️ {time}s through 1000m. It's a slow pace! This is going to come down to pure acceleration!"
  ],
  split1000mNormal: [
    "⏱️ 1000m crossed in {time}s. A steady, honest pace so far.",
    "⏱️ {time}s at the 1000m mark. The race is unfolding exactly as expected."
  ],
  midRace: [
    "🐎 The pack is tightening up as they approach the bend.",
    "🐎 They are jockeying for position in the middle of the pack."
  ],
  leader: [
    "🔥 {name} leads the way comfortably.",
    "🔥 {name} is commanding the front of the pack."
  ],
  chaser: [
    "👀 Watch out for {name}, they are moving up the outside!",
    "👀 {name} is making a big move on the rail!"
  ],
  zoneEntered: [
    "⚡ INCREDIBLE! {name} HAS ENTERED THE ZONE! They are in a state of absolute flow!",
    "⚡ THE AURA! {name} IS IN THE ZONE! Look at that turn of foot!"
  ],
  finalStraight: [
    "⚡ HERE THEY COME! The final straight!",
    "⚡ Into the final 200m! It's anyone's race!"
  ],
  winnerAnnouncement: [
    "🏆 {winner} crosses the line first!",
    "🏆 What a victory for {winner}!"
  ]
};

export function getCommentary(type: keyof typeof COMMENTARY_POOL, context?: { name?: string, winner?: string, time?: string }) {
  const lines = COMMENTARY_POOL[type];
  let line = lines[Math.floor(Math.random() * lines.length)];
  
  if (context) {
    if (context.name) line = line.replace("{name}", context.name);
    if (context.winner) line = line.replace("{winner}", context.winner);
    if (context.time) line = line.replace("{time}", context.time);
  }
  return line;
}