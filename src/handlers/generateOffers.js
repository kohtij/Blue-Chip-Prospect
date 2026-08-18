// Extracted from App.jsx.
// Takes an `ctx` object with the state, setters, and other handlers it needs.
import { ahlTeams, liigaTeams, nhlTeams, shlTeams } from '../data/teams';
import { shopItems } from '../data/economy';
import { getTransferImpact } from '../utils/gameHelpers';
import { getRole } from '../utils/appHelpers';

export function generateOffers(ctx, isTradeRequest = false, overrideTeam = null) {
  const { currentYear, isAmateur, player, setEventFeedback, setFreeAgencyOffers, setScreen } = ctx;


    // The team currently generating an extension/qualifying offer.
    // Falls back to overrideTeam when specified (e.g. a specific team acting).
    let actingTeam = overrideTeam || player.team;
    let actingLeague = player.league;

    const isNHLContract = (player.contract?.salary || 0) >= 500000;

    // If an AHL player is on an NHL contract, the NHL parent club handles their extension/RFA rights
    if (actingLeague === 'AHL' && isNHLContract) {
       const parent = (nhlTeams || []).find(t => t.ahlId === actingTeam);
       if (parent) {
          actingTeam = parent.id;
          actingLeague = 'NHL';
       }
    }

    // Salary multiplier from the Super Agent shop item — read from economy.js
    // so tweaks to the item's effect actually change contract sizes.
    const agentItem = shopItems.find(i => i.id === 'agent');
    const agentModifier = agentItem?.effect?.salaryModifier ?? 1.15;
    const multi = (player.inventory || []).includes('agent') ? agentModifier : 1.0;

    let leagueMinimum = 850000;
    if (currentYear === 2027) leagueMinimum = 900000;
    else if (currentYear >= 2029) leagueMinimum = 1000000;

    let baseSalary = leagueMinimum;
    let maxYears = 2;

   if (actingLeague === 'AHL' || isAmateur) {
      baseSalary = (leagueMinimum + (Math.random() * 150000)) * multi;
      maxYears = 3; 
    } else if (actingLeague === 'NHL') {
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

      // 🛑 UFA AGE PENALTY: Limit term for aging veterans regardless of how good they are
      if (player.age >= 37) {
         maxYears = Math.min(maxYears, 1);
      } else if (player.age >= 35) {
         maxYears = Math.min(maxYears, 2);
      } else if (player.age >= 32) {
         maxYears = Math.min(maxYears, 4);
      }

      const NHL_MAX_SALARY = 13500000;
      baseSalary = Math.min(NHL_MAX_SALARY, baseSalary);
    }

    baseSalary = Math.max(leagueMinimum, Math.round(baseSalary / 25000) * 25000);
    let offers = [];
    
    const isRFA = actingLeague === 'NHL' && player.age < 27 && (player.stats?.seasonsPlayed || 0) < 7;
    const isAmateurGraduating = ['OHL', 'WHL', 'QMJHL', 'USHL', 'NCAA'].includes(actingLeague);
    
    let teamDidNotExtend = false;
    if (!isTradeRequest && !isAmateurGraduating) {
      if (player.ovr < 65 && Math.random() > 0.60) {
         setEventFeedback(isRFA ? "Your team elected not to extend a Qualifying Offer. You are now an Unrestricted Free Agent." : "Your team elected not to extend your contract. You are now a UFA.");
         teamDidNotExtend = true;
      } else if (!isRFA && Math.random() > 0.70 && player.ovr < 85) {
         // 30% chance for non-superstar UFAs to be let go by their current team
         setEventFeedback("Your current team has decided to move in a different direction and will not offer you an extension. You are heading to the open market.");
         teamDidNotExtend = true;
      } else {
         offers.push({
                   team: actingTeam,
                   league: actingLeague,
                   type: isRFA ? (player.ovr >= 82 ? 'RFA EXTENSION' : 'QUALIFYING OFFER') : 'EXTENSION',
           salary: actingLeague !== 'NHL' ? Math.max(85000, Math.floor(baseSalary * 0.15)) : baseSalary,
           years: isRFA && player.ovr < 82 ? 1 : maxYears,
           role: actingLeague !== 'NHL' ? 'Pro Roster' : getRole(baseSalary, player),
           idolHit: 10,
           state: 'Current Club'
         });
      }
    }

    if (isRFA && !teamDidNotExtend && !isTradeRequest && !isAmateurGraduating) {
      
      if (player.ovr >= 82 && Math.random() < 0.25) {
        const pool = (nhlTeams || []).filter(t => t.id !== actingTeam);
        if (pool.length > 0) {
          const offerSheetTeam = pool[Math.floor(Math.random() * pool.length)].id;
          const osSalary = Math.min(13500000, Math.round((baseSalary * 1.3) / 25000) * 25000);
          offers.push({
            team: offerSheetTeam, league: 'NHL', type: 'OFFER SHEET',
            salary: osSalary, years: 5, role: getRole(osSalary, player),
            idolHit: getTransferImpact(actingTeam, offerSheetTeam), state: 'Offer Sheet'
          });
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
            
            const getsNMC = targetLg === 'NHL' && player.age >= 26 && player.ovr >= 85 && Math.random() > 0.4;
            
            offers.push({
              team: t,
              league: targetLg,
              type: isTradeRequest ? 'TRADE' : 'FREE AGENCY',
              salary: offerSalary,
              years: Math.min(7, Math.floor(Math.random() * maxYears) + 1),
              role: targetLg === 'NHL' ? getRole(offerSalary, player) : 'Pro Roster',
              idolHit: getTransferImpact(actingTeam, t),
              state: teamState,
              nmc: getsNMC
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
}
