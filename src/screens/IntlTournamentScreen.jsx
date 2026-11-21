// International duty, played as one run on one screen.
//
// The old version moved you between four views (standings, bracket, a prep
// scenario, a minigame) for every round, and the prep scenario was the same
// handful of questions about buffet dinners whatever position you played. This
// screen never leaves: the ladder across the top fills in as you climb, the
// matchup sits under it, and the only thing you ever do is pick a play out of
// your own book while the pool gets smaller.

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useAppContext } from '../AppContext';
import { getPlaybook, PICK_PROMPT, viewFor } from '../data/intlPlaybook';
import { getMinigamePool } from '../data/minigames';
import { getStakes } from '../utils/stakes';
import { isDefence } from '../utils/production';
import {
  prepareRound, resolvePick, advanceRun, commitRun, sitsOut, resolveSat, groupTable
} from '../utils/intlRun';
import PlayCard from '../components/PlayCard';
import { intlTweets } from '../data/intlTweets';

const GAME_TYPE_TO_KEY = {
  breakaway: 'breakaway', faceoff: 'faceoff', deflect: 'deflection', shootout: 'shootout',
  onetimer: 'onetimer', crease: 'crease', block: 'shotblock', breakout: 'breakout',
  screened: 'screened', zone_battle: 'zone_battle', hit: 'hit', deke: 'deke', rebound: 'rebound'
};

const MEDAL_STYLE = {
  Gold:   { icon: '🥇', box: 'border-[#F59E0B]/60 bg-[#F59E0B]/10', text: 'text-[#F59E0B]' },
  Silver: { icon: '🥈', box: 'border-slate-300/50 bg-slate-300/10',  text: 'text-slate-200' },
  Bronze: { icon: '🥉', box: 'border-[#b45309]/60 bg-[#b45309]/10',  text: 'text-[#d97706]' }
};

const WORD = ['no', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven'];

const TITLE = { wjc: 'WORLD JUNIORS', olympics: 'WINTER OLYMPICS', worlds: 'WORLD CHAMPIONSHIP' };

// The run, as a line of games with the result written under each one.
//
// This replaces two separate progress bars that said the same thing twice. A
// game is a node on the line: filled and green behind you, open ahead of you,
// ringed and live for the one you are about to play, with the scoreline under
// the ones that have been played so there is no need for a second list to see
// how the tournament has gone.
function RunLine({ run }) {
  return (
    <div className="flex w-full items-start mt-3 mb-1 px-0.5">
      {run.rounds.map((r, i) => {
        const entry = run.road.find(e => e.key === r.key);
        const lost = entry && !entry.won;
        const won = entry && entry.won;
        const now = i === run.index && !run.finish;
        const last = i === run.rounds.length - 1;

        const dot = lost ? 'bg-[#ef4444] border-[#ef4444]'
          : won ? 'bg-[#22E748] border-[#22E748]'
            : now ? 'bg-[#101410] border-[#F59E0B] ring-2 ring-[#F59E0B]/30'
              : 'bg-[#101410] border-[rgba(255,255,255,0.18)]';

        return (
          <div key={r.key} className="flex-1 min-w-0 flex flex-col items-center relative">
            {/* the line between this game and the next */}
            {!last && (
              <span className={`absolute top-[5px] left-1/2 w-full h-[2px] ${
                won ? 'bg-[#22E748]/60' : lost ? 'bg-[#ef4444]/50' : 'bg-[rgba(255,255,255,0.10)]'
              }`} />
            )}
            <span className={`relative z-10 w-3 h-3 rounded-full border-2 transition-all ${dot} ${
              now ? 'animate-pulse' : ''
            } ${entry?.sat ? 'opacity-50' : ''}`} />
            <span className={`mt-1.5 text-[7px] sm:text-[9px] font-black uppercase tracking-widest break-words max-w-full leading-tight ${
              lost ? 'text-[#ef4444]' : won ? 'text-[#22E748]' : now ? 'text-[#F59E0B]' : 'text-slate-600'
            }`}>
              {r.short}
            </span>
            <span className={`text-[7px] sm:text-[8px] font-bold sports-font tracking-wider leading-none mt-0.5 ${
              lost ? 'text-[#ef4444]/70' : 'text-slate-500'
            }`}>
              {entry ? entry.score : now ? 'LIVE' : '·'}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function Flag({ nation, className = 'w-5 h-3.5' }) {
  if (!nation?.img) return <span className={`${className} inline-block rounded-[1px] bg-[#151b15]`} />;
  return <img src={nation.img} alt="" className={`${className} object-cover rounded-[1px] shrink-0`} />;
}

// THE GROUP TABLE.
//
// The tournament used to show one line of his own results and nothing about
// anybody else, so a group stage was three games with no table to finish in.
// Now it's the group as it stands, everybody's games included, in the order
// the IIHF ranks it, with a line where going through stops.
// The group table's places that go through, and the one that goes down, are
// shaded rows, explained by a legend under the table. Your own row is a
// deeper shade of whatever zone it's in, or blue when it's in none.
const ZONE_ROW = { through: 'bg-[#22E748]/[0.07]', promo: 'bg-[#22E748]/[0.07]', bye: 'bg-[#22E748]/[0.07]', releg: 'bg-[#ef4444]/[0.08]' };
const ZONE_ME = { through: 'bg-[#22E748]/[0.16]', promo: 'bg-[#22E748]/[0.16]', bye: 'bg-[#22E748]/[0.16]', releg: 'bg-[#ef4444]/[0.18]' };
const ZONE_KEY = { through: 'bg-[#22E748]/40', promo: 'bg-[#22E748]/40', bye: 'bg-[#22E748]/40', releg: 'bg-[#ef4444]/45' };
function GroupTable({ run, nations }) {
  const rows = groupTable(run);
  if (!rows.length) return null;
  const last = rows.length;
  const cols = ['GP', 'W', 'OTW', 'OTL', 'L', 'GD', 'PTS'];
  // Which rows are shaded: the places that go through (or skip ahead), and
  // the one that plays to stay up.
  const zoneOf = (i) => run.isOlympics ? (i === 0 ? 'bye' : null)
    : run.isTopDiv ? (i < 3 ? 'through' : i === last - 1 ? 'releg' : null)
      : (i === 0 ? 'promo' : i === last - 1 ? 'releg' : null);
  const legend = run.isOlympics ? [['bye', 'Skips the qualification playoff (nobody goes out in the group)']]
    : run.isTopDiv ? [['through', 'Through to the knockouts'], ['releg', 'Relegation game']]
      : [['promo', 'Plays for promotion'], ['releg', 'Plays to stay up']];
  return (
    <div className="mt-4 mb-1">
      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500 mb-2 px-1">Group Standings</p>
      <div className="rounded-xl border border-[rgba(255,255,255,0.06)] overflow-hidden bg-[#0a0d0a]">
        <table className="w-full text-[11px] sm:text-xs">
          <thead>
            <tr className="text-[9px] sm:text-[10px] font-black text-slate-500 border-b border-[rgba(255,255,255,0.06)]">
              <th className="w-6 py-2 pl-2 text-left font-black">#</th>
              <th className="py-2 text-left font-black">Nation</th>
              {cols.map(c => <th key={c} className={`${c === 'PTS' ? 'w-9 sm:w-11' : 'w-7 sm:w-9'} py-2 px-0.5 text-center font-black last:pr-2`}>{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const me = r.id === run.group.meId;
              const gd = r.gf - r.ga;
              const nation = (nations || []).find(n => n.id === r.id);
              return (
                <tr key={r.id} className={`${me ? (ZONE_ME[zoneOf(i)] || 'bg-[#3b82f6]/[0.12]') : (ZONE_ROW[zoneOf(i)] || '')} border-b border-[rgba(255,255,255,0.04)] last:border-0`}>
                  <td className="py-2 pl-2 text-slate-500 number-font font-black">{i + 1}</td>
                  <td className="py-2 pr-1">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <Flag nation={nation} className="w-4 h-3" />
                      <span className={`break-words ${me ? 'text-white font-black' : 'text-slate-300 font-medium'}`}>{nation?.name || r.name || r.id}</span>
                    </span>
                  </td>
                  {[r.gp, r.w, r.otw, r.otl, r.l, gd > 0 ? `+${gd}` : gd, r.pts].map((v, k) => (
                    <td key={k} className={`py-2 px-0.5 text-center number-font tabular-nums last:pr-2 ${
                      k === 6 ? (me ? 'text-white font-black' : 'text-slate-200 font-black') : 'text-slate-400'}`}>{v}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* What the shading means. */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 px-1">
        {legend.map(([z, label]) => (
          <span key={z} className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-500">
            <span className={`w-2.5 h-2.5 rounded-sm ${ZONE_KEY[z]}`} />{label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function IntlTournamentScreen() {
  const {
    BreakawayGame, BreakoutGame, CreaseGame, DeflectionGame, FaceoffGame, ShootoutGame,
    ShotBlockGame, OneTimerGame, ZoneBattleGame, ScreenedShotGame,
    OpenIceHitGame, DekeGame, ReboundGame,
    activeEvent, minigameContext, player, proceedToNextScreen, safeNationalities,
    setPlayer, setSeasonEvents, unlockAchievement
  } = useAppContext();

  const [run, setRun] = useState(player.intlRun);
  // The round in front of you: its options and which one they are sitting on.
  const [board, setBoard] = useState(() => prepareRound(player.intlRun, player));
  const [picked, setPicked] = useState(null);     // the play just chosen
  const [outcome, setOutcome] = useState(null);   // resolved result for this game
  const [lastChance, setLastChance] = useState(null); // minigame key while rescuing
  const [done, setDone] = useState(null);         // tournament summary
  const lockRef = useRef(false);

  const nat = (safeNationalities || []).find(n => n.id === player.nat);
  const countryName = nat?.sentenceName || nat?.name || 'your country';
  const book = useMemo(() => getPlaybook(player.pos), [player.pos]);
  const round = board?.round;
  const stakes = getStakes(minigameContext, round?.kind === 'knockout' ? 'SEMIFINAL' : null, round?.opponent?.tier);

  // The one ability on the screen: a timeout to get the scouting report. It is
  // the captain's call, so it is gated on the room trusting you, and it is gone
  // once the final starts, when there is nothing left to learn.
  const canTimeout =
    !run.timeoutUsed && !outcome && !done &&
    round && round.key !== 'FINAL' && round.key !== 'DECIDER' &&
    ((player.relationships?.teammates ?? 50) >= 75 || player.isCaptain || player.isAlternate);

  const finishTournament = useCallback((finishedRun) => {
    const { updatedPlayer, summary } = commitRun({
      run: finishedRun, player, safeNationalities, unlockAchievement
    });
    setPlayer(updatedPlayer);
    setSeasonEvents?.(prev => [...prev, {
      feedback: `${finishedRun.year} ${finishedRun.tournamentName}: ${summary.detail}`,
      effect: { fanStatus: summary.fanDelta, ovr: summary.ovrDelta }
    }]);
    // Keep the committed player here: leaving the tournament hands it to
    // proceedToNextScreen, and the copy in context is a render behind.
    setDone({ ...summary, run: finishedRun, committedPlayer: updatedPlayer });
  }, [player, safeNationalities, setPlayer, setSeasonEvents, unlockAchievement]);

  // Settle the game once the result is known, including a rescued knockout.
  const settle = useCallback((playId, rescued, rescueKind = null) => {
    const res = resolvePick(run, player, { playId, scoutedIds: board.scoutedIds, rescued, rescueKind });
    const advanced = advanceRun(res.nextRun, { survived: res.survived });
    // What the reporters said about it, written once, when the game ends.
    const tweets = intlTweets({
      player, entry: res.entry, countryName,
      tourney: run.tournamentName || 'tournament', totals: res.nextRun.stats
    });
    setOutcome({ ...res, advanced, tweets });
    setRun(res.nextRun);
  }, [run, player, board, countryName]);

  const handlePick = (play) => {
    if (lockRef.current || outcome) return;
    lockRef.current = true;
    setPicked(play);

    const wasRead = board.scoutedIds.includes(play.id);
    // Read in a group game costs a bad night and nothing more. Read in a
    // knockout puts the whole tournament on one more moment, played as the
    // position's own minigame: a goaltender faces the breakaway, a centre takes
    // the draw, a defenceman gets in the lane. There is one of those per
    // tournament, so spending it in the quarter-final leaves the final with no
    // net under you.
    const isDecider = ['FINAL', 'BRONZE', 'DECIDER', 'RELEG'].includes(round.key);
    if (wasRead && round.kind === 'knockout' && !run.escapeUsed && !isDecider) {
      const pool = [...new Set(
        (getMinigamePool(player.pos) || []).map(m => GAME_TYPE_TO_KEY[m.gameType]).filter(Boolean)
      )];
      setLastChance(pool.length ? pool[Math.floor(Math.random() * pool.length)] : 'zone_battle');
      lockRef.current = false;
      return;
    }
    settle(play.id, null);
    lockRef.current = false;
  };

  // A game he's out of the lineup for. Nothing to pick: he watches it.
  const sitting = !!round && !outcome && !lastChance && !done && sitsOut(run, round);

  // When a last-chance game starts, scroll as far as it takes to have all of
  // it on screen, the same as the season minigames do. The tournament draws
  // its own games and never got that, so the one-timer's button could sit
  // below the fold while the puck was already on its way.
  const lastChanceRef = useRef(null);
  useEffect(() => {
    if (!lastChance || !lastChanceRef.current) return;
    const calm = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    lastChanceRef.current.scrollIntoView({ block: 'nearest', behavior: calm ? 'auto' : 'smooth' });
  }, [lastChance]);
  const handleWatch = () => {
    if (lockRef.current || outcome) return;
    lockRef.current = true;
    const res = resolveSat(run);
    const advanced = advanceRun(res.nextRun, { survived: res.survived });
    setOutcome({ ...res, advanced });
    setRun(res.nextRun);
    lockRef.current = false;
  };
  const isG = player.pos === 'G';

  const handleLastChance = (isWin) => {
    if (lockRef.current) return;
    lockRef.current = true;
    const kind = lastChance;
    setLastChance(null);
    settle(picked.id, isWin, kind);
    lockRef.current = false;
  };

  const handleContinue = () => {
    const next = outcome.advanced;
    setOutcome(null);
    setPicked(null);
    if (next.finish) { finishTournament(next); return; }
    setRun(next);
    setBoard(prepareRound(next, player));
  };

  const handleLeave = () => {
    proceedToNextScreen(activeEvent, minigameContext, done.committedPlayer || player);
  };

  // The timeout buys you one name off the board: the staff come back with one
  // of the plays they are sitting on, not all of them.
  const useTimeout = () => {
    setRun(r => ({ ...r, timeoutUsed: true }));
    setBoard(b => ({ ...b, flagged: b.flagged || b.scoutedIds[0] }));
  };

  const mgProps = { player, difficulty: stakes.difficulty, onComplete: handleLastChance };

  return (
    <div className="game-panel p-4 sm:p-7 mt-2">
      {/* HEADER */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <Flag nation={nat} className="w-8 h-6 sm:w-10 sm:h-7" />
          <div className="min-w-0">
            <h2 className="text-xl sm:text-3xl font-black text-white sports-font tracking-tighter uppercase leading-none break-words">
              {TITLE[minigameContext] || 'WORLD CHAMPIONSHIP'}
            </h2>
            <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1 break-words">
              {nat?.name || countryName} · {run.division} · {run.year}
            </p>
            {/* The federation names its own leaders, and it is not the club's
                letter: it is who has been here before and can play. */}
            {run.letter && (
              <span className={`inline-flex items-center gap-1 mt-1.5 text-[8px] sm:text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
                run.letter === 'C'
                  ? 'text-[#F59E0B] border-[#F59E0B]/40 bg-[#F59E0B]/10'
                  : 'text-[#3b82f6] border-[#3b82f6]/40 bg-[#3b82f6]/10'
              }`}>
                {run.letter === 'C' ? 'Captain of the national team' : 'Alternate captain'}
              </span>
            )}
          </div>
        </div>
        {run.points > 0 && (
          <div className="text-right shrink-0">
            <p className="text-lg sm:text-2xl font-black sports-font text-white leading-none">{run.points}</p>
            <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-slate-500">pts</p>
          </div>
        )}
      </div>

      {/* HOW IT WORKS */}
      {/* How it works.
          This was one eighty-five word paragraph that buried four separate
          rules inside a run of prose, so the thing you needed to know before
          picking, what getting read actually costs you tonight, was the hardest
          part to find. One rule per line instead. */}
      <div className="border-y border-[rgba(255,255,255,0.065)] py-3 mb-4 space-y-1.5">
        <p className="text-[11px] sm:text-xs text-slate-300 font-sans leading-snug">
          Every game is one read: pick a play, and hope their video staff hasn't already picked it apart.
        </p>
        {/* Only the stage you are standing in.
            All four rules used to sit here at once, so a group game told you
            what happens in a medal game and a medal game told you about an
            escape that does not exist in one. The tape rule holds all
            tournament rather than belonging to a stage, so it stays. */}
        {(() => {
          const medal = ['FINAL', 'BRONZE'].includes(round?.key);
          const decider = ['DECIDER', 'RELEG'].includes(round?.key);
          const stage = !round ? null
            : round.kind === 'group'
              ? ['This game', run.isOlympics
                  ? 'A group game. Nobody goes out in the group, but the winner skips the qualification playoff.'
                  : run.isTopDiv
                    ? 'A group game. The top three go through, and last place plays a relegation game.'
                    : 'A group game. Win the group to play for promotion. Finish last and you play to stay up.']
              : decider
                ? ['This game', `${round.label}. Get read and it's over, and there's no escape in one of these.`]
              : medal
                ? ['This game', 'A medal game. Get read and it\'s over, and there\'s no escape in one of these.']
                : ['This game', run?.escapeUsed
                    ? 'A knockout. Get read and you\'re out, and your escape is already spent.'
                    : 'A knockout. Get read and you\'re out, unless you spend your one escape.'];
          return [
            stage,
            round?.kind === 'group' ? ['Points', '3 for a win, 2 for a win in overtime, 1 for a loss in overtime, none for a loss in regulation.'] : null,
            ['On tape', 'Every play you run gets watched. They look there first next time.']
          ].filter(Boolean);
        })().map(([term, rule]) => (
          <p key={term} className="flex gap-2 text-[11px] sm:text-xs text-slate-400 font-sans leading-snug">
            <span className="shrink-0 w-[72px] sm:w-[84px] font-black uppercase tracking-widest text-[9px] sm:text-[10px] text-slate-500 pt-px">
              {term}
            </span>
            <span>{rule}</span>
          </p>
        ))}
      </div>

      <RunLine run={run} />

      {/* The group, while it's being played and for the game that comes out
          of it. */}
      {!done && run.group && (round?.kind === 'group' || outcome?.entry?.kind === 'group'
        || ['RELEG', 'DECIDER'].includes(round?.key)) && (
        <GroupTable run={run} nations={safeNationalities} />
      )}

      {/* TOURNAMENT OVER */}
      {done ? (
        <div className="max-w-xl mx-auto mt-6 fade-up text-center">
          <div className={`rounded-2xl border-2 p-6 sm:p-8 ${
            done.medal ? MEDAL_STYLE[done.medal].box : 'border-[rgba(255,255,255,0.1)] bg-[#101410]'
          }`}>
            {done.medal && <div className="text-5xl mb-3">{MEDAL_STYLE[done.medal].icon}</div>}
            <h3 className={`text-2xl sm:text-4xl font-black sports-font uppercase tracking-tighter mb-3 ${
              done.medal ? MEDAL_STYLE[done.medal].text : 'text-white'
            }`}>
              {done.headline}
            </h3>
            <p className="text-sm sm:text-base text-slate-300 font-sans leading-relaxed mb-5">{done.detail}</p>

            <div className="flex justify-center gap-2 flex-wrap text-[10px] sm:text-xs font-black sports-font tracking-widest">
              <span className="px-3 py-1.5 rounded-lg border border-[rgba(255,255,255,0.1)] text-slate-300">
                {done.stats.games} GP
              </span>
              {player.pos === 'G' ? (
                /* A save percentage says how he played and a goals average
                   says what it cost, and a short tournament is decided on the
                   second one: three goals against across five games wins a
                   gold medal and .915 does not tell you that happened. */
                <span className="px-3 py-1.5 rounded-lg border border-[rgba(255,255,255,0.1)] text-slate-300">
                  {done.stats.shots ? (done.stats.saves / done.stats.shots).toFixed(3).replace('0.', '.') : '.000'} SV%
                  {done.stats.games > 0 && ` · ${(((done.stats.shots || 0) - (done.stats.saves || 0)) / done.stats.games).toFixed(2)} GAA`}
                  {done.stats.sho > 0 && ` · ${done.stats.sho} SO`}
                </span>
              ) : isDefence(player.pos) ? (
                /* A goalie's tournament was reported in his own numbers and a
                   defenceman's in a forward's. The run simulates his plus-minus
                   game by game and it was never shown to him anywhere. */
                <span className="px-3 py-1.5 rounded-lg border border-[rgba(255,255,255,0.1)] text-slate-300">
                  {done.stats.g + done.stats.a} PTS · {done.stats.blk || 0} BLK
                </span>
              ) : (
                <span className="px-3 py-1.5 rounded-lg border border-[rgba(255,255,255,0.1)] text-slate-300">
                  {done.stats.g}G {done.stats.a}A · {done.stats.g + done.stats.a} PTS
                </span>
              )}
              <span className={`px-3 py-1.5 rounded-lg border ${
                done.fanDelta >= 0
                  ? 'text-[#22E748] bg-[#22E748]/10 border-[#22E748]/30'
                  : 'text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]/30'
              }`}>
                {done.fanDelta > 0 ? '+' : ''}{done.fanDelta} FANS
              </span>
              {done.ovrDelta > 0 && (
                <span className="px-3 py-1.5 rounded-lg border text-[#22E748] bg-[#22E748]/10 border-[#22E748]/30">
                  +{done.ovrDelta} OVR
                </span>
              )}
            </div>
          </div>
          <button onClick={handleLeave} className="btn-primary w-full py-4 rounded-xl mt-5 sports-font tracking-widest text-base sm:text-lg cursor-pointer">
            LEAVE THE TOURNAMENT
          </button>
        </div>
      ) : (
        <>
          {/* THE MATCHUP */}
          {/* NAMED CAPTAIN.
              The badge beside the tournament title said he wore a letter and
              nothing ever said he had been given one, so the single moment a
              federation picks you out of the room passed without a word. */}
          {run.letterIsNew && (
            <div className={`rounded-xl border px-4 py-3 mt-3 fade-up ${
              run.letter === 'C'
                ? 'border-[#F59E0B]/40 bg-[#F59E0B]/[0.07]'
                : 'border-[#3b82f6]/40 bg-[#3b82f6]/[0.07]'}`}>
              <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${
                run.letter === 'C' ? 'text-[#F59E0B]' : 'text-[#3b82f6]'}`}>
                {run.letter === 'C' ? 'Named captain' : 'Named an alternate'}
              </p>
              <p className="text-xs sm:text-sm text-slate-300 font-sans mt-1 leading-snug">
                {run.letter === 'C'
                  ? `The federation has given you the C. You lead ${countryName} at this tournament.`
                  : `The federation has given you an A. You're part of the leadership group for ${countryName}.`}
              </p>
            </div>
          )}

          {/* Where he stands on this roster, said once, before the first game. */}
          {run.depth && !run.promoted && run.road.length === 0 && !outcome && (
            <div className="rounded-xl border border-[rgba(255,255,255,0.1)] bg-[#101410] px-4 py-3 mt-3 fade-up">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                {isG ? 'The backup goalie' : 'The extra man'}
              </p>
              <p className="text-xs sm:text-sm text-slate-300 font-sans mt-1 leading-snug">
                {isG
                  ? `You made the team as ${countryName}${countryName.endsWith('s') ? "'" : "'s"} backup. The starter has the net, and you'll get one group game.`
                  : `You made the team as the extra ${isDefence(player.pos) ? 'defenceman' : 'forward'}, so you'll sit out some of the group games.`}
              </p>
            </div>
          )}

          {/* The matchup owns the gap under itself, so everything that can
              follow it sits the same distance away. The three branches below
              each carried their own top margin and one of them carried none, so
              the verdict text came up hard against this box. */}
          <div className="bg-[#101410] border border-[rgba(255,255,255,0.065)] rounded-xl px-4 py-3 mt-3 mb-6 sm:mb-8 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-[#3b82f6] mb-1">
                {round?.label}
              </p>
              <div className="flex items-center gap-2 min-w-0">
                <Flag nation={nat} />
                <span className="text-sm sm:text-lg font-black text-white sports-font uppercase break-words">
                  {nat?.id || player.nat}
                </span>
                <span className="text-[10px] font-black text-slate-600 uppercase">vs</span>
                <Flag nation={round?.opponent} />
                <span className="text-sm sm:text-lg font-black text-slate-300 sports-font uppercase break-words">
                  {round?.opponent?.name || round?.opponent?.id}
                </span>
              </div>
            </div>
            <span className={`shrink-0 text-[8px] sm:text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded border ${
              round?.kind === 'knockout'
                ? 'text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]/30'
                : 'text-slate-400 bg-[#151b15] border-[rgba(255,255,255,0.08)]'
            }`}>
              {round?.kind === 'knockout' ? 'Win or go home' : 'Group'}
            </span>
          </div>

          {/* LAST CHANCE */}
          {lastChance ? (
            <div className="max-w-2xl mx-auto fade-up">
              <div className="text-center mb-4">
                <p className="text-sm sm:text-base font-black uppercase tracking-widest text-[#ef4444] sports-font">
                  They read it
                </p>
                <p className="text-xs sm:text-sm text-slate-400 font-sans mt-1">
                  {round.label} and your play went nowhere. One moment left to save the tournament.
                </p>
              </div>
              <div ref={lastChanceRef} className="bg-[#101410] border border-[#ef4444]/40 p-4 sm:p-6 rounded-xl shadow-2xl scroll-mt-3">
                {lastChance === 'breakaway' && <BreakawayGame {...mgProps} />}
                {lastChance === 'faceoff' && <FaceoffGame {...mgProps} />}
                {lastChance === 'deflection' && <DeflectionGame {...mgProps} />}
                {lastChance === 'shootout' && <ShootoutGame {...mgProps} />}
                {lastChance === 'onetimer' && <OneTimerGame {...mgProps} />}
                {lastChance === 'crease' && <CreaseGame {...mgProps} />}
                {lastChance === 'shotblock' && <ShotBlockGame {...mgProps} />}
                {lastChance === 'breakout' && <BreakoutGame {...mgProps} />}
                {lastChance === 'screened' && <ScreenedShotGame {...mgProps} />}
                {lastChance === 'zone_battle' && <ZoneBattleGame {...mgProps} />}
                {lastChance === 'hit' && <OpenIceHitGame {...mgProps} />}
                {lastChance === 'deke' && <DekeGame {...mgProps} />}
                {lastChance === 'rebound' && <ReboundGame {...mgProps} />}
              </div>
            </div>
          ) : outcome ? (
            /* THE RESULT OF THIS GAME */
            <div className="max-w-xl mx-auto fade-up text-center">
              <div className={`rounded-xl border-2 p-5 sm:p-6 ${
                outcome.survived ? 'border-[#22E748]/50 bg-[#22E748]/[0.06]' : 'border-[#ef4444]/50 bg-[#ef4444]/[0.06]'
              }`}>
                <p className={`text-xl sm:text-3xl font-black sports-font uppercase tracking-tighter ${
                  outcome.survived ? 'text-[#22E748]' : 'text-[#ef4444]'
                }`}>
                  {outcome.entry.score} {outcome.survived ? 'WIN' : 'LOSS'}
                </p>
                <p className="text-xs sm:text-sm text-slate-300 font-sans mt-2 leading-relaxed">
                  {outcome.sat
                    ? (outcome.survived
                      ? (isG ? 'The starter got it done, and you watched it from the end of the bench.' : 'They won it without you. You watched from the press box.')
                      : outcome.advanced.finish
                        ? (isG ? 'You watched from the bench as the tournament ended.' : 'You watched from the press box as the tournament ended.')
                        : (isG ? "They lost, and the coach found you after the game. You're starting the next one." : "They lost, and you're back in the lineup for the next one."))
                  : outcome.clean
                    ? `${picked.name} worked. They had no answer for it all night.`
                    : outcome.entry.rescued
                      ? `They had ${picked.name.toLowerCase()} scouted and took it away, and you dragged the game out of the fire anyway.`
                      : `They had ${picked.name.toLowerCase()} scouted. Every time you went to it there were two of them waiting.`}
                  {/* A big night in a game he was only in for. */}
                  {outcome.earnedSpot && !outcome.advanced.finish && (isG
                    ? " The coaches liked what they saw, and the net is yours for the next one."
                    : ` ${outcome.entry.line.g + outcome.entry.line.a} points tonight, and the coach told you after the game that you're in the lineup for the next one.`)}
                </p>
                <div className="flex justify-center gap-2 flex-wrap mt-4 text-[10px] font-black sports-font tracking-widest">
                  {outcome.sat ? (
                    <span className="px-2.5 py-1 rounded border border-[rgba(255,255,255,0.1)] text-slate-400">
                      Didn't play
                    </span>
                  ) : player.pos === 'G' ? (
                    <span className="px-2.5 py-1 rounded border border-[rgba(255,255,255,0.1)] text-slate-300">
                      {outcome.entry.line.saves}/{outcome.entry.line.shots} SAVES
                      {' · '}{Math.max(0, (outcome.entry.line.shots || 0) - (outcome.entry.line.saves || 0))} GA
                    </span>
                  ) : isDefence(player.pos) ? (
                    <span className="px-2.5 py-1 rounded border border-[rgba(255,255,255,0.1)] text-slate-300">
                      {outcome.entry.line.g}G {outcome.entry.line.a}A · {outcome.entry.line.blk || 0} BLK
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded border border-[rgba(255,255,255,0.1)] text-slate-300">
                      {outcome.entry.line.g}G {outcome.entry.line.a}A
                    </span>
                  )}
                  {outcome.entry.line?.soWinner && (
                    <span className="px-2.5 py-1 rounded border border-[#F59E0B]/40 bg-[#F59E0B]/10 text-[#F59E0B]">
                      SHOOTOUT WINNER
                    </span>
                  )}
                  {outcome.entry.pts > 0 && (
                    <span className="px-2.5 py-1 rounded border border-[#22E748]/30 bg-[#22E748]/10 text-[#22E748]">
                      +{outcome.entry.pts} PTS
                    </span>
                  )}
                </div>
              </div>
              {/* WHAT THEY'RE SAYING. The reporters' posts on the game, his
                  night first. Left-aligned like a feed, because that's what
                  it is. */}
              {!outcome.sat && outcome.tweets?.length > 0 && (
                <div className="mt-3 flex flex-col gap-2 text-left">
                  {outcome.tweets.map((t, i) => (
                    <div key={i} className="flex gap-3 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#101410] p-3">
                      <div className="w-8 h-8 shrink-0 rounded-full bg-[rgba(255,255,255,0.08)] flex items-center justify-center text-[11px] font-black text-slate-300 sports-font">
                        {t.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs leading-tight">
                          <span className="font-bold text-white">{t.name}</span>{' '}
                          <span className="text-slate-500 break-all">{t.handle}</span>
                        </p>
                        <p className="text-xs sm:text-sm text-slate-300 font-sans mt-1 leading-snug break-words">{t.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={handleContinue} className="btn-primary w-full py-3.5 rounded-xl mt-4 sports-font tracking-widest cursor-pointer">
                {outcome.advanced.finish ? 'SEE HOW IT ENDED' : 'NEXT GAME'}
              </button>
            </div>
          ) : sitting ? (
            /* OUT OF THE LINEUP */
            <div className="max-w-xl mx-auto fade-up text-center">
              <div className="rounded-xl border border-[rgba(255,255,255,0.1)] bg-[#101410] p-5 sm:p-6">
                <p className="text-lg sm:text-2xl font-black sports-font uppercase tracking-tight text-slate-200">
                  {isG ? "You're the backup tonight" : "You're scratched tonight"}
                </p>
                <p className="text-xs sm:text-sm text-slate-400 font-sans mt-2 leading-relaxed">
                  {isG
                    ? (round.kind === 'knockout'
                      ? 'The starter has the net for the knockout games. You open the door at the end of the bench and wait for your chance.'
                      : 'The coaches went with the starter. You get a group game of your own, and a loss here would be your way in.')
                    : "You're the extra man on this roster, and tonight you watch from the press box. If they lose, you're the first one back in."}
                </p>
              </div>
              <button onClick={handleWatch} className="btn-primary w-full py-3.5 rounded-xl mt-4 sports-font tracking-widest cursor-pointer">
                WATCH THE GAME
              </button>
            </div>
          ) : (
            /* THE BOARD */
            <>
              <div className="text-center mb-3">
                <p className="text-sm sm:text-base font-black uppercase tracking-widest text-white sports-font">
                  {PICK_PROMPT[player.pos] || 'Pick the play.'}
                </p>
                <p className="text-[11px] sm:text-xs text-slate-500 font-sans mt-1.5">
                  {board.scoutedIds.length === 1
                    ? 'One of these nine is in their pre-scout. Pick it and the night is gone.'
                    : `${WORD[board.scoutedIds.length] || board.scoutedIds.length} of these nine are in their pre-scout.`}
                </p>
                {/* What the lines mean, because a diagram with four kinds of
                    arrow on it needs saying once. */}
                {run.seesFavourite && (
                  <p className="text-[10px] sm:text-[11px] text-[#38bdf8] font-sans mt-1.5">
                    This group has run one of these a thousand times together. It doesn't matter if they know it's coming.
                  </p>
                )}
                <div className="flex items-center justify-center gap-3 mt-2 flex-wrap text-[8px] sm:text-[9px] font-black uppercase tracking-widest">
                  <span className="flex items-center gap-1 text-[#22E748]"><span className="w-4 h-[2px] bg-[#22E748] inline-block rounded" />Skating</span>
                  <span className="flex items-center gap-1 text-[#60a5fa]"><span className="w-4 border-t-2 border-dashed border-[#60a5fa] inline-block" />Pass</span>
                  <span className="flex items-center gap-1 text-[#fbbf24]"><span className="inline-block">∿∿</span>Shot</span>
                </div>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
                {board.options.map(play => (
                  <PlayCard
                    key={play.id}
                    play={play}
                    state={
                      (run.seesFavourite && run.favourite === play.id) ? 'favourite'
                        : board.flagged === play.id ? 'flagged'
                          : run.usedPlays.includes(play.id) ? 'tape'
                            : 'open'
                    }
                    onPick={handlePick}
                    myLabel={player.pos}
                    view={viewFor(player.pos)}
                  />
                ))}
              </div>

              {/* WHAT YOU ARE CARRYING */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="bg-[#101410] border border-[rgba(255,255,255,0.065)] rounded-xl p-3">
                <p className="text-[9px] font-black uppercase tracking-widest text-[#F59E0B] mb-2">Call a timeout</p>
                <button
                  onClick={useTimeout}
                  disabled={!canTimeout}
                  className={`w-full py-2.5 rounded-lg font-black sports-font tracking-widest text-[11px] sm:text-xs uppercase transition-all ${
                    canTimeout
                      ? 'btn-secondary cursor-pointer'
                      : 'bg-[#151b15] border border-[rgba(255,255,255,0.06)] text-slate-600'
                  }`}
                >
                  {run.timeoutUsed ? 'Timeout spent' : 'Get the scouting report'}
                </button>
                <p className="text-[9px] text-slate-500 font-sans mt-2 leading-snug">
                  Shows you one of the plays they have scouted. Needs the room behind you: 75 teammate trust, or a letter.
                  One per tournament, and not in the final.
                </p>
              </div>

              {/* Not a button, and it should not look like one: nothing here is
                  pressed, it is a thing you are carrying until a knockout game
                  takes it off you. */}
              <div className="rounded-xl p-3 border bg-[#101410] border-[rgba(255,255,255,0.065)]">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                    Your escape
                  </p>
                  <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                    run.escapeUsed
                      ? 'text-slate-600 border-[rgba(255,255,255,0.08)] bg-[#151b15]'
                      : 'text-[#22E748] border-[#22E748]/40 bg-[#22E748]/10'
                  }`}>
                    {run.escapeUsed ? 'Already spent' : 'Still have it'}
                  </span>
                </div>
                <p className="text-[9px] text-slate-500 font-sans leading-snug">
                  The first time a knockout game gets read, it comes down to one moment you play yourself. It
                  happens on its own, there is nothing to press, there is no second one, and it does not exist
                  in a medal game.
                </p>
              </div>
              </div>
            </>
          )}

        </>
      )}

          {/* THE ROAD */}
          {run.road.length > 0 && (
            <div className="mt-5">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">The road and what's on tape</p>
              <div className="flex flex-col gap-1">
                {run.road.map((r, i) => (
                  <div key={`${r.key}-${i}`} className="flex items-center gap-2 bg-[#101410] border border-[rgba(255,255,255,0.065)] rounded-lg px-2.5 py-1.5">
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 w-10 sm:w-14 shrink-0">{r.short}</span>
                    <Flag nation={r.opponent} className="w-4 h-3" />
                    <span className="text-[10px] sm:text-xs font-bold text-slate-300 break-words min-w-0">{r.opponent?.name || r.opponent?.id}</span>
                    {(() => { const p = book.find(x => x.id === r.playId); return p ? (
                      <span title="On tape: they'll look for this play next time" className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded border border-[rgba(255,255,255,0.1)] bg-[#151b15] text-slate-400 whitespace-nowrap">{p.name}</span>
                    ) : null; })()}
                    <span className={`ml-auto shrink-0 text-[9px] sm:text-[10px] font-black sports-font px-2 py-0.5 rounded border ${
                      r.won ? 'text-[#22E748] bg-[#22E748]/10 border-[#22E748]/30' : 'text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]/30'
                    }`}>
                      {r.score} {r.won ? (r.rescued ? '◆' : '✔') : '✕'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
    </div>
  );
}
