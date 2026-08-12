import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  nhlTeams, ohlTeams, whlTeams, qmjhlTeams, ushlTeams, ahlTeams, shlTeams, liigaTeams, ncaaTeams,
  nationalities, juniorLeagues, euroLeagues, LEAGUE_CONFIG,
  getTeamData, getDeployment, getOpponentPool, getPrimaryRival,
  getTeamConference, getTeamDivision, getConferences, getDivisions,
  getPlayoffFormat, getPlayoffRounds, groupByConference
} from './data/teams';
import { shopItems, skaterTrainingPool, goalieTrainingPool, eventDeck } from './data/economy';
import { getMinigamePool, findMinigame } from './data/minigames';
import {
  cap, capIdol, formatMoney, getIdolTier, getTransferImpact,
  getActiveStat, applyOvrDelta, recomputeOvr, simulateSeason, generatePlayoffDeck,
  choiceChance
// Import the new helpers.
} from './utils/gameHelpers';

// =====================================================================
// MODULE-LEVEL HELPERS
// Centralised so screens and handlers can't drift apart.
// =====================================================================

// Single source of truth for a fresh player state. Used by both the initial
// useState value and handleNewGame — extracting stops the two literals from
// drifting apart when new player fields get added.
const makeInitialPlayer = () => ({
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
  relationships: { coach: 50, teammates: 50, media: 50 },
  idolatry: 0, inventory: [], buffs: [], agentRerolls: 1, teamsPlayedFor: [], rights: null, startLeague: 'OHL',
  // Storyline & generational trackers
  isGenerational: false,
  nemesisName: null,
  duoName: null,
  storylines: { mediaNemesis: 0, franchiseDuo: 0, lockerRoom: 0, hometown: 0, injury: 0 }
});

// Role classifier used by generateOffers. Hoisted from inside the function
// so the definition isn't reallocated on every offer generation.
const getRole = (salary, p) => {
  if (p.pos === 'G') {
     if (p.ovr >= 85 || salary > 5000000) return 'Franchise Starter';
     if (p.ovr >= 80 || salary > 3500000) return 'Starter';
     if (p.ovr >= 75) return '1B / Tandem';
     return 'Backup';
  }

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

// Playoff format helpers — resolve per-round win threshold and deck length
// from LEAGUE_CONFIG so the same code drives best-of-7 series and NCAA single-elim.
const getGamesPerMatchup = (league, roundIndex) => {
  const rounds = getPlayoffRounds(league) || [];
  return rounds[roundIndex]?.gamesPerMatchup || 7;
};
const getWinsNeeded = (league, roundIndex) => {
  return Math.ceil(getGamesPerMatchup(league, roundIndex) / 2);
};

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
  { id: 'ncaa_champ', name: 'National Champion', desc: 'Win the NCAA National Championship', icon: '🏆' },

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
  { id: 'the_idol', name: 'The Ultimate Idol', desc: 'Unlock 40 or more total achievements across all career playthroughs', icon: '🏆' }
];

const PRESS_VIBES = {
  professional: { label: 'PROFESSIONAL', icon: '👔', color: 'text-[#3b82f6]', bg: 'bg-[#3b82f6]/10', border: 'border-[#3b82f6]/30' },
  passionate:   { label: 'PASSIONATE',   icon: '🔥', color: 'text-[#ef4444]', bg: 'bg-[#ef4444]/10', border: 'border-[#ef4444]/30' },
  humble:       { label: 'HUMBLE',       icon: '🙏', color: 'text-[#22E748]', bg: 'bg-[#22E748]/10', border: 'border-[#22E748]/30' },
  cocky:        { label: 'COCKY',        icon: '😎', color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/10', border: 'border-[#F59E0B]/30' }
};

const PRESS_JOURNALISTS = [
  // THE PROFESSIONALS
  { id: 'professional', name: 'Pierre LeBrun', outlet: 'The Athletic', desc: 'Old-school and institutional. Wants MEASURED and FORMAL answers.' },
  { id: 'professional', name: 'Darren Dreger', outlet: 'TSN', desc: 'Mainstream and neutral. Looks for SAFE, MEASURED answers.' },
  { id: 'professional', name: 'Emily Kaplan', outlet: 'ESPN', desc: 'Highly respected national reporter. Prefers THOUGHTFUL, PROFESSIONAL answers.' },

  // THE PASSIONATE
  { id: 'passionate', name: 'Steve Dangle', outlet: 'SDPN', desc: 'Wears his heart on his sleeve. Wants FIRE and PASSION for the city.' },
  { id: 'passionate', name: 'Garnet Thorne', outlet: 'Local Beat', desc: 'Fiercely protective of the home team. Wants to see EMOTION and DRIVE.' },
  
  // THE HUMBLE
  { id: 'humble', name: 'Sarah Lindqvist', outlet: 'EuroHockey Weekly', desc: 'Values team culture and locker room harmony. Looks for TEAM-FIRST, HUMBLE responses.' },
  { id: 'humble', name: 'Dom Luszczyszyn', outlet: 'The Athletic', desc: 'Analytics heavy and realistic. Appreciates SELF-AWARENESS and HUMILITY.' },
  
  // THE COCKY
  { id: 'cocky', name: 'Larry Brooks', outlet: 'NY Post', desc: 'Looking for a controversial headline. Thrives on CONFIDENCE and ARROGANCE.' },
  { id: 'cocky', name: 'Marcus Vance', outlet: 'Puck Digest', desc: 'Hot-take radio host. Wants BOLD PREDICTIONS and COCKY soundbites.' }
];

const PRESS_QUESTIONS = [
  { q: "You've been getting a lot of attention lately. How are you handling the pressure?", answers: { professional: "I just focus on my job and trust the process.", passionate: "I feed off the energy of this city, it drives me!", humble: "It's easy when you have great teammates supporting you.", cocky: "Pressure? I was born for this spotlight." } },
  { q: "Tough loss tonight. What went wrong out there on the ice?", answers: { professional: "We need to review the tape and execute our system better.", passionate: "We didn't battle hard enough. That's unacceptable for our fans.", humble: "I need to be better. This one is on my shoulders.", cocky: "A lucky bounce for them. We're still the better team." } },
  { q: "Rumors are swirling about a divide in the locker room. Any comments?", answers: { professional: "We handle our business internally. No comment.", passionate: "We're a family! Anyone saying otherwise is a liar.", humble: "We're just focused on working hard for each other every day.", cocky: "Let them talk. Winning cures everything, and we win." } },
  { q: "How do you feel about your upcoming matchup against your rivals?", answers: { professional: "They are a well-coached team. We need to be prepared.", passionate: "It's war. We know what this game means to the city.", humble: "It'll be a tough test. We respect them a lot.", cocky: "We're going to completely dismantle them." } },
  { q: "The coach benched you in the 3rd period last game. Your thoughts?", answers: { professional: "Coach makes the decisions. I just play.", passionate: "I was furious! I want to be out there helping the team win.", humble: "He made the right call. I wasn't playing my best hockey.", cocky: "It was a mistake taking me off the ice. I'm the game changer." } },
  { q: "You've been on a cold streak offensively. Is it time to change your approach?", answers: { professional: "I'll keep working with the coaching staff and making adjustments.", passionate: "I'm incredibly frustrated. I need to battle harder in the corners.", humble: "My linemates are playing well, I just need to start finishing their passes.", cocky: "A cold streak? Please. The floodgates are going to open any second now." } },
  { q: "The fans were booing the team as you left the ice. Is that fair?", answers: { professional: "They pay good money for tickets. We need to deliver a better product.", passionate: "They have every right to be angry! We share that exact same anger.", humble: "We let them down tonight. We have to earn their support back.", cocky: "They can boo all they want. Real ones know what we're building here." } },
  { q: "Your name has been floating around in trade rumors recently. Does that affect you?", answers: { professional: "I don't control the roster. I just show up to work every day.", passionate: "I love this city! I'll fight tooth and nail to stay in this uniform.", humble: "It's a business, but I'm incredibly grateful for my time in this locker room.", cocky: "If they trade me, it'll be the biggest mistake this franchise ever makes." } },
  { q: "The league is cracking down on physical play. Do you need to change your game?", answers: { professional: "We will adapt to the standard the referees set on the ice.", passionate: "Hockey is a physical, violent game. We can't lose that edge!", humble: "I'll try to play smarter and ensure I'm not putting my team on the penalty kill.", cocky: "I play my game, my way. Let the refs try and slow me down." } },
  { q: "A young rookie is debuting for your team tonight. What advice did you give him?", answers: { professional: "Keep your shifts short, execute the system, and stay focused.", passionate: "Leave it all on the ice! You only get one first game!", humble: "We told him to just breathe. The whole locker room has his back tonight.", cocky: "I told him to just watch me and try to keep up." } },
  { q: "You took a bad penalty late in the game that cost the team. What happened?", answers: { professional: "It was a misplay on my part. I have to be more disciplined.", passionate: "I was just trying to defend my goalie! I'll never apologize for that.", humble: "I completely let the guys down. I owe the penalty kill unit an apology.", cocky: "It was a terrible call by the ref. That's a phantom penalty." } },
  { q: "Your team is riding a massive winning streak. How do you keep it going?", answers: { professional: "We take it one game at a time and don't look ahead of the schedule.", passionate: "The vibes are immaculate right now! We feel completely unstoppable!", humble: "Everyone is just buying into their roles and playing for the logo on the front.", cocky: "We're simply better than everyone else in this division right now." } },
  { q: "You're entering the final year of your contract. Are you thinking about an extension?", answers: { professional: "I leave all contract talks to my agent so I can focus on hockey.", passionate: "I want to be here for the rest of my career! Let's get it done!", humble: "I'm just blessed to be playing in this league. The rest will sort itself out.", cocky: "I'm focused on having a career year. The price is going up every game." } },
  { q: "The opposing coach called your team's style 'dirty'. Do you have a response?", answers: { professional: "We play a heavy, structured game. I don't agree with his assessment.", passionate: "If they don't like getting hit, they should go play a different sport!", humble: "We respect their team, but we're going to play hard between the whistles.", cocky: "Sounds like an excuse from a coach who knows he's about to get swept." } },
  { q: "You just broke a franchise record tonight. How does it feel?", answers: { professional: "It's an honor, but individual stats don't mean much without a win.", passionate: "This is the greatest night of my life! I love this city!", humble: "I couldn't have done it without the incredible players I've shared the ice with.", cocky: "It was only a matter of time. I plan on breaking a few more before I'm done." } }
];

const TeamLogo = ({ teamId, league, isAHL, size = "normal", className = "" }) => {
  const [imgError, setImgError] = useState(false);

  // RESET ERROR STATE WHEN CHANGING TEAMS
  useEffect(() => {
    setImgError(false);
  }, [teamId]);

  const isNHL = league === 'NHL' && !isAHL && (nhlTeams || []).some(t => t.id === teamId);  
  let team = getTeamData(teamId, league);
  const finalLogoUrl = team ? team.logo : null;

  // Standardized container sizing across components
  const containerSize = size === "small" 
    ? "w-8 h-8 sm:w-10 sm:h-10" 
    : size === "large" 
      ? "w-12 h-12 sm:w-16 sm:h-16" 
      : "w-10 h-10 sm:w-14 sm:h-14";

  if (isNHL && !imgError) {
    return (
      <div className={`relative ${containerSize} flex items-center justify-center shrink-0 overflow-visible ${className}`}>
        {/* scale-[1.28] counteracts built-in SVG viewBox padding from NHL.com */}
        <img
          src={`https://assets.nhle.com/logos/nhl/svg/${teamId}_light.svg`}
          alt={teamId}
          className="w-full h-full object-contain drop-shadow-lg scale-[1.28] transform-gpu"
          onError={(e) => { e.target.style.display = 'none'; setImgError(true); }}
        />
      </div>
    );
  }

  if (finalLogoUrl && !imgError) {
    return (
      <div className={`relative ${containerSize} flex items-center justify-center shrink-0 ${className}`}>
        {/* p-0.5 keeps tightly cropped junior logos proportionally balanced */}
        <img
          src={finalLogoUrl}
          alt={teamId}
          className="w-full h-full object-contain drop-shadow-lg p-0.5"
          onError={(e) => { e.target.style.display = 'none'; setImgError(true); }}
        />
        {isAHL && (
          <span className="absolute -bottom-1 -right-2 translate-x-1/4 bg-[#F59E0B] text-black text-[7px] sm:text-[9px] px-1 rounded-sm font-black border border-black z-10 shadow-sm leading-tight">
            AHL
          </span>
        )}
      </div>
    );
  }

  return (
    <div 
      className={`relative ${containerSize} rounded-full flex items-center justify-center font-black text-[8px] sm:text-xs border-2 sports-font shadow-lg shrink-0 text-center leading-none overflow-hidden ${className}`} 
      style={{ backgroundColor: team?.bg || '#101410', color: team?.color || '#FFF', borderColor: team?.color || '#FFF' }}
    >
      {teamId}
      {isAHL && (
        <span className="absolute -bottom-1 -right-2 translate-x-1/4 bg-[#F59E0B] text-black text-[7px] sm:text-[9px] px-1 rounded-sm font-black border border-black z-10 shadow-sm leading-tight">
          AHL
        </span>
      )}
    </div>
  );
};

const TrophySVG = ({ league, className = "w-24 h-24 sm:w-32 sm:h-32" }) => {
  // Generate a unique ID prefix so SVG gradients don't collide and turn black!
  const uid = useMemo(() => Math.random().toString(36).substring(2, 9), []);

  const silver = `url(#silver-${uid})`;
  const darkSilver = `url(#darkSilver-${uid})`;
  const wood = `url(#wood-${uid})`;
  const gold = `url(#gold-${uid})`;

  return (
    <svg viewBox="0 0 100 120" className={`transform-gpu ${className}`}>
      <defs>
        <linearGradient id={`silver-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#cbd5e1" />
          <stop offset="25%" stopColor="#f8fafc" />
          <stop offset="50%" stopColor="#94a3b8" />
          <stop offset="75%" stopColor="#f1f5f9" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
        <linearGradient id={`darkSilver-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#64748b" />
          <stop offset="50%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
        <linearGradient id={`wood-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#271001" />
          <stop offset="50%" stopColor="#5c2b07" />
          <stop offset="100%" stopColor="#271001" />
        </linearGradient>
        <linearGradient id={`gold-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#b45309" />
          <stop offset="25%" stopColor="#fde68a" />
          <stop offset="50%" stopColor="#d97706" />
          <stop offset="75%" stopColor="#fcd34d" />
          <stop offset="100%" stopColor="#92400e" />
        </linearGradient>
      </defs>

      {league === 'NHL' && (
        <g className="drop-shadow-[0_10px_20px_rgba(255,255,255,0.25)]">
          {/* THE STANLEY CUP - Iconic 5 Tiers */}
          <path d="M 22 115 L 78 115 L 75 95 L 25 95 Z" fill={silver} stroke="#475569" strokeWidth="0.5"/>
          <path d="M 25 95 L 75 95 L 72 75 L 28 75 Z" fill={silver} stroke="#475569" strokeWidth="0.5"/>
          <path d="M 28 75 L 72 75 L 67 55 L 33 55 Z" fill={silver} stroke="#475569" strokeWidth="0.5"/>
          {/* Neck */}
          <path d="M 42 55 L 58 55 L 56 35 L 44 35 Z" fill={silver} stroke="#475569" strokeWidth="0.5"/>
          {/* Main Bowl */}
          <path d="M 15 15 C 15 45 85 45 85 15 Z" fill={silver} stroke="#475569" strokeWidth="0.5"/>
          <ellipse cx="50" cy="15" rx="35" ry="6" fill={darkSilver} />
          <path d="M 15 15 C 30 5 70 5 85 15 Z" fill={silver} />
        </g>
      )}

      {league === 'AHL' && (
        <g className="drop-shadow-2xl">
          {/* THE CALDER CUP - Wide wood base, shallow bowl */}
          <path d="M 20 115 L 80 115 L 75 75 L 25 75 Z" fill={wood} stroke="#1a0a00" strokeWidth="0.5"/>
          <path d="M 35 75 L 65 75 L 60 50 L 40 50 Z" fill={silver} stroke="#475569" strokeWidth="0.5"/>
          {/* Shallow Bowl */}
          <path d="M 10 30 C 10 60 90 60 90 30 Z" fill={silver} stroke="#475569" strokeWidth="0.5"/>
          <ellipse cx="50" cy="30" rx="40" ry="7" fill={darkSilver} />
          <path d="M 10 30 C 30 20 70 20 90 30 Z" fill={silver} />
        </g>
      )}

      {['OHL', 'WHL', 'QMJHL'].includes(league) && (
        <g className="drop-shadow-2xl">
          {/* THE MEMORIAL CUP - Large distinct handles */}
          <path d="M 25 115 L 75 115 L 70 85 L 30 85 Z" fill={wood} stroke="#1a0a00" strokeWidth="0.5"/>
          <path d="M 40 85 L 60 85 L 55 50 L 45 50 Z" fill={silver} stroke="#475569" strokeWidth="0.5"/>
          {/* Handles */}
          <path d="M 35 30 C 0 30 5 70 30 65" fill="none" stroke={silver} strokeWidth="4" strokeLinecap="round"/>
          <path d="M 65 30 C 100 30 95 70 70 65" fill="none" stroke={silver} strokeWidth="4" strokeLinecap="round"/>
          {/* Deep Bowl */}
          <path d="M 30 20 C 30 65 70 65 70 20 Z" fill={silver} stroke="#475569" strokeWidth="0.5"/>
          <ellipse cx="50" cy="20" rx="20" ry="5" fill={darkSilver} />
          <path d="M 30 20 C 40 10 60 10 70 20 Z" fill={silver} />
        </g>
      )}

      {!['NHL', 'AHL', 'OHL', 'WHL', 'QMJHL'].includes(league) && (
        <g className="drop-shadow-[0_0_20px_rgba(245,158,11,0.3)]">
          {/* GENERIC GOLD CUP (NCAA, Europe) */}
          <path d="M 25 115 L 75 115 L 70 95 L 30 95 Z" fill={wood} stroke="#1a0a00" strokeWidth="0.5"/>
          <path d="M 42 95 L 58 95 L 54 60 L 46 60 Z" fill={gold} stroke="#78350f" strokeWidth="0.5"/>
          {/* Handles */}
          <path d="M 25 35 C -5 35 10 75 40 70" fill="none" stroke={gold} strokeWidth="4" strokeLinecap="round"/>
          <path d="M 75 35 C 105 35 90 75 60 70" fill="none" stroke={gold} strokeWidth="4" strokeLinecap="round"/>
          {/* Bowl */}
          <path d="M 20 25 C 20 80 80 80 80 25 Z" fill={gold} stroke="#78350f" strokeWidth="0.5"/>
          <ellipse cx="50" cy="25" rx="30" ry="7" fill="#78350f" />
          <path d="M 20 25 C 30 15 70 15 80 25 Z" fill={gold} />
        </g>
      )}
    </svg>
  );
};const TrophyImage = ({ league, className = "w-24 h-24 sm:w-32 sm:h-32" }) => {
  const [imgError, setImgError] = useState(false);

  let src = '';
  switch (league) {
    case 'NHL':
      // The Stanley Cup
      src = 'https://upload.wikimedia.org/wikipedia/commons/e/e4/Stanley_Cup_no_background.png';
      break;
    case 'AHL':
      // The Calder Cup
      src = 'https://upload.wikimedia.org/wikipedia/en/thumb/c/cd/Calder_Cup.png/220px-Calder_Cup.png'; 
      break;
    case 'OHL':
    case 'WHL':
    case 'QMJHL':
      // The Memorial Cup
      src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Memorial_Cup_Trophy.svg/250px-Memorial_Cup_Trophy.svg.png';
      break;
    default:
      // Generic Championship Cup (NCAA, Europe)
      src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Golden_Cup_with_star.svg/250px-Golden_Cup_with_star.svg.png';
      break;
  }

  // If the image link ever breaks, fallback to a native emoji so the game doesn't crash
  if (imgError) {
    return (
      <div className={`flex items-center justify-center text-6xl sm:text-7xl drop-shadow-2xl ${className}`}>
        🏆
      </div>
    );
  }

  return (
    <img 
      src={src} 
      alt={`${league} Championship Trophy`} 
      className={`object-contain drop-shadow-[0_10px_20px_rgba(255,255,255,0.25)] ${className}`}
      onError={() => setImgError(true)}
    />
  );
};

const Dashboard = ({ player, tier, statChanges, lgKey, isJunior, isAHL, onOpenShop, hasDemandedTrade, setHasDemandedTrade }) => {
  const safeNationalities = nationalities || [];
  const currentYear = 2026 + (player.stats?.seasonsPlayed || 0);
  const nextYear = currentYear + 1;

  const isGoalie = player.pos === 'G';
  const teamObj = getTeamData(player.team, player.league);
  
  const teamBg = player.ovr >= 90 ? '#F59E0B' : (teamObj?.bg || '#101410');
  
  let frameColor = '#8a95a1'; 
  if (player.ovr >= 75) frameColor = '#c98a4b'; 
  if (player.ovr >= 82) frameColor = '#e2e8f0'; 
  if (player.ovr >= 90) frameColor = '#F59E0B'; 

  // --- NEW: INTERNATIONAL STATUS LOGIC ---
  const getIntlStatus = () => {
    if (player.age <= 19) {
      if (player.ovr >= 68) return { label: 'U20 STAR', color: 'text-[#22E748] bg-[#22E748]/10 border-[#22E748]/30' };
      if (player.ovr >= 60) return { label: 'U20 SQUAD', color: 'text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/30' };
      if (player.ovr >= 55) return { label: 'U20 BUBBLE', color: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30' };
      return { label: 'U20 RADAR', color: 'text-slate-400 bg-slate-800/50 border-[rgba(255,255,255,0.08)]' };
    } else {
      if (player.ovr >= 88) return { label: "NAT'L ICON", color: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30' };
      if (player.ovr >= 80) return { label: "NAT'L SQUAD", color: 'text-[#22E748] bg-[#22E748]/10 border-[#22E748]/30' };
      if (player.ovr >= 75) return { label: "NAT'L BUBBLE", color: 'text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/30' };
      return { label: 'DOMESTIC', color: 'text-slate-400 bg-slate-800/50 border-[rgba(255,255,255,0.08)]' };
    }
  };
  const intlStatus = getIntlStatus();

  const getBarColor = (idol) => {
    if (idol < 300) return 'linear-gradient(90deg, color-mix(in srgb, #64748b 55%, #1e293b), #94a3b8)'; // Slate
    if (idol < 600) return 'linear-gradient(90deg, color-mix(in srgb, #3b82f6 55%, #1e3a8a), #60a5fa)'; // Blue
    if (idol < 1000) return 'linear-gradient(90deg, color-mix(in srgb, #F59E0B 55%, #78350f), #fbbf24)'; // Amber
    return 'linear-gradient(90deg, color-mix(in srgb, #22E748 55%, #14532d), #4ade80)'; // Green
  };

  return (
    <div className="w-full max-w-[420px] md:max-w-2xl mx-auto mb-4 z-10 relative drop-shadow-2xl">
      <div 
        className="border border-[rgba(255,255,255,0.08)] border-t-0 rounded-[14px] overflow-hidden relative p-4 md:p-6 sm:p-8"
        style={{ background: `linear-gradient(180deg, color-mix(in srgb, ${teamBg} 12%, #12161c) 0%, #0a0d0a 38%)` }}
      >
        <div className="absolute top-0 left-0 right-0 h-[3px] opacity-90 z-0" style={{ background: `linear-gradient(90deg, transparent, ${frameColor}, transparent)` }}></div>
        {player.ovr >= 90 && <div className="bluechip-foil-overlay"></div>}

        <div className="relative z-10 flex flex-col gap-6 sm:gap-8 h-full w-full">

          {/* ========================================== */}
          {/* TOP SECTION: PLAYER INFO & IDOLATRY        */}
          {/* ========================================== */}
          <div className="flex flex-col w-full min-w-0 justify-center">

            <div className="flex items-start justify-between gap-3">
              
              {/* OVR, Logo & Text Cluster */}
              <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                <div className="flex flex-col items-center shrink-0 mt-1">
                 <span className="number-font text-6xl sm:text-7xl text-white">{player.ovr}</span>
                  <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">OVR</p>
                </div>

                <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 flex items-center justify-center mt-1">
                  <TeamLogo teamId={player.team} league={player.league} isAHL={isAHL} />
                </div>

                {/* TEXT CONTAINER (No truncate, full wrap enabled) */}
                <div className="flex flex-col flex-1 min-w-0 justify-center">
                  <p className="text-xl md:text-2xl lg:text-3xl font-black sports-font leading-none text-white uppercase flex flex-wrap items-center gap-1.5">
                    <img src={safeNationalities.find(n => n.id === player.nat)?.img} alt={player.nat} className="h-3.5 md:h-4 w-[21px] md:w-[26px] shrink-0 rounded-[2px] object-cover border border-slate-700 shadow-sm" />
                    <span>{player.name}</span>
                  </p>
                  
                  <p className="text-[10px] md:text-[11px] font-black uppercase leading-snug tracking-wide text-[#3b82f6] mt-1.5 flex flex-wrap items-center gap-1">
                    <span>{getFullTeamName(player.team, player.league)}</span>
                    <span className="text-slate-400 font-sans">{currentYear} / {nextYear}</span>
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <p className="text-[9px] md:text-[10px] font-bold uppercase leading-none tracking-wide text-slate-500 whitespace-nowrap">
                      {player.age} YRS OLD · {player.pos} · {getDisplayDeployment(player.ovr, player.pos, player.league)} · {player.stats[lgKey]?.games || 0} GP
                    </p>
                    <span className={`text-[7px] md:text-[8px] font-black px-1.5 py-0.5 rounded border uppercase tracking-widest leading-none ${intlStatus.color}`}>
                      {intlStatus.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS (Pushed safely to the right) */}
              <div className="flex flex-col items-end gap-1.5 shrink-0 mt-1">
                {!isJunior && player.league !== 'NCAA' && (
                  <button type="button" title="Shop" onClick={onOpenShop} className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border text-[#22E748] transition border-[#22E748]/60 bg-[#22E748]/10 shadow-[0_0_0_1px_rgba(34,231,75,0.15)] hover:bg-[#22E748]/20 cursor-pointer">
                    <span className="text-[10px] leading-none">🛒</span>
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest sports-font leading-none mt-0.5">SHOP</span>
                  </button>
                )}

                {player.league === 'NHL' && player.stats.seasonsPlayed > 0 && (
                  <button onClick={() => setHasDemandedTrade(true)} disabled={hasDemandedTrade} title="Request Trade" className={`flex items-center px-2.5 py-1.5 rounded-md border transition-colors cursor-pointer ${hasDemandedTrade ? 'border-[#ef4444]/40 bg-[#ef4444]/10 text-[#ef4444]' : 'border-[rgba(255,255,255,0.15)] bg-[#101410] text-slate-300 hover:border-[#ef4444]/70 hover:bg-[#ef4444]/25 hover:text-[#ef4444]'}`}>
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest sports-font leading-none mt-0.5">
                      {hasDemandedTrade ? 'PENDING' : 'REQ TRADE'}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* IDOLATRY BAR */}
            <div className="mt-5 md:mt-7 w-full space-y-1.5">
              <div className="flex items-center justify-between text-[11px] md:text-xs font-bold uppercase tracking-wide">
                <span className="text-slate-400">Idolatry</span>
                <span className="text-slate-400"> {tier.label} · {Math.floor((player.idolatry / 1000) * 100)}/100</span>
              </div>
              <div className="relative w-full overflow-hidden rounded-full bg-[#0a0d0a] border border-[rgba(255,255,255,0.05)] h-2.5 md:h-3">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (player.idolatry / 1000) * 100)}%`, background: getBarColor(player.idolatry) }}></div>
                <span className="absolute bottom-0 top-0 w-px bg-white/10" style={{ left: '10%' }}></span>
                <span className="absolute bottom-0 top-0 w-px bg-white/10" style={{ left: '30%' }}></span>
                <span className="absolute bottom-0 top-0 w-px bg-white/10" style={{ left: '60%' }}></span>
              </div>
              <div className="relative h-3.5 md:h-4">
                <span className={`absolute top-0 -translate-x-1/2 text-[11px] md:text-xs leading-none transition-opacity ${player.idolatry >= 100 ? 'opacity-100' : 'opacity-30 grayscale'}`} style={{ left: '10%' }} title="Known">👀</span>
                <span className={`absolute top-0 -translate-x-1/2 text-[11px] md:text-xs leading-none transition-opacity ${player.idolatry >= 300 ? 'opacity-100' : 'opacity-30 grayscale'}`} style={{ left: '30%' }} title="Loved">💙</span>
                <span className={`absolute top-0 -translate-x-1/2 text-[11px] md:text-xs leading-none transition-opacity ${player.idolatry >= 600 ? 'opacity-100' : 'opacity-30 grayscale'}`} style={{ left: '60%' }} title="Icon">⭐</span>
                <span className={`absolute top-0 -translate-x-1/2 text-[11px] md:text-xs leading-none transition-opacity ${player.idolatry >= 1000 ? 'opacity-100' : 'opacity-30 grayscale'}`} style={{ left: '100%' }} title="Legend">🗽</span>
              </div>
              <p className="text-[10px] md:text-[11px] font-bold leading-none text-slate-400 mt-1.5 md:mt-2">
                {tier.req > 0 ? `You're ${tier.req} pts short of ${tier.nextLabel}` : <span className="text-[#F59E0B]">Max Icon Status 🏆</span>}
              </p>
            </div>
          </div>

          {/* ========================================== */}
          {/* BOTTOM SECTION: STAT GRIDS                   */}
          {/* ========================================== */}
          <div className="flex flex-col gap-2 md:gap-3 w-full shrink-0 justify-center">
            
            {/* 1. STATS ROW */}
            <div className="grid grid-cols-4 bg-[#101410] border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden divide-x divide-[rgba(255,255,255,0.05)] text-center shadow-lg">
              <div className="px-1 py-1.5 md:py-2 bg-gradient-to-b from-[rgba(255,255,255,0.03)] to-transparent">
                <p className="text-2xl md:text-3xl lg:text-4xl font-black text-[#22E748] number-font leading-none">{isGoalie ? ((player.stats[lgKey]?.shots > 0 && player.stats[lgKey]?.saves !== undefined) ? (player.stats[lgKey].saves / player.stats[lgKey].shots).toFixed(3).replace('0.', '.') : '.000') : (player.stats[lgKey]?.goals || 0)}</p>
                <p className="mt-0.5 md:mt-1 truncate text-[9px] md:text-[10px] font-black uppercase tracking-wide text-slate-400">{isGoalie ? 'SV%' : 'Goals'}</p>
              </div>
              <div className="px-1 py-1.5 md:py-2">
                <p className="text-2xl md:text-3xl lg:text-4xl font-black text-white number-font leading-none">{isGoalie ? ((player.stats[lgKey]?.games > 0 && player.stats[lgKey]?.shots !== undefined) ? ((player.stats[lgKey].shots - player.stats[lgKey].saves) / player.stats[lgKey].games).toFixed(2) : '0.00') : (player.stats[lgKey]?.assists || 0)}</p>
                <p className="mt-0.5 md:mt-1 truncate text-[9px] md:text-[10px] font-black uppercase tracking-wide text-slate-400">{isGoalie ? 'GAA' : 'Assists'}</p>
              </div>
              <div className="px-1 py-1.5 md:py-2">
                <p className="text-2xl md:text-3xl lg:text-4xl font-black text-white number-font leading-none">{isGoalie ? (player.stats[lgKey]?.shutouts || 0) : (player.stats[lgKey]?.plusMinus > 0 ? `+${player.stats[lgKey].plusMinus}` : (player.stats[lgKey]?.plusMinus || 0))}</p>
                <p className="mt-0.5 md:mt-1 truncate text-[9px] md:text-[10px] font-black uppercase tracking-wide text-slate-400">{isGoalie ? 'SHO' : '+/-'}</p>
              </div>
              <div className="px-1 py-1.5 md:py-2">
                <p className="text-2xl md:text-3xl lg:text-4xl font-black text-[#F59E0B] number-font leading-none">{player.stats?.titles || 0}</p>
                <p className="mt-0.5 md:mt-1 truncate text-[9px] md:text-[10px] font-black uppercase tracking-wide text-slate-400">Trophies</p>
              </div>
            </div>

            {/* 2. ATTRIBUTES ROW */}
            <div className="grid grid-cols-5 bg-[#101410] border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden divide-x divide-[rgba(255,255,255,0.05)] text-center shadow-lg">
              {[
                { label: isGoalie ? 'Reflexes' : 'Shooting', key: 'shooting', val: getActiveStat(player, 'shooting') },
                { label: isGoalie ? 'Position' : 'Skating', key: 'skating', val: getActiveStat(player, 'skating') },
                { label: isGoalie ? 'Agility' : 'Power', key: 'physicality', val: getActiveStat(player, 'physicality') },
                { label: 'Hockey IQ', key: 'hockeyIQ', val: getActiveStat(player, 'hockeyIQ') },
                { label: 'Stamina', key: 'stamina', val: getActiveStat(player, 'stamina') }
              ].map(attr => {
                const change = statChanges ? statChanges[attr.key] : 0;
                const isUpgraded = change > 0;
                const isDowngraded = change < 0;
                return (
                  <div key={attr.label} className={`relative px-0.5 py-1.5 md:py-2 transition ${isUpgraded ? 'bg-[#22E748]/10 shadow-[inset_0_0_8px_rgba(34,231,72,0.15)]' : isDowngraded ? 'bg-[#ef4444]/10 shadow-[inset_0_0_8px_rgba(239,68,68,0.15)]' : ''}`}>
                    {isUpgraded && <span className="absolute top-0.5 right-0.5 text-[#22E748] text-[7px] md:text-[9px] font-black">▲</span>}
                    {isDowngraded && <span className="absolute top-0.5 right-0.5 text-[#ef4444] text-[7px] md:text-[9px] font-black">▼</span>}
                    <p className={`text-2xl md:text-3xl lg:text-4xl font-black number-font leading-none ${isUpgraded ? 'text-[#22E748]' : isDowngraded ? 'text-[#ef4444]' : 'text-white'}`}>{attr.val}</p>
                    <p className="truncate px-0.5 mt-0.5 md:mt-1 text-[7px] md:text-[9px] font-black uppercase tracking-normal text-slate-400">{attr.label}</p>
                  </div>
                );
              })}
            </div>

            {/* 3. FINANCIALS ROW */}
            <div className="grid grid-cols-3 bg-[#101410] border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden divide-x divide-[rgba(255,255,255,0.05)] text-center shadow-lg">
              <div className="flex flex-col justify-center py-1.5 md:py-2">
                <p className="px-1 text-2xl md:text-3xl lg:text-4xl font-black number-font leading-none text-sky-300">{formatMoney(player.stats?.value || 0)}</p>
                <p className="mt-0.5 md:mt-1 text-[8px] md:text-[10px] font-black uppercase tracking-wide text-slate-400">Value</p>
              </div>
              <div className="flex flex-col justify-center bg-amber-400/10 py-1.5 md:py-2">
                <p className="px-1 text-2xl md:text-3xl lg:text-4xl font-black number-font leading-none text-amber-300">{formatMoney(player.stats?.earnings || 0)}</p>
                <p className="mt-0.5 md:mt-1 text-[8px] md:text-[10px] font-black uppercase tracking-wide text-slate-400">Earnings</p>
              </div>
              <div className="flex flex-col justify-center py-1.5 md:py-2">
                <p className="px-1 text-2xl md:text-3xl lg:text-4xl font-black number-font leading-none text-[#22E748]">{player.relationships?.coach || 50}%</p>
                <p className="mt-0.5 md:mt-1 text-[8px] md:text-[10px] font-black uppercase tracking-wide text-slate-400">Coach Trust</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

// =====================================================================
// INTERACTIVE MINIGAME COMPONENTS
// =====================================================================

const ShootoutGame = ({ player, onComplete }) => {
  const [activeZone, setActiveZone] = useState(null);
  const [timeLeft, setTimeLeft] = useState(5000);

  useEffect(() => {
    // Higher shooting stat = weak spot stays open longer. 
    const speed = Math.max(400, 1000 - (player.shooting * 4)); 
    const zoneInterval = setInterval(() => {
      setActiveZone(Math.floor(Math.random() * 5));
    }, speed);

    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 100) {
          clearInterval(zoneInterval);
          clearInterval(timer);
          onComplete(false); // Time ran out
          return 0;
        }
        return t - 100;
      });
    }, 100);

    return () => { clearInterval(zoneInterval); clearInterval(timer); };
  }, [player, onComplete]);

  const zones = [
    { id: 0, label: 'TOP LEFT', cls: 'top-4 left-4 w-16 h-16 sm:w-20 sm:h-20' },
    { id: 1, label: 'TOP RIGHT', cls: 'top-4 right-4 w-16 h-16 sm:w-20 sm:h-20' },
    { id: 2, label: 'FIVE HOLE', cls: 'bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 sm:w-20 sm:h-20' },
    { id: 3, label: 'LOW GLOVE', cls: 'bottom-16 left-4 w-16 h-16 sm:w-20 sm:h-20' },
    { id: 4, label: 'LOW BLOCKER', cls: 'bottom-16 right-4 w-16 h-16 sm:w-20 sm:h-20' }
  ];

  return (
    <div className="w-full max-w-md mx-auto aspect-[4/3] bg-[#e2e8f0] border-4 border-[#ef4444] rounded-lg relative overflow-hidden flex items-center justify-center shadow-inner">
      <div className="absolute inset-0 border-8 border-[#ef4444] rounded opacity-50 pointer-events-none"></div>
      {/* Goalie Graphic Placeholder */}
      <div className="w-3/5 h-4/5 bg-slate-800 rounded-t-[40%] absolute bottom-0 opacity-80 flex flex-col items-center justify-center">
         <span className="text-5xl">🥅</span>
      </div>
      
      {zones.map(z => (
        <button
          key={z.id}
          onClick={() => { if (activeZone === z.id) onComplete(true); }}
          className={`absolute rounded-full border-4 transition-colors font-black sports-font text-[10px] sm:text-xs leading-none z-10 ${
            activeZone === z.id 
              ? 'bg-[#22E748]/90 border-[#22E748] text-white shadow-[0_0_20px_#22E748] scale-110 cursor-pointer animate-pulse' 
              : 'bg-transparent border-[rgba(0,0,0,0.1)] text-transparent pointer-events-none'
          } ${z.cls}`}
        >
          {activeZone === z.id ? 'SHOOT' : ''}
        </button>
      ))}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-1 rounded-full font-black number-font text-xl shadow-lg border border-slate-700">
         {(timeLeft / 1000).toFixed(1)}s
      </div>
    </div>
  );
};

const FaceoffGame = ({ player, onComplete }) => {
   const [status, setStatus] = useState('waiting');
   const [msg, setMsg] = useState('WAIT FOR GREEN...');
   const doneRef = useRef(false);
   const startTimeRef = useRef(null);

   // Added a delay so the player can actually read their reaction time before the screen advances!
   const finish = useCallback((win, delay = 1500) => {
     if (doneRef.current) return;
     doneRef.current = true;
     setTimeout(() => onComplete(win), delay);
   }, [onComplete]);

   useEffect(() => {
      const delay = 2000 + Math.random() * 3000; // Random drop between 2-5 seconds
      let innerTo = null;
      const to = setTimeout(() => {
         setStatus('ready');
         setMsg('CLICK NOW!');
         startTimeRef.current = Date.now(); // Start the timer exactly when it turns green

         // Higher IQ gives you a much larger reaction window before AI wins
         const aiTime = Math.max(250, 600 - (player.hockeyIQ * 2));
         innerTo = setTimeout(() => {
           setStatus(prev => {
             if (prev === 'ready') {
               setMsg(`LOST! AI: ${aiTime}ms`); // Tell the player how fast the AI was
               finish(false); 
               return 'done';
             }
             return prev;
           })
         }, aiTime);
      }, delay);

      return () => { clearTimeout(to); if (innerTo) clearTimeout(innerTo); };
   }, [player, finish]);

   const handleClick = () => {
     if (status === 'waiting') {
       setStatus('done');
       setMsg('JUMPED EARLY!');
       finish(false);
     } else if (status === 'ready') {
       const reactionTime = Date.now() - startTimeRef.current;
       setStatus('done');
       setMsg(`WON: ${reactionTime}ms!`);
       finish(true);
     }
   };

   return (
     <div className="w-full max-w-sm mx-auto aspect-square bg-[#e2e8f0] rounded-full relative flex items-center justify-center border-4 border-[#3b82f6] shadow-xl">
       <div className="absolute inset-4 rounded-full border-4 border-[#3b82f6] opacity-30"></div>
       <button 
         onClick={handleClick}
         className={`w-3/5 h-3/5 rounded-full flex flex-col items-center justify-center font-black sports-font text-2xl sm:text-3xl transition-colors border-8 shadow-2xl ${
           status === 'waiting' ? 'bg-[#ef4444] border-[#b91c1c] text-white cursor-pointer' : 
           status === 'ready' ? 'bg-[#22E748] border-[#16a34a] text-white cursor-pointer scale-105' :
           status === 'done' && msg.includes('WON') ? 'bg-[#22E748] border-[#16a34a] text-white' :
           'bg-slate-700 border-slate-900 text-slate-400 pointer-events-none'
         }`}
       >
         <span className="text-center">{msg}</span>
       </button>
     </div>
   );
};

const CreaseGame = ({ player, onComplete }) => {
   const [moles, setMoles] = useState([]);
   const [score, setScore] = useState(0);
   const [misses, setMisses] = useState(0);
   const doneRef = useRef(false);
   const timeoutsRef = useRef(new Set());

   const finish = useCallback((win) => {
     if (doneRef.current) return;
     doneRef.current = true;
     onComplete(win);
   }, [onComplete]);

   useEffect(() => {
     if (score >= 5) { finish(true); return; }
     if (misses >= 3) { finish(false); return; }

     // Higher IQ = Pucks spawn slightly slower
     const spawnRate = Math.max(450, 1000 - (player.hockeyIQ * 4));
     // Higher Agility/Reflexes = Pucks stay on screen longer
     const lifetime = Math.max(600, 1300 - (player.physicality * 3));

     const timeouts = timeoutsRef.current;
     const interval = setInterval(() => {
        if (doneRef.current) return;
        const id = Math.random().toString();
        const pos = Math.floor(Math.random() * 9);
        setMoles(m => [...m, { id, pos }]);

        const to = setTimeout(() => {
           timeouts.delete(to);
           if (doneRef.current) return;
           setMoles(currentMoles => {
              const moleStillThere = currentMoles.find(x => x.id === id);
              if (moleStillThere) {
                 setMisses(prev => prev + 1);
                 return currentMoles.filter(x => x.id !== id);
              }
              return currentMoles;
           });
        }, lifetime);
        timeouts.add(to);
     }, spawnRate);

     return () => {
       clearInterval(interval);
       timeouts.forEach(clearTimeout);
       timeouts.clear();
     };
   }, [score, misses, player, finish]);

   return (
     <div className="w-full max-w-sm mx-auto">
       <div className="flex justify-between mb-4 font-black sports-font text-xl sm:text-2xl px-2">
         <span className="text-[#22E748]">SAVES: {score}/5</span>
         <span className="text-[#ef4444]">GOALS: {misses}/3</span>
       </div>
       <div className="grid grid-cols-3 gap-2 sm:gap-3 bg-slate-800 p-3 sm:p-4 rounded-xl border border-slate-700 aspect-square shadow-xl">
         {[0,1,2,3,4,5,6,7,8].map(i => {
           const mole = moles.find(m => m.pos === i);
           return (
             <div key={i} className="bg-slate-900 rounded-lg flex items-center justify-center relative overflow-hidden border border-slate-800">
               {mole && (
                 <button onClick={() => { setMoles(m => m.filter(x => x.id !== mole.id)); setScore(s => s + 1); }}
                   className="absolute inset-2 bg-black border-4 border-[#ef4444] rounded-full animate-ping cursor-pointer hover:bg-[#ef4444]"
                 ></button>
               )}
             </div>
           );
         })}
       </div>
     </div>
   );
};

const FilmRoomGame = ({ player, onComplete }) => {
   const [phase, setPhase] = useState('memorize');
   const [target, setTarget] = useState([]);
   const [options, setOptions] = useState([]);

   useEffect(() => {
      const generatePattern = () => {
         const p = [];
         while(p.length < 4) {
           const r = Math.floor(Math.random() * 9);
           if(!p.includes(r)) p.push(r);
         }
         return p.sort();
      };

      const correct = generatePattern();
      setTarget(correct);

      const opts = [correct];
      while(opts.length < 4) {
        const wrong = generatePattern();
        if (!opts.find(o => o.join(',') === wrong.join(','))) opts.push(wrong);
      }
      setOptions(opts.sort(() => 0.5 - Math.random()));

      // Higher IQ = more time to memorize the board
      const showTime = Math.min(5000, 1500 + (player.hockeyIQ * 30));
      const t = setTimeout(() => { setPhase('recall'); }, showTime);

      return () => clearTimeout(t);
   }, [player]);

   const Grid = ({ pattern, onClick, small }) => (
     <div onClick={onClick} className={`grid grid-cols-3 gap-1 p-2 bg-[#166534] border-4 border-[#14532d] rounded-lg aspect-square shadow-inner ${onClick ? 'cursor-pointer hover:border-[#F59E0B] transition-colors' : ''}`}>
       {[0,1,2,3,4,5,6,7,8].map(i => (
         <div key={i} className={`flex items-center justify-center ${small ? 'text-xl' : 'text-3xl'} font-black ${pattern.includes(i) ? 'text-white' : 'text-transparent'}`}>
           {pattern.includes(i) ? 'X' : '.'}
         </div>
       ))}
     </div>
   );

   if (phase === 'memorize') {
     return (
       <div className="w-full max-w-sm mx-auto text-center">
         <p className="text-[#F59E0B] font-black sports-font text-2xl sm:text-3xl mb-6 animate-pulse">MEMORIZE THE PLAY!</p>
         <div className="w-48 h-48 sm:w-64 sm:h-64 mx-auto shadow-2xl">
           <Grid pattern={target} />
         </div>
       </div>
     );
   }

   return (
     <div className="w-full max-w-lg mx-auto text-center">
       <p className="text-[#3b82f6] font-black sports-font text-xl sm:text-3xl mb-6 uppercase">Which play was it?</p>
       <div className="grid grid-cols-2 gap-4 sm:gap-6">
         {options.map((opt, i) => (
           <Grid key={i} pattern={opt} small onClick={() => onComplete(opt.join(',') === target.join(','))} />
         ))}
       </div>
     </div>
   );
};

const DeflectionGame = ({ player, onComplete }) => {
  const [position, setPosition] = useState(0);
  const [direction, setDirection] = useState(1);
  const [status, setStatus] = useState('playing'); // playing, won, lost
  const doneRef = useRef(false);
  const resultToRef = useRef(null);

  const finish = useCallback((win) => {
    if (doneRef.current) return;
    doneRef.current = true;
    onComplete(win);
  }, [onComplete]);

  useEffect(() => {
    if (status !== 'playing') return;
    // Higher Hand-Eye/Shooting slows the bar down slightly to make it easier
    const speed = Math.max(2, 6 - (player.shooting * 0.05));

    const ticker = setInterval(() => {
      setPosition(prev => {
        let next = prev + (direction * speed);
        if (next >= 100) { next = 100; setDirection(-1); }
        if (next <= 0) { next = 0; setDirection(1); }
        return next;
      });
    }, 20);
    return () => clearInterval(ticker);
  }, [direction, status, player]);

  // Clean up the pending result-delay on unmount
  useEffect(() => () => { if (resultToRef.current) clearTimeout(resultToRef.current); }, []);

  const handleDeflect = () => {
    if (status !== 'playing') return;
    // Sweet spot is between 40% and 60%
    if (position >= 40 && position <= 60) {
      setStatus('won');
      resultToRef.current = setTimeout(() => finish(true), 1000);
    } else {
      setStatus('lost');
      resultToRef.current = setTimeout(() => finish(false), 1000);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto text-center">
      <div className="h-12 w-full bg-slate-800 rounded-full border-2 border-slate-600 relative overflow-hidden mb-8 shadow-inner">
        {/* The Sweet Spot */}
        <div className="absolute top-0 bottom-0 left-[40%] right-[40%] bg-[#22E748]/30 border-x-2 border-[#22E748]"></div>
        {/* The Puck */}
        <div 
          className={`absolute top-1 bottom-1 w-10 bg-black rounded-full shadow-lg border-2 transition-colors ${status === 'won' ? 'border-[#22E748] bg-[#22E748]' : status === 'lost' ? 'border-[#ef4444] bg-[#ef4444]' : 'border-slate-400'}`}
          style={{ left: `calc(${position}% - 20px)` }}
        ></div>
      </div>
      <button 
        onClick={handleDeflect}
        className={`w-full py-4 rounded-xl font-black sports-font text-2xl uppercase tracking-widest transition-transform active:scale-95 ${status === 'playing' ? 'bg-[#3b82f6] text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : status === 'won' ? 'bg-[#22E748] text-white' : 'bg-[#ef4444] text-white'}`}
      >
        {status === 'playing' ? 'TIP IT!' : status === 'won' ? 'GOAL!' : 'MISSED!'}
      </button>
    </div>
  );
};

const ShotBlockGame = ({ player, onComplete }) => {
  const [activeLane, setActiveLane] = useState(null);
  const [blocks, setBlocks] = useState(0);

  useEffect(() => {
    if (blocks >= 3) {
      onComplete(true);
      return;
    }
    
    // Pick a random lane after a short delay
    const delay = setTimeout(() => {
      setActiveLane(Math.floor(Math.random() * 3));
      
      // If they don't click the lane in time, they fail
      // Higher Physicality gives them more time to react
      const reactionWindow = Math.min(1500, 800 + (player.physicality * 10));
      const failTimer = setTimeout(() => {
        onComplete(false);
      }, reactionWindow);
      
      // Cleanup inner timer if they click in time
      return () => clearTimeout(failTimer);
    }, 1000);

    return () => clearTimeout(delay);
  }, [blocks, player, onComplete]);

  const handleBlock = (lane) => {
    if (lane === activeLane) {
      setActiveLane(null); // Reset lane
      setBlocks(b => b + 1);
    } else {
      onComplete(false); // Dived into the wrong lane!
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <p className="text-center font-black sports-font text-xl text-[#F59E0B] mb-4">BLOCKS: {blocks} / 3</p>
      <div className="grid grid-cols-3 gap-2 sm:gap-4 h-64">
        {[0, 1, 2].map(lane => (
          <button 
            key={lane}
            onClick={() => handleBlock(lane)}
            className="relative bg-slate-800 rounded-lg border-2 border-slate-700 flex flex-col items-center justify-end pb-4 hover:bg-slate-700 transition-colors"
          >
            {activeLane === lane && (
              <div className="absolute top-4 w-12 h-12 bg-[#ef4444] rounded-full animate-pulse shadow-[0_0_20px_#ef4444] flex items-center justify-center">
                <span className="text-white text-xs font-bold">SHOT!</span>
              </div>
            )}
            <span className="text-4xl">🧍</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const BreakawayGame = ({ player, onComplete }) => {
  const [phase, setPhase] = useState('setup'); // setup, waiting, deking, result
  const [direction, setDirection] = useState(null);
  const [strategy, setStrategy] = useState(null); // 'cheatLeft', 'cheatRight', 'hold'
  const [msg, setMsg] = useState('');
  const doneRef = useRef(false);

  const finish = useCallback((win, delay = 1200) => {
    if (doneRef.current) return;
    doneRef.current = true;
    setTimeout(() => onComplete(win), delay);
  }, [onComplete]);

  useEffect(() => {
    if (phase !== 'waiting') return;

    // Skater approaches for 1-2.5 seconds
    const delay = 1000 + (Math.random() * 1500);
    let innerTo = null;

    const to = setTimeout(() => {
      // Skater makes their move
      const actualDir = Math.random() > 0.5 ? 'left' : 'right';
      setDirection(actualDir);

      if (strategy === 'cheatLeft' || strategy === 'cheatRight') {
        // GAMBLE RESOLUTION: Instant win or loss based on your guess
        setPhase('result');
        const guessedRight = (strategy === 'cheatLeft' && actualDir === 'left') || (strategy === 'cheatRight' && actualDir === 'right');
        setMsg(guessedRight ? 'PERFECT READ!' : 'BIT ON THE FAKE!');
        finish(guessedRight);
      } else {
        // HOLD GROUND RESOLUTION: Quick-time reflex event
        setPhase('deking');
        
        // Reaction window relies on Hockey IQ and Reflexes, but is tighter since you waited
        const window = Math.min(900, 450 + (player.hockeyIQ * 5));
        innerTo = setTimeout(() => {
          setPhase(prev => {
            if (prev === 'deking') {
              setMsg('TOO SLOW!');
              finish(false);
              return 'result';
            }
            return prev;
          });
        }, window);
      }
    }, delay);

    return () => { clearTimeout(to); if (innerTo) clearTimeout(innerTo); };
  }, [phase, strategy, player, finish]);

  const startPlay = (strat) => {
    setStrategy(strat);
    setPhase('waiting');
  };

  const handlePad = (side) => {
    if (phase !== 'deking') return;
    setPhase('result');
    if (side === direction) {
      setMsg('GREAT SAVE!');
      finish(true);
    } else {
      setMsg('BEAT CLEAN!');
      finish(false);
    }
  };

  if (phase === 'setup') {
    return (
      <div className="w-full max-w-sm mx-auto text-center animate-fade-in">
        <h3 className="text-xl font-black text-white sports-font mb-4 tracking-wider">CHOOSE YOUR STRATEGY</h3>
        <div className="flex flex-col gap-3">
          <button onClick={() => startPlay('cheatLeft')} className="bg-[#101410] border-2 border-[#F59E0B] text-[#F59E0B] hover:bg-[#F59E0B]/10 p-3.5 rounded-xl font-bold uppercase tracking-widest transition-colors cursor-pointer shadow-lg hover:-translate-y-0.5">
            Gamble: Cheat Left (50/50)
          </button>
          <button onClick={() => startPlay('hold')} className="bg-[#101410] border-2 border-[#3b82f6] text-[#3b82f6] hover:bg-[#3b82f6]/10 p-3.5 rounded-xl font-bold uppercase tracking-widest transition-colors cursor-pointer shadow-lg hover:-translate-y-0.5">
            Safe: Hold Ground & React
          </button>
          <button onClick={() => startPlay('cheatRight')} className="bg-[#101410] border-2 border-[#F59E0B] text-[#F59E0B] hover:bg-[#F59E0B]/10 p-3.5 rounded-xl font-bold uppercase tracking-widest transition-colors cursor-pointer shadow-lg hover:-translate-y-0.5">
            Gamble: Cheat Right (50/50)
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-6 px-2 italic font-sans leading-relaxed">
          Gambling removes the need for reflexes but leaves the opposite side wide open. Holding ground relies entirely on your reaction time!
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto text-center animate-fade-in">
      <div className="h-32 flex flex-col items-center justify-center mb-8">
        {phase === 'waiting' && <span className="text-slate-400 font-bold tracking-widest uppercase animate-pulse">Skating in...</span>}
        {(phase === 'deking' || phase === 'result') && direction === 'left' && <span className="text-6xl text-[#3b82f6] animate-bounce">⬅️</span>}
        {(phase === 'deking' || phase === 'result') && direction === 'right' && <span className="text-6xl text-[#3b82f6] animate-bounce">➡️</span>}
        
        {phase === 'result' && (
          <p className={`mt-4 font-black sports-font text-2xl uppercase tracking-widest ${msg.includes('SAVE') || msg.includes('PERFECT') ? 'text-[#22E748]' : 'text-[#ef4444]'}`}>
            {msg}
          </p>
        )}
      </div>

      {phase === 'deking' && (
        <div className="flex gap-4">
          <button onClick={() => handlePad('left')} className="flex-1 bg-slate-800 border-4 border-slate-600 rounded-xl py-8 text-2xl font-black text-white hover:border-[#3b82f6] active:bg-[#3b82f6] transition-all cursor-pointer">
            LEFT PAD
          </button>
          <button onClick={() => handlePad('right')} className="flex-1 bg-slate-800 border-4 border-slate-600 rounded-xl py-8 text-2xl font-black text-white hover:border-[#3b82f6] active:bg-[#3b82f6] transition-all cursor-pointer">
            RIGHT PAD
          </button>
        </div>
      )}
    </div>
  );
};

const OneTimerGame = ({ player, onComplete }) => {
  const [position, setPosition] = useState(-20);
  const [status, setStatus] = useState('playing');
  const doneRef = useRef(false);

  const finish = useCallback((win) => {
    if (doneRef.current) return;
    doneRef.current = true;
    setTimeout(() => onComplete(win), 1000);
  }, [onComplete]);

  useEffect(() => {
    if (status !== 'playing') return;
    
    // Higher shooting/hockey IQ makes the puck travel at a slightly more manageable speed
    const speed = Math.max(1.8, 4.5 - (player.shooting * 0.025));
    const ticker = setInterval(() => {
      setPosition(prev => {
        const next = prev + speed;
        if (next > 120) {
          setStatus('lost');
          finish(false);
        }
        return next;
      });
    }, 20);
    return () => clearInterval(ticker);
  }, [status, player, finish]);

  const handleShoot = () => {
    if (status !== 'playing') return;
    // The sweet spot is exactly between 72% and 88% of the bar
    if (position >= 72 && position <= 88) {
      setStatus('won');
      finish(true);
    } else {
      setStatus('lost');
      finish(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto text-center">
      <div className="h-16 w-full bg-slate-800 rounded-full border-4 border-slate-600 relative overflow-hidden mb-8 shadow-inner">
        {/* Sweet Spot */}
        <div className="absolute top-0 bottom-0 left-[72%] right-[12%] bg-[#F59E0B]/40 border-x-4 border-[#F59E0B]"></div>
        {/* The Puck */}
        <div
          className={`absolute top-2 bottom-2 w-10 bg-black rounded-full shadow-lg border-2 transition-colors ${status === 'won' ? 'border-[#22E748] bg-[#22E748]' : status === 'lost' ? 'border-[#ef4444] bg-[#ef4444]' : 'border-slate-400'}`}
          style={{ left: `${position}%` }}
        ></div>
      </div>
      <button
        onClick={handleShoot}
        className={`w-full py-4 rounded-xl font-black sports-font text-2xl uppercase tracking-widest transition-transform active:scale-95 ${status === 'playing' ? 'bg-[#F59E0B] text-black shadow-[0_0_15px_rgba(245,158,11,0.5)] cursor-pointer' : status === 'won' ? 'bg-[#22E748] text-white' : 'bg-[#ef4444] text-white'}`}
      >
        {status === 'playing' ? 'FIRE THE ONE-TIMER!' : status === 'won' ? 'WHAT A ROCKET!' : 'WHIFFED IT!'}
      </button>
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

  const [player, setPlayer] = useState(makeInitialPlayer);

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
  
  const handleStart = () => {
    const lg = player.startLeague;
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

    const randomReporter = PRESS_JOURNALISTS[Math.floor(Math.random() * PRESS_JOURNALISTS.length)];

    setPlayer(p => ({
      ...p, team: startTeam.id, league: lg, teamsPlayedFor: [startTeam.id],
      shooting: bSht, skating: bSkt, physicality: bPhy, hockeyIQ: bIq, stamina: bSta, ovr: startOvr,
      isGenerational: isGen,
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

    // 1. DRAFT TIERS WITH POSITIONAL BIAS
    // Goalies require a generational 72+ OVR to go 1st overall. Skaters need 66+.
    const isFirstOverall = (player.pos !== 'G' && player.ovr >= 66) || (player.pos === 'G' && player.ovr >= 72) || (['LW', 'RW', 'C'].includes(player.pos) && totalJuniorPoints > 180);
    const isElite = player.ovr >= 64 || (['LW', 'RW', 'C'].includes(player.pos) && totalJuniorPoints > 140);
    const isGreat = player.ovr >= 61 || (['LW', 'RW', 'C'].includes(player.pos) && totalJuniorPoints > 100);

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
         // 👇 FIX: Added role so simulator doesn't crash
         contract: { salary: 925000, years: 3, role: getRole(925000, p) } 
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
        seasonsPlayed: player.stats.seasonsPlayed + 1,
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
         const tradeChance = (isExpiring && isRebuilding && isElite) ? 0.40 : 0.05;

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
    // STORYLINE 1: THE MEDIA NEMESIS
    // ==========================================
    const nemesisStage = player.storylines?.mediaNemesis || 0;
    const mediaTrust = player.relationships?.media || 50;
    
    // Organic Trigger: Bad media relations early in career
    if (nemesisStage === 0 && currentLg === 'NHL' && mediaTrust < 40 && player.stats?.seasonsPlayed <= 4 && Math.random() < 0.20) {
        const organicReporter = PRESS_JOURNALISTS[Math.floor(Math.random() * PRESS_JOURNALISTS.length)];
        setPlayer(p => ({ 
            ...p, 
            storylines: { ...p.storylines, mediaNemesis: 1 },
            nemesisName: `${organicReporter.name} (${organicReporter.outlet})`
        }));
    }

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
    // ==========================================
    // STORYLINE: THE CHL IMPORT DRAFT
    // ==========================================
    // Triggers ONLY ONCE for 16 or 17 year olds playing in Europe
    if (!player.storylines?.importDraft && !player.chlRights && (pAge === 16 || pAge === 17) && ['SHL', 'LIIGA'].includes(currentLg)) {
        
        setPlayer(p => ({ ...p, storylines: { ...(p.storylines || {}), importDraft: 1 } }));
        const chlLeagues = ['OHL', 'WHL', 'QMJHL'];
        const randomLg = chlLeagues[Math.floor(Math.random() * chlLeagues.length)];
        let pool = getOpponentPool(randomLg) || [];
        if (pool.length === 0) pool = [{ id: 'UNK', name: 'Unknown Team', city: '' }];
        const draftingTeam = pool[Math.floor(Math.random() * pool.length)];
        const fullTeamName = draftingTeam.fullName || 
          (draftingTeam.city ? `${draftingTeam.city} ${draftingTeam.name}` : draftingTeam.name);

        setActiveEvent({
            title: '🇨🇦 THE CHL IMPORT DRAFT',
            desc: `You have been selected by the ${fullTeamName} (${randomLg}) in the CHL Import Draft! They want you to leave Europe and come play Major Junior hockey in North America to get used to the smaller ice.`,
            choices: [
                {
                    label: 'Pack your bags for North America',
                    isRisky: false,
                    feedback: `You signed with ${draftingTeam.name}. The smaller ice is an adjustment, but NHL scouts are watching closely.`,
                    effect: { idol: 15, ovr: 1 },
                    action: 'ACCEPT_IMPORT_DRAFT',
                    actionData: { teamObj: draftingTeam, league: randomLg }
                },
                {
                    label: 'Stay in Europe',
                    isRisky: false,
                    feedback: `You decided to stay and play against grown men in Europe. ${draftingTeam.name} will retain your CHL rights just in case you change your mind later.`,
                    effect: { idol: 5, ovr: 1 },
                    action: 'DECLINE_IMPORT_DRAFT',
                    actionData: { teamObj: draftingTeam, league: randomLg }
                }
            ]
        });
        setScreen('event');
        return;
    }

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
        const shuffledJ = [...PRESS_JOURNALISTS].sort(() => 0.5 - Math.random()).slice(0, 3);
        setActivePress({ journalists: shuffledJ, questions: shuffledQ, currentQ: 0, answers: [] });
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
    // Per-question journalist scoring: each answer is compared against the
    // journalist assigned to that specific question.
    const journalists = activePress.journalists || [];
    const hits = activePress.answers.filter((ans, i) => ans === journalists[i]?.id).length;
    
    if (hits === 3) unlockAchievement('press_master');
    if (hits === 0) unlockAchievement('press_disaster');
    
    setPlayer(prev => {
      let idolDelta = 0;
      let ovrDelta = 0;
      let mediaDelta = 0;
      let coachDelta = 0;

      if (hits === 3) { idolDelta = 15; ovrDelta = 1; mediaDelta = 15; coachDelta = 5; }
      else if (hits === 2) { idolDelta = 5; mediaDelta = 5; }
      else if (hits === 1) { idolDelta = -5; mediaDelta = -5; }
      else { idolDelta = -15; ovrDelta = -1; mediaDelta = -15; coachDelta = -10; }
      
      const withOvr = applyOvrDelta(prev, ovrDelta);
      return { 
        ...withOvr, 
        idolatry: capIdol(withOvr.idolatry + idolDelta), 
        ovr: recomputeOvr(withOvr),
        relationships: {
          ...withOvr.relationships,
          media: Math.min(100, Math.max(0, (withOvr.relationships?.media || 50) + mediaDelta)),
          coach: Math.min(100, Math.max(0, (withOvr.relationships?.coach || 50) + coachDelta))
        }
      };
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
    setMinigameStarted(false); // <--- Add this line!
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
          setPlayer(p => ({ ...p, stats: { ...p.stats, memCupBoost: 50, titles: (p.stats.titles || 0) + 1 } }));
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
        stats: { ...withOvr.stats, earnings: (withOvr.stats?.earnings || 0) + (outcome.money || 0) },
        relationships: {
          coach: Math.min(100, Math.max(0, (withOvr.relationships?.coach || 50) + (outcome.rel?.coach || 0))),
          teammates: Math.min(100, Math.max(0, (withOvr.relationships?.teammates || 50) + (outcome.rel?.teammates || 0))),
          media: Math.min(100, Math.max(0, (withOvr.relationships?.media || 50) + (outcome.rel?.media || 0)))
        }
      };
    });
    setEventImpacts({ idol: outcome.idol || 0, ovr: outcome.ovr || 0, money: outcome.money || 0 });
    setEventFeedback(scored ? successMsg : failMsg);
    setScreen('event-result');
  };

  const handleInteractiveResult = (isWin, reward, successMsg, failMsg) => {
    const payout = isWin ? reward.win : reward.loss;

    setPlayer(prev => {
      const withOvr = applyOvrDelta(prev, payout.ovr || 0);
      return {
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
    });
    
    // Advance the Memorial Cup if we just finished a minigame during it
    if (minigameContext === 'memcup') {
        if (isWin && memCup.round === 1) {
            // They won the Championship Final!
            setPlayer(p => ({
                ...p,
                idolatry: capIdol(p.idolatry + 50),
                stats: { ...p.stats, memCupBoost: 50, titles: (p.stats.titles || 0) + 1 }
            }));
            unlockAchievement('mem_cup');
        }
        
        setMemCup(prev => ({ 
           ...prev, 
           status: isWin ? (prev.round === 0 ? 'semi_won' : 'won') : 'lost', 
           lastFeedback: isWin ? successMsg : failMsg 
        }));
    }

    setEventImpacts({ idol: payout.idol || 0, ovr: payout.ovr || 0, money: payout.money || 0 });
    setEventFeedback(isWin ? successMsg : failMsg);
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
        updated.contract = { salary: 925000, years: 3, role: getRole(925000, p) };
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
      } else if (choice.action === 'CHANGE_POSITION') {
        updated.pos = choice.actionData;
      } else if (choice.action === 'ACCEPT_IMPORT_DRAFT') {
        const { teamObj, league } = choice.actionData;
        updated.team = teamObj.id;
        updated.league = league;
        updated.teamsPlayedFor = Array.from(new Set([...(updated.teamsPlayedFor || []), teamObj.id]));
        // Save rights
        updated.chlRights = teamObj.id;
        updated.chlRightsLeague = league;
      } else if (choice.action === 'DECLINE_IMPORT_DRAFT') {
        const { teamObj, league } = choice.actionData;
        updated.chlRights = teamObj.id;
        updated.chlRightsLeague = league;
      } else if (choice.action === 'DEMOTE_TO_JUNIORS') {
        // Checks CHL Import Rights first, falls back to original junior team, then 'UNK'
        const targetJuniorTeam = player.chlRights || player.juniorTeam || 'UNK';
        const targetJuniorLeague = player.chlRightsLeague || player.juniorLeague || 'OHL';

        updated.team = targetJuniorTeam;
        updated.league = targetJuniorLeague;
        updated.teamsPlayedFor = Array.from(new Set([...(updated.teamsPlayedFor || []), targetJuniorTeam]));
      } else if (choice.action === 'ACCEPT_ARBITRATION') {
        updated.team = choice.actionData.team;
        updated.league = 'NHL';
        updated.contract = { salary: choice.actionData.salary, years: choice.actionData.years, role: choice.actionData.role };
        updated.teamsPlayedFor = Array.from(new Set([...(updated.teamsPlayedFor || []), choice.actionData.team]));
      }
      const withOvr = applyOvrDelta(updated, outcomeEffect?.ovr || 0);
      return {
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
          const t1 = isPlayer ? playerTeamObj : (pool.pop() || { name: 'TBD', id: 'TBD' });
          const t2 = pool.pop() || { name: 'TBD', id: 'TBD' };
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
      hasConfs
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
    const agentItem = shopItems.find(i => i.id === 'agent');
    const agentModifier = agentItem?.effect?.salaryModifier ?? 1.15;
    const multi = (player.inventory || []).includes('agent') ? agentModifier : 1.0;
    
    let leagueMinimum = 850000;
    if (currentYear === 2027) leagueMinimum = 900000;
    else if (currentYear >= 2029) leagueMinimum = 1000000;

    let baseSalary = leagueMinimum;
    let maxYears = 2;

   if (player.league === 'AHL' || isAmateur) {
      baseSalary = (leagueMinimum + (Math.random() * 150000)) * multi;
      maxYears = 3; 
    } else if (player.league === 'NHL') {
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

      const NHL_MAX_SALARY = 13500000;
      baseSalary = Math.min(NHL_MAX_SALARY, baseSalary);
    }

    baseSalary = Math.max(leagueMinimum, Math.round(baseSalary / 25000) * 25000);
    let offers = [];
    
    const isRFA = player.league === 'NHL' && player.age < 27 && (player.stats?.seasonsPlayed || 0) < 7;
    const isAmateurGraduating = ['OHL', 'WHL', 'QMJHL', 'USHL', 'NCAA'].includes(player.league);
    
    let teamDidNotExtend = false;
    if (!isTradeRequest && !isAmateurGraduating) {
      if (player.ovr < 65 && Math.random() > 0.60) {
         setEventFeedback("Your team elected not to extend your contract. You are now a UFA.");
         teamDidNotExtend = true;
      } else {
         offers.push({
           team: actingTeam,
           league: player.league,
           type: isRFA ? (player.ovr >= 82 ? 'RFA EXTENSION' : 'QUALIFYING OFFER') : 'EXTENSION',
           salary: baseSalary,
           years: isRFA && player.ovr < 82 ? 1 : maxYears, // QOs are 1 year. Extensions use full maxYears.
           role: getRole(baseSalary, player),
           idolHit: 10,
           state: 'Current Club'
         });
      }
    }

    if (isRFA && !teamDidNotExtend && !isTradeRequest && !isAmateurGraduating) {
      if (Math.random() > 0.85) { 
         const pool = nhlTeams || [];
         if (pool.length > 0) {
           const t = pool[Math.floor(Math.random() * pool.length)].id;
           if (t !== actingTeam) {
              const osSalary = Math.min(13500000, Math.round((baseSalary * 1.3) / 25000) * 25000);
              offers.push({
                team: t, league: 'NHL', type: 'OFFER SHEET', salary: osSalary, years: Math.min(5, maxYears),
                role: getRole(osSalary, player), idolHit: getTransferImpact(actingTeam, t),
                state: 'Offer Sheet'
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
            
            offers.push({
              team: t,
              league: targetLg,
              type: isTradeRequest ? 'TRADE' : 'FREE AGENCY',
              salary: offerSalary,
              years: Math.min(7, Math.floor(Math.random() * maxYears) + 1),
              role: targetLg === 'NHL' ? getRole(offerSalary, player) : 'Pro Roster',
              idolHit: getTransferImpact(actingTeam, t),
              state: teamState
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
        contract: { salary: o.salary, years: o.years, role: o.role }
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

    // Safe Ask: Low risk to patience, small bump
    if (type === 'safe') {
      damage = Math.floor(Math.random() * 15) + 5; // 5% to 20% patience loss
      bump = Math.round(negotiation.originalOffer.salary * 0.03 / 25000) * 25000;
      label = "Safe Ask";
    } 
    // Hardball: High risk to patience, massive bump
    else if (type === 'hardball') {
      damage = Math.floor(Math.random() * 30) + 15; // 15% to 45% patience loss
      bump = Math.round(negotiation.originalOffer.salary * 0.08 / 25000) * 25000;
      label = "Hardball";
    }

    const newPatience = negotiation.gmPatience - damage;
    const newRound = negotiation.rounds + 1;

    if (newPatience <= 0) {
       // Busted - GM gets mad and slashes the offer
       const penalty = Math.round(negotiation.originalOffer.salary * 0.15 / 25000) * 25000;
       setNegotiation(prev => ({
         ...prev,
         gmPatience: 0,
         currentSalary: Math.max(850000, prev.currentSalary - penalty),
         status: 'busted',
         history: [...prev.history, { label, success: false }],
         msg: "❌ You pushed too hard! The GM slammed the table and slashed the offer."
       }));
    } else {
       // Success
       setNegotiation(prev => ({
         ...prev,
         gmPatience: newPatience,
         currentSalary: prev.currentSalary + bump,
         rounds: newRound,
         history: [...prev.history, { label, success: true }],
         status: newRound >= prev.maxRounds ? 'maxed' : 'playing',
         msg: newRound >= prev.maxRounds ? "Final offer reached. The GM won't negotiate further." : `✅ GM agreed to the ${label}. Their patience is dropping...`
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
          hasDemandedTrade={hasDemandedTrade} 
          setHasDemandedTrade={setHasDemandedTrade} 
        />
      )}

      {/* MAIN SCREEN ROUTER */}
      <div className="w-full max-w-5xl mx-auto pb-10">

        {screen === 'creation' && (
          <div className="min-h-screen flex items-center justify-center p-6 bg-[#040505] text-white">
            <div className="w-full max-w-xl game-panel p-6 sm:p-10 text-center border-t-2 border-t-[#22E748]">
              <h2 className="text-[#22E748] font-bold tracking-widest mb-2 sports-font text-sm sm:text-base">A HOCKEY GAME</h2>
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
                    <h3 className="text-sm sm:text-base font-black text-white sports-font tracking-wide">{lg.label}</h3>
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

             {/* START GAME BUTTON */}
              <button 
                onClick={handleStart} 
                disabled={!player.name} 
                className={`w-full py-4 rounded-xl text-xl sm:text-2xl font-black sports-font tracking-widest transition-all mb-2 ${
                  !player.name 
                    ? 'bg-[#101410] border border-slate-800 text-slate-600 cursor-not-allowed shadow-none' 
                    : 'bg-[#22E748]/10 hover:bg-[#22E748]/20 border border-[#22E748]/40 text-[#22E748] shadow-[0_0_15px_rgba(34,231,75,0.15)] hover:shadow-[0_0_25px_rgba(34,231,75,0.25)] cursor-pointer hover:scale-[1.02]'
                }`}
              >
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
          const totalShutouts = (player.stats?.nhl?.shutouts || 0) + (player.stats?.chl?.shutouts || 0) + (player.stats?.ahl?.shutouts || 0);
          const totalShots = (player.stats?.nhl?.shots || 0) + (player.stats?.chl?.shots || 0) + (player.stats?.ahl?.shots || 0);
          
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
              <div className="w-full max-w-4xl space-y-4">
                
                {/* 1. HERO HEADER (Fixed English & Top Award Aggregation) */}
                <div className="game-panel p-6 sm:p-10 text-center border-2 border-[#3b82f6] relative overflow-hidden bg-gradient-to-b from-[#101410] to-[#080a08] shadow-[0_0_30px_rgba(59,130,246,0.15)]">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-[10px] sm:text-xs font-black tracking-widest text-slate-400 uppercase bg-black/40 px-3 py-1 rounded-full border border-slate-700">
                      RETIRED AT AGE {player.age}
                    </span>
                    <span className="text-[10px] sm:text-xs font-black tracking-widest text-[#3b82f6] uppercase bg-[#3b82f6]/10 px-3 py-1 rounded-full border border-[#3b82f6]/30 sports-font">
                      {isLegend ? 'HALL OF FAME CAREER' : 'CAREER ACCOMPLISHED'}
                    </span>
                  </div>

                  <h1 className="text-5xl sm:text-6xl font-black text-white number-font uppercase tracking-tight mb-1">
                    {player.name}
                  </h1>
                  <p className="text-xl sm:text-2xl font-black text-[#3b82f6] sports-font uppercase tracking-wide">
                    #{player.number} · {primaryTeamName.toUpperCase()}
                  </p>
                  <p className="text-xs sm:text-sm text-slate-400 font-sans italic mt-2 mb-4">
                    {isLegend ? 'Your jersey hangs proudly in the rafters of the arena.' : 'You officially hang up the skates after a hard-fought career.'}
                  </p>

                  {/* AGGREGATED AWARDS AT TOP */}
                  {Object.keys(aggregatedAwards).length > 0 && (
                    <div className="pt-4 border-t border-[rgba(255,255,255,0.065)] flex flex-wrap justify-center gap-x-4 gap-y-2">
                      {Object.values(aggregatedAwards).sort((a,b) => b.count - a.count).map((aw, idx) => (
                        <span key={idx} className="text-xs sm:text-sm font-bold text-[#F59E0B] uppercase tracking-wider font-sans bg-[#F59E0B]/10 px-2 py-1 rounded border border-[#F59E0B]/20">
                          {aw.count}x {aw.name.replace(' Trophy', '').replace(' Memorial', '')}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. CORE STATS GRID (Fixed Vocabulary) */}
                <div className="game-panel p-4 bg-[#0a0d0a] border border-[rgba(255,255,255,0.065)]">
                  <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.065)] pb-3 mb-4 px-2">
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">NATIONALITY: {player.nat}</span>
                      <span className="text-xs font-bold text-[#22E748] uppercase tracking-widest">PEAK OVR: {player.stats?.peakOvr || player.ovr}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
                   <div className="bg-[#101410] p-3 rounded-xl border border-[rgba(255,255,255,0.04)]">
                      <p className="text-2xl sm:text-3xl font-black text-[#22E748] sports-font">
                        {isGoalie ? (totalShots > 0 ? (totalSaves / totalShots).toFixed(3).replace('0.', '.') : '.000') : totalGoals}
                      </p>
                      <p className="text-[9px] font-bold text-slate-500 uppercase">{isGoalie ? 'SV%' : 'GOALS'}</p>
                    </div>
                    <div className="bg-[#101410] p-3 rounded-xl border border-[rgba(255,255,255,0.04)]">
                      <p className="text-2xl sm:text-3xl font-black text-white sports-font">
                        {isGoalie ? (totalGames > 0 ? ((totalShots - totalSaves) / totalGames).toFixed(2) : '0.00') : totalAssists}
                      </p>
                      <p className="text-[9px] font-bold text-slate-500 uppercase">{isGoalie ? 'GAA' : 'ASSISTS'}</p>
                    </div>
                    <div className="bg-[#101410] p-3 rounded-xl border border-[rgba(255,255,255,0.04)]">
                      <p className="text-2xl sm:text-3xl font-black text-white sports-font">{totalGames}</p>
                      <p className="text-[9px] font-bold text-slate-500 uppercase">GAMES PLAYED</p>
                    </div>
                    <div className="bg-[#101410] p-3 rounded-xl border border-[rgba(255,255,255,0.04)]">
                      <p className="text-2xl sm:text-3xl font-black text-[#F59E0B] sports-font">{player.stats?.titles || 0}</p>
                      <p className="text-[9px] font-bold text-slate-500 uppercase">CHAMPIONSHIPS</p>
                    </div>
                    <div className="bg-[#101410] p-3 rounded-xl border border-[#3b82f6]/30">
                      <p className="text-xl sm:text-2xl font-black text-[#3b82f6] sports-font">{formatMoney(player.stats?.value || 50000)}</p>
                      <p className="text-[9px] font-bold text-slate-500 uppercase">PEAK VALUE</p>
                    </div>
                    <div className="bg-[#101410] p-3 rounded-xl border border-[#22E748]/30">
                      <p className="text-xl sm:text-2xl font-black text-[#22E748] sports-font">{formatMoney(player.stats?.earnings || 0)}</p>
                      <p className="text-[9px] font-bold text-slate-500 uppercase">CAREER EARNINGS</p>
                    </div>
                  </div>
                </div>

                {/* 3. CLUB HISTORY (Fixed text wrapping & single line stats) */}
                <div className="game-panel p-4 sm:p-6 bg-[#0a0d0a] border border-[rgba(255,255,255,0.065)] text-left">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-400 tracking-widest uppercase mb-4 font-sans border-b border-[rgba(255,255,255,0.065)] pb-3">
                    CAREER HISTORY
                  </h3>

                  {stints.length === 0 ? (
                    <p className="text-slate-500 text-sm italic font-sans">No detailed club history recorded for this career.</p>
                  ) : (
                    <div className="space-y-3">
                      {stints.map((stint, idx) => (
                        <div key={idx} className="bg-[#101410] border border-[rgba(255,255,255,0.065)] rounded-xl p-3 sm:p-4 flex flex-col gap-3">
                          <div className="flex items-center justify-between gap-2">
                            {/* Truncated team name so it never wraps */}
                            <div className="flex items-center gap-3 min-w-0">
                              <TeamLogo teamId={stint.team} league={stint.league} size="small" className="shrink-0" />
                              <div className="min-w-0">
                                <h4 className="text-base sm:text-lg font-black text-white sports-font truncate">{getFullTeamName(stint.team, stint.league)}</h4>
                                <p className="text-[10px] sm:text-xs text-slate-500 font-bold font-sans truncate">
                                  {stint.startYear === stint.endYear ? stint.startYear : `${stint.startYear}–${stint.endYear}`} · {stint.league}
                                </p>
                              </div>
                            </div>
                            {/* Whitespace-nowrap on stats so "A" never drops to a new line */}
                            <div className="text-right shrink-0">
                              <span className="text-[10px] sm:text-sm font-black text-slate-300 font-sans whitespace-nowrap">
                                {stint.games} GP · {isGoalie ? `${stint.saves} SV` : `${stint.goals} G · ${stint.assists} A`}
                              </span>
                            </div>
                          </div>

                          {/* Simplified Team-Level Awards ("2028 Hart") */}
                          {(stint.titles.length > 0 || stint.awards.length > 0) && (
                            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[rgba(255,255,255,0.04)]">
                              {stint.titles.length > 0 && (
                                <span className="bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-[#F59E0B] text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider font-sans">
                                  🏆 {stint.titles.length}x Cup ({stint.titles.join(', ')})
                                </span>
                              )}
                              {stint.awards.map((aw, aIdx) => {
                                // Strip out the word "Trophy" so it's super clean, e.g. "2028 Hart"
                                const cleanAward = aw.replace(' Trophy', '').replace(' Memorial', '');
                                return (
                                  <span key={aIdx} className="bg-[#3b82f6]/10 border border-[#3b82f6]/30 text-[#3b82f6] text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider font-sans">
                                    🥇 {cleanAward}
                                  </span>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="text-center pt-4">
                  <button onClick={handleNewGame} className="btn-primary w-full sm:w-auto py-4 px-12 rounded-xl text-lg sm:text-xl cursor-pointer sports-font tracking-widest uppercase shadow-2xl">
                    START NEW CAREER
                  </button>
                </div>

              </div>
            </div>
          );
        })()}

        {screen === 'press' && (() => {
          const q = activePress.questions[activePress.currentQ];
          const journalist = activePress.journalists[activePress.currentQ];
          
          // Pulls from the safe top-level hook instead!
          const answerKeys = pressAnswerKeys;

          return (
            <div className="game-panel p-4 sm:p-8 mt-2 border-t-2 border-t-[#3b82f6] text-left">
              <div className="mb-4 sm:mb-6 border-b border-[rgba(255,255,255,0.065)] pb-4">
                 <h3 className="text-xs sm:text-sm font-bold text-slate-400 tracking-widest uppercase mb-1 font-sans">PRESS ROOM</h3>
                 <h2 className="text-2xl sm:text-4xl font-black text-white sports-font uppercase tracking-wide">THE PRESS CONFERENCE</h2>
              </div>
              
              {/* VISIBLE JOURNALIST PROFILE (Scales based on Hockey IQ) */}
              <div className="bg-[#101410] border border-[rgba(255,255,255,0.065)] rounded-xl p-4 sm:p-5 mb-4 sm:mb-6 flex flex-col justify-center min-h-[100px]">
                <p className="text-[10px] sm:text-xs font-bold text-[#F59E0B] tracking-widest uppercase mb-1 font-sans">QUESTION {activePress.currentQ + 1} FROM:</p>
                
                {player.hockeyIQ >= 75 ? (
                  <>
                    <p className="text-sm sm:text-base font-black text-white mb-1 flex items-center flex-wrap gap-2">
                      🎙️ {journalist?.name}
                      {journalist?.outlet && <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest font-sans">{journalist.outlet}</span>}
                    </p>
                    <p className="text-xs sm:text-sm text-slate-400 italic">"{journalist?.desc}"</p>
                  </>
                ) : player.hockeyIQ >= 60 ? (
                  <>
                    <p className="text-sm sm:text-base font-black text-white mb-1 flex items-center flex-wrap gap-2">
                      🎙️ {journalist?.name}
                      {journalist?.outlet && <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest font-sans">{journalist.outlet}</span>}
                    </p>
                    <p className="text-xs sm:text-sm text-slate-500 italic">You aren't quite sure what angle they are going for...</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm sm:text-base font-black text-white mb-1">🎙️ Unfamiliar Reporter</p>
                    <p className="text-xs sm:text-sm text-slate-500 italic">You have no idea who this is or what they want to hear.</p>
                  </>
                )}
              </div>

              {/* HIGH IQ CHEAT CODE */}
              {player.hockeyIQ >= 75 && (
                <div className="bg-[#22E748]/10 border border-[#22E748]/30 p-3 sm:p-4 rounded-xl mb-4 sm:mb-6 flex items-center gap-3 shadow-[0_0_15px_rgba(34,231,75,0.1)]">
                  <span className="text-xl sm:text-3xl">🧠</span>
                  <div>
                    <p className="text-[#22E748] text-[9px] sm:text-[10px] font-black tracking-widest uppercase mb-1">HIGH IQ INSIGHT</p>
                    <p className="text-slate-300 text-[10px] sm:text-sm font-medium">Give this reporter a <span className="font-bold text-white uppercase">{journalist?.id}</span> answer.</p>
                  </div>
                </div>
              )}

              <p className="text-[9px] sm:text-[10px] font-bold text-[#3b82f6] tracking-widest uppercase mb-2">QUESTION {activePress.currentQ + 1} OF 3</p>
              <h3 className="text-lg sm:text-2xl font-bold text-white mb-4 sm:mb-6 leading-snug">"{q?.q}"</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
                {answerKeys.map((vibeKey) => {
                  const vibe = PRESS_VIBES[vibeKey];
                  return (
                    <button key={vibeKey} onClick={() => handlePressAnswer(vibeKey)} className="bg-[#101410] hover:bg-[#1a2230] border border-[rgba(255,255,255,0.065)] text-left p-4 sm:p-5 rounded-xl transition-colors group flex flex-col justify-center cursor-pointer min-h-[100px]">
                       <p className="text-sm sm:text-base text-slate-300 font-medium group-hover:text-white transition-colors italic leading-relaxed">
                         "{q.answers[vibeKey]}"
                       </p>
                       
                       {/* HIGH IQ PERK: Unlocks the labels to make matching trivial */}
                       {player.hockeyIQ >= 75 && (
                         <div className="flex items-center gap-2 mt-3 opacity-40 group-hover:opacity-100 transition-opacity">
                           <span className={`text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest ${vibe.bg} ${vibe.color} border ${vibe.border}`}>
                             {vibe.icon} {vibe.label}
                           </span>
                         </div>
                       )}
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
           const journalistsList = activePress.journalists || (activePress.journalist ? [activePress.journalist] : []);
           const hits = activePress.answers.filter((ans, i) => ans === (journalistsList[i]?.id || activePress.journalist?.id)).length;
           
           let resultTitle, resultColor, resultText;
           if (hits === 3) { resultTitle = 'FLAWLESS CONFERENCE'; resultColor = 'text-[#22E748]'; resultText = 'Read them all like a book. +15 Fan Status, +1 OVR'; }
           else if (hits === 2) { resultTitle = 'GOOD CONFERENCE'; resultColor = 'text-[#3b82f6]'; resultText = 'Solid, measured answers. +5 Fan Status'; }
           else if (hits === 1) { resultTitle = 'MIXED RECEPTION'; resultColor = 'text-[#F59E0B]'; resultText = 'They twisted your words. -5 Fan Status'; }
           else { resultTitle = 'PR DISASTER'; resultColor = 'text-[#ef4444]'; resultText = 'You alienated everyone. -15 Fan Status, -1 OVR'; }

           const primaryJournalist = journalistsList[0] || { name: 'The Media', desc: 'Post-game interview.' };

           return (
            <div className="game-panel p-4 sm:p-8 mt-2 border-t-2 border-t-[#3b82f6] text-left">
              <div className="mb-4 sm:mb-6 border-b border-[rgba(255,255,255,0.065)] pb-4">
                 <h3 className="text-xs sm:text-sm font-bold text-slate-400 tracking-widest uppercase mb-1 font-sans">PRESS ROOM</h3>
                 <h2 className="text-2xl sm:text-4xl font-black text-white sports-font uppercase tracking-wide">THE PRESS CONFERENCE</h2>
              </div>

              <div className="border border-[rgba(255,255,255,0.065)] rounded-xl mb-4 sm:mb-6 overflow-hidden">
                 <div className="bg-[#101410] px-3 py-2 border-b border-[rgba(255,255,255,0.065)]">
                   <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest">INTERVIEWEE BREAKDOWN</span>
                 </div>
                 <div className="p-3 sm:p-4 bg-[#1a2230]">
                    <p className="text-xs sm:text-sm text-white flex items-center flex-wrap gap-1.5">
                      <span className="font-bold text-[#3b82f6]">🎙️ {primaryJournalist.name}</span> 
                      {primaryJournalist.outlet && <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest font-sans mr-1">{primaryJournalist.outlet}</span>}
                      — {primaryJournalist.desc}
                    </p>
                 </div>
              </div>

              <div className="border border-[rgba(255,255,255,0.065)] rounded-xl mb-4 sm:mb-6 overflow-hidden">
                 <div className="bg-[#101410] px-3 py-2 border-b border-[rgba(255,255,255,0.065)]">
                   <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest">THE TRANSCRIPT</span>
                 </div>
                 <div className="p-2 sm:p-4 bg-[#1a2230] flex flex-col gap-2 sm:gap-3">
                   {activePress.answers.map((ans, i) => {
                     const journalist = journalistsList[i] || primaryJournalist;
                     const isHit = ans === journalist?.id;
                     const vibe = PRESS_VIBES[ans];
                     return (
                       <div key={i} className="flex justify-between items-center bg-[#101410] p-2 sm:p-3 rounded-lg border border-[rgba(255,255,255,0.03)]">
                          <div className="flex items-center gap-2 sm:gap-3">
                             <span className="text-[10px] font-bold text-slate-500 mr-2 hidden sm:inline">Q{i+1}: {journalist?.name}</span>
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
              
              <div className="bg-[#101410] border border-[#3b82f6]/30 p-8 sm:p-12 rounded-2xl mb-10 max-w-2xl mx-auto shadow-[0_0_30px_rgba(59,130,246,0.15)] relative overflow-hidden flex flex-col items-center">
                <div className="absolute top-0 w-full bg-[#3b82f6] text-white font-black text-xs sm:text-sm py-1.5 text-center tracking-widest">
                  ROUND {seasonRecap?.draftRound} • PICK {seasonRecap?.draftPick}
                </div>
                
                <div className="mt-4">
                   <TeamLogo teamId={seasonRecap?.draftedBy?.id} league="NHL" />
                </div>
                
                <h3 className="text-sm sm:text-lg font-bold text-slate-300 uppercase mt-6 mb-2 sports-font tracking-wide leading-tight px-4">
                  THE {getFullTeamName(seasonRecap?.draftedBy?.id, 'NHL').toUpperCase()} ARE PROUD TO SELECT, FROM {['SHL', 'LIIGA'].includes(seasonRecap?.juniorLeague) ? '' : 'THE '}{getFullTeamName(seasonRecap?.juniorTeam, seasonRecap?.juniorLeague).toUpperCase()}...
                </h3>
                
                <h2 className="text-5xl sm:text-6xl font-black text-[#3b82f6] sports-font uppercase mt-2">{player.name}</h2>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                {(isFirstRound || player.ovr >= 65) ? (
                  <button 
                    onClick={() => handleDraftChoice('ELC')} 
                    className="w-full sm:w-auto py-4 px-6 rounded-xl text-sm sm:text-base font-black sports-font tracking-widest transition-all cursor-pointer bg-[#22E748]/10 hover:bg-[#22E748]/20 border border-[#22E748]/40 text-[#22E748] shadow-[0_0_15px_rgba(34,231,75,0.15)] hover:shadow-[0_0_25px_rgba(34,231,75,0.25)] hover:scale-[1.02]"
                  >
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
                
                {player.league === 'USHL' && (
                   <button onClick={() => handleDraftChoice('NCAA')} className="bg-[#101410] hover:bg-[#1a2230] ...">
                     COMMIT TO NCAA
                   </button>
                )}
              </div>
            </div>
          );
        })()}

        {screen === 'preseason' && (
          <div className="game-panel p-6 sm:p-10 mt-2 border-t-2 border-t-[#22E748] relative z-20">
           <div className="flex flex-col items-start border-b border-[rgba(255,255,255,0.065)] pb-4 mb-6">
              <span className="text-[10px] sm:text-xs font-bold text-[#3b82f6] uppercase tracking-widest font-sans border border-[#3b82f6]/30 px-2.5 py-1 rounded bg-[#3b82f6]/10 mb-2">
                OFF-SEASON DEVELOPMENT
              </span>
              <h2 className="text-3xl sm:text-4xl font-black italic text-white uppercase sports-font tracking-tighter">PRE-SEASON {currentYear}</h2>
              <p className="text-slate-400 text-sm sm:text-base font-sans mt-1">The coaching staff has prepared three training programs. Pick your focus.</p>
            </div>

           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 w-full pb-6 pt-2">
              {activeTrainings.map(t => (
                <button
                  type="button"
                  key={t.id}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleTrain(t);
                  }}
                  className={`bg-[#101410] border border-[rgba(255,255,255,0.065)] rounded-xl cursor-pointer transition-all hover:-translate-y-1 flex flex-col min-h-[12rem] sm:min-h-[16rem] text-left relative z-30 ${t.rarity === 'Epic' ? 'hover:border-[#F59E0B]' : t.rarity === 'Rare' ? 'hover:border-[#3b82f6]' : 'hover:border-[#22E748]'}`}
                >
                  <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between w-full pointer-events-none">
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-4 w-full min-w-0">
                        {t.rarity !== 'Common' ? (
                          <span className={`shrink-0 text-[9px] sm:text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest font-sans ${t.rarity === 'Epic' ? 'bg-[#F59E0B] text-black' : 'bg-[#3b82f6] text-white'}`}>{t.rarity}</span>
                        ) : <span className="shrink-0"></span>}
                        <span className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-black text-slate-700 uppercase sports-font tracking-tighter text-right leading-none break-words min-w-0">
                          {{
                            'SHT': 'SHOOTING', 'SKT': 'SKATING', 'PHY': 'PHYSICAL',
                            'IQ': 'HOCKEY IQ', 'MIND': 'HOCKEY IQ',
                            'STA': 'STAMINA', 'STM': 'STAMINA',
                            'REF': 'REFLEXES', 'POS': 'POSITIONING', 'AGI': 'AGILITY',
                            'TECH': 'TECHNIQUE', 'GRIT': 'GRIT', 'POW': 'POWER',
                            'SKL': 'SKILL', 'PRO': 'PROGRAM', 'ELITE': 'ELITE',
                            'EYES': 'VISION', 'FLEX': 'FLEXIBILITY'
                          }[t.tag] || t.tag}
                        </span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black text-white uppercase leading-tight mb-3 text-left sports-font mt-2">{t.name}</h3>
                      <p className="text-xs sm:text-sm text-slate-400 leading-relaxed italic text-left font-sans mb-4">{t.flavor}</p>
                    </div>

                    {/* STAT PILLS — color-coded per stat, matching the international game */}
                    <div className="mt-auto text-left pt-4 border-t border-[rgba(255,255,255,0.065)] w-full flex flex-wrap items-center gap-1.5">
                      {(t.desc || '').split(',').map((boost, idx) => {
                        const trimmed = boost.trim();
                        const parts = trimmed.split(/\s+/);
                        const stat = (parts[1] || '').toUpperCase();
                        let colorCls = 'text-white bg-white/10 border-white/30';
                        if (['PHY'].includes(stat)) colorCls = 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30';
                        if (['SKT', 'AGI', 'POS'].includes(stat)) colorCls = 'text-[#22E748] bg-[#22E748]/10 border-[#22E748]/30';
                        if (['SHT', 'REF'].includes(stat)) colorCls = 'text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/30';
                        if (['IQ', 'MIND'].includes(stat)) colorCls = 'text-[#c084fc] bg-[#c084fc]/10 border-[#c084fc]/30';
                        if (['STA', 'STM'].includes(stat)) colorCls = 'text-[#06b6d4] bg-[#06b6d4]/10 border-[#06b6d4]/30';
                        return (
                          <span
                            key={idx}
                            className={`text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider whitespace-nowrap border ${colorCls}`}
                          >
                            {trimmed}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {screen === 'arbitration_minigame' && arbState && (
          <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 bg-[#040505]">
            <div className="w-full max-w-2xl space-y-6">
              <div className="game-panel p-6 sm:p-8 border border-[rgba(255,255,255,0.08)] bg-[#0a0d0a] shadow-2xl relative">
                
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.065)] pb-4 mb-6">
                  <div>
                    <span className="text-[10px] sm:text-xs font-bold text-[#ef4444] uppercase tracking-widest font-sans border border-[#ef4444]/30 px-2.5 py-1 rounded bg-[#ef4444]/10">
                      BINDING ARBITRATION
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-white sports-font uppercase mt-2">
                      THE HEARING
                    </h2>
                  </div>
                  <div className="text-3xl sm:text-4xl text-white opacity-50">⚖️</div>
                </div>

                {/* Negotiation Scale */}
                <div className="mb-8 bg-[#101410] p-4 rounded-xl border border-white/5">
                  <div className="flex justify-between text-xs text-slate-400 font-bold mb-2 uppercase sports-font">
                    <span>Team Lowball: {formatMoney(arbState.teamOffer)}</span>
                    <span>Your Ask: {formatMoney(arbState.playerAsk)}</span>
                  </div>
                  
                  <div className="relative h-4 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-600 via-amber-500 to-green-500 transition-all duration-500 ease-out"
                      style={{ width: `${Math.max(5, Math.min(100, ((arbState.currentRuling - arbState.teamOffer) / (arbState.playerAsk - arbState.teamOffer)) * 100))}%` }}
                    ></div>
                  </div>
                  
                  <div className="mt-3 text-center">
                    <span className="text-sm text-slate-500 sports-font">Current Arbitrator Lean:</span>
                    <div className="number-font text-3xl text-white">{formatMoney(arbState.currentRuling)}</div>
                  </div>
                </div>

                {/* Action Log */}
                <div className="mb-6 h-32 overflow-y-auto bg-black/40 border border-white/5 rounded-lg p-3 space-y-2">
                  {arbState.log.map((msg, i) => (
                    <p key={i} className={`text-sm font-sans ${i === 0 ? 'text-slate-400' : 'text-white border-l-2 pl-2 border-[#3b82f6]'}`}>
                      {msg}
                    </p>
                  ))}
                </div>

                {/* Arguments / Resolution */}
                {arbState.rounds > 0 ? (
                  <div className="space-y-4">
                    <h4 className="sports-font text-white text-lg text-center">Rounds Remaining: <span className="number-font text-[#3b82f6]">{arbState.rounds}</span></h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        onClick={() => {
                          const success = Math.random() < 0.85;
                          const swing = Math.round(((arbState.playerAsk - arbState.teamOffer) * 0.1) / 25000) * 25000;
                          const newRuling = success ? arbState.currentRuling + swing : arbState.currentRuling;
                          
                          setArbState(prev => ({
                            ...prev,
                            currentRuling: Math.min(prev.playerAsk, newRuling),
                            rounds: prev.rounds - 1,
                            log: [
                              success 
                                ? "🟢 You highlight your reliable two-way play. The arbitrator nods, ticking the price up slightly." 
                                : "🔴 The team counters your stats with advanced analytics. The arbitrator is unmoved.",
                              ...prev.log
                            ]
                          }));
                        }}
                        className="bg-[#101410] hover:bg-[#1a2230] border border-[rgba(255,255,255,0.08)] hover:border-[#22E748] p-4 rounded-xl text-left transition-all"
                      >
                        <div className="sports-font text-white mb-1">SAFE ARGUMENT</div>
                        <div className="text-xs text-slate-400">85% chance of minor gain. Focus on fundamentals.</div>
                      </button>

                      <button
                        onClick={() => {
                          const success = Math.random() < 0.40;
                          const swing = Math.round(((arbState.playerAsk - arbState.teamOffer) * 0.25) / 25000) * 25000;
                          const newRuling = success ? arbState.currentRuling + swing : arbState.currentRuling - swing;

                          setArbState(prev => ({
                            ...prev,
                            currentRuling: Math.max(prev.teamOffer, Math.min(prev.playerAsk, newRuling)),
                            rounds: prev.rounds - 1,
                            log: [
                              success 
                                ? "🟢 MASSIVE SUCCESS. You passionately compare yourself to league superstars. The arbitrator aggressively raises your value!" 
                                : "🔴 DISASTER. You demand superstar money, but the team's lawyer brutally exposes your flaws. The arbitrator deducts value.",
                              ...prev.log
                            ]
                          }));
                        }}
                        className="bg-[#101410] hover:bg-[#1a2230] border border-[rgba(255,255,255,0.08)] hover:border-[#ef4444] p-4 rounded-xl text-left transition-all"
                      >
                        <div className="sports-font text-white mb-1">RISKY ARGUMENT</div>
                        <div className="text-xs text-slate-400">40% chance of massive gain. High risk of backfiring.</div>
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      // Re-use your exact original logic to apply the contract and relationship hits
                      const finalSalary = Math.round(arbState.currentRuling / 25000) * 25000;
                      setActiveEvent({
                        title: '⚖️ ARBITRATION CONCLUDED',
                        desc: `The hearing is over. The independent arbitrator has slammed the gavel and made a binding ruling.\n\nYou are awarded a 1-year, ${formatMoney(finalSalary)} contract.`,
                        choices: [
                          {
                            label: 'Sign Binding Contract',
                            isRisky: false,
                            feedback: `You are locked in for 1 year at ${formatMoney(finalSalary)}. The relationship with the front office is definitely bruised.`,
                            effect: { idol: 0, ovr: 0, money: 0, rel: { coach: -15, media: 5 } },
                            action: 'ACCEPT_ARBITRATION',
                            actionData: { team: arbState.offerData.team, salary: finalSalary, years: 1, role: getRole(finalSalary, player) }
                          }
                        ],
                        isOffseasonEvent: true
                      });
                      setScreen('event');
                    }}
                    className="w-full btn-primary py-4 rounded-xl text-lg mt-4"
                  >
                    AWAIT FINAL VERDICT
                  </button>
                )}
              </div>
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
             const currentLg = res.currentLg;
             const isExpiring = player.contract?.years === 1 || ['OHL', 'WHL', 'QMJHL', 'USHL'].includes(currentLg);
             const totalTeamsInLeague = getOpponentPool(currentLg)?.length || 20;
             const isRebuilding = standings > (totalTeamsInLeague * 0.6);
             
             let eliteThreshold = 82;
             if (['AHL', 'SHL', 'LIIGA'].includes(currentLg)) eliteThreshold = 72;
             if (['OHL', 'WHL', 'QMJHL', 'USHL'].includes(currentLg)) eliteThreshold = 62;
             const isElite = player.ovr >= eliteThreshold;

             // 40% chance if elite/expiring on a bad team. 5% random hockey trade otherwise.
             const tradeChance = (isExpiring && isRebuilding && isElite) ? 0.40 : 0.05;

             if (['NHL', 'AHL', 'OHL', 'WHL', 'QMJHL', 'USHL', 'SHL', 'LIIGA'].includes(currentLg) && Math.random() < tradeChance) {
                  let pool = (getOpponentPool(currentLg) || []).filter(t => t.id !== res.currentTeam);
                  if (pool.length === 0) pool = [{ id: 'UNK', name: 'Unknown Team' }];
                  
                  const destTeam = pool[Math.floor(Math.random() * pool.length)];
                  const destStandings = Math.floor(Math.random() * (playoffSpots - 2)) + 1; 
                  
                  setActiveEvent({
                     title: '11TH HOUR BLOCKBUSTER!',
                     desc: `Just as the deadline was expiring, your GM called you into the office. You've been traded! The team decided to cash in on your value and shipped you to the ${getFullTeamName(destTeam.id, currentLg)}.`,
                     choices: [
                        { label: 'Embrace the fresh start', isRisky: false, feedback: 'You packed your bags and joined your new squad.', effect: { idol: 0, ovr: 0, money: 0 }, action: 'ACCEPT_TRADE_DEADLINE', actionData: { teamObj: destTeam, teamStandings: destStandings, madePlayoffs: destStandings <= playoffSpots } },
                        { label: 'Trash your old GM to the press', isRisky: true, successChance: 0.4, successFeedback: 'Fans of your new team loved the fire. You arrived with a chip on your shoulder!', successEffect: { idol: 20, ovr: 1, money: 0 }, failFeedback: 'You came off looking bitter and unprofessional. Not a great first impression.', failEffect: { idol: -20, ovr: -1, money: 0 }, action: 'ACCEPT_TRADE_DEADLINE', actionData: { teamObj: destTeam, teamStandings: destStandings, madePlayoffs: destStandings <= playoffSpots } }
                     ],
                     isTradeDeadlineEvent: true
                  });
                  setScreen('event');
             } else {
                 setSeasonRecap(res.recap);
                 runPostSeasonFlow(player.age, player.ovr, res.currentLg, res.currentTeam, res.madePlayoffs, 2026 + (player.stats?.seasonsPlayed || 0), standings);
             }
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
  <div className="w-full max-w-[420px] md:max-w-4xl lg:max-w-5xl mx-auto game-panel p-5 sm:p-8 mt-2 text-center">
    
    {/* TITLE & HEADER */}
    <h2 className="text-3xl sm:text-4xl font-black tracking-wide mb-1 text-white sports-font uppercase">
      TRADE DEADLINE
    </h2>
    <p className="text-slate-400 mb-6 text-sm sm:text-base font-medium">
      The trade deadline is 24 hours away. The media is swarming.
    </p>

    {/* TEAM OUTLOOK PANEL */}
    <div className="bg-[#101410] border border-[rgba(255,255,255,0.08)] p-5 sm:p-6 rounded-xl mb-6 max-w-lg mx-auto text-left flex items-center justify-between shadow-lg">
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
          TEAM OUTLOOK
        </p>
        <p className="text-xl sm:text-2xl font-black text-white sports-font uppercase leading-tight mb-1">
          {isContender ? 'BUYING / CONTENDING' : 'SELLING / REBUILDING'}
        </p>
        <p className={`text-xs sm:text-sm font-bold uppercase flex items-center gap-2 ${isContender ? 'text-[#22E748]' : 'text-[#ef4444]'}`}>
          Currently #{standings} in the {res.currentLg}
          <span className={`text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider font-sans border ${isContender ? 'bg-[#22E748]/10 border-[#22E748]/30 text-[#22E748]' : 'bg-[#ef4444]/10 border-[#ef4444]/30 text-[#ef4444]'}`}>
            {isContender ? 'IN PLAYOFFS' : 'OUT OF PLAYOFFS'}
          </span>
        </p>
      </div>
      <div className="hidden sm:block text-4xl sm:text-5xl shrink-0">
        {isContender ? '📈' : '📉'}
      </div>
    </div>

    {/* ACTION BUTTONS */}
    <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md sm:max-w-lg mx-auto">
      <button 
        onClick={handleSkip} 
        className="py-3.5 px-6 sm:px-8 rounded-xl font-black sports-font tracking-widest text-lg transition-all hover:scale-[1.02] w-full sm:w-auto flex-1 cursor-pointer bg-[#22E748]/10 hover:bg-[#22E748]/20 border border-[#22E748]/40 text-[#22E748] shadow-[0_0_15px_rgba(34,231,75,0.15)] hover:shadow-[0_0_25px_rgba(34,231,75,0.25)]"
      >
        {isContender ? 'STAY THE COURSE' : 'RIDE IT OUT'}
      </button>

      {isPro && (
        <button 
          onClick={handleTradeRequest} 
          disabled={hasDemandedTrade}
          className={`py-3 px-6 sm:px-8 rounded-xl font-black sports-font tracking-widest transition-all w-full sm:w-auto flex-1 flex flex-col items-center justify-center gap-1.5 ${
            hasDemandedTrade 
              ? 'bg-[#101410] border border-slate-800 text-slate-500 cursor-not-allowed opacity-50' 
              : 'bg-[#ef4444]/10 hover:bg-[#ef4444]/20 border border-[#ef4444]/40 text-[#ef4444] shadow-[0_0_15px_rgba(239,68,68,0.15)] cursor-pointer hover:scale-[1.02]'
          }`}
        >
          <span className="text-lg leading-none">{hasDemandedTrade ? 'REQUEST SUBMITTED' : 'DEMAND TRADE'}</span>
          {!hasDemandedTrade && (
            <span className="text-[10px] sm:text-xs font-sans font-bold tracking-widest text-[#ef4444] uppercase leading-none opacity-80">
              ⚡ RISKY GAMBLE
            </span>
          )}
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
                { 
                  label: 'Swallow Rebound',  
                  tag: 'AGI',       
                  desc: 'Absorb the initial shot cleanly into your chest to deny any second-chance opportunities.',
                  hover: 'hover:border-[#F59E0B]', 
                  pill: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30', 
                  chance: 0.4 + player.physicality / 200,                    
                  win: 'You smothered the rebound!',      
                  fail: 'You gave up a juicy rebound.' 
                },
                { 
                  label: 'Direct Traffic',   
                  tag: 'IQ',        
                  desc: 'Completely control crease positioning and shout out defensive assignments during the rush.',
                  hover: 'hover:border-[#22E748]', 
                  pill: 'text-[#22E748] bg-[#22E748]/10 border-[#22E748]/30', 
                  chance: 0.4 + player.hockeyIQ / 200,                       
                  win: 'You perfectly directed traffic!', 
                  fail: 'You were out of position.' 
                },
                { 
                  label: 'Desperation Save', 
                  tag: 'REF + AGI', 
                  desc: 'Make an acrobatic wind-mill glove save on a late backdoor cross-crease pass.',
                  hover: 'hover:border-[#3b82f6]', 
                  pill: 'text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/30', 
                  chance: 0.4 + (player.shooting + player.physicality) / 400, 
                  win: 'You made an unbelievable save!',   
                  fail: "Couldn't get there in time." 
                },
              ]
            : [
                { 
                  label: 'Big Hit',       
                  tag: 'PHY',       
                  desc: 'Step into their star forward along the boards to set an aggressive physical tone.',
                  hover: 'hover:border-[#F59E0B]', 
                  pill: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30', 
                  chance: 0.4 + player.physicality / 200,                 
                  win: 'You laid a massive hit!',  
                  fail: 'You missed the hit.' 
                },
                { 
                  label: 'Find Open Ice', 
                  tag: 'IQ',        
                  desc: 'Read the defensive coverage to slip into the high slot for a clean, unguarded shot.',
                  hover: 'hover:border-[#22E748]', 
                  pill: 'text-[#22E748] bg-[#22E748]/10 border-[#22E748]/30', 
                  chance: 0.4 + player.hockeyIQ / 200,                    
                  win: 'You found the soft spot!', 
                  fail: 'Skated into coverage.' 
                },
                { 
                  label: 'Rush the Net',  
                  tag: 'SKT + SHT', 
                  desc: 'Burn past their defenseman down the wing and drive hard toward the net for a goal.',
                  hover: 'hover:border-[#3b82f6]', 
                  pill: 'text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/30', 
                  chance: 0.4 + (player.skating + player.shooting) / 400, 
                  win: 'You ripped it top shelf!', 
                  fail: 'Fumbled the puck.' 
                },
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
                    className={`bg-[#101410] hover:bg-[#1a2230] border border-[rgba(255,255,255,0.065)] ${c.hover} p-5 sm:p-6 rounded-xl transition-all cursor-pointer flex flex-col justify-between items-center text-left group shadow-lg min-h-[200px]`}
                  >
                    <div className="w-full">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-black text-xl sm:text-2xl text-white sports-font leading-tight group-hover:scale-105 transition-transform">
                          {c.label}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-400 font-sans leading-relaxed mb-4">
                        {c.desc}
                      </p>
                    </div>

                    {/* ODDS & REWARD BADGES */}
                    <div className="w-full bg-black/40 rounded-lg p-2.5 border border-[rgba(255,255,255,0.04)] flex flex-col items-center justify-center gap-1.5 font-sans mt-auto">
                      
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                        SUCCESS ODDS: <span className={`font-black sports-font text-xs ml-1 ${c.chance >= 0.65 ? 'text-[#22E748]' : c.chance >= 0.50 ? 'text-[#F59E0B]' : 'text-[#ef4444]'}`}>{Math.round(c.chance * 100)}%</span>
                      </p>

                      <div className="flex justify-center items-center gap-1.5 flex-wrap">
                        {String(c.tag).split('+').map((statLabel, idx) => {
                          const s = statLabel.trim();
                          let colorCls = 'text-white bg-white/10 border-white/30'; 
                          if (['PHY'].includes(s)) colorCls = 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30'; 
                          if (['SKT', 'AGI'].includes(s)) colorCls = 'text-[#22E748] bg-[#22E748]/10 border-[#22E748]/30'; 
                          if (['SHT', 'REF'].includes(s)) colorCls = 'text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/30'; 
                          if (['IQ'].includes(s)) colorCls = 'text-[#c084fc] bg-[#c084fc]/10 border-[#c084fc]/30'; 
                          if (['STA'].includes(s)) colorCls = 'text-[#06b6d4] bg-[#06b6d4]/10 border-[#06b6d4]/30';
                          
                          return (
                            <span key={idx} className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider whitespace-nowrap border ${colorCls}`}>
                              {s}
                            </span>
                          );
                        })}
                      </div>
                      
                    </div>
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
             if (isJunior) {
                 if (seasonRecap?.memCupStatus === 'won') {
                     narrativeTitle = 'MEMORIAL CUP CHAMPIONS';
                     narrative = `Absolute glory. You conquered the ${player.league} and lifted the Memorial Cup, cementing your legacy as a junior hockey legend.`;
                 } else if (seasonRecap?.memCupStatus === 'lost') {
                     narrativeTitle = 'REGIONAL CHAMPIONS';
                     narrative = `You dominated your league and lifted the ${titles.cupName}, but fell agonizingly short in the Memorial Cup against the nation's best. A bittersweet, but incredible season.`;
                 } else {
                     narrativeTitle = `${player.league} CHAMPIONS`;
                     narrative = `You climbed the mountain and won the ${titles.cupName}!`;
                 }
             } else {
                 narrativeTitle = 'CHAMPIONS';
                 narrative = `Absolute glory. You climbed the mountain and won the ${titles.cupName}!`;
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
                  narrative += ` Adding insult to injury, your arch-rivals—${['SHL', 'LIIGA'].includes(player.league) ? '' : 'the '}${rivalName}—lifted the trophy.`;
              } else if (hasHardware && pw > 0 && pw < maxWins - 1) {
                  narrative += " Your individual brilliance wasn't enough to carry the team.";
              }
          } else {
              narrativeTitle = 'MISSED THE DANCE';
              narrative = 'A disappointing campaign. Rebuild for next year.';
              if (rivalWonTitle) {
                  narrative = `A nightmare season. Not only did you miss the playoffs, but your arch-rivals, ${['SHL', 'LIIGA'].includes(player.league) ? '' : 'the '}${rivalName}, won it all.`;
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
                <li className="border-l-4 border-[#3b82f6] pl-4 py-1">🏅 {['SHL', 'LIIGA'].includes(player.league) ? '' : 'The '}{getFullTeamName(player.team, player.league)} finished <strong className="text-white">#{seasonRecap?.standings || '-'}</strong> in the {player.league}.</li>
                
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
                          : `Eliminated after ${seasonRecap?.playoffWins || 0} playoff win${seasonRecap?.playoffWins === 1 ? '' : 's'}.`}
                  </li>
                ) : (
                  <li className="border-l-4 border-slate-600 pl-4 py-1">⛳ Missed the playoffs.</li>
                )}
                {seasonRecap?.awards && seasonRecap.awards.length > 0 && (
                  <li className="border-l-4 border-[#F59E0B] pl-4 py-2 mt-4 bg-[#F59E0B]/10 rounded-r-lg">
                    <strong className="text-[#F59E0B] block text-[10px] tracking-widest uppercase mb-1">🏆 HARDWARE SECURED</strong>
                    {seasonRecap.awards.map(aw => <div key={aw} className="text-white text-sm font-bold">{aw}</div>)}
                  </li>
                )}
              </ul>

              {/* STICKY FOOTER ACTION BUTTONS */}
              <div className="sticky bottom-0 left-0 w-full pt-4 pb-2 bg-gradient-to-t from-[#040505] via-[#040505] to-transparent z-40 mt-8 flex flex-col sm:flex-row gap-4">
                <button onClick={advanceToOffseason} className="btn-primary flex-1 py-4 rounded-xl text-lg sm:text-xl cursor-pointer sports-font tracking-widest shadow-2xl">
                  PROCEED TO OFFSEASON
                </button>
                
                {player.league === 'NCAA' && (
                   <button onClick={() => {
                       // 1. Unlock the achievement
                       unlockAchievement('transfer_portal'); 
                       
                       // 2. Take the immediate PR hit for leaving
                       setPlayer(p => ({
                           ...p,
                           idolatry: capIdol(p.idolatry - 15)
                       }));

                       // 3. Generate 3 random programs
                       let pool = ncaaTeams?.filter(t => t.id !== player.team) || [];
                       pool = [...pool].sort(() => 0.5 - Math.random()).slice(0, 3);
                       if (pool.length === 0) pool = [{ id: 'UNK', name: 'Unknown Program' }];

                       // 4. Build dynamic offers with perks/flaws
                       const offeredTeams = pool.map(t => {
                           const possiblePerks = [
                               { text: '📈 Elite Coaching (+2 OVR)', ovr: 2, idol: 0, money: 0, color: 'text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/30' },
                               { text: '🏟️ National Spotlight (+25 Fans)', ovr: 0, idol: 25, money: 0, color: 'text-[#22E748] bg-[#22E748]/10 border-[#22E748]/30' },
                               { text: '💰 Massive NIL Deal ($100k)', ovr: 0, idol: 0, money: 100000, color: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30' },
                               { text: '⚡ Run & Gun System (+1 OVR, +10 Fans)', ovr: 1, idol: 10, money: 0, color: 'text-[#22E748] bg-[#22E748]/10 border-[#22E748]/30' }
                           ];

                           const possibleFlaws = [
                               { text: '⚠️ Crowded Depth Chart (-1 OVR)', ovr: -1, idol: 0, money: 0 },
                               { text: '⚠️ Rebuilding Phase (-10 Fans)', ovr: 0, idol: -10, money: 0 },
                               { text: '⚠️ Strict System (-5 Fans)', ovr: 0, idol: -5, money: 0 }
                           ];

                           const perkCount = Math.floor(Math.random() * 2) + 1; // 1 to 2 perks
                           const flawCount = Math.floor(Math.random() * 2);     // 0 to 1 flaw

                           const selectedPerks = [...possiblePerks].sort(() => 0.5 - Math.random()).slice(0, perkCount);
                           const selectedFlaws = [...possibleFlaws].sort(() => 0.5 - Math.random()).slice(0, flawCount);

                           let totalOvr = 0, totalIdol = 0, totalMoney = 0;
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

                       const choices = offeredTeams.map(t => ({
                           label: `Commit to ${t.name}`, 
                           perks: t.perks,
                           flaws: t.flaws,
                           isRisky: false, 
                           feedback: `You signed your transfer paperwork and are officially a member of ${t.name}!`, 
                           effect: { idol: t.finalIdol, ovr: t.finalOvr, money: t.finalMoney }, 
                           action: 'JOIN_NCAA', 
                           actionData: t.id
                       }));

                       setActiveEvent({
                           title: 'TRANSFER PORTAL OFFERS',
                           desc: `You officially entered the transfer portal. Your former fans are furious (Fan Status -15), but several top programs have immediately reached out with scholarship and NIL offers. Weigh your options carefully.`,
                           choices: choices,
                           isPortalEvent: true
                       });
                       
                       setScreen('event');
                   }} className="bg-[#ef4444]/10 hover:bg-[#ef4444]/20 border border-[#ef4444]/40 text-[#ef4444] flex-1 py-4 rounded-xl text-lg sm:text-xl cursor-pointer sports-font tracking-widest transition-all shadow-[0_0_15px_rgba(239,68,68,0.15)] hover:shadow-[0_0_25px_rgba(239,68,68,0.25)] hover:scale-[1.02]">
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
            <div className={`game-panel p-6 sm:p-12 mt-2 border-t-2 ${accent.border} text-center flex flex-col`}>
              {!minigameStarted ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <div className="inline-block px-4 py-1.5 bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-full text-[#F59E0B] text-xs sm:text-sm font-black uppercase tracking-widest mb-6">
                    ⚠️ Live Play Opportunity
                  </div>
                  <h2 className={`text-4xl sm:text-6xl font-black mb-6 ${accent.heading} sports-font tracking-tighter uppercase leading-tight text-balance sm:whitespace-nowrap`}>{mg?.title}</h2>
                  <p className="text-lg sm:text-2xl text-slate-300 mb-10 max-w-2xl mx-auto text-center leading-relaxed">{mg?.desc}</p>
                  
                  <button
                    onClick={() => setMinigameStarted(true)}
                    className="btn-primary py-4 px-10 rounded-xl text-xl sm:text-2xl cursor-pointer sports-font tracking-widest shadow-[0_0_20px_rgba(34,231,72,0.3)] transition-transform hover:scale-105"
                  >
                    🟢 ENTER SITUATION
                  </button>
                </div>
              ) : (
                <div className="flex flex-col h-full w-full fade-up">
                  <h2 className={`text-2xl sm:text-3xl font-black mb-6 ${accent.heading} sports-font tracking-tighter uppercase leading-tight`}>{mg?.title}</h2>
                  <div className="bg-black/50 p-6 sm:p-10 rounded-2xl border border-[rgba(255,255,255,0.05)] shadow-inner min-h-[350px] sm:min-h-[400px] flex flex-col justify-center relative flex-1">
                     {mg?.gameType === 'shootout' && <ShootoutGame player={player} onComplete={(win) => handleInteractiveResult(win, mg.reward, mg.successMsg, mg.failMsg)} />}
                     {mg?.gameType === 'faceoff' && <FaceoffGame player={player} onComplete={(win) => handleInteractiveResult(win, mg.reward, mg.successMsg, mg.failMsg)} />}
                     {mg?.gameType === 'crease' && <CreaseGame player={player} onComplete={(win) => handleInteractiveResult(win, mg.reward, mg.successMsg, mg.failMsg)} />}
                     {mg?.gameType === 'film' && <FilmRoomGame player={player} onComplete={(win) => handleInteractiveResult(win, mg.reward, mg.successMsg, mg.failMsg)} />}
                     {mg?.gameType === 'deflect' && <DeflectionGame player={player} onComplete={(win) => handleInteractiveResult(win, mg.reward, mg.successMsg, mg.failMsg)} />}
                     {mg?.gameType === 'block' && <ShotBlockGame player={player} onComplete={(win) => handleInteractiveResult(win, mg.reward, mg.successMsg, mg.failMsg)} />}
                     {mg?.gameType === 'breakaway' && <BreakawayGame player={player} onComplete={(win) => handleInteractiveResult(win, mg.reward, mg.successMsg, mg.failMsg)} />}
                     {mg?.gameType === 'onetimer' && <OneTimerGame player={player} onComplete={(win) => handleInteractiveResult(win, mg.reward, mg.successMsg, mg.failMsg)} />}
                  </div>
                </div>
              )}
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

            <div className="sticky bottom-0 left-0 w-full pt-4 pb-2 bg-gradient-to-t from-[#040505] via-[#040505] to-transparent z-40 mt-4">
               <button onClick={handleContinueEvent} className="btn-primary py-4 px-12 rounded-xl text-lg sm:text-xl cursor-pointer sports-font tracking-widest w-full sm:w-auto shadow-2xl">
                 CONTINUE CAREER ➔
               </button>
            </div>
          </div>
        )}

        {screen === 'playoffs' && (() => {
          const activeRound = playoffs.bracket[playoffs.activeRoundIndex];
          const playerMatchIndex = activeRound?.findIndex(m => m.isPlayerSeries);
          const activeMatch = playerMatchIndex >= 0 ? activeRound[playerMatchIndex] : null;
          const titles = getPlayoffTitles(player.league);

          const getTeamLabel = (team) => {
            if (!team || team.id === 'TBD' || team.name === 'TBD' || team.id?.startsWith('TBD')) return 'TBD';
            return team.id; // Forces 3-letter abbreviation to fit the bracket
          };

          return (
            <div className="game-panel p-3 sm:p-6 mt-2 border-t-2 border-t-[#F59E0B] flex flex-col items-center relative">
              
              {/* DYNAMIC LEAGUE PLAYOFF HEADER */}
              
             {/* CONFERENCE HEADERS — only shown for leagues that actually have 2 confs */}
              <div className="flex justify-between w-full max-w-5xl px-2 mb-4 text-xs sm:text-sm md:text-base font-black sports-font uppercase tracking-wider">
                {playoffs.hasConfs ? (
                  <>
                    <span className="text-[#ef4444]">WESTERN</span>
                    <span className="text-[#F59E0B]">{titles.final}</span>
                    <span className="text-[#3b82f6]">EASTERN</span>
                  </>
                ) : (
                  <span className="w-full text-center text-[#F59E0B]">{titles.final}</span>
                )}
              </div>

              {/* BRACKET VIEW */}
              <div className="w-full overflow-x-auto pb-6 mb-4 border-b border-[rgba(255,255,255,0.065)]">
                <div className="flex items-stretch gap-2 sm:gap-3 w-max mx-auto px-4 min-h-[250px]">
                  {playoffs.hasConfs ? (
                    <>
                      {/* WESTERN CONFERENCE (LEFT) */}
                      <div className="flex gap-1.5 sm:gap-2.5">
                        {playoffs.bracket.slice(0, playoffs.bracket.length - 1).map((round, rIdx) => (
                          <div key={`left-${rIdx}`} className="flex flex-col justify-around gap-1 min-w-[95px] sm:min-w-[110px]">
                            <p className="text-center text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                              {(getPlayoffRounds(playoffs.currentLg)[rIdx]?.name || `ROUND ${rIdx + 1}`).toUpperCase()}
                            </p>
                            {round.map((match, mIdx) => {
                              if (match.conf !== 'West') return null;
                              const isLocked = match.status === 'locked';
                              const rWN = getWinsNeeded(playoffs.currentLg, rIdx);
                              return (
                                <div key={mIdx} className={`rounded p-1 sm:p-1.5 border flex flex-col gap-0.5 transition-all duration-300 ${isLocked ? 'opacity-30 grayscale' : 'opacity-100'} ${match.isPlayerSeries ? 'border-[#3b82f6] bg-[#3b82f6]/10 shadow-[0_0_8px_rgba(59,130,246,0.3)] ring-1 ring-[#3b82f6]' : 'border-[rgba(255,255,255,0.065)] bg-[#101410]'}`}>
                                  <div className={`flex justify-between items-center text-[10px] sm:text-xs ${match.wins1 >= rWN ? 'text-[#22E748]' : 'text-slate-300'}`}>
                                    <span className="font-bold truncate max-w-[65px] sm:max-w-[75px]">{getTeamLabel(match.team1)}</span>
                                    <span className="font-black sports-font ml-1">{match.wins1}</span>
                                  </div>
                                  <div className={`flex justify-between items-center text-[10px] sm:text-xs ${match.wins2 >= rWN ? 'text-[#22E748]' : 'text-slate-300'}`}>
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
                        <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none mix-blend-screen">
                        <TrophyImage league={playoffs.currentLg} className="w-24 h-24 sm:w-28 sm:h-28 mt-4" />
                      </div>
                        <p className="text-center text-[8px] sm:text-[9px] font-bold text-[#F59E0B] uppercase tracking-wider">
                          {(getPlayoffRounds(playoffs.currentLg)[playoffs.bracket.length - 1]?.name || 'FINAL').toUpperCase()}
                        </p>
                        {playoffs.bracket[playoffs.bracket.length - 1].map((match, mIdx) => {
                          const isLocked = match.status === 'locked';
                          const rWN = getWinsNeeded(playoffs.currentLg, playoffs.bracket.length - 1);
                          return (
                            <div key={mIdx} className={`relative z-10 rounded-lg p-2 border flex flex-col gap-1 transition-all duration-300 ${isLocked ? 'opacity-30 grayscale border-[#F59E0B]/20 bg-[#101410]' : match.isPlayerSeries ? 'border-[#3b82f6] bg-[#3b82f6]/10 shadow-[0_0_15px_rgba(59,130,246,0.4)]' : 'border-[#F59E0B]/50 bg-[#101410]'}`}>
                              <div className={`flex justify-between items-center text-xs sm:text-sm ${match.wins1 >= rWN ? 'text-[#22E748]' : 'text-slate-300'}`}>
                                <span className="font-bold truncate max-w-[75px] sm:max-w-[95px]">{getTeamLabel(match.team1)}</span>
                                <span className="font-black sports-font text-base ml-1">{match.wins1}</span>
                              </div>
                              <div className={`flex justify-between items-center text-xs sm:text-sm ${match.wins2 >= rWN ? 'text-[#22E748]' : 'text-slate-300'}`}>
                                <span className="font-bold truncate max-w-[75px] sm:max-w-[95px]">{getTeamLabel(match.team2)}</span>
                                <span className="font-black sports-font text-base ml-1">{match.wins2}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* EASTERN CONFERENCE (RIGHT REVERSED) */}
                      <div className="flex flex-row-reverse gap-1.5 sm:gap-2.5">
                        {playoffs.bracket.slice(0, playoffs.bracket.length - 1).map((round, rIdx) => (
                          <div key={`right-${rIdx}`} className="flex flex-col justify-around gap-1 min-w-[95px] sm:min-w-[110px]">
                            <p className="text-center text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                              {(getPlayoffRounds(playoffs.currentLg)[rIdx]?.name || `ROUND ${rIdx + 1}`).toUpperCase()}
                            </p>
                            {round.map((match, mIdx) => {
                              if (match.conf !== 'East') return null;
                              const isLocked = match.status === 'locked';
                              const rWN = getWinsNeeded(playoffs.currentLg, rIdx);
                              return (
                                <div key={mIdx} className={`rounded p-1 sm:p-1.5 border flex flex-col gap-0.5 transition-all duration-300 ${isLocked ? 'opacity-30 grayscale' : 'opacity-100'} ${match.isPlayerSeries ? 'border-[#3b82f6] bg-[#3b82f6]/10 shadow-[0_0_8px_rgba(59,130,246,0.3)] ring-1 ring-[#3b82f6]' : 'border-[rgba(255,255,255,0.065)] bg-[#101410]'}`}>
                                  <div className={`flex justify-between items-center text-[10px] sm:text-xs ${match.wins1 >= rWN ? 'text-[#22E748]' : 'text-slate-300'}`}>
                                    <span className="font-bold truncate max-w-[65px] sm:max-w-[75px]">{getTeamLabel(match.team1)}</span>
                                    <span className="font-black sports-font ml-1">{match.wins1}</span>
                                  </div>
                                  <div className={`flex justify-between items-center text-[10px] sm:text-xs ${match.wins2 >= rWN ? 'text-[#22E748]' : 'text-slate-300'}`}>
                                    <span className="font-bold truncate max-w-[65px] sm:max-w-[75px]">{getTeamLabel(match.team2)}</span>
                                    <span className="font-black sports-font ml-1">{match.wins2}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    /* SINGLE-BRACKET LAYOUT (QMJHL, NCAA Frozen Four, SHL, Liiga) */
                    <div className="flex gap-1.5 sm:gap-2.5">
                      {playoffs.bracket.map((round, rIdx) => (
                        <div key={`single-${rIdx}`} className="flex flex-col justify-around gap-1 min-w-[95px] sm:min-w-[110px]">
                          <p className="text-center text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                            {(getPlayoffRounds(playoffs.currentLg)[rIdx]?.name || `ROUND ${rIdx + 1}`).toUpperCase()}
                          </p>
                          {round.map((match, mIdx) => {
                            const isLocked = match.status === 'locked';
                            const rWN = getWinsNeeded(playoffs.currentLg, rIdx);
                            const isFinal = rIdx === playoffs.bracket.length - 1;
                            return (
                              <div key={mIdx} className={`rounded p-1 sm:p-1.5 border flex flex-col gap-0.5 transition-all duration-300 ${isLocked ? 'opacity-30 grayscale' : 'opacity-100'} ${match.isPlayerSeries ? 'border-[#3b82f6] bg-[#3b82f6]/10 shadow-[0_0_8px_rgba(59,130,246,0.3)] ring-1 ring-[#3b82f6]' : isFinal ? 'border-[#F59E0B]/50 bg-[#101410]' : 'border-[rgba(255,255,255,0.065)] bg-[#101410]'}`}>
                                <div className={`flex justify-between items-center text-[10px] sm:text-xs ${match.wins1 >= rWN ? 'text-[#22E748]' : 'text-slate-300'}`}>
                                  <span className="font-bold truncate max-w-[65px] sm:max-w-[75px]">{getTeamLabel(match.team1)}</span>
                                  <span className="font-black sports-font ml-1">{match.wins1}</span>
                                </div>
                                <div className={`flex justify-between items-center text-[10px] sm:text-xs ${match.wins2 >= rWN ? 'text-[#22E748]' : 'text-slate-300'}`}>
                                  <span className="font-bold truncate max-w-[65px] sm:max-w-[75px]">{getTeamLabel(match.team2)}</span>
                                  <span className="font-black sports-font ml-1">{match.wins2}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* CARD MINIGAME GRID & NEXT ROUND PROCEED BUTTON */}
              {activeMatch && (
                 <div className="max-w-sm sm:max-w-md w-full bg-[#101410] border border-[rgba(255,255,255,0.065)] p-5 sm:p-6 rounded-xl text-center shadow-lg mx-auto mb-4">

                    {/* {/* TOP STATUS LINE — always occupies the same slot so the grid below never shifts */}
                    <div className="mb-6 flex flex-col items-center">
                      
                      {activeMatch.status === 'playing' && (
                        <>
                          <p className="text-[11px] sm:text-xs font-black text-[#3b82f6] uppercase tracking-widest mb-3 font-sans">
                             ROUND {playoffs.activeRoundIndex + 1} MATCHUP
                          </p>
                          <TeamLogo teamId={activeMatch.team2?.id || 'UNK'} league={playoffs.currentLg} isAHL={playoffs.currentLg === 'AHL'} size="large" />
                          <p className="text-base sm:text-xl text-slate-300 font-bold uppercase sports-font text-balance leading-tight mt-3">
                             VS. {['SHL', 'LIIGA'].includes(playoffs.currentLg) ? '' : 'THE '}{getFullTeamName(activeMatch.team2?.id, playoffs.currentLg)}
                          </p>
                        </>
                      )}
                      
                      {activeMatch.status === 'won' && (
                        <>
                          <p className="text-[11px] sm:text-xs font-black text-[#22E748] uppercase tracking-widest mb-3 font-sans">
                             ⚡ SERIES VICTORY! ({activeMatch.wins1}-{activeMatch.wins2})
                          </p>
                          <TeamLogo teamId={activeMatch.team2?.id || 'UNK'} league={playoffs.currentLg} isAHL={playoffs.currentLg === 'AHL'} size="large" />
                          <p className="text-base sm:text-xl text-slate-300 font-bold uppercase sports-font text-balance leading-tight mt-3">
                             DEFEATED {['SHL', 'LIIGA'].includes(playoffs.currentLg) ? '' : 'THE '}{getFullTeamName(activeMatch.team2?.id, playoffs.currentLg)}
                          </p>
                        </>
                      )}
                      
                      {activeMatch.status === 'lost' && (
                        <>
                          <p className="text-[11px] sm:text-xs font-black text-[#ef4444] uppercase tracking-widest mb-3 font-sans">
                             💔 ELIMINATED ({activeMatch.wins1}-{activeMatch.wins2})
                          </p>
                          <TeamLogo teamId={activeMatch.team2?.id || 'UNK'} league={playoffs.currentLg} isAHL={playoffs.currentLg === 'AHL'} size="large" />
                          <p className="text-base sm:text-xl text-slate-300 font-bold uppercase sports-font text-balance leading-tight mt-3">
                             DEFEATED BY {['SHL', 'LIIGA'].includes(playoffs.currentLg) ? '' : 'THE '}{getFullTeamName(activeMatch.team2?.id, playoffs.currentLg)}
                          </p>
                        </>
                      )}
                    </div>

                    {/* 9-CARD GRID — stays in the same place whether the series is playing, won, or lost */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
                      {(activeMatch.deck || []).map((item, cIndex) => {
                        const isRevealed = (activeMatch.revealed || []).includes(cIndex);
                        const isOver = ['won', 'lost'].includes(activeMatch.status);
                        const showForcefully = isOver && !isRevealed;
                        const isWinCard = item && (item.isWin || item.win);
                        
                        let btnClass = 'h-20 sm:h-24 text-3xl sm:text-4xl font-black rounded-lg border transition-all duration-200 flex items-center justify-center sports-font ';
                        
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
                    {activeMatch.status === 'playing' && (() => {
                      const gpm = getGamesPerMatchup(playoffs.currentLg, playoffs.activeRoundIndex);
                      const formatText = gpm === 1 ? 'Single Elimination' : `Best-of-${gpm}`;
                      return (
                        <p className="text-xs sm:text-sm text-slate-400 font-sans mt-2">Select a card to play the next game ({formatText})</p>
                      );
                    })()}
                    {activeMatch.status === 'won' && playoffs.overallStatus !== 'won_cup' && (
                      <button
                        onClick={advancePlayoffRound}
                        className="btn-primary w-full py-3.5 mt-2 rounded-lg font-black sports-font text-sm sm:text-base uppercase tracking-wider transition-transform hover:scale-105 cursor-pointer shadow-lg"
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
                     className="btn-primary w-full py-4 px-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-transform hover:scale-105 cursor-pointer shadow-lg"
                   >
                     <span className="text-[10px] sm:text-xs font-bold text-white/70 uppercase tracking-widest font-sans">PROCEED TO THE</span>
                     <span className="text-lg sm:text-xl font-black sports-font uppercase text-white text-center text-balance leading-none">CHAMPIONSHIP FINAL VS. {finalOpponent.toUpperCase()} ➔</span>
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

                  <div className={`bg-[#1a2230] border ${isFinal ? 'border-[#F59E0B]/50 shadow-[0_0_20px_rgba(245,158,11,0.2)]' : 'border-[#3b82f6]/30 shadow-lg'} rounded-xl p-6 sm:p-8 text-center`}>
                     <div className="text-4xl mb-4 animate-bounce">{isFinal ? '🏆' : '🏒'}</div>
                     <h4 className="text-xl sm:text-2xl font-black text-white sports-font uppercase mb-3">LIVE MINIGAME SCENARIO</h4>
                     <p className="text-sm sm:text-base text-slate-300 font-sans mb-8 max-w-lg mx-auto">
                       {isFinal 
                         ? "This is for all the glory. Step onto the ice and complete a live interactive scenario to win the Memorial Cup!" 
                         : "The Semi-Final is a do-or-die elimination game. Step onto the ice and complete a live interactive scenario to secure your spot in the Championship Final!"}
                     </p>
                     <button onClick={() => triggerMinigame('memcup')} className={`py-4 px-8 rounded-xl font-black sports-font text-lg uppercase tracking-widest hover:scale-105 transition-transform cursor-pointer ${isFinal ? 'shadow-[0_0_15px_rgba(245,158,11,0.3)] bg-[#F59E0B] text-black hover:bg-[#d97706]' : 'btn-primary shadow-[0_0_15px_rgba(34,231,75,0.3)]'}`}>
                        {isFinal ? 'ENTER CHAMPIONSHIP SCENARIO' : 'ENTER SEMI-FINAL SCENARIO'}
                     </button>
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
                        {(player.rights || player.draftTeam) ? 'FRONT OFFICE IMPRESSION' : 'NHL DRAFT IMPACT'}
                      </p>
                      <p className={`text-sm sm:text-base font-black sports-font leading-tight ${
                        memCup.status === 'won' ? 'text-[#22E748]' : 'text-slate-300'
                      }`}>
                        {memCup.status === 'won' 
                          ? ((player.rights || player.draftTeam) ? '🚀 EXCEEDED EXPECTATIONS' : (player.ovr >= 65 ? '🚀 LOCK FOR TOP 10 PICK' : '🚀 RISES TO 1ST ROUND'))
                          : ((player.rights || player.draftTeam) ? '➡️ STABLE DEVELOPMENT' : '📉 MINOR DRAFT HIT')}
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
            
            <div className="flex sm:grid sm:grid-cols-3 gap-4 sm:gap-6 overflow-x-auto sm:overflow-visible snap-x snap-mandatory pb-6 pt-2 px-2 sm:px-0 w-full">
              {(freeAgencyOffers || []).map((o, i) => {
                // 1. Arch-Rival Check
                const rivalObj = getPrimaryRival ? getPrimaryRival(player.team, player.league) : null;
                const isRival = rivalObj && (rivalObj.id === o.team || rivalObj.name === o.team);

                // 2. Returning Home Check
                const isDraftTeam = (player.draftTeam || player.rights) === o.team;
                const hasPlayedFor = (player.teamsPlayedFor || []).includes(o.team);
                const isLovedStatus = player.idolatry >= 400; // Loved / Local Hero or higher
                const isReturnHome = isDraftTeam && player.team !== o.team && hasPlayedFor && isLovedStatus;

                return (
                  <div 
                    key={i} 
                    className={`bg-[#101410] border p-5 sm:p-6 rounded-xl flex flex-col text-left relative overflow-hidden transition-all shrink-0 w-[85vw] sm:w-auto snap-center ${
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
                      <TeamLogo teamId={o.team} league={o.league || 'NHL'} isAHL={o.league === 'AHL'} />
                      <div>
                        <h3 className="text-xl sm:text-2xl font-black text-white sports-font">{getFullTeamName(o.team, o.league)}</h3>
                        {o.league && o.league !== 'NHL' && (
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-sans">{o.league}</span>
                        )}
                        {isReturnHome && <span className="text-[9px] font-bold text-[#F59E0B] uppercase tracking-wider font-sans">Your Draft Team</span>}
                      </div>
                    </div>

                    <p className="text-2xl sm:text-3xl font-black text-[#22E748] mb-1 sports-font">{formatMoney(o.salary)}<span className="text-xs sm:text-sm text-slate-400 font-sans"> /yr</span></p>
                    <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase mb-2">{o.years}-year contract</p>
                    
                    <p className="text-[10px] sm:text-xs font-black text-[#3b82f6] bg-[#3b82f6]/10 border border-[#3b82f6]/30 rounded px-2 py-1 uppercase mb-2 text-center">
                      ROLE: {o.role || 'Depth'}
                    </p>

                    {/* DYNAMIC PITCH TAG */}
                    {o.state && o.state !== 'Current Club' && (
                        <p className={`text-[9px] sm:text-[10px] font-black uppercase mb-4 text-center tracking-widest ${o.state === 'Contender' ? 'text-[#F59E0B]' : o.state === 'Rebuilding' ? 'text-[#ef4444]' : 'text-slate-400'}`}>
                           {o.state === 'Contender' ? '🏆 CUP CONTENDER' : o.state === 'Rebuilding' ? '🏗️ REBUILDING' : '⚖️ MIDDLE OF THE PACK'}
                        </p>
                    )}
                    {(!o.state || o.state === 'Current Club') && (
                        <p className="text-[9px] sm:text-[10px] font-black uppercase mb-4 text-center tracking-widest text-slate-400">
                           🤝 STAY LOYAL
                        </p>
                    )}

                    <p className={`text-[10px] sm:text-xs font-bold uppercase mb-6 flex items-center justify-center gap-1 ${o.idolHit >= 0 ? 'text-[#22E748]' : 'text-[#ef4444]'}`}>
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
                    {/* ARBITRATION BUTTON */}
                    {o.type === 'QUALIFYING OFFER' && (
                       <button
                          onClick={() => handleArbitration(o)}
                          className="w-full py-2.5 mt-2 rounded-lg bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/40 font-black sports-font tracking-widest text-sm hover:bg-[#ef4444]/20 transition-colors cursor-pointer"
                       >
                          FILE FOR ARBITRATION
                       </button>
                    )}

                    {/* NEGOTIATION BUTTON */}
                    {!o.negotiated && o.type !== 'QUALIFYING OFFER' && player.ovr >= 80 && (
                       <button
                          onClick={() => startNegotiation(o)}
                          className="w-full py-2.5 mt-2 rounded-lg bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/40 font-black sports-font tracking-widest text-sm hover:bg-[#3b82f6]/20 transition-colors cursor-pointer shadow-sm"
                       >
                          🤝 NEGOTIATE SALARY
                       </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {screen === 'negotiation' && (() => {
          return (
            <div className="game-panel p-6 sm:p-10 mt-2 border-t-2 border-t-[#F59E0B] text-center max-w-xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-black text-white uppercase mb-2 sports-font tracking-wide">CONTRACT NEGOTIATION</h2>
              <p className="text-sm sm:text-base text-slate-400 font-sans mb-8">{negotiation.msg}</p>

              <div className="bg-[#101410] border border-[rgba(255,255,255,0.065)] rounded-2xl p-6 sm:p-8 mb-8 shadow-inner flex flex-col items-center">
                 <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">ON THE TABLE</p>
                 <p className={`text-4xl sm:text-5xl font-black number-font mb-6 transition-colors ${negotiation.currentSalary > negotiation.originalOffer.salary ? 'text-[#22E748]' : negotiation.currentSalary < negotiation.originalOffer.salary ? 'text-[#ef4444]' : 'text-white'}`}>
                   {formatMoney(negotiation.currentSalary)}
                 </p>
                 
                 {/* GM Patience Meter */}
                 <div className="w-full mb-6 text-left">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 font-sans">
                       <span>GM Patience</span>
                       <span>{Math.max(0, negotiation.gmPatience)}%</span>
                    </div>
                    <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                       <div 
                         className={`h-full transition-all duration-300 ${negotiation.gmPatience > 50 ? 'bg-[#22E748]' : negotiation.gmPatience > 20 ? 'bg-[#F59E0B]' : 'bg-[#ef4444]'}`}
                         style={{ width: `${Math.max(0, negotiation.gmPatience)}%` }}
                       ></div>
                    </div>
                 </div>

                 {/* 5-Round Negotiation History Track */}
                 <div className="flex justify-between gap-2 w-full mb-8">
                    {[0, 1, 2, 3, 4].map(slot => {
                       const pastMove = negotiation.history[slot];
                       return (
                          <div key={slot} className={`flex-1 h-12 rounded-lg border-2 flex items-center justify-center text-lg transition-all ${
                             pastMove 
                               ? (pastMove.success ? 'bg-[#22E748]/10 border-[#22E748]/50 text-[#22E748]' : 'bg-[#ef4444]/10 border-[#ef4444]/50 text-[#ef4444]') 
                               : 'bg-slate-800 border-slate-700 text-slate-600'
                          }`}>
                             {pastMove ? (pastMove.success ? '📈' : '❌') : '-'}
                          </div>
                       );
                    })}
                 </div>

                 {/* Action Buttons */}
                 {negotiation.status === 'playing' ? (
                   <div className="flex gap-4 w-full">
                     <button onClick={() => handleNegotiatePush('safe')} className="flex-1 bg-[#3b82f6]/10 border-2 border-[#3b82f6]/40 hover:bg-[#3b82f6]/20 text-[#3b82f6] py-3 rounded-xl font-black sports-font text-lg transition-transform active:scale-95 cursor-pointer">
                       SAFE ASK (+3%)
                     </button>
                     <button onClick={() => handleNegotiatePush('hardball')} className="flex-1 bg-[#ef4444]/10 border-2 border-[#ef4444]/40 hover:bg-[#ef4444]/20 text-[#ef4444] py-3 rounded-xl font-black sports-font text-lg transition-transform active:scale-95 cursor-pointer">
                       HARDBALL (+8%)
                     </button>
                   </div>
                 ) : (
                   <div className={`w-full py-3 rounded-lg font-black sports-font text-xl uppercase tracking-widest animate-pulse ${negotiation.status === 'maxed' ? 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40' : 'bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/40'}`}>
                     {negotiation.status === 'maxed' ? 'FINAL OFFER REACHED' : 'GM WALKED AWAY'}
                   </div>
                 )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                 <button onClick={() => finishNegotiation(true)} className="flex-1 btn-primary py-4 rounded-xl font-black sports-font text-lg uppercase tracking-widest shadow-lg">
                   SIGN DEAL NOW
                 </button>
                 <button onClick={() => finishNegotiation(false)} className="flex-1 bg-[#101410] hover:bg-[#1a2230] border border-[rgba(255,255,255,0.1)] text-white py-4 rounded-xl font-black sports-font text-lg uppercase tracking-widest transition-colors cursor-pointer">
                   RETURN TO OFFERS
                 </button>
              </div>
            </div>
          );
        })()}

      </div> 
    </div>
  );
}

export default App;