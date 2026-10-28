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
             // Split by bold (**...**) OR italic (*...*)
             const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
             return parts.map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                   return <strong key={i} className="text-white font-black">{part.slice(2, -2)}</strong>;
                }
                if (part.startsWith('*') && part.endsWith('*')) {
                   // Renders as subtle, slightly faded italics
                   return <em key={i} className="italic text-slate-400 opacity-90">{part.slice(1, -1)}</em>;
                }
                return part;
             });
          };

          const formatMoney = (amount) => {
             if (!amount) return '$0';
             return amount >= 1000000
                ? `$${(amount / 1000000).toFixed(1)}M`
                : `$${Math.round(amount / 1000)}K`;
          };

          // Shared click path for every choice, card or row.
          const fireChoice = (displayChoice) => {
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
          };

          // Build a render model for every choice up front, so the premium ones
          // can be laid out as a card grid while the rest stay as full-width rows.
          const prepared = (activeEvent.choices || []).map((c, i) => {
              const isTradeChoice = (c.action === 'ACCEPT_TRADE_DEADLINE' || c.action === 'TRADE_HOLDOUT') && c.actionData?.showTeamCard;
              const isNCAAChoice = c.action === 'JOIN_NCAA' && c.actionData;
              const isPremiumChoice = isTradeChoice || isNCAAChoice;

              let premiumTeamId = '';
              let premiumLeague = '';

              if (isTradeChoice) {
                  premiumTeamId = c.actionData.teamObj.id;
                  premiumLeague = c.actionData.lg;
              } else if (isNCAAChoice) {
                  premiumTeamId = c.actionData;
                  premiumLeague = 'NCAA';
              }

              // CLONE THE CHOICE TO SAFELY INJECT DYNAMIC DATA
              const displayChoice = {
                  ...c,
                  perks: [...(c.perks || [])],
                  flaws: [...(c.flaws || [])],
                  effect: { ...(c.effect || {}) }
              };

              let isRival = false;

              // APPLY TRADE LOGIC, RIVALRY, AND DETERMINISTIC TRAITS
              if (isTradeChoice) {
                  const rival = getPrimaryRival(player.team, player.league);
                  const tId = premiumTeamId;
                  isRival = !!(rival && rival.id === tId);
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
              }

              // Silent Rivalry Penalty for Standard Narrative Trades
              if (!isTradeChoice && c.action === 'ACCEPT_TRADE_DEADLINE' && c.actionData?.teamObj) {
                  const rival = getPrimaryRival(player.team, player.league);
                  if (rival && rival.id === c.actionData.teamObj.id) {
                      displayChoice.effect.idol = (displayChoice.effect.idol || 0) - 75;
                  }
              }

              return { key: i, displayChoice, isPremiumChoice, isTradeChoice, isNCAAChoice, premiumTeamId, premiumLeague, isRival };
          });

          // Rivalry Night deliberately keeps its plain rows, so its three tactical
          // choices read as equals instead of one being dressed up as a card.
          const premiumChoices = isRivalryNight ? [] : prepared.filter(p => p.isPremiumChoice);
          const plainChoices = prepared.filter(p => !premiumChoices.includes(p));

          // PREMIUM CARD — mirrors the Free Agency offer card on the Transfer screen:
          // ribbon, crest, headline figure, status row, perks/flaws, call to action.
          const renderPremiumCard = ({ key, displayChoice, isTradeChoice, isNCAAChoice, premiumTeamId, premiumLeague, isRival }) => {
              const data = displayChoice.actionData;
              const madePlayoffs = isTradeChoice && !!data?.madePlayoffs;
              const money = displayChoice.effect?.money || 0;
              const idol = displayChoice.effect?.idol || 0;

              let cardBorder = 'border-slate-700';
              let ribbonClass = 'bg-slate-700 text-slate-200';
              let ribbonText = '🔧 REBUILDING CLUB';

              if (isRival) {
                  cardBorder = 'border-[#ef4444] shadow-[0_0_15px_rgba(239,68,68,0.2)]';
                  ribbonClass = 'bg-[#ef4444] text-white';
                  ribbonText = '⚔️ ARCH-RIVAL OFFER';
              } else if (isNCAAChoice) {
                  cardBorder = 'border-[#3b82f6] shadow-[0_0_15px_rgba(59,130,246,0.15)]';
                  ribbonClass = 'bg-[#3b82f6] text-white';
                  ribbonText = '🎓 SCHOLARSHIP OFFER';
              } else if (madePlayoffs) {
                  cardBorder = 'border-[#22E748] shadow-[0_0_15px_rgba(34,231,72,0.15)]';
                  ribbonClass = 'bg-[#22E748] text-black';
                  ribbonText = '🏆 PLAYOFF BOUND';
              }

              // Headline figure: a trade sells the club's projected finish, a
              // scholarship sells its NIL money. The conference is NOT used here —
              // it already appears as the badge below and would just read twice.
              // Every card's figure is a short token of the same shape (#7, $75K)
              // so they line up across the row.
              const heroValue = isTradeChoice
                  ? `#${data?.teamStandings ?? '?'}`
                  : formatMoney(money);
              const heroCaption = isTradeChoice ? 'PROJECTED FINISH' : 'NIL PACKAGE';

              // Green means good everywhere else in the game, so it is only used
              // when the figure is actually good news: a playoff club, or real NIL
              // money. A bottom-table finish or an empty NIL package stays neutral.
              const heroGood = isTradeChoice ? madePlayoffs : money > 0;
              const heroColor = isRival
                  ? 'text-[#ef4444]'
                  : heroGood ? 'text-[#22E748]' : 'text-slate-300';

              const ctaText = isNCAAChoice ? 'COMMIT' : isRival ? 'BETRAY & SIGN' : 'ACCEPT TRADE';
              const ctaClass = isRival
                  ? 'bg-[#ef4444] border-[#b91c1c] text-white group-hover:bg-[#f87171]'
                  : 'bg-[#22E748] border-[#16a34a] text-black group-hover:bg-[#4ade80]';

              return (
                <button
                  key={key}
                  disabled={isProcessing}
                  onClick={() => fireChoice(displayChoice)}
                  className={`bg-[#0a0d0a] border ${cardBorder} rounded-xl relative overflow-hidden flex flex-col text-left shadow-lg group transition-all ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-[1.02]'}`}
                >
                  <div className={`relative z-10 ${ribbonClass} text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-4 py-2 text-center sports-font w-full`}>
                    {ribbonText}
                  </div>

                  <div className="p-4 sm:p-5 flex flex-col flex-1">
                    {/* Crest watermark, cropped by the card. Kept at 2.5 because the
                        source logos are only 150px square and blur past roughly 1.6x. */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] group-hover:opacity-[0.10] grayscale pointer-events-none z-0 transition-all duration-300">
                        <div className="w-full h-full flex items-center justify-center transform -rotate-6 scale-[2.25] sm:scale-[2.5]">
                            <TeamLogo teamId={premiumTeamId} league={premiumLeague} isAHL={premiumLeague === 'AHL'} size="large" />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 mb-4 z-10 relative">
                       <TeamLogo teamId={premiumTeamId} league={premiumLeague} isAHL={premiumLeague === 'AHL'} size="small" />
                       <div className="min-w-0 flex-1">
                         <h3 className="text-sm sm:text-base font-black text-white sports-font leading-tight uppercase tracking-wide break-words">
                           {getFullTeamName(premiumTeamId, premiumLeague)}
                         </h3>
                         {/* NCAA skips this: its conference badge below already
                             places the programme, so "NCAA" here is just noise. */}
                         {isTradeChoice && premiumLeague && premiumLeague !== 'NHL' && (
                           <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest block mt-1">{premiumLeague}</span>
                         )}
                       </div>
                    </div>

                    <div className="flex flex-col z-10 relative mb-4">
                       <span className={`text-3xl sm:text-4xl font-black ${heroColor} sports-font tracking-tighter drop-shadow-md leading-none`}>
                         {heroValue}
                       </span>
                       <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mt-1.5">
                         {heroCaption}
                       </span>
                    </div>

                    <div className="flex flex-col gap-1.5 z-10 relative mb-4 text-[11px] sm:text-xs font-sans text-slate-300">
                       {/* Trades show no status badge here: the ribbon already states
                           playoff or rebuilding, and the rank is the headline figure. */}
                       {isNCAAChoice && (
                         <span className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/30">
                               {displayChoice.subLabel || 'NCAA D1'}
                            </span>
                         </span>
                       )}
                       {idol !== 0 && (
                         <p className="flex items-start gap-2">
                           <span className="leading-none mt-0.5">{idol > 0 ? '📈' : '📉'}</span>
                           <span className={idol > 0 ? 'text-[#22E748]' : 'text-[#ef4444]'}>
                             Fan Impact: <strong className="font-black tracking-wider">{idol > 0 ? '+' : ''}{idol} FANS</strong>
                           </span>
                         </p>
                       )}
                    </div>

                    {(displayChoice.perks?.length > 0 || displayChoice.flaws?.length > 0) && (
                      <div className="flex flex-col gap-1.5 mb-6 z-10 relative">
                         {displayChoice.perks?.map((p, pIdx) => (
                            <span key={`perk-${pIdx}`} className={`text-[9px] sm:text-[10px] px-2 py-1 rounded font-black tracking-widest uppercase border leading-none self-start ${p.color || 'text-[#22E748] bg-[#22E748]/10 border-[#22E748]/30'}`}>
                               {p.text}
                            </span>
                         ))}
                         {displayChoice.flaws?.map((f, fIdx) => (
                            <span key={`flaw-${fIdx}`} className="text-[9px] sm:text-[10px] px-2 py-1 rounded font-black tracking-widest uppercase border leading-none self-start text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]/30">
                               {f.text}
                            </span>
                         ))}
                      </div>
                    )}

                    <div className="mt-auto z-10 relative">
                      <div className={`w-full py-3 rounded-xl text-center sports-font tracking-widest font-black text-sm sm:text-base uppercase border shadow-lg transition-all ${ctaClass}`}>
                        {ctaText}
                      </div>
                    </div>
                  </div>
                </button>
              );
          };

          // PLAIN ROW — everything that isn't a club offer keeps the full-width look.
          const renderPlainRow = ({ key, displayChoice }) => (
            <button
              key={key}
              disabled={isProcessing}
              onClick={() => fireChoice(displayChoice)}
              className={`relative overflow-hidden group p-4 sm:p-5 rounded-xl text-left transition-all flex flex-col justify-center shadow-lg h-full bg-[#101410] hover:bg-[#1a2230] text-white border border-[rgba(255,255,255,0.065)] hover:border-[#3b82f6] ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex justify-between items-start w-full gap-4 relative z-10">
                 <div className="flex flex-col min-w-0">
                     <span className="font-bold text-left leading-tight text-sm sm:text-base text-white">
                         {displayChoice.label}
                     </span>
                     {displayChoice.subLabel && (
                         <span className="text-[10px] sm:text-xs text-slate-400 font-medium mt-0.5">{displayChoice.subLabel}</span>
                     )}
                 </div>
                 <div className="flex flex-col items-end gap-2 shrink-0">
                   {!isRivalryNight && displayChoice.isDevBoost && <span className="bg-[#22E748]/10 text-[#22E748] text-[10px] sm:text-xs px-2 py-1 rounded font-black tracking-widest uppercase border border-[#22E748]/30">+DEV BOOST</span>}
                   {displayChoice.isRisky && <span className="bg-[#ef4444]/10 text-[#ef4444] text-[10px] sm:text-xs px-2 py-1 rounded font-black tracking-widest uppercase border border-[#ef4444]/30">RISKY</span>}
                 </div>
              </div>
            </button>
          );

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

              {premiumChoices.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 font-sans items-stretch">
                  {premiumChoices.map(renderPremiumCard)}
                </div>
              )}

              {plainChoices.length > 0 && (
                <div className={`grid grid-cols-1 gap-3 sm:gap-4 font-sans items-stretch ${premiumChoices.length > 0 ? 'mt-4' : ''}`}>
                  {plainChoices.map(renderPlainRow)}
                </div>
              )}
            </div>
          </div>
          );
        })();
}