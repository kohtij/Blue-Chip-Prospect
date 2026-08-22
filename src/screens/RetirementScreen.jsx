import 'react';
import { useAppContext } from '../AppContext';
import { getAwardPill, getFullTeamName } from '../utils/appHelpers';
import { getAwardImage } from '../data/awards';
import { formatMoney } from '../utils/gameHelpers';
import TeamLogo from '../components/TeamLogo';
import TrophyImage from '../components/TrophyImage';

export default function RetirementScreen() {
  const { handleNewGame, player } = useAppContext();
  return (() => {
          const isLegend = player.idolatry >= 800;
          const isGoalie = player.pos === 'G';

          const proGames = (player.stats?.nhl?.games || 0) + (player.stats?.ahl?.games || 0);
          const proGoals = (player.stats?.nhl?.goals || 0) + (player.stats?.ahl?.goals || 0);
          const proAssists = (player.stats?.nhl?.assists || 0) + (player.stats?.ahl?.assists || 0);
          const proSaves = (player.stats?.nhl?.saves || 0) + (player.stats?.ahl?.saves || 0);
          const proShots = (player.stats?.nhl?.shots || 0) + (player.stats?.ahl?.shots || 0);
          
          const poGames = (player.stats?.nhlPlayoffs?.games || 0) + (player.stats?.ahlPlayoffs?.games || 0);
          const poGoals = (player.stats?.nhlPlayoffs?.goals || 0) + (player.stats?.ahlPlayoffs?.goals || 0);
          const poAssists = (player.stats?.nhlPlayoffs?.assists || 0) + (player.stats?.ahlPlayoffs?.assists || 0);
          const poSaves = (player.stats?.nhlPlayoffs?.saves || 0) + (player.stats?.ahlPlayoffs?.saves || 0);
          const poShots = (player.stats?.nhlPlayoffs?.shots || 0) + (player.stats?.ahlPlayoffs?.shots || 0);
          
          const otherGames = (player.stats?.chl?.games || 0);
          const otherGoals = (player.stats?.chl?.goals || 0);
          const otherAssists = (player.stats?.chl?.assists || 0);
          const otherSaves = (player.stats?.chl?.saves || 0);
          const otherShots = (player.stats?.chl?.shots || 0);
          
          const stints = [];
          (player.seasonHistory || []).forEach(s => {
            const processStint = (teamId, gp, isFinalPart) => {
              const lastStint = stints[stints.length - 1];
              const ratio = gp / (s.games || 1);
              const rGoals = Math.round((s.goals || 0) * ratio);
              const rAssists = Math.round((s.assists || 0) * ratio);
              const rSaves = Math.round((s.saves || 0) * ratio);

              if (lastStint && lastStint.team === teamId && lastStint.league === s.league) {
                lastStint.endYear = s.year;
                lastStint.games += gp;
                lastStint.goals += rGoals;
                lastStint.assists += rAssists;
                lastStint.saves += rSaves;
                if (isFinalPart) {
                  if (s.titleWon) lastStint.titles.push(s.year);
                  if (s.awards?.length) lastStint.awards.push(...s.awards.map(a => `${s.year} ${a}`));
                }
              } else {
                stints.push({
                  team: teamId,
                  league: s.league,
                  startYear: s.year,
                  endYear: s.year,
                  games: gp,
                  goals: rGoals,
                  assists: rAssists,
                  saves: rSaves,
                  titles: (isFinalPart && s.titleWon) ? [s.year] : [],
                  awards: (isFinalPart && s.awards?.length) ? s.awards.map(a => `${s.year} ${a}`) : []
                });
              }
            };

            if (s.tradedTo) {
              processStint(s.team, s.gamesWithOriginal || Math.floor((s.games || 82) * 0.75), false);
              processStint(s.tradedTo, s.gamesWithNew || Math.ceil((s.games || 82) * 0.25), true);
            } else {
              processStint(s.team, s.games || 0, true);
            }
          });

          let primaryTeam = player.team;
          if (stints.length > 0) {
            const sortedStints = [...stints].sort((a, b) => b.games - a.games);
            primaryTeam = sortedStints[0].team;
          }
          const primaryTeamName = getFullTeamName(primaryTeam, player.league);

          const cityWords = primaryTeamName.split(' ');
          const cityName = cityWords.length > 1 ? cityWords[0] : primaryTeamName;
          const arenaName = `${cityName} Arena`;

          const stanleyCups = (player.seasonHistory || []).filter(s => s.league === 'NHL' && s.titleWon).length;
          
          const aggregatedAwards = {};
          (player.seasonHistory || []).forEach(s => {
            (s.awards || []).forEach(aw => {
              const key = aw.replace(/^\d{4}\s/, '').replace(' Trophy', '').replace(' Memorial', '').replace(/\s*\(.+?\)\s*$/, '').trim();
              if (!aggregatedAwards[key]) aggregatedAwards[key] = { name: key, count: 0 };
              aggregatedAwards[key].count++;
            });
          });

          return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 bg-[#040505] text-white font-sans">
              <div className="w-full max-w-4xl space-y-4">
                
                {/* 1. HERO HEADER */}
                <div className="game-panel p-6 sm:p-10 text-center border-2 border-[#3b82f6] relative overflow-hidden bg-gradient-to-b from-[#101410] to-[#080a08] shadow-[0_0_30px_rgba(59,130,246,0.15)]">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-[10px] sm:text-xs font-black tracking-widest text-slate-400 uppercase bg-black/40 px-3 py-1 rounded-full border border-slate-700">
                      RETIRED AT AGE {player.age}
                    </span>
                    <span className={`text-[10px] sm:text-xs font-black tracking-widest uppercase px-3 py-1 rounded-full border sports-font ${isLegend ? 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30' : 'text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/30'}`}>
                      {isLegend ? 'HALL OF FAME CAREER' : 'CAREER ACCOMPLISHED'}
                    </span>
                  </div>

                  <h1 className="text-5xl sm:text-6xl font-black text-white number-font uppercase tracking-tight mb-1">
                    {player.name}
                  </h1>
                  <p className="text-xl sm:text-2xl font-black text-[#3b82f6] sports-font uppercase tracking-wide">
                    #{player.number} · {primaryTeamName.toUpperCase()}
                  </p>
                  <p className="text-xs sm:text-sm text-slate-400 font-sans italic mt-2 mb-4">
                    {isLegend ? `Your jersey hangs proudly in the rafters of ${arenaName}.` : 'You officially hang up the skates after a hard-fought career.'}
                  </p>

                  {stanleyCups > 0 && (
                    <div className="game-panel mt-4 p-4 sm:p-6 bg-gradient-to-r from-[#F59E0B]/20 via-[#101410] to-[#F59E0B]/20 border-2 border-[#F59E0B] rounded-2xl flex items-center justify-between shadow-[0_0_25px_rgba(245,158,11,0.2)]">
                      <div className="flex items-center gap-4 text-left">
                        <span className="text-4xl sm:text-5xl">💍</span>
                        <div>
                          <p className="text-xs font-black text-[#F59E0B] uppercase tracking-widest">CHAMPIONSHIP MANTLE</p>
                          <h3 className="text-xl sm:text-2xl font-black text-white sports-font">
                            {stanleyCups}x STANLEY CUP CHAMPION
                          </h3>
                        </div>
                      </div>
                      <TrophyImage league="NHL" className="w-16 h-16 sm:w-20 sm:h-20 shrink-0" />
                    </div>
                  )}

                  {(stanleyCups > 0 || Object.keys(aggregatedAwards).length > 0) && (
                    <div className="pt-4 border-t border-[rgba(255,255,255,0.065)] flex flex-wrap justify-center gap-x-4 gap-y-2">
                      {stanleyCups > 0 && getAwardPill('Stanley Cup', stanleyCups)}
                      {Object.values(aggregatedAwards).sort((a,b) => b.count - a.count).map((aw) => getAwardPill(aw.name, aw.count))}
                    </div>
                  )}
                </div>

                {/* 2. CORE STATS GRID */}
                <div className="game-panel p-4 bg-[#0a0d0a] border border-[rgba(255,255,255,0.065)]">
                  <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.065)] pb-3 mb-4 px-2">
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">NATIONALITY: {player.nat}</span>
                      <span className="text-xs font-bold text-[#22E748] uppercase tracking-widest">PEAK OVR: {player.stats?.peakOvr || player.ovr}</span>
                    </div>
                  </div>

                  <h3 className="text-xs sm:text-sm font-bold text-slate-400 tracking-widest uppercase mb-2 ml-2 font-sans">
                    PRO CAREER TOTALS
                  </h3>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center mb-6">
                   <div className="bg-[#101410] p-3 rounded-xl border border-[rgba(255,255,255,0.04)] flex flex-col items-center justify-center min-h-[80px] col-span-1 sm:col-span-2">
                      <p className="text-[9px] font-bold text-slate-500 uppercase leading-none mb-2 tracking-widest border-b border-[rgba(255,255,255,0.065)] pb-1 w-full">REGULAR SEASON</p>
                      <div className="flex gap-4 items-center justify-center w-full">
                          <div className="text-center">
                            <p className="text-xl sm:text-2xl font-black text-[#22E748] sports-font leading-none mb-1">
                              {isGoalie ? (proShots > 0 ? (proSaves / proShots).toFixed(3).replace('0.', '.') : '.000') : proGoals}
                            </p>
                            <p className="text-[9px] font-bold text-slate-500 uppercase leading-none">{isGoalie ? 'SV%' : 'GOALS'}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xl sm:text-2xl font-black text-white sports-font leading-none mb-1">
                              {isGoalie ? (proGames > 0 ? ((proShots - proSaves) / proGames).toFixed(2) : '0.00') : proAssists}
                            </p>
                            <p className="text-[9px] font-bold text-slate-500 uppercase leading-none">{isGoalie ? 'GAA' : 'ASSISTS'}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xl sm:text-2xl font-black text-white sports-font leading-none mb-1">{proGames}</p>
                            <p className="text-[9px] font-bold text-slate-500 uppercase leading-none">GP</p>
                          </div>
                      </div>
                    </div>

                    <div className="bg-[#101410] p-3 rounded-xl border border-[rgba(255,255,255,0.04)] flex flex-col items-center justify-center min-h-[80px] col-span-1 sm:col-span-2">
                      <p className="text-[9px] font-bold text-[#F59E0B] uppercase leading-none mb-2 tracking-widest border-b border-[rgba(255,255,255,0.065)] pb-1 w-full">PRO PLAYOFFS</p>
                      <div className="flex gap-4 items-center justify-center w-full">
                          <div className="text-center">
                            <p className="text-xl sm:text-2xl font-black text-white sports-font leading-none mb-1">
                              {isGoalie ? (poShots > 0 ? (poSaves / poShots).toFixed(3).replace('0.', '.') : '.000') : poGoals}
                            </p>
                            <p className="text-[9px] font-bold text-slate-500 uppercase leading-none">{isGoalie ? 'SV%' : 'GOALS'}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xl sm:text-2xl font-black text-white sports-font leading-none mb-1">
                              {isGoalie ? (poGames > 0 ? ((poShots - poSaves) / poGames).toFixed(2) : '0.00') : poAssists}
                            </p>
                            <p className="text-[9px] font-bold text-slate-500 uppercase leading-none">{isGoalie ? 'GAA' : 'ASSISTS'}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xl sm:text-2xl font-black text-white sports-font leading-none mb-1">{poGames}</p>
                            <p className="text-[9px] font-bold text-slate-500 uppercase leading-none">GP</p>
                          </div>
                      </div>
                    </div>
                    
                    <div className="bg-[#101410] p-3 rounded-xl border border-[#3b82f6]/30 flex flex-col items-center justify-center min-h-[80px] col-span-1 sm:col-span-2">
                      <p className="text-xl sm:text-2xl font-black text-[#3b82f6] sports-font leading-none mb-1">{formatMoney(player.stats?.value || 50000)}</p>
                      <p className="text-[9px] font-bold text-slate-500 uppercase leading-none">PEAK VALUE</p>
                    </div>
                    <div className="bg-[#101410] p-3 rounded-xl border border-[#22E748]/30 flex flex-col items-center justify-center min-h-[80px] col-span-1 sm:col-span-2">
                      <p className="text-xl sm:text-2xl font-black text-[#22E748] sports-font leading-none mb-1">{formatMoney(player.stats?.earnings || 0)}</p>
                      <p className="text-[9px] font-bold text-slate-500 uppercase leading-none">CAREER EARNINGS</p>
                    </div>
                  </div>

                  {otherGames > 0 && (
                    <>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-400 tracking-widest uppercase mb-2 ml-2 font-sans border-t border-[rgba(255,255,255,0.065)] pt-4">
                        PRE-NHL & DEVELOPMENT TOTALS
                      </h3>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
                        <div className="bg-[#101410] p-3 rounded-xl border border-[rgba(255,255,255,0.04)] flex flex-col items-center justify-center min-h-[60px]">
                          <p className="text-xl sm:text-2xl font-black text-[#22E748] sports-font leading-none mb-1">
                            {isGoalie ? (otherShots > 0 ? (otherSaves / otherShots).toFixed(3).replace('0.', '.') : '.000') : otherGoals}
                          </p>
                          <p className="text-[9px] font-bold text-slate-500 uppercase leading-none">{isGoalie ? 'SV%' : 'GOALS'}</p>
                        </div>
                        <div className="bg-[#101410] p-3 rounded-xl border border-[rgba(255,255,255,0.04)] flex flex-col items-center justify-center min-h-[60px]">
                          <p className="text-xl sm:text-2xl font-black text-white sports-font leading-none mb-1">
                            {isGoalie ? (otherGames > 0 ? ((otherShots - otherSaves) / otherGames).toFixed(2) : '0.00') : otherAssists}
                          </p>
                          <p className="text-[9px] font-bold text-slate-500 uppercase leading-none">{isGoalie ? 'GAA' : 'ASSISTS'}</p>
                        </div>
                        <div className="bg-[#101410] p-3 rounded-xl border border-[rgba(255,255,255,0.04)] flex flex-col items-center justify-center min-h-[60px]">
                          <p className="text-xl sm:text-2xl font-black text-white sports-font leading-none mb-1">{otherGames}</p>
                          <p className="text-[9px] font-bold text-slate-500 uppercase leading-none">GAMES PLAYED</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* CHAMPIONSHIP RINGS TIMELINE */}
                {(() => {
                  const rings = (player.seasonHistory || []).filter(h => h.titleWon || (h.awards && h.awards.some(a => a.includes('Cup') || a.includes('Championship') || a.includes('Title'))));
                  if (rings.length === 0) return null;
                  return (
                    <div className="game-panel p-4 sm:p-6 bg-[#0a0d0a] border border-[#F59E0B]/30 text-left mb-4 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                      <h3 className="text-sm sm:text-base font-black text-[#F59E0B] tracking-widest uppercase mb-4 sports-font border-b border-[#F59E0B]/20 pb-2 flex items-center gap-2">
                        <span className="text-xl">💍</span> CHAMPIONSHIP RINGS
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {rings.map((r, idx) => {
                           const cupName = r.awards?.find(a => a.includes('Cup') || a.includes('Championship') || a.includes('Title')) || (r.league === 'NHL' ? 'Stanley Cup' : 'Championship');
                           const cleanCupName = cupName.replace(/^\d{4}\s/, ''); 
                           return (
                             <div key={`ring-${idx}`} className="bg-[#101410] border border-[#F59E0B]/40 rounded-xl p-3 flex items-center gap-3 transition-transform hover:scale-[1.02] relative">
                               <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 flex items-center justify-center relative">
                                 <TeamLogo teamId={r.team || player.team} league={r.league || 'NHL'} isAHL={r.league === 'AHL'} />
                                 <div className="absolute -bottom-2 -right-2">
                                     <TrophyImage league={r.league || 'NHL'} className="w-6 h-6 drop-shadow-md" />
                                 </div>
                               </div>
                               <div className="min-w-0 flex-1">
                                 <p className="text-white font-black sports-font leading-tight text-xs sm:text-sm truncate">{cleanCupName}</p>
                                 <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 truncate">
                                   {r.year} • {getFullTeamName(r.team || player.team, r.league || 'NHL')}
                                 </p>
                               </div>
                             </div>
                           );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* 3. CLUB HISTORY */}
                <div className="game-panel p-4 sm:p-6 bg-[#0a0d0a] border border-[rgba(255,255,255,0.065)] text-left">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-400 tracking-widest uppercase mb-4 font-sans border-b border-[rgba(255,255,255,0.065)] pb-3">
                    CAREER HISTORY
                  </h3>

                  {stints.length === 0 ? (
                    <p className="text-slate-500 text-sm italic font-sans">No detailed club history recorded for this career.</p>
                  ) : (
                    <div className="space-y-3">
                      {stints.map((stint, idx) => (
                        <div key={idx} className="bg-[#101410] border border-[rgba(255,255,255,0.065)] rounded-xl p-3 sm:p-4 flex flex-col gap-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-3 min-w-0">
                              <TeamLogo teamId={stint.team} league={stint.league} isAHL={stint.league === 'AHL'} size="small" className="shrink-0" />
                              <div className="min-w-0">
                                <h4 className="text-base sm:text-lg font-black text-white sports-font truncate">{getFullTeamName(stint.team, stint.league)}</h4>
                                <p className="text-[10px] sm:text-xs text-slate-500 font-bold font-sans truncate">
                                  {stint.startYear === stint.endYear ? stint.startYear : `${stint.startYear}–${stint.endYear}`} · {stint.league}
                                </p>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-[10px] sm:text-sm font-black text-slate-300 font-sans whitespace-nowrap">
                                {stint.games} GP · {isGoalie ? `${stint.saves} SV` : `${stint.goals} G · ${stint.assists} A`}
                              </span>
                            </div>
                          </div>

                          {(stint.titles.length > 0 || stint.awards.length > 0) && (
                            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[rgba(255,255,255,0.04)]">
                              {stint.titles.length > 0 && (
                                <span className="bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-[#F59E0B] text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider font-sans inline-flex items-center gap-1.5">
                                  {getAwardImage(stint.league === 'NHL' ? 'Stanley Cup' : stint.league === 'AHL' ? 'Calder Cup' : 'Championship') ? (
                                     <img src={getAwardImage(stint.league === 'NHL' ? 'Stanley Cup' : stint.league === 'AHL' ? 'Calder Cup' : 'Championship')} className="w-3.5 h-3.5 object-contain" />
                                  ) : '🏆'}
                                  {stint.titles.length}x {stint.league === 'NHL' ? 'Stanley Cup' : 'Championship'} ({stint.titles.join(', ')})
                                </span>
                              )}
                              {stint.awards
                                .filter(aw => !(aw.includes('All-Star') && stint.awards.some(other => other.includes('1st Team') && other !== aw)))
                                .map((aw, aIdx) => {
                                let colors = 'bg-slate-800 border-slate-600 text-slate-300';
                                if (aw.includes('MVP') || aw.includes('Hart') || aw.includes('Smythe') || aw.includes('Presidents')) colors = 'bg-[#c084fc]/10 border-[#c084fc]/40 text-[#c084fc]';
                                else if (aw.includes('Vezina') || aw.includes('Norris') || aw.includes('Ross') || aw.includes('Richard') || aw.includes('Calder') || aw.includes('All-Star') || aw.includes('American') || aw.includes('Cup')) colors = 'bg-[#3b82f6]/10 border-[#3b82f6]/40 text-[#3b82f6]';
                                
                                const yearMatch = aw.match(/^\d{4}/);
                                const year = yearMatch ? yearMatch[0] : '';
                                const cleanAward = aw.replace(/^\d{4}\s/, '').replace(' Trophy', '').replace(' Memorial', '').replace(/\s*\(.+?\)\s*$/, '').trim();
                                const trophyImg = getAwardImage(cleanAward);
                                return (
                                  <span key={aIdx} className={`inline-flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold pr-2 ${trophyImg ? 'pl-1' : 'pl-2'} py-0.5 rounded border uppercase tracking-wider font-sans ${colors}`}>
                                    {trophyImg ? (
                                        <img src={trophyImg} alt="" className="w-3.5 h-3.5 sm:w-4 sm:h-4 object-contain drop-shadow-[0_0_3px_rgba(0,0,0,0.8)]" loading="lazy" />
                                    ) : (
                                        <span className="text-[10px]">{cleanAward.includes('All-Star') || cleanAward.includes('American') ? '⭐' : '🥇'}</span>
                                    )}
                                    <span className="whitespace-nowrap">{year} {cleanAward}</span>
                                  </span>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="text-center pt-4">
                  <button 
                    onClick={() => {
                      const savedCareers = JSON.parse(localStorage.getItem('hockey_career_history') || '[]');
                      const nhlGames = player.stats?.nhl?.games || 0;
                      const nhlGoals = player.stats?.nhl?.goals || 0;
                      const nhlAssists = player.stats?.nhl?.assists || 0;
                      const nhlPoints = nhlGoals + nhlAssists;
                      const nhlSaves = player.stats?.nhl?.saves || 0;
                      const nhlShots = player.stats?.nhl?.shots || 0;
                      const svPct = nhlShots > 0 ? (nhlSaves / nhlShots).toFixed(3).replace('0.', '.') : '.000';

                      const totalIndividualAwards = Object.values(aggregatedAwards)
                        .filter(aw => !aw.name.includes('All-Star') && !aw.name.includes('All-American') && !aw.name.includes('Team'))
                        .reduce((sum, aw) => sum + aw.count, 0);

                      const newCareer = {
                        id: Date.now(),
                        name: player.name,
                        pos: player.pos,
                        number: player.number,
                        games: nhlGames,
                        points: isGoalie ? svPct : nhlPoints,
                        cups: (player.seasonHistory || []).filter(s => s.league === 'NHL' && s.titleWon).length,
                        awards: totalIndividualAwards,
                        earnings: player.stats?.earnings || 0,
                        team: primaryTeamName,
                        logo: primaryTeam,
                        isLegend: player.idolatry >= 800
                      };
                      
                      localStorage.setItem('hockey_career_history', JSON.stringify([newCareer, ...savedCareers]));
                      handleNewGame();
                    }} 
                    className="btn-primary w-full sm:w-auto py-4 px-12 rounded-xl text-lg sm:text-xl cursor-pointer sports-font tracking-widest uppercase shadow-2xl"
                  >
                    START NEW CAREER
                  </button>
                </div>

              </div>
            </div>
          );
        })();
}