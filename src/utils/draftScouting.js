// What NHL clubs think of you on draft day.
//
// The old version sorted every prospect into one of four buckets and, for anyone
// who missed the lowest cut, rolled a uniform random round between 2 and 7. That
// had three consequences. A single point of OVR either side of a threshold swung
// the median pick by a hundred places. Below the bottom cut there was no gradient
// at all, so a 63-rated prospect with a good junior career and a 40-rated one who
// never played drew from exactly the same lottery. And because a two-season junior
// forward reaches about 58-60 OVR while the lowest cut sat at 64, almost every
// career fell into that lottery: first-round picks fired under 3% of the time.
//
// This is a continuous scouting score instead. Everything a scout would actually
// look at contributes, nothing is a cliff, and the draft slot follows from the
// score. Two careers that differ slightly are drafted slightly apart.

export const PICKS_PER_ROUND = 32;
export const DRAFT_ROUNDS = 7;
export const LAST_PICK = PICKS_PER_ROUND * DRAFT_ROUNDS; // 224

const clamp01 = (v) => Math.max(0, Math.min(1, v));

// How much each part of the file can be worth. They total roughly 100 before the
// combine and the scouts' own uncertainty are added.
const MAX_ABILITY    = 52; // raw ability, the spine of any ranking
const MAX_PRODUCTION = 20; // what you did on the ice, per game rather than in total
const MAX_VOLUME     = 6;  // durability and a body of work to judge
const MAX_HONOURS    = 12; // trophies, titles and international medals

// The combine is four events worth -1 to +2 each, so a raw score of -4 to +8.
// It used to collapse into +3 / +1 / 0 / -2 OVR, which on a scale where the first
// cut was 64 meant it barely registered. It now carries real weight, around a
// round and a half of movement for a mid-range prospect, without being able to
// turn a fourth-liner into a first-overall pick: the curve below is steep at the
// top, so the closer you already are to the top of the board, the less any single
// week in June can move you.
const COMBINE_BEST = 16;
const COMBINE_WORST = -8;
const COMBINE_MAX_RAW = 8;
const COMBINE_MIN_RAW = -4;

// Scouting is not precise. Two clubs rank the same player differently.
const SCOUT_NOISE = 5;

// Points per game a scout would call a top prospect's season, by position.
const ELITE_PPG = { C: 1.5, LW: 1.5, RW: 1.5, LD: 1.0, RD: 1.0 };

function productionScore(player) {
  const s = player.stats?.chl || {};
  const games = s.games || 0;
  if (games < 5) return 0;

  if (player.pos === 'G') {
    // A goalie is judged on save percentage, not points.
    const shots = s.shots || 0;
    if (shots < 100) return 0;
    const savePct = (s.saves || 0) / shots;
    return clamp01((savePct - 0.880) / 0.060) * MAX_PRODUCTION;
  }

  const ppg = ((s.goals || 0) + (s.assists || 0)) / games;
  const elite = ELITE_PPG[player.pos] || 1.3;
  return clamp01(ppg / elite) * MAX_PRODUCTION;
}

function honoursScore(player) {
  const history = player.seasonHistory || [];
  const awards = [
    ...(player.stats?.awards || []),
    ...history.flatMap(s => s.awards || [])
  ];

  let pts = 0;
  for (const a of awards) {
    if (/Memorial Cup|National Championship|Championship/i.test(a)) pts += 4;
    else if (/Gold/i.test(a)) pts += 4;
    else if (/Silver|Bronze/i.test(a)) pts += 2;
    else pts += 2; // a league or individual trophy
  }
  // Winning your league counts even when it was not recorded as a named award.
  pts += history.filter(s => s.titleWon).length * 3;

  return Math.min(MAX_HONOURS, pts);
}

export function combineScore(raw = 0) {
  if (raw >= 0) return (Math.min(raw, COMBINE_MAX_RAW) / COMBINE_MAX_RAW) * COMBINE_BEST;
  return (Math.max(raw, COMBINE_MIN_RAW) / Math.abs(COMBINE_MIN_RAW)) * Math.abs(COMBINE_WORST);
}

/**
 * The full scouting file. `rawCombine` is the combine's own -4..+8 score.
 * Pass applyNoise false for a deterministic read, which is what the UI uses to
 * show a projection before the draft actually happens.
 */
export function computeScoutingScore(player, rawCombine = 0, applyNoise = true) {
  const ability = clamp01(((player.ovr || 50) - 46) / 32) * MAX_ABILITY;
  const production = productionScore(player);
  const games = player.stats?.chl?.games || 0;
  const volume = clamp01(games / 120) * MAX_VOLUME;
  const honours = honoursScore(player);
  const combine = combineScore(rawCombine);

  const noise = applyNoise ? (Math.random() * 2 - 1) * SCOUT_NOISE : 0;

  const total = ability + production + volume + honours + combine + noise;

  return {
    score: total,
    parts: { ability, production, volume, honours, combine, noise }
  };
}

/**
 * Where that score puts you on the board.
 *
 * The curve is steep at the top because the top of a draft is crowded: the gap
 * between the best prospect in the world and the tenth best is small in talent
 * and large in draft position, while the gap between the 150th and the 180th is
 * the reverse.
 */
export function projectDraftPick(player, rawCombine = 0, applyNoise = true) {
  const { score, parts } = computeScoutingScore(player, rawCombine, applyNoise);

  const t = clamp01(score / 100);
  let pick = Math.round(1 + (LAST_PICK - 1) * Math.pow(1 - t, 2.2));

  // draftBonus is carried on the player in draft slots, positive meaning a club
  // likes what it sees. The over-ager penalty and the Russian Factor decision both
  // write it, and nothing ever read it, so neither had any effect at all.
  pick -= (player.draftBonus || 0);

  pick = Math.max(1, Math.min(LAST_PICK, pick));
  const round = Math.min(DRAFT_ROUNDS, Math.ceil(pick / PICKS_PER_ROUND));

  return { pick, round, score, parts };
}