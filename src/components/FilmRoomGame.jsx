import { useState } from 'react';
import { useAppContext } from '../AppContext';

const SKATER_SCENARIOS = [
  { video: "Opponent's powerplay setup: 1-3-1 Umbrella.", question: "Where is the most vulnerable passing lane you need to cut off?", options: [{ text: "Cross-ice through the royal road", isCorrect: true }, { text: "Drop pass to the point", isCorrect: false }, { text: "Dump into the corner", isCorrect: false }] },
  { video: "2-on-1 rush against you.", question: "As the lone defender, what is your primary responsibility?", options: [{ text: "Attack the puck carrier immediately", isCorrect: false }, { text: "Take away the pass and let the goalie take the shooter", isCorrect: true }, { text: "Block the goalie's line of sight", isCorrect: false }] },
  { video: "Faceoff in the defensive zone, down by 1, 10 seconds left.", question: "What's the play if we win the draw?", options: [{ text: "Freeze the puck against the boards", isCorrect: false }, { text: "Fast breakout up the middle", isCorrect: true }, { text: "Pull the goalie", isCorrect: false }] },
  { video: "3-on-2 odd man rush entering the offensive zone.", question: "As the puck carrier, what is the highest percentage play?", options: [{ text: "Drive the net and shoot low for a rebound", isCorrect: true }, { text: "Stop up at the blue line and wait", isCorrect: false }, { text: "Force a saucer pass through the triangle", isCorrect: false }] },
  { video: "Penalty Kill: 5-on-3 down low.", question: "What is your positional structure?", options: [{ text: "Aggressive box chasing the puck", isCorrect: false }, { text: "Tight collapsing triangle protecting the crease", isCorrect: true }, { text: "Man-to-man coverage everywhere", isCorrect: false }] },
  { video: "Offensive Zone: Low-to-high cycle.", question: "Where should the weak-side forward position themselves?", options: [{ text: "In the high slot finding the soft spot", isCorrect: true }, { text: "Glued to the boards", isCorrect: false }, { text: "Behind the opponent's net", isCorrect: false }] },
  { video: "Neutral Zone: Opponent is running a 1-3-1 trap.", question: "How do you break it?", options: [{ text: "Skate directly into the three-man wall", isCorrect: false }, { text: "Soft chip-and-chase to the corners", isCorrect: true }, { text: "Drop pass to the goalie", isCorrect: false }] },
  { video: "Defensive Zone Breakout: Under heavy forecheck pressure.", question: "What is the safest exit strategy?", options: [{ text: "Reverse it off the glass and out", isCorrect: true }, { text: "Pass it blindly up the middle", isCorrect: false }, { text: "Try to deke the F1 forechecker", isCorrect: false }] },
  { video: "6-on-5 (Goalie Pulled), defending a 1-goal lead.", question: "What is the number one priority?", options: [{ text: "Try to score on the empty net", isCorrect: false }, { text: "Block shooting lanes and protect the house", isCorrect: true }, { text: "Pinch at the blue line", isCorrect: false }] },
  { video: "Forechecking: You are F1 entering the zone.", question: "What is your objective?", options: [{ text: "Take the body and separate man from puck", isCorrect: true }, { text: "Wave your stick and peel off", isCorrect: false }, { text: "Skate to the bench for a change", isCorrect: false }] }
];

const GOALIE_SCENARIOS = [
  { video: "Opponent entering on a 2-on-1 rush across the blue line.", question: "How do you manage your depth as the rush develops?", options: [{ text: "Stay aggressive at the top of the crease, then T-push across on the pass", isCorrect: true }, { text: "Retreat deep into the blue paint immediately to cover the back door", isCorrect: false }, { text: "Poke-check the defender at the blue line", isCorrect: false }] },
  { video: "Puck is cycled behind your net to the weak side.", question: "Which post-integration technique should you use as the puck moves behind the goal line?", options: [{ text: "RVH (Reverse Vertical-Horizontal) to seal the short-side post and pad", isCorrect: true }, { text: "Stand tall in the middle of the net facing forward", isCorrect: false }, { text: "Butterfly in the center of the crease", isCorrect: false }] },
  { video: "Heavy traffic in front of the net on an opponent point shot.", question: "How do you maintain sight of the puck through a double screen?", options: [{ text: "Fight for a sightline over or around the screen while staying square", isCorrect: true }, { text: "Drop into a butterfly early and guess where the shot is going", isCorrect: false }, { text: "Shove the netfront player onto your own defenseman", isCorrect: false }] },
  { video: "Puck is rimmed hard around the glass into your end with an aggressive forecheck.", question: "What is your best decision when leaving the net to play the puck behind the goal line?", options: [{ text: "Stop the puck behind the net, set it for your D-man, and return immediately", isCorrect: true }, { text: "Try to deke the incoming forechecker yourself", isCorrect: false }, { text: "Fire a slap shot down ice into the opponent's zone", isCorrect: false }] },
  { video: "Shooter coming down the wing on a breakaway with their stick blade open.", question: "What does an open blade angle on the shooter's stick indicate?", options: [{ text: "A high wrist shot or five-hole deke attempt", isCorrect: true }, { text: "An immediate low slap shot to the far pad", isCorrect: false }, { text: "They are definitely going to pass back to the trailing defenseman", isCorrect: false }] },
  { video: "Powerplay breakdown: Cross-seam pass incoming across the slot.", question: "What is the most efficient movement to cover the one-timer on the far side?", options: [{ text: "Explosive backside push in a butterfly slide led by head and hands", isCorrect: true }, { text: "Stand up and shuffle slowly across the crease", isCorrect: false }, { text: "Dive head-first across the goal line", isCorrect: false }] }
];

export default function FilmRoomGame({ onComplete }) {
  const { player } = useAppContext();
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // Shuffles and picks 3 questions based on player position on mount
  const [scenarios] = useState(() => {
    const pool = player?.pos === 'G' ? GOALIE_SCENARIOS : SKATER_SCENARIOS;
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  });

  const handleAnswer = (isCorrect) => {
    const newScore = score + (isCorrect ? 1 : 0);
    if (step + 1 >= scenarios.length) {
      setScore(newScore);
      setIsFinished(true);
    } else {
      setScore(newScore);
      setStep(step + 1);
    }
  };

  if (scenarios.length === 0) return null;

  // ==========================================
  // RESULTS PHASE
  // ==========================================
  if (isFinished) {
    const isWin = score >= 2;
    return (
      <div className="flex flex-col items-center text-center w-full max-w-md mx-auto fade-up">
        <div className="text-5xl mb-4">{isWin ? '🧠' : '🤦‍♂️'}</div>
        <h2 className="text-2xl sm:text-3xl font-black text-white sports-font uppercase mb-2">Tape Reviewed</h2>
        <p className="text-slate-400 font-sans mb-6">The coaching staff evaluates your hockey IQ...</p>
        
        <div className={`w-full border p-6 rounded-xl mb-8 shadow-inner text-center ${isWin ? 'bg-[#22E748]/10 border-[#22E748]/30' : 'bg-[#ef4444]/10 border-[#ef4444]/30'}`}>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Final Score</p>
            <div className={`text-6xl font-black sports-font mb-4 ${isWin ? 'text-[#22E748]' : 'text-[#ef4444]'}`}>
               {score} <span className="text-3xl text-slate-500">/ {scenarios.length}</span>
            </div>
            <p className="text-sm font-sans text-white italic">
               {score === 3 ? "Flawless reads. The coach is thrilled with your preparation." : 
                score === 2 ? "A solid session. You made the right read when it counted." : 
                "You looked completely lost out there. Back to the drawing board."}
            </p>
        </div>
        
        <button 
          onClick={() => onComplete(isWin)}
          className="w-full btn-primary py-4 rounded-xl text-lg sm:text-xl cursor-pointer sports-font tracking-widest shadow-lg"
        >
          FINISH FILM SESSION ➔
        </button>
      </div>
    );
  }

  // ==========================================
  // GAMEPLAY PHASE
  // ==========================================
  const current = scenarios[step];

  return (
    <div className="flex flex-col items-center text-center w-full max-w-md mx-auto fade-up">
      <div className="text-5xl mb-4">📼</div>
      <h2 className="text-2xl sm:text-3xl font-black text-white sports-font uppercase mb-2">Film Room Analysis</h2>
      <p className="text-slate-400 font-sans mb-6">Study the tape. Make the right read.</p>
      
      <div className="w-full bg-[#101410] border border-[rgba(255,255,255,0.065)] p-5 sm:p-6 rounded-xl mb-6 shadow-inner text-left">
        <p className="text-[#3b82f6] text-[10px] font-bold uppercase tracking-widest mb-2">Scenario {step + 1} of {scenarios.length}</p>
        <p className="text-white font-sans italic mb-4 text-sm">"{current.video}"</p>
        <p className="text-base sm:text-lg font-black text-slate-200 sports-font tracking-wide mb-5 leading-tight">{current.question}</p>
        
        <div className="flex flex-col gap-3 w-full">
          {current.options.map((opt, i) => (
            <button 
              key={i} 
              onClick={() => handleAnswer(opt.isCorrect)}
              className="bg-[#1a2230] hover:bg-[#232d3f] border border-[rgba(255,255,255,0.05)] hover:border-[#3b82f6]/50 text-slate-300 p-4 rounded-xl text-sm font-sans transition-all text-left shadow-md cursor-pointer active:scale-95"
            >
              {opt.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}