import { simulateSeason } from '../utils/gameHelpers';
import { runPostSeasonFlow } from './runPostSeasonFlow';

export function handleTrain(ctx, t) {
  const { 
    player, setHasDemandedTrade, setPendingSeasonResult, 
    setPlayer, setScreen, setSeasonRecap, setStatChanges, unlockAchievement 
  } = ctx;

  setHasDemandedTrade(false);

  // NEW: Check if the player is currently nursing a nagging injury or suspension
  let gamesMissed = 0;
  if (player.storylines?.naggingInjury) gamesMissed += 15; // Missed 15 games
  if (player.storylines?.injury === 1) gamesMissed += 60; // Missed almost the whole season from the ACL tear!
  if (player.storylines?.suspended) gamesMissed += 5; 

  // 1. Run the simulation
  const result = simulateSeason(player, t?.effect, gamesMissed);
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
      titleWon: false,
      avgToi: recap.avgToi,
      tradedTo: recap.tradedTo,
      gamesWithOriginal: recap.gamesWithOriginal,
      gamesWithNew: recap.gamesWithNew
  };
  
  updatedPlayer.seasonHistory = [...(player.seasonHistory || []), historyEntry];

  // Also clear nagging injury status so it doesn't carry over forever
  if (updatedPlayer.storylines?.naggingInjury || updatedPlayer.storylines?.suspended) {
      updatedPlayer.storylines = { 
          ...updatedPlayer.storylines, 
          naggingInjury: false,
          suspended: false
      };
  }

  setPlayer(updatedPlayer);
  setStatChanges(statChanges);
  setTimeout(() => setStatChanges(null), 3000);

  // 4. Route to the correct screen
  let isWaiverClaim = recap.waiverEvent === 'CLAIMED';
  let customWaiverEvent = recap.waiverEvent;

  if (recap.waiverEvent === '9_GAME_RULE' || (isDemoted && ['OHL', 'WHL', 'QMJHL'].includes(currentLg))) {
     const draftTeamName = player.draftTeam ? player.draftTeam : "The team that drafted you";
     customWaiverEvent = `${draftTeamName} felt you needed more time to develop physically. They have officially assigned you back to the CHL team that holds your junior rights.`;
  }

  if (isDemoted || isWaiverClaim || customWaiverEvent === 'DEVELOPMENT' || customWaiverEvent) {
     setSeasonRecap({ 
        ...recap, 
        wasDemotedTo: currentLg, 
        wasWaived: isWaiverClaim,
        waiverEvent: customWaiverEvent 
     });
  } else {
     setSeasonRecap(recap);
  }

  if (currentLg === 'NCAA') {
     runPostSeasonFlow(ctx, updatedPlayer.age, updatedPlayer.ovr, currentLg, currentTeam, result.madePlayoffs, 2026 + (updatedPlayer.stats?.seasonsPlayed || 0), recap?.standings || 16);
  } else {
     setPendingSeasonResult(result);
     
     // Winter Olympics fall on 2026, 2030, 2034 (year % 4 === 2)
     const isOlympicYear = ctx.currentYear % 4 === 2;
     const isAllStar = !isOlympicYear && recap.awards?.some(a => a.includes('All-Star') || a.includes('All-American'));
     
     const wasAHLtoNHL = player.league === 'AHL' && currentLg === 'NHL';
     const wasECHLtoAHL = player.league === 'ECHL' && currentLg === 'AHL';
     const wasJuniorToPro = ['OHL', 'WHL', 'QMJHL', 'NCAA'].includes(player.league) && ['NHL', 'AHL'].includes(currentLg);
     const wasNHLtoAHL = player.league === 'NHL' && currentLg === 'AHL';
     const wasAHLtoECHL = player.league === 'AHL' && currentLg === 'ECHL';
     const wasJuniorReturn = recap.waiverEvent === '9_GAME_RULE';

     // 🌟 MILESTONE INTERCEPTOR (NEW)
     const oldNhlGames = player.stats?.nhl?.games || 0;
     const newNhlGames = updatedPlayer.stats?.nhl?.games || 0;

     let moveTitle = null;
     let moveDesc = null;
     let moveChoices = null;

     if (oldNhlGames === 0 && newNhlGames > 0 && currentLg === 'NHL' && !wasAHLtoNHL && !isWaiverClaim) {
         moveTitle = '🏒 NHL DEBUT';
         if (player.pos === 'G') {
             moveDesc = `You step onto the ice for your first official NHL start. The lights are blinding, the crowd is roaring, and you stare down players you grew up watching. The puck drops.`;
             moveChoices = [
                 { label: 'Play it Safe (Keep it simple)', isRisky: false, feedback: 'You played a quiet, mistake-free game. The coach gave you an approving nod.', effect: { idol: 15, ovr: 0, rel: { coach: 15 } }, action: isAllStar ? 'ROUTE_ALL_STAR' : 'ROUTE_TRADE_DEADLINE' },
                 { label: 'Make a Statement', isRisky: true, successChance: 0.5, successFeedback: 'You stood tall in your NHL debut, stopping an early barrage of shots including a highlight-reel glove save. The crowd chanted your name.', successEffect: { idol: 50, ovr: 1, rel: { teammates: 20 } }, failFeedback: 'You fought the puck early and let in a soft goal. Welcome to the NHL.', failEffect: { idol: 0, ovr: -1, rel: { coach: -15 } }, action: isAllStar ? 'ROUTE_ALL_STAR' : 'ROUTE_TRADE_DEADLINE' }
             ];
         } else {
             moveDesc = `You step onto the ice for your first official NHL shift. The lights are blinding, the crowd is roaring, and you line up across from players you grew up watching. The puck drops.`;
             moveChoices = [
                 { label: 'Play it Safe (Keep it simple)', isRisky: false, feedback: 'You played a quiet, mistake-free game. The coach gave you an approving nod.', effect: { idol: 15, ovr: 0, rel: { coach: 15 } }, action: isAllStar ? 'ROUTE_ALL_STAR' : 'ROUTE_TRADE_DEADLINE' },
                 { label: 'Make a Statement', isRisky: true, successChance: 0.5, successFeedback: 'You laid out a veteran on your first shift and scored a point! The arena went wild.', successEffect: { idol: 50, ovr: 1, rel: { teammates: 20 } }, failFeedback: 'You tried to do too much and got caught out of position for a goal against. Welcome to the NHL.', failEffect: { idol: 0, ovr: -1, rel: { coach: -15 } }, action: isAllStar ? 'ROUTE_ALL_STAR' : 'ROUTE_TRADE_DEADLINE' }
             ];
         }
     } else if (oldNhlGames < 1000 && newNhlGames >= 1000 && currentLg === 'NHL') {
         moveTitle = '🥈 THE SILVER STICK (1000 GAMES)';
         moveDesc = `Tonight is your 1000th career NHL game. The team holds a pre-game ceremony, presenting you with the traditional silver stick. The crowd gives you a standing ovation for your incredible longevity.`;
         moveChoices = [
             { label: 'Soak it in', isRisky: false, feedback: 'A beautiful, emotional night. You are a true ironman of the sport.', effect: { idol: 150, ovr: 1, rel: { teammates: 30, coach: 20 } }, action: isAllStar ? 'ROUTE_ALL_STAR' : 'ROUTE_TRADE_DEADLINE' }
         ];
     } else if (oldNhlGames < 500 && newNhlGames >= 500 && currentLg === 'NHL') {
         moveTitle = '💯 500 CAREER GAMES';
         moveDesc = `You've officially played 500 games in the NHL. You are no longer a kid; you are an established veteran in this league. The rookies are starting to look up to you.`;
         moveChoices = [
             { label: 'Acknowledge the Milestone', isRisky: false, feedback: 'You tipped your helmet to the crowd. Halfway to the Silver Stick.', effect: { idol: 50, ovr: 0, rel: { teammates: 10 } }, action: isAllStar ? 'ROUTE_ALL_STAR' : 'ROUTE_TRADE_DEADLINE' }
         ];
     } else if (isWaiverClaim) {
         moveTitle = '✈️ CLAIMED OFF WAIVERS';
         moveDesc = `You were placed on waivers and claimed by a new NHL organization. You are packing your bags immediately to join your new club.`;
     } else if (wasJuniorReturn) {
         if (player.storylines?.hadNineGameTryout) {
             moveTitle = '📉 REASSIGNED TO JUNIORS';
             moveDesc = `For the second consecutive year, you couldn't secure a permanent NHL roster spot out of training camp. You spent the season developing with your junior club to finish out your amateur eligibility.`;
         } else {
             moveTitle = '📉 9-GAME TRYOUT CONCLUDED';
             moveDesc = `You started the year in the NHL, but after your 9-game tryout, the front office decided you needed more physical development. You spent the remainder of the season playing top-line minutes in juniors.`;
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
             choices: moveChoices || [{ 
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