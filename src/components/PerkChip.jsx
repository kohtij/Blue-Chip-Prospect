// One perk or flaw as a line in a list instead of a boxed tag. A small arrow
// says which way it cuts, the name reads in normal case so it fits, and the
// effect sits right-aligned in the number face so the column lines up. The
// card groups perks and flaws in their own tinted blocks, so no rules are
// needed between lines.
import { splitPerk } from '../data/offerPerks';

const EMOJI = /^[\p{Extended_Pictographic}\u{FE0F}\u{200D}\s]+/u;

export default function PerkChip({ perk, isFlaw = false, cell = false }) {
  const { name, effect } = splitPerk(perk);
  const clean = String(name || '').replace(EMOJI, '');
  const tone = isFlaw ? '#ef4444' : '#22E748';

  // A perk on an event option, laid out in a row beside the others. As loose
  // lines in a row ("Appearance Fee $50K Locker Room -10 TEAM") the arrows
  // and figures ran together and it wasn't clear which number went with which
  // name, so each one sits in a tinted cell of its own: green for what you
  // get, red for what it costs.
  if (cell) {
    return (
      <span
        className={`inline-flex items-baseline gap-2 rounded-md px-2.5 py-1.5 leading-tight ${isFlaw ? 'bg-[#ef4444]/[0.10]' : 'bg-[#22E748]/[0.08]'}`}
        title={effect ? `${clean} (${effect})` : clean}
      >
        <span className="text-[12px] font-semibold text-slate-200">{clean}</span>
        {effect && <span className="number-font text-[12px] whitespace-nowrap" style={{ color: tone }}>{effect}</span>}
      </span>
    );
  }

  return (
    <span
      className="flex items-center gap-2 py-1 leading-tight w-full"
      title={effect ? `${clean} (${effect})` : clean}
    >
      <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden="true" className="shrink-0">
        {isFlaw ? <path d="M1 2h8L5 9z" fill={tone} /> : <path d="M5 1l4 7H1z" fill={tone} />}
      </svg>
      <span className="text-[12px] font-semibold text-slate-200 min-w-0 flex-1">{clean}</span>
      {effect && (
        <span className="number-font text-[12px] leading-tight text-right ml-auto max-w-[48%]" style={{ color: tone }}>
          {effect}
        </span>
      )}
    </span>
  );
}
