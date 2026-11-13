// WHO HAS TO GO THROUGH WAIVERS.
//
// There were three answers to this question in three files, and none of them
// matched. Camp cuts counted every season he had ever played, junior ones
// included, so a twenty-year-old in the first year of his entry-level deal
// was treated as a veteran and could be claimed. The end-of-season move
// looked at his salary. The in-season placement looked at whether he was
// under twenty-seven. A player could be claimed in one place and walk
// through in another, in the same career.
//
// This is the one rule now, and it is the real one in outline. A player is
// exempt until he has either played enough professional seasons or enough
// NHL games, whichever comes first, and both limits depend on how old he was
// when he turned pro. A goalie gets longer, because goalies take longer.
// Anyone on his entry-level contract is exempt, which is the case people
// actually remember.

// [pro seasons, NHL games], by the age he was in his first pro season.
const SKATER = { 18: [5, 160], 19: [4, 160], 20: [3, 160], 21: [3, 80], 22: [2, 60], 23: [2, 60], 24: [2, 60] };
const GOALIE = { 18: [6, 80], 19: [5, 80], 20: [4, 80], 21: [4, 60], 22: [3, 60], 23: [3, 60], 24: [2, 60] };
const OLDER = [1, Infinity];

const PRO = ['NHL', 'AHL', 'ECHL'];
export const ELC_SALARY = 925000;

// Pro games in one season of the history. A season split between junior and
// the NHL only counts its pro half.
function proGames(season) {
  if (Array.isArray(season.stints) && season.stints.length) {
    return season.stints.filter(st => PRO.includes(st.league)).reduce((n, st) => n + (st.games || 0), 0);
  }
  return PRO.includes(season.league) ? (season.games || 0) : 0;
}

// A season only counts against the clock if he played a real part of it. The
// rule uses eleven games, which is also why a nine-game look does not cost a
// teenager a year.
export function proSeasonsOf(player) {
  return (player.seasonHistory || []).filter(s => proGames(s) >= 11).length;
}

export function waiverExempt(player) {
  if (!player) return true;
  if (player.contract?.salary === ELC_SALARY) return true;

  const hist = player.seasonHistory || [];
  const firstPro = hist.findIndex(s => proGames(s) >= 11);
  // Never played a pro season: exempt by definition.
  if (firstPro < 0) return true;

  // Each finished season is a year behind him, so the age he was in the first
  // pro one is today's age less the seasons since.
  const turnedProAt = (player.age || 20) - (hist.length - firstPro);
  const table = player.pos === 'G' ? GOALIE : SKATER;
  const [years, games] = table[Math.max(18, turnedProAt)] || OLDER;

  const nhlGames = player.stats?.nhl?.games || 0;
  return proSeasonsOf(player) < years && nhlGames < games;
}
