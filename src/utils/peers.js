import {
  ahlTeams, nhlTeams, shlTeams, ohlTeams, whlTeams, qmjhlTeams,
  ushlTeams, ncaaTeams, j20Teams, u20Teams, czechTeams, slovakTeams,
  swissTeams, delTeams, khlTeams, nationalities
} from '../data/teams';
import { draftOrder } from './leagueState';
import { ageFactor, curvesFor, drawLeagueBest, drawLeagueBestDman, drawLeagueBestSv, gaussianNoise, goalieAgeAdjust, paceOf, rateSeason, seasonForm, soften } from './production';

// The rest of your draft class.
//
// Until now the hockey world contained one player. There were no league
// leaders, no rivals, no names on any trophy but yours, and that single
// absence was behind a lot of unrelated-looking problems: the Art Ross fired
// at a flat 105 points because there was nobody to lose the race to, a
// fifty-goal season never told you whether it led the league, and a career
// ended with totals that sat next to nothing.
//
// What follows is far smaller than a league simulation: about thirty other
// players, drafted the same year as you, who age, develop, peak, decline and
// retire on their own clocks, and whose seasons are produced by the same
// functions yours are. That is enough to make a scoring race real and to give
// a career something to be measured against.

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
  const goalieShare = playerPos === 'G' ? 0.20 : 0.09;

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
      // How the scouting world reads him, which is not the same as how good
      // he is. Fixed at birth so a prospect who is overrated at sixteen is
      // still overrated at eighteen: the board has to be stable enough that
      // the names on it become familiar.
      scoutBias: gaussianNoise() * 3.4,
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
      career: { gp: 0, g: 0, a: 0, sho: 0, saves: 0, shots: 0, wins: 0, losses: 0, otl: 0, titles: 0, trophies: 0, allStars: 0, seasons: 0 }
    });
  }
  // Scouts rank the class by what each player will become, with noise on it,
  // since nobody can see a career coming exactly. Then the order of the room
  // decides who takes whom.
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
  });

  // NOBODY DRAFTS GOALIES THAT EARLY.
  //
  // The board ranked every prospect on projection alone, so a goalie with a
  // high ceiling went third overall as readily as a centre with the same
  // one, and a class generated for a goalie career put three of them inside
  // the first round and eight inside the top sixty.
  //
  // That is not how the draft works and never has been. Roughly two dozen
  // goalies go in a draft, about a tenth of all picks, but they are
  // overwhelmingly late: in the last twenty years teams have taken three or
  // four in the first two rounds combined, and the first round has averaged
  // under one a year since 2010, with 2013, 2014, 2016 and 2018 producing
  // none at all. A good goaltender is the hardest projection in the sport
  // and general managers price that in.
  //
  // So the skaters hold the board they earned and the goalies are placed
  // against it: one in the first round rather more often than not, two or
  // three more across the second, and the rest into the rounds the game does
  // not otherwise model.
  const goalies = board.filter(p => p.pos === 'G');
  const takenPicks = new Set(board.filter(p => p.pos !== 'G').map(p => p.pick));
  const roundOne = order.length || 32;

  // The best of them goes in the first round about two years in three, which
  // is roughly the historical rate once a strong class is accounted for.
  const freeIn = (lo, hi) => {
    const open = [];
    for (let n = lo; n <= hi; n++) if (!takenPicks.has(n)) open.push(n);
    return open;
  };
  goalies.forEach((g, i) => {
    let window;
    if (i === 0 && Math.random() < 0.62) window = freeIn(Math.round(roundOne * 0.38), roundOne);
    else if (i <= 2) window = freeIn(roundOne + 1, span);
    else window = freeIn(span + 1, span + roundOne * 3);
    if (!window.length) window = freeIn(span + 1, span + roundOne * 3);
    const chosen = window.length ? window[Math.floor(Math.random() * window.length)] : span + 1 + i;
    g.pick = chosen;
    takenPicks.add(chosen);
  });

  board.forEach(p => {
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

// HOW OLD YOU HAVE TO BE TO BE THERE.
//
// A peer's route is drawn once when the class is created and then used for
// every season before the draft, so a sixteen-year-old was shown wherever his
// draft year was going to be. An American sixteen-year-old appeared in the
// NCAA, where the youngest freshmen are eighteen and nobody is admitted at
// sixteen at all. Worse, every nation outside Canada, the United States,
// Sweden and Finland routed through a men's league: a Czech sixteen-year-old
// was in the Extraliga, a Russian in the KHL, a German in the DEL. Below
// these ages a prospect is in his own country's under-20 programme, which is
// where he really is.
const LEAGUE_MIN_AGE = {
  NCAA: 18,
  NHL: 18, AHL: 18,
  KHL: 17, SHL: 17, CZECH: 17, SLOVAK: 17, SWISS: 17, DEL: 17
};

// The under-20 programme each nationality comes through, and the pool its
// clubs are drawn from. For the countries whose route already pointed at the
// men's league, the club stays exactly as drawn and only the league changes,
// because a U20 side is the senior club's own junior team and wears its
// crest: Sparta's under-20s are still Sparta.
const HOME_JUNIOR = {
  CAN: [ohlTeams, 'OHL'],
  USA: [ushlTeams, 'USHL'],
  SWE: [j20Teams, 'J20'],
  FIN: [u20Teams, 'U20'],
  DEN: [j20Teams, 'J20'],
  RUS: [khlTeams, 'MHL'],
  CZE: [czechTeams, 'CZE20'],
  SVK: [slovakTeams, 'SVK20'],
  SUI: [swissTeams, 'SUI20'],
  GER: [delTeams, 'DNL']
};

/**
 * Where a prospect actually is this season, given how old he is.
 *
 * Returns his drawn route once he is old enough for it, and his own
 * country's under-20 programme until then. The club is chosen off a hash of
 * his id rather than at random, because this runs every season and a peer who
 * changed clubs on every render would not be a person.
 */
function juniorPlacement(peer) {
  const drawn = { league: peer.juniorLeague, team: peer.juniorTeam };
  const minAge = LEAGUE_MIN_AGE[peer.juniorLeague] || 16;
  if ((peer.age ?? 17) >= minAge) return drawn;

  const [pool, lg] = HOME_JUNIOR[peer.nat] || HOME_JUNIOR.CAN;
  const list = pool || [];
  if (!list.length) return drawn;
  // Already at a club in the right pool: keep it, rename the league.
  if (list.some(t => t.id === peer.juniorTeam)) return { league: lg, team: peer.juniorTeam };
  return { league: lg, team: list[hash(peer.id || peer.name || 'x') % list.length].id };
}

// A tiny deterministic generator, for the parts of the draft room that are
// drawn fresh every time the screen opens and must come out identical.
const rngFrom = (seed) => {
  let h = seed >>> 0;
  return () => {
    h = (Math.imul(h, 1664525) + 1013904223) >>> 0;
    return h / 4294967296;
  };
};

const hash = (str) => {
  let h = 2166136261;
  for (let i = 0; i < String(str).length; i++) {
    h ^= String(str).charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

// The same weighted route draw, running off a supplied generator instead of
// Math.random, so a filled pick keeps its club between renders.
const routeFrom = (nat, rnd) => {
  const routes = (ROUTES[nat] || ROUTES.CAN).filter(([pl]) => (pl || []).length);
  if (!routes.length) return { juniorTeam: null, juniorLeague: null };
  const total = routes.reduce((sum, r) => sum + r[2], 0);
  let roll = rnd() * total;
  for (const [pl, lg, weight] of routes) {
    roll -= weight;
    if (roll <= 0) return { juniorTeam: pl[Math.floor(rnd() * pl.length)].id, juniorLeague: lg };
  }
  const [pl, lg] = routes[0];
  return { juniorTeam: pl[Math.floor(rnd() * pl.length)].id, juniorLeague: lg };
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

// WHAT TO CALL A LEAGUE ON A BOARD.
//
// "U20" told you nothing: it is Finland's under-20 league, and nothing on
// screen said so, while Sweden's sat beside it as "J20" and the two read as
// the same kind of label for different things. The first pass at this spelled
// the country out beside the code, which was correct and was also five more
// words of grey capitals on a board that already had enough. The country is
// carried by its flag instead, the same artwork the creation screen picks a
// nationality with, and the text goes back to the bare code.
//
// The internal ids stay as they are, because the pace tables and the scoring
// races key off them; this is only what gets printed.
const LEAGUE_LABEL = {
  CZE20: 'U20',
  SVK20: 'U20',
  SUI20: 'U20',
  // The men's leagues whose internal id is a country rather than a league.
  CZECH: 'ELH',
  SLOVAK: 'EL',
  SWISS: 'NL'
};

export const leagueLabel = (id) => (id ? (LEAGUE_LABEL[id] || id) : '');

// Whose league it is. The NHL and the AHL are deliberately absent: they are
// two countries' leagues and a single flag on either would be wrong.
const LEAGUE_HOME = {
  OHL: 'CAN', WHL: 'CAN', QMJHL: 'CAN',
  USHL: 'USA', NCAA: 'USA',
  J20: 'SWE', SHL: 'SWE',
  U20: 'FIN',
  MHL: 'RUS', KHL: 'RUS',
  CZE20: 'CZE', CZECH: 'CZE',
  SVK20: 'SVK', SLOVAK: 'SVK',
  SUI20: 'SUI', SWISS: 'SUI',
  DNL: 'GER', DEL: 'GER'
};

export const leagueNation = (id) => LEAGUE_HOME[id] || null;
export const leagueFlag = (id) => flagFor(leagueNation(id));

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
// How long a junior season is, which is not the same number everywhere: a
// Swedish J20 schedule is two thirds of an OHL one and an NCAA season is
// barely half.
const JUNIOR_GAMES = {
  OHL: 64, WHL: 66, QMJHL: 66, USHL: 60, NCAA: 38, J20: 44, U20: 44,
  // The other under-20 programmes, which a prospect plays before he is old
  // enough for the men's league beneath.
  MHL: 60, CZE20: 44, SVK20: 40, SUI20: 40, DNL: 44,
  // Not every prospect's draft year is a junior one. A Russian, a Czech, a
  // Swiss or a German is usually already in the men's league at seventeen,
  // which is a shorter schedule and a far harder room.
  KHL: 68, CZECH: 52, SLOVAK: 50, SWISS: 52, DEL: 56, SHL: 52
};

function playPeerSeason(peer) {
  const ovr = Math.max(0, ovrAt(peer));
  const tier = leagueFor(ovr, peer.age);
  if (tier === 'RETIRE' || peer.age > 41) {
    return { ...peer, retired: true, justRetired: true, wonCupThisYear: false, league: 'RET', ovr, season: null, lastTeam: peer.team, team: null };
  }

  // A junior year is spent in the club he is actually coming out of.
  //
  // Every pre-draft peer used to be dropped into one undifferentiated 'JR'
  // league and handed a random CHL club, so a Swedish prospect spent his
  // draft year in Kitchener and the league he was playing in never matched
  // the one the draft board said he came from. Worse, nothing the player saw
  // during his own junior years could contain a classmate: a scoring race in
  // the OHL filters on league 'OHL', and no peer was ever in it. They play
  // their own route now, which is how a name starts being familiar before
  // the draft rather than on the night.
  // Nobody in the year group has been drafted yet, so nobody in it can be in
  // the NHL yet. leagueFor only looks at ability, which put a 72-rated
  // eighteen-year-old in the league a summer before his own draft and then
  // listed him on the pre-draft scouting board as an NHL player.
  const preDraft = peer.age <= 18;
  // And he has to be old enough for the room his route points at. See
  // juniorPlacement: until he is, he is in his own country's under-20
  // programme rather than in a men's league or an American college.
  const placed = ((preDraft || tier === 'JR') && peer.juniorLeague)
    ? juniorPlacement(peer)
    : null;
  const junior = !!placed;
  const league = junior ? placed.league : tier;
  const team = junior ? (placed.team || placeAt(peer, 'JR')) : placeAt(peer, tier);

  const isGoalie = peer.pos === 'G';
  const isD = peer.pos === 'LD' || peer.pos === 'RD';
  const scheduled = junior ? (JUNIOR_GAMES[league] || 62) : (tier === 'JR' ? 62 : 74);
  const games = Math.max(20, scheduled - 4 + Math.floor(Math.random() * 9));
  const ageCapped = tier === 'JR' || preDraft;
  const form = seasonForm(games);
  const curves = curvesFor(junior ? league : (tier === 'JR' ? 'OHL' : tier));

  // Ability to a scoring rate, on the same shape the player's own uses: a
  // threshold below which nobody scores, and a linear climb above it.
  // Junior leagues are not one environment either. Scaled off the same PACE
  // table the player's own season rating reads, with the OHL pinned to the
  // 1.30 everything pre-draft used to get: an NCAA freshman's thirty-eight
  // games at a lower rate should not read like a Quebec winger's sixty-six.
  const lgPace = league === 'NHL' ? 1.0
    : league === 'AHL' ? 0.80
      : (!junior && league === 'SHL') ? 0.74
        : junior ? (paceOf(league).par / 0.78) * 1.30
          : 1.30;
  // Ratings have to be read against the league a player is in. All of these
  // numbers are calibrated on the NHL, where 52 is replacement level, and a
  // seventeen-year-old at 64 is nowhere near it: run through as-is he put up
  // eight points in a sixty-six game junior season while the player beside him
  // on the same board had forty-eight. In junior that same 64 is the best
  // player in the league, so it is read at junior's baseline instead. Men's
  // leagues keep the NHL scale, so a seventeen-year-old in the KHL scores
  // almost nothing, as he should.
  const juniorEnv = junior && ['OHL', 'WHL', 'QMJHL', 'USHL', 'NCAA', 'J20', 'U20',
    'MHL', 'CZE20', 'SVK20', 'SUI20', 'DNL'].includes(league);
  const scaleOvr = juniorEnv ? ovr + 16 : ovr;
  const depth = scaleOvr >= 85 ? 1.35 : scaleOvr >= 78 ? 1.12 : scaleOvr >= 71 ? 0.90 : scaleOvr >= 64 ? 0.68 : 0.52;
  // Scaled so that the best player in a draft class peaks around a hundred and
  // ten points and can take a scoring title. At the first calibration he
  // topped out near ninety, which meant the bar drawn from league history
  // beat him every single year and no peer ever won anything.
  const base = Math.max(0, (scaleOvr - 52) * (isD ? 0.0145 : 0.026));

  const context = games * base * depth * lgPace * ageFactor(peer.age, ageCapped);
  const g = isGoalie ? 0 : Math.floor(soften(context * 0.40 * form.goals, curves.goals.soft, curves.goals.hard));
  const a = isGoalie ? 0 : Math.floor(soften(context * 0.62 * form.assists, curves.assists.soft, curves.assists.hard));

  // A goalie's year. Without this the nine per cent of the class who play the
  // position accumulated nothing at all, so a goalie career had no rival, no
  // class table and no scoring race line: every peer function filtered them
  // out because there was nothing to compare.
  let sho = 0, saves = 0, shots = 0, wins = 0, losses = 0, otl = 0;
  if (isGoalie) {
    const gp = Math.round(games * 0.62);
    // Mapped to the same save-percentage range the player's own goalie uses,
    // where a 70 OVR sits near .894 and a 90 near .928. The first pass moved
    // only 0.0011 per point of ability, which put every peer goalie in the
    // league under .908 and handed the entire class a career total of zero
    // shutouts.
    // Built around the league's own par rather than a single fixed number,
    // the way the player's own season rating already is. On the flat scale a
    // seventeen-year-old in the KHL came out at .860, which is not a save
    // percentage anybody keeps a job with, and every junior goalie in the
    // class finished the year with no shutouts at all because the shutout
    // line was measured against an NHL baseline.
    const gPace = paceOf(league);
    // 0.0016 per point of rating was more than twice the real slope and put a
    // classmate's save percentage on the same inflated scale the player's was
    // on: at an 88 he was pinned against the ceiling. Matched to the player's
    // own curve in gameHelpers, so the goalie the Vezina is lost to is a
    // goalie measured the same way.
    const sv = Math.min(gPace.svStar + 0.014, Math.max(gPace.svPar - 0.025,
      gPace.svPar + (scaleOvr - 70) * 0.0009 + goalieAgeAdjust(peer.age) + gaussianNoise() * 0.008));
    shots = gp * (27 + Math.round(Math.random() * 6));
    saves = Math.round(shots * sv);
    sho = Math.max(0, Math.round((sv - (gPace.svPar - 0.008)) * 170 * (gp / 60)));
    // His record, on the same model the player's own uses: how well he
    // played, plus how good the club in front of him was.
    const winPct = Math.min(0.78, Math.max(0.18,
      0.5 + (sv - gPace.svPar) * 7.5 + gaussianNoise() * 0.06));
    wins = Math.round(gp * winPct);
    const rest = gp - wins;
    otl = Math.round(rest * 0.22);
    losses = Math.max(0, rest - otl);
  }

  // A classmate's plus-minus and his minutes, which exist because a defenceman
  // cannot be priced without them: valued on points alone, every peer
  // defenceman came out cheaper than the player at the same ability, and the
  // comparables an agent put on the table were quietly all too low. Derived
  // from how good he is, since a peer has a rating and not a set of
  // attributes.
  const pmPer82 = isGoalie ? 0
    : Math.round((scaleOvr - 74) * (posGroup(peer.pos) === 'D' ? 0.95 : 0.70) + gaussianNoise() * 7);
  const season = {
    league, team, gp: isGoalie ? Math.round(games * 0.62) : games,
    g, a, pts: g + a, sho, saves, shots, wins, losses, otl,
    pm: isGoalie ? 0 : Math.round(pmPer82 * (games / 82)),
    avgToi: isGoalie ? 60 : Math.max(8, Math.min(26,
      (posGroup(peer.pos) === 'D' ? 15.0 : 12.0) + (scaleOvr - 70) * 0.30))
  };
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
      wins: (peer.career.wins || 0) + wins,
      losses: (peer.career.losses || 0) + losses,
      otl: (peer.career.otl || 0) + otl,
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
  // One year younger than he is, because every caller advances the class once
  // before the player's own season is played. Built at his age, the whole year
  // group ran a season ahead of him for the length of the career: while he was
  // playing his sixteen-year-old season they were playing their seventeenth,
  // and on his own draft night his classmates were nineteen with several of
  // them already professional. A draft class is a birth year, so it should be
  // his.
  const draftAge = Math.max(15, playerAge - Math.max(0, seasonsPlayed) - 1);
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
/**
 * The best of your year group in your league, at your own position.
 *
 * The scoring race is a forward's measuring stick. A defenceman is not trying
 * to win the Art Ross and a goalie cannot, so showing either of them how far
 * short of it they finished was telling them they had failed at somebody
 * else's job. They get the comparison that is actually theirs: the best
 * defenceman out of the draft class in this league, or the best save
 * percentage among its goalies.
 */
export function classBestAt(peers, league, pos) {
  const isG = pos === 'G';
  const isD = pos === 'LD' || pos === 'RD';
  const field = (peers || []).filter(p =>
    !p.retired && p.season && p.season.league === league
    && (isG ? p.pos === 'G' : isD ? (p.pos === 'LD' || p.pos === 'RD') : false)
    && (isG ? p.season.shots > 0 : true));
  if (!field.length) return null;

  if (isG) {
    const best = field.reduce((top, p) =>
      (p.season.saves / p.season.shots) > (top ? top.season.saves / top.season.shots : -1) ? p : top, null);
    return { name: best.name, sv: best.season.saves / best.season.shots, gp: best.season.gp };
  }
  const best = field.reduce((top, p) => (p.season.pts > (top?.season.pts ?? -1) ? p : top), null);
  return { name: best.name, pts: best.season.pts, g: best.season.g, a: best.season.a };
}

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
    goalName: ledGoals ? bestG.name : null,
    // The best of the year group in this league, whether or not he led it.
    //
    // A classmate takes an OHL scoring title about one year in twenty, which
    // is honest: the class is twenty-eight players and the league is several
    // hundred. But it also meant that during the three junior seasons when
    // the player most wants to know who else is in his year, the race almost
    // never had a name he recognised in it. This one always does, and it is
    // the comparison that actually matters to him: not the league leader,
    // the best of the kids he is being drafted against.
    classBest: best && !ledPoints ? { name: best.name, pts: best.season.pts } : null
  };
}

/**
 * The same thing for the goalies: what it took to lead this league in save
 * percentage, and whether anybody from the player's own year did it.
 *
 * scoringBar has existed for the skaters since the trophies stopped being flat
 * thresholds. The goalies never got one, so every goalie award in the game was
 * still a fixed number with no field behind it.
 */
export function goalieBar(peers, league) {
  const drawn = drawLeagueBestSv(league);
  const field = (peers || []).filter(p =>
    !p.retired && p.season && p.season.league === league && p.pos === 'G' && p.season.shots > 0);

  const best = field.reduce((top, p) => {
    const sv = p.season.saves / p.season.shots;
    return sv > (top ? top.sv : -1) ? { name: p.name, sv } : top;
  }, null);

  const led = best && best.sv > drawn;
  return {
    sv: led ? best.sv : drawn,
    name: led ? best.name : null,
    // The best of his own year group between the pipes, league leader or not.
    // That is the comparison he cares about.
    classBest: best && !led ? { name: best.name, sv: best.sv } : null
  };
}

/**
 * And the same for the blue line: how good the league's best defenceman was,
 * and whether one of his own year did it.
 *
 * The third and last of these. A classmate's season carries the plus-minus and
 * the ice time now, so his year can be put through the same two-halved grade
 * the player's goes through and the comparison is honest.
 */
export function dmanBar(peers, league) {
  const drawn = drawLeagueBestDman();
  const field = (peers || []).filter(p =>
    !p.retired && p.season && p.season.league === league
    && posGroup(p.pos) === 'D' && (p.season.gp || 0) >= 20);

  const best = field.reduce((top, p) => {
    const grade = rateSeason({
      league, pos: p.pos, games: p.season.gp,
      g: p.season.g, a: p.season.a, pm: p.season.pm, toi: p.season.avgToi
    });
    return grade > (top ? top.grade : -1) ? { name: p.name, grade } : top;
  }, null);

  const led = best && best.grade > drawn;
  return {
    grade: led ? best.grade : drawn,
    name: led ? best.name : null,
    classBest: best && !led ? { name: best.name, grade: best.grade } : null
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

export const peerUnit = (isGoalie) => (isGoalie ? 'shutouts' : 'points');

// WHO COUNTS AS A COMPARISON.
//
// Everything that ranked the class split it two ways, goalies and everybody
// else, so a shutdown defenceman was being measured on career points against
// the best centre in his year and told he was four hundred behind. Three
// groups, because that is how hockey compares players: the forwards together,
// the pair together, and the goalie on his own.
export const posGroup = (pos) => (pos === 'G' ? 'G' : (pos === 'LD' || pos === 'RD') ? 'D' : 'F');

export const groupName = (group, plural = true) =>
  group === 'G' ? (plural ? 'goaltenders' : 'goaltender')
    : group === 'D' ? (plural ? 'defencemen' : 'defenceman')
      : (plural ? 'forwards' : 'forward');

/**
 * Where he came off the board among his own kind.
 *
 * Every board in the game ranks inside a position group, so a rank off one of
 * them cannot be set against an overall pick number: ninth among the forwards
 * does not mean ninth overall, and subtracting the one from the other is what
 * produced "you sat through 45 picks you were not supposed to" out of two
 * figures that measure different things. The only comparison that holds is how
 * many of his own position were taken before him.
 */
export function positionDraftSlot(peers, pos, playerPick) {
  const group = posGroup(pos);
  const picked = (peers || []).filter(p => p.pick && p.pick !== playerPick && posGroup(p.pos) === group);
  const ahead = picked.filter(p => p.pick < playerPick).length;
  return { slot: ahead + 1, ahead, total: picked.length + 1, group };
}

export function findRival(peers, playerValue, pos = 'C') {
  const group = posGroup(pos);
  const isGoalie = group === 'G';
  const live = (peers || []).filter(p => posGroup(p.pos) === group && p.career.seasons > 0);
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
export function classTable(peers, limit = 10, pos = 'C') {
  const group = posGroup(pos);
  const isGoalie = group === 'G';
  return [...(peers || [])]
    .filter(p => posGroup(p.pos) === group && p.career.seasons > 0)
    .sort((x, y) => peerValue(y, isGoalie) - peerValue(x, isGoalie))
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// WHERE THE CLASS SHOWS UP
//
// The classmates have careers of their own, but a career only reaches the
// player when it crosses his. These are the handful of places one can: the
// night you were drafted, the room you walk into in September, and the short
// note each summer about what the rest of them did. None of them fires every
// year, on purpose.
// ---------------------------------------------------------------------------

/**
 * THE SCOUTING BOARD, BEFORE THE DRAFT.
 *
 * The class existed from the first day of a career and the player met none of
 * it until the night he was picked, when thirty strangers turned up either
 * side of his name. Nothing about that is memorable, because there is nothing
 * to remember: a list of names you are seeing for the first time is a list of
 * names.
 *
 * This is the thing the junior years were missing. Scouts rank the class every
 * season from the day the player turns up, the same board each year with the
 * same names on it moving around, and he is on it. Two winters of reading that
 * the Finnish centre is holding at number two, and watching himself climb from
 * nineteenth to ninth, and draft night has people in it.
 *
 * The ranking is ability plus a fixed scouting bias, so it tracks who is
 * actually good without being a leaderboard of hidden numbers, and a prospect
 * the scouts love at sixteen is still their favourite at eighteen.
 */
// The peers' age curve, run backwards: given what a prospect is now and how
// old he is, what is he on his way to being. Kept next to ovrAt so the two
// cannot drift apart.
// A season read against the league it was played in. Scouts do not put a
// thirty-six point U20 winger below a ninety-seven point OHL winger because
// the numbers say so, they divide both by what a star season looks like where
// each of them plays. Raw points had the U20 man two places higher.
const scaleProduction = (pts, gp, league) => {
  if (!gp) return 0;
  const star = paceOf(league).star || 1;
  return Math.min(8, ((pts || 0) / gp / star) * 6);
};

// How a scout reads a goaltender's season.
//
// Save percentage used to be the whole of it. That is the one number a goalie
// can post on a bad team without winning anything, and the one he can miss on
// a good team while winning forty. Scouts watch all three: whether he wins,
// whether he shuts teams out, and whether he stops the puck. They are weighted
// in that order of how much they move a draft board, and the record counts for
// nothing without the games to make it mean something.
const goalieProduction = (season) => {
  if (!season) return 0;
  const gp = season.gp || 0;
  const shots = season.shots || 0;
  const sv = shots > 0 ? (season.saves || 0) / shots : null;

  const svPart = sv != null ? Math.max(-4, Math.min(4, (sv - 0.905) * 150)) : 0;

  const decided = (season.wins || 0) + (season.losses || 0) + (season.otl || 0);
  const winPart = decided >= 12
    ? Math.max(-3, Math.min(3.5, (((season.wins || 0) / decided) - 0.5) * 11))
    : 0;

  // Shutouts are rate-dependent: four in twenty games is a different thing
  // from four in sixty.
  const shoPart = gp >= 12
    ? Math.min(2.5, ((season.sho || 0) / gp) * 28)
    : 0;

  return Math.max(-5, Math.min(8, svPart + winPart + shoPart));
};

const projectedPeak = (ovr, age) => {
  const f = 0.35 + 0.65 * Math.min(1, Math.max(0, (age - 17) / 8));
  return 52 + (ovr - 52) / f;
};

// A fixed scouting lean on the player himself, so the board is not a plain
// readout of his overall and a career is not identical to the last one. Taken
// from his name rather than rolled, because it has to survive a reload and
// read the same every time the screen draws.
const nameBias = (name) => {
  let h = 2166136261;
  for (let i = 0; i < String(name || '').length; i++) {
    h ^= String(name).charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (((h >>> 0) % 1000) / 1000 - 0.5) * 4.6;
};

export function scoutingBoard(peers, player, limit = 10, ownSeason = null) {
  // Ranked inside his own position group. A winger is not competing with the
  // goalies in his year for the same job, and a board that mixed all three
  // told him he was eleventh without saying eleventh at what.
  const group = posGroup(player?.pos || 'C');
  const live = (peers || []).filter(p => !p.retired && posGroup(p.pos) === group);
  if (!live.length) return null;

  // What he is worth to a scout this winter. A season in front of them counts:
  // a prospect who has just put up a hundred points is being talked about
  // whatever the projection says.
  const scoreOf = (p) => {
    const produced = p.season && p.pos !== 'G'
      ? scaleProduction(p.season.pts, p.season.gp, p.season.league)
      : p.season && p.pos === 'G' && p.season.shots
        ? goalieProduction(p.season)
        : 0;
    return (p.ovr || 0) * 0.55 + (p.peak || 0) * 0.45 + (p.scoutBias || 0) + produced;
  };

  const rows = live.map(p => ({
    id: p.id,
    name: p.name,
    nat: p.nat,
    pos: p.pos,
    flag: flagFor(p.nat),
    team: p.team || p.juniorTeam,
    league: p.league && p.league !== 'JR' ? p.league : p.juniorLeague,
    pts: p.season && p.pos !== 'G' ? (p.season.pts || 0) : null,
    sv: p.season && p.pos === 'G' && p.season.shots ? p.season.saves / p.season.shots : null,
    // Games, because a point total without them is not a comparison. Fifty
    // points is a different player in forty games than in seventy, and the
    // board was printing the ranking with no production beside it at all.
    gp: p.season ? (p.season.gp || 0) : null,
    score: scoreOf(p),
    me: false
  }));

  // The player is scored on the same two things his classmates are: what he
  // is now, and what the scouts think he becomes. draftBonus is the only part
  // of the second he can move, and it is what the combine and every interview
  // question since have been feeding into.
  if (player) {
    // The season he has just played, handed in directly where the caller has
    // it, because the recap is built before it reaches his history.
    const last = ownSeason || (player.seasonHistory || [])[(player.seasonHistory || []).length - 1] || null;
    const myPts = last ? (last.pts != null ? last.pts : (last.goals || 0) + (last.assists || 0)) : null;
    const mySv = last && last.shots ? last.saves / last.shots : null;
    const myGp = last ? (last.gp ?? last.games ?? 0) : 0;
    const myProduced = player.pos === 'G'
      ? goalieProduction({
          saves: last?.saves, shots: last?.shots, sho: last?.shutouts ?? last?.sho,
          wins: last?.wins, losses: last?.losses, otl: last?.otl, gp: myGp
        })
      : (myPts != null ? scaleProduction(myPts, myGp, player.league) : 0);
    rows.push({
      id: 'me',
      name: player.name,
      nat: player.nat,
      pos: player.pos,
      flag: flagFor(player.nat),
      team: player.team,
      league: player.league,
      pts: player.pos !== 'G' ? myPts : null,
      sv: player.pos === 'G' ? mySv : null,
      gp: myGp || null,
      // Scored on the same two halves his classmates are, which means he needs
      // a projection too. Inverting the peers' own age curve gives one on
      // exactly their scale: what a sixteen-year-old at this rating is usually
      // on his way to becoming. Without it he was graded on what he is today
      // against what they will be, and sat last on every board.
      score: projectedPeak(player.ovr || 0, player.age || 17) * 0.45
        + (player.ovr || 0) * 0.55
        + (player.draftBonus || 0) * 0.22
        + (player.isGenerational ? 3 : 0)
        + nameBias(player.name)
        + myProduced,
      me: true
    });
  }

  rows.sort((a, b) => b.score - a.score);
  rows.forEach((r, i) => { r.rank = i + 1; });

  const mine = rows.find(r => r.me) || null;
  return {
    rows: rows.slice(0, limit),
    me: mine,
    myRank: mine ? mine.rank : null,
    total: rows.length,
    // The board was filtered to one position group on the way in, so it has to
    // say so on the way out. A rank printed without it reads as a place in the
    // whole class, which is not what was counted.
    group,
    groupLabel: groupName(group),
    // Whoever is one place above him. During a junior season that is the
    // comparison that bites.
    ahead: mine && mine.rank > 1 ? rows[mine.rank - 2] : null,
    behind: mine && mine.rank < rows.length ? rows[mine.rank] : null,
    // The stretch of the board he is standing in: the two he is chasing, him,
    // and the two chasing him. Clamped so that being first or last still shows
    // a board rather than a stub, and so a thin class shows whatever it has.
    near: mine
      ? rows.slice(
        Math.max(0, Math.min(mine.rank - 3, rows.length - 5)),
        Math.max(0, Math.min(mine.rank - 3, rows.length - 5)) + 5
      )
      : []
  };
}

/**
 * Who went around you on draft night.
 *
 * The class is created when the career starts, so the names exist before the
 * draft screen does; it simply never asked for them. Picks are assigned by
 * peak ability with some noise, because scouts are not oracles, and then the
 * player is slotted in at his own pick.
 */
export function draftBoard(peers, playerPick, playerName, count = 2, leagueState = null) {
  const pool = (peers || []).filter(p => p.pick);
  if (!pool.length) return { before: [], after: [] };

  // The picks were settled when the class was created and are kept for the
  // life of the career, so the board here is the same board the retirement
  // screen prints twenty years later.
  const byPick = new Map();
  pool.forEach(p => {
    if (p.pick === playerPick) return;
    byPick.set(p.pick, {
      name: p.name, nat: p.nat, pos: p.pos, pick: p.pick, team: p.draftedBy,
      flag: flagFor(p.nat), from: p.juniorTeam, fromLeague: p.juniorLeague
    });
  });

  // The picks either side, rather than the classmates either side.
  //
  // The class is twenty-eight players spread across two rounds, so the two
  // "before" and two "after" were whoever in the year group happened to be
  // nearest: picks 8, 10, you at 12, then 14 and 16. A draft board shows the
  // order of the room, and the names directly around yours are what you look
  // at it for. The gaps are filled with the rest of the room,
  // who exist on that one screen and nowhere else: they are generated from
  // the pick number and the class, so they are the same every time it draws
  // and after a reload, without being carried around in the save.
  const salt = hash(pool.slice(0, 4).map(p => p.name).join('|'));
  const order = draftOrder(leagueState, nhlTeams || []);
  const taken = new Set(pool.map(p => p.name));

  const filler = (pickNo) => {
    const rnd = rngFrom(salt ^ Math.imul(pickNo, 2654435761));
    let nat = NATS[Math.floor(rnd() * NATS.length)];
    let name = '';
    for (let tries = 0; tries < 6; tries++) {
      name = `${FIRST[nat][Math.floor(rnd() * FIRST[nat].length)]} ${LAST[nat][Math.floor(rnd() * LAST[nat].length)]}`;
      if (!taken.has(name)) break;
    }
    taken.add(name);
    const route = routeFrom(nat, rnd);
    return {
      name, nat, pick: pickNo,
      pos: SKATER_POS[Math.floor(rnd() * SKATER_POS.length)],
      team: order.length ? order[(pickNo - 1) % order.length] : null,
      flag: flagFor(nat),
      from: route.juniorTeam,
      fromLeague: route.juniorLeague
    };
  };

  const at = (pickNo) => {
    if (pickNo < 1) return null;
    return byPick.get(pickNo) || filler(pickNo);
  };

  const before = [];
  for (let n = playerPick - count; n < playerPick; n++) {
    const row = at(n);
    if (row) before.push(row);
  }
  const after = [];
  for (let n = playerPick + 1; n <= playerPick + count; n++) {
    const row = at(n);
    if (row) after.push(row);
  }

  return { before, after };
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

  // Most summers should pass with nothing said about them. A class of
  // twenty-eight generates something worth saying nearly every year if you let
  // it, and then it stops being news and becomes a drumbeat: at the first
  // calibration this fired in sixteen of twenty seasons, including seven
  // consecutive retirement notices.
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
        'You can only control your own game.',
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
