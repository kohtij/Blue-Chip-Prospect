import {
  nhlTeams, ahlTeams, ohlTeams, whlTeams, qmjhlTeams, juniorLeagues, euroLeagues,
  LEAGUE_CONFIG, getOpponentPool
} from '../data/teams';
import { shopItems } from '../data/economy';

export const shuffleArray = (array) => [...array].sort(() => Math.random() - 0.5);

export const cap = (val) => Math.min(100, Math.max(0, val));

export const capFanStatus = (val) => Math.min(1000, Math.max(0, val));

export const formatMoney = (amount) => {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount}`;
};

export const getFanTier = (pts) => {
  if (pts < 100) return { label: 'Unknown', next: 100, req: 100 - pts, nextLabel: 'Known' };
  if (pts < 300) return { label: 'Known', next: 300, req: 300 - pts, nextLabel: 'Loved' };
  if (pts < 600) return { label: 'Loved', next: 600, req: 600 - pts, nextLabel: 'Icon' };
  if (pts < 1000) return { label: 'Icon', next: 1000, req: 1000 - pts, nextLabel: 'Legend' };
  return { label: 'Legend', next: 1000, req: 0, nextLabel: 'Legend' };
};

export const getTransferImpact = (oldTeamId, newTeamId) => {
  if (!oldTeamId || juniorLeagues.includes(oldTeamId) || euroLeagues.includes(oldTeamId) || oldTeamId === 'NCAA') return 0;
  if (oldTeamId === newTeamId) return 10;
  
  const oldT = nhlTeams.find(t => t.id === oldTeamId);
  const newT = nhlTeams.find(t => t.id === newTeamId);
  
  if (!oldT || !newT) return -5;
  
  if (oldT.div && newT.div && oldT.div === newT.div) return -30;
  if (oldT.conf && newT.conf && oldT.conf === newT.conf) return -15;
  
  return -5;
};

export const getActiveStat = (p, stat) => {
  let val = p[stat];
  p.buffs.forEach(b => { if (b.effect[stat]) val += b.effect[stat]; });
  return cap(val);
};

export const PROMOTE_OVR = 68;
export const DEMOTE_OVR = 64;

export const choiceChance = (player, choice) => {
  if (!choice || !choice.stats || choice.stats.length === 0) return 0.50;
  const statTotal = choice.stats.reduce((acc, stat) => acc + (player[stat] || 50), 0);
  const avgStat = statTotal / choice.stats.length;
  let chance = choice.baseChance + ((avgStat - 50) * 0.005);
  return Math.min(0.95, Math.max(0.05, chance));
};

export const CHOICE_REWARD = {
  safe:   { win: { fanStatus: 3 },  loss: { fanStatus: -2 } },
  skill:  { win: { fanStatus: 7 },  loss: { fanStatus: -3 } },
  gamble: { win: { fanStatus: 15, money: 300000 }, loss: { fanStatus: -8 } },
};

export const recomputeOvr = (p) => {
  if (!p) return 50;

  if (!p.pos && typeof console !== 'undefined') {
    console.warn('[recomputeOvr] called without pos — will default to forward formula. Caller should pass pos.', p);
  }

  const sht = p.shooting || 50;
  const skt = p.skating || 50;
  const phy = p.physicality || 50;
  const iq  = p.hockeyIQ || 50;
  const sta = p.stamina || 50;

  if (p.pos === 'G') {
    return Math.round((sht * 0.3) + (skt * 0.3) + (phy * 0.2) + (iq * 0.1) + (sta * 0.1));
  }

  if (['LD', 'RD'].includes(p.pos)) {
    return Math.round((phy * 0.30) + (skt * 0.25) + (iq * 0.25) + (sta * 0.10) + (sht * 0.10));
  }

  return Math.round((sht * 0.30) + (skt * 0.25) + (iq * 0.25) + (phy * 0.10) + (sta * 0.10));
};

export const applyOvrDelta = (player, delta) => {
  const rawOvr = recomputeOvr(player);
  const hiddenDelta = (player.ovr || rawOvr) - rawOvr;
  const totalDelta = (delta || 0) + hiddenDelta;

  if (!totalDelta) return player;
  
  return {
    ...player,
    shooting: cap(player.shooting + totalDelta),
    skating: cap(player.skating + totalDelta),
    physicality: cap(player.physicality + totalDelta),
    hockeyIQ: cap(player.hockeyIQ + totalDelta),
    stamina: cap(player.stamina + totalDelta),
  };
};

function _computeAwards({ player, rating, g, a, saves, shots, games, standings }) {
  const awards = [];
  const pts = g + a;
  const isGoalie = player.pos === 'G';
  const isDefense = ['LD', 'RD'].includes(player.pos);
  const svPct = saves / (shots || 1);
  const careerHighGoals = player.stats?.careerHighGoals || 0;

  if (standings === 1) {
    switch (player.league) {
      case 'NHL': awards.push("Presidents' Trophy"); break;
      case 'AHL': awards.push("Macgregor Kilpatrick Trophy (Regular Season Champ)"); break;
      case 'OHL': awards.push("Hamilton Spectator Trophy (Regular Season Champ)"); break;
      case 'WHL': awards.push("Scotty Munro Memorial Trophy (Regular Season Champ)"); break;
      case 'QMJHL': awards.push("Jean Rougeau Trophy (Regular Season Champ)"); break;
      case 'USHL': awards.push("Anderson Cup (Regular Season Champ)"); break;
      default: awards.push(`${player.league} Regular Season Champion`); break;
    }
  }

  switch (player.league) {
    case 'OHL':
      if (pts >= 110 || (isGoalie && svPct >= 0.925)) awards.push('Red Tilson Trophy (OHL Most Outstanding Player)');
      if (pts >= 100) awards.push('Eddie Powers Memorial Trophy (OHL Scoring Champion)');
      if (isDefense && pts >= 65) awards.push('Max Kaminsky Trophy (OHL Most Outstanding Defenceman)');
      if (isGoalie && svPct >= 0.915 && games >= 35) awards.push('FW "Dinty" Moore Trophy (OHL Best Goaltender)');
      if (player.age === 16 && pts >= 60) awards.push('Emms Family Award (OHL Rookie of the Year)');
      break;
    case 'WHL':
      if (pts >= 110 || (isGoalie && svPct >= 0.925)) awards.push('Four Broncos Memorial Trophy (WHL Player of the Year)');
      if (pts >= 100) awards.push('Bob Clarke Trophy (WHL Top Scorer)');
      if (isDefense && pts >= 65) awards.push('Bill Hunter Memorial Trophy (WHL Top Defenceman)');
      if (isGoalie && svPct >= 0.915 && games >= 35) awards.push('Del Wilson Trophy (WHL Top Goaltender)');
      if (player.age === 16 && pts >= 60) awards.push('Jim Piggott Memorial Trophy (WHL Rookie of the Year)');
      break;
    case 'QMJHL':
      if (pts >= 110 || (isGoalie && svPct >= 0.925)) awards.push('Michel Brière Memorial Trophy (QMJHL Most Valuable Player)');
      if (pts >= 100) awards.push('Jean Béliveau Trophy (QMJHL Top Scorer)');
      if (isDefense && pts >= 65) awards.push('Émile Bouchard Trophy (QMJHL Defenceman of the Year)');
      if (isGoalie && svPct >= 0.915 && games >= 35) awards.push('Jacques Plante Trophy (QMJHL Best GAA)');
      if (player.age === 16 && pts >= 60) awards.push('RDS Cup (QMJHL Rookie of the Year)');
      break;
    case 'USHL':
      if (pts >= 85 || (isGoalie && svPct >= 0.925)) awards.push('USHL Player of the Year');
      if (pts >= 75) awards.push('USHL Forward of the Year');
      if (isDefense && pts >= 50) awards.push('USHL Defenceman of the Year');
      if (isGoalie && svPct >= 0.915 && games >= 30) awards.push('USHL Goaltender of the Year');
      break;
    case 'NHL':
      if (pts >= 105 || (isGoalie && svPct >= 0.925 && games >= 50)) awards.push('Hart Trophy');
      if (g >= 55) awards.push('Maurice Richard Trophy');
      if (pts >= 105) awards.push('Art Ross Trophy');
      if (isDefense && pts >= 75) awards.push('Norris Trophy');
      if (isGoalie && svPct >= 0.920 && games >= 40) awards.push('Vezina Trophy');
      if (player.stats?.seasonsPlayed === 1 && (pts >= 65 || (isGoalie && svPct >= 0.915 && games >= 40))) awards.push('Calder Trophy');
      
      if (g > 92) {
         if (careerHighGoals > 92) {
             if (g > careerHighGoals) awards.push(`👑 BROKE OWN GOAL RECORD (${g})`);
         } else {
             awards.push(`👑 BROKE GRETZKY'S GOAL RECORD (${g})`);
         }
      }
      break;
    default: break;
  }

  if (rating >= 8.5) {
    if (player.league === 'NHL') {
      // THE ALL-STAR FIX:
      // You must be a true star (83+ OVR) OR have an unbelievably elite season (9.0+ Rating) to get the nod.
      const isTrueStar = player.ovr >= 83;
      const isHavingEliteSeason = rating >= 9.0;
      
      if (isTrueStar || isHavingEliteSeason) {
          awards.push('NHL All-Star');
      }
      
      // 1st Team All-Star is for the absolute best of the best
      if (rating >= 9.2 && player.ovr >= 85) {
          awards.push('1st Team All-Star');
      }
    } else if (['OHL', 'WHL', 'QMJHL'].includes(player.league)) {
      awards.push(`${player.league} 1st All-Star Team`);
    } else if (player.league === 'NCAA') {
      awards.push('1st Team All-American');
    } else if (player.league) {
      awards.push(`${player.league} All-Star`);
    }
  }

  return awards;
}

// We need to pass the full player object into this function now to read their archetype
function _computeProgressionDelta({ player, trainingEffect, rating, newAge, coachModifier }) {
  const st = {
    shooting:    trainingEffect.shooting    || 0,
    skating:     trainingEffect.skating     || 0,
    stamina:     trainingEffect.stamina     || 0,
    hockeyIQ:    trainingEffect.hockeyIQ    || 0,
    physicality: trainingEffect.physicality || 0
  };

  // ARCHETYPE CAPS: Prevent players from maxing out stats outside their role
  const arch = player.archetype || '';
  if (arch.includes('Sniper') || arch.includes('Playmaker') || arch.includes('Dynamo')) {
      if (player.physicality >= 75) st.physicality = Math.min(0, st.physicality); // Soft cap on hitting
  } else if (arch.includes('Power') || arch.includes('Shutdown') || arch.includes('Grinder')) {
      if (player.shooting >= 80) st.shooting = Math.min(0, st.shooting); // Soft cap on sniping
      if (player.skating >= 85) st.skating = Math.min(0, st.skating); // Soft cap on speed
  } else if (arch.includes('Butterfly')) {
      if (player.skating >= 85) st.skating = Math.min(0, st.skating); // Goalies: POS soft cap
  }

  if (newAge <= 28) {
    const pointsToDistribute = rating >= 8.5 ? 2 : rating >= 7.0 ? 1 : 0;
    const statsToUpgrade = ['shooting', 'skating', 'stamina', 'hockeyIQ', 'physicality'];
    for (let i = 0; i < pointsToDistribute; i++) {
      const s = statsToUpgrade[Math.floor(Math.random() * statsToUpgrade.length)];
      st[s]++;
    }
  }

  if (newAge >= 31) {
    const agePenalty = (newAge - 30) * 0.40; 
    
    st.skating     -= Math.floor((4 * agePenalty) * coachModifier);
    st.stamina     -= Math.floor((5 * agePenalty) * coachModifier);
    st.physicality -= Math.floor((3 * agePenalty) * coachModifier);
    
    if (newAge >= 33) {
        st.shooting -= Math.floor((2 * agePenalty) * coachModifier);
        st.hockeyIQ -= Math.floor((1 * agePenalty) * coachModifier);
    }
  }

  return st;
}

function _computeLeaguePlacement(p, isJuniorLg, isEuroLg, isNCAA) {
  let currentLg = p.league;
  let currentTeam = p.team;
  let waiverEvent = null;
  let isDemoted = false;

  const promoteThresh = p.pos === 'G' ? 75 : 68;
  const demoteThresh  = p.pos === 'G' ? 71 : 64;

  if (!isJuniorLg && !isEuroLg && !isNCAA) {
    if (p.ovr >= promoteThresh) {
      if (currentLg === 'AHL') {
        waiverEvent = 'You had a great camp and earned a call-up to the NHL roster!';
        const parentNhlTeam = nhlTeams.find(t => t.ahlId === currentTeam);
        if (parentNhlTeam) currentTeam = parentNhlTeam.id;
      }
      currentLg = 'NHL';
    } else {
      const isUnder20 = p.age < 20;
      const hasCHLHistory = (p.teamsPlayedFor || []).some(team => (ohlTeams || []).find(o=>o.id===team) || (whlTeams || []).find(o=>o.id===team) || (qmjhlTeams || []).find(o=>o.id===team));
      const needsAHLDevelopment = currentLg === 'NHL' && p.ovr < 78 && p.age < 24 && Math.random() < 0.85;

      if (p.ovr < demoteThresh || needsAHLDevelopment) {
        if (currentLg === 'NHL') {
          if (isUnder20 && hasCHLHistory && Math.random() > 0.5) {
             // Prospect stays in the NHL past 9 games!
          } else if (isUnder20 && hasCHLHistory) {
             const lastCHL = (p.teamsPlayedFor || []).slice().reverse().find(team => (ohlTeams || []).find(o=>o.id===team) || (whlTeams || []).find(o=>o.id===team) || (qmjhlTeams || []).find(o=>o.id===team));
             currentTeam = lastCHL || p.chlRights || 'UNK';
             if ((whlTeams || []).find(team=>team.id===currentTeam)) currentLg = 'WHL';
             else if ((qmjhlTeams || []).find(team=>team.id===currentTeam)) currentLg = 'QMJHL';
             else currentLg = 'OHL';
             isDemoted = true;
             waiverEvent = '9_GAME_RULE';
          } else {
             const parentNhlTeam = nhlTeams.find(t => t.id === currentTeam);
             if (parentNhlTeam && parentNhlTeam.ahlId) currentTeam = parentNhlTeam.ahlId;
             currentLg = 'AHL';
             isDemoted = true;
             
             const proSeasons = p.stats?.seasonsPlayed || 0;
             const isRFA = p.age < 27 && proSeasons < 7;
             const isELC = p.contract?.salary === 925000 || (isRFA && proSeasons < 3);
             
             if (!isELC && !isRFA && Math.random() < 0.3) {
                 const pool = (nhlTeams || []).filter(t => t.id !== p.team);
                 currentTeam = pool[Math.floor(Math.random() * pool.length)].id;
                 currentLg = 'NHL';
                 waiverEvent = 'CLAIMED';
             } else {
                 waiverEvent = needsAHLDevelopment ? 'DEVELOPMENT' : 'WAIVERS';
             }
          }
        }
      }
    }
  }

  return { currentLg, currentTeam, waiverEvent, isDemoted };
}

// A season does not have to be one block. options lets it run in segments:
//   forceGames     - play exactly this many games instead of a full season
//   gamesFraction  - play this share of what is left (the deadline cuts at ~0.7)
//   lockPlacement  - stay at the player's own club, skip the demotion/waiver move
//   segmentOnly    - return just the stat line, with no end-of-season bookkeeping
//   priorStints    - stat lines from earlier segments, merged into this one's recap
// A nine-game NHL trial is a segment; the rest of the year is the final call.
export function simulateSeason(player, trainingEffect = {}, gamesMissed = 0, options = {}) {
  const p = player;
  const isJuniorLg = juniorLeagues.includes(p.league);
  const isEuroLg = euroLeagues.includes(p.league);
  const isNCAA = p.league === 'NCAA';
  
  const coachTrust = p.relationships?.coach || 50;

  const placement = _computeLeaguePlacement(p, isJuniorLg, isEuroLg, isNCAA);
  let currentLg   = options.lockPlacement ? p.league : placement.currentLg;
  let currentTeam = options.lockPlacement ? p.team : placement.currentTeam;
  let waiverEvent = options.lockPlacement ? null : placement.waiverEvent;
  const isDemoted = options.lockPlacement ? false : placement.isDemoted;

  let simSht = getActiveStat(p, 'shooting') + (trainingEffect.shooting || 0);
  let simSkt = getActiveStat(p, 'skating') + (trainingEffect.skating || 0);
  let simPhy = getActiveStat(p, 'physicality') + (trainingEffect.physicality || 0);
  let simIq = getActiveStat(p, 'hockeyIQ') + (trainingEffect.hockeyIQ || 0);

  if (isJuniorLg || isNCAA) { simSht += 25; simSkt += 25; simIq += 25; simPhy += 25; }
  else if (currentLg === 'AHL') { simSht += 15; simSkt += 15; simIq += 15; simPhy += 15; }
  else if (isEuroLg) { simSht += 10; simSkt += 10; simIq += 10; simPhy += 10; }

  let roleMulti = 1.0;
  const cRole = p.contract?.role || '';

  if (cRole) {
    // A two-way deal is a PAY STRUCTURE, not a playing style, and a string match
    // was confusing the two. "Two-Way Deal" landed in the same tier as "Top 4"
    // and "Middle Six", so a fringe player on an AHL-start contract produced like
    // a middle-six NHLer: 37 points for a 72 OVR, against 22 for the identical
    // player labelled bottom six. A two-way man is in and out of the lineup and
    // plays fourth-line minutes when he is up, so he belongs below the depth tier.
    if (cRole.includes('Two-Way Deal') || cRole.includes('Two-Way Contract') || cRole.includes('AHL Start')) {
      roleMulti = 0.50;
    } else if (cRole.includes('Core') || cRole.includes('Sniper') || cRole.includes('Playmaker') || cRole.includes('Offensive') || cRole.includes('Starter')) {
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
  } else {
    if (p.ovr >= 70) roleMulti = 1.30;
    else if (p.ovr >= 62) roleMulti = 1.00;
    else if (p.ovr >= 56) roleMulti = 0.65;
    else roleMulti = 0.35;
  }

  const config = LEAGUE_CONFIG[currentLg];
  const teamPool = getOpponentPool(currentLg);
  const teamCount = teamPool ? teamPool.length : 32;
  const playoffSpots = config ? config.playoffSpots : 16;
  const maxGames = config?.games || 82;

  const randomTeamFactor = Math.random(); 
  let playerImpact = p.pos === 'G' ? (p.ovr - 70) / 60 : (p.ovr - 70) / 80;

  const salary = p.contract?.salary || 0;
  if (currentLg === 'NHL') {
      if (p.ovr >= 88 && salary <= 5000000) playerImpact += 0.15; 
      if (salary >= 11500000) playerImpact -= 0.15; 
  }
  if (p.isGenerational) playerImpact += 0.20;

  const finalTeamFactor = Math.min(0.95, Math.max(0.05, randomTeamFactor + playerImpact));
  const teamStrength = 0.65 + (finalTeamFactor * 0.55); 
  
  // --- TIME ON ICE (TOI) CALCULATION ---
  let avgToi;
  let fatigueMultiplier = 1.0;

  if (p.pos === 'G') {
      avgToi = 60.0;
  } else {
      // 1. Base TOI from role (e.g., 1.25 roleMulti = ~18.5 mins, 0.60 = ~11 mins)
      let baseToi = 8.0 + (roleMulti * 8.5); 

      // 2. Coach Trust Modifier (Trust earns special teams / 3rd period shifts)
      const trustMod = (coachTrust - 50) * 0.05; // +/- 2.5 mins

      // 3. Stamina Modifier
      const staminaMod = (p.stamina - 50) * 0.04; // +/- 2 mins

      avgToi = Math.min(26.5, Math.max(7.0, baseToi + trustMod + staminaMod));

      // 4. Fatigue Check (Heavy minutes + Low stamina = production drop)
      if (avgToi > 19.0 && p.stamina < 65) {
          fatigueMultiplier = 0.85; // 15% drop in goals/assists
      }
  }

  let standings = Math.max(1, Math.min(teamCount, Math.round(teamCount - (finalTeamFactor * teamCount) + 1)));
  if (isEuroLg) standings = teamCount + 1; 
  const madePlayoffs = !isEuroLg && standings <= playoffSpots;

  let games;
  if (p.pos === 'G') {
      let minG, maxG;
      if (cRole.includes('Backup')) {
          minG = 15; maxG = 30; // Backup
      } else if (p.ovr >= 85) {
          minG = 55; maxG = 68; // Workhorse ace
      } else if (p.ovr >= 78) {
          minG = 50; maxG = 62; // Established starter
      } else if (p.ovr >= 72) {
          minG = 35; maxG = 50; // 1B / Tandem
      } else {
          // Sub-70 OVR, but ensure minor league starters still get decent ice time
          if (currentLg !== 'NHL' && roleMulti >= 1.0) {
              minG = 35; maxG = 50; 
          } else {
              minG = 15; maxG = 30;
          }
      }
      const leagueScale = maxGames / 82; // Adjusts the bands if the league plays fewer than 82 games (e.g. NCAA)
      games = Math.floor((minG + Math.random() * (maxG - minG)) * leagueScale);
  } else if (roleMulti <= 0.65) {
      games = Math.floor(maxGames * (0.75 + Math.random() * 0.2));
  } else {
      games = Math.floor(maxGames * (0.9 + Math.random() * 0.1)); 
  }

  // NEW: Deduct the missed games from their total!
  games = Math.max(0, games - gamesMissed);

  // A fixed-length stint plays exactly its games. The caller passes the games
  // already used by earlier segments as gamesMissed, so the year still adds up.
  if (options.forceGames !== undefined) games = Math.max(0, options.forceGames);

  // gamesFraction takes a share of what is left, which is how the season is cut
  // at the trade deadline: roughly seventy per cent of the schedule is played
  // before it, and whatever the deadline decides governs the rest.
  if (options.gamesFraction !== undefined) games = Math.max(1, Math.round(games * options.gamesFraction));

  const lgMulti = currentLg === 'NHL' ? 1.0 : (isJuniorLg ? 1.3 : 1.1);
  let g = 0, a = 0, pm = 0, saves = 0, shots = 0, sho = 0;

  if (p.pos === 'G') {
      const savePctBase = 0.880 + ((simSht + simSkt + simPhy) - 150) * 0.0004 + ((teamStrength - 1) * 0.05);
      const actualSavePct = Math.min(0.940, Math.max(0.840, savePctBase + (Math.random() * 0.02 - 0.01)));
      shots = games * (26 + Math.floor(Math.random() * 8));
      saves = Math.floor(shots * actualSavePct);
      
      const baseShutouts = Math.max(0, Math.floor((actualSavePct - 0.890) * 150) + Math.floor(Math.random() * 3));
      sho = Math.round(baseShutouts * (games / 82)); // Shutouts now scale proportionally to games played
  } else {
      let gRaw, aRaw;
      if (['LD', 'RD'].includes(p.pos)) {
          const gpg = Math.max(0, (simSht - 55) * 0.004 + (simIq - 50) * 0.002);
          const apg = Math.max(0, (simIq - 50) * 0.009 + (simSkt - 50) * 0.004);
          gRaw = games * gpg * roleMulti * teamStrength * lgMulti * fatigueMultiplier * (0.85 + Math.random() * 0.3);
          aRaw = games * apg * roleMulti * teamStrength * lgMulti * fatigueMultiplier * (0.85 + Math.random() * 0.3);
          pm = Math.floor((teamStrength - 1) * 60 + ((simPhy + simIq) - 130) * 0.2 + (Math.random() * 10 - 5));
      } else if (p.pos === 'C') {
          const gpg = Math.max(0, (simSht - 55) * 0.009 + (simIq - 50) * 0.002);
          const apg = Math.max(0, (simIq - 50) * 0.012 + (simSkt - 50) * 0.005);
          gRaw = games * gpg * roleMulti * teamStrength * lgMulti * fatigueMultiplier * (0.85 + Math.random() * 0.3);
          aRaw = games * apg * roleMulti * teamStrength * lgMulti * fatigueMultiplier * (0.85 + Math.random() * 0.3);
          pm = Math.floor((teamStrength - 1) * 50 + ((simPhy + simIq) - 130) * 0.2 + (Math.random() * 10 - 5));
      } else {
          const gpg = Math.max(0, (simSht - 50) * 0.009 + (simSkt - 50) * 0.002); 
          const apg = Math.max(0, (simIq - 50) * 0.008 + (simSkt - 50) * 0.004);
          gRaw = games * gpg * roleMulti * teamStrength * lgMulti * fatigueMultiplier * (0.85 + Math.random() * 0.3);
          aRaw = games * apg * roleMulti * teamStrength * lgMulti * fatigueMultiplier * (0.85 + Math.random() * 0.3);
          pm = Math.floor((teamStrength - 1) * 50 + ((simSkt + simSht) - 130) * 0.2 + (Math.random() * 10 - 5));
      }

      if (currentLg === 'NHL') {
          g = Math.floor(gRaw > 55 ? 55 + (gRaw - 55) * 0.35 : gRaw);
          a = Math.floor(aRaw > 75 ? 75 + (aRaw - 75) * 0.40 : aRaw);
      } else {
          g = Math.floor(gRaw);
          a = Math.floor(aRaw);
      }
  }

  let rating = p.pos === 'G'
    ? Math.min(10, Math.max(1, 5.0 + (saves / shots - 0.900) * 100))
    : Math.min(10, Math.max(1, 5.0 + (g + a + pm * 0.5) / games * 5));
  rating = Number(rating.toFixed(1));

  let playedLg = currentLg;

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

  const tempPlayer = { ...player, league: playedLg };
  const awards = _computeAwards({ player: tempPlayer, rating, g, a, saves, shots, games, standings });
  const offPercent = p.pos === 'G' ? 0 : Math.min(100, Math.round(((g + a) / ((g * 2) + 40)) * 100));
  const newAge = p.age + 1;
  
  // A segment is only "how did he play in these games". Nothing below belongs to
  // it: no ageing, no contract tick, no progression, no career totals. Those
  // happen once, when the last segment of the year runs.
  if (options.segmentOnly) {
    return {
      segment: {
        team: currentTeam, league: currentLg, games,
        g, a, pm, saves, shots, sho, avgToi, rating, standings
      }
    };
  }

  // Every stint of this season, earlier ones first, this one last.
  const thisStint = { team: currentTeam, league: playedLg, games, g, a, pm, saves, shots, sho, avgToi, rating };
  // Consecutive stints at the same club are one spell, not two: a prospect kept
  // past his nine games played 71 games for that team, not "9 and then 62".
  const stints = [...(options.priorStints || []), thisStint].reduce((acc, s) => {
    const last = acc[acc.length - 1];
    if (last && last.team === s.team && last.league === s.league) {
      last.games += (s.games || 0); last.g += (s.g || 0); last.a += (s.a || 0);
      last.pm += (s.pm || 0); last.saves += (s.saves || 0);
      last.shots += (s.shots || 0); last.sho += (s.sho || 0);
      return acc;
    }
    return [...acc, { ...s }];
  }, []);

  const seasonTotal = stints.reduce((acc, s) => ({
    games: acc.games + (s.games || 0), g: acc.g + (s.g || 0), a: acc.a + (s.a || 0),
    pm: acc.pm + (s.pm || 0), saves: acc.saves + (s.saves || 0),
    shots: acc.shots + (s.shots || 0), sho: acc.sho + (s.sho || 0)
  }), { games: 0, g: 0, a: 0, pm: 0, saves: 0, shots: 0, sho: 0 });

  const coachItem = shopItems.find(i => i.id === 'coach');
  const coachModifier = p.inventory.includes('coach') ? (coachItem?.effect?.declineModifier ?? 0.5) : 1;
  const st = _computeProgressionDelta({ player: tempPlayer, trainingEffect, rating, newAge, coachModifier });

  // --- TOI DEVELOPMENT IMPACT ---
  if (p.pos !== 'G') {
      if (avgToi < 11.0) {
          // Stunted Growth: Harder to develop on the 4th line
          if (st.shooting > 0) st.shooting--;
          else if (st.skating > 0) st.skating--;
          else if (st.hockeyIQ > 0) st.hockeyIQ--;
      } else if (avgToi > 17.0 && p.age < 23) {
          // Prospect Fast-Track: Top-6 minutes accelerate young players
          const primaryStat = ['LD', 'RD'].includes(p.pos) ? 'physicality' : (p.pos === 'C' ? 'hockeyIQ' : 'shooting');
          st[primaryStat] = (st[primaryStat] || 0) + 1;
      }
  }

  const newSht = p.shooting + st.shooting;
  const newSkt = p.skating + st.skating;
  const newSta = p.stamina + st.stamina;
  const newIq = p.hockeyIQ + st.hockeyIQ;
  const newPhy = p.physicality + st.physicality;

  // Each stint earns fans at its own league's rate: nine NHL games move your
  // profile far more than nine junior games, and a split year should say so.
  const fanStatusGain = stints.reduce((sum, s) => {
    const jr = juniorLeagues.includes(s.league) || s.league === 'NCAA';
    const pts = (s.g || 0) + (s.a || 0);
    if (jr) return sum + Math.floor(pts / 20);
    if (s.league === 'AHL') return sum + Math.floor((pts + ((s.sho || 0) * 5)) / 15);
    return sum + Math.floor((pts + ((s.sho || 0) * 5)) / 3);
  }, 0);

  let valIncrease = p.pos === 'G'
      ? ((seasonTotal.sho * 350000) + (seasonTotal.saves * 600) + (seasonTotal.games * 10000))
      : ((seasonTotal.g * 110000) + (seasonTotal.a * 45000) + (seasonTotal.pm * 15000) + (seasonTotal.games * 8000));
  
  const maxVal = currentLg === 'NHL' ? 20000000 : currentLg === 'AHL' ? 3000000 : 500000;
  const decayedValue = Math.floor((p.stats.value || 50000) * 0.65);
  let newVal = Math.min(maxVal, Math.max(50000, decayedValue + valIncrease));
  
  if (coachModifier < 1) newVal = Math.max(50000, newVal - 500000);
  const nextOvr = recomputeOvr({ pos: p.pos, shooting: newSht, skating: newSkt, physicality: newPhy, hockeyIQ: newIq, stamina: newSta });
  const newPeakOvr = Math.max((p.stats.peakOvr || p.ovr), nextOvr);

  // Each stint is credited to its own career bucket, so a nine-game NHL trial
  // stays nine NHL games instead of being filed under junior with the other 50.
  const bucketOf = (lg) => ['OHL', 'WHL', 'QMJHL', 'USHL', 'NCAA', 'SHL', 'LIIGA'].includes(lg) ? 'chl' : (lg === 'AHL' ? 'ahl' : 'nhl');
  const mergedBuckets = {};
  for (const s of stints) {
    const b = bucketOf(s.league);
    const base = mergedBuckets[b] || {
      games: (p.stats[b]?.games || 0), goals: (p.stats[b]?.goals || 0),
      assists: (p.stats[b]?.assists || 0), plusMinus: (p.stats[b]?.plusMinus || 0),
      shots: (p.stats[b]?.shots || 0), saves: (p.stats[b]?.saves || 0),
      shutouts: (p.stats[b]?.shutouts || 0)
    };
    mergedBuckets[b] = {
      games: base.games + (s.games || 0), goals: base.goals + (s.g || 0),
      assists: base.assists + (s.a || 0), plusMinus: base.plusMinus + (s.pm || 0),
      shots: base.shots + (s.shots || 0), saves: base.saves + (s.saves || 0),
      shutouts: base.shutouts + (s.sho || 0)
    };
  }

  const updatedPlayer = {
    ...p,
    team: currentTeam,
    league: currentLg,
    currentAsg: rating >= 8.5 ? playedLg : null,
    teamsPlayedFor: Array.from(new Set([...(p.teamsPlayedFor || []), currentTeam])),
    relationships: (currentTeam !== p.team) ? { coach: 50, teammates: 50, media: 50 } : p.relationships,
    storylines: (currentTeam !== p.team) ? { ...(p.storylines || {}), lockerRoom: 0 } : p.storylines,
    age: p.age + 1,
    ovr: nextOvr,
    shooting: cap(newSht),
    skating: cap(newSkt),
    physicality: cap(newPhy),
    hockeyIQ: cap(newIq),
    stamina: cap(newSta),
    fanStatus: capFanStatus((p.fanStatus || 0) + fanStatusGain),
    contract: { ...p.contract, years: (p.age < 20 && p.contract?.years > 0 && ['OHL', 'WHL', 'QMJHL'].includes(currentLg)) ? p.contract.years : (p.contract?.years > 0 ? p.contract.years - 1 : 0) },
    stats: {
      ...p.stats,
      value: newVal,
      peakValue: Math.max((p.stats.peakValue || p.stats.value || 0), newVal),
      earnings: (p.stats.earnings || 0) + (p.contract?.salary || 0), 
      careerEarnings: (p.stats.careerEarnings || p.stats.earnings || 0) + (p.contract?.salary || 0), 
      peakOvr: newPeakOvr,
      careerHighGoals: Math.max(p.stats.careerHighGoals || 0, seasonTotal.g),
      seasonsPlayed: (p.stats.seasonsPlayed || 0) + 1,
      ...mergedBuckets
    }
  };

  // The recap is the whole season: the totals add every stint, and stints keeps
  // the breakdown so the screen can say nine games here and fifty there.
  const recap = { g: seasonTotal.g, a: seasonTotal.a, pm: seasonTotal.pm,
    saves: seasonTotal.saves, shots: seasonTotal.shots, sho: seasonTotal.sho,
    games: seasonTotal.games, stints, titleWon: 0, playoffWins: 0, rating, standings, offPercent, waiverEvent, awards, madePlayoffs, avgToi };

  return { updatedPlayer, recap, statChanges: st, isDemoted, madePlayoffs, currentLg, currentTeam };
}

export function generatePlayoffDeck(standings, playoffSpots, round, gamesPerMatchup = 7) {
  const seedStrength = Math.max(0, Math.min(1, 1 - (standings - 1) / Math.max(1, playoffSpots - 1)));

  if (gamesPerMatchup === 1) {
    const roundTightening = Math.max(0, (round - 1)) * 0.03;
    const winChance = Math.max(0.30, Math.min(0.80, 0.40 + seedStrength * 0.35 - roundTightening));
    return [{ isWin: Math.random() < winChance }];
  }

  const winsNeeded = Math.ceil(gamesPerMatchup / 2); 
  const deckSize = 9; 
  
  let winCards = winsNeeded; 
  
  if (seedStrength > 0.5 && round < 4) {
     winCards = winsNeeded + 1; 
  }

  let cards = [];
  for (let i = 0; i < winCards; i++) cards.push({ isWin: true });
  for (let i = 0; i < (deckSize - winCards); i++) cards.push({ isWin: false });
  
  return shuffleArray(cards);
}

export const formatLeagueName = (league) => {
  if (league === 'LIIGA') return 'Liiga';
  if (league === 'SWISS') return 'Swiss National League';
  if (league === 'CZECH') return 'Czech Extraliga';
  if (league === 'SLOVAK') return 'Slovak Extraliga';
  return league;
};

const NO_ARTICLE_LEAGUES = ['SHL', 'LIIGA', 'KHL', 'SWISS', 'DEL', 'ICEHL', 'CZECH', 'SLOVAK'];

export const leagueWithArticle = (league) => {
  const formatted = formatLeagueName(league);
  return NO_ARTICLE_LEAGUES.includes(league) ? formatted : `the ${formatted}`;
};

// The same no-article rule applied to club names. Takes an already-resolved
// name so this file never has to import the team data. The recap hand-rolled
// this rule three times against two different league lists, so a KHL rival
// read "the Dynamo" while the standings line two rows down read "Dynamo".
export const withTeamArticle = (fullName, league, capitalize = false) => {
  if (NO_ARTICLE_LEAGUES.includes(league)) return fullName;
  return `${capitalize ? 'The' : 'the'} ${fullName}`;
};
// --- THE NINE-GAME RULE -----------------------------------------------------
// A drafted 18 or 19 year old on an entry-level contract can play nine NHL games
// before game ten burns the first year of that deal. Clubs use those nine games
// as a look: produce and you stay, and the year is gone; struggle and you are
// returned to junior with the contract intact. It only applies to a player who
// has a junior club to go back to, which is why a European or college prospect
// goes to the AHL instead and never sees this.
export const isNineGameCandidate = (p) => {
  if (!p || p.league !== 'NHL') return false;
  if ((p.age ?? 99) > 19) return false;
  if ((p.contract?.salary || 0) !== 925000) return false;
  const hasJuniorRights = !!p.chlRights
    || (p.seasonHistory || []).some(s => ['OHL', 'WHL', 'QMJHL'].includes(s.league));
  if (!hasJuniorRights) return false;
  // Once ten NHL games are on the record the year is already burned.
  return !(p.seasonHistory || []).some(s => s.league === 'NHL' && (s.games || 0) >= 10);
};

// The club's read on those nine games. This is a judgement call, not a formula
// with a cut-off: two identical nine-game lines can genuinely go different ways,
// so it returns the probability the club keeps him and rolls it once. Production
// carries it, the rating says whether he is NHL calibre yet, and a high pick buys
// rope a late one does not. Ice time is deliberately left out: a nine-game look
// is roughly fourth-line minutes for everybody, so it separates nobody.
export const nineGameVerdict = (p, seg, isTop10Pick = false) => {
  const pts = (seg?.g || 0) + (seg?.a || 0);
  const isG = p?.pos === 'G';
  const svp = (seg?.shots || 0) > 0 ? seg.saves / seg.shots : 0.880;

  // Most nineteen-year-olds go back, which is what happens in the real thing.
  let chance = isG ? 0.24 + ((svp - 0.900) * 10) : 0.10 + (pts * 0.14);
  chance += ((p?.ovr || 60) - 70) * 0.028;
  if (isTop10Pick) chance += 0.25;
  chance = Math.min(0.95, Math.max(0.02, chance));

  return {
    stays: Math.random() < chance,
    chance: Math.round(chance * 100),
    pts,
    svp: isG ? svp : null
  };
};

// --- THE ALL-STAR GAME ------------------------------------------------------
// Two different things share this name and the game had been treating them as
// one. The First and Second All-Star Teams are post-season awards, voted once
// the year is scored, and those stay where they are. The All-Star GAME is an
// exhibition in late January, picked on how the first half has actually gone and
// on how many people want to watch you, which is why fan status counts here.
// There is no All-Star Game in an Olympic year, so the caller gates on that.
export const madeAllStarGame = (p, seg) => {
  if (!seg || !['NHL', 'AHL'].includes(seg.league)) return false;
  const gp = seg.games || 0;
  if (gp < 15) return false; // too little of a half season to be judged on

  let chance;
  if (p?.pos === 'G') {
    const svp = (seg.shots || 0) > 0 ? seg.saves / seg.shots : 0.880;
    chance = (svp - 0.908) * 16;
  } else {
    const ppg = ((seg.g || 0) + (seg.a || 0)) / Math.max(1, gp);
    chance = (ppg - 0.78) * 1.9;
  }

  chance += ((p?.ovr || 60) - 84) * 0.05;
  chance += Math.min(0.12, (p?.fanStatus || 0) / 5000); // the fan vote
  return Math.random() < Math.min(0.90, Math.max(0, chance));
};