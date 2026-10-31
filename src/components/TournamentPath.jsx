// A single-elimination run shown as the road you actually walked.
//
// The nine-card grid is the right picture of a best-of-seven: you turn cards
// over one at a time and the series is the sum of them. It is the wrong picture
// of a tournament where every round is one game, because then the grid holds a
// single card and the whole thing becomes hunting one W in a field of greyed
// out squares that were never yours to play.
//
// Here each square is a round, and what it holds is a result. Rounds you have
// not reached are question marks, the one you are on is live and waiting to be
// played, and the ones behind you keep their scoreline so the run reads left to
// right as a story. The road underneath lists it again in full, because by the
// national championship nobody remembers who they beat in the regional.
import TeamLogo from './TeamLogo';
import { getFullTeamName } from '../utils/appHelpers';
import { getPlayoffRounds } from '../data/teams';

const WON = 'won';
const LOST = 'lost';

export default function TournamentPath({ playoffs, onPlay, canPlay = true }) {
  const rounds = getPlayoffRounds(playoffs.currentLg) || [];
  const myId = playoffs.currentTeamId;

  // The player's own match in each round, if they ever got that far.
  const path = rounds.map((round, rIdx) => {
    const match = (playoffs.bracket?.[rIdx] || []).find(m => m.isPlayerSeries) || null;
    if (!match) return { round, rIdx, match: null, state: 'locked' };

    const meIsT1 = (match.team1?.id || match.team1) === myId;
    const opponent = meIsT1 ? match.team2 : match.team1;
    const myScore = meIsT1 ? match.score1 : match.score2;
    const oppScore = meIsT1 ? match.score2 : match.score1;

    const state = match.status === WON ? WON
      : match.status === LOST ? LOST
        : match.status === 'playing' ? 'live'
          : 'locked';

    return { round, rIdx, match, opponent, myScore, oppScore, state, ot: match.ot };
  });

  const isLive = (step) => step.state === 'live' && step.rIdx === playoffs.activeRoundIndex;
  const played = path.filter(s => s.state === WON || s.state === LOST);

  const cellClass = (step) => {
    const base = 'relative h-20 sm:h-24 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all duration-200 ';
    if (step.state === WON) return base + 'bg-[#22E748]/15 border-[#22E748] shadow-[0_0_12px_rgba(34,231,72,0.25)]';
    if (step.state === LOST) return base + 'bg-[#ef4444]/15 border-[#ef4444] shadow-[0_0_12px_rgba(239,68,68,0.25)]';
    if (isLive(step) && canPlay) return base + 'bg-[#1a2230] border-[#3b82f6] shadow-[0_0_18px_rgba(59,130,246,0.35)] animate-pulse cursor-pointer hover:scale-105 active:scale-95';
    return base + 'bg-[#101410] border-[rgba(255,255,255,0.08)]';
  };

  return (
    <div className="w-full">
      {/* The ladder of rounds, filled in behind you. */}
      <div className="flex gap-1 mb-2">
        {path.map(step => (
          <div
            key={`bar-${step.rIdx}`}
            className={`flex-1 h-[3px] rounded-full ${
              step.state === WON ? 'bg-[#22E748]'
                : step.state === LOST ? 'bg-[#ef4444]'
                  : isLive(step) ? 'bg-[#3b82f6]'
                    : 'bg-[#232d3f]'}`}
          />
        ))}
      </div>
      <div className="flex gap-1 mb-3">
        {path.map(step => (
          <p
            key={`lbl-${step.rIdx}`}
            className={`flex-1 text-center text-[7px] sm:text-[9px] font-black uppercase tracking-widest leading-none truncate ${
              step.state === WON ? 'text-[#22E748]'
                : step.state === LOST ? 'text-[#ef4444]'
                  : isLive(step) ? 'text-[#3b82f6]'
                    : 'text-slate-600'}`}
          >
            {step.round.short || step.round.name}
          </p>
        ))}
      </div>

      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${path.length}, minmax(0, 1fr))` }}>
        {path.map(step => {
          const live = isLive(step);
          const done = step.state === WON || step.state === LOST;
          const Tag = live && canPlay ? 'button' : 'div';
          return (
            <Tag
              key={`cell-${step.rIdx}`}
              className={cellClass(step)}
              {...(live && canPlay ? { onClick: () => onPlay(step.rIdx), type: 'button' } : {})}
            >
              {done ? (
                <>
                  <span className={`sports-font font-black text-xl sm:text-2xl leading-none ${step.state === WON ? 'text-[#22E748]' : 'text-[#ef4444]'}`}>
                    {step.myScore ?? 0}-{step.oppScore ?? 0}
                  </span>
                  {step.ot && (
                    <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-slate-400 leading-none">OT</span>
                  )}
                  <div className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                    <TeamLogo teamId={step.opponent?.id || step.opponent} league={playoffs.currentLg} size="tiny" />
                  </div>
                </>
              ) : live ? (
                <>
                  <span className="text-2xl sm:text-3xl font-black text-white sports-font leading-none">?</span>
                  <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-[#3b82f6] leading-none">Play</span>
                </>
              ) : (
                <span className="text-2xl sm:text-3xl font-black text-slate-700 sports-font leading-none">?</span>
              )}
            </Tag>
          );
        })}
      </div>

      {played.length > 0 && (
        <div className="mt-5">
          <p className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 text-left">
            The road
          </p>
          <div className="flex flex-col gap-1">
            {played.map(step => (
              <div
                key={`road-${step.rIdx}`}
                className="flex items-center gap-2 bg-[#101410] border border-[rgba(255,255,255,0.065)] rounded-lg px-2 py-1.5"
              >
                <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-slate-500 w-14 sm:w-20 shrink-0 text-left truncate">
                  {step.round.short || step.round.name}
                </span>
                <div className="w-4 h-4 shrink-0 flex items-center justify-center">
                  <TeamLogo teamId={step.opponent?.id || step.opponent} league={playoffs.currentLg} size="tiny" />
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-slate-300 truncate text-left min-w-0">
                  {getFullTeamName(step.opponent?.id || step.opponent, playoffs.currentLg)}
                </span>
                <span
                  className={`ml-auto shrink-0 text-[9px] sm:text-[10px] font-black sports-font px-2 py-0.5 rounded border whitespace-nowrap ${
                    step.state === WON
                      ? 'text-[#22E748] bg-[#22E748]/10 border-[#22E748]/30'
                      : 'text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]/30'}`}
                >
                  {step.myScore ?? 0}-{step.oppScore ?? 0}{step.ot ? ' OT' : ''} {step.state === WON ? '✔' : '✕'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
