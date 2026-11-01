import { useCallback, useEffect, useRef, useState } from 'react';
import { lerpDifficulty, MIN_REACTION_MS } from '../utils/stakes';
import { getActiveStat } from '../utils/gameHelpers';
import { NetMouth, Goalie, Surface } from './rink/Ice';
import { MOUTH, MOUTH_VIEW, MOUTH_ZONES, wavePath } from './rink/geometry';
import { Stage, Hud, Pips, Verdict } from './minigame/Shell';

// Rapid fire in the crease.
//
// This was whack-a-mole: a three-by-three grid of grey squares with black
// circles popping out of them. Nothing about it was hockey, and the pucks
// arrived nowhere in particular.
//
// Same mechanic, honest picture. You are in your own goal mouth and they are
// teeing up from the slot. Each puck comes in at one of the five holes with the
// shot drawn behind it, and you have to get to it. Five saves and the barrage
// is over; three past you and it isn't.

const NEEDED = 5;
const ALLOWED = 3;

export default function CreaseGame({ player, onComplete, difficulty = 0 }) {
  const iq = getActiveStat(player, 'hockeyIQ');
  const physicality = getActiveStat(player, 'physicality');

  const [shots, setShots] = useState([]);     // live pucks
  const [saves, setSaves] = useState(0);
  const [beaten, setBeaten] = useState(0);
  const [status, setStatus] = useState('live');
  const [flash, setFlash] = useState(null);   // the last thing that happened

  const doneRef = useRef(false);
  const timersRef = useRef(new Set());

  const finish = useCallback((win, delay = 1500) => {
    if (doneRef.current) return;
    doneRef.current = true;
    setStatus(win ? 'held' : 'beaten');
    timersRef.current.forEach(clearTimeout);
    timersRef.current.clear();
    setTimeout(() => onComplete(win), delay);
  }, [onComplete]);

  useEffect(() => {
    if (status !== 'live') return;
    if (saves >= NEEDED) { finish(true); return; }
    if (beaten >= ALLOWED) { finish(false); return; }

    // Both slide with the stakes, and a puck is always on screen long enough to
    // be reachable by a person.
    const pace = lerpDifficulty(1.0, 0.7, difficulty);
    const gap = Math.max(420, (1100 - iq * 4) * pace);
    const life = Math.max(MIN_REACTION_MS + 150, (1350 - physicality * 3) * pace);

    const timers = timersRef.current;
    const spawn = setInterval(() => {
      if (doneRef.current) return;
      const id = Math.random().toString(36).slice(2);
      const zone = MOUTH_ZONES[Math.floor(Math.random() * MOUTH_ZONES.length)];
      // Where it was shot from, so the shot line reads as coming out of the slot.
      const from = [34 + Math.random() * 32, MOUTH.yBot + 16];
      setShots(s => [...s, { id, zone, from }]);

      const kill = setTimeout(() => {
        timers.delete(kill);
        if (doneRef.current) return;
        setShots(cur => {
          if (!cur.some(s => s.id === id)) return cur;
          setBeaten(b => b + 1);
          setFlash({ kind: 'goal', label: zone.label });
          return cur.filter(s => s.id !== id);
        });
      }, life);
      timers.add(kill);
    }, gap);

    return () => {
      clearInterval(spawn);
      timers.forEach(clearTimeout);
      timers.clear();
    };
  }, [status, saves, beaten, iq, physicality, difficulty, finish]);

  const save = (shot) => {
    if (doneRef.current) return;
    setShots(s => s.filter(x => x.id !== shot.id));
    setSaves(v => v + 1);
    setFlash({ kind: 'save', label: shot.zone.label });
  };

  return (
    <Stage
      hud={
        <Hud
          left={<Pips label="Saves" filled={saves} total={NEEDED} />}
          right={<Pips label="Past you" filled={beaten} total={ALLOWED} tone="bad" />}
        />
      }
      verdict={
        <Verdict
          show={status !== 'live'}
          won={status === 'held'}
          word={status === 'held' ? 'HELD THE FORT' : 'BEATEN'}
          detail={status === 'held'
            ? `${NEEDED} saves on the barrage`
            : `three past you, the last one ${flash?.label?.toLowerCase() || 'in tight'}`}
        />
      }
      caption={
        status !== 'live' ? null
          : flash
            ? flash.kind === 'save'
              ? `Turned that one aside, ${flash.label.toLowerCase()}.`
              : `That one found the ${flash.label.toLowerCase()}.`
            : 'They are teeing up from the slot. Get a piece of everything.'
      }
    >
      <Surface view={MOUTH_VIEW}>
        <NetMouth>
          <Goalie shift={0} down beaten={status === 'beaten'} />
        </NetMouth>

        {/* The holes, marked faintly, so the mouth has landmarks without the
            game telling you where the next shot is going. */}
        {MOUTH_ZONES.map(z => (
          <circle key={z.id} cx={z.x} cy={z.y} r="6.4" fill="none"
                  stroke="rgba(255,255,255,0.12)" strokeWidth="0.6" strokeDasharray="2.2 2.4" />
        ))}

        {/* Each live puck, with the shot drawn behind it. */}
        {shots.map(s => (
          <g key={s.id}>
            <path d={wavePath(s.from, [s.zone.x, s.zone.y], null, 1.3, 6)}
                  fill="none" stroke="rgba(251,191,36,0.55)" strokeWidth="1.1" strokeLinecap="round" />
            <circle cx={s.zone.x} cy={s.zone.y} r="7" fill="transparent"
                    className="cursor-pointer" onClick={() => save(s)} />
            <circle cx={s.zone.x} cy={s.zone.y} r="3.1" fill="#fff"
                    stroke="rgba(0,0,0,0.6)" strokeWidth="0.8" className="pointer-events-none" />
          </g>
        ))}
      </Surface>
    </Stage>
  );
}
