import React from 'react';
import { getRole } from '../utils/appHelpers';
import { formatMoney } from '../utils/gameHelpers';

// Extracted from App.jsx. Auto-generated with JSX-aware external analysis.
export default function ArbitrationScreen({ arbState, player, setActiveEvent, setArbState, setScreen }) {
  return (
          <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 bg-[#040505]">
            <div className="w-full max-w-2xl space-y-6">
              <div className="game-panel p-6 sm:p-8 border border-[rgba(255,255,255,0.08)] bg-[#0a0d0a] shadow-2xl relative">
                
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.065)] pb-4 mb-6">
                  <div>
                    <span className="text-[10px] sm:text-xs font-bold text-[#ef4444] uppercase tracking-widest font-sans border border-[#ef4444]/30 px-2.5 py-1 rounded bg-[#ef4444]/10">
                      BINDING ARBITRATION
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-white sports-font uppercase mt-2">
                      THE HEARING
                    </h2>
                  </div>
                  <div className="text-3xl sm:text-4xl text-white opacity-50">⚖️</div>
                </div>

                {/* Negotiation Scale */}
                <div className="mb-8 bg-[#101410] p-4 rounded-xl border border-white/5">
                  <div className="flex justify-between text-xs text-slate-400 font-bold mb-2 uppercase sports-font">
                    <span>Team Lowball: {formatMoney(arbState.teamOffer)}</span>
                    <span>Your Ask: {formatMoney(arbState.playerAsk)}</span>
                  </div>
                  
                  <div className="relative h-4 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-600 via-amber-500 to-green-500 transition-all duration-500 ease-out"
                      style={{ width: `${Math.max(5, Math.min(100, ((arbState.currentRuling - arbState.teamOffer) / (arbState.playerAsk - arbState.teamOffer)) * 100))}%` }}
                    ></div>
                  </div>
                  
                  <div className="mt-3 text-center">
                    <span className="text-sm text-slate-500 sports-font">Current Arbitrator Lean:</span>
                    <div className="number-font text-3xl text-white">{formatMoney(arbState.currentRuling)}</div>
                  </div>
                </div>

                {/* Action Log */}
                <div className="mb-6 h-32 overflow-y-auto bg-black/40 border border-white/5 rounded-lg p-3 space-y-2">
                  {arbState.log.map((msg, i) => (
                    <p key={i} className={`text-sm font-sans ${i === 0 ? 'text-slate-400' : 'text-white border-l-2 pl-2 border-[#3b82f6]'}`}>
                      {msg}
                    </p>
                  ))}
                </div>

                {/* Arguments / Resolution */}
                {arbState.rounds > 0 ? (
                  <div className="space-y-4">
                    <h4 className="sports-font text-white text-lg text-center">Rounds Remaining: <span className="number-font text-[#3b82f6]">{arbState.rounds}</span></h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        onClick={() => {
                          const success = Math.random() < 0.85;
                          const swing = Math.round(((arbState.playerAsk - arbState.teamOffer) * 0.1) / 25000) * 25000;
                          const newRuling = success ? arbState.currentRuling + swing : arbState.currentRuling;
                          
                          setArbState(prev => ({
                            ...prev,
                            currentRuling: Math.min(prev.playerAsk, newRuling),
                            rounds: prev.rounds - 1,
                            log: [
                              success 
                                ? (player.pos === 'G' 
                                    ? "🟢 You highlight your reliable crease control and save percentage. The arbitrator nods, ticking the price up slightly." 
                                    : "🟢 You highlight your reliable two-way play. The arbitrator nods, ticking the price up slightly.") 
                                : "🔴 The team counters your stats with advanced analytics. The arbitrator is unmoved.",
                              ...prev.log
                            ]
                          }));
                        }}
                        className="bg-[#101410] hover:bg-[#1a2230] border border-[rgba(255,255,255,0.08)] hover:border-[#22E748] p-4 rounded-xl text-left transition-all"
                      >
                        <div className="sports-font text-white mb-1">SAFE ARGUMENT</div>
                        <div className="text-xs text-slate-400">85% chance of minor gain. Focus on fundamentals.</div>
                      </button>

                      <button
                        onClick={() => {
                          const success = Math.random() < 0.40;
                          const swing = Math.round(((arbState.playerAsk - arbState.teamOffer) * 0.25) / 25000) * 25000;
                          const newRuling = success ? arbState.currentRuling + swing : arbState.currentRuling - swing;

                          setArbState(prev => ({
                            ...prev,
                            currentRuling: Math.max(prev.teamOffer, Math.min(prev.playerAsk, newRuling)),
                            rounds: prev.rounds - 1,
                            log: [
                              success 
                                ? "🟢 MASSIVE SUCCESS. You passionately compare yourself to league superstars. The arbitrator aggressively raises your value!" 
                                : "🔴 DISASTER. You demand superstar money, but the team's lawyer brutally exposes your flaws. The arbitrator deducts value.",
                              ...prev.log
                            ]
                          }));
                        }}
                        className="bg-[#101410] hover:bg-[#1a2230] border border-[rgba(255,255,255,0.08)] hover:border-[#ef4444] p-4 rounded-xl text-left transition-all"
                      >
                        <div className="sports-font text-white mb-1">RISKY ARGUMENT</div>
                        <div className="text-xs text-slate-400">40% chance of massive gain. High risk of backfiring.</div>
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      // Re-use your exact original logic to apply the contract and relationship hits
                      const finalSalary = Math.round(arbState.currentRuling / 25000) * 25000;
                      setActiveEvent({
                        title: '⚖️ ARBITRATION CONCLUDED',
                        desc: `The hearing is over. The independent arbitrator has slammed the gavel and made a binding ruling.\n\nYou are awarded a 1-year, ${formatMoney(finalSalary)} contract.`,
                        choices: [
                          {
                            label: 'Sign Binding Contract',
                            isRisky: false,
                            feedback: `You are locked in for 1 year at ${formatMoney(finalSalary)}. The relationship with the front office is definitely bruised.`,
                            effect: { idol: 0, ovr: 0, money: 0, rel: { coach: -15, media: 5 } },
                            action: 'ACCEPT_ARBITRATION',
                            actionData: { team: arbState.offerData.team, salary: finalSalary, years: 1, role: getRole(finalSalary, player) }
                          }
                        ],
                        isOffseasonEvent: true
                      });
                      setScreen('event');
                    }}
                    className="w-full btn-primary py-4 rounded-xl text-lg mt-4"
                  >
                    AWAIT FINAL VERDICT
                  </button>
                )}
              </div>
            </div>
          </div>
        );
}
