// Shared module-scope helpers extracted from App.jsx.
// Imported by App.jsx and by every extracted screen so no helper is
// re-declared in multiple places.

import { getTeamData, getPlayoffRounds, getDeployment } from '../data/teams';
import { getAwardImage } from '../data/awards';

export const makeInitialPlayer = () => ({
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
  fanStatus: 0, inventory: [], buffs: [], agentRerolls: 1, teamsPlayedFor: [], rights: null, startLeague: 'OHL',
  // Storyline & generational trackers
  isGenerational: false,
  archetype: '',
  nemesisName: null,
  duoName: null,
  storylines: { mediaNemesis: 0, franchiseDuo: 0, lockerRoom: 0, hometown: 0, injury: 0 }
});

// Role classifier used by generateOffers. Hoisted from inside the function
// so the definition isn't reallocated on every offer generation.
export function getRole(salary, player) {
  const lg = player?.league || 'NHL';
  const isJunior = ['OHL', 'WHL', 'QMJHL', 'USHL', 'NCAA'].includes(lg);
  const isAHL = lg === 'AHL';
  const ovr = player?.ovr || 50;
  const pos = player?.pos || 'C';

  // JUNIOR / AMATEUR LEAGUES
  if (isJunior) {
    if (pos === 'G') return ovr >= 65 ? 'Elite Prospect' : ovr >= 58 ? 'Starting Goalie' : 'Backup Goalie';
    if (['LD', 'RD'].includes(pos)) return ovr >= 65 ? 'Top Pair Prospect' : ovr >= 58 ? 'Top 4 Defender' : 'Depth Defender';
    return ovr >= 65 ? 'Top Line Star' : ovr >= 58 ? 'Top 6 Forward' : 'Depth Forward';
  }

  // AHL
  if (isAHL) {
    if (pos === 'G') return ovr >= 78 ? 'Elite Starter' : ovr >= 72 ? 'Starting Goalie' : 'Backup Goalie';
    if (['LD', 'RD'].includes(pos)) return ovr >= 78 ? 'Top Pair Anchor' : ovr >= 70 ? 'Top 4 Defender' : 'Depth Defender';
    return ovr >= 78 ? 'Top Line Star' : ovr >= 70 ? 'Middle Six Forward' : 'Bottom Six Forward';
  }

  // NHL / PRO (Default)
  if (pos === 'G') {
    if (salary >= 6000000 || ovr >= 86) return 'Franchise Starter';
    if (salary >= 3500000 || ovr >= 82) return '1A/1B Starter';
    return 'Backup Goalie';
  }
  if (['LD', 'RD'].includes(pos)) {
    if (salary >= 7000000 || ovr >= 86) return 'Franchise Defenseman';
    if (salary >= 4000000 || ovr >= 81) return 'Top 4 Defenseman';
    return 'Bottom Pair / Depth';
  }
  
  // Forwards (NHL)
  if (salary >= 8000000 || ovr >= 87) return 'Franchise Centerpiece';
  if (salary >= 5000000 || ovr >= 83) return 'Top 6 Forward';
  if (salary >= 2000000 || ovr >= 79) return 'Middle Six Forward';
  return 'Bottom Six Grinder';
}

// Playoff format helpers — resolve per-round win threshold and deck length
// from LEAGUE_CONFIG so the same code drives best-of-7 series and NCAA single-elim.
export const getGamesPerMatchup = (league, roundIndex) => {
  const rounds = getPlayoffRounds(league) || [];
  return rounds[roundIndex]?.gamesPerMatchup || 7;
};

export const getWinsNeeded = (league, roundIndex) => {
  return Math.ceil(getGamesPerMatchup(league, roundIndex) / 2);
};

export const getDisplayDeployment = (ovr, pos, league) => {
  return getDeployment(ovr, pos, league);
};

export const getFullTeamName = (teamId, league) => {
  if (!teamId) return 'UNKNOWN';
  const t = typeof teamId === 'object' ? teamId : getTeamData(teamId, league);
  if (!t) return 'UNKNOWN';
  if (t.city && t.name && !t.name.includes(t.city)) return `${t.city} ${t.name}`;
  return t.name || t.id || 'UNKNOWN';
};

// Quality of the training programmes a club can put in front of a player. An NHL
// room with the staff behind you offers better camps than a junior club on a short
// budget. Returns 0..1; used to weight the rarity of the three cards on offer and
// to label the tier on the preseason screen.
export const getTrainingQuality = (p) => {
  const lg = p?.league;
  const leagueTier = lg === 'NHL' ? 1
     : ['AHL', 'KHL', 'SHL', 'LIIGA', 'SWISS'].includes(lg) ? 0.6
     : ['ECHL', 'NCAA'].includes(lg) ? 0.4
     : 0.2;
  const clamp01 = v => Math.min(1, Math.max(0, v));
  const trust = clamp01(((p?.relationships?.coach ?? 50) - 40) / 50);
  const skill = clamp01(((p?.ovr ?? 60) - 60) / 30);
  return clamp01((0.45 * leagueTier) + (0.30 * skill) + (0.25 * trust));
};

export const getTrainingTierLabel = (q) => {
  if (q >= 0.72) return { tier: 'ELITE PROGRAMME', note: 'The club has opened up its full development budget for you.' };
  if (q >= 0.48) return { tier: 'FULL PROGRAMME', note: 'The staff have built a proper off-season plan around you.' };
  if (q >= 0.26) return { tier: 'STANDARD PROGRAMME', note: 'You get the regular club programme. Pick your focus.' };
  return { tier: 'LIMITED PROGRAMME', note: 'Short budget, shared ice time. You work with what the club has.' };
};

// Dynamic Playoff Title Generator
export const getPlayoffTitles = (league) => {
  switch (league) {
    case 'NHL': return { banner: 'STANLEY CUP PLAYOFFS', final: 'STANLEY CUP FINAL', trophy: '🏆', cupName: 'Stanley Cup' };
    case 'AHL': return { banner: 'CALDER CUP PLAYOFFS', final: 'CALDER CUP FINAL', trophy: '🏆', cupName: 'Calder Cup' };
    case 'OHL': return { banner: 'OHL PLAYOFFS', final: 'OHL CHAMPIONSHIP FINAL', trophy: '🏆', cupName: 'J. Ross Robertson Cup' };
    case 'WHL': return { banner: 'WHL PLAYOFFS', final: 'WHL CHAMPIONSHIP FINAL', trophy: '🏆', cupName: 'Ed Chynoweth Cup' };
    case 'QMJHL': return { banner: 'QMJHL PLAYOFFS', final: 'GILLES-COURTEAU TROPHY FINAL', trophy: '🏆', cupName: 'Gilles-Courteau Trophy' };
    default: return { banner: `${league || 'LEAGUE'} PLAYOFFS`, final: `${league || 'LEAGUE'} FINAL`, trophy: '🏆', cupName: `${league || 'League'} Championship` };
  }
};

export const ACCENT = {
  red:     { border: 'border-t-[#ef4444]', heading: 'text-[#ef4444]' },
  blue:    { border: 'border-t-[#3b82f6]', heading: 'text-[#3b82f6]' },
  emerald: { border: 'border-t-[#22E748]', heading: 'text-[#22E748]' },
  amber:   { border: 'border-t-[#F59E0B]', heading: 'text-[#F59E0B]' },
};

export const ARCH_PILL = {
  safe:   { label: 'SAFE',   cls: 'text-slate-300 bg-[#101410] border-[rgba(255,255,255,0.065)]', hover: 'hover:border-slate-500' },
  skill:  { label: 'SKILL',  cls: 'text-[#22E748] bg-[#22E748]/10 border-[#22E748]/30', hover: 'hover:border-[#22E748]' },
  gamble: { label: 'GAMBLE', cls: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30', hover: 'hover:border-[#F59E0B]' },
};

export const MASTER_ACHIEVEMENTS = [
  // DRAFT & AMATEUR
  { id: 'first_overall', name: 'Generational', desc: 'Drafted 1st Overall in the NHL Draft', icon: '🌟' },
  { id: 'first_round_pick', name: 'Top Prospect', desc: 'Drafted in the 1st Round of the NHL Draft', icon: '🎯' },
  { id: 'mem_cup', name: 'Junior Legend', desc: 'Win the CHL Memorial Cup', icon: '🏆' },
  { id: 'ncaa_route', name: 'College Glory', desc: 'Commit to and play for a top NCAA D1 Hockey program', icon: '🎓' },
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
  { id: 'franchise_legend', name: 'Statue Outside', desc: 'Reach the maximum Fan Status of 1000', icon: '🗽' },
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
  { id: 'portal_entered', name: 'In The Portal', desc: 'Enter the transfer portal during a college season', icon: '🌀' },
  { id: 'portal_cold', name: 'Nobody Called', desc: 'Enter the transfer portal and have no programme come for you', icon: '📵' },
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
  { id: 'the_idol', name: 'The Ultimate Icon', desc: 'Unlock 40 or more total achievements across all career playthroughs', icon: '🏆' }
];

export const PRESS_VIBES = {
  professional: { label: 'PROFESSIONAL', icon: '👔', color: 'text-[#3b82f6]', bg: 'bg-[#3b82f6]/10', border: 'border-[#3b82f6]/30' },
  passionate:   { label: 'PASSIONATE',   icon: '🔥', color: 'text-[#ef4444]', bg: 'bg-[#ef4444]/10', border: 'border-[#ef4444]/30' },
  humble:       { label: 'HUMBLE',       icon: '🙏', color: 'text-[#22E748]', bg: 'bg-[#22E748]/10', border: 'border-[#22E748]/30' },
  cocky:        { label: 'COCKY',        icon: '😎', color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/10', border: 'border-[#F59E0B]/30' }
};

export const PRESS_JOURNALISTS = [
  // THE PROFESSIONALS
  { id: 'professional', name: 'Pierre LeBrun', outlet: 'The Athletic', desc: 'Old-school and institutional. Wants MEASURED and FORMAL answers.', region: 'NHL' },
  { id: 'professional', name: 'Darren Dreger', outlet: 'TSN', desc: 'Mainstream and neutral. Looks for SAFE, MEASURED answers.', region: 'NHL' },
  { id: 'professional', name: 'Emily Kaplan', outlet: 'ESPN', desc: 'Highly respected national reporter. Prefers THOUGHTFUL, PROFESSIONAL answers.', region: 'NHL' },
  { id: 'professional', name: 'Jari Kurri Jr.', outlet: 'Nordic Sports', desc: 'Respects the fundamental European game. Wants MEASURED answers.', region: 'EU' },
  { id: 'professional', name: 'Sam Kennedy', outlet: 'Junior Hockey News', desc: 'Follows prospect development closely. Wants MEASURED answers.', region: 'JUNIOR' },

  // THE PASSIONATE
  { id: 'passionate', name: 'Steve Dangle', outlet: 'SDPN', desc: 'Wears his heart on his sleeve. Wants FIRE and PASSION for the city.', region: 'NHL' },
  { id: 'passionate', name: 'Garnet Thorne', outlet: 'Local Beat', desc: 'Fiercely protective of the home team. Wants to see EMOTION and DRIVE.', region: 'ALL' },
  { id: 'passionate', name: 'Lars Bergstrom', outlet: 'SHL Daily', desc: 'Fiercely protective of the local fans. Wants to see EMOTION and PASSION.', region: 'EU' },
  { id: 'passionate', name: 'Tommy "T-Bone" Jenkins', outlet: 'Campus Radio', desc: 'A wild student broadcaster. Wants FIRE and PASSION.', region: ['JUNIOR', 'NCAA'] },

  // THE HUMBLE
  { id: 'humble', name: 'Sarah Lindqvist', outlet: 'EuroHockey Weekly', desc: 'Values team culture and locker room harmony. Looks for TEAM-FIRST, HUMBLE responses.', region: 'EU' },
  { id: 'humble', name: 'Dom Luszczyszyn', outlet: 'The Athletic', desc: 'Analytics heavy and realistic. Appreciates SELF-AWARENESS and HUMILITY.', region: 'NHL' },
  { id: 'humble', name: 'Coach Davis', outlet: 'Local Prep Times', desc: 'Old-school high school coach turned writer. Wants HUMILITY.', region: 'JUNIOR' },
  { id: 'humble', name: 'Walter Keene', outlet: 'Alumni Quarterly', desc: 'Writes about programme culture and the players before you. Wants HUMILITY.', region: 'NCAA' },

  // THE COCKY
  { id: 'cocky', name: 'Larry Brooks', outlet: 'NY Post', desc: 'Looking for a controversial headline. Thrives on CONFIDENCE and ARROGANCE.', region: 'NHL' },
  { id: 'cocky', name: 'Marcus Vance', outlet: 'Puck Digest', desc: 'Hot-take radio host. Wants BOLD PREDICTIONS and COCKY soundbites.', region: 'ALL' },
  { id: 'cocky', name: 'Tomasz Novotny', outlet: 'EuroIce Tabloid', desc: 'Always searching for drama. Thrives on CONFIDENCE and ARROGANCE.', region: 'EU' },
  { id: 'cocky', name: 'Buzz Carter', outlet: 'Prospect Watcher', desc: 'Loves hyping up elite prospects. Wants BOLD PREDICTIONS.', region: ['JUNIOR', 'NCAA'] },

  // THE COLLEGE BEAT
  { id: 'professional', name: 'Marie Caron', outlet: 'The Campus Rink', desc: 'Covers this conference and nothing else. Wants MEASURED answers.', region: 'NCAA' }
];

// The old version recognised two European leagues, so a player in the KHL, the
// DEL, the Swiss NL or either Extraliga was interviewed by Pierre LeBrun of The
// Athletic. It also filed college under JUNIOR, which handed a varsity player a
// high school beat writer. Regions may now be a list, so a campus broadcaster
// can cover both.
const REGION_BY_LEAGUE = {
  NCAA: 'NCAA',
  OHL: 'JUNIOR', WHL: 'JUNIOR', QMJHL: 'JUNIOR', USHL: 'JUNIOR',
  SHL: 'EU', LIIGA: 'EU', KHL: 'EU', SWISS: 'EU', DEL: 'EU', ICEHL: 'EU', CZECH: 'EU', SLOVAK: 'EU'
};

export const getJournalistsForLeague = (league) => {
   const region = REGION_BY_LEAGUE[league] || 'NHL';
   const covers = (j) => (Array.isArray(j.region) ? j.region : [j.region]);
   return PRESS_JOURNALISTS.filter(j => {
      const r = covers(j);
      return r.includes('ALL') || r.includes(region) || r.includes('NA');
   });
};

// Small pill for the retirement screen — one per award type, showing the
// award name, its trophy image, and how many times it was won.
export const getAwardPill = (name, count) => {
  const gold = ['Stanley Cup', 'Hart', 'Vezina', 'Norris', 'Art Ross', 'Richard', 'Conn Smythe', 'Calder'];
  const isGold = gold.some(g => name.includes(g));
  const cls = isGold
    ? 'bg-[#F59E0B]/15 border-[#F59E0B]/40 text-[#F59E0B]'
    : 'bg-[#3b82f6]/10 border-[#3b82f6]/30 text-[#3b82f6]';
  const trophy = getAwardImage(name);
  return (
    <span
      key={name}
      className={`inline-flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-md border text-[10px] sm:text-xs font-black uppercase tracking-wider sports-font ${cls}`}
    >
      {trophy ? (
        <img
          src={trophy}
          alt=""
          className="w-6 h-6 sm:w-7 sm:h-7 object-contain drop-shadow-[0_0_6px_rgba(0,0,0,0.6)]"
          loading="lazy"
        />
      ) : (
        <span className="text-base">{isGold ? '🏆' : '🥇'}</span>
      )}
      <span className="whitespace-nowrap">{name}</span>
      {count > 1 && <span className="opacity-70">×{count}</span>}
    </span>
  );
};

// Press questions moved to src/data/pressQuestions.js, where they gained a
// league scope and finer position buckets. They were filtered on goalie versus
// skater alone, so a college player was asked about the trade deadline and a
// defenceman about going cold at the net.
