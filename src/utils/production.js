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
// partly cancel in the point total, so the old band came out tighter on points
// than it looked on either half.
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
 * median of exactly 55 goals with a maximum of 60: a flat line where there
 * should be a tail.
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

// The under-20 programmes outside Sweden and Finland are in here too now.
// Before, a sixteen-year-old Czech or Russian was placed straight into his
// country's men's league, so there was no junior environment for him to be
// in and nothing to add to this list.
const JUNIOR_ENV = ['OHL', 'WHL', 'QMJHL', 'USHL', 'J20', 'U20', 'NCAA',
  'MHL', 'CZE20', 'SVK20', 'SUI20', 'DNL'];

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
// Development could not go badly.
// svStar sat twenty-one points of save percentage above svPar, which made a
// .925 the bar for a season the league notices. In this engine's own output an
// 88 OVR starter's median year was a .934 and a 96 OVR's was a .944, with the
// top decile clipped flat against the .945 ceiling: the best save percentage
// ever recorded in an NHL season is a .937, so every elite goalie here was
// posting a historic year, every year, and the Vezina bar was sitting in the
// middle of that. The save percentage curve itself is fixed in gameHelpers;
// these two move with it. A .904 is an ordinary starter's season and a .915 is
// one the league notices, and those are the numbers set here.
const PACE = {
  NHL: { par: 0.46, star: 1.00, svPar: 0.904, svStar: 0.915 },
  AHL: { par: 0.46, star: 0.95, svPar: 0.901, svStar: 0.912 },
  OHL: { par: 0.78, star: 1.55, svPar: 0.896, svStar: 0.907 },
  WHL: { par: 0.78, star: 1.55, svPar: 0.896, svStar: 0.907 },
  QMJHL: { par: 0.82, star: 1.62, svPar: 0.893, svStar: 0.904 },
  USHL: { par: 0.70, star: 1.40, svPar: 0.898, svStar: 0.909 },
  NCAA: { par: 0.60, star: 1.25, svPar: 0.905, svStar: 0.916 },
  // The under-20 leagues. J20 is Sweden's and U20 is Finland's; the rest were
  // missing entirely, because prospects from those countries were being put
  // in men's leagues at sixteen. Scoring climbs as the league weakens.
  J20: { par: 0.78, star: 1.52, svPar: 0.896, svStar: 0.907 },
  U20: { par: 0.76, star: 1.48, svPar: 0.896, svStar: 0.907 },
  MHL: { par: 0.74, star: 1.45, svPar: 0.897, svStar: 0.908 },
  CZE20: { par: 0.76, star: 1.48, svPar: 0.894, svStar: 0.905 },
  SVK20: { par: 0.80, star: 1.56, svPar: 0.890, svStar: 0.901 },
  SUI20: { par: 0.82, star: 1.58, svPar: 0.889, svStar: 0.900 },
  DNL: { par: 0.84, star: 1.62, svPar: 0.887, svStar: 0.898 },
  ECHL: { par: 0.52, star: 1.05, svPar: 0.900, svStar: 0.911 }
};

// Everything else is a European senior league: lower event totals than the
// NHL, and a scoring title in the fifties rather than the hundreds.
const PACE_EURO = { par: 0.42, star: 0.88, svPar: 0.908, svStar: 0.919 };

export const paceOf = (league) => PACE[league] || PACE_EURO;

// NHL EQUIVALENCY.
//
// PACE above says how much scoring a league produces. That is the right number
// for grading a season inside its own league and the wrong one for comparing
// two prospects in different leagues, which is what a draft board does. The
// OHL's star bar is 1.55 and the German DNL's is 1.62, so on pace alone a
// point a game in Germany was worth slightly more than a point a game in the
// OHL. Scouts do not think that and neither should the board.
//
// These are translation factors: multiply a player's points by his league's
// factor and you have what those points are worth in NHL points. Taken from
// hockeystats.com/methodology/nhle, which derives them from players who played
// in two leagues in the SAME season, so what they measure is the step up in
// difficulty rather than a prospect getting better between one year and the
// next. That is why the junior numbers look low against the figures usually
// quoted: the familiar OHL 0.30 is measured across years and has a teenager's
// development folded into it. The men's leagues here land where the published
// figures have always had them, which is the check that the scale is sound.
//
// Only the ratios matter. The board divides by NHLE_STAR below, so the whole
// table could be multiplied by anything and no prospect would move.
const NHLE = {
  NHL: 1.000, KHL: 0.772, CZECH: 0.583, SHL: 0.566, SWISS: 0.459, LIIGA: 0.441,
  AHL: 0.389, DEL: 0.352, SLOVAK: 0.295, NCAA: 0.194, ECHL: 0.147,
  OHL: 0.144, USHL: 0.143, MHL: 0.143, WHL: 0.141, QMJHL: 0.113,
  // The under-20 leagues, where the gap the old board could not see is widest:
  // Sweden's J20 is worth nearly four times Germany's DNL per point.
  J20: 0.091, U20: 0.083, CZE20: 0.074, SUI20: 0.049, SVK20: 0.044, DNL: 0.024
};

// A league the table has never heard of is read as a European senior league,
// the same fallback PACE uses, and priced between Finland and Germany.
const NHLE_EURO = 0.40;

export const nhleOf = (league) => (league && NHLE[league] != null ? NHLE[league] : NHLE_EURO);

// What a season has to be worth in NHL points per game to count as a star one
// on a scouting board. Set at a star OHL year, 1.55 points a game at 0.144, so
// that the best major-junior prospects score what they scored before this
// existed and the class is not re-based around the change. Everyone else moves
// relative to them, which is the whole point.
export const NHLE_STAR = 1.55 * NHLE.OHL;

/** A season's scoring as NHL-equivalent points per game. */
export const nhlePerGame = (pts, gp, league) => (!gp ? 0 : ((pts || 0) / gp) * nhleOf(league));

export const isDefence = (pos) => pos === 'LD' || pos === 'RD';
export const isWing = (pos) => pos === 'LW' || pos === 'RW';

// A FORWARD HAD NO NUMBER OF HIS OWN.
//
// A goalie finished a year with saves, shots, a save percentage, a goals
// average and shutouts. A defenceman now has blocks and his minutes. A forward
// had goals, assists and points, which is the quantity every other position
// was being measured against rather than a stat belonging to him, and the four
// forward archetypes were therefore invisible: a Sniper and a Playmaker who
// both finished on thirty goals were the same player on the page.
//
// Shots on goal is the one that fixes it, because it is the mirror of the save
// percentage the goalie has had since the beginning. Two men score thirty and
// one of them needed a hundred and forty shots to do it.
//
// Per game, before role and ice time. A winger shoots more than his centre:
// he is the one being set up, which is the whole of the difference between the
// two jobs and the only honest place to put it.
const SOG_BASE = { W: 1.95, C: 1.70, D: 1.80 };
const SOG_PER_SHOOTING = 0.012;   // an 85 shooting fires about a third more than a 55
// What each archetype does to shot volume.
//
// The first draft of this cut the playmaker's volume hard, on the reasoning
// that a playmaker does not shoot. Measured, that inverted the thing the stat
// exists to show: dividing his goals into a small shot total gave him a better
// finishing percentage than the sniper. Real hockey agrees with the measurement
// and not with the reasoning. An elite distributor fires about as often as
// anyone else on the first line and finishes at a normal rate; what makes him a
// distributor is that two thirds of his points are assists. So the sniper's
// edge is volume, and a defenceman who never shoots is the one real case of a
// skater declining the shot.
const SOG_ARCH = {
  Sniper: 1.18, 'Power Forward': 1.06, Playmaker: 0.97,
  Shutdown: 0.70, 'Puck-Mover': 1.15
};
// The believable band for goals over shots. A sim that put a forward outside it
// would be reporting a percentage no scoresheet has ever carried, so the shot
// total gets nudged instead of the goal total: the goals are the season, the
// shots are the explanation.
const SHOOT_PCT_BAND = { F: [0.040, 0.250], D: [0.015, 0.120] };

/**
 * Shots on goal for a season, and with them a shooting percentage.
 *
 * Volume is simulated rather than derived from the goals, because deriving it
 * would invert the thing it is meant to show: a playmaker who scores less
 * would come out having shot more. Finishing is then goals over shots, which
 * is the number that separates the two.
 */
export function shotsOnGoal({ pos, games, goals, shooting, iceFactor = 1, archetype = '', jitter = 1 }) {
  if (pos === 'G' || !games) return 0;
  const base = isDefence(pos) ? SOG_BASE.D : isWing(pos) ? SOG_BASE.W : SOG_BASE.C;
  const arch = Object.keys(SOG_ARCH).find(k => (archetype || '').includes(k));
  const perGame = base
    * (1 + ((shooting || 55) - 55) * SOG_PER_SHOOTING)
    * Math.max(0.4, iceFactor)
    * (arch ? SOG_ARCH[arch] : 1)
    * jitter;

  let sog = Math.max(0, Math.round(games * Math.max(0.25, perGame)));
  const [lo, hi] = isDefence(pos) ? SHOOT_PCT_BAND.D : SHOOT_PCT_BAND.F;
  if (goals > 0) {
    sog = Math.max(sog, Math.ceil(goals / hi));  // nobody finishes at forty per cent
    sog = Math.min(sog, Math.floor(goals / lo)); // and nobody shoots two hundred times for four goals
  }
  return Math.max(sog, goals);
}

// THE DRAW.
//
// The only number on a real stat sheet that belongs to one position and to
// nobody else, and the centre did not have it. He had a faceoff minigame that
// handed out an OVR point and then forgot the result, which is a centre's
// defining skill modelled as a lottery ticket.
//
// A first-line centre takes about nineteen draws a night and a fourth-liner
// about nine, so the volume follows his role. Winning them follows how he
// reads the drop and how strong he is on his stick.
const FO_PER_GAME = 16.0;
const FO_BASE_PCT = 0.470;
const FO_PER_IQ = 0.0022;
const FO_PER_PHY = 0.0014;
const FO_BAND = [0.380, 0.620];
// What one win in the faceoff minigame is worth, permanently. Six of them over
// a career move him from an ordinary centre to one the staff send out for the
// draws that matter, which is what repeatedly winning a dedicated minigame
// ought to buy.
export const FO_EDGE_PER_WIN = 0.006;
export const FO_EDGE_CAP = 6;

/** Draws taken and won. Centres only: nobody else takes a meaningful number. */
export function faceoffs({ pos, games, hockeyIQ, physicality, iceFactor = 1, edge = 0, jitter = 1 }) {
  if (pos !== 'C' || !games) return { taken: 0, won: 0 };
  const taken = Math.max(0, Math.round(games * FO_PER_GAME * Math.max(0.45, iceFactor) * jitter));
  const pct = Math.max(FO_BAND[0], Math.min(FO_BAND[1],
    FO_BASE_PCT
    + ((hockeyIQ || 55) - 55) * FO_PER_IQ
    + ((physicality || 55) - 55) * FO_PER_PHY
    + Math.min(FO_EDGE_CAP, edge || 0) * FO_EDGE_PER_WIN
    + (jitter - 1) * 0.12));
  return { taken, won: Math.round(taken * pct) };
}

// PENALTY MINUTES.
//
// Needed because the Lady Byng is an award for a player who does damage without
// spending any time in the box, and the game had no way of knowing who those
// players were. It also gives the Power Forward archetype a cost, which it has
// never had.
const PIM_BASE = { F: 0.50, D: 0.72, G: 0.04 };
const PIM_PER_PHY = 0.016;
const PIM_ARCH = { 'Power Forward': 1.45, Shutdown: 1.30, Playmaker: 0.50, Sniper: 0.78 };

/** Minutes in the box across a season. */
export function penaltyMinutes({ pos, games, physicality, archetype = '', jitter = 1 }) {
  if (!games) return 0;
  const base = pos === 'G' ? PIM_BASE.G : isDefence(pos) ? PIM_BASE.D : PIM_BASE.F;
  const arch = Object.keys(PIM_ARCH).find(k => (archetype || '').includes(k));
  const perGame = base
    * Math.max(0.35, 1 + ((physicality || 55) - 55) * PIM_PER_PHY)
    * (arch ? PIM_ARCH[arch] : 1)
    * jitter;
  return Math.max(0, Math.round(games * perGame));
}

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
export const POS_PACE = { par: 0.70, star: 1.00 };

// The two halves of the grade, and the points the defensive half is drawn
// between. Fitted over five hundred seasons per archetype against a target
// curve: an ordinary regular at 5, a top-pair season at 9, a seventh
// defenceman under 4.
export const D_WEIGHT = { off: 1.9, def: 2.2 };
const D_SHIELD_PAR = 0.40;  // plus-minus per game that maxes the shield term
export const D_TOI_REF = 20.5; // an ordinary defenceman's night, for scaling per-minute rates

// What a blocked shot is worth against a point, for ranking one defence career
// against another.
//
// A good defence season is around forty-five points and a hundred and sixty
// blocks, so a quarter puts the two halves of the job on the same footing: the
// forty points of offence and the forty points-equivalent of getting in the
// way come out level, and a career is the sum of both rather than whichever
// one the scoresheet happens to record.
export const BLOCK_WORTH = 0.25;
const D_TOI_MID = 20.5;     // minutes at which a defenceman is neither trusted nor buried
const D_TOI_SPAN = 4.5;

// Blocking, as a rate per twenty minutes rather than per game.
//
// Per game it would be most of the way to a second ice-time term, because a
// man who plays twenty-six minutes blocks more than a man who plays fourteen
// whatever either of them is like. Per twenty minutes it is the part that is
// him: how willing he is to wear one and how well he reads where the puck is
// going. An ordinary defenceman is about 1.55 and the willing ones are near 2.
const D_BLOCK_PAR = 1.55;
const D_BLOCK_SPAN = 0.45;

// What the three parts of the defensive half are worth against each other.
//
// Plus-minus used to be 62 per cent of it, and it is the one number here that
// is not really his: the engine gives a defenceman twenty goals of swing for
// the club he happens to play for against forty-three for how good he is, so
// a third of what it reports is the four men on the ice with him. It still
// counts, because it is the only part of this that records what actually
// happened rather than what he did, but it is now the smallest of the three
// rather than the largest.
const D_DEF_PARTS = { block: 0.38, minutes: 0.35, shield: 0.27 };

/**
 * The half of a defenceman's season that never reaches the scoresheet.
 *
 * A goalie has a save percentage, so his year can be judged without reference
 * to anyone's points. A defenceman's equivalent has to be built out of what the
 * engine actually simulates: the goal difference he was on the ice for, and the
 * minutes the staff gave him. Those minutes are the coaching verdict on his
 * defending, and the nearest thing here to an eye test.
 *
 * Roughly -1 for a liability, +1 for the best defensive year in the league.
 */
/**
 * The defensive half as a mark out of ten, for a screen rather than a formula.
 *
 * defensiveHalf runs -1 to +1, which is right for feeding a rating and useless
 * to read. This is the same number on the scale the rest of the game shows a
 * player: five is an ordinary NHL defenceman, eight and a half is a season the
 * league notices, and the engine has been computing it for every defence
 * season without ever putting it in front of him.
 */
export const defenceGrade = (pmPerGame, toi, blkPerGame = null) =>
  Number((5 + defensiveHalf(pmPerGame, toi, blkPerGame) * 3.5).toFixed(1));

export function defensiveHalf(pmPerGame, toi, blkPerGame = null) {
  const mins = toi ?? D_TOI_MID;
  const clamp = (n) => Math.max(-1, Math.min(1, n));

  const shield = clamp((pmPerGame || 0) / D_SHIELD_PAR);
  const minutes = clamp((mins - D_TOI_MID) / D_TOI_SPAN);

  // A career written before blocked shots were kept has none of them, and so
  // does a peer from an old save. Rather than grade those men as if they had
  // blocked nothing, the blocking share is handed back to the other two.
  if (blkPerGame == null) {
    const rest = D_DEF_PARTS.minutes + D_DEF_PARTS.shield;
    return shield * (D_DEF_PARTS.shield / rest) + minutes * (D_DEF_PARTS.minutes / rest);
  }

  const per20 = (blkPerGame || 0) * (D_TOI_REF / Math.max(8, mins));
  const blocking = clamp((per20 - D_BLOCK_PAR) / D_BLOCK_SPAN);

  return blocking * D_DEF_PARTS.block + minutes * D_DEF_PARTS.minutes + shield * D_DEF_PARTS.shield;
}

/**
 * A season graded against the league it was played in, on the same 1 to 10
 * scale the rest of the game already uses.
 */
export function rateSeason({ league, pos, games, g, a, pm, blk, saves, shots, toi }) {
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
    const r = 5 + off * D_WEIGHT.off
      + defensiveHalf(pmPerGame, toi, blk == null ? null : blk / games) * D_WEIGHT.def;
    return Math.min(10, Math.max(1, Number(r.toFixed(1))));
  }

  // Plus-minus still counts for a forward, but as a tiebreaker rather than a
  // third of the grade: a plus-20 season is worth about half a point of rating.
  const r = 5 + ((ppg - pace.par) / (pace.star - pace.par)) * 3.5 + pmPerGame * 2.0;
  return Math.min(10, Math.max(1, Number(r.toFixed(1))));
}

// What a role buys, in minutes.
//
// The engine worked out an average time on ice every season, printed it on the
// recap, and then produced the season from a separate role multiplier that
// never once looked at it. Ice time was a label sitting next to a number it had
// no connection to. So an 88 OVR centre on a depth contract played 17.3
// minutes and posted a median of 79 points: a third-line scoring total that
// would have finished seventh in the league.
//
// These are the minutes each tier really plays. Even strength and powerplay are
// kept apart because a powerplay point comes at better than twice the
// even-strength rate, and top-unit time is most of a first-liner's edge.
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
// THE CLIFF BETWEEN TWO LINES.
//
// ROLE_ICE was looked up with a find on the floor, which makes ice time a
// staircase: a role multiplier of 0.77 bought 13.2 even-strength minutes and
// half a minute on the powerplay, and 0.75 bought 9.4 and nothing at all. Two
// hundredths of a point of role, and twenty-nine per cent of a man's minutes.
//
// Production is linear in those minutes, so that cliff was the amplifier
// behind every absurd year-on-year swing in the game. A player who signed a
// bottom-six deal after a top-six one crossed two of these edges at once and
// came out with a fifth of his points, from the same ability at the same age.
//
// Interpolating between the anchors instead. The anchors themselves are
// unchanged, so a clean first-liner, top-four, third-liner or fourth-liner
// gets exactly what he always got; what changes is that the space between them
// is now a slope rather than a drop.
const ICE_ANCHORS = [
  [1.18, 17.6, 3.0],
  [0.98, 15.8, 1.7],
  [0.76, 13.2, 0.5],
  [0.45, 9.4, 0.0],
  [0.20, 7.8, 0.0]
];

const anchoredIce = (roleMulti) => {
  const m = roleMulti;
  if (m >= ICE_ANCHORS[0][0]) return [ICE_ANCHORS[0][1], ICE_ANCHORS[0][2]];
  const last = ICE_ANCHORS[ICE_ANCHORS.length - 1];
  if (m <= last[0]) return [last[1], last[2]];
  for (let i = 0; i < ICE_ANCHORS.length - 1; i++) {
    const [hi, hiEven, hiPp] = ICE_ANCHORS[i];
    const [lo, loEven, loPp] = ICE_ANCHORS[i + 1];
    if (m <= hi && m >= lo) {
      const t = (m - lo) / (hi - lo);
      return [loEven + (hiEven - loEven) * t, loPp + (hiPp - loPp) * t];
    }
  }
  return [last[1], last[2]];
};

export function iceTime({ roleMulti, pos, coachTrust = 50, stamina = 50 }) {
  const group = isDefence(pos) ? 'D' : 'F';
  const [tierEven, tierPp] = anchoredIce(roleMulti);
  const shift = group === 'D' ? D_SHIFT : 1;

  // Trust earns third-period shifts and a place on a unit, stamina earns the
  // right to keep them. Both move him inside his tier, never out of it.
  const trustMod = ((coachTrust - 50) / 50) * 1.9;
  const staminaMod = ((stamina - 50) / 50) * 1.4;

  // "Both move him inside his tier, never out of it" is what the comment above
  // has always said and what the code did not do: the modifiers were added to
  // the anchor and clamped only at twenty-six minutes, so a trusted, fit
  // first-liner came out at 19.6 even and 22.7 all in, which is more than the
  // best centre in the world plays. Capped a shade above the top anchor, which
  // leaves the modifiers doing their real work in the roles below it.
  const evenCap = ICE_ANCHORS[0][1] * shift + 0.9;
  const even = Math.max(6.0, Math.min(evenCap, tierEven * shift + trustMod + staminaMod));
  // A coach who does not trust him does not put him out a man up. That goes
  // first, and it costs the most.
  const pp = tierPp * Math.max(0.35, Math.min(1.25, 0.55 + (coachTrust / 100) * 0.9));
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
 * The Norris was the last trophy still decided by a fixed threshold. A
 * threshold puts the whole outcome on the player's own variance, because the
 * thing he is measured against has none, so the Norris curve would not sit on
 * the Art Ross curve at any value: at 9.30 it fired in 21 per cent of seasons
 * at 88 OVR and 67 at 94, against a scoring title's 21 and 42, and tightening
 * it to fit the top end dropped the 88 to 11. Giving the bar its own spread
 * flattens the curve. The skaters' trophies already had a field with a spread
 * of its own, and this one did not.
 *
 * rateSeason is already normalised for the league it graded, so unlike the
 * scoring and save-percentage bars this one needs no table.
 */
export function drawLeagueBestDman() {
  return 9.61 + gaussian() * 0.69;
}

// ============================================================================
// A FORWARD'S DEFENSIVE GAME, AND THE AWARDS THAT HAVE NO SCORESHEET
// ============================================================================

// Forward reference points, measured off the engine rather than guessed.
//
// The first version of the Selke fed a forward's numbers into defensiveHalf,
// which is the defenceman's function, and every forward in the game came out
// negative: it marks twenty-point-five minutes and 1.55 blocks per twenty as
// par, and a forward plays seventeen and blocks a third as often, so the award
// was unwinnable by construction. These are a forward's own pars.
const F_BLOCK_PAR = 0.56;   // blocks per twenty minutes, an ordinary forward
const F_BLOCK_SPAN = 0.09;
const F_SHIELD_PAR = 0.16;  // plus-minus per game at the top of the range
const F_DRAW_PAR = 0.530;   // faceoff share an ordinary centre wins
const F_DRAW_SPAN = 0.11;

// Ice time is deliberately absent.
//
// For a defenceman the minutes are the coaching staff's verdict on his
// defending, which is why defensiveHalf leans on them. For a forward they are
// a verdict on his scoring: this engine gives its first line 22.8 minutes and
// its checking line 19.5 whatever either of them does without the puck.
// Measured with minutes in, a pure sniper outranked a shutdown winger on the
// defensive measure, which would have handed him the Selke.
const F_DEF_PARTS_C = { block: 0.33, shield: 0.27, draws: 0.40 };
// A winger is weighted harder toward blocking than a centre is.
//
// With the two split evenly, a sniper on a good team was reaching the Selke on
// his plus-minus alone, which is the one part of this that is not really his.
// A winger with no draws to win has to show the work somewhere, and getting in
// front of pucks is the only place left where it shows.
const F_DEF_PARTS_W = { block: 0.72, shield: 0.28 };

/**
 * The part of a forward's season that the scoresheet does not record.
 *
 * Roughly -1 for a passenger and +1 for the best defensive forward in the
 * league. A centre is measured on the draws as much as on anything else,
 * because winning them is most of what a defensive centre is for; a winger has
 * no draws to take, so his two remaining parts carry the whole weight.
 */
export function forwardDefence({ pmPerGame = 0, toi = null, blkPerGame = null, foPct = null }) {
  const clamp = (n) => Math.max(-1, Math.min(1, n));
  const per20 = blkPerGame == null ? null
    : blkPerGame * (D_TOI_REF / Math.max(8, toi ?? 17));
  const blocking = per20 == null ? 0 : clamp((per20 - F_BLOCK_PAR) / F_BLOCK_SPAN);
  const shield = clamp((pmPerGame || 0) / F_SHIELD_PAR);

  if (foPct == null) {
    return blocking * F_DEF_PARTS_W.block + shield * F_DEF_PARTS_W.shield;
  }
  const draws = clamp((foPct - F_DRAW_PAR) / F_DRAW_SPAN);
  return blocking * F_DEF_PARTS_C.block
    + shield * F_DEF_PARTS_C.shield
    + draws * F_DEF_PARTS_C.draws;
}

// WHAT THE BEST CASE IN THE LEAGUE LOOKED LIKE THIS YEAR.
//
// Three of the new trophies have no number to race against. The scoring title
// has drawLeagueBest, the Vezina has drawLeagueBestSv and the Norris has
// dmanBar, so each of those is won against a field that moves; the Masterton,
// the Clancy and the Messier were written as plain conditions and every one of
// them came out at a hundred per cent the moment a player met them, which is
// not an award, it is a checkbox. These are the same device: the best case
// somebody else in the league made this season, drawn fresh each year.
export const drawComebackBar = () => 7.4 + gaussian() * 0.8;    // a season rating
export const drawCommunityBar = () => 980 + gaussian() * 300;   // standing in the city
export const drawRoomBar = () => 88 + gaussian() * 7;           // what his room thinks

// A FORWARD CAREER IS NOT A POINTS-PER-GAME NUMBER.
//
// Every forward career was scored on one figure, points per game, with the
// Hall of Fame gate at 0.75 and the top tier at 1.00. That reads a
// distributor correctly and nobody else. A power forward with twelve hundred
// games, four hundred goals and three Cups at 0.72 a game cleared no gate at
// all, took the smallest rate award available and finished behind a smaller
// playmaker who had piled up secondary assists, because the one number the
// game looked at could not see that he scored two thirds of his own points.
//
// Four parts, with the scoring still the biggest of them by a distance,
// because it should be. Marked out of ten on the same scale as the defence
// grade, so the tier gates can be one set of numbers for both.
const F_PPG_PAR = 0.62, F_PPG_SPAN = 0.42;   // an ordinary top-nine forward, and an elite one
const F_GPG_PAR = 0.26, F_GPG_SPAN = 0.16;
const F_SHP_PAR = 0.105, F_SHP_SPAN = 0.045;
const F_CAREER_PARTS = { points: 0.58, goals: 0.16, finishing: 0.10, twoWay: 0.16 };

export function forwardCareerGrade({ games, goals, points, sog = 0, pm = 0, blk = null,
                                     toi = null, fot = 0, fow = 0 }) {
  if (!games) return 0;
  const clamp = (n) => Math.max(-1, Math.min(1, n));
  const scoring = clamp((points / games - F_PPG_PAR) / F_PPG_SPAN);
  const finishing_v = clamp((goals / games - F_GPG_PAR) / F_GPG_SPAN);
  const pct = sog > 0 ? goals / sog : F_SHP_PAR;
  const converting = clamp((pct - F_SHP_PAR) / F_SHP_SPAN);
  const twoWay = forwardDefence({
    pmPerGame: pm / games, toi,
    blkPerGame: blk == null ? null : blk / games,
    foPct: fot > 0 ? fow / fot : null
  });
  const mix = scoring * F_CAREER_PARTS.points
    + finishing_v * F_CAREER_PARTS.goals
    + converting * F_CAREER_PARTS.finishing
    + twoWay * F_CAREER_PARTS.twoWay;
  return Number((5 + mix * 3.6).toFixed(2));
}
