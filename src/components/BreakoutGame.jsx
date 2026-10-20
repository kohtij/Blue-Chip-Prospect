import { useState, useEffect, useRef } from 'react';
import { getActiveStat } from '../utils/gameHelpers';

export default function BreakoutGame({ player, onComplete }) {
  const [status, setStatus] = useState('waiting'); // waiting, active, result
  const [resultMsg, setResultMsg] = useState('');
  const [wingerActive, setWingerActive] = useState(false);
  const [openLane, setOpenLane] = useState(null);

  // Hockey IQ controls how large your passing window is
  const iq = getActiveStat(player, 'hockeyIQ');
  const windowTime = Math.max(400, 300 + (iq * 6)); 
  const timeoutRef = useRef(null);

  useEffect(() => {
    const initTimer = setTimeout(() => {
      const lane = Math.floor(Math.random() * 3);
      setOpenLane(lane);
      setStatus('active');

      // The winger takes a moment to get open
      const flashDelay = 800 + Math.random() * 1200;
      timeoutRef.current = setTimeout(() => {
        setWingerActive(true);
        
        // If the player misses the window, the lane closes
        timeoutRef.current = setTimeout(() => {
          setWingerActive(false);
          setResultMsg('MISSED THE WINDOW! TURNOVER!');
          setStatus('result');
          setTimeout(() => onComplete(false), 1500);
        }, windowTime);
      }, flashDelay);
    }, 1000);

    return () => {
      clearTimeout(initTimer);
      clearTimeout(timeoutRef.current);
    };
  }, [iq, onComplete, windowTime]);

  const handleLaneClick = (lane) => {
    if (status === 'result') return;
    clearTimeout(timeoutRef.current);
    setStatus('result');

    if (lane === openLane) {
      if (wingerActive) {
        setResultMsg('TAPE TO TAPE! GREAT BREAKOUT!');
        setTimeout(() => onComplete(true), 1500);
      } else {
        setResultMsg('ICING! WINGER WAS NOT READY!');
        setTimeout(() => onComplete(false), 1500);
      }
    } else {
      setResultMsg('INTERCEPTED BY FORECHECKER!');
      setTimeout(() => onComplete(false), 1500);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto text-center font-sans">
      <h2 className="text-2xl font-black sports-font uppercase mb-2 text-[#3b82f6]">THE BREAKOUT</h2>
      <p className="text-slate-300 text-sm mb-6">
        Wait for your winger to flash <strong className="text-[#22E748]">GREEN</strong> in the open lane. Do not pass to the red forecheckers!
      </p>

      <div className="grid grid-cols-3 gap-3 h-52 bg-slate-900/80 p-4 rounded-xl border border-slate-800 relative mb-4">
        {[0, 1, 2].map(lane => {
          const isForechecker = status !== 'waiting' && lane !== openLane;
          const isWinger = status !== 'waiting' && lane === openLane && wingerActive;
          
          return (
            <div key={lane} className="relative flex flex-col items-center justify-between border-x border-slate-800/50 py-2">
              <div className="w-full h-16 flex items-center justify-center">
                {isForechecker && <div className="w-10 h-10 bg-[#ef4444] rounded shadow-[0_0_15px_rgba(239,68,68,0.5)] flex items-center justify-center text-xl">🛡️</div>}
                {isWinger && <div className="w-10 h-10 bg-[#22E748] rounded-full shadow-[0_0_15px_rgba(34,231,72,0.5)] flex items-center justify-center text-xl animate-pulse">🏒</div>}
              </div>
              <button
                onClick={() => handleLaneClick(lane)}
                disabled={status === 'result'}
                className="mt-auto w-full py-2 bg-slate-800 hover:bg-[#3b82f6] border border-slate-700 hover:border-[#3b82f6] rounded text-[10px] font-black uppercase text-white transition-colors cursor-pointer"
              >
                PASS
              </button>
            </div>
          );
        })}
      </div>
      
      <div className="h-8">
        {status === 'result' && (
          <span className={`text-xl font-black sports-font tracking-widest ${resultMsg.includes('GREAT') ? 'text-[#22E748]' : 'text-[#ef4444]'}`}>
            {resultMsg}
          </span>
        )}
      </div>
    </div>
  );
}