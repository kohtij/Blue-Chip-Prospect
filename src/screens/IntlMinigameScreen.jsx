import { useState, useCallback, useRef } from 'react';
import { useAppContext } from '../AppContext';
import { capFanStatus } from '../utils/gameHelpers';
import { getStakes } from '../utils/stakes';
import { getMinigamePool } from '../data/minigames';

const GAME_TYPE_TO_KEY = {
  breakaway: 'breakaway',
  faceoff: 'faceoff',
  deflect: 'deflection',
  shootout: 'shootout',
  onetimer: 'onetimer',
  crease: 'crease',
  block: 'shotblock',
  breakout: 'breakout',
  screened: 'screened',
  zone_battle: 'zone_battle',
};

const PREP_SCENARIOS = [
  {
    title: "🍽️ THE TEAM DINNER",
    desc: "The coaches arranged a standard buffet, but some teammates want to sneak out for famous local street food.",
    choices: [
      { label: 'Eat at the Hotel', isRisky: false, desc: 'Safe carbs.', winEffect: { fanStatus: 5 }, win: "You ate the bland pasta. Not exciting, but safe." },
      { label: 'Try Local Street Food', isRisky: true, chance: 0.5, desc: 'Could be amazing energy, or a disaster.', winEffect: { fanStatus: 25 }, failEffect: { fanStatus: -15 }, win: "The food was incredible! Great team bonding.", fail: "Food poisoning. You spent the night hugging the toilet." }
    ]
  },
  {
    title: "🏞️ THE DAY OFF",
    desc: "You have a full day off. Stay in your room to study tape, or join the guys for a hike around the city.",
    choices: [
      { label: 'Study Film', isRisky: false, desc: 'Review the opponent\'s powerplay.', winEffect: { fanStatus: 5 }, win: "You picked up on their tendencies and feel prepared." },
      { label: 'Go Sightseeing', isRisky: true, chance: 0.6, desc: 'Great for the mind, risky for the legs.', winEffect: { fanStatus: 30 }, failEffect: { fanStatus: -10 }, win: "The fresh air and bonding cleared your head!", fail: "You walked 10 miles and your legs feel like lead." }
    ]
  },
  {
    title: "🎤 THE MEDIA SCRUM",
    desc: "The international press is begging for a controversial headline about tomorrow's matchup against your rivals.",
    choices: [
      { label: 'Give Cliché Answers', isRisky: false, desc: '"Pucks deep, 110%, etc."', winEffect: { fanStatus: 5 }, win: "Boring, but you avoided giving them bulletin board material." },
      { label: 'Guarantee a Victory', isRisky: true, chance: 0.4, desc: 'Call your shot on the global stage.', winEffect: { fanStatus: 60 }, failEffect: { fanStatus: -35 }, win: "The fans loved the swagger! You are oozing with confidence.", fail: "The media ripped your arrogance, adding immense pressure." }
    ]
  },
  {
    title: "🏒 EQUIPMENT TINKERING",
    desc: "Your stick sponsor drops off an experimental prototype right before practice.",
    choices: [
      { label: 'Stick to Old Reliable', isRisky: false, desc: 'Use the gear that got you here.', winEffect: { fanStatus: 0 }, win: "No surprises. You feel totally comfortable." },
      { label: 'Use the Prototype', isRisky: true, chance: 0.5, desc: 'Could feel amazing, or completely foreign.', winEffect: { fanStatus: 20 }, failEffect: { fanStatus: -10 }, win: "The puck jumps off the blade! You feel lethal.", fail: "You can't feel the puck at all. A huge mistake." }
    ]
  },
  {
    title: "👀 PRE-GAME WARMUPS",
    desc: "The opposing team is staring you down from the red line, trying to intimidate you.",
    choices: [
      { label: 'Focus on Stretching', isRisky: false, desc: 'Ignore them and get ready.', winEffect: { fanStatus: 5 }, win: "You ignored the noise and got a great sweat going." },
      { label: 'Stare Them Down', isRisky: true, chance: 0.55, desc: 'Skate to the red line and send a message.', winEffect: { fanStatus: 30 }, failEffect: { fanStatus: -20 }, win: "You didn't blink. You are in their heads.", fail: "You tripped while trying to look intimidating. Embarrassing." }
    ]
  },
  {
    title: "📱 LOCKER ROOM DISTRACTION",
    desc: "A massive rumor about your NHL club is trending on social media right before puck drop.",
    choices: [
      { label: 'Turn Phone Off', isRisky: false, desc: 'Block the noise.', winEffect: { fanStatus: 0 }, win: "You locked in and kept your focus on the tournament." },
      { label: 'Post a Cryptic Reply', isRisky: true, chance: 0.4, desc: 'Stir the pot for engagement.', winEffect: { fanStatus: 50 }, failEffect: { fanStatus: -25 }, win: "The internet went wild. Your brand is soaring.", fail: "Fans called you selfish for focusing on drama over the tournament." }
    ]
  },
  {
    title: "🤒 THE MINOR TWEAK",
    desc: "You felt a slight pull in your groin during morning skate. The trainers leave it up to you.",
    choices: [
      { label: 'Play Through It', isRisky: true, chance: 0.6, desc: 'Risk aggravating it for glory.', winEffect: { fanStatus: 40 }, failEffect: { fanStatus: -15 }, win: "You gutted it out and the pain faded away. A warrior effort.", fail: "You looked a step slow all night and hurt the team." },
      { label: 'Take an Injection', isRisky: false, desc: 'Numb the pain completely.', winEffect: { fanStatus: 5 }, win: "You can't feel a thing. Good to go." }
    ]
  },
  {
    title: "🤝 THE CAPTAIN'S CALL",
    desc: "The locker room is tense. The captain asks you to lead the pre-game speech.",
    choices: [
      { label: 'Deliver a Fiery Speech', isRisky: true, chance: 0.5, desc: 'Fire up the boys.', winEffect: { fanStatus: 25 }, failEffect: { fanStatus: -10 }, win: "The room was ready to run through a brick wall!", fail: "You stumbled over your words. The veterans rolled their eyes." },
      { label: 'Keep it Brief', isRisky: false, desc: 'Let your play do the talking.', winEffect: { fanStatus: 5 }, win: "You said a few quiet words and strapped on your helmet." }
    ]
  }
];

const MEDAL_STYLE = {
  Gold:   { icon: '🥇', box: 'border-[#F59E0B]/60 bg-[#F59E0B]/10', text: 'text-[#F59E0B]' },
  Silver: { icon: '🥈', box: 'border-slate-300/50 bg-slate-300/10',  text: 'text-slate-200' },
  Bronze: { icon: '🥉', box: 'border-[#b45309]/60 bg-[#b45309]/10',  text: 'text-[#d97706]' },
};

// Round-specific prep scenarios, on top of the general pool.
const ROUND_SCENARIOS = {
  GOLD: {
    title: "🥇 THE WEIGHT OF A NATION",
    desc: "The Prime Minister just called the locker room to wish you luck. The entire country is shutting down to watch this game.",
    choices: [
      { label: 'Embrace the Pressure', isRisky: true, chance: 0.5, desc: 'Use the national spotlight as fuel.', winEffect: { fanStatus: 80 }, failEffect: { fanStatus: -30 }, win: "You thrive in the spotlight! Your confidence is sky high.", fail: "The pressure is suffocating. You feel like you're gripping the stick too tight." },
      { label: 'Block Out the Noise', isRisky: false, desc: 'Treat it like just another hockey game.', winEffect: { fanStatus: 10 }, win: "You successfully blocked the noise and kept your heart rate steady." }
    ]
  },
  BRONZE: {
    title: "🥉 THE CONSOLATION ROOM",
    desc: "The room is flat. Nobody came here to play for third, and the coach can see it on every face.",
    choices: [
      { label: 'Rally the Room', isRisky: true, chance: 0.55, desc: 'Remind them a medal is still a medal.', winEffect: { fanStatus: 35 }, failEffect: { fanStatus: -15 }, win: "The room picked itself up. You are playing for something again.", fail: "Nobody met your eye. The speech landed on deaf ears." },
      { label: 'Say Nothing', isRisky: false, desc: 'Let the veterans handle it.', winEffect: { fanStatus: 5 }, win: "You kept quiet and focused on your own preparation." }
    ]
  },
  SEMIFINAL: {
    title: "🎯 ONE GAME FROM THE FINAL",
    desc: "Win and you play for gold. The coaching staff offers you a bigger role on the penalty kill for the biggest game of the tournament.",
    choices: [
      { label: 'Take the Minutes', isRisky: true, chance: 0.5, desc: 'More ice, more exposure, more risk.', winEffect: { fanStatus: 45 }, failEffect: { fanStatus: -20 }, win: "You handled the toughest assignment on the roster.", fail: "You were caught out of position and it cost a goal." },
      { label: 'Stick to Your Role', isRisky: false, desc: 'Do your job and nothing more.', winEffect: { fanStatus: 8 }, win: "You played a clean, simple game within your role." }
    ]
  },
  SURVIVAL: {
    title: "⚠️ RELEGATION PANIC",
    desc: "If you lose tonight, your country gets relegated to a lower division. The local federation is threatening to pull funding.",
    choices: [
      { label: 'Play Desperate', isRisky: true, chance: 0.6, desc: 'Sell out physically to keep your country alive.', winEffect: { fanStatus: 40 }, failEffect: { fanStatus: -20 }, win: "Your desperation sparked the room. Everyone is ready for war.", fail: "You look panicked. The anxiety is spreading through the lineup." },
      { label: 'Play a Simple Game', isRisky: false, desc: 'Focus on defensive structure and zero mistakes.', winEffect: { fanStatus: 5 }, win: "You settled the room down and committed to a boring, safe game." }
    ]
  },
  PROMOTION: {
    title: "📈 ONE WIN FROM THE BIG ROOM",
    desc: "Win and your nation moves up a division for the first time in years. The federation president is in the stands.",
    choices: [
      { label: 'Carry the Team', isRisky: true, chance: 0.5, desc: 'Take every shift you can get.', winEffect: { fanStatus: 40 }, failEffect: { fanStatus: -18 }, win: "You dragged them up a division on your back.", fail: "You tried to do too much and the structure fell apart." },
      { label: 'Trust the System', isRisky: false, desc: 'Play the game plan exactly.', winEffect: { fanStatus: 8 }, win: "Disciplined, structured, and exactly what was asked." }
    ]
  }
};

function pickScenario(round) {
  const pool = [...PREP_SCENARIOS];
  const extra = ROUND_SCENARIOS[round];
  if (extra) {
    // Weighted so the round's own scenario actually shows up on the big nights
    // rather than being one of nine equally likely options.
    pool.push(extra, extra, extra);
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

// Helper component for drawing the bracket
  const BracketMatch = ({ match, title }) => (
      <div className="bg-[#1a2230] border border-[rgba(255,255,255,0.065)] rounded-lg p-2.5 sm:p-3 text-[10px] sm:text-xs font-bold uppercase w-full shadow-inner relative overflow-hidden">
          <div className="text-slate-500 mb-2 border-b border-[rgba(255,255,255,0.05)] pb-1.5 tracking-widest">{title}</div>
          <div className={`flex justify-between items-center ${match.winner?.id === match.t1?.id ? 'text-[#22E748]' : (match.t1?.isPlayer ? 'text-[#3b82f6]' : 'text-slate-300')}`}>
              <span className="flex items-center gap-2">
                 {match.t1?.img ? <img src={match.t1.img} className="w-4 h-3 object-cover rounded-[1px] opacity-90" alt="" /> : <span className="w-4"></span>}
                 {match.t1?.id || 'TBD'}
              </span>
              {match.winner && match.winner.id === match.t1?.id && <span className="text-[10px]">✓</span>}
          </div>
          <div className={`flex justify-between items-center mt-2 ${match.winner?.id === match.t2?.id ? 'text-[#22E748]' : (match.t2?.isPlayer ? 'text-[#3b82f6]' : 'text-slate-300')}`}>
              <span className="flex items-center gap-2">
                 {match.t2?.img ? <img src={match.t2.img} className="w-4 h-3 object-cover rounded-[1px] opacity-90" alt="" /> : <span className="w-4"></span>}
                 {match.t2?.id || 'TBD'}
              </span>
              {match.winner && match.winner.id === match.t2?.id && <span className="text-[10px]">✓</span>}
          </div>
      </div>
  );

export default function IntlMinigameScreen() {
  const { 
    BreakawayGame, BreakoutGame, CreaseGame, DeflectionGame, FaceoffGame, ShootoutGame, ShotBlockGame, OneTimerGame, ZoneBattleGame, ScreenedShotGame,
    activeEvent, handleInteractiveResult, intlResult, minigameContext, player, proceedToNextScreen, resetMinigameLock, safeNationalities, setIntlResult, setPlayer
  } = useAppContext();
  
  // TOURNAMENT HUB VIEWS: 'standings' | 'bracket' | 'prep' | 'game' | 'result'
  const [view, setView] = useState(player.intlData ? 'standings' : 'prep');
  const [activeMgKey, setActiveMgKey] = useState(null);
  const [prepFeedback, setPrepFeedback] = useState(null);
  // The prep scenario used to be picked once, with useState, and this screen stays
  // mounted for the whole knockout run, so you got the identical dinner or media
  // scrum before the quarter-final, the semi-final and the final. The round-specific
  // scenario was also chosen from the stake at mount, which is always QUARTERFINAL,
  // so THE WEIGHT OF A NATION could never appear before a medal game. Re-rolled per
  // round, off the round actually being played.
  const [scenario, setScenario] = useState(() => pickScenario(player.intlStakes));

  const mgLockRef = useRef(false);

  const nat = safeNationalities.find(n => n.id === player.nat);
  const countryName = nat?.sentenceName || nat?.name || 'your country';

  // Everything about the current round is read off the player, not frozen at mount.
  // The resolver writes the next round onto the player when a game is settled, so
  // this screen follows the run from the quarter-final through to the medal game
  // without a parallel copy of the bracket stage to keep in sync.
  const stake = player.intlStakes || 'GOLD';
  const division = player.natDiv || nat?.division || 'Top Division';
  const groupData = player.intlData || null;
  const isTopDiv = division === 'Top Division';
  const stakes = getStakes(minigameContext, stake, player.intlOppTier);

  // The international screen runs its minigames directly rather than through
  // MinigameScreen, so the stakes have to be handed over here too: without it the
  // gold medal game played at exactly the same difficulty as a camp drill.

  // Which medal, if any, this result just won.
  const medal = intlResult && (
    stake === 'GOLD' ? (intlResult.isWin ? 'Gold' : 'Silver')
    : stake === 'BRONZE' && intlResult.isWin ? 'Bronze'
    : null
  );

  // Your opponent in the round being played.
  let opponent = null;
  const upcomingMatchText = stakes.label;

  if (groupData?.bracket) {
      const b = groupData.bracket;
      const currentMatches = stake === 'QUARTERFINAL' ? b.qf
          : stake === 'SEMIFINAL' ? b.sf
          : stake === 'GOLD' ? [b.medal.gold]
          : stake === 'BRONZE' ? [b.medal.bronze]
          : [];
      const myMatch = currentMatches.find(m => m?.t1?.isPlayer || m?.t2?.isPlayer);
      if (myMatch) opponent = myMatch.t1?.isPlayer ? myMatch.t2 : myMatch.t1;
  }

  const handlePrepChoice = useCallback((c) => {
   mgLockRef.current = false;
   resetMinigameLock(); // clears App.jsx's shared lock — this screen runs its
                         // own minigames directly instead of via triggerMinigame()

   let isWin = true;
   let effect = c.winEffect;
   let msg = c.win;

   if (c.isRisky) {
       isWin = Math.random() < c.chance;
       effect = isWin ? c.winEffect : c.failEffect;
       msg = isWin ? c.win : c.fail;
   }

   const updatedPlayer = {
      ...player,
      fanStatus: capFanStatus((player.fanStatus || 0) + (effect.fanStatus || 0))
   };

   setPlayer(updatedPlayer);

   const canonicalPool = getMinigamePool(updatedPlayer.pos) || [];
   const keys = [...new Set(
      canonicalPool.map(m => GAME_TYPE_TO_KEY[m.gameType]).filter(Boolean)
   )];
   const pool = keys.length > 0 ? keys : ['zone_battle'];
   setActiveMgKey(pool[Math.floor(Math.random() * pool.length)]);

   setPrepFeedback({ msg, isWin, effect });
   setView('game');
}, [player, setPlayer, resetMinigameLock]);

  // Clicking Continue on a result either moves you to the next round of the
  // knockout run or leaves the tournament. This used to rebuild the bracket here
  // and bail out on any loss, which is why losing a semi-final ended the
  // tournament immediately after telling you that you would play for bronze.
  // The resolver now settles the bracket and names the next round; this only has
  // to decide whether to stay on the screen.
  const handleContinue = () => {
      const next = intlResult?.nextStake;
      setIntlResult(null);

      if (!next) {
          proceedToNextScreen(activeEvent, minigameContext, player);
          return;
      }

      // A fresh prep scenario for the new round, chosen off the round itself.
      setScenario(pickScenario(next));
      setPrepFeedback(null);
      setActiveMgKey(null);
      setView('bracket');
  };

  const wrappedOnComplete = (isWin) => {
      if (mgLockRef.current) return; // Prevent double-firing
      mgLockRef.current = true;
      
      handleInteractiveResult(
          isWin, 
          { win: {}, loss: {} }, 
          "You executed perfectly for your country!", 
          "You fell short under the immense pressure of the tournament."
      );
  };

  return (
    <div className="game-panel p-6 sm:p-12 mt-2 border-t-2 border-t-[#F59E0B] text-center">
      <div className="flex flex-col items-center justify-center mb-6">
          <span className="text-[10px] sm:text-xs font-bold text-[#3b82f6] uppercase tracking-widest bg-[#3b82f6]/10 border border-[#3b82f6]/30 px-4 py-1.5 rounded-full mb-3 shadow-inner">
              CURRENT TIER: {division}
          </span>
          <h2 className="flex justify-center items-center gap-2 text-3xl sm:text-5xl font-black text-[#F59E0B] sports-font tracking-tighter uppercase leading-tight w-full text-center drop-shadow-md">
            <span className="shrink-0">🌍</span>
            <span>{minigameContext === 'wjc' ? 'WORLD JUNIORS' : minigameContext === 'olympics' ? 'WINTER OLYMPICS' : 'WORLD CHAMPIONSHIP'}</span>
            <span className="shrink-0">🌍</span>
          </h2>
      </div>

      {view !== 'standings' && view !== 'bracket' && !intlResult && (
          <p className="text-sm sm:text-lg text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed flex items-center justify-center flex-wrap gap-2 text-center animate-fade-in">
            You are representing <strong className="text-white">{countryName}</strong> in a {upcomingMatchText}
            {opponent && <> against <strong className="text-[#ef4444]">Team {opponent.name}</strong>!</>}
          </p>
      )}

      {/* VIEW: STANDINGS */}
      {view === 'standings' && !intlResult && groupData && (
        <div className="max-w-4xl mx-auto fade-up mb-6">
            <div className="bg-[#101410] border border-[rgba(255,255,255,0.065)] p-4 sm:p-8 rounded-xl shadow-2xl text-left mb-6">
                <div className="flex justify-between items-end border-b border-[rgba(255,255,255,0.065)] pb-4 mb-6">
                    <div>
                        <h3 className="text-2xl font-black text-white uppercase sports-font">Tournament Hub</h3>
                        <p className="text-slate-400 font-sans text-sm mt-1">Round Robin Results</p>
                    </div>
                </div>

                <div className={`grid grid-cols-1 ${isTopDiv ? 'lg:grid-cols-2' : ''} gap-6 mb-6`}>
                    {[groupData.groupA, groupData.groupB].map((group, gIdx) => {
                        if (!group || group.length === 0) return null;
                        return (
                           <div key={gIdx} className="bg-[#1a2230] rounded-lg border border-[rgba(255,255,255,0.05)] overflow-hidden">
                               <div className="bg-black/40 px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-[rgba(255,255,255,0.05)]">
                                   Group {gIdx === 0 ? 'A' : 'B'}
                               </div>
                               <table className="w-full text-left text-xs sm:text-sm">
                                   <thead>
                                       <tr className="text-slate-500 bg-black/20">
                                           <th className="px-3 py-2 font-medium w-6 text-center">#</th>
                                           <th className="px-2 py-2 font-medium">Nation</th>
                                           <th className="px-2 py-2 font-medium text-center">W</th>
                                           <th className="px-2 py-2 font-medium text-center">L</th>
                                           <th className="px-2 py-2 font-medium text-center">OTL</th>
                                           <th className="px-3 py-2 font-bold text-white text-center">PTS</th>
                                       </tr>
                                   </thead>
                                   <tbody className="divide-y divide-[rgba(255,255,255,0.02)]">
                                       {group.map((t, i) => (
                                           <tr key={i} className={`${t.isPlayer ? 'bg-[#3b82f6]/10 text-white' : 'text-slate-300'} ${isTopDiv && i === 4 ? 'opacity-50' : ''}`}>
                                               <td className="px-3 py-2.5 text-center font-bold">{i + 1}</td>
                                               <td className="px-2 py-2.5 font-bold flex items-center gap-2">
                                                   <img src={t.img} className="w-4 h-3 object-cover rounded-[1px] opacity-90" alt="" />
                                                   {t.id}
                                               </td>
                                               <td className="px-2 py-2.5 text-center">{t.w}</td>
                                               <td className="px-2 py-2.5 text-center">{t.l}</td>
                                               <td className="px-2 py-2.5 text-center text-slate-500">{t.otl}</td>
                                               <td className="px-3 py-2.5 text-center font-black text-[#22E748]">{t.pts}</td>
                                           </tr>
                                       ))}
                                   </tbody>
                               </table>
                           </div>
                        );
                    })}
                </div>
            </div>
            
            <button 
                onClick={() => setView(groupData.bracket ? 'bracket' : 'prep')} 
                className="btn-primary w-full py-4 sm:py-5 rounded-xl text-lg sm:text-xl sports-font tracking-widest uppercase shadow-2xl transition-transform hover:scale-[1.02]"
            >
                ADVANCE TO {groupData.bracket ? 'KNOCKOUT BRACKET' : upcomingMatchText} ➔
            </button>
        </div>
      )}

      {/* VIEW: BRACKET */}
      {view === 'bracket' && !intlResult && groupData?.bracket && (
        <div className="max-w-4xl mx-auto fade-up mb-6">
            <div className="bg-[#101410] border border-[rgba(255,255,255,0.065)] p-4 sm:p-8 rounded-xl shadow-2xl text-left mb-6">
                <div className="flex justify-between items-end border-b border-[rgba(255,255,255,0.065)] pb-4 mb-6">
                    <div>
                        <h3 className="text-2xl font-black text-white uppercase sports-font">Knockout Stage</h3>
                        <p className="text-slate-400 font-sans text-sm mt-1">Single Elimination Bracket</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* QF Column */}
                    <div className="flex flex-col gap-3">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-[rgba(255,255,255,0.05)] pb-1 mb-1">Quarterfinals</div>
                        {groupData.bracket.qf.map(m => <BracketMatch key={m.id} match={m} title={m.id} />)}
                    </div>
                    {/* SF Column */}
                    <div className="flex flex-col gap-3 md:pt-8">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-[rgba(255,255,255,0.05)] pb-1 mb-1">Semifinals</div>
                        {groupData.bracket.sf.map(m => <BracketMatch key={m.id} match={m} title={m.id} />)}
                    </div>
                    {/* Medal Column */}
                    <div className="flex flex-col gap-3 md:pt-16">
                        <div className="text-[10px] font-bold text-[#F59E0B] uppercase tracking-widest border-b border-[#F59E0B]/30 pb-1 mb-1">Medal Rounds</div>
                        <BracketMatch match={groupData.bracket.medal.gold} title="Gold Medal Game" />
                        <div className="mt-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-[rgba(255,255,255,0.05)] pb-1 mb-1">Bronze Match</div>
                        <BracketMatch match={groupData.bracket.medal.bronze} title="3rd Place Game" />
                    </div>
                </div>
            </div>
            
            <button 
                onClick={() => setView('prep')} 
                className="btn-primary w-full py-4 sm:py-5 rounded-xl text-lg sm:text-xl sports-font tracking-widest uppercase shadow-2xl transition-transform hover:scale-[1.02]"
            >
                PLAY {upcomingMatchText} ➔
            </button>
        </div>
      )}

      {/* VIEW: PREP */}
      {view === 'prep' && !intlResult && (
        <div className="max-w-2xl mx-auto fade-up">
           <div className="bg-[#101410] border border-[rgba(255,255,255,0.065)] p-6 sm:p-8 rounded-xl shadow-2xl text-left mb-6">
              <h3 className="text-2xl font-black text-[#3b82f6] mb-3 uppercase sports-font">{scenario.title}</h3>
              <p className="text-slate-300 font-sans leading-relaxed text-sm sm:text-base mb-6">{scenario.desc}</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {scenario.choices.map((c, i) => (
                    <button
                      key={i}
                      onClick={() => handlePrepChoice(c)}
                      className="bg-[#101410] hover:bg-[#1a2230] border border-[rgba(255,255,255,0.065)] text-white p-4 sm:p-5 rounded-xl text-left transition-all cursor-pointer flex flex-col gap-2 shadow-lg group"
                    >
                      <div className="flex justify-between items-start sm:items-center w-full gap-4">
                         <h4 className="text-sm sm:text-base font-bold sports-font uppercase group-hover:text-[#3b82f6] transition-colors text-left leading-tight">{c.label}</h4>
                         <div className="flex items-center gap-2 shrink-0 mt-1 sm:mt-0">
                           {c.isRisky ? (
                              <span className="bg-[#ef4444]/10 text-[#ef4444] text-[10px] sm:text-xs px-2 py-1 rounded font-black tracking-widest uppercase border border-[#ef4444]/30">RISKY</span>
                           ) : (
                              <span className="bg-[#3b82f6]/10 text-[#3b82f6] text-[10px] sm:text-xs px-2 py-1 rounded font-black tracking-widest uppercase border border-[#3b82f6]/30">SAFE</span>
                           )}
                         </div>
                      </div>
                      <p className="text-xs text-slate-400 font-sans mt-2">{c.desc}</p>
                    </button>
                  ))}
              </div>
           </div>
        </div>
      )}

      {/* VIEW: GAME (REAL MINIGAMES) */}
      {view === 'game' && !intlResult && activeMgKey && (
      <div className="fade-up max-w-2xl mx-auto w-full">
        {prepFeedback && (
            <div className={`mb-6 p-4 border rounded-xl inline-block shadow-md ${prepFeedback.isWin ? 'border-[#22E748]/50 bg-[#22E748]/10 text-[#22E748]' : 'border-red-500/50 bg-red-500/10 text-red-400'}`}>
                <p className="font-bold text-sm tracking-wide uppercase">{prepFeedback.msg}</p>
            </div>
        )}
        
        <div className="bg-[#101410] border border-[rgba(255,255,255,0.065)] p-4 sm:p-6 rounded-xl shadow-2xl">
            {activeMgKey === 'breakaway' && <BreakawayGame onComplete={wrappedOnComplete} player={player} difficulty={stakes.difficulty} />}
            {activeMgKey === 'faceoff' && <FaceoffGame onComplete={wrappedOnComplete} player={player} difficulty={stakes.difficulty} />}
            {activeMgKey === 'deflection' && <DeflectionGame onComplete={wrappedOnComplete} player={player} difficulty={stakes.difficulty} />}
            {activeMgKey === 'shootout' && <ShootoutGame onComplete={wrappedOnComplete} player={player} difficulty={stakes.difficulty} />}
            {activeMgKey === 'onetimer' && <OneTimerGame onComplete={wrappedOnComplete} player={player} difficulty={stakes.difficulty} />}
            {activeMgKey === 'crease' && <CreaseGame onComplete={wrappedOnComplete} player={player} difficulty={stakes.difficulty} />}
            {activeMgKey === 'shotblock' && <ShotBlockGame onComplete={wrappedOnComplete} player={player} difficulty={stakes.difficulty} />}
            
            {/* The New Minigames */}
            {activeMgKey === 'breakout' && <BreakoutGame onComplete={wrappedOnComplete} player={player} difficulty={stakes.difficulty} />}
            {activeMgKey === 'screened' && <ScreenedShotGame onComplete={wrappedOnComplete} player={player} difficulty={stakes.difficulty} />}
            {activeMgKey === 'zone_battle' && <ZoneBattleGame onComplete={wrappedOnComplete} player={player} difficulty={stakes.difficulty} />}
        </div>
      </div>
      )}

      {/* VIEW: RESULT */}
      {intlResult && (
        <div className="max-w-2xl mx-auto mt-2 fade-up">
          <div className={`rounded-2xl border-2 p-6 sm:p-10 flex flex-col items-center text-center ${intlResult.isWin ? 'border-[#22E748]/50 bg-[#22E748]/[0.06]' : 'border-[#ef4444]/50 bg-[#ef4444]/[0.06]'}`}>
            <h3 className={`text-2xl sm:text-4xl font-black sports-font uppercase tracking-tighter mb-4 ${intlResult.isWin ? 'text-[#22E748]' : 'text-[#ef4444]'}`}>
              {intlResult.isWin ? 'VICTORY!' : 'DEFEAT!'}
            </h3>

            {/* A medal is the whole point of the tournament and used to be reported
                as nothing but a fan status number. */}
            {medal && (
              <div className={`mb-5 px-6 py-3 rounded-xl border-2 flex items-center gap-3 ${MEDAL_STYLE[medal].box}`}>
                <span className="text-3xl sm:text-4xl">{MEDAL_STYLE[medal].icon}</span>
                <div className="text-left">
                  <div className={`text-lg sm:text-2xl font-black sports-font uppercase tracking-tight ${MEDAL_STYLE[medal].text}`}>
                    {medal} Medal
                  </div>
                  <div className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-widest font-bold">
                    {countryName} · {minigameContext === 'wjc' ? 'World Juniors' : minigameContext === 'olympics' ? 'Winter Olympics' : 'World Championship'}
                  </div>
                </div>
              </div>
            )}

            <p className="text-base sm:text-xl italic text-slate-300 mb-6 font-sans leading-relaxed">"{intlResult.msg}"</p>

            <div className="flex justify-center items-center gap-2 flex-wrap">
              {intlResult.effect?.fanStatus !== undefined && intlResult.effect?.fanStatus !== 0 ? (
                <span className={`text-xs sm:text-sm font-black sports-font tracking-widest px-3 py-1.5 rounded-lg border ${intlResult.effect.fanStatus >= 0 ? 'text-[#22E748] bg-[#22E748]/10 border-[#22E748]/30' : 'text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]/30'}`}>
                  {intlResult.effect.fanStatus >= 0 ? '📈' : '📉'} {intlResult.effect.fanStatus > 0 ? '+' : ''}{intlResult.effect.fanStatus} FANS
                </span>
              ) : null}
              {intlResult.effect?.ovr !== undefined && intlResult.effect?.ovr !== 0 ? (
                <span className={`text-xs sm:text-sm font-black sports-font tracking-widest px-3 py-1.5 rounded-lg border ${intlResult.effect.ovr >= 0 ? 'text-[#22E748] bg-[#22E748]/10 border-[#22E748]/30' : 'text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]/30'}`}>
                  {intlResult.effect.ovr > 0 ? '+' : ''}{intlResult.effect.ovr} OVR
                </span>
              ) : null}
            </div>
          </div>
            
          <button
            onClick={handleContinue}
            className="btn-primary py-4 px-12 rounded-xl text-lg sm:text-xl cursor-pointer sports-font tracking-widest w-full mt-6 shadow-2xl"
          >
            CONTINUE ➔
          </button>
        </div>
      )}
    </div>
  );
}