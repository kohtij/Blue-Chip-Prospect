// What the deadline screen says, and why it does not say it twice.
//
// Every line on that screen used to be a constant. Play three seasons and you
// read "The trade deadline is 24 hours away. The media is swarming." three
// times, word for word, which made March feel like a form to fill in rather
// than a day in a career. Each slot now draws from a pool.
//
// The pick is seeded rather than random so a line does not change under you
// between renders: the same season on the same club reads the same way all the
// way through, and the next season reads differently.
//
// Three rules these lines have to follow, because the screen renders them in
// places that break them easily:
//
//   1. The deadline is TOMORROW on this screen, never today. The subtitle sits
//      directly under a header that says so.
//   2. CONTRACT and SEASON lines appear on a buyer's card and a seller's card
//      alike, so neither pool may assume the club is selling.
//   3. Only North America trades draft picks. A line about picks on a
//      Skellefteå card is wrong, which is why the seller outlook splits.

const hash = (s) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

// `salt` keeps the slots independent. Without it every pool of the same length
// would land on the same index, so the subtitle, the outlook and the contract
// note would move in lockstep and the variation would be obvious.
export const pickFlavor = (pool, seed, salt = '') => {
  if (!pool || pool.length === 0) return '';
  return pool[hash(`${seed}|${salt}`) % pool.length];
};

// Clubs here sign and release players and pay transfer fees. They do not trade
// draft picks, so the seller outlook needs its own lines.
export const EURO_LEAGUES = ['SHL', 'LIIGA', 'KHL', 'SWISS', 'DEL', 'ICEHL', 'CZECH', 'SLOVAK'];

export const SUBTITLE = {
  contender: [
    "Twenty-four hours to the deadline, and the phones haven't stopped. Your club is buying.",
    'One day out. The contenders are all shopping, and your GM is one of them.',
    "The deadline's tomorrow. Around here the talk is who's coming in, not who's going out.",
    "A day left. Teams in a playoff spot don't stand pat, and yours is in one.",
    "Twenty-four hours to go. Somewhere there's a seller waiting for your GM to overpay."
  ],
  // Out of a playoff place but not buried. A club sitting 21st is not writing
  // the year off in March, it is deciding whether to believe in itself.
  fringe: [
    "Twenty-four hours to the deadline, and nobody here knows which way this club is leaning.",
    "One day out. Close enough to dream, far enough back that the GM is taking calls either way.",
    "The deadline's tomorrow and this club still hasn't decided what it is.",
    "A day left. Win a few and you're buying. Lose a few and you were always selling.",
    "Twenty-four hours to go. A team this close to the line can go either way by three o'clock."
  ],
  seller: [
    "Twenty-four hours to the deadline. The season's gone, and anyone can read the standings.",
    "One day out. Your club is selling, and nobody's pretending otherwise.",
    "The deadline's tomorrow. Out of the race, the only question left is who goes.",
    "A day left. The rebuild doesn't start in the summer, it starts tomorrow afternoon.",
    'Twenty-four hours to go. Contenders have been calling your GM all week, and not to catch up.'
  ],
  // College has no deadline, but it does have a door. These point at the
  // decision the screen actually offers rather than insisting nothing happens.
  college: [
    "Nobody gets traded in college hockey, but the portal's always open.",
    'No deadline here. No rentals, no GMs on the phone. Just a run at the tournament, and the door.',
    "The pros spend today on the phones. The only call you have to make is whether you stay.",
    "College hockey doesn't do deadline day. It does March, and it does second chances somewhere else.",
    "There's a season to finish. Whether you finish it here is up to you."
  ],
  // The national program picks its players and keeps them. Nobody here is
  // getting a phone call, which is exactly why the screen should not offer one.
  program: [
    'Nobody gets traded out of a national program. You were picked, and you stay picked.',
    "The deadline is somebody else's problem. The program doesn't deal its players.",
    'No calls are coming today. The only thing that moves you here is the calendar.',
    'Clubs across the league are buying and selling. The program just keeps developing.',
    "There's no market for you to be on. There's only the next game."
  ]
};

export const OUTLOOK = {
  // Sits under BUYING / CONTENDING and the league position. Kept free of picks
  // and cap talk so it reads the same way in Stockholm as it does in Toronto.
  contender: [
    'The club likes this group enough to pay up and make it better.',
    "They're buying. Somebody is arriving, and somebody is losing their spot.",
    'A team in a playoff spot is a team worth adding to, and the staff know it.',
    "The window is open. Nobody wants to be the one who wasted it.",
    "Good teams get greedy this time of year. This one is no different."
  ],
  // Market-neutral on purpose: this one pool serves North America and Europe,
  // because none of it turns on draft picks.
  fringe: [
    "Nobody here is committing either way. The club wants to see another week first.",
    "Too far back to buy, too close to give up. That is the worst place to be in March.",
    "The room still believes. Whether the front office does is another question.",
    "A club on the edge adds nothing and sells nothing, and hopes that was the right call.",
    "Management is waiting. A good week makes them buyers and a bad one empties the room."
  ],
  seller: [
    "A club this far back isn't buying. It's taking calls.",
    "The season is written off. All that's left is working out what the roster is worth in picks.",
    "Nothing to play for means everybody is available, and the GM has stopped pretending otherwise.",
    'This far out of it, the rest of the year is about next year. Players become assets.',
    'A lost season pays in one currency, and that currency is draft picks.'
  ],
  // Same situation, a league that does not deal picks.
  sellerEuro: [
    "A club this far back isn't adding. It's listening.",
    "The season is written off. What's left is deciding who is worth keeping for next year.",
    'Nothing to play for means everybody is available, and the club has stopped pretending otherwise.',
    'This far out of it, the rest of the year is about next year. Contracts become bargaining chips.',
    'A lost season gets cleared out early. Somebody always leaves before the summer.'
  ]
};

// Sits under the GP / G / A / PTS tiles, on a buyer's card and a seller's card
// alike, so none of these may assume which way the club is leaning.
export const SEASON = {
  strong: [
    "You've been one of the few things worth watching. That cuts both ways today.",
    'Put up numbers like these and other teams start asking about you.',
    "You've played well enough that somebody else has noticed.",
    'The numbers are good, and good numbers get your name said out loud in March.',
    "You've given them something worth keeping, which is the same thing that makes you worth trading."
  ],
  steady: [
    'There are still a few games left this season. What happens today decides who you play them for.',
    'A solid run so far. Where it goes is up to you.',
    "Nothing spectacular, nothing to apologise for. There's still a season to play.",
    "You've done your job. The rest of the year is what gets remembered.",
    'Steady work and no headlines. That is a player a club keeps, and a player a club can move.'
  ],
  quiet: [
    "It's been a quiet year. Quiet years are hard to sell and easy to move on from.",
    "The points haven't come, and today is the day that starts to matter.",
    "You haven't given anyone much to talk about. Today, that might be a mercy.",
    "A season to forget so far. There's still time to make it one worth remembering.",
    'The numbers are thin. Nobody trades for thin numbers, and nobody fights to keep them either.'
  ]
};

// The same slot for a college or national-programme player, who cannot be
// traded by anyone. The pro pool talks about being sold, moved and traded for,
// which on a Wisconsin card is the same mistake as telling a freshman his
// scholarship makes him hard to move. What matters to an amateur is scouts,
// coaches and how much eligibility is left.
export const SEASON_AMATEUR = {
  strong: [
    "You've been one of the best players on this team, and the conference knows it.",
    'Numbers like these are how a name ends up on an NHL scouting list.',
    "You've played well enough that coaches elsewhere have written your name down.",
    'The numbers are good, and good numbers in March are how college careers turn into pro ones.',
    "You've given this programme something to build around."
  ],
  steady: [
    'There are still games left this season. The only question is where you play them.',
    'A solid run so far. Where it goes is up to you.',
    "Nothing spectacular, nothing to apologise for. There's still a season to play.",
    "You've done your job. The rest of the year is what gets remembered.",
    'Steady work and no headlines. Coaches notice that, even when nobody else does.'
  ],
  quiet: [
    "It's been a quiet year, and a quiet year is a hard thing to build a career on.",
    "The points haven't come, and eligibility goes quicker than anyone expects.",
    "You haven't given anyone much to talk about yet. There's still time.",
    "A season to forget so far. There's still time to make it one worth remembering.",
    "The numbers are thin, and thin numbers don't get you recruited anywhere else either."
  ]
};

// Sits under EXPIRING or N YEARS LEFT. Also shown on both buyers and sellers,
// so "they would rather have the pick" cannot live here: on a contender's card
// it is simply untrue.
export const CONTRACT = {
  // An entry-level deal is not a contract you negotiate or get moved for. It is
  // cheap, it is short, and the club controls it, so telling a kid in year two
  // of his ELC that "term on the deal makes you harder to move, and easier to
  // build around" described somebody else's career entirely.
  elc: [
    "You're on an entry-level deal. Cheap, controlled, and that makes you easy to say yes to.",
    "Entry-level money for another year yet. Clubs like a player they do not have to pay properly.",
    "The number is small and the term was never yours to negotiate. That is the rookie bargain.",
    "At this number you are the easiest contract on the roster to fit anywhere.",
    "An entry-level contract is the cheapest thing on this roster, and that cuts both ways today."
  ],
  elcExpiring: [
    "Last year of the entry-level deal. The next one is the one that pays.",
    "The rookie deal runs out this summer and you become a restricted free agent.",
    "This is the year you spend playing for your second contract.",
    "Your deal expires in the summer, but the club keeps your rights. You are not leaving for nothing.",
    "Final year of the entry-level contract. Everything from here sets the number."
  ],
  expiring: [
    'An expiring deal in March is the most tradeable thing in hockey.',
    "You're out of contract in the summer, and every club in the league knows the date.",
    "Rentals move at the deadline. That's the whole business of the day.",
    'Last year of the deal, and the first line on your file right now.',
    "Nobody lets a player walk for nothing if they can help it."
  ],
  signed: [
    'Term on the deal makes you harder to move, and easier to build around.',
    'Anyone trading for you is trading for more than a few months.',
    "You're not a rental. Whoever wants you has to want you for a while.",
    "There's time left on the deal, which is the safest place to be today.",
    'Signed past this season. Clubs make plans around players like you.'
  ]
};

export const RUMOUR = {
  blazing: [
    { label: 'YOUR NAME IS EVERYWHERE', note: 'Every insider has you at the top of the rental board.' },
    { label: 'TOP OF THE BOARD', note: "You're the first name every contender brings up when they call." },
    { label: 'THE PRIZE OF THE DEADLINE', note: "Every panel on television has spent the week arguing about where you land." },
    { label: 'ALL ANYONE IS ASKING', note: "Your agent has stopped answering numbers he doesn't recognise." },
    { label: 'FIRST NAME ON THE LIST', note: 'Three clubs are said to have put something on the table already.' }
  ],
  warm: [
    { label: 'LINKED IN THE RUMOURS', note: 'An expiring deal on a selling club. The calls are being made.' },
    { label: 'ON THE MARKET', note: 'Your name keeps turning up halfway down every report.' },
    { label: 'QUIETLY AVAILABLE', note: "Nobody has said it out loud, but the club is listening." },
    { label: 'IN THE CONVERSATION', note: "You're not the headline, but you're in the story." },
    { label: 'A NAME BEING FLOATED', note: 'Contenders looking for depth have been told to call about you.' }
  ],
  cool: [
    { label: 'MENTIONED IN PASSING', note: 'A selling club will listen on anyone, even the players it likes.' },
    { label: 'A LONG SHOT', note: "It would take a real offer, but the GM hasn't hung up on anybody." },
    { label: 'BURIED IN THE REPORTS', note: 'You turn up on the long lists and nowhere else.' },
    { label: 'WORTH A PHONE CALL', note: 'Somebody asked the question once. Nobody pushed it.' },
    { label: 'AN OUTSIDE CHANCE', note: 'Stranger things have happened in the last hour before a deadline.' }
  ],
  cold: [
    { label: 'NOBODY IS TALKING', note: 'Nothing in the rumour mill points anywhere near you.' },
    { label: 'NOT A WORD', note: "Your name hasn't come up once all week." },
    { label: 'OFF THE RADAR', note: "Whatever happens today, it's happening to somebody else." },
    { label: 'STAYING PUT', note: 'No calls, no links, no reason to pack a bag.' },
    { label: 'NOT FOR SALE', note: "Nobody has asked about you, and the club isn't listening anyway." }
  ]
};

// For players with no contract to discuss and no chance of being moved: a
// college skater, or anyone at the NTDP. Showing them an empty contract row and
// a rumour mill that cannot produce a rumour was worse than showing nothing.
export const STAKES = {
  inRace: [
    { label: 'PLAYING FOR SEEDING', note: 'Where you finish decides who you draw and where you play them.' },
    { label: 'IN THE HUNT', note: 'Hold this spot and the postseason looks after itself.' },
    { label: 'CONTROL YOUR OWN FATE', note: 'Nobody else has to lose for this to work out.' },
    { label: 'THE RUN IN', note: 'A handful of games between here and the part that counts.' },
    { label: 'WELL PLACED', note: "Getting there isn't the hard part any more. What you do when you arrive is." }
  ],
  outOfRace: [
    { label: 'PLAYING FOR PRIDE', note: "The standings say it's over. The games get played anyway." },
    { label: 'NEEDING HELP', note: 'Winning out might not be enough, and losing once settles it.' },
    { label: 'AN AUDITION', note: 'Scouts keep watching long after a team stops mattering.' },
    { label: 'ON THE OUTSIDE', note: 'Nothing left to chase but your own numbers.' },
    { label: 'RUNNING OUT OF ROAD', note: 'Every game from here is about next season, not this one.' }
  ]
};

export const ACTION = {
  contender: ['STAY THE COURSE', 'BACK THE ROOM', 'RIDE WITH THEM', 'SEE IT THROUGH'],
  fringe: ['SEE WHAT HAPPENS', 'HOLD THE LINE', 'KEEP PUSHING', 'STAY IN IT'],
  seller: ['RIDE IT OUT', 'SIT TIGHT', 'WAIT IT OUT', 'LET IT PASS'],
  // Nothing is being waited out in college. There is no deadline to survive,
  // only the rest of a season to go and play.
  program: ['CONTINUE THE SEASON', 'GET BACK TO WORK', 'KEEP PLAYING', 'FINISH THE YEAR']
};
