import { useCallback, useEffect, useRef, useState } from 'react';
import { lerpDifficulty, MIN_REACTION_MS } from '../utils/stakes';
import { getActiveStat } from '../utils/gameHelpers';
import { SlotSheet, Marker, Move, Surface } from './rink/Ice';
import { SLOT_VIEW } from './rink/geometry';
import { Stage, Hud, Verdict, ActionButton, Callout } from './minigame/Shell';

// The breakaway.
//
// The old one was two giant arrow emoji and a pair of grey rectangles marked
// LEFT PAD and RIGHT PAD. The decision underneath it is the interesting part of
// goaltending, so it survives intact: you can cheat to a side and take the deke
// out of his hands at the cost of leaving the other half of the net empty, or
// you can stay square and back your reflexes.
//
// Now it is drawn from your crease: the ice running away to the blue line, a
// shooter coming down on you with the puck, and his move shown as the carry it
// is. Cheating a side moves you off your post, visibly, before he has decided.

const CHOICES = [
  { id: 'cheatLeft', label: 'Cheat to your left', kind: 'gamble' },
  { id: 'hold', label: 'Stay square and react', kind: 'safe' },
  { id: 'cheatRight', label: 'Cheat to your right', kind: 'gamble' }
];

export default function BreakawayGame({ player, onComplete, difficulty = 0 }) {
  const iq = getActiveStat(player, 'hockeyIQ');

  const [phase, setPhase] = useState('setup');   // setup, closing, deking, result
  const [plan, setPlan] = useState(null);
  const [went, setWent] = useState(null);        // the side he actually went
  const [dove, setDove] = useState(null);        // the pad I threw out
  const [status, setStatus] = useState('live');
  const [note, setNote] = useState(null);
  const [closing, setClosing] = useState(0);     // 0 at the blue line, 1 on top of me

  const doneRef = useRef(false);
  const timersRef = useRef([]);

  const finish = useCallback((win, why, delay = 1600) => {
    if (doneRef.current) return;
    doneRef.current = true;
    setStatus(win ? 'saved' : 'beaten');
    setNote(why);
    timersRef.current.forEach(clearTimeout);
    setTimeout(() => onComplete(win), delay);
  }, [onComplete]);

  useEffect(() => {
    if (phase !== 'closing') return;

    // He skates in for a moment or two before he commits to anything.
    const skate = setInterval(() => setClosing(c => Math.min(1, c + 0.035)), 50);
    const commit = setTimeout(() => {
      clearInterval(skate);
      if (doneRef.current) return;

      const side = Math.random() > 0.5 ? 'left' : 'right';
      setWent(side);

      if (plan === 'cheatLeft' || plan === 'cheatRight') {
        const read = (plan === 'cheatLeft' && side === 'left') || (plan === 'cheatRight' && side === 'right');
        setPhase('result');
        finish(read,
          read ? 'you were already there and he had nowhere to put it'
            : 'he went the other way into the half of the net you had given him');
        return;
      }

      setPhase('deking');
      let window = Math.min(900, (450 + iq * 5) * lerpDifficulty(1.0, 0.72, difficulty));
      const arch = player.archetype || '';
      if (arch.includes('Reflex') || arch.includes('Butterfly')) window += 100;

      const late = setTimeout(() => {
        if (doneRef.current) return;
        setPhase('result');
        finish(false, 'you never got the pad across in time');
      }, Math.max(MIN_REACTION_MS, window));
      timersRef.current.push(late);
    }, 1000 + Math.random() * 1500);

    timersRef.current.push(commit);
    return () => { clearInterval(skate); clearTimeout(commit); };
  }, [phase, plan, iq, player.archetype, difficulty, finish]);

  const start = (id) => { setPlan(id); setPhase('closing'); };

  const pad = (side) => {
    if (phase !== 'deking' || doneRef.current) return;
    setDove(side);
    setPhase('result');
    finish(side === went,
      side === went ? 'read the deke and got the pad there'
        : 'he had already gone the other way');
  };

  // Where I am standing. Cheating a side shows before he has moved.
  const lean = plan === 'cheatLeft' ? -1 : plan === 'cheatRight' ? 1 : 0;
  const shift = dove ? (dove === 'left' ? -1 : 1) : lean;
  const shooterY = 16 + closing * 30;
  const shooterX = went ? (went === 'left' ? 32 : 68) : 50;

  if (phase === 'setup') {
    return (
      <div className="w-full max-w-xl mx-auto fade-up">
        <p className="text-center text-sm sm:text-base text-slate-300 leading-relaxed">
          He is coming in alone. You can take the deke away by committing to a side early, or you
          can stay on your feet and back yourself to get there.
        </p>
        <div className="mt-6 flex flex-col gap-2.5">
          {CHOICES.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => start(c.id)}
              className={`w-full py-4 px-4 rounded-xl border text-xs sm:text-sm font-black uppercase tracking-[0.16em] transition-all cursor-pointer active:scale-[0.99] ${
                c.kind === 'gamble'
                  ? 'border-[#F59E0B]/50 bg-[#F59E0B]/[0.07] text-[#F59E0B] hover:border-[#F59E0B]'
                  : 'border-[rgba(255,255,255,0.14)] bg-[#101410] text-slate-200 hover:border-[#22E748]/70 hover:text-white'
              }`}
            >
              <span className="block">{c.label}</span>
              <span className="block mt-1 text-[9px] sm:text-[10px] font-black tracking-[0.2em] opacity-70">
                {c.kind === 'gamble' ? 'No reflex needed, half the net open' : 'Nothing given away, all on your hands'}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Stage
      hud={
        <Hud
          left={<span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
            {plan === 'hold' ? 'Square to the shooter' : 'Cheating a side'}
          </span>}
          right={
            <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-[0.16em] ${
              phase === 'deking' ? 'text-[#22E748]' : 'text-slate-600'
            }`}>
              {phase === 'result' ? '--' : phase === 'deking' ? 'He has moved' : 'Closing'}
            </span>
          }
        />
      }
      verdict={
        <Verdict
          show={status !== 'live'}
          won={status === 'saved'}
          word={status === 'saved' ? 'ROBBED HIM' : 'HE SCORED'}
          detail={note}
        />
      }
      caption={
        status !== 'live' ? null
          : phase === 'deking' ? 'Now. Pick a pad.'
            : 'Watch his shoulders.'
      }
    >
      <Surface view={SLOT_VIEW}>
        <SlotSheet seams={false} />

        {/* The shooter, with the puck, and his move once he makes it. */}
        {went && (
          <Move
            move={{ type: 'carry', from: [50, shooterY - 14], to: [shooterX, shooterY] }}
            stops={[[shooterX, shooterY]]}
          />
        )}
        <Marker at={[shooterX, shooterY]} kind="opp" label="LW" r="4.6" />

        {/* Me. The lean is visible before he commits, which is the cost of
            cheating: he can see it too. */}
        <g style={{ transition: 'transform 110ms ease-out' }} transform={`translate(${shift * 11} 0)`}>
          <path d="M 44 62 L 56 62 L 58 70 L 42 70 Z"
                fill={status === 'beaten' ? 'rgba(120,130,145,0.55)' : 'rgba(203,213,225,0.9)'} />
          <Marker at={[50, 60]} kind="me" label="G" r="5" />
        </g>
      </Surface>

      {phase === 'closing' && plan !== 'hold' && (
        <Callout text="Committed" y="80%" />
      )}

      {plan === 'hold' && (
        <div className="flex gap-2 p-3 pt-0">
          {['left', 'right'].map(side => (
            <ActionButton
              key={side}
              wide
              onClick={() => pad(side)}
              disabled={phase !== 'deking'}
              state={
                phase === 'result'
                  ? (side === dove ? (side === went ? 'right' : 'wrong') : side === went ? 'right' : 'spent')
                  : phase === 'deking' ? 'idle' : 'spent'
              }
            >
              {side === 'left' ? 'Left pad' : 'Right pad'}
            </ActionButton>
          ))}
        </div>
      )}
    </Stage>
  );
}
