// Blue Chip Prospect — Monte Carlo career audit (headless).
import fs from 'fs';
import { simulateSeason, recomputeOvr } from '../src/utils/gameHelpers.js';
import { skaterTrainingPool, goalieTrainingPool } from '../src/data/economy.js';

const ITERATIONS_PER_STRATEGY = 1000;
const STRATEGIES = ['OPTIMIZER', 'BASELINE', 'CHAOS'];
const RETIREMENT_AGE = 38;   
const MIN_RETIREMENT_AGE = 34; 
const results = [];

function makeStartingPlayer(pos = 'C', league = 'OHL', team = 'FLN') {
  let bSht = 55, bSkt = 55, bPhy = 55, bIq = 55, bSta = 55;
  if (pos === 'G')       { bSht += 10; bSkt += 10; bPhy += 5; bIq -= 5; bSta -= 20; }
  else if (['LD','RD'].includes(pos)) { bPhy += 10; bSta += 5; bIq += 5; bSkt -= 5; bSht -= 15; }
  else if (pos === 'C')  { bIq += 10; bSkt += 5; bSht -= 5; bPhy -= 5; bSta -= 5; }
  else                   { bSht += 10; bSkt += 5; bPhy -= 5; bIq -= 5; bSta -= 5; }

  const p = {
    name: 'Test', pos, age: 16, nat: 'CAN',
    shooting: bSht, skating: bSkt, physicality: bPhy, hockeyIQ: bIq, stamina: bSta,
    team, league,
    contract: { salary: 0, years: 3, role: 'Amateur' },
    stats: {
      chl: { goals:0, assists:0, games:0, plusMinus:0, saves:0, shots:0, shutouts:0 },
      ahl: { goals:0, assists:0, games:0, plusMinus:0, saves:0, shots:0, shutouts:0 },
      nhl: { goals:0, assists:0, games:0, plusMinus:0, saves:0, shots:0, shutouts:0 },
      titles: 0, earnings: 0, value: 100000, seasonsPlayed: 0, memCupBoost: 0, awards: []
    },
    seasonHistory: [], idolatry: 100, inventory: [], buffs: [], teamsPlayedFor: [team],
    startLeague: league, isGenerational: false,
    storylines: { rival:0, lockerRoom:0, hometown:0, injury:0 },
    relationships: { coach: 60, teammates: 60, media: 55 }
  };
  p.ovr = recomputeOvr(p);
  return p;
}

function pickTraining(strategy, player) {
  const pool = player.pos === 'G' ? goalieTrainingPool : skaterTrainingPool;
  if (!pool || pool.length === 0) return { effect: {} };

  if (strategy === 'OPTIMIZER') {
    const epics = pool.filter(c => c.rarity === 'Epic');
    const rares = pool.filter(c => c.rarity === 'Rare');
    if (epics.length) return epics[Math.floor(Math.random() * epics.length)];
    if (rares.length) return rares[Math.floor(Math.random() * rares.length)];
  } else if (strategy === 'CHAOS') {
    if (Math.random() < 0.15) return { effect: {} }; 
    const commons = pool.filter(c => c.rarity === 'Common');
    if (commons.length) return commons[Math.floor(Math.random() * commons.length)];
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

function shouldRetire(strategy, player) {
  const age = player.age;
  if (age >= RETIREMENT_AGE) return true;
  if (age < MIN_RETIREMENT_AGE) return false;
  const staminaMult = strategy === 'OPTIMIZER' ? 0.7 : strategy === 'CHAOS' ? 1.3 : 1.0;
  const baseChance = Math.max(0, (player.stats.seasonsPlayed - 12) * 0.05) + Math.max(0, (75 - player.ovr) * 0.05);
  return Math.random() < (baseChance * staminaMult);
}

function runCareer(strategy) {
  const positions = ['C', 'LW', 'RW', 'LD', 'RD', 'G'];
  const pos = positions[Math.floor(Math.random() * positions.length)];
  const startLeagues = ['OHL', 'WHL', 'QMJHL', 'USHL', 'NCAA', 'SHL', 'LIIGA'];
  const startLeague = startLeagues[Math.floor(Math.random() * startLeagues.length)];

  let player = makeStartingPlayer(pos, startLeague, 'FLN');
  let peakOvr = player.ovr;
  let everInNhl = false;
  let everDemoted = false;
  let teamsPlayedFor = new Set([player.team]);
  let allAwards = [];
  const leagueSeasons = {}; 

  for (let season = 0; season < 22; season++) {
    
    // ==========================================
    // 1. HEADLESS CAREER LOGIC (DRAFT, CONTRACTS, PROMOTION)
    // ==========================================
    
    // Draft Day (Age 18)
    if (player.age === 18 && !player.draftTeam) {
        player.draftTeam = 'BOS'; 
        player.rights = 'BOS';
    }

    // Amateur Graduation (Age 20+)
    if (['OHL', 'WHL', 'QMJHL', 'USHL', 'NCAA'].includes(player.league) && player.age >= 20) {
        player.league = player.ovr >= 78 ? 'NHL' : 'AHL';
        player.team = player.draftTeam || 'BOS';
        player.contract = { salary: 925000, years: 3, role: 'Prospect' };
        teamsPlayedFor.add(player.team);
    }

    // Pro Promotion/Demotion Check (AHL <-> NHL)
    if (player.league === 'AHL' && player.ovr >= 78) {
        player.league = 'NHL';
    } else if (player.league === 'NHL' && player.ovr < 72 && player.age < 24) {
        player.league = 'AHL';
        everDemoted = true;
    }

    // Contract Expiration & Free Agency
    if (!['OHL', 'WHL', 'QMJHL', 'USHL', 'NCAA'].includes(player.league)) {
        if (player.contract && player.contract.years !== undefined) {
            player.contract.years -= 1;
            if (player.contract.years <= 0) {
                // Determine new market value
                if (player.ovr >= 82) {
                    player.league = 'NHL';
                    player.contract = { salary: 6000000, years: 5, role: 'Core' };
                } else if (player.ovr >= 75) {
                    player.league = 'NHL';
                    player.contract = { salary: 2000000, years: 2, role: 'Depth' };
                } else if (player.ovr >= 68) {
                    player.league = 'AHL';
                    player.contract = { salary: 300000, years: 1, role: 'Minor Leaguer' };
                } else {
                    player.league = 'SHL'; // Washout
                    player.contract = { salary: 150000, years: 1, role: 'Euro Pro' };
                }
            }
        }
    }

    // ==========================================
    // 2. SEASON SIMULATION
    // ==========================================
    const card = pickTraining(strategy, player);
    const result = simulateSeason(player, card?.effect || {});
    if (!result || !result.updatedPlayer) break;

    player = result.updatedPlayer;
    player.stats.seasonsPlayed = (player.stats.seasonsPlayed || 0) + 1;
    peakOvr = Math.max(peakOvr, player.ovr);
    
    if (result.currentLg === 'NHL') everInNhl = true;
    teamsPlayedFor.add(result.currentTeam);

    // ==========================================
    // 3. MOCK PLAYOFFS
    // ==========================================
    // 50% base chance to make playoffs, increasing slightly for star players
    const playoffOdds = player.league === 'NHL' && player.ovr >= 88 ? 0.65 : 0.50;
    if (Math.random() < playoffOdds) {
        // Championship Odds (1/16 chance in a 16-team playoff structure)
        if (Math.random() < 0.0625) { 
            player.stats.titles = (player.stats.titles || 0) + 1;
            allAwards.push({ year: 2026 + season, award: `${player.league} Championship` });
        }
    }

    const lgKey = result.currentLg;
    if (!leagueSeasons[lgKey]) leagueSeasons[lgKey] = { games:0, goals:0, assists:0 };
    leagueSeasons[lgKey].games += result.recap?.games || 0;
    leagueSeasons[lgKey].goals += result.recap?.g || 0;
    leagueSeasons[lgKey].assists += result.recap?.a || 0;

    if (shouldRetire(strategy, player)) break;
  }

  const nhlStats = leagueSeasons['NHL'] || { games:0, goals:0, assists:0 };
  const ahlStats = leagueSeasons['AHL'] || { games:0, goals:0, assists:0 };

  return {
    strategy,
    pos,
    startLeague,
    peakOvr,
    finalOvr: player.ovr,
    finalLeague: player.league,
    seasonsPlayed: player.stats.seasonsPlayed,
    retirementAge: player.age,
    everInNhl,
    everDemoted,
    nhlGames: nhlStats.games,
    nhlGoals: nhlStats.goals,
    nhlAssists: nhlStats.assists,
    ahlGames: ahlStats.games,
    teamsCount: teamsPlayedFor.size,
    championships: player.stats.titles || 0,
    individualAwards: allAwards.length,
    awardsList: allAwards.map(a => `${a.year}:${a.award}`).join(' | ')
  };
}

console.log('Blue Chip Prospect career audit — 3,000 simulated careers');
for (const strat of STRATEGIES) {
  for (let i = 0; i < ITERATIONS_PER_STRATEGY; i++) {
    results.push(runCareer(strat));
  }
}

const headers = Object.keys(results[0]);
const rows = results.map(r => headers.map(h => {
  const v = r[h];
  if (typeof v === 'string' && v.includes(',')) return `"${v.replace(/"/g, '""')}"`;
  return v;
}).join(','));
fs.writeFileSync('career_audit_results.csv', [headers.join(','), ...rows].join('\n'));
console.log(`Wrote ${results.length} rows to career_audit_results.csv`);