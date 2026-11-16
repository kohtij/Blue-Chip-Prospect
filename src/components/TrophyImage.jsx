import { useState } from 'react';
import { getPlayoffTrophyImage } from '../data/awards';
import TrophySVG from './TrophySVG';

// A league's championship trophy: the real picture where one exists, and the
// game's own drawing where it doesn't (the USHL's Clark Cup, the NCAA, the
// European leagues) or where the picture fails to load.
//
// The fallback used to be a 🏆 emoji set at a fixed, large font size. It
// ignored the size it was given, so in a small tile or a table chip it spilled
// out of its box and over the text beside it. The drawing takes the box it's
// given, like the picture does.
const TrophyImage = ({ league, className = "w-24 h-24 sm:w-32 sm:h-32" }) => {
  const [imgError, setImgError] = useState(false);
  const src = getPlayoffTrophyImage(league);

  if (!src || imgError) {
    return <TrophySVG league={league} className={className} />;
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
