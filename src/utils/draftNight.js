import { nhlTeams } from '../data/teams';
import { draftOrder, teamStrengthOf } from './leagueState';
import { gaussianNoise } from './production';
import {
  boardOrderPicks, classSalt, DRAFT_DAY_NOISE, LAST_PICK, peerBoardScore,
  playerBoardScore, projectedPeak, roomProspect, TAIL_SPAN
} from './peers';
import { addToPool, ensureFrontOffices, poolGroup, routeOf } from './frontOffice';

// DRAFT NIGHT.
//
// The room used to be one shared board and thirty-two clubs taking whoever was
// left at the top of it, in straight worst-to-first order. Now:
//
//   1. The lottery decides the top of the first round, the way the NHL has run
//      it since 2022: the sixteen clubs out of the playoffs, two draws, and no
//      club moving up more than ten places.
//   2. Picks have changed hands. A club in its window trades its first and
//      second for help now, mostly to clubs that are rebuilding.
//   3. Each club drafts off its own copy of the board, moved by what its
//      prospect pool is short of and by its general manager's habits.
//
// Everything here runs once, on the night, and is kept on the player, so the
// draft screen and the retirement screen read the same room twenty years apart.

const ROUND = 32;
const SIM_ROUNDS = 2;

// The odds for the sixteen clubs that miss the playoffs, worst first, in
// percent. These are the NHL's own numbers.
const LOTTERY_ODDS = [18.5, 13.5, 11.5, 9.5, 8.5, 7.5, 6.5, 6.0, 5.0, 3.5, 3.0, 2.5, 2.0, 1.5, 0.5, 0.5];
const MAX_JUMP = 10;

// How much a club's own needs and its general manager's habits move a prospect
// on its list, in board points. A board point is about two and a half picks in
// the middle of the first round and less than one at the very top, so these
// reorder the room without turning it upside down.
const NEED_WEIGHT = 3.0;
const LIKES = 1.0;
const NATION = 0.9;
const ROUTE = 0.7;
const RISK = 0.12;
const TASTE_NOISE = 0.8;
const GOALIE_PENALTY = { early: 3.5, normal: 5.5, late: 10 };

const GROUP_PLURAL = { C: 'centres', W: 'wingers', D: 'defencemen', G: 'goalies' };
const NATION_ADJ = { CAN: 'Canadian', USA: 'American', SWE: 'Swedish', FIN: 'Finnish', RUS: 'Russian', CZE: 'Czech' };
const ROUTE_TEXT = {
  CHL: 'players who come up through Canadian junior',
  NCAA: 'players who take the college route',
  EUR: 'players developed in Europe'
};

/**
 * The lottery. Returns the first-round order, worst-to-first with the winners
 * moved up, and who won.
 */
export function runLottery(order) {
  const field = order.slice(0, LOTTERY_ODDS.length);
  const rest = order.slice(LOTTERY_ODDS.length);
  const placeOf = new Map(field.map((id, i) => [id, i + 1]));
  const fixed = new Map();           // position in the first round -> club
  const winners = [];

  for (const pickNo of [1, 2]) {
    const open = field.filter(id => ![...fixed.values()].includes(id));
    if (!open.length) break;
    const total = open.reduce((a, id) => a + LOTTERY_ODDS[placeOf.get(id) - 1], 0);
    let roll = Math.random() * total;
    let won = open[open.length - 1];
    for (const id of open) { roll -= LOTTERY_ODDS[placeOf.get(id) - 1]; if (roll <= 0) { won = id; break; } }

    const from = placeOf.get(won);
    if (from - pickNo > MAX_JUMP) {
      // A club can't move up more than ten places. It goes up ten, and the
      // pick it drew falls to the worst club still in the field.
      fixed.set(from - MAX_JUMP, won);
      winners.push({ teamId: won, from, to: from - MAX_JUMP, draw: pickNo, capped: true });
      const worst = field.find(id => ![...fixed.values()].includes(id));
      fixed.set(pickNo, worst);
    } else {
      fixed.set(pickNo, won);
      winners.push({ teamId: won, from, to: pickNo, draw: pickNo });
    }
  }

  // Everybody else keeps his order in the gaps the winners left.
  const others = field.filter(id => ![...fixed.values()].includes(id));
  const round = [];
  for (let pos = 1; pos <= field.length; pos++) round.push(fixed.get(pos) ?? others.shift());
  return { order: [...round, ...rest], winners: winners.filter(w => w.to < w.from) };
}

/**
 * Who owns each pick in the first two rounds.
 *
 * A club in its window trades picks for help, and how readily depends on the
 * man in the chair. The picks go mostly to rebuilding clubs, whose general
 * managers would rather have them than a veteran. Top-five picks almost never
 * move: nobody trades a chance at the best player in the draft.
 */
function pickOwners(round1, standard, office, leagueState) {
  const strength = (id) => teamStrengthOf(leagueState, id);
  const takers = standard.map(id => ({
    id, weight: Math.pow(1 - strength(id), 2) * (0.6 + (1 - (office[id]?.gm?.dealer ?? 0.5)) * 0.4)
  }));
  const owners = [];
  [round1, standard].forEach((order, r) => {
    order.forEach((teamId, i) => {
      const pick = r * ROUND + i + 1;
      const s = strength(teamId);
      const dealer = office[teamId]?.gm?.dealer ?? 0.5;
      let p = 0.1 + Math.max(0, s - 0.55) * 2.4 * (0.4 + dealer);
      if (r === 1) p *= 1.25;
      if (pick <= 5) p *= 0.15;
      let owner = teamId;
      if (Math.random() < Math.min(0.55, p)) {
        const pool = takers.filter(t => t.id !== teamId);
        const total = pool.reduce((a, t) => a + t.weight, 0);
        let roll = Math.random() * total;
        for (const t of pool) { roll -= t.weight; if (roll <= 0) { owner = t.id; break; } }
      }
      owners.push({ pick, round: r + 1, team: owner, from: owner !== teamId ? teamId : null });
    });
  });
  return owners;
}

// What a club adds to a prospect's board score, and why, from its pool and its
// general manager.
function taste(office, c, avgGap) {
  const g = poolGroup(c.pos);
  const gm = office?.gm || {};
  const parts = {
    need: ((0.5 - (office?.pool?.[g] ?? 0.5)) * NEED_WEIGHT),
    likes: gm.likes && gm.likes === g ? LIKES : 0,
    nation: gm.nation && gm.nation === c.nat ? NATION : 0,
    route: gm.route && gm.route === c.route ? ROUTE : 0,
    risk: gm.risk === 'upside' ? (c.gap - avgGap) * RISK : gm.risk === 'safe' ? -(c.gap - avgGap) * RISK : 0,
    goalie: c.pos === 'G' ? -GOALIE_PENALTY[gm.goalies || 'normal'] : 0
  };
  return { parts, total: Object.values(parts).reduce((a, v) => a + v, 0) };
}

/**
 * Run the night.
 *
 * player is the player as he walks into the room, with his class on him.
 * combine is his combine score. Returns the picks, the lottery, his own pick
 * and club and the reason they took him, the class with its picks and clubs
 * set, and the front offices with the night's picks in their pools.
 */
export function runDraftNight(player, { combine = 0, year = 2026 } = {}) {
  const leagueState = player.leagueState;
  let office = ensureFrontOffices(player.frontOffice, leagueState, year);
  const standard = draftOrder(leagueState, nhlTeams || []);
  const lottery = runLottery(standard);
  const owners = pickOwners(lottery.order, standard, office, leagueState);

  // THE ROOM.
  //
  // The class, in board order, with the board score each club starts from.
  const peers = boardOrderPicks(player.peers || []);
  const live = peers.filter(p => p.pick && !p.retired);
  const cands = live.map(p => ({
    key: p.id, peerId: p.id, name: p.name, nat: p.nat, pos: p.pos,
    juniorTeam: p.juniorTeam, juniorLeague: p.juniorLeague,
    route: routeOf(p.juniorLeague), score: peerBoardScore(p),
    gap: Math.max(0, (p.peak || 0) - (p.ovr || 0))
  }));

  // The player, with the night's nerves on his score.
  const myScore = playerBoardScore(player, null, combine) + gaussianNoise() * DRAFT_DAY_NOISE;
  const me = {
    key: 'me', me: true, name: player.name, nat: player.nat || player.nationality, pos: player.pos,
    juniorTeam: player.team, juniorLeague: player.league, route: routeOf(player.league),
    score: myScore, gap: Math.max(0, projectedPeak(player.ovr || 0, player.age || 18) - (player.ovr || 0))
  };
  cands.push(me);

  // The rest of the room. The class sits on about half the picks in the first
  // two rounds, and the prospects outside it fill the others. Each is scored
  // where his slot sits on the board, read off the classmates either side of
  // it, so the room is as deep as the class says it is.
  const skaters = live.filter(p => p.pos !== 'G').map(p => [p.pick, peerBoardScore(p)]).sort((a, b) => a[0] - b[0]);
  const held = new Set(live.map(p => p.pick));
  const scoreAt = (n) => {
    if (!skaters.length) return 60;
    if (n <= skaters[0][0]) return skaters[0][1] + (skaters[0][0] - n) * 1.0;
    const last = skaters[skaters.length - 1];
    if (n >= last[0]) return last[1] - (n - last[0]) * 0.37;
    for (let i = 1; i < skaters.length; i++) {
      const [p1, s1] = skaters[i - 1];
      const [p2, s2] = skaters[i];
      if (n <= p2) return s1 + (s2 - s1) * ((n - p1) / Math.max(1, p2 - p1));
    }
    return last[1];
  };
  const salt = classSalt(peers);
  const taken = new Set(cands.map(c => c.name));
  const classGaps = cands.filter(c => !c.me).map(c => c.gap);
  const avgGap = classGaps.length ? classGaps.reduce((a, v) => a + v, 0) / classGaps.length : 8;
  for (let n = 1; n <= SIM_ROUNDS * ROUND + 24; n++) {
    if (held.has(n)) continue;
    const r = roomProspect(salt, n, taken);
    cands.push({
      key: `room${n}`, name: r.name, nat: r.nat, pos: r.pos,
      juniorTeam: r.juniorTeam, juniorLeague: r.juniorLeague, route: routeOf(r.juniorLeague),
      score: scoreAt(n), gap: avgGap + (r.gap - 0.5) * 8
    });
  }

  // THE PICKS.
  const picks = [];
  const adds = [];
  let available = cands;
  let mine = null;
  for (const slot of owners) {
    const o = office[slot.team];
    let best = null;
    for (const c of available) {
      const t = taste(o, c, avgGap);
      const v = c.score + t.total + gaussianNoise() * TASTE_NOISE;
      if (!best || v > best.v) best = { c, v, t };
    }
    if (!best) break;
    available = available.filter(c => c !== best.c);
    office = addToPool(office, slot.team, best.c.pos, slot.round);
    adds.push({ team: slot.team, pos: best.c.pos, round: slot.round });
    const row = {
      pick: slot.pick, round: slot.round, team: slot.team, from: slot.from,
      name: best.c.name, nat: best.c.nat, pos: best.c.pos,
      juniorTeam: best.c.juniorTeam, juniorLeague: best.c.juniorLeague,
      peerId: best.c.peerId || null, me: !!best.c.me
    };
    picks.push(row);
    if (best.c.me) mine = { ...row, parts: best.t.parts };
  }

  // AFTER THE SECOND ROUND.
  //
  // The game doesn't run rounds three to seven pick by pick. Anyone still on
  // the board goes where his score says, in standard order, the lottery only
  // touching the first round.
  const cutoff = picks.length ? Math.min(...picks.map(r => cands.find(c => c.name === r.name)?.score ?? 99)) : 60;
  const tailPick = (score) => {
    const t = Math.min(1, Math.max(0, cutoff - score) / TAIL_SPAN);
    return Math.min(LAST_PICK, Math.round(SIM_ROUNDS * ROUND + 1 + (LAST_PICK - SIM_ROUNDS * ROUND - 1) * Math.pow(t, 0.75)));
  };
  const usedTail = new Set();
  const tailRow = (c, score) => {
    let n = tailPick(score);
    while (usedTail.has(n) && n < LAST_PICK) n++;
    usedTail.add(n);
    const team = standard.length ? standard[(n - 1) % standard.length] : null;
    if (team) {
      office = addToPool(office, team, c.pos, Math.ceil(n / ROUND));
      adds.push({ team, pos: c.pos, round: Math.ceil(n / ROUND) });
    }
    return {
      pick: n, round: Math.ceil(n / ROUND), team, from: null,
      name: c.name, nat: c.nat, pos: c.pos, juniorTeam: c.juniorTeam, juniorLeague: c.juniorLeague,
      peerId: c.peerId || null, me: !!c.me
    };
  };
  const late = [];
  if (!mine) {
    mine = { ...tailRow(me, myScore), parts: null };
    late.push(mine);
  }
  for (const c of available.filter(x => x.peerId)) {
    // A goalie is scored with the usual reluctance to take one.
    late.push(tailRow(c, c.score - (c.pos === 'G' ? GOALIE_PENALTY.normal : 0)));
  }

  // The class, with the night written onto it.
  const byPeer = new Map([...picks, ...late].filter(r => r.peerId).map(r => [r.peerId, r]));
  const nextPeers = (player.peers || []).map(p => {
    const r = byPeer.get(p.id);
    return r ? { ...p, pick: r.pick, draftedBy: r.team } : p;
  });

  return {
    night: {
      year,
      standard,
      lottery: lottery.winners,
      // eslint-disable-next-line no-unused-vars
      picks: [...picks, ...late.filter(r => r.me)].map(({ parts, ...r }) => r),
      myPick: mine.pick,
      myTeam: mine.team,
      myFrom: mine.from,
      gm: office[mine.team]?.gm?.name || null,
      reason: reasonFor(mine, office[mine.team], lottery.winners)
    },
    peers: nextPeers,
    office,
    // What the night put in each club's pool, so the caller can lay it on
    // top of the offices as they stand when the result is saved.
    adds
  };
}

/**
 * Why the club that took him took him, in a sentence or two, for the draft
 * screen. Built from whatever moved him furthest up their list.
 */
function reasonFor(mine, office, winners) {
  const club = mine.team;
  const gm = office?.gm;
  const lines = [];
  const won = winners.find(w => w.teamId === club && w.to === mine.pick);
  if (won) lines.push({ kind: 'lottery', from: won.from });
  if (mine.from) lines.push({ kind: 'traded', from: mine.from });

  const parts = mine.parts;
  if (parts && gm) {
    const g = poolGroup(mine.pos);
    const best = Object.entries(parts)
      .filter(([k, v]) => k !== 'goalie' && v >= 0.5)
      .sort((a, b) => b[1] - a[1])[0];
    if (best) {
      const [k] = best;
      if (k === 'need') lines.push({ kind: 'need', group: GROUP_PLURAL[g] });
      if (k === 'likes') lines.push({ kind: 'likes', group: GROUP_PLURAL[g] });
      if (k === 'nation' && NATION_ADJ[gm.nation]) lines.push({ kind: 'nation', adj: NATION_ADJ[gm.nation] });
      if (k === 'route' && ROUTE_TEXT[gm.route]) lines.push({ kind: 'route', text: ROUTE_TEXT[gm.route] });
      if (k === 'risk') lines.push({ kind: gm.risk === 'upside' ? 'upside' : 'safe' });
    }
  }
  return { gm: gm?.name || null, lines };
}
