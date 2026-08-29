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
// Order matters — first matching key wins, so put more-specific keys first.
export const AWARD_IMAGES = {
  // NHL
  'Hart':                     `${AWARDS}/national_hockey_league_award_mvp.png`,
  'Art Ross':                 `${AWARDS}/national_hockey_league_award_points.png`,
  'Maurice Richard':          `${AWARDS}/national_hockey_league_award_goals.png`,
  'Norris':                   `${AWARDS}/national_hockey_league_award_best_defender.png`,
  'Vezina':                   `${AWARDS}/national_hockey_league_award_best_goalie.png`,
  'Calder Trophy':            `${AWARDS}/national_hockey_league_award_best_rookie.png`,
  'Conn Smythe':              `${AWARDS}/national_hockey_league_award_playoff_mvp.png`,
  // NOTE: NHL All-Star and 1st Team All-Star are TEAM SELECTIONS, not physical
  // trophies — leaving them out of the image map so getAwardImage returns null
  // and the retirement pill renders text-only. The FHM asset previously used
  // here (national_hockey_league_award_PLAYERS_MVP.png) is the Ted Lindsay
  // Award artwork specifically, which the game does not currently award.

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

  // USHL — no dedicated images in repo, fall back to NHL equivalents
  'USHL Player of the Year':      `${AWARDS}/national_hockey_league_award_mvp.png`,
  'USHL Forward of the Year':     `${AWARDS}/national_hockey_league_award_points.png`,
  'USHL Defenceman of the Year':  `${AWARDS}/national_hockey_league_award_best_defender.png`,
  'USHL Goaltender of the Year':  `${AWARDS}/national_hockey_league_award_best_goalie.png`

  // NCAA / College: 1st Team All-American is a team selection, not a trophy —
  // leaving unmapped so it renders text-only, same reason as NHL All-Star above.
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

// Substring lookup — first matching key wins. Returns URL or null.
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