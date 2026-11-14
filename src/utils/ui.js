// THE GAME'S TYPE SCALE FOR SCREEN TITLES.
//
// Titles came in about twenty-five styles: italic on some screens and upright
// on others, white, blue, amber, purple or red depending on who wrote the
// screen, and at half a dozen sizes. A title is white and upright now, at one
// of three sizes, and colour belongs to the kicker above it, never to the
// title itself.
//
//   TITLE_LG  a moment: a minigame brief, the draft, a combine test
//   TITLE_MD  a screen: free agency, the recap, the preseason
//   TITLE_SM  an event card, where the story underneath is the point
const TITLE = 'font-black text-white sports-font tracking-tighter uppercase leading-[0.95] text-balance';
export const TITLE_LG = `text-3xl sm:text-5xl ${TITLE}`;
export const TITLE_MD = `text-2xl sm:text-4xl ${TITLE}`;
export const TITLE_SM = `text-xl sm:text-2xl ${TITLE}`;

// The pill above a title. Same shape as the minigame stakes chip, so every
// screen announces itself the same way.
export const KICKER_TONES = {
  neutral: 'text-slate-400 border-[rgba(255,255,255,0.10)] bg-[#0a0d0a]',
  green: 'text-[#22E748] border-[#22E748]/35 bg-[#22E748]/[0.07]',
  amber: 'text-[#F59E0B] border-[#F59E0B]/40 bg-[#F59E0B]/[0.07]',
  red: 'text-[#ef4444] border-[#ef4444]/50 bg-[#ef4444]/10',
  blue: 'text-[#60a5fa] border-[#3b82f6]/40 bg-[#3b82f6]/[0.08]'
};
export const kickerClass = (tone = 'neutral') =>
  `inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] sm:text-xs font-black uppercase tracking-[0.18em] ${KICKER_TONES[tone] || KICKER_TONES.neutral}`;

// The small tags that sit on a choice: risky, a cost, a boost. One shape.
export const TAG = 'text-[10px] sm:text-xs px-2 py-1 rounded font-black tracking-widest uppercase border whitespace-nowrap';
export const TAG_RED = `${TAG} bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/30`;
export const TAG_AMBER = `${TAG} bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30`;
export const TAG_GREEN = `${TAG} bg-[#22E748]/10 text-[#22E748] border-[#22E748]/30`;

// A choice the player makes on an event or a decision screen: one row, a
// title, a line under it, tags on the right.
export const CHOICE_ROW = 'relative overflow-hidden group p-4 sm:p-5 rounded-xl text-left transition-colors flex flex-col justify-center h-full border bg-[#101410] text-white border-[rgba(255,255,255,0.08)] hover:bg-[#151b15] hover:border-[rgba(255,255,255,0.22)] cursor-pointer';
