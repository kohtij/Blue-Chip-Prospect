// One colour per attribute, for the whole game.
//
// The training screen had this table inline and nothing else did, so the same
// attribute was amber on a training card and green on a shop row, and the
// colour stopped meaning anything. It lives here now and every pill that names
// an attribute reads from it.
//
// Colour means attribute. Anything that is not an attribute (fan status, a
// contract modifier, a duration) gets the neutral class below, so a coloured
// pill always tells you which of the five you are looking at.
//
// The class strings are written out in full rather than built from a hex at
// run time, because Tailwind scans this file as text: a template string would
// generate no CSS and every pill would come out unstyled.

export const STAT_PILL = {
  PHY: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30',
  POW: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30',
  AGI: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30',
  SKT: 'text-[#22E748] bg-[#22E748]/10 border-[#22E748]/30',
  POS: 'text-[#22E748] bg-[#22E748]/10 border-[#22E748]/30',
  SHT: 'text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/30',
  REF: 'text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/30',
  IQ: 'text-[#c084fc] bg-[#c084fc]/10 border-[#c084fc]/30',
  MIND: 'text-[#c084fc] bg-[#c084fc]/10 border-[#c084fc]/30',
  STM: 'text-[#06b6d4] bg-[#06b6d4]/10 border-[#06b6d4]/30',
  STA: 'text-[#06b6d4] bg-[#06b6d4]/10 border-[#06b6d4]/30',
  ALL: 'text-white bg-white/20 border-white/60 drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]'
};

// Just the text colour, for a label that sits on its own without a pill
// around it.
export const STAT_TEXT = {
  PHY: 'text-[#F59E0B]', POW: 'text-[#F59E0B]', AGI: 'text-[#F59E0B]',
  SKT: 'text-[#22E748]', POS: 'text-[#22E748]',
  SHT: 'text-[#3b82f6]', REF: 'text-[#3b82f6]',
  IQ: 'text-[#c084fc]', MIND: 'text-[#c084fc]',
  STM: 'text-[#06b6d4]', STA: 'text-[#06b6d4]'
};

// For a pill that is not an attribute: a duration, a fan-status award, a
// contract modifier.
export const NEUTRAL_PILL = 'text-slate-300 bg-slate-500/10 border-[rgba(255,255,255,0.14)]';
export const NEUTRAL_PILL_DIM = 'text-slate-600 bg-slate-800/40 border-[rgba(255,255,255,0.06)]';

export const statPillClass = (code) => STAT_PILL[code] || NEUTRAL_PILL;

// The attribute keys the player object uses, mapped to the short code a
// skater or a goalie sees. A goalie's physicality is his agility, his
// shooting is his reflexes, his skating is his positioning.
export const statCode = (key, isGoalie) => ({
  shooting: isGoalie ? 'REF' : 'SHT',
  skating: isGoalie ? 'POS' : 'SKT',
  physicality: isGoalie ? 'AGI' : 'POW',
  hockeyIQ: 'IQ',
  stamina: 'STM'
}[key] || null);
