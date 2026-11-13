import { CLUB_RECORDS, LEAGUE_RECORDS } from '../data/hockeyRecords';

// THE RECORD BOOK.
//
// The game knew what it took to win a scoring title this year and nothing at
// all about what had ever been done. A career could put up the best season any
// San Jose player had managed and the only acknowledgement was the same points
// total in the same column as every other year.
//
// Every number in the book is a real record, taken from a published source one
// at a time. See data/hockeyRecords.js. Nothing is generated, which has two
// consequences worth stating plainly rather than hiding:
//
//   1. The league records are out of reach. Gretzky's two hundred and fifteen
//      stands against an engine whose best possible season, measured over four
//      thousand simulations of the best player it can make, is a hundred and
//      forty-one. The NHL book is a thing to be measured against rather than a
//      thing to take. That is also true of the real NHL, where nobody has come
//      within sixty points of it in nearly forty years.
//
//   2. Club books vary enormously, because real ones do. Utah's points record
//      is ninety and Edmonton's is two hundred and fifteen. Where he signs
//      decides whether his name can ever go on that wall, which is a more
//      interesting fact about a career than a uniform bar would have been.
//      Junior is where this bites hardest: Mississauga's club record is
//      eighty-two points and Windsor's is a hundred and fifty-three, and a
//      sixteen-year-old does not choose which one drafts him.
//
// A league or club with no sourced record has no book here at all, and nothing
// can be broken there. That is the honest failure mode: filling the gaps with
// plausible-looking numbers would make the whole thing untrustworthy, because
// nobody could tell which half was real.

const asEntry = (triple) => triple
  ? { value: triple[0], holder: triple[1], year: triple[2], mine: false }
  : null;

/** The stats a position can hold a record in. */
export const RECORD_KEYS = (pos) =>
  pos === 'G' ? ['wins', 'shutouts'] : ['points', 'goals', 'assists'];

export const RECORD_LABEL = {
  points: 'points in a season',
  goals: 'goals in a season',
  assists: 'assists in a season',
  wins: 'wins in a season',
  shutouts: 'shutouts in a season'
};

export const formatRecord = (key, value) => String(Math.round(value));

// A save percentage record used to be in here and has been taken out. There is
// no published franchise save percentage record for most clubs, the figure is
// not comparable across eras, and the only way to have kept it would have been
// to make one up.

/**
 * The book for one league and one club, as far as it is actually known.
 *
 * Club books exist for the NHL, the OHL, the WHL and one AHL club, because
 * those are the leagues that publish franchise records in a form that can be
 * checked club by club. The QMJHL and the rest of the AHL have none here, so
 * nothing can be broken there and nothing claims to have been.
 */
export function ensureBook(book, league, club) {
  const next = { ...(book || {}) };
  const lg = { ...(next[league] || {}) };

  if (!lg.league) {
    const src = LEAGUE_RECORDS[league];
    if (src) {
      const l = {};
      for (const k of Object.keys(src)) l[k] = asEntry(src[k]);
      lg.league = l;
    }
  }

  const clubs = { ...(lg.clubs || {}) };
  if (club && !(club in clubs)) {
    const src = CLUB_RECORDS[league]?.[club] || null;
    if (src) {
      const c = {};
      for (const k of Object.keys(src)) c[k] = asEntry(src[k]);
      clubs[club] = c;
    }
  }

  lg.clubs = clubs;
  next[league] = lg;
  return next;
}

/** What this season was worth, in the terms the book keeps. */
export function seasonValues(recap, pos) {
  if (pos === 'G') return { wins: recap.wins || 0, shutouts: recap.sho || 0 };
  return {
    points: (recap.g || 0) + (recap.a || 0),
    goals: recap.g || 0,
    assists: recap.a || 0
  };
}

/**
 * Hand the season to the book and see what it takes.
 *
 * Club first, because that is the one a career can realistically reach.
 */
export function claimRecords(book, { league, club, year, name, pos, recap }) {
  let next = ensureBook(book, league, club);
  const broken = [];
  const vals = seasonValues(recap, pos);
  const lg = { ...(next[league] || {}) };
  const clubs = { ...(lg.clubs || {}) };
  const leagueRecs = { ...(lg.league || {}) };
  const clubRecs = { ...(clubs[club] || {}) };

  for (const k of RECORD_KEYS(pos)) {
    const v = vals[k];
    if (v == null) continue;

    // Beating yourself by one is not news: the book moves, nobody says it.
    const worthSaying = (prev) => !prev.mine || (v - prev.value) >= 3;

    if (clubRecs[k] && v > clubRecs[k].value) {
      broken.push({
        scope: 'club', key: k, value: v, report: worthSaying(clubRecs[k]),
        previous: clubRecs[k].value, previousHolder: clubRecs[k].holder,
        previousMine: !!clubRecs[k].mine, previousYear: clubRecs[k].year, club, league
      });
      clubRecs[k] = { value: v, holder: name, year, mine: true };
    }
    if (leagueRecs[k] && v > leagueRecs[k].value) {
      broken.push({
        scope: 'league', key: k, value: v, report: worthSaying(leagueRecs[k]),
        previous: leagueRecs[k].value, previousHolder: leagueRecs[k].holder,
        previousMine: !!leagueRecs[k].mine, previousYear: leagueRecs[k].year, league
      });
      leagueRecs[k] = { value: v, holder: name, year, mine: true };
    }
  }

  if (Object.keys(clubRecs).length) clubs[club] = clubRecs;
  lg.clubs = clubs;
  if (Object.keys(leagueRecs).length) lg.league = leagueRecs;
  next = { ...next, [league]: lg };
  return { book: next, broken };
}

// THE LEAGUE NO LONGER TAKES RECORDS BACK.
//
// When the book was seeded on measured numbers, the simulated league had a go
// at it every season, and that was right: the bar was set at what this engine
// produces, so the field could plausibly reach it.
//
// These are historical records now. The engine's league does not produce
// two-hundred-point seasons, and the only way for the field to break one would
// be to invent a player who beat Gretzky. Kept as a function so the caller does
// not have to change, and so there is somewhere obvious to put this note.
export function advanceRecords(book) {
  return book;
}

/**
 * Everything in the book with his name on it, for the retirement screen.
 * Records he set and then lost are not listed: he does not hold them.
 */
export function recordsHeld(book) {
  const out = [];
  for (const league of Object.keys(book || {})) {
    const lg = book[league] || {};
    for (const k of Object.keys(lg.league || {})) {
      if (lg.league[k]?.mine) out.push({ scope: 'league', league, key: k, ...lg.league[k] });
    }
    for (const club of Object.keys(lg.clubs || {})) {
      for (const k of Object.keys(lg.clubs[club] || {})) {
        if (lg.clubs[club][k]?.mine) {
          out.push({ scope: 'club', league, club, key: k, ...lg.clubs[club][k] });
        }
      }
    }
  }
  return out.sort((a, b) =>
    (a.scope === b.scope ? 0 : a.scope === 'league' ? -1 : 1) || (b.value - a.value));
}

/**
 * A record as a sentence, for the recap and the retirement screen.
 *
 * The previous holder is a real person who really held it, so the line says who
 * and since when. That is most of the weight of it: taking the Columbus record
 * off Artemi Panarin means something that taking it off a generated name does
 * not.
 */
export function recordLine(rec, clubName) {
  const what = `${formatRecord(rec.key, rec.value)} ${RECORD_LABEL[rec.key]}`;
  const where = rec.scope === 'league' ? `the ${rec.league} record` : `the ${clubName || rec.club} record`;
  const taken = rec.previousMine
    ? ` You beat your own, set in ${rec.previousYear}.`
    : rec.previousHolder
      ? ` You took it off ${rec.previousHolder}, who had held it since ${rec.previousYear}.`
      : '';
  return `${what.charAt(0).toUpperCase()}${what.slice(1)}. That is ${where}.${taken}`;
}
