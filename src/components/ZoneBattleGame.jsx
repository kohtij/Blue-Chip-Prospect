import { useCallback, useEffect, useRef, useState } from 'react';
import { lerpDifficulty } from '../utils/stakes';
import { getActiveStat } from '../utils/gameHelpers';
import { SlotSheet, Marker, Puck, Surface } from './rink/Ice';
import { SLOT, SLOT_VIEW } from './rink/geometry';
import { Stage, Hud, Clock, Verdict } from './minigame/Shell';

// The net-front battle.
//
// This one was a bar, a box, two emoji arrows and a blue circle with YOU
// written in it. The mechanic is a good one and it survives: the puck is being
// worked around above the crease, and holding the piece of ice underneath it
// while a defenceman tries to move you is most of what a net-front forward does
// for a living.
//
// Drawn properly: the goal mouth below, the puck moving along the top of the
// paint, me boxing out, and a defenceman leaning on me the whole time. Hold the
// lane under the puck and the tip comes; get shoved off it and you lose the
// position.

const RUN_MS = 10000;
const REACH = 12;   // how wide the piece of ice under me counts as mine

// How far I can slide before somebody gets drawn off the sheet.
//
// The pair was drawn as a group offset by (me - 50), with the defenceman out
// at x 60 and me at 49, so the group reaches 14.8 to the right of wherever I
// am. The clamp was a hand-written 12 and 88, and at 88 the defenceman's
// marker was drawn from 93.2 to 102.8: two and a half units of him were off
// the right-hand edge, clipped, every time I was pushed to the wall.
// Measured from the widest thing in the group rather than from my own marker:
// the lean arrow reaches further left than I do, so a clamp set by the marker
// alone still pushed the arrow head off the left-hand edge at the wall.
const GROUP_RIGHT = (60 + 4.8) - 50;    // the defenceman's outside shoulder
const GROUP_LEFT = 50 - (44 - 2.5);     // the lean arrow's far end
const ME_MIN = Math.ceil(GROUP_LEFT);
const ME_MAX = Math.floor(100 - GROUP_RIGHT);

export default function ZoneBattleGame({ player, onComplete, difficulty = 0 }) {
  const physicality = getActiveStat(player, 'physicality');
  const gain = (1.0 + (physicality - 50) * 0.015) * lerpDifficulty(1.0, 0.86, difficulty);

  const [status, setStatus] = useState('live');
  const [puck, setPuck] = useState(50);
  const [me, setMe] = useState(50);
  const [hold, setHold] = useState(0);
  const [msLeft, setMsLeft] = useState(RUN_MS);
  const [lean, setLean] = useState(1);

  // Every shift is its own shift.
  //
  // The puck used to be two fixed sine waves read off the wall clock, so it
  // swung back and forth across the top of the paint on the same 2.2 second
  // arc in every game you ever played. Once you had seen it once you were not
  // tracking a puck any more, you were following a metronome, and the
  // defenceman behind you never actually did anything.
  //
  // Now the puck is moved by people: somebody carries it to a spot, somebody
  // holds it, somebody snaps it D-to-D across the top, and how fast and how
  // often is rolled fresh at the start of each attempt.
  const [shiftPlan] = useState(() => ({
    speed: 27 + Math.random() * 19,              // units a second at the ordinary pace
    snapChance: 0.16 + Math.random() * 0.20,     // how often it goes hard across the top
    holdChance: 0.28 + Math.random() * 0.22,     // how often somebody just holds it
    dwellMin: 140 + Math.random() * 160,
    dwellMax: 420 + Math.random() * 420,
    lean: 3.0 + Math.random() * 3.4             // how hard the defenceman pushes
  }));

  // On the balance of all this: the first version was a fixed sine wave you
  // could learn in one attempt, and replacing it with people moving the puck
  // overshot. Modelled against a player with ordinary reactions, tapping no
  // faster than three times a second and needing about a third of a second to
  // register a change of direction, a 45 physicality forward was winning 33
  // per cent of ordinary shifts and 18 per cent of the hard ones, which is not
  // a battle, it is a formality in the other direction. The defenceman leans
  // slightly less hard, the D-to-D snap is slower, losing the lane costs less,
  // and the stakes scaling is gentler. Same shift, same unpredictability,
  // winnable.
  //
  // That retune moved the motion and the lean but left the bar's economics
  // where they were, and overshot: see the note on the hold rate below, where
  // the arithmetic turned out to be asking for more of the shift than a person
  // can physically hold.

  const doneRef = useRef(false);
  const startRef = useRef(null);
  const puckRef = useRef(50);
  const targetRef = useRef(50);
  const speedRef = useRef(30);
  const dwellRef = useRef(0);
  const meRef = useRef(50);
  const holdRef = useRef(0);
  const leanRef = useRef(1);
  const leanFlipRef = useRef(0);

  const finish = useCallback((win, delay = 1600) => {
    if (doneRef.current) return;
    doneRef.current = true;
    setStatus(win ? 'won' : 'lost');
    setTimeout(() => onComplete(win), delay);
  }, [onComplete]);

  useEffect(() => {
    if (status !== 'live') return;
    if (startRef.current === null) startRef.current = Date.now();

    const dt = 0.05;

    // Where the puck goes next, and how fast it gets there.
    const pickTarget = (now) => {
      const p = puckRef.current;
      const snap = Math.random() < shiftPlan.snapChance;
      targetRef.current = snap
        // hard across the top, the way a D-to-D goes
        ? (p < 50 ? 66 + Math.random() * 20 : 14 + Math.random() * 20)
        : Math.max(14, Math.min(86, p + (Math.random() * 2 - 1) * 36));
      speedRef.current = snap
        ? shiftPlan.speed * 2.5
        : shiftPlan.speed * (0.65 + Math.random() * 0.85);
      // and sometimes nobody moves it at all for a beat
      if (Math.random() < shiftPlan.holdChance) {
        dwellRef.current = now + shiftPlan.dwellMin
          + Math.random() * (shiftPlan.dwellMax - shiftPlan.dwellMin);
      }
    };

    const tick = setInterval(() => {
      const now = Date.now();
      const left = RUN_MS - (now - startRef.current);
      setMsLeft(left);
      if (left <= 0) { finish(false); return; }

      if (now >= dwellRef.current) {
        const gap = targetRef.current - puckRef.current;
        if (Math.abs(gap) < 1.2) pickTarget(now);
        else puckRef.current += Math.sign(gap) * Math.min(Math.abs(gap), speedRef.current * dt);
      }
      setPuck(puckRef.current);

      // The defenceman leans on you, and changes which way he leans, so holding
      // the spot is work rather than a position you set once and leave.
      if (now >= leanFlipRef.current) {
        leanRef.current = Math.random() < 0.5 ? -1 : 1;
        setLean(leanRef.current);
        leanFlipRef.current = now + 800 + Math.random() * 1700;
      }
      meRef.current = Math.max(ME_MIN, Math.min(ME_MAX,
        meRef.current + leanRef.current * shiftPlan.lean * dt));
      setMe(meRef.current);

      const inLane = Math.abs(puckRef.current - meRef.current) <= REACH;
      // Retuned along with the motion. A puck you could predict was worth a
      // generous gain and a slow bleed; a puck being moved by people is not, and
      // the old numbers left an average player winning better than nine in ten.
      // THE BAR ASKED FOR MORE OF THE SHIFT THAN A PERSON CAN GIVE.
      //
      // At 1.05 a tick in and 0.84 a tick out, filling this bar meant being
      // under the puck for about 71 per cent of the shift. Simulated against a
      // player with ordinary reactions, seeing the puck 300ms late and tapping
      // three times a second, the best anyone managed was 56 per cent, and it
      // barely moved with his rating: 55 per cent at 45 physicality, 59 at 90.
      // So the shift was decided by how fast the person holding the phone
      // reacts and almost not at all by the player he had built, and a 45
      // physicality forward won one in ten. At 1.35 the bar asks for about 58
      // per cent, which is inside what the mechanic actually allows, and the
      // rating does the deciding again.
      holdRef.current = inLane
        ? holdRef.current + 1.35 * gain
        : Math.max(0, holdRef.current - 0.84);
      if (holdRef.current >= 100) { holdRef.current = 100; setHold(100); finish(true); return; }
      setHold(holdRef.current);
    }, 50);

    return () => clearInterval(tick);
  }, [status, gain, finish, shiftPlan]);

  const shove = (dir) => {
    meRef.current = Math.max(ME_MIN, Math.min(ME_MAX, meRef.current + dir * 15));
    setMe(meRef.current);
  };
  const inLane = Math.abs(puck - me) <= REACH;

  return (
    <Stage
      hud={
        <Hud
          left={
            /* This bar said Position, which is what a player reads as where he
               is standing. It is not: it is how close the tip is, it only
               climbs while you are under the puck, and filling it is how the
               shift is won. So it says that. */
            <div className="flex items-center gap-2 min-w-[150px]">
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                Tip
              </span>
              <span className="relative h-1.5 w-20 rounded-full bg-[rgba(255,255,255,0.08)] overflow-hidden">
                <span
                  className={`absolute inset-y-0 left-0 rounded-full ${inLane ? 'bg-[#22E748]' : 'bg-[#F59E0B]'}`}
                  style={{ width: `${hold}%`, transition: 'width 60ms linear' }}
                />
              </span>
              <span className={`text-[9px] sm:text-[10px] font-black number-font tabular-nums ${inLane ? 'text-[#22E748]' : 'text-slate-500'}`}>
                {Math.round(hold)}%
              </span>
            </div>
          }
          right={status === 'live' ? <Clock msLeft={msLeft} msTotal={RUN_MS} /> : null}
        />
      }
      verdict={
        <Verdict
          show={status !== 'live'}
          won={status === 'won'}
          word={status === 'won' ? 'TIPPED IT HOME' : 'SHOVED OFF IT'}
          detail={status === 'won'
            ? 'held the paint long enough to get a stick on it'
            : 'he moved you off the spot and the puck went through where you were standing'}
        />
      }
      caption={
        status !== 'live' ? null
          : inLane
            ? 'Under it. Hold here and the bar fills.'
            : 'Off the spot. Work back under the puck or the bar drains.'
      }
    >
      <Surface view={SLOT_VIEW}>
        <SlotSheet seams={false} />

        {/* The piece of ice I am holding, and whether the puck is above it. */}
        <rect
          x={me - REACH} y="38" width={REACH * 2} height="30" rx="2"
          fill={inLane ? 'rgba(34,231,72,0.14)' : 'rgba(245,158,11,0.10)'}
          stroke={inLane ? 'rgba(34,231,72,0.45)' : 'rgba(245,158,11,0.35)'}
          strokeWidth="0.7"
          style={{ transition: 'x 70ms linear' }}
        />

        {/* The line the puck is on.
            Under the puck was the whole instruction and nothing on the ice
            actually showed it, so you were judging one small dot against a
            wide box by eye. The puck now drops a line onto your ice: inside
            the box and it is green, outside and it points at the gap you have
            to close. */}
        <line
          x1={puck} y1="36" x2={puck} y2="68"
          stroke={inLane ? 'rgba(34,231,72,0.55)' : 'rgba(245,158,11,0.5)'}
          strokeWidth="0.8" strokeDasharray="2 2.4"
        />
        {!inLane && (
          <line
            x1={puck} y1="53" x2={me + Math.sign(puck - me) * REACH} y2="53"
            stroke="rgba(245,158,11,0.75)" strokeWidth="0.9"
          />
        )}

        {/* The puck, worked around above the paint. */}
        <Puck at={[puck, 34]} r="2.4" glow={inLane} />

        {/* The defenceman leaning on me, and me. The arrow is the way he is
            leaning this second, which is the thing you are fighting.
            The arrow used to be written out at y 70 with its head reaching
            72.5, which is past the goal line and inside the mesh: the thing
            you were fighting was drawn in the back of your own net. It sits
            clear of the line now, and the two markers come off named rows. */}
        <g style={{ transition: 'transform 70ms linear' }} transform={`translate(${me - 50} 0)`}>
          <Marker at={[60, SLOT.slotRow]} kind="opp" label="D" r="4.8" />
          <Marker at={[49, SLOT.slotRow + 7]} kind="me" label="YOU" r="5.2" />
          {(() => {
            const y = SLOT.goalLine - 3.5;   // clear of the line by the arrow head
            const h = 2.5;
            return (
              <path
                d={lean > 0
                  ? `M 44 ${y} L 54 ${y} M ${54 - h} ${y - h} L 54 ${y} L ${54 - h} ${y + h}`
                  : `M 54 ${y} L 44 ${y} M ${44 + h} ${y - h} L 44 ${y} L ${44 + h} ${y + h}`}
                stroke="rgba(239,68,68,0.9)" strokeWidth="1.1" fill="none"
                strokeLinecap="round" strokeLinejoin="round"
              />
            );
          })()}
        </g>
      </Surface>

      <div className="flex gap-2 p-3 pt-0 select-none">
        <button
          type="button"
          onPointerDown={() => shove(-1)}
          disabled={status !== 'live'}
          className="flex-1 py-4 rounded-xl border border-[rgba(255,255,255,0.14)] bg-[#101410] text-slate-200 font-black text-[11px] sm:text-xs uppercase tracking-[0.16em] hover:border-[#22E748]/70 hover:text-white transition-all active:scale-[0.98] cursor-pointer disabled:cursor-default"
        >
          Work left
        </button>
        <button
          type="button"
          onPointerDown={() => shove(1)}
          disabled={status !== 'live'}
          className="flex-1 py-4 rounded-xl border border-[rgba(255,255,255,0.14)] bg-[#101410] text-slate-200 font-black text-[11px] sm:text-xs uppercase tracking-[0.16em] hover:border-[#22E748]/70 hover:text-white transition-all active:scale-[0.98] cursor-pointer disabled:cursor-default"
        >
          Work right
        </button>
      </div>
    </Stage>
  );
}
