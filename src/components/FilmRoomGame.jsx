import { useState } from 'react';
import { useAppContext } from '../AppContext';
import { ZoneSheet, Marker, Move, Puck, Surface } from './rink/Ice';
import { ZONE_VIEW } from './rink/geometry';
import { Pips } from './minigame/Shell';

// The film room.
//
// The only one of these that is not a test of hands or nerve: it is a test of
// whether you know the game. That part was always fine. What it looked like was
// a video-cassette emoji, a brain emoji if you passed and a face-palm emoji if
// you did not.
//
// Now the tape is on the board. Each situation is drawn on the same ice as
// everything else, with the same notation, so you are reading a diagram a coach
// could have drawn rather than a sentence describing one. The question and the
// options sit under it.

const SKATER_SCENARIOS = [
  {
    frame: 'Opposition power play, 1-3-1 umbrella',
    question: 'Which passing lane do you take away first?',
    diagram: {
      opp: [{ at: [40, 39], label: 'D' }, { at: [62, 14], label: 'W' }, { at: [62, 64], label: 'W' },
            { at: [66, 39], label: 'C' }, { at: [84, 39], label: 'F' }],
      me: [52, 39],
      moves: [{ type: 'pass', from: [62, 14], to: [62, 64], curve: [40, 39] }],
      puck: [62, 14]
    },
    options: [
      { text: 'The cross-ice seam through the royal road', isCorrect: true },
      { text: 'The drop pass back to the point', isCorrect: false },
      { text: 'The dump into the corner', isCorrect: false }
    ]
  },
  {
    frame: 'Two on one, you are the lone defender',
    question: 'What is your responsibility as the only man back?',
    diagram: {
      opp: [{ at: [40, 24], label: 'LW' }, { at: [40, 54], label: 'RW' }],
      me: [58, 39],
      mates: [{ at: [88, 39], label: 'G' }],
      moves: [{ type: 'carry', from: [40, 24], to: [66, 20] }, { type: 'pass', from: [40, 24], to: [40, 54] }],
      puck: [40, 24]
    },
    options: [
      { text: 'Attack the puck carrier immediately', isCorrect: false },
      { text: 'Take the pass away and leave the shooter to your goalie', isCorrect: true },
      { text: 'Block the goalie’s line of sight', isCorrect: false }
    ]
  },
  {
    frame: 'Own-zone draw, down one, ten seconds left',
    question: 'What is the play if you win it clean?',
    diagram: {
      opp: [{ at: [68, 32], label: 'C' }, { at: [80, 18], label: 'W' }],
      me: [68, 46],
      mates: [{ at: [84, 58], label: 'D' }, { at: [40, 39], label: 'W' }],
      moves: [{ type: 'pass', from: [68, 46], to: [42, 39], curve: [56, 58] }],
      puck: [68, 39]
    },
    options: [
      { text: 'Freeze it against the boards', isCorrect: false },
      { text: 'Break it out fast up the middle', isCorrect: true },
      { text: 'Pull the goalie', isCorrect: false }
    ]
  },
  {
    frame: 'Three on two entering the zone, puck on your stick',
    question: 'What is the highest percentage play here?',
    diagram: {
      opp: [{ at: [62, 26], label: 'D' }, { at: [62, 52], label: 'D' }, { at: [88, 39], label: 'G' }],
      me: [38, 39],
      mates: [{ at: [40, 16], label: 'LW' }, { at: [40, 62], label: 'RW' }],
      moves: [{ type: 'carry', from: [38, 39], to: [72, 34] }, { type: 'shot', from: [72, 34], to: [89, 42] }],
      puck: [38, 39]
    },
    options: [
      { text: 'Drive the net and shoot low for the rebound', isCorrect: true },
      { text: 'Stop up at the blue line and wait for support', isCorrect: false },
      { text: 'Force the saucer pass through the triangle', isCorrect: false }
    ]
  },
  {
    frame: 'Penalty kill, five on three, puck down low',
    question: 'What is your structure?',
    diagram: {
      opp: [{ at: [52, 20], label: 'D' }, { at: [52, 58], label: 'D' }, { at: [74, 16], label: 'W' },
            { at: [74, 62], label: 'W' }, { at: [83, 50], label: 'C' }],
      me: [73, 31],
      mates: [{ at: [73, 47], label: 'D' }, { at: [64, 39], label: 'F' }, { at: [89, 39], label: 'G' }],
      puck: [52, 20]
    },
    options: [
      { text: 'An aggressive box chasing the puck', isCorrect: false },
      { text: 'A tight collapsing triangle protecting the crease', isCorrect: true },
      { text: 'Man-to-man coverage everywhere', isCorrect: false }
    ]
  },
  {
    frame: 'Offensive zone, low-to-high cycle',
    question: 'Where does the weak-side forward want to be?',
    diagram: {
      opp: [{ at: [76, 55], label: 'D' }, { at: [66, 44], label: 'C' }, { at: [89, 39], label: 'G' }],
      mates: [{ at: [87, 68], label: 'LW' }, { at: [48, 54], label: 'D' }],
      me: [60, 30],
      moves: [{ type: 'pass', from: [87, 68], to: [53, 55] }, { type: 'pass', from: [48, 54], to: [58, 32] }],
      puck: [87, 68]
    },
    options: [
      { text: 'In the high slot, finding the soft spot', isCorrect: true },
      { text: 'Glued to the boards', isCorrect: false },
      { text: 'Behind the opposition net', isCorrect: false }
    ]
  },
  {
    frame: 'Neutral zone, they are running the 1-3-1 trap',
    question: 'How do you get through it?',
    diagram: {
      opp: [{ at: [36, 39], label: 'F' }, { at: [46, 16], label: 'W' }, { at: [46, 39], label: 'C' },
            { at: [46, 62], label: 'W' }, { at: [60, 39], label: 'D' }],
      me: [25, 39],
      mates: [{ at: [26, 18], label: 'LW' }],
      moves: [{ type: 'pass', from: [26, 39], to: [56, 10], curve: [40, 18] }],
      puck: [26, 39]
    },
    options: [
      { text: 'Skate straight into the three-man wall', isCorrect: false },
      { text: 'Chip it soft to the corner and chase', isCorrect: true },
      { text: 'Drop it back to the goalie', isCorrect: false }
    ]
  },
  {
    frame: 'Own-zone breakout under a heavy forecheck',
    question: 'What is the safe exit?',
    diagram: {
      opp: [{ at: [70, 26], label: 'F1' }, { at: [58, 48], label: 'F2' }],
      me: [80, 24],
      mates: [{ at: [80, 56], label: 'D' }],
      moves: [{ type: 'pass', from: [80, 24], to: [82, 56], curve: [96, 40] }],
      puck: [80, 24]
    },
    options: [
      { text: 'Reverse it off the glass and out', isCorrect: true },
      { text: 'Pass it blind up the middle', isCorrect: false },
      { text: 'Try to beat F1 one on one', isCorrect: false }
    ]
  },
  {
    frame: 'Six on five against, defending a one-goal lead',
    question: 'What is the priority?',
    diagram: {
      opp: [{ at: [44, 20], label: 'D' }, { at: [44, 58], label: 'D' }, { at: [68, 14], label: 'W' },
            { at: [68, 64], label: 'W' }, { at: [82, 30], label: 'C' }, { at: [60, 44], label: 'F' }],
      me: [71, 31],
      mates: [{ at: [72, 48], label: 'D' }, { at: [89, 39], label: 'G' }],
      moves: [{ type: 'shot', from: [44, 20], to: [86, 36] }],
      puck: [44, 20]
    },
    options: [
      { text: 'Try to score on the empty net', isCorrect: false },
      { text: 'Block shooting lanes and protect the house', isCorrect: true },
      { text: 'Pinch at the blue line', isCorrect: false }
    ]
  },
  {
    frame: 'You are F1 on the forecheck',
    question: 'What is the job?',
    diagram: {
      opp: [{ at: [84, 30], label: 'D' }, { at: [84, 52], label: 'D' }],
      me: [66, 26],
      mates: [{ at: [56, 44], label: 'F2' }],
      moves: [{ type: 'skate', from: [66, 26], to: [82, 30] }],
      puck: [86, 32]
    },
    options: [
      { text: 'Take the body and separate him from the puck', isCorrect: true },
      { text: 'Wave the stick and peel off', isCorrect: false },
      { text: 'Head to the bench for the change', isCorrect: false }
    ]
  }
];

const GOALIE_SCENARIOS = [
  {
    frame: 'Two on one rush crossing the blue line',
    question: 'How do you manage your depth as it develops?',
    diagram: {
      opp: [{ at: [40, 24], label: 'LW' }, { at: [40, 54], label: 'RW' }],
      mates: [{ at: [58, 39], label: 'D' }],
      me: [86, 39],
      moves: [{ type: 'pass', from: [40, 24], to: [40, 54] }],
      puck: [40, 24]
    },
    options: [
      { text: 'Aggressive at the top of the crease, then push across on the pass', isCorrect: true },
      { text: 'Retreat deep into the paint to cover the back door', isCorrect: false },
      { text: 'Poke-check the carrier at the blue line', isCorrect: false }
    ]
  },
  {
    frame: 'Puck cycled behind your net to the weak side',
    question: 'What do you do as it crosses the goal line?',
    diagram: {
      opp: [{ at: [95, 52], label: 'W' }, { at: [78, 58], label: 'C' }],
      me: [89, 36],
      mates: [{ at: [80, 26], label: 'D' }],
      moves: [{ type: 'pass', from: [95, 52], to: [80, 60] }],
      puck: [95, 52]
    },
    options: [
      { text: 'Seal the short-side post and pad with the reverse VH', isCorrect: true },
      { text: 'Stand tall in the middle of the net facing out', isCorrect: false },
      { text: 'Butterfly in the centre of the crease', isCorrect: false }
    ]
  },
  {
    frame: 'Point shot with heavy traffic in front',
    question: 'How do you keep sight of it through a double screen?',
    diagram: {
      opp: [{ at: [48, 39], label: 'D' }, { at: [78, 33], label: 'F' }, { at: [78, 46], label: 'F' }],
      me: [88, 39],
      mates: [{ at: [67, 49], label: 'D' }],
      moves: [{ type: 'shot', from: [48, 39], to: [87, 40] }],
      puck: [48, 39]
    },
    options: [
      { text: 'Fight for a sightline around the screen and stay square', isCorrect: true },
      { text: 'Drop into the butterfly early and guess', isCorrect: false },
      { text: 'Shove the net-front man into your own defenceman', isCorrect: false }
    ]
  },
  {
    frame: 'Puck rimmed hard around the glass, forecheck coming',
    question: 'What do you do behind your own goal line?',
    diagram: {
      opp: [{ at: [70, 20], label: 'F1' }],
      me: [89, 39],
      mates: [{ at: [84, 58], label: 'D' }],
      moves: [{ type: 'pass', from: [96, 16], to: [94, 50] }],
      puck: [96, 16]
    },
    options: [
      { text: 'Stop it, set it for your defenceman, and get back in', isCorrect: true },
      { text: 'Try to beat the forechecker yourself', isCorrect: false },
      { text: 'Fire it down the ice', isCorrect: false }
    ]
  },
  {
    frame: 'Breakaway, and his blade is open',
    question: 'What does an open blade tell you?',
    diagram: {
      opp: [{ at: [48, 39], label: 'LW' }],
      me: [86, 39],
      moves: [{ type: 'carry', from: [48, 39], to: [74, 39] }],
      puck: [48, 39]
    },
    options: [
      { text: 'A high wrist shot, or a deke to the five hole', isCorrect: true },
      { text: 'A low slap shot to the far pad', isCorrect: false },
      { text: 'A drop pass to the trailer', isCorrect: false }
    ]
  },
  {
    frame: 'Power play breakdown, cross-seam pass incoming',
    question: 'How do you cover the one-timer on the far side?',
    diagram: {
      opp: [{ at: [66, 60], label: 'C' }, { at: [66, 18], label: 'W' }],
      me: [88, 44],
      moves: [{ type: 'pass', from: [66, 60], to: [66, 20] }, { type: 'shot', from: [66, 18], to: [88, 32] }],
      puck: [66, 60]
    },
    options: [
      { text: 'Explosive backside push in a butterfly slide, head and hands first', isCorrect: true },
      { text: 'Stand up and shuffle across', isCorrect: false },
      { text: 'Dive head first across the goal line', isCorrect: false }
    ]
  }
];

function Board({ diagram }) {
  const d = diagram || {};
  const stops = [
    ...(d.opp || []).map(o => o.at || o),
    ...(d.mates || []).map(m => m.at || m),
    ...(d.me ? [d.me] : [])
  ];
  return (
    <Surface view={ZONE_VIEW}>
      <ZoneSheet />
      {(d.opp || []).map((p, i) => <Marker key={`o${i}`} at={p.at || p} label={p.label} kind="opp" />)}
      {(d.mates || []).map((p, i) => <Marker key={`m${i}`} at={p.at || p} label={p.label} kind="mate" />)}
      {(d.moves || []).map((m, i) => <Move key={`v${i}`} move={m} stops={stops} />)}
      {d.me && <Marker at={d.me} label="YOU" kind="me" />}
      {d.puck && !stops.some(s => Math.hypot(d.puck[0] - s[0], d.puck[1] - s[1]) < 5) && <Puck at={d.puck} />}
    </Surface>
  );
}

const KEYS = ['A', 'B', 'C', 'D'];

export default function FilmRoomGame({ onComplete }) {
  const { player } = useAppContext();
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [marks, setMarks] = useState([]);     // right or wrong, per scenario
  const [shown, setShown] = useState(null);   // the answer just given
  const [finished, setFinished] = useState(false);

  const [scenarios] = useState(() => {
    const pool = player?.pos === 'G' ? GOALIE_SCENARIOS : SKATER_SCENARIOS;
    return [...pool].sort(() => 0.5 - Math.random()).slice(0, 3);
  });

  const answer = (opt, i) => {
    if (shown) return;
    setShown({ i, isCorrect: opt.isCorrect });
    const next = score + (opt.isCorrect ? 1 : 0);
    setMarks(m => [...m, opt.isCorrect]);

    setTimeout(() => {
      setScore(next);
      setShown(null);
      if (step + 1 >= scenarios.length) setFinished(true);
      else setStep(step + 1);
    }, 1300);
  };

  if (!scenarios.length) return null;

  if (finished) {
    const win = score >= 2;
    return (
      <div className="w-full max-w-xl mx-auto fade-up text-center">
        <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.22em] text-slate-500">
          Session reviewed
        </p>
        <div className={`mt-4 rounded-2xl border p-7 ${
          win ? 'border-[#22E748]/30 bg-[#22E748]/[0.06]' : 'border-[#ef4444]/30 bg-[#ef4444]/[0.06]'
        }`}>
          <div className={`sports-font font-black leading-none tracking-tighter ${win ? 'text-[#22E748]' : 'text-[#ef4444]'}`}
               style={{ fontSize: 'clamp(2.6rem,12vw,4.2rem)' }}>
            {score}<span className="text-slate-600 text-[0.45em]"> / {scenarios.length}</span>
          </div>
          <div className="mt-4 flex justify-center">
            <Pips label="Reads" filled={marks.filter(Boolean).length} total={scenarios.length} />
          </div>
          <p className="mt-5 text-sm sm:text-base text-slate-300 leading-relaxed">
            {score === 3 ? 'Three from three. The staff have you down as a player who has done the reading.'
              : score === 2 ? 'You made the right read where it mattered and the staff noticed.'
                : 'You were guessing, and everyone in the room could tell.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onComplete(win)}
          className="mt-6 w-full btn-primary py-4 rounded-xl text-base sm:text-lg cursor-pointer sports-font tracking-[0.18em]"
        >
          LEAVE THE FILM ROOM
        </button>
      </div>
    );
  }

  const current = scenarios[step];

  return (
    <div className="w-full max-w-xl mx-auto fade-up">
      {/* The tape strip: three frames, and which one is up. */}
      <div className="flex items-center justify-between gap-4 px-1">
        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
          Clip {step + 1} of {scenarios.length}
        </span>
        <span className="flex gap-1.5">
          {scenarios.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-8 rounded-full ${
                i < marks.length
                  ? marks[i] ? 'bg-[#22E748]' : 'bg-[#ef4444]'
                  : i === step ? 'bg-slate-400' : 'bg-[rgba(255,255,255,0.1)]'
              }`}
            />
          ))}
        </span>
      </div>

      <div className="mt-3 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#070b09] overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <div className="px-4 py-2.5 border-b border-[rgba(255,255,255,0.06)] flex items-center gap-2.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" />
          <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.16em] text-slate-400 truncate">
            {current.frame}
          </span>
        </div>
        <Board diagram={current.diagram} />
      </div>

      <h3 className="mt-5 text-lg sm:text-xl font-black text-white sports-font uppercase tracking-tight leading-tight text-center">
        {current.question}
      </h3>

      <div className="mt-4 flex flex-col gap-2.5">
        {current.options.map((opt, i) => {
          const picked = shown?.i === i;
          const reveal = shown && opt.isCorrect;
          const cls = picked && shown.isCorrect ? 'border-[#22E748] bg-[#22E748]/12 text-[#22E748]'
            : picked ? 'border-[#ef4444] bg-[#ef4444]/12 text-[#ef4444]'
              : reveal ? 'border-[#22E748]/50 bg-[#22E748]/[0.06] text-[#22E748]'
                : shown ? 'border-[rgba(255,255,255,0.06)] bg-[#0a0d0a] text-slate-600'
                  : 'border-[rgba(255,255,255,0.08)] bg-[#101410] text-slate-300 hover:border-[#22E748]/50 hover:text-white';
          return (
            <button
              key={i}
              type="button"
              disabled={!!shown}
              onClick={() => answer(opt, i)}
              className={`w-full flex items-start gap-3 text-left p-4 rounded-xl border text-sm transition-all ${cls} ${
                shown ? 'cursor-default' : 'cursor-pointer active:scale-[0.99]'
              }`}
            >
              <span className="shrink-0 mt-[1px] text-[10px] font-black tracking-widest opacity-60">{KEYS[i]}</span>
              <span className="leading-snug">{opt.text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
