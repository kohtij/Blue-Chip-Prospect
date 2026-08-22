import { useState, useEffect, useRef } from 'react';

export default function AllStarFastestSkater({ onComplete, strategy }) {
  const [gameStarted, setGameStarted] = useState(false);
  const [timeMs, setTimeMs] = useState(0);
  const [strides, setStrides] = useState(0);
  const [expectedLeg, setExpectedLeg] = useState('L'); 
  const [stumble, setStumble] = useState(false);
  
  const timerRef = useRef(null);
  
  // Speed Strategy reduces required strides by 20%
  const targetStrides = strategy === 'speed' ? 24 : 30;

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  const startGame = () => {
    setGameStarted(true);
    const start = Date.now();
    timerRef.current = setInterval(() => {
      setTimeMs(Date.now() - start);
    }, 50);
  };

  const handleStride = (leg) => {
    if (!gameStarted || strides >= targetStrides || stumble) return;

    if (leg === expectedLeg) {
      const newStrides = strides + 1;
      setStrides(newStrides);
      setExpectedLeg(leg === 'L' ? 'R' : 'L');

      if (newStrides >= targetStrides) {
        clearInterval(timerRef.current);
        const endTime = timeMs / 1000;
        
        let ovrBoost = 0, idolBoost = 0, msg = "";

        if (endTime <= 4.0) {
          ovrBoost = 2; idolBoost = 50; msg = "🏆 FLYING! You just broke the Fastest Skater record!";
        } else if (endTime <= 6.0) {
          ovrBoost = 1; idolBoost = 20; msg = "🔥 Incredible speed! You burned around the rink.";
        } else {
          idolBoost = 5; msg = "✅ You made it around, but caught an edge on the final turn.";
        }

        if (strategy === 'grit') idolBoost += 15;

        setTimeout(() => {
           onComplete({ time: endTime, msg, idolBoost, ovrBoost, eventName: 'Fastest Skater' });
        }, 1500);
      }
    } else {
      setStumble(true);
      setTimeout(() => setStumble(false), 300);
    }
  };

  const progress = Math.min(100, (strides / targetStrides) * 100);

  return (
    <div className="w-full max-w-3xl flex flex-col items-center animate-fade-in">
      {strategy && (
         <div className="mb-3 text-[10px] sm:text-xs font-black text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/30 px-3 py-1 rounded-full tracking-widest uppercase shadow-md">
            🎖️ CAPTAIN'S BUFF ACTIVE
         </div>
      )}
      <p className="text-lg text-slate-300 mb-6 font-sans">
        It's time for the <strong>Fastest Skater</strong> competition! Alternate clicking Left and Right to build speed. Don't stumble!
      </p>
      
      <div className="text-4xl font-black sports-font text-[#3b82f6] mb-4">
        {(timeMs / 1000).toFixed(2)}s
      </div>

      {/* REWORKED LAP TRACK */}
      <div className="w-full mb-8 max-w-xl mx-auto">
          <div className="flex justify-between items-end text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 px-1 font-sans">
              <span>START</span>
              <span className="text-white bg-slate-800 px-3 py-0.5 rounded-full border border-slate-600">
                  {strides} / {targetStrides} STRIDES
              </span>
              <span>FINISH</span>
          </div>
          <div className="w-full h-10 bg-slate-800 rounded-full border-4 border-slate-600 relative overflow-hidden shadow-inner flex items-center">
             
             {/* Progress Fill */}
             <div 
                className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-[#3b82f6] to-[#60a5fa] transition-all duration-75 rounded-full z-10" 
                style={{ width: `${progress}%` }}
             ></div>
             
             {/* The Skater Icon */}
             <div 
                className="absolute text-2xl transition-all duration-75 z-20 drop-shadow-lg"
                style={{ left: `calc(${progress}% - 14px)` }}
             >
                ⛸️
             </div>

             {/* Finish Line Flag */}
             <div className="absolute right-2 text-xl opacity-60 z-0">🏁</div>
          </div>
      </div>

      {!gameStarted ? (
         <button onClick={startGame} className="btn-primary py-4 px-10 rounded-xl font-black sports-font text-2xl uppercase tracking-widest hover:scale-105 transition-transform cursor-pointer shadow-[0_0_20px_rgba(59,130,246,0.3)]">
            START EVENT
         </button>
      ) : (
         <div className="flex w-full gap-4 max-w-md mx-auto">
            <button 
              onClick={() => handleStride('L')} 
              disabled={stumble || strides >= targetStrides}
              className={`flex-1 h-32 sm:h-40 rounded-2xl font-black sports-font text-3xl transition-all shadow-xl ${
                expectedLeg === 'L' && !stumble 
                  ? 'bg-[#3b82f6] text-white hover:bg-[#2563eb] scale-105 border-4 border-white' 
                  : 'bg-slate-800 text-slate-500 border-4 border-slate-700'
              } ${stumble ? 'bg-red-900/50 border-red-500 text-red-500' : ''}`}
            >
              LEFT
            </button>
            <button 
              onClick={() => handleStride('R')} 
              disabled={stumble || strides >= targetStrides}
              className={`flex-1 h-32 sm:h-40 rounded-2xl font-black sports-font text-3xl transition-all shadow-xl ${
                expectedLeg === 'R' && !stumble 
                  ? 'bg-[#3b82f6] text-white hover:bg-[#2563eb] scale-105 border-4 border-white' 
                  : 'bg-slate-800 text-slate-500 border-4 border-slate-700'
              } ${stumble ? 'bg-red-900/50 border-red-500 text-red-500' : ''}`}
            >
              RIGHT
            </button>
         </div>
      )}
    </div>
  );
}