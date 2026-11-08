import { useState } from 'react';
import { useAppContext } from '../AppContext';
import { getFullTeamName } from '../utils/appHelpers';
import { draftBoard, flagFor } from '../utils/peers';

export default function DraftScreen() {
  const { TeamLogo, handleDraftChoice, player, setPlayer, seasonRecap } = useAppContext();

  // Russian Factor Eligibility Check
  const isRussianFactorEligible = 
    (player.nationality === 'RUS' || player.league === 'KHL') && 
    !player.storylines?.russianFactorHandled;

  const handleRussianFactorChoice = (choice) => {
    if (choice === 'NHL') {
      setPlayer(p => ({
        ...p,
        draftBonus: (p.draftBonus || 0) + 15,
        fanStatus: Math.min(100, (p.fanStatus || 0) + 20),
        storylines: { ...p.storylines, russianFactorHandled: true, russianFactorChoice: 'NHL' }
      }));
    } else {
      setPlayer(p => ({
        ...p,
        draftBonus: (p.draftBonus || 0) - 25,
        fanStatus: Math.min(100, (p.fanStatus || 0) + 35),
        storylines: { ...p.storylines, russianFactorHandled: true, russianFactorChoice: 'KHL' }
      }));
    }
  };

  const isFirstRound = seasonRecap?.draftPick <= 32;

  // Drawn once. draftBoard puts noise on the scouting order, so recomputing
  // it on every render would reshuffle the room while the player read it.
  const [board] = useState(() =>
    seasonRecap?.draftPick ? draftBoard(player.peers, seasonRecap.draftPick, player.name) : null);

  return (
    <div className="game-panel p-6 sm:p-10 mt-2 text-center border-t-2 border-t-[#22E748] relative">
      
      {/* RUSSIAN FACTOR PRE-DRAFT OVERLAY */}
      {isRussianFactorEligible && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#101410] border-2 border-[#ef4444]/60 p-6 sm:p-8 rounded-2xl max-w-xl w-full text-center shadow-2xl animate-fade-in">
            <div className="text-5xl mb-3">🇷🇺</div>
            <h3 className="text-3xl font-black text-white sports-font uppercase mb-2">
              THE RUSSIAN FACTOR
            </h3>
            <p className="text-slate-300 text-sm sm:text-base font-sans mb-6 leading-relaxed">
              Scouts and General Managers at the NHL Combine are questioning your long-term commitment to North America. They fear you might stay in or return to the KHL. How do you address the media?
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => handleRussianFactorChoice('NHL')}
                className="bg-[#1a2230] hover:bg-[#232d3f] border border-[#3b82f6]/40 p-5 rounded-xl text-left transition-transform hover:scale-105 cursor-pointer"
              >
                <span className="text-xs font-black text-[#3b82f6] tracking-widest uppercase block mb-1">
                  COMMIT TO NHL
                </span>
                <span className="text-base font-bold text-white sports-font block uppercase mb-1">
                  "My Dream is the Stanley Cup"
                </span>
                <span className="text-xs text-slate-400 font-sans block">
                  📈 Draft stock rises (+15). NHL GMs feel safe selecting you higher.
                </span>
              </button>

              <button
                onClick={() => handleRussianFactorChoice('KHL')}
                className="bg-[#1a2230] hover:bg-[#232d3f] border border-[#ef4444]/40 p-5 rounded-xl text-left transition-transform hover:scale-105 cursor-pointer"
              >
                <span className="text-xs font-black text-[#ef4444] tracking-widest uppercase block mb-1">
                  LEVERAGE THE KHL
                </span>
                <span className="text-base font-bold text-white sports-font block uppercase mb-1">
                  "I Keep My Options Open"
                </span>
                <span className="text-xs text-slate-400 font-sans block">
                  📉 Draft stock drops (-25), but guarantees lucrative KHL contract offers later.
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      <p className="text-[#22E748] font-bold tracking-widest uppercase text-xs sm:text-sm mb-2">THE NHL DRAFT</p>
      
      <div className="bg-[#101410] border border-[#3b82f6]/30 p-8 sm:p-12 rounded-2xl mb-10 max-w-2xl mx-auto shadow-[0_0_30px_rgba(59,130,246,0.15)] relative overflow-hidden flex flex-col items-center">
        <div className="absolute top-0 w-full bg-[#3b82f6] text-white font-black text-xs sm:text-sm py-1.5 text-center tracking-widest">
          ROUND {seasonRecap?.draftRound} • PICK {seasonRecap?.draftPick}
        </div>
        
        <div className="mt-4">
           <TeamLogo teamId={seasonRecap?.draftedBy?.id} league="NHL" />
        </div>
        
        <h3 className="text-sm sm:text-lg font-bold text-slate-300 uppercase mt-6 mb-2 sports-font tracking-wide leading-tight px-4">
          THE {getFullTeamName(seasonRecap?.draftedBy?.id, 'NHL').toUpperCase()} ARE PROUD TO SELECT, FROM {['SHL', 'LIIGA'].includes(seasonRecap?.juniorLeague) ? '' : 'THE '}{getFullTeamName(seasonRecap?.juniorTeam, seasonRecap?.juniorLeague).toUpperCase()}...
        </h3>
        
        {/* Added break-words, w-full, and responsive sizing so long names wrap cleanly and maintain box padding */}
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-[#3b82f6] sports-font uppercase mt-2 w-full px-2 sm:px-4 break-words">
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
                team: seasonRecap?.draftedBy?.id,
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
                    Crests are not all the same shape and TeamLogo falls back
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
                    : <span className="w-[20px] h-[14px] rounded-[1px] bg-[#1a2230]" />}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex items-center min-w-0">
                    <span className={`truncate text-sm ${r.me ? 'text-white font-black' : 'text-slate-300 font-medium'}`}>
                      {r.name}
                    </span>
                  </span>
                  {/* Where he is coming from. */}
                  <span className="block truncate text-[10px] text-slate-600 mt-0.5">
                    {r.from
                      ? `${getFullTeamName(r.from, r.fromLeague)}${r.fromLeague ? ` · ${r.fromLeague}` : ''}`
                      : ''}
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
            className="w-full sm:w-auto py-4 px-6 rounded-xl text-sm sm:text-base font-black sports-font tracking-widest transition-all cursor-pointer bg-[#22E748]/10 hover:bg-[#22E748]/20 border border-[#22E748]/40 text-[#22E748] shadow-[0_0_15px_rgba(34,231,75,0.15)] hover:shadow-[0_0_25px_rgba(34,231,75,0.25)] hover:scale-[1.02]"
          >
            SIGN ELC (TURN PRO)
          </button>
        ) : (
          <div className="bg-[#101410] border border-[rgba(255,255,255,0.065)] text-slate-500 py-4 px-6 rounded-xl text-sm sm:text-base sports-font tracking-widest w-full sm:w-auto flex items-center justify-center">
            ELC NOT OFFERED YET
          </div>
        )}
        
        {player.league === 'USHL' ? (
           <button onClick={() => handleDraftChoice('EXPLORE_OPTIONS')} className="bg-[#101410] hover:bg-[#1a2230] border border-[rgba(255,255,255,0.065)] text-white py-4 px-6 rounded-xl text-sm sm:text-base cursor-pointer sports-font tracking-widest transition-colors w-full sm:w-auto">
             EXPLORE OPTIONS
           </button>
        ) : (
           <button onClick={() => handleDraftChoice('RETURN')} className="bg-[#101410] hover:bg-[#1a2230] border border-[rgba(255,255,255,0.065)] text-white py-4 px-6 rounded-xl text-sm sm:text-base cursor-pointer sports-font tracking-widest transition-colors w-full sm:w-auto">
             {player.league === 'NCAA' ? 'RETURN TO NCAA' : ['SHL', 'LIIGA', 'KHL', 'SWISS', 'CZECH', 'SLOVAK'].includes(player.league) ? 'RETURN TO EUROPE' : 'RETURN TO JUNIORS'}
           </button>
        )}
      </div>
    </div>
  );
}