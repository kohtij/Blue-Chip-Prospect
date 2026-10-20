import { useState, useEffect, useRef } from 'react';
import { getActiveStat } from '../utils/gameHelpers';

export default function ScreenedShotGame({ player, onComplete }) {
  const [status, setStatus] = useState('waiting'); // waiting, emerging, result
  const [shotLane, setShotLane] = useState(null);
  const [clickedLane, setClickedLane] = useState(null);
  const [resultMsg, setResultMsg] = useState('');

  // Reflexes (Shooting for goalies) dictate how long you have to react once the puck emerges
  const reflexes = getActiveStat(player, 'shooting');
  const reactionTime = Math.max(300, 200 + (reflexes * 5)); 

  const timeoutRef = useRef(null);

  useEffect(() => {
    const initTimer = setTimeout(() => {
      const lane = Math.floor(Math.random() * 3);
      setShotLane(lane);
      
      // The puck is hidden in traffic for 1 to 1.5 seconds
      const travelTime = 1000 + Math.random() * 500;
      timeoutRef.current = setTimeout(() => {
        setStatus('emerging');
        
        // You have a fraction of a second to react
        timeoutRef.current = setTimeout(() => {
           setStatus('result');
           setResultMsg('TOO SLOW! GOAL!');
           setTimeout(() => onComplete(false), 1500);
        }, reactionTime);
        
      }, travelTime);
    }, 1000);

    return () => {
      clearTimeout(initTimer);
      clearTimeout(timeoutRef.current);
    }
  }, [onComplete, reactionTime]);

  const handleBlock = (lane) => {
    if (status === 'waiting') {
       clearTimeout(timeoutRef.current);
       setClickedLane(lane);
       setStatus('result');
       setResultMsg('GUESSED EARLY AND BITTEN! GOAL!');
       setTimeout(() => onComplete(false), 1500);
       return;
    }
    if (status !== 'emerging') return;
    
    clearTimeout(timeoutRef.current);
    setClickedLane(lane);
    setStatus('result');

    if (lane === shotLane) {
       setResultMsg('WHAT A REFLEX SAVE!');
       setTimeout(() => onComplete(true), 1500);
    } else {
       setResultMsg('BEATEN CLEAN! GOAL!');
       setTimeout(() => onComplete(false), 1500);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto text-center font-sans">
      <h2 className="text-2xl font-black sports-font uppercase mb-2 text-[#c084fc]">SCREENED SHOT</h2>
      <p className="text-slate-300 text-sm mb-6">
        You cannot see the release! Wait for the puck to emerge from the traffic block and react instantly.
      </p>

      <div className="relative h-64 bg-slate-900/80 p-4 rounded-xl border border-slate-800 mb-4 overflow-hidden">
        {/* The Traffic Block */}
        <div className="absolute top-0 left-0 right-0 h-[65%] bg-slate-800/95 border-b-4 border-slate-700 z-10 flex items-center justify-center">
            <span className="text-slate-500 font-black tracking-widest uppercase opacity-50 text-xl">Traffic</span>
        </div>

        <div className="grid grid-cols-3 gap-3 h-full relative z-0">
          {[0, 1, 2].map(lane => {
            const isPuckHere = status === 'emerging' && lane === shotLane;
            const isFailedPuck = status === 'result' && lane === shotLane && !resultMsg.includes('SAVE');
            let btnClass = "mt-auto w-full py-3 border rounded text-[10px] font-black uppercase transition-colors cursor-pointer relative z-20 ";
            
            if (status === 'result') {
                if (lane === clickedLane && resultMsg.includes('SAVE')) btnClass += "bg-[#22E748] border-[#22E748] text-black";
                else if (lane === clickedLane) btnClass += "bg-[#ef4444]/20 border-[#ef4444] text-[#ef4444]";
                else btnClass += "bg-slate-800 border-slate-700 text-slate-500 opacity-50";
            } else {
                btnClass += "bg-slate-800 hover:bg-[#c084fc] border-slate-700 hover:border-[#c084fc] text-white";
            }

            return (
              <div key={lane} className="flex flex-col items-center justify-end h-full pb-2">
                <div className="h-16 flex items-center justify-center w-full relative z-0">
                    {(isPuckHere || isFailedPuck) && <div className="text-3xl animate-pulse">🏒</div>}
                </div>
                <button onClick={() => handleBlock(lane)} disabled={status === 'result'} className={btnClass}>
                  PAD SAVE
                </button>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="h-8">
        {status === 'result' && (
          <span className={`text-xl font-black sports-font tracking-widest ${resultMsg.includes('SAVE') ? 'text-[#22E748]' : 'text-[#ef4444]'}`}>
            {resultMsg}
          </span>
        )}
      </div>
    </div>
  );
}