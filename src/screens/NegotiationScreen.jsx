import React from 'react';
import { formatMoney } from '../utils/gameHelpers';

// Auto-extracted from App.jsx. Receives state/handlers/App-scope components as props.
export default function NegotiationScreen({ finishNegotiation, handleNegotiatePush, negotiation }) {
  return (() => {
          return (
            <div className="game-panel p-6 sm:p-10 mt-2 border-t-2 border-t-[#F59E0B] text-center max-w-xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-black text-white uppercase mb-2 sports-font tracking-wide">CONTRACT NEGOTIATION</h2>
              <p className="text-sm sm:text-base text-slate-400 font-sans mb-8">{negotiation.msg}</p>

              <div className="bg-[#101410] border border-[rgba(255,255,255,0.065)] rounded-2xl p-6 sm:p-8 mb-8 shadow-inner flex flex-col items-center">
                 <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">ON THE TABLE</p>
                 <p className={`text-4xl sm:text-5xl font-black number-font mb-6 transition-colors ${negotiation.currentSalary > negotiation.originalOffer.salary ? 'text-[#22E748]' : negotiation.currentSalary < negotiation.originalOffer.salary ? 'text-[#ef4444]' : 'text-white'}`}>
                   {formatMoney(negotiation.currentSalary)}
                 </p>
                 
                 <div className="w-full mb-6 text-left">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 font-sans">
                       <span>GM Patience</span>
                       <span>{Math.max(0, negotiation.gmPatience)}%</span>
                    </div>
                    <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                       <div 
                         className={`h-full transition-all duration-300 ${negotiation.gmPatience > 50 ? 'bg-[#22E748]' : negotiation.gmPatience > 20 ? 'bg-[#F59E0B]' : 'bg-[#ef4444]'}`}
                         style={{ width: `${Math.max(0, negotiation.gmPatience)}%` }}
                       ></div>
                    </div>
                 </div>

                 <div className="flex justify-between gap-2 w-full mb-8">
                    {[0, 1, 2, 3, 4].map(slot => {
                       const pastMove = negotiation.history[slot];
                       return (
                          <div key={slot} className={`flex-1 h-12 rounded-lg border-2 flex items-center justify-center text-lg transition-all ${
                             pastMove 
                               ? (pastMove.success ? 'bg-[#22E748]/10 border-[#22E748]/50 text-[#22E748]' : 'bg-[#ef4444]/10 border-[#ef4444]/50 text-[#ef4444]') 
                               : 'bg-slate-800 border-slate-700 text-slate-600'
                          }`}>
                             {pastMove ? (pastMove.success ? '📈' : '❌') : '-'}
                          </div>
                       );
                    })}
                 </div>

                 {negotiation.status === 'playing' ? (
                   <div className="flex flex-col sm:flex-row gap-3 w-full">
                     <button onClick={() => handleNegotiatePush('safe')} className="flex-1 bg-[#3b82f6]/10 border-2 border-[#3b82f6]/40 hover:bg-[#3b82f6]/20 text-[#3b82f6] py-3 sm:py-4 px-2 rounded-xl font-black sports-font text-base sm:text-lg transition-transform active:scale-95 cursor-pointer">
                       SAFE ASK
                     </button>
                     <button onClick={() => handleNegotiatePush('hardball')} className="flex-1 bg-[#ef4444]/10 border-2 border-[#ef4444]/40 hover:bg-[#ef4444]/20 text-[#ef4444] py-3 sm:py-4 px-2 rounded-xl font-black sports-font text-base sm:text-lg transition-transform active:scale-95 cursor-pointer">
                       HARDBALL
                     </button>
                     <button onClick={() => handleNegotiatePush('bluff')} className="flex-1 bg-[#F59E0B]/10 border-2 border-[#F59E0B]/40 hover:bg-[#F59E0B]/20 text-[#F59E0B] py-3 sm:py-4 px-2 rounded-xl font-black sports-font text-base sm:text-lg transition-transform active:scale-95 cursor-pointer">
                       BLUFF
                     </button>
                   </div>
                 ) : (
                   <div className={`w-full py-3 rounded-lg font-black sports-font text-xl uppercase tracking-widest animate-pulse ${negotiation.status === 'maxed' ? 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40' : 'bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/40'}`}>
                     {negotiation.status === 'maxed' ? 'FINAL OFFER REACHED' : 'GM WALKED AWAY'}
                   </div>
                 )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                 <button onClick={() => finishNegotiation(true)} className="flex-1 btn-primary py-4 rounded-xl font-black sports-font text-lg uppercase tracking-widest shadow-lg">
                   SIGN DEAL NOW
                 </button>
                 <button onClick={() => finishNegotiation(false)} className="flex-1 bg-[#101410] hover:bg-[#1a2230] border border-[rgba(255,255,255,0.1)] text-white py-4 rounded-xl font-black sports-font text-lg uppercase tracking-widest transition-colors cursor-pointer">
                   RETURN TO OFFERS
                 </button>
              </div>
            </div>
          );
        })();
}
