import { useCallback, useEffect, useRef, useState } from 'react';
import { lerpDifficulty, MIN_REACTION_MS } from '../utils/stakes';
import { getActiveStat } from '../utils/gameHelpers';
import { SlotSheet, Marker, Puck, Surface } from './rink/Ice';
import { SLOT, SLOT_MOUTH, SLOT_VIEW, wavePath, ICE, RED, BLUE } from './rink/geometry';
import { Stage, Hud, Pips, Verdict, ActionButton } from './minigame/Shell';

// End to end.
//
// A forward carrying the puck the length of the ice beats each man the same
// way: he waits for the defender to commit his stick, then takes the puck to
// the side the stick has just left. Go first and a good defender simply
// follows you. Wait too long and he's close enough to take it off you.
//
// Three men, one at a time, and the last one is the final defenceman in front
// of the net. Beat all three and you're in on goal.

const MEN = ['The first forechecker', 'The man in the middle', 'The last defenceman'];

// WHERE ON THE ICE EACH MAN IS.
//
// All three used to be beaten on the same patch of ice in front of their net,
// so nothing said you'd carried it anywhere. Each man now stands in his own
// part of the rink, drawn the same way up as the rest (you skate down the
// screen): your own end with your net behind you, the neutral zone with the
// red line, and their end with their net ahead.
const ZONES = ['Your end', 'Neutral zone', 'Their end'];

function OwnEndSheet() {
  const goal = 5;
  const half = SLOT.netHalf;
  return (
    <g>
      <rect x="0" y="0" width="100" height={SLOT.depth} fill={ICE} />
      {/* Your net behind you, the paint opening down toward the play. */}
      <rect x={50 - half} y={goal - SLOT.netDepth} width={half * 2} height={SLOT.netDepth} rx="1.1"
            fill="rgba(255,255,255,0.12)" stroke="rgba(245,245,245,0.7)" strokeWidth="0.7" />
      <line x1="0" y1={goal} x2="100" y2={goal} stroke={RED} strokeWidth="1.1" />
      <path d={`M ${50 - SLOT.creaseHalf} ${goal} A ${SLOT.creaseHalf} ${SLOT.creaseHalf} 0 0 0 ${50 + SLOT.creaseHalf} ${goal}`}
            fill="rgba(56,120,220,0.16)" stroke={BLUE} strokeWidth="0.7" />
      {[13, 87].map(x => (
        <g key={x}>
          <circle cx={x} cy="22" r="2.6" fill="none" stroke={RED} strokeWidth="0.6" />
          <circle cx={x} cy="22" r="1.15" fill={RED} />
        </g>
      ))}
      {/* The way out of your zone, ahead of you. */}
      <line x1="0" y1="74" x2="100" y2="74" stroke={BLUE} strokeWidth="2.4" />
    </g>
  );
}

function NeutralSheet() {
  return (
    <g>
      <rect x="0" y="0" width="100" height={SLOT.depth} fill={ICE} />
      <line x1="0" y1="5" x2="100" y2="5" stroke={BLUE} strokeWidth="2.4" />
      <circle cx="50" cy="40" r="13" fill="none" stroke={BLUE} strokeWidth="0.6" opacity="0.7" />
      <line x1="0" y1="40" x2="100" y2="40" stroke={RED} strokeWidth="2.2" />
      <circle cx="50" cy="40" r="1.2" fill={BLUE} />
      {[[16, 18], [84, 18], [16, 62], [84, 62]].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="1.15" fill={RED} />
      ))}
      <line x1="0" y1="75" x2="100" y2="75" stroke={BLUE} strokeWidth="2.4" />
    </g>
  );
}

// The rink at the top of the game: where you started, where you are, and how
// far there is still to go.
function ZoneTrack({ at, done }) {
  return (
    <div className="mt-2 grid grid-cols-3 gap-1.5 px-1" aria-label={`${ZONES[Math.min(at, 2)]}, ${done} of 3 beaten`}>
      {ZONES.map((z, i) => {
        const past = i < done;
        const here = i === at && !past;
        return (
          <div key={z} className={`rounded-md px-2 py-1.5 text-center text-[9px] sm:text-[10px] font-black uppercase tracking-[0.14em] ${
            past ? 'bg-[#22E748]/[0.10] text-[#22E748]'
              : here ? 'bg-white/[0.08] text-white'
                : 'bg-white/[0.03] text-slate-600'}`}>
            {z}
          </div>
        );
      })}
    </div>
  );
}
const ME = [50, SLOT.highRow];
const HIS_CLOSE = SLOT.slotRow - 8;

export default function DekeGame({ player, onComplete, difficulty = 0 }) {
  const skating = getActiveStat(player, 'skating');

  // How long the side he's opened stays open. Quick feet keep it open longer.
  const openMs = Math.max(
    MIN_REACTION_MS + 80,
    (300 + skating * 5) * lerpDifficulty(1.0, 0.7, difficulty)
  );

  const [man, setMan] = useState(0);
  const [phase, setPhase] = useState('closing');   // closing, committed, beat, done
  const [reach, setReach] = useState(0);           // -1 his stick to the left, 1 to the right
  const [went, setWent] = useState(0);
  const [beaten, setBeaten] = useState(0);
  const [status, setStatus] = useState('live');
  const [note, setNote] = useState(null);

  const doneRef = useRef(false);
  const timerRef = useRef(null);

  const finish = useCallback((win, why, delay = 1600) => {
    if (doneRef.current) return;
    doneRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    setPhase('done');
    setStatus(win ? 'won' : 'lost');
    setNote(why);
    setTimeout(() => onComplete(win), delay);
  }, [onComplete]);

  // He closes on you, then reaches.
  useEffect(() => {
    if (phase !== 'closing' || doneRef.current) return;
    timerRef.current = setTimeout(() => {
      if (doneRef.current) return;
      setReach(Math.random() < 0.5 ? -1 : 1);
      setPhase('committed');
      timerRef.current = setTimeout(() => {
        finish(false, 'you held it too long and he took it off your stick');
      }, openMs);
    }, 900 + Math.random() * 1300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [phase, man, openMs, finish]);

  const go = (side) => {
    if (doneRef.current || (phase !== 'closing' && phase !== 'committed')) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setWent(side);

    if (phase === 'closing') {
      finish(false, 'you moved first, and he just went with you');
      return;
    }
    if (side === reach) {
      finish(false, 'straight into his stick');
      return;
    }

    const made = beaten + 1;
    setBeaten(made);
    setPhase('beat');
    if (made >= MEN.length) {
      setTimeout(() => finish(true, 'all three beaten, and you finished it yourself', 1800), 650);
    } else {
      setTimeout(() => {
        if (doneRef.current) return;
        setMan(made);
        setReach(0);
        setWent(0);
        setPhase('closing');
      }, 800);
    }
  };

  // Left and right on the keyboard.
  const goRef = useRef(go);
  useEffect(() => { goRef.current = go; });
  useEffect(() => {
    const onKey = (e) => {
      if (e.repeat) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { e.preventDefault(); goRef.current(-1); }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { e.preventDefault(); goRef.current(1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const committed = phase === 'committed';
  const closing = phase === 'closing';
  const scored = status === 'won';

  // He steps up toward you while he waits to reach, and leans with his stick.
  const hisY = closing ? HIS_CLOSE + 4 : HIS_CLOSE;
  const hisX = 50 + (committed || (phase === 'done' && reach) ? reach * 3 : 0);
  const myX = phase === 'beat' || scored ? 50 + went * 22 : 50 + went * 6;
  const myY = phase === 'beat' || scored ? SLOT.slotRow + 4 : ME[1];

  // His stick, from his body toward the puck: straight at you while he waits,
  // swung out to one side when he reaches.
  const stickEnd = reach
    ? [hisX + reach * 11, hisY - 7]
    : [hisX, hisY - 10];

  return (
    <Stage
      keys="Left and right arrows to go"
      hud={
        <>
          <Hud
            left={<Pips label="Beaten" filled={beaten} total={MEN.length} />}
            right={<span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
              {MEN[Math.min(man, MEN.length - 1)]}
            </span>}
          />
          <ZoneTrack at={man} done={beaten} />
        </>
      }
      verdict={
        <Verdict
          show={status !== 'live'}
          won={scored}
          word={scored ? 'GOAL' : 'STRIPPED'}
          detail={note}
        />
      }
      caption={
        status !== 'live' ? null
          : committed ? 'His stick has gone one way. Take the puck the other way.'
            : phase === 'beat' ? 'Past him. Here comes the next one.'
              : 'Wait for his stick to commit. Go first and he follows you.'
      }
    >
      <Surface view={SLOT_VIEW}>
        {/* Each man on his own stretch of ice, faded in as you get there. */}
        <g key={`zone-${man}`} className="fade-up">
          {man === 0 ? <OwnEndSheet /> : man === 1 ? <NeutralSheet /> : <SlotSheet seams={false} />}
        </g>

        {/* The defender. Only the man you're beating now is on the ice. */}
        {phase !== 'beat' && !scored && (
          <g style={{ transition: 'transform 160ms ease-out' }}>
            <line x1={hisX} y1={hisY} x2={stickEnd[0]} y2={stickEnd[1]}
                  stroke={committed ? '#ef4444' : 'rgba(214,52,52,0.75)'} strokeWidth={committed ? 2.2 : 1.6}
                  strokeLinecap="round" />
            <Marker at={[hisX, hisY]} kind="opp" label="D" r="4.8" />
          </g>
        )}
        {(phase === 'beat' || scored) && (
          <g opacity="0.35">
            <Marker at={[50 + reach * 3, HIS_CLOSE]} kind="opp" label="D" r="4.8" />
          </g>
        )}

        {/* The finish, once all three are beaten. */}
        {scored && (
          <path d={wavePath([myX, myY + 5], SLOT_MOUTH, null, 1.2)} fill="none" stroke="#22E748"
                strokeWidth="1.5" strokeLinecap="round" />
        )}

        {/* Me, with the puck out in front. */}
        <g style={{ transition: 'all 220ms ease-out' }}>
          <Marker at={[myX, myY]} kind="me" label="YOU" r="5.2" />
        </g>
        {scored
          ? <Puck at={SLOT_MOUTH} r="2" glow />
          : <Puck at={[myX + went * 3, myY + 7.4]} r="2" />}
      </Surface>

      <div className="flex gap-2 p-3">
        {[{ side: -1, label: 'Go left' }, { side: 1, label: 'Go right' }].map(b => (
          <ActionButton
            key={b.side}
            wide
            onClick={() => go(b.side)}
            disabled={phase === 'done' || phase === 'beat'}
            state={
              went === b.side && phase === 'done' ? (scored ? 'right' : 'wrong')
                : went === b.side && phase === 'beat' ? 'right'
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
