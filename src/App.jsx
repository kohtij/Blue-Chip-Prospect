import { useState, useEffect } from 'react';
import './App.css';
import {
  nhlTeams, ohlTeams, whlTeams, qmjhlTeams, ushlTeams, ahlTeams, shlTeams, liigaTeams, ncaaTeams,
  nationalities, juniorLeagues, euroLeagues, LEAGUE_CONFIG,
  getTeamData, getDeployment, getOpponentPool, getPrimaryRival
} from './data/teams';
import { shopItems, skaterTrainingPool, goalieTrainingPool, eventDeck } from './data/economy';
import { getMinigamePool, findMinigame } from './data/minigames';
import {
  cap, capIdol, formatMoney, getIdolTier, getTransferImpact,
  getActiveStat, applyOvrDelta, recomputeOvr, simulateSeason, generatePlayoffDeck,
  choiceChance
} from './utils/gameHelpers';

const getDisplayDeployment = (ovr, pos, league) => {
  return getDeployment(ovr, pos, league);
};

const getFullTeamName = (teamId, league) => {
  if (!teamId) return 'UNKNOWN';
  const t = typeof teamId === 'object' ? teamId : getTeamData(teamId, league);
  if (!t) return 'UNKNOWN';
  if (t.city && t.name && !t.name.includes(t.city)) return `${t.city} ${t.name}`;
  return t.name || t.id || 'UNKNOWN';
};

// Deterministic Conference Assigner (Keeps teams strictly in East or West)
const getTeamConference = (teamId) => {
  if (!teamId) return 'East';
  let hash = 0;
  for (let i = 0; i < teamId.length; i++) {
    hash = teamId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 2 === 0 ? 'East' : 'West';
};

// Dynamic Playoff Title Generator
const getPlayoffTitles = (league) => {
  switch (league) {
    case 'NHL': return { banner: 'STANLEY CUP PLAYOFFS', final: 'STANLEY CUP FINAL', trophy: '🏆', cupName: 'Stanley Cup' };
    case 'AHL': return { banner: 'CALDER CUP PLAYOFFS', final: 'CALDER CUP FINAL', trophy: '🏆', cupName: 'Calder Cup' };
    case 'OHL': return { banner: 'OHL PLAYOFFS', final: 'OHL CHAMPIONSHIP FINAL', trophy: '🏆', cupName: 'J. Ross Robertson Cup' };
    case 'WHL': return { banner: 'WHL PLAYOFFS', final: 'WHL CHAMPIONSHIP FINAL', trophy: '🏆', cupName: 'Ed Chynoweth Cup' };
    case 'QMJHL': return { banner: 'QMJHL PLAYOFFS', final: 'GILLES-COURTEAU TROPHY FINAL', trophy: '🏆', cupName: 'Gilles-Courteau Trophy' };
    default: return { banner: `${league || 'LEAGUE'} PLAYOFFS`, final: `${league || 'LEAGUE'} FINAL`, trophy: '🏆', cupName: `${league || 'League'} Championship` };
  }
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
  // DRAFT & AMATEUR
  { id: 'first_overall', name: 'Generational', desc: 'Drafted 1st Overall in the NHL Draft', icon: '🌟' },
  { id: 'first_round_pick', name: 'Top Prospect', desc: 'Drafted in the 1st Round of the NHL Draft', icon: '🎯' },
  { id: 'mem_cup', name: 'Junior Legend', desc: 'Win the CHL Memorial Cup', icon: '🏆' },
  { id: 'ncaa_champ', name: 'College Glory', desc: 'Commit to and play for a top NCAA D1 Hockey program', icon: '🎓' },
  { id: 'transfer_portal', name: 'Portal Hopper', desc: 'Enter the NCAA Transfer Portal to switch universities', icon: '🔄' },
  { id: 'import_draft', name: 'Cross the Pond', desc: 'Move from Europe to North America via the CHL Import Draft', icon: '✈️' },
  { id: 'undrafted_star', name: 'Underdog Story', desc: 'Reach 75+ OVR as an undrafted free agent', icon: '🐺' },

  // TROPHIES & CHAMPIONSHIPS
  { id: 'stanley_cup', name: 'Lord Stanley', desc: 'Win the Stanley Cup Championship', icon: '💍' },
  { id: 'conf_champ', name: 'Conference Champ', desc: 'Win the Conference Finals and reach the Stanley Cup Final', icon: '🛡️' },
  { id: 'ahl_champ', name: 'Calder Cup', desc: 'Win the AHL Calder Cup Championship', icon: '🏆' },
  { id: 'gold_medal', name: 'National Hero', desc: 'Win International Gold at the WJC or Olympics', icon: '🥇' },
  { id: 'back_to_back', name: 'Dynasty', desc: 'Win consecutive championships back-to-back', icon: '👑' },

  // INDIVIDUAL AWARDS
  { id: 'hart', name: 'League MVP', desc: 'Win the Hart Memorial Trophy', icon: '⭐' },
  { id: 'vezina', name: 'Vezina Trophy', desc: 'Win the Vezina Trophy as the top Goaltender', icon: '🧱' },
  { id: 'norris', name: 'Norris Trophy', desc: 'Win the Norris Trophy as the top Defenseman', icon: '🛡️' },
  { id: 'calder', name: 'Rookie of the Year', desc: 'Win the Calder Memorial Trophy', icon: '🐣' },
  { id: 'art_ross', name: 'Scoring Champion', desc: 'Win the Art Ross Trophy for leading the league in points', icon: '🏒' },
  { id: 'richard', name: 'Rocket Richard', desc: 'Win the Maurice Richard Trophy for leading the league in goals', icon: '🚀' },
  { id: 'conn_smythe', name: 'Playoff MVP', desc: 'Win the Conn Smythe Trophy as Playoff MVP', icon: '🔥' },

  // MILESTONES & PERFORMANCE
  { id: 'first_nhl_goal', name: 'First of Many', desc: 'Record your first official NHL point or win', icon: '🚨' },
  { id: 'fifty_goal_season', name: 'Rocket Man', desc: 'Score 50+ goals in a single NHL season', icon: '🔥' },
  { id: 'hundred_pt_season', name: 'Century Club', desc: 'Post 100+ points in a single NHL season', icon: '💯' },
  { id: 'shutout_king', name: 'Brick Wall', desc: 'Record 8+ shutouts in a single goalie season', icon: '🧱' },
  { id: 'max_ovr', name: 'Peak Performance', desc: 'Reach an Overall Rating (OVR) of 90 or higher', icon: '⚡' },
  { id: 'iron_man', name: 'Iron Man', desc: 'Play 15 or more consecutive seasons in your career', icon: '🦾' },

  // LOYALTY & FAN STATUS
  { id: 'franchise_legend', name: 'Statue Outside', desc: 'Reach Max Fan Status (1000 Fan Idolatry)', icon: '🗽' },
  { id: 'one_club_man', name: 'One Club Legend', desc: 'Play 10+ seasons for a single franchise', icon: '🏛️' },
  { id: 'return_home', name: 'Prodigal Son', desc: 'Return and sign with the team that originally drafted you', icon: '🏠' },
  { id: 'local_hero', name: 'Hometown Favorite', desc: 'Reach "Loved" status with your team\'s fanbase', icon: '❤️' },

  // CONTRACTS & WEALTH
  { id: 'fifty_mil', name: 'Bag Secured', desc: 'Earn $50M in cumulative career earnings', icon: '💰' },
  { id: 'hundred_mil', name: 'Nine Figures', desc: 'Earn $100M in cumulative career earnings', icon: '💎' },
  { id: 'big_nil', name: 'NIL Money', desc: 'Secure a college NIL endorsement deal', icon: '💵' },
  { id: 'vet_contract', name: 'Old Guard', desc: 'Sign an NHL contract extension at age 35 or older', icon: '⏳' },

  // DRAMA, RIVALRIES & MEDIA
  { id: 'rival_slayer', name: 'Rivalry Dominance', desc: 'Win a Rivalry Night matchup using a risky response option', icon: '🔥' },
  { id: 'betrayal', name: 'Judas', desc: 'Sign directly with your team\'s arch-rival in Free Agency', icon: '🗡️' },
  { id: 'trade_demanded', name: 'I Want Out', desc: 'Demand a trade at the trade deadline', icon: '🚪' },
  { id: 'trade_rejected', name: 'Locked Down', desc: 'Have your GM reject your mid-season trade demand', icon: '🔒' },
  { id: 'press_master', name: 'PR Masterclass', desc: 'Get a perfect 3/3 score in a Press Conference', icon: '🎤' },
  { id: 'press_disaster', name: 'PR Disaster', desc: 'Score 0/3 in a disastrous Press Conference', icon: '🤡' },
  { id: 'demoted', name: 'Sent Down', desc: 'Get demoted to the minors or junior hockey', icon: '📉' },

  // PLAYOFFS & MINIGAMES
  { id: 'sweep', name: 'Broom Time', desc: 'Sweep an opponent 4-0 in a playoff series', icon: '🧹' },
  { id: 'game_seven_hero', name: 'Clutch Gene', desc: 'Win a Game 7 series in the playoffs', icon: '⏳' },
  { id: 'swept_exit', name: 'Humiliated', desc: 'Get swept 0-4 out of the first round of the playoffs', icon: '💀' },

  // ECONOMY & SHOP
  { id: 'agent_hired', name: 'Super Agent', desc: 'Purchase the Agent upgrade from the shop', icon: '👔' },
  { id: 'luxury_buyer', name: 'Living Large', desc: 'Purchase a Luxury item from the shop', icon: '⌚' },
  { id: 'staff_hired', name: 'Personal Staff', desc: 'Hire a permanent staff member from the shop', icon: '💪' },

  // CAREER ENDINGS & META
  { id: 'hall_of_fame', name: 'First Ballot', desc: 'Retire with at least 3 Titles and 5 Individual Trophies', icon: '🏛️' },
  { id: 'veteran_retirement', name: 'Hanging Up the Skates', desc: 'Retire after age 38 as an active NHL player', icon: '🏒' },
  { id: 'hat_trick_hero', name: 'Hat Trick Hero', desc: 'Score 3+ goals in a single game', icon: '🎩' },
  { id: 'the_idol', name: 'The Ultimate Idol', desc: 'Unlock 40 or more total achievements across all career playthroughs', icon: '🏆' }
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
      <div className="relative w-8 h-8 sm:w-12 sm:h-12 flex items-center justify-center bg-white rounded-full p-1 border border-[rgba(255,255,255,0.14)] shrink-0">
        <img
          src={`https://assets.nhle.com/logos/nhl/svg/${teamId}_light.svg`}
          alt={teamId}
          className="w-full h-full object-contain"
          onError={(e) => { e.target.style.display = 'none'; setImgError(true); }}
        />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="relative w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-black text-[8px] sm:text-sm border-2 bg-[#101410] text-white border-[rgba(255,255,255,0.14)] sports-font shrink-0">
        {teamId}
        {isAHL && <span className="absolute -bottom-1 -right-1 bg-[#F59E0B] text-black text-[7px] sm:text-[9px] px-1 rounded-sm font-black border border-black z-10 shadow-sm leading-tight">AHL</span>}
      </div>
    );
  }

  return (
    <div className="relative w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-black text-[8px] sm:text-xs border-2 sports-font shadow-lg shrink-0 text-center leading-none overflow-hidden" style={{ backgroundColor: team.bg, color: team.color, borderColor: team.color }}>
      {team.id}
      {isAHL && <span className="absolute -bottom-1 -right-1 bg-[#F59E0B] text-black text-[7px] sm:text-[9px] px-1 rounded-sm font-black border border-black z-10 shadow-sm leading-tight">AHL</span>}
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
            <div className="flex items-center gap-2 sm:gap-3 mb-1">
              {player.team && <TeamLogo teamId={player.team} league={player.league} isAHL={isAHL} />}
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
              {player.pos} · {getDisplayDeployment(player.ovr, player.pos, player.league)} · {isJunior ? `${player.league} JUNIORS` : getFullTeamName(player.team, player.league)} · {player.age} YRS OLD · {player.stats[lgKey]?.games || 0} GP
            </p>
          </div>
        </div>

        <div className="flex w-full sm:w-auto justify-between sm:justify-end items-center gap-4 mt-2 sm:mt-0 pt-3 sm:pt-0 border-t border-[rgba(255,255,255,0.065)] sm:border-0">
          {!isJunior && player.league !== 'NCAA' && (
            <button onClick={onOpenShop} className="bg-[#101410] hover:bg-[#1a2230] border border-[rgba(255,255,255,0.065)] rounded-xl px-4 py-2 sm:px-5 sm:py-3 text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center gap-2 font-sans text-white cursor-pointer w-full justify-center">
              🛒 <span className="tracking-wide">SHOP</span>
            </button>
          )}
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
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 leading-none">Need {tier.req} pts to reach {tier.nextLabel}</p>
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
  const [showAchievementsMenu, setShowAchievementsMenu] = useState(false);

  const [unlockedAchievements, setUnlockedAchievements] = useState(() => {
    try {
      const saved = localStorage.getItem('hockey_career_achievements');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [achievementToast, setAchievementToast] = useState(null);

  const unlockAchievement = (id) => {
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
  };

  useEffect(() => {
    if (unlockedAchievements.length >= 40) {
      unlockAchievement('the_idol');
    }
  }, [unlockedAchievements]);

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
  const [hasDemandedTrade, setHasDemandedTrade] = useState(false);
  const [playoffs, setPlayoffs] = useState({ bracket: [], activeRoundIndex: 0, overallStatus: 'playing' });
  const [memCup, setMemCup] = useState({ round: 0, status: 'playing' });
  const [pendingPlayoffs, setPendingPlayoffs] = useState(null);
  const [pendingSeasonResult, setPendingSeasonResult] = useState(null);

  const [player, setPlayer] = useState({
    name: '', number: 97, pos: 'C', age: 16, ovr: 55, nat: 'CAN',
    shooting: 55, skating: 55, physicality: 55, hockeyIQ: 55, stamina: 55,
    team: null, league: null, contract: { salary: 0, years: 0 },
    stats: {
      chl: { goals: 0, assists: 0, games: 0, plusMinus: 0, saves: 0, shots: 0, shutouts: 0 },
      ahl: { goals: 0, assists: 0, games: 0, plusMinus: 0, saves: 0, shots: 0, shutouts: 0 },
      nhl: { goals: 0, assists: 0, games: 0, plusMinus: 0, saves: 0, shots: 0, shutouts: 0 },
      titles: 0, earnings: 0, value: 50000, seasonsPlayed: 0, memCupBoost: 0, awards: []
    },
    seasonHistory: [],
    idolatry: 0, inventory: [], buffs: [], agentRerolls: 1, teamsPlayedFor: [], rights: null, startLeague: 'OHL'
  });

  // Continuous milestone, wealth, loyalty and longevity achievements.
  useEffect(() => {
    if (player.idolatry >= 1000) unlockAchievement('franchise_legend');
    if (player.idolatry >= 400) unlockAchievement('local_hero');
    if ((player.stats?.earnings || 0) >= 50000000) unlockAchievement('fifty_mil');
    if ((player.stats?.earnings || 0) >= 100000000) unlockAchievement('hundred_mil');
    if (player.ovr >= 75 && !player.draftTeam && !player.rights && (player.stats?.seasonsPlayed || 0) >= 1) {
      unlockAchievement('undrafted_star');
    }
    if ((player.stats?.seasonsPlayed || 0) >= 15) unlockAchievement('iron_man');

    // Loyalty: 10+ seasons logged for a single franchise.
    const teamCounts = {};
    (player.seasonHistory || []).forEach(s => {
      if (s.team) teamCounts[s.team] = (teamCounts[s.team] || 0) + 1;
    });
    if (Object.values(teamCounts).some(c => c >= 10)) unlockAchievement('one_club_man');

    // Dynasty: two consecutive title-winning seasons.
    const hist = player.seasonHistory || [];
    for (let i = 1; i < hist.length; i++) {
      if (hist[i]?.titleWon && hist[i - 1]?.titleWon) { unlockAchievement('back_to_back'); break; }
    }
  }, [player]);

  // Retirement-triggered career achievements.
  useEffect(() => {
    if (screen !== 'retirement') return;
    const titles = player.stats?.titles || 0;
    const trophyCount = (player.stats?.awards || []).length;
    if (titles >= 3 && trophyCount >= 5) unlockAchievement('hall_of_fame');
    if (player.age > 38 && player.league === 'NHL') unlockAchievement('veteran_retirement');
  }, [screen]);

  const handleNewGame = () => {
    setPlayer({
      name: '', number: 97, pos: 'C', age: 16, ovr: 55, nat: 'CAN',
      shooting: 55, skating: 55, physicality: 55, hockeyIQ: 55, stamina: 55,
      team: null, league: null, contract: { salary: 0, years: 0 },
      stats: { 
        chl: { goals: 0, assists: 0, games: 0, plusMinus: 0, saves: 0, shots: 0, shutouts: 0 },
        ahl: { goals: 0, assists: 0, games: 0, plusMinus: 0, saves: 0, shots: 0, shutouts: 0 },
        nhl: { goals: 0, assists: 0, games: 0, plusMinus: 0, saves: 0, shots: 0, shutouts: 0 },
        titles: 0, earnings: 0, value: 50000, seasonsPlayed: 0, memCupBoost: 0, 
        awards: []
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

  const currentYear = 2026 + (player.stats?.seasonsPlayed || 0);
  const isJunior = safeJuniorLeagues.includes(player.league);
  const isAmateur = isJunior || player.league === 'NCAA' || safeEuroLeagues.includes(player.league);
  const isAHL = player.league === 'AHL';
  const lgKey = isAmateur ? 'chl' : isAHL ? 'ahl' : 'nhl';

  const handleStart = () => {
    const lg = player.startLeague;
    let pool = ohlTeams || [];
    if (lg === 'WHL') pool = whlTeams || [];
    if (lg === 'QMJHL') pool = qmjhlTeams || [];
    if (lg === 'USHL') pool = ushlTeams || [];
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

    const newBuffs = (player.buffs || []).map(b => ({ ...b, duration: b.duration - 1 })).filter(b => b.duration > 0);

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
      handleDraftDay();
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
      generateOffers(false, currentTeam);
    } else {
      generateTraining(player.pos);
      setScreen('preseason');
    }
  };

  const handleDraftDay = () => {
    const totalJuniorPoints = (player.stats?.chl?.goals || 0) + (player.stats?.chl?.assists || 0) + (player.stats?.memCupBoost || 0);
    let overallPick = 1;
    let round = 1;
    let idolBoost = 0;

    const isElite = player.ovr >= 66 || (['LW', 'RW', 'C'].includes(player.pos) && totalJuniorPoints > 180);
    const isGreat = player.ovr >= 63 || (['LW', 'RW', 'C'].includes(player.pos) && totalJuniorPoints > 120);

    if (isElite) {
      overallPick = 1; round = 1; idolBoost = 25;
    } else if (isGreat) {
      overallPick = Math.floor(Math.random() * 31) + 2; round = 1; idolBoost = 15;
    } else {
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
         // 👇 FIX: Added role so simulator doesn't crash
         contract: { salary: 925000, years: 3, role: 'Rookie' } 
       }));
       setEventFeedback("You signed your ELC and are heading to your first NHL training camp.");
     } else if (choice === 'NCAA') {
       const pool = ncaaTeams || [];
       const ncaaTeam = pool[Math.floor(Math.random() * pool.length)];
       if (ncaaTeam) {
         setPlayer(p => ({
           ...p, team: ncaaTeam.id, league: 'NCAA',
           teamsPlayedFor: Array.from(new Set([...(p.teamsPlayedFor || []), ncaaTeam.id]))
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
        break; 
      }
    }
    setActiveTrainings(hand);
  };

  const handleTrain = (t) => {
    setHasDemandedTrade(false);
    const result = simulateSeason(player, t?.effect);

    if (!result) return;

    let finalPlayer = { ...(result.updatedPlayer || player) };
    
    if (t?.effect) {
       Object.keys(t.effect).forEach(attr => {
          if (['shooting', 'skating', 'physicality', 'hockeyIQ', 'stamina'].includes(attr)) {
              finalPlayer[attr] = cap((player[attr] || 50) + t.effect[attr]);
          }
       });
       finalPlayer.ovr = recomputeOvr(finalPlayer);
    }

    if (finalPlayer.age >= 33) {
      const drop = finalPlayer.age >= 36 ? 2 : 1;

      if (finalPlayer.pos === 'G') {
        finalPlayer.shooting = Math.max(40, (finalPlayer.shooting || 50) - drop);
        finalPlayer.skating = Math.max(40, (finalPlayer.skating || 50) - drop);
        finalPlayer.physicality = Math.max(40, (finalPlayer.physicality || 50) - (drop + 1));
        finalPlayer.stamina = Math.max(40, (finalPlayer.stamina || 50) - drop);
      } else {
        finalPlayer.skating = Math.max(40, (finalPlayer.skating || 50) - drop);
        finalPlayer.physicality = Math.max(40, (finalPlayer.physicality || 50) - (drop + 1));
        finalPlayer.stamina = Math.max(40, (finalPlayer.stamina || 50) - drop);
      }
    }

    finalPlayer.ovr = recomputeOvr(finalPlayer);

    const annualSalary = finalPlayer.contract?.salary || 0;
    const currentEarnings = finalPlayer.stats?.earnings || 0;
    const updatedEarnings = currentEarnings + annualSalary;

    const remainingYears = Math.max(0, (finalPlayer.contract?.years || 0) - 1);

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
    const awardsList = result.recap?.awards || [];
    if (awardsList.includes('Hart Trophy')) unlockAchievement('hart');
    if (awardsList.includes('Vezina Trophy')) unlockAchievement('vezina');
    if (awardsList.includes('Norris Trophy')) unlockAchievement('norris');
    if (awardsList.includes('Calder Trophy')) unlockAchievement('calder');
    if (awardsList.includes('Art Ross Trophy')) unlockAchievement('art_ross');
    if (awardsList.includes('Maurice Richard Trophy')) unlockAchievement('richard');
    if (awardsList.includes('Conn Smythe Trophy')) unlockAchievement('conn_smythe');

    if (finalPlayer.league === 'NHL' && (result.recap?.games || 0) > 0) unlockAchievement('first_nhl_goal');
    if (result.recap?.g >= 50) unlockAchievement('fifty_goal_season');
    if ((result.recap?.g || 0) + (result.recap?.a || 0) >= 100) unlockAchievement('hundred_pt_season');
    if (result.recap?.sho >= 8) unlockAchievement('shutout_king');
    if (finalPlayer.ovr >= 90) unlockAchievement('max_ovr');
    const updatedCareerAwards = [...(finalPlayer.stats?.awards || []), ...seasonAwards];

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
        seasonsPlayed: (finalPlayer.stats?.seasonsPlayed || 0) + 1,
        awards: updatedCareerAwards
      }
    };

    setPlayer(finalPlayer);
    setStatChanges(t?.effect);
    setTimeout(() => setStatChanges(null), 3000);

    if (result.isDemoted) {
      unlockAchievement('demoted');
      let demotionTargetLg = result.currentLg || 'AHL';
      let demotionTargetTeam = result.currentTeam || 'UNK';
      
      const isUnder20 = player.age < 20 && (player.contract?.salary || 0) > 0;
      const ohl = ohlTeams || []; const whl = whlTeams || []; const qmjhl = qmjhlTeams || [];
      const teamsPlayed = player.teamsPlayedFor || [];
      const hasCHLHistory = teamsPlayed.some(team => ohl.find(o=>o.id===team) || whl.find(o=>o.id===team) || qmjhl.find(o=>o.id===team));
      
      if (isUnder20 && hasCHLHistory) {
          const lastCHL = teamsPlayed.slice().reverse().find(team => ohl.find(o=>o.id===team) || whl.find(o=>o.id===team) || qmjhl.find(o=>o.id===team));
          demotionTargetTeam = lastCHL || (ohl[0] ? ohl[0].id : null);
          if (whl.find(team=>team.id===demotionTargetTeam)) demotionTargetLg = 'WHL';
          else if (qmjhl.find(team=>team.id===demotionTargetTeam)) demotionTargetLg = 'QMJHL';
          else demotionTargetLg = 'OHL';
      }

      setSeasonRecap(result.recap); 
      setActiveEvent({
        title: 'SENT DOWN',
        desc: `Your GM thinks you're not ready for the NHL. You've been sent down to the ${getFullTeamName(demotionTargetTeam, demotionTargetLg)} (${demotionTargetLg}).`,
        choices: [
          { label: 'Complain to the media', isRisky: true, successChance: 0.3, successFeedback: 'The fans love your fiery passion. You vow to prove the GM wrong!', successEffect: { idol: 15, ovr: 1, money: 0 }, failFeedback: 'You look like a spoiled kid. The GM fines you and the fans turn on you.', failEffect: { idol: -15, ovr: -1, money: -50000 }, action: 'DEMOTE', actionData: { team: demotionTargetTeam, lg: demotionTargetLg } },
          { label: 'Put your head down and work', isRisky: false, feedback: 'You accepted the assignment like a professional and focused on your game.', effect: { idol: 5, ovr: 1, money: 0 }, action: 'DEMOTE', actionData: { team: demotionTargetTeam, lg: demotionTargetLg } }
        ],
        isDemotionEvent: true,
        currentLg: demotionTargetLg,
        currentTeam: demotionTargetTeam,
        madePlayoffs: result.madePlayoffs
      });
      setScreen('event');
    } else {
      if (result.currentLg === 'NCAA') {
         setSeasonRecap(result.recap);
         runPostSeasonFlow(finalPlayer.age, finalPlayer.ovr, result.currentLg, result.currentTeam, result.madePlayoffs, activeYear + 1, result.recap?.standings || 16);
      } else {
         setPendingSeasonResult(result);
         setScreen('trade-deadline');
      }
    }
  };

  const runPostSeasonFlow = (pAge, pOvr, currentLg, currentTeam, madePlayoffs, nextYear, standings) => {
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
    if (hits === 3) unlockAchievement('press_master');
    if (hits === 0) unlockAchievement('press_disaster');
    
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
    } else if (seasonRecap?.madePlayoffs) {
      checkPlayoffs(player.league, player.team, seasonRecap.standings);
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
        stats: { ...withOvr.stats, earnings: (withOvr.stats?.earnings || 0) + (outcome.money || 0) }
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
      if (success && activeEvent?.title?.includes('RIVALRY NIGHT')) unlockAchievement('rival_slayer');
    } else {
      outcomeEffect = choice.effect;
      outcomeFeedback = choice.feedback;
    }

    if (choice.action === 'FORCE_RETIRE') {
      setScreen('retirement');
      return; 
    }

    setPlayer(p => {
      let updated = { ...p };
      
      if (choice.action === 'VETERAN_EXTENSION') {
        updated.contract = { salary: 850000, years: 1 };
      } else if (choice.action === 'BECOME_UFA') {
        updated.rights = null;
      } else if (choice.action === 'JOIN_NCAA') {
        updated.team = choice.actionData;
        updated.league = 'NCAA';
        updated.teamsPlayedFor = Array.from(new Set([...(updated.teamsPlayedFor || []), choice.actionData]));
        if ((choice.perks || []).some(p => p.text && p.text.includes('NIL'))) unlockAchievement('big_nil');
      } else if (choice.action === 'JOIN_CHL') {
        updated.team = choice.actionData;
        updated.league = 'OHL';
        updated.teamsPlayedFor = Array.from(new Set([...(updated.teamsPlayedFor || []), choice.actionData]));
        unlockAchievement('import_draft');
      } else if (choice.action === 'SIGN_ELC') {
        updated.team = p.rights;
        updated.league = 'NHL';
        // 👇 FIX: Added role here too
        updated.contract = { salary: 925000, years: 3, role: 'Rookie' };
      } else if (choice.action === 'DEMOTE') {
        updated.team = choice.actionData.team;
        updated.league = choice.actionData.lg;
      } else if (choice.action === 'ACCEPT_TRADE_DEADLINE') {
        const { teamObj, teamStandings, madePlayoffs } = choice.actionData;
        updated.team = teamObj.id;
        updated.teamsPlayedFor = Array.from(new Set([...(updated.teamsPlayedFor || []), teamObj.id]));
        
        if (pendingSeasonResult) {
          const updatedRecap = { 
            ...pendingSeasonResult.recap, 
            standings: teamStandings, 
            madePlayoffs: madePlayoffs, 
            tradedMidSeason: true 
          };
          setSeasonRecap(updatedRecap);
        }
      }
      
      const withOvr = applyOvrDelta(updated, outcomeEffect?.ovr || 0);
      return {
        ...withOvr,
        idolatry: capIdol(withOvr.idolatry + (outcomeEffect?.idol || 0)),
        ovr: recomputeOvr(withOvr),
        stats: { ...withOvr.stats, earnings: (withOvr.stats?.earnings || 0) + (outcomeEffect?.money || 0) }
      };
    });

    setEventImpacts(outcomeEffect || {});
    setEventFeedback(outcomeFeedback);
    setScreen('event-result');
  };

  const advancePlayoffRound = () => {
    setPlayoffs(p => ({
      ...p,
      activeRoundIndex: Math.min((p.bracket?.length || 1) - 1, p.activeRoundIndex + 1)
    }));
  };

  const checkPlayoffs = (currentLg, currentTeamId, standings) => {
    const spots = LEAGUE_CONFIG[currentLg]?.playoffSpots || 16;
    const totalRounds = Math.log2(spots);
    
    let oppPool = getOpponentPool(currentLg)?.filter(t => t.id !== currentTeamId) || [];
    oppPool = [...oppPool].sort(() => 0.5 - Math.random()); 

    const playerTeamObj = getTeamData(currentTeamId, currentLg) || { id: currentTeamId, name: currentTeamId };

    const getSafeDeck = (roundNum) => {
      const generated = generatePlayoffDeck ? generatePlayoffDeck(standings || 1, spots, roundNum) : null;
      if (generated && Array.isArray(generated) && generated.length > 0) return generated;
      return Array(9).fill(null).map(() => ({ isWin: Math.random() > 0.45 }));
    };

    const playerConf = getTeamConference(currentTeamId);

    const bracket = [];
    const firstRoundMatchups = spots / 2;
    const playerMatchIdx = Math.floor(Math.random() * firstRoundMatchups);

    for (let r = 0; r < totalRounds; r++) {
      const roundMatchups = [];
      const numMatchups = spots / Math.pow(2, r + 1);

      for (let m = 0; m < numMatchups; m++) {
        if (r === 0) {
          const isPlayer = m === playerMatchIdx; 
          const t1 = isPlayer ? playerTeamObj : (oppPool.pop() || { name: 'TBD', id: 'TBD' });
          const t2 = oppPool.pop() || { name: 'TBD', id: 'TBD' };

          let divisionLabel = '';
          if (m < 2) divisionLabel = 'ATLANTIC DIV';
          else if (m < 4) divisionLabel = 'METRO DIV';
          else if (m < 6) divisionLabel = 'CENTRAL DIV';
          else divisionLabel = 'PACIFIC DIV';

          roundMatchups.push({
            id: `r${r}-m${m}`,
            team1: t1,
            team2: t2,
            isPlayerSeries: isPlayer,
            wins1: 0,
            wins2: 0,
            status: 'playing',
            deck: isPlayer ? getSafeDeck(1) : null,
            revealed: [],
            divisionLabel
          });
        } else {
          roundMatchups.push({
            id: `r${r}-m${m}`,
            team1: { name: 'TBD', id: 'TBD' },
            team2: { name: 'TBD', id: 'TBD' },
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
      playerConf
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

    const card = match.deck[cIndex];
    const isWin = card.isWin || card.win;
    const newWins = isWin ? match.wins1 + 1 : match.wins1;
    const newLosses = !isWin ? match.wins2 + 1 : match.wins2;

    let matchStatus = 'playing';
    let overallStatus = 'playing';

    if (newWins >= 4) matchStatus = 'won';
    else if (newLosses >= 4) {
      matchStatus = 'lost';
      overallStatus = 'eliminated';
    }

    const totalRounds = playoffs.bracket.length;

    if (matchStatus === 'won') {
      if (newWins === 4 && newLosses === 0) unlockAchievement('sweep');
      if (newWins === 4 && newLosses === 3) unlockAchievement('game_seven_hero');
    } else if (matchStatus === 'lost') {
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

    let confTitleWonThisRound = false;
    if (matchStatus === 'won' && rIndex === 2) {
      confTitleWonThisRound = true;
      unlockAchievement('conf_champ');
    }

    if (matchStatus !== 'playing') {
       newRound.forEach((m, i) => {
          if (!m.isPlayerSeries && m.status === 'playing') {
             const t1W = Math.random() > 0.5;
             const lw = Math.floor(Math.random() * 4);
             newRound[i] = { ...m, status: 'simulated', wins1: t1W ? 4 : lw, wins2: t1W ? lw : 4 };
          }
       });
       newBracket[rIndex] = newRound;

       if (overallStatus === 'eliminated') {
           for (let r = rIndex; r < totalRounds - 1; r++) {
              const currR = newBracket[r];
              const nextR = [...newBracket[r + 1]];

              for (let i = 0; i < currR.length; i += 2) {
                 const m1 = currR[i];
                 const m2 = currR[i + 1];
                 const adv1 = m1.wins1 >= 4 ? m1.team1 : m1.team2;
                 const adv2 = m2.wins1 >= 4 ? m2.team1 : m2.team2;

                 const t1W = Math.random() > 0.5;
                 const lw = Math.floor(Math.random() * 4);

                 if (nextR[Math.floor(i / 2)]) {
                    nextR[Math.floor(i / 2)] = {
                        ...nextR[Math.floor(i / 2)],
                        team1: adv1,
                        team2: adv2,
                        status: 'simulated',
                        wins1: t1W ? 4 : lw,
                        wins2: t1W ? lw : 4
                    };
                 }
              }
              newBracket[r + 1] = nextR;
           }
       } else if (matchStatus === 'won') {
           if (rIndex + 1 < totalRounds) {
               const nextR = [...newBracket[rIndex + 1]];

               for (let i = 0; i < newRound.length; i += 2) {
                   const m1 = newRound[i];
                   const m2 = newRound[i + 1];
                   const adv1 = m1.wins1 >= 4 ? m1.team1 : m1.team2;
                   const adv2 = m2.wins1 >= 4 ? m2.team1 : m2.team2;

                   const isPlayerMatch = adv1.id === playoffs.currentTeamId || adv2.id === playoffs.currentTeamId;
                   let t1 = adv1; 
                   let t2 = adv2;
                   if (isPlayerMatch && adv2.id === playoffs.currentTeamId) { t1 = adv2; t2 = adv1; }

                   const nextDeck = isPlayerMatch 
                     ? (generatePlayoffDeck ? generatePlayoffDeck(playoffs.standings || 1, playoffs.spots, rIndex + 2) : Array(9).fill(null).map(() => ({ isWin: Math.random() > 0.45 })))
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
               
               // Keep index at rIndex so current screen renders all 4 'W' cards!
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
      if (finalMatch.wins1 >= 4) champion = finalMatch.team1;
      else if (finalMatch.wins2 >= 4) champion = finalMatch.team2;
    }

    setSeasonRecap(r => ({
       ...(r || {}),
       playoffWins: totalWins,
       titleWon: playoffs.overallStatus === 'won_cup' ? 1 : 0,
       confTitleWon: playoffs.confTitleWon || false,
       confName: playoffs.playerConf === 'East' ? 'Eastern Conference' : 'Western Conference',
       leagueChampion: champion
    }));
    
    if (playoffs.overallStatus === 'won_cup' && ['OHL', 'WHL', 'QMJHL'].includes(player.league)) {
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
    else if (currentYear >= 2029) leagueMinimum = 1000000;

    const getRole = (salary, p) => {
      if (p.pos === 'G') return salary > 3500000 ? 'Starter' : 'Backup';

      const isPhysical = p.physicality > p.skating;
      const isShooter = p.shooting > p.hockeyIQ && p.shooting > p.skating;

      if (['LD', 'RD'].includes(p.pos)) {
        if (salary > 6000000) return isPhysical ? 'Shutdown Defenceman' : 'Offensive Defenceman';
        if (salary > 2500000) return 'Top 4 Defender';
        return isPhysical ? 'Bottom Pair Grinder' : 'Depth Defender';
      }

      if (salary > 6000000) {
        if (isPhysical) return 'Power Forward Core';
        if (isShooter) return 'Elite Sniper Core';
        return 'Playmaking Core';
      }
      if (salary > 2500000) {
        if (isPhysical) return 'Middle Six Grinder';
        return 'Middle Six Two-Way';
      }
      
      return isPhysical ? '4th Line Grinder' : 'Depth Skater';
    };

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

      if (player.age >= 38) {
        baseSalary *= 0.40;
        maxYears = 1;
      } else if (player.age >= 36) {
        baseSalary *= 0.55;
        maxYears = 2;
      } else if (player.age >= 34) {
        baseSalary *= 0.75;
        maxYears = 3;
      }

      const NHL_MAX_SALARY = 13500000;
      baseSalary = Math.min(NHL_MAX_SALARY, baseSalary);
    }

    baseSalary = Math.max(leagueMinimum, Math.round(baseSalary / 25000) * 25000);
    let offers = [];
    
    const isRFA = player.league === 'NHL' && player.age < 27 && (player.stats?.seasonsPlayed || 0) < 7;
    const isAmateurGraduating = ['OHL', 'WHL', 'QMJHL', 'USHL', 'NCAA'].includes(player.league);

    if (!isTradeRequest && !isAmateurGraduating) {
      if (player.ovr < 65 && Math.random() > 0.60) {
         setEventFeedback("Your team elected not to extend your contract. You are now a UFA.");
      } else {
         offers.push({
           team: actingTeam,
           league: player.league,
           type: isRFA ? 'QUALIFYING OFFER' : 'EXTENSION',
           salary: baseSalary,
           years: Math.min(3, maxYears),
           role: getRole(baseSalary, player),
           idolHit: 10
         });
      }
    }

    if (isRFA && !isTradeRequest && !isAmateurGraduating) {
      if (Math.random() > 0.85) { 
         const pool = nhlTeams || [];
         if (pool.length > 0) {
           const t = pool[Math.floor(Math.random() * pool.length)].id;
           if (t !== actingTeam) {
              const osSalary = Math.min(13500000, Math.round((baseSalary * 1.3) / 25000) * 25000);
              offers.push({
                team: t, league: 'NHL', type: 'OFFER SHEET', salary: osSalary, years: Math.min(5, maxYears),
                role: getRole(osSalary, player), idolHit: getTransferImpact(actingTeam, t)
              });
           }
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
            
            if (targetLg !== 'NHL') {
                offerSalary = Math.max(85000, Math.floor(offerSalary * 0.15));
            } else {
                offerSalary = Math.max(leagueMinimum, offerSalary);
            }
            
            offers.push({
              team: t,
              league: targetLg,
              type: isTradeRequest ? 'TRADE' : 'FREE AGENCY',
              salary: offerSalary,
              years: Math.floor(Math.random() * maxYears) + 1,
              role: targetLg === 'NHL' ? getRole(offerSalary, player) : 'Pro Roster',
              idolHit: getTransferImpact(actingTeam, t)
            });
          }
        }
      }
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

    setPlayer(p => {
      const newTeams = Array.from(new Set([...(p.teamsPlayedFor || []), o.team]));
      return {
        ...p, team: o.team, league: o.league || 'NHL', idolatry: capIdol(p.idolatry + o.idolHit), teamsPlayedFor: newTeams,
        contract: { salary: o.salary, years: o.years, role: o.role }
      };
    });
    generateTraining(player.pos);
    setScreen('preseason');
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

  const handleContinueEvent = () => {
   if (activeEvent?.isTradeDeadlineEvent) {
       setActiveEvent(null);
       const teamToUse = player.team;
       const lgToUse = player.league;
       const recapToUse = seasonRecap || pendingSeasonResult?.recap;
       
       if (recapToUse) {
          setSeasonRecap(recapToUse);
       }

       const madePlayoffs = recapToUse?.madePlayoffs || false;
       const standingsToUse = recapToUse?.standings || 16;

       runPostSeasonFlow(player.age, player.ovr, lgToUse, teamToUse, madePlayoffs, 2026 + (player.stats?.seasonsPlayed || 0), standingsToUse);
       return;
    }

    if (activeEvent?.isPortalEvent) {
       setActiveEvent(null);
       advanceToOffseason();
       return;
    }

    if (activeEvent?.isOffseasonEvent) {
       const goesToFreeAgency = ['AMATEUR GRADUATION', 'RIGHTS EXPIRED'].includes(activeEvent.title) && player.league !== 'NHL';
       setActiveEvent(null);
       
       if (goesToFreeAgency) {
           generateOffers(false, player.team);
       } else {
           generateTraining(player.pos);
           setScreen('preseason');
       }
       return;
    }

    if (minigameContext === 'memcup') {
      setMinigameContext('season');
      setScreen('memorial-cup');
    } else if (minigameContext === 'wjc' || minigameContext === 'olympics') {
      setMinigameContext('season');
      if (pendingPlayoffs) {
        const pp = pendingPlayoffs;
        setPendingPlayoffs(null);
        checkPlayoffs(pp.lg, pp.team, pp.standings);
      } else if (seasonRecap?.madePlayoffs) {
        checkPlayoffs(player.league, player.team, seasonRecap.standings);
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
      } else if (seasonRecap?.madePlayoffs) {
        checkPlayoffs(player.league, player.team, seasonRecap.standings);
      } else {
        setScreen('recap');
      }
    }
  };

  const tier = getIdolTier(player.idolatry);

  return (
    <div className="min-h-screen p-2 sm:p-6 flex flex-col font-sans bg-[#040505] text-white relative">

      {/* 🏆 REAL-TIME ACHIEVEMENT TOAST POPUP */}
      {achievementToast && (
        <div 
          className="fixed top-12 right-4 sm:top-16 sm:right-6 z-50 max-w-[260px] sm:max-w-xs bg-[#101410] border-2 border-[#F59E0B] p-4 rounded-xl shadow-[0_0_25px_rgba(245,158,11,0.4)] flex items-center gap-4 transition-all duration-300 pointer-events-none"
          style={{
            animation: 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards'
          }}
        >
          <style>{`
            @keyframes slideInRight {
              from { transform: translateX(120%); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
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

      {/* DASHBOARD HEADER */}
      {screen !== 'creation' && screen !== 'retirement' && (
        <Dashboard 
          player={player} tier={tier} statChanges={statChanges} 
          lgKey={lgKey} isJunior={isJunior} isAHL={isAHL} 
          onOpenShop={() => setIsShopOpen(true)} 
        />
      )}

      {/* MAIN SCREEN ROUTER */}
      <div className="w-full max-w-5xl mx-auto pb-10">

        {screen === 'creation' && (
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
              <div className="grid grid-cols-3 gap-3 mb-6 w-full">
                {[
                  { id: 'OHL', label: 'OHL' },
                  { id: 'WHL', label: 'WHL' },
                  { id: 'QMJHL', label: 'QMJHL' },
                  { id: 'USHL', label: 'USHL (USA)' },
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

              {/* COLLAPSIBLE ACHIEVEMENTS DROPDOWN */}
              <div className="border-t border-[rgba(255,255,255,0.065)] pt-6 mt-8 w-full">
                <button 
                  type="button"
                  onClick={() => setShowAchievementsMenu(!showAchievementsMenu)}
                  className="w-full bg-[#101410] hover:bg-[#1a2230] border border-[rgba(255,255,255,0.1)] p-4 rounded-xl flex items-center justify-between text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl sm:text-2xl">🏆</span>
                    <div>
                      <h3 className="text-xs sm:text-sm font-black text-white sports-font uppercase tracking-wider group-hover:text-[#22E748] transition-colors">
                        CAREER ACHIEVEMENTS
                      </h3>
                      <p className="text-[10px] sm:text-xs text-slate-400 font-sans">
                        {unlockedAchievements.length} OF {MASTER_ACHIEVEMENTS.length} UNLOCKED
                      </p>
                    </div>
                  </div>
                  <span className={`text-slate-400 text-lg transition-transform duration-300 ${showAchievementsMenu ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>

                {/* EXPANDABLE MENU */}
                {showAchievementsMenu && (
                  <div className="mt-4 bg-[#0a0d0a] border border-[rgba(255,255,255,0.065)] p-4 sm:p-5 rounded-xl max-h-[420px] overflow-y-auto space-y-3 text-left">
                    <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.065)] pb-2 mb-3">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-sans">
                        HALL OF FAME TROPHY CASE
                      </span>
                      <span className="text-[10px] font-bold text-[#22E748] uppercase tracking-widest font-sans">
                        {Math.round((unlockedAchievements.length / MASTER_ACHIEVEMENTS.length) * 100)}% COMPLETE
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                      {MASTER_ACHIEVEMENTS.map(a => {
                        const isUnlocked = unlockedAchievements.includes(a.id);
                        return (
                          <div 
                            key={a.id} 
                            className={`p-2.5 sm:p-3 rounded-xl border flex items-start gap-2.5 sm:gap-3 transition-all ${
                              isUnlocked 
                                ? 'bg-[#F59E0B]/10 border-[#F59E0B]/40 shadow-[0_0_10px_rgba(245,158,11,0.1)]' 
                                : 'bg-[#101410] border-[rgba(255,255,255,0.04)] opacity-50 grayscale'
                            }`}
                          >
                            <span className="text-xl sm:text-2xl shrink-0 mt-0.5">{isUnlocked ? a.icon : '🔒'}</span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-1 mb-0.5">
                                <h4 className={`text-[11px] sm:text-xs font-black uppercase tracking-wider sports-font leading-tight break-words ${isUnlocked ? 'text-[#F59E0B]' : 'text-slate-400'}`}>
                                  {a.name}
                                </h4>
                                {isUnlocked && <span className="text-[10px] font-bold text-[#22E748] font-sans shrink-0 ml-1">✓</span>}
                              </div>
                              <p className="text-[10px] text-slate-400 font-sans leading-tight mt-0.5">
                                {a.desc}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
                
            </div>
          </div>
        )}

        {screen === 'retirement' && (() => {
          const isLegend = player.idolatry >= 800;
          const isGoalie = player.pos === 'G';

          const totalGames = (player.stats?.nhl?.games || 0) + (player.stats?.chl?.games || 0) + (player.stats?.ahl?.games || 0);
          const totalGoals = (player.stats?.nhl?.goals || 0) + (player.stats?.chl?.goals || 0) + (player.stats?.ahl?.goals || 0);
          const totalAssists = (player.stats?.nhl?.assists || 0) + (player.stats?.chl?.assists || 0) + (player.stats?.ahl?.assists || 0);
          const totalSaves = (player.stats?.nhl?.saves || 0) + (player.stats?.chl?.saves || 0) + (player.stats?.ahl?.saves || 0);

          const stints = [];
          (player.seasonHistory || []).forEach(s => {
            const lastStint = stints[stints.length - 1];
            if (lastStint && lastStint.team === s.team && lastStint.league === s.league) {
              lastStint.endYear = s.year;
              lastStint.games += s.games;
              lastStint.goals += s.goals;
              lastStint.assists += s.assists;
              lastStint.saves += s.saves;
              if (s.titleWon) lastStint.titles.push(s.year);
              if (s.awards?.length) lastStint.awards.push(...s.awards.map(a => `${s.year} ${a}`));
            } else {
              stints.push({
                team: s.team,
                league: s.league,
                startYear: s.year,
                endYear: s.year,
                games: s.games,
                goals: s.goals,
                assists: s.assists,
                saves: s.saves,
                titles: s.titleWon ? [s.year] : [],
                awards: s.awards?.length ? s.awards.map(a => `${s.year} ${a}`) : []
              });
            }
          });

          let primaryTeam = player.team;
          if (stints.length > 0) {
            const sortedStints = [...stints].sort((a, b) => b.games - a.games);
            primaryTeam = sortedStints[0].team;
          }
          const primaryTeamName = getFullTeamName(primaryTeam, player.league);

          const aggregatedAwards = {};
          (player.stats?.awards || []).forEach(raw => {
            const match = raw.match(/^(\d{4})\s+(.+)$/);
            const year = match ? match[1] : null;
            const awardName = match ? match[2] : raw;

            if (!aggregatedAwards[awardName]) {
              aggregatedAwards[awardName] = { name: awardName, count: 0, years: [] };
            }
            aggregatedAwards[awardName].count += 1;
            if (year) aggregatedAwards[awardName].years.push(year);
          });

          return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 bg-[#040505] text-white font-sans">
              <div className="w-full max-w-4xl space-y-6">
                
                <div className="game-panel p-6 sm:p-10 text-center border-2 border-[#F59E0B] relative overflow-hidden bg-gradient-to-b from-[#101410] to-[#080a08] shadow-[0_0_30px_rgba(245,158,11,0.15)]">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-[10px] sm:text-xs font-black tracking-widest text-slate-400 uppercase bg-black/40 px-3 py-1 rounded-full border border-slate-700">
                      RETIRED AT AGE {player.age}
                    </span>
                    <span className="text-[10px] sm:text-xs font-black tracking-widest text-[#F59E0B] uppercase bg-[#F59E0B]/10 px-3 py-1 rounded-full border border-[#F59E0B]/30 sports-font">
                      {isLegend ? 'SHINECARD • LEGEND' : 'CAREER ACCOMPLISHED'}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm font-bold text-slate-400 tracking-widest uppercase mb-1 font-sans">{player.name} · #{player.number}</p>
                  <h1 className="text-4xl sm:text-6xl font-black text-[#22E748] sports-font uppercase tracking-tight italic mb-2">
                    "THE KING OF {primaryTeamName.toUpperCase()}"
                  </h1>
                  <p className="text-lg sm:text-2xl font-black text-white sports-font uppercase tracking-wide flex items-center justify-center gap-2">
                    LEGEND OF {primaryTeamName.toUpperCase()} 🗿
                  </p>
                  <p className="text-xs sm:text-sm text-slate-400 font-sans italic mt-2">
                    {isLegend ? 'You have a bronze statue erected right outside the main arena gates.' : 'Your jersey hangs proudly in the rafters of the stadium.'}
                  </p>
                </div>

                <div className="game-panel p-4 bg-[#0a0d0a] border border-[rgba(255,255,255,0.065)]">
                  <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.065)] pb-3 mb-4 px-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">NATIONALITY: {player.nat}</span>
                      <span className="text-xs font-bold text-[#22E748] uppercase tracking-widest">OVR {player.ovr}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
                    <div className="bg-[#101410] p-3 rounded-xl border border-[rgba(255,255,255,0.04)]">
                      <p className="text-2xl sm:text-3xl font-black text-white sports-font">{isGoalie ? totalSaves : totalGoals}</p>
                      <p className="text-[9px] font-bold text-slate-500 uppercase">{isGoalie ? 'SAVES' : 'GOALS'}</p>
                    </div>
                    <div className="bg-[#101410] p-3 rounded-xl border border-[rgba(255,255,255,0.04)]">
                      <p className="text-2xl sm:text-3xl font-black text-white sports-font">{totalAssists}</p>
                      <p className="text-[9px] font-bold text-slate-500 uppercase">ASSISTS</p>
                    </div>
                    <div className="bg-[#101410] p-3 rounded-xl border border-[rgba(255,255,255,0.04)]">
                      <p className="text-2xl sm:text-3xl font-black text-white sports-font">{totalGames}</p>
                      <p className="text-[9px] font-bold text-slate-500 uppercase">MATCHES</p>
                    </div>
                    <div className="bg-[#101410] p-3 rounded-xl border border-[rgba(255,255,255,0.04)]">
                      <p className="text-2xl sm:text-3xl font-black text-[#F59E0B] sports-font">{player.stats?.titles || 0}</p>
                      <p className="text-[9px] font-bold text-slate-500 uppercase">TITLES</p>
                    </div>
                    <div className="bg-[#101410] p-3 rounded-xl border border-[#3b82f6]/30">
                      <p className="text-xl sm:text-2xl font-black text-[#3b82f6] sports-font">{formatMoney(player.stats?.value || 50000)}</p>
                      <p className="text-[9px] font-bold text-slate-500 uppercase">PEAK VALUE</p>
                    </div>
                    <div className="bg-[#101410] p-3 rounded-xl border border-[#22E748]/30">
                      <p className="text-xl sm:text-2xl font-black text-[#22E748] sports-font">{formatMoney(player.stats?.earnings || 0)}</p>
                      <p className="text-[9px] font-bold text-slate-500 uppercase">TOTAL EARNED</p>
                    </div>
                  </div>
                </div>

                <div className="game-panel p-6 bg-[#0a0d0a] border border-[rgba(255,255,255,0.065)] text-left">
                  <h3 className="text-sm font-bold text-slate-400 tracking-widest uppercase mb-6 font-sans border-b border-[rgba(255,255,255,0.065)] pb-3">
                    YOUR STORY, CLUB BY CLUB
                  </h3>

                  {stints.length === 0 ? (
                    <p className="text-slate-500 text-sm italic font-sans">No detailed club history recorded for this career.</p>
                  ) : (
                    <div className="space-y-4">
                      {stints.map((stint, idx) => (
                        <div key={idx} className="bg-[#101410] border border-[rgba(255,255,255,0.065)] rounded-xl p-4 sm:p-5 flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <TeamLogo teamId={stint.team} league={stint.league} />
                              <div>
                                <h4 className="text-lg sm:text-xl font-black text-white sports-font">{getFullTeamName(stint.team, stint.league)}</h4>
                                <p className="text-xs text-slate-500 font-bold font-sans">
                                  {stint.startYear === stint.endYear ? stint.startYear : `${stint.startYear}–${stint.endYear}`} · {stint.league}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-xs sm:text-sm font-black text-slate-300 font-sans">
                                {stint.games} GP · {isGoalie ? `${stint.saves} Saves` : `${stint.goals} G · ${stint.assists} A`}
                              </span>
                            </div>
                          </div>

                          {(stint.titles.length > 0 || stint.awards.length > 0) && (
                            <div className="flex flex-wrap gap-2 pt-2 border-t border-[rgba(255,255,255,0.04)]">
                              {stint.titles.length > 0 && (
                                <span className="bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-[#F59E0B] text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-wider font-sans">
                                  🏆 {stint.titles.length}x Champion ({stint.titles.join(', ')})
                                </span>
                              )}
                              {stint.awards.map((aw, aIdx) => (
                                <span key={aIdx} className="bg-[#3b82f6]/10 border border-[#3b82f6]/30 text-[#3b82f6] text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-wider font-sans">
                                  🥇 {aw}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="game-panel p-6 bg-[#0a0d0a] border border-[rgba(255,255,255,0.065)] text-left">
                  <h3 className="text-sm font-bold text-[#F59E0B] tracking-widest uppercase mb-6 font-sans border-b border-[rgba(255,255,255,0.065)] pb-3 flex items-center gap-2">
                    🏆 INDIVIDUAL ACCOLADES ({Object.keys(aggregatedAwards).length})
                  </h3>

                  {Object.keys(aggregatedAwards).length === 0 ? (
                    <p className="text-slate-500 text-sm italic font-sans">No individual trophies won during this career.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Object.values(aggregatedAwards).map((item, idx) => (
                        <div key={idx} className="bg-[#101410] border border-[#F59E0B]/20 p-4 rounded-xl flex items-start gap-4">
                          <span className="text-3xl shrink-0">🏅</span>
                          <div>
                            <h4 className="text-base sm:text-lg font-black text-white sports-font">
                              {item.name} <span className="text-[#F59E0B]">×{item.count}</span>
                            </h4>
                            {item.years.length > 0 && (
                              <p className="text-xs text-slate-400 font-sans mt-1">
                                Won in: <span className="text-slate-200 font-bold">{item.years.join(', ')}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="text-center pt-4">
                  <button onClick={handleNewGame} className="btn-primary py-4 px-12 rounded-xl text-lg sm:text-xl cursor-pointer sports-font tracking-widest uppercase w-full sm:w-auto">
                    START NEW CAREER
                  </button>
                </div>

              </div>
            </div>
          );
        })()}

        {screen === 'press' && (() => {
          const q = activePress.questions[activePress.currentQ];
          const answerKeys = ['professional', 'passionate', 'humble', 'cocky'].filter(k => q?.answers[k]);
          
          return (
            <div className="game-panel p-4 sm:p-8 mt-2 border-t-2 border-t-[#3b82f6] text-left">
              <div className="mb-4 sm:mb-6 border-b border-[rgba(255,255,255,0.065)] pb-4">
                 <h3 className="text-xs sm:text-sm font-bold text-slate-400 tracking-widest uppercase mb-1 font-sans">PRESS ROOM</h3>
                 <h2 className="text-2xl sm:text-4xl font-black text-white sports-font uppercase tracking-wide">THE PRESS CONFERENCE</h2>
              </div>
              
              <div className="bg-[#101410] border border-[rgba(255,255,255,0.065)] rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
                <p className="text-xs sm:text-sm font-bold text-white mb-1 flex items-center gap-2">🎧 Read the room.</p>
                <p className="text-[10px] sm:text-xs text-slate-400">You won't know what they're looking for until the end. Your tone matters just as much as your words.</p>
              </div>

              {player.hockeyIQ >= 75 && (
                <div className="bg-[#22E748]/10 border border-[#22E748]/30 p-3 sm:p-4 rounded-xl mb-4 sm:mb-6 flex items-center gap-3">
                  <span className="text-xl sm:text-3xl">🧠</span>
                  <div>
                    <p className="text-[#22E748] text-[9px] sm:text-[10px] font-black tracking-widest uppercase mb-1">HIGH IQ INSIGHT</p>
                    <p className="text-slate-300 text-[10px] sm:text-sm font-medium">You read the room perfectly. They are looking for a <span className="font-bold text-white uppercase">{activePress.journalist?.id}</span> answer.</p>
                  </div>
                </div>
              )}

              <p className="text-[9px] sm:text-[10px] font-bold text-[#3b82f6] tracking-widest uppercase mb-2">QUESTION {activePress.currentQ + 1} OF 3</p>
              <h3 className="text-lg sm:text-2xl font-bold text-white mb-4 sm:mb-6 leading-snug">"{q?.q}"</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mb-6">
                {answerKeys.map((vibeKey) => {
                  const vibe = PRESS_VIBES[vibeKey];
                  return (
                    <button key={vibeKey} onClick={() => handlePressAnswer(vibeKey)} className="bg-[#101410] hover:bg-[#1a2230] border border-[rgba(255,255,255,0.065)] text-left p-3 sm:p-5 rounded-xl transition-colors group flex flex-col gap-2 sm:gap-3 cursor-pointer">
                       <div className="flex items-center gap-2">
                         <span className={`text-[8px] sm:text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest ${vibe.bg} ${vibe.color} border ${vibe.border}`}>{vibe.icon} {vibe.label}</span>
                       </div>
                       <p className="text-xs sm:text-base text-slate-300 font-medium group-hover:text-white transition-colors">"{q.answers[vibeKey]}"</p>
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
            <div className="game-panel p-4 sm:p-8 mt-2 border-t-2 border-t-[#3b82f6] text-left">
              <div className="mb-4 sm:mb-6 border-b border-[rgba(255,255,255,0.065)] pb-4">
                 <h3 className="text-xs sm:text-sm font-bold text-slate-400 tracking-widest uppercase mb-1 font-sans">PRESS ROOM</h3>
                 <h2 className="text-2xl sm:text-4xl font-black text-white sports-font uppercase tracking-wide">THE PRESS CONFERENCE</h2>
              </div>

              <div className="border border-[rgba(255,255,255,0.065)] rounded-xl mb-4 sm:mb-6 overflow-hidden">
                 <div className="bg-[#101410] px-3 py-2 border-b border-[rgba(255,255,255,0.065)]">
                   <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest">WHAT THEY WANTED</span>
                 </div>
                 <div className="p-3 sm:p-4 bg-[#1a2230]">
                    <p className="text-xs sm:text-sm text-white"><span className="font-bold text-[#3b82f6]">🎙️ {journalist?.name}:</span> {journalist?.desc}</p>
                 </div>
              </div>

              <div className="border border-[rgba(255,255,255,0.065)] rounded-xl mb-4 sm:mb-6 overflow-hidden">
                 <div className="bg-[#101410] px-3 py-2 border-b border-[rgba(255,255,255,0.065)]">
                   <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest">THE TRANSCRIPT</span>
                 </div>
                 <div className="p-2 sm:p-4 bg-[#1a2230] flex flex-col gap-2 sm:gap-3">
                   {activePress.answers.map((ans, i) => {
                     const isHit = ans === journalist?.id;
                     const vibe = PRESS_VIBES[ans];
                     return (
                       <div key={i} className="flex justify-between items-center bg-[#101410] p-2 sm:p-3 rounded-lg border border-[rgba(255,255,255,0.03)]">
                          <div className="flex items-center gap-2 sm:gap-3">
                             <span className={`text-[8px] sm:text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest ${vibe?.bg} ${vibe?.color} border ${vibe?.border}`}>{vibe?.icon} {vibe?.label}</span>
                             {!isHit && <span className="text-slate-500 text-[9px] sm:text-xs italic hidden sm:inline">(Missed the mark)</span>}
                          </div>
                          <span className={`text-[10px] sm:text-sm font-black ${isHit ? 'text-[#22E748]' : 'text-[#ef4444]'}`}>{isHit ? '✅ MATCH' : '❌ MISS'}</span>
                       </div>
                     )
                   })}
                 </div>
              </div>

              <div className="bg-[#101410] border border-[rgba(255,255,255,0.065)] rounded-xl p-4 sm:p-6 text-center mb-6 sm:mb-8 flex flex-col items-center">
                 <span className="text-2xl sm:text-3xl mb-2">🎤</span>
                 <h3 className={`text-lg sm:text-2xl font-black sports-font uppercase tracking-wide ${resultColor} mb-1`}>{resultTitle}</h3>
                 <p className="text-slate-400 text-xs sm:text-sm">{resultText}</p>
              </div>

              <button onClick={handleEndPress} className="w-full btn-primary py-4 rounded-xl text-base sm:text-xl cursor-pointer sports-font tracking-widest">
                CONTINUE CAREER ➔
              </button>
            </div>
           );
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
                {(isFirstRound || player.ovr >= 65) ? (
                  <button onClick={() => handleDraftChoice('ELC')} className="btn-primary py-4 px-6 rounded-xl text-sm sm:text-base cursor-pointer sports-font tracking-widest w-full sm:w-auto">
                    SIGN ELC (TURN PRO)
                  </button>
                ) : (
                  <div className="bg-[#101410] border border-[rgba(255,255,255,0.065)] text-slate-500 py-4 px-6 rounded-xl text-sm sm:text-base sports-font tracking-widest w-full sm:w-auto flex items-center justify-center">
                    ELC NOT OFFERED YET
                  </div>
                )}
                
                <button onClick={() => handleDraftChoice('RETURN')} className="bg-[#101410] hover:bg-[#1a2230] border border-[rgba(255,255,255,0.065)] text-white py-4 px-6 rounded-xl text-sm sm:text-base cursor-pointer sports-font tracking-widest transition-colors w-full sm:w-auto">
                  {player.league === 'NCAA' ? 'RETURN TO NCAA' : ['SHL', 'LIIGA'].includes(player.league) ? 'RETURN TO EUROPE' : 'RETURN TO JUNIORS'}
                </button>
                
                {player.league !== 'NCAA' && !(player.teamsPlayedFor || []).some(t => (ohlTeams || []).find(o=>o.id===t) || (whlTeams || []).find(w=>w.id===t) || (qmjhlTeams || []).find(q=>q.id===t)) && (
                   <button onClick={() => handleDraftChoice('NCAA')} className="bg-[#101410] hover:bg-[#1a2230] border border-[rgba(255,255,255,0.065)] text-[#3b82f6] py-4 px-6 rounded-xl text-sm sm:text-base cursor-pointer sports-font tracking-widest transition-colors w-full sm:w-auto border-[#3b82f6]/30">
                     COMMIT TO NCAA
                   </button>
                )}
              </div>
            </div>
          );
        })()}

        {screen === 'preseason' && (
          <div className="game-panel p-6 sm:p-10 mt-2 border-t-2 border-t-[#22E748] relative z-20">
            <h2 className="text-3xl sm:text-4xl font-black italic text-white uppercase mb-2 text-center sports-font tracking-tighter">PRE-SEASON {currentYear}</h2>
            <p className="text-slate-400 text-center mb-10 font-medium text-sm sm:text-lg font-sans">The dice rolled three upgrades. Pick one focus.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              {activeTrainings.map(t => (
                <button
                  type="button"
                  key={t.id} 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleTrain(t);
                  }}
                  className={`bg-[#101410] border border-[rgba(255,255,255,0.065)] rounded-xl cursor-pointer transition-all hover:-translate-y-1 flex flex-col min-h-[14rem] sm:min-h-[16rem] text-left w-full relative z-30 ${t.rarity === 'Epic' ? 'hover:border-[#F59E0B]' : t.rarity === 'Rare' ? 'hover:border-[#3b82f6]' : 'hover:border-[#22E748]'}`}
                >
                  <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between w-full pointer-events-none">
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
                    <div className="mt-auto text-left pt-4 border-t border-[rgba(255,255,255,0.065)] w-full">
                      <span className="inline-block text-[#22E748] font-bold text-xs sm:text-sm font-sans mt-2">{t.desc}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {screen === 'trade-deadline' && (() => {
          const res = pendingSeasonResult;
          if (!res || !res.recap) {
             return (
               <div className="game-panel p-6 sm:p-10 mt-2 border-t-2 border-t-[#ef4444] text-center">
                 <button onClick={() => advanceToOffseason()} className="btn-primary py-4 px-8 rounded-xl font-black sports-font">
                   CONTINUE CAREER
                 </button>
               </div>
             );
          }
          
          const isPro = ['NHL', 'AHL', 'OHL', 'WHL', 'QMJHL', 'USHL', 'SHL', 'LIIGA'].includes(res.currentLg);
          const playoffSpots = LEAGUE_CONFIG[res.currentLg]?.playoffSpots || 16;
          const standings = res.recap?.standings || 16;
          const isContender = standings <= playoffSpots;

          const handleSkip = () => {
             setSeasonRecap(res.recap);
             runPostSeasonFlow(player.age, player.ovr, res.currentLg, res.currentTeam, res.madePlayoffs, 2026 + (player.stats?.seasonsPlayed || 0), standings);
          };

          const handleTradeRequest = () => {
             if (hasDemandedTrade) return;
             setHasDemandedTrade(true);
             unlockAchievement('trade_demanded');

             const successChance = Math.min(0.85, Math.max(0.35, 0.35 + ((player.ovr - 60) / 40)));
             const isSuccess = Math.random() < successChance;

             if (isSuccess) {
                let pool = getOpponentPool(res.currentLg)?.filter(t => t.id !== res.currentTeam) || [];
                pool = [...pool].sort(() => 0.5 - Math.random()).slice(0, 3);
                if (pool.length === 0) pool = [{ id: 'UNK', name: 'Unknown Team' }];

                const choices = pool.map(teamObj => {
                   const isGoingToContender = Math.random() > 0.3;
                   const teamStandings = isGoingToContender
                       ? Math.floor(Math.random() * playoffSpots) + 1
                       : Math.floor(Math.random() * 8) + playoffSpots + 1;
                   const teamInPlayoffs = teamStandings <= playoffSpots;
                   
                   return {
                      label: `Accept Trade to ${teamObj.name}`,
                      subLabel: `📈 Rank #${teamStandings} (${teamInPlayoffs ? 'IN PLAYOFFS' : 'OUT OF PLAYOFFS'})`,
                      isRisky: false,
                      feedback: `The trade went through! You were dealt to ${teamObj.name}.`,
                      effect: { idol: -20, ovr: 0, money: 0 },
                      action: 'ACCEPT_TRADE_DEADLINE',
                      actionData: { teamObj, teamStandings, madePlayoffs: teamInPlayoffs }
                   };
                });

                setActiveEvent({
                   title: 'TRADE OFFERS RECEIVED',
                   desc: `Your agent leveraged interest across the league. Your GM has agreed to trade packages from multiple suitors. Where do you want to be shipped?`,
                   choices: choices,
                   isTradeDeadlineEvent: true
                });
                setScreen('event');
             } else {
                unlockAchievement('trade_rejected');
                setActiveEvent({
                   title: 'TRADE REQUEST REJECTED',
                   desc: `Your GM publicly shut down your request: "We control his rights and he isn't going anywhere." The media is blasting your loyalty, your teammates are giving you the cold shoulder, and your GM benched you.`,
                   choices: [
                      {
                         label: 'Accept your fate and stay focused',
                         isRisky: false,
                         feedback: 'You put your head down, but the environment in the locker room is toxic.',
                         effect: { idol: -30, ovr: -1, money: 0 }
                      }
                   ],
                   isTradeDeadlineEvent: true
                });
                setScreen('event');
             }
          };

          return (
             <div className="game-panel p-6 sm:p-10 mt-2 border-t-2 border-t-[#ef4444] text-center">
                <h2 className="text-3xl sm:text-4xl font-black tracking-widest mb-2 text-[#ef4444] sports-font uppercase">TRADE DEADLINE</h2>
                <p className="text-slate-400 mb-8 text-sm sm:text-base">The trade deadline is 24 hours away. The media is swarming.</p>

                <div className="bg-[#101410] border border-[rgba(255,255,255,0.065)] p-6 rounded-xl mb-8 max-w-lg mx-auto text-left flex items-center justify-between">
                   <div>
                       <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">TEAM OUTLOOK</p>
                       <p className="text-xl sm:text-2xl font-black text-white sports-font uppercase mb-1">
                          {isContender ? 'BUYING / CONTENDING' : 'SELLING / REBUILDING'}
                       </p>
                       <p className={`text-xs sm:text-sm font-bold uppercase flex items-center gap-2 ${isContender ? 'text-[#22E748]' : 'text-[#ef4444]'}`}>
                          Currently #{standings} in the {res.currentLg}
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider font-sans border ${isContender ? 'bg-[#22E748]/10 border-[#22E748]/30 text-[#22E748]' : 'bg-[#ef4444]/10 border-[#ef4444]/30 text-[#ef4444]'}`}>
                             {isContender ? 'IN PLAYOFFS' : 'OUT OF PLAYOFFS'}
                          </span>
                       </p>
                   </div>
                   <div className="hidden sm:block text-5xl">
                       {isContender ? '📈' : '📉'}
                   </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                   <button onClick={handleSkip} className="btn-primary py-4 px-6 sm:px-8 rounded-xl font-black sports-font tracking-widest text-base sm:text-lg w-full sm:w-auto">
                      {isContender ? 'STAY THE COURSE' : 'RIDE IT OUT'}
                   </button>
                   {isPro && (
                       <button 
                         onClick={handleTradeRequest} 
                         disabled={hasDemandedTrade}
                         className={`py-4 px-6 sm:px-8 rounded-xl font-black sports-font tracking-widest text-base sm:text-lg transition-colors w-full sm:w-auto ${
                           hasDemandedTrade 
                             ? 'bg-[#101410] border border-slate-700 text-slate-500 cursor-not-allowed opacity-50' 
                             : 'bg-[#101410] hover:bg-[#1a2230] border border-[#ef4444]/30 text-[#ef4444] shadow-[0_0_15px_rgba(239,68,68,0.15)] cursor-pointer'
                         }`}
                       >
                          {hasDemandedTrade ? 'REQUEST SUBMITTED' : 'DEMAND TRADE'}
                          {!hasDemandedTrade && <span className="block text-[10px] font-sans mt-1 text-slate-400">⚡ RISKY GAMBLE</span>}
                       </button>
                   )}
                </div>
             </div>
          );
        })()}

        {screen === 'intl-minigame' && (() => {
          const nat = safeNationalities.find(n => n.id === player.nat);
          const countryName = nat?.sentenceName || nat?.name || 'your country';

          const choices = player.pos === 'G'
            ? [
                { label: 'Swallow Rebound',  tag: 'AGI',       hover: 'hover:border-[#F59E0B]', pill: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30', chance: 0.4 + player.physicality / 200,                    win: 'You smothered the rebound!',      fail: 'You gave up a juicy rebound.' },
                { label: 'Direct Traffic',   tag: 'IQ',        hover: 'hover:border-[#22E748]', pill: 'text-[#22E748] bg-[#22E748]/10 border-[#22E748]/30', chance: 0.4 + player.hockeyIQ / 200,                       win: 'You perfectly directed traffic!', fail: 'You were out of position.' },
                { label: 'Desperation Save', tag: 'REF + AGI', hover: 'hover:border-[#3b82f6]', pill: 'text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/30', chance: 0.4 + (player.shooting + player.physicality) / 400, win: 'You made an unbelievable save!',   fail: "Couldn't get there in time." },
              ]
            : [
                { label: 'Big Hit',       tag: 'PHY',       hover: 'hover:border-[#F59E0B]', pill: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30', chance: 0.4 + player.physicality / 200,                 win: 'You laid a massive hit!',  fail: 'You missed the hit.' },
                { label: 'Find Open Ice', tag: 'IQ',        hover: 'hover:border-[#22E748]', pill: 'text-[#22E748] bg-[#22E748]/10 border-[#22E748]/30', chance: 0.4 + player.hockeyIQ / 200,                    win: 'You found the soft spot!', fail: 'Skated into coverage.' },
                { label: 'Rush the Net',  tag: 'SKT + SHT', hover: 'hover:border-[#3b82f6]', pill: 'text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/30', chance: 0.4 + (player.skating + player.shooting) / 400, win: 'You ripped it top shelf!', fail: 'Fumbled the puck.' },
              ];

          return (
            <div className="game-panel p-6 sm:p-12 mt-2 border-t-2 border-t-[#F59E0B] text-center">
              <h2 className="text-4xl sm:text-5xl font-black mb-4 text-[#F59E0B] sports-font tracking-tighter uppercase leading-tight">🌍 INTERNATIONAL DUTY 🌍</h2>
              <p className="text-base sm:text-xl text-slate-300 mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed flex items-center justify-center flex-wrap gap-2 text-left">
                You are representing <span className="font-black text-white flex items-center gap-2">{countryName} <img src={nat?.img} alt={player.nat} className="w-6 h-4 object-cover rounded-[2px] border border-slate-600" /></span> in the {minigameContext === 'wjc' ? 'World Junior Gold Medal game' : 'Winter Games Final'}!
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
                {choices.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => handleMinigameChoice(c.chance, c.win, c.fail)}
                    className={`bg-[#101410] border border-[rgba(255,255,255,0.065)] ${c.hover} py-6 sm:py-8 px-4 rounded-xl font-bold text-xl sm:text-2xl text-white transition-all cursor-pointer flex flex-col items-center sports-font`}
                  >
                    {c.label}
                    <span className={`text-xs sm:text-sm font-normal mt-3 px-3 py-1 rounded-full uppercase tracking-widest font-sans border ${c.pill}`}>{c.tag}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })()}

       {screen === 'recap' && (() => {
          const titles = getPlayoffTitles(player.league);
          let narrative = '';
          let narrativeTitle = '';
          let displayRating = (seasonRecap?.rating || 5).toFixed(1);
          
          if (seasonRecap?.titleWon === 1) displayRating = "10.0";
          else if (parseFloat(displayRating) > 9.5) displayRating = "9.5";

          const madePlayoffsForNarrative = seasonRecap?.madePlayoffs || false;
          const pw = seasonRecap?.playoffWins || 0;
          const hasHardware = seasonRecap?.awards && seasonRecap.awards.length > 0;
          const playoffSpots = LEAGUE_CONFIG[player.league]?.playoffSpots || 16;
          const maxWins = Math.log2(playoffSpots) * 4;
          const standings = seasonRecap?.standings || 16;

          const rivalObj = getPrimaryRival ? getPrimaryRival(player.team, player.league) : null;
          const rivalName = rivalObj ? (rivalObj.name || rivalObj.id) : null;
          const rivalWonTitle = rivalObj && seasonRecap?.leagueChampion?.id === rivalObj.id;

          if (seasonRecap?.titleWon === 1) {
             narrativeTitle = 'CHAMPIONS';
             narrative = `Absolute glory. You climbed the mountain and won the ${titles.cupName}!`;
             if (isJunior && seasonRecap?.memCupStatus === 'won') {
                 narrativeTitle = 'MEMORIAL CUP CHAMPIONS';
                 narrative = 'You conquered junior hockey and cemented your legacy.';
             }
          } else if (madePlayoffsForNarrative) {
              if (pw === maxWins - 1) {
                  narrativeTitle = 'GAME 7 HEARTBREAK';
                  narrative = 'One win away from the ultimate prize. The locker room is devastated.';
              } else if (pw >= maxWins / 2) {
                  narrativeTitle = 'DEEP PLAYOFF RUN';
                  narrative = 'A valiant effort, but you ran out of gas down the stretch.';
              } else if (pw === 0) {
                  narrativeTitle = 'SWEPT';
                  narrative = standings <= 4 
                    ? 'A humiliating sweep after a dominant regular season. The media is ruthless.' 
                    : 'Swept out of the first round. You were outmatched from puck drop.';
              } else {
                  narrativeTitle = 'PLAYOFF EXIT';
                  if (standings <= 4) {
                      narrative = 'A dominant regular season erased by a shocking early playoff collapse.';
                  } else if (standings >= 13) {
                      narrative = 'After barely squeaking into the postseason as a fringe seed, the Cinderella run was cut short.';
                  } else {
                      narrative = 'A solid regular season erased by an early playoff elimination.';
                  }
              }
              
              if (rivalWonTitle) {
                  narrative += ` Adding insult to injury, your arch-rivals—the ${rivalName}—lifted the trophy.`;
              } else if (hasHardware && pw > 0 && pw < maxWins - 1) {
                  narrative += " Your individual brilliance wasn't enough to carry the team.";
              }
          } else {
              narrativeTitle = 'MISSED THE DANCE';
              narrative = 'A disappointing campaign. Rebuild for next year.';
              if (rivalWonTitle) {
                  narrative = `A nightmare season. Not only did you miss the playoffs, but your arch-rivals, the ${rivalName}, won it all.`;
              } else if (hasHardware) {
                  narrative = 'You had an incredible individual year, but the team completely let you down.';
              }
          }

          return (
            <div className="game-panel p-6 sm:p-10 mt-2 border-t-2 border-t-[#3b82f6]">
              <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.065)] pb-4 mb-6">
                <h2 className="text-[#3b82f6] font-bold tracking-widest uppercase text-sm sm:text-lg sports-font">THE RINK REPORT</h2>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs sm:text-sm">
                  {(isJunior || player.league === 'NCAA' || ['SHL', 'LIIGA', 'EURO'].includes(player.league)) ? 'AMATEUR CAMPAIGN' : `PRO SEASON ${player.stats.seasonsPlayed - 2}`}
                </p>
              </div>

              <div className="w-full mb-8">
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-2">
                  <h1 className="text-3xl sm:text-4xl font-black text-white italic uppercase text-left sports-font tracking-tighter m-0">
                    {narrativeTitle}
                  </h1>
                  <div className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg flex items-center gap-2 border ${parseFloat(displayRating) >= 8.0 ? 'bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#F59E0B]' : 'bg-[#101410] border-[rgba(255,255,255,0.065)] text-slate-300'}`}>
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
                  <li className="border-l-4 border-[#22E748] pl-4 py-1">🧱 Anchored the defense with <strong className="text-white">{seasonRecap?.g || 0}G, {seasonRecap?.a || 0}A</strong> and a <strong className="text-white">{seasonRecap?.pm > 0 ? `+${seasonRecap.pm}` : (seasonRecap?.pm || 0)}</strong> rating.</li>
                ) : (
                  <li className="border-l-4 border-[#22E748] pl-4 py-1">🏒 Potted <strong className="text-white">{seasonRecap?.g || 0} goals</strong> and <strong className="text-white">{seasonRecap?.a || 0} assists</strong>.</li>
                )}

                {/* DYNAMIC LEAGUE TROPHY NARRATIVE */}
                {madePlayoffsForNarrative ? (
                  <li className={`border-l-4 ${seasonRecap?.titleWon === 1 ? 'border-[#F59E0B] text-[#F59E0B] font-bold' : 'border-[#ef4444]'} pl-4 py-1`}>
                    {seasonRecap?.titleWon === 1 
                      ? `🏆 Won the ${titles.cupName} Championship!` 
                      : seasonRecap?.confTitleWon
                        ? `🏆 Crowned ${seasonRecap?.confName || 'Conference'} Champions before falling in the ${titles.final}.`
                        : seasonRecap?.playoffWins === 0 
                          ? '🧹 Swept in the first round.' 
                          : `Eliminated after ${seasonRecap?.playoffWins || 0} playoff wins.`}
                  </li>
                ) : (
                  <li className="border-l-4 border-slate-600 pl-4 py-1">... Missed the playoffs.</li>
                )}
                {seasonRecap?.awards && seasonRecap.awards.length > 0 && (
                  <li className="border-l-4 border-[#F59E0B] pl-4 py-2 mt-4 bg-[#F59E0B]/10 rounded-r-lg">
                    <strong className="text-[#F59E0B] block text-[10px] tracking-widest uppercase mb-1">🏆 HARDWARE SECURED</strong>
                    {seasonRecap.awards.map(aw => <div key={aw} className="text-white text-sm font-bold">{aw}</div>)}
                  </li>
                )}
              </ul>

              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <button onClick={advanceToOffseason} className="btn-primary flex-1 py-4 rounded-xl text-lg sm:text-xl cursor-pointer sports-font tracking-widest">
                  PROCEED TO OFFSEASON
                </button>
                
                {player.league === 'NCAA' && (
                   <button onClick={() => {
                       let pool = ncaaTeams?.filter(t => t.id !== player.team) || [];
                       if (pool.length === 0) pool = [{ id: 'UNK', name: 'Unknown Team' }];
                       const newTeam = pool[Math.floor(Math.random() * pool.length)];

                       unlockAchievement('transfer_portal');
                       setPlayer(p => ({
                           ...p,
                           team: newTeam.id,
                           teamsPlayedFor: [...(p.teamsPlayedFor || []), newTeam.id],
                           idolatry: capIdol(p.idolatry - 15)
                       }));
                       
                       setActiveEvent({
                           title: 'TRANSFER PORTAL',
                           desc: `You entered the transfer portal and committed to play for ${newTeam.name} next season!`,
                           choices: [{ label: 'Proceed to Offseason', isRisky: false, feedback: `You are now officially a member of ${newTeam.name}.`, effect: { idol: 0, ovr: 0, money: 0 }, action: 'PORTAL_ADVANCE' }],
                           isPortalEvent: true
                       });
                       setScreen('event');
                   }} className="bg-[#101410] hover:bg-[#1a2230] border border-[#ef4444]/30 text-[#ef4444] flex-1 py-4 rounded-xl text-lg sm:text-xl cursor-pointer sports-font tracking-widest transition-colors shadow-[0_0_15px_rgba(239,68,68,0.15)]">
                     ENTER TRANSFER PORTAL
                   </button>
                )}
              </div>
            </div>
          );
        })()}

        {screen === 'event' && (
          <div className="game-panel p-4 sm:p-10 mt-2 border-t-2 border-t-[#3b82f6]">
            <h2 className="text-xl sm:text-2xl font-black text-white uppercase mb-3 sm:mb-4 sports-font text-left">🗣 {activeEvent.title}</h2>
            <p className="text-sm sm:text-lg text-slate-300 mb-6 sm:mb-8 max-w-2xl font-sans text-left">{activeEvent.desc}</p>
            <div className="flex flex-col gap-2 sm:gap-4 font-sans">
              {(activeEvent.choices || []).map((c, i) => (
                <button key={i} onClick={() => handleEventChoice(c)} className="bg-[#101410] hover:bg-[#1a2230] border border-[rgba(255,255,255,0.065)] text-white p-4 sm:p-5 rounded-xl text-left transition-all cursor-pointer flex flex-col gap-2">
                  <div className="flex justify-between items-center w-full">
                     <span className="text-sm sm:text-base font-bold">{c.label}</span>
                     {c.isRisky && <span className="bg-[#ef4444]/10 text-[#ef4444] text-[10px] sm:text-xs px-2 py-1 rounded font-black tracking-widest uppercase border border-[#ef4444]/30">RISKY</span>}
                  </div>
                  
                  {c.subLabel && <span className="text-[10px] sm:text-xs text-slate-400 font-medium">{c.subLabel}</span>}
                  
                  {((c.perks && c.perks.length > 0) || (c.flaws && c.flaws.length > 0)) && (
                     <div className="flex flex-wrap gap-2 mt-1">
                        {c.perks && c.perks.map((p, idx) => (
                           <span key={`perk-${idx}`} className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-widest border ${p.color}`}>
                              {p.text}
                           </span>
                        ))}
                        {c.flaws && c.flaws.map((f, idx) => (
                           <span key={`flaw-${idx}`} className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-widest text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/30">
                              {f.text}
                           </span>
                        ))}
                     </div>
                  )}
                  {c.perks && c.perks.length === 0 && c.flaws && c.flaws.length === 0 && !c.subLabel && (
                     <span className="text-[10px] text-slate-500 italic">No notable program perks or flaws.</span>
                  )}
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
              <h2 className={`text-3xl sm:text-5xl font-black mb-4 ${accent.heading} sports-font tracking-tighter uppercase leading-tight`}>{mg?.title}</h2>
              <p className="text-base sm:text-xl text-slate-300 mb-8 sm:mb-12 max-w-2xl mx-auto text-left">{mg?.desc}</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 max-w-4xl mx-auto">
                {(mg?.choices || []).map((c, i) => {
                  const chance = choiceChance(player, c);
                  const pill = ARCH_PILL[c.archetype] || ARCH_PILL.safe;
                  return (
                    <button key={i} onClick={() => handleMinigameChoice(chance, c.success, c.fail, c.reward)} className={`bg-[#101410] hover:bg-[#1a2230] border border-[rgba(255,255,255,0.065)] ${pill.hover} py-4 sm:py-7 px-4 rounded-xl font-bold text-lg sm:text-2xl text-white transition-all cursor-pointer flex flex-col items-center sports-font`}>
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

        {screen === 'playoffs' && (() => {
          const activeRound = playoffs.bracket[playoffs.activeRoundIndex];
          const playerMatchIndex = activeRound?.findIndex(m => m.isPlayerSeries);
          const activeMatch = playerMatchIndex >= 0 ? activeRound[playerMatchIndex] : null;
          const titles = getPlayoffTitles(player.league);

          const getTeamLabel = (team) => {
            if (!team || team.id === 'TBD' || team.name === 'TBD' || team.id?.startsWith('TBD')) return 'TBD';
            return team.id || team.name;
          };

          return (
            <div className="game-panel p-3 sm:p-6 mt-2 border-t-2 border-t-[#F59E0B] flex flex-col items-center relative">
              
              {/* DYNAMIC LEAGUE PLAYOFF HEADER */}
              
              {/* CONFERENCE HEADERS */}
              <div className="flex justify-between w-full max-w-5xl px-4 mb-2 text-xs font-black sports-font uppercase tracking-wider">
                 <span className="text-[#3b82f6]">EASTERN CONFERENCE</span>
                 <span className="text-[#F59E0B]">{titles.final}</span>
                 <span className="text-[#ef4444]">WESTERN CONFERENCE</span>
              </div>
              
              {/* CONDENSED CONFERENCE BRACKET VIEW */}
              <div className="flex justify-center items-stretch gap-1.5 sm:gap-2.5 overflow-x-auto w-full pb-3 mb-4 border-b border-[rgba(255,255,255,0.065)] min-h-[250px]">
                 
                 {/* EASTERN CONFERENCE (LEFT) */}
                 <div className="flex gap-1.5 sm:gap-2.5">
                    {playoffs.bracket.slice(0, playoffs.bracket.length - 1).map((round, rIdx) => (
                       <div key={`left-${rIdx}`} className="flex flex-col justify-around gap-1 min-w-[95px] sm:min-w-[110px]">
                          <p className="text-center text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                             {rIdx === 0 ? 'R1 (DIV)' : rIdx === 1 ? 'R2 (DIV)' : 'CONF FINAL'}
                          </p>
                          {round.map((match, mIdx) => {
                             if (mIdx >= round.length / 2) return null; 
                             const isLocked = match.status === 'locked';
                             return (
                               <div key={mIdx} className={`rounded p-1 sm:p-1.5 border flex flex-col gap-0.5 transition-all duration-300 ${isLocked ? 'opacity-30 grayscale' : 'opacity-100'} ${match.isPlayerSeries ? 'border-[#3b82f6] bg-[#3b82f6]/10 shadow-[0_0_8px_rgba(59,130,246,0.3)] ring-1 ring-[#3b82f6]' : 'border-[rgba(255,255,255,0.065)] bg-[#101410]'}`}>
                                  <div className={`flex justify-between items-center text-[10px] sm:text-xs ${match.wins1 === 4 ? 'text-[#22E748]' : 'text-slate-300'}`}>
                                     <span className="font-bold truncate max-w-[65px] sm:max-w-[75px]">{getTeamLabel(match.team1)}</span>
                                     <span className="font-black sports-font ml-1">{match.wins1}</span>
                                  </div>
                                  <div className={`flex justify-between items-center text-[10px] sm:text-xs ${match.wins2 === 4 ? 'text-[#22E748]' : 'text-slate-300'}`}>
                                     <span className="font-bold truncate max-w-[65px] sm:max-w-[75px]">{getTeamLabel(match.team2)}</span>
                                     <span className="font-black sports-font ml-1">{match.wins2}</span>
                                  </div>
                               </div>
                             );
                          })}
                       </div>
                    ))}
                 </div>

                 {/* CHAMPIONSHIP FINAL (CENTER) */}
                 <div className="flex flex-col justify-center gap-2 min-w-[115px] sm:min-w-[145px] shrink-0 relative px-1">
                    <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                       <span className="text-[65px]">{titles.trophy}</span>
                    </div>
                    <p className="text-center text-[8px] sm:text-[9px] font-bold text-[#F59E0B] uppercase tracking-wider">
                       FINAL
                    </p>
                    {playoffs.bracket[playoffs.bracket.length - 1].map((match, mIdx) => {
                       const isLocked = match.status === 'locked';
                       return (
                         <div key={mIdx} className={`relative z-10 rounded-lg p-2 border flex flex-col gap-1 transition-all duration-300 ${isLocked ? 'opacity-30 grayscale border-[#F59E0B]/20 bg-[#101410]' : match.isPlayerSeries ? 'border-[#3b82f6] bg-[#3b82f6]/10 shadow-[0_0_15px_rgba(59,130,246,0.4)]' : 'border-[#F59E0B]/50 bg-[#101410]'}`}>
                            <div className={`flex justify-between items-center text-xs sm:text-sm ${match.wins1 === 4 ? 'text-[#22E748]' : 'text-slate-300'}`}>
                               <span className="font-bold truncate max-w-[75px] sm:max-w-[95px]">{getTeamLabel(match.team1)}</span>
                               <span className="font-black sports-font text-base ml-1">{match.wins1}</span>
                            </div>
                            <div className={`flex justify-between items-center text-xs sm:text-sm ${match.wins2 === 4 ? 'text-[#22E748]' : 'text-slate-300'}`}>
                               <span className="font-bold truncate max-w-[75px] sm:max-w-[95px]">{getTeamLabel(match.team2)}</span>
                               <span className="font-black sports-font text-base ml-1">{match.wins2}</span>
                            </div>
                         </div>
                       );
                    })}
                 </div>

                 {/* WESTERN CONFERENCE (RIGHT REVERSED) */}
                 <div className="flex flex-row-reverse gap-1.5 sm:gap-2.5">
                    {playoffs.bracket.slice(0, playoffs.bracket.length - 1).map((round, rIdx) => (
                       <div key={`right-${rIdx}`} className="flex flex-col justify-around gap-1 min-w-[95px] sm:min-w-[110px]">
                          <p className="text-center text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                             {rIdx === 0 ? 'R1 (DIV)' : rIdx === 1 ? 'R2 (DIV)' : 'CONF FINAL'}
                          </p>
                          {round.map((match, mIdx) => {
                             if (mIdx < round.length / 2) return null; 
                             const isLocked = match.status === 'locked';
                             return (
                               <div key={mIdx} className={`rounded p-1 sm:p-1.5 border flex flex-col gap-0.5 transition-all duration-300 ${isLocked ? 'opacity-30 grayscale' : 'opacity-100'} ${match.isPlayerSeries ? 'border-[#3b82f6] bg-[#3b82f6]/10 shadow-[0_0_8px_rgba(59,130,246,0.3)] ring-1 ring-[#3b82f6]' : 'border-[rgba(255,255,255,0.065)] bg-[#101410]'}`}>
                                  <div className={`flex justify-between items-center text-[10px] sm:text-xs ${match.wins1 === 4 ? 'text-[#22E748]' : 'text-slate-300'}`}>
                                     <span className="font-bold truncate max-w-[65px] sm:max-w-[75px]">{getTeamLabel(match.team1)}</span>
                                     <span className="font-black sports-font ml-1">{match.wins1}</span>
                                  </div>
                                  <div className={`flex justify-between items-center text-[10px] sm:text-xs ${match.wins2 === 4 ? 'text-[#22E748]' : 'text-slate-300'}`}>
                                     <span className="font-bold truncate max-w-[65px] sm:max-w-[75px]">{getTeamLabel(match.team2)}</span>
                                     <span className="font-black sports-font ml-1">{match.wins2}</span>
                                  </div>
                               </div>
                             );
                          })}
                       </div>
                    ))}
                 </div>

              </div>

              {/* CARD MINIGAME GRID & NEXT ROUND PROCEED BUTTON */}
              {activeMatch && (
                 <div className="max-w-xs sm:max-w-sm w-full bg-[#101410] border border-[rgba(255,255,255,0.065)] p-4 sm:p-5 rounded-xl text-center shadow-lg">

                    {/* TOP STATUS LINE — always occupies the same slot so the grid below never shifts */}
                    <div className="mb-4">
                      {activeMatch.status === 'playing' && (
                        <>
                          <p className="text-[9px] sm:text-[10px] font-black text-[#3b82f6] uppercase tracking-widest mb-1 font-sans">
                             ROUND {playoffs.activeRoundIndex + 1} MATCHUP
                          </p>
                          <p className="text-base sm:text-lg text-white font-black uppercase sports-font">
                             VS. {getTeamLabel(activeMatch.team2)}
                          </p>
                        </>
                      )}
                      {activeMatch.status === 'won' && (
                        <>
                          <p className="text-[9px] sm:text-[10px] font-black text-[#22E748] uppercase tracking-widest mb-1 font-sans">
                             ⚡ SERIES VICTORY! ({activeMatch.wins1}-{activeMatch.wins2})
                          </p>
                          <p className="text-base sm:text-lg text-white font-black uppercase sports-font">
                             DEFEATED {getTeamLabel(activeMatch.team2)}
                          </p>
                        </>
                      )}
                      {activeMatch.status === 'lost' && (
                        <>
                          <p className="text-[9px] sm:text-[10px] font-black text-[#ef4444] uppercase tracking-widest mb-1 font-sans">
                             💔 ELIMINATED ({activeMatch.wins1}-{activeMatch.wins2})
                          </p>
                          <p className="text-base sm:text-lg text-white font-black uppercase sports-font">
                             DEFEATED BY {getTeamLabel(activeMatch.team2)}
                          </p>
                        </>
                      )}
                    </div>

                    {/* 9-CARD GRID — stays in the same place whether the series is playing, won, or lost */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-3">
                      {(activeMatch.deck || []).map((item, cIndex) => {
                        const isRevealed = (activeMatch.revealed || []).includes(cIndex);
                        const isOver = ['won', 'lost'].includes(activeMatch.status);
                        const showForcefully = isOver && !isRevealed;
                        const isWinCard = item && (item.isWin || item.win);
                        
                        let btnClass = 'h-16 sm:h-20 text-xl sm:text-2xl font-black rounded-lg border transition-all duration-200 flex items-center justify-center sports-font ';
                        
                        if (isRevealed || showForcefully) {
                          btnClass += isWinCard 
                            ? 'bg-[#22E748]/20 border-[#22E748] text-[#22E748] shadow-[0_0_10px_rgba(34,231,72,0.3)]' 
                            : 'bg-[#ef4444]/20 border-[#ef4444] text-[#ef4444] shadow-[0_0_10px_rgba(239,68,68,0.3)]';
                        } else {
                          btnClass += 'bg-[#1a2230] border-[rgba(255,255,255,0.12)] text-slate-400 hover:border-[#3b82f6] hover:text-white hover:scale-105 active:scale-95 cursor-pointer';
                        }

                        return (
                          <button 
                            key={`card-${cIndex}`} 
                            onClick={() => handleGridClick(playoffs.activeRoundIndex, playerMatchIndex, cIndex)} 
                            className={btnClass} 
                            disabled={isOver || isRevealed}
                          >
                            {(isRevealed || showForcefully) ? (isWinCard ? 'W' : 'L') : '?'}
                          </button>
                        );
                      })}
                    </div>

                    {/* BOTTOM AREA — hint while playing, advance button once the series is won. Below the grid, so winning never shifts the cards. */}
                    {activeMatch.status === 'playing' && (
                      <p className="text-[9px] sm:text-[10px] text-slate-500 font-sans">Select a card to play the next game (Best-of-7)</p>
                    )}
                    {activeMatch.status === 'won' && playoffs.overallStatus !== 'won_cup' && (
                      <button
                        onClick={advancePlayoffRound}
                        className="btn-primary w-full py-2.5 rounded-lg font-black sports-font text-xs uppercase tracking-wider transition-transform hover:scale-105 cursor-pointer"
                      >
                        ADVANCE TO ROUND {playoffs.activeRoundIndex + 2} ➔
                      </button>
                    )}
                 </div>
              )}

              {/* END OF PLAYOFFS PROCEED BUTTON */}
              {['won_cup', 'eliminated'].includes(playoffs.overallStatus) && (
                <div className="mt-4 text-center w-full max-w-xs">
                   <button 
                     onClick={proceedFromPlayoffs} 
                     className={`py-3.5 px-8 rounded-xl cursor-pointer sports-font tracking-widest w-full font-black text-sm uppercase transition-transform hover:scale-105 ${
                       playoffs.overallStatus === 'eliminated' 
                         ? 'bg-[#101410] border border-[rgba(255,255,255,0.12)] text-white hover:bg-[#1a2230]' 
                         : 'btn-primary'
                     }`}
                   >
                     {playoffs.overallStatus === 'won_cup' ? 'LIFT THE TROPHY' : 'PROCEED TO RECAP'}
                   </button>
                </div>
              )}

            </div>
          );
        })()}

        {screen === 'memorial-cup' && (() => {
          const isFinal = memCup.round === 1;

          // DYNAMIC CHL HOST ROTATION
          const hostLeagues = ['WHL', 'OHL', 'QMJHL'];
          const seasonIdx = player.stats?.seasonsPlayed || 0;
          const hostLeague = hostLeagues[seasonIdx % 3];

          const getHostTeamInfo = (league) => {
            const pool = league === 'OHL' ? (ohlTeams || []) : league === 'WHL' ? (whlTeams || []) : (qmjhlTeams || []);
            if (pool.length === 0) return { name: 'Host Team', league };
            const team = pool[(seasonIdx * 3) % pool.length];
            return { name: getFullTeamName(team.id, league), league };
          };

          const hostTeam = getHostTeamInfo(hostLeague);

          const getChampName = (lg) => {
            if (player.league === lg) return getFullTeamName(player.team, lg);
            const pool = lg === 'OHL' ? (ohlTeams || []) : lg === 'WHL' ? (whlTeams || []) : (qmjhlTeams || []);
            const filtered = pool.filter(t => t.id !== hostTeam.name && getFullTeamName(t.id, lg) !== hostTeam.name);
            const team = filtered[(seasonIdx * 5) % (filtered.length || 1)];
            return team ? getFullTeamName(team.id, lg) : `${lg} Champions`;
          };

          const ohlChamp = getChampName('OHL');
          const whlChamp = getChampName('WHL');
          const qmjhlChamp = getChampName('QMJHL');
          const playerTeamName = getFullTeamName(player.team, player.league);

          const semiOpponent = hostTeam.name !== playerTeamName ? hostTeam.name : (player.league === 'OHL' ? whlChamp : ohlChamp);
          const finalOpponent = player.league === 'OHL' ? whlChamp : (player.league === 'WHL' ? qmjhlChamp : ohlChamp);
          const currentOpponent = !isFinal ? semiOpponent : finalOpponent;

          const choices = player.pos === 'G' ? [
            { 
              label: 'Stand on Your Head in OT', 
              tag: 'AGI + REFLEXES', 
              chance: 0.50 + (player.physicality + player.shooting) / 400,
              desc: 'High risk, massive draft stock surge.',
              successMsg: 'You pulled off a miraculous desperation glove save in OT! Scouts are calling it the save of the tournament.',
              failMsg: 'A trickling puck got past your pad in double overtime. Heartbreak on national television.'
            },
            { 
              label: 'Command the Defense & Direct Traffic', 
              tag: 'HOCKEY IQ', 
              chance: 0.55 + player.hockeyIQ / 200,
              desc: 'Controlled, tactical play between the pipes.',
              successMsg: 'Your vocal leadership locked down the crease. The defense shut down every high-danger chance.',
              failMsg: 'A breakdown in communication led to a turnover right in your slot.'
            },
            { 
              label: 'Aggressive Crease Control & Smother Puck', 
              tag: 'STAMINA', 
              chance: 0.60 + player.stamina / 200,
              desc: 'Relentless effort to freeze the puck under pressure.',
              successMsg: 'You absorbed heavy traffic and froze every puck to kill all momentum.',
              failMsg: 'You spilled a dangerous rebound into traffic for an easy putback goal.'
            }
          ] : [
            { 
              label: 'Take Over the 3rd Period', 
              tag: 'SHOOTING + SKATING', 
              chance: 0.50 + (player.shooting + player.skating) / 400,
              desc: 'Hero ball. Drive the lane and demand the puck.',
              successMsg: 'You put the team on your back! A 3rd period multi-point effort blew the game wide open.',
              failMsg: 'You got double-teamed along the boards and coughed up the game-winning turnover.'
            },
            { 
              label: 'Powerplay Quarterback', 
              tag: 'HOCKEY IQ', 
              chance: 0.55 + player.hockeyIQ / 200,
              desc: 'Set up your linemates with precision passing.',
              successMsg: 'Your pinpoint cross-seam passes carved up their penalty kill for two quick PP goals!',
              failMsg: 'Their penalty kill anticipated your passes, breaking up the play for a shorthanded breakaway.'
            },
            { 
              label: 'Sacrifice Body for the Win', 
              tag: 'PHYSICALITY + STAMINA', 
              chance: 0.60 + (player.physicality + player.stamina) / 400,
              desc: 'Crushing hits, board battles, and shot blocking.',
              successMsg: 'Your relentless physicality rattled their top line and fired up the entire bench!',
              failMsg: 'You took an undisciplined double-minor penalty late in the final frame.'
            }
          ];

          const handleChoice = (c) => {
            const success = Math.random() < c.chance;
            if (success) {
              if (!isFinal) {
                setMemCup({ round: 0, status: 'semi_won', lastFeedback: c.successMsg });
              } else {
                setMemCup({ round: 1, status: 'won', lastFeedback: c.successMsg });
                setPlayer(p => ({
                  ...p,
                  idolatry: capIdol(p.idolatry + 50),
                  stats: { ...p.stats, memCupBoost: 50, titles: (p.stats.titles || 0) + 1 }
                }));
                unlockAchievement('mem_cup');
              }
            } else {
              setMemCup({ ...memCup, status: 'lost', lastFeedback: c.failMsg });
            }
          };

          return (
            <div className="game-panel p-4 sm:p-10 mt-2 border-t-2 border-t-[#F59E0B] flex flex-col items-center">
              
              {/* HEADER BANNER */}
              <div className="text-center mb-4">
                 <p className="text-[10px] sm:text-xs font-black text-[#F59E0B] uppercase tracking-widest font-sans flex items-center justify-center gap-2">
                   <span>🏆</span> CANADIAN HOCKEY LEAGUE <span>🏆</span>
                 </p>
                 <h1 className="text-3xl sm:text-5xl font-black italic tracking-tighter text-white sports-font uppercase">
                   THE MEMORIAL CUP
                 </h1>
              </div>

              {/* 2-STAGE TOURNAMENT TRACKER */}
              <div className="flex items-center justify-center gap-2 sm:gap-4 w-full max-w-xl mb-6 bg-[#101410] p-2.5 sm:p-3 rounded-xl border border-[rgba(255,255,255,0.065)] font-sans">
                 <div className={`flex-1 p-2 rounded-lg text-center border transition-all ${
                   memCup.status === 'semi_won' || isFinal 
                     ? 'bg-[#22E748]/10 border-[#22E748] text-[#22E748]' 
                     : !isFinal 
                       ? 'bg-[#F59E0B]/15 border-[#F59E0B] text-white shadow-[0_0_10px_rgba(245,158,11,0.2)]' 
                       : 'bg-[#0a0d0a] border-[rgba(255,255,255,0.04)] text-slate-500'
                 }`}>
                    <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider">STAGE 1: SEMI-FINAL</p>
                    <p className="text-[10px] sm:text-xs font-bold truncate">VS {semiOpponent}</p>
                    {(memCup.status === 'semi_won' || isFinal) && <span className="text-[9px] font-black">✓ WON</span>}
                 </div>

                 <span className="text-slate-600 font-bold">➔</span>

                 <div className={`flex-1 p-2 rounded-lg text-center border transition-all ${
                   memCup.status === 'won' 
                     ? 'bg-[#F59E0B]/20 border-[#F59E0B] text-[#F59E0B]' 
                     : isFinal 
                       ? 'bg-[#F59E0B]/15 border-[#F59E0B] text-white shadow-[0_0_10px_rgba(245,158,11,0.2)]' 
                       : 'bg-[#0a0d0a] border-[rgba(255,255,255,0.04)] opacity-50 text-slate-500'
                 }`}>
                    <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider">STAGE 2: FINAL</p>
                    <p className="text-[10px] sm:text-xs font-bold truncate">VS {finalOpponent}</p>
                    {memCup.status === 'won' && <span className="text-[9px] font-black">🏆 CHAMPION</span>}
                 </div>
              </div>

              {/* 4-TEAM SHOWCASE */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 w-full max-w-3xl mb-8">
                 <div className={`p-2.5 sm:p-3 rounded-xl border text-center transition-all flex flex-col justify-center items-center min-h-[72px] ${player.league === 'OHL' ? 'bg-[#F59E0B]/10 border-[#F59E0B] shadow-[0_0_12px_rgba(245,158,11,0.2)]' : 'bg-[#101410] border-[rgba(255,255,255,0.065)] opacity-60'}`}>
                    <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">OHL CHAMP</p>
                    <p className="text-[10px] sm:text-xs font-black text-white sports-font leading-tight break-words">{ohlChamp}</p>
                 </div>
                 <div className={`p-2.5 sm:p-3 rounded-xl border text-center transition-all flex flex-col justify-center items-center min-h-[72px] ${player.league === 'WHL' ? 'bg-[#F59E0B]/10 border-[#F59E0B] shadow-[0_0_12px_rgba(245,158,11,0.2)]' : 'bg-[#101410] border-[rgba(255,255,255,0.065)] opacity-60'}`}>
                    <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">WHL CHAMP</p>
                    <p className="text-[10px] sm:text-xs font-black text-white sports-font leading-tight break-words">{whlChamp}</p>
                 </div>
                 <div className={`p-2.5 sm:p-3 rounded-xl border text-center transition-all flex flex-col justify-center items-center min-h-[72px] ${player.league === 'QMJHL' ? 'bg-[#F59E0B]/10 border-[#F59E0B] shadow-[0_0_12px_rgba(245,158,11,0.2)]' : 'bg-[#101410] border-[rgba(255,255,255,0.065)] opacity-60'}`}>
                    <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">QMJHL CHAMP</p>
                    <p className="text-[10px] sm:text-xs font-black text-white sports-font leading-tight break-words">{qmjhlChamp}</p>
                 </div>
                 <div className="p-2.5 sm:p-3 rounded-xl border text-center bg-[#101410] border-[#F59E0B]/40 shadow-[0_0_8px_rgba(245,158,11,0.15)] flex flex-col justify-center items-center min-h-[72px]">
                    <p className="text-[8px] sm:text-[9px] font-bold text-[#F59E0B] uppercase font-sans tracking-wider mb-0.5">HOST ({hostTeam.league})</p>
                    <p className="text-[10px] sm:text-xs font-black text-white sports-font leading-tight break-words">{hostTeam.name}</p>
                 </div>
              </div>

              {/* SEMI-FINAL VICTORY INTERMISSION SCREEN */}
              {memCup.status === 'semi_won' && (
                <div className="w-full max-w-xl bg-gradient-to-b from-[#102010] to-[#081008] border-2 border-[#22E748] p-6 sm:p-8 rounded-2xl text-center shadow-[0_0_30px_rgba(34,231,72,0.2)] mb-6">
                   <div className="text-4xl sm:text-5xl mb-3 animate-bounce">⚡</div>
                   <p className="text-xs font-black text-[#22E748] uppercase tracking-widest font-sans mb-1">SEMI-FINAL VICTORY!</p>
                   <h3 className="text-2xl sm:text-3xl font-black text-white sports-font uppercase mb-3">
                     DEFEATED {semiOpponent.toUpperCase()}
                   </h3>
                   <p className="text-xs sm:text-sm text-slate-300 font-sans italic mb-6">
                     "{memCup.lastFeedback}"
                   </p>
                   <button
                     onClick={() => setMemCup({ round: 1, status: 'playing' })}
                     className="btn-primary w-full py-4 rounded-xl font-black sports-font text-base uppercase tracking-widest transition-transform hover:scale-105 cursor-pointer"
                   >
                     ENTER CHAMPIONSHIP FINAL VS {finalOpponent.toUpperCase()} ➔
                   </button>
                </div>
              )}

              {/* ACTIVE MATCHUP CHOICES */}
              {memCup.status === 'playing' && (
                <div className="w-full max-w-2xl space-y-4">
                  <div className="bg-[#101410] border border-[rgba(255,255,255,0.065)] p-4 rounded-xl text-center mb-6">
                    <p className="text-[10px] font-bold text-[#F59E0B] uppercase tracking-widest mb-1 font-sans">
                      {isFinal ? '🏆 MEMORIAL CUP FINAL MATCHUP' : '🏒 SEMI-FINAL MATCHUP'}
                    </p>
                    <h3 className="text-xl sm:text-2xl font-black text-white sports-font uppercase">
                      VS. {currentOpponent.toUpperCase()}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {choices.map((c, i) => (
                      <button
                        key={i}
                        onClick={() => handleChoice(c)}
                        className="bg-[#101410] hover:bg-[#1a2230] border border-[rgba(255,255,255,0.1)] hover:border-[#F59E0B] p-4 rounded-xl text-left transition-all cursor-pointer flex flex-col justify-between group"
                      >
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[9px] font-bold text-[#F59E0B] uppercase tracking-wider font-sans border border-[#F59E0B]/30 px-2 py-0.5 rounded bg-[#F59E0B]/10">
                              {c.tag}
                            </span>
                            <span className="text-xs font-black text-slate-400 sports-font">
                              {Math.round(c.chance * 100)}%
                            </span>
                          </div>
                          <h4 className="text-sm font-black text-white sports-font uppercase group-hover:text-[#F59E0B] transition-colors mb-1">
                            {c.label}
                          </h4>
                          <p className="text-[10px] text-slate-400 font-sans leading-tight">
                            {c.desc}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* VERDICT & CELEBRATION SCREEN */}
              {['won', 'lost'].includes(memCup.status) && (
                <div className={`w-full max-w-2xl p-6 sm:p-8 rounded-2xl border text-center relative overflow-hidden ${
                  memCup.status === 'won'
                    ? 'bg-gradient-to-b from-[#1a1405] to-[#0a0802] border-[#F59E0B] shadow-[0_0_40px_rgba(245,158,11,0.25)]'
                    : 'bg-gradient-to-b from-[#180a0a] to-[#0a0404] border-[#ef4444] shadow-[0_0_30px_rgba(239,68,68,0.2)]'
                }`}>
                  <div className="text-5xl sm:text-6xl mb-4 animate-bounce">
                    {memCup.status === 'won' ? '🏆' : '💔'}
                  </div>

                  <p className={`text-xs font-black uppercase tracking-widest mb-1 ${
                    memCup.status === 'won' ? 'text-[#F59E0B]' : 'text-[#ef4444]'
                  }`}>
                    {memCup.status === 'won' ? 'CHL SUPREMACY UNLOCKED' : 'TOURNAMENT ELIMINATION'}
                  </p>

                  <h2 className="text-3xl sm:text-5xl font-black text-white sports-font uppercase tracking-tight mb-3">
                    {memCup.status === 'won' ? 'MEMORIAL CUP CHAMPIONS!' : 'SEASON ENDS IN HEARTBREAK'}
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-300 font-sans italic max-w-lg mx-auto mb-6">
                    "{memCup.lastFeedback}"
                  </p>

                  {/* SCOUT EVALUATION & IMPACT RECAP */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 text-left">
                    <div className="bg-[#101410]/80 p-3.5 rounded-xl border border-[rgba(255,255,255,0.065)] flex flex-col justify-start min-h-[72px]">
                      <p className="text-[9px] font-bold text-slate-500 uppercase font-sans tracking-wider mb-1">
                        NHL DRAFT IMPACT
                      </p>
                      <p className={`text-sm sm:text-base font-black sports-font leading-tight ${
                        memCup.status === 'won' ? 'text-[#22E748]' : 'text-slate-300'
                      }`}>
                        {memCup.status === 'won' 
                          ? (player.ovr >= 65 ? '🚀 LOCK FOR TOP 10 PICK' : '🚀 RISES TO 1ST ROUND')
                          : '➡️ STABLE DRAFT POSITION'}
                      </p>
                    </div>

                    <div className="bg-[#101410]/80 p-3.5 rounded-xl border border-[rgba(255,255,255,0.065)] flex flex-col justify-start min-h-[72px]">
                      <p className="text-[9px] font-bold text-slate-500 uppercase font-sans tracking-wider mb-1">
                        MEDIA HEADLINE
                      </p>
                      <p className="text-xs sm:text-sm font-black text-white sports-font leading-tight break-words uppercase">
                        {memCup.status === 'won' ? '"KING OF JUNIOR HOCKEY"' : '"HEROIC EFFORT FALLS SHORT"'}
                      </p>
                    </div>

                    <div className="bg-[#101410]/80 p-3.5 rounded-xl border border-[rgba(255,255,255,0.065)] flex flex-col justify-start min-h-[72px]">
                      <p className="text-[9px] font-bold text-slate-500 uppercase font-sans tracking-wider mb-1">
                        FAN REACTION
                      </p>
                      <p className={`text-sm sm:text-base font-black sports-font leading-tight ${
                        memCup.status === 'won' ? 'text-[#F59E0B]' : 'text-[#ef4444]'
                      }`}>
                        {memCup.status === 'won' ? '🔥 MAX HYPE (+50)' : '📉 DISAPPOINTED'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleEndMemCup}
                    className={`w-full sm:w-auto py-3.5 px-10 rounded-xl font-black sports-font tracking-widest text-sm uppercase transition-transform hover:scale-105 ${
                      memCup.status === 'won'
                        ? 'bg-[#F59E0B] text-black hover:bg-[#d97706]'
                        : 'bg-[#101410] border border-[rgba(255,255,255,0.12)] text-white hover:bg-[#1a2230]'
                    }`}
                  >
                    {memCup.status === 'won' ? 'LIFT THE TROPHY & PROCEED' : 'CONTINUE TO RECAP'}
                  </button>
                </div>
              )}

            </div>
          );
        })()}

        {screen === 'transfer' && (
          <div className="game-panel p-6 sm:p-10 mt-2 border-t-2 border-t-[#3b82f6]">
            <h2 className="text-3xl sm:text-4xl font-black italic text-white uppercase mb-4 text-center sports-font tracking-tighter">FREE AGENCY</h2>
            <p className="text-slate-400 text-base sm:text-lg mb-8 sm:mb-10 font-medium text-center">The market speaks. Glory, loyalty, or money?</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {(freeAgencyOffers || []).map((o, i) => {
                // 1. Arch-Rival Check
                const rivalObj = getPrimaryRival ? getPrimaryRival(player.team, player.league) : null;
                const isRival = rivalObj && (rivalObj.id === o.team || rivalObj.name === o.team);

                // 2. Returning Home Check
                // Drafted by this team, currently playing elsewhere, previously played for them, and reached Loved/Icon status (400+ Idolatry)
                const isDraftTeam = (player.draftTeam || player.rights) === o.team;
                const hasPlayedFor = (player.teamsPlayedFor || []).includes(o.team);
                const isLovedStatus = player.idolatry >= 400; // Loved / Local Hero or higher
                const isReturnHome = isDraftTeam && player.team !== o.team && hasPlayedFor && isLovedStatus;

                return (
                  <div 
                    key={i} 
                    className={`bg-[#101410] border p-5 sm:p-6 rounded-xl flex flex-col text-left relative overflow-hidden transition-all ${
                      isRival 
                        ? 'border-[#ef4444] shadow-[0_0_20px_rgba(239,68,68,0.2)]' 
                        : isReturnHome 
                          ? 'border-[#F59E0B] shadow-[0_0_20px_rgba(245,158,11,0.25)]' 
                          : 'border-[rgba(255,255,255,0.065)]'
                    }`}
                  >
                    {/* ARCH-RIVAL BANNER */}
                    {isRival && (
                      <div className="bg-[#ef4444] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 -mx-5 -mt-5 sm:-mx-6 sm:-mt-6 mb-4 text-center sports-font flex items-center justify-center gap-1 shadow-md">
                        🔥 ARCH-RIVAL OFFER — FANS WILL BE FURIOUS
                      </div>
                    )}

                    {/* RETURNING HOME BANNER */}
                    {isReturnHome && !isRival && (
                      <div className="bg-[#F59E0B] text-black text-[10px] font-black uppercase tracking-widest px-3 py-1.5 -mx-5 -mt-5 sm:-mx-6 sm:-mt-6 mb-4 text-center sports-font flex items-center justify-center gap-1 shadow-md">
                        🏠 RETURNING HOME — THE PRODIGAL SON RETURNS
                      </div>
                    )}

                    <div className="flex items-center gap-3 mb-4">
                      <TeamLogo teamId={o.team} league="NHL" />
                      <div>
                        <h3 className="text-xl sm:text-2xl font-black text-white sports-font">{o.team}</h3>
                        {isReturnHome && <span className="text-[9px] font-bold text-[#F59E0B] uppercase tracking-wider font-sans">Your Draft Team</span>}
                      </div>
                    </div>

                    <p className="text-2xl sm:text-3xl font-black text-[#22E748] mb-1 sports-font">{formatMoney(o.salary)}<span className="text-xs sm:text-sm text-slate-400 font-sans"> /yr</span></p>
                    <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase mb-2">{o.years}-year contract</p>
                    
                    <p className="text-[10px] sm:text-xs font-black text-[#3b82f6] bg-[#3b82f6]/10 border border-[#3b82f6]/30 rounded px-2 py-1 uppercase mb-4 text-center">
                      ROLE: {o.role || 'Depth'}
                    </p>

                    <p className={`text-[10px] sm:text-xs font-bold uppercase mb-6 flex items-center gap-1 ${o.idolHit >= 0 ? 'text-[#22E748]' : 'text-[#ef4444]'}`}>
                      {o.idolHit >= 0 ? '📈' : '📉'} FAN IMPACT: {o.idolHit > 0 ? '+' : ''}{o.idolHit}
                    </p>

                    <button 
                      onClick={() => signContract(o)} 
                      className={`w-full py-3 rounded-lg cursor-pointer sports-font tracking-widest mt-auto font-black text-base transition-transform hover:scale-105 ${
                        isReturnHome 
                          ? 'bg-[#F59E0B] text-black hover:bg-[#d97706]' 
                          : isRival 
                            ? 'bg-[#ef4444] text-white hover:bg-[#dc2626]' 
                            : 'btn-primary'
                      }`}
                    >
                      {isReturnHome ? 'RETURN HOME' : isRival ? 'BETRAY & SIGN' : 'SIGN DEAL'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div> 
    </div>
  );
}

export default App;