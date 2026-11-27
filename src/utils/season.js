// THE CALENDAR, AND THE NHL MONEY THE CBA FIXES.
//
// The year used to be worked out as 2026 plus seasons played in some twenty-five
// places, and the minimum and entry-level salaries were typed out wherever they
// were needed. That's how the mid-season extension came to price itself off the
// wrong year, and how the minimum stayed at $850K in 2028 after rising to $900K
// in 2027. Everything reads them from here now.

// A career opens in the 2026-27 season, and a season is named by the year it
// starts in.
export const FIRST_SEASON = 2026;

/** The season he's in, or the summer after it, by the year it starts. */
export const seasonYear = (player) => FIRST_SEASON + (player?.stats?.seasonsPlayed || 0);

// The league minimum under the 2025 CBA, by season. It reaches $1M in 2029-30
// and stays there.
const MINIMUM_BY_SEASON = { 2026: 850000, 2027: 900000, 2028: 950000 };
export const MINIMUM_FROM_2029 = 1000000;

/** The NHL league minimum salary in a given season. */
export const leagueMinimumFor = (year) => MINIMUM_BY_SEASON[year] ?? (year < FIRST_SEASON ? MINIMUM_BY_SEASON[FIRST_SEASON] : MINIMUM_FROM_2029);

/**
 * What an entry-level contract pays. The 2025 CBA caps it at $1M for the 2026
 * draft and at the league minimum plus $175K after that. Every ELC in the game
 * is signed at the cap.
 */
export const elcSalaryFor = (year) => (year <= FIRST_SEASON ? 1000000 : leagueMinimumFor(year) + 175000);

// Every ELC used to be $925K, and the game told an ELC apart by that number.
// A contract now says so itself; the old figure is still recognised.
const OLD_ELC_SALARY = 925000;

/** Whether a contract is an entry-level deal. */
export const isElc = (contract) => !!contract?.elc || contract?.salary === OLD_ELC_SALARY;
