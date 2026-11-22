import { useEffect, useRef, useState } from 'react';
import { lerpDifficulty } from './stakes';

// THE CLOCK ON A DECISION.
//
// Most minigames that ask you to choose something (which side to cheat, which
// lane to shoot, which read to make) waited for as long as you liked. Nobody on
// the ice gets that. The decision now runs on a clock, shorter in a bigger
// game, and when it runs out the game makes the call a frozen player would have
// made: the passive one, or none at all.

// How long a decision gets. Five seconds in a routine moment, three and a half
// when it matters most.
export const decisionMs = (difficulty = 0, easy = 5000, hard = 3500) => Math.round(lerpDifficulty(easy, hard, difficulty));

// Counts down while `active` is truthy, and calls onExpire once when it hits
// zero. Pass a different truthy value (a round number, a step id) to start a
// fresh count for the next decision. Returns the milliseconds left.
export function useCountdown(totalMs, active, onExpire) {
  const [msLeft, setMsLeft] = useState(totalMs);
  const cb = useRef(onExpire);
  useEffect(() => { cb.current = onExpire; });
  useEffect(() => {
    if (!active) return undefined;
    const start = Date.now();
    let fired = false;
    const tick = setInterval(() => {
      const left = totalMs - (Date.now() - start);
      setMsLeft(Math.max(0, left));
      if (left <= 0 && !fired) {
        fired = true;
        clearInterval(tick);
        if (cb.current) cb.current();
      }
    }, 50);
    return () => clearInterval(tick);
  }, [active, totalMs]);
  // Holds its last value once stopped, so a clock frozen by an answer stays
  // where it stopped instead of jumping back to full.
  return msLeft;
}
