// A tournament, start to finish, as one run.
//
// The old international duty simulated a group stage behind the player's back,
// printed a table of it, and then played three knockout games that were each a
// generic prep scenario followed by a random minigame. Nothing you did touched
// the group, the prep questions had no idea what position you played, and the
// three rounds were the same night three times.
//
// A run is a ladder instead. Every game is one read: you pick a play out of
// your own position's book, the opposition has one of them scouted, and the
// pool gets smaller the further you climb. Plays you have already used are on
// tape and get targeted harder, so by the final you are choosing between
// tendencies they have all seen. Group games bank points. In the knockouts
// being read does not end it on the spot: it drops you into one last-chance
// moment, which is where the minigames live now.
//
// Nothing in here renders; the screen reads the run and calls back into it.

import { getPlaybook } from '../data/intlPlaybook';
import { inIihfEvents } from '../data/teams';
import { PRESTIGE } from './stakes';
import { fanGain, applyOvrDelta, recomputeOvr } from './gameHelpers';
import { inTopOfLineup, nhlRegular } from './roster';
import { getRole } from './appHelpers';
import { isDefence } from './production';

const TOURNEY_NAME = {
  wjc: 'World Juniors',
  olympics: 'Winter Olympics',
  worlds: 'World Championship'
};

// How much room the opposition leaves you, round by round.
//
//   options  how many plays are on the board
//   scouted  how many of them their video staff has ready for you
//   tape     how much of the board is drawn from plays you have already shown
//
// The board is always nine. What changes is how much of it is poisoned: two of
// nine in the opening game, five of nine in a final, with the share they have
// already watched you run climbing alongside it. An opening group game is a
// read you should make; a gold medal game is one you have to earn.
const TOP_LADDER = [
  { key: 'G1', kind: 'group', label: 'Group game 1', short: 'G1', options: 9, scouted: 3, tape: 0.3 },
  { key: 'G2', kind: 'group', label: 'Group game 2', short: 'G2', options: 9, scouted: 3, tape: 0.45 },
  { key: 'G3', kind: 'group', label: 'Group game 3', short: 'G3', options: 9, scouted: 3, tape: 0.6 },
  // The qualification playoff, which is how both the Olympics and the Worlds
  // actually run: the group seeds you into a crossover before the quarters.
  // It also turns a medal into a run of games rather than three of them.
  { key: 'R16', kind: 'knockout', label: 'Qualification playoff', short: 'QUAL', options: 9, scouted: 3, tape: 0.7 },
  { key: 'QF', kind: 'knockout', label: 'Quarter-final', short: 'QF', options: 9, scouted: 3, tape: 0.8 },
  { key: 'SF', kind: 'knockout', label: 'Semi-final', short: 'SF', options: 9, scouted: 3, tape: 0.9 },
  { key: 'FINAL', kind: 'knockout', label: 'Gold medal game', short: 'FINAL', options: 9, scouted: 3, tape: 1 }
];

// The lower divisions play for the room above them, not for a medal.
const LOWER_LADDER = [
  { key: 'G1', kind: 'group', label: 'Group game 1', short: 'G1', options: 9, scouted: 3, tape: 0.3 },
  { key: 'G2', kind: 'group', label: 'Group game 2', short: 'G2', options: 9, scouted: 3, tape: 0.4 },
  { key: 'G3', kind: 'group', label: 'Group game 3', short: 'G3', options: 9, scouted: 3, tape: 0.5 },
  { key: 'G4', kind: 'group', label: 'Group game 4', short: 'G4', options: 9, scouted: 3, tape: 0.75 },
  { key: 'DECIDER', kind: 'knockout', label: 'Decider', short: 'FINAL', options: 9, scouted: 3, tape: 1 }
];

// THE IIHF'S POINTS.
//
// Every IIHF tournament in the game (the World Juniors, the Worlds, the
// Olympics and the lower divisions) scores a group game the same way: three
// for a win in regulation, two for a win in overtime or a shootout, one for a
// loss in overtime or a shootout, and nothing for a loss in regulation. The
// game used to hand a point to every loss, so a 2-4 defeat put a point on the
// board.
const PTS = { win: 3, otWin: 2, otLoss: 1, loss: 0 };
// How often a group game is still tied after sixty minutes. Roughly one in five
// at these tournaments; a game the other side was ready for is a little likelier
// to be close.
const OT_WIN_CHANCE = 0.18;
const OT_LOSS_CHANCE = 0.25;
const groupResult = (won) => {
  const ot = Math.random() < (won ? OT_WIN_CHANCE : OT_LOSS_CHANCE);
  return { ot, pts: won ? (ot ? PTS.otWin : PTS.win) : (ot ? PTS.otLoss : PTS.loss) };
};

// What gets you out of the group is where you finish in it, the way it works
// at the real tournaments, not a points total on your own.
//
//   - World Juniors and Worlds: groups of four here, and the top three go
//     through. Last place plays a relegation game against the other group's
//     last-placed team, and the loser goes down to Division I-A. (Four of five
//     go through at the real World Juniors and the bottom team is relegated.)
//   - Olympics: nobody goes out in the group and nobody is relegated. The
//     group decides the seeding, and the group winner gets a bye past the
//     qualification playoff, the way the top seeds do.
//   - Lower divisions: a group of five. The winner plays for promotion, the
//     last-placed side plays to stay up, everybody else plays for placing.
const TOP_ADVANCE = 3;

const rnd0 = (n) => Math.floor(Math.random() * n);

// One game between two nations the player isn't in, decided by how they
// compare, the same way a game he watched is.
function simGame(a, b) {
  const edge = a.iihfRank != null && b.iihfRank != null
    ? (b.iihfRank - a.iihfRank) * 0.03
    : ((b.tier || 3) - (a.tier || 3)) * 0.17;
  const aWins = Math.random() < 0.5 + Math.max(-0.38, Math.min(0.38, edge));
  const ot = Math.random() < 0.2;
  const loser = ot ? 1 + rnd0(3) : rnd0(3);
  const winner = ot ? loser + 1 : loser + 1 + rnd0(4);
  return aWins
    ? { gf: winner, ga: loser, ot }
    : { gf: loser, ga: winner, ot };
}

// A round robin for the group: the circle method, so nobody plays twice on the
// same day. Returns the days in order with the player's own games first and,
// in a group of five, his day off last.
function roundRobin(ids, meId) {
  const list = ids.length % 2 ? [...ids, null] : [...ids];
  const n = list.length;
  const days = [];
  let rot = [...list];
  for (let d = 0; d < n - 1; d++) {
    const pairs = [];
    for (let i = 0; i < n / 2; i++) {
      const x = rot[i], y = rot[n - 1 - i];
      if (x && y) pairs.push([x, y]);
    }
    days.push(pairs);
    rot = [rot[0], rot[n - 1], ...rot.slice(1, n - 1)];
  }
  const playsMe = (day) => day.some(p => p.includes(meId));
  return [...days.filter(playsMe), ...days.filter(d => !playsMe(d))];
}

// THE GROUP TABLE.
//
// His own games come from the road he's played; everybody else's were played
// out when the tournament was drawn and are shown a matchday at a time. The
// order is the IIHF's: points, then the game between two teams level on
// points, then goal difference, then goals scored.
export function groupTable(run) {
  const g = run?.group;
  if (!g) return [];
  const played = run.road.filter(e => (e.kind ? e.kind === 'group' : /^G\d$/.test(e.key)));
  const myGames = played.length;
  // Everybody's games are in once his last group game is.
  const groupOver = myGames >= run.rounds.filter(r => r.kind === 'group').length || !!run.finish;
  const rows = new Map(g.teams.map(t => [t.id, { ...t, gp: 0, w: 0, otw: 0, otl: 0, l: 0, gf: 0, ga: 0, pts: 0 }]));
  const results = [];
  const add = (home, away, gf, ga, ot) => {
    results.push({ home, away, gf, ga });
    const h = rows.get(home), a2 = rows.get(away);
    if (!h || !a2) return;
    h.gp++; a2.gp++;
    h.gf += gf; h.ga += ga; a2.gf += ga; a2.ga += gf;
    const hw = gf > ga;
    const [w, l] = hw ? [h, a2] : [a2, h];
    if (ot) { w.otw++; w.pts += PTS.otWin; l.otl++; l.pts += PTS.otLoss; }
    else { w.w++; w.pts += PTS.win; l.l++; }
  };
  for (const e of played) {
    const m = /^(\d+)-(\d+)(?:\s+(OT|SO))?/.exec(e.score || '');
    if (!m) continue;
    add(g.meId, e.opponent?.id, +m[1], +m[2], !!m[3]);
  }
  for (const f of g.fixtures) {
    if (f.day <= myGames || groupOver) add(f.home, f.away, f.gf, f.ga, f.ot);
  }
  const headToHead = (x, y) => {
    const r = results.find(q => (q.home === x.id && q.away === y.id) || (q.home === y.id && q.away === x.id));
    if (!r) return 0;
    const xWon = r.home === x.id ? r.gf > r.ga : r.ga > r.gf;
    return xWon ? -1 : 1;
  };
  return [...rows.values()].sort((x, y) =>
    (y.pts - x.pts) || headToHead(x, y) || ((y.gf - y.ga) - (x.gf - x.ga)) || (y.gf - x.gf)
    || ((x.iihfRank ?? 99) - (y.iihfRank ?? 99)));
}

const rnd = rnd0;
const shuffle = (a) => [...a].sort(() => 0.5 - Math.random());

// Who you draw. Top-division nations meet top-division nations; everyone else
// plays inside their own division, topped up by the nearest tiers when the
// division is too small to fill a schedule.
function drawField(player, safeNationalities, division, count) {
  const all = safeNationalities || [];
  const me = all.find(n => n.id === player.nat) || { id: player.nat, name: player.nat, tier: 4 };
  // A suspended nation is in no draw. See IIHF_SUSPENDED.
  let pool = all.filter(n => n.division === division && n.id !== player.nat && inIihfEvents(n.id));
  if (pool.length < count) {
    const filler = all
      .filter(n => n.id !== player.nat && inIihfEvents(n.id) && !pool.some(t => t.id === n.id))
      .sort((a, b) => Math.abs((a.tier || 4) - (me.tier || 4)) - Math.abs((b.tier || 4) - (me.tier || 4)));
    pool = [...pool, ...filler.slice(0, count - pool.length)];
  }
  return shuffle(pool).slice(0, count);
}

// Does the national team give him a letter.
//
// Nothing in the tournament ever mentioned this, and a player who wears an A
// for his club and has been to three of these is exactly who a national staff
// names. It is its own thing: the club letter helps, but what the federation
// is really picking is the man who has been here before and can play.
function nationalLetter(player, nation, context) {
  const hist = player.seasonHistory || [];
  const tournaments = hist.filter(s => s.intlData).length;

  // THE WORLD JUNIORS PICK FROM A DIFFERENT ROOM.
  //
  // The senior rule below scores a teenager in junior hockey so far down
  // (minus sixteen for the league, minus fourteen for his age) that nobody in
  // the tournament could ever be given a letter, the best player in the
  // country included. A junior staff names its captain from the players who
  // already lead their own clubs and have been to one of these before, and
  // the obvious star of the group gets a letter whatever his age.
  if (context === 'wjc') {
    if (player.pos === 'G') return null;
    const before = hist.filter(s => s.intlData && /junior/i.test(String(s.intlData.tournamentName || ''))).length;
    const gen = !!player.isGenerational;
    const elite = (nation?.iihfRank ?? 99) <= 7;
    const bar = elite ? 74 : 66;
    const ovr = player.ovr || 60;
    if ((player.isCaptain || gen) && before >= 1 && ovr >= bar) return 'C';
    if ((player.isCaptain || player.isAlternate || gen) && ovr >= bar - 2) return 'A';
    if (!elite && ovr >= bar + 4) return 'A';
    return null;
  }

  // How a federation picks its captain.
  //
  // This was overall rating with three small bonuses bolted on, which meant a
  // twenty-one-year-old in the AHL with a high rating could be handed the C
  // for Canada. A national captaincy is handed out on a career rather than a
  // rating: how long he has been coming, what he has won while he was there, whether his own club
  // trusts him with a letter, how old he is, and whether he is playing at the
  // level the rest of the room plays at.

  // Medals already won in this sweater. A man with two golds does not have to
  // argue for the job.
  const medals = hist.reduce((n, s) => {
    if (!s.intlData) return n;
    const aw = (s.awards || []).join(' ');
    if (aw.includes('Gold')) return n + 3;
    if (aw.includes('Silver') || aw.includes('Bronze')) return n + 1;
    return n;
  }, 0);

  // The room he plays in week to week. A national staff is choosing among men
  // who are in the best league in the world; somebody in the minors is not in
  // that conversation however he is rated.
  const level = player.league === 'NHL' ? 10
    : ['KHL', 'SHL', 'LIIGA', 'SWISS', 'CZECH'].includes(player.league) ? 4
      : ['AHL', 'DEL', 'SLOVAK', 'ICEHL'].includes(player.league) ? -8
        : -16;

  // Twenty-five is young for this and thirty is not. It falls away again at
  // the very end, when the letter tends to pass to somebody with years left.
  const age = player.age || 24;
  const maturity = age < 23 ? -14 : age < 25 ? -6 : age < 27 ? 0 : age < 35 ? 6 : 2;

  // GOALIES DO NOT WEAR LETTERS.
  //
  // Not a judgement call: the rule book does not allow a goaltender to be
  // captain, and no federation names one as an alternate either. A
  // twenty-four-year-old backup was being handed an A for the United States
  // on the strength of an overall rating, which is two separate things wrong
  // at once.
  if (player.pos === 'G') return null;

  // And a man who does not play does not lead. The letter goes to somebody in
  // the top six or the top pair, not to whoever is rated highest on a roster
  // sheet. Last season is the evidence.
  const lastYear = [...hist].reverse().find(ss => (ss.games || 0) > 0) || null;
  const workload = lastYear?.avgToi || 0;
  const regular = (lastYear?.games || 0) >= 35;

  const clubLetter = player.isCaptain ? 10 : player.isAlternate ? 5 : 0;
  const profile = Math.min(8, Math.floor((player.fanStatus || 0) / 90));
  const trusted = ((player.relationships?.teammates ?? 50) - 50) * 0.12;

  const standing = (player.ovr || 60)
    + clubLetter
    + Math.min(6, tournaments) * 3
    + Math.min(12, medals * 2)
    + level
    + maturity
    + profile
    + trusted;

  // A hockey nation does not hand its captaincy to a man who does not wear a
  // letter for his own club. Canada, Russia, Sweden and the rest pick from a
  // room full of NHL captains, and the C goes to one of them. A smaller
  // federation is a different room: there, being the best player in it is the
  // qualification, and plenty of those captains wear nothing at home.
  const eliteNation = (nation?.iihfRank ?? 99) <= 7;

  if (eliteNation) {
    // Hard conditions before the score is even consulted, every one of them
    // something a real captain of these countries has had. A letter at club
    // level is not negotiable here: these rooms are full of NHL captains and
    // the staff picks from inside that group.
    if (!regular || workload < 15) return null;
    if (player.isCaptain && tournaments >= 4 && age >= 26 && level >= 4 && standing >= 118) return 'C';
    if (clubLetter > 0 && tournaments >= 2 && age >= 24 && level >= 4 && standing >= 108) return 'A';
    return null;
  }

  // A smaller federation picks from a smaller room, so being its best player
  // is a real qualification. He still has to be playing.
  if (!regular) return null;
  if (standing >= 102 && tournaments >= 3) return 'C';
  if (standing >= 90 && tournaments >= 1) return 'A';
  return null;
}

// WHERE HE SITS ON THE DEPTH CHART.
//
// Everybody who went to a tournament played every game of it, which is true
// of a starting goalie and nobody else. A national team carries three goalies
// and a couple of extra skaters, and the man at the bottom of the chart
// watches more than he plays. So the run works out where he stands against
// the level of the room he's in: a goalie short of it is the backup and gets
// one group game, a skater well short of it is the extra man and sits two of
// them. If the team loses a game he watched, the staff puts him in for the
// next one and he keeps the spot.
//
// The bar is the rating a regular in that room has: higher for the strongest
// nations, lower at the Worlds (half the best players are in the playoffs),
// and a junior scale at the World Juniors. A man with a letter is never at
// the bottom of the chart.
function squadRole(player, me, context, letter) {
  if (letter) return null;
  // An established NHL player is not the extra man. A first- or second-line
  // forward, a top-four defenceman or a starting goalie in the NHL plays every
  // game for anybody, at the Olympics included; any NHL regular plays every
  // game at the Worlds and the World Juniors. The bar below is for everybody
  // else, which is most of all the junior years.
  if (nhlRegular(player) && (inTopOfLineup(player, getRole) || context !== 'olympics')) return null;
  const rank = me?.iihfRank ?? 20;
  const senior = rank <= 4 ? 86 : rank <= 7 ? 82 : rank <= 12 ? 76 : 70;
  const bar = context === 'wjc' ? senior - 10 : context === 'worlds' ? senior - 3 : senior;
  const ovr = player.ovr || 60;
  if (player.pos === 'G') {
    // He plays the second group game, and the fourth in a lower division.
    return ovr < bar ? { role: 'backup', dress: ['G2', 'G4'] } : null;
  }
  return ovr < bar - 4 ? { role: 'extra', bench: ['G1', 'G3'] } : null;
}

// Whether he's out of the lineup for this round.
export function sitsOut(run, round) {
  const d = run?.depth;
  if (!d || run.promoted || !round) return false;
  if (d.dress) return !d.dress.includes(round.key);
  return (d.bench || []).includes(round.key);
}

// A game he watched. The team's result comes from how the two nations
// compare, since nothing he does tonight touches it.
export function resolveSat(run) {
  const round = run.rounds[run.index];
  // By world ranking where both have one, which separates Canada from Latvia
  // inside the same tier, and by tier where they don't.
  const oppRank = round.opponent?.iihfRank;
  const edge = oppRank != null && run.myRank != null
    ? (oppRank - run.myRank) * 0.03
    : ((round.opponent?.tier || 3) - (run.myTier || 2)) * 0.17;
  const chance = 0.52 + Math.max(-0.38, Math.min(0.38, edge));
  const won = Math.random() < chance;
  const result = round.kind === 'group' ? groupResult(won) : { ot: false, pts: 0 };
  const pts = result.pts;
  const line = { g: 0, a: 0, pm: 0, blk: 0, sog: 0, fot: 0, fow: 0, saves: 0, shots: 0, sho: 0 };
  const entry = {
    key: round.key, kind: round.kind, label: round.label, short: round.short, opponent: round.opponent,
    won, clean: won, rescued: false, ot: result.ot, score: scoreline(won, won, result.ot), line, pts, sat: true
  };
  return {
    sat: true,
    survived: won,
    clean: won,
    entry,
    // A loss he watched gets him in the next one.
    promotedNow: !won,
    nextRun: { ...run, points: run.points + pts, promoted: run.promoted || !won, road: [...run.road, entry] }
  };
}

export function buildRun({ player, safeNationalities, context, division, year }) {
  const isTopDiv = division === 'Top Division';
  const isOlympics = context === 'olympics';
  // The Olympics are a sixteen-nation tournament with no divisions attached, so
  // even a smaller federation that qualifies plays the full bracket.
  const ladder = (isTopDiv || isOlympics) ? TOP_LADDER : LOWER_LADDER;
  // One spare nation on top of the schedule: the bronze game only exists if
  // you lose a semi-final, and it needs somebody to play.
  const field = drawField(player, safeNationalities, division, ladder.length + 1);

  // SEEDING.
  //
  // The field used to be shuffled and dealt out in order, so the gold medal
  // game was whoever happened to come up fourth. That is how a World Junior
  // final ends up being played against Austria. A tournament seeds: the
  // nations that survive to the last rounds are the ones who were good enough
  // to get there, and the group stage is where you meet everybody else.
  //
  // Ranked by IIHF position, which the nations already carry, and handed out
  // strongest to the round that matters most. Inside the group stage the order
  // is still a shuffle, because a group draw is a draw.
  // Noise on the seeding, because a bracket is not a ranking. Without it the
  // strongest nation in the draw played the final every single time: over
  // three hundred tournaments a Canadian met Russia in the gold medal game in
  // 188 of them. A few places of slack lets a Finland or a Sweden get through
  // instead, and still keeps Austria out of it.
  const byStrength = [...field]
    .map(n2 => ({ n2, seed: (n2.iihfRank ?? 99) + (Math.random() * 2 - 1) * 3 }))
    .sort((a, b) => a.seed - b.seed)
    .map(e => e.n2);
  const WEIGHT = { FINAL: 5, DECIDER: 5, SF: 4, QF: 3, R16: 2 };
  const stageOrder = ladder
    .map((r, i) => ({ i, w: WEIGHT[r.key] ?? 0 }))
    .sort((a, b) => b.w - a.w || a.i - b.i);

  const assigned = [];
  stageOrder.forEach((slot, n) => { assigned[slot.i] = byStrength[n]; });
  // The spare, for a bronze game, is whoever is left.
  const spareNation = byStrength[stageOrder.length] || byStrength[byStrength.length - 1];

  // Group games keep a random order among themselves.
  const groupIdx = ladder.map((r, i) => (WEIGHT[r.key] ? null : i)).filter(i => i !== null);
  const groupNations = shuffle(groupIdx.map(i => assigned[i]));
  groupIdx.forEach((i, k) => { assigned[i] = groupNations[k]; });

  const rounds = ladder.map((r, i) => ({
    ...r,
    opponent: assigned[i] || field[i] || { id: 'TBD', name: 'TBD', tier: 3 }
  }));

  // One play this group has run together since they were sixteen. It beats
  // anybody, including a staff that has it on tape, because the five of them
  // do it without looking. Not every squad has one, and you only know which
  // one it is if you read the room well enough to have noticed.
  const book = getPlaybook(player.pos);
  const hasFavourite = Math.random() < 0.3;
  const favourite = hasFavourite ? book[rnd(book.length)].id : null;
  // Whether you can see it. A letter means you are in the meetings where this
  // gets talked about; otherwise it takes a genuinely high read of the game.
  const me = (safeNationalities || []).find(n => n.id === player.nat) || null;
  const letter = nationalLetter(player, me, context);
  // Whether this is the first time. The federation naming you is a moment and
  // the tournament screen never said a word about it.
  const previousLetter = [...(player.seasonHistory || [])]
    .reverse()
    .map(ss => ss.intlData?.letter)
    .find(l => l !== undefined) ?? null;
  const letterIsNew = !!letter && letter !== previousLetter;
  const seesFavourite = !!favourite && (
    !!letter || (player.hockeyIQ || 50) >= 82
  );

  const depth = squadRole(player, me, context, letter);

  // The group: him and the nations he meets in it, drawn in the order the
  // round robin plays them, and everybody else's games played out now.
  const groupRounds = rounds.map((r, i) => ({ r, i })).filter(x => x.r.kind === 'group');
  const meNation = me || { id: player.nat, name: player.nat, tier: 4 };
  const groupTeams = [meNation, ...groupRounds.map(x => x.r.opponent)].filter(Boolean);
  const days = roundRobin(groupTeams.map(t => t.id), meNation.id);
  const byId = new Map(groupTeams.map(t => [t.id, t]));
  // His opponents in the order the schedule has them.
  days.forEach((day, d) => {
    const mine = day.find(p => p.includes(meNation.id));
    if (mine && groupRounds[d]) {
      const oppId = mine[0] === meNation.id ? mine[1] : mine[0];
      rounds[groupRounds[d].i] = { ...rounds[groupRounds[d].i], opponent: byId.get(oppId) };
    }
  });
  const fixtures = [];
  days.forEach((day, d) => {
    for (const [x, y] of day) {
      if (x === meNation.id || y === meNation.id) continue;
      fixtures.push({ day: d + 1, home: x, away: y, ...simGame(byId.get(x), byId.get(y)) });
    }
  });
  const group = {
    meId: meNation.id,
    teams: groupTeams.map(t => ({ id: t.id, name: t.name, iihfRank: t.iihfRank, tier: t.tier })),
    fixtures
  };
  // Who he'd meet in a relegation game at the World Juniors or the Worlds: the
  // weakest of the other top-division nations, standing in for the other
  // group's last-placed side.
  const others = (safeNationalities || []).filter(n => n.division === division && n.id !== meNation.id
    && !groupTeams.some(t => t.id === n.id));
  const relegationOpponent = [...others].sort((x, y) => (y.iihfRank ?? 99) - (x.iihfRank ?? 99))[0] || spareNation;

  return {
    context,
    depth,
    promoted: false,
    myTier: me?.tier || 2,
    myRank: me?.iihfRank ?? null,
    tournamentName: TOURNEY_NAME[context] || 'World Championship',
    year,
    division,
    favourite,
    seesFavourite,
    letter,
    letterIsNew,
    isTopDiv: isTopDiv || isOlympics,
    isOlympics,
    rounds,
    spare: spareNation || { id: 'TBD', name: 'TBD', tier: 3 },
    group,
    groupRank: null,
    relegationOpponent,
    index: 0,
    points: 0,
    usedPlays: [],
    timeoutUsed: false,
    // One escape per tournament. Being read in a knockout puts the game on a
    // last-chance moment, but only the first time: after that they have you.
    escapeUsed: false,
    road: [],
    stats: { games: 0, g: 0, a: 0, pm: 0, blk: 0, sog: 0, fot: 0, fow: 0, saves: 0, shots: 0, sho: 0 },
    // Filled in when the run ends.
    finish: null
  };
}

// The options for the round you are about to play, and which one they have.
//
// The scouted play is drawn with a weight, not uniformly: the video staff is
// looking at what you already did in this tournament, so a play that is on tape
// is three times as likely to be the one they sit on. That is what makes the
// shrinking pool bite. By the final there is barely anything left that they
// have not seen you do.
export function prepareRound(run, player) {
  const base = run.rounds[run.index];
  if (!base) return null;
  // Never close the board past the point where a safe play exists.
  // Nine on the board and three of them scouted, every round, for everybody.
  // What a player's own game buys him is what he can see of it: the read that
  // flags one of the three, and whether he knows the squad has a play of its
  // own.
  const round = base;

  const book = getPlaybook(player.pos);
  const used = run.usedPlays;
  const fresh = shuffle(book.filter(p => !used.includes(p.id)));
  const onTape = shuffle(book.filter(p => used.includes(p.id)));

  // Load the pool with what they have already seen you do, more of it every
  // round. Without this a player could simply keep picking plays he had never
  // used and walk the whole tournament on fresh ice.
  const wantTape = Math.min(onTape.length, Math.round(round.options * (round.tape ?? 0.4)));
  // The squad's own play is always on the board. It is the only input here that
  // does not change from round to round.
  const options = shuffle([
    ...onTape.slice(0, wantTape),
    ...fresh.slice(0, round.options - wantTape),
    // Short of plays (a long run through a small book): take whatever is left.
    ...onTape.slice(wantTape)
  ].slice(0, round.options));

  if (run.favourite && !options.some(o => o.id === run.favourite)) {
    const fav = book.find(p2 => p2.id === run.favourite);
    if (fav) options[rnd(options.length)] = fav;
  }

  // Which ones they are sitting on. Drawn with a weight rather than evenly:
  // the video staff looks at your own tape first, so a play you have shown is
  // likelier to be one of the ones they have ready.
  const scoutedIds = [];
  // The squad's own play is never on the scouted list. Knowing it is coming is
  // not the same as stopping it when five men have run it a thousand times.
  const pool = options.filter(o => o.id !== run.favourite);
  const want = Math.min(round.scouted ?? 1, Math.max(1, options.length - 1));
  while (scoutedIds.length < want && pool.length > 1) {
    const weights = pool.map(p => (used.includes(p.id) ? 1.15 : 1));
    const total = weights.reduce((a, b) => a + b, 0);
    let roll = Math.random() * total;
    let hit = pool.length - 1;
    for (let i = 0; i < pool.length; i++) {
      roll -= weights[i];
      if (roll <= 0) { hit = i; break; }
    }
    scoutedIds.push(pool[hit].id);
    pool.splice(hit, 1);
  }

  // What you see coming. Hockey IQ buys a chance that one of the scouted plays
  // is flagged before you choose, and it is worth more the tighter the pool
  // gets: taking one bad option off a board of four is half the danger gone.
  const iq = player.hockeyIQ || 50;
  const readChance = Math.max(0, Math.min(0.5, (iq - 55) / 90));
  const flagged = Math.random() < readChance ? scoutedIds[rnd(scoutedIds.length)] : null;

  return { round, options, scoutedIds, flagged };
}

// A clean night on the scoresheet, scaled by what the player is.
function produce(player, isClean, oppTier) {
  const ovr = player.ovr || 70;
  const pos = player.pos;
  const edge = Math.max(0.25, Math.min(1.35, (ovr - 55) / 30)) * (isClean ? 1 : 0.35);
  const tierPull = 1 + ((oppTier || 3) - 2) * 0.08;

  if (pos === 'G') {
    const shots = 22 + rnd(16);
    const blank = { g: 0, a: 0, pm: 0, blk: 0, sog: 0, fot: 0, fow: 0 };

    // A SHUTOUT IS DRAWN, NOT WAITED FOR.
    //
    // It used to be whatever fell out of the save percentage: sho was set when
    // the rounded save total happened to equal the shot total. Stopping every
    // one of thirty-odd shots needs a .986 and the band is capped at .99
    // before rounding, so across ten thousand simulated tournament games it
    // never once happened. The screen has a shutout column that could not be
    // filled in and the record book has an international shutout nobody could
    // ever set.
    const shutoutOdds = isClean
      ? Math.max(0.02, Math.min(0.20, (0.05 + (ovr - 75) * 0.005) * tierPull))
      : 0;
    if (Math.random() < shutoutOdds) return { shots, saves: shots, sho: 1, ...blank };

    const basePct = isClean ? 0.925 : 0.868;
    const pct = Math.max(0.78, Math.min(0.985, basePct + (ovr - 75) * 0.0014 + (Math.random() - 0.5) * 0.035));
    // One short of perfect at worst, so the only clean sheets are the drawn
    // ones and a 1-0 win is never printed over a line that let nothing in.
    const saves = Math.min(shots - 1, Math.round(shots * pct));
    return { shots, saves, sho: 0, ...blank };
  }

  const isD = isDefence(pos);
  const gRate = edge * tierPull * (isD ? 0.26 : 0.62);
  const aRate = edge * tierPull * (isD ? 0.72 : 0.78);
  const roll = (rate) => (Math.random() < rate ? 1 : 0) + (Math.random() < rate * 0.25 ? 1 : 0);
  return {
    g: roll(gRate), a: roll(aRate),
    pm: (isClean ? 1 : -1) * rnd(3),
    // Shot blocking, so a defenceman's tournament is reported in the same
    // numbers his season is. A short tournament is a handful of games, so this
    // is a game's worth at a time rather than a season's.
    blk: isD ? 1 + rnd(3) : rnd(2),
    // And his shots and his draws, for the same reason: the retirement screen
    // shows a tournament beside a club season, and the club season reports a
    // shooting percentage and a faceoff percentage that the tournament had no
    // way of producing. A game's worth at a time, on the same scale the season
    // simulator uses, so the two tables can sit next to each other.
    sog: Math.max(0, 1 + rnd(isD ? 2 : 4)),
    ...(() => {
      if (pos !== 'C') return { fot: 0, fow: 0 };
      const taken = 12 + rnd(10);
      // A better centre wins more of them, and the best in the world are
      // taking draws against the best in the world, so the band is tighter
      // here than it is against an ordinary league.
      const pct = Math.max(0.40, Math.min(0.60, 0.48 + (ovr - 78) * 0.0018 + (Math.random() - 0.5) * 0.05));
      return { fot: taken, fow: Math.round(taken * pct) };
    })(),
    saves: 0, shots: 0, sho: 0
  };
}

// One game, resolved. `rescued` is a knockout saved by the last-chance moment.
export function resolvePick(run, player, { playId, scoutedIds = [], rescued = null, rescueKind = null }) {
  const round = run.rounds[run.index];
  const wasRead = scoutedIds.includes(playId);
  // Being read in a knockout is not elimination on its own: it is the moment
  // that goes to the last-chance play, and that decides it.
  const clean = !wasRead;
  const survived = clean || rescued === true;

  const line = produce(player, clean, round.opponent?.tier);

  // A GOALTENDER'S SCORELINE IS HIS OWN STAT LINE.
  //
  // These were two unrelated rolls. produce() drew his shots and his saves,
  // scoreline() drew a result, and nothing ever introduced them, so he could
  // win a game 3-1 and read "20/22 SAVES · 2 GA" underneath it. Which is to
  // say the screen told him he had let in two goals in a game the other side
  // scored one.
  //
  // His save total decides it now: the goals he let in ARE the other team's
  // score. Done this way round rather than the other so a better goaltender
  // still saves more pucks; deriving his saves from a drawn scoreline would
  // have made every goalie in the tournament identical.
  //
  // One guard. A loss needs a goal in it, and an elite goalie on a bad night
  // can round up to a shutout, which would leave him beaten 0-0.
  if (player.pos === 'G' && !survived && line.shots - line.saves === 0) {
    line.saves = Math.max(0, line.saves - 1);
    line.sho = 0;
  }
  // THE MOMENT THAT SAVED IT GOES ON THE SCORESHEET.
  //
  // A knockout he dragged out of the fire with the last-chance game was won by
  // what he did in it, and the line used to say nothing of it: a one-timer
  // buried in overtime and 0G under the score. Now a scoring moment is his
  // goal, a breakout pass is the assist on it, a block is a block and a save
  // is a save. A shootout winner is credited as a shootout winner rather than
  // a goal, because that's how the record is kept: shootout goals aren't
  // counted in a player's stats anywhere.
  let shootoutWinner = false;
  if (rescued === true && rescueKind) {
    if (['onetimer', 'deflection', 'deke', 'zone_battle'].includes(rescueKind)) {
      line.g += 1; line.sog = (line.sog || 0) + 1; line.pm += 1;
    } else if (rescueKind === 'breakout') {
      line.a += 1; line.pm += 1;
    } else if (rescueKind === 'shotblock') {
      line.blk = (line.blk || 0) + 3;
    } else if (rescueKind === 'shootout') {
      shootoutWinner = true;
    } else if (player.pos === 'G') {
      const stopped = { breakaway: 1, screened: 1, rebound: 3, crease: 4 }[rescueKind] || 1;
      line.saves += stopped; line.shots += stopped;
    }
  }
  line.soWinner = shootoutWinner;

  const goalsAgainst = player.pos === 'G' ? line.shots - line.saves : null;

  const stats = {
    games: run.stats.games + 1,
    g: run.stats.g + line.g,
    a: run.stats.a + line.a,
    pm: run.stats.pm + line.pm,
    blk: (run.stats.blk || 0) + (line.blk || 0),
    sog: (run.stats.sog || 0) + (line.sog || 0),
    fot: (run.stats.fot || 0) + (line.fot || 0),
    fow: (run.stats.fow || 0) + (line.fow || 0),
    saves: run.stats.saves + line.saves,
    shots: run.stats.shots + line.shots,
    sho: run.stats.sho + line.sho
  };

  // Three for a win, one for losing it after sixty minutes. Being read in the
  // group is a bad night, not an exit, and the points table is what decides
  // whether the tournament carries on.
  // The IIHF's points, and whether it took overtime to decide. A knockout
  // saved by the last-chance moment went long by definition, and one saved in
  // a shootout says so.
  const result = round.kind === 'group' ? groupResult(clean) : { ot: false, pts: 0 };
  const pts = result.pts;
  const wentLong = rescued !== null || result.ot;
  const score = scoreline(clean, survived, wentLong, goalsAgainst, shootoutWinner, line.g || 0);

  // EARNING THE NEXT ONE.
  //
  // The extra man sat the games on his list whatever he'd done in the one he
  // played, so two assists on Tuesday bought him the press box on Wednesday.
  // A big night now keeps him in: two points for a skater, or a win with a
  // .930 or a shutout for a backup goalie.
  const big = player.pos === 'G'
    ? survived && (line.sho || (line.shots > 0 && line.saves / line.shots >= 0.93))
    : (line.g + line.a) >= 2;
  const earnedSpot = !!run.depth && !run.promoted && big;

  const entry = {
    key: round.key,
    kind: round.kind,
    label: round.label,
    short: round.short,
    opponent: round.opponent,
    won: survived,
    clean,
    rescued: wasRead && rescued === true,
    ot: wentLong,
    score,
    line,
    pts,
    playId
  };

  return {
    wasRead,
    clean,
    survived,
    entry,
    earnedSpot,
    nextRun: {
      ...run,
      promoted: run.promoted || earnedSpot,
      escapeUsed: run.escapeUsed || rescued !== null,
      points: run.points + pts,
      usedPlays: run.usedPlays.includes(playId) ? run.usedPlays : [...run.usedPlays, playId],
      stats,
      road: [...run.road, entry]
    }
  };
}

// A game that came down to the last-chance moment was tied when that play
// happened, and the play decided it. Those are overtime results either way,
// and the scoreline should say so.
// minFor is his own goals tonight: the team can't have scored fewer than he did.
function scoreline(clean, survived, wentToOt, goalsAgainst = null, shootout = false, minFor = 0) {
  const tag = shootout ? 'SO' : 'OT';
  // With a goaltender in net the other team's score is not a free choice: it
  // is what he let in. Only our own end of it is drawn.
  if (goalsAgainst != null) {
    const ga = Math.max(0, goalsAgainst);
    if (wentToOt) return survived ? `${ga + 1}-${ga} ${tag}` : `${Math.max(0, ga - 1)}-${ga} ${tag}`;
    return survived ? `${ga + 1 + rnd(2)}-${ga}` : `${Math.max(0, ga - 1 - rnd(2))}-${ga}`;
  }
  if (wentToOt) {
    const gf = Math.max(2 + rnd(3), survived ? minFor : minFor + 1);
    return survived ? `${gf}-${gf - 1} ${tag}` : `${gf - 1}-${gf} ${tag}`;
  }
  if (clean) {
    const gf = Math.max(3 + rnd(3), minFor);
    return `${gf}-${Math.max(0, gf - 2 - rnd(2))}`;
  }
  const ours = Math.max(minFor, 2 + rnd(3) - 1 - rnd(2));
  return `${ours}-${Math.max(ours + 1, 3 + rnd(3))}`;
}

// Where the run stands after a game: does it carry on, and into what.
export function advanceRun(run, { survived }) {
  const round = run.rounds[run.index];
  const isLast = run.index >= run.rounds.length - 1;

  if (round.kind === 'group') {
    const groupLeft = run.rounds.slice(run.index + 1).some(r => r.kind === 'group');
    if (groupLeft) return { ...run, index: run.index + 1 };

    // Group is done. Where he finished decides what's next.
    const table = groupTable({ ...run, finish: null, index: run.rounds.length });
    // A tournament already under way when groups came in has no table: it
    // goes on its points, one win being enough, as it did before.
    const rank = run.group
      ? Math.max(1, table.findIndex(t => t.id === run.group.meId) + 1)
      : (run.points >= 3 ? 1 : 4);
    const ranked = { ...run, groupRank: rank };
    const next = run.index + 1;

    if (run.isOlympics) {
      // Everybody plays on. The group winner skips the qualification playoff.
      const rounds = rank === 1 ? run.rounds.filter(r => r.key !== 'R16') : run.rounds;
      return { ...ranked, rounds, index: next };
    }
    if (run.isTopDiv) {
      if (rank <= TOP_ADVANCE) return { ...ranked, index: next };
      // Last in the group: one game to stay in the top division, and the
      // tournament ends either way.
      const releg = {
        key: 'RELEG', kind: 'knockout', label: 'Relegation game', short: 'RELEG', decider: 'SURVIVAL',
        options: 9, scouted: 3, tape: 1, opponent: run.relegationOpponent || run.spare
      };
      return { ...ranked, rounds: [...run.rounds.slice(0, next), releg], index: next };
    }
    // The lower divisions: the winner plays for promotion, the bottom side to
    // stay up, the rest for placing, each against the side next to them.
    const last = table.length;
    const decider = rank === 1 ? 'PROMOTION' : rank === last ? 'SURVIVAL' : 'PLACEMENT';
    const oppRow = rank === 1 ? table[1] : rank === last ? table[last - 2] : table[rank % 2 === 0 ? rank : rank - 2];
    const oppNation = oppRow ? { id: oppRow.id, name: oppRow.name, iihfRank: oppRow.iihfRank, tier: oppRow.tier } : null;
    const rounds = run.rounds.map((r, i) =>
      i === next
        ? { ...r, decider, opponent: oppNation || r.opponent,
            label: decider === 'PROMOTION' ? 'Promotion final'
              : decider === 'SURVIVAL' ? 'Relegation game' : 'Placement game' }
        : r);
    return { ...ranked, rounds, index: next };
  }

  // Knockout.
  if (!survived) {
    // A semi-final loser plays for bronze, the way he does in the real
    // tournament. This used to hand him the medal for losing, which made it the
    // cheapest medal in the game.
    if (round.key === 'SF') {
      const bronze = {
        key: 'BRONZE', kind: 'knockout', label: 'Bronze medal game', short: 'BRONZE',
        options: 9, scouted: 3, tape: 1, opponent: run.spare
      };
      const rounds = [...run.rounds];
      rounds.splice(run.index + 1, 0, bronze);
      return { ...run, rounds, index: run.index + 1 };
    }
    return { ...run, finish: { type: 'LOSS', at: round.key, decider: round.decider } };
  }
  if (isLast || round.key === 'BRONZE' || round.key === 'FINAL') {
    return { ...run, finish: { type: 'WIN', at: round.key, decider: round.decider } };
  }
  return { ...run, index: run.index + 1 };
}

// What the run was worth, and what it did to a career.
//
// Medals are paid by where you finished rather than by the last game, because
// paying per-game put the finishes in the wrong order: a silver medallist had
// technically just lost, and came out behind the bronze winner who had won.
const FINISH_VALUE = { Gold: 130, Silver: 70, Bronze: 55, Fourth: -15 };

export function describeFinish(run) {
  const f = run.finish;
  if (!f) return null;

  const won = f.type === 'WIN';

  if (!run.isTopDiv) {
    if (f.type === 'GROUP_EXIT') return { kind: 'PLACEMENT', won: false };
    const decider = f.decider;
    if (decider === 'PROMOTION') return { kind: won ? 'PROMOTED' : 'PROMOTION_MISSED' };
    if (decider === 'SURVIVAL') return { kind: won ? 'SURVIVED' : 'RELEGATED' };
    return { kind: 'PLACEMENT', won };
  }

  if (f.decider === 'SURVIVAL') return { kind: won ? 'SURVIVED' : 'RELEGATED' };
  if (f.type === 'GROUP_EXIT') return { kind: 'GROUP_EXIT' };
  if (f.at === 'FINAL') return { kind: 'MEDAL', medal: won ? 'Gold' : 'Silver' };
  if (f.at === 'BRONZE') return won ? { kind: 'MEDAL', medal: 'Bronze' } : { kind: 'FOURTH' };
  return { kind: 'KO_EXIT', lostAt: f.at };
}

/**
 * Commits a finished run to the player: fan status, any medal, promotion or
 * relegation, the achievement, and the season history entry the retirement
 * screen reads.
 */
export function commitRun({ run, player, safeNationalities, unlockAchievement }) {
  const nat = (safeNationalities || []).find(n => n.id === player.nat);
  const countryName = nat?.sentenceName || nat?.name || 'your country';
  // The same name at the start of a sentence. sentenceName is written to sit
  // mid-sentence ("the United States"), so a line that opened with it printed
  // "You won it. the United States are champions".
  const CountryName = countryName.charAt(0).toUpperCase() + countryName.slice(1);
  const outcome = describeFinish(run);
  const prestige = PRESTIGE[run.context] ?? 1;

  // Every branch of the switch below sets these, default included.
  let fanDelta;
  let headline;
  let detail;
  let ovrDelta = 0;
  let awardName = '';
  let updated = { ...player };

  // The World Juniors have their own divisions. A nation can be in the top
  // one at the Worlds and in Division I at the under-20s, so the two are kept
  // apart: the junior one on natDivU20, the senior one on natDiv.
  const junior = run.context === 'wjc';
  const tier = (junior ? player.natTierU20 : player.natTier) || nat?.tier || 1;
  const setDivision = (newTier, name) => {
    if (junior) { updated.natTierU20 = newTier; updated.natDivU20 = name; }
    else { updated.natTier = newTier; updated.natDiv = name; }
  };

  switch (outcome?.kind) {
    case 'MEDAL': {
      awardName = outcome.medal;
      fanDelta = Math.round(FINISH_VALUE[awardName] * prestige);
      ovrDelta = awardName === 'Gold' ? 1 : 0;
      headline = `${awardName} medal`;
      detail = awardName === 'Gold'
        ? (run.context === 'olympics'
          ? `Olympic gold! ${CountryName} are champions, and you were on the ice when the horn went. There are gloves and sticks all over the ice, and somebody is already handing you a flag.`
          : run.context === 'wjc'
            ? `World junior champions! ${CountryName} are on top of the world, the bench empties over the boards, and you end up at the bottom of the pile in the corner with the whole team on top of you.`
            : `World champions! The bench empties over the boards and you end up at the bottom of the pile with the rest of ${countryName}, and nobody is in any hurry to get up.`)
        : awardName === 'Silver'
          ? `One game short. Silver for ${countryName}, and it will take a while to feel like a medal.`
          : `A bronze medal for ${countryName} after falling in the semi-final.`;
      if (awardName === 'Gold') unlockAchievement?.('gold_medal');
      break;
    }
    case 'KO_EXIT': {
      fanDelta = Math.round(-8 * prestige);
      headline = 'Knocked out';
      detail = `${CountryName} are out at the ${outcome.lostAt === 'QF' ? 'quarter-final' : 'semi-final'} stage.`;
      break;
    }
    case 'FOURTH': {
      fanDelta = Math.round(FINISH_VALUE.Fourth * prestige);
      headline = 'Fourth';
      detail = `The worst seat in the building. ${CountryName} lose the bronze game and go home with nothing.`;
      break;
    }
    case 'GROUP_EXIT': {
      fanDelta = Math.round(-14 * prestige);
      headline = 'Out in the group';
      detail = `${CountryName} didn't get out of the group. Nobody goes home from one of these happy.`;
      break;
    }
    case 'PROMOTED': {
      // Tier 2 is the Top Division, 3 is Division I-A, 4 is I-B. Going up is
      // one step, and there is nothing above the top room.
      const newTier = Math.max(2, tier - 1);
      const newDiv = newTier === 2 ? 'Top Division' : 'Division I-A';
      setDivision(newTier, newDiv);
      fanDelta = Math.round(60 * prestige);
      awardName = 'Promotion';
      headline = 'Promoted';
      detail = `${CountryName} go up. They will be playing in ${newDiv} next time.`;
      break;
    }
    case 'PROMOTION_MISSED': {
      fanDelta = Math.round(-6 * prestige);
      headline = 'Promotion missed';
      detail = `One game from the room above, and it got away. ${CountryName} stay where they are.`;
      break;
    }
    case 'SURVIVED': {
      fanDelta = Math.round(25 * prestige);
      headline = 'Survived';
      detail = `${CountryName} stay up. It should never have been that close.`;
      break;
    }
    case 'RELEGATED': {
      // Any top-division nation can go down, the strongest included: it was
      // tier 2 or 3 only, and the top division had no relegation game at all,
      // so nobody ever left it.
      if (tier <= 3) {
        const newTier = Math.max(tier, 2) + 1;
        const newDiv = newTier === 3 ? 'Division I-A' : 'Division I-B';
        setDivision(newTier, newDiv);
        fanDelta = Math.round(-30 * prestige);
        headline = 'Relegated';
        detail = `${CountryName} go down to ${newDiv}.`;
      } else {
        fanDelta = Math.round(-12 * prestige);
        headline = 'Beaten';
        detail = `A loss, but there's no division below this one to fall into.`;
      }
      break;
    }
    default: {
      const won = outcome?.won;
      fanDelta = Math.round((won ? 14 : -4) * prestige);
      headline = won ? 'Placement won' : 'Placement lost';
      detail = won
        ? `${CountryName} finish the tournament on a win. Not what anyone came for.`
        : `${CountryName} finish with a loss in a game nobody wanted to play.`;
    }
  }

  // A tournament of your own on top of the team's result. Points, or a wall of
  // saves, move the needle whatever the nation did.
  const s = run.stats;
  const personal = player.pos === 'G'
    ? Math.round(((s.shots ? s.saves / s.shots : 0.9) - 0.9) * 340)
    : Math.round((s.g * 5) + (s.a * 3));
  // Kept deliberately smaller than the team result: a good personal tournament
  // softens a bad one, it does not turn going out in the group into a good week.
  fanDelta += Math.max(-25, Math.min(45, personal));

  const withOvr = applyOvrDelta(updated, ovrDelta);
  updated = {
    ...withOvr,
    ovr: recomputeOvr(withOvr),
    fanStatus: fanGain(withOvr.fanStatus || 0, fanDelta)
  };

  const fullAward = awardName && awardName !== 'Promotion'
    ? `${awardName}, ${run.tournamentName} ${run.year}`
    : (awardName === 'Promotion' ? `Promotion, ${run.tournamentName} ${run.year}` : '');

  if (fullAward) {
    updated.stats = { ...updated.stats, awards: [...(updated.stats?.awards || []), fullAward] };
  }

  // The season's own entry carries the tournament, and that is what the career
  // table at retirement reads: games, the line, and what it was called.
  //
  // Which entry depends on when the tournament was played. The World
  // Championship is in May, after the season has been written, so it goes
  // straight onto the newest entry. The World Juniors are in December and the
  // Olympics in February, and the season they belong to has not been written
  // yet: those park here and handleTrain attaches them when it closes the
  // year. This used to write them into the newest entry, which filed them a
  // season early, and a career whose only tournaments were mid-season ones came
  // to retirement with nothing to show.
  const intlData = {
    tournamentName: `${run.year} ${run.tournamentName}`,
    division: run.division,
    gamesPlayed: s.games,
    stats: { g: s.g, a: s.a, pm: s.pm, blk: s.blk || 0, sog: s.sog || 0, fot: s.fot || 0, fow: s.fow || 0,
             saves: s.saves, shots: s.shots, sho: s.sho },
    finish: headline,
    // Kept so the retirement screen can say he wore it, which it could not
    // before: the letter lived only on the run and died with the tournament.
    letter: run.letter || null,
    road: run.road.map(r => ({ short: r.short, opp: r.opponent?.id, score: r.score, won: r.won }))
  };

  const history = updated.seasonHistory;
  const playedAfterTheSeason = run.context === 'worlds';

  if (playedAfterTheSeason && history && history.length > 0) {
    const lastIdx = history.length - 1;
    const prior = history[lastIdx];
    const next = [...history];
    // A season can hold two tournaments: the World Juniors or the Olympics in
    // the winter and the Worlds in May. intlData held one, so the Worlds
    // wrote over the winter's line while both medals stayed on the season,
    // and the retirement table showed two medals against one tournament.
    // Every tournament now goes in intl; intlData stays for older code.
    const already = prior.intl || (prior.intlData ? [prior.intlData] : []);
    next[lastIdx] = {
      ...prior,
      awards: fullAward ? [...(prior.awards || []), fullAward] : (prior.awards || []),
      intlData,
      intl: [...already, intlData]
    };
    updated.seasonHistory = next;
  } else {
    updated.pendingIntl = { intlData, awards: fullAward ? [fullAward] : [] };
  }

  // Nothing of the run is left on the player: the old version kept intlStakes
  // and intlOppTier around after the tournament ended, so a February club game
  // was still being played at gold-medal difficulty.
  updated.intlRun = null;
  updated.intlData = null;
  updated.intlStakes = null;
  updated.intlOppTier = null;

  return {
    updatedPlayer: updated,
    summary: { headline, detail, medal: awardName && awardName !== 'Promotion' ? awardName : null, fanDelta, ovrDelta, stats: s }
  };
}

export { TOURNEY_NAME, TOP_ADVANCE };
