import {
  ahlTeams, nhlTeams, shlTeams, ohlTeams, whlTeams, qmjhlTeams,
  ushlTeams, ncaaTeams, j20Teams, u20Teams, czechTeams, slovakTeams,
  swissTeams, delTeams, khlTeams, nationalities
} from '../data/teams';
import { draftOrder } from './leagueState';
import { ageFactor, curvesFor, drawLeagueBest, gaussianNoise, goalieAgeAdjust, seasonForm, soften } from './production';

// The rest of your draft class.
//
// Until now the hockey world contained one player. There were no league
// leaders, no rivals, no names on any trophy but yours, and that single
// absence was behind a lot of unrelated-looking problems: the Art Ross fired
// at a flat 105 points because there was nobody to lose the race to, a
// fifty-goal season never told you whether it led the league, and a career
// ended with totals that sat next to nothing.
//
// This is not a league simulation. It is about thirty other players, drafted
// the same year as you, who age, develop, peak, decline and retire on their
// own clocks, and whose seasons are produced by the same functions yours are.
// That is enough to make a scoring race real and to give a career something
// to be measured against.

// Names.
//
// The first pass at this pooled the surnames of current NHL players, and the
// generator promptly produced several of them outright, complete with
// invented career statistics. Real people do not belong in a fictional draft
// class, and a hockey fan would spot it immediately. These are ordinary
// surnames from each country instead, chosen not to land on anyone in
// particular.
const FIRST = {
  CAN: ['Connor', 'Dylan', 'Nathan', 'Brayden', 'Tyler', 'Owen', 'Carter', 'Hudson', 'Logan', 'Reid', 'Mason', 'Beckett', 'Cole', 'Riley', 'Keegan', 'Tanner', 'Emile', 'Felix'],
  USA: ['Jack', 'Matthew', 'Trevor', 'Quinn', 'Brock', 'Hunter', 'Grant', 'Spencer', 'Chase', 'Wyatt', 'Blake', 'Drew', 'Colton', 'Gavin'],
  SWE: ['Lucas', 'Elias', 'Viktor', 'Rasmus', 'Filip', 'Axel', 'Jonatan', 'Emil', 'Oskar', 'Hugo', 'Isak', 'Albin'],
  FIN: ['Mikko', 'Aleksi', 'Eetu', 'Joel', 'Niko', 'Patrik', 'Juuso', 'Topi', 'Veeti', 'Onni', 'Lauri'],
  RUS: ['Kirill', 'Andrei', 'Matvei', 'Ivan', 'Yegor', 'Dmitri', 'Nikita', 'Vasili', 'Pavel', 'Maxim'],
  CZE: ['Jakub', 'Martin', 'Tomas', 'Ondrej', 'David', 'Lukas', 'Radek', 'Vojtech'],
  SVK: ['Juraj', 'Simon', 'Marek', 'Adam', 'Dalibor', 'Samuel'],
  SUI: ['Nico', 'Jonas', 'Lian', 'Sven', 'Timo'],
  GER: ['Leon', 'Tim', 'Moritz', 'Julian', 'Jannik'],
  DEN: ['Oliver', 'Nikolaj', 'Mads', 'Rasmus']
};

const LAST = {
  CAN: ['Bellamy', 'Doucette', 'Lachance', 'Whitfield', 'Prentice', 'Caldwell', 'Harrow', 'Gaudet', 'Theriault', 'Mathieson', 'Brightwell', 'Castonguay', 'Ouimet', 'Maheux', 'Shanley', 'Vautour', 'Delorme', 'Pigeon'],
  USA: ['Ashcroft', 'Brenneman', 'Caldecott', 'Dunmore', 'Falkner', 'Hollins', 'Kearney', 'Lindquist', 'Mapes', 'Northrup', 'Prescott', 'Rydell', 'Sheffield', 'Vanderhoof'],
  SWE: ['Agren', 'Bergqvist', 'Dahlstrom', 'Ekroth', 'Falk', 'Grahn', 'Jernberg', 'Kallstrom', 'Moberg', 'Norling', 'Sandell', 'Wahlgren'],
  FIN: ['Ahonen', 'Hakkarainen', 'Kivela', 'Lahti', 'Manninen', 'Peltola', 'Rautio', 'Toivonen', 'Vartiainen', 'Ylonen'],
  RUS: ['Belov', 'Chernyshev', 'Dorokhin', 'Fedotov', 'Golubev', 'Lebedev', 'Morozov', 'Panfilov', 'Ryabov', 'Volkov', 'Zuev'],
  CZE: ['Bartos', 'Cermak', 'Dolezal', 'Havlicek', 'Kratochvil', 'Nemecek', 'Riha', 'Vesely'],
  SVK: ['Bohac', 'Hudak', 'Kollar', 'Masaryk', 'Sedlacek', 'Zilka'],
  SUI: ['Aebi', 'Brunner', 'Furrer', 'Keller', 'Moser', 'Steiner', 'Zehnder', 'Wyss'],
  GER: ['Bachmann', 'Fischbach', 'Hoffmann', 'Kettler', 'Lindner', 'Vogel', 'Weidner'],
  DEN: ['Clausen', 'Eskildsen', 'Holm', 'Lund', 'Mortensen', 'Riis']
};

const NATS = ['CAN', 'CAN', 'CAN', 'USA', 'USA', 'SWE', 'FIN', 'RUS', 'CZE', 'SVK', 'SUI', 'GER', 'DEN'];
const SKATER_POS = ['C', 'C', 'LW', 'RW', 'LD', 'RD'];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Peak ability across the class, as a draft class actually looks: one or two
// who become stars, a handful of regulars, and a long tail who never stick.
const drawPeak = (slot, size) => {
  const share = slot / size;
  const base = share < 0.05 ? 90 : share < 0.15 ? 84 : share < 0.35 ? 78 : share < 0.6 ? 72 : share < 0.82 ? 66 : 60;
  return Math.max(52, Math.min(95, Math.round(base + gaussianNoise() * 4)));
};

/**
 * The class you came up with. Called once, when the player's career starts.
 */
export function createDraftClass(playerAge = 16, size = 28, playerPos = 'C', leagueState = null) {
  const used = new Set();
  const peers = [];
  // Who picks where, worst finishers first, off the same projected table the
  // free agency sheet reads. A draft class without picks and clubs is a list
  // of names; with them it is a draft.
  const order = draftOrder(leagueState, nhlTeams || []);
  // Nine per cent of a class are goalies, which is about right and leaves a
  // goalie career with two or three men to measure itself against. If the
  // player is one, the class carries enough of them to be a real field.
  const goalieShare = playerPos === 'G' ? 0.26 : 0.09;

  for (let i = 0; i < size; i++) {
    const nat = pick(NATS);
    let name = '';
    for (let tries = 0; tries < 12; tries++) {
      name = `${pick(FIRST[nat])} ${pick(LAST[nat])}`;
      if (!used.has(name)) break;
    }
    if (used.has(name)) continue;
    used.add(name);

    const isGoalie = Math.random() < goalieShare;
    peers.push({
      id: `pr${i}`,
      name,
      nat,
      pos: isGoalie ? 'G' : pick(SKATER_POS),
      age: playerAge,
      // Where he ends up, and how quickly he gets there. A late bloomer is
      // nowhere at twenty and a problem at twenty-six.
      peak: drawPeak(i, size),
      peakAge: 24 + Math.round(gaussianNoise() * 2),
      ovr: 0,
      league: 'JR',
      retired: false,
      // The club. Without one a classmate could be ahead of you on a
      // leaderboard and nothing else: never your linemate, never the man
      // your club traded for, never across the ice in a playoff series.
      team: null,
      // Draft night, kept for good. Assigned below once the whole class has
      // been scouted, because a pick number only means anything relative to
      // everybody else in the room.
      pick: null,
      draftedBy: null,
      // Where he was playing when he was taken.
      ...draftRoute(nat),
      season: null,
      career: { gp: 0, g: 0, a: 0, sho: 0, saves: 0, shots: 0, titles: 0, trophies: 0, allStars: 0, seasons: 0 }
    });
  }
  // Scouts rank the class by what each player will become, with noise on it,
  // because scouts are not oracles. Then the order of the room decides who
  // takes whom.
  const board = [...peers]
    .map(p => ({ p, score: p.peak + gaussianNoise() * 5 }))
    .sort((a, b) => b.score - a.score)
    .map(e => e.p);

  // Spread across the first two rounds rather than packed into the top
  // twenty-eight, so the player's own pick, wherever it lands, slots in
  // among them instead of sitting in a gap below the whole class.
  const span = Math.max(1, (order.length || 32) * 2);
  board.forEach((p, i) => {
    p.pick = Math.max(1, Math.min(span, Math.round(1 + i * ((span - 2) / Math.max(1, board.length - 1)))));
    p.draftedBy = order.length ? order[(p.pick - 1) % order.length] : null;
  });

  return peers;
}

// How good he is this year: a curve rising to his peak age and falling after.
const ovrAt = (peer) => {
  const gap = peer.peak - 52;
  const up = Math.min(1, Math.max(0, (peer.age - 17) / Math.max(3, peer.peakAge - 17)));
  const rising = 52 + gap * (0.35 + 0.65 * up);
  if (peer.age <= peer.peakAge) return Math.round(rising);
  const past = peer.age - peer.peakAge;
  return Math.round(peer.peak - past * (past > 6 ? 2.6 : 1.5));
};

// Where a player of this ability is employed. No transfer logic, no contracts,
// just the level he belongs at, which is all the scoring race needs.
const leagueFor = (ovr, age) => {
  if (age <= 19 && ovr < 72) return 'JR';
  if (ovr >= 71) return 'NHL';
  if (ovr >= 63) return 'AHL';
  if (ovr >= 56) return 'SHL';
  return 'RETIRE';
};

const POOLS = { NHL: nhlTeams, AHL: ahlTeams, SHL: shlTeams, JR: [...(ohlTeams || []), ...(whlTeams || []), ...(qmjhlTeams || [])] };

// Where a prospect was playing the year he was drafted.
//
// A draft board that lists a name and a position tells you nothing about the
// player. Where he is coming from is half of what a draft is: a Kitchener
// winger, a Michigan freshman and a kid out of Farjestad's J20 programme are
// three different prospects before anyone has seen them play. Weighted by
// nationality, the way the routes actually run.
const ROUTES = {
  CAN: [[ohlTeams, 'OHL', 40], [whlTeams, 'WHL', 32], [qmjhlTeams, 'QMJHL', 22], [ncaaTeams, 'NCAA', 6]],
  USA: [[ushlTeams, 'USHL', 40], [ncaaTeams, 'NCAA', 34], [ohlTeams, 'OHL', 14], [whlTeams, 'WHL', 12]],
  SWE: [[j20Teams, 'J20', 72], [shlTeams, 'SHL', 20], [ohlTeams, 'OHL', 8]],
  FIN: [[u20Teams, 'U20', 74], [whlTeams, 'WHL', 14], [qmjhlTeams, 'QMJHL', 12]],
  RUS: [[khlTeams, 'KHL', 74], [qmjhlTeams, 'QMJHL', 14], [whlTeams, 'WHL', 12]],
  CZE: [[czechTeams, 'CZECH', 56], [ohlTeams, 'OHL', 24], [whlTeams, 'WHL', 20]],
  SVK: [[slovakTeams, 'SLOVAK', 48], [whlTeams, 'WHL', 28], [ohlTeams, 'OHL', 24]],
  SUI: [[swissTeams, 'SWISS', 70], [qmjhlTeams, 'QMJHL', 30]],
  GER: [[delTeams, 'DEL', 62], [ohlTeams, 'OHL', 38]],
  DEN: [[u20Teams, 'U20', 40], [whlTeams, 'WHL', 34], [j20Teams, 'J20', 26]]
};

// Named juniorTeam / juniorLeague rather than team / league: those two names
// already belong to where he plays now, and spreading this into the peer
// would have quietly overwritten both.
const draftRoute = (nat) => {
  const routes = (ROUTES[nat] || ROUTES.CAN).filter(([pool]) => (pool || []).length);
  if (!routes.length) return { juniorTeam: null, juniorLeague: null };
  const total = routes.reduce((sum, r) => sum + r[2], 0);
  let roll = Math.random() * total;
  for (const [pool, lg, weight] of routes) {
    roll -= weight;
    if (roll <= 0) return { juniorTeam: pool[Math.floor(Math.random() * pool.length)].id, juniorLeague: lg };
  }
  const [pool, lg] = routes[0];
  return { juniorTeam: pool[Math.floor(Math.random() * pool.length)].id, juniorLeague: lg };
};

// The flag image the nationality table already carries, so the draft board
// and the international screens are showing the same artwork.
export const flagFor = (nat) => (nationalities || []).find(n => n.id === nat)?.img || null;

// Which club he plays for. He keeps it while he stays in the league, because
// players mostly do, and takes a new one when he moves up, down or across.
const placeAt = (peer, league) => {
  if (peer.team && peer.league === league) {
    // One move in ten, so the league is not frozen.
    if (Math.random() > 0.10) return peer.team;
  }
  const pool = POOLS[league] || [];
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)].id;
};

/**
 * One season for one peer. Deliberately coarse: this is a scoring race, not a
 * second career mode. It uses the same age curve, the same skewed season form
 * and the same scoring ceilings the player's own season does, so the two sets
 * of numbers belong on the same page.
 */
function playPeerSeason(peer) {
  const ovr = Math.max(0, ovrAt(peer));
  const league = leagueFor(ovr, peer.age);
  if (league === 'RETIRE' || peer.age > 41) {
    return { ...peer, retired: true, justRetired: true, wonCupThisYear: false, league: 'RET', ovr, season: null, lastTeam: peer.team, team: null };
  }
  const team = placeAt(peer, league);

  const isGoalie = peer.pos === 'G';
  const isD = peer.pos === 'LD' || peer.pos === 'RD';
  const games = league === 'JR' ? 60 + Math.floor(Math.random() * 8) : 70 + Math.floor(Math.random() * 12);
  const ageCapped = league === 'JR';
  const form = seasonForm(games);
  const curves = curvesFor(league === 'JR' ? 'OHL' : league);

  // Ability to a scoring rate, on the same shape the player's own uses: a
  // threshold below which nobody scores, and a linear climb above it.
  const lgPace = league === 'NHL' ? 1.0 : league === 'AHL' ? 0.80 : league === 'SHL' ? 0.74 : 1.30;
  const depth = ovr >= 85 ? 1.35 : ovr >= 78 ? 1.12 : ovr >= 71 ? 0.90 : ovr >= 64 ? 0.68 : 0.52;
  // Scaled so that the best player in a draft class peaks around a hundred and
  // ten points and can take a scoring title. At the first calibration he
  // topped out near ninety, which meant the bar drawn from league history
  // beat him every single year and no peer ever won anything.
  const base = Math.max(0, (ovr - 52) * (isD ? 0.0145 : 0.026));

  const context = games * base * depth * lgPace * ageFactor(peer.age, ageCapped);
  const g = isGoalie ? 0 : Math.floor(soften(context * 0.40 * form.goals, curves.goals.soft, curves.goals.hard));
  const a = isGoalie ? 0 : Math.floor(soften(context * 0.62 * form.assists, curves.assists.soft, curves.assists.hard));

  // A goalie's year. Without this the nine per cent of the class who play the
  // position accumulated nothing at all, which is why a goalie career had no
  // rival, no class table and no scoring race line: every peer function
  // filtered them out because there was nothing to compare.
  let sho = 0, saves = 0, shots = 0;
  if (isGoalie) {
    const gp = Math.round(games * 0.62);
    // Mapped to the same save-percentage range the player's own goalie uses,
    // where a 70 OVR sits near .894 and a 90 near .928. The first pass moved
    // only 0.0011 per point of ability, which put every peer goalie in the
    // league under .908 and handed the entire class a career total of zero
    // shutouts.
    const sv = Math.min(0.945, Math.max(0.860,
      0.880 + (ovr - 62) * 0.0017 + goalieAgeAdjust(peer.age) + gaussianNoise() * 0.009));
    shots = gp * (27 + Math.round(Math.random() * 6));
    saves = Math.round(shots * sv);
    sho = Math.max(0, Math.round((sv - 0.898) * 180 * (gp / 60)));
  }

  const season = { league, team, gp: isGoalie ? Math.round(games * 0.62) : games, g, a, pts: g + a, sho, saves, shots };
  return {
    ...peer,
    ovr,
    league,
    team,
    justRetired: false,
    wonCupThisYear: false,
    season,
    career: {
      gp: peer.career.gp + season.gp,
      g: peer.career.g + g,
      a: peer.career.a + a,
      sho: (peer.career.sho || 0) + sho,
      saves: (peer.career.saves || 0) + saves,
      shots: (peer.career.shots || 0) + shots,
      titles: peer.career.titles,
      trophies: peer.career.trophies || 0,
      allStars: peer.career.allStars,
      seasons: peer.career.seasons + 1
    }
  };
}

/**
 * A career that began before this system existed has no class. Rather than
 * leaving those saves with an empty world for the rest of the run, build one
 * and fast-forward it to the right year, so the field has plausible careers
 * behind it instead of everybody sitting on zero.
 */
export function ensureClass(peers, playerAge = 18, seasonsPlayed = 0, playerPos = 'C', leagueState = null) {
  if (Array.isArray(peers) && peers.length) return peers;
  const draftAge = Math.max(16, playerAge - Math.max(0, seasonsPlayed));
  let built = createDraftClass(draftAge, 28, playerPos, leagueState);
  for (let i = 0; i < Math.max(0, seasonsPlayed); i++) built = advancePeers(built);
  return built;
}

// Who won what, once everyone has finished playing.
//
// career.titles and career.allStars were set to zero when a peer was created,
// copied forward faithfully every single season, and incremented by nothing.
// The class had careers and no honours, so the table at retirement could rank
// a man above you on points while saying nothing about the four rings he won
// doing it.
function awardPeerHonours(peers) {
  const nhl = peers.filter(p => !p.retired && p.season && p.season.league === 'NHL');
  if (!nhl.length) return peers;

  const honoured = new Map();
  const give = (peer, key, n = 1) => {
    const cur = honoured.get(peer.id) || {};
    cur[key] = (cur[key] || 0) + n;
    honoured.set(peer.id, cur);
  };

  const skaters = nhl.filter(p => p.pos !== 'G').sort((x, y) => y.season.pts - x.season.pts);
  const goalies = nhl.filter(p => p.pos === 'G').sort((x, y) => y.season.sho - x.season.sho);

  // Six skaters and two goalies make the post-season teams.
  skaters.slice(0, 6).forEach(p => give(p, 'allStars'));
  goalies.slice(0, 2).forEach(p => give(p, 'allStars'));

  // The scoring title and the best goaltender are trophies in their own right.
  if (skaters[0]) give(skaters[0], 'trophies');
  if (goalies[0] && goalies[0].season.sho > 0) give(goalies[0], 'trophies');

  // One cup a year, and the better you are the likelier you are holding it,
  // because good players are mostly on good teams.
  // Not every year: a cup-winning roster is twenty men out of seven hundred,
  // so a cohort this size should supply one about half the time, not always.
  const weights = nhl.map(p => Math.pow(Math.max(1, p.ovr - 58), 2.2));
  const total = weights.reduce((a, b) => a + b, 0);
  if (total > 0 && Math.random() < 0.55) {
    let roll = Math.random() * total;
    for (let i = 0; i < nhl.length; i++) {
      roll -= weights[i];
      if (roll <= 0) { give(nhl[i], 'titles'); break; }
    }
  }

  return peers.map(p => {
    const won = honoured.get(p.id);
    if (!won) return p;
    return {
      ...p,
      wonCupThisYear: !!won.titles,
      career: {
        ...p.career,
        titles: (p.career.titles || 0) + (won.titles || 0),
        trophies: (p.career.trophies || 0) + (won.trophies || 0),
        allStars: (p.career.allStars || 0) + (won.allStars || 0)
      }
    };
  });
}

/**
 * A year passes for the whole class.
 */
export function advancePeers(peers) {
  if (!Array.isArray(peers)) return [];
  const played = peers.map(p => {
    // A man who retired last summer is no longer news this summer.
    if (p.retired) return p.justRetired ? { ...p, justRetired: false } : p;
    const aged = { ...p, age: p.age + 1 };
    return playPeerSeason(aged);
  });
  return awardPeerHonours(played);
}

/**
 * What it took to win the scoring title in this league this season.
 *
 * The known field is only thirty players, so it will often contain nobody who
 * played in a given league at all. Where it does not, the bar is drawn from
 * that league's own history, which keeps the contest honest everywhere: the
 * named rival wins it when he earns it, and the rest of the time you are
 * beating a number that moves.
 */
export function scoringBar(peers, league) {
  const drawn = drawLeagueBest(league);
  const field = (peers || []).filter(p => !p.retired && p.season && p.season.league === league && p.pos !== 'G');

  const best = field.reduce((top, p) => (p.season.pts > (top?.season.pts ?? -1) ? p : top), null);
  const bestG = field.reduce((top, p) => (p.season.g > (top?.season.g ?? -1) ? p : top), null);

  // A goal title runs at roughly forty-four per cent of a scoring title, which
  // puts the NHL's in the low fifties and junior's in the high forties.
  const drawnGoals = Math.round(drawn * 0.44);

  const ledPoints = best && best.season.pts > drawn;
  const ledGoals = bestG && bestG.season.g > drawnGoals;

  return {
    total: ledPoints ? best.season.pts : drawn,
    name: ledPoints ? best.name : null,
    goals: ledGoals ? bestG.season.g : drawnGoals,
    goalName: ledGoals ? bestG.name : null
  };
}

/**
 * The one whose career has run closest to yours: the measuring stick.
 */
// What a career is measured by, which is points for a skater and shutouts for
// a goalie. One function so the dashboard and the retirement screen rank the
// class the same way.
export const peerValue = (peer, isGoalie) =>
  isGoalie ? (peer.career.sho || 0) : (peer.career.g + peer.career.a);

export const peerUnit = (isGoalie) => (isGoalie ? 'SHO' : 'PTS');

export function findRival(peers, playerValue, isGoalie = false) {
  const live = (peers || []).filter(p => (p.pos === 'G') === !!isGoalie && p.career.seasons > 0);
  if (!live.length) return null;
  // The best of the class, unless he is miles clear of you, in which case the
  // interesting comparison is whoever you are actually next to.
  const byCareer = [...live].sort((x, y) => peerValue(y, isGoalie) - peerValue(x, isGoalie));
  const top = byCareer[0];
  if (!playerValue || peerValue(top, isGoalie) <= playerValue * 1.6) return top;
  return byCareer.reduce((closest, p) => {
    const d = Math.abs(peerValue(p, isGoalie) - playerValue);
    const cd = Math.abs(peerValue(closest, isGoalie) - playerValue);
    return d < cd ? p : closest;
  }, byCareer[0]);
}

/**
 * The class table, best career first, for the retirement screen.
 */
export function classTable(peers, limit = 10, isGoalie = false) {
  return [...(peers || [])]
    .filter(p => (p.pos === 'G') === !!isGoalie && p.career.seasons > 0)
    .sort((x, y) => peerValue(y, isGoalie) - peerValue(x, isGoalie))
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// WHERE THE CLASS SHOWS UP
//
// Having careers is not the same as being part of one. These are the handful
// of places a classmate can walk into the story: the night you were drafted,
// the room you walk into in September, and the short note each summer about
// what the rest of them did. None of them fire every year, which is the point.
// ---------------------------------------------------------------------------

/**
 * Who went around you on draft night.
 *
 * The class is created when the career starts, so the names exist before the
 * draft screen does; it simply never asked for them. Picks are assigned by
 * peak ability with some noise, because scouts are not oracles, and then the
 * player is slotted in at his own pick.
 */
export function draftBoard(peers, playerPick, playerName, count = 2) {
  const pool = (peers || []).filter(p => p.pick);
  if (!pool.length) return { before: [], after: [] };

  // The picks were settled when the class was created and are kept for the
  // life of the career, so the board here is the same board the retirement
  // screen prints twenty years later.
  const picks = pool
    .map(p => ({
      name: p.name, nat: p.nat, pos: p.pos, pick: p.pick, team: p.draftedBy,
      flag: flagFor(p.nat), from: p.juniorTeam, fromLeague: p.juniorLeague
    }))
    .filter(x => x.pick !== playerPick);

  const all = [...picks, { name: playerName, pick: playerPick, me: true }]
    .sort((a, b) => a.pick - b.pick);
  const idx = all.findIndex(x => x.me);

  return {
    before: all.slice(Math.max(0, idx - count), idx),
    after: all.slice(idx + 1, idx + 1 + count)
  };
}

/**
 * Classmates on your club this season.
 */
export function teammatesFrom(peers, teamId) {
  if (!teamId) return [];
  return (peers || []).filter(p => !p.retired && p.team === teamId);
}

/**
 * One line about the rest of the class, or nothing.
 *
 * Deliberately at most one a year and often none: they are a part of the
 * career, not a running commentary on it. The checks run in order of how much
 * the news is worth hearing, so a retirement beats a milestone and a milestone
 * beats a good season.
 */
export function classNews(peers, player) {
  const live = (peers || []).filter(p => p.career.seasons > 0);
  if (!live.length) return null;

  // Most summers you hear nothing about them, which is how it should be. A
  // class of twenty-eight generates something worth saying nearly every year
  // if you let it, and then it stops being news and becomes a drumbeat: at
  // the first calibration this fired in sixteen of twenty seasons, including
  // seven consecutive retirement notices.
  if (Math.random() > 0.42) return null;

  const isGoalie = player?.pos === 'G';
  const myTeam = player?.team;
  const candidates = [];

  // Someone hung them up. Only the ones whose careers meant something:
  // everybody in a draft class eventually stops playing, and that is not news.
  const retiring = live.filter(p => p.justRetired)
    .filter(p => p.career.gp > 700 || p.career.titles > 0 || p.career.trophies > 0)
    .sort((a, b) => b.career.gp - a.career.gp)[0];
  if (retiring) {
    const cups = retiring.career.titles || 0;
    candidates.push({
      weight: 4, id: retiring.id, kind: 'retired',
      line: `${retiring.name} retired this summer after ${retiring.career.seasons} seasons and ${retiring.career.gp} games${
        cups > 0 ? `, with ${cups === 1 ? 'a cup' : `${cups} cups`} to his name` : ''}. You were drafted together.`
    });
  }

  // Someone walked into your room, or has been in it a while.
  const mates = teammatesFrom(peers, myTeam).filter(p => p.career.seasons > 1);
  if (mates.length) {
    const m = mates[Math.floor(Math.random() * mates.length)];
    candidates.push({
      weight: 4, id: m.id, kind: 'teammate',
      line: `${m.name} is in your room this year. You were drafted the same summer.`
    });
  }

  // Someone passed you.
  const mine = isGoalie ? (player?.stats?.nhl?.shutouts || 0)
    : (player?.stats?.nhl?.goals || 0) + (player?.stats?.nhl?.assists || 0);
  const unit = isGoalie ? 'shutouts' : 'points';
  const ahead = live
    .filter(p => (p.pos === 'G') === isGoalie && !p.retired)
    .map(p => ({ p, v: peerValue(p, isGoalie) }))
    .filter(e => e.v > mine && e.v - mine < Math.max(12, mine * 0.08))
    .sort((a, b) => a.v - b.v)[0];
  if (ahead && mine > 0) {
    candidates.push({
      weight: 3, id: ahead.p.id, kind: 'passed',
      line: `${ahead.p.name} went past you this season. He is on ${ahead.v} career ${unit}, you are on ${mine}.`
    });
  }

  // Someone from the class lifted it. Last, and lightest, because a cup goes
  // somewhere every year: under strict priority this one item crowded out
  // everything else, and a classmate sat in the player's own dressing room
  // for seven straight seasons without ever being mentioned.
  const champ = live.find(p => p.wonCupThisYear);
  if (champ) {
    candidates.push({
      weight: 2, id: champ.id, kind: 'cup',
      line: `${champ.name} won the Cup. You came up together.`
    });
  }

  if (!candidates.length) return null;
  const total = candidates.reduce((sum, c) => sum + c.weight, 0);
  let roll = Math.random() * total;
  for (const c of candidates) {
    roll -= c.weight;
    if (roll <= 0) return c;
  }
  return candidates[0];
}

/**
 * A press question about a classmate, or nothing.
 *
 * Built here rather than in the question bank because it has to name someone,
 * and the bank is static text. Shaped exactly like the entries in
 * PRESS_QUESTIONS so the selector can treat it as one of them.
 */
export function classPressQuestion(peers, player) {
  const live = (peers || []).filter(p => p.career.seasons > 1 && !p.retired);
  if (!live.length) return null;

  const isGoalie = player?.pos === 'G';
  const mine = isGoalie ? (player?.stats?.nhl?.shutouts || 0)
    : (player?.stats?.nhl?.goals || 0) + (player?.stats?.nhl?.assists || 0);

  // The one just ahead of you is the one they want to ask about.
  const ahead = live
    .filter(p => (p.pos === 'G') === isGoalie)
    .map(p => ({ p, v: peerValue(p, isGoalie) }))
    .filter(e => e.v > mine)
    .sort((a, b) => a.v - b.v)[0];
  if (!ahead || mine <= 0) return null;

  const who = ahead.p.name;
  return {
    q: `You and ${who} came into the league the same year. He's ahead of you now. Does that register?`,
    forPos: 'all', tag: 'neutral',
    answers: {
      professional: [
        `I'm not playing against ${who}. I'm playing against whoever we have on Thursday.`,
        'You can only control your own game. The rest is noise.',
        'Comparisons are for you lot. I just try to be useful.'
      ],
      passionate: [
        `Of course it registers. I've been chasing ${who} since we were seventeen.`,
        'I know exactly where he is. I have since draft day.',
        'You keep a list in your head. He is on mine.'
      ],
      humble: [
        `${who} has had a terrific career. I'm pleased for him.`,
        'He has earned every bit of it. I have my own road.',
        'I just try to be worth my spot. What he does is his business.'
      ],
      cocky: [
        'Ask me again in three years.',
        `${who} has had a nice run. It is a long career.`,
        'He is ahead today. Today is not the part I care about.'
      ]
    }
  };
}
