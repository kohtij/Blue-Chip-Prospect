import { useState, useEffect, useRef } from 'react';
import { NetMouth, Goalie, Surface } from './rink/Ice';
import { MOUTH, MOUTH_VIEW, MOUTH_ZONES, wavePath } from './rink/geometry';
import { EventHeader, Stage, Verdict } from './minigame/Shell';
import { useZoneKeys, ZONE_KEY_HINT } from '../utils/a11y';

// Save streak.
//
// The old one was the pale blue field again with a net emoji sitting on it and
// five red circles that said SAVE on them. Ten shooters come down on you one at
// a time, and now it looks like that: your own goal mouth, a puck arriving at a
// real hole with the shot drawn behind it, and a count of how many you have kept
// out.
//
// Ten shots, the thresholds untouched, and the captain's grit call still buys
// you the extra reaction time.

const TOTAL = 10;

export default function AllStarSaveStreak({ onComplete, strategy }) {
  const [gameStarted, setGameStarted] = useState(false);
  const [shotsFired, setShotsFired] = useState(0);
  const [saves, setSaves] = useState(0);
  const [activeZone, setActiveZone] = useState(null);
  const [from, setFrom] = useState([50, 70]);
  const [gameOver, setGameOver] = useState(false);
  const [result, setResult] = useState(null);
  const [last, setLast] = useState(null);

  const timerRef = useRef(null);
  const reactTime = strategy === 'grit' ? 1100 : 800;

  const endGame = (finalSaves) => {
    setGameOver(true);
    setActiveZone(null);

    let ovrBoost = 0, fanBoost = 0, msg = '';
    if (finalSaves === TOTAL) {
      ovrBoost = 2; fanBoost = 50; msg = 'Ten shooters, ten saves. Nobody in the building got a puck past you.';
    } else if (finalSaves >= 7) {
      ovrBoost = 1; fanBoost = 20; msg = 'You robbed some of the best shooters in the league out there.';
    } else {
      fanBoost = 5; msg = 'A rough go of it, but the crowd were glad to see you in the net.';
    }
    if (strategy === 'grit') fanBoost += 15;

    setResult({ finalSaves, msg, ovrBoost });
    setTimeout(() => {
      onComplete({ time: finalSaves, speed: finalSaves, msg, fanBoost, ovrBoost, eventName: 'Save Streak' });
    }, 1500);
  };

  const triggerShot = (count, soFar) => {
    if (count >= TOTAL) { endGame(soFar); return; }

    // eslint-disable-next-line react-hooks/purity
    const zone = Math.floor(Math.random() * MOUTH_ZONES.length);
    // eslint-disable-next-line react-hooks/purity
    setFrom([30 + Math.random() * 40, MOUTH.yBot + 14]);
    setActiveZone(zone);

    timerRef.current = setTimeout(() => {
      setActiveZone(null);
      setLast(false);
      setShotsFired(prev => prev + 1);
      setTimeout(() => triggerShot(count + 1, soFar), 500);
    }, reactTime);
  };

  const startGame = () => {
    setGameStarted(true);
    setTimeout(() => triggerShot(0, 0), 1000);
  };

  const handleSave = (id) => {
    if (activeZone !== id || gameOver) return;

    clearTimeout(timerRef.current);
    setActiveZone(null);
    setLast(true);

    const newSaves = saves + 1;
    const newShots = shotsFired + 1;
    setSaves(newSaves);
    setShotsFired(newShots);

    if (newShots >= TOTAL) endGame(newSaves);
    else setTimeout(() => triggerShot(newShots, newSaves), 500);
  };

  useZoneKeys(gameStarted && !gameOver, (id) => handleSave(id));

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const zone = activeZone !== null ? MOUTH_ZONES[activeZone] : null;

  return (
    <div className="w-full max-w-xl mx-auto fade-up">
      <EventHeader
        event="Save streak"
        buff={!!strategy}
        readout={`${saves}`}
        unit={`of ${TOTAL}`}
        note={gameStarted ? `${TOTAL - shotsFired} shooter${TOTAL - shotsFired === 1 ? '' : 's'} left` : 'Ten of the best, one at a time'}
      />

      <div className="mt-4">
        <Stage
          keys={ZONE_KEY_HINT}
          hud={
            <div className="flex items-center justify-between gap-2 px-1">
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                Breakaway relay
              </span>
              <span className="flex gap-1">
                {Array.from({ length: TOTAL }, (_, i) => (
                  <span
                    key={i}
                    className={`w-1.5 h-4 rounded-full ${
                      i < shotsFired
                        ? (i < saves ? 'bg-[#22E748]' : 'bg-[#ef4444]')
                        : 'bg-[rgba(255,255,255,0.1)]'
                    }`}
                  />
                ))}
              </span>
            </div>
          }
          verdict={
            <Verdict
              show={!!result}
              won={result?.ovrBoost > 0}
              word={result?.finalSaves === TOTAL ? 'PERFECT' : result?.ovrBoost ? 'STOOD TALL' : 'LONG NIGHT'}
              detail={result?.msg}
            />
          }
          caption={
            !gameStarted ? 'They come down one at a time. Get to the puck before it is behind you.'
              : last === true ? 'Turned that one aside.'
                : last === false ? 'That one beat you.'
                  : 'Here comes the next one.'
          }
        >
          <Surface view={MOUTH_VIEW}>
            <NetMouth>
              <Goalie
                shift={zone ? (zone.x - 50) / 30 : 0}
                down={!!zone && zone.y > 40}
                beaten={last === false && !zone}
              />
            </NetMouth>

            {MOUTH_ZONES.map(z => (
              <circle key={z.id} cx={z.x} cy={z.y} r="6.4" fill="none"
                      stroke="rgba(255,255,255,0.1)" strokeWidth="0.6" strokeDasharray="2.2 2.4" />
            ))}

            {zone && (
              <g>
                <path d={wavePath(from, [zone.x, zone.y], null, 1.4, 6)} fill="none"
                      stroke="rgba(251,191,36,0.6)" strokeWidth="1.2" strokeLinecap="round" />
                <circle cx={zone.x} cy={zone.y} r="7.5" fill="transparent"
                        className="cursor-pointer" onClick={() => handleSave(zone.id)} />
                <circle cx={zone.x} cy={zone.y} r="3.1" fill="#fff"
                        stroke="rgba(0,0,0,0.6)" strokeWidth="0.8" className="pointer-events-none" />
              </g>
            )}

            {/* the shooter who is up */}
            {gameStarted && !result && (
              <circle cx={from[0]} cy={from[1]} r="3.6" fill="rgba(200,44,44,0.9)"
                      stroke="rgba(0,0,0,0.55)" strokeWidth="0.6" />
            )}
          </Surface>
        </Stage>
      </div>

      {!gameStarted && (
        <button
          type="button"
          onClick={startGame}
          className="mt-4 w-full btn-primary py-4 rounded-xl text-base sm:text-lg cursor-pointer sports-font tracking-[0.18em]"
        >
          IN THE NET
        </button>
      )}
    </div>
  );
}
