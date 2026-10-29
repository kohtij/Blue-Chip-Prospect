import { simulateSeason, isNineGameCandidate, nineGameVerdict, madeAllStarGame } from '../utils/gameHelpers';
import { simulateTournament } from '../utils/international';
import { runPostSeasonFlow } from './runPostSeasonFlow';

export function handleTrain(ctx, t) {
  const {
    player, setHasDemandedTrade, setPendingSeasonResult,
    setPlayer, setSeasonRecap, setStatChanges, unlockAchievement
  } = ctx;

  setHasDemandedTrade(false);

  // NEW: Check if the player is currently nursing a nagging injury or suspension
  let gamesMissed = 0;
  if (player.storylines?.naggingInjury) gamesMissed += 15; // Missed 15 games
  if (player.storylines?.injury === 1) gamesMissed += 60; // Missed almost the whole season from the ACL tear!
  if (player.storylines?.suspended) gamesMissed += 5;

  // --- THE NINE-GAME TRIAL -----------------------------------------------
  // An eighteen or nineteen year old on an entry-level deal gets nine NHL games
  // before game ten burns the first year of that contract. This used to be a coin
  // flip taken at preseason, with the nine games invented afterwards out of random
  // numbers. Now he plays them for real and the club decides on what it saw. The
  // trial rides on the player so it survives the trip through the event screen,
  // and the rest of the season resumes from it.
  const trial = player.trial || null;
  // Read here as well as below: once the season is past the deadline the trial is
  // long settled, and without this the nine-game look would fire a second time.
  const alreadyMidSeason = !!player.season;

  if (!trial && !alreadyMidSeason && isNineGameCandidate(player)) {
    const seg = simulateSeason(player, t?.effect, 0,
      { forceGames: 9, lockPlacement: true, segmentOnly: true })?.segment;

    if (seg) {
      const isTop10Pick = (player.draftPick || 99) <= 10;
      const verdict = nineGameVerdict(player, seg, isTop10Pick);
      const juniorTeam = player.chlRights || player.juniorTeam || 'UNK';
      const juniorLeague = player.chlRightsLeague || player.juniorLeague || 'OHL';

      setPlayer(prev => ({ ...prev, trial: { segment: seg, verdict, training: t?.effect || {}, juniorTeam, juniorLeague } }));

      const line = player.pos === 'G'
        ? `a ${(seg.saves / Math.max(1, seg.shots)).toFixed(3).replace('0.', '.')} save percentage across ${seg.games} appearances`
        : `${seg.g} goal${seg.g === 1 ? '' : 's'} and ${seg.a} assist${seg.a === 1 ? '' : 's'} in ${seg.games} games`;

      ctx.setActiveEvent({
        title: verdict.stays ? '\u2705 THEY ARE KEEPING YOU' : '\ud83d\udce9 RETURNED TO JUNIOR',
        desc: verdict.stays
          ? `Nine games up, and you put together ${line}. Game ten burns the first year of your entry-level contract, and the club has decided you are worth it. You are staying in the NHL.`
          : `Nine games up, and you managed ${line}. Game ten would burn the first year of your entry-level contract, and the club is not ready to spend it. You are going back to junior, where that year on your deal stays untouched.`,
        choices: [{
          label: verdict.stays ? 'You belong here' : 'Go back and dominate',
          subLabel: verdict.stays
            ? 'The first year of the deal is gone. Now justify it.'
            : 'The contract slides. Go and make the decision look foolish.',
          isRisky: false,
          feedback: verdict.stays
            ? 'They burned the year on you. Now you have to be worth it.'
            : 'You cleaned out your stall and caught the bus back to junior.',
          effect: verdict.stays ? { fanStatus: 25, ovr: 0 } : { fanStatus: -5, ovr: 0 },
          action: 'RESOLVE_NINE_GAME'
        }],
        isNineGameEvent: true
      });
      ctx.setScreen('event');
      return;
    }
  }

  // --- THE SEASON IS CUT WHERE THE CALENDAR CUTS IT ----------------------
  // Four things happen inside a hockey season, not after it, and the whole year
  // used to be simulated first with all of them bolted onto the end.
  //   ~40%  World Juniors, late December, under-20, club releases you for a fortnight
  //   ~60%  the All-Star Game in late January, or the Olympics in February every
  //         fourth year, when there is no All-Star Game and the league pauses
  //   ~70%  the trade deadline, early March
  // The World Championship is the only one that really is a post-season event,
  // and it stays in runPostSeasonFlow where it belongs.
  //   stage 0 -> nothing played yet
  //   stage 1 -> played to the World Juniors
  //   stage 2 -> played to the break
  //   stage 3 -> played to the deadline
  const season = player.season || null;
  const stage = season ? season.stage : 0;
  const carried = season ? season.stints : (trial ? [trial.segment] : []);
  const carriedGames = carried.reduce((n, s) => n + (s.games || 0), 0);
  const effect = season ? season.training : (trial ? trial.training : t?.effect);
  const baseMissed = season ? season.gamesMissed : gamesMissed;
  const locked = !!(trial || season);

  const partialResult = (stints) => {
    const last = stints[stints.length - 1];
    const tot = stints.reduce((acc, s) => ({
      games: acc.games + (s.games || 0), g: acc.g + (s.g || 0), a: acc.a + (s.a || 0),
      saves: acc.saves + (s.saves || 0), shots: acc.shots + (s.shots || 0), sho: acc.sho + (s.sho || 0)
    }), { games: 0, g: 0, a: 0, saves: 0, shots: 0, sho: 0 });
    return {
      recap: { ...tot, standings: last.standings, madePlayoffs: last.standings <= 16, awards: [] },
      currentLg: last.league, currentTeam: last.team,
      madePlayoffs: last.standings <= 16, partial: true, stints
    };
  };

  const advanceTo = (stints, nextStage) => {
    setPlayer(prev => ({ ...prev, trial: null, season: { stints, training: effect || {}, gamesMissed: baseMissed, stage: nextStage } }));
    setPendingSeasonResult(partialResult(stints));
  };

  // Sends the player to a tournament and parks the season until he is back.
  const goToTournament = (stints, nextStage, context, isWJC, isOlympicYear) => {
    const sim = simulateTournament({
      player, natDiv: player.natDiv, pOvr: player.ovr,
      safeNationalities: ctx.safeNationalities, isWJC, isOlympicYear
    });
    advanceTo(stints, nextStage);
    setPlayer(prev => ({ ...prev, intlData: sim.intlData, intlStakes: sim.intlStakes, isOlympicYear }));
    if (ctx.setIntlResult) ctx.setIntlResult(null);
    ctx.setMinigameContext(context);
    ctx.setScreen('intl-minigame');
  };

  // setPlayer does not land inside this call, so the stints accumulate locally as
  // the stages fall through. Reading them back off the player would lose whatever
  // the previous stage just played.
  let stints = [...carried];
  let played = carriedGames;
  const playNext = (fraction) => {
    const seg = simulateSeason(player, effect, baseMissed + played, {
      gamesFraction: fraction, segmentOnly: true, ...(locked ? { lockPlacement: true } : {})
    })?.segment;
    if (seg && seg.games > 0) { stints = [...stints, seg]; played += seg.games; return seg; }
    return null;
  };

  if (stage === 0) {
    // Late December. An under-20 is released for the World Juniors, unless he is
    // a full-time NHL player, because NHL clubs do not let those go.
    const seg = playNext(0.40);
    if (seg && player.age <= 19 && seg.league !== 'NHL' && Math.random() > 0.4) {
      goToTournament(stints, 1, 'wjc', true, false);
      return;
    }
    // Not going, so the tournament passes him by and the season runs straight on.
  }

  if (stage <= 1) {
    // Late January, or February every fourth year. The Olympics replace the
    // All-Star Game entirely in those years, which is what the league does.
    const seg = playNext(0.333);
    if (seg) {
      const isOlympicYear = ctx.currentYear % 4 === 2;

      if (isOlympicYear) {
        const isTopDiv = (player.natDiv || '') === 'Top Division';
        const goes = player.age > 19 && player.ovr >= 78 && (isTopDiv ? Math.random() > 0.35 : Math.random() > 0.75);
        if (goes) { goToTournament(stints, 2, 'olympics', false, true); return; }
      } else if (madeAllStarGame(player, seg)) {
        advanceTo(stints, 2);
        ctx.setScreen('all-star');
        return;
      }
    }
  }

  if (stage <= 2) {
    // Early March. The deadline, and the last cut of the year.
    playNext(0.25);
    advanceTo(stints, 3);
    ctx.setScreen('trade-deadline');
    return;
  }


  // 1. Play out the rest of the year. Everything already played this season comes
  //    off the remainder and is carried into the final recap.
  const priorStints = carried;
  const playedGames = priorStints.reduce((n, s) => n + (s.games || 0), 0);
  const result = simulateSeason(
    player,
    effect,
    baseMissed + playedGames,
    // lockPlacement: the deadline has just settled where this player is for the
    // rest of the year, so the usual mid-season demotion roll does not overrule
    // it. It also keeps a kept prospect out of the AHL, which a CHL-eligible
    // teenager cannot play in.
    priorStints.length ? { priorStints, lockPlacement: true } : {}
  );
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
      // Where the year was actually played. A split season carries one entry per
      // club, so the recap can say nine games here and fifty there.
      stints: recap.stints,
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

  // The season is finished, so the trial is spent.
  setPlayer({ ...updatedPlayer, trial: null, season: null });
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
     // The All-Star GAME already happened, back at the break in January. The
     // All-Star TEAM in recap.awards is a post-season honour, reported in the
     // recap, not a reason to send the player to an exhibition played two months
     // ago. These were the same thing until now, and they are not the same thing.

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
                 { label: 'Keep it simple', subLabel: 'Stick to the fundamentals and avoid giving up a bad goal in your first start.', isRisky: false, feedback: 'You played a quiet, mistake-free game. The coach gave you an approving nod.', effect: { fanStatus: 15, ovr: 0, rel: { coach: 15 } }, action: 'ROUTE_SEASON_END' },
                 { label: 'Make a Statement', subLabel: 'Challenge shooters and go for a highlight-reel save, could backfire.', isRisky: true, successChance: 0.5, successFeedback: 'You stood tall in your NHL debut, stopping an early barrage of shots including a highlight-reel glove save. The crowd chanted your name.', successEffect: { fanStatus: 50, ovr: 1, rel: { teammates: 20 } }, failFeedback: 'You fought the puck early and let in a soft goal. Welcome to the NHL.', failEffect: { fanStatus: 0, ovr: -1, rel: { coach: -15 } }, action: 'ROUTE_SEASON_END' }
             ];
         } else {
             moveDesc = `You step onto the ice for your first official NHL shift. The lights are blinding, the crowd is roaring, and you line up across from players you grew up watching. The puck drops.`;
             moveChoices = [
                 { label: 'Play it Safe', subLabel: 'Keep your game simple and avoid a costly mistake in your first shift.', isRisky: false, feedback: 'You played a quiet, mistake-free game. The coach gave you an approving nod.', effect: { fanStatus: 15, ovr: 0, rel: { coach: 15 } }, action: 'ROUTE_SEASON_END' },
                 { label: 'Make a Statement', subLabel: 'Force the issue early for a highlight-reel moment, could backfire.', isRisky: true, successChance: 0.5, successFeedback: 'You laid out a veteran on your first shift and scored a point! The arena went wild.', successEffect: { fanStatus: 50, ovr: 1, rel: { teammates: 20 } }, failFeedback: 'You tried to do too much and got caught out of position for a goal against. Welcome to the NHL.', failEffect: { fanStatus: 0, ovr: -1, rel: { coach: -15 } }, action: 'ROUTE_SEASON_END' }
             ];
         }
     } else if (oldNhlGames < 1000 && newNhlGames >= 1000 && currentLg === 'NHL') {
         moveTitle = '🥈 THE SILVER STICK (1000 GAMES)';
         moveDesc = `Tonight is your 1000th career NHL game. The team holds a pre-game ceremony, presenting you with the traditional silver stick. The crowd gives you a standing ovation for your incredible longevity.`;
         moveChoices = [
             { label: 'Soak it in', subLabel: 'Take a moment to celebrate a career most players never reach.', isRisky: false, feedback: 'A beautiful, emotional night. You are a true ironman of the sport.', effect: { fanStatus: 150, ovr: 1, rel: { teammates: 30, coach: 20 } }, action: 'ROUTE_SEASON_END' }
         ];
     } else if (oldNhlGames < 500 && newNhlGames >= 500 && currentLg === 'NHL') {
         moveTitle = '💯 500 CAREER GAMES';
         moveDesc = `You've officially played 500 games in the NHL. You are no longer a kid; you are an established veteran in this league. The rookies are starting to look up to you.`;
         moveChoices = [
             { label: 'Acknowledge the Milestone', subLabel: 'A quiet nod to your growing status as a veteran in this league.', isRisky: false, feedback: 'You tipped your helmet to the crowd. Halfway to the Silver Stick.', effect: { fanStatus: 50, ovr: 0, rel: { teammates: 10 } }, action: 'ROUTE_SEASON_END' }
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
                 effect: { fanStatus: 0, ovr: 0 },
                 action: 'ROUTE_SEASON_END'
             }],
             madePlayoffs: false
         });
         ctx.setScreen('event');
         return;
     }

     {
         // The break and the deadline are both long past by now, so the end of the
         // year goes to the post-season rather than back to either of them.
         setSeasonRecap(recap);
         runPostSeasonFlow(ctx, updatedPlayer.age, updatedPlayer.ovr, currentLg, currentTeam, result.madePlayoffs, 2026 + (updatedPlayer.stats?.seasonsPlayed || 0), recap.standings || 16);
     }
  }
}