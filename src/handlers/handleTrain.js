import { simulateSeason, isNineGameCandidate, nineGameVerdict, madeAllStarGame, ordinal, summariseStints, withTeamArticle } from '../utils/gameHelpers';
import { resolveNatDivision } from '../utils/international';
import { buildRun } from '../utils/intlRun';
import { getFullTeamName } from '../utils/appHelpers';
import { getOpponentPool } from '../data/teams';
import { runPostSeasonFlow } from './runPostSeasonFlow';

// --- THE LEADERSHIP GROUP, MID-SEASON ---------------------------------------
// Camp, in advanceToOffseason, is the normal way a letter gets handed out, and
// it asks the player to have finished last season in this room. That is the
// right bar for September, but it means a deadline pickup, a waiver claim or a
// July signing sits a full extra year before anybody will even discuss it, no
// matter how he plays.
//
// By late December he has thirty-odd games in this building, which is the only
// thing camp was really waiting for, and two things can put a letter in play:
// he arrived since last season and the room has now made its mind up about
// him, or the year is getting away from the club and the coach starts
// rearranging who he leans on. Either way he has to be the one playing well:
// handing an A to a passenger on a bad team is not a shake-up.
//
// Returns the event to show, or null when nothing happens, which is most years.
export function midSeasonLetter(player, seg) {
  if (!seg || player.league !== 'NHL') return null;
  if (player.isCaptain || player.isAlternate || player.storylines?.alternateGiven) return null;

  const trust = player.relationships?.coach || 50;
  const proSeasons = player.stats?.seasonsPlayed || 0;
  if (proSeasons < 3 || trust < 65 || player.ovr < 80) return null;
  // Thirty games of a sixty-five game stretch is the room seeing him play. A
  // player who has been hurt since October has not been in it.
  if ((seg.games || 0) < 20) return null;

  const hist = player.seasonHistory || [];
  const lastSeason = hist[hist.length - 1];
  const newArrival = !!lastSeason && lastSeason.team !== player.team;
  // Bottom third of the league, in December, with nothing to point at.
  const strugglingClub = (seg.standings || 16) >= 22;
  if (!newArrival && !strugglingClub) return null;

  // His own half of it. The club is not handing a letter to someone having a
  // bad year, whatever the standings say.
  if ((seg.rating || 0) < 7.0) return null;

  const odds = trust >= 80 ? 0.35 : trust >= 70 ? 0.22 : 0.12;
  if (Math.random() >= odds) return null;

  const clubName = withTeamArticle(getFullTeamName(player.team, player.league), player.league, true);
  const desc = newArrival
    ? `You were not here last season, so nobody handed you anything in September. Thirty games later the room has made its mind up about you anyway. The coach caught you walking off after the morning skate: there is an "A" going spare and he would like it on your sweater for the rest of the year.`
    : `The year is getting away from this team. ${clubName} sit ${ordinal(seg.standings)} coming out of December, and the coach has started rearranging the furniture, beginning with who he leans on. He wants a letter on the sweater of someone who has actually been playing, and in this room right now that is you.`;

  return {
    title: '🅰️ THE LEADERSHIP GROUP',
    desc,
    choices: [
      {
        label: 'Accept the responsibility',
        subLabel: newArrival
          ? 'Wear the letter for the rest of the season and make the room yours.'
          : 'Take the letter with the club in trouble, and own whatever comes next.',
        isRisky: false,
        feedback: 'You are an alternate captain. The letter goes on the sweater for the rest of the season.',
        effect: { fanStatus: 20, ovr: 1, rel: { coach: 12, teammates: 12 } },
        action: 'MAKE_ALTERNATE'
      },
      {
        label: 'Tell him to give it to someone else',
        subLabel: 'Not in the middle of a season, and not over the heads of the people already here.',
        isRisky: false,
        feedback: 'You turned the letter down mid-season and told him to give it to someone who has been here longer. The room noticed that too.',
        effect: { fanStatus: 8, ovr: 0, rel: { teammates: 18 } }
      }
    ],
    isMidSeasonEvent: true
  };
}

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
      // Where he goes back to. The rights fields are not always set on a
      // career that reached the NHL by another route, and the fallback used to
      // be the literal string UNK, which is what the dashboard then displayed
      // as his club for the rest of the season. The last junior season he
      // actually played is the honest answer, and a real club from that league
      // is a better last resort than nothing.
      const lastJunior = [...(player.seasonHistory || [])].reverse()
        .find(s => ['OHL', 'WHL', 'QMJHL'].includes(s.league));
      const juniorLeague = player.chlRightsLeague || player.juniorLeague || lastJunior?.league || 'OHL';
      const fallbackClub = (getOpponentPool(juniorLeague) || [])[0]?.id;
      const juniorTeam = player.chlRights || player.juniorTeam || lastJunior?.team || fallbackClub || 'OHL';

      // Spent the moment it fires, not when it resolves: going back to junior
      // still used the look up, and this is the flag that keeps it from coming
      // round again next season.
      setPlayer(prev => ({
        ...prev,
        nineGameUsed: true,
        trial: { segment: seg, verdict, training: t?.effect || {}, juniorTeam, juniorLeague }
      }));

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

  // --- THE FIRST NHL GAME -------------------------------------------------
  // This used to be reported by watching the career games counter cross zero,
  // which only happens once a whole season of stats has been written. The
  // result was a screen reading "the puck drops on your first NHL shift" handed
  // to a player whose dashboard already showed seventy-eight games. It is not a
  // milestone you can detect after the fact; it has to be played.
  //
  // So it works the way the nine-game trial does: one game is simulated, the
  // moment is shown, and the rest of the season resumes from it with that game
  // already in the bank.
  const debut = player.debut || null;
  if (!debut && !trial && !alreadyMidSeason
      && player.league === 'NHL' && (player.stats?.nhl?.games || 0) === 0) {
    const seg = simulateSeason(player, t?.effect, 0,
      { forceGames: 1, lockPlacement: true, segmentOnly: true })?.segment;

    if (seg) {
      setPlayer(prev => ({ ...prev, debut: { segment: seg, training: t?.effect || {} } }));

      const isG = player.pos === 'G';
      ctx.setActiveEvent({
        title: '\ud83c\udfd2 NHL DEBUT',
        desc: isG
          ? `Warm-ups are over. You scrape your crease, the anthem finishes, and you are about to take your first official start in the National Hockey League. The puck drops.`
          : `Warm-ups are over. The anthem finishes, you step over the boards, and you are lining up across from players you grew up watching. The puck drops.`,
        choices: isG
          ? [
              { label: 'Keep it simple', subLabel: 'Stick to the fundamentals and do not give up a bad one.', isRisky: false, feedback: 'A quiet, mistake-free night. The coach gave you an approving nod.', effect: { fanStatus: 15, ovr: 0, rel: { coach: 15 } }, action: 'RESOLVE_DEBUT' },
              { label: 'Make a statement', subLabel: 'Challenge shooters and go for the highlight save. It can backfire.', isRisky: true, successChance: 0.5, successFeedback: 'You stood tall, stopping an early barrage including a highlight-reel glove save. The building chanted your name.', successEffect: { fanStatus: 50, ovr: 1, rel: { teammates: 20 } }, failFeedback: 'You fought the puck early and let in a soft one. Welcome to the NHL.', failEffect: { fanStatus: 0, ovr: -1, rel: { coach: -15 } }, action: 'RESOLVE_DEBUT' }
            ]
          : [
              { label: 'Play it safe', subLabel: 'Keep your first shift simple and avoid a costly mistake.', isRisky: false, feedback: 'A quiet, mistake-free night. The coach gave you an approving nod.', effect: { fanStatus: 15, ovr: 0, rel: { coach: 15 } }, action: 'RESOLVE_DEBUT' },
              { label: 'Make a statement', subLabel: 'Force the issue early and go looking for a moment. It can backfire.', isRisky: true, successChance: 0.5, successFeedback: 'You ran a veteran on your first shift and put up a point. The arena went up.', successEffect: { fanStatus: 50, ovr: 1, rel: { teammates: 20 } }, failFeedback: 'You tried to do too much and got caught out of position for a goal against. Welcome to the NHL.', failEffect: { fanStatus: 0, ovr: -1, rel: { coach: -15 } }, action: 'RESOLVE_DEBUT' }
            ],
        isDebutEvent: true
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
  const carried = season ? season.stints : (trial ? [trial.segment] : (debut ? [debut.segment] : []));
  const carriedGames = carried.reduce((n, s) => n + (s.games || 0), 0);
  const effect = season ? season.training : (trial ? trial.training : (debut ? debut.training : t?.effect));
  const baseMissed = season ? season.gamesMissed : gamesMissed;
  const locked = !!(trial || season || debut);

  const partialResult = (stints) => {
    const last = stints[stints.length - 1];
    // The same summary the dashboard draws, so the two can never disagree again.
    const sum = summariseStints(stints) || {};
    const tot = {
      games: sum.games || 0, g: sum.goals || 0, a: sum.assists || 0, pm: sum.plusMinus || 0,
      saves: sum.saves || 0, shots: sum.shots || 0, sho: sum.shutouts || 0, avgToi: sum.avgToi || 0
    };
    return {
      recap: { ...tot, standings: last.standings, madePlayoffs: last.standings <= 16, awards: [] },
      currentLg: last.league, currentTeam: last.team,
      madePlayoffs: last.standings <= 16, partial: true, stints
    };
  };

  const advanceTo = (stints, nextStage) => {
    setPlayer(prev => ({ ...prev, trial: null, debut: null, season: { stints, training: effect || {}, gamesMissed: baseMissed, stage: nextStage } }));
    setPendingSeasonResult(partialResult(stints));
  };

  // Sends the player to a tournament and parks the season until he is back.
  const goToTournament = (stints, nextStage, context, isWJC, isOlympicYear) => {
    const run = buildRun({
      player,
      safeNationalities: ctx.safeNationalities,
      context,
      division: resolveNatDivision(player, ctx.safeNationalities),
      year: ctx.currentYear
    });
    advanceTo(stints, nextStage);
    setPlayer(prev => ({ ...prev, intlRun: run, isOlympicYear }));
    ctx.setMinigameContext(context);
    ctx.setScreen('intl-tournament');
  };

  // setPlayer does not land inside this call, so the stints accumulate locally as
  // the stages fall through. Reading them back off the player would lose whatever
  // the previous stage just played.
  let stints = [...carried];
  let played = carriedGames;
  // How good the club is this year is decided once, on the first segment, and
  // every later segment inherits it. Without this the team was re-rolled at the
  // World Juniors, the All-Star break, the deadline and the run-in, so the
  // standings the deadline screen showed had no bearing on where the season
  // actually finished.
  let seasonTeamFactor = carried.find(s => typeof s.teamFactor === 'number')?.teamFactor;
  // WHERE HE IS RIGHT NOW.
  //
  // Every segment of the year was simulated against the player as he was in
  // September, so a demotion in November produced a stint in the American
  // League and changed nothing the player could see: the card beside the
  // screen kept the NHL crest on it all year and the next segment rolled
  // placement again from the NHL. The first he knew of the move was a line of
  // AHL games in the recap months later. The club moves under him now, as it
  // happens, and the segment after it starts from where he actually is.
  let livePlayer = player;
  const playNext = (fraction) => {
    const seg = simulateSeason(livePlayer, effect, baseMissed + played, {
      gamesFraction: fraction, segmentOnly: true,
      ...(typeof seasonTeamFactor === 'number' ? { teamFactor: seasonTeamFactor } : {}),
      ...(locked ? { lockPlacement: true } : {})
    })?.segment;
    if (seg && seg.games > 0) {
      if (typeof seasonTeamFactor !== 'number' && typeof seg.teamFactor === 'number') {
        seasonTeamFactor = seg.teamFactor;
      }
      if (seg.team && (seg.team !== livePlayer.team || seg.league !== livePlayer.league)) {
        livePlayer = { ...livePlayer, team: seg.team, league: seg.league };
        setPlayer(prev => ({
          ...prev,
          team: seg.team,
          league: seg.league,
          teamsPlayedFor: Array.from(new Set([...(prev.teamsPlayedFor || []), seg.team]))
        }));
      }
      stints = [...stints, seg]; played += seg.games; return seg;
    }
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

    // December, with the first third of the year on the board: the other way
    // into the leadership group, for the player camp could not consider.
    const letter = midSeasonLetter(player, seg);
    if (letter) {
      advanceTo(stints, 1);
      setPlayer(p => ({ ...p, storylines: { ...(p.storylines || {}), alternateGiven: true } }));
      ctx.setActiveEvent(letter);
      ctx.setScreen('event');
      return;
    }
  }

  if (stage <= 1) {
    // Late January, or February every fourth year. The Olympics replace the
    // All-Star Game entirely in those years, which is what the league does.
    const seg = playNext(0.333);
    if (seg) {
      const isOlympicYear = ctx.currentYear % 4 === 2;

      if (isOlympicYear) {
        const isTopDiv = resolveNatDivision(player, ctx.safeNationalities) === 'Top Division';
        const goes = player.age > 19 && player.ovr >= 78 && (isTopDiv ? Math.random() > 0.35 : Math.random() > 0.75);
        if (goes) { goToTournament(stints, 2, 'olympics', false, true); return; }
      } else if (madeAllStarGame(player, seg)) {
        // Mark the selection so the end-of-season awards can tell a player who
        // actually went from one who merely had the numbers for it.
        setPlayer(p => ({ ...p, storylines: { ...(p.storylines || {}), allStarSelected: true } }));
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
    // The run-in finishes the same season, so it inherits the same club rather
    // than drawing a new one.
    {
      ...(priorStints.length ? { priorStints, lockPlacement: true } : {}),
      ...(typeof seasonTeamFactor === 'number' ? { teamFactor: seasonTeamFactor } : {})
    }
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
      // A goalie's year, the way a goalie's year is actually quoted.
      wins: recap.wins || 0,
      losses: recap.losses || 0,
      otl: recap.otl || 0,
      plusMinus: recap.pm,
      // A tournament played inside the season finishes months before this entry
      // exists: the World Juniors in December, the Olympics in February. The run
      // parks its line on the player and the season picks it up here. Writing it
      // straight into the newest history entry, which is what it used to do,
      // filed a December tournament against the previous season, and a career
      // whose only tournaments were mid-season ones showed none at all.
      ...(player.pendingIntl ? { intlData: player.pendingIntl.intlData } : {}),
      awards: [...(recap.awards || []), ...(player.pendingIntl?.awards || [])],
      // The letter on the sweater belongs to the season, not to the playoffs.
      // It was only ever written in proceedFromPlayoffs, so a captain or an
      // alternate who missed the postseason lost his letter from the career
      // table for that year and appeared to have been stripped of it.
      //
      // Read off the player as he was during the season, not off updatedPlayer:
      // a player claimed off waivers in the same breath has his letter stripped
      // there, and taking it from there would wipe the A off a year he spent
      // wearing one.
      isCaptain: !!player.isCaptain,
      isAlternate: !!player.isAlternate,
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
  setPlayer({
    ...updatedPlayer,
    // pendingIntl has been written into the season above, so it is spent too.
    trial: null, debut: null, season: null, pendingIntl: null,
    storylines: { ...(updatedPlayer.storylines || {}), allStarSelected: false }
  });
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

     // The debut is played as its own game at the top of this function now, so
     // it is no longer reported here. Watching the career counter cross zero
     // only ever fired once a full season of games had already been written.
     if (oldNhlGames < 1000 && newNhlGames >= 1000 && currentLg === 'NHL') {
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
     } else if (player.league === 'NHL' && currentLg === 'NHL'
                && (recap.stints || []).length > 1
                && (recap.stints || []).some(st => st.league === 'AHL' && (st.games || 0) > 0)) {
         // SENT DOWN AND BROUGHT BACK.
         //
         // A demotion only ever got a message when the player was still in the
         // AHL when the season ended. Go down in November, play twenty-five
         // games and get recalled in February and nothing was ever said: the
         // first he heard of it was a line of AHL games in the career table
         // months later, for a season he had no memory of leaving.
         const ahlGames = (recap.stints || [])
             .filter(st => st.league === 'AHL')
             .reduce((n, st) => n + (st.games || 0), 0);
         // Waiver exemption is real and the game already knows who has it: a
         // player on an entry-level deal is sent down, not waived, and telling
         // him he cleared waivers on his ELC is wrong twice over.
         const proSeasons = player.stats?.seasonsPlayed || 0;
         const exempt = (player.contract?.salary === 925000)
             || (player.age < 25 && proSeasons < 3);
         moveTitle = '🔁 DOWN AND BACK';
         moveDesc = exempt
             ? `It was not a good autumn. They sent you down without so much as a phone call to anybody else, because at your age and on your contract they do not need one, and you spent ${ahlGames} games in the American League before the call came to go back up. You finished the year in the NHL. Nobody in the room brings it up, which is its own kind of comment.`
             : `It was not a good autumn. You were put on waivers, you cleared, and you spent ${ahlGames} games in the American League before the call came to go back up. You finished the year in the NHL, and you know now exactly how quickly it can go the other way.`;
     } else if (wasAHLtoNHL) {
         const isFirst = !(player.seasonHistory || []).some(s => s.league === 'NHL');
         moveTitle = isFirst ? '🚨 WELCOME TO THE SHOW' : '📈 CALLED UP';
         moveDesc = isFirst
             ? `The call came at eight in the morning. Pack a bag, be at the airport by noon, you are in the lineup tomorrow night. Everybody you have ever played with is already texting you, and your mother is crying down the phone.`
             : `You have been recalled. You know the drill this time, and you know how quickly it goes the other way again.`;
         // This is the single biggest night in most of these careers and it used
         // to be a button that said Acknowledge. It gets a decision, like
         // everything else does.
         moveChoices = isFirst
             ? [
                 {
                   label: 'Call everyone who got you here',
                   subLabel: 'Your parents, the billet family, the junior coach who kept playing you.',
                   isRisky: false,
                   feedback: 'You spent the whole flight on the phone. Half of them could not speak. Neither could you, really.',
                   effect: { fanStatus: 40, ovr: 0, rel: { teammates: 10 } },
                   action: 'ROUTE_SEASON_END'
                 },
                 {
                   label: 'Tell nobody until the lineup is posted',
                   subLabel: 'You have been sent back down before. Say nothing until the sheet says your name.',
                   isRisky: false,
                   feedback: 'You said nothing to anyone. When the lineup went up with your name on it, you stood and looked at it for a while.',
                   effect: { fanStatus: 15, ovr: 1, rel: { coach: 10 } },
                   action: 'ROUTE_SEASON_END'
                 }
               ]
             : [
                 {
                   label: 'Go up and stay up',
                   subLabel: 'No sightseeing this time. Play like a man who is not going back.',
                   isRisky: false,
                   feedback: 'You went up with a plan this time, and you played like somebody who had no intention of returning.',
                   effect: { fanStatus: 20, ovr: 0, rel: { coach: 8 } },
                   action: 'ROUTE_SEASON_END'
                 }
               ];
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
                 label: 'Take it on the chin',
                 subLabel: 'Nothing to decide here. Pack the bag and get to work.',
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