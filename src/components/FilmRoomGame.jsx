import React, { useEffect, useRef, useState } from 'react';

// Extracted from App.jsx. Pure component; dependencies imported explicitly.
const FilmRoomGame = ({ player, onComplete }) => {
   const [phase, setPhase] = useState('memorize');
   const doneRef = useRef(false);

   // Lazy initialize the game board ONCE so React Strict Mode doesn't regenerate 
   // the target behind the scenes and cause a false "Wrong" answer.
   const [gameBoard] = useState(() => {
      const generatePattern = () => {
         const p = [];
         while(p.length < 4) {
           const r = Math.floor(Math.random() * 9);
           if(!p.includes(r)) p.push(r);
         }
         return p.sort();
      };

      const correct = generatePattern();
      const opts = [correct];
      while(opts.length < 4) {
        const wrong = generatePattern();
        if (!opts.find(o => o.join(',') === wrong.join(','))) opts.push(wrong);
      }
      return { target: correct, options: opts.sort(() => 0.5 - Math.random()) };
   });

   useEffect(() => {
      // Higher IQ = more time to memorize the board
      const showTime = Math.min(5000, 1500 + (player.hockeyIQ * 30));
      const t = setTimeout(() => { setPhase('recall'); }, showTime);
      return () => clearTimeout(t);
   }, [player.hockeyIQ]);

   const Grid = ({ pattern, onClick, small }) => (
     <div onClick={onClick} className={`grid grid-cols-3 gap-1 p-2 bg-[#166534] border-4 border-[#14532d] rounded-lg aspect-square shadow-inner ${onClick ? 'cursor-pointer hover:border-[#F59E0B] transition-colors' : ''}`}>
       {[0,1,2,3,4,5,6,7,8].map(i => (
         <div key={i} className={`flex items-center justify-center ${small ? 'text-xl' : 'text-3xl'} font-black ${pattern.includes(i) ? 'text-white' : 'text-transparent'}`}>
           {pattern.includes(i) ? 'X' : '.'}
         </div>
       ))}
     </div>
   );

   if (phase === 'memorize') {
     return (
       <div className="w-full max-w-sm mx-auto text-center">
         <p className="text-[#F59E0B] font-black sports-font text-2xl sm:text-3xl mb-6 animate-pulse">MEMORIZE THE PLAY!</p>
         <div className="w-48 h-48 sm:w-64 sm:h-64 mx-auto shadow-2xl">
           <Grid pattern={gameBoard.target} />
         </div>
       </div>
     );
   }

   return (
     <div className="w-full max-w-lg mx-auto text-center">
       <p className="text-[#3b82f6] font-black sports-font text-xl sm:text-3xl mb-6 uppercase">Which play was it?</p>
       <div className="grid grid-cols-2 gap-4 sm:gap-6">
         {gameBoard.options.map((opt, i) => (
           <Grid 
             key={i} 
             pattern={opt} 
             small 
             onClick={() => {
               if (doneRef.current) return;
               doneRef.current = true;
               onComplete(opt.join(',') === gameBoard.target.join(','));
             }} 
           />
         ))}
       </div>
     </div>
   );
};

export default FilmRoomGame;
