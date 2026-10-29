// Extracted from App.jsx.
// Takes an `ctx` object with the state, setters, and other handlers it needs.
import { LEAGUE_CONFIG, getConferences, getDivisions, getOpponentPool, getPlayoffRounds, getTeamConference, getTeamData } from '../data/teams';
import { capFanStatus, generatePlayoffDeck } from '../utils/gameHelpers';
import { getGamesPerMatchup, getWinsNeeded } from '../utils/appHelpers';

const clamp = (val, min, max) => Math.min(max, Math.max(min, val));

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
  let lastPlayerRound = 0;

  for (let r = 0; r < totalRounds; r++) {
    const round = bracket[r];

    // Seed this round from the previous winners, using the same pairing rule the
    // live bracket uses, and keep the player's club as team1.
    if (r > 0) {
      const prev = bracket[r - 1];
      const prevWN = getWinsNeeded(currentLg, r - 1);
      for (let i = 0; i < prev.length; i += 2) {
        const m1 = prev[i];
        const m2 = prev[i + 1];
        const slot = Math.floor(i / 2);
        if (!m1 || !m2 || !round[slot]) continue;
        const adv1 = m1.wins1 >= prevWN ? m1.team1 : m1.team2;
        const adv2 = m2.wins1 >= prevWN ? m2.team1 : m2.team2;
        const isPlayerMatch = playerAlive && (adv1.id === currentTeamId || adv2.id === currentTeamId);
        let t1 = adv1;
        let t2 = adv2;
        if (isPlayerMatch && adv2.id === currentTeamId) { t1 = adv2; t2 = adv1; }
        round[slot] = {
          ...round[slot],
          team1: t1,
          team2: t2,
          isPlayerSeries: isPlayerMatch,
          wins1: 0,
          wins2: 0,
          revealed: [],
          deck: null,
          status: 'playing'
        };
      }
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

    const spots = LEAGUE_CONFIG[currentLg]?.playoffSpots || 16;
    const rounds = getPlayoffRounds(currentLg);
    const totalRounds = rounds.length;
    const conferences = getConferences(currentLg);
    const hasConfs = conferences.length === 2;
    const divs = getDivisions(currentLg);

    const playerTeamObj = getTeamData(currentTeamId, currentLg) || { id: currentTeamId, name: currentTeamId };
    const playerConf = getTeamConference(currentTeamId, currentLg);

    // Build opponent pools. If the league has conferences, split into West / East so the
    // bracket genuinely respects them; otherwise a single shuffled pool feeds every matchup.
    const allOpponents = (getOpponentPool(currentLg) || []).filter(t => t.id !== currentTeamId);
    const shuffled = [...allOpponents].sort(() => 0.5 - Math.random());
    let westPool = [], eastPool = [], singlePool = [];
    if (hasConfs) {
      westPool = shuffled.filter(t => t.conf === 'West');
      eastPool = shuffled.filter(t => t.conf === 'East');
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

      const size = gpm === 1 ? 3 : gpm + 2; 
      return Array(size).fill(null).map(() => ({ isWin: Math.random() > impactOdds }));
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
    let playerMatchIdx;
    if (hasConfs) {
      const halfSize = Math.floor(firstRoundMatchups / 2);
      if (playerConf === 'West') {
        playerMatchIdx = Math.floor(Math.random() * halfSize);
      } else {
        playerMatchIdx = halfSize + Math.floor(Math.random() * (firstRoundMatchups - halfSize));
      }
    } else {
      playerMatchIdx = Math.floor(Math.random() * firstRoundMatchups);
    }

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
          matchConf = m < halfSize ? 'West' : 'East';
        }

        if (r === 0) {
          const isPlayer = m === playerMatchIdx;
          const pool = hasConfs ? (matchConf === 'West' ? westPool : eastPool) : singlePool;
          
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
            // A sidelined player plays no minigames, so no deck is dealt.
            deck: isPlayer && !sidelined ? getDeckForRound(1) : null,
            revealed: [],
            divisionLabel: getDivLabel(m, numMatchups)
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
        if (ctx.setPlayer) ctx.setPlayer(p => ({ ...p, fanStatus: capFanStatus((p.fanStatus || 0) + 15) }));
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
        roundsConfig: rounds,
        playerSidelined: true,
        confTitleWon: hasConfs && run.reachedFinal
      });
      setScreen('playoffs');
      return;
    }

    setPlayoffs({
      bracket,
      activeRoundIndex: 0,
      overallStatus: 'playing',
      currentLg,
      currentTeamId,
      standings,
      spots,
      playerConf,
      hasConfs,
      roundsConfig: rounds
    });
    setScreen('playoffs');
}