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
//      Skellefteå card is wrong, so the seller outlook splits.

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
    'Twenty-four hours to the deadline. The phones in the GM\'s office have not stopped all week.',
    'One day out, and your club is shopping like everyone else in a playoff spot.',
    'The deadline is tomorrow. Everything anyone is talking about here is who might be coming in.',
    'A day left. Your club is in a playoff spot and the staff have been in meetings since Monday.',
    'Twenty-four hours to go. Somewhere out there a seller is waiting for your GM to call.'
  ],
  // Out of a playoff place but not buried. A club sitting 21st spends March
  // deciding whether to believe in itself rather than writing the year off.
  fringe: [
    'Twenty-four hours to the deadline, and nobody here knows which way this club is leaning.',
    'One day out. Close enough to the race to dream about it, far enough back that the GM takes every call.',
    'The deadline is tomorrow. This club still has not worked out what it is.',
    'A day left, and the next three results will probably decide it for them.',
    'Twenty-four hours to go. A team sitting this close to the line can go either way by three o\'clock.'
  ],
  seller: [
    'Twenty-four hours to the deadline. The season is gone and the standings have said so for a month.',
    'One day out. Nobody in the building is calling this a playoff push any more.',
    'The deadline is tomorrow, and the question in here is who goes.',
    'A day left. The staff have already started talking about next season.',
    'Twenty-four hours to go. Contenders have been calling your GM all week.'
  ],
  // College has no deadline, but it does have a door. These point at the
  // decision the screen actually offers rather than insisting nothing happens.
  college: [
    'There is no trade deadline in college hockey, but the portal is open.',
    'The pros spend today on the phone. Your season just carries on, unless you decide otherwise.',
    'Deadline day belongs to the NHL. Here it is a normal Monday with a game on Friday.',
    'Nothing moves today. The tournament is weeks out and the portal does not open until spring.',
    'There is a season to finish. Whether you finish it here is up to you.'
  ],
  // The national program picks its players and keeps them. Nobody here is
  // getting a phone call, so the screen should not offer one.
  program: [
    'Nobody gets traded out of a national programme. You are here until the staff say otherwise.',
    'The deadline belongs to the pros. The programme does not deal its players.',
    'No calls today. The programme runs on its own schedule.',
    'Clubs across the league are buying and selling. Here it is a normal training day.',
    'There is no market for you to be on. The next game is still Friday.'
  ]
};

export const OUTLOOK = {
  // Sits under BUYING / CONTENDING and the league position. Kept free of picks
  // and cap talk so it reads the same way in Stockholm as it does in Toronto.
  contender: [
    'The club likes this group enough to pay up and make it better.',
    'They are buying. Somebody is arriving, and somebody is losing their spot.',
    'A playoff spot and a GM willing to spend. The staff have made that much clear.',
    'The window is open and nobody wants to be the one who wasted it.',
    'Good teams get greedy in March. This one is no different.'
  ],
  // Market-neutral on purpose: this one pool serves North America and Europe,
  // because none of it turns on draft picks.
  fringe: [
    'Nobody here is committing either way. The club wants another week of results first.',
    'Too far back to buy, too close to sell. March is uncomfortable from here.',
    'The room still believes. Whether the front office does is another matter.',
    'A club on the edge usually does nothing and hopes that was right.',
    'Management is waiting. A good week makes them buyers.'
  ],
  seller: [
    'The GM has spent the week taking calls rather than making them.',
    'The season is written off. What is left is working out what the roster is worth in picks.',
    'There is nothing to play for, so everybody is available.',
    'This far out of it, the staff are already planning for next season.',
    'Whatever comes back this week will be draft picks.'
  ],
  // Same situation, a league that does not deal picks.
  sellerEuro: [
    'The club has stopped looking for players and started listening to offers.',
    'The season is written off. What is left is deciding who is worth keeping.',
    'With nothing left to play for, the club will hear anyone out.',
    'This far out of it, the staff are already thinking about next season\'s squad.',
    'A lost season gets cleared out early. Somebody usually leaves before the summer.'
  ]
};

// Sits under the GP / G / A / PTS tiles, on a buyer's card and a seller's card
// alike, so none of these may assume which way the club is leaning.
export const SEASON = {
  strong: [
    'You have been one of the few things worth watching here.',
    'Put up numbers like these and other clubs start asking about you.',
    'You have played well enough that somebody else has noticed.',
    'The numbers are good enough that your name has been in the papers.',
    'You have given this club something worth keeping.'
  ],
  steady: [
    'A few games left, and today decides who you play them for.',
    'A solid run so far. Where it goes is up to you.',
    'Nothing spectacular, nothing to apologise for.',
    'You have done your job this year.',
    'Steady work, no headlines. The staff have noticed even if nobody else has.'
  ],
  quiet: [
    'It has been a quiet year. The points just have not come.',
    'The points have not come, and today is when that starts to matter.',
    'You have not given anyone much to talk about.',
    'A season to forget so far, with time left to fix it.',
    'The numbers are thin. Nobody has been asking.'
  ]
};

// The same slot for a college or national-programme player, who cannot be
// traded by anyone. The pro pool talks about being sold, moved and traded for,
// which on a Wisconsin card is the same mistake as telling a freshman his
// scholarship makes him hard to move. What matters to an amateur is scouts,
// coaches and how much eligibility is left.
export const SEASON_AMATEUR = {
  strong: [
    'You have been one of the best players on this team and the conference knows it.',
    'Numbers like these are how a name ends up on an NHL scouting list.',
    'You have played well enough that coaches elsewhere have written your name down.',
    'The numbers are good, and March is when the scouts travel.',
    'You have given this programme something to build around.'
  ],
  steady: [
    'There are games left. Where you play them is still open.',
    'A solid run so far. Where it goes is up to you.',
    'Nothing spectacular, nothing to apologise for.',
    'You have done your job this season.',
    'Steady work, no headlines. Coaches notice that.'
  ],
  quiet: [
    'It has been a quiet year, and eligibility does not wait.',
    'The points have not come. There is a season and a half left to change that.',
    'You have not given anyone much to talk about yet.',
    'A season to forget so far, with time left to fix it.',
    'The numbers are thin. Nobody has been recruiting on them.'
  ]
};

// Sits under EXPIRING or N YEARS LEFT. Also shown on both buyers and sellers,
// so "they would rather have the pick" cannot live here: on a contender's card
// it is simply untrue.
export const CONTRACT = {
  // An entry-level deal is cheap, short, and controlled by the club. It is not
  // something a player negotiates or gets moved for, so telling a kid in year
  // two of his ELC that "term on the deal makes you harder to move, and easier
  // to build around" described somebody else's career entirely.
  elc: [
    'You are on an entry-level deal. Cheap, short, and easy for anyone to take on.',
    'Entry-level money for another year yet.',
    'The number is small and the term was never yours to negotiate.',
    'At this number you are the easiest contract on the roster to fit anywhere.',
    'An entry-level contract is the cheapest thing in the room.'
  ],
  elcExpiring: [
    'Last year of the entry-level deal. The next one is the one that pays.',
    'The rookie deal runs out this summer and you become a restricted free agent.',
    'You are playing for your second contract from here.',
    'Your deal expires in the summer, but the club keeps your rights.',
    'Final year of the entry-level contract.'
  ],
  expiring: [
    'An expiring deal in March is the easiest thing in hockey to trade.',
    'You are out of contract in the summer, and every club has the date.',
    'Rentals move at the deadline. Most of the day is spent on them.',
    'Last year of the deal. It is the first line on your file right now.',
    'Nobody lets a player walk for nothing if they can avoid it.'
  ],
  signed: [
    'Term on the deal makes you harder to move.',
    'Anyone trading for you is trading for more than a few months.',
    'You are signed past this season, so this is not a rental conversation.',
    'There is time left on the deal.',
    'Signed past the summer, so the club can plan around you.'
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
    { label: 'IN THE CONVERSATION', note: 'Your agent has taken three calls this week he was not expecting.' },
    { label: 'A NAME BEING FLOATED', note: 'Contenders looking for depth have been told to call about you.' }
  ],
  cool: [
    { label: 'MENTIONED IN PASSING', note: 'A selling club will listen on anyone, even the players it likes.' },
    { label: 'A LONG SHOT', note: "It would take a real offer, but the GM hasn't hung up on anybody." },
    { label: 'BURIED IN THE REPORTS', note: 'Your name is on the lists nobody reads out on television.' },
    { label: 'WORTH A PHONE CALL', note: 'Somebody asked the question once. Nobody pushed it.' },
    { label: 'AN OUTSIDE CHANCE', note: 'Stranger things have happened in the last hour before a deadline.' }
  ],
  cold: [
    { label: 'NOBODY IS TALKING', note: 'Nothing in the rumour mill points anywhere near you.' },
    { label: 'NOT A WORD', note: "Your name hasn't come up once all week." },
    { label: 'OFF THE RADAR', note: "Whatever happens today, it's happening to somebody else." },
    { label: 'STAYING PUT', note: 'No calls and no links. You will not be packing a bag.' },
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
    { label: 'WELL PLACED', note: 'Barring a collapse you are in. The draw is what is left to play for.' }
  ],
  outOfRace: [
    { label: 'PLAYING FOR PRIDE', note: "The standings say it's over. The games get played anyway." },
    { label: 'NEEDING HELP', note: 'Winning out might not be enough, and losing once settles it.' },
    { label: 'AN AUDITION', note: 'Scouts keep watching long after a team stops mattering.' },
    { label: 'ON THE OUTSIDE', note: 'Nothing left to chase but your own numbers.' },
    { label: 'RUNNING OUT OF ROAD', note: 'Every game from here is being watched with next season in mind.' }
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

// Being traded.
//
// Every trade used to read the same two ways. A seller's deadline said the club
// "cashed in on your value", a buyer's said "you were what the other side asked
// for", and that was the whole range: the same sentence whether you were the
// best player on the roster or the contract that balanced the money, whether
// you had carried the team for three years or arrived in October.
//
// A trade is three facts, and a player learns them in this order: how the GM
// told him, what the club got for him, and where he is going. Each one is drawn
// from a pool keyed on how much he was worth to that club, so a franchise
// player and a fourth-liner get different phone calls.
//
// Two things the pools have to respect:
//
//   1. European clubs pay fees and do not trade draft picks, so the package
//      lines split.
//   2. A buyer is spending you rather than selling you off. The player is the
//      price of somebody else, and that is a different conversation.

// What he was worth to the club he is leaving. Not his rating on its own: a
// 70-rated kid having the best season of his life matters more to a dressing
// room in March than an 84 who has been hurt since Christmas.
export const tradeStanding = ({ elite, seasonTier, fanStatus = 0, games = 0 }) => {
  const loved = fanStatus >= 300;
  const carried = seasonTier === 'strong' && games >= 20;
  if ((elite && (carried || loved)) || (carried && loved)) return 'prize';
  if (elite || carried || fanStatus >= 150) return 'solid';
  return 'piece';
};

const TRADE_CALL = {
  // The club is out of the race and selling what it has.
  selling: {
    prize: [
      "Your GM shut the door and said it before either of you had sat down. Nobody in the building wanted it to be you. The offer was too big to turn down anyway.",
      "The GM had the look of a man who had been argued into something. You were the best thing this club had, and he traded you regardless.",
      "He told you he had spent three days trying to find another way to do it, and that there wasn't one. Then he shook your hand."
    ],
    solid: [
      "Your GM called you into the office and got to it quickly. The season was gone, and your name kept coming up on other people's lists.",
      "He thanked you for the year before he said anything else, and you knew then.",
      "The call came with twenty minutes left on the clock. A short conversation about a big decision."
    ],
    piece: [
      "Your GM called you in, glanced at a sheet of paper, and told you you had been moved.",
      "It took two minutes. You were a line in somebody else's deal and the office made no attempt to pretend otherwise.",
      "He knew the name of the club you were going to. He wasn't quite sure of yours."
    ]
  },
  // The club is buying, and the player is part of what it is paying with.
  buying: {
    prize: [
      "Your GM did the explaining for once. The club had a real chance this year, the player it wanted had a price, and you were most of that price.",
      "He told you the other side had asked for you by name and would not do the deal without you. Then he said he was sorry, and meant it.",
      "You were told you are the reason this club could do something this big. It was not much comfort, but he wasn't wrong."
    ],
    solid: [
      "Your GM admitted the deal had been agreed since lunchtime and that he had been avoiding you since. The other side wouldn't sign it off without you in it.",
      "He went through what is coming the other way before he mentioned what is going. You worked it out halfway through.",
      "The club finally got the player it has been chasing since Christmas. Your name was the part of the deal they had to agree to."
    ],
    piece: [
      "The trade needed one more contract to make the money balance, and yours was the one that fit.",
      "Your GM called you in to say the deal was about somebody else entirely, and that you were going with it.",
      "Nobody on the other side asked for you by name. They needed the salary to match and yours did."
    ]
  }
};

const TRADE_PACKAGE = {
  selling: {
    prize: [
      'A first-round pick, their best prospect and a conditional second came back the other way. The room read the return and understood exactly what you had been worth.',
      'The return was two picks and a kid everybody rates, and the local press spent the evening arguing about whether it was enough.',
      'They got a first and change for you, which is the going rate and still felt light to everyone who had watched you play.'
    ],
    solid: [
      'A second-round pick and a young defenceman came the other way.',
      'The club got a pick and a prospect back, the sort of return nobody writes a column about.',
      'Two mid-round picks. The GM called it good business, and it was.'
    ],
    piece: [
      'The club got a fourth-round pick, and seemed pleased with it.',
      'A late pick came back. The paperwork was longer than the conversation about it.',
      'The return was a conditional pick. The conditions on it are unlikely to be met.'
    ]
  },
  // Clubs here buy and sell players outright. A line about draft picks on a
  // Skellefteå card has never made sense.
  sellingEuro: {
    prize: [
      'The fee set a club record, and half the league had been on the phone about you since November.',
      'They sold you for the kind of money this club does not normally see, and the board had been waiting for it.',
      'The fee was large enough that nobody pretended this was a hockey decision.'
    ],
    solid: [
      'There was a fee, and two players coming the other way to fill the hole.',
      'The clubs agreed a fee and a loan back, which is how this league does business.',
      'A decent fee, settled in an afternoon.'
    ],
    piece: [
      'The fee barely covered the paperwork.',
      'The money involved would not have bought the bus.',
      'There was a fee. Nobody has said what it was and nobody has asked.'
    ]
  },
  buying: {
    prize: [
      'Coming the other way is a name everybody in the league knows. You are the reason the deal could be done at all.',
      'The club got the player it has wanted for two years. You are what that player cost.',
      'The man arriving has his own trophy case. So does the GM who gave you up to get him.'
    ],
    solid: [
      'A top-six forward is arriving, and you are most of what paid for him.',
      'The club brought in the piece it was missing. You and a pick went out to get it.',
      'The club brought in a better player than you and sent you the other way to get him.'
    ],
    piece: [
      'You were the salary that made the money work.',
      'The deal was built around somebody else. You went in the same envelope.',
      'Your contract fit a hole in the cap. That is why the call came.'
    ]
  }
};

// How it landed outside the building. Only drawn when there is actually a
// reaction to report: nobody phones a radio station about a fourth-line
// contract changing hands in March.
const TRADE_REACTION = {
  prize: [
    'The phone-in shows were still going at midnight.',
    'Your jersey was in three shop windows that morning and out of all of them by the evening.',
    'Two reporters were waiting in the car park before you had finished clearing out your stall.'
  ],
  solid: [
    'The reaction was loud for an hour and then the league moved on.',
    'A few hundred people said something kind on the internet, which is more than most players get.',
    'Someone had made a sign about it by the next home game.'
  ]
};

export const TRADE_TITLE = {
  prize: ['THEY TRADED YOU', 'THE BIG ONE', 'YOU WERE THE DEAL'],
  solid: ['YOU HAVE BEEN TRADED', 'A DEADLINE DEAL', 'THE CALL CAME'],
  piece: ["YOU'RE ON THE MOVE", 'PART OF THE DEAL', 'A NAME IN THE PAPERWORK']
};

export const TRADE_FEEDBACK = [
  'You packed your bags and joined your new club.',
  'You were on a flight before the rink had emptied.',
  'A new room and a new sweater, and the same job to do in both.',
  'You reported the next morning and nobody made a fuss about it.'
];

// Builds the paragraph the trade event shows. `destLine` is the sentence
// naming the new club, which the screen writes because only it can spell the
// club's full name, and it is placed where a player would hear it: after the
// call and the package, not before them.
export const tradeStory = ({ standing, selling, euro, destLine, seed }) => {
  const side = selling ? 'selling' : 'buying';
  const packKey = selling && euro ? 'sellingEuro' : side;
  const parts = [
    pickFlavor(TRADE_CALL[side][standing], seed, 'tradeCall'),
    destLine,
    pickFlavor(TRADE_PACKAGE[packKey][standing], seed, 'tradePackage')
  ];
  const reaction = TRADE_REACTION[standing];
  if (reaction) parts.push(pickFlavor(reaction, seed, 'tradeReaction'));
  return parts.filter(Boolean).join(' ');
};
