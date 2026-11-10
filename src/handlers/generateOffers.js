import { ahlTeams, liigaTeams, nhlTeams, shlTeams, echlTeams, khlTeams, swissTeams, sphlTeams, czechTeams, slovakTeams, delTeams, icehlTeams } from '../data/teams';
import { shopItems } from '../data/economy';
import { getTransferImpact, isNhlFreeAgentEligible } from '../utils/gameHelpers';
import { withOfferPerks } from '../data/offerPerks';
import { getRole } from '../utils/appHelpers';
import { clubOutlook, placeIn, projectedTable, teamStrengthOf } from '../utils/leagueState';
import { capFor, comparables, marketTier } from '../utils/contracts';

// A club's projected finish, read out of one table for the whole league.
//
// This used to convert each club's strength into a position on its own, one
// offer at a time, which is how a free agency sheet could show two different
// clubs both projected to finish eleventh. Ranking every club against every
// other club once makes that impossible: a position is a position.
const standingFromStrength = (leagueState, teamId) => {
  const table = projectedTable(leagueState, nhlTeams || []);
  return placeIn(table, teamId) ?? Math.round(((nhlTeams || []).length || 32) / 2);
};

export function generateOffers(ctx, isTradeRequest = false, overrideTeam = null, overrideLeague = null, opts = {}) {
  const { currentYear, player, setEventFeedback, setFreeAgencyOffers, setScreen } = ctx;

    // The backstop. This function had no eligibility check of any kind, so every
    // caller was trusted to have done the gating, and any that had not handed an
    // amateur a page of NHL contract offers. A trade request is a different thing
    // and is exempt. Returns false so the caller can carry on with the offseason
    // instead of stalling on a screen that should never have opened.
    if (!isTradeRequest && !opts.europeOnly && !isNhlFreeAgentEligible(player, ctx.safeJuniorLeagues)) {
       return false;
    }

    // A farewell tour in Europe.
    //
    // Signing a twilight contract overseas used to pick a club for you at
    // random, out of two leagues, and tell you where you were going. It is the
    // last decision of a career and it ought to be a decision, so it opens the
    // market instead, with nothing on the board but European clubs.
    if (opts.europeOnly) {
      // Ranked by how hard the league is to get into, hardest first. A faded
      // veteran is not signing in the KHL, but Slovakia, Austria and the Czech
      // league will all take a former NHL player who can still skate, and the
      // old flat list offered every one of them to everybody.
      const EURO = [
        { lg: 'KHL', pool: khlTeams, pay: 1.9, minOvr: 74 },
        { lg: 'SHL', pool: shlTeams, pay: 1.00, minOvr: 70 },
        { lg: 'SWISS', pool: swissTeams, pay: 1.35, minOvr: 68 },
        { lg: 'LIIGA', pool: liigaTeams, pay: 0.92, minOvr: 65 },
        { lg: 'DEL', pool: delTeams, pay: 1.05, minOvr: 61 },
        { lg: 'CZECH', pool: czechTeams, pay: 0.80, minOvr: 57 },
        { lg: 'ICEHL', pool: icehlTeams, pay: 0.85, minOvr: 50 },
        { lg: 'SLOVAK', pool: slovakTeams, pay: 0.70, minOvr: 0 }
      ].filter(e => (e.pool || []).length);

      // The name on the back of the sweater is worth something over there. A
      // long NHL career gets a club to pick up the phone it would not have
      // picked up for the same player with the same rating and no history.
      const nhlGames = player.stats?.nhl?.games || 0;
      const standing = player.ovr + (nhlGames >= 500 ? 6 : nhlGames >= 200 ? 4 : nhlGames >= 40 ? 2 : 0);

      // Who would actually call. Below the bottom of the board there is always
      // somewhere to play, so the list is topped up from the least fussy
      // leagues rather than left short: a market that opens with nothing on it
      // is the bug this whole screen exists to avoid.
      const within = EURO.filter(e => standing >= e.minOvr);
      const spare = EURO.filter(e => standing < e.minOvr).sort((a, b) => a.minOvr - b.minOvr);
      const count = Math.min(EURO.length, standing >= 78 ? 5 : standing >= 68 ? 4 : 3);
      const board = [...within.sort(() => 0.5 - Math.random()), ...spare];
      const picked = board.slice(0, count);
      const base = 110000 + Math.max(0, standing - 55) * 10500;

      const euroOffers = picked.map(entry => {
        const club = entry.pool[Math.floor(Math.random() * entry.pool.length)];
        const salary = Math.round((base * entry.pay * (0.85 + Math.random() * 0.35)) / 5000) * 5000;
        return {
          team: club.id,
          league: entry.lg,
          salary,
          years: 1 + Math.floor(Math.random() * 2),
          role: 'Veteran Leader',
          fanHit: 0,
          state: 'Europe'
        };
      });

      setFreeAgencyOffers(euroOffers.map(o => withOfferPerks(o)));
      if (setEventFeedback) setEventFeedback('Your agent made the calls. These are the clubs that want a veteran.');
      setScreen('transfer');
      return true;
    }

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
    let minYears = 1; // NEW: Ensure bridge deals don't roll 1-year terms
    // The comparables this round of offers was priced from, carried onto every
    // offer so the negotiation screen can show the player who he is being
    // measured against rather than just the number that came out.
    let market = null;

    const isRFA = actingLeague === 'NHL' && player.age < 27;

    // Force NHL logic if actingLeague is NHL. Impossible to get $165k here.
    if (actingLeague === 'NHL') {
      // WHAT HE IS WORTH, AND WHO SAYS SO.
      //
      // This was a formula on his own career averages with the term gated on
      // player.ovr. It is now his recent form priced against the classmates
      // who are actually playing in this league, so there are names and
      // numbers behind the figure. See utils/contracts.js for the whole of it.
      market = comparables(player, player.peers, currentYear);
      const tier = marketTier(market.anchor, currentYear);
      const cap = capFor(currentYear);

      // The agent takes his cut of the argument: multi is the club's appetite
      // and repMod is what the player's reputation is doing to it.
      baseSalary = Math.max(market.anchor * multi * repMod, cap * tier.floorShare);
      maxYears = tier.maxYears;
      if (isRFA) minYears = tier.rfaMinYears;

      if (tier.tier === 'fringe') {
        baseSalary = Math.max(leagueMinimum + 150000, baseSalary);
      }

      if (player.age >= 37) {
         maxYears = Math.min(maxYears, 1);
         minYears = 1;
      } else if (player.age >= 35) {
         maxYears = Math.min(maxYears, 2);
      } else if (player.age >= 32) {
         maxYears = Math.min(maxYears, 4);
      }
      minYears = Math.min(minYears, maxYears);

      // The maximum contract is twenty per cent of the cap, which is what the
      // real one is, rather than a hand-written number needing its own
      // inflation term.
      baseSalary = Math.min(cap * 0.20, baseSalary);
    } else {
      // Minor league / amateur fallback pay
      baseSalary = (leagueMinimum + (Math.random() * 150000)) * multi;
      maxYears = 3; 
    }

    baseSalary = Math.max(leagueMinimum, Math.round(baseSalary / 25000) * 25000);
    let offers = [];
    
    const isAmateurGraduating = ['OHL', 'WHL', 'QMJHL', 'USHL', 'J20', 'U20', 'NCAA'].includes(actingLeague);
    
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
         // Your own club's standing, from the same source every other offer
         // now reads. This was its own separate Math.random(), so an extension
         // from the team you already play for could describe them as a
         // contender in the same breath that a rival offer called them a
         // rebuild.
         const currentClubStanding = actingLeague === 'NHL' ? standingFromStrength(player.leagueState, actingTeam) : null;
         let ccState = 'Current Club';
         if (actingLeague === 'NHL') {
             ccState = clubOutlook(teamStrengthOf(player.leagueState, actingTeam)).label;
         } else if (player.league === 'AHL' || player.ovr < 75) {
             ccState = 'Two-Way Contract';
         }

         // 1. Generate the true Fair-Market Extension (for everyone)
         offers.push({
           team: actingTeam,
           league: actingLeague,
           type: 'EXTENSION', // FIX: Forces the UI to actually render this fair-market offer!
           salary: actingLeague !== 'NHL' ? Math.max(85000, Math.floor(baseSalary * 0.15)) : baseSalary,
           years: maxYears,
           role: actingLeague !== 'NHL' ? 'Pro Roster' : ((player.league === 'AHL' || player.ovr < 75) ? 'Two-Way Deal (AHL Start)' : getRole(baseSalary, player)),
           fanHit: 10,
           state: ccState,
           standing: currentClubStanding
         });

         // 2. Inject the bare-minimum Qualifying Offer (Legal requirement for RFAs)
         if (isRFA) {
             offers.push({
               team: actingTeam,
               league: actingLeague,
               type: 'QUALIFYING OFFER',
               salary: qoSalary,
               years: 1, // QOs are strictly 1-year deals
               role: 'Two-Way Deal', // QOs offer no roster guarantees
               fanHit: 0,
               state: ccState,
               standing: currentClubStanding
             });
         }

         // NEW: HOMETOWN DISCOUNT (For Beloved Players)
         // Note: RFAs can now take hometown discounts too, signing long-term for less AAV to help the cap.
         if (actingLeague === 'NHL' && (player.fanStatus || 0) >= 600) {
             // We base the cut on the TRUE baseSalary, regardless of if the QO inflated the perceived baseline.
             const discountSalary = Math.max(leagueMinimum, Math.round((baseSalary * 0.65) / 25000) * 25000);
             offers.push({
                 team: actingTeam,
                 league: actingLeague,
                 type: 'HOMETOWN DISCOUNT',
                 salary: discountSalary,
                 years: Math.min(8, Math.max(5, maxYears + 2)), // Guaranteed long-term security
                 role: getRole(baseSalary, player),
                 fanHit: 100, // Massive loyalty boost
                 state: 'Staying Put',
                 nmc: true, // Rewarded with a No-Movement Clause
                 perks: [{ text: '🔒 Absolute Loyalty (+100 Fans)', fanStatus: 100, ovr: 0, money: 0, color: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30' }]
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
            fanHit: getTransferImpact(actingTeam, offerSheetTeam), state: 'Offer Sheet'
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

        // A club that held his rights and declined to sign him does not then
        // turn up in free agency the same summer bidding for the player it
        // just let walk.
        if (player.rightsLapsedBy) {
          pool = pool.filter(t => t.id !== player.rightsLapsedBy);
        }

        if (pool.length > 0) {
          const t = pool[Math.floor(Math.random() * pool.length)].id;
          if (t !== actingTeam && !offers.find(o => o.team === t)) {
            let offerSalary = Math.round((baseSalary * (0.85 + (Math.random() * 0.35))) / 25000) * 25000; 
            
            let teamState;
            let projectedStanding = null;

            if (targetLg === 'NHL') {
                // Where the club actually is, not a fresh coin flip.
                //
                // This was Math.floor(Math.random() * 32) + 1, rolled per
                // offer, which is how a sheet could call a club a Contender
                // in July and the same club finish twenty-eighth in April:
                // the label came from one random number and the season came
                // from the club's persisted strength, and the two had nothing
                // to do with each other.
                projectedStanding = standingFromStrength(player.leagueState, t);
                
                // One vocabulary for how good a club is. The offer sheet used
                // to say Contender / Competitor / Outsider / Rebuilder while
                // clubOutlook said Contender / In the hunt / Middling /
                // Struggling / Rebuilding, for the same underlying number.
                const strength = teamStrengthOf(player.leagueState, t);
                teamState = clubOutlook(strength).label;

                // A good club pays less because players want to be there, a
                // bad one has to pay over the odds to get anyone to come.
                const payMulti = strength >= 0.80 ? 0.85 : strength >= 0.62 ? 1.0
                               : strength >= 0.40 ? 1.08 : strength >= 0.22 ? 1.15 : 1.22;
                offerSalary = Math.round((offerSalary * payMulti) / 25000) * 25000;
            } else {
                teamState = 'Development Roster';
            }

            if (targetLg !== 'NHL') {
                offerSalary = Math.max(85000, Math.floor(offerSalary * 0.15));
            } else {
                offerSalary = Math.max(leagueMinimum, offerSalary);
            }
            
            const getsNMC = targetLg === 'NHL' && player.age >= 26 && player.ovr >= 85 && Math.random() > 0.4;
            
            // Use our new minYears constraint to prevent weird 1-year bridge deals for RFAs
            let offerYears = Math.floor(Math.random() * (maxYears - minYears + 1)) + minYears;
            offerYears = Math.min(7, offerYears);
            
            offers.push({
              team: t,
              league: targetLg,
              type: isTradeRequest ? 'TRADE' : 'FREE AGENCY',
              salary: offerSalary,
              years: offerYears,
              role: targetLg === 'NHL' ? getRole(offerSalary, player) : 'Pro Roster',
              fanHit: getTransferImpact(actingTeam, t),
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
        fanHit: 30,
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
        fanHit: 0,
        state: 'Depth Opportunity'
      }];
    }

    offers.sort((a, b) => b.salary - a.salary);
    // Every offer carries perks and flaws now, so the screen always has something
    // to weigh beyond the salary, and the comparables it was priced from, so
    // the player can see the argument rather than only the number.
    setFreeAgencyOffers((offers).map(o => withOfferPerks({ ...o, market })));
    setScreen('transfer');
    return true;
}