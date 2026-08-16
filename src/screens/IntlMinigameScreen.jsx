import React from 'react';

// Extracted from App.jsx. Auto-generated with JSX-aware external analysis.
export default function IntlMinigameScreen({ activeEvent, handleMinigameChoice, intlResult, minigameContext, player, proceedToNextScreen, safeNationalities, setIntlResult }) {
  return (() => {
          const nat = safeNationalities.find(n => n.id === player.nat);
          const countryName = nat?.sentenceName || nat?.name || 'your country';

          const choices = player.pos === 'G'
            ? [
                { 
                  label: 'Swallow Rebound',  
                  tag: 'AGI',       
                  desc: 'Absorb the initial shot cleanly into your chest to deny any second-chance opportunities.',
                  hover: 'hover:border-[#F59E0B]', 
                  pill: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30', 
                  chance: 0.4 + player.physicality / 200,                    
                  win: 'You smothered the rebound!',      
                  fail: 'You gave up a juicy rebound.' 
                },
                { 
                  label: 'Direct Traffic',   
                  tag: 'IQ',        
                  desc: 'Completely control crease positioning and shout out defensive assignments during the rush.',
                  hover: 'hover:border-[#22E748]', 
                  pill: 'text-[#22E748] bg-[#22E748]/10 border-[#22E748]/30', 
                  chance: 0.4 + player.hockeyIQ / 200,                       
                  win: 'You perfectly directed traffic!', 
                  fail: 'You were out of position.' 
                },
                { 
                  label: 'Desperation Save', 
                  tag: 'REF + AGI', 
                  desc: 'Make an acrobatic wind-mill glove save on a late backdoor cross-crease pass.',
                  hover: 'hover:border-[#3b82f6]', 
                  pill: 'text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/30', 
                  chance: 0.4 + (player.shooting + player.physicality) / 400, 
                  win: 'You made an unbelievable save!',   
                  fail: "Couldn't get there in time." 
                },
              ]
            : [
                { 
                  label: 'Big Hit',       
                  tag: 'PHY',       
                  desc: 'Step into their star forward along the boards to set an aggressive physical tone.',
                  hover: 'hover:border-[#F59E0B]', 
                  pill: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30', 
                  chance: 0.4 + player.physicality / 200,                 
                  win: 'You laid a massive hit!',  
                  fail: 'You missed the hit.' 
                },
                { 
                  label: 'Find Open Ice', 
                  tag: 'IQ',        
                  desc: 'Read the defensive coverage to slip into the high slot for a clean, unguarded shot.',
                  hover: 'hover:border-[#22E748]', 
                  pill: 'text-[#22E748] bg-[#22E748]/10 border-[#22E748]/30', 
                  chance: 0.4 + player.hockeyIQ / 200,                    
                  win: 'You found the soft spot!', 
                  fail: 'Skated into coverage.' 
                },
                { 
                  label: 'Rush the Net',  
                  tag: 'SKT + SHT', 
                  desc: 'Burn past their defenseman down the wing and drive hard toward the net for a goal.',
                  hover: 'hover:border-[#3b82f6]', 
                  pill: 'text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/30', 
                  chance: 0.4 + (player.skating + player.shooting) / 400, 
                  win: 'You ripped it top shelf!', 
                  fail: 'Fumbled the puck.' 
                },
              ];

          return (
            <div className="game-panel p-6 sm:p-12 mt-2 border-t-2 border-t-[#F59E0B] text-center">
              <h2 className="text-4xl sm:text-5xl font-black mb-4 text-[#F59E0B] sports-font tracking-tighter uppercase leading-tight">🌍INTERNATIONAL DUTY🌍</h2>
              <p className="text-base sm:text-xl text-slate-300 mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed flex items-center justify-center flex-wrap gap-2 text-left">
                You are representing <span className="font-black text-white flex items-center gap-2">{countryName} <img src={nat?.img} alt={player.nat} className="w-6 h-4 object-cover rounded-[2px] border border-slate-600" /></span> in the {minigameContext === 'wjc' ? 'World Junior Gold Medal game' : 'Winter Games Final'}!
              </p>

              {!intlResult && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
                {choices.map((c, i) => (
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
              )}

              {/* INLINE RESULT — cause (the setup above) and effect on one screen,
                  no separate Verdict step. */}
              {intlResult && (
                <div className="max-w-2xl mx-auto mt-2 fade-up">
                  <div className={`rounded-2xl border-2 p-6 sm:p-10 flex flex-col items-center text-center ${intlResult.isWin ? 'border-[#22E748]/50 bg-[#22E748]/[0.06]' : 'border-[#ef4444]/50 bg-[#ef4444]/[0.06]'}`}>
                    <div className="text-5xl sm:text-6xl mb-3">{intlResult.isWin ? '🥇' : '💔'}</div>
                    <h3 className={`text-2xl sm:text-4xl font-black sports-font uppercase tracking-tighter mb-4 ${intlResult.isWin ? 'text-[#22E748]' : 'text-[#ef4444]'}`}>
                      {intlResult.isWin ? 'GOLD MEDAL' : 'HEARTBREAK'}
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
        })();
}
