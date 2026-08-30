import { useAppContext } from '../AppContext';
import { formatMoney } from '../utils/gameHelpers';

export default function NegotiationScreen() {
  const { finishNegotiation, negotiation, setNegotiation, player, setPlayer } = useAppContext();
  const hasAgent = (player.inventory || []).includes('agent');

  const handleNegotiatePush = (type) => {
    let damage = 0;
    let bumpSalary = 0;
    let bumpYears = 0;
    let label = "";
    let isSuccess = true;
    let trustHit = 0; 
    
    const dmgMult = hasAgent ? 0.4 : 1.0; 
    const succBoost = hasAgent ? 0.25 : 0; 

    if (type === 'safe') {
      damage = (Math.floor(Math.random() * 10) + 5) * dmgMult; 
      bumpSalary = Math.round(negotiation.originalOffer.salary * 0.03 / 25000) * 25000;
      label = "Safe Salary";
      trustHit = 2; 
    } else if (type === 'hardball') {
      damage = (Math.floor(Math.random() * 25) + 15) * dmgMult; 
      bumpSalary = Math.round(negotiation.originalOffer.salary * 0.08 / 25000) * 25000;
      label = "Hardball Salary";
      trustHit = -15; 
    } else if (type === 'bluff') {
      const success = Math.random() < (0.40 + succBoost);
      if (success) {
        damage = 5 * dmgMult;
        bumpSalary = Math.round(negotiation.originalOffer.salary * 0.15 / 25000) * 25000;
        label = "Bold Bluff (Success)";
        trustHit = -10; 
      } else {
        damage = 45 * dmgMult;
        bumpSalary = 0;
        isSuccess = false;
        label = "Bold Bluff (Failed)";
        trustHit = -25; 
      }
    } else if (type === 'term_up') {
       const success = Math.random() < (0.50 + succBoost);
       if (success && negotiation.currentYears < 8) {
           damage = 10 * dmgMult;
           bumpYears = 1;
           label = "More Term";
           trustHit = -5;
       } else {
           damage = 25 * dmgMult;
           isSuccess = false;
           label = "More Term (Failed)";
           trustHit = -10;
       }
    } else if (type === 'term_down') {
       const success = Math.random() < (0.60 + succBoost);
       if (success && negotiation.currentYears > 1) {
           damage = 5 * dmgMult;
           bumpYears = -1;
           label = "Less Term";
           trustHit = -5;
       } else {
           damage = 15 * dmgMult;
           isSuccess = false;
           label = "Less Term (Failed)";
           trustHit = -10;
       }
    }

    if (trustHit !== 0) {
        setPlayer(p => ({
            ...p,
            relationships: {
                ...p.relationships,
                coach: Math.min(100, Math.max(0, (p.relationships?.coach || 50) + trustHit))
            }
        }));
    }

    const newPatience = negotiation.gmPatience - damage;
    const newRound = negotiation.rounds + 1;

    if (newPatience <= 0) {
       const penalty = Math.round(negotiation.originalOffer.salary * 0.15 / 25000) * 25000;
       
       setPlayer(p => ({
           ...p,
           stats: {
               ...p.stats,
               reputation: Math.max(50, (p.stats?.reputation ?? 100) - 5)
           },
           relationships: {
               ...p.relationships,
               coach: Math.max(0, (p.relationships?.coach || 50) - 40)
           }
       }));

       setNegotiation(prev => ({
         ...prev, gmPatience: 0, currentSalary: Math.max(850000, prev.currentSalary - penalty),
         status: 'busted', history: [...prev.history, { label, success: false }],
         msg: "The GM slammed the table and walked away! Word of your greed is spreading around the league."
       }));
    } else {
       setNegotiation(prev => ({
         ...prev, gmPatience: newPatience, 
         currentSalary: prev.currentSalary + bumpSalary, 
         currentYears: prev.currentYears + bumpYears, 
         rounds: newRound,
         history: [...prev.history, { label, success: isSuccess }], 
         status: newRound >= prev.maxRounds ? 'maxed' : 'playing',
         msg: newRound >= prev.maxRounds ? "Final offer reached." : `GM agreed to the ${label}.`
       }));
    }
  };

  return (
    <div className="game-panel p-6 sm:p-10 mt-2 border-t-2 border-t-[#F59E0B] text-center max-w-xl mx-auto">
      <h2 className="text-3xl sm:text-4xl font-black text-white uppercase mb-2 sports-font tracking-wide">CONTRACT NEGOTIATION</h2>
      
      {hasAgent && (
         <div className="bg-[#c084fc]/10 border border-[#c084fc]/30 text-[#c084fc] text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded inline-block mb-2">
           👔 SUPER AGENT ACTIVE: INCREASED ODDS & PATIENCE
         </div>
      )}
      <p className="text-sm sm:text-base text-slate-400 font-sans mb-6">{negotiation.msg}</p>
      
      <div className="bg-[#101410] border border-[rgba(255,255,255,0.065)] rounded-2xl p-6 sm:p-8 mb-6 shadow-inner flex flex-col items-center">
         <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">ON THE TABLE</p>
         <div className="flex items-baseline gap-2 mb-6">
            <p className={`text-4xl sm:text-5xl font-black number-font transition-colors ${negotiation.currentSalary > negotiation.originalOffer.salary ? 'text-[#22E748]' : negotiation.currentSalary < negotiation.originalOffer.salary ? 'text-[#ef4444]' : 'text-white'}`}>
              {formatMoney(negotiation.currentSalary)}
            </p>
            <p className={`text-xl sm:text-2xl font-black sports-font transition-colors ${negotiation.currentYears !== negotiation.originalOffer.years ? 'text-[#3b82f6]' : 'text-slate-400'}`}>
              {negotiation.currentYears} YRS
            </p>
         </div>
         
         <div className="w-full mb-6 text-left">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 font-sans">
               <span>GM Patience</span>
               <span>{Math.max(0, negotiation.gmPatience).toFixed(0)}%</span>
            </div>
            <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
               <div
                  className={`h-full transition-all duration-300 ${negotiation.gmPatience > 50 ? 'bg-[#22E748]' : negotiation.gmPatience > 20 ? 'bg-[#F59E0B]' : 'bg-[#ef4444]'}`}
                 style={{ width: `${Math.max(0, negotiation.gmPatience)}%` }}
               ></div>
            </div>
         </div>

         <div className="flex justify-between gap-2 w-full mb-8">
            {[0, 1, 2, 3, 4].map(slot => {
               const pastMove = negotiation.history[slot];
               return (
                  <div key={slot} className={`flex-1 h-12 rounded-lg border-2 flex items-center justify-center text-lg transition-all ${
                     pastMove
                        ? (pastMove.success ? 'bg-[#22E748]/10 border-[#22E748]/50 text-[#22E748]' : 'bg-[#ef4444]/10 border-[#ef4444]/50 text-[#ef4444]')
                        : 'bg-slate-800 border-slate-700 text-slate-600'
                  }`}>
                     {pastMove ? (pastMove.success ? '✓' : '✖') : '-'}
                  </div>
               );
            })}
         </div>

         {negotiation.status === 'playing' ? (
           <div className="flex flex-col gap-3 w-full">
             <div className="flex flex-col sm:flex-row gap-2">
               <button onClick={() => handleNegotiatePush('safe')} className="flex-1 bg-[#3b82f6]/10 border-2 border-[#3b82f6]/40 hover:bg-[#3b82f6]/20 text-[#3b82f6] px-1 py-3 rounded-xl font-black sports-font text-[9px] sm:text-[10px] md:text-xs tracking-wider leading-tight transition-transform active:scale-95 cursor-pointer">
                 SAFE<br />SALARY
               </button>
               <button onClick={() => handleNegotiatePush('hardball')} className="flex-1 bg-[#ef4444]/10 border-2 border-[#ef4444]/40 hover:bg-[#ef4444]/20 text-[#ef4444] px-1 py-3 rounded-xl font-black sports-font text-[9px] sm:text-[10px] md:text-xs tracking-wider leading-tight transition-transform active:scale-95 cursor-pointer">
                 HARDBALL<br />SALARY
               </button>
               <button onClick={() => handleNegotiatePush('bluff')} className="flex-1 bg-[#F59E0B]/10 border-2 border-[#F59E0B]/40 hover:bg-[#F59E0B]/20 text-[#F59E0B] px-1 py-3 rounded-xl font-black sports-font text-[9px] sm:text-[10px] md:text-xs tracking-wider leading-tight transition-transform active:scale-95 cursor-pointer">
                 BLUFF<br />SALARY
               </button>
             </div>
             <div className="flex flex-col sm:flex-row gap-2 mt-2">
               <button disabled={negotiation.currentYears >= 8} onClick={() => handleNegotiatePush('term_up')} className="flex-1 bg-slate-800 border-2 border-slate-600 hover:bg-slate-700 text-white disabled:opacity-50 px-1 py-3 rounded-xl font-black sports-font text-[9px] sm:text-[10px] md:text-xs tracking-wider transition-transform active:scale-95 cursor-pointer">
                 MORE TERM (+1 YR)
               </button>
               <button disabled={negotiation.currentYears <= 1} onClick={() => handleNegotiatePush('term_down')} className="flex-1 bg-slate-800 border-2 border-slate-600 hover:bg-slate-700 text-white disabled:opacity-50 px-1 py-3 rounded-xl font-black sports-font text-[9px] sm:text-[10px] md:text-xs tracking-wider transition-transform active:scale-95 cursor-pointer">
                 LESS TERM (-1 YR)
               </button>
             </div>
           </div>
         ) : (
           <div className={`w-full py-3 rounded-lg font-black sports-font text-xl uppercase tracking-widest animate-pulse ${negotiation.status === 'maxed' ? 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40' : 'bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/40'}`}>
             {negotiation.status === 'maxed' ? 'FINAL OFFER REACHED' : 'GM WALKED AWAY'}
           </div>
         )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
         <button onClick={() => finishNegotiation(true)} className="flex-1 btn-primary py-4 rounded-xl font-black sports-font text-lg uppercase tracking-widest cursor-pointer shadow-lg hover:shadow-xl transition-all">
            SIGN DEAL NOW
         </button>
         <button onClick={() => finishNegotiation(false)} className="flex-1 bg-[#1a2230] hover:bg-[#232d3f] border border-[rgba(255,255,255,0.065)] text-white py-4 rounded-xl font-black sports-font text-sm sm:text-base uppercase tracking-widest cursor-pointer transition-colors">
            KEEP OFFER & RETURN
         </button>
      </div>
    </div>
  );
}