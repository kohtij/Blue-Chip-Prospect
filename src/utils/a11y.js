import { useEffect, useRef } from 'react';

// ACCESSIBILITY HELPERS.

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// A modal that behaves like one for a keyboard and a screen reader: focus goes
// into it when it opens, Tab cannot wander out behind it, Escape closes it (if
// it can be closed), and focus returns to whatever opened it afterwards.
export function useDialog(ref, onClose) {
  // Held in a ref so a parent that passes a new function every render does
  // not reopen the dialog, and pull focus back to its first button, each time.
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; });
  useEffect(() => {
    const box = ref.current;
    if (!box) return undefined;
    const opener = document.activeElement;
    const items = () => [...box.querySelectorAll(FOCUSABLE)].filter(el => el.offsetParent !== null || el === document.activeElement);
    (items()[0] || box).focus({ preventScroll: true });

    const onKey = (e) => {
      if (e.key === 'Escape' && closeRef.current) { e.preventDefault(); closeRef.current(); return; }
      if (e.key !== 'Tab') return;
      const list = items();
      if (!list.length) { e.preventDefault(); return; }
      const first = list[0], last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      if (opener && document.contains(opener) && opener.focus) opener.focus({ preventScroll: true });
    };
  }, [ref]);
}

// Keyboard activation for a control whose action fires on pointer down.
//
// A few minigame buttons act on pointerdown, because a click waits for the
// finger to lift and the timing has to be exact. Pointer down never fires from
// a keyboard, so those buttons could not be pressed at all without a mouse or
// a finger. Enter or Space on the focused button now does the same thing, at
// the moment the key goes down, which keeps the timing as exact as a tap.
export function isPress(e) {
  if (e.repeat || (e.key !== 'Enter' && e.key !== ' ')) return false;
  e.preventDefault();
  return true;
}

// Text colour that reads on a given background, for badges drawn in a club's
// own colours, where the two club colours can be too close to read.
export function readableOn(hex, preferred) {
  const lum = (h) => {
    const m = /^#?([0-9a-f]{6})$/i.exec(h || '');
    if (!m) return null;
    const c = [0, 2, 4].map(i => parseInt(m[1].slice(i, i + 2), 16) / 255)
      .map(x => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const bg = lum(hex);
  if (bg == null) return preferred || '#FFFFFF';
  const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  const pref = lum(preferred);
  if (pref != null && ratio(pref, bg) >= 4.5) return preferred;
  return ratio(1, bg) >= ratio(0, bg) ? '#FFFFFF' : '#000000';
}

// THE NET BY KEYBOARD.
//
// Every shooting and saving minigame aims at the same five spots in the net,
// and each was played only by clicking a circle drawn on it. These keys follow
// a numeric keypad, so the layout matches the net: 7 and 9 for the top
// corners, 1 and 3 for the low ones, 5 (or 2) for the five-hole. Q, E, A, D
// and S do the same on a keyboard without a number pad.
const ZONE_KEYS = { 7: 0, q: 0, 9: 1, e: 1, 5: 2, 2: 2, s: 2, 1: 3, a: 3, 3: 4, d: 4 };

export const ZONE_KEY_HINT = 'Keyboard: 7 and 9 for the top corners, 1 and 3 for the low ones, 5 for the five-hole.';

export function useZoneKeys(active, onZone) {
  const cb = useRef(onZone);
  useEffect(() => { cb.current = onZone; });
  useEffect(() => {
    if (!active) return undefined;
    const onKey = (e) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      const id = ZONE_KEYS[(e.key || '').toLowerCase()];
      if (id === undefined) return;
      e.preventDefault();
      cb.current(id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active]);
}
