import { useState } from 'react';
import { useAppContext } from '../AppContext';
import TeamLogo from '../components/TeamLogo';
import { getFullTeamName } from '../utils/appHelpers';
import { getPrimaryRival } from '../data/teams';

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
          const isRivalryNight = activeEvent.title?.includes('RIVALRY NIGHT');

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
                {(activeEvent.choices || []).map((c, i) => {
                  const isTradeChoice = c.action === 'ACCEPT_TRADE_DEADLINE' && c.actionData?.teamObj;
                  const isNCAAChoice = c.action === 'JOIN_NCAA' && c.actionData;
                  const isPremiumChoice = isTradeChoice || isNCAAChoice;

                  let premiumTeamId = '';
                  let premiumLeague = '';

                  if (isTradeChoice) {
                      premiumTeamId = c.actionData.teamObj.id;
                      premiumLeague = c.actionData.lg;
                  } else if (isNCAAChoice) {
                      premiumTeamId = c.actionData; // For NCAA, actionData is just the team string ID
                      premiumLeague = 'NCAA';
                  }

                  // 1. CLONE THE CHOICE TO SAFELY INJECT DYNAMIC DATA
                  const displayChoice = {
                      ...c,
                      perks: [...(c.perks || [])],
                      flaws: [...(c.flaws || [])],
                      effect: { ...(c.effect || {}) }
                  };

                  let btnClass = `relative overflow-hidden group p-4 sm:p-5 rounded-xl text-left transition-all flex flex-col justify-center shadow-lg h-full ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`;

                  // 2. APPLY TRADE LOGIC, RIVALRY, AND DETERMINISTIC TRAITS
                  if (isTradeChoice) {
                      const rival = getPrimaryRival(player.team, player.league);
                      const tId = premiumTeamId;
                      const isRival = rival && rival.id === tId;
                      const charCode = tId.charCodeAt(0) || 0;

                      if (isRival) {
                          displayChoice.flaws.push({ text: 'ARCH-RIVAL: FANS WILL REVOLT' });
                          displayChoice.effect.idol = (displayChoice.effect.idol || 0) - 75;
                      }

                      if (displayChoice.actionData.madePlayoffs) {
                          displayChoice.perks.push({ text: '🏆 IMMEDIATE CUP RUN', color: 'text-[#22E748] bg-[#22E748]/10 border-[#22E748]/30' });
                          if (charCode % 2 === 0) {
                              displayChoice.perks.push({ text: '📈 ELITE COACHING (+1 OVR)', color: 'text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/30' });
                              displayChoice.effect.ovr = (displayChoice.effect.ovr || 0) + 1;
                          }
                      } else {
                          displayChoice.perks.push({ text: '⏱️ GUARANTEED TOP 6 MINUTES', color: 'text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/30' });
                          if (charCode % 2 !== 0) {
                              displayChoice.flaws.push({ text: '⚠️ REBUILDING PHASE (-10 FANS)' });
                              displayChoice.effect.idol = (displayChoice.effect.idol || 0) - 10;
                          }
                      }

                      if (charCode % 3 === 0) {
                           displayChoice.perks.push({ text: '🏟️ MAJOR MARKET (+15 FANS)', color: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30' });
                           displayChoice.effect.idol = (displayChoice.effect.idol || 0) + 15;
                      } else if (charCode % 3 === 1) {
                           displayChoice.flaws.push({ text: '⚠️ SMALL MARKET (-5 FANS)' });
                           displayChoice.effect.idol = (displayChoice.effect.idol || 0) - 5;
                      }

                      btnClass += displayChoice.actionData.madePlayoffs
                          ? ' bg-gradient-to-r from-[#0a120a] to-[#040505] border border-[#22E748]/30 hover:border-[#22E748]/80 hover:shadow-[0_0_20px_rgba(34,231,72,0.15)]'
                          : ' bg-gradient-to-r from-[#101410] to-[#040505] border border-slate-700 hover:border-slate-400';

                      if (isRival) {
                          btnClass = btnClass.replace('border-slate-700 hover:border-slate-400', 'border-[#ef4444]/40 hover:border-[#ef4444]');
                          btnClass = btnClass.replace('border-[#22E748]/30 hover:border-[#22E748]/80', 'border-[#ef4444]/40 hover:border-[#ef4444]');
                      }
                  } else if (isNCAAChoice) {
                      // Apply NCAA-specific premium styling
                      btnClass += ' bg-gradient-to-r from-[#0a0f18] to-[#04060a] border border-[#3b82f6]/30 hover:border-[#3b82f6]/70 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]';
                  } else {
                      // Generic Event Screen styling
                      btnClass += ' bg-[#101410] hover:bg-[#1a2230] text-white border border-[rgba(255,255,255,0.065)] hover:border-[#3b82f6]';
                  }

                  // The footer only ever exists to show the itemized perks/flaws
                  // breakdown for Trade/NCAA choices. Generic choices rely on
                  // subLabel text instead, so they never render a footer.

                  return (
                  <button key={i} disabled={isProcessing} onClick={() => {
                      if (isProcessing) return;
                      setIsProcessing(true);
                      const releaseTimeout = setTimeout(() => setIsProcessing(false), 1500);

                      try {
                        let modChoice = { ...displayChoice };
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
                        console.error('[EventScreen] handleEventChoice threw:', e);
                        clearTimeout(releaseTimeout);
                        setIsProcessing(false);
                      }
                  }} className={btnClass}>

                    {/* MASSIVE BACKGROUND WATERMARK FOR PREMIUM CHOICES */}
                    {isPremiumChoice && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] group-hover:opacity-[0.06] grayscale pointer-events-none z-0 transition-all duration-300">
                            <div className="w-full h-full flex items-center justify-center transform -rotate-6 scale-[2.5]">
                                <TeamLogo teamId={premiumTeamId} league={premiumLeague} isAHL={premiumLeague === 'AHL'} size="large" />
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col w-full relative z-10 gap-3">
                        {/* TOP ROW: LOGO + TITLES */}
                        <div className="flex justify-between items-start w-full gap-4">
                           <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                               {isPremiumChoice && (
                                  <div className="shrink-0 flex items-center justify-center bg-black/40 p-2 sm:p-2.5 rounded-lg border border-[rgba(255,255,255,0.08)] shadow-inner">
                                     <TeamLogo teamId={premiumTeamId} league={premiumLeague} isAHL={premiumLeague === 'AHL'} size="medium" />
                                  </div>
                               )}
                               <div className="flex flex-col min-w-0 mt-0.5">
                                   <span className={`font-bold text-left leading-tight truncate ${isPremiumChoice ? 'text-base sm:text-lg sports-font tracking-wide uppercase text-white' : 'text-sm sm:text-base text-white'}`}>
                                       {isTradeChoice
                                           ? `TRADE TO ${getFullTeamName(premiumTeamId, premiumLeague).toUpperCase()}`
                                           : isNCAAChoice
                                              ? `COMMIT TO ${getFullTeamName(premiumTeamId, premiumLeague).toUpperCase()}`
                                              : displayChoice.label}
                                   </span>

                                   {isTradeChoice && (
                                       <div className="flex items-center gap-2 mt-1.5">
                                           <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${displayChoice.actionData.madePlayoffs ? 'bg-[#22E748]/10 text-[#22E748] border-[#22E748]/30' : 'bg-slate-700/30 text-slate-400 border-slate-600/50'}`}>
                                               {displayChoice.actionData.madePlayoffs ? 'PLAYOFF BOUND' : 'REBUILDING'}
                                           </span>
                                           <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                               Proj. Rank #{displayChoice.actionData.teamStandings || '?'}
                                           </span>
                                       </div>
                                   )}

                                   {isNCAAChoice && (
                                       <div className="flex items-center gap-2 mt-1.5">
                                           <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/30">
                                               {displayChoice.subLabel || 'NCAA D1 PROGRAM'}
                                           </span>
                                           <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                               SCHOLARSHIP OFFER
                                           </span>
                                       </div>
                                   )}

                                   {!isPremiumChoice && displayChoice.subLabel && (
                                       <span className="text-[10px] sm:text-xs text-slate-400 font-medium mt-0.5">{displayChoice.subLabel}</span>
                                   )}
                               </div>
                           </div>

                           {/* SIDE BADGES */}
                           <div className="flex flex-col items-end gap-2 shrink-0">
                             {!isRivalryNight && displayChoice.isDevBoost && <span className="bg-[#22E748]/10 text-[#22E748] text-[10px] sm:text-xs px-2 py-1 rounded font-black tracking-widest uppercase border border-[#22E748]/30">+DEV BOOST</span>}
                             {displayChoice.isRisky && <span className="bg-[#ef4444]/10 text-[#ef4444] text-[10px] sm:text-xs px-2 py-1 rounded font-black tracking-widest uppercase border border-[#ef4444]/30">RISKY</span>}
                           </div>
                        </div>

                        {/* BOTTOM ROW: ITEMIZED PERKS/FLAWS FOOTER — TRADE/NCAA ONLY */}
                        {!isRivalryNight && isPremiumChoice && (
                          <div className="flex flex-wrap gap-2 pt-3 border-t border-[rgba(255,255,255,0.065)]">
                            {displayChoice.perks?.map((p, idx) => (
                               <span key={`perk-${idx}`} className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-widest border ${p.color || 'text-[#22E748] bg-[#22E748]/10 border-[#22E748]/30'}`}>
                                  {p.text}
                               </span>
                            ))}
                            {isPremiumChoice && displayChoice.flaws?.map((f, idx) => (
                               <span key={`flaw-${idx}`} className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-widest text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/30">
                                  {f.text}
                               </span>
                            ))}

                            {/* Fallback only makes sense for premium choices, since only those have a "program" concept */}
                            {isPremiumChoice && (!displayChoice.perks || displayChoice.perks.length === 0) && (!displayChoice.flaws || displayChoice.flaws.length === 0) && (
                               <span className="text-[10px] text-slate-500 italic">No notable program perks or flaws.</span>
                            )}
                          </div>
                        )}
                    </div>
                  </button>
                );
                })}
              </div>
            </div>
          </div>
          );
        })();
}