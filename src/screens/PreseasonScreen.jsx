import { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../AppContext';
import { getFullTeamName } from '../utils/appHelpers';

const getArchetypes = (pos) => {
  const isGoalie = pos === 'G';
  const isDef = pos === 'LD' || pos === 'RD';

  if (isGoalie) {
    return [
      // For goalies: skating = positioning, shooting = reflexes, physicality = agility
      { id: 'arch_bfly', tag: 'POS', name: 'Butterfly Specialist', flavor: 'You rely on perfect positioning and dropping to the ice efficiently to take away the lower half of the net.', desc: '+8 POS', effect: { skating: 8 } },
      { id: 'arch_hyb', tag: 'REF', name: 'Athletic Hybrid', flavor: 'You combine technical positioning with explosive, athletic desperation saves when the play breaks down.', desc: '+8 REF', effect: { shooting: 8 } },
      { id: 'arch_all_g', tag: 'ELITE', name: 'Fundamentally Sound', flavor: 'You are a jack-of-all-trades in the crease. No glaring weaknesses, just rock-solid consistency.', desc: '+4 ALL', effect: { shooting: 4, skating: 4, physicality: 4, hockeyIQ: 4, stamina: 4 } }
    ];
  } else if (isDef) {
    return [
      { id: 'arch_ofd', tag: 'SKT', name: 'Offensive Dynamo', flavor: 'You act as a fourth forward, driving the rush and commanding the powerplay from the blue line.', desc: '+8 SKT', effect: { skating: 8 } },
      { id: 'arch_dfd', tag: 'PHY', name: 'Shutdown Defender', flavor: 'You clear the crease, block shots, and make life absolutely miserable for opposing forwards.', desc: '+8 PHY', effect: { physicality: 8 } },
      { id: 'arch_all_d', tag: 'ELITE', name: 'Two-Way Defender', flavor: 'You pride yourself on a complete 200-foot game. You can jump into the rush or lock down the opponent\'s top line.', desc: '+4 ALL', effect: { shooting: 4, skating: 4, physicality: 4, hockeyIQ: 4, stamina: 4 } }
    ];
  } else {
    // Forwards (C, LW, RW)
    return [
      { id: 'arch_snp', tag: 'SHT', name: 'Pure Sniper', flavor: 'You have a lethal, lightning-fast release and a relentless hunger to put the puck in the back of the net.', desc: '+8 SHT', effect: { shooting: 8 } },
      { id: 'arch_ply', tag: 'IQ', name: 'Elite Playmaker', flavor: 'You see the ice like a chess board, manipulating defenders to open up passing lanes for your teammates.', desc: '+8 IQ', effect: { hockeyIQ: 8 } },
      { id: 'arch_all_f', tag: 'ELITE', name: 'Two-Way Forward', flavor: 'You play a complete 200-foot game. You are just as comfortable backchecking as you are leading the rush.', desc: '+4 ALL', effect: { shooting: 4, skating: 4, physicality: 4, hockeyIQ: 4, stamina: 4 } }
    ];
  }
};

// Auto-extracted from App.jsx. Receives state/handlers/App-scope components as props.
export default function PreseasonScreen() {
  const { activeTrainings, currentYear, handleTrain, player, setPlayer, checkEarlyDemotion } = useAppContext();
  
  // Track the demotion data
  const [demotionNotice, setDemotionNotice] = useState(null);
  // Use a ref instead of state so we don't trigger cascading renders!
  const hasChecked = useRef(false);

  useEffect(() => {
    if (checkEarlyDemotion && !hasChecked.current) {
        const demotion = checkEarlyDemotion();
        hasChecked.current = true; 
        
        if (demotion) {
           // Push the state updates to the end of the event queue to satisfy the linter
           setTimeout(() => {
               setDemotionNotice(demotion);
               setPlayer(p => {
                   const newTeams = Array.from(new Set([...(p.teamsPlayedFor || []), demotion.team]));
                   return { ...p, team: demotion.team, league: demotion.lg, teamsPlayedFor: newTeams };
               });
           }, 0);
        }
    }
  }, [checkEarlyDemotion, setPlayer]);

  const handleAcknowledgeDemotion = () => {
    setDemotionNotice(null);
  };

  const trainingOptions = currentYear === 2026 ? getArchetypes(player.pos) : activeTrainings;

  return (
          <div className="game-panel mt-2 relative z-20">
            {/* If there is a demotion, show ONLY the demotion screen! */}
            {demotionNotice ? (
              <div className="p-6 sm:p-10 border-t-2 border-t-slate-500 bg-gradient-to-br from-[#0f1115] to-[#050608] relative overflow-hidden flex flex-col justify-center items-center text-center shadow-[0_0_40px_rgba(100,116,139,0.15)] min-h-[400px]">
                 <div className="bluechip-foil-overlay opacity-30 mix-blend-overlay grayscale absolute inset-0 pointer-events-none"></div>
                 <div className="relative z-10 w-full max-w-xl mx-auto flex flex-col items-center">
                   <h2 className="text-4xl sm:text-5xl font-black text-slate-300 sports-font mb-4 uppercase">
                      {demotionNotice.reason === 'CLAIMED' ? 'CLAIMED OFF WAIVERS' : 
                       demotionNotice.reason === '9_GAME_RULE' ? 'RETURNED TO JUNIORS' : 
                       demotionNotice.reason === 'ECHL_REASSIGNMENT' ? 'SENT TO THE COAST' : 'SENT DOWN'}
                   </h2>
                   <p className="text-lg sm:text-xl text-slate-400 mb-10">
                      {demotionNotice.reason === 'CLAIMED' ? (
                          <>Your GM attempted to send you down, but you were claimed off waivers! You are now playing for the <strong className="text-white">{getFullTeamName(demotionNotice.team, 'NHL')}</strong>.</>
                      )
                          : demotionNotice.reason === '9_GAME_RULE' 
                          ? `After training camp, the front office determined you need one more year of seasoning. You have been returned to the ${getFullTeamName(demotionNotice.team, demotionNotice.lg)}.`
                          : demotionNotice.reason === 'ECHL_REASSIGNMENT'
                          ? `You have been reassigned from the AHL to the ${getFullTeamName(demotionNotice.team, 'ECHL')} (ECHL). It's time to put your head down and grind your way back up the depth chart.`
                          : `The front office has assigned you to the ${getFullTeamName(demotionNotice.team, 'AHL')} (AHL) to start the season.`}
                   </p>
                   <button 
                      onClick={handleAcknowledgeDemotion}
                      className="bg-[#101410] hover:bg-[#1a2230] text-slate-300 hover:text-white font-black sports-font tracking-widest text-xl px-12 py-5 rounded-xl border border-slate-700 hover:border-slate-500 shadow-lg transition-all w-full cursor-pointer active:scale-95 uppercase"
                   >
                      Head down and work
                   </button>
                 </div>
              </div>
            ) : (
              /* Once acknowledged, show the normal Training Camp OR Archetype Selection! */
              <div className="p-6 sm:p-10 border-t-2 border-t-[#22E748]">
                 <div className="flex flex-col items-start border-b border-[rgba(255,255,255,0.065)] pb-4 mb-6">
                    <span className="text-[10px] sm:text-xs font-bold text-[#3b82f6] uppercase tracking-widest font-sans border border-[#3b82f6]/30 px-2.5 py-1 rounded bg-[#3b82f6]/10 mb-2">
                      {currentYear === 2026 ? "PLAYER ARCHETYPE" : "OFF-SEASON DEVELOPMENT"}
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-black italic text-white uppercase sports-font tracking-tighter">
                      {currentYear === 2026 ? "WHAT KIND OF PLAYER ARE YOU?" : `PRE-SEASON ${currentYear}`}
                    </h2>
                    <p className="text-slate-400 text-sm sm:text-base font-sans mt-1">
                      {currentYear === 2026 ? "Before you step on the ice, you need to define your identity. This choice will shape the foundation of your career." : "The coaching staff has prepared three training programs. Pick your focus."}
                    </p>
                  </div>

                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 w-full pb-6 pt-2">
                    {trainingOptions.map(t => (
                      <button
                        type="button"
                        key={t.id}
                        onClick={() => handleTrain(t)}
                        className={`bg-[#101410] border border-[rgba(255,255,255,0.065)] rounded-xl cursor-pointer transition-all hover:-translate-y-1 flex flex-col min-h-[12rem] sm:min-h-[16rem] text-left relative z-30 ${currentYear === 2026 ? 'hover:border-[#c084fc] shadow-[0_0_15px_rgba(192,132,252,0.1)]' : t.rarity === 'Epic' ? 'hover:border-[#F59E0B]' : t.rarity === 'Rare' ? 'hover:border-[#3b82f6]' : 'hover:border-[#22E748]'}`}
                      >
                        <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between w-full pointer-events-none">
                          <div>
                            <div className="flex justify-between items-start gap-2 mb-4 w-full min-w-0">
                              {t.rarity !== 'Common' && currentYear !== 2026 ? (
                                <span className={`shrink-0 text-[9px] sm:text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest font-sans ${t.rarity === 'Epic' ? 'bg-[#F59E0B] text-black' : 'bg-[#3b82f6] text-white'}`}>{t.rarity}</span>
                              ) : <span className="shrink-0"></span>}
                              <span className="text-sm sm:text-base lg:text-sm xl:text-base font-black text-slate-700 uppercase sports-font tracking-tight text-right leading-tight shrink min-w-0">
                                {{
                                  'SHT': player.pos === 'G' ? 'REFLEXES' : 'SHOOTING', 
                                  'SKT': player.pos === 'G' ? 'POSITION' : 'SKATING', 
                                  'PHY': player.pos === 'G' ? 'AGILITY' : 'POWER',
                                  'IQ': 'HOCKEY IQ', 'MIND': 'HOCKEY IQ',
                                  'STA': 'STAMINA', 'STM': 'STAMINA',
                                  'REF': 'REFLEXES', 'POS': 'POSITION', 'AGI': 'AGILITY',
                                  'TECH': 'TECHNIQUE', 'GRIT': 'GRIT', 'POW': 'POWER',
                                  'SKL': 'SKILL', 'PRO': 'PROGRAM', 'ELITE': 'ELITE',
                                  'EYES': 'VISION', 'FLEX': 'FLEXIBILITY'
                                }[t.tag] || t.tag}
                              </span>
                            </div>
                            <h3 className="text-xl sm:text-2xl font-black text-white uppercase leading-tight mb-3 text-left sports-font mt-2">{t.name}</h3>
                            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed italic text-left font-sans mb-4">{t.flavor}</p>
                          </div>

                          <div className="mt-auto text-left pt-4 border-t border-[rgba(255,255,255,0.065)] w-full flex flex-wrap items-center gap-1.5">
                            {(t.desc || '').split(',').map((boost, idx) => {
                              const trimmed = boost.trim();
                              const parts = trimmed.split(/\s+/);
                              const val = parts[0] || '';
                              const stat = (parts[1] || '').toUpperCase();
                              
                              let displayStat = stat;
                              if (player.pos === 'G') {
                                 if (stat === 'PHY') displayStat = 'AGI';
                                 if (stat === 'SHT') displayStat = 'REF';
                                 if (stat === 'SKT') displayStat = 'POS';
                              } else {
                                 if (stat === 'PHY') displayStat = 'POW';
                              }

                              let colorCls = 'text-white bg-white/10 border-white/30';
                              if (['PHY', 'POW', 'AGI'].includes(stat)) colorCls = 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30';
                              if (['SKT', 'POS'].includes(stat)) colorCls = 'text-[#22E748] bg-[#22E748]/10 border-[#22E748]/30';
                              if (['SHT', 'REF'].includes(stat)) colorCls = 'text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/30';
                              if (['IQ', 'MIND'].includes(stat)) colorCls = 'text-[#c084fc] bg-[#c084fc]/10 border-[#c084fc]/30';
                              if (['STA', 'STM'].includes(stat)) colorCls = 'text-[#06b6d4] bg-[#06b6d4]/10 border-[#06b6d4]/30';
                              if (stat === 'ALL') colorCls = 'text-white bg-white/20 border-white/60 drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]';
                              
                              return (
                                <span
                                  key={idx}
                                  className={`text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider whitespace-nowrap border ${colorCls}`}
                                >
                                  {val} {displayStat}
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
          </div>
  );
}