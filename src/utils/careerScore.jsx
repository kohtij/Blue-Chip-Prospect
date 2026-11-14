import { forwardCareerGrade, rateSeason } from './production';

/**
 * Minutes a night across an NHL career.
 *
 * Banked as a running total from now on, but a career saved before that was
 * being kept has none, so it is rebuilt from the seasons themselves. Failing
 * both, null, and the grade falls back to the middle of the ice-time range
 * rather than to zero, which would read every old defenceman as buried.
 */
const nhlCareerToi = (player) => {
  const banked = player.stats?.nhl?.toiGames || 0;
  const gp = player.stats?.nhl?.games || 0;
  if (banked > 0 && gp > 0) return banked / gp;

  const nhlYears = (player.seasonHistory || []).filter(s => s.league === 'NHL' && (s.games || 0) > 0);
  const mins = nhlYears.reduce((n, s) => n + (s.avgToi || 0) * s.games, 0);
  const games = nhlYears.reduce((n, s) => n + s.games, 0);
  return games > 0 && mins > 0 ? mins / games : null;
};

export function computeCareerScore(player) {
  let score = 0;
  const breakdown = [];

  const addPoints = (points, label) => {
    if (points === 0) return;
    score += points;
    breakdown.push({ label, points });
  };

  const history = player.seasonHistory || [];

  // A career's trophies live in two places and this only ever read one of them.
  // stats.awards holds the Stanley Cups and the international medals; every
  // season award the game hands out, the Hart, the Conn Smythe, the Vezina, the
  // Norris, the Art Ross, the Rocket, the Calder and every All-Star Team, is
  // written onto that season's history entry and never copied up. So the whole
  // awards section below was scoring an array that only ever contained Cups, and
  // a long, decorated career still came out a Franchise Cornerstone with the top
  // two tiers unreachable. The two sources are disjoint, so reading both counts
  // each trophy exactly once.
  const awards = [
    ...(player.stats?.awards || []),
    ...history.flatMap(s => s.awards || [])
  ];
  const teams = player.teamsPlayedFor || [];

  // 1. AWARDS & CHAMPIONSHIPS
  const countMatch = (str) => awards.filter(a => a.includes(str)).length;

  const hart = countMatch('Hart');
  const smythe = countMatch('Conn Smythe');
  const vezina = countMatch('Vezina');
  const norris = countMatch('Norris');
  const ross = countMatch('Art Ross');
  const rocket = countMatch('Maurice Richard');
  const calder = countMatch('Calder Trophy');
  const allStar = countMatch('All-Star');
  const stanleyCup = countMatch('Stanley Cup');
  const calderCup = countMatch('Calder Cup');
  const memCup = countMatch('Memorial Cup');
  const ncaaTitle = countMatch('National Championship');
  const olyGold = awards.filter(a => a.includes('Gold') && a.includes('Olympics')).length;
  const wjcGold = awards.filter(a => a.includes('Gold') && a.includes('World Juniors')).length;
  const minorAwards = countMatch('Player of the Year') + countMatch('Red Tilson') + countMatch('All-American');

  if (hart > 0) addPoints(hart * 400, `${hart}x Hart Trophy`);
  if (smythe > 0) addPoints(smythe * 400, `${smythe}x Conn Smythe`);
  if (vezina > 0) addPoints(vezina * 300, `${vezina}x Vezina Trophy`);
  if (norris > 0) addPoints(norris * 300, `${norris}x Norris Trophy`);
  if (ross > 0) addPoints(ross * 300, `${ross}x Art Ross`);
  if (rocket > 0) addPoints(rocket * 300, `${rocket}x Rocket Richard`);
  if (calder > 0) addPoints(calder * 200, `${calder}x Calder Trophy`);
  if (allStar > 0) addPoints(allStar * 75, `${allStar}x All-Star`);
  if (stanleyCup > 0) addPoints(stanleyCup * 600, `${stanleyCup}x Stanley Cup`);
  if (calderCup > 0) addPoints(calderCup * 100, `${calderCup}x Calder Cup`);
  if (memCup > 0) addPoints(memCup * 100, `${memCup}x Memorial Cup`);
  if (ncaaTitle > 0) addPoints(ncaaTitle * 100, `${ncaaTitle}x NCAA Title`);
  if (olyGold > 0) addPoints(olyGold * 250, `${olyGold}x Olympic Gold`);
  if (wjcGold > 0) addPoints(wjcGold * 100, `${wjcGold}x WJC Gold`);
  if (minorAwards > 0) addPoints(minorAwards * 50, `${minorAwards}x Minor Award`);

  // 2. LONGEVITY & SEASONAL MILESTONES
  let nhlSeasons = 0, otherSeasons = 0, hundredPtSeasons = 0, fiftyGoalSeasons = 0, demotions = 0;
  let prevLg = null;

  history.forEach(s => {
    if (s.league === 'NHL') nhlSeasons++;
    else otherSeasons++;

    const pts = (s.goals || 0) + (s.assists || 0);
    if (s.league === 'NHL' && pts >= 100) hundredPtSeasons++;
    if (s.league === 'NHL' && (s.goals || 0) >= 50) fiftyGoalSeasons++;

    if (prevLg === 'NHL' && ['AHL', 'ECHL', 'OHL', 'WHL', 'QMJHL'].includes(s.league)) demotions++;
    prevLg = s.league;
  });

  if (nhlSeasons > 0) addPoints(nhlSeasons * 75, `${nhlSeasons} NHL Seasons`);
  if (otherSeasons > 0) addPoints(otherSeasons * 15, `${otherSeasons} Amateur/Minor Seasons`);
  if (hundredPtSeasons > 0) addPoints(hundredPtSeasons * 150, `${hundredPtSeasons}x 100-Pt Seasons`);
  if (fiftyGoalSeasons > 0) addPoints(fiftyGoalSeasons * 150, `${fiftyGoalSeasons}x 50-Goal Seasons`);

  // 3. CAREER MILESTONES
  const nhlGames = player.stats?.nhl?.games || 0;
  const nhlGoals = player.stats?.nhl?.goals || 0;
  if (nhlGames >= 1000) addPoints(400, `1000+ NHL Games`);
  else if (nhlGames >= 500) addPoints(150, `500+ NHL Games`);
  if (nhlGoals >= 500) addPoints(400, `500+ NHL Goals`);

  // 3b. WHAT KIND OF PLAYER HE ACTUALLY WAS
  //
  // Everything above this is a counting stat, so the score could only ever go
  // up with time on the clock: twenty years of forty-point seasons out-scored
  // ten years of being the best player in the league, and the top tier was
  // reachable by turning up for long enough. Rate is the other half of a
  // career, so it is scored here and it gates the top two tiers below.
  const isGoalieScore = player.pos === 'G';
  const isDefenceScore = ['LD', 'RD'].includes(player.pos);
  const nhl = player.stats?.nhl || {};
  const nhlPts = (nhl.goals || 0) + (nhl.assists || 0);
  const nhlGp = nhl.games || 0;
  const svPct = (nhl.shots || 0) > 0 ? (nhl.saves || 0) / nhl.shots : 0;

  // A DEFENCE CAREER IS NOT A THIN FORWARD CAREER.
  //
  // The rate test above was points per game for every skater, with a softer
  // bar for a defenceman, which marks him generously at the wrong job rather
  // than fairly at his own. Measured on it, a nine-hundred-game shutdown
  // number one at 0.30 a game and plus a hundred and eighty cleared no bar at
  // all, took no rate points, and could not reach either of the top two tiers
  // however long he played: the Hall of Fame gate asked him for 0.48 a game.
  //
  // He is graded on the career the way a season is graded, through rateSeason
  // itself, so the two halves are weighted the way they are everywhere else.
  // On that scale an ordinary number four comes out 4.8, a solid top pair 5.8,
  // that shutdown number one 6.7, a two-way number one 7.2 and a Makar 8.8.
  const careerToi = nhlCareerToi(player);
  const dGrade = (isDefenceScore && nhlGp >= 100)
    ? rateSeason({
        league: 'NHL', pos: player.pos, games: nhlGp,
        g: nhl.goals || 0, a: nhl.assists || 0, pm: nhl.plusMinus || 0,
        blk: nhl.blocks || null, toi: careerToi
      })
    : 0;

  // The forward equivalent, for the same reason: see forwardCareerGrade.
  const fGrade = (!isDefenceScore && !isGoalieScore && nhlGp >= 100)
    ? forwardCareerGrade({
        games: nhlGp, goals: nhl.goals || 0, points: nhlPts, sog: nhl.sog || 0,
        pm: nhl.plusMinus || 0, blk: nhl.blocks ?? null, toi: careerToi,
        fot: nhl.fot || 0, fow: nhl.fow || 0
      })
    : 0;

  if (isDefenceScore && nhlGp >= 100) {
    const reason = `${dGrade.toFixed(1)} two-way career grade`;
    if (dGrade >= 7.9) addPoints(600, reason);
    else if (dGrade >= 7.2) addPoints(400, reason);
    else if (dGrade >= 6.2) addPoints(200, reason);
    else if (dGrade >= 5.4) addPoints(75, reason);
  } else if (!isGoalieScore && nhlGp >= 100) {
    const reason = `${fGrade.toFixed(1)} career grade`;
    if (fGrade >= 7.9) addPoints(600, reason);
    else if (fGrade >= 7.2) addPoints(400, reason);
    else if (fGrade >= 6.2) addPoints(200, reason);
    else if (fGrade >= 5.4) addPoints(75, reason);
  } else if (isGoalieScore && nhlGp >= 100) {
    if (svPct >= 0.925) addPoints(600, `${svPct.toFixed(3).replace('0.', '.')} career save percentage`);
    else if (svPct >= 0.918) addPoints(400, `${svPct.toFixed(3).replace('0.', '.')} career save percentage`);
    else if (svPct >= 0.910) addPoints(200, `${svPct.toFixed(3).replace('0.', '.')} career save percentage`);
  }

  // 4. MODIFIERS
  if (player.isGenerational) addPoints(250, `Generational Talent`);
  if (teams.length >= 5) addPoints(150, `Journeyman Bonus`);
  if (nhlSeasons >= 10 && teams.length <= 2) addPoints(300, `Franchise Loyalty`); 
  if (demotions > 0) addPoints(demotions * -25, `Demoted ${demotions}x`);

  // 5. CALCULATE TIER
  //
  // The top two tiers are not for sale by the year. A generational player was
  // better than everyone else while he played, so the rate has to say so: a
  // point a game for a forward, two thirds of that from the back end, .925 in
  // a net. A player who piled up a huge total without ever being that is a
  // Franchise Cornerstone, which is not an insult.
  const enoughNhl = nhlGp >= 400;
  // Measured across eleven hundred games of each archetype, on the three-part
  // defensive half: an ordinary number four comes out 4.8 and a solid top pair
  // 5.7, so neither gate is cheap; a pure shutdown number one lands 6.2 to 6.5
  // and a two-way number one 7.0, which is what the Hall of Fame gate is for;
  // the top gate wants an elite offensive defenceman at 7.4 or a Makar at 8.1.
  // A forward is gated on the same two numbers as a defenceman now, because
  // both are marked out of ten on the same scale. It was points per game, so
  // a four-hundred-goal power forward could not reach either gate.
  const iconRate = isGoalieScore ? svPct >= 0.925 : isDefenceScore ? dGrade >= 7.3 : fGrade >= 7.3;
  const fameRate = isGoalieScore ? svPct >= 0.915 : isDefenceScore ? dGrade >= 6.1 : fGrade >= 6.1;

  let tier = "Minor Leaguer";
  let color = "text-slate-400";

  if (score >= 4500 && enoughNhl && iconRate) { tier = "Generational Icon"; color = "text-[#F59E0B]"; }
  else if (score >= 3000 && nhlGp >= 250 && fameRate) { tier = "Hall of Famer"; color = "text-[#c084fc]"; }
  else if (score >= 1800) { tier = "Franchise Cornerstone"; color = "text-[#3b82f6]"; }
  else if (score >= 1000) { tier = "Solid Pro"; color = "text-[#22E748]"; }
  else if (score >= 400) { tier = "Journeyman"; color = "text-slate-300"; }

  breakdown.sort((a, b) => b.points - a.points);

  return { total: score, tier, color, breakdown: breakdown.slice(0, 6) };
}
// THE HALL OF FAME.
//
// No vote is played out. The career score already decides the tier, and the
// two top tiers are the Hall of Fame; what the score adds is how long he
// waits. A player is eligible three years after his last season. The clearest
// cases go in the first year they can, and a career that only just cleared the
// bar waits a few years on the ballot before the call comes. A strong career
// that missed the bar spends its years on the ballot and is never called.
export function hallOfFame(score, lastSeasonYear) {
  if (!score) return null;
  const eligible = (lastSeasonYear || 2026) + 4;
  const inducted = score.tier === 'Generational Icon' || score.tier === 'Hall of Famer';
  if (inducted) {
    const wait = score.tier === 'Generational Icon' || score.total >= 3800
      ? 0
      : Math.min(6, Math.ceil((3800 - score.total) / 200));
    return {
      inducted: true,
      classYear: eligible + wait,
      ballot: wait === 0 ? 'First ballot' : wait === 1 ? 'Second year on the ballot' : `${wait + 1} years on the ballot`
    };
  }
  if (score.tier === 'Franchise Cornerstone' && score.total >= 2400) {
    return { inducted: false, nearMiss: true, eligible };
  }
  return null;
}
