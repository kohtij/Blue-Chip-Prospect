import { useState, useEffect } from 'react';
import { useAppContext } from '../AppContext';
import { MASTER_ACHIEVEMENTS } from '../utils/appHelpers';
import { formatMoney } from '../utils/gameHelpers';
import TeamLogo from '../components/TeamLogo';

export default function CreationScreen() {
  const { handleStart, player, safeNationalities, setPlayer, setShowAchievementsMenu, showAchievementsMenu, unlockedAchievements } = useAppContext();
  
  const [showRecordsMenu, setShowRecordsMenu] = useState(false);
  const [showManualSetup, setShowManualSetup] = useState(false);
  const [isQuickStarting, setIsQuickStarting] = useState(false);
    
  const [savedCareers] = useState(() => {
    try { return JSON.parse(localStorage.getItem('hockey_career_history') || '[]'); } 
    catch { return []; }
  });

  useEffect(() => {
    if (isQuickStarting && player.startLeague && player.nat) handleStart();
  }, [isQuickStarting, player.startLeague, player.nat, handleStart]);

  const handleQuickStart = () => {
    const leagues = ['OHL', 'WHL', 'QMJHL', 'USHL', 'SHL', 'LIIGA'];
    const randomLg = leagues[Math.floor(Math.random() * leagues.length)];
    const randomNat = safeNationalities[Math.floor(Math.random() * safeNationalities.length)].id;
    
    setPlayer(p => ({ ...p, startLeague: randomLg, nat: randomNat, team: null }));
    setIsQuickStarting(true);
  };

  return (
          <div className="min-h-screen flex items-center justify-center p-6 text-white relative">

            {/* LAYER 1: base radial ambient glow — dim green heartbeat at center,
                fading to deep black at the edges. Using fixed positioning ensures 
                it covers the entire browser window seamlessly. */}
            <div
              className="fixed inset-0 pointer-events-none z-[-1]"
              style={{
                background: 'radial-gradient(ellipse 80% 60% at center, rgba(16, 40, 24, 1) 0%, rgba(8, 16, 12, 1) 40%, #030303 100%)'
              }}
            />

            {/* LAYER 2: spotlight cone from above — like arena rigging casting
                a soft beam down onto the panel. */}
            <div
              className="fixed inset-0 pointer-events-none z-[-1]"
              style={{
                background: 'radial-gradient(ellipse 50% 90% at center top, rgba(34, 231, 72, 0.10) 0%, transparent 60%)'
              }}
            />

            {/* LAYER 3: vignette — darkens the outer corners so the eye is
                drawn firmly to the center. */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0, 0, 0, 0.4) 100%)'
              }}
            />

            {/* LAYER 4: faint rink-line pattern — abstract circles suggesting
                a hockey rink's face-off circles, extremely low opacity. Sits
                well behind everything else. */}
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.04]"
              style={{
                backgroundImage: `
                  radial-gradient(circle at 20% 30%, transparent 80px, rgba(34,231,72,0.5) 82px, transparent 84px),
                  radial-gradient(circle at 80% 70%, transparent 80px, rgba(34,231,72,0.5) 82px, transparent 84px),
                  radial-gradient(circle at 50% 50%, transparent 120px, rgba(34,231,72,0.4) 122px, transparent 124px)
                `
              }}
            />

            {/* LAYER 5: drifting ice particles — 12 slow-rising specks with
                staggered timings and positions. Pure CSS, no state, no
                intervals, zero JS overhead. */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(12)].map((_, i) => (
                <span
                  key={`particle-${i}`}
                  className="absolute rounded-full bg-white"
                  style={{
                    width: `${1 + (i % 3)}px`,
                    height: `${1 + (i % 3)}px`,
                    left: `${(i * 8.3) % 100}%`,
                    bottom: '-10px',
                    opacity: 0,
                    boxShadow: '0 0 4px rgba(34,231,72,0.6)',
                    animation: `creationDrift ${18 + (i % 6) * 3}s linear ${i * 2.5}s infinite`
                  }}
                />
              ))}
            </div>

            <style>{`
              @keyframes creationBorderPulse {
                0%, 100% { box-shadow: 0 0 30px rgba(34, 231, 72, 0.20), 0 0 0 1px rgba(34, 231, 72, 0.10); }
                50%      { box-shadow: 0 0 60px rgba(34, 231, 72, 0.45), 0 0 0 1px rgba(34, 231, 72, 0.28); }
              }
              @keyframes creationTitleShimmer {
                0%, 85%, 100% { background-position: -200% center; opacity: 0; }
                88%           { opacity: 1; }
                95%           { background-position: 200% center; opacity: 1; }
                98%           { opacity: 0; }
              }
              @keyframes creationTitleGlow {
                0%, 100% { text-shadow: 0 0 20px rgba(34, 231, 72, 0.15), 0 0 40px rgba(34, 231, 72, 0.08); }
                50%      { text-shadow: 0 0 25px rgba(34, 231, 72, 0.35), 0 0 60px rgba(34, 231, 72, 0.18); }
              }
              @keyframes creationDrift {
                0%   { transform: translateY(0) translateX(0);      opacity: 0; }
                10%  { opacity: 0.6; }
                50%  { transform: translateY(-50vh) translateX(20px); opacity: 0.8; }
                90%  { opacity: 0.4; }
                100% { transform: translateY(-105vh) translateX(-15px); opacity: 0; }
              }
              
              .creation-title-wrap {
                position: relative;
                display: inline-block;
                /* OVERFLOW HIDDEN REMOVED: The glow can now bleed seamlessly! */
                animation: creationTitleGlow 5s ease-in-out infinite;
              }
              .creation-title-shimmer {
                position: absolute; inset: 0; pointer-events: none;
                background: linear-gradient(115deg, transparent 35%, rgba(255,255,255,0.8) 50%, transparent 65%);
                background-size: 200% auto;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                animation: creationTitleShimmer 12s linear infinite;
              }
              
            `}</style>

            <div
              className="w-full max-w-xl game-panel p-6 sm:p-10 text-center border-t-2 border-t-[#22E748] relative z-10"
              style={{ animation: 'creationBorderPulse 5s ease-in-out infinite' }}
            >
              <h2 className="text-[#22E748] font-bold tracking-widest mb-3 sports-font text-sm sm:text-base">A HOCKEY GAME</h2>
              <h1 className="text-5xl sm:text-7xl font-black mb-3 text-white italic sports-font uppercase tracking-tighter">
                <span className="creation-title-wrap">
                  BLUE CHIP PROSPECT
                  <span className="creation-title-shimmer" aria-hidden="true">BLUE CHIP PROSPECT</span>
                </span>
              </h1>
              <p className="text-slate-400 font-sans text-xs sm:text-sm tracking-[0.25em] uppercase mb-2">
                Your choice · Your legacy
              </p>
              <p className="text-slate-400 font-sans text-xs sm:text-sm tracking-[0.15em] uppercase mb-6">
                How far will you go?
              </p>

              <input
                type="text" placeholder="Your Name"
                className="w-full bg-[#101410] border border-[rgba(255,255,255,0.065)] text-white p-4 rounded-lg mb-4 text-center font-bold focus:border-[#22E748] outline-none transition-all font-sans"
                onChange={(e) => setPlayer({ ...player, name: e.target.value })}
              />

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
                {[
                  { id: 'LW', name: 'Left Wing', num: 13 },
                  { id: 'C', name: 'Center', num: 97 },
                  { id: 'RW', name: 'Right Wing', num: 88 },
                  { id: 'LD', name: 'Left Defense', num: 77 },
                  { id: 'RD', name: 'Right Defense', num: 8 },
                  { id: 'G', name: 'Goaltender', num: 31 }
                ].map(p => (
                  <button
                    key={p.id}
                    onClick={() => setPlayer({ ...player, pos: p.id, number: p.num })}
                    className={`p-3 sm:p-4 rounded-xl border transition-colors cursor-pointer ${player.pos === p.id ? 'border-[#22E748] bg-[#22E748]/10' : 'border-[rgba(255,255,255,0.065)] bg-[#101410] hover:border-slate-500'}`}
                  >
                    <h3 className="text-2xl sm:text-3xl font-black text-white sports-font">{p.id}</h3>
                    <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase mt-1 font-sans">{p.name}</p>
                  </button>
                ))}
              </div>

              {!showManualSetup ? (
                 <div className="flex flex-col sm:flex-row gap-3 mb-4 w-full">
                   <button 
                     onClick={() => setShowManualSetup(true)} 
                     disabled={!player.name} 
                     className={`flex-1 py-4 rounded-xl text-base sm:text-xl font-black sports-font tracking-widest transition-all flex flex-col items-center justify-center gap-1.5 ${
                       !player.name 
                         ? 'bg-[#101410] border border-slate-800 text-slate-600 cursor-not-allowed shadow-none' 
                         : 'bg-[#22E748]/10 hover:bg-[#22E748]/20 border border-[#22E748]/40 text-[#22E748] shadow-[0_0_15px_rgba(34,231,75,0.15)] hover:shadow-[0_0_25px_rgba(34,231,75,0.25)] cursor-pointer hover:scale-[1.02]'
                     }`}
                   >
                     <span className="leading-none">CUSTOMIZE PATH</span>
                     <span className="text-[9px] font-sans font-bold uppercase tracking-widest leading-none opacity-80">
                       Manual Setup
                     </span>
                   </button>
   
                   <button 
                     onClick={handleQuickStart} 
                     disabled={!player.name} 
                     className={`flex-1 py-4 rounded-xl text-base sm:text-xl font-black sports-font tracking-widest transition-all flex flex-col items-center justify-center gap-1.5 ${
                       !player.name 
                         ? 'bg-[#101410] border border-slate-800 text-slate-600 cursor-not-allowed shadow-none' 
                         : 'bg-[#F59E0B]/10 hover:bg-[#F59E0B]/20 border border-[#F59E0B]/40 text-[#F59E0B] shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:shadow-[0_0_25px_rgba(245,158,11,0.25)] cursor-pointer hover:scale-[1.02]'
                     }`}
                   >
                     <span className="leading-none">🎲 QUICK START</span>
                     <span className="text-[9px] font-sans font-bold uppercase tracking-widest leading-none opacity-80">
                       Random League & Nation
                     </span>
                   </button>
                 </div>
              ) : (
                <div className="animate-fade-in">
                  <div className="flex items-center justify-between mb-4">
                     <h3 className="text-xs font-bold text-slate-400 tracking-widest uppercase">Select Junior League</h3>
                     <button onClick={() => setShowManualSetup(false)} className="text-xs font-bold text-slate-500 hover:text-white uppercase cursor-pointer">Cancel</button>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 mb-6 w-full">
                    {[
                      { id: 'OHL', label: 'OHL' },
                      { id: 'WHL', label: 'WHL' },
                      { id: 'QMJHL', label: 'QMJHL' },
                      { id: 'USHL', label: 'USHL (USA)' },
                      { id: 'SHL', label: 'SHL (SWE)' },
                      { id: 'LIIGA', label: 'LIIGA (FIN)' }
                    ].map(lg => (
                      <button
                        key={lg.id}
                        onClick={() => setPlayer({ ...player, startLeague: lg.id, team: null })}
                        className={`p-2 sm:p-3 rounded-xl border transition-colors cursor-pointer ${player.startLeague === lg.id ? 'border-[#3b82f6] bg-[#3b82f6]/10' : 'border-[rgba(255,255,255,0.065)] bg-[#101410] hover:border-slate-500'}`}
                      >
                        <h3 className="text-sm sm:text-base font-black text-white sports-font tracking-wide">{lg.label}</h3>
                      </button>
                    ))}
                  </div>

                  <h3 className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-3 text-left">Select Nationality</h3>
                  <div className="flex flex-col gap-4 mb-8">
                    {[
                      { tier: 1, title: 'TIER 1: SUPERPOWERS' },
                      { tier: 2, title: 'TIER 2: CONTENDERS' },
                      { tier: 3, title: 'TIER 3: TOP DIVISION' },
                      { tier: 4, title: 'TIER 4: DEVELOPING' }
                    ].map(group => {
                      const tierNations = safeNationalities.filter(n => n.tier === group.tier);
                      if (tierNations.length === 0) return null;
                      
                      return (
                        <div key={group.tier}>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 text-left">
                            {group.title}
                          </p>
                          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                            {tierNations.map(n => (
                              <button
                                key={n.id}
                                onClick={() => setPlayer({ ...player, nat: n.id })}
                                // BUG 3 FIX: pt-5 & pb-1 visually pushes the flag perfectly to the center
                                className={`pt-4 pb-2 px-2 rounded-xl border transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 ${
                                  player.nat === n.id 
                                    ? 'border-[#22E748] bg-[#22E748]/10 shadow-[0_0_10px_rgba(34,231,72,0.15)]' 
                                    : 'border-[rgba(255,255,255,0.065)] bg-[#101410] hover:border-[#3b82f6]/50'
                                }`}
                                title={n.name}
                              >
                                <img src={n.img} alt={n.name} className="w-8 h-6 object-cover rounded-sm shadow-sm" />
                                <span className={`text-[9px] font-bold font-sans uppercase tracking-widest ${player.nat === n.id ? 'text-[#22E748]' : 'text-slate-400'}`}>
                                  {n.id}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button 
                    onClick={() => handleStart(false)} 
                    disabled={!player.name} 
                    className="w-full py-4 rounded-xl text-base sm:text-xl font-black sports-font tracking-widest transition-all bg-[#22E748]/10 hover:bg-[#22E748]/20 border border-[#22E748]/40 text-[#22E748] shadow-[0_0_15px_rgba(34,231,75,0.15)] hover:shadow-[0_0_25px_rgba(34,231,75,0.25)] cursor-pointer hover:scale-[1.02] mb-4"
                  >
                    LACE UP THE SKATES
                  </button>
                </div>
              )}

              <div className="border-t border-[rgba(255,255,255,0.065)] pt-6 mt-6 w-full flex flex-col gap-3">
                <button 
                  type="button"
                  onClick={() => { setShowAchievementsMenu(!showAchievementsMenu); setShowRecordsMenu(false); }}
                  className="w-full bg-[#101410] hover:bg-[#1a2230] border border-[rgba(255,255,255,0.1)] p-4 rounded-xl flex items-center justify-between text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl sm:text-2xl">🏆</span>
                    <div>
                      <h3 className="text-xs sm:text-sm font-black text-white sports-font uppercase tracking-wider group-hover:text-[#22E748] transition-colors">
                        CAREER ACHIEVEMENTS
                      </h3>
                      <p className="text-[10px] sm:text-xs text-slate-400 font-sans">
                        {unlockedAchievements.length} OF {MASTER_ACHIEVEMENTS.length} UNLOCKED
                      </p>
                    </div>
                  </div>
                  <span className={`text-slate-400 text-lg transition-transform duration-300 ${showAchievementsMenu ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>

                {showAchievementsMenu && (
                  <div className="bg-[#0a0d0a] border border-[rgba(255,255,255,0.065)] p-4 sm:p-5 rounded-xl max-h-[420px] overflow-y-auto space-y-3 text-left">
                    <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.065)] pb-2 mb-3">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-sans">
                        HALL OF FAME TROPHY CASE
                      </span>
                      <span className="text-[10px] font-bold text-[#22E748] uppercase tracking-widest font-sans">
                        {Math.round((unlockedAchievements.length / MASTER_ACHIEVEMENTS.length) * 100)}% COMPLETE
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                      {MASTER_ACHIEVEMENTS.map(a => {
                        const isUnlocked = unlockedAchievements.includes(a.id);
                        return (
                          <div 
                            key={a.id} 
                            className={`p-2.5 sm:p-3 rounded-xl border flex items-start gap-2.5 sm:gap-3 transition-all ${
                              isUnlocked 
                                ? 'bg-[#F59E0B]/10 border-[#F59E0B]/40 shadow-[0_0_10px_rgba(245,158,11,0.1)]' 
                                : 'bg-[#101410] border-[rgba(255,255,255,0.04)] opacity-50 grayscale'
                            }`}
                          >
                            <span className="text-xl sm:text-2xl shrink-0 mt-0.5">{isUnlocked ? a.icon : '🔒'}</span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-1 mb-0.5">
                                <h4 className={`text-[11px] sm:text-xs font-black uppercase tracking-wider sports-font leading-tight break-words ${isUnlocked ? 'text-[#F59E0B]' : 'text-slate-400'}`}>
                                  {a.name}
                                </h4>
                                {isUnlocked && <span className="text-[10px] font-bold text-[#22E748] font-sans shrink-0 ml-1">✓</span>}
                              </div>
                              <p className="text-[10px] text-slate-400 font-sans leading-tight mt-0.5">
                                {a.desc}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <button 
                  type="button"
                  onClick={() => { setShowRecordsMenu(!showRecordsMenu); setShowAchievementsMenu(false); }}
                  className="w-full bg-[#101410] hover:bg-[#1a2230] border border-[rgba(255,255,255,0.1)] p-4 rounded-xl flex items-center justify-between text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl sm:text-2xl">🏛️</span>
                    <div>
                      <h3 className="text-xs sm:text-sm font-black text-white sports-font uppercase tracking-wider group-hover:text-[#3b82f6] transition-colors">
                        HALL OF RECORDS
                      </h3>
                      <p className="text-[10px] sm:text-xs text-slate-400 font-sans">
                        {savedCareers.length} PAST CAREERS LOGGED
                      </p>
                    </div>
                  </div>
                  <span className={`text-slate-400 text-lg transition-transform duration-300 ${showRecordsMenu ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>

                {showRecordsMenu && (
                  <div className="bg-[#0a0d0a] border border-[rgba(255,255,255,0.065)] p-4 sm:p-5 rounded-xl max-h-[420px] overflow-y-auto space-y-3 text-left">
                    <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.065)] pb-2 mb-3">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-sans">
                        PAST LEGENDS
                      </span>
                    </div>

                    {savedCareers.length === 0 ? (
                       <p className="text-slate-500 text-sm italic font-sans text-center py-4">No past careers found. Finish a career to log it here!</p>
                    ) : (
                       <div className="flex flex-col gap-3">
                         {savedCareers.map(c => (
                           <div key={c.id} className="bg-[#101410] border border-[rgba(255,255,255,0.08)] p-4 rounded-xl flex items-center gap-4 group hover:border-[#3b82f6]/50 transition-colors">
                             
                             <div className="w-12 h-12 shrink-0 flex items-center justify-center bg-black/40 rounded-lg border border-[rgba(255,255,255,0.05)]">
                               {c.logo ? <TeamLogo teamId={c.logo} league={c.league || 'NHL'} isAHL={c.league === 'AHL'} size="small" /> : <span className="text-2xl">🏒</span>}
                             </div>
                             
                             <div className="min-w-0 flex-1">
                               <div className="flex justify-between items-start mb-1">
                                 <h4 className="text-base sm:text-lg font-black text-white sports-font uppercase leading-none truncate">
                                   {c.name}
                                 </h4>
                                 <div className="flex items-center gap-2 ml-2 shrink-0">
                                   {c.careerScore !== undefined && (
                                      <span className="text-[9px] font-black text-white bg-white/10 border border-white/20 px-2 py-0.5 rounded">
                                        SCORE: {c.careerScore.toLocaleString()}
                                      </span>
                                   )}
                                   {c.isLegend && (
                                      <span className="text-[9px] font-black text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/30 px-2 py-0.5 rounded">
                                        LEGEND
                                      </span>
                                   )}
                                 </div>
                               </div>
                               
                               <p className="text-[10px] text-slate-400 font-bold uppercase font-sans truncate mb-2">
                                 {c.pos} · {c.team}
                               </p>
                               
                               <div className="flex items-center gap-3 text-[10px] font-black sports-font tracking-widest">
                                 <span className="text-[#3b82f6]">{c.games} GP</span>
                                 <span className="text-[#22E748]">{c.points} {c.pos === 'G' ? 'SV%' : 'PTS'}</span>
                                 <span className="text-[#F59E0B]">{c.cups} CUPS</span>
                                 {c.awards !== undefined && <span className="text-[#c084fc]">{c.awards} AWARDS</span>}
                                 <span className="text-slate-300 hidden sm:inline">{formatMoney(c.earnings)}</span>
                               </div>
                             </div>
                           </div>
                         ))}
                       </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
}