import { useAppContext } from '../AppContext';
import { getFullTeamName, getPlayoffTitles } from '../utils/appHelpers';
import { LEAGUE_CONFIG, getOpponentPool, getPrimaryRival, ncaaTeams } from '../data/teams';
import { capIdol, formatMoney } from '../utils/gameHelpers';
import { formatLeagueName, leagueWithArticle } from '../utils/gameHelpers';

export default function RecapScreen() {
  const { advanceToOffseason, isJunior, player, seasonEvents, seasonRecap, setActiveEvent, setPlayer, setScreen, unlockAchievement } = useAppContext();
  
  return (() => {
          const titles = getPlayoffTitles(player.league);
          let narrative;
          let narrativeTitle;
          let displayRating = (seasonRecap?.rating || 5).toFixed(1);
          
          if (seasonRecap?.titleWon === 1) displayRating = "10.0";
          else if (parseFloat(displayRating) > 9.5) displayRating = "9.5";

          const madePlayoffsForNarrative = seasonRecap?.madePlayoffs || false;
          const pw = seasonRecap?.playoffWins || 0;
          const hasHardware = seasonRecap?.awards && seasonRecap.awards.length > 0;
          const playoffSpots = LEAGUE_CONFIG[player.league]?.playoffSpots || 16;
          const maxWins = Math.log2(playoffSpots) * 4;
          const standings = seasonRecap?.standings || 16;

          const rivalObj = getPrimaryRival ? getPrimaryRival(player.team, player.league) : null;
          const rivalName = rivalObj ? (rivalObj.name || rivalObj.id) : null;
          const rivalWonTitle = rivalObj && seasonRecap?.leagueChampion?.id === rivalObj.id;

          if (seasonRecap?.titleWon === 1) {
             if (player.league === 'NHL') {
                 narrativeTitle = 'STANLEY CUP CHAMPIONS';
                 narrative = `Absolute glory. You climbed the mountain and won the Stanley Cup! Your name is immortalized.`;
             } else if (isJunior) {
                 if (seasonRecap?.memCupStatus === 'won') {
                     narrativeTitle = 'MEMORIAL CUP CHAMPIONS';
                     narrative = `Absolute glory. You conquered ${leagueWithArticle(player.league)} and lifted the Memorial Cup, cementing your legacy as a junior hockey legend.`;
                 } else if (seasonRecap?.memCupStatus === 'lost') {
                     narrativeTitle = 'REGIONAL CHAMPIONS';
                     narrative = `You dominated your league and lifted the ${titles.cupName}, but fell agonizingly short in the Memorial Cup against the nation's best. A bittersweet, but incredible season.`;
                 } else {
                     narrativeTitle = `${formatLeagueName(player.league)} CHAMPIONS`;
                     narrative = `You climbed the mountain and won the ${titles.cupName}!`;
                 }
             } else {
                 narrativeTitle = 'CHAMPIONS';
                 narrative = `Absolute glory. You climbed the mountain and won the ${titles.cupName}!`;
             }
          } else if (madePlayoffsForNarrative) {
              if (pw === maxWins - 1) {
                  narrativeTitle = 'GAME 7 HEARTBREAK';
                  narrative = 'One win away from the ultimate prize. The locker room is devastated.';
              } else if (pw >= maxWins / 2) {
                  narrativeTitle = 'DEEP PLAYOFF RUN';
                  narrative = 'A valiant effort, but you ran out of gas down the stretch.';
              } else if (pw === 0) {
                  narrativeTitle = 'SWEPT';
                  narrative = standings <= 4 
                    ? 'A humiliating sweep after a dominant regular season. The media is ruthless.' 
                    : 'Swept out of the first round. You were outmatched from puck drop.';
              } else {
                  narrativeTitle = 'PLAYOFF EXIT';
                  if (standings <= 4) {
                      narrative = 'A dominant regular season erased by a shocking early playoff collapse.';
                  } else if (standings >= 13) {
                      narrative = 'After barely squeaking into the postseason as a fringe seed, the Cinderella run was cut short.';
                  } else {
                      narrative = 'A solid regular season erased by an early playoff elimination.';
                  }
              }
              
              if (rivalWonTitle) {
                  narrative += ` Adding insult to injury, your arch-rivals—${['SHL', 'LIIGA'].includes(player.league) ? '' : 'the '}${rivalName}—lifted the trophy.`;
              } else if (hasHardware && pw > 0 && pw < maxWins - 1) {
                  narrative += " Your individual brilliance wasn't enough to carry the team.";
              }
          } else {
              narrativeTitle = 'MISSED THE DANCE';
              narrative = 'A disappointing campaign. Rebuild for next year.';
              if (rivalWonTitle) {
                  narrative = `A nightmare season. Not only did you miss the playoffs, but your arch-rivals, ${['SHL', 'LIIGA'].includes(player.league) ? '' : 'the '}${rivalName}, won it all.`;
              } else if (hasHardware) {
                  narrative = 'You had an incredible individual year, but the team completely let you down.';
              }
          }

          return (
            <div className="game-panel p-6 sm:p-10 mt-2 border-t-2 border-t-[#3b82f6]">
              <style>{`
                @keyframes subtleFadeUp {
                  0% { opacity: 0; transform: translateY(12px); }
                  100% { opacity: 1; transform: translateY(0); }
                }
                .recap-list > li {
                  opacity: 0;
                  animation: subtleFadeUp 0.5s ease-out forwards;
                }
                ${Array.from({length: 25}).map((_, i) => `.recap-list > li:nth-child(${i + 1}) { animation-delay: ${(i * 0.15) + 0.1}s; }`).join('\n')}
              `}</style>

              <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.065)] pb-4 mb-6">
                <h2 className="text-[#3b82f6] font-bold tracking-widest uppercase text-sm sm:text-lg sports-font">THE RINK REPORT</h2>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs sm:text-sm">
                  {(isJunior || player.league === 'NCAA' || ['SHL', 'LIIGA', 'EURO'].includes(player.league)) ? 'AMATEUR CAMPAIGN' : `PRO SEASON ${player.stats.seasonsPlayed - 2}`}
                </p>
              </div>

              <div className="w-full mb-8">
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-2">
                  <h1 className="text-3xl sm:text-4xl font-black text-white italic uppercase text-left sports-font tracking-tighter m-0">
                    {narrativeTitle}
                  </h1>
                  <div className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg flex items-center gap-2 border ${parseFloat(displayRating) >= 8.0 ? 'bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#F59E0B]' : 'bg-[#101410] border-[rgba(255,255,255,0.065)] text-slate-300'}`}>
                    <div className="flex flex-col text-right justify-center mt-0.5">
                      <span className="text-[8px] sm:text-[9px] font-bold tracking-widest uppercase font-sans leading-none mb-[2px]">SEASON</span>
                      <span className="text-[8px] sm:text-[9px] font-bold tracking-widest uppercase font-sans leading-none">RATING</span>
                    </div>
                    <span className="text-2xl sm:text-3xl font-black sports-font leading-none">{displayRating}</span>
                  </div>
                </div>
                <p className="text-base sm:text-lg text-slate-400 font-sans italic text-left m-0">"{narrative}"</p>
              </div>

              <ul className="recap-list space-y-3 sm:space-y-4 text-slate-300 text-sm sm:text-base font-sans text-left leading-relaxed">
                <li className="border-l-4 border-[#3b82f6] pl-4 py-2">
                  {(() => {
                     const currentHistory = player.seasonHistory?.[player.seasonHistory.length - 1];
                     if (currentHistory?.tradedTo) {
                        return (
                          <>🏅 Started the year with <strong className="text-white">{getFullTeamName(currentHistory.team, player.league)}</strong> ({currentHistory.gamesWithOriginal} GP) before a blockbuster trade to <strong className="text-white">{getFullTeamName(currentHistory.tradedTo, player.league)}</strong> ({currentHistory.gamesWithNew} GP).</>
                        );
                     }
                     return (
                       <>🏅 {['SHL', 'LIIGA', 'KHL', 'SWISS', 'DEL', 'ICEHL', 'CZECH', 'SLOVAK'].includes(player.league) ? '' : 'The '}{getFullTeamName(player.team, player.league)} finished <strong className="text-white">#{seasonRecap?.standings || '-'}</strong> in {leagueWithArticle(player.league)}. {
                         (seasonRecap?.standings === 1) ? 'An absolutely dominant regular season.' :
                         (seasonRecap?.madePlayoffs) ? 'A solid campaign to secure a playoff berth.' :
                         (seasonRecap?.standings >= (getOpponentPool(player.league)?.length || 20) - 3) ? 'A miserable rebuilding year for the franchise.' :
                         'A mediocre year that fell short of expectations.'
                       }</>
                     );
                  })()}
                </li>
                
                {player.pos === 'G' ? (
                  <li className="border-l-4 border-[#22E748] pl-4 py-2">🥅 Recorded a <strong className="text-white">{(seasonRecap?.saves / seasonRecap?.shots || 0).toFixed(3).replace('0.', '.')} SV%</strong> and <strong className="text-white">{seasonRecap?.sho || 0} shutouts</strong> in {seasonRecap?.games || 0} games. {
                    (seasonRecap?.saves / seasonRecap?.shots || 0) >= 0.920 ? 'Truly elite numbers between the pipes.' :
                    (seasonRecap?.saves / seasonRecap?.shots || 0) >= 0.905 ? 'A reliable, steady presence in the crease.' :
                    'Struggled to find consistency this year.'
                  }</li>
                ) : ['LD', 'RD'].includes(player.pos) ? (
                  <li className="border-l-4 border-[#22E748] pl-4 py-2">🧱 Anchored the defense with <strong className="text-white">{seasonRecap?.g || 0}G, {seasonRecap?.a || 0}A ({(seasonRecap?.g || 0) + (seasonRecap?.a || 0)} PTS)</strong> in {seasonRecap?.games || 0} games, logging a <strong className="text-white">{seasonRecap?.pm > 0 ? `+${seasonRecap.pm}` : (seasonRecap?.pm || 0)}</strong> rating while averaging <strong className="text-white">{Math.floor(seasonRecap?.avgToi || 0)}:{Math.round(((seasonRecap?.avgToi || 0) % 1) * 60).toString().padStart(2, '0')} TOI</strong>. {
                    ((seasonRecap?.g || 0) + (seasonRecap?.a || 0)) >= 65 ? 'Historic offensive production from the blue line.' :
                    ((seasonRecap?.g || 0) + (seasonRecap?.a || 0)) >= 40 ? 'Excellent puck-moving all season.' :
                    'Focused heavily on the defensive side of the puck.'
                  }</li>
                ) : (
                  <li className="border-l-4 border-[#22E748] pl-4 py-2">🏒 Potted <strong className="text-white">{seasonRecap?.g || 0} goals</strong> and <strong className="text-white">{seasonRecap?.a || 0} assists</strong> for <strong className="text-white">{(seasonRecap?.g || 0) + (seasonRecap?.a || 0)} PTS</strong> in {seasonRecap?.games || 0} games, playing <strong className="text-white">{Math.floor(seasonRecap?.avgToi || 0)}:{Math.round(((seasonRecap?.avgToi || 0) % 1) * 60).toString().padStart(2, '0')} TOI</strong> a night. {
                    ((seasonRecap?.g || 0) + (seasonRecap?.a || 0)) >= 100 ? 'A legendary century-mark campaign.' :
                    (seasonRecap?.g >= 50) ? 'An elite goal-scoring year.' :
                    ((seasonRecap?.g || 0) + (seasonRecap?.a || 0)) >= 70 ? 'A highly productive offensive season.' :
                    ((seasonRecap?.g || 0) + (seasonRecap?.a || 0)) >= 40 ? 'A solid middle-six contribution.' :
                    'Struggled to consistently generate offense.'
                  }</li>
                )}

                {madePlayoffsForNarrative ? (
                  <>
                    <li className={`border-l-4 ${seasonRecap?.titleWon === 1 ? 'border-[#F59E0B] text-[#F59E0B] font-bold' : 'border-[#ef4444]'} pl-4 py-2`}>
                      {seasonRecap?.titleWon === 1 
                        ? `🏆 Won the ${titles.cupName}!` 
                        : seasonRecap?.confTitleWon
                          ? `🏆 Crowned ${seasonRecap?.confName || 'Conference'} Champions before falling in the ${titles.final}.`
                          : seasonRecap?.playoffWins === 0 
                            ? '🧹 Swept in the first round.' 
                            : `Eliminated after ${seasonRecap?.playoffWins || 0} playoff win${seasonRecap?.playoffWins === 1 ? '' : 's'}.`}
                    </li>
                    {seasonRecap?.memCupStatus === 'won' && (
                       <li className="border-l-4 border-[#F59E0B] pl-4 py-2 text-[#F59E0B] font-bold">
                         🏆 CONQUERED THE NATION AND WON THE MEMORIAL CUP!
                       </li>
                    )}
                  </>
                ) : (
                  <li className="border-l-4 border-slate-600 pl-4 py-2">⛳ Missed the playoffs.</li>
                )}

                {player.league === 'NHL' && seasonRecap?.g >= 92 && (
                  <li className="border-l-4 border-[#F59E0B] pl-4 py-2 text-[#F59E0B] font-bold">
                    👑 BROKE GRETZKY'S SINGLE-SEASON GOAL RECORD (92)!
                  </li>
                )}
                {player.league === 'NHL' && (seasonRecap?.g + seasonRecap?.a) >= 215 && (
                  <li className="border-l-4 border-[#F59E0B] pl-4 py-2 text-[#F59E0B] font-bold">
                    👑 BROKE GRETZKY'S SINGLE-SEASON POINTS RECORD (215)!
                  </li>
                )}
                {player.league === 'NHL' && player.pos === 'G' && seasonRecap?.sho >= 15 && (
                  <li className="border-l-4 border-[#F59E0B] pl-4 py-2 text-[#F59E0B] font-bold">
                    👑 BROKE TONY ESPOSITO'S SINGLE-SEASON SHUTOUT RECORD (15)!
                  </li>
                )}

                {seasonRecap?.wasWaived && (
                  <li className="border-l-4 border-[#F59E0B] pl-4 py-2">✈️ Claimed off waivers mid-season.</li>
                )}
                
                {seasonRecap?.awards && seasonRecap.awards.length > 0 && (
                  <li className="border-l-4 border-[#F59E0B] pl-4 py-2 bg-[#F59E0B]/10 rounded-r-lg">
                    <strong className="text-[#F59E0B] block text-[10px] tracking-widest uppercase mb-1">🏆 HARDWARE SECURED</strong>
                    {seasonRecap.awards.map(aw => <div key={aw} className="text-white text-sm font-bold">{aw}</div>)}
                  </li>
                )}

                {seasonEvents.map((ev, i) => {
                  if (!ev || !ev.feedback) return null;
                  return (
                    <li key={`event-${i}`} className="border-l-4 border-[#c084fc] pl-4 py-2 block">
                      <span className="text-slate-300 leading-relaxed">📰 {ev.feedback}</span>
                       <span className="inline-flex flex-wrap items-center gap-1.5 ml-2 align-middle relative -top-[1px]">
                         {ev.effect?.ovr !== undefined && ev.effect.ovr !== 0 && (
                           <span className={`text-[10px] sm:text-xs px-2 py-1 rounded font-black tracking-widest uppercase border leading-none ${ev.effect.ovr > 0 ? 'text-[#22E748] bg-[#22E748]/10 border-[#22E748]/30' : 'text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]/30'}`}>
                             {ev.effect.ovr > 0 ? '+' : ''}{ev.effect.ovr} OVR
                           </span>
                         )}
                         {ev.effect?.idol !== undefined && ev.effect.idol !== 0 && (
                           <span className={`text-[10px] sm:text-xs px-2 py-1 rounded font-black tracking-widest uppercase border leading-none ${ev.effect.idol > 0 ? 'text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/30' : 'text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]/30'}`}>
                             {ev.effect.idol > 0 ? '+' : ''}{ev.effect.idol} FANS
                           </span>
                         )}
                         {ev.effect?.money !== undefined && ev.effect.money !== 0 && (
                           <span className={`text-[10px] sm:text-xs px-2 py-1 rounded font-black tracking-widest uppercase border leading-none ${ev.effect.money > 0 ? 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30' : 'text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]/30'}`}>
                             {ev.effect.money > 0 ? '+' : '-'}{formatMoney(Math.abs(ev.effect.money))}
                           </span>
                         )}
                       </span>
                     </li>
                   );
                })}
              </ul>

              <div className="w-full pt-6 mt-8 border-t border-[rgba(255,255,255,0.05)] flex flex-col sm:flex-row gap-4">
                <button onClick={advanceToOffseason} className="btn-primary flex-1 py-4 rounded-xl text-lg sm:text-xl cursor-pointer sports-font tracking-widest shadow-2xl">
                  PROCEED TO OFFSEASON
                </button>
                
                {player.league === 'NCAA' && (
                   <button onClick={() => {
                       unlockAchievement('transfer_portal'); 
                       setPlayer(p => ({ ...p, idolatry: capIdol(p.idolatry - 15) }));

                       let pool = ncaaTeams?.filter(t => t.id !== player.team) || [];
                       pool = [...pool].sort(() => 0.5 - Math.random()).slice(0, 3);
                       if (pool.length === 0) pool = [{ id: 'UNK', name: 'Unknown Program' }];

                       const offeredTeams = pool.map(t => {
                           const possiblePerks = [
                               { text: '📈 Elite Coaching (+2 OVR)', ovr: 2, idol: 0, money: 0, color: 'text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/30' },
                               { text: '🏟️ National Spotlight (+25 Fans)', ovr: 0, idol: 25, money: 0, color: 'text-[#22E748] bg-[#22E748]/10 border-[#22E748]/30' },
                               { text: '💰 Massive NIL Deal ($100k)', ovr: 0, idol: 0, money: 100000, color: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30' },
                               { text: '⚡ Run & Gun System (+1 OVR, +10 Fans)', ovr: 1, idol: 10, money: 0, color: 'text-[#22E748] bg-[#22E748]/10 border-[#22E748]/30' }
                           ];

                           const possibleFlaws = [
                               { text: '⚠️ Crowded Depth Chart (-1 OVR)', ovr: -1, idol: 0, money: 0 },
                               { text: '⚠️ Rebuilding Phase (-10 Fans)', ovr: 0, idol: -10, money: 0 },
                               { text: '⚠️ Strict System (-5 Fans)', ovr: 0, idol: -5, money: 0 }
                           ];

                           const perkCount = Math.floor(Math.random() * 2) + 1; 
                           const flawCount = Math.floor(Math.random() * 2);     

                           const selectedPerks = [...possiblePerks].sort(() => 0.5 - Math.random()).slice(0, perkCount);
                           const selectedFlaws = [...possibleFlaws].sort(() => 0.5 - Math.random()).slice(0, flawCount);

                           let totalOvr = 0, totalIdol = 0, totalMoney = 0;
                           selectedPerks.forEach(p => { totalOvr += p.ovr; totalIdol += p.idol; totalMoney += p.money; });
                           selectedFlaws.forEach(f => { totalOvr += f.ovr; totalIdol += f.idol; totalMoney += f.money; });

                           return {
                               ...t,
                               finalOvr: Math.max(0, totalOvr),
                               finalIdol: totalIdol,
                               finalMoney: totalMoney,
                               perks: selectedPerks,
                               flaws: selectedFlaws
                           };
                       });

                       const choices = offeredTeams.map(t => ({
                           label: `Commit to ${t.name}`, 
                           perks: t.perks,
                           flaws: t.flaws,
                           isRisky: false, 
                           feedback: `You signed your transfer paperwork and are officially a member of ${t.name}!`, 
                           effect: { idol: t.finalIdol, ovr: t.finalOvr, money: t.finalMoney }, 
                           action: 'JOIN_NCAA', 
                           actionData: t.id
                       }));

                       setActiveEvent({
                           title: 'TRANSFER PORTAL OFFERS',
                           desc: `You officially entered the transfer portal. Your former fans are furious (Fan Status -15), but several top programs have immediately reached out with scholarship and NIL offers. Weigh your options carefully.`,
                           choices: choices,
                           isPortalEvent: true
                       });
                       
                       setScreen('event');
                   }} className="bg-[#ef4444]/10 hover:bg-[#ef4444]/20 border border-[#ef4444]/40 text-[#ef4444] flex-1 py-4 rounded-xl text-lg sm:text-xl cursor-pointer sports-font tracking-widest transition-all shadow-[0_0_15px_rgba(239,68,68,0.15)] hover:shadow-[0_0_25px_rgba(239,68,68,0.25)] hover:scale-[1.02]">
                     ENTER TRANSFER PORTAL
                   </button>
                )}
              </div>
            </div>
          );
        })();
}