import { useCallback, useEffect, useRef, useState } from 'react';
import { lerpDifficulty } from '../utils/stakes';
import { getActiveStat } from '../utils/gameHelpers';
import { SlotSheet, Marker, Puck, Surface } from './rink/Ice';
import { SLOT_VIEW } from './rink/geometry';
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

export default function ZoneBattleGame({ player, onComplete, difficulty = 0 }) {
  const physicality = getActiveStat(player, 'physicality');
  const gain = (1.0 + (physicality - 50) * 0.015) * lerpDifficulty(1.0, 0.78, difficulty);

  const [status, setStatus] = useState('live');
  const [puck, setPuck] = useState(50);
  const [me, setMe] = useState(50);
  const [hold, setHold] = useState(0);
  const [msLeft, setMsLeft] = useState(RUN_MS);

  const doneRef = useRef(false);
  const startRef = useRef(null);

  const finish = useCallback((win, delay = 1600) => {
    if (doneRef.current) return;
    doneRef.current = true;
    setStatus(win ? 'won' : 'lost');
    setTimeout(() => onComplete(win), delay);
  }, [onComplete]);

  useEffect(() => {
    if (status !== 'live') return;
    if (startRef.current === null) startRef.current = Date.now();

    const tick = setInterval(() => {
      const now = Date.now();
      const left = RUN_MS - (now - startRef.current);
      setMsLeft(left);
      if (left <= 0) { finish(false); return; }

      // The puck is worked around the top of the paint, never on a rhythm you
      // can simply memorise.
      const next = 50 + Math.sin(now / 350) * 32 + Math.cos(now / 600) * 9;
      setPuck(next);

      setMe(cur => {
        setHold(h => {
          const inLane = Math.abs(next - cur) <= REACH;
          const after = inLane ? h + 1.2 * gain : Math.max(0, h - 0.8);
          if (after >= 100) { finish(true); return 100; }
          return after;
        });
        return cur;
      });
    }, 50);

    return () => clearInterval(tick);
  }, [status, gain, finish]);

  const shove = (dir) => setMe(p => Math.max(12, Math.min(88, p + dir * 15)));
  const inLane = Math.abs(puck - me) <= REACH;

  return (
    <Stage
      hud={
        <Hud
          left={
            <div className="flex items-center gap-2 min-w-[120px]">
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Position</span>
              <span className="relative h-1.5 w-20 rounded-full bg-[rgba(255,255,255,0.08)] overflow-hidden">
                <span
                  className={`absolute inset-y-0 left-0 rounded-full ${inLane ? 'bg-[#22E748]' : 'bg-[#F59E0B]'}`}
                  style={{ width: `${hold}%`, transition: 'width 60ms linear' }}
                />
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
          : inLane ? 'You are under it. Stay there.'
            : 'Get back under the puck.'
      }
    >
      <Surface view={SLOT_VIEW}>
        <SlotSheet />

        {/* The piece of ice I am holding, and whether the puck is above it. */}
        <rect
          x={me - REACH} y="38" width={REACH * 2} height="30" rx="2"
          fill={inLane ? 'rgba(34,231,72,0.14)' : 'rgba(245,158,11,0.10)'}
          stroke={inLane ? 'rgba(34,231,72,0.45)' : 'rgba(245,158,11,0.35)'}
          strokeWidth="0.7"
          style={{ transition: 'x 70ms linear' }}
        />

        {/* The puck, worked around above the paint. */}
        <Puck at={[puck, 34]} r="2.4" glow={inLane} />

        {/* The defenceman leaning on me, and me. */}
        <g style={{ transition: 'transform 70ms linear' }} transform={`translate(${me - 50} 0)`}>
          <Marker at={[57, 52]} kind="opp" label="D" r="4.8" />
          <Marker at={[50, 58]} kind="me" label="YOU" r="5.2" />
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
