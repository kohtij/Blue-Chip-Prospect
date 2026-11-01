import { useState, useRef, useMemo } from 'react';
import { getActiveStat } from '../utils/gameHelpers';
import { lerpDifficulty, MIN_TIMING_MS } from '../utils/stakes';
import { SlotSheet, Marker, Surface } from './rink/Ice';
import { SLOT_VIEW, bez, wavePath } from './rink/geometry';
import { Stage, Hud, Verdict } from './minigame/Shell';

// Net-front screen and tip.
//
// The lane the puck comes through is not something a man standing in the blue
// paint with a defenceman on his back can see, so it is not drawn. You hold your
// position, you decide when the puck is arriving, and you let go. The lane is
// revealed when you do, against the point you released at.
//
// What the player's ratings buy him is the size of the lane itself: hands and a
// read of the play make the window he has to hit wider. They do not tell him
// where it is. Showing him a band to aim at, which is what this did for a while,
// is the same as showing him the answer with extra steps.
//
// (Before this it was a grey progress bar with a shaded green zone, then a grey
// progress bar with the zone hidden. It is now the shot itself, coming off the
// point and down the slot, which is what the player is actually timing.)

// The shot's path down the slot: off the point stick, past the dot, at the net.
const FROM = [78, 14];
const CURVE = [66, 40];
const TO = [50, 66];
const at = (pct) => bez(FROM, TO, CURVE, Math.max(0, Math.min(100, pct)) / 100);

export default function DeflectionGame({ player, onComplete, difficulty = 0 }) {
  const physicality = getActiveStat(player, 'physicality');
  const iq = getActiveStat(player, 'hockeyIQ');

  const [centerSeed] = useState(() => Math.random());

  const { lane, speed } = useMemo(() => {
    const crossMs = lerpDifficulty(2600, 1700, difficulty) * (1 + (iq - 50) * 0.004);
    const windowMs = Math.max(
      MIN_TIMING_MS,
      lerpDifficulty(460, 260, difficulty) * (1 + (physicality - 50) * 0.005)
    );

    const widthPct = Math.min(42, (windowMs / crossMs) * 100);
    const center = 55 + centerSeed * 25;
    const half = widthPct / 2;
    const min = Math.max(2, Math.min(center - half, 96 - widthPct));

    return {
      lane: { min, max: min + widthPct },
      speed: (100 / crossMs) * 20
    };
  }, [physicality, iq, difficulty, centerSeed]);

  const [phase, setPhase] = useState('ready'); // ready, active, result
  const [progress, setProgress] = useState(0);
  const [releasedAt, setReleasedAt] = useState(null);
  const [resultMsg, setResultMsg] = useState('');
  const [verdict, setVerdict] = useState(null);
  const [won, setWon] = useState(false);

  const intervalRef = useRef(null);
  const isProcessingRef = useRef(false);

  const handlePress = () => {
    if (phase === 'ready') {
      isProcessingRef.current = false;
      setPhase('active');
      intervalRef.current = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            clearInterval(intervalRef.current);
            handleRelease(100);
            return 100;
          }
          return p + speed;
        });
      }, 20);
    }
  };

  const handleRelease = (manualProgress = null) => {
    if (phase !== 'active' || isProcessingRef.current) return;
    isProcessingRef.current = true;

    clearInterval(intervalRef.current);
    const finalP = manualProgress !== null ? manualProgress : progress;
    setReleasedAt(finalP);
    setPhase('result');

    if (finalP < lane.min) {
      setWon(false);
      setVerdict('TOO EARLY');
      setResultMsg('You came off the post before it got there and the goalie saw the whole thing.');
      setTimeout(() => onComplete(false), 2400);
    } else if (finalP > lane.max) {
      setWon(false);
      setVerdict('TOO LONG');
      setResultMsg('The puck was past you, and the whistle went for goaltender interference.');
      setTimeout(() => onComplete(false), 2400);
    } else {
      setWon(true);
      setVerdict('TIPPED IT');
      setResultMsg('Blade down, half a stick in the lane, and it changes direction.');
      setTimeout(() => onComplete(true), 2400);
    }
  };

  const revealed = phase === 'result';
  const puck = at(phase === 'ready' ? 0 : revealed ? releasedAt : progress);
  const laneA = at(lane.min);
  const laneB = at(lane.max);

  return (
    <Stage
      hud={
        <Hud
          left={<span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
            Net front screen
          </span>}
          right={
            <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-[0.16em] ${
              phase === 'active' ? 'text-[#22E748]' : 'text-slate-600'
            }`}>
              {phase === 'active' ? 'Holding position' : phase === 'ready' ? 'He is winding up' : '—'}
            </span>
          }
        />
      }
      verdict={<Verdict show={revealed} won={won} word={verdict} detail={resultMsg} />}
      caption={
        revealed ? null
          : 'Nobody is going to show you where it is coming through. Your hands and your read decide how big that lane is; when to let go is on you.'
      }
    >
      <Surface view={SLOT_VIEW}>
        <SlotSheet />

        {/* The point man and the shot he is sending down the slot. */}
        <Marker at={[82, 12]} kind="mate" label="D" r="4.3" />
        <path d={wavePath(FROM, TO, CURVE, 1.3, 7)} fill="none"
              stroke="rgba(251,191,36,0.3)" strokeWidth="1.1" strokeDasharray="2.4 3" />

        {/* The lane, drawn only once it is too late to use it. */}
        {revealed && (
          <g>
            <path d={wavePath(at(lane.min), at(lane.max), null, 1.1, 4)} fill="none"
                  stroke="rgba(34,231,72,0.85)" strokeWidth="2.6" strokeLinecap="round" />
            {[laneA, laneB].map((p, i) => (
              <circle key={i} cx={p[0]} cy={p[1]} r="1.6" fill="#22E748" />
            ))}
          </g>
        )}

        {/* The defenceman on my back, and me sealing the paint. */}
        <Marker at={[57, 56]} kind="opp" label="D" r="4.6" />
        <Marker at={[50, 60]} kind="me" label="YOU" r="5" />

        {/* The puck, where it is now, or where it was when I let go. */}
        {phase !== 'ready' && (
          <g>
            {revealed && (
              <circle cx={puck[0]} cy={puck[1]} r="5.4" fill="none"
                      stroke={won ? '#22E748' : '#ef4444'} strokeWidth="1.1" />
            )}
            <circle cx={puck[0]} cy={puck[1]} r="2.4" fill="#fff"
                    stroke="rgba(0,0,0,0.6)" strokeWidth="0.7" />
          </g>
        )}
      </Surface>

      <div className="p-3 pt-0">
        {phase === 'ready' && (
          <button
            type="button"
            onPointerDown={handlePress}
            className="w-full py-4 rounded-xl border border-[rgba(255,255,255,0.14)] bg-[#101410] text-slate-200 font-black text-sm sm:text-base sports-font uppercase tracking-[0.18em] hover:border-[#22E748]/70 hover:text-white transition-all active:scale-[0.99] cursor-pointer select-none"
          >
            Press and hold to screen
          </button>
        )}
        {phase === 'active' && (
          <button
            type="button"
            onPointerUp={() => handleRelease()}
            onPointerLeave={() => handleRelease()}
            className="w-full py-4 rounded-xl border border-[#F59E0B] bg-[#F59E0B]/15 text-[#F59E0B] font-black text-sm sm:text-base sports-font uppercase tracking-[0.18em] cursor-pointer select-none"
          >
            Let go to get a blade on it
          </button>
        )}
        {revealed && (
          <div className="w-full py-4 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0a0d0a] text-center text-[11px] sm:text-xs font-black uppercase tracking-[0.16em] text-slate-500">
            {won ? 'The lane was where you guessed' : 'That is where the lane was'}
          </div>
        )}
      </div>
    </Stage>
  );
}
