import 'react';
import { useAppContext } from '../AppContext';
import { getFullTeamName, getGamesPerMatchup, getPlayoffTitles, getWinsNeeded } from '../utils/appHelpers';
import { getPlayoffRounds, getTeamData, getPrimaryRival } from '../data/teams';
import TeamLogo from '../components/TeamLogo';
import TrophyImage from '../components/TrophyImage'

export default function PlayoffsScreen() {
  const { advancePlayoffRound, handleGridClick, player, playoffs, proceedFromPlayoffs, setPlayer, setPlayoffs } = useAppContext();
  
  const activeRound = playoffs.bracket[playoffs.activeRoundIndex];
  const playerMatchIndex = activeRound?.findIndex(m => m.isPlayerSeries);
  const activeMatch = playerMatchIndex >= 0 ? activeRound[playerMatchIndex] : null;
  const titles = getPlayoffTitles(player.league);

  const isTbdTeam = (team) => {
    if (!team) return true;
    const id = team.id || team;
    return id === 'TBD' || (typeof id === 'string' && id.startsWith('TBD')) || team.name === 'TBD';
  };

  const getTeamLabel = (team) => {
    if (isTbdTeam(team)) return 'TBD';
    const id = team.id || team;
    let label = team.abbr || id;
    return typeof label === 'string' && label.length > 3 ? label.substring(0, 3).toUpperCase() : String(label).toUpperCase(); 
  };

  const renderTeamRow = (team, wins, winsNeeded, isFinal = false) => {
    const tbd = isTbdTeam(team);
    const teamId = team?.id || team;
    const label = getTeamLabel(team);
    const isWinner = wins >= winsNeeded;
    const teamData = !tbd ? getTeamData(teamId, playoffs.currentLg) : null;
    
    // NEW: Check if this bracket slot is the player's arch-rival
    const isRival = getPrimaryRival(player.team, player.league)?.id === teamId;

    return (
      <div className={`flex items-center text-[9px] sm:text-[10px] ${isWinner ? 'text-[#22E748]' : 'text-slate-300'}`}>
        <div className="w-3.5 h-3.5 mr-1.5 shrink-0 flex items-center justify-center overflow-hidden">
          {!tbd && teamData?.logo ? (
            <img 
              src={teamData.logo} 
              alt="" 
              style={{ width: '14px', height: '14px', objectFit: 'contain' }} 
              className="shrink-0 block" 
            />
          ) : !tbd ? (
            <span className="text-[7px] font-black text-slate-500">{label.substring(0, 2)}</span>
          ) : null}
        </div>
        <span className={`font-bold truncate text-left ${isFinal ? 'max-w-[60px] sm:max-w-[80px]' : 'max-w-[45px] sm:max-w-[60px]'} ${tbd ? 'text-slate-500 italic' : ''}`}>
          {label}
        </span>
        {isRival && <span className="text-[10px] ml-1 shrink-0 leading-none" title="Arch-Rival">🔥</span>}
        <span className="font-black sports-font ml-auto">{wins ?? 0}</span>
      </div>
    );
  };

  const activeOpponentId = activeMatch?.team2?.id || activeMatch?.team2 || 'UNK';

  return (
    <div className="game-panel p-3 sm:p-6 mt-2 border-t-2 border-t-[#F59E0B] flex flex-col items-center relative">
      
      {/* CARD MINIGAME GRID & NEXT ROUND PROCEED BUTTON */}
      {activeMatch && (
          <div className="max-w-md sm:max-w-lg md:max-w-xl w-full bg-[#101410] border border-[rgba(255,255,255,0.065)] p-4 sm:p-5 rounded-xl text-center shadow-lg mx-auto mb-4 shrink-0">

            {/* MATCHUP HEADER */}
            <div className="mb-4 flex flex-col items-center w-full">
              {activeMatch.status === 'playing' && (
                <>
                  <p className="text-[11px] sm:text-xs font-black text-[#3b82f6] uppercase tracking-widest mb-3 font-sans">
                      ROUND {playoffs.activeRoundIndex + 1} MATCHUP
                  </p>
                  <div className="flex items-center justify-start gap-4 w-full px-2">
                    <TeamLogo teamId={activeOpponentId} league={playoffs.currentLg} isAHL={playoffs.currentLg === 'AHL'} size="medium" />
                    <p className="text-sm text-slate-400 font-bold uppercase sports-font text-left leading-tight">
                        vs. <span className="text-white font-black text-lg sm:text-xl block mt-0.5">{getFullTeamName(activeOpponentId, playoffs.currentLg)}</span>
                    </p>
                  </div>
                </>
              )}
              
              {activeMatch.status === 'won' && (
                <>
                  <p className="text-[11px] sm:text-xs font-black text-[#22E748] uppercase tracking-widest mb-3 font-sans">
                      ⚡ SERIES VICTORY! ({activeMatch.wins1}-{activeMatch.wins2})
                  </p>
                  <div className="flex items-center justify-start gap-4 w-full px-2">
                    <TeamLogo teamId={activeOpponentId} league={playoffs.currentLg} isAHL={playoffs.currentLg === 'AHL'} size="medium" />
                    <p className="text-sm text-slate-400 font-bold uppercase sports-font text-left leading-tight">
                        Defeated <span className="text-white font-black text-lg sm:text-xl block mt-0.5">{getFullTeamName(activeOpponentId, playoffs.currentLg)}</span>
                    </p>
                  </div>
                </>
              )}
              
              {activeMatch.status === 'lost' && (
                <>
                  <p className="text-[11px] sm:text-xs font-black text-[#ef4444] uppercase tracking-widest mb-3 font-sans">
                      💔 ELIMINATED ({activeMatch.wins1}-{activeMatch.wins2})
                  </p>
                  <div className="flex items-center justify-start gap-4 w-full px-2">
                    <TeamLogo teamId={activeOpponentId} league={playoffs.currentLg} isAHL={playoffs.currentLg === 'AHL'} size="medium" />
                    <p className="text-sm text-slate-400 font-bold uppercase sports-font text-left leading-tight">
                        Defeated by <span className="text-white font-black text-lg sm:text-xl block mt-0.5">{getFullTeamName(activeOpponentId, playoffs.currentLg)}</span>
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* 3x3 CARD GRID */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {(activeMatch.deck || []).map((item, cIndex) => {
                const isRevealed = (activeMatch.revealed || []).includes(cIndex);
                const isOver = ['won', 'lost'].includes(activeMatch.status);
                const showForcefully = isOver && !isRevealed;
                const isWinCard = item && (item.isWin || item.win);
                const isRigged = item && item.rigged && !isRevealed; 
                
                let btnClass = 'h-16 sm:h-20 text-2xl sm:text-3xl font-black rounded-lg border transition-all duration-200 flex items-center justify-center sports-font ';
                
                if (isRevealed || showForcefully) {
                  btnClass += isWinCard 
                    ? 'bg-[#22E748]/20 border-[#22E748] text-[#22E748] shadow-[0_0_10px_rgba(34,231,72,0.3)]' 
                    : 'bg-[#ef4444]/20 border-[#ef4444] text-[#ef4444] shadow-[0_0_10px_rgba(239,68,68,0.3)]';
                } else if (isRigged) {
                  btnClass += 'bg-[#F59E0B]/20 border-[#F59E0B] text-[#F59E0B] shadow-[0_0_15px_rgba(245,158,11,0.5)] animate-pulse cursor-pointer hover:scale-105 active:scale-95';
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
                    {(isRevealed || showForcefully) ? (isWinCard ? 'W' : 'L') : (isRigged ? '⭐' : '?')}
                  </button>
                );
              })}
            </div>
            
            {/* BOTTOM ACTION AREA */}
              <div className="mt-4 flex flex-col justify-center items-center w-full min-h-[48px] sm:min-h-[56px]">
              {activeMatch.status === 'playing' ? (
                <div className="w-full flex flex-col items-center">
                  {(() => {
                    const gpm = getGamesPerMatchup(playoffs.currentLg, playoffs.activeRoundIndex);
                    const formatText = gpm === 1 ? 'Single Elimination' : `Best-of-${gpm}`;
                    return (
                      <p className="text-xs sm:text-sm text-slate-400 font-sans text-center w-full mb-3">Select a card to play the next game ({formatText})</p>
                    );
                  })()}

                  {/* CAPTAINCY ACTION */}
                  {player.storylines?.lockerRoom === 2 && !activeMatch.speechUsed && (
                    <div className="w-full mt-1">
                        <button 
                          onClick={() => {
                            setPlayer(p => ({
                              ...p, relationships: { ...p.relationships, coach: Math.max(0, p.relationships.coach - 10) }
                            }));
                            
                            const updatedBracket = playoffs.bracket.map((r, ri) => {
                                if (ri === playoffs.activeRoundIndex) {
                                    return r.map((m, mi) => {
                                        if (mi === playerMatchIndex) {
                                            const newDeck = [...m.deck];
                                            let targetIdx = newDeck.findIndex((c, i) => !(m.revealed || []).includes(i) && !c.isWin && !c.win);
                                            
                                            if (targetIdx === -1) {
                                                targetIdx = newDeck.findIndex((c, i) => !(m.revealed || []).includes(i));
                                            }
                                            
                                            if (targetIdx !== -1) {
                                                newDeck[targetIdx] = { ...newDeck[targetIdx], isWin: true, win: true, rigged: true };
                                            }
                                            return { ...m, deck: newDeck, speechUsed: true };
                                        }
                                        return m;
                                    });
                                }
                                return r;
                            });
                            
                            setPlayoffs({ ...playoffs, bracket: updatedBracket });
                          }}
                          className="w-full py-2 bg-[#F59E0B]/10 hover:bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40 rounded-xl font-black sports-font tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(245,158,11,0.15)] cursor-pointer text-sm"
                        >
                          📢 CAPTAIN'S SPEECH (GUARANTEE NEXT WIN)
                        </button>
                        <p className="text-[9px] text-slate-500 font-bold uppercase text-center mt-1">Cost: -10 Coach Trust</p>
                    </div>
                  )}
                  
                  {activeMatch.speechUsed && (
                      <div className="w-full mt-1 border border-[#F59E0B]/30 bg-[#F59E0B]/10 py-2 rounded-xl">
                        <p className="text-[#F59E0B] font-black uppercase tracking-widest text-[10px] sm:text-xs animate-pulse">
                            📢 SPEECH DELIVERED! CLICK THE GLOWING CARD!
                        </p>
                      </div>
                  )}
                </div>
              ) : (
                <div className="w-full max-w-xs mx-auto animate-fade-in">
                  {activeMatch.status === 'won' && playoffs.overallStatus !== 'won_cup' && (
                    <button onClick={advancePlayoffRound} className="btn-primary w-full py-3 px-6 rounded-xl font-black sports-font text-sm sm:text-base uppercase tracking-widest transition-transform hover:scale-105 cursor-pointer shadow-[0_0_15px_rgba(34,231,75,0.2)]">
                      ADVANCE TO ROUND {playoffs.activeRoundIndex + 2} ➔
                    </button>
                  )}
                  
                  {['won_cup', 'eliminated'].includes(playoffs.overallStatus) && (
                      <button 
                        onClick={proceedFromPlayoffs} 
                        className={`py-3 px-6 rounded-xl cursor-pointer sports-font tracking-widest w-full font-black text-sm uppercase transition-transform hover:scale-105 ${
                          playoffs.overallStatus === 'eliminated' 
                            ? 'bg-[#101410] border border-[rgba(255,255,255,0.15)] text-white hover:bg-[#1a2230]' 
                            : 'btn-primary shadow-[0_0_15px_rgba(34,231,75,0.2)]'
                        }`}
                      >
                        {playoffs.overallStatus === 'won_cup' ? 'LIFT THE TROPHY' : 'PROCEED TO RECAP'}
                      </button>
                  )}
                </div>
              )}
            </div>
          </div>
      )}

      {/* CONFERENCE HEADERS */}
      <div className="flex justify-between w-full max-w-5xl px-2 mb-2 mt-2 text-[10px] sm:text-xs md:text-sm font-black sports-font uppercase tracking-wider">
        {playoffs.hasConfs && (
        <div className="flex justify-between w-full max-w-5xl px-2 mb-2 mt-2 text-[10px] sm:text-xs md:text-sm font-black sports-font uppercase tracking-wider">
          <span className="text-[#ef4444]">WESTERN</span>
          <span className="text-[#3b82f6]">EASTERN</span>
        </div>
      )}
      </div>

      {/* BRACKET VIEW */}
      <div className="w-full overflow-x-auto pb-6 border-b border-[rgba(255,255,255,0.065)] scrollbar-hide">
        <div className="flex items-stretch gap-1.5 sm:gap-2 w-max mx-auto px-2 min-h-[250px]">
          {playoffs.hasConfs ? (
            <>
              {/* WESTERN CONFERENCE */}
              <div className="flex gap-1.5 sm:gap-2">
                {playoffs.bracket.slice(0, playoffs.bracket.length - 1).map((round, rIdx) => (
                  <div key={`left-${rIdx}`} className="flex flex-col gap-1 w-[80px] sm:w-[95px] shrink-0">
                    <div className="min-h-[32px] flex items-center justify-center text-center leading-tight mb-1 px-0.5">
                      <p className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                        {(getPlayoffRounds(playoffs.currentLg)[rIdx]?.name || `ROUND ${rIdx + 1}`).toUpperCase()}
                      </p>
                    </div>
                    <div className="flex-1 flex flex-col justify-around gap-1">
                      {round.map((match, mIdx) => {
                        if (match.conf !== 'West') return null;
                        const isLocked = match.status === 'locked';
                        const rWN = getWinsNeeded(playoffs.currentLg, rIdx);
                        return (
                          <div key={mIdx} className={`rounded p-1 border flex flex-col gap-0.5 transition-all duration-300 ${isLocked ? 'opacity-30 grayscale' : 'opacity-100'} ${match.isPlayerSeries ? 'border-[#3b82f6] bg-[#3b82f6]/10 shadow-[0_0_8px_rgba(59,130,246,0.3)] ring-1 ring-[#3b82f6]' : 'border-[rgba(255,255,255,0.065)] bg-[#101410]'}`}>
                            {renderTeamRow(match.team1, match.wins1, rWN)}
                            {renderTeamRow(match.team2, match.wins2, rWN)}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* CHAMPIONSHIP FINAL */}
              <div className="flex flex-col justify-center gap-2 w-[90px] sm:w-[120px] shrink-0 relative px-0.5">
                <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none mix-blend-screen">
                  <TrophyImage league={playoffs.currentLg} className="w-20 h-20 sm:w-24 sm:h-24 mt-4" />
                </div>
                <div className="min-h-[32px] flex items-center justify-center text-center leading-tight mb-1 px-0.5 relative z-10">
                  <p className="text-[8px] sm:text-[9px] font-black text-[#F59E0B] uppercase tracking-wider">
                    {titles.final.toUpperCase()}
                  </p>
                </div>
                {playoffs.bracket[playoffs.bracket.length - 1].map((match, mIdx) => {
                  const isLocked = match.status === 'locked';
                  const rWN = getWinsNeeded(playoffs.currentLg, playoffs.bracket.length - 1);
                  return (
                    <div key={mIdx} className={`relative z-10 rounded-lg p-1.5 border flex flex-col gap-0.5 transition-all duration-300 ${isLocked ? 'opacity-30 grayscale border-[#F59E0B]/20 bg-[#101410]' : match.isPlayerSeries ? 'border-[#3b82f6] bg-[#3b82f6]/10 shadow-[0_0_15px_rgba(59,130,246,0.4)]' : 'border-[#F59E0B]/50 bg-[#101410]'}`}>
                      {renderTeamRow(match.team1, match.wins1, rWN, true)}
                      {renderTeamRow(match.team2, match.wins2, rWN, true)}
                    </div>
                  );
                })}
              </div>

              {/* EASTERN CONFERENCE */}
              <div className="flex flex-row-reverse gap-1.5 sm:gap-2">
                {playoffs.bracket.slice(0, playoffs.bracket.length - 1).map((round, rIdx) => (
                  <div key={`right-${rIdx}`} className="flex flex-col gap-1 w-[80px] sm:w-[95px] shrink-0">
                    <div className="min-h-[32px] flex items-center justify-center text-center leading-tight mb-1 px-0.5">
                      <p className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                        {(getPlayoffRounds(playoffs.currentLg)[rIdx]?.name || `ROUND ${rIdx + 1}`).toUpperCase()}
                      </p>
                    </div>
                    <div className="flex-1 flex flex-col justify-around gap-1">
                      {round.map((match, mIdx) => {
                        if (match.conf !== 'East') return null;
                        const isLocked = match.status === 'locked';
                        const rWN = getWinsNeeded(playoffs.currentLg, rIdx);
                        return (
                          <div key={mIdx} className={`rounded p-1 border flex flex-col gap-0.5 transition-all duration-300 ${isLocked ? 'opacity-30 grayscale' : 'opacity-100'} ${match.isPlayerSeries ? 'border-[#3b82f6] bg-[#3b82f6]/10 shadow-[0_0_8px_rgba(59,130,246,0.3)] ring-1 ring-[#3b82f6]' : 'border-[rgba(255,255,255,0.065)] bg-[#101410]'}`}>
                            {renderTeamRow(match.team1, match.wins1, rWN)}
                            {renderTeamRow(match.team2, match.wins2, rWN)}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            /* SINGLE-BRACKET LAYOUT */
            <div className="flex gap-1.5 sm:gap-2">
              {playoffs.bracket.map((round, rIdx) => (
                <div key={`single-${rIdx}`} className="flex flex-col gap-1 w-[85px] sm:w-[100px] shrink-0">
                  <div className="min-h-[32px] flex items-center justify-center text-center leading-tight mb-1 px-0.5">
                    <p className={`text-[8px] sm:text-[9px] font-bold uppercase tracking-wider ${rIdx === playoffs.bracket.length - 1 ? 'text-[#F59E0B]' : 'text-slate-500'}`}>
                      {rIdx === playoffs.bracket.length - 1 ? titles.final.toUpperCase() : (getPlayoffRounds(playoffs.currentLg)[rIdx]?.name || `ROUND ${rIdx + 1}`).toUpperCase()}
                    </p>
                  </div>
                  <div className="flex-1 flex flex-col justify-around gap-1">
                    {round.map((match, mIdx) => {
                      const isLocked = match.status === 'locked';
                      const rWN = getWinsNeeded(playoffs.currentLg, rIdx);
                      const isFinal = rIdx === playoffs.bracket.length - 1;
                      return (
                        <div key={mIdx} className={`rounded p-1 border flex flex-col gap-0.5 transition-all duration-300 ${isLocked ? 'opacity-30 grayscale' : 'opacity-100'} ${match.isPlayerSeries ? 'border-[#3b82f6] bg-[#3b82f6]/10 shadow-[0_0_8px_rgba(59,130,246,0.3)] ring-1 ring-[#3b82f6]' : isFinal ? 'border-[#F59E0B]/50 bg-[#101410]' : 'border-[rgba(255,255,255,0.065)] bg-[#101410]'}`}>
                          {renderTeamRow(match.team1, match.wins1, rWN, isFinal)}
                          {renderTeamRow(match.team2, match.wins2, rWN, isFinal)}
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
    </div>
  );
}