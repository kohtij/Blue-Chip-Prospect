import { getOpponentPool, getTeamData, ncaaTeams, ohlTeams, whlTeams, qmjhlTeams, nordicJuniorLeagues, JUNIOR_PARENT_LEAGUE } from '../data/teams';
import { getFullTeamName, getPlayoffTitles } from '../utils/appHelpers';
import { generateOffers } from './generateOffers';
import { rollOfferPerks } from '../data/offerPerks';
import { formatMoney, recomputeOvr, isNhlFreeAgentEligible, hasProContract, leagueWithArticle } from '../utils/gameHelpers';
import { capFor, majorCount, priceOf, recentForm } from '../utils/contracts';
import { buyoutTerms, salaryParts } from '../utils/bonuses';
import { COACH_SYSTEMS, coachOpening, goaliePartner, playerArchetype, roomFor, summerAtClubs } from '../utils/roster';
import { teamStrengthOf } from '../utils/leagueState';

export function advanceToOffseason(ctx) {
  // ADD setSeasonEvents to this line:
  const { player, seasonRecap, setActiveEvent, setPlayer, setScreen, safeEuroLeagues, safeJuniorLeagues, setSeasonEvents } = ctx;

  // A real offseason runs as a sequence of events. Free agency OPENS it on
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
  // The letter gets a beat of its own. It used to mark itself TRAINED, the beat
  // that hands out the training cards, so in any year the coach offered an A the
  // player was never shown a card at all: the stage was already spent by the
  // time the machine came back round to it.
  const FRESH = 0, CELEBRATED = 1, SUMMER_DONE = 2, LETTER = 3, TRAINED = 4, CAMP_DONE = 5;

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

  // ONCE-A-SUMMER WORK, MARKED AS DONE.
  //
  // The stage only moves when a beat finishes, and several beats return early
  // to show an event and then come back in. Anything gated on "the stage is
  // still FRESH" therefore ran again on every one of those returns. That is
  // how the new coach's meeting vanished from the recap: the event put its
  // result in the season's events, the summer came back in still at FRESH, and
  // the first thing FRESH does is empty the season's events. The same return
  // aged every room twice, rolled every coach's job twice, and handed out the
  // staying-with-your-club relationship bonus once per beat instead of once.
  //
  // Each of those is marked on the offseason when it has run, and the mark
  // travels with every stage change so a later beat cannot forget it.
  const marks = { ...(off.marks || {}) };
  const mark = (k) => {
    marks[k] = true;
    setPlayer(p => {
      const cur = p.offseason || off;
      return { ...p, offseason: { ...cur, marks: { ...(cur.marks || {}), [k]: true } } };
    });
  };
  const enterStage = (n) => setPlayer(p => ({
    ...p, offseason: { ...off, ...(p.offseason || {}), marks: { ...((p.offseason || off).marks || {}), ...marks }, stage: n }
  }));

  // Park the offseason on the player the moment the summer opens, before any
  // beat has run.
  //
  // Some beats leave the machine for a screen of their own and come back: the
  // combine and the draft do, and so does free agency. Those exits did not
  // persist anything, so the summer existed only as a local variable and the
  // player still had no offseason at all. Coming back therefore looked like a
  // brand new summer, the whole chain replayed from the top, and the training
  // beat ran a second time after the draft screen had already handed out a
  // card. That is the second preseason upgrade, with the rest of the summer's
  // events sitting in between the two.
  if (!player.offseason) setPlayer(p => ({ ...p, offseason: off }));

  // Camp needs these as well as the summer does, so they live out here.
  let currentTeam = player.team;
  let currentLeague = player.league;
  let updatedContract = player.contract ? { ...player.contract } : null;
  let isCurrentlyAmateur = safeJuniorLeagues.includes(currentLeague) || currentLeague === 'NCAA';

  const opening = done === FRESH && !marks.opened;
  if (opening) setSeasonEvents([]);

  // B1: Longevity Tick - Building chemistry by staying with the same org
  if (opening && player.seasonHistory && player.seasonHistory.length > 0) {
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

  // JULY 1. A deal paid partly as signing bonuses pays next season's lump now,
  // before anything else can happen to it, which is the whole point of asking
  // for one: a buyout later this summer cannot take it back.
  if (opening && (player.contract?.years || 0) > 0 && (player.contract?.sbShare || 0) > 0) {
    const lump = salaryParts(player.contract).bonus;
    if (lump > 0) {
      setPlayer(p => ({ ...p, stats: {
        ...p.stats,
        earnings: (p.stats?.earnings || 0) + lump,
        careerEarnings: (p.stats?.careerEarnings || p.stats?.earnings || 0) + lump
      } }));
      setSeasonEvents(prev => [...prev, {
        title: 'SIGNING BONUS',
        feedback: `Next season's signing bonus landed on July 1: ${formatMoney(lump)}.`,
        effect: { money: lump }
      }]);
    }
  }

  if (opening) mark('opened');

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
          successFeedback: 'The stories from those three days still go round the room. You will be close with these men for life.',
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

  // THE OTHER GOALTENDER.
  //
  // Two goalies on one club are the closest pair in the room and the only pair
  // whose interests are directly opposed: there is one net. recordSeason moves
  // his partner's trust against the split of starts every year, and this is
  // where it surfaces, once it has gone far enough to be a thing rather than a
  // mood. Nothing else in a dressing room works like this, which is why it is
  // the only relationship that gets its own event.
  if (player.pos === 'G' && !player.storylines?.netRift) {
    const myRoom = roomFor(player.rooms, player.team);
    const partner = goaliePartner(myRoom);
    if (partner && (partner.trust ?? 50) <= 28 && (partner.years || 0) >= 2) {
      setPlayer(p => ({ ...p, storylines: { ...p.storylines, netRift: true } }));
      setActiveEvent({
        title: '🥅 THE MAN AT THE OTHER END',
        desc: `You have taken the net off ${partner.name} for ${partner.years === 2 ? 'two years' : `${partner.years} years`} now, and he has spent them in a ball cap at the end of the bench. Goalies are supposed to be the closest two men in a room and you have not had a real conversation since training camp. His agent has been briefing reporters about a club that would actually play him.`,
        choices: [
          { label: 'Go and talk to him', subLabel: 'Say the thing nobody in the room wants to say out loud.', isRisky: false, feedback: 'You drove to his place in July and the two of you had it out over three hours. The depth chart stayed the same, and the two of you have been fine since.', effect: { fanStatus: 0, ovr: 0, rel: { teammates: 18 } } },
          { label: 'Let him have the net for a stretch', subLabel: 'Tell the coach to run him for a month and take the games back after.', isRisky: true, successChance: 0.5, successFeedback: 'He played six weeks, went 11-4, and signed his extension in March. He has told anyone who will listen whose idea it was.', successEffect: { fanStatus: 10, ovr: 0, rel: { teammates: 25, coach: -8 } }, failFeedback: 'He played six weeks and the coach liked what he saw rather more than you intended. You spent February earning your own net back.', failEffect: { fanStatus: -10, ovr: 0, rel: { coach: -12 } } },
          { label: 'It is a job', subLabel: 'He knew what it was when he signed. Say nothing.', isRisky: false, feedback: 'You said nothing. He was traded in November and did not shake your hand on the way out.', effect: { fanStatus: 0, ovr: 1, rel: { teammates: -20 } } }
        ],
        isOffseasonEvent: true
      });
      setScreen('event');
      return;
    }
  }

  // THE REHABILITATION.
  //
  // The first beat of the summer for a man whose year ended on a stretcher.
  // It used to fire in the post-season flow, which runs before the playoff
  // bracket, so the injury, the surgery and a whole offseason of recovery all
  // arrived in the same breath as the hit, and the playoffs came after them.
  // The arc advances itself, so coming back into the summer for the next beat
  // cannot show it twice and no stage of its own is needed.
  if ((player.storylines?.injury || 0) === 1) {
      setPlayer(p => ({ ...p, storylines: { ...p.storylines, injury: 2 } }));
      setActiveEvent({
          title: '🏥 THE REHABILITATION',
          desc: `The rehab has taken the whole summer. Your physios have given you two options: the team's standard recovery plan, which the club pays for, or an experimental treatment in Germany that you pay for yourself.`,
          choices: [
              { label: 'Experimental rehab ($100k)', subLabel: 'Fly to Germany and pay for the treatment yourself.', isRisky: true, successChance: 0.75, successFeedback: 'It worked. You came back feeling quicker and stronger than before the injury.', successEffect: { fanStatus: 20, ovr: 4, money: -100000 }, failFeedback: 'It did nothing. You lost the money and still feel a step slow.', failEffect: { fanStatus: 0, ovr: 1, money: -100000 } },
              { label: 'Standard rehab (free)', subLabel: 'Stick with the team\'s recovery program, no cost, no guarantees.', isRisky: false, feedback: 'You are cleared to play, and you have lost a step.', effect: { fanStatus: 0, ovr: 1, money: 0 } }
          ],
          isOffseasonEvent: true
      });
      setScreen('event');
      return;
  }

  // THE CITY TURNS ON ITS BEST PLAYER.
  //
  // A fanbase does not stay patient forever, and when it runs out it does not
  // pick the fourth-line centre. It picks the man on the biggest contract, and
  // once that has gone on long enough the front office stops being able to
  // ignore it. Toronto and Mitch Marner is the shape of it: years of the same
  // ending, the same name on the radio every morning, and eventually a club
  // that had no intention of moving him moving him anyway.
  //
  // What counts as a barren year is deliberately not "missed the playoffs". A
  // first-round exit is the thing that actually wears a city down, because it
  // keeps happening and keeps being described as progress. Twelve playoff
  // games is two rounds won: anything short of that is another spring of the
  // same conversation.
  // Rounds won, because that is what a city counts. Reaching a conference
  // final is a spring people remember fondly; anything short of it is the one
  // they argue about on the radio all summer. Games played would have been the
  // wrong measure twice over, since it cannot separate two sweeps from a long
  // first-round loss and it reads zero for a man who watched from the box.
  const sourYear = (s) => !s.titleWon && (s.playoffRounds || 0) < 2;
  let barrenYears = 0;
  const histForSour = player.seasonHistory || [];
  for (let i = histForSour.length - 1; i >= 0; i--) {
      const s = histForSour[i];
      if (s.league !== 'NHL' || s.team !== player.team || !sourYear(s)) break;
      barrenYears++;
  }

  const sourStage = player.storylines?.fanSour || 0;
  const sourYearNum = 2026 + (player.stats?.seasonsPlayed || 0);
  // The highest-paid man in the room, which is the one qualification that
  // matters here. Priced off the cap rather than a written figure so it still
  // means the same thing in 2048.
  const isTheGuy = player.league === 'NHL' && player.ovr >= 84
      && (player.contract?.salary || 0) >= capFor(sourYearNum) * 0.055;

  // A deep run buys the goodwill back, and so does a change of address. The
  // arc can run again somewhere else, from the beginning.
  if (sourStage > 0 && barrenYears === 0) {
      setPlayer(p => ({ ...p, storylines: { ...p.storylines, fanSour: 0 } }));
  }

  if (isTheGuy && sourStage === 0 && barrenYears >= 3) {
      setPlayer(p => ({ ...p, storylines: { ...p.storylines, fanSour: 1 } }));
      setActiveEvent({
          title: '📻 THE CITY HAS FOUND ITS NAME',
          desc: `${barrenYears} springs in a row now, and every one of them has ended the same way. The callers have stopped blaming the coach. They have your cap hit memorised, they have a shift of yours from a Tuesday in November on a loop, and for the first time there are people in this city who would rather watch somebody else wear your number.`,
          choices: [
              { label: 'Wear it', subLabel: 'Stand at your stall and say the losing is on you before anyone asks.', isRisky: false, feedback: 'You took it all on yourself in front of the cameras. The room will not forget that. The callers were back the next morning anyway.', effect: { fanStatus: -10, ovr: 0, rel: { teammates: 25, media: 20, coach: 10 } } },
              { label: 'Point at the roster', subLabel: 'Say out loud that one player cannot be the whole problem.', isRisky: true, successChance: 0.40, successFeedback: 'You said what everyone in that room was thinking, and the front office spent a week answering for it instead of you.', successEffect: { fanStatus: 25, ovr: 0, rel: { media: 10, coach: -25, teammates: -10 } }, failFeedback: 'It came out as a franchise player blaming his teammates. The clip ran for four days.', failEffect: { fanStatus: -70, ovr: -1, rel: { teammates: -35, media: -25 } } },
              { label: 'Say nothing', subLabel: 'Stop doing any media that is not mandatory and let it burn out.', isRisky: false, feedback: 'You went quiet. In this city silence reads as an admission, and the summer was long.', effect: { fanStatus: -35, ovr: 1, rel: { media: -20 } } }
          ],
          isOffseasonEvent: true
      });
      setScreen('event');
      return;
  }

  // A club can only be forced into trading a man it still has under contract.
  // With the deal expiring there is nothing to force: he walks in July and the
  // summer's own free agency is the story instead.
  // Four, not five. A top seed in this engine reaches its conference final
  // about three years in five, so five in a row at one club is a career that
  // never happens; the arc would have been written and never seen. Four is
  // rare for an elite club and perfectly ordinary for the one this story is
  // actually about: good enough to be there every April and not good enough
  // to do anything once it is.
  if (isTheGuy && sourStage === 1 && barrenYears >= 4 && (player.contract?.years || 0) >= 2) {
      const sourPool = (getOpponentPool('NHL') || []).filter(t => t.id !== player.team);
      const sourDest = sourPool[Math.floor(Math.random() * sourPool.length)] || { id: 'UNK', name: 'a club out west' };
      const sourDestName = getFullTeamName(sourDest.id, 'NHL') || sourDest.name;
      setPlayer(p => ({ ...p, storylines: { ...p.storylines, fanSour: 2 } }));
      setActiveEvent({
          title: '🧨 THE FRONT OFFICE HAS RUN OUT OF ROAD',
          desc: `The GM asked you to come in before the draft. He did not want to do this and he said so twice. But the building is half empty by the third period, the season-ticket renewals are the worst they have been in a decade, and ownership has decided that something has to visibly change. ${sourDestName} have an offer on the table and he is asking you to let it happen.`,
          choices: [
              { label: 'Let it happen', subLabel: `Waive your protection and report to ${sourDestName}.`, isRisky: false, feedback: `You signed off on it. The statement went out at nine the next morning and by lunchtime half the city was thanking you and the other half was arguing about who they just lost.`, effect: { fanStatus: -30, ovr: 0, rel: { media: 10, coach: -5 } }, action: 'TRADE_REQUEST_ACCEPTED', actionData: { teamObj: sourDest, lg: 'NHL' } },
              { label: 'Refuse', subLabel: 'You have the protection in your deal. Make them live with the room they built.', isRisky: true, successChance: 0.45, successFeedback: 'You told him no and then you went out and had the best year of your life. By Christmas they were chanting your name again.', successEffect: { fanStatus: 60, ovr: 2, rel: { coach: -15, teammates: 15 } }, failFeedback: 'You told him no, and the whole miserable business followed you into the season. The boos started in the home opener.', failEffect: { fanStatus: -90, ovr: -2, rel: { coach: -30, media: -20 } } }
          ],
          isOffseasonEvent: true
      });
      setScreen('event');
      return;
  }

  // THE BUYOUT.
  //
  // Late June, before the market opens. A club with a veteran it is paying far
  // more than he is now worth can buy out what is left of the deal: he gets two
  // thirds of the remaining salary (a third if he is under twenty-six), spread
  // over twice as many years, and he is a free agent on July 1. Signing bonuses
  // are not salary, so they are paid in full regardless, and a deal built out
  // of them is a deal a club rarely bothers to buy out. A no-movement clause
  // does not stop it; nothing in a contract does. Rolled once a summer.
  if (done < SUMMER_DONE && !marks.buyout) {
    mark('buyout');
    const c = player.contract || {};
    const yearsLeft = c.years || 0;
    const year = 2026 + (player.stats?.seasonsPlayed || 0);
    const eligible = player.league === 'NHL' && yearsLeft >= 1 && (c.salary || 0) >= 2500000
      && c.salary !== 925000 && !c.isScholarship && (player.age || 0) >= 28;
    if (eligible) {
      const fair = priceOf(recentForm(player).rate, year, { age: player.age, awards: majorCount(player) });
      const ratio = fair > 0 ? c.salary / fair : 0;
      const odds = Math.min(0.55, Math.max(0, (ratio - 1.6) * 0.35)) * (1 - 0.6 * (c.sbShare || 0));
      if (odds > 0 && Math.random() < odds) {
        const terms = buyoutTerms(c, player.age);
        const clubName = getFullTeamName(player.team, 'NHL');
        const bonusNote = (c.sbShare || 0) > 0
          ? ' Your signing bonuses are not part of it. Those are paid in full, on the dates in the contract.'
          : '';
        setActiveEvent({
          title: '✂️ BOUGHT OUT',
          desc: `The GM called the morning the buyout window opened. The ${clubName} are buying out the last ${yearsLeft === 1 ? 'year' : `${yearsLeft} years`} of your contract. You will be paid ${terms.fractionWord} of what was left, ${formatMoney(terms.perYear)} a year for the next ${terms.seasons} years, and on July 1 you are a free agent.${bonusNote}`,
          choices: [
            {
              label: 'Thank the fans and move on',
              subLabel: 'A short statement, then start taking calls from other clubs.',
              isRisky: false,
              feedback: 'You thanked the city in a short statement and spent the evening on the phone with your agent.',
              effect: { fanStatus: 10, ovr: 0, rel: { media: 5 } },
              action: 'BUYOUT', actionData: { team: player.team, ...terms }
            },
            {
              label: 'Say what you think of it',
              subLabel: 'Tell the reporters the club has given up on you, and train like it.',
              isRisky: false,
              feedback: 'You told the reporters exactly what you thought of the decision. It made the papers in every city you might sign in, and you have not trained this hard in years.',
              effect: { fanStatus: 0, ovr: 1, rel: { media: -15 } },
              action: 'BUYOUT', actionData: { team: player.team, ...terms }
            }
          ],
          isOffseasonEvent: true
        });
        setScreen('event');
        return;
      }
    }
  }

  // The rest of the summer runs once. The aging curve, the ELC slide and the
  // contract application all sit inside this block, so coming back for camp can
  // never age the player twice or slide his contract twice.
  if (done < SUMMER_DONE) {

  // THE SUMMER, AT EVERY CLUB HE KNOWS.
  //
  // Rooms age: a year on everybody, the worn-out ones gone, a replacement in
  // for whoever left, and the captaincy passed on if the captain was one of
  // them. Coaches survive the summer or do not, and a new one does not inherit
  // the old one's opinion, which is the entire reason a firing matters. A
  // player can spend two years being the wrong sort of player for the man
  // behind the bench and then watch that man replaced by somebody who likes
  // what he is. See utils/roster.js.
  if (!marks.clubs) {
  const summer = summerAtClubs(player, {
    strengthOf: (id) => teamStrengthOf(player.leagueState, id),
    barrenYears,
    fanPressure: isTheGuy && barrenYears >= 3
  });
  const myFiring = summer.fired.find(f => f.mine) || null;
  mark('clubs');
  // Who left his room and who passed him in it, for the recap.
  if (summer.news?.length) setSeasonEvents(prev => [...prev, ...summer.news]);
  setPlayer(p => {
    const next = { ...p, rooms: summer.rooms, coaches: summer.coaches };
    if (myFiring) {
      // A new voice, and a new opinion of him formed from scratch. The system
      // he plays decides most of where it starts.
      next.relationships = {
        ...(p.relationships || {}),
        coach: coachOpening(summer.coaches[p.team], playerArchetype(p))
      };
    }
    return next;
  });

  if (myFiring) {
    const incoming = summer.coaches[player.team];
    const sys = COACH_SYSTEMS[incoming?.system]?.label || 'Balanced';
    const mine = playerArchetype(player);
    const fits = incoming && COACH_SYSTEMS[incoming.system]?.likes.includes(mine);
    const clashes = incoming && COACH_SYSTEMS[incoming.system]?.dislikes.includes(mine);
    setActiveEvent({
      title: '📋 A NEW VOICE BEHIND THE BENCH',
      desc: `${myFiring.out} was let go on the first Monday of the summer. ${myFiring.in} has the job, and he arrives talking about a ${sys.toLowerCase()} game. `
        + (fits
            ? 'Everything he said in that first press conference described the way you already play.'
            : clashes
              ? 'Everything he said in that first press conference described a player who is not you.'
              : 'Nobody in the room knows yet what that means for them.'),
      choices: [
        { label: 'Go and see him', subLabel: 'Get in front of the new man before camp and find out where you stand.', isRisky: false, feedback: 'You went to the rink in July and sat in his office for an hour. Whatever else happens, he knows your name and what you want.', effect: { fanStatus: 0, ovr: 0, rel: { coach: 10 } } },
        { label: 'Wait for camp like everybody else', subLabel: 'Let the work do the talking in September.', isRisky: false, feedback: 'You stayed away all summer and turned up in September with everyone else.', effect: { fanStatus: 0, ovr: 1 } }
      ],
      isOffseasonEvent: true
    });
    setScreen('event');
    return;
  }
  }

  // VETERAN CAREER CROSSROADS
    if (player.age >= 37 || (player.age >= 34 && player.ovr < 76)) {
       const choices = [
         { label: 'Hang up the skates', subLabel: 'End your career on your own terms.', isRisky: false, feedback: 'You announced your retirement to a standing ovation.', effect: { fanStatus: 50, ovr: 0, money: 0 }, action: 'FORCE_RETIRE' }
       ];

       const hasContract = (player.contract?.years || 0) > 0;

       if (hasContract) {
           choices.push({ label: 'Play out current contract', subLabel: 'Honour the deal and give it one more year.', isRisky: false, feedback: 'You will play out the last year of your contract.', effect: { fanStatus: 10, ovr: -2, money: 0 } });
       } else {
           if (player.ovr >= 76 && player.league === 'NHL') {
               choices.push({ label: 'Push for one more NHL season', subLabel: 'Sign a short veteran extension to chase one more shot.', isRisky: false, feedback: 'You signed a one-year extension for one more run at it.', effect: { fanStatus: 10, ovr: -2, money: 0 }, action: 'VETERAN_EXTENSION' });
           } else if (player.ovr >= 68) {
               choices.push({ label: 'Attempt a comeback in the AHL', subLabel: 'Sign a two-way deal and grind it out for a shot back up.', isRisky: false, feedback: 'You signed a two-way deal to grind it out in the AHL.', effect: { fanStatus: 0, ovr: -1, money: 0 }, action: 'SIGN_TWILIGHT_AHL' });
           }
       }

       // Europe is for a player who is free to go. A man with years left on an
       // NHL contract cannot take a farewell tour in Finland: the club holds
       // him, and this used to be offered to him anyway, next to the option of
       // honouring the very deal it ignored.
       //
       // The floor used to be 60 OVR as well, which told a thirty-four-year-old
       // who had slipped to 58 that nowhere on the continent would have him.
       // Eight leagues over there sign former NHL players every summer and the
       // bottom few are not fussy. Any professional out of contract gets the
       // option; how good he still is decides which leagues ring, not whether
       // any of them do.
       const isPro = !['OHL', 'WHL', 'QMJHL', 'USHL', 'J20', 'U20', 'NCAA'].includes(player.league);
       if (isPro && !hasContract) {
           choices.push({ label: 'Sign a twilight contract in Europe', subLabel: 'Wind down your career overseas on a bigger ice surface.', isRisky: false, feedback: 'You signed in Europe for one last stretch. Less travel, bigger ice, and nobody asking about your cap hit.', effect: { fanStatus: 15, ovr: 0, money: 0 }, action: 'SIGN_TWILIGHT_EUROPE' });
       }

       if (choices.length === 1) {
           setScreen('retirement');
           return;
       }

       setActiveEvent({
         title: 'CAREER CROSSROADS',
         desc: `You are ${player.age} years old. The miles are adding up and the league keeps getting younger. Is this the year you stop?`,
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
            desc: `The ${fullTeamName} (${randomLg}) took you in the CHL Import Draft. They want you to leave Europe and play major junior in North America, on the smaller ice you would play on as a pro.`,
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

            const declineMsg = `You are not as quick as you were. Something went over the summer, and you felt it in the first week of skating.`;

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

    // A seventeen-year-old European the CHL wants is playing junior at home, in
    // J20 or U20, not in a men's professional league, so this has to look in
    // both places or the import draft never reaches the players it is for.
    const importHome = safeEuroLeagues.includes(currentLeague)
      || nordicJuniorLeagues.includes(currentLeague);
    if (player.age === 17 && importHome && Math.random() > 0.4) {
         const pool = ohlTeams || [];
         const chlTeam = pool[Math.floor(Math.random() * pool.length)];
         if (chlTeam) {
           setActiveEvent({
             title: 'CHL IMPORT DRAFT',
             desc: `The ${getFullTeamName(chlTeam, 'OHL')} took you in the CHL Import Draft. Will you leave Europe to play major junior in North America?`,
             choices: [
               { label: 'Move to Canada (join the OHL)', subLabel: 'Leave Europe to prepare for your draft year in the OHL.', isRisky: false, feedback: 'You packed your bags for North America to prepare for your draft year.', effect: { fanStatus: 5, ovr: 2, money: 0 }, action: 'JOIN_CHL', actionData: chlTeam.id },
               { label: 'Stay in Europe', subLabel: 'Stay close to home for now.', isRisky: false, feedback: 'You decided to stay close to home.', effect: { fanStatus: 0, ovr: 1, money: 0 } }
             ],
             isOffseasonEvent: true
           });
           enterStage(SUMMER_DONE);
           setScreen('event');
           return;
         }
    }

    // ==========================================
    // THE STEP UP TO THE MEN'S SIDE (J20 / U20)
    // ==========================================
    // A Swede or a Finn does not get drafted out of junior into a pro contract
    // the way a CHL player does. He plays up: the club's men's team takes him to
    // training camp, and either he holds a place in a professional league at
    // eighteen or he goes back down and dominates his age group for another
    // year. Both are real careers, so both are on offer, and the cost of going
    // up is ice time against men.
    if (nordicJuniorLeagues.includes(currentLeague) && player.age >= 17 && player.age <= 19
        && !player.storylines?.nordicStepUp) {
      const seniorLeague = JUNIOR_PARENT_LEAGUE[currentLeague];
      const rating = seasonRecap?.rating || 5;
      const ready = player.ovr >= 63 || rating >= 7.5;

      if (ready && seniorLeague) {
        // Where he steps up to.
        //
        // Most junior sides are the junior side of a men's club and he simply
        // moves up the corridor. Several are not: Djurgarden, AIK, Sodertalje,
        // Mora, Bjorkloven, Jokerit and Assat field a junior team in this game
        // and no senior one, which is true to life, and a player there signs
        // somewhere else when he turns professional. Stripping the tier off his
        // club id gave those players a phantom club named after the id.
        const juniorClub = getTeamData(player.team, currentLeague);
        const seniorPool = getOpponentPool(seniorLeague) || [];
        const seniorId = juniorClub?.seniorId
          || seniorPool[Math.floor(Math.random() * seniorPool.length)]?.id;
        if (!seniorId) return;
        const seniorClub = getTeamData(seniorId, seniorLeague);
        const seniorName = getFullTeamName(seniorClub, seniorLeague);
        const ownClub = !!juniorClub?.seniorId;

        setPlayer(p => ({ ...p, storylines: { ...p.storylines, nordicStepUp: true } }));
        setActiveEvent({
          title: '⬆️ THE MEN’S TEAM WANTS YOU AT CAMP',
          desc: ownClub
            ? `${seniorName} have asked for you in the senior squad. It is a professional league and you would be the youngest man in the room, playing against grown men for a place you are not guaranteed to keep.`
            : `Your club has no men's team, so the call came from somewhere else: ${seniorName} want you in their senior squad. It is a professional league and you would be the youngest man in the room, playing against grown men for a place you are not guaranteed to keep.`,
          choices: [
            {
              label: `Go up to ${seniorName}`,
              subLabel: `Take the place in ${seniorLeague} and fight men for your minutes.`,
              isRisky: false,
              feedback: `You signed with the senior side. Fourth line, hard minutes, and a locker room where nobody cares how good you were in junior.`,
              effect: { fanStatus: 25, ovr: 1, money: 0 },
              action: 'NORDIC_STEP_UP',
              actionData: seniorId
            },
            {
              label: 'Stay down another year',
              subLabel: 'Go back to the junior side and be the best player in the league.',
              isRisky: false,
              feedback: 'You stayed in junior. Top line, first unit, and the puck on your stick every shift.',
              effect: { fanStatus: 10, ovr: 2, money: 0 }
            }
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
               feedback: `You signed your Letter of Intent to play for ${t.name}.`,
               effect: { fanStatus: t.finalFans, ovr: t.finalOvr, money: t.finalMoney },
               action: 'JOIN_NCAA',
               actionData: t.id
           }));

           // THE OTHER ROUTE.
           //
           // A seventeen-year-old in the USHL is being recruited by college
           // programmes and major junior clubs at the same time, and that is
           // the actual decision of his career: four years and a degree, or
           // sixty-eight games a year and a bus. He was only ever shown one
           // side of it, so the choice was between college and nothing.
           if (currentLeague === 'USHL' && Math.random() < 0.6) {
             const chlPool = [
               ...(ohlTeams || []).map(t => ({ ...t, lg: 'OHL' })),
               ...(whlTeams || []).map(t => ({ ...t, lg: 'WHL' })),
               ...(qmjhlTeams || []).map(t => ({ ...t, lg: 'QMJHL' }))
             ].sort(() => 0.5 - Math.random()).slice(0, numOffers >= 3 ? 2 : 1);

             chlPool.forEach(t => {
               const { perks: cPerks, flaws: cFlaws } = rollOfferPerks(t.lg, { maxPerks: 2, maxFlaws: 2 });
               const tot = [...cPerks, ...cFlaws].reduce((acc, x) => ({
                 ovr: acc.ovr + (x.ovr || 0), fans: acc.fans + (x.fanStatus || 0), money: acc.money + (x.money || 0)
               }), { ovr: 0, fans: 0, money: 0 });
               choices.push({
                 label: `Report to ${getFullTeamName(t.id, t.lg)}`,
                 subLabel: `${t.lg} · a full junior schedule, and your college eligibility goes with it.`,
                 perks: cPerks,
                 flaws: cFlaws,
                 isRisky: false,
                 feedback: `You signed with ${getFullTeamName(t.id, t.lg)} and gave up your NCAA eligibility.`,
                 effect: { fanStatus: tot.fans + 10, ovr: Math.max(0, tot.ovr + 1), money: tot.money },
                 action: 'JOIN_CHL',
                 actionData: { id: t.id, league: t.lg }
               });
             });
           }

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
             title: choices.some(c => c.action === 'JOIN_CHL') ? 'THE RECRUITERS' : 'NCAA RECRUITMENT',
             desc: choices.some(c => c.action === 'JOIN_CHL')
                ? `Your play in ${leagueWithArticle(currentLeague)} has brought both kinds of recruiter to the rink. College programmes are offering scholarships; major junior clubs are offering a roster spot and a sixty-eight game season. Taking the second closes the first for good.`
                : numOffers > 1
                  ? `Your stellar play in ${leagueWithArticle(currentLeague)} has college coaches calling. Some programmes come with nothing but upside, and some come with baggage. Read the fine print.`
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
    // You cannot play J20 or U20 past twenty either.
    const amateurAgeOut = ['OHL', 'WHL', 'QMJHL', 'J20', 'U20'].includes(currentLeague) ? 21 : 22;
    const ncaaSeasons = (player.seasonHistory || []).filter(s => s.league === 'NCAA').length;
    const isNcaaAgedOut = currentLeague === 'NCAA' && ncaaSeasons >= 4;

    // A player is draft eligible if they are 18 or older, but haven't aged out of amateur eligibility
    const isDraftEligibleAge = player.age >= 18 && player.age < amateurAgeOut && !isNcaaAgedOut;

    // A SIGNED PROFESSIONAL IS NOT IN THE DRAFT.
    //
    // A player whose club declined to sign him, who aged out of junior and
    // then signed in the Slovak Extraliga, walked out of the signing screen
    // and straight back into the draft, in the same summer, without having
    // played a game. The gate only asked whether anybody held his rights,
    // and nobody did any more, so a European league counted as an amateur
    // route all over again. Having a professional contract now ends it.
    if (isDraftEligibleAge && !hasSignedDeal
        && (isCurrentlyAmateur || safeEuroLeagues.includes(currentLeague)) && !player.rights) {
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
                       { label: `Sign ELC with ${teamName}`, subLabel: 'Turn pro immediately on your entry-level deal.', isRisky: false, feedback: 'You signed your entry-level contract and are heading to pro camp.', effect: { fanStatus: 10, ovr: 0, money: 0 }, action: 'SIGN_ELC' },
                       { label: 'Test free agency', subLabel: 'Let your rights expire and look for a better opportunity elsewhere.', isRisky: false, feedback: 'You let your draft rights expire to test the open market.', effect: { fanStatus: -5, ovr: 0, money: 0 }, action: 'BECOME_UFA' }
                   ],
                   isOffseasonEvent: true
               });
           } else {
               setActiveEvent({
                   title: 'RIGHTS EXPIRED',
                   desc: `Your development window has closed. The ${teamName} have decided not to offer you a contract. Your draft rights have expired and you are now an Unrestricted Free Agent.`,
                   choices: [
                       { label: 'Enter free agency', subLabel: 'Look for a team willing to take a chance on you.', isRisky: false, feedback: 'Time to find a pro team that believes in you.', effect: { fanStatus: 0, ovr: 0, money: 0 }, action: 'BECOME_UFA' }
                   ],
                   isOffseasonEvent: true
               });
           }
       } else {
           setActiveEvent({
               title: 'AMATEUR GRADUATION',
               desc: `You have aged out of amateur hockey as an undrafted free agent. It's time to see if any pro teams are interested in signing you.`,
               choices: [
                   { label: 'Enter free agency', subLabel: 'Try to catch on with a pro team as an undrafted free agent.', isRisky: false, feedback: 'You are looking for your first pro contract.', effect: { fanStatus: 0, ovr: 0, money: 0 }, action: 'BECOME_UFA' }
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
               { label: 'Sign your entry-level contract', subLabel: 'Turn pro now and report to NHL training camp.', isRisky: false, feedback: 'You signed your entry-level contract and are off to your first NHL training camp.', effect: { fanStatus: 10, ovr: 0, money: 0 }, action: 'SIGN_ELC' },
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
              desc: `A local car dealership wants you for a TV commercial. It is easy money, and your teammates will never let you hear the end of it.`,
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
              desc: `An equipment brand wants you as the face of its new stick. That means a long photo shoot and a summer of media days.`,
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

      // The SIGNATURE ATHLETE event stood here: at 700 fan status it offered a
      // signature skate line with one choice and no downside, worth 150 fan
      // status and $2.5M for a single click. It existed to reward fame and it
      // mostly just shoved a player over the line into the top tier at exactly
      // the point the tiers are supposed to start asking for silverware.

// ==========================================
      // RANDOM CAREER TRAJECTORY EVENTS (3% Chance)
      // ==========================================
      const eventRoll = Math.random();

      // LATE BLOOMER BREAKOUT
      if (currentLeague === 'NHL' && player.age >= 22 && player.age <= 28 && eventRoll < 0.03 && !player.storylines?.hadBreakout) {
          setPlayer(p => ({ ...p, storylines: { ...p.storylines, hadBreakout: true } }));
          setActiveEvent({
              title: '🔥 LATE BLOOMER BREAKOUT',
              desc: `Something clicked over the summer. The game has slowed down, you feel strong, and you are running the informal scrimmages. The papers are predicting a breakout year.`,
              choices: [
                  { label: 'Embrace the spotlight', subLabel: 'Lean into the hype for a bigger immediate boost.', isRisky: false, feedback: 'You told everyone who asked that this is your year.', effect: { fanStatus: 50, ovr: 4, money: 0 } },
                  { label: 'Keep your head down', subLabel: 'Stay humble and let your game do the talking.', isRisky: false, feedback: 'You kept quiet and got on with it.', effect: { fanStatus: 10, ovr: 5, money: 0 } }
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
              desc: `You spent the summer enjoying the money and not training. You turned up to camp out of shape, and people are calling last season a fluke.`,
              choices: [
                  { label: 'Ignore the haters', subLabel: 'Save the money, but your game stays sluggish.', isRisky: false, feedback: 'You brushed off the media, and your game still looks sluggish.', effect: { fanStatus: -20, ovr: -3, money: 0 } },
                  { label: 'Hire a private trainer ($250k)', subLabel: 'Spend to get back in shape and limit the damage.', isRisky: false, feedback: 'It cost a fortune, and you got most of the way back.', effect: { fanStatus: 10, ovr: -1, money: -250000 } }
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
  // "already has a contract" branch, so a free-agency year skipped it.
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
  // It also ignored whether the room is yours, which is what decides it. A
  // player who was traded, claimed or signed somewhere new in the summer does
  // not walk into a strange dressing room wearing a letter, however good he is,
  // so the club has to be one he actually played a season for.
  if (done < LETTER && !player.isCaptain && !player.isAlternate && !player.storylines?.alternateGiven) {
    const hist = player.seasonHistory || [];
    const lastSeason = hist[hist.length - 1];
    const sameRoom = lastSeason?.team === player.team && (lastSeason?.games || 0) >= 30;
    const trust = player.relationships?.coach || 50;
    const proSeasons = player.stats?.seasonsPlayed || 0;

    // A good year in front of the people voting on it helps; a bad one does not
    // rule it out, because a letter is about the room, not the scoresheet.
    const earnedIt = (lastSeason?.rating || 0) >= 7.0 || lastSeason?.titleWon || (player.fanStatus || 0) >= 500;
    // A club that drafted a generational talent is building the room around
    // him and the letter follows sooner, which is what every organisation
    // that has ever had one actually does. It is not a free pass: he still
    // has to have the coach, the room and a season in it behind him, and the
    // two-year head start is what the status is worth.
    const gen = !!player.isGenerational;
    const base = trust >= 80 ? 0.45 : trust >= 70 ? 0.30 : 0.18;
    const odds = gen ? Math.min(0.80, base * 1.75) : base;
    const minSeasons = gen ? 1 : 3;

    if (player.league === 'NHL' && proSeasons >= minSeasons && trust >= 65 && player.ovr >= 82
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
      enterStage(LETTER);
      setScreen('event');
      return;
    }
  }

  if (done < TRAINED) {
    enterStage(TRAINED);
    // A draft year, or joining a junior club or a college programme, hands out
    // the training card on its own screen before the summer has finished. That
    // sets trainingGiven, and this beat then steps aside rather than offering a
    // second card once the rest of the summer has played out.
    if (!off.trainingGiven) {
      if (ctx.generateTraining) ctx.generateTraining(player.pos, player);
      setScreen('preseason');
      return;
    }
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
    const isHoldingOut = updatedContract?.role === 'Holdout';

    // A captain's first camp wearing the C is a milestone and always fires. After
    // that it is occasional: an eight-year captain should not get the identical
    // camp eight times, he should mostly get the veteran camp instead.
    const firstCaptainCamp = !player.storylines?.hadCaptainCamp;
    const isCaptainCamp = player.isCaptain && (firstCaptainCamp || Math.random() < 0.3);

    if (isHoldingOut) {
        ctx.setActiveEvent({
            title: '🛑 RFA HOLDOUT',
            desc: `You refused to sign your Qualifying Offer and are holding out of training camp for a big extension ($${(updatedContract?.salary || 0).toLocaleString()}/yr). Every day you stay away, the front office gets angrier and the coverage gets worse.`,
            choices: [
                {
                    label: 'Hold the line',
                    subLabel: 'Refuse to report until they meet your exact asking price.',
                    isRisky: true,
                    successChance: 0.4,
                    successFeedback: 'The GM caved. You got your extension and reported to camp as the highest-paid player on the roster.',
                    successEffect: { fanStatus: 20, ovr: 0, rel: { coach: -10, media: 20 } },
                    failFeedback: 'The GM refused to budge and publicly called you selfish. You were forced to sign the baseline 1-year Qualifying Offer just to play this year.',
                    failEffect: { fanStatus: -40, ovr: -2, rel: { coach: -40, teammates: -20 } },
                    action: 'RESOLVE_HOLDOUT',
                    actionData: { success: true }
                },
                {
                    label: 'Cave and sign the QO',
                    subLabel: 'End the holdout, apologize, and accept a 1-year Qualifying Offer to get back on the ice.',
                    isRisky: false,
                    feedback: 'You folded and signed the 1-year Qualifying Offer. The holdout was for nothing, and the coach is furious you missed camp.',
                    effect: { fanStatus: -15, ovr: -1, rel: { coach: -25, teammates: -10 } },
                    action: 'RESOLVE_HOLDOUT',
                    actionData: { success: false }
                }
            ],
            isOffseasonEvent: true
        });
        enterStage(CAMP_DONE);
        ctx.setScreen('event');
        return;
    }

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
                  feedback: 'A quiet first professional camp. The staff noticed you were the player who asked the most questions.',
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
            desc: `You arrive at camp as one of the core players for the ${player.league} season. The coaches know what you bring, and the rookies are watching how you go about it.`,
            choices: [
                {
                  label: 'Pace yourself',
                  subLabel: 'Play it safe to stay fresh for opening night, and avoid a reckless injury.',
                  isRisky: false,
                  feedback: 'You got through camp without a scratch and were fresh for opening night.',
                  effect: { fanStatus: 10, ovr: 0 }
                },
                {
                  label: 'Dominate scrimmages',
                  subLabel: 'Push hard to set the tone, at some injury risk.',
                  isRisky: true,
                  successChance: 0.75,
                  successFeedback: 'Nobody could handle you in camp, and the papers are calling for a career year.',
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
            campDesc = 'Camp has opened with two goalies and one starting job, and you are one of the two.';
            riskyLabel = 'Battle for the Starting Job';
            riskySubLabel = 'Push hard to win the starting net outright.';
            riskySuccess = 'You outplayed him in camp and won the starting job.';
            riskyFail = 'You let in too many soft goals during scrimmages. The coach named you the backup.';
            safeLabel = 'Accept Backup Duty';
            safeSubLabel = 'Settle into a steady backup role without the pressure.';
            safeFeedback = 'You played a quiet, mistake-free camp and accepted the backup role behind the veteran.';
        } else if (['LD', 'RD'].includes(player.pos)) {
            campTitle = '⛺ BLUE LINE BATTLE';
            campDesc = 'Training camp has opened, and there is an open spot in the top-4 defensive pairings. You are locked in a fierce battle for those crucial minutes.';
            riskyLabel = 'Battle for a Top-4 Spot';
            riskySubLabel = 'Push hard to crack the top-4 pairing.';
            riskySuccess = 'You were the best defenceman in camp and earned a top-four spot.';
            riskyFail = 'You got burned a few times in scrimmages. The coach bumped you down to the bottom pairing.';
            safeLabel = 'Accept a Bottom-Pairing Role';
            safeSubLabel = 'Settle into a safer bottom-pairing role.';
            safeFeedback = 'You played a quiet, mistake-free camp and slotted into a safe, third-pairing role.';
        } else {
            campTitle = '⛺ TRAINING CAMP BATTLE';
            campDesc = 'Training camp has opened, and the coach is looking for someone to step up into a top-6 scoring role. You are locked in a fierce roster battle.';
            riskyLabel = 'Battle for a Top-6 Spot';
            riskySubLabel = 'Push hard to crack the top-6 lineup.';
            riskySuccess = 'You clicked with the top-six forwards in camp and earned a place among them.';
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