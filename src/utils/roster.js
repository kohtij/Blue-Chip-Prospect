import { gaussianNoise } from './production';

// THE ROOM.
//
// The club a player turned up to every day for six years was three numbers: a
// coach-trust number, a teammate-trust number and a media number. Nobody in it
// had a name. Meanwhile the draft class is twenty-eight named men he follows
// from sixteen to the night he is picked, and by that night the names mean
// something, which is the best thing in the game. All of that was pointed at
// his rivals and none of it at the people he actually plays with.
//
// A room is six or seven men, not a twenty-man roster: the ones a player would
// talk about. His linemates or his defence partner or, if he is a goaltender,
// the other goalie. The men at his own position who want his job. The captain.
// A veteran at the end. A kid who arrives young and gets better every year,
// which is the only clock a career has had other than the aging curve.
//
// The room belongs to the CLUB, not to the player. Leave Boston at twenty-four
// and sign back at thirty-one and the room has moved on without you: two have
// retired, one of them is captain now, and there is a kid who was fourteen the
// last time you were here.
//
// He never picks a line, never signs anybody, never manages a roster. The room
// is weather. He finds out who his linemate is.

const FIRST = {
  CAN: ['Tyler', 'Brayden', 'Mitch', 'Connor', 'Logan', 'Dylan', 'Carter', 'Hunter', 'Nolan', 'Owen', 'Reid', 'Cale', 'Jayden', 'Mason', 'Riley', 'Keegan'],
  USA: ['Jack', 'Matthew', 'Cole', 'Trevor', 'Brady', 'Quinn', 'Chase', 'Blake', 'Shane', 'Tanner', 'Griffin', 'Colton', 'Parker', 'Easton'],
  SWE: ['Erik', 'Viktor', 'Oskar', 'Elias', 'Rasmus', 'Lucas', 'Jonas', 'Anton', 'Filip', 'Hampus', 'Axel', 'Pontus'],
  FIN: ['Mikko', 'Juuso', 'Aleksi', 'Eetu', 'Kaapo', 'Joonas', 'Lauri', 'Niko', 'Topi', 'Urho', 'Teemu'],
  RUS: ['Artemi', 'Nikita', 'Pavel', 'Ilya', 'Vadim', 'Kirill', 'Yegor', 'Matvei', 'Semyon', 'Andrei'],
  CZE: ['Jakub', 'Tomas', 'David', 'Dominik', 'Lukas', 'Martin', 'Filip', 'Radek'],
  SVK: ['Juraj', 'Martin', 'Peter', 'Simon', 'Adam', 'Marek', 'Dalibor'],
  SUI: ['Nico', 'Timo', 'Jonas', 'Sven', 'Luca', 'Gaetan', 'Andres'],
  GER: ['Leon', 'Tim', 'Moritz', 'Lukas', 'Jonas', 'Nico', 'Marcel'],
  DEN: ['Oliver', 'Nikolaj', 'Frederik', 'Lars', 'Mathias', 'Jesper']
};

const LAST = {
  CAN: ['Prescott', 'Vandermeer', 'Boucher', 'Lalonde', 'Whitfield', 'Marchessault', 'Ironside', 'Beaulieu', 'Hargreaves', 'Dufresne', 'Kinsella', 'Rousseau', 'Tremblay', 'Hollingsworth', 'Gauthier'],
  USA: ['Whitaker', 'Brennan', 'Sheffield', 'Caldwell', 'Mahoney', 'Donnelly', 'Keller', 'Brightwell', 'Rasmussen', 'Hollis', 'Vaughn', 'Kozlow'],
  SWE: ['Lindholm', 'Bergqvist', 'Sandstrom', 'Ahlberg', 'Nystrom', 'Hedlund', 'Wallin', 'Forsling', 'Ostlund'],
  FIN: ['Hakkarainen', 'Rautio', 'Virtanen', 'Lehtonen', 'Koskinen', 'Niemela', 'Salminen', 'Jarvinen'],
  RUS: ['Volkov', 'Sorokin', 'Gusev', 'Romanov', 'Bragin', 'Zhuravlev', 'Panov', 'Yermolaev'],
  CZE: ['Jelinek', 'Novotny', 'Riha', 'Svoboda', 'Kubat', 'Hruby', 'Marek'],
  SVK: ['Hudak', 'Slovak', 'Bucko', 'Kristof', 'Zeleznik', 'Mracko'],
  SUI: ['Brunner', 'Hofmann', 'Keller', 'Zuber', 'Moser', 'Baumgartner'],
  GER: ['Seidel', 'Brandt', 'Eichel', 'Hoffmann', 'Reichel', 'Kahun'],
  DEN: ['Jensen', 'Poulsen', 'Lauridsen', 'Blichfeld', 'Ehlers']
};

const NATS = ['CAN', 'CAN', 'CAN', 'USA', 'USA', 'SWE', 'FIN', 'RUS', 'CZE', 'SVK', 'SUI', 'GER', 'DEN'];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export const isD = (pos) => pos === 'LD' || pos === 'RD';
export const isF = (pos) => pos === 'C' || pos === 'LW' || pos === 'RW';
const otherSide = (pos) => (pos === 'LD' ? 'RD' : 'LD');

// What a forward is for, which is most of what makes a linemate worth having.
// A sniper on your wing turns your passes into assists; a playmaker beside you
// turns your shots into goals. The names match production.js so the two halves
// of the engine are talking about the same thing.
const F_ARCHETYPES = ['Sniper', 'Playmaker', 'Power Forward', 'Two-Way'];
const D_ARCHETYPES = ['Puck-Mover', 'Shutdown', 'Two-Way'];

/**
 * How good the men around him are.
 *
 * Scaled off the club's own strength, which leagueState already keeps and
 * already drifts year to year, so signing with a contender genuinely means
 * better players beside you and a rebuild genuinely means worse ones. Slot
 * matters too: the first name in a room is a top-line player and the last is
 * a depth piece.
 */
const drawToday = (strength, slot, size, league) => {
  const share = slot / Math.max(1, size);
  const top = 76 + (clamp(strength, 0, 1) - 0.5) * 22;
  const base = top - share * 16;
  const lgShift = league === 'NHL' ? 0 : league === 'AHL' ? -8 : -14;
  return clamp(Math.round(base + lgShift + gaussianNoise() * 3.5), 48, 95);
};

/**
 * The slot says what he is TODAY, not what he will be at his best.
 *
 * Read as a peak it came out wrong in a way that was easy to miss: a room is
 * drawn with ages spread around the player's, so most of the men in it are a
 * few years past twenty-five, and treating the slot value as a peak quietly
 * subtracted those years from everybody. An average NHL room's top two
 * forwards came out at sixty-five, which is an AHL line. The peak is solved
 * backwards from what he is now and his age, so he is the player the slot says
 * and he still ages from there like everyone else.
 */
const peakFrom = (today, age, peakAge) => {
  if (age <= peakAge) {
    const up = Math.min(1, Math.max(0, (age - 17) / Math.max(3, peakAge - 17)));
    return clamp(Math.round(52 + (today - 52) / (0.35 + 0.65 * up)), today, 99);
  }
  const past = age - peakAge;
  return clamp(Math.round(today + past * (past > 6 ? 2.6 : 1.5)), today, 99);
};

// The same curve the draft class ages on, so a man in the room and a man on
// the board are the same kind of creature and neither can out-live the other.
const ovrAt = (m) => {
  const gap = m.peak - 52;
  const up = Math.min(1, Math.max(0, (m.age - 17) / Math.max(3, m.peakAge - 17)));
  const rising = 52 + gap * (0.35 + 0.65 * up);
  if (m.age <= m.peakAge) return Math.round(rising);
  const past = m.age - m.peakAge;
  return Math.round(m.peak - past * (past > 6 ? 2.6 : 1.5));
};

/**
 * Which positions a room needs, given what the player is.
 *
 * Guaranteed coverage rather than fixed slots: a forward needs two men at his
 * own position who want his job and two who can play on his line; a
 * defenceman needs a partner from the other side and two rivals from his own;
 * a goaltender needs the other goaltender, which is the relationship this
 * whole file exists to make possible.
 */
const planFor = (pos) => {
  if (pos === 'G') return ['G', 'LD', 'RD', 'LD', 'C', 'LW', 'RW'];
  if (isD(pos)) return [otherSide(pos), pos, pos, 'C', 'LW', 'RW', 'G'];
  const wings = pos === 'C' ? ['LW', 'RW'] : ['C', pos === 'LW' ? 'RW' : 'LW'];
  return [wings[0], wings[1], pos, pos, 'LD', 'RD', 'G'];
};

const makeMan = (seed, { pos, strength, slot, size, league, age }) => {
  const nat = pick(NATS);
  const name = `${pick(FIRST[nat])} ${pick(LAST[nat])}`;
  const peakAge = 25 + Math.round(gaussianNoise() * 2);
  const peak = peakFrom(drawToday(strength, slot, size, league), age, peakAge);
  const m = {
    id: `rm${seed}`,
    name,
    nat,
    pos,
    age,
    peak,
    peakAge,
    archetype: pos === 'G' ? null : isD(pos) ? pick(D_ARCHETYPES) : pick(F_ARCHETYPES),
    // What he thinks of the player. Starts neutral and is earned or lost.
    trust: 50,
    // Seasons alongside him, which is the whole basis of the retirement line
    // about the man you played the most games with.
    years: 0,
    gp: 0,
    captain: false,
    // A man who came up in the player's own draft class, carried by id so the
    // two systems cannot tell different stories about the same person.
    peerId: null
  };
  m.ovr = ovrAt(m);
  return m;
};

/**
 * Ages a room by one summer: everyone a year older, the worn-out ones gone,
 * and a replacement in for anybody who left.
 *
 * Churn is deliberate and low. A room that turned over every year would be a
 * list of strangers again, which is the thing this replaces.
 */
export function advanceRoom(room, { strength = 0.5, league = 'NHL' } = {}) {
  if (!room || !Array.isArray(room.men)) return room;
  const size = room.men.length;
  let seed = room.seed || size;

  const men = [];
  const left = [];
  for (const raw of room.men) {
    const m = { ...raw, age: raw.age + 1 };
    m.ovr = ovrAt(m);
    // Old and finished, or simply moved on. One in nine leaves in a summer,
    // which turns a room over across about a decade.
    const done = (m.age >= 36 && m.ovr < 62) || m.age >= 41;
    if (done || Math.random() < 0.11) {
      left.push({ ...raw, retired: done });
      seed += 1;
      const slot = men.length;
      men.push(makeMan(seed, {
        pos: m.pos, strength, slot, size, league,
        // A replacement is usually young, because that is who clubs replace
        // people with, and a young one is the arriving kid this room needs.
        age: Math.random() < 0.55 ? 19 + Math.floor(Math.random() * 4) : 24 + Math.floor(Math.random() * 7)
      }));
    } else {
      men.push(m);
    }
  }

  // The captaincy follows the room. If the captain left, the longest-serving
  // man with something left takes it. Never a goaltender: the league does not
  // let one wear the C, and older saves gave it to one.
  for (const m of men) if (m.pos === 'G') m.captain = false;
  if (!men.some(m => m.captain)) {
    const skaters = men.filter(m => m.pos !== 'G');
    const eligible = skaters.filter(m => m.age >= 25 && m.ovr >= 60);
    const next = [...(eligible.length ? eligible : skaters)]
      .sort((a, b) => (b.years - a.years) || (b.ovr - a.ovr))[0];
    if (next) next.captain = true;
  }

  // The men who have gone are not forgotten. The ones he actually shared ice
  // with are kept, so the retirement screen can still name the man he played
  // the most games beside after that man has moved on, and the summer can say
  // who left.
  const alumni = [...(room.alumni || []), ...left.filter(m => (m.gp || 0) > 0)]
    .sort((a, b) => (b.gp || 0) - (a.gp || 0))
    .slice(0, 6);

  return { ...room, men, seed, alumni, leftLastSummer: left };
}

/**
 * The room for a club, made the first time the player walks into it.
 *
 * Classmates already on the club are folded in rather than duplicated, so the
 * Finnish centre he has watched since he was sixteen can turn up beside him at
 * twenty-six and still be the same man.
 */
export function makeRoom({ teamId, league = 'NHL', playerPos = 'C', playerAge = 20, strength = 0.5, classmates = [] }) {
  const plan = planFor(playerPos);
  const size = plan.length;
  const men = [];
  const taken = new Set();

  plan.forEach((pos, slot) => {
    // A classmate on this club who plays this position fills the slot himself.
    const mate = classmates.find(c => !taken.has(c.id) && c.pos === pos && !c.retired);
    if (mate) {
      taken.add(mate.id);
      men.push({
        id: `rm-${mate.id}`,
        name: mate.name,
        nat: mate.nat,
        pos: mate.pos,
        age: mate.age,
        peak: mate.peak,
        peakAge: mate.peakAge || 25,
        archetype: pos === 'G' ? null : isD(pos) ? pick(D_ARCHETYPES) : pick(F_ARCHETYPES),
        // A man he came up with starts ahead of a stranger, because he is.
        trust: 62,
        years: 0,
        gp: 0,
        captain: false,
        ovr: mate.ovr,
        peerId: mate.id
      });
      return;
    }
    // Ages spread around the player's own, so a room is not a year group.
    const age = clamp(Math.round(playerAge + gaussianNoise() * 4.5 + (slot < 2 ? 2 : 0)), 19, 38);
    men.push(makeMan(slot, { pos, strength, slot, size, league, age }));
  });

  // The best man old enough to wear it, and failing that simply the best man.
  // Sorted on ability rather than age, or a room of twenty-two-year-olds hands
  // the letter to whichever fringe player happened to be drawn at twenty-eight.
  // Never a goaltender, who cannot wear the C in this league.
  const skaters = men.filter(m => m.pos !== 'G');
  const senior = skaters.filter(m => m.age >= 25 && m.ovr >= 60);
  const cap = [...(senior.length ? senior : skaters)].sort((a, b) => b.ovr - a.ovr)[0];
  if (cap) cap.captain = true;

  return { teamId, league, men, seed: size };
}

/** Every room the save knows about, keyed by club. */
export const roomFor = (rooms, teamId) => (teamId ? (rooms || {})[teamId] || null : null);

/**
 * Where he sits among his own club at his own position: how many men in the
 * room are better than him.
 *
 * This is the number that makes a signing or a trade something that happens TO
 * him. A seventy-two rated centre behind an eighty-five and an eighty is the
 * third-line centre whatever his contract says, and no amount of coach trust
 * changes the fact that two better men are already there.
 */
export function depthAhead(room, pos, ovr) {
  if (!room || !Array.isArray(room.men)) return 0;
  // The men who want HIS job, which is narrower than the men who play his half
  // of the ice. A right defenceman is not competing with a left one and a
  // winger is not competing with a centre, and counting them as rivals made
  // every defenceman in the game look two deep on his own side.
  const group = room.men.filter(m => m.pos === pos);
  return group.filter(m => m.ovr > ovr).length;
}

/** The other goaltender. The closest relationship in any room, and the one
 *  that turns on who is playing. */
export const goaliePartner = (room) => (room?.men || []).find(m => m.pos === 'G') || null;

/**
 * Who he plays with. Two names for a skater, and for a goaltender the two
 * defencemen who spend the most time in front of him.
 */
export function lineFor(room, pos) {
  if (!room || !Array.isArray(room.men)) return [];
  const men = room.men;
  if (pos === 'G') return men.filter(m => isD(m.pos)).sort((a, b) => b.ovr - a.ovr).slice(0, 2);
  if (isD(pos)) {
    const partner = men.filter(m => isD(m.pos) && m.pos !== pos).sort((a, b) => b.ovr - a.ovr)[0];
    return partner ? [partner] : men.filter(m => isD(m.pos)).slice(0, 1);
  }
  // A forward's linemates are the forwards who are not competing for his own
  // job, best first.
  return men.filter(m => isF(m.pos) && m.pos !== pos).sort((a, b) => b.ovr - a.ovr).slice(0, 2);
}

/**
 * What his linemates do to his scoring.
 *
 * Returns a multiplier on offence and a tilt between goals and assists. The
 * tilt is the part worth having: a sniper beside him turns his passes into
 * assists, a playmaker turns his shots into goals, and three years next to one
 * man and then a trade in February is the most recognisable shape in hockey.
 *
 * Centred on 1.00 at a league-average line so a career that never sees the
 * room still scores what it always did.
 */
export function lineEffect(room, pos) {
  const mates = lineFor(room, pos);
  if (!mates.length) return { offence: 1, support: 1, goalTilt: 1, assistTilt: 1, mates: [] };

  const avg = mates.reduce((a, m) => a + (m.ovr || 70), 0) / mates.length;
  // A goaltender scores nothing, so the two men in front of him are support
  // rather than offence: good defencemen give up fewer and worse chances.
  // Pivoted on what an average club's top pair of linemates actually is, so a
  // middling room is neutral and only a genuinely good or bad one moves him.
  // CHEMISTRY. Seasons spent on the same line count for something of their
  // own: a winger who knows where you will be without looking is worth a few
  // points a year that his rating does not explain. It builds slowly and caps
  // early, and a new linemate starts from nothing, so a trade costs a little
  // more than the talent going out of the door.
  // Centred on a typical line's shared history, so the room as a whole scores
  // what it did before and only the extremes move: a brand-new pairing is a
  // little worse than its talent, four years together a little better.
  const together = mates.reduce((a, m) => a + Math.min(4, m.lineYears || 0), 0) / mates.length;
  const chemistry = (together - 2.5) * 0.012;
  const support = clamp(1 + (avg - 74) * 0.006 + chemistry * 0.5, 0.88, 1.12);
  const offence = pos === 'G' ? 1 : clamp(1 + (avg - 74) * 0.011 + chemistry, 0.80, 1.22);

  let goalTilt = 1, assistTilt = 1;
  for (const m of mates) {
    const w = 1 / mates.length;
    if (m.archetype === 'Sniper') { assistTilt += 0.16 * w; goalTilt -= 0.05 * w; }
    else if (m.archetype === 'Playmaker') { goalTilt += 0.16 * w; assistTilt -= 0.05 * w; }
    else if (m.archetype === 'Power Forward') { goalTilt += 0.05 * w; }
    else if (m.archetype === 'Puck-Mover') { assistTilt += 0.06 * w; }
  }
  return { offence, support, goalTilt: clamp(goalTilt, 0.85, 1.20), assistTilt: clamp(assistTilt, 0.85, 1.20), mates, chemistry };
}

/** The room's feeling about him, as one number, so everything that reads
 *  relationships.teammates keeps working. */
export function roomTrust(room) {
  const men = room?.men || [];
  if (!men.length) return null;
  return Math.round(men.reduce((a, m) => a + (m.trust ?? 50), 0) / men.length);
}

/** The man who likes him least, for an event that needs somebody to name. */
export const coldest = (room) => {
  const men = [...(room?.men || [])].sort((a, b) => (a.trust ?? 50) - (b.trust ?? 50));
  return men[0] || null;
};

/** The man he has played the most games alongside. The retirement screen's. */
// It carries the room's own league, because a club id alone is ambiguous: an
// NHL id read as an AHL one names that club's farm team, which is how the
// retirement screen credited him with ten years at a club he never played for.
export const closest = (rooms) => {
  let best = null;
  for (const t of Object.keys(rooms || {})) {
    const room = rooms[t] || {};
    for (const m of [...(room.men || []), ...(room.alumni || [])]) {
      if (!best || (m.gp || 0) > (best.gp || 0)) best = { ...m, teamId: t, league: room.league };
    }
  }
  return best && best.gp > 0 ? best : null;
};

// ───────────────────────────────── COACHES ─────────────────────────────────
//
// There was no coach. Coach trust existed, moved, and decided a third of his
// ice time, and it belonged to nobody: it could not be lost by a man leaving
// or won by a new one arriving. A career could run twenty years under the same
// invisible staff.
//
// A coach has a name, a system that suits a player or does not, and a job he
// can lose. Losing it is the point. The fan-souring arc ends with a front
// office under pressure, and the first thing a front office under pressure
// does is fire the coach, not trade the star.

// Invented surnames on purpose. The first list borrowed real NHL coaches'
// surnames, which put a "Dave Berube" behind a fictional bench, and it was small
// enough that a club could fire a man and hire his namesake.
const COACH_FIRST = ['Mike', 'Dave', 'Rick', 'Craig', 'Paul', 'Gerard', 'Peter', 'Bruce', 'Jon', 'Andre', 'Martin', 'Travis', 'Dean', 'Glen', 'Barry', 'Kevin', 'Todd', 'Randy', 'Marc', 'Scott', 'Darryl', 'Wayne', 'Ron', 'Guy'];
const COACH_LAST = ['Halloran', 'Desrosiers', 'Kowalchuk', 'Pellerin', 'Brannigan', 'Ostrander', 'Lavigne', 'McTavish', 'Strand', 'Danforth', 'Gendron', 'Holtzman', 'Rowntree', 'Beaudette', 'Sorensen', 'Wexler', 'Corrigan', 'Lachance', 'Pruitt', 'Harwood', 'Thibault', 'Kerrigan', 'Voss', 'Mulcahy'];

/**
 * A system, and who it suits.
 *
 * Deliberately blunt: three systems, and whether a player fits is a matter of
 * what he is rather than a hidden number. A defensive coach trusts a Shutdown
 * centre and does not trust a Sniper, and a player can spend two years being
 * the wrong sort of player for the man behind the bench, which happens to real
 * careers constantly and has never once happened in this game.
 */
export const COACH_SYSTEMS = {
  attacking: { label: 'Attacking', likes: ['Sniper', 'Playmaker', 'Puck-Mover'], dislikes: ['Shutdown'] },
  defensive: { label: 'Defensive', likes: ['Shutdown', 'Two-Way', 'Power Forward'], dislikes: ['Sniper'] },
  balanced:  { label: 'Balanced',  likes: [], dislikes: [] }
};

export function makeCoach({ strength = 0.5, avoid = [] } = {}) {
  const sysKeys = Object.keys(COACH_SYSTEMS);
  // Never the man he is replacing, and never anybody already behind a bench.
  const taken = new Set(avoid.filter(Boolean));
  let name = `${pick(COACH_FIRST)} ${pick(COACH_LAST)}`;
  for (let i = 0; i < 40 && taken.has(name); i++) name = `${pick(COACH_FIRST)} ${pick(COACH_LAST)}`;
  return {
    name,
    system: pick(sysKeys),
    // How long he has been there, which is what a club's patience runs against.
    years: 0,
    // A better club hires a better coach, roughly.
    quality: clamp(Math.round(50 + (strength - 0.5) * 40 + gaussianNoise() * 8), 20, 90)
  };
}

/**
 * What the coach thinks of this player before anything has happened.
 *
 * A new coach does not inherit the last one's opinion, which is the whole
 * reason a firing matters. He starts near neutral, shaded by whether the
 * player is his sort of player.
 */
export function coachOpening(coach, archetype) {
  if (!coach) return 50;
  const sys = COACH_SYSTEMS[coach.system] || COACH_SYSTEMS.balanced;
  let base = 50 + gaussianNoise() * 6;
  if (archetype && sys.likes.includes(archetype)) base += 14;
  if (archetype && sys.dislikes.includes(archetype)) base -= 16;
  return clamp(Math.round(base), 10, 90);
}

/**
 * Does he survive the summer.
 *
 * Years without a deep run cost him, a cold room costs him, and a club whose
 * fans have turned costs him most of all. Nothing fires a coach in his first
 * season, because clubs do not do that to a man they have just hired.
 */
export function coachSurvives(coach, { barrenYears = 0, roomTrust: trust = 50, fanPressure = false } = {}) {
  if (!coach) return false;
  if ((coach.years || 0) < 1) return true;
  // A voice goes stale. Even a good coach at a good club is usually gone
  // inside half a dozen years, which is what the real numbers say: the base
  // rate alone had winning clubs keeping the same man for seventeen seasons.
  let odds = 0.10 + (coach.years || 0) * 0.03;
  odds += Math.max(0, barrenYears - 1) * 0.09;
  if (trust < 40) odds += 0.12;
  if (fanPressure) odds += 0.20;
  odds -= ((coach.quality || 50) - 50) * 0.002;
  return Math.random() > clamp(odds, 0.02, 0.80);
}

// ──────────────────────────── THE SEASON'S WORK ────────────────────────────

/**
 * Make sure the club he is about to play for has a room and a coach.
 *
 * Called when a season starts. A club he has never played for is built on the
 * spot; one he has played for before is exactly as he left it, minus whoever
 * has retired since. Returns only what changed, so a caller can spread it.
 */
export function ensureClub(player, { teamId, league = 'NHL', strength = 0.5, classmates = [] } = {}) {
  if (!teamId) return null;
  const rooms = { ...(player?.rooms || {}) };
  const coaches = { ...(player?.coaches || {}) };
  let fresh = false;

  if (!rooms[teamId]) {
    rooms[teamId] = makeRoom({
      teamId, league, playerPos: player?.pos || 'C',
      playerAge: player?.age || 20, strength, classmates
    });
    fresh = true;
  }
  if (!coaches[teamId]) {
    coaches[teamId] = makeCoach({ strength, avoid: Object.values(coaches).map(x => x?.name) });
    fresh = true;
  }
  return { rooms, coaches, fresh };
}

/**
 * What a season does to the room.
 *
 * Games alongside him accrue, which is the whole basis of the one line the
 * retirement screen should have had all along. Trust moves on how the year
 * went and on the one thing that genuinely divides a dressing room.
 *
 * THE OTHER GOALTENDER.
 *
 * Two goalies on one club are the closest pair in the room and the only pair
 * whose interests are directly opposed: there is one net. The split of starts
 * is what it turns on. Take sixty of eighty-two and the man behind you has
 * spent the winter watching, and he knows what that does to his next contract.
 * Lose the net and he is fine, and you are the one with the problem. Nothing
 * else in a dressing room works like that, which is why it is modelled and
 * the rest of the room is not.
 */
export function recordSeason(room, { pos = 'C', games = 0, scheduleGames = 82, won = false, titleWon = false } = {}) {
  if (!room || !Array.isArray(room.men)) return room;
  const share = scheduleGames > 0 ? Math.min(1, games / scheduleGames) : 0;
  // Who he spent the year beside, which is what chemistry is built from.
  const onLine = new Set(games > 0 ? lineFor(room, pos).map(m => m.id) : []);

  const men = room.men.map(m => {
    const next = { ...m, years: (m.years || 0) + 1 };
    // A year lost to injury neither builds it nor breaks it.
    next.lineYears = games <= 0 ? (m.lineYears || 0)
      : onLine.has(m.id) ? (m.lineYears || 0) + 1 : 0;
    // Games actually shared. A man who played beside him for a full year
    // banks a full year; one of them was hurt and they banked less.
    next.gp = (m.gp || 0) + Math.round(games * (0.75 + Math.random() * 0.25));

    let move = 0;
    if (pos === 'G' && m.pos === 'G') {
      // THE NET DECIDES IT, AND ALMOST NOTHING ELSE DOES.
      //
      // Winning and time warm every other man in the room and they do not warm
      // this one, because what he wants is not what the player wants: there is
      // one net and they are both goalies. A fifty-fifty split leaves him
      // where he was. Sixty of eighty-two and he is a man in a ball cap at the
      // end of the bench watching somebody else have his career, and he knows
      // what that does to his next contract. Lose the net and the arithmetic
      // runs the other way: he is perfectly happy, and the problem is yours.
      move += 1.5 - (share - 0.5) * 52;
    } else {
      // Winning is the easiest thing to like a teammate for.
      if (titleWon) move += 7;
      else if (won) move += 3;
      // And time. A room warms to a man who keeps turning up.
      move += 1.5;
    }

    next.trust = clamp(Math.round((m.trust ?? 50) + move + gaussianNoise() * 2.5), 0, 100);
    return next;
  });

  return { ...room, men };
}

/**
 * The summer, at every club the save knows about.
 *
 * Rooms age. Coaches survive or do not, and a new one does not inherit the old
 * one's opinion, which is the entire reason a firing matters: a player can
 * spend two years being the wrong sort of player for the man behind the bench
 * and then have that man replaced by someone who likes him.
 */
export function summerAtClubs(player, { strengthOf = () => 0.5, barrenYears = 0, fanPressure = false } = {}) {
  const rooms = { ...(player?.rooms || {}) };
  const coaches = { ...(player?.coaches || {}) };
  const here = player?.team || null;
  const fired = [];

  // What the summer did to his own room, before and after, so it can be told.
  const before = here ? rooms[here] : null;
  for (const id of Object.keys(rooms)) {
    rooms[id] = advanceRoom(rooms[id], { strength: strengthOf(id), league: rooms[id].league });
  }
  const news = roomNews(before, here ? rooms[here] : null, player);

  for (const id of Object.keys(coaches)) {
    const c = coaches[id];
    // Only the player's own club is under real scrutiny: the rest of the
    // league turns its staff over quietly and he would never hear about it.
    const mine = id === here;
    const survived = coachSurvives(c, {
      barrenYears: mine ? barrenYears : 0,
      roomTrust: mine ? (roomTrust(rooms[id]) ?? 50) : 50,
      fanPressure: mine && fanPressure
    });
    if (survived) coaches[id] = { ...c, years: (c.years || 0) + 1 };
    else {
      coaches[id] = makeCoach({
        strength: strengthOf(id),
        avoid: Object.values(coaches).map(x => x?.name)
      });
      fired.push({ teamId: id, out: c.name, in: coaches[id].name, mine });
    }
  }

  return { rooms, coaches, fired, news };
}

const PLAYS = { C: 'centre', LW: 'left wing', RW: 'right wing', LD: 'defence', RD: 'defence', G: 'goal' };
const AHEAD_AT = { C: 'at centre', LW: 'on the left wing', RW: 'on the right wing', LD: 'on the left side of the defence', RD: 'on the right side of the defence', G: 'in net' };

/**
 * WHAT CHANGED IN THE ROOM OVER THE SUMMER.
 *
 * Men left and the game said nothing: the winger he had played four years
 * beside was simply not on the list in October, and the kid who took his job
 * arrived without a word. Three things are worth a line in the recap: one of
 * the men he actually played with leaving, the other goalie leaving, and a
 * younger man at his own position overtaking him.
 */
export function roomNews(before, after, player) {
  if (!before || !after || !player) return [];
  const out = [];
  const pos = player.pos;
  const gone = after.leftLastSummer || [];
  const mattered = new Set([
    ...lineFor(before, pos).map(m => m.id),
    ...(pos === 'G' ? [goaliePartner(before)?.id] : [])
  ].filter(Boolean));

  const close = gone
    .filter(m => mattered.has(m.id) && (m.years || 0) >= 2)
    .sort((a, b) => (b.gp || 0) - (a.gp || 0))
    .slice(0, 1);
  for (const m of close) {
    const yrs = m.years || 1;
    const span = yrs === 1 ? 'one season' : `${yrs} seasons`;
    const role = pos === 'G' && m.pos === 'G' ? 'the other goalie'
      : pos === 'G' ? 'one of the defencemen in front of you'
      : isD(pos) && isD(m.pos) ? 'your defence partner'
      : 'your linemate';
    const why = m.retired
      ? `${m.name}, ${role}, retired over the summer after ${span} in the same room as you.`
      : `${m.name}, ${role}, left over the summer after ${span} in the same room as you.`;
    out.push({
      title: '🚪 OUT OF THE ROOM',
      feedback: (m.lineYears || 0) >= 2
        ? `${why} Whoever plays beside you now starts from scratch.`
        : why,
      effect: { fanStatus: 0, ovr: 0, money: 0 }
    });
  }

  // The kid. A man at his own position, younger, who was behind him last
  // spring and is not now.
  if (pos) {
    const prev = new Map((before.men || []).map(m => [m.id, m]));
    const kid = (after.men || [])
      .filter(m => m.pos === pos && m.age <= 24 && (m.age || 0) < (player.age || 0) - 2)
      .filter(m => (m.ovr || 0) > (player.ovr || 0) && (!prev.has(m.id) || (prev.get(m.id).ovr || 0) <= (player.ovr || 0)))
      .sort((a, b) => b.ovr - a.ovr)[0];
    if (kid) {
      out.push({
        title: '📈 THE KID',
        feedback: prev.has(kid.id)
          ? `${kid.name} is ${kid.age} and came back from the summer better than you. The coaches have noticed, and he goes into camp ahead of you ${AHEAD_AT[pos] || 'at your position'}.`
          : `The club brought in ${kid.name}, ${kid.age}, over the summer. He plays ${PLAYS[pos] || 'your position'}, and on the first depth chart of camp his name is above yours.`,
        effect: { fanStatus: 0, ovr: 0, money: 0 }
      });
    }
  }
  return out;
}

/** The archetype the engine should read for the player himself, taken from the
 *  contract role he signed, so a coach can like or dislike what he is. */
export function playerArchetype(player) {
  const r = player?.archetype || player?.contract?.role || '';
  if (/Sniper/i.test(r)) return 'Sniper';
  if (/Playmaker/i.test(r)) return 'Playmaker';
  if (/Power/i.test(r)) return 'Power Forward';
  if (/Shutdown|Grinder|Defensive/i.test(r)) return 'Shutdown';
  if (/Puck|Offensive D/i.test(r)) return 'Puck-Mover';
  if (/Two-Way/i.test(r)) return 'Two-Way';
  return null;
}
