import {
  nhlTeams, ahlTeams, ohlTeams, whlTeams, qmjhlTeams, juniorLeagues, euroLeagues,
  LEAGUE_CONFIG, getOpponentPool
} from '../data/teams';
import { shopItems } from '../data/economy';

export const shuffleArray = (array) => [...array].sort(() => Math.random() - 0.5);

export const cap = (val) => Math.min(100, Math.max(0, val));

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
  safe:   { win: { idol: 3 },  loss: { idol: -2 } },
  skill:  { win: { idol: 7 },  loss: { idol: -3 } },
  gamble: { win: { idol: 15, money: 300000 }, loss: { idol: -8 } },
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
      if (player.stats?.seasonsPlayed === 1 && pts >= 65) awards.push('Calder Trophy');
      
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
      awards.push('NHL All-Star');
      if (rating >= 9.2) awards.push('1st Team All-Star');
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

function _computeProgressionDelta({ trainingEffect, rating, newAge, coachModifier }) {
  const st = {
    shooting:    trainingEffect.shooting    || 0,
    skating:     trainingEffect.skating     || 0,
    stamina:     trainingEffect.stamina     || 0,
    hockeyIQ:    trainingEffect.hockeyIQ    || 0,
    physicality: trainingEffect.physicality || 0
  };

  if (newAge <= 28) {
    const pointsToDistribute = rating >= 8.5 ? 2 : rating >= 7.0 ? 1 : 0;
    const statsToUpgrade = ['shooting', 'skating', 'stamina', 'hockeyIQ', 'physicality'];
    for (let i = 0; i < pointsToDistribute; i++) {
      const s = statsToUpgrade[Math.floor(Math.random() * statsToUpgrade.length)];
      st[s]++;
    }
  }

  if (newAge >= 31) {
    const agePenalty = (newAge - 30) * 0.25; 
    
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

export function simulateSeason(player, trainingEffect = {}) {
  const p = player;
  const isJuniorLg = juniorLeagues.includes(p.league);
  const isEuroLg = euroLeagues.includes(p.league);
  const isNCAA = p.league === 'NCAA';

  const placement = _computeLeaguePlacement(p, isJuniorLg, isEuroLg, isNCAA);
  let currentLg   = placement.currentLg;
  let currentTeam = placement.currentTeam;
  let waiverEvent = placement.waiverEvent;
  const isDemoted = placement.isDemoted;

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

  let standings = Math.max(1, Math.min(teamCount, Math.round(teamCount - (finalTeamFactor * teamCount) + 1)));
  if (isEuroLg) standings = teamCount + 1; 
  const madePlayoffs = !isEuroLg && standings <= playoffSpots;

  let games;
  if (p.pos === 'G') {
      games = (cRole.includes('Backup') || roleMulti <= 0.4) ? Math.floor(maxGames * 0.3) : Math.floor(maxGames * (0.8 + Math.random() * 0.15));
  } else if (roleMulti <= 0.65) {
      games = Math.floor(maxGames * (0.75 + Math.random() * 0.2));
  } else {
      games = Math.floor(maxGames * (0.9 + Math.random() * 0.1)); 
  }

  const lgMulti = currentLg === 'NHL' ? 1.0 : (isJuniorLg ? 1.3 : 1.1);
  let g = 0, a = 0, pm = 0, saves = 0, shots = 0, sho = 0;

  if (p.pos === 'G') {
      const savePctBase = 0.880 + ((simSht + simSkt + simPhy) - 150) * 0.0004 + ((teamStrength - 1) * 0.05);
      const actualSavePct = Math.min(0.940, Math.max(0.840, savePctBase + (Math.random() * 0.02 - 0.01)));
      shots = games * (26 + Math.floor(Math.random() * 8));
      saves = Math.floor(shots * actualSavePct);
      sho = Math.max(0, Math.floor((actualSavePct - 0.890) * 150) + Math.floor(Math.random() * 3));
  } else {
      let gRaw, aRaw;
      if (['LD', 'RD'].includes(p.pos)) {
          const gpg = Math.max(0, (simSht - 55) * 0.004 + (simIq - 50) * 0.002);
          const apg = Math.max(0, (simIq - 50) * 0.009 + (simSkt - 50) * 0.004);
          gRaw = games * gpg * roleMulti * teamStrength * lgMulti * (0.85 + Math.random() * 0.3);
          aRaw = games * apg * roleMulti * teamStrength * lgMulti * (0.85 + Math.random() * 0.3);
          pm = Math.floor((teamStrength - 1) * 60 + ((simPhy + simIq) - 130) * 0.2 + (Math.random() * 10 - 5));
      } else if (p.pos === 'C') {
          const gpg = Math.max(0, (simSht - 55) * 0.009 + (simIq - 50) * 0.002);
          const apg = Math.max(0, (simIq - 50) * 0.012 + (simSkt - 50) * 0.005);
          gRaw = games * gpg * roleMulti * teamStrength * lgMulti * (0.85 + Math.random() * 0.3);
          aRaw = games * apg * roleMulti * teamStrength * lgMulti * (0.85 + Math.random() * 0.3);
          pm = Math.floor((teamStrength - 1) * 50 + ((simPhy + simIq) - 130) * 0.2 + (Math.random() * 10 - 5));
      } else {
          const gpg = Math.max(0, (simSht - 50) * 0.009 + (simSkt - 50) * 0.002); 
          const apg = Math.max(0, (simIq - 50) * 0.008 + (simSkt - 50) * 0.004);
          gRaw = games * gpg * roleMulti * teamStrength * lgMulti * (0.85 + Math.random() * 0.3);
          aRaw = games * apg * roleMulti * teamStrength * lgMulti * (0.85 + Math.random() * 0.3);
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

  const awards = _computeAwards({ player, rating, g, a, saves, shots, games, standings });
  const offPercent = p.pos === 'G' ? 0 : Math.min(100, Math.round(((g + a) / ((g * 2) + 40)) * 100));
  const newAge = p.age + 1;
  
  const coachItem = shopItems.find(i => i.id === 'coach');
  const coachModifier = p.inventory.includes('coach') ? (coachItem?.effect?.declineModifier ?? 0.5) : 1;
  const st = _computeProgressionDelta({ trainingEffect, rating, newAge, coachModifier });

  const newSht = p.shooting + st.shooting;
  const newSkt = p.skating + st.skating;
  const newSta = p.stamina + st.stamina;
  const newIq = p.hockeyIQ + st.hockeyIQ;
  const newPhy = p.physicality + st.physicality;

  const idolGain = isJuniorLg
    ? Math.floor((g + a) / 20)
    : (currentLg === 'AHL' ? Math.floor((g + a + (sho * 5)) / 15) : Math.floor((g + a + (sho * 5)) / 3));

  let valIncrease = p.pos === 'G' 
    ? ((sho * 350000) + (saves * 600) + (games * 10000))
    : ((g * 110000) + (a * 45000) + (pm * 15000) + (games * 8000));
  
  const maxVal = currentLg === 'NHL' ? 20000000 : currentLg === 'AHL' ? 3000000 : 500000;
  const decayedValue = Math.floor((p.stats.value || 50000) * 0.65);
  let newVal = Math.min(maxVal, Math.max(50000, decayedValue + valIncrease));
  
  if (coachModifier < 1) newVal = Math.max(50000, newVal - 500000);
  const nextOvr = recomputeOvr({ pos: p.pos, shooting: newSht, skating: newSkt, physicality: newPhy, hockeyIQ: newIq, stamina: newSta });
  const newPeakOvr = Math.max((p.stats.peakOvr || p.ovr), nextOvr);

  const statBucket = ['OHL', 'WHL', 'QMJHL', 'USHL', 'NCAA', 'SHL', 'LIIGA'].includes(currentLg) ? 'chl' : (currentLg === 'AHL' ? 'ahl' : 'nhl');

  const updatedPlayer = {
    ...p,
    team: currentTeam,
    league: currentLg,
    teamsPlayedFor: Array.from(new Set([...(p.teamsPlayedFor || []), currentTeam])),
    relationships: (currentTeam !== p.team) ? { coach: 50, teammates: 50, media: 50 } : p.relationships,
    age: p.age + 1,
    ovr: nextOvr,
    shooting: cap(newSht),
    skating: cap(newSkt),
    physicality: cap(newPhy),
    hockeyIQ: cap(newIq),
    stamina: cap(newSta),
    idolatry: capIdol(p.idolatry + idolGain),
    contract: { ...p.contract, years: (p.age < 20 && p.contract?.years > 0 && ['OHL', 'WHL', 'QMJHL'].includes(currentLg)) ? p.contract.years : (p.contract?.years > 0 ? p.contract.years - 1 : 0) },
    stats: {
      ...p.stats,
      value: newVal,
      earnings: (p.stats.earnings || 0) + (p.contract?.salary || 0), 
      peakOvr: newPeakOvr,
      careerHighGoals: Math.max(p.stats.careerHighGoals || 0, g),
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