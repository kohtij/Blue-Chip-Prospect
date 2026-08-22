import { useState } from 'react';
import { getTeamData, nhlTeams } from '../data/teams';

// Extracted from App.jsx. Pure component; dependencies imported explicitly.
const TeamLogo = ({ teamId, league, isAHL, size = "normal", className = "" }) => {
  const [imgError, setImgError] = useState(false);
  const [prevTeamId, setPrevTeamId] = useState(teamId);

  // RESET ERROR STATE WHEN CHANGING TEAMS (React 18+ safe pattern)
  if (teamId !== prevTeamId) {
    setPrevTeamId(teamId);
    setImgError(false);
  }

  const isNHL = league === 'NHL' && !isAHL && (nhlTeams || []).some(t => t.id === teamId);  
  let team = getTeamData(teamId, league);
  const finalLogoUrl = team ? team.logo : null;

  // Standardized container sizing across components (SCALED UP)
  const containerSize = size === "small" 
    ? "w-10 h-10 sm:w-12 sm:h-12" 
    : size === "large" 
      ? "w-16 h-16 sm:w-24 sm:h-24" 
      : "w-12 h-12 sm:w-16 sm:h-16";

  if (isNHL && !imgError) {
    return (
      <div className={`relative ${containerSize} flex items-center justify-center shrink-0 overflow-visible ${className}`}>
        {/* scale-[1.28] counteracts built-in SVG viewBox padding from NHL.com */}
        <img
          src={`https://assets.nhle.com/logos/nhl/svg/${teamId}_light.svg`}
          alt={teamId}
          className="w-full h-full object-contain drop-shadow-lg scale-[1.28] transform-gpu"
          onError={(e) => { e.target.style.display = 'none'; setImgError(true); }}
        />
      </div>
    );
  }

  if (finalLogoUrl && !imgError) {
    return (
      <div className={`relative ${containerSize} flex items-center justify-center shrink-0 ${className}`}>
        {/* p-0.5 keeps tightly cropped junior logos proportionally balanced */}
        <img
          src={finalLogoUrl}
          alt={teamId}
          className="w-full h-full object-contain drop-shadow-lg p-0.5"
          onError={(e) => { e.target.style.display = 'none'; setImgError(true); }}
        />
      </div>
    );
  }

  return (
    <div 
      className={`relative ${containerSize} rounded-full flex items-center justify-center font-black text-[8px] sm:text-xs border-2 sports-font shadow-lg shrink-0 text-center leading-none overflow-hidden ${className}`} 
      style={{ backgroundColor: team?.bg || '#101410', color: team?.color || '#FFF', borderColor: team?.color || '#FFF' }}
    >
      {teamId}
    </div>
  );
};

export default TeamLogo;