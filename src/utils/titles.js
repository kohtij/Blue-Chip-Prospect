// WHO LAST WON, AND HOW LONG AGO.
//
// The hometown-savior storyline told every club in the league that its city
// had suffered "a 50-year championship drought", word for word, on a number
// nobody had worked out. Sign for a club that lifted the thing two seasons
// ago and it said the same sentence. It was the only line in the game about
// a club's history, and the game had no club history to say it from.
//
// This is that history: one entry a club, the season it last won. The save
// writes to it whenever a championship is decided in a league the player is
// in, which over a twenty-year career is most of the NHL. Everything the
// save has not seen is filled in from the club's own id, so a brand new
// career already has a league where some cities are waiting and some are not,
// and the same club tells the same story every time.

// A club with no entry yet. Deterministic on the id, so Chicago's drought is
// Chicago's drought in every career, and shaped so most clubs last won within
// living memory while a few have been waiting a very long time.
const seedDrought = (teamId) => {
  let h = 2166136261;
  for (let i = 0; i < String(teamId).length; i++) {
    h ^= String(teamId).charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const raw = ((h >>> 0) % 10000) / 10000;
  // Squared, so the mass sits in the low twenties and the long waits are rare.
  return Math.round(3 + raw * raw * 72);
};

// THE REAL ONES.
//
// The NHL's history is not something to invent. The seeded drought told
// Toronto it had never won a championship, which every person in Toronto
// would be happy to correct. Each club's last Stanley Cup, by the spring it
// was won, through Carolina in 2026. null is a franchise that has never won
// one: Ottawa's earlier Senators and Arizona's Coyotes are different
// franchises from the clubs playing under those names now.
const LAST_CUP = {
  ANA: 2007, BOS: 2011, BUF: null, CAR: 2026, CBJ: null, CGY: 1989, CHI: 2015,
  COL: 2022, DAL: 1999, DET: 2008, EDM: 1990, FLA: 2025, LAK: 2014, MIN: null,
  MTL: 1993, NJD: 2003, NSH: null, NYI: 1983, NYR: 1994, OTT: null, PHI: 1975,
  PIT: 2017, SEA: null, SJS: null, STL: 2019, TBL: 2021, TOR: 1967, UTA: null,
  VAN: null, VGK: 2023, WPG: null, WSH: 2018
};

// Past this and the club has not won one at all, which several real
// franchises have managed and which is a better story than a number.
const NEVER_AFTER = 58;

/** The season a club last won, as the save knows it or as its id implies. */
export function lastTitle(ledger, teamId, year, league = 'NHL') {
  if (!teamId) return { year: null, gap: null, never: true };
  const known = (ledger || {})[teamId];
  if (typeof known === 'number') {
    return { year: known, gap: Math.max(0, year - known), never: false };
  }
  if (league === 'NHL' && teamId in LAST_CUP) {
    const real = LAST_CUP[teamId];
    if (real === null) return { year: null, gap: null, never: true };
    return { year: real, gap: Math.max(0, year - real), never: false };
  }
  const gap = seedDrought(teamId);
  if (gap > NEVER_AFTER) return { year: null, gap: null, never: true };
  return { year: year - gap, gap, never: false };
}

/** One clause, for dropping into a sentence about the city. */
export function droughtLine(ledger, teamId, year, league = 'NHL') {
  const t = lastTitle(ledger, teamId, year, league);
  if (t.never) return 'has never won a championship';
  if (t.gap === 0) return 'won it this season';
  if (t.gap === 1) return 'won it last season';
  if (t.gap <= 3) return `last won it ${t.gap} seasons ago`;
  return `has not won since ${t.year}, ${t.gap} years ago`;
}

/**
 * Write a championship into the ledger. Returns a new object; the caller
 * stores it on the player beside leagueState.
 */
export function recordTitle(ledger, teamId, year) {
  if (!teamId || typeof year !== 'number') return ledger || {};
  return { ...(ledger || {}), [teamId]: year };
}
