import  { useState, useEffect } from 'react';
import { getActiveStat } from '../utils/gameHelpers';

export default function ZoneBattleGame({ player, onComplete }) {
  const [status, setStatus] = useState('active'); // active, won, lost
  const [puckPos, setPuckPos] = useState(50);
  const [playerPos, setPlayerPos] = useState(50);
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  
  const physicality = getActiveStat(player, 'physicality');
  const speedMod = 1.0 + ((physicality - 50) * 0.015);
  
  useEffect(() => {
    if (status !== 'active') return;
    
    const interval = setInterval(() => {
       const now = Date.now();
       // Puck wanders unpredictably using overlapping sine waves
       const newPuck = 50 + Math.sin(now / 350) * 35 + Math.cos(now / 600) * 10;
       setPuckPos(newPuck);
       
       setPlayerPos(prev => {
          if (Math.abs(newPuck - prev) <= 12) {
             // In the zone! Build control progress
             setProgress(p => {
                const next = p + (1.2 * speedMod);
                if (next >= 100) {
                   setStatus('won');
                   setTimeout(() => onComplete(true), 1500);
                   return 100;
                }
                return next;
             });
          } else {
             // Out of zone, progress degrades
             setProgress(p => Math.max(0, p - 0.8));
          }
          return prev;
       });
    }, 50);
    
    const timer = setInterval(() => {
       setTimeLeft(t => {
          if (t <= 1) {
             setStatus('lost');
             setTimeout(() => onComplete(false), 1500);
             return 0;
          }
          return t - 1;
       });
    }, 1000);
    
    return () => { clearInterval(interval); clearInterval(timer); };
  }, [status, speedMod, onComplete]);

  const moveLeft = () => setPlayerPos(p => Math.max(5, p - 18));
  const moveRight = () => setPlayerPos(p => Math.min(95, p + 18));

  return (
     <div className="game-panel p-6 text-center max-w-md mx-auto border-t-2 border-[#3b82f6]">
        <h2 className="text-2xl sm:text-3xl font-black sports-font uppercase mb-2 text-[#3b82f6]">NET FRONT BATTLE</h2>
        <p className="text-slate-300 text-sm mb-6">
          Use the arrows to keep your player aligned under the puck. Box out the defenseman to secure the tip! (Time: {timeLeft}s)
        </p>
        
        {/* Progress Bar */}
        <div className="h-4 w-full bg-[#101410] border border-slate-700 rounded-full mb-8 relative overflow-hidden shadow-inner">
           <div className="absolute top-0 bottom-0 left-0 bg-[#22E748] rounded-full transition-all" style={{ width: `${progress}%` }}></div>
        </div>

        {/* The Action Zone */}
        <div className="relative h-28 bg-slate-900 border border-slate-700 rounded-xl mb-6 overflow-hidden">
           {/* The Puck */}
           <div className="absolute top-2 w-6 h-6 text-2xl transition-all duration-75 z-10" style={{ left: `calc(${puckPos}% - 12px)` }}>🏒</div>
           
           {/* Player Icon */}
           <div className="absolute bottom-2 w-12 h-12 bg-[#3b82f6] rounded-full shadow-[0_0_15px_rgba(59,130,246,0.6)] transition-all duration-75 flex items-center justify-center text-xs font-black z-20" style={{ left: `calc(${playerPos}% - 24px)` }}>YOU</div>
           
           {/* Alignment Beam */}
           <div className="absolute bottom-0 h-full w-[36px] border-l-2 border-r-2 border-[#22E748]/30 bg-[#22E748]/10 transition-all duration-75 z-0" style={{ left: `calc(${playerPos}% - 18px)` }}></div>
        </div>

        {/* Controls */}
        <div className="flex gap-4 select-none">
           <button onPointerDown={moveLeft} className="flex-1 py-6 bg-[#1a2230] hover:bg-[#3b82f6] text-white font-black text-2xl sm:text-3xl rounded-xl border border-slate-600 transition-colors active:bg-[#2563eb] cursor-pointer">⬅️</button>
           <button onPointerDown={moveRight} className="flex-1 py-6 bg-[#1a2230] hover:bg-[#3b82f6] text-white font-black text-2xl sm:text-3xl rounded-xl border border-slate-600 transition-colors active:bg-[#2563eb] cursor-pointer">➡️</button>
        </div>
        
        {/* Result Message */}
        <div className="h-8 mt-6">
           {status !== 'active' && (
              <span className={`text-xl font-black sports-font uppercase tracking-widest ${status === 'won' ? 'text-[#22E748]' : 'text-[#ef4444]'}`}>
                 {status === 'won' ? 'BOXED OUT & TIPPED! GOAL!' : 'LOST POSITION!'}
              </span>
           )}
        </div>
     </div>
  );
}