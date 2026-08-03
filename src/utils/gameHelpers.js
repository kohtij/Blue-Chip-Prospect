import {
  nhlTeams, ahlTeams, euroTeams, juniorLeagues, euroLeagues,
  LEAGUE_CONFIG, getTeamData, getOpponentPool
} from '../data/teams';

export const shuffleArray = (array) => [...array].sort(() => Math.random() - 0.5);

// cap() is for the five 0-100 skill attributes and OVR.
export const cap = (val) => Math.min(100, Math.max(0, val));

// capIdol() is for Fan Status, which runs on its own 0-1000 scale
// (BUG FIX #1: the original code ran idolatry through cap() as well,
// which silently clamped Fan Status to 100 and made "Icon"/"Legend"
// unreachable).
export const capIdol = (val) => Math.min(1000, Math.max(0, val));

export const formatMoney = (amount) => {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount}`;
};

export const getIdolTier = (pts) => {
  if (pts < 100) return { label: 'Unknown', next: 100, req: 100 - pts, nextLabel: 'Known' };
  if (pts < 300) return { label: 'Known', next: 300, req: 300 - pts, nextLabel: 'Loved' };
  if (pts < 600) return { label: 'Loved', next: 600, req: 600 - pts, nextLabel: 'Icon' };
  if (pts < 1000) return { label: 'Icon', next: 1000, req: 1000 - pts, nextLabel: 'Legend' };
  return { label: 'Legend', next: 1000, req: 0, nextLabel: 'Legend' };
};

export const getTransferImpact = (oldTeamId, newTeamId) => {
  if (!oldTeamId || juniorLeagues.includes(oldTeamId) || euroLeagues.includes(oldTeamId) || oldTeamId === 'NCAA') return 0;
  if (oldTeamId === newTeamId) return 10; // Staying put rewards you
  
  const oldT = nhlTeams.find(t => t.id === oldTeamId);
  const newT = nhlTeams.find(t => t.id === newTeamId);
  
  if (!oldT || !newT) return -5;
  
  // Stricter checks so it doesn't flag 'undefined === undefined' as true
  if (oldT.div && newT.div && oldT.div === newT.div) return -30; // Division Rival
  if (oldT.conf && newT.conf && oldT.conf === newT.conf) return -15; // Conference Rival
  
  return -5; // General departure
};

export const getActiveStat = (p, stat) => {
  let val = p[stat];
  p.buffs.forEach(b => { if (b.effect[stat]) val += b.effect[stat]; });
  return cap(val);
};

// --- MINIGAME CHOICE MATH ---
// Turns a minigame choice's archetype into a success probability. This is
// what makes the three buttons feel like genuinely different bets instead
// of three reskins of the same coin flip:
//   safe   -> flat, reliable
//   skill  -> scales off the driving stat(s), so specialists get real value
//   gamble -> low base, tops out around a coin flip even when maxed
export const choiceChance = (player, choice) => {
  if (choice.archetype === 'safe') return choice.baseChance ?? 0.82;

  const stats = choice.stats || (choice.stat ? [choice.stat] : []);
  const avg = stats.length
    ? stats.reduce((sum, k) => sum + getActiveStat(player, k), 0) / stats.length
    : 55;

  if (choice.archetype === 'gamble') {
    return Math.min(0.55, Math.max(0.12, 0.10 + avg / 350));
  }
  // skill
  return Math.min(0.92, Math.max(0.30, 0.30 + avg / 170));
};

// Default payouts per archetype (fan status = idol). Individual choices can
// override with their own `reward: { win, loss }` field for hero moments.
export const CHOICE_REWARD = {
  safe:   { win: { idol: 3 },  loss: { idol: -2 } },
  skill:  { win: { idol: 7 },  loss: { idol: -3 } },
  gamble: { win: { idol: 15, money: 300000 }, loss: { idol: -8 } },
};

// BUG FIX #3: events used to do `ovr: cap(p.ovr + effect.ovr)`, but ovr is
// recomputed from the five attributes every season, so that gain/loss was
// silently wiped out at the next season boundary. Since OVR is the average
// of the five attributes, spreading the delta evenly across all five makes
// it persist naturally through every future recompute.
export const applyOvrDelta = (player, delta) => {
  if (!delta) return player;
  return {
    ...player,
    shooting: cap(player.shooting + delta),
    skating: cap(player.skating + delta),
    physicality: cap(player.physicality + delta),
    hockeyIQ: cap(player.hockeyIQ + delta),
    stamina: cap(player.stamina + delta),
  };
};

export const recomputeOvr = (player) => {
  if (!player) return 50;

  const s1 = player.shooting || 50;    // Reflexes for G
  const s2 = player.skating || 50;     // Positioning for G
  const s3 = player.physicality || 50; // Agility for G
  const s4 = player.hockeyIQ || 50;
  const s5 = player.stamina || 50;

  let weighted = 50;

  if (player.pos === 'G') {
    // Goalies: Reflexes (35%) & Positioning (35%) drive core rating
    weighted = (s1 * 0.35) + (s2 * 0.35) + (s3 * 0.18) + (s4 * 0.07) + (s5 * 0.05);
  } else if (['LD', 'RD'].includes(player.pos)) {
    // Defensemen: Physicality (28%), IQ (28%), Skating (22%)
    weighted = (s3 * 0.28) + (s4 * 0.28) + (s2 * 0.22) + (s1 * 0.11) + (s5 * 0.11);
  } else {
    // Forwards: Shooting (30%), Skating (30%), IQ (20%)
    weighted = (s1 * 0.30) + (s2 * 0.30) + (s4 * 0.20) + (s3 * 0.10) + (s5 * 0.10);
  }

  return Math.min(99, Math.max(50, Math.round(weighted)));
};

// Promotion/demotion hysteresis (partial fix for the "yo-yo" issue): a
// player needs to clear 66 OVR to be promoted, but only drops below 62 to
// be demoted, so borderline players don't flip every single year.
const PROMOTE_OVR = 66;
const DEMOTE_OVR = 62;

/**
 * Pure-ish season simulation. Takes the player BEFORE any training bonus is
 * applied, and the training card's effect exactly once (BUG FIX #2: the
 * original App.jsx applied the chosen training card to the player, then
 * passed both the already-updated player AND the same effect into this
 * function, which added it again).
 *
 * Returns everything the caller needs to update state and decide the next
 * screen, without calling any React setters itself.
 */
export function simulateSeason(player, trainingEffect = {}) {
  const p = player;
  let currentLg = p.league;
  let currentTeam = p.team;
  let waiverEvent = null;
  let isDemoted = false;

  const isJuniorLg = juniorLeagues.includes(currentLg);
  const isEuroLg = euroLeagues.includes(currentLg);

  if (!isJuniorLg && !isEuroLg) {
    if (p.ovr >= PROMOTE_OVR) {
      if (currentLg === 'AHL') {
        waiverEvent = 'You had a great camp and earned a call-up to the NHL roster!';
        const parentNhlTeam = nhlTeams.find(t => t.ahlId === currentTeam);
        if (parentNhlTeam) currentTeam = parentNhlTeam.id;
      }
      currentLg = 'NHL';
    } else if (p.ovr < DEMOTE_OVR) {
      if (currentLg === 'NHL') {
        // Dropped below the demotion line: send the player down to the
        // NHL club's AHL affiliate for the season.
        const parentNhlTeam = nhlTeams.find(t => t.id === currentTeam);
        if (parentNhlTeam && parentNhlTeam.ahlId) currentTeam = parentNhlTeam.ahlId;
        currentLg = 'AHL';
        isDemoted = true;
        waiverEvent = 'You cleared waivers and were reassigned to the AHL affiliate.';
      }
    }
  }

  // Training is applied exactly once here, on top of buff-adjusted stats.
  let simSht = getActiveStat(p, 'shooting') + (trainingEffect.shooting || 0);
  let simSkt = getActiveStat(p, 'skating') + (trainingEffect.skating || 0);
  let simPhy = getActiveStat(p, 'physicality') + (trainingEffect.physicality || 0);
  let simIq = getActiveStat(p, 'hockeyIQ') + (trainingEffect.hockeyIQ || 0);
  let simSta = getActiveStat(p, 'stamina') + (trainingEffect.stamina || 0);

  if (isJuniorLg) { simSht += 25; simSkt += 25; simIq += 25; simPhy += 25; simSta += 25; }
  if (currentLg === 'AHL') { simSht += 15; simSkt += 15; simIq += 15; simPhy += 15; simSta += 15; }
  if (isEuroLg) { simSht += 10; simSkt += 10; simIq += 10; simPhy += 10; simSta += 10; }

// --- DYNAMIC CONTRACT ROLE MODIFIERS ---
  let roleMulti = 1.0;
  const cRole = p.contract?.role || '';

  if (cRole.includes('Core') || cRole.includes('Sniper') || cRole.includes('Playmaker') || cRole.includes('Offensive') || cRole.includes('Starter')) {
    roleMulti = 1.25;
    if (cRole.includes('Sniper')) simSht += 10;
    if (cRole.includes('Playmaker')) simIq += 10;
    if (cRole.includes('Power')) simPhy += 10;
  } else if (cRole.includes('Middle') || cRole.includes('Top 4') || cRole.includes('Two-Way')) {
    roleMulti = 0.90;
  } else if (cRole.includes('Grinder') || cRole.includes('Depth') || cRole.includes('Bottom')) { 
    roleMulti = 0.60; 
    if (cRole.includes('Grinder') || cRole.includes('Shutdown')) simPhy += 15; 
  } else if (cRole.includes('Backup')) {
    roleMulti = 0.40; 
  }

  let games = isJuniorLg ? 68 : 70 + Math.floor(Math.random() * 12);
  if (p.pos === 'G') {
    games = cRole.includes('Backup') ? Math.floor(20 + Math.random() * 15) : Math.floor(games * 0.8);
  } else if (cRole.includes('Grinder') || cRole.includes('Depth') || cRole.includes('Bottom')) {
    games = Math.floor(games * 0.85); // Frequent healthy scratches for depth players
  }

  let g = 0, a = 0, pm = 0, saves = 0, shots = 0, sho = 0;
  let baseImpact = 0;

  if (p.pos === 'G') {
    const savePctBase = 0.880 + ((simSht + simSkt + simPhy) - 150) * 0.0005;
    const actualSavePct = Math.min(0.940, Math.max(0.850, savePctBase + (Math.random() * 0.02 - 0.01)));
    shots = games * (28 + Math.floor(Math.random() * 6));
    saves = Math.floor(shots * actualSavePct);
    sho = Math.max(0, Math.floor((actualSavePct - 0.890) * 150) + Math.floor(Math.random() * 3));
    baseImpact = (actualSavePct - 0.900) * 100;
  } else if (['LD', 'RD'].includes(p.pos)) {
    g = Math.floor(Math.max(0, (simSht - 70) * 0.5)) + Math.floor(Math.random() * 5);
    a = Math.floor(Math.max(0, (simIq - 60) * 0.8 + (simSkt - 65) * 0.4)) + Math.floor(Math.random() * 10);
    pm = Math.floor((simPhy + simIq + simSta - 180) * 0.4) + Math.floor(Math.random() * 20 - 10);
    baseImpact = pm * 0.5;
  } else if (p.pos === 'C') {
    g = Math.floor(Math.max(0, (simSht - 63) * 1.4)) + Math.floor(Math.random() * 10);
    a = Math.floor(Math.max(0, (simIq - 63) * 1.2 + (simSkt - 63) * 0.6)) + Math.floor(Math.random() * 12);
    pm = Math.floor((simPhy + simIq + simSta - 165) * 0.4) + Math.floor(Math.random() * 15 - 5);
    baseImpact = (g + a + pm * 1.5) * 0.2;
  } else {
    g = Math.floor(Math.max(0, (simSht - 60) * 1.6 + (simSkt - 65) * 0.4)) + Math.floor(Math.random() * 12);
    a = Math.floor(Math.max(0, (simIq - 65) * 0.8 + (simSkt - 65) * 0.6)) + Math.floor(Math.random() * 8);
    pm = Math.floor((simSkt + simSht - 140) * 0.2) + Math.floor(Math.random() * 10 - 5);
    baseImpact = (g + a) * 0.25;
  }

let rating = p.pos === 'G'
    ? Math.min(10, Math.max(1, 5.0 + (saves / shots - 0.900) * 100))
    : Math.min(10, Math.max(1, 5.0 + (g + a + pm * 0.5) / games * 5));
  rating = Number(rating.toFixed(1));

  // --- HARDWARE & AWARDS ---
  const awards = [];
  if (currentLg === 'NHL') {
    if (p.pos === 'G' && (saves/shots) > 0.925 && games > 40) awards.push('Vezina Trophy (Best Goalie)');
    if (p.pos !== 'G' && g >= 50) awards.push('Maurice Richard Trophy (Most Goals)');
    if (p.pos !== 'G' && (g+a) >= 100) awards.push('Art Ross Trophy (Most Points)');
    if (rating >= 9.0) awards.push('Hart Memorial Trophy (League MVP)');
    if (p.stats.seasonsPlayed === 0 && rating >= 8.0) awards.push('Calder Memorial Trophy (Rookie of the Year)');
    if (['LD', 'RD'].includes(p.pos) && rating >= 8.5) awards.push('Norris Trophy (Best Defenceman)');
  } else if (isJuniorLg) {
    const leagueName = currentLg === 'USHL' ? 'USHL' : 'CHL';
    if (rating >= 9.0) awards.push(`${leagueName} Player of the Year`);
    if (g >= 50) awards.push(`${leagueName} Top Scorer`);
  } else if (currentLg === 'NCAA') {
     if (rating >= 9.0) awards.push('Hobey Baker Award (NCAA Top Player)');
  }

  if (currentLg === 'AHL' && rating >= 8.0 && p.age > 21) {
    currentLg = 'NHL';
    const currentAhlTeam = ahlTeams.find(t => t.id === currentTeam);
    if (currentAhlTeam) {
      const parentNhlTeam = nhlTeams.find(t => t.ahlId === currentAhlTeam.id);
      if (parentNhlTeam) currentTeam = parentNhlTeam.id;
    }
    waiverEvent = 'After tearing up the AHL in the first half of the season, you were called up to the NHL!';
    g = Math.floor(g * 0.7);
    a = Math.floor(a * 0.7);
  }

  // BUG FIX #4/#5: standings used to be a flat 1-16 roll for every
  // non-NHL league regardless of team count, which meant junior and AHL
  // teams made the playoffs 100% of the time. Now it scales off OVR and
  // the league's real team count, and Europe (a career-winddown league,
  // not one the game actually simulates playoffs for) never triggers
  // the playoff bracket.
  const config = LEAGUE_CONFIG[currentLg];
  const teamCount = config ? config.teams : 32;
  const playoffSpots = config ? config.playoffSpots : 16;
  let standings;

  if (isEuroLg) {
    standings = teamCount + 1;
  } else if (currentLg === 'NHL') {
    const baseStanding = teamCount - Math.floor((p.ovr - 60) * 0.4 + baseImpact);
    standings = Math.max(1, Math.min(teamCount, baseStanding - Math.floor(Math.random() * 8)));
  } else {
    const baseStanding = teamCount - Math.floor((p.ovr - 55) * 0.5 + baseImpact);
    standings = Math.max(1, Math.min(teamCount, baseStanding - Math.floor(Math.random() * 6)));
  }
  const madePlayoffs = !isEuroLg && standings <= playoffSpots;

  const offPercent = p.pos === 'G' ? 0 : Math.min(100, Math.round(((g + a) / ((g * 2) + 40)) * 100));

  const newAge = p.age + 1;
  const declineMod = p.inventory.includes('coach') ? 0.5 : 1;

  // st = the TOTAL stat delta for the season: training + natural
  // development/decline. This is what feeds both persisted stats and the
  // "▲/▼" indicators on the dashboard.
  const st = {
    shooting: trainingEffect.shooting || 0,
    skating: trainingEffect.skating || 0,
    stamina: trainingEffect.stamina || 0,
    hockeyIQ: trainingEffect.hockeyIQ || 0,
    physicality: trainingEffect.physicality || 0
  };

  if (newAge <= 24) {
    const pointsToDistribute = rating >= 8.5 ? 2 : rating >= 7.0 ? 1 : 0;
    const statsToUpgrade = ['shooting', 'skating', 'stamina', 'hockeyIQ', 'physicality'];
    for (let i = 0; i < pointsToDistribute; i++) {
      const s = statsToUpgrade[Math.floor(Math.random() * statsToUpgrade.length)];
      st[s]++;
    }
  }

  if (newAge >= 30) {
    const agePenalty = newAge >= 34 ? 2 : 1;
    st.skating -= Math.floor((2 * agePenalty) * declineMod);
    st.stamina -= Math.floor((3 * agePenalty) * declineMod);
    st.physicality -= Math.floor((1 * agePenalty) * declineMod);
  }

  const newSht = p.shooting + st.shooting;
  const newSkt = p.skating + st.skating;
  const newSta = p.stamina + st.stamina;
  const newIq = p.hockeyIQ + st.hockeyIQ;
  const newPhy = p.physicality + st.physicality;

  const salaryEarned = currentLg === 'AHL' ? 150000 : (isJuniorLg ? 0 : p.contract.salary);
  const idolGain = isJuniorLg
    ? Math.floor((g + a) / 20)
    : (currentLg === 'AHL' ? Math.floor((g + a + (sho * 5)) / 15) : Math.floor((g + a + (sho * 5)) / 3));

  const updatedLgKey = isJuniorLg ? 'chl' : currentLg === 'AHL' ? 'ahl' : 'nhl';

// -- DYNAMIC MARKET VALUE DECAY --
  let valIncrease = 0;
  if (p.pos === 'G') {
    valIncrease = (sho * 350000) + (saves * 600) + (games * 10000);
  } else {
    valIncrease = (g * 110000) + (a * 45000) + (pm * 15000) + (games * 8000);
  }
  
  // Value inherently decays by 35% every season. 
  // To reach and maintain $20M, you MUST generate ~$7M in pure performance value every year.
  const maxVal = currentLg === 'NHL' ? 20000000 : currentLg === 'AHL' ? 3000000 : 500000;
  const decayedValue = Math.floor(p.stats.value * 0.65);
  let newVal = Math.min(maxVal, Math.max(50000, decayedValue + valIncrease));
  
  // Apply a minor age penalty if they are actively declining
  if (declineMod < 1) newVal = Math.max(50000, newVal - 500000);
  const nextOvr = recomputeOvr({ shooting: newSht, skating: newSkt, physicality: newPhy, hockeyIQ: newIq, stamina: newSta });

  // Sort stats into the correct bucket based on the current league
  const statBucket = ['OHL', 'WHL', 'QMJHL', 'USHL', 'NCAA', 'SHL', 'LIIGA'].includes(currentLg) ? 'chl' : (currentLg === 'AHL' ? 'ahl' : 'nhl');

  const updatedPlayer = {
    ...p,
    age: p.age + 1,
    ovr: nextOvr,
    idolatry: capIdol(p.idolatry + idolGain),
    contract: { ...p.contract, years: (p.age < 20 && p.contract?.years > 0 && ['OHL', 'WHL', 'QMJHL'].includes(currentLg)) ? p.contract.years : (p.contract?.years > 0 ? p.contract.years - 1 : 0) },
    stats: {
      ...p.stats,
      seasonsPlayed: (p.stats.seasonsPlayed || 0) + 1,
      [statBucket]: {
        games: (p.stats[statBucket]?.games || 0) + games,
        goals: (p.stats[statBucket]?.goals || 0) + g,
        assists: (p.stats[statBucket]?.assists || 0) + a,
        plusMinus: (p.stats[statBucket]?.plusMinus || 0) + pm,
        shots: (p.stats[statBucket]?.shots || 0) + shots,
        saves: (p.stats[statBucket]?.saves || 0) + saves,
        shutouts: (p.stats[statBucket]?.shutouts || 0) + sho
      }
    }
  };

  const recap = { g, a, pm, saves, shots, sho, games, titleWon: 0, playoffWins: 0, rating, standings, offPercent, waiverEvent, awards, madePlayoffs };

  return { updatedPlayer, recap, statChanges: st, isDemoted, madePlayoffs, currentLg, currentTeam };
}

export function generatePlayoffDeck(standings, playoffSpots, round) {
  const seedStrength = Math.max(0, Math.min(1, 1 - (standings - 1) / Math.max(1, playoffSpots - 1)));
  
  let winCards = Math.round(3 + (seedStrength * 3)) - (round === 4 ? 1 : 0); 
  winCards = Math.max(3, Math.min(7, winCards)); 

  let cards = [];
  for (let i = 0; i < winCards; i++) cards.push({ isWin: true });
  for (let i = 0; i < (9 - winCards); i++) cards.push({ isWin: false });
  
  return shuffleArray(cards);
}