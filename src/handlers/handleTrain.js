// Extracted from App.jsx.
// Takes an `ctx` object with the state, setters, and other handlers it needs.
import { LEAGUE_CONFIG, getOpponentPool, getTeamData, nhlTeams, ohlTeams, qmjhlTeams, whlTeams } from '../data/teams';
import { cap, recomputeOvr, simulateSeason } from '../utils/gameHelpers';
import { getFullTeamName } from '../utils/appHelpers';
import { runPostSeasonFlow } from './runPostSeasonFlow';

export function handleTrain(ctx, t) {
  const { player, setActiveEvent, setHasDemandedTrade, setPendingSeasonResult, setPlayer, setScreen, setSeasonEvents, setSeasonRecap, setStatChanges, unlockAchievement } = ctx;

    setHasDemandedTrade(false);
    setSeasonEvents([]);
    const result = simulateSeason(player, t?.effect);

    if (!result) return;

    // Filter out incorrect positional awards
  if (result.recap && result.recap.awards) {
        if (player.pos.includes('D') || player.pos === 'G') {
            result.recap.awards = result.recap.awards.filter(a => !a.includes('Forward'));
        }
        if (player.pos === 'G') {
            result.recap.awards = result.recap.awards.filter(a => !a.includes('Defenseman') && !a.includes('Defender'));
            // NERF: Goalies rarely win MVP, and their rating scales down slightly to prevent runaway idolatry
            if (result.recap.awards.includes('MVP') && Math.random() < 0.90) {
                 result.recap.awards = result.recap.awards.filter(a => a !== 'MVP');
            }
            result.recap.rating = Math.max(0, result.recap.rating - 0.6); 
        }
        
        // Remove redundant "1st/2nd Team All-Star" strings
        result.recap.awards = result.recap.awards.filter(a => !a.includes('1st Team All-Star') && !a.includes('2nd Team All-Star'));

        // Normalize All-Star Logic
        if (player.ovr >= 85 && result.recap.rating >= 7.5 && !result.recap.awards.some(a => a.includes('All-Star'))) {
            result.recap.awards.push('NHL All-Star');
        }
        
        // Standardize and completely deduplicate the awards array so duplicates never appear
        result.recap.awards = Array.from(new Set(
            result.recap.awards.map(a => a === 'All-Star' ? 'NHL All-Star' : a)
        ));
    }

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

    // --- NEW: DYNAMIC TEAM STRENGTHS (SALARY CAP IMPACT) ---
    if (player.league === 'NHL' && result.recap) {
       const salary = player.contract?.salary || 0;
       const isUnderpaid = player.ovr >= 88 && salary <= 5000000;
       const isSuperMax = salary >= 11500000;

       if (isUnderpaid) {
           // Surplus cap space lets the GM build a deep roster
           result.recap.standings = Math.max(1, result.recap.standings - (Math.floor(Math.random() * 6) + 3));
       } else if (isSuperMax) {
           // Cap hell means no depth. Team suffers.
           result.recap.standings = Math.min(32, result.recap.standings + (Math.floor(Math.random() * 6) + 3));
       }
       
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

    // PROGRESSIVE AGING CURVE
    if (finalPlayer.age >= 31) {
      let sktDrop = 0, phyDrop = 0, staDrop = 0, shtDrop = 0;

      // The cliff gets steeper as you get older
      if (finalPlayer.age >= 38) {
        sktDrop = Math.floor(Math.random() * 3) + 3; // Drops 3 to 5
        phyDrop = Math.floor(Math.random() * 3) + 4; // Drops 4 to 6
        staDrop = Math.floor(Math.random() * 3) + 4; // Drops 4 to 6
        shtDrop = 2; // Hand-eye/Reflexes decline
      } else if (finalPlayer.age >= 35) {
        sktDrop = Math.floor(Math.random() * 2) + 2; // Drops 2 to 3
        phyDrop = Math.floor(Math.random() * 2) + 2; // Drops 2 to 3
        staDrop = Math.floor(Math.random() * 2) + 3; // Drops 3 to 4
        shtDrop = 1;
      } else if (finalPlayer.age >= 33) {
        sktDrop = 1; 
        phyDrop = Math.floor(Math.random() * 2) + 1; // Drops 1 to 2
        staDrop = 2; 
        shtDrop = 0;
      } else if (finalPlayer.age >= 31) {
        sktDrop = 0; 
        phyDrop = 1; 
        staDrop = 1; 
        shtDrop = 0;
      }

      // Apply the decay (Hockey IQ never drops!)
      finalPlayer.skating = Math.max(35, (finalPlayer.skating || 50) - sktDrop);
      finalPlayer.physicality = Math.max(35, (finalPlayer.physicality || 50) - phyDrop);
      finalPlayer.stamina = Math.max(35, (finalPlayer.stamina || 50) - staDrop);
      finalPlayer.shooting = Math.max(35, (finalPlayer.shooting || 50) - shtDrop);
    }

    finalPlayer.ovr = recomputeOvr(finalPlayer);

    const annualSalary = finalPlayer.contract?.salary || 0;
    const currentEarnings = finalPlayer.stats?.earnings || 0;
    const updatedEarnings = currentEarnings + annualSalary;

    // CBA RULE: ELCs slide for 18/19 year olds if they play less than 10 NHL games in a season.
    const isSlideEligible = finalPlayer.age < 20 && (result.currentLg !== 'NHL' || (result.recap?.games || 0) < 10);
    
    // FIX: Read directly from the pre-simulation state to prevent double-decrementing
    const remainingYears = isSlideEligible 
        ? (player.contract?.years || 0) 
        : Math.max(0, (player.contract?.years || 0) - 1);

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
    const updatedCareerAwards = [...(finalPlayer.stats?.awards || []), ...seasonAwards];
    
    if (finalPlayer.league === 'NHL' && (result.recap?.games || 0) > 0) unlockAchievement('first_nhl_goal');
    if (result.recap?.g >= 50) unlockAchievement('fifty_goal_season');
    if ((result.recap?.g || 0) + (result.recap?.a || 0) >= 100) unlockAchievement('hundred_pt_season');
    if (result.recap?.sho >= 8) unlockAchievement('shutout_king');
    if (finalPlayer.ovr >= 90) unlockAchievement('max_ovr');

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

    let willDemote = result.isDemoted;
    // Prospects under 78 OVR are highly likely to be assigned to the AHL for development
    let needsAHLDevelopment = player.league === 'NHL' && player.ovr < 78 && finalPlayer.age < 24 && Math.random() < 0.85;
    
    let demotionTargetLg = 'AHL';
    let demotionTargetTeam = getTeamData(player.team, 'NHL')?.ahlId || 'UTI';
    let isWaiverClaim = false;

    const isUnder20 = player.age < 20 && (player.contract?.salary || 0) > 0;
    const ohl = ohlTeams || []; const whl = whlTeams || []; const qmjhl = qmjhlTeams || [];
    const teamsPlayed = player.teamsPlayedFor || [];
    const hasCHLHistory = teamsPlayed.some(team => ohl.find(o=>o.id===team) || whl.find(o=>o.id===team) || qmjhl.find(o=>o.id===team));

    if (willDemote || needsAHLDevelopment) {
      if (player.league === 'NHL') {
        if (isUnder20 && hasCHLHistory) {
          if ((result.recap?.games || 0) > 9) {
            // 9-GAME RULE: Player burned year 1 of ELC, cannot go back to CHL.
            willDemote = false;
            needsAHLDevelopment = false;
          } else {
            const lastCHL = teamsPlayed.slice().reverse().find(team => ohl.find(o=>o.id===team) || whl.find(o=>o.id===team) || qmjhl.find(o=>o.id===team));
            demotionTargetTeam = lastCHL || (ohl[0] ? ohl[0].id : null);
            if (whl.find(team=>team.id===demotionTargetTeam)) demotionTargetLg = 'WHL';
            else if (qmjhl.find(team=>team.id===demotionTargetTeam)) demotionTargetLg = 'QMJHL';
            else demotionTargetLg = 'OHL';
            willDemote = true;
          }
        } else {
          const proSeasons = finalPlayer.stats?.seasonsPlayed || 0;
          const isRFA = finalPlayer.age < 27 && proSeasons < 7;
          const isELC = finalPlayer.contract?.salary === 925000 || (isRFA && proSeasons < 3);
          
          // Exempt players still on ELC or RFA from waivers
          if (!isELC && !isRFA && Math.random() < 0.3) {
            isWaiverClaim = true;
            demotionTargetLg = 'NHL';
            const pool = (nhlTeams || []).filter(t => t.id !== player.team);
            demotionTargetTeam = pool[Math.floor(Math.random() * pool.length)].id;
          }
          willDemote = true;
        }
      } else {
         willDemote = result.isDemoted;
         demotionTargetLg = result.currentLg;
         demotionTargetTeam = result.currentTeam;
      }
    }

    if (willDemote) {
      unlockAchievement('demoted');
      const updatedRecap = { ...result.recap, wasDemotedTo: demotionTargetLg, wasWaived: isWaiverClaim };
      setSeasonRecap(updatedRecap); 

      if (isWaiverClaim) {
        setActiveEvent({
          title: 'CLAIMED OFF WAIVERS',
          desc: `Your GM attempted to send you down to the AHL, but you were claimed off waivers by the ${getFullTeamName(demotionTargetTeam, 'NHL')}!`,
          choices: [
            { label: 'Pack your bags', isRisky: false, feedback: 'A fresh start with a new NHL team.', effect: { idol: 0, ovr: 0, money: 0 }, action: 'DEMOTE', actionData: { team: demotionTargetTeam, lg: 'NHL' } }
          ],
          isDemotionEvent: true, currentLg: 'NHL', currentTeam: demotionTargetTeam, madePlayoffs: result.madePlayoffs
        });
      } else {
        let devBoostMsg = player.pos === 'G' 
          ? "🧤 You will get primary starter workload next year to refine your game (+2 OVR)!" 
          : "🏒 You will get top-line minutes next year to boost your confidence (+2 OVR)!";

        setActiveEvent({
          title: 'REASSIGNED FOR DEVELOPMENT',
          desc: `The front office believes it's best for your long-term development to get top-line minutes and powerplay time in the minors, rather than being rushed into a limited NHL role. You have been assigned to the ${getFullTeamName(demotionTargetTeam, demotionTargetLg)} (${demotionTargetLg}) for the upcoming season.`,
          choices: [
            { label: 'Embrace the Workload', isDevBoost: true, isRisky: false, feedback: devBoostMsg, effect: { idol: 5, ovr: 2, money: 0 }, action: 'DEMOTE', actionData: { team: demotionTargetTeam, lg: demotionTargetLg } },
            { label: 'Complain to the media', isRisky: true, successChance: 0.3, successFeedback: 'The fans love your fiery passion. You vow to prove the GM wrong!', successEffect: { idol: 15, ovr: 1, money: 0 }, failFeedback: 'You look like a spoiled kid. The GM fines you and the fans turn on you.', failEffect: { idol: -15, ovr: -1, money: -25000 }, action: 'DEMOTE', actionData: { team: demotionTargetTeam, lg: demotionTargetLg } }
          ],
          isDemotionEvent: true, currentLg: demotionTargetLg, currentTeam: demotionTargetTeam, madePlayoffs: result.madePlayoffs
        });
      }
      setScreen('event');
      return;
    } else {
      let willPromote = false;
      let promotionTargetTeam = null;
      if (result.currentLg === 'AHL') {
         const isNHLContract = (finalPlayer.contract?.salary || 0) >= 500000;
         const parent = (nhlTeams || []).find(t => t.ahlId === player.team);
         
         // Callups happen frequently for highly touted prospects
         if (parent && isNHLContract && (finalPlayer.ovr >= 73 || result.recap?.rating >= 7.5)) {
             willPromote = true;
             promotionTargetTeam = parent.id;
         }
      }

      if (willPromote) {
          setActiveEvent({
              title: 'CALLED UP TO THE SHOW',
              desc: `Your dominant play in the AHL has convinced the front office. The ${getFullTeamName(promotionTargetTeam, 'NHL')} are officially calling you up to the NHL roster!`,
              choices: [
                  { label: 'Pack your bags', isRisky: false, feedback: 'You are heading to the NHL!', effect: { idol: 10, ovr: 1, money: 0 }, action: 'DEMOTE', actionData: { team: promotionTargetTeam, lg: 'NHL' } }
              ],
              isDemotionEvent: true,
              currentLg: 'NHL',
              currentTeam: promotionTargetTeam,
              madePlayoffs: result.madePlayoffs
          });
          setScreen('event');
          return;
      }

      if (result.currentLg === 'NCAA') {
         setSeasonRecap(result.recap);
         runPostSeasonFlow(ctx, finalPlayer.age, finalPlayer.ovr, result.currentLg, result.currentTeam, result.madePlayoffs, activeYear + 1, result.recap?.standings || 16);
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
         const tradeChance = (result.currentTeam === 'NTDP') ? 0 : ((isExpiring && isRebuilding && isElite) ? 0.40 : 0.05);

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
}
