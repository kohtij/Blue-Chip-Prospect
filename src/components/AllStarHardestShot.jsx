import { useState, useEffect, useRef } from 'react';

export default function AllStarHardestShot({ onComplete, strategy }) {
  const [gameStarted, setGameStarted] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [power, setPower] = useState(0);
  const [isStopping, setIsStopping] = useState(false);
  const [bestSpeed, setBestSpeed] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(null);

  const animationRef = useRef(null);
  const powerRef = useRef(0);
  const directionRef = useRef(1);

  useEffect(() => {
    // Power strategy slows the bar down significantly
    const barSpeedMultiplier = strategy === 'power' ? 2.2 : 3.5;

    const animateBar = () => {
      powerRef.current += barSpeedMultiplier * directionRef.current;
      if (powerRef.current >= 100) {
          powerRef.current = 100;
          directionRef.current = -1;
      } else if (powerRef.current <= 0) {
          powerRef.current = 0;
          directionRef.current = 1;
      }
      setPower(powerRef.current);
      animationRef.current = requestAnimationFrame(animateBar);
    };

    if (gameStarted && !isStopping && attempts < 3) {
      animationRef.current = requestAnimationFrame(animateBar);
    }
    return () => cancelAnimationFrame(animationRef.current);
  }, [gameStarted, isStopping, attempts, strategy]);

  const handleShoot = () => {
    if (!gameStarted || isStopping || attempts >= 3) return;
    setIsStopping(true);
    cancelAnimationFrame(animationRef.current);

    const distanceToCenter = Math.abs(power - 50);
    const accuracyScore = 100 - (distanceToCenter * 2); 
    const speed = 82 + (accuracyScore * 0.26) + (Math.random() * 2); 
    
    setCurrentSpeed(speed);
    if (speed > bestSpeed) setBestSpeed(speed);

    setTimeout(() => {
      const nextAttempt = attempts + 1;
      setAttempts(nextAttempt);
      if (nextAttempt < 3) {
        powerRef.current = 0;
        directionRef.current = 1;
        setPower(0);
        setIsStopping(false);
        setCurrentSpeed(null);
      } else {
        let ovrBoost = 0, idolBoost = 0, msg = "";

        if (bestSpeed >= 105) { 
           ovrBoost = 2; idolBoost = 50; msg = "🏆 105+ MPH! You absolutely shattered the radar gun and won the event!"; 
        } else if (bestSpeed >= 100) { 
           ovrBoost = 1; idolBoost = 20; msg = "🔥 Broke the 100 MPH mark! The crowd loved the raw power."; 
        } else { 
           idolBoost = 5; msg = "✅ Solid shots, but you couldn't hit triple digits today."; 
        }

        if (strategy === 'grit') idolBoost += 15;

        setTimeout(() => {
            onComplete({ speed: bestSpeed, msg, idolBoost, ovrBoost, eventName: 'Hardest Shot' });
        }, 1500);
      }
    }, 1500);
  };

  return (
    <div className="w-full max-w-2xl flex flex-col items-center animate-fade-in">
        {strategy && (
           <div className="mb-3 text-[10px] sm:text-xs font-black text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/30 px-3 py-1 rounded-full tracking-widest uppercase shadow-md">
              🎖️ CAPTAIN'S BUFF ACTIVE
           </div>
        )}
        <p className="text-lg text-slate-300 mb-6 font-sans">
          It's time for the <strong>Hardest Shot</strong> competition! Stop the meter perfectly in the center green zone.
        </p>

        <div className="flex gap-6 mb-8 bg-[#101410] border border-[rgba(255,255,255,0.1)] p-4 rounded-xl shadow-lg">
           <div className="text-center px-4">
               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">ATTEMPT</p>
               <p className="text-3xl font-black sports-font text-white">{Math.min(attempts + 1, 3)} / 3</p>
           </div>
           <div className="text-center border-l border-slate-700 pl-6 pr-2">
               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">BEST SPEED</p>
               <p className="text-3xl font-black sports-font text-[#F59E0B]">{bestSpeed > 0 ? `${bestSpeed.toFixed(1)} MPH` : '--'}</p>
           </div>
        </div>

        {!gameStarted ? (
            <button onClick={() => setGameStarted(true)} className="btn-primary py-4 px-10 rounded-xl font-black sports-font text-2xl uppercase tracking-widest hover:scale-105 transition-transform cursor-pointer shadow-[0_0_20px_rgba(59,130,246,0.3)]">
              START EVENT
            </button>
        ) : (
            <div className="w-full flex flex-col items-center gap-8">
                <div className="w-full h-12 bg-slate-800 rounded-full border-4 border-slate-600 relative overflow-hidden shadow-inner">
                    <div className="absolute inset-y-0 left-0 w-1/4 bg-[#ef4444]/40"></div>
                    <div className="absolute inset-y-0 left-1/4 w-[15%] bg-[#F59E0B]/40"></div>
                    <div className="absolute inset-y-0 left-[40%] w-[20%] bg-[#22E748]/60 shadow-[0_0_15px_#22E748]"></div>
                    <div className="absolute inset-y-0 left-[60%] w-[15%] bg-[#F59E0B]/40"></div>
                    <div className="absolute inset-y-0 right-0 w-1/4 bg-[#ef4444]/40"></div>

                    <div className="absolute inset-y-0 w-3 bg-white shadow-[0_0_15px_white] transition-none" style={{ left: `calc(${power}% - 6px)` }}></div>
                </div>

                <div className="h-16 flex items-center justify-center">
                    {currentSpeed && (
                        <p className="text-5xl font-black sports-font text-[#22E748] animate-fade-in drop-shadow-[0_0_10px_rgba(34,231,72,0.4)]">
                            {currentSpeed.toFixed(1)} MPH
                        </p>
                    )}
                </div>

                <button
                    onClick={handleShoot}
                    disabled={isStopping || attempts >= 3}
                    className={`py-6 px-20 rounded-full font-black sports-font text-3xl uppercase tracking-widest shadow-2xl transition-transform ${isStopping ? 'bg-slate-800 border-4 border-slate-700 text-slate-500 cursor-not-allowed' : 'bg-[#ef4444] border-4 border-[#b91c1c] text-white hover:bg-[#dc2626] hover:scale-105 cursor-pointer shadow-[0_0_25px_rgba(239,68,68,0.4)]'}`}
                >
                    FIRE
                </button>
            </div>
        )}
    </div>
  );
}