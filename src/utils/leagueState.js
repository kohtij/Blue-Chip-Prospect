import { gaussianNoise } from './production';

// How good every club is, and how that changes from year to year.
//
// It used to be a coin flip. `simulateSeason` opened with
// `randomTeamFactor = Math.random()`, carried that number carefully through
// the four segments of the season, and then threw it away. Next September it
// rolled again from nothing. A club finished third and then twenty-eighth
// with no connection between the two, and because of that the league table
// was noise: no dynasty ever formed, no club ever rebuilt, no window ever
// closed on a player turning thirty-three, and asking for a trade off a
// sinking team meant nothing because no team was sinking, they were all just
// re-rolling.
//
// Now a club has a strength that persists and moves slowly. A contender stays
// a contender for a while and then stops being one.

// Year over year a club keeps most of what it was and drifts back toward the
// middle. 0.82 gives a good team roughly a four to six year window before it
// is ordinary again, which is about right for a hockey club.
const PERSISTENCE = 0.82;
const MEAN = 0.5;
const DRIFT = 0.075;

// A club with no entry yet gets one derived from its own id rather than from
// chance, so the same league looks the same until a season is actually
// played. Cheap string hash, uniform enough for this.
const seedFor = (teamId) => {
  let h = 2166136261;
  for (let i = 0; i < String(teamId).length; i++) {
    h ^= String(teamId).charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // Pull toward the middle: most clubs are ordinary, a few are not.
  const raw = ((h >>> 0) % 10000) / 10000;
  return 0.5 + (raw - 0.5) * 0.7;
};

export function teamStrengthOf(state, teamId) {
  if (!teamId) return 0.5;
  const v = state?.[teamId];
  return typeof v === 'number' ? v : seedFor(teamId);
}

/**
 * One year passes. Every club the save knows about moves a little, and the
 * clubs it does not know about are left alone: they are seeded on first sight
 * and only start drifting once the player has had something to do with them.
 */
export function advanceLeagueState(state, touchedTeams = []) {
  const next = { ...(state || {}) };
  for (const id of touchedTeams) {
    if (!(id in next)) next[id] = seedFor(id);
  }
  for (const id of Object.keys(next)) {
    const drifted = MEAN + (next[id] - MEAN) * PERSISTENCE + gaussianNoise() * DRIFT;
    next[id] = Math.min(0.97, Math.max(0.03, Number(drifted.toFixed(4))));
  }
  return next;
}

/**
 * A one-line read on where a club is heading, for the recap and the trade
 * screens. Nothing uses the number directly, they use this.
 */
export function clubOutlook(strength) {
  if (strength >= 0.80) return { label: 'Contender', tone: 'text-[#22E748]' };
  if (strength >= 0.62) return { label: 'In the hunt', tone: 'text-sky-300' };
  if (strength >= 0.40) return { label: 'Middling', tone: 'text-slate-400' };
  if (strength >= 0.22) return { label: 'Struggling', tone: 'text-[#F59E0B]' };
  return { label: 'Rebuilding', tone: 'text-[#ef4444]' };
}

/**
 * The whole league, in order, as it is projected to finish.
 *
 * Free agency used to work out each club's standing on its own, one offer at a
 * time, which meant two clubs on the same sheet could both be projected to
 * finish eleventh. A table is the only way to guarantee that cannot happen:
 * every club is ranked against every other club once, and a position is a
 * position.
 *
 * Deterministic for a given league state, so the same save shows the same
 * table everywhere it is read.
 */
export function projectedTable(state, teams = []) {
  return [...teams]
    .map(t => ({ id: t.id ?? t, strength: teamStrengthOf(state, t.id ?? t) }))
    // Ties broken on the id rather than at random, so the order is stable
    // between the offer screen, the draft order and anything else that asks.
    .sort((a, b) => (b.strength - a.strength) || (a.id < b.id ? -1 : 1))
    .map((row, i) => ({ ...row, place: i + 1 }));
}

/** Where one club sits in that table. */
export function placeIn(table, teamId) {
  const row = (table || []).find(r => r.id === teamId);
  return row ? row.place : null;
}

/**
 * Draft order: worst finishers pick first. Used to say which club took each
 * member of a draft class.
 */
export function draftOrder(state, teams = []) {
  return projectedTable(state, teams).map(r => r.id).reverse();
}
