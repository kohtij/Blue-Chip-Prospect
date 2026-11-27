// WHERE THE IMAGES COME FROM.
//
// Logos, flags and trophies are served from public/img in this project
// (filled by `npm run images`). Each local folder mirrors one outside source,
// and if a file isn't there yet the game falls back to that source, so a
// missing download never leaves the game without its logos and flags.

export const IMAGE_SOURCES = {
  '/img/gh/': 'https://raw.githubusercontent.com/',
  '/img/flags/': 'https://flagcdn.com/',
  '/img/wiki/': 'https://upload.wikimedia.org/',
  '/img/nhl/': 'https://assets.nhle.com/'
};

/** The outside address of a local image path, or null if it isn't one. */
export const remoteImage = (src) => {
  if (!src) return null;
  let path = src;
  try { path = new URL(src, window.location.href).pathname; } catch { /* already a path */ }
  const prefix = Object.keys(IMAGE_SOURCES).find(k => path.startsWith(k));
  return prefix ? IMAGE_SOURCES[prefix] + path.slice(prefix.length) : null;
};

// Error events this fallback has just answered, so a component with its own
// error handling can tell a retry from a real failure.
const retried = new WeakSet();

/** True when this image error is being retried from the outside source. */
export const isImageRetry = (e) => retried.has(e?.nativeEvent || e);

/** Sends any local image that fails to load to its outside source instead. */
export function installImageFallback() {
  window.addEventListener('error', (e) => {
    const el = e.target;
    if (!(el instanceof HTMLImageElement)) return;
    // An outside address doesn't map to one, so a failed retry stops here.
    const remote = remoteImage(el.getAttribute('src'));
    if (!remote) return;
    retried.add(e);
    el.src = remote;
  }, true);
}
