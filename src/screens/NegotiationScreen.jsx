import { useAppContext } from '../AppContext';
import TeamLogo from '../components/TeamLogo';
import { getTeamData, readableAccent, teamAccent } from '../data/teams';
import { getFullTeamName } from '../utils/appHelpers';
import { proSeasonsOf } from '../utils/waivers';
import { bonusCeiling, SB_SHARE, veteranBonuses } from '../utils/bonuses';

// CONTRACT TALKS.
//
// One screen, read top to bottom in the order a player thinks about a deal:
// who it is with, what is on the table, how much patience is left across the
// desk, and then what to ask for. The moves are grouped by what they change,
// money, term or protection, and each says plainly what it risks.
//
// Protection is new. A no-trade clause stops the club trading him without his
// say. A no-movement clause goes further: no trade, no waivers, no sending
// him down. The real rule only lets either take effect once a player is
// eligible for unrestricted free agency, and the game follows it.
//
// Structure is how the money arrives. Half of each year as a signing bonus
// lands on July 1 and cannot be taken back by a buyout. Games-played bonuses
// are only allowed on a one-year deal at thirty-five or older.

const round25k = (n) => Math.round(n / 25000) * 25000;

// Two decimals in the millions, because a negotiation moves in steps of a
// hundred thousand and $3.1M against $3.1M hides the difference.
const money = (n) => {
  const v = Math.abs(n || 0);
  if (v >= 1000000) return `$${(v / 1000000).toFixed(2).replace(/0$/, '')}M`;
  if (v >= 1000) return `$${Math.round(v / 1000)}K`;
  return `$${v}`;
};

const MOOD = [
  { at: 70, word: 'Patient', tone: '#22E748' },
  { at: 45, word: 'Getting short with you', tone: '#F59E0B' },
  { at: 20, word: 'Close to walking out', tone: '#f97316' },
  { at: 0, word: 'One more push and he is gone', tone: '#ef4444' }
];
const moodOf = (p) => MOOD.find(m => p > m.at) || MOOD[MOOD.length - 1];

// What the GM says back, by move and outcome. One line each, in his voice.
const REPLY = {
  safe: ['He wrote a slightly bigger number down without much argument.'],
  hardball: ['He did not like it, and he moved anyway.'],
  bluff_ok: ['He believed you had another offer. The number went up a long way.'],
  bluff_no: ['He asked to see the other offer. There was no other offer.'],
  term_up_ok: ['He agreed to add a year.'],
  term_up_no: ['He would not go a year longer, and it cost you some goodwill asking.'],
  term_down_ok: ['He took a year off the deal.'],
  term_down_no: ['He wants the term he offered, and said so.'],
  ntc_ok: ['He agreed to a no-trade clause, and took a little off the money for it.'],
  ntc_no: ['He will not give up the right to trade you, at least not yet.'],
  nmc_ok: ['He gave you a full no-movement clause, took real money off for it, and still looked like he regretted it.'],
  nmc_no: ['He laughed, then saw you were serious, and stopped laughing.'],
  sb_ok: ['He agreed to pay half of it as signing bonuses, and shaved a little off for the trouble.'],
  sb_no: ['He said the owner pays salary, not lump sums, and that was the end of it.'],
  gp_ok: ['He agreed to pay for games played: ten, forty and sixty.'],
  gp_no: ['He wants to see you play before he pays you for it.']
};
const say = (key) => REPLY[key][Math.floor(Math.random() * REPLY[key].length)];

// Everything random about a move, kept outside the component so a render can
// never roll it.
function rollMove(type, { hasAgent, base, currentSalary, currentYears, ntcOdds, nmcOdds, sbOdds, gpOdds }) {
  const dmgMult = hasAgent ? 0.4 : 1.0;
  const succBoost = hasAgent ? 0.25 : 0;
  let damage = 0, dSalary = 0, dYears = 0, ok = true, trustHit = 0, reply = '', label = '';
  let grant = null;

  if (type === 'safe') {
    damage = (Math.floor(Math.random() * 10) + 5) * dmgMult;
    dSalary = round25k(base * 0.03);
    label = 'A little more'; reply = say('safe'); trustHit = 2;
  } else if (type === 'hardball') {
    damage = (Math.floor(Math.random() * 25) + 15) * dmgMult;
    dSalary = round25k(base * 0.08);
    label = 'Pushed hard'; reply = say('hardball'); trustHit = -15;
  } else if (type === 'bluff') {
    ok = Math.random() < (0.40 + succBoost);
    damage = (ok ? 5 : 45) * dmgMult;
    dSalary = ok ? round25k(base * 0.15) : 0;
    label = 'Bluffed another offer'; reply = say(ok ? 'bluff_ok' : 'bluff_no'); trustHit = ok ? -10 : -25;
  } else if (type === 'term_up') {
    ok = Math.random() < (0.50 + succBoost) && currentYears < 8;
    damage = (ok ? 10 : 25) * dmgMult; dYears = ok ? 1 : 0;
    label = 'One more year'; reply = say(ok ? 'term_up_ok' : 'term_up_no'); trustHit = ok ? -5 : -10;
  } else if (type === 'term_down') {
    ok = Math.random() < (0.60 + succBoost) && currentYears > 1;
    damage = (ok ? 5 : 15) * dmgMult; dYears = ok ? -1 : 0;
    label = 'One year fewer'; reply = say(ok ? 'term_down_ok' : 'term_down_no'); trustHit = ok ? -5 : -10;
  } else if (type === 'ntc') {
    ok = Math.random() < ntcOdds;
    damage = (ok ? 10 : 22) * dmgMult;
    dSalary = ok ? -round25k(currentSalary * 0.03) : 0;
    grant = ok ? 'ntc' : null;
    label = 'Asked for a no-trade clause'; reply = say(ok ? 'ntc_ok' : 'ntc_no'); trustHit = ok ? -3 : -8;
  } else if (type === 'nmc') {
    ok = Math.random() < nmcOdds;
    damage = (ok ? 15 : 32) * dmgMult;
    dSalary = ok ? -round25k(currentSalary * 0.06) : 0;
    grant = ok ? 'nmc' : null;
    label = 'Asked for a no-movement clause'; reply = say(ok ? 'nmc_ok' : 'nmc_no'); trustHit = ok ? -5 : -12;
  } else if (type === 'sb') {
    ok = Math.random() < sbOdds;
    damage = (ok ? 8 : 18) * dmgMult;
    dSalary = ok ? -round25k(currentSalary * 0.02) : 0;
    grant = ok ? 'sb' : null;
    label = 'Asked for signing bonuses'; reply = say(ok ? 'sb_ok' : 'sb_no'); trustHit = ok ? -2 : -6;
  } else if (type === 'gp') {
    ok = Math.random() < gpOdds;
    damage = (ok ? 5 : 12) * dmgMult;
    grant = ok ? 'gp' : null;
    label = 'Asked for games-played bonuses'; reply = say(ok ? 'gp_ok' : 'gp_no'); trustHit = ok ? 0 : -4;
  }

  return { damage, dSalary, dYears, ok, trustHit, reply, label, grant };
}

const Move = ({ onPick, live, type, title, line, risk, riskTone, disabled, note }) => (
  <button
    type="button"
    onClick={() => onPick(type)}
    disabled={!live || disabled}
    className="text-left rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0d110d] px-3.5 py-3 transition-colors hover:border-[rgba(255,255,255,0.22)] hover:bg-[#121812] disabled:opacity-40 disabled:hover:border-[rgba(255,255,255,0.08)] disabled:hover:bg-[#0d110d] disabled:cursor-not-allowed cursor-pointer active:scale-[0.99]"
  >
    <span className="flex items-baseline justify-between gap-2">
      <span className="text-[13px] sm:text-sm font-black text-white leading-tight">{title}</span>
      <span className="shrink-0 text-[9px] font-black uppercase tracking-widest" style={{ color: riskTone }}>{risk}</span>
    </span>
    <span className="block text-[11px] sm:text-xs text-slate-400 leading-snug mt-1">{note || line}</span>
  </button>
);

const Group = ({ title, children, cols = 'sm:grid-cols-3' }) => (
  <div>
    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">{title}</p>
    <div className={`grid grid-cols-1 ${cols} gap-2`}>{children}</div>
  </div>
);


export default function NegotiationScreen() {
  const { finishNegotiation, negotiation, setNegotiation, player, setPlayer } = useAppContext();
  const hasAgent = (player.inventory || []).includes('agent');
  const n = negotiation;
  const offer = n.originalOffer;
  const lg = offer.league || 'NHL';
  const teamData = getTeamData(offer.team, lg);
  const accent = teamAccent(teamData);
  const accentText = readableAccent(accent);

  const live = n.status === 'playing';
  const ntc = !!n.ntc;
  const nmc = !!n.nmc;

  // Clauses only exist in the NHL here, and only take effect for a player who
  // could otherwise walk as an unrestricted free agent: 27, or seven seasons.
  const clauseLeague = lg === 'NHL';
  const ufaEligible = (player.age || 0) >= 27 || proSeasonsOf(player) >= 7;
  const ovr = player.ovr || 70;

  // How likely a clause is to be granted. Mostly how good he is, a little the
  // agent, and the no-movement clause is a much bigger ask than the no-trade.
  const ntcOdds = Math.min(0.9, Math.max(0.08, 0.30 + (ovr - 76) * 0.03 + (hasAgent ? 0.15 : 0)));
  const nmcOdds = Math.min(0.85, Math.max(0.04, 0.12 + (ovr - 80) * 0.035 + (hasAgent ? 0.15 : 0)));
  // Signing bonuses cost the club nothing extra, only cash sooner, so a good
  // player usually gets them. Games-played bonuses cost it nothing unless he
  // plays, so most GMs say yes.
  const sbOdds = Math.min(0.9, Math.max(0.15, 0.45 + (ovr - 78) * 0.03 + (hasAgent ? 0.15 : 0)));
  const gpOdds = Math.min(0.95, 0.75 + (hasAgent ? 0.15 : 0));
  const sb = !!n.sb;
  const gp = !!n.gpBonus && n.currentYears === 1;
  const gpBlocked = !clauseLeague
    ? 'Only NHL deals carry them here.'
    : (player.age || 0) < 35
      ? 'Only on a one-year deal at 35 or older.'
      : n.currentYears !== 1
        ? 'Only on a one-year deal.'
        : null;

  const push = (type) => {
    if (!live) return;
    const { damage, dSalary, dYears, ok, trustHit, reply, label, grant } = rollMove(type, {
      hasAgent, base: offer.salary, currentSalary: n.currentSalary, currentYears: n.currentYears, ntcOdds, nmcOdds, sbOdds, gpOdds
    });
    const base = offer.salary;

    if (trustHit !== 0) {
      setPlayer(p => ({
        ...p,
        relationships: {
          ...p.relationships,
          coach: Math.min(100, Math.max(0, (p.relationships?.coach || 50) + trustHit))
        }
      }));
    }

    const patience = n.gmPatience - damage;
    const nextRound = n.rounds + 1;

    if (patience <= 0) {
      const penalty = round25k(base * 0.15);
      setPlayer(p => ({
        ...p,
        stats: { ...p.stats, reputation: Math.max(50, (p.stats?.reputation ?? 100) - 5) },
        relationships: { ...p.relationships, coach: Math.max(0, (p.relationships?.coach || 50) - 40) }
      }));
      setNegotiation(prev => ({
        ...prev, gmPatience: 0, currentSalary: Math.max(850000, prev.currentSalary - penalty),
        status: 'busted', history: [...prev.history, { label, success: false }],
        msg: `He walked out of the room, and the offer he left on the table is ${money(penalty)} a year lower. Word is getting round the league that you are greedy.`
      }));
      return;
    }

    setNegotiation(prev => ({
      ...prev,
      gmPatience: patience,
      currentSalary: Math.max(850000, prev.currentSalary + dSalary),
      currentYears: prev.currentYears + dYears,
      ntc: grant === 'ntc' ? true : prev.ntc,
      // A no-movement clause includes everything a no-trade clause does.
      nmc: grant === 'nmc' ? true : prev.nmc,
      sb: grant === 'sb' ? true : prev.sb,
      gpBonus: grant === 'gp' ? true : prev.gpBonus,
      rounds: nextRound,
      history: [...prev.history, { label, success: ok }],
      status: nextRound >= prev.maxRounds ? 'maxed' : 'playing',
      msg: nextRound >= prev.maxRounds ? `${reply} That is as far as he will go.` : reply
    }));
  };

  const mood = moodOf(n.gmPatience);
  const salaryDelta = n.currentSalary - offer.salary;
  const yearsDelta = n.currentYears - (offer.years || 1);
  const total = n.currentSalary * n.currentYears;
  const clauseText = nmc ? 'No-movement clause' : ntc ? 'No-trade clause' : null;

  const pct = (p) => `${Math.round(p * 100)}%`;
  const clauseBlocked = !clauseLeague
    ? 'Clauses are an NHL thing. Nobody here will put one in.'
    : !ufaEligible
      ? 'Not until you are UFA-eligible: 27, or seven pro seasons.'
      : null;

  return (
    <div className="max-w-2xl mx-auto mt-2 space-y-3">

      {/* WHO */}
      <div className="game-panel relative overflow-hidden p-4 sm:p-5">
        <div className="absolute inset-x-0 top-0 h-[3px]" style={{ backgroundColor: accent }} />
        <div className="absolute inset-x-0 top-0 h-24 pointer-events-none opacity-[0.14]"
             style={{ background: `radial-gradient(120% 100% at 50% 0%, ${accent} 0%, transparent 70%)` }} />
        <div className="relative flex items-center gap-3">
          <TeamLogo teamId={offer.team} league={lg} isAHL={lg === 'AHL'} size="small" />
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Contract talks</p>
            <h2 className="text-lg sm:text-2xl font-black text-white sports-font uppercase leading-tight truncate">
              {getFullTeamName(offer.team, lg)}
            </h2>
            <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: accentText }}>
              {[lg, teamData?.div, offer.role].filter(Boolean).join(' · ')}
            </p>
          </div>
          {hasAgent && (
            <span className="hidden sm:block shrink-0 text-[9px] font-black uppercase tracking-widest text-[#c084fc] border border-[#c084fc]/30 bg-[#c084fc]/10 rounded px-2 py-1">
              Agent in the room
            </span>
          )}
        </div>
      </div>

      {/* THE DEAL */}
      <div className="game-panel p-4 sm:p-6">
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">On the table</p>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-4xl sm:text-5xl font-black text-white sports-font tracking-tighter number-font">{money(n.currentSalary)}</span>
          <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">a year</span>
          <span className="text-xl sm:text-2xl font-black text-slate-300 sports-font">
            × {n.currentYears} {n.currentYears === 1 ? 'year' : 'years'}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] sm:text-xs font-bold">
          <span className="text-slate-400">Total <span className="text-white number-font">{money(total)}</span></span>
          {salaryDelta !== 0 && (
            <span className={salaryDelta > 0 ? 'text-[#22E748]' : 'text-[#ef4444]'}>
              {salaryDelta > 0 ? '+' : '-'}{money(salaryDelta)} a year on his first offer
            </span>
          )}
          {yearsDelta !== 0 && (
            <span className="text-[#3b82f6]">{yearsDelta > 0 ? '+' : ''}{yearsDelta} {Math.abs(yearsDelta) === 1 ? 'year' : 'years'} of term</span>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className={`text-[10px] font-black uppercase tracking-widest rounded px-2 py-1 border ${
            clauseText ? 'text-[#c084fc] border-[#c084fc]/40 bg-[#c084fc]/10' : 'text-slate-500 border-[rgba(255,255,255,0.08)]'}`}>
            {clauseText ? `🔒 ${clauseText}` : 'No clause'}
          </span>
          {sb && (
            <span className="text-[10px] font-black uppercase tracking-widest rounded px-2 py-1 border text-[#F59E0B] border-[#F59E0B]/40 bg-[#F59E0B]/10">
              💵 {Math.round(SB_SHARE * 100)}% as signing bonus
            </span>
          )}
          {gp && (
            <span className="text-[10px] font-black uppercase tracking-widest rounded px-2 py-1 border text-[#F59E0B] border-[#F59E0B]/40 bg-[#F59E0B]/10">
              🎯 Games bonuses, up to {money(bonusCeiling(veteranBonuses()))}
            </span>
          )}
        </div>

        {/* ACROSS THE DESK */}
        <div className="mt-5 pt-4 border-t border-[rgba(255,255,255,0.07)]">
          <div className="flex items-baseline justify-between gap-2 mb-1.5">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">The GM</span>
            <span className="text-[11px] font-black" style={{ color: mood.tone }}>{n.status === 'busted' ? 'Gone' : mood.word}</span>
          </div>
          <div className="h-2 w-full bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
            <div className="h-full transition-all duration-300 rounded-full"
                 style={{ width: `${Math.max(0, n.gmPatience)}%`, backgroundColor: mood.tone }} />
          </div>
          <div className="flex items-center gap-1.5 mt-2.5">
            {Array.from({ length: n.maxRounds }, (_, i) => {
              const h = n.history[i];
              return (
                <span key={i} className={`h-1.5 flex-1 rounded-full ${
                  h ? (h.success ? 'bg-[#22E748]/70' : 'bg-[#ef4444]/70') : 'bg-[rgba(255,255,255,0.08)]'}`} />
              );
            })}
            <span className="shrink-0 text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">
              {Math.min(n.rounds, n.maxRounds)} of {n.maxRounds} asks
            </span>
          </div>
          <p className="mt-3 text-[13px] sm:text-sm text-slate-300 leading-relaxed border-l-2 pl-3"
             style={{ borderColor: n.status === 'busted' ? '#ef4444' : 'rgba(255,255,255,0.15)' }}>
            {n.msg}
          </p>
          {!!n.history.length && (
            <ul className="mt-2 space-y-0.5">
              {n.history.map((h, i) => (
                <li key={i} className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5">
                  <span className={h.success ? 'text-[#22E748]' : 'text-[#ef4444]'}>{h.success ? '✓' : '✕'}</span>
                  {h.label}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* WHAT TO ASK FOR */}
      {live && (
        <div className="game-panel p-4 sm:p-6 space-y-4">
          <Group title="Money">
            <Move onPick={push} live={live} type="safe" title="A little more" line="About 3% more a year. He rarely minds." risk="Safe" riskTone="#22E748" />
            <Move onPick={push} live={live} type="hardball" title="Push hard" line="About 8% more. He gives it, but he remembers." risk="Costly" riskTone="#F59E0B" />
            <Move onPick={push} live={live} type="bluff" title="Bluff another offer" line={`About 15% more if he believes you. He does about ${pct(0.40 + (hasAgent ? 0.25 : 0))} of the time.`} risk="Risky" riskTone="#ef4444" />
          </Group>
          <Group title="Term" cols="sm:grid-cols-2">
            <Move onPick={push} live={live} type="term_up" title="One more year" line="Security, if he will go there." risk="Costly" riskTone="#F59E0B" disabled={n.currentYears >= 8} />
            <Move onPick={push} live={live} type="term_down" title="One year fewer" line="Back on the market sooner." risk="Safe" riskTone="#22E748" disabled={n.currentYears <= 1} />
          </Group>
          <Group title="Protection" cols="sm:grid-cols-2">
            <Move onPick={push} live={live} type="ntc" title="No-trade clause" risk={clauseBlocked ? 'Locked' : pct(ntcOdds)} riskTone={clauseBlocked ? '#64748b' : '#c084fc'}
                  line="He cannot trade you without your say. Costs about 3% of the money."
                  note={clauseBlocked || (ntc || nmc ? 'Already in the deal.' : null)}
                  disabled={!!clauseBlocked || ntc || nmc} />
            <Move onPick={push} live={live} type="nmc" title="No-movement clause" risk={clauseBlocked ? 'Locked' : pct(nmcOdds)} riskTone={clauseBlocked ? '#64748b' : '#c084fc'}
                  line="No trade, no waivers, no sending you down. Costs about 6%."
                  note={clauseBlocked || (nmc ? 'Already in the deal.' : null)}
                  disabled={!!clauseBlocked || nmc} />
          </Group>
          <Group title="Structure" cols="sm:grid-cols-2">
            <Move onPick={push} live={live} type="sb" title="Half as signing bonuses" risk={clauseLeague ? pct(sbOdds) : 'Locked'} riskTone={clauseLeague ? '#F59E0B' : '#64748b'}
                  line="Paid each July 1, and a buyout cannot touch it. Costs about 2%."
                  note={!clauseLeague ? 'Only NHL deals are structured like this here.' : (sb ? 'Already in the deal.' : null)}
                  disabled={!clauseLeague || sb} />
            <Move onPick={push} live={live} type="gp" title="Games-played bonuses" risk={gpBlocked ? 'Locked' : pct(gpOdds)} riskTone={gpBlocked ? '#64748b' : '#F59E0B'}
                  line={`Up to ${money(bonusCeiling(veteranBonuses()))} more if you play 10, 40 and 60 games.`}
                  note={gpBlocked || (gp ? 'Already in the deal.' : null)}
                  disabled={!!gpBlocked || gp} />
          </Group>
        </div>
      )}

      {/* DONE */}
      <div className="flex flex-col sm:flex-row gap-2 pb-2">
        <button onClick={() => finishNegotiation(true)} className="flex-1 btn-primary py-4 rounded-xl font-black sports-font text-base sm:text-lg uppercase tracking-widest cursor-pointer">
          Sign this deal
        </button>
        <button onClick={() => finishNegotiation(false)} className="sm:w-48 bg-[#101410] hover:bg-[#151b15] border border-[rgba(255,255,255,0.08)] text-slate-300 py-4 rounded-xl font-black sports-font text-sm uppercase tracking-widest cursor-pointer transition-colors">
          Back to offers
        </button>
      </div>
    </div>
  );
}
