// How a season's numbers come out, given a player who is this good.
//
// The engine used to answer that with `0.85 + Math.random() * 0.3`: a flat
// band, fifteen per cent either side, rolled separately for goals and for
// assists. Four thousand simulated seasons of one 92 OVR centre produced a
// median of 130 points with a fifth percentile of 105 and a ninety-fifth of
// 139. He never had a bad year and he never had a career year. He was a
// metronome, and a career sim whose seasons are interchangeable has no story
// in it.
//
// Three things live here, and the engine calls all three.

// Box-Muller. One standard normal per call, the second discarded, which is
// wasteful and completely invisible at this scale.
const gaussian = () => {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

// For the places that want plain symmetric noise, such as a save percentage,
// which is a bounded rate rather than a count and really is roughly symmetric.
export const gaussianNoise = gaussian;

// A multiplier whose median is 1 and whose tail runs to the upside. Scoring
// cannot go below zero and has no ceiling, so its distribution is not the
// symmetric band the old code assumed: there is a floor you approach and
// never reach, and a long thin tail where the career years live.
const logNormal = (sigma) => Math.exp(sigma * gaussian());

// SHARED is the part of a season that moves goals and assists together: the
// linemates, the ice time, the health, the system. IDIO is what moves one and
// not the other, which for goals is mostly shooting percentage.
//
// Rolling these separately matters. Two independent rolls on goals and assists
// partly cancel in the point total, which is why the old band came out even
// tighter on points than it looked on either half.
const SIGMA_SHARED = 0.185;
const SIGMA_IDIO = 0.125;

// A fourth-liner's rate is measured over far fewer events than a first-line
// centre's, so the same luck swings it further. Capped at both ends: this is a
// real effect, not a licence for a depth player to post eighty.
const sampleScale = (games) => Math.min(1.35, Math.max(0.88, Math.sqrt(58 / Math.max(20, games || 58))));

/**
 * One season's luck, as multipliers to apply to the raw goal and assist rates.
 * Call once per season per player, not once per category.
 */
export function seasonForm(games) {
  const scale = sampleScale(games);
  const shared = logNormal(SIGMA_SHARED * scale);
  return {
    goals: shared * logNormal(SIGMA_IDIO * scale),
    assists: shared * logNormal(SIGMA_IDIO * scale)
  };
}

// How age moves production, over and above what it does to the ratings.
//
// The ratings already decay: skating, stamina and physicality from 31, and
// shooting and hockey IQ only from 33, slowly. Those last two are the ones
// scoring is built on, so a player who kept training produced at thirty-nine
// exactly as he had at twenty-four. Measured over four thousand seasons at a
// fixed 86 OVR, the medians at ages 20, 24, 28, 32, 36 and 39 were 110, 110,
// 112, 111, 110 and 111. There was no career arc at all.
//
// This curve is deliberately gentler than the real decline, because it is not
// doing the job alone. The ratings carry the rest.
const SENIOR_AGE = {
  17: 0.78, 18: 0.82, 19: 0.86, 20: 0.90, 21: 0.93, 22: 0.96, 23: 0.98,
  24: 1.00, 25: 1.00, 26: 1.00, 27: 1.00, 28: 1.00,
  29: 0.99, 30: 0.97, 31: 0.95, 32: 0.93, 33: 0.90, 34: 0.87, 35: 0.84,
  36: 0.80, 37: 0.76, 38: 0.72, 39: 0.68, 40: 0.64
};

// Junior and college run the other way. These leagues are age-capped, so being
// old in them is an advantage rather than a sign of decline: a twenty-year-old
// in the OHL is a man among boys, and a freshman is the one out of his depth.
const JUNIOR_AGE = {
  15: 0.62, 16: 0.74, 17: 0.86, 18: 0.95, 19: 1.05, 20: 1.12,
  21: 1.15, 22: 1.17, 23: 1.18, 24: 1.18
};

/**
 * Production multiplier for a player of this age in this kind of league.
 */
export function ageFactor(age, isAgeCapped) {
  const table = isAgeCapped ? JUNIOR_AGE : SENIOR_AGE;
  const keys = Object.keys(table).map(Number);
  const lo = Math.min(...keys), hi = Math.max(...keys);
  if (age <= lo) return table[lo];
  if (age >= hi) {
    // Past the end of the table a senior career keeps sliding; nobody is in a
    // junior league at this age, so it simply holds.
    return isAgeCapped ? table[hi] : Math.max(0.42, table[hi] - (age - hi) * 0.04);
  }
  return table[age] ?? 1.0;
}

// Goalies do not scale the way skaters do: a save percentage is a rate between
// 0.85 and 0.94, not a count, so age moves it by points rather than by a
// multiplier. They also peak later and hold it longer.
export function goalieAgeAdjust(age) {
  if (age <= 20) return -0.008;
  if (age <= 22) return -0.005;
  if (age <= 24) return -0.002;
  if (age <= 33) return 0;
  if (age <= 35) return -0.003;
  if (age <= 37) return -0.006;
  if (age <= 39) return -0.010;
  return -0.014;
}

/**
 * A ceiling you approach and never quite reach.
 *
 * The old cap was a straight knee: everything above 55 goals was flattened to
 * `55 + (x - 55) * 0.35`. Because the elite case sat right on top of it, the
 * knee was doing the work of the whole distribution and the result was a
 * median of exactly 55 goals with a maximum of 60. A flat line, not a tail.
 *
 * This is smooth all the way up. Nothing is clipped, each extra goal of talent
 * is worth slightly less than the last, and the asymptote is a number no
 * season reaches but a great one can get close to.
 */
export function soften(x, soft, hard) {
  if (x <= soft) return x;
  const room = hard - soft;
  return soft + room * (1 - Math.exp(-(x - soft) / room));
}

// Where the compression starts and where it tops out, per category and per
// kind of league. The soft point is "a very good season", the hard point is
// the number the engine will never quite print.
//
// Three environments, not two. Junior scoring runs high, a hundred-point year
// in the OHL being ordinary for a prospect worth drafting. The AHL and the
// European leagues run the other way: the AHL's scoring title is usually in
// the seventies and the SHL's in the fifties, so handing them the NHL's
// ceiling, let alone junior's, would be backwards.
const CURVES = {
  nhl: { goals: { soft: 34, hard: 62 }, assists: { soft: 46, hard: 85 } },
  junior: { goals: { soft: 40, hard: 72 }, assists: { soft: 54, hard: 94 } },
  minor: { goals: { soft: 28, hard: 52 }, assists: { soft: 38, hard: 70 } }
};

const JUNIOR_ENV = ['OHL', 'WHL', 'QMJHL', 'USHL', 'J20', 'U20', 'NCAA'];

export function curvesFor(league) {
  if (league === 'NHL') return CURVES.nhl;
  if (JUNIOR_ENV.includes(league)) return CURVES.junior;
  return CURVES.minor;
}

// What a season is worth, per league.
//
// `par` is an ordinary regular's rate, worth a 5.0. `star` is a season the
// league notices, worth an 8.5. Everything else is drawn between and beyond
// those two points.
//
// This table exists because the old rating formula was league-blind:
// `5 + (g + a + pm * 0.5) / games * 5`, applied to the NHL and the OHL alike.
// A point a game is a fine NHL season and an unremarkable one in junior, and
// the formula scored both the same, then clipped at 10. Measured over two
// thousand seasons, a 68 OVR seventeen-year-old in the OHL averaged 9.62 and
// cleared the top progression tier in 93 per cent of years; a 72 OVR
// nineteen-year-old averaged a flat 10.00 and cleared it in 100 per cent.
// Development was not a thing that could go badly.
// svStar sat twenty-one points of save percentage above svPar, which made a
// .925 the bar for a season the league notices. In this engine's own output an
// 88 OVR starter's median year was a .934 and a 96 OVR's was a .944, with the
// top decile clipped flat against the .945 ceiling: the best save percentage
// ever recorded in an NHL season is a .937, so every elite goalie here was
// posting a historic year, every year, and the Vezina bar was sitting in the
// middle of that. The save percentage curve itself is fixed in gameHelpers;
// these two move with it. A .904 is an ordinary starter's season and a .915 is
// one the league notices, which is what those numbers mean in life.
const PACE = {
  NHL: { par: 0.46, star: 1.00, svPar: 0.904, svStar: 0.915 },
  AHL: { par: 0.46, star: 0.95, svPar: 0.901, svStar: 0.912 },
  OHL: { par: 0.78, star: 1.55, svPar: 0.896, svStar: 0.907 },
  WHL: { par: 0.78, star: 1.55, svPar: 0.896, svStar: 0.907 },
  QMJHL: { par: 0.82, star: 1.62, svPar: 0.893, svStar: 0.904 },
  USHL: { par: 0.70, star: 1.40, svPar: 0.898, svStar: 0.909 },
  NCAA: { par: 0.60, star: 1.25, svPar: 0.905, svStar: 0.916 },
  J20: { par: 0.78, star: 1.52, svPar: 0.896, svStar: 0.907 },
  U20: { par: 0.76, star: 1.48, svPar: 0.896, svStar: 0.907 },
  ECHL: { par: 0.52, star: 1.05, svPar: 0.900, svStar: 0.911 }
};

// Everything else is a European senior league: lower event totals than the
// NHL, and a scoring title in the fifties rather than the hundreds.
const PACE_EURO = { par: 0.42, star: 0.88, svPar: 0.908, svStar: 0.919 };

export const paceOf = (league) => PACE[league] || PACE_EURO;

export const isDefence = (pos) => pos === 'LD' || pos === 'RD';

// A DEFENCEMAN IS NOT A FORWARD WHO SCORES LESS.
//
// par and star in the table above are a forward's rates, and every skater was
// graded on them. A defenceman was therefore told every spring that he had
// come up short at a job that was never his. Measured over six hundred
// seasons, an 88 OVR top-pair defenceman averaged a 9.01 where the same player
// at centre averaged 9.88, and took the league MVP in 1.3 per cent of his
// seasons against 25.8. A shutdown pair was worse off again, because points
// were the only thing the grade could see. An ordinary NHL defenceman scores
// about 25 points in a season and a Norris-calibre one about 57, so those are
// the two points his year is drawn between instead.
// par is an ordinary NHL defenceman, about 26 points in a season. star is what
// a top-pair defenceman in this engine actually produces, which is a point a
// game: fitted to the engine's own output rather than to real hockey, because
// the defencemen here score more relative to the forwards than they do in life
// and a grade keyed to reality would have punished all of them for it.
const POS_PACE = { par: 0.70, star: 1.00 };

// The two halves of the grade, and the points the defensive half is drawn
// between. Fitted over five hundred seasons per archetype against a target
// curve: an ordinary regular at 5, a top-pair season at 9, a seventh
// defenceman under 4.
const D_WEIGHT = { off: 1.9, def: 2.2 };
const D_SHIELD_PAR = 0.40;  // plus-minus per game that maxes the defensive half
const D_TOI_MID = 20.5;     // minutes at which a defenceman is neither trusted nor buried
const D_TOI_SPAN = 4.5;

/**
 * The half of a defenceman's season that is not on the scoresheet.
 *
 * A goalie has a save percentage, which is why his year can be judged without
 * reference to anyone's points. A defenceman's equivalent has to be built from
 * what the engine actually simulates: the goal difference he was on the ice
 * for, and the minutes the staff gave him, which is the coaching verdict on
 * his defending and the nearest thing here to an eye test.
 *
 * Roughly -1 for a liability, +1 for the best defensive year in the league.
 */
export function defensiveHalf(pmPerGame, toi) {
  const shield = Math.max(-1, Math.min(1, (pmPerGame || 0) / D_SHIELD_PAR));
  const minutes = Math.max(-1, Math.min(1, ((toi ?? D_TOI_MID) - D_TOI_MID) / D_TOI_SPAN));
  return shield * 0.62 + minutes * 0.38;
}

/**
 * A season graded against the league it was played in, on the same 1 to 10
 * scale the rest of the game already uses.
 */
export function rateSeason({ league, pos, games, g, a, pm, saves, shots, toi }) {
  if (!games) return 5.0;
  const pace = paceOf(league);

  if (pos === 'G') {
    if (!shots) return 5.0;
    const sv = saves / shots;
    const r = 5 + ((sv - pace.svPar) / (pace.svStar - pace.svPar)) * 3.5;
    return Math.min(10, Math.max(1, Number(r.toFixed(1))));
  }

  const ppg = (g + a) / games;
  const pmPerGame = (pm || 0) / games;

  // Two halves, either of which can carry him, because both halves are the
  // job: a defenceman who scores like Makar grades out on the first, one who
  // defends like Hedman on the second.
  if (isDefence(pos)) {
    const par = pace.par * POS_PACE.par;
    const star = pace.star * POS_PACE.star;
    const off = (ppg - par) / (star - par);
    const r = 5 + off * D_WEIGHT.off + defensiveHalf(pmPerGame, toi) * D_WEIGHT.def;
    return Math.min(10, Math.max(1, Number(r.toFixed(1))));
  }

  // Plus-minus still counts for a forward, but as a tiebreaker rather than a
  // third of the grade: a plus-20 season is worth about half a point of rating.
  const r = 5 + ((ppg - pace.par) / (pace.star - pace.par)) * 3.5 + pmPerGame * 2.0;
  return Math.min(10, Math.max(1, Number(r.toFixed(1))));
}

// WHAT A ROLE ACTUALLY BUYS, WHICH IS MINUTES.
//
// The engine worked out an average time on ice every season, printed it on the
// recap, and then produced the season from a separate role multiplier that
// never once looked at it. Ice time was a label sitting next to a number it
// had no connection to, which is why an 88 OVR centre on a depth contract
// played 17.3 minutes and posted a median of 79 points: a third-line scoring
// total that would have finished seventh in the league.
//
// These are the minutes each tier really plays. Even strength and powerplay
// are kept apart because a powerplay point comes at better than twice the
// even-strength rate, and the top unit is most of what a first-liner's edge
// actually is.
const ROLE_ICE = [
  [1.18, 17.6, 3.0],  // 1st line, 1st pair
  [0.98, 15.8, 1.7],  // 2nd line, top four
  [0.76, 13.2, 0.5],  // 3rd line, 3rd pair
  [0.00, 9.4, 0.0]    // 4th line, 7th D
];

// A defenceman plays more of the game than a forward in the same tier: a
// first-pair defenceman is out for twenty-three minutes where a first-line
// centre is out for eighteen.
const D_SHIFT = 1.26;

// A powerplay minute against an even-strength one, for scoring purposes.
const PP_WEIGHT = 2.4;

// The weighted minutes of a first-tier player, per position, so a first liner
// comes out of this at the multiplier he already had and the change moves only
// what the lesser roles are worth.
const ICE_REF = {
  F: 17.6 + 3.0 * PP_WEIGHT,
  D: 17.6 * D_SHIFT + 3.0 * PP_WEIGHT
};

/**
 * Minutes, and what those minutes are worth.
 *
 * `even`, `pp` and `toi` are the real split, for the recap to print. `factor`
 * is the production multiplier, normalised so a first-tier player sits at the
 * 1.27 the old role multiplier gave him.
 */
export function iceTime({ roleMulti, pos, coachTrust = 50, stamina = 50 }) {
  const group = isDefence(pos) ? 'D' : 'F';
  const tier = ROLE_ICE.find(([floor]) => roleMulti >= floor) || ROLE_ICE[ROLE_ICE.length - 1];
  const shift = group === 'D' ? D_SHIFT : 1;

  // Trust earns third-period shifts and a place on a unit, stamina earns the
  // right to keep them. Both move him inside his tier, never out of it.
  const trustMod = ((coachTrust - 50) / 50) * 1.9;
  const staminaMod = ((stamina - 50) / 50) * 1.4;

  const even = Math.max(6.0, Math.min(26.0, tier[1] * shift + trustMod + staminaMod));
  // A coach who does not trust him does not put him out a man up, which is the
  // first thing to go and the one that costs the most.
  const pp = tier[2] * Math.max(0.35, Math.min(1.25, 0.55 + (coachTrust / 100) * 0.9));
  const weighted = even + pp * PP_WEIGHT;

  // Capped at the 1.27 a first-tier player had before, so this change can only
  // ever take production away from a lesser role and never hand any to a top
  // one. Without the cap a high-stamina star gained minutes he had not been
  // getting, and the league's scoring title went from 17.5 per cent of an 88
  // OVR centre's seasons to 27.8, which is not what was being fixed here.
  return { even, pp, toi: even + pp, factor: Math.min(1.27, (weighted / ICE_REF[group]) * 1.27) };
}

/**
 * What it took to lead this league in scoring this year, when nobody in the
 * known field did anything notable. Drawn, not fixed, so the bar moves from
 * season to season the way it does in life.
 */
export function drawLeagueBest(league) {
  const table = {
    NHL: [116, 12], AHL: [82, 8], OHL: [112, 11], WHL: [112, 11], QMJHL: [118, 12],
    USHL: [74, 8], NCAA: [56, 7], J20: [78, 9], U20: [76, 9], ECHL: [78, 8]
  };
  const [mean, sd] = table[league] || [58, 7];
  return Math.round(mean + gaussian() * sd);
}

/**
 * What it took to lead this league in save percentage this year.
 *
 * The goalie half of drawLeagueBest, which did not exist. A forward's trophies
 * were a contest against a drawn bar that moves from season to season, and a
 * goalie's were a fixed threshold he either cleared or did not: the Vezina was
 * "a .925 in thirty-eight games", full stop, so an 88 OVR starter took it in
 * 84 per cent of his seasons and a 94 OVR in 97. There was no field to lose to.
 * Nine points above the bar for a season the league notices, which puts the
 * NHL's leader in the mid twenties most years and occasionally past .930.
 */
export function drawLeagueBestSv(league) {
  const pace = paceOf(league);
  // Fourteen points above a season the league notices, fitted so that an 88
  // OVR starter takes the Vezina at the rate an 88 OVR centre takes the Art
  // Ross. At nine it was still 37 per cent against their 22.
  return pace.svStar + 0.014 + gaussian() * 0.004;
}

/**
 * How good the best defenceman in the league was this year, as a graded
 * season.
 *
 * The last trophy in the game still decided by a fixed threshold. A threshold
 * makes the whole of the outcome depend on the player's own variance, because
 * the thing he is measured against has none, and that is why the Norris curve
 * would not sit on the Art Ross curve at any value: at 9.30 it fired in 21 per
 * cent of seasons at 88 OVR and 67 at 94, against a scoring title's 21 and 42,
 * and tightening it to fit the top end dropped the 88 to 11. Giving the bar
 * its own spread flattens the curve, which is the whole reason the skaters'
 * trophies behave and this one did not.
 *
 * rateSeason is already normalised for the league it graded, so unlike the
 * scoring and save-percentage bars this one needs no table.
 */
export function drawLeagueBestDman() {
  return 9.61 + gaussian() * 0.69;
}
