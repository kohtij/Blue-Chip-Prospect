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
  red:     { border: 'border-t-red-500',     heading: 'text-red-600 dark:text-red-400' },
  blue:    { border: 'border-t-blue-500',    heading: 'text-blue-600 dark:text-blue-400' },
  emerald: { border: 'border-t-emerald-500', heading: 'text-emerald-600 dark:text-emerald-400' },
  amber:   { border: 'border-t-amber-400',   heading: 'text-amber-500 dark:text-amber-400' },
};

const ARCH_PILL = {
  safe:   { label: 'SAFE',   cls: 'text-slate-600 bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300', hover: 'hover:border-slate-400 dark:hover:border-slate-500' },
  skill:  { label: 'SKILL',  cls: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-400', hover: 'hover:border-emerald-400 dark:hover:border-emerald-500' },
  gamble: { label: 'GAMBLE', cls: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-400', hover: 'hover:border-amber-400 dark:hover:border-amber-500' },
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
      <div className="relative w-12 h-12 flex items-center justify-center bg-white dark:bg-slate-800 rounded-full p-1 shadow-sm border border-slate-200 dark:border-slate-700">
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
      <div className="relative w-12 h-12 rounded-full flex items-center justify-center font-black text-sm border-2 shadow-sm bg-slate-800 text-white border-slate-600 sports-font">
        {teamId}
        {isAHL && <span className="absolute -bottom-2 -right-2 bg-amber-500 text-slate-900 text-[9px] px-1 rounded-sm font-black border border-amber-700">AHL</span>}
      </div>
    );
  }

  return (
    <div className="relative w-12 h-12 rounded-full flex items-center justify-center font-black text-sm border-2 shadow-sm sports-font" style={{ backgroundColor: team.bg, color: team.color, borderColor: team.color }}>
      {team.id}
      {isAHL && <span className="absolute -bottom-2 -right-2 bg-amber-500 text-slate-900 text-[9px] px-1 rounded-sm font-black border border-amber-700">AHL</span>}
    </div>
  );
};

const Dashboard = ({ player, tier, statChanges, lgKey, isJunior, isAHL, onOpenShop, isDarkMode, toggleTheme }) => {
  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-3 mb-4 z-10 relative">
      <div className="glass-card rounded-2xl p-4 px-6 relative flex justify-between items-center">
        <div className="flex items-center gap-5">
          <div className="text-center flex flex-col items-center justify-center">
            <p className="text-6xl font-black text-slate-900 dark:text-white sports-font leading-none">{player.ovr}</p>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-widest mt-1 font-sans">OVR</p>
          </div>

          <div className="flex items-center gap-4 border-l-2 border-slate-200 dark:border-slate-700 pl-5 ml-1">
            <div className="bg-slate-900 dark:bg-black text-white rounded-xl w-14 h-14 flex items-center justify-center font-black text-3xl shadow-md sports-font shrink-0 border dark:border-slate-700">
              {player.number}
            </div>

            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-1">
                <img
                  src={nationalities.find(n => n.id === player.nat)?.img}
                  alt={player.nat}
                  className="w-[30px] h-[20px] object-cover rounded-sm border border-slate-300 dark:border-slate-600 shadow-sm block"
                />
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter sports-font leading-[0.8] -mt-1 m-0 p-0">
                  {player.name}
                </h1>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest font-sans leading-none mt-1">
                {player.pos} · {getDeployment(player.ovr, player.pos, player.league)} · {isJunior ? `${player.league} JUNIORS` : getTeamData(player.team, player.league).name} · {player.age} YRS OLD
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-4 items-center">
          <button 
            onClick={toggleTheme} 
            className="w-12 h-12 flex items-center justify-center bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-full shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-xl cursor-pointer"
            title="Toggle Theme"
          >
            {isDarkMode ? '🌙' : '☀️'}
          </button>
          {!isJunior && (
            <button onClick={onOpenShop} className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-5 py-3 text-sm font-bold shadow-sm transition-all flex items-center gap-2 font-sans cursor-pointer">
              🛒 <span className="hidden sm:inline tracking-wide">SHOP</span>
            </button>
          )}
          {player.team && <TeamLogo teamId={player.team} league={player.league} isAHL={isAHL} />}
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {player.pos === 'G' ? (
          <>
            <div className="glass-card rounded-xl py-4 px-2 flex flex-col justify-center items-center">
              <p className="text-4xl font-black text-emerald-600 dark:text-emerald-400 sports-font leading-none mb-1">{player.stats[lgKey].shots > 0 ? (player.stats[lgKey].saves / player.stats[lgKey].shots).toFixed(3).replace('0.', '.') : '.000'}</p>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase font-sans leading-none">SV%</p>
            </div>
            <div className="glass-card rounded-xl py-4 px-2 flex flex-col justify-center items-center">
              <p className="text-4xl font-black text-slate-900 dark:text-white sports-font leading-none mb-1">{player.stats[lgKey].games > 0 ? ((player.stats[lgKey].shots - player.stats[lgKey].saves) / player.stats[lgKey].games).toFixed(2) : '0.00'}</p>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase font-sans leading-none">GAA</p>
            </div>
            <div className="glass-card rounded-xl py-4 px-2 flex flex-col justify-center items-center">
              <p className="text-4xl font-black text-slate-900 dark:text-white sports-font leading-none mb-1">{player.stats[lgKey].shutouts}</p>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase font-sans leading-none">SHO</p>
            </div>
          </>
        ) : (
          <>
            <div className="glass-card rounded-xl py-4 px-2 flex flex-col justify-center items-center">
              <p className="text-4xl font-black text-emerald-600 dark:text-emerald-400 sports-font leading-none mb-1">{player.stats[lgKey].goals}</p>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase font-sans leading-none">GOALS</p>
            </div>
            <div className="glass-card rounded-xl py-4 px-2 flex flex-col justify-center items-center">
              <p className="text-4xl font-black text-slate-900 dark:text-white sports-font leading-none mb-1">{player.stats[lgKey].assists}</p>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase font-sans leading-none">ASSISTS</p>
            </div>
            <div className="glass-card rounded-xl py-4 px-2 flex flex-col justify-center items-center">
              <p className="text-4xl font-black text-slate-900 dark:text-white sports-font leading-none mb-1">{player.stats[lgKey].plusMinus > 0 ? `+${player.stats[lgKey].plusMinus}` : player.stats[lgKey].plusMinus}</p>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase font-sans leading-none">+/-</p>
            </div>
          </>
        )}
        <div className="glass-card rounded-xl py-4 px-2 flex flex-col justify-center items-center">
          <p className="text-4xl font-black text-amber-500 dark:text-amber-400 sports-font leading-none mb-1">{player.stats.titles}</p>
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase font-sans leading-none">TITLES</p>
        </div>
        <div className="glass-card rounded-xl py-4 px-2 flex flex-col justify-center items-center bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900/50">
          <p className="text-4xl font-black text-blue-600 dark:text-blue-400 sports-font leading-none mb-1">{formatMoney(player.stats.value)}</p>
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase font-sans leading-none">VALUE</p>
        </div>
        <div className="glass-card rounded-xl py-4 px-2 flex flex-col justify-center items-center bg-amber-50/50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900/50">
          <p className="text-4xl font-black text-amber-600 dark:text-amber-500 sports-font leading-none mb-1">{formatMoney(player.stats.earnings)}</p>
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase font-sans leading-none">EARNED</p>
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
            <div key={attr.label} className={`glass-card rounded-xl py-4 px-2 flex flex-col justify-center items-center relative transition-colors duration-500 ${isUpgraded ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-800' : isDowngraded ? 'bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-800' : 'bg-white dark:bg-slate-800'}`}>
              {isUpgraded && <span className="absolute top-2 right-2 text-emerald-500 dark:text-emerald-400 text-sm font-black tracking-tighter">▲{change}</span>}
              {isDowngraded && <span className="absolute top-2 right-2 text-red-500 dark:text-red-400 text-sm font-black tracking-tighter">▼{Math.abs(change)}</span>}
              <p className={`text-4xl font-black sports-font leading-none mb-1 ${isUpgraded ? 'text-emerald-600 dark:text-emerald-400' : isDowngraded ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>{attr.val}</p>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mt-1 font-sans leading-none">{attr.label}</p>
            </div>
          );
        })}
      </div>

      <div className="glass-card rounded-xl p-5 flex flex-col gap-3">
        <div className="flex justify-between items-end font-sans">
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-widest uppercase mb-1 leading-none">FAN STATUS: <span className="text-sm font-black text-slate-900 dark:text-white ml-1 sports-font">{tier.label}</span></p>
          {tier.req > 0 ? (
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-none">Need {tier.req} pts to {tier.nextLabel}</p>
          ) : (
            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 leading-none">Max Icon Status 🏆</p>
          )}
        </div>
        <div className="w-full h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
          <div className="h-full bg-gradient-to-r from-orange-400 via-amber-400 to-emerald-500 transition-all duration-500" style={{ width: `${(player.idolatry / 1000) * 100}%` }}></div>
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

  // --- THEME ENGINE ---
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('hockey_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('hockey_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('hockey_theme', 'light');
    }
  }, [isDarkMode]);

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
    const totalJuniorPoints = player.stats.chl.goals + player.stats.chl.assists + player.stats.memCupBoost;
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
      ...p, team: draftedBy.id, league: 'NHL', teamsPlayedFor: [draftedBy.id], idolatry: capIdol(p.idolatry + idolBoost),
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
        desc: `Your GM at the ${getTeamData(player.team, player.league).name} thinks you'll benefit from some time in the AHL. You've been sent down to the ${getTeamData(result.currentTeam, result.currentLg).name}.`,
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
      runPostSeasonFlow(result.updatedPlayer.age, result.updatedPlayer.ovr, result.currentLg, result.currentTeam, result.madePlayoffs, nextYear, result.recap.standings);
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
      const countryName = nat?.sentenceName || nat?.name;
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
      if (seasonRecap && seasonRecap.standings <= playoffSpots) {
        checkPlayoffs(player.league, player.team, seasonRecap.standings);
      } else {
        setScreen('recap');
      }
    } else if (activeEvent && activeEvent.isDemotionEvent) {
      const lg = activeEvent.currentLg;
      const teamId = activeEvent.currentTeam;
      const madePlayoffsFlag = activeEvent.madePlayoffs;
      setActiveEvent(null);
      if (madePlayoffsFlag) checkPlayoffs(lg, teamId, seasonRecap?.standings);
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
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
        <div className="w-full max-w-xl glass-card rounded-2xl p-10 text-center">
          <h2 className="text-emerald-600 dark:text-emerald-400 font-bold tracking-widest mb-2 sports-font">CAREER MODE</h2>
          <h1 className="text-6xl font-black mb-10 text-slate-900 dark:text-white italic sports-font uppercase tracking-tighter">THE FRANCHISE</h1>

          <input
            type="text" placeholder="Your Last Name"
            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white p-4 rounded-lg mb-6 text-center font-bold focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-900 outline-none transition-all shadow-sm font-sans"
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
                className={`p-4 rounded-xl border transition-colors ${player.pos === p.id ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 dark:border-emerald-400 shadow-sm' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
              >
                <h3 className="text-3xl font-black text-slate-900 dark:text-white sports-font">{p.id}</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase mt-1 font-sans">{p.name}</p>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-10">
            {nationalities.map(n => (
              <button
                key={n.id}
                onClick={() => setPlayer({ ...player, nat: n.id })}
                className={`p-3 rounded-xl border transition-colors ${player.nat === n.id ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 dark:border-emerald-400 shadow-sm' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'} flex items-center justify-center`}
                title={n.name}
              >
                <img src={n.img} alt={n.name} className="w-8 h-6 object-cover rounded-sm shadow-sm" />
              </button>
            ))}
          </div>

          <button onClick={handleStart} disabled={!player.name} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-lg text-xl disabled:opacity-50 transition-colors shadow-md sports-font tracking-wide mb-8 cursor-pointer">
            LACE UP THE SKATES
          </button>

          <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 tracking-widest uppercase mb-4 font-sans text-center">Career Achievements</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {MASTER_ACHIEVEMENTS.map(a => {
                const isUnlocked = unlockedAchievements.includes(a.id);
                return (
                  <div key={a.id} className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${isUnlocked ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 shadow-sm' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-60 grayscale'}`}>
                    <span className="text-2xl mb-1">{a.icon}</span>
                    <span className={`text-[10px] font-black uppercase tracking-widest sports-font leading-tight mb-1 ${isUnlocked ? 'text-amber-700 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`}>{a.name}</span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-sans font-bold leading-tight">{a.desc}</span>
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
    const awards = [];
    if (isLegend) awards.push({ name: 'Franchise Legend', desc: 'They built you a statue outside the arena.' });
    if (player.teamsPlayedFor.length === 1) awards.push({ name: 'One Club Man', desc: 'You wore a single sweater your entire career.' });

    if (player.pos === 'G') {
      if (player.stats.nhl.shutouts > 50) awards.push({ name: 'Brick Wall', desc: 'Over 50 NHL shutouts.' });
      if (player.stats.nhl.games >= 800) awards.push({ name: 'Ironman', desc: 'Played over 800 NHL games.' });
    } else {
      if (player.stats.nhl.goals > 500) awards.push({ name: 'Goal Machine', desc: 'Over 500 NHL goals. An absolute sniper.' });
      if (player.stats.nhl.assists > 300) awards.push({ name: 'The Maestro', desc: 'Over 300 NHL assists. You ran the offense.' });
      if (player.stats.nhl.games >= 800) awards.push({ name: 'Ironman', desc: 'Played over 800 NHL games. You never quit.' });
    }

    if (player.stats.titles >= 5) awards.push({ name: 'Serial Winner', desc: '5+ Championships. The ultimate competitor.' });

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 py-12 bg-slate-100 dark:bg-slate-900 transition-colors duration-300">
        <div className="w-full max-w-4xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[2.5rem] p-12 text-slate-900 dark:text-white relative overflow-hidden shadow-2xl">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-amber-100 dark:bg-amber-900/40 rounded-full blur-[100px] opacity-60 pointer-events-none"></div>

          <p className="text-emerald-600 dark:text-emerald-400 font-bold tracking-widest uppercase mb-3 text-center sports-font">END OF CAREER</p>
          <h1 className="text-6xl font-black italic mb-12 text-center sports-font tracking-tighter uppercase">{isLegend ? 'THEY BUILT YOU A STATUE' : 'YOU HUNG UP THE SKATES'}</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
            <div className="space-y-6 text-xl font-medium text-slate-700 dark:text-slate-300 font-sans">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2 sports-font uppercase">NHL CAREER STATS</h2>
              <div className="flex justify-between pb-2"><span className="text-slate-500 dark:text-slate-400">Games Played</span> <span className="font-bold text-slate-900 dark:text-white sports-font">{player.stats.nhl.games}</span></div>

              {player.pos === 'G' ? (
                <>
                  <div className="flex justify-between pb-2"><span className="text-slate-500 dark:text-slate-400">Career SV%</span> <span className="font-bold text-slate-900 dark:text-white sports-font">{player.stats.nhl.shots > 0 ? (player.stats.nhl.saves / player.stats.nhl.shots).toFixed(3).replace('0.', '.') : '.000'}</span></div>
                  <div className="flex justify-between pb-2"><span className="text-slate-500 dark:text-slate-400">Shutouts</span> <span className="font-bold text-slate-900 dark:text-white sports-font">{player.stats.nhl.shutouts}</span></div>
                </>
              ) : (
                <>
                  <div className="flex justify-between pb-2"><span className="text-slate-500 dark:text-slate-400">Total Goals</span> <span className="font-bold text-slate-900 dark:text-white sports-font">{player.stats.nhl.goals}</span></div>
                  <div className="flex justify-between pb-2"><span className="text-slate-500 dark:text-slate-400">Assists</span> <span className="font-bold text-slate-900 dark:text-white sports-font">{player.stats.nhl.assists}</span></div>
                </>
              )}

              <div className="flex justify-between pb-2"><span className="text-slate-500 dark:text-slate-400">Titles Won</span> <span className="text-amber-500 font-black text-2xl sports-font">{player.stats.titles}</span></div>
              <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700"><span className="text-slate-500 dark:text-slate-400">Career Earnings</span> <span className="font-bold text-emerald-600 dark:text-emerald-400 text-2xl sports-font">{formatMoney(player.stats.earnings)}</span></div>
            </div>

            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2 mb-6 sports-font uppercase">TROPHY CABINET</h2>
              <div className="space-y-4">
                {awards.length === 0 && <p className="text-slate-500 dark:text-slate-400 italic font-sans">A solid, respectable career.</p>}
                {awards.map((award, idx) => (
                  <div key={idx} className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="font-black text-slate-900 dark:text-white text-lg sports-font">{award.name}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 font-sans">{award.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-12 text-center relative z-10">
            <button onClick={handleNewGame} className="bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 text-white font-black py-4 px-12 rounded-full text-xl shadow-xl transition-transform hover:-translate-y-1 cursor-pointer sports-font tracking-widest uppercase">
              START NEW CAREER
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-3 md:p-6 bg-slate-50 dark:bg-slate-900 transition-colors duration-300 relative flex flex-col font-sans">
      {isShopOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 dark:bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl h-full flex flex-col shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-t-2xl">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white sports-font tracking-wide">SHOP</h2>
              <div className="text-right">
                <p className="text-emerald-600 dark:text-emerald-400 font-black text-2xl sports-font">{formatMoney(player.stats.earnings)}</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {['staff', 'consumable', 'luxury'].map(category => (
                <div key={category} className="mb-6">
                  <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 tracking-widest uppercase mb-3 border-b border-slate-200 dark:border-slate-700 pb-2 font-sans">
                    {category === 'staff' ? '💪 PERMANENT STAFF' : category === 'consumable' ? '⏳ TEMPORARY BOOSTS' : '💎 LUXURY & FANS'}
                  </h3>
                  <div className="space-y-3">
                    {shopItems.filter(i => i.type === category).map(item => {
                      const isOwned = player.inventory.includes(item.id) || player.buffs.find(b => b.id === item.id);
                      const canAfford = player.stats.earnings >= item.cost;
                      let displayedDesc = item.desc;
                      if (item.descSkaters && item.descGoalies) {
                        displayedDesc = player.pos === 'G' ? item.descGoalies : item.descSkaters;
                      }

                      return (
                        <div key={item.id} className={`p-4 rounded-xl border ${isOwned ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50'}`}>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white text-lg font-sans">{item.name}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{displayedDesc}</p>
                            </div>
                            <p className={`font-black sports-font ${isOwned ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                              {isOwned ? '✓ OWNED' : formatMoney(item.cost)}
                            </p>
                          </div>
                          {!isOwned && (
                            <button disabled={!canAfford} onClick={() => buyItem(item)} className="w-full mt-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-50 py-2 rounded text-sm font-bold border border-slate-300 dark:border-slate-600 transition-colors cursor-pointer relative z-10 font-sans tracking-wide">
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
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 rounded-b-2xl">
              <button onClick={() => setIsShopOpen(false)} className="w-full bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-white p-4 rounded-xl font-bold shadow-md transition-colors cursor-pointer relative z-10 font-sans tracking-wide">CLOSE SHOP</button>
            </div>
          </div>
        </div>
      )}

      <Dashboard 
        player={player} tier={tier} statChanges={statChanges} 
        lgKey={lgKey} isJunior={isJunior} isAHL={isAHL} 
        onOpenShop={() => setIsShopOpen(true)} 
        isDarkMode={isDarkMode} 
        toggleTheme={() => setIsDarkMode(!isDarkMode)} 
      />

      <div className="w-full max-w-5xl mx-auto pb-10">

        {screen === 'draft' && (
          <div className="glass-card p-10 rounded-3xl mt-2 text-center border-t-4 border-t-emerald-500 font-sans">
            <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase mb-6 sports-font tracking-tighter">DRAFT DAY</h2>
            <p className="text-2xl italic text-slate-700 dark:text-slate-300 mb-10 leading-relaxed max-w-2xl mx-auto">"{eventFeedback}"</p>
            <button onClick={() => { generateTraining(player.pos); setScreen('preseason'); }} className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg font-black py-4 px-12 rounded-xl text-xl transition-transform hover:-translate-y-1 cursor-pointer relative z-10 sports-font tracking-widest uppercase">Start Rookie Season</button>
          </div>
        )}

        {screen === 'preseason' && (
          <div className="glass-card p-10 rounded-3xl mt-2 border-t-4 border-t-emerald-500 relative overflow-hidden">
            <h2 className="text-4xl font-black italic text-slate-900 dark:text-white uppercase mb-2 text-center sports-font tracking-tighter">PRE-SEASON {currentYear}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-center mb-10 font-medium text-lg font-sans">The dice rolled three upgrades. Pick one focus.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {activeTrainings.map(t => (
                <div
                  key={t.id} onClick={() => handleTrain(t)}
                  className={`bg-white dark:bg-slate-800 border-2 rounded-2xl cursor-pointer relative overflow-hidden transition-all hover:-translate-y-1 hover:border-emerald-500 dark:hover:border-emerald-400 hover:shadow-xl flex flex-col min-h-[16rem] ${t.rarity === 'Epic' ? 'border-amber-400 dark:border-amber-500 bg-amber-50/20 dark:bg-amber-900/10' : t.rarity === 'Rare' ? 'border-blue-300 dark:border-blue-700 bg-blue-50/20 dark:bg-blue-900/10' : 'border-slate-200 dark:border-slate-700'}`}
                >
                  <div className="relative z-10 p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        {t.rarity !== 'Common' ? (
                          <span className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest font-sans">{t.rarity}</span>
                        ) : (
                          <span></span>
                        )}
                        <span className="text-4xl font-black text-slate-200 dark:text-slate-700 opacity-60 uppercase sports-font tracking-tighter">{t.tag}</span>
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase leading-tight mb-3 text-center sports-font mt-2">{t.name}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed italic text-center font-sans mb-4">{t.flavor}</p>
                    </div>

                    <div className="mt-auto text-center pt-4">
                      <span className="inline-block bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-bold px-4 py-2 rounded-lg text-sm shadow-sm font-sans">
                        {t.desc}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {screen === 'intl-minigame' && (() => {
          const nat = nationalities.find(n => n.id === player.nat);
          const countryName = nat?.sentenceName || nat?.name;

          return (
            <div className="glass-card p-12 rounded-3xl mt-2 border-t-4 border-t-amber-400 text-center relative overflow-hidden font-sans">
              <div className="absolute inset-0 opacity-10 dark:opacity-5 bg-[url('https://www.transparenttextures.com/patterns/ice-pattern.png')] pointer-events-none"></div>

              <h2 className="text-5xl font-black mb-4 text-amber-500 dark:text-amber-400 sports-font tracking-tighter uppercase relative z-10">🌍 INTERNATIONAL DUTY 🌍</h2>
              <p className="text-xl text-slate-600 dark:text-slate-300 mb-12 max-w-2xl mx-auto relative z-10 leading-relaxed flex items-center justify-center flex-wrap gap-2">
                You are representing <span className="font-black text-slate-900 dark:text-white flex items-center gap-2">{countryName} <img src={nat?.img} alt={player.nat} className="w-6 h-4 object-cover rounded-[2px] border border-slate-300 dark:border-slate-600" /></span> in the {minigameContext === 'wjc' ? 'World Junior Gold Medal game' : 'Winter Games Final'}! The game is tied in the 3rd period.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto relative z-10">
                {player.pos === 'G' ? (
                  <>
                    <button onClick={() => handleMinigameChoice(0.4 + player.physicality / 200, 'You smothered the rebound to kill the play!', 'You gave up a juicy rebound and they capitalized.')} className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-2 border-slate-200 dark:border-slate-700 py-8 px-4 rounded-2xl font-bold text-2xl text-slate-900 dark:text-white transition-all hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-md cursor-pointer flex flex-col items-center sports-font">
                      Swallow Rebound <span className="text-sm text-amber-600 dark:text-amber-400 font-normal mt-3 bg-amber-50 dark:bg-amber-900/30 px-3 py-1 rounded-full uppercase tracking-widest font-sans border border-amber-200 dark:border-amber-800">AGI</span>
                    </button>
                    <button onClick={() => handleMinigameChoice(0.4 + player.hockeyIQ / 200, 'You perfectly directed traffic and cut off the passing lane!', 'You were out of position and they scored on a cross-crease pass.')} className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-2 border-slate-200 dark:border-slate-700 py-8 px-4 rounded-2xl font-bold text-2xl text-slate-900 dark:text-white transition-all hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-md cursor-pointer flex flex-col items-center sports-font">
                      Direct Traffic <span className="text-sm text-emerald-600 dark:text-emerald-400 font-normal mt-3 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 rounded-full uppercase tracking-widest font-sans border border-emerald-200 dark:border-emerald-800">IQ</span>
                    </button>
                    <button onClick={() => handleMinigameChoice(0.4 + (player.shooting + player.physicality) / 400, 'You made an unbelievable desperation save at the buzzer!', "You dove across the crease but couldn't get there in time.")} className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-2 border-slate-200 dark:border-slate-700 py-8 px-4 rounded-2xl font-bold text-2xl text-slate-900 dark:text-white transition-all hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md cursor-pointer flex flex-col items-center sports-font">
                      Desperation Save <span className="text-sm text-blue-600 dark:text-blue-400 font-normal mt-3 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full uppercase tracking-widest font-sans border border-blue-200 dark:border-blue-800">REF + AGI</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => handleMinigameChoice(0.4 + player.physicality / 200, 'You laid a massive hit to free up the puck!', 'You missed the hit and gave up an odd-man rush.')} className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-2 border-slate-200 dark:border-slate-700 py-8 px-4 rounded-2xl font-bold text-2xl text-slate-900 dark:text-white transition-all hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-md cursor-pointer flex flex-col items-center sports-font">
                      Big Hit <span className="text-sm text-amber-600 dark:text-amber-400 font-normal mt-3 bg-amber-50 dark:bg-amber-900/30 px-3 py-1 rounded-full uppercase tracking-widest font-sans border border-amber-200 dark:border-amber-800">PHY</span>
                    </button>
                    <button onClick={() => handleMinigameChoice(0.4 + player.hockeyIQ / 200, 'You found the soft spot in the zone and called for the pass!', 'You read the play wrong and skated into coverage.')} className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-2 border-slate-200 dark:border-slate-700 py-8 px-4 rounded-2xl font-bold text-2xl text-slate-900 dark:text-white transition-all hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-md cursor-pointer flex flex-col items-center sports-font">
                      Find Open Ice <span className="text-sm text-emerald-600 dark:text-emerald-400 font-normal mt-3 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 rounded-full uppercase tracking-widest font-sans border border-emerald-200 dark:border-emerald-800">IQ</span>
                    </button>
                    <button onClick={() => handleMinigameChoice(0.4 + (player.skating + player.shooting) / 400, 'You flew down the wing and ripped it top shelf!', 'You lost your edge and fumbled the puck.')} className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-2 border-slate-200 dark:border-slate-700 py-8 px-4 rounded-2xl font-bold text-2xl text-slate-900 dark:text-white transition-all hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md cursor-pointer flex flex-col items-center sports-font">
                      Rush the Net <span className="text-sm text-blue-600 dark:text-blue-400 font-normal mt-3 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full uppercase tracking-widest font-sans border border-blue-200 dark:border-blue-800">SKT + SHT</span>
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

          let displayRating = seasonRecap.rating;

          if (seasonRecap.standings > (LEAGUE_CONFIG[player.league]?.playoffSpots || 16)) {
            displayRating = Math.min(displayRating, 8.5);
          } else if (seasonRecap.playoffWins <= 1 && seasonRecap.playoffWins !== 4) {
            displayRating = Math.min(displayRating, 8.9);
          } else if (seasonRecap.playoffWins === 2) {
            displayRating = Math.min(displayRating, 9.4);
          } else if (seasonRecap.playoffWins === 3) {
            displayRating = Math.min(displayRating, 9.8);
          } else if (seasonRecap.playoffWins === 4) {
            displayRating = Math.min(10.0, displayRating + 0.4);
          }

          if (seasonRecap.memCupStatus === 'lost') {
            displayRating = Math.min(displayRating, 9.8);
          } else if (seasonRecap.memCupStatus === 'won') {
            displayRating = Math.min(10.0, displayRating + 0.5);
          }

          displayRating = Math.round(displayRating);

          const playoffSpots = LEAGUE_CONFIG[player.league]?.playoffSpots || 16;
          const madePlayoffsForNarrative = seasonRecap.standings <= playoffSpots;

          if (isJunior) {
            if (seasonRecap.memCupStatus === 'won') {
              narrativeTitle = 'MEMORIAL CUP CHAMPIONS';
              narrative = 'You conquered junior hockey. You are a legend to these kids.';
            } else if (seasonRecap.memCupStatus === 'lost') {
              narrativeTitle = 'HEARTBREAK IN THE FINAL';
              narrative = 'You reached the ultimate junior stage but fell just short.';
            } else if (seasonRecap.playoffWins === 4) {
              narrativeTitle = 'LEAGUE CHAMPIONS';
              narrative = 'You won your league but fell short of the ultimate Memorial Cup prize.';
            } else if (seasonRecap.playoffWins >= 2) {
              narrativeTitle = 'SOLID JUNIOR CAMPAIGN';
              narrative = 'A good playoff run, but the ultimate prize eluded you.';
            } else {
              narrativeTitle = 'BACK TO CLASS';
              narrative = 'Your junior season ended early. Time to hit the weight room.';
            }
          } else if (player.league === 'AHL') {
            if (seasonRecap.playoffWins === 4) {
              narrativeTitle = 'CALDER CUP CHAMPIONS';
              narrative = "You carried your squad to the AHL championship. The NHL is calling.";
            } else if (seasonRecap.playoffWins >= 2) {
              narrativeTitle = 'AHL CONTENDERS';
              narrative = "A deep run in the minors. You're proving you belong at the next level.";
            } else if (madePlayoffsForNarrative) {
              narrativeTitle = 'EARLY EXIT';
              narrative = 'The bus rides get longer when you lose early in the playoffs.';
            } else {
              narrativeTitle = 'MINOR LEAGUE GRIND';
              narrative = 'You missed the playoffs entirely. A tough year in the A.';
            }
          } else if (isEuro) {
            narrativeTitle = 'A NEW CHAPTER OVERSEAS';
            narrative = 'A season abroad, far from the NHL spotlight but still lacing up at a high level.';
          } else {
            if (madePlayoffsForNarrative) {
              if (seasonRecap.playoffWins === 4) {
                narrativeTitle = 'STANLEY CUP CHAMPIONS';
                narrative = 'Absolute glory. You climbed the mountain and won it all!';
              } else if (seasonRecap.standings === 1 && seasonRecap.playoffWins < 2) {
                narrativeTitle = 'HISTORIC COLLAPSE';
                narrative = 'The fans are furious. You dominated the regular season only to choke when it mattered most.';
              } else if (seasonRecap.standings >= playoffSpots - 3 && seasonRecap.playoffWins === 4) {
                narrativeTitle = 'CINDERELLA STORY';
                narrative = 'From barely squeaking into the playoffs to hoisting the cup! The city will never forget this.';
              } else if (seasonRecap.playoffWins >= 2) {
                narrativeTitle = 'VALIANT RUN';
                narrative = 'A deep playoff run that fell just short. The fans are proud, but hungry for more.';
              } else {
                narrativeTitle = 'EARLY EXIT';
                narrative = 'A solid season erased by a quick playoff elimination. Back to the drawing board.';
              }
            } else {
              if (displayRating >= 8) {
                narrativeTitle = 'A ONE-MAN SHOW';
                narrative = 'You played out of your mind, but hockey is a team game. You can only carry them so far.';
              } else {
                narrativeTitle = 'MISSED THE DANCE';
                narrative = 'A disappointing campaign. Time to hit the golf course and rebuild for next year.';
              }
            }
          }

          return (
            <div className="glass-card p-10 rounded-3xl mt-2 border-t-4 border-t-blue-500 flex flex-col items-start w-full">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-4 mb-6 font-sans w-full">
                <h2 className="text-blue-600 dark:text-blue-400 font-bold tracking-widest uppercase text-lg sports-font">THE RINK REPORT</h2>
                <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-sm">
                  {isJunior ? (player.age === 17 ? 'JUNIOR YEAR 1' : 'JUNIOR YEAR 2') : (player.stats.seasonsPlayed === 3 ? 'ROOKIE SEASON' : `NHL SEASON ${player.stats.seasonsPlayed - 2}`)}
                </p>
              </div>

              <div className="w-full mb-8">
                <div className="flex flex-wrap items-center gap-4 mb-2">
                  <h1 className="text-4xl font-black text-slate-900 dark:text-white italic uppercase text-left sports-font tracking-tighter m-0">
                    {narrativeTitle}
                  </h1>
                  <div className={`px-3 py-1.5 rounded-lg flex items-center gap-2.5 border shadow-sm ${displayRating >= 8.0 ? 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400' : displayRating >= 6.0 ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}>
                    <div className="flex flex-col text-right justify-center mt-0.5">
                      <span className="text-[9px] font-bold tracking-widest uppercase font-sans leading-none mb-[2px]">SEASON</span>
                      <span className="text-[9px] font-bold tracking-widest uppercase font-sans leading-none">RATING</span>
                    </div>
                    <span className="text-3xl font-black sports-font leading-none">{displayRating}</span>
                  </div>
                </div>
                <p className="text-lg text-slate-600 dark:text-slate-400 font-sans italic text-left m-0">"{narrative}"</p>
              </div>

              {seasonRecap.waiverEvent && (
                <div className="bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400 p-4 rounded-xl mb-8 font-bold text-center font-sans w-full">
                  📰 {seasonRecap.waiverEvent}
                </div>
              )}

              <ul className="space-y-4 text-slate-600 dark:text-slate-300 text-lg mb-10 text-left w-full font-sans">
                <li className="border-l-4 border-blue-500 pl-4 py-1">🏅 {getTeamData(player.team, player.league).name} finished <strong className="dark:text-white">#{seasonRecap.standings}</strong> in the regular season standings.</li>

                {madePlayoffsForNarrative ? (
                  <li className={`border-l-4 ${seasonRecap.playoffWins === 4 ? 'border-amber-500 text-amber-700 dark:text-amber-400 font-bold' : 'border-red-500'} pl-4 py-1`}>
                    {seasonRecap.playoffWins === 4 ? '🏆 You went all the way and won the Cup!' :
                      seasonRecap.playoffWins === 3 ? '💔 Heartbreak in the Finals. Eliminated in the last round.' :
                        seasonRecap.playoffWins === 2 ? '⚔️ A deep run, but eliminated in the Conference Finals.' :
                          seasonRecap.playoffWins === 1 ? '❌ Knocked out in the second round.' :
                            '🛑 An embarrassing first-round exit.'}
                  </li>
                ) : (
                  <li className="border-l-4 border-slate-500 pl-4 py-1">
                    ⛳ Missed the playoffs entirely.
                  </li>
                )}

                {seasonRecap.memCupStatus === 'won' && (
                  <li className="border-l-4 border-amber-500 pl-4 py-1 text-amber-700 dark:text-amber-400 font-bold">🏆 You conquered the Memorial Cup! The ultimate junior glory.</li>
                )}
                {seasonRecap.memCupStatus === 'lost' && (
                  <li className="border-l-4 border-red-500 pl-4 py-1">💔 A devastating loss in the Memorial Cup tournament.</li>
                )}

                {player.pos === 'G' ? (
                  <li className="border-l-4 border-blue-500 pl-4 py-1">🥅 You recorded a <strong className="text-slate-900 dark:text-white">{(seasonRecap.saves / seasonRecap.shots).toFixed(3).replace('0.', '.')} SV%</strong> and <strong className="text-slate-900 dark:text-white">{seasonRecap.sho} shutouts</strong> in {seasonRecap.games} games.</li>
                ) : ['LD', 'RD'].includes(player.pos) ? (
                  <li className="border-l-4 border-blue-500 pl-4 py-1">🛡️ You anchored the defense, logging <strong className="text-slate-900 dark:text-white">{seasonRecap.g}G, {seasonRecap.a}A</strong> and a <strong className="text-slate-900 dark:text-white">{seasonRecap.pm > 0 ? `+${seasonRecap.pm}` : seasonRecap.pm} rating</strong> in {seasonRecap.games} games.</li>
                ) : (
                  <li className="border-l-4 border-blue-500 pl-4 py-1">🏒 You recorded <strong className="text-slate-900 dark:text-white">{seasonRecap.g} goals</strong> and <strong className="text-slate-900 dark:text-white">{seasonRecap.a} assists</strong> in {seasonRecap.games} games.</li>
                )}

                {player.pos !== 'G' && <li className="border-l-4 border-blue-500 pl-4 py-1">🔥 You contributed to roughly <strong className="dark:text-white">{seasonRecap.offPercent}%</strong> of the team's total offensive production.</li>}

                <li className="border-l-4 border-blue-500 pl-4 py-1">💰 Your market value has {seasonRecap.rating >= 6 ? 'increased' : 'taken a hit'}.</li>
                {seasonRecap.draftStr && (
                  <li className="border-l-4 border-emerald-500 pl-4 py-1 text-emerald-700 dark:text-emerald-400 font-bold">🏒 You were selected in the NHL Draft {seasonRecap.draftStr} by the {seasonRecap.draftedBy}!</li>
                )}
              </ul>

              <div className="flex gap-4 mt-8 w-full">
                <button onClick={advanceToOffseason} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl text-xl shadow-md transition-colors cursor-pointer relative z-10 uppercase tracking-widest sports-font">
                  PROCEED TO OFFSEASON
                </button>
                {!isJunior && player.league === 'NHL' && player.contract.years > 0 && (
                  <button onClick={handleTradeRequest} className="bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 hover:border-red-500 dark:hover:border-red-500 text-slate-700 dark:text-slate-200 font-bold py-4 px-6 rounded-xl transition-all shadow-sm cursor-pointer relative z-10 flex flex-col items-center justify-center font-sans">
                    <span>REQUEST TRADE</span>
                    <span className="text-[10px] text-red-500 dark:text-red-400 mt-1 uppercase tracking-widest">(-20 FAN STATUS)</span>
                  </button>
                )}
              </div>
            </div>
          );
        })()}

        {screen === 'event' && (
          <div className="glass-card p-10 rounded-3xl mt-2 border-t-4 border-t-amber-500 text-center">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase mb-4 sports-font">🗣 {activeEvent.title}</h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 mb-8 leading-relaxed max-w-2xl mx-auto font-sans">{activeEvent.desc}</p>

            <div className="flex flex-col gap-4 max-w-xl mx-auto font-sans">
              {activeEvent.choices.map((c, i) => (
                <button
                  key={i}
                  onClick={() => handleEventChoice(c)}
                  className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 p-6 rounded-xl font-bold text-lg transition-all shadow-sm hover:shadow-md cursor-pointer relative z-10 flex justify-between items-center"
                >
                  <span>{c.label}</span>
                  {c.isRisky && <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-xs px-2 py-1 rounded font-black tracking-widest uppercase border border-amber-300 dark:border-amber-700">RISKY</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {screen === 'minigame' && (() => {
          const mg = findMinigame(activeMinigame, player.pos);
          const accent = ACCENT[mg.accent] || ACCENT.red;
          const isMemCup = minigameContext === 'memcup';

          return (
            <div className={`glass-card p-12 rounded-3xl mt-2 border-t-4 ${accent.border} text-center relative overflow-hidden font-sans`}>
              <div className="absolute inset-0 opacity-10 dark:opacity-5 bg-[url('https://www.transparenttextures.com/patterns/ice-pattern.png')] pointer-events-none"></div>

              {isMemCup && (
                <p className="relative z-10 inline-block bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest mb-4">
                  Memorial Cup · {memCup.round === 0 ? 'Semi-Final' : 'Championship Final'}
                </p>
              )}

              <h2 className={`text-5xl font-black mb-4 ${accent.heading} sports-font tracking-tighter uppercase relative z-10`}>{mg.title}</h2>
              <p className="text-xl text-slate-600 dark:text-slate-300 mb-12 max-w-2xl mx-auto relative z-10 leading-relaxed">{mg.desc}</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto relative z-10">
                {mg.choices.map((c, i) => {
                  const chance = choiceChance(player, c);
                  const pct = Math.round(chance * 100);
                  const pill = ARCH_PILL[c.archetype] || ARCH_PILL.safe;
                  const reward = c.reward || CHOICE_REWARD[c.archetype];
                  const win = reward.win || {};
                  const rewardBits = [];
                  if (win.idol) rewardBits.push(`+${win.idol} Fan`);
                  if (win.ovr) rewardBits.push(`+${win.ovr} OVR`);
                  if (win.money) rewardBits.push(`+${formatMoney(win.money)}`);

                  return (
                    <button
                      key={i}
                      onClick={() => handleMinigameChoice(chance, c.success, c.fail, reward)}
                      className={`bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-2 border-slate-200 dark:border-slate-700 ${pill.hover} py-7 px-4 rounded-2xl font-bold text-2xl text-slate-900 dark:text-white transition-all hover:shadow-md cursor-pointer flex flex-col items-center sports-font`}
                    >
                      {c.label}
                      <span className={`text-xs font-black mt-3 px-3 py-1 rounded-full uppercase tracking-widest font-sans border ${pill.cls}`}>
                        {pill.label} · {pct}%
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-2 uppercase tracking-wider font-sans">{c.tag}</span>
                      {!isMemCup && rewardBits.length > 0 && (
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-2 font-sans normal-case tracking-normal">{rewardBits.join(' · ')}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {screen === 'event-result' && (
          <div className="glass-card p-10 rounded-3xl mt-2 text-center border-t-4 border-t-emerald-500 font-sans">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase mb-6 sports-font">THE AFTERMATH</h2>
            <p className="text-xl italic text-slate-700 dark:text-slate-300 mb-8 leading-relaxed max-w-2xl mx-auto">"{eventFeedback}"</p>

            <div className="flex justify-center gap-4 mb-10">
              {eventImpacts.idol !== undefined && eventImpacts.idol !== 0 && (
                <div className={`p-4 rounded-xl border ${eventImpacts.idol > 0 ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'}`}>
                  <p className="text-xs font-bold uppercase tracking-widest mb-1">FAN STATUS</p>
                  <p className="text-2xl font-black sports-font">{eventImpacts.idol > 0 ? '+' : ''}{eventImpacts.idol}</p>
                </div>
              )}
              {eventImpacts.ovr !== undefined && eventImpacts.ovr !== 0 && (
                <div className={`p-4 rounded-xl border ${eventImpacts.ovr > 0 ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}>
                  <p className="text-xs font-bold uppercase tracking-widest mb-1">OVR IMPACT</p>
                  <p className="text-2xl font-black sports-font">{eventImpacts.ovr > 0 ? '+' : ''}{eventImpacts.ovr}</p>
                </div>
              )}
              {eventImpacts.money !== undefined && eventImpacts.money !== 0 && (
                <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 p-4 rounded-xl">
                  <p className="text-xs font-bold uppercase tracking-widest mb-1">EARNINGS</p>
                  <p className="text-2xl font-black sports-font">+{formatMoney(eventImpacts.money)}</p>
                </div>
              )}
            </div>

            <button onClick={handleContinueEvent} className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg font-black py-4 px-12 rounded-xl text-xl transition-transform hover:-translate-y-1 cursor-pointer relative z-10 sports-font tracking-widest uppercase">Continue</button>
          </div>
        )}

        {screen === 'playoffs' && (
          <div className="glass-card p-10 rounded-3xl mt-2 border-t-4 border-t-amber-400 bg-slate-900 dark:bg-slate-950 text-white text-center font-sans">
            <h2 className="text-4xl font-black tracking-widest mb-2 text-amber-500 sports-font">🏆 PLAYOFFS 🏆</h2>
            <p className="text-slate-400 mb-8 text-sm uppercase tracking-widest font-bold">Find 4 Wins. Avoid 4 Eliminations.</p>

            <h3 className="text-2xl font-bold mb-8 bg-slate-800 px-6 py-3 rounded-full border border-slate-700 inline-block sports-font tracking-wide">
              WINS FOUND: <span className="text-emerald-400">{playoffs.wins}</span> / 4
            </h3>

            <div className="grid grid-cols-4 gap-3 mb-10 max-w-2xl mx-auto">
              {playoffs.deck.map((item, index) => {
                const isRevealed = playoffs.revealed.includes(index);
                const showForcefully = playoffs.status !== 'playing' && !isRevealed;
                const isLoss = !item.isWin;

                let btnClass = 'h-20 sm:h-24 text-lg sm:text-xl font-black rounded-xl border-2 transition-all duration-300 flex flex-col items-center justify-center cursor-pointer relative z-10 sports-font ';

                if (isRevealed || showForcefully) {
                  if (isLoss) btnClass += 'bg-red-500 border-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]';
                  else btnClass += 'bg-emerald-500 border-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]';
                } else {
                  btnClass += 'bg-slate-800 border-slate-700 text-slate-500 hover:bg-slate-700 hover:border-slate-500 hover:text-white shadow-inner';
                }

                if (showForcefully) btnClass += ' opacity-50';

                return (
                  <button key={index} onClick={() => handleGridClick(index)} className={btnClass} disabled={playoffs.status !== 'playing' || isRevealed}>
                    {(isRevealed || showForcefully) ? (
                      <>
                        <span className="text-[10px] font-bold tracking-widest uppercase mb-1 font-sans text-slate-100">{item.opp}</span>
                        <span>{item.score}</span>
                      </>
                    ) : '?'}
                  </button>
                );
              })}
            </div>

            {playoffs.status === 'won' && (
              <div className="animate-bounce mt-4">
                <h2 className="text-3xl font-black mb-6 sports-font">🎉 YOU WON THE CUP! 🎉</h2>
                <button onClick={proceedFromPlayoffs} className="bg-slate-200 hover:bg-white text-black font-black py-3 px-10 rounded-full shadow-xl cursor-pointer relative z-10 sports-font tracking-widest uppercase">
                  {isJunior ? 'Advance to Memorial Cup' : 'Continue to Recap'}
                </button>
              </div>
            )}
            {playoffs.status === 'lost' && (
              <div className="mt-4">
                <h2 className="text-3xl font-black text-slate-400 mb-6 sports-font">💀 ELIMINATED. 💀</h2>
                <button onClick={handleEndPlayoffs} className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 font-bold py-3 px-10 rounded-full cursor-pointer relative z-10 sports-font tracking-widest uppercase">Continue to Recap</button>
              </div>
            )}
          </div>
        )}

        {screen === 'memorial-cup' && (
          <div className="glass-card p-12 rounded-3xl mt-2 border-t-4 border-t-amber-400 bg-white dark:bg-slate-800 text-center font-sans shadow-2xl relative overflow-hidden">
            <h2 className="text-5xl font-black mb-4 text-amber-500 sports-font tracking-tighter uppercase relative z-10 text-center">THE MEMORIAL Cup</h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 mb-12 max-w-2xl mx-auto relative z-10 leading-relaxed text-center">The ultimate prize in Junior Hockey. Win two games to cement your legacy.</p>

            {memCup.status === 'playing' && (
              <div className="relative z-10 flex flex-col items-center">
                <h3 className="text-3xl font-bold mb-8 sports-font text-slate-900 dark:text-white text-center">{memCup.round === 0 ? 'SEMI-FINAL MATCHUP' : 'CHAMPIONSHIP FINAL'}</h3>
                <button onClick={() => triggerMinigame('memcup')} className="bg-emerald-600 hover:bg-emerald-500 py-4 px-10 rounded-xl font-black text-xl text-white transition-all hover:scale-105 cursor-pointer shadow-lg sports-font uppercase tracking-widest">
                  PLAY MATCH
                </button>
              </div>
            )}

            {memCup.status === 'won' && (
              <div className="relative z-10">
                <h2 className="text-4xl font-black text-amber-500 mb-6 sports-font">🏆 MEMORIAL CUP CHAMPIONS! 🏆</h2>
                <p className="text-slate-600 dark:text-slate-300 mb-8 font-bold">Your draft stock has skyrocketed.</p>
                <button onClick={handleEndMemCup} className="bg-slate-900 dark:bg-black hover:bg-slate-800 text-white font-black py-3 px-10 rounded-full shadow-xl cursor-pointer sports-font tracking-widest uppercase">Continue to Recap</button>
              </div>
            )}

            {memCup.status === 'lost' && (
              <div className="relative z-10 mt-4">
                <h2 className="text-3xl font-black text-slate-400 mb-6 sports-font">💀 ELIMINATED. 💀</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-8 font-bold">Your season ends in heartbreak.</p>
                <button onClick={handleEndMemCup} className="bg-slate-900 dark:bg-black hover:bg-slate-800 text-white font-bold py-3 px-10 rounded-full cursor-pointer sports-font tracking-widest uppercase">Continue to Recap</button>
              </div>
            )}
          </div>
        )}

        {screen === 'transfer' && (
          <div className="glass-card p-10 rounded-3xl mt-2 border-t-4 border-t-purple-500 font-sans">
            <h2 className="text-4xl font-black italic text-slate-900 dark:text-white uppercase mb-4 text-center sports-font tracking-tighter">FREE AGENCY</h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg mb-10 font-medium text-center">The market speaks. Glory or money?</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {freeAgencyOffers.map((o, i) => (
                <div key={i} className={`bg-white dark:bg-slate-800 border-2 p-6 rounded-2xl relative flex flex-col shadow-sm hover:shadow-lg transition-all ${o.type.includes('EXTENSION') ? 'border-emerald-400 dark:border-emerald-700 bg-emerald-50/30 dark:bg-emerald-900/20' : 'border-slate-200 dark:border-slate-700'}`}>
                  {o.type.includes('EXTENSION') && <span className="absolute top-4 right-4 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest font-sans">{o.type}</span>}

                  <div className="flex items-center gap-3 mb-6 mt-2">
                    <TeamLogo teamId={o.team} league="NHL" />
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white sports-font">{o.team}</h3>
                  </div>

                  <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mb-1 sports-font">{formatMoney(o.salary)}<span className="text-sm text-slate-500 dark:text-slate-400 font-normal font-sans"> /yr</span></p>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-6">{o.years}-year contract</p>

                  <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl mb-6 flex-1 border border-slate-200 dark:border-slate-700">
                    {o.idolHit < 0 && <p className="text-xs text-red-500 dark:text-red-400 font-bold mb-2">Leaving {player.team}: {o.idolHit} fan status.</p>}
                    {o.idolHit === 10 && <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mb-2">Staying home: +10 fan status.</p>}
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-bold">🏒 You will play <span className="text-blue-600 dark:text-blue-400">MORE</span> than before.</p>
                  </div>

                  <button onClick={() => signContract(o)} className="w-full bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold py-3 rounded-lg shadow-md transition-colors cursor-pointer relative z-10 font-sans tracking-wide">
                    SIGN DEAL
                  </button>
                </div>
              ))}
            </div>

            {player.agentRerolls > 0 && (
              <button
                onClick={() => { setPlayer(p => ({ ...p, agentRerolls: 0 })); generateOffers(); }}
                className="mt-8 w-full bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 text-slate-700 dark:text-slate-200 font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-3 shadow-sm hover:shadow-md cursor-pointer relative z-10 font-sans"
              >
                📞 CALL AGENT FOR NEW OFFERS (1 PER CAREER)
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default App;