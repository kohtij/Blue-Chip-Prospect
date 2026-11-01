import { useState, useEffect, useRef } from 'react';
import { NetMouth, Surface } from './rink/Ice';
import { MOUTH, MOUTH_VIEW, wavePath } from './rink/geometry';
import { EventHeader, Stage, Pips, Verdict } from './minigame/Shell';

// Hardest shot.
//
// A fat grey capsule with five coloured bands and a white bar bouncing along it.
// The mechanic is a timing bar and there is no dishonest way around that, so it
// stays, but it is now a contact meter under the net you are shooting at: catch
// it in the middle of the blade and the radar gun reads what it reads.
//
// Three attempts, best speed counts, and the thresholds are untouched. The
// captain's power call still slows the meter down.

export default function AllStarHardestShot({ onComplete, strategy }) {
  const [gameStarted, setGameStarted] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [power, setPower] = useState(0);
  const [isStopping, setIsStopping] = useState(false);
  const [bestSpeed, setBestSpeed] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(null);
  const [result, setResult] = useState(null);

  const animationRef = useRef(null);
  const powerRef = useRef(0);
  const directionRef = useRef(1);

  useEffect(() => {
    // The power call slows the meter down significantly.
    const step = strategy === 'power' ? 2.2 : 3.5;

    const animate = () => {
      powerRef.current += step * directionRef.current;
      if (powerRef.current >= 100) { powerRef.current = 100; directionRef.current = -1; }
      else if (powerRef.current <= 0) { powerRef.current = 0; directionRef.current = 1; }
      setPower(powerRef.current);
      animationRef.current = requestAnimationFrame(animate);
    };

    if (gameStarted && !isStopping && attempts < 3) {
      animationRef.current = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(animationRef.current);
  }, [gameStarted, isStopping, attempts, strategy]);

  const handleShoot = () => {
    if (!gameStarted || isStopping || attempts >= 3) return;
    setIsStopping(true);
    cancelAnimationFrame(animationRef.current);

    const off = Math.abs(power - 50);
    const accuracy = 100 - off * 2;
    const speed = 82 + accuracy * 0.26 + Math.random() * 2;
    setCurrentSpeed(speed);

    let newBest = bestSpeed;
    if (speed > bestSpeed) { setBestSpeed(speed); newBest = speed; }

    setTimeout(() => {
      const next = attempts + 1;
      setAttempts(next);
      if (next < 3) {
        powerRef.current = 0;
        directionRef.current = 1;
        setPower(0);
        setIsStopping(false);
        setCurrentSpeed(null);
      } else {
        let ovrBoost = 0, fanBoost = 0, msg = '';
        if (newBest >= 105) {
          ovrBoost = 2; fanBoost = 50; msg = 'Past a hundred and five. You won the thing and the radar gun needed a sit down.';
        } else if (newBest >= 100) {
          ovrBoost = 1; fanBoost = 20; msg = 'Through the hundred mark, and the crowd came for exactly that.';
        } else {
          fanBoost = 5; msg = 'Solid contact all three times, but triple digits stayed out of reach.';
        }
        if (strategy === 'grit') fanBoost += 15;

        setResult({ newBest, msg, ovrBoost });
        setTimeout(() => {
          onComplete({ speed: newBest, msg, fanBoost, ovrBoost, eventName: 'Hardest Shot' });
        }, 1500);
      }
    }, 1500);
  };

  const live = gameStarted && !isStopping && attempts < 3;

  return (
    <div className="w-full max-w-xl mx-auto fade-up">
      <EventHeader
        event="Hardest shot"
        buff={!!strategy}
        readout={currentSpeed ? currentSpeed.toFixed(1) : bestSpeed ? bestSpeed.toFixed(1) : '—'}
        unit="mph"
        note={bestSpeed ? `Best of ${Math.min(attempts + 1, 3)}` : 'Three attempts, best one counts'}
      />

      <div className="mt-4">
        <Stage
          hud={
            <div className="flex items-center justify-between gap-4 px-1">
              <Pips label="Attempts" filled={attempts} total={3} />
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                Radar gun
              </span>
            </div>
          }
          verdict={
            <Verdict
              show={!!result}
              won={result?.ovrBoost > 0}
              word={result?.newBest >= 105 ? 'RECORD' : result?.ovrBoost ? 'BIG SHOT' : 'THAT IS ALL'}
              detail={result?.msg}
            />
          }
          caption={
            gameStarted
              ? 'Flush contact is the middle of the blade. Everything either side of it leaks power.'
              : 'One slap shot from the hash marks, three times.'
          }
        >
          <Surface view={MOUTH_VIEW}>
            <NetMouth />
            {/* the shot, when one has just been let go */}
            {currentSpeed && (
              <path
                d={wavePath([50, MOUTH.yBot + 14], [50, 34], null, 1.6, 6)}
                fill="none"
                stroke={currentSpeed >= 100 ? '#22E748' : '#fbbf24'}
                strokeWidth="2.1" strokeLinecap="round"
              />
            )}
            {currentSpeed && (
              <circle cx="50" cy="34" r="3" fill="#fff" stroke="rgba(0,0,0,0.6)" strokeWidth="0.8" />
            )}
            {/* the shooter at the hash marks */}
            <circle cx="50" cy={MOUTH.yBot + 14} r="3.8" fill="#22E748"
                    stroke="rgba(0,0,0,0.55)" strokeWidth="0.6" />
          </Surface>

          {/* the contact meter */}
          <div className="p-3 pt-0">
            <div className="relative h-9 rounded-xl border border-[rgba(255,255,255,0.1)] bg-[#0a0d0a] overflow-hidden">
              <div className="absolute inset-y-0 left-0 w-1/4 bg-[#ef4444]/15" />
              <div className="absolute inset-y-0 left-1/4 w-[15%] bg-[#F59E0B]/15" />
              <div className="absolute inset-y-0 left-[40%] w-[20%] bg-[#22E748]/20 border-x border-[#22E748]/50" />
              <div className="absolute inset-y-0 left-[60%] w-[15%] bg-[#F59E0B]/15" />
              <div className="absolute inset-y-0 right-0 w-1/4 bg-[#ef4444]/15" />
              <div
                className="absolute inset-y-1 w-[3px] rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)]"
                style={{ left: `calc(${power}% - 1.5px)` }}
              />
            </div>
          </div>
        </Stage>
      </div>

      {!gameStarted ? (
        <button
          type="button"
          onClick={() => setGameStarted(true)}
          className="mt-4 w-full btn-primary py-4 rounded-xl text-base sm:text-lg cursor-pointer sports-font tracking-[0.18em]"
        >
          STEP UP
        </button>
      ) : (
        <button
          type="button"
          onClick={handleShoot}
          disabled={!live}
          className={`mt-4 w-full py-4 rounded-xl border font-black text-base sm:text-lg sports-font uppercase tracking-[0.18em] transition-all ${
            live
              ? 'border-[#ef4444] bg-[#ef4444]/15 text-[#ef4444] cursor-pointer active:scale-[0.99]'
              : 'border-[rgba(255,255,255,0.08)] bg-[#0a0d0a] text-slate-600 cursor-default'
          }`}
        >
          {attempts >= 3 ? 'Done' : isStopping ? 'On the gun' : 'Let it go'}
        </button>
      )}
    </div>
  );
}
