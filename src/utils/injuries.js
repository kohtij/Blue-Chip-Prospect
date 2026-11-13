import { gaussianNoise } from './production';

// WHAT ACTUALLY HAPPENS TO A HOCKEY PLAYER'S BODY.
//
// There were two injuries in the game. A nagging one, five per cent a year,
// costing fifteen games. And the devastating one, four per cent, costing sixty.
// Nothing else. A career could run fifteen seasons and miss no games at all,
// which has never happened to anybody, and the two that did exist were events
// with scripts attached rather than hockey happening to him.
//
// This is the ordinary attrition: the six-game upper body, the blocked shot
// that costs him a week, the high ankle sprain in November that quietly costs
// him the scoring race. Most seasons have something in them. Most of those
// somethings are small.
//
// And a body remembers. Nothing accumulated before, so a thirty-three-year-old
// who had been through three of these was exactly as durable as one who had
// never been hurt, which is the opposite of true. Every injury he has had
// makes the next one likelier and a little worse.

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/**
 * The catalogue.
 *
 * `weight` is how often it happens, `games` the range it costs, and `nag`
 * marks the ones that linger: a groin or a back is the kind of thing a player
 * carries for a season rather than recovers from in a fortnight.
 */
const INJURIES = [
  { key: 'upper',    label: 'upper-body injury',   weight: 22, games: [3, 9],   nag: false },
  { key: 'lower',    label: 'lower-body injury',   weight: 20, games: [4, 11],  nag: false },
  { key: 'hand',     label: 'broken hand',         weight: 9,  games: [12, 22], nag: false },
  { key: 'foot',     label: 'bruised foot',        weight: 12, games: [2, 7],   nag: false },
  { key: 'ankle',    label: 'high ankle sprain',   weight: 9,  games: [14, 26], nag: false },
  { key: 'shoulder', label: 'separated shoulder',  weight: 8,  games: [16, 34], nag: true },
  { key: 'groin',    label: 'groin strain',        weight: 10, games: [8, 18],  nag: true },
  { key: 'back',     label: 'back spasm',          weight: 6,  games: [10, 24], nag: true },
  { key: 'head',     label: 'concussion',          weight: 4,  games: [8, 30],  nag: true }
];

// How each one happened, for the event that tells him about it. One line, in
// the second person, starting lower case so it can follow "In December,".
const HOW = {
  upper:    'you took a hit along the boards and came off holding your arm',
  lower:    'you went into the boards awkwardly and could not put weight on the leg afterwards',
  hand:     'a slash caught you across the knuckles, and the X-ray showed a break',
  foot:     'you blocked a slapshot with the side of your skate',
  ankle:    'your skate caught a rut and the ankle turned right under you',
  shoulder: 'you went into the end boards shoulder first',
  groin:    'you felt something go in your groin reaching for a pass',
  back:     'your back seized up after a morning skate and has not let go since',
  head:     'you took an elbow to the head and do not remember the rest of the shift'
};

// The event is raised after the December games, so it happened before then.
const MONTHS = ['October', 'November', 'December'];

/** "a" or "an", so the labels can start with any letter. */
export const withArticle = (label) => `${/^[aeiou]/i.test(label || '') ? 'an' : 'a'} ${label}`;

/** Roughly how long a number of games is, in the words a player would use. */
export function timeOut(games) {
  const weeks = Math.round((games || 0) / 3.5);
  if (weeks <= 1) return 'about a week';
  if (weeks <= 8) return `about ${weeks} weeks`;
  return `about ${Math.round(weeks / 4.3)} months`;
}

// A goaltender gets hurt differently: fewer collisions, more of the same two
// joints over and over.
const GOALIE_TILT = { groin: 2.6, lower: 1.6, hand: 0.5, foot: 0.4, ankle: 0.6, shoulder: 0.8, head: 0.8 };

/**
 * How likely he is to lose time this season.
 *
 * Age is most of it, then how he plays: a man who throws his body around and
 * blocks shots gets hurt more than one who does not. Then his own history,
 * which is the part that was missing: three past injuries roughly doubles the
 * odds of a fourth, which is about what the real numbers say.
 */
export function injuryOdds(player, { games = 82 } = {}) {
  const age = player?.age || 24;
  const phy = player?.physicality || 50;
  const past = player?.injuryHistory?.length || 0;

  let odds = 0.30;
  if (age >= 34) odds += 0.16;
  else if (age >= 30) odds += 0.09;
  else if (age <= 21) odds -= 0.05;

  // Playing the game hard costs you. A shutdown defenceman in front of pucks
  // all year is not in the same risk pool as a perimeter winger.
  odds += (phy - 50) * 0.0016;
  if (player?.pos === 'G') odds -= 0.08;

  // The body remembers.
  odds += Math.min(0.22, past * 0.055);

  // A short season is fewer chances to get hurt.
  odds *= clamp(games / 82, 0.25, 1);

  return clamp(odds, 0.04, 0.80);
}

/** Draw one, weighted, with a goaltender's own tilt applied. */
function drawType(pos) {
  const pool = INJURIES.map(i => ({
    ...i,
    w: i.weight * (pos === 'G' ? (GOALIE_TILT[i.key] ?? 1) : 1)
  }));
  const total = pool.reduce((a, i) => a + i.w, 0);
  let roll = Math.random() * total;
  for (const i of pool) { roll -= i.w; if (roll <= 0) return i; }
  return pool[0];
}

/**
 * One season's worth of attrition, or nothing.
 *
 * Returns null for a clean year. Otherwise the injury, how many games it cost
 * and whether it is the sort that lingers into next season.
 */
export function rollInjury(player, { games = 82 } = {}) {
  if (Math.random() > injuryOdds(player, { games })) return null;

  const type = drawType(player?.pos);
  const [lo, hi] = type.games;
  const past = player?.injuryHistory?.length || 0;
  const age = player?.age || 24;

  // Older bodies and worn ones heal slower, so the same injury costs more.
  const drag = 1 + Math.min(0.55, past * 0.09) + (age >= 32 ? 0.18 : 0);
  let out = Math.round((lo + Math.random() * (hi - lo)) * drag + gaussianNoise());
  out = clamp(out, 2, Math.max(2, Math.round(games)));

  return {
    key: type.key,
    label: type.label,
    games: out,
    // What he carries into next year. A nagging injury takes something off him
    // until it is behind him, which is what "playing hurt" actually means.
    lingers: type.nag && Math.random() < 0.45,
    season: player?.stats?.seasonsPlayed ?? 0,
    age
  };
}

/** A line for the recap, in the voice the rest of the game uses. */
export function injuryLine(inj) {
  if (!inj) return null;
  const n = inj.games;
  const after = n >= 25
    ? `That was ${timeOut(n)} out of the lineup.`
    : n >= 10
      ? `${timeOut(n).replace(/^a/, 'A')} in the press box, and the room got used to playing without you.`
      : 'You were back before most people outside the building noticed you had gone.';
  return `You missed ${n} game${n === 1 ? '' : 's'} with ${withArticle(inj.label)}. ${after}`;
}

/**
 * THE EVENT THAT SAYS IT HAPPENED.
 *
 * The injury was rolled, taken off his games and mentioned once in the recap,
 * so the first a player heard of a broken hand was a line in June. It is told
 * now, in the middle of the year, with the one decision a player actually gets
 * about it: whether to wait for the staff or push to get back early. Pushing
 * can save a few games or cost a lot more and leave it lingering. A concussion
 * does not offer that choice, because nobody responsible would.
 */
export function injuryEvent(inj) {
  if (!inj) return null;
  const month = MONTHS[Math.floor(Math.random() * MONTHS.length)];
  const how = HOW[inj.key] || 'you got hurt';
  const who = inj.key === 'head' ? 'the doctors' : 'the staff';
  const desc = `In ${month}, ${how}. It is ${withArticle(inj.label)}, and ${who} have you out for ${timeOut(inj.games)}.`;
  const title = '🩹 OUT OF THE LINEUP';

  const wait = {
    label: 'Do the rehab properly',
    subLabel: 'Come back when the staff clear you and not a day before.',
    isRisky: false,
    feedback: 'You did every session the staff asked for and came back when they said you were ready.',
    effect: { fanStatus: 0, ovr: 0 },
    action: 'INJURY_RETURN',
    actionData: { plan: 'wait' }
  };
  if (inj.key === 'head' || inj.games < 6) {
    return {
      title, desc,
      choices: [inj.key === 'head'
        ? { ...wait, label: 'Follow the protocol', subLabel: 'There is no rushing a concussion. You go back when the doctors say so.' }
        : { ...wait, label: 'Get back out there', subLabel: 'It is a short one. Do the work and get back in the lineup.' }],
      isMidSeasonEvent: true
    };
  }
  return {
    title, desc,
    choices: [
      wait,
      {
        label: 'Push to come back early',
        subLabel: 'Skate before you are cleared and try to get back in the lineup sooner.',
        isRisky: true,
        successChance: 0.5,
        successFeedback: 'You were back a couple of weeks ahead of schedule, and it held up.',
        successEffect: { fanStatus: 10, ovr: 0, rel: { coach: 5 } },
        failFeedback: 'You came back too soon and it went again in your second game. Longer out, and it has not felt right since.',
        failEffect: { fanStatus: -5, ovr: -1 },
        action: 'INJURY_RETURN',
        actionData: { plan: 'rush' }
      }
    ],
    isMidSeasonEvent: true
  };
}

/**
 * What a body that has been through it is worth now.
 *
 * Small and permanent. One injury is nothing. A career of them is the
 * difference between a thirty-four-year-old who can still play and one who
 * cannot, and the aging curve on its own could never tell those two apart.
 */
export function wearPenalty(player) {
  const past = player?.injuryHistory || [];
  if (past.length < 3) return 0;
  const serious = past.filter(i => (i.games || 0) >= 20).length;
  return Math.min(4, Math.floor((past.length - 2) * 0.5) + serious);
}
