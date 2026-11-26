import { ahlTeams, nhlTeams, echlTeams, sphlTeams, j20Teams, u20Teams, getOpponentPool, isAmateurLeague, euroLeagues, countryProLeagues, LEAGUE_COUNTRY } from '../data/teams';
import { shopItems } from '../data/economy';
import { arbitrationEligible, elcYears, gamesInLeague, getTransferImpact, isNhlFreeAgentEligible, isRestricted, onNhlContract, rightsExpiryYear } from '../utils/gameHelpers';
import { nhlGamesIn } from '../utils/rosterMoves';
import { withOfferPerks } from '../data/offerPerks';
import { getRole } from '../utils/appHelpers';
import { clubOutlook, placeIn, projectedTable, teamStrengthOf } from '../utils/leagueState';
import { leagueMinimumFor, nhlMarketValue } from '../utils/contracts';
import { veteranBonuses } from '../utils/bonuses';

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
    // AN UNSIGNED PICK BETWEEN CONTRACTS IN EUROPE.
    //
    // He isn't a free agent in the NHL sense. One club holds his NHL rights,
    // so it's the only NHL club that can offer him anything, and no AHL club
    // can sign him out from under it. His summer is a choice between a new
    // deal in Europe (his own club, or another) and that club's entry-level
    // contract, if it offers one. He used to get the open market, labelled
    // a UFA, with an AHL club bidding against the team that drafted him.
    const rightsHeld = player.rights && !onNhlContract(player);
    if (!isTradeRequest && !opts.europeOnly && rightsHeld && euroLeagues.includes(overrideLeague || player.league)) {
      const lg = overrideLeague || player.league;
      const home = overrideTeam || player.team;
      const PAY = { KHL: 1.9, SHL: 1.0, SWISS: 1.35, LIIGA: 0.92, DEL: 1.05, CZECH: 0.8, ICEHL: 0.85, SLOVAK: 0.7 };
      const base = 110000 + Math.max(0, (player.ovr || 50) - 55) * 10500;
      const euroOffer = (team, league, type, state) => ({
        team, league, type, state, fanHit: type === 'EXTENSION' ? 10 : 0, role: 'Pro Roster', rightsSummer: true,
        salary: Math.round((base * (PAY[league] ?? 0.55) * (0.85 + Math.random() * 0.3)) / 5000) * 5000,
        years: 1 + Math.floor(Math.random() * 2)
      });
      const pickOne = (arr) => arr[Math.floor(Math.random() * arr.length)];
      const rightsOffers = [euroOffer(home, lg, 'EXTENSION', 'Current Club')];
      // Another club in his league, and one from the tier above or below at
      // home when there is one.
      const sameLeague = (getOpponentPool(lg) || []).filter(t => t.id !== home);
      if (sameLeague.length) rightsOffers.push(euroOffer(pickOne(sameLeague).id, lg, 'FREE AGENCY', 'Europe'));
      const ladder = countryProLeagues(LEAGUE_COUNTRY[lg]);
      const near = ladder[ladder.indexOf(lg) + ((player.ovr || 0) >= 66 ? -1 : 1)];
      const nearPool = near ? (getOpponentPool(near) || []) : [];
      if (nearPool.length) rightsOffers.push(euroOffer(pickOne(nearPool).id, near, 'FREE AGENCY', 'Europe'));
      // The drafting club, when it thinks he's ready.
      if ((player.ovr || 0) >= (player.pos === 'G' ? 63 : 65)) {
        rightsOffers.push({
          team: player.rights, league: 'NHL', type: 'ENTRY-LEVEL CONTRACT', state: 'Holds your rights',
          salary: 925000, years: elcYears(player.age), role: getRole(925000, { ...player, league: 'NHL' }),
          fanHit: 10, rightsSummer: true, rightsUntil: rightsExpiryYear(player)
        });
      }
      setFreeAgencyOffers(rightsOffers.map(o => withOfferPerks(o, { maxPerks: 2, maxFlaws: 2 })));
      setScreen('transfer');
      return true;
    }

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
      //
      // The second tiers are the other end of it: they'll take anyone, and a
      // player good enough for a top league doesn't hear from them (maxOvr).
      // Pools are read live, because promotion and relegation move clubs.
      const EURO = [
        { lg: 'KHL', pay: 1.9, minOvr: 74 },
        { lg: 'SHL', pay: 1.00, minOvr: 70 },
        { lg: 'SWISS', pay: 1.35, minOvr: 68 },
        { lg: 'LIIGA', pay: 0.92, minOvr: 65 },
        { lg: 'DEL', pay: 1.05, minOvr: 61 },
        { lg: 'CZECH', pay: 0.80, minOvr: 57 },
        { lg: 'ICEHL', pay: 0.85, minOvr: 50 },
        { lg: 'SLOVAK', pay: 0.70, minOvr: 0 },
        { lg: 'VHL', pay: 0.65, minOvr: 0, maxOvr: 72 },
        { lg: 'ALLSV', pay: 0.55, minOvr: 0, maxOvr: 70 },
        { lg: 'SL', pay: 0.70, minOvr: 0, maxOvr: 68 },
        { lg: 'DEL2', pay: 0.55, minOvr: 0, maxOvr: 68 },
        { lg: 'EIHL', pay: 0.50, minOvr: 0, maxOvr: 70 },
        { lg: 'MESTIS', pay: 0.40, minOvr: 0, maxOvr: 66 },
        { lg: 'MAGNUS', pay: 0.45, minOvr: 0, maxOvr: 66 },
        { lg: 'METAL', pay: 0.45, minOvr: 0, maxOvr: 64 },
        { lg: 'EHL', pay: 0.45, minOvr: 0, maxOvr: 64 },
        { lg: 'ALPS', pay: 0.40, minOvr: 0, maxOvr: 62 }
      ].map(e => ({ ...e, pool: (getOpponentPool(e.lg) || []).filter(t => t.id !== player.team) }))
        // A player leaving a relegated club is looking for a top league, not
        // another second tier.
        .filter(e => e.pool.length && !(opts.reason === 'relegation' && e.maxOvr));

      // The name on the back of the sweater is worth something over there. A
      // long NHL career gets a club to pick up the phone it would not have
      // picked up for the same player with the same rating and no history.
      const nhlGames = player.stats?.nhl?.games || 0;
      const standing = player.ovr + (nhlGames >= 500 ? 6 : nhlGames >= 200 ? 4 : nhlGames >= 40 ? 2 : 0);

      // Who would actually call. Below the bottom of the board there is always
      // somewhere to play, so the list is topped up from the least fussy
      // leagues rather than left short: a market that opens with nothing on it
      // is the bug this whole screen exists to avoid.
      const within = EURO.filter(e => standing >= e.minOvr && standing <= (e.maxOvr ?? 999));
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
          role: (player.age || 0) >= 32 ? 'Veteran Leader' : 'Pro Roster',
          fanHit: 0,
          state: 'Europe',
          // A farewell tour rather than a way out of a relegated club, so the
          // screen keeps the option to retire under the offers.
          ...(opts.reason === 'relegation' ? {} : { twilight: true })
        };
      });

      setFreeAgencyOffers(euroOffers.map(o => withOfferPerks(o)));
      if (setEventFeedback) {
        setEventFeedback(opts.reason === 'relegation'
          ? 'Your agent made the calls. These are the clubs that want you.'
          : 'Your agent made the calls. These are the clubs that want a veteran.');
      }
      setScreen('transfer');
      return true;
    }

    // Safely extract the team ID in case it was accidentally passed as an object
    let rawTeam = overrideTeam || player.team;
    let actingTeam = typeof rawTeam === 'object' && rawTeam !== null ? (rawTeam.id || rawTeam.team || rawTeam.name || 'UNK') : rawTeam;
    let actingLeague = overrideLeague || player.league; 
    
    // Establish an internal rights variable that travels with the player during a trade
    let currentRights = player.rights;

    // WHO HE BELONGS TO. A player in the minors on an NHL deal belongs to the
    // parent club, and that is who gets to extend him. One on an AHL deal
    // belongs to nobody once it ends: the AHL club can re-sign him, and every
    // NHL club can bid. See onNhlContract.
    if (['AHL', 'ECHL'].includes(actingLeague) && onNhlContract({ ...player, league: actingLeague })) {
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

    const leagueMinimum = leagueMinimumFor(currentYear);

    let baseSalary;
    let maxYears;
    let minYears = 1; // NEW: Ensure bridge deals don't roll 1-year terms
    // The comparables this round of offers was priced from, carried onto every
    // offer so the negotiation screen can show the player who he is being
    // measured against rather than just the number that came out.
    let market = null;

    const isRFA = actingLeague === 'NHL' && isRestricted({ ...player, league: 'NHL' });
    const canArbitrate = isRFA && arbitrationEligible(player);

    // Force NHL logic if actingLeague is NHL. Impossible to get $165k here.
    if (actingLeague === 'NHL') {
      // WHAT HE IS WORTH, AND WHO SAYS SO.
      //
      // This was a formula on his own career averages with the term gated on
      // player.ovr. It is now his recent form priced against the classmates
      // who are actually playing in this league, so there are names and
      // numbers behind the figure. See utils/contracts.js for the whole of it.
      //
      // The agent takes his cut of the argument: multi is the club's appetite
      // and the player's reputation moves it too. The price itself, including
      // the restricted free agent's discount and the maximum contract, comes
      // from nhlMarketValue, so every other offer in the game that quotes him
      // a salary gets the same number.
      const mv = nhlMarketValue(player, currentYear, {
        agentMulti: multi, minimum: leagueMinimum,
        rfa: isRFA ? { canArbitrate } : null
      });
      market = mv.market;
      const tier = mv.tier;
      baseSalary = mv.salary;
      maxYears = tier.maxYears;
      if (isRFA) minYears = tier.rfaMinYears;

      if (player.age >= 37) {
         maxYears = Math.min(maxYears, 1);
         minYears = 1;
      } else if (player.age >= 35) {
         maxYears = Math.min(maxYears, 2);
      } else if (player.age >= 32) {
         maxYears = Math.min(maxYears, 4);
      }
      minYears = Math.min(minYears, maxYears);
    } else {
      // Minor league / amateur fallback pay
      baseSalary = (leagueMinimum + (Math.random() * 150000)) * multi;
      maxYears = 3; 
    }

    baseSalary = Math.max(leagueMinimum, Math.round(baseSalary / 25000) * 25000);
    let offers = [];
    
    const isAmateurGraduating = isAmateurLeague(actingLeague);
    
    const coachTrust = player.relationships?.coach ?? 50; // B2: Front Office Consumer
    let teamDidNotExtend = false;

    // The club that just bought him out isn't bidding to have him back. Its
    // extension used to sit at the top of the market as if nothing had
    // happened.
    const cutBy = player.rightsLapsedBy && player.rightsLapsedBy === actingTeam;
    if (cutBy && !isTradeRequest) teamDidNotExtend = true;

    if (!isTradeRequest && !isAmateurGraduating && !cutBy) {
      // If Front Office trust is toxic, you are a liability and they let you walk (unless you're an elite superstar)
      if (coachTrust < 30 && player.ovr < 88 && Math.random() < 0.75) {
         setEventFeedback("The front office thinks you're a problem in the room, and they have told your agent there will be no extension. You're going to the open market.");
         teamDidNotExtend = true;
      } 
      // A club qualifies the restricted players it means to keep. One who
      // spent the year in the minors and isn't close to a job up top often
      // isn't qualified at all, and becomes unrestricted. Before this only a
      // player under 65 could go unqualified, so every RFA was.
      else if (isRFA && nhlGamesIn((player.seasonHistory || []).slice(-1)[0]) < 20 && player.ovr < 70
               && Math.random() < (coachTrust > 75 ? 0.35 : 0.55)) {
         setEventFeedback("Your club didn't send you a qualifying offer. You're an unrestricted free agent.");
         teamDidNotExtend = true;
      }
      // High Front Office trust saves fringe players from being cut
      else if (player.ovr < 65 && Math.random() > (coachTrust > 75 ? 0.85 : 0.60)) {
         setEventFeedback(isRFA ? "Your team elected not to extend a Qualifying Offer. You're now an Unrestricted Free Agent." : "Your team elected not to extend your contract. You're now a UFA.");
         teamDidNotExtend = true;
      } else if (!isRFA && Math.random() > 0.70 && player.ovr < 85 && coachTrust < 70) {
         setEventFeedback("Your current team has decided to move in a different direction and won't offer you an extension. You're heading to the open market.");
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
           // Never under the qualifying offer: he could simply take that.
           salary: actingLeague !== 'NHL' ? Math.max(85000, Math.floor(baseSalary * 0.15))
             : isRFA ? Math.max(baseSalary, Math.round(qoSalary / 25000) * 25000) : baseSalary,
           years: maxYears,
           // A two-way deal for a player in the minors or below an NHL job. It was
           // anyone under 75, which sent NHL regulars' extensions to the AHL.
           role: actingLeague !== 'NHL' ? 'Pro Roster' : ((player.league === 'AHL' || player.ovr < (player.pos === 'G' ? 75 : 68)) ? 'Two-Way Deal (AHL Start)' : getRole(baseSalary, { ...player, league: 'NHL' })),
           fanHit: 10,
           state: ccState,
           standing: currentClubStanding,
           // His own club, and they hold his rights: he can refuse and hold out.
           ...(isRFA ? { rfaHoldout: true } : {})
         });

         // 2. Inject the bare-minimum Qualifying Offer (Legal requirement for RFAs)
         if (isRFA) {
             offers.push({
               team: actingTeam,
               league: actingLeague,
               type: 'QUALIFYING OFFER',
               salary: qoSalary,
               // Whether he can take the club to a hearing instead.
               arbitration: canArbitrate,
               years: 1, // QOs are strictly 1-year deals
               // A qualifying offer is two-way only for a player who hasn't
               // been an NHL regular. Under the CBA it's one-way after 180 NHL
               // games in the last three seasons (60 a year), and the role is
               // what the sim deploys him by, so every RFA who took his QO
               // spent the next season on the AHL-start multiplier.
               role: (player.seasonHistory || []).slice(-3).reduce((n, s) => n + gamesInLeague(s, 'NHL'), 0) >= 180
                 ? getRole(qoSalary, { ...player, league: 'NHL' }) : 'Two-Way Deal',
               fanHit: 0,
               state: ccState,
               standing: currentClubStanding
             });
         }

         // THE HOMETOWN DISCOUNT.
         //
         // Taking less to stay is something a player does for a club that
         // means something to him: the one that drafted him, or the one he
         // grew up cheering for (see utils/boyhood.js). It used to be offered
         // by whatever club he was at, the moment his fans passed six hundred.
         // The club that drafted him still has to be one whose fans love him;
         // the boyhood club doesn't. RFAs can take it too, signing long-term
         // for less to help the cap.
         const discountReason = actingLeague !== 'NHL' ? null
           : actingTeam === player.boyhoodTeam ? 'boyhood'
             : actingTeam === player.draftTeam && (player.fanStatus || 0) >= 600 ? 'drafted'
               : null;
         if (discountReason) {
             // We base the cut on the TRUE baseSalary, regardless of if the QO inflated the perceived baseline.
             const discountSalary = Math.max(leagueMinimum, Math.round((baseSalary * 0.65) / 25000) * 25000);
             offers.push({
                 team: actingTeam,
                 league: actingLeague,
                 type: 'HOMETOWN DISCOUNT',
                 discountReason,
                 salary: discountSalary,
                 years: Math.min(8, Math.max(5, maxYears + 2)), // Guaranteed long-term security
                 role: getRole(baseSalary, { ...player, league: 'NHL' }),
                 fanHit: 100, // Massive loyalty boost
                 state: 'Staying Put',
                 nmc: true, // Rewarded with a No-Movement Clause
                 perks: [{ text: '🔒 Absolute Loyalty (+100 Fans)', fanStatus: 100, ovr: 0, money: 0, color: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30' }]
             });
         }

         // Holding out isn't an offer the club makes. It's what he does when
         // he won't sign theirs, from the negotiation on the extension. See
         // startHoldout in App.
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
            salary: osSalary, years: 5, role: getRole(osSalary, { ...player, league: 'NHL' }),
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

        // A weak seventeen-year-old was being offered the SHL and Liiga, the
        // two strongest leagues in Europe, as the market's bottom rung. At
        // that age and level the place for him is a junior team.
        if (player.ovr < 65) {
            if (player.ovr < 55) {
               pool = isUnder18 ? (j20Teams || []) : (sphlTeams || []);
               targetLg = isUnder18 ? 'J20' : 'SPHL';
            } else if (player.ovr < 60) {
               pool = isUnder18 ? (u20Teams || []) : (echlTeams || []);
               targetLg = isUnder18 ? 'U20' : 'ECHL';
            } else {
               const roll = Math.random();
               // An adult at this level also hears from the second tiers in
               // Sweden and Germany, which is where most of them actually go.
               targetLg = isUnder18
                 ? (roll > 0.50 ? 'SHL' : roll > 0.25 ? 'LIIGA' : roll > 0.10 ? 'CZECH' : 'SLOVAK')
                 : (roll > 0.75 ? 'AHL' : roll > 0.62 ? 'SHL' : roll > 0.50 ? 'LIIGA'
                   : roll > 0.36 ? 'CZECH' : roll > 0.24 ? 'SLOVAK' : roll > 0.12 ? 'ALLSV' : 'DEL2');
               pool = getOpponentPool(targetLg) || [];
            }
        } else if (player.ovr < 75 && i === offerCount - 1) {
            const roll = Math.random();
            if (roll > 0.6) {
                pool = getOpponentPool('KHL') || [];
                targetLg = 'KHL';
            } else if (roll > 0.3) {
                pool = getOpponentPool('SWISS') || [];
                targetLg = 'SWISS';
            } else {
                pool = isUnder18 ? (getOpponentPool('SHL') || []) : (ahlTeams || []);
                targetLg = isUnder18 ? 'SHL' : 'AHL';
            }
        }

        // An AHL club can't sign a player whose NHL rights someone else holds.
        if (targetLg === 'AHL' && rightsHeld) {
            pool = [];
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

            // A player under 25 signing his first NHL contract signs an
            // entry-level one, whoever he signs it with: the CBA sets the pay
            // and the term by his age. These were being priced and termed like
            // any veteran's deal, up to seven years.
            const firstNhlDeal = targetLg === 'NHL' && !isTradeRequest && player.age < 25
              && !onNhlContract(player) && !(player.seasonHistory || []).some(s => gamesInLeague(s, 'NHL') > 0);
            if (firstNhlDeal) {
              offerSalary = 925000;
              offerYears = elcYears(player.age);
            }
            
            offers.push({
              team: t,
              league: targetLg,
              type: isTradeRequest ? 'TRADE' : 'FREE AGENCY',
              salary: offerSalary,
              years: offerYears,
              // Named for the league he'd be joining, not the one he's leaving: an AHL
              // player's NHL offer was being described on the AHL's scale.
              role: targetLg === 'NHL' ? getRole(offerSalary, { ...player, league: 'NHL' }) : 'Pro Roster',
              fanHit: getTransferImpact(actingTeam, t),
              state: teamState,
              standing: projectedStanding,
              nmc: getsNMC
            });
          }
        }
      }
    }
    
    // THE CLUB HE GREW UP CHEERING FOR, BIDDING FOR HIM.
    //
    // When they're one of the clubs in his free agency, they come with the
    // same hometown discount his own club would: less a year, more years, the
    // no-movement clause, and a city that already loves him.
    const boyhoodBid = !isTradeRequest && player.boyhoodTeam && player.boyhoodTeam !== actingTeam
      && offers.find(o => o.team === player.boyhoodTeam && o.league === 'NHL' && o.type === 'FREE AGENCY' && o.salary > 925000);
    if (boyhoodBid) {
      const bSalary = Math.max(leagueMinimum, Math.round((boyhoodBid.salary * 0.75) / 25000) * 25000);
      offers.push({
        team: boyhoodBid.team,
        league: 'NHL',
        type: 'HOMETOWN DISCOUNT',
        discountReason: 'boyhood',
        salary: bSalary,
        years: Math.min(8, Math.max(5, (boyhoodBid.years || 1) + 2)),
        role: boyhoodBid.role,
        fanHit: 100,
        state: boyhoodBid.state,
        standing: boyhoodBid.standing,
        nmc: true,
        perks: [{ text: '🔒 Coming home (+100 Fans)', fanStatus: 100, ovr: 0, money: 0, color: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30' }]
      });
    }

    // RUSSIAN FACTOR KHL MEGADEAL INJECTION
    if (player.storylines?.russianFactorChoice === 'KHL' && !offers.some(o => o.league === 'KHL')) {
      const khlPool = getOpponentPool('KHL') || [];
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
      const fallbackPool = isUnder18 ? (getOpponentPool('SHL') || []) : (ahlTeams || []);
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
    
    setFreeAgencyOffers(offers.map(o => {
      // A one-year NHL deal for a man of thirty-five or more is the one veteran
      // contract allowed to carry performance bonuses, and the clubs use them:
      // a smaller guarantee, paid up if he stays in the lineup.
      const veteranDeal = o.league === 'NHL' && (player.age || 0) >= 35 && o.years === 1
        && o.type !== 'QUALIFYING OFFER' && o.type !== 'OFFER SHEET';
      const oWithPerks = withOfferPerks({ ...o, market, ...(veteranDeal ? { bonuses: veteranBonuses() } : {}) });
      
      // Inject NMC / Trade Protection directly into the perk arrays
      if (o.nmc && !oWithPerks.perks?.some(p => p.name?.includes('No-Move'))) {
         oWithPerks.perks = [{ name: '🔒 No-Movement Clause', effect: 'Full Control', ovr: 0, fanStatus: 15, money: 0, color: 'text-[#22E748] bg-[#22E748]/10 border-[#22E748]/30' }, ...(oWithPerks.perks || [])];
      } else if (o.league === 'NHL' && !o.nmc && o.type !== 'QUALIFYING OFFER' && o.type !== 'OFFER SHEET') {
         oWithPerks.flaws = [{ name: 'No trade protection', effect: 'Can be traded', ovr: 0, fanStatus: 0, money: 0 }, ...(oWithPerks.flaws || [])];
      }

      return oWithPerks;
    }));
    
    setScreen('transfer');
    return true;
}