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
  lower:    'you went into the boards awkwardly and couldn\'t put weight on the leg afterwards',
  hand:     'a slash caught you across the knuckles, and the X-ray showed a break',
  foot:     'you blocked a slapshot with the side of your skate',
  ankle:    'your skate caught a rut and the ankle turned right under you',
  shoulder: 'you went into the end boards shoulder first',
  groin:    'you felt something go in your groin reaching for a pass',
  back:     'your back seized up after a morning skate and hasn\'t let go since',
  head:     'you took an elbow to the head and don\'t remember the rest of the shift'
};

// What it actually is, after the how. "It is an upper-body injury" read like
// the club's press release, because it was the club's press release. The
// vague ones say so and then tell him what it really is; the rest describe
// the injury the way a teammate would.
const WHAT = {
  upper:    "The club's calling it an upper-body injury. It's your wrist, and it's swollen to twice the size.",
  lower:    "The club's calling it a lower-body injury, which is what clubs call a knee they don't want to talk about.",
  hand:     "It's in a cast, and you can't close your fist around a stick.",
  foot:     "Nothing's broken, but the foot's gone black and you can't get a skate on it.",
  ankle:    "It's a high ankle sprain, the slow kind.",
  shoulder: "It's a separated shoulder, and the arm's in a sling.",
  groin:    "It's a groin strain, and those never heal as fast as you want them to.",
  back:     "It's a back spasm, and nobody can tell you when it'll let go.",
  head:     "It's a concussion, and the lights in the room still hurt."
};

// The event is raised after the December games, so it happened before then.
const MONTHS = ['October', 'November', 'December'];

/** "a" or "an", so the labels can start with any letter. */
export const withArticle = (label) => `${/^[aeiou]/i.test(label || '') ? 'an' : 'a'} ${label}`;

/**
 * Roughly how long a number of games is, in the words a player would use.
 *
 * Read off the league's own schedule: every league here plays its regular
 * season over about twenty-six weeks, so an 82-game season is three games a
 * week and a 68-game junior season is fewer. Forty-one NHL games is half the
 * season and about three months, which is right, but "about 3 months" on its
 * own hid that it was half the year.
 */
const SEASON_WEEKS = 26;
export function timeOut(games, seasonGames = 82) {
  const perWeek = Math.max(1, (seasonGames || 82) / SEASON_WEEKS);
  const weeks = Math.round((games || 0) / perWeek);
  if (weeks <= 1) return 'about a week';
  if (weeks <= 8) return `about ${weeks} weeks`;
  const months = Math.round(weeks / 4.3);
  return `about ${months === 1 ? 'a month' : `${months} months`}`;
}

// How much of his season that was, once it's a real share of it.
const shareOfSeason = (games, seasonGames = 82) => {
  const s = (games || 0) / Math.max(1, seasonGames || 82);
  if (s >= 0.9) return 'nearly the whole season';
  if (s >= 0.6) return 'most of the season';
  if (s >= 0.42) return 'half the season';
  if (s >= 0.3) return 'a third of the season';
  if (s >= 0.22) return 'a quarter of the season';
  return null;
};

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
  // Recent injuries, not every one he's ever had. Counting the whole career
  // snowballed: each injury raised the odds of the next for good, so by thirty
  // he was getting hurt two seasons in three and the event had become an
  // annual ritual. A body that's been sound for four years is sound.
  const season = player?.stats?.seasonsPlayed ?? 0;
  const past = (player?.injuryHistory || []).filter(i => season - (i.season ?? season) < 4).length;

  let odds = 0.27;
  if (age >= 34) odds += 0.16;
  else if (age >= 30) odds += 0.09;
  else if (age <= 21) odds -= 0.05;

  // Playing the game hard costs you. A shutdown defenceman in front of pucks
  // all year is not in the same risk pool as a perimeter winger.
  odds += (phy - 50) * 0.0016;
  if (player?.pos === 'G') odds -= 0.08;

  // The body remembers, for a while.
  odds += Math.min(0.14, past * 0.045);

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

// THE ONE HE DOESN'T COME BACK FROM.
//
// Rare, and mostly late. Careers end on concussions, backs and the joints that
// have been rebuilt once too often, and almost never on a bruised foot. The
// chance rises with age and with the history: a man with two concussions
// behind him is the one the doctors stop clearing.
const ENDING_WEIGHT = { head: 1, back: 0.6, shoulder: 0.35, lower: 0.35, ankle: 0.15 };
function endsCareer(player, type) {
  const w = ENDING_WEIGHT[type.key];
  if (!w) return false;
  const age = player?.age || 24;
  const base = age <= 25 ? 0.005 : age <= 29 ? 0.013 : age <= 32 ? 0.03 : age <= 35 ? 0.06 : 0.09;
  const hist = player?.injuryHistory || [];
  const heads = hist.filter(i => i.key === 'head').length;
  const serious = hist.filter(i => (i.games || 0) >= 20).length;
  const chance = base * w * (1 + heads * 0.9 + serious * 0.25);
  return Math.random() < Math.min(0.4, chance);
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

  // The rest of the season, and then the summer decides.
  const careerEnding = endsCareer(player, type);
  if (careerEnding) out = Math.round(games * (0.6 + Math.random() * 0.3));

  return {
    key: type.key,
    label: type.label,
    games: out,
    // The length of his league's season, so the time out can be said in
    // weeks of that league's schedule.
    seasonGames: games,
    // What he carries into next year. A nagging injury takes something off him
    // until it is behind him, which is what "playing hurt" actually means.
    lingers: !careerEnding && type.nag && Math.random() < 0.45,
    careerEnding,
    season: player?.stats?.seasonsPlayed ?? 0,
    age
  };
}

/** A line for the recap, in the voice the rest of the game uses. */
export function injuryLine(inj, seasonGames = 82) {
  if (!inj) return null;
  const n = inj.games;
  const share = shareOfSeason(n, seasonGames);
  const after = n >= 25
    ? (share
      ? `That was ${share}, ${timeOut(n, seasonGames)} out of the lineup.`
      : `That was ${timeOut(n, seasonGames)} out of the lineup.`)
    : n >= 10
      ? `${timeOut(n, seasonGames).replace(/^a/, 'A')} in the press box, and the room got used to playing without you.`
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
  // A week out with a bruised foot is a line in the recap, not a stop in the
  // middle of the season. Every injury used to get one, which is a lot of
  // what made getting hurt feel like it happened every year.
  if (inj.games < 6 && inj.key !== 'head') return null;
  const month = MONTHS[Math.floor(Math.random() * MONTHS.length)];
  const how = HOW[inj.key] || 'you got hurt';
  const who = inj.key === 'head' ? 'the doctors' : 'the staff';
  const what = WHAT[inj.key] || `It's ${withArticle(inj.label)}.`;
  const desc = `In ${month}, ${how}. ${what} ${who === 'the doctors' ? 'The doctors' : 'The staff'} have you out for ${timeOut(inj.games, inj.seasonGames)}.`;
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
  // The bad one. It isn't called the end yet, because nobody calls it that in
  // December: he's out for the year and nobody will talk about next season.
  if (inj.careerEnding) {
    return {
      title: '🚑 OUT FOR THE SEASON',
      desc: `In ${month}, ${how}. ${what} This one's different. You're done for the year, and when you ask about next season nobody will give you a straight answer.`,
      choices: [{ ...wait, label: 'Start the rehab', subLabel: 'Do everything they ask and see where you are in the summer.',
        feedback: 'You did the work every day, and every day it was slower than they said it would be.' }],
      isMidSeasonEvent: true
    };
  }
  if (inj.key === 'head') {
    return {
      title, desc,
      choices: [{ ...wait, label: 'Follow the protocol', subLabel: 'There\'s no rushing a concussion. You go back when the doctors say so.' }],
      isMidSeasonEvent: true
    };
  }
  return {
    title, desc,
    choices: [
      wait,
      {
        label: 'Push to come back early',
        subLabel: 'Skate before you\'re cleared and try to get back in the lineup sooner.',
        isRisky: true,
        successChance: 0.5,
        successFeedback: 'You were back a couple of weeks ahead of schedule, and it held up.',
        successEffect: { fanStatus: 10, ovr: 0, rel: { coach: 5 } },
        failFeedback: 'You came back too soon and it went again in your second game. Longer out, and it hasn\'t felt right since.',
        failEffect: { fanStatus: -5, ovr: -1 },
        action: 'INJURY_RETURN',
        actionData: { plan: 'rush' }
      }
    ],
    isMidSeasonEvent: true
  };
}

/**
 * The summer after a career-ending injury: what the doctors say, for the event
 * that ends the career.
 */
const ENDING_PART = { back: 'back', shoulder: 'shoulder', lower: 'knee', ankle: 'ankle' };
export function careerEndingVerdict(inj) {
  if (!inj) return null;
  if (inj.key === 'head') {
    return 'The headaches never really went away. In June the specialists sat you down and said what you\'d been dreading: another hit like that one could cost you more than a career. They won\'t clear you to play.';
  }
  return `Your ${ENDING_PART[inj.key] || 'body'} never came back right. In June the surgeons told you there's nothing left to repair, and you can't play at this level any more.`;
}

/** What ended it, as the retirement screen says it: "A knee injury ended it." */
export function endingLabel(inj) {
  if (!inj) return null;
  return inj.key === 'head' ? 'concussion' : `${ENDING_PART[inj.key] || 'career-ending'} injury`;
}
