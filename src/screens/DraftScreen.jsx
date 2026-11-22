import { useState } from 'react';
import { useAppContext } from '../AppContext';
import { getFullTeamName } from '../utils/appHelpers';
import { NO_ARTICLE_LEAGUES, ordinal, withTeamArticle } from '../utils/gameHelpers';
import { classSalt, compGroup, draftBoard, flagFor, groupName, positionDraftSlot, roomProspect } from '../utils/peers';
import LeagueTag from '../components/LeagueTag';
import { kickerClass, TITLE_LG } from '../utils/ui';

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
    const nextAgeOut = ['OHL', 'WHL', 'QMJHL', 'USHL', 'BCHL', 'J20', 'U20'].includes(player.league) ? 21 : 22;
    const againNextYear = (player.age + 1) < nextAgeOut;
    const isUSHL = player.league === 'USHL';
    const backLabel = player.league === 'NCAA' ? 'BACK TO THE NCAA'
      : ['SHL', 'LIIGA', 'KHL', 'SWISS', 'DEL', 'ICEHL', 'CZECH', 'SLOVAK'].includes(player.league) ? `BACK TO ${player.league === 'LIIGA' ? 'LIIGA' : player.league}`
        : 'BACK TO JUNIORS';
    return (
      <div className="game-panel p-6 sm:p-10 mt-2 text-center relative">
        <span className={`${kickerClass('neutral')} mb-4`}>The {seasonRecap.draftYear} NHL draft</span>
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

  return (
    <div className="game-panel p-6 sm:p-10 mt-2 text-center relative">
      

      <span className={`${kickerClass('neutral')} mb-4`}>{seasonRecap?.draftYear ? `The ${seasonRecap.draftYear} NHL draft` : 'The NHL draft'}</span>
      
      <div className="bg-[#0d110d] border border-[rgba(255,255,255,0.08)] p-8 sm:p-12 rounded-2xl mb-10 max-w-2xl mx-auto relative overflow-hidden flex flex-col items-center">
        <div className="absolute top-0 w-full bg-[#2563eb] text-white font-black text-xs sm:text-sm py-1.5 text-center tracking-widest">
          ROUND {seasonRecap?.draftRound} • PICK {seasonRecap?.draftPick}
        </div>
        
        <div className="mt-4">
           <TeamLogo teamId={seasonRecap?.draftedBy?.id} league="NHL" />
        </div>
        
        <h2 className="text-sm sm:text-lg font-bold text-slate-300 uppercase mt-6 mb-2 sports-font tracking-wide leading-tight px-4">
          THE {getFullTeamName(seasonRecap?.draftedBy?.id, 'NHL').toUpperCase()} ARE PROUD TO SELECT, FROM {NO_ARTICLE_LEAGUES.includes(seasonRecap?.juniorLeague) ? '' : 'THE '}{getFullTeamName(seasonRecap?.juniorTeam, seasonRecap?.juniorLeague).toUpperCase()}...
        </h2>
        
        {/* Added break-words, w-full, and responsive sizing so long names wrap cleanly and maintain box padding */}
        <h2 className={`${TITLE_LG} mt-2 w-full px-2 sm:px-4 break-words`}>
          {player.name}
        </h2>

        {/* The card called the name and never said whose flag he skates
            under or what he plays, which the board underneath it now gives
            every other prospect in the room. */}
        <div className="flex items-center justify-center gap-2 mt-3">
          {flagFor(player.nat)
            ? <img src={flagFor(player.nat)} alt="" className="w-6 h-[17px] object-cover rounded-[1px]" />
            : null}
          <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
            {player.nat} · {player.pos}
            {player.archetype ? ` · ${player.archetype}` : ''}
          </span>
        </div>
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
        <p className="text-[11px] sm:text-xs font-bold text-slate-400 max-w-xl mx-auto -mt-6 mb-8 px-2">
          Passed over in {player.passedOver.join(' and ')}, you went {ordinal(seasonRecap.draftPick)} overall in {seasonRecap.draftYear}.
        </p>
      )}
      {player.scoutRank && seasonRecap?.draftPick && !seasonRecap?.classDone && (() => {
        const slot = positionDraftSlot(player.peers, player.pos, seasonRecap.draftPick);
        const many = groupName(slot.group);
        const onBoard = (player.peers || []).filter(p => !p.retired && compGroup(p.pos) === slot.group).length + 1;
        const gap = slot.slot - player.scoutRank;
        return (
          <p className="text-[11px] sm:text-xs font-bold text-slate-400 max-w-xl mx-auto -mt-6 mb-8 px-2">
            The final board ranked you <span className="text-white font-black">{ordinal(player.scoutRank)}</span> of
            the {onBoard} {many} it followed in your draft year. You were the <span className="text-white font-black">{ordinal(slot.slot)}</span> of
            them taken, {ordinal(seasonRecap.draftPick)} overall
            {gap > 0
              ? `, so ${gap === 1 ? 'one player' : `${gap} players`} you were ranked above went before you.`
              : gap < 0
                ? `, ${-gap} place${gap === -1 ? '' : 's'} earlier than the board had you.`
                : ', right where the board had you.'}
          </p>
        );
      })()}

      {(lotteryLine || reasonLine) && (
        <div className="max-w-xl mx-auto -mt-4 mb-8 px-2 space-y-1.5 text-[11px] sm:text-xs font-bold text-slate-400">
          {reasonLine && <p>{reasonLine}</p>}
          {lotteryLine && <p className="text-slate-500">{lotteryLine}</p>}
        </div>
      )}

      {board && (board.before.length > 0 || board.after.length > 0) && (
        <div className="max-w-xl mx-auto mb-10 text-left">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500 mb-2 px-1">
            Around your pick
          </p>
          <div className="rounded-xl border border-[rgba(255,255,255,0.06)] overflow-hidden bg-[#0a0d0a]">
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
                className={`flex items-center gap-2.5 px-3 py-2.5 border-b border-[rgba(255,255,255,0.04)] last:border-0 ${
                  r.me ? 'bg-[#3b82f6]/[0.12]' : 'bg-[#101410]'}`}
              >
                {/* Fixed-width columns for the pick, the crest and the flag.
                    Crests aren't all the same shape and TeamLogo falls back
                    to a coloured disc when one will not load, so letting any
                    of the three size themselves left the whole board ragged:
                    every row started its name at a slightly different place. */}
                <span className={`w-6 shrink-0 text-right text-[11px] font-black number-font ${
                  r.me ? 'text-[#3b82f6]' : 'text-slate-600'}`}>
                  {r.pick}
                </span>

                {/* Who is on the clock. */}
                <span className="shrink-0 w-7 h-7 flex items-center justify-center">
                  {r.team ? <TeamLogo teamId={r.team} league="NHL" size="tiny" /> : null}
                </span>

                <span className="shrink-0 w-[22px] flex items-center justify-center">
                  {r.flag
                    ? <img src={r.flag} alt="" className="w-[20px] h-[14px] object-cover rounded-[1px]" />
                    : <span className="w-[20px] h-[14px] rounded-[1px] bg-[#151b15]" />}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex items-center min-w-0">
                    {/* Your own row says You, the way it does on every other
                        board in the game. Your own name read back in a list of
                        strangers puts you among them. */}
                    <span className={`break-words text-sm ${r.me ? 'text-white font-black' : 'text-slate-300 font-medium'}`}>
                      {r.me ? 'You' : r.name}
                    </span>
                  </span>
                  {/* Where he is coming from. */}
                  <span className="flex items-center gap-1 min-w-0 text-[10px] text-slate-600 mt-0.5">
                    {r.from && <span className="break-words">{getFullTeamName(r.from, r.fromLeague)}</span>}
                    {r.from && r.fromLeague && <span className="shrink-0 text-slate-700">·</span>}
                    {r.fromLeague && (
                      <span className="flex shrink-0 items-center gap-1">
                        <LeagueTag league={r.fromLeague} flagClass="w-[12px] h-[9px]" />
                      </span>
                    )}
                    {/* A pick that changed hands says whose it was. */}
                    {r.via && <span className="shrink-0 text-slate-700">·</span>}
                    {r.via && <span className="shrink-0 text-slate-500">Pick from {r.via}</span>}
                  </span>
                </span>

                <span className={`shrink-0 text-[10px] font-black uppercase tracking-widest w-7 text-right ${
                  r.me ? 'text-[#3b82f6]' : 'text-slate-500'}`}>
                  {r.pos}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
        {(isFirstRound || player.ovr >= 65) ? (
          <button 
            onClick={() => handleDraftChoice('ELC')} 
            className="btn-primary w-full sm:w-auto py-4 px-6 rounded-xl text-sm sm:text-base sports-font tracking-widest cursor-pointer"
          >
            SIGN ELC (TURN PRO)
          </button>
        ) : (
          <div className="bg-[#101410] border border-[rgba(255,255,255,0.065)] text-slate-500 py-4 px-6 rounded-xl text-sm sm:text-base sports-font tracking-widest w-full sm:w-auto flex items-center justify-center">
            ELC NOT OFFERED YET
          </div>
        )}
        
        {player.league === 'USHL' ? (
           <button onClick={() => handleDraftChoice('EXPLORE_OPTIONS')} className="btn-secondary py-4 px-6 rounded-xl text-sm sm:text-base cursor-pointer sports-font tracking-widest w-full sm:w-auto">
             EXPLORE OPTIONS
           </button>
        ) : (
           <button onClick={() => handleDraftChoice('RETURN')} className="btn-secondary py-4 px-6 rounded-xl text-sm sm:text-base cursor-pointer sports-font tracking-widest w-full sm:w-auto">
             {player.league === 'NCAA' ? 'RETURN TO NCAA' : ['SHL', 'LIIGA', 'KHL', 'SWISS', 'DEL', 'ICEHL', 'CZECH', 'SLOVAK'].includes(player.league) ? 'RETURN TO EUROPE' : 'RETURN TO JUNIORS'}
           </button>
        )}
      </div>
    </div>
  );
}