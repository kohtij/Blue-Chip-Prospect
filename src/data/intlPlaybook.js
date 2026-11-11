// What a player can actually do with the puck, by position.
//
// International duty used to hand every player the same eight prep scenarios
// (the team dinner, the media scrum) and then a minigame pulled at random out
// of his position's pool. A centre and a goaltender got the identical night.
//
// A tournament is played out of these instead: at every game you pick one play
// out of what the opposition has left you, and the pool is your own. A centre
// picks draws, cycles and forechecks. A winger picks routes to the net. A
// defenceman picks gaps, pinches and breakouts. A goaltender picks saves.
//
// --- how the diagrams are written ------------------------------------------
// Every play is drawn on the attacking zone, net at the right, on the 100x78
// sheet PlayCard paints: end boards and corners, goal line, crease, trapezoid,
// both faceoff circles with hash marks, blue line, neutral-zone dots.
//
// The notation is the standard drill-book key:
//   { type: 'skate' }  solid line            moving without the puck
//   { type: 'carry' }  solid line, ticked    moving with the puck
//   { type: 'pass'  }  dashed line           the puck leaving a stick
//   { type: 'shot'  }  wavy line             the puck going at the net
// plus `me` (you), `mates` (blue), `opp` (red) and `puck` (where it starts).
// `curve` is the control point when the route bends, which most of them do.

// Named spots on the sheet, so the plays below read like a whiteboard rather
// than a wall of numbers. Top of the sheet is the left-wing side.
const SLOT = [73, 39];
const HIGH_SLOT = [62, 39];
const L_DOT = [72, 19];
const R_DOT = [72, 59];
const R_CIRCLE_LOW = [66, 68];
const L_WALL = [58, 7];
const R_WALL = [58, 71];
const L_CORNER = [87, 12];
const R_CORNER = [87, 66];
const BEHIND_NET = [96, 39];
const L_POINT = [34, 18];
const R_POINT = [34, 60];
const MID_POINT = [34, 39];
const L_ENTRY = [27, 15];
const R_ENTRY = [27, 63];
const MID_ENTRY = [26, 39];

// --- CENTRE ----------------------------------------------------------------
const CENTRE = [
  {
    id: 'c_draw_back', name: 'Win it clean', blurb: 'Take the draw back to the point and get out of the lane.',
    diagram: {
      me: L_DOT, puck: [72, 19],
      opp: [{ at: [77, 19], label: 'C' }],
      mates: [{ at: L_POINT, label: 'D' }],
      moves: [
        { type: 'pass', from: [72, 19], to: [36, 19], curve: [54, 14] },
        { type: 'shot', from: L_POINT, to: [87, 36], curve: [62, 22] }
      ]
    }
  },
  {
    id: 'c_tie_kick', name: 'Tie up and kick', blurb: 'Lose the draw on purpose, tie his stick, kick it to the wall.',
    diagram: {
      me: L_DOT, puck: [72, 19],
      opp: [{ at: [77, 19], label: 'C' }],
      mates: [{ at: L_WALL, label: 'W' }],
      moves: [{ type: 'pass', from: [72, 19], to: [59, 9], curve: [64, 12] }]
    }
  },
  {
    id: 'c_net_front', name: 'Plant at the net', blurb: 'Take the abuse in the blue paint and screen the goaltender.',
    diagram: {
      me: [64, 30], puck: L_POINT,
      opp: [{ at: [79, 32], label: 'D' }],
      mates: [{ at: L_POINT, label: 'D' }],
      moves: [
        { type: 'skate', from: [64, 30], to: [80, 39], curve: [70, 34] },
        { type: 'shot', from: L_POINT, to: [88, 40], curve: [60, 30] }
      ]
    }
  },
  {
    id: 'c_delay_entry', name: 'Delay at the line', blurb: 'Curl back at the blue line and wait for the wingers to catch up.',
    diagram: {
      me: MID_ENTRY, puck: MID_ENTRY,
      opp: [{ at: [40, 34], label: 'D' }],
      mates: [{ at: [26, 60], label: 'W' }],
      moves: [
        { type: 'carry', from: MID_ENTRY, to: [44, 54], curve: [40, 32] },
        { type: 'pass', from: [44, 54], to: [30, 60] }
      ]
    }
  },
  {
    id: 'c_cycle_low', name: 'Cycle it low', blurb: 'Grind it along the wall and make their defence chase you down.',
    diagram: {
      me: R_CORNER, puck: R_CORNER,
      opp: [{ at: [80, 60], label: 'D' }],
      mates: [{ at: R_WALL, label: 'W' }],
      moves: [
        { type: 'carry', from: R_CORNER, to: [60, 70], curve: [74, 73] },
        { type: 'pass', from: [60, 70], to: [36, 58], curve: [48, 70] }
      ]
    }
  },
  {
    id: 'c_give_go', name: 'Give and go', blurb: 'Put it to the wall and skate into the return pass.',
    diagram: {
      me: [56, 60], puck: [56, 60],
      opp: [{ at: [64, 50], label: 'D' }],
      mates: [{ at: R_WALL, label: 'W' }],
      moves: [
        { type: 'pass', from: [56, 60], to: [58, 71] },
        { type: 'skate', from: [56, 60], to: [74, 44], curve: [60, 48] },
        { type: 'pass', from: R_WALL, to: [76, 44], curve: [70, 62] }
      ]
    }
  },
  {
    id: 'c_backdoor', name: 'Backdoor feed', blurb: 'Pull the goaltender across and slide it to the far post.',
    diagram: {
      me: R_CIRCLE_LOW, puck: R_CIRCLE_LOW,
      opp: [{ at: [78, 52], label: 'D' }],
      mates: [{ at: [82, 25], label: 'W' }],
      moves: [
        { type: 'carry', from: R_CIRCLE_LOW, to: [80, 58], curve: [74, 66] },
        { type: 'pass', from: [80, 58], to: [82, 28], curve: [92, 44] }
      ]
    }
  },
  {
    id: 'c_forecheck', name: 'Hunt the defenceman', blurb: 'First man in. Take the body and force the turnover.',
    diagram: {
      me: [44, 39],
      opp: [{ at: [88, 60], label: 'D' }],
      puck: [88, 60],
      moves: [{ type: 'skate', from: [46, 39], to: [84, 58], curve: [62, 42] }]
    }
  },
  {
    id: 'c_seam', name: 'Thread the seam', blurb: 'Through the middle of their box to the far circle.',
    diagram: {
      me: R_DOT, puck: R_DOT,
      opp: [{ at: [68, 48], label: 'D' }, { at: [74, 30], label: 'C' }],
      mates: [{ at: L_DOT, label: 'W' }],
      moves: [{ type: 'pass', from: R_DOT, to: [73, 21], curve: [62, 39] }]
    }
  },
  {
    id: 'c_wrap', name: 'Wrap it around', blurb: 'Take it behind the net and jam the post before he seals it.',
    diagram: {
      me: R_CORNER, puck: R_CORNER,
      opp: [{ at: [83, 58], label: 'D' }],
      moves: [
        { type: 'carry', from: R_CORNER, to: [96, 39], curve: [97, 56] },
        { type: 'shot', from: [96, 39], to: [91, 30], curve: [97, 32] }
      ]
    }
  },
  {
    id: 'c_drop', name: 'Drop it at the line', blurb: 'Carry it over and leave it flat for the trailer.',
    diagram: {
      me: MID_ENTRY, puck: MID_ENTRY,
      opp: [{ at: [42, 39], label: 'D' }],
      mates: [{ at: [28, 58], label: 'D' }],
      moves: [
        { type: 'carry', from: MID_ENTRY, to: [36, 34], curve: [28, 32] },
        { type: 'pass', from: [36, 34], to: [29, 56], curve: [31, 45] }
      ]
    }
  },
  {
    id: 'c_bumper', name: 'Sit in the bumper', blurb: 'Find the soft ice in the middle of their box and wait for it.',
    diagram: {
      me: HIGH_SLOT, puck: L_WALL,
      opp: [{ at: [56, 26], label: 'F' }, { at: [56, 52], label: 'F' }, { at: [74, 39], label: 'D' }],
      mates: [{ at: L_WALL, label: 'W' }],
      moves: [
        { type: 'pass', from: L_WALL, to: [63, 37], curve: [58, 26] },
        { type: 'shot', from: HIGH_SLOT, to: [88, 41], curve: [76, 36] }
      ]
    }
  }
];

// --- WINGERS ----------------------------------------------------------------
const WINGER = [
  {
    id: 'w_drive_net', name: 'Drive the net', blurb: 'Outside lane, then straight to the paint and take the goalie out of it.',
    diagram: {
      me: R_ENTRY, puck: R_ENTRY,
      opp: [{ at: [52, 58], label: 'D' }],
      moves: [
        { type: 'carry', from: R_ENTRY, to: [80, 46], curve: [62, 72] },
        { type: 'shot', from: [80, 46], to: [89, 40] }
      ]
    }
  },
  {
    id: 'w_one_timer', name: 'Off-wing one-timer', blurb: 'Open up at the far dot and hit it first time.',
    diagram: {
      me: L_DOT, puck: R_WALL,
      opp: [{ at: [74, 30], label: 'D' }],
      mates: [{ at: R_WALL, label: 'C' }],
      moves: [
        { type: 'pass', from: R_WALL, to: [70, 21], curve: [56, 44] },
        { type: 'shot', from: L_DOT, to: [88, 37], curve: [80, 24] }
      ]
    }
  },
  {
    id: 'w_chip_chase', name: 'Chip and chase', blurb: 'Put it past the defenceman and beat him to it.',
    diagram: {
      me: [27, 67], puck: [27, 67],
      opp: [{ at: [46, 62], label: 'D' }],
      moves: [
        { type: 'pass', from: [28, 69], to: [82, 71], curve: [56, 76] },
        { type: 'skate', from: [28, 64], to: [79, 65], curve: [54, 57] }
      ]
    }
  },
  {
    id: 'w_backdoor_sneak', name: 'Sneak backdoor', blurb: 'Lose your man behind the play and arrive at the far post.',
    diagram: {
      me: [58, 14], puck: R_CORNER,
      opp: [{ at: [62, 22], label: 'D' }],
      mates: [{ at: R_CORNER, label: 'C' }],
      moves: [
        { type: 'skate', from: [58, 14], to: [84, 30], curve: [76, 14] },
        { type: 'pass', from: R_CORNER, to: [85, 32], curve: [95, 50] }
      ]
    }
  },
  {
    id: 'w_cut_slot', name: 'Cut to the slot', blurb: 'Come off the wall into the home plate and shoot from there.',
    diagram: {
      me: R_WALL, puck: R_WALL,
      opp: [{ at: [64, 62], label: 'D' }],
      moves: [
        { type: 'carry', from: R_WALL, to: [74, 46], curve: [64, 56] },
        { type: 'shot', from: [74, 46], to: [88, 41] }
      ]
    }
  },
  {
    id: 'w_behind_net', name: 'Work it behind the net', blurb: 'Below the goal line, and look for the jam at the post.',
    diagram: {
      me: R_CORNER, puck: R_CORNER,
      opp: [{ at: [84, 58], label: 'D' }],
      mates: [{ at: [80, 26], label: 'C' }],
      moves: [
        { type: 'carry', from: R_CORNER, to: [96, 44], curve: [97, 58] },
        { type: 'pass', from: [96, 44], to: [82, 28], curve: [92, 30] }
      ]
    }
  },
  {
    id: 'w_tip', name: 'Tip it in the lane', blurb: 'Get your blade in front of the point shot and change it.',
    diagram: {
      me: [79, 33], puck: L_POINT,
      opp: [{ at: [76, 44], label: 'D' }],
      mates: [{ at: L_POINT, label: 'D' }],
      moves: [{ type: 'shot', from: L_POINT, to: [88, 38], curve: [62, 28] }]
    }
  },
  {
    id: 'w_rush_wide', name: 'Rush the outside', blurb: 'Beat him wide with speed, then cut back across the crease.',
    diagram: {
      me: L_ENTRY, puck: L_ENTRY,
      opp: [{ at: [46, 20], label: 'D' }],
      moves: [
        { type: 'carry', from: L_ENTRY, to: [84, 32], curve: [58, 6] },
        { type: 'shot', from: [84, 32], to: [90, 40] }
      ]
    }
  },
  {
    id: 'w_delay_drop', name: 'Delay and drop', blurb: 'Slow it at the top of the circle, leave it for the late man.',
    diagram: {
      me: [64, 54], puck: [64, 54],
      opp: [{ at: [70, 44], label: 'D' }],
      mates: [{ at: R_POINT, label: 'D' }],
      moves: [
        { type: 'carry', from: [64, 54], to: [56, 62], curve: [66, 64] },
        { type: 'pass', from: [56, 62], to: [37, 60] }
      ]
    }
  },
  {
    id: 'w_pin', name: 'Pin him on the wall', blurb: 'Finish the check, hold him there, let the centre take it.',
    diagram: {
      me: [74, 70], puck: [84, 70],
      opp: [{ at: [84, 70], label: 'D' }],
      mates: [{ at: [68, 58], label: 'C' }],
      moves: [
        { type: 'skate', from: [74, 70], to: [81, 70] },
        { type: 'skate', from: [68, 58], to: [80, 64], curve: [74, 58] }
      ]
    }
  },
  {
    id: 'w_toe_drag', name: 'Toe drag the line', blurb: 'Pull it around his stick at the blue line and step in.',
    diagram: {
      me: [27, 28], puck: [27, 28],
      opp: [{ at: [40, 29], label: 'D' }],
      moves: [
        { type: 'carry', from: [27, 28], to: [52, 36], curve: [40, 44] },
        { type: 'shot', from: [52, 36], to: [88, 40], curve: [70, 32] }
      ]
    }
  },
  {
    id: 'w_low_high', name: 'Low to high', blurb: 'Win it in the corner and put it back to the point.',
    diagram: {
      me: L_CORNER, puck: L_CORNER,
      opp: [{ at: [80, 18], label: 'D' }],
      mates: [{ at: L_POINT, label: 'D' }],
      moves: [{ type: 'pass', from: L_CORNER, to: [37, 19], curve: [60, 6] }]
    }
  }
];

// --- DEFENCE ----------------------------------------------------------------
const DEFENCE = [
  {
    id: 'd_tight_gap', name: 'Close the gap', blurb: 'Meet him at the line and give him nothing to skate into.',
    diagram: {
      me: [52, 39], puck: [30, 39],
      opp: [{ at: [30, 39], label: 'F' }],
      moves: [
        { type: 'skate', from: [50, 39], to: [37, 39] },
        { type: 'carry', from: [30, 39], to: [35, 39] }
      ]
    }
  },
  {
    id: 'd_pinch', name: 'Pinch down the wall', blurb: 'Step up, keep it in, and trust the winger to cover behind you.',
    diagram: {
      me: L_POINT, puck: [52, 8],
      opp: [{ at: [52, 8], label: 'F' }],
      mates: [{ at: [30, 30], label: 'W' }],
      moves: [
        { type: 'skate', from: [35, 17], to: [50, 9], curve: [42, 10] },
        { type: 'skate', from: [30, 30], to: [33, 18] }
      ]
    }
  },
  {
    id: 'd_shot_through', name: 'Shoot through the lane', blurb: 'Find the one lane that is open and get it there low.',
    diagram: {
      me: MID_POINT, puck: MID_POINT,
      opp: [{ at: [50, 30], label: 'F' }, { at: [62, 48], label: 'F' }],
      mates: [{ at: [80, 34], label: 'W' }],
      moves: [{ type: 'shot', from: MID_POINT, to: [88, 42], curve: [62, 40] }]
    }
  },
  {
    id: 'd_walk_line', name: 'Walk the line', blurb: 'Slide along the blue until the shooting lane opens up.',
    diagram: {
      me: [34, 54], puck: [34, 54],
      opp: [{ at: [44, 50], label: 'F' }],
      moves: [
        { type: 'carry', from: [34, 54], to: [34, 26], curve: [30, 40] },
        { type: 'shot', from: [34, 26], to: [88, 38], curve: [62, 26] }
      ]
    }
  },
  {
    id: 'd_stretch', name: 'Stretch pass', blurb: 'Hit the winger flying through the neutral zone.',
    diagram: {
      me: [26, 56], puck: [26, 56],
      opp: [{ at: [34, 46], label: 'F' }],
      mates: [{ at: [52, 13], label: 'W' }],
      moves: [
        { type: 'pass', from: [26, 56], to: [51, 14], curve: [30, 24] },
        { type: 'skate', from: [55, 14], to: [78, 24], curve: [68, 13] }
      ]
    }
  },
  {
    id: 'd_reverse', name: 'Reverse it', blurb: 'Take the hit and bank it back the other way to your partner.',
    diagram: {
      me: [88, 62], puck: [88, 62],
      opp: [{ at: [82, 66], label: 'F' }],
      mates: [{ at: [88, 20], label: 'D' }],
      moves: [{ type: 'pass', from: [88, 62], to: [88, 24], curve: [99, 40] }]
    }
  },
  {
    id: 'd_stand_up', name: 'Stand him up', blurb: 'Step into him at the blue line and end the rush there.',
    diagram: {
      me: [38, 39], puck: [26, 47],
      opp: [{ at: [26, 47], label: 'F' }],
      moves: [
        { type: 'carry', from: [26, 47], to: [34, 42] },
        { type: 'skate', from: [38, 39], to: [35, 40] }
      ]
    }
  },
  {
    id: 'd_block', name: 'Block the lane', blurb: 'Drop into the shooting lane and wear it.',
    diagram: {
      me: [66, 39], puck: [50, 34],
      opp: [{ at: [50, 34], label: 'F' }],
      moves: [
        { type: 'skate', from: [66, 39], to: [57, 36] },
        { type: 'shot', from: [50, 34], to: [88, 40], curve: [68, 34] }
      ]
    }
  },
  {
    id: 'd_activate', name: 'Join the rush', blurb: 'Jump up as the fourth man and arrive late at the far post.',
    diagram: {
      me: [27, 60], puck: [44, 68],
      mates: [{ at: [44, 68], label: 'W' }],
      opp: [{ at: [58, 50], label: 'F' }],
      moves: [
        { type: 'skate', from: [29, 60], to: [78, 48], curve: [52, 74] },
        { type: 'pass', from: [44, 68], to: [77, 49], curve: [62, 68] }
      ]
    }
  },
  {
    id: 'd_box_out', name: 'Clear the front', blurb: 'Move the net-front man so your goaltender can see the puck.',
    diagram: {
      me: [80, 44], puck: [40, 30],
      opp: [{ at: [83, 38], label: 'F' }],
      moves: [
        { type: 'skate', from: [80, 44], to: [84, 46], curve: [83, 45] },
        { type: 'shot', from: [40, 30], to: [88, 36], curve: [64, 28] }
      ]
    }
  },
  {
    id: 'd_poke', name: 'Poke it off him', blurb: 'Time the stick on the puck as he tries to cut inside.',
    diagram: {
      me: [48, 44], puck: [26, 52],
      opp: [{ at: [26, 52], label: 'F' }],
      moves: [
        { type: 'carry', from: [26, 52], to: [44, 46], curve: [34, 46] },
        { type: 'skate', from: [48, 44], to: [41, 46] }
      ]
    }
  },
  {
    id: 'd_fake_slide', name: 'Fake and slide across', blurb: 'Sell the shot, slide to the middle, open the whole net up.',
    diagram: {
      me: [34, 22], puck: [34, 22],
      opp: [{ at: [44, 24], label: 'F' }],
      moves: [
        { type: 'carry', from: [34, 22], to: [40, 39], curve: [34, 32] },
        { type: 'shot', from: [40, 39], to: [88, 40], curve: [64, 42] }
      ]
    }
  }
];

// --- GOALTENDERS -------------------------------------------------------------
// Same sheet, same net. The wavy line is the shot coming at you and the solid
// one is you moving to meet it.
const GOALIE = [
  {
    id: 'g_butterfly', name: 'Butterfly, seal the ice', blurb: 'Down early, knees together, nothing goes underneath.',
    diagram: {
      me: [86, 39], puck: SLOT,
      opp: [{ at: SLOT, label: 'F' }],
      moves: [
        { type: 'shot', from: SLOT, to: [87, 41] }
      ]
    }
  },
  {
    id: 'g_post', name: 'Seal the post', blurb: 'Lean on the post and dare him to go short side.',
    diagram: {
      me: [87, 39], puck: R_CIRCLE_LOW,
      opp: [{ at: R_CIRCLE_LOW, label: 'F' }],
      moves: [
        { type: 'skate', from: [86, 36], to: [88, 46] },
        { type: 'shot', from: R_CIRCLE_LOW, to: [90, 47], curve: [80, 58] }
      ]
    }
  },
  {
    id: 'g_poke', name: 'Poke check him', blurb: 'Come off your line and take the puck off his stick.',
    diagram: {
      me: [86, 39], puck: [66, 39],
      opp: [{ at: [66, 39], label: 'F' }],
      moves: [
        { type: 'carry', from: [66, 39], to: [76, 39] },
        { type: 'skate', from: [86, 39], to: [79, 39] }
      ]
    }
  },
  {
    id: 'g_blocker', name: 'Blocker side, stay big', blurb: 'Square up and give him nothing but your chest.',
    diagram: {
      me: [86, 39], puck: L_DOT,
      opp: [{ at: L_DOT, label: 'F' }],
      moves: [
        { type: 'shot', from: L_DOT, to: [87, 35], curve: [80, 24] }
      ]
    }
  },
  {
    id: 'g_freeze', name: 'Smother it', blurb: 'Take the whistle and give your defence a breath.',
    diagram: {
      me: [86, 39], puck: [78, 48],
      opp: [{ at: [74, 52], label: 'F' }],
      moves: [
        { type: 'shot', from: [74, 52], to: [85, 42] }
      ]
    }
  },
  {
    id: 'g_challenge', name: 'Challenge him', blurb: 'Come out to the top of the crease and shrink the net.',
    diagram: {
      me: [86, 39], puck: HIGH_SLOT,
      opp: [{ at: HIGH_SLOT, label: 'F' }],
      moves: [
        { type: 'skate', from: [87, 46], to: [80, 44] },
        { type: 'shot', from: [62, 34], to: [78, 38] }
      ]
    }
  },
  {
    id: 'g_screen', name: 'Track through the screen', blurb: 'Find the puck around the body in front and hold your depth.',
    diagram: {
      me: [86, 39], puck: MID_POINT,
      opp: [{ at: [79, 39], label: 'F' }],
      mates: [{ at: MID_POINT, label: 'D' }],
      moves: [{ type: 'shot', from: MID_POINT, to: [85, 41], curve: [62, 36] }]
    }
  },
  {
    id: 'g_backdoor', name: 'Push across', blurb: 'Read the pass early and get across before it arrives.',
    diagram: {
      me: [87, 33], puck: L_CORNER,
      opp: [{ at: L_CORNER, label: 'F' }, { at: [84, 50], label: 'F' }],
      moves: [
        { type: 'pass', from: L_CORNER, to: [83, 49], curve: [94, 30] },
        { type: 'skate', from: [87, 32], to: [88, 47] }
      ]
    }
  },
  {
    id: 'g_glove', name: 'Glove it', blurb: 'Sit on the high shot and take it out of the air.',
    diagram: {
      me: [86, 39], puck: R_DOT,
      opp: [{ at: R_DOT, label: 'F' }],
      moves: [
        { type: 'shot', from: R_DOT, to: [88, 43], curve: [80, 54] }
      ]
    }
  },
  {
    id: 'g_play_puck', name: 'Play the puck', blurb: 'Leave the crease, stop the dump-in, start the breakout.',
    diagram: {
      me: [86, 39], puck: [96, 56],
      opp: [{ at: [70, 66], label: 'F' }],
      mates: [{ at: [78, 16], label: 'D' }],
      moves: [
        { type: 'skate', from: [86, 39], to: [94, 52], curve: [92, 44] },
        { type: 'pass', from: [95, 54], to: [79, 19], curve: [94, 28] }
      ]
    }
  },
  {
    id: 'g_stack', name: 'Stack the pads', blurb: 'Nothing else left. Throw everything across the goal line.',
    diagram: {
      me: [86, 39], puck: [88, 56],
      opp: [{ at: [86, 58], label: 'F' }],
      moves: [
        { type: 'skate', from: [85, 37], to: [88, 49] },
        { type: 'shot', from: [88, 58], to: [90, 48] }
      ]
    }
  },
  {
    id: 'g_wrap', name: 'Seal the wrap', blurb: 'He is behind the net. Get the pad to the post and stay there.',
    diagram: {
      me: [87, 39], puck: BEHIND_NET,
      opp: [{ at: [97, 46], label: 'F' }],
      moves: [
        { type: 'carry', from: [97, 50], to: [95, 31], curve: [100, 40] },
        { type: 'skate', from: [86, 42], to: [89, 33] }
      ]
    }
  }
];

// How close the camera sits for each position. A goaltender's plays all happen
// within forty feet of his net, so drawing them on the same wide sheet as a
// blue-line shot wastes most of the card on empty ice.
export const VIEWS = {
  G: '46 2 54 74',
  DEFAULT: '22 0 78 78'
};
export const viewFor = (pos) => VIEWS[pos] || VIEWS.DEFAULT;

export const PLAYBOOKS = {
  C: CENTRE,
  LW: WINGER,
  RW: WINGER,
  LD: DEFENCE,
  RD: DEFENCE,
  G: GOALIE
};

// What the pick is called for this position, so the screen asks the right
// question. A goaltender does not pick a play, he picks how he plays it.
export const PICK_PROMPT = {
  C: 'Pick the play.',
  LW: 'Pick the play.',
  RW: 'Pick the play.',
  LD: 'Pick the read.',
  RD: 'Pick the read.',
  G: 'Pick the save.'
};

export const getPlaybook = (pos) => PLAYBOOKS[pos] || WINGER;
export const findPlay = (pos, id) => getPlaybook(pos).find(p => p.id === id) || null;
