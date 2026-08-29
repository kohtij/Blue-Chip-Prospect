import { capIdol, recomputeOvr, applyOvrDelta } from '../utils/gameHelpers';
import { getRole } from '../utils/appHelpers';
import { getOpponentPool } from '../data/teams';

export function handleEventChoice(ctx, choice) {
  const { 
    player, setPlayer, setSeasonEvents, setScreen, 
    activeEvent, minigameContext, proceedToNextScreen,
    unlockAchievement, triggerMinigame, generateTraining, setActiveEvent 
  } = ctx;

  if (!activeEvent) return;

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

  setSeasonEvents(prev => [...prev, { feedback: outcomeFeedback, effect: outcomeEffect || {} }]);
  
  let updated = { ...player };
  const actionStr = choice.action || ''; 
  
  if (actionStr === 'VETERAN_EXTENSION') {
    updated.contract = { salary: 850000, years: 1 };
  } else if (actionStr === 'BECOME_UFA') {
    updated.rights = null;
  } else if (actionStr === 'JOIN_NCAA') {
    const teamId = choice.actionData?.id || choice.actionData;
    updated.team = teamId; updated.league = 'NCAA';
    updated.teamsPlayedFor = Array.from(new Set([...(updated.teamsPlayedFor || []), teamId]));
    if ((choice.perks || []).some(perk => perk.text && perk.text.includes('NIL'))) unlockAchievement('big_nil');
  } else if (actionStr === 'JOIN_CHL') {
    const teamId = choice.actionData?.id || choice.actionData?.teamObj?.id || choice.actionData;
    const lg = choice.actionData?.league || 'OHL';
    updated.team = teamId; updated.league = lg;
    updated.teamsPlayedFor = Array.from(new Set([...(updated.teamsPlayedFor || []), teamId]));
    unlockAchievement('import_draft');
  } else if (actionStr === 'SIGN_ELC') {
    updated.team = player.rights; updated.league = 'NHL';
    updated.contract = { salary: 925000, years: 3, role: getRole(925000, player) };
  } else if (actionStr === 'DEMOTE') {
    updated.team = choice.actionData.team; updated.league = choice.actionData.lg;
  } else if (actionStr === 'ACCEPT_TRADE_DEADLINE') {
    const teamId = choice.actionData?.teamObj?.id || choice.actionData?.team?.id || choice.actionData;
    updated.team = teamId;
    updated.league = choice.actionData?.lg || player.league;
    updated.teamsPlayedFor = Array.from(new Set([...(updated.teamsPlayedFor || []), teamId]));
    
    if (updated.seasonHistory && updated.seasonHistory.length > 0) {
       const currentSeason = updated.seasonHistory[updated.seasonHistory.length - 1];
       currentSeason.tradedTo = teamId;
       currentSeason.gamesWithOriginal = Math.floor(currentSeason.games * 0.75);
       currentSeason.gamesWithNew = currentSeason.games - currentSeason.gamesWithOriginal;
    }
  } else if (actionStr === 'TRADE_HOLDOUT') {
    if (outcomeEffect === choice.successEffect) {
        const pool = (getOpponentPool('NHL') || []).filter(t => t.id !== player.team);
        const destTeam = pool[Math.floor(Math.random() * pool.length)]?.id || 'UNK';
        updated.team = destTeam;
        updated.teamsPlayedFor = Array.from(new Set([...(updated.teamsPlayedFor || []), destTeam]));
    }
  } else if (actionStr === 'CHANGE_POSITION') {
    updated.pos = choice.actionData;
  } else if (actionStr === 'CHANGE_LEAGUE') {
    updated.league = choice.actionData;
    if (choice.actionData === 'NHL' && (!updated.contract || updated.contract.salary < 750000)) {
      updated.contract = { salary: 750000, years: 1, role: 'Depth' };
    }
  } else if (actionStr === 'MAKE_CAPTAIN') {
    updated.isCaptain = true;
  } else if (actionStr === 'TEAM_MEETING') {
    updated.storylines = { ...(updated.storylines || {}), lastMeetingYear: ctx.currentYear };
  } else if (actionStr === 'ACCEPT_IMPORT_DRAFT') {
    const teamId = choice.actionData?.id || choice.actionData?.teamObj?.id || choice.actionData?.team || 'UNK';
    const lg = choice.actionData?.league || 'OHL';
    updated.team = teamId; updated.league = lg;
    updated.teamsPlayedFor = Array.from(new Set([...(updated.teamsPlayedFor || []), teamId]));
    updated.chlRights = teamId; updated.chlRightsLeague = lg;
    unlockAchievement('import_draft');
  } else if (actionStr === 'DECLINE_IMPORT_DRAFT') {
    const teamId = choice.actionData?.id || choice.actionData?.teamObj?.id || choice.actionData?.team || 'UNK';
    const lg = choice.actionData?.league || 'OHL';
    updated.chlRights = teamId; updated.chlRightsLeague = lg;
  } else if (actionStr === 'DEMOTE_TO_JUNIORS') {
    const targetJuniorTeam = player.chlRights || player.juniorTeam || 'UNK';
    const targetJuniorLeague = player.chlRightsLeague || player.juniorLeague || 'OHL';
    updated.team = targetJuniorTeam; updated.league = targetJuniorLeague;
    updated.teamsPlayedFor = Array.from(new Set([...(updated.teamsPlayedFor || []), targetJuniorTeam]));
  } else if (actionStr === 'ACCEPT_ARBITRATION') {
    updated.team = choice.actionData.team; updated.league = 'NHL';
    updated.contract = { salary: choice.actionData.salary, years: choice.actionData.years, role: choice.actionData.role };
    updated.teamsPlayedFor = Array.from(new Set([...(updated.teamsPlayedFor || []), choice.actionData.team]));
  } else if (actionStr === 'INTL_RISKY') {
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

  if (finalPlayer.team !== player.team) {
     let baseTrust = 50;
     let mediaTrust = 50;

     if (ctx.seasonRecap?.wasWaived || actionStr.includes('DEMOTE')) {
         baseTrust = 40; 
         mediaTrust = 45; 
     } 
     else if (ctx.hasDemandedTrade || actionStr === 'TRADE_HOLDOUT') {
         baseTrust = 35; 
         mediaTrust = 70; 
     } 
     else if (finalPlayer.idolatry >= 800) {
         baseTrust = 75; 
         mediaTrust = 80;
     } 
     else if (finalPlayer.idolatry >= 400) {
         baseTrust = 60; 
         mediaTrust = 65;
     }
     finalPlayer.relationships = { coach: baseTrust, teammates: baseTrust, media: mediaTrust };
  }
  
  setPlayer(finalPlayer);

  if (actionStr.includes('MINIGAME')) {
      triggerMinigame(minigameContext || 'season', choice.actionData);
  } else if (['JOIN_CHL', 'ACCEPT_IMPORT_DRAFT', 'DECLINE_IMPORT_DRAFT', 'JOIN_NCAA'].includes(actionStr)) {
      setActiveEvent(null);
      setScreen('preseason');
      if (generateTraining) generateTraining(finalPlayer.pos);
  } else if (actionStr === 'ROUTE_ALL_STAR') {
      setActiveEvent(null);
      setScreen('all-star');
  } else if (actionStr === 'ROUTE_TRADE_DEADLINE') {
      setActiveEvent(null);
      setScreen('trade-deadline');
  } else {
      setActiveEvent(null);
      proceedToNextScreen(activeEvent, minigameContext, finalPlayer);
  }
}