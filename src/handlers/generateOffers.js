import { ahlTeams, liigaTeams, nhlTeams, shlTeams, echlTeams, khlTeams, swissTeams, sphlTeams, czechTeams, slovakTeams } from '../data/teams';
import { shopItems } from '../data/economy';
import { getTransferImpact } from '../utils/gameHelpers';
import { getRole } from '../utils/appHelpers';

export function generateOffers(ctx, isTradeRequest = false, overrideTeam = null, overrideLeague = null) {
  const { currentYear, player, setEventFeedback, setFreeAgencyOffers, setScreen } = ctx;

    // Safely extract the team ID in case it was accidentally passed as an object
    let rawTeam = overrideTeam || player.team;
    let actingTeam = typeof rawTeam === 'object' && rawTeam !== null ? (rawTeam.id || rawTeam.team || rawTeam.name || 'UNK') : rawTeam;
    let actingLeague = overrideLeague || player.league; 
    
    // Establish an internal rights variable that travels with the player during a trade
    let currentRights = player.rights;

    // BULLETPROOF RIGHTS HOLDER CHECK
    if (['AHL', 'ECHL'].includes(actingLeague)) {
       let parent = (nhlTeams || []).find(t => t.ahlId === actingTeam || t.echlId === actingTeam || t.id === actingTeam);
       
       if (!parent && currentRights) {
           parent = (nhlTeams || []).find(t => t.id === currentRights);
       }

       if (parent) {
           actingTeam = parent.id;
           actingLeague = 'NHL';
           currentRights = parent.id; // Sync rights to the actual NHL parent
       }
    } else if (actingLeague === 'NHL' && actingTeam !== 'UNK') {
       currentRights = actingTeam; // Sync rights to the active NHL club
    }

    const agentItem = shopItems.find(i => i.id === 'agent');
    const agentModifier = agentItem?.effect?.salaryModifier ?? 1.15;
    const multi = (player.inventory || []).includes('agent') ? agentModifier : 1.0;

    // NEW: League-wide reputation modifier
    const repMod = (player.stats?.reputation ?? 100) / 100;

    let leagueMinimum = 850000;
    if (currentYear === 2027) leagueMinimum = 900000;
    else if (currentYear >= 2029) leagueMinimum = 1000000;

    let baseSalary;
    let maxYears;

    // Force NHL logic if actingLeague is NHL. Impossible to get $165k here.
    if (actingLeague === 'NHL') {
      const careerAwards = player.stats?.awards || [];
      const isSuperstar = player.ovr >= 88 || careerAwards.some(a => ['Hart', 'Vezina', 'Norris', 'Art Ross', 'Rocket'].some(aw => a.includes(aw)));

      if (player.ovr >= 85 || isSuperstar) {
        baseSalary = (7500000 + ((player.ovr - 85) * 1000000)) * multi * repMod;
        maxYears = 8;
      } else if (player.ovr >= 80) {
        baseSalary = (4500000 + ((player.ovr - 80) * 600000)) * multi * repMod;
        maxYears = 5;
      } else if (player.ovr >= 75) {
        baseSalary = (2000000 + ((player.ovr - 75) * 500000)) * multi * repMod;
        maxYears = 3;
      } else {
        baseSalary = (leagueMinimum + 150000 + ((player.ovr - 70) * 100000)) * multi * repMod;
        maxYears = 2;
      }

      if (isSuperstar) {
         baseSalary = Math.max(baseSalary, 10500000 * multi * repMod);
         maxYears = Math.max(maxYears, 8);
      }

      if (player.age >= 37) {
         maxYears = Math.min(maxYears, 1);
      } else if (player.age >= 35) {
         maxYears = Math.min(maxYears, 2);
      } else if (player.age >= 32) {
         maxYears = Math.min(maxYears, 4);
      }

      const NHL_MAX_SALARY = 13500000;
      baseSalary = Math.min(NHL_MAX_SALARY, baseSalary);
    } else {
      // Minor league / amateur fallback pay
      baseSalary = (leagueMinimum + (Math.random() * 150000)) * multi;
      maxYears = 3; 
    }

    baseSalary = Math.max(leagueMinimum, Math.round(baseSalary / 25000) * 25000);
    let offers = [];
    
    const isRFA = actingLeague === 'NHL' && player.age < 27;
    const isAmateurGraduating = ['OHL', 'WHL', 'QMJHL', 'USHL', 'NCAA'].includes(actingLeague);
    
    const coachTrust = player.relationships?.coach || 50; // B2: Front Office Consumer
    let teamDidNotExtend = false;

    if (!isTradeRequest && !isAmateurGraduating) {
      // If Front Office trust is toxic, you are a liability and they let you walk (unless you're an elite superstar)
      if (coachTrust < 30 && player.ovr < 88 && Math.random() < 0.75) {
         setEventFeedback("The front office considers you a locker room liability. They have informed your agent they will not be offering an extension. You are heading to the open market.");
         teamDidNotExtend = true;
      } 
      // High Front Office trust saves fringe players from being cut
      else if (player.ovr < 65 && Math.random() > (coachTrust > 75 ? 0.85 : 0.60)) {
         setEventFeedback(isRFA ? "Your team elected not to extend a Qualifying Offer. You are now an Unrestricted Free Agent." : "Your team elected not to extend your contract. You are now a UFA.");
         teamDidNotExtend = true;
      } else if (!isRFA && Math.random() > 0.70 && player.ovr < 85 && coachTrust < 70) {
         setEventFeedback("Your current team has decided to move in a different direction and will not offer you an extension. You are heading to the open market.");
         teamDidNotExtend = true;
      } else {
         // QUALIFYING OFFER MATH
         let qoSalary = baseSalary;
         if (isRFA && player.contract?.salary) {
             const prev = player.contract.salary;
             if (prev <= 660000) qoSalary = prev * 1.10;
             else if (prev <= 1000000) qoSalary = Math.min(1000000, prev * 1.05);
             else qoSalary = prev;
         }

         // Generate the Current Club offer
         const currentClubStanding = actingLeague === 'NHL' ? Math.floor(Math.random() * 32) + 1 : null;
         let ccState = 'Current Club';
         if (actingLeague === 'NHL') {
             if (currentClubStanding <= 8) ccState = 'Contender';
             else if (currentClubStanding <= 16) ccState = 'Competitor';
             else if (currentClubStanding <= 24) ccState = 'Outsider';
             else ccState = 'Rebuilder';
         } else if (player.league === 'AHL' || player.ovr < 75) {
             ccState = 'Two-Way Contract';
         }

         offers.push({
           team: actingTeam,
           league: actingLeague,
           type: isRFA ? (player.ovr >= 82 ? 'RFA EXTENSION' : 'QUALIFYING OFFER') : 'EXTENSION',
           salary: isRFA && player.ovr < 82 ? qoSalary : (actingLeague !== 'NHL' ? Math.max(85000, Math.floor(baseSalary * 0.15)) : baseSalary),
           years: isRFA && player.ovr < 82 ? 1 : maxYears,
           role: actingLeague !== 'NHL' ? 'Pro Roster' : ((player.league === 'AHL' || player.ovr < 75) ? 'Two-Way Deal (AHL Start)' : getRole(baseSalary, player)),
           idolHit: 10,
           state: ccState,
           standing: currentClubStanding
         });

         // NEW: HOMETOWN DISCOUNT (For Beloved UFAs)
         if (!isRFA && actingLeague === 'NHL' && (player.idolatry || 0) >= 600) {
             offers.push({
                 team: actingTeam,
                 league: actingLeague,
                 type: 'HOMETOWN DISCOUNT',
                 salary: Math.round((baseSalary * 0.65) / 25000) * 25000, // 35% pay cut to help the cap
                 years: Math.min(8, maxYears + 2), // Rewarded with maximum term security
                 role: getRole(baseSalary, player),
                 idolHit: 100, // Massive loyalty boost
                 state: 'Staying Put',
                 nmc: true, // Rewarded with a No-Movement Clause
                 perks: [{ text: '🔒 Absolute Loyalty (+100 Fans)', idol: 100, ovr: 0, money: 0, color: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30' }]
             });
         }
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
        
        const isUnder18 = player.age < 18;

        if (player.ovr < 65) {
            if (player.ovr < 55) {
               pool = isUnder18 ? (shlTeams || []) : (sphlTeams || []);
               targetLg = isUnder18 ? 'SHL' : 'SPHL';
            } else if (player.ovr < 60) {
               pool = isUnder18 ? (liigaTeams || []) : (echlTeams || []);
               targetLg = isUnder18 ? 'LIIGA' : 'ECHL';
            } else {
               const roll = Math.random();
               if (isUnder18) {
                   pool = roll > 0.50 ? (shlTeams || []) : 
                          roll > 0.25 ? (liigaTeams || []) : 
                          roll > 0.10 ? (czechTeams || []) : (slovakTeams || []);
                   targetLg = pool === shlTeams ? 'SHL' : 
                              pool === liigaTeams ? 'LIIGA' : 
                              pool === czechTeams ? 'CZECH' : 'SLOVAK';
               } else {
                   pool = roll > 0.75 ? (ahlTeams || []) : 
                          roll > 0.60 ? (shlTeams || []) : 
                          roll > 0.45 ? (liigaTeams || []) : 
                          roll > 0.25 ? (czechTeams || []) : (slovakTeams || []);
                   targetLg = pool === ahlTeams ? 'AHL' : 
                              pool === shlTeams ? 'SHL' : 
                              pool === liigaTeams ? 'LIIGA' : 
                              pool === czechTeams ? 'CZECH' : 'SLOVAK';
               }
            }
        } else if (player.ovr < 75 && i === offerCount - 1) {
            const roll = Math.random();
            if (roll > 0.6) {
                pool = khlTeams || [];
                targetLg = 'KHL';
            } else if (roll > 0.3) {
                pool = swissTeams || [];
                targetLg = 'SWISS';
            } else {
                pool = isUnder18 ? (shlTeams || []) : (ahlTeams || []);
                targetLg = isUnder18 ? 'SHL' : 'AHL';
            }
        }

        if (targetLg === 'NHL' && currentRights) {
            const playedProNA = (player.teamsPlayedFor || []).some(tId => 
                (nhlTeams || []).some(nhl => nhl.id === tId) || 
                (ahlTeams || []).some(ahl => ahl.id === tId)
            );
            if (!playedProNA) {
                pool = pool.filter(t => t.id === currentRights);
            }
        }

        if (pool.length > 0) {
          const t = pool[Math.floor(Math.random() * pool.length)].id;
          if (t !== actingTeam && !offers.find(o => o.team === t)) {
            let offerSalary = Math.round((baseSalary * (0.85 + (Math.random() * 0.35))) / 25000) * 25000; 
            
            let teamState;
            let projectedStanding = null;

            if (targetLg === 'NHL') {
                projectedStanding = Math.floor(Math.random() * 32) + 1;
                
                if (projectedStanding <= 8) {
                    teamState = 'Contender';
                    offerSalary = Math.round((offerSalary * 0.85) / 25000) * 25000;
                } else if (projectedStanding <= 16) {
                    teamState = 'Competitor';
                } else if (projectedStanding <= 24) {
                    teamState = 'Outsider';
                    offerSalary = Math.round((offerSalary * 1.10) / 25000) * 25000;
                } else {
                    teamState = 'Rebuilder';
                    offerSalary = Math.round((offerSalary * 1.20) / 25000) * 25000;
                }
            } else {
                teamState = 'Development Roster';
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
              standing: projectedStanding,
              nmc: getsNMC
            });
          }
        }
      }
    }
    
    // RUSSIAN FACTOR KHL MEGADEAL INJECTION
    if (player.storylines?.russianFactorChoice === 'KHL' && !offers.some(o => o.league === 'KHL')) {
      const khlPool = khlTeams || [];
      const randomKhlTeam = khlPool[Math.floor(Math.random() * khlPool.length)]?.id || 'CSKA';
      
      offers.push({
        team: randomKhlTeam,
        league: 'KHL',
        type: 'FREE AGENCY',
        salary: 2200000,
        years: 2,
        role: '1st Line Core',
        idolHit: 30,
        state: 'KHL Megadeal'
      });
    }

    if (offers.length === 0) {
      const isUnder18 = player.age < 18;
      const fallbackPool = isUnder18 ? (shlTeams || []) : (ahlTeams || []);
      const fallbackLg = isUnder18 ? 'SHL' : 'AHL';
      offers = [{
        team: (fallbackPool && fallbackPool.length > 0) ? fallbackPool[0].id : 'UNK',
        league: fallbackLg,
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