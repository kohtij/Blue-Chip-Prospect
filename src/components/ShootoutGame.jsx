import  { useCallback, useEffect, useState, useRef } from 'react';

const ShootoutGame = ({ player, onComplete }) => {
  const [activeZone, setActiveZone] = useState(null);
  const [timeLeft, setTimeLeft] = useState(5000);
  const [jitter, setJitter] = useState({ x: 0, y: 0 });
  const [status, setStatus] = useState('playing');
  const poolRef = useRef([]);
  const doneRef = useRef(false);

  const finish = useCallback((win, delay = 1500) => {
    if (doneRef.current) return;
    doneRef.current = true;
    setStatus(win ? 'won' : 'lost');
    setTimeout(() => onComplete(win), delay);
  }, [onComplete]);

  useEffect(() => {
    if (status !== 'playing') return;

    let timeoutId;

    const getNextZone = () => {
      if (poolRef.current.length === 0) {
        poolRef.current = [0, 1, 2, 3, 4].sort(() => Math.random() - 0.5);
      }
      return poolRef.current.pop();
    };

    const triggerNextZone = () => {
      const nextZ = getNextZone();
      setActiveZone(nextZ);

      const jX = Math.floor(Math.random() * 21) - 10;
      const jY = Math.floor(Math.random() * 21) - 10;
      setJitter({ x: jX, y: jY });

      const baseSpeed = Math.max(400, 1000 - ((player?.shooting || 50) * 4));
      const randomOffset = Math.floor(Math.random() * 201) - 100;
      const speed = Math.max(300, baseSpeed + randomOffset);

      timeoutId = setTimeout(triggerNextZone, speed);
    };

    triggerNextZone();

    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 100) {
          clearTimeout(timeoutId);
          clearInterval(timer);
          finish(false); 
          return 0;
        }
        return t - 100;
      });
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(timer);
    };
  }, [player, status, finish]);

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
      
      <div className={`w-3/5 h-4/5 ${status === 'won' ? 'bg-[#22E748]/20' : status === 'lost' ? 'bg-[#ef4444]/20' : 'bg-slate-800'} rounded-t-[40%] absolute bottom-0 opacity-80 flex flex-col items-center justify-center transition-colors duration-300`}>
         <span className="text-5xl">{status === 'won' ? '🚨' : status === 'lost' ? '🧱' : '🥅'}</span>
         {status === 'won' && <span className="bg-[#14532d] text-[#4ade80] border border-[#22c55e] px-4 py-1.5 rounded-full font-black sports-font text-xl mt-3 animate-bounce shadow-lg">SNIPE!</span>}
         {status === 'lost' && <span className="text-[#ef4444] font-black sports-font text-2xl mt-2 drop-shadow-md">SAVED!</span>}
      </div>
      
      {status === 'playing' && zones.map(z => (
        <button
          key={z.id}
          onClick={() => { if (activeZone === z.id) finish(true); }}
          style={activeZone === z.id ? { marginTop: `${jitter.y}px`, marginLeft: `${jitter.x}px` } : {}}
          className={`absolute rounded-full border-4 transition-colors font-black sports-font text-[10px] sm:text-xs leading-none z-10 ${
            activeZone === z.id 
              ? 'bg-[#22E748]/90 border-[#22E748] text-white shadow-[0_0_20px_#22E748] scale-110 cursor-pointer animate-pulse' 
              : 'bg-transparent border-[rgba(0,0,0,0.1)] text-transparent pointer-events-none'
          } ${z.cls}`}
        >
          {activeZone === z.id ? 'SHOOT' : ''}
        </button>
      ))}

      {/* Time Remaining Pill */}
      {status === 'playing' && (
         <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-1 rounded-full font-black number-font text-xl shadow-lg border border-slate-700 z-20">
            {(timeLeft / 1000).toFixed(1)}s
         </div>
      )}

      {/* Centered Outcome Pill */}
      {status !== 'playing' && (
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/95 text-white px-8 py-3 rounded-full font-black sports-font text-4xl shadow-[0_0_40px_rgba(0,0,0,0.9)] border-2 border-slate-500 z-50 whitespace-nowrap tracking-widest">
            {status === 'won' ? 'GOAL' : 'NO GOAL'}
         </div>
      )}
    </div>
  );
};

export default ShootoutGame;