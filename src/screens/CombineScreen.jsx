import React from 'react';
import { useAppContext } from '../AppContext';

// Auto-extracted from App.jsx. Receives state/handlers/App-scope components as props.
export default function CombineScreen() {
  const { combineColor, combinePhase, combineScore, handleCombineReflex, handleDraftDay, setCombineClicks, setCombinePhase, setCombineScore } = useAppContext();
  return (() => {
          if (combinePhase === 1) {
             return (
               <div className="game-panel p-6 sm:p-10 mt-2 text-center border-t-2 border-t-[#3b82f6]">
                 <h2 className="text-2xl sm:text-4xl font-black text-white sports-font uppercase mb-3">NHL DRAFT COMBINE</h2>
                 <p className="text-slate-300 font-sans mb-8">Reflex & Agility Testing: Wait for the signal, then react instantly! Do not jump the gun.</p>
                 <button 
                   onClick={handleCombineReflex} 
                   className={`w-48 h-48 sm:w-56 sm:h-56 mx-auto rounded-full border-[8px] text-white font-black text-3xl sm:text-4xl active:scale-95 transition-colors select-none mb-6 cursor-pointer flex items-center justify-center ${combineColor === 'green' ? 'bg-[#22E748] border-[#16a34a] shadow-[0_0_30px_rgba(34,231,75,0.5)]' : 'bg-[#ef4444] border-[#b91c1c] shadow-[0_0_30px_rgba(239,68,68,0.5)]'}`}
                 >
                   {combineColor === 'green' ? 'GO!' : 'WAIT...'}
                 </button>
               </div>
             );
          }

          if (combinePhase === 2) {
             return (
               <div className="game-panel p-6 sm:p-10 mt-2 text-center border-t-2 border-t-[#3b82f6] animate-fade-in">
                 <h2 className="text-2xl sm:text-4xl font-black text-white sports-font uppercase mb-4">GM INTERVIEWS</h2>
                 <p className="text-slate-300 font-sans mb-8">A notoriously strict GM leans over the table: "Are you going to be a distraction off the ice, or are you obsessed with winning?"</p>
                 <div className="flex flex-col gap-4 max-w-md mx-auto">
                   <button onClick={() => { setCombineScore(s => s + 1); setCombinePhase(3); }} className="p-4 bg-[#101410] border border-[#22E748]/50 text-[#22E748] rounded-xl font-bold uppercase tracking-widest hover:bg-[#22E748]/10 cursor-pointer shadow-md transition-colors">
                     "I eat, sleep, and breathe hockey." (Safe)
                   </button>
                   <button onClick={() => { setCombineScore(s => Math.random() > 0.5 ? s + 2 : s - 2); setCombinePhase(3); }} className="p-4 bg-[#101410] border border-[#F59E0B]/50 text-[#F59E0B] rounded-xl font-bold uppercase tracking-widest hover:bg-[#F59E0B]/10 cursor-pointer shadow-md transition-colors">
                     "I'm going to be the best player in this draft, period." (Risky)
                   </button>
                 </div>
               </div>
             );
          }

          if (combinePhase === 3) {
             let verdict = '';
             let boost = 0;
             if (combineScore >= 2) { verdict = "You destroyed the Combine. Teams are scrambling to trade up for you!"; boost = 3; }
             else if (combineScore === 1) { verdict = "A solid Combine showing. You boosted your draft stock slightly."; boost = 1; }
             else if (combineScore === 0) { verdict = "Average showing. Your on-ice tape will have to do the talking."; boost = 0; }
             else { verdict = "A disastrous Combine. You looked completely out of shape and fell down multiple draft boards."; boost = -2; }

             return (
               <div className="game-panel p-6 sm:p-10 mt-2 text-center border-t-2 border-t-[#3b82f6] animate-fade-in">
                 <h2 className="text-3xl sm:text-4xl font-black text-white sports-font uppercase mb-6">COMBINE VERDICT</h2>
                 <p className="text-lg sm:text-xl text-slate-300 italic mb-8 font-sans">"{verdict}"</p>
                 <button 
                   onClick={() => {
                     handleDraftDay(boost);
                     // Clean up the combine state so it's fresh if you start a new career
                     setCombinePhase(1);
                     setCombineClicks(0);
                     setCombineScore(0);
                   }} 
                   className="btn-primary py-4 px-10 w-full sm:w-auto rounded-xl font-black sports-font uppercase tracking-widest shadow-2xl cursor-pointer"
                 >
                   PROCEED TO NHL DRAFT
                 </button>
               </div>
             );
          }
        })();
}
