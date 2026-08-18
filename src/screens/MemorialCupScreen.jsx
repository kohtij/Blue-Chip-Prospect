import React from 'react';
import { useAppContext } from '../AppContext';
import { getFullTeamName } from '../utils/appHelpers';
import { ohlTeams, qmjhlTeams, whlTeams } from '../data/teams';

// Auto-extracted from App.jsx. Receives state/handlers/App-scope components as props.
export default function MemorialCupScreen() {
  const { handleEndMemCup, memCup, player, setMemCup, triggerMinigame } = useAppContext();
  return (() => {
          const isFinal = memCup.round === 1;

          // DYNAMIC CHL HOST ROTATION
          const hostLeagues = ['WHL', 'OHL', 'QMJHL'];
          const seasonIdx = player.stats?.seasonsPlayed || 0;
          const hostLeague = hostLeagues[seasonIdx % 3];

          const getHostTeamInfo = (league) => {
            const pool = league === 'OHL' ? (ohlTeams || []) : league === 'WHL' ? (whlTeams || []) : (qmjhlTeams || []);
            if (pool.length === 0) return { name: 'Host Team', league };
            const team = pool[(seasonIdx * 3) % pool.length];
            return { name: getFullTeamName(team.id, league), league };
          };

          const hostTeam = getHostTeamInfo(hostLeague);

          const getChampName = (lg) => {
            if (player.league === lg) return getFullTeamName(player.team, lg);
            const pool = lg === 'OHL' ? (ohlTeams || []) : lg === 'WHL' ? (whlTeams || []) : (qmjhlTeams || []);
            const filtered = pool.filter(t => t.id !== hostTeam.name && getFullTeamName(t.id, lg) !== hostTeam.name);
            const team = filtered[(seasonIdx * 5) % (filtered.length || 1)];
            return team ? getFullTeamName(team.id, lg) : `${lg} Champions`;
          };

          const ohlChamp = getChampName('OHL');
          const whlChamp = getChampName('WHL');
          const qmjhlChamp = getChampName('QMJHL');
          const playerTeamName = getFullTeamName(player.team, player.league);

          const semiOpponent = hostTeam.name !== playerTeamName ? hostTeam.name : (player.league === 'OHL' ? whlChamp : ohlChamp);
          const finalOpponent = player.league === 'OHL' ? whlChamp : (player.league === 'WHL' ? qmjhlChamp : ohlChamp);
          const currentOpponent = !isFinal ? semiOpponent : finalOpponent;

          return (
            <div className="game-panel p-4 sm:p-10 mt-2 border-t-2 border-t-[#F59E0B] flex flex-col items-center">
              
              {/* HEADER BANNER */}
              <div className="text-center mb-4">
                 <p className="text-[10px] sm:text-xs font-black text-[#F59E0B] uppercase tracking-widest font-sans flex items-center justify-center gap-2">
                   <span>🏆</span> CANADIAN HOCKEY LEAGUE <span>🏆</span>
                 </p>
                 <h1 className="text-3xl sm:text-5xl font-black italic tracking-tighter text-white sports-font uppercase">
                   THE MEMORIAL CUP
                 </h1>
              </div>

              {/* 2-STAGE TOURNAMENT TRACKER */}
              <div className="flex items-center justify-center gap-2 sm:gap-4 w-full max-w-xl mb-6 bg-[#101410] p-2.5 sm:p-3 rounded-xl border border-[rgba(255,255,255,0.065)] font-sans">
                 <div className={`flex-1 p-2 rounded-lg text-center border transition-all ${
                   memCup.status === 'semi_won' || isFinal 
                     ? 'bg-[#22E748]/10 border-[#22E748] text-[#22E748]' 
                     : !isFinal 
                       ? 'bg-[#F59E0B]/15 border-[#F59E0B] text-white shadow-[0_0_10px_rgba(245,158,11,0.2)]' 
                       : 'bg-[#0a0d0a] border-[rgba(255,255,255,0.04)] text-slate-500'
                 }`}>
                    <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider">STAGE 1: SEMI-FINAL</p>
                    <p className="text-[10px] sm:text-xs font-bold truncate">VS {semiOpponent}</p>
                    {(memCup.status === 'semi_won' || isFinal) && <span className="text-[9px] font-black">✓ WON</span>}
                 </div>

                 <span className="text-slate-600 font-bold">➔</span>

                 <div className={`flex-1 p-2 rounded-lg text-center border transition-all ${
                   memCup.status === 'won' 
                     ? 'bg-[#F59E0B]/20 border-[#F59E0B] text-[#F59E0B]' 
                     : isFinal 
                       ? 'bg-[#F59E0B]/15 border-[#F59E0B] text-white shadow-[0_0_10px_rgba(245,158,11,0.2)]' 
                       : 'bg-[#0a0d0a] border-[rgba(255,255,255,0.04)] opacity-50 text-slate-500'
                 }`}>
                    <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider">STAGE 2: FINAL</p>
                    <p className="text-[10px] sm:text-xs font-bold truncate">VS {finalOpponent}</p>
                    {memCup.status === 'won' && <span className="text-[9px] font-black">🏆 CHAMPION</span>}
                 </div>
              </div>

              {/* 4-TEAM SHOWCASE */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 w-full max-w-3xl mb-8">
                 <div className={`p-2.5 sm:p-3 rounded-xl border text-center transition-all flex flex-col justify-center items-center min-h-[72px] ${player.league === 'OHL' ? 'bg-[#F59E0B]/10 border-[#F59E0B] shadow-[0_0_12px_rgba(245,158,11,0.2)]' : 'bg-[#101410] border-[rgba(255,255,255,0.065)] opacity-60'}`}>
                    <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">OHL CHAMP</p>
                    <p className="text-[10px] sm:text-xs font-black text-white sports-font leading-tight break-words">{ohlChamp}</p>
                 </div>
                 <div className={`p-2.5 sm:p-3 rounded-xl border text-center transition-all flex flex-col justify-center items-center min-h-[72px] ${player.league === 'WHL' ? 'bg-[#F59E0B]/10 border-[#F59E0B] shadow-[0_0_12px_rgba(245,158,11,0.2)]' : 'bg-[#101410] border-[rgba(255,255,255,0.065)] opacity-60'}`}>
                    <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">WHL CHAMP</p>
                    <p className="text-[10px] sm:text-xs font-black text-white sports-font leading-tight break-words">{whlChamp}</p>
                 </div>
                 <div className={`p-2.5 sm:p-3 rounded-xl border text-center transition-all flex flex-col justify-center items-center min-h-[72px] ${player.league === 'QMJHL' ? 'bg-[#F59E0B]/10 border-[#F59E0B] shadow-[0_0_12px_rgba(245,158,11,0.2)]' : 'bg-[#101410] border-[rgba(255,255,255,0.065)] opacity-60'}`}>
                    <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">QMJHL CHAMP</p>
                    <p className="text-[10px] sm:text-xs font-black text-white sports-font leading-tight break-words">{qmjhlChamp}</p>
                 </div>
                 <div className="p-2.5 sm:p-3 rounded-xl border text-center bg-[#101410] border-[#F59E0B]/40 shadow-[0_0_8px_rgba(245,158,11,0.15)] flex flex-col justify-center items-center min-h-[72px]">
                    <p className="text-[8px] sm:text-[9px] font-bold text-[#F59E0B] uppercase font-sans tracking-wider mb-0.5">HOST ({hostTeam.league})</p>
                    <p className="text-[10px] sm:text-xs font-black text-white sports-font leading-tight break-words">{hostTeam.name}</p>
                 </div>
              </div>

              {/* SEMI-FINAL VICTORY INTERMISSION SCREEN */}
              {memCup.status === 'semi_won' && (
                <div className="w-full max-w-xl bg-gradient-to-b from-[#102010] to-[#081008] border-2 border-[#22E748] p-6 sm:p-8 rounded-2xl text-center shadow-[0_0_30px_rgba(34,231,72,0.2)] mb-6">
                   <div className="text-4xl sm:text-5xl mb-3 animate-bounce">⚡</div>
                   <p className="text-xs font-black text-[#22E748] uppercase tracking-widest font-sans mb-1">SEMI-FINAL VICTORY!</p>
                   <h3 className="text-2xl sm:text-3xl font-black text-white sports-font uppercase mb-3">
                     DEFEATED {semiOpponent.toUpperCase()}
                   </h3>
                   <p className="text-xs sm:text-sm text-slate-300 font-sans italic mb-6">
                     "{memCup.lastFeedback}"
                   </p>
                   <button
                     onClick={() => setMemCup({ round: 1, status: 'playing' })}
                     className="btn-primary w-full py-4 px-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-transform hover:scale-105 cursor-pointer shadow-lg"
                   >
                     <span className="text-[10px] sm:text-xs font-bold text-white/70 uppercase tracking-widest font-sans">PROCEED TO THE</span>
                     <span className="text-lg sm:text-xl font-black sports-font uppercase text-white text-center text-balance leading-none">CHAMPIONSHIP FINAL VS. {finalOpponent.toUpperCase()} ➔</span>
                   </button>
                </div>
              )}

              {/* ACTIVE MATCHUP CHOICES */}
              {memCup.status === 'playing' && (
                <div className="w-full max-w-2xl space-y-4">
                  <div className="bg-[#101410] border border-[rgba(255,255,255,0.065)] p-4 rounded-xl text-center mb-6">
                    <p className="text-[10px] font-bold text-[#F59E0B] uppercase tracking-widest mb-1 font-sans">
                      {isFinal ? '🏆 MEMORIAL CUP FINAL MATCHUP' : '🏒 SEMI-FINAL MATCHUP'}
                    </p>
                    <h3 className="text-xl sm:text-2xl font-black text-white sports-font uppercase">
                      VS. {currentOpponent.toUpperCase()}
                    </h3>
                  </div>

                  <div className={`bg-[#1a2230] border ${isFinal ? 'border-[#F59E0B]/50 shadow-[0_0_20px_rgba(245,158,11,0.2)]' : 'border-[#3b82f6]/30 shadow-lg'} rounded-xl p-6 sm:p-8 text-center`}>
                     <div className="text-4xl mb-4 animate-bounce">{isFinal ? '🏆' : '🏒'}</div>
                     <h4 className="text-xl sm:text-2xl font-black text-white sports-font uppercase mb-3">LIVE MINIGAME SCENARIO</h4>
                     <p className="text-sm sm:text-base text-slate-300 font-sans mb-8 max-w-lg mx-auto">
                       {isFinal 
                         ? "This is for all the glory. Step onto the ice and complete a live interactive scenario to win the Memorial Cup!" 
                         : "The Semi-Final is a do-or-die elimination game. Step onto the ice and complete a live interactive scenario to secure your spot in the Championship Final!"}
                     </p>
                     <button onClick={() => triggerMinigame('memcup')} className={`py-4 px-8 rounded-xl font-black sports-font text-lg uppercase tracking-widest hover:scale-105 transition-transform cursor-pointer ${isFinal ? 'shadow-[0_0_15px_rgba(245,158,11,0.3)] bg-[#F59E0B] text-black hover:bg-[#d97706]' : 'btn-primary shadow-[0_0_15px_rgba(34,231,75,0.3)]'}`}>
                        {isFinal ? 'ENTER CHAMPIONSHIP SCENARIO' : 'ENTER SEMI-FINAL SCENARIO'}
                     </button>
                  </div>
                </div>
              )}

              {/* VERDICT & CELEBRATION SCREEN */}
              {['won', 'lost'].includes(memCup.status) && (
                <div className={`w-full max-w-2xl p-6 sm:p-8 rounded-2xl border text-center relative overflow-hidden ${
                  memCup.status === 'won'
                    ? 'bg-gradient-to-b from-[#1a1405] to-[#0a0802] border-[#F59E0B] shadow-[0_0_40px_rgba(245,158,11,0.25)]'
                    : 'bg-gradient-to-b from-[#180a0a] to-[#0a0404] border-[#ef4444] shadow-[0_0_30px_rgba(239,68,68,0.2)]'
                }`}>
                  <div className="text-5xl sm:text-6xl mb-4 animate-bounce">
                    {memCup.status === 'won' ? '🏆' : '💔'}
                  </div>

                  <p className={`text-xs font-black uppercase tracking-widest mb-1 ${
                    memCup.status === 'won' ? 'text-[#F59E0B]' : 'text-[#ef4444]'
                  }`}>
                    {memCup.status === 'won' ? 'CHL SUPREMACY UNLOCKED' : 'TOURNAMENT ELIMINATION'}
                  </p>

                  <h2 className="text-3xl sm:text-5xl font-black text-white sports-font uppercase tracking-tight mb-3">
                    {memCup.status === 'won' ? 'MEMORIAL CUP CHAMPIONS!' : 'SEASON ENDS IN HEARTBREAK'}
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-300 font-sans italic max-w-lg mx-auto mb-6">
                    "{memCup.lastFeedback}"
                  </p>

                  {/* SCOUT EVALUATION & IMPACT RECAP */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 text-left">
                    <div className="bg-[#101410]/80 p-3.5 rounded-xl border border-[rgba(255,255,255,0.065)] flex flex-col justify-start min-h-[72px]">
                      <p className="text-[9px] font-bold text-slate-500 uppercase font-sans tracking-wider mb-1">
                        {(player.rights || player.draftTeam) ? 'FRONT OFFICE IMPRESSION' : 'NHL DRAFT IMPACT'}
                      </p>
                      <p className={`text-sm sm:text-base font-black sports-font leading-tight ${
                        memCup.status === 'won' ? 'text-[#22E748]' : 'text-slate-300'
                      }`}>
                        {memCup.status === 'won' 
                          ? ((player.rights || player.draftTeam) ? '🚀 EXCEEDED EXPECTATIONS' : (player.ovr >= 65 ? '🚀 LOCK FOR TOP 10 PICK' : '🚀 RISES TO 1ST ROUND'))
                          : ((player.rights || player.draftTeam) ? '➡️ STABLE DEVELOPMENT' : '📉 MINOR DRAFT HIT')}
                      </p>
                    </div>

                    <div className="bg-[#101410]/80 p-3.5 rounded-xl border border-[rgba(255,255,255,0.065)] flex flex-col justify-start min-h-[72px]">
                      <p className="text-[9px] font-bold text-slate-500 uppercase font-sans tracking-wider mb-1">
                        MEDIA HEADLINE
                      </p>
                      <p className="text-xs sm:text-sm font-black text-white sports-font leading-tight break-words uppercase">
                        {memCup.status === 'won' ? '"KING OF JUNIOR HOCKEY"' : '"HEROIC EFFORT FALLS SHORT"'}
                      </p>
                    </div>

                    <div className="bg-[#101410]/80 p-3.5 rounded-xl border border-[rgba(255,255,255,0.065)] flex flex-col justify-start min-h-[72px]">
                      <p className="text-[9px] font-bold text-slate-500 uppercase font-sans tracking-wider mb-1">
                        FAN REACTION
                      </p>
                      <p className={`text-sm sm:text-base font-black sports-font leading-tight ${
                        memCup.status === 'won' ? 'text-[#F59E0B]' : 'text-[#ef4444]'
                      }`}>
                        {memCup.status === 'won' ? '🔥 MAX HYPE (+50)' : '📉 DISAPPOINTED'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleEndMemCup}
                    className={`w-full sm:w-auto py-3.5 px-10 rounded-xl font-black sports-font tracking-widest text-sm uppercase transition-transform hover:scale-105 ${
                      memCup.status === 'won'
                        ? 'bg-[#F59E0B] text-black hover:bg-[#d97706]'
                        : 'bg-[#101410] border border-[rgba(255,255,255,0.12)] text-white hover:bg-[#1a2230]'
                    }`}
                  >
                    {memCup.status === 'won' ? 'LIFT THE TROPHY & PROCEED' : 'CONTINUE TO RECAP'}
                  </button>
                </div>
              )}

            </div>
          );
        })();
}
