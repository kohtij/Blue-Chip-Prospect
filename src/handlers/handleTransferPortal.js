// The college answer to demanding a trade.
//
// A college player at the deadline had nothing to do. He could not be traded,
// could not be shopped and had no contract to run down, so the screen gave him
// one button that meant "carry on". The portal is the move that actually exists
// in his world: he puts his name in, and programmes either call or they do not.
//
// It is deliberately not a trade. Nobody negotiates on his behalf and no club
// has to agree to anything, so the risk is not that a GM says no, it is that
// the phone stays quiet after he has already told his coach he is leaving.

import { getOpponentPool } from '../data/teams';
import { getFullTeamName } from '../utils/appHelpers';

// How likely a programme worth moving to actually comes calling. College ratings
// run roughly 55 to 80, so this spans about 40% for a fringe roster player up to
// 90% for someone the whole conference wants.
const landingChance = (ovr) => Math.min(0.90, Math.max(0.40, 0.40 + ((ovr - 58) / 40)));

export function handleTransferPortal(ctx, { res }) {
  const {
    hasDemandedTrade, setHasDemandedTrade, unlockAchievement,
    player, setActiveEvent, setScreen,
  } = ctx;

  if (hasDemandedTrade) return;
  setHasDemandedTrade(true);
  unlockAchievement('portal_entered');

  const landed = Math.random() < landingChance(player.ovr);

  if (landed) {
    let pool = (getOpponentPool('NCAA') || []).filter(t => t.id !== res.currentTeam);
    pool = [...pool].sort(() => 0.5 - Math.random()).slice(0, 3);
    if (pool.length === 0) pool = [{ id: 'UNK', name: 'Unknown Program' }];

    const choices = pool.map(teamObj => {
      // A programme in the hunt is a better landing spot than one rebuilding,
      // and the team card shows the player which is which before he commits.
      const standing = Math.random() > 0.35
        ? Math.floor(Math.random() * 8) + 1
        : Math.floor(Math.random() * 12) + 9;

      return {
        label: `Commit to the ${getFullTeamName(teamObj.id, 'NCAA')}`,
        isRisky: false,
        feedback: `You committed to the ${getFullTeamName(teamObj.id, 'NCAA')} and start over in a new programme.`,
        // Leaving costs you with the fanbase you are walking out on, but far
        // less than forcing a trade does: transferring is an ordinary part of
        // college hockey, not a betrayal.
        effect: { fanStatus: -10, ovr: 0, money: 0 },
        action: 'ACCEPT_TRADE_DEADLINE',
        actionData: { teamObj, lg: 'NCAA', teamStandings: standing, madePlayoffs: standing <= 16, showTeamCard: true }
      };
    });

    choices.push({
      label: 'Withdraw your name and stay',
      subLabel: 'Pull out of the portal and finish what you started here.',
      isRisky: false,
      feedback: 'You pulled your name back out. The staff said the right things, but they know now.',
      effect: { fanStatus: 5, ovr: 0, money: 0, rel: { coach: -10 } }
    });

    setActiveEvent({
      title: 'THE PORTAL IS OPEN',
      desc: 'Your name went into the portal and the calls started the same night. Three programmes have made an offer. Where do you want to finish your eligibility?',
      choices,
      isTradeDeadlineEvent: true
    });
    setScreen('event');
  } else {
    unlockAchievement('portal_cold');
    setActiveEvent({
      title: 'NOBODY CALLED',
      desc: 'You put your name in the portal and waited. What came back were programmes a level below where you already are, and none of them could offer you more than you have. Your coach has known your name was in there since the first morning.',
      choices: [
        {
          label: 'Withdraw and finish the season here',
          subLabel: 'Pull your name and go back to work.',
          isRisky: false,
          feedback: 'You pulled your name and went back to work. The room noticed, and so did the staff.',
          effect: { fanStatus: -15, ovr: 0, money: 0, rel: { coach: -20 } }
        },
        {
          label: 'Leave your name in and bet on the summer',
          subLabel: '⚡ High Risk • Force the staff to treat you as someone they might lose',
          isRisky: true,
          successChance: 0.35,
          successFeedback: 'Word got back that you were serious. Your minutes went up, and so did your stock.',
          successEffect: { fanStatus: 10, ovr: 1, rel: { coach: -10 } },
          failFeedback: 'The staff moved on without you. You spent the rest of the year on the fourth line watching.',
          failEffect: { fanStatus: -25, ovr: -2, rel: { coach: -30 } }
        }
      ],
      isTradeDeadlineEvent: true
    });
    setScreen('event');
  }
}
