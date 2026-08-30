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
  idolatry: 0, inventory: [], buffs: [], agentRerolls: 1, teamsPlayedFor: [], rights: null, startLeague: 'OHL',
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
  { id: 'passionate', name: 'Tommy "T-Bone" Jenkins', outlet: 'Campus Radio', desc: 'A wild student broadcaster. Wants FIRE and PASSION.', region: 'JUNIOR' },
  
  // THE HUMBLE
  { id: 'humble', name: 'Sarah Lindqvist', outlet: 'EuroHockey Weekly', desc: 'Values team culture and locker room harmony. Looks for TEAM-FIRST, HUMBLE responses.', region: 'EU' },
  { id: 'humble', name: 'Dom Luszczyszyn', outlet: 'The Athletic', desc: 'Analytics heavy and realistic. Appreciates SELF-AWARENESS and HUMILITY.', region: 'NHL' },
  { id: 'humble', name: 'Coach Davis', outlet: 'Local Prep Times', desc: 'Old-school high school coach turned writer. Wants HUMILITY.', region: 'JUNIOR' },
  
  // THE COCKY
  { id: 'cocky', name: 'Larry Brooks', outlet: 'NY Post', desc: 'Looking for a controversial headline. Thrives on CONFIDENCE and ARROGANCE.', region: 'NHL' },
  { id: 'cocky', name: 'Marcus Vance', outlet: 'Puck Digest', desc: 'Hot-take radio host. Wants BOLD PREDICTIONS and COCKY soundbites.', region: 'ALL' },
  { id: 'cocky', name: 'Tomasz Novotny', outlet: 'EuroIce Tabloid', desc: 'Always searching for drama. Thrives on CONFIDENCE and ARROGANCE.', region: 'EU' },
  { id: 'cocky', name: 'Buzz Carter', outlet: 'Prospect Watcher', desc: 'Loves hyping up elite prospects. Wants BOLD PREDICTIONS.', region: 'JUNIOR' }
];

export const getJournalistsForLeague = (league) => {
   const isEuro = ['SHL', 'LIIGA'].includes(league);
   const isJunior = ['OHL', 'WHL', 'QMJHL', 'USHL', 'NCAA'].includes(league);
   
   return PRESS_JOURNALISTS.filter(j => {
      if (j.region === 'ALL') return true;
      if (isEuro) return j.region === 'EU';
      if (isJunior) return j.region === 'JUNIOR' || j.region === 'NA'; // Fallback to NA if needed
      // If NHL or AHL
      return j.region === 'NHL' || j.region === 'NA';
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

// Questions the press asks after games. Each has 4 answer options keyed by
// vibe (professional/passionate/humble/cocky); matching the journalist's
// preferred vibe scores hits in handleEndPress. forPos filters skater/goalie/all,
// tag balances so shuffled hands don't stack too positive or too negative.
export const PRESS_QUESTIONS = [
  {
    q: "You came up big tonight. What was going through your mind on that play?",
    forPos: 'all', tag: 'positive',
    answers: {
      professional: [
        "I was just trying to make the right read and let the puck do the work.",
        "Just sticking to our structure, taking what they give us.",
        "Saw the lane open up and trusted the systems we practice."
      ],
      passionate: [
        "The fans deserved that one. I could hear them getting louder every shift.",
        "I just wanted to step up for the boys. We needed a spark.",
        "Pure adrenaline. When the building gets that loud, you just feed off it."
      ],
      humble: [
        "The guys in front of me did all the work. I was just in the right spot.",
        "Honestly, it was a great play by my linemates. All I had to do was finish it.",
        "Just a fortunate bounce, really. Team effort all the way."
      ],
      cocky: [
        "Honestly, I saw it opening up before it happened. It's the standard I set.",
        "That's why I'm out there in those situations. I expect to make those plays.",
        "I knew I had the goalie beat before it even left my stick."
      ]
    }
  },
  {
    q: "The team's been streaking. What's clicking in the room?",
    forPos: 'all', tag: 'positive',
    answers: {
      professional: [
        "Systems. We're executing the game plan for a full sixty minutes now.",
        "We're playing a strong 200-foot game and managing the puck well.",
        "Just taking it one shift at a time, getting pucks deep."
      ],
      passionate: [
        "The belief. Everyone in that room is playing for the guy next to them.",
        "We're going to war for each other out there. The culture is incredible.",
        "It's the heart. We refuse to be outworked right now."
      ],
      humble: [
        "Coach's message. He's the one setting the tone; we're just following it.",
        "We're just getting some good bounces and sticking to the details.",
        "Goaltending has been bailing us out when we make mistakes, honestly."
      ],
      cocky: [
        "Talent. This roster's finally showing what it can do.",
        "We're just a better hockey team than the guys we're playing.",
        "Nobody can skate with us when we play our game. Simple as that."
      ]
    }
  },
  {
    q: "Tough loss out there. Where did the game slip away?",
    forPos: 'all', tag: 'negative',
    answers: {
      professional: [
        "Special teams. We gave them too many looks on the power play.",
        "Puck management in the neutral zone. We fed their transition game.",
        "We got away from our forecheck and let them dictate the pace."
      ],
      passionate: [
        "Compete. They wanted it more in the third and it showed.",
        "We were flat, and it's completely unacceptable for this group.",
        "We let our goalie out to dry. We have to be way tougher in front of our net."
      ],
      humble: [
        "On me. I could have been better in a couple of spots that mattered.",
        "I need to be sharper. I made some mistakes that cost us momentum.",
        "I didn't execute when the team needed a play. Need to look in the mirror."
      ],
      cocky: [
        "One bounce. That game was ours; the scoreboard just doesn't show it.",
        "They got lucky. 9 times out of 10 we win that hockey game.",
        "We beat ourselves. They didn't do anything special to beat us."
      ]
    }
  },
  {
    q: "You've been snake-bit at the net lately. What are you seeing?",
    forPos: 'skater', tag: 'negative',
    answers: {
      professional: [
        "Pucks aren't going in, but the chances are there. I trust the process.",
        "Just need to keep putting pucks on net and getting traffic in front.",
        "Not changing my game. Keep playing a 200-foot game and it'll come."
      ],
      passionate: [
        "It's driving me crazy. I want to be the guy who breaks a game open.",
        "I'm fighting it right now, but I'm going to work twice as hard to snap out.",
        "It's frustrating, but I just have to battle through it for the boys."
      ],
      humble: [
        "I need to get to harder areas. That's on me.",
        "I'm gripping the stick a bit too tight. Need to relax and make plays.",
        "My linemates are finding me, I just need to bear down and finish for them."
      ],
      cocky: [
        "They'll go in. Snipers get streaky; my ceiling is way higher than this.",
        "I'm not worried. Once one goes in, the floodgates are going to open.",
        "Goalies are just getting lucky right now. My release is perfectly fine."
      ]
    }
  },
  {
    q: "You've had a rough stretch in net. What are you working on?",
    forPos: 'goalie', tag: 'negative',
    answers: {
      professional: [
        "Tracking pucks through traffic. It's technical, we're addressing it.",
        "Just working with the goalie coach on depth and angle control.",
        "Resetting my fundamentals. Keeping my feet set and staying square."
      ],
      passionate: [
        "I want the ball in my hands. Every night. I don't hide from tough games.",
        "I hate letting the team down. I'm grinding every day to lock it back down.",
        "It burns. I demand better from myself to give these guys a chance to win."
      ],
      humble: [
        "Everything. I need to be better. Full stop.",
        "I'm not making the timely saves right now. I have to find a way to step up.",
        "The guys are playing hard in front of me, I just need to bail them out more."
      ],
      cocky: [
        "One bad week doesn't define me. I'm the guy in this crease for a reason.",
        "I'll bounce back. My track record speaks for itself.",
        "I'm an elite goaltender. Slumps happen. I'm not stressing it."
      ]
    }
  },
  {
    q: "There's a big divisional matchup coming up. Any message for the other guys?",
    forPos: 'all', tag: 'positive',
    answers: {
      professional: [
        "Respect their group. It'll come down to details and discipline.",
        "It's a four-point game. We just need to focus on our structure.",
        "They're a good team. We need to be sharp and stay out of the box."
      ],
      passionate: [
        "Bring it. Our building. Our fans. We'll be ready.",
        "These are the games you wake up for. It's going to be an absolute war.",
        "We're going to make it a long night for them. Heavy, physical hockey."
      ],
      humble: [
        "We need to worry about ourselves before we talk about anybody else.",
        "We respect their roster. We just need to play our game and see what happens.",
        "It's going to be a tough test. We just have to show up ready to work."
      ],
      cocky: [
        "They should be worried. We're playing our best hockey right now.",
        "We know we're the team to beat in this division.",
        "If we play our game, they can't skate with us. It's on them to try and stop us."
      ]
    }
  },
  {
    q: "Trade deadline rumors have your name in them. Any comment?",
    forPos: 'all', tag: 'negative',
    answers: {
      professional: [
        "That's a business matter. My focus is entirely on the next game.",
        "I don't control the front office. I just control my effort on the ice.",
        "Whatever happens, happens. I'm just here to play hockey."
      ],
      passionate: [
        "I love it here. I want to win here. That's all I'll say.",
        "This is my city. I bleed for this team and I don't want to go anywhere.",
        "I'll fight for this crest until they tell me I can't anymore."
      ],
      humble: [
        "Above my pay grade. I just try to play well and let the rest sort itself out.",
        "I'm just grateful to be playing in this league. The rest is noise.",
        "I just want to be a good teammate while I'm here."
      ],
      cocky: [
        "Any team would be lucky to have me. That's not for me to worry about.",
        "My value is obvious. If they move me, I'll go dominate somewhere else.",
        "I'm an elite player. Teams are going to call. That's just how it works."
      ]
    }
  },
  {
    q: "You just hit a big personal milestone. Take us through what it means.",
    forPos: 'all', tag: 'positive',
    answers: {
      professional: [
        "It's a marker along the way. Nice to check off, then back to work.",
        "It's a nice accomplishment, but we're focused on the bigger picture.",
        "Consistency is key. Happy to reach it, but the job isn't done."
      ],
      passionate: [
        "For my family. For everyone who believed in me when nobody else did.",
        "It's emotional. A lot of blood, sweat, and tears went into this moment.",
        "I love this game so much. To achieve this in front of these fans is incredible."
      ],
      humble: [
        "Wouldn't have gotten there without every teammate I've had.",
        "I've been lucky to play with some amazing players who made this possible.",
        "It's a team milestone really. I'm just the beneficiary of great linemates."
      ],
      cocky: [
        "Just the beginning. There's a lot more where that came from.",
        "I expect greatness from myself. This is exactly where I planned to be.",
        "Look at my game. It was only a matter of time before I hit this."
      ]
    }
  }
];
