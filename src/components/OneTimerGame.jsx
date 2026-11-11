import { useCallback, useEffect, useRef, useState } from 'react';
import { lerpDifficulty } from '../utils/stakes';
import { getActiveStat } from '../utils/gameHelpers';
import { ZoneSheet, Marker, Move, Surface } from './rink/Ice';
import { ZONE_VIEW, MID, DOT_X, TOP_DOT, BOT_DOT, wavePath } from './rink/geometry';
import { Stage, Hud, Verdict } from './minigame/Shell';

// The one-timer.
//
// This was a black dot sliding along a grey capsule towards an amber band, with
// a button underneath. The timing test is right, but a one-timer is a specific
// thing: a pass arrives across the seam and you hit it without stopping it, and
// the window is your own stick blade.
//
// So the pass is drawn across the slot from the far circle to mine, and the
// window is the reach of my stick, which I can see, because a man can see his
// own stick. That is the difference between this and the deflection, where the
// puck is coming through traffic you have your back to and the lane is hidden.

const FROM = [DOT_X - 3, BOT_DOT];      // the far faceoff dot
const TO = [DOT_X - 3, TOP_DOT];        // my dot, across the seam
const SPAN = TO[1] - FROM[1];

export default function OneTimerGame({ player, onComplete, difficulty = 0 }) {
  const shooting = getActiveStat(player, 'shooting');

  const [status, setStatus] = useState('waiting');   // waiting, live, won, lost
  const [pct, setPct] = useState(0);
  const [firedAt, setFiredAt] = useState(null);
  const [note, setNote] = useState(null);
  const doneRef = useRef(false);

  // My wheelhouse: where the blade is, and how much of the seam it covers. Good
  // hands make the window wider, never easier to find.
  const half = Math.min(13, 6 + shooting * 0.075);
  const sweet = { min: 76 - half, max: 76 + half };

  const finish = useCallback((win, why, delay = 1500) => {
    if (doneRef.current) return;
    doneRef.current = true;
    setStatus(win ? 'won' : 'lost');
    setNote(why);
    setTimeout(() => onComplete(win), delay);
  }, [onComplete]);

  useEffect(() => {
    if (status === 'waiting') {
      const t = setTimeout(() => setStatus('live'), 600 + Math.random() * 1700);
      return () => clearTimeout(t);
    }
    if (status !== 'live') return;

    // Capped so the pass never outruns the eye.
    let step = Math.min(3.4, Math.max(1.3, 3.1 - shooting * 0.017) * lerpDifficulty(1.0, 1.35, difficulty));
    if ((player.archetype || '').includes('Sniper')) step -= 0.25;

    const tick = setInterval(() => {
      setPct(p => {
        const next = p + step;
        if (next > 112) {
          finish(false, 'the pass went through the seam behind you and out the far side');
          return 112;
        }
        return next;
      });
    }, 20);
    return () => clearInterval(tick);
  }, [status, shooting, player.archetype, difficulty, finish]);

  const fire = () => {
    if (status !== 'live' || doneRef.current) return;
    setFiredAt(pct);
    if (pct >= sweet.min && pct <= sweet.max) {
      finish(true, 'caught it flush and it was in before the goalie moved');
    } else if (pct < sweet.min) {
      finish(false, 'you swung before it got to you and caught nothing but ice');
    } else {
      finish(false, 'it was past your blade and you fanned on it');
    }
  };

  const y = (p) => FROM[1] + (SPAN * Math.max(0, Math.min(112, p))) / 100;
  const puckY = y(firedAt ?? pct);
  const live = status === 'live';

  return (
    <Stage
      hud={
        <Hud
          left={<span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
            Cross-seam feed
          </span>}
          right={
            <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-[0.16em] ${
              live ? 'text-[#F59E0B]' : 'text-slate-600'
            }`}>
              {status === 'waiting' ? 'Setting it up' : live ? 'On its way' : '--'}
            </span>
          }
        />
      }
      verdict={
        <Verdict
          show={status === 'won' || status === 'lost'}
          won={status === 'won'}
          word={status === 'won' ? 'ONE-TIMER' : 'FANNED ON IT'}
          detail={note}
        />
      }
      caption={
        status === 'won' || status === 'lost' ? null
          : 'The window is your own stick blade. Swing when the puck is on it, not when it is coming.'
      }
    >
      <Surface view={ZONE_VIEW}>
        <ZoneSheet />

        {/* The feed, drawn as the pass it is. */}
        <Move move={{ type: 'pass', from: FROM, to: TO }} stops={[TO]} />

        {/* My wheelhouse: the part of the seam my blade covers. Visible, because
            I can see my own stick. */}
        <g>
          <line
            x1={FROM[0] - 3.4} y1={y(sweet.min)} x2={FROM[0] - 3.4} y2={y(sweet.max)}
            stroke="rgba(245,158,11,0.75)" strokeWidth="2.2" strokeLinecap="round"
          />
          {[sweet.min, sweet.max].map(p => (
            <line key={p} x1={FROM[0] - 5.4} y1={y(p)} x2={FROM[0] - 1.6} y2={y(p)}
                  stroke="rgba(245,158,11,0.75)" strokeWidth="0.7" />
          ))}
        </g>

        {/* The man feeding it, and me waiting on my dot. */}
        <Marker at={FROM} kind="mate" label="C" r="4.1" />
        <Marker at={TO} kind="me" label="YOU" r="4.4" />
        {/* My stick, out in the seam where the puck has to be. */}
        <path d={`M ${TO[0] - 1.5} ${TO[1] + 3} L ${FROM[0] - 3.4} ${y(76)}`}
              stroke="rgba(203,213,225,0.85)" strokeWidth="1" strokeLinecap="round" />

        {/* The shot, once it is away. */}
        {status === 'won' && (
          <path d={wavePath([FROM[0] - 3.4, puckY], [90.5, MID - 1.5], [84, 24], 1.5, 7)}
                fill="none" stroke="#fbbf24" strokeWidth="1.7" strokeLinecap="round" />
        )}

        {/* The puck on the seam. */}
        {status !== 'waiting' && (
          <g>
            {firedAt !== null && (
              <circle cx={FROM[0] - 3.4} cy={puckY} r="4"
                      fill="none" stroke={status === 'won' ? '#22E748' : '#ef4444'} strokeWidth="0.9" />
            )}
            <circle cx={FROM[0] - 3.4} cy={puckY} r="1.9" fill="#fff"
                    stroke="rgba(0,0,0,0.6)" strokeWidth="0.55" />
          </g>
        )}
      </Surface>

      <div className="p-3">
        <button
          type="button"
          onClick={fire}
          disabled={!live}
          className={`w-full py-4 rounded-xl border font-black text-sm sm:text-base sports-font uppercase tracking-[0.18em] transition-all ${
            live
              ? 'border-[#F59E0B] bg-[#F59E0B]/15 text-[#F59E0B] cursor-pointer active:scale-[0.99]'
              : 'border-[rgba(255,255,255,0.08)] bg-[#0a0d0a] text-slate-600 cursor-default'
          }`}
        >
          {status === 'waiting' ? 'Wait for the feed' : live ? 'Rip it' : 'Shot gone'}
        </button>
      </div>
    </Stage>
  );
}
