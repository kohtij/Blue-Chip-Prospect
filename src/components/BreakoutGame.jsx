import { useCallback, useEffect, useRef, useState } from 'react';
import { lerpDifficulty, MIN_REACTION_MS } from '../utils/stakes';
import { getActiveStat } from '../utils/gameHelpers';
import { SlotSheet, Marker, Puck, Move, Surface } from './rink/Ice';
import { SLOT_VIEW } from './rink/geometry';
import { Stage, Hud, Verdict, ActionButton } from './minigame/Shell';

// The breakout.
//
// Three grey columns again, with a shield emoji for a forechecker and a stick
// emoji for the winger. The read it wants is a real one, though: under pressure
// behind your own net you have a moment when a winger comes open, and hitting
// him a beat early or a beat late is a turnover in the worst place on the ice.
//
// You are behind your own goal line with the puck. Two forecheckers are closing
// and your wingers are working the walls. One comes open. Hit him while he is
// open, with the pass drawn the way a pass is drawn, and you are out of the
// zone.

const LANES = [
  { id: 0, label: 'Left wall', x: 16 },
  { id: 1, label: 'Up the middle', x: 50 },
  { id: 2, label: 'Right wall', x: 84 }
];

export default function BreakoutGame({ player, onComplete, difficulty = 0 }) {
  const iq = getActiveStat(player, 'hockeyIQ');

  const [phase, setPhase] = useState('read');    // read, open, result
  const [openLane] = useState(() => Math.floor(Math.random() * LANES.length));
  const [picked, setPicked] = useState(null);
  const [status, setStatus] = useState('live');
  const [note, setNote] = useState(null);

  const doneRef = useRef(false);
  const timerRef = useRef(null);

  // Hockey IQ is how long the lane stays open to you.
  const window = Math.max(
    MIN_REACTION_MS + 80,
    (320 + iq * 6) * lerpDifficulty(1.0, 0.68, difficulty)
  );

  const finish = useCallback((win, why, delay = 1600) => {
    if (doneRef.current) return;
    doneRef.current = true;
    setStatus(win ? 'out' : 'turnover');
    setNote(why);
    if (timerRef.current) clearTimeout(timerRef.current);
    setTimeout(() => onComplete(win), delay);
  }, [onComplete]);

  useEffect(() => {
    // He takes a moment to get his feet moving and find the soft spot.
    const open = setTimeout(() => {
      if (doneRef.current) return;
      setPhase('open');
      timerRef.current = setTimeout(() => {
        if (doneRef.current) return;
        setPhase('result');
        finish(false, 'the lane shut before you moved it and they pinned you in');
      }, window);
    }, 900 + Math.random() * 1400);

    return () => { clearTimeout(open); if (timerRef.current) clearTimeout(timerRef.current); };
  }, [window, finish]);

  const pass = (id) => {
    if (doneRef.current || phase === 'result') return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setPicked(id);
    setPhase('result');

    if (id !== openLane) {
      finish(false, 'straight onto a forechecker’s stick');
    } else if (phase === 'read') {
      finish(false, 'you moved it before he was there and it died on the wall');
    } else {
      finish(true, 'tape to tape, and the zone is behind you');
    }
  };

  const isOpen = phase === 'open';
  const right = status === 'out';

  return (
    <Stage
      hud={
        <Hud
          left={<span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
            Own zone, under pressure
          </span>}
          right={
            <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-[0.16em] ${
              isOpen ? 'text-[#22E748]' : 'text-slate-600'
            }`}>
              {phase === 'result' ? '—' : isOpen ? 'Lane open' : 'Checking'}
            </span>
          }
        />
      }
      verdict={
        <Verdict
          show={status !== 'live'}
          won={right}
          word={right ? 'CLEAN EXIT' : 'TURNOVER'}
          detail={note}
        />
      }
      caption={
        status !== 'live' ? null
          : isOpen ? 'He is open now. Move it.'
            : 'Wait for a winger to actually come open. A pass to a covered man is a turnover.'
      }
    >
      <Surface view={SLOT_VIEW}>
        {/* The sheet is our own end: the net below us, the ice running away. */}
        <SlotSheet />

        {/* Forecheckers, closing from above. */}
        {LANES.filter(l => l.id !== openLane).map(l => (
          <Marker key={l.id} at={[l.x, 30]} kind="opp" label="F" r="4.3" />
        ))}

        {/* The winger, working his wall. He is only a target once he is open. */}
        {(
          <g opacity={isOpen || phase === 'result' ? 1 : 0.42}
             style={{ transition: 'opacity 140ms linear' }}>
            <Marker at={[LANES[openLane].x, isOpen || phase === 'result' ? 24 : 38]} kind="mate" label="W" r="4.3" />
            {isOpen && (
              <circle cx={LANES[openLane].x} cy="24" r="7.6" fill="none"
                      stroke="rgba(96,165,250,0.5)" strokeWidth="0.8" strokeDasharray="2.4 2.4" />
            )}
          </g>
        )}

        {/* The pass, once it has been made. */}
        {picked !== null && (
          <Move
            move={{
              type: 'pass',
              from: [50, 66],
              to: [LANES[picked].x, picked === openLane ? 26 : 31],
              ink: right ? '#60a5fa' : '#ef4444'
            }}
            stops={[[LANES[picked].x, picked === openLane ? 24 : 30]]}
          />
        )}

        {/* Me, with the puck, behind my own goal line. */}
        <Marker at={[50, 66]} kind="me" label="YOU" r="5.2" />
        {picked === null && <Puck at={[56, 69]} r="2" />}
      </Surface>

      <div className="flex gap-2 p-3 pt-0">
        {LANES.map(l => (
          <ActionButton
            key={l.id}
            wide
            onClick={() => pass(l.id)}
            disabled={phase === 'result'}
            state={
              phase === 'result'
                ? (l.id === picked ? (right ? 'right' : 'wrong') : 'spent')
                : 'idle'
            }
          >
            {l.label}
          </ActionButton>
        ))}
      </div>
    </Stage>
  );
}
