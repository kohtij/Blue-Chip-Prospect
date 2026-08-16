import React, { useCallback, useEffect, useRef, useState } from 'react';

// Extracted from App.jsx. Pure component; dependencies imported explicitly.
const OneTimerGame = ({ player, onComplete }) => {
  const [position, setPosition] = useState(-20);
  const [status, setStatus] = useState('waiting');
  const doneRef = useRef(false);

  const finish = useCallback((win) => {
    if (doneRef.current) return;
    doneRef.current = true;
    setTimeout(() => onComplete(win), 1000);
  }, [onComplete]);

  useEffect(() => {
    if (status === 'waiting') {
       const delay = 500 + Math.random() * 2000;
       const t = setTimeout(() => setStatus('playing'), delay);
       return () => clearTimeout(t);
    }

    if (status !== 'playing') return;
    
    // Higher shooting/hockey IQ makes the puck travel at a slightly more manageable speed
    let speed = Math.max(1.8, 4.5 - (player.shooting * 0.025));
    if (player.archetype === 'Sniper') speed -= 0.4;
    
    const ticker = setInterval(() => {
      setPosition(prev => {
        const next = prev + speed;
        if (next > 120) {
          setStatus('lost');
          finish(false);
        }
        return next;
      });
    }, 20);
    return () => clearInterval(ticker);
  }, [status, player, finish]);

  const handleShoot = () => {
    if (status !== 'playing') return;
    // The sweet spot is exactly between 72% and 88% of the bar
    if (position >= 72 && position <= 88) {
      setStatus('won');
      finish(true);
    } else {
      setStatus('lost');
      finish(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto text-center">
      <div className="h-16 w-full bg-slate-800 rounded-full border-4 border-slate-600 relative overflow-hidden mb-8 shadow-inner">
        {/* Sweet Spot */}
        <div className="absolute top-0 bottom-0 left-[72%] right-[12%] bg-[#F59E0B]/40 border-x-4 border-[#F59E0B]"></div>
        {/* The Puck */}
        <div
          className={`absolute top-2 bottom-2 w-10 bg-black rounded-full shadow-lg border-2 transition-colors ${status === 'won' ? 'border-[#22E748] bg-[#22E748]' : status === 'lost' ? 'border-[#ef4444] bg-[#ef4444]' : 'border-slate-400'}`}
          style={{ left: `${position}%` }}
        ></div>
      </div>
      <button
        onClick={handleShoot}
        className={`w-full py-4 rounded-xl font-black sports-font text-2xl uppercase tracking-widest transition-transform active:scale-95 ${status === 'waiting' ? 'bg-slate-700 text-slate-400' : status === 'playing' ? 'bg-[#F59E0B] text-black shadow-[0_0_15px_rgba(245,158,11,0.5)] cursor-pointer' : status === 'won' ? 'bg-[#22E748] text-white' : 'bg-[#ef4444] text-white'}`}
      >
        {status === 'waiting' ? 'GET READY...' : status === 'playing' ? 'FIRE THE ONE-TIMER!' : status === 'won' ? 'WHAT A ROCKET!' : 'WHIFFED IT!'}
      </button>
    </div>
  );
};

export default OneTimerGame;
