import { useState, useEffect, useRef } from 'react';
import { NetMouth, Surface } from './rink/Ice';
import { MOUTH, MOUTH_VIEW } from './rink/geometry';
import { EventHeader, Stage, Verdict } from './minigame/Shell';

// Accuracy shooting.
//
// Four white discs floating on a grey gradient with a rounded grey shape behind
// them that was meant to be a net. The event itself is exactly right, so the
// targets are now where they are at the real thing: breakaway targets hung in
// the four corners of the goal mouth, which you shoot out one at a time.
//
// The timings and the rewards are untouched. The captain's speed buff still
// makes the targets bigger.

const QUADRANTS = [
  { x: [0.16, 0.34], y: [0.16, 0.34] },   // top glove
  { x: [0.66, 0.84], y: [0.16, 0.34] },   // top blocker
  { x: [0.14, 0.30], y: [0.66, 0.84] },   // low glove
  { x: [0.70, 0.86], y: [0.66, 0.84] }    // low blocker
];

export default function AllStarAccuracy({ onComplete, strategy }) {
  const [targets, setTargets] = useState([false, false, false, false]);
  const [spots, setSpots] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [timeMs, setTimeMs] = useState(0);
  const [result, setResult] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => () => clearInterval(timerRef.current), []);

  const startShooting = () => {
    const { x1, x2, yTop, yBot } = MOUTH;
    const w = x2 - x1;
    const h = yBot - yTop;
    setSpots(QUADRANTS.map(q => ({
      cx: x1 + w * (q.x[0] + Math.random() * (q.x[1] - q.x[0])),
      cy: yTop + h * (q.y[0] + Math.random() * (q.y[1] - q.y[0]))
    })));
    setGameStarted(true);

    const start = Date.now();
    timerRef.current = setInterval(() => setTimeMs(Date.now() - start), 50);
  };

  const hitTarget = (idx) => {
    if (!gameStarted) return;
    const next = [...targets];
    next[idx] = true;
    setTargets(next);

    if (next.every(Boolean)) {
      clearInterval(timerRef.current);
      const endTime = timeMs / 1000;

      let ovrBoost = 0, fanBoost = 0, msg = '';
      if (endTime <= 2.0) {
        ovrBoost = 2; fanBoost = 50; msg = 'All four gone in under two seconds. That is a new record and the building knows it.';
      } else if (endTime <= 3.5) {
        ovrBoost = 1; fanBoost = 20; msg = 'Four for four, and quick enough to put on a show.';
      } else {
        fanBoost = 5; msg = 'You cleared all four, but not at the pace that wins this.';
      }
      if (strategy === 'grit') fanBoost += 15;

      setResult({ endTime, msg, ovrBoost });
      setTimeout(() => {
        onComplete({ time: endTime, msg, fanBoost, ovrBoost, eventName: 'Accuracy Shooting' });
      }, 1500);
    }
  };

  // The captain's speed call makes the targets bigger.
  const r = strategy === 'speed' ? 8.6 : 6.2;
  const left = targets.filter(t => !t).length;

  return (
    <div className="w-full max-w-xl mx-auto fade-up">
      <EventHeader
        event="Accuracy shooting"
        buff={!!strategy}
        readout={(timeMs / 1000).toFixed(2)}
        unit="sec"
        note={gameStarted ? `${left} target${left === 1 ? '' : 's'} left` : 'Four targets, one at a time'}
      />

      <div className="mt-4">
        <Stage
          verdict={
            <Verdict
              show={!!result}
              won={result?.ovrBoost > 0}
              word={result?.endTime <= 2.0 ? 'RECORD' : result?.ovrBoost ? 'CLEARED' : 'FINISHED'}
              detail={result?.msg}
            />
          }
          caption={gameStarted ? null : 'They are hung in the four corners. Shoot them out as fast as you can.'}
        >
          <Surface view={MOUTH_VIEW}>
            <NetMouth>
              {spots.map((s, i) => targets[i] ? null : (
                <g key={i}>
                  <circle cx={s.cx} cy={s.cy} r={r} fill="rgba(241,245,249,0.95)"
                          stroke="#e8453f" strokeWidth="1.6" />
                  <circle cx={s.cx} cy={s.cy} r={r * 0.46} fill="#e8453f" />
                  <circle cx={s.cx} cy={s.cy} r={r + 3} fill="transparent"
                          className="cursor-pointer" onClick={() => hitTarget(i)} />
                </g>
              ))}
              {/* a target already shot out leaves its mount swinging */}
              {spots.map((s, i) => targets[i] ? (
                <g key={`gone-${i}`} opacity="0.4">
                  <line x1={s.cx} y1={MOUTH.yTop} x2={s.cx} y2={s.cy - 1}
                        stroke="rgba(255,255,255,0.22)" strokeWidth="0.5" />
                  <circle cx={s.cx} cy={s.cy} r="1.6" fill="none"
                          stroke="rgba(34,231,72,0.8)" strokeWidth="0.9" />
                </g>
              ) : null)}
            </NetMouth>
          </Surface>
        </Stage>
      </div>

      {!gameStarted && (
        <button
          type="button"
          onClick={startShooting}
          className="mt-4 w-full btn-primary py-4 rounded-xl text-base sm:text-lg cursor-pointer sports-font tracking-[0.18em]"
        >
          ON THE CLOCK
        </button>
      )}
    </div>
  );
}
