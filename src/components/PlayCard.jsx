// One play on the board, drawn the way a coach draws it.
//
// The sheet and the notation used to be defined in here, which meant the
// international play cards were the only thing in the game drawn on a real
// rink: the minigames each had a surface of their own invention. Both now come
// from components/rink/Ice, so a play card and a minigame are the same ice with
// the same lines on it, and a change to the geometry reaches both.
//
// The notation is the standard drill-book key: a solid line is a player
// skating, a solid line with cross ticks is a player carrying the puck, a
// dashed line is a pass and a wavy line is a shot. Ice.jsx holds the drawing.

import { ZoneSheet, Marker, Move, Puck, Surface } from './rink/Ice';
import { ZONE_VIEW } from './rink/geometry';

function Rink({ diagram, tone, myLabel, view }) {
  const d = diagram || {};
  // Everywhere a body is standing: arrows stop short of these, and a puck
  // underneath one is not drawn.
  const stops = [
    ...(d.opp || []).map(o => o.at || o),
    ...(d.mates || []).map(m => m.at || m),
    ...(d.me ? [d.me] : [])
  ];
  const dim = tone === 'dim';

  return (
    <Surface view={view || ZONE_VIEW}>
      <ZoneSheet />
      {(d.opp || []).map((p, i) => <Marker key={`o${i}`} at={p.at || p} label={p.label} kind="opp" />)}
      {(d.mates || []).map((p, i) => <Marker key={`m${i}`} at={p.at || p} label={p.label} kind="mate" />)}
      {(d.moves || []).map((m, i) => <Move key={`v${i}`} move={m} tone={tone} stops={stops} />)}
      {d.me && <Marker at={d.me} label={myLabel} kind="me" tone={dim ? undefined : tone} dim={dim} />}
      {d.puck
        && !stops.some(s => Math.hypot(d.puck[0] - s[0], d.puck[1] - s[1]) < 5)
        && !(d.moves || []).some(m => Math.hypot(d.puck[0] - m.from[0], d.puck[1] - m.from[1]) < 6) && (
        <Puck at={d.puck} />
      )}
    </Surface>
  );
}

/**
 * state: 'open' | 'tape' | 'flagged' | 'picked' | 'burned' | 'favourite'
 */
export default function PlayCard({ play, state = 'open', disabled, onPick, myLabel = '', view }) {
  // Lines are coloured by what they are (see INK in Ice.jsx). This is only the
  // colour of the player marker and anything that reflects the card's state.
  const tone =
    state === 'favourite' ? '#38bdf8'
      : state === 'burned' ? '#ef4444'
        : state === 'picked' ? '#22E748'
          : state === 'flagged' ? '#F59E0B'
            : state === 'tape' ? 'dim'
              : '#22E748';

  const frame =
    state === 'favourite' ? 'border-[#38bdf8]/70 bg-[#38bdf8]/[0.07] shadow-[0_0_12px_rgba(56,189,248,0.18)]'
      : state === 'burned' ? 'border-[#ef4444] bg-[#ef4444]/[0.08]'
        : state === 'picked' ? 'border-[#22E748] bg-[#22E748]/[0.08] shadow-[0_0_14px_rgba(34,231,72,0.25)]'
          : state === 'flagged' ? 'border-[#F59E0B]/60 bg-[#F59E0B]/[0.05]'
            : state === 'tape' ? 'border-[rgba(255,255,255,0.10)] bg-[#0a0d0a] opacity-80'
              : 'border-[rgba(255,255,255,0.10)] bg-[#0a0d0a]';

  const Tag = disabled ? 'div' : 'button';

  return (
    <Tag
      {...(disabled ? {} : { type: 'button', onClick: () => onPick?.(play) })}
      title={play.blurb}
      className={`group rounded-xl border p-1.5 sm:p-2 text-left transition-all ${frame} ${
        disabled ? '' : 'cursor-pointer hover:border-[#22E748]/70 hover:scale-[1.03] active:scale-[0.99]'
      }`}
    >
      <div className="rounded-lg overflow-hidden">
        <Rink diagram={play.diagram} tone={tone} myLabel={myLabel} view={view} />
      </div>
      <div className="mt-1.5 px-0.5 pb-0.5">
        <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-slate-300 leading-tight truncate">
          {play.name}
        </p>
        {state === 'tape' && (
          <p className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-slate-500 leading-none mt-1">
            On tape
          </p>
        )}
        {state === 'flagged' && (
          <p className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-[#F59E0B] leading-none mt-1">
            In their pre-scout
          </p>
        )}
        {state === 'favourite' && (
          <p className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-[#38bdf8] leading-none mt-1">
            The room&apos;s play
          </p>
        )}
        {state === 'burned' && (
          <p className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-[#ef4444] leading-none mt-1">
            Scouted
          </p>
        )}
      </div>
    </Tag>
  );
}
