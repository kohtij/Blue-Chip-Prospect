import  { useState } from 'react';

export default function FilmRoomGame({ onComplete }) {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);

  const scenarios = [
    {
      video: "Opponent's powerplay setup: 1-3-1 Umbrella.",
      question: "Where is the most vulnerable passing lane you need to cut off?",
      options: [
        { text: "Cross-ice through the royal road", isCorrect: true },
        { text: "Drop pass to the point", isCorrect: false },
        { text: "Dump into the corner", isCorrect: false }
      ]
    },
    {
      video: "2-on-1 rush against you.",
      question: "As the lone defender, what is your primary responsibility?",
      options: [
        { text: "Attack the puck carrier immediately", isCorrect: false },
        { text: "Take away the pass and let the goalie take the shooter", isCorrect: true },
        { text: "Block the goalie's line of sight", isCorrect: false }
      ]
    },
    {
      video: "Faceoff in the defensive zone, down by 1, 10 seconds left.",
      question: "What's the play if we win the draw?",
      options: [
        { text: "Freeze the puck against the boards", isCorrect: false },
        { text: "Fast breakout up the middle", isCorrect: true },
        { text: "Pull the goalie", isCorrect: false }
      ]
    }
  ];

  const handleAnswer = (isCorrect) => {
    const newScore = score + (isCorrect ? 1 : 0);
    if (step + 1 >= scenarios.length) {
      // Finish game: Need 2 out of 3 to win
      const isWin = newScore >= 2;
      onComplete(isWin);
    } else {
      setScore(newScore);
      setStep(step + 1);
    }
  };

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