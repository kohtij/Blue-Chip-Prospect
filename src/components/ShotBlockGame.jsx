import React, { useEffect, useState } from 'react';

// Extracted from App.jsx. Pure component; dependencies imported explicitly.
const ShotBlockGame = ({ player, onComplete }) => {
  const [shotLane, setShotLane] = useState(null);
  const [blocks, setBlocks] = useState(0);
  const [status, setStatus] = useState('waiting');

  useEffect(() => {
    if (blocks >= 3) {
      onComplete(true);
      return;
    }

    const timer = setTimeout(() => {
      setShotLane(Math.floor(Math.random() * 3));
      setStatus('active');
    }, 1200);

    return () => clearTimeout(timer);
  }, [blocks, onComplete]);

  const handleBlockAction = (laneChoice) => {
    if (status !== 'active') return;

    if (laneChoice === shotLane) {
      setBlocks(b => b + 1);
      setStatus('blocked');
      setTimeout(() => setStatus('waiting'), 600);
    } else {
      setStatus('failed');
      setTimeout(() => onComplete(false), 800);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto text-center font-sans">
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs font-black uppercase text-slate-400">DEFENSIVE ZONE</span>
        <span className="text-lg font-black text-[#22E748] sports-font">BLOCKS: {blocks} / 3</span>
      </div>

      <div className="grid grid-cols-3 gap-3 h-52 bg-slate-900/80 p-4 rounded-xl border border-slate-800 relative mb-4">
        {[0, 1, 2].map(lane => (
          <div key={lane} className="relative flex flex-col items-center justify-between border-x border-slate-800/50 py-2">
            {status === 'active' && shotLane === lane && (
              <div className="animate-bounce text-3xl">🏒</div>
            )}
            <button
              onClick={() => handleBlockAction(lane)}
              className="mt-auto w-full py-2 bg-slate-800 hover:bg-[#3b82f6] border border-slate-700 hover:border-[#3b82f6] rounded text-[10px] font-black uppercase text-white transition-colors cursor-pointer"
            >
              BLOCK LANE
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShotBlockGame;
