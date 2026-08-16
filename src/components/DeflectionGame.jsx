import React, { useCallback, useEffect, useRef, useState } from 'react';

// Extracted from App.jsx. Pure component; dependencies imported explicitly.
const DeflectionGame = ({ player, onComplete }) => {
  const [position, setPosition] = useState(0);
  const [direction, setDirection] = useState(1);
  const [status, setStatus] = useState('playing'); // playing, won, lost
  const doneRef = useRef(false);
  const resultToRef = useRef(null);

  const finish = useCallback((win) => {
    if (doneRef.current) return;
    doneRef.current = true;
    onComplete(win);
  }, [onComplete]);

  useEffect(() => {
    if (status !== 'playing') return;
    // Higher Hand-Eye/Shooting slows the bar down slightly to make it easier
    const speed = Math.max(2, 6 - (player.shooting * 0.05));

    const ticker = setInterval(() => {
      setPosition(prev => {
        let next = prev + (direction * speed);
        if (next >= 100) { next = 100; setDirection(-1); }
        if (next <= 0) { next = 0; setDirection(1); }
        return next;
      });
    }, 20);
    return () => clearInterval(ticker);
  }, [direction, status, player]);

  // Clean up the pending result-delay on unmount
  useEffect(() => () => { if (resultToRef.current) clearTimeout(resultToRef.current); }, []);

  const handleDeflect = () => {
    if (status !== 'playing') return;
    let min = 40, max = 60;
    if (player.archetype === 'Power Forward') { min = 35; max = 65; }

    if (position >= min && position <= max) {
      setStatus('won');
      resultToRef.current = setTimeout(() => finish(true), 1000);
    } else {
      setStatus('lost');
      resultToRef.current = setTimeout(() => finish(false), 1000);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto text-center">
      <div className="h-12 w-full bg-slate-800 rounded-full border-2 border-slate-600 relative overflow-hidden mb-8 shadow-inner">
        {/* The Sweet Spot */}
        <div className="absolute top-0 bottom-0 left-[40%] right-[40%] bg-[#22E748]/30 border-x-2 border-[#22E748]"></div>
        {/* The Puck */}
        <div 
          className={`absolute top-1 bottom-1 w-10 bg-black rounded-full shadow-lg border-2 transition-colors ${status === 'won' ? 'border-[#22E748] bg-[#22E748]' : status === 'lost' ? 'border-[#ef4444] bg-[#ef4444]' : 'border-slate-400'}`}
          style={{ left: `calc(${position}% - 20px)` }}
        ></div>
      </div>
      <button 
        onClick={handleDeflect}
        className={`w-full py-4 rounded-xl font-black sports-font text-2xl uppercase tracking-widest transition-transform active:scale-95 ${status === 'playing' ? 'bg-[#3b82f6] text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : status === 'won' ? 'bg-[#22E748] text-white' : 'bg-[#ef4444] text-white'}`}
      >
        {status === 'playing' ? 'TIP IT!' : status === 'won' ? 'GOAL!' : 'MISSED!'}
      </button>
    </div>
  );
};

export default DeflectionGame;
