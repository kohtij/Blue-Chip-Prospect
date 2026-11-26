import { useState } from 'react';
import { classWord } from '../utils/peers';
import { useAppContext } from '../AppContext';
import { championsOf, getFullTeamName, getPlayoffTitles } from '../utils/appHelpers';
import { amateurLeagues, getOpponentPool, getPlayoffRounds, getPrimaryRival, LEAGUE_CONFIG, ncaaTeams } from '../data/teams';
import { splitPerk } from '../data/offerPerks';
import { capFanStatus, formatMoney, ordinal } from '../utils/gameHelpers';
import { formatLeagueName, leagueWithArticle, withTeamArticle } from '../utils/gameHelpers';
import { rateSeason } from '../utils/production';
import { recordLine } from '../utils/records';
import LeagueTag from '../components/LeagueTag';
import { awardsFor } from '../data/leagueAwards';
import { TITLE_MD } from '../utils/ui';
import TrophyImage from '../components/TrophyImage';

// Leagues that don't count toward a player's pro season number.
const AMATEUR_LEAGUES = amateurLeagues;

// Minutes as a clock, which is how ice time is read everywhere in hockey.
const clock = (mins) => {
  const v = mins || 0;
  return `${Math.floor(v)}:${Math.round((v % 1) * 60).toString().padStart(2, '0')}`;
};

// One line of the season recap.
//
// Every row used to style itself, so the list drifted: some had a heading and
// some did not, the left borders were different widths, and the reward pills
// were appended inline to the end of the sentence with a negative top offset.
// That last one is why they so often sat halfway up a wrapped paragraph
// instead of lining up. Text is text and pills are their own row underneath.
function RecapRow({ accent, label, tint = false, children }) {
  return (
    <li
      className={`border-l-4 pl-4 pr-3 py-2.5 rounded-r-lg ${tint ? 'bg-white/[0.03]' : ''}`}
      style={{ borderLeftColor: accent }}
    >
      {label && (
        <strong
          className="block text-[10px] font-black tracking-widest uppercase mb-1.5 leading-none"
          style={{ color: accent }}
        >
          {label}
        </strong>
      )}
      {children}
    </li>
  );
}

// Everything a single event paid out, on one wrapping row of its own.
function PillRow({ effect, perks, flaws, isGoalie }) {
  const base = 'text-[10px] sm:text-xs px-2 py-1 rounded font-black tracking-widest uppercase border leading-none whitespace-nowrap';
  const tone = {
    stat:  'text-[#22E748] bg-[#22E748]/10 border-[#22E748]/30',
    fans:  'text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/30',
    money: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30',
    bad:   'text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]/30'
  };
  const rows = [
    ['ovr',         'OVR',                'stat'],
    ['fanStatus',   'FANS',               'fans'],
    ['money',       null,                 'money'],
    ['shooting',    isGoalie ? 'REF' : 'SHT', 'stat'],
    ['skating',     isGoalie ? 'POS' : 'SKT', 'stat'],
    ['physicality', isGoalie ? 'AGI' : 'PHY', 'stat'],
    ['hockeyIQ',    'IQ',                 'stat'],
    ['stamina',     'STM',                'stat']
  ];

  const statPills = rows.map(([key, label, kind]) => {
    const raw = effect?.[key];
    const v = Number(raw);
    if (raw === undefined || raw === null || !Number.isFinite(v) || v === 0) return null;
    return (
      <span key={key} className={`${base} ${v > 0 ? tone[kind] : tone.bad}`}>
        {key === 'money'
          ? `${v > 0 ? '+' : '-'}${formatMoney(Math.abs(v))}`
          : `${v > 0 ? '+' : ''}${v} ${label}`}
      </span>
    );
  }).filter(Boolean);

  // Perks arrive in two shapes across the codebase: the older { text } and the
  // current { name, effect }. The recap only ever read `text`, so every modern
  // perk rendered as an empty pill.
  const chip = (pk, idx, isFlaw) => {
    const { name, effect: eff } = splitPerk(pk);
    if (!name) return null;
    const colour = isFlaw ? tone.bad : (pk?.color || tone.stat);
    return (
      <span key={`${isFlaw ? 'f' : 'p'}-${idx}`} className={`${base} ${colour}`}>
        {name}{eff ? ` ${eff}` : ''}
      </span>
    );
  };

  // Standing with the coach, the room and the press. Most of the summer's
  // introductions (the new coach, a star walking in) move only these, and the
  // recap never showed them, so those choices looked like they did nothing.
  const relPills = [['coach', 'COACH'], ['teammates', 'ROOM'], ['media', 'MEDIA']].map(([key, label]) => {
    const v = Number(effect?.rel?.[key]);
    if (!Number.isFinite(v) || v === 0) return null;
    return (
      <span key={`rel-${key}`} className={`${base} ${v > 0 ? 'text-[#c084fc] bg-[#c084fc]/10 border-[#c084fc]/30' : tone.bad}`}>
        {`${v > 0 ? '+' : ''}${v} ${label}`}
      </span>
    );
  }).filter(Boolean);
  statPills.push(...relPills);

  const perkPills = [
    ...(perks || []).map((pk, i) => chip(pk, i, false)),
    ...(flaws || []).map((fl, i) => chip(fl, i, true))
  ].filter(Boolean);

  if (statPills.length === 0 && perkPills.length === 0) return null;
  return <div className="flex flex-wrap items-center gap-1.5 mt-2.5">{statPills}{perkPills}</div>;
}

// WHY HE WON IT.
//
// The recap listed trophy names and nothing else, which is fine for a scoring
// title and no help at all for the Lady Byng: it's decided on penalty
// minutes, and nowhere in the game showed his. Each award is matched back to
// the rule that hands it out (see _computeAwards in gameHelpers) and given the
// numbers that won it.
function awardReason(award, r, player, leagues) {
  const kinds = leagues.map(lg => awardsFor(lg)).filter(Boolean);
  const key = kinds.map(t => Object.keys(t).find(k => t[k] === award)).find(Boolean);
  const gp = r.games || 0;
  const pts = (r.g || 0) + (r.a || 0);
  const sv = r.shots ? (r.saves / r.shots).toFixed(3).replace('0.', '.') : null;
  const pm = `${(r.pm || 0) > 0 ? '+' : ''}${r.pm || 0}`;
  const fo = r.fot > 0 ? `${((r.fow / r.fot) * 100).toFixed(1)}% on draws` : null;
  switch (key) {
    case 'scoring': return `${pts} points, the most in the league.`;
    case 'goals': return `${r.g || 0} goals, the most in the league.`;
    case 'mvp': return player.pos === 'G'
      ? `A ${sv} save percentage over ${gp} games, well clear of every other goalie.`
      : `${pts} points in ${gp} games, ahead of the scoring champion's pace.`;
    case 'dman': return `${pts} points, ${r.blk || 0} blocked shots and ${pm} at ${clock(r.avgToi)} a night: the best all-round year by a defenceman.`;
    case 'goalie': return `A ${sv} save percentage over ${gp} games, the best among the league's starters.`;
    case 'rookie': return player.pos === 'G' ? `A ${sv} save percentage in your first season.` : `${pts} points in ${gp} games in your first season.`;
    case 'players': return `Voted by the players. ${pts} points, and the room thinks the world of you.`;
    case 'defensiveFwd': return [`${pm}`, `${r.blk || 0} blocked shots`, fo, r.ozPct != null ? `${100 - r.ozPct}% of your shifts started in your own end` : null].filter(Boolean).join(', ') + ', and you still put up ' + pts + ' points.';
    case 'sportsman': return `${pts} points with only ${r.pim || 0} penalty minutes in ${gp} games.`;
    case 'teamGoalie': return `Your club allowed the fewest goals in the league, and you stopped ${sv} of what came at you.`;
    case 'perseverance': return 'A full season and a good one, a year after an injury ended the last one early.';
    case 'community': return 'For the charity nights and hospital visits, and the city noticed.';
    case 'leadership': return `Captain of a side that finished #${r.standings || '-'}, with the room behind you.`;
    case 'regular': return `Your club finished first in the league.`;
    default: return null;
  }
}

export default function RecapScreen() {
  const { advanceToOffseason, isJunior, player, playoffs, seasonEvents, seasonRecap, setActiveEvent, setPlayer, setScreen, unlockAchievement } = useAppContext();
  // "draft class" once he's been drafted with his year, "draft year" before.
  const cw = classWord(player);
  const [showAllMoments, setShowAllMoments] = useState(false);
  
  return (() => {
          // The league the title was won in is the one the playoffs were played
          // in. The player's own league can have moved since: a call-up at
          // the end of the year turned a Calder Cup into a Stanley Cup here.
          const titleLg = (seasonRecap?.titleWon === 1 && playoffs?.currentLg) || player.league;
          const titles = getPlayoffTitles(titleLg);


          let narrative;
          let narrativeTitle;

          const madePlayoffsForNarrative = seasonRecap?.madePlayoffs || false;
          const pw = seasonRecap?.playoffWins || 0;
          const hasHardware = seasonRecap?.awards && seasonRecap.awards.length > 0;
          // Was `Math.log2(playoffSpots) * 4`, which only matches a league whose
          // bracket happens to be four best-of-7 rounds. It disagreed with the
          // real bracket in seven leagues: it fell fractional in the Swiss NL,
          // Czech and Slovak Extraliga, so `pw === maxWins - 1` could never be
          // true and GAME 7 HEARTBREAK was unreachable there, and it read 16 for
          // the NCAA where the title actually takes 8 wins. The bracket the
          // playoffs are simulated from is the only authority on this.
          // The league the playoffs were played in, which a move since can
          // have taken him out of.
          const poLg = (seasonRecap?.madePlayoffs && playoffs?.currentLg) || player.league;
          const maxWins = (getPlayoffRounds(poLg) || [])
            .reduce((sum, r) => sum + Math.ceil((r.gamesPerMatchup || 7) / 2), 0) || 16;
          const standings = seasonRecap?.standings || 16;
          // "A great regular season" and "squeaked in" were the top four and
          // thirteenth or lower, which is the NHL's sixteen. In an eight-team
          // playoff nobody could squeak in at all. A quarter of the field each.
          const spots = LEAGUE_CONFIG[poLg]?.playoffSpots || 16;
          const band = Math.max(2, Math.round(spots / 4));
          const topSeed = standings <= band;
          const lastIn = standings > spots - band;

          // Was `seasonsPlayed - 2`, which assumed every player spends exactly two
          // years as an amateur. Four NCAA years opened the pro career at "PRO
          // SEASON 2", and a two-year junior path opened it at "PRO SEASON 0".
          // Counting the history instead works for any route to the pros.
          const proSeasonNumber = Math.max(
            1,
            (player.seasonHistory || []).filter(s => s.league && !AMATEUR_LEAGUES.includes(s.league)).length
          );

          const rivalObj = getPrimaryRival ? getPrimaryRival(player.team, player.league) : null;
          const rivalName = rivalObj ? (rivalObj.name || rivalObj.id) : null;
          const rivalWonTitle = rivalObj && seasonRecap?.leagueChampion?.id === rivalObj.id;

          // How many championships this makes in a row, counting back through
          // the seasons immediately before this one. A repeat is the rarest
          // thing in the sport and it used to read exactly like a first one.
          //
          // A repeat means the same club winning the same trophy again. A
          // Calder Cup one year and a Stanley Cup the next used to count as
          // back-to-back, because this only asked whether a title was won.
          const streak = (() => {
            const hist = player.seasonHistory || [];
            // The season being recapped may already be written; skip it once.
            const thisYear = 2026 + ((player.stats?.seasonsPlayed || 1) - 1);
            const written = hist.length > 0 && hist[hist.length - 1].year === thisYear;
            const now = written ? hist[hist.length - 1] : { league: player.league, team: player.team };
            let n = 1;
            for (let i = hist.length - (written ? 2 : 1); i >= 0; i--) {
              const s = hist[i];
              if (s.titleWon && s.league === now.league && s.team === now.team) n += 1; else break;
            }
            return n;
          })();

          if (seasonRecap?.titleWon === 1 && streak >= 2) {
             const cupName = titleLg === 'NHL' ? 'the Stanley Cup' : `the ${titles?.cupName || 'championship'}`;
             if (streak === 2) {
                 narrativeTitle = 'BACK-TO-BACK CHAMPIONS';
                 narrative = `Twice. Winning ${cupName} once can be a good year and a hot goaltender; winning it again is the part nobody manages. This team doesn't have to argue about it any more.`;
             } else if (streak === 3) {
                 narrativeTitle = 'THREE IN A ROW';
                 narrative = `Three straight. There are franchises a century old that have never done this once, and you have done it three years running. People have started using the word dynasty without smirking.`;
             } else {
                 narrativeTitle = `${streak} STRAIGHT`;
                 narrative = `${streak} in a row. Whatever the rest of the league is building, it's being built to beat you, and it isn't working. Nobody argues about the word dynasty any more.`;
             }
          } else if (seasonRecap?.titleWon === 1) {
             if (titleLg === 'NHL') {
                 narrativeTitle = 'STANLEY CUP CHAMPIONS';
                 narrative = player.isCaptain
                   ? 'Your name goes on the Stanley Cup. You wore the C, so you were the first one to lift it.'
                   : 'Your name goes on the Stanley Cup. It came down the line from the captain, and then it was in your hands.';
             } else if (isJunior) {
                 if (seasonRecap?.memCupStatus === 'won') {
                     narrativeTitle = 'MEMORIAL CUP CHAMPIONS';
                     narrative = `You won ${leagueWithArticle(player.league)} and then the Memorial Cup. Nobody in junior hockey was better this year.`;
            } else if (seasonRecap?.memCupStatus === 'lost') {
                         narrativeTitle = 'REGIONAL CHAMPIONS';
                         narrative = `You won the ${titles?.cupName || 'Championship'} and came up just short at the Memorial Cup. A great season that ended one game too early.`;
                     } else {
                         narrativeTitle = `${formatLeagueName(player.league)} CHAMPIONS`;
                         narrative = `You won the ${titles?.cupName || 'championship'}, and the whole town turned out to see it.`;
                     }
                 } else {
                     narrativeTitle = titles?.cupName ? championsOf(titles.cupName).toUpperCase() : 'CHAMPIONS';
                     narrative = `You won the ${titles?.cupName || 'championship'}, and you skated it around the ice in front of a full building.`;
                 }
          } else if (madePlayoffsForNarrative) {
              if (pw === maxWins - 1) {
                  narrativeTitle = 'GAME 7 HEARTBREAK';
                  narrative = 'One win from the title. Nobody said a word on the bus home.';
              } else if (pw >= maxWins / 2) {
                  narrativeTitle = 'DEEP PLAYOFF RUN';
                  narrative = 'You ran out of gas at the end.';
              } else if (pw === 0) {
                  narrativeTitle = 'SWEPT';
                  narrative = topSeed 
                    ? 'Swept, after the regular season you had. The papers haven\'t been kind.' 
                    : 'Swept out of the first round. You were outmatched from puck drop.';
              } else {
                  narrativeTitle = 'PLAYOFF EXIT';
                  if (topSeed) {
                      narrative = 'A great regular season, and then an early exit nobody saw coming.';
                  } else if (lastIn) {
                      narrative = 'You squeaked into the playoffs, and the run ended early.';
                  } else {
                      narrative = 'A solid regular season, and an early exit.';
                  }
              }
              
              if (rivalWonTitle) {
                  narrative += ` And your arch-rivals, ${withTeamArticle(rivalName, player.league)}, lifted the trophy.`;
              } else if (hasHardware && pw > 0 && pw < maxWins - 1) {
                  narrative += " You were brilliant, and it wasn't enough.";
              }
          } else {
              narrativeTitle = 'MISSED THE DANCE';
              narrative = 'A disappointing year, and there\'s work to do in the summer.';
              if (rivalWonTitle) {
                  narrative = `You missed the playoffs, and your arch-rivals, ${withTeamArticle(rivalName, player.league)}, won it all.`;
              } else if (hasHardware) {
                  narrative = 'You had a great year, and the team around you didn\'t.';
              }
          }

          return (
            <div className="game-panel p-6 sm:p-10 mt-2">
              <style>{`
                @keyframes subtleFadeUp {
                  0% { opacity: 0; transform: translateY(12px); }
                  100% { opacity: 1; transform: translateY(0); }
                }
                .moments-in { animation: subtleFadeUp 0.35s ease-out both; }
                /* trophy-rise and champ-sheen live in index.css, shared with the playoff grid. */
                @media (prefers-reduced-motion: reduce) { .moments-in { animation: none; } }
                .recap-list > li {
                  opacity: 0;
                  animation: subtleFadeUp 0.5s ease-out forwards;
                }
                ${Array.from({length: 25}).map((_, i) => `.recap-list > li:nth-child(${i + 1}) { animation-delay: ${(i * 0.15) + 0.1}s; }`).join('\n')}
              `}</style>

              <div className="flex items-center border-b border-[rgba(255,255,255,0.065)] pb-4 mb-6">
                <p className="text-slate-500 font-black uppercase tracking-[0.18em] text-[10px] sm:text-xs">
                  {/* The SHL and Liiga used to land here as "AMATEUR CAMPAIGN". They are
                      professional leagues, so they now count as pro seasons, and the label
                      shares one list with the season counter instead of keeping its own. */}
                  {AMATEUR_LEAGUES.includes(player.league) ? 'AMATEUR CAMPAIGN' : `PRO SEASON ${proSeasonNumber}`}
                </p>
              </div>

              {/* A CHAMPIONSHIP.
                  It used to get the same grey headline and one-line quote as a
                  first-round exit. Winning it is the best thing that can happen
                  in a season, so it gets the trophy, in gold, rising into the
                  panel, and the playoff line that won it. */}
              {seasonRecap?.titleWon === 1 ? (() => {
                const yr = player.seasonHistory?.[player.seasonHistory.length - 1] || {};
                const isG = player.pos === 'G';
                const smythe = (yr.awards || []).some(a => /conn smythe|playoff mvp|most valuable player in the playoffs/i.test(String(a)));
                const poTiles = isG
                  ? [['Playoff games', yr.playoffGames || 0],
                     ['Save %', yr.playoffShots ? (yr.playoffSaves / yr.playoffShots).toFixed(3).replace('0.', '.') : '.000'],
                     ['Shutouts', yr.playoffShutouts || 0]]
                  : [['Playoff games', yr.playoffGames || 0], ['Goals', yr.playoffGoals || 0],
                     ['Assists', yr.playoffAssists || 0], ['Points', (yr.playoffGoals || 0) + (yr.playoffAssists || 0)]];
                return (
                  <div className="relative overflow-hidden rounded-2xl border border-[#F59E0B]/50 mb-8"
                       style={{ background: 'radial-gradient(120% 110% at 15% 0%, rgba(245,158,11,0.34), rgba(245,158,11,0.07) 55%, transparent 85%), linear-gradient(180deg, #1c1405, #0b0906)' }}>
                    <span aria-hidden="true" className="champ-sheen absolute inset-y-0 left-0 w-1/3 pointer-events-none"
                          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,236,179,0.22), transparent)' }} />
                    <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-7 p-5 sm:p-7">
                      <div className="trophy-rise shrink-0 w-14 h-16 sm:w-24 sm:h-32 flex items-end justify-center">
                        <TrophyImage league={player.league} className="max-w-full max-h-full object-contain drop-shadow-[0_0_26px_rgba(245,158,11,0.6)]" />
                      </div>
                      <div className="min-w-0">
                        {yr.year && (
                          <p className="text-[11px] sm:text-xs font-black text-[#fcd34d]/80">
                            {yr.year}-{String((yr.year + 1) % 100).padStart(2, '0')} {formatLeagueName(player.league)}
                          </p>
                        )}
                        <h2 className="mt-1 text-[1.75rem] sm:text-5xl font-black sports-font uppercase leading-[0.95] tracking-tight text-[#F59E0B]"
                            style={{ textShadow: '0 0 30px rgba(245,158,11,0.35)' }}>
                          {narrativeTitle}
                        </h2>
                        <p className="mt-3 text-sm sm:text-lg font-bold text-[#fef3c7] leading-snug max-w-xl">{narrative}</p>
                        {smythe && (
                          <p className="mt-2 text-[12px] sm:text-sm font-black text-[#fcd34d]">You were named playoff MVP as well.</p>
                        )}
                      </div>
                    </div>
                    {(yr.playoffGames || 0) > 0 && (
                      <div className={`relative grid ${isG ? 'grid-cols-3' : 'grid-cols-4'} border-t border-[#F59E0B]/25 bg-black/25`}>
                        {poTiles.map(([label, value], i) => (
                          <div key={label} className={`px-3 sm:px-6 py-3 sm:py-4 ${i ? 'border-l border-[#F59E0B]/15' : ''}`}>
                            <p className="text-xl sm:text-3xl font-black sports-font leading-none text-white number-font">{value}</p>
                            <p className="mt-1 text-[10px] sm:text-[11px] font-bold text-[#fcd34d]/70">{label}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })() : (
              <div className="w-full mb-8">
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-2">
                  <h2 className={`${TITLE_MD} text-left m-0`}>
                    {narrativeTitle}
                  </h2>
                </div>
                <p className="text-base sm:text-lg text-slate-400 font-sans italic text-left m-0">"{narrative}"</p>
              </div>
              )}

              {/* THE YEAR IN NUMBERS.
                  This was three paragraphs: the stat line written out as a
                  sentence, the minutes, then a line about where the coach
                  started his shifts. Read once, it was a lot of words for a
                  handful of numbers. The numbers are tiles now, the way the
                  rest of the game shows a stat line, and one sentence under
                  them says what kind of year it was. */}
              {(() => {
                const r = seasonRecap || {};
                const gp = r.games || 0;
                const isG = player.pos === 'G';
                const isD = ['LD', 'RD'].includes(player.pos);
                const pts = (r.g || 0) + (r.a || 0);
                const sv = r.shots ? r.saves / r.shots : 0;
                const sog = r.sog || 0;
                const shPct = sog > 0 ? ((r.g || 0) / sog) * 100 : null;
                const fot = r.fot || 0;
                const foPct = fot > 0 ? ((r.fow || 0) / fot) * 100 : null;

                const main = isG
                  ? [['GP', gp], ['Record', `${r.wins || 0}-${r.losses || 0}-${r.otl || 0}`], ['SV%', sv.toFixed(3).replace('0.', '.')], ['SO', r.sho || 0]]
                  : isD
                    ? [['GP', gp], ['Points', pts], ['Blocks', r.blk || 0], ['TOI', clock(r.avgToi)], ['+/-', `${(r.pm || 0) > 0 ? '+' : ''}${r.pm || 0}`]]
                    : [['GP', gp], ['Goals', r.g || 0], ['Assists', r.a || 0], ['Points', pts], ['TOI', clock(r.avgToi)]];

                const extra = [
                  !isG && shPct != null && !isD && ['Shooting', `${shPct.toFixed(1)}%`],
                  !isG && foPct != null && ['Faceoffs', `${foPct.toFixed(1)}%`],
                  !isG && (r.ppToi || 0) >= 0.2 && ['PP TOI', clock(r.ppToi)],
                  !isG && ['PIM', r.pim || 0],
                  !isG && r.ozPct != null && ['OZ starts', `${r.ozPct}%`],
                  isD && ['G-A', `${r.g || 0}-${r.a || 0}`]
                ].filter(Boolean);


                return (
                  <div className="mb-6">
                    <div className={`grid ${main.length === 4 ? 'grid-cols-4' : 'grid-cols-5'} gap-1.5 sm:gap-2`}>
                      {main.map(([label, value]) => (
                        <div key={label} className="rounded-lg bg-[#0a0d0a] border border-[rgba(255,255,255,0.065)] px-1.5 py-2.5 sm:py-3 text-center">
                          {/* A long value (a goalie's 38-20-6) is set smaller rather
                              than broken across two lines. */}
                          <p className={`number-font font-black text-white leading-none tabular-nums whitespace-nowrap ${
                            String(value).length > 5 ? 'text-[15px] sm:text-2xl' : 'text-xl sm:text-3xl'}`}>{value}</p>
                          <p className="mt-1.5 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">{label}</p>
                        </div>
                      ))}
                    </div>
                    {extra.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] sm:text-xs font-bold uppercase tracking-wider">
                        {extra.map(([label, value]) => (
                          <span key={label} className="text-slate-500">{label} <span className="text-slate-200 number-font">{value}</span></span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              <ul className="recap-list space-y-3 sm:space-y-4 text-slate-300 text-sm sm:text-base font-sans text-left leading-relaxed">
                <li className="border-l-4 border-[#3b82f6] pl-4 pr-3 py-2.5 rounded-r-lg">
                  {(() => {
                     const currentHistory = player.seasonHistory?.[player.seasonHistory.length - 1];

                     // A season split across two leagues, as the nine-game rule
                     // produces: nine games up top, the rest back in junior. A trade
                     // moves clubs inside one league and is handled below.
                     const stints = currentHistory?.stints || [];
                     // Every stop in order, joined into one sentence. This used to
                     // say "then spent the rest of the year" and list every later
                     // stint after it with no separator, so a three-game
                     // conditioning loan in the middle of an NHL season read as
                     // "(3 GP)in the NHL with Tampa Bay Lightning (28 GP)". Back-to-back
                     // stints at the same club are one stop, and a return to a
                     // club already named says "back with".
                     if (stints.length > 1 && stints.some(s => s.league !== stints[0].league)) {
                        const stops = [];
                        stints.forEach(s => {
                          const last = stops[stops.length - 1];
                          if (last && last.team === s.team && last.league === s.league) last.games += s.games || 0;
                          else stops.push({ team: s.team, league: s.league, games: s.games || 0, conditioning: !!s.conditioning });
                        });
                        const club = (s) => <strong className="text-white">{withTeamArticle(getFullTeamName(s.team, s.league), s.league)}</strong>;
                        const seen = new Set();
                        const parts = stops.map((s, i) => {
                          const gp = <strong className="text-white">{s.games}</strong>;
                          const again = seen.has(`${s.league}:${s.team}`);
                          seen.add(`${s.league}:${s.team}`);
                          const games = s.games === 1 ? 'game' : 'games';
                          const body = i === 0
                            ? <>Played {gp} {games} in {leagueWithArticle(s.league)} with {club(s)}</>
                            : again
                              ? <>{gp} more back with {club(s)}</>
                              : <>{gp} {s.conditioning ? `on a conditioning stint with` : `in ${leagueWithArticle(s.league)} with`} {club(s)}{s.conditioning ? ` in ${leagueWithArticle(s.league)}` : ''}</>;
                          const joint = i === 0 ? '' : i === stops.length - 1 ? ', and then ' : ', then ';
                          return <span key={`${s.team}-${i}`}>{joint}{body}</span>;
                        });
                        return <>🏅 {parts}.</>;
                     }

                     if (currentHistory?.tradedTo) {
                        return (
                          <>🏅 Started the year with <strong className="text-white">{getFullTeamName(currentHistory.team, player.league)}</strong> ({currentHistory.gamesWithOriginal} GP) before {player.league === 'NCAA' ? 'transferring to' : 'a trade to'} <strong className="text-white">{getFullTeamName(currentHistory.tradedTo, player.league)}</strong> ({currentHistory.gamesWithNew} GP).</>
                        );
                     }
                     return (
                       <>🏅 {withTeamArticle(getFullTeamName(player.team, player.league), player.league, true)} finished <strong className="text-white">#{seasonRecap?.standings || '-'}</strong> in {leagueWithArticle(player.league)}. {
                         (seasonRecap?.standings === 1) ? 'A dominant regular season.' :
                         (seasonRecap?.madePlayoffs) ? 'A solid campaign to secure a playoff berth.' :
                         (seasonRecap?.standings >= (getOpponentPool(player.league)?.length || 20) - 3) ? 'A miserable rebuilding year for the franchise.' :
                         'A mediocre year that fell short of expectations.'
                       }</>
                     );
                  })()}
                </li>
                
                {/* Performance bonuses the year reached, if the deal had any. */}
                {seasonRecap?.bonusLines?.length > 0 && (() => {
                  const names = seasonRecap.bonusLines.map(b => b.label);
                  const list = names.length === 1 ? names[0]
                    : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
                  return (
                    <li className="border-l-4 border-[#F59E0B] pl-4 pr-3 py-2.5 rounded-r-lg">💰 Your bonuses paid out: {list}, worth <strong className="text-[#F59E0B]">{formatMoney(seasonRecap.bonusTotal)}</strong> on top of your salary.</li>
                  );
                })()}

                {madePlayoffsForNarrative ? (
                  <>
                    <li className={`border-l-4 pl-4 pr-3 py-2.5 rounded-r-lg ${seasonRecap?.titleWon === 1 ? 'border-[#F59E0B] text-[#F59E0B] font-bold bg-[#F59E0B]/[0.06]' : 'border-[#ef4444]'}`}>
                      {seasonRecap?.titleWon === 1 
                        ? `🏆 Won the ${titles?.cupName || 'Championship'}!` 
                        : seasonRecap?.confTitleWon
                          ? `🏆 Crowned ${seasonRecap?.confName || 'Conference'} Champions before falling in the ${titles?.final || 'Finals'}.`
                          /* Losing to the arch-rival is the one playoff exit a player
                             carries into the summer, and the recap used to file it
                             under the same sentence as losing to anybody else. */
                          : seasonRecap?.lostToRival
                            ? `💀 Knocked out by your arch-rivals, the ${seasonRecap?.eliminatedByName}, in the ${seasonRecap?.eliminatedRound}. That one will sit with you all summer.`
                            : seasonRecap?.playoffWins === 0
                              ? (seasonRecap?.eliminatedByName
                                  ? `🧹 Swept out of the first round by the ${seasonRecap.eliminatedByName}.`
                                  : '🧹 Swept in the first round.')
                              : seasonRecap?.eliminatedByName
                                ? `Eliminated by the ${seasonRecap.eliminatedByName} in the ${seasonRecap.eliminatedRound} after ${seasonRecap?.playoffWins || 0} playoff win${seasonRecap?.playoffWins === 1 ? '' : 's'}.`
                                : `Eliminated after ${seasonRecap?.playoffWins || 0} playoff win${seasonRecap?.playoffWins === 1 ? '' : 's'}.`}
                    </li>
                    {/* The game the two beaten semifinalists play for bronze. */}
                    {seasonRecap?.bronzeGame && (
                       <li className={`border-l-4 pl-4 pr-3 py-2.5 rounded-r-lg ${seasonRecap.bronzeGame.won ? 'border-[#D08A4F] bg-[#D08A4F]/[0.06] text-[#D08A4F] font-bold' : 'border-slate-600'}`}>
                         {seasonRecap.bronzeGame.won
                           ? `🥉 Won the bronze medal game${seasonRecap.bronzeGame.oppName ? ` against ${seasonRecap.bronzeGame.oppName}` : ''}.`
                           : `Lost the bronze medal game${seasonRecap.bronzeGame.oppName ? ` to ${seasonRecap.bronzeGame.oppName}` : ''}, and finished fourth.`}
                       </li>
                    )}
                    {seasonRecap?.beatRivalRound && !seasonRecap?.lostToRival && (
                       <li className="border-l-4 border-[#F59E0B] pl-4 pr-3 py-2.5 rounded-r-lg bg-[#F59E0B]/[0.06] text-[#F59E0B] font-bold">
                         ⚔️ Put your arch-rivals, the {seasonRecap.beatRivalName}, out in the {seasonRecap.beatRivalRound}.
                       </li>
                    )}
                    {seasonRecap?.memCupStatus === 'won' && (
                       <li className="border-l-4 border-[#F59E0B] pl-4 pr-3 py-2.5 rounded-r-lg bg-[#F59E0B]/[0.06] text-[#F59E0B] font-bold">
                         🏆 WON THE MEMORIAL CUP!
                       </li>
                    )}
                  </>
                ) : (
                  <li className="border-l-4 border-slate-600 pl-4 pr-3 py-2.5 rounded-r-lg">⛳ Missed the playoffs.</li>
                )}

                {player.league === 'NHL' && seasonRecap?.g >= 92 && (
                  <li className="border-l-4 border-[#F59E0B] pl-4 pr-3 py-2.5 rounded-r-lg bg-[#F59E0B]/[0.06] text-[#F59E0B] font-bold">
                    👑 BROKE GRETZKY'S SINGLE-SEASON GOAL RECORD (92)!
                  </li>
                )}
                {player.league === 'NHL' && (seasonRecap?.g + seasonRecap?.a) >= 215 && (
                  <li className="border-l-4 border-[#F59E0B] pl-4 pr-3 py-2.5 rounded-r-lg bg-[#F59E0B]/[0.06] text-[#F59E0B] font-bold">
                    👑 BROKE GRETZKY'S SINGLE-SEASON POINTS RECORD (215)!
                  </li>
                )}
                {player.league === 'NHL' && player.pos === 'G' && seasonRecap?.sho >= 15 && (
                  <li className="border-l-4 border-[#F59E0B] pl-4 pr-3 py-2.5 rounded-r-lg bg-[#F59E0B]/[0.06] text-[#F59E0B] font-bold">
                    👑 BROKE TONY ESPOSITO'S SINGLE-SEASON SHUTOUT RECORD (15)!
                  </li>
                )}

                {seasonRecap?.wasWaived && (
                  <li className="border-l-4 border-[#F59E0B] pl-4 pr-3 py-2.5 rounded-r-lg">✈️ Claimed off waivers mid-season.</li>
                )}
                
                {seasonRecap?.awards && seasonRecap.awards.length > 0 && (
                  <RecapRow accent="#F59E0B" label="🏆 Hardware secured" tint>
                    {/* One line per trophy, with what won it under the name. */}
                    <ul className="space-y-2">
                      {Array.from(new Set(seasonRecap.awards)).filter(aw => !/1st team all-star/i.test(String(aw))).map(aw => {
                        const thisYear = player.seasonHistory?.[player.seasonHistory.length - 1];
                        const why = awardReason(aw, seasonRecap, player,
                          [...new Set([thisYear?.league, (thisYear?.stints || []).at(-1)?.league, player.league].filter(Boolean))]);
                        return (
                          <li key={aw}>
                            <span className="block text-[#F59E0B] font-bold leading-snug">{aw}</span>
                            {why && <span className="block text-slate-300 text-sm leading-snug mt-0.5">{why}</span>}
                          </li>
                        );
                      })}
                    </ul>
                  </RecapRow>
                )}

                {/* The scoring race.
                    A fifty-goal season used to arrive with nothing to measure
                    it against, because the league had nobody else in it. Now
                    the year has a leader, and some of the time he is a name
                    you were drafted alongside. */}
                {seasonRecap?.scoringBar && !['G', 'LD', 'RD'].includes(player.pos) && (() => {
                  const bar = seasonRecap.scoringBar;
                  const mine = (seasonRecap.g || 0) + (seasonRecap.a || 0);
                  const won = mine >= bar.total;
                  const short = bar.total - mine;
                  // Every line here names the league. "It took 113 points to
                  // win the scoring title" never said whose title it was, and
                  // a player on a call-up had two leagues it could have meant
                  // and no way of telling which. The bar now carries the
                  // league it was measured in, so the two cannot disagree.
                  const lg = bar.league || seasonRecap.league;
                  const where = leagueWithArticle(lg);
                  return (
                    <RecapRow accent={won ? '#22E748' : '#64748b'}
                              label={won ? `🥇 You led ${formatLeagueName(lg)} in scoring` : `📊 The ${formatLeagueName(lg)} scoring race`}
                              tint={won}>
                      {won
                        ? `Nobody in ${where} scored more than your ${mine} points.`
                        : bar.name
                          ? `${bar.name} led ${where} in scoring with ${bar.total} points. You finished the year on ${mine}, ${short} behind him.`
                          : `It took ${bar.total} points to lead ${where} in scoring this season. You finished on ${mine}, ${short} behind the man who did.`}
                      {/* And the one comparison a prospect actually makes,
                          which the league leader is not: the best of his own
                          year group in his own league. A classmate wins an
                          outright scoring title about one season in twenty,
                          so without this the junior years went by without a
                          single familiar name in the race.

                          classBest is the best CLASSMATE, and the player is
                          not in that field, so the line has to be read against
                          him before it is printed. It was not: a player on 84
                          points was told that the best of his draft class was
                          a classmate on 47, which is the opposite of what had
                          happened. */}
                      {bar.classBest && (
                        <span className="block text-slate-400 mt-1">
                          {mine > bar.classBest.pts
                            ? `Nobody from your ${cw} in ${formatLeagueName(lg)} outscored you. ${bar.classBest.name} was the next best on ${bar.classBest.pts}.`
                            : mine === bar.classBest.pts
                              ? `${bar.classBest.name}, from your ${cw}, finished level with you on ${bar.classBest.pts} points.`
                              : `${bar.classBest.name} was the best of your ${cw} in ${formatLeagueName(lg)} on ${bar.classBest.pts} points.`}
                        </span>
                      )}
                    </RecapRow>
                  );
                })()}

                {/* A defenceman and a goalie get the comparison that belongs
                    to them. Both used to be shown how far short of the
                    scoring title they finished, which is a forward's job and
                    not theirs: a goalie was told he was 129 points back. */}
                {seasonRecap?.classBestAtPos && (() => {
                  const cb = seasonRecap.classBestAtPos;
                  // "in NHL" rather than "in the NHL". The helper that applies
                  // the article correctly per league was already imported here
                  // and used three rows up; this row was formatting the name raw.
                  const lg = leagueWithArticle(cb.league || seasonRecap.league);
                  const isG = player.pos === 'G';
                  const mySv = (seasonRecap.shots || 0) > 0 ? (seasonRecap.saves || 0) / seasonRecap.shots : null;
                  const myPts = (seasonRecap.g || 0) + (seasonRecap.a || 0);
                  const fmt = (v) => v.toFixed(3).replace('0.', '.');

                  // A defenceman's year against his classmates', graded rather
                  // than counted. This row used to hand him the highest scoring
                  // defenceman in the class and call him the best one, so a
                  // plus-thirty season at twenty-four minutes a night was
                  // reported as second best to a man who had been on the ice
                  // for forty goals against and outscored him by six points.
                  const myGames = seasonRecap.games || 0;
                  const myGrade = !isG && myGames > 0
                    ? rateSeason({
                        league: cb.league || seasonRecap.league, pos: player.pos, games: myGames,
                        g: seasonRecap.g || 0, a: seasonRecap.a || 0,
                        pm: seasonRecap.pm || 0, blk: seasonRecap.blk, toi: seasonRecap.avgToi
                      })
                    : null;
                  const ahead = isG
                    ? (mySv != null && mySv >= cb.sv)
                    : (myGrade != null && cb.rating != null ? myGrade >= cb.rating : myPts >= cb.pts);

                  return (
                    <RecapRow accent={ahead ? '#22E748' : '#64748b'}
                              label={isG ? `🥅 Your ${cw} in net` : `🛡️ Your ${cw} on the blue line`}
                              tint={ahead}>
                      {isG
                        ? (mySv == null
                            ? `${cb.name} was the best goaltender of your ${cw} in ${lg} at ${fmt(cb.sv)}.`
                            : ahead
                              ? `No goaltender from your ${cw} in ${lg} stopped more than you did. ${cb.name} was next at ${fmt(cb.sv)}.`
                              : `${cb.name} was the best goaltender of your ${cw} in ${lg} at ${fmt(cb.sv)}. You finished on ${fmt(mySv)}.`)
                        : (() => {
                            // SAY WHY HE WON IT.
                            //
                            // The verdict comes from rateSeason, which marks
                            // the whole season, and the sentence then quoted
                            // points and blocks only. So a defenceman could be
                            // told nobody had a better year than his 39 points
                            // while the runner-up was listed on 57, which reads
                            // as the game contradicting itself in one line.
                            //
                            // If the man behind him outscored him, the line now
                            // says so first and then says what beat it.
                            const myBlk = seasonRecap.blk || 0;
                            const hisBlk = cb.blk || 0;
                            const outscored = cb.pts > myPts;
                            if (ahead) {
                              return outscored
                                ? `${cb.name} outscored you, ${cb.pts} points to ${myPts}, and you still had the better year of it: ${myBlk} blocks to his ${hisBlk}, and the harder minutes.`
                                : `No defenceman from your ${cw} in ${lg} had a better year than yours: ${myPts} points and ${myBlk} blocks. ${cb.name} was next, on ${cb.pts} and ${hisBlk}.`;
                            }
                            return myPts > cb.pts
                              ? `You outscored every defenceman in your ${cw} in ${lg} on ${myPts} points, but ${cb.name} had the better season: ${cb.pts} points and ${hisBlk} blocks${cb.toi ? ` at ${cb.toi.toFixed(1)} minutes a night` : ''}.`
                              : `${cb.name} was the best defenceman of your ${cw} in ${lg}: ${cb.pts} points and ${hisBlk} blocks${cb.toi ? ` at ${cb.toi.toFixed(1)} minutes a night` : ''}. You finished on ${myPts} and ${myBlk}.`;
                          })()}
                    </RecapRow>
                  );
                })()}

                {/* The scouting board.
                    Draft night used to be the first time the player saw any of
                    these names, so the board on it read as thirty strangers
                    either side of him. He reads the same list every winter now,
                    with himself on it, so by the time the room comes round he
                    knows who is going where and why. */}
                {seasonRecap?.scoutBoard?.myRank && (() => {
                  const b = seasonRecap.scoutBoard;
                  const moved = player.prevScoutRank ? player.prevScoutRank - b.myRank : 0;
                  const ahead = b.ahead;
                  return (
                    <RecapRow accent="#38bdf8" label="🔭 The scouting board" tint={b.myRank <= 5}>
                      <p className="text-slate-300 leading-relaxed mb-3">
                        The scouts have you <span className="font-black text-white">{ordinal(b.myRank)}</span> among
                        the {b.groupLabel} in your draft year
                        {moved > 0
                          ? `, up ${moved} place${moved === 1 ? '' : 's'} on last winter.`
                          : moved < 0
                            ? `, down ${-moved} place${moved === -1 ? '' : 's'} on last winter.`
                            : player.prevScoutRank
                              ? ', exactly where you were last winter.'
                              : '.'}
                        {ahead ? ` ${ahead.name} is the one directly in front of you.` : ''}
                      </p>
                      <div className="rounded-lg border border-[rgba(255,255,255,0.065)] overflow-hidden">
                        {b.rows.map(r => (
                          <div key={r.id}
                               className={`flex items-center gap-2.5 px-3 py-1.5 border-b border-[rgba(255,255,255,0.04)] last:border-0 ${
                                 r.me ? 'bg-[#38bdf8]/[0.12]' : ''}`}>
                            <span className={`w-5 shrink-0 text-right text-[11px] font-black number-font ${
                              r.me ? 'text-[#38bdf8]' : 'text-slate-600'}`}>{r.rank}</span>
                            <span className="shrink-0 w-[22px] flex items-center justify-center">
                              {r.flag
                                ? <img src={r.flag} alt="" className="w-[18px] h-[13px] object-cover rounded-[1px]" />
                                : <span className="w-[18px] h-[13px] rounded-[1px] bg-[#151b15]" />}
                            </span>
                            {/* You, not your own name, the same as every
                                other board in the game. */}
                            <span className={`min-w-0 flex-1 break-words text-[12.5px] sm:text-[13px] ${
                              r.me ? 'text-white font-black' : 'text-slate-300 font-medium'}`}>{r.me ? 'You' : r.name}</span>
                            {/* The position is the first thing to go on a
                                phone. A name truncated to "Con..." is not a
                                name, and the whole point of this list is that
                                he comes to know who these people are. */}
                            <span className="hidden sm:block shrink-0 text-[10px] font-black uppercase tracking-widest text-slate-500 w-8 text-right">{r.pos}</span>
                            {/* Left-aligned, so the flags make a column.
                                Aligning this cell to its right edge lined up
                                the end of the text instead, and because the
                                codes run from three letters to five the flags
                                came out ragged: the one thing in the cell that
                                is the same width on every row was the one
                                thing not in a straight line.

                                Fifty-eight rather than fifty-two on a phone
                                because QMJHL is thirty-nine pixels wide and
                                fifty-two left it thirty-five after the flag
                                and the gap, so the longest code in the game
                                was rendering as QMJ with a dot after it. The
                                six come off the name, which truncates anyway
                                and has the whole middle of the row to do it
                                in. */}
                            <span className="flex shrink-0 items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-600 w-[58px] sm:w-16">
                              <LeagueTag league={r.league} flagClass="w-[13px] h-[9px]" />
                            </span>
                            <span className={`shrink-0 text-[11px] font-black number-font w-[52px] sm:w-16 text-right ${
                              r.me ? 'text-[#38bdf8]' : 'text-slate-400'}`}>
                              {r.sv != null ? r.sv.toFixed(3).replace('0.', '.')
                                : r.pts != null ? `${r.pts} pts` : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    </RecapRow>
                  );
                })()}

                {/* WHAT THE YEAR COST HIM.
                    Above the draft class, because a season spent watching is
                    the first thing a player would tell you about it. */}
                {seasonRecap?.holdout && (
                  <RecapRow accent="#F59E0B" label="🛑 The holdout">
                    {seasonRecap.holdout}
                  </RecapRow>
                )}
                {seasonRecap?.injury && (
                  <RecapRow accent="#ef4444" label="🏥 The treatment room">
                    {seasonRecap.injury}
                  </RecapRow>
                )}

                {/* The rest of your draft class, when there is anything to
                    say. Most summers there is not. */}
                {seasonRecap?.classNews && (
                  <RecapRow accent="#c084fc" label={`🏒 Your ${cw}`}>
                    {seasonRecap.classNews.line}
                  </RecapRow>
                )}

                {/* RECORDS.
                    Above the milestones, because a hundredth goal is a lovely
                    night and a club record is the wall of the building. */}
                {(seasonRecap.recordsBroken || []).filter(r => r.report).length > 0 && (
                  <RecapRow accent="#F59E0B" label="📖 The record book">
                    <ul className="space-y-1.5">
                      {seasonRecap.recordsBroken.filter(r => r.report).map((r, i) => (
                        <li key={`rec-${i}`} className="text-slate-300 leading-relaxed">
                          <span className={`inline-block mr-2 align-middle text-[9px] font-black uppercase tracking-widest px-1.5 py-[2px] rounded border ${
                            r.scope === 'league'
                              ? 'text-[#F59E0B] border-[rgba(245,158,11,0.45)] bg-[rgba(245,158,11,0.10)]'
                              : 'text-slate-400 border-[rgba(255,255,255,0.14)]'}`}>
                            {r.scope === 'league' ? r.league : 'Club'}
                          </span>
                          {recordLine(r, getFullTeamName(r.club, r.league))}
                        </li>
                      ))}
                    </ul>
                  </RecapRow>
                )}

                {/* MILESTONES.
                    The hundredth goal, the thousandth game, the first one of
                    all. A career could pass every one of these without the
                    game saying a word, and they are the nights the play stops
                    and somebody fishes the puck out for you. */}
                {(seasonRecap.milestones || []).length > 0 && (
                  <RecapRow accent="#F59E0B" label="🏅 Milestones">
                    <ul className="space-y-1">
                      {seasonRecap.milestones.map((m, i) => (
                        <li key={`ms-${i}`} className="text-slate-300 leading-relaxed">{m}</li>
                      ))}
                    </ul>
                  </RecapRow>
                )}

              </ul>

              {/* THE MOMENTS OF THE SEASON.
                  The smaller things that happened along the way: a minigame,
                  an endorsement, a night against a rival. They aren't the
                  story of the season, which the summary above tells, so they
                  sit behind one button and open underneath it, in the order
                  they happened. Nothing above the button moves when it opens. */}
              {(() => {
                // News about a dressing room (who left it over the summer, who
                // passed you in it) only belongs here if this season was played
                // in that room. A player who moved clubs in the summer was being
                // told about his old team's departures in his new team's recap.
                const thisYear = player.seasonHistory?.[player.seasonHistory.length - 1];
                const playedFor = new Set([thisYear?.team, thisYear?.tradedTo, ...((thisYear?.stints || []).map(st => st?.team))].filter(Boolean));
                const list = seasonEvents.map((ev, i) => ({ ev, i }))
                  .filter(({ ev }) => ev && ev.feedback && (!ev.club || !playedFor.size || playedFor.has(ev.club)));
                if (!list.length) return null;
                const listCls = 'space-y-3 sm:space-y-4 text-slate-300 text-sm sm:text-base font-sans text-left leading-relaxed';
                return (
                  <section className="mt-3 sm:mt-4" aria-label="Moments of the season">
                    {/* Laid out like every other line of the report, with its
                        own coloured rule and label, so it reads as part of the
                        list. It was a full-width grey button sitting under it. */}
                    <ul className={listCls}>
                      <RecapRow accent="#c084fc" label="📰 Moments of the Season">
                        <button type="button" onClick={() => setShowAllMoments(v => !v)} aria-expanded={showAllMoments}
                                aria-controls="recap-moments"
                                className="inline-flex items-center gap-1.5 text-left text-slate-300 hover:text-white cursor-pointer">
                          {showAllMoments
                            ? 'Hide them'
                            : `${list.length} ${list.length === 1 ? 'moment' : 'moments'} from the year`}
                          <span aria-hidden="true" className={`text-[#c084fc] transition-transform ${showAllMoments ? 'rotate-180' : ''}`}>▾</span>
                        </button>
                      </RecapRow>
                    </ul>
                    {showAllMoments && (
                      <ul id="recap-moments" className={`${listCls} mt-4 moments-in`}>
                        {list.map(({ ev, i }) => (
                          <RecapRow key={`event-${i}`} accent="#c084fc"
                                    label={[ev.title || '📰 In the news', ev.stakes].filter(Boolean).join(' · ')}>
                            {ev.setup && (
                              <p className="text-slate-500 text-[11px] sm:text-xs leading-relaxed mb-1.5">{ev.setup}</p>
                            )}
                            <p className="text-slate-300 leading-relaxed">{ev.feedback}</p>
                            <PillRow effect={ev.effect} perks={ev.perks} flaws={ev.flaws} isGoalie={player.pos === 'G'} />
                          </RecapRow>
                        ))}
                      </ul>
                    )}
                  </section>
                );
              })()}

              <div className="w-full pt-6 mt-8 border-t border-[rgba(255,255,255,0.05)] flex flex-col sm:flex-row gap-4">
                <button onClick={() => advanceToOffseason()} className="btn-primary flex-1 py-4 rounded-xl text-lg sm:text-xl cursor-pointer sports-font tracking-widest">
                  PROCEED TO OFFSEASON
                </button>
                
                {player.league === 'NCAA' && (
                   <button onClick={() => {
                       unlockAchievement('transfer_portal'); 
                       setPlayer(p => ({ ...p, fanStatus: capFanStatus((p.fanStatus || 0) - 15) }));

                       let pool = ncaaTeams?.filter(t => t.id !== player.team) || [];
                       pool = [...pool].sort(() => 0.5 - Math.random()).slice(0, 3);
                       if (pool.length === 0) pool = [{ id: 'UNK', name: 'Unknown Program' }];

                       const offeredTeams = pool.map(t => {
                           const possiblePerks = [
                               { name: '📈 Elite Coaching', effect: '+2 OVR', ovr: 2, fanStatus: 0, money: 0, color: 'text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/30' },
                               { name: '🏟️ National Spotlight', effect: '+25 FAN', ovr: 0, fanStatus: 25, money: 0, color: 'text-[#22E748] bg-[#22E748]/10 border-[#22E748]/30' },
                               { name: '💰 NIL Deal', effect: '$100K', ovr: 0, fanStatus: 0, money: 100000, color: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30' },
                               { name: '⚡ Run & Gun', effect: '+1 OVR, +10 FAN', ovr: 1, fanStatus: 10, money: 0, color: 'text-[#22E748] bg-[#22E748]/10 border-[#22E748]/30' }
                           ];

                           const possibleFlaws = [
                               { name: '⚠️ Crowded Depth', effect: '-1 OVR', ovr: -1, fanStatus: 0, money: 0 },
                               { name: '⚠️ Rebuilding', effect: '-10 FAN', ovr: 0, fanStatus: -10, money: 0 },
                               { name: '⚠️ Strict System', effect: '-5 FAN', ovr: 0, fanStatus: -5, money: 0 }
                           ];

                           const perkCount = Math.floor(Math.random() * 2) + 1; 
                           const flawCount = Math.floor(Math.random() * 2);     

                           const selectedPerks = [...possiblePerks].sort(() => 0.5 - Math.random()).slice(0, perkCount);
                           const selectedFlaws = [...possibleFlaws].sort(() => 0.5 - Math.random()).slice(0, flawCount);

                           let totalOvr = 0, totalFans = 0, totalMoney = 0;
                           selectedPerks.forEach(p => { totalOvr += p.ovr; totalFans += p.fanStatus; totalMoney += p.money; });
                           selectedFlaws.forEach(f => { totalOvr += f.ovr; totalFans += f.fanStatus; totalMoney += f.money; });

                           return {
                               ...t,
                               finalOvr: Math.max(0, totalOvr),
                               finalFans: totalFans,
                               finalMoney: totalMoney,
                               perks: selectedPerks,
                               flaws: selectedFlaws
                           };
                       });

                       const choices = offeredTeams.map(t => ({
                           label: `Commit to ${t.name}`, 
                           perks: t.perks,
                           flaws: t.flaws,
                           isRisky: false, 
                           feedback: `You signed the transfer paperwork. You play for ${t.name} now.`, 
                           effect: { fanStatus: t.finalFans, ovr: t.finalOvr, money: t.finalMoney }, 
                           action: 'JOIN_NCAA', 
                           actionData: t.id
                       }));

                       setActiveEvent({
                           title: 'TRANSFER PORTAL OFFERS',
                           desc: `You entered the transfer portal. The fans you're leaving are furious (Fan Status -15), and several programmes called the same day with scholarship and NIL offers.`,
                           choices: choices,
                           isPortalEvent: true
                       });
                       
                       setScreen('event');
                   }} className="btn-danger flex-1 py-4 rounded-xl text-lg sm:text-xl cursor-pointer sports-font tracking-widest">
                     ENTER TRANSFER PORTAL
                   </button>
                )}
              </div>
            </div>
          );
        })();
}