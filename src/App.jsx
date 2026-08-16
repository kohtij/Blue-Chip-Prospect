import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  nhlTeams, ohlTeams, whlTeams, qmjhlTeams, ushlTeams, ahlTeams, shlTeams, liigaTeams, ncaaTeams,
  nationalities, juniorLeagues, euroLeagues, LEAGUE_CONFIG,
  getTeamData, getDeployment, getOpponentPool, getPrimaryRival,
  getTeamConference, getTeamDivision, getConferences, getDivisions,
  getPlayoffFormat, getPlayoffRounds, groupByConference
} from './data/teams';
import { getAwardImage, getPlayoffTrophyImage } from './data/awards';
import { shopItems, skaterTrainingPool, goalieTrainingPool, eventDeck } from './data/economy';
import { getMinigamePool, findMinigame } from './data/minigames';
import {
  cap, capIdol, formatMoney, getIdolTier, getTransferImpact,
  getActiveStat, applyOvrDelta, recomputeOvr, simulateSeason, generatePlayoffDeck,
  choiceChance
// Import the new helpers.
} from './utils/gameHelpers';

// Extracted module-scope helpers
import {
  makeInitialPlayer, getRole, getGamesPerMatchup, getWinsNeeded,
  getDisplayDeployment, getFullTeamName, getPlayoffTitles,
  ACCENT, ARCH_PILL, MASTER_ACHIEVEMENTS, PRESS_VIBES, PRESS_JOURNALISTS,
  getJournalistsForLeague, getAwardPill, PRESS_QUESTIONS
} from './utils/appHelpers';

// Extracted screen components
import PressScreen from './screens/PressScreen';
import PressResultScreen from './screens/PressResultScreen';
import CombineScreen from './screens/CombineScreen';
import DraftScreen from './screens/DraftScreen';
import PreseasonScreen from './screens/PreseasonScreen';
import EventScreen from './screens/EventScreen';
import MinigameScreen from './screens/MinigameScreen';
import EventResultScreen from './screens/EventResultScreen';
import MemorialCupScreen from './screens/MemorialCupScreen';
import NegotiationScreen from './screens/NegotiationScreen';

// Extracted shared components
import TeamLogo from './components/TeamLogo';
import TrophySVG from './components/TrophySVG';
import TrophyImage from './components/TrophyImage';
import Dashboard from './components/Dashboard';
import ShootoutGame from './components/ShootoutGame';
import FaceoffGame from './components/FaceoffGame';
import CreaseGame from './components/CreaseGame';
import FilmRoomGame from './components/FilmRoomGame';
import DeflectionGame from './components/DeflectionGame';
import ShotBlockGame from './components/ShotBlockGame';
import BreakawayGame from './components/BreakawayGame';
import OneTimerGame from './components/OneTimerGame';

// Additional extracted screens (this turn)
import CreationScreen from './screens/CreationScreen';
import RetirementScreen from './screens/RetirementScreen';
import ArbitrationScreen from './screens/ArbitrationScreen';
import TradeDeadlineScreen from './screens/TradeDeadlineScreen';
import IntlMinigameScreen from './screens/IntlMinigameScreen';
import RecapScreen from './screens/RecapScreen';
import PlayoffsScreen from './screens/PlayoffsScreen';
import TransferScreen from './screens/TransferScreen';

// =====================================================================
// INTERACTIVE MINIGAME COMPONENTS
// =====================================================================

function App() {
  const [screen, setScreen] = useState('creation');

  const [unlockedAchievements, setUnlockedAchievements] = useState(() => {
    try {
      const saved = localStorage.getItem('hockey_career_achievements');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [achievementToast, setAchievementToast] = useState(null);
  const [showAchievementsMenu, setShowAchievementsMenu] = useState(false);

  const unlockAchievement = useCallback((id) => {
    setUnlockedAchievements(prev => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      try {
        localStorage.setItem('hockey_career_achievements', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save achievements', e);
      }
      const masterObj = MASTER_ACHIEVEMENTS.find(a => a.id === id);
      if (masterObj) {
        setAchievementToast(masterObj);
        setTimeout(() => setAchievementToast(null), 4000);
      }
      return updated;
    });
  }, []);

  useEffect(() => {
    if (unlockedAchievements.length >= 40) {
      unlockAchievement('the_idol');
    }
  }, [unlockedAchievements]);

  const [isShopOpen, setIsShopOpen] = useState(false);
  const [negotiation, setNegotiation] = useState(null);
  const [activeTrainings, setActiveTrainings] = useState([]);
  const [activeEvent, setActiveEvent] = useState(null);
  const [activeMinigame, setActiveMinigame] = useState(null);
  const [minigameStarted, setMinigameStarted] = useState(false);
  const [activePress, setActivePress] = useState({ journalists: [], questions: [], currentQ: 0, answers: [] });
  const [minigameContext, setMinigameContext] = useState('season');
  // Silent per-season log. Every event/minigame/press outcome pushes its
  // feedback + effect here; the Season Recap reads it under "Notable Moments".
  // This replaces the old per-interaction Verdict screen for flavor events.
  const [seasonEvents, setSeasonEvents] = useState([]);
  // Holds the International Duty outcome so it renders inline on that same
  // screen (cause + effect together) instead of routing to the Verdict screen.
  const [intlResult, setIntlResult] = useState(null);

  const [eventFeedback, setEventFeedback] = useState('');
  const [eventImpacts, setEventImpacts] = useState({});
  const [statChanges, setStatChanges] = useState(null);

  const [seasonRecap, setSeasonRecap] = useState(null);
  const [freeAgencyOffers, setFreeAgencyOffers] = useState([]);
  const [hasDemandedTrade, setHasDemandedTrade] = useState(false);
  const [playoffs, setPlayoffs] = useState({ bracket: [], activeRoundIndex: 0, overallStatus: 'playing' });
  const [memCup, setMemCup] = useState({ round: 0, status: 'playing' });
  const [pendingPlayoffs, setPendingPlayoffs] = useState(null);
  const [pendingSeasonResult, setPendingSeasonResult] = useState(null);
  const [arbState, setArbState] = useState(null);

  // Safely hoisted Combine state variables
  const [combinePhase, setCombinePhase] = useState(1);
  const [combineScore, setCombineScore] = useState(0);
  const [combineClicks, setCombineClicks] = useState(0);
  const [combineColor, setCombineColor] = useState('red');
  const combineTimeRef = useRef(0);

  // Combine Reflex Timer Effect
  useEffect(() => {
    if (screen === 'combine' && combinePhase === 1) {
      setCombineColor('red');
      const delay = 1500 + Math.random() * 3000;
      const timer = setTimeout(() => {
        setCombineColor('green');
        combineTimeRef.current = Date.now();
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [screen, combinePhase]);

  const handleCombineReflex = () => {
     if (combineColor === 'red') {
         setCombineScore(-2); // Jumped the gun
         setCombinePhase(2);
     } else {
         const reaction = Date.now() - combineTimeRef.current;
         if (reaction < 300) setCombineScore(2);
         else if (reaction < 450) setCombineScore(1);
         else setCombineScore(0);
         setCombinePhase(2);
     }
  };

  const [player, setPlayer] = useState(makeInitialPlayer);

// Trigger award & performance achievements ONLY on the recap screen
  useEffect(() => {
    if (screen !== 'recap' || !seasonRecap) return;

    const awardsList = seasonRecap.awards || [];
    if (awardsList.includes('Hart Trophy')) unlockAchievement('hart');
    if (awardsList.includes('Vezina Trophy')) unlockAchievement('vezina');
    if (awardsList.includes('Norris Trophy')) unlockAchievement('norris');
    if (awardsList.includes('Calder Trophy')) unlockAchievement('calder');
    if (awardsList.includes('Art Ross Trophy')) unlockAchievement('art_ross');
    if (awardsList.includes('Maurice Richard Trophy')) unlockAchievement('richard');
    if (awardsList.includes('Conn Smythe Trophy')) unlockAchievement('conn_smythe');

    if (seasonRecap.g >= 50) unlockAchievement('fifty_goal_season');
    if ((seasonRecap.g || 0) + (seasonRecap.a || 0) >= 100) unlockAchievement('hundred_pt_season');
    if (seasonRecap.sho >= 8) unlockAchievement('shutout_king');
  }, [screen, seasonRecap, unlockAchievement]);

  // Idolatry-tier achievements. Fires only when idolatry changes.
  useEffect(() => {
    if (player.idolatry >= 1000) unlockAchievement('franchise_legend');
    if (player.idolatry >= 400)  unlockAchievement('local_hero');
  }, [player.idolatry, unlockAchievement]);

  // Career-earnings achievements. Fires only when earnings change.
  useEffect(() => {
    const e = player.stats?.earnings || 0;
    if (e >= 100000000) unlockAchievement('hundred_mil');
    if (e >= 50000000)  unlockAchievement('fifty_mil');
  }, [player.stats?.earnings, unlockAchievement]);

  // Season-history-driven achievements: undrafted star, iron man, one-club-man,
  // back-to-back titles. Fires only when the season history array changes.
  useEffect(() => {
    const hist = player.seasonHistory || [];
    const seasonsPlayed = player.stats?.seasonsPlayed || 0;

    if (player.ovr >= 75 && !player.draftTeam && !player.rights && seasonsPlayed >= 1) {
      unlockAchievement('undrafted_star');
    }
    if (seasonsPlayed >= 15) unlockAchievement('iron_man');

    // Loyalty: 10+ seasons logged for a single franchise.
    const teamCounts = {};
    hist.forEach(s => {
      if (s.team) teamCounts[s.team] = (teamCounts[s.team] || 0) + 1;
    });
    if (Object.values(teamCounts).some(c => c >= 10)) unlockAchievement('one_club_man');

    // Dynasty: two consecutive title-winning seasons.
    for (let i = 1; i < hist.length; i++) {
      if (hist[i]?.titleWon && hist[i - 1]?.titleWon) { unlockAchievement('back_to_back'); break; }
    }
  }, [player.seasonHistory, unlockAchievement]);

  // Retirement-triggered career achievements.
  useEffect(() => {
    if (screen !== 'retirement') return;
    const titles = player.stats?.titles || 0;
    const trophyCount = (player.stats?.awards || []).length;
    if (titles >= 3 && trophyCount >= 5) unlockAchievement('hall_of_fame');
    if (player.age > 38 && player.league === 'NHL') unlockAchievement('veteran_retirement');
  }, [screen]);

  // Set favicon on mount. Runs once.
  useEffect(() => {
    let link = document.querySelector("link[rel*='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.getElementsByTagName('head')[0].appendChild(link);
    }
    link.type = 'image/png';
    link.href = '/favicon.png';
  }, []);

  // Keep the browser tab title in sync with what screen the player is on.
  useEffect(() => {
    if (screen === 'playoffs') {
      document.title = "Blue Chip Prospect | Playoffs";
    } else if (screen === 'transfer') {
      document.title = "Blue Chip Prospect | Free Agency";
    } else {
      document.title = "Blue Chip Prospect";
    }
  }, [screen]);

  const handleNewGame = () => {
    setPlayer(makeInitialPlayer());
    setSeasonRecap(null);
    setActiveEvent(null);
    setPendingPlayoffs(null);
    setSeasonEvents([]);
    setScreen('creation');
  };

  const safeJuniorLeagues = juniorLeagues || [];
  const safeEuroLeagues = euroLeagues || [];
  const safeNationalities = nationalities || [];

  const currentYear = 2026 + (player.stats?.seasonsPlayed || 0);
  const isJunior = safeJuniorLeagues.includes(player.league);
  const isAmateur = isJunior || player.league === 'NCAA' || safeEuroLeagues.includes(player.league);
  const isAHL = player.league === 'AHL';
  const lgKey = isAmateur ? 'chl' : isAHL ? 'ahl' : 'nhl';

  // Memoised display name for the player's current club — used in multiple render
  // spots (dashboard, recap, transfer, contract copy). Recomputes only when the
  // team ID or league actually changes.
  const playerTeamDisplayName = useMemo(
    () => getFullTeamName(player.team, player.league),
    [player.team, player.league]
    
  );
// SAFE ZONE HOOK FOR PRESS CONFERENCES
  const pressAnswerKeys = useMemo(() => {
    const q = activePress.questions[activePress.currentQ];
    if (!q) return [];
    const keys = ['professional', 'passionate', 'humble', 'cocky'].filter(k => q.answers[k]);
    return keys.sort(() => 0.5 - Math.random());
  }, [activePress.currentQ, activePress.questions]);
  
  const handleStart = (isRandomized = false) => {
    let lg = player.startLeague;
    let currentNat = player.nat;

    let pool = ohlTeams || [];
    if (lg === 'WHL') pool = whlTeams || [];
    if (lg === 'QMJHL') pool = qmjhlTeams || [];
    if (lg === 'USHL') pool = ushlTeams || [];
    if (lg === 'SHL') pool = shlTeams || [];
    if (lg === 'LIIGA') pool = liigaTeams || [];
    
    const startTeam = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : { id: 'UNK' };

    // THE 2% GENERATIONAL ROLL
    const isGen = Math.random() <= 0.02; // 1-in-50 chance
    
    let bSht = 55, bSkt = 55, bPhy = 55, bIq = 55, bSta = 55;
    
    // If generational, immediately juice base stats before positional modifiers
    if (isGen) {
       bSht += 15; bSkt += 15; bPhy += 10; bIq += 20; bSta += 12;
    }

    if (player.pos === 'C') { bIq += 10; bSkt += 5; bSht -= 5; bPhy -= 5; bSta -= 5; }
    if (['LW', 'RW'].includes(player.pos)) { bSht += 10; bSkt += 5; bPhy -= 5; bIq -= 5; bSta -= 5; }
    if (['LD', 'RD'].includes(player.pos)) { bPhy += 10; bSta += 5; bIq += 5; bSkt -= 5; bSht -= 15; }
    if (player.pos === 'G') { bSht += 10; bSkt += 10; bPhy += 5; bIq -= 5; bSta -= 20; }

    const startOvr = Math.floor((bSht + bSkt + bPhy + bIq + bSta) / 5);

    const validReporters = getJournalistsForLeague(lg);
    const randomReporter = validReporters[Math.floor(Math.random() * validReporters.length)];

    // Dynamically assign an archetype based on the player's best generated stats
    let arch = '';
    if (player.pos === 'G') {
      if (bSkt > bPhy && bSkt > bSht) arch = 'Butterfly';
      else if (bSht > bSkt && bSht > bPhy) arch = 'Reflex';
      else arch = 'Hybrid';
    } else if (['LD', 'RD'].includes(player.pos)) {
      if (bPhy > bSkt && bPhy > bSht) arch = 'Shutdown';
      else if (bSkt > bPhy && bSkt > bSht) arch = 'Puck-Mover';
      else arch = 'Two-Way';
    } else {
      if (bSht > bSkt && bSht > bIq) arch = 'Sniper';
      else if (bIq > bSht && bIq > bPhy) arch = 'Playmaker';
      else if (bPhy > bSht && bPhy > bSkt) arch = 'Power Forward';
      else arch = 'Two-Way';
    }

    setPlayer(p => ({
      ...p, team: startTeam.id, league: lg, nat: currentNat, startLeague: lg, teamsPlayedFor: [startTeam.id],
      shooting: bSht, skating: bSkt, physicality: bPhy, hockeyIQ: bIq, stamina: bSta, ovr: startOvr,
      isGenerational: isGen,
      archetype: arch,
      storylines: { ...p.storylines, mediaNemesis: isGen ? 1 : 0 },
      nemesisName: isGen ? `${randomReporter.name} (${randomReporter.outlet})` : null
    }));
    
    generateTraining(player.pos);

    if (isGen) {
       setActiveEvent({
         title: '🌟 THE CHOSEN ONE',
         desc: `The hockey world has never seen a prospect quite like you. At just 16 years old, scouts are already calling you the greatest generational talent since Crosby, McDavid, or Bedard. The pressure is on.`,
         choices: [
           { 
             label: 'Embrace the Expectations', 
             isRisky: false, 
             feedback: 'You are ready to change a franchise forever. Let the hype begin.', 
             effect: { idol: 200, ovr: 0, money: 50000 }, // Start with massive hype & endorsement cash
             action: 'GEN_REVEAL' 
           }
         ],
         isOffseasonEvent: true // This perfectly routes to the Pre-Season screen next!
       });
       setScreen('event');
    } else {
       setScreen('preseason');
    }
  };

  const advanceToOffseason = () => {
    if (player.age >= 41 || (player.age >= 38 && player.ovr < 78)) {
      setScreen('retirement'); 
      return; 
    }
    if (player.age >= 38 && player.ovr >= 78 && player.league === 'NHL') {
       setActiveEvent({
         title: 'ONE LAST RIDE?',
         desc: `You are ${player.age} years old. Most guys have hung up their skates by now, but you still have gas in the tank. Will you retire a legend, or push for one more year on a veteran-minimum deal?`,
         choices: [
           { label: 'Retire a Legend', isRisky: false, feedback: 'You announced your retirement to a standing ovation.', effect: { idol: 50, ovr: 0, money: 0 }, action: 'FORCE_RETIRE' },
           { label: 'Play One More Year', isRisky: false, feedback: 'You signed a 1-year extension. Time to chase glory.', effect: { idol: 10, ovr: -3, money: 0 }, action: 'VETERAN_EXTENSION' }
         ],
         isOffseasonEvent: true
       });
       setScreen('event');
       return;
    }

    if (!player.storylines?.importDraft && !player.chlRights && (player.age === 16 || player.age === 17) && safeEuroLeagues.includes(player.league) && Math.random() > 0.4) {
        setPlayer(p => ({ ...p, storylines: { ...(p.storylines || {}), importDraft: 1 } }));
        const chlLeagues = ['OHL', 'WHL', 'QMJHL'];
        const randomLg = chlLeagues[Math.floor(Math.random() * chlLeagues.length)];
        let pool = getOpponentPool(randomLg) || [];
        if (pool.length === 0) pool = [{ id: 'UNK', name: 'Unknown Team', city: '' }];
        const draftingTeam = pool[Math.floor(Math.random() * pool.length)];
        const fullTeamName = draftingTeam.fullName || (draftingTeam.city ? `${draftingTeam.city} ${draftingTeam.name}` : draftingTeam.name);

        setActiveEvent({
            title: '🇨🇦 THE CHL IMPORT DRAFT',
            desc: `You've been selected by the ${fullTeamName} (${randomLg}) in the CHL Import Draft! They want you to leave Europe and come play Major Junior hockey in North America to get used to the smaller ice.`,
            choices: [
                {
                    label: 'Pack your bags for North America',
                    isRisky: false,
                    feedback: `You signed with ${draftingTeam.name}. The smaller ice is an adjustment, but NHL scouts are watching closely.`,
                    effect: { idol: 15, ovr: 1, money: 0 },
                    action: 'ACCEPT_IMPORT_DRAFT',
                    actionData: { teamObj: draftingTeam, league: randomLg }
                },
                {
                    label: 'Stay in Europe',
                    isRisky: false,
                    feedback: `You decided to stay and play against grown men in Europe. ${draftingTeam.name} will retain your CHL rights just in case you change your mind later.`,
                    effect: { idol: 5, ovr: 1, money: 0 },
                    action: 'DECLINE_IMPORT_DRAFT',
                    actionData: { teamObj: draftingTeam, league: randomLg }
                }
            ],
            isOffseasonEvent: true
        });
        setScreen('event');
        return;
    }

    const isExpiring = (player.contract?.years || 0) <= 0;
    const newBuffs = (player.buffs || []).map(b => ({ ...b, duration: b.duration - 1 })).filter(b => b.duration > 0);

    let currentTeam = player.team;
    let currentLeague = player.league;

    setPlayer(p => ({ ...p, team: currentTeam, league: currentLeague, buffs: newBuffs }));

    if (player.age === 17 && safeEuroLeagues.includes(currentLeague) && Math.random() > 0.4) {
         const pool = ohlTeams || [];
         const chlTeam = pool[Math.floor(Math.random() * pool.length)];
         if (chlTeam) {
           setActiveEvent({
             title: 'CHL IMPORT DRAFT',
             desc: `You've been selected by the ${getFullTeamName(chlTeam, 'OHL')} in the CHL Import Draft! Will you leave Europe to play major junior in North America?`,
             choices: [
               { label: 'Move to Canada (Join OHL)', isRisky: false, feedback: 'You packed your bags for North America to prepare for your draft year.', effect: { idol: 5, ovr: 2, money: 0 }, action: 'JOIN_CHL', actionData: chlTeam.id },
               { label: 'Stay in Europe', isRisky: false, feedback: 'You decided to stay close to home.', effect: { idol: 0, ovr: 1, money: 0 } }
             ],
             isOffseasonEvent: true
           });
           setScreen('event');
           return;
         }
    }

    const getsNCAAOffer = currentLeague === 'USHL' ? true : (safeJuniorLeagues.includes(currentLeague) && Math.random() > 0.6);
    
    if (player.age === 17 && getsNCAAOffer && !player.rights) {
         let pool = ncaaTeams ? [...ncaaTeams].sort(() => 0.5 - Math.random()) : [];
         
         let numOffers = 1;
         if (currentLeague === 'USHL') {
             const rating = seasonRecap?.rating || 5;
             if (rating >= 8.0) numOffers = 3;
             else if (rating >= 7.0) numOffers = 2;
         }

         const offeredTeams = pool.slice(0, numOffers).map(t => {
             const possiblePerks = [
                 { text: '📈 Elite Coaching (+2 OVR)', ovr: 2, idol: 0, money: 0, color: 'text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/30' },
                 { text: '🏟️ Arena Facilities (+15 Fans)', ovr: 0, idol: 15, money: 0, color: 'text-[#22E748] bg-[#22E748]/10 border-[#22E748]/30' },
                 { text: '💰 Big NIL Deal ($75k)', ovr: 0, idol: 0, money: 75000, color: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30' },
                 { text: '⚡ High Tempo System (+1 OVR, +5 Fans)', ovr: 1, idol: 5, money: 0, color: 'text-[#22E748] bg-[#22E748]/10 border-[#22E748]/30' }
             ];

             const possibleFlaws = [
                 { text: '⚠️ Crowded Roster (-1 OVR)', ovr: -1, idol: 0, money: 0 },
                 { text: '⚠️ Strict System (-10 Fans)', ovr: 0, idol: -10, money: 0 },
                 { text: '⚠️ Small Market (-5 Fans)', ovr: 0, idol: -5, money: 0 },
                 { text: '⚠️ Rebuilding Phase (-1 OVR, -5 Fans)', ovr: -1, idol: -5, money: 0 }
             ];

             const perkCount = Math.floor(Math.random() * 4); 
             const flawCount = Math.floor(Math.random() * 4);

             const selectedPerks = [...possiblePerks].sort(() => 0.5 - Math.random()).slice(0, perkCount);
             const selectedFlaws = [...possibleFlaws].sort(() => 0.5 - Math.random()).slice(0, flawCount);

             let totalOvr = 0;
             let totalIdol = 0;
             let totalMoney = 0;

             selectedPerks.forEach(p => { totalOvr += p.ovr; totalIdol += p.idol; totalMoney += p.money; });
             selectedFlaws.forEach(f => { totalOvr += f.ovr; totalIdol += f.idol; totalMoney += f.money; });

             return {
                 ...t,
                 finalOvr: Math.max(0, totalOvr),
                 finalIdol: totalIdol,
                 finalMoney: totalMoney,
                 perks: selectedPerks,
                 flaws: selectedFlaws
             };
         });

         if (offeredTeams.length > 0) {
           const choices = offeredTeams.map(t => ({
               label: `Commit to ${t.name}`, 
               perks: t.perks,
               flaws: t.flaws,
               isRisky: false, 
               feedback: `You signed your Letter of Intent to play for ${t.name}!`, 
               effect: { idol: t.finalIdol, ovr: t.finalOvr, money: t.finalMoney }, 
               action: 'JOIN_NCAA', 
               actionData: t.id
           }));

           choices.push({ 
               label: `Decline (Stay in ${currentLeague})`, 
               subLabel: `Forfeit all NCAA offers to remain in the ${currentLeague}.`,
               isRisky: false, 
               feedback: `You decided to stay the course in ${currentLeague}.`, 
               effect: { idol: 0, ovr: 1, money: 0 } 
           });

           setActiveEvent({
             title: 'NCAA RECRUITMENT',
             desc: numOffers > 1 
                ? `Your stellar play in the ${currentLeague} has attracted major attention. Offers are rolling in—some programs offer great perks with no drawbacks, while others have serious baggage. Choose wisely.`
                : `The head coach of ${offeredTeams[0].name} has offered you a scholarship. Review their program's perks and flaws before committing.`,
             choices: choices,
             isOffseasonEvent: true
           });
           setScreen('event');
           return;
         }
    }

    const isCurrentlyAmateur = safeJuniorLeagues.includes(currentLeague) || currentLeague === 'NCAA' || safeEuroLeagues.includes(currentLeague);
    
    if (player.age === 18 && isCurrentlyAmateur && !player.rights) {
      setScreen('combine');
      return;
    }

    const rightsExpireAge = (player.draftLeague && ['OHL', 'WHL', 'QMJHL'].includes(player.draftLeague)) ? 20 : 22;
    const amateurAgeOut = ['OHL', 'WHL', 'QMJHL'].includes(currentLeague) ? 21 : 22;
    
    const needsRightsDecision = isCurrentlyAmateur && player.rights && player.age >= rightsExpireAge;
    const isAgingOut = isCurrentlyAmateur && !player.rights && player.age >= amateurAgeOut;

    if (needsRightsDecision || isAgingOut) {
       if (player.rights) {
           const teamWantsYou = player.ovr >= 65;
           const teamName = getFullTeamName(player.rights, 'NHL');
           if (teamWantsYou) {
               setActiveEvent({
                   title: 'AMATEUR GRADUATION',
                   desc: `Your development window has closed. The ${teamName} still hold your draft rights and have offered you an Entry-Level Contract. If you decline, your rights will expire and you will become an Unrestricted Free Agent.`,
                   choices: [
                       { label: `Sign ELC with ${teamName}`, isRisky: false, feedback: 'You signed your ELC and are heading to pro camp!', effect: { idol: 10, ovr: 0, money: 0 }, action: 'SIGN_ELC' },
                       { label: 'Test Free Agency', isRisky: false, feedback: 'You let your draft rights expire to test the open market.', effect: { idol: -5, ovr: 0, money: 0 }, action: 'BECOME_UFA' }
                   ],
                   isOffseasonEvent: true
               });
           } else {
               setActiveEvent({
                   title: 'RIGHTS EXPIRED',
                   desc: `Your development window has closed. The ${teamName} have decided not to offer you a contract. Your draft rights have expired and you are now an Unrestricted Free Agent.`,
                   choices: [
                       { label: 'Enter Free Agency', isRisky: false, feedback: 'Time to find a pro team that believes in you.', effect: { idol: 0, ovr: 0, money: 0 }, action: 'BECOME_UFA' }
                   ],
                   isOffseasonEvent: true
               });
           }
       } else {
           setActiveEvent({
               title: 'AMATEUR GRADUATION',
               desc: `You have aged out of amateur hockey as an undrafted free agent. It's time to see if any pro teams are interested in signing you.`,
               choices: [
                   { label: 'Enter Free Agency', isRisky: false, feedback: 'You are looking for your first pro contract.', effect: { idol: 0, ovr: 0, money: 0 }, action: 'BECOME_UFA' }
               ],
               isOffseasonEvent: true
           });
       }
       setScreen('event');
       return;
    }

    if (isCurrentlyAmateur && player.rights && player.age > 18 && player.age < rightsExpireAge) {
       const teamName = getFullTeamName(player.rights, 'NHL');
       if (player.ovr >= 65) {
           setActiveEvent({
             title: 'PRO CONTRACT OFFER',
             desc: `The ${teamName} believe you are ready. They have offered you an Entry-Level Contract. You can turn pro now, or return to ${currentLeague} for another year of development.`,
             choices: [
               { label: 'Sign ELC (Turn Pro)', isRisky: false, feedback: 'You signed your ELC and are heading to NHL training camp!', effect: { idol: 10, ovr: 0, money: 0 }, action: 'SIGN_ELC' },
               { label: `Return to ${currentLeague}`, isRisky: false, feedback: 'You chose to develop for another year.', effect: { idol: 0, ovr: 1, money: 0 } }
             ],
             isOffseasonEvent: true
           });
       } else {
           setActiveEvent({
             title: 'NOT READY FOR PRO',
             desc: `The ${teamName} still hold your rights, but their front office does not believe you are ready for pro hockey yet. You must return to ${currentLeague} for another season.`,
             choices: [
               { label: `Return to ${currentLeague}`, isRisky: false, feedback: 'You are determined to prove them wrong next season.', effect: { idol: 0, ovr: 1, money: 0 } }
             ],
             isOffseasonEvent: true
           });
       }
       setScreen('event');
       return;
    }

    if (!isCurrentlyAmateur && (player.contract?.years || 0) <= 0) {
      generateOffers(false, currentTeam, currentLeague);
    } else {
      const idol = player.idolatry || 0;
      
      if (idol >= 300 && !player.storylines?.endLocal && currentLeague === 'NHL') {
          setPlayer(p => ({ ...p, storylines: { ...p.storylines, endLocal: true } }));
          setActiveEvent({
              title: '🤝 LOCAL SPONSORSHIP',
              desc: `A popular local car dealership wants you for a TV commercial. It's great easy money, but your teammates might relentlessly chirp you for it.`,
              choices: [
                  { label: 'Do the Commercial ($50k)', isRisky: false, feedback: 'You got paid, but the boys laughed at your acting skills.', effect: { idol: 5, ovr: 0, money: 50000, rel: { teammates: -10 } } },
                  { label: 'Pass on it', isRisky: false, feedback: 'You kept your dignity.', effect: { idol: 0, ovr: 0, money: 0 } }
              ],
              isOffseasonEvent: true
          });
          setScreen('event');
          return;
      }

      if (idol >= 600 && !player.storylines?.endNational && currentLeague === 'NHL') {
          setPlayer(p => ({ ...p, storylines: { ...p.storylines, endNational: true } }));
          setActiveEvent({
              title: '📺 NATIONAL BRAND CAMPAIGN',
              desc: `A major sports equipment brand wants you as the face of their new stick launch. It involves a massive photo shoot and media obligations.`,
              choices: [
                  { label: 'Sign the Deal ($250k)', isRisky: false, feedback: 'You are on billboards nationwide! But the media obligations cut into your training.', effect: { idol: 50, ovr: -1, money: 250000, rel: { media: 20 } } },
                  { label: 'Focus on Hockey', isRisky: false, feedback: 'You turned down the money to focus purely on your game.', effect: { idol: 0, ovr: 1, money: 0 } }
              ],
              isOffseasonEvent: true
          });
          setScreen('event');
          return;
      }

      if (idol >= 1000 && !player.storylines?.endGlobal && currentLeague === 'NHL') {
          setPlayer(p => ({ ...p, storylines: { ...p.storylines, endGlobal: true } }));
          setActiveEvent({
              title: '🌍 SIGNATURE ATHLETE',
              desc: `You have reached the pinnacle of hockey fame. An international conglomerate wants to give you your own signature skate and apparel line.`,
              choices: [
                  { label: 'Become an Icon ($2.5M)', isRisky: false, feedback: 'You have ascended beyond just being a hockey player. You are a global brand.', effect: { idol: 150, ovr: 0, money: 2500000 } }
              ],
              isOffseasonEvent: true
          });
          setScreen('event');
          return;
      }

      generateTraining(player.pos);
      setScreen('preseason');
    }
  };

  const handleDraftDay = (combineBoost = 0) => {
    const totalJuniorPoints = (player.stats?.chl?.goals || 0) + (player.stats?.chl?.assists || 0) + (player.stats?.memCupBoost || 0);
    let overallPick = 1;
    let round = 1;
    let idolBoost = 0;

    const effectiveOvr = player.ovr + combineBoost;

    // 1. DRAFT TIERS WITH POSITIONAL BIAS
    // Goalies require a generational 72+ OVR to go 1st overall. Skaters need 66+.
    const isFirstOverall = (player.pos !== 'G' && effectiveOvr >= 66) || (player.pos === 'G' && effectiveOvr >= 72) || (['LW', 'RW', 'C'].includes(player.pos) && totalJuniorPoints > 180);
    const isElite = effectiveOvr >= 64 || (['LW', 'RW', 'C'].includes(player.pos) && totalJuniorPoints > 140);
    const isGreat = effectiveOvr >= 61 || (['LW', 'RW', 'C'].includes(player.pos) && totalJuniorPoints > 100);
    // 2. ASSIGN PICKS
    if (isFirstOverall) {
      overallPick = 1; 
      round = 1; 
      idolBoost = 25;
    } else if (isElite) {
      // Elite goalies usually slide to the 5-14 range, Elite skaters go 2-10
      overallPick = player.pos === 'G' ? Math.floor(Math.random() * 10) + 5 : Math.floor(Math.random() * 9) + 2; 
      round = 1; 
      idolBoost = 20;
    } else if (isGreat) {
      // Late 1st rounders (Picks 11-32)
      overallPick = Math.floor(Math.random() * 22) + 11; 
      round = 1; 
      idolBoost = 15;
    } else {
      // 2nd to 7th round
      round = Math.floor(Math.random() * 6) + 2;
      overallPick = ((round - 1) * 32) + Math.floor(Math.random() * 32) + 1;
      idolBoost = 5;
    }

    const pool = nhlTeams || [];
    const draftedBy = pool[Math.floor(Math.random() * pool.length)];

    setPlayer(p => ({
      ...p,
      rights: draftedBy?.id,
      draftTeam: draftedBy?.id || null,
      draftLeague: p.league,
      idolatry: capIdol(p.idolatry + idolBoost)
    }));

    if (overallPick === 1) unlockAchievement('first_overall');
    if (overallPick <= 32) unlockAchievement('first_round_pick');
    if (player.league === 'NCAA') unlockAchievement('ncaa_champ');

    setSeasonRecap(r => ({ ...r, draftPick: overallPick, draftRound: round, draftedBy: draftedBy, juniorTeam: player.team, juniorLeague: player.league }));
    setEventImpacts({ idol: idolBoost, money: 0, ovr: 0 });
    setScreen('draft');
  };

  const handleDraftChoice = (choice) => {
     const draftedBy = seasonRecap?.draftedBy;
     if (choice === 'ELC' && draftedBy) {
       setPlayer(p => ({
         ...p, team: draftedBy.id, league: 'NHL',
         teamsPlayedFor: Array.from(new Set([...(p.teamsPlayedFor || []), draftedBy.id])),
         contract: { salary: 925000, years: 3, role: getRole(925000, p) } 
       }));
       setEventFeedback("You signed your ELC and are heading to your first NHL training camp.");
     } else if (choice === 'EXPLORE_OPTIONS') {
       let offers = [];
       
       // Generate 2-3 NCAA offers
       let ncaaPool = ncaaTeams ? [...ncaaTeams].sort(() => 0.5 - Math.random()) : [];
       const numNcaa = Math.floor(Math.random() * 2) + 2; 
       for (let i = 0; i < numNcaa; i++) {
           if(ncaaPool[i]) {
               offers.push({
                   team: ncaaPool[i].id,
                   league: 'NCAA',
                   type: 'SCHOLARSHIP',
                   salary: Math.floor(Math.random() * 50000) + 25000,
                   years: 4,
                   role: 'Top Prospect',
                   idolHit: 15,
                   state: 'College Program',
                   nmc: false
               });
           }
       }
       
       // Generate 1-2 Euro offers (SHL / LIIGA)
       let euroPool = [...(shlTeams||[]), ...(liigaTeams||[])].sort(() => 0.5 - Math.random());
       const numEuro = Math.floor(Math.random() * 2) + 1;
       for (let i = 0; i < numEuro; i++) {
           if(euroPool[i]) {
               const lg = (shlTeams||[]).find(t => t.id === euroPool[i].id) ? 'SHL' : 'LIIGA';
               offers.push({
                   team: euroPool[i].id,
                   league: lg,
                   type: 'PRO CONTRACT',
                   salary: Math.floor(Math.random() * 40000) + 40000,
                   years: 1,
                   role: 'Pro Roster',
                   idolHit: 5,
                   state: 'European Pro',
                   nmc: false
               });
           }
       }
       
       setFreeAgencyOffers(offers.sort((a,b) => b.salary - a.salary));
       setScreen('transfer');
       return;
     } else {
       setEventFeedback(`You decided to return to ${player.league} for another year of development.`);
     }
     generateTraining(player.pos);
     setScreen('preseason');
  };

  const generateTraining = (pos) => {
    const activePool = pos === 'G' ? goalieTrainingPool || [] : skaterTrainingPool || [];
    const commons = activePool.filter(t => t.rarity === 'Common');
    const rares = activePool.filter(t => t.rarity === 'Rare');
    const epics = activePool.filter(t => t.rarity === 'Epic');

    const hand = [];
    while (hand.length < 3) {
      const roll = Math.random();
      let selectedPool = commons;
      if (roll > 0.95 && epics.length) selectedPool = epics;
      else if (roll > 0.80 && rares.length) selectedPool = rares;

      if (selectedPool.length) {
        const randomCard = selectedPool[Math.floor(Math.random() * selectedPool.length)];
        if (!hand.find(c => c.id === randomCard.id)) { hand.push(randomCard); }
      } else {
        break; 
      }
    }
    setActiveTrainings(hand);
  };

  const handleTrain = (t) => {
    setHasDemandedTrade(false);
    setSeasonEvents([]);
    const result = simulateSeason(player, t?.effect);

    if (!result) return;

    // Filter out incorrect positional awards
  if (result.recap && result.recap.awards) {
        if (player.pos.includes('D') || player.pos === 'G') {
            result.recap.awards = result.recap.awards.filter(a => !a.includes('Forward'));
        }
        if (player.pos === 'G') {
            result.recap.awards = result.recap.awards.filter(a => !a.includes('Defenseman') && !a.includes('Defender'));
            // NERF: Goalies rarely win MVP, and their rating scales down slightly to prevent runaway idolatry
            if (result.recap.awards.includes('MVP') && Math.random() < 0.90) {
                 result.recap.awards = result.recap.awards.filter(a => a !== 'MVP');
            }
            result.recap.rating = Math.max(0, result.recap.rating - 0.6); 
        }
        
        // Remove redundant "1st/2nd Team All-Star" strings
        result.recap.awards = result.recap.awards.filter(a => !a.includes('1st Team All-Star') && !a.includes('2nd Team All-Star'));

        // Normalize All-Star Logic
        if (player.ovr >= 85 && result.recap.rating >= 7.5 && !result.recap.awards.some(a => a.includes('All-Star'))) {
            result.recap.awards.push('NHL All-Star');
        }
        
        // Standardize and completely deduplicate the awards array so duplicates never appear
        result.recap.awards = Array.from(new Set(
            result.recap.awards.map(a => a === 'All-Star' ? 'NHL All-Star' : a)
        ));
    }

// --- NEW: GENERATIONAL FRANCHISE AURA ---
    if (player.isGenerational && result.recap) {
       // A Generational player drags a bottom-feeder up the standings by 4 to 8 spots automatically.
       if (result.recap.standings > 10) {
           result.recap.standings = Math.max(1, result.recap.standings - (Math.floor(Math.random() * 5) + 4));
       }
       // Ensure they make the playoffs if they were dragged into the threshold
       const playoffSpots = LEAGUE_CONFIG[result.currentLg]?.playoffSpots || 16;
       result.madePlayoffs = result.recap.standings <= playoffSpots;
       result.recap.madePlayoffs = result.madePlayoffs;
    }

    // --- NEW: DYNAMIC TEAM STRENGTHS (SALARY CAP IMPACT) ---
    if (player.league === 'NHL' && result.recap) {
       const salary = player.contract?.salary || 0;
       const isUnderpaid = player.ovr >= 88 && salary <= 5000000;
       const isSuperMax = salary >= 11500000;

       if (isUnderpaid) {
           // Surplus cap space lets the GM build a deep roster
           result.recap.standings = Math.max(1, result.recap.standings - (Math.floor(Math.random() * 6) + 3));
       } else if (isSuperMax) {
           // Cap hell means no depth. Team suffers.
           result.recap.standings = Math.min(32, result.recap.standings + (Math.floor(Math.random() * 6) + 3));
       }
       
       const playoffSpots = LEAGUE_CONFIG[result.currentLg]?.playoffSpots || 16;
       result.madePlayoffs = result.recap.standings <= playoffSpots;
       result.recap.madePlayoffs = result.madePlayoffs;
    }
    
    let finalPlayer = { ...(result.updatedPlayer || player) };
    
    if (t?.effect) {
       Object.keys(t.effect).forEach(attr => {
          if (['shooting', 'skating', 'physicality', 'hockeyIQ', 'stamina'].includes(attr)) {
              finalPlayer[attr] = cap((player[attr] || 50) + t.effect[attr]);
          }
       });
       finalPlayer.ovr = recomputeOvr(finalPlayer);
    }

    // PROGRESSIVE AGING CURVE
    if (finalPlayer.age >= 31) {
      let sktDrop = 0, phyDrop = 0, staDrop = 0, shtDrop = 0;

      // The cliff gets steeper as you get older
      if (finalPlayer.age >= 38) {
        sktDrop = Math.floor(Math.random() * 3) + 3; // Drops 3 to 5
        phyDrop = Math.floor(Math.random() * 3) + 4; // Drops 4 to 6
        staDrop = Math.floor(Math.random() * 3) + 4; // Drops 4 to 6
        shtDrop = 2; // Hand-eye/Reflexes decline
      } else if (finalPlayer.age >= 35) {
        sktDrop = Math.floor(Math.random() * 2) + 2; // Drops 2 to 3
        phyDrop = Math.floor(Math.random() * 2) + 2; // Drops 2 to 3
        staDrop = Math.floor(Math.random() * 2) + 3; // Drops 3 to 4
        shtDrop = 1;
      } else if (finalPlayer.age >= 33) {
        sktDrop = 1; 
        phyDrop = Math.floor(Math.random() * 2) + 1; // Drops 1 to 2
        staDrop = 2; 
        shtDrop = 0;
      } else if (finalPlayer.age >= 31) {
        sktDrop = 0; 
        phyDrop = 1; 
        staDrop = 1; 
        shtDrop = 0;
      }

      // Apply the decay (Hockey IQ never drops!)
      finalPlayer.skating = Math.max(35, (finalPlayer.skating || 50) - sktDrop);
      finalPlayer.physicality = Math.max(35, (finalPlayer.physicality || 50) - phyDrop);
      finalPlayer.stamina = Math.max(35, (finalPlayer.stamina || 50) - staDrop);
      finalPlayer.shooting = Math.max(35, (finalPlayer.shooting || 50) - shtDrop);
    }

    finalPlayer.ovr = recomputeOvr(finalPlayer);

    const annualSalary = finalPlayer.contract?.salary || 0;
    const currentEarnings = finalPlayer.stats?.earnings || 0;
    const updatedEarnings = currentEarnings + annualSalary;

    // CBA RULE: ELCs slide for 18/19 year olds if they play less than 10 NHL games in a season.
    const isSlideEligible = finalPlayer.age < 20 && (result.currentLg !== 'NHL' || (result.recap?.games || 0) < 10);
    
    // FIX: Read directly from the pre-simulation state to prevent double-decrementing
    const remainingYears = isSlideEligible 
        ? (player.contract?.years || 0) 
        : Math.max(0, (player.contract?.years || 0) - 1);

    const ovr = finalPlayer.ovr;
    let computedValue = 50000;

    if (ovr >= 90) computedValue = 12000000 + ((ovr - 90) * 1500000);
    else if (ovr >= 85) computedValue = 6000000 + ((ovr - 85) * 1200000);
    else if (ovr >= 80) computedValue = 2500000 + ((ovr - 80) * 700000);
    else if (ovr >= 70) computedValue = 500000 + ((ovr - 70) * 200000);
    else computedValue = 50000 + ((ovr - 50) * 22500);

    const totalTitles = finalPlayer.stats?.titles || 0;
    const awardsThisYearCount = result.recap?.awards?.length || 0;
    computedValue += (totalTitles * 1000000) + (awardsThisYearCount * 750000);

    if (finalPlayer.age >= 23 && finalPlayer.age <= 30) {
       computedValue *= 1.25;
    } else if (finalPlayer.age > 34) {
       computedValue *= 0.75;
    }

    computedValue = Math.round(computedValue / 25000) * 25000;

    const activeYear = 2026 + (finalPlayer.stats?.seasonsPlayed || 0);
    const seasonAwards = (result.recap?.awards || []).map(award => `${activeYear} ${award}`);
    const updatedCareerAwards = [...(finalPlayer.stats?.awards || []), ...seasonAwards];
    
    if (finalPlayer.league === 'NHL' && (result.recap?.games || 0) > 0) unlockAchievement('first_nhl_goal');
    if (result.recap?.g >= 50) unlockAchievement('fifty_goal_season');
    if ((result.recap?.g || 0) + (result.recap?.a || 0) >= 100) unlockAchievement('hundred_pt_season');
    if (result.recap?.sho >= 8) unlockAchievement('shutout_king');
    if (finalPlayer.ovr >= 90) unlockAchievement('max_ovr');

    const seasonLog = {
      year: activeYear,
      team: finalPlayer.team,
      league: finalPlayer.league,
      games: result.recap?.games || 0,
      goals: result.recap?.g || 0,
      assists: result.recap?.a || 0,
      saves: result.recap?.saves || 0,
      shots: result.recap?.shots || 0,
      titleWon: result.recap?.titleWon === 1,
      awards: result.recap?.awards || []
    };

    finalPlayer = {
      ...finalPlayer,
      seasonHistory: [...(finalPlayer.seasonHistory || []), seasonLog],
      contract: {
        ...finalPlayer.contract,
        years: remainingYears
      },
      stats: {
        ...finalPlayer.stats,
        earnings: updatedEarnings,
        value: computedValue,
        seasonsPlayed: player.stats.seasonsPlayed + 1,
        awards: updatedCareerAwards
      }
    };

    setPlayer(finalPlayer);
    setStatChanges(t?.effect);
    setTimeout(() => setStatChanges(null), 3000);

    let willDemote = result.isDemoted;
    // Prospects under 78 OVR are highly likely to be assigned to the AHL for development
    let needsAHLDevelopment = player.league === 'NHL' && player.ovr < 78 && finalPlayer.age < 24 && Math.random() < 0.85;
    
    let demotionTargetLg = 'AHL';
    let demotionTargetTeam = getTeamData(player.team, 'NHL')?.ahlId || 'UTI';
    let isWaiverClaim = false;

    const isUnder20 = player.age < 20 && (player.contract?.salary || 0) > 0;
    const ohl = ohlTeams || []; const whl = whlTeams || []; const qmjhl = qmjhlTeams || [];
    const teamsPlayed = player.teamsPlayedFor || [];
    const hasCHLHistory = teamsPlayed.some(team => ohl.find(o=>o.id===team) || whl.find(o=>o.id===team) || qmjhl.find(o=>o.id===team));

    if (willDemote || needsAHLDevelopment) {
      if (player.league === 'NHL') {
        if (isUnder20 && hasCHLHistory) {
          if ((result.recap?.games || 0) > 9) {
            // 9-GAME RULE: Player burned year 1 of ELC, cannot go back to CHL.
            willDemote = false;
            needsAHLDevelopment = false;
          } else {
            const lastCHL = teamsPlayed.slice().reverse().find(team => ohl.find(o=>o.id===team) || whl.find(o=>o.id===team) || qmjhl.find(o=>o.id===team));
            demotionTargetTeam = lastCHL || (ohl[0] ? ohl[0].id : null);
            if (whl.find(team=>team.id===demotionTargetTeam)) demotionTargetLg = 'WHL';
            else if (qmjhl.find(team=>team.id===demotionTargetTeam)) demotionTargetLg = 'QMJHL';
            else demotionTargetLg = 'OHL';
            willDemote = true;
          }
        } else {
          const proSeasons = finalPlayer.stats?.seasonsPlayed || 0;
          const isRFA = finalPlayer.age < 27 && proSeasons < 7;
          const isELC = finalPlayer.contract?.salary === 925000 || (isRFA && proSeasons < 3);
          
          // Exempt players still on ELC or RFA from waivers
          if (!isELC && !isRFA && Math.random() < 0.3) {
            isWaiverClaim = true;
            demotionTargetLg = 'NHL';
            const pool = (nhlTeams || []).filter(t => t.id !== player.team);
            demotionTargetTeam = pool[Math.floor(Math.random() * pool.length)].id;
          }
          willDemote = true;
        }
      } else {
         willDemote = result.isDemoted;
         demotionTargetLg = result.currentLg;
         demotionTargetTeam = result.currentTeam;
      }
    }

    if (willDemote) {
      unlockAchievement('demoted');
      const updatedRecap = { ...result.recap, wasDemotedTo: demotionTargetLg, wasWaived: isWaiverClaim };
      setSeasonRecap(updatedRecap); 

      if (isWaiverClaim) {
        setActiveEvent({
          title: 'CLAIMED OFF WAIVERS',
          desc: `Your GM attempted to send you down to the AHL, but you were claimed off waivers by the ${getFullTeamName(demotionTargetTeam, 'NHL')}!`,
          choices: [
            { label: 'Pack your bags', isRisky: false, feedback: 'A fresh start with a new NHL team.', effect: { idol: 0, ovr: 0, money: 0 }, action: 'DEMOTE', actionData: { team: demotionTargetTeam, lg: 'NHL' } }
          ],
          isDemotionEvent: true, currentLg: 'NHL', currentTeam: demotionTargetTeam, madePlayoffs: result.madePlayoffs
        });
      } else {
        let devBoostMsg = player.pos === 'G' 
          ? "🧤 You will get primary starter workload next year to refine your game (+2 OVR)!" 
          : "🏒 You will get top-line minutes next year to boost your confidence (+2 OVR)!";

        setActiveEvent({
          title: 'REASSIGNED FOR DEVELOPMENT',
          desc: `The front office believes it's best for your long-term development to get top-line minutes and powerplay time in the minors, rather than being rushed into a limited NHL role. You have been assigned to the ${getFullTeamName(demotionTargetTeam, demotionTargetLg)} (${demotionTargetLg}) for the upcoming season.`,
          choices: [
            { label: 'Embrace the Workload', isDevBoost: true, isRisky: false, feedback: devBoostMsg, effect: { idol: 5, ovr: 2, money: 0 }, action: 'DEMOTE', actionData: { team: demotionTargetTeam, lg: demotionTargetLg } },
            { label: 'Complain to the media', isRisky: true, successChance: 0.3, successFeedback: 'The fans love your fiery passion. You vow to prove the GM wrong!', successEffect: { idol: 15, ovr: 1, money: 0 }, failFeedback: 'You look like a spoiled kid. The GM fines you and the fans turn on you.', failEffect: { idol: -15, ovr: -1, money: -25000 }, action: 'DEMOTE', actionData: { team: demotionTargetTeam, lg: demotionTargetLg } }
          ],
          isDemotionEvent: true, currentLg: demotionTargetLg, currentTeam: demotionTargetTeam, madePlayoffs: result.madePlayoffs
        });
      }
      setScreen('event');
      return;
    } else {
      let willPromote = false;
      let promotionTargetTeam = null;
      if (result.currentLg === 'AHL') {
         const isNHLContract = (finalPlayer.contract?.salary || 0) >= 500000;
         const parent = (nhlTeams || []).find(t => t.ahlId === player.team);
         
         // Callups happen frequently for highly touted prospects
         if (parent && isNHLContract && (finalPlayer.ovr >= 73 || result.recap?.rating >= 7.5)) {
             willPromote = true;
             promotionTargetTeam = parent.id;
         }
      }

      if (willPromote) {
          setActiveEvent({
              title: 'CALLED UP TO THE SHOW',
              desc: `Your dominant play in the AHL has convinced the front office. The ${getFullTeamName(promotionTargetTeam, 'NHL')} are officially calling you up to the NHL roster!`,
              choices: [
                  { label: 'Pack your bags', isRisky: false, feedback: 'You are heading to the NHL!', effect: { idol: 10, ovr: 1, money: 0 }, action: 'DEMOTE', actionData: { team: promotionTargetTeam, lg: 'NHL' } }
              ],
              isDemotionEvent: true,
              currentLg: 'NHL',
              currentTeam: promotionTargetTeam,
              madePlayoffs: result.madePlayoffs
          });
          setScreen('event');
          return;
      }

      if (result.currentLg === 'NCAA') {
         setSeasonRecap(result.recap);
         runPostSeasonFlow(finalPlayer.age, finalPlayer.ovr, result.currentLg, result.currentTeam, result.madePlayoffs, activeYear + 1, result.recap?.standings || 16);
      } else {
          // SURPRISE TRADE LOGIC (ALL LEAGUES EXCEPT NCAA)
         const currentLg = result.currentLg;
         const isExpiring = finalPlayer.contract?.years === 1 || ['OHL', 'WHL', 'QMJHL', 'USHL'].includes(currentLg); // Junior players are almost always treated as expiring/rental assets.
         
         const teamStandings = result.recap?.standings || 16;
         const totalTeamsInLeague = getOpponentPool(currentLg)?.length || 20;
         const isRebuilding = teamStandings > (totalTeamsInLeague * 0.6); // Bottom 40% of the league
         
         // Dynamically define what "Elite" means based on the league level
         let eliteThreshold = 82;
         if (['AHL', 'SHL', 'LIIGA'].includes(currentLg)) eliteThreshold = 72;
         if (['OHL', 'WHL', 'QMJHL', 'USHL'].includes(currentLg)) eliteThreshold = 62;
         
         const isElite = finalPlayer.ovr >= eliteThreshold;

         // 40% chance to be traded if elite/expiring on a bad team. 5% random hockey trade otherwise.
         const tradeChance = (result.currentTeam === 'NTDP') ? 0 : ((isExpiring && isRebuilding && isElite) ? 0.40 : 0.05);

         if (Math.random() < tradeChance) {
            // Dynamically pull from the exact league the player is in!
            let pool = (getOpponentPool(currentLg) || []).filter(t => t.id !== result.currentTeam);
            if (pool.length === 0) pool = [{ id: 'UNK', name: 'Unknown Team' }];
            
            const destTeam = pool[Math.floor(Math.random() * pool.length)];
            const playoffSpots = LEAGUE_CONFIG[currentLg]?.playoffSpots || 16;
            const destStandings = Math.floor(Math.random() * (playoffSpots - 2)) + 1; // Usually dealt to a top playoff contender
            
            setPendingSeasonResult(result);
            setActiveEvent({
               title: 'BLOCKBUSTER TRADE!',
               desc: `Your GM called you into the office... you've been traded! The team decided to move in a different direction and shipped you to the ${getFullTeamName(destTeam.id, currentLg)}.`,
               choices: [
                  { label: 'Embrace the fresh start', isRisky: false, feedback: 'You packed your bags and joined your new squad.', effect: { idol: 0, ovr: 0, money: 0 }, action: 'ACCEPT_TRADE_DEADLINE', actionData: { teamObj: destTeam, teamStandings: destStandings, madePlayoffs: destStandings <= playoffSpots } },
                  { label: 'Trash your old GM to the press', isRisky: true, successChance: 0.4, successFeedback: 'Fans of your new team loved the fire. You arrived with a chip on your shoulder!', successEffect: { idol: 20, ovr: 1, money: 0 }, failFeedback: 'You came off looking bitter and unprofessional. Not a great first impression.', failEffect: { idol: -20, ovr: -1, money: 0 }, action: 'ACCEPT_TRADE_DEADLINE', actionData: { teamObj: destTeam, teamStandings: destStandings, madePlayoffs: destStandings <= playoffSpots } }
               ],
               isTradeDeadlineEvent: true
            });
            setScreen('event');
         } else {
            setPendingSeasonResult(result);
            setScreen('trade-deadline');
         }
      }
    }
  };

 const runPostSeasonFlow = (pAge, pOvr, currentLg, currentTeam, madePlayoffs, nextYear, standings) => {
    setPendingPlayoffs(madePlayoffs ? { lg: currentLg, team: currentTeam, standings } : null);

    // ==========================================
    // STORYLINE 0: THE COACHING CAROUSEL
    // ==========================================
    const coachTrustLvl = player.relationships?.coach || 50;
    const totalTeams = getOpponentPool(currentLg)?.length || 32;
    const isBottomFeeder = standings >= (totalTeams - 5);
    
    // If the team bombs and coach trust is low, the coach is fired.
    if (currentLg === 'NHL' && isBottomFeeder && coachTrustLvl < 50 && Math.random() < 0.40) {
        setActiveEvent({
            title: '👔 THE COACHING CAROUSEL',
            desc: `After a disastrous season, the front office fired the head coach. The new bench boss has pulled you into his office to discuss your role moving forward.`,
            choices: [
                { label: 'Pledge to play a 200-foot defensive game', isRisky: false, feedback: 'He appreciates your commitment to a team-first system.', effect: { idol: 0, ovr: 0, rel: { coach: 30 } } },
                { label: 'Demand the offense runs through you', isRisky: true, successChance: (pOvr >= 85 ? 0.7 : 0.3), successFeedback: 'He loves your confidence and gives you the green light to dominate!', successEffect: { idol: 15, ovr: 1, rel: { coach: 20 } }, failFeedback: 'He hates your ego. You start the season in his doghouse.', failEffect: { idol: -15, ovr: -1, rel: { coach: -30 } } }
            ],
            madePlayoffs
        });
        setScreen('event');
        return;
    }

    // ==========================================
    // STORYLINE 1: THE MEDIA NEMESIS
    // ==========================================
    const nemesisStage = player.storylines?.mediaNemesis || 0;
    const mediaTrust = player.relationships?.media || 50;
    
    // Organic Trigger: Bad media relations early in career

    // STAGE 1: THE HIT PIECE
    if (nemesisStage === 1 && Math.random() < 0.5) {
        setPlayer(p => ({ ...p, storylines: { ...p.storylines, mediaNemesis: 2 } }));
        setActiveEvent({
            title: '📰 THE HIT PIECE',
            desc: `Notorious local shock-jock ${player.nemesisName || 'a local columnist'} just published a scathing hit piece on you. He called you selfish, lazy, and a locker room cancer. The article is trending everywhere.`,
            choices: [
                { label: 'Take the High Road', isRisky: false, feedback: 'You refused to take the bait. Your coach loved the maturity, but the fans wanted you to defend yourself.', effect: { idol: -15, ovr: 1, rel: { coach: 15, media: 5 } } },
                { label: 'Declare War', isRisky: true, successChance: 0.5, successFeedback: 'You publicly called the reporter a hack and backed it up on the ice! The fans love the drama.', successEffect: { idol: 40, ovr: 1, rel: { media: -20, teammates: 10 } }, failFeedback: 'You sounded incredibly rattled and defensive. The reporter just tweeted "I rest my case."', failEffect: { idol: -30, ovr: -1, rel: { media: -30 } } }
            ],
            madePlayoffs
        });
        setScreen('event');
        return;
    }

    // STAGE 2: THE LOCKER ROOM CONFRONTATION
    if (nemesisStage === 2 && !madePlayoffs && Math.random() < 0.4) {
        setPlayer(p => ({ ...p, storylines: { ...p.storylines, mediaNemesis: 3 } }));
        setActiveEvent({
            title: '🎤 THE AMBUSH',
            desc: `Following a brutal loss, ${player.nemesisName} forces his way to your locker and asks a wildly disrespectful, baiting question about your work ethic right in front of the cameras.`,
            choices: [
                { label: 'Walk Away', isRisky: false, feedback: 'You walked away mid-question. It looks bad on TV, but you avoided a fine.', effect: { idol: -10, ovr: 0, rel: { media: -15 } } },
                { label: 'Put Him In His Place', isRisky: true, successChance: (pOvr >= 85 ? 0.7 : 0.3), successFeedback: 'You systematically dismantled his hockey knowledge on live TV. It was a legendary press conference moment!', successEffect: { idol: 50, ovr: 1, money: 10000, rel: { media: 20 } }, failFeedback: 'You lost your temper, cursed him out, and the league fined you heavily. A total PR disaster.', failEffect: { idol: -40, ovr: -1, money: -50000, rel: { media: -40 } } }
            ],
            madePlayoffs
        });
        setScreen('event');
        return;
    }

    // STAGE 3: VINDICATION
    if (nemesisStage === 3 && currentLg === 'NHL' && playoffs?.overallStatus === 'won_cup') {
        setPlayer(p => ({ ...p, storylines: { ...p.storylines, mediaNemesis: 4 } })); // Ends arc
        setActiveEvent({
            title: '🏆 THE ULTIMATE VINDICATION',
            desc: `You just won the Cup. In the post-game press conference, you spot ${player.nemesisName} sitting quietly in the back of the room. He looks completely defeated.`,
            choices: [
                { label: 'Call Him Out Publicly', isRisky: false, feedback: 'You stared right at him and asked, "What are you going to write tomorrow?" The entire room erupted in laughter. You won the war.', effect: { idol: 100, ovr: 1, rel: { media: 30 } } }
            ],
            madePlayoffs
        });
        setScreen('event');
        return;
    }

    // ==========================================
    // STORYLINE 1.5: THE FRANCHISE DUO
    // ==========================================
    const duoStage = player.storylines?.franchiseDuo || 0;
    const teammateTrust = player.relationships?.teammates || 50;

    // Organic Trigger: Good teammate relations early in NHL career
    if (duoStage === 0 && currentLg === 'NHL' && teammateTrust > 75 && player.stats?.seasonsPlayed >= 2 && Math.random() < 0.15) {
        setPlayer(p => ({ 
            ...p, 
            storylines: { ...p.storylines, franchiseDuo: 1 },
            duoName: 'your linemate'
        }));
        setActiveEvent({
            title: '🤝 THE DYNAMIC DUO',
            desc: `You and a young linemate have developed literal mind-reading chemistry on the ice. The fans have given you a combined nickname, and you are officially inseparable on and off the ice.`,
            choices: [
                { label: 'Embrace the Brotherhood', isRisky: false, feedback: 'The two of you are the heartbeat of the franchise. Your chemistry makes everyone better.', effect: { idol: 30, ovr: 1, rel: { teammates: 25 } } }
            ],
            madePlayoffs
        });
        setScreen('event');
        return;
    }

    // STAGE 2: THE CAP CASUALTY 
    if (duoStage === 1 && player.age > 24 && Math.random() < 0.25) {
        setPlayer(p => ({ ...p, storylines: { ...p.storylines, franchiseDuo: 2 } }));
        setActiveEvent({
            title: '💼 THE BUSINESS OF HOCKEY',
            desc: `Your best friend on the team is entering a contract year. The GM pulls you aside and says they can't afford to keep both of you under the salary cap unless you agree to restructure your own contract and take a massive pay cut.`,
            choices: [
                { label: 'Take the Pay Cut for Him', isRisky: false, feedback: 'You sacrificed millions of dollars to keep your duo together. The fans worship your loyalty.', effect: { idol: 100, ovr: 1, money: -2500000, rel: { teammates: 50, coach: 20 } } },
                { label: 'Keep Your Money', isRisky: false, feedback: 'You told the GM hockey is a business. Your friend was traded the next day. The locker room is stunned, and you feel entirely alone.', effect: { idol: -50, ovr: -2, money: 0, rel: { teammates: -40 } } }
            ],
            madePlayoffs
        });
        setScreen('event');
        return;
    }
    // ==========================================
    // STORYLINE 2: LOCKER ROOM POLITICS
    // ==========================================
    const lockerStage = player.storylines?.lockerRoom || 0;
    const coachTrust = player.relationships?.coach || 50;

    // STAGE 1: THE CLASH (Triggered organically early in an NHL career)
    if (lockerStage === 0 && currentLg === 'NHL' && player.stats?.seasonsPlayed < 5 && Math.random() < 0.15) {
        setPlayer(p => ({ ...p, storylines: { ...p.storylines, lockerRoom: 1 } }));
        setActiveEvent({
            title: '👴 THE OLD GUARD',
            desc: `You just walked into a locker room run by a grizzled veteran captain and an old-school coach who hates flashy rookies. They demand you put your head down and play a grinding, dump-and-chase style.`,
            choices: [
                { label: 'Buy In (Grind it out)', isRisky: false, feedback: 'You dumped the puck and threw hits. The coach nodded approvingly, but the fans were bored to tears.', effect: { idol: -15, ovr: 0, rel: { coach: 25, teammates: 10 } } },
                { label: 'Play Your Game (Flashy)', isRisky: true, successChance: 0.5, successFeedback: 'You pulled off a nasty toe-drag and scored! The fans went wild, forcing the coach to bite his tongue.', successEffect: { idol: 30, ovr: 1, money: 0, rel: { coach: -10 } }, failFeedback: 'You turned the puck over at the blue line. The coach stapled you to the bench for the rest of the period.', failEffect: { idol: -15, ovr: -1, rel: { coach: -25, teammates: -10 } } }
            ],
            madePlayoffs
        });
        setScreen('event');
        return;
    }

    // STAGE 2 / 3: THE RESOLUTION
    if (lockerStage === 1 && currentLg === 'NHL') {
        if (coachTrust <= 30 && pOvr >= 80) {
            // RESOLUTION A: THE ULTIMATUM (You are too good, but the coach hates you)
            setPlayer(p => ({ ...p, storylines: { ...p.storylines, lockerRoom: 2 } })); // Ends arc
            
            let pool = (getOpponentPool('NHL') || []).filter(t => t.id !== currentTeam);
            if (pool.length === 0) pool = [{ id: 'UNK', name: 'Unknown Team' }];
            const destTeam = pool[Math.floor(Math.random() * pool.length)];

            setActiveEvent({
                title: '⚡ LOCKER ROOM MUTINY',
                desc: `Your relationship with the old-school coach is completely broken, but your elite stats are undeniable. The GM calls you in to resolve this incredibly toxic situation.`,
                choices: [
                    { label: 'Demand the Coach is Fired', isRisky: true, successChance: 0.6, successFeedback: 'The GM sided with his superstar. The coach was fired the next morning, and the locker room is officially yours.', successEffect: { idol: 20, ovr: 1, rel: { coach: 50, teammates: 20 } }, failFeedback: 'The GM refused to let a player run the team. You were immediately suspended for insubordination.', failEffect: { idol: -25, ovr: -1, money: -50000, rel: { coach: -20, teammates: -20 } } },
                    { label: 'Demand a Trade', isRisky: false, feedback: `You told the GM you want out. Within 24 hours, you were quietly shipped off to ${destTeam.name}.`, effect: { idol: -15, ovr: 0, rel: { coach: 10 } }, action: 'ACCEPT_TRADE_DEADLINE', actionData: { teamObj: destTeam, teamStandings: 12, madePlayoffs: true } }
                ],
                madePlayoffs
            });
            setScreen('event');
            return;
        } else if (coachTrust >= 80 && pAge >= 21) {
            // RESOLUTION B: PASSING THE TORCH (You earned their respect)
            setPlayer(p => ({ ...p, storylines: { ...p.storylines, lockerRoom: 2 } })); // Ends arc
            setActiveEvent({
                title: '👑 PASSING THE TORCH',
                desc: `You bought into the system, played the right way, and earned the ultimate respect of the old guard. The veteran captain just announced his retirement and publicly handed you the "C".`,
                choices: [
                    { label: 'Accept the Captaincy', isRisky: false, feedback: 'You are now the Captain of the franchise. Your leadership elevates everyone on the ice.', effect: { idol: 100, ovr: 2, rel: { coach: 20, teammates: 20 } } }
                ],
                madePlayoffs
            });
            setScreen('event');
            return;
        }
    }

    // ==========================================
    // STORYLINE 3: THE HOMETOWN SAVIOR BURDEN
    // ==========================================
    const hometownStage = player.storylines?.hometown || 0;

    // STAGE 1: THE HONEYMOON (Drafted or developed into a highly-rated savior)
    if (hometownStage === 0 && currentLg === 'NHL' && pOvr >= 78 && Math.random() < 0.12) {
        setPlayer(p => ({ ...p, storylines: { ...p.storylines, hometown: 1 } }));
        setActiveEvent({
            title: '🏙️ THE SAVIOR ARRIVES',
            desc: `The city has suffered a 50-year championship drought. The media and fans have immediately crowned you as their hometown savior. The expectations are astronomical, but the love is real.`,
            choices: [
                { label: 'Embrace the Pressure', isRisky: false, feedback: 'You told the press you are here to win a Cup. The city is ready to run through a brick wall for you.', effect: { idol: 50, ovr: 1, money: 0 } },
                { label: 'Downplay the Hype', isRisky: true, successChance: 0.5, successFeedback: 'You successfully managed expectations, keeping the media calm while still impressing the fans.', successEffect: { idol: 20, ovr: 0, rel: { media: 20 } }, failFeedback: 'The media accused you of lacking confidence. Not the heroic quote they wanted.', failEffect: { idol: -15, ovr: 0, rel: { media: -20 } } }
            ],
            madePlayoffs
        });
        setScreen('event');
        return;
    }

    // STAGE 2: THE SLUMP (Failing to deliver a deep run)
    if (hometownStage === 1 && currentLg === 'NHL' && !madePlayoffs && Math.random() < 0.5) {
        setPlayer(p => ({ ...p, storylines: { ...p.storylines, hometown: 2 } }));
        setActiveEvent({
            title: '📉 THE HONEYMOON IS OVER',
            desc: `Another season ends without a parade. The local media has turned toxic, and talk-radio is questioning if you actually have what it takes to carry this franchise. The pressure is suffocating.`,
            choices: [
                { label: 'Ignore the Noise', isRisky: false, feedback: 'You stayed off social media and hit the gym. The fans are still mad, but you kept your focus.', effect: { idol: -30, ovr: 1, rel: { media: -10 } } },
                { label: 'Call Out the Critics', isRisky: true, successChance: 0.4, successFeedback: 'You passionately defended your team. A risky move, but the diehard fans respected your fire!', successEffect: { idol: 25, ovr: 0, rel: { teammates: 15 } }, failFeedback: 'It completely backfired. The media crucified you for making excuses.', failEffect: { idol: -50, ovr: -1, rel: { media: -30 } } }
            ],
            madePlayoffs
        });
        setScreen('event');
        return;
    }

    // STAGE 3: THE BREAKING POINT
    if (hometownStage === 2 && currentLg === 'NHL' && Math.random() < 0.4) {
        setPlayer(p => ({ ...p, storylines: { ...p.storylines, hometown: 3 } })); // End arc
        
        let pool = (getOpponentPool('NHL') || []).filter(t => t.id !== currentTeam);
        if (pool.length === 0) pool = [{ id: 'UNK', name: 'Unknown Team' }];
        const destTeam = pool[Math.floor(Math.random() * pool.length)];

        setActiveEvent({
            title: '🧳 THE BREAKING POINT',
            desc: `The offseason has arrived. You just received a massive, under-the-table guarantee from a sunny, low-pressure market. They will force a trade to get you and pay you a fortune to escape this toxic media environment.`,
            choices: [
                { label: 'Stay and Fight (Loyalty)', isRisky: true, successChance: 0.5, successFeedback: 'You pledged your loyalty to the city! The fans are weeping tears of joy. You are a local legend.', successEffect: { idol: 150, ovr: 2, rel: { teammates: 20 } }, failFeedback: 'You stayed, but the toxic environment is mentally draining your love for the game.', failEffect: { idol: 10, ovr: -2, rel: { media: -10 } } },
                { label: 'Take the Money & Escape', isRisky: false, feedback: `You packed your bags for ${destTeam.name}. You are rich and stress-free, but your hometown jerseys are burning in the streets.`, effect: { idol: -150, ovr: 0, money: 2500000 }, action: 'ACCEPT_TRADE_DEADLINE', actionData: { teamObj: destTeam, teamStandings: 8, madePlayoffs: true } }
            ],
            madePlayoffs
        });
        setScreen('event');
        return;
    }

    // ==========================================
    // STORYLINE 4: THE DEVASTATING INJURY
    // ==========================================
    const injuryStage = player.storylines?.injury || 0;

    // STAGE 1: THE HIT (Random 4% chance anytime after junior hockey)
    if (injuryStage === 0 && currentLg !== 'NCAA' && pAge > 18 && Math.random() < 0.04) {
        setPlayer(p => ({ ...p, storylines: { ...p.storylines, injury: 1 } }));
        setActiveEvent({
            title: '🚑 DEVASTATING INJURY',
            desc: `A fourth-line enforcer just caught you with your head down. The hit was brutal. You are stretchered off the ice with a torn ACL. Your season is completely over, and doctors are questioning if you'll ever have the same speed again.`,
            choices: [
                { label: 'Begin Recovery', isRisky: false, feedback: 'The surgery was successful, but the road back is going to be incredibly difficult. You lost a significant step (-3 OVR).', effect: { idol: 15, ovr: -3, money: 0 } }
            ],
            madePlayoffs: false // Forces you to miss the playoffs regardless of team standings!
        });
        setScreen('event');
        return;
    }

    // STAGE 2: THE REHAB (Triggers the immediate next offseason)
    if (injuryStage === 1) {
        setPlayer(p => ({ ...p, storylines: { ...p.storylines, injury: 2 } }));
        setActiveEvent({
            title: '🏥 THE REHABILITATION',
            desc: `It's been a grueling offseason of rehab. Your physical therapists have presented you with two options: a standard team-covered recovery plan, or flying to Germany for cutting-edge, experimental treatments out of your own pocket.`,
            choices: [
                { label: 'Experimental Rehab ($100k)', isRisky: true, successChance: 0.75, successFeedback: 'The treatment worked miracles! You actually feel faster and stronger than you did before the injury (+4 OVR).', successEffect: { idol: 20, ovr: 4, money: -100000 }, failFeedback: 'The experimental treatment was a bust. You lost the money and still feel a step slow.', failEffect: { idol: 0, ovr: 1, money: -100000 } },
                { label: 'Standard Rehab (Free)', isRisky: false, feedback: 'You played it safe. You are medically cleared to play, but you definitely lost a step physically (+1 OVR recovery).', effect: { idol: 0, ovr: 1, money: 0 } }
            ],
            madePlayoffs
        });
        setScreen('event');
        return;
    }

    // STAGE 3: THE COMEBACK / REVENGE
    if (injuryStage === 2 && Math.random() < 0.5) {
        setPlayer(p => ({ ...p, storylines: { ...p.storylines, injury: 3 } })); // Ends arc
        setActiveEvent({
            title: '🩸 BAD BLOOD',
            desc: `It's your first game back against the exact enforcer that tore your ACL last year. The crowd is buzzing. Everyone on the ice knows exactly what is about to happen.`,
            choices: [
                { label: 'Drop the Gloves (Revenge)', isRisky: true, successChance: (pOvr >= 75 ? 0.6 : 0.3), successFeedback: 'You beat the absolute brakes off him! The crowd went berserk. Justice served.', successEffect: { idol: 75, ovr: 1, rel: { teammates: 30, coach: -10 } }, failFeedback: 'He got the better of you again. You left the ice with a black eye and a bruised ego.', failEffect: { idol: -15, ovr: 0, rel: { teammates: -10, coach: -15 } } },
                { label: 'Scoreboard Revenge', isRisky: true, successChance: (player.hockeyIQ >= 70 ? 0.7 : 0.4), successFeedback: 'You burned him on a 1-on-1 and scored the game-winner! The ultimate flex.', successEffect: { idol: 40, ovr: 1, rel: { coach: 20 } }, failFeedback: 'You tried to force a play on him and turned it over. The coach wasn\'t happy.', failEffect: { idol: -10, ovr: -1, rel: { coach: -15 } } }
            ],
            madePlayoffs
        });
        setScreen('event');
        return;
    }
    // ==========================================
    // STORYLINE 5: THE POSITIONAL LOGJAM (Centers Only)
    // ==========================================
    if (!player.storylines?.positionChange && player.pos === 'C' && ['NHL', 'AHL', 'SHL', 'LIIGA'].includes(currentLg) && Math.random() < 0.15) {
        setPlayer(p => ({ ...p, storylines: { ...p.storylines, positionChange: 1 } }));
        setActiveEvent({
            title: '🔄 ROSTER LOGJAM',
            desc: `Your team has incredible depth down the middle, but they are weak on the wings. The head coach pulls you aside and asks you to shift to the Wing permanently to balance the lines.`,
            choices: [
                {
                    label: 'Accept the Move (Team Player)',
                    isRisky: false,
                    feedback: 'You put the team first and shifted to the wing. The coach loved your unselfishness, but you had to learn a new system on the fly (-1 OVR).',
                    effect: { idol: 10, ovr: -1, rel: { coach: 25 } },
                    action: 'CHANGE_POSITION',
                    actionData: Math.random() > 0.5 ? 'LW' : 'RW'
                },
                {
                    label: 'Refuse (I am a Center)',
                    isRisky: true,
                    successChance: 0.5,
                    successFeedback: 'You stood your ground and proved you are the best Center on the roster. The coach respected your confidence and bumped a veteran to the wing instead.',
                    successEffect: { idol: 15, ovr: 1, rel: { coach: 10 } },
                    failFeedback: 'You flat out refused the coach\'s request. He benched you for the third period to teach you a lesson about being a team player.',
                    failEffect: { idol: -10, ovr: -1, rel: { coach: -30 } }
                }
            ],
            madePlayoffs
        });
        setScreen('event');
        return;
    }
    
    if (pAge <= 19 && Math.random() > 0.4) {
      setIntlResult(null);
      setMinigameContext('wjc');
      setScreen('intl-minigame');
      return;
    }
    if (pAge > 19 && nextYear % 4 === 0 && pOvr >= 78) {
      setIntlResult(null);
      setMinigameContext('olympics');
      setScreen('intl-minigame');
      return;
    }

    const rivalObj = getPrimaryRival(currentTeam, currentLg);
    if (rivalObj && Math.random() < 0.35) {
      const rivalName = rivalObj.name || rivalObj.id;
      const isGoalie = player.pos === 'G';

      const fullChoicesPool = [
        {
          label: isGoalie ? 'Guarantee a Shutout' : 'Run Your Mouth to the Press',
          subLabel: '⚡ High Risk • Massive Fan Status boost or public embarrassment',
          isRisky: true,
          successChance: 0.45,
          successFeedback: isGoalie
            ? 'You stood on your head and posted a dominant shutout! The arena went ballistic and your jersey sales spiked overnight.'
            : 'You backed up every word on the ice with a multi-point performance! The arena went ballistic and your jersey sales spiked overnight.',
          successEffect: { idol: 35, ovr: 1, money: 15000 },
          failFeedback: isGoalie
            ? 'You had a nightmare start, letting in 4 goals on 12 shots. Rival fans mocked you endlessly on social media.'
            : 'You got shut down completely and got mocked endlessly by rival fans on social media.',
          failEffect: { idol: -25, ovr: 0, money: 0 }
        },
        {
          label: 'Lead by Example',
          subLabel: '🛡️ Safe • Steady team effort with reliable Fan approval',
          isRisky: false,
          feedback: isGoalie
            ? 'You played a calm, laser-focused game between the pipes, anchoring your squad to a gritty rivalry win.'
            : 'You played a disciplined, hard-nosed game and led your squad to a gritty rivalry win.',
          effect: { idol: 15, ovr: 1, money: 0 }
        },
        {
          label: isGoalie ? 'Aggressive Crease Control' : 'Set the Physical Tone',
          subLabel: '💥 Moderate Risk • High intensity performance',
          isRisky: true,
          successChance: 0.65,
          successFeedback: isGoalie
            ? 'You aggressively challenged shooters and made flash-of-the-glove saves that completely rattled their top line!'
            : 'Your crushing hits early in the 1st period rattled their top line and energized the home crowd!',
          successEffect: { idol: 20, ovr: 1, money: 0 },
          failFeedback: isGoalie
            ? 'You over-committed out of the net, getting caught out of position for a costly easy goal.'
            : 'You took an undisciplined double-minor penalty in the 3rd period that led to the game-winning goal.',
          failEffect: { idol: -15, ovr: -1, money: 0 }
        },
        {
          label: isGoalie ? 'Stare Down Their Top Sniper' : 'Target Their Star Player',
          subLabel: '🎯 Target Focus • Neutralize their biggest threat',
          isRisky: true,
          successChance: 0.55,
          successFeedback: isGoalie
            ? `You completely robbed their star player on a breakaway! They were frustrated for the rest of the night.`
            : `You shadowed their top star all night, shutting them down completely and drawing key penalties.`,
          successEffect: { idol: 25, ovr: 1, money: 0 },
          failFeedback: isGoalie
            ? `Their star beat you clean top-shelf twice in the 1st period.`
            : `Their star player danced past you for a highlight-reel goal while you got caught out of position.`,
          failEffect: { idol: -15, ovr: 0, money: 0 }
        },
        {
          label: 'Deliver a Fiery Pre-Game Speech',
          subLabel: '🔥 Leadership • Fire up the locker room',
          isRisky: false,
          feedback: `Your speech gave the entire team chills. Everyone skated onto the ice ready to bleed for the jersey.`,
          effect: { idol: 10, ovr: 1, money: 0 }
        },
        {
          label: isGoalie ? 'Slash Anyone Entering Your Crease' : 'Agitate Their Bench Between Whistles',
          subLabel: '😈 Mind Games • Get under their skin',
          isRisky: true,
          successChance: 0.60,
          successFeedback: `You completely broke their focus. Two of their key players got ejected for taking stupid retaliation penalties!`,
          successEffect: { idol: 20, ovr: 0, money: 5000 },
          failFeedback: `The referees weren't having it. You got called for unsportsmanlike conduct and put your team on a penalty kill.`,
          failEffect: { idol: -10, ovr: -1, money: -5000 }
        },
        {
          label: 'Pump Up the Home Crowd Early',
          subLabel: '📣 Crowd Control • Hype up the stadium',
          isRisky: false,
          feedback: `You raised your arms to the crowd before puck drop and the noise level reached deafening decibels!`,
          effect: { idol: 20, ovr: 0, money: 0 }
        },
        {
          label: 'Obsess Over Video Tape',
          subLabel: '🧠 High IQ • Tactical preparation',
          isRisky: false,
          feedback: `Your endless film study paid off—you anticipated their breakout plays like you had their playbook!`,
          effect: { idol: 5, ovr: 2, money: 0 }
        },
        {
          label: isGoalie ? 'Flashy Glove Saves' : 'Attempt a Highlight-Reel Move',
          subLabel: '✨ Showmanship • Go for the viral highlight',
          isRisky: true,
          successChance: 0.50,
          successFeedback: isGoalie
            ? `You pulled off a wind-mill glove save that became the #1 play on SportsCenter!`
            : `You pulled off a nasty toe-drag around their defender and sniped it home! SportsCenter #1 play!`,
          successEffect: { idol: 30, ovr: 0, money: 10000 },
          failFeedback: isGoalie
            ? `You tried to showboat on a routine shot and fumbled it into your own net. Ouch.`
            : `You coughed up the puck trying to pull off a move and caused a breakaway goal against.`,
          failEffect: { idol: -20, ovr: 0, money: 0 }
        },
        {
          label: isGoalie ? 'Aggressively Play the Puck Behind Net' : 'Pledge to Block Every Shot',
          subLabel: '🛡️ Ultimate Sacrifice • Put your body on the line',
          isRisky: true,
          successChance: 0.60,
          successFeedback: isGoalie
            ? `Your crisp passes out of the zone launched three fast-break opportunities!`
            : `You threw yourself in front of three rocket slapshots in the 3rd period to seal the win!`,
          successEffect: { idol: 25, ovr: 1, money: 0 },
          failFeedback: isGoalie
            ? `You misread the bounce off the glass, leaving a wide-open net for an embarrassing goal.`
            : `You blocked a shot, but limped off the ice in pain and missed crucial shifts late in the game.`,
          failEffect: { idol: -10, ovr: -1, money: 0 }
        },
        {
          label: isGoalie ? 'Get Involved in a Line Scrum' : 'Drop the Gloves Early',
          subLabel: '👊 Heavy Enforcer • Old-school rivalry brawl',
          isRisky: true,
          successChance: 0.55,
          successFeedback: `You won the fight handily! The home crowd exploded and the energy in the building was electric!`,
          successEffect: { idol: 30, ovr: 0, money: 0 },
          failFeedback: `You took a heavy punch, lost your helmet, and spent 5 minutes in the box while your team conceded.`,
          failEffect: { idol: -15, ovr: -1, money: 0 }
        },
        {
          label: 'Ice-Cold Systems Hockey',
          subLabel: '🧊 Composure • Pure tactical discipline',
          isRisky: false,
          feedback: `While they ran around trying to hit everything, you quietly executed your game plan to perfection.`,
          effect: { idol: 10, ovr: 1, money: 0 }
        },
        {
          label: isGoalie ? 'Aggressive Poke-Checks' : 'Fly Down the Wing First Shift',
          subLabel: '⚡ High Energy • Speed and quickness',
          isRisky: true,
          successChance: 0.65,
          successFeedback: isGoalie
            ? `You poked the puck away cleanly on two separate breakaway attempts!`
            : `You blew past their defenseman on shift one and buried a wrist shot!`,
          successEffect: { idol: 20, ovr: 1, money: 0 },
          failFeedback: isGoalie
            ? `You missed the poke-check and got deked out of your skates.`
            : `You got hit hard along the boards on your first shift and lost your momentum.`,
          failEffect: { idol: -10, ovr: 0, money: 0 }
        },
        {
          label: isGoalie ? 'Relentlessly Chirp Their Forwards' : 'Relentlessly Chirp Their Defense',
          subLabel: '🗣️ Psychological Warfare • Disrupt their heads',
          isRisky: true,
          successChance: 0.50,
          successFeedback: `Your running commentary had their players arguing with each other on the bench!`,
          successEffect: { idol: 15, ovr: 1, money: 0 },
          failFeedback: `They laughed off your chirps and proceeded to score on their next two power plays.`,
          failEffect: { idol: -15, ovr: 0, money: 0 }
        },
        {
          label: 'Anchor Team Composure',
          subLabel: '🧘 Veteran Calm • Keep emotions in check',
          isRisky: false,
          feedback: `When the game turned chaotic in the 2nd period, your calm presence settled the entire team down.`,
          effect: { idol: 15, ovr: 1, money: 0 }
        },
        {
          label: isGoalie ? 'Stack the Pads in Traffic' : 'Demand Double-Shifts Late',
          subLabel: '👑 Hero Ball • Take control of the game',
          isRisky: true,
          successChance: 0.50,
          successFeedback: isGoalie
            ? `You threw back to the 90s with a desperate pad-stack save that sealed the win!`
            : `You played 28 minutes, carried the team on your back, and scored the game-winner!`,
          successEffect: { idol: 35, ovr: 1, money: 15000 },
          failFeedback: isGoalie
            ? `Stacking the pads left the top half of the net wide open. High shot, easy goal.`
            : `You got completely gassed in the 3rd period and turned the puck over for the game-winner against.`,
          failEffect: { idol: -20, ovr: -1, money: 0 }
        }
      ];

      const selectedChoices = [...fullChoicesPool].sort(() => 0.5 - Math.random()).slice(0, 3);

      setActiveEvent({
        title: `🔥 RIVALRY NIGHT: VS THE ${rivalName.toUpperCase()}`,
        desc: `It's rivalry night against ${rivalName}! The arena is sold out, national television is covering the game, and the fans are desperate for a statement win. How do you approach the game?`,
        choices: selectedChoices,
        isDemotionEvent: false,
        madePlayoffs
      });
      setScreen('event');
      return;
    }

    if (Math.random() < 0.65) {
      const eventRoll = Math.random();
      if (eventRoll < 0.33) {
        const isGoalie = player.pos === 'G';
        const validQuestions = PRESS_QUESTIONS.filter(q => q.forPos === 'all' || (isGoalie ? q.forPos === 'goalie' : q.forPos === 'skater'));
        
        let shuffledQ = [];
        let hasPositive = false;
        let hasNegative = false;
        
        const randomized = [...validQuestions].sort(() => 0.5 - Math.random());
        for (const q of randomized) {
          if (q.tag === 'positive' && hasNegative) continue;
          if (q.tag === 'negative' && hasPositive) continue;
          
          if (q.tag === 'positive') hasPositive = true;
          if (q.tag === 'negative') hasNegative = true;
          
          shuffledQ.push(q);
              if (shuffledQ.length === 3) break;
            }

            const validReporters = getJournalistsForLeague(currentLg);
            const shuffledJ = [...validReporters].sort(() => 0.5 - Math.random()).slice(0, 3);
            setActivePress({ journalists: shuffledJ, questions: shuffledQ, currentQ: 0, answers: [] });
            setScreen('press');
      } else if (eventRoll < 0.66) {
        triggerMinigame('season');
      } else {
        setMinigameContext('season');
        const deck = eventDeck || [];
        if (deck.length > 0) {
           const randomEvt = deck[Math.floor(Math.random() * deck.length)];
           setActiveEvent({ ...randomEvt, isDemotionEvent: false, madePlayoffs: madePlayoffs });
           setScreen('event');
        } else {
           if (madePlayoffs) checkPlayoffs(currentLg, currentTeam, standings);
           else setScreen('recap');
        }
      }
      return;
    }

    if (madePlayoffs) checkPlayoffs(currentLg, currentTeam, standings);
    else setScreen('recap');
  };

  const handlePressAnswer = (vibeId) => {
    const newAnswers = [...activePress.answers, vibeId];
    if (newAnswers.length === 3) {
      setActivePress({ ...activePress, answers: newAnswers });
      setScreen('press-result'); // RESTORED: Goes to the breakdown screen!
    } else {
      setActivePress({ ...activePress, answers: newAnswers, currentQ: activePress.currentQ + 1 });
    }
  };

  const handleEndPress = () => {
    const journalists = activePress.journalists || [];
    const hits = activePress.answers.filter((ans, i) => ans === journalists[i]?.id).length;
    
    if (hits === 3) unlockAchievement('press_master');
    if (hits === 0) unlockAchievement('press_disaster');
    
    let idolDelta = 0; let ovrDelta = 0; let mediaDelta = 0; let coachDelta = 0; let resultText = ''; let ratingDelta = 0;
    if (hits === 3) { idolDelta = 15; ovrDelta = 1; mediaDelta = 15; coachDelta = 5; resultText = 'Flawless press conference.'; ratingDelta = 0.3; }
    else if (hits === 2) { idolDelta = 5; mediaDelta = 5; resultText = 'Solid, measured press conference.'; ratingDelta = 0.1; }
    else if (hits === 1) { idolDelta = -5; mediaDelta = -5; resultText = 'Mixed reception at the press conference.'; ratingDelta = -0.1; }
    else { idolDelta = -15; ovrDelta = -1; mediaDelta = -15; coachDelta = -10; resultText = 'Complete PR disaster at the press conference.'; ratingDelta = -0.4; }
    
    setSeasonEvents(prevEvents => [...prevEvents, { feedback: resultText, effect: { idol: idolDelta, ovr: ovrDelta, money: 0 } }]);
    setSeasonRecap(r => r ? { ...r, rating: Math.max(0, Math.min(10, (r.rating || 5) + (ratingDelta || 0))) } : r);

    const withOvr = applyOvrDelta(player, ovrDelta);
    const updatedPlayer = { 
      ...withOvr, 
      idolatry: capIdol(withOvr.idolatry + idolDelta), 
      ovr: recomputeOvr(withOvr),
      relationships: {
        ...withOvr.relationships,
        media: Math.min(100, Math.max(0, (withOvr.relationships?.media || 50) + mediaDelta)),
        coach: Math.min(100, Math.max(0, (withOvr.relationships?.coach || 50) + coachDelta))
      }
    };
    
    setPlayer(updatedPlayer);
    
    // Auto-routes correctly AFTER you click "Continue" on the press-result screen
    proceedToNextScreen(activeEvent, minigameContext, updatedPlayer); 
  };

  const triggerMinigame = (context = 'season') => {
    const pool = getMinigamePool(player.pos) || [];
    if (pool.length === 0) return;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    setActiveMinigame(pick.id);
    setMinigameContext(context);
    setMinigameStarted(false); // <--- Add this line!
    setScreen('minigame');
  };

const handleMinigameChoice = (successChance, successMsg, failMsg, reward) => {
    const isWin = Math.random() < successChance;
    const msg = isWin ? successMsg : failMsg;

    if (minigameContext === 'memcup') {
      if (isWin) {
        if (memCup.round === 0) setMemCup({ round: 1, status: 'playing', lastFeedback: `${msg} You won the Semi-Final!` });
        else {
          setMemCup({ round: 1, status: 'won', lastFeedback: `${msg} You won the Memorial Cup!` });
          setPlayer(p => {
              const nextP = { ...p, stats: { ...p.stats, memCupBoost: 50, titles: (p.stats.titles || 0) + 1 } };
              if (nextP.seasonHistory && nextP.seasonHistory.length > 0) {
                  const lastIdx = nextP.seasonHistory.length - 1;
                  const activeYear = nextP.seasonHistory[lastIdx].year || 2026;
                  nextP.seasonHistory[lastIdx] = {
                      ...nextP.seasonHistory[lastIdx],
                      awards: [...(nextP.seasonHistory[lastIdx].awards || []), `${activeYear} Memorial Cup`]
                  };
              }
              return nextP;
          });
          unlockAchievement('mem_cup');
        }
      } else setMemCup({ ...memCup, status: 'lost', lastFeedback: msg });
      setEventFeedback(msg);
      setScreen('event-result');
      return;
    }

    if (minigameContext === 'wjc' || minigameContext === 'olympics') {
      const nat = safeNationalities.find(n => n.id === player.nat);
      const countryName = nat?.sentenceName || nat?.name || 'your country';
      let updatedPlayer = { ...player };
      let resultMsg, resultEffect;

      if (isWin) {
        unlockAchievement('gold_medal');
        const withOvr = applyOvrDelta(player, 1);
        updatedPlayer = { ...withOvr, idolatry: capIdol(withOvr.idolatry + 50), ovr: recomputeOvr(withOvr) };
        resultMsg = `${msg} You secured Gold for ${countryName}!`;
        resultEffect = { idol: 50, ovr: 1 };
      } else {
        updatedPlayer.idolatry = capIdol(updatedPlayer.idolatry - 5);
        resultMsg = `${msg} A devastating loss for ${countryName}.`;
        resultEffect = { idol: -5 };
      }
      setSeasonEvents(prevEvents => [...prevEvents, { feedback: resultMsg, effect: resultEffect }]);
      setPlayer(updatedPlayer);
      // Stay on the International Duty screen and show the outcome inline.
      setIntlResult({ isWin, msg: resultMsg, effect: resultEffect });
      return;
    }

    const payout = reward || { win: { idol: 5 }, loss: { idol: -2 } };
    const outcome = isWin ? (payout.win || {}) : (payout.loss || {});

    const withOvr = applyOvrDelta(player, outcome.ovr || 0);
    const updatedPlayer = {
      ...withOvr,
      idolatry: capIdol(withOvr.idolatry + (outcome.idol || 0)),
      ovr: recomputeOvr(withOvr),
      stats: { ...withOvr.stats, earnings: (withOvr.stats?.earnings || 0) + (outcome.money || 0) },
      relationships: {
        coach: Math.min(100, Math.max(0, (withOvr.relationships?.coach || 50) + (outcome.rel?.coach || 0))),
        teammates: Math.min(100, Math.max(0, (withOvr.relationships?.teammates || 50) + (outcome.rel?.teammates || 0))),
        media: Math.min(100, Math.max(0, (withOvr.relationships?.media || 50) + (outcome.rel?.media || 0)))
      }
    };

    setPlayer(updatedPlayer);
    setSeasonEvents(prevEvents => [...prevEvents, { feedback: msg, effect: { idol: outcome.idol || 0, ovr: outcome.ovr || 0, money: outcome.money || 0 } }]);
    setEventFeedback(msg);
    setScreen('event-result');
  };

  const handleInteractiveResult = (isWin, reward, successMsg, failMsg) => {
    const payout = isWin ? reward.win : reward.loss;
    const msg = isWin ? successMsg : failMsg;

    const withOvr = applyOvrDelta(player, payout.ovr || 0);
    let updatedPlayer = {
      ...withOvr,
      idolatry: capIdol(withOvr.idolatry + (payout.idol || 0)),
      ovr: recomputeOvr(withOvr),
      stats: { ...withOvr.stats, earnings: (withOvr.stats?.earnings || 0) + (payout.money || 0) },
      relationships: {
        coach: Math.min(100, Math.max(0, (withOvr.relationships?.coach || 50) + (payout.rel?.coach || 0))),
        teammates: Math.min(100, Math.max(0, (withOvr.relationships?.teammates || 50) + (payout.rel?.teammates || 0))),
        media: Math.min(100, Math.max(0, (withOvr.relationships?.media || 50) + (payout.rel?.media || 0)))
      }
    };
    
    if (minigameContext === 'memcup') {
        if (isWin && memCup.round === 1) {
            updatedPlayer.idolatry = capIdol(updatedPlayer.idolatry + 50);
            updatedPlayer.stats = { ...updatedPlayer.stats, memCupBoost: 50, titles: (updatedPlayer.stats.titles || 0) + 1 };
            if (updatedPlayer.seasonHistory && updatedPlayer.seasonHistory.length > 0) {
                const lastIdx = updatedPlayer.seasonHistory.length - 1;
                const activeYear = updatedPlayer.seasonHistory[lastIdx].year || 2026;
                updatedPlayer.seasonHistory[lastIdx] = {
                    ...updatedPlayer.seasonHistory[lastIdx],
                    awards: [...(updatedPlayer.seasonHistory[lastIdx].awards || []), `${activeYear} Memorial Cup`]
                };
            }
            unlockAchievement('mem_cup');
        }
        setMemCup(prev => ({ ...prev, status: isWin ? (prev.round === 0 ? 'semi_won' : 'won') : 'lost', lastFeedback: msg }));
    }

    setPlayer(updatedPlayer);
    setSeasonEvents(prevEvents => [...prevEvents, { feedback: msg, effect: { idol: payout.idol || 0, ovr: payout.ovr || 0, money: payout.money || 0 } }]);
    setEventFeedback(msg);
    setScreen('event-result');
  };

  const handleEventChoice = (choice) => {
    let outcomeEffect;
    let outcomeFeedback;

    if (choice.isRisky) {
      const success = Math.random() < (choice.successChance || 0.5);
      outcomeEffect = success ? choice.successEffect : choice.failEffect;
      outcomeFeedback = success ? choice.successFeedback : choice.failFeedback;
      if (success && activeEvent?.title?.includes('RIVALRY NIGHT')) unlockAchievement('rival_slayer');
    } else {
      outcomeEffect = choice.effect;
      outcomeFeedback = choice.feedback;
    }

    if (choice.action === 'FORCE_RETIRE') {
      setScreen('retirement');
      return; 
    }

    // 1. Silently log the event for the Season Recap
    setSeasonEvents(prev => [...prev, { feedback: outcomeFeedback, effect: outcomeEffect || {} }]);
    
    // 2. Safely capture the event data
    const eventToProcess = activeEvent;

    // 3. Process Player Updates synchronously BEFORE updating state
    let updated = { ...player };
    
    if (choice.action === 'VETERAN_EXTENSION') updated.contract = { salary: 850000, years: 1 };
    else if (choice.action === 'BECOME_UFA') updated.rights = null;
    else if (choice.action === 'JOIN_NCAA') {
      updated.team = choice.actionData; updated.league = 'NCAA';
      updated.teamsPlayedFor = Array.from(new Set([...(updated.teamsPlayedFor || []), choice.actionData]));
      if ((choice.perks || []).some(perk => perk.text && perk.text.includes('NIL'))) unlockAchievement('big_nil');
    } else if (choice.action === 'JOIN_CHL') {
      updated.team = choice.actionData; updated.league = 'OHL';
      updated.teamsPlayedFor = Array.from(new Set([...(updated.teamsPlayedFor || []), choice.actionData]));
      unlockAchievement('import_draft');
    } else if (choice.action === 'SIGN_ELC') {
      updated.team = player.rights; updated.league = 'NHL';
      updated.contract = { salary: 925000, years: 3, role: getRole(925000, player) };
    } else if (choice.action === 'DEMOTE') {
      updated.team = choice.actionData.team; updated.league = choice.actionData.lg;
    } else if (choice.action === 'ACCEPT_TRADE_DEADLINE') {
      const { teamObj, teamStandings, madePlayoffs } = choice.actionData;
      updated.team = teamObj.id;
      updated.teamsPlayedFor = Array.from(new Set([...(updated.teamsPlayedFor || []), teamObj.id]));
      if (pendingSeasonResult) setSeasonRecap({ ...pendingSeasonResult.recap, standings: teamStandings, madePlayoffs: madePlayoffs, tradedMidSeason: true });
    } else if (choice.action === 'CHANGE_POSITION') {
      updated.pos = choice.actionData;
    } else if (choice.action === 'ACCEPT_IMPORT_DRAFT') {
      const { teamObj, league } = choice.actionData;
      updated.team = teamObj.id; updated.league = league;
      updated.teamsPlayedFor = Array.from(new Set([...(updated.teamsPlayedFor || []), teamObj.id]));
      updated.chlRights = teamObj.id; updated.chlRightsLeague = league;
    } else if (choice.action === 'DECLINE_IMPORT_DRAFT') {
      const { teamObj, league } = choice.actionData;
      updated.chlRights = teamObj.id; updated.chlRightsLeague = league;
    } else if (choice.action === 'DEMOTE_TO_JUNIORS') {
      const targetJuniorTeam = player.chlRights || player.juniorTeam || 'UNK';
      const targetJuniorLeague = player.chlRightsLeague || player.juniorLeague || 'OHL';
      updated.team = targetJuniorTeam; updated.league = targetJuniorLeague;
      updated.teamsPlayedFor = Array.from(new Set([...(updated.teamsPlayedFor || []), targetJuniorTeam]));
    } else if (choice.action === 'ACCEPT_ARBITRATION') {
      updated.team = choice.actionData.team; updated.league = 'NHL';
      updated.contract = { salary: choice.actionData.salary, years: choice.actionData.years, role: choice.actionData.role };
      updated.teamsPlayedFor = Array.from(new Set([...(updated.teamsPlayedFor || []), choice.actionData.team]));
    }

    const withOvr = applyOvrDelta(updated, outcomeEffect?.ovr || 0);
    const finalPlayer = {
      ...withOvr,
      idolatry: capIdol(withOvr.idolatry + (outcomeEffect?.idol || 0)),
      ovr: recomputeOvr(withOvr),
      stats: { ...withOvr.stats, earnings: (withOvr.stats?.earnings || 0) + (outcomeEffect?.money || 0) },
      relationships: {
        coach: Math.min(100, Math.max(0, (withOvr.relationships?.coach || 50) + (outcomeEffect?.rel?.coach || 0))),
        teammates: Math.min(100, Math.max(0, (withOvr.relationships?.teammates || 50) + (outcomeEffect?.rel?.teammates || 0))),
        media: Math.min(100, Math.max(0, (withOvr.relationships?.media || 50) + (outcomeEffect?.rel?.media || 0)))
      }
    };
    
    // Commit the fully built state
    setPlayer(finalPlayer);

    // 4. Safely nullify the event and route synchronously 
    setActiveEvent(null);

    if (eventToProcess?.isTradeDeadlineEvent) {
       const recapToUse = seasonRecap || pendingSeasonResult?.recap;
       runPostSeasonFlow(finalPlayer.age, finalPlayer.ovr, finalPlayer.league, finalPlayer.team, choice.actionData?.madePlayoffs ?? (recapToUse?.madePlayoffs || false), 2026 + (finalPlayer.stats?.seasonsPlayed || 0), choice.actionData?.teamStandings ?? (recapToUse?.standings || 16));
       return;
    }

    if (eventToProcess?.isPortalEvent) {
       advanceToOffseason();
       return;
    }

    if (eventToProcess?.isOffseasonEvent) {
       const goesToFreeAgency = ['AMATEUR GRADUATION', 'RIGHTS EXPIRED'].includes(eventToProcess.title) && finalPlayer.league !== 'NHL';
       if (goesToFreeAgency) generateOffers(false, finalPlayer.team);
       else { generateTraining(finalPlayer.pos); setScreen('preseason'); }
       return;
    }

    // Standard In-Season Event Routing
    let madePlayoffsFlag = seasonRecap?.madePlayoffs;
    if (eventToProcess && eventToProcess.madePlayoffs !== undefined) {
       madePlayoffsFlag = eventToProcess.madePlayoffs;
    }

    if (pendingPlayoffs && eventToProcess?.madePlayoffs !== false) {
       const pp = pendingPlayoffs;
       setPendingPlayoffs(null);
       checkPlayoffs(pp.lg, pp.team, pp.standings);
    } else if (madePlayoffsFlag) {
       checkPlayoffs(finalPlayer.league, finalPlayer.team, seasonRecap?.standings || 16);
    } else {
       setScreen('recap');
    }
  };

  const advancePlayoffRound = () => {
    setPlayoffs(p => ({
      ...p,
      activeRoundIndex: Math.min((p.bracket?.length || 1) - 1, p.activeRoundIndex + 1)
    }));
  };

  const checkPlayoffs = (currentLg, currentTeamId, standings) => {
    const spots = LEAGUE_CONFIG[currentLg]?.playoffSpots || 16;
    const rounds = getPlayoffRounds(currentLg);
    const totalRounds = rounds.length;
    const conferences = getConferences(currentLg);
    const hasConfs = conferences.length === 2;
    const divs = getDivisions(currentLg);

    const playerTeamObj = getTeamData(currentTeamId, currentLg) || { id: currentTeamId, name: currentTeamId };
    const playerConf = getTeamConference(currentTeamId, currentLg);

    // Build opponent pools. If the league has conferences, split into West / East so the
    // bracket genuinely respects them; otherwise a single shuffled pool feeds every matchup.
    const allOpponents = (getOpponentPool(currentLg) || []).filter(t => t.id !== currentTeamId);
    const shuffled = [...allOpponents].sort(() => 0.5 - Math.random());
    let westPool = [], eastPool = [], singlePool = [];
    if (hasConfs) {
      westPool = shuffled.filter(t => t.conf === 'West');
      eastPool = shuffled.filter(t => t.conf === 'East');
    } else {
      singlePool = shuffled;
    }

    const getDeckForRound = (roundNum) => {
      const gpm = rounds[roundNum - 1]?.gamesPerMatchup || 7;
      const generated = generatePlayoffDeck ? generatePlayoffDeck(standings || 1, spots, roundNum, gpm) : null;
      if (generated && Array.isArray(generated) && generated.length > 0) return generated;
      const size = gpm === 1 ? 1 : gpm + 2;
      return Array(size).fill(null).map(() => ({ isWin: Math.random() > 0.45 }));
    };

    const getDivLabel = (m, totalMatchups) => {
      if (divs.length === 0) return '';
      const matchupsPerDiv = Math.max(1, Math.floor(totalMatchups / divs.length));
      const divIdx = Math.min(divs.length - 1, Math.floor(m / matchupsPerDiv));
      return `${divs[divIdx].toUpperCase()} DIV`;
    };

    // Decide which R1 matchup index the player occupies. West indices come first (0..halfSize-1)
    // so West sits on the LEFT of the bracket per user preference, East on the right.
    const firstRoundMatchups = rounds[0].teams / 2;
    let playerMatchIdx;
    if (hasConfs) {
      const halfSize = Math.floor(firstRoundMatchups / 2);
      if (playerConf === 'West') {
        playerMatchIdx = Math.floor(Math.random() * halfSize);
      } else {
        playerMatchIdx = halfSize + Math.floor(Math.random() * (firstRoundMatchups - halfSize));
      }
    } else {
      playerMatchIdx = Math.floor(Math.random() * firstRoundMatchups);
    }

    const bracket = [];
    for (let r = 0; r < totalRounds; r++) {
      const numMatchups = rounds[r].teams / 2;
      const halfSize = Math.floor(numMatchups / 2);
      const roundMatchups = [];

      for (let m = 0; m < numMatchups; m++) {
        // Assign each matchup a conference tag (used by the bracket render to split L/R).
        // The League Final round crosses conferences, so its matchup carries no conf tag.
        let matchConf = null;
        if (hasConfs && r < totalRounds - 1) {
          matchConf = m < halfSize ? 'West' : 'East';
        }

        if (r === 0) {
          const isPlayer = m === playerMatchIdx;
          const pool = hasConfs ? (matchConf === 'West' ? westPool : eastPool) : singlePool;
          
          // Fallback: If a league has fewer than 16 teams, recycle an opponent so we never get a "TBD" ghost
          const getBackupTeam = () => allOpponents[Math.floor(Math.random() * allOpponents.length)] || { name: 'TBD', id: 'TBD' };
          
          const t1 = isPlayer ? playerTeamObj : (pool.pop() || getBackupTeam());
          const t2 = pool.pop() || getBackupTeam();
          
          roundMatchups.push({
            id: `r${r}-m${m}`,
            team1: t1,
            team2: t2,
            conf: matchConf,
            isPlayerSeries: isPlayer,
            wins1: 0,
            wins2: 0,
            status: 'playing',
            deck: isPlayer ? getDeckForRound(1) : null,
            revealed: [],
            divisionLabel: getDivLabel(m, numMatchups)
          });
        } else {
          roundMatchups.push({
            id: `r${r}-m${m}`,
            team1: { name: 'TBD', id: 'TBD' },
            team2: { name: 'TBD', id: 'TBD' },
            conf: matchConf,
            isPlayerSeries: false,
            wins1: 0,
            wins2: 0,
            status: 'locked',
            deck: null,
            revealed: []
          });
        }
      }
      bracket.push(roundMatchups);
    }

    setPlayoffs({
      bracket,
      activeRoundIndex: 0,
      overallStatus: 'playing',
      currentLg,
      currentTeamId,
      standings,
      spots,
      playerConf,
      hasConfs,
      roundsConfig: rounds
    });
    setScreen('playoffs');
  };

  const handleGridClick = (rIndex, mIndex, cIndex) => {
    if (playoffs.overallStatus !== 'playing' || rIndex !== playoffs.activeRoundIndex) return;

    const currentRound = playoffs.bracket[rIndex];
    if (!currentRound || !currentRound[mIndex]) return;

    const match = currentRound[mIndex];
    if (!match.isPlayerSeries || match.status !== 'playing') return;
    if (match.revealed && match.revealed.includes(cIndex)) return;
    if (!match.deck || !match.deck[cIndex]) return;

    // Wins needed depends on the format: 4 for best-of-7, 3 for best-of-5, 1 for single-elim.
    const winsNeeded = getWinsNeeded(playoffs.currentLg, rIndex);
    const isFrozenFour = getGamesPerMatchup(playoffs.currentLg, rIndex) === 1;

    const card = match.deck[cIndex];
    const isWin = card.isWin || card.win;
    const newWins = isWin ? match.wins1 + 1 : match.wins1;
    const newLosses = !isWin ? match.wins2 + 1 : match.wins2;

    let matchStatus = 'playing';
    let overallStatus = 'playing';

    if (newWins >= winsNeeded) matchStatus = 'won';
    else if (newLosses >= winsNeeded) {
      matchStatus = 'lost';
      overallStatus = 'eliminated';
    }

    const totalRounds = playoffs.bracket.length;

    // Series-specific achievements only make sense for best-of-7.
    if (matchStatus === 'won' && winsNeeded === 4) {
      if (newWins === 4 && newLosses === 0) unlockAchievement('sweep');
      if (newWins === 4 && newLosses === 3) unlockAchievement('game_seven_hero');
    } else if (matchStatus === 'lost' && winsNeeded === 4) {
      if (newLosses === 4 && newWins === 0 && rIndex === 0) unlockAchievement('swept_exit');
    }

    const newMatch = {
      ...match,
      revealed: [...(match.revealed || []), cIndex],
      wins1: newWins,
      wins2: newLosses,
      status: matchStatus
    };

    const newRound = [...currentRound];
    newRound[mIndex] = newMatch;
    let newBracket = [...playoffs.bracket];
    newBracket[rIndex] = newRound;

    let nextActiveIndex = rIndex;
    let playerUpdates = null;

    // Conference title still fires at rIndex === 2 for 4-round leagues; skip if NCAA/short bracket.
    let confTitleWonThisRound = false;
    if (matchStatus === 'won' && rIndex === totalRounds - 2 && playoffs.hasConfs && !isFrozenFour) {
      confTitleWonThisRound = true;
      unlockAchievement('conf_champ');
    }

    if (matchStatus !== 'playing') {
      // Auto-simulate remaining unplayed series in the current round.
      newRound.forEach((m, i) => {
        if (!m.isPlayerSeries && m.status === 'playing') {
          const t1W = Math.random() > 0.5;
          const lw = isFrozenFour ? 0 : Math.floor(Math.random() * winsNeeded);
          newRound[i] = { ...m, status: 'simulated', wins1: t1W ? winsNeeded : lw, wins2: t1W ? lw : winsNeeded };
        }
      });
      newBracket[rIndex] = newRound;

      if (overallStatus === 'eliminated') {
        // Simulate the rest of the bracket after elimination so the recap has a champion.
        for (let r = rIndex; r < totalRounds - 1; r++) {
          const currR = newBracket[r];
          const nextR = [...newBracket[r + 1]];
          const currWN = getWinsNeeded(playoffs.currentLg, r);
          const nextWN = getWinsNeeded(playoffs.currentLg, r + 1);
          const nextIsFF = getGamesPerMatchup(playoffs.currentLg, r + 1) === 1;

          for (let i = 0; i < currR.length; i += 2) {
            const m1 = currR[i];
            const m2 = currR[i + 1];
            const adv1 = m1.wins1 >= currWN ? m1.team1 : m1.team2;
            const adv2 = m2.wins1 >= currWN ? m2.team1 : m2.team2;

            const t1W = Math.random() > 0.5;
            const lw = nextIsFF ? 0 : Math.floor(Math.random() * nextWN);

            if (nextR[Math.floor(i / 2)]) {
              nextR[Math.floor(i / 2)] = {
                ...nextR[Math.floor(i / 2)],
                team1: adv1,
                team2: adv2,
                status: 'simulated',
                wins1: t1W ? nextWN : lw,
                wins2: t1W ? lw : nextWN
              };
            }
          }
          newBracket[r + 1] = nextR;
        }
      } else if (matchStatus === 'won') {
        if (rIndex + 1 < totalRounds) {
          const nextR = [...newBracket[rIndex + 1]];
          const currWN = winsNeeded;
          const nextRoundIdx = rIndex + 1;

          for (let i = 0; i < newRound.length; i += 2) {
            const m1 = newRound[i];
            const m2 = newRound[i + 1];
            const adv1 = m1.wins1 >= currWN ? m1.team1 : m1.team2;
            const adv2 = m2.wins1 >= currWN ? m2.team1 : m2.team2;

            const isPlayerMatch = adv1.id === playoffs.currentTeamId || adv2.id === playoffs.currentTeamId;
            let t1 = adv1;
            let t2 = adv2;
            if (isPlayerMatch && adv2.id === playoffs.currentTeamId) { t1 = adv2; t2 = adv1; }

            const nextGpm = getGamesPerMatchup(playoffs.currentLg, nextRoundIdx);
            const nextDeckSize = nextGpm === 1 ? 1 : nextGpm + 2;
            const nextDeck = isPlayerMatch
              ? (generatePlayoffDeck
                  ? generatePlayoffDeck(playoffs.standings || 1, playoffs.spots, nextRoundIdx + 1, nextGpm)
                  : Array(nextDeckSize).fill(null).map(() => ({ isWin: Math.random() > 0.45 })))
              : null;

            nextR[Math.floor(i / 2)] = {
              ...nextR[Math.floor(i / 2)],
              team1: t1,
              team2: t2,
              isPlayerSeries: isPlayerMatch,
              status: 'playing',
              deck: nextDeck,
              wins1: 0,
              wins2: 0,
              revealed: []
            };
          }
          newBracket[rIndex + 1] = nextR;

          // Keep the current round on screen so the player sees all their reveal cards.
          nextActiveIndex = rIndex;
        } else {
          overallStatus = 'won_cup';
          playerUpdates = p => ({
            ...p,
            idolatry: capIdol(p.idolatry + 30),
            stats: { ...p.stats, titles: (p.stats.titles || 0) + 1 }
          });
          if (player.league === 'NHL') unlockAchievement('stanley_cup');
          if (player.league === 'AHL') unlockAchievement('ahl_champ');
          if (player.league === 'NCAA') unlockAchievement('ncaa_champ');
        }
      }
    }

    setPlayoffs({
      ...playoffs,
      bracket: newBracket,
      activeRoundIndex: nextActiveIndex,
      overallStatus,
      confTitleWon: playoffs.confTitleWon || confTitleWonThisRound
    });
    if (playerUpdates) setPlayer(playerUpdates);
  };

  const proceedFromPlayoffs = () => {
    let totalWins = 0;
    (playoffs.bracket || []).forEach(r => {
       const pm = r.find(m => m.isPlayerSeries);
       if (pm) totalWins += pm.wins1; 
    });

    const finalRound = playoffs.bracket ? playoffs.bracket[playoffs.bracket.length - 1] : null;
    const finalMatch = finalRound ? finalRound[0] : null;
    let champion = null;
    if (finalMatch) {
      const finalWN = getWinsNeeded(playoffs.currentLg, playoffs.bracket.length - 1);
      if (finalMatch.wins1 >= finalWN) champion = finalMatch.team1;
      else if (finalMatch.wins2 >= finalWN) champion = finalMatch.team2;
    }

    const isCupWon = playoffs.overallStatus === 'won_cup';

    setSeasonRecap(r => ({
       ...(r || {}),
       playoffWins: totalWins,
       titleWon: isCupWon ? 1 : 0,
       confTitleWon: playoffs.confTitleWon || false,
       confName: playoffs.playerConf === 'East' ? 'Eastern Conference' : 'Western Conference',
       leagueChampion: champion
    }));
    
    // OVERRIDE: Update the player's seasonHistory log so the club history screen knows they won it!
    if (isCupWon) {
        setPlayer(p => {
            const newHistory = [...(p.seasonHistory || [])];
            if (newHistory.length > 0) {
                newHistory[newHistory.length - 1].titleWon = true;
            }
            return { ...p, seasonHistory: newHistory };
        });
    }
    
    if (isCupWon && ['OHL', 'WHL', 'QMJHL'].includes(player.league)) {
      setMemCup({ round: 0, status: 'playing' });
      setScreen('memorial-cup');
    } else {
      setScreen('recap');
    }
  };

  const handleEndMemCup = () => {
    setSeasonRecap(r => ({ ...r, memCupStatus: memCup.status }));
    setScreen('recap');
  };

  const generateOffers = (isTradeRequest = false, overrideTeam = null) => {

    // The team currently generating an extension/qualifying offer.
    // Falls back to overrideTeam when specified (e.g. a specific team acting).
    let actingTeam = overrideTeam || player.team;
    let actingLeague = player.league;

    const isNHLContract = (player.contract?.salary || 0) >= 500000;

    // If an AHL player is on an NHL contract, the NHL parent club handles their extension/RFA rights
    if (actingLeague === 'AHL' && isNHLContract) {
       const parent = (nhlTeams || []).find(t => t.ahlId === actingTeam);
       if (parent) {
          actingTeam = parent.id;
          actingLeague = 'NHL';
       }
    }

    // Salary multiplier from the Super Agent shop item — read from economy.js
    // so tweaks to the item's effect actually change contract sizes.
    const agentItem = shopItems.find(i => i.id === 'agent');
    const agentModifier = agentItem?.effect?.salaryModifier ?? 1.15;
    const multi = (player.inventory || []).includes('agent') ? agentModifier : 1.0;

    let leagueMinimum = 850000;
    if (currentYear === 2027) leagueMinimum = 900000;
    else if (currentYear >= 2029) leagueMinimum = 1000000;

    let baseSalary = leagueMinimum;
    let maxYears = 2;

   if (actingLeague === 'AHL' || isAmateur) {
      baseSalary = (leagueMinimum + (Math.random() * 150000)) * multi;
      maxYears = 3; 
    } else if (actingLeague === 'NHL') {
      // Look at entire career history for major awards, not just last season
      const careerAwards = player.stats?.awards || [];
      const isSuperstar = player.ovr >= 88 || careerAwards.some(a => ['Hart', 'Vezina', 'Norris', 'Art Ross', 'Rocket'].some(aw => a.includes(aw)));

      if (player.ovr >= 85 || isSuperstar) {
        baseSalary = (7500000 + ((player.ovr - 85) * 1000000)) * multi;
        maxYears = 8; // Franchise max length
      } else if (player.ovr >= 80) {
        baseSalary = (4500000 + ((player.ovr - 80) * 600000)) * multi;
        maxYears = 5;
      } else if (player.ovr >= 75) {
        baseSalary = (2000000 + ((player.ovr - 75) * 500000)) * multi;
        maxYears = 3;
      } else {
        baseSalary = (leagueMinimum + 150000 + ((player.ovr - 70) * 100000)) * multi;
        maxYears = 2;
      }

      // 🏆 MVP CONTRACT OVERRIDE: Superstars get the max length and massive money
      if (isSuperstar) {
         baseSalary = Math.max(baseSalary, 10500000 * multi);
         maxYears = Math.max(maxYears, 8);
      }

      // 🛑 UFA AGE PENALTY: Limit term for aging veterans regardless of how good they are
      if (player.age >= 37) {
         maxYears = Math.min(maxYears, 1);
      } else if (player.age >= 35) {
         maxYears = Math.min(maxYears, 2);
      } else if (player.age >= 32) {
         maxYears = Math.min(maxYears, 4);
      }

      const NHL_MAX_SALARY = 13500000;
      baseSalary = Math.min(NHL_MAX_SALARY, baseSalary);
    }

    baseSalary = Math.max(leagueMinimum, Math.round(baseSalary / 25000) * 25000);
    let offers = [];
    
    const isRFA = actingLeague === 'NHL' && player.age < 27 && (player.stats?.seasonsPlayed || 0) < 7;
    const isAmateurGraduating = ['OHL', 'WHL', 'QMJHL', 'USHL', 'NCAA'].includes(actingLeague);
    
    let teamDidNotExtend = false;
    if (!isTradeRequest && !isAmateurGraduating) {
      if (player.ovr < 65 && Math.random() > 0.60) {
         setEventFeedback(isRFA ? "Your team elected not to extend a Qualifying Offer. You are now an Unrestricted Free Agent." : "Your team elected not to extend your contract. You are now a UFA.");
         teamDidNotExtend = true;
      } else if (!isRFA && Math.random() > 0.70 && player.ovr < 85) {
         // 30% chance for non-superstar UFAs to be let go by their current team
         setEventFeedback("Your current team has decided to move in a different direction and will not offer you an extension. You are heading to the open market.");
         teamDidNotExtend = true;
      } else {
         offers.push({
                   team: actingTeam,
                   league: actingLeague,
                   type: isRFA ? (player.ovr >= 82 ? 'RFA EXTENSION' : 'QUALIFYING OFFER') : 'EXTENSION',
           salary: actingLeague !== 'NHL' ? Math.max(85000, Math.floor(baseSalary * 0.15)) : baseSalary,
           years: isRFA && player.ovr < 82 ? 1 : maxYears,
           role: actingLeague !== 'NHL' ? 'Pro Roster' : getRole(baseSalary, player),
           idolHit: 10,
           state: 'Current Club'
         });
      }
    }

    if (isRFA && !teamDidNotExtend && !isTradeRequest && !isAmateurGraduating) {
      
      if (player.ovr >= 82 && Math.random() < 0.25) {
        const pool = (nhlTeams || []).filter(t => t.id !== actingTeam);
        if (pool.length > 0) {
          const offerSheetTeam = pool[Math.floor(Math.random() * pool.length)].id;
          const osSalary = Math.min(13500000, Math.round((baseSalary * 1.3) / 25000) * 25000);
          offers.push({
            team: offerSheetTeam, league: 'NHL', type: 'OFFER SHEET',
            salary: osSalary, years: 5, role: getRole(osSalary, player),
            idolHit: getTransferImpact(actingTeam, offerSheetTeam), state: 'Offer Sheet'
          });
        }
      }
    } else {
      let offerCount = isTradeRequest ? 2 : (player.ovr >= 75 ? 4 : player.ovr >= 65 ? 3 : 2);
      
      for (let i = 0; i < offerCount; i++) {
        let pool = nhlTeams || [];
        let targetLg = 'NHL';
        
        if (player.ovr < 65) {
            const roll = Math.random();
            pool = roll > 0.5 ? (ahlTeams || []) : (roll > 0.25 ? (shlTeams || []) : (liigaTeams || []));
            targetLg = roll > 0.5 ? 'AHL' : (roll > 0.25 ? 'SHL' : 'LIIGA');
        } else if (player.ovr < 70 && i === offerCount - 1) {
            pool = Math.random() > 0.5 ? (ahlTeams || []) : (shlTeams || []);
            targetLg = pool === ahlTeams ? 'AHL' : 'SHL';
        }

        if (pool.length > 0) {
          const t = pool[Math.floor(Math.random() * pool.length)].id;
          if (t !== actingTeam && !offers.find(o => o.team === t)) {
            let offerSalary = Math.round((baseSalary * (0.85 + (Math.random() * 0.35))) / 25000) * 25000; 
            
            // DYNAMIC TEAM STATES (Money vs. Winning)
            const stateRoll = Math.random();
            let teamState = 'Middle of the Pack';
            if (targetLg === 'NHL') {
                if (stateRoll > 0.66) {
                    teamState = 'Contender';
                    offerSalary = Math.round((offerSalary * 0.85) / 25000) * 25000; // Cup discount
                } else if (stateRoll < 0.33) {
                    teamState = 'Rebuilding';
                    offerSalary = Math.round((offerSalary * 1.20) / 25000) * 25000; // Overpay tax
                }
            }

            if (targetLg !== 'NHL') {
                offerSalary = Math.max(85000, Math.floor(offerSalary * 0.15));
            } else {
                offerSalary = Math.max(leagueMinimum, offerSalary);
            }
            
            const getsNMC = targetLg === 'NHL' && player.age >= 26 && player.ovr >= 85 && Math.random() > 0.4;
            
            offers.push({
              team: t,
              league: targetLg,
              type: isTradeRequest ? 'TRADE' : 'FREE AGENCY',
              salary: offerSalary,
              years: Math.min(7, Math.floor(Math.random() * maxYears) + 1),
              role: targetLg === 'NHL' ? getRole(offerSalary, player) : 'Pro Roster',
              idolHit: getTransferImpact(actingTeam, t),
              state: teamState,
              nmc: getsNMC
            });
          }
        }
      }
    }
    
// Guarantee fallback offers if no teams met criteria
    if (offers.length === 0) {
      offers = [{
        team: (ahlTeams && ahlTeams.length > 0) ? ahlTeams[0].id : 'UNK',
        league: 'AHL',
        type: 'FREE AGENCY',
        salary: 85000,
        years: 1,
        role: 'Pro Roster',
        idolHit: 0,
        state: 'Depth Opportunity'
      }];
    }

    offers.sort((a, b) => b.salary - a.salary);
    setFreeAgencyOffers(offers);
    setScreen('transfer');
  };

  const signContract = (o) => {
    const rivalObj = getPrimaryRival(player.team, player.league);
    if (rivalObj && (rivalObj.id === o.team || rivalObj.name === o.team)) unlockAchievement('betrayal');
    if (player.draftTeam === o.team && player.team !== o.team) unlockAchievement('return_home');
    if (o.type === 'FREE AGENCY' && player.age >= 35) unlockAchievement('vet_contract');

    // ... end of signContract function ...
    setPlayer(p => {
      const newTeams = Array.from(new Set([...(p.teamsPlayedFor || []), o.team]));
      return {
        ...p, team: o.team, league: o.league || 'NHL', idolatry: capIdol(p.idolatry + o.idolHit), teamsPlayedFor: newTeams,
        contract: { salary: o.salary, years: o.years, role: o.role, nmc: o.nmc }
      };
    });
    generateTraining(player.pos);
    setScreen('preseason');
  };

  const handleArbitration = (offer) => {
  // Calculate a fair baseline based purely on current OVR
  let baseline = 1000000;
  if (player.ovr >= 85) baseline = 6500000;
  else if (player.ovr >= 80) baseline = 4000000;
  else if (player.ovr >= 75) baseline = 2250000;
  else baseline = 1100000;

  // Create the arbitration bounds
  const teamOffer = Math.round((baseline * 0.75) / 25000) * 25000;
  const playerAsk = Math.round((baseline * 1.30) / 25000) * 25000;
  const startingRuling = Math.round(baseline / 25000) * 25000;

  setArbState({
    teamOffer,
    playerAsk,
    currentRuling: startingRuling,
    rounds: 3,
    offerData: offer,
    log: ["The arbitrator calls the hearing to order. The team's lawyers glare at you from across the mahogany table. Present your case."]
  });

  setScreen('arbitration_minigame');
};

  const startNegotiation = (offer) => {
    setNegotiation({
      originalOffer: offer,
      currentSalary: offer.salary,
      gmPatience: 100,
      rounds: 0,
      maxRounds: 5,
      history: [],
      status: 'playing',
      msg: "You are at the bargaining table. Push for a higher salary, but don't snap the GM's patience!"
    });
    setScreen('negotiation');
  };

  const handleNegotiatePush = (type) => {
    let damage = 0;
    let bump = 0;
    let label = "";

    if (type === 'safe') {
      damage = Math.floor(Math.random() * 15) + 5; 
      bump = Math.round(negotiation.originalOffer.salary * 0.03 / 25000) * 25000;
      label = "Safe Ask";
    } else if (type === 'hardball') {
      damage = Math.floor(Math.random() * 30) + 15; 
      bump = Math.round(negotiation.originalOffer.salary * 0.08 / 25000) * 25000;
      label = "Hardball";
    } else if (type === 'bluff') {
      const success = Math.random() < 0.40;
      if (success) {
        damage = 5;
        bump = Math.round(negotiation.originalOffer.salary * 0.15 / 25000) * 25000;
        label = "Bold Bluff (Success)";
      } else {
        damage = 45;
        bump = 0;
        label = "Bold Bluff (Failed)";
      }
    }

    const newPatience = negotiation.gmPatience - damage;
    const newRound = negotiation.rounds + 1;

    if (newPatience <= 0) {
       const penalty = Math.round(negotiation.originalOffer.salary * 0.15 / 25000) * 25000;
       setNegotiation(prev => ({
         ...prev, gmPatience: 0, currentSalary: Math.max(850000, prev.currentSalary - penalty),
         status: 'busted', history: [...prev.history, { label, success: false }],
         msg: "❌ The GM slammed the table and slashed the offer!"
       }));
    } else {
       setNegotiation(prev => ({
         ...prev, gmPatience: newPatience, currentSalary: prev.currentSalary + bump, rounds: newRound,
         history: [...prev.history, { label, success: bump > 0 }], status: newRound >= prev.maxRounds ? 'maxed' : 'playing',
         msg: newRound >= prev.maxRounds ? "Final offer reached." : `✅ GM agreed to the ${label}.`
       }));
    }
  };

  const finishNegotiation = (signNow) => {
    const updatedOffer = { ...negotiation.originalOffer, salary: negotiation.currentSalary, negotiated: true };
    if (signNow) {
       signContract(updatedOffer);
    } else {
       // Save the modified offer back to the Free Agency pool
       setFreeAgencyOffers(prev => prev.map(o => (o.team === updatedOffer.team && o.type === updatedOffer.type) ? updatedOffer : o));
       setScreen('transfer');
    }
  };
  
    const buyItem = (item) => {
    if (item.type === 'staff') unlockAchievement('staff_hired');
    if (item.type === 'luxury') unlockAchievement('luxury_buyer');
    if (item.id === 'agent') unlockAchievement('agent_hired');

    setPlayer(p => {
      if ((p.stats?.earnings || 0) < item.cost || (p.inventory || []).includes(item.id)) return p;

      const stats = { ...p.stats, earnings: (p.stats?.earnings || 0) - item.cost };

      if (item.type === 'consumable') {
        return { ...p, stats, buffs: [...(p.buffs || []), item] };
      }

      const next = { ...p, stats, inventory: [...(p.inventory || []), item.id] };
      if (item.effect?.stamina) next.stamina = cap((next.stamina || 50) + item.effect.stamina);
      if (item.effect?.hockeyIQ) next.hockeyIQ = cap((next.hockeyIQ || 50) + item.effect.hockeyIQ);
      if (item.effect?.idolatry) next.idolatry = capIdol(next.idolatry + item.effect.idolatry);
      return next;
    });
  };

  const proceedToNextScreen = (currentEvent, currentMgContext, currentPlayer) => {
    setActiveEvent(null);
    setMinigameContext('season');

    if (currentEvent?.isTradeDeadlineEvent) {
       const recapToUse = seasonRecap || pendingSeasonResult?.recap;
       if (recapToUse) setSeasonRecap(recapToUse);
       runPostSeasonFlow(currentPlayer.age, currentPlayer.ovr, currentPlayer.league, currentPlayer.team, recapToUse?.madePlayoffs || false, 2026 + (currentPlayer.stats?.seasonsPlayed || 0), recapToUse?.standings || 16);
       return;
    }

    if (currentEvent?.isPortalEvent) {
       advanceToOffseason();
       return;
    }

    if (currentEvent?.isOffseasonEvent) {
       const goesToFreeAgency = ['AMATEUR GRADUATION', 'RIGHTS EXPIRED'].includes(currentEvent.title) && currentPlayer.league !== 'NHL';
       if (goesToFreeAgency) generateOffers(false, currentPlayer.team);
       else { generateTraining(currentPlayer.pos); setScreen('preseason'); }
       return;
    }

    if (currentMgContext === 'memcup') {
      setScreen('memorial-cup');
      return;
    }

    if (currentMgContext === 'wjc' || currentMgContext === 'olympics') {
      if (pendingPlayoffs) {
        const pp = pendingPlayoffs;
        setPendingPlayoffs(null);
        checkPlayoffs(pp.lg, pp.team, pp.standings);
      } else if (seasonRecap?.madePlayoffs) {
        checkPlayoffs(currentPlayer.league, currentPlayer.team, seasonRecap.standings);
      } else {
        setScreen('recap');
      }
      return;
    }

    let madePlayoffsFlag = seasonRecap?.madePlayoffs;
    if (currentEvent && currentEvent.madePlayoffs !== undefined) {
       madePlayoffsFlag = currentEvent.madePlayoffs;
    }

    if (pendingPlayoffs && currentEvent?.madePlayoffs !== false) {
      const pp = pendingPlayoffs;
      setPendingPlayoffs(null);
      checkPlayoffs(pp.lg, pp.team, pp.standings);
    } else if (madePlayoffsFlag) {
      const targetLg = currentEvent?.isDemotionEvent ? currentEvent.currentLg : currentPlayer.league;
      const targetTeam = currentEvent?.isDemotionEvent ? currentEvent.currentTeam : currentPlayer.team;
      checkPlayoffs(targetLg, targetTeam, seasonRecap?.standings || 16);
    } else {
      setScreen('recap');
    }
  };

  const tier = getIdolTier(player.idolatry);

  return (
    <div className="min-h-screen p-2 sm:p-6 flex flex-col font-sans bg-[#040505] text-white relative">

      {/* 🏆 REAL-TIME ACHIEVEMENT TOAST POPUP */}
      {achievementToast && (
        <div 
          className="fixed top-12 right-4 sm:top-16 sm:right-6 z-50 max-w-[260px] sm:max-w-xs bg-[#101410] border-2 border-[#F59E0B] p-4 rounded-xl shadow-[0_0_25px_rgba(245,158,11,0.4)] flex items-center gap-4 pointer-events-none"
          style={{ animation: 'toastLifecycle 4s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
        >
          <style>{`
            @keyframes toastLifecycle {
              0% { transform: translateX(120%); opacity: 0; }
              10% { transform: translateX(0); opacity: 1; }
              85% { transform: translateX(0); opacity: 1; }
              100% { transform: translateX(120%); opacity: 0; }
            }
          `}</style>
          <span className="text-3xl sm:text-4xl shrink-0">{achievementToast.icon}</span>
          <div className="text-left">
            <p className="text-[9px] font-bold text-[#F59E0B] uppercase tracking-widest font-sans">ACHIEVEMENT UNLOCKED!</p>
            <h4 className="text-sm sm:text-base font-black text-white sports-font uppercase">{achievementToast.name}</h4>
            <p className="text-[10px] text-slate-300 font-sans">{achievementToast.desc}</p>
          </div>
        </div>
      )}

      {/* SHOP MODAL */}
      {isShopOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md game-panel h-full flex flex-col border border-[#22E748]">
            <div className="flex justify-between items-center p-6 border-b border-[rgba(255,255,255,0.065)] bg-[#101410] rounded-t-xl">
              <h2 className="text-2xl font-bold text-white sports-font tracking-wide">SHOP</h2>
              <div className="text-right">
                <p className="text-[#22E748] font-black text-2xl sports-font">{formatMoney(player.stats?.earnings || 0)}</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {['staff', 'consumable', 'luxury'].map(category => (
                <div key={category} className="mb-6">
                  <h3 className="text-sm font-bold text-slate-400 tracking-widest uppercase mb-3 border-b border-[rgba(255,255,255,0.065)] pb-2 font-sans">
                    {category === 'staff' ? '💪 PERMANENT STAFF' : category === 'consumable' ? '⏳ TEMPORARY BOOSTS' : '💎 LUXURY & FANS'}
                  </h3>
                  <div className="space-y-3">
                    {(shopItems || []).filter(i => i.type === category).map(item => {
                      const isOwned = (player.inventory || []).includes(item.id) || (player.buffs || []).find(b => b.id === item.id);
                      const canAfford = (player.stats?.earnings || 0) >= item.cost;
                      let displayedDesc = player.pos === 'G' && item.descGoalies ? item.descGoalies : item.desc;
                      return (
                        <div key={item.id} className={`p-4 rounded-xl border ${isOwned ? 'border-[#22E748]/50 bg-[#22E748]/10' : 'border-[rgba(255,255,255,0.065)] bg-[#101410]'}`}>
                          <div className="flex justify-between items-start mb-2 gap-4">
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-white text-lg font-sans leading-tight">{item.name}</p>
                              <p className="text-xs text-slate-400 mt-1">{displayedDesc}</p>
                            </div>
                            <p className={`font-black sports-font shrink-0 whitespace-nowrap ${isOwned ? 'text-[#22E748]' : 'text-slate-400'}`}>
                              {isOwned ? '✓ OWNED' : formatMoney(item.cost)}
                            </p>
                          </div>
                          {!isOwned && (
                            <button disabled={!canAfford} onClick={() => buyItem(item)} className="w-full mt-3 bg-[#1a2230] hover:bg-[#232d3f] border border-[rgba(255,255,255,0.065)] text-white disabled:opacity-50 py-2 rounded text-sm font-bold transition-colors cursor-pointer font-sans tracking-wide">
                              BUY
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-[#101410] border-t border-[rgba(255,255,255,0.065)] rounded-b-xl">
              <button onClick={() => setIsShopOpen(false)} className="w-full bg-[#1a2230] hover:bg-[#232d3f] border border-[rgba(255,255,255,0.065)] text-white p-4 rounded-xl font-bold transition-colors cursor-pointer font-sans tracking-wide">CLOSE SHOP</button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN LAYOUT WRAPPER */}
      <div className={`w-full mx-auto pb-10 flex-1 ${screen !== 'creation' && screen !== 'retirement' ? 'max-w-7xl flex flex-col lg:flex-row gap-4 lg:gap-6 items-stretch' : 'max-w-5xl'}`}>
        
        {/* LEFT/TOP COLUMN: DASHBOARD */}
        {screen !== 'creation' && screen !== 'retirement' && (
          <div className="w-full lg:w-[440px] shrink-0 z-40 flex flex-col lg:sticky lg:top-6 lg:self-start">
            <Dashboard
              player={player} tier={tier} statChanges={statChanges} 
              lgKey={lgKey} isJunior={isJunior} isAHL={isAHL} 
              onOpenShop={() => setIsShopOpen(true)} 
              hasDemandedTrade={hasDemandedTrade} 
              setHasDemandedTrade={setHasDemandedTrade} 
            />
          </div>
        )}

        {/* RIGHT/BOTTOM COLUMN: SCREENS */}
        <div className="w-full flex-1 min-w-0 flex flex-col gap-4 mt-2 lg:mt-0">

        {screen === 'creation' && (
          <CreationScreen MASTER_ACHIEVEMENTS={MASTER_ACHIEVEMENTS} handleStart={handleStart} player={player} safeNationalities={safeNationalities} setPlayer={setPlayer} setShowAchievementsMenu={setShowAchievementsMenu} showAchievementsMenu={showAchievementsMenu} unlockedAchievements={unlockedAchievements} />
        )}

        {screen === 'retirement' && (
          <RetirementScreen TeamLogo={TeamLogo} TrophyImage={TrophyImage} formatMoney={formatMoney} getAwardImage={getAwardImage} getAwardPill={getAwardPill} getFullTeamName={getFullTeamName} handleNewGame={handleNewGame} player={player} />
        )}

        {screen === 'press' && (
          <PressScreen PRESS_VIBES={PRESS_VIBES} activePress={activePress} handlePressAnswer={handlePressAnswer} player={player} pressAnswerKeys={pressAnswerKeys} />
        )}

        {screen === 'press-result' && (
          <PressResultScreen PRESS_VIBES={PRESS_VIBES} activePress={activePress} handleEndPress={handleEndPress} />
        )}

{screen === 'combine' && (
          <CombineScreen combineColor={combineColor} combinePhase={combinePhase} combineScore={combineScore} handleCombineReflex={handleCombineReflex} handleDraftDay={handleDraftDay} setCombineClicks={setCombineClicks} setCombinePhase={setCombinePhase} setCombineScore={setCombineScore} />
        )}

        {screen === 'draft' && (
          <DraftScreen TeamLogo={TeamLogo} getFullTeamName={getFullTeamName} handleDraftChoice={handleDraftChoice} player={player} seasonRecap={seasonRecap} />
        )}

        {screen === 'preseason' && (
          <PreseasonScreen activeTrainings={activeTrainings} currentYear={currentYear} handleTrain={handleTrain} player={player} />
        )}

        {screen === 'arbitration_minigame' && (
          <ArbitrationScreen arbState={arbState} formatMoney={formatMoney} getRole={getRole} player={player} setActiveEvent={setActiveEvent} setArbState={setArbState} setScreen={setScreen} />
        )}

        {screen === 'trade-deadline' && (
          <TradeDeadlineScreen LEAGUE_CONFIG={LEAGUE_CONFIG} advanceToOffseason={advanceToOffseason} getFullTeamName={getFullTeamName} getOpponentPool={getOpponentPool} hasDemandedTrade={hasDemandedTrade} pendingSeasonResult={pendingSeasonResult} player={player} runPostSeasonFlow={runPostSeasonFlow} setActiveEvent={setActiveEvent} setHasDemandedTrade={setHasDemandedTrade} setScreen={setScreen} setSeasonRecap={setSeasonRecap} unlockAchievement={unlockAchievement} />
        )}

        {screen === 'intl-minigame' && (
          <IntlMinigameScreen activeEvent={activeEvent} handleMinigameChoice={handleMinigameChoice} intlResult={intlResult} minigameContext={minigameContext} player={player} proceedToNextScreen={proceedToNextScreen} safeNationalities={safeNationalities} setIntlResult={setIntlResult} />
        )}

       {screen === 'recap' && (
          <RecapScreen LEAGUE_CONFIG={LEAGUE_CONFIG} advanceToOffseason={advanceToOffseason} capIdol={capIdol} formatMoney={formatMoney} getFullTeamName={getFullTeamName} getOpponentPool={getOpponentPool} getPlayoffTitles={getPlayoffTitles} getPrimaryRival={getPrimaryRival} isJunior={isJunior} ncaaTeams={ncaaTeams} player={player} seasonEvents={seasonEvents} seasonRecap={seasonRecap} setActiveEvent={setActiveEvent} setPlayer={setPlayer} setScreen={setScreen} unlockAchievement={unlockAchievement} />
        )}

        {screen === 'event' && (
          <EventScreen activeEvent={activeEvent} handleEventChoice={handleEventChoice} />
        )}

        {screen === 'minigame' && (
          <MinigameScreen ACCENT={ACCENT} BreakawayGame={BreakawayGame} CreaseGame={CreaseGame} DeflectionGame={DeflectionGame} FaceoffGame={FaceoffGame} FilmRoomGame={FilmRoomGame} OneTimerGame={OneTimerGame} ShootoutGame={ShootoutGame} ShotBlockGame={ShotBlockGame} activeMinigame={activeMinigame} findMinigame={findMinigame} handleInteractiveResult={handleInteractiveResult} minigameStarted={minigameStarted} player={player} setMinigameStarted={setMinigameStarted} />
        )}
        {screen === 'event-result' && (
          <EventResultScreen activeEvent={activeEvent} eventFeedback={eventFeedback} minigameContext={minigameContext} player={player} proceedToNextScreen={proceedToNextScreen} />
        )}
        {screen === 'playoffs' && (
          <PlayoffsScreen TeamLogo={TeamLogo} TrophyImage={TrophyImage} advancePlayoffRound={advancePlayoffRound} getFullTeamName={getFullTeamName} getGamesPerMatchup={getGamesPerMatchup} getPlayoffRounds={getPlayoffRounds} getPlayoffTitles={getPlayoffTitles} getWinsNeeded={getWinsNeeded} handleGridClick={handleGridClick} player={player} playoffs={playoffs} proceedFromPlayoffs={proceedFromPlayoffs} setEventFeedback={setEventFeedback} setPlayer={setPlayer} setPlayoffs={setPlayoffs} setScreen={setScreen} />
        )}

        {screen === 'memorial-cup' && (
          <MemorialCupScreen getFullTeamName={getFullTeamName} handleEndMemCup={handleEndMemCup} memCup={memCup} ohlTeams={ohlTeams} player={player} qmjhlTeams={qmjhlTeams} setMemCup={setMemCup} triggerMinigame={triggerMinigame} whlTeams={whlTeams} />
        )}

        {screen === 'transfer' && (
          <TransferScreen TeamLogo={TeamLogo} freeAgencyOffers={freeAgencyOffers} getFullTeamName={getFullTeamName} getPrimaryRival={getPrimaryRival} handleArbitration={handleArbitration} player={player} signContract={signContract} startNegotiation={startNegotiation} />
        )}
        
        {screen === 'negotiation' && (
          <NegotiationScreen finishNegotiation={finishNegotiation} formatMoney={formatMoney} handleNegotiatePush={handleNegotiatePush} negotiation={negotiation} />
        )}

        </div>
      </div> 
      {/* GLOBAL FOOTER */}
        <div className="mt-1 text-center border-t border-[rgba(255,255,255,0.05)] pt-4">
           <a
             href="https://x.com/ferreirahockey" 
             className="text-[10px] sm:text-xs font-bold text-slate-500 hover:text-[#3b82f6] uppercase tracking-widest font-sans transition-colors"
           >
             HAVE FEEDBACK? REACH OUT TO ME!
           </a>
        </div>
    </div>
  );
}

export default App;