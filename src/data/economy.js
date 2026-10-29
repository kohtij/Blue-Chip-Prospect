// --- ECONOMY & EVENTS ---

export const shopItems = [
  // Affordable Fatigue & Training (Consumables)
  { id: 'cryo', type: 'consumable', name: 'Cryotherapy Sessions', cost: 15000, desc: '+2 STM. Faster recovery.', duration: 1, effect: { stamina: 2 } },
  { id: 'chef', type: 'consumable', name: 'Private Nutritionist', cost: 45000, desc: '+3 PHY. Elite diet plan.', duration: 2, effect: { physicality: 3 } },
  { id: 'skills_camp', type: 'consumable', name: 'Off-Season Skills Camp', cost: 80000, descSkaters: '+3 SKT.', descGoalies: '+3 POS.', duration: 1, effect: { skating: 3 } },
  { id: 'video_coach', type: 'consumable', name: 'Personal Video Coach', cost: 30000, desc: '+2 IQ. Study the tape.', duration: 1, effect: { hockeyIQ: 2 } },
  
  // Staff (Permanent but scaled down costs)
  { id: 'physio', type: 'staff', name: 'Full-Time Physio', cost: 150000, desc: '+5 STM permanently. Injury prevention.', effect: { stamina: 5 } },
  { id: 'psych', type: 'staff', name: 'Sports Psychologist', cost: 120000, desc: '+5 IQ permanently.', effect: { hockeyIQ: 5 } },
  { id: 'agent', type: 'staff', name: 'Super Agent', cost: 250000, desc: 'Increases contract offers by 15%.', effect: { salaryModifier: 1.15 } },
  { id: 'coach', type: 'staff', name: 'Elite Off-Season Trainer', cost: 400000, desc: 'Delays stat decline past age 30.', effect: { declineModifier: 0.5 } },
  
  // Luxury & Lifestyle (Fan Status Sinks)
  { id: 'watch', type: 'luxury', name: 'Designer Watch', cost: 25000, desc: '+15 Fan Status', effect: { fanStatus: 15 } },
  { id: 'sports_car', type: 'luxury', name: 'Custom Sports Car', cost: 180000, desc: '+100 Fan Status', effect: { fanStatus: 100 } },
  { id: 'charity_gala', type: 'luxury', name: 'Host Charity Gala', cost: 75000, desc: 'Huge PR boost. +250 Fan Status', effect: { fanStatus: 250 } },
  { id: 'hyperbaric', type: 'luxury', name: 'Hyperbaric Chamber', cost: 120000, desc: 'Ultimate recovery. Permanent +3 STM', effect: { stamina: 3 } },
  
  // The "Millionaire" Legacy Tier
  { id: 'penthouse', type: 'luxury', name: 'City Penthouse', cost: 2500000, desc: '+800 Fan Status', effect: { fanStatus: 800 } },
  { id: 'junior_team', type: 'luxury', name: 'Own a Junior Team', cost: 8000000, desc: 'Legacy secured. +4 IQ, +1500 Fan Status', effect: { hockeyIQ: 4, fanStatus: 1500 } }
];

export const skaterTrainingPool = [
  { id: 'ts1', name: 'Target Practice', desc: '+3 SHT', effect: { shooting: 3 }, rarity: 'Common', tag: 'SHT', flavor: 'Hours spent shooting pucks at washing machines in the driveway.' },
  { id: 'ts2', name: 'Suicide Sprints', desc: '+3 SKT', effect: { skating: 3 }, rarity: 'Common', tag: 'SKT', flavor: 'Grueling bag skates until your lungs burn and legs go numb.' },
  { id: 'ts3', name: 'Weight Room', desc: '+3 PHY', effect: { physicality: 3 }, rarity: 'Common', tag: 'PHY', flavor: 'Eating heavy, lifting heavier. Building the muscle to win the boards.' },
  { id: 'ts4', name: 'Film Session', desc: '+3 IQ', effect: { hockeyIQ: 3 }, rarity: 'Common', tag: 'MIND', flavor: 'Studying goalie tendencies and defensive coverages late into the night.' },
  { id: 'ts5', name: 'Power Skating', desc: '+2 SKT, +1 STM', effect: { skating: 2, stamina: 1 }, rarity: 'Common', tag: 'TECH', flavor: 'Refining edge work to maximize stride efficiency.' },
  { id: 'ts6', name: 'Net Front Drills', desc: '+2 SHT, +1 PHY', effect: { shooting: 2, physicality: 1 }, rarity: 'Common', tag: 'GRIT', flavor: 'Taking cross-checks while practicing deflections.' },
  { id: 'ts13', name: 'Bike Intervals', desc: '+3 STM', effect: { stamina: 3 }, rarity: 'Common', tag: 'STM', flavor: 'Thirty-second max efforts on the bike until the room tilts.' },
  { id: 'ts14', name: 'Battle Drills', desc: '+2 PHY, +1 SKT', effect: { physicality: 2, skating: 1 }, rarity: 'Common', tag: 'GRIT', flavor: 'One-on-one puck protection in the corners, no whistles.' },
  { id: 'ts15', name: 'Shooting off the Pass', desc: '+2 SHT, +1 IQ', effect: { shooting: 2, hockeyIQ: 1 }, rarity: 'Common', tag: 'TECH', flavor: 'Catching feeds in the slot and releasing before your feet settle.' },
  { id: 'ts16', name: 'Faceoff Lab', desc: '+2 IQ, +1 PHY', effect: { hockeyIQ: 2, physicality: 1 }, rarity: 'Common', tag: 'MIND', flavor: 'Hand position, timing, and the small cheats the linesmen let slide.' },
  { id: 'ts17', name: 'Open-Ice Edges', desc: '+2 SKT, +1 IQ', effect: { skating: 2, hockeyIQ: 1 }, rarity: 'Common', tag: 'SKT', flavor: 'Crossovers and tight turns until changing direction costs you nothing.' },
  { id: 'ts18', name: 'Pool Recovery Work', desc: '+2 STM, +1 PHY', effect: { stamina: 2, physicality: 1 }, rarity: 'Common', tag: 'REC', flavor: 'Deep water running on the days your legs refuse the ice.' },
  { id: 'ts7', name: 'Altitude Camp', desc: '+5 STM', effect: { stamina: 5 }, rarity: 'Rare', tag: 'STM', flavor: 'A brutal month in the mountains to expand your cardiovascular limits.' },
  { id: 'ts8', name: 'Veteran Mentorship', desc: '+5 IQ', effect: { hockeyIQ: 5 }, rarity: 'Rare', tag: 'MIND', flavor: 'A retired legend takes you under their wing to teach you the nuances of the game.' },
  { id: 'ts9', name: 'Box Jumps', desc: '+3 SKT, +2 PHY', effect: { skating: 3, physicality: 2 }, rarity: 'Rare', tag: 'POW', flavor: 'Explosive plyometrics to build breakaway speed.' },
  { id: 'ts10', name: 'European Skill Coach', desc: '+3 SKT, +2 SHT', effect: { skating: 3, shooting: 2 }, rarity: 'Rare', tag: 'SKL', flavor: 'Learning edge work and deceptive release points from overseas.' },
  { id: 'ts19', name: 'Private Shooting Coach', desc: '+5 SHT', effect: { shooting: 5 }, rarity: 'Rare', tag: 'SHT', flavor: 'A specialist rebuilds your release from the hands up.' },
  { id: 'ts20', name: 'Strongman Block', desc: '+5 PHY', effect: { physicality: 5 }, rarity: 'Rare', tag: 'PHY', flavor: 'Sled drags and farmer carries. You come back a different size.' },
  { id: 'ts21', name: 'Mental Performance Coach', desc: '+3 IQ, +2 STM', effect: { hockeyIQ: 3, stamina: 2 }, rarity: 'Rare', tag: 'MIND', flavor: 'Learning to slow the game down when your heart rate says otherwise.' },
  { id: 'ts22', name: 'Sand Dune Sprints', desc: '+3 STM, +2 SKT', effect: { stamina: 3, skating: 2 }, rarity: 'Rare', tag: 'COND', flavor: 'Hill repeats on loose sand at sunrise, every day, for six weeks.' },
  { id: 'ts11', name: 'Olympic Development', desc: '+4 SKT, +4 PHY', effect: { skating: 4, physicality: 4 }, rarity: 'Epic', tag: 'PRO', flavor: 'Invited to the national team’s secretive, elite summer program.' },
  { id: 'ts12', name: 'Off-Season Pro League', desc: '+5 SHT, +3 SKT', effect: { shooting: 5, skating: 3 }, rarity: 'Epic', tag: 'ELITE', flavor: 'Dominating a summer league filled with NHL superstars.' },
  { id: 'ts23', name: 'Private Development Group', desc: '+4 SHT, +4 IQ', effect: { shooting: 4, hockeyIQ: 4 }, rarity: 'Epic', tag: 'ELITE', flavor: 'Eight players, two coaches, and a rink nobody else gets into.' },
  { id: 'ts24', name: 'World-Class Skating Lab', desc: '+5 SKT, +3 STM', effect: { skating: 5, stamina: 3 }, rarity: 'Epic', tag: 'PRO', flavor: 'Force plates and slow-motion cameras rebuild your stride from scratch.' }
];

export const goalieTrainingPool = [
  { id: 'tg1', name: 'Reaction Lights', desc: '+3 REF', effect: { shooting: 3 }, rarity: 'Common', tag: 'REF', flavor: 'Tracking unpredictable light boards to sharpen eye-hand coordination.' },
  { id: 'tg2', name: 'Crease Drills', desc: '+3 POS', effect: { skating: 3 }, rarity: 'Common', tag: 'POS', flavor: 'Perfecting angles and challenging shooters aggressively.' },
  { id: 'tg3', name: 'Butterfly Stretches', desc: '+3 AGI', effect: { physicality: 3 }, rarity: 'Common', tag: 'AGI', flavor: 'Extreme flexibility routines to protect the lower net.' },
  { id: 'tg4', name: 'Tape Study', desc: '+3 IQ', effect: { hockeyIQ: 3 }, rarity: 'Common', tag: 'MIND', flavor: 'Memorizing opponent shootout tendencies and set plays.' },
  { id: 'tg5', name: 'Rebound Control', desc: '+2 REF, +1 IQ', effect: { shooting: 2, hockeyIQ: 1 }, rarity: 'Common', tag: 'TECH', flavor: 'Using the blocker to safely direct pucks into the corner.' },
  { id: 'tg6', name: 'Endurance Skates', desc: '+2 POS, +1 STM', effect: { skating: 2, stamina: 1 }, rarity: 'Common', tag: 'STM', flavor: 'Skating with heavy pads until your legs feel like lead.' },
  { id: 'tg13', name: 'Interval Bike Work', desc: '+3 STM', effect: { stamina: 3 }, rarity: 'Common', tag: 'COND', flavor: 'Building the engine that survives a forty-shot third period.' },
  { id: 'tg14', name: 'Post Integration', desc: '+2 POS, +1 IQ', effect: { skating: 2, hockeyIQ: 1 }, rarity: 'Common', tag: 'TECH', flavor: 'Sealing the short side without surrendering the far corner.' },
  { id: 'tg15', name: 'Glove Side Repetition', desc: '+2 REF, +1 AGI', effect: { shooting: 2, physicality: 1 }, rarity: 'Common', tag: 'REF', flavor: 'Four hundred shots a day at the one spot scouts keep circling.' },
  { id: 'tg16', name: 'Traffic Tracking', desc: '+2 IQ, +1 REF', effect: { hockeyIQ: 2, shooting: 1 }, rarity: 'Common', tag: 'MIND', flavor: 'Finding the puck through screens instead of guessing at it.' },
  { id: 'tg17', name: 'Lateral Pushes', desc: '+2 AGI, +1 POS', effect: { physicality: 2, skating: 1 }, rarity: 'Common', tag: 'AGI', flavor: 'Post to post on the whistle until the push becomes instinct.' },
  { id: 'tg18', name: 'Depth and Retreat', desc: '+2 POS, +1 AGI', effect: { skating: 2, physicality: 1 }, rarity: 'Common', tag: 'POS', flavor: 'Challenging the shooter, then recovering before the pass arrives.' },
  { id: 'tg7', name: 'Vision Training', desc: '+5 REF', effect: { shooting: 5 }, rarity: 'Rare', tag: 'EYES', flavor: 'Using specialized strobe glasses to slow down the puck visually.' },
  { id: 'tg8', name: 'Goalie Guru', desc: '+5 IQ', effect: { hockeyIQ: 5 }, rarity: 'Rare', tag: 'MIND', flavor: 'Working with a legendary goalie coach to master game management.' },
  { id: 'tg9', name: 'Yoga Retreat', desc: '+3 AGI, +2 STM', effect: { physicality: 3, stamina: 2 }, rarity: 'Rare', tag: 'FLEX', flavor: 'A month of intensive yoga to increase lower body durability.' },
  { id: 'tg10', name: 'European Butterfly Camp', desc: '+3 POS, +2 REF', effect: { skating: 3, shooting: 2 }, rarity: 'Rare', tag: 'SKL', flavor: 'Learning reverse-VH mastery from Finnish goaltending legends.' },
  { id: 'tg19', name: 'Mobility Specialist', desc: '+5 AGI', effect: { physicality: 5 }, rarity: 'Rare', tag: 'AGI', flavor: 'A hip specialist buys you four inches of reach you did not have.' },
  { id: 'tg20', name: 'Shot Volume Camp', desc: '+3 REF, +2 STM', effect: { shooting: 3, stamina: 2 }, rarity: 'Rare', tag: 'REF', flavor: 'Nine hundred shots a session until reacting stops being a decision.' },
  { id: 'tg21', name: 'Angle Charting', desc: '+3 IQ, +2 POS', effect: { hockeyIQ: 3, skating: 2 }, rarity: 'Rare', tag: 'MIND', flavor: 'Mapping every shooter in the league onto a single sheet of ice.' },
  { id: 'tg22', name: 'Goalie Skating Coach', desc: '+3 POS, +2 AGI', effect: { skating: 3, physicality: 2 }, rarity: 'Rare', tag: 'EDGE', flavor: 'Edges first. Everything a goalie does badly starts in the feet.' },
  { id: 'tg11', name: 'National Team Camp', desc: '+4 POS, +4 AGI', effect: { skating: 4, physicality: 4 }, rarity: 'Epic', tag: 'PRO', flavor: 'Invited to be the undisputed starter for your national team.' },
  { id: 'tg12', name: 'Summer Pro Tour', desc: '+5 REF, +3 POS', effect: { shooting: 5, skating: 3 }, rarity: 'Epic', tag: 'ELITE', flavor: 'Facing down NHL snipers in high-intensity summer scrimmages.' },
  { id: 'tg23', name: 'Private Goalie Consultancy', desc: '+4 REF, +4 IQ', effect: { shooting: 4, hockeyIQ: 4 }, rarity: 'Epic', tag: 'ELITE', flavor: 'The consultant three Vezina winners pay for, now on your payroll.' },
  { id: 'tg24', name: 'Olympic Goalie Program', desc: '+5 POS, +3 AGI', effect: { skating: 5, physicality: 3 }, rarity: 'Epic', tag: 'PRO', flavor: 'Six weeks as the national program’s project, cameras on every movement.' }
];

// NOTE on the "ovr" field below: unlike the original file, this is no longer
// applied directly to player.ovr (which is recomputed from the five
// attributes every season and would silently erase it). App.jsx now
// distributes it evenly across all five attributes so it persists.
export const eventDeck = [
  {
    title: 'The Derby',
    desc: 'You play the local rivals tonight. The media asks for a quote.',
    choices: [
      { label: 'Trash talk them', subLabel: "Give the press a headline and hope you back it up.", isRisky: true, successChance: 0.5, successFeedback: 'The fans loved it and you backed it up with a huge win!', successEffect: { fanStatus: 25, ovr: 0, money: 0 }, failFeedback: 'You talked big but took a bad penalty. The fans are turning on you.', failEffect: { fanStatus: -20, ovr: 0, money: 0 } },
      { label: 'Give a boring PR answer', subLabel: "Say nothing quotable and keep the focus on the ice.", isRisky: false, feedback: 'Boring, but you stayed focused on the game.', effect: { fanStatus: -5, ovr: 1, money: 0 } }
    ]
  },
  {
    title: 'Sponsorship Deal', proOnly: true,
    desc: 'An energy drink wants to sponsor you, but requires an intense ad shoot on your only rest day.',
    choices: [
      { label: 'Take the money', subLabel: "Shoot the ad on your only rest day.", isRisky: true, successChance: 0.7, successFeedback: 'You made bank and somehow still had legs for the game.', successEffect: { fanStatus: 10, ovr: 0, money: 120000 }, failFeedback: 'You got paid, but you looked exhausted and sluggish on the ice.', failEffect: { fanStatus: 0, ovr: -2, money: 120000 } },
      { label: 'Rest your body instead', subLabel: "Turn down the cheque and arrive fresh.", isRisky: false, feedback: 'You feel fresh and ready for the next match.', effect: { fanStatus: 0, ovr: 2, money: 0 } }
    ]
  },
  {
    title: 'Trade Rumors',
    desc: 'Your name is popping up on the trade block. The GM wants to know where your head is at.',
    choices: [
      { label: 'Demand to stay', subLabel: "Tell the GM to his face that you are not going anywhere.", isRisky: true, successChance: 0.6, successFeedback: 'The GM respected your loyalty. The fans adore you.', successEffect: { fanStatus: 30, ovr: 0, money: 0 }, failFeedback: "The GM told you it's a business. You feel alienated.", failEffect: { fanStatus: -15, ovr: -1, money: 0 } },
      { label: 'Let your agent handle it', subLabel: "Stay out of it and let the business run its course.", isRisky: false, feedback: 'You tuned out the noise and focused on hockey.', effect: { fanStatus: 0, ovr: 1, money: 0 } }
    ]
  },
  {
    title: 'Locker Room Dispute',
    desc: 'Two veterans are screaming at each other after a bad loss. The room is tense.',
    choices: [
      { label: 'Step in and mediate', subLabel: "Put yourself between two angry veterans.", isRisky: true, successChance: 0.5, successFeedback: 'You calmed them down and showed real leadership.', successEffect: { fanStatus: 10, ovr: 2, money: 0 }, failFeedback: 'They told you to mind your own business. Chemistry plummets.', failEffect: { fanStatus: 0, ovr: -2, money: 0 } },
      { label: 'Keep your head down', subLabel: "Let them sort it out and stay clear of the fallout.", isRisky: false, feedback: 'You stayed out of it, but the team vibe is definitely weird.', effect: { fanStatus: 0, ovr: -1, money: 0 } }
    ]
  },
  {
    title: 'Charity Hospital Visit',
    desc: "The team is visiting a children's hospital, but it overlaps with your extra training session.",
    choices: [
      { label: 'Go to the hospital', subLabel: "Skip your extra session to spend the day with the kids.", isRisky: false, feedback: 'The kids loved seeing you. The city embraces you.', effect: { fanStatus: 40, ovr: 0, money: 0 } },
      { label: 'Hit the ice and train', subLabel: "Bank the extra work and hope nobody notices you were missing.", isRisky: true, successChance: 0.2, successFeedback: "The media didn't notice your absence, and the training paid off.", successEffect: { fanStatus: 0, ovr: 2, money: 0 }, failFeedback: 'The local paper roasted you for skipping the charity event.', failEffect: { fanStatus: -35, ovr: 1, money: 0 } }
    ]
  },
  {
    title: 'The Viral Moment',
    desc: 'A clip of you pulling off a ridiculous highlight-reel move in warmups is blowing up online. A brand wants you to lean into it.',
    choices: [
      { label: 'Post the whole routine', subLabel: "Lean all the way into the attention.", isRisky: true, successChance: 0.6, successFeedback: 'You broke the internet. Your following (and your Q rating) explodes.', successEffect: { fanStatus: 35, ovr: 0, money: 45000 }, failFeedback: 'A rival captain called you a clown in the press and it stuck.', failEffect: { fanStatus: -15, ovr: 0, money: 45000 } },
      { label: 'Stay humble, say nothing', subLabel: "Let the clip speak for itself.", isRisky: false, feedback: 'You let your game do the talking. Old-school respect from the room.', effect: { fanStatus: 5, ovr: 1, money: 0 } }
    ]
  },
  {
    title: 'Play Through Pain',
    desc: 'You tweaked something in the last game. The doctors say sit; the coach says the team needs you for a huge divisional clash.',
    choices: [
      { label: 'Gut it out and play', subLabel: "Override the doctors for a game the team needs.", isRisky: true, successChance: 0.45, successFeedback: 'You battled through it and were the difference maker. A warrior.', successEffect: { fanStatus: 30, ovr: 0, money: 0 }, failFeedback: 'You aggravated it badly and looked a step slow for weeks.', failEffect: { fanStatus: 0, ovr: -3, money: 0 } },
      { label: 'Trust the medical staff', subLabel: "Sit out now to avoid a longer absence later.", isRisky: false, feedback: 'You rested up and came back fresh and healthy.', effect: { fanStatus: -5, ovr: 2, money: 0 } }
    ]
  },
  {
    title: "The Coach's Doghouse",
    desc: 'The new head coach benched you in the third period and the media wants to know how you feel about it.',
    choices: [
      { label: 'Call him out publicly', subLabel: 'Take the benching to the media and force his hand.', isRisky: true, successChance: 0.35, successFeedback: 'The fans rallied behind you and the coach backed down. Power move.', successEffect: { fanStatus: 25, ovr: 0, money: 0 }, failFeedback: 'You lost the room and the coach permanently stapled you to the bench.', failEffect: { fanStatus: -20, ovr: -2, money: 0 } },
      { label: 'Ask for a closed-door meeting', subLabel: 'Settle it privately and keep it out of the press.', isRisky: false, feedback: 'You handled it like a pro. The coach respects you for it.', effect: { fanStatus: 0, ovr: 2, money: 0 } }
    ]
  },
  {
    title: 'Vegas in the Off-Week', minAge: 21,
    desc: 'The boys are planning a wild trip on the bye week. Tempting, but camp intensity is ramping up.',
    choices: [
      { label: 'Go all in with the boys', subLabel: "Team bonding on the bye week, at the cost of your conditioning.", isRisky: true, successChance: 0.5, successFeedback: 'Elite team bonding. The chemistry carried right onto the ice.', successEffect: { fanStatus: 15, ovr: 1, money: -40000, rel: { teammates: 25 } }, failFeedback: 'You showed up to camp gassed and out of shape. Bad look.', failEffect: { fanStatus: 0, ovr: -3, money: -40000, rel: { coach: -20 } } },
      { label: 'Skip it, hit the gym', subLabel: "Miss the trip and report to camp ahead of everyone.", isRisky: false, feedback: 'While they nursed hangovers, you got a head start on the season.', effect: { fanStatus: 0, ovr: 2, money: 0, rel: { coach: 10 } } }
    ],
    isSeasonEvent: true // <--- FIX FOR BUG #2: Allows the event to route back to the season!
  },
  {
    title: 'The Captaincy Vote',
    desc: 'The team is choosing a new captain. A veteran quietly asks if you would step aside so he can wear the "C" one last year.',
    choices: [
      { label: 'Campaign for yourself', subLabel: "Make your case for the C and risk looking selfish.", isRisky: true, successChance: 0.55, successFeedback: 'You won the vote and the fan base loves the young leader.', successEffect: { fanStatus: 30, ovr: 1, money: 0 }, failFeedback: 'It came off as selfish and split the locker room.', failEffect: { fanStatus: -20, ovr: -1, money: 0 } },
      { label: 'Defer to the veteran', subLabel: "Let him have his last year with the letter.", isRisky: false, feedback: 'A classy move. The whole room notices, including management.', effect: { fanStatus: 10, ovr: 1, money: 0 } }
    ]
  },
  {
    title: 'The Endorsement Fork', proOnly: true,
    desc: 'Two offers on the table: a safe local dealership deal, or a bold national campaign that could flop spectacularly.',
    choices: [
      { label: 'Chase the national spotlight', subLabel: "Bigger cheque, bigger audience, bigger way to flop.", isRisky: true, successChance: 0.5, successFeedback: 'The campaign was a smash. You are a household name now.', successEffect: { fanStatus: 40, ovr: 0, money: 80000 }, failFeedback: 'The ad was mocked relentlessly. Cringe follows you around.', failEffect: { fanStatus: -25, ovr: 0, money: 80000 } },
      { label: 'Take the safe local deal', subLabel: "Smaller money, no downside.", isRisky: false, feedback: 'Steady money, no drama. The hometown appreciates the loyalty.', effect: { fanStatus: 10, ovr: 0, money: 40000 } }
    ]
  },
  {
    title: 'Mentor or Rival',
    desc: 'A hyped rookie is gunning for your spot in the lineup and clearly sees you as competition, not a teammate.',
    choices: [
      { label: 'Take him under your wing', subLabel: "Help the kid who wants your spot.", isRisky: false, feedback: 'You showed real leadership. The kid, and the coaches, will remember it.', effect: { fanStatus: 15, ovr: 1, money: 0 } },
      { label: 'Show him who runs this room', subLabel: "Freeze him out and prove the spot is yours.", isRisky: true, successChance: 0.5, successFeedback: 'You outworked him at every turn and cemented your status.', successEffect: { fanStatus: 20, ovr: 2, money: 0 }, failFeedback: 'The rivalry got petty and the coach sided with the kid.', failEffect: { fanStatus: -15, ovr: -1, money: 0 } }
    ]
  },
  // NEW: OFF-ICE / PERSONAL LIFE EVENTS
  {
    title: 'The High-Profile Romance', minAge: 20,
    desc: 'You have started dating a very famous pop star. The paparazzi are swarming your house and following you to the arena. It is becoming a massive distraction.',
    choices: [
      { label: 'Embrace the Limelight', subLabel: "Go public and let the attention follow you to the rink.", isRisky: true, successChance: 0.5, successFeedback: 'You leaned into the fame! You are now half of a global power couple, and your jersey sales are through the roof.', successEffect: { fanStatus: 150, ovr: 0, money: 45000, rel: { media: 20 } }, failFeedback: 'The distraction proved too much. You looked completely lost on the ice, and the coach benched you to protect the team.', failEffect: { fanStatus: 50, ovr: -2, money: 0, rel: { coach: -25, teammates: -10 } } },
      { label: 'Keep it Private', subLabel: "Set hard boundaries with the press.", isRisky: false, feedback: 'You set strict boundaries with the press and focused on hockey. Your coach appreciates the maturity.', effect: { fanStatus: 10, ovr: 1, money: 0, rel: { coach: 15 } } }
    ]
  },
  {
    title: 'Family Investment Opportunity', proOnly: true, minAge: 22,
    desc: 'Your brother wants you to invest heavily in his new "revolutionary" tech startup. Your financial advisor strongly advises against it.',
    choices: [
      { label: 'Fund the Startup ($125k)', subLabel: "Back your brother against your advisor's judgement.", isRisky: true, successChance: 0.35, successFeedback: 'Against all odds, the company took off! You doubled your investment and your family is thrilled.', successEffect: { fanStatus: 0, ovr: 0, money: 250000 }, failFeedback: 'The company went bankrupt in six months. You lost millions, and Thanksgiving dinner is going to be incredibly awkward.', failEffect: { fanStatus: 0, ovr: -1, money: -125000 } },
      { label: 'Trust the Advisor (Pass)', subLabel: "Say no and accept the awkward family dinners.", isRisky: false, feedback: 'You politely declined. Your brother is angry, but your bank account is safe.', effect: { fanStatus: 0, ovr: 0, money: 0 } }
    ]
  },
  {
    title: 'The Fired Agent', proOnly: true, minAge: 20,
    desc: 'Your agent just got caught in a massive illegal gambling scandal. The media is swarming, assuming you are involved.',
    choices: [
      { label: 'Defend Him to the Press', subLabel: "Stake your own name on his innocence.", isRisky: true, successChance: 0.40, successFeedback: 'You cleared your name and loyalty paid off—he beat the charges and negotiated a massive endorsement for you as a thank you.', successEffect: { fanStatus: 20, ovr: 0, money: 80000, rel: { media: 10 } }, failFeedback: 'The evidence against him was overwhelming. By defending him, your own reputation took a massive hit.', failEffect: { fanStatus: -50, ovr: 0, money: 0, rel: { media: -30 } } },
      { label: 'Fire Him Immediately', subLabel: "Cut him loose before the story reaches you.", isRisky: false, feedback: 'You ruthlessly cut ties. It was cold, but it protected your brand.', effect: { fanStatus: 15, ovr: 0, money: 0, rel: { media: 15 } } }
    ]
  },
  {
    title: 'The Hometown Charity Gala',
    desc: 'Your hometown is hosting a massive charity gala in your honor. Unfortunately, it is scheduled the night before the hardest day of training camp.',
    choices: [
      { label: 'Fly Home for the Kids', subLabel: "Make the trip the night before the hardest day of camp.", isRisky: true, successChance: 0.60, successFeedback: 'You made the trip, delighted the fans, and somehow still dominated the bag skate the next morning!', successEffect: { fanStatus: 75, ovr: 1, money: -50000, rel: { coach: 10 } }, failFeedback: 'You flew home, but your flight back was delayed. You missed the start of camp and the coach is furious.', failEffect: { fanStatus: 50, ovr: -2, money: -50000, rel: { coach: -30, teammates: -10 } } },
      { label: 'Skip it for Hockey', subLabel: "Send a cheque and a video message instead.", isRisky: false, feedback: 'You sent a video message and a check. The hometown fans are a bit disappointed, but you dominated camp.', effect: { fanStatus: -15, ovr: 2, money: -50000, rel: { coach: 15 } } }
    ]
  },
  {
    title: 'Off-Ice Controversy',
    desc: 'A teammate was caught on video making wildly inappropriate comments at a bar. The media is demanding a statement from you as a leader in the room.',
    choices: [
      { label: 'Condemn the Comments', subLabel: "Say the right thing publicly and wear it in the room.", isRisky: false, feedback: 'You took a hard stance. The media praised your leadership, but it definitely caused a fracture in the locker room.', effect: { fanStatus: 20, ovr: 0, money: 0, rel: { media: 30, teammates: -25 } } },
      { label: 'Protect the Room ("No Comment")', subLabel: 'Give the media nothing and wear whatever follows.', isRisky: true, successChance: 0.50, successFeedback: 'You stonewalled the media. The story died down quickly, and your teammates deeply respect your loyalty.', successEffect: { fanStatus: -10, ovr: 0, money: 0, rel: { media: -10, teammates: 30 } }, failFeedback: 'The media accused you of protecting a toxic culture. Your silence became a massive PR disaster.', failEffect: { fanStatus: -60, ovr: -1, money: 0, rel: { media: -40, teammates: 10 } } }
    ]
  },
  {
    title: 'The Next Generation', minAge: 30,
    desc: 'Your teenage son is generating serious buzz ahead of the junior hockey draft. The media is already comparing him to you, and the pressure on him is immense.',
    choices: [
      { 
        label: 'Push Him to Greatness', subLabel: "Hold him to your standard and see if he can carry it.", 
        isRisky: true, 
        successChance: 0.5, 
        successFeedback: 'He embraced the grind! He went 1st overall and your hockey family legacy is secured.', 
        successEffect: { fanStatus: 100, ovr: 0, money: 0, rel: { media: 20 } }, 
        failFeedback: 'The pressure broke him. He quit hockey entirely, and the media blamed your overbearing parenting.', 
        failEffect: { fanStatus: -50, ovr: -1, money: 0, rel: { media: -30 } } 
      },
      { 
        label: 'Protect Him from the Spotlight',
        subLabel: 'Shield him from the comparisons and let him grow at his own pace.', 
        isRisky: false, 
        feedback: 'You shielded him from the media and let him enjoy being a kid. A great dad move, even if the hockey world is disappointed.', 
        effect: { fanStatus: 20, ovr: 1, money: 0, rel: { media: -10 } } 
      }
    ]
  }
];