import { useCallback, useEffect, useRef, useState } from 'react';
import { lerpDifficulty, MIN_REACTION_MS } from '../utils/stakes';
import { getActiveStat } from '../utils/gameHelpers';
import { SlotSheet, Marker, Surface } from './rink/Ice';
import { SLOT, SLOT_MOUTH, SLOT_VIEW, wavePath } from './rink/geometry';
import { Stage, Hud, Pips, Verdict, ActionButton } from './minigame/Shell';

// Blocking the shot, from the slot.
//
// This was three grey columns with a hockey-stick emoji bouncing above one of
// them and a button marked BLOCK LANE under each. The mechanic was fine and the
// picture told you nothing.
//
// Now you are standing in the slot with your own net behind you and the point
// man winding up at the blue line. The shot comes down one of three lanes, drawn
// as a shot the way a drill book draws one, and you get in front of it or you
// screen your own goalie. Three in a row and the shift is over.

const NEEDED = 3;
// The lane centres come from SLOT now, so the shooting lanes, the seams the
// sheet paints between them and the markers this game stands in them cannot
// drift apart.
const LANES = [
  { id: 0, label: 'Strong side', x: SLOT.lanes[0] },
  { id: 1, label: 'Through the middle', x: SLOT.lanes[1] },
  { id: 2, label: 'Weak side', x: SLOT.lanes[2] }
];

export default function ShotBlockGame({ player, onComplete, difficulty = 0 }) {
  const skating = getActiveStat(player, 'skating');

  const [phase, setPhase] = useState('settle');  // settle, winding, live, result
  const [lane, setLane] = useState(null);
  const [picked, setPicked] = useState(null);
  const [blocks, setBlocks] = useState(0);
  const [status, setStatus] = useState('live');
  const [note, setNote] = useState(null);

  const doneRef = useRef(false);
  const timerRef = useRef(null);

  const finish = useCallback((win, why, delay = 1500) => {
    if (doneRef.current) return;
    doneRef.current = true;
    setStatus(win ? 'held' : 'beaten');
    setNote(why);
    if (timerRef.current) clearTimeout(timerRef.current);
    setTimeout(() => onComplete(win), delay);
  }, [onComplete]);

  // One shot: he loads it up, then it comes.
  useEffect(() => {
    if (phase !== 'settle' || doneRef.current) return;

    timerRef.current = setTimeout(() => {
      if (doneRef.current) return;
      const next = Math.floor(Math.random() * LANES.length);
      setLane(next);
      setPicked(null);
      setPhase('live');

      // Floored so the lane is always reachable, however big the game.
      const window = Math.max(
        MIN_REACTION_MS + 60,
        (1150 - skating * 5) * lerpDifficulty(1.0, 0.70, difficulty)
      );
      timerRef.current = setTimeout(() => {
        if (doneRef.current) return;
        setPhase('result');
        finish(false, 'you never got across and it went through clean');
      }, window);
    }, 500 + Math.random() * 900);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [phase, skating, difficulty, finish]);

  const commit = (id) => {
    if (phase !== 'live' || doneRef.current) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setPicked(id);

    if (id === lane) {
      const made = blocks + 1;
      setBlocks(made);
      setPhase('result');
      if (made >= NEEDED) {
        finish(true, 'three blocked and the puck is out of the zone');
      } else {
        setNote('Blocked. He is loading up another one.');
        setTimeout(() => { if (!doneRef.current) { setPhase('settle'); setNote(null); } }, 700);
      }
    } else {
      setPhase('result');
      finish(false, 'you dropped into the wrong lane and screened your own goalie');
    }
  };

  const showShot = (phase === 'live' || phase === 'result') && lane !== null;
  const hitLane = picked === lane;

  return (
    <Stage
      hud={
        <Hud
          left={<Pips label="Blocked" filled={blocks} total={NEEDED} />}
          right={<span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
            Defensive slot
          </span>}
        />
      }
      verdict={
        <Verdict
          show={status !== 'live'}
          won={status === 'held'}
          word={status === 'held' ? 'ATE THEM ALL' : 'BEATEN'}
          detail={note}
        />
      }
      caption={note && status === 'live' ? note : 'He is at the point. Pick the lane and get in front of it.'}
    >
      <Surface view={SLOT_VIEW}>
        <SlotSheet />

        {/* The point man, winding up. On pointRow rather than at 14, where his
            marker was drawn across the blue line above him and across the lane
            ticks below him at the same time. */}
        <Marker at={[LANES[lane ?? 1].x, SLOT.pointRow]} kind="opp" label="D" r="4.4" />

        {/* The shot, once it is on its way. It finishes on the goal line now,
            not at 70, which was neither the line nor the mouth. */}
        {showShot && (
          <path
            d={wavePath([LANES[lane].x, SLOT.pointRow + 4], SLOT_MOUTH, null, 1.6, 7)}
            fill="none"
            stroke={picked === null ? '#fbbf24' : hitLane ? '#22E748' : '#ef4444'}
            strokeWidth="1.9" strokeLinecap="round"
          />
        )}

        {/* Me, in the slot. I slide into whichever lane I commit to. */}
        <g style={{ transition: 'transform 120ms ease-out' }}
           transform={`translate(${(LANES[picked ?? 1].x - 50)} 0)`}>
          <Marker at={[50, SLOT.slotRow]} kind="me" label="YOU" r="5.2" />
        </g>

        {/* The lane ticks are gone. They sat in the band the point man's marker
            occupies, and the sheet already paints a dashed seam between each
            pair of lanes, so they were drawing the channels twice. */}
      </Surface>

      <div className="flex gap-2 p-3 pt-0">
        {LANES.map(l => (
          <ActionButton
            key={l.id}
            wide
            onClick={() => commit(l.id)}
            disabled={phase !== 'live'}
            state={
              phase === 'result' && l.id === lane ? (hitLane ? 'right' : 'spent')
                : phase === 'result' && l.id === picked ? 'wrong'
                  : phase === 'live' ? 'idle' : 'spent'
            }
          >
            {l.label}
          </ActionButton>
        ))}
      </div>
    </Stage>
  );
}
