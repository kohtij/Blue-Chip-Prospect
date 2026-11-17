// EVERY AWARD A CAREER HAS, ONCE EACH.
//
// Trophies are kept in two places. Every season award is written onto that
// season's history entry. Cups, playoff MVPs and international medals are
// written there too, and also onto stats.awards with the year in front. Four
// different places read "the career's awards" by putting the two lists end to
// end, so every Cup, Conn Smythe and Olympic gold was counted twice: the
// dashboard's trophy count, the Icon and Legend tiers, the contract price and
// the draft scouts' honours score all saw double. This merges them and drops
// the history copy of anything the career list already has.
export function careerAwardList(player) {
  const career = Array.from(new Set((player?.stats?.awards || []).map(String)));
  const inCareer = new Set(career);
  const seasons = (player?.seasonHistory || []).flatMap(s =>
    Array.from(new Set((s.awards || []).map(String))).filter(a => !inCareer.has(a)));
  return [...career, ...seasons];
}
