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

  // 3. Commit State
  setPlayer(updatedPlayer);
  setStatChanges(statChanges);
  setTimeout(() => setStatChanges(null), 3000);

  // 4. Route to the correct screen
  let isWaiverClaim = recap.waiverEvent === 'CLAIMED';

  if (isDemoted || isWaiverClaim || recap.waiverEvent === '9_GAME_RULE' || recap.waiverEvent === 'DEVELOPMENT') {
     unlockAchievement('demoted');
     setSeasonRecap({ ...recap, wasDemotedTo: currentLg, wasWaived: isWaiverClaim });
  } else {
     // Normal season recap
     setSeasonRecap(recap);
  }

  // FORCE ROUTING TO THE NEXT SCREEN (This was missing!)
  if (currentLg === 'NCAA') {
     runPostSeasonFlow(ctx, updatedPlayer.age, updatedPlayer.ovr, currentLg, currentTeam, result.madePlayoffs, 2026 + (updatedPlayer.stats?.seasonsPlayed || 0), recap?.standings || 16);
  } else {
     setPendingSeasonResult(result);
     setScreen('trade-deadline');
  }
}