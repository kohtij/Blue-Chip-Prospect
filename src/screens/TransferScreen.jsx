import React from 'react';
import { getFullTeamName } from '../utils/appHelpers';
import { getPrimaryRival } from '../data/teams';
import TeamLogo from '../components/TeamLogo';

// Extracted from App.jsx. Auto-generated with JSX-aware external analysis.
export default function TransferScreen({ freeAgencyOffers, handleArbitration, player, signContract, startNegotiation }) {
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
                    : !freeAgencyOffers.some(o => o.team === player.team)
                        ? (['NHL', 'AHL'].includes(player.league) && player.age < 27 && (player.stats?.seasonsPlayed || 0) < 7
                            ? `The ${getFullTeamName(player.team, player.league)} elected not to extend a Qualifying Offer. You are now an Unrestricted Free Agent testing the open market.`
                            : `The ${getFullTeamName(player.team, player.league)} elected not to offer you a new contract. You are now testing the open market looking for a new home.`)
                        : "You have reached Unrestricted Free Agency. You can re-sign with your current club or explore options elsewhere."}
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-5xl mx-auto pb-6 px-2 sm:px-0">
              {(freeAgencyOffers || []).map((o, i) => {
                const rivalObj = getPrimaryRival ? getPrimaryRival(player.team, player.league) : null;
                const isRival = rivalObj && (rivalObj.id === o.team || rivalObj.name === o.team);
                const isDraftTeam = (player.draftTeam || player.rights) === o.team;
                const hasPlayedFor = (player.teamsPlayedFor || []).includes(o.team);
                const isLovedStatus = player.idolatry >= 400;
                const isReturnHome = isDraftTeam && player.team !== o.team && hasPlayedFor && isLovedStatus;
                const isExtension = o.state === 'Current Club';

                let topBorder = 'border-[rgba(255,255,255,0.065)]';
                if (isExtension) { topBorder = 'border-[#22E748] shadow-[0_0_15px_rgba(34,231,72,0.15)]'; }
                else if (isRival) { topBorder = 'border-[#ef4444] shadow-[0_0_15px_rgba(239,68,68,0.2)]'; }
                else if (isReturnHome) { topBorder = 'border-[#F59E0B] shadow-[0_0_15px_rgba(245,158,11,0.2)]'; }
                else if (o.type === 'OFFER SHEET') { topBorder = 'border-[#c084fc] shadow-[0_0_15px_rgba(192,132,252,0.15)]'; }

                return (
                  <div key={i} className={`bg-[#0a0d0a] border ${topBorder} rounded-xl relative overflow-hidden flex flex-col transition-all hover:scale-[1.02] shadow-lg group`}>
                    
                    {/* TOP BANNERS */}
                    {isExtension && <div className="bg-[#22E748] text-black text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-4 py-2 text-center sports-font w-full">✅ EXTENSION OFFER</div>}
                    {isRival && <div className="bg-[#ef4444] text-white text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-4 py-2 text-center sports-font w-full">🔥 ARCH-RIVAL OFFER</div>}
                    {isReturnHome && !isRival && <div className="bg-[#F59E0B] text-black text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-4 py-2 text-center sports-font w-full">🏠 RETURNING HOME</div>}
                    {o.type === 'OFFER SHEET' && <div className="bg-[#c084fc] text-black text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-4 py-2 text-center sports-font w-full">📝 OFFER SHEET</div>}

                    {/* INTERNAL CONTENT WRAPPER */}
                    <div className="p-4 sm:p-5 flex flex-col flex-1">
                      {/* WATERMARK */}
                      <div className="absolute top-1/2 right-[-10%] -translate-y-1/2 opacity-[0.04] group-hover:opacity-[0.08] pointer-events-none grayscale mix-blend-screen transition-opacity">
                         <TeamLogo teamId={o.team} league={o.league || 'NHL'} isAHL={o.league === 'AHL'} size="large" className="scale-[3]" />
                      </div>

                      {/* HEADER */}
                      <div className="flex items-center gap-3 mb-4 z-10 relative">
                         <TeamLogo teamId={o.team} league={o.league || 'NHL'} isAHL={o.league === 'AHL'} size="small" />
                         <div className="min-w-0 flex-1">
                           <h3 className="text-sm sm:text-base font-black text-white sports-font leading-tight uppercase tracking-wide break-words">{getFullTeamName(o.team, o.league)}</h3>
                           {o.league && o.league !== 'NHL' && <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest block mt-1">{o.league}</span>}
                         </div>
                      </div>

                      {/* SALARY (Custom 2-Decimal Formatter) */}
                      <div className="flex flex-col z-10 relative mb-4">
                         <div className="flex items-baseline gap-1">
                           <span className="text-3xl sm:text-4xl font-black text-[#22E748] sports-font tracking-tighter drop-shadow-md">
                             {o.salary >= 1000000 ? `$${(o.salary / 1000000).toFixed(2)}M` : `$${(o.salary / 1000).toFixed(0)}K`}
                           </span>
                           <span className="text-[10px] sm:text-[11px] font-black text-[#22E748]/80 uppercase tracking-widest">/{o.type === 'SCHOLARSHIP' ? 'NIL' : 'YR'}</span>
                         </div>
                         <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                           {o.type === 'SCHOLARSHIP' ? '4-YEAR ELIGIBILITY' : `${o.years}-YEAR CONTRACT`}
                         </span>
                      </div>

                      {/* DETAILS */}
                      <div className="flex flex-col gap-1.5 z-10 relative mb-6 text-[11px] sm:text-xs font-sans text-slate-300">
                         <p className="flex items-start gap-2">
                           <span><strong className="text-white uppercase tracking-wider">{o.role}</strong> · {o.state === 'Current Club' ? 'Staying Put' : (o.state || 'Pro Roster')}</span>
                         </p>
                         {o.idolHit !== 0 && (
                           <p className="flex items-start gap-2">
                             <span className="leading-none mt-0.5">{o.idolHit > 0 ? '📈' : '📉'}</span>
                             <span className={o.idolHit > 0 ? 'text-[#22E748]' : 'text-[#ef4444]'}>
                               Fan Impact: <strong className="font-black tracking-wider">{o.idolHit > 0 ? '+' : ''}{o.idolHit} IDOLATRY</strong>
                             </span>
                           </p>
                         )}
                         {o.nmc && (
                           <p className="flex items-start gap-2">
                             <span className="text-[#c084fc] leading-none mt-0.5">🔒</span>
                             <span className="text-[#c084fc] font-bold uppercase tracking-wider">No-Movement Clause</span>
                           </p>
                         )}
                      </div>

                      {/* ACTIONS */}
                    <div className="mt-auto flex flex-col gap-2 z-10 relative">
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

                         {(o.type === 'QUALIFYING OFFER' || (!o.negotiated && player.ovr >= 80 && o.type !== 'SCHOLARSHIP')) && (
                           <div className="flex gap-2">
                             {o.type === 'QUALIFYING OFFER' && (
                               <button onClick={() => handleArbitration(o)} className="flex-1 py-2 rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/40 text-[#ef4444] font-black sports-font tracking-widest text-[9px] sm:text-[10px] hover:bg-[#ef4444]/20 transition-colors cursor-pointer">
                                 ARBITRATION
                               </button>
                             )}
                             {!o.negotiated && o.type !== 'QUALIFYING OFFER' && player.ovr >= 80 && o.type !== 'SCHOLARSHIP' && (
                               <button onClick={() => startNegotiation(o)} className="flex-1 py-2 rounded-lg bg-[#3b82f6]/10 border border-[#3b82f6]/40 text-[#3b82f6] font-black sports-font tracking-widest text-[9px] sm:text-[10px] hover:bg-[#3b82f6]/20 transition-colors cursor-pointer">
                                 NEGOTIATE
                               </button>
                             )}
                           </div>
                         )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
}
