import 'react';
import { useAppContext } from '../AppContext';
import { findMinigame } from '../data/minigames';
import { getStakes } from '../utils/stakes';
import { Brief } from '../components/minigame/Shell';

// The frame a live-play moment happens in.
//
// This used to carry a coloured top border taken from each game's own accent, a
// warning-triangle chip on everything from training camp to a gold medal game,
// and a black inner box that every game then drew its own furniture inside. The
// games now share one shell (components/minigame/Shell) and one ice
// (components/rink/Ice), so this is only the brief and the handover.

export default function MinigameScreen() {
  const {
    BreakawayGame, BreakoutGame, CreaseGame, DeflectionGame, FaceoffGame, FilmRoomGame,
    OneTimerGame, ScreenedShotGame, ShootoutGame, ShotBlockGame, ZoneBattleGame,
    activeMinigame, handleInteractiveResult, minigameContext, minigameStarted,
    player, setMinigameStarted
  } = useAppContext();

  const mg = findMinigame(activeMinigame, player.pos);

  // What this moment is worth and how hard it should be. Every game reads its
  // challenge off the player's ratings, so meeting him with a sterner opponent
  // is what makes a final bite for all of them at once.
  const stakes = getStakes(minigameContext, player.intlRound, player.intlOppTier);

  // The moment travels with the result. Without it the season recap showed the
  // outcome line on its own under a generic "In the news" heading, so "Clean
  // win! You snapped it straight back to your defenseman" arrived with nothing
  // saying what had been won, where, or what it was worth.
  const done = (win) => handleInteractiveResult(win, mg.reward, mg.successMsg, mg.failMsg, {
    // gameId rides along so a result can mean something specific to the event
    // that produced it, rather than only paying out the generic reward block.
    gameId: mg?.id, title: mg?.title, setup: mg?.desc, stakes: stakes.label
  });
  const common = { player, difficulty: stakes.difficulty, onComplete: done };

  return (
    <div className="game-panel p-5 sm:p-8 mt-2 flex flex-col">
      {!minigameStarted ? (
        <Brief
          stakes={stakes}
          title={mg?.title}
          blurb={mg?.desc}
          read={mg?.read}
          stat={mg?.stat}
          onStart={() => setMinigameStarted(true)}
        />
      ) : (
        <div className="w-full fade-up">
          <div className="flex items-center justify-center gap-3 mb-5">
            <span className="h-px flex-1 max-w-16 bg-[rgba(255,255,255,0.08)]" />
            <h2 className="text-base sm:text-lg font-black text-slate-400 sports-font tracking-[0.2em] uppercase text-center">
              {mg?.title}
            </h2>
            <span className="h-px flex-1 max-w-16 bg-[rgba(255,255,255,0.08)]" />
          </div>

          {mg?.gameType === 'shootout' && <ShootoutGame {...common} />}
          {mg?.gameType === 'faceoff' && <FaceoffGame {...common} />}
          {mg?.gameType === 'crease' && <CreaseGame {...common} />}
          {mg?.gameType === 'film' && <FilmRoomGame {...common} />}
          {mg?.gameType === 'deflect' && <DeflectionGame {...common} />}
          {mg?.gameType === 'block' && <ShotBlockGame {...common} />}
          {mg?.gameType === 'breakaway' && <BreakawayGame {...common} />}
          {mg?.gameType === 'onetimer' && <OneTimerGame {...common} />}
          {mg?.gameType === 'breakout' && <BreakoutGame {...common} />}
          {mg?.gameType === 'screened' && <ScreenedShotGame {...common} />}
          {mg?.gameType === 'zone_battle' && <ZoneBattleGame {...common} />}
        </div>
      )}
    </div>
  );
}
