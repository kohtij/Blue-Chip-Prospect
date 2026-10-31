// How much a live-play moment is worth, and how hard it should be.
//
// Every minigame used to pay exactly the same whether it happened in a gold
// medal game or on a Tuesday in November, and only three of the twelve games
// got harder when the context was a final; the other nine played identically.
// This is the one place that decides both, so a shootout in the Stanley Cup
// Final and a shootout in a meaningless February game are not the same event.
//
//   rewardMulti - scales the fan status, rating and money a result is worth
//   difficulty  - 0 routine, 1 as hard as the game gets

const STAKES = {
  // Camp and the preseason. Low pressure, small reward.
  camp:      { label: 'TRAINING CAMP',      rewardMulti: 0.6, difficulty: 0.10 },
  preseason: { label: 'PRESEASON',          rewardMulti: 0.6, difficulty: 0.10 },

  // An ordinary moment inside a season.
  season:    { label: 'REGULAR SEASON',     rewardMulti: 0.8, difficulty: 0.20 },

  // Junior and club finals.
  memcup:    { label: 'MEMORIAL CUP',       rewardMulti: 1.8, difficulty: 0.65 },
  finals:    { label: 'STANLEY CUP FINAL',  rewardMulti: 3.5, difficulty: 0.95 },

  // International. The round matters far more than the tournament: a group game
  // and a gold medal game are nothing alike.
  wjc:       { label: 'WORLD JUNIORS',      rewardMulti: 1.1, difficulty: 0.35 },
  olympics:  { label: 'WINTER OLYMPICS',    rewardMulti: 1.4, difficulty: 0.45 },
  worlds:    { label: 'WORLD CHAMPIONSHIP', rewardMulti: 1.2, difficulty: 0.40 },
};

// Knockout rounds escalate on top of whichever tournament is being played.
// The keys match the stake names the tournament simulation produces, so a round
// is read straight off the player with no translation table in between.
const ROUNDS = {
  QUARTERFINAL: { suffix: 'QUARTER-FINAL',     rewardMulti: 1.7, difficulty: 0.60 },
  SEMIFINAL:    { suffix: 'SEMI-FINAL',        rewardMulti: 2.3, difficulty: 0.75 },
  BRONZE:       { suffix: 'BRONZE MEDAL GAME', rewardMulti: 2.6, difficulty: 0.80 },
  GOLD:         { suffix: 'GOLD MEDAL GAME',   rewardMulti: 3.5, difficulty: 0.95 },
  // Not glamorous, but losing it costs a nation its place in the division.
  SURVIVAL:     { suffix: 'RELEGATION GAME',   rewardMulti: 1.6, difficulty: 0.70 },
  PROMOTION:    { suffix: 'PROMOTION FINAL',   rewardMulti: 1.6, difficulty: 0.65 },
  CONSOLATION:  { suffix: 'PLACEMENT GAME',    rewardMulti: 1.0, difficulty: 0.45 },
};

const DEFAULT = { label: 'LIVE PLAY', rewardMulti: 1.0, difficulty: 0.30 };

// How much a tournament is worth in its own right. Olympic gold is the biggest
// thing in the sport; a World Juniors medal is won by teenagers and carries less.
export const PRESTIGE = { wjc: 0.7, worlds: 1.0, olympics: 1.35 };


// Who you are up against. Nations run from tier 1 (Canada, the United States)
// down to tier 4, and a quarter-final against Canada should not play like one
// against Latvia. Clubs pass no tier and are unaffected.
function opponentShift(tier) {
  if (!tier) return { reward: 1, difficulty: 0 };
  const t = Math.max(1, Math.min(4, tier));
  return { reward: 1 + (3 - t) * 0.08, difficulty: (3 - t) * 0.05 };
}

const INTL = ['wjc', 'olympics', 'worlds'];

export function getStakes(context, round = null, oppTier = null) {
  const base = STAKES[context] || DEFAULT;
  // The round and the opponent live on the player and are not cleared the moment
  // a tournament ends, so a career that won gold in December would otherwise
  // still be playing gold-medal difficulty in a February road game. Only an
  // international context is allowed to read them.
  const isIntl = INTL.includes(context);
  const step = isIntl && round ? ROUNDS[round] : null;
  const opp = opponentShift(isIntl ? oppTier : null);

  // The round sets the floor; a tournament already worth more keeps its value.
  const rewardMulti = step ? Math.max(base.rewardMulti, step.rewardMulti) : base.rewardMulti;
  const difficulty = step ? Math.max(base.difficulty, step.difficulty) : base.difficulty;

  return {
    key: step ? `${context || 'default'}:${round}` : (context || 'default'),
    label: step ? step.suffix : base.label,
    rewardMulti: Math.round(rewardMulti * opp.reward * 100) / 100,
    difficulty: Math.max(0, Math.min(1, difficulty + opp.difficulty))
  };
}

// Difficulty is applied to each game's own timings, not to the player's ratings.
//
// The first version of this dulled every rating by up to ten points before handing
// the player to the game. That was a blunt instrument, and it broke things: the
// games compute their windows from raw ratings with formulas that were never
// bounded, so feeding them a lower number than the designer ever tested could push
// a timing window to zero or past it. The deflection game's window was already
// negative at 50 physicality in a final, meaning no input could win it, and dulling
// ratings only pushed more players into that hole. A game should get the player's
// real ratings and a separate difficulty, and decide for itself what to tighten,
// with a floor it can never cross.
//
// easy is the value at difficulty 0, hard the value at difficulty 1.
export function lerpDifficulty(easy, hard, difficulty = 0) {
  const d = Math.max(0, Math.min(1, difficulty || 0));
  return easy + (hard - easy) * d;
}

// The shortest reaction window the game is ever allowed to give you. A simple
// visual reaction takes a person about 250ms, so anything under this is not a
// test of skill, it is a coin toss.
export const MIN_REACTION_MS = 320;

// Timing a moving marker is anticipated rather than reacted to, so it can be
// tighter than a cold reaction, but not by much.
export const MIN_TIMING_MS = 200;

// Scales a reward payout. Relationship changes are left alone: a coach does not
// think twice as much of you because the game was a final.
export function applyStakesToReward(payout, rewardMulti = 1) {
  if (!payout || rewardMulti === 1) return payout;
  const scale = (v) => (typeof v === 'number' ? Math.round(v * rewardMulti) : v);
  return {
    ...payout,
    fanStatus: scale(payout.fanStatus),
    money: scale(payout.money),
    ovr: payout.ovr
  };
}