// Extracted from App.jsx.
// Takes an `ctx` object with the state, setters, and other handlers it needs.
import { capIdol, generatePlayoffDeck } from '../utils/gameHelpers';
import { getGamesPerMatchup, getWinsNeeded } from '../utils/appHelpers';

export function handleGridClick(ctx, rIndex, mIndex, cIndex) {
  const { player, playoffs, setPlayer, setPlayoffs, unlockAchievement } = ctx;

    if (playoffs.overallStatus !== 'playing' || rIndex !== playoffs.activeRoundIndex) return;

    const currentRound = playoffs.bracket[rIndex];
    if (!currentRound || !currentRound[mIndex]) return;

    const match = currentRound[mIndex];
    if (!match.isPlayerSeries || match.status !== 'playing') return;
    if (match.revealed && match.revealed.includes(cIndex)) return;
    if (!match.deck || !match.deck[cIndex]) return;

    // Wins needed depends on the format: 4 for best-of-7, 3 for best-of-5, 1 for single-elim.
    const winsNeeded = getWinsNeeded(playoffs.currentLg, rIndex);
    const isFrozenFour = getGamesPerMatchup(playoffs.currentLg, rIndex) === 1;

    const card = match.deck[cIndex];
    const isWin = card.isWin || card.win;
    const newWins = isWin ? match.wins1 + 1 : match.wins1;
    const newLosses = !isWin ? match.wins2 + 1 : match.wins2;

    let matchStatus = 'playing';
    let overallStatus = 'playing';

    if (newWins >= winsNeeded) matchStatus = 'won';
    else if (newLosses >= winsNeeded) {
      matchStatus = 'lost';
      overallStatus = 'eliminated';
    }

    const totalRounds = playoffs.bracket.length;

    // Series-specific achievements only make sense for best-of-7.
    if (matchStatus === 'won' && winsNeeded === 4) {
      if (newWins === 4 && newLosses === 0) unlockAchievement('sweep');
      if (newWins === 4 && newLosses === 3) unlockAchievement('game_seven_hero');
    } else if (matchStatus === 'lost' && winsNeeded === 4) {
      if (newLosses === 4 && newWins === 0 && rIndex === 0) unlockAchievement('swept_exit');
    }

    const newMatch = {
      ...match,
      revealed: [...(match.revealed || []), cIndex],
      wins1: newWins,
      wins2: newLosses,
      status: matchStatus
    };

    const newRound = [...currentRound];
    newRound[mIndex] = newMatch;
    let newBracket = [...playoffs.bracket];
    newBracket[rIndex] = newRound;

    let nextActiveIndex = rIndex;
    let playerUpdates = null;

    // Conference title still fires at rIndex === 2 for 4-round leagues; skip if NCAA/short bracket.
    let confTitleWonThisRound = false;
    if (matchStatus === 'won' && rIndex === totalRounds - 2 && playoffs.hasConfs && !isFrozenFour) {
      confTitleWonThisRound = true;
      unlockAchievement('conf_champ');
    }

    if (matchStatus !== 'playing') {
      // Auto-simulate remaining unplayed series in the current round.
      newRound.forEach((m, i) => {
        if (!m.isPlayerSeries && m.status === 'playing') {
          const t1W = Math.random() > 0.5;
          const lw = isFrozenFour ? 0 : Math.floor(Math.random() * winsNeeded);
          newRound[i] = { ...m, status: 'simulated', wins1: t1W ? winsNeeded : lw, wins2: t1W ? lw : winsNeeded };
        }
      });
      newBracket[rIndex] = newRound;

      if (overallStatus === 'eliminated') {
        // Simulate the rest of the bracket after elimination so the recap has a champion.
        for (let r = rIndex; r < totalRounds - 1; r++) {
          const currR = newBracket[r];
          const nextR = [...newBracket[r + 1]];
          const currWN = getWinsNeeded(playoffs.currentLg, r);
          const nextWN = getWinsNeeded(playoffs.currentLg, r + 1);
          const nextIsFF = getGamesPerMatchup(playoffs.currentLg, r + 1) === 1;

          for (let i = 0; i < currR.length; i += 2) {
            const m1 = currR[i];
            const m2 = currR[i + 1];
            const adv1 = m1.wins1 >= currWN ? m1.team1 : m1.team2;
            const adv2 = m2.wins1 >= currWN ? m2.team1 : m2.team2;

            const t1W = Math.random() > 0.5;
            const lw = nextIsFF ? 0 : Math.floor(Math.random() * nextWN);

            if (nextR[Math.floor(i / 2)]) {
              nextR[Math.floor(i / 2)] = {
                ...nextR[Math.floor(i / 2)],
                team1: adv1,
                team2: adv2,
                status: 'simulated',
                wins1: t1W ? nextWN : lw,
                wins2: t1W ? lw : nextWN
              };
            }
          }
          newBracket[r + 1] = nextR;
        }
      } else if (matchStatus === 'won') {
        if (rIndex + 1 < totalRounds) {
          const nextR = [...newBracket[rIndex + 1]];
          const currWN = winsNeeded;
          const nextRoundIdx = rIndex + 1;

          for (let i = 0; i < newRound.length; i += 2) {
            const m1 = newRound[i];
            const m2 = newRound[i + 1];
            const adv1 = m1.wins1 >= currWN ? m1.team1 : m1.team2;
            const adv2 = m2.wins1 >= currWN ? m2.team1 : m2.team2;

            const isPlayerMatch = adv1.id === playoffs.currentTeamId || adv2.id === playoffs.currentTeamId;
            let t1 = adv1;
            let t2 = adv2;
            if (isPlayerMatch && adv2.id === playoffs.currentTeamId) { t1 = adv2; t2 = adv1; }

            const nextGpm = getGamesPerMatchup(playoffs.currentLg, nextRoundIdx);
            const nextDeckSize = nextGpm === 1 ? 3 : nextGpm + 2; // Always provide at least 3 choices for single-elimination
            const nextDeck = isPlayerMatch
              ? (generatePlayoffDeck
                  ? generatePlayoffDeck(playoffs.standings || 1, playoffs.spots, nextRoundIdx + 1, nextGpm)
                  : Array(nextDeckSize).fill(null).map(() => ({ isWin: Math.random() > 0.45 })))
              : null;

            nextR[Math.floor(i / 2)] = {
              ...nextR[Math.floor(i / 2)],
              team1: t1,
              team2: t2,
              isPlayerSeries: isPlayerMatch,
              status: 'playing',
              deck: nextDeck,
              wins1: 0,
              wins2: 0,
              revealed: []
            };
          }
          newBracket[rIndex + 1] = nextR;

          // Keep the current round on screen so the player sees all their reveal cards.
          nextActiveIndex = rIndex;
        } else {
          overallStatus = 'won_cup';
          playerUpdates = p => ({
            ...p,
            idolatry: capIdol(p.idolatry + 30),
            stats: { ...p.stats, titles: (p.stats.titles || 0) + 1 }
          });
          if (player.league === 'NHL') unlockAchievement('stanley_cup');
          if (player.league === 'AHL') unlockAchievement('ahl_champ');
          if (player.league === 'NCAA') unlockAchievement('ncaa_champ');
        }
      }
    }

    setPlayoffs({
      ...playoffs,
      bracket: newBracket,
      activeRoundIndex: nextActiveIndex,
      overallStatus,
      confTitleWon: playoffs.confTitleWon || confTitleWonThisRound
    });
    if (playerUpdates) setPlayer(playerUpdates);
}
