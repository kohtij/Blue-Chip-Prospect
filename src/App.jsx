import { useState, useEffect } from 'react';
import './App.css';
import {
  nhlTeams, ohlTeams, whlTeams, qmjhlTeams, ahlTeams, shlTeams, liigaTeams, ncaaTeams,
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

const getDisplayDeployment = (ovr, pos, league) => {
  const raw = getDeployment(ovr, pos, league);
  if (pos === 'LD' || pos === 'RD') {
    if (raw.includes('1st')) return '1st Pair';
    if (raw.includes('2nd')) return '2nd Pair';
    if (raw.includes('3rd') || raw.includes('4th')) return '3rd Pair';
    return raw;
  }
  return raw;
};

const getFullTeamName = (teamId, league) => {
  if (!teamId) return 'UNKNOWN';
  const t = typeof teamId === 'object' ? teamId : getTeamData(teamId, league);
  if (!t) return 'UNKNOWN';
  if (t.city && t.name && !t.name.includes(t.city)) return `${t.city} ${t.name}`;
  return t.name || t.id || 'UNKNOWN';
};

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

const PRESS_VIBES = {
  professional: { label: 'PROFESSIONAL', icon: '👔', color: 'text-[#3b82f6]', bg: 'bg-[#3b82f6]/10', border: 'border-[#3b82f6]/30' },
  passionate:   { label: 'PASSIONATE',   icon: '🔥', color: 'text-[#ef4444]', bg: 'bg-[#ef4444]/10', border: 'border-[#ef4444]/30' },
  humble:       { label: 'HUMBLE',       icon: '🙏', color: 'text-[#22E748]', bg: 'bg-[#22E748]/10', border: 'border-[#22E748]/30' },
  cocky:        { label: 'COCKY',        icon: '😎', color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/10', border: 'border-[#F59E0B]/30' }
};

const PRESS_JOURNALISTS = [
  { id: 'professional', name: 'The Veteran Beat Writer', desc: 'Old-school and institutional. They want MEASURED and FORMAL answers.' },
  { id: 'passionate',   name: 'The Local Fanatic', desc: 'Wears their heart on their sleeve. They want to see FIRE and PASSION for the city.' },
  { id: 'humble',       name: 'The Character Analyst', desc: 'Values team culture above all. They look for TEAM-FIRST, HUMBLE responses.' },
  { id: 'cocky',        name: 'The Tabloid Stirrer', desc: 'Looking for a controversial headline. They thrive on CONFIDENCE and ARROGANCE.' }
];

const PRESS_QUESTIONS = [
  { q: "You've been getting a lot of attention lately. How are you handling the pressure?", answers: { professional: "I just focus on my job and trust the process.", passionate: "I feed off the energy of this city, it drives me!", humble: "It's easy when you have great teammates supporting you.", cocky: "Pressure? I was born for this spotlight." } },
  { q: "Tough loss tonight. What went wrong out there on the ice?", answers: { professional: "We need to review the tape and execute our system better.", passionate: "We didn't battle hard enough. That's unacceptable for our fans.", humble: "I need to be better. This one is on my shoulders.", cocky: "A lucky bounce for them. We're still the better team." } },
  { q: "Rumors are swirling about a divide in the locker room. Any comments?", answers: { professional: "We handle our business internally. No comment.", passionate: "We're a family! Anyone saying otherwise is a liar.", humble: "We're just focused on working hard for each other every day.", cocky: "Let them talk. Winning cures everything, and we win." } },
  { q: "How do you feel about your upcoming matchup against your rivals?", answers: { professional: "They are a well-coached team. We need to be prepared.", passionate: "It's war. We know what this game means to the city.", humble: "It'll be a tough test. We respect them a lot.", cocky: "We're going to completely dismantle them." } },
  { q: "The coach benched you in the 3rd period last game. Your thoughts?", answers: { professional: "Coach makes the decisions. I just play.", passionate: "I was furious! I want to be out there helping the team win.", humble: "He made the right call. I wasn't playing my best hockey.", cocky: "It was a mistake taking me off the ice. I'm the game changer." } }
];

const TeamLogo = ({ teamId, league, isAHL }) => {
  const [imgError, setImgError] = useState(false);
  const isNHL = league === 'NHL' && !isAHL && (nhlTeams || []).some(t => t.id === teamId);

  let team = getTeamData(teamId, league);

  if (isNHL && !imgError) {
    return (
      <div className="relative w-12 h-12 flex items-center justify-center bg-white rounded-full p-1 border border-[rgba(255,255,255,0.14)] shrink-0">
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
      <div className="relative w-12 h-12 rounded-full flex items-center justify-center font-black text-sm border-2 bg-[#101410] text-white border-[rgba(255,255,255,0.14)] sports-font shrink-0">
        {teamId}
        {isAHL && <span className="absolute -bottom-2 -right-2 bg-[#F59E0B] text-black text-[9px] px-1 rounded-sm font-black border border-black">AHL</span>}
      </div>
    );
  }

  return (
    <div className="relative w-12 h-12 rounded-full flex items-center justify-center font-black text-[10px] sm:text-xs border-2 sports-font shadow-lg shrink-0 text-center leading-none overflow-hidden" style={{ backgroundColor: team.bg, color: team.color, borderColor: team.color }}>
      {team.id}
      {isAHL && <span className="absolute -bottom-2 -right-2 bg-[#F59E0B] text-black text-[9px] px-1 rounded-sm font-black border border-black z-10">AHL</span>}
    </div>
  );
};

const Dashboard = ({ player, tier, statChanges, lgKey, isJunior, isAHL, onOpenShop }) => {
  const safeNationalities = nationalities || [];
  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-3 mb-4 z-10 relative">
      <div className="game-panel p-4 sm:p-6 relative flex flex-col sm:flex-row justify-between items-start sm:items-center border-t-2 border-t-[#3b82f6] gap-4">
        
        <div className="flex items-center gap-3 sm:gap-5 w-full sm:w-auto">
          <div className="text-center flex flex-col items-center justify-center shrink-0">
            <p className="text-4xl sm:text-6xl font-black text-white sports-font leading-none tracking-tighter">{player.ovr}</p>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 tracking-widest mt-1 font-sans">OVR</p>
          </div>

          <div className="w-px h-10 sm:h-12 bg-[rgba(255,255,255,0.065)]"></div>

          <div className="flex flex-col justify-center min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <img
                src={safeNationalities.find(n => n.id === player.nat)?.img}
                alt={player.nat}
                className="w-6 h-4 sm:w-8 sm:h-6 object-cover rounded-sm border border-[rgba(255,255,255,0.1)] shadow-sm shrink-0"
              />
              <h1 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tighter sports-font leading-none m-0 p-0 truncate">
                {player.name}
              </h1>
            </div>
            <p className="text-[9px] sm:text-xs text-slate-400 font-bold uppercase tracking-widest font-sans leading-none mt-1 truncate">
              {player.pos} · {getDisplayDeployment(player.ovr, player.pos, player.league)} · {isJunior ? `${player.league} JUNIORS` : getFullTeamName(player.team, player.league)}
            </p>
          </div>
        </div>

        <div className="flex w-full sm:w-auto justify-between sm:justify-end items-center gap-4 mt-2 sm:mt-0 pt-3 sm:pt-0 border-t border-[rgba(255,255,255,0.065)] sm:border-0">
          {!isJunior && player.league !== 'NCAA' && (
            <button onClick={onOpenShop} className="bg-[#101410] hover:bg-[#1a2230] border border-[rgba(255,255,255,0.065)] rounded-xl px-4 py-2 sm:px-5 sm:py-3 text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center gap-2 font-sans text-white cursor-pointer w-full sm:w-auto justify-center">
              🛒 <span className="tracking-wide">SHOP</span>
            </button>
          )}
          {player.team && <TeamLogo teamId={player.team} league={player.league} isAHL={isAHL} />}
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
        {player.pos === 'G' ? (
          <>
            <div className="stat-box p-2 sm:py-4 sm:px-2 flex flex-col justify-center items-center">
              <p className="text-2xl sm:text-4xl font-black text-[#22E748] sports-font leading-none mb-1">
                {(player.stats[lgKey]?.shots > 0 && player.stats[lgKey]?.saves !== undefined) ? (player.stats[lgKey].saves / player.stats[lgKey].shots).toFixed(3).replace('0.', '.') : '.000'}
              </p>
              <p className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase font-sans leading-none">SV%</p>
            </div>
            <div className="stat-box p-2 sm:py-4 sm:px-2 flex flex-col justify-center items-center">
              <p className="text-2xl sm:text-4xl font-black text-white sports-font leading-none mb-1">
                {(player.stats[lgKey]?.games > 0 && player.stats[lgKey]?.shots !== undefined) ? ((player.stats[lgKey].shots - player.stats[lgKey].saves) / player.stats[lgKey].games).toFixed(2) : '0.00'}
              </p>
              <p className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase font-sans leading-none">GAA</p>
            </div>
            <div className="stat-box p-2 sm:py-4 sm:px-2 flex flex-col justify-center items-center">
              <p className="text-2xl sm:text-4xl font-black text-white sports-font leading-none mb-1">{player.stats[lgKey]?.shutouts || 0}</p>
              <p className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase font-sans leading-none">SHO</p>
            </div>
          </>
        ) : (
          <>
            <div className="stat-box p-2 sm:py-4 sm:px-2 flex flex-col justify-center items-center">
              <p className="text-2xl sm:text-4xl font-black text-[#22E748] sports-font leading-none mb-1">{player.stats[lgKey]?.goals || 0}</p>
              <p className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase font-sans leading-none">GOALS</p>
            </div>
            <div className="stat-box p-2 sm:py-4 sm:px-2 flex flex-col justify-center items-center">
              <p className="text-2xl sm:text-4xl font-black text-white sports-font leading-none mb-1">{player.stats[lgKey]?.assists || 0}</p>
              <p className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase font-sans leading-none">ASSISTS</p>
            </div>
            <div className="stat-box p-2 sm:py-4 sm:px-2 flex flex-col justify-center items-center">
              <p className="text-2xl sm:text-4xl font-black text-white sports-font leading-none mb-1">{player.stats[lgKey]?.plusMinus > 0 ? `+${player.stats[lgKey].plusMinus}` : (player.stats[lgKey]?.plusMinus || 0)}</p>
              <p className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase font-sans leading-none">+/-</p>
            </div>
          </>
        )}
        <div className="stat-box p-2 sm:py-4 sm:px-2 flex flex-col justify-center items-center">
          <p className="text-2xl sm:text-4xl font-black text-[#F59E0B] sports-font leading-none mb-1">{player.stats?.titles || 0}</p>
          <p className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase font-sans leading-none">TITLES</p>
        </div>
        <div className="stat-box p-2 sm:py-4 sm:px-2 flex flex-col justify-center items-center border-[#3b82f6]/30 bg-[#3b82f6]/5">
          <p className="text-2xl sm:text-4xl font-black text-[#3b82f6] sports-font leading-none mb-1">{formatMoney(player.stats?.value || 0)}</p>
          <p className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase font-sans leading-none">VALUE</p>
        </div>
        <div className="stat-box p-2 sm:py-4 sm:px-2 flex flex-col justify-center items-center border-[#F59E0B]/30 bg-[#F59E0B]/5">
          <p className="text-2xl sm:text-4xl font-black text-[#F59E0B] sports-font leading-none mb-1">{formatMoney(player.stats?.earnings || 0)}</p>
          <p className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase font-sans leading-none">EARNED</p>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2 sm:gap-3">
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
            <div key={attr.label} className={`stat-box p-2 sm:py-4 sm:px-2 flex flex-col justify-center items-center relative transition-colors duration-500 ${isUpgraded ? 'bg-[#22E748]/10 border-[#22E748]/30' : isDowngraded ? 'bg-[#ef4444]/10 border-[#ef4444]/30' : ''}`}>
              {isUpgraded && <span className="absolute top-1 right-1 sm:top-2 sm:right-2 text-[#22E748] text-[10px] sm:text-sm font-black tracking-tighter">▲{change}</span>}
              {isDowngraded && <span className="absolute top-1 right-1 sm:top-2 sm:right-2 text-[#ef4444] text-[10px] sm:text-sm font-black tracking-tighter">▼{Math.abs(change)}</span>}
              <p className={`text-2xl sm:text-4xl font-black sports-font leading-none mb-1 ${isUpgraded ? 'text-[#22E748]' : isDowngraded ? 'text-[#ef4444]' : 'text-white'}`}>{attr.val}</p>
              <p className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase mt-1 font-sans leading-none text-center">{attr.label}</p>
            </div>
          );
        })}
      </div>

      <div className="game-panel p-4 sm:p-5 flex flex-col gap-3">
        <div className="flex justify-between items-end font-sans">
          <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1 leading-none">FAN STATUS: <span className="text-xs sm:text-sm font-black text-white ml-1 sports-font">{tier.label}</span></p>
          {tier.req > 0 ? (
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 leading-none">Need {tier.req} pts to {tier.nextLabel}</p>
          ) : (
            <p className="text-[9px] sm:text-[10px] font-bold text-[#F59E0B] leading-none">Max Icon Status 🏆</p>
          )}
        </div>
        <div className="w-full h-3 sm:h-4 bg-[#101410] rounded-full overflow-hidden border border-[rgba(255,255,255,0.065)]">
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
  const [activePress, setActivePress] = useState({ journalist: null, questions: [], currentQ: 0, answers: [] });
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
    idolatry: 0, inventory: [], buffs: [], agentRerolls: 1, teamsPlayedFor: [], rights: null, startLeague: 'OHL'
  });

  const [unlockedAchievements, setUnlockedAchievements] = useState(() => {
    try {
      const saved = localStorage.getItem('hockey_achievements');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
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
      idolatry: 0, inventory: [], buffs: [], agentRerolls: 1, teamsPlayedFor: [], rights: null, startLeague: 'OHL'
    });
    setSeasonRecap(null);
    setActiveEvent(null);
    setPendingPlayoffs(null);
    setScreen('creation');
  };

  const safeJuniorLeagues = juniorLeagues || [];
  const safeEuroLeagues = euroLeagues || [];
  const safeNationalities = nationalities || [];

  const currentYear = 2026 + player.stats.seasonsPlayed;
  const isJunior = safeJuniorLeagues.includes(player.league);
  const isAmateur = isJunior || player.league === 'NCAA' || safeEuroLeagues.includes(player.league);
  const isAHL = player.league === 'AHL';
  const lgKey = isAmateur ? 'chl' : isAHL ? 'ahl' : 'nhl';

  const handleStart = () => {
    const lg = player.startLeague;
    let pool = ohlTeams || [];
    if (lg === 'WHL') pool = whlTeams || [];
    if (lg === 'QMJHL') pool = qmjhlTeams || [];
    if (lg === 'SHL') pool = shlTeams || [];
    if (lg === 'LIIGA') pool = liigaTeams || [];
    
    const startTeam = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : { id: 'UNK' };

    let bSht = 55, bSkt = 55, bPhy = 55, bIq = 55, bSta = 55;
    if (player.pos === 'C') { bIq = 65; bSkt = 60; bSht = 50; bPhy = 50; bSta = 50; }
    if (['LW', 'RW'].includes(player.pos)) { bSht = 65; bSkt = 60; bPhy = 50; bIq = 50; bSta = 50; }
    if (['LD', 'RD'].includes(player.pos)) { bPhy = 65; bSta = 60; bIq = 60; bSkt = 50; bSht = 40; }
    if (player.pos === 'G') { bSht = 65; bSkt = 65; bPhy = 60; bIq = 50; bSta = 35; }

    const startOvr = Math.floor((bSht + bSkt + bPhy + bIq + bSta) / 5);

    setPlayer(p => ({
      ...p, team: startTeam.id, league: lg, teamsPlayedFor: [startTeam.id],
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
      const parent = (nhlTeams || []).find(t => t.ahlId === currentTeam);
      if (parent) {
        currentTeam = parent.id;
        currentLeague = 'NHL';
      }
    }

    setPlayer(p => ({ ...p, team: currentTeam, league: currentLeague, buffs: newBuffs }));

    // Age 17 CHL Import Draft for Euro Players
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
             ]
           });
           setScreen('event');
           return;
         }
    }

    // Age 17 NCAA Poaching Event
    if (player.age === 17 && safeJuniorLeagues.includes(currentLeague) && !player.rights && Math.random() > 0.6) {
         const pool = ncaaTeams || [];
         const ncaaTeam = pool[Math.floor(Math.random() * pool.length)];
         if (ncaaTeam) {
           setActiveEvent({
             title: 'NCAA RECRUITMENT',
             desc: `The head coach of ${ncaaTeam.name} has offered you a full scholarship. If you accept, you will leave major junior next season to play Division 1 college hockey.`,
             choices: [
               { label: 'Accept Scholarship (Go NCAA)', isRisky: false, feedback: 'You committed to playing college hockey.', effect: { idol: 5, ovr: 1, money: 0 }, action: 'JOIN_NCAA', actionData: ncaaTeam.id },
               { label: 'Decline (Stay in CHL)', isRisky: false, feedback: 'You decided to stay the course in major junior.', effect: { idol: 0, ovr: 1, money: 0 } }
             ]
           });
           setScreen('event');
           return;
         }
    }

    const isCurrentlyAmateur = safeJuniorLeagues.includes(currentLeague) || currentLeague === 'NCAA' || safeEuroLeagues.includes(currentLeague);
    
    // Un-drafted 18 year olds go to the NHL Draft
    if (player.age === 18 && isCurrentlyAmateur && !player.rights) {
      handleDraftDay();
      return;
    }

    // Older amateurs whose rights are owned by an NHL team must choose what to do
    if (isCurrentlyAmateur && player.rights && player.age > 18) {
       if (player.age >= 22) {
           setPlayer(p => ({...p, rights: null})); // Rights expire at 22, become UFA
           generateOffers(false, currentTeam);
           return;
       } else {
           setActiveEvent({
             title: 'OFFSEASON DECISION',
             desc: `The ${getFullTeamName(player.rights, 'NHL')} still hold your NHL rights. Do you want to sign your Entry-Level Contract and turn pro, or return to amateur hockey for another year of development?`,
             choices: [
               { label: 'Sign ELC (Turn Pro)', isRisky: false, feedback: 'You signed your ELC and are heading to NHL training camp!', effect: { idol: 10, ovr: 0, money: 0 }, action: 'SIGN_ELC' },
               { label: `Return to ${currentLeague}`, isRisky: false, feedback: 'You chose to develop for another year.', effect: { idol: 0, ovr: 1, money: 0 } }
             ]
           });
           setScreen('event');
           return;
       }
    }

    if (!isCurrentlyAmateur && player.contract.years <= 0) {
      generateOffers(false, currentTeam);
    } else {
      generateTraining(player.pos);
      setScreen('preseason');
    }
  };

  const handleDraftDay = () => {
    const totalJuniorPoints = (player.stats.chl?.goals || 0) + (player.stats.chl?.assists || 0) + (player.stats?.memCupBoost || 0);
    let overallPick = 1;
    let round = 1;
    let idolBoost = 0;

    const isElite = player.ovr >= 66 || (['LW', 'RW', 'C'].includes(player.pos) && totalJuniorPoints > 180);
    const isGreat = player.ovr >= 63 || (['LW', 'RW', 'C'].includes(player.pos) && totalJuniorPoints > 120);

    if (isElite) {
      overallPick = 1; round = 1; idolBoost = 25; unlockAchievement('first_overall');
    } else if (isGreat) {
      overallPick = Math.floor(Math.random() * 31) + 2; round = 1; idolBoost = 15;
    } else {
      round = Math.floor(Math.random() * 6) + 2;
      overallPick = ((round - 1) * 32) + Math.floor(Math.random() * 32) + 1;
      idolBoost = 5;
    }

    const pool = nhlTeams || [];
    const draftedBy = pool[Math.floor(Math.random() * pool.length)];

    setPlayer(p => ({ ...p, rights: draftedBy?.id, idolatry: capIdol(p.idolatry + idolBoost) }));
    setSeasonRecap(r => ({ ...r, draftPick: overallPick, draftRound: round, draftedBy: draftedBy, juniorTeam: player.team, juniorLeague: player.league }));
    setEventImpacts({ idol: idolBoost, money: 0, ovr: 0 });
    setScreen('draft');
  };

  const handleDraftChoice = (choice) => {
     const draftedBy = seasonRecap?.draftedBy;
     if (choice === 'ELC' && draftedBy) {
       setPlayer(p => ({
         ...p, team: draftedBy.id, league: 'NHL',
         teamsPlayedFor: [...(p.teamsPlayedFor || []), draftedBy.id],
         contract: { salary: 925000, years: 3 }
       }));
       setEventFeedback("You signed your ELC and are heading to your first NHL training camp.");
     } else if (choice === 'NCAA') {
       const pool = ncaaTeams || [];
       const ncaaTeam = pool[Math.floor(Math.random() * pool.length)];
       if (ncaaTeam) {
         setPlayer(p => ({
           ...p, team: ncaaTeam.id, league: 'NCAA',
           teamsPlayedFor: [...(p.teamsPlayedFor || []), ncaaTeam.id]
         }));
         setEventFeedback(`You deferred your contract to play NCAA hockey for ${ncaaTeam.name}.`);
       }
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
        break; // safety break if pools are empty
      }
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
      let demotionTargetLg = result.currentLg;
      let demotionTargetTeam = result.currentTeam;
      
      // NHL-CHL Under 20 Rule - Bypasses AHL
      const isUnder20 = player.age < 20 && player.contract?.salary > 0;
      const ohl = ohlTeams || []; const whl = whlTeams || []; const qmjhl = qmjhlTeams || [];
      const hasCHLHistory = player.teamsPlayedFor.some(t => ohl.find(o=>o.id===t) || whl.find(o=>o.id===t) || qmjhl.find(o=>o.id===t));
      
      if (isUnder20 && hasCHLHistory) {
          const lastCHL = player.teamsPlayedFor.slice().reverse().find(t => ohl.find(o=>o.id===t) || whl.find(o=>o.id===t) || qmjhl.find(o=>o.id===t));
          demotionTargetTeam = lastCHL || (ohl[0] ? ohl[0].id : null);
          if (whl.find(team=>team.id===demotionTargetTeam)) demotionTargetLg = 'WHL';
          else if (qmjhl.find(team=>team.id===demotionTargetTeam)) demotionTargetLg = 'QMJHL';
          else demotionTargetLg = 'OHL';
      }

      setActiveEvent({
        title: 'SENT DOWN',
        desc: `Your GM thinks you're not ready for the NHL. You've been sent down to the ${getFullTeamName(demotionTargetTeam, demotionTargetLg)} (${demotionTargetLg}).`,
        choices: [
          { label: 'Complain to the media', isRisky: true, successChance: 0.3, successFeedback: 'The fans love your fiery passion. You vow to prove the GM wrong!', successEffect: { idol: 15, ovr: 1, money: 0 }, failFeedback: 'You look like a spoiled kid. The GM fines you and the fans turn on you.', failEffect: { idol: -15, ovr: -1, money: -50000 } },
          { label: 'Put your head down and work', isRisky: false, feedback: 'You accepted the assignment like a professional and focused on your game.', effect: { idol: 5, ovr: 1, money: 0 } }
        ],
        isDemotionEvent: true,
        currentLg: demotionTargetLg,
        currentTeam: demotionTargetTeam,
        madePlayoffs: result.madePlayoffs
      });
      setScreen('event');
    } else {
      runPostSeasonFlow(result.updatedPlayer.age, result.updatedPlayer.ovr, result.currentLg, result.currentTeam, result.madePlayoffs, nextYear, result.recap?.standings || 16);
    }
  };

  const runPostSeasonFlow = (pAge, pOvr, currentLg, currentTeam, madePlayoffs, nextYear, standings) => {
    // ALWAYS lock in the playoff status first before we get derailed by minigames
    setPendingPlayoffs(madePlayoffs ? { lg: currentLg, team: currentTeam, standings } : null);

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
      const eventRoll = Math.random();
      if (eventRoll < 0.33) {
        const shuffledQ = [...PRESS_QUESTIONS].sort(() => 0.5 - Math.random()).slice(0, 3);
        const randomJournalist = PRESS_JOURNALISTS[Math.floor(Math.random() * PRESS_JOURNALISTS.length)];
        setActivePress({ journalist: randomJournalist, questions: shuffledQ, currentQ: 0, answers: [] });
        setScreen('press');
      } else if (eventRoll < 0.66) {
        triggerMinigame('season');
      } else {
        setMinigameContext('season');
        const deck = eventDeck || [];
        if (deck.length > 0) {
           const randomEvt = deck[Math.floor(Math.random() * deck.length)];
           setActiveEvent({ ...randomEvt, isDemotionEvent: false, madePlayoffs: false });
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
      setScreen('press-result');
    } else {
      setActivePress({ ...activePress, answers: newAnswers, currentQ: activePress.currentQ + 1 });
    }
  };

  const handleEndPress = () => {
    const hits = activePress.answers.filter(a => a === activePress.journalist?.id).length;
    
    setPlayer(prev => {
      let idolDelta = 0;
      let ovrDelta = 0;
      if (hits === 3) { idolDelta = 15; ovrDelta = 1; }
      else if (hits === 2) { idolDelta = 5; }
      else if (hits === 1) { idolDelta = -5; }
      else { idolDelta = -15; ovrDelta = -1; }
      
      const withOvr = applyOvrDelta(prev, ovrDelta);
      return { ...withOvr, idolatry: capIdol(withOvr.idolatry + idolDelta), ovr: recomputeOvr(withOvr) };
    });
    
    if (pendingPlayoffs) {
      const pp = pendingPlayoffs;
      setPendingPlayoffs(null);
      checkPlayoffs(pp.lg, pp.team, pp.standings);
    } else {
      setScreen('recap');
    }
  };

  const triggerMinigame = (context = 'season') => {
    const pool = getMinigamePool(player.pos) || [];
    if (pool.length === 0) return;
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
          setEventFeedback(`${successMsg} You won the Semi-Final!`);
        } else {
          setMemCup({ round: 1, status: 'won' });
          setPlayer(p => ({ ...p, stats: { ...p.stats, memCupBoost: 50, titles: p.stats.titles + 1 } }));
          setEventFeedback(`${successMsg} You won the Memorial Cup!`);
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
      const nat = safeNationalities.find(n => n.id === player.nat);
      const countryName = nat?.sentenceName || nat?.name || 'your country';
      if (scored) {
        unlockAchievement('gold_medal');
        setPlayer(prev => {
          const withOvr = applyOvrDelta(prev, 1);
          return { ...withOvr, idolatry: capIdol(withOvr.idolatry + 50), ovr: recomputeOvr(withOvr) };
        });
        setEventImpacts({ idol: 50, ovr: 1 });
        setEventFeedback(`${successMsg} You secured the Gold Medal for ${countryName}! You are a national hero!`);
      } else {
        setPlayer(prev => ({ ...prev, idolatry: capIdol(prev.idolatry - 5) }));
        setEventImpacts({ idol: -5 });
        setEventFeedback(`${failMsg} A devastating loss in the Gold Medal game. The fans in ${countryName} weep.`);
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
      let updated = { ...p };
      
      if (choice.action === 'JOIN_NCAA') {
        updated.team = choice.actionData;
        updated.league = 'NCAA';
        updated.teamsPlayedFor = [...(updated.teamsPlayedFor || []), choice.actionData];
      } else if (choice.action === 'JOIN_CHL') {
        updated.team = choice.actionData;
        updated.league = 'OHL';
        updated.teamsPlayedFor = [...(updated.teamsPlayedFor || []), choice.actionData];
      } else if (choice.action === 'SIGN_ELC') {
        updated.team = p.rights;
        updated.league = 'NHL';
        updated.contract = { salary: 925000, years: 3 };
      }
      
      const withOvr = applyOvrDelta(updated, outcomeEffect?.ovr || 0);
      return {
        ...withOvr,
        idolatry: capIdol(withOvr.idolatry + (outcomeEffect?.idol || 0)),
        ovr: recomputeOvr(withOvr),
        stats: { ...withOvr.stats, earnings: withOvr.stats.earnings + (outcomeEffect?.money || 0) }
      };
    });

    setEventImpacts(outcomeEffect || {});
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
    const multi = (player.inventory || []).includes('agent') ? 1.15 : 1.0;
    
    let leagueMinimum = 850000;
    if (currentYear === 2027) leagueMinimum = 900000;
    else if (currentYear === 2028) leagueMinimum = 950000;
    else if (currentYear >= 2029) leagueMinimum = 1000000;

    let baseSalary = leagueMinimum;
    let maxYears = 2;

    if (player.league === 'AHL' || isAmateur) {
      baseSalary = (leagueMinimum + (Math.random() * 150000)) * multi;
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
        baseSalary = (leagueMinimum + 150000 + ((player.ovr - 70) * 100000)) * multi;
        maxYears = 2;
      }
    } else {
      baseSalary = Math.max(leagueMinimum, 1000000) * multi;
      maxYears = 2;
    }

    baseSalary = Math.round(baseSalary / 25000) * 25000;

    let offers = [];
    const isRFA = player.age === 21;

    if (!isTradeRequest) {
      offers.push({
        team: actingTeam,
        type: isRFA ? 'RFA EXTENSION' : 'EXTENSION',
        salary: Math.max(leagueMinimum, baseSalary),
        years: Math.min(3, maxYears),
        idolHit: 10
      });
    }

    let offerCount = isRFA ? (Math.random() > 0.5 ? 1 : 0) : 3;
    if (isTradeRequest) offerCount = 2;

    for (let i = 0; i < offerCount; i++) {
      const pool = nhlTeams || [];
      if (pool.length > 0) {
        const t = pool[Math.floor(Math.random() * pool.length)].id;
        if (t !== actingTeam && !offers.find(o => o.team === t)) {
          let offerSalary = baseSalary * (0.85 + (Math.random() * 0.35)); 
          if (isRFA && player.league === 'NHL') offerSalary *= 1.25; 
          offerSalary = Math.round(offerSalary / 25000) * 25000;

          offers.push({
            team: t,
            type: isRFA ? 'OFFER SHEET' : (isTradeRequest ? 'TRADE' : 'FREE AGENCY'),
            salary: Math.max(leagueMinimum, offerSalary),
            years: Math.floor(Math.random() * maxYears) + 1,
            idolHit: getTransferImpact(actingTeam, t)
          });
        }
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
      const newTeams = (p.teamsPlayedFor || []).includes(o.team) ? p.teamsPlayedFor : [...(p.teamsPlayedFor || []), o.team];
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
      if (p.stats.earnings < item.cost || (p.inventory || []).includes(item.id)) return p;

      const stats = { ...p.stats, earnings: p.stats.earnings - item.cost };

      if (item.type === 'consumable') {
        return { ...p, stats, buffs: [...(p.buffs || []), item] };
      }

      const next = { ...p, stats, inventory: [...(p.inventory || []), item.id] };
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
      if (pendingPlayoffs) {
        const pp = pendingPlayoffs;
        setPendingPlayoffs(null);
        checkPlayoffs(pp.lg, pp.team, pp.standings);
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
        <div className="w-full max-w-xl game-panel p-6 sm:p-10 text-center border-t-2 border-t-[#22E748]">
          <h2 className="text-[#22E748] font-bold tracking-widest mb-2 sports-font text-sm sm:text-base">CAREER MODE</h2>
          <h1 className="text-5xl sm:text-6xl font-black mb-10 text-white italic sports-font uppercase tracking-tighter">BLUE CHIP PROSPECT</h1>

          <input
            type="text" placeholder="Your Last Name"
            className="w-full bg-[#101410] border border-[rgba(255,255,255,0.065)] text-white p-4 rounded-lg mb-6 text-center font-bold focus:border-[#22E748] outline-none transition-all font-sans"
            onChange={(e) => setPlayer({ ...player, name: e.target.value })}
          />

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
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
                className={`p-3 sm:p-4 rounded-xl border transition-colors cursor-pointer ${player.pos === p.id ? 'border-[#22E748] bg-[#22E748]/10' : 'border-[rgba(255,255,255,0.065)] bg-[#101410] hover:border-slate-500'}`}
              >
                <h3 className="text-2xl sm:text-3xl font-black text-white sports-font">{p.id}</h3>
                <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase mt-1 font-sans">{p.name}</p>
              </button>
            ))}
          </div>

          <p className="text-xs sm:text-sm font-bold text-slate-400 tracking-widest uppercase mb-3 font-sans text-center">Starting Path</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-6">
            {[
              { id: 'OHL', label: 'OHL' },
              { id: 'WHL', label: 'WHL' },
              { id: 'QMJHL', label: 'QMJHL' },
              { id: 'SHL', label: 'SHL (SWE)' },
              { id: 'LIIGA', label: 'LIIGA (FIN)' }
            ].map(lg => (
              <button
                key={lg.id}
                onClick={() => setPlayer({ ...player, startLeague: lg.id })}
                className={`p-2 sm:p-3 rounded-xl border transition-colors cursor-pointer ${player.startLeague === lg.id ? 'border-[#3b82f6] bg-[#3b82f6]/10' : 'border-[rgba(255,255,255,0.065)] bg-[#101410] hover:border-slate-500'}`}
              >
                <h3 className="text-[10px] sm:text-xs font-black text-white sports-font tracking-wide">{lg.label}</h3>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-10">
            {safeNationalities.map(n => (
              <button
                key={n.id}
                onClick={() => setPlayer({ ...player, nat: n.id })}
                className={`p-2 sm:p-3 rounded-xl border transition-colors cursor-pointer ${player.nat === n.id ? 'border-[#22E748] bg-[#22E748]/10' : 'border-[rgba(255,255,255,0.065)] bg-[#101410] hover:border-slate-500'} flex items-center justify-center`}
              >
                <img src={n.img} alt={n.name} className="w-8 h-6 object-cover rounded-sm" />
              </button>
            ))}
          </div>

          <button onClick={handleStart} disabled={!player.name} className="w-full btn-primary py-4 rounded-lg text-lg sm:text-xl disabled:opacity-50 mb-8 cursor-pointer sports-font tracking-widest">
            LACE UP THE SKATES
          </button>

          <div className="border-t border-[rgba(255,255,255,0.065)] pt-6">
            <h3 className="text-xs sm:text-sm font-bold text-slate-400 tracking-widest uppercase mb-4 font-sans text-center">Career Achievements</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              {MASTER_ACHIEVEMENTS.map(a => {
                const isUnlocked = unlockedAchievements.includes(a.id);
                return (
                  <div key={a.id} className={`p-2 sm:p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${isUnlocked ? 'bg-[#F59E0B]/10 border-[#F59E0B]/30' : 'bg-[#101410] border-[rgba(255,255,255,0.065)] opacity-50 grayscale'}`}>
                    <span className="text-xl sm:text-2xl mb-1">{a.icon}</span>
                    <span className={`text-[8px] sm:text-[10px] font-black uppercase tracking-widest sports-font leading-tight mb-1 ${isUnlocked ? 'text-[#F59E0B]' : 'text-slate-500'}`}>{a.name}</span>
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
        <div className="w-full max-w-4xl game-panel p-6 sm:p-12 border-t-2 border-t-[#22E748]">
          <p className="text-[#22E748] font-bold tracking-widest uppercase mb-3 text-center sports-font">END OF CAREER</p>
          <h1 className="text-4xl sm:text-6xl font-black italic mb-12 text-center sports-font tracking-tighter uppercase">{isLegend ? 'THEY BUILT YOU A STATUE' : 'YOU HUNG UP THE SKATES'}</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12">
            <div className="space-y-4 sm:space-y-6 text-lg sm:text-xl font-medium text-slate-300 font-sans">
              <h2 className="text-xl sm:text-2xl font-black text-white border-b border-[rgba(255,255,255,0.065)] pb-2 sports-font uppercase">NHL CAREER STATS</h2>
              <div className="flex justify-between pb-2"><span className="text-slate-400">Games Played</span> <span className="font-bold text-white sports-font">{player.stats.nhl?.games || 0}</span></div>
              {player.pos === 'G' ? (
                <>
                  <div className="flex justify-between pb-2"><span className="text-slate-400">Career SV%</span> <span className="font-bold text-white sports-font">{(player.stats.nhl?.shots > 0 && player.stats.nhl?.saves !== undefined) ? (player.stats.nhl.saves / player.stats.nhl.shots).toFixed(3).replace('0.', '.') : '.000'}</span></div>
                  <div className="flex justify-between pb-2"><span className="text-slate-400">Shutouts</span> <span className="font-bold text-white sports-font">{player.stats.nhl?.shutouts || 0}</span></div>
                </>
              ) : (
                <>
                  <div className="flex justify-between pb-2"><span className="text-slate-400">Total Goals</span> <span className="font-bold text-white sports-font">{player.stats.nhl?.goals || 0}</span></div>
                  <div className="flex justify-between pb-2"><span className="text-slate-400">Assists</span> <span className="font-bold text-white sports-font">{player.stats.nhl?.assists || 0}</span></div>
                </>
              )}
              <div className="flex justify-between pb-2"><span className="text-slate-400">Titles Won</span> <span className="text-[#F59E0B] font-black text-xl sm:text-2xl sports-font">{player.stats?.titles || 0}</span></div>
              <div className="flex justify-between pt-2 border-t border-[rgba(255,255,255,0.065)]"><span className="text-slate-400">Career Earnings</span> <span className="font-bold text-[#22E748] text-xl sm:text-2xl sports-font">{formatMoney(player.stats?.earnings || 0)}</span></div>
            </div>
          </div>
          <div className="mt-12 text-center">
            <button onClick={handleNewGame} className="btn-primary py-4 px-12 rounded-xl text-lg sm:text-xl cursor-pointer sports-font tracking-widest uppercase w-full sm:w-auto">
              START NEW CAREER
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-2 sm:p-6 flex flex-col font-sans bg-[#040505] text-white">
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
                    {(shopItems || []).filter(i => i.type === category).map(item => {
                      const isOwned = (player.inventory || []).includes(item.id) || (player.buffs || []).find(b => b.id === item.id);
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

        {screen === 'press' && (() => {
          const q = activePress.questions[activePress.currentQ];
          const answerKeys = ['professional', 'passionate', 'humble', 'cocky'].filter(k => q?.answers[k]);
          
          return (
            <div className="game-panel p-6 sm:p-8 mt-2 border-t-2 border-t-[#3b82f6] text-left">
              <div className="mb-6 border-b border-[rgba(255,255,255,0.065)] pb-4">
                 <h3 className="text-xs sm:text-sm font-bold text-slate-400 tracking-widest uppercase mb-1 font-sans">PRESS ROOM</h3>
                 <h2 className="text-3xl sm:text-4xl font-black text-white sports-font uppercase tracking-wide">THE PRESS CONFERENCE</h2>
              </div>
              
              <div className="bg-[#101410] border border-[rgba(255,255,255,0.065)] rounded-xl p-4 mb-6">
                <p className="text-sm font-bold text-white mb-1 flex items-center gap-2">🎧 Read the room.</p>
                <p className="text-xs text-slate-400">You won't know what they're looking for until the end. Your tone matters just as much as your words.</p>
              </div>

              {player.hockeyIQ >= 75 && (
                <div className="bg-[#22E748]/10 border border-[#22E748]/30 p-3 sm:p-4 rounded-xl mb-6 flex items-center gap-3">
                  <span className="text-2xl sm:text-3xl">🧠</span>
                  <div>
                    <p className="text-[#22E748] text-[9px] sm:text-[10px] font-black tracking-widest uppercase mb-1">HIGH IQ INSIGHT</p>
                    <p className="text-slate-300 text-xs sm:text-sm font-medium">You read the room perfectly. They are looking for a <span className="font-bold text-white uppercase">{activePress.journalist?.id}</span> answer.</p>
                  </div>
                </div>
              )}

              <p className="text-[10px] font-bold text-[#3b82f6] tracking-widest uppercase mb-2">QUESTION {activePress.currentQ + 1} OF 3</p>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-6 leading-snug">"{q?.q}"</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-8">
                {answerKeys.map((vibeKey) => {
                  const vibe = PRESS_VIBES[vibeKey];
                  return (
                    <button key={vibeKey} onClick={() => handlePressAnswer(vibeKey)} className="bg-[#101410] hover:bg-[#1a2230] border border-[rgba(255,255,255,0.065)] text-left p-4 sm:p-5 rounded-xl transition-colors group flex flex-col gap-3 cursor-pointer">
                       <div className="flex items-center gap-2">
                         <span className={`text-[9px] sm:text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest ${vibe.bg} ${vibe.color} border ${vibe.border}`}>{vibe.icon} {vibe.label}</span>
                       </div>
                       <p className="text-sm sm:text-base text-slate-300 font-medium group-hover:text-white transition-colors">"{q?.answers[vibeKey]}"</p>
                    </button>
                  )
                })}
              </div>

              <div className="flex gap-2 w-full h-1 mt-auto">
                 {[0,1,2].map(step => (
                    <div key={step} className={`flex-1 rounded-full ${step <= activePress.currentQ ? 'bg-[#3b82f6]' : 'bg-[#232d3f]'}`}></div>
                 ))}
              </div>
            </div>
          );
        })()}

        {screen === 'press-result' && (() => {
           const journalist = activePress.journalist;
           const hits = activePress.answers.filter(a => a === journalist?.id).length;
           
           let resultTitle, resultColor, resultText;
           if (hits === 3) { resultTitle = 'FLAWLESS CONFERENCE'; resultColor = 'text-[#22E748]'; resultText = 'Read them like a book. +15 Fan Status, +1 OVR'; }
           else if (hits === 2) { resultTitle = 'GOOD CONFERENCE'; resultColor = 'text-[#3b82f6]'; resultText = 'Solid, measured answers. +5 Fan Status'; }
           else if (hits === 1) { resultTitle = 'MIXED RECEPTION'; resultColor = 'text-[#F59E0B]'; resultText = 'They twisted your words. -5 Fan Status'; }
           else { resultTitle = 'PR DISASTER'; resultColor = 'text-[#ef4444]'; resultText = 'You alienated everyone. -15 Fan Status, -1 OVR'; }

           return (
            <div className="game-panel p-6 sm:p-8 mt-2 border-t-2 border-t-[#3b82f6] text-left">
              <div className="mb-6 border-b border-[rgba(255,255,255,0.065)] pb-4">
                 <h3 className="text-xs sm:text-sm font-bold text-slate-400 tracking-widest uppercase mb-1 font-sans">PRESS ROOM</h3>
                 <h2 className="text-3xl sm:text-4xl font-black text-white sports-font uppercase tracking-wide">THE PRESS CONFERENCE</h2>
              </div>

              <div className="border border-[rgba(255,255,255,0.065)] rounded-xl mb-6 overflow-hidden">
                 <div className="bg-[#101410] px-4 py-2 border-b border-[rgba(255,255,255,0.065)]">
                   <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">WHAT THEY WANTED</span>
                 </div>
                 <div className="p-4 bg-[#1a2230]">
                    <p className="text-sm text-white"><span className="font-bold text-[#3b82f6]">🎙️ {journalist?.name}:</span> {journalist?.desc}</p>
                 </div>
              </div>

              <div className="border border-[rgba(255,255,255,0.065)] rounded-xl mb-6 overflow-hidden">
                 <div className="bg-[#101410] px-4 py-2 border-b border-[rgba(255,255,255,0.065)]">
                   <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">THE TRANSCRIPT</span>
                 </div>
                 <div className="p-3 sm:p-4 bg-[#1a2230] flex flex-col gap-2 sm:gap-3">
                   {activePress.answers.map((ans, i) => {
                     const isHit = ans === journalist?.id;
                     const vibe = PRESS_VIBES[ans];
                     return (
                       <div key={i} className="flex justify-between items-center bg-[#101410] p-2 sm:p-3 rounded-lg border border-[rgba(255,255,255,0.03)]">
                          <div className="flex items-center gap-2 sm:gap-3">
                             <span className={`text-[8px] sm:text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest ${vibe?.bg} ${vibe?.color} border ${vibe?.border}`}>{vibe?.icon} {vibe?.label}</span>
                             {!isHit && <span className="text-slate-500 text-[10px] sm:text-xs italic hidden sm:inline">(Missed the mark)</span>}
                          </div>
                          <span className={isHit ? 'text-[#22E748]' : 'text-[#ef4444]'}>{isHit ? '✔' : '✖'}</span>
                       </div>
                     )
                   })}
                 </div>
              </div>

              <div className="bg-[#101410] border border-[rgba(255,255,255,0.065)] rounded-xl p-4 sm:p-6 text-center mb-8 flex flex-col items-center">
                 <span className="text-3xl mb-2">🎤</span>
                 <h3 className={`text-xl sm:text-2xl font-black sports-font uppercase tracking-wide ${resultColor} mb-1`}>{resultTitle}</h3>
                 <p className="text-slate-400 text-xs sm:text-sm">{resultText}</p>
              </div>

              <button onClick={handleEndPress} className="w-full btn-primary py-4 rounded-xl text-lg sm:text-xl cursor-pointer sports-font tracking-widest">
                CONTINUE CAREER ➔
              </button>
            </div>
           )
        })()}

        {screen === 'draft' && (() => {
          const isFirstRound = seasonRecap?.draftPick <= 32;
          return (
            <div className="game-panel p-6 sm:p-10 mt-2 text-center border-t-2 border-t-[#22E748]">
              <p className="text-[#22E748] font-bold tracking-widest uppercase text-xs sm:text-sm mb-2">THE NHL DRAFT</p>
              
              <div className="bg-[#101410] border border-[rgba(255,255,255,0.065)] p-6 sm:p-10 rounded-2xl mb-10 max-w-2xl mx-auto hover:scale-105 transition-transform shadow-2xl relative overflow-hidden flex flex-col items-center">
                <div className="absolute top-0 right-0 bg-[#3b82f6] text-white font-black text-[10px] sm:text-xs px-3 py-1 rounded-bl-lg tracking-widest">
                  ROUND {seasonRecap?.draftRound} • PICK {seasonRecap?.draftPick}
                </div>
                
                <TeamLogo teamId={seasonRecap?.draftedBy?.id} league="NHL" />
                
                <h3 className="text-lg sm:text-2xl font-bold text-slate-300 uppercase mt-6 mb-2 sports-font tracking-wide leading-tight">
                  THE {seasonRecap?.draftedBy?.name || 'UNKNOWN'} ARE PROUD TO SELECT, FROM {getFullTeamName(seasonRecap?.juniorTeam, seasonRecap?.juniorLeague).toUpperCase()} OF THE {seasonRecap?.juniorLeague}...
                </h3>
                
                <h2 className="text-5xl sm:text-6xl font-black text-[#3b82f6] sports-font uppercase mt-4 mb-2">{player.name}</h2>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <button onClick={() => handleDraftChoice('ELC')} className="btn-primary py-4 px-6 rounded-xl text-sm sm:text-base cursor-pointer sports-font tracking-widest w-full sm:w-auto">
                  SIGN ELC (TURN PRO)
                </button>
                {!isFirstRound && (
                  <button onClick={() => handleDraftChoice('RETURN')} className="bg-[#101410] hover:bg-[#1a2230] border border-[rgba(255,255,255,0.065)] text-white py-4 px-6 rounded-xl text-sm sm:text-base cursor-pointer sports-font tracking-widest transition-colors w-full sm:w-auto">
                    {player.league === 'NCAA' ? 'RETURN TO NCAA' : ['SHL', 'LIIGA'].includes(player.league) ? 'RETURN TO EUROPE' : 'RETURN TO JUNIORS'}
                  </button>
                )}
              </div>
            </div>
          );
        })()}

        {screen === 'preseason' && (
          <div className="game-panel p-6 sm:p-10 mt-2 border-t-2 border-t-[#22E748]">
            <h2 className="text-3xl sm:text-4xl font-black italic text-white uppercase mb-2 text-center sports-font tracking-tighter">PRE-SEASON {currentYear}</h2>
            <p className="text-slate-400 text-center mb-10 font-medium text-sm sm:text-lg font-sans">The dice rolled three upgrades. Pick one focus.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              {activeTrainings.map(t => (
                <div
                  key={t.id} onClick={() => handleTrain(t)}
                  className={`bg-[#101410] border border-[rgba(255,255,255,0.065)] rounded-xl cursor-pointer transition-all hover:-translate-y-1 flex flex-col min-h-[14rem] sm:min-h-[16rem] ${t.rarity === 'Epic' ? 'hover:border-[#F59E0B]' : t.rarity === 'Rare' ? 'hover:border-[#3b82f6]' : 'hover:border-[#22E748]'}`}
                >
                  <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        {t.rarity !== 'Common' ? (
                          <span className={`text-[9px] sm:text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest font-sans ${t.rarity === 'Epic' ? 'bg-[#F59E0B] text-black' : 'bg-[#3b82f6] text-white'}`}>{t.rarity}</span>
                        ) : <span></span>}
                        <span className="text-3xl sm:text-4xl font-black text-slate-700 uppercase sports-font tracking-tighter">
                          {{ 'SHT': 'SHOOTING', 'SKT': 'SKATING', 'PHY': 'PHYSICAL', 'IQ': 'HOCKEY IQ', 'STA': 'STAMINA', 'REF': 'REFLEXES', 'AGI': 'AGILITY' }[t.tag] || t.tag}
                        </span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black text-white uppercase leading-tight mb-3 text-left sports-font mt-2">{t.name}</h3>
                      <p className="text-xs sm:text-sm text-slate-400 leading-relaxed italic text-left font-sans mb-4">{t.flavor}</p>
                    </div>
                    <div className="mt-auto text-left pt-4 border-t border-[rgba(255,255,255,0.065)]">
                      <span className="inline-block text-[#22E748] font-bold text-xs sm:text-sm font-sans mt-2">{t.desc}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {screen === 'intl-minigame' && (() => {
          const nat = safeNationalities.find(n => n.id === player.nat);
          const countryName = nat?.sentenceName || nat?.name || 'your country';

          return (
            <div className="game-panel p-6 sm:p-12 mt-2 border-t-2 border-t-[#F59E0B] text-center">
              <h2 className="text-4xl sm:text-5xl font-black mb-4 text-[#F59E0B] sports-font tracking-tighter uppercase">🌍 INTERNATIONAL DUTY 🌍</h2>
              <p className="text-base sm:text-xl text-slate-300 mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed flex items-center justify-center flex-wrap gap-2 text-left">
                You are representing <span className="font-black text-white flex items-center gap-2">{countryName} <img src={nat?.img} alt={player.nat} className="w-6 h-4 object-cover rounded-[2px] border border-slate-600" /></span> in the {minigameContext === 'wjc' ? 'World Junior Gold Medal game' : 'Winter Games Final'}!
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
                {player.pos === 'G' ? (
                  <>
                    <button onClick={() => handleMinigameChoice(0.4 + player.physicality / 200, 'You smothered the rebound!', 'You gave up a juicy rebound.')} className="bg-[#101410] border border-[rgba(255,255,255,0.065)] hover:border-[#F59E0B] py-6 sm:py-8 px-4 rounded-xl font-bold text-xl sm:text-2xl text-white transition-all cursor-pointer flex flex-col items-center sports-font">
                      Swallow Rebound <span className="text-xs sm:text-sm text-[#F59E0B] font-normal mt-3 bg-[#F59E0B]/10 px-3 py-1 rounded-full uppercase tracking-widest font-sans border border-[#F59E0B]/30">AGI</span>
                    </button>
                    <button onClick={() => handleMinigameChoice(0.4 + player.hockeyIQ / 200, 'You perfectly directed traffic!', 'You were out of position.')} className="bg-[#101410] border border-[rgba(255,255,255,0.065)] hover:border-[#22E748] py-6 sm:py-8 px-4 rounded-xl font-bold text-xl sm:text-2xl text-white transition-all cursor-pointer flex flex-col items-center sports-font">
                      Direct Traffic <span className="text-xs sm:text-sm text-[#22E748] font-normal mt-3 bg-[#22E748]/10 px-3 py-1 rounded-full uppercase tracking-widest font-sans border border-[#22E748]/30">IQ</span>
                    </button>
                    <button onClick={() => handleMinigameChoice(0.4 + (player.shooting + player.physicality) / 400, 'You made an unbelievable save!', "Couldn't get there in time.")} className="bg-[#101410] border border-[rgba(255,255,255,0.065)] hover:border-[#3b82f6] py-6 sm:py-8 px-4 rounded-xl font-bold text-xl sm:text-2xl text-white transition-all cursor-pointer flex flex-col items-center sports-font">
                      Desperation Save <span className="text-xs sm:text-sm text-[#3b82f6] font-normal mt-3 bg-[#3b82f6]/10 px-3 py-1 rounded-full uppercase tracking-widest font-sans border border-[#3b82f6]/30">REF + AGI</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => handleMinigameChoice(0.4 + player.physicality / 200, 'You laid a massive hit!', 'You missed the hit.')} className="bg-[#101410] border border-[rgba(255,255,255,0.065)] hover:border-[#F59E0B] py-6 sm:py-8 px-4 rounded-xl font-bold text-xl sm:text-2xl text-white transition-all cursor-pointer flex flex-col items-center sports-font">
                      Big Hit <span className="text-xs sm:text-sm text-[#F59E0B] font-normal mt-3 bg-[#F59E0B]/10 px-3 py-1 rounded-full uppercase tracking-widest font-sans border border-[#F59E0B]/30">PHY</span>
                    </button>
                    <button onClick={() => handleMinigameChoice(0.4 + player.hockeyIQ / 200, 'You found the soft spot!', 'Skated into coverage.')} className="bg-[#101410] border border-[rgba(255,255,255,0.065)] hover:border-[#22E748] py-6 sm:py-8 px-4 rounded-xl font-bold text-xl sm:text-2xl text-white transition-all cursor-pointer flex flex-col items-center sports-font">
                      Find Open Ice <span className="text-xs sm:text-sm text-[#22E748] font-normal mt-3 bg-[#22E748]/10 px-3 py-1 rounded-full uppercase tracking-widest font-sans border border-[#22E748]/30">IQ</span>
                    </button>
                    <button onClick={() => handleMinigameChoice(0.4 + (player.skating + player.shooting) / 400, 'You ripped it top shelf!', 'Fumbled the puck.')} className="bg-[#101410] border border-[rgba(255,255,255,0.065)] hover:border-[#3b82f6] py-6 sm:py-8 px-4 rounded-xl font-bold text-xl sm:text-2xl text-white transition-all cursor-pointer flex flex-col items-center sports-font">
                      Rush the Net <span className="text-xs sm:text-sm text-[#3b82f6] font-normal mt-3 bg-[#3b82f6]/10 px-3 py-1 rounded-full uppercase tracking-widest font-sans border border-[#3b82f6]/30">SKT + SHT</span>
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
          } else if (player.league === 'NCAA') {
             narrativeTitle = seasonRecap?.playoffWins === 4 ? 'FROZEN FOUR CHAMPIONS' : 'CAMPUS HERO';
             narrative = "Another year of development in the NCAA.";
          } else if (['SHL', 'LIIGA', 'EURO'].includes(player.league)) {
             narrativeTitle = 'OVERSEAS EXPERIENCE';
             narrative = "Developing your game on the big ice.";
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
            <div className="game-panel p-6 sm:p-10 mt-2 border-t-2 border-t-[#3b82f6]">
              <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.065)] pb-4 mb-6">
                <h2 className="text-[#3b82f6] font-bold tracking-widest uppercase text-sm sm:text-lg sports-font">THE RINK REPORT</h2>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs sm:text-sm">
                  {(isJunior || player.league === 'NCAA' || ['SHL', 'LIIGA', 'EURO'].includes(player.league)) ? 'AMATEUR CAMPAIGN' : `NHL SEASON ${player.stats.seasonsPlayed - 2}`}
                </p>
              </div>

              <div className="w-full mb-8">
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-2">
                  <h1 className="text-3xl sm:text-4xl font-black text-white italic uppercase text-left sports-font tracking-tighter m-0">
                    {narrativeTitle}
                  </h1>
                  <div className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg flex items-center gap-2 border ${displayRating >= 8 ? 'bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#F59E0B]' : 'bg-[#101410] border-[rgba(255,255,255,0.065)] text-slate-300'}`}>
                    <div className="flex flex-col text-right justify-center mt-0.5">
                      <span className="text-[8px] sm:text-[9px] font-bold tracking-widest uppercase font-sans leading-none mb-[2px]">SEASON</span>
                      <span className="text-[8px] sm:text-[9px] font-bold tracking-widest uppercase font-sans leading-none">RATING</span>
                    </div>
                    <span className="text-2xl sm:text-3xl font-black sports-font leading-none">{displayRating}</span>
                  </div>
                </div>
                <p className="text-base sm:text-lg text-slate-400 font-sans italic text-left m-0">"{narrative}"</p>
              </div>

              <ul className="space-y-3 sm:space-y-4 text-slate-300 text-sm sm:text-lg mb-10 font-sans text-left">
                <li className="border-l-4 border-[#3b82f6] pl-4 py-1">🏅 {getFullTeamName(player.team, player.league)} finished <strong className="text-white">#{seasonRecap?.standings || '-'}</strong> in the {player.league}.</li>
                
                {player.pos === 'G' ? (
                  <li className="border-l-4 border-[#22E748] pl-4 py-1">🥅 Recorded a <strong className="text-white">{(seasonRecap?.saves / seasonRecap?.shots || 0).toFixed(3).replace('0.', '.')} SV%</strong> and <strong className="text-white">{seasonRecap?.sho || 0} shutouts</strong> in {seasonRecap?.games || 0} games.</li>
                ) : ['LD', 'RD'].includes(player.pos) ? (
                  <li className="border-l-4 border-[#22E748] pl-4 py-1">🛡️ Anchored the defense with <strong className="text-white">{seasonRecap?.g || 0}G, {seasonRecap?.a || 0}A</strong> and a <strong className="text-white">{seasonRecap?.pm > 0 ? `+${seasonRecap.pm}` : (seasonRecap?.pm || 0)}</strong> rating.</li>
                ) : (
                  <li className="border-l-4 border-[#22E748] pl-4 py-1">🏒 Potted <strong className="text-white">{seasonRecap?.g || 0} goals</strong> and <strong className="text-white">{seasonRecap?.a || 0} assists</strong>.</li>
                )}

                {madePlayoffsForNarrative ? (
                  <li className={`border-l-4 ${seasonRecap?.playoffWins === 4 ? 'border-[#F59E0B] text-[#F59E0B] font-bold' : 'border-[#ef4444]'} pl-4 py-1`}>
                    {seasonRecap?.playoffWins === 4 ? '🏆 Won the Cup!' : `Eliminated after ${seasonRecap?.playoffWins || 0} playoff wins.`}
                  </li>
                ) : (
                  <li className="border-l-4 border-slate-600 pl-4 py-1">⛳ Missed the playoffs.</li>
                )}
              </ul>

              <div className="flex gap-4 mt-8">
                <button onClick={advanceToOffseason} className="btn-primary flex-1 py-4 rounded-xl text-lg sm:text-xl cursor-pointer sports-font tracking-widest">
                  PROCEED TO OFFSEASON
                </button>
              </div>
            </div>
          );
        })()}

        {screen === 'event' && (
          <div className="game-panel p-6 sm:p-10 mt-2 border-t-2 border-t-[#3b82f6]">
            <h2 className="text-xl sm:text-2xl font-black text-white uppercase mb-4 sports-font text-left">🗣 {activeEvent.title}</h2>
            <p className="text-base sm:text-lg text-slate-300 mb-8 max-w-2xl font-sans text-left">{activeEvent.desc}</p>
            <div className="flex flex-col gap-3 sm:gap-4 font-sans">
              {(activeEvent.choices || []).map((c, i) => (
                <button key={i} onClick={() => handleEventChoice(c)} className="bg-[#101410] hover:bg-[#1a2230] border border-[rgba(255,255,255,0.065)] text-white p-4 sm:p-6 rounded-xl font-bold text-left transition-all cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <span className="text-sm sm:text-base">{c.label}</span>
                  {c.isRisky && <span className="bg-[#ef4444]/10 text-[#ef4444] text-[10px] sm:text-xs px-2 py-1 rounded font-black tracking-widest uppercase border border-[#ef4444]/30">RISKY</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {screen === 'minigame' && (() => {
          const mg = findMinigame(activeMinigame, player.pos);
          const accent = ACCENT[mg?.accent] || ACCENT.blue;

          return (
            <div className={`game-panel p-6 sm:p-12 mt-2 border-t-2 ${accent.border} text-center`}>
              <h2 className={`text-4xl sm:text-5xl font-black mb-4 ${accent.heading} sports-font tracking-tighter uppercase`}>{mg?.title}</h2>
              <p className="text-lg sm:text-xl text-slate-300 mb-8 sm:mb-12 max-w-2xl mx-auto text-left">{mg?.desc}</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
                {(mg?.choices || []).map((c, i) => {
                  const chance = choiceChance(player, c);
                  const pill = ARCH_PILL[c.archetype] || ARCH_PILL.safe;
                  return (
                    <button key={i} onClick={() => handleMinigameChoice(chance, c.success, c.fail, c.reward)} className={`bg-[#101410] hover:bg-[#1a2230] border border-[rgba(255,255,255,0.065)] ${pill.hover} py-5 sm:py-7 px-4 rounded-xl font-bold text-xl sm:text-2xl text-white transition-all cursor-pointer flex flex-col items-center sports-font`}>
                      {c.label}
                      <span className={`text-[10px] sm:text-xs font-black mt-3 px-3 py-1 rounded-full uppercase tracking-widest font-sans border ${pill.cls}`}>
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
          <div className="game-panel p-6 sm:p-10 mt-2 text-center border-t-2 border-t-[#22E748]">
            <h2 className="text-3xl sm:text-4xl font-black text-white uppercase mb-6 sports-font tracking-tighter">THE VERDICT</h2>
            <p className="text-lg sm:text-xl italic text-slate-300 mb-8 max-w-2xl mx-auto text-center font-sans">"{eventFeedback}"</p>

            <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-10">
              {eventImpacts.idol !== undefined && eventImpacts.idol !== 0 && (
                <div className={`min-w-[120px] sm:min-w-[140px] px-4 py-3 sm:px-6 sm:py-4 rounded-xl border ${eventImpacts.idol > 0 ? 'bg-[#22E748]/10 border-[#22E748]/30 text-[#22E748]' : 'bg-[#ef4444]/10 border-[#ef4444]/30 text-[#ef4444]'}`}>
                  <p className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest mb-1 text-slate-400">FAN STATUS</p>
                  <p className="text-3xl sm:text-4xl font-black sports-font">{eventImpacts.idol > 0 ? '+' : ''}{eventImpacts.idol}</p>
                </div>
              )}
              {eventImpacts.ovr !== undefined && eventImpacts.ovr !== 0 && (
                <div className={`min-w-[120px] sm:min-w-[140px] px-4 py-3 sm:px-6 sm:py-4 rounded-xl border ${eventImpacts.ovr > 0 ? 'bg-[#3b82f6]/10 border-[#3b82f6]/30 text-[#3b82f6]' : 'bg-[#ef4444]/10 border-[#ef4444]/30 text-[#ef4444]'}`}>
                  <p className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest mb-1 text-slate-400">OVR IMPACT</p>
                  <p className="text-3xl sm:text-4xl font-black sports-font">{eventImpacts.ovr > 0 ? '+' : ''}{eventImpacts.ovr}</p>
                </div>
              )}
              {eventImpacts.money !== undefined && eventImpacts.money !== 0 && (
                <div className="min-w-[120px] sm:min-w-[140px] px-4 py-3 sm:px-6 sm:py-4 rounded-xl border bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#F59E0B]">
                  <p className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest mb-1 text-slate-400">EARNINGS</p>
                  <p className="text-3xl sm:text-4xl font-black sports-font">+{formatMoney(eventImpacts.money)}</p>
                </div>
              )}
            </div>

            <button onClick={handleContinueEvent} className="btn-primary py-4 px-12 rounded-xl text-lg sm:text-xl cursor-pointer sports-font tracking-widest w-full sm:w-auto">
              CONTINUE CAREER ➔
            </button>
          </div>
        )}

        {screen === 'playoffs' && (
          <div className="game-panel p-6 sm:p-10 mt-2 border-t-2 border-t-[#F59E0B] text-center">
            <h2 className="text-3xl sm:text-4xl font-black tracking-widest mb-2 text-[#F59E0B] sports-font">🏆 PLAYOFFS 🏆</h2>
            <h3 className="text-lg sm:text-2xl font-bold mb-8 bg-[#101410] px-4 sm:px-6 py-2 sm:py-3 rounded-xl border border-[rgba(255,255,255,0.065)] inline-block sports-font">
              WINS FOUND: <span className="text-[#22E748]">{playoffs.wins}</span> / 4
            </h3>
            <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-10 max-w-2xl mx-auto">
              {(playoffs.deck || []).map((item, index) => {
                const isRevealed = (playoffs.revealed || []).includes(index);
                const showForcefully = playoffs.status !== 'playing' && !isRevealed;
                let btnClass = 'h-16 sm:h-24 text-sm sm:text-xl font-black rounded-xl border transition-all flex flex-col items-center justify-center cursor-pointer sports-font ';
                if (isRevealed || showForcefully) {
                  btnClass += !item.isWin ? 'bg-[#ef4444] border-[#ef4444] text-white' : 'bg-[#22E748] border-[#22E748] text-black';
                } else {
                  btnClass += 'bg-[#101410] border-[rgba(255,255,255,0.065)] text-slate-500 hover:border-slate-500 hover:text-white';
                }
                return (
                  <button key={index} onClick={() => handleGridClick(index)} className={btnClass} disabled={playoffs.status !== 'playing' || isRevealed}>
                    {(isRevealed || showForcefully) ? (<><span className="text-[8px] sm:text-[10px] truncate w-full px-1">{item.opp}</span><span>{item.score}</span></>) : '?'}
                  </button>
                );
              })}
            </div>
            {playoffs.status === 'won' && <button onClick={proceedFromPlayoffs} className="btn-primary py-4 px-12 rounded-xl cursor-pointer sports-font tracking-widest w-full sm:w-auto">CONTINUE</button>}
            {playoffs.status === 'lost' && <button onClick={handleEndPlayoffs} className="bg-[#101410] hover:bg-[#1a2230] border border-[rgba(255,255,255,0.065)] text-white py-4 px-12 rounded-xl cursor-pointer sports-font tracking-widest w-full sm:w-auto">CONTINUE</button>}
          </div>
        )}

        {screen === 'memorial-cup' && (
          <div className="game-panel p-6 sm:p-12 mt-2 border-t-2 border-t-[#F59E0B] text-center">
            <h2 className="text-4xl sm:text-5xl font-black mb-4 text-[#F59E0B] sports-font tracking-tighter uppercase">THE MEMORIAL CUP</h2>
            <p className="text-lg sm:text-xl text-slate-300 mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed text-center">The ultimate prize in Junior Hockey. Win two games to cement your legacy.</p>

            {memCup.status === 'playing' && (
              <div className="relative z-10 flex flex-col items-center">
                <h3 className="text-2xl sm:text-3xl font-bold mb-8 sports-font text-white text-center">{memCup.round === 0 ? 'SEMI-FINAL MATCHUP' : 'CHAMPIONSHIP FINAL'}</h3>
                <button onClick={() => triggerMinigame('memcup')} className="btn-primary w-full sm:w-auto py-4 px-10 rounded-xl font-black text-lg sm:text-xl text-white transition-all hover:scale-105 cursor-pointer shadow-lg sports-font uppercase tracking-widest">
                  PLAY MATCH
                </button>
              </div>
            )}

            {memCup.status === 'won' && (
              <div className="relative z-10">
                <h2 className="text-3xl sm:text-4xl font-black text-[#F59E0B] mb-6 sports-font">🏆 MEMORIAL CUP CHAMPIONS! 🏆</h2>
                <p className="text-slate-300 mb-8 font-bold">Your draft stock has skyrocketed.</p>
                <button onClick={handleEndMemCup} className="bg-[#101410] hover:bg-[#1a2230] border border-[rgba(255,255,255,0.065)] text-white font-black py-3 px-10 rounded-full shadow-xl cursor-pointer sports-font tracking-widest uppercase w-full sm:w-auto">Continue to Recap</button>
              </div>
            )}

            {memCup.status === 'lost' && (
              <div className="relative z-10 mt-4">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-500 mb-6 sports-font">💀 ELIMINATED. 💀</h2>
                <p className="text-slate-400 mb-8 font-bold">Your season ends in heartbreak.</p>
                <button onClick={handleEndMemCup} className="bg-[#101410] hover:bg-[#1a2230] border border-[rgba(255,255,255,0.065)] text-white font-bold py-3 px-10 rounded-full cursor-pointer sports-font tracking-widest uppercase w-full sm:w-auto">Continue to Recap</button>
              </div>
            )}
          </div>
        )}

        {screen === 'transfer' && (
          <div className="game-panel p-6 sm:p-10 mt-2 border-t-2 border-t-[#3b82f6]">
            <h2 className="text-3xl sm:text-4xl font-black italic text-white uppercase mb-4 text-center sports-font tracking-tighter">FREE AGENCY</h2>
            <p className="text-slate-400 text-base sm:text-lg mb-8 sm:mb-10 font-medium text-center">The market speaks. Glory or money?</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {(freeAgencyOffers || []).map((o, i) => (
                <div key={i} className="bg-[#101410] border border-[rgba(255,255,255,0.065)] p-5 sm:p-6 rounded-xl flex flex-col text-left">
                  <div className="flex items-center gap-3 mb-4">
                    <TeamLogo teamId={o.team} league="NHL" />
                    <h3 className="text-xl sm:text-2xl font-black text-white sports-font">{o.team}</h3>
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-[#22E748] mb-1 sports-font">{formatMoney(o.salary)}<span className="text-xs sm:text-sm text-slate-400 font-sans"> /yr</span></p>
                  <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase mb-6">{o.years}-year contract</p>
                  <button onClick={() => signContract(o)} className="w-full btn-primary py-3 rounded-lg cursor-pointer sports-font tracking-widest mt-auto">SIGN DEAL</button>
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