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

  if (hart > 0) addPoints(hart * 500, `${hart}x Hart Trophy`);
  if (smythe > 0) addPoints(smythe * 500, `${smythe}x Conn Smythe`);
  if (vezina > 0) addPoints(vezina * 400, `${vezina}x Vezina Trophy`);
  if (norris > 0) addPoints(norris * 400, `${norris}x Norris Trophy`);
  if (ross > 0) addPoints(ross * 400, `${ross}x Art Ross`);
  if (rocket > 0) addPoints(rocket * 400, `${rocket}x Rocket Richard`);
  if (calder > 0) addPoints(calder * 250, `${calder}x Calder Trophy`);
  if (allStar > 0) addPoints(allStar * 50, `${allStar}x All-Star`);
  if (stanleyCup > 0) addPoints(stanleyCup * 800, `${stanleyCup}x Stanley Cup`);
  if (calderCup > 0) addPoints(calderCup * 150, `${calderCup}x Calder Cup`);
  if (memCup > 0) addPoints(memCup * 150, `${memCup}x Memorial Cup`);
  if (ncaaTitle > 0) addPoints(ncaaTitle * 150, `${ncaaTitle}x NCAA Title`);
  if (olyGold > 0) addPoints(olyGold * 300, `${olyGold}x Olympic Gold`);
  if (wjcGold > 0) addPoints(wjcGold * 100, `${wjcGold}x WJC Gold`);
  if (minorAwards > 0) addPoints(minorAwards * 100, `${minorAwards}x Minor Award`);

  // 2. LONGEVITY & SEASONAL MILESTONES
  let nhlSeasons = 0, otherSeasons = 0, hundredPtSeasons = 0, fiftyGoalSeasons = 0, demotions = 0;
  let prevLg = null;

  history.forEach(s => {
    if (s.league === 'NHL') nhlSeasons++;
    else otherSeasons++;

    const pts = (s.goals || 0) + (s.assists || 0);
    if (s.league === 'NHL' && pts >= 100) hundredPtSeasons++;
    if (s.league === 'NHL' && (s.goals || 0) >= 50) fiftyGoalSeasons++;

    // Track if you fell out of the NHL
    if (prevLg === 'NHL' && ['AHL', 'ECHL', 'OHL', 'WHL', 'QMJHL'].includes(s.league)) demotions++;
    prevLg = s.league;
  });

  if (nhlSeasons > 0) addPoints(nhlSeasons * 50, `${nhlSeasons} NHL Seasons`);
  if (otherSeasons > 0) addPoints(otherSeasons * 10, `${otherSeasons} Amateur/Minor Seasons`);
  if (hundredPtSeasons > 0) addPoints(hundredPtSeasons * 200, `${hundredPtSeasons}x 100-Pt Seasons`);
  if (fiftyGoalSeasons > 0) addPoints(fiftyGoalSeasons * 200, `${fiftyGoalSeasons}x 50-Goal Seasons`);

  // 3. CAREER MILESTONES
  const nhlGames = player.stats?.nhl?.games || 0;
  const nhlGoals = player.stats?.nhl?.goals || 0;
  if (nhlGames >= 1000) addPoints(500, `1000+ NHL Games`);
  if (nhlGoals >= 500) addPoints(500, `500+ NHL Goals`);

  // 4. MODIFIERS
  if (player.isGenerational) addPoints(250, `Generational Talent`);
  if (teams.length >= 5) addPoints(150, `Journeyman Bonus`);
  // Allow up to 2 teams for loyalty to account for the draft/ELC trading quirks
  if (nhlSeasons >= 10 && teams.length <= 2) addPoints(300, `Franchise Loyalty`); 
  if (demotions > 0) addPoints(demotions * -50, `Demoted ${demotions}x`);

  // 5. CALCULATE TIER
  let tier = "Minor Leaguer";
  let color = "text-slate-400";
  
  if (score >= 7501) { tier = "Generational Icon"; color = "text-[#F59E0B]"; }
  else if (score >= 4501) { tier = "Hall of Famer"; color = "text-[#c084fc]"; }
  else if (score >= 2501) { tier = "Franchise Cornerstone"; color = "text-[#3b82f6]"; }
  else if (score >= 1201) { tier = "Solid Pro"; color = "text-[#22E748]"; }
  else if (score >= 500) { tier = "Journeyman"; color = "text-slate-300"; }

  // Sort breakdown from highest points to lowest and take the top 6
  breakdown.sort((a, b) => b.points - a.points);

  return { total: score, tier, color, breakdown: breakdown.slice(0, 6) };
}