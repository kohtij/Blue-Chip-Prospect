// Who hands out what, per league.
//
// This used to be a switch statement inside _computeAwards with a case for the
// NHL, the OHL, the WHL, the QMJHL and the USHL. Those are five of the twenty
// leagues in LEAGUE_CONFIG. The other fifteen gave out nothing at all, so a
// decade in Sweden won no trophies, a Hobey Baker season in college won no
// trophies, and the European twilight contract led straight into a league
// where no award existed. A table rather than a switch, so adding a league is
// adding a row.
//
// Where a league's real awards are well known they are named. Where they are
// not, the entry uses the plain form the league itself uses in English, which
// is honest, rather than an invented name that would read as wrong to anyone
// who follows that league.

const generic = (lg) => ({
  mvp: `${lg} Player of the Year`,
  scoring: `${lg} Top Scorer`,
  goals: `${lg} Leading Goalscorer`,
  dman: `${lg} Defenceman of the Year`,
  goalie: `${lg} Goaltender of the Year`,
  rookie: `${lg} Rookie of the Year`,
  regular: `${lg} Regular Season Champion`
});

export const LEAGUE_AWARDS = {
  NHL: {
    mvp: 'Hart Trophy',
    scoring: 'Art Ross Trophy',
    goals: 'Maurice Richard Trophy',
    dman: 'Norris Trophy',
    goalie: 'Vezina Trophy',
    rookie: 'Calder Trophy',
    regular: "Presidents' Trophy"
  },
  AHL: {
    mvp: 'Les Cunningham Award (AHL Most Valuable Player)',
    scoring: 'John B. Sollenberger Trophy (AHL Top Scorer)',
    goals: 'Willie Marshall Award (AHL Leading Goalscorer)',
    dman: 'Eddie Shore Award (AHL Outstanding Defenceman)',
    goalie: 'Baz Bastien Memorial Award (AHL Top Goaltender)',
    rookie: 'Dudley "Red" Garrett Memorial Award (AHL Rookie of the Year)',
    regular: 'Macgregor Kilpatrick Trophy (Regular Season Champ)'
  },
  ECHL: generic('ECHL'),

  OHL: {
    mvp: 'Red Tilson Trophy (OHL Most Outstanding Player)',
    scoring: 'Eddie Powers Memorial Trophy (OHL Scoring Champion)',
    goals: 'OHL Leading Goalscorer',
    dman: 'Max Kaminsky Trophy (OHL Most Outstanding Defenceman)',
    goalie: 'FW "Dinty" Moore Trophy (OHL Best Goaltender)',
    rookie: 'Emms Family Award (OHL Rookie of the Year)',
    regular: 'Hamilton Spectator Trophy (Regular Season Champ)'
  },
  WHL: {
    mvp: 'Four Broncos Memorial Trophy (WHL Player of the Year)',
    scoring: 'Bob Clarke Trophy (WHL Top Scorer)',
    goals: 'WHL Leading Goalscorer',
    dman: 'Bill Hunter Memorial Trophy (WHL Top Defenceman)',
    goalie: 'Del Wilson Trophy (WHL Top Goaltender)',
    rookie: 'Jim Piggott Memorial Trophy (WHL Rookie of the Year)',
    regular: 'Scotty Munro Memorial Trophy (Regular Season Champ)'
  },
  QMJHL: {
    mvp: 'Michel Brière Memorial Trophy (QMJHL Most Valuable Player)',
    scoring: 'Jean Béliveau Trophy (QMJHL Top Scorer)',
    goals: 'QMJHL Leading Goalscorer',
    dman: 'Émile Bouchard Trophy (QMJHL Defenceman of the Year)',
    goalie: 'Jacques Plante Trophy (QMJHL Best GAA)',
    rookie: 'RDS Cup (QMJHL Rookie of the Year)',
    regular: 'Jean Rougeau Trophy (Regular Season Champ)'
  },
  USHL: {
    mvp: 'USHL Player of the Year',
    scoring: 'USHL Forward of the Year',
    goals: 'USHL Leading Goalscorer',
    dman: 'USHL Defenceman of the Year',
    goalie: 'USHL Goaltender of the Year',
    rookie: 'USHL Rookie of the Year',
    regular: 'Anderson Cup (Regular Season Champ)'
  },
  BCHL: generic('BCHL'),
  SPHL: generic('SPHL'),

  NCAA: {
    mvp: 'Hobey Baker Award (Top Player in College Hockey)',
    scoring: 'NCAA Scoring Champion',
    goals: 'NCAA Leading Goalscorer',
    dman: 'NCAA Defenceman of the Year',
    goalie: 'Mike Richter Award (Top Goaltender)',
    rookie: 'Tim Taylor Award (National Rookie of the Year)',
    regular: 'NCAA Regular Season Champion'
  },

  SHL: {
    mvp: 'Guldpucken (Swedish Player of the Year)',
    scoring: 'SHL Poängligan (Scoring Title)',
    goals: 'Håkan Loob Trophy (SHL Leading Goalscorer)',
    dman: 'Salming Trophy (SHL Best Defenceman)',
    goalie: 'Honkens Trophy (SHL Best Goaltender)',
    rookie: 'Årets Rookie (SHL Rookie of the Year)',
    regular: 'SHL Regular Season Champion'
  },
  LIIGA: {
    mvp: 'Lasse Oksanen Trophy (Liiga Best Player)',
    scoring: 'Veli-Pekka Ketola Trophy (Liiga Top Scorer)',
    goals: 'Aarne Honkavaara Trophy (Liiga Leading Goalscorer)',
    dman: 'Pekka Rautakallio Trophy (Liiga Best Defenceman)',
    goalie: 'Urpo Ylönen Trophy (Liiga Best Goaltender)',
    rookie: 'Jarmo Wasama Memorial Trophy (Liiga Rookie of the Year)',
    regular: 'Liiga Regular Season Champion'
  },
  KHL: {
    mvp: 'Golden Stick (KHL Most Valuable Player)',
    scoring: 'KHL Top Scorer',
    goals: 'KHL Top Sniper',
    dman: 'KHL Top Scoring Defenceman',
    goalie: 'KHL Top Goaltender',
    rookie: 'Alexei Cherepanov Award (KHL Top Rookie)',
    regular: 'Continental Cup (KHL Regular Season Champion)'
  },
  CZECH: {
    mvp: 'Zlatá hokejka (Czech Player of the Year)',
    scoring: 'Extraliga Scoring Champion',
    goals: 'Extraliga Leading Goalscorer',
    dman: 'Extraliga Defenceman of the Year',
    goalie: 'Extraliga Goaltender of the Year',
    rookie: 'Extraliga Rookie of the Year',
    regular: 'Extraliga Regular Season Champion'
  },
  SWISS: generic('National League'),
  DEL: generic('DEL'),
  ICEHL: generic('ICEHL'),
  SLOVAK: generic('Slovak Extraliga'),

  J20: generic('J20 Nationell'),
  U20: generic('U20 SM-sarja')
};

export const awardsFor = (league) => LEAGUE_AWARDS[league] || generic(league || 'League');
