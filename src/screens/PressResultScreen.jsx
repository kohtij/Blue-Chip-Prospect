import React from 'react';
import { useAppContext } from '../AppContext';
import { PRESS_VIBES } from '../utils/appHelpers';

// Auto-extracted from App.jsx. Receives state/handlers/App-scope components as props.
export default function PressResultScreen() {
  const { activePress, handleEndPress } = useAppContext();
  return (() => {
           const journalistsList = activePress.journalists || (activePress.journalist ? [activePress.journalist] : []);
           const hits = activePress.answers.filter((ans, i) => ans === (journalistsList[i]?.id || activePress.journalist?.id)).length;
           
           let resultTitle, resultColor, resultText;
           if (hits === 3) { resultTitle = 'FLAWLESS CONFERENCE'; resultColor = 'text-[#22E748]'; resultText = 'Read them all like a book. +15 Fan Status, +1 OVR'; }
           else if (hits === 2) { resultTitle = 'GOOD CONFERENCE'; resultColor = 'text-[#3b82f6]'; resultText = 'Solid, measured answers. +5 Fan Status'; }
           else if (hits === 1) { resultTitle = 'MIXED RECEPTION'; resultColor = 'text-[#F59E0B]'; resultText = 'They twisted your words. -5 Fan Status'; }
           else { resultTitle = 'PR DISASTER'; resultColor = 'text-[#ef4444]'; resultText = 'You alienated everyone. -15 Fan Status, -1 OVR'; }

           const primaryJournalist = journalistsList[0] || { name: 'The Media', desc: 'Post-game interview.' };

           return (
            <div className="game-panel p-4 sm:p-8 mt-2 border-t-2 border-t-[#3b82f6] text-left">
              <div className="mb-4 sm:mb-6 border-b border-[rgba(255,255,255,0.065)] pb-4">
                 <h3 className="text-xs sm:text-sm font-bold text-slate-400 tracking-widest uppercase mb-1 font-sans">PRESS ROOM</h3>
                 <h2 className="text-2xl sm:text-4xl font-black text-white sports-font uppercase tracking-wide">THE PRESS CONFERENCE</h2>
              </div>

              <div className="border border-[rgba(255,255,255,0.065)] rounded-xl mb-4 sm:mb-6 overflow-hidden">
                 <div className="bg-[#101410] px-3 py-2 border-b border-[rgba(255,255,255,0.065)]">
                   <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest">INTERVIEWEE BREAKDOWN</span>
                 </div>
                 <div className="p-3 sm:p-4 bg-[#1a2230]">
                    <p className="text-xs sm:text-sm text-white flex items-center flex-wrap gap-1.5">
                      <span className="font-bold text-[#3b82f6]">🎙️ {primaryJournalist.name}</span> 
                      {primaryJournalist.outlet && <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest font-sans mr-1">{primaryJournalist.outlet}</span>}
                      — {primaryJournalist.desc}
                    </p>
                 </div>
              </div>

              <div className="border border-[rgba(255,255,255,0.065)] rounded-xl mb-4 sm:mb-6 overflow-hidden">
                 <div className="bg-[#101410] px-3 py-2 border-b border-[rgba(255,255,255,0.065)]">
                   <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest">THE TRANSCRIPT</span>
                 </div>
                 <div className="p-2 sm:p-4 bg-[#1a2230] flex flex-col gap-2 sm:gap-3">
                   {activePress.answers.map((ans, i) => {
                     const journalist = journalistsList[i] || primaryJournalist;
                     const isHit = ans === journalist?.id;
                     const vibe = PRESS_VIBES[ans];
                     return (
                       <div key={i} className="flex justify-between items-center bg-[#101410] p-2 sm:p-3 rounded-lg border border-[rgba(255,255,255,0.03)]">
                          <div className="flex items-center gap-2 sm:gap-3">
                             <span className="text-[10px] font-bold text-slate-500 mr-2 hidden sm:inline">Q{i+1}: {journalist?.name}</span>
                             <span className={`text-[8px] sm:text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest ${vibe?.bg} ${vibe?.color} border ${vibe?.border}`}>{vibe?.icon} {vibe?.label}</span>
                             {!isHit && <span className="text-slate-500 text-[9px] sm:text-xs italic hidden sm:inline">(Missed the mark)</span>}
                          </div>
                          <span className={`text-[10px] sm:text-sm font-black ${isHit ? 'text-[#22E748]' : 'text-[#ef4444]'}`}>{isHit ? '✅ MATCH' : '❌ MISS'}</span>
                       </div>
                     )
                   })}
                 </div>
              </div>

              <div className="bg-[#101410] border border-[rgba(255,255,255,0.065)] rounded-xl p-4 sm:p-6 text-center mb-6 sm:mb-8 flex flex-col items-center">
                 <span className="text-2xl sm:text-3xl mb-2">🎤</span>
                 <h3 className={`text-lg sm:text-2xl font-black sports-font uppercase tracking-wide ${resultColor} mb-1`}>{resultTitle}</h3>
                 <p className="text-slate-400 text-xs sm:text-sm">{resultText}</p>
              </div>

              <button onClick={handleEndPress} className="w-full btn-primary py-4 rounded-xl text-base sm:text-xl cursor-pointer sports-font tracking-widest">
                CONTINUE CAREER ➔
              </button>
            </div>
           );
        })();
}
