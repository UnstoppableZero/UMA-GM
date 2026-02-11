// src/commentary.ts

export const COMMENTARY_POOL = {
  start: [
    "🏁 And they're off! A beautiful start at the track!",
    "🏁 The gates fly open! We are underway!",
    "🏁 They break cleanly! No issues at the start!",
    "🏁 Start! The crowd roars as the gates open!",
    "🏁 The flags wave and the race is ON!",
  ],
  badStart: [
    "⚠️ {name} stumbled out of the gate!",
    "⚠️ {name} is slow to start! That will cost them!",
    "⚠️ A terrible start for {name}, they are trailing early.",
    "⚠️ {name} missed the jump and is dead last!",
  ],
  midRace: [
    "🐎 The pack is tightening up as they approach the bend.",
    "🐎 It's a tactical pace so far, nobody wants to burn out.",
    "🐎 They are jockeying for position in the middle of the pack.",
    "🐎 The pace is increasing! The tension is building!",
    "🐎 Passing the halfway mark, stamina will be key now.",
  ],
  leader: [
    "🔥 {name} is setting a blistering pace!",
    "🔥 {name} leads the way comfortably.",
    "🔥 {name} wants to run away with it early!",
    "🔥 {name} is commanding the front of the pack.",
  ],
  chaser: [
    "👀 {name} is lurking dangerously in the pack.",
    "👀 Watch out for {name}, they are moving up the outside!",
    "👀 {name} is looking for a gap in traffic.",
    "👀 {name} is making a big move on the rail!",
  ],
  finalStraight: [
    "⚡ HERE THEY COME! The final straight!",
    "⚡ It's time to sprint! Who has the legs?!",
    "⚡ The whip is out! It's a dash for the line!",
    "⚡ Into the final 200m! It's anyone's race!",
  ],
  neckAndNeck: [
    "⚔️ IT'S A BATTLE! {winner} vs {second}!",
    "⚔️ THEY ARE GOING BLOW FOR BLOW!",
    "⚔️ TOO CLOSE TO CALL! LOOK AT THEM GO!",
    "⚔️ NOBODY WANTS TO GIVE AN INCH!",
  ],
  holdOff: [
    "🔥 {winner} is holding on for dear life!",
    "🔥 {winner} refuses to let {second} pass!",
    "🔥 It's going to be close, but {winner} has the edge!",
  ],
  easyWin: [
    "🚀 {winner} is in a league of their own!",
    "🚀 DOMINATION! {winner} is crushing the field!",
    "🚀 No contest today! {winner} runs away with it!",
    "🚀 A masterclass performance from {winner}!",
  ],
  winnerAnnouncement: [
    "🏆 {winner} crosses the line first!",
    "🏆 {winner} takes the gold!",
    "🏆 What a victory for {winner}!",
    "🏆 The crowd chants their name! {winner} wins!",
  ]
};

export function getCommentary(type: keyof typeof COMMENTARY_POOL, context?: { name?: string, winner?: string, second?: string }) {
  const lines = COMMENTARY_POOL[type];
  let line = lines[Math.floor(Math.random() * lines.length)];
  
  if (context) {
    if (context.name) line = line.replace("{name}", context.name);
    if (context.winner) line = line.replace("{winner}", context.winner);
    if (context.second) line = line.replace("{second}", context.second);
  }
  
  return line;
}