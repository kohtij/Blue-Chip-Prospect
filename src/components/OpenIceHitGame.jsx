import { useCallback, useEffect, useRef, useState } from 'react';
import { lerpDifficulty } from '../utils/stakes';
import { getActiveStat } from '../utils/gameHelpers';
import { SlotSheet, Marker, Puck, Surface } from './rink/Ice';
import { SLOT, SLOT_VIEW } from './rink/geometry';
import { Stage, Hud, Pips, Verdict, Callout, ActionButton } from './minigame/Shell';

// The open-ice hit.
//
// Every other skater game asks when to do something. This one also asks
// whether to do it at all. A man carrying the puck over your blue line with his
// eyes on it is there to be hit; the same man with his head up has seen you,
// and the big hit is exactly what he wants you to try, because he steps round
// it and he's in alone. So on every rush you watch his head first and the
// distance second.
//
// Four rushes, three needed. Hit a man with his head down while he's in reach,
// or hold your ground on a man who's looked up. Anything else is a rush lost:
// too early and he skates round you, too late and it's interference. It was
// two of three, which a coin flip on each rush won half the time.

const RUSHES = 4;
const NEEDED = 3;

const ME = [50, SLOT.slotRow];
const END_Y = SLOT.screenRow + 2;
const START_Y = 1;
const LANES = SLOT.lanes;

// Where he is at a point in his rush: he comes over the line in one of the
// lanes and angles in to go by me on one side.
function carrierAt(cfg, p) {
  const t = Math.max(0, Math.min(1, p / 100));
  const x = cfg.x + (cfg.passX - cfg.x) * t;
  const y = START_Y + (END_Y - START_Y) * t;
  return [x, y];
}

export default function OpenIceHitGame({ player, onComplete, difficulty = 0 }) {
  const phys = getActiveStat(player, 'physicality');

  // How far away a hit still lands. A bigger man covers more ice when he steps
  // into it.
  const reach = 15 + phys * 0.06;

  const [rush, setRush] = useState(0);
  const [phase, setPhase] = useState('gap');     // gap, coming, result
  const [cfg, setCfg] = useState(null);
  const [p, setP] = useState(0);
  const [won, setWon] = useState(0);
  const [results, setResults] = useState([]);    // true or false per rush
  const [hitAt, setHitAt] = useState(null);
  const [line, setLine] = useState(null);
  const [status, setStatus] = useState('live');
  const [note, setNote] = useState(null);

  const doneRef = useRef(false);
  const pRef = useRef(0);
  const cfgRef = useRef(null);
  const phaseRef = useRef('gap');
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  const finish = useCallback((win, why, delay = 1500) => {
    if (doneRef.current) return;
    doneRef.current = true;
    setStatus(win ? 'won' : 'lost');
    setNote(why);
    setTimeout(() => onComplete(win), delay);
  }, [onComplete]);

  // One rush settled: score it, then either the next man or the verdict.
  const settle = useCallback((good, what) => {
    if (phaseRef.current !== 'coming' || doneRef.current) return;
    phaseRef.current = 'result';
    setPhase('result');
    setLine(what);
    const total = won + (good ? 1 : 0);
    const played = rush + 1;
    setWon(total);
    setResults(r => [...r, good]);

    const left = RUSHES - played;
    if (total >= NEEDED) {
      setTimeout(() => finish(true, `${total} of ${played} rushes won`), 900);
    } else if (total + left < NEEDED) {
      setTimeout(() => finish(false, `${total} of ${played} rushes won`), 900);
    } else {
      setTimeout(() => {
        if (doneRef.current) return;
        setRush(played);
        setHitAt(null);
        setLine(null);
        setPhase('gap');
      }, 1100);
    }
  }, [won, rush, finish]);

  // A man lines up at the far blue line, then comes.
  useEffect(() => {
    if (phase !== 'gap' || doneRef.current) return;
    const t = setTimeout(() => {
      if (doneRef.current) return;
      const lane = Math.floor(Math.random() * LANES.length);
      const side = LANES[lane] < 50 ? -1 : LANES[lane] > 50 ? 1 : (Math.random() < 0.5 ? -1 : 1);
      const next = {
        x: LANES[lane],
        passX: 50 + side * 9,
        // Some of them look up, and they look up before they're in reach, so
        // a player who watches has time to see it.
        headUp: Math.random() < 0.45,
        liftAt: 15 + Math.random() * 17
      };
      cfgRef.current = next;
      pRef.current = 0;
      setCfg(next);
      setP(0);
      setPhase('coming');
    }, 700 + Math.random() * 900);
    return () => clearTimeout(t);
  }, [phase]);

  // He skates. Quicker in a big game.
  useEffect(() => {
    if (phase !== 'coming') return;
    const step = 1.45 * lerpDifficulty(1.0, 1.4, difficulty);
    const tick = setInterval(() => {
      const next = pRef.current + step;
      pRef.current = next;
      setP(next);
      if (next >= 100) {
        clearInterval(tick);
        const c = cfgRef.current;
        if (c?.headUp) settle(true, 'You stayed home, and he had nowhere to go.');
        else settle(false, 'His head was down the whole way and you let him by.');
      }
    }, 20);
    return () => clearInterval(tick);
  }, [phase, difficulty, settle]);

  const hit = () => {
    if (phase !== 'coming' || doneRef.current) return;
    const c = cfgRef.current;
    const at = carrierAt(c, pRef.current);
    const dist = Math.hypot(at[0] - ME[0], at[1] - ME[1]);
    const lookedUp = c.headUp && pRef.current >= c.liftAt;
    const past = at[1] > ME[1] + 2;
    setHitAt(at);

    if (past) settle(false, 'Late, and from the side. Two minutes for interference.');
    else if (dist > reach) settle(false, 'You went too early, and he skated round you.');
    else if (lookedUp) settle(false, 'He saw you coming, stepped round you, and he was in alone.');
    else settle(true, 'Shoulder to chest, and he never saw it.');
  };

  // Space or Enter throws the hit.
  const hitRef = useRef(hit);
  useEffect(() => { hitRef.current = hit; });
  useEffect(() => {
    const onKey = (e) => {
      if (e.repeat || !(e.key === ' ' || e.key === 'Enter')) return;
      e.preventDefault();
      hitRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const coming = phase === 'coming' || phase === 'result';
  const at = cfg ? carrierAt(cfg, p) : null;
  const headUp = !!cfg && cfg.headUp && p >= cfg.liftAt;
  const inReach = !!at && Math.hypot(at[0] - ME[0], at[1] - ME[1]) <= reach && at[1] <= ME[1] + 2;
  const flattened = phase === 'result' && hitAt && results[results.length - 1] === true;

  return (
    <Stage
      keys="Space or Enter to hit"
      hud={
        <Hud
          left={<Pips label="Won" filled={won} total={RUSHES} />}
          right={<span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
            Rush {Math.min(rush + 1, RUSHES)} of {RUSHES}
          </span>}
        />
      }
      verdict={
        <Verdict
          show={status !== 'live'}
          won={status === 'won'}
          word={status === 'won' ? 'LIGHTS OUT' : 'BEATEN'}
          detail={note}
        />
      }
      caption={
        status !== 'live' ? null
          : line ? line
            : 'Hit him if his head stays down. If he looks up, hold your ground and let him come to you.'
      }
    >
      <Surface view={SLOT_VIEW}>
        <SlotSheet seams={false} />

        {/* How far a hit reaches. It lights when he's in it. */}
        <circle cx={ME[0]} cy={ME[1]} r={reach} fill={inReach && phase === 'coming' ? 'rgba(34,231,72,0.06)' : 'none'}
                stroke={inReach && phase === 'coming' ? 'rgba(34,231,72,0.55)' : 'rgba(255,255,255,0.14)'}
                strokeWidth="0.7" strokeDasharray="2.4 2.4" />

        {/* The carrier, with the puck out in front of him. */}
        {coming && at && (
          <g opacity={flattened ? 0.5 : 1}>
            {headUp && phase === 'coming' && (
              <circle cx={at[0]} cy={at[1]} r="7.4" fill="none" stroke="#F59E0B" strokeWidth="1.1" />
            )}
            <Marker at={at} kind="opp" label="F" r="4.6" />
            {!flattened && <Puck at={[at[0] + 1.5, at[1] + 6.4]} r="1.9" />}
          </g>
        )}

        {/* Me, stepping into it if I've thrown the hit. */}
        <Marker at={hitAt && flattened ? [hitAt[0], hitAt[1] + 5.5] : ME} kind="me" label="YOU" r="5.2" />
        {flattened && <Puck at={[hitAt[0] + 7, hitAt[1] + 9]} r="1.9" />}
      </Surface>

      {phase === 'coming' && headUp && <Callout text="Head up" tone="stop" y="14%" />}

      <div className="flex p-3">
        <ActionButton
          wide
          onClick={hit}
          disabled={phase !== 'coming'}
          state={phase === 'result' ? (results[results.length - 1] ? 'right' : 'wrong') : 'idle'}
        >
          Hit him
        </ActionButton>
      </div>
    </Stage>
  );
}
