// --- ECONOMY & EVENTS ---

export const shopItems = [
  { id: 'coach', type: 'staff', name: 'Elite Trainer', cost: 8000000, desc: 'Delays stat decline past age 30.', effect: { declineModifier: 0.5 } },
  { id: 'physio', type: 'staff', name: 'Personal Physio', cost: 6500000, desc: '+4 STM. Injury prevention.', effect: { stamina: 4 } },
  { id: 'psych', type: 'staff', name: 'Sports Psych', cost: 5000000, desc: '+5 IQ. Better event outcomes.', effect: { hockeyIQ: 5 } },
  { id: 'agent', type: 'staff', name: 'Super Agent', cost: 12000000, desc: 'Increases contract offers by 15%.', effect: { salaryModifier: 1.15 } },
  { id: 'skates', type: 'consumable', name: 'Custom Skates', cost: 1500000, descSkaters: '+4 SKT.', descGoalies: '+4 POS.', duration: 1, effect: { skating: 4 } },
  { id: 'supplements', type: 'consumable', name: 'Legal Supplements', cost: 2000000, descSkaters: '+5 PHY.', descGoalies: '+5 AGI.', duration: 2, effect: { physicality: 5 } },
  { id: 'analyst', type: 'consumable', name: 'Video Analyst', cost: 1200000, desc: '+3 IQ.', duration: 1, effect: { hockeyIQ: 3 } },
  { id: 'car', type: 'luxury', name: 'Sports Car', cost: 500000, desc: '+5 Fan Status', effect: { fanstatus: 5 } },
  { id: 'house', type: 'luxury', name: 'Penthouse', cost: 3500000, desc: '+25 Fan Status', effect: { fanstatus: 25 } },
  { id: 'jet', type: 'luxury', name: 'Private Jet', cost: 25000000, desc: '+100 Fan Status', effect: { fanstatus: 100 } },
  { id: 'charity_foundation', type: 'luxury', name: 'Charity Foundation', cost: 2500000, desc: 'Establish a massive local foundation. Huge boost to public image.', effect: { fanstatus: 800 } },
  { id: 'hypercar_collection', type: 'luxury', name: 'Hypercar Collection', cost: 3500000, desc: 'A fleet of multi-million dollar cars for your garage.', effect: { fanstatus: 400 } },
  { id: 'private_jet', type: 'luxury', name: 'Private Jet', cost: 7500000, desc: 'Travel in ultimate comfort. Completely negates road-trip fatigue.', effect: { stamina: 5, fanstatus: 200 } },
  { id: 'junior_team', type: 'luxury', name: 'Own a Junior Team', cost: 12000000, desc: 'Buy an ownership stake in a CHL franchise. Boosts your Hockey IQ and legacy.', effect: { hockeyIQ: 3, fanstatus: 500 } }
];

export const skaterTrainingPool = [
  { id: 'ts1', name: 'Target Practice', desc: '+3 SHT', effect: { shooting: 3 }, rarity: 'Common', tag: 'SHT', flavor: 'Hours spent shooting pucks at washing machines in the driveway.' },
  { id: 'ts2', name: 'Suicide Sprints', desc: '+3 SKT', effect: { skating: 3 }, rarity: 'Common', tag: 'SKT', flavor: 'Grueling bag skates until your lungs burn and legs go numb.' },
  { id: 'ts3', name: 'Weight Room', desc: '+3 PHY', effect: { physicality: 3 }, rarity: 'Common', tag: 'PHY', flavor: 'Eating heavy, lifting heavier. Building the muscle to win the boards.' },
  { id: 'ts4', name: 'Film Session', desc: '+3 IQ', effect: { hockeyIQ: 3 }, rarity: 'Common', tag: 'MIND', flavor: 'Studying goalie tendencies and defensive coverages late into the night.' },
  { id: 'ts5', name: 'Power Skating', desc: '+2 SKT, +1 STM', effect: { skating: 2, stamina: 1 }, rarity: 'Common', tag: 'TECH', flavor: 'Refining edge work to maximize stride efficiency.' },
  { id: 'ts6', name: 'Net Front Drills', desc: '+2 SHT, +1 PHY', effect: { shooting: 2, physicality: 1 }, rarity: 'Common', tag: 'GRIT', flavor: 'Taking cross-checks while practicing deflections.' },
  { id: 'ts7', name: 'Altitude Camp', desc: '+5 STM', effect: { stamina: 5 }, rarity: 'Rare', tag: 'STM', flavor: 'A brutal month in the mountains to expand your cardiovascular limits.' },
  { id: 'ts8', name: 'Veteran Mentorship', desc: '+5 IQ', effect: { hockeyIQ: 5 }, rarity: 'Rare', tag: 'MIND', flavor: 'A retired legend takes you under their wing to teach you the nuances of the game.' },
  { id: 'ts9', name: 'Box Jumps', desc: '+3 SKT, +2 PHY', effect: { skating: 3, physicality: 2 }, rarity: 'Rare', tag: 'POW', flavor: 'Explosive plyometrics to build breakaway speed.' },
  { id: 'ts10', name: 'European Skill Coach', desc: '+3 SKT, +2 SHT', effect: { skating: 3, shooting: 2 }, rarity: 'Rare', tag: 'SKL', flavor: 'Learning edge work and deceptive release points from overseas.' },
  { id: 'ts11', name: 'Olympic Development', desc: '+4 SKT, +4 PHY', effect: { skating: 4, physicality: 4 }, rarity: 'Epic', tag: 'PRO', flavor: 'Invited to the national team’s secretive, elite summer program.' },
  { id: 'ts12', name: 'Off-Season Pro League', desc: '+5 SHT, +3 SKT', effect: { shooting: 5, skating: 3 }, rarity: 'Epic', tag: 'ELITE', flavor: 'Dominating a summer league filled with NHL superstars.' }
];

export const goalieTrainingPool = [
  { id: 'tg1', name: 'Reaction Lights', desc: '+3 REF', effect: { shooting: 3 }, rarity: 'Common', tag: 'REF', flavor: 'Tracking unpredictable light boards to sharpen eye-hand coordination.' },
  { id: 'tg2', name: 'Crease Drills', desc: '+3 POS', effect: { skating: 3 }, rarity: 'Common', tag: 'POS', flavor: 'Perfecting angles and challenging shooters aggressively.' },
  { id: 'tg3', name: 'Butterfly Stretches', desc: '+3 AGI', effect: { physicality: 3 }, rarity: 'Common', tag: 'AGI', flavor: 'Extreme flexibility routines to protect the lower net.' },
  { id: 'tg4', name: 'Tape Study', desc: '+3 IQ', effect: { hockeyIQ: 3 }, rarity: 'Common', tag: 'MIND', flavor: 'Memorizing opponent shootout tendencies and set plays.' },
  { id: 'tg5', name: 'Rebound Control', desc: '+2 REF, +1 IQ', effect: { shooting: 2, hockeyIQ: 1 }, rarity: 'Common', tag: 'TECH', flavor: 'Using the blocker to safely direct pucks into the corner.' },
  { id: 'tg6', name: 'Endurance Skates', desc: '+2 POS, +1 STM', effect: { skating: 2, stamina: 1 }, rarity: 'Common', tag: 'STM', flavor: 'Skating with heavy pads until your legs feel like lead.' },
  { id: 'tg7', name: 'Vision Training', desc: '+5 REF', effect: { shooting: 5 }, rarity: 'Rare', tag: 'EYES', flavor: 'Using specialized strobe glasses to slow down the puck visually.' },
  { id: 'tg8', name: 'Goalie Guru', desc: '+5 IQ', effect: { hockeyIQ: 5 }, rarity: 'Rare', tag: 'MIND', flavor: 'Working with a legendary goalie coach to master game management.' },
  { id: 'tg9', name: 'Yoga Retreat', desc: '+3 AGI, +2 STM', effect: { physicality: 3, stamina: 2 }, rarity: 'Rare', tag: 'FLEX', flavor: 'A month of intensive yoga to increase lower body durability.' },
  { id: 'tg10', name: 'European Butterfly Camp', desc: '+3 POS, +2 REF', effect: { skating: 3, shooting: 2 }, rarity: 'Rare', tag: 'SKL', flavor: 'Learning reverse-VH mastery from Finnish goaltending legends.' },
  { id: 'tg11', name: 'National Team Camp', desc: '+4 POS, +4 AGI', effect: { skating: 4, physicality: 4 }, rarity: 'Epic', tag: 'PRO', flavor: 'Invited to be the undisputed starter for your national team.' },
  { id: 'tg12', name: 'Summer Pro Tour', desc: '+5 REF, +3 POS', effect: { shooting: 5, skating: 3 }, rarity: 'Epic', tag: 'ELITE', flavor: 'Facing down NHL snipers in high-intensity summer scrimmages.' }
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
      { label: 'Trash talk them', isRisky: true, successChance: 0.5, successFeedback: 'The fans loved it and you backed it up with a huge win!', successEffect: { idol: 25, ovr: 0, money: 0 }, failFeedback: 'You talked big but took a bad penalty. The fans are turning on you.', failEffect: { idol: -20, ovr: 0, money: 0 } },
      { label: 'Give a boring PR answer', isRisky: false, feedback: 'Boring, but you stayed focused on the game.', effect: { idol: -5, ovr: 1, money: 0 } }
    ]
  },
  {
    title: 'Sponsorship Deal',
    desc: 'An energy drink wants to sponsor you, but requires an intense ad shoot on your only rest day.',
    choices: [
      { label: 'Take the money', isRisky: true, successChance: 0.7, successFeedback: 'You made bank and somehow still had legs for the game.', successEffect: { idol: 10, ovr: 0, money: 1500000 }, failFeedback: 'You got paid, but you looked exhausted and sluggish on the ice.', failEffect: { idol: 0, ovr: -2, money: 1500000 } },
      { label: 'Rest your body instead', isRisky: false, feedback: 'You feel fresh and ready for the next match.', effect: { idol: 0, ovr: 2, money: 0 } }
    ]
  },
  {
    title: 'Trade Rumors',
    desc: 'Your name is popping up on the trade block. The GM wants to know where your head is at.',
    choices: [
      { label: 'Demand to stay', isRisky: true, successChance: 0.6, successFeedback: 'The GM respected your loyalty. The fans adore you.', successEffect: { idol: 30, ovr: 0, money: 0 }, failFeedback: "The GM told you it's a business. You feel alienated.", failEffect: { idol: -15, ovr: -1, money: 0 } },
      { label: 'Let your agent handle it', isRisky: false, feedback: 'You tuned out the noise and focused on hockey.', effect: { idol: 0, ovr: 1, money: 0 } }
    ]
  },
  {
    title: 'Locker Room Dispute',
    desc: 'Two veterans are screaming at each other after a bad loss. The room is tense.',
    choices: [
      { label: 'Step in and mediate', isRisky: true, successChance: 0.5, successFeedback: 'You calmed them down and showed real leadership.', successEffect: { idol: 10, ovr: 2, money: 0 }, failFeedback: 'They told you to mind your own business. Chemistry plummets.', failEffect: { idol: 0, ovr: -2, money: 0 } },
      { label: 'Keep your head down', isRisky: false, feedback: 'You stayed out of it, but the team vibe is definitely weird.', effect: { idol: 0, ovr: -1, money: 0 } }
    ]
  },
  {
    title: 'Charity Hospital Visit',
    desc: "The team is visiting a children's hospital, but it overlaps with your extra training session.",
    choices: [
      { label: 'Go to the hospital', isRisky: false, feedback: 'The kids loved seeing you. The city embraces you.', effect: { idol: 40, ovr: 0, money: 0 } },
      { label: 'Hit the ice and train', isRisky: true, successChance: 0.2, successFeedback: "The media didn't notice your absence, and the training paid off.", successEffect: { idol: 0, ovr: 2, money: 0 }, failFeedback: 'The local paper roasted you for skipping the charity event.', failEffect: { idol: -35, ovr: 1, money: 0 } }
    ]
  },
  {
    title: 'The Viral Moment',
    desc: 'A clip of you doing a ridiculous stickhandling trick in warmups is blowing up online. A brand wants you to lean into it.',
    choices: [
      { label: 'Post the whole routine', isRisky: true, successChance: 0.6, successFeedback: 'You broke the internet. Your following (and your Q rating) explodes.', successEffect: { idol: 35, ovr: 0, money: 500000 }, failFeedback: 'A rival captain called you a clown in the press and it stuck.', failEffect: { idol: -15, ovr: 0, money: 500000 } },
      { label: 'Stay humble, say nothing', isRisky: false, feedback: 'You let your game do the talking. Old-school respect from the room.', effect: { idol: 5, ovr: 1, money: 0 } }
    ]
  },
  {
    title: 'Play Through Pain',
    desc: 'You tweaked something in the last game. The doctors say sit; the coach says the team needs you for a huge divisional clash.',
    choices: [
      { label: 'Gut it out and play', isRisky: true, successChance: 0.45, successFeedback: 'You battled through it and were the difference maker. A warrior.', successEffect: { idol: 30, ovr: 0, money: 0 }, failFeedback: 'You aggravated it badly and looked a step slow for weeks.', failEffect: { idol: 0, ovr: -3, money: 0 } },
      { label: 'Trust the medical staff', isRisky: false, feedback: 'You rested up and came back fresh and healthy.', effect: { idol: -5, ovr: 2, money: 0 } }
    ]
  },
  {
    title: "The Coach's Doghouse",
    desc: 'The new head coach benched you in the third period and the media wants to know how you feel about it.',
    choices: [
      { label: 'Call him out publicly', isRisky: true, successChance: 0.35, successFeedback: 'The fans rallied behind you and the coach backed down. Power move.', successEffect: { idol: 25, ovr: 0, money: 0 }, failFeedback: 'You lost the room and the coach buried you on the fourth line.', failEffect: { idol: -20, ovr: -2, money: 0 } },
      { label: 'Ask for a closed-door meeting', isRisky: false, feedback: 'You handled it like a pro. The coach respects you for it.', effect: { idol: 0, ovr: 2, money: 0 } }
    ]
  },
  {
    title: 'Vegas in the Off-Week',
    desc: 'The boys are planning a wild trip on the bye week. Tempting, but camp intensity is ramping up.',
    choices: [
      { label: 'Go all in with the boys', isRisky: true, successChance: 0.5, successFeedback: 'Elite team bonding. The chemistry carried right onto the ice.', successEffect: { idol: 15, ovr: 1, money: -300000 }, failFeedback: 'You showed up to camp gassed and out of shape. Bad look.', failEffect: { idol: 0, ovr: -3, money: -300000 } },
      { label: 'Skip it, hit the gym', isRisky: false, feedback: 'While they nursed hangovers, you got a head start on the season.', effect: { idol: 0, ovr: 2, money: 0 } }
    ]
  },
  {
    title: 'The Captaincy Vote',
    desc: 'The team is choosing a new captain. A veteran quietly asks if you would step aside so he can wear the "C" one last year.',
    choices: [
      { label: 'Campaign for yourself', isRisky: true, successChance: 0.55, successFeedback: 'You won the vote and the fan base loves the young leader.', successEffect: { idol: 30, ovr: 1, money: 0 }, failFeedback: 'It came off as selfish and split the locker room.', failEffect: { idol: -20, ovr: -1, money: 0 } },
      { label: 'Defer to the veteran', isRisky: false, feedback: 'A classy move. The whole room notices, including management.', effect: { idol: 10, ovr: 1, money: 0 } }
    ]
  },
  {
    title: 'The Endorsement Fork',
    desc: 'Two offers on the table: a safe local dealership deal, or a bold national campaign that could flop spectacularly.',
    choices: [
      { label: 'Chase the national spotlight', isRisky: true, successChance: 0.5, successFeedback: 'The campaign was a smash. You are a household name now.', successEffect: { idol: 40, ovr: 0, money: 1000000 }, failFeedback: 'The ad was mocked relentlessly. Cringe follows you around.', failEffect: { idol: -25, ovr: 0, money: 1000000 } },
      { label: 'Take the safe local deal', isRisky: false, feedback: 'Steady money, no drama. The hometown appreciates the loyalty.', effect: { idol: 10, ovr: 0, money: 400000 } }
    ]
  },
  {
    title: 'Mentor or Rival',
    desc: 'A hyped rookie is gunning for your spot in the lineup and clearly sees you as competition, not a teammate.',
    choices: [
      { label: 'Take him under your wing', isRisky: false, feedback: 'You showed real leadership. The kid, and the coaches, will remember it.', effect: { idol: 15, ovr: 1, money: 0 } },
      { label: 'Show him who runs this room', isRisky: true, successChance: 0.5, successFeedback: 'You outworked him at every turn and cemented your status.', successEffect: { idol: 20, ovr: 2, money: 0 }, failFeedback: 'The rivalry got petty and the coach sided with the kid.', failEffect: { idol: -15, ovr: -1, money: 0 } }
    ]
  },
  // NEW: OFF-ICE / PERSONAL LIFE EVENTS
  {
    title: 'The High-Profile Romance',
    desc: 'You have started dating a very famous pop star. The paparazzi are swarming your house and following you to the arena. It is becoming a massive distraction.',
    choices: [
      { label: 'Embrace the Limelight', isRisky: true, successChance: 0.5, successFeedback: 'You leaned into the fame! You are now half of a global power couple, and your jersey sales are through the roof.', successEffect: { idol: 150, ovr: 0, money: 500000, rel: { media: 20 } }, failFeedback: 'The distraction proved too much. You looked completely lost on the ice, and the coach benched you to protect the team.', failEffect: { idol: 50, ovr: -2, money: 0, rel: { coach: -25, teammates: -10 } } },
      { label: 'Keep it Private', isRisky: false, feedback: 'You set strict boundaries with the press and focused on hockey. Your coach appreciates the maturity.', effect: { idol: 10, ovr: 1, money: 0, rel: { coach: 15 } } }
    ]
  },
  {
    title: 'Family Investment Opportunity',
    desc: 'Your brother wants you to invest heavily in his new "revolutionary" tech startup. Your financial advisor strongly advises against it.',
    choices: [
      { label: 'Fund the Startup ($2.5M)', isRisky: true, successChance: 0.35, successFeedback: 'Against all odds, the company took off! You doubled your investment and your family is thrilled.', successEffect: { idol: 0, ovr: 0, money: 5000000 }, failFeedback: 'The company went bankrupt in six months. You lost millions, and Thanksgiving dinner is going to be incredibly awkward.', failEffect: { idol: 0, ovr: -1, money: -2500000 } },
      { label: 'Trust the Advisor (Pass)', isRisky: false, feedback: 'You politely declined. Your brother is angry, but your bank account is safe.', effect: { idol: 0, ovr: 0, money: 0 } }
    ]
  },
  {
    title: 'The Fired Agent',
    desc: 'Your agent just got caught in a massive illegal gambling scandal. The media is swarming, assuming you are involved.',
    choices: [
      { label: 'Defend Him to the Press', isRisky: true, successChance: 0.40, successFeedback: 'You cleared your name and loyalty paid off—he beat the charges and negotiated a massive endorsement for you as a thank you.', successEffect: { idol: 20, ovr: 0, money: 1000000, rel: { media: 10 } }, failFeedback: 'The evidence against him was overwhelming. By defending him, your own reputation took a massive hit.', failEffect: { idol: -50, ovr: 0, money: 0, rel: { media: -30 } } },
      { label: 'Fire Him Immediately', isRisky: false, feedback: 'You ruthlessly cut ties. It was cold, but it protected your brand.', effect: { idol: 15, ovr: 0, money: 0, rel: { media: 15 } } }
    ]
  },
  {
    title: 'The Hometown Charity Gala',
    desc: 'Your hometown is hosting a massive charity gala in your honor. Unfortunately, it is scheduled the night before the hardest day of training camp.',
    choices: [
      { label: 'Fly Home for the Kids', isRisky: true, successChance: 0.60, successFeedback: 'You made the trip, delighted the fans, and somehow still dominated the bag skate the next morning!', successEffect: { idol: 75, ovr: 1, money: -50000, rel: { coach: 10 } }, failFeedback: 'You flew home, but your flight back was delayed. You missed the start of camp and the coach is furious.', failEffect: { idol: 50, ovr: -2, money: -50000, rel: { coach: -30, teammates: -10 } } },
      { label: 'Skip it for Hockey', isRisky: false, feedback: 'You sent a video message and a check. The hometown fans are a bit disappointed, but you dominated camp.', effect: { idol: -15, ovr: 2, money: -50000, rel: { coach: 15 } } }
    ]
  },
  {
    title: 'Off-Ice Controversy',
    desc: 'A teammate was caught on video making wildly inappropriate comments at a bar. The media is demanding a statement from you as a leader in the room.',
    choices: [
      { label: 'Condemn the Comments', isRisky: false, feedback: 'You took a hard stance. The media praised your leadership, but it definitely caused a fracture in the locker room.', effect: { idol: 20, ovr: 0, money: 0, rel: { media: 30, teammates: -25 } } },
      { label: 'Protect the Room ("No Comment")', isRisky: true, successChance: 0.50, successFeedback: 'You stonewalled the media. The story died down quickly, and your teammates deeply respect your loyalty.', successEffect: { idol: -10, ovr: 0, money: 0, rel: { media: -10, teammates: 30 } }, failFeedback: 'The media accused you of protecting a toxic culture. Your silence became a massive PR disaster.', failEffect: { idol: -60, ovr: -1, money: 0, rel: { media: -40, teammates: 10 } } }
    ]
  },
  {
    title: 'The Next Generation',
    desc: 'Your teenage son is generating serious buzz ahead of the junior hockey draft. The media is already comparing him to you, and the pressure on him is immense.',
    choices: [
      { 
        label: 'Push Him to Greatness', 
        isRisky: true, 
        successChance: 0.5, 
        successFeedback: 'He embraced the grind! He went 1st overall and your hockey family legacy is secured.', 
        successEffect: { idol: 100, ovr: 0, money: 0, rel: { media: 20 } }, 
        failFeedback: 'The pressure broke him. He quit hockey entirely, and the media blamed your overbearing parenting.', 
        failEffect: { idol: -50, ovr: -1, money: 0, rel: { media: -30 } } 
      },
      { 
        label: 'Protect Him from the Spotlight', 
        isRisky: false, 
        feedback: 'You shielded him from the media and let him enjoy being a kid. A great dad move, even if the hockey world is disappointed.', 
        effect: { idol: 20, ovr: 1, money: 0, rel: { media: -10 } } 
      }
    ]
  }
];