// Extracted from App.jsx.
// Takes an `ctx` object with the state, setters, and other handlers it needs.
import { fanGain, generatePlayoffDeck, singleGameScore } from '../utils/gameHelpers';
import { getGamesPerMatchup, getWinsNeeded } from '../utils/appHelpers';
import { seedNextRound } from './checkPlayoffs';

export function handleGridClick(ctx, rIndex, mIndex, cIndex) {
  const { player, playoffs, setPlayer, setPlayoffs, unlockAchievement } = ctx;

    if (playoffs.overallStatus !== 'playing' || rIndex !== playoffs.activeRoundIndex) return;

    const currentRound = playoffs.bracket[rIndex];
    if (!currentRound || !currentRound[mIndex]) return;

    const match = currentRound[mIndex];
    if (!match.isPlayerSeries || match.status !== 'playing') return;

    // THE TOURNAMENT BOARD.
    //
    // A single-elimination league plays every round off one set of sixteen
    // squares dealt at the start, so the deck and the list of what has been
    // turned over live on the tournament rather than on the round. See the
    // note in checkPlayoffs. Everything else keeps its own per-series grid.
    const board = playoffs.board || null;
    const deck = board ? board.deck : match.deck;
    const revealed = board ? board.revealed : match.revealed;

    if (revealed && revealed.includes(cIndex)) return;
    if (!deck || !deck[cIndex]) return;

    // Wins needed depends on the format: 4 for best-of-7, 3 for best-of-5, 1 for single-elim.
    const winsNeeded = getWinsNeeded(playoffs.currentLg, rIndex);
    const isFrozenFour = getGamesPerMatchup(playoffs.currentLg, rIndex) === 1;

    const card = deck[cIndex];
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

    // A single-elimination round is one game, so it gets a scoreboard rather
    // than a series tally. The clicked card already carries its own score
    // (rolled when the deck was dealt, so it doesn't reshuffle on re-render);
    // fall back to a fresh roll only for older saves whose cards predate that.
    const scoreline = (isFrozenFour && matchStatus !== 'playing')
      ? (card.score1 != null
          ? { score1: card.score1, score2: card.score2, ot: card.ot }
          : singleGameScore(matchStatus === 'won'))
      : null;

    const newBoard = board
      ? { ...board, revealed: [...(board.revealed || []), cIndex] }
      : null;

    const newMatch = {
      ...match,
      revealed: [...(match.revealed || []), cIndex],
      wins1: newWins,
      wins2: newLosses,
      status: matchStatus,
      ...(scoreline || {})
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
          const currWN = getWinsNeeded(playoffs.currentLg, r);
          const nextWN = getWinsNeeded(playoffs.currentLg, r + 1);
          const nextIsFF = getGamesPerMatchup(playoffs.currentLg, r + 1) === 1;

          // seedNextRound knows a play-in round from an ordinary one.
          newBracket[r + 1] = seedNextRound(newBracket[r], newBracket[r + 1], currWN, playoffs.currentTeamId).map(m => {
            const t1W = Math.random() > 0.5;
            const lw = nextIsFF ? 0 : Math.floor(Math.random() * nextWN);
            return {
              ...m,
              isPlayerSeries: false,
              status: 'simulated',
              wins1: t1W ? nextWN : lw,
              wins2: t1W ? lw : nextWN
            };
          });
        }
      } else if (matchStatus === 'won') {
        if (rIndex + 1 < totalRounds) {
          const nextRoundIdx = rIndex + 1;

          // seedNextRound knows a play-in round from an ordinary one, and puts
          // his club first in its matchup.
          const seeded = seedNextRound(newRound, newBracket[rIndex + 1], winsNeeded, playoffs.currentTeamId);
          const nextR = seeded.map(m => {
            const isPlayerMatch = m.team1?.id === playoffs.currentTeamId;

            const nextGpm = getGamesPerMatchup(playoffs.currentLg, nextRoundIdx);
            // On a tournament board there is nothing to deal: the next round
            // is another press on the same sixteen squares.
            const nextDeckSize = nextGpm === 1 ? 16 : nextGpm + 2;
            const nextDeck = (isPlayerMatch && !board)
              ? (generatePlayoffDeck
                  ? generatePlayoffDeck(playoffs.standings || 1, playoffs.spots, nextRoundIdx + 1, nextGpm)
                  : Array(nextDeckSize).fill(null).map(() => {
                      const isWin = Math.random() > 0.45;
                      return { isWin, ...singleGameScore(isWin) };
                    }))
              : null;

            return {
              ...m,
              isPlayerSeries: isPlayerMatch,
              status: 'playing',
              deck: nextDeck,
              wins1: 0,
              wins2: 0,
              revealed: []
            };
          });
          newBracket[rIndex + 1] = nextR;

          // A series keeps its round on screen so the player sees every card he
          // turned over and presses on when he is ready. A tournament board has
          // nothing to look back at: the next game is the next press on the
          // same sixteen squares, so a win goes straight into the next round.
          nextActiveIndex = board ? rIndex + 1 : rIndex;
        } else {
          overallStatus = 'won_cup';
          // NOTE: the title count (stats.titles) and the cup award are recorded
          // exactly once, in proceedFromPlayoffs. Incrementing titles here as well
          // double-counted every cup, and the award guard there cannot catch it
          // because this path adds no award entry to compare against.
          playerUpdates = p => ({
            ...p,
            fanStatus: fanGain(p.fanStatus, 30)
          });
          const lg = playoffs.currentLg || player.league;
          if (lg === 'NHL') unlockAchievement('stanley_cup');
          if (lg === 'AHL') unlockAchievement('ahl_champ');
          if (lg === 'NCAA') unlockAchievement('ncaa_champ');
        }
      }
    }

    setPlayoffs({
      ...playoffs,
      bracket: newBracket,
      activeRoundIndex: nextActiveIndex,
      overallStatus,
      confTitleWon: playoffs.confTitleWon || confTitleWonThisRound,
      ...(newBoard ? { board: newBoard } : {})
    });
    if (playerUpdates) setPlayer(playerUpdates);
}