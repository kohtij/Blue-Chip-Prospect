import { useState } from 'react';
import { useAppContext } from '../AppContext';
import { getFullTeamName } from '../utils/appHelpers';
import { ordinal, rightsExpiryYear, withTeamArticle } from '../utils/gameHelpers';
import { classSalt, compGroup, draftBoard, flagFor, groupName, positionDraftSlot, roomProspect } from '../utils/peers';
import LeagueTag from '../components/LeagueTag';
import { euroLeagues, getTeamData, juniorLeagues, readableAccent, teamAccent } from '../data/teams';
import { leagueLabel } from '../utils/peers';
import { kickerClass, TITLE_LG, TITLE_SM } from '../utils/ui';

export default function DraftScreen() {
  const { TeamLogo, handleDraftChoice, player, seasonRecap } = useAppContext();

  const isFirstRound = seasonRecap?.draftPick <= 32;

  // The night as it was run (see utils/draftNight.js). A save drafted before
  // the room was simulated has none, and falls back to the old board.
  const night = player.draftNight && player.draftNight.myPick === seasonRecap?.draftPick ? player.draftNight : null;

  // Drawn once, so the room doesn't reshuffle while the player reads it.
  const [board] = useState(() => {
    if (!seasonRecap?.draftPick) return null;
    if (!night) return draftBoard(player.peers, seasonRecap.draftPick, player.name, 3, player.leagueState, seasonRecap.draftedBy?.id);
    // Past the second round the game doesn't run the room pick by pick, so
    // the picks around a late one are the rest of the room, in standard order.
    const byPick = new Map(night.picks.map(r => [r.pick, r]));
    const salt = classSalt(player.peers);
    const taken = new Set(night.picks.map(r => r.name));
    // There are 224 picks and no more: the board around the last one stops at it.
    const at = (n) => {
      if (n < 1 || n > 224) return null;
      const r = byPick.get(n);
      if (r) return { name: r.name, pick: n, pos: r.pos, flag: flagFor(r.nat), team: r.team, via: r.from, from: r.juniorTeam, fromLeague: r.juniorLeague };
      const x = roomProspect(salt, n, taken);
      return { name: x.name, pick: n, pos: x.pos, flag: flagFor(x.nat), team: night.standard?.[(n - 1) % (night.standard?.length || 32)] || null, from: x.juniorTeam, fromLeague: x.juniorLeague };
    };
    const me = night.myPick;
    return {
      before: [me - 3, me - 2, me - 1].map(at).filter(Boolean),
      after: [me + 1, me + 2, me + 3].map(at).filter(Boolean),
      via: night.myFrom
    };
  });

  // PASSED OVER. The whole night went by without his name.
  if (seasonRecap?.undrafted) {
    const nextAgeOut = juniorLeagues.includes(player.league) ? 21 : 22;
    const againNextYear = (player.age + 1) < nextAgeOut;
    const isUSHL = player.league === 'USHL';
    const backLabel = player.league === 'NCAA' ? 'BACK TO THE NCAA'
      : euroLeagues.includes(player.league) ? `BACK TO ${leagueLabel(player.league).toUpperCase()}`
        : 'BACK TO JUNIORS';
    return (
      <div className="game-panel p-6 sm:p-10 mt-2 text-center relative">
        <h1 className={`${TITLE_SM} mb-6`}>The {seasonRecap.draftYear} NHL Draft</h1>
        {/* Straight on the panel. It sat in a box of its own inside it, a
            card on a card holding nothing but three lines of text. */}
        <div className="mt-2 mb-8 max-w-2xl mx-auto flex flex-col items-center">
          <h2 className={`${TITLE_LG}`}>Not drafted</h2>
          <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed max-w-lg">
            All 224 picks went by, and none of them had your name on it.
          </p>
          <p className="mt-3 text-sm sm:text-base text-slate-400 leading-relaxed max-w-lg">
            {againNextYear
              ? "You're eligible again next summer, and clubs take a second look at a player who's still getting better a year later. Plenty of NHL players were never drafted at all."
              : "That was your last draft. The way in from here is a free-agent deal, and plenty of NHL players were never drafted at all."}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <button onClick={() => handleDraftChoice('UNDRAFTED')} className="btn-primary py-4 px-6 rounded-xl text-sm sm:text-base cursor-pointer sports-font tracking-widest w-full sm:w-auto">
            {backLabel}
          </button>
          {isUSHL && (
            <button onClick={() => handleDraftChoice('EXPLORE_OPTIONS')} className="btn-secondary py-4 px-6 rounded-xl text-sm sm:text-base cursor-pointer sports-font tracking-widest w-full sm:w-auto">
              EXPLORE OPTIONS
            </button>
          )}
        </div>
      </div>
    );
  }

  // The night around him: the lottery, and why the club that took him did.
  const clubName = (id) => withTeamArticle(getFullTeamName(id, 'NHL'), 'NHL');
  const ClubName = (id) => withTeamArticle(getFullTeamName(id, 'NHL'), 'NHL', true);
  const lotteryLine = night?.lottery?.length
    ? night.lottery.map(w => {
      const drew = w.draw === 2 ? 'the second draw' : 'the draft lottery';
      return w.capped
        ? `${ClubName(w.teamId)} won ${drew} from ${ordinal(w.from)}, but a club can only move up ten places, so they pick ${ordinal(w.to)}.`
        : `${ClubName(w.teamId)} won ${drew} and moved up from ${ordinal(w.from)} to ${ordinal(w.to)}.`;
    }).join(' ')
    : null;
  const reasonLine = (() => {
    if (!night?.reason) return null;
    const gm = night.reason.gm;
    const said = [];
    for (const l of night.reason.lines || []) {
      if (l.kind === 'traded') said.push(`${ClubName(night.myTeam)} made this pick with one they got from ${clubName(l.from)}.`);
      if (!gm) continue;
      const who = `General Manager ${gm}`;
      if (l.kind === 'need') said.push(`${who} came into the night short of ${l.group} in the system.`);
      if (l.kind === 'likes') said.push(`${who} has always liked ${l.group}.`);
      if (l.kind === 'nation') said.push(`${who} leans on his ${l.adj} scouts more than most.`);
      if (l.kind === 'route') said.push(`${who} likes ${l.text}.`);
      if (l.kind === 'upside') said.push(`${who} drafts for ceiling over certainty.`);
      if (l.kind === 'safe') said.push(`${who} prefers prospects he's sure about.`);
    }
    return said.length ? said.join(' ') : null;
  })();

  // The club that took him. Its colour takes over the panel's strip and wash
  // for this one screen, the way the player's own club's does everywhere else.
  const clubId = seasonRecap?.draftedBy?.id;
  const accent = teamAccent(getTeamData(clubId, 'NHL'));
  const accentText = readableAccent(accent);
  const pick = seasonRecap?.draftPick;

  // How many players at his position the whole draft took before him. The
  // night is run pick by pick and kept, so this is a count, not an estimate.
  // It used to be told only against the classmates the scouts followed, about
  // one pick in eight, which made the 57th pick "the 2nd left winger taken"
  // when a real draft has taken eight or nine by then.
  const draftSlot = (() => {
    if (!pick) return null;
    const group = compGroup(player.pos);
    if (night) return night.picks.filter(r => !r.me && r.pick < night.myPick && compGroup(r.pos) === group).length + 1;
    return positionDraftSlot(player.peers, player.pos, pick).draftSlot;
  })();
  const takenLine = draftSlot
    ? `You were the ${draftSlot === 1 ? 'first' : ordinal(draftSlot)} ${groupName(compGroup(player.pos), false)} taken.`
    : null;

  return (
    <div className="game-panel p-6 sm:p-10 mt-2 text-center relative" style={accent ? { '--club': accent } : undefined}>

      {/* THE CALL.
          It sat in a box of its own inside the panel, a card on a card, with
          a bright blue banner across the top of it. It's straight on the panel
          now, the way the playoff screen is, with the drafting club's colour on
          the panel itself. The round and pick keep the banner's wording. */}
      <div className="flex flex-col items-center max-w-2xl mx-auto mb-7">
        <h1 className={TITLE_SM}>
          {seasonRecap?.draftYear ? `The ${seasonRecap.draftYear} NHL Draft` : 'The NHL Draft'}
        </h1>
        <p className="mt-2 sports-font text-sm sm:text-base font-black uppercase tracking-[0.22em] text-slate-300 tabular-nums">
          Round {seasonRecap?.draftRound}<span className="mx-2.5" style={{ color: accentText }}>•</span>Pick {pick}
        </p>

        <div className="mt-4">
          <TeamLogo teamId={clubId} league="NHL" size="hero" />
        </div>

        <p className="mt-4 text-[11px] sm:text-xs font-black uppercase tracking-[0.18em] leading-snug" style={{ color: accentText }}>
          {withTeamArticle(getFullTeamName(clubId, 'NHL'), 'NHL', true)} select
        </p>

        <h2 className={`${TITLE_LG} mt-2 w-full break-words`}>{player.name}</h2>

        <div className="flex items-center justify-center flex-wrap gap-x-2 gap-y-1 mt-3">
          {flagFor(player.nat)
            ? <img src={flagFor(player.nat)} alt="" className="w-6 h-[17px] object-cover rounded-[1px]" />
            : null}
          <span className="text-[11px] font-black uppercase tracking-wider text-white">
            {player.nat}
            <span className="text-slate-500"> · </span>{player.pos}
            {player.archetype && (player.archetypeChosen || (player.stats?.seasonsPlayed || 0) > 0)
              ? <><span className="text-slate-500"> · </span>{player.archetype}</>
              : null}
          </span>
        </div>

        {seasonRecap?.juniorTeam && (
          <p className="flex items-center justify-center flex-wrap gap-1.5 mt-2 text-xs sm:text-sm text-slate-400">
            <span>From {withTeamArticle(getFullTeamName(seasonRecap.juniorTeam, seasonRecap.juniorLeague), seasonRecap.juniorLeague)}</span>
            {seasonRecap.juniorLeague && <LeagueTag league={seasonRecap.juniorLeague} flagClass="w-[14px] h-[10px]" />}
          </p>
        )}
      </div>

      {/* THE BOARD.
          A pick used to be a name, a four-letter club code and "CAN C" in the
          same grey capitals, which made the country and the position hard to
          tell apart at a glance and said nothing at all about the player. A
          draft board is a broadcast graphic: whose pick it is, the flag, the
          name, and the club he is being taken out of. A Kitchener winger, a
          Michigan freshman and a kid out of Farjestad's J20 programme are
          three different prospects before anybody has seen them play. */}
      {/* What the scouts had him at, which he has been reading every winter
          since he was sixteen. Without this the board below is the first and
          only time the ranking is mentioned, and the two or three seasons he
          spent climbing it count for nothing on the night. */}
      {/* WHERE THE BOARD HAD HIM, AND WHERE HE WENT, ON ONE SCALE.
          The board he's read every winter ranks him among the prospects at his
          position that the scouts followed in his draft year, so the night is
          told against those same players: how many of them went before him.
          It used to set that rank beside an estimate of how many players at
          his position the whole draft had taken, and read "3rd on the board,
          10th taken, right where the board had you". A player passed over in
          an earlier year has no board in this draft, so he gets the plain
          story instead. */}
      {seasonRecap?.draftPick && seasonRecap?.classDone && (player.passedOver || []).length > 0 && (
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-xl mx-auto mb-6 px-2">
          Passed over in {player.passedOver.join(' and ')}, you went {ordinal(seasonRecap.draftPick)} overall in {seasonRecap.draftYear}.
          {takenLine ? ` ${takenLine}` : ''}
        </p>
      )}
      {/* WHERE HE WENT, AND WHERE THE SCOUTS HAD HIM.
          Two facts, said once each: how many at his position the whole draft
          took before him, and how the board's ranking played out. The board
          only ranks the players the scouts followed, so the second fact is
          told against those players, never against the whole draft. */}
      {seasonRecap?.draftPick && !seasonRecap?.classDone && (takenLine || player.scoutRank) && (() => {
        const slot = positionDraftSlot(player.peers, player.pos, seasonRecap.draftPick);
        const onBoard = (player.peers || []).filter(p => !p.retired && compGroup(p.pos) === slot.group).length + 1;
        const gap = slot.slot - player.scoutRank;
        const count = (n) => (n === 1 ? 'one' : n);
        const tail = gap > 0
          ? `, but ${count(gap)} they ranked lower went before you.`
          : gap < 0
            ? `, and you went ahead of ${count(-gap)} they ranked higher.`
            : ', and you went right where they had you.';
        return (
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl mx-auto mb-6 px-2">
            {takenLine}
            {player.scoutRank
              ? ` The scouts had you ${ordinal(player.scoutRank)} of ${onBoard} on their board${tail}`
              : null}
          </p>
        );
      })()}

      {(lotteryLine || reasonLine) && (
        <div className="max-w-xl mx-auto mb-8 px-2 space-y-1.5 text-xs sm:text-sm text-slate-400 leading-relaxed">
          {reasonLine && <p>{reasonLine}</p>}
          {lotteryLine && <p className="text-slate-500">{lotteryLine}</p>}
        </div>
      )}

      {/* AROUND YOUR PICK.
          The player's flag beside his name. Under the name, in one quiet line:
          his position, the club he's coming from, and its league with the
          league's flag, the way a league is shown everywhere else. The
          position used to sit after the name, in a different place on every
          row. */}
      {board && (board.before.length > 0 || board.after.length > 0) && (
        <div className="max-w-xl mx-auto mb-10 text-left">
          <p className={`${kickerClass('neutral')} mb-2 px-1`}>Around Your Pick</p>
          <div className="rounded-xl overflow-hidden bg-[#0a0d0a]">
            {[
              ...board.before,
              {
                name: player.name, pick: seasonRecap?.draftPick, me: true,
                pos: player.pos, flag: flagFor(player.nat),
                team: seasonRecap?.draftedBy?.id, via: board.via,
                from: seasonRecap?.juniorTeam, fromLeague: seasonRecap?.juniorLeague
              },
              ...board.after
            ].map((r, i) => (
              <div
                key={`${r.name}-${i}`}
                className={`flex items-center gap-3 px-3 sm:px-4 py-2.5 ${
                  r.me ? 'bg-[rgba(34,231,72,0.08)]' : i % 2 ? 'bg-[#0d110d]' : 'bg-[#101410]'}`}
              >
                {/* Fixed widths for the pick and the crest, so every name
                    starts at the same place whatever shape the crest is. */}
                <span className={`w-7 shrink-0 text-right text-xs font-black number-font tabular-nums ${
                  r.me ? 'text-[#22E748]' : 'text-slate-500'}`}>
                  {r.pick}
                </span>

                <span className="shrink-0 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center">
                  {r.team ? <TeamLogo teamId={r.team} league="NHL" size="row" /> : null}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 min-w-0">
                    {r.flag
                      ? <img src={r.flag} alt="" className="w-[18px] h-[13px] object-cover rounded-[1px] shrink-0" />
                      : <span className="w-[18px] h-[13px] shrink-0" />}
                    {/* Your own row says You, the way every board in the
                        game does. */}
                    <span className={`break-words text-sm ${r.me ? 'text-white font-black' : 'text-slate-200 font-medium'}`}>
                      {r.me ? 'You' : r.name}
                    </span>
                  </span>
                  {/* Each part carries the dot in front of it, so a line that
                      wraps never leaves a dot hanging at the end. */}
                  <span className="flex items-center flex-wrap gap-x-1.5 gap-y-0.5 text-[11px] text-slate-500 leading-snug mt-0.5">
                    <span className={`font-black ${r.me ? 'text-[#22E748]' : 'text-slate-400'}`}>{r.pos}</span>
                    {r.from && (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="text-slate-600">·</span>{getFullTeamName(r.from, r.fromLeague)}
                      </span>
                    )}
                    {r.fromLeague && (
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                        <span className="text-slate-600">·</span>
                        <span className="inline-flex items-center gap-1">
                          <LeagueTag league={r.fromLeague} flagClass="w-[12px] h-[9px]" />
                        </span>
                      </span>
                    )}
                    {r.via && (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="text-slate-600">·</span>Pick from {r.via}
                      </span>
                    )}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* WHAT HAPPENS NOW.
          A club that's offering the entry-level deal gets a button for it. One
          that isn't used to get a greyed-out "ELC NOT OFFERED YET" box shaped
          like a button that did nothing. It's a sentence now, saying how long
          the club has to change its mind. */}
      {(() => {
        const offered = isFirstRound || player.ovr >= 65;
        const until = rightsExpiryYear(player);
        const backLabel = player.league === 'NCAA' ? 'RETURN TO THE NCAA'
          : euroLeagues.includes(player.league) ? `BACK TO ${leagueLabel(player.league).toUpperCase()}`
            : 'RETURN TO JUNIORS';
        const btn = offered ? 'btn-secondary' : 'btn-primary';
        return (
          <>
            {!offered && (
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-xl mx-auto mb-5 px-2">
                {ClubName(seasonRecap?.draftedBy?.id)} want you to develop for another year before they offer you an entry-level contract.
                {until ? ` They hold your rights until the summer of ${until}.` : ''}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              {offered && (
                <button
                  onClick={() => handleDraftChoice('ELC')}
                  className="btn-primary w-full sm:w-auto py-4 px-6 rounded-xl text-sm sm:text-base sports-font tracking-widest cursor-pointer"
                >
                  SIGN YOUR ENTRY-LEVEL DEAL
                </button>
              )}
              {player.league === 'USHL' ? (
                <button onClick={() => handleDraftChoice('EXPLORE_OPTIONS')} className={`${btn} py-4 px-6 rounded-xl text-sm sm:text-base cursor-pointer sports-font tracking-widest w-full sm:w-auto`}>
                  EXPLORE OPTIONS
                </button>
              ) : (
                <button onClick={() => handleDraftChoice('RETURN')} className={`${btn} py-4 px-6 rounded-xl text-sm sm:text-base cursor-pointer sports-font tracking-widest w-full sm:w-auto`}>
                  {backLabel}
                </button>
              )}
            </div>
          </>
        );
      })()}
    </div>
  );
}