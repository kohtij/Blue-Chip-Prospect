// THE PEOPLE AROUND HIM.
//
// The game has had named coaches and named teammates for a while: a coach
// with a system and a reputation, a dressing room that turns over every
// summer. None of them was ever introduced. A coach was fired and the next
// one was a name on the card; a new man arrived in the room and nobody said
// who he was or whether he mattered.
//
// Now, now and then, one of them gets a proper introduction at camp: the new
// coach (where he's from, how he coaches, whether your game is the kind he
// wants) or a notable arrival in the room (a star, a problem, a veteran with
// one run left, a kid the club loves). One at most a summer, and not every
// summer.
//
// Everything is built from what the game already knows about the person. The
// colour (where a coach played, what an arrival did at his last club) is
// picked from his name, so the same man always has the same story.

import { COACH_SYSTEMS } from './roster';
import { HOME_LEAGUE } from './staffNames';
import { NO_ARTICLE_LEAGUES } from './gameHelpers';
import { tradeMarketOf } from '../data/teams';

const hashOf = (s) => {
  let h = 2166136261;
  for (const ch of String(s || '')) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return Math.abs(h);
};
const pickBy = (seed, list, salt = 0) => list[(seed + salt * 7919) % list.length];

const POS_WORD = { C: 'centre', LW: 'winger', RW: 'winger', LD: 'defenceman', RD: 'defenceman', G: 'goalie' };

// WHERE THE COACH CAME FROM.
const COACH_PAST = [
  (s) => `He played ${8 + (s % 7)} seasons as a stay-at-home defenceman, most of them in the AHL, and wore the C for three of them.`,
  (s) => `He played ${6 + (s % 6)} seasons in the NHL as a checking-line centre and never scored more than ${9 + (s % 5)} goals in one.`,
  () => 'He never played past junior. He started out cutting video, spent eight years as an assistant, and this is his first head job.',
  () => 'He spent fifteen years coaching in Sweden and Switzerland and has the reputation of a teacher.',
  () => 'He was fired by another club two years ago and spent the time since as a TV analyst. He says he learned more in the studio than he did behind the bench.',
  (s) => `He was a backup goalie for ${7 + (s % 5)} seasons, which he says taught him more about reading a game than playing ever did.`,
  () => 'He won a junior title with a team nobody picked to make the playoffs, and has been climbing ever since.'
];

// A coach from a European country, told with his own league in it. The
// lines above are a North American career: the AHL, the NHL, a TV studio.
const COACH_PAST_EURO = [
  (s, lg) => `He played ${9 + (s % 8)} seasons in ${lg}, most of them as a defensive centre, and went straight behind the bench when he stopped.`,
  (s, lg) => `He spent ${8 + (s % 6)} years in ${lg} as a defenceman nobody liked playing against, and he coaches the same way.`,
  (s) => `He coached his country's under-18 and under-20 sides for ${4 + (s % 5)} years before a club gave him a bench of his own.`,
  () => 'He never played at the top level. He started with the club\'s youth teams and worked his way up through every age group.',
  (s, lg) => `He won ${lg} as an assistant ${2 + (s % 6)} years ago and has been waiting for a head job since.`,
  (s, lg) => `He played ${5 + (s % 5)} seasons in ${lg} and a few more in North America, and he talks about the smaller rink more than anyone would like.`
];
const COACH_PAST_ABROAD = [
  () => 'He came over from Canada after a career in the minors and has coached in Europe for more than a decade.',
  (s) => `He played ${6 + (s % 6)} seasons in the AHL, came to Europe for one year at the end of it, and never went home.`,
  () => 'He coached in the American League for years before taking a job over here, and he runs practice like it\'s still the AHL.'
];

const SYSTEM_LINE = {
  attacking: 'He wants the puck moving forward and his defencemen joining the rush.',
  defensive: 'He builds from his own end out: shot blocks, short shifts, nobody cheating for offence.',
  balanced: "He doesn't have a system so much as a lineup card, and he changes it every night."
};

const reputation = (q) => q >= 70
  ? "Players who've had him say he's the best teacher they ever had."
  : q >= 45
    ? "Players say he's fair, and he doesn't hold a bad game against you for long."
    : 'His last room had stopped listening to him by February, and everyone in this one has heard about it.';

/**
 * The coach at a club the player has just joined, introduced at his first camp.
 */
// Where he came from, how he coaches, what his players say, and whether the
// player's game is his kind. Used by the camp introduction and by the summer
// firing event, which used to give his name and his system and nothing else.
export function coachBackground(coach, archetype) {
  if (!coach) return '';
  const s = hashOf(coach.name);
  const sys = COACH_SYSTEMS[coach.system] || COACH_SYSTEMS.balanced;
  const fits = archetype && sys.likes.includes(archetype);
  const clashes = archetype && sys.dislikes.includes(archetype);
  const fitLine = fits ? `Your game is the kind he wants.`
    : clashes ? `A ${archetype.toLowerCase()} isn't the kind of player he usually trusts, and you'll have to change his mind.`
      : `Where you fit in his lineup is still an open question.`;
  const homeLg = HOME_LEAGUE[coach.nat];
  const northAmerican = !coach.nat || coach.nat === 'CAN' || coach.nat === 'USA';
  // A North American behind a European bench is an import, and his story is
  // that one. Which league the club is in rides on the coach as hired.
  const abroad = northAmerican && coach.euroBench;
  const past = homeLg ? pickBy(s, COACH_PAST_EURO)(s, homeLg)
    : abroad ? pickBy(s, COACH_PAST_ABROAD)(s)
      : pickBy(s, COACH_PAST)(s);
  return `${past} ${SYSTEM_LINE[coach.system] || SYSTEM_LINE.balanced} ${reputation(coach.quality ?? 50)} ${fitLine}`;
}

export function coachIntro(coach, { clubName, archetype, league }) {
  if (!coach) return null;
  const sys = COACH_SYSTEMS[coach.system] || COACH_SYSTEMS.balanced;
  const fits = archetype && sys.likes.includes(archetype);
  return {
    title: '👔 THE NEW COACH',
    desc: `Your coach with ${theClub(clubName, league)} is ${coach.name}. ${coachBackground(coach, archetype)}`,
    choices: [
      { label: 'Ask what he wants from you', subLabel: 'Knock on his door before camp starts.', isRisky: false,
        feedback: 'He talked for forty minutes and drew three diagrams. You left knowing exactly where you stand.',
        effect: { fanStatus: 0, ovr: 0, rel: { coach: 8 } } },
      { label: 'Let your play do the talking', subLabel: "He'll see what you are on the ice.", isRisky: false,
        feedback: 'You kept your head down and let camp make the case.',
        effect: { fanStatus: 0, ovr: 0, rel: { coach: fits ? 4 : 0 } } }
    ],
    isOffseasonEvent: true
  };
}

// A club's name with "the" where its league's clubs take one (the Toronto
// Maple Leafs) and without where they don't (Färjestad BK, Ilves U18).
const theClub = (name, league, capital = false) =>
  (NO_ARTICLE_LEAGUES.includes(league) ? name : `${capital ? 'The' : 'the'} ${name}`);

// WHO JUST WALKED INTO THE ROOM.
//
// The kind of arrival is read off the man himself: a star is one of the best
// players in the room, a veteran is over thirty-one, a kid is twenty or under.
// Anyone else is only worth a story if there's one to tell, which is the
// problem player, and most arrivals don't get an introduction at all.
export function arrivalKind(man, room, player) {
  if (!man) return null;
  const best = Math.max(...(room?.men || []).map(m => m.ovr || 0));
  if ((man.ovr || 0) >= Math.max(80, best) || (man.ovr || 0) >= (player?.ovr || 0) + 6) return 'star';
  if ((man.age || 0) >= 32) return 'veteran';
  if ((man.age || 0) <= 20 && (man.peak || 0) >= 78) return 'kid';
  return hashOf(man.name) % 10 < 3 ? 'problem' : null;
}

export function arrivalIntro(man, kind, { clubName, fromName, samePos, league }) {
  if (!man || !kind) return null;
  const s = hashOf(man.name);
  // How he got here depends on the league. Only North America trades, a
  // European men's club buys or signs, and a junior club in Europe just has
  // a new player turn up from another club's academy. The Club line is the
  // sentence's subject, so it takes "The" only where the league's clubs do.
  const market = tradeMarketOf(league);
  const how = market === 'picks' || market === 'players'
    ? (s % 2 === 0 ? `traded for ${man.name}` : `signed ${man.name}`)
    : market === 'fees'
      ? (s % 2 === 0 ? `bought ${man.name}` : `signed ${man.name}`)
      : `brought in ${man.name}`;
  const from = fromName ? ` from ${theClub(fromName, league)}` : '';
  const Club = theClub(clubName, league, true);
  const pos = POS_WORD[man.pos] || 'player';
  const rivalry = samePos ? ` He plays your position, and he didn't come here to sit behind you.` : '';

  if (kind === 'star') return {
    title: '⭐ A STAR IN THE ROOM',
    desc: `${Club} ${how}${from} this summer. He's a ${man.age}-year-old ${pos} and one of the best players in the league.${rivalry} Every reporter at camp wants to know how the two of you will get on.`,
    choices: [
      { label: 'Welcome him', subLabel: 'Show him round and make him feel at home.', isRisky: false,
        feedback: 'You took him to dinner the first night. By the end of camp the two of you were the room\'s loudest table.',
        effect: { fanStatus: 5, ovr: 0, rel: { teammates: 6 } } },
      { label: "Make it clear it's still your room", subLabel: 'Star or not, he has to earn it here.', isRisky: true, successChance: 0.5,
        successFeedback: 'You outplayed him in every camp drill, and the coaches noticed who set the tone.', successEffect: { fanStatus: 15, ovr: 0, rel: { coach: 6 } },
        failFeedback: 'It came across as jealousy, and half the room sided with him.', failEffect: { fanStatus: -5, ovr: 0, rel: { teammates: -10 } } }
    ],
    isOffseasonEvent: true
  };

  if (kind === 'problem') return {
    title: '⚠️ A NEW FACE, AND A REPUTATION',
    desc: `${Club} ${how}${from}. He's a ${man.age}-year-old ${pos} with real talent, and he's also been suspended twice and fallen out with his last coach.${rivalry} The room's split on whether he's worth the trouble.`,
    choices: [
      { label: 'Give him a fair chance', subLabel: "Judge him on what he does here.", isRisky: true, successChance: 0.6,
        successFeedback: 'He turned out to be a lot better company than his reputation. He remembers who was decent to him.', successEffect: { fanStatus: 0, ovr: 0, rel: { teammates: 6 } },
        failFeedback: 'He was late twice in the first week, and you were the one who\'d vouched for him.', failEffect: { fanStatus: 0, ovr: 0, rel: { coach: -6 } } },
      { label: 'Keep your distance', subLabel: "His problems aren't yours.", isRisky: false,
        feedback: 'You stayed out of it. Whatever happens with him, it won\'t land on you.',
        effect: { fanStatus: 0, ovr: 0 } }
    ],
    isOffseasonEvent: true
  };

  if (kind === 'veteran') return {
    title: '🧓 A VETERAN ARRIVES',
    desc: `${Club} ${how}${from}. He's ${man.age}, he's been around this league longer than anyone in the room, and he wants one more run. The younger players were asking him questions before his bag was unpacked.`,
    choices: [
      { label: 'Learn from him', subLabel: 'Ask how he lasted this long.', isRisky: false,
        feedback: 'He showed you how he prepares for a game, down to what he eats and when he sleeps. You started doing the same.',
        effect: { fanStatus: 0, ovr: 0, rel: { coach: 3, teammates: 5 } } },
      { label: 'Do your own thing', subLabel: "You've got your own way of doing things.", isRisky: false,
        feedback: 'You nodded, said hello, and kept your routine.',
        effect: { fanStatus: 0, ovr: 0 } }
    ],
    isOffseasonEvent: true
  };

  // The kid.
  return {
    title: '🌱 THE CLUB\'S NEW PROSPECT',
    desc: `${Club} ${how}${from}. He's ${man.age}, a ${pos} the scouts can't stop talking about, and he's been told he'll get his chances this year.${rivalry}`,
    choices: [
      { label: 'Take him under your wing', subLabel: 'Help him find his feet.', isRisky: false,
        feedback: 'He sat beside you on every bus trip and asked about everything. The coaches noticed who was looking after him.',
        effect: { fanStatus: 5, ovr: 0, rel: { coach: 4, teammates: 4 } } },
      { label: 'Let him find his own way', subLabel: 'Everyone else had to.', isRisky: false,
        feedback: 'You left him to it. He worked it out, eventually.',
        effect: { fanStatus: 0, ovr: 0 } }
    ],
    isOffseasonEvent: true
  };
}
