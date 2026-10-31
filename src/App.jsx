import  { useState, useEffect, useCallback, useRef } from 'react';

import {
  nhlTeams, ohlTeams, whlTeams, qmjhlTeams, ushlTeams, shlTeams, liigaTeams, ncaaTeams, echlTeams,
  nationalities, juniorLeagues, euroLeagues, getPrimaryRival, getPlayoffRounds
} from './data/teams';
import { shopItems, skaterTrainingPool, goalieTrainingPool } from './data/economy';
import { getMinigamePool } from './data/minigames';
import {
  cap, capFanStatus, formatMoney, getFanTier, applyOvrDelta, recomputeOvr
} from './utils/gameHelpers';
import { withOfferPerks } from './data/offerPerks';
import { projectDraftPick } from './utils/draftScouting';
import { getStakes, applyStakesToReward } from './utils/stakes';
import { resolveIntlGame } from './handlers/resolveIntlGame';
import {
  makeInitialPlayer, getRole, getWinsNeeded,
  MASTER_ACHIEVEMENTS, getJournalistsForLeague, getFullTeamName, getTrainingQuality
} from './utils/appHelpers';

import PressScreen from './screens/PressScreen';
import PressResultScreen from './screens/PressResultScreen';
import CombineScreen from './screens/CombineScreen';
import DraftScreen from './screens/DraftScreen';
import PreseasonScreen from './screens/PreseasonScreen';
import EventScreen from './screens/EventScreen';
import MinigameScreen from './screens/MinigameScreen';
import MemorialCupScreen from './screens/MemorialCupScreen';
import NegotiationScreen from './screens/NegotiationScreen';
import AllStarScreen from './screens/AllStarScreen';
import TeamLogo from './components/TeamLogo';
import Dashboard from './components/Dashboard';
import ShootoutGame from './components/ShootoutGame';
import FaceoffGame from './components/FaceoffGame';
import CreaseGame from './components/CreaseGame';
import FilmRoomGame from './components/FilmRoomGame';
import DeflectionGame from './components/DeflectionGame';
import ShotBlockGame from './components/ShotBlockGame';
import BreakawayGame from './components/BreakawayGame';
import OneTimerGame from './components/OneTimerGame';
import ZoneBattleGame from './components/ZoneBattleGame';
import BreakoutGame from './components/BreakoutGame';
import ScreenedShotGame from './components/ScreenedShotGame';
import { AppContext } from './AppContext';
import CreationScreen from './screens/CreationScreen';
import RetirementScreen from './screens/RetirementScreen';
import ArbitrationScreen from './screens/ArbitrationScreen';
import TradeDeadlineScreen from './screens/TradeDeadlineScreen';
import IntlMinigameScreen from './screens/IntlMinigameScreen';
import RecapScreen from './screens/RecapScreen';
import PlayoffsScreen from './screens/PlayoffsScreen';
import TransferScreen from './screens/TransferScreen';
import ErrorBoundary from './components/ErrorBoundary';

import { advanceToOffseason as _advanceToOffseason } from './handlers/advanceToOffseason';
import { handleTrain as _handleTrain } from './handlers/handleTrain';
import { runPostSeasonFlow as _runPostSeasonFlow } from './handlers/runPostSeasonFlow';
import { handleGridClick as _handleGridClick } from './handlers/handleGridClick';
import { generateOffers as _generateOffers } from './handlers/generateOffers';
import { handleEventChoice as _handleEventChoice } from './handlers/handleEventChoice';
import { checkPlayoffs as _checkPlayoffs } from './handlers/checkPlayoffs';

function App() {
  const [screen, setScreen] = useState('creation');

  const [unlockedAchievements, setUnlockedAchievements] = useState(() => {
    try { return JSON.parse(localStorage.getItem('hockey_career_achievements')) || []; } 
    catch { return []; }
  });

  const [achievementToast, setAchievementToast] = useState(null);
  const [showAchievementsMenu, setShowAchievementsMenu] = useState(false);

  const unlockAchievement = useCallback((id) => {
    setTimeout(() => {
      setUnlockedAchievements(prev => {
        if (prev.includes(id)) return prev;
        const updated = [...prev, id];
        try { 
          localStorage.setItem('hockey_career_achievements', JSON.stringify(updated)); 
        } catch (error) {
          console.error("Failed to save achievements", error);
        }
        const masterObj = MASTER_ACHIEVEMENTS.find(a => a.id === id);
        if (masterObj) {
          setAchievementToast(masterObj);
          setTimeout(() => setAchievementToast(null), 4000);
        }
        return updated;
      });
    }, 0);
  }, []);

  useEffect(() => {
    if (unlockedAchievements.length >= 40) setTimeout(() => unlockAchievement('the_idol'), 0);
  }, [unlockedAchievements, unlockAchievement]);

  const [isShopOpen, setIsShopOpen] = useState(false);
  const [negotiation, setNegotiation] = useState(null);
  const [activeTrainings, setActiveTrainings] = useState([]);
  const [activeEvent, setActiveEvent] = useState(null);
  const [activeMinigame, setActiveMinigame] = useState(null);
  const [minigameStarted, setMinigameStarted] = useState(false);
  const [activePress, setActivePress] = useState({ journalists: [], questions: [], currentQ: 0, answers: [] });
  const [minigameContext, setMinigameContext] = useState('season');
  const [seasonEvents, setSeasonEvents] = useState([]);
  const [intlResult, setIntlResult] = useState(null);
  const [eventFeedback, setEventFeedback] = useState('');
  const [statChanges, setStatChanges] = useState(null);
  const [seasonRecap, setSeasonRecap] = useState(null);
  const [freeAgencyOffers, setFreeAgencyOffers] = useState([]);
  const [hasDemandedTrade, setHasDemandedTrade] = useState(false);
  const [playoffs, setPlayoffs] = useState({ bracket: [], activeRoundIndex: 0, overallStatus: 'playing' });
  const [memCup, setMemCup] = useState({ round: 0, status: 'playing' });
  const [pendingPlayoffs, setPendingPlayoffs] = useState(null);
  const [pendingSeasonResult, setPendingSeasonResult] = useState(null);
  const [arbState, setArbState] = useState(null);

  const [combinePhase, setCombinePhase] = useState(1);
  const [combineScore, setCombineScore] = useState(0);
  const [combineColor, setCombineColor] = useState('red');
  const combineTimeRef = useRef(0);
  const minigameLockedRef = useRef(false);

  useEffect(() => {
     if (screen === 'combine' && combinePhase === 1) {
       const timer = setTimeout(() => {
         setCombineColor('green');
         combineTimeRef.current = Date.now();
       }, 1500 + Math.random() * 3000);
       return () => clearTimeout(timer);
     }
  }, [screen, combinePhase]);

  const handleCombineReflex = () => {
     if (combineColor === 'red') {
         setCombineScore(-2); 
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

  useEffect(() => {
    if (player.fanStatus >= 1000) unlockAchievement('franchise_legend');
    if (player.fanStatus >= 400)  unlockAchievement('local_hero');
  }, [player.fanStatus, unlockAchievement]);

  useEffect(() => {
    const e = player.stats?.earnings || 0;
    if (e >= 100000000) unlockAchievement('hundred_mil');
    if (e >= 50000000)  unlockAchievement('fifty_mil');
  }, [player.stats?.earnings, unlockAchievement]);

  useEffect(() => {
    const hist = player.seasonHistory || [];
    const seasonsPlayed = player.stats?.seasonsPlayed || 0;
    if (player.ovr >= 75 && !player.draftTeam && !player.rights && seasonsPlayed >= 1) unlockAchievement('undrafted_star');
    if (seasonsPlayed >= 15) unlockAchievement('iron_man');

    const teamCounts = {};
    hist.forEach(s => { if (s.team) teamCounts[s.team] = (teamCounts[s.team] || 0) + 1; });
    if (Object.values(teamCounts).some(c => c >= 10)) unlockAchievement('one_club_man');

    let currentStreak = 0, streakTeam = null;
    for (let i = 0; i < hist.length; i++) {
      if (hist[i]?.titleWon && hist[i]?.league === 'NHL') {
        if (streakTeam === hist[i].team) {
           currentStreak++;
           if (currentStreak >= 3) { unlockAchievement('back_to_back'); break; } 
        } else { currentStreak = 1; streakTeam = hist[i].team; }
      } else { currentStreak = 0; streakTeam = null; }
    }
  }, [player.draftTeam, player.ovr, player.rights, player.seasonHistory, player.stats?.seasonsPlayed, unlockAchievement]);

  useEffect(() => {
    if (screen !== 'retirement') return;
    const titles = player.stats?.titles || 0;
    const trophyCount = (player.stats?.awards || []).length;
    if (titles >= 3 && trophyCount >= 5) unlockAchievement('hall_of_fame');
    if (player.age > 38 && player.league === 'NHL') unlockAchievement('veteran_retirement');
  }, [player.age, player.league, player.stats?.awards, player.stats?.titles, screen, unlockAchievement]);

  useEffect(() => {
    if (screen === 'playoffs') document.title = "Blue Chip Prospect | Playoffs";
    else if (screen === 'transfer') document.title = "Blue Chip Prospect | Free Agency";
    else document.title = "Blue Chip Prospect";
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

  const [pressAnswerKeys, setPressAnswerKeys] = useState([]);

  useEffect(() => {
    const q = activePress.questions[activePress.currentQ];
    if (!q) { setTimeout(() => setPressAnswerKeys([]), 0); return; }
    const keys = ['professional', 'passionate', 'humble', 'cocky'].filter(k => q.answers[k]);
    setTimeout(() => setPressAnswerKeys(keys.sort(() => 0.5 - Math.random())), 0);
  }, [activePress.currentQ, activePress.questions]);
  
  const generateTraining = useCallback((pos, contextPlayer = null) => {
    const activePool = pos === 'G' ? goalieTrainingPool || [] : skaterTrainingPool || [];
    const commons = activePool.filter(t => t.rarity === 'Common');
    const rares = activePool.filter(t => t.rarity === 'Rare');
    const epics = activePool.filter(t => t.rarity === 'Epic');

    const quality = getTrainingQuality(contextPlayer);
    // The original flat odds (5% Epic, 15% Rare per draw) are the floor, not the
    // average, so a junior is never worse off than before. The slope on top is
    // deliberately shallow: the point is that an NHL star notices the difference,
    // not that he lives on Epics.
    const epicCut = 0.965 - (0.02 * quality);
    const rareCut = 0.818 - (0.05 * quality);

    const drawByRarity = () => {
      const roll = Math.random();
      let pool = commons;
      if (roll > epicCut && epics.length) pool = epics;
      else if (roll > rareCut && rares.length) pool = rares;
      if (!pool.length) pool = activePool;
      return pool[Math.floor(Math.random() * pool.length)];
    };

    // Built inside the setter so the hand that was on screen last season is known
    // without extra state. A third of every hand used to carry over year to year.
    setActiveTrainings(previousHand => {
      const previousIds = (previousHand || []).map(c => c.id);
      const hand = [];
      let tries = 0;

      const tryPush = (card, avoidPrevious) => {
        if (!card) return false;
        if (hand.find(c => c.id === card.id)) return false;
        if (avoidPrevious && previousIds.includes(card.id)) return false;
        const statKeys = Object.keys(card.effect || {}).filter(k => k !== 'stamina' && k !== 'fanStatus');
        const mainStat = statKeys.length > 0 ? statKeys[0] : null;
        const alreadyHasStat = mainStat ? hand.some(c => Object.keys(c.effect || {}).includes(mainStat)) : false;
        if (alreadyHasStat) return false;
        hand.push(card);
        return true;
      };

      while (hand.length < 3 && tries < 60) {
        tries++;
        if (!commons.length && !rares.length && !epics.length) break;
        tryPush(drawByRarity(), true);
      }

      // Allow last season's cards back in rather than ever handing out fewer
      // than three options. This still rolls rarity: drawing flat from the pool
      // here was handing out a Rare a third of the time, which is what pushed
      // the real Epic and Rare rates well above the intended odds.
      let relaxed = 0;
      while (hand.length < 3 && relaxed < 60) {
        relaxed++;
        tryPush(drawByRarity(), false);
      }
      while (hand.length < 3) {
        const fallbackCard = commons[Math.floor(Math.random() * commons.length)];
        if (!hand.find(c => c.id === fallbackCard.id)) hand.push(fallbackCard);
      }
      return hand;
    });
  }, []);

  const handleStart = useCallback(() => {
    let lg = player.startLeague;
    let currentNat = player.nat;

    if (!lg || lg === 'RANDOM' || lg === 'ANY') {
       const possibleLeagues = ['OHL', 'WHL', 'QMJHL', 'USHL', 'SHL', 'LIIGA'];
       lg = possibleLeagues[Math.floor(Math.random() * possibleLeagues.length)];
    }

    let pool = lg === 'WHL' ? whlTeams : lg === 'QMJHL' ? qmjhlTeams : lg === 'USHL' ? ushlTeams : lg === 'SHL' ? shlTeams : lg === 'LIIGA' ? liigaTeams : ohlTeams;
    pool = pool || [];
    
    // RULE: You must be American to play for the US National Team Development Program
    if (lg === 'USHL' && currentNat !== 'USA') {
        pool = pool.filter(t => t.id !== 'NTDP');
    }

    const startTeam = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : { id: 'UNK' };

    const isGen = Math.random() <= 0.02; 
    let bSht = 55, bSkt = 55, bPhy = 55, bIq = 55, bSta = 55;
    
    if (isGen) { bSht += 15; bSkt += 15; bPhy += 10; bIq += 20; bSta += 12; }
    if (player.pos === 'C') { bIq += 10; bSkt += 5; bSht -= 5; bPhy -= 5; bSta -= 5; }
    if (['LW', 'RW'].includes(player.pos)) { bSht += 10; bSkt += 5; bPhy -= 5; bIq -= 5; bSta -= 5; }
    if (['LD', 'RD'].includes(player.pos)) { bPhy += 10; bSta += 5; bIq += 5; bSkt -= 5; bSht -= 15; }
    if (player.pos === 'G') { bSht += 5; bSkt += 5; bPhy += 0; bIq -= 10; bSta -= 20; }

    const validReporters = getJournalistsForLeague(lg);
    const randomReporter = validReporters[Math.floor(Math.random() * validReporters.length)];

    let arch = '';
    if (player.pos === 'G') arch = (bSkt > bPhy && bSkt > bSht) ? 'Butterfly' : (bSht > bSkt && bSht > bPhy) ? 'Reflex' : 'Hybrid';
    else if (['LD', 'RD'].includes(player.pos)) arch = (bPhy > bSkt && bPhy > bSht) ? 'Shutdown' : (bSkt > bPhy && bSkt > bSht) ? 'Puck-Mover' : 'Two-Way';
    else arch = (bSht > bSkt && bSht > bIq) ? 'Sniper' : (bIq > bSht && bIq > bPhy) ? 'Playmaker' : (bPhy > bSht && bPhy > bSkt) ? 'Power Forward' : 'Two-Way';

    setPlayer(p => {
      const updated = {
        ...p, team: startTeam.id, league: lg, nat: currentNat, startLeague: lg, teamsPlayedFor: [startTeam.id],
        shooting: bSht, skating: bSkt, physicality: bPhy, hockeyIQ: bIq, stamina: bSta,
        isGenerational: isGen, archetype: arch, storylines: { ...p.storylines, mediaNemesis: isGen ? 1 : 0 },
        nemesisName: isGen ? `${randomReporter.name} (${randomReporter.outlet})` : null
      };
      return { ...updated, ovr: recomputeOvr(updated) };
    });
    
    generateTraining(player.pos, player);
    setSeasonEvents([]);

    if (isGen) {
       setActiveEvent({
         title: '🌟 THE CHOSEN ONE',
         desc: `The hockey world has never seen a prospect quite like you. At just 16 years old, scouts are already calling you the greatest generational talent since Crosby, McDavid, or Bedard. The pressure is on.`,
         choices: [{ label: 'Embrace the Expectations', isRisky: false, feedback: 'You are ready to change a franchise forever. Let the hype begin.', effect: { fanStatus: 200, ovr: 0, money: 50000 }, action: 'GEN_REVEAL' }],
         // Not an offseason beat. This fires at creation, before a single game has
         // been played, and tagging it as one dropped a sixteen-year-old into a
         // training camp roster battle before he had picked his first training card.
         isIntroEvent: true
       });
       setScreen('event');
    } else setScreen('preseason');
  }, [generateTraining, player]);

  // rawCombine is the combine's own -4..+8 score, not a bucketed OVR nudge.
  // overridePlayer is for the over-ager path, which applies an age penalty and
  // then drafts in the same tick, before setPlayer has landed.
  const handleDraftDay = (rawCombine = 0, overridePlayer = null) => {
    const who = overridePlayer || player;
    const { pick: overallPick, round } = projectDraftPick(who, rawCombine);

    // Going early is a bigger story than going late.
    const fanBoost = overallPick === 1 ? 25 : overallPick <= 10 ? 20 : overallPick <= 32 ? 15 : overallPick <= 96 ? 8 : 5;

    const pool = nhlTeams || [];
    const draftedBy = pool[Math.floor(Math.random() * pool.length)];

    setPlayer(p => ({
      ...p,
      rights: draftedBy?.id,
      draftTeam: draftedBy?.id || null,
      draftLeague: p.league,
      draftPick: overallPick,
      draftRound: round,
      fanStatus: capFanStatus((p.fanStatus || 0) + fanBoost)
    }));

    if (overallPick === 1) unlockAchievement('first_overall');
    if (overallPick <= 32) unlockAchievement('first_round_pick');
    if (who.league === 'NCAA') unlockAchievement('ncaa_champ');

    setSeasonRecap(r => ({ ...r, draftPick: overallPick, draftRound: round, draftedBy: draftedBy, juniorTeam: who.team, juniorLeague: who.league }));
    setScreen('draft');
  };

  const handleDraftChoice = useCallback((choice) => {
     const draftedBy = seasonRecap?.draftedBy;
     const actionName = typeof choice === 'string' ? choice : (choice?.action || String(choice));

     if (actionName === 'ELC' && draftedBy) {
       setPlayer(p => ({ ...p, team: draftedBy.id, league: 'NHL', teamsPlayedFor: Array.from(new Set([...(p.teamsPlayedFor || []), draftedBy.id])), contract: { salary: 925000, years: 3, role: getRole(925000, p) } }));
       setEventFeedback("You signed your ELC and are heading to your first NHL training camp.");
     } else if (actionName === 'EXPLORE_OPTIONS' || actionName === 'EXPLORE' || actionName === 'DECLINE') {
       let offers = [];
       let ncaaPool = ncaaTeams ? [...ncaaTeams].sort(() => 0.5 - Math.random()) : [];
       const numNcaa = Math.floor(Math.random() * 2) + 2; 
       for (let i = 0; i < numNcaa; i++) {
           if(ncaaPool[i]) offers.push({ team: ncaaPool[i].id, league: 'NCAA', type: 'SCHOLARSHIP', salary: Math.floor(Math.random() * 50000) + 25000, years: 4, role: 'Top Prospect', fanHit: 15, state: 'College Program', nmc: false });
       }
       let euroPool = [...(shlTeams||[]), ...(liigaTeams||[])].sort(() => 0.5 - Math.random());
       const numEuro = Math.floor(Math.random() * 2) + 1;
       for (let i = 0; i < numEuro; i++) {
           if(euroPool[i]) {
               const lg = (shlTeams||[]).find(t => t.id === euroPool[i].id) ? 'SHL' : 'LIIGA';
               offers.push({ team: euroPool[i].id, league: lg, type: 'PRO CONTRACT', salary: Math.floor(Math.random() * 40000) + 40000, years: 1, role: 'Pro Roster', fanHit: 5, state: 'European Pro', nmc: false });
           }
       }
       // This is a real fork in a career, so the programmes and clubs on offer
       // need something to tell them apart besides the cheque. A college offer
       // here is weighted toward perks, because being recruited means being
       // wanted.
       setFreeAgencyOffers(
         offers
           .map(o => withOfferPerks(o, o.league === 'NCAA' ? { minPerks: 1, maxPerks: 3, maxFlaws: 2 } : { maxPerks: 2, maxFlaws: 2 }))
           .sort((a, b) => b.salary - a.salary)
       );
       setScreen('transfer');
       return;
     } else {
       setEventFeedback(`You decided to return to ${player.league} for another year of development.`);
     }
     
     generateTraining(player.pos, player);
     setScreen('preseason');
  }, [generateTraining, player, seasonRecap?.draftedBy]);

  const handlePressAnswer = (vibeId) => {
    const newAnswers = [...activePress.answers, vibeId];
    if (newAnswers.length === 3) {
      setActivePress({ ...activePress, answers: newAnswers });
      setScreen('press-result');
    } else {
      setActivePress({ ...activePress, answers: newAnswers, currentQ: activePress.currentQ + 1 });
    }
  };

  const handleEndPress = () => {
    const journalists = activePress.journalists || [];
    const hits = activePress.answers.filter((ans, i) => ans === journalists[i]?.id).length;
    
    if (hits === 3) unlockAchievement('press_master');
    if (hits === 0) unlockAchievement('press_disaster');
    
    let fanDelta, mediaDelta, resultText, ratingDelta, ovrDelta = 0, coachDelta = 0;
    if (hits === 3) { fanDelta = 15; ovrDelta = 1; mediaDelta = 15; coachDelta = 5; resultText = 'Flawless press conference.'; ratingDelta = 0.3; }
    else if (hits === 2) { fanDelta = 5; mediaDelta = 5; resultText = 'Solid, measured press conference.'; ratingDelta = 0.1; }
    else if (hits === 1) { fanDelta = -5; mediaDelta = -5; resultText = 'Mixed reception at the press conference.'; ratingDelta = -0.1; }
    else { fanDelta = -15; ovrDelta = -1; mediaDelta = -15; coachDelta = -10; resultText = 'Complete PR disaster at the press conference.'; ratingDelta = -0.4; }
    
    setSeasonEvents(prevEvents => [...prevEvents, { feedback: resultText, effect: { fanStatus: fanDelta, ovr: ovrDelta, money: 0 } }]);
    setSeasonRecap(r => r ? { ...r, rating: Math.max(0, Math.min(10, (r.rating || 5) + (ratingDelta || 0))) } : r);

    const withOvr = applyOvrDelta(player, ovrDelta);
    const updatedPlayer = { 
      ...withOvr, fanStatus: capFanStatus(withOvr.fanStatus + fanDelta), ovr: recomputeOvr(withOvr),
      relationships: {
        ...withOvr.relationships,
        media: Math.min(100, Math.max(0, (withOvr.relationships?.media || 50) + mediaDelta)),
        coach: Math.min(100, Math.max(0, (withOvr.relationships?.coach || 50) + coachDelta))
      }
    };
    
    setPlayer(updatedPlayer);
    proceedToNextScreen(activeEvent, minigameContext, updatedPlayer); 
  };

  const resetMinigameLock = () => { minigameLockedRef.current = false; };

  const triggerMinigame = (context = 'season', explicitId = null) => {
    minigameLockedRef.current = false;
    const pool = getMinigamePool(player.pos) || [];
    
    if (explicitId) {
        const isValidForPos = pool.some(m => m.id === explicitId);
        if (isValidForPos) {
            setActiveMinigame(explicitId);
        } else {
            // eslint-disable-next-line react-hooks/purity
            const pick = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : null;
            if (pick) setActiveMinigame(pick.id);
            else {
                setTimeout(() => proceedToNextScreen(null, context, player), 0);
                return;
            }
        }
    } else {
        if (pool.length === 0) {
            setTimeout(() => proceedToNextScreen(null, context, player), 0);
            return;
        }
        // eslint-disable-next-line react-hooks/purity
        const pick = pool[Math.floor(Math.random() * pool.length)];
        setActiveMinigame(pick.id);
    }
    setMinigameContext(context);
    setMinigameStarted(false);
    setScreen('minigame');
  };

  const handleMinigameChoice = (successChance, successMsg, failMsg, reward) => {
    if (minigameLockedRef.current) return;
    minigameLockedRef.current = true;
    
    // eslint-disable-next-line react-hooks/purity
    const isPlayerSuccess = Math.random() < successChance;
    const isRisky = reward?.isRisky !== false; 
    
    let isWin; 
    let msg = isPlayerSuccess ? successMsg : failMsg;

    if (isRisky) {
        isWin = isPlayerSuccess;
    } else {
        const baseOdds = reward?.baseTeamChance || 0.50;
        // eslint-disable-next-line react-hooks/purity
        isWin = Math.random() < (baseOdds + (isPlayerSuccess ? 0.15 : -0.15));
        
        if (isPlayerSuccess && !isWin) {
            msg = successMsg + " But despite your solid effort, the team still fell short.";
        } else if (!isPlayerSuccess && isWin) {
            msg = failMsg + " Fortunately, your teammates bailed you out for the win!";
        }
    }

    if (minigameContext === 'memcup') {
      if (isWin) {
        setMemCup(prev => ({ ...prev, status: prev.round === 0 ? 'semi_won' : 'won', lastFeedback: msg }));
        if (memCup.round === 1) {
          setPlayer(p => {
              const nextP = { ...p, stats: { ...p.stats, memCupBoost: 50, titles: (p.stats.titles || 0) + 1 } };
              if (nextP.seasonHistory && nextP.seasonHistory.length > 0) {
                  const lastIdx = nextP.seasonHistory.length - 1;
                  const activeYear = nextP.seasonHistory[lastIdx].year || 2026;
                  nextP.seasonHistory[lastIdx] = { ...nextP.seasonHistory[lastIdx], awards: [...(nextP.seasonHistory[lastIdx].awards || []), `${activeYear} Memorial Cup`] };
              }
              return nextP;
          });
          unlockAchievement('mem_cup');
        }
      } else {
        setMemCup(prev => ({ ...prev, status: 'lost', lastFeedback: msg }));
      }
      proceedToNextScreen(activeEvent, minigameContext, player);
      return; 
    }

    if (['wjc', 'olympics', 'worlds'].includes(minigameContext)) {
      // One resolver owns the whole knockout run. This used to be two near-identical
      // 100-line copies, here and in handleMinigameChoice, which had already drifted.
      const intl = resolveIntlGame({
        player, minigameContext, isWin, msg,
        currentYear, safeNationalities, unlockAchievement
      });

      if (intl.isTournamentOver) {
        setSeasonEvents(prev => [...prev, { feedback: intl.resultMsg, effect: intl.resultEffect }]);
      }

      setPlayer(intl.updatedPlayer);
      setIntlResult({
        isWin,
        msg: intl.resultMsg,
        feedback: intl.resultMsg,
        effect: intl.resultEffect,
        nextStake: intl.nextStake
      });
      return;
    }

    const payout = reward || { win: { fanStatus: 5 }, loss: { fanStatus: -2 } };
    const outcome = isWin ? (payout.win || {}) : (payout.loss || {});

    const withOvr = applyOvrDelta(player, outcome.ovr || 0);
    const updatedPlayer = {
      ...withOvr,
      fanStatus: capFanStatus(withOvr.fanStatus + (outcome.fanStatus || 0)),
      ovr: recomputeOvr(withOvr),
      stats: { 
          ...withOvr.stats, 
          earnings: (withOvr.stats?.earnings || 0) + (outcome.money || 0),
          careerEarnings: (withOvr.stats?.careerEarnings || withOvr.stats?.earnings || 0) + (outcome.money || 0)
      },
      relationships: {
        coach: Math.min(100, Math.max(0, (withOvr.relationships?.coach || 50) + (outcome.rel?.coach || 0))),
        teammates: Math.min(100, Math.max(0, (withOvr.relationships?.teammates || 50) + (outcome.rel?.teammates || 0))),
        media: Math.min(100, Math.max(0, (withOvr.relationships?.media || 50) + (outcome.rel?.media || 0)))
      }
    };

    setPlayer(updatedPlayer);
    setSeasonEvents(prev => {
      if (prev.length > 0 && prev[prev.length - 1].feedback === msg) return prev;
      return [...prev, { feedback: msg, effect: { fanStatus: outcome.fanStatus || 0, ovr: outcome.ovr || 0, money: outcome.money || 0 } }];
    });
    proceedToNextScreen(activeEvent, minigameContext, updatedPlayer);
  };

  const handleInteractiveResult = (isWin, reward, successMsg, failMsg) => {
   if (minigameLockedRef.current) return;
   minigameLockedRef.current = true;

    // What the moment was worth. A shootout in a gold medal game and a shootout
    // in a meaningless February game used to pay out exactly the same.
    const stakes = getStakes(minigameContext, player.intlStakes, player.intlOppTier);
    const payout = applyStakesToReward(
      isWin ? (reward?.win || {}) : (reward?.loss || {}),
      stakes.rewardMulti
    );
    const msg = isWin ? successMsg : failMsg;

    const withOvr = applyOvrDelta(player, payout.ovr || 0);
    let updatedPlayer = {
      ...withOvr, 
      fanStatus: capFanStatus((withOvr.fanStatus || 0) + (payout.fanStatus || 0)), 
      ovr: recomputeOvr(withOvr),
      stats: { 
          ...withOvr.stats, 
          earnings: (withOvr.stats?.earnings || 0) + (payout.money || 0),
          careerEarnings: (withOvr.stats?.careerEarnings || withOvr.stats?.earnings || 0) + (payout.money || 0)
      },
      relationships: {
        coach: Math.min(100, Math.max(0, (withOvr.relationships?.coach || 50) + (payout.rel?.coach || 0))),
        teammates: Math.min(100, Math.max(0, (withOvr.relationships?.teammates || 50) + (payout.rel?.teammates || 0))),
        media: Math.min(100, Math.max(0, (withOvr.relationships?.media || 50) + (payout.rel?.media || 0)))
      }
    };
    
    // NEW FINALS LOGIC
    if (minigameContext === 'finals') {
      // 1. Immediately reset context so it never leaks into offseason or camp minigames
      setMinigameContext('season');

      // 2. Safely read and update the bracket only if it actually exists
      setPlayoffs(prev => {
        if (!prev?.bracket || prev.bracket.length === 0) return prev;
        
        const finalRound = prev.bracket.length - 1;
        if (!prev.bracket[finalRound]) return prev;

        const rWN = getWinsNeeded(prev.currentLg || player.league, finalRound);
        const newBracket = [...prev.bracket];
        const roundMatches = [...(newBracket[finalRound] || [])];
        const pIndex = roundMatches.findIndex(m => m.isPlayerSeries);

        if (pIndex >= 0) {
            const m = { ...roundMatches[pIndex] };
            const pIsT1 = m.team1 === player.team || m.team1?.id === player.team;
            if (isWin) {
                m.wins1 = pIsT1 ? rWN : rWN - 1;
                m.wins2 = pIsT1 ? rWN - 1 : rWN;
                m.status = 'won';
            } else {
                m.wins1 = pIsT1 ? rWN - 1 : rWN;
                m.wins2 = pIsT1 ? rWN : rWN - 1;
                m.status = 'lost';
            }
            roundMatches[pIndex] = m;
            newBracket[finalRound] = roundMatches;
        }
        return { ...prev, bracket: newBracket, overallStatus: isWin ? 'won_cup' : 'eliminated' };
      });

      updatedPlayer.fanStatus = capFanStatus((updatedPlayer.fanStatus || 0) + (isWin ? 100 : -25));

      setPlayer(updatedPlayer);
      const finalMsg = isWin ? "You secured the championship with a heroic final shift!" : "Heartbreak in Game 7. You fell short in the dying seconds.";
      setSeasonEvents(prev => {
        if (prev.length > 0 && prev[prev.length - 1].feedback === finalMsg) return prev;
        return [...prev, { feedback: finalMsg, effect: { fanStatus: isWin ? 100 : -25, ovr: 0, money: 0 } }];
      });
      setScreen('playoffs');
      return;
    }

    if (minigameContext === 'memcup') {
        if (isWin && memCup.round === 1) {
            updatedPlayer.fanStatus = capFanStatus((updatedPlayer.fanStatus || 0) + 50);
            updatedPlayer.stats = { ...updatedPlayer.stats, memCupBoost: 50, titles: (updatedPlayer.stats.titles || 0) + 1 };
            if (updatedPlayer.seasonHistory && updatedPlayer.seasonHistory.length > 0) {
                const lastIdx = updatedPlayer.seasonHistory.length - 1;
                const activeYear = updatedPlayer.seasonHistory[lastIdx].year || 2026;
                updatedPlayer.seasonHistory[lastIdx] = { ...updatedPlayer.seasonHistory[lastIdx], awards: [...(updatedPlayer.seasonHistory[lastIdx].awards || []), `${activeYear} Memorial Cup`] };
            }
            unlockAchievement('mem_cup');
        }
        setMemCup(prev => ({ ...prev, status: isWin ? (prev.round === 0 ? 'semi_won' : 'won') : 'lost', lastFeedback: msg }));
        
        setPlayer(updatedPlayer);
        setSeasonEvents(prevEvents => [...prevEvents, { feedback: msg, effect: { fanStatus: payout.fanStatus || 0, ovr: payout.ovr || 0, money: payout.money || 0 } }]);
        proceedToNextScreen(activeEvent, minigameContext, updatedPlayer);
        return; 
    }

    if (['wjc', 'olympics', 'worlds'].includes(minigameContext)) {
      // One resolver owns the whole knockout run. This used to be two near-identical
      // 100-line copies, here and in handleMinigameChoice, which had already drifted.
      const intl = resolveIntlGame({
        player, minigameContext, isWin, msg,
        currentYear, safeNationalities, unlockAchievement
      });

      if (intl.isTournamentOver) {
        setSeasonEvents(prev => [...prev, { feedback: intl.resultMsg, effect: intl.resultEffect }]);
      }

      setPlayer(intl.updatedPlayer);
      setIntlResult({
        isWin,
        msg: intl.resultMsg,
        feedback: intl.resultMsg,
        effect: intl.resultEffect,
        nextStake: intl.nextStake
      });
      return;
    }

    setPlayer(updatedPlayer);
    setSeasonEvents(prev => {
      if (prev.length > 0 && prev[prev.length - 1].feedback === msg) return prev;
      return [...prev, { feedback: msg, effect: { fanStatus: payout.fanStatus || 0, ovr: payout.ovr || 0, money: payout.money || 0 } }];
    });
    proceedToNextScreen(activeEvent, minigameContext, updatedPlayer);
  };

  // A player always carries these. A React synthetic event never does, so this
  // tells the two apart without trusting the call site.
  const isPlayerObject = (v) =>
    Boolean(v) && typeof v === 'object' && !v.nativeEvent &&
    typeof v.age === 'number' && typeof v.pos === 'string';

  const advancePlayoffRound = () => setPlayoffs(p => ({ ...p, activeRoundIndex: Math.min((p.bracket?.length || 1) - 1, p.activeRoundIndex + 1) }));

  const ctx = {
    player, playoffs, seasonRecap, isAmateur, currentYear,
    safeEuroLeagues, safeJuniorLeagues, safeNationalities, activeEvent, minigameContext,
    setActiveEvent, setActivePress, setEventFeedback, setFreeAgencyOffers,
    setHasDemandedTrade, setIntlResult, setMinigameContext, setPendingPlayoffs,
    setPendingSeasonResult, setPlayer, setPlayoffs, setScreen,
    setSeasonEvents, setSeasonRecap, setStatChanges,
    unlockAchievement, triggerMinigame, generateTraining,
  };

  // Takes an optional player because a caller that has just signed a contract or
  // resolved an event has only SCHEDULED its setPlayer: the player on this render is
  // still the old one. Passing the freshly built object is how the rest of this file
  // already handles the same problem, and camp needs it to see which club the player
  // actually belongs to now.
  const advanceToOffseason = (maybePlayer = null) => {
    // Both of these take an OPTIONAL player, which makes them look like event
    // handlers, so `onClick={advanceToOffseason}` type-checks fine and quietly
    // hands React's click event in as the player. The offseason then read
    // event.team and event.league as undefined and wrote both onto the real
    // player, which is how a Kitchener Ranger arrived at training camp playing
    // for UNKNOWN with his career totals reset to an empty NHL column.
    const overridePlayer = isPlayerObject(maybePlayer) ? maybePlayer : null;
    const p0 = overridePlayer || player;
    const offCtx = overridePlayer ? { ...ctx, player: overridePlayer } : ctx;

    // The offseason is re-entered after each of its beats resolves, so the graduation
    // check and the new-year reset below must only run when the summer is starting.
    // Re-running the reset would wipe the events the offseason has already produced,
    // and re-running the graduation check would loop on it forever.
    if (p0.offseason) { _advanceToOffseason(offCtx); return; }

    const isAgedOutJunior = ['OHL', 'WHL', 'QMJHL', 'USHL'].includes(p0.league) && p0.age >= 21;
    const isAgedOutNCAA = p0.league === 'NCAA' && p0.age >= 24;

    if (isAgedOutJunior || isAgedOutNCAA) {
        setActiveEvent({
            title: 'AMATEUR GRADUATION',
            desc: isAgedOutNCAA 
                ? `You have exhausted your NCAA collegiate eligibility. Your amateur career has concluded and it is time to turn pro.`
                : `You have officially aged out of major junior hockey. Your amateur career has concluded and it is time to turn pro.`,
            choices: [{ label: 'Enter Free Agency', effect: { fanStatus: 0, ovr: 0 } }],
            isOffseasonEvent: true
        });
        setScreen('event');
        return;
    }
    
    // RESET POST-SEASON STATE FOR THE NEW YEAR
    setPlayoffs({ bracket: [], activeRoundIndex: 0, overallStatus: 'playing' });
    setPendingPlayoffs(null);
    setPendingSeasonResult(null);
    setSeasonRecap(null);
    setSeasonEvents([]);

    _advanceToOffseason(offCtx);
  };
  // Takes an optional player for the same reason advanceToOffseason does: a caller
  // that has just applied an archetype has only SCHEDULED its setPlayer, so the
  // player on this render is still the old one.
  const handleTrain        = (t, overridePlayer = null) =>
                             _handleTrain(overridePlayer ? { ...ctx, player: overridePlayer } : ctx, t);

  // Ends the year from wherever the last event left off. The All-Star break and
  // the deadline both happen inside the season now, so anything shown at the end
  // of it hands off here rather than routing back to one of them.
  const finishSeason = (maybePlayer = null) => {
    // Same trap as advanceToOffseason: wired straight to onClick in AllStarScreen,
    // so `who` was the click event and the whole season ended on undefined age,
    // rating and league.
    const who = isPlayerObject(maybePlayer) ? maybePlayer : player;
    const res = pendingSeasonResult;
    if (!res?.recap) { setScreen('recap'); return; }
    setSeasonRecap(res.recap);
    runPostSeasonFlow(who.age, who.ovr, res.currentLg, res.currentTeam, res.madePlayoffs,
      2026 + (who.stats?.seasonsPlayed || 0), res.recap.standings || 16);
  };
  ctx.finishSeason = finishSeason;
  // These are declared after ctx, so they are attached rather than listed in it.
  // handleDraftDay was already being called from the offseason for over-agers and
  // was never actually on ctx, so that call always fell through to its fallback.
  ctx.handleTrain = handleTrain;
  ctx.handleDraftDay = handleDraftDay;
  const checkEarlyDemotion = () => {
    const isUnder20 = player.age < 20;
    const isTop10Pick = seasonRecap?.draftPick <= 10;
    
    const chlSeason = [...(player.seasonHistory || [])].reverse().find(s => ['OHL', 'WHL', 'QMJHL'].includes(s.league));
    const hasCHLHistory = !!chlSeason;
    
    const played10NhlGames = (player.seasonHistory || []).some(s => s.league === 'NHL' && s.games >= 10);
    const isNonELC = player.contract?.salary !== 925000 && player.contract?.salary !== 0;
    const juniorsEligible = isUnder20 && !played10NhlGames && !isNonELC;

    const demoteThresh = player.pos === 'G' ? 71 : 64;
    const lastSeason = player.seasonHistory?.[player.seasonHistory.length - 1];
    const wonRecentTitle = lastSeason?.titleWon === true || (lastSeason?.awards || []).some(a => a.includes('Cup') || a.includes('Championship'));
    if (wonRecentTitle) return null;

    const proSeasons = player.stats?.seasonsPlayed || 0;
    const needsAHLDevelopment = player.league === 'NHL' && player.ovr < 78 && player.age < 24 && proSeasons < 3 && Math.random() < (isTop10Pick ? 0.25 : 0.85);
    
    const echlDemoteThresh = player.pos === 'G' ? 65 : 59;
    if (player.league === 'AHL' && player.ovr < echlDemoteThresh && Math.random() < 0.70) {
        const pool = echlTeams || [];
        const echlTeamId = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)].id : 'UNK';
        return { team: echlTeamId, lg: 'ECHL', reason: 'ECHL_REASSIGNMENT' };
    }

    if (player.league === 'NHL' && (player.ovr < demoteThresh || needsAHLDevelopment)) {
      
      // 🛡️ VETERAN & LEGEND PROTECTIONS 🛡️
      
      // 1. NMC Protection: A player with a No-Movement Clause legally cannot be waived.
      if (player.contract?.nmc) return null;
      
      // 2. Franchise Legend Protection: High fan status keeps you on the NHL roster. You will ride the bench in the NHL out of respect.
      if (player.fanStatus >= 600) return null;
      
      // 3. Veteran Contract Grace: Teams rarely waive high-earning vets just for dropping a few OVR points below the threshold.
      if (player.age >= 32 && (player.contract?.salary || 0) >= 2000000 && player.ovr >= demoteThresh - 4) return null;

      if (isTop10Pick && isUnder20) return null; 
      // A prospect who still has a junior club to go back to is NOT sent down at
      // camp any more. He makes the roster, plays his nine games, and the club
      // decides on what it actually saw. That is the nine-game rule, and it now
      // runs inside the season rather than as a coin flip before it.
      if (juniorsEligible && hasCHLHistory) return null;
      else {
         const parentNhlTeam = nhlTeams.find(t => t.id === player.team);
         const ahlTeamId = parentNhlTeam ? parentNhlTeam.ahlId : 'UNK';

         // WAIVER EXEMPTION
         // A young player can be sent to the AHL freely. He only has to clear
         // waivers once he has enough professional mileage behind him, which in
         // the real rule is a sliding scale of years and games from the age he
         // signed. Three pro seasons or 160 NHL games is a fair stand-in. The old
         // code sent even first-year players through "WAIVERS", which cannot
         // happen, and gave everyone who did go through a flat 30% claim rate.
         const nhlGamesPlayed = player.stats?.nhl?.games || 0;
         const isWaiverExempt = proSeasons < 3 && nhlGamesPlayed < 160;

         if (isWaiverExempt) {
             return { team: ahlTeamId, lg: 'AHL', reason: 'DEVELOPMENT' };
         }

         // A ONE-WAY CONTRACT RESISTS THE DEMOTION
         // It pays full NHL money in the AHL, so the club eats the whole cap hit
         // to bury him and usually finds another way. A two-way deal costs them
         // very little, which is the entire point of signing one.
         const cRole = player.contract?.role || '';
         const isTwoWay = cRole.includes('Two-Way') || cRole.includes('AHL Start') || cRole.includes('Pro Roster');
         const capHitM = (player.contract?.salary || 0) / 1000000;
         if (!isTwoWay && capHitM >= 1.5 && Math.random() < 0.6) return null;

         // CLAIMED OFF WAIVERS
         // A useful player on a cheap deal is gone before the window closes; an
         // expensive one who has fallen off clears easily. Value, not a coin flip.
         const worthM = Math.max(0.8, (player.ovr - 68) * 0.45);
         const bargain = worthM - capHitM;
         const claimChance = Math.min(0.85, Math.max(0.03, 0.12 + (bargain * 0.18)));

         if (Math.random() < claimChance) {
             const pool = (nhlTeams || []).filter(t => t.id !== player.team);
             return { team: pool[Math.floor(Math.random() * pool.length)].id, lg: 'NHL', reason: 'CLAIMED' };
         }
         return { team: ahlTeamId, lg: 'AHL', reason: needsAHLDevelopment ? 'DEVELOPMENT' : 'WAIVERS' };
      }
    }
    return null;
  };

  const runPostSeasonFlow  = (pAge, pOvr, currentLg, currentTeam, madePlayoffs, nextYear, standings) =>
                             _runPostSeasonFlow(ctx, pAge, pOvr, currentLg, currentTeam, madePlayoffs, nextYear, standings);
  const handleGridClick    = (rIndex, mIndex, cIndex) => _handleGridClick(ctx, rIndex, mIndex, cIndex);
  const generateOffers     = (isTradeRequest = false, overrideTeam = null, overrideLeague = null) =>
                             _generateOffers(ctx, isTradeRequest, overrideTeam, overrideLeague);
  const checkPlayoffs      = (currentLg, currentTeamId, standings, opts) => _checkPlayoffs(ctx, currentLg, currentTeamId, standings, opts);
  const handleEventChoice  = (choice) => _handleEventChoice(ctx, choice);

  const proceedFromPlayoffs = () => {
    let totalWins = 0;
    let playoffGames = 0;
    
    (playoffs.bracket || []).forEach(r => {
       const pm = r.find(m => m.isPlayerSeries);
       if (pm) { totalWins += pm.wins1; playoffGames += (pm.wins1 || 0) + (pm.wins2 || 0); }
    });
    // An injured player sat the run out, so they earn no playoff stats of their own.
    // The team result still counts.
    if (playoffs.playerSidelined) playoffGames = 0;

    let pG = 0, pA = 0, pSaves = 0, pShots = 0, pSho = 0;
    if (playoffGames > 0) {
        const impact = player.ovr >= 85 ? 1.1 : player.ovr >= 75 ? 0.75 : 0.45;
        if (player.pos === 'G') {
            const savePct = Math.min(0.940, Math.max(0.880, 0.900 + ((player.ovr - 70) * 0.001) + (Math.random() * 0.02 - 0.01)));
            pShots = playoffGames * (26 + Math.floor(Math.random() * 8));
            pSaves = Math.floor(pShots * savePct);
            pSho = Math.max(0, Math.floor((savePct - 0.900) * 50) + Math.floor(Math.random() * 2));
        } else {
            const chemistryMod = (player.relationships?.teammates || 50) > 75 ? 1.15 : 1.0;
            const ppg = impact * (0.8 + Math.random() * 0.4) * chemistryMod;
            const points = Math.floor(playoffGames * ppg);
            const goalRatio = ['LD', 'RD'].includes(player.pos) ? 0.25 : 0.45;
            pG = Math.floor(points * goalRatio);
            pA = points - pG;
        }
    }

    const finalRound = playoffs.bracket ? playoffs.bracket[playoffs.bracket.length - 1] : null;
    const finalMatch = finalRound ? finalRound[0] : null;
    let champion = null;
    if (finalMatch) {
      const finalWN = getWinsNeeded(playoffs.currentLg, playoffs.bracket.length - 1);
      if (finalMatch.wins1 >= finalWN) champion = finalMatch.team1;
      else if (finalMatch.wins2 >= finalWN) champion = finalMatch.team2;
    }

    const isCupWon = playoffs.overallStatus === 'won_cup';

    // Who you actually went through, and who put you out. The recap could only
    // say "Eliminated after 3 playoff wins", which is true of a loss to anybody
    // and says nothing about the one series a player would actually remember.
    const myPoId = playoffs.currentTeamId;
    const poRounds = getPlayoffRounds(playoffs.currentLg) || [];
    const rivalPo = getPrimaryRival(player.team, player.league);
    const rivalPoId = rivalPo?.id || null;

    const myPoMatches = (playoffs.bracket || []).map((round, rIdx) => {
      const m = (round || []).find(x => x.isPlayerSeries);
      if (!m) return null;
      const meIsT1 = (m.team1?.id || m.team1) === myPoId;
      const oppId = meIsT1 ? (m.team2?.id || m.team2) : (m.team1?.id || m.team1);
      return { rIdx, oppId, status: m.status, roundName: poRounds[rIdx]?.name || `Round ${rIdx + 1}` };
    }).filter(Boolean);

    const poLoss = myPoMatches.find(x => x.status === 'lost') || null;
    const beatRival = myPoMatches.find(x => x.status === 'won' && rivalPoId && x.oppId === rivalPoId) || null;

    setSeasonRecap(r => ({
       ...(r || {}),
       playoffWins: totalWins, playoffGames, playoffG: pG, playoffA: pA, playoffSaves: pSaves,
       playoffShots: pShots, playoffSho: pSho, titleWon: isCupWon ? 1 : 0, confTitleWon: playoffs.confTitleWon || false,
       confName: playoffs.playerConf === 'East' ? 'Eastern Conference' : 'Western Conference',
       leagueChampion: champion,
       eliminatedByName: poLoss ? getFullTeamName(poLoss.oppId, playoffs.currentLg) : null,
       eliminatedRound: poLoss ? poLoss.roundName : null,
       lostToRival: !!(poLoss && rivalPoId && poLoss.oppId === rivalPoId),
       beatRivalRound: beatRival ? beatRival.roundName : null,
       beatRivalName: beatRival ? getFullTeamName(beatRival.oppId, playoffs.currentLg) : null
    }));
    
    setPlayer(p => {
        const lg = playoffs.currentLg;
        const statBucket = lg === 'AHL' ? 'ahl' : (['OHL', 'WHL', 'QMJHL', 'USHL', 'NCAA', 'SHL', 'LIIGA'].includes(lg) ? 'chl' : 'nhl');
        const poBucket = statBucket + 'Playoffs'; 
        
        const newHistory = [...(p.seasonHistory || [])];
        const currentYearString = `${2026 + (p.stats?.seasonsPlayed || 0)}`;
        const cupName = lg === 'NHL' ? 'Stanley Cup' : lg === 'AHL' ? 'Calder Cup' : 'Championship';
        // A cup is recorded once per season. The old guard compared against the
        // exact string `${year} ${cupName}` in the career list, which misses
        // whenever the year has already rolled over, and it never looked at the
        // season's own award list at all. A season entry can only ever hold one
        // championship, so that is the thing to test.
        const lastIdx = newHistory.length - 1;
        const histAwards = lastIdx >= 0 ? (newHistory[lastIdx].awards || []) : [];
        const cupLabel = `${currentYearString} ${cupName}`;
        const cupInSeason = histAwards.some(a => String(a).includes(cupName));
        const cupInCareer = (p.stats?.awards || []).some(a => String(a).includes(cupName) && String(a).startsWith(currentYearString));
        const alreadyAwarded = isCupWon && (cupInSeason || cupInCareer);

        if (lastIdx >= 0) {
            newHistory[lastIdx] = { 
                ...newHistory[lastIdx], 
                titleWon: isCupWon || newHistory[lastIdx].titleWon, 
                playoffGames, 
                playoffGoals: pG, 
                playoffAssists: pA,
                isCaptain: p.isCaptain,
                isAlternate: p.isAlternate,
                // Deduped on the way out, which also cleans up any season that
                // already collected two cups before this was fixed.
                awards: Array.from(new Set(
                  isCupWon && !alreadyAwarded ? [...histAwards, cupLabel] : histAwards
                ))
            };
        }
        
        const seasonGoals = seasonRecap?.g || 0;
        const currentHigh = p.stats?.careerHighGoals || 0;

        return { 
           ...p, seasonHistory: newHistory,
           stats: {
              ...p.stats, 
              titles: isCupWon && !alreadyAwarded ? (p.stats.titles || 0) + 1 : (p.stats.titles || 0),
              awards: Array.from(new Set(
                 isCupWon && !alreadyAwarded ? [...(p.stats.awards || []), cupLabel] : (p.stats.awards || [])
              )),
              careerHighGoals: Math.max(currentHigh, seasonGoals), 
              [poBucket]: {
                 games: (p.stats[poBucket]?.games || 0) + playoffGames, goals: (p.stats[poBucket]?.goals || 0) + pG,
                 assists: (p.stats[poBucket]?.assists || 0) + pA, saves: (p.stats[poBucket]?.saves || 0) + pSaves,
                 shots: (p.stats[poBucket]?.shots || 0) + pShots, shutouts: (p.stats[poBucket]?.shutouts || 0) + pSho
              }
           }
        };
    });
    
    if (isCupWon && ['OHL', 'WHL', 'QMJHL'].includes(player.league)) {
      setMemCup({ round: 0, status: 'playing' });
      setScreen('memorial-cup');
    } else setScreen('recap');
  };

  const handleEndMemCup = () => { setSeasonRecap(r => ({ ...r, memCupStatus: memCup.status })); setScreen('recap'); };

  const signContract = (o) => {
    const rivalObj = getPrimaryRival(player.team, player.league);
    if (rivalObj && (rivalObj.id === o.team || rivalObj.name === o.team)) unlockAchievement('betrayal');
    if (player.draftTeam === o.team && player.team !== o.team) {
       unlockAchievement('return_home');
       setSeasonEvents(prev => [...prev, { feedback: `You made a triumphant return to ${getFullTeamName(o.team, o.league)}, the team that originally drafted you!`, effect: { fanStatus: 50, ovr: 0, money: 0 } }]);
    }
    if (o.type === 'FREE AGENCY' && player.age >= 35) unlockAchievement('vet_contract');

    // The signed player is built here, not inside the setPlayer updater.
    //
    // It used to be assigned from within that updater and then read on the very
    // next line. React does not promise to run an updater synchronously, so
    // about as often as not the variable was still undefined when the offseason
    // was handed it, isPlayerObject rejected it, and the summer carried on with
    // the player as he was before he signed. That is how committing to a
    // college programme left a player skating for his old junior club: the
    // contract was applied to state a moment later, and the thing that actually
    // decided where he played next had already run with the stale copy.
    const p = player;
    const isNewTeam = p.team !== o.team;
    let newRelationships;
    if (isNewTeam) {
       let baseTrust = 50; let mediaTrust = 50;
       if ((p.fanStatus || 0) >= 800) { baseTrust = 75; mediaTrust = 80; }
       else if ((p.fanStatus || 0) >= 400) { baseTrust = 60; mediaTrust = 65; }
       newRelationships = { coach: baseTrust, teammates: baseTrust, media: mediaTrust };
    } else {
       newRelationships = { coach: Math.min(100, (p.relationships?.coach || 50) + 10), teammates: Math.min(100, (p.relationships?.teammates || 50) + 10), media: Math.min(100, (p.relationships?.media || 50) + 5) };
    }
    const newTeams = Array.from(new Set([...(p.teamsPlayedFor || []), o.team]));

    // What the perks and flaws on the card were actually worth. Without this
    // they are only decoration: the screen would promise elite coaching and
    // warn about a crowded depth chart, and signing would ignore both.
    const bonus = o.perkTotals || { ovr: 0, fanStatus: 0, money: 0 };
    const withPerks = applyOvrDelta(p, bonus.ovr || 0);

    const updatedPlayer = {
      ...withPerks, team: o.team, league: o.league || 'NHL',
      fanStatus: capFanStatus((p.fanStatus || 0) + (o.fanHit || 0) + (bonus.fanStatus || 0)),
      // isScholarship marks this as eligibility rather than a signed pro deal.
      // Without it a scholarship is indistinguishable from a contract once it
      // is in the player object, and everything downstream that asks "is he
      // signed?" gets the wrong answer. See hasProContract in gameHelpers.
      teamsPlayedFor: newTeams,
      contract: {
        salary: o.salary, years: o.years, role: o.role, nmc: o.nmc,
        isScholarship: o.type === 'SCHOLARSHIP' || (o.league || '') === 'NCAA'
      },
      relationships: newRelationships,
      stats: {
        ...p.stats,
        earnings: (p.stats?.earnings || 0) + (bonus.money || 0),
        careerEarnings: (p.stats?.careerEarnings || p.stats?.earnings || 0) + (bonus.money || 0)
      },
      // FIX: Strip captaincy if moving to a new team
      isCaptain: isNewTeam ? false : p.isCaptain,
      isAlternate: isNewTeam ? false : p.isAlternate
    };

    const fullyUpdatedPlayer = { ...updatedPlayer, ovr: recomputeOvr(updatedPlayer) };
    setPlayer(fullyUpdatedPlayer);

    if (o.type === 'TRADE') {
        const resToUse = pendingSeasonResult || { recap: seasonRecap };
        const newMadePlayoffs = o.standing ? o.standing <= 16 : false;
        const newStandings = o.standing || 16;

        if (resToUse && resToUse.recap) {
            setSeasonRecap({
                ...resToUse.recap,
                madePlayoffs: newMadePlayoffs,
                standings: newStandings
            });
        }
        if (resToUse) {
            // FIX: Use the fully updated player state so the Dashboard doesn't crash during the handoff
            runPostSeasonFlow(fullyUpdatedPlayer.age, fullyUpdatedPlayer.ovr, o.league || 'NHL', o.team, newMadePlayoffs, 2026 + (fullyUpdatedPlayer.stats?.seasonsPlayed || 0), newStandings);
            return; 
        }
    }

    // Signing OPENS the player's year, it does not start the season: he still has
    // training camp to get through. Re-entering the offseason runs camp, and camp
    // is what routes to preseason.
    setPlayoffs({ bracket: [], activeRoundIndex: 0, overallStatus: 'playing' });
    advanceToOffseason(fullyUpdatedPlayer);
  }; 

  const handleArbitration = (offer) => {
    let baseline;
    const careerAwards = player.stats?.awards || [];
    const isSuperstar = player.ovr >= 88 || careerAwards.some(a => ['Hart', 'Vezina', 'Norris', 'Art Ross', 'Rocket'].some(aw => a.includes(aw)));

    if (player.ovr >= 85 || isSuperstar) baseline = 7500000 + ((player.ovr - 85) * 1000000);
    else if (player.ovr >= 80) baseline = 4500000 + ((player.ovr - 80) * 600000);
    else if (player.ovr >= 75) baseline = 2000000 + ((player.ovr - 75) * 500000);
    else baseline = 900000 + 150000 + ((player.ovr - 70) * 100000);

    if (isSuperstar) baseline = Math.max(baseline, 10500000);
    baseline = Math.min(13500000, baseline); 

    const teamOffer = Math.round((baseline * 0.70) / 25000) * 25000;
    const playerAsk = Math.round((baseline * 1.35) / 25000) * 25000;
    const startingRuling = Math.round(baseline / 25000) * 25000;

    setArbState({ teamOffer, playerAsk, currentRuling: startingRuling, rounds: 3, offerData: offer, log: ["The arbitrator calls the hearing to order."] });
    setScreen('arbitration_minigame');
  };

  const startNegotiation = (offer) => {
    setNegotiation({ originalOffer: offer, currentSalary: offer.salary, currentYears: offer.years || 1, gmPatience: 100, rounds: 0, maxRounds: 5, history: [], status: 'playing', msg: "You are at the bargaining table." });
    setScreen('negotiation');
  };

  const finishNegotiation = (signNow) => {
    const updatedOffer = { ...negotiation.originalOffer, salary: negotiation.currentSalary, years: negotiation.currentYears, negotiated: true };
    if (signNow) signContract(updatedOffer);
    else { setFreeAgencyOffers(prev => prev.map(o => (o.team === updatedOffer.team && o.type === updatedOffer.type) ? updatedOffer : o)); setScreen('transfer'); }
  };
  
  const buyItem = (item) => {
    if (item.type === 'staff') unlockAchievement('staff_hired');
    if (item.type === 'luxury') unlockAchievement('luxury_buyer');
    if (item.id === 'agent') unlockAchievement('agent_hired');

    setPlayer(p => {
      if ((p.stats?.earnings || 0) < item.cost || (p.inventory || []).includes(item.id)) return p;
      const stats = { ...p.stats, earnings: (p.stats?.earnings || 0) - item.cost };
      if (item.type === 'consumable') return { ...p, stats, buffs: [...(p.buffs || []), item] };
      const next = { ...p, stats, inventory: [...(p.inventory || []), item.id] };
      
      // Apply the intended stats
      if (item.effect?.stamina) next.stamina = cap((next.stamina || 50) + item.effect.stamina);
      if (item.effect?.hockeyIQ) next.hockeyIQ = cap((next.hockeyIQ || 50) + item.effect.hockeyIQ);
      if (item.effect?.fanStatus) next.fanStatus = capFanStatus(next.fanStatus + item.effect.fanStatus);
      if (item.effect?.physicality) next.physicality = cap((next.physicality || 50) + item.effect.physicality);
      if (item.effect?.shooting) next.shooting = cap((next.shooting || 50) + item.effect.shooting);
      if (item.effect?.skating) next.skating = cap((next.skating || 50) + item.effect.skating);
      
      // Safety net: Catch the "power" typo and route it to physicality
      if (item.effect?.power) next.physicality = cap((next.physicality || 50) + item.effect.power);
      
      // Recompute OVR so the upgrade instantly reflects on the player card
      next.ovr = recomputeOvr(next);
      return next;
    });
  };

  const proceedToNextScreen = (currentEvent, currentMgContext, currentPlayer) => {
    setActiveEvent(null);
    setMinigameContext('season');

    // 1. PRESEASON & TRAINING CAMP ALWAYS RETURN TO PRESEASON
    if (['preseason', 'training', 'camp'].includes(currentMgContext)) {
      setScreen('preseason');
      return;
    }

    // INJURY FOLLOW-UP: a devastating injury in a playoff year chains into the press box.
    if (currentEvent?.followUpEvent) {
      setActiveEvent(currentEvent.followUpEvent);
      setScreen('event');
      return;
    }

    // SIDELINED: the club plays on without the player, decided by a background sim.
    if (currentEvent?.playerSidelined) {
      if (pendingPlayoffs) {
        const pp = pendingPlayoffs;
        setPendingPlayoffs(null);
        checkPlayoffs(pp.lg, pp.team, pp.standings, { sidelined: true });
      } else {
        checkPlayoffs(currentPlayer.league, currentPlayer.team, seasonRecap?.standings || 16, { sidelined: true });
      }
      return;
    }

    if (currentEvent?.isTradeDeadlineEvent) {
       const recapToUse = seasonRecap || pendingSeasonResult?.recap;
       const tradeAction = currentEvent.choices?.find(c => c.action === 'ACCEPT_TRADE_DEADLINE');
       
       const didTrade = currentPlayer.team !== player.team;
       const newTeamMadePlayoffs = didTrade ? (tradeAction?.actionData?.madePlayoffs ?? recapToUse?.madePlayoffs ?? false) : (recapToUse?.madePlayoffs ?? false);
       const newTeamStandings = didTrade ? (tradeAction?.actionData?.teamStandings ?? recapToUse?.standings ?? 16) : (recapToUse?.standings ?? 16);
       
       if (recapToUse) {
           setSeasonRecap({
               ...recapToUse,
               madePlayoffs: newTeamMadePlayoffs,
               standings: newTeamStandings
           });
       }
       
       // The deadline sits about seventy per cent of the way through the year, so
       // whatever was just decided here governs the games that are left. Go back
       // into the season and play them, with the new club if there is one.
       if (currentPlayer.season) { handleTrain(null); return; }

       runPostSeasonFlow(currentPlayer.age, currentPlayer.ovr, currentPlayer.league, currentPlayer.team, newTeamMadePlayoffs, 2026 + (currentPlayer.stats?.seasonsPlayed || 0), newTeamStandings);
       return;
    }
    
    // The nine-game verdict is the middle of the season, not the end of it. Go
    // back in and play out the games that are left, wherever the club has just
    // decided the player belongs.
    if (currentEvent?.isNineGameEvent) { handleTrain(null); return; }
    // The debut is one game played at the top of the season; answering it drops
    // back into handleTrain, which picks the segment up and plays the rest.
    if (currentEvent?.isDebutEvent) { handleTrain(null); return; }

    if (currentEvent?.isPortalEvent) { advanceToOffseason(currentPlayer); return; }
    // The career-opening event. Straight to the first preseason.
    if (currentEvent?.isIntroEvent) {
       generateTraining(currentPlayer.pos, currentPlayer);
       setScreen('preseason');
       return;
    }

    if (currentEvent?.isOffseasonEvent) {
       const goesToFreeAgency = ['AMATEUR GRADUATION', 'RIGHTS EXPIRED'].includes(currentEvent.title) && currentPlayer.league !== 'NHL';
       // If the market declines to open (an amateur who should never have been
       // routed here), fall through to the rest of the summer rather than leaving
       // the player stranded on a screen with nothing on it.
       const marketOpened = goesToFreeAgency && generateOffers(false, currentPlayer.team) !== false;
       // An offseason beat resolving does not start the season. Go back in for the
       // next beat; training camp, at the end of the chain, is what finally hands
       // the player to the preseason screen. If the market declined to open, for
       // an amateur who should never have been routed here, the summer carries on
       // rather than leaving him stranded on an empty screen.
       if (!marketOpened) advanceToOffseason(currentPlayer);
       return;
    }
    
    if (currentMgContext === 'memcup') { setScreen('memorial-cup'); return; }

    if (['wjc', 'olympics', 'worlds'].includes(currentMgContext)) {
      // The World Juniors and the Olympics are played in the middle of the season,
      // so coming home from one means going back to your club for the rest of the
      // year. Only the World Championship, in May, finishes a season.
      if (currentPlayer.season) { handleTrain(null); return; }

      if (pendingPlayoffs) {
        const pp = pendingPlayoffs;
        setPendingPlayoffs(null);
        checkPlayoffs(pp.lg, pp.team, pp.standings);
      } else if (seasonRecap?.madePlayoffs) {
        checkPlayoffs(currentPlayer.league, currentPlayer.team, seasonRecap.standings);
      } else setScreen('recap');
      return;
    }

    if (!seasonRecap && !pendingPlayoffs) { setScreen('preseason'); return; }

    let madePlayoffsFlag = seasonRecap?.madePlayoffs;
    if (currentEvent && currentEvent.madePlayoffs !== undefined) madePlayoffsFlag = currentEvent.madePlayoffs;

    if (pendingPlayoffs && currentEvent?.madePlayoffs !== false) {
      const pp = pendingPlayoffs;
      setPendingPlayoffs(null);
      checkPlayoffs(pp.lg, pp.team, pp.standings);
    } else if (madePlayoffsFlag) {
      const targetLg = currentEvent?.isDemotionEvent ? currentEvent.currentLg : currentPlayer.league;
      const targetTeam = currentEvent?.isDemotionEvent ? currentEvent.currentTeam : currentPlayer.team;
      checkPlayoffs(targetLg, targetTeam, seasonRecap?.standings || 16);
    } else setScreen('recap');
  };

  ctx.proceedToNextScreen = proceedToNextScreen;
  ctx.checkPlayoffs = checkPlayoffs;

  const tier = getFanTier(player.fanStatus);

  const contextValue = {
    BreakawayGame, BreakoutGame, CreaseGame, DeflectionGame, FaceoffGame,
    FilmRoomGame, OneTimerGame, ScreenedShotGame, ShootoutGame, ShotBlockGame, ZoneBattleGame,
    TeamLogo, activeEvent, activeMinigame, activePress,
    activeTrainings, advancePlayoffRound, advanceToOffseason, arbState,
    checkEarlyDemotion, combineColor, combinePhase, combineScore, currentYear,
    eventFeedback, finishNegotiation, freeAgencyOffers, handleArbitration,
    handleCombineReflex, handleDraftChoice, handleDraftDay, handleEndMemCup,
    handleEndPress, handleEventChoice, handleGridClick, handleInteractiveResult,
    handleMinigameChoice, handleNewGame, handlePressAnswer,
    handleStart, handleTrain, hasDemandedTrade, intlResult,
    isJunior, memCup, minigameContext, minigameStarted,
    negotiation, pendingSeasonResult, player, playoffs,
    pressAnswerKeys, proceedFromPlayoffs, proceedToNextScreen, runPostSeasonFlow,
    safeNationalities, seasonEvents, setSeasonEvents, seasonRecap, setActiveEvent,
    setArbState, setCombinePhase, setCombineScore,
    setEventFeedback, setNegotiation, setHasDemandedTrade, setIntlResult, setMemCup,
    setMinigameStarted, setPlayer, setPlayoffs, setScreen, setStatChanges,
    setSeasonRecap, setShowAchievementsMenu, showAchievementsMenu, signContract,
    startNegotiation, triggerMinigame, resetMinigameLock, unlockAchievement, unlockedAchievements,
  };

  return (
      <AppContext.Provider value={contextValue}>
    <div className="min-h-screen p-2 sm:p-6 flex flex-col font-sans bg-[#040505] text-white relative">
      {/* NEW: Global style to fix iOS Safari white overscroll bleed */}
      <style>{`
        html, body { background-color: #040505; }
      `}</style>
      
      {achievementToast && (
        <div data-nosnippet
          className="fixed top-12 right-4 sm:top-16 sm:right-6 z-50 max-w-[260px] sm:max-w-xs bg-[#101410] border-2 border-[#F59E0B] p-4 rounded-xl shadow-[0_0_25px_rgba(245,158,11,0.4)] flex items-center gap-4 pointer-events-none"
          style={{ animation: 'toastLifecycle 4s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
        >
          <style>{`
            @keyframes toastLifecycle { 0% { transform: translateX(120%); opacity: 0; } 10% { transform: translateX(0); opacity: 1; } 85% { transform: translateX(0); opacity: 1; } 100% { transform: translateX(120%); opacity: 0; } }
          `}</style>
          <span className="text-3xl sm:text-4xl shrink-0">{achievementToast.icon}</span>
          <div className="text-left">
            <p className="text-[9px] font-bold text-[#F59E0B] uppercase tracking-widest font-sans">ACHIEVEMENT UNLOCKED!</p>
            <h4 className="text-sm sm:text-base font-black text-white sports-font uppercase">{achievementToast.name}</h4>
            <p className="text-[10px] text-slate-300 font-sans">{achievementToast.desc}</p>
          </div>
        </div>
      )}
      {isShopOpen && (
        <div className="fixed inset-0 z-50 flex justify-start bg-black/40 p-4 backdrop-blur-[2px]">
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
                      return (
                        <div key={item.id} className={`p-4 rounded-xl border ${isOwned ? 'border-[#22E748]/50 bg-[#22E748]/10' : 'border-[rgba(255,255,255,0.065)] bg-[#101410]'}`}>
                          <div className="flex justify-between items-start mb-2 gap-4">
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-white text-lg font-sans leading-tight">{item.name}</p>
                              <p className="text-xs text-slate-400 mt-1">{player.pos === 'G' && item.descGoalies ? item.descGoalies : item.desc}</p>
                            </div>
                            <p className={`font-black sports-font shrink-0 whitespace-nowrap ${isOwned ? 'text-[#22E748]' : 'text-slate-400'}`}>
                              {isOwned ? '✓ OWNED' : formatMoney(item.cost)}
                            </p>
                          </div>
                          {!isOwned && (
                            <button disabled={!canAfford} onClick={() => buyItem(item)} className="w-full mt-3 bg-[#1a2230] hover:bg-[#232d3f] border border-[rgba(255,255,255,0.065)] text-white disabled:opacity-50 py-2 rounded text-sm font-bold transition-colors cursor-pointer font-sans tracking-wide">BUY</button>
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

      <div className={`w-full mx-auto pb-10 flex-1 ${screen !== 'creation' && screen !== 'retirement' ? 'max-w-7xl flex flex-col lg:flex-row gap-4 lg:gap-6 items-stretch' : 'max-w-5xl'}`}>
        {screen !== 'creation' && screen !== 'retirement' && (
          <div className="w-full lg:w-[440px] shrink-0 z-40 flex flex-col lg:sticky lg:top-6 lg:self-start">
            <Dashboard
              player={player} tier={tier} statChanges={statChanges} 
              lgKey={lgKey} isJunior={isJunior} isAHL={isAHL} 
              onOpenShop={() => setIsShopOpen(true)} 
              hasDemandedTrade={hasDemandedTrade} 
              setHasDemandedTrade={setHasDemandedTrade} 
              onRetire={() => setScreen('retirement')}
              setActiveEvent={setActiveEvent}
              setScreen={setScreen}
            />
          </div>
        )}

        <div className="w-full flex-1 min-w-0 flex flex-col gap-4 mt-2 lg:mt-0">
          <ErrorBoundary key={screen} onRecover={() => setScreen('preseason')}>
            {screen === 'creation' && <CreationScreen />}
            {screen === 'retirement' && <RetirementScreen />}
            {screen === 'press' && <PressScreen />}
            {screen === 'press-result' && <PressResultScreen />}
            {screen === 'combine' && <CombineScreen />}
            {screen === 'draft' && <DraftScreen />}
            {screen === 'preseason' && <PreseasonScreen />}
            {screen === 'arbitration_minigame' && <ArbitrationScreen />}
            {screen === 'trade-deadline' && <TradeDeadlineScreen />}
            {screen === 'intl-minigame' && <IntlMinigameScreen />}
            {screen === 'recap' && <RecapScreen />}
            {screen === 'event' && <EventScreen />}
            {screen === 'minigame' && <MinigameScreen />}
            {screen === 'playoffs' && <PlayoffsScreen />}
            {screen === 'memorial-cup' && <MemorialCupScreen />}
            {screen === 'transfer' && <TransferScreen />}
            {screen === 'negotiation' && <NegotiationScreen />}
            {screen === 'all-star' && <AllStarScreen />}
          </ErrorBoundary>
        </div>
      </div> 
      <div className="mt-auto text-center border-t border-[rgba(255,255,255,0.05)] pt-6 pb-6 w-full">
         <a 
            href="https://x.com/ferreirahockey"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block sm:fixed sm:top-4 sm:right-4 z-50 bg-[#101410] hover:bg-[#1a2230] border border-[rgba(255,255,255,0.1)] hover:border-[#3b82f6] text-slate-400 hover:text-[#3b82f6] text-[10px] sm:text-xs font-bold uppercase tracking-widest font-sans transition-colors px-3 py-2 rounded-lg shadow-lg"
         >
            Have Feedback? Reach out to me!
         </a>
      </div>
    </div>
      </AppContext.Provider>
  );
}

export default App;