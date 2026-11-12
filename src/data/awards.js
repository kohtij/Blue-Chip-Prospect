// ==========================================
// AWARDS & TROPHIES IMAGERY
// Maps each award/trophy string the game emits to a real image URL
// on kohtij/hockey-awards-and-trophies.
// ==========================================

const BASE = 'https://raw.githubusercontent.com/kohtij/hockey-awards-and-trophies/main';
const AWARDS = `${BASE}/Awards%20Trophies`;
const PO = `${BASE}/Playoff%20Trophies`;

// Individual awards. Keyed by a substring that uniquely identifies the trophy
// in the strings the game emits (e.g. 'Hart Trophy', 'Emms Family Award (OHL Rookie…)').
// Order matters, first matching key wins, so put more-specific keys first.
export const AWARD_IMAGES = {
  // NHL
  'Hart':                     `${AWARDS}/national_hockey_league_award_mvp.png`,
  'Art Ross':                 `${AWARDS}/national_hockey_league_award_points.png`,
  'Maurice Richard':          `${AWARDS}/national_hockey_league_award_goals.png`,
  'Norris':                   `${AWARDS}/national_hockey_league_award_best_defender.png`,
  'Vezina':                   `${AWARDS}/national_hockey_league_award_best_goalie.png`,
  'Calder Trophy':            `${AWARDS}/national_hockey_league_award_best_rookie.png`,
  'Conn Smythe':              `${AWARDS}/national_hockey_league_award_playoff_mvp.png`,
  // The seven that were added to the game later.
  //
  // The files in that repository are named for what an award is FOR rather
  // than for the trophy, which is what makes them matchable: each keyword
  // below is lifted straight out of the official wording of the award it is
  // paired with, so none of these is a guess.
  //
  //   PLAYERS_MVP             most outstanding player, as voted by the PLAYERS
  //   best_defensive_forward  the Selke is, in those words, the best defensive forward
  //   goals_against           the Jennings goes to the side that allowed fewest
  //   SPORTSMANSHIP           "sportsmanship and gentlemanly conduct"
  //   DEDICATION              "perseverance, sportsmanship and DEDICATION to hockey"
  //   HUMANITARIAN            "a noteworthy HUMANITARIAN contribution"
  //   LEADERSHIP              the Messier Leadership Award
  //
  // Note that COMMUNITY_1997-2016 in the same folder is NOT the Clancy: the
  // dates in the filename are the NHL Foundation Player Award, which ran for
  // those years and was then discontinued.
  // getAwardImage matches on substring and takes the FIRST key that hits, so
  // the QMJHL's Selke has to be named before the NHL's or it would be handed
  // the wrong league's artwork. Same reason the plain-English fallbacks sit at
  // the bottom of this group rather than the top.
  'Selke Trophy (QMJHL':      `${AWARDS}/quebec_major_junior_hockey_league_award_best_defensive_forward.png`,

  'Ted Lindsay':              `${AWARDS}/national_hockey_league_award_PLAYERS_MVP.png`,
  'Selke':                    `${AWARDS}/national_hockey_league_award_best_defensive_forward.png`,
  'Jennings':                 `${AWARDS}/national_hockey_league_award_goals_against.png`,
  'Lady Byng':                `${AWARDS}/national_hockey_league_award_SPORTSMANSHIP.png`,
  'Masterton':                `${AWARDS}/national_hockey_league_award_DEDICATION.png`,
  'King Clancy':              `${AWARDS}/national_hockey_league_award_HUMANITARIAN.png`,
  'Messier':                  `${AWARDS}/national_hockey_league_award_LEADERSHIP.png`,

  // The same awards in the leagues that have their own artwork for them.
  'Fred T. Hunt':             `${AWARDS}/american_hockey_league_award_SPORTSMANSHIP.png`,
  'Yanick Dupr':              `${AWARDS}/american_hockey_league_award_HUMANITARIAN.png`,
  'Butterfield':              `${AWARDS}/american_hockey_league_award_playoff_mvp.png`,
  'William Hanley':           `${AWARDS}/ontario_hockey_league_award_SPORTSMANSHIP.png`,
  'Mickey Renaud':            `${AWARDS}/ontario_hockey_league_award_LEADERSHIP.png`,
  'Wayne Gretzky 99':         `${AWARDS}/ontario_hockey_league_award_playoff_mvp.png`,
  'Brad Hornung':             `${AWARDS}/western_hockey_league_award_SPORTSMANSHIP.png`,
  'Doug Wickenheiser':        `${AWARDS}/western_hockey_league_award_HUMANITARIAN.png`,
  'WHL Playoff MVP':          `${AWARDS}/western_hockey_league_award_playoff_mvp.png`,
  'Guy Lafleur':              `${AWARDS}/quebec_major_junior_hockey_league_award_playoff_mvp.png`,
  'QMJHL Most Sportsmanlike': `${AWARDS}/quebec_major_junior_hockey_league_award_SPORTSMANSHIP.png`,

  // And the plain-English forms the smaller leagues use, which have no artwork
  // of their own and borrow the NHL's, the way the USHL block below already
  // does. Last in the group, so nothing more specific is shadowed.
  'Best Defensive Forward':   `${AWARDS}/national_hockey_league_award_best_defensive_forward.png`,
  'Most Sportsmanlike':       `${AWARDS}/national_hockey_league_award_SPORTSMANSHIP.png`,
  // NOTE: NHL All-Star and 1st Team All-Star are TEAM SELECTIONS, not physical
  // trophies, leaving them out of the image map so getAwardImage returns null
  // and the retirement pill renders text-only.

  // OHL
  'Red Tilson':               `${AWARDS}/ontario_hockey_league_award_mvp.png`,
  'Eddie Powers':             `${AWARDS}/ontario_hockey_league_award_points.png`,
  'Max Kaminsky':             `${AWARDS}/ontario_hockey_league_award_best_defender.png`,
  'Dinty':                    `${AWARDS}/ontario_hockey_league_award_best_goalie.png`,
  'Emms Family':              `${AWARDS}/ontario_hockey_league_award_best_rookie.png`,

  // WHL
  'Four Broncos':             `${AWARDS}/western_hockey_league_award_mvp.png`,
  'Bob Clarke':               `${AWARDS}/western_hockey_league_award_points.png`,
  'Bill Hunter':              `${AWARDS}/western_hockey_league_award_best_defender.png`,
  'Del Wilson':               `${AWARDS}/western_hockey_league_award_best_goalie.png`,
  'Jim Piggott':              `${AWARDS}/western_hockey_league_award_best_rookie.png`,

  // QMJHL
  'Michel Brière':            `${AWARDS}/quebec_major_junior_hockey_league_award_mvp.png`,
  'Jean Béliveau':            `${AWARDS}/quebec_major_junior_hockey_league_award_points.png`,
  'Émile Bouchard':           `${AWARDS}/quebec_major_junior_hockey_league_award_best_defender.png`,
  'Jacques Plante':           `${AWARDS}/quebec_major_junior_hockey_league_award_goals_against.png`,
  'RDS Cup':                  `${AWARDS}/quebec_major_junior_hockey_league_award_best_rookie.png`,

  // USHL, no dedicated images in repo, fall back to NHL equivalents
  'USHL Player of the Year':      `${AWARDS}/national_hockey_league_award_mvp.png`,
  'USHL Forward of the Year':     `${AWARDS}/national_hockey_league_award_points.png`,
  'USHL Defenceman of the Year':  `${AWARDS}/national_hockey_league_award_best_defender.png`,
  'USHL Goaltender of the Year':  `${AWARDS}/national_hockey_league_award_best_goalie.png`,

  // NCAA / College: 1st Team All-American is a team selection, not a trophy,
  // leaving unmapped so it renders text-only, same reason as NHL All-Star above.

  // ==========================================================================
  // THE REST OF THE GAME'S HARDWARE
  //
  // A check across every award every league can hand out found a hundred and
  // fifteen of them with no artwork, which is most of them: entire leagues,
  // every leading-goalscorer award and every regular-season title rendered as
  // a bare text pill. A good deal of the art was sitting in the repository
  // unused, so the named awards below now point at it.
  //
  // Leagues with real art of their own are named first. The plain-English
  // fallbacks at the bottom catch everything else and borrow the NHL's, which
  // is the rule the USHL block above already follows.
  // ==========================================================================

  // AHL and ECHL both have a full set of their own.
  'Les Cunningham':           `${AWARDS}/american_hockey_league_award_mvp.png`,
  'Sollenberger':             `${AWARDS}/american_hockey_league_award_points.png`,
  'Willie Marshall':          `${AWARDS}/american_hockey_league_award_goals.png`,
  'Eddie Shore':              `${AWARDS}/american_hockey_league_award_best_defender.png`,
  'Baz Bastien':              `${AWARDS}/american_hockey_league_award_best_goalie.png`,
  'Red Garrett':              `${AWARDS}/american_hockey_league_award_best_rookie.png`,
  'Macgregor Kilpatrick':     `${AWARDS}/american_hockey_league_award_TEAM_MOST_POINTS.png`,
  'ECHL Player of the Year':  `${AWARDS}/echl_award_mvp.png`,
  'ECHL Top Scorer':          `${AWARDS}/echl_award_points.png`,
  'ECHL Defenceman':          `${AWARDS}/echl_award_best_defender.png`,
  'ECHL Goaltender':          `${AWARDS}/echl_award_best_goalie.png`,
  'ECHL Rookie':              `${AWARDS}/echl_award_best_rookie.png`,
  'ECHL Regular Season':      `${AWARDS}/echl_award_TEAM_MOST_POINTS.png`,

  // The junior leagues' regular-season titles, which have their own trophies.
  'Hamilton Spectator':       `${AWARDS}/ontario_hockey_league_award_TEAM_MOST_POINTS.png`,
  'Scotty Munro':             `${AWARDS}/western_hockey_league_award_TEAM_MOST_POINTS.png`,
  'Jean Rougeau':             `${AWARDS}/quebec_major_junior_hockey_league_award_TEAM_MOST_POINTS.png`,
  "Presidents' Trophy":       `${AWARDS}/national_hockey_league_award_TEAM_MOST_POINTS.png`,

  // Named awards in leagues with no art of their own.
  'Hobey Baker':              `${AWARDS}/national_hockey_league_award_mvp.png`,
  'Mike Richter':             `${AWARDS}/national_hockey_league_award_best_goalie.png`,
  'Tim Taylor':               `${AWARDS}/national_hockey_league_award_best_rookie.png`,
  'Guldpucken':               `${AWARDS}/national_hockey_league_award_mvp.png`,
  'Loob Trophy':              `${AWARDS}/national_hockey_league_award_goals.png`,
  'Salming':                  `${AWARDS}/national_hockey_league_award_best_defender.png`,
  'Honkens':                  `${AWARDS}/national_hockey_league_award_best_goalie.png`,
  'Lasse Oksanen':            `${AWARDS}/national_hockey_league_award_mvp.png`,
  'Ketola':                   `${AWARDS}/national_hockey_league_award_points.png`,
  'Honkavaara':               `${AWARDS}/national_hockey_league_award_goals.png`,
  'Rautakallio':              `${AWARDS}/national_hockey_league_award_best_defender.png`,
  'Ylönen':                   `${AWARDS}/national_hockey_league_award_best_goalie.png`,
  'Jarmo Wasama':             `${AWARDS}/national_hockey_league_award_best_rookie.png`,
  'Golden Stick':             `${AWARDS}/national_hockey_league_award_mvp.png`,
  'Cherepanov':               `${AWARDS}/national_hockey_league_award_best_rookie.png`,
  'Continental Cup':          `${AWARDS}/national_hockey_league_award_TEAM_MOST_POINTS.png`,
  'Zlatá hokejka':            `${AWARDS}/national_hockey_league_award_mvp.png`,
  'Anderson Cup':             `${AWARDS}/national_hockey_league_award_TEAM_MOST_POINTS.png`,
  'Årets Rookie':             `${AWARDS}/national_hockey_league_award_best_rookie.png`,
  'KHL Top Sniper':           `${AWARDS}/national_hockey_league_award_goals.png`,
  'KHL Top Scoring Defenceman': `${AWARDS}/national_hockey_league_award_best_defender.png`,

  // And the plain forms every remaining league builds its award names from.
  // Last in the object, so nothing more specific is ever shadowed.
  'Player of the Year':       `${AWARDS}/national_hockey_league_award_mvp.png`,
  'Top Scorer':               `${AWARDS}/national_hockey_league_award_points.png`,
  'Scoring Champion':         `${AWARDS}/national_hockey_league_award_points.png`,
  'Scoring Title':            `${AWARDS}/national_hockey_league_award_points.png`,
  'Leading Goalscorer':       `${AWARDS}/national_hockey_league_award_goals.png`,
  'Defenceman of the Year':   `${AWARDS}/national_hockey_league_award_best_defender.png`,
  'Best Defenceman':          `${AWARDS}/national_hockey_league_award_best_defender.png`,
  'Goaltender of the Year':   `${AWARDS}/national_hockey_league_award_best_goalie.png`,
  'Best Goaltender':          `${AWARDS}/national_hockey_league_award_best_goalie.png`,
  'Top Goaltender':           `${AWARDS}/national_hockey_league_award_best_goalie.png`,
  'Best Player':              `${AWARDS}/national_hockey_league_award_mvp.png`,
  'Rookie of the Year':       `${AWARDS}/national_hockey_league_award_best_rookie.png`,
  'Top Rookie':               `${AWARDS}/national_hockey_league_award_best_rookie.png`,
  'Regular Season Champ':     `${AWARDS}/national_hockey_league_award_TEAM_MOST_POINTS.png`,

};

// Playoff (championship) trophies, keyed by league string in LEAGUE_CONFIG.
export const PLAYOFF_TROPHY_IMAGES = {
  NHL:   `${PO}/national_hockey_league_po_trophy.png`,
  AHL:   `${PO}/american_hockey_league_po_trophy.png`,
  OHL:   `${PO}/ontario_hockey_league_po_trophy.png`,
  WHL:   `${PO}/western_hockey_league_po_trophy.png`,
  QMJHL: `${PO}/quebec_major_junior_hockey_league_po_trophy.png`
};

// Cup name → playoff trophy. Same map keyed by championship cup names, which
// is how the retirement screen aggregates them (e.g. "Stanley Cup").
export const CUP_IMAGES = {
  'Stanley Cup':            PLAYOFF_TROPHY_IMAGES.NHL,
  'Calder Cup':             PLAYOFF_TROPHY_IMAGES.AHL,
  'J. Ross Robertson Cup':  PLAYOFF_TROPHY_IMAGES.OHL,
  'Ed Chynoweth Cup':       PLAYOFF_TROPHY_IMAGES.WHL,
  'Gilles-Courteau Trophy': PLAYOFF_TROPHY_IMAGES.QMJHL
};

// Substring lookup, first matching key wins. Returns URL or null.
export const getAwardImage = (name) => {
  if (!name) return null;
  // Check specific cups first
  for (const [key, url] of Object.entries(CUP_IMAGES)) {
    if (name.includes(key)) return url;
  }
  // Then individual awards
  for (const [key, url] of Object.entries(AWARD_IMAGES)) {
    if (name.includes(key)) return url;
  }
  return null;
};

export const getPlayoffTrophyImage = (league) => PLAYOFF_TROPHY_IMAGES[league] || null;