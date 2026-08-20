import 'react';
import { useAppContext } from '../AppContext';

export default function EventScreen() {
  const { activeEvent, handleEventChoice } = useAppContext();
  return (() => {
          const isGenEvent = activeEvent.title === '🌟 THE CHOSEN ONE';
          const isInjuryEvent = activeEvent.title === '🚑 DEVASTATING INJURY';
          const isDemotion = activeEvent.isDemotionEvent || activeEvent.title?.includes('DEMOTED') || activeEvent.title?.includes('SENT DOWN') || activeEvent.title?.includes('ASSIGNED');
          
          let panelStyles = 'border-t-[#3b82f6]';
          let titleColor = 'text-white';
          
          if (isGenEvent) {
             panelStyles = 'border-t-[#F59E0B] shadow-[0_0_40px_rgba(245,158,11,0.2)] bg-gradient-to-br from-[#1a1405] to-[#0a0802]';
             titleColor = 'text-[#F59E0B]';
          } else if (isInjuryEvent) {
             panelStyles = 'border-t-[#ef4444] shadow-[0_0_40px_rgba(239,68,68,0.2)] bg-gradient-to-br from-[#1a0505] to-[#0a0202]';
             titleColor = 'text-[#ef4444]';
          } else if (isDemotion) {
             panelStyles = 'border-t-slate-500 shadow-[0_0_40px_rgba(100,116,139,0.15)] bg-gradient-to-br from-[#0f1115] to-[#050608]';
             titleColor = 'text-slate-300';
          }

          return (
          <div className={`game-panel p-4 sm:p-10 mt-2 border-t-2 relative overflow-hidden ${panelStyles}`}>
            {isGenEvent && <div className="bluechip-foil-overlay opacity-60"></div>}
            {isInjuryEvent && <div className="bluechip-foil-overlay opacity-50 mix-blend-color-dodge" style={{ filter: 'hue-rotate(-45deg) saturate(200%)' }}></div>}
            {isDemotion && <div className="bluechip-foil-overlay opacity-30 mix-blend-overlay grayscale"></div>}
            
            <div className="relative z-10">
              <h2 className={`text-xl sm:text-2xl font-black uppercase mb-3 sm:mb-4 sports-font text-left ${titleColor}`}>
                {isInjuryEvent ? '' : '🗣 '}{activeEvent.title}
              </h2>
              <p className="text-sm sm:text-lg text-slate-300 mb-6 sm:mb-8 max-w-2xl font-sans text-left">{activeEvent.desc}</p>
              <div className="flex flex-col gap-2 sm:gap-4 font-sans">
                {(activeEvent.choices || []).map((c, i) => (
                  <button key={i} onClick={() => handleEventChoice(c)} className="bg-[#101410] hover:bg-[#1a2230] border border-[rgba(255,255,255,0.065)] text-white p-4 sm:p-5 rounded-xl text-left transition-all cursor-pointer flex flex-col gap-2 shadow-lg">
                    <div className="flex justify-between items-start sm:items-center w-full gap-4">
                       <span className="text-sm sm:text-base font-bold text-left leading-tight">{c.label}</span>
                       <div className="flex items-center gap-2 shrink-0 mt-1 sm:mt-0">
                         {c.isDevBoost && <span className="bg-[#22E748]/10 text-[#22E748] text-[10px] sm:text-xs px-2 py-1 rounded font-black tracking-widest uppercase border border-[#22E748]/30">+DEV BOOST</span>}
                         {c.isRisky && <span className="bg-[#ef4444]/10 text-[#ef4444] text-[10px] sm:text-xs px-2 py-1 rounded font-black tracking-widest uppercase border border-[#ef4444]/30">RISKY</span>}
                       </div>
                    </div>
                    
                    {c.subLabel && <span className="text-[10px] sm:text-xs text-slate-400 font-medium">{c.subLabel}</span>}
                    
                    {((c.perks && c.perks.length > 0) || (c.flaws && c.flaws.length > 0)) && (
                       <div className="flex flex-wrap gap-2 mt-1">
                          {c.perks && c.perks.map((p, idx) => (
                             <span key={`perk-${idx}`} className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-widest border ${p.color}`}>
                                {p.text}
                             </span>
                          ))}
                          {c.flaws && c.flaws.map((f, idx) => (
                             <span key={`flaw-${idx}`} className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-widest text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/30">
                                {f.text}
                             </span>
                          ))}
                       </div>
                    )}
                    {c.perks && c.perks.length === 0 && c.flaws && c.flaws.length === 0 && !c.subLabel && (
                       <span className="text-[10px] text-slate-500 italic">No notable program perks or flaws.</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
          );
        })();
}