import React from 'react';
import { PRESS_VIBES } from '../utils/appHelpers';

// Auto-extracted from App.jsx. Receives state/handlers/App-scope components as props.
export default function PressScreen({ activePress, handlePressAnswer, player, pressAnswerKeys }) {
  return (() => {
          const q = activePress.questions[activePress.currentQ];
          const journalist = activePress.journalists[activePress.currentQ];
          
          // Pulls from the safe top-level hook instead!
          const answerKeys = pressAnswerKeys;

          return (
            <div className="game-panel p-4 sm:p-8 mt-2 border-t-2 border-t-[#3b82f6] text-left">
              <div className="mb-4 sm:mb-6 border-b border-[rgba(255,255,255,0.065)] pb-4">
                 <h3 className="text-xs sm:text-sm font-bold text-slate-400 tracking-widest uppercase mb-1 font-sans">PRESS ROOM</h3>
                 <h2 className="text-2xl sm:text-4xl font-black text-white sports-font uppercase tracking-wide">THE PRESS CONFERENCE</h2>
              </div>
              
              {/* VISIBLE JOURNALIST PROFILE (Scales based on Hockey IQ) */}
              <div className="bg-[#101410] border border-[rgba(255,255,255,0.065)] rounded-xl p-4 sm:p-5 mb-4 sm:mb-6 flex flex-col justify-center min-h-[100px]">
                <p className="text-[10px] sm:text-xs font-bold text-[#F59E0B] tracking-widest uppercase mb-1 font-sans">QUESTION {activePress.currentQ + 1} FROM:</p>
                
                {player.hockeyIQ >= 75 ? (
                  <>
                    <p className="text-sm sm:text-base font-black text-white mb-1 flex items-center flex-wrap gap-2">
                      🎙️ {journalist?.name}
                      {journalist?.outlet && <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest font-sans">{journalist.outlet}</span>}
                    </p>
                    <p className="text-xs sm:text-sm text-slate-400 italic">"{journalist?.desc}"</p>
                  </>
                ) : player.hockeyIQ >= 60 ? (
                  <>
                    <p className="text-sm sm:text-base font-black text-white mb-1 flex items-center flex-wrap gap-2">
                      🎙️ {journalist?.name}
                      {journalist?.outlet && <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest font-sans">{journalist.outlet}</span>}
                    </p>
                    <p className="text-xs sm:text-sm text-slate-500 italic">You aren't quite sure what angle they are going for...</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm sm:text-base font-black text-white mb-1">🎙️ Unfamiliar Reporter</p>
                    <p className="text-xs sm:text-sm text-slate-500 italic">You have no idea who this is or what they want to hear.</p>
                  </>
                )}
              </div>

              {/* HIGH IQ CHEAT CODE */}
              {player.hockeyIQ >= 75 && (
                <div className="bg-[#22E748]/10 border border-[#22E748]/30 p-3 sm:p-4 rounded-xl mb-4 sm:mb-6 flex items-center gap-3 shadow-[0_0_15px_rgba(34,231,75,0.1)]">
                  <span className="text-xl sm:text-3xl">🧠</span>
                  <div>
                    <p className="text-[#22E748] text-[9px] sm:text-[10px] font-black tracking-widest uppercase mb-1">HIGH IQ INSIGHT</p>
                    <p className="text-slate-300 text-[10px] sm:text-sm font-medium">Give this reporter a <span className="font-bold text-white uppercase">{journalist?.id}</span> answer.</p>
                  </div>
                </div>
              )}

              <p className="text-[9px] sm:text-[10px] font-bold text-[#3b82f6] tracking-widest uppercase mb-2">QUESTION {activePress.currentQ + 1} OF 3</p>
              <h3 className="text-lg sm:text-2xl font-bold text-white mb-4 sm:mb-6 leading-snug">"{q?.q}"</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
                {answerKeys.map((vibeKey) => {
                  const vibe = PRESS_VIBES[vibeKey];
                  return (
                    <button key={vibeKey} onClick={() => handlePressAnswer(vibeKey)} className="bg-[#101410] hover:bg-[#1a2230] border border-[rgba(255,255,255,0.065)] text-left p-4 sm:p-5 rounded-xl transition-colors group flex flex-col justify-center cursor-pointer min-h-[100px]">
                       <p className="text-sm sm:text-base text-slate-300 font-medium group-hover:text-white transition-colors italic leading-relaxed">
                         "{q.answers[vibeKey]}"
                       </p>
                       
                       {/* HIGH IQ PERK: Unlocks the labels to make matching trivial */}
                       {player.hockeyIQ >= 75 && (
                         <div className="flex items-center gap-2 mt-3 opacity-40 group-hover:opacity-100 transition-opacity">
                           <span className={`text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest ${vibe.bg} ${vibe.color} border ${vibe.border}`}>
                             {vibe.icon} {vibe.label}
                           </span>
                         </div>
                       )}
                    </button>
                  )
                })}
              </div>

              <div className="flex gap-2 w-full h-1 mt-auto">
                 {[0,1,2].map(step => (
                    <div key={step} className={`flex-1 rounded-full ${step <= activePress.currentQ ? 'bg-[#3b82f6]' : 'bg-[#232d3f]'}`}></div>
                 ))}
              </div>
            </div>
          );
        })();
}
