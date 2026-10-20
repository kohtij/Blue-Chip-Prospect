import  { useEffect, useState } from 'react';

const ShotBlockGame = ({ player, onComplete }) => {
  const [shotLane, setShotLane] = useState(null);
  const [blocks, setBlocks] = useState(0);
  const [status, setStatus] = useState('waiting');
  const [pressedLane, setPressedLane] = useState(null);
  const [resultMsg, setResultMsg] = useState('');

  // Unpredictable shot trigger
  useEffect(() => {
    if (blocks >= 3) {
      onComplete(true);
      return;
    }

    let timer;
    // FIX: Only start the countdown for the next shot AFTER the cooldown finishes
    if (status === 'waiting') {
      timer = setTimeout(() => {
        setShotLane(Math.floor(Math.random() * 3));
        setPressedLane(null);
        setResultMsg('');
        setStatus('active');
      }, 400 + Math.random() * 800);
    }

    return () => clearTimeout(timer);
  }, [status, blocks, onComplete]);
  
  // Scaled, high-pressure expiration timer
  useEffect(() => {
    let failTimer;
    if (status === 'active') {
      const skating = player?.skating || 50;
      // 850ms window at 50 skating, scales down to an elite 600ms window at 100 skating
      const reactionTime = Math.max(500, 1100 - (skating * 5)); 
      
      failTimer = setTimeout(() => {
        setResultMsg('TOO SLOW!');
        setStatus('failed');
        setTimeout(() => onComplete(false), 1200);
      }, reactionTime);
    }
    return () => clearTimeout(failTimer);
  }, [status, onComplete, player]);

  const handleBlockAction = (laneChoice) => {
    if (status !== 'active') return;
    
    setPressedLane(laneChoice);

    if (laneChoice === shotLane) {
      setResultMsg('BLOCKED!');
      setBlocks(b => b + 1);
      setStatus('blocked');
      setTimeout(() => setStatus('waiting'), 600);
    } else {
      setResultMsg('MISSED!');
      setStatus('failed');
      setTimeout(() => onComplete(false), 1200);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto text-center font-sans">
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs font-black uppercase text-slate-400">DEFENSIVE ZONE</span>
        <span className="text-lg font-black text-[#22E748] sports-font">BLOCKS: {blocks} / 3</span>
      </div>

      <div className="grid grid-cols-3 gap-3 h-52 bg-slate-900/80 p-4 rounded-xl border border-slate-800 relative mb-4">
        {[0, 1, 2].map(lane => {
          let btnClass = "mt-auto w-full py-2 border rounded text-[10px] font-black uppercase transition-colors cursor-pointer ";
          
          if (status === 'failed') {
            if (lane === shotLane) {
              btnClass += "bg-[#22E748]/20 border-[#22E748] text-[#22E748]"; // Show where it actually went
            } else if (lane === pressedLane) {
              btnClass += "bg-[#ef4444]/20 border-[#ef4444] text-[#ef4444]"; // Show wrong guess
            } else {
              btnClass += "bg-slate-800 border-slate-700 text-slate-500 opacity-50";
            }
          } else if (status === 'blocked' && lane === shotLane) {
            btnClass += "bg-[#22E748] border-[#22E748] text-black";
          } else {
            btnClass += "bg-slate-800 hover:bg-[#3b82f6] border-slate-700 hover:border-[#3b82f6] text-white";
          }

          return (
            <div key={lane} className="relative flex flex-col items-center justify-between border-x border-slate-800/50 py-2">
              {(status === 'active' || status === 'failed' || status === 'blocked') && shotLane === lane && (
                <div className={`text-3xl ${status === 'active' ? 'animate-bounce' : ''}`}>🏒</div>
              )}
              <button
                onClick={() => handleBlockAction(lane)}
                disabled={status !== 'active'}
                className={btnClass}
              >
                BLOCK LANE
              </button>
            </div>
          );
        })}
      </div>
      
      <div className="h-8">
        {(status === 'failed' || status === 'blocked') && (
          <span className={`text-xl font-black sports-font tracking-widest ${status === 'blocked' ? 'text-[#22E748]' : 'text-[#ef4444]'}`}>
            {resultMsg}
          </span>
        )}
      </div>
    </div>
  );
};

export default ShotBlockGame;