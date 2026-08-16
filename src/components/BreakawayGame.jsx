import React, { useCallback, useEffect, useRef, useState } from 'react';

// Extracted from App.jsx. Pure component; dependencies imported explicitly.
const BreakawayGame = ({ player, onComplete }) => {
  const [phase, setPhase] = useState('setup'); // setup, waiting, deking, result
  const [direction, setDirection] = useState(null);
  const [strategy, setStrategy] = useState(null); // 'cheatLeft', 'cheatRight', 'hold'
  const [msg, setMsg] = useState('');
  const doneRef = useRef(false);

  const finish = useCallback((win, delay = 1200) => {
    if (doneRef.current) return;
    doneRef.current = true;
    setTimeout(() => onComplete(win), delay);
  }, [onComplete]);

  useEffect(() => {
    if (phase !== 'waiting') return;

    // Skater approaches for 1-2.5 seconds
    const delay = 1000 + (Math.random() * 1500);
    let innerTo = null;

    const to = setTimeout(() => {
      // Skater makes their move
      const actualDir = Math.random() > 0.5 ? 'left' : 'right';
      setDirection(actualDir);

      if (strategy === 'cheatLeft' || strategy === 'cheatRight') {
        // GAMBLE RESOLUTION: Instant win or loss based on your guess
        setPhase('result');
        const guessedRight = (strategy === 'cheatLeft' && actualDir === 'left') || (strategy === 'cheatRight' && actualDir === 'right');
        setMsg(guessedRight ? 'PERFECT READ!' : 'BIT ON THE FAKE!');
        finish(guessedRight);
      } else {
        // HOLD GROUND RESOLUTION: Quick-time reflex event
        setPhase('deking');
        
        // Reaction window relies on Hockey IQ and Reflexes, but is tighter since you waited
        let window = Math.min(900, 450 + (player.hockeyIQ * 5));
        if (player.archetype === 'Reflex' || player.archetype === 'Butterfly') window += 100;
        
        innerTo = setTimeout(() => {
          setPhase(prev => {
            if (prev === 'deking') {
              setMsg('TOO SLOW!');
              finish(false);
              return 'result';
            }
            return prev;
          });
        }, window);
      }
    }, delay);

    return () => { clearTimeout(to); if (innerTo) clearTimeout(innerTo); };
  }, [phase, strategy, player, finish]);

  const startPlay = (strat) => {
    setStrategy(strat);
    setPhase('waiting');
  };

  const handlePad = (side) => {
    if (phase !== 'deking') return;
    setPhase('result');
    if (side === direction) {
      setMsg('GREAT SAVE!');
      finish(true);
    } else {
      setMsg('BEAT CLEAN!');
      finish(false);
    }
  };

  if (phase === 'setup') {
    return (
      <div className="w-full max-w-sm mx-auto text-center animate-fade-in">
        <h3 className="text-xl font-black text-white sports-font mb-4 tracking-wider">CHOOSE YOUR STRATEGY</h3>
        <div className="flex flex-col gap-3">
          <button onClick={() => startPlay('cheatLeft')} className="bg-[#101410] border-2 border-[#F59E0B] text-[#F59E0B] hover:bg-[#F59E0B]/10 p-3.5 rounded-xl font-bold uppercase tracking-widest transition-colors cursor-pointer shadow-lg hover:-translate-y-0.5">
            Gamble: Cheat Left (50/50)
          </button>
          <button onClick={() => startPlay('hold')} className="bg-[#101410] border-2 border-[#3b82f6] text-[#3b82f6] hover:bg-[#3b82f6]/10 p-3.5 rounded-xl font-bold uppercase tracking-widest transition-colors cursor-pointer shadow-lg hover:-translate-y-0.5">
            Safe: Hold Ground & React
          </button>
          <button onClick={() => startPlay('cheatRight')} className="bg-[#101410] border-2 border-[#F59E0B] text-[#F59E0B] hover:bg-[#F59E0B]/10 p-3.5 rounded-xl font-bold uppercase tracking-widest transition-colors cursor-pointer shadow-lg hover:-translate-y-0.5">
            Gamble: Cheat Right (50/50)
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-6 px-2 italic font-sans leading-relaxed">
          Gambling removes the need for reflexes but leaves the opposite side wide open. Holding ground relies entirely on your reaction time!
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto text-center animate-fade-in">
      <div className="h-32 flex flex-col items-center justify-center mb-8">
        {phase === 'waiting' && <span className="text-slate-400 font-bold tracking-widest uppercase animate-pulse">Skating in...</span>}
        {(phase === 'deking' || phase === 'result') && direction === 'left' && <span className="text-6xl text-[#3b82f6] animate-bounce">⬅️</span>}
        {(phase === 'deking' || phase === 'result') && direction === 'right' && <span className="text-6xl text-[#3b82f6] animate-bounce">➡️</span>}
        
        {phase === 'result' && (
          <p className={`mt-4 font-black sports-font text-2xl uppercase tracking-widest ${msg.includes('SAVE') || msg.includes('PERFECT') ? 'text-[#22E748]' : 'text-[#ef4444]'}`}>
            {msg}
          </p>
        )}
      </div>

      {phase === 'deking' && (
        <div className="flex gap-4">
          <button onClick={() => handlePad('left')} className="flex-1 bg-slate-800 border-4 border-slate-600 rounded-xl py-8 text-2xl font-black text-white hover:border-[#3b82f6] active:bg-[#3b82f6] transition-all cursor-pointer">
            LEFT PAD
          </button>
          <button onClick={() => handlePad('right')} className="flex-1 bg-slate-800 border-4 border-slate-600 rounded-xl py-8 text-2xl font-black text-white hover:border-[#3b82f6] active:bg-[#3b82f6] transition-all cursor-pointer">
            RIGHT PAD
          </button>
        </div>
      )}
    </div>
  );
};

export default BreakawayGame;
