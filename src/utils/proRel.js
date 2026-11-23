// PROMOTION AND RELEGATION.
//
// Europe's leagues aren't closed. Every spring the bottom of one tier and the
// top of the one below swap places, and the game used to have no way of
// showing it: the same fourteen clubs were in the SHL forever. This runs once
// a summer, decides who goes up and who goes down in every pair of leagues
// where that really happens, and records the result as moves the opponent
// pools read (see setClubMoves in data/teams.js).
//
// The rules are each country's as they stand for 2026-27. Everywhere else in
// the game (the KHL and VHL, Denmark, Austria and the Alps, France, Britain,
// the Czech and Slovak leagues, Australia) is a closed league and isn't here.
//
// The player's own club is placed where it really finished, and goes up only
// if it really won the title below. Every other club is placed by its
// strength with a little luck on top, which is the same table the rest of the
// game projects from.

import {
  getOpponentPool, countryProLeagues, homeLeagueOf, LEAGUE_COUNTRY, setClubMoves
} from '../data/teams';
import { teamStrengthOf } from './leagueState';
import { gaussianNoise } from './production';
import { getFullTeamName } from './appHelpers';
import { formatLeagueName, leagueWithArticle } from './gameHelpers';

export const PRO_REL = [
  // The SHL's last-place club goes straight down and the HockeyAllsvenskan
  // playoff champion comes up.
  { upper: 'SHL', lower: 'ALLSV', kind: 'direct', down: 1, up: 1 },
  // HockeyAllsvenskan's thirteenth and fourteenth play a best-of-seven and the
  // loser goes down. Hockeyettan's champion comes up.
  { upper: 'ALLSV', lower: 'ETTAN', kind: 'series', up: 1 },
  // Liiga is going from seventeen clubs to fourteen: after 2026-27 the bottom
  // three go down and nobody comes up. From then on it's one for one.
  { upper: 'LIIGA', lower: 'MESTIS', kind: 'direct', counts: (summer) => (summer <= 2027 ? { down: 3, up: 0 } : { down: 1, up: 1 }) },
  { upper: 'MESTIS', lower: 'SUOMI', kind: 'direct', down: 1, up: 1 },
  // The DEL2 champion goes up only with a DEL licence. Without one, nobody
  // moves at all.
  { upper: 'DEL', lower: 'DEL2', kind: 'licence', licence: 0.85 },
  // The Swiss League champion has to qualify for the National League first,
  // and if it does, it plays the NL's last club in a best-of-seven League
  // Qualification.
  { upper: 'SWISS', lower: 'SL', kind: 'qualifier', eligible: 0.5, upperHolds: 0.6 },
  // Norway's ninth and tenth and the top two from HockeyLiga1 play a mini
  // league for two places in the EHL.
  { upper: 'EHL', lower: 'NOR1', kind: 'mini', places: 2, upperHolds: 0.65 }
];

// A league's clubs from top to bottom, his own at the place he finished.
const tableOf = (lg, state, me) => {
  const order = (getOpponentPool(lg) || [])
    .map(t => ({ id: t.id, s: teamStrengthOf(state, t.id) + gaussianNoise() * 0.12 }))
    .sort((a, b) => b.s - a.s)
    .map(r => r.id);
  if (!me || me.league !== lg || !order.includes(me.team)) return order;
  const rest = order.filter(id => id !== me.team);
  const at = Math.max(0, Math.min(rest.length, (me.standing || 1) - 1));
  rest.splice(at, 0, me.team);
  return rest;
};

// Who won the lower league. His club if he won it, never his club if he
// didn't, and otherwise most likely the best team in it.
const championOf = (order, lg, me) => {
  if (me?.league === lg && me.title && order.includes(me.team)) return me.team;
  const field = order.filter(id => !(me?.league === lg && id === me.team));
  const r = Math.random();
  return field[r < 0.45 ? 0 : r < 0.7 ? 1 : r < 0.85 ? 2 : 3] || field[0] || null;
};

const nameList = (ids, lg) => {
  const names = ids.map(id => getFullTeamName(id, lg));
  if (names.length <= 1) return names[0] || '';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
};

/**
 * One summer of it. Returns the new moves for the save, where his own club
 * is going if it's going anywhere, and a line of news for each pair he can
 * see from where he plays.
 */
export function runProRel({ summer, leagueState, moves, me }) {
  const decided = [];
  const news = [];

  PRO_REL.forEach(rule => {
    const up = tableOf(rule.upper, leagueState, me);
    const low = tableOf(rule.lower, leagueState, me);
    if (!up.length || !low.length) return;
    let goingDown = [];
    let goingUp = [];
    let line = null;
    const upperName = formatLeagueName(rule.upper);
    const lowerName = formatLeagueName(rule.lower);

    if (rule.kind === 'direct') {
      const { down, up: ups } = rule.counts ? rule.counts(summer) : rule;
      goingDown = up.slice(-down);
      const champ = ups ? championOf(low, rule.lower, me) : null;
      goingUp = champ ? [champ] : [];
      line = goingUp.length
        ? `${nameList(goingDown, rule.upper)} go down to ${lowerName}, and ${nameList(goingUp, rule.lower)} come up as champions.`
        : `${nameList(goingDown, rule.upper)} go down to ${lowerName}. Nobody comes up this year, because ${upperName} is getting smaller.`;
    } else if (rule.kind === 'series') {
      const [a, b] = up.slice(-2);
      // Thirteenth has home ice and usually wins it.
      const loser = Math.random() < 0.6 ? b : a;
      const winner = loser === a ? b : a;
      goingDown = [loser];
      const champ = championOf(low, rule.lower, me);
      goingUp = champ ? [champ] : [];
      line = `${getFullTeamName(winner, rule.upper)} beat ${getFullTeamName(loser, rule.upper)} to stay up, and ${getFullTeamName(loser, rule.upper)} drop to ${lowerName}.${goingUp.length ? ` ${getFullTeamName(goingUp[0], rule.lower)} won ${lowerName} and come up.` : ''}`;
    } else if (rule.kind === 'licence') {
      const champ = championOf(low, rule.lower, me);
      if (champ && Math.random() < rule.licence) {
        goingUp = [champ];
        goingDown = up.slice(-1);
        line = `${getFullTeamName(champ, rule.lower)} won ${lowerName} with a licence in hand and go up. ${getFullTeamName(goingDown[0], rule.upper)} go down.`;
      } else if (champ) {
        line = `${getFullTeamName(champ, rule.lower)} won ${lowerName} but didn't get a licence for ${leagueWithArticle(rule.upper)}, so nobody goes up or down.`;
      }
    } else if (rule.kind === 'qualifier') {
      const champ = championOf(low, rule.lower, me);
      const last = up[up.length - 1];
      if (champ && Math.random() < rule.eligible) {
        if (Math.random() < rule.upperHolds) {
          line = `${getFullTeamName(last, rule.upper)} beat ${getFullTeamName(champ, rule.lower)} in the League Qualification and stay in ${leagueWithArticle(rule.upper)}.`;
        } else {
          goingUp = [champ];
          goingDown = [last];
          line = `${getFullTeamName(champ, rule.lower)} beat ${getFullTeamName(last, rule.upper)} in the League Qualification. They go up and ${getFullTeamName(last, rule.upper)} go down.`;
        }
      } else if (champ) {
        line = `${getFullTeamName(champ, rule.lower)} won ${leagueWithArticle(rule.lower)} but didn't meet the National League's requirements, so there's no League Qualification this year.`;
      }
    } else if (rule.kind === 'mini') {
      const bottom = up.slice(-rule.places);
      const tops = low.slice(0, rule.places);
      goingDown = bottom.filter(() => Math.random() > rule.upperHolds);
      goingUp = tops.slice(0, goingDown.length);
      line = goingDown.length
        ? `In the qualification, ${nameList(goingUp, rule.lower)} won ${goingUp.length === 1 ? 'a place' : 'places'} in ${leagueWithArticle(rule.upper)}, and ${nameList(goingDown, rule.upper)} go down.`
        : `${nameList(bottom, rule.upper)} held on in the qualification, and ${leagueWithArticle(rule.upper)} keeps the same ten clubs.`;
    }

    goingDown.forEach(id => decided.push({ id, from: rule.upper, to: rule.lower }));
    goingUp.forEach(id => decided.push({ id, from: rule.lower, to: rule.upper }));
    if (line && me && [rule.upper, rule.lower].includes(me.league)) {
      news.push(line);
    }
  });

  // All at once, so a club can't move twice in one summer.
  const next = { ...(moves || {}) };
  let mine = null;
  decided.forEach(({ id, from, to }) => {
    const home = homeLeagueOf(id, countryProLeagues(LEAGUE_COUNTRY[from])) || from;
    const key = `${home}:${id}`;
    if (to === home) delete next[key];
    else next[key] = to;
    if (me && me.team === id && me.league === from) {
      const ladder = countryProLeagues(LEAGUE_COUNTRY[from]);
      mine = { dir: ladder.indexOf(to) < ladder.indexOf(from) ? 'up' : 'down', from, to };
    }
  });
  setClubMoves(next);
  return { moves: next, mine, news };
}
