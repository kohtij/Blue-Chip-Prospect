import { useState } from 'react';
import PerkChip from '../components/PerkChip';
import { useAppContext } from '../AppContext';
import TeamLogo from '../components/TeamLogo';
import { getFullTeamName } from '../utils/appHelpers';
import { getPrimaryRival, getTeamData, readableAccent, teamAccent } from '../data/teams';
import { kickerClass, TAG_AMBER, TAG_GREEN, TAG_RED, TITLE_SM } from '../utils/ui';

export default function EventScreen() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { activeEvent, handleEventChoice, player } = useAppContext();

  // SAFEGUARD 1: Reset the click lock whenever a new event appears (chained
  // events, e.g. Rivalry Night resolving into a follow-up event, reuse this
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

          // Three kinds of event wear a tint, so the moment reads before the
          // words do. The title stays white on all of them: colour belongs to
          // the panel and the kicker, not to the headline. They also used to
          // glow, each in its own colour, which nothing else in the game does.
          let panelStyles = '';
          let kicker = null;

          if (isGenEvent) {
             panelStyles = 'bg-gradient-to-br from-[#1a1405] to-[#0a0802]';
             kicker = { tone: 'amber', text: 'Generational talent' };
          } else if (isInjuryEvent) {
             panelStyles = 'bg-gradient-to-br from-[#1a0505] to-[#0a0202]';
             kicker = { tone: 'red', text: 'Season-ending injury' };
          } else if (isDemotion) {
             panelStyles = 'bg-gradient-to-br from-[#0f1115] to-[#050608]';
             kicker = { tone: 'neutral', text: 'Roster move' };
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

                  // Written in the same shape as the free agency perks (a name
                  // and an effect), so the chips line up the same way on both
                  // screens instead of one long shouted string.
                  const G = 'text-[#22E748] bg-[#22E748]/10 border-[#22E748]/30';
                  const B = 'text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/30';
                  if (isRival) {
                      displayChoice.flaws.push({ name: '⚔️ Arch-Rival', effect: '-75 FAN' });
                      displayChoice.effect.fanStatus = (displayChoice.effect.fanStatus || 0) - 75;
                  }

                  if (displayChoice.actionData.madePlayoffs) {
                      displayChoice.perks.push({ name: premiumLeague === 'NCAA' ? '🏆 Tournament Team' : '🏆 Cup Run', color: G });
                      if (charCode % 2 === 0) {
                          displayChoice.perks.push({ name: '📈 Elite Coaching', effect: '+1 OVR', color: B });
                          displayChoice.effect.ovr = (displayChoice.effect.ovr || 0) + 1;
                      }
                  } else {
                      displayChoice.perks.push({ name: '⏱️ Top-6 Minutes', color: B });
                      if (charCode % 2 !== 0) {
                          displayChoice.flaws.push({ name: '⚠️ Rebuilding', effect: '-10 FAN' });
                          displayChoice.effect.fanStatus = (displayChoice.effect.fanStatus || 0) - 10;
                      }
                  }

                  if (charCode % 3 === 0) {
                       displayChoice.perks.push({ name: '🏟️ Major Market', effect: '+15 FAN', color: G });
                       displayChoice.effect.fanStatus = (displayChoice.effect.fanStatus || 0) + 15;
                  } else if (charCode % 3 === 1) {
                       displayChoice.flaws.push({ name: '⚠️ Small Market', effect: '-5 FAN' });
                       displayChoice.effect.fanStatus = (displayChoice.effect.fanStatus || 0) - 5;
                  }
              }

              // Silent Rivalry Penalty for Standard Narrative Trades
              if (!isTradeChoice && c.action === 'ACCEPT_TRADE_DEADLINE' && c.actionData?.teamObj) {
                  const rival = getPrimaryRival(player.team, player.league);
                  if (rival && rival.id === c.actionData.teamObj.id) {
                      displayChoice.effect.fanStatus = (displayChoice.effect.fanStatus || 0) - 75;
                  }
              }

              // WHAT IT COSTS, AND WHETHER HE HAS IT.
              //
              // A choice that spends money was selectable whatever the balance,
              // so the experimental rehab could be taken for a hundred thousand
              // by a junior who had never been paid, and the money simply went
              // negative. The worst case across every branch is the price: a
              // gamble that costs the same win or lose costs that either way.
              const branches = [c.effect?.money, c.successEffect?.money, c.failEffect?.money]
                  .filter(m => typeof m === 'number');
              const cost = branches.length ? -Math.min(0, ...branches) : 0;

              return { key: i, displayChoice, isPremiumChoice, isTradeChoice, isNCAAChoice, premiumTeamId, premiumLeague, isRival, cost };
          });

          // Nothing is ever priced out of reach if it would leave the player
          // with no way forward: an event he cannot answer is a dead end, and
          // some of these fire in the offseason with no other way out.
          const bank = player.stats?.earnings || 0;
          const affordable = prepared.filter(x => x.cost <= bank);
          prepared.forEach(x => {
              x.shortBy = affordable.length > 0 && x.cost > bank ? x.cost - bank : 0;
          });

          // Rivalry Night deliberately keeps its plain rows, so its three tactical
          // choices read as equals instead of one being dressed up as a card.
          const premiumChoices = isRivalryNight ? [] : prepared.filter(p => p.isPremiumChoice);
          const plainChoices = prepared.filter(p => !premiumChoices.includes(p));

          // PREMIUM CARD. The same card the Free Agency screen draws, built
          // the same way: one neutral border, the club's colour as a strip
          // across the top, a tag line every card has, the crest and name, a
          // figure in white, labelled rows, the chips, and a real button at the
          // bottom. The trade cards used to carry a coloured ribbon and outline
          // of their own, so the two screens showed the same kind of decision
          // in two different languages.
          const renderPremiumCard = ({ key, displayChoice, isTradeChoice, isNCAAChoice, premiumTeamId, premiumLeague, isRival }) => {
              const data = displayChoice.actionData;
              const money = displayChoice.effect?.money || 0;
              const fanStatus = displayChoice.effect?.fanStatus || 0;
              const isTransfer = !!data?.transfer || premiumLeague === 'NCAA';

              const teamData = getTeamData(premiumTeamId, premiumLeague);
              const accent = teamAccent(teamData);
              const accentText = readableAccent(accent);
              const conference = teamData?.ncaaConf || teamData?.div || null;
              const fullName = getFullTeamName(premiumTeamId, premiumLeague);
              const nameSize = fullName.length > 26 ? 'text-[10px] sm:text-[11px]'
                  : fullName.length > 21 ? 'text-[11px] sm:text-xs'
                    : fullName.length > 16 ? 'text-xs sm:text-sm'
                      : 'text-sm sm:text-base';

              // The headline figure. A free agent is looking at a salary; a
              // traded player keeps the contract he already has, so that is the
              // figure that travels with him. A college offer shows its NIL
              // money. Anything with no money attached leads with where the
              // club is expected to finish.
              const salary = player.contract?.salary || 0;
              const yrsLeft = player.contract?.years || 0;
              let hero;
              if (isNCAAChoice || (isTransfer && money > 0)) {
                  hero = { value: formatMoney(money), unit: '/NIL', caption: isNCAAChoice ? '4-YEAR ELIGIBILITY' : 'NIL PACKAGE' };
              } else if (isTradeChoice && !isTransfer && salary > 0) {
                  hero = { value: formatMoney(salary), unit: '/YR', caption: `YOUR CONTRACT, ${yrsLeft} ${yrsLeft === 1 ? 'YEAR' : 'YEARS'} LEFT` };
              } else {
                  hero = { value: `#${data?.teamStandings ?? '?'}`, unit: null, caption: 'PROJECTED FINISH' };
              }
              const finishRow = isTradeChoice && data?.teamStandings != null && hero.caption !== 'PROJECTED FINISH';
              const situation = isTradeChoice
                  ? (data?.madePlayoffs ? (premiumLeague === 'NCAA' ? 'Tournament bound' : 'Playoff bound') : 'Rebuilding')
                  : null;

              // As on the free agency cards, the tag line is only for something
              // out of the ordinary, but every card keeps the line so the rows
              // below stay level.
              const tag = isRival ? { text: 'Arch-rival', cls: 'text-[#ef4444]' } : null;

              const ctaText = (isNCAAChoice || isTransfer) ? 'COMMIT' : 'ACCEPT TRADE';

              return (
                <div key={key} className="bg-[#0a0d0a] border border-[rgba(255,255,255,0.065)] rounded-xl relative overflow-hidden flex flex-col transition-all hover:scale-[1.02] shadow-lg group">
                  <div className="p-4 sm:p-5 flex flex-col flex-1">

                    <div className="h-4 mb-2 z-10 relative flex items-center">
                      {tag && (
                        <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-[0.18em] leading-none ${tag.cls}`}>
                          {tag.text}
                        </span>
                      )}
                    </div>

                    <div className="absolute inset-x-0 top-0 h-[3px] z-10" style={{ backgroundColor: accent }} />
                    <div
                      className="absolute inset-x-0 top-0 h-24 z-0 pointer-events-none opacity-[0.14] group-hover:opacity-[0.22] transition-opacity duration-300"
                      style={{ background: `radial-gradient(120% 100% at 50% 0%, ${accent} 0%, transparent 70%)` }}
                    />

                    <div className="flex items-center gap-3 mb-5 z-10 relative min-h-[48px]">
                       <div className="shrink-0">
                         <TeamLogo teamId={premiumTeamId} league={premiumLeague} isAHL={premiumLeague === 'AHL'} size="small" />
                       </div>
                       <div className="min-w-0 flex-1">
                         <h3 className={`${nameSize} font-black text-white sports-font leading-tight uppercase tracking-wide break-words line-clamp-2`}
                             title={fullName}>
                           {fullName}
                         </h3>
                         <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest block mt-1" style={{ color: accentText }}>
                           {[premiumLeague, conference].filter(Boolean).join(' · ')}
                         </span>
                       </div>
                    </div>

                    <div className="flex flex-col z-10 relative mb-4">
                       <div className="flex items-baseline gap-1.5">
                         <span className="text-3xl sm:text-4xl font-black text-white sports-font tracking-tighter">
                           {hero.value}
                         </span>
                         {hero.unit && (
                           <span className="text-[10px] sm:text-[11px] font-black text-slate-500 uppercase tracking-widest">{hero.unit}</span>
                         )}
                       </div>
                       <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                         {hero.caption}
                       </span>
                    </div>

                    {(finishRow || situation || fanStatus !== 0) && (
                      <div className="z-10 relative mb-4 border-t border-[rgba(255,255,255,0.07)] pt-3 flex flex-col gap-1.5 text-[11px] sm:text-xs font-sans">
                         {finishRow && (
                           <p className="flex items-baseline gap-1 font-bold uppercase tracking-wider">
                             <span className="text-slate-500 shrink-0">Projected finish</span>
                             <span className="ml-auto shrink-0 whitespace-nowrap text-white">#{data.teamStandings}</span>
                           </p>
                         )}
                         {situation && (
                           <p className="flex items-baseline gap-1 font-bold uppercase tracking-wider">
                             <span className="text-slate-500 shrink-0">Situation</span>
                             <span className="ml-auto min-w-0 truncate text-right text-white">{situation}</span>
                           </p>
                         )}
                         {fanStatus !== 0 && (
                           <p className="flex items-baseline gap-1 font-bold uppercase tracking-wider">
                             <span className="text-slate-500 shrink-0">Fan impact</span>
                             <span className={`ml-auto shrink-0 whitespace-nowrap ${fanStatus > 0 ? 'text-[#22E748]' : 'text-[#ef4444]'}`}>
                               {fanStatus > 0 ? '+' : ''}{fanStatus} FANS
                             </span>
                           </p>
                         )}
                      </div>
                    )}

                    {(displayChoice.perks?.length > 0 || displayChoice.flaws?.length > 0) && (
                      <div className="flex flex-col gap-1.5 mb-5 z-10 relative">
                         {displayChoice.perks?.map((p, pIdx) => (
                           <PerkChip key={`perk-${pIdx}`} perk={p} />
                         ))}
                         {displayChoice.flaws?.map((f, fIdx) => (
                           <PerkChip key={`flaw-${fIdx}`} perk={f} isFlaw />
                         ))}
                      </div>
                    )}

                    <div className="mt-auto flex flex-col gap-2 z-10 relative">
                      <button
                        disabled={isProcessing}
                        onClick={() => fireChoice(displayChoice)}
                        aria-label={`${ctaText === 'COMMIT' ? 'Commit to' : 'Accept the trade to'} ${fullName}`}
                        className={`w-full py-3 rounded-xl sports-font tracking-widest text-sm sm:text-base active:scale-[0.98] ${
                          isRival ? 'btn-danger' : 'btn-primary'} ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        {ctaText}
                      </button>
                    </div>
                  </div>
                </div>
              );
          };

          // PLAIN ROW, everything that isn't a club offer keeps the full-width look.
          const renderPlainRow = ({ key, displayChoice, shortBy, cost }) => (
            <button
              key={key}
              disabled={isProcessing || shortBy > 0}
              onClick={() => fireChoice(displayChoice)}
              className={`relative overflow-hidden group p-4 sm:p-5 rounded-xl text-left transition-all flex flex-col justify-center shadow-lg h-full border ${
                shortBy > 0
                  ? 'bg-[#0d100d] text-slate-500 border-[rgba(255,255,255,0.05)] cursor-not-allowed'
                  : `bg-[#101410] hover:bg-[#151b15] text-white border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.22)] ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}`}
            >
              <div className="flex justify-between items-start w-full gap-4 relative z-10">
                 <div className="flex flex-col min-w-0">
                     <span className={`font-bold text-left leading-tight text-sm sm:text-base ${shortBy > 0 ? 'text-slate-500' : 'text-white'}`}>
                         {displayChoice.label}
                     </span>
                     {displayChoice.subLabel && (
                         <span className="text-[10px] sm:text-xs text-slate-400 font-medium mt-0.5">{displayChoice.subLabel}</span>
                     )}
                 </div>
                 <div className="flex flex-col items-end gap-2 shrink-0">
                   {shortBy > 0 ? (
                     <span className={TAG_RED}>
                       {formatMoney(shortBy)} short
                     </span>
                   ) : (
                     <>
                       {/* What it costs, as a pill rather than a number smuggled
                           into the label. The family investment was still
                           carrying its price in its own text, "Fund the Startup
                           ($125k)", which is the thing the money pill on the
                           premium cards exists to stop: a figure written into a
                           button cannot be compared against the choice beside
                           it. Only shown when he can afford it, because the
                           shortfall pill above says it louder when he cannot. */}
                       {cost > 0 && <span className={TAG_AMBER}>{formatMoney(cost)}{displayChoice.isRisky ? ' at risk' : ' cost'}</span>}
                       {!isRivalryNight && displayChoice.isDevBoost && <span className={TAG_GREEN}>+Dev boost</span>}
                       {displayChoice.isRisky && <span className={TAG_RED}>Risky</span>}
                     </>
                   )}
                 </div>
              </div>

              {/* What the choice is actually worth. Only the premium trade and
                  scholarship cards used to draw these, so an ordinary event had
                  to smuggle the number into its own label text, as the local
                  sponsorship did with "Do the Commercial ($50k)". A figure
                  buried in a button is easy to miss and impossible to compare
                  against the choice next to it. */}
              {(displayChoice.perks?.length > 0 || displayChoice.flaws?.length > 0) && (
                <div className="flex flex-wrap gap-1.5 mt-3 w-full relative z-10">
                  {/* Laid out in a row rather than a narrow stacked column, which
                      left the right half of the choice empty. */}
                  {displayChoice.perks?.map((pk, pIdx) => (
                    <PerkChip key={`crow-perk-${pIdx}`} perk={pk} inline />
                  ))}
                  {displayChoice.flaws?.map((fl, fIdx) => (
                    <PerkChip key={`crow-flaw-${fIdx}`} perk={fl} isFlaw inline />
                  ))}
                </div>
              )}
            </button>
          );

          return (
          <div className={`game-panel p-4 sm:p-10 mt-2 relative overflow-hidden ${panelStyles}`}>
            {isGenEvent && <div className="bluechip-foil-overlay opacity-60"></div>}
            {isInjuryEvent && <div className="bluechip-foil-overlay opacity-50 mix-blend-color-dodge" style={{ filter: 'hue-rotate(-45deg) saturate(200%)' }}></div>}
            {isDemotion && <div className="bluechip-foil-overlay opacity-30 mix-blend-overlay grayscale"></div>}

            <div className="relative z-10">
              {kicker && <span className={`${kickerClass(kicker.tone)} mb-4`}>{kicker.text}</span>}
              {/* One icon, the event's own. A speech bubble used to sit in
                  front of it on every event, so most titles carried two. The
                  icon is decoration and is hidden from screen readers. */}
              <h2 className={`${TITLE_SM} mb-3 sm:mb-4 text-left flex items-center gap-2`}>
                {(() => {
                  const m = /^((?:\p{Extended_Pictographic}|\p{Regional_Indicator}|\uFE0F|\u200D)+)\s*/u.exec(activeEvent.title || '');
                  return m
                    ? <span className="leading-tight"><span aria-hidden="true">{m[1]} </span>{activeEvent.title.slice(m[0].length)}</span>
                    : <span className="leading-tight">{activeEvent.title}</span>;
                })()}
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