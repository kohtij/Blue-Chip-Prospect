// The furniture every minigame sits in.
//
// Each of the thirteen games used to print its own headline, its own paragraph
// of instructions, its own score readout and its own result message, in its own
// colours. Two of them printed the title a second time underneath the one the
// screen had already drawn. This is that chrome, once: the moment is announced
// the same way, the count is kept the same way, and the verdict lands in the
// same place whichever game you are playing.
//
// Nothing in here knows what the game is. It takes the ice as a child.

// Stat names as the game shows them, so a game can say what it is testing you on
// without hardcoding a label.
const STAT_LABEL = {
  shooting: 'SHOOTING',
  skating: 'SKATING',
  physicality: 'PHYSICALITY',
  hockeyIQ: 'HOCKEY IQ',
  stamina: 'STAMINA'
};

// --- the stakes chip -------------------------------------------------------
// The old one was an amber warning triangle on everything from training camp to
// a gold medal game. What the moment is worth should be legible at a glance, so
// it is graded: routine moments are quiet, a final is not.
export function StakesChip({ label, difficulty = 0 }) {
  const tier = difficulty >= 0.8 ? 'high' : difficulty >= 0.5 ? 'mid' : 'low';
  const cls = tier === 'high'
    ? 'text-[#ef4444] border-[#ef4444]/50 bg-[#ef4444]/10'
    : tier === 'mid'
      ? 'text-[#F59E0B] border-[#F59E0B]/40 bg-[#F59E0B]/[0.07]'
      : 'text-slate-400 border-[rgba(255,255,255,0.10)] bg-[#0a0d0a]';

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] sm:text-xs font-black uppercase tracking-[0.18em] ${cls}`}>
      <span className="flex gap-[3px]" aria-hidden="true">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className={`w-[3px] rounded-full ${i <= (tier === 'high' ? 2 : tier === 'mid' ? 1 : 0) ? 'bg-current' : 'bg-current opacity-25'}`}
            style={{ height: `${6 + i * 3}px`, alignSelf: 'flex-end' }}
          />
        ))}
      </span>
      {label}
    </span>
  );
}

// --- the brief -------------------------------------------------------------
// What the moment is, what it is worth, and what you have to do, before the ice
// goes live. One button, and the button says what happens next.
export function Brief({ stakes, title, blurb, read, stat, onStart }) {
  return (
    <div className="flex flex-col items-center text-center py-6 sm:py-10 fade-up">
      <StakesChip label={stakes.label} difficulty={stakes.difficulty} />

      <h2 className="mt-5 text-3xl sm:text-5xl font-black text-white sports-font tracking-tighter uppercase leading-[0.95] text-balance max-w-3xl">
        {title}
      </h2>

      <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-xl leading-relaxed">
        {blurb}
      </p>

      {read && (
        <p className="mt-3 text-sm text-slate-500 max-w-xl leading-relaxed">
          {read}
        </p>
      )}

      {stat && (
        <p className="mt-6 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-slate-500">
          Decided by <span className="text-[#22E748]">{STAT_LABEL[stat] || stat}</span>
        </p>
      )}

      <button
        type="button"
        onClick={onStart}
        className="mt-7 btn-primary py-4 px-10 rounded-xl text-lg sm:text-xl cursor-pointer sports-font tracking-[0.18em] transition-transform hover:scale-[1.03] active:scale-[0.99]"
      >
        TAKE THE ICE
      </button>
    </div>
  );
}

// --- the stage -------------------------------------------------------------
// The ice, framed. A game passes its surface in and gets the frame, the HUD rail
// and the verdict overlay for nothing.
export function Stage({ hud, children, verdict, caption }) {
  return (
    <div className="w-full max-w-xl mx-auto">
      {hud}
      <div className="relative mt-3 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#070b09] overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_18px_40px_-24px_rgba(0,0,0,0.9)]">
        {children}
        {verdict}
      </div>
      {caption && (
        <p className="mt-3 text-center text-[11px] sm:text-xs text-slate-500 leading-relaxed min-h-[2.2em]">
          {caption}
        </p>
      )}
    </div>
  );
}

// --- the HUD ---------------------------------------------------------------
// A count drawn as pips rather than printed as "SAVES: 3/5". You can see where
// you are without reading it, which is the point when the clock is running.
export function Pips({ label, filled, total, tone = 'good' }) {
  const on = tone === 'bad' ? 'bg-[#ef4444] border-[#ef4444]' : 'bg-[#22E748] border-[#22E748]';
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{label}</span>
      <span className="flex gap-1">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border transition-colors ${
              i < filled ? on : 'border-[rgba(255,255,255,0.16)] bg-transparent'
            }`}
          />
        ))}
      </span>
    </div>
  );
}

// The shot clock, as a bar that drains. Turns at two seconds, which is the only
// warning a shooter gets.
export function Clock({ msLeft, msTotal }) {
  const pct = Math.max(0, Math.min(100, (msLeft / msTotal) * 100));
  const urgent = msLeft <= 2000;
  return (
    <div className="flex items-center gap-2 min-w-[108px]">
      <span className={`number-font text-sm sm:text-base font-black tabular-nums ${urgent ? 'text-[#ef4444]' : 'text-slate-300'}`}>
        {(Math.max(0, msLeft) / 1000).toFixed(1)}
      </span>
      <span className="relative h-1.5 flex-1 rounded-full bg-[rgba(255,255,255,0.08)] overflow-hidden">
        <span
          className={`absolute inset-y-0 left-0 rounded-full ${urgent ? 'bg-[#ef4444]' : 'bg-[#22E748]'}`}
          style={{ width: `${pct}%`, transition: 'width 100ms linear' }}
        />
      </span>
    </div>
  );
}

export function Hud({ left, right }) {
  return (
    <div className="flex items-center justify-between gap-4 px-1">
      <div className="flex items-center gap-4">{left}</div>
      <div className="flex items-center gap-4">{right}</div>
    </div>
  );
}

// --- the verdict -----------------------------------------------------------
// One word over the ice, and the detail under it. Every game resolves here, so a
// save and a goal look like the same kind of event whichever game produced them.
export function Verdict({ show, won, word, detail }) {
  if (!show) return null;
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#040706]/82 backdrop-blur-[2px] fade-up px-4">
      <span
        className={`sports-font font-black uppercase tracking-tighter leading-none text-center text-[clamp(2.2rem,11vw,4.5rem)] ${
          won ? 'text-[#22E748]' : 'text-[#ef4444]'
        }`}
        style={{ textShadow: won ? '0 0 38px rgba(34,231,72,0.35)' : '0 0 38px rgba(239,68,68,0.3)' }}
      >
        {word}
      </span>
      {detail && (
        <span className="mt-3 text-xs sm:text-sm font-black uppercase tracking-[0.2em] text-slate-400 text-center">
          {detail}
        </span>
      )}
    </div>
  );
}

// A prompt painted on the ice: "WAIT", "NOW", "SKATING IN". Centred, out of the
// way of the play, and the one place a game is allowed to shout.
export function Callout({ text, tone = 'neutral', y = '50%' }) {
  if (!text) return null;
  const cls = tone === 'go' ? 'text-[#22E748] border-[#22E748]/40 bg-[#22E748]/[0.08]'
    : tone === 'stop' ? 'text-[#ef4444] border-[#ef4444]/40 bg-[#ef4444]/[0.08]'
      : 'text-slate-300 border-[rgba(255,255,255,0.12)] bg-black/55';
  return (
    <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none" style={{ top: y }}>
      <span className={`block px-4 py-2 rounded-full border text-xs sm:text-sm font-black uppercase tracking-[0.2em] whitespace-nowrap ${cls}`}>
        {text}
      </span>
    </div>
  );
}

// A button that is part of the play rather than a form control: the three lane
// commits, the two pads, the two sides of a battle.
export function ActionButton({ children, onClick, disabled, state = 'idle', wide }) {
  const cls = state === 'right' ? 'border-[#22E748] bg-[#22E748]/15 text-[#22E748]'
    : state === 'wrong' ? 'border-[#ef4444] bg-[#ef4444]/15 text-[#ef4444]'
      : state === 'spent' ? 'border-[rgba(255,255,255,0.08)] bg-[#0a0d0a] text-slate-600'
        : 'border-[rgba(255,255,255,0.14)] bg-[#101410] text-slate-200 hover:border-[#22E748]/70 hover:text-white';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${wide ? 'flex-1' : ''} py-3.5 px-3 rounded-xl border text-[11px] sm:text-xs font-black uppercase tracking-[0.16em] transition-all ${cls} ${
        disabled ? 'cursor-default' : 'cursor-pointer active:scale-[0.98]'
      }`}
    >
      {children}
    </button>
  );
}

// --- All-Star weekend ------------------------------------------------------
// The skills events are not live play, so they get their own small header: the
// event, the captain's buff if one is active, and the number that matters.
export function EventHeader({ event, buff, readout, unit, note }) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-2 flex-wrap">
        <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.22em] text-slate-500">
          {event}
        </span>
        {buff && (
          <span className="px-2.5 py-1 rounded-full border border-[#F59E0B]/40 bg-[#F59E0B]/[0.08] text-[9px] sm:text-[10px] font-black uppercase tracking-[0.16em] text-[#F59E0B]">
            Captain&apos;s buff
          </span>
        )}
      </div>
      {readout !== undefined && readout !== null && (
        <div className="mt-2 flex items-end justify-center gap-1.5">
          <span className="number-font font-black text-white tabular-nums leading-none"
                style={{ fontSize: 'clamp(2rem,9vw,3.2rem)' }}>
            {readout}
          </span>
          {unit && (
            <span className="pb-1 text-xs sm:text-sm font-black uppercase tracking-[0.18em] text-slate-500">
              {unit}
            </span>
          )}
        </div>
      )}
      {note && (
        <p className="mt-1.5 text-[11px] sm:text-xs text-slate-500 uppercase tracking-[0.14em] font-black">
          {note}
        </p>
      )}
    </div>
  );
}
