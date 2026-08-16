import React, { useEffect, useState } from 'react';
import { getTeamData, nhlTeams } from '../data/teams';

// Extracted from App.jsx. Pure component; dependencies imported explicitly.
const TeamLogo = ({ teamId, league, isAHL, size = "normal", className = "" }) => {
  const [imgError, setImgError] = useState(false);

  // RESET ERROR STATE WHEN CHANGING TEAMS
  useEffect(() => {
    setImgError(false);
  }, [teamId]);

  const isNHL = league === 'NHL' && !isAHL && (nhlTeams || []).some(t => t.id === teamId);  
  let team = getTeamData(teamId, league);
  const finalLogoUrl = team ? team.logo : null;

  // Standardized container sizing across components
  const containerSize = size === "small" 
    ? "w-8 h-8 sm:w-10 sm:h-10" 
    : size === "large" 
      ? "w-12 h-12 sm:w-16 sm:h-16" 
      : "w-10 h-10 sm:w-14 sm:h-14";

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
