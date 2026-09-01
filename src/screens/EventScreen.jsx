import { useState } from 'react';
import { useAppContext } from '../AppContext';

export default function EventScreen() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { activeEvent, handleEventChoice, player } = useAppContext();

  // SAFEGUARD 1: Reset the click lock whenever a new event appears (chained
  // events — e.g. Rivalry Night resolving into a follow-up event — reuse this
  // same component instance without unmounting, so state doesn't naturally
  // reset. Without this, the second event's buttons render disabled from the
  // previous click's lock.
   const [prevEvent, setPrevEvent] = useState(activeEvent);
   if (activeEvent !== prevEvent) {
       setPrevEvent(activeEvent);
       setIsProcessing(false);
   }
  
  if (!activeEvent) {
      return (
         <div className="game-panel p-10 mt-2 text-center text-slate-400 animate-pulse font-sans">
            Loading next event...
         </div>
      );
  }
  
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

          const renderDesc = (text) => {
             if (!text) return null;
             const parts = text.split(/(\*\*.*?\*\*)/g);
             return parts.map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                   return <strong key={i} className="text-white font-black">{part.slice(2, -2)}</strong>;
                }
                return part;
             });
          };

          return (
          <div className={`game-panel p-4 sm:p-10 mt-2 border-t-2 relative overflow-hidden ${panelStyles}`}>
            {isGenEvent && <div className="bluechip-foil-overlay opacity-60"></div>}
            {isInjuryEvent && <div className="bluechip-foil-overlay opacity-50 mix-blend-color-dodge" style={{ filter: 'hue-rotate(-45deg) saturate(200%)' }}></div>}
            {isDemotion && <div className="bluechip-foil-overlay opacity-30 mix-blend-overlay grayscale"></div>}
            
            <div className="relative z-10">
              <h2 className={`text-xl sm:text-2xl font-black uppercase mb-3 sm:mb-4 sports-font text-left flex items-center gap-1 sm:gap-1.5 ${titleColor}`}>
                {!isInjuryEvent && <span className="shrink-0 leading-none pb-0.5">🗣</span>}
                <span className="leading-tight">{activeEvent.title}</span>
              </h2>
              <p className="text-sm sm:text-lg text-slate-300 mb-6 sm:mb-8 w-full font-sans text-left leading-relaxed pr-2 sm:pr-4">
                {renderDesc(activeEvent.desc)}
              </p>
              <div className="grid grid-cols-1 gap-3 sm:gap-4 font-sans items-stretch">
                {(activeEvent.choices || []).map((c, i) => (
                  <button key={i} disabled={isProcessing} onClick={() => {
                      if (isProcessing) return;
                      setIsProcessing(true);

                      // SAFEGUARD 3: force-release the lock after 1.5s no matter
                      // what — nuclear backstop in case handleEventChoice silently
                      // fails to transition the screen. If the transition works
                      // normally, this component unmounts and the timeout is
                      // harmless. If not, buttons unlock so the player can retry
                      // instead of being permanently stuck.
                      const releaseTimeout = setTimeout(() => setIsProcessing(false), 1500);

                      try {
                        let modChoice = { ...c };
                        if (activeEvent.title?.includes('COMMERCIAL') || activeEvent.title?.includes('SPONSOR') || activeEvent.title?.includes('ENDORSEMENT')) {
                            const tTrust = player.relationships?.teammates || 50;
                            let relHit = 0;
                            if (tTrust < 45) relHit = -15;
                            else if (tTrust > 75) relHit = 5;

                            if (relHit !== 0) {
                                modChoice.effect = {
                                    ...modChoice.effect,
                                    rel: { ...(modChoice.effect?.rel || {}), teammates: (modChoice.effect?.rel?.teammates || 0) + relHit }
                                };
                            }
                        }
                        handleEventChoice(modChoice);
                      } catch (e) {
                        // SAFEGUARD 2: if handleEventChoice throws (like the
                        // safeNationalities crash from an earlier turn), log it
                        // and release the lock so the player can try again.
                        // React ErrorBoundaries don't catch event-handler errors,
                        // so this try/catch is what keeps a click-handler crash
                        // from permanently locking the buttons.
                        console.error('[EventScreen] handleEventChoice threw:', e);
                        clearTimeout(releaseTimeout);
                        setIsProcessing(false);
                      }
                  }} className={`bg-[#101410] hover:bg-[#1a2230] border border-[rgba(255,255,255,0.065)] text-white p-4 sm:p-5 rounded-xl text-left transition-all flex flex-col justify-center gap-2 shadow-lg h-auto ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
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