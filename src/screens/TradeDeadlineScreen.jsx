import React from 'react';
import { getFullTeamName } from '../utils/appHelpers';
import { LEAGUE_CONFIG, getOpponentPool } from '../data/teams';

// Extracted from App.jsx. Auto-generated with JSX-aware external analysis.
export default function TradeDeadlineScreen({ advanceToOffseason, hasDemandedTrade, pendingSeasonResult, player, runPostSeasonFlow, setActiveEvent, setHasDemandedTrade, setScreen, setSeasonRecap, unlockAchievement }) {
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
          
          const isPro = ['NHL', 'AHL', 'OHL', 'WHL', 'QMJHL', 'USHL', 'SHL', 'LIIGA'].includes(res.currentLg);
          const playoffSpots = LEAGUE_CONFIG[res.currentLg]?.playoffSpots || 16;
          const standings = res.recap?.standings || 16;
          const isContender = standings <= playoffSpots;

          const handleSkip = () => {
             const currentLg = res.currentLg;
             const isExpiring = player.contract?.years === 1 || ['OHL', 'WHL', 'QMJHL', 'USHL'].includes(currentLg);
             const totalTeamsInLeague = getOpponentPool(currentLg)?.length || 20;
             const isRebuilding = standings > (totalTeamsInLeague * 0.6);
             
             let eliteThreshold = 82;
             if (['AHL', 'SHL', 'LIIGA'].includes(currentLg)) eliteThreshold = 72;
             if (['OHL', 'WHL', 'QMJHL', 'USHL'].includes(currentLg)) eliteThreshold = 62;
             const isElite = player.ovr >= eliteThreshold;

             // 40% chance if elite/expiring on a bad team. 5% random hockey trade otherwise. NTDP players cannot be traded.
             const tradeChance = (res.currentTeam === 'NTDP') ? 0 : ((isExpiring && isRebuilding && isElite) ? 0.40 : 0.05);

             if (['NHL', 'AHL', 'OHL', 'WHL', 'QMJHL', 'USHL', 'SHL', 'LIIGA'].includes(currentLg) && Math.random() < tradeChance) {
                  let pool = (getOpponentPool(currentLg) || []).filter(t => t.id !== res.currentTeam && t.id !== 'NTDP');
                  if (pool.length === 0) pool = [{ id: 'UNK', name: 'Unknown Team' }];
                  
                  const destTeam = pool[Math.floor(Math.random() * pool.length)];
                  const destStandings = Math.floor(Math.random() * (playoffSpots - 2)) + 1; 
                  
                  if (player.contract?.nmc) {
                      setActiveEvent({
                         title: 'WAIVE YOUR NMC?',
                         desc: `Your GM called you in. The team is struggling, and they have a massive trade package lined up from the ${getFullTeamName(destTeam.id, currentLg)}. You hold a No-Movement Clause. Will you waive it?`,
                         choices: [
                            { label: 'Waive NMC (Accept Trade)', isRisky: false, feedback: 'You waived your clause to chase a Cup elsewhere.', effect: { idol: -10, ovr: 0, money: 0 }, action: 'ACCEPT_TRADE_DEADLINE', actionData: { teamObj: destTeam, teamStandings: destStandings, madePlayoffs: destStandings <= playoffSpots } },
                            { label: 'Enforce NMC (Veto Trade)', isRisky: false, feedback: 'You invoked your NMC. The GM was frustrated, but you are staying put.', effect: { idol: 20, ovr: 0, rel: { coach: -15 } } }
                         ],
                         isTradeDeadlineEvent: true
                      });
                  } else {
                      setActiveEvent({
                         title: '11TH HOUR BLOCKBUSTER!',
                         desc: `Just as the deadline was expiring, your GM called you into the office. You've been traded! The team decided to cash in on your value and shipped you to the ${getFullTeamName(destTeam.id, currentLg)}.`,
                         choices: [
                            { label: 'Embrace the fresh start', isRisky: false, feedback: 'You packed your bags and joined your new squad.', effect: { idol: 0, ovr: 0, money: 0 }, action: 'ACCEPT_TRADE_DEADLINE', actionData: { teamObj: destTeam, teamStandings: destStandings, madePlayoffs: destStandings <= playoffSpots } },
                            { label: 'Trash your old GM to the press', isRisky: true, successChance: 0.4, successFeedback: 'Fans of your new team loved the fire. You arrived with a chip on your shoulder!', successEffect: { idol: 20, ovr: 1, money: 0 }, failFeedback: 'You came off looking bitter and unprofessional. Not a great first impression.', failEffect: { idol: -20, ovr: -1, money: 0 }, action: 'ACCEPT_TRADE_DEADLINE', actionData: { teamObj: destTeam, teamStandings: destStandings, madePlayoffs: destStandings <= playoffSpots } }
                         ],
                         isTradeDeadlineEvent: true
                      });
                  }
                  setScreen('event');
             } else {
                 setSeasonRecap(res.recap);
                 runPostSeasonFlow(player.age, player.ovr, res.currentLg, res.currentTeam, res.madePlayoffs, 2026 + (player.stats?.seasonsPlayed || 0), standings);
             }
          };

          const handleTradeRequest = () => {
             if (hasDemandedTrade) return;
             setHasDemandedTrade(true);
             unlockAchievement('trade_demanded');

             const successChance = Math.min(0.85, Math.max(0.35, 0.35 + ((player.ovr - 60) / 40)));
             const isSuccess = Math.random() < successChance;

             if (isSuccess) {
                let pool = getOpponentPool(res.currentLg)?.filter(t => t.id !== res.currentTeam) || [];
                pool = [...pool].sort(() => 0.5 - Math.random()).slice(0, 3);
                if (pool.length === 0) pool = [{ id: 'UNK', name: 'Unknown Team' }];

                const choices = pool.map(teamObj => {
                   const isGoingToContender = Math.random() > 0.3;
                   const teamStandings = isGoingToContender
                       ? Math.floor(Math.random() * playoffSpots) + 1
                       : Math.floor(Math.random() * 8) + playoffSpots + 1;
                   const teamInPlayoffs = teamStandings <= playoffSpots;
                   
                   return {
                      label: `Accept Trade to ${teamObj.name}`,
                      subLabel: `📈 Rank #${teamStandings} (${teamInPlayoffs ? 'IN PLAYOFFS' : 'OUT OF PLAYOFFS'})`,
                      isRisky: false,
                      feedback: `The trade went through! You were dealt to ${teamObj.name}.`,
                      effect: { idol: -20, ovr: 0, money: 0 },
                      action: 'ACCEPT_TRADE_DEADLINE',
                      actionData: { teamObj, teamStandings, madePlayoffs: teamInPlayoffs }
                   };
                });

                setActiveEvent({
                   title: 'TRADE OFFERS RECEIVED',
                   desc: `Your agent leveraged interest across the league. Your GM has agreed to trade packages from multiple suitors. Where do you want to be shipped?`,
                   choices: choices,
                   isTradeDeadlineEvent: true
                });
                setScreen('event');
             } else {
                unlockAchievement('trade_rejected');
                setActiveEvent({
                   title: 'TRADE REQUEST REJECTED',
                   desc: `Your GM publicly shut down your request: "We control his rights and he isn't going anywhere." The media is blasting your loyalty, your teammates are giving you the cold shoulder, and your GM benched you.`,
                   choices: [
                      {
                         label: 'Accept your fate and stay focused',
                         isRisky: false,
                         feedback: 'You put your head down, but the environment in the locker room is toxic.',
                         effect: { idol: -30, ovr: -1, money: 0 }
                      }
                   ],
                   isTradeDeadlineEvent: true
                });
                setScreen('event');
             }
          };

          return (
  <div className="w-full max-w-[420px] md:max-w-4xl lg:max-w-5xl mx-auto game-panel p-5 sm:p-8 mt-2 text-center">
    
    {/* TITLE & HEADER */}
    <h2 className="text-3xl sm:text-4xl font-black tracking-wide mb-1 text-white sports-font uppercase">
      TRADE DEADLINE
    </h2>
    <p className="text-slate-400 mb-6 text-sm sm:text-base font-medium">
      The trade deadline is 24 hours away. The media is swarming.
    </p>

    {/* TEAM OUTLOOK PANEL */}
    <div className="bg-[#101410] border border-[rgba(255,255,255,0.08)] p-5 sm:p-6 rounded-xl mb-6 max-w-lg mx-auto text-left flex items-center justify-between shadow-lg">
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

    {/* ACTION BUTTONS */}
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
