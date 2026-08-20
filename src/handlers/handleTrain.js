import { simulateSeason } from '../utils/gameHelpers';
import { runPostSeasonFlow } from './runPostSeasonFlow';

export function handleTrain(ctx, t) {
  const { 
    player, setHasDemandedTrade, setPendingSeasonResult, 
    setPlayer, setScreen, setSeasonEvents, setSeasonRecap, setStatChanges, unlockAchievement 
  } = ctx;

  setHasDemandedTrade(false);
  setSeasonEvents([]);

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
      titleWon: false 
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
     
     if (isAllStar) {
         setScreen('all-star');
     } else {
         setScreen('trade-deadline');
     }
  }
}