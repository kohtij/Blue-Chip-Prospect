import React from 'react';
import { getFullTeamName, getGamesPerMatchup, getPlayoffTitles, getWinsNeeded } from '../utils/appHelpers';
import { getPlayoffRounds } from '../data/teams';
import TeamLogo from '../components/TeamLogo';
import TrophyImage from '../components/TrophyImage';

// Extracted from App.jsx. Auto-generated with JSX-aware external analysis.
export default function PlayoffsScreen({ advancePlayoffRound, handleGridClick, player, playoffs, proceedFromPlayoffs, setEventFeedback, setPlayer, setPlayoffs, setScreen }) {
  return (() => {
          const activeRound = playoffs.bracket[playoffs.activeRoundIndex];
          const playerMatchIndex = activeRound?.findIndex(m => m.isPlayerSeries);
          const activeMatch = playerMatchIndex >= 0 ? activeRound[playerMatchIndex] : null;
          const titles = getPlayoffTitles(player.league);

          const getTeamLabel = (team) => {
            if (!team || team.id === 'TBD' || team.name === 'TBD' || team.id?.startsWith('TBD')) return 'TBD';
            let label = team.abbr || team.id;
            return label.length > 3 ? label.substring(0, 3).toUpperCase() : label.toUpperCase(); 
          };

          return (
            <div className="game-panel p-3 sm:p-6 mt-2 border-t-2 border-t-[#F59E0B] flex flex-col items-center relative">
              
              {/* DYNAMIC LEAGUE PLAYOFF HEADER */}
              
             {/* CONFERENCE HEADERS — only shown for leagues that actually have 2 confs */}
              <div className="flex justify-between w-full max-w-5xl px-2 mb-4 text-xs sm:text-sm md:text-base font-black sports-font uppercase tracking-wider">
                {playoffs.hasConfs ? (
                  <>
                    <span className="text-[#ef4444]">WESTERN</span>
                    <span className="text-[#F59E0B]">{titles.final}</span>
                    <span className="text-[#3b82f6]">EASTERN</span>
                  </>
                ) : (
                  <span className="w-full text-center text-[#F59E0B]">{titles.final}</span>
                )}
              </div>

              {/* BRACKET VIEW */}
              <div className="w-full overflow-x-auto pb-6 mb-4 border-b border-[rgba(255,255,255,0.065)] scrollbar-hide">
                <div className="flex items-stretch gap-1.5 sm:gap-2 w-max mx-auto px-2 min-h-[250px]">
                  {playoffs.hasConfs ? (
                    <>
                      {/* WESTERN CONFERENCE (LEFT) */}
                      <div className="flex gap-1.5 sm:gap-2">
                        {playoffs.bracket.slice(0, playoffs.bracket.length - 1).map((round, rIdx) => (
                          <div key={`left-${rIdx}`} className="flex flex-col gap-1 w-[80px] sm:w-[95px] shrink-0">
                            <p className="text-center text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-wider h-4 shrink-0 mb-1">
                              {(getPlayoffRounds(playoffs.currentLg)[rIdx]?.name || `ROUND ${rIdx + 1}`).toUpperCase()}
                            </p>
                            <div className="flex-1 flex flex-col justify-around gap-1">
                              {round.map((match, mIdx) => {
                                if (match.conf !== 'West') return null;
                                const isLocked = match.status === 'locked';
                                const rWN = getWinsNeeded(playoffs.currentLg, rIdx);
                                return (
                                  <div key={mIdx} className={`rounded p-1 border flex flex-col gap-0.5 transition-all duration-300 ${isLocked ? 'opacity-30 grayscale' : 'opacity-100'} ${match.isPlayerSeries ? 'border-[#3b82f6] bg-[#3b82f6]/10 shadow-[0_0_8px_rgba(59,130,246,0.3)] ring-1 ring-[#3b82f6]' : 'border-[rgba(255,255,255,0.065)] bg-[#101410]'}`}>
                                    <div className={`flex justify-between items-center text-[9px] sm:text-[10px] ${match.wins1 >= rWN ? 'text-[#22E748]' : 'text-slate-300'}`}>
                                      <span className="font-bold truncate max-w-[55px] sm:max-w-[70px]">{getTeamLabel(match.team1)}</span>
                                      <span className="font-black sports-font ml-0.5">{match.wins1}</span>
                                    </div>
                                    <div className={`flex justify-between items-center text-[9px] sm:text-[10px] ${match.wins2 >= rWN ? 'text-[#22E748]' : 'text-slate-300'}`}>
                                      <span className="font-bold truncate max-w-[55px] sm:max-w-[70px]">{getTeamLabel(match.team2)}</span>
                                      <span className="font-black sports-font ml-0.5">{match.wins2}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* CHAMPIONSHIP FINAL (CENTER) */}
                      <div className="flex flex-col justify-center gap-2 w-[90px] sm:w-[120px] shrink-0 relative px-0.5">
                        <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none mix-blend-screen">
                          <TrophyImage league={playoffs.currentLg} className="w-20 h-20 sm:w-24 sm:h-24 mt-4" />
                        </div>
                        <p className="text-center text-[8px] sm:text-[9px] font-bold text-[#F59E0B] uppercase tracking-wider">
                          {(getPlayoffRounds(playoffs.currentLg)[playoffs.bracket.length - 1]?.name || 'FINAL').toUpperCase()}
                        </p>
                        {playoffs.bracket[playoffs.bracket.length - 1].map((match, mIdx) => {
                          const isLocked = match.status === 'locked';
                          const rWN = getWinsNeeded(playoffs.currentLg, playoffs.bracket.length - 1);
                          return (
                            <div key={mIdx} className={`relative z-10 rounded-lg p-1.5 border flex flex-col gap-0.5 transition-all duration-300 ${isLocked ? 'opacity-30 grayscale border-[#F59E0B]/20 bg-[#101410]' : match.isPlayerSeries ? 'border-[#3b82f6] bg-[#3b82f6]/10 shadow-[0_0_15px_rgba(59,130,246,0.4)]' : 'border-[#F59E0B]/50 bg-[#101410]'}`}>
                              <div className={`flex justify-between items-center text-[10px] sm:text-xs ${match.wins1 >= rWN ? 'text-[#22E748]' : 'text-slate-300'}`}>
                                <span className="font-bold truncate max-w-[60px] sm:max-w-[80px]">{getTeamLabel(match.team1)}</span>
                                <span className="font-black sports-font text-sm ml-1">{match.wins1}</span>
                              </div>
                              <div className={`flex justify-between items-center text-[10px] sm:text-xs ${match.wins2 >= rWN ? 'text-[#22E748]' : 'text-slate-300'}`}>
                                <span className="font-bold truncate max-w-[60px] sm:max-w-[80px]">{getTeamLabel(match.team2)}</span>
                                <span className="font-black sports-font text-sm ml-1">{match.wins2}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* EASTERN CONFERENCE (RIGHT REVERSED) */}
                      <div className="flex flex-row-reverse gap-1.5 sm:gap-2">
                        {playoffs.bracket.slice(0, playoffs.bracket.length - 1).map((round, rIdx) => (
                          <div key={`right-${rIdx}`} className="flex flex-col gap-1 w-[80px] sm:w-[95px] shrink-0">
                            <p className="text-center text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-wider h-4 shrink-0 mb-1">
                              {(getPlayoffRounds(playoffs.currentLg)[rIdx]?.name || `ROUND ${rIdx + 1}`).toUpperCase()}
                            </p>
                            <div className="flex-1 flex flex-col justify-around gap-1">
                              {round.map((match, mIdx) => {
                                if (match.conf !== 'East') return null;
                                const isLocked = match.status === 'locked';
                                const rWN = getWinsNeeded(playoffs.currentLg, rIdx);
                                return (
                                  <div key={mIdx} className={`rounded p-1 border flex flex-col gap-0.5 transition-all duration-300 ${isLocked ? 'opacity-30 grayscale' : 'opacity-100'} ${match.isPlayerSeries ? 'border-[#3b82f6] bg-[#3b82f6]/10 shadow-[0_0_8px_rgba(59,130,246,0.3)] ring-1 ring-[#3b82f6]' : 'border-[rgba(255,255,255,0.065)] bg-[#101410]'}`}>
                                    <div className={`flex justify-between items-center text-[9px] sm:text-[10px] ${match.wins1 >= rWN ? 'text-[#22E748]' : 'text-slate-300'}`}>
                                      <span className="font-bold truncate max-w-[55px] sm:max-w-[70px]">{getTeamLabel(match.team1)}</span>
                                      <span className="font-black sports-font ml-0.5">{match.wins1}</span>
                                    </div>
                                    <div className={`flex justify-between items-center text-[9px] sm:text-[10px] ${match.wins2 >= rWN ? 'text-[#22E748]' : 'text-slate-300'}`}>
                                      <span className="font-bold truncate max-w-[55px] sm:max-w-[70px]">{getTeamLabel(match.team2)}</span>
                                      <span className="font-black sports-font ml-0.5">{match.wins2}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    /* SINGLE-BRACKET LAYOUT (QMJHL, NCAA Frozen Four, SHL, Liiga) */
                    <div className="flex gap-1.5 sm:gap-2">
                      {playoffs.bracket.map((round, rIdx) => (
                        <div key={`single-${rIdx}`} className="flex flex-col gap-1 w-[80px] sm:w-[95px] shrink-0">
                          <p className="text-center text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-wider h-4 shrink-0 mb-1">
                            {(getPlayoffRounds(playoffs.currentLg)[rIdx]?.name || `ROUND ${rIdx + 1}`).toUpperCase()}
                          </p>
                          <div className="flex-1 flex flex-col justify-around gap-1">
                            {round.map((match, mIdx) => {
                              const isLocked = match.status === 'locked';
                              const rWN = getWinsNeeded(playoffs.currentLg, rIdx);
                              const isFinal = rIdx === playoffs.bracket.length - 1;
                              return (
                                <div key={mIdx} className={`rounded p-1 border flex flex-col gap-0.5 transition-all duration-300 ${isLocked ? 'opacity-30 grayscale' : 'opacity-100'} ${match.isPlayerSeries ? 'border-[#3b82f6] bg-[#3b82f6]/10 shadow-[0_0_8px_rgba(59,130,246,0.3)] ring-1 ring-[#3b82f6]' : isFinal ? 'border-[#F59E0B]/50 bg-[#101410]' : 'border-[rgba(255,255,255,0.065)] bg-[#101410]'}`}>
                                  <div className={`flex justify-between items-center text-[9px] sm:text-[10px] ${match.wins1 >= rWN ? 'text-[#22E748]' : 'text-slate-300'}`}>
                                    <span className="font-bold truncate max-w-[55px] sm:max-w-[70px]">{getTeamLabel(match.team1)}</span>
                                    <span className="font-black sports-font ml-0.5">{match.wins1}</span>
                                  </div>
                                  <div className={`flex justify-between items-center text-[9px] sm:text-[10px] ${match.wins2 >= rWN ? 'text-[#22E748]' : 'text-slate-300'}`}>
                                    <span className="font-bold truncate max-w-[55px] sm:max-w-[70px]">{getTeamLabel(match.team2)}</span>
                                    <span className="font-black sports-font ml-0.5">{match.wins2}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* CARD MINIGAME GRID & NEXT ROUND PROCEED BUTTON */}
              {activeMatch && (
                 <div className="max-w-sm sm:max-w-md w-full bg-[#101410] border border-[rgba(255,255,255,0.065)] p-5 sm:p-6 rounded-xl text-center shadow-lg mx-auto mb-4 shrink-0">

                    {/* TOP STATUS LINE — always occupies the same slot so the grid below never shifts */}
                    <div className="mb-6 flex flex-col items-center">
                      
                      {activeMatch.status === 'playing' && (
                        <>
                          <p className="text-[11px] sm:text-xs font-black text-[#3b82f6] uppercase tracking-widest mb-3 font-sans">
                             ROUND {playoffs.activeRoundIndex + 1} MATCHUP
                          </p>
                          <TeamLogo teamId={activeMatch.team2?.id || 'UNK'} league={playoffs.currentLg} isAHL={playoffs.currentLg === 'AHL'} size="large" />
                          <p className="text-base sm:text-xl text-slate-300 font-bold uppercase sports-font text-balance leading-tight mt-3">
                             VS. {['SHL', 'LIIGA'].includes(playoffs.currentLg) ? '' : 'THE '}{getFullTeamName(activeMatch.team2?.id, playoffs.currentLg)}
                          </p>
                        </>
                      )}
                      
                      {activeMatch.status === 'won' && (
                        <>
                          <p className="text-[11px] sm:text-xs font-black text-[#22E748] uppercase tracking-widest mb-3 font-sans">
                             ⚡ SERIES VICTORY! ({activeMatch.wins1}-{activeMatch.wins2})
                          </p>
                          <TeamLogo teamId={activeMatch.team2?.id || 'UNK'} league={playoffs.currentLg} isAHL={playoffs.currentLg === 'AHL'} size="large" />
                          <p className="text-base sm:text-xl text-slate-300 font-bold uppercase sports-font text-balance leading-tight mt-3">
                             DEFEATED {['SHL', 'LIIGA'].includes(playoffs.currentLg) ? '' : 'THE '}{getFullTeamName(activeMatch.team2?.id, playoffs.currentLg)}
                          </p>
                        </>
                      )}
                      
                      {activeMatch.status === 'lost' && (
                        <>
                          <p className="text-[11px] sm:text-xs font-black text-[#ef4444] uppercase tracking-widest mb-3 font-sans">
                             💔 ELIMINATED ({activeMatch.wins1}-{activeMatch.wins2})
                          </p>
                          <TeamLogo teamId={activeMatch.team2?.id || 'UNK'} league={playoffs.currentLg} isAHL={playoffs.currentLg === 'AHL'} size="large" />
                          <p className="text-base sm:text-xl text-slate-300 font-bold uppercase sports-font text-balance leading-tight mt-3">
                             DEFEATED BY {['SHL', 'LIIGA'].includes(playoffs.currentLg) ? '' : 'THE '}{getFullTeamName(activeMatch.team2?.id, playoffs.currentLg)}
                          </p>
                        </>
                      )}
                    </div>

                    {/* 9-CARD GRID — stays in the same place whether the series is playing, won, or lost */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
                      {(activeMatch.deck || []).map((item, cIndex) => {
                        const isRevealed = (activeMatch.revealed || []).includes(cIndex);
                        const isOver = ['won', 'lost'].includes(activeMatch.status);
                        const showForcefully = isOver && !isRevealed;
                        const isWinCard = item && (item.isWin || item.win);
                        
                        let btnClass = 'h-20 sm:h-24 text-3xl sm:text-4xl font-black rounded-lg border transition-all duration-200 flex items-center justify-center sports-font ';
                        
                        if (isRevealed || showForcefully) {
                          btnClass += isWinCard 
                            ? 'bg-[#22E748]/20 border-[#22E748] text-[#22E748] shadow-[0_0_10px_rgba(34,231,72,0.3)]' 
                            : 'bg-[#ef4444]/20 border-[#ef4444] text-[#ef4444] shadow-[0_0_10px_rgba(239,68,68,0.3)]';
                        } else {
                          btnClass += 'bg-[#1a2230] border-[rgba(255,255,255,0.12)] text-slate-400 hover:border-[#3b82f6] hover:text-white hover:scale-105 active:scale-95 cursor-pointer';
                        }

                        return (
                          <button 
                            key={`card-${cIndex}`} 
                            onClick={() => handleGridClick(playoffs.activeRoundIndex, playerMatchIndex, cIndex)} 
                            className={btnClass} 
                            disabled={isOver || isRevealed}
                          >
                            {(isRevealed || showForcefully) ? (isWinCard ? 'W' : 'L') : '?'}
                          </button>
                        );
                      })}
                    </div>

                    {/* BOTTOM AREA — hint while playing, advance button once the series is won. Below the grid, so winning never shifts the cards. */}
                    {activeMatch.status === 'playing' && (() => {
                      const gpm = getGamesPerMatchup(playoffs.currentLg, playoffs.activeRoundIndex);
                      const formatText = gpm === 1 ? 'Single Elimination' : `Best-of-${gpm}`;
                      return (
                        <p className="text-xs sm:text-sm text-slate-400 font-sans mt-2">Select a card to play the next game ({formatText})</p>
                      );
                    })()}
                    {activeMatch.status === 'won' && playoffs.overallStatus !== 'won_cup' && (
                      <button
                        onClick={advancePlayoffRound}
                        className="btn-primary w-full py-3.5 mt-2 rounded-lg font-black sports-font text-sm sm:text-base uppercase tracking-wider transition-transform hover:scale-105 cursor-pointer shadow-lg"
                      >
                        ADVANCE TO ROUND {playoffs.activeRoundIndex + 2} ➔
                      </button>
                    )}
                 </div>
              )}

              {/* THE CAPTAINCY ACTION */}
              {player.storylines?.lockerRoom === 2 && activeMatch?.status === 'playing' && (
                <div className="mt-4 w-full max-w-sm sm:max-w-md">
                   <button 
                     onClick={() => {
                       setPlayer(p => ({
                         ...p, relationships: { ...p.relationships, coach: Math.max(0, p.relationships.coach - 10) }
                       }));
                       const updatedBracket = [...playoffs.bracket];
                       updatedBracket[playoffs.activeRoundIndex][playerMatchIndex].deck[0] = { isWin: true };
                       setPlayoffs({ ...playoffs, bracket: updatedBracket });
                       setEventFeedback("You delivered a legendary locker room speech. The boys are fired up. The first game is guaranteed.");
                       setScreen('event-result');
                     }}
                     className="w-full py-3 bg-[#F59E0B]/10 hover:bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40 rounded-xl font-black sports-font tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(245,158,11,0.15)] cursor-pointer"
                   >
                     📢 CAPTAIN'S SPEECH (GUARANTEE WIN 1)
                   </button>
                   <p className="text-[9px] text-slate-500 font-bold uppercase text-center mt-1">Cost: -10 Coach Trust</p>
                </div>
              )}

              {/* END OF PLAYOFFS PROCEED BUTTON */}
              {['won_cup', 'eliminated'].includes(playoffs.overallStatus) && (
                <div className="mt-4 text-center w-full max-w-xs">
                   <button 
                     onClick={proceedFromPlayoffs} 
                     className={`py-3.5 px-8 rounded-xl cursor-pointer sports-font tracking-widest w-full font-black text-sm uppercase transition-transform hover:scale-105 ${
                       playoffs.overallStatus === 'eliminated' 
                         ? 'bg-[#101410] border border-[rgba(255,255,255,0.12)] text-white hover:bg-[#1a2230]' 
                         : 'btn-primary'
                     }`}
                   >
                     {playoffs.overallStatus === 'won_cup' ? 'LIFT THE TROPHY' : 'PROCEED TO RECAP'}
                   </button>
                </div>
              )}

            </div>
          );
        })();
}
