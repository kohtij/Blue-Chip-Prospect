import { simulateSeason } from '../utils/gameHelpers';
import { runPostSeasonFlow } from './runPostSeasonFlow';

export function handleTrain(ctx, t) {
  const { 
    player, setHasDemandedTrade, setPendingSeasonResult, 
    setPlayer, setScreen, setSeasonRecap, setStatChanges, unlockAchievement 
  } = ctx;

  setHasDemandedTrade(false);
  
  // 1. Run the simulation
  const result = simulateSeason(player, t?.effect);
  if (!result) return;

  const { updatedPlayer, recap, statChanges, isDemoted, currentLg, currentTeam } = result;

  // 2. Award Achievements
  if (updatedPlayer.league === 'NHL' && recap.games > 0) unlockAchievement('first_nhl_goal');
  if (recap.g >= 50) unlockAchievement('fifty_goal_season');
  if ((recap.g + recap.a) >= 100) unlockAchievement('hundred_pt_season');
  if (recap.sho >= 8) unlockAchievement('shutout_king');
  if (updatedPlayer.ovr >= 90) unlockAchievement('max_ovr');

  // ONLY award demotion if you actually dropped from the NHL to the AHL mid-season
  if (player.league === 'NHL' && isDemoted) unlockAchievement('demoted');

  // 3. Commit State and Push to History
  // 3. Commit State and Push to History
  const historyEntry = {
      year: 2026 + ((player.stats?.seasonsPlayed || 0)), 
      team: currentTeam,
      league: currentLg,
      games: recap.games,
      goals: recap.g,
      assists: recap.a,
      saves: recap.saves,
      shots: recap.shots,
      shutouts: recap.sho,
      plusMinus: recap.pm,
      awards: recap.awards || [],
      titleWon: false,
      avgToi: recap.avgToi
  };
  
  updatedPlayer.seasonHistory = [...(player.seasonHistory || []), historyEntry];

  setPlayer(updatedPlayer);
  setStatChanges(statChanges);
  setTimeout(() => setStatChanges(null), 3000);

  // 4. Route to the correct screen
  let isWaiverClaim = recap.waiverEvent === 'CLAIMED';
  let customWaiverEvent = recap.waiverEvent;

  // Add clarity for Junior Development Assignments
  if (recap.waiverEvent === '9_GAME_RULE' || (isDemoted && ['OHL', 'WHL', 'QMJHL'].includes(currentLg))) {
     const draftTeamName = player.draftTeam ? player.draftTeam : "The team that drafted you";
     customWaiverEvent = `${draftTeamName} felt you needed more time to develop physically. They have officially assigned you back to the CHL team that holds your junior rights.`;
  }

  if (isDemoted || isWaiverClaim || customWaiverEvent === 'DEVELOPMENT' || customWaiverEvent) {
     setSeasonRecap({ 
        ...recap, 
        wasDemotedTo: currentLg, 
        wasWaived: isWaiverClaim,
        waiverEvent: customWaiverEvent // Overwrite with the custom explanation
     });
  } else {
     setSeasonRecap(recap);
  }

  if (currentLg === 'NCAA') {
     runPostSeasonFlow(ctx, updatedPlayer.age, updatedPlayer.ovr, currentLg, currentTeam, result.madePlayoffs, 2026 + (updatedPlayer.stats?.seasonsPlayed || 0), recap?.standings || 16);
  } else {
     setPendingSeasonResult(result);
     
     // 🌟 ALL-STAR INTERCEPT
     // If the engine granted them an All-Star or All-American award, route them to the weekend festivities!
     const isAllStar = recap.awards?.some(a => a.includes('All-Star') || a.includes('All-American'));
     
     // 🌟 ROSTER MOVE INTERCEPTOR
     const wasAHLtoNHL = player.league === 'AHL' && currentLg === 'NHL';
     const wasECHLtoAHL = player.league === 'ECHL' && currentLg === 'AHL';
     const wasJuniorToPro = ['OHL', 'WHL', 'QMJHL', 'NCAA'].includes(player.league) && ['NHL', 'AHL'].includes(currentLg);
     const wasNHLtoAHL = player.league === 'NHL' && currentLg === 'AHL';
     const wasAHLtoECHL = player.league === 'AHL' && currentLg === 'ECHL';
     const wasWaiverClaim = recap.waiverEvent === 'CLAIMED';
     const wasJuniorReturn = recap.waiverEvent === '9_GAME_RULE';

     let moveTitle = null;
     let moveDesc = null;

     if (wasWaiverClaim) {
         moveTitle = '✈️ CLAIMED OFF WAIVERS';
         moveDesc = `You were placed on waivers and claimed by a new NHL organization. You are packing your bags immediately to join your new club.`;
     } else if (wasJuniorReturn) {
         if (player.storylines?.hadNineGameTryout) {
             moveTitle = '📉 REASSIGNED TO JUNIORS';
             moveDesc = `For the second consecutive year, you couldn't secure a permanent NHL roster spot out of training camp. You spent the season developing with your junior club to finish out your amateur eligibility.`;
         } else {
             moveTitle = '📉 9-GAME TRYOUT CONCLUDED';
             moveDesc = `You started the year in the NHL, but after your 9-game tryout, the front office decided you needed more physical development. You spent the remainder of the season playing top-line minutes in juniors.`;
             // Flag that they've experienced their rookie tryout
             ctx.setPlayer(p => ({ ...p, storylines: { ...(p.storylines || {}), hadNineGameTryout: true } }));
         }
     } else if (wasNHLtoAHL) {
         moveTitle = '📉 REASSIGNED TO AHL';
         moveDesc = `The GM called you into his office. You've been reassigned to the AHL affiliate. "Head down, work on your game, and you'll be back," he said.`;
     } else if (wasAHLtoECHL) {
         moveTitle = '📉 SENT TO THE COAST';
         moveDesc = `You've been reassigned to the ECHL. It's a tough demotion, but you need to find your game again if you want to make it back up.`;
     } else if (wasAHLtoNHL) {
         const isFirst = !(player.seasonHistory || []).some(s => s.league === 'NHL');
         moveTitle = isFirst ? '🚨 WELCOME TO THE SHOW!' : '📈 CALLED UP';
         moveDesc = isFirst 
             ? `The coach pulled you aside after practice with a smile. "Pack your bags. You've been called up." You're making your NHL debut!`
             : `You've been recalled to the NHL roster! Time to prove you belong and stay up for good.`;
     } else if (wasECHLtoAHL) {
         moveTitle = '📈 PROMOTED TO AHL';
         moveDesc = `Your hard work on the Coast has paid off. You've been promoted to the AHL roster!`;
     } else if (wasJuniorToPro) {
         moveTitle = '🚨 TURNING PRO';
         moveDesc = `Your amateur career is officially over. You are officially joining the pro roster! It's time to show the veterans what you're made of.`;
     }

     if (moveTitle) {
         ctx.setActiveEvent({
             title: moveTitle,
             desc: moveDesc,
             choices: [{ 
                 label: 'Acknowledge', 
                 effect: { idol: 0, ovr: 0 }, 
                 action: isAllStar ? 'ROUTE_ALL_STAR' : 'ROUTE_TRADE_DEADLINE' 
             }],
             madePlayoffs: false
         });
         ctx.setScreen('event');
         return;
     }

     if (isAllStar) {
         setScreen('all-star');
     } else {
         setScreen('trade-deadline');
     }
  }
}