// THE CAREER SAVE.
//
// A career used to live only in memory, so refreshing the page, or iOS
// closing the tab in the background, lost it. The game now writes it to the
// browser after every change, and the creation screen offers to continue it.
//
// The save carries a version number. When the shape of the save changes, the
// version goes up and an upgrade step is added to UPGRADES below, so a career
// started on an older version still loads.

const KEY = 'hockey_career_save';
export const SAVE_VERSION = 1;

// One step per version: UPGRADES[n] turns a version-n save into version n+1,
// taking the whole save and returning it changed. There's nothing to upgrade
// yet. When a change to the game means an older save would load wrong, raise
// SAVE_VERSION and add the step that fixes the old save, for example:
//
//   1: (save) => { save.state.player.newField ??= 0; return save; },
const UPGRADES = {};

/** Writes the career to the browser. Returns false if the browser refused. */
export function writeSave(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ version: SAVE_VERSION, savedAt: Date.now(), state }));
    return true;
  } catch {
    return false;
  }
}

/** The saved career, upgraded to the current version, or null if there isn't one it can use. */
export function readSave() {
  let save;
  try { save = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; }
  if (!save || !save.state || typeof save.version !== 'number') return null;
  // A save from a newer version of the game than this one can't be read safely.
  if (save.version > SAVE_VERSION) return null;
  try {
    while (save.version < SAVE_VERSION) {
      const step = UPGRADES[save.version];
      if (!step) return null;
      save = step(save);
      save.version += 1;
    }
  } catch {
    return null;
  }
  return save;
}

/** Forgets the saved career. */
export function clearSave() {
  try { localStorage.removeItem(KEY); } catch { /* nothing to forget */ }
}
