import { useState, useEffect, useRef } from 'react';

export default function AllStarAccuracy({ onComplete, strategy }) {
  const [targets, setTargets] = useState([false, false, false, false]); 
  const [targetStyles, setTargetStyles] = useState([]); 
  const [gameStarted, setGameStarted] = useState(false);
  const [timeMs, setTimeMs] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  const startShooting = () => {
    const generatePos = (quadrant) => {
        let top, left;
        if (quadrant === 0) { top = 5 + Math.random() * 25; left = 5 + Math.random() * 20; }
        if (quadrant === 1) { top = 5 + Math.random() * 25; left = 65 + Math.random() * 20; }
        if (quadrant === 2) { top = 40 + Math.random() * 35; left = 5 + Math.random() * 15; }
        if (quadrant === 3) { top = 40 + Math.random() * 35; left = 70 + Math.random() * 15; }
        return { top: `${top}%`, left: `${left}%` };
    };

    setTargetStyles([generatePos(0), generatePos(1), generatePos(2), generatePos(3)]);
    setGameStarted(true);
    
    const start = Date.now();
    timerRef.current = setInterval(() => {
      setTimeMs(Date.now() - start);
    }, 50);
  };

  const hitTarget = (idx) => {
    if (!gameStarted) return;
    
    const newTargets = [...targets];
    newTargets[idx] = true;
    setTargets(newTargets);

    if (newTargets.every(t => t === true)) {
      clearInterval(timerRef.current);
      const endTime = timeMs / 1000;
      
      let ovrBoost = 0, idolBoost = 0, msg = "";

      if (endTime <= 2.0) {
        ovrBoost = 2; idolBoost = 50; msg = "🏆 INCREDIBLE! You shattered the Accuracy Shooting record!";
      } else if (endTime <= 3.5) {
        ovrBoost = 1; idolBoost = 20; msg = "🔥 Great shooting! You put on a show for the fans.";
      } else {
        idolBoost = 5; msg = "✅ You finished the event, but it wasn't your fastest time.";
      }

      if (strategy === 'grit') idolBoost += 15;

      setTimeout(() => {
         onComplete({ time: endTime, msg, idolBoost, ovrBoost, eventName: 'Accuracy Shooting' });
      }, 1500);
    }
  };

  // Speed Strategy makes the targets massive!
  const targetSizeClass = strategy === 'speed' ? 'w-20 h-20 sm:w-24 sm:h-24' : 'w-14 h-14 sm:w-16 sm:h-16';

  return (
    <div className="w-full max-w-3xl flex flex-col items-center animate-fade-in">
      {strategy && (
         <div className="mb-3 text-[10px] sm:text-xs font-black text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/30 px-3 py-1 rounded-full tracking-widest uppercase shadow-md">
            🎖️ CAPTAIN'S BUFF ACTIVE
         </div>
      )}
      <p className="text-lg text-slate-300 mb-6 font-sans">
        It's time for the <strong>Accuracy Shooting</strong> competition! Break all 4 targets as fast as you can.
      </p>
      
      <div className="text-4xl font-black sports-font text-[#22E748] mb-4">
        {(timeMs / 1000).toFixed(2)}s
      </div>

      <div className="relative w-full max-w-[500px] aspect-[4/3] bg-gradient-to-b from-slate-900 to-black border-4 border-[#ef4444] rounded-lg shadow-[0_0_30px_rgba(239,68,68,0.3)] mb-8 overflow-hidden">
        <div className="absolute bottom-0 inset-x-0 mx-auto w-[55%] h-[85%] bg-[#101410] border-t-4 border-x-4 border-slate-700 rounded-t-[3rem] flex items-center justify-center pointer-events-none shadow-2xl"></div>

        {!gameStarted ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
            <button onClick={startShooting} className="btn-primary py-4 px-10 rounded-xl font-black sports-font text-2xl uppercase tracking-widest hover:scale-105 transition-transform cursor-pointer">
              START EVENT
            </button>
          </div>
        ) : (
          targets.map((isHit, idx) => {
              if (isHit) return null;
              return (
                  <button 
                      key={`target-${idx}`} 
                      onClick={() => hitTarget(idx)} 
                      className={`absolute ${targetSizeClass} bg-white rounded-full border-4 border-[#ef4444] shadow-lg flex items-center justify-center hover:bg-slate-200 active:scale-90 transition-transform cursor-pointer`}
                      style={targetStyles[idx]}
                  >
                      <div className="w-1/3 h-1/3 bg-[#ef4444] rounded-full pointer-events-none"></div>
                  </button>
              )
          })
        )}
      </div>
    </div>
  );
}