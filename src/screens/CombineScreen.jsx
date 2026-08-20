import { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../AppContext';

const SCOUTS = [
  { name: "Old-School GM", trait: "GRIT", color: "text-[#ef4444]", bg: "bg-[#ef4444]/10", border: "border-[#ef4444]/30", desc: "Values toughness, physical play, and hard-nosed traditional hockey." },
  { name: "Player's Coach", trait: "TEAM", color: "text-[#3b82f6]", bg: "bg-[#3b82f6]/10", border: "border-[#3b82f6]/30", desc: "Values chemistry, system buy-in, and locker-room leadership." },
  { name: "Desperate Franchise", trait: "STAR", color: "text-[#c084fc]", bg: "bg-[#c084fc]/10", border: "border-[#c084fc]/30", desc: "Values swagger, highlight reels, and immediate game-breaking impact." }
];

const INTERVIEW_QUESTIONS = [
  {
    text: "You're down by 1 goal in the 3rd period of a playoff game. What's your primary focus when you step on the ice?",
    answers: [
      { text: "Dump it in, lay a massive hit, and set a physical tone.", trait: "GRIT" },
      { text: "Stick to the system and cycle the puck to find the open man.", trait: "TEAM" },
      { text: "Demand the puck. I want it on my stick when the game is on the line.", trait: "STAR" }
    ]
  },
  {
    text: "Every prospect has flaws. If you had to identify your biggest weakness right now, what is it?",
    answers: [
      { text: "I need to get meaner and stronger in the dirty areas.", trait: "GRIT" },
      { text: "I need to communicate better on defense and trust my linemates.", trait: "TEAM" },
      { text: "I don't focus on weaknesses. I just need a coach who lets me play my game.", trait: "STAR" }
    ]
  },
  {
    text: "You get drafted to a team with a toxic locker room that's currently on a 5-game losing streak. How do you handle it?",
    answers: [
      { text: "Grab the loudest guy by the collar and tell him to wake up.", trait: "GRIT" },
      { text: "Call a players-only meeting and get everyone on the same page.", trait: "TEAM" },
      { text: "Put the team on my back and win the next game myself.", trait: "STAR" }
    ]
  },
  {
    text: "It's an off-day before the biggest game of the season. What are you doing?",
    answers: [
      { text: "Hitting the gym. There are no days off.", trait: "GRIT" },
      { text: "Organizing a team dinner to keep the boys loose and connected.", trait: "TEAM" },
      { text: "Visualizing my goal celebration. Keeping my mind entirely focused on scoring.", trait: "STAR" }
    ]
  }
];

export default function CombineScreen() {
  const { combinePhase, combineScore, handleDraftDay, setCombineClicks, setCombinePhase, setCombineScore } = useAppContext();
  
  const [interviewData, setInterviewData] = useState(null);
  const [interviewResult, setInterviewResult] = useState(null);

  // Bench Press State (Timing Mechanic)
  const [bpActive, setBpActive] = useState(false);
  const [bpDone, setBpDone] = useState(false);
  const [bpReps, setBpReps] = useState(0);
  const [bpPos, setBpPos] = useState(5);
  const [bpFailed, setBpFailed] = useState(false);
  const [bpResult, setBpResult] = useState(null);
  const dirRef = useRef(1);

  // Speed increases as reps go up to simulate fatigue
  const speed = 1.5 + (bpReps * 0.8);

  useEffect(() => {
    if (bpActive && !bpFailed && !bpDone) {
      const interval = setInterval(() => {
        setBpPos(p => {
          let next = p + (speed * dirRef.current);
          if (next >= 95) { next = 95; dirRef.current = -1; }
          if (next <= 5) { next = 5; dirRef.current = 1; }
          return next;
        });
      }, 20); 
      return () => clearInterval(interval);
    }
  }, [bpActive, bpFailed, bpDone, speed]);

  const startBenchPress = () => {
    setBpActive(true);
    setBpReps(0);
    setBpPos(5);
    dirRef.current = 1;
    setBpFailed(false);
    setBpDone(false);
  };

  const handlePush = () => {
    if (!bpActive || bpFailed || bpDone) return;
    
    // The Sweet Spot is exactly between 40% and 60%
    if (bpPos >= 40 && bpPos <= 60) {
      // SUCCESS! Hit the green zone
      const newReps = bpReps + 1;
      if (newReps >= 5) {
        finishBp(newReps, false); // Flawless victory
      } else {
        setBpReps(newReps);
      }
    } else {
      // FAIL! Missed the green zone
      finishBp(bpReps, true);
    }
  };

  const finishBp = (finalReps, failed) => {
    setBpActive(false);
    setBpDone(true);
    setBpFailed(failed);

    let pts;
    let msg;
    if (finalReps >= 5) { pts = 2; msg = "Elite strength! 5 perfect reps."; }
    else if (finalReps >= 3) { pts = 1; msg = "Solid showing. You have pro-level power."; }
    else if (finalReps >= 1) { pts = 0; msg = "Average strength. Nothing special."; }
    else { pts = -1; msg = "You completely missed the lift. An embarrassing showing."; }

    setCombineScore(s => s + pts);
    setBpResult({ pts, msg, finalReps });
  };

  // Initialize the interview data when Phase 2 starts
  useEffect(() => {
     if (combinePhase === 2 && !interviewData) {
         const scout = SCOUTS[Math.floor(Math.random() * SCOUTS.length)];
         const q = INTERVIEW_QUESTIONS[Math.floor(Math.random() * INTERVIEW_QUESTIONS.length)];
         const shuffledAnswers = [...q.answers].sort(() => 0.5 - Math.random());
         setTimeout(() => {
             setInterviewData({ scout, question: q, answers: shuffledAnswers });
         }, 0);
     }
  }, [combinePhase, interviewData]);

  const handleAnswer = (ans) => {
     const isMatch = ans.trait === interviewData.scout.trait;
     setCombineScore(s => s + (isMatch ? 2 : -1));
     setInterviewResult({ answer: ans, isMatch });
  };

  return (() => {
          // ==========================================
          // PHASE 1: BENCH PRESS TEST (TIMING)
          // ==========================================
          if (combinePhase === 1) {
             if (bpDone) {
                 return (
                   <div className="game-panel p-6 sm:p-10 mt-2 text-center border-t-2 border-t-[#3b82f6] animate-fade-in max-w-2xl mx-auto">
                     <h2 className="text-2xl sm:text-4xl font-black text-white sports-font uppercase mb-6">STRENGTH RESULTS</h2>
                     
                     <div className={`flex flex-col items-center justify-center bg-[#101410] p-6 rounded-xl border mb-8 ${bpResult.pts > 0 ? 'border-[#22E748]/50 shadow-[0_0_15px_rgba(34,231,72,0.15)]' : bpResult.pts < 0 ? 'border-[#ef4444]/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]' : 'border-slate-500/50'}`}>
                        <div className="text-5xl font-black sports-font mb-2">{bpResult.finalReps} <span className="text-lg text-slate-400">REPS</span></div>
                        <p className={`text-lg font-bold uppercase tracking-widest ${bpResult.pts > 0 ? 'text-[#22E748]' : bpResult.pts < 0 ? 'text-[#ef4444]' : 'text-slate-300'}`}>{bpResult.msg}</p>
                     </div>

                     <button onClick={() => setCombinePhase(2)} className="w-full btn-primary py-4 rounded-xl text-lg sm:text-xl cursor-pointer sports-font tracking-widest shadow-lg">
                       PROCEED TO INTERVIEWS ➔
                     </button>
                   </div>
                 );
             }

             return (
               <div className="game-panel p-6 sm:p-10 mt-2 text-center border-t-2 border-t-[#3b82f6]">
                 <h2 className="text-2xl sm:text-4xl font-black text-[#3b82f6] sports-font uppercase mb-2">BENCH PRESS TEST</h2>
                 <p className="text-slate-300 font-sans mb-8 max-w-lg mx-auto text-sm sm:text-base">
                   Test your strength and composure. Press <strong className="text-white">PUSH</strong> exactly when the bar is inside the green sweet spot. Every rep gets faster!
                 </p>
                 
                 <div className="flex justify-between items-center max-w-md mx-auto mb-4 font-black sports-font text-xl text-slate-400">
                    <span>REPS: <span className="text-white">{bpReps} / 5</span></span>
                 </div>

                 {/* THE TIMING BAR */}
                 <div className="w-full max-w-md mx-auto h-10 bg-[#101410] rounded-full relative overflow-hidden border-2 border-[rgba(255,255,255,0.1)] mb-8 shadow-inner">
                    {/* The Sweet Spot (40% to 60%) */}
                    <div className="absolute top-0 bottom-0 left-[40%] right-[40%] bg-[#22E748]/30 border-l-2 border-r-2 border-[#22E748]"></div>
                    
                    {/* The Moving Indicator */}
                    <div 
                      className="absolute top-0 bottom-0 w-2 bg-white rounded-full shadow-[0_0_10px_white]" 
                      style={{ left: `${bpPos}%`, transform: 'translateX(-50%)' }}
                    ></div>
                 </div>

                 {!bpActive ? (
                    <button 
                      onClick={startBenchPress} 
                      className="w-48 h-16 sm:w-56 mx-auto rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] text-white font-black text-2xl sports-font uppercase tracking-widest transition-all cursor-pointer shadow-[0_0_20px_rgba(59,130,246,0.4)]"
                    >
                      START TEST
                    </button>
                 ) : (
                    <button 
                      onClick={handlePush} 
                      className="w-48 h-20 sm:w-56 mx-auto rounded-xl bg-[#ef4444] hover:bg-[#dc2626] border-b-4 border-[#991b1b] active:border-b-0 active:translate-y-1 text-white font-black text-3xl sports-font uppercase tracking-widest transition-all cursor-pointer shadow-[0_0_30px_rgba(239,68,68,0.3)]"
                    >
                      PUSH!
                    </button>
                 )}
               </div>
             );
          }

          // ==========================================
          // PHASE 2: COMBINE INTERVIEWS
          // ==========================================
          if (combinePhase === 2 && interviewData) {
             if (interviewResult) {
                return (
                  <div className="game-panel p-6 sm:p-10 mt-2 text-center border-t-2 border-t-[#3b82f6] animate-fade-in max-w-2xl mx-auto">
                    <h2 className="text-2xl sm:text-4xl font-black text-white sports-font uppercase mb-6">INTERVIEW RESULT</h2>
                    
                    <div className="flex flex-col gap-3 mb-8 w-full">
                       <div className={`flex flex-col sm:flex-row justify-between items-center gap-4 bg-[#101410] p-5 rounded-xl border ${interviewResult.isMatch ? 'border-[#22E748]/50 shadow-[0_0_15px_rgba(34,231,72,0.15)]' : 'border-[#ef4444]/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]'}`}>
                          <div className="flex flex-col items-center sm:items-start gap-2 flex-1 min-w-0 text-center sm:text-left w-full">
                             <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Scout Preferred: <span className={`${interviewData.scout.color}`}>{interviewData.scout.trait}</span></span>
                             <span className="text-sm font-sans italic text-slate-300 break-words w-full">"{interviewResult.answer.text}"</span>
                          </div>
                          <span className={`text-xl sm:text-2xl font-black sports-font tracking-widest whitespace-nowrap shrink-0 ${interviewResult.isMatch ? 'text-[#22E748]' : 'text-[#ef4444]'}`}>
                             {interviewResult.isMatch ? '✅ PERFECT MATCH' : '❌ BAD FIT'}
                          </span>
                       </div>
                    </div>

                    <button onClick={() => setCombinePhase(3)} className="w-full btn-primary py-4 rounded-xl text-lg sm:text-xl cursor-pointer sports-font tracking-widest shadow-lg">
                      PROCEED TO VERDICT ➔
                    </button>
                  </div>
                );
             }

             return (
               <div className="game-panel p-6 sm:p-10 mt-2 text-center border-t-2 border-t-[#3b82f6] animate-fade-in max-w-2xl mx-auto">
                 <h2 className="text-2xl sm:text-4xl font-black text-white sports-font uppercase mb-6">DRAFT COMBINE INTERVIEWS</h2>
                 
                 <div className={`bg-[#101410] border border-[rgba(255,255,255,0.065)] p-5 rounded-xl text-left mb-6 shadow-inner`}>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">INTERVIEWING WITH:</p>
                    <h3 className={`text-lg sm:text-xl font-black uppercase sports-font ${interviewData.scout.color} mb-1`}>{interviewData.scout.name}</h3>
                    <p className="text-xs sm:text-sm text-slate-400 italic font-sans">{interviewData.scout.desc}</p>
                 </div>

                 <p className="text-lg sm:text-xl text-white font-sans mb-8 leading-relaxed">"{interviewData.question.text}"</p>
                 
                 <div className="flex flex-col gap-3 w-full">
                   {interviewData.answers.map((ans, idx) => (
                     <button 
                       key={idx} 
                       onClick={() => handleAnswer(ans)} 
                       className="p-4 bg-[#101410] border border-[rgba(255,255,255,0.065)] text-slate-300 rounded-xl font-sans text-sm sm:text-base hover:bg-[#1a2230] hover:border-[#3b82f6]/50 cursor-pointer shadow-md transition-all text-left"
                     >
                       "{ans.text}"
                     </button>
                   ))}
                 </div>
               </div>
             );
          }

          // ==========================================
          // PHASE 3: VERDICT & IMPACT
          // ==========================================
          if (combinePhase === 3) {
             let verdict;
             let boost = 0;
             let boostColor;

             if (combineScore >= 3) { verdict = "You destroyed the Combine. Teams are scrambling to trade up for you!"; boost = 3; boostColor = "text-[#22E748]"; }
             else if (combineScore >= 1) { verdict = "A solid Combine showing. You boosted your draft stock slightly."; boost = 1; boostColor = "text-[#3b82f6]"; }
             else if (combineScore === 0) { verdict = "Average showing. Your on-ice tape will have to do the talking."; boost = 0; boostColor = "text-slate-400"; }
             else { verdict = "A disastrous Combine. You fell down multiple draft boards."; boost = -2; boostColor = "text-[#ef4444]"; }

             return (
               <div className="game-panel p-6 sm:p-10 mt-2 text-center border-t-2 border-t-[#3b82f6] animate-fade-in max-w-2xl mx-auto">
                 <h2 className="text-3xl sm:text-4xl font-black text-white sports-font uppercase mb-6">COMBINE VERDICT</h2>
                 
                 <div className="bg-[#101410] border border-[rgba(255,255,255,0.065)] rounded-xl p-6 mb-8">
                    <p className="text-lg sm:text-xl text-slate-300 italic mb-6 font-sans">"{verdict}"</p>
                    
                    <div className="flex justify-between items-center border-t border-[rgba(255,255,255,0.05)] pt-4">
                       <span className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest">Total Combine Score:</span>
                       <span className="text-xl sm:text-2xl font-black text-white sports-font">{combineScore > 0 ? `+${combineScore}` : combineScore}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                       <span className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest">Draft Stock Impact:</span>
                       <span className={`text-xl sm:text-2xl font-black sports-font ${boostColor}`}>{boost > 0 ? `+${boost}` : boost} OVR</span>
                    </div>
                 </div>

                 <button 
                   onClick={() => {
                     handleDraftDay(boost);
                     setCombinePhase(1);
                     if (setCombineClicks) setCombineClicks(0);
                     setCombineScore(0);
                   }} 
                   className="btn-primary py-4 px-10 w-full rounded-xl font-black sports-font uppercase tracking-widest shadow-2xl cursor-pointer"
                 >
                   PROCEED TO NHL DRAFT
                 </button>
               </div>
             );
          }
          
          return null;
        })();
}