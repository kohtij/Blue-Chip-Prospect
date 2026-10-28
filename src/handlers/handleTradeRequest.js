import { getOpponentPool, nhlTeams } from '../data/teams';
import { getFullTeamName } from '../utils/appHelpers';

// North American clubs read naturally with "the" ("the Barrie Colts"); European
// clubs do not ("Luleå HF"), so the article is decided by the league.
const NON_NA_LEAGUES = ['SHL', 'LIIGA', 'KHL', 'SWISS', 'DEL', 'ICEHL', 'CZECH', 'SLOVAK'];
const namedTeam = (teamId, lg) => {
  const name = getFullTeamName(teamId, lg);
  return NON_NA_LEAGUES.includes(lg) ? name : `the ${name}`;
};

export function handleTradeRequest(ctx, { res, playoffSpots }) {
  const {
    hasDemandedTrade, setHasDemandedTrade, unlockAchievement,
    player, setActiveEvent, setScreen,
  } = ctx;

  if (hasDemandedTrade) return;
  setHasDemandedTrade(true);
  unlockAchievement('trade_demanded');

  const successChance = Math.min(0.85, Math.max(0.35, 0.35 + ((player.ovr - 60) / 40)));
  const isSuccess = Math.random() < successChance;

  if (isSuccess) {
    const isAHL = res.currentLg === 'AHL';
    const tradeLg = isAHL ? 'NHL' : res.currentLg;
    
    let parentTeam = res.currentTeam;
    if (isAHL) {
        const pTeam = (nhlTeams||[]).find(t => t.ahlId === res.currentTeam);
        if (pTeam) parentTeam = pTeam.id;
    }

    let pool = getOpponentPool(tradeLg)?.filter(t => t.id !== parentTeam) || [];
    pool = [...pool].sort(() => 0.5 - Math.random()).slice(0, 3);
    if (pool.length === 0) pool = [{ id: 'UNK', name: 'Unknown Team' }];

    const choices = pool.map(teamObj => {
      const isGoingToContender = Math.random() > 0.3;
      const teamStandings = isGoingToContender
        ? Math.floor(Math.random() * playoffSpots) + 1
        : Math.floor(Math.random() * 8) + playoffSpots + 1;
      const teamInPlayoffs = teamStandings <= playoffSpots;

      let displayLabel = `Accept a trade to ${namedTeam(teamObj.id, tradeLg)}`;
      let feedback = `The trade went through! You were dealt to ${namedTeam(teamObj.id, tradeLg)}.`;
      let targetTeamObj = teamObj;
      let targetLg = tradeLg;

      if (isAHL && teamObj.ahlId) {
          const ahlName = getFullTeamName(teamObj.ahlId, 'AHL');
          displayLabel = `Accept a trade to ${namedTeam(teamObj.id, tradeLg)}, assigned to ${namedTeam(teamObj.ahlId, 'AHL')}`;
          feedback = `Traded to ${namedTeam(teamObj.id, tradeLg)} and assigned to their AHL affiliate, ${namedTeam(teamObj.ahlId, 'AHL')}.`;
          targetTeamObj = { id: teamObj.ahlId, name: ahlName };
          targetLg = 'AHL';
      }

      return {
        label: displayLabel,
        isRisky: false,
        feedback,
        effect: { idol: -20, ovr: 0, money: 0 },
        action: 'ACCEPT_TRADE_DEADLINE',
        // showTeamCard switches EventScreen to the full team card: logo watermark,
        // playoff/rank badges and the itemized perks and flaws. Without it these
        // render as plain text choices. The rank and playoff status are shown by
        // that card, so they no longer need a subLabel here.
        actionData: { teamObj: targetTeamObj, lg: targetLg, teamStandings, madePlayoffs: teamInPlayoffs, showTeamCard: true }
      };
    });

    setActiveEvent({
      title: 'TRADE OFFERS RECEIVED',
      desc: 'Your agent leveraged interest across the league. Your GM has agreed to trade packages from multiple suitors. Where do you want to be shipped?',
      choices,
      isTradeDeadlineEvent: true
    });
    setScreen('event');
  } else {
    unlockAchievement('trade_rejected');
    setActiveEvent({
      title: 'TRADE REQUEST REJECTED',
      desc: 'Your GM publicly shut down your request: "We control his rights and he isn\'t going anywhere." The media is blasting your loyalty, your teammates are giving you the cold shoulder, and your GM benched you.',
      choices: [
        {
          label: 'Accept your fate and stay focused',
          isRisky: false,
          feedback: 'You put your head down, but the environment in the locker room is toxic.',
          effect: { idol: -30, ovr: -1, money: 0 }
        },
        {
          label: 'Hold Out (Refuse to Play)',
          subLabel: '⚡ High Risk • Force a trade, but risk massive fan and skill backlash',
          isRisky: true,
          successChance: 0.35,
          successFeedback: 'The GM panicked and immediately shipped you out for pennies on the dollar to rid the locker room of the distraction!',
          successEffect: { idol: -50, ovr: 0 },
          failFeedback: 'The GM called your bluff. You missed camp, lost your conditioning, and permanently damaged your reputation.',
          failEffect: { idol: -125, ovr: -3 },
          action: 'TRADE_HOLDOUT'
        }
      ],
      isTradeDeadlineEvent: true
    });
    setScreen('event');
  }
}