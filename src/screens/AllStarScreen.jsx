import { useState } from 'react';
import { useAppContext } from '../AppContext';
import { applyOvrDelta, recomputeOvr, capIdol } from '../utils/gameHelpers';
import AllStarAccuracy from '../components/AllStarAccuracy';
import AllStarHardestShot from '../components/AllStarHardestShot';
import AllStarFastestSkater from '../components/AllStarFastestSkater';
import AllStarSaveStreak from '../components/AllStarSaveStreak';

const getHostCities = (league) => {
    switch(league) {
        case 'NHL': return ['Las Vegas', 'Montreal', 'Nashville', 'Toronto', 'Tampa Bay', 'New York', 'Los Angeles', 'Chicago', 'Boston', 'Dallas', 'Denver'];
        case 'AHL': return ['Hershey', 'Coachella Valley', 'Chicago', 'Laval', 'Springfield', 'Syracuse', 'Grand Rapids'];
        case 'OHL': return ['London', 'Saginaw', 'Kitchener', 'Oshawa', 'Guelph', 'Windsor'];
        case 'WHL': return ['Kamloops', 'Moose Jaw', 'Kelowna', 'Portland', 'Saskatoon', 'Red Deer'];
        case 'QMJHL': return ['Halifax', 'Quebec City', 'Rouyn-Noranda', 'Moncton', 'Gatineau'];
        case 'USHL': return ['Fargo', 'Dubuque', 'Green Bay', 'Sioux City', 'Omaha'];
        case 'NCAA': return ['Boston', 'St. Paul', 'Tampa', 'Detroit', 'Pittsburgh', 'Buffalo'];
        case 'SHL': return ['Stockholm', 'Gothenburg', 'Karlstad', 'Skellefteå', 'Växjö'];
        case 'LIIGA': return ['Helsinki', 'Tampere', 'Oulu', 'Turku', 'Rauma'];
        default: return ['The Host City'];
    }
};

export default function AllStarScreen() {
  const { player, setPlayer, setScreen } = useAppContext();
  
  // Use the league the player earned the nod in, not just their current active league
  const asgLeague = player.currentAsg || player.league;
  
  const [city] = useState(() => {
     const pool = getHostCities(asgLeague);
     return pool[Math.floor(Math.random() * pool.length)];
  });
  
  const isCaptain = player.ovr >= 90 || player.idolatry >= 600;

  const [phase, setPhase] = useState('intro'); 
  const [captainStrategy, setCaptainStrategy] = useState(null);
  const [carpetFeedback, setCarpetFeedback] = useState(null);
  const [skillsFeedback, setSkillsFeedback] = useState(null);

  const [minigameType] = useState(() => {
     if (player.pos === 'G') return 'saveStreak';
     const games = ['accuracy', 'hardestShot', 'fastestSkater'];
     return games[(player.stats?.seasonsPlayed || 0) % games.length];
  });

  const handleDecline = () => {
     setPlayer(p => ({ 
         ...p, 
         stamina: Math.min(100, p.stamina + 1),
         idolatry: Math.max(0, p.idolatry - 5),
         relationships: {
             ...p.relationships,
             media: Math.max(0, (p.relationships?.media || 50) - 15)
         }
     }));
     setPhase('declined');
  };

  const handleCaptainDraft = (strategy) => {
     setCaptainStrategy(strategy);
     setPhase('red-carpet');
  };

  const handleCarpetChoice = (type) => {
    let msg, idolHit = 0, mediaHit = 0, coachHit = 0;

    if (type === 'safe') {
      msg = "You spent an hour signing autographs for kids. A classic, classy move.";
      idolHit = 15;
    } else if (type === 'risky') {
      if (Math.random() > 0.4) {
        msg = "Your bold, flashy suit went viral! The fans absolutely loved the swagger.";
        idolHit = 40;
      } else {
        msg = "You tried a wild fashion statement and got completely roasted on social media.";
        idolHit = -15;
      }
    } else if (type === 'classy') {
      msg = "You attended the local hospital charity gala. The media and your coach praised your maturity.";
      idolHit = 10; mediaHit = 10; coachHit = 5;
    } else if (type === 'spicy') {
      msg = "You gave a spicy interview calling out your division rivals. Fans loved it, but the media thought it was uncalled for.";
      idolHit = 25; mediaHit = -10;
    }

    setCarpetFeedback({ msg, idolHit, mediaHit, coachHit });
    setTimeout(() => setPhase('skills-comp'), 3000);
  };

  const handleMinigameComplete = (result) => {
    setSkillsFeedback(result);
    setPhase('result');
  };

  const finishAllStar = () => {
    const totalIdol = Math.min(50, (carpetFeedback?.idolHit || 0) + (skillsFeedback?.idolBoost || 0));
    const totalOvr = Math.min(2, skillsFeedback?.ovrBoost || 0);

    setPlayer(p => {
      const withOvr = applyOvrDelta(p, totalOvr);
      return {
          ...withOvr,
          idolatry: capIdol(withOvr.idolatry + totalIdol),
          ovr: recomputeOvr(withOvr),
          relationships: {
             ...withOvr.relationships,
             media: Math.min(100, Math.max(0, (withOvr.relationships?.media || 50) + (carpetFeedback?.mediaHit || 0))),
             coach: Math.min(100, Math.max(0, (withOvr.relationships?.coach || 50) + (carpetFeedback?.coachHit || 0)))
          }
      };
    });

    setScreen('trade-deadline');
  };

  const eventName = asgLeague === 'NCAA' ? 'NCAA All-American Game' : `${asgLeague} All-Star Game`;

  return (
    <div className="game-panel p-6 sm:p-10 mt-2 border-t-2 border-t-[#3b82f6] text-center flex flex-col items-center min-h-[500px]">
      
      <div className="mb-8 flex flex-col items-center">
         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-[#101410] border border-slate-700 px-3 py-1 rounded-full mb-3 shadow-md">
            LIVE FROM {city.toUpperCase()}
         </span>
         <h2 className="text-4xl sm:text-5xl font-black text-[#3b82f6] sports-font tracking-tighter uppercase leading-tight drop-shadow-md">
           ⭐ {player.league === 'NCAA' ? 'ALL-AMERICAN' : 'ALL-STAR'} WEEKEND ⭐
         </h2>
      </div>

      {phase === 'intro' && (
         <div className="max-w-2xl w-full mt-2 animate-fade-in flex flex-col gap-4">
           {isCaptain ? (
              <div className="bg-[#101410] border border-[#F59E0B]/30 p-8 rounded-xl shadow-[0_0_30px_rgba(245,158,11,0.1)]">
                 <h3 className="text-2xl font-black text-[#F59E0B] sports-font uppercase mb-3">🎖️ {player.league === 'NCAA' ? 'ALL-AMERICAN' : 'ALL-STAR'} CAPTAIN</h3>
                 <p className="text-slate-300 font-sans mb-8">As one of the league's top vote-getters, you've been named a Captain! It's time to build your squad. What is your draft philosophy?</p>
                 <div className="flex flex-col sm:flex-row gap-4 justify-center">
                     <button onClick={() => handleCaptainDraft('speed')} className="bg-[#1a2230] hover:bg-[#232d3f] border border-[#3b82f6]/50 text-white font-black sports-font uppercase py-3 px-6 rounded-lg transition-transform hover:scale-105 shadow-[0_0_15px_rgba(59,130,246,0.2)] cursor-pointer">⚡ Speed & Skill</button>
                     <button onClick={() => handleCaptainDraft('power')} className="bg-[#1a2230] hover:bg-[#232d3f] border border-[#ef4444]/50 text-white font-black sports-font uppercase py-3 px-6 rounded-lg transition-transform hover:scale-105 shadow-[0_0_15px_rgba(239,68,68,0.2)] cursor-pointer">💥 Raw Power</button>
                     <button onClick={() => handleCaptainDraft('grit')} className="bg-[#1a2230] hover:bg-[#232d3f] border border-[#22E748]/50 text-white font-black sports-font uppercase py-3 px-6 rounded-lg transition-transform hover:scale-105 shadow-[0_0_15px_rgba(34,231,72,0.2)] cursor-pointer">🧱 200-Foot Game</button>
                 </div>
                 <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-6">Your choice will provide a buff in the Skills Competition</p>
              </div>
           ) : (
              <div className="bg-[#101410] border border-[#3b82f6]/30 p-8 rounded-xl shadow-[0_0_30px_rgba(59,130,246,0.1)]">
                 <h3 className="text-2xl font-black text-white sports-font uppercase mb-3">{player.league === 'NCAA' ? 'ALL-AMERICAN' : 'ALL-STAR'} SELECTION</h3>
                 <p className="text-slate-300 font-sans mb-8">Congratulations, you've been selected to represent your team at the {eventName}! Enjoy the festivities and put on a show.</p>
                 <button onClick={() => setPhase('red-carpet')} className="btn-primary py-4 px-10 rounded-xl font-black sports-font text-xl uppercase tracking-widest hover:scale-105 transition-transform cursor-pointer">
                    HEAD TO RED CARPET
                 </button>
              </div>
           )}
           
           {/* DECLINE OPTION FOR VETERANS */}
           {player.age >= 32 && (
              <button onClick={handleDecline} className="bg-[#101410] border border-slate-700 text-slate-400 py-3 px-8 rounded-xl font-black sports-font text-lg uppercase tracking-widest hover:text-white hover:border-slate-500 transition-colors cursor-pointer w-full mx-auto block shadow-md">
                 DECLINE INVITE (REST +10 STAMINA)
              </button>
           )}
         </div>
      )}

      {phase === 'declined' && (
         <div className="max-w-2xl w-full mt-2 animate-fade-in bg-[#101410] border border-[#ef4444]/40 p-8 rounded-xl shadow-[0_0_30px_rgba(239,68,68,0.15)] flex flex-col items-center">
            <h3 className="text-3xl font-black text-[#ef4444] sports-font uppercase mb-4">INVITATION DECLINED</h3>
            <p className="text-lg text-slate-300 mb-6 font-sans">
              You chose to rest your body instead of attending the All-Star weekend. Per league rules, you have been handed an automatic <strong>1-game suspension</strong>. The media is questioning your dedication, but you secured some much-needed rest (+1 Stamina).
            </p>
            <button onClick={() => setScreen('trade-deadline')} className="btn-primary w-full py-4 rounded-xl font-black sports-font tracking-widest text-lg uppercase transition-transform hover:scale-105 cursor-pointer">
              SERVE SUSPENSION & RETURN
            </button>
         </div>
      )}
      
      {phase === 'red-carpet' && (
        <div className="max-w-3xl w-full mt-2 animate-fade-in">
          {!carpetFeedback ? (
            <>
              <p className="text-lg text-slate-300 mb-8 font-sans">
                The red carpet is swarming with media and fans outside the arena in {city}. How do you want to make your entrance?
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-2">
                <button onClick={() => handleCarpetChoice('safe')} className="bg-[#101410] hover:bg-[#1a2230] border border-[#3b82f6]/40 p-5 rounded-xl flex flex-col gap-2 transition-all hover:scale-[1.02] hover:z-10 shadow-lg cursor-pointer">
                  <span className="text-xs font-black text-[#3b82f6] tracking-widest uppercase">SAFE</span>
                  <span className="text-lg font-bold text-white sports-font uppercase">Sign Autographs</span>
                  <span className="text-[10px] text-slate-400 font-sans">Give the kids a memory they'll never forget.</span>
                </button>
                <button onClick={() => handleCarpetChoice('risky')} className="bg-[#101410] hover:bg-[#1a2230] border border-[#ef4444]/40 p-5 rounded-xl flex flex-col gap-2 transition-all hover:scale-[1.02] hover:z-10 shadow-lg cursor-pointer">
                  <span className="text-xs font-black text-[#ef4444] tracking-widest uppercase">RISKY</span>
                  <span className="text-lg font-bold text-white sports-font uppercase">Drip Check</span>
                  <span className="text-[10px] text-slate-400 font-sans">Wear an absurdly flashy designer outfit.</span>
                </button>
                <button onClick={() => handleCarpetChoice('classy')} className="bg-[#101410] hover:bg-[#1a2230] border border-[#22E748]/40 p-5 rounded-xl flex flex-col gap-2 transition-all hover:scale-[1.02] hover:z-10 shadow-lg cursor-pointer">
                  <span className="text-xs font-black text-[#22E748] tracking-widest uppercase">CLASSY</span>
                  <span className="text-lg font-bold text-white sports-font uppercase">Charity Gala</span>
                  <span className="text-[10px] text-slate-400 font-sans">Attend the host city hospital fundraiser.</span>
                </button>
                <button onClick={() => handleCarpetChoice('spicy')} className="bg-[#101410] hover:bg-[#1a2230] border border-[#F59E0B]/40 p-5 rounded-xl flex flex-col gap-2 transition-all hover:scale-[1.02] hover:z-10 shadow-lg cursor-pointer">
                  <span className="text-xs font-black text-[#F59E0B] tracking-widest uppercase">SPICY</span>
                  <span className="text-lg font-bold text-white sports-font uppercase">Rivalry Banter</span>
                  <span className="text-[10px] text-slate-400 font-sans">Talk some trash about your division rivals to the media.</span>
                </button>
              </div>
            </>
          ) : (
            <div className="bg-[#101410] border border-[rgba(255,255,255,0.1)] p-8 rounded-xl shadow-2xl flex flex-col items-center">
               <p className="text-xl font-bold text-white mb-6 text-center">{carpetFeedback.msg}</p>
               <div className="flex flex-wrap gap-3 justify-center">
                 {carpetFeedback.idolHit !== 0 && (
                    <span className={`font-black sports-font tracking-widest text-sm px-4 py-2 rounded border ${carpetFeedback.idolHit > 0 ? 'text-[#22E748] bg-[#22E748]/10 border-[#22E748]/30' : 'text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]/30'}`}>
                      {carpetFeedback.idolHit > 0 ? '+' : ''}{carpetFeedback.idolHit} FANS
                    </span>
                 )}
                 {carpetFeedback.mediaHit !== 0 && (
                    <span className={`font-black sports-font tracking-widest text-sm px-4 py-2 rounded border ${carpetFeedback.mediaHit > 0 ? 'text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/30' : 'text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]/30'}`}>
                      {carpetFeedback.mediaHit > 0 ? '+' : ''}{carpetFeedback.mediaHit} MEDIA TRUST
                    </span>
                 )}
                 {carpetFeedback.coachHit !== 0 && (
                    <span className={`font-black sports-font tracking-widest text-sm px-4 py-2 rounded border ${carpetFeedback.coachHit > 0 ? 'text-[#c084fc] bg-[#c084fc]/10 border-[#c084fc]/30' : 'text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]/30'}`}>
                      {carpetFeedback.coachHit > 0 ? '+' : ''}{carpetFeedback.coachHit} COACH TRUST
                    </span>
                 )}
               </div>
               <p className="text-xs text-slate-500 font-black tracking-widest uppercase mt-8 animate-pulse">
                 Heading to the ice...
               </p>
            </div>
          )}
        </div>
      )}

      {phase === 'skills-comp' && (
        <div className="w-full flex flex-col items-center justify-center">
            {minigameType === 'accuracy' && <AllStarAccuracy onComplete={handleMinigameComplete} strategy={captainStrategy} />}
            {minigameType === 'hardestShot' && <AllStarHardestShot onComplete={handleMinigameComplete} strategy={captainStrategy} />}
            {minigameType === 'fastestSkater' && <AllStarFastestSkater onComplete={handleMinigameComplete} strategy={captainStrategy} />}
            {minigameType === 'saveStreak' && <AllStarSaveStreak onComplete={handleMinigameComplete} strategy={captainStrategy} />}
        </div>
      )}

      {phase === 'result' && skillsFeedback && carpetFeedback && (
        <div className="max-w-2xl w-full mt-2 animate-fade-in bg-[#101410] border border-[#22E748]/40 p-8 rounded-xl shadow-[0_0_30px_rgba(34,231,72,0.15)] flex flex-col items-center">
           
           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">SKILLS COMPETITION RESULT</p>
           <p className="text-3xl font-black text-white mb-4 sports-font uppercase text-center leading-snug">{skillsFeedback.msg}</p>
           
           <div className="bg-[#1a2230] border border-slate-700 w-full py-4 rounded-lg flex justify-center divide-x divide-slate-600 mb-6">
              <div className="px-6 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">EVENT</p>
                  <p className="text-lg font-black text-white sports-font">{skillsFeedback.eventName}</p>
              </div>
              <div className="px-6 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SCORE</p>
                  <p className="text-lg font-black text-[#F59E0B] sports-font">
                     {skillsFeedback.time 
                        ? (minigameType === 'saveStreak' ? `${skillsFeedback.time} SAVES` : `${skillsFeedback.time.toFixed(2)} SEC`) 
                        : `${skillsFeedback.speed.toFixed(1)} MPH`}
                  </p>
              </div>
           </div>
           
           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">WEEKEND REWARDS EARNED</p>
           <div className="flex flex-wrap justify-center gap-3 w-full">
             {(carpetFeedback.idolHit + skillsFeedback.idolBoost) > 0 && (
               <span className="font-black sports-font tracking-widest text-sm px-4 py-2 rounded border text-[#22E748] bg-[#22E748]/10 border-[#22E748]/30">
                 +{Math.min(50, carpetFeedback.idolHit + skillsFeedback.idolBoost)} FANS
               </span>
             )}
             {skillsFeedback.ovrBoost > 0 && (
               <span className="font-black sports-font tracking-widest text-sm px-4 py-2 rounded border text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/30">
                 +{Math.min(2, skillsFeedback.ovrBoost)} OVR
               </span>
             )}
             {carpetFeedback.mediaHit > 0 && (
               <span className="font-black sports-font tracking-widest text-sm px-4 py-2 rounded border text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/30">
                 +{carpetFeedback.mediaHit} MEDIA TRUST
               </span>
             )}
           </div>

           <button onClick={finishAllStar} className="mt-8 btn-primary w-full py-4 rounded-xl font-black sports-font tracking-widest text-lg uppercase transition-transform hover:scale-105 cursor-pointer">
             RETURN TO SEASON
           </button>
        </div>
      )}
    </div>
  );
}