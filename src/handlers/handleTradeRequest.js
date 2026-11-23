import { getOpponentPool, nhlTeams, tradeMarketOf } from '../data/teams';
import { getFullTeamName } from '../utils/appHelpers';
import { NO_ARTICLE_LEAGUES } from '../utils/gameHelpers';

// North American clubs read naturally with "the" ("the Barrie Colts"); European
// clubs do not ("Luleå HF"), so the article is decided by the league.
const NON_NA_LEAGUES = NO_ARTICLE_LEAGUES;
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
  // A European club doesn't trade a player who wants out. It sells him, so the
  // same request reads as a transfer.
  const fees = tradeMarketOf(res.currentLg) === 'fees';
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

      let displayLabel = fees
        ? `Accept a transfer to ${namedTeam(teamObj.id, tradeLg)}`
        : `Accept a trade to ${namedTeam(teamObj.id, tradeLg)}`;
      let feedback = fees
        ? `The clubs agreed a fee, and you signed for ${namedTeam(teamObj.id, tradeLg)}.`
        : `The trade went through. You were dealt to ${namedTeam(teamObj.id, tradeLg)}.`;
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
        effect: { fanStatus: -20, ovr: 0, money: 0 },
        action: 'ACCEPT_TRADE_DEADLINE',
        // showTeamCard switches EventScreen to the full team card: logo watermark,
        // playoff/rank badges and the itemized perks and flaws. Without it these
        // render as plain text choices. The rank and playoff status are shown by
        // that card, so they no longer need a subLabel here.
        actionData: { teamObj: targetTeamObj, lg: targetLg, teamStandings, madePlayoffs: teamInPlayoffs, showTeamCard: true }
      };
    });

    setActiveEvent({
      title: fees ? 'TRANSFER OFFERS RECEIVED' : 'TRADE OFFERS RECEIVED',
      desc: fees
        ? 'You told the club you want to leave, and your agent found clubs willing to pay a fee for you. Where do you want to go?'
        : 'Your agent found interest around the league, and your GM has offers from several clubs. Where do you want to go?',
      choices,
      isTradeDeadlineEvent: true
    });
    setScreen('event');
  } else {
    unlockAchievement('trade_rejected');
    setActiveEvent({
      title: fees ? 'TRANSFER REQUEST REFUSED' : 'TRADE REQUEST REJECTED',
      desc: fees
        ? 'The club turned your request down in public: "He\'s under contract here and he isn\'t going anywhere." The media is questioning your loyalty, your teammates have gone cold on you, and you have been benched.'
        : 'Your GM publicly shut down your request: "We control his rights and he isn\'t going anywhere." The media is questioning your loyalty, your teammates have gone cold on you, and you have been benched.',
      choices: [
        {
          label: 'Accept your fate and stay focused',
          isRisky: false,
          feedback: 'You put your head down, and the room stayed poisonous all the same.',
          effect: { fanStatus: -30, ovr: -1, money: 0 }
        },
        {
          label: 'Hold out (refuse to play)',
          subLabel: 'Force a trade, at a cost to your fans and your game.',
          isRisky: true,
          successChance: 0.35,
          successFeedback: 'The GM panicked and moved you for almost nothing, just to get you out of the room.',
          successEffect: { fanStatus: -50, ovr: 0 },
          failFeedback: 'The GM called your bluff. You missed camp, lost your conditioning, and your reputation won\'t recover.',
          failEffect: { fanStatus: -125, ovr: -3 },
          action: 'TRADE_HOLDOUT'
        }
      ],
      isTradeDeadlineEvent: true
    });
    setScreen('event');
  }
}