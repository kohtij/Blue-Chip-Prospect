// Extracted from App.jsx.
// Takes an `ctx` object with the state, setters, and other handlers it needs.
import { getOpponentPool, getPrimaryRival } from '../data/teams';
import { eventDeck } from '../data/economy';
import { getJournalistsForLeague, getFullTeamName } from '../utils/appHelpers';
import { selectPressQuestions } from '../data/pressQuestions';
import { checkPlayoffs } from './checkPlayoffs';
import { simulateTournament } from '../utils/international';

export function runPostSeasonFlow(ctx, pAge, pOvr, currentLg, currentTeam, madePlayoffs, nextYear, standings) {
  const { player, playoffs, setActiveEvent, setActivePress, setIntlResult, setMinigameContext, setPendingPlayoffs, setPlayer, setScreen, triggerMinigame } = ctx;

    setPendingPlayoffs(madePlayoffs ? { lg: currentLg, team: currentTeam, standings } : null);

    // ==========================================
    // STORYLINE 0: THE COACHING CAROUSEL
    // ==========================================
    const coachTrustLvl = player.relationships?.coach || 50;
    const totalTeams = getOpponentPool(currentLg)?.length || 32;
    const isBottomFeeder = standings >= (totalTeams - 5);
    
    // If the team bombs and coach trust is low, the coach is fired.
    if (currentLg === 'NHL' && player.pos !== 'G' && isBottomFeeder && coachTrustLvl < 50 && Math.random() < 0.40) {
        setActiveEvent({
            title: '👔 THE COACHING CAROUSEL',
            desc: `After a disastrous season, the front office fired the head coach. The new bench boss has pulled you into his office to discuss your role moving forward.`,
            choices: [
                { label: 'Pledge to play a 200-foot defensive game', subLabel: 'Commit to a team-first, defensively responsible role.', isRisky: false, feedback: 'He appreciates your commitment to a team-first system.', effect: { fanStatus: 0, ovr: 0, rel: { coach: 30 } } },
                { label: 'Demand the offense runs through you', subLabel: 'Push for the green light to be the focal point of the attack.', isRisky: true, successChance: (pOvr >= 85 ? 0.7 : 0.3), successFeedback: 'He loves your confidence and gives you the green light to dominate!', successEffect: { fanStatus: 15, ovr: 1, rel: { coach: 20 } }, failFeedback: 'He hates your ego. You start the season in his doghouse.', failEffect: { fanStatus: -15, ovr: -1, rel: { coach: -30 } } }
            ],
            madePlayoffs
        });
        setScreen('event');
        return;
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
            desc: `Notorious local shock-jock ${player.nemesisName || 'a local columnist'} just published a scathing hit piece on you. He called you selfish, lazy, and a locker room cancer. The article is trending everywhere.`,
            choices: [
                { label: 'Take the High Road', subLabel: 'Stay quiet and let your play speak for itself.', isRisky: false, feedback: 'You refused to take the bait. Your coach loved the maturity, but the fans wanted you to defend yourself.', effect: { fanStatus: -15, ovr: 1, rel: { coach: 15, media: 5 } } },
                { label: 'Declare War', subLabel: 'Fire back publicly and make this personal.', isRisky: true, successChance: 0.5, successFeedback: 'You publicly called the reporter a hack and backed it up on the ice! The fans love the drama.', successEffect: { fanStatus: 40, ovr: 1, rel: { media: -20, teammates: 10 } }, failFeedback: 'You sounded incredibly rattled and defensive. The reporter just tweeted "I rest my case."', failEffect: { fanStatus: -30, ovr: -1, rel: { media: -30 } } }
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
            desc: `Following a brutal loss, ${player.nemesisName} forces his way to your locker and asks a wildly disrespectful, baiting question about your work ethic right in front of the cameras.`,
            choices: [
                { label: 'Walk Away', subLabel: 'Avoid the confrontation, even if it looks bad on camera.', isRisky: false, feedback: 'You walked away mid-question. It looks bad on TV, but you avoided a fine.', effect: { fanStatus: -10, ovr: 0, rel: { media: -15 } } },
                { label: 'Put Him In His Place', subLabel: 'Fire back on camera and risk a fine if it goes too far.', isRisky: true, successChance: (pOvr >= 85 ? 0.7 : 0.3), successFeedback: 'You systematically dismantled his hockey knowledge on live TV. It was a legendary press conference moment!', successEffect: { fanStatus: 50, ovr: 1, money: 10000, rel: { media: 20 } }, failFeedback: 'You lost your temper, cursed him out, and the league fined you heavily. A total PR disaster.', failEffect: { fanStatus: -40, ovr: -1, money: -50000, rel: { media: -40 } } }
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
            desc: `You just won the Cup. In the post-game press conference, you spot ${player.nemesisName} sitting quietly in the back of the room. He looks completely defeated.`,
            choices: [
                { label: 'Call Him Out Publicly', isRisky: false, feedback: 'You stared right at him and asked, "What are you going to write tomorrow?" The entire room erupted in laughter. You won the war.', effect: { fanStatus: 100, ovr: 1, rel: { media: 30 } } }
            ],
            madePlayoffs
        });
        setScreen('event');
        return;
    }

    // ==========================================
    // STORYLINE 1.5: THE FRANCHISE DUO
    // ==========================================
    const duoStage = player.storylines?.franchiseDuo || 0;
    const teammateTrust = player.relationships?.teammates || 50;

    // Organic Trigger: Good teammate relations early in NHL career
    if (duoStage === 0 && player.pos !== 'G' && currentLg === 'NHL' && teammateTrust > 75 && player.stats?.seasonsPlayed >= 2 && Math.random() < 0.15) {
        setPlayer(p => ({ 
            ...p, 
            storylines: { ...p.storylines, franchiseDuo: 1 },
            duoName: 'your linemate'
        }));
        setActiveEvent({
            title: '🤝 THE DYNAMIC DUO',
            desc: `You and a young linemate have developed literal mind-reading chemistry on the ice. The fans have given you a combined nickname, and you are officially inseparable on and off the ice.`,
            choices: [
                { label: 'Embrace the Brotherhood', isRisky: false, feedback: 'The two of you are the heartbeat of the franchise. Your chemistry makes everyone better.', effect: { fanStatus: 30, ovr: 1, rel: { teammates: 25 } } }
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
            desc: `Your best friend on the team is entering a contract year. The GM pulls you aside and says they can't afford to keep both of you under the salary cap unless you agree to restructure your own contract and defer a massive chunk of your salary.`,
            choices: [
                { label: 'Restructure & Defer Salary', subLabel: 'Give up millions of your own money to keep your friend around.', isRisky: false, feedback: 'You deferred millions of dollars to keep your duo together. The fans worship your loyalty.', effect: { fanStatus: 100, ovr: 1, money: -2500000, rel: { teammates: 50, coach: 20 } } },
                { label: 'Keep Your Contract Intact', subLabel: 'Let business be business, even if it costs the friendship.', isRisky: false, feedback: 'You told the GM hockey is a business. Your friend was traded the next day. The locker room is stunned, and you feel entirely alone.', effect: { fanStatus: -50, ovr: -2, money: 0, rel: { teammates: -40 } } }
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
    const coachTrust = player.relationships?.coach || 50;

    // STAGE 1: THE CLASH (Triggered organically early in an NHL career)
    if (lockerStage === 0 && player.pos !== 'G' && currentLg === 'NHL' && player.stats?.seasonsPlayed < 5 && Math.random() < 0.15) {
        setPlayer(p => ({ ...p, storylines: { ...p.storylines, lockerRoom: 1 } }));
        setActiveEvent({
            title: '👴 THE OLD GUARD',
            desc: `You just walked into a locker room run by a grizzled veteran captain and an old-school coach who hates flashy rookies. They demand you put your head down and play a grinding, dump-and-chase style.`,
            choices: [
                { label: 'Buy In', subLabel: 'Dump and chase on command, even if it bores the crowd.', isRisky: false, feedback: 'You dumped the puck and threw hits. The coach nodded approvingly, but the fans were bored to tears.', effect: { fanStatus: -15, ovr: 0, rel: { coach: 25, teammates: 10 } } },
                { label: 'Play Your Game', subLabel: 'Stick to your flashy instincts and risk the coach\'s wrath.', isRisky: true, successChance: 0.5, successFeedback: 'You pulled off a nasty toe-drag and scored! The fans went wild, forcing the coach to bite his tongue.', successEffect: { fanStatus: 30, ovr: 1, money: 0, rel: { coach: -10 } }, failFeedback: 'You turned the puck over at the blue line. The coach stapled you to the bench for the rest of the period.', failEffect: { fanStatus: -15, ovr: -1, rel: { coach: -25, teammates: -10 } } }
            ],
            madePlayoffs
        });
        setScreen('event');
        return;
    }

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
                desc: `Your relationship with the old-school coach is completely broken, but your elite stats are undeniable. The GM calls you in to resolve this incredibly toxic situation.`,
                choices: [
                    { label: 'Demand the Coach is Fired', subLabel: 'Use your leverage to push the coach out, at the risk of suspension.', isRisky: true, successChance: 0.6, successFeedback: 'The GM sided with his superstar. The coach was fired the next morning, and the locker room is officially yours.', successEffect: { fanStatus: 20, ovr: 1, rel: { coach: 50, teammates: 20 } }, failFeedback: 'The GM refused to let a player run the team. You were immediately suspended for insubordination.', failEffect: { fanStatus: -25, ovr: -1, money: -50000, rel: { coach: -20, teammates: -20 } } },
                    // Left as a plain choice on purpose: this is a fork between two very
                    // different decisions, not a comparison of destinations, so a full team
                    // card here would tower over the other choice. The subLabel names the
                    // destination instead, which was only revealed after choosing.
                    { label: 'Demand a Trade', subLabel: `Ask out and start fresh with the ${destTeam.name}.`, isRisky: false, feedback: `You told the GM you want out. Within 24 hours, you were quietly shipped off to ${destTeam.name}.`, effect: { fanStatus: -15, ovr: 0, rel: { coach: 10 } }, action: 'ACCEPT_TRADE_DEADLINE', actionData: { teamObj: destTeam, lg: 'NHL', teamStandings: 12, madePlayoffs: true } }
                ],
                madePlayoffs
            });
            setScreen('event');
            return;
        } else if (coachTrust >= 80 && pAge >= 21) {
            // RESOLUTION B: PASSING THE TORCH (You earned their respect)
            setPlayer(p => ({ ...p, storylines: { ...p.storylines, lockerRoom: 2 } })); // Ends arc
            setActiveEvent({
                title: '👑 PASSING THE TORCH',
                desc: `You bought into the system, played the right way, and earned the ultimate respect of the old guard. The veteran captain just announced his retirement and publicly handed you the "C".`,
                choices: [
                    { label: 'Accept the Captaincy', isRisky: false, feedback: 'You are now the Captain of the franchise.', effect: { fanStatus: 100, ovr: 2, rel: { coach: 20, teammates: 20 } }, action: 'MAKE_CAPTAIN' }
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
    if (hometownStage === 0 && currentLg === 'NHL' && pOvr >= 78 && Math.random() < 0.12) {
        setPlayer(p => ({ ...p, storylines: { ...p.storylines, hometown: 1 } }));
        setActiveEvent({
            title: '🏙️ THE SAVIOR ARRIVES',
            desc: `The city has suffered a 50-year championship drought. The media and fans have immediately crowned you as their hometown savior. The expectations are astronomical, but the love is real.`,
            choices: [
                { label: 'Embrace the Pressure', subLabel: 'Publicly commit to winning a championship for this city.', isRisky: false, feedback: 'You told the press you are here to win a Cup. The city is ready to run through a brick wall for you.', effect: { fanStatus: 50, ovr: 1, money: 0 } },
                { label: 'Downplay the Hype', subLabel: 'Manage expectations instead of making bold promises.', isRisky: true, successChance: 0.5, successFeedback: 'You successfully managed expectations, keeping the media calm while still impressing the fans.', successEffect: { fanStatus: 20, ovr: 0, rel: { media: 20 } }, failFeedback: 'The media accused you of lacking confidence. Not the heroic quote they wanted.', failEffect: { fanStatus: -15, ovr: 0, rel: { media: -20 } } }
            ],
            madePlayoffs
        });
        setScreen('event');
        return;
    }

    // STAGE 2: THE SLUMP (Failing to deliver a deep run)
    if (hometownStage === 1 && currentLg === 'NHL' && !madePlayoffs && Math.random() < 0.5) {
        setPlayer(p => ({ ...p, storylines: { ...p.storylines, hometown: 2 } }));
        setActiveEvent({
            title: '📉 THE HONEYMOON IS OVER',
            desc: `Another season ends without a parade. The local media has turned toxic, and talk-radio is questioning if you actually have what it takes to carry this franchise. The pressure is suffocating.`,
            choices: [
                { label: 'Ignore the Noise', subLabel: 'Stay silent and keep your focus on the gym and the ice.', isRisky: false, feedback: 'You stayed off social media and hit the gym. The fans are still mad, but you kept your focus.', effect: { fanStatus: -30, ovr: 1, rel: { media: -10 } } },
                { label: 'Call Out the Critics', subLabel: 'Push back publicly and risk it blowing up in your face.', isRisky: true, successChance: 0.4, successFeedback: 'You passionately defended your team. A risky move, but the diehard fans respected your fire!', successEffect: { fanStatus: 25, ovr: 0, rel: { teammates: 15 } }, failFeedback: 'It completely backfired. The media crucified you for making excuses.', failEffect: { fanStatus: -50, ovr: -1, rel: { media: -30 } } }
            ],
            madePlayoffs
        });
        setScreen('event');
        return;
    }

    // STAGE 3: THE BREAKING POINT
    if (hometownStage === 2 && currentLg === 'NHL' && Math.random() < 0.4) {
        setPlayer(p => ({ ...p, storylines: { ...p.storylines, hometown: 3 } })); // End arc
        
        let pool = (getOpponentPool('NHL') || []).filter(t => t.id !== currentTeam);
        if (pool.length === 0) pool = [{ id: 'UNK', name: 'Unknown Team' }];
        const destTeam = pool[Math.floor(Math.random() * pool.length)];

        setActiveEvent({
            title: '🧳 THE BREAKING POINT',
            desc: `The offseason has arrived. You just received a massive, under-the-table guarantee from a sunny, low-pressure market. They will force a trade to get you and pay you a fortune to escape this toxic media environment.`,
            choices: [
                { label: 'Stay and Fight', subLabel: 'Pledge your loyalty to the city, for better or worse.', isRisky: true, successChance: 0.5, successFeedback: 'You pledged your loyalty to the city! The fans are weeping tears of joy. You are a local legend.', successEffect: { fanStatus: 150, ovr: 2, rel: { teammates: 20 } }, failFeedback: 'You stayed, but the toxic environment is mentally draining your love for the game.', failEffect: { fanStatus: 10, ovr: -2, rel: { media: -10 } } },
                // Plain choice on purpose, same reasoning as the mutiny trade above.
                { label: 'Take the Money & Escape', subLabel: `Cash out and leave the toxic market behind for the ${destTeam.name}.`, isRisky: false, feedback: `You packed your bags for ${destTeam.name}. You are rich and stress-free, but your hometown jerseys are burning in the streets.`, effect: { fanStatus: -150, ovr: 0, money: 2500000 }, action: 'ACCEPT_TRADE_DEADLINE', actionData: { teamObj: destTeam, lg: 'NHL', teamStandings: 8, madePlayoffs: true } }
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

    // STAGE 1: THE HIT (Random 4% chance anytime after junior hockey)
    if (injuryStage === 0 && player.pos !== 'G' && currentLg !== 'NCAA' && pAge > 18 && Math.random() < 0.04) {
        setPlayer(p => ({ ...p, storylines: { ...p.storylines, injury: 1 } }));

        // If the club qualified, the injury chains into a press box event instead of
        // dropping the player straight into the card minigames they cannot play.
        // playerSidelined is what App.jsx reads to run the playoffs as a background
        // simulation and what PlayoffsScreen reads to show the press box summary.
        const pressBoxEvent = {
            title: '🎙️ THE PRESS BOX',
            desc: `Your teammates open the playoffs without you. Hobbling around on crutches in a suit and tie, you have a front-row seat to their run. How do you spend it?`,
            choices: [
                {
                    label: 'Support your teammates from the press box',
                    subLabel: 'Be seen backing the group every single night.',
                    isRisky: false,
                    feedback: 'You were the loudest voice in the building every night. The room noticed.',
                    effect: { fanStatus: 20, ovr: 0, rel: { teammates: 20 } }
                },
                {
                    label: 'Grind through rehab instead',
                    subLabel: 'Skip the spectacle and attack the recovery early.',
                    isRisky: false,
                    feedback: 'You spent the run in the training room. Nobody saw it, but you are ahead of schedule.',
                    effect: { fanStatus: -5, ovr: 1, rel: { coach: 10 } }
                },
                {
                    label: 'Mentor the call-up taking your spot',
                    subLabel: 'Coach up the kid who replaced you in the lineup.',
                    isRisky: false,
                    feedback: 'You walked the rookie through every shift. The staff will remember that.',
                    effect: { fanStatus: 10, ovr: 0, rel: { coach: 20, teammates: 10 } }
                },
                {
                    label: 'Push your timeline to return early',
                    subLabel: 'Try to force your way back before the run is over.',
                    isRisky: true,
                    successChance: 0.25,
                    successFeedback: 'You beat the timeline and took warmups with the team. The building lost its mind.',
                    successEffect: { fanStatus: 40, ovr: 0, rel: { teammates: 20 } },
                    failFeedback: 'You pushed too hard, re-aggravated the knee, and set your recovery back months.',
                    failEffect: { fanStatus: -10, ovr: -2, rel: { coach: -15 } }
                }
            ],
            playerSidelined: true,
            madePlayoffs: true
        };

        setActiveEvent({
            title: '🚑 DEVASTATING INJURY',
            desc: `A fourth-line enforcer just caught you with your head down. The hit was brutal. You are stretchered off the ice with a torn ACL. Your season is completely over.`,
            choices: [
                {
                  label: madePlayoffs ? 'Watch the Playoffs from the Press Box' : 'Begin Recovery',
                  subLabel: madePlayoffs ? 'Support your teammates as they chase the championship without you.' : 'Start the long road back.',
                  isRisky: false,
                  feedback: madePlayoffs
                    ? 'You cheered the boys on from the press box. The team will do their best without you on the ice.'
                    : 'The surgery was successful, but the road back is going to be incredibly difficult.',
                  effect: { fanStatus: 15, ovr: -3, money: 0 }
                }
            ],
            // FIX: Don't force them out of the playoffs if the team actually made it!
            madePlayoffs: madePlayoffs,
            followUpEvent: madePlayoffs ? pressBoxEvent : null
        });
        setScreen('event');
        return;
    }

    // STAGE 2: THE REHAB (Triggers the immediate next offseason)
    if (injuryStage === 1) {
        setPlayer(p => ({ ...p, storylines: { ...p.storylines, injury: 2 } }));
        setActiveEvent({
            title: '🏥 THE REHABILITATION',
            desc: `It's been a grueling offseason of rehab. Your physical therapists have presented you with two options: a standard team-covered recovery plan, or flying to Germany for cutting-edge, experimental treatments out of your own pocket.`,
            choices: [
                { label: 'Experimental Rehab ($100k)', subLabel: 'Fly overseas for cutting-edge treatment at your own expense.', isRisky: true, successChance: 0.75, successFeedback: 'The treatment worked miracles! You actually feel faster and stronger than you did before the injury.', successEffect: { fanStatus: 20, ovr: 4, money: -100000 }, failFeedback: 'The experimental treatment was a bust. You lost the money and still feel a step slow.', failEffect: { fanStatus: 0, ovr: 1, money: -100000 } },
                { label: 'Standard Rehab (Free)', subLabel: 'Stick with the team\'s recovery program, no cost, no guarantees.', isRisky: false, feedback: 'You played it safe. You are medically cleared to play, but you definitely lost a step physically.', effect: { fanStatus: 0, ovr: 1, money: 0 } }
            ],
            madePlayoffs
        });
        setScreen('event');
        return;
    }

    // STAGE 3: THE COMEBACK / REVENGE
    if (injuryStage === 2 && Math.random() < 0.5) {
        setPlayer(p => ({ ...p, storylines: { ...p.storylines, injury: 3 } })); // Ends arc
        setActiveEvent({
            title: '🩸 BAD BLOOD',
            desc: `It's your first game back against the exact enforcer that tore your ACL last year. The crowd is buzzing. Everyone on the ice knows exactly what is about to happen.`,
            choices: [
                { label: 'Drop the Gloves', subLabel: 'Settle the score physically for the hit that ended your season.', isRisky: true, successChance: (pOvr >= 75 ? 0.6 : 0.3), successFeedback: 'You beat the absolute brakes off him! The crowd went berserk. Justice served.', successEffect: { fanStatus: 75, ovr: 1, rel: { teammates: 30, coach: -10 } }, failFeedback: 'He got the better of you again. You left the ice with a black eye and a bruised ego.', failEffect: { fanStatus: -15, ovr: 0, rel: { teammates: -10, coach: -15 } } },
                { label: 'Scoreboard Revenge', subLabel: 'Let your game do the talking instead of your fists.', isRisky: true, successChance: (player.hockeyIQ >= 70 ? 0.7 : 0.4), successFeedback: 'You burned him on a 1-on-1 and scored the game-winner! The ultimate flex.', successEffect: { fanStatus: 40, ovr: 1, rel: { coach: 20 } }, failFeedback: 'You tried to force a play on him and turned it over. The coach wasn\'t happy.', failEffect: { fanStatus: -10, ovr: -1, rel: { coach: -15 } } }
            ],
            madePlayoffs
        });
        setScreen('event');
        return;
    }

// ==========================================
    // STORYLINE 4.5: THE NAGGING INJURY (Mid-Season Risk/Reward)
    // ==========================================
    // Triggers organically mid-season for established players
    if (currentLg !== 'NCAA' && madePlayoffs && Math.random() < 0.05 && !player.storylines?.naggingInjury) {
        setPlayer(p => ({ ...p, storylines: { ...p.storylines, naggingInjury: true } }));
        setActiveEvent({
            title: '🤕 THE NAGGING INJURY',
            desc: `You took a nasty slash to the wrist and the team doctor says it's a hairline fracture. You can sit out for 4 weeks to let it heal, or shoot up with painkillers and play through it to help the team secure a playoff spot.`,
            choices: [
                {
                    label: 'Rest and Heal',
                    subLabel: 'Take the full four weeks, even if it costs the team a playoff spot.',
                    isRisky: false,
                    feedback: 'You took the time to heal. Your body is 100%, but the team struggled without you.',
                    effect: { fanStatus: -10, ovr: 0, rel: { coach: -10, teammates: -10 } },
                    madePlayoffs: false // Sitting out causes the team to miss the playoffs!
                },
                {
                    label: 'Play Through the Pain',
                    subLabel: 'Mask the pain with medication to help secure a playoff berth.',
                    isRisky: true,
                    successChance: 0.50,
                    successFeedback: 'You gritted your teeth and played through it! Your teammates revere your toughness.', 
                    successEffect: { fanStatus: 30, ovr: 1, rel: { teammates: 40, coach: 20 } }, 
                    failFeedback: 'You played through it, but the fracture worsened. You need off-season surgery and your shot has suffered.', 
                    failEffect: { fanStatus: 10, ovr: -2, rel: { teammates: 20 } } 
                }
            ],
            isDemotionEvent: false,
            madePlayoffs: true // Playing through it guarantees the playoff spot
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
            desc: `Your team has incredible depth down the middle, but they are weak on the wings. The head coach pulls you aside and asks you to shift to the Wing permanently to balance the lines.`,
            choices: [
                {
                    label: 'Accept the Move',
                    subLabel: 'Put the team first and learn a new position on the fly.',
                    isRisky: false,
                    feedback: 'You put the team first and shifted to the wing. The coach loved your unselfishness, but you had to learn a new system on the fly.',
                    effect: { fanStatus: 10, ovr: -1, rel: { coach: 25 } },
                    action: 'CHANGE_POSITION',
                    actionData: Math.random() > 0.5 ? 'LW' : 'RW'
                },
                {
                    label: 'Refuse',
                    subLabel: 'Stand your ground and insist you belong at center.',
                    isRisky: true,
                    successChance: 0.5,
                    successFeedback: 'You stood your ground and proved you are the best Center on the roster. The coach respected your confidence and bumped a veteran to the wing instead.',
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
            desc: `The NHL club just drafted a highly-touted 18-year-old phenom. They assigned him to the AHL and the GM specifically asked you to center his line and teach him how to be a professional.`,
            choices: [
                {
                    label: 'Take Him Under Your Wing',
                    subLabel: 'Mentor the kid, even though he might be your eventual replacement.',
                    isRisky: false,
                    feedback: 'You spent the season protecting him on the ice and teaching him off it. The organization deeply respects your leadership.',
                    effect: { fanStatus: 20, ovr: 0, money: 25000, rel: { coach: 30, teammates: 15 } }
                },
                {
                    label: 'Refuse',
                    subLabel: 'Freeze him out rather than help groom your own replacement.',
                    isRisky: true,
                    successChance: 0.5,
                    successFeedback: 'You refused to pass him the puck and completely outplayed him, proving you are still the top dog on this roster!',
                    successEffect: { fanStatus: 10, ovr: 2, rel: { coach: -10 } },
                    failFeedback: 'You tried to freeze him out, but he scored anyway. The GM was furious with your selfishness and benched you.',
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
    if (!player.storylines?.emergencyCallup && player.pos !== 'G' && currentLg === 'AHL' && pAge >= 24 && coachTrust >= 60 && Math.random() < 0.15) {
        setPlayer(p => ({ ...p, storylines: { ...p.storylines, emergencyCallup: 1 } }));
        setActiveEvent({
            title: '🚨 THE EMERGENCY CALL-UP',
            desc: `The NHL club just suffered three catastrophic injuries in one night. Your AHL coach knocks on your hotel door at 2 AM. "Pack your bags. You are starting in the NHL tomorrow night."`,
            choices: [
                {
                    label: 'Play a Safe, Grinding Game',
                    subLabel: 'Keep it simple and let reliability make the case for staying up.',
                    isRisky: false,
                    feedback: 'You played 8 minutes of flawless, mistake-free hockey. The NHL coach loved your reliability and told you to unpack your bags—you are staying up.',
                    effect: { fanStatus: 25, ovr: 2, rel: { coach: 20 } },
                    action: 'CHANGE_LEAGUE',
                    actionData: 'NHL'
                },
                {
                    label: 'Try to Be the Hero',
                    subLabel: 'Force the moment for a shot at a permanent roster spot.',
                    isRisky: true,
                    successChance: (pOvr >= 72 ? 0.4 : 0.15),
                    successFeedback: 'You went rogue, jumped into the rush, and scored the game-winner! The fans are chanting your name. You just earned a permanent NHL roster spot!',
                    successEffect: { fanStatus: 75, ovr: 4, money: 50000, rel: { coach: 15 } },
                    action: 'CHANGE_LEAGUE',
                    actionData: 'NHL',
                    failFeedback: 'You tried to do too much and turned the puck over for the game-losing goal. You were on a flight back to the AHL the next morning.',
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

    // THE GROUP STAGE SIMULATOR
      // The World Championship. The other two tournaments now run inside the
      // season, where they belong on the calendar.
      const simulateGroupStage = (isWJC, isOlympicYear) => simulateTournament({
        player, natDiv: activeNatDiv, pOvr, safeNationalities: ctx.safeNationalities, isWJC, isOlympicYear
      });

    // THE WORLD CHAMPIONSHIP (May)
    // The only tournament that genuinely belongs after the season. The World
    // Juniors are played in late December and the Olympics in February, and both
    // now run inside the season where they happen; they used to be played here in
    // the summer alongside this one, months out of place.
    //
    // You go to the Worlds because your club season is already over. A player
    // still in the playoffs is unavailable, which is exactly why the tournament
    // is full of players whose teams missed or went out early.
    if (pAge > 19 && pOvr >= 78 && !madePlayoffs) {
       const isTopDiv = activeNatDiv === 'Top Division';
       // A top-division federation can pick from a deep pool, so a borderline
       // player is less certain of a call than one from a smaller nation.
       const playWorlds = isTopDiv ? Math.random() > 0.45 : Math.random() > 0.2;

       if (playWorlds) {
          const sim = simulateGroupStage(false, false);
          setPlayer(p => ({ ...p, intlData: sim.intlData, intlStakes: sim.intlStakes, intlOppTier: sim.intlOppTier, isOlympicYear: false }));
          setIntlResult(null);
          setMinigameContext('worlds');
          setScreen('intl-minigame');
          return;
       }
    }

    const rivalObj = getPrimaryRival(currentTeam, currentLg);
    if (rivalObj && Math.random() < 0.35) {
      const rivalName = getFullTeamName(rivalObj.id, currentLg);
      const isGoalie = player.pos === 'G';

      const fullChoicesPool = [
        {
          label: isGoalie ? 'Guarantee a Shutout' : 'Run Your Mouth to the Press',
          subLabel: '⚡ High Risk • Massive Fan Status boost or public embarrassment',
          isRisky: true,
          successChance: 0.45,
          successFeedback: isGoalie
            ? 'You stood on your head and posted a dominant shutout! The arena went ballistic and your jersey sales spiked overnight.'
            : 'You backed up every word on the ice with a multi-point performance! The arena went ballistic and your jersey sales spiked overnight.',
          successEffect: { fanStatus: 35, ovr: 1, money: 15000 },
          failFeedback: isGoalie
            ? 'You had a nightmare start, letting in 4 goals on 12 shots. Rival fans mocked you endlessly on social media.'
            : 'You got shut down completely and got mocked endlessly by rival fans on social media.',
          failEffect: { fanStatus: -25, ovr: 0, money: 0 }
        },
        {
          label: 'Lead by Example',
          subLabel: '🛡️ Safe • Steady team effort with reliable Fan approval',
          isRisky: false,
          feedback: isGoalie
            ? 'You played a calm, laser-focused game between the pipes, anchoring your squad to a gritty rivalry win.'
            : 'You played a disciplined, hard-nosed game and led your squad to a gritty rivalry win.',
          effect: { fanStatus: 15, ovr: 1, money: 0 }
        },
        {
          label: isGoalie ? 'Aggressive Crease Control' : 'Set the Physical Tone',
          subLabel: '💥 Moderate Risk • High intensity performance',
          isRisky: true,
          successChance: 0.65,
          successFeedback: isGoalie
            ? 'You aggressively challenged shooters and made flash-of-the-glove saves that completely rattled their top line!'
            : 'Your crushing hits early in the 1st period rattled their top line and energized the home crowd!',
          successEffect: { fanStatus: 20, ovr: 1, money: 0 },
          failFeedback: isGoalie
            ? 'You over-committed out of the net, getting caught out of position for a costly easy goal.'
            : 'You took an undisciplined double-minor penalty in the 3rd period that led to the game-winning goal.',
          failEffect: { fanStatus: -15, ovr: -1, money: 0 }
        },
        {
          label: isGoalie ? 'Stare Down Their Top Sniper' : 'Target Their Star Player',
          subLabel: '🎯 Target Focus • Neutralize their biggest threat',
          isRisky: true,
          successChance: 0.55,
          successFeedback: isGoalie
            ? `You completely robbed their star player on a breakaway! They were frustrated for the rest of the night.`
            : `You shadowed their top star all night, shutting them down completely and drawing key penalties.`,
          successEffect: { fanStatus: 25, ovr: 1, money: 0 },
          failFeedback: isGoalie
            ? `Their star beat you clean top-shelf twice in the 1st period.`
            : `Their star player danced past you for a highlight-reel goal while you got caught out of position.`,
          failEffect: { fanStatus: -15, ovr: 0, money: 0 }
        },
        {
          label: 'Deliver a Fiery Pre-Game Speech',
          subLabel: '🔥 Leadership • Fire up the locker room',
          isRisky: false,
          feedback: `Your speech gave the entire team chills. Everyone skated onto the ice ready to bleed for the jersey.`,
          effect: { fanStatus: 10, ovr: 1, money: 0 }
        },
        {
          label: isGoalie ? 'Slash Anyone Entering Your Crease' : 'Agitate Their Bench Between Whistles',
          subLabel: '😈 Mind Games • Get under their skin',
          isRisky: true,
          successChance: 0.60,
          successFeedback: `You completely broke their focus. Two of their key players got ejected for taking stupid retaliation penalties!`,
          successEffect: { fanStatus: 20, ovr: 0, money: 5000 },
          failFeedback: `The referees weren't having it. You got called for unsportsmanlike conduct and put your team on a penalty kill.`,
          failEffect: { fanStatus: -10, ovr: -1, money: -5000 }
        },
        {
          label: 'Pump Up the Home Crowd Early',
          subLabel: '📣 Crowd Control • Hype up the stadium',
          isRisky: false,
          feedback: `You raised your arms to the crowd before puck drop and the noise level reached deafening decibels!`,
          effect: { fanStatus: 20, ovr: 0, money: 0 }
        },
        {
          label: 'Obsess Over Video Tape',
          subLabel: '🧠 High IQ • Tactical preparation',
          isRisky: false,
          feedback: `Your endless film study paid off—you anticipated their breakout plays like you had their playbook!`,
          effect: { fanStatus: 5, ovr: 2, money: 0 }
        },
        {
          label: isGoalie ? 'Flashy Glove Saves' : 'Attempt a Highlight-Reel Move',
          subLabel: '✨ Showmanship • Go for the viral highlight',
          isRisky: true,
          successChance: 0.50,
          successFeedback: isGoalie
            ? `You pulled off a wind-mill glove save that became the #1 play on SportsCenter!`
            : `You pulled off a nasty toe-drag around their defender and sniped it home! SportsCenter #1 play!`,
          successEffect: { fanStatus: 30, ovr: 0, money: 10000 },
          failFeedback: isGoalie
            ? `You tried to showboat on a routine shot and fumbled it into your own net. Ouch.`
            : `You coughed up the puck trying to pull off a move and caused a breakaway goal against.`,
          failEffect: { fanStatus: -20, ovr: 0, money: 0 }
        },
        {
          label: isGoalie ? 'Aggressively Play the Puck Behind Net' : 'Pledge to Block Every Shot',
          subLabel: '🛡️ Ultimate Sacrifice • Put your body on the line',
          isRisky: true,
          successChance: 0.60,
          successFeedback: isGoalie
            ? `Your crisp passes out of the zone launched three fast-break opportunities!`
            : `You threw yourself in front of three rocket slapshots in the 3rd period to seal the win!`,
          successEffect: { fanStatus: 25, ovr: 1, money: 0 },
          failFeedback: isGoalie
            ? `You misread the bounce off the glass, leaving a wide-open net for an embarrassing goal.`
            : `You blocked a shot, but limped off the ice in pain and missed crucial shifts late in the game.`,
          failEffect: { fanStatus: -10, ovr: -1, money: 0 }
        },
        {
          label: isGoalie ? 'Get Involved in a Line Scrum' : 'Drop the Gloves Early',
          subLabel: '👊 Heavy Enforcer • Old-school rivalry brawl',
          isRisky: true,
          successChance: 0.55,
          successFeedback: `You won the fight handily! The home crowd exploded and the energy in the building was electric!`,
          successEffect: { fanStatus: 30, ovr: 0, money: 0 },
          failFeedback: `You took a heavy punch, lost your helmet, and spent 5 minutes in the box while your team conceded.`,
          failEffect: { fanStatus: -15, ovr: -1, money: 0 }
        },
        {
          label: 'Ice-Cold Systems Hockey',
          subLabel: '🧊 Composure • Pure tactical discipline',
          isRisky: false,
          feedback: `While they ran around trying to hit everything, you quietly executed your game plan to perfection.`,
          effect: { fanStatus: 10, ovr: 1, money: 0 }
        },
        {
          label: isGoalie ? 'Aggressive Poke-Checks' : 'Fly Down the Wing First Shift',
          subLabel: '⚡ High Energy • Speed and quickness',
          isRisky: true,
          successChance: 0.65,
          successFeedback: isGoalie
            ? `You poked the puck away cleanly on two separate breakaway attempts!`
            : `You blew past their defenseman on shift one and buried a wrist shot!`,
          successEffect: { fanStatus: 20, ovr: 1, money: 0 },
          failFeedback: isGoalie
            ? `You missed the poke-check and got deked out of your skates.`
            : `You got hit hard along the boards on your first shift and lost your momentum.`,
          failEffect: { fanStatus: -10, ovr: 0, money: 0 }
        },
        {
          label: isGoalie ? 'Relentlessly Chirp Their Forwards' : 'Relentlessly Chirp Their Defense',
          subLabel: '🗣️ Psychological Warfare • Disrupt their heads',
          isRisky: true,
          successChance: 0.50,
          successFeedback: `Your running commentary had their players arguing with each other on the bench!`,
          successEffect: { fanStatus: 15, ovr: 1, money: 0 },
          failFeedback: `They laughed off your chirps and proceeded to score on their next two power plays.`,
          failEffect: { fanStatus: -15, ovr: 0, money: 0 }
        },
        {
          label: 'Anchor Team Composure',
          subLabel: '🧘 Veteran Calm • Keep emotions in check',
          isRisky: false,
          feedback: `When the game turned chaotic in the 2nd period, your calm presence settled the entire team down.`,
          effect: { fanStatus: 15, ovr: 1, money: 0 }
        },
        {
          label: isGoalie ? 'Stack the Pads in Traffic' : 'Demand Double-Shifts Late',
          subLabel: '👑 Hero Ball • Take control of the game',
          isRisky: true,
          successChance: 0.50,
          successFeedback: isGoalie
            ? `You threw back to the 90s with a desperate pad-stack save that sealed the win!`
            : `You played 28 minutes, carried the team on your back, and scored the game-winner!`,
          successEffect: { fanStatus: 35, ovr: 1, money: 15000 },
          failFeedback: isGoalie
            ? `Stacking the pads left the top half of the net wide open. High shot, easy goal.`
            : `You got completely gassed in the 3rd period and turned the puck over for the game-winner against.`,
          failEffect: { fanStatus: -20, ovr: -1, money: 0 }
        }
      ];

      const selectedChoices = [...fullChoicesPool].sort(() => 0.5 - Math.random()).slice(0, 3);

      setActiveEvent({
        title: `🔥 RIVALRY NIGHT: VS THE ${rivalName.toUpperCase()}`,
        desc: `It's rivalry night against ${rivalName}! The arena is sold out, national television is covering the game, and the fans are desperate for a statement win. How do you approach the game?`,
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

        if (deck.length > 0) {
           const randomEvt = deck[Math.floor(Math.random() * deck.length)];
           setActiveEvent({ ...randomEvt, isDemotionEvent: false, madePlayoffs: madePlayoffs });
           setScreen('event');
        } else {
           if (madePlayoffs) checkPlayoffs(ctx, currentLg, currentTeam, standings);
           else setScreen('recap');
        }
    }
    return;
    }

    if (madePlayoffs) checkPlayoffs(ctx, currentLg, currentTeam, standings);
    else setScreen('recap');
}