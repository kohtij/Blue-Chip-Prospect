import { useCallback, useEffect, useRef, useState } from 'react';
import { lerpDifficulty, MIN_REACTION_MS } from '../utils/stakes';

const FaceoffGame = ({ player, onComplete, difficulty = 0 }) => {
   const [status, setStatus] = useState('waiting');
   const [msg, setMsg] = useState('WAIT FOR GREEN...');
   const [warnings, setWarnings] = useState(0);
   
   const doneRef = useRef(false);
   const startTimeRef = useRef(null);
   const toRef = useRef(null);
   const innerToRef = useRef(null);

   const finish = useCallback((win, delay = 1500) => {
     if (doneRef.current) return;
     doneRef.current = true;
     
     // Instantly kill any lingering background timers
     if (toRef.current) clearTimeout(toRef.current);
     if (innerToRef.current) clearTimeout(innerToRef.current);

     setTimeout(() => onComplete(win), delay);
   }, [onComplete]);

   useEffect(() => {
      const delay = 2000 + Math.random() * 3000; 
      
      toRef.current = setTimeout(() => {
         if (doneRef.current) return; // Prevent dropping puck if already ejected
         
         setStatus('ready');
         setMsg('CLICK NOW!');
         startTimeRef.current = Date.now();

         // The opposing centre is quicker in a big game, but never quicker than
         // a person can answer.
         const aiTime = Math.max(MIN_REACTION_MS, (600 - ((player?.hockeyIQ || 50) * 2)) * lerpDifficulty(1.15, 0.80, difficulty));
         
         innerToRef.current = setTimeout(() => {
           if (doneRef.current) return;
           
           // State update and side-effect are now safely separated
           setStatus('done');
           setMsg('TOO SLOW!');
           finish(false); 
         }, aiTime);
         
      }, delay);

      return () => { 
        if (toRef.current) clearTimeout(toRef.current); 
        if (innerToRef.current) clearTimeout(innerToRef.current); 
      };
   }, [player, finish, difficulty]);

   const handleClick = () => {
     if (doneRef.current) return;

     if (status === 'waiting') {
       if (warnings === 0) {
           setWarnings(1);
           setMsg('WARNING: TOO EARLY!');
       } else {
           setStatus('done');
           setMsg('EJECTED! (TOO EARLY)');
           finish(false); 
       }
     } else if (status === 'ready') {
       const reactionTime = Date.now() - startTimeRef.current;
       setStatus('done');
       setMsg(`WON! (${reactionTime}ms)`);
       finish(true);
     }
   };

   return (
     <div className="w-full max-w-sm mx-auto aspect-square bg-[#e2e8f0] rounded-full relative flex items-center justify-center border-4 border-[#3b82f6] shadow-xl">
       <div className="absolute inset-4 rounded-full border-4 border-[#3b82f6] opacity-30"></div>
       <button 
         onClick={handleClick}
         className={`w-3/5 h-3/5 rounded-full flex flex-col items-center justify-center font-black sports-font text-2xl sm:text-3xl transition-colors border-8 shadow-2xl ${
           status === 'waiting' ? 'bg-[#ef4444] border-[#b91c1c] text-white cursor-pointer' : 
           status === 'ready' ? 'bg-[#22E748] border-[#16a34a] text-white cursor-pointer scale-105' :
           status === 'done' && msg.includes('WON') ? 'bg-[#22E748] border-[#16a34a] text-white' :
           'bg-slate-700 border-slate-900 text-slate-400 pointer-events-none'
         }`}
       >
         <span className="text-center">{msg}</span>
       </button>
     </div>
   );
};

export default FaceoffGame;