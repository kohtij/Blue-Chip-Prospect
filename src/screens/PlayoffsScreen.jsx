import  { useEffect } from 'react';
import { useAppContext } from '../AppContext';
import { getFullTeamName, getGamesPerMatchup, getPlayoffTitles, getWinsNeeded } from '../utils/appHelpers';
import { getPlayoffRounds, getTeamData, getPrimaryRival, usesPathView } from '../data/teams';
import TeamLogo from '../components/TeamLogo';
import TournamentPath from '../components/TournamentPath';
import TrophyImage from '../components/TrophyImage';
import { applyOvrDelta, recomputeOvr } from '../utils/gameHelpers';

export default function PlayoffsScreen() {
  const { advancePlayoffRound, handleGridClick, player, playoffs, proceedFromPlayoffs, setPlayer, setPlayoffs, triggerMinigame } = useAppContext();
  
  const activeRound = playoffs.bracket[playoffs.activeRoundIndex];
  const playerMatchIndex = activeRound?.findIndex(m => m.isPlayerSeries);
  const activeMatch = playerMatchIndex >= 0 ? activeRound[playerMatchIndex] : null;

  // The NCAA tournament is single elimination from the regional semifinal to
  // the national championship, so its rounds hand over a one-card deck rather
  // than the nine-card grid a series uses. Dropping that single card into a
  // three-column grid left it stranded in the top-left corner, and winning it
  // announced a SERIES VICTORY for a series that was never played.
  const isSingleGame = (activeMatch?.deck || []).length === 1;

  // Leagues flagged for the path view show the whole run as a row of results
  // instead of a deck to turn over. NCAA only for now; the flag lives on the
  // league config so international tournaments can join later.
  const usePath = usesPathView(playoffs?.currentLg);
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

  const renderTeamRow = (team, wins, winsNeeded, isFinal = false, hideScore = false) => {
    const tbd = isTbdTeam(team);
    const teamId = team?.id || team;
    const label = getTeamLabel(team);
    const isWinner = wins >= winsNeeded;
    const teamData = !tbd ? getTeamData(teamId, playoffs.currentLg) : null;
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
        
        {!hideScore && (
          <span className="font-black sports-font ml-auto">{wins ?? 0}</span>
        )}
      </div>
    );
  };

  const activeOpponentId = activeMatch?.team2?.id || activeMatch?.team2 || 'UNK';
  const isRivalMatchup = getPrimaryRival(player.team, player.league)?.id === activeOpponentId;
  const seasonsWithOpponent = (player.seasonHistory || []).filter(s => s.team === activeOpponentId).length;
  const isFormerTeam = seasonsWithOpponent >= 3;
  const isSidelined = !!playoffs.playerSidelined;
  // Injured players watch from the press box, so there is no Bad Blood moment.
  const isBadBlood = !isSidelined && (isRivalMatchup || isFormerTeam);

  // Round-by-round results of the team's run, for the press box summary.
  const sidelinedRuns = isSidelined
    ? playoffs.bracket
        .map((round, rIdx) => {
          const m = round.find(x => x.isPlayerSeries && ['won', 'lost'].includes(x.status));
          if (!m) return null;
          const roundName = rIdx === playoffs.bracket.length - 1
            ? titles.final
            : (getPlayoffRounds(playoffs.currentLg)[rIdx]?.name || `Round ${rIdx + 1}`);
          return {
            key: `run-${rIdx}`,
            roundName,
            won: m.status === 'won',
            score: `${m.wins1}-${m.wins2}`,
            opponentId: m.team2?.id || m.team2
          };
        })
        .filter(Boolean)
    : [];

// Dynamic Series Flavor Text
  let seriesFlavor = "";
  if (isSidelined) {
      seriesFlavor = playoffs.overallStatus === 'won_cup'
        ? "Your team won it all without you. You were still part of the parade."
        : "Your team fell short. You watched the whole thing from the press box.";
  } else if (activeMatch && ['won', 'lost'].includes(activeMatch.status)) {
      const mIsT1 = activeMatch.team1 === player.team || activeMatch.team1?.id === player.team;
      const playerWins = mIsT1 ? activeMatch.wins1 : activeMatch.wins2;
      const oppWins = mIsT1 ? activeMatch.wins2 : activeMatch.wins1;
      
      const totalGames = playerWins + oppWins;
      const wN = getWinsNeeded(playoffs.currentLg, playoffs.activeRoundIndex);
      const isSweep = oppWins === 0 && activeMatch.status === 'won';
      const isSwept = playerWins === 0 && activeMatch.status === 'lost';
      const isMaxGames = totalGames === (wN * 2) - 1; 

      const isFinalRound = playoffs.activeRoundIndex === playoffs.bracket.length - 1;

      // One game cannot be a sweep, and it cannot go the distance either. Every
      // line below is written for a series, so winning a regional semifinal was
      // reported as "a flawless sweep" of a series that lasted sixty minutes.
      if (isSingleGame) {
          if (isFinalRound) {
              seriesFlavor = activeMatch.status === 'won'
                ? "One game for everything, and you took it. National champions."
                : "Sixty minutes from a national title, and it got away. There is no next game.";
          } else {
              seriesFlavor = activeMatch.status === 'won'
                ? "Win or go home, and you are still here. On to the next one."
                : "One game, one loss, and the season is over. That is single elimination.";
          }
      } else if (isFinalRound) {
          if (activeMatch.status === 'won') seriesFlavor = isSweep ? "A dominant sweep to capture the ultimate prize! You are a champion!" : isMaxGames ? "A legendary final-game victory to win the championship! History is made." : "You conquered the finals and claimed the championship. The glory is yours!";
          else seriesFlavor = isSwept ? "An embarrassing sweep on the biggest stage. A devastating end to the season." : isMaxGames ? "Heartbreak in the deciding game of the finals. The ultimate prize slips through your fingers." : "A crushing defeat in the finals. You fell just short of hockey immortality.";
      } else {
          if (activeMatch.status === 'won') seriesFlavor = isSweep ? "You brought out the brooms! A flawless sweep sends you to the next round." : isMaxGames ? "A grueling, blood-and-guts deciding game victory. You survive and advance." : "A hard-fought series win. Your playoff journey continues.";
          else seriesFlavor = isSwept ? "Swept out of the playoffs. A humiliating end to a promising season." : isMaxGames ? "A devastating final-game heartbreak. Your postseason run ends here." : "A bitter series defeat. Pack your bags for the summer.";
      }
  }

  const handleBadBloodAnswer = (choice) => {
      setPlayoffs(prev => {
          const newBracket = [...prev.bracket];
          const roundMatches = [...newBracket[prev.activeRoundIndex]];
          roundMatches[playerMatchIndex] = { ...activeMatch, badBloodAnswered: true, badBloodChoice: choice };
          newBracket[prev.activeRoundIndex] = roundMatches;
          return { ...prev, bracket: newBracket };
      });
  };

  useEffect(() => {
    if (activeMatch && isBadBlood && ['won', 'lost'].includes(activeMatch.status) && !activeMatch.badBloodResolved) {
       const choice = activeMatch.badBloodChoice || 'safe';
       let fanStatusDelta = 0;
       let ovrDelta = 0;
       let relDelta = { media: 0, coach: 0 };
       let feedbackMsg = "";

       if (activeMatch.status === 'won') {
           ovrDelta = 1; 
           fanStatusDelta = choice === 'guarantee' ? 50 : 15;
           feedbackMsg = choice === 'guarantee' 
              ? "You backed up your guarantee and eliminated them! The fans are going wild!" 
              : "You eliminated your rivals and stayed composed. A huge series win!";
       } else {
           relDelta = { media: -15, coach: -15 };
           fanStatusDelta = choice === 'guarantee' ? -50 : -10;
           feedbackMsg = choice === 'guarantee' 
              ? "You guaranteed a win and choked. The media is roasting you." 
              : "A devastating playoff loss to a familiar foe.";
       }

       setPlayer(p => {
          const withOvr = applyOvrDelta(p, ovrDelta);
          return {
              ...withOvr,
              fanStatus: Math.min(1000, Math.max(0, (withOvr.fanStatus || 0) + fanStatusDelta)),
              ovr: recomputeOvr(withOvr),
              relationships: {
                  ...withOvr.relationships,
                  media: Math.max(0, (withOvr.relationships?.media || 50) + relDelta.media),
                  coach: Math.max(0, (withOvr.relationships?.coach || 50) + relDelta.coach)
              }
          };
       });

       setPlayoffs(prev => {
          const newBracket = [...prev.bracket];
          const roundMatches = [...newBracket[prev.activeRoundIndex]];
          roundMatches[playerMatchIndex] = { ...activeMatch, badBloodResolved: true, badBloodFeedback: feedbackMsg };
          newBracket[prev.activeRoundIndex] = roundMatches;
          return { ...prev, bracket: newBracket };
       });
    }
  }, [activeMatch, isBadBlood, playerMatchIndex, playoffs.activeRoundIndex, setPlayer, setPlayoffs]);

  return (
    <div className="game-panel p-3 sm:p-6 mt-2 border-t-2 border-t-[#F59E0B] flex flex-col items-center relative">
      
      {/* CARD MINIGAME GRID & NEXT ROUND PROCEED BUTTON */}
      {activeMatch && (
          <div className="max-w-md sm:max-w-lg md:max-w-xl w-full bg-[#101410] border border-[rgba(255,255,255,0.065)] p-4 sm:p-5 rounded-xl text-center shadow-lg mx-auto mb-4 shrink-0">

            {/* MATCHUP HEADER */}
            <div className="flex flex-col items-center w-full mb-5">
              {/* FIXED STATUS BAR (Prevents top text shifting) */}
              <div className="h-5 flex items-center justify-center w-full mb-4">
                {activeMatch.status === 'playing' && (
                  <p className="text-[11px] sm:text-xs font-black text-[#3b82f6] uppercase tracking-widest font-sans leading-none">
                      ROUND {playoffs.activeRoundIndex + 1} MATCHUP
                  </p>
                )}
                {activeMatch.status === 'won' && (
                  <p className="text-[11px] sm:text-xs font-black text-[#22E748] uppercase tracking-widest font-sans leading-none">
                      {isSingleGame
                        ? (playoffs.activeRoundIndex === playoffs.bracket.length - 1 ? '🏆 CHAMPIONS!' : '⚡ YOU ADVANCE!')
                        : `⚡ SERIES VICTORY! (${activeMatch.wins1}-${activeMatch.wins2})`}
                  </p>
                )}
                {activeMatch.status === 'lost' && (
                  <p className="text-[11px] sm:text-xs font-black text-[#ef4444] uppercase tracking-widest font-sans leading-none">
                      {isSingleGame ? '💔 ELIMINATED' : `💔 ELIMINATED (${activeMatch.wins1}-${activeMatch.wins2})`}
                  </p>
                )}
              </div>

              {/* FIXED TEAM LOGO & NAME ROW */}
              <div className="flex items-center justify-start gap-4 w-full px-2">
                <TeamLogo teamId={activeOpponentId} league={playoffs.currentLg} isAHL={playoffs.currentLg === 'AHL'} size="medium" />
                <p className="text-sm text-slate-400 font-bold uppercase sports-font text-left leading-tight">
                    {activeMatch.status === 'playing' ? 'vs.' : activeMatch.status === 'won' ? 'Defeated' : 'Defeated by'}{' '}
                    <span className="text-white font-black text-lg sm:text-xl block mt-0.5">
                      {getFullTeamName(activeOpponentId, playoffs.currentLg)}
                    </span>
                </p>
              </div>

              {/* FLAVOR / RESULT TEXT — the slot reserves enough room for the
                  longest result line to wrap, so the card grid below never shifts
                  when the text appears. Measured worst case is 39px on mobile and
                  46px from sm up; anything longer added later would bump again. */}
              <div className="w-full min-h-[40px] sm:min-h-[48px] flex items-center justify-center mt-3 px-2">
                {/* Bad Blood feedback wins over the generic line: it is the result
                    of a call the player actually made, and it carries the fan and
                    trust swing. It used to sit below seriesFlavor, which is set for
                    every finished series, so it could never be reached. Rendered as
                    plain coloured text rather than a bordered box so it fits the
                    same reserved slot and nothing shifts. */}
                {activeMatch.badBloodFeedback ? (
                  <p className={`font-sans font-bold text-xs sm:text-sm text-center max-w-md leading-relaxed animate-fade-in ${activeMatch.status === 'won' ? 'text-[#22E748]' : 'text-[#ef4444]'}`}>
                    {activeMatch.badBloodFeedback}
                  </p>
                ) : seriesFlavor ? (
                  <p className="text-slate-300 font-sans text-xs sm:text-sm text-center max-w-md leading-relaxed animate-fade-in">
                    {seriesFlavor}
                  </p>
                ) : null}
              </div>
            </div>

           {isSidelined ? (
               <div className="w-full flex flex-col items-center pb-3 animate-fade-in">
                  <h3 className="text-xl sm:text-2xl font-black text-[#F59E0B] sports-font uppercase mb-3">FROM THE PRESS BOX</h3>
                  <div className="w-full flex flex-col gap-2 mb-5">
                    {sidelinedRuns.map(run => (
                      <div key={run.key} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#1a2230]/60 text-left">
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{run.roundName}</p>
                          <p className="text-xs sm:text-sm text-slate-300 font-sans truncate">vs. {getFullTeamName(run.opponentId, playoffs.currentLg)}</p>
                        </div>
                        <span className={`shrink-0 font-black sports-font text-sm ${run.won ? 'text-[#22E748]' : 'text-[#ef4444]'}`}>
                          {run.won ? 'W' : 'L'} {run.score}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="w-full max-w-xs mx-auto">
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
                  </div>
               </div>
            ) : isBadBlood && !activeMatch.badBloodAnswered && activeMatch.status === 'playing' ? (
               <div className="w-full flex flex-col items-center pb-2 animate-fade-in">
                  <h3 className="text-xl sm:text-2xl font-black text-[#ef4444] sports-font uppercase mb-3">BAD BLOOD</h3>
                  <p className="text-slate-300 font-sans text-sm sm:text-base mb-6 text-center">
                     You are facing {isRivalMatchup ? 'your arch-rivals' : 'your former team'} in the playoffs. The media surrounds your locker, begging for a headline. How do you respond?
                  </p>
                  <div className="flex flex-col gap-3 w-full">
                     <button 
                       onClick={() => handleBadBloodAnswer('guarantee')}
                       className="w-full p-4 rounded-xl bg-[#101410] border border-[#ef4444]/40 hover:bg-[#1a2230] hover:border-[#ef4444] text-[#ef4444] font-bold text-left transition-all cursor-pointer shadow-lg"
                     >
                       <div className="font-black sports-font uppercase text-lg mb-1">Guarantee a Series Win</div>
                       <div className="text-xs font-sans text-slate-400">High Risk, High Reward (+/- 50 Fan Status).</div>
                     </button>
                     <button 
                       onClick={() => handleBadBloodAnswer('safe')}
                       className="w-full p-4 rounded-xl bg-[#101410] border border-[rgba(255,255,255,0.1)] hover:bg-[#1a2230] hover:border-[#3b82f6] text-white font-bold text-left transition-all cursor-pointer shadow-lg"
                     >
                       <div className="font-black sports-font uppercase text-lg mb-1">Play it Safe</div>
                       <div className="text-xs font-sans text-slate-400">Standard media answers. Focus on the hockey.</div>
                     </button>
                  </div>
               </div>
            ) : playoffs.activeRoundIndex === playoffs.bracket.length - 1 ? (
              <div className="w-full flex flex-col items-center pb-3 animate-fade-in">
                 {/* The final has its own moment, but the run that got you here
                     should not vanish on the one screen where it matters most.
                     Read-only: the championship is played through the minigame
                     below, not by turning a card over. */}
                 {usePath && (
                   <div className="w-full mb-5">
                     <TournamentPath playoffs={playoffs} canPlay={false} onPlay={() => {}} />
                   </div>
                 )}
                 {activeMatch.status === 'playing' ? (
                   <>
                     <h3 className="text-2xl sm:text-3xl font-black text-[#F59E0B] sports-font uppercase mb-3">THE FINAL SHIFT</h3>
                     <p className="text-slate-300 font-sans text-sm sm:text-base mb-6 max-w-md mx-auto">
                        {usePath
                          ? 'Third period, tie game, winner takes the national title. One shift between you and everything.'
                          : 'Game 7. Third Period. Tie Game. The entire season comes down to this single moment. Your legacy is on the line.'}
                     </p>
                     <button 
                       onClick={() => triggerMinigame('finals')} 
                       className="w-full max-w-sm mx-auto bg-[#F59E0B] hover:bg-[#d97706] text-white py-3 sm:py-4 rounded-xl font-black sports-font tracking-widest uppercase text-sm sm:text-base transition-all hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(245,158,11,0.4)] block"
                     >
                       TAKE THE ICE
                     </button>
                   </>
                 ) : (
                   <div className="w-full max-w-xs mx-auto animate-fade-in mt-4">
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
                   </div>
                 )}
              </div>
            ) : (
              <>
                {/* 3x3 CARD GRID. Nine squares holding exactly the wins the
                    format needs: four in a best-of-seven, three in a best-of-five,
                    two in a best-of-three. Single elimination gets one card
                    instead, because there is only one game to play. */}
                {usePath ? (
                  <>
                    <p className="text-[10px] sm:text-[11px] font-black text-[#F59E0B] uppercase tracking-widest text-center mb-3 font-sans">
                      ⚡ Single elimination · Winner advances
                    </p>
                    <TournamentPath
                      playoffs={playoffs}
                      canPlay={activeMatch.status === 'playing'}
                      onPlay={(rIdx) => handleGridClick(rIdx, playerMatchIndex, 0)}
                    />
                  </>
                ) : (
                <div className={isSingleGame ? 'grid grid-cols-1' : 'grid grid-cols-3 gap-2 sm:gap-3'}>
                  {(activeMatch.deck || []).map((item, cIndex) => {
                    const isRevealed = (activeMatch.revealed || []).includes(cIndex);
                    const isOver = ['won', 'lost'].includes(activeMatch.status);
                    const showForcefully = isOver && !isRevealed;
                    const isWinCard = item && (item.isWin || item.win);
                    const isRigged = item && item.rigged && !isRevealed; 
                    
                    let btnClass = (isSingleGame
                      ? 'h-28 sm:h-32 text-4xl sm:text-5xl '
                      : 'h-16 sm:h-20 text-2xl sm:text-3xl ')
                      + 'font-black rounded-xl border transition-all duration-200 flex items-center justify-center sports-font ';
                    
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
                )}

                {/* BOTTOM ACTION AREA */}
                <div className="mt-4 flex flex-col justify-center items-center w-full min-h-[110px] sm:min-h-[120px]">
                  {activeMatch.status === 'playing' ? (
                    <div className="w-full flex flex-col items-center">
                      {(() => {
                        const gpm = getGamesPerMatchup(playoffs.currentLg, playoffs.activeRoundIndex);
                        const formatText = gpm === 1 ? 'Single Elimination' : `Best-of-${gpm}`;
                        return (
                          <p className="text-xs sm:text-sm text-slate-400 font-sans text-center w-full mb-3">{usePath ? 'Play the next round. Win and you move on, lose and the season is over.' : `Select a card to play the next game (${formatText})`}</p>
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
                    <div className="w-full max-w-xs mx-auto animate-fade-in mt-4">
                      {activeMatch.status === 'won' && playoffs.overallStatus !== 'won_cup' && (
                        <button onClick={advancePlayoffRound} className="btn-primary w-full py-3 px-6 rounded-xl font-black sports-font text-sm sm:text-base uppercase tracking-widest transition-transform hover:scale-105 cursor-pointer shadow-[0_0_15px_rgba(34,231,75,0.2)]">
                          ADVANCE TO ROUND {playoffs.activeRoundIndex + 2} ➔
                        </button>
                      )}
                      
                      {activeMatch.status === 'lost' && (
                        <button onClick={proceedFromPlayoffs} className="bg-[#101410] border border-[#ef4444]/50 hover:bg-[#1a2230] text-[#ef4444] w-full py-3 px-6 rounded-xl font-black sports-font text-sm sm:text-base uppercase tracking-widest transition-transform hover:scale-105 cursor-pointer shadow-lg mt-2">
                          PROCEED TO RECAP ➔
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
      )}

      {/* CONFERENCE HEADERS */}
      {playoffs.hasConfs && (
        <div className="flex justify-between w-full max-w-5xl px-2 mb-3 text-[10px] sm:text-xs md:text-sm font-black sports-font uppercase tracking-wider">
          <span className="text-[#ef4444]">WESTERN</span>
          <span className="text-[#3b82f6]">EASTERN</span>
        </div>
      )}

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
                  const finalRoundIdx = playoffs.bracket.length - 1;
                  const rWN = getWinsNeeded(playoffs.currentLg, finalRoundIdx);
                  const isVsMode = match.isPlayerSeries && playoffs.overallStatus !== 'eliminated' && playoffs.overallStatus !== 'won_cup';

                  return (
                    <div 
                      key={mIdx} 
                      className={`relative z-10 rounded-lg p-1.5 border flex items-center justify-between transition-all duration-300 ${
                        isLocked 
                          ? 'opacity-30 grayscale border-[#F59E0B]/20 bg-[#101410]' 
                          : match.isPlayerSeries 
                          ? 'border-[#3b82f6] bg-[#3b82f6]/10 shadow-[0_0_15px_rgba(59,130,246,0.4)]' 
                          : 'border-[#F59E0B]/50 bg-[#101410]'
                      }`}
                    >
                      <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                        {renderTeamRow(match.team1, match.wins1, rWN, true, isVsMode)}
                        {renderTeamRow(match.team2, match.wins2, rWN, true, isVsMode)}
                      </div>
                      {isVsMode && (
                        <span className="font-black sports-font text-[#F59E0B] text-[10px] ml-1.5 shrink-0 tracking-wider">
                          VS
                        </span>
                      )}
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
                      const isVsMode = isFinal && match.isPlayerSeries && playoffs.overallStatus !== 'eliminated' && playoffs.overallStatus !== 'won_cup';

                      return (
                        <div 
                          key={mIdx} 
                          className={`rounded p-1 border flex items-center justify-between transition-all duration-300 ${
                            isLocked 
                              ? 'opacity-30 grayscale' 
                              : 'opacity-100'
                          } ${
                            match.isPlayerSeries 
                              ? 'border-[#3b82f6] bg-[#3b82f6]/10 shadow-[0_0_8px_rgba(59,130,246,0.3)] ring-1 ring-[#3b82f6]' 
                              : isFinal 
                              ? 'border-[#F59E0B]/50 bg-[#101410]' 
                              : 'border-[rgba(255,255,255,0.065)] bg-[#101410]'
                          }`}
                        >
                          <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                            {renderTeamRow(match.team1, match.wins1, rWN, isFinal, isVsMode)}
                            {renderTeamRow(match.team2, match.wins2, rWN, isFinal, isVsMode)}
                          </div>
                          {isVsMode && (
                            <span className="font-black sports-font text-[#F59E0B] text-[10px] ml-1.5 shrink-0 tracking-wider">
                              VS
                            </span>
                          )}
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