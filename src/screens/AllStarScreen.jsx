import { useState } from 'react';
import { useAppContext } from '../AppContext';
import { applyOvrDelta, recomputeOvr, capFanStatus } from '../utils/gameHelpers';
import AllStarAccuracy from '../components/AllStarAccuracy';
import AllStarHardestShot from '../components/AllStarHardestShot';
import AllStarFastestSkater from '../components/AllStarFastestSkater';
import AllStarSaveStreak from '../components/AllStarSaveStreak';
import { CHOICE_ROW, kickerClass, TAG_AMBER, TAG_GREEN, TAG_RED, TITLE_LG } from '../utils/ui';

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
  const { handleTrain, player, setPlayer } = useAppContext();

  // The All-Star Game is an exhibition in late January, about sixty per cent of
  // the way through the schedule. The weekend ending does not end the season: it
  // sends the player back out to play on towards the deadline in March.
  const finishSeason = () => handleTrain(null);
  
  // Use the league the player earned the nod in, which may not be the one he is
  // active in now
  const asgLeague = player.currentAsg || player.league;
  
  const [city] = useState(() => {
     const pool = getHostCities(asgLeague);
     return pool[Math.floor(Math.random() * pool.length)];
  });
  
  const isCaptain = player.ovr >= 90 || player.fanStatus >= 600;

  const [phase, setPhase] = useState('intro'); 
  // The captain's draft philosophy starts on a sensible default rather than
  // being a screen of its own. It buffs the skills competition, so having one
  // selected is strictly better than being made to pick one before you are
  // allowed to see the weekend.
  const [captainStrategy, setCaptainStrategy] = useState(isCaptain ? 'speed' : null);
  const [carpetFeedback, setCarpetFeedback] = useState(null);
  const [skillsFeedback, setSkillsFeedback] = useState(null);

  // Whether the flashy suit lands is rolled when the weekend opens rather than
  // at the moment of the click, which keeps the roll out of render entirely.
  const [dripLands] = useState(() => Math.random() > 0.4);

  const [minigameType] = useState(() => {
     if (player.pos === 'G') return 'saveStreak';
     const games = ['accuracy', 'hardestShot', 'fastestSkater'];
     return games[(player.stats?.seasonsPlayed || 0) % games.length];
  });

  const handleDecline = () => {
     setPlayer(p => ({ 
         ...p, 
         stamina: Math.min(100, p.stamina + 1),
         fanStatus: Math.max(0, p.fanStatus - 5),
         relationships: {
             ...p.relationships,
             media: Math.max(0, (p.relationships?.media || 50) - 15)
         }
     }));
     setPhase('declined');
  };

const handleQuickSim = () => {
     setCarpetFeedback({ msg: "You kept a low profile and saved your energy for the regular season.", fanHit: 5, mediaHit: 0, coachHit: 0 });
     // No event was entered and no score was posted, so the result panel must
     // not report one. It used to print EVENT "Weekend Sim" and SCORE
     // "10.00 SEC", which is a time nobody skated.
     setSkillsFeedback({ msg: "You made a brief, respectful appearance at the skills competition and left the stage to the others.", ovrBoost: 0, fanBoost: 5, simmed: true });
     setPhase('result');
  };

  // Picking a philosophy no longer advances anything; the entrance below is what
  // commits the weekend.
  const handleCaptainDraft = (strategy) => setCaptainStrategy(strategy);

  const handleCarpetChoice = (type) => {
    let msg, fanHit = 0, mediaHit = 0, coachHit = 0;

    if (type === 'safe') {
      msg = "You spent an hour signing autographs for kids.";
      fanHit = 15;
    } else if (type === 'risky') {
      if (dripLands) {
        msg = "Your suit went viral, and the fans loved it.";
        fanHit = 40;
      } else {
        msg = "You wore something nobody could explain and got roasted online for it.";
        fanHit = -15;
      }
    } else if (type === 'classy') {
      msg = "You went to the hospital fundraiser, and your coach and the media both noticed.";
      fanHit = 10; mediaHit = 10; coachHit = 5;
    } else if (type === 'spicy') {
      msg = "You called out your division rivals in an interview. The fans loved it, and the media thought it was out of line.";
      fanHit = 25; mediaHit = -10;
    }

    setCarpetFeedback({ msg, fanHit, mediaHit, coachHit });
    // Straight onto the ice. There used to be a panel here repeating what the
    // entrance earned, on a three second timer, and then the same numbers again
    // on the result screen at the end of the weekend.
    setPhase('skills-comp');
  };

  const handleMinigameComplete = (result) => {
    setSkillsFeedback(result);
    setPhase('result');
  };

  const finishAllStar = () => {
    const totalFans = Math.min(50, (carpetFeedback?.fanHit || 0) + (skillsFeedback?.fanBoost || 0));
    const totalOvr = Math.min(2, skillsFeedback?.ovrBoost || 0);

    setPlayer(p => {
      const withOvr = applyOvrDelta(p, totalOvr);
      return {
          ...withOvr,
          fanStatus: capFanStatus(withOvr.fanStatus + totalFans),
          ovr: recomputeOvr(withOvr),
          relationships: {
             ...withOvr.relationships,
             media: Math.min(100, Math.max(0, (withOvr.relationships?.media || 50) + (carpetFeedback?.mediaHit || 0))),
             coach: Math.min(100, Math.max(0, (withOvr.relationships?.coach || 50) + (carpetFeedback?.coachHit || 0)))
          }
      };
    });

    finishSeason();
  };

  const eventName = asgLeague === 'NCAA' ? 'NCAA All-American Game' : `${asgLeague} All-Star Game`;

  return (
    <div className="game-panel p-6 sm:p-10 mt-2 text-center flex flex-col items-center min-h-[500px]">
      
      <div className="mb-8 flex flex-col items-center">
         <span className={kickerClass('neutral')}>
            Live from {city}
         </span>
         <h2 className={`mt-5 ${TITLE_LG}`}>
           {player.league === 'NCAA' ? 'All-American' : 'All-Star'} weekend
         </h2>
      </div>

      {phase === 'intro' && (
         <div className="max-w-3xl w-full mt-2 animate-fade-in flex flex-col gap-5">
           {/* One screen.
               The weekend used to open on a panel whose only job was a button
               that said head to the red carpet, then the carpet, then a panel
               repeating what the carpet earned, then the competition, then the
               result repeating it again. The invitation, the captain's call and
               the entrance all belong together: pick an entrance and you are on
               the ice. */}
           <div className={`bg-[#101410] border p-5 sm:p-6 rounded-xl ${isCaptain ? 'border-[#F59E0B]/30' : 'border-[#3b82f6]/30'}`}>
             <h3 className={`text-xl sm:text-2xl font-black sports-font uppercase mb-2 ${isCaptain ? 'text-[#F59E0B]' : 'text-white'}`}>
               {isCaptain ? `\ud83c\udf96\ufe0f ${eventName} Captain` : `${player.league === 'NCAA' ? 'All-American' : 'All-Star'} Selection`}
             </h3>
             <p className="text-slate-300 font-sans text-sm sm:text-base">
               {isCaptain
                 ? `One of the league's top vote-getters, so you are building a squad as well as playing in ${city}.`
                 : `You are going to ${city} to represent your club. Put on a show.`}
             </p>

             {isCaptain && (
               <div className="mt-4">
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                   Draft philosophy · buffs your skills event
                 </p>
                 <div className="grid grid-cols-3 gap-2">
                   {[
                     { key: 'speed', label: 'Speed', accent: '#22E748' },
                     { key: 'power', label: 'Power', accent: '#22E748' },
                     { key: 'grit', label: '200-foot', accent: '#22E748' }
                   ].map(opt => (
                     <button
                       key={opt.key}
                       onClick={() => handleCaptainDraft(opt.key)}
                       aria-pressed={captainStrategy === opt.key}
                       className="py-2.5 px-2 rounded-lg font-black sports-font uppercase text-[11px] sm:text-xs tracking-widest transition-colors cursor-pointer border"
                       style={captainStrategy === opt.key
                         ? { borderColor: opt.accent, background: `${opt.accent}1f`, color: '#fff' }
                         : { borderColor: 'rgba(255,255,255,0.1)', background: '#0a0d0a', color: '#94a3b8' }}
                     >
                       {opt.label}
                     </button>
                   ))}
                 </div>
               </div>
             )}
           </div>

           <div>
             <p className="text-sm sm:text-base text-slate-300 mb-3 font-sans">
               The carpet outside the arena in {city} is swarming with media. How do you turn up?
             </p>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
               {[
                 { key: 'safe', tag: 'Safe', tagCls: TAG_GREEN, title: 'Sign autographs', blurb: "Sign for the kids until they run out of things to sign." },
                 { key: 'risky', tag: 'Risky', tagCls: TAG_RED, title: 'Drip check', blurb: 'Wear an absurdly flashy designer outfit.' },
                 { key: 'classy', tag: 'Classy', tagCls: TAG_GREEN, title: 'Charity gala', blurb: 'Attend the host city hospital fundraiser.' },
                 { key: 'spicy', tag: 'Spicy', tagCls: TAG_AMBER, title: 'Rivalry banter', blurb: 'Talk some trash about your division rivals.' }
               ].map(opt => (
                 <button
                   key={opt.key}
                   onClick={() => handleCarpetChoice(opt.key)}
                   className={CHOICE_ROW}
                 >
                   <span className="flex justify-between items-start gap-4 w-full">
                     <span className="flex flex-col min-w-0">
                       <span className="font-bold leading-tight text-sm sm:text-base text-white">{opt.title}</span>
                       <span className="text-[10px] sm:text-xs text-slate-400 font-medium mt-0.5">{opt.blurb}</span>
                     </span>
                     <span className={opt.tagCls}>{opt.tag}</span>
                   </span>
                 </button>
               ))}
             </div>
           </div>

           <div className="flex flex-col sm:flex-row gap-3">
             <button onClick={handleQuickSim} className="btn-secondary flex-1 py-3 px-6 rounded-xl sports-font text-sm tracking-widest cursor-pointer">
                Quick sim the weekend
             </button>
             {player.age >= 32 && (
                <button onClick={handleDecline} className="btn-secondary flex-1 py-3 px-6 rounded-xl sports-font text-sm tracking-widest cursor-pointer">
                   Decline and rest
                </button>
             )}
           </div>
         </div>
      )}

      {phase === 'declined' && (
         <div className="max-w-2xl w-full mt-2 animate-fade-in bg-[#101410] border border-[#ef4444]/40 p-8 rounded-xl flex flex-col items-center">
            <h3 className="text-3xl font-black text-[#ef4444] sports-font uppercase mb-4">INVITATION DECLINED</h3>
            <p className="text-lg text-slate-300 mb-6 font-sans">
              You skipped the All-Star weekend to rest. Under league rules, that means an automatic <strong>1-game suspension</strong>. The media is questioning your commitment, and you got the rest you needed (+1 Stamina).
            </p>
            <button onClick={() => finishSeason()} className="btn-primary w-full py-4 rounded-xl font-black sports-font tracking-widest text-lg uppercase transition-transform hover:scale-105 cursor-pointer">
              SERVE SUSPENSION & RETURN
            </button>
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
        <div className="max-w-2xl w-full mt-2 animate-fade-in bg-[#101410] border border-[#22E748]/40 p-8 rounded-xl flex flex-col items-center">
           
           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{skillsFeedback.simmed ? 'YOUR WEEKEND' : 'SKILLS COMPETITION RESULT'}</p>
           <p className="text-3xl font-black text-white mb-4 sports-font uppercase text-center leading-snug">{skillsFeedback.msg}</p>
           
           {!skillsFeedback.simmed && (
             <div className="bg-[#151b15] border border-slate-700 w-full py-4 rounded-lg flex justify-center divide-x divide-slate-600 mb-6">
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
           )}
           {skillsFeedback.simmed && <div className="mb-2" />}
           
           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">WEEKEND REWARDS EARNED</p>
           <div className="flex flex-wrap justify-center gap-3 w-full">
             {(carpetFeedback.fanHit + skillsFeedback.fanBoost) > 0 && (
               <span className="font-black sports-font tracking-widest text-sm px-4 py-2 rounded border text-[#22E748] bg-[#22E748]/10 border-[#22E748]/30">
                 +{Math.min(50, carpetFeedback.fanHit + skillsFeedback.fanBoost)} FANS
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