import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppContext } from '../AppContext';
import { projectDraftPick } from '../utils/draftScouting';
import { isPress } from '../utils/a11y';
import { CHOICE_ROW, kickerClass, TITLE_LG, TITLE_MD } from '../utils/ui';

// A button that refuses to be pressed for a moment after it appears.
//
// Three of the combine drills are mash tests: thirty taps in ten seconds on a
// button in the middle of the panel. The results screen then replaced that
// panel and put PROCEED TO INTERVIEWS under the same cursor, so the tap you had
// already committed to skipped straight past your own score. The delay is
// short enough not to be felt deliberately and long enough to swallow the
// momentum of a mash.
function CooldownButton({ onClick, delay = 900, className = '', children }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <button
      onClick={ready ? onClick : undefined}
      disabled={!ready}
      className={`${className} ${ready ? '' : 'opacity-40 cursor-not-allowed'}`}
    >
      {children}
    </button>
  );
}

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

// The combine's shared furniture, laid out the way a minigame brief is: a
// kicker, a white title, a line of explanation, one green button. Each screen
// used to wear its own colour (blue, amber, purple) with its own glowing button.
const PANEL = 'game-panel p-6 sm:p-10 mt-2 flex flex-col items-center text-center';
const PLAY_BTN = 'mx-auto rounded-xl border-2 border-[rgba(255,255,255,0.16)] bg-[#101410] text-white font-black sports-font uppercase tracking-[0.16em] transition-colors cursor-pointer select-none hover:border-[#22E748]/70 active:bg-[#22E748]/15 active:border-[#22E748]';
const START_BTN = 'btn-primary py-4 px-10 rounded-xl text-lg sm:text-xl cursor-pointer sports-font tracking-[0.18em]';

const Readout = ({ items }) => (
  <div className="flex justify-center gap-10 mb-6">
    {items.map(([label, value]) => (
      <div key={label} className="flex flex-col items-center">
        <span className="number-font font-black text-white tabular-nums leading-none text-3xl sm:text-4xl">{value}</span>
        <span className="mt-1.5 text-[10px] sm:text-xs font-black uppercase tracking-[0.18em] text-slate-500">{label}</span>
      </div>
    ))}
  </div>
);

const Row = ({ label, children }) => (
  <div className="flex justify-between items-baseline gap-4 py-3 border-t border-[rgba(255,255,255,0.06)] first:border-t-0">
    <span className="text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-[0.18em] text-left">{label}</span>
    {children}
  </div>
);


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
  const [vo2Time, setVo2Time] = useState(5);
  const [vo2Result, setVo2Result] = useState(null);

  const finishVo2 = useCallback((score) => {
    setVo2Done(true);
    let pts, msg;
    if (score >= 23) { pts = 2; msg = "Elite endurance! You barely broke a sweat."; }
    else if (score >= 16) { pts = 1; msg = "Solid motor. You can handle top-four minutes."; }
    else if (score >= 10) { pts = 0; msg = "Average cardio. Better hit the bike this summer."; }
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
    setVo2Active(true); setVo2Score(0); setVo2Time(5); setVo2Done(false);
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
    if (score >= 18) { pts = 2; msg = "Lightning reflexes. The scouts were all writing at once."; }
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

  // The board by keyboard: the number keys 1 to 9 laid out like the grid, top
  // row first, so it can be played without a mouse or a finger. Held in a ref
  // so the listener always calls the current version of the tap.
  const rxTapRef = useRef(null);
  useEffect(() => {
    if (!rxActive) return undefined;
    const onKey = (e) => {
      if (e.repeat || !/^[1-9]$/.test(e.key)) return;
      e.preventDefault();
      rxTapRef.current?.(Number(e.key) - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [rxActive]);

  const handleRxTap = (idx) => {
    if (!rxActive) return;
    if (idx === rxTarget) {
      setRxScore(s => s + 1);
      setRxTarget(getRandomTarget(rxTarget));
    }
  };
  useEffect(() => { rxTapRef.current = handleRxTap; });

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
               <div className={PANEL}>
                 <span className={kickerClass('neutral')}>Draft preparation</span>
                 <h2 className={`mt-5 ${TITLE_LG}`}>NHL Draft Combine</h2>
                 <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-xl leading-relaxed">
                   This is the Draft Combine, your last chance to impress the general managers before draft day. The physical testing comes first. Then the interviews, where they find out how you think and what you are like.
                 </p>
                 <button onClick={() => setShowIntro(false)} className={`mt-7 ${START_BTN}`}>
                   Enter the combine
                 </button>
               </div>
             );
          }

          // PHASE 1: PHYSICAL TESTING MINIGAMES
          if (combinePhase === 1) {

             const activeResult = posGroup === 'F' ? bpResult : posGroup === 'D' ? vo2Result : rxResult;
             const isDone = posGroup === 'F' ? bpDone : posGroup === 'D' ? vo2Done : rxDone;

             if (isDone) {
                 const tone = activeResult.pts > 0 ? 'text-[#22E748]' : activeResult.pts < 0 ? 'text-[#ef4444]' : 'text-slate-300';
                 return (
                   <div className={PANEL}>
                     <span className={kickerClass('neutral')}>Draft combine</span>
                     <h2 className={`mt-5 ${TITLE_MD}`}>Test results</h2>
                     <div className="mt-6 w-full max-w-md rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0d110d] p-6">
                        <div className="flex items-end justify-center gap-2">
                          <span className="number-font font-black text-white tabular-nums leading-none text-5xl">{activeResult.finalScore}</span>
                          <span className="pb-1 text-xs font-black uppercase tracking-[0.18em] text-slate-500">{activeResult.unit}</span>
                        </div>
                        <p className={`mt-3 text-sm sm:text-base font-black uppercase tracking-[0.12em] ${tone}`}>{activeResult.msg}</p>
                     </div>
                     <CooldownButton onClick={() => setCombinePhase(2)} className={`mt-7 ${START_BTN}`}>
                       On to the interviews
                     </CooldownButton>
                   </div>
                 );
             }

             // FORWARD: BENCH PRESS
             if (posGroup === 'F') {
               return (
                 <div className={PANEL}>
                   <span className={kickerClass('neutral')}>Draft combine</span>
                   <h2 className={`mt-5 ${TITLE_MD}`}>Bench press</h2>
                   <p className="mt-4 mb-6 text-sm sm:text-base text-slate-300 max-w-lg leading-relaxed">
                     Press <strong className="text-white">PUSH</strong> while the bar is inside the green band. Every rep comes faster than the last.
                   </p>
                   <Readout items={[['Reps', `${bpReps} / 5`]]} />
                   <div className="w-full max-w-md mx-auto h-10 bg-[#0d110d] rounded-full relative overflow-hidden border border-[rgba(255,255,255,0.1)] mb-8">
                      <div className="absolute top-0 bottom-0 left-[40%] right-[40%] bg-[#22E748]/25 border-l-2 border-r-2 border-[#22E748]"></div>
                      <div
                        className="absolute top-0 bottom-0 w-2 bg-white rounded-full"
                        style={{ left: `${bpPos}%`, transform: 'translateX(-50%)' }}
                      ></div>
                   </div>
                   {!bpActive ? (
                      <button onClick={startBenchPress} className={START_BTN}>Start the test</button>
                   ) : (
                      <button onClick={handlePush} className={`${PLAY_BTN} w-48 h-20 sm:w-56 text-3xl`}>Push</button>
                   )}
                 </div>
               );
             }

             // DEFENSE: VO2 MAX
             if (posGroup === 'D') {
                return (
                  <div className={PANEL}>
                   <span className={kickerClass('neutral')}>Draft combine</span>
                   <h2 className={`mt-5 ${TITLE_MD}`}>VO2 max treadmill</h2>
                   <p className="mt-4 mb-6 text-sm sm:text-base text-slate-300 max-w-lg leading-relaxed">
                     Press <strong className="text-white">STRIDE</strong> as fast as you can until the ten seconds run out.
                   </p>
                   <Readout items={[['Seconds', vo2Time], ['Strides', vo2Score]]} />
                   {!vo2Active ? (
                      <button onClick={startVo2} className={START_BTN}>Start the test</button>
                   ) : (
                      <button onClick={() => setVo2Score(s => s + 1)} className={`${PLAY_BTN} w-48 h-32 sm:w-56 text-4xl active:scale-95`}>Stride</button>
                   )}
                 </div>
                );
             }

             // GOALIE: REACTION BOARD
             if (posGroup === 'G') {
                return (
                  <div className={PANEL}>
                   <span className={kickerClass('neutral')}>Draft combine</span>
                   <h2 className={`mt-5 ${TITLE_MD}`}>Reaction board</h2>
                   <p className="mt-4 mb-6 text-sm sm:text-base text-slate-300 max-w-lg leading-relaxed">
                     Tap each square as it lights up, before the time runs out. On a keyboard, the keys 1 to 9 match the grid, top row first.
                   </p>
                   <Readout items={[['Seconds', rxTime], ['Hits', rxScore]]} />
                   {!rxActive ? (
                      <button onClick={startRx} className={START_BTN}>Start the test</button>
                   ) : (
                      <div className="grid grid-cols-3 gap-2 sm:gap-3 w-64 h-64 sm:w-80 sm:h-80 mx-auto select-none">
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(idx => (
                          <button
                            key={idx}
                            onPointerDown={() => handleRxTap(idx)}
                            onKeyDown={e => { if (isPress(e)) handleRxTap(idx); }}
                            aria-label={`Square ${idx + 1}${idx === rxTarget ? ', lit' : ''}`}
                            className={`rounded-lg transition-colors duration-75 border ${idx === rxTarget ? 'bg-[#22E748] border-[#22E748] cursor-pointer' : 'bg-[#101410] border-[rgba(255,255,255,0.08)] cursor-default'}`}
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
                const ok = interviewResult.isMatch;
                return (
                  <div className={PANEL}>
                    <span className={kickerClass('neutral')}>Draft combine</span>
                    <h2 className={`mt-5 ${TITLE_MD}`}>Interview result</h2>
                    <div className={`mt-6 w-full max-w-xl flex flex-col sm:flex-row justify-between items-center gap-4 bg-[#0d110d] p-5 rounded-xl border ${ok ? 'border-[#22E748]/45' : 'border-[#ef4444]/45'}`}>
                       <div className="flex flex-col items-center sm:items-start gap-2 flex-1 min-w-0 text-center sm:text-left w-full">
                          <span className="text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-[0.18em]">The scout wanted: <span className={interviewData.scout.color}>{interviewData.scout.trait}</span></span>
                          <span className="text-sm text-slate-300 break-words w-full">"{interviewResult.answer.text}"</span>
                       </div>
                       <span className={`text-lg sm:text-xl font-black sports-font tracking-[0.12em] whitespace-nowrap shrink-0 ${ok ? 'text-[#22E748]' : 'text-[#ef4444]'}`}>
                          {ok ? 'Good fit' : 'Bad fit'}
                       </span>
                    </div>
                    <button onClick={() => setCombinePhase(3)} className={`mt-7 ${START_BTN}`}>
                      See the verdict
                    </button>
                  </div>
                );
             }

             return (
               <div className={PANEL}>
                 <span className={kickerClass('neutral')}>Draft combine</span>
                 <h2 className={`mt-5 ${TITLE_MD}`}>The interviews</h2>
                 <div className="mt-6 w-full max-w-xl bg-[#0d110d] border border-[rgba(255,255,255,0.08)] p-5 rounded-xl text-left">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.18em] mb-1.5">Interviewing with</p>
                    <h3 className={`text-lg sm:text-xl font-black uppercase sports-font ${interviewData.scout.color} mb-1`}>{interviewData.scout.name}</h3>
                    <p className="text-xs sm:text-sm text-slate-400">{interviewData.scout.desc}</p>
                 </div>
                 <p className="mt-6 mb-6 w-full max-w-xl text-lg sm:text-xl text-white leading-relaxed">"{interviewData.question.text}"</p>
                 <div className="flex flex-col gap-3 w-full max-w-xl">
                   {interviewData.answers.map((ans, idx) => (
                     <button key={idx} onClick={() => handleAnswer(ans)} className={CHOICE_ROW}>
                       <span className="text-sm sm:text-base text-slate-200">"{ans.text}"</span>
                     </button>
                   ))}
                 </div>
               </div>
             );
          }

          // PHASE 3: VERDICT & IMPACT
          if (combinePhase === 3) {
             // The combine used to collapse into a +3 / +1 / 0 / -2 nudge to OVR,
             // which on the old draft scale was almost nothing. It now feeds the
             // scouting file at its full -4..+8 resolution, and the projection
             // below is the real one: the same call the draft itself makes.
             let verdict, boostColor;
             if (combineScore >= 6) { verdict = "You were the best player at the Combine. Teams are calling about trading up for you."; boostColor = "text-[#22E748]"; }
             else if (combineScore >= 3) { verdict = "An excellent week. Scouts are moving you up their boards."; boostColor = "text-[#22E748]"; }
             else if (combineScore >= 1) { verdict = "A solid Combine showing. You helped your draft stock."; boostColor = "text-[#22E748]"; }
             else if (combineScore === 0) { verdict = "Average showing. Your on-ice tape will have to do the talking."; boostColor = "text-slate-300"; }
             else if (combineScore >= -2) { verdict = "A poor week in testing. Some clubs have cooled on you."; boostColor = "text-[#F59E0B]"; }
             else { verdict = "A disastrous Combine. You fell down multiple draft boards."; boostColor = "text-[#ef4444]"; }

             // Where this leaves you, against where an average week would have.
             const projected = projectDraftPick(player, combineScore, false);
             const neutral = projectDraftPick(player, 0, false);
             const moved = neutral.pick - projected.pick;

             return (
               <div className={PANEL}>
                 <span className={kickerClass('neutral')}>Draft combine</span>
                 <h2 className={`mt-5 ${TITLE_MD}`}>Combine verdict</h2>
                 <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-xl leading-relaxed">{verdict}</p>
                 <div className="mt-6 w-full max-w-xl bg-[#0d110d] border border-[rgba(255,255,255,0.08)] rounded-xl px-5 py-2">
                    <Row label="Combine score">
                      <span className="number-font text-xl sm:text-2xl font-black text-white">{combineScore > 0 ? `+${combineScore}` : combineScore}</span>
                    </Row>
                    <Row label="Draft stock">
                      <span className={`number-font text-xl sm:text-2xl font-black ${boostColor}`}>
                        {moved > 0 ? `Up ${moved}` : moved < 0 ? `Down ${-moved}` : 'No change'}
                      </span>
                    </Row>
                    <Row label="Projected pick">
                      <span className="number-font text-xl sm:text-2xl font-black text-white">Round {projected.round}, #{projected.pick}</span>
                    </Row>
                 </div>
                 <button
                   onClick={() => {
                     handleDraftDay(combineScore);
                     setCombinePhase(1);
                     if (setCombineClicks) setCombineClicks(0);
                     setCombineScore(0);
                   }}
                   className={`mt-7 ${START_BTN}`}
                 >
                   On to the draft
                 </button>
               </div>
             );
          }

          return null;
        })();
}