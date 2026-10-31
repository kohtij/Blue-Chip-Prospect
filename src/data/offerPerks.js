// What is good and bad about an offer, beyond the money.
//
// The transfer screen has always known how to draw perks and flaws, but almost
// nothing ever gave it any: the NCAA recruitment event built its own, one
// hometown-discount offer carried a loyalty perk, and every other offer in the
// game arrived bare. So a free agency screen was a wall of salaries with nothing
// to weigh them against, and the post-draft "explore options" screen, which is a
// genuine fork in a career, was the emptiest of the lot.
//
// Every offer goes through here now, and what it can carry depends on where it
// is from: a college programme offers facilities and NIL money, a European club
// offers ice time and warns about the travel, an NHL club talks about contending
// and cap trouble.

const G = 'text-[#22E748] bg-[#22E748]/10 border-[#22E748]/30';  // green, development
const B = 'text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/30';  // blue, rating
const A = 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30';  // amber, money

const PERKS = {
  college: [
    { name: '📈 Elite Coaching', effect: '+2 OVR', ovr: 2, fanStatus: 0, money: 0, color: B },
    { name: '🏟️ Facilities', effect: '+15 FAN', ovr: 0, fanStatus: 15, money: 0, color: G },
    { name: '💰 NIL Deal', effect: '$75K', ovr: 0, fanStatus: 0, money: 75000, color: A },
    { name: '⚡ High Tempo', effect: '+1 OVR', ovr: 1, fanStatus: 0, money: 0, color: G },
    { name: '🎓 Academics', effect: '+10 FAN', ovr: 0, fanStatus: 10, money: 0, color: G },
    { name: '🏒 NHL Pipeline', effect: '+25 FAN', ovr: 0, fanStatus: 25, money: 0, color: B }
  ],
  euro: [
    { name: '⏱️ Top-6 Minutes', effect: '+2 OVR', ovr: 2, fanStatus: 0, money: 0, color: B },
    { name: '🧊 Big Ice', effect: '+1 OVR', ovr: 1, fanStatus: 0, money: 0, color: B },
    { name: '💶 Signing Bonus', effect: '$40K', ovr: 0, fanStatus: 0, money: 40000, color: A },
    { name: '🏆 Contender', effect: '+20 FAN', ovr: 0, fanStatus: 20, money: 0, color: G },
    { name: '📺 Televised', effect: '+15 FAN', ovr: 0, fanStatus: 15, money: 0, color: G }
  ],
  nhl: [
    { name: '🏆 Contender', effect: '+25 FAN', ovr: 0, fanStatus: 25, money: 0, color: G },
    { name: '📈 Dev Staff', effect: '+2 OVR', ovr: 2, fanStatus: 0, money: 0, color: B },
    { name: '⚡ Powerplay', effect: '+2 OVR', ovr: 2, fanStatus: 0, money: 0, color: G },
    { name: '💰 Signing Bonus', effect: '$250K', ovr: 0, fanStatus: 0, money: 250000, color: A },
    { name: '📺 Media Market', effect: '+30 FAN', ovr: 0, fanStatus: 30, money: 0, color: G },
    { name: '🏠 Low-Tax State', effect: '$150K', ovr: 0, fanStatus: 0, money: 150000, color: A }
  ],
  minor: [
    { name: '🚀 Call-Up Path', effect: '+2 OVR', ovr: 2, fanStatus: 0, money: 0, color: B },
    { name: '⏱️ Top Minutes', effect: '+1 OVR', ovr: 1, fanStatus: 0, money: 0, color: G },
    { name: '🏒 Skills Coach', effect: '+1 OVR', ovr: 1, fanStatus: 0, money: 0, color: B },
    { name: '💰 Perf. Bonus', effect: '$25K', ovr: 0, fanStatus: 0, money: 25000, color: A }
  ],
  junior: [
    { name: '📈 Dev Program', effect: '+2 OVR', ovr: 2, fanStatus: 0, money: 0, color: B },
    { name: '⏱️ Top Line', effect: '+15 FAN', ovr: 0, fanStatus: 15, money: 0, color: G },
    { name: '🏟️ Packed Barn', effect: '+20 FAN', ovr: 0, fanStatus: 20, money: 0, color: G },
    { name: '🏆 Cup Window', effect: '+15 FAN', ovr: 0, fanStatus: 15, money: 0, color: G }
  ]
};

const FLAWS = {
  college: [
    { name: '⚠️ Full Roster', effect: '-1 OVR', ovr: -1, fanStatus: 0, money: 0 },
    { name: '⚠️ Strict System', effect: '-10 FAN', ovr: 0, fanStatus: -10, money: 0 },
    { name: '⚠️ Small Market', effect: '-5 FAN', ovr: 0, fanStatus: -5, money: 0 },
    { name: '⚠️ Rebuilding', effect: '-1 OVR', ovr: -1, fanStatus: 0, money: 0 }
  ],
  euro: [
    { name: '⚠️ Long Trips', effect: '-1 OVR', ovr: -1, fanStatus: 0, money: 0 },
    { name: '⚠️ Language Gap', effect: '-10 FAN', ovr: 0, fanStatus: -10, money: 0 },
    { name: '⚠️ Defensive Sys', effect: '-1 OVR', ovr: -1, fanStatus: 0, money: 0 },
    { name: '⚠️ Off The Radar', effect: '-15 FAN', ovr: 0, fanStatus: -15, money: 0 }
  ],
  nhl: [
    { name: '⚠️ Rebuilding', effect: '-15 FAN', ovr: 0, fanStatus: -15, money: 0 },
    { name: '⚠️ Trap System', effect: '-15 FAN', ovr: 0, fanStatus: -15, money: 0 },
    { name: '⚠️ Deep Lineup', effect: '-2 OVR', ovr: -2, fanStatus: 0, money: 0 },
    { name: '⚠️ Media Glare', effect: '-20 FAN', ovr: 0, fanStatus: -20, money: 0 },
    { name: '⚠️ Cap Trouble', effect: '-$100K', ovr: 0, fanStatus: 0, money: -100000 }
  ],
  minor: [
    { name: '⚠️ Bus League', effect: '-1 OVR', ovr: -1, fanStatus: 0, money: 0 },
    { name: '⚠️ Buried', effect: '-2 OVR', ovr: -2, fanStatus: 0, money: 0 },
    { name: '⚠️ No Spotlight', effect: '-10 FAN', ovr: 0, fanStatus: -10, money: 0 }
  ],
  junior: [
    { name: '⚠️ Veteran Room', effect: '-1 OVR', ovr: -1, fanStatus: 0, money: 0 },
    { name: '⚠️ Last Place', effect: '-10 FAN', ovr: 0, fanStatus: -10, money: 0 },
    { name: '⚠️ Long Commute', effect: '-5 FAN', ovr: 0, fanStatus: -5, money: 0 }
  ]
};

const JUNIOR = ['OHL', 'WHL', 'QMJHL', 'USHL'];
const EURO = ['SHL', 'LIIGA', 'KHL', 'SWISS', 'DEL', 'ICEHL', 'CZECH', 'SLOVAK'];
const MINOR = ['AHL', 'ECHL', 'SPHL'];

export function offerTier(league) {
  if (league === 'NCAA') return 'college';
  if (JUNIOR.includes(league)) return 'junior';
  if (EURO.includes(league)) return 'euro';
  if (MINOR.includes(league)) return 'minor';
  return 'nhl';
}

const pick = (arr, n) => [...arr].sort(() => 0.5 - Math.random()).slice(0, n);

/**
 * Rolls the perks and flaws for one offer and totals what they are worth.
 * Every offer gets at least one of something, so no card is ever blank.
 */
export function rollOfferPerks(league, { minPerks = 0, maxPerks = 2, maxFlaws = 2 } = {}) {
  const tier = offerTier(league);
  const perkPool = PERKS[tier] || PERKS.nhl;
  const flawPool = FLAWS[tier] || FLAWS.nhl;

  let perks = pick(perkPool, minPerks + Math.floor(Math.random() * (maxPerks - minPerks + 1)));
  let flaws = pick(flawPool, Math.floor(Math.random() * (maxFlaws + 1)));

  // A card with nothing on it tells the player nothing, so give it one or the
  // other. Which one is a coin toss, so a bare offer can still be a bad one.
  if (perks.length === 0 && flaws.length === 0) {
    if (Math.random() < 0.5) perks = pick(perkPool, 1);
    else flaws = pick(flawPool, 1);
  }

  const totals = [...perks, ...flaws].reduce(
    (acc, x) => ({
      ovr: acc.ovr + (x.ovr || 0),
      fanStatus: acc.fanStatus + (x.fanStatus || 0),
      money: acc.money + (x.money || 0)
    }),
    { ovr: 0, fanStatus: 0, money: 0 }
  );

  return { perks, flaws, totals };
}

/** Attaches perks and flaws to an offer that does not already carry them. */
export function withOfferPerks(offer, options) {
  if (!offer || (offer.perks?.length || offer.flaws?.length)) return offer;
  const { perks, flaws, totals } = rollOfferPerks(offer.league, options);
  return { ...offer, perks, flaws, perkTotals: totals };
}

// Older perks carry a single `text` string, including the ones the trade and
// transfer events build inline. Splitting on the trailing parenthesis lets the
// chip lay those out the same way without rewriting every one of them.
export function splitPerk(perk = {}) {
  if (perk.name) return { name: perk.name, effect: perk.effect || '' };
  const raw = String(perk.text || '').trim();
  const m = raw.match(/^(.*?)\s*\(([^()]*)\)$/);
  if (m) return { name: m[1].trim(), effect: m[2].trim() };
  return { name: raw, effect: '' };
}
