import React from 'react';
import { ACCENT } from '../utils/appHelpers';
import { findMinigame } from '../data/minigames';

// Auto-extracted from App.jsx. Receives state/handlers/App-scope components as props.
export default function MinigameScreen({ BreakawayGame, CreaseGame, DeflectionGame, FaceoffGame, FilmRoomGame, OneTimerGame, ShootoutGame, ShotBlockGame, activeMinigame, handleInteractiveResult, minigameStarted, player, setMinigameStarted }) {
  return (() => {
          const mg = findMinigame(activeMinigame, player.pos);
          const accent = ACCENT[mg?.accent] || ACCENT.blue;

          return (
            <div className={`game-panel p-6 sm:p-12 mt-2 border-t-2 ${accent.border} text-center flex flex-col`}>
              {!minigameStarted ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <div className="inline-block px-4 py-1.5 bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-full text-[#F59E0B] text-xs sm:text-sm font-black uppercase tracking-widest mb-6">
                    ⚠️ Live Play Opportunity
                  </div>
                  <h2 className={`text-4xl sm:text-6xl font-black mb-6 ${accent.heading} sports-font tracking-tighter uppercase leading-tight text-balance sm:whitespace-nowrap`}>{mg?.title}</h2>
                  <p className="text-lg sm:text-2xl text-slate-300 mb-10 max-w-2xl mx-auto text-center leading-relaxed">{mg?.desc}</p>
                  
                  <button
                    onClick={() => setMinigameStarted(true)}
                    className="btn-primary py-4 px-10 rounded-xl text-xl sm:text-2xl cursor-pointer sports-font tracking-widest shadow-[0_0_20px_rgba(34,231,72,0.3)] transition-transform hover:scale-105"
                  >
                    🟢 ENTER SITUATION
                  </button>
                </div>
              ) : (
                <div className="flex flex-col h-full w-full fade-up">
                  <h2 className={`text-2xl sm:text-3xl font-black mb-6 ${accent.heading} sports-font tracking-tighter uppercase leading-tight`}>{mg?.title}</h2>
                  <div className="bg-black/50 p-6 sm:p-10 rounded-2xl border border-[rgba(255,255,255,0.05)] shadow-inner min-h-[350px] sm:min-h-[400px] flex flex-col justify-center relative flex-1">
                     {mg?.gameType === 'shootout' && <ShootoutGame player={player} onComplete={(win) => handleInteractiveResult(win, mg.reward, mg.successMsg, mg.failMsg)} />}
                     {mg?.gameType === 'faceoff' && <FaceoffGame player={player} onComplete={(win) => handleInteractiveResult(win, mg.reward, mg.successMsg, mg.failMsg)} />}
                     {mg?.gameType === 'crease' && <CreaseGame player={player} onComplete={(win) => handleInteractiveResult(win, mg.reward, mg.successMsg, mg.failMsg)} />}
                     {mg?.gameType === 'film' && <FilmRoomGame player={player} onComplete={(win) => handleInteractiveResult(win, mg.reward, mg.successMsg, mg.failMsg)} />}
                     {mg?.gameType === 'deflect' && <DeflectionGame player={player} onComplete={(win) => handleInteractiveResult(win, mg.reward, mg.successMsg, mg.failMsg)} />}
                     {mg?.gameType === 'block' && <ShotBlockGame player={player} onComplete={(win) => handleInteractiveResult(win, mg.reward, mg.successMsg, mg.failMsg)} />}
                     {mg?.gameType === 'breakaway' && <BreakawayGame player={player} onComplete={(win) => handleInteractiveResult(win, mg.reward, mg.successMsg, mg.failMsg)} />}
                     {mg?.gameType === 'onetimer' && <OneTimerGame player={player} onComplete={(win) => handleInteractiveResult(win, mg.reward, mg.successMsg, mg.failMsg)} />}
                  </div>
                </div>
              )}
            </div>
          );
        })();
}
