import { countryProLeagues, euroLeagues, homeLeagueOf, LEAGUE_COUNTRY } from '../data/teams';

// HOW A CLUB IS REMEMBERED.
//
// Club ids are shared across leagues: VAN is the Canucks and the WHL's
// Vancouver Giants, OTT the Senators and the 67's, and 49 ids in all. A list
// of bare ids couldn't tell them apart, so a Canuck had "CHL history" and a
// Giant had "played for" the Canucks. Anything that remembers a club keeps
// its league with it, as "LEAGUE:ID".
//
// A European club that's been promoted or relegated keeps the league it's
// written in, so HIFK is the same club in Liiga and in Mestis.

const homeOf = (team, league) => (euroLeagues.includes(league)
  ? homeLeagueOf(team, countryProLeagues(LEAGUE_COUNTRY[league])) || league
  : league);

/** The key a club is remembered by. */
export const clubKey = (team, league) => `${homeOf(team, league)}:${team}`;

/** The club and league a key stands for. */
export const clubOf = (key) => {
  const at = String(key).indexOf(':');
  return at < 0 ? { league: null, team: key } : { league: key.slice(0, at), team: key.slice(at + 1) };
};

/** A list of clubs with this one added, once. */
export const withClub = (list, team, league) => (team && league
  ? [...new Set([...(list || []), clubKey(team, league)])]
  : (list || []));

/** Whether he's played for this club, in this league. */
export const hasPlayedFor = (player, team, league) => (player?.teamsPlayedFor || []).includes(clubKey(team, league));

/** Whether he's played for any club in these leagues. */
export const playedInLeagues = (player, leagues) => (player?.teamsPlayedFor || []).some(k => leagues.includes(clubOf(k).league));
