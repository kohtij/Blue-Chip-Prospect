import { getOpponentPool, ncaaTeams, ohlTeams } from '../data/teams';
import { getFullTeamName, getPlayoffTitles } from '../utils/appHelpers';
import { generateOffers } from './generateOffers';
import { rollOfferPerks } from '../data/offerPerks';
import { recomputeOvr, isNhlFreeAgentEligible, hasProContract, leagueWithArticle } from '../utils/gameHelpers';

export function advanceToOffseason(ctx) {
  // ADD setSeasonEvents to this line:
  const { player, seasonRecap, setActiveEvent, setPlayer, setScreen, safeEuroLeagues, safeJuniorLeagues, setSeasonEvents } = ctx;

  // A real offseason is a sequence, not a single event. Free agency OPENS it on
  // July 1 and training camp CLOSES it in September. This used to be one chain in
  // which every branch returned straight to preseason, and worse, the camp section
  // sat INSIDE the "already has a contract" branch, so a player whose deal expired
  // went to free agency, signed, and began the season having never been to camp.
  // SUMMER is everything from the final whistle to September: the parade, the
  // draft, free agency, endorsements. CAMP always follows it, and camp is what
  // hands the player to the season.
  // Four beats, in calendar order. A title is celebrated on its own beat so it
  // can never pre-empt the business of the summer: a Cup winner whose contract
  // has expired gets the parade AND his free agency, not one instead of the other.
  const FRESH = 0, CELEBRATED = 1, SUMMER_DONE = 2, TRAINED = 3, CAMP_DONE = 4;

  // Carried on the player so it survives the round trip through the event screen.
  // The recap is snapshotted because the caller clears it as the new year begins,
  // so stages after the first can no longer read it off ctx.
  const off = player.offseason || {
    stage: FRESH,
    rating: seasonRecap?.rating || 5,
    wonTitle: seasonRecap?.titleWon === 1,
    wonMemCup: seasonRecap?.memCupStatus === 'won'
  };
  const done = off.stage;
  const enterStage = (n) => setPlayer(p => ({ ...p, offseason: { ...off, stage: n } }));

  // Camp needs these as well as the summer does, so they live out here.
  let currentTeam = player.team;
  let currentLeague = player.league;
  let updatedContract = player.contract ? { ...player.contract } : null;
  let isCurrentlyAmateur = safeJuniorLeagues.includes(currentLeague) || currentLeague === 'NCAA';

  if (done === FRESH) setSeasonEvents([]);

  // B1: Longevity Tick - Building chemistry by staying with the same org
  if (done === FRESH && player.seasonHistory && player.seasonHistory.length > 0) {
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

  // The final is over. A title is celebrated before anything else happens.
  // 0. CHAMPIONSHIP CELEBRATION
  // This used to read only memCupStatus, so a 19-year-old's Memorial Cup got a
  // parade while winning the Stanley Cup passed in complete silence. Nothing in
  // the whole chain read titleWon. A title is the biggest thing that happens to
  // a player, so it now fires at every level, and the celebration matches the
  // level: the NHL has a tradition nothing else does, where every man on the
  // winning roster gets the Cup to himself for 24 hours over the summer.
  const wonMemCup = seasonRecap?.memCupStatus === 'won';
  const wonTitle = seasonRecap?.titleWon === 1;

  if (done < CELEBRATED && (wonTitle || wonMemCup)) {
      const trophyName = wonMemCup ? 'Memorial Cup' : (getPlayoffTitles(player.league)?.cupName || 'Championship');
      const isStanleyCup = !wonMemCup && currentLeague === 'NHL';

      // The quiet option is always available. It is what most players actually do.
      const soakItIn = {
          label: 'Soak it in',
          subLabel: 'Ride the parade route, then get off your feet and let the body heal.',
          isRisky: false,
          feedback: `A day you will tell your grandchildren about. Now the body gets its summer.`,
          effect: { fanStatus: 60, ovr: 1, rel: { teammates: 20 } }
      };

      const partyHard = {
          label: 'Party with the boys',
          subLabel: 'Three days with the trophy and no sleep, for better or worse.',
          isRisky: true,
          successChance: 0.70,
          successFeedback: 'A celebration that became team folklore. You will be close with these men for life.',
          successEffect: { fanStatus: 30, ovr: 0, money: -25000, rel: { teammates: 45 } },
          failFeedback: 'You went too far and ended up on the local news looking like a fool.',
          failEffect: { fanStatus: -25, ovr: -1, money: -25000, rel: { media: -25 } }
      };

      if (isStanleyCup) {
          ctx.setActiveEvent({
              title: '🏆 YOUR DAY WITH THE CUP',
              desc: `A million people lined the parade route. Then the handler hands you the schedule: the Cup is yours for twenty-four hours this summer, and it goes wherever you take it.`,
              choices: [
                  {
                    label: 'Take it to your hometown rink',
                    subLabel: 'Open the doors and let the kids who grew up watching you put their hands on it.',
                    isRisky: false,
                    feedback: 'The lineup went around the block. Every kid in town touched the Stanley Cup because of you.',
                    effect: { fanStatus: 140, ovr: 0, rel: { teammates: 10, media: 20 } }
                  },
                  {
                    label: 'Spend the day at the children\'s hospital',
                    subLabel: 'Give the twenty-four hours away instead of celebrating with it.',
                    isRisky: false,
                    feedback: 'You wheeled the Cup from room to room until visiting hours ended. Nobody who was there will forget it.',
                    effect: { fanStatus: 90, ovr: 0, rel: { media: 40, teammates: 15 } }
                  },
                  partyHard
              ],
              isOffseasonEvent: true
          });
          enterStage(CELEBRATED);
          ctx.setScreen('event');
          return;
      }

      ctx.setActiveEvent({
          title: wonMemCup ? '🏆 MEMORIAL CUP CHAMPIONS' : '🏆 CHAMPIONSHIP PARADE',
          desc: wonMemCup
            ? `You beat the best junior teams in the country and the ${trophyName} is coming home with you. The city shut down the main street for the parade, and you are on the lead fire truck holding it over your head.`
            : `The city shut down the main street for your ${trophyName} parade. You are on the lead fire truck with the trophy over your head and thousands of people chanting your name.`,
          choices: [soakItIn, partyHard],
          isOffseasonEvent: true
      });
      enterStage(CELEBRATED);
      ctx.setScreen('event');
      return;
  }

  // The rest of the summer runs once. The aging curve, the ELC slide and the
  // contract application all sit inside this block, so coming back for camp can
  // never age the player twice or slide his contract twice.
  if (done < SUMMER_DONE) {
  // VETERAN CAREER CROSSROADS
    if (player.age >= 37 || (player.age >= 34 && player.ovr < 76)) {
       const choices = [
         { label: 'Hang up the skates', subLabel: 'End your career on your own terms.', isRisky: false, feedback: 'You announced your retirement to a standing ovation.', effect: { fanStatus: 50, ovr: 0, money: 0 }, action: 'FORCE_RETIRE' }
       ];

       const hasContract = (player.contract?.years || 0) > 0;

       if (hasContract) {
           choices.push({ label: 'Play out current contract', subLabel: 'Honor the deal and give it one more year.', isRisky: false, feedback: 'You decided to honor your contract and play another year.', effect: { fanStatus: 10, ovr: -2, money: 0 } });
       } else {
           if (player.ovr >= 76 && player.league === 'NHL') {
               choices.push({ label: 'Push for one more NHL season', subLabel: 'Sign a short veteran extension to chase one more shot.', isRisky: false, feedback: 'You signed a 1-year veteran extension. Time to chase glory.', effect: { fanStatus: 10, ovr: -2, money: 0 }, action: 'VETERAN_EXTENSION' });
           } else if (player.ovr >= 68) {
               choices.push({ label: 'Attempt a comeback in the AHL', subLabel: 'Sign a two-way deal and grind it out for a shot back up.', isRisky: false, feedback: 'You signed a two-way deal to grind it out in the AHL.', effect: { fanStatus: 0, ovr: -1, money: 0 }, action: 'SIGN_TWILIGHT_AHL' });
           }
       }

       if (player.ovr >= 60) {
           choices.push({ label: 'Sign a Twilight Contract in Europe', subLabel: 'Wind down your career overseas on a bigger ice surface.', isRisky: false, feedback: 'You packed your bags for a European farewell tour. Less travel, bigger ice, pure hockey.', effect: { fanStatus: 15, ovr: 0, money: 0 }, action: 'SIGN_TWILIGHT_EUROPE' });
       }

       if (choices.length === 1) {
           setScreen('retirement');
           return;
       }

       setActiveEvent({
         title: 'CAREER CROSSROADS',
         desc: `You are ${player.age} years old. The miles are adding up, and the league is getting younger. Are you ready to hang them up, or do you have another chapter left in you?`,
         choices: choices,
         isOffseasonEvent: true
       });
       enterStage(SUMMER_DONE);
       setScreen('event');
       return;
    }

    // The CHL Import Draft is, by rule, for players developed outside North
    // America. A Canadian or American teenager playing a season in Sweden is not
    // an import: he comes back through the ordinary CHL route, not this one.
    const isImportEligible = !['CAN', 'USA'].includes(player.nat);

    if (isImportEligible && !player.storylines?.importDraft && !player.chlRights && (player.age === 16 || player.age === 17) && safeEuroLeagues.includes(player.league) && Math.random() > 0.4) {
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
                    subLabel: 'Leave Europe to adjust to the smaller ice ahead of your draft year.',
                    isRisky: false,
                    feedback: `You signed with ${draftingTeam.name}. The smaller ice is an adjustment, but NHL scouts are watching closely.`,
                    effect: { fanStatus: 15, ovr: 1, money: 0 },
                    action: 'ACCEPT_IMPORT_DRAFT',
                    actionData: { teamObj: draftingTeam, league: randomLg }
                },
                {
                    label: 'Stay in Europe',
                    subLabel: 'Keep developing against grown men, retaining your CHL rights for later.',
                    isRisky: false,
                    feedback: `You decided to stay and play against grown men in Europe. ${draftingTeam.name} will retain your CHL rights just in case you change your mind later.`,
                    effect: { fanStatus: 5, ovr: 1, money: 0 },
                    action: 'DECLINE_IMPORT_DRAFT',
                    actionData: { teamObj: draftingTeam, league: randomLg }
                }
            ],
            isOffseasonEvent: true
        });
        enterStage(SUMMER_DONE);
        setScreen('event');
        return;
    }

    const newBuffs = (player.buffs || []).map(b => ({ ...b, duration: b.duration - 1 })).filter(b => b.duration > 0);


    // Always report to NHL Training Camp if you are on an NHL contract
    if (['AHL', 'ECHL', 'OHL', 'WHL', 'QMJHL', 'USHL', 'NCAA', 'SHL', 'LIIGA'].includes(currentLeague) && (player.contract?.salary || 0) >= 500000 && player.rights) {
        currentTeam = player.rights;
        currentLeague = 'NHL';
    }

    // 1. ELC SLIDE RULE
    // If the player is under an NHL contract but playing in juniors, or playing in the AHL under age 24 during their first 2 pro seasons, the contract slides.
    // We restore the year that simulateSeason decremented.
    const isJuniorSlide = safeJuniorLeagues.includes(currentLeague) && player.age <= 20;
    const proSeasons = player.stats?.seasonsPlayed || 0;

    // We check for $925k to ensure we are only sliding actual ELCs, not random 1-year AHL veteran deals
    const isAhlSlide = currentLeague === 'AHL' && player.age < 24 && proSeasons <= 2 && updatedContract?.salary === 925000;

    if (updatedContract && (isJuniorSlide || isAhlSlide)) {
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
                effect: { ovr: ovrDiff, fanStatus: 0, money: 0, skating: -declineSkt, physicality: -declinePhy }
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
               { label: 'Move to Canada (Join OHL)', subLabel: 'Leave Europe to prepare for your draft year in the OHL.', isRisky: false, feedback: 'You packed your bags for North America to prepare for your draft year.', effect: { fanStatus: 5, ovr: 2, money: 0 }, action: 'JOIN_CHL', actionData: chlTeam.id },
               { label: 'Stay in Europe', subLabel: 'Stay close to home for now.', isRisky: false, feedback: 'You decided to stay close to home.', effect: { fanStatus: 0, ovr: 1, money: 0 } }
             ],
             isOffseasonEvent: true
           });
           enterStage(SUMMER_DONE);
           setScreen('event');
           return;
         }
    }

    const getsNCAAOffer = currentLeague === 'USHL' ? true : (safeJuniorLeagues.includes(currentLeague) && Math.random() > 0.6);

    if (player.age === 17 && getsNCAAOffer && !player.rights) {
         let pool = ncaaTeams ? [...ncaaTeams].sort(() => 0.5 - Math.random()) : [];

         const rating = seasonRecap?.rating || 5;
         let numOffers = 1;

         // 17-year-olds typically hover in the 50s-60s OVR.
         // A 62+ OVR or an 8.0+ rating is a blue-chip prospect (3 offers).
         // A 56+ OVR or a 6.5+ rating is a solid prospect (2 offers).
         if (rating >= 8.0 || player.ovr >= 62) {
             numOffers = 3;
         } else if (rating >= 6.5 || player.ovr >= 56) {
             numOffers = 2;
         }

         const offeredTeams = pool.slice(0, numOffers).map(t => {
             // The shared pools, so a scholarship card reads the same as every
             // other offer card in the game. This used to be a second copy.
             const { perks: selectedPerks, flaws: selectedFlaws } =
                 rollOfferPerks('NCAA', { maxPerks: 3, maxFlaws: 3 });

             let totalOvr = 0;
             let totalFans = 0;
             let totalMoney = 0;

             selectedPerks.forEach(p => { totalOvr += p.ovr; totalFans += p.fanStatus; totalMoney += p.money; });
             selectedFlaws.forEach(f => { totalOvr += f.ovr; totalFans += f.fanStatus; totalMoney += f.money; });

             return {
                 ...t,
                 finalOvr: Math.max(0, totalOvr),
                 finalFans: totalFans,
                 finalMoney: totalMoney,
                 perks: selectedPerks,
                 flaws: selectedFlaws
             };
         });

         if (offeredTeams.length > 0) {
           const choices = offeredTeams.map(t => ({
               label: `Commit to ${t.name}`,
               subLabel: t.ncaaConf ? `${t.ncaaConf.toUpperCase()}` : 'NCAA D1 PROGRAM',
               perks: t.perks,
               flaws: t.flaws,
               isRisky: false,
               feedback: `You signed your Letter of Intent to play for ${t.name}!`,
               effect: { fanStatus: t.finalFans, ovr: t.finalOvr, money: t.finalMoney },
               action: 'JOIN_NCAA',
               actionData: t.id
           }));

           choices.push({
               label: `Decline offers and stay in ${leagueWithArticle(currentLeague)}`,
               // The label already says what the button does. This says what it
               // costs: the gate on this event is age === 17, so nobody asks a
               // second time, and the year is spent developing instead.
               subLabel: 'The college route closes, and you spend the year focused on your development instead.',
               isRisky: false,
               feedback: `You decided to stay the course in ${leagueWithArticle(currentLeague)}.`,
               effect: { fanStatus: 0, ovr: 1, money: 0 }
           });

           setActiveEvent({
             title: 'NCAA RECRUITMENT',
             desc: numOffers > 1
                ? `Your stellar play in ${leagueWithArticle(currentLeague)} has attracted major attention. Offers are rolling in—some programs offer great perks with no drawbacks, while others have serious baggage. Choose wisely.`
                : `The head coach of ${offeredTeams[0].name} has offered you a scholarship. Review their program's perks and flaws before committing.`,
             choices: choices,
             isOffseasonEvent: true
           });
           enterStage(SUMMER_DONE);
           setScreen('event');
           return;
         }
    }

    // Euro Leagues are PRO leagues, not amateurs!
    isCurrentlyAmateur = safeJuniorLeagues.includes(currentLeague) || currentLeague === 'NCAA';

    // A career starts with contract: { salary: 0, years: 0 }, meaning "has never
    // signed anything". Every check below read years <= 0 as "his deal ran out",
    // so an unsigned teenager counted as a free agent. A drafted 18-year-old
    // playing in Sweden was being handed NHL free-agent offers after one season,
    // because the European leagues are not on the junior list either, so he did
    // not even register as an amateur. Nobody is a UFA before he has ever signed.
    // A scholarship is not a signed deal. Reading it as one closed the entry
    // level branch below to every college player, so a drafted skater could
    // spend four years in the NCAA and never be offered the contract his NHL
    // club holds his rights for. hasProContract draws that line in one place.
    const hasSignedDeal = hasProContract(player);
    const isUnsignedProspect = !hasSignedDeal && player.age < 21;

    // Calculate age-out limits before the draft check so we can use them to define the eligible window
    const amateurAgeOut = ['OHL', 'WHL', 'QMJHL'].includes(currentLeague) ? 21 : 22;
    const ncaaSeasons = (player.seasonHistory || []).filter(s => s.league === 'NCAA').length;
    const isNcaaAgedOut = currentLeague === 'NCAA' && ncaaSeasons >= 4;

    // A player is draft eligible if they are 18 or older, but haven't aged out of amateur eligibility
    const isDraftEligibleAge = player.age >= 18 && player.age < amateurAgeOut && !isNcaaAgedOut;

    if (isDraftEligibleAge && (isCurrentlyAmateur || safeEuroLeagues.includes(currentLeague)) && !player.rights) {
      // 18-year-olds go to the Combine. Over-agers skip directly to the draft with a penalty.
      if (player.age === 18) {
          setScreen('combine');
      } else {
          // Penalize draft stock for over-agers (approx 30 spots per year older).
          // This used to set the penalty and jump straight to the draft screen
          // without ever running the draft, so an over-ager arrived at a screen
          // showing whatever pick was left over from before. He is drafted here,
          // on the penalised player, since setPlayer has not landed yet. He skips
          // the combine, so he tests at neutral.
          const agePenalty = (player.age - 18) * -30;
          const penalised = { ...player, draftBonus: (player.draftBonus || 0) + agePenalty };
          setPlayer(p => ({ ...p, draftBonus: (p.draftBonus || 0) + agePenalty }));
          if (ctx.handleDraftDay) ctx.handleDraftDay(0, penalised);
          else setScreen('draft');
      }
      return;
    }

    const rightsExpireAge = (player.draftLeague && ['OHL', 'WHL', 'QMJHL'].includes(player.draftLeague)) ? 20 : 22;

    const needsRightsDecision = isCurrentlyAmateur && player.rights && (player.age >= rightsExpireAge || isNcaaAgedOut);
    const isAgingOut = isCurrentlyAmateur && !player.rights && (player.age >= amateurAgeOut || isNcaaAgedOut);

    if (needsRightsDecision || isAgingOut) {
       if (player.rights) {
           const teamWantsYou = player.ovr >= 65;
           const teamName = getFullTeamName(player.rights, 'NHL');
           if (teamWantsYou) {
               setActiveEvent({
                   title: 'AMATEUR GRADUATION',
                   desc: `Your development window has closed. The ${teamName} still hold your draft rights and have offered you an Entry-Level Contract. If you decline, your rights will expire and you will become an Unrestricted Free Agent.`,
                   choices: [
                       { label: `Sign ELC with ${teamName}`, subLabel: 'Turn pro immediately on your entry-level deal.', isRisky: false, feedback: 'You signed your ELC and are heading to pro camp!', effect: { fanStatus: 10, ovr: 0, money: 0 }, action: 'SIGN_ELC' },
                       { label: 'Test Free Agency', subLabel: 'Let your rights expire and look for a better opportunity elsewhere.', isRisky: false, feedback: 'You let your draft rights expire to test the open market.', effect: { fanStatus: -5, ovr: 0, money: 0 }, action: 'BECOME_UFA' }
                   ],
                   isOffseasonEvent: true
               });
           } else {
               setActiveEvent({
                   title: 'RIGHTS EXPIRED',
                   desc: `Your development window has closed. The ${teamName} have decided not to offer you a contract. Your draft rights have expired and you are now an Unrestricted Free Agent.`,
                   choices: [
                       { label: 'Enter Free Agency', subLabel: 'Look for a team willing to take a chance on you.', isRisky: false, feedback: 'Time to find a pro team that believes in you.', effect: { fanStatus: 0, ovr: 0, money: 0 }, action: 'BECOME_UFA' }
                   ],
                   isOffseasonEvent: true
               });
           }
       } else {
           setActiveEvent({
               title: 'AMATEUR GRADUATION',
               desc: `You have aged out of amateur hockey as an undrafted free agent. It's time to see if any pro teams are interested in signing you.`,
               choices: [
                   { label: 'Enter Free Agency', subLabel: 'Try to catch on with a pro team as an undrafted free agent.', isRisky: false, feedback: 'You are looking for your first pro contract.', effect: { fanStatus: 0, ovr: 0, money: 0 }, action: 'BECOME_UFA' }
               ],
               isOffseasonEvent: true
           });
       }
       enterStage(SUMMER_DONE);
       setScreen('event');
       return;
    }

    // Was `!player.contract`, which is never true: the object always exists, it
    // just holds zeros until something is signed. So the entry-level offer never
    // fired at all. It also excluded prospects developing in Europe, who are
    // exactly the players an NHL club signs out of their draft rights.
    if ((isCurrentlyAmateur || isUnsignedProspect) && player.rights && !hasSignedDeal && player.age > 18 && player.age < rightsExpireAge) {
       const teamName = getFullTeamName(player.rights, 'NHL');
       if (player.ovr >= 65) {
           setActiveEvent({
             title: 'PRO CONTRACT OFFER',
             desc: `The ${teamName} believe you are ready. They have offered you an Entry-Level Contract. You can turn pro now, or return to ${leagueWithArticle(currentLeague)} for another year of development.`,
             choices: [
               { label: 'Sign your entry-level contract', subLabel: 'Turn pro now and report to NHL training camp.', isRisky: false, feedback: 'You signed your ELC headed to your first NHL training camp!', effect: { fanStatus: 10, ovr: 0, money: 0 }, action: 'SIGN_ELC' },
               { label: `Return to ${leagueWithArticle(currentLeague)}`, subLabel: 'Spend one more year developing before turning pro.', isRisky: false, feedback: 'You chose to develop for another year.', effect: { fanStatus: 0, ovr: 1, money: 0 } }
             ],
             isOffseasonEvent: true
           });
       } else {
           setActiveEvent({
             title: 'NOT READY FOR PRO',
             desc: `The ${teamName} still hold your rights, but their front office does not believe you are ready for pro hockey yet. You must return to ${leagueWithArticle(currentLeague)} for another season.`,
             choices: [
               { label: `Return to ${leagueWithArticle(currentLeague)}`, subLabel: "Keep developing until the organization believes you're ready.", isRisky: false, feedback: 'You are determined to prove them wrong next season.', effect: { fanStatus: 0, ovr: 1, money: 0 } }
             ],
             isOffseasonEvent: true
           });
       }
       enterStage(SUMMER_DONE);
       setScreen('event');
       return;
    }

    // July 1. This OPENS the offseason, it does not end it: the pass stops here
    // so the transfer screen is not overwritten, and camp follows the signing.
    // The eligibility check is the same invariant generateOffers enforces, so if
    // anything slips through here the market simply does not open and the summer
    // carries on into camp rather than stalling.
    const contractExpired = (player.contract?.years || 0) <= 0;
    const canHitTheMarket = !isCurrentlyAmateur && !isUnsignedProspect && contractExpired
        && isNhlFreeAgentEligible(player, safeJuniorLeagues);

    if (canHitTheMarket && generateOffers(ctx, false, currentTeam, currentLeague) !== false) {
      enterStage(SUMMER_DONE);
      return;
    } else {
      const fanStatus = player.fanStatus || 0;

      // Thresholds measured against what a career actually produces. Over sixteen
      // NHL seasons the fan number peaks near 210 for a journeyman, 290 for a
      // regular, 395 for a star and 515 for a superstar, so the old 600 and 1000
      // gates sat above the ceiling and those two events could never fire at all.
      // These land where the real equivalents do: a local commercial is something
      // any established pro gets, a national campaign belongs to genuine stars,
      // and a signature line goes to the handful of players who carry the sport.
      // A local spot does not need the NHL, a brand launch does.
      const isProLeague = !isCurrentlyAmateur;

      if (fanStatus >= 200 && !player.storylines?.endLocal && isProLeague) {
          setPlayer(p => ({ ...p, storylines: { ...p.storylines, endLocal: true } }));
          setActiveEvent({
              title: '🤝 LOCAL SPONSORSHIP',
              desc: `A popular local car dealership wants you for a TV commercial. It's great easy money, but your teammates might relentlessly chirp you for it.`,
              choices: [
                  // The money used to live inside the label text. Every other
                  // event in the game shows what a choice is worth as a chip,
                  // and a number buried in a button is easy to miss and
                  // impossible to compare.
                  { label: 'Do the commercial', subLabel: 'Easy money, but expect some ribbing in the room.', isRisky: false,
                    perks: [{ name: '\ud83d\udcb0 Appearance Fee', effect: '$50K', color: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30' }],
                    flaws: [{ name: '\u26a0\ufe0f Locker Room', effect: '-10 TEAM' }],
                    feedback: 'You shot the dealership commercial and cashed the cheque. The boys have not stopped quoting your acting since.', effect: { fanStatus: 5, ovr: 0, money: 50000, rel: { teammates: -10 } } },
                  { label: 'Pass on it', subLabel: 'Skip the payday and stay out of the group chat.', isRisky: false,
                    feedback: 'You turned the dealership commercial down. No cheque, but no clip of you in a bad suit either.', effect: { fanStatus: 0, ovr: 0, money: 0 } }
              ],
              isOffseasonEvent: true
          });
          enterStage(SUMMER_DONE);
          setScreen('event');
          return;
      }

      if (fanStatus >= 420 && !player.storylines?.endNational && currentLeague === 'NHL') {
          setPlayer(p => ({ ...p, storylines: { ...p.storylines, endNational: true } }));
          setActiveEvent({
              title: '📺 NATIONAL BRAND CAMPAIGN',
              desc: `A major sports equipment brand wants you as the face of their new stick launch. It involves a massive photo shoot and media obligations.`,
              choices: [
                  { label: 'Sign the deal', subLabel: 'Become a household name, at the cost of some ice time this summer.', isRisky: false,
                    perks: [{ name: '\ud83d\udcb0 Endorsement', effect: '$250K', color: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30' }],
                    flaws: [{ name: '\u26a0\ufe0f Lost Training', effect: '-1 OVR' }],
                    feedback: 'You signed the stick deal and spent the summer on billboards. The shoots ate the training time you would normally have had.', effect: { fanStatus: 50, ovr: -1, money: 250000, rel: { media: 20 } } },
                  { label: 'Focus on hockey', subLabel: 'Turn the campaign down and keep the summer for your game.', isRisky: false,
                    perks: [{ name: '\ud83d\udcc8 Full Summer', effect: '+1 OVR', color: 'text-[#22E748] bg-[#22E748]/10 border-[#22E748]/30' }],
                    feedback: 'You turned the stick campaign down and spent the summer training instead. No billboards, a better player.', effect: { fanStatus: 0, ovr: 1, money: 0 } }
              ],
              isOffseasonEvent: true
          });
          enterStage(SUMMER_DONE);
          setScreen('event');
          return;
      }

      if (fanStatus >= 700 && !player.storylines?.endGlobal && currentLeague === 'NHL') {
          setPlayer(p => ({ ...p, storylines: { ...p.storylines, endGlobal: true } }));
          setActiveEvent({
              title: '🌍 SIGNATURE ATHLETE',
              desc: `You have reached the pinnacle of hockey fame. An international conglomerate wants to give you your own signature skate and apparel line.`,
              choices: [
                  { label: 'Become an icon', subLabel: 'Put your name on a signature skate and apparel line.', isRisky: false,
                    perks: [{ name: '\ud83d\udcb0 Signature Line', effect: '$2.5M', color: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30' }],
                    feedback: 'You signed the signature skate and apparel line. You are not just a hockey player any more, you are a brand.', effect: { fanStatus: 150, ovr: 0, money: 2500000 } }
              ],
              isOffseasonEvent: true
          });
          enterStage(SUMMER_DONE);
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
                  { label: 'Embrace the Spotlight', subLabel: 'Lean into the hype for a bigger immediate boost.', isRisky: false, feedback: 'You are ready to take the league by storm.', effect: { fanStatus: 50, ovr: 4, money: 0 } },
                  { label: 'Keep Your Head Down', subLabel: 'Stay humble and let your game do the talking.', isRisky: false, feedback: 'You remain humble, focusing purely on the ice.', effect: { fanStatus: 10, ovr: 5, money: 0 } }
              ],
              isOffseasonEvent: true
          });
          enterStage(SUMMER_DONE);
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
                  { label: 'Ignore the Haters', subLabel: 'Save the money, but your game stays sluggish.', isRisky: false, feedback: 'You brushed off the media, but your game is noticeably sluggish.', effect: { fanStatus: -20, ovr: -3, money: 0 } },
                  { label: 'Hire a Private Trainer ($250k)', subLabel: 'Spend to get back in shape and limit the damage.', isRisky: false, feedback: 'You spent a fortune to get back in shape, limiting the damage.', effect: { fanStatus: 10, ovr: -1, money: -250000 } }
              ],
              isOffseasonEvent: true
          });
          enterStage(SUMMER_DONE);
          setScreen('event');
          return;
      }

  } // closes the branch for players who already have a contract
  } // closes: if (done < SUMMER_DONE)

  // ==========================================================================
  // CAMP (September): the last thing before the season, for everybody, including
  // the player who signed somewhere new in July. This used to sit inside the
  // "already has a contract" branch, which is why a free-agency year skipped it.
  // ==========================================================================
  // PRE-SEASON (late August): you pick your training before camp opens.
  //
  // Camp used to come first and the training card after it, which is backwards:
  // you were fighting for a roster spot before you had done any of the summer's
  // work, and the upgrade you chose landed after the battle it should have helped
  // you win. The cards are dealt here, and the camp battle waits until you have
  // picked one.
  // ==========================================
  // THE LEADERSHIP GROUP (Alternate Captain)
  // ==========================================
  // A letter is handed out in September, not in June. This used to fire from
  // runPostSeasonFlow at the end of a year while telling the player the coach
  // wanted to stitch an A on his sweater "this season", which had just ended.
  //
  // It also ignored the one thing that decides it: whether the room is yours.
  // A player who was traded, claimed or signed somewhere new in the summer does
  // not walk into a strange dressing room wearing a letter, however good he is,
  // so the club has to be one he actually played a season for.
  if (done < TRAINED && !player.isCaptain && !player.isAlternate && !player.storylines?.alternateGiven) {
    const hist = player.seasonHistory || [];
    const lastSeason = hist[hist.length - 1];
    const sameRoom = lastSeason?.team === player.team && (lastSeason?.games || 0) >= 30;
    const trust = player.relationships?.coach || 50;
    const proSeasons = player.stats?.seasonsPlayed || 0;

    // A good year in front of the people voting on it helps; a bad one does not
    // rule it out, because a letter is about the room, not the scoresheet.
    const earnedIt = (lastSeason?.rating || 0) >= 7.0 || lastSeason?.titleWon || (player.fanStatus || 0) >= 500;
    const odds = trust >= 80 ? 0.45 : trust >= 70 ? 0.30 : 0.18;

    if (player.league === 'NHL' && proSeasons >= 3 && trust >= 65 && player.ovr >= 82
        && sameRoom && earnedIt && Math.random() < odds) {
      setPlayer(p => ({ ...p, storylines: { ...p.storylines, alternateGiven: true } }));
      setActiveEvent({
        title: '🅰️ THE LEADERSHIP GROUP',
        desc: `Camp opened this morning and the coach pulled you into his office before the first skate. He likes your work in the room and the way the young guys follow you around. He wants an "A" on your sweater for the season ahead.`,
        choices: [
          { label: 'Accept the responsibility', subLabel: 'Wear the letter and set the tone from the first day of camp.', isRisky: false, feedback: 'You are an alternate captain. The letter goes on the sweater before the opener.', effect: { fanStatus: 25, ovr: 1, rel: { coach: 15, teammates: 15 } }, action: 'MAKE_ALTERNATE' },
          { label: 'Tell him to give it to someone else', subLabel: 'Pass it to a teammate who has waited longer for it.', isRisky: false, feedback: 'You turned the letter down and told him to give it to someone who had waited longer. The room noticed that too.', effect: { fanStatus: 10, ovr: 0, rel: { teammates: 20 } } }
        ],
        isOffseasonEvent: true
      });
      enterStage(TRAINED);
      setScreen('event');
      return;
    }
  }

  if (done < TRAINED) {
    enterStage(TRAINED);
    if (ctx.generateTraining) ctx.generateTraining(player.pos, player);
    setScreen('preseason');
    return;
  }

  if (done < CAMP_DONE) {
    // Camp in reality turns on your situation far more than your rating: whether
    // you are walking into a room where you know nobody, playing out the last year
    // of a deal, or wearing the C and setting the tone. The chain only knew
    // "85+ OVR or captain", so between them two camps covered 47% of every
    // offseason a career will ever see. These three sit above that split.
    // The contract-year camp is held to established players on purpose, so a young
    // fringe player still gets the roster battle that actually describes his camp.
    // "New room" means you did not start last season with this club. That covers
    // both ways of arriving, and it self-limits to one year because next season's
    // history starts here. The two arrivals are not the same experience, though:
    // a player traded at the deadline has already played games in this building,
    // while a July signing has never pulled the sweater on, so the copy differs.
    const lastCampSeason = player.seasonHistory?.[player.seasonHistory.length - 1];
    const isNewRoom = !!lastCampSeason && lastCampSeason.team !== currentTeam && !isCurrentlyAmateur;
    const arrivedMidSeason = !!lastCampSeason && lastCampSeason.tradedTo === currentTeam;
    const isContractYear = (updatedContract?.years || 0) === 1 && player.ovr >= 76 && !isCurrentlyAmateur;

    // A captain's first camp wearing the C is a milestone and always fires. After
    // that it is occasional: an eight-year captain should not get the identical
    // camp eight times, he should mostly get the veteran camp instead.
    const firstCaptainCamp = !player.storylines?.hadCaptainCamp;
    const isCaptainCamp = player.isCaptain && (firstCaptainCamp || Math.random() < 0.3);

    if (isNewRoom) {
        ctx.setActiveEvent({
            title: '⛺ A NEW ROOM',
            desc: arrivedMidSeason
              ? `You came over at the deadline and finished the year here, but a handful of games is not the same as a camp. This is the first time you get the system from day one, with the room watching how you handle it.`
              : `You signed here in July and you have never pulled this sweater on. You walk into a room where you know nobody, and the system on the whiteboard is not the one you spent years learning. How you carry yourself this week decides where you start the season.`,
            choices: [
                {
                  label: 'Keep your head down and learn the system',
                  subLabel: 'Ask questions, take notes, and let the hockey speak later.',
                  isRisky: false,
                  feedback: 'A quiet first professional camp. The staff noticed you were the player that asked the most questions.',
                  effect: { fanStatus: 5, ovr: 0, rel: { coach: 12, teammates: 15 } }
                },
                {
                  label: 'Announce yourself',
                  subLabel: 'Be the best player on the ice from day one, whatever the room thinks.',
                  isRisky: true,
                  successChance: 0.55,
                  successFeedback: 'You were the best player on the ice from the first whistle. The room knows exactly who you are now.',
                  successEffect: { fanStatus: 35, ovr: 1, rel: { coach: 20, teammates: 10 } },
                  failFeedback: 'You ran a veteran in a no-contact drill trying to make a point. The room went cold on you.',
                  failEffect: { fanStatus: -10, ovr: 0, rel: { teammates: -25, coach: -5 } }
                }
            ],
            isOffseasonEvent: true
        });
        enterStage(CAMP_DONE);
        ctx.setScreen('event');
        return;
    }

    if (isCaptainCamp) {
        setPlayer(p => ({ ...p, storylines: { ...p.storylines, hadCaptainCamp: true } }));
        ctx.setActiveEvent({
            title: '⛺ THE CAPTAIN\'S CAMP',
            desc: `You wear the C. The room takes its temperature from you, and the staff want to know what kind of year this is going to be before the first puck drops.`,
            choices: [
                {
                  label: 'Address the room',
                  subLabel: 'Say your piece on day one and set the standard out loud.',
                  isRisky: false,
                  feedback: 'Short, direct, and nobody looked at their skates. The room stood a little taller afterwards.',
                  effect: { fanStatus: 20, ovr: 0, rel: { teammates: 25, coach: 12 } }
                },
                {
                  label: 'Lead on the ice instead',
                  subLabel: 'First one on, last one off, every single day. No speeches.',
                  isRisky: true,
                  successChance: 0.70,
                  successFeedback: 'First on and last off for two straight weeks. Nobody needed a speech after that.',
                  successEffect: { fanStatus: 45, ovr: 1, rel: { teammates: 20, coach: 15 } },
                  failFeedback: 'You ran yourself into the ground before the season even started and arrived at opening night already tired.',
                  failEffect: { fanStatus: -5, ovr: -1, rel: { coach: -5 } }
                }
            ],
            isOffseasonEvent: true
        });
        enterStage(CAMP_DONE);
        ctx.setScreen('event');
        return;
    }

    if (isContractYear) {
        ctx.setActiveEvent({
            title: '⛺ PLAYING FOR A CONTRACT',
            desc: `This is the last year of your deal. Every shift of camp is watched by your own management and by scouts from clubs who would happily sign you away from them.`,
            choices: [
                {
                  label: 'Lean on what got you here',
                  subLabel: 'Play your game, show them the player they already know they are paying for.',
                  isRisky: false,
                  feedback: 'No surprises, no mistakes. You looked exactly like the player your next contract is based on.',
                  effect: { fanStatus: 10, ovr: 0, rel: { coach: 10 } }
                },
                {
                  label: 'Show them a new dimension',
                  subLabel: 'Unveil the part of your game you worked on all summer, and risk looking lost doing it.',
                  isRisky: true,
                  successChance: 0.55,
                  successFeedback: 'You showed them something nobody knew you had. Your agent\'s phone started ringing before camp even broke.',
                  successEffect: { fanStatus: 40, ovr: 1, rel: { coach: 20, media: 15 } },
                  failFeedback: 'You looked uncomfortable all week doing something that is not your game, and the staff noticed.',
                  failEffect: { fanStatus: -15, ovr: -1, rel: { coach: -15 } }
                }
            ],
            isOffseasonEvent: true
        });
        enterStage(CAMP_DONE);
        ctx.setScreen('event');
        return;
    }

    // Established core players who are none of the above.
    const isEstablished = player.ovr >= 85;

    if (isEstablished) {
        ctx.setActiveEvent({
            title: '⛺ VETERAN TRAINING CAMP',
            desc: `You arrive at camp as an established core player for the ${player.league} season. The coaches know what you bring to the table. Use this time to set the tone for the rookies.`,
            choices: [
                {
                  label: 'Pace Yourself',
                  subLabel: 'Play it safe to stay fresh for opening night, and avoid a reckless injury.',
                  isRisky: false,
                  feedback: 'You coasted through camp cleanly. You were 100% ready for opening night.',
                  effect: { fanStatus: 10, ovr: 0 }
                },
                {
                  label: 'Dominate Scrimmages',
                  subLabel: 'Push hard to set the tone, at some injury risk.',
                  isRisky: true,
                  successChance: 0.75,
                  successFeedback: 'You looked absolutely unstoppable. The media is hyping you up for a career year.',
                  successEffect: { fanStatus: 50, ovr: 1, rel: { coach: 15 } },
                  failFeedback: 'You pushed too hard in a meaningless drill and tweaked a muscle.',
                  failEffect: { fanStatus: -10, ovr: -1, rel: { coach: -10 } }
                }
            ],
            isOffseasonEvent: true
        });
    } else {
        let campTitle, campDesc, riskyLabel, riskySubLabel, riskySuccess, riskyFail, safeLabel, safeSubLabel, safeFeedback;

        if (player.pos === 'G') {
            campTitle = '⛺ CREASE BATTLE';
            campDesc = 'Training camp has opened, and the team has a true goaltending controversy. You are locked in a fierce battle for the starter\'s net.';
            riskyLabel = 'Battle for the Starting Job';
            riskySubLabel = 'Push hard to win the starting net outright.';
            riskySuccess = 'You outplayed your competition in camp and secured the starting job!';
            riskyFail = 'You let in too many soft goals during scrimmages. The coach named you the backup.';
            safeLabel = 'Accept Backup Duty';
            safeSubLabel = 'Settle into a steady backup role without the pressure.';
            safeFeedback = 'You played a quiet, mistake-free camp and accepted the backup role behind the veteran.';
        } else if (['LD', 'RD'].includes(player.pos)) {
            campTitle = '⛺ BLUE LINE BATTLE';
            campDesc = 'Training camp has opened, and there is an open spot in the top-4 defensive pairings. You are locked in a fierce battle for those crucial minutes.';
            riskyLabel = 'Battle for a Top-4 Spot';
            riskySubLabel = 'Push hard to crack the top-4 pairing.';
            riskySuccess = 'You dominated the defensive drills and secured a Top-4 spot!';
            riskyFail = 'You got burned a few times in scrimmages. The coach bumped you down to the bottom pairing.';
            safeLabel = 'Accept a Bottom-Pairing Role';
            safeSubLabel = 'Settle into a safer bottom-pairing role.';
            safeFeedback = 'You played a quiet, mistake-free camp and slotted into a safe, third-pairing role.';
        } else {
            campTitle = '⛺ TRAINING CAMP BATTLE';
            campDesc = 'Training camp has opened, and the coach is looking for someone to step up into a top-6 scoring role. You are locked in a fierce roster battle.';
            riskyLabel = 'Battle for a Top-6 Spot';
            riskySubLabel = 'Push hard to crack the top-6 lineup.';
            riskySuccess = 'You showed incredible offensive chemistry in camp and secured a Top-6 spot!';
            riskyFail = 'You forced too many plays and turned the puck over. The coach bumped you down to the checking line.';
            safeLabel = 'Accept a Bottom-6 Role';
            safeSubLabel = 'Settle into a safer bottom-six role.';
            safeFeedback = 'You played a quiet, mistake-free camp and accepted a gritty checking role at the bottom of the lineup.';
        }

        ctx.setActiveEvent({
            title: campTitle,
            desc: campDesc,
            choices: [
                {
                  label: riskyLabel,
                  subLabel: riskySubLabel,
                  isRisky: true,
                  successChance: 0.50,
                  successFeedback: riskySuccess,
                  successEffect: { fanStatus: 20, ovr: 1, rel: { coach: 20 } },
                  failFeedback: riskyFail,
                  failEffect: { fanStatus: -10, ovr: -1, rel: { coach: -15 } },
                  action: 'ROUTE_MINIGAME'
                },
                {
                  label: safeLabel,
                  subLabel: safeSubLabel,
                  isRisky: false,
                  feedback: safeFeedback,
                  effect: { fanStatus: 0, ovr: 0, rel: { coach: 5 } }
                }
            ],
            isOffseasonEvent: true
        });
    } // Closes the if (isEstablished) / else block

    // Route to the event screen, and mark the offseason finished: the next visit
    // falls through to the preseason hand-off at the bottom.
    enterStage(CAMP_DONE);
    ctx.setScreen('event');
    return;

  } // closes the CAMP stage

  // Camp is done, and the training was chosen before it, so the offseason is
  // over and the season can start. The chosen card has already been applied to
  // the player, so no training effect is passed here.
  const ready = { ...player, offseason: null };
  setPlayer(p => ({ ...p, offseason: null }));
  if (ctx.handleTrain) ctx.handleTrain(null, ready);
  else setScreen('preseason');
} // Closes the entire advanceToOffseason function