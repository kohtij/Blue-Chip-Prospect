import { useState, useEffect, useRef } from 'react';
import { FullSheet, Marker, Surface } from './rink/Ice';
import { LAP_D, LAP_LEN, LAP_START_X, lapPoint } from './rink/geometry';
import { EventHeader, Stage, Verdict, ActionButton } from './minigame/Shell';

// Fastest skater.
//
// The event was a blue gradient filling a grey capsule with an ice-skate emoji
// sliding along it and a chequered flag at the end. It is a timed lap of the
// rink, so now it is one: the skater works his way around the actual sheet,
// past both blue lines and around both ends, and the ground he has covered
// stays behind him as a trail.
//
// The race itself is untouched. Strides still alternate, a wrong leg is still a
// stumble, and the thresholds and rewards are the same, with the captain's
// speed call still taking a fifth off the strides needed.

export default function AllStarFastestSkater({ onComplete, strategy }) {
  const [gameStarted, setGameStarted] = useState(false);
  const [timeMs, setTimeMs] = useState(0);
  const [strides, setStrides] = useState(0);
  const [expectedLeg, setExpectedLeg] = useState('L');
  const [stumble, setStumble] = useState(false);
  const [result, setResult] = useState(null);

  const timerRef = useRef(null);
  // Real start time, so the recorded result is exact even if the race finishes
  // faster than the 50ms display tick (the on-screen clock only resolves to 50ms).
  const startRef = useRef(null);

  // Speed Strategy reduces required strides by 20%
  const targetStrides = strategy === 'speed' ? 24 : 30;

  useEffect(() => () => clearInterval(timerRef.current), []);

  const startGame = () => {
    setGameStarted(true);
    startRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setTimeMs(Date.now() - startRef.current);
    }, 50);
  };

  const handleStride = (leg) => {
    if (!gameStarted || strides >= targetStrides || stumble) return;

    if (leg !== expectedLeg) {
      setStumble(true);
      setTimeout(() => setStumble(false), 300);
      return;
    }

    const newStrides = strides + 1;
    setStrides(newStrides);
    setExpectedLeg(leg === 'L' ? 'R' : 'L');

    if (newStrides < targetStrides) return;

    clearInterval(timerRef.current);
    // Measure off the wall clock, not the 50ms-resolution display value, so a
    // very fast finish is still timed correctly instead of reading as 0.
    const finalElapsedMs = Date.now() - startRef.current;
    setTimeMs(finalElapsedMs);
    const endTime = finalElapsedMs / 1000;

    let ovrBoost = 0, fanBoost = 0, msg = '', word = 'FINISHED';

    if (endTime <= 4.0) {
      ovrBoost = 2; fanBoost = 50; word = 'RECORD';
      msg = 'Around the sheet quicker than anyone has done it. The building is on its feet.';
    } else if (endTime <= 6.0) {
      ovrBoost = 1; fanBoost = 20; word = 'FLYING';
      msg = 'A lap at full flight, and fast enough to put on a show.';
    } else {
      fanBoost = 5;
      msg = 'You got around, but caught an edge on the final turn and lost the time there.';
    }

    if (strategy === 'grit') fanBoost += 15;

    setResult({ word, msg, ovrBoost });
    setTimeout(() => {
      onComplete({ time: endTime, msg, fanBoost, ovrBoost, eventName: 'Fastest Skater' });
    }, 1500);
  };

  const frac = Math.min(1, strides / targetStrides);
  const [sx, sy] = lapPoint(frac);
  const left = targetStrides - strides;

  return (
    <div className="w-full max-w-xl mx-auto fade-up">
      <EventHeader
        event="Fastest skater"
        buff={!!strategy}
        readout={(timeMs / 1000).toFixed(2)}
        unit="sec"
        note={gameStarted
          ? `${left} stride${left === 1 ? '' : 's'} to the line`
          : 'One lap, alternating strides'}
      />

      <div className="mt-4">
        <Stage
          verdict={
            <Verdict
              show={!!result}
              won={result?.ovrBoost > 0}
              word={result?.word}
              detail={result?.msg}
            />
          }
          caption={gameStarted
            ? (stumble ? 'Caught an edge. Find the rhythm again.' : null)
            : 'One lap of the sheet from centre ice, timed. Alternate your strides and do not miss one.'}
        >
          <Surface view="0 0 200 100">
            <FullSheet />

            {/* the route, and the ground already covered */}
            <path d={LAP_D} fill="none" stroke="rgba(255,255,255,0.10)"
                  strokeWidth="0.8" strokeDasharray="3 3" strokeLinecap="round" />
            <path
              d={LAP_D} fill="none"
              stroke={stumble ? '#ef4444' : '#22E748'}
              strokeWidth="1.5" strokeLinecap="round"
              pathLength={LAP_LEN}
              strokeDasharray={`${(frac * LAP_LEN).toFixed(2)} ${LAP_LEN}`}
              opacity="0.85"
              style={{ transition: 'stroke-dasharray 90ms linear' }}
            />

            {/* start and finish, at centre ice on the near boards */}
            <line x1={LAP_START_X} y1="75" x2={LAP_START_X} y2="89"
                  stroke="rgba(255,255,255,0.8)" strokeWidth="1.4" strokeDasharray="2 2" />
            <text x={LAP_START_X} y="95" textAnchor="middle" fontSize="5" fontWeight="900"
                  fill="rgba(255,255,255,0.45)" letterSpacing="0.6"
                  style={{ fontFamily: 'inherit' }}>START</text>

            <g style={{ transition: 'transform 90ms linear' }}>
              <Marker at={[sx, sy]} r={3.6} tone={stumble ? '#ef4444' : '#22E748'} />
            </g>
          </Surface>
        </Stage>
      </div>

      {!gameStarted ? (
        <button
          type="button"
          onClick={startGame}
          className="mt-4 w-full btn-primary py-4 rounded-xl text-base sm:text-lg cursor-pointer sports-font tracking-[0.18em]"
        >
          ON THE CLOCK
        </button>
      ) : (
        <div className="mt-4 flex gap-3">
          <ActionButton
            wide
            onClick={() => handleStride('L')}
            disabled={stumble || strides >= targetStrides}
            state={stumble ? 'wrong' : expectedLeg === 'L' ? 'right' : 'spent'}
          >
            Left
          </ActionButton>
          <ActionButton
            wide
            onClick={() => handleStride('R')}
            disabled={stumble || strides >= targetStrides}
            state={stumble ? 'wrong' : expectedLeg === 'R' ? 'right' : 'spent'}
          >
            Right
          </ActionButton>
        </div>
      )}
    </div>
  );
}
