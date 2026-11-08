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

// Past this and the club has not won one at all, which several real
// franchises have managed and which is a better story than a number.
const NEVER_AFTER = 58;

/** The season a club last won, as the save knows it or as its id implies. */
export function lastTitle(ledger, teamId, year) {
  if (!teamId) return { year: null, gap: null, never: true };
  const known = (ledger || {})[teamId];
  if (typeof known === 'number') {
    return { year: known, gap: Math.max(0, year - known), never: false };
  }
  const gap = seedDrought(teamId);
  if (gap > NEVER_AFTER) return { year: null, gap: null, never: true };
  return { year: year - gap, gap, never: false };
}

/** One clause, for dropping into a sentence about the city. */
export function droughtLine(ledger, teamId, year) {
  const t = lastTitle(ledger, teamId, year);
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
