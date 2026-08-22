import { useState } from 'react';
import { useAppContext } from '../AppContext';
import { getRole } from '../utils/appHelpers';
import { formatMoney } from '../utils/gameHelpers';

export default function ArbitrationScreen() {
  const { arbState, player, setActiveEvent, setArbState, setScreen } = useAppContext();
  
  // Track which arguments have been used so you can't just spam the same one 3 times
  const [usedArgs, setUsedArgs] = useState([]);

  // Dynamic Argument 1: On-Ice Impact (Checks attributes)
  const statSum = player.pos === 'G' ? (player.skating + player.hockeyIQ) : (player.shooting + player.hockeyIQ);
  const impactChance = statSum > 165 ? 0.90 : statSum > 145 ? 0.65 : 0.35;

  // Dynamic Argument 2: Leadership & Character (Checks relationships)
  const relSum = (player.relationships?.teammates || 50) + (player.relationships?.coach || 50);
  const leadershipChance = relSum >= 150 ? 0.95 : relSum >= 110 ? 0.70 : 0.30;

  const handleArgument = (argType) => {
    const gap = arbState.playerAsk - arbState.teamOffer;
    let success = false;
    let swing = 0;
    let logMsg = "";

    if (argType === 'impact') {
      success = Math.random() < impactChance;
      swing = Math.round((gap * 0.12) / 25000) * 25000;
      logMsg = success 
        ? "🟢 You highlight your underlying metrics and on-ice value. The arbitrator nods, ticking your price up." 
        : "🔴 The team's lawyer points out your inconsistencies and defensive lapses. The arbitrator frowns.";
    } 
    else if (argType === 'leadership') {
      success = Math.random() < leadershipChance;
      swing = Math.round((gap * 0.10) / 25000) * 25000;
      logMsg = success 
        ? "🟢 You present glowing character references from the locker room. The arbitrator values your leadership." 
        : "🔴 The team hints at behind-the-scenes friction and a poor attitude. The arbitrator isn't buying the leadership angle.";
    } 
    else if (argType === 'hardball') {
      success = Math.random() < 0.35;
      const upSwing = Math.round((gap * 0.25) / 25000) * 25000;
      const downSwing = Math.round((gap * 0.20) / 25000) * 25000;
      swing = success ? upSwing : -downSwing;
      logMsg = success 
        ? "🟢 MASSIVE SUCCESS. You aggressively compare yourself to league superstars, and the arbitrator agrees!" 
        : "🔴 DISASTER. You demand superstar money, but the team ruthlessly exposes your flaws. Value plummets.";
    }

    const newRuling = arbState.currentRuling + (success || argType === 'hardball' ? swing : 0);

    setArbState(prev => ({
      ...prev,
      currentRuling: Math.max(prev.teamOffer, Math.min(prev.playerAsk, newRuling)),
      rounds: prev.rounds - 1,
      log: [logMsg, ...prev.log]
    }));
    
    setUsedArgs(prev => [...prev, argType]);
  };

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
          <div className="mb-8 bg-[#101410] p-4 rounded-xl border border-white/5 shadow-inner">
            <div className="flex justify-between text-[10px] sm:text-xs text-slate-400 font-bold mb-2 uppercase sports-font">
              <span>Team Offer: {formatMoney(arbState.teamOffer)}</span>
              <span>Your Ask: {formatMoney(arbState.playerAsk)}</span>
            </div>
            
            <div className="relative h-4 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-600 via-amber-500 to-[#22E748] transition-all duration-500 ease-out"
                style={{ width: `${Math.max(5, Math.min(100, ((arbState.currentRuling - arbState.teamOffer) / (arbState.playerAsk - arbState.teamOffer)) * 100))}%` }}
              ></div>
            </div>
            
            <div className="mt-4 text-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Current Arbitrator Lean:</span>
              <div className="number-font text-3xl sm:text-4xl text-white drop-shadow-md">{formatMoney(arbState.currentRuling)}</div>
            </div>
          </div>

          {/* Action Log */}
          <div className="mb-6 h-36 overflow-y-auto bg-black/40 border border-[rgba(255,255,255,0.05)] rounded-xl p-4 space-y-3 shadow-inner">
            {arbState.log.map((msg, i) => (
              <p key={i} className={`text-xs sm:text-sm font-sans leading-relaxed ${i === 0 ? 'text-white font-bold' : 'text-slate-400 border-l-2 pl-3 border-[rgba(255,255,255,0.1)]'}`}>
                {msg}
              </p>
            ))}
          </div>

          {/* Arguments / Resolution */}
          {arbState.rounds > 0 ? (
            <div className="space-y-4 fade-up">
              <h4 className="sports-font text-slate-300 text-sm uppercase tracking-widest text-center mb-4">Arguments Remaining: <span className="text-[#3b82f6] text-lg">{arbState.rounds}</span></h4>
              
              <div className="flex flex-col gap-3">
                <button
                  disabled={usedArgs.includes('impact')}
                  onClick={() => handleArgument('impact')}
                  className="bg-[#101410] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#1a2230] border border-[rgba(255,255,255,0.08)] hover:border-[#3b82f6] p-4 rounded-xl text-left transition-all group"
                >
                  <div className="flex justify-between items-center mb-1">
                     <span className="sports-font text-white text-base sm:text-lg group-hover:text-[#3b82f6] transition-colors">HIGHLIGHT ON-ICE IMPACT</span>
                     <span className={`text-[10px] font-bold uppercase tracking-widest ${impactChance > 0.8 ? 'text-[#22E748]' : impactChance > 0.5 ? 'text-[#F59E0B]' : 'text-[#ef4444]'}`}>{Math.round(impactChance * 100)}% SUCCESS</span>
                  </div>
                  <div className="text-xs text-slate-400 font-sans">Point to your offensive production, hockey IQ, and skill metrics.</div>
                </button>

                <button
                  disabled={usedArgs.includes('leadership')}
                  onClick={() => handleArgument('leadership')}
                  className="bg-[#101410] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#1a2230] border border-[rgba(255,255,255,0.08)] hover:border-[#22E748] p-4 rounded-xl text-left transition-all group"
                >
                  <div className="flex justify-between items-center mb-1">
                     <span className="sports-font text-white text-base sm:text-lg group-hover:text-[#22E748] transition-colors">CITE LOCKER ROOM LEADERSHIP</span>
                     <span className={`text-[10px] font-bold uppercase tracking-widest ${leadershipChance > 0.8 ? 'text-[#22E748]' : leadershipChance > 0.5 ? 'text-[#F59E0B]' : 'text-[#ef4444]'}`}>{Math.round(leadershipChance * 100)}% SUCCESS</span>
                  </div>
                  <div className="text-xs text-slate-400 font-sans">Focus on your strong relationships with teammates and the coaching staff.</div>
                </button>

                <button
                  onClick={() => handleArgument('hardball')}
                  className="bg-[#101410] hover:bg-[#1a2230] border border-[rgba(255,255,255,0.08)] hover:border-[#ef4444] p-4 rounded-xl text-left transition-all group"
                >
                  <div className="flex justify-between items-center mb-1">
                     <span className="sports-font text-[#ef4444] text-base sm:text-lg group-hover:text-red-400 transition-colors">DEMAND SUPERSTAR MONEY</span>
                     <span className="text-[10px] font-bold uppercase tracking-widest text-[#ef4444]">35% SUCCESS</span>
                  </div>
                  <div className="text-xs text-slate-400 font-sans">Aggressively compare yourself to the highest-paid players in the league. <span className="text-red-400 font-bold">High risk of backfiring.</span></div>
                </button>

                {/* NEW: Early Settle Button (Only shows after 1st argument) */}
                {arbState.rounds < 3 && (
                  <button
                    onClick={() => setArbState(prev => ({ ...prev, rounds: 0 }))}
                    className="w-full mt-4 bg-transparent border-2 border-[#3b82f6] text-[#3b82f6] hover:bg-[#3b82f6] hover:text-white py-3 rounded-xl sports-font tracking-widest uppercase transition-all"
                  >
                    REST YOUR CASE (SETTLE NOW)
                  </button>
                )}
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                const finalSalary = Math.round(arbState.currentRuling / 25000) * 25000;
                setActiveEvent({
                  title: '⚖️ ARBITRATION CONCLUDED',
                  desc: `The hearing is over. The independent arbitrator has slammed the gavel and made a binding ruling.\n\nYou are awarded a 1-year, ${formatMoney(finalSalary)} contract.`,
                  choices: [
                    {
                      label: 'Sign Binding Contract',
                      isRisky: false,
                      feedback: `You are locked in for 1 year at ${formatMoney(finalSalary)}. The relationship with the front office is bruised after the hearing.`,
                      effect: { idol: 0, ovr: 0, money: 0, rel: { coach: -15, media: 5 } },
                      action: 'ACCEPT_ARBITRATION',
                      actionData: { team: arbState.offerData.team, salary: finalSalary, years: 1, role: getRole(finalSalary, player) }
                    }
                  ],
                  isOffseasonEvent: true
                });
                setScreen('event');
              }}
              className="w-full btn-primary py-4 rounded-xl text-lg sm:text-xl mt-6 sports-font tracking-widest uppercase shadow-2xl animate-pulse"
            >
              AWAIT FINAL VERDICT ➔
            </button>
          )}
        </div>
      </div>
    </div>
  );
}