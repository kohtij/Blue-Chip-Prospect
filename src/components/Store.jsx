import { useRef, useState } from 'react';
import { useDialog } from '../utils/a11y';
import { shopItems } from '../data/economy';
import { formatMoney } from '../utils/gameHelpers';
import { NEUTRAL_PILL, NEUTRAL_PILL_DIM, statCode, statPillClass } from '../utils/statColors';

// The store.
//
// This was a left-hand drawer holding three stacked sections, each item a tall
// card with its own full-width BUY button underneath it. Four items filled the
// screen, fourteen meant scrolling past a dozen identical blue buttons, and the
// only way to find what you could afford was to read every price on the way
// down. It also called itself SHOP and showed a number with no label, which
// happens to be career earnings doubling as the balance.
//
// Now: the balance is stated and named, the three kinds of thing are tabs
// rather than a scroll, and each item is one row. Affordable rows are live and
// say what they cost; the rest say how much short you are. Rows are sorted by
// price so the ones within reach sit at the top.

const SHELVES = [
  { id: 'staff', label: 'Staff', blurb: 'People you hire once. What they give you, you keep.' },
  { id: 'consumable', label: 'Boosts', blurb: 'Bought for a season or two, then gone.' },
  { id: 'luxury', label: 'Lifestyle', blurb: 'What the money buys you away from the rink. Mostly fame, occasionally more.' }
];

// What an item does, in the shortest honest form, for the chips on its row.
//
// An attribute chip carries that attribute's colour, the same one the training
// cards and the player card use. Everything else is neutral, so a coloured
// chip always means one of the five.
const effectChips = (item, isGoalie) => {
  const e = item.effect || {};
  const chips = ['stamina', 'hockeyIQ', 'physicality', 'shooting', 'skating']
    .filter(k => e[k])
    .map(k => {
      const code = statCode(k, isGoalie);
      return { text: `+${e[k]} ${code}`, code };
    });
  if (e.fanStatus) chips.push({ text: `+${e.fanStatus} fans`, code: null });
  if (e.salaryModifier) chips.push({ text: `+${Math.round((e.salaryModifier - 1) * 100)}% offers`, code: null });
  if (e.declineModifier) chips.push({ text: 'Slows decline', code: null });
  return chips;
};

// A fan-status bump is a one-off award, so nothing about it persists. Anything
// else with no duration is a gain the player keeps for the rest of the career.
const lastsForever = (item) => {
  if (item.duration) return false;
  return Object.keys(item.effect || {}).some(k => k !== 'fanStatus');
};

export default function Store({ player, onBuy, onClose }) {
  const [shelf, setShelf] = useState('staff');
  const bank = player.stats?.earnings || 0;
  const isGoalie = player.pos === 'G';

  const owned = (item) =>
    (player.inventory || []).includes(item.id) || (player.buffs || []).some(b => b.id === item.id);

  // Cheapest first, and that is the whole rule.
  //
  // Owned items used to sink to the bottom, which sounded tidy and was not:
  // buying something made the row you had just pressed jump somewhere else
  // and shoved every row below it up a place, so the next thing you wanted
  // was no longer where you had been looking. The list holds still now.
  const items = (shopItems || [])
    .filter(i => i.type === shelf)
    .sort((a, b) => a.cost - b.cost);

  const shelfMeta = SHELVES.find(s => s.id === shelf);
  const panelRef = useRef(null);
  useDialog(panelRef, onClose);

  return (
    <div className="fixed inset-0 z-50 flex justify-start bg-black/50 p-3 sm:p-4 backdrop-blur-[2px]" onClick={onClose}>
      <div
        ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="store-title"
        className="w-full max-w-md game-panel h-full flex flex-col border border-[rgba(255,255,255,0.1)] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* The balance, named. A big green number on its own was the one thing
            you could not interpret: it is career earnings, and it is what you
            are spending. */}
        <div className="px-5 pt-5 pb-4 bg-[#101410] border-b border-[rgba(255,255,255,0.065)] shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="store-title" className="text-xl font-black text-white sports-font tracking-wide uppercase leading-none">The Store</h2>
              <p className="text-[10px] text-slate-500 font-bold mt-1.5">Career earnings are what you spend here.</p>
            </div>
            <button
              type="button" onClick={onClose}
              className="text-slate-500 hover:text-white text-xl leading-none -mt-2 -mr-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg cursor-pointer"
              aria-label="Close the store"
            >
              ×
            </button>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black number-font text-[#22E748] leading-none">{formatMoney(bank)}</span>
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">in the bank</span>
          </div>
        </div>

        <div className="px-4 pt-3 shrink-0">
          <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[#0a0d0a] border border-[rgba(255,255,255,0.06)]">
            {SHELVES.map(s => {
              const n = (shopItems || []).filter(i => i.type === s.id && !owned(i)).length;
              return (
                <button
                  key={s.id} type="button" onClick={() => setShelf(s.id)} aria-pressed={shelf === s.id}
                  className={`py-2 rounded-lg text-[10px] font-black uppercase tracking-[0.14em] transition-colors cursor-pointer ${
                    shelf === s.id ? 'bg-[#151b15] text-white shadow-inner' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  {s.label}{n > 0 && <span className="text-slate-600 font-bold"> {n}</span>}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-slate-500 font-bold mt-2.5 px-0.5 leading-snug">{shelfMeta.blurb}</p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {items.map(item => {
            const isOwned = owned(item);
            const canAfford = bank >= item.cost;
            const short = item.cost - bank;
            const chips = effectChips(item, isGoalie);
            const desc = isGoalie && item.descGoalies ? item.descGoalies : (item.descSkaters || item.desc);

            return (
              <button
                key={item.id}
                type="button"
                disabled={isOwned || !canAfford}
                onClick={() => onBuy(item)}
                className={`w-full text-left p-3.5 rounded-xl border transition-colors ${
                  isOwned
                    ? 'border-[#22E748]/40 bg-[#22E748]/[0.07] cursor-default'
                    : canAfford
                      ? 'border-[rgba(255,255,255,0.1)] bg-[#101410] hover:border-[#22E748]/60 hover:bg-[#22E748]/[0.06] cursor-pointer'
                      : 'border-[rgba(255,255,255,0.05)] bg-[#0d100d] cursor-not-allowed'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className={`font-black text-sm sports-font uppercase tracking-wide leading-tight ${
                    isOwned ? 'text-[#22E748]' : canAfford ? 'text-white' : 'text-slate-500'}`}>
                    {item.name}
                  </p>
                  <span className={`shrink-0 font-black number-font text-sm leading-tight ${
                    isOwned ? 'text-[#22E748]' : canAfford ? 'text-slate-200' : 'text-slate-600'}`}>
                    {isOwned ? (item.duration ? '✓ Running' : '✓ Owned') : formatMoney(item.cost)}
                  </span>
                </div>

                <p className={`text-[11px] mt-1 leading-snug ${canAfford || isOwned ? 'text-slate-400' : 'text-slate-600'}`}>
                  {desc}
                </p>

                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  {chips.map(c => (
                    <span key={c.text} className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${
                      !isOwned && !canAfford
                        ? NEUTRAL_PILL_DIM
                        : c.code ? statPillClass(c.code) : NEUTRAL_PILL}`}>
                      {c.text}
                    </span>
                  ))}
                  {/* How long it lasts. The old cards never said. A season
                      count for the boosts, and "permanent" wherever an
                      attribute gain never expires. */}
                  {item.duration ? (
                    <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${
                      !isOwned && !canAfford ? NEUTRAL_PILL_DIM : NEUTRAL_PILL}`}>
                      {item.duration} season{item.duration === 1 ? '' : 's'}
                    </span>
                  ) : lastsForever(item) ? (
                    <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${
                      !isOwned && !canAfford ? NEUTRAL_PILL_DIM : NEUTRAL_PILL}`}>
                      Permanent
                    </span>
                  ) : null}
                  {/* The right-hand end of the chip row says what pressing
                      the row does, since the row is the control now and there is
                      no BUY button to point at. */}
                  {!isOwned && (
                    <span className={`text-[9px] font-bold ml-auto ${canAfford ? 'text-[#22E748]' : 'text-slate-500'}`}>
                      {canAfford ? 'Tap to buy' : `${formatMoney(short)} short`}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="p-4 bg-[#101410] border-t border-[rgba(255,255,255,0.065)] shrink-0">
          <button
            type="button" onClick={onClose}
            className="w-full bg-[#151b15] hover:bg-[#1c241c] border border-[rgba(255,255,255,0.065)] text-white py-3 rounded-xl font-black sports-font uppercase tracking-[0.16em] text-xs transition-colors cursor-pointer"
          >
            Back to the rink
          </button>
        </div>
      </div>
    </div>
  );
}
