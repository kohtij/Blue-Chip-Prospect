// One perk or flaw on an offer card.
//
// These used to be a single run of text in a pill, and on a card about 150px
// wide a line like "CROWDED ROSTER (-1 OVR)" wrapped onto a second line, so the
// cards came out ragged and different heights. The chip now lays the name and
// its effect out as two parts of one row: the name on the left, the effect
// right-aligned and never allowed to wrap or shrink, because the number is the
// part you are actually comparing between offers.
//
// Older perks that carry a single `text` string, including the ones built inline
// by the trade and transfer events, are split on their trailing parenthesis so
// they get the same treatment without having to be rewritten.
import { splitPerk } from '../data/offerPerks';

const GOOD = 'text-[#22E748] bg-[#22E748]/10 border-[#22E748]/30';
const BAD = 'text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]/30';

// `inline` shrinks the chip to its content instead of filling the row. The
// full-width form is right in an offer card, where chips stack and their
// numbers line up in a column; it is wrong on an event choice, where a lone
// chip stretched across the card and left the right half of it empty.
export default function PerkChip({ perk, isFlaw = false, inline = false }) {
  const { name, effect } = splitPerk(perk);
  const tone = isFlaw ? BAD : (perk?.color || GOOD);

  return (
    <span
      className={`flex items-center gap-1 text-[9px] sm:text-[10px] px-1.5 py-1 rounded font-black tracking-normal uppercase border leading-none ${inline ? 'w-auto gap-2' : 'w-full'} ${tone}`}
      title={effect ? `${name} (${effect})` : name}
    >
      <span className={inline ? 'whitespace-nowrap' : 'truncate min-w-0'}>{name}</span>
      {effect && <span className={`shrink-0 whitespace-nowrap opacity-95 ${inline ? '' : 'ml-auto'}`}>{effect}</span>}
    </span>
  );
}
