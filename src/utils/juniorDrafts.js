// THE JUNIOR DRAFTS HE WENT THROUGH BEFORE THE GAME STARTS.
//
// North American junior hockey drafts its players young. The three CHL leagues
// each hold a draft of fifteen-year-olds every spring (the OHL Priority
// Selection, the WHL Prospects Draft and the QMJHL draft), and the USHL drafts
// sixteen-year-olds in its Phase I draft. The club that takes a player owns his
// rights in that league from then on, which is what the picks in a CHL or USHL
// trade are made of.
//
// A career starts at sixteen, after those drafts have happened, so they're
// worked out once, here, at creation, and stored on the player. Nothing shows
// them yet. They're kept so later work can use them: who holds a college
// player's CHL rights if he leaves school, or which club a US kid was drafted
// by before he went the college route.
//
// Europeans don't go through any of this. Their way into the CHL is the
// Import Draft, which the offseason already runs (see importDraftEvent).
//
// Round and team counts are approximate and only shape how deep a pick can be.

import { getOpponentPool } from '../data/teams';

const CHL_DRAFTS = {
  OHL: { name: 'OHL Priority Selection', rounds: 15 },
  WHL: { name: 'WHL Prospects Draft', rounds: 10 },
  QMJHL: { name: 'QMJHL Draft', rounds: 12 }
};
const USHL_DRAFT = { name: 'USHL Phase I Draft', rounds: 10 };

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Where a pick lands, from how good he was at fifteen. A top prospect goes in
// the first round; a fringe one late or not at all.
const slotFor = (ovr, teams, rounds) => {
  const total = teams * rounds;
  const strength = Math.min(1, Math.max(0, ((ovr || 45) - 42) / 26));
  const spot = Math.round(Math.pow(1 - strength, 1.7) * total * 0.7 + (Math.random() - 0.5) * teams * 1.5);
  return Math.min(total, Math.max(1, spot));
};

// One draft. His own club took him most of the time when he plays in that
// league now; otherwise his rights went there in a trade, or another club
// holds them and he plays elsewhere.
const runDraft = ({ league, info, year, ovr, team, playsHere }) => {
  const pool = getOpponentPool(league) || [];
  if (!pool.length) return null;
  const overall = slotFor(ovr, pool.length, info.rounds);
  const others = pool.filter(t => t.id !== team);
  const by = playsHere && Math.random() < 0.75 ? team : pick(others.length ? others : pool)?.id;
  return {
    draft: info.name,
    league,
    year,
    round: Math.ceil(overall / pool.length),
    overall,
    team: by,
    // Who holds his rights in that league now.
    rightsHeldBy: playsHere ? team : by
  };
};

// Which CHL league a Canadian or American kid was drafted into, when he
// doesn't already play in one. Roughly where the players come from.
const chlLeagueFor = (nat) => {
  const r = Math.random();
  if (nat === 'USA') return r < 0.5 ? 'OHL' : r < 0.85 ? 'WHL' : 'QMJHL';
  return r < 0.45 ? 'OHL' : r < 0.8 ? 'WHL' : 'QMJHL';
};

/**
 * The junior drafts a new player went through, and who holds his rights.
 * Returns { juniorDrafts: [...], juniorRights: { CHL?, USHL? } }.
 *
 * gameYear is the first season's year. The CHL drafts are held the spring a
 * player turns fifteen, the USHL's Phase I the spring he turns sixteen.
 */
export function juniorDraftHistory({ nat, league, team, ovr, age = 16, gameYear = 2026 }) {
  const drafts = [];
  const rights = {};
  const northAmerican = ['CAN', 'USA'].includes(nat);

  // The CHL draft, for a Canadian or an American, or anyone already playing
  // in the CHL (a European there came through the Import Draft instead).
  const inChl = league in CHL_DRAFTS;
  if (northAmerican) {
    // A BCHL player is a British Columbian, which is WHL territory.
    const lg = inChl ? league : league === 'BCHL' ? 'WHL' : chlLeagueFor(nat);
    // An American headed for college usually isn't drafted, or goes late.
    const drafted = inChl || nat === 'CAN' || (ovr || 0) >= 52 || Math.random() < 0.35;
    if (drafted) {
      const d = runDraft({ league: lg, info: CHL_DRAFTS[lg], year: gameYear - (age - 15), ovr, team, playsHere: inChl });
      if (d) { drafts.push(d); rights.CHL = { team: d.rightsHeldBy, league: lg }; }
    }
  }

  // The USHL's Phase I, for an American or anyone who starts in the USHL.
  if (nat === 'USA' || league === 'USHL') {
    const inUshl = league === 'USHL';
    if (inUshl || (ovr || 0) >= 48 || Math.random() < 0.5) {
      const d = runDraft({ league: 'USHL', info: USHL_DRAFT, year: gameYear - (age - 16), ovr, team, playsHere: inUshl });
      if (d) { drafts.push(d); rights.USHL = d.rightsHeldBy; }
    }
  }

  return { juniorDrafts: drafts, juniorRights: rights };
}
