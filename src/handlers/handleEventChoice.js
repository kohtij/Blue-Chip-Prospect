import { capIdol, recomputeOvr, applyOvrDelta } from '../utils/gameHelpers';
import { getRole } from '../utils/appHelpers';

export function handleEventChoice(ctx, choice) {
  const {
    activeEvent, player, setEventFeedback, setPlayer, setScreen, setSeasonEvents, unlockAchievement, triggerMinigame
  } = ctx;

  let outcomeEffect;
  let outcomeFeedback;

  if (choice.isRisky) {
    const success = Math.random() < (choice.successChance || 0.5);
    outcomeEffect = success ? choice.successEffect : choice.failEffect;
    outcomeFeedback = success ? choice.successFeedback : choice.failFeedback;
    if (success && activeEvent?.title?.includes('RIVALRY NIGHT')) unlockAchievement('rival_slayer');
  } else {
    outcomeEffect = choice.effect;
    outcomeFeedback = choice.feedback;
  }

  if (choice.action === 'FORCE_RETIRE') {
    setScreen('retirement');
    return; 
  }

  // Silently log the event for the Season Recap
  setSeasonEvents(prev => [...prev, { feedback: outcomeFeedback, effect: outcomeEffect || {} }]);
  
  let updated = { ...player };
  
  if (choice.action === 'VETERAN_EXTENSION') updated.contract = { salary: 850000, years: 1 };
  else if (choice.action === 'BECOME_UFA') updated.rights = null;
  else if (choice.action === 'JOIN_NCAA') {
    updated.team = choice.actionData; updated.league = 'NCAA';
    updated.teamsPlayedFor = Array.from(new Set([...(updated.teamsPlayedFor || []), choice.actionData]));
    if ((choice.perks || []).some(perk => perk.text && perk.text.includes('NIL'))) unlockAchievement('big_nil');
  } else if (choice.action === 'JOIN_CHL') {
    updated.team = choice.actionData; updated.league = 'OHL';
    updated.teamsPlayedFor = Array.from(new Set([...(updated.teamsPlayedFor || []), choice.actionData]));
    unlockAchievement('import_draft');
  } else if (choice.action === 'SIGN_ELC') {
    updated.team = player.rights; updated.league = 'NHL';
    updated.contract = { salary: 925000, years: 3, role: getRole(925000, player) };
  } else if (choice.action === 'DEMOTE') {
    updated.team = choice.actionData.team; updated.league = choice.actionData.lg;
  } else if (choice.action === 'ACCEPT_TRADE_DEADLINE') {
    const { teamObj } = choice.actionData;
    updated.team = teamObj.id;
    updated.teamsPlayedFor = Array.from(new Set([...(updated.teamsPlayedFor || []), teamObj.id]));
    
    // Retroactively update the current season's history to reflect the trade!
    if (updated.seasonHistory && updated.seasonHistory.length > 0) {
       const currentSeason = updated.seasonHistory[updated.seasonHistory.length - 1];
       currentSeason.tradedTo = teamObj.id;
       // The Trade Deadline is roughly 75% through the season
       currentSeason.gamesWithOriginal = Math.floor(currentSeason.games * 0.75);
       currentSeason.gamesWithNew = currentSeason.games - currentSeason.gamesWithOriginal;
    }
  } else if (choice.action === 'CHANGE_POSITION') {
    updated.pos = choice.actionData;
  } else if (choice.action === 'ACCEPT_IMPORT_DRAFT') {
    const { teamObj, league } = choice.actionData;
    updated.team = teamObj.id; updated.league = league;
    updated.teamsPlayedFor = Array.from(new Set([...(updated.teamsPlayedFor || []), teamObj.id]));
    updated.chlRights = teamObj.id; updated.chlRightsLeague = league;
  } else if (choice.action === 'DECLINE_IMPORT_DRAFT') {
    const { teamObj, league } = choice.actionData;
    updated.chlRights = teamObj.id; updated.chlRightsLeague = league;
  } else if (choice.action === 'DEMOTE_TO_JUNIORS') {
    const targetJuniorTeam = player.chlRights || player.juniorTeam || 'UNK';
    const targetJuniorLeague = player.chlRightsLeague || player.juniorLeague || 'OHL';
    updated.team = targetJuniorTeam; updated.league = targetJuniorLeague;
    updated.teamsPlayedFor = Array.from(new Set([...(updated.teamsPlayedFor || []), targetJuniorTeam]));
  } else if (choice.action === 'ACCEPT_ARBITRATION') {
    updated.team = choice.actionData.team; updated.league = 'NHL';
    updated.contract = { salary: choice.actionData.salary, years: choice.actionData.years, role: choice.actionData.role };
    updated.teamsPlayedFor = Array.from(new Set([...(updated.teamsPlayedFor || []), choice.actionData.team]));
  } else if (choice.action === 'INTL_SAFE') {
     // Safe approach just processes the standard outcome and ends the event.
  } else if (choice.action === 'INTL_RISKY') {
     // Risky approach means the player wants to play the interactive minigame!
     triggerMinigame(ctx.minigameContext || 'wjc');
     return;
  }

  const withOvr = applyOvrDelta(updated, outcomeEffect?.ovr || 0);
  const finalPlayer = {
    ...withOvr,
    idolatry: capIdol(withOvr.idolatry + (outcomeEffect?.idol || 0)),
    ovr: recomputeOvr(withOvr),
    stats: { ...withOvr.stats, earnings: (withOvr.stats?.earnings || 0) + (outcomeEffect?.money || 0) },
    relationships: {
      coach: Math.min(100, Math.max(0, (withOvr.relationships?.coach || 50) + (outcomeEffect?.rel?.coach || 0))),
      teammates: Math.min(100, Math.max(0, (withOvr.relationships?.teammates || 50) + (outcomeEffect?.rel?.teammates || 0))),
      media: Math.min(100, Math.max(0, (withOvr.relationships?.media || 50) + (outcomeEffect?.rel?.media || 0)))
    }
  };
  
  // Commit the fully built state
  setPlayer(finalPlayer);

  // CRITICAL FIX: Do NOT clear activeEvent here. EventResultScreen needs it 
  // to route correctly. proceedToNextScreen will clear it later.
  setEventFeedback(outcomeFeedback || "You made your decision.");
  setScreen('event-result');
}