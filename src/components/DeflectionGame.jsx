import { useState, useRef } from 'react';
import { getActiveStat } from '../utils/gameHelpers';

export default function DeflectionGame({ player, onComplete }) {
  const [phase, setPhase] = useState('ready'); // ready, active, result
  const [progress, setProgress] = useState(0);
  const [resultMsg, setResultMsg] = useState('');
  
  const physicality = getActiveStat(player, 'physicality');
  const iq = getActiveStat(player, 'hockeyIQ');
  
  // Physicality determines how wide the "perfect screen" window is
  const sweetSpotMin = Math.max(10, 70 - Math.floor((physicality - 50) / 4));
  const sweetSpotMax = Math.min(95, 85 + Math.floor((physicality - 50) / 4));
  // Hockey IQ determines how slowly the play develops (giving you better timing control)
  const speed = Math.max(0.6, 1.4 - ((iq - 50) * 0.01));
  
  const intervalRef = useRef(null);

  const handlePress = () => {
    if (phase === 'ready') {
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
    if (phase !== 'active') return;
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
      <h2 className="text-3xl font-black sports-font uppercase mb-2">THE DEFLECTION</h2>
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
          PRESS & HOLD TO SCREEN
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