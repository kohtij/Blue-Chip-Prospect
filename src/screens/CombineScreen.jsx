import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppContext } from '../AppContext';

const SCOUTS = [
  { name: "Old-School GM", trait: "GRIT", color: "text-[#ef4444]", bg: "bg-[#ef4444]/10", border: "border-[#ef4444]/30", desc: "Values toughness, physical play, and hard-nosed traditional hockey." },
  { name: "Player's Coach", trait: "TEAM", color: "text-[#3b82f6]", bg: "bg-[#3b82f6]/10", border: "border-[#3b82f6]/30", desc: "Values chemistry, system buy-in, and locker-room leadership." },
  { name: "Desperate Franchise", trait: "STAR", color: "text-[#c084fc]", bg: "bg-[#c084fc]/10", border: "border-[#c084fc]/30", desc: "Values swagger, highlight reels, and immediate game-breaking impact." }
];

// ==========================================
// POSITION-SPECIFIC INTERVIEW QUESTIONS
// ==========================================
const POSITION_QUESTIONS = {
  F: [
    {
      text: "You're down by 1 goal with 30 seconds left in a playoff game. What's your primary focus when you step on the ice?",
      answers: [
        { text: "Dump it in, lay a massive hit, and set a physical tone.", trait: "GRIT" },
        { text: "Stick to the system and cycle the puck to find the open man.", trait: "TEAM" },
        { text: "Demand the puck. I want it on my stick when the game is on the line.", trait: "STAR" }
      ]
    },
    {
      text: "Every forward has defensive flaws. How do you handle being benched for a missed backcheck?",
      answers: [
        { text: "Take it on the chin, go block a shot on my next shift, and earn my ice time back.", trait: "GRIT" },
        { text: "Ask the assistant coach for video breakdown so I don't make the same mistake twice.", trait: "TEAM" },
        { text: "I don't focus on the benching. I just go out and score on my next shift.", trait: "STAR" }
      ]
    }
  ],
  D: [
    {
      text: "An opposing power forward is driving hard down your wing on a 1-on-1. How do you defend it?",
      answers: [
        { text: "Step up at the blue line and put him through the glass.", trait: "GRIT" },
        { text: "Maintain strict gap control and force him wide into my partner's coverage.", trait: "TEAM" },
        { text: "Poke the puck free and immediately start a 2-on-1 rush the other way.", trait: "STAR" }
      ]
    },
    {
      text: "You're logging 25+ minutes a night and your partner makes a costly giveaway. How do you react?",
      answers: [
        { text: "Grind it out and cover for him. Defensemen protect each other.", trait: "GRIT" },
        { text: "Tap his pads on the bench and tell him we get the next one back.", trait: "TEAM" },
        { text: "Take over the next shift myself and carry the puck out of our zone.", trait: "STAR" }
      ]
    }
  ],
  G: [
    {
      text: "You just allowed a soft goal from center ice in front of 20,000 hostile fans. How do you recover?",
      answers: [
        { text: "Battle harder in the crease. Make the next save as painful for them as possible.", trait: "GRIT" },
        { text: "Reset my breathing, trust my technical routine, and focus on the next shot.", trait: "TEAM" },
        { text: "Wave it off. I know I'm the best player on this ice.", trait: "STAR" }
      ]
    },
    {
      text: "Our analytics team wants you to tweak your butterfly stance to match our tracking data. Are you receptive?",
      answers: [
        { text: "I'll do whatever dirty work is necessary to stop pucks.", trait: "GRIT" },
        { text: "Whatever the coaching staff needs from me, I'm 100% bought in.", trait: "TEAM" },
        { text: "I'll listen, but my natural instincts got me drafted for a reason.", trait: "STAR" }
      ]
    }
  ]
};

// Helper to keep Math.random() strictly outside the React component scope
const getRandomTarget = (exclude = -1) => {
  const possibleTargets = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter(n => n !== exclude);
  return possibleTargets[Math.floor(Math.random() * possibleTargets.length)];
};

export default function CombineScreen() {
  const { combinePhase, combineScore, handleDraftDay, player, setCombineClicks, setCombinePhase, setCombineScore } = useAppContext();
  
  const [showIntro, setShowIntro] = useState(true);
  const [interviewData, setInterviewData] = useState(null);
  const [interviewResult, setInterviewResult] = useState(null);

  const posGroup = player.pos === 'G' ? 'G' : ['LD', 'RD'].includes(player.pos) ? 'D' : 'F';

  // ==========================================
  // FORWARD STATE: Bench Press
  // ==========================================
  const [bpActive, setBpActive] = useState(false);
  const [bpDone, setBpDone] = useState(false);
  const [bpReps, setBpReps] = useState(0);
  const [bpPos, setBpPos] = useState(5);
  const [bpFailed, setBpFailed] = useState(false);
  const [bpResult, setBpResult] = useState(null);
  const dirRef = useRef(1);
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
    setBpActive(true); setBpReps(0); setBpPos(5); dirRef.current = 1; setBpFailed(false); setBpDone(false);
  };

  const handlePush = () => {
    if (!bpActive || bpFailed || bpDone) return;
    if (bpPos >= 40 && bpPos <= 60) {
      const newReps = bpReps + 1;
      if (newReps >= 5) finishBp(newReps, false);
      else setBpReps(newReps);
    } else {
      finishBp(bpReps, true);
    }
  };

  const finishBp = (finalReps, failed) => {
    setBpActive(false); setBpDone(true); setBpFailed(failed);
    let pts, msg;
    if (finalReps >= 5) { pts = 2; msg = "Elite strength! 5 perfect reps."; }
    else if (finalReps >= 3) { pts = 1; msg = "Solid showing. You have pro-level power."; }
    else if (finalReps >= 1) { pts = 0; msg = "Average strength. Nothing special."; }
    else { pts = -1; msg = "You completely missed the lift. An embarrassing showing."; }
    setCombineScore(s => s + pts);
    setBpResult({ pts, msg, finalScore: finalReps, unit: 'REPS' });
  };

  // ==========================================
  // DEFENSE STATE: VO2 Max Button Mash
  // ==========================================
  const [vo2Active, setVo2Active] = useState(false);
  const [vo2Done, setVo2Done] = useState(false);
  const [vo2Score, setVo2Score] = useState(0);
  const [vo2Time, setVo2Time] = useState(10);
  const [vo2Result, setVo2Result] = useState(null);

  const finishVo2 = useCallback((score) => {
    setVo2Done(true);
    let pts, msg;
    if (score >= 45) { pts = 2; msg = "Elite endurance! You barely broke a sweat."; }
    else if (score >= 32) { pts = 1; msg = "Solid motor. You can handle top-four minutes."; }
    else if (score >= 20) { pts = 0; msg = "Average cardio. Better hit the bike this summer."; }
    else { pts = -1; msg = "You gassed out completely. Scouts are concerned."; }
    setCombineScore(s => s + pts);
    setVo2Result({ pts, msg, finalScore: score, unit: 'STRIDES' });
  }, [setCombineScore]);

  // EFFECT 1: Pure timer tick (uninterrupted by button mashing)
  useEffect(() => {
    let interval;
    if (vo2Active) {
      interval = setInterval(() => setVo2Time(t => (t > 0 ? t - 1 : 0)), 1000);
    }
    return () => clearInterval(interval);
  }, [vo2Active]);

  // EFFECT 2: Check for game over
  useEffect(() => {
    if (vo2Active && vo2Time <= 0) {
      setTimeout(() => {
        setVo2Active(false);
        finishVo2(vo2Score);
      }, 0);
    }
  }, [vo2Active, vo2Time, vo2Score, finishVo2]);

  const startVo2 = () => {
    setVo2Active(true); setVo2Score(0); setVo2Time(10); setVo2Done(false);
  };

  // ==========================================
  // GOALIE STATE: Reaction Light Board
  // ==========================================
  const [rxActive, setRxActive] = useState(false);
  const [rxDone, setRxDone] = useState(false);
  const [rxScore, setRxScore] = useState(0);
  const [rxTime, setRxTime] = useState(10);
  const [rxTarget, setRxTarget] = useState(-1);
  const [rxResult, setRxResult] = useState(null);

  const finishRx = useCallback((score) => {
    setRxDone(true);
    let pts, msg;
    if (score >= 18) { pts = 2; msg = "Lightning reflexes! The scouts are amazed."; }
    else if (score >= 12) { pts = 1; msg = "Great quickness and eye tracking."; }
    else if (score >= 7) { pts = 0; msg = "Average reaction time for a prospect."; }
    else { pts = -1; msg = "Slow reads. The puck beats you cleanly."; }
    setCombineScore(s => s + pts);
    setRxResult({ pts, msg, finalScore: score, unit: 'HITS' });
  }, [setCombineScore]);

  // EFFECT 1: Pure timer tick (uninterrupted by target clicking)
  useEffect(() => {
    let interval;
    if (rxActive) {
      interval = setInterval(() => setRxTime(t => (t > 0 ? t - 1 : 0)), 1000);
    }
    return () => clearInterval(interval);
  }, [rxActive]);

  // EFFECT 2: Check for game over
  useEffect(() => {
    if (rxActive && rxTime <= 0) {
      setTimeout(() => {
        setRxActive(false);
        finishRx(rxScore);
      }, 0);
    }
  }, [rxActive, rxTime, rxScore, finishRx]);

  const startRx = () => {
    setRxActive(true); setRxScore(0); setRxTime(10); setRxDone(false); setRxTarget(getRandomTarget());
  };

  const handleRxTap = (idx) => {
    if (!rxActive) return;
    if (idx === rxTarget) {
      setRxScore(s => s + 1);
      setRxTarget(getRandomTarget(rxTarget));
    }
  };

  // Position-aware interview initialization
  useEffect(() => {
     if (combinePhase === 2 && !interviewData) {
         const scout = SCOUTS[Math.floor(Math.random() * SCOUTS.length)];
         const questionPool = POSITION_QUESTIONS[posGroup] || POSITION_QUESTIONS.F;
         const q = questionPool[Math.floor(Math.random() * questionPool.length)];
         
         const shuffledAnswers = [...q.answers].sort(() => 0.5 - Math.random());
         setTimeout(() => {
             setInterviewData({ scout, question: q, answers: shuffledAnswers });
         }, 0);
     }
  }, [combinePhase, interviewData, posGroup]);

  const handleAnswer = (ans) => {
     const isMatch = ans.trait === interviewData.scout.trait;
     setCombineScore(s => s + (isMatch ? 2 : -1));
     setInterviewResult({ answer: ans, isMatch });
  };

  return (() => {
          // PHASE 0: INTRO SCREEN
          if (showIntro) {
             return (
               <div className="game-panel p-6 sm:p-10 mt-2 text-center border-t-2 border-t-[#3b82f6] animate-fade-in flex flex-col items-center">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-[#101410] border border-slate-700 px-3 py-1 rounded-full mb-3 shadow-md">
                    DRAFT PREPARATION
                 </span>
                 <h2 className="text-3xl sm:text-5xl font-black text-[#3b82f6] sports-font uppercase mb-4 tracking-tighter">
                   NHL DRAFT COMBINE
                 </h2>
                 <p className="text-slate-300 font-sans mb-8 max-w-lg mx-auto text-sm sm:text-base leading-relaxed">
                   Welcome to the Draft Combine. This is your final chance to prove your worth to general managers before draft day. You will undergo physical testing to measure your athleticism, followed by intense interviews to evaluate your character and hockey IQ. 
                 </p>
                 <button 
                   onClick={() => setShowIntro(false)} 
                   className="btn-primary py-4 px-10 rounded-xl font-black sports-font text-2xl uppercase tracking-widest hover:scale-105 transition-transform cursor-pointer shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                 >
                   ENTER COMBINE
                 </button>
               </div>
             );
          }

          // PHASE 1: PHYSICAL TESTING MINIGAMES
          if (combinePhase === 1) {
             
             const activeResult = posGroup === 'F' ? bpResult : posGroup === 'D' ? vo2Result : rxResult;
             const isDone = posGroup === 'F' ? bpDone : posGroup === 'D' ? vo2Done : rxDone;

             if (isDone) {
                 return (
                   <div className="game-panel p-6 sm:p-10 mt-2 text-center border-t-2 border-t-[#3b82f6] animate-fade-in max-w-2xl mx-auto">
                     <h2 className="text-2xl sm:text-4xl font-black text-white sports-font uppercase mb-6">TEST RESULTS</h2>
                     
                     <div className={`flex flex-col items-center justify-center bg-[#101410] p-6 rounded-xl border mb-8 ${activeResult.pts > 0 ? 'border-[#22E748]/50 shadow-[0_0_15px_rgba(34,231,72,0.15)]' : activeResult.pts < 0 ? 'border-[#ef4444]/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]' : 'border-slate-500/50'}`}>
                        <div className="text-5xl font-black sports-font mb-2">{activeResult.finalScore} <span className="text-lg text-slate-400">{activeResult.unit}</span></div>
                        <p className={`text-lg font-bold uppercase tracking-widest ${activeResult.pts > 0 ? 'text-[#22E748]' : activeResult.pts < 0 ? 'text-[#ef4444]' : 'text-slate-300'}`}>{activeResult.msg}</p>
                     </div>

                     <button onClick={() => setCombinePhase(2)} className="w-full btn-primary py-4 rounded-xl text-lg sm:text-xl cursor-pointer sports-font tracking-widest shadow-lg">
                       PROCEED TO INTERVIEWS ➔
                     </button>
                   </div>
                 );
             }

             // FORWARD: BENCH PRESS
             if (posGroup === 'F') {
               return (
                 <div className="game-panel p-6 sm:p-10 mt-2 text-center border-t-2 border-t-[#3b82f6] animate-fade-in">
                   <h2 className="text-2xl sm:text-4xl font-black text-[#3b82f6] sports-font uppercase mb-2">BENCH PRESS TEST</h2>
                   <p className="text-slate-300 font-sans mb-8 max-w-lg mx-auto text-sm sm:text-base">
                     Test your strength and composure. Press <strong className="text-white">PUSH</strong> exactly when the bar is inside the green sweet spot. Every rep gets faster!
                   </p>
                   
                   <div className="flex justify-between items-center max-w-md mx-auto mb-4 font-black sports-font text-xl text-slate-400">
                      <span>REPS: <span className="text-white">{bpReps} / 5</span></span>
                   </div>

                   <div className="w-full max-w-md mx-auto h-10 bg-[#101410] rounded-full relative overflow-hidden border-2 border-[rgba(255,255,255,0.1)] mb-8 shadow-inner">
                      <div className="absolute top-0 bottom-0 left-[40%] right-[40%] bg-[#22E748]/30 border-l-2 border-r-2 border-[#22E748]"></div>
                      <div 
                        className="absolute top-0 bottom-0 w-2 bg-white rounded-full shadow-[0_0_10px_white]" 
                        style={{ left: `${bpPos}%`, transform: 'translateX(-50%)' }}
                      ></div>
                   </div>

                   {!bpActive ? (
                      <button onClick={startBenchPress} className="w-48 h-16 sm:w-56 mx-auto rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] text-white font-black text-2xl sports-font uppercase tracking-widest transition-all cursor-pointer shadow-[0_0_20px_rgba(59,130,246,0.4)]">
                        START TEST
                      </button>
                   ) : (
                      <button onClick={handlePush} className="w-48 h-20 sm:w-56 mx-auto rounded-xl bg-[#ef4444] hover:bg-[#dc2626] border-b-4 border-[#991b1b] active:border-b-0 active:translate-y-1 text-white font-black text-3xl sports-font uppercase tracking-widest transition-all cursor-pointer shadow-[0_0_30px_rgba(239,68,68,0.3)]">
                        PUSH!
                      </button>
                   )}
                 </div>
               );
             }

             // DEFENSE: VO2 MAX
             if (posGroup === 'D') {
                return (
                  <div className="game-panel p-6 sm:p-10 mt-2 text-center border-t-2 border-t-[#F59E0B] animate-fade-in">
                   <h2 className="text-2xl sm:text-4xl font-black text-[#F59E0B] sports-font uppercase mb-2">VO2 MAX TREADMILL</h2>
                   <p className="text-slate-300 font-sans mb-8 max-w-lg mx-auto text-sm sm:text-base">
                     Test your aerobic endurance. Mash the <strong className="text-[#F59E0B]">STRIDE</strong> button as rapidly as humanly possible before the 10-second timer expires!
                   </p>
                   
                   <div className="flex justify-between items-center max-w-md mx-auto mb-6 font-black sports-font text-2xl text-slate-400">
                      <span>TIME: <span className="text-white">{vo2Time}s</span></span>
                      <span>STRIDES: <span className="text-[#F59E0B]">{vo2Score}</span></span>
                   </div>

                   {!vo2Active ? (
                      <button onClick={startVo2} className="w-48 h-16 sm:w-56 mx-auto rounded-xl bg-[#F59E0B] hover:bg-[#d97706] text-white font-black text-2xl sports-font uppercase tracking-widest transition-all cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.4)]">
                        START TEST
                      </button>
                   ) : (
                      <button onClick={() => setVo2Score(s => s + 1)} className="w-48 h-32 sm:w-56 mx-auto rounded-xl bg-[#101410] hover:bg-[#1a2230] border-4 border-[#F59E0B] active:bg-[#F59E0B]/20 active:scale-95 text-[#F59E0B] font-black text-4xl sports-font uppercase tracking-widest transition-all cursor-pointer shadow-[0_0_30px_rgba(245,158,11,0.3)] select-none">
                        STRIDE!
                      </button>
                   )}
                 </div>
                );
             }

             // GOALIE: REACTION BOARD
             if (posGroup === 'G') {
                return (
                  <div className="game-panel p-6 sm:p-10 mt-2 text-center border-t-2 border-t-[#c084fc] animate-fade-in">
                   <h2 className="text-2xl sm:text-4xl font-black text-[#c084fc] sports-font uppercase mb-2">REACTION BOARD</h2>
                   <p className="text-slate-300 font-sans mb-8 max-w-lg mx-auto text-sm sm:text-base">
                     Test your hand-eye coordination. Tap the glowing blue targets as quickly as they appear before time runs out!
                   </p>
                   
                   <div className="flex justify-between items-center max-w-md mx-auto mb-6 font-black sports-font text-2xl text-slate-400">
                      <span>TIME: <span className="text-white">{rxTime}s</span></span>
                      <span>HITS: <span className="text-[#c084fc]">{rxScore}</span></span>
                   </div>

                   {!rxActive ? (
                      <button onClick={startRx} className="w-48 h-16 sm:w-56 mx-auto rounded-xl bg-[#c084fc] hover:bg-[#a855f7] text-white font-black text-2xl sports-font uppercase tracking-widest transition-all cursor-pointer shadow-[0_0_20px_rgba(192,132,252,0.4)]">
                        START TEST
                      </button>
                   ) : (
                      <div className="grid grid-cols-3 gap-2 sm:gap-3 w-64 h-64 sm:w-80 sm:h-80 mx-auto select-none">
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(idx => (
                          <button
                            key={idx}
                            onPointerDown={() => handleRxTap(idx)}
                            className={`rounded-lg transition-all duration-75 border ${idx === rxTarget ? 'bg-[#3b82f6] border-[#60a5fa] shadow-[0_0_25px_rgba(59,130,246,0.8)] scale-105 cursor-pointer' : 'bg-[#101410] border-[rgba(255,255,255,0.065)] cursor-default'}`}
                          ></button>
                        ))}
                      </div>
                   )}
                 </div>
                );
             }
          }

          // PHASE 2: COMBINE INTERVIEWS
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

          // PHASE 3: VERDICT & IMPACT
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