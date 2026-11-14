import { leagueFlag, leagueLabel } from '../utils/peers';

/**
 * A league, as its flag and its code.
 *
 * Spelling the country out in text ("U20 FIN", "DNL GER") was accurate and was
 * also another five words of grey capitals on boards that are mostly grey
 * capitals already. The flag carries the country, the code carries the league,
 * and it is the same artwork the creation screen picks a nationality with, so
 * a player who has chosen a flag once recognises it everywhere afterwards.
 *
 * Returns the pair as a fragment rather than a styled element, so each board
 * keeps control of its own column: the caller supplies the flex container, the
 * width and the type size.
 *
 * The NHL and the AHL have no flag, because they are two countries' leagues
 * and either flag alone would be wrong. They get an empty box the same size
 * instead, so a column of codes stays in line.
 */
export default function LeagueTag({ league, flagClass = 'w-[14px] h-[10px]' }) {
  if (!league) return <span className="text-slate-600">&mdash;</span>;
  const flag = leagueFlag(league);
  return (
    <>
      {flag
        ? <img src={flag} alt="" className={`${flagClass} shrink-0 object-cover rounded-[1px]`} />
        : <span className={`${flagClass} shrink-0`} aria-hidden="true" />}
      <span className="truncate">{leagueLabel(league)}</span>
    </>
  );
}
