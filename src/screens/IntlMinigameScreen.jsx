import { useState, useCallback } from 'react';
import { useAppContext } from '../AppContext';
import { applyOvrDelta, recomputeOvr, capIdol } from '../utils/gameHelpers';

const PREP_SCENARIOS = [
  {
    title: "🍽️ THE TEAM DINNER",
    desc: "The night before the massive tournament finale, the coaches have arranged a standard buffet at the hotel, but some teammates want to sneak out and try the famous local street food.",
    choices: [
      { label: 'Eat at the Hotel', isRisky: false, desc: 'Safe carbs. You feel perfectly fine.', winEffect: { idol: 0, ovr: 1 }, win: "You ate the bland pasta. Not exciting, but safe." },
      { label: 'Try Local Street Food', isRisky: true, chance: 0.5, desc: 'Could be amazing energy, or a long night in the bathroom.', winEffect: { idol: 15, ovr: 2 }, failEffect: { idol: -10, ovr: -2 }, win: "The food was incredible! You feel incredibly energized.", fail: "Food poisoning. You spent the night hugging the toilet." }
    ]
  },
  {
    title: "🏞️ THE DAY OFF",
    desc: "You have a full day off before the finals. You can either stay in your room and study tape, or join the guys for a hike around the host city's famous landmarks.",
    choices: [
      { label: 'Study Film', isRisky: false, desc: 'Review the opponent\'s powerplay.', winEffect: { idol: 0, ovr: 1 }, win: "You picked up on their defensive tendencies and feel prepared." },
      { label: 'Go Sightseeing', isRisky: true, chance: 0.6, desc: 'Great for the mind, risky for the legs.', winEffect: { idol: 20, ovr: 1 }, failEffect: { idol: -5, ovr: -2 }, win: "The fresh air and team bonding completely cleared your head!", fail: "You walked 10 miles and your legs feel like absolute lead." }
    ]
  },
  {
    title: "🎤 THE MEDIA SCRUM",
    desc: "The international press surrounds your locker. They are practically begging for a controversial headline about tomorrow's matchup against your biggest rivals.",
    choices: [
      { label: 'Give Cliché Answers', isRisky: false, desc: '"Pucks deep, 110%, etc."', winEffect: { idol: 5, ovr: 0 }, win: "Boring, but you avoided giving them bulletin board material." },
      { label: 'Guarantee a Victory', isRisky: true, chance: 0.4, desc: 'Call your shot on the global stage.', winEffect: { idol: 50, ovr: 2 }, failEffect: { idol: -30, ovr: -1 }, win: "The fans loved the swagger! You are oozing with confidence.", fail: "The media ripped your arrogance, and the immense pressure is getting to you." }
    ]
  },
  {
    title: "🏒 EQUIPMENT TINKERING",
    desc: "A representative from your stick sponsor drops off a new, experimental prototype right before practice and asks you to use it in the final.",
    choices: [
      { label: 'Stick to the Old Reliable', isRisky: false, desc: 'Use the gear that got you here.', winEffect: { idol: 0, ovr: 1 }, win: "No surprises. You feel totally comfortable with your setup." },
      { label: 'Use the Prototype', isRisky: true, chance: 0.5, desc: 'Could have an insane kick point, or feel completely foreign.', winEffect: { idol: 15, ovr: 2 }, failEffect: { idol: -5, ovr: -2 }, win: "The puck jumps off the blade! Your shot feels absolutely lethal.", fail: "You can't feel the puck at all. A huge mistake trying it now." }
    ]
  },
  {
    title: "👀 PRE-GAME WARMUPS",
    desc: "You step onto the ice for warmups. The opposing team is staring you down from the red line, trying to intimidate you in front of the hostile crowd.",
    choices: [
      { label: 'Focus on Stretching', isRisky: false, desc: 'Ignore them and get your body ready.', winEffect: { idol: 0, ovr: 1 }, win: "You ignored the noise and got a great sweat going." },
      { label: 'Stare Them Down', isRisky: true, chance: 0.55, desc: 'Skate to the red line and send a message.', winEffect: { idol: 25, ovr: 1 }, failEffect: { idol: -15, ovr: -1 }, win: "You didn't blink. They looked away first. You are in their heads.", fail: "You tripped on a puck while trying to look intimidating. Extremely embarrassing." }
    ]
  }
];

export default function IntlMinigameScreen() {
  const { activeEvent, handleMinigameChoice, intlResult, minigameContext, player, proceedToNextScreen, safeNationalities, setIntlResult, setPlayer, setSeasonEvents } = useAppContext();
  
  // New State for Pass 2: The Group Stage Summary Phase
  const [showSummary, setShowSummary] = useState(!!player.intlData);
  const [prepPhase, setPrepPhase] = useState(true);
  const [prepFeedback, setPrepFeedback] = useState(null);
  const [scenario] = useState(() => PREP_SCENARIOS[Math.floor(Math.random() * PREP_SCENARIOS.length)]);

  const nat = safeNationalities.find(n => n.id === player.nat);
  const countryName = nat?.sentenceName || nat?.name || 'your country';

  // State "Locks": This forces the UI to remember the stakes even after App.jsx wipes them!
  const [initialStake] = useState(player.intlStakes || 'GOLD');
  const [isOlympic] = useState(player.isOlympicYear || false);
  const [initialDiv] = useState(player.natDiv || nat?.division || 'Top Division');
  const [groupData] = useState(player.intlData || null);

  // --- Dynamic Match Naming & UI Colors based on Stakes ---
  let winTitle = 'TOURNAMENT WIN';
  let winIcon = '🏆';
  let resultColor = intlResult?.isWin ? 'text-[#22E748]' : 'text-[#ef4444]';
  let resultBg = intlResult?.isWin ? 'border-[#22E748]/50 bg-[#22E748]/[0.06]' : 'border-[#ef4444]/50 bg-[#ef4444]/[0.06]';

  let upcomingMatchText = 'CONSOLATION GAME';
  if (initialStake === 'GOLD') {
      upcomingMatchText = 'GOLD MEDAL GAME';
      winTitle = intlResult?.isWin ? 'GOLD MEDAL' : 'SILVER MEDAL';
      winIcon = intlResult?.isWin ? '🥇' : '🥈';
      if (!intlResult?.isWin) {
          resultColor = 'text-slate-300';
          resultBg = 'border-slate-400/50 bg-slate-400/[0.06]';
      }
  } else if (initialStake === 'BRONZE') {
      upcomingMatchText = 'BRONZE MEDAL GAME';
      winTitle = intlResult?.isWin ? 'BRONZE MEDAL' : '4TH PLACE';
      winIcon = intlResult?.isWin ? '🥉' : '💔';
      if (intlResult?.isWin) {
          resultColor = 'text-[#F59E0B]';
          resultBg = 'border-[#F59E0B]/50 bg-[#F59E0B]/[0.06]';
      }
  } else if (initialStake === 'SURVIVAL') {
      upcomingMatchText = 'MUST-WIN RELEGATION SCARE';
      winTitle = intlResult?.isWin ? 'SURVIVAL SECURED' : 'RELEGATED';
      winIcon = intlResult?.isWin ? '🛡️' : '📉';
  } else if (initialStake === 'PROMOTION') {
      upcomingMatchText = 'MUST-WIN PROMOTION FINAL';
      winTitle = intlResult?.isWin ? 'PROMOTION SECURED' : 'PROMOTION FAILED';
      winIcon = intlResult?.isWin ? '📈' : '🛑';
  } else if (initialStake === 'CONSOLATION') {
      upcomingMatchText = 'CONSOLATION MATCH';
      winTitle = intlResult?.isWin ? 'CONSOLATION WIN' : 'TOURNAMENT EXIT';
      winIcon = intlResult?.isWin ? '🤝' : '💔';
  }

  const handlePrepChoice = useCallback((c) => {
     let isWin = true;
     let effect = c.winEffect;
     let msg = c.win;

     if (c.isRisky) {
         isWin = Math.random() < c.chance;
         effect = isWin ? c.winEffect : c.failEffect;
         msg = isWin ? c.win : c.fail;
     }

     const withOvr = applyOvrDelta(player, effect.ovr || 0);
     const updatedPlayer = {
        ...withOvr,
        idolatry: capIdol(withOvr.idolatry + (effect.idol || 0)),
        ovr: recomputeOvr(withOvr)
     };
     
     setPlayer(updatedPlayer);
     setSeasonEvents(prev => [...prev, { feedback: msg, effect }]);
     
     setPrepFeedback({ msg, isWin, effect });
     setPrepPhase(false);
  }, [player, setPlayer, setSeasonEvents]);

  const gameChoices = player.pos === 'G'
    ? [
        { label: 'Swallow Rebound', tag: 'AGI', isRisky: false, desc: 'Play conservative angles and absorb the initial shot cleanly.', hover: 'hover:border-[#3b82f6]', pill: 'text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/30', chance: 0.85, win: 'You played a structurally perfect game.', fail: 'You fought the puck and gave up a bad rebound.' },
        { label: 'Aggressive Challenge', tag: 'IQ + AGI', isRisky: true, desc: 'Aggressively challenge their star sniper way out of the crease.', hover: 'hover:border-[#F59E0B]', pill: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30', chance: 0.45 + player.hockeyIQ / 200, win: 'You completely shut down their top line!', fail: 'You were caught out of position and they scored into an empty net.' },
        { label: 'Desperation Save', tag: 'REF + AGI', isRisky: true, desc: 'Bait the backdoor pass and attempt an acrobatic wind-mill glove save.', hover: 'hover:border-[#ef4444]', pill: 'text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]/30', chance: 0.40 + (player.shooting + player.physicality) / 400, win: 'You made a highlight-reel, game-saving stop!', fail: "You guessed wrong and they scored easily." },
      ]
    : [
        { label: 'Dump and Chase', tag: 'IQ', isRisky: false, desc: 'Play smart, situational hockey to maintain possession and eat the clock.', hover: 'hover:border-[#3b82f6]', pill: 'text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/30', chance: 0.85, win: 'You executed the system perfectly.', fail: 'You turned the puck over at the blue line.' },
        { label: 'Big Hit', tag: 'PHY', isRisky: true, desc: 'Step up and try to completely level their star forward along the boards.', hover: 'hover:border-[#F59E0B]', pill: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30', chance: 0.45 + player.physicality / 200, win: 'You laid a massive, momentum-shifting hit!', fail: 'You missed the hit and gave up an odd-man rush.' },
        { label: 'Rush the Net', tag: 'SKT + SHT', isRisky: true, desc: 'Attempt to split the defense and drive hard toward the net for a goal.', hover: 'hover:border-[#ef4444]', pill: 'text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]/30', chance: 0.40 + (player.skating + player.shooting) / 400, win: 'You ripped it top shelf to win the game!', fail: 'You were stripped of the puck and caused a counter-attack.' },
      ];

  return (
    <div className="game-panel p-6 sm:p-12 mt-2 border-t-2 border-t-[#F59E0B] text-center">
      <div className="flex flex-col items-center justify-center mb-6">
          <span className="text-[10px] sm:text-xs font-bold text-[#3b82f6] uppercase tracking-widest bg-[#3b82f6]/10 border border-[#3b82f6]/30 px-4 py-1.5 rounded-full mb-3 shadow-inner">
              CURRENT TIER: {initialDiv}
          </span>
          <h2 className="flex justify-center items-center gap-2 text-3xl sm:text-5xl font-black text-[#F59E0B] sports-font tracking-tighter uppercase leading-tight w-full text-center drop-shadow-md">
            <span className="shrink-0">🌍</span>
            <span>{minigameContext === 'wjc' ? 'WORLD JUNIORS' : (isOlympic ? 'WINTER OLYMPICS' : 'WORLD CHAMPIONSHIP')}</span>
            <span className="shrink-0">🌍</span>
          </h2>
      </div>

      {!showSummary && (
          <p className="text-sm sm:text-lg text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed flex items-center justify-center flex-wrap gap-2 text-center animate-fade-in">
            You are representing <strong className="text-white">{countryName}</strong> in a {upcomingMatchText}!
          </p>
      )}

      {/* PHASE 0: GROUP STAGE SUMMARY */}
      {showSummary && groupData && (
        <div className="max-w-3xl mx-auto fade-up mb-6">
            <div className="bg-[#101410] border border-[rgba(255,255,255,0.065)] p-6 sm:p-8 rounded-xl shadow-2xl text-left mb-6">
                <div className="flex justify-between items-end border-b border-[rgba(255,255,255,0.065)] pb-4 mb-6">
                    <div>
                        <h3 className="text-2xl font-black text-white uppercase sports-font">Group Stage Summary</h3>
                        <p className="text-slate-400 font-sans text-sm mt-1">{groupData.gamesPlayed} Game Round-Robin • Team {countryName}</p>
                    </div>
                    <div className="text-right hidden sm:block">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${initialStake === 'GOLD' || initialStake === 'BRONZE' || initialStake === 'PROMOTION' ? 'bg-[#22E748]/10 text-[#22E748] border-[#22E748]/30' : 'bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/30'}`}>
                            {upcomingMatchText}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-[#1a2230] p-4 sm:p-5 rounded-lg border border-[rgba(255,255,255,0.05)] flex flex-col items-center justify-center shadow-inner">
                        <p className="text-[10px] sm:text-xs text-slate-400 font-bold tracking-widest uppercase mb-1">Group Placement</p>
                        <p className="text-3xl sm:text-4xl font-black text-white sports-font">
                            {groupData.placement} <span className="text-lg text-slate-500">/ {groupData.groupSize}</span>
                        </p>
                    </div>
                    <div className="bg-[#1a2230] p-4 sm:p-5 rounded-lg border border-[rgba(255,255,255,0.05)] flex flex-col items-center justify-center shadow-inner">
                        <p className="text-[10px] sm:text-xs text-slate-400 font-bold tracking-widest uppercase mb-1">Record (W-L-OTL)</p>
                        <p className="text-3xl sm:text-4xl font-black text-white sports-font">
                            <span className="text-[#22E748]">{groupData.record.w}</span>-
                            <span className="text-[#ef4444]">{groupData.record.l}</span>-
                            <span className="text-[#F59E0B]">{groupData.record.otl}</span>
                        </p>
                    </div>
                </div>

                {player.pos !== 'G' && (
                    <div className="bg-[#1a2230] p-4 sm:p-6 rounded-lg border border-[rgba(255,255,255,0.05)] text-center mb-6 shadow-inner">
                        <p className="text-[10px] sm:text-xs text-slate-400 font-bold tracking-widest uppercase mb-4">Your Tournament Stats</p>
                        <div className="grid grid-cols-3 divide-x divide-[rgba(255,255,255,0.1)]">
                            <div className="flex flex-col items-center">
                                <p className="text-3xl sm:text-4xl font-black text-white sports-font">{groupData.stats.g}</p>
                                <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-1">Goals</p>
                            </div>
                            <div className="flex flex-col items-center">
                                <p className="text-3xl sm:text-4xl font-black text-white sports-font">{groupData.stats.a}</p>
                                <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-1">Assists</p>
                            </div>
                            <div className="flex flex-col items-center">
                                <p className="text-3xl sm:text-4xl font-black text-[#3b82f6] sports-font">{groupData.stats.g + groupData.stats.a}</p>
                                <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-1">Points</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            <button 
                onClick={() => setShowSummary(false)} 
                className="btn-primary w-full py-4 sm:py-5 rounded-xl text-lg sm:text-xl sports-font tracking-widest uppercase shadow-2xl transition-transform hover:scale-[1.02]"
            >
                ADVANCE TO {upcomingMatchText} ➔
            </button>
        </div>
      )}

      {/* PHASE 1: PRE-TOURNAMENT PREPARATION SCENARIO */}
      {!showSummary && prepPhase && !intlResult && (
        <div className="max-w-2xl mx-auto fade-up">
           <div className="bg-[#101410] border border-[rgba(255,255,255,0.065)] p-6 sm:p-8 rounded-xl shadow-2xl text-left mb-6">
              <h3 className="text-2xl font-black text-[#3b82f6] mb-3 uppercase sports-font">{scenario.title}</h3>
              <p className="text-slate-300 font-sans leading-relaxed text-sm sm:text-base mb-6">{scenario.desc}</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {scenario.choices.map((c, i) => (
                    <button
                      key={i}
                      onClick={() => handlePrepChoice(c)}
                      className="bg-[#101410] hover:bg-[#1a2230] border border-[rgba(255,255,255,0.065)] text-white p-4 sm:p-5 rounded-xl text-left transition-all cursor-pointer flex flex-col gap-2 shadow-lg group"
                    >
                      <div className="flex justify-between items-start sm:items-center w-full gap-4">
                         <h4 className="text-sm sm:text-base font-bold sports-font uppercase group-hover:text-[#3b82f6] transition-colors text-left leading-tight">{c.label}</h4>
                         <div className="flex items-center gap-2 shrink-0 mt-1 sm:mt-0">
                           {c.isRisky ? (
                              <span className="bg-[#ef4444]/10 text-[#ef4444] text-[10px] sm:text-xs px-2 py-1 rounded font-black tracking-widest uppercase border border-[#ef4444]/30">RISKY</span>
                           ) : (
                              <span className="bg-[#3b82f6]/10 text-[#3b82f6] text-[10px] sm:text-xs px-2 py-1 rounded font-black tracking-widest uppercase border border-[#3b82f6]/30">SAFE</span>
                           )}
                         </div>
                      </div>
                      <p className="text-xs text-slate-400 font-sans mt-2">{c.desc}</p>
                    </button>
                  ))}
              </div>
           </div>
        </div>
      )}

      {/* PHASE 2: THE GAME DECISION */}
      {!showSummary && !prepPhase && !intlResult && (
      <div className="fade-up">
        {prepFeedback && (
            <div className={`mb-8 p-4 border rounded-xl inline-block shadow-md ${prepFeedback.isWin ? 'border-[#22E748]/50 bg-[#22E748]/10 text-[#22E748]' : 'border-red-500/50 bg-red-500/10 text-red-400'}`}>
                <p className="font-bold text-sm tracking-wide uppercase">{prepFeedback.msg}</p>
            </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
          {gameChoices.map((c, i) => (
            <button
              key={i}
              onClick={() => handleMinigameChoice(c.chance, c.win, c.fail, { isRisky: c.isRisky, baseTeamChance: 0.50 })}
              className={`bg-[#101410] hover:bg-[#1a2230] border border-[rgba(255,255,255,0.065)] ${c.hover} p-5 sm:p-6 rounded-xl transition-all cursor-pointer flex flex-col justify-between items-center text-left group shadow-lg min-h-[200px]`}
            >
              <div className="w-full">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-black text-xl sm:text-2xl text-white sports-font leading-tight group-hover:scale-105 transition-transform">
                    {c.label}
                  </h3>
                </div>
                <p className="text-xs text-slate-400 font-sans leading-relaxed mb-4">
                  {c.desc}
                </p>
              </div>

              {/* ODDS & REWARD BADGES */}
              <div className="w-full bg-black/40 rounded-lg p-2.5 border border-[rgba(255,255,255,0.04)] flex flex-col items-center justify-center gap-1.5 font-sans mt-auto">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                  SUCCESS ODDS: <span className={`font-black sports-font text-xs ml-1 ${c.chance >= 0.65 ? 'text-[#22E748]' : c.chance >= 0.50 ? 'text-[#F59E0B]' : 'text-[#ef4444]'}`}>{Math.round(c.chance * 100)}%</span>
                </p>

                <div className="flex justify-center items-center gap-1.5 flex-wrap mt-1">
                  {String(c.tag).split('+').map((statLabel, idx) => {
                    const s = statLabel.trim();
                    let colorCls = 'text-white bg-white/10 border-white/30'; 
                    if (['PHY'].includes(s)) colorCls = 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30'; 
                    if (['SKT', 'AGI'].includes(s)) colorCls = 'text-[#22E748] bg-[#22E748]/10 border-[#22E748]/30'; 
                    if (['SHT', 'REF'].includes(s)) colorCls = 'text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/30'; 
                    if (['IQ'].includes(s)) colorCls = 'text-[#c084fc] bg-[#c084fc]/10 border-[#c084fc]/30'; 
                    if (['STA'].includes(s)) colorCls = 'text-[#06b6d4] bg-[#06b6d4]/10 border-[#06b6d4]/30';
                    
                    return (
                      <span key={idx} className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider whitespace-nowrap border ${colorCls}`}>
                        {s}
                      </span>
                    );
                  })}
                  {/* Pass 2: Show if play is safe/risky on the button itself */}
                  {c.isRisky ? (
                      <span className="text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider whitespace-nowrap border text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]/30">RISKY</span>
                  ) : (
                      <span className="text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider whitespace-nowrap border text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/30">SAFE</span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
      )}

      {/* PHASE 3: FINAL MEDAL RESULT */}
      {intlResult && (
        <div className="max-w-2xl mx-auto mt-2 fade-up">
          <div className={`rounded-2xl border-2 p-6 sm:p-10 flex flex-col items-center text-center ${resultBg}`}>
            <div className="text-5xl sm:text-6xl mb-3 drop-shadow-lg">{winIcon}</div>
            <h3 className={`text-2xl sm:text-4xl font-black sports-font uppercase tracking-tighter mb-4 ${resultColor}`}>
              {winTitle}
            </h3>

            {/* Division Progression Badges */}
            {initialStake === 'PROMOTION' && intlResult.isWin && (
                <div className="bg-[#22E748]/20 border border-[#22E748]/50 text-[#22E748] text-xs sm:text-sm font-black uppercase tracking-widest px-4 py-1.5 rounded-lg mb-4 animate-pulse">
                    PROMOTED TO {player.natDiv}
                </div>
            )}
            {initialStake === 'SURVIVAL' && !intlResult.isWin && (
                <div className="bg-[#ef4444]/20 border border-[#ef4444]/50 text-[#ef4444] text-xs sm:text-sm font-black uppercase tracking-widest px-4 py-1.5 rounded-lg mb-4">
                    RELEGATED TO {player.natDiv}
                </div>
            )}

            <p className="text-base sm:text-xl italic text-slate-300 mb-6 font-sans leading-relaxed">"{intlResult.msg}"</p>

            <div className="flex justify-center items-center gap-2 flex-wrap">
              {intlResult.effect?.idol ? (
                <span className={`text-xs sm:text-sm font-black sports-font tracking-widest px-3 py-1.5 rounded-lg border ${intlResult.effect.idol >= 0 ? 'text-[#22E748] bg-[#22E748]/10 border-[#22E748]/30' : 'text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]/30'}`}>
                  {intlResult.effect.idol >= 0 ? '📈' : '📉'} {intlResult.effect.idol > 0 ? '+' : ''}{intlResult.effect.idol} FANS
                </span>
              ) : null}
              {intlResult.effect?.ovr ? (
                <span className={`text-xs sm:text-sm font-black sports-font tracking-widest px-3 py-1.5 rounded-lg border ${intlResult.effect.ovr >= 0 ? 'text-[#22E748] bg-[#22E748]/10 border-[#22E748]/30' : 'text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]/30'}`}>
                  {intlResult.effect.ovr > 0 ? '+' : ''}{intlResult.effect.ovr} OVR
                </span>
              ) : null}
            </div>
            
            {/* DRAFT STOCK EVOLUTION */}
            {player.age <= 18 && !player.rights && minigameContext === 'wjc' && (
               <p className={`mt-6 text-sm sm:text-base font-black sports-font uppercase tracking-widest ${intlResult.isWin ? 'text-[#3b82f6]' : 'text-[#ef4444]'}`}>
                 {intlResult.isWin ? "📈 SCOUTS ARE BUZZING. YOUR DRAFT STOCK IS RISING!" : "📉 SCOUTS NOTICED THE STRUGGLES. DRAFT STOCK TOOK A HIT."}
               </p>
            )}
          </div>
            
          <button
            onClick={() => { setIntlResult(null); proceedToNextScreen(activeEvent, minigameContext, player); }}
            className="btn-primary py-4 px-12 rounded-xl text-lg sm:text-xl cursor-pointer sports-font tracking-widest w-full mt-6 shadow-2xl"
          >
            CONTINUE CAREER ➔
          </button>
        </div>
      )}
    </div>
  );
}