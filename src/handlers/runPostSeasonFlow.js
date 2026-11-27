// Extracted from App.jsx.
// Takes an `ctx` object with the state, setters, and other handlers it needs.
import { getOpponentPool, getPrimaryRival, inIihfEvents, isAmateurLeague } from '../data/teams';
import { lastTitle } from '../utils/titles';
import { eventDeck } from '../data/economy';
import { getJournalistsForLeague, getFullTeamName } from '../utils/appHelpers';
import { selectPressQuestions } from '../data/pressQuestions';
import { checkPlayoffs } from './checkPlayoffs';
import { isDefence } from '../utils/production';
import { buildRun } from '../utils/intlRun';
import { grudgeAgainst, nhlSeasonsOf, onNhlContract } from '../utils/gameHelpers';
import { parentOf } from '../utils/rosterMoves';
import { boyhoodLine, boyhoodShortlist } from '../utils/boyhood';
import { seasonYear } from '../utils/season';

export function runPostSeasonFlow(ctx, pAge, pOvr, currentLg, currentTeam, madePlayoffs, nextYear, standings, opts = {}) {
  const { player, playoffs, setActiveEvent, setActivePress, setMinigameContext, setPendingPlayoffs, setPlayer, setScreen, triggerMinigame } = ctx;

    // Whether he is watching this postseason from the press box. A man whose
    // season ended in December still has a club in the playoffs, and the run
    // has to be simulated without him rather than skipped: the bracket is the
    // only thing that tells him how the year he missed finished.
    const sidelined = !!opts.sidelined;

    setPendingPlayoffs(madePlayoffs ? { lg: currentLg, team: currentTeam, standings, sidelined } : null);

    // OUT FOR THE SEASON. Everything below is something that happens to a
    // player who's playing: a rivalry night, a minigame, a press conference
    // after a game, a storyline in the room. A man in a brace since December
    // went straight from the injury screen into one of them. He goes to the
    // playoffs his club is in, or to the recap.
    if (sidelined) {
      if (madePlayoffs) checkPlayoffs(ctx, currentLg, currentTeam, standings, { sidelined });
      else setScreen('recap');
      return;
    }

    // THE TEAM HE GREW UP CHEERING FOR. Asked once, in his first season,
    // before anything else the year has in store. See utils/boyhood.js.
    if (!player.boyhoodTeam && !player.storylines?.boyhoodAsked && (player.age || 16) <= 17) {
        const shortlist = boyhoodShortlist(player);
        if (shortlist.length) {
            setPlayer(p => ({ ...p, storylines: { ...(p.storylines || {}), boyhoodAsked: true } }));
            setActiveEvent({
                title: '🛏️ THE POSTER ON YOUR WALL',
                desc: `A reporter from the local paper is writing about the league's youngest players, and she asks you the question every one of them gets: which NHL team did you grow up cheering for?`,
                choices: shortlist.map((id) => {
                    const name = getFullTeamName(id, 'NHL');
                    return {
                        label: `The ${name}`,
                        subLabel: boyhoodLine(id, player.nat),
                        isRisky: false,
                        feedback: `You told her it was the ${name}, and it ran under your photo the next morning.`,
                        effect: { fanStatus: 5, ovr: 0, money: 0 },
                        action: 'SET_BOYHOOD_TEAM',
                        actionData: id
                    };
                }),
                isSeasonEvent: true,
                madePlayoffs
            });
            setScreen('event');
            return;
        }
    }

    // ==========================================
    // STORYLINE 1: THE MEDIA NEMESIS
    // ==========================================
    const nemesisStage = player.storylines?.mediaNemesis || 0;
    
    
    // Organic Trigger: Bad media relations early in career

    // STAGE 1: THE HIT PIECE
    if (nemesisStage === 1 && Math.random() < 0.5) {
        setPlayer(p => ({ ...p, storylines: { ...p.storylines, mediaNemesis: 2 } }));
        setActiveEvent({
            title: '📰 THE HIT PIECE',
            desc: `${player.nemesisName || 'A local columnist'}, the city's loudest shock-jock, has written a hit piece on you. He called you selfish, lazy and a cancer in the room, and everybody in town has read it.`,
            choices: [
                { label: 'Take the high road', subLabel: 'Stay quiet and let your play speak for itself.', isRisky: false, feedback: 'You didn\'t take the bait. Your coach liked that, and the fans wanted you to fight back.', effect: { fanStatus: -15, ovr: 1, rel: { coach: 15, media: 5 } } },
                { label: 'Declare war', subLabel: 'Fire back publicly and make this personal.', isRisky: true, successChance: 0.5, successFeedback: 'You called him a hack in public and backed it up on the ice. The fans loved every minute.', successEffect: { fanStatus: 40, ovr: 1, rel: { media: -20, teammates: 10 } }, failFeedback: 'You sounded rattled and defensive, and he posted "I rest my case" before you had left the building.', failEffect: { fanStatus: -30, ovr: -1, rel: { media: -30 } } }
            ],
            madePlayoffs
        });
        setScreen('event');
        return;
    }

    // STAGE 2: THE LOCKER ROOM CONFRONTATION
    if (nemesisStage === 2 && !madePlayoffs && Math.random() < 0.4) {
        setPlayer(p => ({ ...p, storylines: { ...p.storylines, mediaNemesis: 3 } }));
        setActiveEvent({
            title: '🎤 THE AMBUSH',
            desc: `After a bad loss, ${player.nemesisName} pushes his way to your stall and asks you, on camera, whether you actually work hard.`,
            choices: [
                { label: 'Walk away', subLabel: 'Avoid the confrontation, even if it looks bad on camera.', isRisky: false, feedback: 'You walked away mid-question. It looks bad on TV, but you avoided a fine.', effect: { fanStatus: -10, ovr: 0, rel: { media: -15 } } },
                { label: 'Put him in his place', subLabel: 'Fire back on camera and risk a fine if it goes too far.', isRisky: true, successChance: (pOvr >= 85 ? 0.7 : 0.3), successFeedback: 'You took his hockey knowledge apart one question at a time, on live TV. The clip is still going round.', successEffect: { fanStatus: 50, ovr: 1, money: 10000, rel: { media: 20 } }, failFeedback: 'You lost your temper and swore at him on camera. The league fined you, and the clip ran for days.', failEffect: { fanStatus: -40, ovr: -1, money: -50000, rel: { media: -40 } } }
            ],
            madePlayoffs
        });
        setScreen('event');
        return;
    }

    // STAGE 3: VINDICATION
    if (nemesisStage === 3 && currentLg === 'NHL' && playoffs?.overallStatus === 'won_cup') {
        setPlayer(p => ({ ...p, storylines: { ...p.storylines, mediaNemesis: 4 } })); // Ends arc
        setActiveEvent({
            title: '🏆 THE ULTIMATE VINDICATION',
            desc: `You have just won the Cup. At the post-game press conference you spot ${player.nemesisName} at the back of the room, not writing anything.`,
            choices: [
                { label: 'Call him out publicly', isRisky: false, feedback: 'You looked straight at him and asked, "What are you going to write tomorrow?" The room laughed, and he left before the next question.', effect: { fanStatus: 100, ovr: 1, rel: { media: 30 } } }
            ],
            madePlayoffs
        });
        setScreen('event');
        return;
    }

    // ==========================================
    // STORYLINE 1.5: THE FRANCHISE DUO
    // ==========================================
    let duoStage = player.storylines?.franchiseDuo || 0;
    const teammateTrust = player.relationships?.teammates ?? 50;

    // The duo belongs to the club it formed at. Asking him to defer salary
    // for "your best friend on the team" made no sense after he'd been traded
    // away from that friend, twice in one case. Once he's left, the arc is
    // over, and a new one can start at the new club. Older saves never
    // recorded the club, so for those he has to have stayed put for the last
    // two seasons.
    if (duoStage === 1) {
        const home = player.storylines?.duoTeam;
        const recent = (player.seasonHistory || []).slice(-2);
        const stayed = home
            ? home === currentTeam
            : recent.length > 0 && recent.every(s => s.team === currentTeam && !s.tradedTo);
        if (!stayed) {
            setPlayer(p => ({ ...p, storylines: { ...p.storylines, franchiseDuo: 0, duoTeam: null } }));
            // Not this summer, though: a new duo needs a season together first.
            duoStage = -1;
        }
    }

    // Organic Trigger: Good teammate relations early in NHL career
    if (duoStage === 0 && player.pos !== 'G' && currentLg === 'NHL' && teammateTrust > 75 && nhlSeasonsOf(player) >= 1 && Math.random() < 0.15) {
        setPlayer(p => ({ 
            ...p, 
            storylines: { ...p.storylines, franchiseDuo: 1, duoTeam: currentTeam },
            duoName: 'your linemate'
        }));
        setActiveEvent({
            title: '🤝 THE DYNAMIC DUO',
            desc: `You and a young linemate know where the other one is without looking. The fans have given the two of you a nickname, and you're rarely seen apart, on the ice or off it.`,
            choices: [
                { label: 'Embrace the brotherhood', isRisky: false, feedback: 'The two of you drive this team, and everybody on the ice with you plays better for it.', effect: { fanStatus: 30, ovr: 1, rel: { teammates: 25 } } }
            ],
            madePlayoffs
        });
        setScreen('event');
        return;
    }

    // STAGE 2: THE CAP CASUALTY 
    if (duoStage === 1 && player.age > 24 && Math.random() < 0.25) {
        setPlayer(p => ({ ...p, storylines: { ...p.storylines, franchiseDuo: 2 } }));
        setActiveEvent({
            title: '💼 THE BUSINESS OF HOCKEY',
            desc: `Your best friend on the team is entering a contract year. The GM pulls you aside and says they can't afford to keep both of you under the salary cap unless you agree to restructure your own contract and defer a large part of your salary.`,
            choices: [
                { label: 'Restructure and defer salary', subLabel: 'Give up millions of your own money to keep your friend around.', isRisky: false, feedback: 'You deferred millions to keep the two of you together, and the fans won\'t forget it.', effect: { fanStatus: 100, ovr: 1, money: -2500000, rel: { teammates: 50, coach: 20 } } },
                { label: 'Keep your contract intact', subLabel: 'Let business be business, even if it costs the friendship.', isRisky: false, feedback: 'You told the GM hockey is a business. Your friend was traded the next day, the room went quiet, and you have rarely felt so alone in it.', effect: { fanStatus: -50, ovr: -2, money: 0, rel: { teammates: -40 } } }
            ],
            madePlayoffs
        });
        setScreen('event');
        return;
    }
    
       
    // The leadership group moved to the start of the season, in
    // advanceToOffseason, where a letter is actually handed out. It used to fire
    // here at the end of a year while saying "this season".
    
    // ==========================================
    // STORYLINE 2: LOCKER ROOM POLITICS
    // ==========================================
    const lockerStage = player.storylines?.lockerRoom || 0;
    const coachTrust = player.relationships?.coach ?? 50;

    // STAGE 1: THE CLASH (Triggered organically early in an NHL career)
    if (lockerStage === 0 && player.pos !== 'G' && currentLg === 'NHL' && nhlSeasonsOf(player) < 3 && Math.random() < 0.15) {
        setPlayer(p => ({ ...p, storylines: { ...p.storylines, lockerRoom: 1 } }));
        setActiveEvent({
            title: '👴 THE OLD GUARD',
            desc: `You have walked into a room run by a veteran captain and an old-school coach who can't stand flashy rookies. They want you to keep your head down, dump it in and chase.`,
            choices: [
                { label: 'Buy in', subLabel: 'Dump and chase on command, even if it bores the crowd.', isRisky: false, feedback: 'You dumped it in and finished your checks. The coach nodded, and the crowd was bored stiff.', effect: { fanStatus: -15, ovr: 0, rel: { coach: 25, teammates: 10 } } },
                { label: 'Play your game', subLabel: 'Stick to your flashy instincts and risk the coach\'s wrath.', isRisky: true, successChance: 0.5, successFeedback: 'You pulled a toe-drag and scored. The crowd went wild, and the coach had to bite his tongue.', successEffect: { fanStatus: 30, ovr: 1, money: 0, rel: { coach: -10 } }, failFeedback: 'You turned the puck over at the blue line. The coach stapled you to the bench for the rest of the period.', failEffect: { fanStatus: -15, ovr: -1, rel: { coach: -25, teammates: -10 } } }
            ],
            madePlayoffs
        });
        setScreen('event');
        return;
    }

    // Captains are made out of alternates. A club hands the C to a man who has
    // already worn a letter and shown what he does with it; handing it to
    // someone who never has happens, but it is rare enough that it should feel
    // like the exception rather than the normal route into the job.
    const woreTheA = !!player.isAlternate
      || (player.seasonHistory || []).some(s => s.isAlternate || s.isCaptain);
    const wearsOrWoreTheA = woreTheA || Math.random() < 0.08;

    // STAGE 2 / 3: THE RESOLUTION
    if (lockerStage === 1 && currentLg === 'NHL') {
        if (coachTrust <= 30 && pOvr >= 80) {
            // RESOLUTION A: THE ULTIMATUM (You are too good, but the coach hates you)
            setPlayer(p => ({ ...p, storylines: { ...p.storylines, lockerRoom: 2 } })); // Ends arc
            
            let pool = (getOpponentPool('NHL') || []).filter(t => t.id !== currentTeam);
            if (pool.length === 0) pool = [{ id: 'UNK', name: 'Unknown Team' }];
            const destTeam = pool[Math.floor(Math.random() * pool.length)];

            setActiveEvent({
                title: '⚡ LOCKER ROOM MUTINY',
                desc: `You and the coach aren't speaking, and your numbers are too good to bench. The GM calls you in to settle it.`,
                choices: [
                    { label: 'Demand the coach is fired', subLabel: 'Use your leverage to push the coach out, at the risk of suspension.', isRisky: true, successChance: 0.6, successFeedback: 'The GM sided with you. The coach was fired the next morning, and the room is yours.', successEffect: { fanStatus: 20, ovr: 1, rel: { coach: 50, teammates: 20 } }, failFeedback: 'The GM wouldn\'t let a player run the team, and suspended you for insubordination.', failEffect: { fanStatus: -25, ovr: -1, money: -50000, rel: { coach: -20, teammates: -20 } } },
                    // Left as a plain choice on purpose: this is a fork between two very
                    // different decisions, not a comparison of destinations, so a full team
                    // card here would tower over the other choice. The subLabel names the
                    // destination instead, which was only revealed after choosing.
                    { label: 'Demand a trade', subLabel: `Ask out and start fresh with the ${destTeam.name}.`, isRisky: false, feedback: `You told the GM you want out. Within a day you had been traded to ${destTeam.name}.`, effect: { fanStatus: -15, ovr: 0, rel: { coach: 10 } }, action: 'ACCEPT_TRADE_DEADLINE', actionData: { teamObj: destTeam, lg: 'NHL', teamStandings: 12, madePlayoffs: true } }
                ],
                madePlayoffs
            });
            setScreen('event');
            return;
        } else if (coachTrust >= 80 && pAge >= 21 && wearsOrWoreTheA) {
            // RESOLUTION B: PASSING THE TORCH (You earned their respect)
            setPlayer(p => ({ ...p, storylines: { ...p.storylines, lockerRoom: 2 } })); // Ends arc
            setActiveEvent({
                title: '👑 PASSING THE TORCH',
                desc: `You bought into the system and earned the old guard's respect. The captain has announced his retirement and told the press the "C" should go to you.`,
                choices: [
                    { label: 'Accept the captaincy', isRisky: false, feedback: 'You\'re the captain now.', effect: { fanStatus: 100, ovr: 2, rel: { coach: 20, teammates: 20 } }, action: 'MAKE_CAPTAIN' }
                ],
                madePlayoffs
            });
            setScreen('event');
            return;
        }
    }

    // ==========================================
    // STORYLINE 3: THE HOMETOWN SAVIOR BURDEN
    // ==========================================
    const hometownStage = player.storylines?.hometown || 0;

    // STAGE 1: THE HONEYMOON (Drafted or developed into a highly-rated savior)
    // A fifty-year drought is not something you tell a player who lifted the
    // thing himself three seasons ago in this building.
    const wonHere = (player.seasonHistory || []).some(s => s.titleWon && s.team === currentTeam);
    // This city's own wait.
    //
    // Every club in the league was handed the same "50-year championship
    // drought", whether it had won two seasons ago or never. The save now
    // keeps a record of who won what and when, so the club in front of him
    // has its own history, and a club that is not actually waiting for
    // anything does not get the storyline at all.
    const nowYear = seasonYear(player);
    const drought = lastTitle(player.titleLedger, currentTeam, nowYear, currentLg);
    const realDrought = drought.never || (drought.gap ?? 0) >= 12;
    const cityName = getFullTeamName(currentTeam, currentLg);
    if (hometownStage === 0 && currentLg === 'NHL' && pOvr >= 78 && !wonHere && realDrought && Math.random() < 0.12) {
        setPlayer(p => ({ ...p, storylines: { ...p.storylines, hometown: 1 } }));
        setActiveEvent({
            title: '🏙️ THE SAVIOR ARRIVES',
            desc: drought.never
              ? `The ${cityName} have never won a championship, and the city has stopped pretending it doesn't think about it. The media and the fans have decided you're the one who ends it. They expect a great deal, and they already love you.`
              : `The ${cityName} haven't won since ${drought.year}, ${drought.gap} years of it now, and the city wears every one of them. The media and the fans have decided you're the one who ends it. They expect a great deal, and they already love you.`,
            choices: [
                { label: 'Embrace the pressure', subLabel: 'Publicly commit to winning a championship for this city.', isRisky: false, feedback: 'You told the press you\'re here to win a Cup. The city is ready to run through a brick wall for you.', effect: { fanStatus: 50, ovr: 1, money: 0 } },
                { label: 'Downplay the hype', subLabel: 'Manage expectations instead of making bold promises.', isRisky: true, successChance: 0.5, successFeedback: 'You kept expectations down, the media stayed calm, and the fans still liked what they heard.', successEffect: { fanStatus: 20, ovr: 0, rel: { media: 20 } }, failFeedback: 'The media accused you of lacking confidence. They wanted a promise and didn\'t get one.', failEffect: { fanStatus: -15, ovr: 0, rel: { media: -20 } } }
            ],
            madePlayoffs
        });
        setScreen('event');
        return;
    }

    // A Cup here ends the story. The city wanted one and got it, and nobody on
    // talk radio asks a Cup winner whether he can carry the franchise.
    if ((hometownStage === 1 || hometownStage === 2) && wonHere) {
        setPlayer(p => ({ ...p, storylines: { ...p.storylines, hometown: 3 } }));
    }

    // STAGE 2: THE SLUMP (Failing to deliver a deep run)
    if (hometownStage === 1 && !wonHere && currentLg === 'NHL' && !madePlayoffs && Math.random() < 0.5) {
        setPlayer(p => ({ ...p, storylines: { ...p.storylines, hometown: 2 } }));
        setActiveEvent({
            title: '📉 THE HONEYMOON IS OVER',
            desc: `Another season has ended without a parade. The local coverage has turned nasty, and talk radio is asking whether you can carry this franchise at all.`,
            choices: [
                { label: 'Ignore the noise', subLabel: 'Stay silent and keep your focus on the gym and the ice.', isRisky: false, feedback: 'You stayed off social media and hit the gym. The fans are still mad, but you kept your focus.', effect: { fanStatus: -30, ovr: 1, rel: { media: -10 } } },
                { label: 'Call out the critics', subLabel: 'Push back publicly and risk it blowing up in your face.', isRisky: true, successChance: 0.4, successFeedback: 'You stood up for your team in public, and the diehards loved you for it.', successEffect: { fanStatus: 25, ovr: 0, rel: { teammates: 15 } }, failFeedback: 'It backfired. The media tore into you for making excuses.', failEffect: { fanStatus: -50, ovr: -1, rel: { media: -30 } } }
            ],
            madePlayoffs
        });
        setScreen('event');
        return;
    }

    // STAGE 3: THE BREAKING POINT
    if (hometownStage === 2 && !wonHere && currentLg === 'NHL' && Math.random() < 0.4) {
        setPlayer(p => ({ ...p, storylines: { ...p.storylines, hometown: 3 } })); // End arc
        
        // A warm, low-pressure market, as the story says: the Sun Belt and the
        // West Coast, not another hockey capital. It used to be any club at
        // all, and the event never said which until the button did.
        const WARM = ['CAR', 'FLA', 'TBL', 'DAL', 'NSH', 'ANA', 'LAK', 'SJS', 'VGK', 'UTA'];
        const others = (getOpponentPool('NHL') || []).filter(t => t.id !== currentTeam);
        let pool = others.filter(t => WARM.includes(t.id));
        if (pool.length === 0) pool = others;
        if (pool.length === 0) pool = [{ id: 'UNK', name: 'Unknown Team' }];
        const destTeam = pool[Math.floor(Math.random() * pool.length)];
        const destName = getFullTeamName(destTeam.id, 'NHL');

        setActiveEvent({
            title: '🧳 THE BREAKING POINT',
            desc: `The season is over, and the **${destName}** have made you an off-the-books promise: let them trade for you, and they'll pay you a fortune to get away from all this. Warm weather, half-empty press rooms, and nobody waiting for you at the airport.`,
            choices: [
                { label: 'Stay and fight', subLabel: 'Pledge your loyalty to the city, for better or worse.', isRisky: true, successChance: 0.5, successFeedback: 'You told the city you\'re staying. The fans were in tears, and you won\'t pay for a drink here again.', successEffect: { fanStatus: 150, ovr: 2, rel: { teammates: 20 } }, failFeedback: 'You stayed, and the coverage is wearing away how much you enjoy playing.', failEffect: { fanStatus: 10, ovr: -2, rel: { media: -10 } } },
                // The club's own card, as every trade offer in an event gets, so
                // the club trying to lure him is a crest and a name rather than
                // a line of grey text in a button. The fortune goes on it too.
                { label: 'Take the money and escape', subLabel: `Take the money and leave for the ${destName}.`, isRisky: false, feedback: `You left for the ${destName}. You're rich and relaxed, and back home they're burning your jersey.`, effect: { fanStatus: -150, ovr: 0, money: 2500000 },
                  perks: [{ name: 'Paid to leave', effect: '+$2.5M' }],
                  action: 'ACCEPT_TRADE_DEADLINE', actionData: { teamObj: destTeam, lg: 'NHL', teamStandings: 8, madePlayoffs: true, showTeamCard: true, keepMarket: true } }
            ],
            madePlayoffs
        });
        setScreen('event');
        return;
    }

    // ==========================================
    // STORYLINE 4: THE DEVASTATING INJURY
    // ==========================================
    const injuryStage = player.storylines?.injury || 0;

    // STAGE 2: THE REHAB used to sit here, and here is before the playoffs.
    // The injury fires in December now, so this fired in the same handful of
    // seconds: stretchered off, then a summer of rehabilitation, then a
    // bracket. It lives in advanceToOffseason, which is the actual summer and
    // runs after the post-season has been played out.

    // STAGE 3: THE COMEBACK / REVENGE
    //
    // This used to be a coin flip with no deadline on it: lose the flip and
    // the arc sat at stage two indefinitely, trying again every summer until
    // it landed. The player could be three years and two leagues removed and
    // still be told it was his first game back against the man who did it.
    // The grudge now has a shelf life, and it has to be played out in the
    // league it happened in. Miss the window and the arc simply closes.
    const seasonsSince = (player.stats?.seasonsPlayed || 0) - (player.storylines?.injurySeason ?? -99);
    const sameWorld = !player.storylines?.injuryLeague || player.storylines.injuryLeague === currentLg;
    if (injuryStage === 2 && (seasonsSince > 2 || !sameWorld)) {
        setPlayer(p => ({ ...p, storylines: { ...p.storylines, injury: 3 } }));
    } else if (injuryStage === 2 && Math.random() < 0.5) {
        setPlayer(p => ({ ...p, storylines: { ...p.storylines, injury: 3 } })); // Ends arc
        setActiveEvent({
            title: '🩸 BAD BLOOD',
            desc: `It's your first game against the enforcer who tore your ACL last year. The crowd knows it, and so does everyone on the ice.`,
            choices: [
                { label: 'Drop the gloves', subLabel: 'Settle the score physically for the hit that ended your season.', isRisky: true, successChance: (pOvr >= 75 ? 0.6 : 0.3), successFeedback: 'You beat the brakes off him, and the building lost its mind.', successEffect: { fanStatus: 75, ovr: 1, rel: { teammates: 30, coach: -10 } }, failFeedback: 'He got the better of you again. You left the ice with a black eye and a bruised ego.', failEffect: { fanStatus: -15, ovr: 0, rel: { teammates: -10, coach: -15 } } },
                { label: 'Scoreboard revenge', subLabel: 'Let your game do the talking instead of your fists.', isRisky: true, successChance: (player.hockeyIQ >= 70 ? 0.7 : 0.4), successFeedback: 'You beat him one-on-one and scored the winner.', successEffect: { fanStatus: 40, ovr: 1, rel: { coach: 20 } }, failFeedback: 'You tried to force a play on him and turned it over. The coach wasn\'t happy.', failEffect: { fanStatus: -10, ovr: -1, rel: { coach: -15 } } }
            ],
            madePlayoffs
        });
        setScreen('event');
        return;
    }

// ==========================================
    // STORYLINE 5: THE POSITIONAL LOGJAM (Centers Only)
    // ==========================================
    if (!player.storylines?.positionChange && player.pos === 'C' && ['NHL', 'AHL', 'SHL', 'LIIGA'].includes(currentLg) && Math.random() < 0.15) {
        setPlayer(p => ({ ...p, storylines: { ...p.storylines, positionChange: 1 } }));
        setActiveEvent({
            title: '🔄 ROSTER LOGJAM',
            desc: `Your team is deep down the middle and thin on the wings. The head coach pulls you aside and asks you to move to the wing permanently to balance the lines.`,
            choices: [
                {
                    label: 'Accept the move',
                    subLabel: 'Put the team first and learn a new position on the fly.',
                    isRisky: false,
                    feedback: 'You moved to the wing. The coach appreciated it, and you spent a month learning the position on the fly.',
                    effect: { fanStatus: 10, ovr: -1, rel: { coach: 25 } },
                    action: 'CHANGE_POSITION',
                    actionData: Math.random() > 0.5 ? 'LW' : 'RW'
                },
                {
                    label: 'Refuse',
                    subLabel: 'Stand your ground and insist you belong at centre.',
                    isRisky: true,
                    successChance: 0.5,
                    successFeedback: 'You stood your ground and showed you\'re the best centre on the roster. The coach moved a veteran to the wing instead.',
                    successEffect: { fanStatus: 15, ovr: 1, rel: { coach: 10 } },
                    failFeedback: 'You flat out refused the coach\'s request. He benched you for the third period to teach you a lesson about being a team player.',
                    failEffect: { fanStatus: -10, ovr: -1, rel: { coach: -30 } }
                }
            ],
            madePlayoffs
        });
        setScreen('event');
        return;
    }
    // ==========================================
    // STORYLINE 6: THE AHL MENTOR (AHL Lifers)
    // ==========================================
    if (!player.storylines?.ahlMentor && player.pos !== 'G' && currentLg === 'AHL' && pAge >= 26 && Math.random() < 0.20) {
        setPlayer(p => ({ ...p, storylines: { ...p.storylines, ahlMentor: 1 } }));
        setActiveEvent({
            title: '🎓 THE VETERAN PRESENCE',
            desc: `The NHL club has sent its big 18-year-old draft pick to the AHL, and the GM has asked you to centre his line and teach him how to be a professional.`,
            choices: [
                {
                    label: 'Take him under your wing',
                    subLabel: 'Mentor the kid, even though he might be your eventual replacement.',
                    isRisky: false,
                    feedback: 'You spent the season looking after him on the ice and teaching him off it. The organisation noticed.',
                    effect: { fanStatus: 20, ovr: 0, money: 25000, rel: { coach: 30, teammates: 15 } }
                },
                {
                    label: 'Refuse',
                    subLabel: 'Freeze him out rather than help groom your own replacement.',
                    isRisky: true,
                    successChance: 0.5,
                    successFeedback: 'You stopped passing to him and outplayed him all year. Nobody doubts who the better player is, for now.',
                    successEffect: { fanStatus: 10, ovr: 2, rel: { coach: -10 } },
                    failFeedback: 'You froze him out and he scored anyway. The GM was furious and benched you.',
                    failEffect: { fanStatus: -15, ovr: -2, rel: { coach: -40, teammates: -20 } }
                }
            ],
            madePlayoffs
        });
        setScreen('event');
        return;
    }

    // ==========================================
    // STORYLINE 7: THE EMERGENCY CALL-UP
    // ==========================================
    // The last week of the NHL season, not the start of the next one. He used
    // to be moved to the NHL on the spot, without his club changing, so the
    // playoffs that followed were his AHL club's and a Calder Cup won there
    // was recapped as a Stanley Cup. He plays the games, goes back down, and
    // what he earns is a better look at camp. Only an NHL contract can be
    // called up: an AHL deal is with the AHL club alone.
    const callupParent = currentLg === 'AHL' ? parentOf(currentTeam) : null;
    if (!player.storylines?.emergencyCallup && player.pos !== 'G' && callupParent && onNhlContract(player)
        && pAge >= 24 && coachTrust >= 60 && Math.random() < 0.15) {
        const parentName = getFullTeamName(callupParent.id, 'NHL');
        const backDown = madePlayoffs
          ? 'When their season ended you were sent back down for the AHL playoffs.'
          : 'When their season ended you were sent back down.';
        setPlayer(p => ({ ...p, storylines: { ...p.storylines, emergencyCallup: 1 } }));
        setActiveEvent({
            title: '🚨 THE EMERGENCY CALL-UP',
            desc: `The ${parentName} lost three players to injury in one night with a week of the season left. Your AHL coach knocks on your hotel door at 2 AM. "Pack your bags. You're playing in the NHL tomorrow night."`,
            choices: [
                {
                    label: 'Play a safe, grinding game',
                    subLabel: 'Keep it simple and let reliability make the case for you.',
                    isRisky: false,
                    feedback: `You played eight clean minutes a night without a mistake. ${backDown} The coach told you there'll be a real chance for you at camp.`,
                    effect: { fanStatus: 25, ovr: 2, rel: { coach: 20 } },
                    action: 'EARN_PROMOTION'
                },
                {
                    label: 'Try to be the hero',
                    subLabel: 'Force the moment and make them remember your name.',
                    isRisky: true,
                    successChance: (pOvr >= 72 ? 0.4 : 0.15),
                    successFeedback: `You jumped into the rush and scored the winner, and the building chanted your name. ${backDown} The coach told you to plan on starting next season in the NHL.`,
                    successEffect: { fanStatus: 75, ovr: 4, money: 50000, rel: { coach: 15 } },
                    successAction: 'EARN_PROMOTION',
                    failFeedback: `You tried to do too much and turned the puck over for the game-losing goal. You were on a flight back to the AHL the next morning.`,
                    failEffect: { fanStatus: -10, ovr: -1, rel: { coach: -20 } }
                }
            ],
            madePlayoffs
        });
        setScreen('event');
        return;
    }
    
    // Track dynamic IIHF Divisions for Olympic/WC Eligibility
    const playerNatData = ctx.safeNationalities.find(n => n.id === player.nat) || { tier: 4, division: 'Division I-B', id: player.nat, name: 'Unknown' };
    const activeNatDiv = player.natDiv || playerNatData.division;

    // THE WORLD CHAMPIONSHIP (May)
    // The only tournament that genuinely belongs after the season. The World
    // Juniors are played in late December and the Olympics in February, and both
    // now run inside the season where they happen; they used to be played here in
    // the summer alongside this one, months out of place.
    //
    // You go to the Worlds because your club season is already over. A player
    // still in the playoffs is unavailable, so the tournament fills up with
    // players whose teams missed or went out early.
    if (pAge > 19 && pOvr >= 78 && !madePlayoffs && inIihfEvents(player.nat)) {
       const isTopDiv = activeNatDiv === 'Top Division';
       // A top-division federation can pick from a deep pool, so a borderline
       // player is less certain of a call than one from a smaller nation.
       const playWorlds = isTopDiv ? Math.random() > 0.45 : Math.random() > 0.2;

       if (playWorlds) {
          const run = buildRun({
            player, safeNationalities: ctx.safeNationalities,
            context: 'worlds', division: activeNatDiv, year: nextYear
          });
          setPlayer(p => ({ ...p, intlRun: run, isOlympicYear: false }));
          setMinigameContext('worlds');
          setScreen('intl-tournament');
          return;
       }
    }

    // THE NIGHT AGAINST THE CLUB THAT LET HIM GO.
    //
    // The club that traded him away, or the one that drafted him and that he
    // never played for or left. Nothing marked those nights: they were a game
    // like any other, and only the playoffs knew about an old club, and only
    // one he'd played three seasons for. A trade this season is near certain
    // to come up (he'll have played them by the spring); an older one, or a
    // club that drafted him, comes up now and then, and no club more than
    // twice in a career.
    {
      const seasonNo = player.stats?.seasonsPlayed || 0;
      const seen = player.storylines?.returnGames || {};
      const recentTrades = (player.tradedAwayBy || [])
        .filter(t => (t.league || 'NHL') === currentLg && seasonNo - (t.season ?? -99) <= 3);
      const clubs = [
        ...recentTrades.slice().reverse().map(t => ({ id: t.team, kind: 'traded', thisYear: t.season === seasonNo })),
        ...(currentLg === 'NHL' && player.draftTeam ? [{ id: player.draftTeam, kind: 'drafted', thisYear: false }] : [])
      ].filter((c, i, all) => c.id && all.findIndex(x => x.id === c.id) === i
        && grudgeAgainst(player, c.id, currentLg) && (seen[c.id] || 0) < 2);
      const club = clubs[0];
      const odds = !club ? 0 : club.thisYear ? 0.8 : club.kind === 'traded' ? 0.3 : 0.15;
      if (club && Math.random() < odds) {
        const name = getFullTeamName(club.id, currentLg);
        const isG = player.pos === 'G';
        const isD = isDefence(player.pos);
        const pick = (g, d, f) => (isG ? g : isD ? d : f);
        setPlayer(p => ({ ...p, storylines: { ...(p.storylines || {}), returnGames: { ...(p.storylines?.returnGames || {}), [club.id]: (seen[club.id] || 0) + 1 } } }));
        const desc = club.kind === 'drafted'
          ? `The **${name}** drafted you, and then they let you go. Tonight you play them, and the scouts who sat at their table on draft night are in the press box.`
          : club.thisYear
            ? `It's your first game against the **${name}** since they traded you. Half their room still has your number in their phones, and the general manager who made the deal is watching from the press box.`
            : `The **${name}** are on the schedule tonight, the club that traded you away. The fans who used to cheer for you have had a while to decide how they feel about it.`;
        const who = club.kind === 'drafted' ? 'the club that drafted you' : 'the club that traded you';
        setActiveEvent({
          title: club.kind === 'drafted' ? '🎯 THE CLUB THAT DRAFTED YOU' : '🔁 THE CLUB THAT TRADED YOU',
          desc,
          choices: [
            {
              label: 'Make them regret it',
              subLabel: 'Put this one on your shoulders.',
              isRisky: true,
              successChance: 0.5,
              successFeedback: pick(
                `You stopped 38 of 39, and the ${name} left the building beaten by ${who}.`,
                `You shut down their top line all night and set up the winner, and the ${name} left beaten by ${who}.`,
                `You scored twice and you won, and the ${name} had to watch ${who} beat them.`),
              successEffect: { fanStatus: 30, ovr: 1, money: 0 },
              failFeedback: pick(
                `You were trying too hard and it showed. They scored four on you, and they lost no sleep over the trade.`,
                `You chased the big play all night, got caught twice, and they won.`,
                `You pressed all night, missed the net every time it mattered, and they won.`),
              failEffect: { fanStatus: -10, ovr: 0, money: 0 }
            },
            {
              label: 'Just another game',
              subLabel: 'Play your game and let the result say it.',
              isRisky: false,
              feedback: `You kept it simple and the team won. You didn't celebrate any more than usual, which said plenty.`,
              effect: { fanStatus: 10, ovr: 1, money: 0 }
            },
            {
              label: 'Say something before the game',
              subLabel: 'Give the reporters the line they want.',
              isRisky: true,
              successChance: 0.45,
              successFeedback: `You told the reporters you had a point to prove, then beat the ${name} and proved it. That clip was everywhere by morning.`,
              successEffect: { fanStatus: 35, ovr: 0, money: 0, rel: { media: 5 } },
              failFeedback: `You told the reporters you had a point to prove, and then the ${name} beat you. Their fans haven't stopped quoting you.`,
              failEffect: { fanStatus: -20, ovr: 0, money: 0, rel: { media: -10 } }
            }
          ],
          isSeasonEvent: true,
          isDemotionEvent: false,
          madePlayoffs
        });
        setScreen('event');
        return;
      }
    }

    const rivalObj = getPrimaryRival(currentTeam, currentLg);
    if (rivalObj && Math.random() < 0.35) {
      const rivalName = getFullTeamName(rivalObj.id, currentLg);
      const isGoalie = player.pos === 'G';
      const isDman = isDefence(player.pos);

      // Rivalry night split two ways, goalie or not, so every one of these
      // lines was written for a forward and handed to a defenceman: he was
      // told to fly down the wing on his first shift, to toe-drag their
      // defender, and to relentlessly chirp their defence, which is the half
      // of the other team he spends the night playing against. say() picks the
      // line for the position; where the forward's line is true of a
      // defenceman too, the middle slot is left null and he gets it.
      // A fourth slot, for a centre.
      //
      // This had three branches and the game has five field positions, so one
      // forward line was doing for a centre, a left winger and a right winger
      // alike: the man taking every draw against their best centre was told he
      // had flown down the wing. A centre's night is a different night, so
      // where the sentence changes he gets his own; where it does not, he
      // falls through to the forward line the way he always did.
      const isCentre = player.pos === 'C';
      const say = (g, d, f, c = null) =>
        isGoalie ? g
          : isDman && d != null ? d
          : isCentre && c != null ? c
          : f;

      const fullChoicesPool = [
        {
          label: say('Guarantee a Shutout', null, 'Run Your Mouth to the Press'),
          subLabel: 'A lot of new fans, or a lot of embarrassment.',
          isRisky: true,
          successChance: 0.45,
          successFeedback: say(
            'You stood on your head and shut them out. The building went mad, and your jersey sold out overnight.',
            'You backed up every word by shutting their top line out for sixty minutes. The building went mad, and your jersey sold out overnight.',
            'You backed up every word with a multi-point night. The building went mad, and your jersey sold out overnight.'),
          successEffect: { fanStatus: 35, ovr: 1, money: 15000 },
          failFeedback: say(
            'You let in four on the first twelve shots, and their fans haven\'t stopped posting about it.',
            'Their top line scored twice with you on the ice, and their fans haven\'t stopped posting about it.',
            'They shut you down completely, and their fans haven\'t stopped posting about it.'),
          failEffect: { fanStatus: -25, ovr: 0, money: 0 }
        },
        {
          label: 'Lead by example',
          subLabel: 'A steady team game the fans always like.',
          isRisky: false,
          feedback: say(
            'You played a calm game in net, and the team ground out the win.',
            'You played a hard, simple game on the back end, and the team ground out the win.',
            'You played a disciplined, hard game, and the team ground out the win.'),
          effect: { fanStatus: 15, ovr: 1, money: 0 }
        },
        {
          label: say('Aggressive Crease Control', null, 'Set the Physical Tone'),
          subLabel: 'Play on the edge for sixty minutes.',
          isRisky: true,
          successChance: 0.65,
          successFeedback: say(
            'You came out to meet every shooter and kept robbing their top line with the glove until they stopped trying.',
            null,
            'You hit everything in the first period, their top line got rattled, and the crowd came alive.'),
          successEffect: { fanStatus: 20, ovr: 1, money: 0 },
          failFeedback: say(
            'You came too far out of the net and gave them an easy goal.',
            null,
            'You took an undisciplined double-minor penalty in the 3rd period that led to the game-winning goal.'),
          failEffect: { fanStatus: -15, ovr: -1, money: 0 }
        },
        {
          label: say('Stare Down Their Top Sniper', 'Shadow Their Top Line All Night',
            'Target Their Star Player', 'Take Every Draw Against Their Best Centre'),
          subLabel: 'Take their best player out of the game.',
          isRisky: true,
          successChance: 0.55,
          successFeedback: say(
            `You robbed their star on a breakaway, and he spent the rest of the night slamming his stick.`,
            `You drew the matchup against their best line and they finished the night without a shot on goal between them.`,
            `You shadowed their star all night, shut him down, and drew two penalties off him.`,
            `You took every draw against him and won most of them. His line spent the night starting in their own end.`),
          successEffect: { fanStatus: 25, ovr: 1, money: 0 },
          failFeedback: say(
            `Their star beat you clean top-shelf twice in the 1st period.`,
            `Their star went wide on you twice and finished both. The coach shortened your night after the second.`,
            `Their star went around you for a highlight-reel goal.`,
            `He beat you clean on the draw all night, and two of those possessions ended up behind your goalie.`),
          failEffect: { fanStatus: -15, ovr: 0, money: 0 }
        },
        {
          label: 'Deliver a fiery pre-game speech',
          subLabel: 'Fire up the room before puck drop.',
          isRisky: false,
          feedback: `The room was dead quiet while you talked, and they went out for warm-up like they meant it.`,
          effect: { fanStatus: 10, ovr: 1, money: 0 }
        },
        {
          label: say('Slash Anyone Entering Your Crease', null, 'Agitate Their Bench Between Whistles'),
          subLabel: 'Get under their skin early.',
          isRisky: true,
          successChance: 0.60,
          successFeedback: `You got into their heads. Two of their best players were thrown out for retaliating.`,
          successEffect: { fanStatus: 20, ovr: 0, money: 5000 },
          failFeedback: `The referees weren't having it. You got called for unsportsmanlike conduct and put your team on a penalty kill.`,
          failEffect: { fanStatus: -10, ovr: -1, money: -5000 }
        },
        {
          label: 'Pump up the home crowd early',
          subLabel: 'Get the building going before the anthem.',
          isRisky: false,
          feedback: `You waved your arms at the crowd before puck drop, and the noise didn't let up all night.`,
          effect: { fanStatus: 20, ovr: 0, money: 0 }
        },
        {
          label: 'Obsess over video tape',
          subLabel: 'Learn their system better than they know it.',
          isRisky: false,
          feedback: `The film paid off. You knew their breakouts before they ran them.`,
          effect: { fanStatus: 5, ovr: 2, money: 0 }
        },
        {
          label: say('Flashy Glove Saves', 'Jump Into the Rush and Pinch Hard', 'Attempt a Highlight-Reel Move'),
          subLabel: 'Go for the highlight everyone shares.',
          isRisky: true,
          successChance: 0.50,
          successFeedback: say(
            `You made a windmill glove save, and it led SportsCenter that night.`,
            `You jumped the rush from your own blue line, walked the far-side defender and buried it. It led SportsCenter that night.`,
            `You toe-dragged around their defenceman and picked the corner. It led SportsCenter that night.`),
          successEffect: { fanStatus: 30, ovr: 0, money: 10000 },
          failFeedback: say(
            `You tried to show off on a routine shot and knocked it into your own net.`,
            `You pinched with nobody behind you and they went up the ice two-on-none. That one is on the tape forever.`,
            `You coughed up the puck trying to pull off a move and caused a breakaway goal against.`),
          failEffect: { fanStatus: -20, ovr: 0, money: 0 }
        },
        {
          label: say('Aggressively Play the Puck Behind Net', null, 'Pledge to Block Every Shot'),
          subLabel: 'Put your body on the line.',
          isRisky: true,
          successChance: 0.60,
          successFeedback: say(
            `Your first passes out of the zone sent them up the ice on three odd-man rushes.`,
            null,
            `You blocked three slapshots in the third period, and the win held.`),
          successEffect: { fanStatus: 25, ovr: 1, money: 0 },
          failFeedback: say(
            `You misread the bounce off the glass and left them an empty net.`,
            null,
            `You blocked a shot, but limped off the ice in pain and missed the last shifts of the game.`),
          failEffect: { fanStatus: -10, ovr: -1, money: 0 }
        },
        {
          label: say('Get Involved in a Line Scrum', null, 'Drop the Gloves Early'),
          subLabel: 'An old-school rivalry fight.',
          isRisky: true,
          successChance: 0.55,
          successFeedback: `You won the fight clearly, and the building was loud for the rest of the night.`,
          successEffect: { fanStatus: 30, ovr: 0, money: 0 },
          failFeedback: `You took a heavy punch, lost your helmet, and spent 5 minutes in the box while your team conceded.`,
          failEffect: { fanStatus: -15, ovr: -1, money: 0 }
        },
        {
          label: 'Ice-cold systems hockey',
          subLabel: 'Stay disciplined and play the system.',
          isRisky: false,
          feedback: `They ran around trying to hit everything, and you just played the game plan.`,
          effect: { fanStatus: 10, ovr: 1, money: 0 }
        },
        {
          label: say('Aggressive Poke-Checks', 'Step Up at the Line First Shift',
            'Fly Down the Wing First Shift', 'Win the Opening Draw Clean'),
          subLabel: 'Win every race to the puck.',
          isRisky: true,
          successChance: 0.65,
          successFeedback: say(
            `You poke-checked two breakaways clean.`,
            `You stepped up at the line on shift one, ended the rush with a clean hip check and sent it back the other way.`,
            `You went past their defenceman on your first shift and buried a wrist shot.`,
            `You won the opening draw back clean and your side had the puck in their end before anyone had touched it twice.`),
          successEffect: { fanStatus: 20, ovr: 1, money: 0 },
          failFeedback: say(
            `You missed the poke-check and got deked out of your skates.`,
            `You guessed wrong at the line, they went by you with speed, and it was in the net eight seconds into your night.`,
            `You got hit hard along the boards on your first shift and lost your momentum.`,
            `You got thrown out of the circle on the opening draw and watched your winger lose the puck taking it for you.`),
          failEffect: { fanStatus: -10, ovr: 0, money: 0 }
        },
        {
          label: say('Relentlessly Chirp Their Forwards', 'Relentlessly Chirp Their Forwards', 'Relentlessly Chirp Their Defense'),
          subLabel: 'Talk your way into their heads.',
          isRisky: true,
          successChance: 0.50,
          successFeedback: `By the second period their players were arguing with each other on the bench.`,
          successEffect: { fanStatus: 15, ovr: 1, money: 0 },
          failFeedback: `They laughed it off and scored on their next two power plays.`,
          failEffect: { fanStatus: -15, ovr: 0, money: 0 }
        },
        {
          label: 'Anchor team composure',
          subLabel: 'Keep the emotions out of it.',
          isRisky: false,
          feedback: `The second period got wild, and you were the one who settled everyone down.`,
          effect: { fanStatus: 15, ovr: 1, money: 0 }
        },
        {
          label: say('Stack the Pads in Traffic', null, 'Demand Double-Shifts Late'),
          subLabel: 'Put the game on your stick.',
          isRisky: true,
          successChance: 0.50,
          successFeedback: say(
            `You stacked the pads like it was 1995, and the save sealed the win.`,
            `You played 31 minutes, never came off for the last five, and they didn't get a puck past you.`,
            `You played 28 minutes and scored the winner.`),
          successEffect: { fanStatus: 35, ovr: 1, money: 15000 },
          failFeedback: say(
            `Stacking the pads left the top half of the net wide open. High shot, easy goal.`,
            null,
            `You got completely gassed in the 3rd period and turned the puck over for the game-winner against.`),
          failEffect: { fanStatus: -20, ovr: -1, money: 0 }
        }
      ];

      const selectedChoices = [...fullChoicesPool].sort(() => 0.5 - Math.random()).slice(0, 3);

      setActiveEvent({
        title: `🔥 RIVALRY NIGHT: VS THE ${rivalName.toUpperCase()}`,
        desc: `Rivalry night against ${rivalName}. The building is sold out, the game is on national television, and the fans want this one badly. How do you play it?`,
        choices: selectedChoices,
        isSeasonEvent: true,
        isDemotionEvent: false,
        madePlayoffs
      });
      setScreen('event');
      return;
    }

    if (Math.random() < 0.65) {
      const eventRoll = Math.random();
    
    // A5: Fixed Frequency. 35% chance dedicated to Press Conferences.
    if (eventRoll < 0.35) {
        // Which questions can be asked here is decided in pressQuestions.js,
        // where a question carries the leagues and the positions it makes sense
        // for. Filtering on goalie-or-skater alone is what put a trade deadline
        // question in front of a college player who cannot be traded.
        const shuffledQ = selectPressQuestions(player, currentLg);

        const validReporters = getJournalistsForLeague(currentLg);
        const shuffledJ = [...validReporters].sort(() => 0.5 - Math.random()).slice(0, 3);
        setActivePress({ journalists: shuffledJ, questions: shuffledQ, currentQ: 0, answers: [] });
        setScreen('press');
    } else if (eventRoll < 0.65) { 
        triggerMinigame('season');
    } else {
        setMinigameContext('season');
        let deck = eventDeck || [];
        
        // RULE: USA Hockey does not trade players around the USHL
        if (player.team === 'NTDP') {
            deck = deck.filter(e => !(e.choices || []).some(c => c.action === 'ACCEPT_TRADE_DEADLINE' || c.action === 'TRADE_HOLDOUT'));
        }

        // The deck's own tags. minAge and proOnly were written on the cards
        // and never read, so a sixteen-year-old could be offered a Vegas trip
        // and a junior an endorsement deal.
        const pro = !isAmateurLeague(currentLg);
        deck = deck.filter(e => (!e.minAge || (player.age || 0) >= e.minAge) && (!e.proOnly || pro));
        // A captain isn't in a captaincy vote.
        if (player.isCaptain) deck = deck.filter(e => e.title !== 'The Captaincy Vote');

        if (deck.length > 0) {
           let randomEvt = deck[Math.floor(Math.random() * deck.length)];
           // The vote as it looks to a veteran. A thirty-year-old isn't asked to
           // step aside for an older man; he's the older man, and the other name
           // on the ballot is the kid.
           if (randomEvt.title === 'The Captaincy Vote' && (player.age || 0) >= 30) {
             randomEvt = {
               ...randomEvt,
               desc: 'The captain has retired and the room is choosing his replacement. It\'s between you and a young star the club has built its plans around.',
               choices: [
                 { label: 'Put your name forward', subLabel: "You've been here longest. Ask the room for it.", isRisky: true, successChance: 0.6,
                   successFeedback: 'You won the vote. The room wanted the man who has seen it all.', successEffect: { fanStatus: 25, ovr: 0, rel: { teammates: 10 } }, successAction: 'MAKE_CAPTAIN',
                   failFeedback: 'The room went with the kid. You were the first to shake his hand.', failEffect: { fanStatus: 0, ovr: 0, rel: { teammates: 5 } } },
                 { label: 'Back the kid', subLabel: 'Tell the coaches he is ready, and stay in his corner.', isRisky: false,
                   feedback: 'You told the coaches he was ready. He asked you to keep the stall next to his.', effect: { fanStatus: 10, ovr: 0, rel: { teammates: 15, coach: 5 } } }
               ]
             };
           }
           // The derby against the club's actual rival, by name.
           if (randomEvt.title === 'The Derby' && rivalObj) {
             randomEvt = { ...randomEvt, desc: randomEvt.desc.replace("It's derby night.", `It's derby night against ${getFullTeamName(rivalObj.id, currentLg)}.`) };
           }
           setActiveEvent({ ...randomEvt, isDemotionEvent: false, madePlayoffs: madePlayoffs });
           setScreen('event');
        } else {
           if (madePlayoffs) checkPlayoffs(ctx, currentLg, currentTeam, standings, { sidelined });
           else setScreen('recap');
        }
    }
    return;
    }

    if (madePlayoffs) checkPlayoffs(ctx, currentLg, currentTeam, standings, { sidelined });
    else setScreen('recap');
}