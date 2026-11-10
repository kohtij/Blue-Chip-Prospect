// The rink, as numbers: the palette, the dimensions and the maths.
//
// This used to live inside PlayCard, where the international play cards are
// drawn. The minigames each invented their own surface instead: the faceoff was
// a pale blue dinner plate, the shootout a dotted grey field with an emoji net
// on it, the crease a three-by-three whack-a-mole grid, and the three lane games
// were bare grey columns with buttons underneath. Nothing looked like hockey and
// no two of them looked like each other.
//
// So the geometry is one module now, and a game asks for the view it needs. Every
// surface is built off the real dimensions at a single scale, which is what makes
// it read as a rink rather than a pitch with a box painted on it, and every game
// inherits the same ice colour, the same line weights and the same notation.
//
// The notation is the standard drill-book key, unchanged from the play cards:
//
//   skate   solid line                    a player moving without the puck
//   carry   solid line with cross ticks   a player moving with the puck
//   pass    dashed line                   the puck leaving a stick
//   shot    wavy line                     the puck going at the net
//
// Players are circles, the opposition is red, and the puck is a small white disc.

// --- the palette ----------------------------------------------------------
export const ICE = '#0c1512';
export const RED = 'rgba(214,52,52,0.55)';
export const BLUE = 'rgba(56,120,220,0.55)';
export const BOARD = 'rgba(255,255,255,0.14)';

// A diagram is unreadable if skating, passing and shooting are all one colour.
export const INK = {
  skate: '#4ade80',
  carry: '#22E748',
  pass: '#60a5fa',
  shot: '#fbbf24'
};

// --- zone geometry, all from one scale: 0.917 units per foot ---------------
export const W = 100;
export const H = 78;
export const ZONE_VIEW = '22 0 78 78';

export const GOAL_LINE = 90;
export const BLUE_LINE = 31;
export const MID = H / 2;
export const NET_HALF = 2.75;     // 6ft net
export const CREASE_R = 5.5;      // 6ft crease
export const CIRCLE_R = 13.75;    // 15ft faceoff circle
export const DOT_X = 71.7;        // 20ft out from the goal line
const DOT_OFF = 20.2;             // 22ft off centre
export const TOP_DOT = MID - DOT_OFF;
export const BOT_DOT = MID + DOT_OFF;

// --- the net, head on ------------------------------------------------------
// What a shooter sees: six feet by four. Everything that shoots at a net in
// these games is drawn against this, so the shootout, the rapid-fire crease and
// the screened shot share one goal mouth instead of three.
export const MOUTH_VIEW = '0 0 100 72';
export const MOUTH = { x1: 15, x2: 85, yTop: 12, yBot: 55 };

// Where a puck can go. Named the way a goalie names them.
export const MOUTH_ZONES = [
  { id: 0, label: 'TOP GLOVE', x: 25.5, y: 21 },
  { id: 1, label: 'TOP BLOCKER', x: 74.5, y: 21 },
  { id: 2, label: 'FIVE HOLE', x: 50, y: 47 },
  { id: 3, label: 'LOW GLOVE', x: 24, y: 45 },
  { id: 4, label: 'LOW BLOCKER', x: 76, y: 45 }
];

// --- the slot, from the net ------------------------------------------------
// The view a defenceman blocking a shot has: the goal behind you, three
// shooting lanes running out to the point.
export const SLOT_VIEW = '0 0 100 80';

// EVERY NUMBER THE SLOT SHEET IS DRAWN FROM, IN ONE PLACE.
//
// The sheet wrote its net out as 42.5 and 57.5 and its goal line as 72 inside
// Ice.jsx, and the five games played on it placed their markers at 14, 30, 38,
// 54, 66 and 69 from memory in five other files. Nothing anywhere was in a
// position to notice when two of those numbers landed on top of each other, so
// the point man was drawn across the lane seams and the blue line, a winger
// stood on a faceoff dot, a loose puck was drawn over the top of the player
// holding it, and a lean arrow finished inside the mesh.
//
// The rows below are the only places a player stands. The top row clears the
// blue line, the bottom row clears the net, and the faceoff dots sit in the
// one band between rows rather than under whatever a game draws in the slot.
//
// Two pairs are alternates rather than neighbours and their bands do overlap,
// because no single game draws on both: pointRow is the point man in the games
// shot from the point, openRow is a mate stepping up in the games played out
// of your own end; slotRow is the slot and screenRow is the net front.
export const SLOT = {
  blueLine: 8,
  goalLine: 72,
  depth: 80,

  // The net on the goal line, and the paint in front of it.
  netHalf: 7.5,
  netDepth: 5.6,
  creaseHalf: 11,

  // The three lanes, as centre lines.
  lanes: [17, 50, 83],

  // The faceoff dots, moved into the one horizontal band no player row
  // occupies. At y 40 they sat directly under whatever a game drew in the
  // slot.
  dot: { x: [13, 87], y: 37 },

  // The rows, top of the zone down to the goal mouth.
  openRow: 22,     // a winger who has just come open, highest a mate stands
  pointRow: 16.5,  // the point man, winding up
  highRow: 28,     // a forechecker, or a covered winger
  slotRow: 52,     // the slot itself
  screenRow: 66,   // the net front, as close as anyone stands to the mouth

  // The largest marker and puck these games draw. Every clearance above is
  // measured against them.
  markerR: 5.4,
  puckR: 2.4
};

// The lane seams, midway between lane centres, so a seam stays between two
// lanes however the lanes themselves move.
export const SLOT_SEAMS = SLOT.lanes.slice(1).map((x, i) => (x + SLOT.lanes[i]) / 2);

// Where a shot aimed at the net finishes: on the goal line, not in the mesh
// behind it.
export const SLOT_MOUTH = [50, SLOT.goalLine - 1.5];

// Where a puck sits on the stick of a player standing on `row`, clear of his
// own marker rather than drawn over the top of it.
export const puckBeside = (x, row, markerR = SLOT.markerR) =>
  [x + markerR + SLOT.puckR + 0.9, row + 1];

// --- a faceoff dot, close --------------------------------------------------
export const DOT_VIEW = '0 0 100 100';

// --- the maths behind the notation -----------------------------------------
export const bez = (from, to, curve, t) => {
  const c = curve || [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2];
  const u = 1 - t;
  return [
    u * u * from[0] + 2 * u * t * c[0] + t * t * to[0],
    u * u * from[1] + 2 * u * t * c[1] + t * t * to[1]
  ];
};

export const angleAt = (from, to, curve, t = 0.98) => {
  const [x1, y1] = bez(from, to, curve, t - 0.03);
  const [x2, y2] = bez(from, to, curve, t);
  return Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
};

// --- the racing line, for one lap of the sheet ------------------------------
// The fastest skater is timed over a single lap, so the route has to be a route:
// a rounded circuit inside the boards, not a bar filling up. The perimeter is
// walked analytically rather than measured off the DOM, which keeps the marker
// and the trail in step at any size and keeps the maths out of the render.
//
// Start and finish sit at centre ice on the near straight, and the lap runs
// counter-clockwise from there: along the near boards, around the right end,
// back along the far boards, around the left end, home.
const LAP_X0 = 20, LAP_X1 = 180, LAP_Y0 = 18, LAP_Y1 = 82, LAP_R = 26;
export const LAP_START_X = 100;

// Each leg carries its length, so one pass over the list finds any point.
const LEGS = [
  { kind: 'line', from: [LAP_START_X, LAP_Y1], to: [LAP_X1 - LAP_R, LAP_Y1] },
  { kind: 'arc', c: [LAP_X1 - LAP_R, LAP_Y1 - LAP_R], a0: 90, a1: 0 },
  { kind: 'line', from: [LAP_X1, LAP_Y1 - LAP_R], to: [LAP_X1, LAP_Y0 + LAP_R] },
  { kind: 'arc', c: [LAP_X1 - LAP_R, LAP_Y0 + LAP_R], a0: 0, a1: -90 },
  { kind: 'line', from: [LAP_X1 - LAP_R, LAP_Y0], to: [LAP_X0 + LAP_R, LAP_Y0] },
  { kind: 'arc', c: [LAP_X0 + LAP_R, LAP_Y0 + LAP_R], a0: -90, a1: -180 },
  { kind: 'line', from: [LAP_X0, LAP_Y0 + LAP_R], to: [LAP_X0, LAP_Y1 - LAP_R] },
  { kind: 'arc', c: [LAP_X0 + LAP_R, LAP_Y1 - LAP_R], a0: 180, a1: 90 },
  { kind: 'line', from: [LAP_X0 + LAP_R, LAP_Y1], to: [LAP_START_X, LAP_Y1] }
].map(leg => ({
  ...leg,
  len: leg.kind === 'line'
    ? Math.hypot(leg.to[0] - leg.from[0], leg.to[1] - leg.from[1])
    : Math.abs(leg.a1 - leg.a0) * (Math.PI / 180) * LAP_R
}));

export const LAP_LEN = LEGS.reduce((n, leg) => n + leg.len, 0);

const onArc = (leg, t) => {
  const a = (leg.a0 + (leg.a1 - leg.a0) * t) * (Math.PI / 180);
  return [leg.c[0] + Math.cos(a) * LAP_R, leg.c[1] + Math.sin(a) * LAP_R];
};

// Where the skater is, 0 at the start line and 1 back at it.
export function lapPoint(frac) {
  let left = Math.max(0, Math.min(1, frac)) * LAP_LEN;
  for (const leg of LEGS) {
    if (left > leg.len) { left -= leg.len; continue; }
    const t = leg.len ? left / leg.len : 0;
    return leg.kind === 'line'
      ? [leg.from[0] + (leg.to[0] - leg.from[0]) * t, leg.from[1] + (leg.to[1] - leg.from[1]) * t]
      : onArc(leg, t);
  }
  return [LAP_START_X, LAP_Y1];
}

// The same circuit as one path, for the route under the skater and the trail
// drawn over it with a dash offset.
export const LAP_D = LEGS.map((leg, i) => {
  const head = i === 0 ? `M ${leg.from[0]} ${leg.from[1]} ` : '';
  if (leg.kind === 'line') return `${head}L ${leg.to[0]} ${leg.to[1]} `;
  const [x, y] = onArc(leg, 1);
  // y runs down, so a falling angle is drawn with the sweep flag clear.
  return `${head}A ${LAP_R} ${LAP_R} 0 0 ${leg.a1 > leg.a0 ? 1 : 0} ${x.toFixed(2)} ${y.toFixed(2)} `;
}).join('');

// A shot is drawn as a wave along the path, which is how every drill book marks
// one: you can tell a shot from a pass without reading a legend.
export function wavePath(from, to, curve, amp = 1.5, cycles = 7) {
  const steps = 26;
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const [x, y] = bez(from, to, curve, t);
    const [px, py] = bez(from, to, curve, Math.min(1, t + 0.02));
    const dx = px - x, dy = py - y;
    const len = Math.hypot(dx, dy) || 1;
    const off = Math.sin(t * Math.PI * cycles) * amp * (t > 0.9 ? (1 - t) * 10 : 1);
    d += `${i === 0 ? 'M' : 'L'} ${(x + (-dy / len) * off).toFixed(2)} ${(y + (dx / len) * off).toFixed(2)} `;
  }
  return d;
}
