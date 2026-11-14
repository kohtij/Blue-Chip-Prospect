import { useAppContext } from '../AppContext';
import TeamLogo from '../components/TeamLogo';
import { getTeamData, readableAccent, teamAccent } from '../data/teams';
import { getFullTeamName } from '../utils/appHelpers';
import { proSeasonsOf } from '../utils/waivers';
import { bonusCeiling, SB_SHARE, veteranBonuses } from '../utils/bonuses';

// CONTRACT TALKS.
//
// One column: the deal as it stands, written the way a free agency card
// writes it (a salary "/YR", the term under it, labelled rows), the GM's
// patience under that, and then the asks as compact buttons, grouped by what
// they change, with the two ways out at the bottom.
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
  { at: 0, word: 'One more push and he\'s gone', tone: '#ef4444' }
];
const moodOf = (p) => MOOD.find(m => p > m.at) || MOOD[MOOD.length - 1];

// What the GM says back, by move and outcome. One line each, in his voice.
const REPLY = {
  safe: ['He wrote a slightly bigger number down without much argument.'],
  hardball: ['He didn\'t like it, and he moved anyway.'],
  bluff_ok: ['He believed you had another offer. The number went up a long way.'],
  bluff_no: ['He asked to see the other offer. There was no other offer.'],
  term_up_ok: ['He agreed to add a year.'],
  term_up_no: ['He wouldn\'t go a year longer, and it cost you some goodwill asking.'],
  term_down_ok: ['He took a year off the deal.'],
  term_down_no: ['He wants the term he offered, and said so.'],
  ntc_ok: ['He agreed to a no-trade clause, and took a little off the money for it.'],
  ntc_no: ['He won\'t give up the right to trade you, at least not yet.'],
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
    label = 'Asked for a bit more'; reply = say('safe'); trustHit = 2;
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
    label = 'Asked for another year'; reply = say(ok ? 'term_up_ok' : 'term_up_no'); trustHit = ok ? -5 : -10;
  } else if (type === 'term_down') {
    ok = Math.random() < (0.60 + succBoost) && currentYears > 1;
    damage = (ok ? 5 : 15) * dmgMult; dYears = ok ? -1 : 0;
    label = 'Asked for a shorter deal'; reply = say(ok ? 'term_down_ok' : 'term_down_no'); trustHit = ok ? -5 : -10;
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

// An ask is a button like any other in the game: a short label, and under it
// one small line with what it does and how likely it is. The longer
// explanation is kept as the button's tooltip. A risky ask is red, the same
// as demanding a trade at the deadline.
const Move = ({ onPick, live, type, title, hint, tone = '#94a3b8', danger, disabled, explain, wide }) => (
  <button
    type="button"
    onClick={() => onPick(type)}
    disabled={!live || disabled}
    title={explain}
    className={`${danger && !disabled ? 'btn-danger' : 'btn-secondary'} ${wide ? 'col-span-2' : ''} py-2.5 px-3 rounded-lg flex flex-col items-center justify-center gap-1 sports-font uppercase transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98]`}
  >
    <span className="text-xs sm:text-sm tracking-[0.12em] leading-none">{title}</span>
    <span className="text-[9px] sm:text-[10px] font-bold tracking-[0.16em] leading-none" style={{ color: disabled ? undefined : tone }}>
      {hint}
    </span>
  </button>
);

// How likely he is to say yes, as a word. A row of percentages on the buttons
// read as costs and odds and raises all at once, and it was hard to tell which
// number was the chance it worked.
const ODDS = [
  { at: 0.75, word: 'Very likely', tone: '#22E748' },
  { at: 0.55, word: 'Likely', tone: '#22E748' },
  { at: 0.4, word: 'Coin flip', tone: '#F59E0B' },
  { at: 0.2, word: 'Unlikely', tone: '#f97316' },
  { at: 0, word: 'Long shot', tone: '#ef4444' }
];
const oddsOf = (p) => ODDS.find(o => p >= o.at) || ODDS[ODDS.length - 1];

const Group = ({ title, note, children }) => (
  <div>
    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 mb-2">{title}</p>
    <div className="grid grid-cols-2 gap-2">{children}</div>
    {note && <p className="mt-1.5 text-[11px] text-slate-500 leading-snug">{note}</p>}
  </div>
);

// One labelled line of the deal, the same row the free agency cards use.
const Line = ({ label, children, tone = 'text-white' }) => (
  <p className="flex items-baseline gap-3 font-bold uppercase tracking-wider">
    <span className="text-slate-500 shrink-0">{label}</span>
    <span className={`ml-auto min-w-0 text-right ${tone}`}>{children}</span>
  </p>
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
        msg: `He walked out of the room, and the offer he left on the table is ${money(penalty)} a year lower. Word is getting round the league that you're greedy.`
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
      msg: nextRound >= prev.maxRounds ? `${reply} That's as far as he'll go.` : reply
    }));
  };

  const mood = moodOf(n.gmPatience);
  const salaryDelta = n.currentSalary - offer.salary;
  const yearsDelta = n.currentYears - (offer.years || 1);
  const total = n.currentSalary * n.currentYears;
  const clauseText = nmc ? 'No-movement clause' : ntc ? 'No-trade clause' : null;

  const clauseBlocked = !clauseLeague
    ? 'Clauses are an NHL thing. Nobody here will put one in.'
    : !ufaEligible
      ? 'Not until you\'re UFA-eligible: 27, or seven pro seasons.'
      : null;

  return (
    // The talks are with the club making the offer, so the page wears its
    // colour rather than the colour of the club you're leaving.
    // w-full: with auto side margins and no width of its own, the page sized
    // itself to its content and got narrower or wider as the GM's reply and
    // the list of asks changed length.
    <div className="w-full max-w-2xl mx-auto mt-2 flex flex-col gap-3" style={{ '--club': accent }}>

      {/* THE DEAL, AND THE MAN ACROSS THE DESK */}
      <div className="game-panel relative overflow-hidden p-4 sm:p-6">
        <div className="absolute inset-x-0 top-0 h-[3px]" style={{ backgroundColor: accent }} />
        <div className="absolute inset-x-0 top-0 h-24 pointer-events-none opacity-[0.14]"
             style={{ background: `radial-gradient(120% 100% at 50% 0%, ${accent} 0%, transparent 70%)` }} />

        <div className="relative flex items-center gap-3">
          <TeamLogo teamId={offer.team} league={lg} isAHL={lg === 'AHL'} size="small" />
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-2xl font-black text-white sports-font uppercase leading-tight break-words">
              {getFullTeamName(offer.team, lg)}
            </h2>
            <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: accentText }}>
              {[lg, teamData?.div, offer.role].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>

        <div className="relative mt-5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-4xl sm:text-5xl font-black text-white sports-font tracking-tighter number-font">{money(n.currentSalary)}</span>
            <span className="text-[10px] sm:text-[11px] font-black text-slate-500 uppercase tracking-widest">/YR</span>
          </div>
          <span className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
            {n.currentYears}-YEAR CONTRACT
          </span>
        </div>

        <div className="relative mt-4 border-t border-[rgba(255,255,255,0.07)] pt-3 flex flex-col gap-1.5 text-[11px] sm:text-xs font-sans">
          <Line label="Total value">{money(total)}</Line>
          {salaryDelta !== 0 && (
            <Line label="On his first offer" tone={salaryDelta > 0 ? 'text-[#22E748]' : 'text-[#ef4444]'}>
              {salaryDelta > 0 ? '+' : '-'}{money(salaryDelta)}/YR
            </Line>
          )}
          {yearsDelta !== 0 && (
            <Line label="Term" tone="text-[#60a5fa]">
              {yearsDelta > 0 ? '+' : ''}{yearsDelta} {Math.abs(yearsDelta) === 1 ? 'YEAR' : 'YEARS'}
            </Line>
          )}
          {clauseLeague && (
            <>
              <Line label="Clause" tone={clauseText ? 'text-[#c084fc]' : 'text-slate-400'}>{clauseText || 'None'}</Line>
              <Line label="Signing bonus" tone={sb ? 'text-[#F59E0B]' : 'text-slate-400'}>
                {sb ? `${Math.round(SB_SHARE * 100)}% of each year` : 'None'}
              </Line>
              {gp && (
                <Line label="Games bonuses" tone="text-[#F59E0B]">Up to {money(bonusCeiling(veteranBonuses()))}</Line>
              )}
            </>
          )}
          {hasAgent && <Line label="In the room" tone="text-[#c084fc]">Your agent</Line>}
        </div>

        {/* ACROSS THE DESK */}
        <div className="relative mt-5 pt-4 border-t border-[rgba(255,255,255,0.07)]">
          <div className="flex items-baseline justify-between gap-2 mb-1.5">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">GM patience</span>
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
            <span className="shrink-0 text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
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
                <li key={i} className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                  <span className={h.success ? 'text-[#22E748]' : 'text-[#ef4444]'}>{h.success ? '✓' : '✕'}</span>
                  {h.label}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* EVERYTHING YOU CAN DO, UNDER THE DEAL IT CHANGES */}
      <div className="game-panel p-4 sm:p-6 flex flex-col gap-4">
        {/* Signing comes first: it's the decision every ask is working
            towards, and it shouldn't sit below a screen of buttons. Going
            back to the other offers stays at the very bottom. */}
        <button onClick={() => finishNegotiation(true)} className={`btn-primary w-full py-4 rounded-xl font-black sports-font text-base sm:text-lg uppercase tracking-widest cursor-pointer ${live ? 'mb-1' : ''}`}>
          Sign this deal
        </button>
        {live ? (
          <>
            {/* Money asks always move the number, so the line under them is
                what you would get. Everything else might be refused, so the
                line is how likely he is to agree. What each one costs you in
                goodwill or salary is in the tooltip. */}
            <Group title="Money">
              <Move onPick={push} live={live} type="safe" title="A bit more" hint={`+${money(round25k(offer.salary * 0.03))}`} tone="#22E748"
                    explain="About 3% more a year. He rarely minds." />
              <Move onPick={push} live={live} type="hardball" title="Push hard" hint={`+${money(round25k(offer.salary * 0.08))}`} tone="#F59E0B"
                    explain="About 8% more. He gives it, but it costs a lot of his patience." />
              <Move onPick={push} live={live} type="bluff" title="Bluff" danger wide
                    hint={`+${money(round25k(offer.salary * 0.15))} · ${oddsOf(0.40 + (hasAgent ? 0.25 : 0)).word}`} tone="#f87171"
                    explain="Tell him you have another offer. About 15% more if he believes you. If he doesn't, he nearly walks." />
            </Group>
            <Group title="Term">
              <Move onPick={push} live={live} type="term_up" title="+1 year"
                    hint={oddsOf(0.50 + (hasAgent ? 0.25 : 0)).word} tone={oddsOf(0.50 + (hasAgent ? 0.25 : 0)).tone}
                    explain="One more year of security, if he'll go there." disabled={n.currentYears >= 8} />
              <Move onPick={push} live={live} type="term_down" title="-1 year"
                    hint={oddsOf(0.60 + (hasAgent ? 0.25 : 0)).word} tone={oddsOf(0.60 + (hasAgent ? 0.25 : 0)).tone}
                    explain="One year shorter, so you're back on the market sooner." disabled={n.currentYears <= 1} />
            </Group>
            {/* Clauses and bonus structure only exist on NHL deals here, so
                anywhere else the two groups are left off. When they are locked
                for this player, one line under the group says why. */}
            {clauseLeague && (
              <Group title="Protection" note={clauseBlocked}>
                <Move onPick={push} live={live} type="ntc" title="No-trade" tone={oddsOf(ntcOdds).tone}
                      hint={clauseBlocked ? 'Locked' : (ntc || nmc) ? 'In the deal' : oddsOf(ntcOdds).word}
                      explain="He can't trade you without your say. Takes about 3% off the money."
                      disabled={!!clauseBlocked || ntc || nmc} />
                <Move onPick={push} live={live} type="nmc" title="No-movement" tone={oddsOf(nmcOdds).tone}
                      hint={clauseBlocked ? 'Locked' : nmc ? 'In the deal' : oddsOf(nmcOdds).word}
                      explain="No trade, no waivers, no sending you down. Takes about 6% off the money."
                      disabled={!!clauseBlocked || nmc} />
              </Group>
            )}
            {clauseLeague && (
              <Group title="How it's paid" note={gpBlocked && !gp ? `Games bonus: ${gpBlocked.toLowerCase()}` : null}>
                <Move onPick={push} live={live} type="sb" title="Signing bonus" tone={oddsOf(sbOdds).tone}
                      hint={sb ? 'In the deal' : oddsOf(sbOdds).word}
                      explain="Half of each year paid on July 1, where a buyout can't touch it. Takes about 2% off the money."
                      disabled={sb} />
                <Move onPick={push} live={live} type="gp" title="Games bonus" tone={oddsOf(gpOdds).tone}
                      hint={gpBlocked ? 'Locked' : gp ? 'In the deal' : oddsOf(gpOdds).word}
                      explain={`Up to ${money(bonusCeiling(veteranBonuses()))} more for playing 10, 40 and 60 games.`}
                      disabled={!!gpBlocked || gp} />
              </Group>
            )}
          </>
        ) : (
          <p className="text-sm text-slate-300 leading-relaxed">
            {n.status === 'busted'
              ? 'The talks are over. You can still sign what he left on the table, or go back to your other offers.'
              : 'He has gone as far as he\'ll go. Sign it, or go back to your other offers.'}
          </p>
        )}

        <div className={`flex flex-col gap-2 ${live ? 'pt-4 border-t border-[rgba(255,255,255,0.07)]' : ''}`}>
          <button onClick={() => finishNegotiation(false)} className="btn-secondary w-full py-3.5 rounded-xl font-black sports-font text-sm uppercase tracking-widest cursor-pointer">
            Back to offers
          </button>
        </div>
      </div>
    </div>
  );
}
