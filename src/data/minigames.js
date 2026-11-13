export const interactiveMinigames = [
  {
    id: 'shootout_snipe',
    title: 'THE SHOOTOUT SNIPE',
    desc: 'The game is on your stick and there is nobody between you and him.',
    read: 'Watch his depth and his feet. Down in the butterfly he seals the ice and gives you the top corners; standing tall he covers high and leaves the five hole. Take the one he has actually given you.',
    stat: 'shooting',
    accent: 'blue',
    gameType: 'shootout',
    pos: ['C', 'LW', 'RW', 'LD', 'RD'], // Skaters only
    reward: { win: { fanStatus: 25, ovr: 1, money: 5000 }, loss: { fanStatus: -15, ovr: 0 } },
    successMsg: "Snipe city! You went top shelf where momma hides the peanut butter!",
    failMsg: "You waited too long and the goalie poke-checked the puck away."
  },
  {
    id: 'faceoff_draw',
    title: 'THE FACEOFF DRAW',
    desc: 'Defensive zone draw, and the linesman is holding the puck.',
    read: 'He drops it when he feels like dropping it. First stick on it wins the draw, and jumping early gets you one warning and then thrown out of the circle.',
    stat: 'hockeyIQ',
    accent: 'amber',
    gameType: 'faceoff',
    pos: ['C'], // Centers only
    reward: { win: { fanStatus: 15, ovr: 1, rel: { coach: 10 } }, loss: { fanStatus: -10, ovr: 0, rel: { coach: -10 } } },
    successMsg: "Clean win! You snapped it straight back to your defenseman.",
    failMsg: "You lost the draw, putting your team immediately on the defensive."
  },
  {
    id: 'rapid_crease',
    title: 'RAPID FIRE SHOOTOUT',
    desc: 'They have you under siege and the shots are coming from everywhere.',
    read: 'Five saves and the barrage is over. Three past you and it is not. Get a piece of everything.',
    stat: 'physicality',
    accent: 'red',
    gameType: 'crease',
    pos: ['G'], // Goalies only
    reward: { win: { fanStatus: 30, ovr: 1, rel: { teammates: 15 } }, loss: { fanStatus: -20, ovr: -1 } },
    successMsg: "Brick wall! You robbed them blind and kept the puck out of the net.",
    failMsg: "The barrage was too much. You gave up a soft rebound goal."
  },
  {
    id: 'film_room',
    title: 'THE FILM ROOM',
    desc: 'Three clips on the board, and the staff want to hear what you see.',
    read: 'These are situations, not trick questions. Read the diagram and make the call a coach would want made.',
    stat: 'hockeyIQ',
    accent: 'emerald',
    gameType: 'film',
    pos: ['C', 'LW', 'RW', 'LD', 'RD', 'G'], // Everyone
    reward: { win: { fanStatus: 5, ovr: 1, rel: { coach: 20 } }, loss: { fanStatus: 0, ovr: 0, rel: { coach: -20 } } },
    successMsg: "High IQ! You knew exactly where everyone was supposed to be.",
    failMsg: "You blew your assignment and the coach ripped into you."
  },
  {
    id: 'tip_in',
    title: 'THE DEFLECTION',
    desc: 'You are screening the goalie while your defenceman winds up from the point.',
    read: 'You cannot see the lane from in there, and nobody is going to show it to you. Hold your ground, then let go when you think the puck has arrived.',
    stat: 'physicality',
    accent: 'emerald',
    gameType: 'deflect',
    pos: ['C', 'LW', 'RW'], // Forwards only
    reward: { win: { fanStatus: 20, ovr: 1 }, loss: { fanStatus: -5, ovr: 0 } },
    successMsg: "Perfect hand-eye coordination! You tipped it right under the bar.",
    failMsg: "You missed the puck entirely and the goalie swallowed it up."
  },
  {
    id: 'shot_block',
    title: 'THE SHOT BLOCK',
    desc: 'Their point man is teeing one up and you are the last body in the lane.',
    read: 'Three blocked and the puck is out of the zone. Pick the wrong lane and you have screened your own goalie.',
    stat: 'skating',
    accent: 'amber',
    gameType: 'block',
    pos: ['LD', 'RD'], // Defensemen only
    reward: { win: { fanStatus: 25, ovr: 1, rel: { teammates: 20, coach: 15 } }, loss: { fanStatus: 0, ovr: -1, rel: { coach: -5 } } },
    successMsg: "You ate those pucks like a champion. The bench is going wild for you!",
    failMsg: "You screened your own goalie and the puck went right past you into the net."
  },
  {
    id: 'breakaway_deke',
    title: 'THE BREAKAWAY',
    desc: 'He is through everybody and coming in alone on you.',
    read: 'Cheat to a side and you take his deke away, but you have handed him half the net. Stay square and it is all on your hands.',
    stat: 'hockeyIQ',
    accent: 'blue',
    gameType: 'breakaway',
    pos: ['G'], // Goalies only
    reward: { win: { fanStatus: 35, ovr: 1, rel: { teammates: 10 } }, loss: { fanStatus: -15, ovr: -1 } },
    successMsg: "Highway robbery! You read the deke perfectly and flashed the leather.",
    failMsg: "You bit on the fake and he tucked it in the empty side of the net."
  },
  {
    id: 'one_timer',
    title: 'THE ONE-TIMER',
    desc: 'A pass is coming across the seam into your wheelhouse.',
    read: 'The window is your own stick blade, and you can see it. Swing when the puck is on it, not when it is on its way.',
    stat: 'shooting',
    accent: 'amber',
    gameType: 'onetimer',
    pos: ['C', 'LW', 'RW', 'LD', 'RD'], // Skaters only
    reward: { win: { fanStatus: 20, ovr: 1 }, loss: { fanStatus: -10, ovr: 0 } },
    successMsg: "What a rocket! You blasted the one-timer top shelf.",
    failMsg: "You fanned on the shot and the puck trickled into the corner."
  },
  // ONE ROSTER SPOT, THREE DIFFERENT AUDITIONS.
  //
  // This was a single event called TRAINING CAMP BATTLE, tagged for every
  // position in the game and built on the faceoff mechanic, so a goalie
  // fighting for the starting net was sent out to take a draw against a
  // centre, under a title that told him nothing about what he was doing or
  // why. A camp battle is real and worth keeping; what a man does to win one
  // depends entirely on what he plays.
  //
  // Same stakes and the same reward in all three. The title says what is being
  // decided and the mechanic is one he would actually be judged on.
  {
    id: 'camp_battle',
    title: 'CAMP BATTLE: THE LAST FORWARD SPOT',
    desc: 'One roster spot left, a veteran in front of you, and the staff watching.',
    read: 'It comes down to a loose puck and whose stick gets there first. Go early and the whistle goes against you.',
    stat: 'hockeyIQ',
    accent: 'emerald',
    gameType: 'faceoff',
    pos: ['C', 'LW', 'RW'],
    reward: { win: { fanStatus: 10, ovr: 1, rel: { coach: 25 } }, loss: { fanStatus: -5, ovr: -1, rel: { coach: -25 } } },
    successMsg: "You won the battle and earned the coach's trust! You secured premium ice time.",
    failMsg: "You lost the battle. The veteran outworked you, and you've been demoted to the depth lines."
  },
  {
    id: 'camp_battle_d',
    title: 'CAMP BATTLE: THE LAST PAIRING',
    desc: 'One pairing left to fill, a veteran ahead of you, and the staff watching.',
    read: 'They will run you at the gap until you blink. Get in the lane and wear it.',
    stat: 'physicality',
    accent: 'emerald',
    gameType: 'block',
    pos: ['LD', 'RD'],
    reward: { win: { fanStatus: 10, ovr: 1, rel: { coach: 25 } }, loss: { fanStatus: -5, ovr: -1, rel: { coach: -25 } } },
    successMsg: "You won the battle and earned the coach's trust! You secured premium ice time.",
    failMsg: "You lost the battle. The veteran outworked you, and you've been demoted to the depth lines."
  },
  {
    id: 'camp_battle_g',
    title: 'CAMP BATTLE: THE STARTING NET',
    desc: 'Two goalies, one net, and a staff that has to pick before opening night.',
    read: 'Scrimmage after scrimmage, and every puck they put on you is part of the decision.',
    stat: 'hockeyIQ',
    accent: 'emerald',
    gameType: 'crease',
    pos: ['G'],
    reward: { win: { fanStatus: 10, ovr: 1, rel: { coach: 25 } }, loss: { fanStatus: -5, ovr: -1, rel: { coach: -25 } } },
    successMsg: "You won the net out of camp and the staff told the room so.",
    failMsg: "You let in too many in the scrimmages. The veteran starts opening night."
  },
  {
    id: 'breakout',
    title: 'THE BREAKOUT',
    desc: 'Pinned in your own end with two forecheckers closing on you.',
    read: 'One of your wingers will come open. Hit him while he is open: a beat early and it dies on the wall, a beat late and the lane is shut.',
    stat: 'hockeyIQ',
    accent: 'blue',
    gameType: 'breakout',
    pos: ['LD', 'RD'],
    reward: { win: { fanStatus: 15, ovr: 1, rel: { coach: 15 } }, loss: { fanStatus: -10, ovr: 0, rel: { coach: -10 } } },
    successMsg: "Tape to tape! You bypassed the forecheck beautifully.",
    failMsg: "Turnover! You passed it right to the forechecker."
  },
  {
    id: 'screened',
    title: 'SCREENED SHOT',
    desc: 'A point shot is on its way and there is a body in front of you.',
    read: 'You will not see the release. When it clears the screen you get one move, and guessing before then leaves you leaning the wrong way.',
    stat: 'shooting',
    accent: 'emerald',
    gameType: 'screened',
    pos: ['G'],
    reward: { win: { fanStatus: 25, ovr: 1, rel: { teammates: 10 } }, loss: { fanStatus: -10, ovr: 0 } },
    successMsg: "What a reflex save! You fought through the screen.",
    failMsg: "Beaten clean. You couldn't track it through the traffic."
  },
  {
    id: 'zone_battle',
    title: 'NET FRONT BATTLE',
    desc: 'The puck is being worked around above the paint and a defenceman wants you out of it.',
    read: 'Hold the ice under the puck long enough and the tip is there. Get shoved off the spot and it goes through where you were standing.',
    stat: 'physicality',
    accent: 'amber',
    gameType: 'zone_battle',
    pos: ['C', 'LW', 'RW', 'LD', 'RD'],
    reward: { win: { fanStatus: 20, ovr: 1 }, loss: { fanStatus: -5, ovr: 0 } },
    successMsg: "You boxed out the defender and got the tip!",
    failMsg: "You lost leverage and got pushed out of the crease."
  }
];

export const getMinigamePool = (pos) => {
  return interactiveMinigames.filter(m => !m.pos || m.pos.includes(pos));
};

export const findMinigame = (id) => {
  return interactiveMinigames.find(m => m.id === id);
};