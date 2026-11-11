import { lerpDifficulty } from './stakes';

// The maths behind the net-front tip, kept out of the component so it can be
// run on its own: a shot is thousands of trials away from being balanced, and
// nothing here needs React to answer whether it is.

// How long each kind of shot takes from the blade to the slot. A slapper is the
// hardest and gets there first; a wrister is the slowest of the three. They are
// spread far enough apart that picking the wrong one costs you, and all three
// sit beyond human reaction time so none of them can be answered on reflex.
export const SHOT_TYPES = [
  { key: 'SLAP', label: 'Slap shot', flightMs: 430 },
  { key: 'SNAP', label: 'Snap shot', flightMs: 545 },
  { key: 'WRIST', label: 'Wrist shot', flightMs: 650 }
];

const MIN_WINDOW_MS = 50;

// Everything about one shot, settled before the hold starts.
export function buildShot({ physicality = 50, hockeyIQ = 50, difficulty = 0, rand = Math.random }) {
  const type = SHOT_TYPES[Math.floor(rand() * SHOT_TYPES.length)];

  // A good read means it arrives when that kind of shot should. A poor one
  // leaves the flight scattered either side of it, and a big game scatters it
  // further.
  const spread = lerpDifficulty(120, 45, Math.max(0, Math.min(1, (hockeyIQ - 45) / 50)))
    * lerpDifficulty(1, 1.45, difficulty);
  const flightMs = Math.max(240, type.flightMs + (rand() * 2 - 1) * spread);

  // Strength in the paint is what gets the blade into the lane at all. This is
  // a half-width, so the blade is in the lane for twice it. The floor sits
  // under the MIN_TIMING_MS the other games use because those ask you to time a
  // marker you can watch, and an interval you already know the length of can be
  // hit more precisely than one you are tracking.
  const windowMs = Math.max(
    MIN_WINDOW_MS,
    lerpDifficulty(60, 96, Math.max(0, Math.min(1, (physicality - 40) / 55)))
      * lerpDifficulty(1.1, 0.72, difficulty)
  );

  // The beat.
  //
  // A player asked to count a flight he has never been shown can only guess,
  // and that is what made this unreadable: you were told to time an interval
  // nobody had ever given you. So the point man taps his stick on
  // the ice while he loads, evenly, and the gap between taps is how long this
  // kind of shot takes to arrive. Keep his tempo through the release and your
  // blade is down when the puck gets there.
  //
  // The taps are spaced at the nominal flight for the shot type, not at the
  // actual one, so the beat tells you what a slapper does rather than what this
  // particular slapper is about to do. Hockey IQ is still what closes the gap
  // between the two.
  const beatMs = type.flightMs;
  const beats = 3 + Math.floor(rand() * 2);   // three or four taps before he shoots

  return {
    type: type.key,
    typeLabel: type.label,
    nominalMs: type.flightMs,
    beatMs,
    beats,
    windupMs: beatMs * beats,
    flightMs,
    windowMs,
    // Reading the shot out of his hands is a hockey-sense thing, so it is gated
    // the way the national-team favourite is.
    telegraphed: hockeyIQ >= 75
  };
}

// Where a release landed. `sinceShot` is measured from the puck leaving the
// stick, the only moment the player is given.
export function judge(shot, sinceShot) {
  if (sinceShot < shot.flightMs - shot.windowMs) return 'EARLY';
  if (sinceShot > shot.flightMs + shot.windowMs) return 'LATE';
  return 'TIPPED';
}
