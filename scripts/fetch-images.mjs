// IMAGES
//
// The logos, flags and trophies used to load from other people's servers: a
// logo pack on GitHub, flagcdn, Wikipedia and the NHL's own site. If any of
// them moved or went down, the images went with it. The game now loads them
// from public/img in this project, and this script fills that folder.
//
//   npm run images
//
// It downloads only what's missing, so it's quick to run again after new
// clubs or awards are added. Commit public/img afterwards so the images ship
// with the game.

import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'public');


// Every image path the game can ask for. Most are written out in the data
// files; a few are put together in code, so those are listed from the data.
const wanted = new Set();
const collect = (v, depth = 0) => {
  if (depth > 6 || v == null) return;
  if (typeof v === 'string') { if (v.startsWith('/img/')) wanted.add(v); return; }
  if (typeof v === 'object') Object.values(v).forEach(x => collect(x, depth + 1));
};

// Paths written straight into the source.
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e =>
  e.isDirectory() ? walk(path.join(dir, e.name)) : /\.(jsx?|css)$/.test(e.name) ? [path.join(dir, e.name)] : []);
for (const file of walk(path.join(root, 'src'))) {
  for (const m of fs.readFileSync(file, 'utf8').matchAll(/['"`](\/img\/[^'"`$]+\.(?:png|svg|jpe?g|webp|gif))['"`]/g)) wanted.add(m[1]);
}

// Paths the data files build.
// Where each local folder's images come from (see src/utils/images.js).
let SOURCES = {};
const server = await createServer({ root, logLevel: 'error', server: { middlewareMode: true, hmr: false, watch: null }, appType: 'custom' });
try {
  ({ IMAGE_SOURCES: SOURCES } = await server.ssrLoadModule('/src/utils/images.js'));
  for (const mod of ['/src/data/teams.js', '/src/data/euroLeagues.js', '/src/data/awards.js']) collect(await server.ssrLoadModule(mod));
  // Each NHL club's crest comes in a light and a dark version.
  const { nhlTeams } = await server.ssrLoadModule('/src/data/teams.js');
  for (const t of nhlTeams) for (const v of ['light', 'dark']) wanted.add(`/img/nhl/logos/nhl/svg/${t.id}_${v}.svg`);
} finally {
  await server.close();
}

const remoteOf = (p) => {
  const prefix = Object.keys(SOURCES).find(k => p.startsWith(k));
  return prefix ? SOURCES[prefix] + p.slice(prefix.length) : null;
};
const fileOf = (p) => path.join(out, ...decodeURIComponent(p).split('/').filter(Boolean));

const todo = [...wanted].filter(p => remoteOf(p) && !fs.existsSync(fileOf(p))).sort();
console.log(`\n${wanted.size} images in the game, ${wanted.size - todo.length} already here, ${todo.length} to download.\n`);

const failed = [];
let done = 0;
async function get(p) {
  const url = remoteOf(p);
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      // Wikipedia turns away requests that don't say who's asking.
      const res = await fetch(url, { headers: { 'User-Agent': 'BlueChipProspect/1.0 (image download for a hockey game)' } });
      if (res.status === 404) throw new Error('not found (404)');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const file = fileOf(p);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
      done++;
      if (done % 25 === 0) console.log(`  ${done} of ${todo.length}`);
      return;
    } catch (e) {
      if (attempt === 3 || /404/.test(e.message)) { failed.push(`${p}  (${e.message})`); return; }
      await new Promise(r => setTimeout(r, 800 * attempt));
    }
  }
}

// A few at a time, to be polite to the servers.
const queue = [...todo];
await Promise.all(Array.from({ length: 6 }, async () => { while (queue.length) await get(queue.shift()); }));

console.log(`\nDownloaded ${done}. ${failed.length ? `${failed.length} couldn't be downloaded:` : 'Nothing failed.'}`);
failed.forEach(f => console.log(`  • ${f}`));
console.log(failed.length
  ? '\nThose images stay blank in the game until they download. Run this again later to retry.\n'
  : '\nAll done. Commit the public/img folder so the images ship with the game.\n');
