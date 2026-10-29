import { useState } from 'react';
import { useAppContext } from '../AppContext';
import { getFullTeamName } from '../utils/appHelpers';
import { LEAGUE_CONFIG, getOpponentPool, nhlTeams } from '../data/teams';
import { handleTradeRequest as _handleTradeRequest } from '../handlers/handleTradeRequest';

export default function TradeDeadlineScreen() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { advanceToOffseason, handleTrain, hasDemandedTrade, pendingSeasonResult, player, runPostSeasonFlow, setActiveEvent, setHasDemandedTrade, setScreen, setSeasonRecap, unlockAchievement } = useAppContext();
  return (() => {
          const res = pendingSeasonResult;
          if (!res || !res.recap) {
             return (
               <div className="game-panel p-6 sm:p-10 mt-2 border-t-2 border-t-[#ef4444] text-center">
                 <button onClick={() => advanceToOffseason()} className="btn-primary py-4 px-8 rounded-xl font-black sports-font">
                   CONTINUE CAREER
                 </button>
               </div>
             );
          }
          
          // Every professional league can trade. The old list left out the KHL, the
          // Swiss NL, the DEL, the ICEHL and both Extraligas, so a player there had
          // no way to ask for a move at all. The NCAA stays out: college players
          // cannot be traded.
          const isPro = res.currentLg !== 'NCAA' && !['', undefined, null].includes(res.currentLg);
          const playoffSpots = LEAGUE_CONFIG[res.currentLg]?.playoffSpots || 16;
          const standings = res.recap?.standings || 16;
          const isContender = standings <= playoffSpots;

          // The gate below used to call a club "rebuilding" only once it sat beneath
          // 60% of the league, so a team ranked 17th to 19th of 32 was shown to the
          // player as SELLING / REBUILDING while the trade logic still treated it as
          // a buyer. One test now drives both the label and the odds.
          const isSelling = !isContender;
          const isExpiring = player.contract?.years === 1 || ['OHL', 'WHL', 'QMJHL', 'USHL'].includes(res.currentLg);
          let eliteThreshold = 82;
          if (['AHL', 'SHL', 'LIIGA'].includes(res.currentLg)) eliteThreshold = 72;
          if (['OHL', 'WHL', 'QMJHL', 'USHL'].includes(res.currentLg)) eliteThreshold = 62;
          const isElite = player.ovr >= eliteThreshold;

          // Who actually gets moved in March. An expiring contract on a club that is
          // out of the race is the classic rental, and the better the player the more
          // certain it is. A signed player on a seller still gets shopped. A player on
          // a buyer is rarely the one leaving. The old gate gave a flat 5% to
          // everyone who was not the perfect rental, so a thirty-year-old on an
          // expiring deal on the worst team in the league had the same odds as a
          // signed depth forward on the best one.
          const tradeChance = (res.currentTeam === 'NTDP') ? 0
            : (isExpiring && isSelling && isElite) ? 0.40
            : (isExpiring && isSelling) ? 0.18
            : (isSelling && isElite) ? 0.10
            : 0.03;

          // A player at the deadline knows three things: his contract status, whether
          // the club is buying or selling, and whether his name is in the rumour mill.
          // The screen worked all of this out and then showed him none of it, so the
          // choice in front of him was a blind one.
          const rumour = tradeChance >= 0.40
            ? { label: 'YOUR NAME IS EVERYWHERE', note: 'Every insider has you near the top of the rental board.', hot: true }
            : tradeChance >= 0.18
              ? { label: 'LINKED IN THE RUMOURS', note: 'An expiring deal on a selling club. The calls are being made.', hot: true }
              : tradeChance >= 0.10
                ? { label: 'MENTIONED IN PASSING', note: 'You are under contract, but a selling club will listen to offers.', hot: false }
                : { label: 'NOBODY IS TALKING', note: 'Nothing in the rumour mill points anywhere near you.', hot: false };

          const handleSkip = () => {
             if (isProcessing) return;
             setIsProcessing(true);

             try {
               const currentLg = res.currentLg;

               if (isPro && Math.random() < tradeChance) {
                    const isAHL = currentLg === 'AHL';
                    let tradeLg = isAHL ? 'NHL' : currentLg;

                    let pool = (getOpponentPool(tradeLg) || []).filter(t => t.id !== res.currentTeam && t.id !== 'NTDP');
                    if (isAHL) {
                       const pTeam = (nhlTeams||[]).find(t => t.ahlId === res.currentTeam);
                       if (pTeam) pool = pool.filter(t => t.id !== pTeam.id);
                    }

                    if (pool.length === 0) pool = [{ id: 'UNK', name: 'Unknown Team' }];

                    const destTeam = pool[Math.floor(Math.random() * pool.length)];
                    const destStandings = Math.floor(Math.random() * (playoffSpots - 2)) + 1;

                    let targetTeamObj = destTeam;
                    let targetLg = tradeLg;
                    // A seller cashing in and a buyer paying a price are not the same
                    // phone call, and the old copy assumed you were always the asset
                    // being sold even when your club was first in the league.
                    let eventDesc = isSelling
                      ? `Just as the deadline was expiring, your GM called you into the office. You've been traded. With the season gone they cashed in on your value and shipped you to the **${getFullTeamName(destTeam.id, tradeLg)}**.`
                      : `Just as the deadline was expiring, your GM called you into the office. You've been traded. The club went out and got the piece it wanted for a run, and you were what the other side asked for. You are off to the **${getFullTeamName(destTeam.id, tradeLg)}**.`;
                    let feedback = `You packed your bags and joined your new squad.`;

                    if (isAHL && destTeam.ahlId) {
                        const ahlName = getFullTeamName(destTeam.ahlId, 'AHL');
                        targetTeamObj = { id: destTeam.ahlId, name: ahlName };
                        targetLg = 'AHL';
                        eventDesc = `Your NHL parent club decided to cash in on your value and shipped your rights to the **${getFullTeamName(destTeam.id, 'NHL')}**. You have immediately been assigned to their AHL affiliate, the **${ahlName}**.`;
                        feedback = `You packed your bags and reported to your new AHL club, the ${ahlName}.`;
                    }

                    // The destination's outlook is generated above but was never shown anywhere,
                    // so the player reacted to a trade with no idea what they were walking into.
                    eventDesc += ` They sit **#${destStandings}** in the standings, firmly in a playoff spot.`;

                    if (player.contract?.nmc) {
                        setActiveEvent({
                           title: 'WAIVE YOUR NMC?',
                           desc: `Your GM called you in. The team is struggling, and they have a massive trade package lined up from the **${getFullTeamName(destTeam.id, tradeLg)}**. You hold a No-Movement Clause. Will you waive it?`,
                           choices: [
                              // showTeamCard gives this the full team card (logo, rank, perks and
                              // flaws) so the destination can be judged before waiving the clause.
                              { label: 'Waive NMC (Accept Trade)', isRisky: false, feedback: 'You waived your clause to chase a Cup elsewhere.', effect: { fanStatus: -10, ovr: 0, money: 0 }, action: 'ACCEPT_TRADE_DEADLINE', actionData: { teamObj: targetTeamObj, lg: targetLg, teamStandings: destStandings, madePlayoffs: destStandings <= playoffSpots, showTeamCard: true } },
                              { label: 'Enforce NMC (Veto Trade)', isRisky: false, feedback: 'You invoked your NMC. The GM was frustrated, but you are staying put.', effect: { fanStatus: 20, ovr: 0, rel: { coach: -15 } } }
                           ],
                           isTradeDeadlineEvent: true
                        });
                    } else {
                        setActiveEvent({
                           title: '11TH HOUR BLOCKBUSTER!',
                           desc: eventDesc,
                           choices: [
                              // No showTeamCard here on purpose: the trade has already happened and
                              // both choices go to the same club, so two identical team cards would
                              // just repeat the destination twice. These choices are about how you
                              // react, so they stay as plain choices with a subLabel.
                              { label: 'Embrace the fresh start', subLabel: 'Report on good terms and leave the bridge standing.', isRisky: false, feedback: feedback, effect: { fanStatus: 0, ovr: 0, money: 0 }, action: 'ACCEPT_TRADE_DEADLINE', actionData: { teamObj: targetTeamObj, lg: targetLg, teamStandings: destStandings, madePlayoffs: destStandings <= playoffSpots } },
                              { label: 'Trash your old GM to the press', subLabel: 'Burn the bridge and try to win over your new fan base.', isRisky: true, successChance: 0.4, successFeedback: 'Fans of your new team loved the fire. You arrived with a chip on your shoulder!', successEffect: { fanStatus: 20, ovr: 1, money: 0 }, failFeedback: 'You came off looking bitter and unprofessional. Not a great first impression.', failEffect: { fanStatus: -20, ovr: -1, money: 0 }, action: 'ACCEPT_TRADE_DEADLINE', actionData: { teamObj: targetTeamObj, lg: targetLg, teamStandings: destStandings, madePlayoffs: destStandings <= playoffSpots } }
                           ],
                           isTradeDeadlineEvent: true
                        });
                    }
                    setScreen('event');
               } else if (res.partial) {
                   // Nobody called. The deadline passes and the season carries on
                   // from here, which is the point: this is March, not June.
                   handleTrain(null);
               } else {
                   setSeasonRecap(res.recap);
                   try {
                      runPostSeasonFlow(player.age, player.ovr, res.currentLg, res.currentTeam, res.madePlayoffs, 2026 + (player.stats?.seasonsPlayed || 0), standings);
                   } catch (e) {
                      // If postseason flow throws, log it and let the failsafe below rescue the click.
                      console.error('[TradeDeadlineScreen] runPostSeasonFlow threw:', e);
                   }
               }
             } finally {
                // FAILSAFE: no matter what happened above, release the lock and guarantee a
                // visible screen transition. If runPostSeasonFlow or the event branch already
                // set screen to something else, this leaves it alone. If they didn't (or threw),
                // this forces recap. Also always resets isProcessing so a stuck click can never
                // permanently lock the buttons on this screen.
                setTimeout(() => {
                   setIsProcessing(false);
                   setScreen(currentScreen => currentScreen === 'trade-deadline'
                  ? (res.partial ? 'preseason' : 'recap')
                  : currentScreen);
                }, 100);
             }
          };

          const handleTradeRequest = () => {
             if (isProcessing) return;
             setIsProcessing(true);
             _handleTradeRequest(
               { hasDemandedTrade, setHasDemandedTrade, unlockAchievement, player, setActiveEvent, setScreen },
               { res, playoffSpots }
             );
          };

          return (
  <div className="w-full max-w-[420px] md:max-w-4xl lg:max-w-5xl mx-auto game-panel p-5 sm:p-8 mt-2 text-center">
    <h2 className="text-3xl sm:text-4xl font-black tracking-wide mb-1 text-white sports-font uppercase">
      TRADE DEADLINE
    </h2>
    <p className="text-slate-400 mb-6 text-sm sm:text-base font-medium">
      The trade deadline is 24 hours away. The media is swarming.
    </p>

    <div className="bg-[#101410] border border-[rgba(255,255,255,0.08)] p-5 sm:p-6 rounded-xl mb-6 max-w-lg mx-auto text-left shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
            TEAM OUTLOOK
          </p>
          <p className="text-xl sm:text-2xl font-black text-white sports-font uppercase leading-tight mb-1">
            {isContender ? 'BUYING / CONTENDING' : 'SELLING / REBUILDING'}
          </p>
          <p className={`text-xs sm:text-sm font-bold uppercase flex items-center gap-2 ${isContender ? 'text-[#22E748]' : 'text-[#ef4444]'}`}>
            Currently #{standings} in the {res.currentLg}
            <span className={`text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider font-sans border ${isContender ? 'bg-[#22E748]/10 border-[#22E748]/30 text-[#22E748]' : 'bg-[#ef4444]/10 border-[#ef4444]/30 text-[#ef4444]'}`}>
              {isContender ? 'IN PLAYOFFS' : 'OUT OF PLAYOFFS'}
            </span>
          </p>
        </div>
        <div className="hidden sm:block text-4xl sm:text-5xl shrink-0">
          {isContender ? '📈' : '📉'}
        </div>
      </div>

      {res.partial && (
        <div className="mt-5 pt-5 border-t border-[rgba(255,255,255,0.065)]">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
            YOUR SEASON SO FAR
          </p>
          <p className="text-base sm:text-lg font-black text-white sports-font uppercase leading-tight">
            {player.pos === 'G'
              ? `${(res.recap.saves / Math.max(1, res.recap.shots)).toFixed(3).replace('0.', '.')} SV%, ${res.recap.sho || 0} SO IN ${res.recap.games} GP`
              : `${res.recap.g || 0}G ${res.recap.a || 0}A, ${(res.recap.g || 0) + (res.recap.a || 0)} PTS IN ${res.recap.games} GP`}
          </p>
          <p className="text-[11px] sm:text-xs text-slate-400 font-sans leading-snug mt-0.5">
            There are still games left this season. Whatever happens today decides who you play them for.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5 pt-5 border-t border-[rgba(255,255,255,0.065)]">
        <div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
            YOUR CONTRACT
          </p>
          <p className={`text-base sm:text-lg font-black sports-font uppercase leading-tight ${isExpiring ? 'text-[#F59E0B]' : 'text-white'}`}>
            {isExpiring ? 'EXPIRING' : `${player.contract?.years || 0} ${(player.contract?.years || 0) === 1 ? 'YEAR' : 'YEARS'} LEFT`}
          </p>
          <p className="text-[11px] sm:text-xs text-slate-400 font-sans leading-snug mt-0.5">
            {isExpiring ? 'A club with nothing to play for would rather have the pick.' : 'You are signed beyond this season.'}
          </p>
        </div>

        <div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
            THE RUMOUR MILL
          </p>
          <p className={`text-base sm:text-lg font-black sports-font uppercase leading-tight ${rumour.hot ? 'text-[#ef4444]' : 'text-slate-300'}`}>
            {rumour.label}
          </p>
          <p className="text-[11px] sm:text-xs text-slate-400 font-sans leading-snug mt-0.5">
            {rumour.note}
          </p>
        </div>
      </div>
    </div>

    <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md sm:max-w-lg mx-auto">
      <button 
        onClick={handleSkip} 
        className="py-3.5 px-6 sm:px-8 rounded-xl font-black sports-font tracking-widest text-lg transition-all hover:scale-[1.02] w-full sm:w-auto flex-1 cursor-pointer bg-[#22E748]/10 hover:bg-[#22E748]/20 border border-[#22E748]/40 text-[#22E748] shadow-[0_0_15px_rgba(34,231,75,0.15)] hover:shadow-[0_0_25px_rgba(34,231,75,0.25)]"
      >
        {isContender ? 'STAY THE COURSE' : 'RIDE IT OUT'}
      </button>

      {isPro && (
        <button 
          onClick={handleTradeRequest} 
          disabled={hasDemandedTrade}
          className={`py-3 px-6 sm:px-8 rounded-xl font-black sports-font tracking-widest transition-all w-full sm:w-auto flex-1 flex flex-col items-center justify-center gap-1.5 ${
            hasDemandedTrade 
              ? 'bg-[#101410] border border-slate-800 text-slate-500 cursor-not-allowed opacity-50' 
              : 'bg-[#ef4444]/10 hover:bg-[#ef4444]/20 border border-[#ef4444]/40 text-[#ef4444] shadow-[0_0_15px_rgba(239,68,68,0.15)] cursor-pointer hover:scale-[1.02]'
          }`}
        >
          <span className="text-lg leading-none">{hasDemandedTrade ? 'REQUEST SUBMITTED' : 'DEMAND TRADE'}</span>
          {!hasDemandedTrade && (
            <span className="text-[10px] sm:text-xs font-sans font-bold tracking-widest text-[#ef4444] uppercase leading-none opacity-80">
              ⚡ RISKY GAMBLE
            </span>
          )}
        </button>
      )}
    </div>
  </div>
);
})();
}