import { useState, useCallback } from 'react';
import { useAppContext } from '../AppContext';
import { applyOvrDelta, recomputeOvr, capIdol } from '../utils/gameHelpers';

// Move the static pool completely outside the component so it doesn't re-create on render
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
  
  const [prepPhase, setPrepPhase] = useState(true);
  const [prepFeedback, setPrepFeedback] = useState(null);
  
  const [scenario] = useState(() => PREP_SCENARIOS[Math.floor(Math.random() * PREP_SCENARIOS.length)]);

  const nat = safeNationalities.find(n => n.id === player.nat);
  const countryName = nat?.sentenceName || nat?.name || 'your country';

  const tourneyName = minigameContext === 'wjc' ? 'World Junior Championship' 
                    : minigameContext === 'olympics' ? 'Winter Games' 
                    : 'World Championship';

  // --- Dynamic Match Naming based on Nation Tier ---
  const isTier12 = !nat || nat.tier <= 2;
  const isTier3 = nat?.tier === 3;
  
  const matchLabel = isTier12 ? 'Gold Medal game' : isTier3 ? 'Top Division Survival game' : 'Division Promotion game';
  const winTitle = isTier12 ? 'GOLD MEDAL' : isTier3 ? 'SURVIVAL SECURED' : 'PROMOTION SECURED';
  const winIcon = isTier12 ? '🥇' : isTier3 ? '🛡️' : '📈';

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
        { label: 'Swallow Rebound', tag: 'AGI', desc: 'Absorb the initial shot cleanly into your chest to deny any second-chance opportunities.', hover: 'hover:border-[#F59E0B]', pill: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30', chance: 0.4 + player.physicality / 200, win: 'You smothered the rebound!', fail: 'You gave up a juicy rebound.' },
        { label: 'Direct Traffic', tag: 'IQ', desc: 'Completely control crease positioning and shout out defensive assignments during the rush.', hover: 'hover:border-[#22E748]', pill: 'text-[#22E748] bg-[#22E748]/10 border-[#22E748]/30', chance: 0.4 + player.hockeyIQ / 200, win: 'You perfectly directed traffic!', fail: 'You were out of position.' },
        { label: 'Desperation Save', tag: 'REF + AGI', desc: 'Make an acrobatic wind-mill glove save on a late backdoor cross-crease pass.', hover: 'hover:border-[#3b82f6]', pill: 'text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/30', chance: 0.4 + (player.shooting + player.physicality) / 400, win: 'You made an unbelievable save!', fail: "Couldn't get there in time." },
      ]
    : [
        { label: 'Big Hit', tag: 'PHY', desc: 'Step into their star forward along the boards to set an aggressive physical tone.', hover: 'hover:border-[#F59E0B]', pill: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30', chance: 0.4 + player.physicality / 200, win: 'You laid a massive hit!', fail: 'You missed the hit.' },
        { label: 'Find Open Ice', tag: 'IQ', desc: 'Read the defensive coverage to slip into the high slot for a clean, unguarded shot.', hover: 'hover:border-[#22E748]', pill: 'text-[#22E748] bg-[#22E748]/10 border-[#22E748]/30', chance: 0.4 + player.hockeyIQ / 200, win: 'You found the soft spot!', fail: 'Skated into coverage.' },
        { label: 'Rush the Net', tag: 'SKT + SHT', desc: 'Burn past their defenseman down the wing and drive hard toward the net for a goal.', hover: 'hover:border-[#3b82f6]', pill: 'text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/30', chance: 0.4 + (player.skating + player.shooting) / 400, win: 'You ripped it top shelf!', fail: 'Fumbled the puck.' },
      ];

  return (
    <div className="game-panel p-6 sm:p-12 mt-2 border-t-2 border-t-[#F59E0B] text-center">
      <h2 className="flex justify-center items-center gap-1 text-4xl sm:text-5xl font-black mb-4 text-[#F59E0B] sports-font tracking-tighter uppercase leading-tight w-full text-center">
        <span className="shrink-0">🌍</span>
        <span>{tourneyName}</span>
        <span className="shrink-0">🌍</span>
      </h2>
      <p className="text-base sm:text-xl text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed flex items-center justify-center flex-wrap gap-2 text-left">
        You are representing <span className="font-black text-white flex items-center gap-2">{countryName} <img src={nat?.img} alt={player.nat} className="w-6 h-4 object-cover rounded-[2px] border border-slate-600" /></span> in the {matchLabel}!
      </p>

      {/* PHASE 1: PRE-TOURNAMENT PREPARATION SCENARIO */}
      {prepPhase && !intlResult && (
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
      {!prepPhase && !intlResult && (
      <div className="fade-up">
        {prepFeedback && (
            <div className={`mb-8 p-4 border rounded-xl inline-block ${prepFeedback.isWin ? 'border-[#22E748]/50 bg-[#22E748]/10 text-[#22E748]' : 'border-red-500/50 bg-red-500/10 text-red-400'}`}>
                <p className="font-bold text-sm tracking-wide uppercase">{prepFeedback.msg}</p>
            </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
          {gameChoices.map((c, i) => (
            <button
              key={i}
              onClick={() => handleMinigameChoice(c.chance, c.win, c.fail)}
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

                <div className="flex justify-center items-center gap-1.5 flex-wrap">
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
          <div className={`rounded-2xl border-2 p-6 sm:p-10 flex flex-col items-center text-center ${intlResult.isWin ? 'border-[#22E748]/50 bg-[#22E748]/[0.06]' : 'border-[#ef4444]/50 bg-[#ef4444]/[0.06]'}`}>
            <div className="text-5xl sm:text-6xl mb-3">{intlResult.isWin ? winIcon : '💔'}</div>
            <h3 className={`text-2xl sm:text-4xl font-black sports-font uppercase tracking-tighter mb-4 ${intlResult.isWin ? 'text-[#22E748]' : 'text-[#ef4444]'}`}>
              {intlResult.isWin ? winTitle : 'HEARTBREAK'}
            </h3>
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
            
            {/* DRAFT STOCK EVOLUTION (Only for undrafted prospects!) */}
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