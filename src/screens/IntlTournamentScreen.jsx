// International duty, played as one run on one screen.
//
// The old version moved you between four views (standings, bracket, a prep
// scenario, a minigame) for every round, and the prep scenario was the same
// handful of questions about buffet dinners whatever position you played. This
// screen never leaves: the ladder across the top fills in as you climb, the
// matchup sits under it, and the only thing you ever do is pick a play out of
// your own book while the pool gets smaller.

import { useState, useMemo, useRef, useCallback } from 'react';
import { useAppContext } from '../AppContext';
import { getPlaybook, PICK_PROMPT, viewFor } from '../data/intlPlaybook';
import { getMinigamePool } from '../data/minigames';
import { getStakes } from '../utils/stakes';
import {
  prepareRound, resolvePick, advanceRun, commitRun, PTS_TO_ADVANCE
} from '../utils/intlRun';
import PlayCard from '../components/PlayCard';

const GAME_TYPE_TO_KEY = {
  breakaway: 'breakaway', faceoff: 'faceoff', deflect: 'deflection', shootout: 'shootout',
  onetimer: 'onetimer', crease: 'crease', block: 'shotblock', breakout: 'breakout',
  screened: 'screened', zone_battle: 'zone_battle'
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
            }`} />
            <span className={`mt-1.5 text-[7px] sm:text-[9px] font-black uppercase tracking-widest truncate max-w-full ${
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
  if (!nation?.img) return <span className={`${className} inline-block rounded-[1px] bg-[#1a2230]`} />;
  return <img src={nation.img} alt="" className={`${className} object-cover rounded-[1px] shrink-0`} />;
}

export default function IntlTournamentScreen() {
  const {
    BreakawayGame, BreakoutGame, CreaseGame, DeflectionGame, FaceoffGame, ShootoutGame,
    ShotBlockGame, OneTimerGame, ZoneBattleGame, ScreenedShotGame,
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
    ((player.relationships?.teammates || 50) >= 75 || player.isCaptain || player.isAlternate);

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
  const settle = useCallback((playId, rescued) => {
    const res = resolvePick(run, player, { playId, scoutedIds: board.scoutedIds, rescued });
    const advanced = advanceRun(res.nextRun, { survived: res.survived });
    setOutcome({ ...res, advanced });
    setRun(res.nextRun);
  }, [run, player, board]);

  const handlePick = (play) => {
    if (lockRef.current || outcome) return;
    lockRef.current = true;
    setPicked(play);

    const wasRead = board.scoutedIds.includes(play.id);
    // Read in a group game is a bad night and nothing more. Read in a knockout
    // puts the whole tournament on one more moment, and that moment is the
    // position's own minigame: a goaltender faces the breakaway, a centre takes
    // the draw, a defenceman gets in the lane. You get one of those a
    // tournament. Spend it in the quarter-final and the final is played without
    // a net under you.
    const isDecider = round.key === 'FINAL' || round.key === 'BRONZE' || round.key === 'DECIDER';
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

  const handleLastChance = (isWin) => {
    if (lockRef.current) return;
    lockRef.current = true;
    setLastChance(null);
    settle(picked.id, isWin);
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
    <div className="game-panel p-4 sm:p-7 mt-2 border-t-2 border-t-[#F59E0B]">
      {/* HEADER */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <Flag nation={nat} className="w-8 h-6 sm:w-10 sm:h-7" />
          <div className="min-w-0">
            <h2 className="text-xl sm:text-3xl font-black text-[#F59E0B] sports-font tracking-tighter uppercase leading-none truncate">
              {TITLE[minigameContext] || 'WORLD CHAMPIONSHIP'}
            </h2>
            <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1 truncate">
              {countryName} · {run.division} · {run.year}
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
      <p className="text-[11px] sm:text-xs text-slate-400 font-sans leading-relaxed border-y border-[rgba(255,255,255,0.065)] py-3 mb-4">
        Every game is one read. Pick a play out of your book, and hope it is not one their video staff
        has already picked apart. In the <strong className="text-slate-200">group</strong> you are banking points, and you need{' '}
        <strong className="text-slate-200">{PTS_TO_ADVANCE}</strong> to get out. In the{' '}
        <strong className="text-slate-200">knockouts</strong> getting read ends it, unless you still have your one
        escape, which turns that game into a single moment you have to win yourself. There is no escape in a medal
        game. Anything you have already used goes <strong className="text-slate-200">on tape</strong>, they look
        there first, and by the end there is little left on the board they have not watched you run.
      </p>

      <RunLine run={run} />

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
                <span className="px-3 py-1.5 rounded-lg border border-[rgba(255,255,255,0.1)] text-slate-300">
                  {done.stats.shots ? (done.stats.saves / done.stats.shots).toFixed(3).replace('0.', '.') : '.000'} SV%
                  {done.stats.sho > 0 && ` · ${done.stats.sho} SO`}
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
            LEAVE THE TOURNAMENT ➔
          </button>
        </div>
      ) : (
        <>
          {/* THE MATCHUP */}
          <div className="bg-[#101410] border border-[rgba(255,255,255,0.065)] rounded-xl px-4 py-3 mt-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-[#3b82f6] mb-1">
                {round?.label}
              </p>
              <div className="flex items-center gap-2 min-w-0">
                <Flag nation={nat} />
                <span className="text-sm sm:text-lg font-black text-white sports-font uppercase truncate">
                  {nat?.id || player.nat}
                </span>
                <span className="text-[10px] font-black text-slate-600 uppercase">vs</span>
                <Flag nation={round?.opponent} />
                <span className="text-sm sm:text-lg font-black text-slate-300 sports-font uppercase truncate">
                  {round?.opponent?.name || round?.opponent?.id}
                </span>
              </div>
            </div>
            <span className={`shrink-0 text-[8px] sm:text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded border ${
              round?.kind === 'knockout'
                ? 'text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]/30'
                : 'text-slate-400 bg-[#1a2230] border-[rgba(255,255,255,0.08)]'
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
              <div className="bg-[#101410] border border-[#ef4444]/40 p-4 sm:p-6 rounded-xl shadow-2xl">
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
              </div>
            </div>
          ) : outcome ? (
            /* THE RESULT OF THIS GAME */
            <div className="max-w-xl mx-auto fade-up text-center mt-6 sm:mt-8">
              <div className={`rounded-xl border-2 p-5 sm:p-6 ${
                outcome.survived ? 'border-[#22E748]/50 bg-[#22E748]/[0.06]' : 'border-[#ef4444]/50 bg-[#ef4444]/[0.06]'
              }`}>
                <p className={`text-xl sm:text-3xl font-black sports-font uppercase tracking-tighter ${
                  outcome.survived ? 'text-[#22E748]' : 'text-[#ef4444]'
                }`}>
                  {outcome.entry.score} {outcome.survived ? 'WIN' : 'LOSS'}
                </p>
                <p className="text-xs sm:text-sm text-slate-300 font-sans mt-2 leading-relaxed">
                  {outcome.clean
                    ? `${picked.name} worked. They had no answer for it all night.`
                    : outcome.entry.rescued
                      ? `They had ${picked.name.toLowerCase()} scouted and took it away, and you dragged the game out of the fire anyway.`
                      : `They had ${picked.name.toLowerCase()} scouted. Every time you went to it there were two of them waiting.`}
                </p>
                <div className="flex justify-center gap-2 flex-wrap mt-4 text-[10px] font-black sports-font tracking-widest">
                  {player.pos === 'G' ? (
                    <span className="px-2.5 py-1 rounded border border-[rgba(255,255,255,0.1)] text-slate-300">
                      {outcome.entry.line.saves}/{outcome.entry.line.shots} SAVES
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded border border-[rgba(255,255,255,0.1)] text-slate-300">
                      {outcome.entry.line.g}G {outcome.entry.line.a}A
                    </span>
                  )}
                  {outcome.entry.pts > 0 && (
                    <span className="px-2.5 py-1 rounded border border-[#22E748]/30 bg-[#22E748]/10 text-[#22E748]">
                      +{outcome.entry.pts} PTS
                    </span>
                  )}
                </div>
              </div>
              <button onClick={handleContinue} className="btn-primary w-full py-3.5 rounded-xl mt-4 sports-font tracking-widest cursor-pointer">
                {outcome.advanced.finish ? 'SEE HOW IT ENDED ➔' : 'NEXT GAME ➔'}
              </button>
            </div>
          ) : (
            /* THE BOARD */
            <>
              <div className="text-center mt-4 mb-3">
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
                    This group has run one of these a thousand times together. It does not matter if they know it is coming.
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
                <p className="text-[9px] font-black uppercase tracking-widest text-[#F59E0B] mb-2">⏱️ Call a timeout</p>
                <button
                  onClick={useTimeout}
                  disabled={!canTimeout}
                  className={`w-full py-2.5 rounded-lg font-black sports-font tracking-widest text-[11px] sm:text-xs uppercase transition-all ${
                    canTimeout
                      ? 'bg-[#F59E0B]/10 border border-[#F59E0B]/40 text-[#F59E0B] hover:bg-[#F59E0B]/20 cursor-pointer'
                      : 'bg-[#1a2230] border border-[rgba(255,255,255,0.06)] text-slate-600'
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
                      ? 'text-slate-600 border-[rgba(255,255,255,0.08)] bg-[#1a2230]'
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

          {/* WHAT THEY HAVE SEEN */}
          {run.usedPlays.length > 0 && !done && (
            <div className="mt-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">On tape</p>
              <div className="flex flex-wrap gap-1.5">
                {run.usedPlays.map(id => {
                  const p = book.find(x => x.id === id);
                  return p ? (
                    <span key={id} className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded border border-[rgba(255,255,255,0.1)] bg-[#1a2230] text-slate-400">
                      {p.name}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </>
      )}

          {/* THE ROAD */}
          {run.road.length > 0 && (
            <div className="mt-5">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">The road</p>
              <div className="flex flex-col gap-1">
                {run.road.map((r, i) => (
                  <div key={`${r.key}-${i}`} className="flex items-center gap-2 bg-[#101410] border border-[rgba(255,255,255,0.065)] rounded-lg px-2.5 py-1.5">
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 w-10 sm:w-14 shrink-0">{r.short}</span>
                    <Flag nation={r.opponent} className="w-4 h-3" />
                    <span className="text-[10px] sm:text-xs font-bold text-slate-300 truncate min-w-0">{r.opponent?.name || r.opponent?.id}</span>
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
