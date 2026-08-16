import React, { useCallback, useEffect, useRef, useState } from 'react';

// Extracted from App.jsx. Pure component; dependencies imported explicitly.
const CreaseGame = ({ player, onComplete }) => {
   const [moles, setMoles] = useState([]);
   const [score, setScore] = useState(0);
   const [misses, setMisses] = useState(0);
   const doneRef = useRef(false);
   const timeoutsRef = useRef(new Set());

   const finish = useCallback((win) => {
     if (doneRef.current) return;
     doneRef.current = true;
     onComplete(win);
   }, [onComplete]);

   useEffect(() => {
     if (score >= 5) { finish(true); return; }
     if (misses >= 3) { finish(false); return; }

     // Higher IQ = Pucks spawn slightly slower
     const spawnRate = Math.max(450, 1000 - (player.hockeyIQ * 4));
     // Higher Agility/Reflexes = Pucks stay on screen longer
     const lifetime = Math.max(600, 1300 - (player.physicality * 3));

     const timeouts = timeoutsRef.current;
     const interval = setInterval(() => {
        if (doneRef.current) return;
        const id = Math.random().toString();
        const pos = Math.floor(Math.random() * 9);
        setMoles(m => [...m, { id, pos }]);

        const to = setTimeout(() => {
           timeouts.delete(to);
           if (doneRef.current) return;
           setMoles(currentMoles => {
              const moleStillThere = currentMoles.find(x => x.id === id);
              if (moleStillThere) {
                 setMisses(prev => prev + 1);
                 return currentMoles.filter(x => x.id !== id);
              }
              return currentMoles;
           });
        }, lifetime);
        timeouts.add(to);
     }, spawnRate);

     return () => {
       clearInterval(interval);
       timeouts.forEach(clearTimeout);
       timeouts.clear();
     };
   }, [score, misses, player, finish]);

   return (
     <div className="w-full max-w-sm mx-auto">
       <div className="flex justify-between mb-4 font-black sports-font text-xl sm:text-2xl px-2">
         <span className="text-[#22E748]">SAVES: {score}/5</span>
         <span className="text-[#ef4444]">GOALS: {misses}/3</span>
       </div>
       <div className="grid grid-cols-3 gap-2 sm:gap-3 bg-slate-800 p-3 sm:p-4 rounded-xl border border-slate-700 aspect-square shadow-xl">
         {[0,1,2,3,4,5,6,7,8].map(i => {
           const mole = moles.find(m => m.pos === i);
           return (
             <div key={i} className="bg-slate-900 rounded-lg flex items-center justify-center relative overflow-hidden border border-slate-800">
               {mole && (
                 <button onClick={() => { setMoles(m => m.filter(x => x.id !== mole.id)); setScore(s => s + 1); }}
                   className="absolute inset-2 bg-black border-4 border-[#ef4444] rounded-full animate-ping cursor-pointer hover:bg-[#ef4444]"
                 ></button>
               )}
             </div>
           );
         })}
       </div>
     </div>
   );
};

export default CreaseGame;
