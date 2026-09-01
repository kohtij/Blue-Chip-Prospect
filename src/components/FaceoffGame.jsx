import { useCallback, useEffect, useRef, useState } from 'react';

// Extracted from App.jsx. Pure component; dependencies imported explicitly.
const FaceoffGame = ({ player, onComplete }) => {
   const [status, setStatus] = useState('waiting');
   const [msg, setMsg] = useState('WAIT FOR GREEN...');
   const [warnings, setWarnings] = useState(0); // Track false starts
   const doneRef = useRef(false);
   const startTimeRef = useRef(null);

   const finish = useCallback((win, delay = 1500) => {
     if (doneRef.current) return;
     doneRef.current = true;
     setTimeout(() => onComplete(win), delay);
   }, [onComplete]);

   useEffect(() => {
      const delay = 2000 + Math.random() * 3000; // Random drop between 2-5 seconds
      let innerTo = null;
      const to = setTimeout(() => {
         setStatus('ready');
         setMsg('CLICK NOW!');
         startTimeRef.current = Date.now();

         const aiTime = Math.max(250, 600 - (player.hockeyIQ * 2));
         innerTo = setTimeout(() => {
           setStatus(prev => {
             if (prev === 'ready') {
               setMsg('TOO SLOW!');
               finish(false); 
               return 'done';
             }
             return prev;
           })
         }, aiTime);
      }, delay);

      return () => { clearTimeout(to); if (innerTo) clearTimeout(innerTo); };
   }, [player, finish]);

   const handleClick = () => {
     if (status === 'waiting') {
       if (warnings === 0) {
           setWarnings(1);
           setMsg('WARNING: TOO EARLY!');
       } else {
           setStatus('done');
           setMsg('EJECTED! (TOO EARLY)');
           finish(false); // Triggers standard minigame failure penalty
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