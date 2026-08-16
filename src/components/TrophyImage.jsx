import React, { useState } from 'react';
import { getPlayoffTrophyImage } from '../data/awards';

// Extracted from App.jsx. Pure component; dependencies imported explicitly.
const TrophyImage = ({ league, className = "w-24 h-24 sm:w-32 sm:h-32" }) => {
  const [imgError, setImgError] = useState(false);
  
  // Use the custom trophy image, or fallback to a generic cup if it's an unsupported league
  const src = getPlayoffTrophyImage(league) || 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Golden_Cup_with_star.svg/250px-Golden_Cup_with_star.svg.png';

  if (imgError) {
    return (
      <div className={`flex items-center justify-center text-6xl sm:text-7xl drop-shadow-2xl ${className}`}>
        🏆
      </div>
    );
  }

  return (
    <img 
      src={src} 
      alt={`${league} Championship Trophy`} 
      className={`object-contain drop-shadow-[0_10px_20px_rgba(255,255,255,0.25)] ${className}`}
      onError={() => setImgError(true)}
    />
  );
};

export default TrophyImage;
