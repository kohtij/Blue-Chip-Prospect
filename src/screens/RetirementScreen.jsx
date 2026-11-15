import { useMemo } from 'react';
import { useAppContext } from '../AppContext';
import { getFullTeamName, getPlayoffTitles } from '../utils/appHelpers';
import { careerTrophies, formatMoney, withTeamArticle } from '../utils/gameHelpers';
import { classTable, compGroup, groupName, leagueLabel, peerUnit, peerValue, playerCareerValue } from '../utils/peers';
import { isDefence } from '../utils/production';
import { formatRecord, RECORD_LABEL, recordsHeld } from '../utils/records';
import { computeCareerScore, hallOfFame } from '../utils/careerScore';
import { buyoutOwed } from '../utils/bonuses';
import { getAwardImage } from '../data/awards';
import { getTeamData, teamAccent } from '../data/teams';
import TeamLogo from '../components/TeamLogo';
import TrophyImage from '../components/TrophyImage';

// THE END OF A CAREER, ON ONE PAGE.
//
// The old screen grew a section at a time and every section was built its own
// way: four coloured pills over the name, a score in a box inside a box, a
// mantle with an emoji, tiles in five different border colours, headings at
// three different indents, and a stat table where every column had its own
// colour. Nothing on it agreed with anything else on it.
//
// It is built from three pieces now and nothing else: a section with one kind
// of heading, a stat with one kind of label, and an honour with one kind of
// tile. Colour means one thing each. Gold is a championship. Green is you.
// Each league has its own colour, used on the skyline and as the band each
// block of the table sits in, so the junior years, the minors and the NHL
// read as separate chapters. The top of the page is lit in your club's
// colours, because that is how a career is remembered in an arena.

const POS_NAME = { C: 'Centre', LW: 'Left Wing', RW: 'Right Wing', LD: 'Defence', RD: 'Defence', G: 'Goaltender' };

// Each level of hockey in its own colour, so a career reads at a glance: the
// junior years, the college years, the minors, Europe and the NHL are each a
// different band on the skyline and in the table. Gold stays with the
// championships and green with you, so neither is used for a league.
const LEAGUE_HUE = {
  NHL: '#60a5fa', AHL: '#fb923c', ECHL: '#f87171',
  OHL: '#2dd4bf', WHL: '#2dd4bf', QMJHL: '#2dd4bf', USHL: '#2dd4bf',
  NCAA: '#c084fc',
  SHL: '#f472b6', LIIGA: '#f472b6', KHL: '#f472b6', SWISS: '#f472b6', DEL: '#f472b6', CZECH: '#f472b6',
  ICEHL: '#f472b6', SLOVAK: '#f472b6', J20: '#f472b6', U20: '#f472b6'
};
const hueOf = (lg) => LEAGUE_HUE[lg] || '#94a3b8';
const tint = (hex, pct) => `color-mix(in srgb, ${hex} ${pct}%, transparent)`;

// The career score's tiers, bottom to top, with the score each one starts at.
// The top two also have rate gates (see careerScore), so where he sits is read
// from his tier, not from the number alone.
const TIERS = [
  { name: 'Minor Leaguer', from: 0, hex: '#94a3b8' },
  { name: 'Journeyman', from: 400, hex: '#cbd5e1' },
  { name: 'Solid Pro', from: 1000, hex: '#22E748' },
  { name: 'Franchise Cornerstone', from: 1800, hex: '#3b82f6' },
  { name: 'Hall of Famer', from: 3000, hex: '#c084fc' },
  { name: 'Generational Icon', from: 4500, hex: '#F59E0B' }
];

const sv3 = (saves, shots) => (shots > 0 ? (saves / shots).toFixed(3).replace('0.', '.') : '.000');
const gaa2 = (saves, shots, gp) => (gp > 0 ? ((shots - saves) / gp).toFixed(2) : '0.00');
const seasonLabel = (y) => `${y}-${String((y + 1) % 100).padStart(2, '0')}`;
const Dash = () => <span className="text-slate-600">-</span>;

// ── The three pieces ─────────────────────────────────────────────────────────

function Section({ title, meta, children, className = '' }) {
  return (
    <section className={`game-panel p-4 sm:p-6 ${className}`}>
      <header className="flex items-baseline justify-between gap-3 mb-4">
        <h2 className="text-sm sm:text-base font-black text-white">{title}</h2>
        {meta && <span className="text-[11px] font-bold text-slate-500 text-right">{meta}</span>}
      </header>
      {children}
    </section>
  );
}

// WHAT KIND OF HONOUR IT IS.
//
// The case was one grid of identical grey tiles, so an Olympic silver, a Lady
// Byng and an All-Star selection all looked like the same thing. Each kind
// has a shelf and a colour now, and the ones with no trophy picture get an
// icon that says what they are: a medal in its metal, a star for an All-Star
// team.
const KINDS = {
  cup:     { shelf: 'Championships',             hex: '#F59E0B' },
  major:   { shelf: 'Trophies',                  hex: '#c084fc' },
  medal:   { shelf: 'For Your Country',          hex: '#e879f9' },
  minor:   { shelf: 'Junior, College and Minors', hex: '#2dd4bf' }
};
const METAL_HEX = { gold: '#F5C542', silver: '#CBD5E1', bronze: '#D08A4F' };
const METAL = {
  gold:   'radial-gradient(circle at 35% 30%, #fff3c4, #f5c542 45%, #a86f08)',
  silver: 'radial-gradient(circle at 35% 30%, #ffffff, #c9d1da 45%, #6b7682)',
  bronze: 'radial-gradient(circle at 35% 30%, #ffd9b0, #c27c3e 45%, #6e3c14)'
};

// Award names as they're written on the trophy, in title case. Short joining
// words stay lower case, and anything already capitalised (NHL, 1st) is left
// alone.
const SMALL_WORDS = new Set(['of', 'the', 'and', 'on', 'in', 'a', 'for', 'to']);
const titleCase = (str) => String(str).split(' ').map((w, i) =>
  (i > 0 && SMALL_WORDS.has(w.toLowerCase())) ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1)
).join(' ');

function Honour({ name, count, years, img, league, kind = 'major', metal = null }) {
  const k = KINDS[kind] || KINDS.major;
  const hex = metal ? METAL_HEX[metal] : k.hex;
  return (
    <div className="flex items-center gap-3 rounded-xl border px-3 py-2.5"
         style={{
           borderColor: `color-mix(in srgb, ${hex} 38%, transparent)`,
           background: `linear-gradient(100deg, color-mix(in srgb, ${hex} 14%, transparent), color-mix(in srgb, ${hex} 3%, transparent) 70%)`
         }}>
      <span className="shrink-0 w-9 h-9 flex items-center justify-center">
        {kind === 'cup'
          ? <TrophyImage league={league || 'NHL'} className="w-9 h-9 object-contain" />
          : metal
            ? (
              <span className="relative w-7 h-7 rounded-full shadow-[0_2px_6px_rgba(0,0,0,0.5)]" style={{ background: METAL[metal] }}>
                <span className="absolute inset-[5px] rounded-full border border-black/20" />
              </span>
            )
            : img
              ? <img src={img} alt="" className="w-9 h-9 object-contain" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
              : kind === 'allstar'
                ? (
                  <svg viewBox="0 0 24 24" className="w-6 h-6" aria-hidden="true">
                    <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.5 1.3 6.6L12 17.2l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z" fill={hex} />
                  </svg>
                )
                : <span className="w-3 h-3 rotate-45 rounded-[2px]" style={{ background: hex }} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-black leading-tight" style={{ color: kind === 'cup' ? hex : '#fff' }}>{name}</span>
        {!!years?.length && (
          <span className="block text-[10px] font-bold text-slate-400 mt-0.5 break-words">{years.join(', ')}</span>
        )}
      </span>
      {count > 1 && <span className="shrink-0 text-sm font-black number-font" style={{ color: hex }}>×{count}</span>}
    </div>
  );
}

// The C and the A, next to the year they were worn.
function Letter({ captain, alternate }) {
  if (!captain && !alternate) return null;
  return (
    <span className="shrink-0 text-[9px] font-black w-4 h-4 rounded inline-flex items-center justify-center leading-none border border-[rgba(255,255,255,0.18)] text-slate-200">
      {captain ? 'C' : 'A'}
    </span>
  );
}

// What a year won, at the end of its row: the championship in gold, anything
// else as a small neutral chip with its own trophy image.
function YearHonours({ season }) {
  const own = season.league === 'NHL' ? 'stanley cup' : season.league === 'AHL' ? 'calder cup' : 'championship';
  const awards = (season.awards || [])
    .filter(aw => !aw.toLowerCase().includes('1st team all-star'))
    .filter(aw => !season.titleWon || !aw.toLowerCase().includes(own))
    .map(aw => shortAward(aw, season.league === 'INTL'));
  if (!season.titleWon && !awards.length) return null;
  return (
    <span className="flex flex-wrap gap-1">
      {!!season.titleWon && (
        <span className="inline-flex items-center gap-1 rounded border border-[#F59E0B]/40 bg-[#F59E0B]/10 px-1.5 py-[2px] text-[10px] font-bold text-[#F59E0B] whitespace-nowrap">
          <TrophyImage league={season.league || 'NHL'} className="w-3 h-3" />
          {getPlayoffTitles(season.league).cupName}
        </span>
      )}
      {awards.map((a, i) => {
        // A medal is shown in its own metal, so a gold and a bronze don't
        // look like the same chip.
        const metal = /gold/i.test(a.text) ? 'gold' : /silver/i.test(a.text) ? 'silver' : /bronze/i.test(a.text) ? 'bronze' : null;
        const hex = metal ? METAL_HEX[metal] : null;
        return (
          <span key={i} className="inline-flex items-center gap-1 rounded border px-1.5 py-[2px] text-[10px] font-bold whitespace-nowrap"
                style={hex
                  ? { color: hex, borderColor: `color-mix(in srgb, ${hex} 45%, transparent)`, background: `color-mix(in srgb, ${hex} 12%, transparent)` }
                  : { color: '#cbd5e1', borderColor: 'rgba(255,255,255,0.1)' }}>
            {metal
              ? <span className="w-2.5 h-2.5 rounded-full" style={{ background: METAL[metal] }} />
              : a.img && <img src={a.img} alt="" className="w-3 h-3 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
            {a.text}
          </span>
        );
      })}
    </span>
  );
}

// An award's name, short enough for a table row. Every league's trophies end in
// some arrangement of Memorial, Trophy and Award, which identify nothing.
function shortAward(raw, intl) {
  let text = String(raw).replace(/^\d{4}\s/, '').replace(/\s\d{4}$/, '');
  if (intl) {
    if (text.includes('Gold')) text = 'Gold Medal';
    else if (text.includes('Silver')) text = 'Silver Medal';
    else if (text.includes('Bronze')) text = 'Bronze Medal';
    else if (text.includes('Promotion')) text = 'Promotion';
    else if (text.includes('Survival')) text = 'Stayed up';
  } else {
    text = text.replace('Gold, Olympics', 'Olympic gold')
      .replace('Gold, World Juniors', 'WJC gold')
      .replace('Gold, World Championship', 'Worlds gold')
      .replace(/\s*\([^)]*\)\s*$/, '')
      .replace(/\s+Memorial\s+(Trophy|Award)$/, '')
      .replace(/\s+(Trophy|Award)$/, '')
      .replace(/^Frank J\.\s+/, '');
  }
  return { text, img: getAwardImage(raw) || getAwardImage(text) };
}

const NHL_ARENAS = {
  ANA: 'Honda Center', BOS: 'TD Garden', BUF: 'KeyBank Center', CGY: 'Scotiabank Saddledome',
  CAR: 'Lenovo Center', CHI: 'United Center', COL: 'Ball Arena', CBJ: 'Nationwide Arena',
  DAL: 'American Airlines Center', DET: 'Little Caesars Arena', EDM: 'Rogers Place', FLA: 'Amerant Bank Arena',
  LAK: 'Crypto.com Arena', MIN: 'Grand Casino Arena', MTL: 'Bell Centre', NSH: 'Bridgestone Arena',
  NJD: 'Prudential Center', NYI: 'UBS Arena', NYR: 'Madison Square Garden', OTT: 'Canadian Tire Centre',
  PHI: 'Xfinity Mobile Arena', PIT: 'PPG Paints Arena', SJS: 'SAP Center', SEA: 'Climate Pledge Arena',
  STL: 'Enterprise Center', TBL: 'Benchmark International Arena', TOR: 'Scotiabank Arena', VAN: 'Rogers Arena',
  VGK: 'T-Mobile Arena', WSH: 'Capital One Arena', WPG: 'Canada Life Centre', UTA: 'Delta Center'
};

// Which honours lead the trophy case. A championship before a scoring title,
// a scoring title before an all-star nod.
const honourRank = (name) => {
  const n = name.toLowerCase();
  if (n.includes('memorial cup')) return 1;
  if (/hart|conn smythe|vezina|norris|art ross|richard|lindsay|calder trophy|selke/.test(n)) return 2;
  if (n.includes('olympic') || n.includes('gold')) return 3;
  if (n.includes('silver') || n.includes('bronze')) return 5;
  if (n.includes('all-star')) return 6;
  return 4;
};

// The Hall of Records on the start screen reads this list.
function saveCareer(entry) {
  const read = () => {
    try { return JSON.parse(localStorage.getItem('hockey_career_history') || '[]'); } catch { return []; }
  };
  try {
    localStorage.setItem('hockey_career_history', JSON.stringify([{ id: Date.now(), ...entry }, ...read()]));
  } catch { /* storage unavailable: the career still ends, it just is not filed */ }
}

export default function RetirementScreen() {
  const { handleNewGame, player, safeNationalities } = useAppContext();
  const score = useMemo(() => computeCareerScore(player), [player]);

  const natObj = (safeNationalities || []).find(n => n.id === player.nat);
  const country = natObj?.name || player.nat || '';
  const isLegend = score.tier === 'Generational Icon' || score.tier === 'Hall of Famer';
  const isGoalie = player.pos === 'G';
  const isDman = isDefence(player.pos);
  const history = player.seasonHistory || [];
  const peakOvr = player.stats?.peakOvr || player.ovr;

  // ── Building the career from its seasons ───────────────────────────────────

  const clubRows = [];
  const intlRows = [];
  history.forEach(season => {
    const clubAwards = [];
    const intlAwards = [];
    (season.awards || []).forEach(aw => {
      const l = aw.toLowerCase();
      if (l.includes('olympic') || l.includes('world junior') || l.includes('world championship') || l.includes('wjc') || l.includes('wc gold') || l.includes('wc survival') || l.includes('wc promotion')) intlAwards.push(aw);
      else clubAwards.push(aw);
    });

    // A tournament is not a season and has no playoffs, so it gets its own
    // table. Older saves without tournament stats get dashes rather than the
    // numbers the old screen used to invent for them.
    if (season.intlData || intlAwards.length) {
      const st = season.intlData?.stats || null;
      let name = season.intlData?.tournamentName;
      if (!name) {
        const first = intlAwards[0] || '';
        name = `${season.year} ${first.includes('World Juniors') || first.includes('WJC') ? 'World Juniors'
          : first.includes('Olympics') ? 'Winter Olympics'
            : first.includes('World Championship') ? 'World Championship' : 'International tournament'}`;
      }
      intlRows.push({
        year: season.year, name, league: 'INTL', awards: intlAwards, known: !!st,
        isCaptain: season.intlData?.letter === 'C', isAlternate: season.intlData?.letter === 'A',
        games: season.intlData?.gamesPlayed ?? null,
        goals: st?.g ?? 0, assists: st?.a ?? 0, saves: st?.saves ?? 0, shots: st?.shots ?? 0,
        shutouts: st?.sho ?? 0, plusMinus: st?.pm ?? 0, blocks: st?.blk ?? 0,
        sog: st?.sog ?? 0, fot: st?.fot ?? 0, fow: st?.fow ?? 0
      });
    }

    // A season is not always one club. The stints record the split, so a
    // year with a deadline trade or a call-up becomes a row for each.
    const legs = (Array.isArray(season.stints) && season.stints.length > 1)
      ? season.stints.map(st => ({
          team: st.team, league: st.league, games: st.games || 0,
          wins: st.wins || 0, losses: st.losses || 0, otl: st.otl || 0,
          goals: st.g ?? st.goals ?? 0, assists: st.a ?? st.assists ?? 0,
          saves: st.saves || 0, shots: st.shots || 0, shutouts: st.sho ?? st.shutouts ?? 0,
          plusMinus: st.pm ?? st.plusMinus ?? 0, blocks: st.blk ?? st.blocks ?? 0,
          sog: st.sog || 0, fot: st.fot || 0, fow: st.fow || 0
        }))
      : [{
          team: season.team, league: season.league, games: season.games || 0,
          wins: season.wins || 0, losses: season.losses || 0, otl: season.otl || 0,
          goals: season.goals || 0, assists: season.assists || 0,
          saves: season.saves || 0, shots: season.shots || 0, shutouts: season.shutouts || 0,
          plusMinus: season.plusMinus || 0, blocks: season.blocks || 0,
          sog: season.sog || 0, fot: season.fot || 0, fow: season.fow || 0
        }];

    // The playoffs, the letter and the hardware belong to the club he
    // finished the year with, so they sit on the last leg only.
    legs.forEach((leg, i) => {
      const last = i === legs.length - 1;
      clubRows.push({
        ...leg, year: season.year,
        titleWon: last ? season.titleWon : 0,
        isCaptain: last && season.isCaptain, isAlternate: last && season.isAlternate,
        playoffGames: last ? (season.playoffGames || 0) : 0,
        playoffGoals: last ? (season.playoffGoals || 0) : 0,
        playoffAssists: last ? (season.playoffAssists || 0) : 0,
        playoffSaves: last ? (season.playoffSaves || 0) : 0,
        playoffShots: last ? (season.playoffShots || 0) : 0,
        playoffShutouts: last ? (season.playoffShutouts || 0) : 0,
        awards: last ? clubAwards : []
      });
    });
  });

  // One line per league, in the order he first played in it.
  const leagueTotals = [];
  clubRows.forEach(r => {
    let t = leagueTotals.find(x => x.league === r.league);
    if (!t) {
      t = { league: r.league, seasons: new Set(), games: 0, goals: 0, assists: 0, saves: 0, shots: 0, shutouts: 0,
            plusMinus: 0, blocks: 0, sog: 0, fot: 0, fow: 0, wins: 0, losses: 0, otl: 0,
            poGames: 0, poGoals: 0, poAssists: 0, poSaves: 0, poShots: 0, poShutouts: 0 };
      leagueTotals.push(t);
    }
    t.seasons.add(r.year);
    ['games', 'goals', 'assists', 'saves', 'shots', 'shutouts', 'plusMinus', 'blocks', 'sog', 'fot', 'fow', 'wins', 'losses', 'otl']
      .forEach(k => { t[k] += r[k] || 0; });
    t.poGames += r.playoffGames; t.poGoals += r.playoffGoals; t.poAssists += r.playoffAssists;
    t.poSaves += r.playoffSaves; t.poShots += r.playoffShots; t.poShutouts += r.playoffShutouts;
  });

  // The club he is remembered at: the one he played most games for.
  const byClub = {};
  clubRows.forEach(r => {
    const k = `${r.team}|${r.league}`;
    byClub[k] = byClub[k] || { team: r.team, league: r.league, games: 0, first: r.year, last: r.year };
    byClub[k].games += r.games || 0;
    byClub[k].last = Math.max(byClub[k].last, r.year);
  });
  const home = Object.values(byClub).sort((a, b) => b.games - a.games)[0]
    || { team: player.team, league: player.league, games: 0 };
  const homeName = getFullTeamName(home.team, home.league);
  const homeData = getTeamData(home.team, home.league);
  const accent = teamAccent(homeData);
  // The banner is the club's main colour, dark or not: a navy banner with a
  // white number is exactly what Toronto hangs. The second colour is the stripe.
  const isHex = (c) => typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c);
  const bannerColor = isHex(homeData?.bg) ? homeData.bg : accent;
  const stripeColor = isHex(homeData?.color) && homeData.color.toLowerCase() !== bannerColor.toLowerCase()
    ? homeData.color : 'rgba(255,255,255,0.85)';
  // The colour the page is lit in. A club's accent is often its light colour
  // (white, for Toronto), which washes everything grey, so the page uses the
  // main colour unless that's too close to black to show.
  const lum = (hex) => {
    if (!isHex(hex)) return 0;
    const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const tone = lum(bannerColor) > 0.07 ? bannerColor : accent;
  const arena = home.league === 'NHL' && NHL_ARENAS[home.team] ? NHL_ARENAS[home.team] : null;

  const firstYear = history[0]?.year;
  const lastYear = history[history.length - 1]?.year;
  const span = firstYear ? `${firstYear}-${lastYear + 1}` : '';

  // The draft line, from wherever the save kept it.
  let pick = player.draftPick || player.stats?.draftPick;
  if (!pick) pick = history.find(s => s.draftPick)?.draftPick;
  const draftedBy = player.draftTeam || player.rights || null;
  const draftLine = pick
    ? `Drafted #${pick} overall${draftedBy ? ` by ${withTeamArticle(getFullTeamName(draftedBy, 'NHL'), 'NHL')}` : ''}`
    : draftedBy ? `Drafted by ${withTeamArticle(getFullTeamName(draftedBy, 'NHL'), 'NHL')}` : 'Never drafted';

  // ── The trophy case ────────────────────────────────────────────────────────

  const champs = {};
  history.filter(s => s.titleWon).forEach(s => {
    const lg = s.league || 'NHL';
    champs[lg] = champs[lg] || { name: getPlayoffTitles(lg).cupName, league: lg, years: [] };
    champs[lg].years.push(s.year + 1);
  });
  const LEAGUE_ORDER = ['NHL', 'AHL', 'NCAA', 'OHL', 'WHL', 'QMJHL'];
  const champList = Object.values(champs)
    .sort((a, b) => (LEAGUE_ORDER.indexOf(a.league) + 99) % 99 - (LEAGUE_ORDER.indexOf(b.league) + 99) % 99);

  const honours = {};
  history.forEach(s => {
    Array.from(new Set(s.awards || [])).forEach(aw => {
      const raw = String(aw);
      if (/stanley cup|calder cup$|championship$|robertson|chynoweth|courteau/i.test(raw) && !/memorial cup/i.test(raw)) return;
      if (/promotion|survival/i.test(raw)) return;
      let key = raw.replace(/^\d{4}\s/, '').replace(/\s\d{4}$/, '').replace(/\s*\(.+?\)\s*$/, '').trim();
      let kind = 'major';
      let metal = null;
      const medal = key.match(/^(Gold|Silver|Bronze),\s*(Winter Olympics|Olympics|World Juniors|World Championship)/i);
      if (medal) {
        metal = medal[1].toLowerCase();
        const event = /olympic/i.test(medal[2]) ? 'Olympic' : titleCase(medal[2]);
        key = `${event} ${titleCase(metal)}`;
        kind = 'medal';
      } else if (/all-star/i.test(key)) {
        // All-Star games and teams aren't trophies, so they stay out of
        // the case.
        return;
      } else if (/memorial cup/i.test(key)) {
        kind = 'cup';
      } else if (s.league !== 'NHL') {
        kind = 'minor';
      }
      key = titleCase(key);
      honours[key] = honours[key] || { name: key, years: [], raw, kind, metal, league: s.league };
      honours[key].years.push(s.year + 1);
    });
  });
  const honourList = Object.values(honours)
    .sort((a, b) => honourRank(a.name) - honourRank(b.name) || b.years.length - a.years.length);
  // The shelves, in the order a career is talked about.
  const shelves = ['cup', 'major', 'medal', 'minor'].map(kind => ({
    kind,
    items: [
      ...(kind === 'cup' ? champList.map(c => ({ name: c.name, years: c.years, league: c.league, kind: 'cup' })) : []),
      ...honourList.filter(h => h.kind === kind)
    ]
  })).filter(sh => sh.items.length);

  // ── Headline numbers ───────────────────────────────────────────────────────

  // The league the career is measured in: the NHL if he got there, otherwise
  // wherever he played the most.
  const headline = leagueTotals.find(t => t.league === 'NHL' && t.games > 0)
    || [...leagueTotals].sort((a, b) => b.games - a.games)[0] || null;
  const all = leagueTotals.reduce((a, t) => ({
    games: a.games + t.games, goals: a.goals + t.goals, assists: a.assists + t.assists,
    saves: a.saves + t.saves, shots: a.shots + t.shots, shutouts: a.shutouts + t.shutouts, wins: a.wins + t.wins
  }), { games: 0, goals: 0, assists: 0, saves: 0, shots: 0, shutouts: 0, wins: 0 });

  const heldRecords = recordsHeld(player.recordBook);
  // What he was paid, and what an old club still owes him on a buyout.
  const earnings = (player.stats?.careerEarnings || player.stats?.earnings || 0) + buyoutOwed(player);
  const hof = hallOfFame(score, history.length ? history[history.length - 1].year : null);

  // The colour the tier is shown in, as a hex the page can glow with.
  const tierHex = (String(score.color).match(/#[0-9a-f]{6}/i) || ['#94a3b8'])[0];
  const titles = champList.reduce((n, c) => n + c.years.length, 0);
  const awards = careerTrophies(player).individual;

  // The last line of a career, in proportion to it.
  const theClub = withTeamArticle(homeName, home.league, true);
  const sendOff = isLegend
    ? `${arena ? `${arena} raises` : `${theClub} raise`} your number to the rafters, and nobody's wearing it again.`
    : score.tier === 'Franchise Cornerstone'
      ? `You were the heart of ${withTeamArticle(homeName, home.league)} for years, and the building stood for you on your last night.`
      : score.tier === 'Solid Pro'
        ? 'You made a real career of it, and plenty of good players never get to say that.'
        : score.tier === 'Journeyman'
          ? 'You played wherever they needed you, and you never stopped showing up.'
          : 'You never stopped chasing it. Now you hang up the skates.';

  // Where the score sits on the ladder: inside his own tier's band, as far
  // along it as the number reaches.
  const tierIdx = Math.max(0, TIERS.findIndex(t => t.name === score.tier));
  const ladderAt = (() => {
    const lo = TIERS[tierIdx].from;
    const hi = TIERS[tierIdx + 1]?.from ?? lo + 2000;
    const within = Math.max(0.08, Math.min(0.92, (score.total - lo) / (hi - lo)));
    return ((tierIdx + within) / TIERS.length) * 100;
  })();
  const topPoints = Math.max(1, ...(score.breakdown || []).map(b => Math.abs(b.points)));

  // The skyline: one bar a season, as tall as the year was good. Points for a
  // skater, wins for a goalie (games where a save didn't record wins).
  const skyline = history.map(s => {
    const value = isGoalie ? (s.wins || Math.round((s.games || 0) * 0.5)) : (s.goals || 0) + (s.assists || 0);
    return {
      year: s.year, league: s.league, team: s.team, value,
      title: !!s.titleWon, captain: !!s.isCaptain,
      award: (s.awards || []).some(a => !/cup|championship|gold|silver|bronze|promotion|survival|all-star/i.test(String(a)))
    };
  });
  const skyMax = Math.max(1, ...skyline.map(b => b.value));
  const skyPeak = skyline.reduce((best, b) => (b.value > (best?.value ?? -1) ? b : best), null);
  const leaguesPlayed = [...new Set(history.map(s => s.league).filter(Boolean))];

  // The table in blocks: a new block every time he changes level, so the
  // junior years, the minors and the NHL read as separate chapters.
  const blocks = [];
  clubRows.forEach(r => {
    const last = blocks[blocks.length - 1];
    if (last && last.league === r.league) last.rows.push(r);
    else blocks.push({ league: r.league, rows: [r] });
  });

  // ── Saving it to the Hall of Records ───────────────────────────────────────

  const finish = () => {
    const nhl = player.stats?.nhl || {};
    saveCareer({
      name: player.name, pos: player.pos, number: player.number,
      games: nhl.games || 0,
      points: isGoalie ? sv3(nhl.saves || 0, nhl.shots || 0) : (nhl.goals || 0) + (nhl.assists || 0),
      cups: history.filter(s => s.league === 'NHL' && s.titleWon).length,
      awards: careerTrophies(player).individual, earnings,
      team: homeName, logo: home.team, league: home.league,
      isLegend, careerScore: score.total
    });
    handleNewGame();
  };

  // ── The page ───────────────────────────────────────────────────────────────

  const statsFor = (t, po) => {
    if (!t) return [];
    const gp = po ? t.poGames : t.games;
    if (isGoalie) {
      return po
        ? [['Games', gp], ['Save %', sv3(t.poSaves, t.poShots)], ['GAA', gaa2(t.poSaves, t.poShots, gp)], ['Shutouts', t.poShutouts]]
        : [['Games', gp], ['Wins', t.wins], ['Save %', sv3(t.saves, t.shots)], ['GAA', gaa2(t.saves, t.shots, gp)], ['Shutouts', t.shutouts]];
    }
    return po
      ? [['Games', gp], ['Goals', t.poGoals], ['Assists', t.poAssists], ['Points', t.poGoals + t.poAssists]]
      : [['Games', gp], ['Goals', t.goals], ['Assists', t.assists], ['Points', t.goals + t.assists],
         ...(isDman ? [['Blocks', t.blocks]] : [])];
  };

  // Every skater gets the same four: games, goals, assists, points. Shooting
  // percentage, faceoffs and blocks were extra columns that made the table
  // wider without telling the story of a season any better.
  const regCols = isGoalie ? 5 : 4;

  return (
    <div className="min-h-screen px-3 py-4 sm:p-8 bg-[#040505] text-white font-sans" style={{ '--club': tone }}>
      <div className="w-full max-w-4xl mx-auto space-y-3 sm:space-y-4">

        {/* THE SEND-OFF.
            This is the last screen of a career and it was the quietest one in
            the game: a dark panel, a small banner in the corner and grey
            numbers. It's lit in the club's colours now, with the banner hanging
            from the rafters, the number behind everything, and the four things
            people remember about a career in their own colours: the rating at
            his best, the championships in gold, the trophies, and the money. */}
        <section className="relative overflow-hidden rounded-2xl border"
                 style={{
                   borderColor: `color-mix(in srgb, ${tone} 60%, transparent)`,
                   background: `radial-gradient(120% 90% at 0% 0%, color-mix(in srgb, ${tone} 55%, transparent) 0%, transparent 62%),
                                radial-gradient(90% 80% at 100% 100%, color-mix(in srgb, ${tierHex} 16%, transparent) 0%, transparent 70%),
                                linear-gradient(180deg, color-mix(in srgb, ${bannerColor} 32%, #060908) 0%, #060908 100%)`
                 }}>
          {/* The rafters. */}
          <div className="absolute inset-x-0 top-0 h-[6px]"
               style={{ background: `linear-gradient(90deg, ${tone}, color-mix(in srgb, ${tone} 30%, transparent))` }} />
          {/* His number, behind everything. */}
          <span aria-hidden="true"
                className="absolute -right-4 sm:right-2 -top-6 sm:-top-10 font-black sports-font leading-none select-none pointer-events-none"
                style={{ fontSize: 'clamp(10rem, 34vw, 22rem)', color: `color-mix(in srgb, ${tone} 22%, transparent)` }}>
            {player.number}
          </span>

          <div className="relative flex gap-4 sm:gap-8 px-4 sm:px-8 pb-5 sm:pb-7">
            {/* A retired number, hanging the way an arena hangs one. */}
            <div className="shrink-0 w-[100px] sm:w-[156px] flex flex-col items-center">
              <div className="w-[62%] flex justify-between h-5 sm:h-7">
                <span className="w-px h-full bg-white/30" />
                <span className="w-px h-full bg-white/30" />
              </div>
              <div className="relative w-full pt-3 pb-8 px-2 text-center shadow-[0_18px_40px_rgba(0,0,0,0.6)] banner-sway"
                   style={{
                     background: `linear-gradient(180deg, color-mix(in srgb, ${bannerColor} 85%, #fff) 0%, ${bannerColor} 40%, color-mix(in srgb, ${bannerColor} 70%, #000) 100%)`,
                     clipPath: 'polygon(0 0, 100% 0, 100% 86%, 50% 100%, 0 86%)'
                   }}>
                <div className="absolute inset-x-0 top-[6px] h-[3px]" style={{ backgroundColor: stripeColor }} />
                <div className="mx-auto mt-1 w-14 h-14 sm:w-20 sm:h-20 flex items-center justify-center rounded-full bg-black/25">
                  <TeamLogo teamId={home.team} league={home.league} isAHL={home.league === 'AHL'} size="small" />
                </div>
                <p className="mt-1 text-[50px] sm:text-[76px] font-black sports-font leading-none text-white drop-shadow-[0_3px_0_rgba(0,0,0,0.35)]">
                  {player.number}
                </p>
                <p className="mt-1 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white/90 leading-tight break-words">
                  {(player.name || '').split(' ').slice(-1)[0]}
                </p>
                {span && <p className="mt-0.5 text-[9px] sm:text-[11px] font-bold text-white/70 number-font">{span}</p>}
                <div className="mt-2 -mx-2 h-[3px]" style={{ backgroundColor: stripeColor }} />
              </div>
            </div>

            <div className="min-w-0 flex-1 pt-6 sm:pt-9">
              <p className="text-[11px] sm:text-sm font-black" style={{ color: tierHex }}>
                {score.tier}
              </p>
              <h1 className="mt-1 text-[2.1rem] sm:text-6xl font-black sports-font uppercase leading-[0.92] text-white break-words tracking-tight">
                {player.name}
              </h1>
              <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] sm:text-sm font-bold text-slate-300">
                <span>{POS_NAME[player.pos] || player.pos}</span>
                <span className="text-slate-600">/</span>
                {natObj?.img && <img src={natObj.img} alt="" className="w-4 h-3 object-cover rounded-[2px]" />}
                <span>{country}</span>
              </p>
              <p className="mt-0.5 text-[12px] sm:text-sm font-bold text-slate-400">
                Retired at {player.age}{span ? `, after ${history.length} ${history.length === 1 ? 'season' : 'seasons'}` : ''}
              </p>
              {/* White, not the club's colour. Plenty of clubs are red, and
                  red text means something went wrong everywhere else in the
                  game. */}
              <p className="mt-1 text-[12px] sm:text-sm font-black text-white">
                {home.games} games with {withTeamArticle(homeName, home.league)}
              </p>
              <p className="mt-0.5 text-[12px] sm:text-sm font-bold text-slate-400">{draftLine}</p>
              <p className="mt-4 text-[15px] sm:text-xl font-bold text-white leading-snug max-w-lg">
                {sendOff}
              </p>
            </div>
          </div>

          {/* What a career is remembered by, each in its own colour. */}
          <div className="relative grid grid-cols-2 sm:grid-cols-4 border-t border-white/10 bg-black/30">
            {[
              { label: 'Peak rating', value: peakOvr, color: tierHex },
              { label: titles === 1 ? 'Championship' : 'Championships', value: titles, color: titles ? '#F59E0B' : '#64748b' },
              { label: awards === 1 ? 'Individual trophy' : 'Individual trophies', value: awards, color: awards ? '#ffffff' : '#64748b' },
              { label: 'Career earnings', value: formatMoney(earnings), color: '#22E748' }
            ].map((h, i) => (
              <div key={h.label}
                   className={`min-w-0 px-5 sm:px-6 py-4 sm:py-5 ${i % 2 ? 'border-l' : ''} ${i === 2 ? 'sm:border-l' : ''} ${i > 1 ? 'border-t sm:border-t-0' : ''} border-white/10`}>
                {/* Sized to the cell, so a long figure like $119.6M keeps the
                    same gap to the edge as a 1 does instead of running up to
                    the border. */}
                <p className="text-[clamp(1.6rem,3.3vw,2.35rem)] font-black sports-font leading-none number-font whitespace-nowrap"
                   style={{ color: h.color, textShadow: `0 0 28px color-mix(in srgb, ${h.color} 35%, transparent)` }}>
                  {h.value}
                </p>
                <p className="mt-1.5 text-[10px] sm:text-[11px] font-bold text-slate-400">{h.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* THE HALL OF FAME.
            It sat inside the banner as a purple badge, under the closing line,
            where it read as one more caption. Being inducted gets its own
            plaque, cast in bronze the way the real ones are. A career that
            came close gets the empty space on the wall instead. */}
        {hof?.inducted && (
          <section className="rounded-2xl p-[6px] fade-up"
                   style={{ background: 'linear-gradient(160deg, #3a2614, #1c120a)', boxShadow: '0 20px 50px -20px rgba(0,0,0,0.8)' }}>
            <div className="relative overflow-hidden rounded-xl px-5 sm:px-10 py-6 sm:py-8 text-center"
                 style={{
                   background: 'linear-gradient(155deg, #c9a46a 0%, #8f6a36 48%, #b38a50 72%, #7c5a2c 100%)',
                   color: '#2b1c0c',
                   textShadow: '0 1px 0 rgba(255,236,200,0.35)'
                 }}>
              <div className="absolute inset-0 pointer-events-none"
                   style={{ background: 'radial-gradient(70% 60% at 30% 0%, rgba(255,240,210,0.35), transparent 70%)' }} />
              {['left-3 top-3', 'right-3 top-3', 'left-3 bottom-3', 'right-3 bottom-3'].map(pos => (
                <span key={pos} className={`absolute ${pos} w-2.5 h-2.5 rounded-full`}
                      style={{ background: 'radial-gradient(circle at 35% 35%, #f5deb0, #6b4a22)' }} />
              ))}
              <p className="relative text-[11px] sm:text-xs font-black tracking-[0.3em] uppercase">Hockey Hall of Fame</p>
              <p className="relative mt-1 text-[11px] sm:text-xs font-bold">Inducted {hof.classYear}, {hof.ballot.replace(/\b(?!on\b|the\b)[a-z]/g, c => c.toUpperCase())}</p>
              <p className="relative mt-3 text-3xl sm:text-5xl font-black sports-font uppercase leading-none tracking-tight break-words">{player.name}</p>
              <div className="relative mx-auto mt-3 h-px w-40 sm:w-64" style={{ background: 'rgba(43,28,12,0.45)' }} />
              <p className="relative mt-3 text-[13px] sm:text-base font-bold leading-relaxed max-w-xl mx-auto">
                {POS_NAME[player.pos] || player.pos}, {span}. {all.games} games across {history.length} seasons
                {titles > 0 ? `, ${titles} ${titles === 1 ? 'championship' : 'championships'}` : ''}
                {awards > 0 ? `, ${awards} individual ${awards === 1 ? 'trophy' : 'trophies'}` : ''}.
                {' '}You made your name with {withTeamArticle(homeName, home.league)}.
              </p>
            </div>
          </section>
        )}
        {hof?.nearMiss && (
          <section className="rounded-2xl border-2 border-dashed border-[rgba(255,255,255,0.14)] bg-[#0b0e0c] px-5 sm:px-8 py-5 text-center">
            <p className="text-[11px] font-black tracking-[0.3em] uppercase text-slate-500">Hockey Hall of Fame</p>
            <p className="mt-2 text-sm sm:text-base font-bold text-slate-300 leading-relaxed">
              You were on the ballot from {hof.eligible} and never got in. There's a space on the wall that stayed empty.
            </p>
          </section>
        )}

        {/* WHERE THE CAREER LANDS.
            The score used to be a number in a box with a list of line items
            beside it. It's a ladder now: every tier in its own colour, and a
            marker where this career stopped. Under it, what got it there, as
            bars, so the Hart reads bigger than the seasons in the minors. */}
        <Section title="Your Career">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-8">
            <div className="shrink-0">
              <p className="text-5xl sm:text-6xl font-black sports-font leading-none number-font"
                 style={{ color: tierHex, textShadow: `0 0 34px ${tint(tierHex, 40)}` }}>
                {score.total.toLocaleString()}
              </p>
              <p className="mt-1.5 text-sm sm:text-base font-black text-white">{score.tier}</p>
            </div>
            <div className="min-w-0 flex-1 pb-1">
              <div className="relative">
                <div className="flex h-3 rounded-full overflow-hidden">
                  {TIERS.map((t, i) => (
                    <span key={t.name} className="flex-1"
                          style={{ background: i <= tierIdx ? t.hex : tint(t.hex, 18), opacity: i < tierIdx ? 0.55 : 1 }} />
                  ))}
                </div>
                <span className="absolute -top-1.5 w-1.5 h-6 rounded-full bg-white shadow-[0_0_0_3px_#060908]"
                      style={{ left: `calc(${ladderAt}% - 3px)` }} aria-hidden="true" />
              </div>
              {/* The names only fit side by side on a wider screen; a phone has
                  the tier written out above the bar already. */}
              <div className="mt-2 hidden sm:grid grid-cols-6 gap-1">
                {TIERS.map((t, i) => (
                  <span key={t.name} className={`text-[10px] font-bold leading-tight ${i === tierIdx ? 'text-white' : 'text-slate-500'}`}>
                    {t.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
          {!!score.breakdown?.length && (
            <ul className="mt-5 space-y-2">
              {score.breakdown.map((b, i) => (
                <li key={i} className="grid grid-cols-[minmax(0,9rem)_1fr_auto] sm:grid-cols-[minmax(0,13rem)_1fr_auto] items-center gap-3 text-[12px]">
                  <span className="min-w-0 break-words text-slate-300 font-bold">{b.label}</span>
                  <span className="h-2 rounded-full bg-[rgba(255,255,255,0.05)] overflow-hidden">
                    <span className="block h-full rounded-full"
                          style={{ width: `${(Math.abs(b.points) / topPoints) * 100}%`, background: b.points < 0 ? '#ef4444' : tierHex }} />
                  </span>
                  <span className={`w-12 text-right font-black number-font ${b.points < 0 ? 'text-[#ef4444]' : 'text-white'}`}>
                    {b.points > 0 ? '+' : ''}{b.points.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* THE TROPHY CASE. */}
        <Section title="Trophy Case"
                 meta={shelves.length ? null : 'Empty'}>
          {shelves.length ? (
            <div className="space-y-5">
              {shelves.map(sh => (
                <div key={sh.kind}>
                  <p className="mb-2 text-[11px] font-black" style={{ color: KINDS[sh.kind].hex }}>
                    {KINDS[sh.kind].shelf}
                  </p>
                  <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 gap-2">
                    {sh.items.map(h => (
                      <Honour key={h.name} name={h.name} count={h.years.length} years={h.years} league={h.league}
                              kind={h.kind} metal={h.metal}
                              img={h.kind === 'cup' ? null : (getAwardImage(h.raw) || getAwardImage(h.name))} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">You never won anything you could put on a shelf.</p>
          )}
        </Section>

        {/* THE NUMBERS, WHERE THEY COUNT. */}
        {headline && (
          <Section title="Career Numbers">
            {/* One full-width line each for the regular season and the
                playoffs, with every number in its own cell. Side by side, the
                two panels left four or five numbers crammed into half the
                width. */}
            <div className="space-y-3">
              {[{ title: 'Regular Season', po: false }, { title: 'Playoffs', po: true }].map(({ title, po }) => {
                const cells = statsFor(headline, po);
                return (
                  <div key={title} className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0d110d] overflow-hidden">
                    <p className="px-4 sm:px-5 pt-3 text-[11px] font-black text-slate-400">{title}</p>
                    {po && headline.poGames === 0 ? (
                      <p className="px-4 sm:px-5 pt-2 pb-4 text-sm text-slate-500">You never played a playoff game in the {headline.league}.</p>
                    ) : (
                      <div className="grid" style={{ gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))` }}>
                        {cells.map(([l, v], i) => (
                          <div key={l} className={`px-4 sm:px-5 pt-2 pb-3.5 sm:pb-4 ${i ? 'border-l border-[rgba(255,255,255,0.06)]' : ''}`}>
                            <p className="text-[1.35rem] sm:text-[2rem] font-black sports-font leading-none number-font whitespace-nowrap"
                               style={{ color: '#fff' }}>
                              {v}
                            </p>
                            <p className="mt-1.5 text-[10px] sm:text-[11px] font-bold text-slate-500">{l}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* SEASON BY SEASON. */}
        <Section title="Season by Season">
          {/* THE SKYLINE. Every season as a bar, as tall as the year was
              good, in the colour of the league it was played in. Gold caps
              are championships, a white dot is a year with a trophy in it. */}
          {skyline.length > 1 && (
            <div className="mb-6">
              <div className="flex items-end gap-[3px] sm:gap-1 h-36 sm:h-44 pt-6">
                {skyline.map((b, i) => {
                  const h = 6 + (b.value / skyMax) * 100;
                  const hue = hueOf(b.league);
                  const peak = b === skyPeak;
                  return (
                    <div key={i} className="relative flex-1 min-w-0 h-full flex flex-col justify-end items-center"
                         title={`${seasonLabel(b.year)}: ${getFullTeamName(b.team, b.league)} (${b.league}), ${b.value} ${isGoalie ? 'wins' : 'points'}`}>
                      {peak && (
                        <span className="absolute text-[10px] sm:text-[11px] font-black number-font text-white whitespace-nowrap"
                              style={{ bottom: `calc(${h}% + ${b.title || b.award ? 14 : 4}px)` }}>
                          {b.value}
                        </span>
                      )}
                      {(b.title || b.award) && (
                        <span className="mb-1 w-2 h-2 rounded-full shrink-0"
                              style={{ background: b.title ? '#F59E0B' : '#ffffff', boxShadow: b.title ? '0 0 10px #F59E0B' : 'none' }} />
                      )}
                      <span className="w-full rounded-t-[3px]"
                            style={{
                              height: `${h}%`,
                              background: `linear-gradient(180deg, ${hue}, ${tint(hue, 45)})`,
                              boxShadow: b.title ? 'inset 0 3px 0 0 #F59E0B' : 'none'
                            }} />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-1.5 text-[10px] font-bold text-slate-500 number-font">
                <span>{seasonLabel(skyline[0].year)}</span>
                <span>{seasonLabel(skyline[skyline.length - 1].year)}</span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 text-[11px] font-bold">
                {leaguesPlayed.map(lg => (
                  <span key={lg} className="inline-flex items-center gap-1.5 text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ background: hueOf(lg) }} />{leagueLabel(lg)}
                  </span>
                ))}
                {skyline.some(b => b.title) && (
                  <span className="inline-flex items-center gap-1.5 text-[#F59E0B]">
                    <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />Champions
                  </span>
                )}
              </div>
            </div>
          )}

          {clubRows.length === 0 ? (
            <p className="text-sm text-slate-500">No seasons were recorded for this career.</p>
          ) : (
            <div tabIndex={0} role="region" aria-label="Table, scrolls sideways" className="-mx-4 sm:-mx-6 overflow-x-auto">
              <table className="w-full min-w-[620px] text-left whitespace-nowrap text-[12px] sm:text-[13px]">
                <thead>
                  <tr className="text-[10px] font-bold text-slate-600">
                    <td colSpan={3} />
                    <th colSpan={regCols} className="px-2 pb-1 text-center border-l border-[rgba(255,255,255,0.06)]">Regular season</th>
                    <th colSpan={4} className="px-2 pb-1 text-center border-l border-[rgba(255,255,255,0.06)]">Playoffs</th>
                  </tr>
                  <tr className="border-y border-[rgba(255,255,255,0.07)] bg-[#0d110d] text-[10px] font-bold text-slate-500">
                    <th className="pl-4 sm:pl-6 pr-2 py-2 font-bold">Season</th>
                    <th className="px-2 py-2 font-bold">Team</th>
                    <th className="px-2 py-2 font-bold">League</th>
                    <th className="px-2 py-2 text-right font-bold border-l border-[rgba(255,255,255,0.06)]">GP</th>
                    {isGoalie ? (<>
                      <th className="px-2 py-2 text-right font-bold">W-L-OT</th>
                      <th className="px-2 py-2 text-right font-bold">SV%</th>
                      <th className="px-2 py-2 text-right font-bold">GAA</th>
                      <th className="px-2 py-2 text-right font-bold">SO</th>
                    </>) : (<>
                      <th className="px-2 py-2 text-right font-bold">G</th>
                      <th className="px-2 py-2 text-right font-bold">A</th>
                      <th className="px-2 py-2 text-right font-bold">Pts</th>
                    </>)}
                    <th className="px-2 py-2 text-right font-bold border-l border-[rgba(255,255,255,0.06)]">GP</th>
                    <th className="px-2 py-2 text-right font-bold">{isGoalie ? 'SV%' : 'G'}</th>
                    <th className="px-2 py-2 text-right font-bold">{isGoalie ? 'GAA' : 'A'}</th>
                    <th className="pl-2 pr-4 sm:pr-6 py-2 text-right font-bold">{isGoalie ? 'SO' : 'Pts'}</th>
                  </tr>
                </thead>
                {blocks.map((blk, bi) => {
                  const hue = hueOf(blk.league);
                  const yrs = blk.rows.map(r => r.year);
                  const seasons = new Set(yrs).size;
                  return (
                <tbody key={`${blk.league}-${bi}`} className="divide-y divide-[rgba(255,255,255,0.04)]"
                       style={{ background: tint(hue, 4) }}>
                  <tr>
                    <td colSpan={7 + regCols} className="pl-4 sm:pl-6 pr-3 pt-3 pb-1.5"
                        style={{ background: `linear-gradient(90deg, ${tint(hue, 22)}, transparent 70%)`, boxShadow: `inset 4px 0 0 0 ${hue}` }}>
                      <span className="text-[12px] font-black" style={{ color: hue }}>{leagueLabel(blk.league)}</span>
                      <span className="ml-2 text-[10px] font-bold text-slate-400">
                        {seasons} {seasons === 1 ? 'season' : 'seasons'}, {seasonLabel(Math.min(...yrs))}{seasons > 1 ? ` to ${seasonLabel(Math.max(...yrs))}` : ''}
                      </span>
                    </td>
                  </tr>
                  {blk.rows.map((r, i) => {
                    const po = r.playoffGames > 0;
                    const cell = 'px-2 py-2 text-right number-font text-slate-300';
                    return (
                      <tr key={`${r.year}-${r.team}-${i}`} className="hover:bg-[rgba(255,255,255,0.02)]">
                        <td className="pl-4 sm:pl-6 pr-2 py-2 font-bold text-slate-300 number-font"
                            style={{ boxShadow: `inset 4px 0 0 0 ${hue}` }}>
                          <span className="flex items-center gap-1.5">
                            {seasonLabel(r.year)}
                            <Letter captain={r.isCaptain} alternate={r.isAlternate && !r.isCaptain} />
                          </span>
                        </td>
                        <td className="px-2 py-2 whitespace-normal w-full min-w-[170px]">
                          <span className="flex items-center gap-2 min-w-0">
                            <span className="shrink-0 w-6 h-6 flex items-center justify-center">
                              <TeamLogo teamId={r.team} league={r.league} isAHL={r.league === 'AHL'} size="tiny" />
                            </span>
                            <span className="hidden sm:inline font-bold text-white whitespace-nowrap">
                              {getFullTeamName(r.team, r.league)}
                            </span>
                          </span>
                          {/* What the year won, under the club that won it. It
                              had a column of its own, which pushed the table
                              off the side of the page. */}
                          {(r.titleWon || r.awards?.length > 0) && (
                            <span className="block mt-1.5"><YearHonours season={r} /></span>
                          )}
                        </td>
                        <td className="px-2 py-2 text-[11px] font-bold" style={{ color: hue }}>{r.league}</td>
                        <td className={`${cell} border-l border-[rgba(255,255,255,0.06)]`}>{r.games || 0}</td>
                        {isGoalie ? (<>
                          <td className={cell}>{r.wins}-{r.losses}-{r.otl}</td>
                          <td className={cell}>{sv3(r.saves, r.shots)}</td>
                          <td className={cell}>{gaa2(r.saves, r.shots, r.games)}</td>
                          <td className={`${cell} text-white font-black`}>{r.shutouts}</td>
                        </>) : (<>
                          <td className={cell}>{r.goals}</td>
                          <td className={cell}>{r.assists}</td>
                          <td className={`${cell} text-white font-black`}>{r.goals + r.assists}</td>
                        </>)}
                        <td className={`${cell} border-l border-[rgba(255,255,255,0.06)]`}>{po ? r.playoffGames : <Dash />}</td>
                        <td className={cell}>{po ? (isGoalie ? sv3(r.playoffSaves, r.playoffShots) : r.playoffGoals) : <Dash />}</td>
                        <td className={cell}>{po ? (isGoalie ? gaa2(r.playoffSaves, r.playoffShots, r.playoffGames) : r.playoffAssists) : <Dash />}</td>
                        <td className={`${cell} pr-4 sm:pr-6 ${po ? 'text-white font-black' : ''}`}>
                          {po ? (isGoalie ? r.playoffShutouts : r.playoffGoals + r.playoffAssists) : <Dash />}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                  );
                })}
                <tfoot className="border-t-2 border-[rgba(255,255,255,0.1)]">
                  {leagueTotals.filter(t => t.games > 0).map(t => {
                    const po = t.poGames > 0;
                    const cell = 'px-2 py-2 text-right number-font font-black text-slate-200';
                    return (
                      <tr key={t.league} style={{ background: tint(hueOf(t.league), 10) }}>
                        <td colSpan={3} className="pl-4 sm:pl-6 pr-2 py-2 text-[11px] font-bold text-slate-300"
                            style={{ boxShadow: `inset 4px 0 0 0 ${hueOf(t.league)}` }}>
                          <span style={{ color: hueOf(t.league) }}>{t.league}</span> totals
                          <span className="text-slate-600"> ({t.seasons.size} {t.seasons.size === 1 ? 'season' : 'seasons'})</span>
                        </td>
                        <td className={`${cell} border-l border-[rgba(255,255,255,0.06)]`}>{t.games}</td>
                        {isGoalie ? (<>
                          <td className={cell}>{t.wins}-{t.losses}-{t.otl}</td>
                          <td className={cell}>{sv3(t.saves, t.shots)}</td>
                          <td className={cell}>{gaa2(t.saves, t.shots, t.games)}</td>
                          <td className={`${cell} text-white`}>{t.shutouts}</td>
                        </>) : (<>
                          <td className={cell}>{t.goals}</td>
                          <td className={cell}>{t.assists}</td>
                          <td className={`${cell} text-white`}>{t.goals + t.assists}</td>
                        </>)}
                        <td className={`${cell} border-l border-[rgba(255,255,255,0.06)]`}>{po ? t.poGames : <Dash />}</td>
                        <td className={cell}>{po ? (isGoalie ? sv3(t.poSaves, t.poShots) : t.poGoals) : <Dash />}</td>
                        <td className={cell}>{po ? (isGoalie ? gaa2(t.poSaves, t.poShots, t.poGames) : t.poAssists) : <Dash />}</td>
                        <td className={`${cell} pr-4 sm:pr-6 ${po ? 'text-white' : ''}`}>{po ? (isGoalie ? t.poShutouts : t.poGoals + t.poAssists) : <Dash />}</td>
                      </tr>
                    );
                  })}
                </tfoot>
              </table>
            </div>
          )}

          {/* For his country. */}
          {intlRows.length > 0 && (
            <div className="mt-6">
              <p className="flex items-center gap-2 text-[12px] font-black text-white mb-2">
                {natObj?.img && <img src={natObj.img} alt="" className="w-5 h-3.5 object-cover rounded-[2px]" />}
                For {natObj?.sentenceName || country || 'your country'}
              </p>
              <div tabIndex={0} role="region" aria-label="Table, scrolls sideways" className="-mx-4 sm:-mx-6 overflow-x-auto">
                <table className="w-full min-w-[520px] text-left whitespace-nowrap text-[12px] sm:text-[13px]">
                  <thead>
                    <tr className="border-y border-[rgba(255,255,255,0.07)] bg-[#0d110d] text-[10px] font-bold text-slate-500">
                      <th className="pl-4 sm:pl-6 pr-2 py-2 font-bold">Tournament</th>
                      <th className="px-2 py-2 text-right font-bold border-l border-[rgba(255,255,255,0.06)]">GP</th>
                      <th className="px-2 py-2 text-right font-bold">{isGoalie ? 'SV%' : 'G'}</th>
                      <th className="px-2 py-2 text-right font-bold">{isGoalie ? 'GAA' : 'A'}</th>
                      <th className="px-2 py-2 text-right font-bold">{isGoalie ? 'SO' : 'Pts'}</th>
                      <th className="w-full px-3 py-2 font-bold">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
                    {intlRows.map((t, i) => {
                      const cell = 'px-2 py-2 text-right number-font text-slate-300';
                      return (
                        <tr key={i}>
                          <td className="pl-4 sm:pl-6 pr-2 py-2 font-bold text-slate-300"
                              style={{ boxShadow: 'inset 3px 0 0 0 rgba(232,121,249,0.55)' }}>
                            <span className="flex items-center gap-1.5">
                              {t.name}
                              <Letter captain={t.isCaptain} alternate={t.isAlternate && !t.isCaptain} />
                            </span>
                          </td>
                          <td className={`${cell} border-l border-[rgba(255,255,255,0.06)]`}>{t.known ? t.games : <Dash />}</td>
                          <td className={cell}>{t.known ? (isGoalie ? sv3(t.saves, t.shots) : t.goals) : <Dash />}</td>
                          <td className={cell}>{t.known ? (isGoalie ? gaa2(t.saves, t.shots, t.games) : t.assists) : <Dash />}</td>
                          <td className={`${cell} text-white font-black`}>{t.known ? (isGoalie ? t.shutouts : t.goals + t.assists) : <Dash />}</td>
                          <td className="px-3 py-2 whitespace-normal"><YearHonours season={t} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Section>

        {/* THE PEOPLE AND THE BOOK. */}
        {heldRecords.length > 0 && (
          <div>
            {heldRecords.length > 0 && (
              <Section title="Records you still hold" meta={heldRecords.length}>
                <ul className="space-y-2">
                  {heldRecords.map((r, i) => (
                    <li key={i} className="flex items-baseline gap-3 text-[12.5px]">
                      <span className="shrink-0 w-12 text-right font-black number-font text-white">{formatRecord(r.key, r.value)}</span>
                      <span className="min-w-0 flex-1 text-slate-300">
                        {RECORD_LABEL[r.key]}
                        <span className="text-slate-500">
                          {r.scope === 'club' ? `, ${getFullTeamName(r.club, r.league)}` : `, ${r.league} record`}, {r.year}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}
          </div>
        )}

        {/* THE DRAFT CLASS. */}
        {(() => {
          const table = classTable(player.peers, 8, player.pos);
          if (!table.length) return null;
          const unit = peerUnit(player.pos);
          const rows = [
            ...table.map(c => ({
              name: c.name, gp: c.career.gp, pts: peerValue(c, player.pos),
              rawPts: (c.career.g || 0) + (c.career.a || 0), blk: c.career.blk || 0,
              pick: c.pick, team: c.draftedBy, cups: c.career.titles || 0, trophies: c.career.trophies || 0, me: false
            })),
            {
              name: 'You', gp: player.stats?.nhl?.games || 0, pts: playerCareerValue(player),
              rawPts: (player.stats?.nhl?.goals || 0) + (player.stats?.nhl?.assists || 0),
              blk: player.stats?.nhl?.blocks || 0, pick: player.draftPick, team: player.draftTeam,
              cups: history.filter(ss => ss.titleWon).length, trophies: careerTrophies(player).individual, me: true
            }
          ].sort((x, y) => y.pts - x.pts).slice(0, 9);
          return (
            <Section title="Your Draft Class" meta={`The ${titleCase(groupName(compGroup(player.pos)))} of your year, by NHL ${unit}`}>
              <div tabIndex={0} role="region" aria-label="Table, scrolls sideways" className="-mx-4 sm:-mx-6 overflow-x-auto">
                <table className="w-full min-w-[520px] text-left whitespace-nowrap text-[12px] sm:text-[13px]">
                  <thead>
                    <tr className="border-y border-[rgba(255,255,255,0.07)] bg-[#0d110d] text-[10px] font-bold text-slate-500">
                      <th className="pl-4 sm:pl-6 pr-2 py-2 font-bold w-8">#</th>
                      <th className="px-2 py-2 font-bold">Player</th>
                      <th className="px-2 py-2 font-bold text-right">Drafted</th>
                      <th className="px-2 py-2 font-bold text-right">Honours</th>
                      <th className="px-2 py-2 font-bold text-right">GP</th>
                      <th className="pl-2 pr-4 sm:pr-6 py-2 font-bold text-right">{isGoalie ? 'Shutouts' : isDman ? 'Pts / BLK' : 'Points'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
                    {rows.map((r, i) => (
                      <tr key={`${r.name}-${i}`} className={r.me ? 'bg-[#22E748]/[0.08]' : ''}>
                        <td className="pl-4 sm:pl-6 pr-2 py-2 number-font text-slate-600">{i + 1}</td>
                        <td className={`px-2 py-2 font-bold ${r.me ? 'text-[#22E748]' : 'text-slate-200'}`}>{r.name}</td>
                        <td className="px-2 py-2 text-right text-slate-500">{r.pick ? `#${r.pick} ${r.team || ''}` : 'Undrafted'}</td>
                        <td className="px-2 py-2 text-right">
                          {r.cups > 0 && <span className="text-[#F59E0B] font-bold">{r.cups} {r.cups === 1 ? 'title' : 'titles'}</span>}
                          {r.cups > 0 && r.trophies > 0 && <span className="text-slate-600">, </span>}
                          {r.trophies > 0 && <span className="text-slate-300 font-bold">{r.trophies} {r.trophies === 1 ? 'award' : 'awards'}</span>}
                          {!r.cups && !r.trophies && <Dash />}
                        </td>
                        <td className="px-2 py-2 text-right number-font text-slate-400">{r.gp}</td>
                        <td className={`pl-2 pr-4 sm:pr-6 py-2 text-right number-font font-black ${r.me ? 'text-[#22E748]' : 'text-white'}`}>
                          {isDman ? `${r.rawPts} / ${r.blk}` : r.pts}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          );
        })()}

        <div className="pt-2 pb-6">
          <button onClick={finish}
                  className="btn-primary w-full py-4 rounded-xl text-lg sm:text-xl cursor-pointer sports-font tracking-widest uppercase">
            Start a new career
          </button>
        </div>
      </div>
    </div>
  );
}
