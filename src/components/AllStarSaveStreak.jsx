import { useState, useEffect, useRef } from 'react';

export default function AllStarSaveStreak({ onComplete, strategy }) {
  const [gameStarted, setGameStarted] = useState(false);
  const [shotsFired, setShotsFired] = useState(0);
  const [saves, setSaves] = useState(0);
  const [activeZone, setActiveZone] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  
  const timerRef = useRef(null);
  const totalShots = 10;

  // Grit strategy gives the goalie extra reaction time
  const reactTime = strategy === 'grit' ? 1100 : 800;

  const zones = [
    { id: 0, label: 'TOP LEFT', cls: 'top-4 left-4 w-16 h-16 sm:w-20 sm:h-20' },
    { id: 1, label: 'TOP RIGHT', cls: 'top-4 right-4 w-16 h-16 sm:w-20 sm:h-20' },
    { id: 2, label: 'FIVE HOLE', cls: 'bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 sm:w-20 sm:h-20' },
    { id: 3, label: 'LOW GLOVE', cls: 'bottom-16 left-4 w-16 h-16 sm:w-20 sm:h-20' },
    { id: 4, label: 'LOW BLOCKER', cls: 'bottom-16 right-4 w-16 h-16 sm:w-20 sm:h-20' }
  ];

  const triggerShot = (currentShotCount, currentSaves) => {
    if (currentShotCount >= totalShots) {
        endGame(currentSaves);
        return;
    }

    // eslint-disable-next-line react-hooks/purity
    const nextZone = Math.floor(Math.random() * 5);
    setActiveZone(nextZone);

    timerRef.current = setTimeout(() => {
        setActiveZone(null);
        setShotsFired(prev => prev + 1);
        setTimeout(() => triggerShot(currentShotCount + 1, currentSaves), 500);
    }, reactTime);
  };

  const startGame = () => {
    setGameStarted(true);
    setTimeout(() => triggerShot(0, 0), 1000); 
  };

  const handleSave = (id) => {
    if (activeZone !== id || gameOver) return;
    
    clearTimeout(timerRef.current);
    setActiveZone(null);
    
    const newSaves = saves + 1;
    const newShots = shotsFired + 1;
    setSaves(newSaves);
    setShotsFired(newShots);

    if (newShots >= totalShots) {
        endGame(newSaves);
    } else {
        setTimeout(() => triggerShot(newShots, newSaves), 500);
    }
  };

  const endGame = (finalSaves) => {
    setGameOver(true);
    setActiveZone(null);

    let ovrBoost = 0, idolBoost = 0, msg = "";

    if (finalSaves === 10) {
      ovrBoost = 2; idolBoost = 50; msg = "🏆 BRICK WALL! A perfect 10/10 performance!";
    } else if (finalSaves >= 7) {
      ovrBoost = 1; idolBoost = 20; msg = "🔥 Solid net-minding. You robbed some of the league's best shooters.";
    } else {
      idolBoost = 5; msg = "✅ A tough outing, but the fans still loved seeing you out there.";
    }

    if (strategy === 'grit') idolBoost += 15;

    setTimeout(() => {
        onComplete({ time: finalSaves, speed: finalSaves, msg, idolBoost, ovrBoost, eventName: 'Save Streak' });
    }, 1500);
  };

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  return (
    <div className="w-full max-w-3xl flex flex-col items-center animate-fade-in">
      {strategy && (
         <div className="mb-3 text-[10px] sm:text-xs font-black text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/30 px-3 py-1 rounded-full tracking-widest uppercase shadow-md">
            🎖️ CAPTAIN'S BUFF ACTIVE
         </div>
      )}
      <p className="text-lg text-slate-300 mb-6 font-sans">
        It's time for the <strong>Save Streak</strong>! Stop the breakaways by clicking the target zones before they score.
      </p>
      
      <div className="flex gap-8 mb-6">
        <div className="text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">SAVES</p>
            <p className="text-4xl font-black sports-font text-[#22E748]">{saves}</p>
        </div>
        <div className="text-center border-l border-slate-700 pl-8">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">SHOTS</p>
            <p className="text-4xl font-black sports-font text-white">{shotsFired} / {totalShots}</p>
        </div>
      </div>

      <div className="w-full max-w-md mx-auto aspect-[4/3] bg-[#e2e8f0] border-4 border-[#ef4444] rounded-lg relative overflow-hidden flex items-center justify-center shadow-inner mb-8">
        <div className="absolute inset-0 border-8 border-[#ef4444] rounded opacity-50 pointer-events-none"></div>
        <div className="w-3/5 h-4/5 bg-slate-800 rounded-t-[40%] absolute bottom-0 opacity-80 flex flex-col items-center justify-center transition-all">
           <span className="text-5xl">🥅</span>
        </div>
        
        {!gameStarted ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
              <button onClick={startGame} className="btn-primary py-4 px-10 rounded-xl font-black sports-font text-2xl uppercase tracking-widest hover:scale-105 transition-transform cursor-pointer">
                START EVENT
              </button>
            </div>
        ) : (
            zones.map(z => (
              <button
                key={z.id}
                // eslint-disable-next-line react-hooks/refs
                onClick={() => handleSave(z.id)}
                disabled={activeZone !== z.id}
                className={`absolute rounded-full border-4 transition-colors font-black sports-font text-[10px] sm:text-xs leading-none z-10 ${
                  activeZone === z.id 
                    ? 'bg-[#ef4444] border-white text-white shadow-[0_0_25px_#ef4444] scale-110 cursor-pointer animate-pulse' 
                    : 'bg-transparent border-transparent text-transparent pointer-events-none'
                } ${z.cls}`}
              >
                {activeZone === z.id ? 'SAVE' : ''}
              </button>
            ))
        )}
      </div>
    </div>
  );
}