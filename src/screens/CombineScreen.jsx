import  { useState, useEffect } from 'react';
import { useAppContext } from '../AppContext';

// Define the archetypes and questions outside the component to keep it pure
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
  const { combineColor, combinePhase, combineScore, handleCombineReflex, handleDraftDay, setCombineClicks, setCombinePhase, setCombineScore } = useAppContext();
  
  const [interviewData, setInterviewData] = useState(null);
  const [interviewResult, setInterviewResult] = useState(null);

  // Initialize the interview data when Phase 2 starts
  useEffect(() => {
     if (combinePhase === 2 && !interviewData) {
         const scout = SCOUTS[Math.floor(Math.random() * SCOUTS.length)];
         const q = INTERVIEW_QUESTIONS[Math.floor(Math.random() * INTERVIEW_QUESTIONS.length)];
         const shuffledAnswers = [...q.answers].sort(() => 0.5 - Math.random());
         // Wrap in a timeout to satisfy the React compiler's cascading render rules
         setTimeout(() => {
             setInterviewData({ scout, question: q, answers: shuffledAnswers });
         }, 0);
     }
  }, [combinePhase, interviewData]);

  const handleAnswer = (ans) => {
     const isMatch = ans.trait === interviewData.scout.trait;
     // +2 for a perfect read, -1 for misreading the room
     setCombineScore(s => s + (isMatch ? 2 : -1));
     setInterviewResult({ answer: ans, isMatch });
  };

  return (() => {
          // ==========================================
          // PHASE 1: REFLEX TEST
          // ==========================================
          if (combinePhase === 1) {
             return (
               <div className="game-panel p-6 sm:p-10 mt-2 text-center border-t-2 border-t-[#3b82f6]">
                 <h2 className="text-2xl sm:text-4xl font-black text-white sports-font uppercase mb-3">NHL DRAFT COMBINE</h2>
                 <p className="text-slate-300 font-sans mb-8 max-w-lg mx-auto">Reflex & Agility Testing: Wait for the signal, then react instantly! Do not jump the gun.</p>
                 <button 
                   onClick={handleCombineReflex} 
                   className={`w-48 h-48 sm:w-56 sm:h-56 mx-auto rounded-full border-[8px] text-white font-black text-3xl sm:text-4xl active:scale-95 transition-colors select-none mb-6 cursor-pointer flex items-center justify-center ${combineColor === 'green' ? 'bg-[#22E748] border-[#16a34a] shadow-[0_0_30px_rgba(34,231,75,0.5)]' : 'bg-[#ef4444] border-[#b91c1c] shadow-[0_0_30px_rgba(239,68,68,0.5)]'}`}
                 >
                   {combineColor === 'green' ? 'GO!' : 'WAIT...'}
                 </button>
               </div>
             );
          }

          // ==========================================
          // PHASE 2: GM INTERVIEWS
          // ==========================================
          if (combinePhase === 2 && interviewData) {
             if (interviewResult) {
                // PHASE 2.5: PR-STYLE RESULT BREAKDOWN
                return (
                  <div className="game-panel p-6 sm:p-10 mt-2 text-center border-t-2 border-t-[#3b82f6] animate-fade-in max-w-2xl mx-auto">
                    <h2 className="text-2xl sm:text-4xl font-black text-white sports-font uppercase mb-6">INTERVIEW RESULT</h2>
                    
                    <div className="flex flex-col gap-3 mb-8">
                       <div className={`flex flex-col sm:flex-row justify-between items-center bg-[#101410] p-5 rounded-xl border ${interviewResult.isMatch ? 'border-[#22E748]/50 shadow-[0_0_15px_rgba(34,231,72,0.15)]' : 'border-[#ef4444]/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]'}`}>
                          <div className="flex flex-col items-center sm:items-start gap-2 mb-3 sm:mb-0">
                             <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Scout Preferred: <span className={`${interviewData.scout.color}`}>{interviewData.scout.trait}</span></span>
                             <span className="text-sm font-sans italic text-slate-300">"{interviewResult.answer.text}"</span>
                          </div>
                          <span className={`text-xl sm:text-2xl font-black sports-font tracking-widest whitespace-nowrap ${interviewResult.isMatch ? 'text-[#22E748]' : 'text-[#ef4444]'}`}>
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
                 <h2 className="text-2xl sm:text-4xl font-black text-white sports-font uppercase mb-6">GM INTERVIEWS</h2>
                 
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

             // Score Breakdown: Reflex (-2 to +2), Interview (-1 to +2). Max: 4, Min: -3
             if (combineScore >= 3) { verdict = "You destroyed the Combine. Teams are scrambling to trade up for you!"; boost = 3; boostColor = "text-[#22E748]"; }
             else if (combineScore >= 1) { verdict = "A solid Combine showing. You boosted your draft stock slightly."; boost = 1; boostColor = "text-[#3b82f6]"; }
             else if (combineScore === 0) { verdict = "Average showing. Your on-ice tape will have to do the talking."; boost = 0; boostColor = "text-slate-400"; }
             else { verdict = "A disastrous Combine. You looked completely out of shape and fell down multiple draft boards."; boost = -2; boostColor = "text-[#ef4444]"; }

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
                     // Clean up the combine state so it's fresh if you start a new career
                     setCombinePhase(1);
                     if (setCombineClicks) setCombineClicks(0); // Optional safety check[cite: 12]
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