import { useCallback, useEffect, useRef, useState } from 'react';
import { lerpDifficulty } from '../utils/stakes';
import { getActiveStat } from '../utils/gameHelpers';
import { SlotSheet, Marker, Puck, Surface } from './rink/Ice';
import { SLOT, SLOT_VIEW, wavePath } from './rink/geometry';
import { Stage, Hud, Pips, Verdict, Callout, ActionButton } from './minigame/Shell';

// Rebound control.
//
// The other goalie games are about stopping the puck. This one is about what
// happens after. A low shot from the point can't be caught, only kicked, and
// their forward is already crashing the net to get to wherever it lands. Kick
// it to the corner he isn't going to, and the play's dead.
//
// He picks a corner as the shot comes, and now and then he cuts back to the
// other one halfway there, which is why you watch him instead of guessing.
// Three shots, and one rebound onto his stick ends it.

const NEEDED = 3;
const ME = [50, SLOT.screenRow + 1];
const CORNER = { [-1]: [11, SLOT.goalLine - 6], [1]: [89, SLOT.goalLine - 6] };
const HIS_START = [50, SLOT.highRow + 2];

// Where he is after a fraction of the shot's flight, heading for his first
// corner and, if he cuts, turning for the other one.
function crasherAt(cfg, p) {
  const t = Math.max(0, Math.min(1, p / 100));
  const first = CORNER[cfg.first];
  if (!cfg.cuts || t <= cfg.cutAt / 100) {
    // Heading for his first corner, most of the way there by the time it lands.
    return [HIS_START[0] + (first[0] - HIS_START[0]) * t * 0.7, HIS_START[1] + (first[1] - HIS_START[1]) * t * 0.7];
  }
  const turn = cfg.cutAt / 100;
  const from = [HIS_START[0] + (first[0] - HIS_START[0]) * turn * 0.7, HIS_START[1] + (first[1] - HIS_START[1]) * turn * 0.7];
  const to = CORNER[-cfg.first];
  const k = (t - turn) / (1 - turn);
  return [from[0] + (to[0] - from[0]) * k * 0.75, from[1] + (to[1] - from[1]) * k * 0.75];
}

export default function ReboundGame({ player, onComplete, difficulty = 0 }) {
  const iq = getActiveStat(player, 'hockeyIQ');

  // How long the shot takes to reach you, which is all the time there is to
  // read him. Reading the game buys a little more of it.
  const flightMs = Math.max(560, (650 + iq * 4) * lerpDifficulty(1.0, 0.72, difficulty));

  const [phase, setPhase] = useState('set');     // set, shot, result
  const [cfg, setCfg] = useState(null);
  const [p, setP] = useState(0);
  const [kicked, setKicked] = useState(null);
  const [saves, setSaves] = useState(0);
  const [line, setLine] = useState(null);
  const [status, setStatus] = useState('live');
  const [note, setNote] = useState(null);

  const doneRef = useRef(false);
  const pRef = useRef(0);
  const cfgRef = useRef(null);
  const phaseRef = useRef('set');
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  const finish = useCallback((win, why, delay = 1500) => {
    if (doneRef.current) return;
    doneRef.current = true;
    setStatus(win ? 'won' : 'lost');
    setNote(why);
    setTimeout(() => onComplete(win), delay);
  }, [onComplete]);

  // The point man gets it and winds up.
  useEffect(() => {
    if (phase !== 'set' || doneRef.current) return;
    const t = setTimeout(() => {
      if (doneRef.current) return;
      const next = {
        shooterX: SLOT.lanes[Math.floor(Math.random() * SLOT.lanes.length)],
        first: Math.random() < 0.5 ? -1 : 1,
        cuts: Math.random() < 0.35,
        cutAt: 30 + Math.random() * 22
      };
      cfgRef.current = next;
      pRef.current = 0;
      setCfg(next);
      setP(0);
      setKicked(null);
      setPhase('shot');
    }, 800 + Math.random() * 900);
    return () => clearTimeout(t);
  }, [phase]);

  const resolve = useCallback((side) => {
    if (phaseRef.current !== 'shot' || doneRef.current) return;
    phaseRef.current = 'result';
    setPhase('result');
    setKicked(side);
    const c = cfgRef.current;
    // Where he ends up. A man who's going to cut back ends up in the other
    // corner whether or not he's turned yet, so kicking it before you've seen
    // which way he's really going is a guess.
    const heLandsIn = c.cuts ? -c.first : c.first;

    if (side === null) {
      finish(false, 'it came off your pads into the slot and he buried it');
      return;
    }
    if (side === heLandsIn) {
      finish(false, c.cuts ? 'he cut back, and you kicked it right to him' : 'you kicked it right onto his stick');
      return;
    }
    const made = saves + 1;
    setSaves(made);
    if (made >= NEEDED) {
      setTimeout(() => finish(true, 'three shots, three dead rebounds'), 700);
    } else {
      setLine(c.cuts ? 'He cut back, and you saw it. Dead rebound.' : 'Into the empty corner. Dead rebound.');
      setTimeout(() => {
        if (doneRef.current) return;
        setLine(null);
        setPhase('set');
      }, 1100);
    }
  }, [saves, finish]);

  // The shot in flight. If it reaches you before you've decided, the pads
  // decide for you, and the pads put it in the slot.
  useEffect(() => {
    if (phase !== 'shot') return;
    const step = 100 / (flightMs / 20);
    const tick = setInterval(() => {
      const next = Math.min(100, pRef.current + step);
      pRef.current = next;
      setP(next);
      if (next >= 100) {
        clearInterval(tick);
        resolve(null);
      }
    }, 20);
    return () => clearInterval(tick);
  }, [phase, flightMs, resolve]);

  // Left and right kick it, for anybody on a keyboard.
  const kickRef = useRef(resolve);
  useEffect(() => { kickRef.current = resolve; });
  useEffect(() => {
    const onKey = (e) => {
      if (e.repeat) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { e.preventDefault(); kickRef.current(-1); }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { e.preventDefault(); kickRef.current(1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const live = phase === 'shot';
  const shooter = [cfg?.shooterX ?? 50, SLOT.pointRow];
  const puckAt = cfg && live
    ? [shooter[0] + (ME[0] - shooter[0]) * (p / 100), shooter[1] + (ME[1] - 6 - shooter[1]) * (p / 100)]
    : null;
  const him = cfg ? crasherAt(cfg, phase === 'set' ? 0 : p) : HIS_START;
  const cutting = !!cfg && cfg.cuts && p > cfg.cutAt && live;
  const kickTo = kicked !== null && phase === 'result' ? CORNER[kicked] : null;

  return (
    <Stage
      keys="Left and right arrows to kick it"
      hud={
        <Hud
          left={<Pips label="Dead rebounds" filled={saves} total={NEEDED} />}
          right={<span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
            Low shot from the point
          </span>}
        />
      }
      verdict={
        <Verdict
          show={status !== 'live'}
          won={status === 'won'}
          word={status === 'won' ? 'NOTHING GIVEN' : 'REBOUND GOAL'}
          detail={note}
        />
      }
      caption={
        status !== 'live' ? null
          : line ? line
            : live ? 'Kick it to the corner he isn\'t going to.'
              : 'Watch the man crashing the net, not the shooter.'
      }
    >
      <Surface view={SLOT_VIEW}>
        <SlotSheet seams={false} />

        {/* The point man, and the shot once it's away. */}
        <Marker at={shooter} kind="opp" label="D" r="4.3" />
        {live && puckAt && (
          <path d={wavePath(shooter, puckAt, null, 1.1, 5)} fill="none" stroke="rgba(239,68,68,0.6)"
                strokeWidth="1.2" strokeLinecap="round" />
        )}
        {puckAt && <Puck at={puckAt} r="2" />}

        {/* The forward crashing the net. */}
        <g>
          {cutting && <circle cx={him[0]} cy={him[1]} r="7.2" fill="none" stroke="#F59E0B" strokeWidth="1" />}
          <Marker at={him} kind="opp" label="F" r="4.6" />
        </g>

        {/* The rebound, where I sent it. */}
        {kickTo && (
          <>
            <path d={`M ${ME[0]} ${ME[1] - 5} L ${kickTo[0]} ${kickTo[1]}`} stroke="rgba(255,255,255,0.4)"
                  strokeWidth="1.1" strokeDasharray="2.6 2" fill="none" />
            <Puck at={kickTo} r="2" />
          </>
        )}

        <Marker at={ME} kind="me" label="YOU" r="5.4" />
      </Surface>

      {cutting && <Callout text="Cutting back" tone="stop" y="12%" />}

      <div className="flex gap-2 p-3">
        {[{ side: -1, label: 'Kick it left' }, { side: 1, label: 'Kick it right' }].map(b => (
          <ActionButton
            key={b.side}
            wide
            onClick={() => resolve(b.side)}
            disabled={!live}
            state={
              phase === 'result' && kicked === b.side
                ? (status === 'lost' ? 'wrong' : 'right')
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
