import React from 'react';
import { useAppContext } from '../AppContext';
import { getFullTeamName } from '../utils/appHelpers';

// Auto-extracted from App.jsx. Receives state/handlers/App-scope components as props.
export default function DraftScreen() {
  const { TeamLogo, handleDraftChoice, player, seasonRecap } = useAppContext();
  return (() => {
          const isFirstRound = seasonRecap?.draftPick <= 32;
          return (
            <div className="game-panel p-6 sm:p-10 mt-2 text-center border-t-2 border-t-[#22E748]">
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
                
                <h2 className="text-5xl sm:text-6xl font-black text-[#3b82f6] sports-font uppercase mt-2">{player.name}</h2>
              </div>

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
                     {player.league === 'NCAA' ? 'RETURN TO NCAA' : ['SHL', 'LIIGA'].includes(player.league) ? 'RETURN TO EUROPE' : 'RETURN TO JUNIORS'}
                   </button>
                )}
              </div>
            </div>
          );
        })();
}
