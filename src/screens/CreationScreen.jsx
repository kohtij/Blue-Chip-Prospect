import React from 'react';
import { MASTER_ACHIEVEMENTS } from '../utils/appHelpers';

// Extracted from App.jsx. Auto-generated with JSX-aware external analysis.
export default function CreationScreen({ handleStart, player, safeNationalities, setPlayer, setShowAchievementsMenu, showAchievementsMenu, unlockedAchievements }) {
  return (
          <div className="min-h-screen flex items-center justify-center p-6 bg-[#040505] text-white">
            <div className="w-full max-w-xl game-panel p-6 sm:p-10 text-center border-t-2 border-t-[#22E748]">
              <h2 className="text-[#22E748] font-bold tracking-widest mb-2 sports-font text-sm sm:text-base">A HOCKEY GAME</h2>
              <h1 className="text-5xl sm:text-6xl font-black mb-10 text-white italic sports-font uppercase tracking-tighter">BLUE CHIP PROSPECT</h1>

              <input
                type="text" placeholder="Your Last Name"
                className="w-full bg-[#101410] border border-[rgba(255,255,255,0.065)] text-white p-4 rounded-lg mb-6 text-center font-bold focus:border-[#22E748] outline-none transition-all font-sans"
                onChange={(e) => setPlayer({ ...player, name: e.target.value })}
              />

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
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

              <div className="grid grid-cols-3 gap-3 mb-3 w-full">
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

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-10">
                {safeNationalities.map(n => (
                  <button
                    key={n.id}
                    onClick={() => setPlayer({ ...player, nat: n.id })}
                    className={`p-2 sm:p-3 rounded-xl border transition-colors cursor-pointer ${player.nat === n.id ? 'border-[#22E748] bg-[#22E748]/10' : 'border-[rgba(255,255,255,0.065)] bg-[#101410] hover:border-slate-500'} flex items-center justify-center`}
                  >
                    <img src={n.img} alt={n.name} className="w-8 h-6 object-cover rounded-sm" />
                  </button>
                ))}
              </div>

             {/* START GAME BUTTONS */}
              <div className="flex flex-col sm:flex-row gap-3 mb-4 w-full">
                <button 
                  onClick={() => handleStart(false)} 
                  disabled={!player.name} 
                  className={`flex-1 py-4 rounded-xl text-base sm:text-xl font-black sports-font tracking-widest transition-all ${
                    !player.name 
                      ? 'bg-[#101410] border border-slate-800 text-slate-600 cursor-not-allowed shadow-none' 
                      : 'bg-[#22E748]/10 hover:bg-[#22E748]/20 border border-[#22E748]/40 text-[#22E748] shadow-[0_0_15px_rgba(34,231,75,0.15)] hover:shadow-[0_0_25px_rgba(34,231,75,0.25)] cursor-pointer hover:scale-[1.02]'
                  }`}
                >
                  LACE UP THE SKATES
                </button>

                <button 
                  onClick={() => handleStart(true)} 
                  disabled={!player.name} 
                  className={`flex-1 py-4 rounded-xl text-base sm:text-xl font-black sports-font tracking-widest transition-all ${
                    !player.name 
                      ? 'bg-[#101410] border border-slate-800 text-slate-600 cursor-not-allowed shadow-none' 
                      : 'bg-[#F59E0B]/10 hover:bg-[#F59E0B]/20 border border-[#F59E0B]/40 text-[#F59E0B] shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:shadow-[0_0_25px_rgba(245,158,11,0.25)] cursor-pointer hover:scale-[1.02]'
                  }`}
                >
                  🎲 QUICK START (RANDOM)
                </button>
              </div>

              {/* COLLAPSIBLE ACHIEVEMENTS DROPDOWN */}
              <div className="border-t border-[rgba(255,255,255,0.065)] pt-6 mt-8 w-full">
                <button 
                  type="button"
                  onClick={() => setShowAchievementsMenu(!showAchievementsMenu)}
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

                {/* EXPANDABLE MENU */}
                {showAchievementsMenu && (
                  <div className="mt-4 bg-[#0a0d0a] border border-[rgba(255,255,255,0.065)] p-4 sm:p-5 rounded-xl max-h-[420px] overflow-y-auto space-y-3 text-left">
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
              </div>
                
            </div>
          </div>
        );
}
