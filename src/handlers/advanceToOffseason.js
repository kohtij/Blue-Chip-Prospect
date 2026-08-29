import { getOpponentPool, ncaaTeams, ohlTeams } from '../data/teams';
import { getFullTeamName } from '../utils/appHelpers';
import { generateOffers } from './generateOffers';
import { recomputeOvr } from '../utils/gameHelpers';

export function advanceToOffseason(ctx) {
  // ADD setSeasonEvents to this line:
  const { player, seasonRecap, setActiveEvent, setPlayer, setScreen, safeEuroLeagues, safeJuniorLeagues, setSeasonEvents } = ctx;

  // Clear out the previous year's events!
  setSeasonEvents([]);

  // B1: Longevity Tick - Building chemistry by staying with the same org
  if (player.seasonHistory && player.seasonHistory.length > 0) {
      const lastSeason = player.seasonHistory[player.seasonHistory.length - 1];
      // If we finished last season on the exact same team we are starting this offseason with
      if (lastSeason.team === player.team) {
          setPlayer(p => ({
              ...p,
              relationships: {
                  ...p.relationships,
                  coach: Math.min(100, (p.relationships?.coach || 50) + 2),
                  teammates: Math.min(100, (p.relationships?.teammates || 50) + 3)
              }
          }));
      }
  }

  // Hard cap at 40. Start forcing retirement at 35 if OVR drops.
    if (player.age >= 40 || (player.age >= 35 && player.ovr < 76)) {
       setScreen('retirement');
       return; 
    }
    if (player.age >= 35 && player.ovr >= 76 && player.league === 'NHL') {
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

    if (!player.storylines?.importDraft && !player.chlRights && (player.age === 16 || player.age === 17) && safeEuroLeagues.includes(player.league) && Math.random() > 0.4) {
        setPlayer(p => ({ ...p, storylines: { ...(p.storylines || {}), importDraft: 1 } }));
        const chlLeagues = ['OHL', 'WHL', 'QMJHL'];
        const randomLg = chlLeagues[Math.floor(Math.random() * chlLeagues.length)];
        let pool = getOpponentPool(randomLg) || [];
        if (pool.length === 0) pool = [{ id: 'UNK', name: 'Unknown Team', city: '' }];
        const draftingTeam = pool[Math.floor(Math.random() * pool.length)];
        const fullTeamName = draftingTeam.fullName || (draftingTeam.city ? `${draftingTeam.city} ${draftingTeam.name}` : draftingTeam.name);

        setActiveEvent({
            title: '🇨🇦 THE CHL IMPORT DRAFT',
            desc: `You've been selected by the ${fullTeamName} (${randomLg}) in the CHL Import Draft! They want you to leave Europe and come play Major Junior hockey in North America to get used to the smaller ice.`,
            choices: [
                {
                    label: 'Pack your bags for North America',
                    isRisky: false,
                    feedback: `You signed with ${draftingTeam.name}. The smaller ice is an adjustment, but NHL scouts are watching closely.`,
                    effect: { idol: 15, ovr: 1, money: 0 },
                    action: 'ACCEPT_IMPORT_DRAFT',
                    actionData: { teamObj: draftingTeam, league: randomLg }
                },
                {
                    label: 'Stay in Europe',
                    isRisky: false,
                    feedback: `You decided to stay and play against grown men in Europe. ${draftingTeam.name} will retain your CHL rights just in case you change your mind later.`,
                    effect: { idol: 5, ovr: 1, money: 0 },
                    action: 'DECLINE_IMPORT_DRAFT',
                    actionData: { teamObj: draftingTeam, league: randomLg }
                }
            ],
            isOffseasonEvent: true
        });
        setScreen('event');
        return;
    }

    const newBuffs = (player.buffs || []).map(b => ({ ...b, duration: b.duration - 1 })).filter(b => b.duration > 0);

    let currentTeam = player.team;
    let currentLeague = player.league;
    let updatedContract = player.contract ? { ...player.contract } : null;
    
    // Always report to NHL Training Camp if you are on an NHL contract
    if (['AHL', 'ECHL', 'OHL', 'WHL', 'QMJHL', 'USHL', 'NCAA', 'SHL', 'LIIGA'].includes(currentLeague) && (player.contract?.salary || 0) >= 500000 && player.rights) {
        currentTeam = player.rights;
        currentLeague = 'NHL';
    }

    // 1. ELC SLIDE RULE
    // If the player is under an NHL contract but playing in juniors, the contract slides (the year is not burned).
    // We restore the year that simulateSeason decremented.
    if (updatedContract && safeJuniorLeagues.includes(currentLeague) && player.age <= 20) {
        updatedContract.years = Math.min(3, updatedContract.years + 1);
    }

    // 2. AGING CURVE DECLINE
    let declineSkt = 0;
    let declinePhy = 0;
    
    if (player.age >= 32) {
        declineSkt = Math.random() > 0.4 ? 1 : 2; // 1-2 point drop to skating
        declinePhy = Math.random() > 0.6 ? 1 : 0; // 0-1 point drop to physicality
        
        // Decline accelerates harshly in the late 30s!
        if (player.age >= 35) {
            declineSkt += 1; 
            declinePhy += 1;
        }
        
        if (declineSkt > 0 || declinePhy > 0) {
            // Calculate the actual OVR drop for the UI pills
            const tempPlayer = { 
                ...player, 
                skating: Math.max(30, (player.skating || 50) - declineSkt), 
                physicality: Math.max(30, (player.physicality || 50) - declinePhy) 
            };
            const newOvr = recomputeOvr(tempPlayer);
            const ovrDiff = newOvr - player.ovr;

            const declineMsg = `Father Time is undefeated. Your body is aging, and you lost a physical step over the summer.`;
            
            // FIX: Pass the calculated ovr drop and raw stat drops into the effect object
            setSeasonEvents(prev => [...prev, { 
                feedback: declineMsg, 
                effect: { ovr: ovrDiff, idol: 0, money: 0, skating: -declineSkt, physicality: -declinePhy } 
            }]);
        }
    }

    // Apply team changes, contract updates, AND physical decline
    setPlayer(p => {
        const nextSkt = Math.max(30, (p.skating || 50) - declineSkt);
        const nextPhy = Math.max(30, (p.physicality || 50) - declinePhy);
        
        const updatedPlayer = { 
            ...p, 
            team: currentTeam, 
            league: currentLeague, 
            buffs: newBuffs, 
            contract: updatedContract || p.contract,
            skating: nextSkt,
            physicality: nextPhy
        };
        
        // If the player aged out and lost stats, force an immediate OVR recalculation
        if (declineSkt > 0 || declinePhy > 0) {
            updatedPlayer.ovr = recomputeOvr(updatedPlayer);
        }
        
        return updatedPlayer;
    });

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

    // Euro Leagues are PRO leagues, not amateurs!
    const isCurrentlyAmateur = safeJuniorLeagues.includes(currentLeague) || currentLeague === 'NCAA';
    
    if (player.age === 18 && (isCurrentlyAmateur || safeEuroLeagues.includes(currentLeague)) && !player.rights) {
      setScreen('combine');
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

    if (isCurrentlyAmateur && player.rights && !player.contract && player.age > 18 && player.age < rightsExpireAge) {
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
      generateOffers(ctx, false, currentTeam, currentLeague);
    } else {
      const idol = player.idolatry || 0;
      
      if (idol >= 300 && !player.storylines?.endLocal && currentLeague === 'NHL') {
          setPlayer(p => ({ ...p, storylines: { ...p.storylines, endLocal: true } }));
          setActiveEvent({
              title: '🤝 LOCAL SPONSORSHIP',
              desc: `A popular local car dealership wants you for a TV commercial. It's great easy money, but your teammates might relentlessly chirp you for it.`,
              choices: [
                  { label: 'Do the Commercial ($50k)', isRisky: false, feedback: 'You got paid, but the boys laughed at your acting skills.', effect: { idol: 5, ovr: 0, money: 50000, rel: { teammates: -10 } } },
                  { label: 'Pass on it', isRisky: false, feedback: 'You kept your dignity.', effect: { idol: 0, ovr: 0, money: 0 } }
              ],
              isOffseasonEvent: true
          });
          setScreen('event');
          return;
      }

      if (idol >= 600 && !player.storylines?.endNational && currentLeague === 'NHL') {
          setPlayer(p => ({ ...p, storylines: { ...p.storylines, endNational: true } }));
          setActiveEvent({
              title: '📺 NATIONAL BRAND CAMPAIGN',
              desc: `A major sports equipment brand wants you as the face of their new stick launch. It involves a massive photo shoot and media obligations.`,
              choices: [
                  { label: 'Sign the Deal ($250k)', isRisky: false, feedback: 'You are on billboards nationwide! But the media obligations cut into your training.', effect: { idol: 50, ovr: -1, money: 250000, rel: { media: 20 } } },
                  { label: 'Focus on Hockey', isRisky: false, feedback: 'You turned down the money to focus purely on your game.', effect: { idol: 0, ovr: 1, money: 0 } }
              ],
              isOffseasonEvent: true
          });
          setScreen('event');
          return;
      }

      if (idol >= 1000 && !player.storylines?.endGlobal && currentLeague === 'NHL') {
          setPlayer(p => ({ ...p, storylines: { ...p.storylines, endGlobal: true } }));
          setActiveEvent({
              title: '🌍 SIGNATURE ATHLETE',
              desc: `You have reached the pinnacle of hockey fame. An international conglomerate wants to give you your own signature skate and apparel line.`,
              choices: [
                  { label: 'Become an Icon ($2.5M)', isRisky: false, feedback: 'You have ascended beyond just being a hockey player. You are a global brand.', effect: { idol: 150, ovr: 0, money: 2500000 } }
              ],
              isOffseasonEvent: true
          });
          setScreen('event');
          return;
      }
// ==========================================
      // RANDOM CAREER TRAJECTORY EVENTS (3% Chance)
      // ==========================================
      const eventRoll = Math.random();
      
      // LATE BLOOMER BREAKOUT
      if (currentLeague === 'NHL' && player.age >= 22 && player.age <= 28 && eventRoll < 0.03 && !player.storylines?.hadBreakout) {
          setPlayer(p => ({ ...p, storylines: { ...p.storylines, hadBreakout: true } }));
          setActiveEvent({
              title: '🔥 LATE BLOOMER BREAKOUT',
              desc: `Something clicked this offseason. The game has slowed down, your body feels elite, and you are dominating informal scrimmages. The media is predicting a massive breakout year.`,
              choices: [
                  { label: 'Embrace the Spotlight', isRisky: false, feedback: 'You are ready to take the league by storm.', effect: { idol: 50, ovr: 4, money: 0 } },
                  { label: 'Keep Your Head Down', isRisky: false, feedback: 'You remain humble, focusing purely on the ice.', effect: { idol: 10, ovr: 5, money: 0 } }
              ],
              isOffseasonEvent: true
          });
          setScreen('event');
          return;
      }

      // FLUKE REGRESSION
      if (currentLeague === 'NHL' && player.ovr >= 80 && player.age < 30 && eventRoll > 0.97 && !player.storylines?.hadFluke) {
          setPlayer(p => ({ ...p, storylines: { ...p.storylines, hadFluke: true } }));
          setActiveEvent({
              title: '📉 OFF-YEAR REGRESSION',
              desc: `You spent the summer enjoying your wealth instead of training. You arrived at camp out of shape, and critics are calling last season a total fluke.`,
              choices: [
                  { label: 'Ignore the Haters', isRisky: false, feedback: 'You brushed off the media, but your game is noticeably sluggish.', effect: { idol: -20, ovr: -3, money: 0 } },
                  { label: 'Hire a Private Trainer ($250k)', isRisky: false, feedback: 'You spent a fortune to get back in shape, limiting the damage.', effect: { idol: 10, ovr: -1, money: -250000 } }
              ],
              isOffseasonEvent: true
          });
          setScreen('event');
          return;
      }
    // 1. Determine proper verbiage based on position
    const targetRole = ['LD', 'RD'].includes(player.pos) ? 'Top 4 spot' : player.pos === 'G' ? 'Starting job' : 'Top 6 spot';
    
    // 2. Check if the player is already an established elite veteran or captain
    const isEstablished = player.ovr >= 85 || player.isCaptain;

    if (isEstablished) {
        ctx.setActiveEvent({
            title: '⛺ VETERAN TRAINING CAMP',
            desc: `You arrive at camp as an established core player for the ${player.league} season. The coaches know what you bring to the table. Use this time to set the tone for the rookies.`,
            choices: [
                { 
                  label: 'Pace Yourself (Avoid Injury)', 
                  isRisky: false, 
                  feedback: 'You coasted through camp cleanly. You are 100% ready for opening night.', 
                  effect: { idol: 10, ovr: 0 } 
                },
                { 
                  label: 'Dominate Scrimmages', 
                  isRisky: true, 
                  successChance: 0.75, 
                  successFeedback: 'You looked absolutely unstoppable. The media is hyping you up for a career year.', 
                  successEffect: { idol: 50, ovr: 1, rel: { coach: 15 } }, 
                  failFeedback: 'You pushed too hard in a meaningless drill and tweaked a muscle.', 
                  failEffect: { idol: -10, ovr: -1, rel: { coach: -10 } } 
                }
            ],
            isOffseasonEvent: true
        });
    } else {
        ctx.setActiveEvent({
            title: '⛺ TRAINING CAMP BATTLE',
            desc: `It is time to report to training camp for the new season. You are locked in a fierce roster battle. Your performance here will dictate your ice time.`,
            choices: [
                { 
                  label: `Battle for a ${targetRole} (Hit the ice)`, 
                  isRisky: true, 
                  successChance: 0.50, 
                  successFeedback: `You had an incredible camp and secured a ${targetRole}!`, 
                  successEffect: { idol: 20, ovr: 1, rel: { coach: 20 } }, 
                  failFeedback: `You struggled to keep up. The coach bumped you down the depth chart.`, 
                  failEffect: { idol: -10, ovr: -1, rel: { coach: -15 } },
                  action: 'ROUTE_MINIGAME' 
                },
                { 
                  label: 'Play it Safe (Accept Depth Role)', 
                  isRisky: false, 
                  feedback: 'You played a quiet, mistake-free camp and slotted into the bottom of the lineup.', 
                  effect: { idol: 0, ovr: 0, rel: { coach: 5 } } 
                }
            ],
            isOffseasonEvent: true
        });
    } // Closes the if (isEstablished) / else block

    // FIX: Actually route the user to the event screen!
    ctx.setScreen('event');
    
  } // Closes the massive `else` block for players who already have contracts
} // Closes the entire advanceToOffseason function