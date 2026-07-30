// --- MINIGAME SCENARIOS ---
//
// Each scenario has 3 choices, and each choice is one of three ARCHETYPES so
// the decision is genuinely different every time (this is what kills the
// "every button is the same coin flip" feel the old version had):
//
//   safe   -> high fixed odds, small reward, small penalty
//   skill  -> odds scale off ONE stat, medium reward (specialists shine here)
//   gamble -> low odds, big reward (fan status + money, sometimes OVR)
//
// Odds and default rewards are computed in utils/gameHelpers.js
// (choiceChance / CHOICE_REWARD). A choice may override its payout with a
// `reward: { win: {...}, loss: {...} }` field for "hero moment" plays.
//
// Goalie stat labels: REF = shooting, POS = skating, AGI = physicality.

export const skaterMinigames = [
  {
    id: 'ot_breakaway', accent: 'red',
    title: '🚨 OVERTIME BREAKAWAY 🚨',
    desc: "You steal the puck at the blue line. It's just you and the goalie, and the game is on your stick.",
    choices: [
      { label: 'Pick the Corner', tag: 'SHT', archetype: 'skill', stat: 'shooting', success: 'You picked your spot and ripped it home! Game over!', fail: 'You fired it right into his chest.' },
      { label: 'Filthy Deke', tag: 'SKT + IQ', archetype: 'gamble', stats: ['skating', 'hockeyIQ'], reward: { win: { idol: 22, ovr: 1 }, loss: { idol: -10 } }, success: 'You undressed him and roofed it! The building absolutely erupts!', fail: 'You got too cute and lost the handle at the worst moment.' },
      { label: 'Quick Low Shot', tag: 'SAFE', archetype: 'safe', success: 'A smart low shot forces a whistle. No goal, but no risk either.', fail: 'Easy save, but at least you got a change.' }
    ]
  },
  {
    id: 'two_on_one', accent: 'emerald',
    title: '🏒 ODD-MAN RUSH 🏒',
    desc: 'You cross the blue line on a 2-on-1 with a teammate flying down the far wing.',
    choices: [
      { label: 'Saucer Pass', tag: 'IQ', archetype: 'skill', stat: 'hockeyIQ', success: 'You feathered it over the stick for a tap-in!', fail: 'The defenseman read it and picked it off.' },
      { label: 'Beat Him Clean', tag: 'SKT + SHT', archetype: 'gamble', stats: ['skating', 'shooting'], success: 'You froze the D and snapped it far side! Filthy.', fail: 'You tried to do too much and killed the rush.' },
      { label: 'Shot / Rebound', tag: 'SAFE', archetype: 'safe', success: 'A hard shot for a rebound keeps possession alive.', fail: 'Saved cleanly, but you kept it simple.' }
    ]
  },
  {
    id: 'the_scrum', accent: 'amber',
    title: '🥊 THE SCRUM 🥊',
    desc: 'A massive brawl breaks out in front of the net after the whistle. Everyone is pushing and shoving.',
    choices: [
      { label: 'Grab the Enforcer', tag: 'PHY', archetype: 'skill', stat: 'physicality', success: 'You tied up their heavyweight and held your own!', fail: 'You bit off more than you could chew.' },
      { label: 'Drop the Gloves', tag: 'PHY', archetype: 'gamble', stat: 'physicality', reward: { win: { idol: 24 }, loss: { idol: -12 } }, success: 'You won the fight and lit a fire under the entire bench!', fail: 'You got pummeled on the jumbotron. Rough night.' },
      { label: 'Play Peacemaker', tag: 'SAFE', archetype: 'safe', success: 'You pulled your star out of the pile. Smart, if unglamorous.', fail: 'You avoided trouble, but the fans wanted more grit.' }
    ]
  },
  {
    id: 'crucial_faceoff', accent: 'blue',
    title: '⚫ CRUCIAL FACEOFF ⚫',
    desc: 'Defensive-zone draw, final minute, protecting a one-goal lead. Win this and the game is yours.',
    choices: [
      { label: 'Tie Up and Win', tag: 'IQ', archetype: 'skill', stat: 'hockeyIQ', success: 'You won it clean back to the point. Game sealed!', fail: 'You lost the draw and the puck came right back at you.' },
      { label: 'Cheat the Draw', tag: 'SKT', archetype: 'gamble', stat: 'skating', success: 'You jumped early, stole it, and iced the game!', fail: 'The linesman tossed you and their best guy won the draw.' },
      { label: 'Let the Center Take It', tag: 'SAFE', archetype: 'safe', success: 'You leaned on your veteran to win it. It worked.', fail: 'He lost it, but the D cleaned it up.' }
    ]
  },
  {
    id: 'shorthanded_break', accent: 'red',
    title: '⚡ SHORTHANDED BREAK ⚡',
    desc: 'You block a shot on the penalty kill and suddenly you have a breakaway the other way.',
    choices: [
      { label: 'Backhand Roof', tag: 'SHT', archetype: 'skill', stat: 'shooting', success: 'Shorthanded snipe, top corner! Huge momentum swing!', fail: 'The goalie flashed the glove.' },
      { label: 'Go for the Highlight', tag: 'SKT + SHT', archetype: 'gamble', stats: ['skating', 'shooting'], reward: { win: { idol: 20, ovr: 1 }, loss: { idol: -9 } }, success: 'You danced through a checker and buried it shorthanded!', fail: 'You ran out of gas and the backchecker caught you.' },
      { label: 'Ice It, Get Off', tag: 'SAFE', archetype: 'safe', success: 'You killed clock and got fresh legs on. Textbook PK.', fail: 'Iced it safely, no glory but no goal against.' }
    ]
  },
  {
    id: 'net_front_battle', accent: 'emerald',
    title: '🥅 NET-FRONT BATTLE 🥅',
    desc: 'Power play, you are parked in the blue paint with a monster defenseman leaning on you.',
    choices: [
      { label: 'Tip the Point Shot', tag: 'IQ', archetype: 'skill', stat: 'hockeyIQ', success: 'You redirected it past the goalie! Dirty goal, they all count.', fail: 'The shot clipped your stick and sailed wide.' },
      { label: 'Bang the Rebound', tag: 'PHY + SHT', archetype: 'gamble', stats: ['physicality', 'shooting'], success: 'You fought off the check and jammed home the loose puck!', fail: 'The D wrestled you down before you could get a whack at it.' },
      { label: 'Screen the Goalie', tag: 'SAFE', archetype: 'safe', success: 'You held the screen and your point man scored through you.', fail: "You held your ground, but the shot didn't get through." }
    ]
  },
  {
    id: 'coast_to_coast', accent: 'blue',
    title: '🏒 COAST TO COAST 🏒',
    desc: 'You corral the puck behind your own net with a full head of steam and open ice ahead.',
    choices: [
      { label: 'End-to-End Rush', tag: 'SKT', archetype: 'skill', stat: 'skating', success: 'You split the whole team wide open for a clean look and scored!', fail: 'A backchecker angled you off into the corner.' },
      { label: 'The Bobby Orr Special', tag: 'SKT + SHT', archetype: 'gamble', stats: ['skating', 'shooting'], reward: { win: { idol: 22, ovr: 1 }, loss: { idol: -10 } }, success: 'End to end, deke, roof, arms in the air. Instant classic!', fail: 'You tried to beat one too many and got stripped at the line.' },
      { label: 'Chip and Change', tag: 'SAFE', archetype: 'safe', success: 'You flipped it out and got a fresh line on. No mistakes.', fail: 'Simple play, safe result.' }
    ]
  },
  {
    id: 'protect_the_lead', accent: 'blue',
    title: '🛡️ DEFENSIVE STAND 🛡️',
    desc: 'Final minute, one-goal lead, and their top line has the puck cycling in your zone.',
    choices: [
      { label: 'Read and Poke', tag: 'IQ', archetype: 'skill', stat: 'hockeyIQ', success: 'You read the play perfectly and poked it to safety. Game over.', fail: 'You lunged and got dangled out of your skates.' },
      { label: 'Lay the Big Hit', tag: 'PHY', archetype: 'gamble', stat: 'physicality', success: 'You separated him from the puck with a thunderous check!', fail: 'You missed and took an interference penalty. Yikes.' },
      { label: 'Block the Lane', tag: 'SAFE', archetype: 'safe', success: 'You took away the passing lane and ate up the clock.', fail: 'You stayed disciplined and forced a harmless shot.' }
    ]
  },
  {
    id: 'ot_3on3', accent: 'red',
    title: '💥 3-ON-3 OVERTIME 💥',
    desc: 'Wide-open 3-on-3 overtime. You catch the puck with speed and acres of ice to work with.',
    choices: [
      { label: 'Walk the Line', tag: 'SKT', archetype: 'skill', stat: 'skating', success: 'You walked the blue line, opened a lane, and scored the winner!', fail: 'You ran out of room and lost the puck at the line.' },
      { label: 'Between the Legs', tag: 'SKT + IQ', archetype: 'gamble', stats: ['skating', 'hockeyIQ'], reward: { win: { idol: 24, ovr: 1 }, loss: { idol: -11 } }, success: 'Between-the-legs finish in OT?! The highlight reel is yours forever!', fail: 'You reached for the moon and fanned on it completely.' },
      { label: 'Dump and Change', tag: 'SAFE', archetype: 'safe', success: 'You reset and got your best line out for the next rush.', fail: 'Nothing flashy, but you kept the game alive.' }
    ]
  }
];

export const goalieMinigames = [
  {
    id: 'g_breakaway', accent: 'red',
    title: '🚨 FACING A BREAKAWAY 🚨',
    desc: 'An opposing forward strips the puck and comes in all alone. Make the save.',
    choices: [
      { label: 'Challenge the Shooter', tag: 'POS + IQ', archetype: 'skill', stats: ['skating', 'hockeyIQ'], success: 'You cut down the angle and he had nowhere to shoot!', fail: 'You bit on the fake and he tucked it in.' },
      { label: 'Aggressive Poke', tag: 'AGI', archetype: 'gamble', stat: 'physicality', reward: { win: { idol: 18, ovr: 1 }, loss: { idol: -9 } }, success: 'You lunged and poked it right off his stick! Absolute robbery!', fail: 'You missed the poke and he slid it into the empty cage.' },
      { label: 'Stay Deep, Read It', tag: 'REF', archetype: 'safe', success: 'You stayed patient and swallowed the shot clean.', fail: 'He beat you, but you never gave up a rebound.' }
    ]
  },
  {
    id: 'g_penalty_shot', accent: 'red',
    title: '🥅 FACING A PENALTY SHOT 🥅',
    desc: 'A penalty shot has been called. The whole building holds its breath. Just you and him.',
    choices: [
      { label: 'Read the Deke', tag: 'IQ', archetype: 'skill', stat: 'hockeyIQ', success: 'You read his hands perfectly and slammed the door!', fail: 'He sold the fake and you opened up too early.' },
      { label: 'Commit to the Poke', tag: 'AGI', archetype: 'gamble', stat: 'physicality', reward: { win: { idol: 18 }, loss: { idol: -9 } }, success: 'You timed the poke check flawlessly and stole the puck!', fail: 'You committed early and he walked around you.' },
      { label: 'Wait Him Out', tag: 'REF', archetype: 'safe', success: 'You stayed square and let him make the first move. Saved.', fail: 'He picked a corner, but you gave him nothing easy.' }
    ]
  },
  {
    id: 'g_flurry', accent: 'blue',
    title: '🛡️ LATE-GAME FLURRY 🛡️',
    desc: 'Final minute, protecting a one-goal lead. The opponent is crashing the net with everything they have.',
    choices: [
      { label: 'Track Through Traffic', tag: 'IQ', archetype: 'skill', stat: 'hockeyIQ', success: 'You found the puck through the bodies and smothered it!', fail: 'You lost sight of it and it trickled through.' },
      { label: 'Desperation Dive', tag: 'POS + AGI', archetype: 'gamble', stats: ['skating', 'physicality'], reward: { win: { idol: 18, ovr: 1 }, loss: { idol: -9 } }, success: 'You threw your whole body across and robbed them at the buzzer!', fail: "You dove and couldn't get there in time." },
      { label: 'Cover and Freeze', tag: 'REF', archetype: 'safe', success: 'You covered the first shot and killed the play. Ice water.', fail: 'You gave up a rebound, but your D bailed you out.' }
    ]
  },
  {
    id: 'g_five_on_three', accent: 'blue',
    title: '🔻 5-ON-3 PENALTY KILL 🔻',
    desc: 'Down two men. The opposing power play is cycling the puck looking for the perfect look.',
    choices: [
      { label: 'Challenge Shooter', tag: 'POS', archetype: 'skill', stat: 'skating', success: 'You challenged hard and took away the shooting lane!', fail: 'You came too far out and they passed it into an open net.' },
      { label: 'Lateral Robbery', tag: 'POS + AGI', archetype: 'gamble', stats: ['skating', 'physicality'], success: 'You slid post-to-post and robbed the one-timer! Unreal!', fail: "You couldn't get across in time on the cross-crease play." },
      { label: 'Stay Square', tag: 'REF', archetype: 'safe', success: 'You stayed patient in your crease and made the routine stop.', fail: 'They sniped a corner, but you never got scrambly.' }
    ]
  },
  {
    id: 'g_screened', accent: 'emerald',
    title: '🚧 SCREENED SHOT 🚧',
    desc: 'A big forward is parked right in your kitchen as the point man winds up for a slapshot.',
    choices: [
      { label: 'Fight the Screen', tag: 'AGI', archetype: 'skill', stat: 'physicality', success: 'You shoved him aside, found the puck, and made the save!', fail: 'You lost your balance battling the screen.' },
      { label: 'Blind Read', tag: 'IQ', archetype: 'gamble', stat: 'hockeyIQ', success: 'You guessed the trajectory perfectly and made a blind save!', fail: 'You guessed wrong and it sailed past your ear.' },
      { label: 'Drop Early', tag: 'POS', archetype: 'safe', success: 'You dropped into the butterfly and took away the bottom of the net.', fail: 'It went high, but you never got beat clean low.' }
    ]
  },
  {
    id: 'g_play_the_puck', accent: 'amber',
    title: '🏒 PLAY THE PUCK 🏒',
    desc: 'The puck is dumped hard around the boards. Your defense is under pressure. Do you leave the net to help?',
    choices: [
      { label: 'Handle and Settle', tag: 'IQ', archetype: 'skill', stat: 'hockeyIQ', success: 'You calmly settled it and set up a clean breakout. Third defenseman!', fail: 'You bobbled it and gave the forecheck a free chance.' },
      { label: 'Stretch Outlet Pass', tag: 'IQ + REF', archetype: 'gamble', stats: ['hockeyIQ', 'shooting'], success: 'You fired a tape-to-tape stretch pass that sprung a breakaway!', fail: 'You turned it over and they scored on the empty cage. Brutal.' },
      { label: 'Rim It Around', tag: 'POS', archetype: 'safe', success: 'You rimmed it hard to your winger. Simple and safe.', fail: 'You got it out of danger, nothing fancy.' }
    ]
  },
  {
    id: 'g_robbery', accent: 'emerald',
    title: '🧤 THE ROBBERY 🧤',
    desc: 'They work a give-and-go and a shooter is waiting backdoor with a wide-open net. React.',
    choices: [
      { label: 'Push Across', tag: 'POS', archetype: 'skill', stat: 'skating', success: 'You powered post-to-post and got a piece of it!', fail: 'You were a half-step slow across the crease.' },
      { label: 'The Glove Rob', tag: 'REF', archetype: 'gamble', stat: 'shooting', reward: { win: { idol: 22, ovr: 1 }, loss: { idol: -9 } }, success: 'You snapped the glove out of nowhere and stole a sure goal! SC Top 10!', fail: 'You reached and it deflected off your glove and in.' },
      { label: 'Take Away the Pass', tag: 'IQ', archetype: 'safe', success: 'You read it early and took away the passing lane entirely.', fail: 'They shot instead, but you were square to it.' }
    ]
  },
  {
    id: 'g_cold_start', accent: 'blue',
    title: '🥶 COLD START 🥶',
    desc: 'First shot of the game, barely warmed up, and it is a grade-A chance off the rush.',
    choices: [
      { label: 'Track It Early', tag: 'IQ', archetype: 'skill', stat: 'hockeyIQ', success: 'You picked it up out of the gate and shut the door. Locked in.', fail: 'You were a beat slow and it beat you clean.' },
      { label: 'Aggressive Challenge', tag: 'POS', archetype: 'gamble', stat: 'skating', success: 'You charged out and smothered it before he could shoot!', fail: 'You overcommitted cold and got caught out of your net.' },
      { label: 'Simple Save, Cover', tag: 'REF', archetype: 'safe', success: 'You made the routine stop and covered. Settle the nerves.', fail: 'Rebound out front, but the D cleared it.' }
    ]
  },
  {
    id: 'g_shootout_duel', accent: 'red',
    title: '🎯 SHOOTOUT DUEL 🎯',
    desc: 'Sudden-death round of the shootout. Their best dangler is skating in slow, daring you to move first.',
    choices: [
      { label: 'Guess and Commit', tag: 'IQ', archetype: 'skill', stat: 'hockeyIQ', success: 'You read his release and shut the five-hole. Your team wins!', fail: 'He waited you out and slid it under the pad.' },
      { label: 'Full Butterfly Gamble', tag: 'AGI', archetype: 'gamble', stat: 'physicality', reward: { win: { idol: 18 }, loss: { idol: -9 } }, success: 'You dropped and stacked the pads for a spectacular winner!', fail: 'You dropped too early and he roofed it.' },
      { label: 'Mirror Him', tag: 'REF', archetype: 'safe', success: 'You stayed patient, mirrored his hands, and made the stop.', fail: 'He picked a perfect corner, nothing you could do.' }
    ]
  }
];

export const getMinigamePool = (pos) => (pos === 'G' ? goalieMinigames : skaterMinigames);
export const findMinigame = (id, pos) => {
  const pool = getMinigamePool(pos);
  return pool.find(m => m.id === id) || pool[0];
};
