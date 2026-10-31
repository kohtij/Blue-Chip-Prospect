import { useState } from 'react';
import { useAppContext } from '../AppContext';
import { getFullTeamName } from '../utils/appHelpers';
import { LEAGUE_CONFIG, getOpponentPool, getTeamData, nhlTeams, readableAccent, teamAccent } from '../data/teams';
import { handleTradeRequest as _handleTradeRequest } from '../handlers/handleTradeRequest';
import { handleTransferPortal as _handleTransferPortal } from '../handlers/handleTransferPortal';
import { hasProContract as _hasProContract } from '../utils/gameHelpers';
import TeamLogo from '../components/TeamLogo';
import { ACTION, CONTRACT, EURO_LEAGUES, OUTLOOK, RUMOUR, SEASON, SEASON_AMATEUR, STAKES, SUBTITLE, pickFlavor } from '../data/deadlineFlavor';

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
          // A junior has no professional contract to expire, so calling him an
          // expiring asset was wrong twice over: the row said EXPIRING for a player
          // who had never signed anything, and the trade odds treated every junior
          // as a rental. What moves a junior at the deadline is his club's position
          // and how good he is, which is handled below.
          // A scholarship is written into player.contract exactly like a pro deal
          // (signContract stores the NIL figure as the salary and the four years
          // of eligibility as the term), so every college player looked like he
          // was signed through 2030 and got told that "a club trading for you is
          // trading for more than a few months". Nobody trades in the NCAA, and a
          // scholarship is not a contract. hasProContract is the shared test.
          const isCollege = res.currentLg === 'NCAA';
          const hasProContract = !isCollege && _hasProContract(player);
          const isExpiring = hasProContract && player.contract.years === 1;
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
          const rumourTier = tradeChance >= 0.40 ? 'blazing'
            : tradeChance >= 0.18 ? 'warm'
              : tradeChance >= 0.10 ? 'cool'
                : 'cold';
          const HEAT = { blazing: 4, warm: 3, cool: 2, cold: 1 };

          // Neither a college programme nor the national programme trades its
          // players, and tradeChance already says so for the NTDP by returning
          // zero. The DEMAND TRADE button did not know that, so an NTDP player
          // could ask for a move the rest of the game says cannot happen, and
          // the request handler would happily find him a USHL club.
          const isProgram = isCollege || res.currentTeam === 'NTDP';
          const canBeTraded = isPro && res.currentTeam !== 'NTDP';
          const teamData = getTeamData(res.currentTeam, res.currentLg);
          const accent = teamAccent(teamData);
          // The strip and the glow can take the club's real colour; 9px
          // uppercase text cannot. Tri-City purple and Devils red both vanish
          // against the panel at that size.
          const accentText = readableAccent(accent);

          // The same club in the same season reads the same way every time the
          // screen is drawn; a different season, club or league reads differently.
          // Seeding it rather than rolling means the copy does not flicker as the
          // component re-renders.
          const seed = `${res.currentTeam}|${res.currentLg}|${player.stats?.seasonsPlayed || 0}|${standings}|${player.age}`;

          // How the year has actually gone, which is what the season note talks
          // about. A goalie is judged on save percentage, everyone else on points.
          const gp = res.recap?.games || 0;
          let seasonTier = 'steady';
          if (gp >= 5) {
            if (player.pos === 'G') {
              const sv = (res.recap?.shots || 0) > 0 ? (res.recap.saves || 0) / res.recap.shots : 0;
              seasonTier = sv >= 0.915 ? 'strong' : sv <= 0.890 ? 'quiet' : 'steady';
            } else {
              const ppg = ((res.recap?.g || 0) + (res.recap?.a || 0)) / gp;
              seasonTier = ppg >= 0.95 ? 'strong' : ppg <= 0.40 ? 'quiet' : 'steady';
            }
          }

          // "2G 9A, 11 PTS IN 23 GP" packed four numbers and four abbreviations
          // into one run of text, so telling the goals from the assists meant
          // reading it rather than glancing at it. Each number gets its own tile
          // with its label underneath.
          const seasonStats = player.pos === 'G'
            ? [
                { label: 'GP', value: res.recap?.games || 0 },
                { label: 'SV%', value: ((res.recap?.saves || 0) / Math.max(1, res.recap?.shots || 0)).toFixed(3).replace('0.', '.'), lead: true },
                { label: 'SO', value: res.recap?.sho || 0 }
              ]
            : [
                { label: 'GP', value: res.recap?.games || 0 },
                { label: 'G', value: res.recap?.g || 0 },
                { label: 'A', value: res.recap?.a || 0 },
                { label: 'PTS', value: (res.recap?.g || 0) + (res.recap?.a || 0), lead: true }
              ];

          const rumour = pickFlavor(RUMOUR[rumourTier], seed, 'rumour');

          // Out of the playoffs is not the same as out of it. A club sitting
          // 21st of 32 was being told its season was written off and its roster
          // was worth working out in picks, which is a bottom-eight message
          // handed to a team four points out. Only the bottom quarter of the
          // league gets the fire sale; everyone else in between is undecided.
          const leagueSize = (getOpponentPool(res.currentLg) || []).length || playoffSpots * 2;
          const bottomTierFrom = leagueSize - Math.max(4, Math.round(leagueSize / 4));
          const isBottomTier = standings > bottomTierFrom;
          const outlookKey = isContender ? 'contender' : isBottomTier ? 'seller' : 'fringe';
          // European clubs sell players and pay transfer fees; they do not deal
          // draft picks. The seller lines said a lost season "pays in one
          // currency, and that currency is draft picks" on a Skellefteå card.
          const sellerKey = EURO_LEAGUES.includes(res.currentLg) ? 'sellerEuro' : 'seller';
          const outlookPool = OUTLOOK[isContender ? 'contender' : isBottomTier ? sellerKey : 'fringe'];

          // Two of the three lower blocks only make sense in some careers. A
          // college skater has no contract to expire and cannot be traded, and an
          // NTDP player cannot be traded either, so both were being shown a
          // contract row that said UNSIGNED and a rumour mill that could never
          // produce a rumour. Each block now has to earn its place, and when
          // neither does, something about the run-in takes their spot.
          // The league minimum entry-level number. A player on one of these is
          // not "signed beyond this season" in any sense he can act on.
          const isELC = (player.contract?.salary || 0) === 925000;
          const contractKey = isExpiring
            ? (isELC ? 'elcExpiring' : 'expiring')
            : (isELC ? 'elc' : 'signed');

          const showContract = hasProContract;
          const showRumour = canBeTraded && tradeChance > 0;
          const stakes = pickFlavor(STAKES[isContender ? 'inRace' : 'outOfRace'], seed, 'stakes');

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

          const handleTransferPortal = () => {
             if (isProcessing) return;
             setIsProcessing(true);
             _handleTransferPortal(
               { hasDemandedTrade, setHasDemandedTrade, unlockAchievement, player, setActiveEvent, setScreen },
               { res }
             );
          };

          return (
  <div className="w-full max-w-[420px] md:max-w-4xl lg:max-w-5xl mx-auto game-panel p-5 sm:p-8 mt-2 text-center">
    <h2 className="text-3xl sm:text-4xl font-black tracking-wide mb-1 text-white sports-font uppercase">
      {isProgram ? 'THE STRETCH RUN' : 'TRADE DEADLINE'}
    </h2>
    <p className="text-slate-400 mb-6 text-sm sm:text-base font-medium max-w-xl mx-auto">
      {pickFlavor(SUBTITLE[isCollege ? 'college' : isProgram ? 'program' : outlookKey], seed, 'subtitle')}
    </p>

    {/* The club paints its own card, the same way the offer cards do. A screen
        about one team that showed none of that team's colours read as a form. */}
    <div className="bg-[#0a0d0a] border border-[rgba(255,255,255,0.08)] rounded-xl mb-6 max-w-lg mx-auto text-left shadow-lg relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[3px] z-10" style={{ backgroundColor: accent }} />
      <div
        className="absolute inset-x-0 top-0 h-28 z-0 pointer-events-none opacity-[0.16]"
        style={{ background: `radial-gradient(120% 100% at 50% 0%, ${accent} 0%, transparent 70%)` }}
      />

      <div className="p-5 sm:p-6 relative z-10">
        <div className="flex items-center gap-3 mb-5">
          <div className="shrink-0">
            <TeamLogo teamId={res.currentTeam} league={res.currentLg || 'NHL'} isAHL={res.currentLg === 'AHL'} size="small" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm sm:text-base font-black text-white sports-font leading-tight uppercase tracking-wide break-words">
              {getFullTeamName(res.currentTeam, res.currentLg)}
            </h3>
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest block mt-1" style={{ color: accentText }}>
              {[res.currentLg, teamData?.ncaaConf || teamData?.div].filter(Boolean).join(' · ')}
            </span>
          </div>
        </div>

        {/* The outlook is the one thing on this screen that changes what today
            means, so it gets the colour and the space rather than a grey label. */}
        <div
          className={`rounded-lg border px-4 py-3 ${isContender
            ? 'bg-[#22E748]/[0.07] border-[#22E748]/25'
            : isBottomTier
              ? 'bg-[#ef4444]/[0.07] border-[#ef4444]/25'
              : 'bg-[#F59E0B]/[0.07] border-[#F59E0B]/25'}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                {isProgram ? 'WHERE YOU STAND' : 'TEAM OUTLOOK'}
              </p>
              <p className={`text-xl sm:text-2xl font-black sports-font uppercase leading-tight ${isContender ? 'text-[#22E748]' : isBottomTier ? 'text-[#ef4444]' : 'text-[#F59E0B]'}`}>
                {isProgram
                  ? (isContender ? 'TOURNAMENT PACE' : 'ON THE BUBBLE')
                  : isContender ? 'BUYING / CONTENDING'
                    : isBottomTier ? 'SELLING / REBUILDING'
                      : 'UNDECIDED / ON THE EDGE'}
              </p>
              <p className="text-xs sm:text-sm font-bold uppercase text-slate-400 mt-0.5">
                #{standings} in the {res.currentLg}
              </p>
            </div>
            <span className={`shrink-0 text-[9px] sm:text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider font-sans border whitespace-nowrap ${isContender ? 'bg-[#22E748]/10 border-[#22E748]/30 text-[#22E748]' : 'bg-[#ef4444]/10 border-[#ef4444]/30 text-[#ef4444]'}`}>
              {isCollege
                ? (isContender ? 'IN THE FIELD' : 'OUTSIDE THE FIELD')
                : (isContender ? 'IN PLAYOFFS' : 'OUT OF PLAYOFFS')}
            </span>
          </div>
          {!isProgram && (
            <p className="text-[11px] sm:text-xs text-slate-400 font-sans leading-snug mt-2">
              {pickFlavor(outlookPool, seed, 'outlook')}
            </p>
          )}
        </div>

        {res.partial && (
          <div className="mt-5 pt-5 border-t border-[rgba(255,255,255,0.065)]">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
              YOUR SEASON SO FAR
            </p>
            <div className="flex gap-2">
              {seasonStats.map(s => (
                <div
                  key={s.label}
                  className={`flex-1 rounded-lg border px-2 py-2 text-center ${s.lead
                    ? 'bg-[rgba(255,255,255,0.08)] border-[rgba(255,255,255,0.22)]'
                    : 'bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.07)]'}`}
                >
                  <p className="text-lg sm:text-xl font-black sports-font leading-none text-white tracking-tight">
                    {s.value}
                  </p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1.5 leading-none">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 font-sans leading-snug mt-2">
              {pickFlavor((isProgram ? SEASON_AMATEUR : SEASON)[seasonTier], seed, 'season')}
            </p>
          </div>
        )}

        <div className={`grid gap-4 mt-5 pt-5 border-t border-[rgba(255,255,255,0.065)] ${showContract && showRumour ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
          {showContract && (
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                YOUR CONTRACT
              </p>
              <p className={`text-base sm:text-lg font-black sports-font uppercase leading-tight ${isExpiring ? 'text-[#F59E0B]' : 'text-white'}`}>
                {isELC && <span className="text-[#3b82f6]">ELC · </span>}
                {isExpiring ? 'EXPIRING' : `${player.contract.years} ${player.contract.years === 1 ? 'YEAR' : 'YEARS'} LEFT`}
              </p>
              <p className="text-[11px] sm:text-xs text-slate-400 font-sans leading-snug mt-0.5">
                {pickFlavor(CONTRACT[contractKey], seed, 'contract')}
              </p>
            </div>
          )}

          {showRumour && (
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  THE RUMOUR MILL
                </p>
                {/* How loud it actually is. The screen already knew the odds and
                    only ever hinted at them in prose. */}
                <span className="flex gap-[3px] shrink-0" title={`${Math.round(tradeChance * 100)}% chance of being moved`}>
                  {[1, 2, 3, 4].map(n => (
                    <span
                      key={n}
                      className={`w-3 h-[3px] rounded-full ${n <= HEAT[rumourTier]
                        ? (HEAT[rumourTier] >= 3 ? 'bg-[#ef4444]' : 'bg-[#F59E0B]')
                        : 'bg-[rgba(255,255,255,0.1)]'}`}
                    />
                  ))}
                </span>
              </div>
              <p className={`text-base sm:text-lg font-black sports-font uppercase leading-tight ${HEAT[rumourTier] >= 3 ? 'text-[#ef4444]' : HEAT[rumourTier] === 2 ? 'text-[#F59E0B]' : 'text-slate-300'}`}>
                {rumour.label}
              </p>
              <p className="text-[11px] sm:text-xs text-slate-400 font-sans leading-snug mt-0.5">
                {rumour.note}
              </p>
            </div>
          )}

          {!showContract && !showRumour && (
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                WHAT IS LEFT
              </p>
              <p className={`text-base sm:text-lg font-black sports-font uppercase leading-tight ${isContender ? 'text-white' : 'text-slate-300'}`}>
                {stakes.label}
              </p>
              <p className="text-[11px] sm:text-xs text-slate-400 font-sans leading-snug mt-0.5">
                {stakes.note}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>

    <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md sm:max-w-lg mx-auto">
      <button
        onClick={handleSkip}
        className="py-3.5 px-6 sm:px-8 rounded-xl font-black sports-font tracking-widest text-lg transition-all hover:scale-[1.02] w-full sm:w-auto flex-1 cursor-pointer bg-[#22E748]/10 hover:bg-[#22E748]/20 border border-[#22E748]/40 text-[#22E748] shadow-[0_0_15px_rgba(34,231,75,0.15)] hover:shadow-[0_0_25px_rgba(34,231,75,0.25)]"
      >
        {pickFlavor(ACTION[isProgram ? 'program' : outlookKey], seed, 'action')}
      </button>

      {/* The college equivalent of demanding a trade. A player who cannot be
          traded still has a way out, and it is the one move that actually
          exists in his world. */}
      {isCollege && (
        <button
          onClick={handleTransferPortal}
          disabled={hasDemandedTrade}
          className={`py-3 px-6 sm:px-8 rounded-xl font-black sports-font tracking-widest transition-all w-full sm:w-auto flex-1 flex flex-col items-center justify-center gap-1.5 ${
            hasDemandedTrade
              ? 'bg-[#101410] border border-slate-800 text-slate-500 cursor-not-allowed opacity-50'
              : 'bg-[#c084fc]/10 hover:bg-[#c084fc]/20 border border-[#c084fc]/40 text-[#c084fc] shadow-[0_0_15px_rgba(192,132,252,0.15)] cursor-pointer hover:scale-[1.02]'
          }`}
        >
          <span className="text-lg leading-none">{hasDemandedTrade ? 'NAME IS IN' : 'ENTER THE PORTAL'}</span>
          {!hasDemandedTrade && (
            <span className="text-[10px] sm:text-xs font-sans font-bold tracking-widest uppercase leading-none opacity-80">
              ⚡ NO GUARANTEES
            </span>
          )}
        </button>
      )}

      {canBeTraded && (
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