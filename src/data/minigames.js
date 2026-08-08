export const MINIGAMES = [
  // ==========================================
  // SKATER MINIGAMES
  // ==========================================
  {
    id: 'breakaway',
    title: 'THE BREAKAWAY',
    forGoalie: false,
    accent: 'blue',
    desc: 'You intercept a pass at your own blue line and burst in all alone. The goalie comes out to challenge. What is your move?',
    choices: [
      {
        label: 'Snap it Low Blocker',
        archetype: 'safe',
        stats: ['shooting'],
        baseChance: 0.75,
        success: 'You picked your spot and snapped it home cleanly.',
        fail: 'The goalie read the shot and kicked out a pad to make an easy save.',
        reward: { win: { idol: 5, ovr: 0 }, loss: { idol: 0, ovr: 0 } }
      },
      {
        label: 'Fake and Elevate',
        archetype: 'skill',
        stats: ['skating', 'hockeyIQ'],
        baseChance: 0.55,
        success: 'You dropped the shoulder, forced the goalie down, and roofed it!',
        fail: 'You ran out of real estate and jammed the puck right into the goalie\'s chest logo.',
        reward: { win: { idol: 15, ovr: 0 }, loss: { idol: -5, ovr: 0 } }
      },
      {
        label: 'The Datsyukian Deke',
        archetype: 'gamble',
        stats: ['skating', 'shooting', 'hockeyIQ'],
        baseChance: 0.30,
        success: 'ABSOLUTELY FILTHY! You dragged the puck through your legs and chipped it in! The crowd has lost their minds!',
        fail: 'You got your skates tangled up trying to get fancy, fell over, and slid directly into the corner boards. Humiliating.',
        reward: { win: { idol: 35, ovr: 1, money: 10000 }, loss: { idol: -20, ovr: -1, money: 0 } }
      }
    ]
  },
  {
    id: 'odd_man',
    title: '2-ON-1 RUSH',
    forGoalie: false,
    accent: 'emerald',
    desc: 'Late in a tie game, you and your winger break out on a 2-on-1. The lone defenseman is sliding over to take away the pass.',
    choices: [
      {
        label: 'Use the Decoy and Shoot',
        archetype: 'safe',
        stats: ['shooting'],
        baseChance: 0.75,
        success: 'You used the defender\'s momentum against them and wired a wrister past the goalie.',
        fail: 'You telegraphed the shot. The goalie swallowed it up for a whistle.',
        reward: { win: { idol: 5, ovr: 0 }, loss: { idol: 0, ovr: 0 } }
      },
      {
        label: 'Look for the Cross-Ice Tap In',
        archetype: 'skill',
        stats: ['hockeyIQ'],
        baseChance: 0.55,
        success: 'You thread the needle perfectly through the defender\'s skates for an easy backdoor tap-in!',
        fail: 'The defender anticipated the pass and knocked it out of mid-air.',
        reward: { win: { idol: 15, ovr: 0 }, loss: { idol: -5, ovr: 0 } }
      },
      {
        label: 'Blind Drop Pass',
        archetype: 'gamble',
        stats: ['hockeyIQ', 'skating'],
        baseChance: 0.30,
        success: 'INCREDIBLE VISION! You completely fooled the defender and goalie, leaving your trailing teammate with a wide open net!',
        fail: 'You dropped it to absolutely nobody. The puck slid harmlessly to the boards while the fans rained boos upon you.',
        reward: { win: { idol: 30, ovr: 1, money: 5000 }, loss: { idol: -20, ovr: 0, money: 0 } }
      }
    ]
  },
  {
    id: 'board_battle',
    title: 'LATE GAME BOARD BATTLE',
    forGoalie: false,
    accent: 'amber',
    desc: 'You are up by one goal with 45 seconds left. The puck gets dumped into your corner and a massive opposing enforcer is bearing down on you.',
    choices: [
      {
        label: 'Eat the Puck',
        archetype: 'safe',
        stats: ['physicality'],
        baseChance: 0.75,
        success: 'You braced for impact, pinned the puck to the boards, and successfully killed crucial seconds off the clock.',
        fail: 'You got out-muscled on the wall and they stripped the puck away.',
        reward: { win: { idol: 5, ovr: 0 }, loss: { idol: 0, ovr: 0 } }
      },
      {
        label: 'Reverse Hit',
        archetype: 'skill',
        stats: ['physicality', 'skating'],
        baseChance: 0.55,
        success: 'You lowered your center of gravity and planted the enforcer onto the ice! The crowd goes wild for the physical dominance.',
        fail: 'You missed the angle and got flattened, turning the puck over in a dangerous area.',
        reward: { win: { idol: 15, ovr: 0 }, loss: { idol: -5, ovr: 0 } }
      },
      {
        label: 'Spin Off the Check and Rush',
        archetype: 'gamble',
        stats: ['skating', 'hockeyIQ'],
        baseChance: 0.30,
        success: 'You spun off the contact beautifully, leaving the enforcer in the dust, and launched a breakaway for the empty net dagger!',
        fail: 'You tried to get cute in the defensive zone, got completely leveled, and coughed up the game-tying goal.',
        reward: { win: { idol: 35, ovr: 1, money: 10000 }, loss: { idol: -25, ovr: -1, money: 0 } }
      }
    ]
  },

  // ==========================================
  // GOALIE MINIGAMES
  // ==========================================
  {
    id: 'breakaway_g',
    title: 'THE BREAKAWAY (GOALIE)',
    forGoalie: true,
    accent: 'blue',
    desc: 'A turnover at the blue line sends their top scorer in all alone. They cross the hash marks and stare you down.',
    choices: [
      {
        label: 'Hold Your Depth and Wait',
        archetype: 'safe',
        stats: ['hockeyIQ', 'skating'],
        baseChance: 0.75,
        success: 'You stayed patient, forced them to make the first move, and easily turned aside the backhand attempt.',
        fail: 'You gave them too much room and they sniped it clean over your shoulder.',
        reward: { win: { idol: 5, ovr: 0 }, loss: { idol: 0, ovr: 0 } }
      },
      {
        label: 'Aggressive Poke Check',
        archetype: 'skill',
        stats: ['physicality', 'skating'],
        baseChance: 0.55,
        success: 'Perfect timing! You lunged forward and knocked the puck right off their stick before they could shoot!',
        fail: 'You missed the puck and completely took out their skates. You gave up a penalty shot.',
        reward: { win: { idol: 15, ovr: 0 }, loss: { idol: -5, ovr: 0 } }
      },
      {
        label: 'The Flying Pad Stack',
        archetype: 'gamble',
        stats: ['shooting', 'skating'], // Using shooting for reflexes/agility proxy
        baseChance: 0.30,
        success: 'OLD SCHOOL HOCKEY! You went fully airborne and stacked the pads, robbing them blind! The arena is deafening!',
        fail: 'You totally misjudged the timing. They literally stepped around you and walked it into an empty net.',
        reward: { win: { idol: 35, ovr: 1, money: 10000 }, loss: { idol: -25, ovr: -1, money: 0 } }
      }
    ]
  },
  {
    id: 'net_scramble',
    title: 'NET-FRONT SCRAMBLE',
    forGoalie: true,
    accent: 'amber',
    desc: 'Chaos in the crease! There is a massive pileup of bodies in front of you, hacking at a loose puck in the blue paint.',
    choices: [
      {
        label: 'Smother Everything',
        archetype: 'safe',
        stats: ['physicality'],
        baseChance: 0.75,
        success: 'You threw your entire body over the pile and successfully froze the puck for a whistle.',
        fail: 'A stick knocked the puck loose just as you dropped, leading to a weak trickle-in goal.',
        reward: { win: { idol: 5, ovr: 0 }, loss: { idol: 0, ovr: 0 } }
      },
      {
        label: 'Track the Puck and Kick it Out',
        archetype: 'skill',
        stats: ['hockeyIQ'],
        baseChance: 0.55,
        success: 'You maintained absolute focus through the screen and kicked the puck out of the zone.',
        fail: 'You kicked it directly onto the tape of a trailing forward for an easy put-back.',
        reward: { win: { idol: 15, ovr: 0 }, loss: { idol: -5, ovr: 0 } }
      },
      {
        label: 'Start Throwing Blockers',
        archetype: 'gamble',
        stats: ['physicality', 'stamina'],
        baseChance: 0.30,
        success: 'You had enough of the hacking! You started throwing blocker punches, cleared the crease yourself, and fired up the whole arena!',
        fail: 'You lost your temper, took a brutal unsportsmanlike conduct penalty, and gave them a 5-on-3 powerplay.',
        reward: { win: { idol: 30, ovr: 0, money: 5000 }, loss: { idol: -20, ovr: -1, money: -5000 } }
      }
    ]
  }
];

export const getMinigamePool = (pos) => {
  const isGoalie = pos === 'G';
  return MINIGAMES.filter(mg => mg.forGoalie === isGoalie);
};

export const findMinigame = (id, pos) => {
  const pool = getMinigamePool(pos);
  return pool.find(mg => mg.id === id) || pool[0];
};