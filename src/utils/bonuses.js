// BONUSES.
//
// Two kinds of money on top of a salary, the way NHL contracts actually carry
// them.
//
// SIGNING BONUSES. Part of each year's money is paid as a lump on July 1
// instead of through the season. A player asks for it for two reasons: it
// arrives months earlier, and a buyout cannot touch it. Stored on the contract
// as sbShare, the fraction of each year's salary paid that way.
//
// PERFORMANCE BONUSES. The league only allows them on entry-level deals and on
// one-year deals for players thirty-five and over, and so does this. An ELC
// carries the two schedules every real one does: Schedule A for individual
// targets, capped at $850K a season, and Schedule B for league honours,
// capped at $2M. A veteran's one-year deal pays for games played, which is
// what a club is worried about with a man that age. Stored on the contract as
// a list of ids; the targets live here.

export const SB_SHARE = 0.5;

const A = 212500;          // each Schedule A target, four of them reach the cap
const A_CAP = 850000;
const B_CAP = 2000000;
const GP = 250000;         // each games-played target on a veteran deal

const has = (awards, name) => (awards || []).some(a => typeof a === 'string' && a.includes(name));

export const BONUS_TABLE = {
  // Schedule A, forwards.
  f_goals:   { kind: 'A', label: '20 goals',                 test: s => s.g >= 20 },
  f_assists: { kind: 'A', label: '35 assists',               test: s => s.a >= 35 },
  f_points:  { kind: 'A', label: '60 points',                test: s => s.g + s.a >= 60 },
  f_ppg:     { kind: 'A', label: '0.73 points a game',       test: s => s.games >= 42 && (s.g + s.a) / s.games >= 0.73 },
  f_toi:     { kind: 'A', label: 'Top-six minutes',          test: s => s.games >= 42 && s.toi >= 17.0 },
  f_pm:      { kind: 'A', label: 'Plus-15',                  test: s => s.pm >= 15 },
  // Schedule A, defencemen.
  d_goals:   { kind: 'A', label: '10 goals',                 test: s => s.g >= 10 },
  d_assists: { kind: 'A', label: '25 assists',               test: s => s.a >= 25 },
  d_points:  { kind: 'A', label: '40 points',                test: s => s.g + s.a >= 40 },
  d_toi:     { kind: 'A', label: 'Top-four minutes',         test: s => s.games >= 42 && s.toi >= 20.5 },
  d_blocks:  { kind: 'A', label: '120 blocked shots',        test: s => s.blk >= 120 },
  d_pm:      { kind: 'A', label: 'Plus-15',                  test: s => s.pm >= 15 },
  // Schedule A, goaltenders.
  g_sv:      { kind: 'A', label: '.912 save percentage',     test: s => s.games >= 25 && s.shots > 0 && s.saves / s.shots >= 0.912 },
  g_gaa:     { kind: 'A', label: '2.50 goals-against',       test: s => s.games >= 25 && (s.shots - s.saves) / s.games <= 2.50 },
  g_wins:    { kind: 'A', label: '30 wins',                  test: s => s.wins >= 30 },
  g_sho:     { kind: 'A', label: '4 shutouts',               test: s => s.sho >= 4 },
  g_starts:  { kind: 'A', label: '40 games played',          test: s => s.games >= 40 },
  // Either position.
  allstar:   { kind: 'A', label: 'All-Star selection',            test: s => s.allStar },
  // Schedule B, the league's own honours.
  b_calder:  { kind: 'B', label: 'Calder Trophy', amount: 1000000, test: s => has(s.awards, 'Calder Trophy') },
  b_hart:    { kind: 'B', label: 'Hart Trophy',   amount: 1000000, test: s => has(s.awards, 'Hart Trophy') },
  b_ross:    { kind: 'B', label: 'Art Ross Trophy', amount: 1000000, test: s => has(s.awards, 'Art Ross Trophy') },
  b_richard: { kind: 'B', label: 'Rocket Richard Trophy', amount: 500000, test: s => has(s.awards, 'Maurice Richard Trophy') },
  b_norris:  { kind: 'B', label: 'Norris Trophy', amount: 1000000, test: s => has(s.awards, 'Norris Trophy') },
  b_vezina:  { kind: 'B', label: 'Vezina Trophy', amount: 1000000, test: s => has(s.awards, 'Vezina Trophy') },
  b_lindsay: { kind: 'B', label: 'Ted Lindsay Award', amount: 500000, test: s => has(s.awards, 'Ted Lindsay Award') },
  b_team1:   { kind: 'B', label: 'First All-Star Team', amount: 500000, test: s => has(s.awards, '1st Team All-Star') },
  // A veteran's one-year deal.
  v_gp10:    { kind: 'GP', label: '10 games',                test: s => s.games >= 10 },
  v_gp40:    { kind: 'GP', label: '40 games',                test: s => s.games >= 40 },
  v_gp60:    { kind: 'GP', label: '60 games',                test: s => s.games >= 60 }
};

const amountOf = (id) => {
  const b = BONUS_TABLE[id];
  if (!b) return 0;
  return b.amount ?? (b.kind === 'GP' ? GP : A);
};

// What an entry-level deal carries, by position.
export function elcBonuses(pos) {
  const a = pos === 'G'
    ? ['g_sv', 'g_gaa', 'g_wins', 'g_sho', 'g_starts', 'allstar']
    : (pos === 'LD' || pos === 'RD')
      ? ['d_goals', 'd_assists', 'd_points', 'd_toi', 'd_blocks', 'd_pm', 'allstar']
      : ['f_goals', 'f_assists', 'f_points', 'f_ppg', 'f_toi', 'f_pm', 'allstar'];
  const b = pos === 'G'
    ? ['b_calder', 'b_vezina', 'b_hart', 'b_team1']
    : (pos === 'LD' || pos === 'RD')
      ? ['b_calder', 'b_norris', 'b_hart', 'b_team1']
      : ['b_calder', 'b_hart', 'b_ross', 'b_richard', 'b_lindsay', 'b_team1'];
  return [...a, ...b];
}

export const veteranBonuses = () => ['v_gp10', 'v_gp40', 'v_gp60'];

// Whether a deal of this shape is allowed to carry performance bonuses at all.
export function bonusEligible({ age, years, elc }) {
  return !!elc || (age >= 35 && years === 1);
}

// The most a contract's performance bonuses can pay in one season.
export function bonusCeiling(ids) {
  let a = 0, b = 0, gp = 0;
  for (const id of ids || []) {
    const k = BONUS_TABLE[id]?.kind;
    if (k === 'A') a += amountOf(id);
    else if (k === 'B') b += amountOf(id);
    else if (k === 'GP') gp += amountOf(id);
  }
  return Math.min(a, A_CAP) + Math.min(b, B_CAP) + gp;
}

// What a season earned. s holds the NHL numbers only, because no bonus in an
// NHL contract pays out for games somewhere else.
export function earnedBonuses(ids, s) {
  const lines = [];
  let a = 0, b = 0, gp = 0;
  for (const id of ids || []) {
    const row = BONUS_TABLE[id];
    if (!row || !row.test(s)) continue;
    const amt = amountOf(id);
    if (row.kind === 'A') {
      const pay = Math.max(0, Math.min(amt, A_CAP - a));
      if (pay > 0) { a += pay; lines.push({ label: row.label, amount: pay }); }
    } else if (row.kind === 'B') {
      const pay = Math.max(0, Math.min(amt, B_CAP - b));
      if (pay > 0) { b += pay; lines.push({ label: row.label, amount: pay }); }
    } else {
      gp += amt; lines.push({ label: row.label, amount: amt });
    }
  }
  return { lines, total: a + b + gp };
}

// The bonus targets, in words, for the contract panels.
export function bonusLabels(ids) {
  return (ids || []).map(id => BONUS_TABLE[id]?.label).filter(Boolean);
}

// How a season's salary is split between the July lump and the cheques.
export function salaryParts(contract) {
  const salary = contract?.salary || 0;
  const share = Math.max(0, Math.min(1, contract?.sbShare || 0));
  const bonus = Math.round(salary * share);
  return { bonus, wages: salary - bonus };
}

// BUYOUTS.
//
// The NHL rule: two thirds of the salary left on the deal, or one third for a
// player under twenty-six, paid over twice the remaining term. Signing bonuses
// are not salary and are left out of it, because they are owed in full anyway.
export function buyoutTerms(contract, age) {
  const years = Math.max(1, contract?.years || 0);
  const { wages } = salaryParts(contract);
  const young = (age || 0) < 26;
  const total = Math.round(wages * years * (young ? 1 / 3 : 2 / 3));
  const seasons = years * 2;
  return {
    total,
    seasons,
    perYear: Math.round(total / seasons / 1000) * 1000,
    fractionWord: young ? 'a third' : 'two thirds'
  };
}

// What is still owed on every buyout he has been through.
export function buyoutOwed(player) {
  return (player?.buyouts || []).reduce((n, b) => n + (b.perYear || 0) * Math.max(0, b.seasonsLeft || 0), 0);
}
