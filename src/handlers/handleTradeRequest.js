// Extracted from screens/TradeDeadlineScreen.jsx.
// The deadline trade-request flow: player asks out, team accepts or rejects
// based on OVR-scaled success chance. On accept: 3 randomized destination
// choices are offered via an ACCEPT_TRADE_DEADLINE event. On reject: single
// "eat it" event with a stat penalty.
import { getOpponentPool } from '../data/teams';

export function handleTradeRequest(ctx, { res, playoffSpots }) {
  const {
    hasDemandedTrade, setHasDemandedTrade, unlockAchievement,
    player, setActiveEvent, setScreen,
  } = ctx;

  if (hasDemandedTrade) return;
  setHasDemandedTrade(true);
  unlockAchievement('trade_demanded');

  // OVR-scaled odds: floor 35% for mid-tier, cap 85% for stars.
  const successChance = Math.min(0.85, Math.max(0.35, 0.35 + ((player.ovr - 60) / 40)));
  const isSuccess = Math.random() < successChance;

  if (isSuccess) {
    let pool = getOpponentPool(res.currentLg)?.filter(t => t.id !== res.currentTeam) || [];
    pool = [...pool].sort(() => 0.5 - Math.random()).slice(0, 3);
    if (pool.length === 0) pool = [{ id: 'UNK', name: 'Unknown Team' }];

    const choices = pool.map(teamObj => {
      const isGoingToContender = Math.random() > 0.3;
      const teamStandings = isGoingToContender
        ? Math.floor(Math.random() * playoffSpots) + 1
        : Math.floor(Math.random() * 8) + playoffSpots + 1;
      const teamInPlayoffs = teamStandings <= playoffSpots;

      return {
        label: `Accept Trade to ${teamObj.name}`,
        subLabel: `📈 Rank #${teamStandings} (${teamInPlayoffs ? 'IN PLAYOFFS' : 'OUT OF PLAYOFFS'})`,
        isRisky: false,
        feedback: `The trade went through! You were dealt to ${teamObj.name}.`,
        effect: { idol: -20, ovr: 0, money: 0 },
        action: 'ACCEPT_TRADE_DEADLINE',
        actionData: { teamObj, teamStandings, madePlayoffs: teamInPlayoffs }
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
        }
      ],
      isTradeDeadlineEvent: true
    });
    setScreen('event');
  }
}
