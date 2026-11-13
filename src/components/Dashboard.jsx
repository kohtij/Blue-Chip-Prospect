import { getTeamData, nationalities } from '../data/teams';
import { careerTrophies, formatMoney, getActiveStat, ordinal, resolveRole, summariseStints } from '../utils/gameHelpers';
import { getFullTeamName } from '../utils/appHelpers';
import { clubOutlook, teamStrengthOf } from '../utils/leagueState';
import { compGroup, findRival, groupName, leagueFlag, leagueLabel, peerStatLine, peerUnit, peerValue, playerCareerValue, playerStatLine, scoutingBoard } from '../utils/peers';
import { isDefence } from '../utils/production';
import { COACH_SYSTEMS, depthAhead, goaliePartner, lineFor, roomFor } from '../utils/roster';
import { STAT_TEXT, statCode } from '../utils/statColors';
import TeamLogo from './TeamLogo';
import LeagueTag from './LeagueTag';

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
    {/* A goalie's record is three numbers and two dashes in a cell built for
        two digits, so a long value steps down a size rather than spilling. */}
    <p className={`font-black number-font leading-none whitespace-nowrap ${tone} ${
      String(value).length > 8 ? 'text-[10px] sm:text-xs'
        : String(value).length > 6 ? 'text-xs sm:text-sm'
          : String(value).length > 4 ? 'text-sm sm:text-base'
            : 'text-lg sm:text-xl'}`}>{value}</p>
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

// The scouting board's one scoring figure: points for a skater, save
// percentage for a goalie, and a dash for a prospect who has not played,
// because nought points in nought games is not a fact about him. The unit is
// named in the column header, so the cell is a bare number.
const boardStat = (r, goalie) => {
  if (goalie) return r.sv != null ? r.sv.toFixed(3).replace('0.', '.') : '—';
  return (r.pts != null && r.gp) ? r.pts : '—';
};

// The ladder the fan status climbs. These thresholds are getFanTier's, and
// the point of showing all five is that a player can see the one he is on and
// the one he is working toward instead of a bare number.
const FAN_LADDER = [
  { label: 'Unknown', at: 0 },
  { label: 'Known', at: 100 },
  { label: 'Loved', at: 300 },
  { label: 'Icon', at: 600 },
  { label: 'Legend', at: 900 }
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
  const isDman = isDefence(player.pos);
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
        : f < 900 ? 'linear-gradient(90deg, color-mix(in srgb, #F59E0B 55%, #78350f), #fbbf24)'
          : 'linear-gradient(90deg, color-mix(in srgb, #22E748 55%, #14532d), #4ade80)';

  const activeBucket = ['OHL', 'WHL', 'QMJHL', 'USHL', 'J20', 'U20', 'NCAA', 'SHL', 'LIIGA'].includes(player.league)
    ? 'chl' : (player.league === 'AHL' ? 'ahl' : 'nhl');
  const bName = activeBucket === 'nhl' ? 'NHL' : activeBucket === 'ahl' ? 'AHL' : 'PRE-NHL';

  const cGP = player.stats?.[activeBucket]?.games || 0;
  const cG = player.stats?.[activeBucket]?.goals || 0;
  const cA = player.stats?.[activeBucket]?.assists || 0;
  const cPts = cG + cA;
  const cBLK = player.stats?.[activeBucket]?.blocks || 0;
  // A forward's career rates. Shooting percentage is the mirror of the save
  // percentage a goalie has always had, and the faceoff percentage is the one
  // number on a stat sheet that belongs to centres and to nobody else.
  const cSOG = player.stats?.[activeBucket]?.sog || 0;
  const cFOT = player.stats?.[activeBucket]?.fot || 0;
  const cFOW = player.stats?.[activeBucket]?.fow || 0;
  // The sign lives in the label, not in the value. Six cells across a phone
  // leave about fifty pixels of room and a five-character number at this size
  // needs sixty-eight, so "54.7%" was pushing itself out of its own box. The
  // goalie's save percentage has read ".912" under an SV% label since the card
  // was written, which is the same answer.
  const cShPct = cSOG > 0 ? ((cG / cSOG) * 100).toFixed(1) : '--';
  const cFOPct = cFOT > 0 ? ((cFOW / cFOT) * 100).toFixed(1) : '--';
  const cShots = player.stats?.[activeBucket]?.shots || 0;
  const cSaves = player.stats?.[activeBucket]?.saves || 0;
  const cSHO = player.stats?.[activeBucket]?.shutouts || 0;
  const cW = player.stats?.[activeBucket]?.wins || 0;
  const cL = player.stats?.[activeBucket]?.losses || 0;
  const cOTL = player.stats?.[activeBucket]?.otl || 0;
  const cRecord = `${cW}-${cL}-${cOTL}`;
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
    coachTrust: player.relationships?.coach ?? 50,
    // The men already doing his job, so the card and the engine cannot say
    // different things about what line he is on.
    depth: depthAhead(roomFor(player.rooms, player.team), player.pos, player.ovr)
  });

  // The one from your draft class whose career is the measuring stick.
  // Goalies used to get nothing here, because every peer function filtered
  // them out. They are ranked on shutouts rather than points.
  // Counting the half of the job the scoresheet does not: a defenceman is
  // ranked against his classmates on his points and his goal difference.
  const myCareerValue = playerCareerValue(player);
  const rival = findRival(player.peers, myCareerValue, player.pos);
  const rivalValue = rival ? peerValue(rival, player.pos) : 0;
  const compareUnit = peerUnit(player.pos);
  const myGroup = groupName(compGroup(player.pos));

  // Before the draft there are no careers to compare, so this panel showed
  // nothing at all for the two or three seasons when the question "who else
  // is in my year" is most on the player's mind. What exists then is the
  // scouting board, the same comparison in the only currency a seventeen-year-
  // old has: where he is ranked and who is next to him.
  const undrafted = !player.draftTeam && !player.rights;
  const board = undrafted ? scoutingBoard(player.peers, player, 3) : null;
  // Which way he has moved since the last board, which the recap screen has
  // always shown him and the card never did.
  const boardMove = board?.myRank && player.prevScoutRank
    ? player.prevScoutRank - board.myRank
    : 0;
  const boardIsGoalie = board?.group === 'G';

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
      desc: 'As captain, you can shut the dressing room door and talk to the team. A good speech lifts the room. Do it too often and they stop listening.',
      choices: [
        {
          label: 'Deliver a Fiery Speech', isRisky: true, successChance: 0.65,
          successFeedback: 'Nobody said a word while you talked, and they went out of that room flying.',
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

  // WHO IS IN THE ROOM WITH HIM.
  //
  // Four names at most, chosen by what they are to him rather than by rating:
  // the men he plays with, the one directly in front of him on the depth
  // chart, and the captain. A goaltender's first name is always the other
  // goaltender, because that is the relationship his season turns on.
  const myRoom = roomFor(player.rooms, player.team);
  const coachHere = (player.coaches || {})[player.team] || null;
  const roomMen = (() => {
    if (!myRoom) return [];
    const out = [];
    const seen = new Set();
    const add = (m, tag, tagTone) => {
      if (!m || seen.has(m.id)) return;
      seen.add(m.id);
      out.push({ ...m, tag, tagTone });
    };
    // Said in words. The tags were NET, LINE, AHEAD and CAPT, which read as
    // codes: NET could have been anything, and nobody knew why one name had a
    // (C) after it.
    const isG = player.pos === 'G';
    const isDman = player.pos === 'LD' || player.pos === 'RD';
    if (isG) add(goaliePartner(myRoom), 'The other goalie', 'text-[#F59E0B]');
    lineFor(myRoom, player.pos).forEach(m => add(m,
      isG ? 'Plays in front of you' : isDman ? 'Your defence partner' : 'Your linemate',
      'text-[#22E748]'));
    const rival = myRoom.men
      .filter(m => m.pos === player.pos && m.ovr > (player.ovr || 0))
      .sort((a, b) => a.ovr - b.ovr)[0];
    add(rival, isG ? 'Ahead of you for the net' : 'Ahead of you on the depth chart', 'text-[#ef4444]');
    add(myRoom.men.find(m => m.captain && m.pos !== 'G'), 'Captain', 'text-slate-400');
    return out.slice(0, 4);
  })();

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
                    and drifts for years, and that is what decides the standings
                    now. Until this line nothing anywhere told the player any of
                    it, so the window opened and closed around him
                    invisibly. */}
                <div className="flex items-baseline gap-2 min-w-0">
                  {/* Grey, like every other label on the card. A blue club
                      name next to a coloured outlook next to a coloured status
                      line put three different highlight colours in the top
                      inch, and the eye had nowhere to rest. */}
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 truncate">
                    {getFullTeamName(player.team, player.league)}
                  </p>
                  {/* WHICH LEAGUE HE IS ACTUALLY IN.
                      The card named his club and never his league, so a player
                      sent down read "San Jose Barracuda" and nothing else: the
                      biggest thing that can happen to a season was legible only
                      if you already knew which clubs were farm clubs. The chip
                      is grey in the top league he could be in and amber below
                      it, so a demotion is visible from across the room and a
                      recall is visible the same way. */}
                  <span className={`shrink-0 text-[9px] font-black uppercase tracking-widest px-1.5 py-[2px] rounded border ${
                    ['AHL', 'ECHL'].includes(player.league)
                      ? 'text-[#F59E0B] border-[rgba(245,158,11,0.45)] bg-[rgba(245,158,11,0.10)]'
                      : 'text-slate-400 border-[rgba(255,255,255,0.12)]'}`}>
                    {player.league}
                  </span>
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
          <Strip title={inProgress ? 'This season' : 'Last season'} cols={isGoalie ? 4 : isDman ? 5 : 6}>
            {isGoalie ? (
              <>
                <Cell value={ls.games || 0} label="Games" />
                <Cell tone="text-[#22E748]" label="SV%"
                      value={ls.shots > 0 ? (ls.saves / ls.shots).toFixed(3).replace('0.', '.') : '.000'} />
                <Cell label="GAA"
                      value={ls.games > 0 ? ((ls.shots - ls.saves) / ls.games).toFixed(2) : '0.00'} />
                <Cell tone="text-sky-400" value={ls.shutouts || 0} label="SHO" />
              </>
            ) : isDman ? (
              /* A defenceman's own five.
                 A goalie has had a strip built for the way he is judged since
                 the card was written, and a defenceman was reading the
                 forwards': goals, assists, points, and the two numbers his job
                 is actually made of tacked on at the end. These are five
                 counting stats a reader can check against a real stat sheet.
                 There was a sixth cell here with a mark out of ten on it, and
                 a grade the game works out for itself is not a stat: it tells
                 him what to think of his season instead of telling him what
                 happened in it. The engine still computes it, where it decides
                 the awards and where his career lands. He reads the numbers. */
              <>
                <Cell value={ls.games || 0} label="Games" />
                <Cell tone="text-[#22E748]" value={ls.goals || 0} label="Goals" />
                <Cell value={ls.assists || 0} label="Assists" />
                <Cell tone="text-[#c084fc]" value={ls.blocks || 0} label="Blocks" />
                <Cell tone="text-sky-400" value={ls.avgToi ? toi : '--'} label="TOI" />
              </>
            ) : (
              /* A forward's six, and a centre's six is not a winger's.
                 This was the strip every position read before the goalie and
                 then the defenceman were given their own, and the two cells at
                 the end were the weakest on the card: a plus-minus, which is
                 four other men's work, and the minutes, which say what the
                 coach thinks rather than what he did. Shots and the percentage
                 he finished them at are his, and they are what tells a sniper
                 from a distributor on a page where both of them had thirty
                 goals. A centre trades the shot volume for the draws, because
                 nobody else on the ice takes one. */
              <>
                <Cell value={ls.games || 0} label="Games" />
                <Cell tone="text-[#22E748]" value={ls.goals || 0} label="Goals" />
                <Cell value={ls.assists || 0} label="Assists" />
                <Cell value={(ls.goals || 0) + (ls.assists || 0)} label="Points" />
                {player.pos === 'C' ? (
                  <Cell tone="text-[#c084fc]" label="FO%"
                        value={ls.fot > 0 ? ((ls.fow / ls.fot) * 100).toFixed(1) : '--'} />
                ) : (
                  <Cell tone="text-sky-400" value={ls.sog || 0} label="SOG" />
                )}
                <Cell tone="text-[#F59E0B]" label="S%"
                      value={ls.sog > 0 ? (((ls.goals || 0) / ls.sog) * 100).toFixed(1) : '--'} />
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

          {/* WHERE YOU STAND WITH EVERYONE.
              Headed "Fan status" while it only held the fan ladder. It now
              holds the room, the coach and the media as well, so the heading
              names the whole panel and the fans are its first part. */}
          <div>
            <Heading>Where you stand</Heading>
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
                const ceil = tier.next || 900;
                const gated = tier.req === 0 && !!tier.need;
                const atTop = tier.req === 0 && !tier.need;
                const pct = atTop || gated ? 100
                  : ((player.fanStatus - floor) / Math.max(1, ceil - floor)) * 100;

                return (
                  <div>
                    {/* The number itself, which was never actually printed. */}
                    <div className="flex items-baseline justify-between gap-2 mb-2.5">
                      <span className="text-2xl font-black number-font text-white leading-none">
                        {Math.round(player.fanStatus || 0)}
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
                        <span className="text-[#F59E0B]">Nothing left to prove.</span>
                      ) : gated ? (
                        <>
                          <span className="text-slate-300">You have the fans for {tier.nextLabel}. </span>
                          {tier.need}.
                        </>
                      ) : (
                        `${Math.round(tier.req)} more fans to reach ${tier.nextLabel}.`
                      )}
                    </p>
                  </div>
                );
              })()}

              {/* The three relationships were three stacked rows, each with a
                  long label of its own. Same three bars, side by side. */}
              <div className="pt-2.5 border-t border-[rgba(255,255,255,0.06)]">
              <Heading>In the room</Heading>

              {/* THE MEN, NOT THE NUMBER.
                  "In the room" was three bars and nobody in it. The club he
                  turns up to every day now has names, and these are the four
                  that matter to him: who he plays with, who wants his job, and
                  who wears the letter. The bar underneath each is what that man
                  thinks of him. See utils/roster.js. */}
              {!!roomMen.length && (
                <div className="mb-3 space-y-1.5">
                  <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-slate-600">
                    <span className="min-w-0 flex-1" />
                    <span className="shrink-0 w-7 text-right">Pos</span>
                    <span className="shrink-0 w-6 text-right">Ovr</span>
                    <span className="shrink-0 w-12 text-right">His view</span>
                  </div>
                  {roomMen.map(m => (
                    <div key={m.id} className="flex items-center gap-2">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[11px] text-slate-300 font-medium leading-tight">{m.name}</span>
                        <span className={`block truncate text-[9px] font-bold leading-tight ${m.tagTone}`}>
                          {m.tag}{m.captain && m.pos !== 'G' && m.tag !== 'Captain' ? ' · Captain' : ''}
                        </span>
                      </span>
                      <span className="shrink-0 text-[9px] font-black uppercase tracking-widest text-slate-600 w-7 text-right">{m.pos}</span>
                      <span className="shrink-0 number-font text-[10px] text-slate-400 w-6 text-right">{m.ovr}</span>
                      <span className="shrink-0 w-12"><Bar pct={m.trust ?? 50} color={(m.trust ?? 50) >= 60 ? '#22E748' : (m.trust ?? 50) >= 40 ? '#F59E0B' : '#ef4444'} /></span>
                    </div>
                  ))}
                  {!!coachHere && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[11px] text-slate-300 font-medium leading-tight">{coachHere.name}</span>
                        <span className="block truncate text-[9px] font-bold leading-tight text-sky-400">Head coach</span>
                      </span>
                      <span className="shrink-0 text-[9px] font-black uppercase tracking-widest text-slate-600 text-right">
                        {COACH_SYSTEMS[coachHere.system]?.label || ''}
                      </span>
                    </div>
                  )}
                </div>
              )}

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
                // A goalie's career was five numbers without the one he is
                // actually remembered by. Games goes: the record contains it.
                ? [[cRecord, 'W-L-OTL', 'text-white'], [cSV, 'SV%', 'text-white'], [cGAA, 'GAA', 'text-white'], [cSHO, 'SHO', 'text-[#22E748]']]
                : isDman
                  // A goalie's career line has been his own since the card was
                  // written. A defenceman's was the forwards', so nine hundred
                  // games of blocking shots and holding a plus had nowhere to
                  // appear.
                  ? [[cGP, 'Games', 'text-white'], [cG, 'Goals', 'text-white'],
                     [cA, 'Assists', 'text-white'], [cBLK, 'Blocks', 'text-[#c084fc]']]
                  // A forward's career, with the rate he is actually known
                  // by in it. Assists come off because points minus goals is
                  // the one cell a reader can do in his head, and the slot is
                  // worth more to the number that cannot be derived from the
                  // other four.
                  : player.pos === 'C'
                    ? [[cGP, 'Games', 'text-white'], [cG, 'Goals', 'text-white'],
                       [cPts, 'Points', 'text-[#22E748]'], [cFOPct, 'FO%', 'text-[#c084fc]']]
                    : [[cGP, 'Games', 'text-white'], [cG, 'Goals', 'text-white'],
                       [cPts, 'Points', 'text-[#22E748]'], [cShPct, 'S%', 'text-[#F59E0B]']]
              ).concat([[trophies, 'Trophies', 'text-[#F59E0B]']]).map(([v, l, tone]) => (
                <Cell key={l} value={v} label={l} tone={tone} />
              ))}
            </div>

            {/* THE BOARD, DRAWN AS A BOARD.
                It was two rows in which the same slot meant two different
                things: "10 of 19" under his own name and "9 SHL" under the
                name above it, so the small grey text after the bold number was
                a class size on one line and a league on the other, and the
                two bold numbers were a rank both times but did not look like a
                sequence. Neither row said anything at all about why one of
                them was ninth and the other tenth, which makes a ranking a
                number to take on faith.

                Every column means one thing on every row now: the place, who,
                where he plays, and what he did last season, written the same
                way the free agency comparables write it. The size of the class
                moves up beside the heading, where it belongs, because it is a
                fact about the board rather than about him. */}
            {board?.myRank && board.near?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.06)]">
                <div className="flex items-baseline justify-between gap-2">
                  <Heading>Your draft year</Heading>
                  <span className="shrink-0 text-[10px] font-bold text-slate-400 tabular-nums">
                    {ordinal(board.myRank)}<span className="text-slate-600"> of {board.total}</span>
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 leading-snug mb-2">
                  Scouts&rsquo; order of the {myGroup} in your class. Numbers are last season.
                </p>

                {/* The header names each unit once, so no cell has to carry a
                    suffix. The draft-class block below works to the same rule.
                    Note the absence of number-font on the figures: that class
                    sets text-transform uppercase, so any cell with a word in it
                    comes out shouting, which is half of why the old pair of rows
                    looked the way they did. tabular-nums is what was wanted
                    here, and it lines the digits up into columns. */}
                <div className="flex items-center gap-2 pb-1 border-b border-[rgba(255,255,255,0.06)]
                                text-[8.5px] font-black uppercase tracking-[0.12em] text-slate-600">
                  <span className="w-4 text-right shrink-0">#</span>
                  <span className="min-w-0 flex-1">Player</span>
                  <span className="hidden sm:block w-14 shrink-0">League</span>
                  <span className="w-9 text-right shrink-0">{boardIsGoalie ? 'Sv%' : 'Pts'}</span>
                  <span className="w-6 text-right shrink-0">GP</span>
                </div>

                {board.near.map(r => (
                  <div
                    key={r.id}
                    className={`flex items-center gap-2 py-[3.5px] ${
                      r.me ? '-mx-1 px-1 rounded bg-[rgba(34,231,72,0.08)]' : ''}`}
                  >
                    <span className={`w-4 text-right shrink-0 text-[11px] tabular-nums ${
                      r.me ? 'text-[#22E748] font-black' : 'text-slate-600 font-bold'}`}>
                      {r.rank}
                    </span>
                    <span className={`min-w-0 flex-1 truncate text-xs ${
                      r.me ? 'text-white font-black' : 'text-slate-300 font-medium'}`}>
                      {r.me ? 'You' : r.name}
                      {/* Narrow enough to lose the league column and the point
                          totals stop meaning anything, because fifty in the
                          SHL is not fifty in the USHL. It rides with the name
                          instead of disappearing. */}
                      {r.league && (
                        <span className="sm:hidden font-medium text-slate-600">
                          {' · '}
                          {leagueFlag(r.league) && (
                            <img src={leagueFlag(r.league)} alt=""
                                 className="inline-block w-[11px] h-[8px] object-cover rounded-[1px] mr-[3px]" />
                          )}
                          {leagueLabel(r.league)}
                        </span>
                      )}
                    </span>
                    <span className="hidden sm:flex w-14 shrink-0 items-center gap-1 text-[9.5px] font-bold text-slate-500">
                      <LeagueTag league={r.league} flagClass="w-[13px] h-[9px]" />
                    </span>
                    <span className={`w-9 text-right shrink-0 text-[11px] tabular-nums ${
                      r.me ? 'text-white font-black' : 'text-slate-400 font-bold'}`}>
                      {boardStat(r, boardIsGoalie)}
                    </span>
                    <span className={`w-6 text-right shrink-0 text-[10px] tabular-nums ${
                      r.me ? 'text-slate-300 font-bold' : 'text-slate-600 font-medium'}`}>
                      {r.gp || '—'}
                    </span>
                  </div>
                ))}

                <p className="text-[10px] text-slate-500 mt-1.5 leading-snug">
                  {board.myRank === 1
                    ? 'Nobody in your year is ranked above you.'
                    : `${board.ahead?.name || 'The man above you'} is the one to pass.`}
                  {boardMove !== 0 && (
                    <span className={boardMove > 0 ? 'text-[#22E748]' : 'text-[#ef4444]'}>
                      {` ${boardMove > 0 ? 'Up' : 'Down'} ${Math.abs(boardMove)} ${
                        Math.abs(boardMove) === 1 ? 'place' : 'places'} since last winter.`}
                    </span>
                  )}
                </p>
              </div>
            )}

            {/* YOUR DRAFT CLASS.
                Two names, a number each and "291 PTS" in nine-point grey,
                with no statement anywhere of what was being compared or to
                whom. It was also comparing across positions, so a goalie was
                shown a career point total and a shutdown defenceman was told
                he was four hundred behind the best centre in his year. The
                line under the heading now says the group and the measure
                once, which means the numbers themselves need no suffix. */}
            {rival && rival.career.seasons > 1 && (
              <div className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.06)]">
                <Heading>Your draft class</Heading>
                <p className="text-[10px] text-slate-500 leading-snug mb-2">
                  Career {compareUnit}, against the best of the {myGroup} in your year.
                </p>
                {[
                  { who: 'You', val: myCareerValue, line: playerStatLine(player), mine: true },
                  { who: rival.name, val: rivalValue, line: peerStatLine(rival, player.pos), mine: false }
                ].sort((x, y) => y.val - x.val).map((row, i) => (
                  <div key={row.who}
                       className={`flex items-center justify-between gap-3 py-1.5 ${
                         i === 0 ? 'border-b border-[rgba(255,255,255,0.05)]' : ''}`}>
                    <div className="min-w-0">
                      <p className={`text-xs truncate ${row.mine ? 'text-white font-black' : 'text-slate-300 font-medium'}`}>
                        {row.who}
                      </p>
                      {/* A defenceman's number is two numbers added together,
                          so the two have to be legible underneath it. Without
                          this the card showed him a 592 and no way of telling
                          which half of his game it came from. */}
                      {isDman && (
                        <p className="text-[10px] text-slate-600 leading-tight mt-0.5 ">{row.line}</p>
                      )}
                      {!row.mine && (rival.career.titles > 0 || rival.retired) && (
                        <p className="text-[10px] leading-tight mt-0.5">
                          {rival.career.titles > 0 && (
                            <span className="text-[#F59E0B] font-bold">
                              {rival.career.titles === 1 ? '1 cup' : `${rival.career.titles} cups`}
                            </span>
                          )}
                          {rival.career.titles > 0 && rival.retired && <span className="text-slate-700"> · </span>}
                          {rival.retired && <span className="text-slate-600">retired</span>}
                        </p>
                      )}
                    </div>
                    {/* A DEFENCEMAN GETS NO BLENDED NUMBER.
                        His rank comes from points plus a quarter of his
                        blocks, which put a bare 491 on the card next to a line
                        reading "238 points and 1010 blocks" and left the
                        reader to work out what the third number was. It exists
                        to order these two rows and nothing else, so it can do
                        that without being printed. A forward's figure is his
                        points and a goalie's is his shutouts, which say what
                        they are. */}
                    {!isDman && (
                      <span className={`shrink-0 number-font ${
                        row.mine ? 'text-white font-black text-base' : 'text-slate-300 font-bold text-sm'}`}>
                        {row.val}
                      </span>
                    )}
                  </div>
                ))}
                <p className="text-[10px] text-slate-500 mt-1.5 leading-snug">
                  {myCareerValue === rivalValue
                    ? 'Dead level with him.'
                    : isDman
                      // "120 points and plus-minus clear of him" is not a
                      // sentence. For a defenceman the two halves are reported
                      // as the two things they are.
                      ? (() => {
                          const pts = cPts - ((rival.career.g || 0) + (rival.career.a || 0));
                          const blk = cBLK - (rival.career.blk || 0);
                          const half = (n, unit) => n === 0 ? `level on ${unit}`
                            : `${Math.abs(n)} ${unit} ${n > 0 ? 'up' : 'down'}`;
                          return `${half(pts, 'points')}, ${half(blk, 'blocks')}.`;
                        })()
                      : `${Math.abs(myCareerValue - rivalValue)} ${compareUnit} ${
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
