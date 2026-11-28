import { useState } from 'react';
import { LEAGUE_CONFIG } from '../data/teams';
import { leagueLabel } from '../utils/peers';
import { isImageRetry } from '../utils/images';

/**
 * A league's logo.
 *
 * A league with no logo, or one whose image fails to load, shows its code
 * instead, in whatever type the caller's element sets, so a row never ends up
 * with a blank where the league should be. `fallback={false}` shows nothing
 * in that case, for places where the league is already named nearby, and any
 * other element passed as `fallback` is shown in its place.
 */
export default function LeagueLogo({ league, className = 'w-6 h-6', fallback = true }) {
  const src = league ? LEAGUE_CONFIG[league]?.logo || null : null;
  const [failed, setFailed] = useState(null);
  if (!league) return null;
  if (!src || failed === src) {
    if (fallback === true) return <span className="break-words">{leagueLabel(league)}</span>;
    return fallback || null;
  }
  const name = LEAGUE_CONFIG[league]?.name || leagueLabel(league);
  return (
    <img
      src={src}
      alt={name}
      title={name}
      className={`${className} shrink-0 object-contain`}
      onError={(e) => { if (!isImageRetry(e)) setFailed(src); }}
    />
  );
}
