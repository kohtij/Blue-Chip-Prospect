import { useState, useEffect } from 'react';
import './App.css';
import {
  nhlTeams, ohlTeams, whlTeams, qmjhlTeams, ahlTeams,
  nationalities, juniorLeagues, euroLeagues, LEAGUE_CONFIG,
  getTeamData, getDeployment
} from './data/teams';
import { shopItems, skaterTrainingPool, goalieTrainingPool, eventDeck } from './data/economy';
import { getMinigamePool, findMinigame } from './data/minigames';
import {
  cap, capIdol, formatMoney, getIdolTier, getTransferImpact,
  getActiveStat, applyOvrDelta, recomputeOvr, simulateSeason, generatePlayoffDeck,
  choiceChance, CHOICE_REWARD
} from './utils/gameHelpers';

const ACCENT = {
  red:     { border: 'border-t-[#ef4444]', heading: 'text-[#ef4444]' },
  blue:    { border: 'border-t-[#3b82f6]', heading: 'text-[#3b82f6]' },
  emerald: { border: 'border-t-[#22E748]', heading: 'text-[#22E748]' },
  amber:   { border: 'border-t-[#F59E0B]', heading: 'text-[#F59E0B]' },
};

const ARCH_PILL = {
  safe:   { label: 'SAFE',   cls: 'text-slate-300 bg-[#101410] border-[rgba(255,255,255,0.065)]', hover: 'hover:border-slate-500' },
  skill:  { label: 'SKILL',  cls: 'text-[#22E748] bg-[#22E748]/10 border-[#22E748]/30', hover: 'hover:border-[#22E748]' },
  gamble: { label: 'GAMBLE', cls: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30', hover: 'hover:border-[#F59E0B]' },
};

const MASTER_ACHIEVEMENTS = [
  { id: 'first_overall', name: 'Generational', desc: 'Drafted 1st Overall', icon: '🌟' },
  { id: 'mem_cup', name: 'Junior Legend', desc: 'Win the Memorial Cup', icon: '🏆' },
  { id: 'stanley_cup', name: 'Lord Stanley', desc: 'Win the Stanley Cup', icon: '💍' },
  { id: 'gold_medal', name: 'National Hero', desc: 'Win International Gold', icon: '🥇' },
  { id: 'franchise_legend', name: 'Statue Outside', desc: 'Reach Max Fan Status', icon: '🗽' },
  { id: 'fifty_mil', name: 'Bag Secured', desc: 'Earn $50M Career', icon: '💰' }
];

const TeamLogo = ({ teamId, league, isAHL }) => {
  const team = getTeamData(teamId, league);
  const [imgError, setImgError] = useState(false);
  const isNHL = league === 'NHL' && !isAHL && nhlTeams.some(t => t.id === teamId);

  if (isNHL && !imgError) {
    return (
      <div className="relative w-12 h-12 flex items-center justify-center bg-white rounded-full p-1 border border-[rgba(255,255,255,0.14)]">
        <img
          src={`https://assets.nhle.com/logos/nhl/svg/${teamId}_light.svg`}
          alt={teamId}
          className="w-full h-full object-contain"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="relative w-12 h-12 rounded-full flex items-center justify-center font-black text-sm border-2 bg-[#101410] text-white border-[rgba(255,255,255,0.14)] sports-font">
        {teamId}
        {isAHL && <span className="absolute -bottom-2 -right-2 bg-[#F59E0B] text-black text-[9px] px-1 rounded-sm font-black border border-black">AHL</span>}
      </div>
    );
  }

  return (
    <div className="relative w-12 h-12 rounded-full flex items-center justify-center font-black text-sm border-2 sports-font shadow-lg" style={{ backgroundColor: team.bg, color: team.color, borderColor: team.color }}>
      {team.id}
      {isAHL && <span className="absolute -bottom-2 -right-2 bg-[#F59E0B] text-black text-[9px] px-1 rounded-sm font-black border border-black">AHL</span>}
    </div>
  );
};

const Dashboard = ({ player, tier, statChanges, lgKey, isJunior, isAHL, onOpenShop }) => {
  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-3 mb-4 z-10 relative">
      <div className="game-panel p-6 relative flex justify-between items-center border-t-2 border-t-[#3b82f6]">
        <div className="flex items-center gap-5">
          <div className="text-center flex flex-col items-center justify-center">
            <p className="text-6xl font-black text-white sports-font leading-none tracking-tighter">{player.ovr}</p>
            <p className="text-[10px] font-bold text-slate-500 tracking-widest mt-1 font-sans">OVR</p>
          </div>

          <div className="flex items-center gap-4 border-l border-[rgba(255,255,255,0.065)] pl-5 ml-1">
            <div className="bg-[#101410] text-white rounded-xl w-14 h-14 flex items-center justify-center font-black text-3xl shadow-md sports-font shrink-0 border border-[rgba(255,255,255,0.065)]">
              {player.number}
            </div>

            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-1">
                <img
                  src={nationalities.find(n => n.id === player.nat)?.img}
                  alt={player.nat}
                  className="w-8 h-6 object-cover rounded-sm border border-[rgba(255,255,255,0.1)] shadow-sm"
                />
                <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tighter sports-font leading-none m-0 p-0">
                  {player.name}
                </h1>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-widest font-sans leading-none mt-1">
                {player.pos} · {getDeployment(player.ovr, player.pos, player.league)} · {isJunior ? `${player.league} JUNIORS` : (getTeamData(player.team, player.league)?.name || 'UNKNOWN')} · {player.age} YRS OLD
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-4 items-center">
          {!isJunior && (
            <button onClick={onOpenShop} className="bg-[#101410] hover:bg-[#1a2230] border border-[rgba(255,255,255,0.065)] rounded-xl px-5 py-3 text-sm font-bold shadow-sm transition-all flex items-center gap-2 font-sans text-white cursor-pointer">
              🛒 <span className="hidden sm:inline tracking-wide">SHOP</span>
            </button>
          )}
          {player.team && <TeamLogo teamId={player.team} league={player.league} isAHL={isAHL} />}
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {player.pos === 'G' ? (
          <>
            <div className="stat-box py-4 px-2 flex flex-col justify-center items-center">
              <p className="text-4xl font-black text-[#22E748] sports-font leading-none mb-1">{player.stats[lgKey]?.shots > 0 ? (player.stats[lgKey].saves / player.stats[lgKey].shots).toFixed(3).replace('0.', '.') : '.000'}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase font-sans leading-none">SV%</p>
            </div>
            <div className="stat-box py-4 px-2 flex flex-col justify-center items-center">
              <p className="text-4xl font-black text-white sports-font leading-none mb-1">{player.stats[lgKey]?.games > 0 ? ((player.stats[lgKey].shots - player.stats[lgKey].saves) / player.stats[lgKey].games).toFixed(2) : '0.00'}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase font-sans leading-none">GAA</p>
            </div>
            <div className="stat-box py-4 px-2 flex flex-col justify-center items-center">
              <p className="text-4xl font-black text-white sports-font leading-none mb-1">{player.stats[lgKey]?.shutouts || 0}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase font-sans leading-none">SHO</p>
            </div>
          </>
        ) : (
          <>
            <div className="stat-box py-4 px-2 flex flex-col justify-center items-center">
              <p className="text-4xl font-black text-[#22E748] sports-font leading-none mb-1">{player.stats[lgKey]?.goals || 0}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase font-sans leading-none">GOALS</p>
            </div>
            <div className="stat-box py-4 px-2 flex flex-col justify-center items-center">
              <p className="text-4xl font-black text-white sports-font leading-none mb-1">{player.stats[lgKey]?.assists || 0}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase font-sans leading-none">ASSISTS</p>
            </div>
            <div className="stat-box py-4 px-2 flex flex-col justify-center items-center">
              <p className="text-4xl font-black text-white sports-font leading-none mb-1">{player.stats[lgKey]?.plusMinus > 0 ? `+${player.stats[lgKey].plusMinus}` : (player.stats[lgKey]?.plusMinus || 0)}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase font-sans leading-none">+/-</p>
            </div>
          </>
        )}
        <div className="stat-box py-4 px-2 flex flex-col justify-center items-center">
          <p className="text-4xl font-black text-[#F59E0B] sports-font leading-none mb-1">{player.stats?.titles || 0}</p>
          <p className="text-[10px] font-bold text-slate-500 uppercase font-sans leading-none">TITLES</p>
        </div>
        <div className="stat-box py-4 px-2 flex flex-col justify-center items-center border-[#3b82f6]/30 bg-[#3b82f6]/5">
          <p className="text-4xl font-black text-[#3b82f6] sports-font leading-none mb-1">{formatMoney(player.stats?.value || 0)}</p>
          <p className="text-[10px] font-bold text-slate-500 uppercase font-sans leading-none">VALUE</p>
        </div>
        <div className="stat-box py-4 px-2 flex flex-col justify-center items-center border-[#F59E0B]/30 bg-[#F59E0B]/5">
          <p className="text-4xl font-black text-[#F59E0B] sports-font leading-none mb-1">{formatMoney(player.stats?.earnings || 0)}</p>
          <p className="text-[10px] font-bold text-slate-500 uppercase font-sans leading-none">EARNED</p>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {[
          { label: player.pos === 'G' ? 'REFLEXES' : 'SHOOTING', key: 'shooting', val: getActiveStat(player, 'shooting') },
          { label: player.pos === 'G' ? 'POSITIONING' : 'SKATING', key: 'skating', val: getActiveStat(player, 'skating') },
          { label: player.pos === 'G' ? 'AGILITY' : 'PHYSICALITY', key: 'physicality', val: getActiveStat(player, 'physicality') },
          { label: 'HOCKEY IQ', key: 'hockeyIQ', val: getActiveStat(player, 'hockeyIQ') },
          { label: 'STAMINA', key: 'stamina', val: getActiveStat(player, 'stamina') }
        ].map(attr => {
          const change = statChanges ? statChanges[attr.key] : 0;
          const isUpgraded = change > 0;
          const isDowngraded = change < 0;

          return (
            <div key={attr.label} className={`stat-box py-4 px-2 flex flex-col justify-center items-center relative transition-colors duration-500 ${isUpgraded ? 'bg-[#22E748]/10 border-[#22E748]/30' : isDowngraded ? 'bg-[#ef4444]/10 border-[#ef4444]/30' : ''}`}>
              {isUpgraded && <span className="absolute top-2 right-2 text-[#22E748] text-sm font-black tracking-tighter">▲{change}</span>}
              {isDowngraded && <span className="absolute top-2 right-2 text-[#ef4444] text-sm font-black tracking-tighter">▼{Math.abs(change)}</span>}
              <p className={`text-4xl font-black sports-font leading-none mb-1 ${isUpgraded ? 'text-[#22E748]' : isDowngraded ? 'text-[#ef4444]' : 'text-white'}`}>{attr.val}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase mt-1 font-sans leading-none">{attr.label}</p>
            </div>
          );
        })}
      </div>

      <div className="game-panel p-5 flex flex-col gap-3">
        <div className="flex justify-between items-end font-sans">
          <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1 leading-none">FAN STATUS: <span className="text-sm font-black text-white ml-1 sports-font">{tier.label}</span></p>
          {tier.req > 0 ? (
            <p className="text-[10px] font-bold text-slate-400 leading-none">Need {tier.req} pts to {tier.nextLabel}</p>
          ) : (
            <p className="text-[10px] font-bold text-[#F59E0B] leading-none">Max Icon Status 🏆</p>
          )}
        </div>
        <div className="w-full h-4 bg-[#101410] rounded-full overflow-hidden border border-[rgba(255,255,255,0.065)]">
          <div className="h-full bg-[#F59E0B] transition-all duration-500" style={{ width: `${(player.idolatry / 1000) * 100}%` }}></div>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [screen, setScreen] = useState('creation');
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [activeTrainings, setActiveTrainings] = useState([]);
  const [activeEvent, setActiveEvent] = useState(null);
  const [activeMinigame, setActiveMinigame] = useState(null);
  const [minigameContext, setMinigameContext] = useState('season');

  const [eventFeedback, setEventFeedback] = useState('');
  const [eventImpacts, setEventImpacts] = useState({});
  const [statChanges, setStatChanges] = useState(null);

  const [seasonRecap, setSeasonRecap] = useState(null);
  const [freeAgencyOffers, setFreeAgencyOffers] = useState([]);
  const [playoffs, setPlayoffs] = useState({ deck: [], revealed: [], wins: 0, status: 'playing' });
  const [memCup, setMemCup] = useState({ round: 0, status: 'playing' });
  const [pendingPlayoffs, setPendingPlayoffs] = useState(null);

  const [player, setPlayer] = useState({
    name: '', number: 97, pos: 'C', age: 16, ovr: 55, nat: 'CAN',
    shooting: 55, skating: 55, physicality: 55, hockeyIQ: 55, stamina: 55,
    team: null, league: null, contract: { salary: 0, years: 0 },
    stats: {
      chl: { goals: 0, assists: 0, games: 0, plusMinus: 0, saves: 0, shots: 0, shutouts: 0 },
      ahl: { goals: 0, assists: 0, games: 0, plusMinus: 0, saves: 0, shots: 0, shutouts: 0 },
      nhl: { goals: 0, assists: 0, games: 0, plusMinus: 0, saves: 0, shots: 0, shutouts: 0 },
      titles: 0, earnings: 0, value: 50000, seasonsPlayed: 0, memCupBoost: 0
    },
    idolatry: 0, inventory: [], buffs: [], agentRerolls: 1, teamsPlayedFor: []
  });

  const [unlockedAchievements, setUnlockedAchievements] = useState(() => {
    const saved = localStorage.getItem('hockey_achievements');
    return saved ? JSON.parse(saved) : [];
  });

  const unlockAchievement = (id) => {
    setUnlockedAchievements(prev => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      localStorage.setItem('hockey_achievements', JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    if (player.idolatry >= 1000) unlockAchievement('franchise_legend');
    if (player.stats.earnings >= 50000000) unlockAchievement('fifty_mil');
  }, [player.idolatry, player.stats.earnings]);

  const handleNewGame = () => {
    setPlayer({
      name: '', number: 97, pos: 'C', age: 16, ovr: 55, nat: 'CAN',
      shooting: 55, skating: 55, physicality: 55, hockeyIQ: 55, stamina: 55,
      team: null, league: null, contract: { salary: 0, years: 0 },
      stats: { 
        chl: { goals: 0, assists: 0, games: 0, plusMinus: 0, saves: 0, shots: 0, shutouts: 0 },
        ahl: { goals: 0, assists: 0, games: 0, plusMinus: 0, saves: 0, shots: 0, shutouts: 0 },
        nhl: { goals: 0, assists: 0, games: 0, plusMinus: 0, saves: 0, shots: 0, shutouts: 0 },
        titles: 0, earnings: 0, value: 50000, seasonsPlayed: 0, memCupBoost: 0 
      },
      idolatry: 0, inventory: [], buffs: [], agentRerolls: 1, teamsPlayedFor: []
    });
    setSeasonRecap(null);
    setActiveEvent(null);
    setPendingPlayoffs(null);
    setScreen('creation');
  };

  const currentYear = 2026 + player.stats.seasonsPlayed;
  const isJunior = juniorLeagues.includes(player.league);
  const isEuro = euroLeagues.includes(player.league);
  const isAHL = player.league === 'AHL';
  const lgKey = isJunior ? 'chl' : isAHL ? 'ahl' : 'nhl';

  const handleStart = () => {
    const leagues = ['OHL', 'WHL', 'QMJHL'];
    const assignedLeague = leagues[Math.floor(Math.random() * leagues.length)];
    const leagueTeams = assignedLeague === 'OHL' ? ohlTeams : assignedLeague === 'WHL' ? whlTeams : qmjhlTeams;
    const startTeam = leagueTeams[Math.floor(Math.random() * leagueTeams.length)];

    let bSht = 55, bSkt = 55, bPhy = 55, bIq = 55, bSta = 55;
    if (player.pos === 'C') { bIq = 65; bSkt = 60; bSht = 50; bPhy = 50; bSta = 50; }
    if (['LW', 'RW'].includes(player.pos)) { bSht = 65; bSkt = 60; bPhy = 50; bIq = 50; bSta = 50; }
    if (['LD', 'RD'].includes(player.pos)) { bPhy = 65; bSta = 60; bIq = 60; bSkt = 50; bSht = 40; }
    if (player.pos === 'G') { bSht = 65; bSkt = 65; bPhy = 60; bIq = 50; bSta = 35; }

    const startOvr = Math.floor((bSht + bSkt + bPhy + bIq + bSta) / 5);

    setPlayer(p => ({
      ...p, team: startTeam.id, league: assignedLeague, teamsPlayedFor: [startTeam.id],
      shooting: bSht, skating: bSkt, physicality: bPhy, hockeyIQ: bIq, stamina: bSta, ovr: startOvr
    }));
    generateTraining(player.pos);
    setScreen('preseason');
  };

  const advanceToOffseason = () => {
    if (player.age >= 38) { setScreen('retirement'); return; }

    const newBuffs = player.buffs.map(b => ({ ...b, duration: b.duration - 1 })).filter(b => b.duration > 0);

    let currentTeam = player.team;
    let currentLeague = player.league;

    if (currentLeague === 'AHL') {
      const parent = nhlTeams.find(t => t.ahlId === currentTeam);
      if (parent) {
        currentTeam = parent.id;
        currentLeague = 'NHL';
      }
    }

    setPlayer(p => ({ ...p, team: currentTeam, league: currentLeague, buffs: newBuffs }));

    if (player.age === 18 && isJunior) {
      handleDraftDay();
      return;
    }

    const isEuroLeague = euroLeagues.includes(currentLeague);

    if (isEuroLeague) {
      if (player.contract.years <= 0) {
        setPlayer(p => ({ ...p, contract: { salary: Math.round((p.contract.salary || 400000) * 1.1), years: 2 } }));
      }
      generateTraining(player.pos);
      setScreen('preseason');
    } else if (!isJunior && player.contract.years <= 0) {
      generateOffers(false, currentTeam);
    } else {
      generateTraining(player.pos);
      setScreen('preseason');
    }
  };

  const handleDraftDay = () => {
    const totalJuniorPoints = (player.stats.chl?.goals || 0) + (player.stats.chl?.assists || 0) + (player.stats?.memCupBoost || 0);
    let draftStr = '';
    let idolBoost = 0;

    const isElite = player.ovr >= 66 || (['LW', 'RW', 'C'].includes(player.pos) && totalJuniorPoints > 180);
    const isGreat = player.ovr >= 63 || (['LW', 'RW', 'C'].includes(player.pos) && totalJuniorPoints > 120);

    if (isElite) {
      draftStr = '1st Overall';
      idolBoost = 25;
      unlockAchievement('first_overall');
    } else if (isGreat) {
      const pick = Math.floor(Math.random() * 9) + 2;
      const suffix = pick === 2 ? 'nd' : pick === 3 ? 'rd' : 'th';
      draftStr = `with the ${pick}${suffix} Overall pick`;
      idolBoost = 15;
    } else {
      const round = Math.floor(Math.random() * 6) + 2;
      const suffix = round === 2 ? 'nd' : round === 3 ? 'rd' : 'th';
      draftStr = `in the ${round}${suffix} Round`;
      idolBoost = 5;
    }

    const draftedBy = nhlTeams[Math.floor(Math.random() * nhlTeams.length)];

    setPlayer(p => ({
      ...p, team: draftedBy.id, league: 'NHL', teamsPlayedFor: [...p.teamsPlayedFor, draftedBy.id], idolatry: capIdol(p.idolatry + idolBoost),
      contract: { salary: 925000, years: 3 }
    }));

    setSeasonRecap(r => ({ ...r, draftStr, draftedBy: draftedBy.name }));
    setEventFeedback(`You were drafted ${draftStr} by the ${draftedBy.name}! You signed a standard 3-year Entry Level Contract.`);
    setEventImpacts({ idol: idolBoost, money: 0, ovr: 0 });

    setScreen('draft');
  };

  const generateTraining = (pos) => {
    const activePool = pos === 'G' ? goalieTrainingPool : skaterTrainingPool;
    const commons = activePool.filter(t => t.rarity === 'Common');
    const rares = activePool.filter(t => t.rarity === 'Rare');
    const epics = activePool.filter(t => t.rarity === 'Epic');

    const hand = [];
    while (hand.length < 3) {
      const roll = Math.random();
      let selectedPool = commons;
      if (roll > 0.95) selectedPool = epics;
      else if (roll > 0.80) selectedPool = rares;

      const randomCard = selectedPool[Math.floor(Math.random() * selectedPool.length)];
      if (!hand.find(c => c.id === randomCard.id)) { hand.push(randomCard); }
    }
    setActiveTrainings(hand);
  };

  const handleTrain = (t) => {
    const result = simulateSeason(player, t.effect);

    setPlayer(result.updatedPlayer);
    setStatChanges(result.statChanges);
    setTimeout(() => setStatChanges(null), 3000);
    setSeasonRecap(result.recap);

    const nextYear = 2026 + result.updatedPlayer.stats.seasonsPlayed;

    if (result.isDemoted) {
      setActiveEvent({
        title: 'AHL DEMOTION',
        desc: `Your GM at the ${getTeamData(player.team, player.league)?.name || 'team'} thinks you'll benefit from some time in the AHL. You've been sent down to the ${getTeamData(result.currentTeam, result.currentLg)?.name || 'minors'}.`,
        choices: [
          { label: 'Complain to the media', isRisky: true, successChance: 0.3, successFeedback: 'The fans love your fiery passion. You vow to prove the GM wrong!', successEffect: { idol: 15, ovr: 1, money: 0 }, failFeedback: 'You look like a spoiled kid. The GM fines you and the fans turn on you.', failEffect: { idol: -15, ovr: -1, money: -50000 } },
          { label: 'Put your head down and work', isRisky: false, feedback: 'You accepted the assignment like a professional and focused on your game.', effect: { idol: 5, ovr: 1, money: 0 } }
        ],
        isDemotionEvent: true,
        currentLg: result.currentLg,
        currentTeam: result.currentTeam,
        madePlayoffs: result.madePlayoffs
      });
      setScreen('event');
    } else {
      runPostSeasonFlow(result.updatedPlayer.age, result.updatedPlayer.ovr, result.currentLg, result.currentTeam, result.madePlayoffs, nextYear, result.recap?.standings || 16);
    }
  };

  const runPostSeasonFlow = (pAge, pOvr, currentLg, currentTeam, madePlayoffs, nextYear, standings) => {
    if (pAge <= 19 && Math.random() > 0.4) {
      setMinigameContext('wjc');
      setScreen('intl-minigame');
      return;
    }
    if (pAge > 19 && nextYear % 4 === 0 && pOvr >= 78) {
      setMinigameContext('olympics');
      setScreen('intl-minigame');
      return;
    }

    if (Math.random() < 0.65) {
      setPendingPlayoffs(madePlayoffs ? { lg: currentLg, team: currentTeam, standings } : null);
      if (Math.random() < 0.55) {
        triggerMinigame('season');
      } else {
        setMinigameContext('season');
        const randomEvt = eventDeck[Math.floor(Math.random() * eventDeck.length)];
        setActiveEvent({ ...randomEvt, isDemotionEvent: false, madePlayoffs: false });
        setScreen('event');
      }
      return;
    }

    if (madePlayoffs) checkPlayoffs(currentLg, currentTeam, standings);
    else setScreen('recap');
  };

  const triggerMinigame = (context = 'season') => {
    const pool = getMinigamePool(player.pos);
    const pick = pool[Math.floor(Math.random() * pool.length)];
    setActiveMinigame(pick.id);
    setMinigameContext(context);
    setScreen('minigame');
  };

  const handleMinigameChoice = (successChance, successMsg, failMsg, reward) => {
    const scored = Math.random() < successChance;

    if (minigameContext === 'memcup') {
      setEventImpacts({});
      if (scored) {
        if (memCup.round === 0) {
          setMemCup({ round: 1, status: 'playing' });
          setEventFeedback('You won the Semi-Final! ' + successMsg);
        } else {
          setMemCup({ round: 1, status: 'won' });
          setPlayer(p => ({ ...p, stats: { ...p.stats, memCupBoost: 50, titles: p.stats.titles + 1 } }));
          setEventFeedback('You won the Memorial Cup! ' + successMsg);
          unlockAchievement('mem_cup');
        }
      } else {
        setMemCup({ ...memCup, status: 'lost' });
        setEventFeedback(failMsg);
      }
      setScreen('event-result');
      return;
    }

    if (minigameContext === 'wjc' || minigameContext === 'olympics') {
      const nat = nationalities.find(n => n.id === player.nat);
      const countryName = nat?.sentenceName || nat?.name || 'your country';
      if (scored) {
        unlockAchievement('gold_medal');
        setPlayer(prev => {
          const withOvr = applyOvrDelta(prev, 1);
          return { ...withOvr, idolatry: capIdol(withOvr.idolatry + 50), ovr: recomputeOvr(withOvr) };
        });
        setEventImpacts({ idol: 50, ovr: 1 });
        setEventFeedback(`You secured the Gold Medal for ${countryName}! You are a national hero! ` + successMsg);
      } else {
        setPlayer(prev => ({ ...prev, idolatry: capIdol(prev.idolatry - 5) }));
        setEventImpacts({ idol: -5 });
        setEventFeedback(`A devastating loss in the Gold Medal game. The fans in ${countryName} weep. ` + failMsg);
      }
      setScreen('event-result');
      return;
    }

    const payout = reward || { win: { idol: 5 }, loss: { idol: -2 } };
    const outcome = scored ? (payout.win || {}) : (payout.loss || {});

    setPlayer(prev => {
      const withOvr = applyOvrDelta(prev, outcome.ovr || 0);
      return {
        ...withOvr,
        idolatry: capIdol(withOvr.idolatry + (outcome.idol || 0)),
        ovr: recomputeOvr(withOvr),
        stats: { ...withOvr.stats, earnings: withOvr.stats.earnings + (outcome.money || 0) }
      };
    });
    setEventImpacts({ idol: outcome.idol || 0, ovr: outcome.ovr || 0, money: outcome.money || 0 });
    setEventFeedback(scored ? successMsg : failMsg);
    setScreen('event-result');
  };

  const handleEventChoice = (choice) => {
    let outcomeEffect;
    let outcomeFeedback;

    if (choice.isRisky) {
      const success = Math.random() < (choice.successChance || 0.5);
      outcomeEffect = success ? choice.successEffect : choice.failEffect;
      outcomeFeedback = success ? choice.successFeedback : choice.failFeedback;
    } else {
      outcomeEffect = choice.effect;
      outcomeFeedback = choice.feedback;
    }

    setPlayer(p => {
      const withOvr = applyOvrDelta(p, outcomeEffect.ovr || 0);
      return {
        ...withOvr,
        idolatry: capIdol(withOvr.idolatry + (outcomeEffect.idol || 0)),
        ovr: recomputeOvr(withOvr),
        stats: { ...withOvr.stats, earnings: withOvr.stats.earnings + (outcomeEffect.money || 0) }
      };
    });

    setEventImpacts(outcomeEffect);
    setEventFeedback(outcomeFeedback);
    setScreen('event-result');
  };

  const checkPlayoffs = (currentLg, currentTeamId, standings) => {
    const playoffSpots = LEAGUE_CONFIG[currentLg]?.playoffSpots || 16;
    const deck = generatePlayoffDeck(standings || 1, playoffSpots, currentLg, currentTeamId);
    setPlayoffs({ deck, revealed: [], wins: 0, status: 'playing' });
    setScreen('playoffs');
  };

  const handleGridClick = (index) => {
    if (playoffs.status !== 'playing' || playoffs.revealed.includes(index)) return;

    const result = playoffs.deck[index];

    if (!result.isWin) {
      setPlayoffs({ ...playoffs, revealed: [...playoffs.revealed, index], status: 'lost' });
      return;
    }

    const newWins = playoffs.wins + 1;
    let newStatus = 'playing';

    if (newWins === 4) {
      newStatus = 'won';
      if (player.league === 'NHL') unlockAchievement('stanley_cup');
      setPlayer(p => ({
        ...p, idolatry: capIdol(p.idolatry + 30),
        stats: { ...p.stats, titles: p.stats.titles + 1 }
      }));
    }
    setPlayoffs({ ...playoffs, revealed: [...playoffs.revealed, index], wins: newWins, status: newStatus });
  };

  const handleEndPlayoffs = () => {
    setSeasonRecap(r => ({ ...r, playoffWins: playoffs.wins, titleWon: playoffs.wins === 4 ? 1 : 0 }));
    setScreen('recap');
  };

  const proceedFromPlayoffs = () => {
    setSeasonRecap(r => ({ ...r, playoffWins: playoffs.wins, titleWon: playoffs.wins === 4 ? 1 : 0 }));
    if (playoffs.status === 'won' && isJunior) {
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
    const actingTeam = overrideTeam || player.team;
    const multi = player.inventory.includes('agent') ? 1.15 : 1.0;
    
    let baseSalary = 775000;
    let maxYears = 2;

    if (player.league === 'AHL' || isJunior) {
      baseSalary = (775000 + (Math.random() * 150000)) * multi;
      maxYears = 2;
    } else if (player.league === 'NHL') {
      if (player.ovr >= 85) {
        baseSalary = (7500000 + ((player.ovr - 85) * 1000000)) * multi;
        maxYears = 7;
      } else if (player.ovr >= 80) {
        baseSalary = (4500000 + ((player.ovr - 80) * 600000)) * multi;
        maxYears = 5;
      } else if (player.ovr >= 75) {
        baseSalary = (2000000 + ((player.ovr - 75) * 500000)) * multi;
        maxYears = 3;
      } else {
        baseSalary = (900000 + ((player.ovr - 70) * 100000)) * multi;
        maxYears = 2;
      }
    } else {
      baseSalary = 1000000 * multi;
      maxYears = 2;
    }

    baseSalary = Math.round(baseSalary / 25000) * 25000;

    let offers = [];
    const isRFA = player.age === 21;

    if (!isTradeRequest) {
      offers.push({
        team: actingTeam,
        type: isRFA ? 'RFA EXTENSION' : 'EXTENSION',
        salary: baseSalary,
        years: Math.min(3, maxYears),
        idolHit: 10
      });
    }

    let offerCount = isRFA ? (Math.random() > 0.5 ? 1 : 0) : 3;
    if (isTradeRequest) offerCount = 2;

    for (let i = 0; i < offerCount; i++) {
      const t = nhlTeams[Math.floor(Math.random() * nhlTeams.length)].id;
      if (t !== actingTeam && !offers.find(o => o.team === t)) {
        
        let offerSalary = baseSalary * (0.85 + (Math.random() * 0.35)); 
        if (isRFA && player.league === 'NHL') offerSalary *= 1.25; 
        
        offerSalary = Math.round(offerSalary / 25000) * 25000;

        offers.push({
          team: t,
          type: isRFA ? 'OFFER SHEET' : (isTradeRequest ? 'TRADE' : 'FREE AGENCY'),
          salary: Math.max(775000, offerSalary),
          years: Math.floor(Math.random() * maxYears) + 1,
          idolHit: getTransferImpact(actingTeam, t)
        });
      }
    }
    
    offers.sort((a, b) => b.salary - a.salary);
    setFreeAgencyOffers(offers);
    setScreen('transfer');
  };

  const handleTradeRequest = () => {
    setPlayer(p => ({ ...p, idolatry: capIdol(p.idolatry - 20) }));
    generateOffers(true, player.team);
  };

  const signContract = (o) => {
    setPlayer(p => {
      const newTeams = p.teamsPlayedFor.includes(o.team) ? p.teamsPlayedFor : [...p.teamsPlayedFor, o.team];
      return {
        ...p, team: o.team, league: 'NHL', idolatry: capIdol(p.idolatry + o.idolHit), teamsPlayedFor: newTeams,
        contract: { salary: o.salary, years: o.years }
      };
    });
    generateTraining(player.pos);
    setScreen('preseason');
  };

  const buyItem = (item) => {
    setPlayer(p => {
      if (p.stats.earnings < item.cost || p.inventory.includes(item.id)) return p;

      const stats = { ...p.stats, earnings: p.stats.earnings - item.cost };

      if (item.type === 'consumable') {
        return { ...p, stats, buffs: [...p.buffs, item] };
      }

      const next = { ...p, stats, inventory: [...p.inventory, item.id] };
      if (item.effect.stamina) next.stamina = cap(next.stamina + item.effect.stamina);
      if (item.effect.hockeyIQ) next.hockeyIQ = cap(next.hockeyIQ + item.effect.hockeyIQ);
      if (item.effect.idolatry) next.idolatry = capIdol(next.idolatry + item.effect.idolatry);
      return next;
    });
  };

  const handleContinueEvent = () => {
    if (minigameContext === 'memcup') {
      setMinigameContext('season');
      setScreen('memorial-cup');
    } else if (minigameContext === 'wjc' || minigameContext === 'olympics') {
      setMinigameContext('season');
      const playoffSpots = LEAGUE_CONFIG[player.league]?.playoffSpots || 16;
      if (seasonRecap && seasonRecap?.standings <= playoffSpots) {
        checkPlayoffs(player.league, player.team, seasonRecap?.standings);
      } else {
        setScreen('recap');
      }
    } else if (activeEvent && activeEvent.isDemotionEvent) {
      const lg = activeEvent.currentLg;
      const teamId = activeEvent.currentTeam;
      const madePlayoffsFlag = activeEvent.madePlayoffs;
      setActiveEvent(null);
      if (madePlayoffsFlag) checkPlayoffs(lg, teamId, seasonRecap?.standings || 16);
      else setScreen('recap');
    } else {
      setActiveEvent(null);
      if (pendingPlayoffs) {
        const pp = pendingPlayoffs;
        setPendingPlayoffs(null);
        checkPlayoffs(pp.lg, pp.team, pp.standings);
      } else {
        setScreen('recap');
      }
    }
  };

  const tier = getIdolTier(player.idolatry);

  if (screen === 'creation') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#040505] text-white">
        <div className="w-full max-w-xl game-panel p-10 text-center border-t-2 border-t-[#22E748]">
          <h2 className="text-[#22E748] font-bold tracking-widest mb-2 sports-font">CAREER MODE</h2>
          <h1 className="text-6xl font-black mb-10 text-white italic sports-font uppercase tracking-tighter">BLUE CHIP PROSPECT</h1>

          <input
            type="text" placeholder="Your Last Name"
            className="w-full bg-[#101410] border border-[rgba(255,255,255,0.065)] text-white p-4 rounded-lg mb-6 text-center font-bold focus:border-[#22E748] outline-none transition-all font-sans"
            onChange={(e) => setPlayer({ ...player, name: e.target.value })}
          />

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            {[
              { id: 'LW', name: 'Left Wing', num: 13 },
              { id: 'C', name: 'Center', num: 97 },
              { id: 'RW', name: 'Right Wing', num: 88 },
              { id: 'LD', name: 'Left Defense', num: 77 },
              { id: 'RD', name: 'Right Defense', num: 8 },
              { id: 'G', name: 'Goaltender', num: 31 }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setPlayer({ ...player, pos: p.id, number: p.num })}
                className={`p-4 rounded-xl border transition-colors cursor-pointer ${player.pos === p.id ? 'border-[#22E748] bg-[#22E748]/10' : 'border-[rgba(255,255,255,0.065)] bg-[#101410] hover:border-slate-500'}`}
              >
                <h3 className="text-3xl font-black text-white sports-font">{p.id}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 font-sans">{p.name}</p>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-10">
            {nationalities.map(n => (
              <button
                key={n.id}
                onClick={() => setPlayer({ ...player, nat: n.id })}
                className={`p-3 rounded-xl border transition-colors cursor-pointer ${player.nat === n.id ? 'border-[#22E748] bg-[#22E748]/10' : 'border-[rgba(255,255,255,0.065)] bg-[#101410] hover:border-slate-500'} flex items-center justify-center`}
              >
                <img src={n.img} alt={n.name} className="w-8 h-6 object-cover rounded-sm" />
              </button>
            ))}
          </div>

          <button onClick={handleStart} disabled={!player.name} className="w-full btn-primary py-4 rounded-lg text-xl disabled:opacity-50 mb-8 cursor-pointer sports-font tracking-widest">
            LACE UP THE SKATES
          </button>

          <div className="border-t border-[rgba(255,255,255,0.065)] pt-6">
            <h3 className="text-sm font-bold text-slate-400 tracking-widest uppercase mb-4 font-sans text-center">Career Achievements</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {MASTER_ACHIEVEMENTS.map(a => {
                const isUnlocked = unlockedAchievements.includes(a.id);
                return (
                  <div key={a.id} className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${isUnlocked ? 'bg-[#F59E0B]/10 border-[#F59E0B]/30' : 'bg-[#101410] border-[rgba(255,255,255,0.065)] opacity-50 grayscale'}`}>
                    <span className="text-2xl mb-1">{a.icon}</span>
                    <span className={`text-[10px] font-black uppercase tracking-widest sports-font leading-tight mb-1 ${isUnlocked ? 'text-[#F59E0B]' : 'text-slate-500'}`}>{a.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'retirement') {
    const isLegend = player.idolatry >= 1000;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#040505] text-white">
        <div className="w-full max-w-4xl game-panel p-12 border-t-2 border-t-[#22E748]">
          <p className="text-[#22E748] font-bold tracking-widest uppercase mb-3 text-center sports-font">END OF CAREER</p>
          <h1 className="text-6xl font-black italic mb-12 text-center sports-font tracking-tighter uppercase">{isLegend ? 'THEY BUILT YOU A STATUE' : 'YOU HUNG UP THE SKATES'}</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6 text-xl font-medium text-slate-300 font-sans">
              <h2 className="text-2xl font-black text-white border-b border-[rgba(255,255,255,0.065)] pb-2 sports-font uppercase">NHL CAREER STATS</h2>
              <div className="flex justify-between pb-2"><span className="text-slate-400">Games Played</span> <span className="font-bold text-white sports-font">{player.stats.nhl?.games || 0}</span></div>
              {player.pos === 'G' ? (
                <>
                  <div className="flex justify-between pb-2"><span className="text-slate-400">Career SV%</span> <span className="font-bold text-white sports-font">{player.stats.nhl?.shots > 0 ? (player.stats.nhl.saves / player.stats.nhl.shots).toFixed(3).replace('0.', '.') : '.000'}</span></div>
                  <div className="flex justify-between pb-2"><span className="text-slate-400">Shutouts</span> <span className="font-bold text-white sports-font">{player.stats.nhl?.shutouts || 0}</span></div>
                </>
              ) : (
                <>
                  <div className="flex justify-between pb-2"><span className="text-slate-400">Total Goals</span> <span className="font-bold text-white sports-font">{player.stats.nhl?.goals || 0}</span></div>
                  <div className="flex justify-between pb-2"><span className="text-slate-400">Assists</span> <span className="font-bold text-white sports-font">{player.stats.nhl?.assists || 0}</span></div>
                </>
              )}
              <div className="flex justify-between pb-2"><span className="text-slate-400">Titles Won</span> <span className="text-[#F59E0B] font-black text-2xl sports-font">{player.stats?.titles || 0}</span></div>
              <div className="flex justify-between pt-2 border-t border-[rgba(255,255,255,0.065)]"><span className="text-slate-400">Career Earnings</span> <span className="font-bold text-[#22E748] text-2xl sports-font">{formatMoney(player.stats?.earnings || 0)}</span></div>
            </div>
          </div>
          <div className="mt-12 text-center">
            <button onClick={handleNewGame} className="btn-primary py-4 px-12 rounded-xl text-xl cursor-pointer sports-font tracking-widest uppercase">
              START NEW CAREER
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-3 md:p-6 flex flex-col font-sans bg-[#040505] text-white">
      {isShopOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md game-panel h-full flex flex-col border border-[#22E748]">
            <div className="flex justify-between items-center p-6 border-b border-[rgba(255,255,255,0.065)] bg-[#101410] rounded-t-xl">
              <h2 className="text-2xl font-bold text-white sports-font tracking-wide">SHOP</h2>
              <div className="text-right">
                <p className="text-[#22E748] font-black text-2xl sports-font">{formatMoney(player.stats.earnings)}</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {['staff', 'consumable', 'luxury'].map(category => (
                <div key={category} className="mb-6">
                  <h3 className="text-sm font-bold text-slate-400 tracking-widest uppercase mb-3 border-b border-[rgba(255,255,255,0.065)] pb-2 font-sans">
                    {category === 'staff' ? '💪 PERMANENT STAFF' : category === 'consumable' ? '⏳ TEMPORARY BOOSTS' : '💎 LUXURY & FANS'}
                  </h3>
                  <div className="space-y-3">
                    {shopItems.filter(i => i.type === category).map(item => {
                      const isOwned = player.inventory.includes(item.id) || player.buffs.find(b => b.id === item.id);
                      const canAfford = player.stats.earnings >= item.cost;
                      let displayedDesc = player.pos === 'G' && item.descGoalies ? item.descGoalies : item.desc;
                      return (
                        <div key={item.id} className={`p-4 rounded-xl border ${isOwned ? 'border-[#22E748]/50 bg-[#22E748]/10' : 'border-[rgba(255,255,255,0.065)] bg-[#101410]'}`}>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-bold text-white text-lg font-sans">{item.name}</p>
                              <p className="text-xs text-slate-400 mt-1">{displayedDesc}</p>
                            </div>
                            <p className={`font-black sports-font ${isOwned ? 'text-[#22E748]' : 'text-slate-400'}`}>
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

      <Dashboard 
        player={player} tier={tier} statChanges={statChanges} 
        lgKey={lgKey} isJunior={isJunior} isAHL={isAHL} 
        onOpenShop={() => setIsShopOpen(true)} 
      />

      <div className="w-full max-w-5xl mx-auto pb-10">

        {screen === 'draft' && (
          <div className="game-panel p-10 mt-2 text-center border-t-2 border-t-[#22E748]">
            <h2 className="text-4xl font-black text-white uppercase mb-6 sports-font tracking-tighter">DRAFT DAY</h2>
            <p className="text-2xl italic text-slate-300 mb-10 leading-relaxed max-w-2xl mx-auto text-left font-sans">"{eventFeedback}"</p>
            <button onClick={() => { generateTraining(player.pos); setScreen('preseason'); }} className="btn-primary py-4 px-12 rounded-xl text-xl cursor-pointer sports-font tracking-widest">START ROOKIE SEASON</button>
          </div>
        )}

        {screen === 'preseason' && (
          <div className="game-panel p-10 mt-2 border-t-2 border-t-[#22E748]">
            <h2 className="text-4xl font-black italic text-white uppercase mb-2 text-center sports-font tracking-tighter">PRE-SEASON {currentYear}</h2>
            <p className="text-slate-400 text-center mb-10 font-medium text-lg font-sans">The dice rolled three upgrades. Pick one focus.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {activeTrainings.map(t => (
                <div
                  key={t.id} onClick={() => handleTrain(t)}
                  className={`bg-[#101410] border border-[rgba(255,255,255,0.065)] rounded-xl cursor-pointer transition-all hover:-translate-y-1 flex flex-col min-h-[16rem] ${t.rarity === 'Epic' ? 'hover:border-[#F59E0B]' : t.rarity === 'Rare' ? 'hover:border-[#3b82f6]' : 'hover:border-[#22E748]'}`}
                >
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        {t.rarity !== 'Common' ? (
                          <span className={`text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest font-sans ${t.rarity === 'Epic' ? 'bg-[#F59E0B] text-black' : 'bg-[#3b82f6] text-white'}`}>{t.rarity}</span>
                        ) : <span></span>}
                        <span className="text-4xl font-black text-slate-700 uppercase sports-font tracking-tighter">{t.tag}</span>
                      </div>
                      <h3 className="text-2xl font-black text-white uppercase leading-tight mb-3 text-left sports-font mt-2">{t.name}</h3>
                      <p className="text-sm text-slate-400 leading-relaxed italic text-left font-sans mb-4">{t.flavor}</p>
                    </div>
                    <div className="mt-auto text-left pt-4 border-t border-[rgba(255,255,255,0.065)]">
                      <span className="inline-block text-[#22E748] font-bold text-sm font-sans mt-2">{t.desc}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {screen === 'intl-minigame' && (() => {
          const nat = nationalities.find(n => n.id === player.nat);
          const countryName = nat?.sentenceName || nat?.name || 'your country';

          return (
            <div className="game-panel p-12 mt-2 border-t-2 border-t-[#F59E0B] text-center">
              <h2 className="text-5xl font-black mb-4 text-[#F59E0B] sports-font tracking-tighter uppercase">🌍 INTERNATIONAL DUTY 🌍</h2>
              <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto leading-relaxed flex items-center justify-center flex-wrap gap-2 text-left">
                You are representing <span className="font-black text-white flex items-center gap-2">{countryName} <img src={nat?.img} alt={player.nat} className="w-6 h-4 object-cover rounded-[2px] border border-slate-600" /></span> in the {minigameContext === 'wjc' ? 'World Junior Gold Medal game' : 'Winter Games Final'}!
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {player.pos === 'G' ? (
                  <>
                    <button onClick={() => handleMinigameChoice(0.4 + player.physicality / 200, 'You smothered the rebound!', 'You gave up a juicy rebound.')} className="bg-[#101410] border border-[rgba(255,255,255,0.065)] hover:border-[#F59E0B] py-8 px-4 rounded-xl font-bold text-2xl text-white transition-all cursor-pointer flex flex-col items-center sports-font">
                      Swallow Rebound <span className="text-sm text-[#F59E0B] font-normal mt-3 bg-[#F59E0B]/10 px-3 py-1 rounded-full uppercase tracking-widest font-sans border border-[#F59E0B]/30">AGI</span>
                    </button>
                    <button onClick={() => handleMinigameChoice(0.4 + player.hockeyIQ / 200, 'You perfectly directed traffic!', 'You were out of position.')} className="bg-[#101410] border border-[rgba(255,255,255,0.065)] hover:border-[#22E748] py-8 px-4 rounded-xl font-bold text-2xl text-white transition-all cursor-pointer flex flex-col items-center sports-font">
                      Direct Traffic <span className="text-sm text-[#22E748] font-normal mt-3 bg-[#22E748]/10 px-3 py-1 rounded-full uppercase tracking-widest font-sans border border-[#22E748]/30">IQ</span>
                    </button>
                    <button onClick={() => handleMinigameChoice(0.4 + (player.shooting + player.physicality) / 400, 'You made an unbelievable save!', "Couldn't get there in time.")} className="bg-[#101410] border border-[rgba(255,255,255,0.065)] hover:border-[#3b82f6] py-8 px-4 rounded-xl font-bold text-2xl text-white transition-all cursor-pointer flex flex-col items-center sports-font">
                      Desperation Save <span className="text-sm text-[#3b82f6] font-normal mt-3 bg-[#3b82f6]/10 px-3 py-1 rounded-full uppercase tracking-widest font-sans border border-[#3b82f6]/30">REF + AGI</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => handleMinigameChoice(0.4 + player.physicality / 200, 'You laid a massive hit!', 'You missed the hit.')} className="bg-[#101410] border border-[rgba(255,255,255,0.065)] hover:border-[#F59E0B] py-8 px-4 rounded-xl font-bold text-2xl text-white transition-all cursor-pointer flex flex-col items-center sports-font">
                      Big Hit <span className="text-sm text-[#F59E0B] font-normal mt-3 bg-[#F59E0B]/10 px-3 py-1 rounded-full uppercase tracking-widest font-sans border border-[#F59E0B]/30">PHY</span>
                    </button>
                    <button onClick={() => handleMinigameChoice(0.4 + player.hockeyIQ / 200, 'You found the soft spot!', 'Skated into coverage.')} className="bg-[#101410] border border-[rgba(255,255,255,0.065)] hover:border-[#22E748] py-8 px-4 rounded-xl font-bold text-2xl text-white transition-all cursor-pointer flex flex-col items-center sports-font">
                      Find Open Ice <span className="text-sm text-[#22E748] font-normal mt-3 bg-[#22E748]/10 px-3 py-1 rounded-full uppercase tracking-widest font-sans border border-[#22E748]/30">IQ</span>
                    </button>
                    <button onClick={() => handleMinigameChoice(0.4 + (player.skating + player.shooting) / 400, 'You ripped it top shelf!', 'Fumbled the puck.')} className="bg-[#101410] border border-[rgba(255,255,255,0.065)] hover:border-[#3b82f6] py-8 px-4 rounded-xl font-bold text-2xl text-white transition-all cursor-pointer flex flex-col items-center sports-font">
                      Rush the Net <span className="text-sm text-[#3b82f6] font-normal mt-3 bg-[#3b82f6]/10 px-3 py-1 rounded-full uppercase tracking-widest font-sans border border-[#3b82f6]/30">SKT + SHT</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })()}

        {screen === 'recap' && (() => {
          let narrative = '';
          let narrativeTitle = '';
          let displayRating = Math.round(seasonRecap?.rating || 5);
          const playoffSpots = LEAGUE_CONFIG[player.league]?.playoffSpots || 16;
          const madePlayoffsForNarrative = (seasonRecap?.standings || 16) <= playoffSpots;

          if (isJunior) {
            if (seasonRecap?.memCupStatus === 'won') {
              narrativeTitle = 'MEMORIAL CUP CHAMPIONS';
              narrative = 'You conquered junior hockey.';
            } else if (seasonRecap?.playoffWins === 4) {
              narrativeTitle = 'LEAGUE CHAMPIONS';
              narrative = 'You won your league but fell short of the Memorial Cup.';
            } else {
              narrativeTitle = 'BACK TO CLASS';
              narrative = 'Your junior season ended. Time to hit the weight room.';
            }
          } else if (player.league === 'AHL') {
             narrativeTitle = seasonRecap?.playoffWins === 4 ? 'CALDER CUP CHAMPIONS' : 'MINOR LEAGUE GRIND';
             narrative = "A grueling year in the AHL bus leagues.";
          } else {
            if (madePlayoffsForNarrative) {
              if (seasonRecap?.playoffWins === 4) {
                narrativeTitle = 'STANLEY CUP CHAMPIONS';
                narrative = 'Absolute glory. You climbed the mountain and won it all!';
              } else {
                narrativeTitle = 'PLAYOFF EXIT';
                narrative = 'A solid season erased by a playoff elimination.';
              }
            } else {
               narrativeTitle = 'MISSED THE DANCE';
               narrative = 'A disappointing campaign. Rebuild for next year.';
            }
          }

          return (
            <div className="game-panel p-10 mt-2 border-t-2 border-t-[#3b82f6]">
              <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.065)] pb-4 mb-6">
                <h2 className="text-[#3b82f6] font-bold tracking-widest uppercase text-lg sports-font">THE RINK REPORT</h2>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">
                  {isJunior ? 'JUNIOR CAMPAIGN' : `NHL SEASON ${player.stats.seasonsPlayed - 2}`}
                </p>
              </div>

              <div className="w-full mb-8">
                <div className="flex flex-wrap items-center gap-4 mb-2">
                  <h1 className="text-4xl font-black text-white italic uppercase text-left sports-font tracking-tighter m-0">
                    {narrativeTitle}
                  </h1>
                  <div className={`px-3 py-1.5 rounded-lg flex items-center gap-2.5 border ${displayRating >= 8 ? 'bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#F59E0B]' : 'bg-[#101410] border-[rgba(255,255,255,0.065)] text-slate-300'}`}>
                    <div className="flex flex-col text-right justify-center mt-0.5">
                      <span className="text-[9px] font-bold tracking-widest uppercase font-sans leading-none mb-[2px]">SEASON</span>
                      <span className="text-[9px] font-bold tracking-widest uppercase font-sans leading-none">RATING</span>
                    </div>
                    <span className="text-3xl font-black sports-font leading-none">{displayRating}</span>
                  </div>
                </div>
                <p className="text-lg text-slate-400 font-sans italic text-left m-0">"{narrative}"</p>
              </div>

              <ul className="space-y-4 text-slate-300 text-lg mb-10 font-sans text-left">
                <li className="border-l-4 border-[#3b82f6] pl-4 py-1">🏅 {getTeamData(player.team, player.league)?.name || 'Your team'} finished <strong className="text-white">#{seasonRecap?.standings || '-'}</strong>.</li>
                {madePlayoffsForNarrative ? (
                  <li className={`border-l-4 ${seasonRecap?.playoffWins === 4 ? 'border-[#F59E0B] text-[#F59E0B] font-bold' : 'border-[#ef4444]'} pl-4 py-1`}>
                    {seasonRecap?.playoffWins === 4 ? '🏆 Won the Cup!' : `Eliminated after ${seasonRecap?.playoffWins || 0} playoff wins.`}
                  </li>
                ) : (
                  <li className="border-l-4 border-slate-600 pl-4 py-1">⛳ Missed the playoffs.</li>
                )}
              </ul>

              <div className="flex gap-4 mt-8">
                <button onClick={advanceToOffseason} className="btn-primary flex-1 py-4 rounded-xl text-xl cursor-pointer sports-font tracking-widest">
                  PROCEED TO OFFSEASON
                </button>
              </div>
            </div>
          );
        })()}

        {screen === 'event' && (
          <div className="game-panel p-10 mt-2 border-t-2 border-t-[#3b82f6]">
            <h2 className="text-2xl font-black text-white uppercase mb-4 sports-font text-left">🗣 {activeEvent.title}</h2>
            <p className="text-lg text-slate-300 mb-8 max-w-2xl font-sans text-left">{activeEvent.desc}</p>
            <div className="flex flex-col gap-4 font-sans">
              {activeEvent.choices.map((c, i) => (
                <button key={i} onClick={() => handleEventChoice(c)} className="bg-[#101410] hover:bg-[#1a2230] border border-[rgba(255,255,255,0.065)] text-white p-6 rounded-xl font-bold text-left transition-all cursor-pointer flex justify-between items-center">
                  <span>{c.label}</span>
                  {c.isRisky && <span className="bg-[#ef4444]/10 text-[#ef4444] text-xs px-2 py-1 rounded font-black tracking-widest uppercase border border-[#ef4444]/30">RISKY</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {screen === 'minigame' && (() => {
          const mg = findMinigame(activeMinigame, player.pos);
          const accent = ACCENT[mg.accent] || ACCENT.blue;

          return (
            <div className={`game-panel p-12 mt-2 border-t-2 ${accent.border} text-center`}>
              <h2 className={`text-5xl font-black mb-4 ${accent.heading} sports-font tracking-tighter uppercase`}>{mg.title}</h2>
              <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto text-left">{mg.desc}</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {mg.choices.map((c, i) => {
                  const chance = choiceChance(player, c);
                  const pill = ARCH_PILL[c.archetype] || ARCH_PILL.safe;
                  return (
                    <button key={i} onClick={() => handleMinigameChoice(chance, c.success, c.fail, c.reward)} className={`bg-[#101410] hover:bg-[#1a2230] border border-[rgba(255,255,255,0.065)] ${pill.hover} py-7 px-4 rounded-xl font-bold text-2xl text-white transition-all cursor-pointer flex flex-col items-center sports-font`}>
                      {c.label}
                      <span className={`text-xs font-black mt-3 px-3 py-1 rounded-full uppercase tracking-widest font-sans border ${pill.cls}`}>
                        {pill.label} · {Math.round(chance * 100)}%
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {screen === 'event-result' && (
          <div className="game-panel p-10 mt-2 text-center border-t-2 border-t-[#22E748]">
            <h2 className="text-2xl font-black text-white uppercase mb-6 sports-font">THE AFTERMATH</h2>
            <p className="text-xl italic text-slate-300 mb-8 max-w-2xl mx-auto text-left">"{eventFeedback}"</p>
            <button onClick={handleContinueEvent} className="btn-primary py-4 px-12 rounded-xl text-xl cursor-pointer sports-font tracking-widest">CONTINUE CAREER ➔</button>
          </div>
        )}

        {screen === 'playoffs' && (
          <div className="game-panel p-10 mt-2 border-t-2 border-t-[#F59E0B] text-center">
            <h2 className="text-4xl font-black tracking-widest mb-2 text-[#F59E0B] sports-font">🏆 PLAYOFFS 🏆</h2>
            <h3 className="text-2xl font-bold mb-8 bg-[#101410] px-6 py-3 rounded-xl border border-[rgba(255,255,255,0.065)] inline-block sports-font">
              WINS FOUND: <span className="text-[#22E748]">{playoffs.wins}</span> / 4
            </h3>
            <div className="grid grid-cols-4 gap-3 mb-10 max-w-2xl mx-auto">
              {playoffs.deck.map((item, index) => {
                const isRevealed = playoffs.revealed.includes(index);
                const showForcefully = playoffs.status !== 'playing' && !isRevealed;
                let btnClass = 'h-20 sm:h-24 text-lg sm:text-xl font-black rounded-xl border transition-all flex flex-col items-center justify-center cursor-pointer sports-font ';
                if (isRevealed || showForcefully) {
                  btnClass += !item.isWin ? 'bg-[#ef4444] border-[#ef4444] text-white' : 'bg-[#22E748] border-[#22E748] text-black';
                } else {
                  btnClass += 'bg-[#101410] border-[rgba(255,255,255,0.065)] text-slate-500 hover:border-slate-500 hover:text-white';
                }
                return (
                  <button key={index} onClick={() => handleGridClick(index)} className={btnClass} disabled={playoffs.status !== 'playing' || isRevealed}>
                    {(isRevealed || showForcefully) ? (<><span>{item.opp}</span><span>{item.score}</span></>) : '?'}
                  </button>
                );
              })}
            </div>
            {playoffs.status === 'won' && <button onClick={proceedFromPlayoffs} className="btn-primary py-4 px-12 rounded-xl cursor-pointer sports-font tracking-widest">CONTINUE</button>}
            {playoffs.status === 'lost' && <button onClick={handleEndPlayoffs} className="bg-[#101410] hover:bg-[#1a2230] border border-[rgba(255,255,255,0.065)] text-white py-4 px-12 rounded-xl cursor-pointer sports-font tracking-widest">CONTINUE</button>}
          </div>
        )}

        {screen === 'transfer' && (
          <div className="game-panel p-10 mt-2 border-t-2 border-t-[#3b82f6]">
            <h2 className="text-4xl font-black italic text-white uppercase mb-4 text-center sports-font tracking-tighter">FREE AGENCY</h2>
            <p className="text-slate-400 text-lg mb-10 font-medium text-center">The market speaks. Glory or money?</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {freeAgencyOffers.map((o, i) => (
                <div key={i} className="bg-[#101410] border border-[rgba(255,255,255,0.065)] p-6 rounded-xl flex flex-col text-left">
                  <div className="flex items-center gap-3 mb-4">
                    <TeamLogo teamId={o.team} league="NHL" />
                    <h3 className="text-2xl font-black text-white sports-font">{o.team}</h3>
                  </div>
                  <p className="text-3xl font-black text-[#22E748] mb-1 sports-font">{formatMoney(o.salary)}<span className="text-sm text-slate-400 font-sans"> /yr</span></p>
                  <p className="text-xs font-bold text-slate-400 uppercase mb-6">{o.years}-year contract</p>
                  <button onClick={() => signContract(o)} className="w-full btn-primary py-3 rounded-lg cursor-pointer sports-font tracking-widest">SIGN DEAL</button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;