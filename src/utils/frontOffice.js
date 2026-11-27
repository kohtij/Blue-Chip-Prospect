import { nhlTeams, chlLeagues } from '../data/teams';
import { teamStrengthOf } from './leagueState';
import { gaussianNoise, isDefence } from './production';
import { staffName } from './staffNames';

// THE FRONT OFFICES.
//
// The draft used to be one shared board read by thirty-two identical clubs,
// each taking whoever was left at the top of it. Real clubs don't draft like
// that. Each has a general manager with his own habits, a prospect pool that
// is deep in some places and bare in others, and a pick that may not even be
// his any more, because a club chasing a Cup trades its future for help now.
//
// So every NHL club gets a front office: an owner, the general manager who
// answers to him, and a prospect pool by position. All three are kept for the
// whole career and move a little every summer. Nothing is redrawn from
// scratch: a pool loses the prospects who graduate or wash out and gains the
// ones the club drafts, and a general manager keeps his habits until the owner
// replaces him.

// Made up, and from one country at a time: mostly Canadians and Americans,
// now and then a Swede, a Finn or a Czech, the way NHL front offices are.
// See utils/staffNames.js.
const GM_NATIONS = { CAN: 64, USA: 26, SWE: 4, FIN: 3, CZE: 3 };
const weightedNat = () => {
  const total = Object.values(GM_NATIONS).reduce((n, w) => n + w, 0);
  let r = Math.random() * total;
  for (const [k, w] of Object.entries(GM_NATIONS)) { r -= w; if (r <= 0) return k; }
  return 'CAN';
};

const pickOf = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** The four groups a prospect pool is kept in. */
export const POOL_GROUPS = ['C', 'W', 'D', 'G'];
export const poolGroup = (pos) =>
  pos === 'G' ? 'G' : isDefence(pos) || pos === 'D' ? 'D' : pos === 'C' ? 'C' : 'W';

/** Where a prospect came up through, as general managers sort them. */
export const routeOf = (league) =>
  chlLeagues.includes(league) ? 'CHL'
    : ['NCAA', 'USHL', 'BCHL', 'NTDP'].includes(league) ? 'NCAA'
      : league ? 'EUR' : null;

const LEANS = ['C', 'W', 'D'];
const NATIONS = ['CAN', 'USA', 'SWE', 'FIN', 'RUS', 'CZE'];

/**
 * A general manager, with the habits he brings to the job.
 *
 * Most men lean one way or two and are neutral on the rest. Very few have an
 * opinion about everything, and nobody here is a caricature: a lean moves a
 * player a few spots up a list, it doesn't put a third-rounder in the top ten.
 */
export function makeGM({ year = 2026, avoid = [] } = {}) {
  const { name, nat } = staffName(weightedNat(), avoid);
  const r = () => Math.random();
  return {
    name,
    nat,
    since: year,
    // A position he can't get enough of.
    likes: r() < 0.55 ? pickOf(LEANS) : null,
    // Most general managers won't spend a first on a goalie. A few will, and a
    // few won't take one before the third round under any circumstances.
    goalies: r() < 0.16 ? 'early' : r() < 0.2 ? 'late' : 'normal',
    // A country his scouting staff knows better than anybody's.
    // A European in the job usually knows his own country best.
    nation: (nat !== 'CAN' && nat !== 'USA' && r() < 0.6) ? nat : r() < 0.3 ? pickOf(NATIONS) : null,
    // A development path he trusts.
    route: r() < 0.4 ? pickOf(['CHL', 'NCAA', 'EUR']) : null,
    // Ceiling or floor.
    risk: r() < 0.3 ? 'upside' : r() < 0.43 ? 'safe' : null,
    // How readily he moves picks for players who help now.
    dealer: Number((0.2 + r() * 0.8).toFixed(2))
  };
}

function makeOffice(teamId, strength, year, avoid) {
  // A club that has been bad has usually been drafting high, and its cupboard
  // shows it. A good one has been trading picks away.
  const lean = (0.5 - strength) * 0.3;
  const pool = {};
  for (const g of POOL_GROUPS) pool[g] = Number(clamp(0.2 + Math.random() * 0.6 + lean, 0.08, 0.92).toFixed(2));
  return {
    owner: { patience: Number((0.3 + Math.random() * 0.6).toFixed(2)) },
    gm: { ...makeGM({ year: year - Math.floor(Math.random() * 7), avoid }) },
    pool,
    badYears: 0
  };
}

/** Every NHL club has an office. Ones missing from an older save are opened now. */
export function ensureFrontOffices(office, leagueState, year = 2026) {
  const next = { ...(office || {}) };
  const names = Object.values(next).map(o => o?.gm?.name).filter(Boolean);
  for (const t of nhlTeams || []) {
    if (next[t.id]) continue;
    next[t.id] = makeOffice(t.id, teamStrengthOf(leagueState, t.id), year, names);
    names.push(next[t.id].gm.name);
  }
  return next;
}

/**
 * A summer passes in every front office.
 *
 * The pool: some prospects graduate to the NHL, some wash out, and the
 * club's late-round picks, which the game doesn't name, refill it a little.
 * A club that traded its picks away refills it more slowly. Then the owner
 * looks at the season and decides whether his general manager keeps his job.
 *
 * Returns the offices and a list of the changes, for the news.
 */
export function advanceFrontOffices(office, leagueState, year) {
  const next = {};
  const changes = [];
  const names = Object.values(office || {}).map(o => o?.gm?.name).filter(Boolean);

  for (const [id, o] of Object.entries(office || {})) {
    const strength = teamStrengthOf(leagueState, id);
    // About a quarter of a pool moves on every year. What comes in depends on
    // the club's picks, which a contender has often traded, and on what its
    // general manager goes after: the position he likes, or the one his
    // cupboard is barest at.
    const pool = {};
    const base = 0.09 + (0.5 - strength) * 0.05;
    for (const g of POOL_GROUPS) {
      pool[g] = (o.pool?.[g] ?? 0.5) * 0.74 + base + gaussianNoise() * 0.05;
    }
    const thinnest = POOL_GROUPS.filter(g => g !== 'G').sort((a, b) => pool[a] - pool[b])[0];
    const roll = Math.random();
    const firstPick = o.gm?.likes && roll < 0.4 ? o.gm.likes : roll < 0.8 ? thinnest : pickOf(['C', 'W', 'D', 'G']);
    pool[firstPick] += 0.12;
    pool[pickOf(POOL_GROUPS)] += 0.06;
    for (const g of POOL_GROUPS) pool[g] = Number(clamp(pool[g], 0.05, 0.95).toFixed(2));

    // Owners read the standings. A bad year adds to the count, a good one
    // clears it, and an average one takes a little off.
    const badYears = strength < 0.4 ? (o.badYears || 0) + 1
      : strength >= 0.55 ? 0
        : Math.max(0, (o.badYears || 0) - 0.5);
    const tenure = year - (o.gm?.since ?? year);
    const patience = o.owner?.patience ?? 0.6;
    const fireChance = tenure < 2 ? 0
      : clamp(0.05 + badYears * 0.14 * (1.4 - patience), 0, 0.6);
    // Men who have been in the chair a long time leave on their own too.
    const leaveChance = tenure >= 8 ? 0.05 : 0;

    let gm = o.gm;
    const fate = Math.random();
    if (fate < fireChance || fate > 1 - leaveChance) {
      const fired = fate < fireChance;
      gm = makeGM({ year, avoid: names });
      names.push(gm.name);
      changes.push({ teamId: id, out: o.gm?.name, in: gm.name, fired, tenure });
    }

    next[id] = { ...o, gm, pool, badYears: gm === o.gm ? badYears : 0 };
  }
  return { office: next, changes };
}

/** A prospect taken on draft night goes into his new club's pool. */
export function addToPool(office, teamId, pos, round) {
  const o = office?.[teamId];
  if (!o) return office;
  const g = poolGroup(pos);
  const gain = round === 1 ? 0.1 : round === 2 ? 0.06 : 0.03;
  return {
    ...office,
    [teamId]: { ...o, pool: { ...o.pool, [g]: Number(clamp((o.pool?.[g] ?? 0.5) + gain, 0.05, 0.95).toFixed(2)) } }
  };
}
