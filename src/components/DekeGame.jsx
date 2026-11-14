import { useCallback, useEffect, useRef, useState } from 'react';
import { lerpDifficulty, MIN_REACTION_MS } from '../utils/stakes';
import { getActiveStat } from '../utils/gameHelpers';
import { SlotSheet, Marker, Puck, Surface } from './rink/Ice';
import { SLOT, SLOT_MOUTH, SLOT_VIEW, wavePath } from './rink/geometry';
import { Stage, Hud, Pips, Verdict, ActionButton } from './minigame/Shell';

// End to end.
//
// A forward carrying the puck the length of the ice beats each man the same
// way: he waits for the defender to commit his stick, then takes the puck to
// the side the stick has just left. Go first and a good defender simply
// follows you. Wait too long and he's close enough to take it off you.
//
// Three men, one at a time, and the last one is the final defenceman in front
// of the net. Beat all three and you're in on goal.

const MEN = ['The first forechecker', 'The man in the middle', 'The last defenceman'];
const ME = [50, SLOT.highRow];
const HIS_CLOSE = SLOT.slotRow - 8;

export default function DekeGame({ player, onComplete, difficulty = 0 }) {
  const skating = getActiveStat(player, 'skating');

  // How long the side he's opened stays open. Quick feet keep it open longer.
  const openMs = Math.max(
    MIN_REACTION_MS + 80,
    (300 + skating * 5) * lerpDifficulty(1.0, 0.7, difficulty)
  );

  const [man, setMan] = useState(0);
  const [phase, setPhase] = useState('closing');   // closing, committed, beat, done
  const [reach, setReach] = useState(0);           // -1 his stick to the left, 1 to the right
  const [went, setWent] = useState(0);
  const [beaten, setBeaten] = useState(0);
  const [status, setStatus] = useState('live');
  const [note, setNote] = useState(null);

  const doneRef = useRef(false);
  const timerRef = useRef(null);

  const finish = useCallback((win, why, delay = 1600) => {
    if (doneRef.current) return;
    doneRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    setPhase('done');
    setStatus(win ? 'won' : 'lost');
    setNote(why);
    setTimeout(() => onComplete(win), delay);
  }, [onComplete]);

  // He closes on you, then reaches.
  useEffect(() => {
    if (phase !== 'closing' || doneRef.current) return;
    timerRef.current = setTimeout(() => {
      if (doneRef.current) return;
      setReach(Math.random() < 0.5 ? -1 : 1);
      setPhase('committed');
      timerRef.current = setTimeout(() => {
        finish(false, 'you held it too long and he took it off your stick');
      }, openMs);
    }, 900 + Math.random() * 1300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [phase, man, openMs, finish]);

  const go = (side) => {
    if (doneRef.current || (phase !== 'closing' && phase !== 'committed')) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setWent(side);

    if (phase === 'closing') {
      finish(false, 'you moved first, and he just went with you');
      return;
    }
    if (side === reach) {
      finish(false, 'straight into his stick');
      return;
    }

    const made = beaten + 1;
    setBeaten(made);
    setPhase('beat');
    if (made >= MEN.length) {
      setTimeout(() => finish(true, 'all three beaten, and you finished it yourself', 1800), 650);
    } else {
      setTimeout(() => {
        if (doneRef.current) return;
        setMan(made);
        setReach(0);
        setWent(0);
        setPhase('closing');
      }, 800);
    }
  };

  // Left and right on the keyboard.
  const goRef = useRef(go);
  useEffect(() => { goRef.current = go; });
  useEffect(() => {
    const onKey = (e) => {
      if (e.repeat) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { e.preventDefault(); goRef.current(-1); }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { e.preventDefault(); goRef.current(1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const committed = phase === 'committed';
  const closing = phase === 'closing';
  const scored = status === 'won';

  // He steps up toward you while he waits to reach, and leans with his stick.
  const hisY = closing ? HIS_CLOSE + 4 : HIS_CLOSE;
  const hisX = 50 + (committed || (phase === 'done' && reach) ? reach * 3 : 0);
  const myX = phase === 'beat' || scored ? 50 + went * 22 : 50 + went * 6;
  const myY = phase === 'beat' || scored ? SLOT.slotRow + 4 : ME[1];

  // His stick, from his body toward the puck: straight at you while he waits,
  // swung out to one side when he reaches.
  const stickEnd = reach
    ? [hisX + reach * 11, hisY - 7]
    : [hisX, hisY - 10];

  return (
    <Stage
      keys="Left and right arrows to go"
      hud={
        <Hud
          left={<Pips label="Beaten" filled={beaten} total={MEN.length} />}
          right={<span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
            {MEN[Math.min(man, MEN.length - 1)]}
          </span>}
        />
      }
      verdict={
        <Verdict
          show={status !== 'live'}
          won={scored}
          word={scored ? 'GOAL' : 'STRIPPED'}
          detail={note}
        />
      }
      caption={
        status !== 'live' ? null
          : committed ? 'His stick has gone one way. Take the puck the other way.'
            : phase === 'beat' ? 'Past him. Here comes the next one.'
              : 'Wait for his stick to commit. Go first and he follows you.'
      }
    >
      <Surface view={SLOT_VIEW}>
        <SlotSheet seams={false} />

        {/* The defender. Only the man you're beating now is on the ice. */}
        {phase !== 'beat' && !scored && (
          <g style={{ transition: 'transform 160ms ease-out' }}>
            <line x1={hisX} y1={hisY} x2={stickEnd[0]} y2={stickEnd[1]}
                  stroke={committed ? '#ef4444' : 'rgba(214,52,52,0.75)'} strokeWidth={committed ? 2.2 : 1.6}
                  strokeLinecap="round" />
            <Marker at={[hisX, hisY]} kind="opp" label="D" r="4.8" />
          </g>
        )}
        {(phase === 'beat' || scored) && (
          <g opacity="0.35">
            <Marker at={[50 + reach * 3, HIS_CLOSE]} kind="opp" label="D" r="4.8" />
          </g>
        )}

        {/* The finish, once all three are beaten. */}
        {scored && (
          <path d={wavePath([myX, myY + 5], SLOT_MOUTH, null, 1.2)} fill="none" stroke="#22E748"
                strokeWidth="1.5" strokeLinecap="round" />
        )}

        {/* Me, with the puck out in front. */}
        <g style={{ transition: 'all 220ms ease-out' }}>
          <Marker at={[myX, myY]} kind="me" label="YOU" r="5.2" />
        </g>
        {scored
          ? <Puck at={SLOT_MOUTH} r="2" glow />
          : <Puck at={[myX + went * 3, myY + 7.4]} r="2" />}
      </Surface>

      <div className="flex gap-2 p-3">
        {[{ side: -1, label: 'Go left' }, { side: 1, label: 'Go right' }].map(b => (
          <ActionButton
            key={b.side}
            wide
            onClick={() => go(b.side)}
            disabled={phase === 'done' || phase === 'beat'}
            state={
              went === b.side && phase === 'done' ? (scored ? 'right' : 'wrong')
                : went === b.side && phase === 'beat' ? 'right'
                  : 'idle'
            }
          >
            {b.label}
          </ActionButton>
        ))}
      </div>
    </Stage>
  );
}
