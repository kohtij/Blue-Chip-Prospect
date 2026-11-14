import { useMemo } from 'react';
import { useAppContext } from '../AppContext';
import { getFullTeamName, getPlayoffTitles } from '../utils/appHelpers';
import { careerTrophies, formatMoney, NO_ARTICLE_LEAGUES, withTeamArticle } from '../utils/gameHelpers';
import { classTable, compGroup, groupName, peerUnit, peerValue, playerCareerValue } from '../utils/peers';
import { isDefence } from '../utils/production';
import { formatRecord, RECORD_LABEL, recordsHeld } from '../utils/records';
import { closest } from '../utils/roster';
import { computeCareerScore, hallOfFame } from '../utils/careerScore';
import { buyoutOwed } from '../utils/bonuses';
import { getAwardImage } from '../data/awards';
import { getTeamData, readableAccent, teamAccent } from '../data/teams';
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
// The league colours appear only as the rule down the side of a season, to
// tell the junior years from the pro ones. The one loud thing on the page is
// the banner, in your club's own colour, because that is how a career is
// remembered in an arena.

const POS_NAME = { C: 'Centre', LW: 'Left wing', RW: 'Right wing', LD: 'Defence', RD: 'Defence', G: 'Goaltender' };

const LEAGUE_RULE = {
  NHL: 'rgba(34,231,72,0.6)', AHL: 'rgba(245,158,11,0.6)', ECHL: 'rgba(239,68,68,0.6)',
  OHL: 'rgba(59,130,246,0.6)', WHL: 'rgba(59,130,246,0.6)', QMJHL: 'rgba(59,130,246,0.6)', USHL: 'rgba(59,130,246,0.6)',
  NCAA: 'rgba(192,132,252,0.6)',
  SHL: 'rgba(56,189,248,0.6)', LIIGA: 'rgba(56,189,248,0.6)', J20: 'rgba(56,189,248,0.6)', U20: 'rgba(56,189,248,0.6)'
};
const leagueRule = (lg) => LEAGUE_RULE[lg] || 'rgba(148,163,184,0.45)';

const sv3 = (saves, shots) => (shots > 0 ? (saves / shots).toFixed(3).replace('0.', '.') : '.000');
const gaa2 = (saves, shots, gp) => (gp > 0 ? ((shots - saves) / gp).toFixed(2) : '0.00');
const pct1 = (a, b) => (b > 0 ? ((a / b) * 100).toFixed(1) : null);
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

function Stat({ label, value, strong = false }) {
  return (
    <div className="min-w-0">
      <p className={`text-xl sm:text-2xl font-black sports-font leading-none ${strong ? 'text-white' : 'text-slate-200'}`}>{value}</p>
      <p className="text-[10px] font-bold text-slate-500 mt-1.5">{label}</p>
    </div>
  );
}

function Honour({ name, count, years, img, league, champion }) {
  return (
    <div className={`flex items-center gap-2.5 sm:gap-3 rounded-xl border px-2.5 sm:px-3 py-2.5 ${
      champion ? 'border-[#F59E0B]/35 bg-[#F59E0B]/[0.07]' : 'border-[rgba(255,255,255,0.07)] bg-[#0d110d]'}`}>
      <span className="shrink-0 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center">
        {champion
          ? <TrophyImage league={league || 'NHL'} className="w-7 h-7 object-contain" />
          : img
            ? <img src={img} alt="" className="w-7 h-7 object-contain" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
            : <span className="w-2 h-2 rounded-full bg-slate-600" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block text-[13px] font-black leading-tight ${champion ? 'text-[#F59E0B]' : 'text-white'}`}>{name}</span>
        {!!years?.length && (
          <span className="block text-[10px] font-bold text-slate-500 mt-0.5 truncate">{years.join(', ')}</span>
        )}
      </span>
      {count > 1 && <span className="shrink-0 text-sm font-black number-font text-slate-300">×{count}</span>}
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
        <span className="inline-flex items-center gap-1 rounded border border-[#F59E0B]/40 bg-[#F59E0B]/10 px-1.5 py-[2px] text-[10px] font-bold text-[#F59E0B]">
          <TrophyImage league={season.league || 'NHL'} className="w-3 h-3" />
          {getPlayoffTitles(season.league).cupName}
        </span>
      )}
      {awards.map((a, i) => (
        <span key={i} className="inline-flex items-center gap-1 rounded border border-[rgba(255,255,255,0.1)] px-1.5 py-[2px] text-[10px] font-bold text-slate-300">
          {a.img && <img src={a.img} alt="" className="w-3 h-3 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
          {a.text}
        </span>
      ))}
    </span>
  );
}

// An award's name, short enough for a table row. Every league's trophies end in
// some arrangement of Memorial, Trophy and Award, which identify nothing.
function shortAward(raw, intl) {
  let text = String(raw).replace(/^\d{4}\s/, '').replace(/\s\d{4}$/, '');
  if (intl) {
    if (text.includes('Gold')) text = 'Gold medal';
    else if (text.includes('Silver')) text = 'Silver medal';
    else if (text.includes('Bronze')) text = 'Bronze medal';
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
  const isCentre = player.pos === 'C';
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
  const accentText = readableAccent(accent);
  // The banner is the club's main colour, dark or not: a navy banner with a
  // white number is exactly what Toronto hangs. The second colour is the stripe.
  const isHex = (c) => typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c);
  const bannerColor = isHex(homeData?.bg) ? homeData.bg : accent;
  const stripeColor = isHex(homeData?.color) && homeData.color.toLowerCase() !== bannerColor.toLowerCase()
    ? homeData.color : 'rgba(255,255,255,0.85)';
  const arena = home.league === 'NHL' && NHL_ARENAS[home.team] ? NHL_ARENAS[home.team] : null;

  const firstYear = history[0]?.year;
  const lastYear = history[history.length - 1]?.year;
  const span = firstYear ? `${firstYear}-${lastYear + 1}` : '';

  // The draft line, from wherever the save kept it.
  let pick = player.draftPick || player.stats?.draftPick;
  if (!pick) pick = history.find(s => s.draftPick)?.draftPick;
  const draftedBy = player.draftTeam || player.rights || null;
  const draftLine = pick
    ? `#${pick} overall${draftedBy ? `, ${draftedBy}` : ''}`
    : draftedBy ? `Drafted by ${draftedBy}` : 'Undrafted';

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
      if (/1st team all-star/i.test(key)) key = 'First All-Star Team';
      key = key.replace('Gold, Olympics', 'Olympic gold').replace('Silver, Olympics', 'Olympic silver').replace('Bronze, Olympics', 'Olympic bronze')
        .replace('Gold, World Juniors', 'World Juniors gold').replace('Silver, World Juniors', 'World Juniors silver').replace('Bronze, World Juniors', 'World Juniors bronze')
        .replace('Gold, World Championship', 'World Championship gold').replace('Silver, World Championship', 'World Championship silver').replace('Bronze, World Championship', 'World Championship bronze');
      honours[key] = honours[key] || { name: key, years: [], raw };
      honours[key].years.push(s.year + 1);
    });
  });
  const honourList = Object.values(honours)
    .sort((a, b) => honourRank(a.name) - honourRank(b.name) || b.years.length - a.years.length);

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
  const mostWith = closest(player.rooms);
  // What he was paid, and what an old club still owes him on a buyout.
  const earnings = (player.stats?.careerEarnings || player.stats?.earnings || 0) + buyoutOwed(player);
  const hof = hallOfFame(score, history.length ? history[history.length - 1].year : null);

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

  const regCols = isGoalie ? 5 : 5 + (isCentre ? 1 : 0);

  return (
    <div className="min-h-screen px-3 py-4 sm:p-8 bg-[#040505] text-white font-sans">
      <div className="w-full max-w-4xl mx-auto space-y-3 sm:space-y-4">

        {/* THE BANNER, AND WHO HE WAS. */}
        <section className="game-panel relative overflow-hidden p-4 sm:p-6">
          <div className="absolute inset-x-0 top-0 h-[3px]" style={{ backgroundColor: accent }} />
          <div className="absolute inset-0 pointer-events-none opacity-[0.10]"
               style={{ background: `radial-gradient(90% 70% at 0% 0%, ${accent} 0%, transparent 70%)` }} />

          <div className="relative flex gap-4 sm:gap-6">
            {/* A retired number, the way an arena hangs one. */}
            <div className="shrink-0 w-[92px] sm:w-[132px]">
              <div className="relative pt-3 pb-7 px-2 text-center shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
                   style={{
                     background: `linear-gradient(180deg, color-mix(in srgb, ${bannerColor} 88%, #fff) 0%, ${bannerColor} 45%, color-mix(in srgb, ${bannerColor} 75%, #000) 100%)`,
                     clipPath: 'polygon(0 0, 100% 0, 100% 86%, 50% 100%, 0 86%)'
                   }}>
                <div className="absolute inset-x-0 top-[6px] h-[3px]" style={{ backgroundColor: stripeColor }} />
                <div className="mx-auto mt-1 w-9 h-9 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-black/25">
                  <TeamLogo teamId={home.team} league={home.league} isAHL={home.league === 'AHL'} size="tiny" />
                </div>
                <p className="mt-1 text-[44px] sm:text-[64px] font-black sports-font leading-none text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.35)]">
                  {player.number}
                </p>
                <p className="mt-1 text-[9px] sm:text-[11px] font-black uppercase tracking-wider text-white/90 leading-tight break-words">
                  {(player.name || '').split(' ').slice(-1)[0]}
                </p>
                {span && <p className="mt-0.5 text-[9px] sm:text-[10px] font-bold text-white/70 number-font">{span}</p>}
                <div className="mt-2 -mx-2 h-[3px]" style={{ backgroundColor: stripeColor }} />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[11px] sm:text-xs font-bold text-slate-400">
                Retired at {player.age}{span ? `, after ${history.length} ${history.length === 1 ? 'season' : 'seasons'}` : ''}
              </p>
              <h1 className="mt-1 text-3xl sm:text-5xl font-black sports-font uppercase leading-[0.95] text-white break-words">
                {player.name}
              </h1>
              <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] sm:text-sm font-bold text-slate-300">
                <span>{POS_NAME[player.pos] || player.pos}</span>
                <span className="text-slate-600">/</span>
                {natObj?.img && <img src={natObj.img} alt="" className="w-4 h-3 object-cover rounded-[2px]" />}
                <span>{country}</span>
              </p>
              <p className="mt-1 text-[12px] sm:text-sm font-bold" style={{ color: accentText }}>
                {home.games} games with {withTeamArticle(homeName, home.league)}
              </p>
              <p className="mt-3 text-[12px] sm:text-sm text-slate-400 leading-relaxed max-w-md">
                {isLegend
                  ? `${arena ? `${arena} raises` : `${withTeamArticle(homeName, home.league, true)} raise`} your number to the rafters.`
                  : 'You hang up the skates.'}
              </p>
              {hof?.inducted && (
                <div className="mt-3 inline-flex items-center gap-2.5 rounded-lg border border-[#c084fc]/40 bg-[#c084fc]/10 px-3 py-2">
                  <span className="text-lg leading-none" aria-hidden>🏛️</span>
                  <span className="min-w-0">
                    <span className="block text-[12px] sm:text-sm font-black text-[#e9d5ff] leading-tight">Hockey Hall of Fame, class of {hof.classYear}</span>
                    <span className="block text-[10px] sm:text-[11px] font-bold text-[#c084fc] mt-0.5">{hof.ballot}</span>
                  </span>
                </div>
              )}
              {hof?.nearMiss && (
                <p className="mt-3 text-[12px] sm:text-sm text-slate-500 leading-relaxed max-w-md">
                  You were on the Hall of Fame ballot from {hof.eligible} and never got in.
                </p>
              )}
            </div>
          </div>

          {/* The score, and what it is made of, next to the facts that sit
              under any career. */}
          <div className="relative mt-5 grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] gap-3">
            <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0d110d] p-4">
              <p className="text-[11px] font-bold text-slate-500">Career score</p>
              <p className="mt-1 text-5xl font-black sports-font leading-none text-white number-font">{score.total.toLocaleString()}</p>
              <p className={`mt-1.5 text-sm font-black ${score.color}`}>{score.tier}</p>
              {!!score.breakdown?.length && (
                <ul className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.07)] space-y-1">
                  {score.breakdown.map((b, i) => (
                    <li key={i} className="flex items-baseline justify-between gap-3 text-[11px]">
                      <span className="min-w-0 truncate text-slate-400">{b.label}</span>
                      <span className={`shrink-0 font-black number-font ${b.points < 0 ? 'text-[#ef4444]' : 'text-slate-200'}`}>
                        {b.points > 0 ? '+' : ''}{b.points.toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-4 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0d110d] p-4 content-start">
              <Stat label="Peak rating" value={peakOvr} strong />
              <Stat label="Draft" value={<span className="text-base sm:text-lg">{draftLine}</span>} />
              <Stat label="Career earnings" value={formatMoney(earnings)} />
              <Stat label="Peak market value" value={formatMoney(player.stats?.peakValue || player.stats?.value || 0)} />
              <Stat label="Games, every league" value={all.games} />
              <Stat label={isGoalie ? 'Wins, every league' : 'Points, every league'} value={isGoalie ? all.wins : all.goals + all.assists} />
            </div>
          </div>
        </section>

        {/* THE TROPHY CASE. */}
        <Section title="Trophy case"
                 meta={champList.length || honourList.length ? null : 'Empty'}>
          {champList.length || honourList.length ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
              {champList.map(c => (
                <Honour key={c.league} name={c.name} count={c.years.length} years={c.years} league={c.league} champion />
              ))}
              {honourList.map(h => (
                <Honour key={h.name} name={h.name} count={h.years.length} years={h.years}
                        img={getAwardImage(h.raw) || getAwardImage(h.name)} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">You never won anything you could put on a shelf.</p>
          )}
        </Section>

        {/* THE NUMBERS, WHERE THEY COUNT. */}
        {headline && (
          <Section title="Career numbers" meta={`${headline.league}, ${headline.seasons.size} ${headline.seasons.size === 1 ? 'season' : 'seasons'}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0d110d] p-4">
                <p className="text-[11px] font-bold text-slate-500 mb-3">Regular season</p>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                  {statsFor(headline, false).map(([l, v], i) => <Stat key={l} label={l} value={v} strong={i === 3} />)}
                </div>
              </div>
              <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0d110d] p-4">
                <p className="text-[11px] font-bold text-slate-500 mb-3">Playoffs</p>
                {headline.poGames > 0 ? (
                  <div className="grid grid-cols-4 gap-3">
                    {statsFor(headline, true).map(([l, v], i) => <Stat key={l} label={l} value={v} strong={i === 3} />)}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">You never played a playoff game in the {headline.league}.</p>
                )}
              </div>
            </div>
          </Section>
        )}

        {/* SEASON BY SEASON. */}
        <Section title="Season by season" meta="Regular season, then playoffs">
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
                    <td />
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
                      <th className="px-2 py-2 text-right font-bold">{isDman ? 'BLK' : 'S%'}</th>
                      {isCentre && <th className="px-2 py-2 text-right font-bold">FO%</th>}
                    </>)}
                    <th className="px-2 py-2 text-right font-bold border-l border-[rgba(255,255,255,0.06)]">GP</th>
                    <th className="px-2 py-2 text-right font-bold">{isGoalie ? 'SV%' : 'G'}</th>
                    <th className="px-2 py-2 text-right font-bold">{isGoalie ? 'GAA' : 'A'}</th>
                    <th className="px-2 py-2 text-right font-bold">{isGoalie ? 'SO' : 'Pts'}</th>
                    <th className="w-full px-3 py-2 font-bold">Honours</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
                  {clubRows.map((r, i) => {
                    const po = r.playoffGames > 0;
                    const cell = 'px-2 py-2 text-right number-font text-slate-300';
                    return (
                      <tr key={`${r.year}-${r.team}-${i}`} className="hover:bg-[rgba(255,255,255,0.02)]">
                        <td className="pl-4 sm:pl-6 pr-2 py-2 font-bold text-slate-300 number-font"
                            style={{ boxShadow: `inset 3px 0 0 0 ${leagueRule(r.league)}` }}>
                          <span className="flex items-center gap-1.5">
                            {seasonLabel(r.year)}
                            <Letter captain={r.isCaptain} alternate={r.isAlternate && !r.isCaptain} />
                          </span>
                        </td>
                        <td className="px-2 py-2">
                          <span className="flex items-center gap-2 min-w-0">
                            <span className="shrink-0 w-6 h-6 flex items-center justify-center">
                              <TeamLogo teamId={r.team} league={r.league} isAHL={r.league === 'AHL'} size="tiny" />
                            </span>
                            <span className="hidden sm:inline font-bold text-white truncate max-w-[180px]" title={getFullTeamName(r.team, r.league)}>
                              {getFullTeamName(r.team, r.league)}
                            </span>
                          </span>
                        </td>
                        <td className="px-2 py-2 text-[11px] font-bold text-slate-400">{r.league}</td>
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
                          <td className={cell}>{isDman ? r.blocks : (pct1(r.goals, r.sog) ?? <Dash />)}</td>
                          {isCentre && <td className={cell}>{pct1(r.fow, r.fot) ?? <Dash />}</td>}
                        </>)}
                        <td className={`${cell} border-l border-[rgba(255,255,255,0.06)]`}>{po ? r.playoffGames : <Dash />}</td>
                        <td className={cell}>{po ? (isGoalie ? sv3(r.playoffSaves, r.playoffShots) : r.playoffGoals) : <Dash />}</td>
                        <td className={cell}>{po ? (isGoalie ? gaa2(r.playoffSaves, r.playoffShots, r.playoffGames) : r.playoffAssists) : <Dash />}</td>
                        <td className={`${cell} ${po ? 'text-white font-black' : ''}`}>
                          {po ? (isGoalie ? r.playoffShutouts : r.playoffGoals + r.playoffAssists) : <Dash />}
                        </td>
                        <td className="px-3 py-2 whitespace-normal min-w-[240px]"><YearHonours season={r} /></td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="border-t-2 border-[rgba(255,255,255,0.1)]">
                  {leagueTotals.filter(t => t.games > 0).map(t => {
                    const po = t.poGames > 0;
                    const cell = 'px-2 py-2 text-right number-font font-black text-slate-200';
                    return (
                      <tr key={t.league} className="bg-[#0d110d]">
                        <td colSpan={3} className="pl-4 sm:pl-6 pr-2 py-2 text-[11px] font-bold text-slate-400"
                            style={{ boxShadow: `inset 3px 0 0 0 ${leagueRule(t.league)}` }}>
                          {t.league} totals
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
                          <td className={cell}>{isDman ? t.blocks : (pct1(t.goals, t.sog) ?? <Dash />)}</td>
                          {isCentre && <td className={cell}>{pct1(t.fow, t.fot) ?? <Dash />}</td>}
                        </>)}
                        <td className={`${cell} border-l border-[rgba(255,255,255,0.06)]`}>{po ? t.poGames : <Dash />}</td>
                        <td className={cell}>{po ? (isGoalie ? sv3(t.poSaves, t.poShots) : t.poGoals) : <Dash />}</td>
                        <td className={cell}>{po ? (isGoalie ? gaa2(t.poSaves, t.poShots, t.poGames) : t.poAssists) : <Dash />}</td>
                        <td className={`${cell} ${po ? 'text-white' : ''}`}>{po ? (isGoalie ? t.poShutouts : t.poGoals + t.poAssists) : <Dash />}</td>
                        <td />
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
                For {country || 'your country'}
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
        {(mostWith || heldRecords.length > 0) && (
          <div className={`grid grid-cols-1 ${mostWith && heldRecords.length ? 'sm:grid-cols-2' : ''} gap-3 sm:gap-4`}>
            {mostWith && (() => {
              const lg = mostWith.league || player.league;
              const club = getFullTeamName(mostWith.teamId, lg) || mostWith.teamId;
              const where = NO_ARTICLE_LEAGUES.includes(lg) ? `at ${club}` : `on ${withTeamArticle(club, lg)}`;
              return (
                <Section title="The teammate">
                  <p className="text-sm text-slate-300 leading-relaxed">
                    <span className="font-black text-white">{mostWith.name}</span> played{' '}
                    <span className="font-black text-white number-font">{mostWith.gp}</span> games beside you {where}
                    {mostWith.years > 1 ? `, over ${mostWith.years} seasons.` : '.'}
                  </p>
                </Section>
              );
            })()}
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
            <Section title="Your draft class" meta={`The ${groupName(compGroup(player.pos))} of your year, by NHL ${unit}`}>
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
