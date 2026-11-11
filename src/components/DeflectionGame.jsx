import { useCallback, useEffect, useRef, useState } from 'react';
import { getActiveStat } from '../utils/gameHelpers';
import { buildShot, judge } from '../utils/tipShot';
import { SlotSheet, Marker, Surface } from './rink/Ice';
import { SLOT, SLOT_VIEW, bez, wavePath } from './rink/geometry';
import { Stage, Hud, Verdict } from './minigame/Shell';

// Net-front screen and tip.
//
// The previous version drew the puck travelling down the slot while you held,
// and the lane you were aiming for was a slice of that same path, always
// somewhere in the band 55-80% along it. So the screen handed you the answer:
// one memorised release point, about two thirds of the way down, tipped it
// 64-71% of the time whoever you were. Worse, hockey IQ lengthened the puck's
// crossing time, which shrank the lane, so a 95-rated player won less often
// than a 50-rated one.
//
// What a man in the blue paint actually has is this: his back is to the point,
// a defenceman is leaning on him, and he cannot see the puck through the
// traffic. What he can see is the shooter winding up, and what he knows is how
// long each kind of shot takes to arrive. So that is the game now. You hold the
// screen, you watch the stick, and when it comes through you count the flight
// yourself and put the blade down.
//
// Reacting to the release is not enough: every shot takes longer to arrive than
// a person can react, so letting go on the flash is always early. The read is
// knowing what a slapper does against what a wrister does.
//
// What the ratings buy, the right way round this time:
//   physicality  how wide the tip window is. You are holding your ground
//                against a defenceman, and a stronger man gets his blade free.
//   hockey IQ    how true the flight runs. A good read means the shot arrives
//                when that kind of shot should; a poor one leaves it scattered.
//                At 75 and up you also pick the shot type out of his hands.

// The shot's path down the slot: off the point stick, past the dot, at the net.
// At y 14 the ring drawn round the point man reached up to 7.5 and crossed the
// blue line painted at 8. Both ends come off named rows now.
const FROM = [78, SLOT.pointRow];
const CURVE = [66, 42];
const TO = [50, SLOT.screenRow];
const at = (frac) => bez(FROM, TO, CURVE, Math.max(0, Math.min(1, frac)));

export default function DeflectionGame({ player, onComplete, difficulty = 0 }) {
  const physicality = getActiveStat(player, 'physicality');
  const iq = getActiveStat(player, 'hockeyIQ');

  // Rolled once, lazily, so the shot is fixed before a finger goes down and the
  // roll never happens during a render.
  const [shot] = useState(() => buildShot({ physicality, hockeyIQ: iq, difficulty }));

  const [phase, setPhase] = useState('ready');   // ready, winding, flying, result
  const [outcome, setOutcome] = useState(null);

  const [beat, setBeat] = useState(0);

  const shotAtRef = useRef(null);
  const releaseTimer = useRef(null);
  const lateTimer = useRef(null);
  const beatTimer = useRef(null);
  const doneRef = useRef(false);

  useEffect(() => () => {
    clearTimeout(releaseTimer.current);
    clearTimeout(lateTimer.current);
    clearInterval(beatTimer.current);
  }, []);

  const settle = useCallback((kind, sinceShot) => {
    if (doneRef.current) return;
    doneRef.current = true;
    clearTimeout(releaseTimer.current);
    clearTimeout(lateTimer.current);
    clearInterval(beatTimer.current);

    const won = kind === 'TIPPED';
    setOutcome({ kind, sinceShot, won });
    setPhase('result');
    setTimeout(() => onComplete(won), 2400);
  }, [onComplete]);

  const press = () => {
    if (phase !== 'ready' || doneRef.current) return;
    setPhase('winding');

    // He taps the ice while he loads, on the tempo this shot travels at. The
    // first tap lands as the hold begins and the last one is the shot itself,
    // so the beat runs unbroken into the release and you simply keep it.
    setBeat(1);
    beatTimer.current = setInterval(() => setBeat(b => b + 1), shot.beatMs);

    releaseTimer.current = setTimeout(() => {
      if (doneRef.current) return;
      clearInterval(beatTimer.current);
      shotAtRef.current = performance.now();
      setPhase('flying');

      // If he never lets go, the puck goes past him and the whistle goes. The
      // old version tried to do this from inside a state updater and read a
      // stale phase, so it never fired and the game just sat there.
      lateTimer.current = setTimeout(
        () => settle('LATE', shot.flightMs + shot.windowMs + 400),
        shot.flightMs + shot.windowMs + 400
      );
    }, shot.windupMs);
  };

  const release = () => {
    if (doneRef.current) return;
    if (phase === 'winding') { settle('EARLY', -1); return; }
    if (phase !== 'flying') return;
    settle(judge(shot, performance.now() - shotAtRef.current), performance.now() - shotAtRef.current);
  };

  const revealed = phase === 'result';

  // At the reveal the flight becomes a path again: the window is the stretch of
  // it a blade could have touched, and the puck sits where it was when you let
  // go. Nothing here exists while the shot is live.
  // Arrival is put at four fifths of the drawn path rather than the end of it,
  // so the window reads as a stretch of the slot with room beyond it. Pinned at
  // the end, an overshoot had nowhere to be drawn and the whole reveal bunched
  // up on top of the player.
  const ARRIVAL = 0.8;
  const frac = (ms) => Math.max(0, Math.min(1, (ms / shot.flightMs) * ARRIVAL));
  const laneA = at(frac(shot.flightMs - shot.windowMs));
  const laneB = at(frac(shot.flightMs + shot.windowMs));
  const puck = at(outcome && outcome.sinceShot >= 0 ? frac(outcome.sinceShot) : 0);

  const detail = !outcome ? '' : {
    EARLY: outcome.sinceShot < 0
      ? 'You came off the post before he had even shot it, and the goalie had a clear look the whole way.'
      : 'Your blade went down while it was still coming, and it went under you untouched.',
    LATE: 'It was past you before you moved, and the whistle went for goaltender interference.',
    TIPPED: 'Blade down, half a stick in the lane, and it changes direction.'
  }[outcome.kind];

  return (
    <Stage
      hud={
        <Hud
          left={<span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
            Net front screen
          </span>}
          right={
            <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-[0.16em] ${
              phase === 'flying' ? 'text-[#F59E0B]' : phase === 'winding' ? 'text-[#22E748]' : 'text-slate-600'
            }`}>
              {phase === 'flying'
                ? (shot.telegraphed ? `${shot.typeLabel} · now` : 'Shot away · now')
                : phase === 'winding'
                  ? `Tap ${Math.min(beat, shot.beats)} of ${shot.beats}`
                  : phase === 'ready' ? 'He is loading it up' : '--'}
            </span>
          }
        />
      }
      verdict={<Verdict show={revealed} won={!!outcome?.won}
                        word={outcome?.kind === 'TIPPED' ? 'TIPPED IT'
                          : outcome?.kind === 'LATE' ? 'TOO LONG' : 'TOO EARLY'}
                        detail={detail} />}
      caption={
        revealed ? null
          : phase === 'flying'
            ? 'One more beat. Let go on it.'
            : phase === 'winding'
              ? 'That tapping is his tempo. When he shoots, the puck is one beat away, so let go on the next one.'
              : 'The puck is hard to track through the bodies, so your teammate gives you the tempo instead. He taps the ice while he loads up, and the shot takes one of those beats to reach you.'
      }
    >
      <Surface view={SLOT_VIEW}>
        <SlotSheet />

        {/* The point man. His stick is back while he loads it and through once
            he has hit it. That is the only cue the player gets. */}
        {/* His stick, drawn before he is, so the shaft runs behind him instead
            of straight across his own circle. */}
        <g style={{ transition: 'transform 90ms linear' }}>
          <path
            d={phase === 'winding'
              ? 'M 90 2 L 86 8 L 84 11'       // loaded, blade high behind him
              : 'M 75 17 L 80 14 L 85 13'}    // through the puck
            stroke="rgba(241,245,249,0.85)" strokeWidth="1.5" fill="none"
            strokeLinecap="round" strokeLinejoin="round"
          />
        </g>
        {/* The tap. One ring off his blade on every beat, so the tempo is
            something you can see rather than something you were told to have
            counted. The key remounts the element, which replays the animation. */}
        {phase === 'winding' && beat > 0 && (
          <circle
            key={beat} className="bcp-tap"
            cx={FROM[0]} cy={FROM[1]} r="5.5"
            fill="none" stroke="#22E748" strokeWidth="1.6"
          />
        )}

        <Marker at={[82, 12]} kind="mate" label="D" r="4.3" />

        {/* The release: a ring off his blade that says the puck is gone. The
            puck itself is not drawn, because through two bodies he cannot see
            it, and drawing it is what made this a metronome. */}
        {phase === 'flying' && (
          <circle cx={FROM[0]} cy={FROM[1]} r="6.5" fill="none"
                  stroke="rgba(251,191,36,0.75)" strokeWidth="1.4" />
        )}

        {/* Everything below exists only once it is too late to use. */}
        {revealed && (
          <g>
            <path d={wavePath(FROM, TO, CURVE, 1.3, 7)} fill="none"
                  stroke="rgba(251,191,36,0.3)" strokeWidth="1.1" strokeDasharray="2.4 3" />
            <path d={wavePath(laneA, laneB, null, 1.1, 4)} fill="none"
                  stroke="rgba(34,231,72,0.85)" strokeWidth="2.6" strokeLinecap="round" />
            {[laneA, laneB].map((p, i) => (
              <circle key={i} cx={p[0]} cy={p[1]} r="1.6" fill="#22E748" />
            ))}
            {outcome.sinceShot >= 0 && (
              <g>
                <circle cx={puck[0]} cy={puck[1]} r="5.4" fill="none"
                        stroke={outcome.won ? '#22E748' : '#ef4444'} strokeWidth="1.1" />
                <circle cx={puck[0]} cy={puck[1]} r="2.4" fill="#fff"
                        stroke="rgba(0,0,0,0.6)" strokeWidth="0.7" />
              </g>
            )}
          </g>
        )}

        {/* The defenceman on my back, and me sealing the paint. Far enough
            apart to read as two men: they used to be eight units apart with
            ten units of circle between them, so the labels sat on top of each
            other. */}
        <Marker at={[60, 54]} kind="opp" label="D" r="4.6" />
        <Marker at={[49, 61]} kind="me" label="YOU" r="5" />
      </Surface>

      <div className="p-3">
        {phase === 'ready' && (
          <button
            type="button"
            onPointerDown={press}
            className="w-full py-4 rounded-xl border border-[rgba(255,255,255,0.14)] bg-[#101410] text-slate-200 font-black text-sm sm:text-base sports-font uppercase tracking-[0.18em] hover:border-[#22E748]/70 hover:text-white transition-all active:scale-[0.99] cursor-pointer select-none"
          >
            Press and hold to screen
          </button>
        )}
        {(phase === 'winding' || phase === 'flying') && (
          <button
            type="button"
            onPointerUp={release}
            onPointerLeave={release}
            className={`w-full py-4 rounded-xl border font-black text-sm sm:text-base sports-font uppercase tracking-[0.18em] cursor-pointer select-none transition-colors ${
              phase === 'flying'
                ? 'border-[#F59E0B] bg-[#F59E0B]/15 text-[#F59E0B]'
                : 'border-[rgba(255,255,255,0.14)] bg-[#101410] text-slate-400'
            }`}
          >
            {phase === 'flying' ? 'Let go on the next beat' : `Hold the paint · ${'•'.repeat(Math.min(beat, shot.beats))}`}
          </button>
        )}
        {revealed && (
          <div className="w-full py-4 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0a0d0a] text-center text-[11px] sm:text-xs font-black uppercase tracking-[0.16em] text-slate-500">
            {outcome.won
              ? `${shot.typeLabel} · you had it read`
              : `It was a ${shot.typeLabel.toLowerCase()}`}
          </div>
        )}
      </div>
    </Stage>
  );
}
