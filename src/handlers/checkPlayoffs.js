// Extracted from App.jsx.
// Takes an `ctx` object with the state, setters, and other handlers it needs.
import { LEAGUE_CONFIG, getConferences, getDivisions, getOpponentPool, getPlayoffRounds, getTeamConference, getTeamData } from '../data/teams';
import { fanGain, generatePlayoffDeck, singleGameScore } from '../utils/gameHelpers';
import { getGamesPerMatchup, getWinsNeeded } from '../utils/appHelpers';

const clamp = (val, min, max) => Math.min(max, Math.max(min, val));

// THE PLAY-IN.
//
// Some leagues open with a round the top seeds skip. The Czech pre-playoffs
// are fifth to twelfth, best of five, while the top four wait in the
// quarterfinal; the Swiss and Slovak play-ins are seventh to tenth, with the
// top six through. The bracket used to pair every round off by halving the
// one before, which those formats break: four play-in winners can't make a
// quarterfinal of eight on their own.
//
// The byes are the gap: the next round's places less the play-in's winners.
// Zero for every format that simply halves.
export const playInByes = (rounds) => {
  if (!rounds || rounds.length < 2) return 0;
  const winners = rounds[0].teams / 2;
  return rounds[1].teams > winners ? rounds[1].teams - winners : 0;
};

/**
 * The next round with its teams filled in from the one just finished. A round
 * after a play-in says which play-in series feeds each of its matchups
 * (`feed`), with the seed that had the bye already in place; every other
 * round pairs the winners of neighbouring series. The player's club is
 * always team1. Statuses, decks and scores are the caller's.
 */
export function seedNextRound(prev, next, prevWN, teamId) {
  const winner = (m) => (m.wins1 >= prevWN ? m.team1 : m.team2);
  const playerFirst = (a, b) => (b?.id === teamId ? [b, a] : [a, b]);
  if (next.some(m => typeof m.feed === 'number')) {
    return next.map(m => {
      if (typeof m.feed !== 'number' || !prev[m.feed]) return { ...m };
      const [team1, team2] = playerFirst(m.team1, winner(prev[m.feed]));
      return { ...m, team1, team2 };
    });
  }
  return next.map((m, k) => {
    const m1 = prev[2 * k];
    const m2 = prev[2 * k + 1];
    if (!m1 || !m2) return { ...m };
    const [team1, team2] = playerFirst(winner(m1), winner(m2));
    return { ...m, team1, team2 };
  });
}

// Plays one series out with a fixed per-game win chance for team 1.
function simulateSeries(p1, winsNeeded, gamesPerMatchup) {
  if (gamesPerMatchup === 1) {
    const win = Math.random() < p1;
    return { wins1: win ? 1 : 0, wins2: win ? 0 : 1 };
  }
  let wins1 = 0;
  let wins2 = 0;
  while (wins1 < winsNeeded && wins2 < winsNeeded) {
    if (Math.random() < p1) wins1++;
    else wins2++;
  }
  return { wins1, wins2 };
}

// SIDELINED MODE: the player is injured, so there are no card minigames. The team
// still plays the full bracket and every series is decided on team strength.
// Mutates the freshly built bracket and reports how the run ended.
function simulateBracketWithoutPlayer({ bracket, currentLg, currentTeamId, standings, spots, playerOvr }) {
  const totalRounds = bracket.length;
  const seedStrength = clamp(1 - ((standings || 1) - 1) / Math.max(1, spots - 1), 0, 1);
  // Losing a star hurts: the better the injured player, the bigger the dent.
  const absencePenalty = clamp((playerOvr - 70) * 0.003, 0, 0.06);

  let playerAlive = true;
  // A seed with a bye starts in the second round.
  let lastPlayerRound = bracket[0]?.some(m => m.isPlayerSeries) ? 0 : 1;

  for (let r = 0; r < totalRounds; r++) {
    const round = bracket[r];

    // Seed this round from the previous winners, using the same pairing rule the
    // live bracket uses, and keep the player's club as team1.
    if (r > 0) {
      const seeded = seedNextRound(bracket[r - 1], round, getWinsNeeded(currentLg, r - 1), currentTeamId);
      seeded.forEach((m, slot) => {
        round[slot] = {
          ...m,
          isPlayerSeries: playerAlive && m.team1?.id === currentTeamId,
          wins1: 0,
          wins2: 0,
          revealed: [],
          deck: null,
          status: 'playing'
        };
      });
    }

    const winsNeeded = getWinsNeeded(currentLg, r);
    const gamesPerMatchup = getGamesPerMatchup(currentLg, r);

    round.forEach((match, i) => {
      const isPlayerMatch = !!match.isPlayerSeries && playerAlive;
      // The player's club: a better seed is a better team, later rounds get harder.
      // Every other series is a coin flip.
      const p1 = isPlayerMatch
        ? clamp(0.45 + (0.18 * seedStrength) - (0.02 * r) - absencePenalty, 0.28, 0.66)
        : 0.5;
      const result = simulateSeries(p1, winsNeeded, gamesPerMatchup);

      let status = 'simulated';
      if (isPlayerMatch) {
        const won = result.wins1 >= winsNeeded;
        status = won ? 'won' : 'lost';
        lastPlayerRound = r;
        if (!won) playerAlive = false;
      }
      round[i] = { ...match, wins1: result.wins1, wins2: result.wins2, status };
    });
  }

  return {
    overallStatus: playerAlive ? 'won_cup' : 'eliminated',
    activeRoundIndex: lastPlayerRound,
    reachedFinal: lastPlayerRound === totalRounds - 1
  };
}

export function checkPlayoffs(ctx, currentLg, currentTeamId, standings, opts = {}) {
  const { setPlayoffs, setScreen } = ctx;
  const sidelined = !!opts.sidelined;

    // A league with no playoff has none, rather than silently falling back to a
    // sixteen team bracket because zero is falsy.
    const spots = LEAGUE_CONFIG[currentLg]?.playoffSpots ?? 16;
    if (!spots) { setScreen('recap'); return; }
    const rounds = getPlayoffRounds(currentLg);
    const totalRounds = rounds.length;
    const conferences = getConferences(currentLg);
    const hasConfs = conferences.length === 2;
    const divs = getDivisions(currentLg);

    const playerTeamObj = getTeamData(currentTeamId, currentLg) || { id: currentTeamId, name: currentTeamId };
    const playerConf = getTeamConference(currentTeamId, currentLg);
    // Which conference is drawn on the left and which on the right. West and
    // East for the leagues that have them; the BCHL's Coastal and Interior
    // otherwise, in the order the league lists them.
    const [leftConf, rightConf] = !hasConfs ? [null, null]
      : conferences.includes('West') ? ['West', 'East'] : conferences;

    // Build opponent pools. If the league has conferences, split into West / East so the
    // bracket genuinely respects them; otherwise a single shuffled pool feeds every matchup.
    const allOpponents = (getOpponentPool(currentLg) || []).filter(t => t.id !== currentTeamId);
    const shuffled = [...allOpponents].sort(() => 0.5 - Math.random());
    let westPool = [], eastPool = [], singlePool = [];
    if (hasConfs) {
      westPool = shuffled.filter(t => t.conf === leftConf);
      eastPool = shuffled.filter(t => t.conf === rightConf);
    } else {
      singlePool = shuffled;
    }

    const getDeckForRound = (roundNum) => {
      const gpm = rounds[roundNum - 1]?.gamesPerMatchup || 7;
      const generated = generatePlayoffDeck ? generatePlayoffDeck(standings || 1, spots, roundNum, gpm) : null;
      if (generated && Array.isArray(generated) && generated.length > 0) return generated;
      
      // Calculate Playoff Impact based on Player OVR vs League Average
      const pOvr = ctx.player.ovr;
      let impactOdds = 0.55; // Base 45% chance to win (0.55 threshold)
      
      if (currentLg === 'NHL') {
          if (pOvr >= 88) impactOdds = 0.35; // 65% chance to win
          else if (pOvr >= 83) impactOdds = 0.45; // 55% chance
          else if (pOvr < 75) impactOdds = 0.65; // 35% chance (Liability)
      } else if (currentLg === 'AHL') {
          if (pOvr >= 75) impactOdds = 0.35; 
          else if (pOvr < 65) impactOdds = 0.65;
      } else {
          // Juniors/Euro
          if (pOvr >= 65) impactOdds = 0.35;
          else if (pOvr < 55) impactOdds = 0.65;
      }

      // One game is still one game, but it is dealt as a 4x4 grid (16 cards)
      // rather than a single card, so only the one the player clicks ever
      // decides it.
      const size = gpm === 1 ? 16 : gpm + 2;
      return Array(size).fill(null).map(() => {
        const isWin = Math.random() > impactOdds;
        return { isWin, ...singleGameScore(isWin) };
      });
    };

    const getDivLabel = (m, totalMatchups) => {
      if (divs.length === 0) return '';
      const matchupsPerDiv = Math.max(1, Math.floor(totalMatchups / divs.length));
      const divIdx = Math.min(divs.length - 1, Math.floor(m / matchupsPerDiv));
      return `${divs[divIdx].toUpperCase()} DIV`;
    };

    // Decide which R1 matchup index the player occupies. West indices come first (0..halfSize-1)
    // so West sits on the LEFT of the bracket per user preference, East on the right.
    const firstRoundMatchups = rounds[0].teams / 2;
    // A league that plays its first two rounds inside the division (the BCHL)
    // draws each first-round series from one division, with the divisions in
    // bracket order, so neighbouring series meet in the division final and
    // the division winners in the conference final.
    const divisional = !!LEAGUE_CONFIG[currentLg]?.divisionalPlayoffs
      && divs.length > 0 && firstRoundMatchups % divs.length === 0;
    const perDiv = divisional ? firstRoundMatchups / divs.length : 0;
    const divPools = divisional ? Object.fromEntries(divs.map(d => [d, shuffled.filter(t => t.div === d)])) : null;
    const playerDivIdx = divisional ? divs.indexOf(playerTeamObj.div) : -1;
    // A top seed in a league with a play-in skips the first round. See playInByes.
    const byes = hasConfs ? 0 : playInByes(rounds);
    const playerHasBye = byes > 0 && (standings || 99) <= byes;
    const byeMatchups = byes > 0 ? rounds[1].teams / 2 : 0;
    const playerByeIdx = playerHasBye ? Math.floor(Math.random() * byeMatchups) : -1;
    let playerMatchIdx;
    if (playerHasBye) {
      playerMatchIdx = -1;
    } else if (divisional && playerDivIdx >= 0) {
      playerMatchIdx = playerDivIdx * perDiv + Math.floor(Math.random() * perDiv);
    } else if (hasConfs) {
      const halfSize = Math.floor(firstRoundMatchups / 2);
      if (playerConf === leftConf) {
        playerMatchIdx = Math.floor(Math.random() * halfSize);
      } else {
        playerMatchIdx = halfSize + Math.floor(Math.random() * (firstRoundMatchups - halfSize));
      }
    } else {
      playerMatchIdx = Math.floor(Math.random() * firstRoundMatchups);
    }

    // ONE BOARD FOR THE WHOLE TOURNAMENT.
    //
    // Every other league plays series, and a series gets its own grid because
    // a grid is a series: you turn cards over until somebody has four. The
    // NCAA is single elimination from the regional semifinal to the national
    // championship, so a grid per round meant four separate sixteen-card
    // boards, each dealt fresh, pressed once and then flipped over whole.
    // Sixty-four cards to decide four games, and no reason to remember any of
    // them.
    //
    // It is one board now. Sixteen scores dealt when the regional starts, and
    // each round is a single press on the same sixteen. The square he presses
    // turns over and nothing else does. Win, and the bracket moves on under
    // him while the board stays exactly where it was, one square down. Four
    // presses to a national title, and the twelve he never touched stay face
    // down unless a press comes back a loss, which is the only thing that
    // turns the rest of them over.
    //
    // The scores are fixed at the deal, so the tournament has one difficulty
    // rather than a fresh roll each round: the title game comes out of the
    // same deal as the opener. That is the price of the board being a place
    // he works across rather than four unrelated grids.
    const allSingle = rounds.length > 0 && rounds.every(r => (r.gamesPerMatchup || 7) === 1);
    const board = (allSingle && !sidelined)
      ? { deck: getDeckForRound(1), revealed: [], speechUsed: false }
      : null;

    const bracket = [];
    for (let r = 0; r < totalRounds; r++) {
      const numMatchups = rounds[r].teams / 2;
      const halfSize = Math.floor(numMatchups / 2);
      const roundMatchups = [];

      for (let m = 0; m < numMatchups; m++) {
        // Assign each matchup a conference tag (used by the bracket render to split L/R).
        // The League Final round crosses conferences, so its matchup carries no conf tag.
        let matchConf = null;
        if (hasConfs && r < totalRounds - 1) {
          matchConf = m < halfSize ? leftConf : rightConf;
        }

        if (r === 0) {
          const isPlayer = m === playerMatchIdx;
          const pool = divisional ? divPools[divs[Math.floor(m / perDiv)]]
            : hasConfs ? (matchConf === leftConf ? westPool : eastPool) : singlePool;
          
          // Fallback: If a league has fewer than 16 teams, recycle an opponent so we never get a "TBD" ghost
          const getBackupTeam = () => allOpponents[Math.floor(Math.random() * allOpponents.length)] || { name: 'TBD', id: 'TBD' };
          
          const t1 = isPlayer ? playerTeamObj : (pool.pop() || getBackupTeam());
          const t2 = pool.pop() || getBackupTeam();
          
          roundMatchups.push({
            id: `r${r}-m${m}`,
            team1: t1,
            team2: t2,
            conf: matchConf,
            isPlayerSeries: isPlayer,
            wins1: 0,
            wins2: 0,
            status: 'playing',
            // A sidelined player plays no minigames, so no deck is dealt, and
            // neither does a tournament that has a board of its own.
            deck: (isPlayer && !sidelined && !board) ? getDeckForRound(1) : null,
            revealed: [],
            divisionLabel: getDivLabel(m, numMatchups)
          });
        } else if (r === 1 && byes > 0) {
          // The seeds who skipped the play-in are waiting here. Each of the
          // first few faces a play-in winner (feed); the rest play each other.
          const getBackupTeam = () => allOpponents[Math.floor(Math.random() * allOpponents.length)] || { name: 'TBD', id: 'TBD' };
          const isPlayer = m === playerByeIdx;
          const feeds = m < firstRoundMatchups;
          roundMatchups.push({
            id: `r${r}-m${m}`,
            team1: isPlayer ? playerTeamObj : (singlePool.pop() || getBackupTeam()),
            team2: feeds ? { name: 'TBD', id: 'TBD' } : (singlePool.pop() || getBackupTeam()),
            ...(feeds ? { feed: m } : {}),
            conf: null,
            isPlayerSeries: false,
            wins1: 0,
            wins2: 0,
            status: 'locked',
            deck: null,
            revealed: []
          });
        } else {
          roundMatchups.push({
            id: `r${r}-m${m}`,
            team1: { name: 'TBD', id: 'TBD' },
            team2: { name: 'TBD', id: 'TBD' },
            conf: matchConf,
            isPlayerSeries: false,
            wins1: 0,
            wins2: 0,
            status: 'locked',
            deck: null,
            revealed: []
          });
        }
      }
      bracket.push(roundMatchups);
    }

    // INJURED: the club plays on without the player. Decide the whole run up front.
    if (sidelined) {
      const run = simulateBracketWithoutPlayer({
        bracket,
        currentLg,
        currentTeamId,
        standings,
        spots,
        playerOvr: ctx.player?.ovr || 70
      });

      if (run.overallStatus === 'won_cup') {
        // Still on the roster, so the name goes on the trophy and the fans notice.
        if (ctx.setPlayer) ctx.setPlayer(p => ({ ...p, fanStatus: fanGain(p.fanStatus || 0, 15) }));
        if (ctx.unlockAchievement) {
          if (currentLg === 'NHL') ctx.unlockAchievement('stanley_cup');
          if (currentLg === 'AHL') ctx.unlockAchievement('ahl_champ');
          if (currentLg === 'NCAA') ctx.unlockAchievement('ncaa_champ');
        }
      }

      setPlayoffs({
        bracket,
        activeRoundIndex: run.activeRoundIndex,
        overallStatus: run.overallStatus,
        currentLg,
        currentTeamId,
        standings,
        spots,
        playerConf,
        hasConfs,
        confs: [leftConf, rightConf],
        roundsConfig: rounds,
        playerSidelined: true,
        confTitleWon: hasConfs && run.reachedFinal
      });
      setScreen('playoffs');
      return;
    }

    // A seed with a bye watches the play-in from the press box: it's played out
    // now, and his series is the first one in the quarterfinal.
    let activeRoundIndex = 0;
    if (playerHasBye) {
      const wn0 = getWinsNeeded(currentLg, 0);
      const gpm0 = getGamesPerMatchup(currentLg, 0);
      bracket[0] = bracket[0].map(m => ({ ...m, ...simulateSeries(0.5, wn0, gpm0), status: 'simulated', deck: null }));
      const gpm1 = rounds[1]?.gamesPerMatchup || 7;
      bracket[1] = seedNextRound(bracket[0], bracket[1], wn0, currentTeamId).map(m => {
        const mine = m.team1?.id === currentTeamId;
        return {
          ...m,
          isPlayerSeries: mine,
          status: 'playing',
          deck: mine && !board ? generatePlayoffDeck(standings || 1, spots, 2, gpm1) : null
        };
      });
      activeRoundIndex = 1;
    }

    setPlayoffs({
      bracket,
      activeRoundIndex,
      overallStatus: 'playing',
      currentLg,
      currentTeamId,
      standings,
      spots,
      playerConf,
      hasConfs,
      confs: [leftConf, rightConf],
      roundsConfig: rounds,
      board
    });
    setScreen('playoffs');
}