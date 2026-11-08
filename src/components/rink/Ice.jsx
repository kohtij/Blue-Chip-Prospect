// The ice, and everything that gets drawn on it.
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

import {
  ICE, RED, BLUE, BOARD, INK,
  W, H, GOAL_LINE, BLUE_LINE, MID, NET_HALF, CREASE_R, CIRCLE_R,
  DOT_X, TOP_DOT, BOT_DOT, MOUTH, bez, angleAt, wavePath
} from './geometry';


// Hash marks sit outside the circle, two pairs per circle, 3ft long.
function Hashes({ cx = DOT_X, cy, r = CIRCLE_R }) {
  const g = 3.4;
  const len = 2.8;
  return (
    <g stroke={RED} strokeWidth="0.55">
      {[-1, 1].map(vert =>
        [-1, 1].map(horiz => (
          <line
            key={`h-${vert}-${horiz}`}
            x1={cx + horiz * g} y1={cy + vert * (r + 0.3)}
            x2={cx + horiz * g} y2={cy + vert * (r + 0.3 + len)}
          />
        ))
      )}
    </g>
  );
}

// The L-shaped alignment markings beside a faceoff dot.
function DotMarks({ cx = DOT_X, cy }) {
  const o = 2.6;
  const len = 2.2;
  return (
    <g stroke={RED} strokeWidth="0.5" fill="none">
      {[-1, 1].map(v =>
        [-1, 1].map(h => (
          <path
            key={`m-${v}-${h}`}
            d={`M ${cx + h * o} ${cy + v * o + v * len} L ${cx + h * o} ${cy + v * o} L ${cx + h * o + h * len} ${cy + v * o}`}
          />
        ))
      )}
    </g>
  );
}

export function FaceoffCircle({ cx = DOT_X, cy, r = CIRCLE_R }) {
  // Coerced once here so a caller passing an SVG-style string cannot push
  // string concatenation into the marks below.
  cx = Number(cx); cy = Number(cy); r = Number(r);
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={RED} strokeWidth="0.55" />
      <circle cx={cx} cy={cy} r="1.5" fill={RED} />
      <DotMarks cx={cx} cy={cy} />
      <Hashes cx={cx} cy={cy} r={r} />
    </g>
  );
}

export function Net({ x = GOAL_LINE, cy = MID, half = NET_HALF, depth = 4.2 }) {
  return (
    <g>
      <rect x={x} y={cy - half} width={depth} height={half * 2}
            fill="rgba(255,255,255,0.22)" stroke="rgba(245,245,245,0.9)" strokeWidth="1" />
      <line x1={x + depth / 2} y1={cy - half} x2={x + depth / 2} y2={cy + half}
            stroke="rgba(255,255,255,0.45)" strokeWidth="0.4" />
      <line x1={x} y1={cy} x2={x + depth} y2={cy}
            stroke="rgba(255,255,255,0.45)" strokeWidth="0.4" />
      <line x1={x} y1={cy - half} x2={x} y2={cy + half}
            stroke="rgba(240,70,70,1)" strokeWidth="1.4" />
    </g>
  );
}

// The attacking zone with a strip of neutral ice, cropped the way a whiteboard
// diagram is cropped rather than showing a whole rink at postage-stamp size.
export function ZoneSheet() {
  return (
    <g>
      <path
        d={`M 22 0.7 L ${W - 11.5} 0.7 A 11 11 0 0 1 ${W - 0.7} 11.7 L ${W - 0.7} ${H - 11.7}
            A 11 11 0 0 1 ${W - 11.5} ${H - 0.7} L 22 ${H - 0.7} Z`}
        fill={ICE} stroke={BOARD} strokeWidth="1.1"
      />
      <line x1={BLUE_LINE} y1="1.2" x2={BLUE_LINE} y2={H - 1.2} stroke={BLUE} strokeWidth="2.6" />
      <line x1={GOAL_LINE} y1="7" x2={GOAL_LINE} y2={H - 7} stroke={RED} strokeWidth="0.9" />
      <path
        d={`M ${GOAL_LINE} ${MID - CREASE_R} A ${CREASE_R} ${CREASE_R} 0 0 0 ${GOAL_LINE} ${MID + CREASE_R}`}
        fill="rgba(56,120,220,0.18)" stroke={BLUE} strokeWidth="0.6"
      />
      <path
        d={`M ${GOAL_LINE} ${MID - 7} L ${W - 1.5} ${MID - 13} M ${GOAL_LINE} ${MID + 7} L ${W - 1.5} ${MID + 13}`}
        stroke={RED} strokeWidth="0.5" fill="none"
      />
      <Net />
      {[TOP_DOT, BOT_DOT].map(cy => <FaceoffCircle key={cy} cy={cy} />)}
      {[TOP_DOT, BOT_DOT].map(cy => (
        <circle key={`nz-${cy}`} cx={BLUE_LINE - 4.6} cy={cy} r="1.3" fill={RED} />
      ))}
    </g>
  );
}


export function NetMouth({ children }) {
  const { x1, x2, yTop, yBot } = MOUTH;
  return (
    <g>
      {/* the ice behind, and the crease paint running out of the mouth */}
      <rect x="0" y="0" width="100" height="72" fill={ICE} />
      <path d={`M ${x1 - 7} ${yBot} L ${x1 + 2} ${yBot + 13} L ${x2 - 2} ${yBot + 13} L ${x2 + 7} ${yBot} Z`}
            fill="rgba(56,120,220,0.14)" stroke={BLUE} strokeWidth="0.7" />
      <line x1="0" y1={yBot} x2="100" y2={yBot} stroke={RED} strokeWidth="1.2" />

      {/* the mesh, drawn as a grid clipped to the mouth */}
      <defs>
        <clipPath id="mouthClip">
          <rect x={x1} y={yTop} width={x2 - x1} height={yBot - yTop} />
        </clipPath>
        <pattern id="mesh" width="4.2" height="4.2" patternUnits="userSpaceOnUse">
          <path d="M 0 0 L 4.2 4.2 M 4.2 0 L 0 4.2" stroke="rgba(255,255,255,0.13)" strokeWidth="0.45" />
        </pattern>
      </defs>
      <rect x={x1} y={yTop} width={x2 - x1} height={yBot - yTop} fill="rgba(6,10,9,0.72)" />
      <rect x={x1} y={yTop} width={x2 - x1} height={yBot - yTop} fill="url(#mesh)" clipPath="url(#mouthClip)" />

      {children}

      {/* posts and crossbar last, so nothing draws over the frame */}
      <g stroke="#e8453f" strokeWidth="2.4" strokeLinecap="round" fill="none">
        <line x1={x1} y1={yTop} x2={x1} y2={yBot} />
        <line x1={x2} y1={yTop} x2={x2} y2={yBot} />
        <line x1={x1} y1={yTop} x2={x2} y2={yTop} />
      </g>
    </g>
  );
}

// A goalie in the mouth, seen from the shooter.
//
// The old one was five grey rounded rectangles, and the butterfly only widened
// the pads by four units, so the one read the shootout is built on, is he down
// or is he standing, was close to invisible. The whole point is that a goalie
// down in the butterfly seals the ice and gives up the top corners, and a goalie
// standing tall covers high and leaves the five hole, so the two shapes now
// differ the way they do in life: the pads swing out flat along the ice and the
// five hole shuts, or they stand upright with daylight between them.
//
// `shift` moves him off centre, -1 to 1. His glove is stage left, his blocker
// stage right, and they are drawn differently so you can tell which side he has
// pushed to.
export function Goalie({ shift = 0, down = false, beaten = false }) {
  const cx = 50 + shift * 17;
  const body = beaten ? 'rgba(120,130,145,0.5)' : 'rgba(203,213,225,0.92)';
  const trim = beaten ? 'rgba(120,130,145,0.6)' : 'rgba(241,245,249,0.96)';
  const dark = beaten ? 'rgba(80,88,100,0.5)' : 'rgba(30,41,59,0.85)';
  const ice = MOUTH.yBot;

  // Everything hangs off the hips, which is the only part of him that does not
  // move much between the two stances.
  const hipY = down ? 41 : 36;
  const chestY = down ? 31 : 22;
  const headY = down ? 26.5 : 17.5;

  return (
    <g style={{ transition: 'transform 110ms linear' }}>
      {/* Leg pads. Standing they are upright with the five hole between them;
          in the butterfly they lie out along the ice, flared slightly up at the
          toe the way a real pad sits. */}
      {/* Each pad is drawn once, on the right, and the left one is the same
          shape mirrored through the hips. Rotating a single shape for both
          sides sent them the same way and folded the butterfly into one slab
          pointing at the corner. */}
      {[-1, 1].map(side => (
        <g key={side} transform={`translate(${cx} ${hipY}) scale(${side} 1)`}>
          <g transform={`rotate(${down ? -5 : 2})`}>
            <rect
              x={1.5} y={down ? 5.5 : 0}
              width={down ? 21 : 7.9} height={down ? 9.2 : 18}
              rx="2" fill={body} stroke={dark} strokeWidth="0.5"
            />
            {/* the knee stack, so a pad reads as a pad and not a slab */}
            {(down ? [8, 15] : [6, 12]).map(k => (
              <line
                key={k}
                x1={down ? k : 1.5} y1={down ? 5.5 : k}
                x2={down ? k : 9.4} y2={down ? 14.7 : k}
                stroke={dark} strokeWidth="0.5"
              />
            ))}
          </g>
        </g>
      ))}

      {/* Chest and arm protector, narrowing to the shoulders. */}
      <path
        d={`M ${cx - 8.2} ${chestY + 13} L ${cx - 7.4} ${chestY + 2.2}
            Q ${cx - 7} ${chestY} ${cx - 4.8} ${chestY}
            L ${cx + 4.8} ${chestY} Q ${cx + 7} ${chestY} ${cx + 7.4} ${chestY + 2.2}
            L ${cx + 8.2} ${chestY + 13} Z`}
        fill={body} stroke={dark} strokeWidth="0.5"
      />

      {/* Mask, with a cage. */}
      <circle cx={cx} cy={headY} r="4.6" fill={trim} stroke={dark} strokeWidth="0.5" />
      <path d={`M ${cx - 3.4} ${headY + 0.6} L ${cx + 3.4} ${headY + 0.6}
                M ${cx - 3.9} ${headY + 2.2} L ${cx + 3.9} ${headY + 2.2}
                M ${cx} ${headY - 3.4} L ${cx} ${headY + 3.9}`}
            stroke={dark} strokeWidth="0.45" fill="none" />

      {/* Catching glove, stage left: a mitt with a cuff, held up and open. */}
      <g transform={`translate(${cx - 11.4} ${chestY + (down ? 5.5 : 4)})`}>
        <path d="M -3.6 -3.4 Q -4.6 0.4 -2.6 3.2 L 2.6 3.2 Q 4 0 2.4 -3.4 Z"
              fill={trim} stroke={dark} strokeWidth="0.5" />
        <rect x="-2.6" y="3.2" width="5.2" height="2.6" rx="0.8" fill={body} stroke={dark} strokeWidth="0.4" />
      </g>

      {/* Blocker, stage right: a flat rectangular paddle. */}
      <g transform={`translate(${cx + 11.4} ${chestY + (down ? 6 : 4.6)})`}>
        <rect x="-3.4" y="-3.6" width="6.8" height="7.6" rx="0.8"
              fill={trim} stroke={dark} strokeWidth="0.5" />
        <line x1="-3.4" y1="0.2" x2="3.4" y2="0.2" stroke={dark} strokeWidth="0.4" />
      </g>

      {/* The stick: paddle down off the blocker hand, blade flat on the ice and
          covering the five hole when he is down. */}
      <path d={`M ${cx + 10.4} ${chestY + (down ? 8 : 7)} L ${cx + 7.6} ${ice - 1.2}
                L ${cx - (down ? 9 : 5)} ${ice - 1.2}`}
            stroke={trim} strokeWidth="1.3" fill="none"
            strokeLinejoin="round" strokeLinecap="round" />
    </g>
  );
}

// --- the slot, from the net ------------------------------------------------
//
// The view a defenceman blocking a shot has, and the one the net-front games
// use: the goal behind you, three shooting lanes running out to the point.

export function SlotSheet({ lanes = 3 }) {
  const laneW = 100 / lanes;
  return (
    <g>
      <rect x="0" y="0" width="100" height="80" fill={ICE} />
      {/* the goal line and crease at the bottom, the blue line at the top.
          The crease used to be a sixteen-unit arc against a net barely wider
          than it, which is not the proportion of a rink: the paint is eight
          feet across and the goal six, so it reads as a shallow apron in front
          of the mouth rather than a dome the players stand on top of. */}
      <line x1="0" y1="72" x2="100" y2="72" stroke={RED} strokeWidth="1.1" />
      <path d="M 39 72 A 11 11 0 0 1 61 72" fill="rgba(56,120,220,0.16)" stroke={BLUE} strokeWidth="0.7" />
      <line x1="0" y1="8" x2="100" y2="8" stroke={BLUE} strokeWidth="2.4" />
      {/* lane seams, faint, so the three channels read without becoming columns */}
      {Array.from({ length: lanes - 1 }, (_, i) => (
        <line key={i} x1={laneW * (i + 1)} y1="9" x2={laneW * (i + 1)} y2="71"
              stroke="rgba(255,255,255,0.055)" strokeWidth="0.6" strokeDasharray="2 3" />
      ))}
      {/* The net, from above, drawn the way the Net component draws one rather
          than as a filled grey slab sitting under the goal line looking like a
          shelf. Posts on the line, the bag behind it, mesh across it. */}
      <g>
        <rect x="42.5" y="72" width="15" height="5.6" rx="1.1"
              fill="rgba(255,255,255,0.16)" stroke="rgba(245,245,245,0.85)" strokeWidth="0.75" />
        <line x1="42.5" y1="74.9" x2="57.5" y2="74.9" stroke="rgba(255,255,255,0.4)" strokeWidth="0.35" />
        <line x1="50" y1="72" x2="50" y2="77.6" stroke="rgba(255,255,255,0.4)" strokeWidth="0.35" />
        <line x1="42.5" y1="72" x2="57.5" y2="72" stroke="#e8453f" strokeWidth="1.5" />
        <circle cx="42.5" cy="72" r="0.95" fill="#e8453f" />
        <circle cx="57.5" cy="72" r="0.95" fill="#e8453f" />
      </g>
      {/* faceoff dots either side, for scale, ringed the way a dot is painted */}
      {[14, 86].map(x => (
        <g key={x}>
          <circle cx={x} cy="40" r="2.6" fill="none" stroke={RED} strokeWidth="0.6" />
          <circle cx={x} cy="40" r="1.15" fill={RED} />
        </g>
      ))}
    </g>
  );
}

// --- a faceoff dot, close ---------------------------------------------------

export function DotSheet() {
  return (
    <g>
      <rect x="0" y="0" width="100" height="100" fill={ICE} />
      <line x1="50" y1="0" x2="50" y2="100" stroke={RED} strokeWidth="2.2" />
      {/* Numbers, not strings: these are added to offsets downstream, and a
          string turned "50" + -2.6 into "50-2.6", which silently broke every
          hash mark and alignment L on the dot. */}
      <FaceoffCircle cx={50} cy={50} r={38} />
    </g>
  );
}

// --- things that stand on the ice ------------------------------------------

export function Marker({ at, label, kind = 'me', tone = '#22E748', r = 4.1, dim }) {
  r = Number(r);
  const fill = kind === 'opp' ? 'rgba(200,44,44,0.9)'
    : kind === 'mate' ? 'rgba(56,120,220,0.9)'
      : (dim ? '#8ea0b5' : tone);
  return (
    <g>
      <circle cx={at[0]} cy={at[1]} r={r} fill={fill} stroke="rgba(0,0,0,0.55)" strokeWidth="0.6" />
      {label && (
        <text
          x={at[0]} y={at[1] + r * 0.36}
          textAnchor="middle"
          /* A label has to fit inside the circle, and "YOU" at the size a single
             letter wants ran out past both edges. The type steps down with the
             number of characters instead. */
          fontSize={r * (label.length > 2 ? 0.74 : label.length > 1 ? 0.95 : 1.12)}
          fontWeight="900"
          fill={kind === 'me' ? '#07120b' : '#fff'}
          style={{ fontFamily: 'inherit', letterSpacing: '-0.3px' }}
        >
          {label}
        </text>
      )}
    </g>
  );
}

export function Puck({ at, r = 1.8, glow }) {
  r = Number(r);
  return (
    <g>
      {glow && <circle cx={at[0]} cy={at[1]} r={r * 2.6} fill="rgba(255,255,255,0.14)" />}
      <circle cx={at[0]} cy={at[1]} r={r} fill="#fff" stroke="rgba(0,0,0,0.6)" strokeWidth={r * 0.28} />
    </g>
  );
}

// --- the notation ----------------------------------------------------------

export function Move({ move, tone, stops = [], scale = 1 }) {
  const { type, from, curve } = move;
  const ink = tone === 'dim' ? '#8ea0b5' : (move.ink || INK[type] || INK.skate);
  // An arrow aimed at a player should land on him, not under him.
  const near = stops.find(s => Math.hypot(s[0] - move.to[0], s[1] - move.to[1]) < 5.5 * scale);
  let to = move.to;
  if (near) {
    const [bx, by] = bez(from, move.to, curve, 0.86);
    const dx = move.to[0] - bx, dy = move.to[1] - by;
    const len = Math.hypot(dx, dy) || 1;
    to = [move.to[0] - (dx / len) * 5.2 * scale, move.to[1] - (dy / len) * 5.2 * scale];
  }
  const c = curve || [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2];
  const path = `M ${from[0]} ${from[1]} Q ${c[0]} ${c[1]} ${to[0]} ${to[1]}`;
  const head = angleAt(from, to, curve);

  return (
    <g>
      {type === 'shot' ? (
        <path d={wavePath(from, to, curve, 1.5 * scale)} fill="none" stroke={ink}
              strokeWidth={1.6 * scale} strokeLinecap="round" />
      ) : (
        <path
          d={path} fill="none" stroke={ink}
          strokeWidth={(type === 'carry' ? 2 : 1.6) * scale}
          strokeLinecap="round"
          strokeDasharray={type === 'pass' ? `${3.5 * scale} ${2.6 * scale}` : undefined}
        />
      )}

      {/* The cross ticks that mark a player carrying the puck. */}
      {type === 'carry' && [0.34, 0.66].map(t => {
        const [cx, cy] = bez(from, to, curve, t);
        const a = angleAt(from, to, curve, t) + 90;
        const k = 2.2 * scale;
        return (
          <line
            key={t}
            x1={cx - Math.cos(a * Math.PI / 180) * k} y1={cy - Math.sin(a * Math.PI / 180) * k}
            x2={cx + Math.cos(a * Math.PI / 180) * k} y2={cy + Math.sin(a * Math.PI / 180) * k}
            stroke={ink} strokeWidth={1.3 * scale} strokeLinecap="round"
          />
        );
      })}

      <polygon points={`0,${-2.2 * scale} ${5 * scale},0 0,${2.2 * scale}`} fill={ink}
               transform={`translate(${to[0]} ${to[1]}) rotate(${head})`} />
    </g>
  );
}

// The frame every surface sits in, so a game is one element and not a div stack.
export function Surface({ view, children, className = '' }) {
  return (
    <svg viewBox={view} className={`w-full h-auto block ${className}`} preserveAspectRatio="xMidYMid meet">
      {children}
    </svg>
  );
}

// --- the whole sheet, from above -------------------------------------------
//
// Only the fastest-skater event needs this: a lap is a lap of the actual rink,
// not a progress bar. Centre ice, both blue lines, five circles, two nets.
export function FullSheet() {
  const r = 14;
  return (
    <g>
      <path
        d={`M ${r} 1 L ${200 - r} 1 A ${r} ${r} 0 0 1 199 ${1 + r}
            L 199 ${99 - r} A ${r} ${r} 0 0 1 ${200 - r} 99
            L ${r} 99 A ${r} ${r} 0 0 1 1 ${99 - r}
            L 1 ${1 + r} A ${r} ${r} 0 0 1 ${r} 1 Z`}
        fill={ICE} stroke={BOARD} strokeWidth="1.4"
      />
      {/* centre red, both blues, both goal lines */}
      <line x1="100" y1="1" x2="100" y2="99" stroke={RED} strokeWidth="1.8" />
      <line x1="72" y1="1" x2="72" y2="99" stroke={BLUE} strokeWidth="2.2" />
      <line x1="128" y1="1" x2="128" y2="99" stroke={BLUE} strokeWidth="2.2" />
      <line x1="12" y1="9" x2="12" y2="91" stroke={RED} strokeWidth="0.8" />
      <line x1="188" y1="9" x2="188" y2="91" stroke={RED} strokeWidth="0.8" />

      {/* centre circle and dot */}
      <circle cx="100" cy="50" r="15" fill="none" stroke={BLUE} strokeWidth="0.7" />
      <circle cx="100" cy="50" r="1.4" fill={BLUE} />

      {/* the four end circles */}
      {[[31, 26], [31, 74], [169, 26], [169, 74]].map(([cx, cy]) => (
        <g key={`${cx}-${cy}`}>
          <circle cx={cx} cy={cy} r="15" fill="none" stroke={RED} strokeWidth="0.7" />
          <circle cx={cx} cy={cy} r="1.4" fill={RED} />
        </g>
      ))}

      {/* neutral-zone dots */}
      {[[80, 26], [80, 74], [120, 26], [120, 74]].map(([cx, cy]) => (
        <circle key={`n${cx}-${cy}`} cx={cx} cy={cy} r="1.2" fill={RED} />
      ))}

      {/* creases and nets at both ends */}
      <path d="M 12 44 A 6 6 0 0 0 12 56" fill="rgba(56,120,220,0.18)" stroke={BLUE} strokeWidth="0.5" />
      <path d="M 188 44 A 6 6 0 0 1 188 56" fill="rgba(56,120,220,0.18)" stroke={BLUE} strokeWidth="0.5" />
      <rect x="8" y="47" width="4" height="6" fill="rgba(255,255,255,0.2)" stroke="rgba(245,245,245,0.85)" strokeWidth="0.7" />
      <rect x="188" y="47" width="4" height="6" fill="rgba(255,255,255,0.2)" stroke="rgba(245,245,245,0.85)" strokeWidth="0.7" />
    </g>
  );
}
