import 'react';
import { useAppContext } from '../AppContext';
import { PRESS_VIBES } from '../utils/appHelpers';

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

           return (
            <div className="game-panel p-6 sm:p-10 mt-2 border-t-2 border-t-[#3b82f6] text-center max-w-2xl mx-auto">
              <div className="mb-6 sm:mb-8 border-b border-[rgba(255,255,255,0.065)] pb-6">
                 <h3 className="text-xs sm:text-sm font-bold text-slate-400 tracking-widest uppercase mb-1 font-sans">PRESS ROOM</h3>
                 <h2 className="text-3xl sm:text-5xl font-black text-white sports-font uppercase tracking-wide">THE TRANSCRIPT</h2>
              </div>

              <div className="flex flex-col gap-3 mb-8">
                   {activePress.answers.map((ans, i) => {
                     const journalist = journalistsList[i];
                     const isHit = ans === journalist?.id;
                     const vibe = PRESS_VIBES[ans];
                     return (
                       <div key={i} className="flex justify-between items-center bg-[#101410] p-4 rounded-xl border border-[rgba(255,255,255,0.03)] shadow-lg hover:border-[rgba(255,255,255,0.1)] transition-colors">
                          <div className="flex items-center gap-3">
                             <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest bg-black/50 px-3 py-1.5 rounded">Q{i+1}</span>
                             <span className={`text-[10px] sm:text-[11px] font-black px-3 py-1.5 rounded uppercase tracking-widest ${vibe?.bg} ${vibe?.color} border ${vibe?.border}`}>{vibe?.icon} {vibe?.label}</span>
                          </div>
                          <span className={`text-base sm:text-lg font-black sports-font tracking-widest ${isHit ? 'text-[#22E748]' : 'text-[#ef4444]'}`}>{isHit ? '✅ MATCH' : '❌ MISS'}</span>
                       </div>
                     )
                   })}
              </div>

              <div className={`bg-black/40 border border-[rgba(255,255,255,0.065)] rounded-2xl p-6 text-center mb-8 flex flex-col items-center shadow-inner`}>
                 <span className="text-3xl sm:text-4xl mb-3">🎤</span>
                 <h3 className={`text-xl sm:text-3xl font-black sports-font uppercase tracking-widest ${resultColor} mb-2`}>{resultTitle}</h3>
                 <p className="text-slate-400 text-sm sm:text-base font-sans">{resultText}</p>
              </div>

              <button onClick={handleEndPress} className="w-full btn-primary py-4 rounded-xl text-lg sm:text-xl cursor-pointer sports-font tracking-widest shadow-lg transition-transform active:scale-95">
                CONTINUE CAREER ➔
              </button>
            </div>
           );
        })();
}