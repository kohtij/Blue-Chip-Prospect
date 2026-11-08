import { getTeamData, nationalities } from '../data/teams';
import { careerTrophies, formatMoney, getActiveStat, resolveRole, summariseStints } from '../utils/gameHelpers';
import { getFullTeamName } from '../utils/appHelpers';
import { clubOutlook, teamStrengthOf } from '../utils/leagueState';
import { findRival, peerUnit, peerValue } from '../utils/peers';
import { STAT_TEXT, statCode } from '../utils/statColors';
import TeamLogo from './TeamLogo';

// The player card.
//
// This sits beside every screen in the game, all season, so it is the thing
// looked at more than anything else. It had grown into eight stacked blocks of
// equal weight, separated by hairlines: identity, fan status, contract,
// relationships, a season line, attributes, value and earnings, all-time
// totals, milestones, and two large buttons. Nothing was louder than anything
// else, so nothing was findable, and at four hundred and forty pixels wide it
// ran to thirteen hundred tall and had to be scrolled past the fold on a
// laptop.
//
// Everything sits on one surface, with nothing to click to reach it. A pass at
// this put money, career and the room behind three tabs, which made the card
// short but turned a glance into two clicks and hid two thirds of it at any
// moment. The card is a thing you read, not a thing you operate.
//
// The height came back under control a different way: by giving the numbers
// room and the prose none. Four numeric strips share one cell layout, each
// reading across in a single line, the three relationship bars sit side by
// side instead of stacked, and the writing that is left (the contract verdict,
// the fan requirement, the milestone labels) is one line each.

// One cell of a stat strip.
const Cell = ({ value, label, tone = 'text-white', hint, children }) => (
  <div className="relative px-1 py-2 flex flex-col justify-center items-center min-h-[48px]">
    {children}
    <p className={`text-lg sm:text-xl font-black number-font leading-none ${tone}`}>{value}</p>
    <p className="mt-1 truncate text-[7px] md:text-[8px] font-black uppercase tracking-wide text-slate-400">{label}</p>
    {hint}
  </div>
);

// The heading over a group: a name, and nothing else.
//
// Three attempts went into the thing that used to sit beside it. Bare text at
// the far right read as a subtitle torn off its own sentence; a bordered chip
// fixed the reading and added another outlined box to a crowded card; a dim
// word after a middot was quiet enough but still there. None of them were
// worth the room, because none of them said anything the card did not already
// say somewhere better. The contract's end year is the clearest case: it was
// printed over the money block while "3 yrs left" sat in the identity row six
// inches above it.
const Heading = ({ children }) => (
  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500 mb-1.5 px-0.5">{children}</p>
);

// The ladder the fan status climbs. These thresholds are getFanTier's, and
// the point of showing all five is that a player can see the one he is on and
// the one he is working toward instead of a bare number.
const FAN_LADDER = [
  { label: 'Unknown', at: 0 },
  { label: 'Known', at: 100 },
  { label: 'Loved', at: 300 },
  { label: 'Icon', at: 600 },
  { label: 'Legend', at: 1000 }
];

const Strip = ({ title, children, cols = 5 }) => (
  <div>
    {title && <Heading>{title}</Heading>}
    <div
      className="grid bg-[#101410] border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden divide-x divide-[rgba(255,255,255,0.05)] text-center shadow-lg"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {children}
    </div>
  </div>
);

const Bar = ({ pct, color, className = '' }) => (
  <div className={`h-1.5 w-full bg-[#0a0d0a] rounded-full overflow-hidden border border-[rgba(255,255,255,0.05)] ${className}`}>
    <div className="h-full rounded-full transition-all duration-500"
         style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: color }} />
  </div>
);

const Dashboard = ({ player, tier, statChanges, isJunior, isAHL, onOpenShop, onRetire, setActiveEvent, setScreen }) => {
  const safeNationalities = nationalities || [];
  const currentYear = 2026 + (player.stats?.seasonsPlayed || 0);
  const nextYear = currentYear + 1;

  const isGoalie = player.pos === 'G';
  const teamObj = getTeamData(player.team, player.league);
  const teamBg = player.ovr >= 90 ? '#F59E0B' : (teamObj?.bg || '#101410');

  let frameColor = '#8a95a1';
  if (player.ovr >= 75) frameColor = '#c98a4b';
  if (player.ovr >= 82) frameColor = '#e2e8f0';
  if (player.ovr >= 90) frameColor = '#F59E0B';

  // How the deal reads against what the club thinks you are worth.
  // The contract verdict line that used to sit under this block is gone. It
  // was a sentence of commentary restating what the three numbers above it
  // already said, and it said it every single season.

  // Only the text colour now. These used to carry a background and a border
  // as well, because the label was rendered as a pill.
  const intlStatus = (() => {
    if (player.age <= 19) {
      if (player.ovr >= 68) return { label: 'U20 star', text: 'text-[#22E748]' };
      if (player.ovr >= 60) return { label: 'U20 squad', text: 'text-[#3b82f6]' };
      if (player.ovr >= 55) return { label: 'U20 bubble', text: 'text-[#F59E0B]' };
      return { label: 'U20 radar', text: 'text-slate-500' };
    }
    if (player.ovr >= 88) return { label: "Nat'l icon", text: 'text-[#F59E0B]' };
    if (player.ovr >= 80) return { label: "Nat'l squad", text: 'text-[#22E748]' };
    if (player.ovr >= 75) return { label: "Nat'l bubble", text: 'text-[#3b82f6]' };
    return { label: 'Domestic', text: 'text-slate-500' };
  })();

  const fanBarColor = (f) =>
    f < 300 ? 'linear-gradient(90deg, color-mix(in srgb, #64748b 55%, #1e293b), #94a3b8)'
      : f < 600 ? 'linear-gradient(90deg, color-mix(in srgb, #3b82f6 55%, #1e3a8a), #60a5fa)'
        : f < 1000 ? 'linear-gradient(90deg, color-mix(in srgb, #F59E0B 55%, #78350f), #fbbf24)'
          : 'linear-gradient(90deg, color-mix(in srgb, #22E748 55%, #14532d), #4ade80)';

  const activeBucket = ['OHL', 'WHL', 'QMJHL', 'USHL', 'J20', 'U20', 'NCAA', 'SHL', 'LIIGA'].includes(player.league)
    ? 'chl' : (player.league === 'AHL' ? 'ahl' : 'nhl');
  const bName = activeBucket === 'nhl' ? 'NHL' : activeBucket === 'ahl' ? 'AHL' : 'PRE-NHL';

  const cGP = player.stats?.[activeBucket]?.games || 0;
  const cG = player.stats?.[activeBucket]?.goals || 0;
  const cA = player.stats?.[activeBucket]?.assists || 0;
  const cPts = cG + cA;
  const cShots = player.stats?.[activeBucket]?.shots || 0;
  const cSaves = player.stats?.[activeBucket]?.saves || 0;
  const cSHO = player.stats?.[activeBucket]?.shutouts || 0;
  const cSV = cShots > 0 ? (cSaves / cShots).toFixed(3).replace('0.', '.') : '.000';
  const cGAA = cGP > 0 ? ((cShots - cSaves) / cGP).toFixed(2) : '0.00';

  // What the career has actually won. This cell read player.stats.titles,
  // which nothing in the game ever writes, so a player with a Stanley Cup and
  // two Olympic golds was shown a career trophy count of zero. It then counted
  // its own way while the saved career record counted another, so the two
  // numbers for the same career disagreed; both read careerTrophies now.
  const trophies = careerTrophies(player).total;

  // Where the club is heading, for the line under his name. Only for leagues
  // whose table the save actually tracks.
  const outlook = ['NHL', 'AHL'].includes(player.league)
    ? clubOutlook(teamStrengthOf(player.leagueState, player.team))
    : null;

  // The role the engine will actually play him in, named.
  const role = resolveRole({
    contractRole: player.contract?.role || '',
    ovr: player.ovr, pos: player.pos, league: player.league,
    coachTrust: player.relationships?.coach ?? 50
  });

  // The one from your draft class whose career is the measuring stick.
  // Goalies used to get nothing here, because every peer function filtered
  // them out. They are ranked on shutouts rather than points.
  const myCareerValue = isGoalie ? cSHO : cPts;
  const rival = findRival(player.peers, myCareerValue, isGoalie);
  const rivalValue = rival ? peerValue(rival, isGoalie) : 0;
  const compareUnit = peerUnit(isGoalie);

  const earnings = player.stats?.earnings || 0;

  // The milestone bars that used to live here are gone. They chased the next
  // round number, which is a thing the player can work out from the career
  // totals printed two inches above them.

  // The season being played, if one is under way, otherwise the last one
  // finished. This panel only ever read seasonHistory, which is not written
  // until a season ENDS, so all the way through a year it was showing last
  // season's finished line. The nine-game look and the NHL debut are played
  // before a season object exists and are parked on the player while the event
  // is on screen, so they are read here too.
  const live = summariseStints(
    player.season?.stints
    || (player.trial ? [player.trial.segment] : null)
    || (player.debut ? [player.debut.segment] : null)
  );
  const ls = live
    || (player.seasonHistory?.length ? player.seasonHistory[player.seasonHistory.length - 1] : {});
  const inProgress = !!live;
  const toi = `${Math.floor(ls.avgToi || 0)}:${Math.round(((ls.avgToi || 0) % 1) * 60).toString().padStart(2, '0')}`;

  const canShop = !isJunior && player.league !== 'NCAA';
  const showMeeting = player.isCaptain && player.storylines?.lastMeetingYear !== currentYear;

  const callMeeting = () => {
    setActiveEvent({
      title: '📢 CALL TEAM MEETING',
      desc: 'As the Captain, you have the authority to lock the locker room doors and address the team. A great speech will rally the boys, but if you do this too often, they will tune you out.',
      choices: [
        {
          label: 'Deliver a Fiery Speech', isRisky: true, successChance: 0.65,
          successFeedback: 'The room was silent. You fired them up, and team morale skyrocketed!',
          successEffect: { fanStatus: 15, ovr: 1, rel: { teammates: 25 } },
          failFeedback: 'You stumbled over your words. The veterans rolled their eyes.',
          failEffect: { fanStatus: -10, ovr: -1, rel: { teammates: -20 } },
          action: 'TEAM_MEETING'
        }
      ],
      madePlayoffs: false
    });
    setScreen('event');
  };

  const rels = [
    // Called "Front office" here and "Coach Trust" on the playoffs screen,
    // for the same number. It governs ice time and deployment, so it is the
    // coach.
    { label: 'Coach', key: 'coach', color: '#3b82f6' },
    { label: 'Teammates', key: 'teammates', color: '#22E748' },
    { label: 'Media', key: 'media', color: '#F59E0B' }
  ];

  return (
    <div className="w-full max-w-[440px] md:max-w-2xl lg:max-w-[440px] mx-auto mb-4 lg:mb-0 z-10 relative drop-shadow-2xl mt-2 flex-1 flex flex-col">
      <div
        className="border border-[rgba(255,255,255,0.08)] border-t-0 rounded-[14px] overflow-hidden relative p-4 sm:p-5 flex-1 flex flex-col"
        style={{ background: `linear-gradient(180deg, color-mix(in srgb, ${teamBg} 12%, #12161c) 0%, #0a0d0a 38%)` }}
      >
        <div className="absolute top-0 left-0 right-0 h-[3px] opacity-90 z-0" style={{ background: `linear-gradient(90deg, transparent, ${frameColor}, transparent)` }} />
        {(player.ovr >= 90 || player.isGenerational) && <div className="bluechip-foil-overlay" />}

        <div className="relative z-10 flex flex-col gap-3.5 h-full w-full flex-1">

          {/* WHO YOU ARE */}
          <div className="flex items-center justify-between gap-3 w-full min-w-0 shrink-0">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <div className="flex flex-col items-center shrink-0">
                <span className="number-font text-5xl sm:text-6xl text-white leading-none">{player.ovr}</span>
                <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1 leading-none">OVR</p>
              </div>

              <div className="flex flex-col min-w-0 flex-1 justify-center">
                <div className="flex items-center gap-2 mb-1 w-full min-w-0">
                  <img src={safeNationalities.find(n => n.id === player.nat)?.img} alt={player.nat}
                       className="h-3.5 md:h-4 w-[21px] md:w-[26px] shrink-0 rounded-[2px] object-cover border border-slate-700 shadow-sm" />
                  <p className={`font-black sports-font leading-none text-white uppercase whitespace-nowrap tracking-tight ${
                    player.name.length > 15 ? 'text-xs sm:text-sm'
                      : player.name.length > 12 ? 'text-sm sm:text-base'
                        : player.name.length > 9 ? 'text-base sm:text-lg'
                          : 'text-xl sm:text-2xl lg:text-3xl'}`}>
                    {player.name}
                  </p>
                </div>

                {/* The club, and where the club is heading.
                    leagueState has given every club a strength that persists
                    and drifts for years, which is what decides the standings
                    now, and until this line nothing anywhere told the player
                    any of it: the window opened and closed around him
                    invisibly. */}
                <div className="flex items-baseline gap-2 min-w-0">
                  {/* Grey, like every other label on the card. A blue club
                      name next to a coloured outlook next to a coloured status
                      line put three different highlight colours in the top
                      inch, and the eye had nowhere to rest. */}
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 truncate">
                    {getFullTeamName(player.team, player.league)}
                  </p>
                  {outlook && (
                    <span className={`shrink-0 text-[8px] font-black uppercase tracking-widest ${outlook.tone}`}>
                      {outlook.label}
                    </span>
                  )}
                </div>

                {/* The deployment is the role he is actually being given.
                    It used to be getDeployment(ovr), a pure function of
                    ability, while the engine ran off contract.role: an 86 OVR
                    on a bottom-six deal read as a first line centre here and
                    was simulated as a checking forward. Both call resolveRole
                    now. */}
                <p className="text-[9px] font-bold uppercase tracking-tight text-slate-500 mt-1 leading-snug break-words">
                  {player.pos}
                  {player.archetype ? ` · ${player.archetype}` : ''} · {role.label}
                </p>

                {/* Where you stand: contract, status, letter, country.
                    This was four outlined, tinted, filled pills in a row, and
                    with the section chips below it the card had eight boxes
                    on it before a single number. The same four facts read
                    perfectly well as words with colour on them, separated the
                    way the line above them already separates things. */}
                <p className="text-[8px] md:text-[9px] font-black uppercase tracking-wide mt-1.5 leading-snug break-words">
                  {(() => {
                    // Age leads this line now rather than the one above it.
                    // Everything here is a fact about his standing, and how
                    // old he is belongs with how long he has left far more
                    // than it belongs with what he plays.
                    const bits = [[`${player.age} yrs`, 'text-slate-400']];
                    const junior = ['OHL', 'WHL', 'QMJHL', 'USHL', 'J20', 'U20'].includes(player.league);
                    if (junior && player.age >= 20) {
                      bits.push(['Overager', 'text-[#ef4444]']);
                    } else if (!junior && player.league !== 'NCAA' && player.contract?.years !== undefined) {
                      if (!['NHL', 'AHL'].includes(player.league)) {
                        // A college player's "contract" is eligibility, not term.
                        const scholarship = player.league === 'NCAA' || player.contract.isScholarship;
                        bits.push([`${player.contract.years} yrs ${scholarship ? 'elig' : 'left'}`, 'text-slate-400']);
                      } else {
                        const proSeasons = player.stats?.seasonsPlayed || 0;
                        const isRFA = player.age < 27 && proSeasons < 7;
                        const isELC = player.contract.salary === 925000 || (isRFA && proSeasons < 3);
                        bits.push([`${player.contract.years} yrs left`, 'text-slate-400']);
                        bits.push([
                          isELC ? 'ELC' : isRFA ? 'RFA' : 'UFA',
                          isELC ? 'text-[#22E748]' : isRFA ? 'text-[#F59E0B]' : 'text-[#c084fc]'
                        ]);
                      }
                    }
                    if (player.isCaptain) bits.push(['Captain', 'text-[#ef4444]']);
                    else if (player.isAlternate) bits.push(['Alternate', 'text-[#3b82f6]']);
                    bits.push([intlStatus.label, intlStatus.text]);
                    return bits.map(([text, cls], i) => (
                      <span key={text}>
                        {i > 0 && <span className="text-slate-700"> · </span>}
                        <span className={cls}>{text}</span>
                      </span>
                    ));
                  })()}
                </p>
              </div>
            </div>

            {/* The crest, and under it the year.
                The season used to open the metadata line, ahead of his age,
                his position and his deployment, which put the one fact that
                never changes within a season at the front of the four that
                describe the player. It sits with the badge now, where it
                reads as the date on the card rather than another attribute. */}
            <div className="shrink-0 flex flex-col items-center gap-1">
              <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center">
                <TeamLogo teamId={player.team} league={player.league} isAHL={isAHL} />
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-600 number-font leading-none whitespace-nowrap">
                {currentYear}/{String(nextYear).slice(2)}
              </span>
            </div>
          </div>

          {/* WHAT YOU HAVE DONE THIS YEAR.
              Labelled, which it never was: the same five numbers sat under the
              card with nothing saying whether they were this season, last
              season or a career. */}
          {/* The fifth column used to be time on ice when the season had it
              and plus-minus when it did not, so the same slot meant two
              different stats depending on which year you were looking at. A
              skater gets six fixed columns and a goalie four; neither moves.
              "GP" became "Games" to match the career strip below, which was
              labelling the identical quantity differently forty pixels
              away. */}
          <Strip title={inProgress ? 'This season' : 'Last season'} cols={isGoalie ? 4 : 6}>
            {isGoalie ? (
              <>
                <Cell value={ls.games || 0} label="Games" />
                <Cell tone="text-[#22E748]" label="SV%"
                      value={ls.shots > 0 ? (ls.saves / ls.shots).toFixed(3).replace('0.', '.') : '.000'} />
                <Cell label="GAA"
                      value={ls.games > 0 ? ((ls.shots - ls.saves) / ls.games).toFixed(2) : '0.00'} />
                <Cell tone="text-sky-400" value={ls.shutouts || 0} label="SHO" />
              </>
            ) : (
              <>
                <Cell value={ls.games || 0} label="Games" />
                <Cell tone="text-[#22E748]" value={ls.goals || 0} label="Goals" />
                <Cell value={ls.assists || 0} label="Assists" />
                <Cell value={(ls.goals || 0) + (ls.assists || 0)} label="Points" />
                <Cell value={ls.plusMinus > 0 ? `+${ls.plusMinus}` : (ls.plusMinus || 0)} label="+/-" />
                <Cell tone="text-sky-400" value={ls.avgToi ? toi : '--'} label="TOI" />
              </>
            )}
          </Strip>

          {/* WHAT YOU ARE MADE OF */}
          <Strip title="Attributes">
            {[
              { label: isGoalie ? 'Reflexes' : 'Shooting', key: 'shooting' },
              { label: isGoalie ? 'Position' : 'Skating', key: 'skating' },
              { label: isGoalie ? 'Agility' : 'Power', key: 'physicality' },
              { label: 'Hockey IQ', key: 'hockeyIQ' },
              { label: 'Stamina', key: 'stamina' }
            ].map(attr => {
              const change = statChanges ? statChanges[attr.key] : 0;
              const up = change > 0, down = change < 0;
              // The label carries the attribute's colour, the same one the
              // training cards and the shop rows use, so the five are
              // recognisable without reading them.
              const hue = STAT_TEXT[statCode(attr.key, isGoalie)] || 'text-slate-400';
              return (
                <div key={attr.key}
                     className={`relative px-0.5 py-2 flex flex-col justify-center items-center min-h-[48px] transition ${
                       up ? 'bg-[#22E748]/10 shadow-[inset_0_0_8px_rgba(34,231,72,0.15)]'
                         : down ? 'bg-[#ef4444]/10 shadow-[inset_0_0_8px_rgba(239,68,68,0.15)]' : ''}`}>
                  {up && <span className="absolute top-1 right-1 text-[#22E748] text-[8px] font-black leading-none">▲{change}</span>}
                  {down && <span className="absolute top-1 right-1 text-[#ef4444] text-[8px] font-black leading-none">▼{Math.abs(change)}</span>}
                  <p className={`text-lg sm:text-xl font-black number-font leading-none ${up ? 'text-[#22E748]' : down ? 'text-[#ef4444]' : 'text-white'}`}>
                    {getActiveStat(player, attr.key)}
                  </p>
                  <p className={`truncate px-0.5 mt-1 text-[7px] md:text-[8px] font-black uppercase tracking-normal ${up || down ? 'text-slate-400' : hue}`}>{attr.label}</p>
                </div>
              );
            })}
          </Strip>

          {/* WHAT YOU ARE PAID.
              A sixteen-year-old in the OHL has no salary, no market value and
              nothing in the bank, so this was three zeroes and the word
              AMATEUR taking up an inch of the card until his first contract. */}
          {(earnings > 0 || player.contract?.salary || player.stats?.value > 0) && (
          <div>
            <Heading>Contract &amp; earnings</Heading>
            <div className="grid grid-cols-3 bg-[#101410] border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden divide-x divide-[rgba(255,255,255,0.05)] text-center shadow-lg">
              <Cell value={formatMoney(earnings)} label="In the bank" tone="text-amber-300" />
              <Cell value={formatMoney(player.stats?.value || 0)} label="Market value" tone="text-sky-300" />
              <Cell
                value={player.contract?.salary ? formatMoney(player.contract.salary) : '--'}
                label={player.contract?.salary ? 'Salary / yr' : 'No deal'}
                tone={player.contract?.salary ? 'text-white' : 'text-slate-600'}
              />
            </div>
          </div>
          )}

          {/* WHERE YOU STAND WITH EVERYONE */}
          <div>
            <Heading>Fan status</Heading>
            <div className="bg-[#101410] border border-[rgba(255,255,255,0.08)] rounded-xl p-3 shadow-lg flex flex-col gap-3">
              {/* THE LADDER.
                  Two things were wrong with the last version. It was headed
                  "Reputation", which is not what this is called anywhere else
                  in the game. And a rung lit up as reached the moment the
                  points passed its threshold, ignoring the honours gate, so a
                  player on 640 fans who had won nothing saw Icon lit green
                  while the tier under his name still said Loved, a full gold
                  bar underneath, and a line about cups with nothing joining it
                  to any of that. The rungs now follow the tier he is actually
                  on, and a rung his points reach but his trophy case does not
                  is drawn as locked rather than earned. */}
              {(() => {
                const currentIdx = Math.max(0, FAN_LADDER.findIndex(t => t.label === tier.label));
                const floor = FAN_LADDER[currentIdx]?.at ?? 0;
                const ceil = tier.next || 1000;
                const gated = tier.req === 0 && !!tier.need;
                const atTop = tier.req === 0 && !tier.need;
                const pct = atTop || gated ? 100
                  : ((player.fanStatus - floor) / Math.max(1, ceil - floor)) * 100;

                return (
                  <div>
                    {/* The number itself, which was never actually printed. */}
                    <div className="flex items-baseline justify-between gap-2 mb-2.5">
                      <span className="text-2xl font-black number-font text-white leading-none">
                        {player.fanStatus}
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1.5">fans</span>
                      </span>
                      <span className="text-[11px] font-black uppercase tracking-widest text-[#F59E0B]">
                        {tier.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-5 gap-1">
                      {FAN_LADDER.map((t, i) => {
                        const passed = i < currentIdx;
                        const here = i === currentIdx;
                        // Points enough, honours not. Drawn amber and hollow
                        // rather than green, because it is not his yet.
                        const reachable = !here && !passed && player.fanStatus >= t.at;
                        return (
                          <div key={t.label} className="text-center">
                            <div className={`h-[3px] rounded-full mb-1.5 ${
                              here ? 'bg-[#F59E0B]'
                                : passed ? 'bg-[#22E748]/60'
                                  : reachable ? 'bg-[#F59E0B]/25'
                                    : 'bg-[rgba(255,255,255,0.08)]'}`} />
                            <p className={`text-[8px] font-black uppercase tracking-wide leading-none truncate ${
                              here ? 'text-[#F59E0B]'
                                : passed ? 'text-slate-300'
                                  : 'text-slate-600'}`}>
                              {t.label}
                            </p>
                            <p className={`text-[7px] font-bold number-font mt-0.5 leading-none ${
                              here ? 'text-[#F59E0B]/70' : 'text-slate-600'}`}>
                              {i === 0 ? '0' : t.at}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    <Bar pct={pct} color={fanBarColor(player.fanStatus)} className="mt-2.5" />

                    <p className="text-[10px] font-bold leading-snug mt-1.5 text-slate-500">
                      {atTop ? (
                        <span className="text-[#F59E0B]">Nothing left to prove to them.</span>
                      ) : gated ? (
                        <>
                          <span className="text-slate-300">You have the fans for {tier.nextLabel}. </span>
                          {tier.need}.
                        </>
                      ) : (
                        `${tier.req} more fans to reach ${tier.nextLabel}.`
                      )}
                    </p>
                  </div>
                );
              })()}

              {/* The three relationships were three stacked rows, each with a
                  long label of its own. Same three bars, side by side. */}
              <div className="pt-2.5 border-t border-[rgba(255,255,255,0.06)]">
              <Heading>In the room</Heading>
              <div className="grid grid-cols-3 gap-2.5">
                {rels.map(r => {
                  const v = player.relationships?.[r.key] ?? 50;
                  return (
                    <div key={r.key}>
                      <div className="flex items-baseline justify-between gap-1 mb-1">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest truncate">{r.label}</span>
                        <span className="text-[9px] font-black number-font text-slate-300 shrink-0">{v}</span>
                      </div>
                      <Bar pct={v} color={r.color} />
                    </div>
                  );
                })}
              </div>
              </div>
            </div>
          </div>

          {/* WHAT THE CAREER ADDS UP TO */}
          <div>
            <Heading>{bName} career</Heading>
            <div
              className="grid bg-[#101410] border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden divide-x divide-[rgba(255,255,255,0.05)] text-center shadow-lg"
              style={{ gridTemplateColumns: `repeat(${isGoalie ? 5 : 5}, minmax(0, 1fr))` }}
            >
              {(isGoalie
                ? [[cGP, 'Games', 'text-white'], [cSV, 'SV%', 'text-white'], [cGAA, 'GAA', 'text-white'], [cSHO, 'SHO', 'text-[#22E748]']]
                : [[cGP, 'Games', 'text-white'], [cG, 'Goals', 'text-white'], [cA, 'Assists', 'text-white'], [cPts, 'Points', 'text-[#22E748]']]
              ).concat([[trophies, 'Trophies', 'text-[#F59E0B]']]).map(([v, l, tone]) => (
                <Cell key={l} value={v} label={l} tone={tone} />
              ))}
            </div>

            {/* Measured against somebody, at last.
                Two named rows with a unit on each, rather than one shouting
                line of capitals and a bare "549 v 549" that did not say
                points, games or anything else. */}
            {rival && rival.career.seasons > 1 && (
              <div className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.06)]">
                <Heading>Your draft class</Heading>
                {[
                  { who: 'You', val: myCareerValue, mine: true },
                  { who: rival.name, val: rivalValue, mine: false }
                ].sort((x, y) => y.val - x.val).map(row => (
                  <div key={row.who} className="flex items-baseline justify-between gap-2 py-[3px]">
                    <span className={`text-xs truncate ${row.mine ? 'text-white font-bold' : 'text-slate-400 font-medium'}`}>
                      {row.who}
                      {!row.mine && rival.career.titles > 0 && (
                        <span className="text-[#F59E0B] text-[10px] font-bold">
                          {' '}{rival.career.titles === 1 ? '1 cup' : `${rival.career.titles} cups`}
                        </span>
                      )}
                      {!row.mine && rival.retired && <span className="text-slate-600 text-[10px] font-normal"> (retired)</span>}
                    </span>
                    <span className="shrink-0 text-xs number-font text-slate-300">
                      <span className={row.mine ? 'text-white font-black' : 'font-bold'}>{row.val}</span>
                      <span className="text-[9px] font-bold text-slate-600 ml-1">{compareUnit}</span>
                    </span>
                  </div>
                ))}
                <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                  {myCareerValue === rivalValue
                    ? 'Dead level with him.'
                    : `${Math.abs(myCareerValue - rivalValue)} ${isGoalie ? 'shutouts' : 'points'} ${
                        myCareerValue > rivalValue ? 'clear of him' : 'behind him'}.`}
                </p>
              </div>
            )}

          </div>

          {/* The two things you can actually do from the card. */}
          {(canShop || showMeeting) && (
            <div className="flex gap-2 mt-auto pt-1">
              {canShop && (
                <button
                  type="button"
                  onClick={onOpenShop}
                  className="flex-1 py-2.5 rounded-lg border border-[#22E748]/40 bg-[#22E748]/10 text-[#22E748] font-black sports-font uppercase tracking-[0.16em] text-xs hover:bg-[#22E748]/20 transition-colors cursor-pointer"
                >
                  Shop
                </button>
              )}
              {showMeeting && (
                <button
                  type="button"
                  onClick={callMeeting}
                  className="flex-1 py-2.5 rounded-lg border border-[#3b82f6]/40 bg-[#3b82f6]/10 text-[#3b82f6] font-black sports-font uppercase tracking-[0.16em] text-xs hover:bg-[#3b82f6]/20 transition-colors cursor-pointer"
                >
                  Team meeting
                </button>
              )}
            </div>
          )}

          {/* Retiring ends the save. It was a full-width red button sitting
              directly under the shop, which made a permanent decision look like
              one of two routine ones. */}
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Are you sure you want to retire? This will end your career permanently and calculate your final score.')) onRetire();
            }}
            className="self-center text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 hover:text-[#ef4444] transition-colors cursor-pointer py-1 shrink-0"
          >
            Retire Now
          </button>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
