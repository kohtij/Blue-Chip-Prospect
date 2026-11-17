import { useState, useRef } from 'react';
import { useAppContext } from '../AppContext';
import { getFullTeamName, getTrainingQuality, getTrainingTierLabel } from '../utils/appHelpers';
import { cap, recomputeOvr, withTeamArticle } from '../utils/gameHelpers';
import { statPillClass } from '../utils/statColors';
import { CHOICE_ROW, kickerClass, TITLE_MD, TITLE_SM } from '../utils/ui';

// Your identity, chosen before your first game.
//
// This screen says the choice "will shape the foundation of your career", and it
// did almost none of that. The stat bonus was handed to handleTrain as an ordinary
// training card, so it only appeared months later at the end of the first season,
// mixed in with normal progression and impossible to attribute. Worse, it never
// set player.archetype at all: that is fixed at creation from your starting stat
// spread and was never touched again, so a player who picked Power Forward stayed
// labelled a Playmaker for his whole career, and never got the archetype's effects
// on progression soft caps or on the minigames that check for one.
//
// The archetype is now applied the moment you pick it.
const ARCHETYPE_POOLS = {
  G: {
    pool: [
      { id: 'arch_bfly', archetype: 'Butterfly', tag: 'POS', name: 'Butterfly Specialist', flavor: 'You rely on perfect positioning and dropping to the ice efficiently to take away the lower half of the net.', desc: '+8 POS', effect: { skating: 8 } },
      { id: 'arch_hyb', archetype: 'Hybrid', tag: 'REF', name: 'Athletic Hybrid', flavor: 'You combine technical positioning with explosive, athletic desperation saves when the play breaks down.', desc: '+8 REF', effect: { shooting: 8 } },
      { id: 'arch_trk', archetype: 'Puck Tracker', tag: 'IQ', name: 'Puck Tracker', flavor: 'You read the play early, find the puck through traffic, and are often across before the pass is made.', desc: '+8 IQ', effect: { hockeyIQ: 8 } },
      { id: 'arch_acr', archetype: 'Reflex', tag: 'AGI', name: 'Acrobatic', flavor: 'You rely on flexibility and athleticism, and you make saves that shouldn\'t be possible.', desc: '+8 AGI', effect: { physicality: 8 } }
    ],
    elite: { id: 'arch_all_g', archetype: 'Hybrid', tag: 'ELITE', name: 'Fundamentally Sound', flavor: 'You do everything in the crease well enough and nothing badly, and coaches like how little changes from night to night.', desc: '+4 ALL', effect: { shooting: 4, skating: 4, physicality: 4, hockeyIQ: 4, stamina: 4 } }
  },
  D: {
    pool: [
      { id: 'arch_ofd', archetype: 'Offensive Dynamo', tag: 'SKT', name: 'Offensive Dynamo', flavor: 'You act as a fourth forward, driving the rush and running the power play from the blue line.', desc: '+8 SKT', effect: { skating: 8 } },
      { id: 'arch_dfd', archetype: 'Shutdown', tag: 'PHY', name: 'Shutdown Defender', flavor: 'You clear the crease, block shots, and make life miserable for opposing forwards.', desc: '+8 PHY', effect: { physicality: 8 } },
      { id: 'arch_qb', archetype: 'Playmaker', tag: 'IQ', name: 'Powerplay QB', flavor: 'You see the ice well and move the puck to the forwards who can do something with it.', desc: '+8 IQ', effect: { hockeyIQ: 8 } },
      { id: 'arch_bom', archetype: 'Point Bomber', tag: 'SHT', name: 'Point Bomber', flavor: 'You have a heavy slapshot, and forwards think twice before stepping in front of it.', desc: '+8 SHT', effect: { shooting: 8 } }
    ],
    elite: { id: 'arch_all_d', archetype: 'Two-Way', tag: 'ELITE', name: 'Two-Way Defender', flavor: 'You pride yourself on a complete 200-foot game. You can jump into the rush or lock down the opponent\'s top line.', desc: '+4 ALL', effect: { shooting: 4, skating: 4, physicality: 4, hockeyIQ: 4, stamina: 4 } }
  },
  F: {
    pool: [
      { id: 'arch_snp', archetype: 'Sniper', tag: 'SHT', name: 'Pure Sniper', flavor: 'You have a quick release, and you want the puck in the net more than anyone else on the ice.', desc: '+8 SHT', effect: { shooting: 8 } },
      { id: 'arch_ply', archetype: 'Playmaker', tag: 'IQ', name: 'Elite Playmaker', flavor: 'You see the ice early and move defenders where you want them, so the passing lanes open up.', desc: '+8 IQ', effect: { hockeyIQ: 8 } },
      { id: 'arch_spd', archetype: 'Speedster', tag: 'SKT', name: 'Speed Demon', flavor: 'You\'re the fastest player on the ice most nights, and defenders back off the moment you pick up the puck.', desc: '+8 SKT', effect: { skating: 8 } },
      { id: 'arch_pwf', archetype: 'Power Forward', tag: 'PHY', name: 'Power Forward', flavor: 'You drop your shoulders, drive hard to the net, and physically overpower anyone who stands in your way.', desc: '+8 PHY', effect: { physicality: 8 } }
    ],
    elite: { id: 'arch_all_f', archetype: 'Two-Way', tag: 'ELITE', name: 'Two-Way Forward', flavor: 'You play a complete 200-foot game. You\'re just as comfortable backchecking as you are leading the rush.', desc: '+4 ALL', effect: { shooting: 4, skating: 4, physicality: 4, hockeyIQ: 4, stamina: 4 } }
  }
};

export default function PreseasonScreen() {
  const { activeTrainings, advanceToOffseason, currentYear, handleTrain, player, setPlayer, setStatChanges, checkEarlyDemotion } = useAppContext();
  
  const [rosterMoveNotice, setRosterMoveNotice] = useState(null);
  const hasChecked = useRef(false);

  // Lazily initialize random archetypes so they don't re-roll if the screen renders twice
  const [randomizedArchetypes] = useState(() => {
      const isGoalie = player.pos === 'G';
      const isDef = player.pos === 'LD' || player.pos === 'RD';
      const posType = isGoalie ? 'G' : isDef ? 'D' : 'F';
      
      const data = ARCHETYPE_POOLS[posType];
      const shuffled = [...data.pool].sort(() => 0.5 - Math.random());
      
      return [shuffled[0], shuffled[1], data.elite];
  });

  // THE CUTS COME AFTER CAMP.
  //
  // This used to run the moment the screen mounted, then wait a tick to say
  // so, so the camp cards painted and were replaced a split second later by
  // the news that he had been sent down, before he had trained at all. The cut
  // is made now when he leaves camp, on the player camp has just made, and the
  // rest of the year waits behind it until he has read it.
  const noticeFor = (move) => {
    const ahl = () => getFullTeamName(move.team, 'AHL');
    switch (move.reason) {
      case 'CLAIMED':
        return { title: '⏳ CLAIMED OFF WAIVERS', type: 'DEMOTION', label: 'Fresh start', sub: 'A club that wanted you badly enough to claim you.',
          desc: `Your GM put you on waivers to send you down, and another club put in a claim before the deadline. You play for ${withTeamArticle(getFullTeamName(move.team, 'NHL'), 'NHL')} now.` };
      case 'WAIVERS':
        return { title: '📉 CLEARED WAIVERS', type: 'DEMOTION', label: 'Head down, work', sub: 'Play your way back up.',
          desc: `Camp broke and your name went on the waiver wire. Nobody claimed you in the twenty-four hours, so you report to the ${ahl()} to start the year.` };
      case 'DEVELOPMENT':
        return { title: '📉 SENT DOWN TO THE AHL', type: 'DEMOTION', label: 'Head down, work', sub: 'Play your way back up.',
          desc: `The club would rather you played big minutes than sat in the press box. You start the year with the ${ahl()}. You're still waiver-exempt, so no other club got the chance to claim you.` };
      case '9_GAME_RULE':
        return { title: '📉 RETURNED TO JUNIOR', type: 'DEMOTION', label: 'Head down, work', sub: 'Go back and make it impossible to send you down again.',
          desc: `After training camp, the front office decided you need one more year of seasoning. You have been returned to ${withTeamArticle(getFullTeamName(move.team, move.lg), move.lg)}.` };
      case 'JUNIOR_ASSIGNMENT':
        // Not a demotion. He signed, he came to camp, and the club decided he
        // plays another year where he already is.
        return { title: '🏒 BACK TO JUNIOR FOR A YEAR', type: 'ASSIGNMENT', label: 'Go and dominate it', sub: 'One more year as the best player in the league.',
          desc: `You signed, you came to camp, and the staff told you what they tell most of their first-rounders: go and be the best player in your league for one more year. You're back with ${withTeamArticle(getFullTeamName(move.team, move.lg), move.lg)}, and they expect you to carry it.` };
      case 'CAMP_ASSIGNMENT':
        return { title: '📉 ASSIGNED TO THE AHL', type: 'DEMOTION', label: 'Head down, work', sub: 'Play your way back up.',
          desc: `Camp broke and the list went up without your name on the NHL side of it. You have been assigned to the ${ahl()} to start the year, which is where they put the ones they aren't finished with.` };
      case 'ECHL_REASSIGNMENT':
        return { title: '📉 SENT DOWN TO THE ECHL', type: 'DEMOTION', label: 'Head down, work', sub: 'Grind your way back up the depth chart.',
          desc: `You have been reassigned from the AHL to the ${getFullTeamName(move.team, 'ECHL')} (ECHL). It's time to put your head down and grind your way back up the depth chart.` };
      case 'PROMOTION':
        return { title: '📈 MADE THE ROSTER', type: 'PROMOTION', label: 'Hit the ice', sub: 'Now keep the spot.',
          desc: `You had a great camp and forced the coach's hand. You start the season on the ${getFullTeamName(move.team, move.lg)} roster.` };
      default:
        return { title: '📉 SENT DOWN TO THE AHL', type: 'DEMOTION', label: 'Head down, work', sub: 'Play your way back up.',
          desc: `The front office has assigned you to the ${ahl()} (AHL) to start the season.` };
    }
  };

  // What happens once camp is over: the offseason picks up where it left off,
  // or the very first season of a career starts.
  const carryOn = (who) => {
    if (who.offseason) advanceToOffseason(who);
    else handleTrain({ effect: {} }, who);
  };

  const leaveCamp = (who) => {
    const move = (checkEarlyDemotion && !hasChecked.current) ? checkEarlyDemotion(who) : null;
    hasChecked.current = true;
    if (!move) { carryOn(who); return; }
    const moved = {
      ...who, team: move.team, league: move.lg,
      teamsPlayedFor: Array.from(new Set([...(who.teamsPlayedFor || []), move.team])),
      // Camp has already decided where he starts, so the camp events that ask
      // how he'll handle the week ("decides where you start the season") are
      // skipped this summer. See advanceToOffseason.
      ...(who.offseason ? { offseason: { ...who.offseason, campMoved: true } } : {})
    };
    setPlayer(moved);
    setRosterMoveNotice({ ...move, ...noticeFor(move), next: moved });
  };

  const handleAcknowledgeMove = () => {
    const next = rosterMoveNotice?.next;
    setRosterMoveNotice(null);
    if (next) carryOn(next);
  };

  const isArchetypeChoice = currentYear === 2026;
  const trainingOptions = isArchetypeChoice ? randomizedArchetypes : activeTrainings;
  // What the club can actually offer this year, so the quality of the cards on
  // the table is legible instead of looking like a silent dice roll.
  const trainingTier = getTrainingTierLabel(getTrainingQuality(player));

  return (
          <div className="game-panel mt-2 relative z-20">
            {rosterMoveNotice ? (
              /* THE SAME SCREEN AS EVERY OTHER ROSTER MOVE.
                 Being sent down at the end of camp had a screen of its own, a
                 big centred title and one large green button, while being sent
                 down in December came through the event screen with the GM's
                 message and a choice row. Same news, two looks. This draws the
                 camp notice the way the event screen draws a move: the title
                 with its icon, the message, and a row to answer it with. */
              <div className="p-4 sm:p-10 relative overflow-hidden bg-gradient-to-br from-[#0f1115] to-[#050608]">
                 <div className="bluechip-foil-overlay opacity-30 mix-blend-overlay grayscale absolute inset-0 pointer-events-none"></div>
                 <div className="relative z-10">
                   <h2 className={`${TITLE_SM} mb-3 sm:mb-4 text-left`}>
                      {rosterMoveNotice.title}
                   </h2>
                   <p className="text-sm sm:text-lg text-slate-300 mb-6 sm:mb-8 text-left leading-relaxed pr-2 sm:pr-4">
                      {rosterMoveNotice.desc}
                   </p>
                   <button type="button" onClick={handleAcknowledgeMove} className={`${CHOICE_ROW} w-full`}>
                      <span className="font-bold leading-tight text-sm sm:text-base text-white">{rosterMoveNotice.label}</span>
                      {rosterMoveNotice.sub && (
                        <span className="text-[10px] sm:text-xs text-slate-400 font-medium mt-0.5">{rosterMoveNotice.sub}</span>
                      )}
                   </button>
                 </div>
              </div>
            ) : (
              <div className="p-6 sm:p-10">
                 <div className="flex flex-col items-start border-b border-[rgba(255,255,255,0.065)] pb-4 mb-6">
                    {!isArchetypeChoice && (
                      <span className={`${kickerClass('neutral')} mb-2`}>{trainingTier.tier}</span>
                    )}
                    <h2 className={TITLE_MD}>
                      {isArchetypeChoice ? "WHAT KIND OF PLAYER ARE YOU?" : `PRE-SEASON ${currentYear}`}
                    </h2>
                    <p className="text-slate-400 text-sm sm:text-base font-sans mt-2">
                      {isArchetypeChoice ? "Your choice shapes how your career develops from here." : trainingTier.note}
                    </p>
                  </div>

                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 w-full pb-6 pt-2">
                    {trainingOptions.map(t => (
                      <button
                        type="button"
                        key={t.id}
                        // B1: Effort in training camp slightly bumps the coach's trust
                        onClick={() => {
                            const bumped = (p) => ({
                                ...p,
                                relationships: { ...p.relationships, coach: Math.min(100, (p.relationships?.coach ?? 50) + 5) }
                            });

                            // Camp pays out now, not next spring.
                            //
                            // Whatever you pick here used to be handed to the season
                            // simulation as a modifier and only surfaced at the end of
                            // the year, folded in with a season's worth of natural
                            // development. You trained all summer and nothing moved.
                            // The card is applied the moment you choose it and shows
                            // the same green highlight as any other stat change, so
                            // every camp visibly does something.
                            //
                            // Nothing is double counted: the season then runs with no
                            // training modifier, and because the simulation reads the
                            // boosted stat straight off the player, the year plays out
                            // exactly as it did before and the end-of-season total is
                            // unchanged. Only the moment of payment moved.
                            const eff = t.effect || {};
                            const trained = bumped({
                                ...player,
                                // The first camp of a career also sets who you are.
                                archetype: isArchetypeChoice ? (t.archetype || player.archetype) : player.archetype,
                                shooting: cap((player.shooting ?? 50) + (eff.shooting || 0)),
                                skating: cap((player.skating ?? 50) + (eff.skating || 0)),
                                physicality: cap((player.physicality ?? 50) + (eff.physicality || 0)),
                                hockeyIQ: cap((player.hockeyIQ ?? 50) + (eff.hockeyIQ || 0)),
                                stamina: cap((player.stamina ?? 50) + (eff.stamina || 0))
                            });
                            const applied = { ...trained, ovr: recomputeOvr(trained) };
                            setPlayer(applied);

                            if (setStatChanges) {
                                setStatChanges({ ...eff });
                                setTimeout(() => setStatChanges(null), 3000);
                            }

                            // Mid-offseason, camp has not happened yet: hand back so
                            // the camp battle fires now that the training is banked.
                            // The very first pre-season of a career has no offseason
                            // behind it, so that one starts the season directly.
                            // Either way the cuts are made first. See leaveCamp.
                            leaveCamp(applied);
                        }}
                        className={`bg-[#101410] border border-[rgba(255,255,255,0.065)] rounded-xl cursor-pointer transition-all hover:-translate-y-1 flex flex-col min-h-[12rem] sm:min-h-[16rem] text-left relative z-30 ${isArchetypeChoice ? 'hover:border-[#c084fc]' : t.rarity === 'Epic' ? 'hover:border-[#F59E0B]' : t.rarity === 'Rare' ? 'hover:border-[#3b82f6]' : 'hover:border-[#22E748]'}`}
                      >
                        <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between w-full pointer-events-none">
                          <div>
                            <div className="mb-3 flex flex-col items-start gap-1">
                              {t.rarity && (
                                <div className={`flex items-center gap-2 w-full ${
                                  t.rarity === 'Epic' ? 'text-[#F59E0B]' :
                                  t.rarity === 'Rare' ? 'text-[#3b82f6]' :
                                  'text-[#22E748] opacity-80'
                                }`}>
                                  <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] leading-none">
                                    {t.rarity}
                                  </span>
                                  <div className="flex-1 h-px bg-current opacity-30"></div>
                                </div>
                              )}
                              <h3 className="text-lg xl:text-xl tracking-tight font-black text-white uppercase leading-tight text-left sports-font mt-1">
                                {t.name}
                              </h3>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed italic text-left font-sans mb-4">{t.flavor}</p>
                          </div>

                          <div className="mt-auto text-left pt-4 border-t border-[rgba(255,255,255,0.065)] w-full flex flex-wrap items-center gap-1.5">
                            {(t.desc || '').split(',').map((boost, idx) => {
                              const trimmed = boost.trim();
                              const parts = trimmed.split(/\s+/);
                              const val = parts[0] || '';
                              const stat = (parts[1] || '').toUpperCase();
                              
                              let displayStat = stat;
                              if (player.pos === 'G') {
                                 if (stat === 'PHY') displayStat = 'AGI';
                                 if (stat === 'SHT') displayStat = 'REF';
                                 if (stat === 'SKT') displayStat = 'POS';
                              } else {
                                 if (stat === 'PHY') displayStat = 'POW';
                              }

                              // The colour table used to live here, in this one
                              // screen, so the same attribute came out a
                              // different colour in the store. It is shared
                              // now.
                              const colorCls = statPillClass(stat);

                              return (
                                <span
                                  key={idx}
                                  className={`text-xs sm:text-sm font-black px-3 py-1 rounded-md uppercase tracking-wider whitespace-nowrap border sports-font ${colorCls}`}
                                >
                                  {val} {displayStat}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
              </div>
            )}
          </div>
  );
}