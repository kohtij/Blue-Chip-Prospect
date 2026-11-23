import 'react';
import PerkChip from '../components/PerkChip';
import { useAppContext } from '../AppContext';
import { getFullTeamName } from '../utils/appHelpers';
import { formatComp, offerSheetComp, offerSheetCompLong } from '../utils/contracts';
import { formatMoney, formatMoney3, isRestricted, onNhlContract, ovrEffectText, withTeamArticle } from '../utils/gameHelpers';
import { bonusCeiling } from '../utils/bonuses';
import { getPrimaryRival, getTeamData, nhlTeams, readableAccent, teamAccent } from '../data/teams';
import TeamLogo from '../components/TeamLogo';
import { TITLE_MD } from '../utils/ui';

// Each club already carries its own two colours, and `teamAccent` picks the one
// that reads against a near-black card. That gives every offer its own identity.
// The ghosted grey crest behind the text was after the same thing and never
// managed it: a watermark big enough to recognise fought with the text, and one
// small enough to ignore was a smudge. A thin strip of the club's colour does
// the job in a tenth of the space.

// Offer sheet compensation is written as rounds joined by a plus, because the
// long form did not fit the row it is printed in. The table lives in
// utils/contracts.js now, since the club deciding whether to match needs it.
const getCompensation = (salary) => offerSheetComp(salary);
const compensationLong = (salary) => offerSheetCompLong(salary);

export default function TransferScreen() {
  const { freeAgencyOffers, player, signContract, startNegotiation, handleArbitration } = useAppContext();

  let owningTeam = player.team;
  let owningLeague = player.league;
  
  // Only an NHL deal belongs to the parent club. See onNhlContract.
  if (['AHL', 'ECHL'].includes(owningLeague) && onNhlContract(player)) {
     const parent = (nhlTeams || []).find(t => t.ahlId === player.team || t.echlId === player.team);
     if (parent) {
         owningTeam = parent.id;
         owningLeague = 'NHL';
     }
  }
  
  const owningTeamName = getFullTeamName(owningTeam, owningLeague);
  const teamDidNotOffer = !freeAgencyOffers.some(o => o.team === owningTeam);
  // "The Luleå HF" read wrong. European clubs take no article.
  const OwnerThe = withTeamArticle(owningTeamName, owningLeague, true);
  // The Europe-only market: a farewell tour, or a way out of a relegated club.
  const europeBoard = freeAgencyOffers.length > 0 && freeAgencyOffers.every(o => o.state === 'Europe');

  return (
          <div className="game-panel p-6 sm:p-10 mt-2">
            <h2 className={`${TITLE_MD} mb-4 text-center`}>
              {freeAgencyOffers.some(o => o.type === 'TRADE') ? 'TRADE REQUEST' : freeAgencyOffers.some(o => ['SCHOLARSHIP', 'PRO CONTRACT'].includes(o.type)) ? 'OPEN MARKET' : 'FREE AGENCY'}
            </h2>
            <p className="text-slate-400 text-base sm:text-lg mb-8 sm:mb-10 font-medium text-center max-w-2xl mx-auto">
              {freeAgencyOffers.some(o => o.type === 'TRADE')
                ? "Your agent has several trade offers. Pick where you want to go."
                : freeAgencyOffers.some(o => ['SCHOLARSHIP', 'PRO CONTRACT'].includes(o.type))
                  ? "You're looking at other routes: an NCAA scholarship, or a pro contract in Europe."
                  : europeBoard
                    ? "Every club on this board is in Europe. Pick where you play next season."
                  : freeAgencyOffers.some(o => o.type === 'QUALIFYING OFFER' || o.type === 'RFA EXTENSION')
                    ? (() => {
                        // What a qualifying offer is, said once, here. The card
                        // used to carry a small "ACCEPT Q.O." button with no
                        // word on what taking it meant.
                        const qo = freeAgencyOffers.find(o => o.type === 'QUALIFYING OFFER');
                        return qo
                          ? `You're a restricted free agent. The ${owningTeamName} qualified you at ${formatMoney3(qo.salary)} for one year, which keeps your rights with them. Take their longer deal, sign the qualifying offer and be restricted again next summer${qo.arbitration ? ', or file for arbitration' : ''}. Other clubs can send you an offer sheet, and the ${owningTeamName} can match it.`
                          : `You're a restricted free agent. The ${owningTeamName} hold your rights, and other clubs can send you an offer sheet that they can match.`;
                      })()
                    : teamDidNotOffer
                        ? (isRestricted(player)
                            ? `${OwnerThe} elected not to extend a Qualifying Offer. You're now an Unrestricted Free Agent testing the open market.`
                            : `${OwnerThe} elected not to offer you a new contract. You're on the open market.`)
                        : "You have reached Unrestricted Free Agency. You can re-sign with your current club or explore options elsewhere."}
            </p>

            {/* Two offers a row at most: beside the player card there isn't room
                for three without the terms and perks wrapping. */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-5xl mx-auto pb-6 px-2 sm:px-0">
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
                                 <h3 className={`${size} font-black text-white sports-font leading-tight uppercase tracking-wide break-words`}
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
                              {formatMoney3(o.salary)}
                            </span>
                             <span className="text-[10px] sm:text-[11px] font-black text-slate-500 uppercase tracking-widest">/{o.type === 'SCHOLARSHIP' ? 'NIL' : 'YR'}</span>
                           </div>
                           <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                             {o.type === 'SCHOLARSHIP' ? '4-YEAR ELIGIBILITY' : `${o.years}-YEAR CONTRACT`}
                           </span>
                        </div>

                        {/* NOTHING IN THIS BLOCK MAY WRAP.
                            Cards sit in a grid row and stretch to the tallest
                            of them, so one value spilling onto a second line
                            adds a line to every card beside it as well as
                            looking untidy on its own. Measured at the narrowest
                            the cards ever get, the 640px two-column layout where
                            each one is 312px wide, Compensation had four pixels
                            of slack and wrapped.
                            Each label is pinned and a long value wraps onto a
                            second line, right-aligned. Nothing on the card is
                            cut off with an ellipsis any more. */}
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
                             <span className="ml-auto min-w-0 break-words text-right text-white" title={o.role}>{o.role}</span>
                           </p>
                           {o.standing && (
                             <p className="flex items-baseline gap-1 font-bold uppercase tracking-wider">
                               <span className="text-slate-500 shrink-0">Projected finish</span>
                               <span className="ml-auto shrink-0 whitespace-nowrap text-white">#{o.standing}</span>
                             </p>
                           )}
                           {dealContext && (
                             <p className="flex items-baseline gap-1 font-bold uppercase tracking-wider">
                               <span className="text-slate-500 shrink-0">Situation</span>
                               <span className="ml-auto min-w-0 break-words text-right text-white" title={dealContext}>{dealContext}</span>
                             </p>
                           )}
                           {netFans !== 0 && (
                             <p className="flex items-baseline gap-1 font-bold uppercase tracking-wider"
                                title={perkFans !== 0
                                  ? `${o.fanHit > 0 ? '+' : ''}${o.fanHit || 0} for the move, ${perkFans > 0 ? '+' : ''}${perkFans} from the perks and flaws below`
                                  : 'The reaction to the move itself'}>
                               <span className="text-slate-500 shrink-0">Fan impact</span>
                               <span className={`ml-auto shrink-0 whitespace-nowrap ${netFans > 0 ? 'text-[#22E748]' : 'text-[#ef4444]'}`}>
                                 {netFans > 0 ? '+' : ''}{netFans} FANS
                               </span>
                             </p>
                           )}
                           {(o.nmc || o.ntc) && (
                             <p className="flex items-baseline gap-1 font-bold uppercase tracking-wider">
                               <span className="text-slate-500 shrink-0">Clause</span>
                               <span className="ml-auto shrink-0 text-[#c084fc]">{o.nmc ? 'No-Movement' : 'No-Trade'}</span>
                             </p>
                           )}
                           {o.sbShare > 0 && (
                             <p className="flex items-baseline gap-1 font-bold uppercase tracking-wider">
                               <span className="text-slate-500 shrink-0">Paid up front</span>
                               <span className="ml-auto shrink-0 whitespace-nowrap text-[#F59E0B]">{Math.round(o.sbShare * 100)}% each July 1</span>
                             </p>
                           )}
                           {o.bonuses?.length > 0 && (
                             <p className="flex items-baseline gap-1 font-bold uppercase tracking-wider">
                               <span className="text-slate-500 shrink-0">Games bonuses</span>
                               <span className="ml-auto shrink-0 whitespace-nowrap text-[#F59E0B]">Up to {formatMoney(bonusCeiling(o.bonuses))}</span>
                             </p>
                           )}
                           {/* The qualifying offer is a fact about the club's
                               card, not a second offer squeezed into a button:
                               the least they can offer and keep his rights. */}
                           {qoOffer && (
                             <p className="flex items-baseline gap-1 font-bold uppercase tracking-wider">
                               <span className="text-slate-500 shrink-0">Qualifying offer</span>
                               <span className="ml-auto shrink-0 whitespace-nowrap text-white">{formatMoney3(qoOffer.salary)} · 1 yr</span>
                             </p>
                           )}
                           {(qoOffer?.arbitration || (o.type === 'QUALIFYING OFFER' && o.arbitration)) && (
                             <p className="flex items-baseline gap-1 font-bold uppercase tracking-wider">
                               <span className="text-slate-500 shrink-0">Arbitration</span>
                               <span className="ml-auto shrink-0 whitespace-nowrap text-white">Eligible</span>
                             </p>
                           )}
                           {o.type === 'OFFER SHEET' && (
                             <p className="flex items-baseline gap-1 font-bold uppercase tracking-wider">
                               <span className="text-slate-500 shrink-0">Your club</span>
                               <span className="ml-auto shrink-0 whitespace-nowrap text-white">Can match it</span>
                             </p>
                           )}
                           {o.type === 'OFFER SHEET' && (
                             <p className="flex items-baseline gap-1 font-bold uppercase tracking-wider">
                               <span className="text-slate-500 shrink-0">Compensation</span>
                               <span className="ml-auto min-w-0 break-words text-right text-[#c084fc]" title={compensationLong(o.salary)}>{getCompensation(o.salary)}</span>
                             </p>
                           )}
                        </div>

                        {hasChips && (
                          <div className="flex flex-col gap-1.5 mb-5 z-10 relative">
                             {o.perks?.length > 0 && (
                               <div className="rounded-lg bg-[#22E748]/[0.07] px-2.5 py-1">
                                 {o.perks.map((p, pIdx) => <PerkChip key={`perk-${pIdx}`} perk={p.ovr > 0 ? { ...p, effect: ovrEffectText(player, p.ovr) } : p} />)}
                               </div>
                             )}
                             {o.flaws?.length > 0 && (
                               <div className="rounded-lg bg-[#ef4444]/[0.08] px-2.5 py-1">
                                 {o.flaws.map((f, fIdx) => <PerkChip key={`flaw-${fIdx}`} perk={f} isFlaw />)}
                               </div>
                             )}
                          </div>
                        )}

                      <div className="mt-auto flex flex-col gap-2 z-10 relative">
                         
                         {/* THE QUALIFYING OFFER AND ARBITRATION.
                             Two actions with a line each on what they mean.
                             They used to be a pair of small buttons, "ACCEPT
                             Q.O." and "ARBITRATION", that said nothing about
                             the one-year term or what came after it. */}
                         {qoOffer && (
                           <button
                             onClick={() => signContract(qoOffer)}
                             className="btn-secondary w-full py-2.5 mb-1 rounded-xl cursor-pointer sports-font tracking-widest text-[10px] sm:text-xs flex flex-col items-center leading-tight"
                           >
                             <span>SIGN QUALIFYING OFFER</span>
                             <span className="text-[8px] sm:text-[9px] opacity-80 mt-0.5 font-sans uppercase tracking-wider">
                               {formatMoney3(qoOffer.salary)} for 1 year, then restricted again
                             </span>
                           </button>
                         )}
                         {(qoOffer?.arbitration || (o.type === 'QUALIFYING OFFER' && o.arbitration)) && (
                           <button
                             onClick={() => handleArbitration(qoOffer || o)}
                             className="btn-secondary w-full py-2.5 mb-1 rounded-xl cursor-pointer sports-font tracking-widest text-[10px] sm:text-xs flex flex-col items-center leading-tight"
                           >
                             <span>FILE FOR ARBITRATION</span>
                             <span className="text-[8px] sm:text-[9px] opacity-80 mt-0.5 font-sans uppercase tracking-wider">
                               An arbitrator sets a one-year salary
                             </span>
                           </button>
                         )}

                         {/* INJECTED SECONDARY DISCOUNT BUTTON (MOVED UP) */}
                         {discountOffer && (
                           <button 
                             onClick={() => signContract(discountOffer)} 
                             className="btn-secondary w-full py-2.5 mb-1 rounded-xl cursor-pointer sports-font tracking-widest text-[10px] sm:text-xs flex flex-col items-center leading-tight"
                           >
                             <span>HOMETOWN DISCOUNT</span>
                             <span className="text-[8px] sm:text-[9px] opacity-80 mt-0.5 font-sans uppercase tracking-wider">
                               Take {formatMoney3(discountOffer.salary)}/yr for +100 fans
                             </span>
                           </button>
                         )}

                         {/* The alternatives come first and the commitment last.
                             Signing is the one action on this card you can't take
                             back, so it sits at the bottom edge of every card, in
                             the same place whether or not there is anything above
                             it. */}
                         {(!o.negotiated && o.type !== 'SCHOLARSHIP' && o.type !== 'QUALIFYING OFFER') && (
                           <div className="flex gap-2 mb-1">
                             {!o.negotiated && o.type !== 'QUALIFYING OFFER' && o.type !== 'SCHOLARSHIP' && (
                               <button onClick={() => startNegotiation(o)} className="btn-secondary flex-1 py-2 rounded-xl sports-font tracking-widest text-[9px] sm:text-[10px] cursor-pointer">
                                 NEGOTIATE
                               </button>
                             )}
                           </div>
                         )}

                         <button
                           onClick={() => signContract(o)}
                           // Green for every signing, red when it means joining the
                           // arch-rival, which is the one signing with a cost.
                           className={`w-full py-3 rounded-xl cursor-pointer sports-font tracking-widest text-sm sm:text-base active:scale-[0.98] ${
                             isRival ? 'btn-danger' : 'btn-primary'
                           }`}
                         >
                           {o.type === 'QUALIFYING OFFER' ? 'SIGN QUALIFYING OFFER'
                             : o.type === 'OFFER SHEET' ? (isRival ? 'BETRAY & SIGN SHEET' : 'SIGN OFFER SHEET')
                               : isReturnHome ? 'RETURN HOME' : isRival ? 'BETRAY & SIGN' : 'SIGN DEAL'}
                         </button>
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* THE OFFERS COME FIRST.

                The comparables used to sit above them, so the thing the
                screen exists for, the actual offers, started below the fold
                and had to be scrolled to. The agent's reasoning is what you
                read after seeing the numbers, not before. */}
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
              // "48 pts in 74" left the second figure doing its job by
              // implication. It is games, so it says games.
              const unit = market.group === 'G'
                ? (c) => `${(c.sv || 0).toFixed(3).replace('0.', '.')} in ${c.gp} GP`
                : (c) => `${c.pts} pts in ${c.gp} GP`;
              const short = market.anchor - best;
              return (
                <div className="max-w-2xl mx-auto mt-2 mb-8 rounded-xl border border-[rgba(255,255,255,0.07)] bg-[#0a0d0a] overflow-hidden">
                  <div className="px-4 py-2 border-b border-[rgba(255,255,255,0.06)] flex items-baseline justify-between gap-3">
                    <span className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">
                      Your agent&rsquo;s comparables
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">
                      Market value <span className="text-white font-black number-font">{formatComp(market.anchor)}</span>
                    </span>
                  </div>
                  {market.comps.map(c => (
                    <div key={c.id || c.name}
                         className="flex items-center gap-2.5 px-4 py-1.5 border-b border-[rgba(255,255,255,0.04)] last:border-0">
                      <span className="min-w-0 flex-1 break-words text-[12.5px] font-medium text-slate-300">{c.name}</span>
                      <span className="hidden sm:block shrink-0 text-[10px] font-black uppercase tracking-widest text-slate-500 w-8 text-right">{c.pos}</span>
                      <span className="shrink-0 text-[11px] font-bold text-slate-500 w-[104px] text-right break-words">{unit(c)}</span>
                      <span className="shrink-0 text-[11px] font-black number-font text-slate-300 w-[62px] text-right">{formatComp(c.salary)}</span>
                    </div>
                  ))}
                  {/* Says which offer and which figure it's measuring, so
                      "above it" no longer has to be worked out. Close to the
                      market isn't bad news, so it isn't red. */}
                  <p className={`px-4 py-2 text-[11px] font-bold border-t border-[rgba(255,255,255,0.06)] ${
                    short > market.anchor * 0.08 ? 'text-[#ef4444]' : short >= 0 ? 'text-slate-300' : 'text-[#22E748]'}`}>
                    {short > market.anchor * 0.08
                      ? `Your best offer pays ${formatComp(best)}, ${formatComp(short)} less than your market value${isRestricted(player) ? ', which is normal for a restricted free agent' : ''}.`
                      : short >= 0
                        ? `Your best offer pays ${formatComp(best)}, close to your market value.`
                        : `Your best offer pays ${formatComp(best)}, ${formatComp(-short)} more than your market value.`}
                  </p>
                </div>
              );
            })()}
          </div>
        );
}
