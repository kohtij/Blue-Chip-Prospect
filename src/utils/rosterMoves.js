// WHERE HE PLAYS, AND WHEN THAT CHANGES.
//
// Placement used to be re-rolled at every checkpoint of the season. Each
// stretch of games asked again whether he was over 68, and a player under 24
// and under 78 went to the AHL eighty-five times in a hundred, on every roll.
// So a camp screen said "sent down", the next stretch quietly put him back in
// the NHL, he played the playoffs there, and the next September he was sent
// down again. Nothing about it looked like a club making decisions.
//
// It works the way a front office does now:
//   - Camp decides where he starts the year, and he's told.
//   - During the year he moves only for a reason (he's tearing up the AHL,
//     the big club has injuries, he's struggling in the NHL, or he's coming
//     back from an injury and needs games), and he's told when it happens.
//   - Young players are expected to spend time in the AHL. A 20-year-old who
//     would be a fourth-liner usually plays top minutes down there instead.
//   - A player who has held an NHL job keeps getting the benefit of the doubt.

import { nhlTeams } from '../data/teams';
import { proSeasonsOf, waiverExempt } from './waivers';

export const parentOf = (ahlId) => nhlTeams.find(t => t.ahlId === ahlId) || null;
export const affiliateOf = (nhlId) => nhlTeams.find(t => t.id === nhlId)?.ahlId || null;

// NHL games in one season of the history, split seasons included.
export const nhlGamesIn = (season) => {
  if (!season) return 0;
  if (Array.isArray(season.stints) && season.stints.length) {
    return season.stints.filter(st => st.league === 'NHL').reduce((n, st) => n + (st.games || 0), 0);
  }
  return season.league === 'NHL' ? (season.games || 0) : 0;
};

/**
 * The rating a club wants to see before it gives him an NHL job.
 *
 * The base is the old line (68 for a skater, 75 for a goalie). A young player
 * needs more on top of it, because the club gains more from him playing big
 * minutes in the AHL than sitting as a healthy scratch. A high pick gets a
 * little less, because the club has invested in him. A player who held an NHL
 * job last year, or earned his promotion at the end of it, needs less, because
 * clubs don't send a regular down over a point or two.
 */
export function nhlBar(p) {
  const base = p.pos === 'G' ? 75 : 68;
  const pro = proSeasonsOf(p);
  let bar = base;
  if (p.age <= 20) bar += 5;
  else if (p.age <= 22 && pro < 2) bar += 3;
  else if (p.age <= 23 && pro < 3) bar += 1;
  // Goalies take longer still, and clubs know it.
  if (p.pos === 'G' && p.age <= 23) bar += 2;
  if ((p.draftPick || 99) <= 10) bar -= 2;

  const last = p.seasonHistory?.[p.seasonHistory.length - 1];
  const nhlLast = nhlGamesIn(last);
  if (nhlLast >= 40) bar -= 4;
  else if (nhlLast >= 20) bar -= 2;
  if (last?.earnedPromotion) bar -= 3;
  return bar;
}

/** Whether he makes the NHL roster out of camp. Close calls go either way. */
export function makesNhlRoster(p) {
  const bar = nhlBar(p);
  if (p.ovr >= bar) return true;
  if (p.ovr >= bar - 2) return Math.random() < 0.4;
  return false;
}

// How a stretch of games looked, from 0 to 10. Segments carry a rating; the
// form reading is the fallback.
const stretch = (seg) => (typeof seg?.rating === 'number' ? seg.rating : 5 + (seg?.formZ || 0) * 1.5);

/**
 * A move during the season, or null.
 *
 * Called after a stretch of games. At most two moves a year, and never
 * straight back the way he just came, so he can't bounce between the two
 * clubs every month.
 */
export function midSeasonMove(p, seg, { movesThisYear = 0, lastMove = null } = {}) {
  if (!p || !seg || movesThisYear >= 2) return null;
  const bar = nhlBar(p);
  const form = stretch(seg);

  if (p.league === 'AHL') {
    const parent = parentOf(p.team);
    if (!parent || lastMove === 'DOWN') return null;
    // CHL-eligible teenagers can't be in the AHL at all, so they're never here.
    let odds = 0;
    if (p.ovr >= bar) odds = form >= 6.5 ? 0.7 : 0.45;
    else if (p.ovr >= bar - 3) odds = form >= 7.5 ? 0.4 : form >= 6.5 ? 0.18 : 0;
    // The big club loses two forwards in a week and needs a body, whoever's
    // playing well. It happens to good AHL players every year.
    const injuryCall = p.ovr >= bar - 5 && form >= 6 && Math.random() < 0.1;
    if (injuryCall) return { type: 'RECALL', why: 'INJURIES', team: parent.id, lg: 'NHL' };
    if (odds && Math.random() < odds) return { type: 'RECALL', why: 'FORM', team: parent.id, lg: 'NHL' };
    return null;
  }

  if (p.league === 'NHL') {
    if (lastMove === 'UP' && movesThisYear >= 1 && form >= 4) return null;
    if (p.contract?.nmc || (p.fanStatus || 0) >= 600) return null;
    const ahl = affiliateOf(p.team);
    if (!ahl) return null;
    // Only a player who is short of the bar and playing badly. A veteran on
    // a one-way deal is harder to move, the same as at camp.
    let odds = 0;
    if (p.ovr < bar - 4) odds = form < 5.5 ? 0.55 : 0.2;
    else if (p.ovr < bar) odds = form < 4.5 ? 0.4 : 0;
    const cRole = p.contract?.role || '';
    const twoWay = cRole.includes('Two-Way') || cRole.includes('AHL Start') || cRole.includes('Pro Roster');
    if (!twoWay && (p.contract?.salary || 0) >= 1500000) odds *= 0.4;
    if (!odds || Math.random() >= odds) return null;

    if (waiverExempt(p)) return { type: 'DOWN', why: 'EXEMPT', team: ahl, lg: 'AHL' };
    // On waivers. A cheap useful player gets claimed; an expensive one clears.
    const capM = (p.contract?.salary || 0) / 1000000;
    const worthM = Math.max(0.8, (p.ovr - 68) * 0.45);
    const claim = Math.min(0.6, Math.max(0.03, 0.1 + (worthM - capM) * 0.15));
    if (Math.random() < claim) {
      const pool = nhlTeams.filter(t => t.id !== p.team);
      return { type: 'CLAIMED', why: 'WAIVERS', team: pool[Math.floor(Math.random() * pool.length)].id, lg: 'NHL' };
    }
    return { type: 'DOWN', why: 'WAIVERS', team: ahl, lg: 'AHL' };
  }
  return null;
}

// THE SCREENS THAT SAY IT HAPPENED.
//
// Every move gets one, when it happens. The choice doesn't change where he
// goes; it's how he takes it, which nudges the room and the coach a little.
const statLine = (p, seg) => {
  if (!seg) return '';
  if (p.pos === 'G') {
    const sv = seg.shots ? (seg.saves / seg.shots).toFixed(3).replace('0.', '.') : '.000';
    return `a ${sv} save percentage in ${seg.games} games`;
  }
  const pts = (seg.g || 0) + (seg.a || 0);
  return `${pts} point${pts === 1 ? '' : 's'} in ${seg.games} games`;
};

export function moveEvent(move, p, seg, teamName) {
  const toName = teamName(move.team, move.lg);
  const fromName = teamName(p.team, p.league);
  const firstNhl = !(p.seasonHistory || []).some(s => nhlGamesIn(s) > 0) && !(p.stats?.nhl?.games > 0);

  if (move.type === 'RECALL') {
    const desc = move.why === 'INJURIES'
      ? `Two of the ${toName}'s forwards went down in the same game, and they need a body by tomorrow night. You've got ${statLine(p, seg)} with ${fromName}, and your name was the first one the coach said.`
      : firstNhl
        ? `The call came at eight in the morning. Pack a bag, be at the airport by noon, you're in the lineup tomorrow night. You've put up ${statLine(p, seg)} down here, and the ${toName} have seen enough.`
        : `You've put up ${statLine(p, seg)} with ${fromName}, and the ${toName} have seen enough. You're recalled, and this time the plan is to stay.`;
    return {
      title: firstNhl ? '🚨 CALLED UP TO THE NHL' : '📈 CALLED UP',
      desc,
      choices: firstNhl
        ? [
            { label: 'Call everyone who got you here', subLabel: 'Your parents, your billets, the junior coach who kept playing you.', isRisky: false,
              feedback: 'You spent the whole night on the phone. Half of them couldn\'t speak. Neither could you, really.', effect: { fanStatus: 30, ovr: 0, rel: { teammates: 5 } } },
            { label: 'Tell nobody yet', subLabel: 'Say nothing until your name\'s on the lineup sheet.', isRisky: false,
              feedback: 'You said nothing. When the lineup went up with your name on it, you stood and looked at it for a while.', effect: { fanStatus: 10, ovr: 0, rel: { coach: 8 } } }
          ]
        : [
            { label: 'Go up and stay up', subLabel: 'Play like someone who isn\'t going back.', isRisky: false,
              feedback: 'You went up with a plan this time.', effect: { fanStatus: 15, ovr: 0, rel: { coach: 6 } } }
          ],
      isMidSeasonEvent: true,
      isRosterMove: true
    };
  }

  if (move.type === 'CLAIMED') {
    return {
      title: '⏳ CLAIMED OFF WAIVERS',
      desc: `The ${fromName} put you on waivers to send you down, and the ${toName} put in a claim before the deadline. You're on a flight tonight, and you'll meet your new teammates in the morning.`,
      choices: [
        { label: 'Fresh start', subLabel: 'A club that wanted you badly enough to claim you.', isRisky: false,
          feedback: 'You landed after midnight. There was a stall with your name on it by morning skate.', effect: { fanStatus: 5, ovr: 0, rel: { coach: 10 } } }
      ],
      isMidSeasonEvent: true,
      isRosterMove: true
    };
  }

  // Sent down.
  const desc = move.why === 'EXEMPT'
    ? `It hasn't been working: ${statLine(p, seg)}, and fewer minutes every week. The GM called you in after practice. You're going down to the ${toName} to play big minutes and find your game. You're waiver-exempt, so nobody else got the chance to claim you.`
    : `It hasn't been working: ${statLine(p, seg)}, and fewer minutes every week. You went on waivers yesterday. Nobody claimed you, so you report to the ${toName} in the morning.`;
  return {
    title: '📉 SENT DOWN TO THE AHL',
    desc,
    choices: [
      { label: 'Head down, work', subLabel: 'Play your way back up.', isRisky: false,
        feedback: 'You were first on the ice at your first practice down there. The coaches noticed.', effect: { fanStatus: -5, ovr: 0, rel: { coach: 8 } } },
      { label: 'Let them know you\'re angry', subLabel: 'Tell your agent and anyone else who asks.', isRisky: false,
        feedback: 'It got back to the GM by the weekend. He doesn\'t forget that kind of thing.', effect: { fanStatus: 5, ovr: 0, rel: { coach: -12 } } }
    ],
    isMidSeasonEvent: true,
    isRosterMove: true
  };
}

export function conditioningEvent(p, seg, ahlName, nhlName) {
  return {
    title: '🏥 CONDITIONING STINT',
    desc: `You're cleared, but the staff want to see you play real games before you're back in their lineup. You went down to the ${ahlName} on a conditioning loan and put up ${statLine(p, seg)}. Your legs feel like yours again, and the ${nhlName} want you back for the next game.`,
    choices: [
      { label: 'Back to the big club', subLabel: 'Rejoin the team.', isRisky: false,
        feedback: 'You were back in the lineup two nights later.', effect: { fanStatus: 0, ovr: 0 } }
    ],
    isMidSeasonEvent: true,
    isRosterMove: true
  };
}

/**
 * A core player: a first-round pick, still with the club that drafted him (or
 * its AHL affiliate), who has played at least two seasons there and is one of
 * its better players. Clubs give this player a letter early. See the
 * leadership group in advanceToOffseason and midSeasonLetter in handleTrain.
 */
export function isCorePlayer(p) {
  if (!p) return false;
  const drafted = p.draftTeam || p.rights;
  if (!drafted || (p.draftPick || 99) > 32) return false;
  const org = (id) => parentOf(id)?.id || id;
  if (org(p.team) !== org(drafted)) return false;
  const seasonsHere = (p.seasonHistory || []).filter(s => org(s.team) === org(drafted) && (s.games || 0) >= 30).length;
  return seasonsHere >= 2 && (p.ovr || 0) >= 76;
}
