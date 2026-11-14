// IN-SEASON FORM.
//
// The engine draws every stretch of the season with its own luck, and since
// the streak carry was added that luck runs on from one stretch into the next.
// This file turns it into words: the form reading on the dashboard, the coach's
// reaction to it, and the event for a player stuck in a real slump.
//
// formZ is how far the last stretch was from his normal, in standard
// deviations, so a twenty-game run and a forty-game one are read the same way.

const HOT = 0.8;
const COLD = -0.8;
// About one stretch in ten goes this badly. That is a slump in the sense
// players mean it, the kind people start asking about.
const SLUMP = -1.3;

export function formOf(seg) {
  if (!seg || typeof seg.formZ !== 'number' || !(seg.games > 0)) return null;
  const z = seg.formZ;
  if (z >= 1.6) return { key: 'hot', label: 'On fire', tone: 'text-[#ef4444]' };
  if (z >= HOT) return { key: 'hot', label: 'Hot', tone: 'text-[#F59E0B]' };
  if (z <= SLUMP) return { key: 'cold', label: 'Slumping', tone: 'text-sky-300' };
  if (z <= COLD) return { key: 'cold', label: 'Cold', tone: 'text-sky-400' };
  return { key: 'steady', label: 'Steady', tone: 'text-slate-300' };
}

// What the last stretch looked like, as a stat line.
export function stretchLine(seg, pos) {
  if (!seg || !(seg.games > 0)) return null;
  if (pos === 'G') {
    const sv = seg.shots > 0 ? (seg.saves / seg.shots).toFixed(3).replace('0.', '.') : '.000';
    return { value: sv, label: `SV% in ${seg.games} GP` };
  }
  return { value: `${(seg.g || 0) + (seg.a || 0)} pts`, label: `in ${seg.games} GP` };
}

// Coaches notice. A hot stretch earns a few more shifts in the third period,
// a cold one costs a few. Small, because one stretch is one stretch.
export function formTrust(seg) {
  const f = formOf(seg);
  if (!f) return 0;
  if (f.key === 'hot') return seg.formZ >= 1.6 ? 4 : 2;
  if (f.key === 'cold') return seg.formZ <= SLUMP ? -3 : -1;
  return 0;
}

export function inSlump(seg) {
  return !!seg && seg.games >= 8 && typeof seg.formZ === 'number' && seg.formZ <= SLUMP;
}

// The slump event. Every answer sets the form he carries into the next
// stretch, in place of the cold one the slump would otherwise hand on.
export function slumpEvent(player, seg) {
  const isGoalie = player.pos === 'G';
  const gp = seg.games || 0;
  const pts = (seg.g || 0) + (seg.a || 0);
  const goals = seg.g || 0;
  const sv = seg.shots > 0 ? (seg.saves / seg.shots).toFixed(3).replace('0.', '.') : '.000';

  const desc = isGoalie
    ? `A ${sv} save percentage over your last ${gp} games. The goals that are beating you are not the hard ones, and you can hear the crowd go quiet every time a shot comes in from the point. The goalie coach wants to talk.`
    : goals === 0
      ? `No goals in your last ${gp} games and ${pts} point${pts === 1 ? '' : 's'} in total. You are getting chances, and every one of them is finding a pad, a post or a stick. The reporters have started counting.`
      : `${goals} goal${goals === 1 ? '' : 's'} and ${pts} point${pts === 1 ? '' : 's'} in your last ${gp} games. You are getting chances, and every one of them is finding a pad, a post or a stick. The reporters have started counting.`;

  const choices = isGoalie ? [
    {
      label: 'Go back to basics with the goalie coach',
      subLabel: 'Extra mornings on angles and depth. Slow, but it works.',
      isRisky: false,
      feedback: 'Two weeks of early mornings with the goalie coach. Nothing dramatic, and your angles came back.',
      effect: { fanStatus: 0, ovr: 0, rel: { coach: 6 } },
      action: 'SLUMP_RESPONSE', actionData: { boost: 1.04 }
    },
    {
      label: 'Ask for a night off',
      subLabel: 'Let the backup start, sit on the bench and reset.',
      isRisky: false,
      feedback: 'The backup started on Saturday. You watched from the end of the bench and came back the next week feeling like yourself.',
      effect: { fanStatus: -5, ovr: 0, rel: { coach: 3 } },
      action: 'SLUMP_RESPONSE', actionData: { boost: 1.0 }
    },
    {
      label: 'Change everything',
      subLabel: 'New pads, new routine, new music in the room. It might shake something loose.',
      isRisky: true, successChance: 0.5,
      successFeedback: 'New pads and a new routine, and you stopped the first twenty shots you saw in them. The old pads went in a bag in the basement.',
      successEffect: { fanStatus: 10, ovr: 0, rel: { media: 5 } },
      failFeedback: 'You changed everything, and the pads took three weeks to break in. The goals kept going in while they did.',
      failEffect: { fanStatus: -10, ovr: 0, rel: { coach: -5 } },
      action: 'SLUMP_RESPONSE', actionData: { successBoost: 1.15, failBoost: 0.93 }
    }
  ] : [
    {
      label: 'Stay late and shoot pucks',
      subLabel: 'Last one off the ice every day until it comes back.',
      isRisky: false,
      feedback: 'You were the last one off the ice every day for two weeks. It came back slowly, one ugly goal at a time.',
      effect: { fanStatus: 0, ovr: 0, rel: { coach: 6 } },
      action: 'SLUMP_RESPONSE', actionData: { boost: 1.04 }
    },
    {
      label: 'Ask the coach to simplify your game',
      subLabel: 'Fewer minutes for a week, pucks deep, nothing fancy.',
      isRisky: false,
      feedback: 'He moved you down a line for a week and told you to get pucks deep and go to the net. It cleared your head.',
      effect: { fanStatus: -5, ovr: 0, rel: { coach: 10 } },
      action: 'SLUMP_RESPONSE', actionData: { boost: 1.0 }
    },
    {
      label: 'Change your sticks and your routine',
      subLabel: 'New curve, new tape job, a different pregame meal. It might shake something loose.',
      isRisky: true, successChance: 0.5,
      successFeedback: 'New curve, new tape and a different drive to the rink, and you scored twice in the first game. You are not changing back.',
      successEffect: { fanStatus: 10, ovr: 0, rel: { media: 5 } },
      failFeedback: 'You changed everything and spent three weeks fighting a curve you did not trust. The slump went on.',
      failEffect: { fanStatus: -10, ovr: 0, rel: { coach: -5 } },
      action: 'SLUMP_RESPONSE', actionData: { successBoost: 1.15, failBoost: 0.93 }
    }
  ];

  return {
    title: isGoalie ? '🥅 THE SLUMP' : '🧊 THE SLUMP',
    desc,
    choices,
    madePlayoffs: false,
    isMidSeasonEvent: true
  };
}
