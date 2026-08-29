import { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../AppContext';
import { getFullTeamName } from '../utils/appHelpers';

const ARCHETYPE_POOLS = {
  G: {
    pool: [
      { id: 'arch_bfly', tag: 'POS', name: 'Butterfly Specialist', flavor: 'You rely on perfect positioning and dropping to the ice efficiently to take away the lower half of the net.', desc: '+8 POS', effect: { skating: 8 } },
      { id: 'arch_hyb', tag: 'REF', name: 'Athletic Hybrid', flavor: 'You combine technical positioning with explosive, athletic desperation saves when the play breaks down.', desc: '+8 REF', effect: { shooting: 8 } },
      { id: 'arch_trk', tag: 'IQ', name: 'Puck Tracker', flavor: 'You read the play incredibly well, tracking the puck through traffic and anticipating passes before they happen.', desc: '+8 IQ', effect: { hockeyIQ: 8 } },
      { id: 'arch_acr', tag: 'AGI', name: 'Acrobatic', flavor: 'You rely on elite flexibility and raw athleticism to make highlight-reel saves that defy logic.', desc: '+8 AGI', effect: { physicality: 8 } }
    ],
    elite: { id: 'arch_all_g', tag: 'ELITE', name: 'Fundamentally Sound', flavor: 'You are a jack-of-all-trades in the crease. No glaring weaknesses, just rock-solid consistency.', desc: '+4 ALL', effect: { shooting: 4, skating: 4, physicality: 4, hockeyIQ: 4, stamina: 4 } }
  },
  D: {
    pool: [
      { id: 'arch_ofd', tag: 'SKT', name: 'Offensive Dynamo', flavor: 'You act as a fourth forward, driving the rush and commanding the powerplay from the blue line.', desc: '+8 SKT', effect: { skating: 8 } },
      { id: 'arch_dfd', tag: 'PHY', name: 'Shutdown Defender', flavor: 'You clear the crease, block shots, and make life absolutely miserable for opposing forwards.', desc: '+8 PHY', effect: { physicality: 8 } },
      { id: 'arch_qb', tag: 'IQ', name: 'Powerplay QB', flavor: 'You have elite vision and passing ability, perfectly distributing the puck to your offensive weapons.', desc: '+8 IQ', effect: { hockeyIQ: 8 } },
      { id: 'arch_bom', tag: 'SHT', name: 'Point Bomber', flavor: 'You possess a terrifyingly heavy slapshot that forces forwards to think twice before blocking it.', desc: '+8 SHT', effect: { shooting: 8 } }
    ],
    elite: { id: 'arch_all_d', tag: 'ELITE', name: 'Two-Way Defender', flavor: 'You pride yourself on a complete 200-foot game. You can jump into the rush or lock down the opponent\'s top line.', desc: '+4 ALL', effect: { shooting: 4, skating: 4, physicality: 4, hockeyIQ: 4, stamina: 4 } }
  },
  F: {
    pool: [
      { id: 'arch_snp', tag: 'SHT', name: 'Pure Sniper', flavor: 'You have a lethal, lightning-fast release and a relentless hunger to put the puck in the back of the net.', desc: '+8 SHT', effect: { shooting: 8 } },
      { id: 'arch_ply', tag: 'IQ', name: 'Elite Playmaker', flavor: 'You see the ice like a chess board, manipulating defenders to open up passing lanes for your teammates.', desc: '+8 IQ', effect: { hockeyIQ: 8 } },
      { id: 'arch_spd', tag: 'SKT', name: 'Speed Demon', flavor: 'You are an absolute blur on the ice. Defenders back off immediately because they respect your sheer breakaway speed.', desc: '+8 SKT', effect: { skating: 8 } },
      { id: 'arch_pwf', tag: 'PHY', name: 'Power Forward', flavor: 'You drop your shoulders, drive hard to the net, and physically overpower anyone who stands in your way.', desc: '+8 PHY', effect: { physicality: 8 } }
    ],
    elite: { id: 'arch_all_f', tag: 'ELITE', name: 'Two-Way Forward', flavor: 'You play a complete 200-foot game. You are just as comfortable backchecking as you are leading the rush.', desc: '+4 ALL', effect: { shooting: 4, skating: 4, physicality: 4, hockeyIQ: 4, stamina: 4 } }
  }
};

export default function PreseasonScreen() {
  const { activeTrainings, currentYear, handleTrain, player, setPlayer, checkEarlyDemotion } = useAppContext();
  
  const [rosterMoveNotice, setRosterMoveNotice] = useState(null);
  const hasChecked = useRef(false);

  // Lazily initialize random archetypes so they don't re-roll if the screen renders twice
  const [randomizedArchetypes] = useState(() => {
      const isGoalie = player.pos === 'G';
      const isDef = player.pos === 'LD' || player.pos === 'RD';
      const posType = isGoalie ? 'G' : isDef ? 'D' : 'F';
      
      const data = ARCHETYPE_POOLS[posType];
      const shuffled = [...data.pool].sort(() => 0.5 - Math.random());
      
      return [shuffled[0], shuffled[1], data.elite];
  });

  useEffect(() => {
    if (checkEarlyDemotion && !hasChecked.current) {
        const move = checkEarlyDemotion();
        hasChecked.current = true; 
        
        if (move) {
           setTimeout(() => {
               let title = 'SENT DOWN';
               let desc = `The front office has assigned you to the ${getFullTeamName(move.team, 'AHL')} (AHL) to start the season.`;
               let type = 'DEMOTION';

               if (move.reason === 'CLAIMED') {
                   title = 'CLAIMED OFF WAIVERS';
                   desc = `Your GM attempted to send you down, but you were claimed off waivers! You are now playing for the ${getFullTeamName(move.team, 'NHL')}.`;
               } else if (move.reason === '9_GAME_RULE') {
                   title = 'RETURNED TO JUNIORS';
                   desc = `After training camp, the front office determined you need one more year of seasoning. You have been returned to the ${getFullTeamName(move.team, move.lg)}.`;
               } else if (move.reason === 'ECHL_REASSIGNMENT') {
                   title = 'SENT TO THE COAST';
                   desc = `You have been reassigned from the AHL to the ${getFullTeamName(move.team, 'ECHL')} (ECHL). It's time to put your head down and grind your way back up the depth chart.`;
               } else if (move.reason === 'PROMOTION') { 
                   title = 'MADE THE ROSTER';
                   desc = `You had an incredible camp and forced the coach's hand. You are starting the season on the ${getFullTeamName(move.team, move.lg)} roster!`;
                   type = 'PROMOTION';
               }

               setRosterMoveNotice({ ...move, title, desc, type });

               setPlayer(p => {
                   const newTeams = Array.from(new Set([...(p.teamsPlayedFor || []), move.team]));
                   return { ...p, team: move.team, league: move.lg, teamsPlayedFor: newTeams };
               });
           }, 0);
        }
    }
  }, [checkEarlyDemotion, setPlayer]);

  const handleAcknowledgeMove = () => {
    setRosterMoveNotice(null);
  };

  const trainingOptions = currentYear === 2026 ? randomizedArchetypes : activeTrainings;

  return (
          <div className="game-panel mt-2 relative z-20">
            {rosterMoveNotice ? (
              <div className="p-6 sm:p-10 border-t-2 border-t-slate-500 bg-gradient-to-br from-[#0f1115] to-[#050608] relative overflow-hidden flex flex-col justify-center items-center text-center shadow-[0_0_40px_rgba(100,116,139,0.15)] min-h-[400px]">
                 <div className="bluechip-foil-overlay opacity-30 mix-blend-overlay grayscale absolute inset-0 pointer-events-none"></div>
                 <div className="relative z-10 w-full max-w-xl mx-auto flex flex-col items-center">
                   <h2 className={`text-4xl sm:text-5xl font-black sports-font mb-4 uppercase ${rosterMoveNotice.type === 'PROMOTION' ? 'text-[#22E748]' : 'text-slate-300'}`}>
                      {rosterMoveNotice.title}
                   </h2>
                   <p className="text-lg sm:text-xl text-slate-400 mb-10">
                      {rosterMoveNotice.desc}
                   </p>
                   <button 
                      onClick={handleAcknowledgeMove}
                      className="bg-[#101410] hover:bg-[#1a2230] text-slate-300 hover:text-white font-black sports-font tracking-widest text-xl px-12 py-5 rounded-xl border border-slate-700 hover:border-slate-500 shadow-lg transition-all w-full cursor-pointer active:scale-95 uppercase"
                   >
                      {rosterMoveNotice.type === 'PROMOTION' ? 'HIT THE ICE' : 'HEAD DOWN AND WORK'}
                   </button>
                 </div>
              </div>
            ) : (
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
                        // B1: Effort in training camp slightly bumps Front Office trust
                        onClick={() => {
                            setPlayer(p => ({
                                ...p,
                                relationships: { ...p.relationships, coach: Math.min(100, (p.relationships?.coach || 50) + 5) }
                            }));
                            handleTrain(t);
                        }}
                        className={`bg-[#101410] border border-[rgba(255,255,255,0.065)] rounded-xl cursor-pointer transition-all hover:-translate-y-1 flex flex-col min-h-[12rem] sm:min-h-[16rem] text-left relative z-30 ${currentYear === 2026 ? 'hover:border-[#c084fc] shadow-[0_0_15px_rgba(192,132,252,0.1)]' : t.rarity === 'Epic' ? 'hover:border-[#F59E0B]' : t.rarity === 'Rare' ? 'hover:border-[#3b82f6]' : 'hover:border-[#22E748]'}`}
                      >
                        <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between w-full pointer-events-none">
                          <div>
                            <div className="mb-3 flex flex-col items-start gap-1">
                              {t.rarity && (
                                <div className={`flex items-center gap-2 w-full ${
                                  t.rarity === 'Epic' ? 'text-[#F59E0B]' :
                                  t.rarity === 'Rare' ? 'text-[#3b82f6]' :
                                  'text-[#22E748] opacity-80'
                                }`}>
                                  <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] leading-none">
                                    {t.rarity}
                                  </span>
                                  <div className="flex-1 h-px bg-current opacity-30"></div>
                                </div>
                              )}
                              <h3 className="text-lg xl:text-xl tracking-tight font-black text-white uppercase leading-tight text-left sports-font mt-1">
                                {t.name}
                              </h3>
                            </div>
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
                                  className={`text-xs sm:text-sm font-black px-3 py-1 rounded-md uppercase tracking-wider whitespace-nowrap border sports-font ${colorCls}`}
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