import { useState, useRef, useMemo } from 'react';
import { getActiveStat } from '../utils/gameHelpers';
import { lerpDifficulty, MIN_TIMING_MS } from '../utils/stakes';

// Net-front screen and tip.
//
// This game was unwinnable for most of the roster. Its green zone was built from
// two independent edges, a minimum that rose as physicality fell and a maximum
// that fell at the same time, with another five points taken off each side in a
// final. Below 55 physicality in a final the two edges crossed and the zone had
// negative width, so no input could win it. Even at the top end the bar crossed
// the whole track in under a second, which made the nominal 7% zone a window of
// about fifty milliseconds, well under what a person can time.
//
// It is now expressed in time, which is the thing the player actually has to
// judge, and the window can never fall below what a human can hit.
export default function DeflectionGame({ player, onComplete, difficulty = 0 }) {
  const physicality = getActiveStat(player, 'physicality');
  const iq = getActiveStat(player, 'hockeyIQ');

  // How long the marker takes to cross the whole track, and how long the green
  // zone lasts as it passes. Both shrink with difficulty and grow with the
  // relevant rating, and the window has a hard floor.
  // Drawn once per mount so the zone does not jump if the component re-renders.
  const [centerSeed] = useState(() => Math.random());

  const { sweetSpotMin, sweetSpotMax, speed } = useMemo(() => {
    const crossMs = lerpDifficulty(2600, 1700, difficulty) * (1 + (iq - 50) * 0.004);
    const windowMs = Math.max(
      MIN_TIMING_MS,
      lerpDifficulty(460, 260, difficulty) * (1 + (physicality - 50) * 0.005)
    );

    // The zone sits late on the track so there is a real hold, and moves a little
    // from one attempt to the next so it cannot be played from muscle memory.
    const widthPct = Math.min(42, (windowMs / crossMs) * 100);
    const center = 58 + centerSeed * 22;
    const half = widthPct / 2;
    const min = Math.max(2, Math.min(center - half, 96 - widthPct));
    return {
      sweetSpotMin: min,
      sweetSpotMax: min + widthPct,
      // The track is driven on a 20ms tick, so this is percent per tick.
      speed: (100 / crossMs) * 20
    };
  }, [physicality, iq, difficulty, centerSeed]);

  const [phase, setPhase] = useState('ready'); // ready, active, result
  const [progress, setProgress] = useState(0);
  const [resultMsg, setResultMsg] = useState('');

  const intervalRef = useRef(null);
  const isProcessingRef = useRef(false);

  const handlePress = () => {
    if (phase === 'ready') {
      isProcessingRef.current = false;
      setPhase('active');
      intervalRef.current = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            clearInterval(intervalRef.current);
            handleRelease(100);
            return 100;
          }
          return p + speed;
        });
      }, 20);
    }
  };

  const handleRelease = (manualProgress = null) => {
    if (phase !== 'active' || isProcessingRef.current) return;
    isProcessingRef.current = true;

    clearInterval(intervalRef.current);
    setPhase('result');

    const finalP = manualProgress !== null ? manualProgress : progress;

    if (finalP < sweetSpotMin) {
      setResultMsg('Released too early! You lost your net-front position.');
      setTimeout(() => onComplete(false), 2000);
    } else if (finalP > sweetSpotMax) {
      setResultMsg('Held too long! Whistled for goaltender interference.');
      setTimeout(() => onComplete(false), 2000);
    } else {
      setResultMsg('Perfect screen and tip! Goal!');
      setTimeout(() => onComplete(true), 2000);
    }
  };

  return (
    <div className="game-panel p-6 sm:p-8 text-center animate-fade-in max-w-lg mx-auto border-t-2 border-[#3b82f6]">
      <p className="text-slate-300 font-sans mb-6 text-sm sm:text-base">
        Hold <strong className="text-[#3b82f6]">SCREEN GOALIE</strong> to establish position.
        Release exactly when the puck arrives in the green zone to tip it!
      </p>

      <div className="w-full h-12 bg-[#101410] rounded-full relative overflow-hidden border-2 border-slate-700 mb-8">
        <div
          className="absolute top-0 bottom-0 bg-[#22E748]/30 border-l border-r border-[#22E748]"
          style={{ left: `${sweetSpotMin}%`, right: `${100 - sweetSpotMax}%` }}
        ></div>
        <div
          className="absolute top-0 bottom-0 w-3 bg-white rounded-full shadow-[0_0_10px_white]"
          style={{ left: `${progress}%`, transform: 'translateX(-50%)' }}
        ></div>
      </div>

      {phase === 'ready' && (
        <button
          onPointerDown={handlePress}
          className="w-full py-6 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] text-white font-black text-xl sm:text-2xl sports-font uppercase transition-all shadow-[0_0_20px_rgba(59,130,246,0.4)] active:scale-95 cursor-pointer select-none"
        >
          PRESS &amp; HOLD TO SCREEN
        </button>
      )}
      {phase === 'active' && (
        <button
          onPointerUp={() => handleRelease()}
          onPointerLeave={() => handleRelease()}
          className="w-full py-6 rounded-xl bg-[#F59E0B] text-black font-black text-xl sm:text-2xl sports-font uppercase shadow-[0_0_20px_rgba(245,158,11,0.5)] cursor-pointer select-none"
        >
          RELEASE TO DEFLECT!
        </button>
      )}
      {phase === 'result' && (
        <div className="w-full py-6 rounded-xl bg-[#101410] border border-slate-600 text-white font-black text-lg sm:text-xl sports-font uppercase">
          {resultMsg}
        </div>
      )}
    </div>
  );
}