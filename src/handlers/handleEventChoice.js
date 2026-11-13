import { capFanStatus, fanGain, recomputeOvr, applyOvrDelta } from '../utils/gameHelpers';
import { getFullTeamName, getRole } from '../utils/appHelpers';
import { getOpponentPool, JUNIOR_PARENT_LEAGUE } from '../data/teams';

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

  // The recap used to list the outcome text alone, so a line reading "You kept
  // your dignity." arrived with nothing to say which of the season's dozen
  // events it belonged to. The event's own title is the context, and it is
  // right here, so it travels with the line.
  setSeasonEvents(prev => [...prev, {
    title: activeEvent?.title || null,
    feedback: outcomeFeedback,
    effect: outcomeEffect || {},
    perks: choice.perks || [],
    flaws: choice.flaws || []
  }]);
  
  let updated = { ...player };
  const actionStr = choice.action || ''; 
  
  if (actionStr === 'SIGN_EXTENSION') {
    if (choice.actionData) {
      updated.contract = {
        salary: choice.actionData.salary,
        years: choice.actionData.years + 1, // +1 because the current year is still running
        role: choice.actionData.role,
        nmc: true // Mid-season extensions for core players usually carry an NMC
      };
    }
  } else if (actionStr === 'DECLINE_EXTENSION') {
    updated.storylines = { ...(updated.storylines || {}), declinedExtension: true };
  } else if (actionStr === 'VETERAN_EXTENSION') {
    updated.contract = { salary: 850000, years: 1 };
  } else if (actionStr === 'SIGN_TWILIGHT_EUROPE') {
    // No club is chosen here any more. This used to roll one of two leagues and
    // one of its teams and simply tell you where you had signed, taking the
    // last decision of a career out of your hands. The deal is torn up instead,
    // and the European market opens below so you pick the place yourself.
    updated.contract = null;
  } else if (actionStr === 'SIGN_TWILIGHT_AHL') {
    let pool = getOpponentPool('AHL') || [];
    if (pool.length === 0) pool = [{ id: 'UNK', name: 'Unknown Team' }];
    const destTeam = pool[Math.floor(Math.random() * pool.length)]?.id || 'UNK';
    
    updated.team = destTeam;
    updated.league = 'AHL';
    updated.teamsPlayedFor = Array.from(new Set([...(updated.teamsPlayedFor || []), destTeam]));
    updated.contract = { salary: 150000, years: 1, role: 'Veteran Mentor' };
  } else if (actionStr === 'BECOME_UFA') {
    // Who just let him go. Free agency reads this so the club that declined to
    // sign him is not on the list of clubs offering him a contract days later.
    const heldBy = player.rights || player.draftTeam || null;
    updated.rights = null;
    if (heldBy && activeEvent?.title === 'RIGHTS EXPIRED') updated.rightsLapsedBy = heldBy;
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
  } else if (actionStr === 'NORDIC_STEP_UP') {
    // Up from the club's junior side to its men's team. A first professional
    // deal in Sweden or Finland is a modest one, and it is still a job.
    const seniorId = choice.actionData;
    updated.team = seniorId;
    updated.league = JUNIOR_PARENT_LEAGUE[player.league] || 'SHL';
    updated.contract = { salary: 120000, years: 2, role: getRole(120000, player) };
    updated.teamsPlayedFor = Array.from(new Set([...(updated.teamsPlayedFor || []), seniorId]));
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
        
        // The new club's place in the table, which the rest of the season
        // starts from. An AHL assignment is quoted with the parent club's
        // place, which says nothing about the farm team, so it is left out.
        const destStanding = choice.actionData?.teamStandings;
        if (updated.season && typeof destStanding === 'number' && updated.league !== 'AHL') {
           updated.season = { ...updated.season, anchor: { team: teamId, standing: destStanding } };
        }
        if (updated.seasonHistory && updated.seasonHistory.length > 0) {
           const currentSeason = updated.seasonHistory[updated.seasonHistory.length - 1];
           currentSeason.tradedTo = teamId;
           currentSeason.gamesWithOriginal = Math.floor(currentSeason.games * 0.75);
           currentSeason.gamesWithNew = currentSeason.games - currentSeason.gamesWithOriginal;
        }
  } else if (actionStr === 'TRADE_REQUEST_ACCEPTED') {
        // A summer trade. The same move as the deadline one without the part
        // that splits the season in two: the year is already filed and he
        // played all of it where he played it.
        const offTeamId = choice.actionData?.teamObj?.id || choice.actionData?.team?.id || choice.actionData;
        updated.team = offTeamId;
        updated.league = choice.actionData?.lg || 'NHL';
        updated.teamsPlayedFor = Array.from(new Set([...(updated.teamsPlayedFor || []), offTeamId]));
  } else if (actionStr === 'RESOLVE_HOLDOUT') {
    const wonHoldout = choice.actionData?.success ? (outcomeEffect === choice.successEffect) : false;
    if (wonHoldout) {
        // The massive salary they demanded was already stored in contract.salary by generateOffers
        updated.contract = { ...updated.contract, role: 'Core Player', nmc: true };
    } else {
        // Cave and take the QO (roughly 75% of their massive demand, 1 year, no protection)
        updated.contract = { salary: Math.max(850000, Math.floor((updated.contract.salary * 0.75) / 25000) * 25000), years: 1, role: 'Two-Way Deal', nmc: false };
    }
 } else if (actionStr === 'RESOLVE_NINE_GAME') {
    // The club has made its call. If he is going back, move him to the junior club
    // that holds his rights. The contract year is then protected by the ELC slide
    // in the offseason, which keys off finishing the season in junior.
    const t9 = player.trial;
    if (t9 && !t9.verdict?.stays) {
      updated.team = t9.juniorTeam;
      updated.league = t9.juniorLeague;
      updated.teamsPlayedFor = Array.from(new Set([...(updated.teamsPlayedFor || []), t9.juniorTeam]));
    }
  } else if (actionStr === 'RESOLVE_DEBUT') {
    // Nothing to change on the player beyond the choice's own effect. The game
    // itself is already banked on player.debut and handleTrain resumes from it.
  } else if (actionStr === 'CHANGE_POSITION') {
    updated.pos = choice.actionData;
  } else if (actionStr === 'CHANGE_LEAGUE') {
    updated.league = choice.actionData;
    if (choice.actionData === 'NHL' && (!updated.contract || updated.contract.salary < 750000)) {
      updated.contract = { salary: 750000, years: 1, role: 'Depth' };
    }
  } else if (actionStr === 'MAKE_CAPTAIN') {
    updated.isCaptain = true;
    updated.isAlternate = false;
  } else if (actionStr === 'MAKE_ALTERNATE') {
    updated.isAlternate = true;
    updated.isCaptain = false;
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
    
    // Generate the 9-game NHL stint to officially add to history
    const isG = player.pos === 'G';
    const sGames = isG ? (Math.floor(Math.random() * 3) + 2) : 9; // Goalies usually back up and start 2-4 games
    
    let sG = 0, sA = 0, sSaves = 0, sShots = 0, sShutouts = 0, sPM = 0;
    
    if (isG) {
        sShots = sGames * (25 + Math.floor(Math.random() * 10));
        sSaves = Math.floor(sShots * (0.880 + (Math.random() * 0.040)));
    } else {
        sG = Math.floor(Math.random() * 3); // 0-2 goals
        sA = Math.floor(Math.random() * 4); // 0-3 assists
        sPM = Math.floor(Math.random() * 7) - 3; // -3 to +3
    }
    
    const nhlStint = {
        year: ctx.currentYear,
        team: player.team,
        league: player.league,
        games: sGames,
        goals: sG,
        assists: sA,
        points: sG + sA,
        plusMinus: sPM,
        saves: sSaves,
        shots: sShots,
        shutouts: sShutouts,
        awards: []
    };

    // Log the stint in career history
    updated.seasonHistory = [...(updated.seasonHistory || []), nhlStint];
    
    // Add to career totals so they instantly show on the Dashboard
    updated.stats = {
        ...updated.stats,
        games: (updated.stats?.games || 0) + sGames,
        goals: (updated.stats?.goals || 0) + sG,
        assists: (updated.stats?.assists || 0) + sA,
        saves: (updated.stats?.saves || 0) + sSaves,
        shots: (updated.stats?.shots || 0) + sShots,
        shutouts: (updated.stats?.shutouts || 0) + sShutouts
    };

    updated.team = targetJuniorTeam; 
    updated.league = targetJuniorLeague;
    updated.teamsPlayedFor = Array.from(new Set([...(updated.teamsPlayedFor || []), targetJuniorTeam]));
  } else if (actionStr === 'ACCEPT_ARBITRATION') {
    updated.team = choice.actionData.team; updated.league = 'NHL';
    updated.contract = { salary: choice.actionData.salary, years: choice.actionData.years, role: choice.actionData.role };
    updated.teamsPlayedFor = Array.from(new Set([...(updated.teamsPlayedFor || []), choice.actionData.team]));
  } else if (actionStr === 'RESOLVE_DOUBLE_DOWN') {
    const isSuccess = outcomeEffect === choice.successEffect;
    if (isSuccess) {
        // You won the power struggle. You are untouchable.
        updated.isAlternate = true; 
    } else {
        // You lost. BANISHMENT.
        if (player.league === 'NHL') {
            // NHL players get buried in the minors (AHL)
            const nhlPool = getOpponentPool('NHL') || [];
            const currentTeamObj = nhlPool.find(t => t.id === player.team);
            const ahlTeamId = currentTeamObj ? currentTeamObj.ahlId : 'UNK';
            updated.team = ahlTeamId;
            updated.league = 'AHL';
            updated.teamsPlayedFor = Array.from(new Set([...(updated.teamsPlayedFor || []), ahlTeamId]));
        } else {
            // Junior/Euro players just get spite-traded to a random team
            const pool = (getOpponentPool(player.league) || []).filter(t => t.id !== player.team);
            const destTeam = pool[Math.floor(Math.random() * pool.length)]?.id || 'UNK';
            updated.team = destTeam;
            updated.teamsPlayedFor = Array.from(new Set([...(updated.teamsPlayedFor || []), destTeam]));
        }
    }
  } else if (actionStr === 'INTL_RISKY') {
     triggerMinigame(ctx.minigameContext || 'wjc');
     return;
  }

  // --- CHANGING CLUBS --------------------------------------------------
  // A letter belongs to the room that gave it, and the people who bought your
  // sweater do not come with you. None of the paths above did any of this, so
  // a deadline trade carried an A across the league and the fanbase never
  // noticed you had gone. The club that gave the letter has also not asked
  // this player anything, so the "already asked" flag resets with it.
  if (updated.team !== player.team) {
    updated.isCaptain = false;
    updated.isAlternate = false;
    updated.storylines = { ...(updated.storylines || {}), alternateGiven: false, lockerRoom: 0 };

    // Being traded costs you standing with the people who followed you here,
    // whether the club moved you or you asked to be moved. It scales with how
    // much you had: a fringe player barely registers, a franchise face leaving
    // is the story of the week.
    // A college transfer is not a trade: the portal choice already carries its
    // own smaller cost, and charging the trade penalty on top doubled it.
    const TRADES = ['ACCEPT_TRADE_DEADLINE', 'TRADE_REQUEST_ACCEPTED'];
    if (TRADES.includes(actionStr) && !choice.actionData?.transfer) {
      const standing = updated.fanStatus || 0;
      updated.fanStatus = capFanStatus(standing - Math.round(Math.min(70, Math.max(12, standing * 0.12))));
    }
  }

  const withOvr = applyOvrDelta(updated, outcomeEffect?.ovr || 0);
  const finalPlayer = {
    ...withOvr,
    fanStatus: fanGain(withOvr.fanStatus, outcomeEffect?.fanStatus || 0),
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
     else if (finalPlayer.fanStatus >= 800) {
         baseTrust = 75; 
         mediaTrust = 80;
     } 
     else if (finalPlayer.fanStatus >= 400) {
         baseTrust = 60; 
         mediaTrust = 65;
     }
     finalPlayer.relationships = { coach: baseTrust, teammates: baseTrust, media: mediaTrust };
  }
  
  setPlayer(finalPlayer);

  if (actionStr.includes('MINIGAME')) {
      triggerMinigame(minigameContext || 'season', choice.actionData);
  } else if (actionStr === 'SIGN_TWILIGHT_EUROPE') {
      // This used to be guarded on ctx.generateOffers being present, and it was
      // not: the wrapper existed in App but had never been added to ctx. The
      // guard failed silently, the choice fell through to the ordinary end of
      // summer, and the player was left at his old club with his contract torn
      // up and no market. If the market ever cannot be opened from here, hand
      // the event on with the flag that routes it through the same market
      // rather than dropping it.
      setActiveEvent(null);
      if (ctx.generateOffers) {
        ctx.generateOffers(false, finalPlayer.team, null, { europeOnly: true });
      } else {
        proceedToNextScreen({ ...activeEvent, euroMarket: true }, minigameContext, finalPlayer);
      }
  } else if (['JOIN_CHL', 'ACCEPT_IMPORT_DRAFT', 'DECLINE_IMPORT_DRAFT', 'JOIN_NCAA'].includes(actionStr)) {
      // Same trap as the draft: these are summer beats, so the card handed out
      // here has to be marked, or the offseason's own training beat offers a
      // second one once the rest of the summer has played out.
      setActiveEvent(null);
      if (finalPlayer.offseason) {
        setPlayer(p => ({ ...p, offseason: { ...p.offseason, trainingGiven: true } }));
      }
      setScreen('preseason');
      if (generateTraining) generateTraining(finalPlayer.pos, finalPlayer);
  } else if (actionStr === 'ROUTE_ALL_STAR') {
      setActiveEvent(null);
      setScreen('all-star');
  } else if (actionStr === 'ROUTE_SEASON_END') {
      // A milestone shown as the year finishes: the debut, the 500th or the
      // 1000th game. The All-Star break and the deadline are months behind by
      // now, so acknowledging it ends the season instead of routing back.
      setActiveEvent(null);
      if (ctx.finishSeason) ctx.finishSeason(finalPlayer);
      else setScreen('recap');
  } else if (actionStr === 'ROUTE_TRADE_DEADLINE') {
      setActiveEvent(null);
      setScreen('trade-deadline');
  } else if (actionStr === 'TRADE_HOLDOUT') {
      // Chain a resolution event instead of proceeding directly to the playoffs
      const isSuccess = outcomeEffect === choice.successEffect;
      
      // Determine if the player is pro to apply fines and pro-specific text
      const isPro = ['NHL', 'AHL', 'SHL', 'LIIGA'].includes(finalPlayer.league);
      const fineAmount = isPro ? -250000 : 0;
      
      if (isSuccess) {
          const pool = (getOpponentPool(finalPlayer.league) || []).filter(t => t.id !== player.team);
          const destTeamObj = pool[Math.floor(Math.random() * pool.length)] || { id: 'UNK' };
          
          const willMakePlayoffs = Math.random() > 0.5;
          const generatedStandings = willMakePlayoffs 
              ? Math.floor(Math.random() * 16) + 1  // Ranks 1-16
              : Math.floor(Math.random() * 16) + 17; // Ranks 17-32
          
          setActiveEvent({
              title: 'HOLDOUT RESOLVED: TRADED!',
              desc: `Your holdout worked. Management gave in and traded you.`,
              isTradeDeadlineEvent: activeEvent?.isTradeDeadlineEvent, // <-- Keeps the routing intact!
              choices: [
                  { 
                     label: 'Accept the Trade and pack your bags', 
                     action: 'ACCEPT_TRADE_DEADLINE', 
                     actionData: { teamObj: destTeamObj, lg: finalPlayer.league, madePlayoffs: willMakePlayoffs, teamStandings: generatedStandings, showTeamCard: true },
                     effect: { fanStatus: 10, ovr: 0, rel: { media: 10 } } 
                  }
              ]
          });
          setScreen('event');
      } else {
          setActiveEvent({
              title: 'HOLDOUT RESOLVED: STALEMATE',
              desc: `Management called your bluff. No one met their asking price, and the GM has demanded a face-to-face meeting. You are staying put.`,
              isTradeDeadlineEvent: activeEvent?.isTradeDeadlineEvent, // <-- Keeps the routing intact!
              choices: [
                  { label: 'Apologize and return to the team', effect: { fanStatus: -25, ovr: 0, money: 0, rel: { coach: -20, teammates: -15 } } },
                  { 
                     label: 'Double down and refuse to play', 
                     action: 'RESOLVE_DOUBLE_DOWN', 
                     isRisky: true, successChance: 0.3, 
                     successFeedback: isPro 
                         ? 'The owner stepped in and fired the GM. You won, and the room is yours now.' 
                         : 'Ownership sided with you. The GM backed off, and nobody in the organisation is going to cross you again.', 
                     successEffect: { fanStatus: 15, ovr: 0, rel: { coach: 20 } }, 
                     failFeedback: finalPlayer.league === 'NHL' 
                         ? 'You were suspended, waived, and banished to the AHL for conduct detrimental to the team.' 
                         : 'You were suspended indefinitely, then spite-traded to a new team for pennies on the dollar.', 
                     failEffect: { fanStatus: -40, ovr: -1, money: fineAmount, rel: { media: -30 } } 
                  }
              ]
          });
          setScreen('event');
      }
  } else if (actionStr === 'RESOLVE_DOUBLE_DOWN') {
      // The double down is a dice roll with big consequences, so show how the
      // standoff actually ended before moving on. Without this the result is
      // applied silently and the player is dropped straight into the playoffs.
      const wonStandoff = outcomeEffect === choice.successEffect;
      const destName = getFullTeamName(finalPlayer.team, finalPlayer.league);
      const hasDest = destName && destName !== 'UNK' && finalPlayer.team !== player.team;

      setActiveEvent({
          title: wonStandoff ? '✊ HOLDOUT WON' : '🚪 HOLDOUT LOST',
          desc: outcomeFeedback,
          isTradeDeadlineEvent: activeEvent?.isTradeDeadlineEvent,
          choices: [
              {
                  label: wonStandoff ? 'Get back on the ice' : 'Accept the fallout',
                  subLabel: wonStandoff
                      ? 'You kept your spot and the room is yours.'
                      : hasDest
                        ? `You report to ${destName}.`
                        : 'You report wherever they send you.',
                  effect: {}
              }
          ]
      });
      setScreen('event');
  } else {
      setActiveEvent(null);
      proceedToNextScreen(activeEvent, minigameContext, finalPlayer);
  }
}