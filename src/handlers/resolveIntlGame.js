// Resolves one knockout game at an international tournament.
//
// This logic used to exist twice, as two ~100-line copies inside App.jsx, one in
// handleMinigameChoice and one in handleInteractiveResult, and the two had already
// drifted apart. Worse, the knockout run only ever went one direction: losing a
// semi-final printed "you will play for Bronze" and then ended the tournament,
// because the screen bailed out on any loss. The bronze medal game was in the
// bracket, drawn on screen, and unreachable.
//
// One resolver now owns the whole run: it decides the result, scales the reward
// by what the game was worth, writes the outcome into the bracket whether you won
// or lost, and names the next round, or none.

import { getStakes, applyStakesToReward, PRESTIGE } from '../utils/stakes';
import { capFanStatus, applyOvrDelta, recomputeOvr } from '../utils/gameHelpers';

// What a knockout win or loss is worth before the round multiplier is applied.
// The old numbers were flat per round and tiny: gold was +50 fan status, less
// than the +60 for a cocky press quote during the prep scenario. Winning a gold
// medal for your country should not be the smallest moment of the tournament.
const BASE_WIN  = { fanStatus: 20, rel: { media: 8, teammates: 4 } };
const BASE_LOSS = { fanStatus: -6, rel: { media: -6 } };

// Medal games are paid by where you finished, not by the single game, because
// paying them per-game put the finishes in the wrong order: a bronze winner
// collected a scaled win plus a medal, while a silver medallist had technically
// just lost and came out worse than third. Second in the world is worth more
// than third, whichever way the last game went.
const FINISH_VALUE = { Gold: 130, Silver: 70, Bronze: 55, Fourth: -15 };

const TOURNEY_NAME = {
  wjc: 'World Juniors',
  olympics: 'Winter Olympics',
  worlds: 'World Championship'
};

// Where a result sends you next. Null means the tournament is over.
function nextRound(stake, isWin) {
  if (stake === 'QUARTERFINAL') return isWin ? 'SEMIFINAL' : null;
  // A semi-final has two exits, not one. This is the fix: the loser plays for
  // bronze instead of going home.
  if (stake === 'SEMIFINAL') return isWin ? 'GOLD' : 'BRONZE';
  return null;
}

// Fills in the bracket around the player's actual result, so what is drawn on
// screen matches what happened rather than assuming the player advanced.
function advanceBracket(bracket, stage, playerWon) {
  if (!bracket) return bracket;
  const b = {
    qf: bracket.qf.map(m => ({ ...m })),
    sf: bracket.sf.map(m => ({ ...m })),
    medal: { gold: { ...bracket.medal.gold }, bronze: { ...bracket.medal.bronze } }
  };
  const coin = (m) => (m.t1 && m.t2 ? (Math.random() > 0.5 ? m.t1 : m.t2) : null);
  const settle = (m) => {
    const mine = m.t1?.isPlayer || m.t2?.isPlayer;
    if (!mine) { m.winner = coin(m); }
    else {
      const me = m.t1?.isPlayer ? m.t1 : m.t2;
      const them = m.t1?.isPlayer ? m.t2 : m.t1;
      m.winner = playerWon ? me : them;
    }
    m.loser = m.winner === m.t1 ? m.t2 : m.t1;
    return m;
  };

  if (stage === 'QUARTERFINAL') {
    b.qf.forEach(settle);
    b.sf[0].t1 = b.qf[0].winner; b.sf[0].t2 = b.qf[1].winner;
    b.sf[1].t1 = b.qf[2].winner; b.sf[1].t2 = b.qf[3].winner;
  } else if (stage === 'SEMIFINAL') {
    b.sf.forEach(settle);
    b.medal.gold.t1 = b.sf[0].winner;  b.medal.gold.t2 = b.sf[1].winner;
    b.medal.bronze.t1 = b.sf[0].loser; b.medal.bronze.t2 = b.sf[1].loser;
  } else if (stage === 'GOLD') {
    settle(b.medal.gold);
  } else if (stage === 'BRONZE') {
    settle(b.medal.bronze);
  }
  return b;
}

/**
 * @returns {{ updatedPlayer, resultMsg, resultEffect, isTournamentOver, nextStake }}
 */
export function resolveIntlGame({
  player, minigameContext, isWin, msg, currentYear, safeNationalities, unlockAchievement
}) {
  const nat = (safeNationalities || []).find(n => n.id === player.nat);
  const currentTier = player.natTier || nat?.tier || 1;
  const countryName = nat?.sentenceName || nat?.name || 'your country';
  const tournamentName = TOURNEY_NAME[minigameContext] || 'World Championship';
  const stake = player.intlStakes || 'GOLD';

  // What this specific game was worth: the round, against this opponent.
  const stakes = getStakes(minigameContext, stake, player.intlOppTier);
  const effect = applyStakesToReward(isWin ? BASE_WIN : BASE_LOSS, stakes.rewardMulti);

  let updatedPlayer = { ...player };
  let awardName = '';
  let resultMsg;
  let ovrDelta = 0;

  const advance = nextRound(stake, isWin);

  if (stake === 'QUARTERFINAL') {
    resultMsg = isWin
      ? `${msg} You advance to the semi-finals!`
      : `${msg} A heartbreaking quarter-final exit for ${countryName}.`;
  } else if (stake === 'SEMIFINAL') {
    resultMsg = isWin
      ? `${msg} You are through to the gold medal game!`
      : `${msg} You fell in the semi-final and will play for bronze.`;
  } else if (stake === 'GOLD') {
    if (isWin) {
      awardName = 'Gold';
      ovrDelta = 1;
      resultMsg = `${msg} You won the gold medal for ${countryName}!`;
      unlockAchievement?.('gold_medal');
    } else {
      awardName = 'Silver';
      resultMsg = `${msg} A heartbreaking loss in the final, but you take silver for ${countryName}.`;
    }
  } else if (stake === 'BRONZE') {
    if (isWin) {
      awardName = 'Bronze';
      ovrDelta = 1;
      resultMsg = `${msg} You secured the bronze medal for ${countryName}!`;
    } else {
      resultMsg = `${msg} You fell short in the bronze medal game. Fourth place for ${countryName}.`;
    }
  } else if (stake === 'SURVIVAL') {
    if (isWin) {
      resultMsg = `${msg} You avoided relegation! ${countryName} survives in ${player.natDiv || 'the division'}.`;
    } else if (currentTier === 2 || currentTier === 3) {
      updatedPlayer.natTier = currentTier + 1;
      updatedPlayer.natDiv = currentTier === 2 ? 'Division I-A' : 'Division I-B';
      const oldDiv = currentTier === 2 ? 'the Top Division' : 'Division I-A';
      resultMsg = `${msg} A devastating loss. ${countryName} has been relegated from ${oldDiv} to ${updatedPlayer.natDiv}.`;
    } else {
      resultMsg = `${msg} A loss, but there is no division below this one to fall into.`;
    }
  } else if (stake === 'PROMOTION') {
    if (isWin) {
      updatedPlayer.natTier = currentTier === 3 ? 2 : 3;
      updatedPlayer.natDiv = currentTier === 3 ? 'Top Division' : 'Division I-A';
      resultMsg = `${msg} ${countryName} has been promoted to ${updatedPlayer.natDiv}!`;
    } else {
      resultMsg = `${msg} You fell short of promotion this year.`;
    }
  } else {
    resultMsg = isWin
      ? `${msg} A solid win to end the tournament on a high note.`
      : `${msg} A tough loss to end the tournament.`;
  }

  // Apply the payout. A medal game pays its finish; every other round pays the
  // scaled result of the game itself.
  const prestige = PRESTIGE[minigameContext] ?? 1;
  const finishKey = awardName || (stake === 'BRONZE' && !isWin ? 'Fourth' : null);
  const fanDelta = finishKey
    ? Math.round(FINISH_VALUE[finishKey] * prestige)
    : (effect.fanStatus || 0);
  const withOvr = applyOvrDelta(updatedPlayer, ovrDelta);
  updatedPlayer = {
    ...withOvr,
    ovr: recomputeOvr(withOvr),
    fanStatus: capFanStatus((withOvr.fanStatus || 0) + fanDelta),
    relationships: {
      coach: Math.min(100, Math.max(0, (withOvr.relationships?.coach || 50) + (effect.rel?.coach || 0))),
      teammates: Math.min(100, Math.max(0, (withOvr.relationships?.teammates || 50) + (effect.rel?.teammates || 0))),
      media: Math.min(100, Math.max(0, (withOvr.relationships?.media || 50) + (effect.rel?.media || 0)))
    }
  };

  // The bracket, and the round that comes next.
  const bracket = advanceBracket(player.intlData?.bracket, stake, isWin);
  let nextOppTier = player.intlOppTier;
  if (advance && bracket) {
    const upcoming = advance === 'SEMIFINAL' ? bracket.sf
      : advance === 'GOLD' ? [bracket.medal.gold]
      : advance === 'BRONZE' ? [bracket.medal.bronze] : [];
    const myMatch = upcoming.find(m => m?.t1?.isPlayer || m?.t2?.isPlayer);
    const them = myMatch && (myMatch.t1?.isPlayer ? myMatch.t2 : myMatch.t1);
    nextOppTier = them?.tier ?? null;
  }

  updatedPlayer.intlData = { ...(player.intlData || {}), bracket };
  updatedPlayer.intlStakes = advance || stake;
  updatedPlayer.intlOppTier = advance ? nextOppTier : player.intlOppTier;

  // Medals are recorded in two places: the career totals and the season's own
  // history entry, because the retirement screen and the career score each read
  // a different one.
  if (awardName) {
    const medalString = `${awardName}, ${tournamentName} ${currentYear}`;
    updatedPlayer.stats = {
      ...updatedPlayer.stats,
      awards: [...(updatedPlayer.stats?.awards || []), medalString]
    };
  }

  const history = updatedPlayer.seasonHistory;
  if (history && history.length > 0) {
    const lastIdx = history.length - 1;
    const prior = history[lastIdx];
    const awards = [...(prior.awards || [])];
    if (awardName) awards.push(`${awardName}, ${tournamentName} ${currentYear}`);
    const nextHistory = [...history];
    nextHistory[lastIdx] = {
      ...prior,
      awards,
      intlData: { ...(player.intlData || {}), tournamentName: `${currentYear} ${tournamentName}` }
    };
    updatedPlayer.seasonHistory = nextHistory;
  }

  return {
    updatedPlayer,
    resultMsg,
    resultEffect: { fanStatus: fanDelta, ovr: ovrDelta, rel: effect.rel },
    isTournamentOver: !advance,
    nextStake: advance
  };
}