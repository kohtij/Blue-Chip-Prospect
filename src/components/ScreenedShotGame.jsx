import { useCallback, useEffect, useRef, useState } from 'react';
import { lerpDifficulty, MIN_REACTION_MS } from '../utils/stakes';
import { getActiveStat } from '../utils/gameHelpers';
import { NetMouth, Goalie, Surface } from './rink/Ice';
import { MOUTH, MOUTH_VIEW } from './rink/geometry';
import { Stage, Hud, Verdict, ActionButton, Callout } from './minigame/Shell';

// The screened shot.
//
// A grey box with the word "Traffic" written across it in faded capitals, three
// columns underneath, and a hockey-stick emoji that appeared in one of them. It
// is a good idea, badly dressed: a shot through a double screen really is a
// thing you pick up late and have to move to on instinct.
//
// You are in your net. There is a body in front of you and the point shot is
// already on its way somewhere behind him. You see it when it clears the screen
// and then it is a race to that side of the mouth.

const SIDES = [
  { id: 0, label: 'Glove side', x: 27 },
  { id: 1, label: 'Through the middle', x: 50 },
  { id: 2, label: 'Blocker side', x: 73 }
];

export default function ScreenedShotGame({ player, onComplete, difficulty = 0 }) {
  // Goalies read this off their shooting rating, which is where their reflexes live.
  const reflexes = getActiveStat(player, 'shooting');

  const [phase, setPhase] = useState('hidden');   // hidden, clear, result
  const [side] = useState(() => Math.floor(Math.random() * SIDES.length));
  const [picked, setPicked] = useState(null);
  const [status, setStatus] = useState('live');
  const [note, setNote] = useState(null);

  const doneRef = useRef(false);
  const timerRef = useRef(null);

  const window = Math.max(
    MIN_REACTION_MS,
    (240 + reflexes * 5) * lerpDifficulty(1.0, 0.72, difficulty)
  );

  const finish = useCallback((win, why, delay = 1600) => {
    if (doneRef.current) return;
    doneRef.current = true;
    setStatus(win ? 'saved' : 'beaten');
    setNote(why);
    if (timerRef.current) clearTimeout(timerRef.current);
    setTimeout(() => onComplete(win), delay);
  }, [onComplete]);

  useEffect(() => {
    // It is behind the screen for a moment, then it clears.
    const clear = setTimeout(() => {
      if (doneRef.current) return;
      setPhase('clear');
      timerRef.current = setTimeout(() => {
        if (doneRef.current) return;
        setPhase('result');
        finish(false, 'you never picked it up and it was in before you moved');
      }, window);
    }, 1100 + Math.random() * 700);

    return () => { clearTimeout(clear); if (timerRef.current) clearTimeout(timerRef.current); };
  }, [window, finish]);

  const commit = (id) => {
    if (doneRef.current || phase === 'result') return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setPicked(id);
    setPhase('result');

    if (phase === 'hidden') {
      finish(false, 'you guessed before it cleared the screen and committed to nothing');
    } else if (id === side) {
      finish(true, `fought through the screen and got there, ${SIDES[id].label.toLowerCase()}`);
    } else {
      finish(false, `it went ${SIDES[side].label.toLowerCase()} and you had gone the other way`);
    }
  };

  const visible = phase === 'clear' || phase === 'result';
  const saved = status === 'saved';

  return (
    <Stage
      hud={
        <Hud
          left={<span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
            Point shot through traffic
          </span>}
          right={
            <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-[0.16em] ${
              phase === 'clear' ? 'text-[#F59E0B]' : 'text-slate-600'
            }`}>
              {phase === 'result' ? '--' : phase === 'clear' ? 'Picked it up' : 'Screened'}
            </span>
          }
        />
      }
      verdict={
        <Verdict
          show={status !== 'live'}
          won={saved}
          word={saved ? 'REFLEX SAVE' : 'BEATEN CLEAN'}
          detail={note}
        />
      }
      caption={
        status !== 'live' ? null
          : visible ? 'There it is. Move.'
            : 'You cannot see the release. Do not guess, or you will be leaning the wrong way when it comes.'
      }
    >
      <Surface view={MOUTH_VIEW}>
        <NetMouth>
          <Goalie
            shift={picked === null ? 0 : (SIDES[picked].x - 50) / 23}
            down={picked !== null}
            beaten={status === 'beaten'}
          />
        </NetMouth>

        {/* The puck, once it has cleared the screen. */}
        {visible && side !== null && (
          <g>
            <line
              x1={SIDES[side].x} y1={MOUTH.yBot + 8}
              x2={SIDES[side].x} y2={40}
              stroke={saved ? 'rgba(34,231,72,0.5)' : 'rgba(251,191,36,0.5)'}
              strokeWidth="1.1" strokeDasharray="2.6 2.2"
            />
            <circle cx={SIDES[side].x} cy="40" r="3" fill="#fff"
                    stroke="rgba(0,0,0,0.6)" strokeWidth="0.8" />
          </g>
        )}

        {/* The screen: two bodies planted in front of the mouth, which is what
            you are actually looking through. */}
        <g>
          <rect x="30" y={MOUTH.yBot - 4} width="17" height="24" rx="5"
                fill="rgba(200,44,44,0.82)" stroke="rgba(0,0,0,0.5)" strokeWidth="0.7" />
          <rect x="52" y={MOUTH.yBot - 1} width="16" height="22" rx="5"
                fill="rgba(56,120,220,0.8)" stroke="rgba(0,0,0,0.5)" strokeWidth="0.7" />
        </g>
      </Surface>

      {phase === 'hidden' && <Callout text="Can't see it" y="22%" />}

      <div className="flex gap-2 p-3 pt-0">
        {SIDES.map(s => (
          <ActionButton
            key={s.id}
            wide
            onClick={() => commit(s.id)}
            disabled={phase === 'result'}
            state={
              phase === 'result'
                ? (s.id === picked ? (saved ? 'right' : 'wrong') : s.id === side ? 'right' : 'spent')
                : 'idle'
            }
          >
            {s.label}
          </ActionButton>
        ))}
      </div>
    </Stage>
  );
}
