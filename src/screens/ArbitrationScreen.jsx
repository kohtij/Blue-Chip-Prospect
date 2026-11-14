import { useState, useEffect } from 'react';
import { useAppContext } from '../AppContext';
import { getRole } from '../utils/appHelpers';
import { formatMoney } from '../utils/gameHelpers';
import { isDefence } from '../utils/production';
import { CHOICE_ROW, kickerClass, TAG_AMBER, TAG_GREEN, TAG_RED, TITLE_MD } from '../utils/ui';

// The dice, outside the component so a render can never be the thing that rolls them.
const roll = () => Math.random();

export default function ArbitrationScreen() {
  const { arbState, player, setActiveEvent, setArbState, setScreen } = useAppContext();
  const [usedArgs, setUsedArgs] = useState([]);

  const mood = arbState.mood ?? 50;
  const moodModifier = (mood - 50) * 0.006; 

  // The two attributes the case is argued on.
  //
  // A goalie got his own pair and everybody else was put on shooting, so a
  // shutdown defenceman walked into the hearing and argued his own value on
  // the one attribute his overall rating weights least. These are the two that
  // recomputeOvr leans on for each position: a defenceman is a body and a
  // brain, a forward is a shot and a brain, a goalie is his positioning and
  // his read.
  const statSum = player.pos === 'G'
    ? (player.skating + player.hockeyIQ)
    : isDefence(player.pos)
      ? (player.physicality + player.hockeyIQ)
      : (player.shooting + player.hockeyIQ);
  const baseImpactChance = statSum > 165 ? 0.90 : statSum > 145 ? 0.65 : 0.35;
  const impactChance = Math.max(0.1, Math.min(0.95, baseImpactChance + moodModifier));

  const relSum = (player.relationships?.teammates || 50) + (player.relationships?.coach || 50);
  const baseLeadChance = relSum >= 150 ? 0.95 : relSum >= 110 ? 0.70 : 0.30;
  const leadershipChance = Math.max(0.1, Math.min(0.95, baseLeadChance + moodModifier));

  const handleArgument = (argType) => {
    const gap = arbState.playerAsk - arbState.teamOffer;
    let swing = 0;
    let logMsg = "";
    let moodSwing = 0;

    const isHardball = argType === 'hardball';
    const hardballChance = Math.max(0.1, Math.min(0.95, 0.35 + moodModifier));
    const baseSuccess = isHardball ? hardballChance : (argType === 'impact' ? impactChance : leadershipChance);
    const success = roll() < baseSuccess;

    if (argType === 'impact') {
      swing = Math.round((gap * 0.12) / 25000) * 25000;
      moodSwing = success ? 15 : -15;
      logMsg = success 
        ? "🟢 You walk the arbitrator through your underlying numbers, and your number goes up." 
        : "🔴 The team's lawyer points out defensive lapses. The arbitrator frowns.";
    } 
    else if (argType === 'leadership') {
      swing = Math.round((gap * 0.10) / 25000) * 25000;
      moodSwing = success ? 20 : -10;
      logMsg = success 
        ? "🟢 Your character references are strong, and the arbitrator gives weight to your leadership." 
        : "🔴 The team hints at behind-the-scenes friction. The arbitrator isn't buying it.";
    } 
    else if (isHardball) {
      const upSwing = Math.round((gap * 0.25) / 25000) * 25000;
      const downSwing = Math.round((gap * 0.20) / 25000) * 25000;
      swing = success ? upSwing : -downSwing;
      moodSwing = success ? 10 : -30;
      logMsg = success 
        ? "🟢 You compared yourself to the stars of the league, and the arbitrator agreed." 
        : "🔴 You asked for star money, and the team's lawyer spent twenty minutes on your flaws.";
    }

    const newRuling = arbState.currentRuling + (success || isHardball ? swing : 0);

    setArbState(prev => ({
      ...prev,
      currentRuling: Math.max(prev.teamOffer, Math.min(prev.playerAsk, newRuling)),
      rounds: prev.rounds - 1,
      mood: Math.max(0, Math.min(100, (prev.mood ?? 50) + moodSwing)),
      log: [logMsg, ...prev.log]
    }));
    
    setUsedArgs(prev => [...prev, argType]);
  };

  // Auto-advance when out of arguments
  useEffect(() => {
    if (arbState.rounds === 0) {
      const timer = setTimeout(() => {
        const finalSalary = Math.round(arbState.currentRuling / 25000) * 25000;
        setActiveEvent({
          title: '⚖️ ARBITRATION CONCLUDED',
          desc: `The hearing is over, and the arbitrator's ruling is binding.\n\nYou are awarded a 1-year, ${formatMoney(finalSalary)} contract.`,
          choices: [
            {
              label: 'Sign binding contract',
              isRisky: false,
              feedback: `You are locked in for 1 year at ${formatMoney(finalSalary)}. The relationship with the front office is bruised after the hearing.`,
              effect: { fanStatus: 0, ovr: 0, money: 0, rel: { coach: -15, media: 5 } },
              action: 'ACCEPT_ARBITRATION',
              actionData: { team: arbState.offerData.team, salary: finalSalary, years: 1, role: getRole(finalSalary, player) }
            }
          ],
          isOffseasonEvent: true
        });
        setScreen('event');
      }, 1500); 
      return () => clearTimeout(timer);
    }
  }, [arbState.rounds, arbState.currentRuling, arbState.offerData.team, player, setActiveEvent, setScreen]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 bg-[#040505]">
      <div className="w-full max-w-2xl space-y-6">
        <div className="game-panel p-6 sm:p-8 border border-[rgba(255,255,255,0.08)] bg-[#0a0d0a] shadow-2xl relative">
          
          <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.065)] pb-4 mb-6">
            <div>
              <span className={kickerClass('red')}>
                Binding arbitration
              </span>
              <h2 className={`${TITLE_MD} mt-4`}>
                THE HEARING
              </h2>
            </div>
            <div className="text-3xl sm:text-4xl text-white opacity-50">⚖️</div>
          </div>

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
            
            <div className="mt-6 pt-6 border-t border-[rgba(255,255,255,0.05)]">
              <div className="flex justify-between text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                <span>Arbitrator Mood: Annoyed</span>
                <span>Receptive</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${mood > 60 ? 'bg-[#22E748]' : mood > 40 ? 'bg-[#F59E0B]' : 'bg-[#ef4444]'}`} 
                  style={{ width: `${mood}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="mb-6 h-36 overflow-y-auto bg-black/40 border border-[rgba(255,255,255,0.05)] rounded-xl p-4 space-y-3 shadow-inner">
            {arbState.log.map((msg, i) => (
              <p key={i} className={`text-xs sm:text-sm font-sans leading-relaxed ${i === 0 ? 'text-white font-bold' : 'text-slate-400 border-l-2 pl-3 border-[rgba(255,255,255,0.1)]'}`}>
                {msg}
              </p>
            ))}
          </div>

          {arbState.rounds > 0 ? (
            <div className="space-y-4 fade-up">
              <p className="text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-[0.18em] text-center mb-4">Arguments left: <span className="text-white number-font text-sm">{arbState.rounds}</span></p>
              
              <div className="flex flex-col gap-3">
                {/* The three arguments, drawn the same way as the moves in
                    contract talks: a title, its odds on the right, a line under. */}
                {[
                  { key: 'impact', title: 'Highlight your on-ice impact', line: 'Point to your production, your hockey IQ and your skill numbers.', chance: impactChance, used: usedArgs.includes('impact') },
                  { key: 'leadership', title: 'Cite your leadership', line: 'Lean on how well you get on with your teammates and the staff.', chance: leadershipChance, used: usedArgs.includes('leadership') },
                  { key: 'hardball', title: 'Demand superstar money', line: 'Compare yourself to the best-paid players in the league. It can backfire badly.', chance: 0.35, used: false, risky: true }
                ].map(a => (
                  <button key={a.key} disabled={a.used} onClick={() => handleArgument(a.key)}
                          className={`${CHOICE_ROW} disabled:opacity-40 disabled:cursor-not-allowed`}>
                    <span className="flex justify-between items-start gap-4 w-full">
                      <span className="flex flex-col min-w-0">
                        <span className="font-bold leading-tight text-sm sm:text-base text-white">{a.title}</span>
                        <span className="text-[10px] sm:text-xs text-slate-400 font-medium mt-0.5">{a.line}</span>
                      </span>
                      <span className={a.risky ? TAG_RED : a.chance > 0.8 ? TAG_GREEN : a.chance > 0.5 ? TAG_AMBER : TAG_RED}>
                        {Math.round(a.chance * 100)}%
                      </span>
                    </span>
                  </button>
                ))}

                {arbState.rounds < 3 && (
                  <button
                    onClick={() => setArbState(prev => ({ ...prev, rounds: 0 }))}
                    className="w-full mt-4 btn-secondary py-3 rounded-xl sports-font tracking-widest cursor-pointer"
                  >
                    Rest your case and settle
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="w-full py-4 text-center text-slate-400 font-bold tracking-widest uppercase animate-pulse">
               The Arbitrator is finalizing the ruling...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}