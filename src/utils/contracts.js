// WHAT A CONTRACT IS ARGUED OVER.
//
// generateOffers priced a player from a closed formula on his own numbers:
// career points divided by seasons played, plus a term in his overall rating,
// times cap inflation. Three things were wrong with it and all three are the
// same thing.
//
// The production it used was a lifetime average wearing the name of recent
// form, so a thirty-four-year-old who had put up ninety points eight years ago
// and thirty last season was paid on sixty, and a twenty-four-year-old on his
// way up was paid on the two thin years behind him rather than the one he had
// just had.
//
// The tiers that set his term and his floor were gated on player.ovr, a number
// the player is never shown, so the single figure deciding whether he was
// offered eight years or two was invisible to him.
//
// And there was nobody else in it. No comparable, no name, no number to point
// at. A negotiation with no comparable is not a negotiation, it is a price.

import { groupName, posGroup } from './peers';
import { defensiveHalf, paceOf } from './production';

// The player's own history writes goals/assists/games; a classmate's season
// writes g/a/pts/gp. Both are read here, so neither caller has to care.
const ptsOf = (s) => (s.pts != null ? s.pts : (s.g ?? s.goals ?? 0) + (s.a ?? s.assists ?? 0));
const gpOf = (s) => s.gp ?? s.games ?? 0;

// How many seasons count, and how much each counts for. The season just
// finished is most of the argument, which is why a career year at the right
// moment is worth so much more than the same year two contracts ago.
const FORM_WEIGHTS = [0.52, 0.31, 0.17];

// A defenceman's point is worth more than a forward's because there are fewer
// of them to buy. Measured against this engine's own output, a top-pair
// defenceman scores about 77 per cent of what a first-line forward scores at
// the same ability, so his points buy proportionally more. Short of the full
// 1.30 that ratio implies, because the defensive half below now measures
// directly the part of his value this multiplier used to stand in for, and at
// 1.30 the two stacked: an elite two-way defenceman priced out at fourteen per
// cent of the cap, where the real top of that market is about ten.
const POS_WORTH = { F: 1.00, D: 1.12, G: 1.00 };

// The cap as a number rather than a multiplier, because every floor and
// ceiling below is a share of it and a share is how contracts are actually
// discussed. The 2024 upper limit, carried forward at four per cent a year,
// which is the same rate the old capInflation used.
export const capFor = (year) => 88000000 * (1 + Math.max(0, (year || 2026) - 2024) * 0.04);

/**
 * One season's production as a rate, normalised for the league it was played
 * in and the position that played it, so seasons in different leagues and at
 * different positions can be set against each other at all.
 *
 * 1.0 is a point-a-game NHL forward.
 */
function seasonWorth(season, pos) {
  const gp = gpOf(season);
  if (!gp) return 0;
  const pace = paceOf(season.league);
  const group = posGroup(pos);

  if (group === 'G') {
    const shots = season.shots || 0;
    if (!shots) return 0;
    const sv = (season.saves || 0) / shots;
    // A goalie is bought on his save percentage against what his league pays
    // par for, carried by how much of the season he actually started.
    // Refitted when svStar came down from .925 to .915: the gap this divides
    // by nearly halved, so every figure above it nearly doubled and an elite
    // goalie priced out at 14 per cent of the cap, which is more than any
    // goalie has ever been paid. A .922 is about nine and a half per cent now,
    // an ordinary .905 about three, and a .897 close to the minimum.
    const above = (sv - pace.svPar) / Math.max(0.001, pace.svStar - pace.svPar);
    return Math.max(0, 0.40 + above * 0.38) * Math.min(1, gp / 55);
  }

  // Read against his own league's star rate first, then expressed in NHL
  // terms, so sixty points in the SHL and sixty in the NHL are not the same
  // contract.
  const relative = (ptsOf(season) / gp) / pace.star;
  const offence = relative * paceOf('NHL').star * POS_WORTH[group];

  if (group === 'D') {
    // A defenceman is not bought on points alone, for the same reason his
    // season is not graded on points alone. A twenty-point defenceman who was
    // plus thirty at twenty-four minutes a night priced out here at a quarter
    // of what he is worth, because the only thing the formula could see was
    // the scoresheet. Scaled so a neutral defensive year leaves the price
    // where his points put it, and the best defensive season in the league is
    // worth about as much again as thirty points.
    const pmPerGame = (season.plusMinus ?? season.pm ?? 0) / gp;
    const defence = defensiveHalf(pmPerGame, season.avgToi);
    return Math.max(0, offence + defence * 0.42) * Math.min(1, gp / 65);
  }

  return offence * Math.min(1, gp / 65);
}

/**
 * Recent form as a single NHL-equivalent rate, weighted toward the season just
 * finished. Works for the player, whose history is a list, and for a classmate,
 * who carries only the season he has just played.
 */
export function recentForm(subject) {
  const pos = subject.pos;
  const seasons = subject.seasonHistory
    ? (subject.seasonHistory || []).filter(s => gpOf(s) > 0).slice(-3).reverse()
    : (subject.season && gpOf(subject.season) > 0 ? [subject.season] : []);
  if (!seasons.length) return { rate: 0, seasons: 0, best: null, last: null };

  let num = 0, den = 0;
  seasons.forEach((s, i) => {
    const w = FORM_WEIGHTS[i] ?? 0;
    num += seasonWorth(s, pos) * w;
    den += w;
  });

  return {
    rate: den > 0 ? num / den : 0,
    seasons: seasons.length,
    last: seasons[0],
    best: seasons.reduce((b, s) => (!b || ptsOf(s) > ptsOf(b) ? s : b), null)
  };
}

// Trophies that move a price, as opposed to selections and participation.
const MAJORS = ['Hart', 'Norris', 'Vezina', 'Art Ross', 'Maurice Richard', 'Conn Smythe', 'Calder'];

export const majorCount = (player) => {
  const all = [
    ...(player?.stats?.awards || []),
    ...((player?.seasonHistory || []).flatMap(s => s.awards || []))
  ];
  return all.filter(a => MAJORS.some(m => a.includes(m))).length;
};

/**
 * What the market pays a player producing at this rate.
 *
 * A share of the cap, so it moves with the cap instead of needing its own
 * inflation term, and so the tiers below can be written the way a general
 * manager thinks about them: this man is a six per cent player. The curve is
 * set so a point-a-game forward lands at about twelve per cent, which is where
 * the real top of the market sits, and falls away below that faster than the
 * production does, because replacement level is cheap.
 */
export function priceOf(rate, year, { age = 26, awards = 0 } = {}) {
  const cap = capFor(year);
  const share = 0.004 + Math.pow(Math.max(0, rate), 1.45) * 0.088;

  // A thirty-four-year-old and a twenty-six-year-old producing identically are
  // not the same contract: one is being paid for the years ahead of him and
  // the other for the ones behind.
  const ageMod = age <= 23 ? 0.92 : age <= 28 ? 1.00 : age <= 31 ? 0.97
    : age <= 34 ? 0.90 : age <= 36 ? 0.80 : 0.68;

  // Hardware is leverage. It is not production and it does not expire.
  const awardMod = 1 + Math.min(0.14, awards * 0.035);

  return Math.round(cap * share * ageMod * awardMod);
}

const median = (arr) => {
  const s = [...arr].sort((x, y) => x - y);
  if (!s.length) return 0;
  const h = Math.floor(s.length / 2);
  return s.length % 2 ? s[h] : Math.round((s[h - 1] + s[h]) / 2);
};

/**
 * The three or four names an agent puts on the table.
 *
 * They come from the player's own draft class, which is the only population of
 * careers the game actually simulates, and they are priced by exactly the
 * formula above, so the comparison is honest: these men are on what their
 * seasons are worth, measured the same way his are.
 */
export function comparables(player, peers, year, limit = 4) {
  const group = posGroup(player.pos);
  const mine = priceOf(recentForm(player).rate, year, {
    age: player.age, awards: majorCount(player)
  });

  const priced = (peers || [])
    .filter(p => !p.retired && posGroup(p.pos) === group
      && p.season && p.season.league === 'NHL' && gpOf(p.season) >= 20)
    .map(p => ({
      id: p.id,
      name: p.name,
      pos: p.pos,
      nat: p.nat,
      team: p.team,
      gp: gpOf(p.season),
      pts: group === 'G' ? null : ptsOf(p.season),
      sv: p.season.shots ? p.season.saves / p.season.shots : null,
      salary: priceOf(recentForm(p).rate, year, { age: p.age, awards: p.career?.trophies || 0 })
    }))
    .filter(c => c.salary > 0);

  if (!priced.length) return { comps: [], anchor: mine, mine, group };

  // The ones nearest him in money, because those are the ones that bite, laid
  // out richest first the way an agent would.
  const near = priced
    .sort((x, y) => Math.abs(x.salary - mine) - Math.abs(y.salary - mine))
    .slice(0, limit)
    .sort((x, y) => y.salary - x.salary);

  // What he is actually set against: his own production and what the men
  // beside him are on. Weighted toward his own, because a comparable is an
  // argument and not a formula.
  const anchor = Math.round(mine * 0.6 + median(near.map(c => c.salary)) * 0.4);
  return { comps: near, anchor, mine, group };
}

/**
 * Term and floor, from what he is worth rather than from a rating he is never
 * shown.
 *
 * The tiers were player.ovr >= 85, >= 80 and >= 75, so the one number deciding
 * whether he was offered eight years or two was the one number he could not
 * read. A share of the cap he can read off his own contract and off every
 * comparable the agent puts in front of him.
 */
export function marketTier(anchor, year) {
  const share = anchor / capFor(year);
  if (share >= 0.085) return { tier: 'franchise', maxYears: 8, rfaMinYears: 6, floorShare: 0.085 };
  if (share >= 0.055) return { tier: 'core', maxYears: 7, rfaMinYears: 5, floorShare: 0.055 };
  if (share >= 0.032) return { tier: 'top-six', maxYears: 5, rfaMinYears: 3, floorShare: 0.032 };
  if (share >= 0.016) return { tier: 'regular', maxYears: 3, rfaMinYears: 2, floorShare: 0.016 };
  return { tier: 'fringe', maxYears: 2, rfaMinYears: 1, floorShare: 0 };
}

const money = (n) => {
  if (n >= 1000000) {
    const m = n / 1000000;
    return `$${m >= 10 ? m.toFixed(1) : m.toFixed(2)}M`;
  }
  return `$${Math.round(n / 1000)}k`;
};

/**
 * What the agent says, in one or two sentences, with the names in it.
 *
 * This is the whole point of the exercise: the player can see who he is being
 * measured against and whether the number in front of him is short.
 */
export function compLine({ comps, anchor, group }, offered) {
  if (!comps.length) {
    return 'Nobody from your draft class is established enough to price you against. Your agent is working off your own numbers alone.';
  }

  const unit = group === 'G'
    ? (c) => `${(c.sv || 0).toFixed(3).replace('0.', '.')} in ${c.gp}`
    : (c) => `${c.pts} in ${c.gp}`;

  const named = comps.slice(0, 3)
    .map(c => `${c.name} (${unit(c)}) on ${money(c.salary)}`)
    .join(', ');

  const verdict = offered == null ? ''
    : offered >= anchor * 1.05
      ? ` The ${money(offered)} on the table is above that market.`
      : offered >= anchor * 0.92
        ? ` The ${money(offered)} on the table is about right.`
        : ` The ${money(offered)} on the table is ${money(anchor - offered)} short of it.`;

  return `Your agent's comparables: ${named}. That puts your market at ${money(anchor)}.${verdict}`;
}

export { money as formatComp, groupName };
