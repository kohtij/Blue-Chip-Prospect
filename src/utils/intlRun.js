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
import { PRESTIGE } from './stakes';
import { capFanStatus, applyOvrDelta, recomputeOvr } from './gameHelpers';

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
  // It is also the round that makes a medal a run rather than three games.
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

const PTS_TO_ADVANCE = 4;      // out of three group games, so two clean nights
const LOWER_PROMOTION_PTS = 9; // out of four, so three
const LOWER_SURVIVAL_PTS = 3;

const rnd = (n) => Math.floor(Math.random() * n);
const shuffle = (a) => [...a].sort(() => 0.5 - Math.random());

// Who you draw. Top-division nations meet top-division nations; everyone else
// plays inside their own division, topped up by the nearest tiers when the
// division is too small to fill a schedule.
function drawField(player, safeNationalities, division, count) {
  const all = safeNationalities || [];
  const me = all.find(n => n.id === player.nat) || { id: player.nat, name: player.nat, tier: 4 };
  let pool = all.filter(n => n.division === division && n.id !== player.nat);
  if (pool.length < count) {
    const filler = all
      .filter(n => n.id !== player.nat && !pool.some(t => t.id === n.id))
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
function nationalLetter(player, nation) {
  const tournaments = (player.seasonHistory || []).filter(s => s.intlData).length;
  const clubLetter = player.isCaptain || player.isAlternate;
  const standing = (player.ovr || 60) + (clubLetter ? 6 : 0) + tournaments * 3
    + ((player.relationships?.teammates || 50) - 50) * 0.2;

  // A hockey nation does not hand its captaincy to a man who does not wear a
  // letter for his own club. Canada, Russia, Sweden and the rest pick from a
  // room full of NHL captains, and the C goes to one of them. A smaller
  // federation is a different room: there, being the best player in it is
  // the qualification, and plenty of those captains wear nothing at home.
  const eliteNation = (nation?.iihfRank ?? 99) <= 7;
  const canWearC = clubLetter || !eliteNation;

  if (standing >= 104 && tournaments >= 3 && canWearC) return 'C';
  if (standing >= 92 && tournaments >= 1) return 'A';
  return null;
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
  const letter = nationalLetter(player, me);
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

  return {
    context,
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
    index: 0,
    points: 0,
    usedPlays: [],
    timeoutUsed: false,
    // One escape per tournament. Being read in a knockout puts the game on a
    // last-chance moment, but only the first time: after that they have you.
    escapeUsed: false,
    road: [],
    stats: { games: 0, g: 0, a: 0, pm: 0, saves: 0, shots: 0, sho: 0 },
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
  // The squad's own play is always on the board; it is the one thing about
  // this group that does not change from round to round.
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
    const basePct = isClean ? 0.925 : 0.868;
    const pct = Math.max(0.78, Math.min(0.99, basePct + (ovr - 75) * 0.0014 + (Math.random() - 0.5) * 0.035));
    const saves = Math.round(shots * pct);
    return { shots, saves, sho: isClean && shots - saves === 0 ? 1 : 0, g: 0, a: 0, pm: 0 };
  }

  const isD = pos === 'LD' || pos === 'RD';
  const gRate = edge * tierPull * (isD ? 0.26 : 0.62);
  const aRate = edge * tierPull * (isD ? 0.72 : 0.78);
  const roll = (rate) => (Math.random() < rate ? 1 : 0) + (Math.random() < rate * 0.25 ? 1 : 0);
  return {
    g: roll(gRate), a: roll(aRate),
    pm: (isClean ? 1 : -1) * rnd(3), saves: 0, shots: 0, sho: 0
  };
}

// One game, resolved. `rescued` is a knockout saved by the last-chance moment.
export function resolvePick(run, player, { playId, scoutedIds = [], rescued = null }) {
  const round = run.rounds[run.index];
  const wasRead = scoutedIds.includes(playId);
  // Being read in a knockout is not elimination on its own: it is the moment
  // that goes to the last-chance play, and that decides it.
  const clean = !wasRead;
  const survived = clean || rescued === true;

  const line = produce(player, clean, round.opponent?.tier);
  const stats = {
    games: run.stats.games + 1,
    g: run.stats.g + line.g,
    a: run.stats.a + line.a,
    pm: run.stats.pm + line.pm,
    saves: run.stats.saves + line.saves,
    shots: run.stats.shots + line.shots,
    sho: run.stats.sho + line.sho
  };

  // Three for a win, one for losing it after sixty minutes. Being read in the
  // group is a bad night, not an exit, and the points table is what decides
  // whether the tournament carries on.
  const pts = round.kind === 'group' ? (clean ? 3 : 1) : 0;
  const score = scoreline(clean, survived, rescued !== null);

  const entry = {
    key: round.key,
    label: round.label,
    short: round.short,
    opponent: round.opponent,
    won: survived,
    clean,
    rescued: wasRead && rescued === true,
    ot: rescued !== null,
    score,
    line,
    pts
  };

  return {
    wasRead,
    clean,
    survived,
    entry,
    nextRun: {
      ...run,
      escapeUsed: run.escapeUsed || rescued !== null,
      points: run.points + pts,
      usedPlays: run.usedPlays.includes(playId) ? run.usedPlays : [...run.usedPlays, playId],
      stats,
      road: [...run.road, entry]
    }
  };
}

// A game that came down to the last-chance moment did not end in regulation:
// it was tied, and the one play decided it. Those are overtime results either
// way, which is what the scoreline should say.
function scoreline(clean, survived, wentToOt) {
  if (wentToOt) {
    const gf = 2 + rnd(3);
    return survived ? `${gf}-${gf - 1} OT` : `${gf - 1}-${gf} OT`;
  }
  if (clean) {
    const gf = 3 + rnd(3);
    return `${gf}-${Math.max(0, gf - 2 - rnd(2))}`;
  }
  const ga = 3 + rnd(3);
  return `${Math.max(0, ga - 1 - rnd(2))}-${ga}`;
}

// Where the run stands after a game: does it carry on, and into what.
export function advanceRun(run, { survived }) {
  const round = run.rounds[run.index];
  const isLast = run.index >= run.rounds.length - 1;

  if (round.kind === 'group') {
    const groupLeft = run.rounds.slice(run.index + 1).some(r => r.kind === 'group');
    if (groupLeft) return { ...run, index: run.index + 1 };

    // Group is done. Whether there is anything left to play for depends on the
    // points, and on which room you are in.
    if (run.isTopDiv) {
      if (run.points >= PTS_TO_ADVANCE) return { ...run, index: run.index + 1 };
      return { ...run, finish: { type: 'GROUP_EXIT' } };
    }
    const decider = run.points >= LOWER_PROMOTION_PTS ? 'PROMOTION'
      : run.points <= LOWER_SURVIVAL_PTS ? 'SURVIVAL'
        : 'PLACEMENT';
    const rounds = run.rounds.map((r, i) =>
      i === run.index + 1
        ? { ...r, decider, label: decider === 'PROMOTION' ? 'Promotion final'
          : decider === 'SURVIVAL' ? 'Relegation game' : 'Placement game' }
        : r);
    return { ...run, rounds, index: run.index + 1 };
  }

  // Knockout.
  if (!survived) {
    // A semi-final loser is not finished: he plays for bronze, the way he does
    // in the real tournament. Handing him the medal for losing, which is what
    // this used to do, made it the cheapest medal in the game.
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
  const outcome = describeFinish(run);
  const prestige = PRESTIGE[run.context] ?? 1;

  // Every branch of the switch below sets these, default included.
  let fanDelta;
  let headline;
  let detail;
  let ovrDelta = 0;
  let awardName = '';
  let updated = { ...player };

  const tier = player.natTier || nat?.tier || 1;

  switch (outcome?.kind) {
    case 'MEDAL': {
      awardName = outcome.medal;
      fanDelta = Math.round(FINISH_VALUE[awardName] * prestige);
      ovrDelta = awardName === 'Gold' ? 1 : 0;
      headline = `${awardName} medal`;
      detail = awardName === 'Gold'
        ? `You won it. ${countryName} are champions, and you were on the ice for it.`
        : awardName === 'Silver'
          ? `One game short. Silver for ${countryName}, and it will take a while to feel like a medal.`
          : `A bronze medal for ${countryName} after falling in the semi-final.`;
      if (awardName === 'Gold') unlockAchievement?.('gold_medal');
      break;
    }
    case 'KO_EXIT': {
      fanDelta = Math.round(-8 * prestige);
      headline = 'Knocked out';
      detail = `${countryName} are out at the ${outcome.lostAt === 'QF' ? 'quarter-final' : 'semi-final'} stage.`;
      break;
    }
    case 'FOURTH': {
      fanDelta = Math.round(FINISH_VALUE.Fourth * prestige);
      headline = 'Fourth';
      detail = `The worst seat in the building. ${countryName} lose the bronze game and go home with nothing.`;
      break;
    }
    case 'GROUP_EXIT': {
      fanDelta = Math.round(-14 * prestige);
      headline = 'Out in the group';
      detail = `${countryName} did not get out of the group. Nobody goes home from one of these happy.`;
      break;
    }
    case 'PROMOTED': {
      // Tier 2 is the Top Division, 3 is Division I-A, 4 is I-B. Going up is
      // one step, and there is nothing above the top room.
      const newTier = Math.max(2, tier - 1);
      updated.natTier = newTier;
      updated.natDiv = newTier === 2 ? 'Top Division' : 'Division I-A';
      fanDelta = Math.round(60 * prestige);
      awardName = 'Promotion';
      headline = 'Promoted';
      detail = `${countryName} go up. They will be playing in ${updated.natDiv} next time.`;
      break;
    }
    case 'PROMOTION_MISSED': {
      fanDelta = Math.round(-6 * prestige);
      headline = 'Promotion missed';
      detail = `One game from the room above, and it got away. ${countryName} stay where they are.`;
      break;
    }
    case 'SURVIVED': {
      fanDelta = Math.round(25 * prestige);
      headline = 'Survived';
      detail = `${countryName} stay up. It should never have been that close.`;
      break;
    }
    case 'RELEGATED': {
      if (tier === 2 || tier === 3) {
        updated.natTier = tier + 1;
        updated.natDiv = tier === 2 ? 'Division I-A' : 'Division I-B';
        fanDelta = Math.round(-30 * prestige);
        headline = 'Relegated';
        detail = `${countryName} go down to ${updated.natDiv}.`;
      } else {
        fanDelta = Math.round(-12 * prestige);
        headline = 'Beaten';
        detail = `A loss, but there is no division below this one to fall into.`;
      }
      break;
    }
    default: {
      const won = outcome?.won;
      fanDelta = Math.round((won ? 14 : -4) * prestige);
      headline = won ? 'Placement won' : 'Placement lost';
      detail = won
        ? `${countryName} finish the tournament on a win. Not what anyone came for.`
        : `${countryName} finish with a loss in a game nobody wanted to play.`;
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
    fanStatus: capFanStatus((withOvr.fanStatus || 0) + fanDelta)
  };

  const fullAward = awardName && awardName !== 'Promotion'
    ? `${awardName}, ${run.tournamentName} ${run.year}`
    : (awardName === 'Promotion' ? `Promotion, ${run.tournamentName} ${run.year}` : '');

  if (fullAward) {
    updated.stats = { ...updated.stats, awards: [...(updated.stats?.awards || []), fullAward] };
  }

  // The season's own entry carries the tournament, which is what the career
  // table at retirement reads: games, the line, and what it was called.
  //
  // Which entry depends on when the tournament was played. The World
  // Championship is in May, after the season has been written, so it goes
  // straight onto the newest entry. The World Juniors are in December and the
  // Olympics in February, and the season they belong to has not been written
  // yet: those park here and handleTrain attaches them when it closes the
  // year. Writing those into the newest entry, which is what this did before,
  // filed them a season early, and a career whose only tournaments were
  // mid-season ones came to retirement with nothing to show.
  const intlData = {
    tournamentName: `${run.year} ${run.tournamentName}`,
    division: run.division,
    gamesPlayed: s.games,
    stats: { g: s.g, a: s.a, pm: s.pm, saves: s.saves, shots: s.shots, sho: s.sho },
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
    next[lastIdx] = {
      ...prior,
      awards: fullAward ? [...(prior.awards || []), fullAward] : (prior.awards || []),
      intlData
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

export { TOURNEY_NAME, PTS_TO_ADVANCE };
