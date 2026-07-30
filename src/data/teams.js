// --- DATABASES: TEAMS & LEAGUES ---

export const nhlTeams = [
  { id: 'BOS', name: 'Boston Bruins', div: 'ATL', conf: 'EAST', ahlId: 'PRO', color: '#FFB81C', bg: '#000000' },
  { id: 'TOR', name: 'Toronto Maple Leafs', div: 'ATL', conf: 'EAST', ahlId: 'TORA', color: '#FFFFFF', bg: '#00205B' },
  { id: 'MTL', name: 'Montreal Canadiens', div: 'ATL', conf: 'EAST', ahlId: 'LAV', color: '#FFFFFF', bg: '#AF1E2D' },
  { id: 'TBL', name: 'Tampa Bay Lightning', div: 'ATL', conf: 'EAST', ahlId: 'SYR', color: '#FFFFFF', bg: '#002868' },
  { id: 'FLA', name: 'Florida Panthers', div: 'ATL', conf: 'EAST', ahlId: 'CLT', color: '#B9975B', bg: '#041E42' },
  { id: 'BUF', name: 'Buffalo Sabres', div: 'ATL', conf: 'EAST', ahlId: 'ROC', color: '#FFB81C', bg: '#002654' },
  { id: 'DET', name: 'Detroit Red Wings', div: 'ATL', conf: 'EAST', ahlId: 'GR', color: '#FFFFFF', bg: '#CE1126' },
  { id: 'OTT', name: 'Ottawa Senators', div: 'ATL', conf: 'EAST', ahlId: 'BEL', color: '#C52032', bg: '#000000' },
  { id: 'NYR', name: 'New York Rangers', div: 'MET', conf: 'EAST', ahlId: 'HFD', color: '#FFFFFF', bg: '#0038A8' },
  { id: 'NYI', name: 'New York Islanders', div: 'MET', conf: 'EAST', ahlId: 'BRI', color: '#F47D30', bg: '#00539B' },
  { id: 'NJD', name: 'New Jersey Devils', div: 'MET', conf: 'EAST', ahlId: 'UTI', color: '#FFFFFF', bg: '#CE1126' },
  { id: 'CAR', name: 'Carolina Hurricanes', div: 'MET', conf: 'EAST', ahlId: 'CHI', color: '#FFFFFF', bg: '#CE1126' },
  { id: 'WSH', name: 'Washington Capitals', div: 'MET', conf: 'EAST', ahlId: 'HER', color: '#FFFFFF', bg: '#041E42' },
  { id: 'PIT', name: 'Pittsburgh Penguins', div: 'MET', conf: 'EAST', ahlId: 'WBS', color: '#FCB514', bg: '#000000' },
  { id: 'PHI', name: 'Philadelphia Flyers', div: 'MET', conf: 'EAST', ahlId: 'LV', color: '#000000', bg: '#F74902' },
  { id: 'CBJ', name: 'Columbus Blue Jackets', div: 'MET', conf: 'EAST', ahlId: 'CLE', color: '#CE1126', bg: '#002654' },
  { id: 'COL', name: 'Colorado Avalanche', div: 'CEN', conf: 'WEST', ahlId: 'COLE', color: '#FFFFFF', bg: '#6F263D' },
  { id: 'DAL', name: 'Dallas Stars', div: 'CEN', conf: 'WEST', ahlId: 'TEX', color: '#FFFFFF', bg: '#006847' },
  { id: 'WPG', name: 'Winnipeg Jets', div: 'CEN', conf: 'WEST', ahlId: 'MAN', color: '#FFFFFF', bg: '#041E42' },
  { id: 'NSH', name: 'Nashville Predators', div: 'CEN', conf: 'WEST', ahlId: 'MIL', color: '#041E42', bg: '#FFB81C' },
  { id: 'STL', name: 'St. Louis Blues', div: 'CEN', conf: 'WEST', ahlId: 'SPR', color: '#FCB514', bg: '#002F87' },
  { id: 'MIN', name: 'Minnesota Wild', div: 'CEN', conf: 'WEST', ahlId: 'IA', color: '#DDCBA4', bg: '#154734' },
  { id: 'UTA', name: 'Utah Hockey Club', div: 'CEN', conf: 'WEST', ahlId: 'TUC', color: '#FFFFFF', bg: '#000000' },
  { id: 'CHI', name: 'Chicago Blackhawks', div: 'CEN', conf: 'WEST', ahlId: 'RFD', color: '#FFFFFF', bg: '#CF0A2C' },
  { id: 'VGK', name: 'Vegas Golden Knights', div: 'PAC', conf: 'WEST', ahlId: 'HSK', color: '#B4975A', bg: '#333F42' },
  { id: 'EDM', name: 'Edmonton Oilers', div: 'PAC', conf: 'WEST', ahlId: 'BAK', color: '#FF4C00', bg: '#041E42' },
  { id: 'VAN', name: 'Vancouver Canucks', div: 'PAC', conf: 'WEST', ahlId: 'ABB', color: '#FFFFFF', bg: '#00205B' },
  { id: 'LAK', name: 'Los Angeles Kings', div: 'PAC', conf: 'WEST', ahlId: 'ONT', color: '#A2AAAD', bg: '#111111' },
  { id: 'SEA', name: 'Seattle Kraken', div: 'PAC', conf: 'WEST', ahlId: 'CV', color: '#99D9D9', bg: '#001628' },
  { id: 'CGY', name: 'Calgary Flames', div: 'PAC', conf: 'WEST', ahlId: 'CGYW', color: '#F62817', bg: '#111111' },
  { id: 'ANA', name: 'Anaheim Ducks', div: 'PAC', conf: 'WEST', ahlId: 'SD', color: '#F95602', bg: '#000000' },
  { id: 'SJS', name: 'San Jose Sharks', div: 'PAC', conf: 'WEST', ahlId: 'SJB', color: '#FFFFFF', bg: '#006D75' }
];

export const ohlTeams = [ { id: 'LDN', name: 'London', color: '#006B54', bg: '#FFC425' }, { id: 'OTT', name: 'Ottawa', color: '#000000', bg: '#C8102E' }, { id: 'KIT', name: 'Kitchener', color: '#0033A0', bg: '#C8102E' }, { id: 'OSH', name: 'Oshawa', color: '#C8102E', bg: '#00205B' }, { id: 'SAG', name: 'Saginaw', color: '#002F87', bg: '#C8102E' }, { id: 'ERI', name: 'Erie', color: '#F2A900', bg: '#00205B' }, { id: 'GUE', name: 'Guelph', color: '#C8102E', bg: '#000000' }, { id: 'SOO', name: 'Sault Ste. Marie', color: '#C8102E', bg: '#FFFFFF' }, { id: 'FLN', name: 'Flint', color: '#00205B', bg: '#F2A900' }, { id: 'SBY', name: 'Sudbury', color: '#002F87', bg: '#FFFFFF' }, { id: 'PBO', name: 'Peterborough', color: '#660000', bg: '#FFFFFF' }, { id: 'KGN', name: 'Kingston', color: '#000000', bg: '#F2A900' }, { id: 'BAR', name: 'Barrie', color: '#00205B', bg: '#F2A900' }, { id: 'SAR', name: 'Sarnia', color: '#000000', bg: '#C8102E' }, { id: 'WIN', name: 'Windsor', color: '#C8102E', bg: '#00205B' }, { id: 'NIA', name: 'Niagara', color: '#000000', bg: '#C8102E' }, { id: 'NB', name: 'North Bay', color: '#000000', bg: '#4C8C2B' }, { id: 'MIS', name: 'Mississauga', color: '#00205B', bg: '#FFFFFF' } ];
export const whlTeams = [ { id: 'POR', name: 'Portland', color: '#000000', bg: '#C8102E' }, { id: 'SEA', name: 'Seattle TB', color: '#002855', bg: '#00A3E0' }, { id: 'EDM', name: 'Edmonton', color: '#E31837', bg: '#041E42' }, { id: 'KEL', name: 'Kelowna', color: '#000000', bg: '#00843D' }, { id: 'KAM', name: 'Kamloops', color: '#00205B', bg: '#F2A900' }, { id: 'EVE', name: 'Everett', color: '#005826', bg: '#C2C4C6' }, { id: 'VIC', name: 'Victoria', color: '#00205B', bg: '#FFFFFF' }, { id: 'VAN', name: 'Vancouver', color: '#000000', bg: '#C8102E' }, { id: 'PG', name: 'Prince George', color: '#000000', bg: '#C8102E' }, { id: 'TC', name: 'Tri-City', color: '#00205B', bg: '#C8102E' }, { id: 'SPO', name: 'Spokane', color: '#00205B', bg: '#C8102E' }, { id: 'RD', name: 'Red Deer', color: '#000000', bg: '#C8102E' }, { id: 'MJ', name: 'Moose Jaw', color: '#000000', bg: '#C8102E' }, { id: 'SAS', name: 'Saskatoon', color: '#00205B', bg: '#F2A900' }, { id: 'MH', name: 'Medicine Hat', color: '#FF671F', bg: '#000000' }, { id: 'CAL', name: 'Calgary', color: '#000000', bg: '#F2A900' }, { id: 'LET', name: 'Lethbridge', color: '#00205B', bg: '#C8102E' }, { id: 'SC', name: 'Swift Current', color: '#0033A0', bg: '#009739' } ];
export const qmjhlTeams = [ { id: 'HAL', name: 'Halifax', color: '#005A32', bg: '#C8102E' }, { id: 'QUE', name: 'Quebec', color: '#000000', bg: '#C8102E' }, { id: 'GAT', name: 'Gatineau', color: '#000000', bg: '#FFFFFF' }, { id: 'RIM', name: 'Rimouski', color: '#00205B', bg: '#FFFFFF' }, { id: 'SHE', name: 'Sherbrooke', color: '#00205B', bg: '#C8102E' }, { id: 'VIC', name: 'Victoriaville', color: '#000000', bg: '#FFB81C' }, { id: 'ROU', name: 'Rouyn-Noranda', color: '#C8102E', bg: '#000000' }, { id: 'CAP', name: 'Cape Breton', color: '#000000', bg: '#C8102E' }, { id: 'CHI', name: 'Chicoutimi', color: '#00205B', bg: '#89CFDC' }, { id: 'DRU', name: 'Drummondville', color: '#C8102E', bg: '#000000' }, { id: 'SNB', name: 'Saint John', color: '#00205B', bg: '#C8102E' }, { id: 'BAT', name: 'Acadie-Bathurst', color: '#000000', bg: '#C8102E' }, { id: 'MON', name: 'Moncton', color: '#00205B', bg: '#C8102E' }, { id: 'CHA', name: 'Charlottetown', color: '#000000', bg: '#FFB81C' }, { id: 'VDO', name: "Val-d'Or", color: '#005A32', bg: '#FFB81C' }, { id: 'BLB', name: 'Blainville', color: '#000000', bg: '#FFFFFF' }, { id: 'SHA', name: 'Shawinigan', color: '#00205B', bg: '#F2A900' }, { id: 'BAC', name: 'Baie-Comeau', color: '#C8102E', bg: '#FFFFFF' } ];
export const ahlTeams = [ { id: 'HER', name: 'Hershey Bears', color: '#4B3029', bg: '#E4A282' }, { id: 'PRO', name: 'Providence Bruins', color: '#FFB81C', bg: '#000000' }, { id: 'SPR', name: 'Springfield Thunderbirds', color: '#FFFFFF', bg: '#041E42' }, { id: 'CV', name: 'Coachella Valley Firebirds', color: '#FFFFFF', bg: '#E31837' }, { id: 'TEX', name: 'Texas Stars', color: '#FFFFFF', bg: '#006847' }, { id: 'CHI', name: 'Chicago Wolves', color: '#C8102E', bg: '#F2A900' }, { id: 'UTI', name: 'Utica Comets', color: '#000000', bg: '#00A3E0' }, { id: 'SYR', name: 'Syracuse Crunch', color: '#FFFFFF', bg: '#002868' }, { id: 'LAV', name: 'Laval Rocket', color: '#FFFFFF', bg: '#AF1E2D' }, { id: 'BEL', name: 'Belleville Senators', color: '#000000', bg: '#C8102E' }, { id: 'ROC', name: 'Rochester Americans', color: '#00205B', bg: '#C8102E' }, { id: 'CLE', name: 'Cleveland Monsters', color: '#00205B', bg: '#C8102E' }, { id: 'GR', name: 'Grand Rapids Griffins', color: '#C8102E', bg: '#000000' }, { id: 'MIL', name: 'Milwaukee Admirals', color: '#000000', bg: '#89CFDC' }, { id: 'IA', name: 'Iowa Wild', color: '#000000', bg: '#C8102E' }, { id: 'ONT', name: 'Ontario Reign', color: '#A2AAAD', bg: '#111111' }, { id: 'COLE', name: 'Colorado Eagles', color: '#FFFFFF', bg: '#6F263D' }, { id: 'TUC', name: 'Tucson Roadrunners', color: '#8C2633', bg: '#E2D6B5' }, { id: 'TORA', name: 'Toronto Marlies', color: '#FFFFFF', bg: '#00205B' }, { id: 'CLT', name: 'Charlotte Checkers', color: '#000000', bg: '#C8102E' }, { id: 'HFD', name: 'Hartford Wolf Pack', color: '#FFFFFF', bg: '#0038A8' }, { id: 'BRI', name: 'Bridgeport Islanders', color: '#F47D30', bg: '#00539B' }, { id: 'WBS', name: 'WBS Penguins', color: '#FCB514', bg: '#000000' }, { id: 'LV', name: 'Lehigh Valley Phantoms', color: '#000000', bg: '#F74902' }, { id: 'MAN', name: 'Manitoba Moose', color: '#FFFFFF', bg: '#041E42' }, { id: 'RFD', name: 'Rockford IceHogs', color: '#FFFFFF', bg: '#CF0A2C' }, { id: 'HSK', name: 'Henderson Silver Knights', color: '#B4975A', bg: '#333F42' }, { id: 'BAK', name: 'Bakersfield Condors', color: '#FF4C00', bg: '#041E42' }, { id: 'ABB', name: 'Abbotsford Canucks', color: '#FFFFFF', bg: '#00205B' }, { id: 'CGYW', name: 'Calgary Wranglers', color: '#F62817', bg: '#111111' }, { id: 'SD', name: 'San Diego Gulls', color: '#F95602', bg: '#000000' }, { id: 'SJB', name: 'San Jose Barracuda', color: '#FFFFFF', bg: '#006D75' } ];

export const euroTeams = [
  { id: 'FHC', name: 'Frölunda HC', color: '#FFFFFF', bg: '#E31837', league: 'SHL' }, { id: 'FBK', name: 'Färjestad BK', color: '#FFFFFF', bg: '#006B54', league: 'SHL' }, { id: 'SAIK', name: 'Skellefteå AIK', color: '#000000', bg: '#FFB81C', league: 'SHL' }, { id: 'DIF', name: 'Djurgårdens IF', color: '#FFFFFF', bg: '#00205B', league: 'SHL' }, { id: 'BIF', name: 'Brynäs IF', color: '#FFFFFF', bg: '#000000', league: 'SHL' },
  { id: 'TAP', name: 'Tappara', color: '#FFFFFF', bg: '#00539B', league: 'Liiga' }, { id: 'HIFK', name: 'HIFK', color: '#FFFFFF', bg: '#E31837', league: 'Liiga' }, { id: 'ILV', name: 'Ilves', color: '#000000', bg: '#FFB81C', league: 'Liiga' }, { id: 'KRP', name: 'Kärpät', color: '#FFFFFF', bg: '#000000', league: 'Liiga' }, { id: 'TPS', name: 'TPS', color: '#FFFFFF', bg: '#000000', league: 'Liiga' },
  { id: 'SKA', name: 'SKA St. Petersburg', color: '#FFFFFF', bg: '#0038A8', league: 'KHL' }, { id: 'CSK', name: 'CSKA Moscow', color: '#FFFFFF', bg: '#E31837', league: 'KHL' }, { id: 'AVA', name: 'Avangard Omsk', color: '#FFFFFF', bg: '#CE1126', league: 'KHL' }, { id: 'MET', name: 'Metallurg Mg', color: '#FFFFFF', bg: '#00205B', league: 'KHL' }, { id: 'AKB', name: 'Ak Bars Kazan', color: '#FFFFFF', bg: '#006B54', league: 'KHL' }
];

export const nationalities = [
  { id: 'CAN', img: 'https://flagcdn.com/ca.svg', name: 'Canada', sentenceName: 'Canada' },
  { id: 'USA', img: 'https://flagcdn.com/us.svg', name: 'United States', sentenceName: 'the United States' },
  { id: 'SWE', img: 'https://flagcdn.com/se.svg', name: 'Sweden', sentenceName: 'Sweden' },
  { id: 'FIN', img: 'https://flagcdn.com/fi.svg', name: 'Finland', sentenceName: 'Finland' },
  { id: 'CZE', img: 'https://flagcdn.com/cz.svg', name: 'Czechia', sentenceName: 'Czechia' },
  { id: 'RUS', img: 'https://flagcdn.com/ru.svg', name: 'Russia', sentenceName: 'Russia' }
];

export const juniorLeagues = ['OHL', 'WHL', 'QMJHL'];
export const euroLeagues = ['SHL', 'Liiga', 'KHL'];

// Number of teams and playoff spots per league. Used so junior/AHL leagues
// can no longer make the playoffs 100% of the time (this was bug #4 in the
// original code, where standings were always rolled 1-16 regardless of
// league size).
export const LEAGUE_CONFIG = {
  NHL: { teams: nhlTeams.length, playoffSpots: 16 },
  AHL: { teams: ahlTeams.length, playoffSpots: 16 },
  OHL: { teams: ohlTeams.length, playoffSpots: 8 },
  WHL: { teams: whlTeams.length, playoffSpots: 8 },
  QMJHL: { teams: qmjhlTeams.length, playoffSpots: 8 }
};

export const getTeamData = (teamId, league) => {
  if (league === 'OHL') return ohlTeams.find(t => t.id === teamId);
  if (league === 'WHL') return whlTeams.find(t => t.id === teamId);
  if (league === 'QMJHL') return qmjhlTeams.find(t => t.id === teamId);
  if (league === 'AHL') return ahlTeams.find(t => t.id === teamId) || ahlTeams[0];
  if (euroLeagues.includes(league)) return euroTeams.find(t => t.id === teamId) || euroTeams[0];
  return nhlTeams.find(t => t.id === teamId) || nhlTeams[0];
};

export const getOpponentPool = (league) => {
  if (league === 'OHL') return ohlTeams;
  if (league === 'WHL') return whlTeams;
  if (league === 'QMJHL') return qmjhlTeams;
  if (league === 'AHL') return ahlTeams;
  return nhlTeams;
};

export const getDeployment = (ovr, pos, league) => {
  if (juniorLeagues.includes(league)) {
    if (ovr >= 60) return pos === 'G' ? 'Starting Goalie' : '1st Line';
    return pos === 'G' ? 'Backup Goalie' : '2nd Line';
  }
  if (league === 'AHL') {
    if (ovr >= 68) return pos === 'G' ? 'Starting Goalie' : '1st Line';
    if (ovr >= 62) return pos === 'G' ? '1B Goalie' : '2nd Line';
    return pos === 'G' ? 'Backup Goalie' : '3rd Line';
  }
  if (ovr >= 85) return pos === 'G' ? 'Franchise Goalie' : '1st Line';
  if (ovr >= 78) return pos === 'G' ? 'Starting Goalie' : '2nd Line';
  if (ovr >= 72) return pos === 'G' ? '1B Goalie' : '3rd Line';
  if (ovr >= 65) return pos === 'G' ? 'Backup Goalie' : '4th Line';
  return pos === 'G' ? 'AHL Call-up' : 'Healthy Scratch';
};
