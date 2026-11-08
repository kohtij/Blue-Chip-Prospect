import { useCallback, useEffect, useRef, useState } from 'react';
import { lerpDifficulty } from '../utils/stakes';
import { getActiveStat } from '../utils/gameHelpers';
import { Marker, NetMouth, Goalie, Puck, Surface } from './rink/Ice';
import { MOUTH, MOUTH_VIEW, MOUTH_ZONES } from './rink/geometry';
import { Stage, Hud, Clock, Verdict } from './minigame/Shell';

// The shootout, from the shooter's end.
//
// This was five circles on a pale grey field with a dotted background, one of
// which lit up green, and the game was to click the green one. That is a
// reaction test wearing a hockey costume: the goalie was an emoji and nothing
// you knew about the sport helped you.
//
// Now you are looking at a goal mouth with a goalie in it, and the read is the
// real one. A goalie down in the butterfly seals the ice and opens the top
// corners. A goalie standing tall covers high and leaves the five hole. A
// goalie who has pushed across to his glove side cannot get back to the
// blocker side in time. So you watch his feet and his depth, pick the hole he
// has actually given you, and shoot before the clock kills the attempt.
//
// Shooting widens the margin for error on that read; it does not tell you the
// answer. The stakes decide how fast he moves and how long you have.

export default function ShootoutGame({ player, onComplete, difficulty = 0 }) {
  const shooting = getActiveStat(player, 'shooting');

  // How long the attempt lasts, and how quickly he works across the mouth.
  const shotClock = Math.round(lerpDifficulty(5600, 3400, difficulty));
  const slide = lerpDifficulty(2400, 1500, difficulty);   // ms for a full crossing
  const stance = lerpDifficulty(1500, 950, difficulty);   // ms up-and-down cycle

  // A better shooter can beat a goalie who is only fractionally out of position.
  const edge = Math.max(0.16, 0.52 - shooting * 0.0022);

  const [t, setT] = useState(0);
  const [status, setStatus] = useState('live');
  const [shot, setShot] = useState(null);
  const doneRef = useRef(false);
  const startRef = useRef(null);

  const shift = Math.sin((t / slide) * Math.PI * 2) * 0.95;
  const down = Math.sin((t / stance) * Math.PI * 2 + 1.1) > 0.15;

  // Which holes he has given up, this instant. The glove side is stage left, so
  // pushing to his right opens it.
  const isOpen = useCallback((id, sh, dn) => {
    switch (id) {
      case 0: return dn || sh > edge;            // top glove
      case 1: return dn || sh < -edge;           // top blocker
      case 2: return !dn;                        // five hole
      case 3: return sh > edge + 0.18;           // low glove
      case 4: return sh < -(edge + 0.18);        // low blocker
      default: return false;
    }
  }, [edge]);

  const finish = useCallback((win, delay = 1600) => {
    if (doneRef.current) return;
    doneRef.current = true;
    setStatus(win ? 'scored' : 'stopped');
    setTimeout(() => onComplete(win), delay);
  }, [onComplete]);

  useEffect(() => {
    if (status !== 'live') return;
    if (startRef.current === null) startRef.current = Date.now();
    const tick = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      setT(elapsed);
      if (elapsed >= shotClock) finish(false);
    }, 40);
    return () => clearInterval(tick);
  }, [status, shotClock, finish]);

  const shoot = (zone) => {
    if (doneRef.current) return;
    const open = isOpen(zone.id, shift, down);
    setShot({ zone, open, shift, down });
    finish(open);
  };

  // What happened, said the way a person would say it.
  //
  // The old lines were "he had given it to you" and "he had that covered",
  // which reads like a write-up of the game rather than the game, and told you
  // nothing about the read you had just got right or wrong. These say what he
  // did and what you did with it.
  const callIt = () => {
    if (!shot) return 'You sat on it too long and he poked it off your stick.';
    const { zone, open, down, shift } = shot;
    const across = Math.abs(shift) > edge;
    const glove = zone.id === 0 || zone.id === 3;
    const toHisSide = (shift > 0) === glove;   // he had pushed the way you shot

    if (open) {
      if (zone.id === 2) return 'He stayed tall, and you put it through his feet.';
      if (down && zone.id <= 1) return 'He dropped early and you went upstairs on him.';
      if (across && !toHisSide) return 'He slid across, you waited, and went back the other way.';
      if (down) return 'He was flat on the ice and that corner was wide open.';
      return `${zone.label.toLowerCase()}, and he never got a piece of it.`;
    }
    if (zone.id === 2 && down) return 'He was already down. The five hole shut before you shot.';
    if (across && toHisSide) return 'You shot into the side he had already taken away.';
    if (!down && zone.id <= 1) return 'He was standing tall. That is his glove, all day.';
    return `He had the ${zone.label.toLowerCase()} covered and swallowed it.`;
  };

  const msLeft = shotClock - t;
  const frozen = shot ? shot : null;
  const drawShift = frozen ? frozen.shift : shift;
  const drawDown = frozen ? frozen.down : down;

  return (
    <Stage
      hud={
        <Hud
          left={<span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
            Penalty shot
          </span>}
          right={status === 'live' ? <Clock msLeft={msLeft} msTotal={shotClock} /> : null}
        />
      }
      verdict={
        <Verdict
          show={status !== 'live'}
          won={status === 'scored'}
          word={status === 'scored' ? 'GOAL' : 'NO GOAL'}
          detail={callIt()}
        />
      }
      caption={
        status === 'live'
          ? 'Watch his feet. When he drops, the top corners open up. When he stays tall, the five hole is there. Shoot before the clock kills it.'
          : null
      }
    >
      <Surface view={MOUTH_VIEW}>
        <NetMouth>
          <Goalie shift={drawShift} down={drawDown} beaten={status === 'scored'} />
        </NetMouth>

        {/* The five holes, marked the way a target sheet marks them: always
            visible, never coloured in. Which one is open is the goalie's
            problem to give away, not something the ice announces. */}
        {MOUTH_ZONES.map(z => {
          const hit = shot?.zone.id === z.id;
          const stroke = hit
            ? (shot.open ? '#22E748' : '#ef4444')
            : 'rgba(255,255,255,0.3)';
          return (
            <g key={z.id}>
              <circle
                cx={z.x} cy={z.y} r="6.4"
                fill={hit ? (shot.open ? 'rgba(34,231,72,0.18)' : 'rgba(239,68,68,0.18)') : 'transparent'}
                stroke={stroke} strokeWidth={hit ? 1.5 : 0.7}
                strokeDasharray={hit ? undefined : '2.2 2.4'}
              />
              <line x1={z.x - 2.2} y1={z.y} x2={z.x + 2.2} y2={z.y} stroke={stroke} strokeWidth="0.7" />
              <line x1={z.x} y1={z.y - 2.2} x2={z.x} y2={z.y + 2.2} stroke={stroke} strokeWidth="0.7" />
            </g>
          );
        })}

        {/* The puck, where it finished up. */}
        {shot && (
          <circle cx={shot.zone.x} cy={shot.zone.y} r="2.6" fill="#fff"
                  stroke="rgba(0,0,0,0.6)" strokeWidth="0.7" />
        )}

        {/* Hit areas, over everything, so a tap lands on the hole and not the mesh. */}
        {status === 'live' && MOUTH_ZONES.map(z => (
          <circle
            key={`hit-${z.id}`} cx={z.x} cy={z.y} r="9.5"
            fill="transparent" className="cursor-pointer"
            onClick={() => shoot(z)}
          >
            <title>{z.label}</title>
          </circle>
        ))}

        {/* The shooter, coming in, labelled the way he is everywhere else in the
            game rather than left as an anonymous dot. */}
        <g>
          <Puck at={[50, MOUTH.yBot + 5.2]} r={1.9} />
          <Marker at={[50, MOUTH.yBot + 12]} label="YOU" r={4.3} />
        </g>
      </Surface>

    </Stage>
  );
}
