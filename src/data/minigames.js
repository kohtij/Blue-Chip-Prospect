export const interactiveMinigames = [
  {
    id: 'shootout_snipe',
    title: 'THE SHOOTOUT SNIPE',
    desc: 'The game is on your stick. Watch the goalie, wait for the weak spot to open up (green), and snipe it before the clock runs out!',
    accent: 'blue',
    gameType: 'shootout',
    pos: ['C', 'LW', 'RW', 'LD', 'RD'], // Skaters only
    reward: { win: { idol: 25, ovr: 1, money: 5000 }, loss: { idol: -15, ovr: 0 } },
    successMsg: "Snipe city! You went top shelf where momma hides the peanut butter!",
    failMsg: "You waited too long and the goalie poke-checked the puck away."
  },
  {
    id: 'faceoff_draw',
    title: 'THE FACEOFF DRAW',
    desc: 'Stare down the referee. When the circle flashes GREEN, click as fast as possible to win the draw. Do not jump early!',
    accent: 'amber',
    gameType: 'faceoff',
    pos: ['C'], // Centers only
    reward: { win: { idol: 15, ovr: 1, rel: { coach: 10 } }, loss: { idol: -10, ovr: 0, rel: { coach: -10 } } },
    successMsg: "Clean win! You snapped it straight back to your defenseman.",
    failMsg: "You lost the draw, putting your team immediately on the defensive."
  },
  {
    id: 'rapid_crease',
    title: 'RAPID FIRE CREASE',
    desc: 'They are peppering you with shots! Click the pucks (red dots) as they appear to make the save. Make 5 saves to survive!',
    accent: 'red',
    gameType: 'crease',
    pos: ['G'], // Goalies only
    reward: { win: { idol: 30, ovr: 1, rel: { teammates: 15 } }, loss: { idol: -20, ovr: -1 } },
    successMsg: "Brick wall! You robbed them blind and kept the puck out of the net.",
    failMsg: "The barrage was too much. You gave up a soft rebound goal."
  },
  {
    id: 'film_room',
    title: 'THE FILM ROOM',
    desc: 'Coach is drawing up a play. Memorize the exact pattern, then select the matching play from the options.',
    accent: 'emerald',
    gameType: 'film',
    pos: ['C', 'LW', 'RW', 'LD', 'RD', 'G'], // Everyone
    reward: { win: { idol: 5, ovr: 1, rel: { coach: 20 } }, loss: { idol: 0, ovr: 0, rel: { coach: -20 } } },
    successMsg: "High IQ! You knew exactly where everyone was supposed to be.",
    failMsg: "You blew your assignment and the coach ripped into you."
  },
  {
    id: 'tip_in',
    title: 'THE DEFLECTION',
    desc: 'Your defenseman winds up from the point. Wait for the puck to enter the sweet spot (green zone) and click to tip it past the goalie!',
    accent: 'emerald',
    gameType: 'deflect',
    pos: ['C', 'LW', 'RW'], // Forwards only
    reward: { win: { idol: 20, ovr: 1 }, loss: { idol: -5, ovr: 0 } },
    successMsg: "Perfect hand-eye coordination! You tipped it right under the bar.",
    failMsg: "You missed the puck entirely and the goalie swallowed it up."
  },
  {
    id: 'shot_block',
    title: 'THE SHOT BLOCK',
    desc: 'They are teeing up a one-timer! Watch the shooter, see which lane flashes RED, and click that lane to step in front of the puck. Block 3 shots!',
    accent: 'amber',
    gameType: 'block',
    pos: ['LD', 'RD'], // Defensemen only
    reward: { win: { idol: 25, ovr: 1, rel: { teammates: 20, coach: 15 } }, loss: { idol: 0, ovr: -1, rel: { coach: -5 } } },
    successMsg: "You ate those pucks like a champion. The bench is going wild for you!",
    failMsg: "You screened your own goalie and the puck went right past you into the net."
  },
  {
    id: 'breakaway_deke',
    title: 'THE BREAKAWAY',
    desc: 'A star forward is coming in all alone! Watch his shoulders. When he commits to a side (arrow appears), instantly click the matching pad to make the save!',
    accent: 'blue',
    gameType: 'breakaway',
    pos: ['G'], // Goalies only
    reward: { win: { idol: 35, ovr: 1, rel: { teammates: 10 } }, loss: { idol: -15, ovr: -1 } },
    successMsg: "Highway robbery! You read the deke perfectly and flashed the leather.",
    failMsg: "You bit on the fake and he tucked it in the empty side of the net."
  },
  {
    id: 'one_timer',
    title: 'THE ONE-TIMER',
    desc: 'A perfect cross-ice pass is sliding into your wheelhouse. Wait for the puck to enter the yellow sweet-spot and click to blast it home!',
    accent: 'amber',
    gameType: 'onetimer',
    pos: ['C', 'LW', 'RW', 'LD', 'RD'], // Skaters only
    reward: { win: { idol: 20, ovr: 1 }, loss: { idol: -10, ovr: 0 } },
    successMsg: "What a rocket! You blasted the one-timer top shelf.",
    failMsg: "You fanned on the shot and the puck trickled into the corner."
  },
];

export const getMinigamePool = (pos) => {
  return interactiveMinigames.filter(m => !m.pos || m.pos.includes(pos));
};

export const findMinigame = (id) => {
  return interactiveMinigames.find(m => m.id === id);
};