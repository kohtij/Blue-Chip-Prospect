import { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../AppContext';
import { applyOvrDelta, recomputeOvr, capIdol } from '../utils/gameHelpers';

export default function AllStarScreen() {
  const { setPlayer, setScreen } = useAppContext();
  
  const [phase, setPhase] = useState('red-carpet'); // 'red-carpet', 'minigame', 'result'
  const [carpetFeedback, setCarpetFeedback] = useState(null);

  // Minigame State
  const [targets, setTargets] = useState([false, false, false, false]); // TL, TR, BL, BR
  const [gameStarted, setGameStarted] = useState(false);
  const [timeMs, setTimeMs] = useState(0);
  const [finalTime, setFinalTime] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  const handleCarpetChoice = (isRisky) => {
    let msg, idolHit;
    if (isRisky) {
      const success = Math.random() > 0.4;
      if (success) {
        msg = "Your bold, flashy suit went viral! The fans absolutely loved the swagger.";
        idolHit = 40;
      } else {
        msg = "You tried a wild fashion statement and got completely roasted on social media.";
        idolHit = -15;
      }
    } else {
      msg = "You spent an hour signing autographs for kids. A classic, classy move.";
      idolHit = 15;
    }

    setCarpetFeedback({ msg, idolHit });
    setPlayer(p => ({ ...p, idolatry: capIdol(p.idolatry + idolHit) }));
    setTimeout(() => setPhase('minigame'), 3000);
  };

  const startShooting = () => {
    setGameStarted(true);
    const start = Date.now();
    timerRef.current = setInterval(() => {
      setTimeMs(Date.now() - start);
    }, 50);
  };

  const hitTarget = (idx) => {
    if (!gameStarted || finalTime) return;
    
    const newTargets = [...targets];
    newTargets[idx] = true;
    setTargets(newTargets);

    if (newTargets.every(t => t === true)) {
      clearInterval(timerRef.current);
      const endTime = timeMs / 1000;
      setFinalTime(endTime);
      
      // Calculate Reward based on time
      let ovrBoost = 0;
      let idolBoost = 0;
      let msg = "";

      if (endTime <= 2.0) {
        ovrBoost = 2; idolBoost = 50; msg = "🏆 INCREDIBLE! You shattered the Accuracy Shooting record!";
      } else if (endTime <= 3.5) {
        ovrBoost = 1; idolBoost = 20; msg = "🔥 Great shooting! You put on a show for the fans.";
      } else {
        idolBoost = 5; msg = "✅ You finished the event, but it wasn't your fastest time.";
      }

      setTimeout(() => {
        setPlayer(p => {
          const withOvr = applyOvrDelta(p, ovrBoost);
          return { ...withOvr, idolatry: capIdol(withOvr.idolatry + idolBoost), ovr: recomputeOvr(withOvr) };
        });
        setCarpetFeedback({ msg, idolHit: idolBoost, ovrHit: ovrBoost, time: endTime });
        setPhase('result');
      }, 1500);
    }
  };

  const finishAllStar = () => {
    // Route to the trade deadline to continue the mid-season flow
    setScreen('trade-deadline');
  };

  return (
    <div className="game-panel p-6 sm:p-12 mt-2 border-t-2 border-t-[#3b82f6] text-center flex flex-col items-center">
      <h2 className="text-4xl sm:text-5xl font-black mb-2 text-[#3b82f6] sports-font tracking-tighter uppercase leading-tight">
        ⭐ ALL-STAR WEEKEND ⭐
      </h2>

      {phase === 'red-carpet' && (
        <div className="max-w-2xl w-full mt-6 animate-fade-in">
          {!carpetFeedback ? (
            <>
              <p className="text-lg text-slate-300 mb-8 font-sans">
                You've arrived at the arena for the All-Star Game! The red carpet is swarming with media and fans. How do you want to make your entrance?
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-2">
                <button 
                  onClick={() => handleCarpetChoice(false)}
                  className="bg-[#101410] hover:bg-[#1a2230] border border-[#3b82f6]/40 p-6 rounded-xl flex flex-col gap-2 transition-all hover:scale-105 hover:z-10 relative shadow-lg cursor-pointer"
                >
                  <span className="text-sm font-black text-[#3b82f6] tracking-widest uppercase">SAFE</span>
                  <span className="text-xl font-bold text-white sports-font uppercase">Sign Autographs</span>
                  <span className="text-xs text-slate-400 font-sans">Give the kids a memory they'll never forget.</span>
                </button>
                <button 
                  onClick={() => handleCarpetChoice(true)}
                  className="bg-[#101410] hover:bg-[#1a2230] border border-[#ef4444]/40 p-6 rounded-xl flex flex-col gap-2 transition-all hover:scale-105 hover:z-10 relative shadow-lg cursor-pointer"
                >
                  <span className="text-sm font-black text-[#ef4444] tracking-widest uppercase">RISKY</span>
                  <span className="text-xl font-bold text-white sports-font uppercase">Drip Check</span>
                  <span className="text-xs text-slate-400 font-sans">Wear an absurdly flashy designer outfit.</span>
                </button>
              </div>
            </>
          ) : (
            <div className="bg-[#101410] border border-[rgba(255,255,255,0.1)] p-8 rounded-xl shadow-2xl">
               <p className="text-xl font-bold text-white mb-4">{carpetFeedback.msg}</p>
               <span className={`font-black sports-font tracking-widest text-lg px-4 py-2 rounded-lg border ${carpetFeedback.idolHit > 0 ? 'text-[#22E748] bg-[#22E748]/10 border-[#22E748]/30' : 'text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]/30'}`}>
                 {carpetFeedback.idolHit > 0 ? '📈' : '📉'} {carpetFeedback.idolHit > 0 ? '+' : ''}{carpetFeedback.idolHit} FANS
               </span>
               <p className="text-sm text-slate-500 font-black tracking-widest uppercase mt-6 animate-pulse">
                 Heading to the ice...
               </p>
            </div>
          )}
        </div>
      )}

      {phase === 'minigame' && (
        <div className="max-w-3xl w-full mt-6 animate-fade-in flex flex-col items-center">
          <p className="text-lg text-slate-300 mb-6 font-sans">
            It's time for the <strong>Accuracy Shooting</strong> competition! Break all 4 targets as fast as you can.
          </p>
          
          <div className="text-4xl font-black sports-font text-[#22E748] mb-4">
            {(timeMs / 1000).toFixed(2)}s
          </div>

          <div className="relative w-full max-w-[500px] aspect-[4/3] bg-gradient-to-b from-slate-900 to-black border-4 border-[#ef4444] rounded-lg shadow-[0_0_30px_rgba(239,68,68,0.3)] mb-8 overflow-hidden">
            {/* Goalie Cutout Graphic */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-[70%] bg-[#101410] border-t-2 border-x-2 border-slate-700 rounded-t-3xl flex items-center justify-center pointer-events-none">
              <span className="text-slate-600 font-black sports-font text-2xl tracking-widest opacity-50">SHOOTER TUTOR</span>
            </div>

            {/* The 4 Targets */}
            {!gameStarted ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
                <button onClick={startShooting} className="btn-primary py-4 px-10 rounded-xl font-black sports-font text-2xl uppercase tracking-widest hover:scale-105 transition-transform">
                  START EVENT
                </button>
              </div>
            ) : (
              <>
                {/* Top Left */}
                {!targets[0] && <button onClick={() => hitTarget(0)} className="absolute top-4 left-4 w-16 h-16 bg-white rounded-full border-4 border-[#ef4444] shadow-lg flex items-center justify-center hover:bg-slate-200 active:scale-90 transition-transform"><div className="w-6 h-6 bg-[#ef4444] rounded-full"></div></button>}
                {/* Top Right */}
                {!targets[1] && <button onClick={() => hitTarget(1)} className="absolute top-4 right-4 w-16 h-16 bg-white rounded-full border-4 border-[#ef4444] shadow-lg flex items-center justify-center hover:bg-slate-200 active:scale-90 transition-transform"><div className="w-6 h-6 bg-[#ef4444] rounded-full"></div></button>}
                {/* Bottom Left */}
                {!targets[2] && <button onClick={() => hitTarget(2)} className="absolute bottom-4 left-4 w-16 h-16 bg-white rounded-full border-4 border-[#ef4444] shadow-lg flex items-center justify-center hover:bg-slate-200 active:scale-90 transition-transform"><div className="w-6 h-6 bg-[#ef4444] rounded-full"></div></button>}
                {/* Bottom Right */}
                {!targets[3] && <button onClick={() => hitTarget(3)} className="absolute bottom-4 right-4 w-16 h-16 bg-white rounded-full border-4 border-[#ef4444] shadow-lg flex items-center justify-center hover:bg-slate-200 active:scale-90 transition-transform"><div className="w-6 h-6 bg-[#ef4444] rounded-full"></div></button>}
              </>
            )}
          </div>
        </div>
      )}

      {phase === 'result' && carpetFeedback && (
        <div className="max-w-2xl w-full mt-6 animate-fade-in bg-[#101410] border border-[#22E748]/40 p-8 rounded-xl shadow-[0_0_25px_rgba(34,231,72,0.15)]">
           <p className="text-2xl font-bold text-white mb-2 sports-font uppercase">{carpetFeedback.msg}</p>
           <p className="text-lg text-slate-400 mb-6 font-sans">Final Time: <strong className="text-white">{carpetFeedback.time.toFixed(2)} Seconds</strong></p>
           
           <div className="flex justify-center gap-3">
             {carpetFeedback.idolHit > 0 && (
               <span className="font-black sports-font tracking-widest text-sm px-4 py-2 rounded border text-[#22E748] bg-[#22E748]/10 border-[#22E748]/30">
                 +{carpetFeedback.idolHit} FANS
               </span>
             )}
             {carpetFeedback.ovrHit > 0 && (
               <span className="font-black sports-font tracking-widest text-sm px-4 py-2 rounded border text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/30">
                 +{carpetFeedback.ovrHit} OVR
               </span>
             )}
           </div>

           <button onClick={finishAllStar} className="mt-8 btn-primary w-full py-4 rounded-xl font-black sports-font tracking-widest text-lg uppercase transition-transform hover:scale-105">
             RETURN TO SEASON
           </button>
        </div>
      )}
    </div>
  );
}