import React, { useEffect, useState } from 'react';

// Extracted from App.jsx. Pure component; dependencies imported explicitly.
const ShootoutGame = ({ player, onComplete }) => {
  const [activeZone, setActiveZone] = useState(null);
  const [timeLeft, setTimeLeft] = useState(5000);

  useEffect(() => {
    // Higher shooting stat = weak spot stays open longer. 
    const speed = Math.max(400, 1000 - (player.shooting * 4)); 
    const zoneInterval = setInterval(() => {
      setActiveZone(Math.floor(Math.random() * 5));
    }, speed);

    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 100) {
          clearInterval(zoneInterval);
          clearInterval(timer);
          onComplete(false); // Time ran out
          return 0;
        }
        return t - 100;
      });
    }, 100);

    return () => { clearInterval(zoneInterval); clearInterval(timer); };
  }, [player, onComplete]);

  const zones = [
    { id: 0, label: 'TOP LEFT', cls: 'top-4 left-4 w-16 h-16 sm:w-20 sm:h-20' },
    { id: 1, label: 'TOP RIGHT', cls: 'top-4 right-4 w-16 h-16 sm:w-20 sm:h-20' },
    { id: 2, label: 'FIVE HOLE', cls: 'bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 sm:w-20 sm:h-20' },
    { id: 3, label: 'LOW GLOVE', cls: 'bottom-16 left-4 w-16 h-16 sm:w-20 sm:h-20' },
    { id: 4, label: 'LOW BLOCKER', cls: 'bottom-16 right-4 w-16 h-16 sm:w-20 sm:h-20' }
  ];

  return (
    <div className="w-full max-w-md mx-auto aspect-[4/3] bg-[#e2e8f0] border-4 border-[#ef4444] rounded-lg relative overflow-hidden flex items-center justify-center shadow-inner">
      <div className="absolute inset-0 border-8 border-[#ef4444] rounded opacity-50 pointer-events-none"></div>
      {/* Goalie Graphic Placeholder */}
      <div className="w-3/5 h-4/5 bg-slate-800 rounded-t-[40%] absolute bottom-0 opacity-80 flex flex-col items-center justify-center">
         <span className="text-5xl">🥅</span>
      </div>
      
      {zones.map(z => (
        <button
          key={z.id}
          onClick={() => { if (activeZone === z.id) onComplete(true); }}
          className={`absolute rounded-full border-4 transition-colors font-black sports-font text-[10px] sm:text-xs leading-none z-10 ${
            activeZone === z.id 
              ? 'bg-[#22E748]/90 border-[#22E748] text-white shadow-[0_0_20px_#22E748] scale-110 cursor-pointer animate-pulse' 
              : 'bg-transparent border-[rgba(0,0,0,0.1)] text-transparent pointer-events-none'
          } ${z.cls}`}
        >
          {activeZone === z.id ? 'SHOOT' : ''}
        </button>
      ))}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-1 rounded-full font-black number-font text-xl shadow-lg border border-slate-700">
         {(timeLeft / 1000).toFixed(1)}s
      </div>
    </div>
  );
};

export default ShootoutGame;
