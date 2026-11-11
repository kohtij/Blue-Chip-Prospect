import { useAppContext } from '../AppContext';
import { getFullTeamName, getPlayoffTitles } from '../utils/appHelpers';
import { getOpponentPool, getPlayoffRounds, getPrimaryRival, ncaaTeams } from '../data/teams';
import { splitPerk } from '../data/offerPerks';
import { capFanStatus, formatMoney, ordinal } from '../utils/gameHelpers';
import { formatLeagueName, leagueWithArticle, withTeamArticle } from '../utils/gameHelpers';
import LeagueTag from '../components/LeagueTag';

// Leagues that don't count toward a player's pro season number.
const AMATEUR_LEAGUES = ['OHL', 'WHL', 'QMJHL', 'USHL', 'BCHL', 'NCAA'];

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

  const perkPills = [
    ...(perks || []).map((pk, i) => chip(pk, i, false)),
    ...(flaws || []).map((fl, i) => chip(fl, i, true))
  ].filter(Boolean);

  if (statPills.length === 0 && perkPills.length === 0) return null;
  return <div className="flex flex-wrap items-center gap-1.5 mt-2.5">{statPills}{perkPills}</div>;
}

export default function RecapScreen() {
  const { advanceToOffseason, isJunior, player, seasonEvents, seasonRecap, setActiveEvent, setPlayer, setScreen, unlockAchievement } = useAppContext();
  
  return (() => {
          const titles = getPlayoffTitles(player.league);
          let narrative;
          let narrativeTitle;
          let displayRating = (seasonRecap?.rating || 5).toFixed(1);
          
          if (seasonRecap?.titleWon === 1) displayRating = "10.0";
          else if (parseFloat(displayRating) > 9.5) displayRating = "9.5";

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
          const maxWins = (getPlayoffRounds(player.league) || [])
            .reduce((sum, r) => sum + Math.ceil((r.gamesPerMatchup || 7) / 2), 0) || 16;
          const standings = seasonRecap?.standings || 16;

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
          const streak = (() => {
            const hist = player.seasonHistory || [];
            let n = 1;
            for (let i = hist.length - 1; i >= 0; i--) {
              // The season being recapped may already be written; skip it once.
              if (i === hist.length - 1 && hist[i].year === (2026 + ((player.stats?.seasonsPlayed || 1) - 1))) continue;
              if (hist[i].titleWon) n += 1; else break;
            }
            return n;
          })();

          if (seasonRecap?.titleWon === 1 && streak >= 2) {
             const cupName = player.league === 'NHL' ? 'the Stanley Cup' : (titles?.cupName || 'the Championship');
             if (streak === 2) {
                 narrativeTitle = 'BACK-TO-BACK CHAMPIONS';
                 narrative = `Twice. Winning ${cupName} once can be a good year and a hot goaltender; winning it again is the part nobody manages. This team does not have to argue about it any more.`;
             } else if (streak === 3) {
                 narrativeTitle = 'THREE IN A ROW';
                 narrative = `Three straight. There are franchises a century old that have never done this once, and you have done it three years running. People have started using the word dynasty without smirking.`;
             } else {
                 narrativeTitle = `${streak} STRAIGHT`;
                 narrative = `${streak} in a row. Whatever the rest of the league is building, it is being built to beat you, and it is not working. This is a dynasty by any measure anyone has ever used.`;
             }
          } else if (seasonRecap?.titleWon === 1) {
             if (player.league === 'NHL') {
                 narrativeTitle = 'STANLEY CUP CHAMPIONS';
                 narrative = `Absolute glory. You climbed the mountain and won the Stanley Cup! Your name is immortalized.`;
             } else if (isJunior) {
                 if (seasonRecap?.memCupStatus === 'won') {
                     narrativeTitle = 'MEMORIAL CUP CHAMPIONS';
                     narrative = `Absolute glory. You conquered ${leagueWithArticle(player.league)} and lifted the Memorial Cup, cementing your legacy as a junior hockey legend.`;
            } else if (seasonRecap?.memCupStatus === 'lost') {
                         narrativeTitle = 'REGIONAL CHAMPIONS';
                         narrative = `You dominated your league and lifted the ${titles?.cupName || 'Championship'}, but fell agonizingly short in the Memorial Cup against the nation's best. A bittersweet, but incredible season.`;
                     } else {
                         narrativeTitle = `${formatLeagueName(player.league)} CHAMPIONS`;
                         narrative = `You climbed the mountain and won the ${titles?.cupName || 'Championship'}!`;
                     }
                 } else {
                     narrativeTitle = 'CHAMPIONS';
                     narrative = `Absolute glory. You climbed the mountain and won the ${titles?.cupName || 'Championship'}!`;
                 }
          } else if (madePlayoffsForNarrative) {
              if (pw === maxWins - 1) {
                  narrativeTitle = 'GAME 7 HEARTBREAK';
                  narrative = 'One win away from the ultimate prize. The locker room is devastated.';
              } else if (pw >= maxWins / 2) {
                  narrativeTitle = 'DEEP PLAYOFF RUN';
                  narrative = 'A valiant effort, but you ran out of gas down the stretch.';
              } else if (pw === 0) {
                  narrativeTitle = 'SWEPT';
                  narrative = standings <= 4 
                    ? 'A humiliating sweep after a dominant regular season. The media is ruthless.' 
                    : 'Swept out of the first round. You were outmatched from puck drop.';
              } else {
                  narrativeTitle = 'PLAYOFF EXIT';
                  if (standings <= 4) {
                      narrative = 'A dominant regular season erased by a shocking early playoff collapse.';
                  } else if (standings >= 13) {
                      narrative = 'After barely squeaking into the postseason as a fringe seed, the Cinderella run was cut short.';
                  } else {
                      narrative = 'A solid regular season erased by an early playoff elimination.';
                  }
              }
              
              if (rivalWonTitle) {
                  narrative += ` Adding insult to injury, your arch-rivals, ${withTeamArticle(rivalName, player.league)}, lifted the trophy.`;
              } else if (hasHardware && pw > 0 && pw < maxWins - 1) {
                  narrative += " Your individual brilliance wasn't enough to carry the team.";
              }
          } else {
              narrativeTitle = 'MISSED THE DANCE';
              narrative = 'A disappointing campaign. Rebuild for next year.';
              if (rivalWonTitle) {
                  narrative = `A nightmare season. Not only did you miss the playoffs, but your arch-rivals, ${withTeamArticle(rivalName, player.league)}, won it all.`;
              } else if (hasHardware) {
                  narrative = 'You had an incredible individual year, but the team completely let you down.';
              }
          }

          return (
            <div className="game-panel p-6 sm:p-10 mt-2 border-t-2 border-t-[#3b82f6]">
              <style>{`
                @keyframes subtleFadeUp {
                  0% { opacity: 0; transform: translateY(12px); }
                  100% { opacity: 1; transform: translateY(0); }
                }
                .recap-list > li {
                  opacity: 0;
                  animation: subtleFadeUp 0.5s ease-out forwards;
                }
                ${Array.from({length: 25}).map((_, i) => `.recap-list > li:nth-child(${i + 1}) { animation-delay: ${(i * 0.15) + 0.1}s; }`).join('\n')}
              `}</style>

              <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.065)] pb-4 mb-6">
                <h2 className="text-[#3b82f6] font-bold tracking-widest uppercase text-sm sm:text-lg sports-font">THE RINK REPORT</h2>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs sm:text-sm">
                  {/* The SHL and Liiga used to land here as "AMATEUR CAMPAIGN". They are
                      professional leagues, so they now count as pro seasons, and the label
                      shares one list with the season counter instead of keeping its own. */}
                  {AMATEUR_LEAGUES.includes(player.league) ? 'AMATEUR CAMPAIGN' : `PRO SEASON ${proSeasonNumber}`}
                </p>
              </div>

              <div className="w-full mb-8">
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-2">
                  <h1 className="text-3xl sm:text-4xl font-black text-white italic uppercase text-left sports-font tracking-tighter m-0">
                    {narrativeTitle}
                  </h1>
                  <div className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg flex items-center gap-2 border ${parseFloat(displayRating) >= 8.0 ? 'bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#F59E0B]' : 'bg-[#101410] border-[rgba(255,255,255,0.065)] text-slate-300'}`}>
                    <div className="flex flex-col text-right justify-center mt-0.5">
                      <span className="text-[8px] sm:text-[9px] font-bold tracking-widest uppercase font-sans leading-none mb-[2px]">SEASON</span>
                      <span className="text-[8px] sm:text-[9px] font-bold tracking-widest uppercase font-sans leading-none">RATING</span>
                    </div>
                    <span className="text-2xl sm:text-3xl font-black sports-font leading-none">{displayRating}</span>
                  </div>
                </div>
                <p className="text-base sm:text-lg text-slate-400 font-sans italic text-left m-0">"{narrative}"</p>
              </div>

              <ul className="recap-list space-y-3 sm:space-y-4 text-slate-300 text-sm sm:text-base font-sans text-left leading-relaxed">
                <li className="border-l-4 border-[#3b82f6] pl-4 pr-3 py-2.5 rounded-r-lg">
                  {(() => {
                     const currentHistory = player.seasonHistory?.[player.seasonHistory.length - 1];

                     // A season split across two leagues, as the nine-game rule
                     // produces: nine games up top, the rest back in junior. A trade
                     // moves clubs inside one league and is handled below.
                     const stints = currentHistory?.stints || [];
                     if (stints.length > 1 && stints[0].league !== stints[1].league) {
                        const first = stints[0];
                        const rest = stints.slice(1);
                        return (
                          <>🏅 Played <strong className="text-white">{first.games}</strong> game{first.games === 1 ? '' : 's'} in {leagueWithArticle(first.league)} with <strong className="text-white">{getFullTeamName(first.team, first.league)}</strong>, then spent the rest of the year {rest.map((s, i) => (
                            <span key={`${s.team}-${i}`}>in {leagueWithArticle(s.league)} with <strong className="text-white">{getFullTeamName(s.team, s.league)}</strong> ({s.games} GP)</span>
                          ))}.</>
                        );
                     }

                     if (currentHistory?.tradedTo) {
                        return (
                          <>🏅 Started the year with <strong className="text-white">{getFullTeamName(currentHistory.team, player.league)}</strong> ({currentHistory.gamesWithOriginal} GP) before a blockbuster trade to <strong className="text-white">{getFullTeamName(currentHistory.tradedTo, player.league)}</strong> ({currentHistory.gamesWithNew} GP).</>
                        );
                     }
                     return (
                       <>🏅 {withTeamArticle(getFullTeamName(player.team, player.league), player.league, true)} finished <strong className="text-white">#{seasonRecap?.standings || '-'}</strong> in {leagueWithArticle(player.league)}. {
                         (seasonRecap?.standings === 1) ? 'An absolutely dominant regular season.' :
                         (seasonRecap?.madePlayoffs) ? 'A solid campaign to secure a playoff berth.' :
                         (seasonRecap?.standings >= (getOpponentPool(player.league)?.length || 20) - 3) ? 'A miserable rebuilding year for the franchise.' :
                         'A mediocre year that fell short of expectations.'
                       }</>
                     );
                  })()}
                </li>
                
                {player.pos === 'G' ? (
                  <li className="border-l-4 border-[#22E748] pl-4 pr-3 py-2.5 rounded-r-lg">🥅 Went <strong className="text-white">{seasonRecap?.wins || 0}&ndash;{seasonRecap?.losses || 0}&ndash;{seasonRecap?.otl || 0}</strong> with a <strong className="text-white">{(seasonRecap?.saves / seasonRecap?.shots || 0).toFixed(3).replace('0.', '.')} save percentage</strong> and <strong className="text-white">{seasonRecap?.sho || 0} shutouts</strong> in {seasonRecap?.games || 0} games. {
                    (seasonRecap?.saves / seasonRecap?.shots || 0) >= 0.920 ? 'Truly elite numbers between the pipes.' :
                    (seasonRecap?.saves / seasonRecap?.shots || 0) >= 0.905 ? 'A reliable, steady presence in the crease.' :
                    'Struggled to find consistency this year.'
                  }</li>
                ) : ['LD', 'RD'].includes(player.pos) ? (
                  <li className="border-l-4 border-[#22E748] pl-4 pr-3 py-2.5 rounded-r-lg">🧱 Anchored the defense with <strong className="text-white">{seasonRecap?.g || 0}G, {seasonRecap?.a || 0}A ({(seasonRecap?.g || 0) + (seasonRecap?.a || 0)} PTS)</strong> in {seasonRecap?.games || 0} games, logging a <strong className="text-white">{seasonRecap?.pm > 0 ? `+${seasonRecap.pm}` : (seasonRecap?.pm || 0)}</strong> rating while averaging <strong className="text-white">{clock(seasonRecap?.avgToi)} TOI</strong>
                    {(seasonRecap?.ppToi || 0) >= 0.2
                      ? <>, <strong className="text-white">{clock(seasonRecap.ppToi)}</strong> of it on the powerplay</>
                      : <> and no powerplay time at all</>}. {
                    /* The verdict reads off the graded season now rather than
                       the point total alone. A defenceman who finished under
                       forty points was told he had "focused heavily on the
                       defensive side of the puck" whether he had been plus
                       thirty at twenty-four minutes a night or minus twenty on
                       the third pair: one sentence covering the best defensive
                       year in the league and the worst. */
                    (seasonRecap?.rating || 5) >= 9.0 ? 'As good a year as any defenceman in the league had.' :
                    (seasonRecap?.rating || 5) >= 8.0
                      ? (((seasonRecap?.g || 0) + (seasonRecap?.a || 0)) >= 55
                          ? 'You carried the puck out of your own end all season.'
                          : 'You shut down the other team’s best line all season.') :
                    (seasonRecap?.rating || 5) >= 6.5 ? 'A dependable pair, every night.' :
                    (seasonRecap?.pm || 0) < -10 ? 'Caught out far too often.' :
                    'A quiet year in a sheltered role.'
                  }</li>
                ) : (
                  <li className="border-l-4 border-[#22E748] pl-4 pr-3 py-2.5 rounded-r-lg">🏒 Potted <strong className="text-white">{seasonRecap?.g || 0} goals</strong> and <strong className="text-white">{seasonRecap?.a || 0} assists</strong> for <strong className="text-white">{(seasonRecap?.g || 0) + (seasonRecap?.a || 0)} PTS</strong> in {seasonRecap?.games || 0} games, playing <strong className="text-white">{Math.floor(seasonRecap?.avgToi || 0)}:{Math.round(((seasonRecap?.avgToi || 0) % 1) * 60).toString().padStart(2, '0')} TOI</strong> a night. {
                    ((seasonRecap?.g || 0) + (seasonRecap?.a || 0)) >= 100 ? 'A legendary century-mark campaign.' :
                    (seasonRecap?.g >= 50) ? 'An elite goal-scoring year.' :
                    ((seasonRecap?.g || 0) + (seasonRecap?.a || 0)) >= 70 ? 'A highly productive offensive season.' :
                    ((seasonRecap?.g || 0) + (seasonRecap?.a || 0)) >= 40 ? 'A solid middle-six contribution.' :
                    'Struggled to consistently generate offense.'
                  }</li>
                )}

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
                    {seasonRecap?.beatRivalRound && !seasonRecap?.lostToRival && (
                       <li className="border-l-4 border-[#F59E0B] pl-4 pr-3 py-2.5 rounded-r-lg bg-[#F59E0B]/[0.06] text-[#F59E0B] font-bold">
                         ⚔️ Put your arch-rivals, the {seasonRecap.beatRivalName}, out in the {seasonRecap.beatRivalRound}.
                       </li>
                    )}
                    {seasonRecap?.memCupStatus === 'won' && (
                       <li className="border-l-4 border-[#F59E0B] pl-4 pr-3 py-2.5 rounded-r-lg bg-[#F59E0B]/[0.06] text-[#F59E0B] font-bold">
                         🏆 CONQUERED THE NATION AND WON THE MEMORIAL CUP!
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
                    {/* The trophies were a row of outlined, tinted pills, which
                        is a lot of chrome for what is a list of names. The row
                        already has its own border and colour. */}
                    <span className="text-[#F59E0B] font-bold">
                      {Array.from(new Set(seasonRecap.awards)).join(' · ')}
                    </span>
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
                            ? `Nobody from your draft class in ${formatLeagueName(lg)} outscored you. ${bar.classBest.name} was the next best on ${bar.classBest.pts}.`
                            : mine === bar.classBest.pts
                              ? `${bar.classBest.name}, drafted the same year as you, finished level with you on ${bar.classBest.pts} points.`
                              : `${bar.classBest.name}, drafted the same year as you, was the best of your class in ${formatLeagueName(lg)} on ${bar.classBest.pts} points.`}
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
                  const lg = formatLeagueName(cb.league || seasonRecap.league);
                  const isG = player.pos === 'G';
                  const mySv = (seasonRecap.shots || 0) > 0 ? (seasonRecap.saves || 0) / seasonRecap.shots : null;
                  const myPts = (seasonRecap.g || 0) + (seasonRecap.a || 0);
                  const ahead = isG ? (mySv != null && mySv >= cb.sv) : myPts >= cb.pts;
                  const fmt = (v) => v.toFixed(3).replace('0.', '.');
                  return (
                    <RecapRow accent={ahead ? '#22E748' : '#64748b'}
                              label={isG ? '🥅 Your draft class in net' : '🛡️ Your draft class on the blue line'}
                              tint={ahead}>
                      {isG
                        ? (mySv == null
                            ? `${cb.name} was the best goaltender of your draft class in ${lg} at ${fmt(cb.sv)}.`
                            : ahead
                              ? `No goaltender from your draft class in ${lg} stopped more than you did. ${cb.name} was next at ${fmt(cb.sv)}.`
                              : `${cb.name} was the best goaltender of your draft class in ${lg} at ${fmt(cb.sv)}. You finished on ${fmt(mySv)}.`)
                        : (ahead
                            ? `No defenceman from your draft class in ${lg} outscored your ${myPts} points. ${cb.name} was next on ${cb.pts}.`
                            : `${cb.name} was the best defenceman of your draft class in ${lg} with ${cb.pts} points. You finished on ${myPts}.`)}
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
                                : <span className="w-[18px] h-[13px] rounded-[1px] bg-[#1a2230]" />}
                            </span>
                            {/* You, not your own name, the same as every
                                other board in the game. */}
                            <span className={`min-w-0 flex-1 truncate text-[12.5px] sm:text-[13px] ${
                              r.me ? 'text-white font-black' : 'text-slate-300 font-medium'}`}>{r.me ? 'You' : r.name}</span>
                            {/* The position is the first thing to go on a
                                phone. A name truncated to "Con..." is not a
                                name, and the whole point of this list is that
                                he comes to know who these people are. */}
                            <span className="hidden sm:block shrink-0 text-[10px] font-black uppercase tracking-widest text-slate-500 w-8 text-right">{r.pos}</span>
                            <span className="flex shrink-0 items-center justify-end gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-600 w-[52px] sm:w-16">
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

                {/* The rest of your draft class, when there is anything to
                    say. Most summers there is not. */}
                {seasonRecap?.classNews && (
                  <RecapRow accent="#c084fc" label="🏒 Your draft class">
                    {seasonRecap.classNews.line}
                  </RecapRow>
                )}

                {/* The moments of the season, each with the thing that set it
                    up above the thing that happened. A minigame result used to
                    arrive as one line under "In the news": "Clean win! You
                    snapped it straight back to your defenseman", with nothing
                    anywhere saying what had been won, in what situation, or
                    what it was worth. The moment travels with the result now,
                    so the row reads as the event it was. */}
                {seasonEvents.map((ev, i) => {
                  if (!ev || !ev.feedback) return null;
                  return (
                    <RecapRow key={`event-${i}`} accent="#c084fc"
                              label={[ev.title || '📰 In the news', ev.stakes].filter(Boolean).join(' · ')}>
                      {ev.setup && (
                        <p className="text-slate-500 text-[11px] sm:text-xs leading-relaxed mb-1.5">{ev.setup}</p>
                      )}
                      <p className="text-slate-300 leading-relaxed">{ev.feedback}</p>
                      <PillRow effect={ev.effect} perks={ev.perks} flaws={ev.flaws} isGoalie={player.pos === 'G'} />
                    </RecapRow>
                  );
                })}
              </ul>

              <div className="w-full pt-6 mt-8 border-t border-[rgba(255,255,255,0.05)] flex flex-col sm:flex-row gap-4">
                <button onClick={() => advanceToOffseason()} className="btn-primary flex-1 py-4 rounded-xl text-lg sm:text-xl cursor-pointer sports-font tracking-widest shadow-2xl">
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
                               { text: '📈 Elite Coaching (+2 OVR)', ovr: 2, fanStatus: 0, money: 0, color: 'text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/30' },
                               { text: '🏟️ National Spotlight (+25 Fans)', ovr: 0, fanStatus: 25, money: 0, color: 'text-[#22E748] bg-[#22E748]/10 border-[#22E748]/30' },
                               { text: '💰 Massive NIL Deal ($100k)', ovr: 0, fanStatus: 0, money: 100000, color: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30' },
                               { text: '⚡ Run & Gun System (+1 OVR, +10 Fans)', ovr: 1, fanStatus: 10, money: 0, color: 'text-[#22E748] bg-[#22E748]/10 border-[#22E748]/30' }
                           ];

                           const possibleFlaws = [
                               { text: '⚠️ Crowded Depth Chart (-1 OVR)', ovr: -1, fanStatus: 0, money: 0 },
                               { text: '⚠️ Rebuilding Phase (-10 Fans)', ovr: 0, fanStatus: -10, money: 0 },
                               { text: '⚠️ Strict System (-5 Fans)', ovr: 0, fanStatus: -5, money: 0 }
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
                           feedback: `You signed your transfer paperwork and are officially a member of ${t.name}!`, 
                           effect: { fanStatus: t.finalFans, ovr: t.finalOvr, money: t.finalMoney }, 
                           action: 'JOIN_NCAA', 
                           actionData: t.id
                       }));

                       setActiveEvent({
                           title: 'TRANSFER PORTAL OFFERS',
                           desc: `You officially entered the transfer portal. Your former fans are furious (Fan Status -15), but several top programs have immediately reached out with scholarship and NIL offers. Weigh your options carefully.`,
                           choices: choices,
                           isPortalEvent: true
                       });
                       
                       setScreen('event');
                   }} className="bg-[#ef4444]/10 hover:bg-[#ef4444]/20 border border-[#ef4444]/40 text-[#ef4444] flex-1 py-4 rounded-xl text-lg sm:text-xl cursor-pointer sports-font tracking-widest transition-all shadow-[0_0_15px_rgba(239,68,68,0.15)] hover:shadow-[0_0_25px_rgba(239,68,68,0.25)] hover:scale-[1.02]">
                     ENTER TRANSFER PORTAL
                   </button>
                )}
              </div>
            </div>
          );
        })();
}