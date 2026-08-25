export function computeCareerScore(player) {
  let score = 0;
  const breakdown = [];

  const addPoints = (points, label) => {
    if (points === 0) return;
    score += points;
    breakdown.push({ label, points });
  };

  const awards = player.stats?.awards || [];
  const history = player.seasonHistory || [];
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

  // 4. MODIFIERS
  if (player.isGenerational) addPoints(250, `Generational Talent`);
  if (teams.length >= 5) addPoints(150, `Journeyman Bonus`);
  if (nhlSeasons >= 10 && teams.length <= 2) addPoints(300, `Franchise Loyalty`); 
  if (demotions > 0) addPoints(demotions * -25, `Demoted ${demotions}x`);

  // 5. CALCULATE TIER
  let tier = "Minor Leaguer";
  let color = "text-slate-400";
  
  if (score >= 4500) { tier = "Generational Icon"; color = "text-[#F59E0B]"; }
  else if (score >= 3000) { tier = "Hall of Famer"; color = "text-[#c084fc]"; }
  else if (score >= 1800) { tier = "Franchise Cornerstone"; color = "text-[#3b82f6]"; }
  else if (score >= 1000) { tier = "Solid Pro"; color = "text-[#22E748]"; }
  else if (score >= 400) { tier = "Journeyman"; color = "text-slate-300"; }

  breakdown.sort((a, b) => b.points - a.points);

  return { total: score, tier, color, breakdown: breakdown.slice(0, 6) };
}