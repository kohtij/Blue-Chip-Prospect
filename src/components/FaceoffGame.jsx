import { useCallback, useEffect, useRef, useState } from 'react';
import { lerpDifficulty, MIN_REACTION_MS } from '../utils/stakes';
import { getActiveStat } from '../utils/gameHelpers';
import { DotSheet, Surface, Puck } from './rink/Ice';
import { DOT_VIEW } from './rink/geometry';
import { Stage, Hud, Verdict, Callout } from './minigame/Shell';

// The draw.
//
// This was a pale blue circle the size of a dinner plate with a red button in
// the middle that turned green, and the whole thing read as a reflex app rather
// than a faceoff. The mechanic is right, though: a draw genuinely is two men
// waiting on a linesman's hand and the quicker stick winning it.
//
// So it is drawn as the dot now, from above: the circle, the hash marks, the
// centre line, two sticks in the dot and the puck in the linesman's hand. The
// puck lands, the first stick there wins, and jumping the drop gets you warned
// once and thrown out of the circle the second time.

export default function FaceoffGame({ player, onComplete, difficulty = 0 }) {
  const iq = getActiveStat(player, 'hockeyIQ');

  const [phase, setPhase] = useState('set');   // set, live, done
  const [outcome, setOutcome] = useState(null);
  const [warned, setWarned] = useState(false);

  const doneRef = useRef(false);
  const dropRef = useRef(null);
  const loseRef = useRef(null);
  const liveAtRef = useRef(null);

  const finish = useCallback((won, result, delay = 1500) => {
    if (doneRef.current) return;
    doneRef.current = true;
    if (dropRef.current) clearTimeout(dropRef.current);
    if (loseRef.current) clearTimeout(loseRef.current);
    setOutcome(result);
    setPhase('done');
    setTimeout(() => onComplete(won), delay);
  }, [onComplete]);

  useEffect(() => {
    // A linesman holds it as long as he feels like holding it.
    const wait = 1800 + Math.random() * 3000;
    dropRef.current = setTimeout(() => {
      if (doneRef.current) return;
      setPhase('live');
      liveAtRef.current = Date.now();

      // The opposing centre is quicker in a big game, but never quicker than a
      // person can answer.
      const theirs = Math.max(
        MIN_REACTION_MS,
        (640 - iq * 2) * lerpDifficulty(1.15, 0.80, difficulty)
      );
      loseRef.current = setTimeout(() => {
        finish(false, { kind: 'lost', note: 'his stick got there first' });
      }, theirs);
    }, wait);

    return () => {
      if (dropRef.current) clearTimeout(dropRef.current);
      if (loseRef.current) clearTimeout(loseRef.current);
    };
  }, [iq, difficulty, finish]);

  const strike = () => {
    if (doneRef.current) return;

    if (phase === 'set') {
      if (!warned) {
        setWarned(true);
        return;
      }
      finish(false, { kind: 'tossed', note: 'thrown out of the circle for the second violation' });
      return;
    }

    if (phase === 'live') {
      const ms = Date.now() - liveAtRef.current;
      finish(true, { kind: 'won', note: `${ms}ms on the draw`, ms });
    }
  };

  const live = phase === 'live';
  const won = outcome?.kind === 'won';

  return (
    <Stage
      hud={
        <Hud
          left={<span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
            Centre ice draw
          </span>}
          right={
            <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-[0.16em] ${
              warned && phase !== 'done' ? 'text-[#F59E0B]' : 'text-slate-600'
            }`}>
              {warned && phase !== 'done' ? 'Warned once' : 'Clean'}
            </span>
          }
        />
      }
      verdict={
        <Verdict
          show={phase === 'done'}
          won={won}
          word={won ? 'WON THE DRAW' : outcome?.kind === 'tossed' ? 'TOSSED' : 'LOST THE DRAW'}
          detail={outcome?.note}
        />
      }
      caption={
        phase === 'done' ? null
          : warned
            ? 'One more twitch before it lands and the linesman throws you out of the circle.'
            : 'Tap anywhere on the ice the moment the puck lands. The linesman decides when, not you.'
      }
    >
      <button
        type="button"
        onClick={strike}
        className={`block w-full ${phase === 'done' ? 'cursor-default' : 'cursor-pointer'}`}
        aria-label="Go for the puck"
      >
        <Surface view={DOT_VIEW}>
          <DotSheet />

          {/* Two sticks in the dot, mine green, his red. They close on the puck
              when it lands, and the draw needs no other animation. */}
          <g style={{ transition: 'transform 90ms linear' }}
             transform={`translate(${live || phase === 'done' ? -4 : -13} 0)`}>
            <path d="M 18 72 L 40 54 L 46 51" stroke="#22E748" strokeWidth="2.6"
                  strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </g>
          <g style={{ transition: 'transform 90ms linear' }}
             transform={`translate(${live || phase === 'done' ? 4 : 13} 0)`}>
            <path d="M 82 28 L 60 46 L 54 49" stroke="rgba(214,52,52,0.9)" strokeWidth="2.6"
                  strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </g>

          {/* The two centres. */}
          <circle cx="15" cy="78" r="6" fill="#22E748" stroke="rgba(0,0,0,0.55)" strokeWidth="0.8" />
          <text x="15" y="80.4" textAnchor="middle" fontSize="6" fontWeight="900" fill="#07120b"
                style={{ fontFamily: 'inherit' }}>C</text>
          <circle cx="85" cy="22" r="6" fill="rgba(200,44,44,0.9)" stroke="rgba(0,0,0,0.55)" strokeWidth="0.8" />
          <text x="85" y="24.4" textAnchor="middle" fontSize="6" fontWeight="900" fill="#fff"
                style={{ fontFamily: 'inherit' }}>C</text>

          {/* Where to press. The whole sheet takes the tap, which suits a
              phone, but nothing on the ice said so and the draw read as
              something to watch rather than something to do. The ring marks
              the spot and carries the state: dashed and grey while the linesman
              holds it, amber on the warning, solid green the instant it lands. */}
          {phase !== 'done' && (
            <g pointerEvents="none" style={{ transition: 'all 120ms linear' }}>
              <circle
                cx="50" cy="50" r="21"
                fill={live ? 'rgba(34,231,72,0.10)' : 'rgba(255,255,255,0.025)'}
                stroke={live ? '#22E748' : warned ? 'rgba(245,158,11,0.75)' : 'rgba(255,255,255,0.3)'}
                strokeWidth={live ? 2.4 : 1.3}
                strokeDasharray={live ? undefined : '3.4 3'}
              />
              <text
                x="50" y="80" textAnchor="middle" fontSize="4.2" fontWeight="900"
                letterSpacing="0.5"
                fill={live ? '#22E748' : warned ? 'rgba(245,158,11,0.95)' : 'rgba(255,255,255,0.45)'}
                style={{ fontFamily: 'inherit' }}
              >
                {live ? 'TAP NOW' : 'TAP WHEN IT DROPS'}
              </text>
            </g>
          )}

          {/* The puck: held above the dot, then on it. */}
          {live || phase === 'done'
            ? <Puck at={[50, 50]} r={3.4} glow={live} />
            : <g opacity="0.55"><Puck at={[50, 34]} r={3} /></g>}
        </Surface>
      </button>

      {phase !== 'done' && warned && !live && (
        <Callout text="Last warning" tone="stop" y="12%" />
      )}
    </Stage>
  );
}
