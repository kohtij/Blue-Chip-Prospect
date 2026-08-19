// Extracted from App.jsx.
// Takes an `ctx` object with the state, setters, and other handlers it needs.
import { LEAGUE_CONFIG, getConferences, getDivisions, getOpponentPool, getPlayoffRounds, getTeamConference, getTeamData } from '../data/teams';
import { generatePlayoffDeck } from '../utils/gameHelpers';

export function checkPlayoffs(ctx, currentLg, currentTeamId, standings) {
  const { setPlayoffs, setScreen } = ctx;

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
      const size = gpm === 1 ? 3 : gpm + 2; // Always provide at least 3 choices for single-elimination
      return Array(size).fill(null).map(() => ({ isWin: Math.random() > 0.45 }));
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
            deck: isPlayer ? getDeckForRound(1) : null,
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
