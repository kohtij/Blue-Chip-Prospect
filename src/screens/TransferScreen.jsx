import 'react';
import PerkChip from '../components/PerkChip';
import { useAppContext } from '../AppContext';
import { getFullTeamName } from '../utils/appHelpers';
import { formatComp } from '../utils/contracts';
import { getPrimaryRival, getTeamData, nhlTeams, readableAccent, teamAccent } from '../data/teams';
import TeamLogo from '../components/TeamLogo';

// Each club already carries its own two colours, and `teamAccent` picks the one
// that reads against a near-black card. That gives every offer its own identity,
// which is what the ghosted grey crest behind the text was reaching for and
// never managed: a watermark big enough to recognise fought with the text, and
// small enough to ignore was just a smudge. A thin strip of the club's colour
// does the same job in a tenth of the space.

// OFFER SHEET COMPENSATION MATH
const getCompensation = (salary) => {
    if (salary < 1500000) return 'None';
    if (salary < 2300000) return '3rd Round Pick';
    if (salary < 4600000) return '2nd Round Pick';
    if (salary < 6900000) return '1st & 3rd Round Picks';
    if (salary < 9200000) return '1st, 2nd & 3rd Round Picks';
    if (salary < 11500000) return 'Two 1sts, 2nd & 3rd';
    return 'Four 1st Round Picks';
};

export default function TransferScreen() {
  const { freeAgencyOffers, player, signContract, startNegotiation, handleArbitration } = useAppContext();

  let owningTeam = player.team;
  let owningLeague = player.league;
  
  if (owningLeague === 'AHL' && (player.contract?.salary || 0) >= 500000) {
     const parent = (nhlTeams || []).find(t => t.ahlId === player.team);
     if (parent) {
         owningTeam = parent.id;
         owningLeague = 'NHL';
     }
  }
  
  const owningTeamName = getFullTeamName(owningTeam, owningLeague);
  const teamDidNotOffer = !freeAgencyOffers.some(o => o.team === owningTeam);

  return (
          <div className="game-panel p-6 sm:p-10 mt-2 border-t-2 border-t-[#3b82f6]">
            <h2 className="text-3xl sm:text-4xl font-black italic text-white uppercase mb-4 text-center sports-font tracking-tighter">
              {freeAgencyOffers.some(o => o.type === 'TRADE') ? 'TRADE REQUEST' : freeAgencyOffers.some(o => ['SCHOLARSHIP', 'PRO CONTRACT'].includes(o.type)) ? 'OPEN MARKET' : 'FREE AGENCY'}
            </h2>
            <p className="text-slate-400 text-base sm:text-lg mb-8 sm:mb-10 font-medium text-center max-w-2xl mx-auto">
              {freeAgencyOffers.some(o => o.type === 'TRADE')
                ? "Your agent has secured multiple trade packages. Review the offers and select your next destination."
                : freeAgencyOffers.some(o => ['SCHOLARSHIP', 'PRO CONTRACT'].includes(o.type))
                  ? "You are exploring alternative developmental paths. Review scholarship offers from the NCAA or professional contracts from Europe."
                  : freeAgencyOffers.some(o => o.type === 'QUALIFYING OFFER' || o.type === 'RFA EXTENSION')
                    ? "You are a Restricted Free Agent. Your current club retains your rights, but rival teams can submit Offer Sheets."
                    : teamDidNotOffer
                        ? (['NHL', 'AHL'].includes(player.league) && player.age < 27 && (player.stats?.seasonsPlayed || 0) < 7
                            ? `The ${owningTeamName} elected not to extend a Qualifying Offer. You are now an Unrestricted Free Agent testing the open market.`
                            : `The ${owningTeamName} elected not to offer you a new contract. You are now testing the open market looking for a new home.`)
                        : "You have reached Unrestricted Free Agency. You can re-sign with your current club or explore options elsewhere."}
            </p>

            {/* WHO YOU ARE BEING MEASURED AGAINST.
                Every offer on this screen used to be a number with no argument
                behind it, because the salary came out of a closed formula on
                the player's own career averages. These are the classmates the
                price was actually built from, priced on the same scale, so the
                best offer on the board can be read as short or generous rather
                than simply accepted. */}
            {(() => {
              const market = (freeAgencyOffers || []).find(o => o.market?.comps?.length)?.market;
              if (!market) return null;
              const best = Math.max(...(freeAgencyOffers || []).map(o => o.salary || 0));
              const unit = market.group === 'G'
                ? (c) => `${(c.sv || 0).toFixed(3).replace('0.', '.')} in ${c.gp}`
                : (c) => `${c.pts} pts in ${c.gp}`;
              const short = market.anchor - best;
              return (
                <div className="max-w-2xl mx-auto mb-8 rounded-xl border border-[rgba(255,255,255,0.07)] bg-[#0a0d0a] overflow-hidden">
                  <div className="px-4 py-2 border-b border-[rgba(255,255,255,0.06)] flex items-baseline justify-between gap-3">
                    <span className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">
                      Your agent&rsquo;s comparables
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">
                      Market <span className="text-white font-black number-font">{formatComp(market.anchor)}</span>
                    </span>
                  </div>
                  {market.comps.map(c => (
                    <div key={c.id || c.name}
                         className="flex items-center gap-2.5 px-4 py-1.5 border-b border-[rgba(255,255,255,0.04)] last:border-0">
                      <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-slate-300">{c.name}</span>
                      <span className="hidden sm:block shrink-0 text-[10px] font-black uppercase tracking-widest text-slate-500 w-8 text-right">{c.pos}</span>
                      <span className="shrink-0 text-[11px] font-bold text-slate-500 w-[86px] text-right truncate">{unit(c)}</span>
                      <span className="shrink-0 text-[11px] font-black number-font text-slate-300 w-[62px] text-right">{formatComp(c.salary)}</span>
                    </div>
                  ))}
                  <p className={`px-4 py-2 text-[11px] font-bold border-t border-[rgba(255,255,255,0.06)] ${
                    short > 0 ? 'text-[#ef4444]' : 'text-[#22E748]'}`}>
                    {short > market.anchor * 0.08
                      ? `The best offer on the board is ${formatComp(short)} short of that.`
                      : short > 0
                        ? 'The best offer on the board is about right.'
                        : `The best offer on the board is ${formatComp(-short)} above it.`}
                  </p>
                </div>
              );
            })()}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-5xl mx-auto pb-6 px-2 sm:px-0">
              {(() => {
                // 1. Group offers perfectly: 1 Card per Team
                const groupedOffers = {};
                (freeAgencyOffers || []).forEach(o => {
                   const key = o.team;
                   if (!groupedOffers[key]) {
                      groupedOffers[key] = { main: null, qo: null, discount: null };
                   }
                   
                   if (o.type === 'QUALIFYING OFFER') {
                      groupedOffers[key].qo = o;
                   } else if (o.type === 'HOMETOWN DISCOUNT') {
                      groupedOffers[key].discount = o;
                   } else {
                      groupedOffers[key].main = o;
                   }
                });

                // Fallback: If a team ONLY issued a QO (no extension), make the QO the main card.
                Object.values(groupedOffers).forEach(group => {
                   if (!group.main && group.qo) {
                       group.main = group.qo;
                       group.qo = null;
                   }
                });

                // 2. Order them. An extension from your own club is the offer
                //    every other one is being measured against, so it leads;
                //    then the ones that carry a story (a rival, the club that
                //    drafted you, an offer sheet), then the rest.
                const rivalForSort = getPrimaryRival ? getPrimaryRival(player.team, player.league) : null;
                const weightOf = (o) => {
                  if (!o) return 9;
                  const isExt = o.team === owningTeam
                    || ['EXTENSION', 'QUALIFYING OFFER', 'RFA EXTENSION', 'HOMETOWN DISCOUNT'].includes(o.type);
                  if (isExt) return 0;
                  if (rivalForSort && (rivalForSort.id === o.team || rivalForSort.name === o.team)) return 1;
                  if ((player.draftTeam || player.rights) === o.team) return 2;
                  if (o.type === 'OFFER SHEET') return 3;
                  return 4;
                };

                // 3. Map over the grouped offers to render single cards
                return Object.values(groupedOffers)
                  .filter(g => g.main)
                  .sort((a, b) => weightOf(a.main) - weightOf(b.main) || (b.main.salary || 0) - (a.main.salary || 0))
                  .map((group, i) => {
                  const o = group.main;
                  const discountOffer = group.discount;
                  const qoOffer = group.qo;
                  
                  const rivalObj = getPrimaryRival ? getPrimaryRival(player.team, player.league) : null;
                  const isRival = rivalObj && (rivalObj.id === o.team || rivalObj.name === o.team);
                  const isDraftTeam = (player.draftTeam || player.rights) === o.team;
                  const hasPlayedFor = (player.teamsPlayedFor || []).includes(o.team);
                  const isLovedStatus = player.fanStatus >= 400;
                  const isReturnHome = isDraftTeam && player.team !== o.team && hasPlayedFor && isLovedStatus;
                  const isExtension = o.team === owningTeam || ['EXTENSION', 'QUALIFYING OFFER', 'RFA EXTENSION', 'HOMETOWN DISCOUNT'].includes(o.type);

                  const teamData = getTeamData(o.team, o.league);
                  const accent = teamAccent(teamData);
                  // Readable at 9px; the raw club colour is for the strip only.
                  const accentText = readableAccent(accent);

                  // Signing adds the reaction to the move and the fan effects of
                  // the perks and flaws together, so a fan impact that counted
                  // only the move was never the number you would end up with: the
                  // chips below could quietly halve it or double it. This is the
                  // total, and hovering it says where the parts came from.
                  const perkFans = o.perkTotals?.fanStatus || 0;
                  const netFans = (o.fanHit || 0) + perkFans;
                  const hasChips = o.perks?.length > 0 || o.flaws?.length > 0;

                  // `state` carries two different kinds of thing: how good the
                  // club is (Contender, Rebuilder) and what sort of deal it is
                  // (European Pro, College Program). Only the first tells you
                  // anything the card is not already showing.
                  const DEAL_TYPE_STATES = ['European Pro', 'College Program', 'Offer Sheet'];
                  const rawState = isExtension ? 'Staying Put' : o.state;
                  const dealContext = rawState && !DEAL_TYPE_STATES.includes(rawState) ? rawState : null;

                  // Every card is built the same way: one neutral border, the
                  // club's own colour as the strip across the top, and nothing
                  // else competing with it. The ribbons that used to sit above
                  // the extension, arch-rival, returning-home and offer-sheet
                  // cards added a band of height those cards' neighbours did
                  // not have, so one card in a row started lower than the rest
                  // and every line below it was out of step. What the ribbons
                  // said is still on the card: an extension reads STAYING PUT
                  // on the situation line, an offer sheet carries its
                  // compensation line, and the rival and hometown deals say so
                  // on the button you press to take them.
                  return (
                    <div key={i} className="bg-[#0a0d0a] border border-[rgba(255,255,255,0.065)] rounded-xl relative overflow-hidden flex flex-col transition-all hover:scale-[1.02] shadow-lg group">

                      <div className="p-4 sm:p-5 flex flex-col flex-1">

                        {/* What kind of offer this is, on a line every card
                            has whether it has anything to say or not, so one
                            card having a tag cannot shift the row below it.
                            This is what the ribbons used to do, without the
                            band of colour that threw the cards out of line. */}
                        {(() => {
                          const tag = isExtension
                            ? { text: o.type === 'QUALIFYING OFFER' ? 'Your club · qualifying offer' : 'Extension', cls: 'text-[#22E748]' }
                            : isReturnHome ? { text: 'Where you started', cls: 'text-[#F59E0B]' }
                              : isRival ? { text: 'Arch-rival', cls: 'text-[#ef4444]' }
                                : o.type === 'OFFER SHEET' ? { text: 'Offer sheet', cls: 'text-[#c084fc]' }
                                  : null;
                          return (
                            <div className="h-4 mb-2 z-10 relative flex items-center">
                              {tag && (
                                <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-[0.18em] leading-none ${tag.cls}`}>
                                  {tag.text}
                                </span>
                              )}
                            </div>
                          );
                        })()}

                        {/* A strip of the club's own colour across the top, a
                            crest that is actually legible, then the money. The
                            order is deliberate: who, how much, for how long, what
                            you would be there, and only then the trade-offs. */}
                        <div className="absolute inset-x-0 top-0 h-[3px] z-10" style={{ backgroundColor: accent }} />
                        <div
                          className="absolute inset-x-0 top-0 h-24 z-0 pointer-events-none opacity-[0.14] group-hover:opacity-[0.22] transition-opacity duration-300"
                          style={{ background: `radial-gradient(120% 100% at 50% 0%, ${accent} 0%, transparent 70%)` }}
                        />

                        <div className="flex items-center gap-3 mb-5 z-10 relative min-h-[48px]">
                           <div className="shrink-0">
                             <TeamLogo teamId={o.team} league={o.league || 'NHL'} isAHL={o.league === 'AHL'} size="small" />
                           </div>
                           <div className="min-w-0 flex-1">
                             {/* A two-word club name and a four-word one made
                                 the header two different heights, so every row
                                 of cards below it sat at a different offset.
                                 Clamped to two lines with a fixed floor. */}
                             {/* Two lines is all the header has, and some clubs are
                                 thirty characters long ("Wilkes-Barre/Scranton
                                 Penguins", "Blainville-Boisbriand Armada"), so a
                                 fixed size clipped them to "HENDERSON SILVER...".
                                 The type steps down with the length instead, which
                                 keeps every card the same height. */}
                             {(() => {
                               const fullName = getFullTeamName(o.team, o.league);
                               const size = fullName.length > 26 ? 'text-[10px] sm:text-[11px]'
                                 : fullName.length > 21 ? 'text-[11px] sm:text-xs'
                                   : fullName.length > 16 ? 'text-xs sm:text-sm'
                                     : 'text-sm sm:text-base';
                               return (
                                 <h3 className={`${size} font-black text-white sports-font leading-tight uppercase tracking-wide break-words line-clamp-2`}
                                     title={fullName}>{fullName}</h3>
                               );
                             })()}
                             <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest block mt-1" style={{ color: accentText }}>
                               {[o.league, teamData?.ncaaConf || teamData?.div].filter(Boolean).join(' · ')}
                             </span>
                           </div>
                        </div>

                        {/* The money, in white. It used to be the same green as the
                            perk chips and the sign button, so three different kinds
                            of thing all shouted at once and none of them led. */}
                        <div className="flex flex-col z-10 relative mb-4">
                           <div className="flex items-baseline gap-1.5">
                             <span className="text-3xl sm:text-4xl font-black text-white sports-font tracking-tighter">
                              {o.salary >= 1000000 ? `$${(o.salary / 1000000).toFixed(1)}M` : `$${(o.salary / 1000).toFixed(0)}K`}
                            </span>
                             <span className="text-[10px] sm:text-[11px] font-black text-slate-500 uppercase tracking-widest">/{o.type === 'SCHOLARSHIP' ? 'NIL' : 'YR'}</span>
                           </div>
                           <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                             {o.type === 'SCHOLARSHIP' ? '4-YEAR ELIGIBILITY' : `${o.years}-YEAR CONTRACT`}
                           </span>
                        </div>

                        <div className="z-10 relative mb-4 border-t border-[rgba(255,255,255,0.07)] pt-3 flex flex-col gap-1.5 text-[11px] sm:text-xs font-sans">
                           {/* The role and the club's outlook used to share one
                               truncated line, so "Top 4 Defenseman · Staying Put"
                               came out as "TOP 4 DEFENSEMAN · S..." on any card
                               narrow enough to matter. They get a line each now
                               and the role is allowed to wrap. */}
                           {/* Both of these were bare values with nothing saying
                               what they were, so a card read "TOP 4 DEFENSEMAN
                               #8 / STAYING PUT" and left you to guess that #8
                               was where the club is projected to finish. */}
                           <p className="flex items-baseline gap-1 font-bold uppercase tracking-wider">
                             <span className="text-slate-500 shrink-0">Role</span>
                             <span className="ml-auto text-white text-right min-w-0 break-words">{o.role}</span>
                           </p>
                           {o.standing && (
                             <p className="flex items-baseline gap-1 font-bold uppercase tracking-wider">
                               <span className="text-slate-500">Projected finish</span>
                               <span className="ml-auto shrink-0 whitespace-nowrap text-white">#{o.standing}</span>
                             </p>
                           )}
                           {dealContext && (
                             <p className="flex items-baseline gap-1 font-bold uppercase tracking-wider">
                               <span className="text-slate-500">Situation</span>
                               <span className="ml-auto shrink-0 whitespace-nowrap text-white">{dealContext}</span>
                             </p>
                           )}
                           {netFans !== 0 && (
                             <p className="flex items-baseline gap-1 font-bold uppercase tracking-wider"
                                title={perkFans !== 0
                                  ? `${o.fanHit > 0 ? '+' : ''}${o.fanHit || 0} for the move, ${perkFans > 0 ? '+' : ''}${perkFans} from the perks and flaws below`
                                  : 'The reaction to the move itself'}>
                               <span className="text-slate-500">Fan impact</span>
                               <span className={`ml-auto shrink-0 whitespace-nowrap ${netFans > 0 ? 'text-[#22E748]' : 'text-[#ef4444]'}`}>
                                 {netFans > 0 ? '+' : ''}{netFans} FANS
                               </span>
                             </p>
                           )}
                           {o.nmc && (
                             <p className="flex items-baseline gap-1 font-bold uppercase tracking-wider">
                               <span className="text-slate-500">Clause</span>
                               <span className="ml-auto shrink-0 text-[#c084fc]">No-Movement</span>
                             </p>
                           )}
                           {o.type === 'OFFER SHEET' && (
                             <p className="flex items-baseline gap-1 font-bold uppercase tracking-wider">
                               <span className="text-slate-500 shrink-0">Compensation</span>
                               <span className="ml-auto text-[#c084fc] text-right min-w-0 break-words">{getCompensation(o.salary)}</span>
                             </p>
                           )}
                        </div>

                        {hasChips && (
                          <div className="flex flex-col gap-1.5 mb-5 z-10 relative">
                             {o.perks?.map((p, pIdx) => (
                                <PerkChip key={`perk-${pIdx}`} perk={p} />
                             ))}
                             {o.flaws?.map((f, fIdx) => (
                                <PerkChip key={`flaw-${fIdx}`} perk={f} isFlaw />
                             ))}
                          </div>
                        )}

                      <div className="mt-auto flex flex-col gap-2 z-10 relative">
                         
                         {/* INJECTED QUALIFYING OFFER & ARBITRATION BUTTONS */}
                         {qoOffer && (
                           <div className="w-full flex gap-2 mb-1">
                             <button 
                               onClick={() => signContract(qoOffer)} 
                               className="flex-1 py-2 rounded-xl cursor-pointer sports-font tracking-widest font-black text-[9px] sm:text-[10px] transition-all active:scale-95 border border-slate-600 bg-[#1a2230] text-slate-300 hover:bg-[#232d3f] flex flex-col items-center leading-tight shadow-md"
                             >
                               <span>📋 ACCEPT Q.O.</span>
                               <span className="text-[8px] sm:text-[9px] opacity-80 mt-0.5 font-sans uppercase tracking-wider">
                                 {qoOffer.salary >= 1000000 ? `$${(qoOffer.salary / 1000000).toFixed(1)}M/yr` : `$${(qoOffer.salary / 1000).toFixed(0)}K/yr`}
                               </span>
                             </button>
                             <button 
                               onClick={() => handleArbitration(qoOffer)} 
                               className="flex-1 py-2 rounded-xl cursor-pointer sports-font tracking-widest font-black text-[9px] sm:text-[10px] transition-all active:scale-95 border border-[#ef4444]/50 bg-[#ef4444]/10 text-[#ef4444] hover:bg-[#ef4444]/20 flex flex-col items-center leading-tight shadow-[0_0_10px_rgba(239,68,68,0.15)]"
                             >
                               <span>⚖️ ARBITRATION</span>
                               <span className="text-[8px] sm:text-[9px] opacity-80 mt-0.5 font-sans uppercase tracking-wider">
                                 1-Yr Hearing
                               </span>
                             </button>
                           </div>
                         )}

                         {/* INJECTED SECONDARY DISCOUNT BUTTON (MOVED UP) */}
                         {discountOffer && (
                           <button 
                             onClick={() => signContract(discountOffer)} 
                             className="w-full py-2.5 mb-1 rounded-xl cursor-pointer sports-font tracking-widest font-black text-[10px] sm:text-xs transition-all active:scale-95 border border-[#F59E0B]/50 bg-[#F59E0B]/10 text-[#F59E0B] hover:bg-[#F59E0B]/20 flex flex-col items-center leading-tight shadow-[0_0_10px_rgba(245,158,11,0.15)]"
                           >
                             <span>🔒 HOMETOWN DISCOUNT</span>
                             <span className="text-[8px] sm:text-[9px] opacity-80 mt-0.5 font-sans uppercase tracking-wider">
                               Take {discountOffer.salary >= 1000000 ? `$${(discountOffer.salary / 1000000).toFixed(1)}M/yr` : `$${(discountOffer.salary / 1000).toFixed(0)}K/yr`} for +100 Fans
                             </span>
                           </button>
                         )}

                         {/* The alternatives come first and the commitment last.
                             Signing is the one action on this card you cannot take
                             back, so it sits at the bottom edge of every card, in
                             the same place whether or not there is anything above
                             it. */}
                         {(o.type === 'QUALIFYING OFFER' || (!o.negotiated && o.type !== 'SCHOLARSHIP')) && (
                           <div className="flex gap-2 mb-1">
                             {o.type === 'QUALIFYING OFFER' && !qoOffer && (
                               <button onClick={() => handleArbitration(o)} className="flex-1 py-2 rounded-xl bg-[#ef4444]/10 border border-[#ef4444]/40 text-[#ef4444] font-black sports-font tracking-widest text-[9px] sm:text-[10px] hover:bg-[#ef4444]/20 transition-colors cursor-pointer">
                                 ARBITRATION
                               </button>
                             )}
                             {!o.negotiated && o.type !== 'QUALIFYING OFFER' && o.type !== 'SCHOLARSHIP' && (
                               <button onClick={() => startNegotiation(o)} className="flex-1 py-2 rounded-xl bg-[#3b82f6]/10 border border-[#3b82f6]/40 text-[#3b82f6] font-black sports-font tracking-widest text-[9px] sm:text-[10px] hover:bg-[#3b82f6]/20 transition-colors cursor-pointer">
                                 NEGOTIATE
                               </button>
                             )}
                           </div>
                         )}

                         <button
                           onClick={() => signContract(o)}
                           className={`w-full py-3 rounded-xl cursor-pointer sports-font tracking-widest font-black text-sm sm:text-base transition-all shadow-lg hover:shadow-xl active:scale-95 active:translate-y-1 border ${
                             isReturnHome ? 'bg-[#F59E0B] border-[#d97706] text-black hover:bg-[#fbbf24]' :
                             isRival ? 'bg-[#ef4444] border-[#b91c1c] text-white hover:bg-[#f87171]' :
                             'bg-[#22E748] border-[#16a34a] text-black hover:bg-[#4ade80]'
                           }`}
                         >
                           {isReturnHome ? 'RETURN HOME' : isRival ? 'BETRAY & SIGN' : 'SIGN DEAL'}
                         </button>
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        );
}
