// CAREER CHECKER
//
// Plays whole careers of the real game in a hidden browser, clicking buttons at
// random, and after every click checks rules that should always hold: a
// player's age fits his league, his club is in his league, nothing reads NaN,
// every season is filed once, the season totals match the clubs he played for,
// and so on. Any page crash, or a screen the game can't get out of, is caught
// too.
//
//   npm run check               20 careers
//   npm run check -- 50         50 careers
//   npm run check -- --seed 7   replays career 7 on its own
//
// Each career runs on a fixed random seed, so a career that broke a rule can be
// replayed with the seed it was given. It uses Microsoft Edge or Google Chrome,
// whichever is installed, and doesn't touch your saved achievements.

import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const seedArg = args.indexOf('--seed');
const onlySeed = seedArg >= 0 ? Number(args[seedArg + 1]) : null;
const count = onlySeed != null ? 1 : Number(args.find(a => /^\d+$/.test(a)) || 20);
const seeds = onlySeed != null ? [onlySeed] : Array.from({ length: count }, (_, i) => i + 1);
const WORKERS = Math.min(4, seeds.length);
const CAREER_MINUTES = 6;

// The game's own Math.random, replaced with one that always gives the same
// numbers for the same seed.
const seedScript = (n) => `(() => { let a = ${n} * 2654435761 >>> 0; Math.random = function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; })();`;

async function openBrowser() {
  if (process.env.BCP_BROWSER) return chromium.launch({ executablePath: process.env.BCP_BROWSER });
  for (const channel of ['msedge', 'chrome', undefined]) {
    try { return await chromium.launch(channel ? { channel } : {}); } catch { /* try the next one */ }
  }
  throw new Error('No browser found. The checker needs Microsoft Edge or Google Chrome installed.');
}

// Everything below this function runs inside the page, one career per call.
async function playCareer({ maxSteps, deadline }) {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const teams = await import('/src/data/teams.js');
  const contracts = await import('/src/utils/contracts.js');
  const { LEAGUE_CONFIG, juniorLeagues, u18Leagues, getTeamData } = teams;

  const problems = [];
  const seen = new Set();
  const trail = [];
  const flag = (rule, detail, key = detail) => {
    if (seen.has(rule + key)) return;
    seen.add(rule + key);
    const B = window.__bcp;
    problems.push({ rule, detail, screen: B?.screen, age: B?.player?.age, season: (B?.player?.stats?.seasonsPlayed || 0) + 1, trail: trail.slice(-12) });
  };

  // Page crashes reach us through the error boundary's message on screen.
  const findNaN = (obj, where = 'player', depth = 0) => {
    if (depth > 7 || obj == null) return null;
    if (typeof obj === 'number') return Number.isFinite(obj) ? null : where;
    if (typeof obj !== 'object') return null;
    for (const k of Object.keys(obj)) {
      const hit = findNaN(obj[k], Array.isArray(obj) ? `${where}[${k}]` : `${where}.${k}`, depth + 1);
      if (hit) return hit;
    }
    return null;
  };

  const PRO_NA = ['NHL', 'AHL', 'ECHL', 'SPHL'];
  const RATINGS = ['shooting', 'skating', 'physicality', 'hockeyIQ', 'stamina', 'ovr'];
  const CAREER_STATS = ['games', 'goals', 'assists'];
  let lastAge = null;
  let lastTotals = {};
  let lastHistoryLen = 0;

  const check = () => {
    const B = window.__bcp;
    const p = B.player;
    const scr = B.screen;
    if (!p || scr === 'creation') return;
    const lg = p.league;

    if (document.body.innerText.includes('Something Went Wrong')) flag('The game crashed', `crash screen showed on ${scr}`, scr);

    const nan = findNaN(p);
    if (nan) flag('A number is broken (NaN)', nan);

    for (const r of RATINGS) {
      const v = p[r];
      if (typeof v === 'number' && (v < 1 || v > 100)) flag('A rating is out of range', `${r} is ${v}`, r);
    }

    if (lastAge != null && (p.age < lastAge || p.age > lastAge + 1)) flag('Age jumped', `age went from ${lastAge} to ${p.age}`);
    lastAge = p.age;
    if (p.age > 45) flag('Career never ended', `still playing at ${p.age}`, 'old');

    if (lg && !LEAGUE_CONFIG[lg]) flag('Unknown league', `league "${lg}"`, lg);
    // Between seasons a club can be promoted or relegated a moment before he's
    // told, so this is only asked away from the summer's news and signings.
    if (lg && LEAGUE_CONFIG[lg] && p.team && !['event', 'transfer', 'negotiation', 'draft'].includes(scr)) {
      const d = getTeamData(p.team, lg);
      if (!d || (d.name === p.team && d.bg === '#101410')) flag('Club isn\'t in his league', `${p.team} in the ${lg}`, `${p.team}${lg}`);
    }

    if (PRO_NA.includes(lg) && p.age < 18) flag('Too young for his league', `age ${p.age} in the ${lg}`, lg);
    if (u18Leagues.includes(lg) && p.age > 18) flag('Too old for his league', `age ${p.age} in the ${lg}`, lg);
    else if (juniorLeagues.includes(lg) && p.age > 21) flag('Too old for his league', `age ${p.age} in the ${lg}`, lg);
    if (lg === 'NCAA' && p.age > 24) flag('Too old for his league', `age ${p.age} in the NCAA`, lg);

    const year = 2026 + (p.stats?.seasonsPlayed || 0);
    const c = p.contract || {};
    if (lg === 'NHL' && c.nhl && typeof c.salary === 'number' && c.salary > 0 && c.salary < contracts.leagueMinimumFor(year)) {
      flag('NHL contract below the league minimum', `$${c.salary.toLocaleString()} in ${year}`, 'min');
    }
    if (typeof c.years === 'number' && c.years < 0) flag('Contract has negative years', `${c.years} years left`, 'years');

    // The captain of his own room should be a real player for that league.
    const room = (p.rooms || {})[p.team];
    // A room is rebuilt when the season starts, so this is asked during one.
    if (p.season && room && room.league && lg && room.league !== lg) {
      flag('Dressing room from another league', `${p.team} room belongs to the ${room.league}, he plays in the ${lg}`, `${p.team}${lg}`);
    }
    if (room && room.league === lg && (lg === 'NHL' || lg === 'AHL')) {
      const cap = (room.men || []).find(m => m.captain);
      const floor = lg === 'NHL' ? 60 : 52;
      if (cap && cap.ovr < floor) flag('Captain too weak for the league', `${lg} captain rated ${cap.ovr}`, lg);
      const kid = (room.men || []).find(m => m.age < 18);
      if (kid) flag('Too young for his league', `a ${kid.age}-year-old teammate in the ${lg} room`, `room${lg}`);
    }

    // Career totals only ever go up.
    for (const tier of ['chl', 'ahl', 'nhl']) {
      for (const k of CAREER_STATS) {
        const v = p.stats?.[tier]?.[k];
        const was = lastTotals[tier + k];
        if (typeof v === 'number' && typeof was === 'number' && v < was) flag('Career totals went down', `${tier.toUpperCase()} ${k} went from ${was} to ${v}`, tier + k);
        if (typeof v === 'number') lastTotals[tier + k] = v;
      }
    }

    // Every season filed once, in order, with totals that match its clubs.
    const hist = p.seasonHistory || [];
    if (hist.length !== lastHistoryLen) {
      if (hist.length > lastHistoryLen + 1) flag('Season filed twice', `${hist.length - lastHistoryLen} seasons added at once`);
      lastHistoryLen = hist.length;
      const years = hist.map(h => h.year).filter(y => y != null);
      years.forEach((y, i) => { if (i && y !== years[i - 1] + 1) flag('Season filed twice', `history goes ${years[i - 1]} then ${y}`, `${years[i - 1]}-${y}`); });
      const h = hist[hist.length - 1];
      const st = h.stints || [];
      if (st.length) {
        const sum = k => st.reduce((n, s) => n + (s[k] || 0), 0);
        if (sum('games') !== (h.games || 0)) flag('Season totals don\'t match', `${h.year}: ${h.games} games filed, clubs add up to ${sum('games')}`, `${h.year}g`);
        if (p.pos !== 'G' && sum('g') !== (h.goals || 0)) flag('Season totals don\'t match', `${h.year}: ${h.goals} goals filed, clubs add up to ${sum('g')}`, `${h.year}goals`);
        for (const s of st) {
          const sched = LEAGUE_CONFIG[s.league]?.games;
          if (sched && s.games > sched) flag('More games than the schedule', `${s.games} games with ${s.team} in a ${sched}-game ${s.league} season`, `${h.year}${s.team}`);
        }
      }
    }
  };

  const visible = el => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && !el.disabled && getComputedStyle(el).visibility !== 'hidden';
  };
  const SKIP = /new career|start over|main menu|play again|achievement|delete|reset/i;
  let sig = '';
  let quiet = 0;
  let quietSince = Date.now();
  let lastLabel = null;

  for (let step = 0; step < maxSteps; step++) {
    if (Date.now() > deadline) { flag('Career took too long', `still going after ${step} clicks`, 'slow'); break; }
    const B = window.__bcp;
    if (!B) { await sleep(100); continue; }
    const p = B.player;
    const scr = B.screen;
    if (scr === 'retirement') {
      await sleep(300);
      check();
      return { problems, seasons: (p.seasonHistory || []).length, age: p.age, steps: step, finished: true };
    }

    // A screen where nothing changes for a long time is a screen he can't leave.
    const now = `${scr}|${p.age}|${p.stats?.seasonsPlayed}|${p.season?.stage}|${(p.seasonHistory || []).length}|${p.team}`;
    if (now === sig) quiet++; else { quiet = 0; sig = now; quietSince = Date.now(); }
    if (Date.now() - quietSince > 120000) { flag('Stuck on a screen', `nothing moved on "${scr}" for two minutes`, scr); break; }

    const nameBox = document.querySelector('input[type=text], input:not([type])');
    if (nameBox && !nameBox.value) {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(nameBox, 'Test Player');
      nameBox.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // The live-play minigames want real timing, so they're settled with a coin flip.
    if (scr === 'minigame' && B.minigameStarted) {
      B.handleInteractiveResult(Math.random() < 0.5, {}, 'Won', 'Lost', {});
      trail.push(`${scr}: (minigame settled)`);
      await sleep(60);
      check();
      continue;
    }

    // A live play inside a screen (the World Juniors' last chance, the All-Star
    // skills) runs on its own clock, and clicking around it redraws the page
    // the whole time. After a while on one screen the bot slows down, presses
    // the keyboard now and then, and tries clickable targets that aren't buttons.
    const patient = quiet > 40;
    if (patient) {
      await sleep(700);
      if (Math.random() < 0.3) {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
        trail.push(`${scr}: (space bar)`);
        continue;
      }
    }
    const targets = patient ? [...document.querySelectorAll('svg .cursor-pointer, [role=button]')].filter(visible) : [];
    const buttons = [...document.querySelectorAll('button'), ...targets].filter(visible).filter(el => {
      const t = (el.innerText || el.getAttribute('aria-label') || '').trim();
      if (SKIP.test(t)) return false;
      // Retiring is allowed late in a career, and not every time it's offered,
      // or when it's been the only way forward for a while (a career-ending injury).
      if (/retire/i.test(t)) return quiet > 60 || (p.age >= 33 && Math.random() < 0.15);
      return true;
    });
    if (!buttons.length) { await sleep(120); continue; }
    // Some live plays want alternating presses (the fastest-skater race), so
    // the same button twice running is avoided when there's another.
    const fresh = buttons.filter(el => el.innerText !== lastLabel);
    const pool = patient && fresh.length ? fresh : buttons;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    lastLabel = pick.innerText;
    trail.push(`${scr}: ${(pick.innerText || pick.getAttribute('aria-label') || '?').replace(/\s+/g, ' ').trim().slice(0, 40)}`);
    if (trail.length > 30) trail.shift();
    // Some of the live plays start on a press rather than a click.
    pick.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    pick.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    if (pick.isConnected) pick.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await sleep(35);
    try { check(); } catch (e) { flag('The checker itself failed', e.message, 'checker'); }
  }
  const B = window.__bcp;
  if (B?.screen !== 'retirement' && !problems.some(x => x.rule === 'Stuck on a screen' || x.rule === 'Career took too long')) {
    flag('Career never ended', `ran out of clicks on "${B?.screen}"`, 'steps');
  }
  return { problems, seasons: (B?.player?.seasonHistory || []).length, age: B?.player?.age, steps: maxSteps, finished: false };
}

async function runSeed(browser, url, seed) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const crashes = [];
  page.on('pageerror', e => crashes.push(e.message));
  await page.addInitScript(seedScript(seed));
  // Logos, flags and fonts aren't needed to play, and skipping them is faster.
  await page.route(u => !/^http:\/\/(localhost|127\.0\.0\.1)/.test(u.href), r => r.abort());
  let result;
  try {
    await page.goto(url);
    await page.waitForFunction(() => window.__bcp, null, { timeout: 30000 });
    result = await page.evaluate(playCareer, { maxSteps: 12000, deadline: Date.now() + CAREER_MINUTES * 60000 });
  } catch (e) {
    result = { problems: [{ rule: 'The checker couldn\'t play this career', detail: e.message.split('\n')[0], trail: [] }], finished: false };
  }
  if (process.env.BCP_SHOTS && result.problems.length) await page.screenshot({ path: path.join(process.env.BCP_SHOTS, `career-${seed}.png`), fullPage: true }).catch(() => {});
  for (const msg of [...new Set(crashes)].slice(0, 5)) result.problems.unshift({ rule: 'The game crashed', detail: msg, trail: [] });
  await context.close();
  return { seed, ...result };
}

const started = Date.now();
// No live reloading: editing a file mid-check would restart the careers.
const server = await createServer({ root, logLevel: 'error', server: { port: 5390, hmr: false, watch: null } });
await server.listen();
const url = server.resolvedUrls.local[0];
const browser = await openBrowser();

console.log(`\nBlue Chip Prospect career check: playing ${seeds.length} career${seeds.length > 1 ? 's' : ''}...\n`);
const queue = [...seeds];
const results = [];
await Promise.all(Array.from({ length: WORKERS }, async () => {
  while (queue.length) {
    const seed = queue.shift();
    const r = await runSeed(browser, url, seed);
    results.push(r);
    const mark = r.problems.length ? '✖' : '✔';
    console.log(`  ${mark} Career ${seed}: ${r.seasons ?? '?'} seasons, retired at ${r.age ?? '?'}${r.problems.length ? `, ${r.problems.length} problem${r.problems.length > 1 ? 's' : ''}` : ''}`);
  }
}));
await browser.close();
await server.close();

results.sort((a, b) => a.seed - b.seed);
const bad = results.filter(r => r.problems.length);
const mins = ((Date.now() - started) / 60000).toFixed(1);
console.log(`\nPlayed ${results.length} career${results.length === 1 ? '' : 's'} in ${mins} minutes. ${results.length - bad.length} clean, ${bad.length} with problems.`);

if (bad.length) {
  const byRule = {};
  bad.forEach(r => r.problems.forEach(p => { (byRule[p.rule] ||= new Set()).add(r.seed); }));
  console.log('\nProblems found:');
  Object.entries(byRule).sort((a, b) => b[1].size - a[1].size)
    .forEach(([rule, s]) => console.log(`  • ${rule}: ${s.size} career${s.size > 1 ? 's' : ''}`));
  console.log('\nDetails:');
  for (const r of bad) {
    console.log(`\n  Career ${r.seed}  (replay with: npm run check -- --seed ${r.seed})`);
    for (const p of r.problems) {
      const where = p.screen ? ` [${p.screen} screen, season ${p.season}, age ${p.age}]` : '';
      console.log(`    • ${p.rule}: ${p.detail}${where}`);
      if (onlySeed != null && p.trail?.length) console.log(`      last clicks: ${p.trail.join(' → ')}`);
    }
  }
  console.log('');
  process.exit(1);
}
console.log('');
