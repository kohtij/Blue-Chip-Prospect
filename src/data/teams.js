// ==========================================
// LEAGUE LOGOS & CONFIGURATION
// ==========================================
export const leagueLogos = {
  NHL: 'https://assets.nhle.com/logos/nhl/svg/NHL_light.svg',
  AHL: 'https://upload.wikimedia.org/wikipedia/en/thumb/7/7b/American_Hockey_League_logo.svg/250px-American_Hockey_League_logo.svg.png',
  OHL: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/07/Ontario_Hockey_League_logo.svg/250px-Ontario_Hockey_League_logo.svg.png',
  WHL: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/4e/Western_Hockey_League_logo.svg/250px-Western_Hockey_League_logo.svg.png',
  QMJHL: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f6/QMJHL_logo.svg/250px-QMJHL_logo.svg.png',
  USHL: 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d7/USHL_logo.svg/250px-USHL_logo.svg.png',
  NCAA: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/NCAA_logo.svg/250px-NCAA_logo.svg.png',
  SHL: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/18/Swedish_Hockey_League_logo.svg/250px-Swedish_Hockey_League_logo.svg.png',
  LIIGA: 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d1/Liiga_logo.svg/250px-Liiga_logo.svg.png'
};

export const LEAGUE_CONFIG = {
  NHL:   { name: 'National Hockey League',           playoffSpots: 16, logo: leagueLogos.NHL,   conferences: ['East','West'], divisions: ['Atlantic','Metropolitan','Central','Pacific'], playoffFormat: 'best-of-7-16' },
  AHL:   { name: 'American Hockey League',           playoffSpots: 16, logo: leagueLogos.AHL,   conferences: ['East','West'], divisions: ['Atlantic','North','Central','Pacific'],       playoffFormat: 'best-of-7-16' },
  OHL:   { name: 'Ontario Hockey League',            playoffSpots: 16, logo: leagueLogos.OHL,   conferences: ['East','West'], divisions: ['East','Central','Midwest','West'],           playoffFormat: 'best-of-7-16' },
  WHL:   { name: 'Western Hockey League',            playoffSpots: 16, logo: leagueLogos.WHL,   conferences: ['East','West'], divisions: ['East','Central','BC','US'],                  playoffFormat: 'best-of-7-16' },
  QMJHL: { name: 'Quebec Maritimes Junior Hockey League', playoffSpots: 16, logo: leagueLogos.QMJHL, conferences: [],          divisions: ['East','Central','West'],                     playoffFormat: 'best-of-7-16' },
  USHL:  { name: 'United States Hockey League',      playoffSpots: 12, logo: leagueLogos.USHL,  conferences: ['East','West'], divisions: ['Eastern','Western'],                         playoffFormat: 'best-of-5-12' },
  NCAA:  { name: 'NCAA Division I Hockey',           playoffSpots: 16, logo: leagueLogos.NCAA,  conferences: [],              divisions: [], ncaaConferences: ['Hockey East','Big Ten','NCHC','ECAC','CCHA','Atlantic Hockey America','Independent'], playoffFormat: 'frozen-four' },
  SHL:   { name: 'Swedish Hockey League',            playoffSpots: 10, logo: leagueLogos.SHL,   conferences: [],              divisions: [], playoffFormat: 'best-of-7-10' },
  LIIGA: { name: 'Finnish Liiga',                    playoffSpots: 10, logo: leagueLogos.LIIGA, conferences: [],              divisions: [], playoffFormat: 'best-of-7-10' }
};

// Playoff round definitions. App.jsx can read these to render the correct bracket
// without hardcoding round names or match counts per league.
export const PLAYOFF_ROUNDS = {
  'best-of-7-16': [
    { name: 'First Round',       teams: 16, gamesPerMatchup: 7 },
    { name: 'Second Round',      teams: 8,  gamesPerMatchup: 7 },
    { name: 'Conference Final',  teams: 4,  gamesPerMatchup: 7 },
    { name: 'League Final',      teams: 2,  gamesPerMatchup: 7 }
  ],
  'best-of-5-12': [
    { name: 'Play-In',           teams: 12, gamesPerMatchup: 3 },
    { name: 'Quarterfinal',      teams: 8,  gamesPerMatchup: 5 },
    { name: 'Semifinal',         teams: 4,  gamesPerMatchup: 5 },
    { name: 'Clark Cup Final',   teams: 2,  gamesPerMatchup: 5 }
  ],
  'best-of-7-10': [
    { name: 'Quarterfinal',      teams: 8,  gamesPerMatchup: 7 },
    { name: 'Semifinal',         teams: 4,  gamesPerMatchup: 7 },
    { name: 'Final',             teams: 2,  gamesPerMatchup: 7 }
  ],
  'frozen-four': [
    { name: 'Regional Semifinal', teams: 16, gamesPerMatchup: 1 },
    { name: 'Regional Final',     teams: 8,  gamesPerMatchup: 1 },
    { name: 'Frozen Four',        teams: 4,  gamesPerMatchup: 1 },
    { name: 'National Championship', teams: 2, gamesPerMatchup: 1 }
  ]
};

export const juniorLeagues = ['OHL', 'WHL', 'QMJHL', 'USHL'];
export const euroLeagues = ['SHL', 'LIIGA'];

// ==========================================
// NATIONALITIES
// ==========================================
export const nationalities = [
  { id: 'CAN', name: 'Canada', sentenceName: 'Canada', img: 'https://flagcdn.com/w40/ca.png' },
  { id: 'USA', name: 'United States', sentenceName: 'the United States', img: 'https://flagcdn.com/w40/us.png' },
  { id: 'SWE', name: 'Sweden', sentenceName: 'Sweden', img: 'https://flagcdn.com/w40/se.png' },
  { id: 'FIN', name: 'Finland', sentenceName: 'Finland', img: 'https://flagcdn.com/w40/fi.png' },
  { id: 'CZE', name: 'Czechia', sentenceName: 'Czechia', img: 'https://flagcdn.com/w40/cz.png' },
  { id: 'SVK', name: 'Slovakia', sentenceName: 'Slovakia', img: 'https://flagcdn.com/w40/sk.png' }
];

// ==========================================
// 1. NHL TEAMS
// ==========================================
export const nhlTeams = [
  { id: 'BOS', conf: 'East', div: 'Atlantic', city: 'Boston', name: 'Bruins', bg: '#000000', color: '#FFB81C', ahlId: 'PRO', rival: 'MTL', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/NHL/BOS/BOS_Primary_2025-Present.png' },
  { id: 'BUF', conf: 'East', div: 'Atlantic', city: 'Buffalo', name: 'Sabres', bg: '#002654', color: '#FCB514', ahlId: 'ROC', rival: 'TOR', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/NHL/BUF/BUF_Primary_2020-Present.png' },
  { id: 'DET', conf: 'East', div: 'Atlantic', city: 'Detroit', name: 'Red Wings', bg: '#CE1126', color: '#FFFFFF', ahlId: 'GR', rival: 'CHI', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/NHL/DET/DET_Primary_1948-Present.png' },
  { id: 'FLA', conf: 'East', div: 'Atlantic', city: 'Florida', name: 'Panthers', bg: '#041E42', color: '#C8102E', ahlId: 'CLT', rival: 'TBL', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/NHL/FLA/FLA_Primary_2016-Present.png' },
  { id: 'MTL', conf: 'East', div: 'Atlantic', city: 'Montreal', name: 'Canadiens', bg: '#AF1E2D', color: '#192168', ahlId: 'LAV', rival: 'BOS', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/NHL/MTL/MTL_Primary_1999-Present.png' },
  { id: 'OTT', conf: 'East', div: 'Atlantic', city: 'Ottawa', name: 'Senators', bg: '#C8102E', color: '#D69F3D', ahlId: 'BEL', rival: 'TOR', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/NHL/OTT/OTT_Primary_2020-Present.png' },
  { id: 'TBL', conf: 'East', div: 'Atlantic', city: 'Tampa Bay', name: 'Lightning', bg: '#002868', color: '#FFFFFF', ahlId: 'SYR', rival: 'FLA', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/NHL/TBL/TBL_Primary_2011-Present.png' },
  { id: 'TOR', conf: 'East', div: 'Atlantic', city: 'Toronto', name: 'Maple Leafs', bg: '#00205B', color: '#FFFFFF', ahlId: 'TOR_AHL', rival: 'MTL', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/NHL/TOR/TOR_Primary_2016-Present.png' },
  { id: 'CAR', conf: 'East', div: 'Metropolitan', city: 'Carolina', name: 'Hurricanes', bg: '#CC0000', color: '#000000', ahlId: 'CHI_AHL', rival: 'WSH', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/NHL/CAR/CAR_Primary_1999-Present.png' },
  { id: 'CBJ', conf: 'East', div: 'Metropolitan', city: 'Columbus', name: 'Blue Jackets', bg: '#002654', color: '#CE1126', ahlId: 'CLE', rival: 'PIT', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/NHL/CBJ/CBJ_Primary_2007-Present.png' },
  { id: 'NJD', conf: 'East', div: 'Metropolitan', city: 'New Jersey', name: 'Devils', bg: '#CE1126', color: '#000000', ahlId: 'UTI', rival: 'NYR', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/NHL/NJD/NJD_Primary_1999-Present.png' },
  { id: 'NYI', conf: 'East', div: 'Metropolitan', city: 'New York', name: 'Islanders', bg: '#00539B', color: '#F47D30', ahlId: 'BRI', rival: 'NYR', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/NHL/NYI/NYI_Primary_2017-Present.png' },
  { id: 'NYR', conf: 'East', div: 'Metropolitan', city: 'New York', name: 'Rangers', bg: '#0038A8', color: '#CE1126', ahlId: 'HFD', rival: 'NYI', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/NHL/NYR/NYR_Primary_1999-Present.png' },
  { id: 'PHI', conf: 'East', div: 'Metropolitan', city: 'Philadelphia', name: 'Flyers', bg: '#F74902', color: '#000000', ahlId: 'LVP', rival: 'PIT', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/NHL/PHI/PHI_Primary_2023-Present.png' },
  { id: 'PIT', conf: 'East', div: 'Metropolitan', city: 'Pittsburgh', name: 'Penguins', bg: '#000000', color: '#FCB514', ahlId: 'WBS', rival: 'PHI', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/NHL/PIT/PIT_Primary_2016-Present.png' },
  { id: 'WSH', conf: 'East', div: 'Metropolitan', city: 'Washington', name: 'Capitals', bg: '#041E42', color: '#C8102E', ahlId: 'HER', rival: 'PIT', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/NHL/WSH/WSH_Primary_2007-Present.png' },
  { id: 'CHI', conf: 'West', div: 'Central', city: 'Chicago', name: 'Blackhawks', bg: '#CF0A2C', color: '#000000', ahlId: 'RFD', rival: 'STL', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/NHL/CHI/CHI_Primary_1999-Present.png' },
  { id: 'COL', conf: 'West', div: 'Central', city: 'Colorado', name: 'Avalanche', bg: '#6F263D', color: '#236192', ahlId: 'COL_AHL', rival: 'MIN', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/NHL/COL/COL_Primary_1999-Present.png' },
  { id: 'DAL', conf: 'West', div: 'Central', city: 'Dallas', name: 'Stars', bg: '#006847', color: '#8F8F8C', ahlId: 'TEX', rival: 'NSH', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/NHL/DAL/DAL_Primary_2021-Present.png' },
  { id: 'MIN', conf: 'West', div: 'Central', city: 'Minnesota', name: 'Wild', bg: '#154734', color: '#A6192E', ahlId: 'IA', rival: 'COL', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/NHL/MIN/MIN_Primary_2013-Present.png' },
  { id: 'NSH', conf: 'West', div: 'Central', city: 'Nashville', name: 'Predators', bg: '#FFB81C', color: '#041E42', ahlId: 'MIL', rival: 'STL', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/NHL/NSH/NSH_Primary_2011-Present.png' },
  { id: 'STL', conf: 'West', div: 'Central', city: 'St. Louis', name: 'Blues', bg: '#002F87', color: '#FCB514', ahlId: 'SPR', rival: 'CHI', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/NHL/STL/STL_Primary_2025-Present.png' },
  { id: 'UTA', conf: 'West', div: 'Central', city: 'Utah', name: 'Mammoth', bg: '#010101', color: '#6CACE4', ahlId: 'TUC', rival: 'VGK', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/NHL/UTA/UTA_Primary_2025-Present.png' },
  { id: 'WPG', conf: 'West', div: 'Central', city: 'Winnipeg', name: 'Jets', bg: '#041E42', color: '#004C97', ahlId: 'MB', rival: 'MIN', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/NHL/WPG/WPG_Primary_2011-Present.png' },
  { id: 'ANA', conf: 'West', div: 'Pacific', city: 'Anaheim', name: 'Ducks', bg: '#F47A38', color: '#000000', ahlId: 'SD', rival: 'LAK', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/NHL/ANA/ANA_Primary_2024-Present.png' },
  { id: 'CGY', conf: 'West', div: 'Pacific', city: 'Calgary', name: 'Flames', bg: '#C8102E', color: '#F15A24', ahlId: 'CGY_AHL', rival: 'EDM', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/NHL/CGY/CGY_Primary_2020-Present.png' },
  { id: 'EDM', conf: 'West', div: 'Pacific', city: 'Edmonton', name: 'Oilers', bg: '#041E42', color: '#FF4C00', ahlId: 'BAK', rival: 'CGY', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/NHL/EDM/EDM_Primary_2022-Present.png' },
  { id: 'LAK', conf: 'West', div: 'Pacific', city: 'Los Angeles', name: 'Kings', bg: '#111111', color: '#A2AAAD', ahlId: 'ONT', rival: 'ANA', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/NHL/LAK/LAK_Primary_2024-Present.png' },
  { id: 'SJS', conf: 'West', div: 'Pacific', city: 'San Jose', name: 'Sharks', bg: '#006D75', color: '#EA6D13', ahlId: 'SJS_AHL', rival: 'VGK', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/NHL/SJS/SJS_Primary_2008-Present.png' },
  { id: 'SEA', conf: 'West', div: 'Pacific', city: 'Seattle', name: 'Kraken', bg: '#001628', color: '#99D9D9', ahlId: 'CV', rival: 'VAN', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/NHL/SEA/SEA_Primary_2021-Present.png' },
  { id: 'VAN', conf: 'West', div: 'Pacific', city: 'Vancouver', name: 'Canucks', bg: '#00205B', color: '#00843D', ahlId: 'ABB', rival: 'EDM', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/NHL/VAN/VAN_Primary_2019-Present.png' },
  { id: 'VGK', conf: 'West', div: 'Pacific', city: 'Vegas', name: 'Golden Knights', bg: '#B3A369', color: '#333F48', ahlId: 'HSK', rival: 'SJS', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/NHL/VGK/VGK_Primary_2017-Present.png' }
];

// ==========================================
// 2. OHL TEAMS
// ==========================================
export const ohlTeams = [
  { id: 'BAR', conf: 'East', div: 'East', city: 'Barrie', name: 'Colts', bg: '#002B54', color: '#FFFFFF', rival: 'OS', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/OHL/Barrie%20Colts/BAR_Primary_1995-Present.png' },
  { id: 'BFD', conf: 'East', div: 'Central', city: 'Brantford', name: 'Bulldogs', bg: '#000000', color: '#FDB913', rival: 'NIA', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/OHL/Brantford%20Bulldogs/BRN_Primary_2023-Present.png' },
  { id: 'ERI', conf: 'West', div: 'Midwest', city: 'Erie', name: 'Otters', bg: '#002D62', color: '#FDBB30', rival: 'LDN', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/OHL/Erie%20Otters/ERI_Primary_2019-Present.png' },
  { id: 'FLN', conf: 'West', div: 'West', city: 'Flint', name: 'Firebirds', bg: '#002B54', color: '#F26122', rival: 'SAG', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/OHL/Flint%20Firebirds/FLI_Primary_2015-Present.png' },
  { id: 'GUE', conf: 'West', div: 'Midwest', city: 'Guelph', name: 'Storm', bg: '#B31B1B', color: '#000000', rival: 'KIT', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/OHL/Guelph%20Storm/GUE_Primary_2018-Present.png' },
  { id: 'KGN', conf: 'East', div: 'East', city: 'Kingston', name: 'Frontenacs', bg: '#000000', color: '#FFB81C', rival: 'PBO', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/OHL/Kingston%20Frontenacs/KIN_Primary_2021-Present.png' },
  { id: 'KIT', conf: 'West', div: 'Midwest', city: 'Kitchener', name: 'Rangers', bg: '#0033A0', color: '#C8102E', rival: 'LDN', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/OHL/Kitchener%20Rangers/KIT_Primary_2001-Present.png' },
  { id: 'LDN', conf: 'West', div: 'Midwest', city: 'London', name: 'Knights', bg: '#006B54', color: '#B3995D', rival: 'KIT', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/OHL/London%20Knights/LDN_Primary_2019-Present.png' },
  { id: 'MIS', conf: 'East', div: 'Central', city: 'Mississauga', name: 'Steelheads', bg: '#00205B', color: '#FFFFFF', rival: 'BFD', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/OHL/Mississauga%20Steelheads/MIS_Primary_2015-2024.png' },
  { id: 'NIA', conf: 'East', div: 'Central', city: 'Niagara', name: 'IceDogs', bg: '#C8102E', color: '#000000', rival: 'BFD', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/OHL/Niagara%20Ice%20Dogs/NIA_Primary_2007-Present.png' },
  { id: 'NOB', conf: 'East', div: 'Central', city: 'North Bay', name: 'Battalion', bg: '#344A27', color: '#FFB81C', rival: 'SUD', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/OHL/North%20Bay%20Battalion/NBB_Primary_2013-Present.png' },
  { id: 'OSH', conf: 'East', div: 'East', city: 'Oshawa', name: 'Generals', bg: '#C8102E', color: '#00205B', rival: 'PBO', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/OHL/Oshawa%20Generals/OSH_Primary_2006-Present.png' },
  { id: 'OTT', conf: 'East', div: 'East', city: 'Ottawa', name: "67's", bg: '#000000', color: '#C8102E', rival: 'GAT', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/OHL/Ottawa%2067%27s/O67_Primary_2020-Present.png' },
  { id: 'OWS', conf: 'West', div: 'Midwest', city: 'Owen Sound', name: 'Attack', bg: '#C8102E', color: '#000000', rival: 'BAR', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/OHL/Owen%20Sound%20Attack/OSA__Primary_2011-Present.png' },
  { id: 'PBO', conf: 'East', div: 'East', city: 'Peterborough', name: 'Petes', bg: '#862633', color: '#FFFFFF', rival: 'OSH', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/OHL/Peterborough%20Petes/PET_Primary_2023-Present.png' },
  { id: 'SAG', conf: 'West', div: 'West', city: 'Saginaw', name: 'Spirit', bg: '#00205B', color: '#C8102E', rival: 'FLNT', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/OHL/Saginaw%20Spirit/SAG_Primary_2002-Present.png' },
  { id: 'SAR', conf: 'West', div: 'West', city: 'Sarnia', name: 'Sting', bg: '#000000', color: '#FFB81C', rival: 'WIN', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/OHL/Sarnia%20Sting/SAR_Primary_2019-Present.png' },
  { id: 'SSM', conf: 'West', div: 'West', city: 'Sault Ste. Marie', name: 'Greyhounds', bg: '#C8102E', color: '#FFFFFF', rival: 'SUD', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/OHL/Soo%20Greyhounds/SOO_Primary_2013-Present.png' },
  { id: 'SUD', conf: 'East', div: 'Central', city: 'Sudbury', name: 'Wolves', bg: '#00205B', color: '#FFFFFF', rival: 'NB', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/OHL/Sudbury%20Wolves/SUD_Primary_2009-Present.png' },
  { id: 'WIN', conf: 'West', div: 'West', city: 'Windsor', name: 'Spitfires', bg: '#00205B', color: '#C8102E', rival: 'SAR', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/OHL/Windsor%20Spitfires/WDR_Primary_2008-Present.png' }
];

// ==========================================
// 3. WHL TEAMS
// ==========================================
export const whlTeams = [
  { id: 'BDN', conf: 'East', div: 'East', city: 'Brandon', name: 'Wheat Kings', bg: '#000000', color: '#FDBB30', rival: 'REG', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/WHL/Brandon%20Wheat%20Kings/BWK_Primary_2022-Present.png' },
  { id: 'CGY', conf: 'East', div: 'Central', city: 'Calgary', name: 'Hitmen', bg: '#000000', color: '#E32636', rival: 'EDM', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/WHL/Calgary%20Hitmen/CGH_Primary_1998-Present.png' },
  { id: 'EDM', conf: 'East', div: 'Central', city: 'Edmonton', name: 'Oil Kings', bg: '#D31245', color: '#041E42', rival: 'CGY', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/WHL/Edmonton%20Oil%20Kings/EOK_Primary_2007-Present.png' },
  { id: 'EVT', conf: 'West', div: 'US', city: 'Everett', name: 'Silvertips', bg: '#00471B', color: '#8A8D8F', rival: 'SEA', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/WHL/Everett%20Silvertips/EVE_Primary_2018-Present.png' },
  { id: 'KAM', conf: 'West', div: 'BC', city: 'Kamloops', name: 'Blazers', bg: '#0033A0', color: '#E32636', rival: 'KEL', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/WHL/Kamloops%20Blazers/KAM_Primary_2015-Present.png' },
  { id: 'KEL', conf: 'West', div: 'BC', city: 'Kelowna', name: 'Rockets', bg: '#008394', color: '#C8102E', rival: 'KAM', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/WHL/Kelowna%20Rockets/KEL_Primary_2001-Present.png' },
  { id: 'LET', conf: 'East', div: 'Central', city: 'Lethbridge', name: 'Hurricanes', bg: '#041E42', color: '#C8102E', rival: 'MH', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/WHL/Lethbridge%20Hurricanes/LET_Primary_2013-Present.png' },
  { id: 'MED', conf: 'East', div: 'Central', city: 'Medicine Hat', name: 'Tigers', bg: '#F26522', color: '#000000', rival: 'LET', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/WHL/Medicine%20Hat%20Tigers/MED_Primary_2003-Presentpng.png' },
  { id: 'MJW', conf: 'East', div: 'East', city: 'Moose Jaw', name: 'Warriors', bg: '#000000', color: '#C8102E', rival: 'REG', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/WHL/Moose%20Jaw%20Warriors/MJW_Primary_2022-Present.png' },
  { id: 'POR', conf: 'West', div: 'US', city: 'Portland', name: 'Winterhawks', bg: '#C8102E', color: '#000000', rival: 'SEA', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/WHL/Portland%20Winterhawks/POR_Primary_2021-Present.png' },
  { id: 'PRA', conf: 'East', div: 'East', city: 'Prince Albert', name: 'Raiders', bg: '#00471B', color: '#FFB81C', rival: 'SAS', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/WHL/Prince%20Albert%20Raiders/PRA_Primary_2013-Present.png' },
  { id: 'PRG', conf: 'West', div: 'BC', city: 'Prince George', name: 'Cougars', bg: '#D31245', color: '#000000', rival: 'KAM', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/WHL/Prince%20George%20Cougars/PRG_Primary_2015-Present.png' },
  { id: 'RED', conf: 'East', div: 'Central', city: 'Red Deer', name: 'Rebels', bg: '#862633', color: '#000000', rival: 'EDM', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/WHL/Red%20Deer%20Rebels/RED_Primary_1997-Present.png' },
  { id: 'REG', conf: 'East', div: 'East', city: 'Regina', name: 'Pats', bg: '#041E42', color: '#C8102E', rival: 'MJ', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/WHL/Regina%20Pats/REG_Primary_2014-Present.png' },
  { id: 'SAS', conf: 'East', div: 'East', city: 'Saskatoon', name: 'Blades', bg: '#0033A0', color: '#FFB81C', rival: 'PA', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/WHL/Saskatoon%20Blades/SAS_Primary_2021-Present.png' },
  { id: 'SEA', conf: 'West', div: 'US', city: 'Seattle', name: 'Thunderbirds', bg: '#002855', color: '#8DC63F', rival: 'POR', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/WHL/Seattle%20Thunderbirds/STB_Primary_1997-Present.png' },
  { id: 'SPO', conf: 'West', div: 'US', city: 'Spokane', name: 'Chiefs', bg: '#C8102E', color: '#041E42', rival: 'TC', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/WHL/Spokane%20Chiefs/SPO_Primary_1990-Present.png' },
  { id: 'SCB', conf: 'East', div: 'East', city: 'Swift Current', name: 'Broncos', bg: '#00471B', color: '#0033A0', rival: 'MJ', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/WHL/Swift%20Current%20Broncos/SWI_Primary_2014-Present.png' },
  { id: 'TCA', conf: 'West', div: 'US', city: 'Tri-City', name: 'Americans', bg: '#041E42', color: '#C8102E', rival: 'SPO', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/WHL/Tri-City%20Americans/TRI_Primary_2008-Present.png' },
  { id: 'VAN', conf: 'West', div: 'BC', city: 'Vancouver', name: 'Giants', bg: '#000000', color: '#C8102E', rival: 'VIC', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/WHL/Vancouver%20Giants/VGS_Primary_2001-Present.png' },
  { id: 'VIC', conf: 'West', div: 'BC', city: 'Victoria', name: 'Royals', bg: '#00205B', color: '#C8102E', rival: 'VAN', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/WHL/Victoria%20Royals/VIC_Primary_2023-Present.png' },
  { id: 'WEN', conf: 'West', div: 'US', city: 'Wenatchee', name: 'Wild', bg: '#002855', color: '#54B948', rival: 'TC', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/WHL/Wenatchee%20Wild/WEW_Primary_2023-Present.png' }
];

// ==========================================
// 4. QMJHL TEAMS
// ==========================================
export const qmjhlTeams = [
  { id: 'BAT', div: 'East', city: 'Acadie-Bathurst', name: 'Titan', bg: '#862633', color: '#B3995D', rival: 'MON', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/QMJHL/Acadie%20Bathurst%20Titan/ACA_Primary_2014-2025.png' },
  { id: 'BAC', div: 'Central', city: 'Baie-Comeau', name: 'Drakkar', bg: '#C8102E', color: '#FFB81C', rival: 'RIM', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/QMJHL/Baie-Comeau%20Drakkar/BAC_Primary_1997-Present.png' },
  { id: 'BLA', div: 'West', city: 'Blainville-Boisbriand', name: 'Armada', bg: '#000000', color: '#FFFFFF', rival: 'GAT', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/QMJHL/Blainville-Boisbriand%20Armada/BBA_Primary_2011-Present.png' },
  { id: 'CBE', div: 'East', city: 'Cape Breton', name: 'Eagles', bg: '#000000', color: '#FFB81C', rival: 'HAL', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/QMJHL/Cape%20Breton%20Eagles/CAB_Primary_2019-Present.png' },
  { id: 'CHA', div: 'East', city: 'Charlottetown', name: 'Islanders', bg: '#000000', color: '#FFB81C', rival: 'MON', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/QMJHL/Charlottetown%20Islanders/CHA_Primary_2013-Present.png' },
  { id: 'CHI', div: 'Central', city: 'Chicoutimi', name: 'Saguenéens', bg: '#00205B', color: '#88D0F6', rival: 'QUE', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/QMJHL/Chicoutimi%20Saguen%C3%A9ens/CHS_Primary_1998-2022.png' },
  { id: 'DRU', div: 'West', city: 'Drummondville', name: 'Voltigeurs', bg: '#C8102E', color: '#000000', rival: 'SHA', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/QMJHL/Drummondville%20Voltigeurs/DRU_Primary_2008-Present.png' },
  { id: 'GAT', div: 'West', city: 'Gatineau', name: 'Olympiques', bg: '#000000', color: '#FFFFFF', rival: 'OTT', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/QMJHL/Gatineau%20Olympiques/GAT_Primary_2011-Present.png' },
  { id: 'HAL', div: 'East', city: 'Halifax', name: 'Mooseheads', bg: '#00471B', color: '#C8102E', rival: 'CBE', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/QMJHL/Halifax%20Mooseheads/HAL_Primary_2022-Present.png' },
  { id: 'MON', div: 'East', city: 'Moncton', name: 'Wildcats', bg: '#C8102E', color: '#041E42', rival: 'SJD', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/QMJHL/Moncton%20Wildcats/MON_Primary_2018-Present.png' },
  { id: 'QUE', div: 'Central', city: 'Quebec', name: 'Remparts', bg: '#C8102E', color: '#000000', rival: 'RIM', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/QMJHL/Qu%C3%A9bec%20Remparts/QUE_Primary_2013-Present.png' },
  { id: 'RIM', div: 'Central', city: 'Rimouski', name: 'Océanic', bg: '#00205B', color: '#FFFFFF', rival: 'QUE', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/QMJHL/Rimouski%20Oc%C3%A9anic/RIM_Primary_2013-Present.png' },
  { id: 'ROU', div: 'West', city: 'Rouyn-Noranda', name: 'Huskies', bg: '#C8102E', color: '#000000', rival: 'VDO', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/QMJHL/Rouyn-Noranda%20Huskies/RON_Primary_2006-Present.png' },
  { id: 'SJD', div: 'East', city: 'Saint John', name: 'Sea Dogs', bg: '#00205B', color: '#88D0F6', rival: 'MON', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/QMJHL/Saint%20John%20Sea%20Dogs/SJN_Primary_2025-Present.png' },
  { id: 'SHA', div: 'West', city: 'Shawinigan', name: 'Cataractes', bg: '#002855', color: '#FFB81C', rival: 'DRU', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/QMJHL/Shawinigan%20Cataractes/SHW_Primary_2008-Present.png' },
  { id: 'SHE', div: 'Central', city: 'Sherbrooke', name: 'Phoenix', bg: '#002855', color: '#88D0F6', rival: 'DRU', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/QMJHL/Sherbrooke%20Phoenix/SHB_Primary_2012-Present.png' },
  { id: 'VDO', div: 'West', city: 'Val-d\'Or', name: 'Foreurs', bg: '#00471B', color: '#FFB81C', rival: 'ROU', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/QMJHL/Val-dOr%20Foreurs/VAL_Primary_2011-Present.png' },
  { id: 'VIC', div: 'Central', city: 'Victoriaville', name: 'Tigres', bg: '#000000', color: '#FFB81C', rival: 'DRU', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/QMJHL/Victoriaville%20Tigres/VIC_Primary_1999-Present.png' }
];

// ==========================================
// 5. USHL TEAMS
// ==========================================
export const ushlTeams = [
  { id: 'CDR', conf: 'West', div: 'Western', city: 'Cedar Rapids', name: 'RoughRiders', bg: '#00205B', color: '#C8102E', rival: 'WAT', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/USHL/CDR_Primary_2013-Present.png' },
  { id: 'CHI', conf: 'East', div: 'Eastern', city: 'Chicago', name: 'Steel', bg: '#000000', color: '#54B948', rival: 'GB', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/USHL/CHI_Primary_2000-Present.png' },
  { id: 'DBQ', conf: 'East', div: 'Eastern', city: 'Dubuque', name: 'Fighting Saints', bg: '#862633', color: '#FFB81C', rival: 'CR', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/USHL/DBQ_Primary_2010-Present.png' },
  { id: 'GBG', conf: 'East', div: 'Eastern', city: 'Green Bay', name: 'Gamblers', bg: '#00471B', color: '#FFB81C', rival: 'CHI', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/USHL/GBG_Primary_2008-Present.png' },
  { id: 'MDS', conf: 'East', div: 'Eastern', city: 'Madison', name: 'Capitols', bg: '#041E42', color: '#C8102E', rival: 'GB', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/USHL/MDS_Primary_2014-Present.png' },
  { id: 'MSK', conf: 'East', div: 'Eastern', city: 'Muskegon', name: 'Lumberjacks', bg: '#00205B', color: '#FFB81C', rival: 'YNG', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/USHL/MSK_Primary_2012-Present.png' },
  { id: 'NTDP', conf: 'East', div: 'Eastern', city: 'USA', name: 'NTDP', bg: '#041E42', color: '#C8102E', rival: 'CHI', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/USHL/USD_Primary_2015-Present.png' },
  { id: 'YTP', conf: 'East', div: 'Eastern', city: 'Youngstown', name: 'Phantoms', bg: '#000000', color: '#C8102E', rival: 'MUS', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/USHL/YTP_Primary_2014-Present.png' },
  { id: 'DMB', conf: 'West', div: 'Western', city: 'Des Moines', name: 'Buccaneers', bg: '#00471B', color: '#C8102E', rival: 'OMA', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/USHL/DMB_Primary_2011-Present.png' },
  { id: 'FRG', conf: 'West', div: 'Western', city: 'Fargo', name: 'Force', bg: '#00205B', color: '#54B948', rival: 'SF', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/USHL/FRG_Primary_2009-Present.png' },
  { id: 'LNC', conf: 'West', div: 'Western', city: 'Lincoln', name: 'Stars', bg: '#000000', color: '#C8102E', rival: 'OMA', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/USHL/LNC_Primary_1996-Present.png' },
  { id: 'OMH', conf: 'West', div: 'Western', city: 'Omaha', name: 'Lancers', bg: '#00205B', color: '#F26522', rival: 'LIN', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/USHL/OMH_Primary_2009-Present.png' },
  { id: 'SCM', conf: 'West', div: 'Western', city: 'Sioux City', name: 'Musketeers', bg: '#00471B', color: '#FFB81C', rival: 'SF', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/USHL/SCM_Primary_2010-Present.png' },
  { id: 'SFS', conf: 'West', div: 'Western', city: 'Sioux Falls', name: 'Stampede', bg: '#00205B', color: '#FFB81C', rival: 'SC', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/USHL/SFS_Primary_1999-Present.png' },
  { id: 'TCS', conf: 'West', div: 'Western', city: 'Tri-City', name: 'Storm', bg: '#002855', color: '#8DC63F', rival: 'OMA', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/USHL/TCS_Primary_2013-Present.png' },
  { id: 'WAT', conf: 'East', div: 'Eastern', city: 'Waterloo', name: 'Black Hawks', bg: '#000000', color: '#C8102E', rival: 'CR', logo: 'https://raw.githubusercontent.com/kohtij/HockeyTeamLogos/main/USHL/WBH_Primary_2014-Present.png' }
];

// ==========================================
// 6. AHL TEAMS
// ==========================================
export const ahlTeams = [
  { id: 'PRO', conf: 'East', div: 'Atlantic', city: 'Providence', name: 'Bruins', bg: '#000000', color: '#FFB81C', rival: 'HFD', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/04/Providence_Bruins_logo.svg/250px-Providence_Bruins_logo.svg.png' },
  { id: 'ROC', conf: 'East', div: 'North', city: 'Rochester', name: 'Americans', bg: '#00205B', color: '#C8102E', rival: 'SYR', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/1a/Rochester_Americans_logo.svg/250px-Rochester_Americans_logo.svg.png' },
  { id: 'GR', conf: 'West', div: 'Central', city: 'Grand Rapids', name: 'Griffins', bg: '#000000', color: '#B3995D', rival: 'MIL', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/2/23/Grand_Rapids_Griffins_logo.svg/250px-Grand_Rapids_Griffins_logo.svg.png' },
  { id: 'HER', conf: 'East', div: 'Atlantic', city: 'Hershey', name: 'Bears', bg: '#3B2314', color: '#C5B358', rival: 'WBS', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f9/Hershey_Bears_logo.svg/250px-Hershey_Bears_logo.svg.png' },
  { id: 'WBS', conf: 'East', div: 'Atlantic', city: 'Wilkes-Barre/Scranton', name: 'Penguins', bg: '#000000', color: '#FFB81C', rival: 'HER', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/3/30/WBS_Penguins_logo.svg/250px-WBS_Penguins_logo.svg.png' },
  { id: 'SYR', conf: 'East', div: 'North', city: 'Syracuse', name: 'Crunch', bg: '#00205B', color: '#88D0F6', rival: 'ROC', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/17/Syracuse_Crunch_logo.svg/250px-Syracuse_Crunch_logo.svg.png' },
  { id: 'CLE', conf: 'East', div: 'North', city: 'Cleveland', name: 'Monsters', bg: '#000000', color: '#002D62', rival: 'GR', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/3/31/Cleveland_Monsters_logo.svg/250px-Cleveland_Monsters_logo.svg.png' },
  { id: 'MIL', conf: 'West', div: 'Central', city: 'Milwaukee', name: 'Admirals', bg: '#00205B', color: '#88D0F6', rival: 'CHI_AHL', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/7/77/Milwaukee_Admirals_logo.svg/250px-Milwaukee_Admirals_logo.svg.png' },
  { id: 'CHI_AHL', conf: 'West', div: 'Central', city: 'Chicago', name: 'Wolves', bg: '#000000', color: '#FFB81C', rival: 'MIL', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/6/62/Chicago_Wolves_logo.svg/250px-Chicago_Wolves_logo.svg.png' },
  { id: 'TEX', conf: 'West', div: 'Central', city: 'Texas', name: 'Stars', bg: '#006847', color: '#8F8F8C', rival: 'BAK', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/5f/Texas_Stars_logo.svg/250px-Texas_Stars_logo.svg.png' },
  { id: 'BAK', conf: 'West', div: 'Pacific', city: 'Bakersfield', name: 'Condors', bg: '#00205B', color: '#F26522', rival: 'ONT', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/1b/Bakersfield_Condors_logo.svg/250px-Bakersfield_Condors_logo.svg.png' },
  { id: 'ONT', conf: 'West', div: 'Pacific', city: 'Ontario', name: 'Reign', bg: '#000000', color: '#A2AAAD', rival: 'SD', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/3/39/Ontario_Reign_logo.svg/250px-Ontario_Reign_logo.svg.png' },
  { id: 'SD', conf: 'West', div: 'Pacific', city: 'San Diego', name: 'Gulls', bg: '#F47A38', color: '#00205B', rival: 'ONT', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/eb/San_Diego_Gulls_logo.svg/250px-San_Diego_Gulls_logo.svg.png' },
  { id: 'CV', conf: 'West', div: 'Pacific', city: 'Coachella Valley', name: 'Firebirds', bg: '#001628', color: '#FF4C00', rival: 'SD', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/1a/Coachella_Valley_Firebirds_logo.svg/250px-Coachella_Valley_Firebirds_logo.svg.png' },
  { id: 'ABB', conf: 'West', div: 'Pacific', city: 'Abbotsford', name: 'Canucks', bg: '#00205B', color: '#00843D', rival: 'CGY_AHL', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e0/Abbotsford_Canucks_logo.svg/250px-Abbotsford_Canucks_logo.svg.png' },
  { id: 'CGY_AHL', conf: 'West', div: 'Pacific', city: 'Calgary', name: 'Wranglers', bg: '#C8102E', color: '#F15A24', rival: 'ABB', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/4c/Calgary_Wranglers_logo.svg/250px-Calgary_Wranglers_logo.svg.png' },
  { id: 'BRI', conf: 'East', div: 'Atlantic', city: 'Bridgeport', name: 'Islanders', bg: '#00539B', color: '#F47D30', rival: 'HFD', logo: '' },
  { id: 'CLT', conf: 'East', div: 'Atlantic', city: 'Charlotte', name: 'Checkers', bg: '#000000', color: '#C8102E', rival: 'HER', logo: '' },
  { id: 'HFD', conf: 'East', div: 'Atlantic', city: 'Hartford', name: 'Wolf Pack', bg: '#C8102E', color: '#0038A8', rival: 'BRI', logo: '' },
  { id: 'LVP', conf: 'East', div: 'Atlantic', city: 'Lehigh Valley', name: 'Phantoms', bg: '#000000', color: '#F26522', rival: 'WBS', logo: '' },
  { id: 'SPR', conf: 'East', div: 'Atlantic', city: 'Springfield', name: 'Thunderbirds', bg: '#002F87', color: '#FCB514', rival: 'HER', logo: '' },
  { id: 'BEL', conf: 'East', div: 'North', city: 'Belleville', name: 'Senators', bg: '#C8102E', color: '#000000', rival: 'TOR_AHL', logo: '' },
  { id: 'LAV', conf: 'East', div: 'North', city: 'Laval', name: 'Rocket', bg: '#003C71', color: '#FFFFFF', rival: 'SYR', logo: '' },
  { id: 'TOR_AHL', conf: 'East', div: 'North', city: 'Toronto', name: 'Marlies', bg: '#00205B', color: '#FFFFFF', rival: 'BEL', logo: '' },
  { id: 'UTI', conf: 'East', div: 'North', city: 'Utica', name: 'Comets', bg: '#CE1126', color: '#000000', rival: 'SYR', logo: '' },
  { id: 'IA', conf: 'West', div: 'Central', city: 'Iowa', name: 'Wild', bg: '#154734', color: '#A6192E', rival: 'MIL', logo: '' },
  { id: 'MB', conf: 'West', div: 'Central', city: 'Manitoba', name: 'Moose', bg: '#041E42', color: '#A2AAAD', rival: 'IA', logo: '' },
  { id: 'RFD', conf: 'West', div: 'Central', city: 'Rockford', name: 'IceHogs', bg: '#000000', color: '#CF0A2C', rival: 'MIL', logo: '' },
  { id: 'COL_AHL', conf: 'West', div: 'Pacific', city: 'Colorado', name: 'Eagles', bg: '#6F263D', color: '#A2AAAD', rival: 'TUC', logo: '' },
  { id: 'HSK', conf: 'West', div: 'Pacific', city: 'Henderson', name: 'Silver Knights', bg: '#333F48', color: '#B3A369', rival: 'COL_AHL', logo: '' },
  { id: 'SJS_AHL', conf: 'West', div: 'Pacific', city: 'San Jose', name: 'Barracuda', bg: '#006D75', color: '#EA6D13', rival: 'ONT', logo: '' },
  { id: 'TUC', conf: 'West', div: 'Pacific', city: 'Tucson', name: 'Roadrunners', bg: '#010101', color: '#C8102E', rival: 'COL_AHL', logo: '' }
];

// ==========================================
// 7. NCAA TEAMS (60+ D1 Programs)
// ==========================================
export const ncaaTeams = [
  // Hockey East
  { id: 'BC', ncaaConf: 'Hockey East', name: 'Boston College Eagles', bg: '#862633', color: '#BC9B6A', rival: 'BU', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d6/Boston_College_Eagles_logo.svg/250px-Boston_College_Eagles_logo.svg.png' },
  { id: 'BU', ncaaConf: 'Hockey East', name: 'Boston University Terriers', bg: '#CC0000', color: '#FFFFFF', rival: 'BC', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/15/Boston_University_Athletics_logo.svg/250px-Boston_University_Athletics_logo.svg.png' },
  { id: 'UCONN', ncaaConf: 'Hockey East', name: 'UConn Huskies', bg: '#000E2F', color: '#FFFFFF', rival: 'UMASS', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/b/b0/Connecticut_Huskies_logo.svg/250px-Connecticut_Huskies_logo.svg.png' },
  { id: 'MAINE', ncaaConf: 'Hockey East', name: 'Maine Black Bears', bg: '#003263', color: '#B0D7FF', rival: 'UNH', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/0c/Maine_Black_Bears_logo.svg/250px-Maine_Black_Bears_logo.svg.png' },
  { id: 'UMASS', ncaaConf: 'Hockey East', name: 'UMass Minutemen', bg: '#881C1C', color: '#FFFFFF', rival: 'UML', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/UMass_Amherst_Athletics_logo.svg/250px-UMass_Amherst_Athletics_logo.svg.png' },
  { id: 'UML', ncaaConf: 'Hockey East', name: 'UMass Lowell River Hawks', bg: '#003E7E', color: '#C8102E', rival: 'UMASS', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/ef/UMass_Lowell_River_Hawks_logo.svg/250px-UMass_Lowell_River_Hawks_logo.svg.png' },
  { id: 'MER', ncaaConf: 'Hockey East', name: 'Merrimack Warriors', bg: '#002855', color: '#F3A900', rival: 'UML', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e4/Merrimack_Warriors_logo.svg/250px-Merrimack_Warriors_logo.svg.png' },
  { id: 'UNH', ncaaConf: 'Hockey East', name: 'New Hampshire Wildcats', bg: '#041E42', color: '#FFFFFF', rival: 'MAINE', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/c/c5/New_Hampshire_Wildcats_logo.svg/250px-New_Hampshire_Wildcats_logo.svg.png' },
  { id: 'NU', ncaaConf: 'Hockey East', name: 'Northeastern Huskies', bg: '#CC0000', color: '#000000', rival: 'BU', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Northeastern_Huskies_logo.svg/250px-Northeastern_Huskies_logo.svg.png' },
  { id: 'PROV', ncaaConf: 'Hockey East', name: 'Providence Friars', bg: '#000000', color: '#FFFFFF', rival: 'BC', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Providence_Friars_logo.svg/250px-Providence_Friars_logo.svg.png' },
  { id: 'UVM', ncaaConf: 'Hockey East', name: 'Vermont Catamounts', bg: '#005710', color: '#FFC72C', rival: 'UNH', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/3/30/Vermont_Catamounts_logo.svg/250px-Vermont_Catamounts_logo.svg.png' },

  // Big Ten
  { id: 'UMICH', ncaaConf: 'Big Ten', name: 'Michigan Wolverines', bg: '#00274C', color: '#FFCB05', rival: 'MSU', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f8/Michigan_Wolverines_logo.svg/250px-Michigan_Wolverines_logo.svg.png' },
  { id: 'MSU', ncaaConf: 'Big Ten', name: 'Michigan State Spartans', bg: '#18453B', color: '#FFFFFF', rival: 'UMICH', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a7/Michigan_State_Athletics_logo.svg/250px-Michigan_State_Athletics_logo.svg.png' },
  { id: 'MINN', ncaaConf: 'Big Ten', name: 'Minnesota Golden Gophers', bg: '#7A0019', color: '#FFCC33', rival: 'WIS', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Minnesota_Golden_Gophers_logo.svg/250px-Minnesota_Golden_Gophers_logo.svg.png' },
  { id: 'ND', ncaaConf: 'Big Ten', name: 'Notre Dame Fighting Irish', bg: '#0C2340', color: '#C99700', rival: 'UMICH', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/2/23/Notre_Dame_Fighting_Irish_logo.svg/250px-Notre_Dame_Fighting_Irish_logo.svg.png' },
  { id: 'OSU', ncaaConf: 'Big Ten', name: 'Ohio State Buckeyes', bg: '#CE1126', color: '#666666', rival: 'UMICH', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Ohio_State_Buckeyes_logo.svg/250px-Ohio_State_Buckeyes_logo.svg.png' },
  { id: 'PSU', ncaaConf: 'Big Ten', name: 'Penn State Nittany Lions', bg: '#041E42', color: '#FFFFFF', rival: 'OSU', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/3/3a/Penn_State_Nittany_Lions_logo.svg/250px-Penn_State_Nittany_Lions_logo.svg.png' },
  { id: 'WIS', ncaaConf: 'Big Ten', name: 'Wisconsin Badgers', bg: '#C5050C', color: '#FFFFFF', rival: 'MINN', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Wisconsin_Badgers_logo.svg/250px-Wisconsin_Badgers_logo.svg.png' },

  // NCHC
  { id: 'CC', ncaaConf: 'NCHC', name: 'Colorado College Tigers', bg: '#000000', color: '#F3A900', rival: 'DU', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a8/Colorado_College_Tigers_logo.svg/250px-Colorado_College_Tigers_logo.svg.png' },
  { id: 'DU', ncaaConf: 'NCHC', name: 'Denver Pioneers', bg: '#8B2332', color: '#8B6F4E', rival: 'CC', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/7/77/Denver_Pioneers_logo.svg/250px-Denver_Pioneers_logo.svg.png' },
  { id: 'MIA', ncaaConf: 'NCHC', name: 'Miami RedHawks', bg: '#B61E2E', color: '#000000', rival: 'WMU', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/14/Miami_RedHawks_logo.svg/250px-Miami_RedHawks_logo.svg.png' },
  { id: 'UMD', ncaaConf: 'NCHC', name: 'Minnesota Duluth Bulldogs', bg: '#7A0019', color: '#FFCC33', rival: 'MINN', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d7/Minnesota_Duluth_Bulldogs_logo.svg/250px-Minnesota_Duluth_Bulldogs_logo.svg.png' },
  { id: 'UND', ncaaConf: 'NCHC', name: 'North Dakota Fighting Hawks', bg: '#009A44', color: '#000000', rival: 'MINN', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/4b/North_Dakota_Fighting_Hawks_logo.svg/250px-North_Dakota_Fighting_Hawks_logo.svg.png' },
  { id: 'OMA', ncaaConf: 'NCHC', name: 'Omaha Mavericks', bg: '#000000', color: '#D71920', rival: 'UND', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/7/7c/Omaha_Mavericks_logo.svg/250px-Omaha_Mavericks_logo.svg.png' },
  { id: 'SCSU', ncaaConf: 'NCHC', name: 'St. Cloud State Huskies', bg: '#A10214', color: '#000000', rival: 'UMD', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/3/36/St._Cloud_State_Huskies_logo.svg/250px-St._Cloud_State_Huskies_logo.svg.png' },
  { id: 'WMU', ncaaConf: 'NCHC', name: 'Western Michigan Broncos', bg: '#532E1C', color: '#F1B82D', rival: 'MIA', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/8/87/Western_Michigan_Broncos_logo.svg/250px-Western_Michigan_Broncos_logo.svg.png' },

  // ECAC
  { id: 'BRN', ncaaConf: 'ECAC', name: 'Brown Bears', bg: '#4E3629', color: '#C00404', rival: 'YALE', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/07/Brown_Bears_logo.svg/250px-Brown_Bears_logo.svg.png' },
  { id: 'CLK', ncaaConf: 'ECAC', name: 'Clarkson Golden Knights', bg: '#00553F', color: '#FFD204', rival: 'SLU', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/6/61/Clarkson_Golden_Knights_logo.svg/250px-Clarkson_Golden_Knights_logo.svg.png' },
  { id: 'COLG', ncaaConf: 'ECAC', name: 'Colgate Raiders', bg: '#821019', color: '#FFFFFF', rival: 'COR', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Colgate_Raiders_logo.svg/250px-Colgate_Raiders_logo.svg.png' },
  { id: 'COR', ncaaConf: 'ECAC', name: 'Cornell Big Red', bg: '#B31B1B', color: '#FFFFFF', rival: 'HAR', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Cornell_University_identity_mark.svg/250px-Cornell_University_identity_mark.svg.png' },
  { id: 'DAR', ncaaConf: 'ECAC', name: 'Dartmouth Big Green', bg: '#00693E', color: '#FFFFFF', rival: 'HAR', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Dartmouth_Big_Green_logo.svg/250px-Dartmouth_Big_Green_logo.svg.png' },
  { id: 'HAR', ncaaConf: 'ECAC', name: 'Harvard Crimson', bg: '#A51C30', color: '#FFFFFF', rival: 'YALE', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Harvard_Crimson_logo.svg/250px-Harvard_Crimson_logo.svg.png' },
  { id: 'PRI', ncaaConf: 'ECAC', name: 'Princeton Tigers', bg: '#FF6000', color: '#000000', rival: 'COR', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Princeton_Tigers_logo.svg/250px-Princeton_Tigers_logo.svg.png' },
  { id: 'QU', ncaaConf: 'ECAC', name: 'Quinnipiac Bobcats', bg: '#0A2240', color: '#EAAA00', rival: 'YALE', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/18/Quinnipiac_Bobcats_logo.svg/250px-Quinnipiac_Bobcats_logo.svg.png' },
  { id: 'RPI', ncaaConf: 'ECAC', name: 'RPI Engineers', bg: '#E2231A', color: '#000000', rival: 'UNI', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/RPI_Engineers_logo.svg/250px-RPI_Engineers_logo.svg.png' },
  { id: 'SLU', ncaaConf: 'ECAC', name: 'St. Lawrence Saints', bg: '#AF1E2D', color: '#41273B', rival: 'CLK', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/52/St._Lawrence_Saints_logo.svg/250px-St._Lawrence_Saints_logo.svg.png' },
  { id: 'UNI', ncaaConf: 'ECAC', name: 'Union Garnet Chargers', bg: '#822433', color: '#FFFFFF', rival: 'RPI', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/3/30/Union_Garnet_Chargers_logo.svg/250px-Union_Garnet_Chargers_logo.svg.png' },
  { id: 'YALE', ncaaConf: 'ECAC', name: 'Yale Bulldogs', bg: '#0F4D92', color: '#FFFFFF', rival: 'HAR', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Yale_Bulldogs_logo.svg/250px-Yale_Bulldogs_logo.svg.png' },

  // CCHA
  { id: 'AUG', ncaaConf: 'CCHA', name: 'Augustana Vikings', bg: '#002D62', color: '#FFC72C', rival: 'BSU', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/c/cd/Augustana_Vikings_logo.svg/250px-Augustana_Vikings_logo.svg.png' },
  { id: 'BSU', ncaaConf: 'CCHA', name: 'Bemidji State Beavers', bg: '#004D44', color: '#FFFFFF', rival: 'MSU', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/5a/Bemidji_State_Beavers_logo.svg/250px-Bemidji_State_Beavers_logo.svg.png' },
  { id: 'BGSU', ncaaConf: 'CCHA', name: 'Bowling Green Falcons', bg: '#4F2C1D', color: '#FF7300', rival: 'TOL', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/3/34/Bowling_Green_Falcons_logo.svg/250px-Bowling_Green_Falcons_logo.svg.png' },
  { id: 'FSU', ncaaConf: 'CCHA', name: 'Ferris State Bulldogs', bg: '#BA0C2F', color: '#FFD100', rival: 'LSSU', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/9/91/Ferris_State_Bulldogs_logo.svg/250px-Ferris_State_Bulldogs_logo.svg.png' },
  { id: 'LSSU', ncaaConf: 'CCHA', name: 'Lake Superior State Lakers', bg: '#003F87', color: '#FFC61E', rival: 'MTU', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/8/87/Lake_Superior_State_Lakers_logo.png/250px-Lake_Superior_State_Lakers_logo.png' },
  { id: 'MTU', ncaaConf: 'CCHA', name: 'Michigan Tech Huskies', bg: '#000000', color: '#FFCD00', rival: 'NMU', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/1a/Michigan_Tech_Huskies_logo.svg/250px-Michigan_Tech_Huskies_logo.svg.png' },
  { id: 'MSUM', ncaaConf: 'CCHA', name: 'Minnesota State Mavericks', bg: '#480059', color: '#F1E6B2', rival: 'BSU', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e0/Minnesota_State_Mavericks_logo.svg/250px-Minnesota_State_Mavericks_logo.svg.png' },
  { id: 'NMU', ncaaConf: 'CCHA', name: 'Northern Michigan Wildcats', bg: '#005A3B', color: '#FFC72A', rival: 'MTU', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/10/Northern_Michigan_Wildcats_logo.svg/250px-Northern_Michigan_Wildcats_logo.svg.png' },
  { id: 'STT', ncaaConf: 'CCHA', name: 'St. Thomas Tommies', bg: '#500000', color: '#999999', rival: 'MSUM', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/3/35/St._Thomas_Tommies_logo.svg/250px-St._Thomas_Tommies_logo.svg.png' },

  // Atlantic Hockey
  { id: 'AFA', ncaaConf: 'Atlantic Hockey America', name: 'Air Force Falcons', bg: '#003087', color: '#8A8D8F', rival: 'ARMY', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/ed/Air_Force_Falcons_logo.svg/250px-Air_Force_Falcons_logo.svg.png' },
  { id: 'AIC', ncaaConf: 'Atlantic Hockey America', name: 'AIC Yellow Jackets', bg: '#000000', color: '#F2A900', rival: 'HC', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/9/91/American_International_Yellow_Jackets_logo.svg/250px-American_International_Yellow_Jackets_logo.svg.png' },
  { id: 'ARMY', ncaaConf: 'Atlantic Hockey America', name: 'Army Black Knights', bg: '#000000', color: '#D4BF91', rival: 'AFA', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Army_Black_Knights_logo.svg/250px-Army_Black_Knights_logo.svg.png' },
  { id: 'BEN', ncaaConf: 'Atlantic Hockey America', name: 'Bentley Falcons', bg: '#005A8B', color: '#FFFFFF', rival: 'HC', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/Bentley_Falcons_logo.svg/250px-Bentley_Falcons_logo.svg.png' },
  { id: 'CAN', ncaaConf: 'Atlantic Hockey America', name: 'Canisius Golden Griffins', bg: '#00274C', color: '#F2A900', rival: 'NIA', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/6/60/Canisius_Golden_Griffins_logo.svg/250px-Canisius_Golden_Griffins_logo.svg.png' },
  { id: 'HC', ncaaConf: 'Atlantic Hockey America', name: 'Holy Cross Crusaders', bg: '#602D89', color: '#FFFFFF', rival: 'BEN', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/2/2a/Holy_Cross_Crusaders_logo.svg/250px-Holy_Cross_Crusaders_logo.svg.png' },
  { id: 'MERC', ncaaConf: 'Atlantic Hockey America', name: 'Mercyhurst Lakers', bg: '#005A3B', color: '#FFFFFF', rival: 'CAN', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/10/Mercyhurst_Lakers_logo.svg/250px-Mercyhurst_Lakers_logo.svg.png' },
  { id: 'NIAE', ncaaConf: 'Atlantic Hockey America', name: 'Niagara Purple Eagles', bg: '#582C83', color: '#FFFFFF', rival: 'CAN', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/Niagara_Purple_Eagles_logo.svg/250px-Niagara_Purple_Eagles_logo.svg.png' },
  { id: 'RIT', ncaaConf: 'Atlantic Hockey America', name: 'RIT Tigers', bg: '#F36E21', color: '#000000', rival: 'NIAE', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e0/RIT_Tigers_logo.svg/250px-RIT_Tigers_logo.svg.png' },
  { id: 'RMU', ncaaConf: 'Atlantic Hockey America', name: 'Robert Morris Colonials', bg: '#001E41', color: '#AA182C', rival: 'MERC', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/1a/Robert_Morris_Colonials_logo.svg/250px-Robert_Morris_Colonials_logo.svg.png' },
  { id: 'SHU', ncaaConf: 'Atlantic Hockey America', name: 'Sacred Heart Pioneers', bg: '#C8102E', color: '#C1C6C8', rival: 'QU', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/8/87/Sacred_Heart_Pioneers_logo.svg/250px-Sacred_Heart_Pioneers_logo.svg.png' },

  // Independents
  { id: 'UAF', ncaaConf: 'Independent', name: 'Alaska Nanooks', bg: '#0047AB', color: '#F3D54E', rival: 'UAA', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/6/6b/Alaska_Nanooks_logo.svg/250px-Alaska_Nanooks_logo.svg.png' },
  { id: 'UAA', ncaaConf: 'Independent', name: 'Alaska Anchorage Seawolves', bg: '#00583D', color: '#FFC425', rival: 'UAF', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/13/Alaska_Anchorage_Seawolves_logo.svg/250px-Alaska_Anchorage_Seawolves_logo.svg.png' },
  { id: 'LIND', ncaaConf: 'Independent', name: 'Lindenwood Lions', bg: '#000000', color: '#B5A36A', rival: 'SHU', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/4b/Lindenwood_Lions_logo.svg/250px-Lindenwood_Lions_logo.svg.png' },
  { id: 'STO', ncaaConf: 'Independent', name: 'Stonehill Skyhawks', bg: '#4B2682', color: '#FFFFFF', rival: 'MERC', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/6/6d/Stonehill_Skyhawks_logo.svg/250px-Stonehill_Skyhawks_logo.svg.png' }
];

// ==========================================
// 8. SHL TEAMS (SWEDEN)
// ==========================================
export const shlTeams = [
  { id: 'LHF', city: 'Luleå', name: 'HF', bg: '#C8102E', color: '#FFB81C', rival: 'SAIK', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/3/30/Lulea_HF_logo.svg/250px-Lulea_HF_logo.svg.png' },
  { id: 'SAIK', city: 'Skellefteå', name: 'AIK', bg: '#000000', color: '#FFB81C', rival: 'LHF', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/4b/Skelleftea_AIK_logo.svg/250px-Skelleftea_AIK_logo.svg.png' },
  { id: 'FBK', city: 'Färjestad', name: 'BK', bg: '#00471B', color: '#FFB81C', rival: 'FHC', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/7/7b/Farjestad_BK_logo.svg/250px-Farjestad_BK_logo.svg.png' },
  { id: 'FHC', city: 'Frölunda', name: 'HC', bg: '#C8102E', color: '#00471B', rival: 'FBK', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/8/82/Frolunda_HC_logo.svg/250px-Frolunda_HC_logo.svg.png' },
  { id: 'VHK', city: 'Växjö', name: 'Lakers', bg: '#00205B', color: '#F26522', rival: 'RBK', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/52/Vaxjo_Lakers_logo.svg/250px-Vaxjo_Lakers_logo.svg.png' },
  { id: 'RBK', city: 'Rögle', name: 'BK', bg: '#00471B', color: '#FFFFFF', rival: 'MIF', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/2/2f/Rogle_BK_logo.svg/250px-Rogle_BK_logo.svg.png' },
  { id: 'LIF', city: 'Leksands', name: 'IF', bg: '#00205B', color: '#FFFFFF', rival: 'MIF', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/Leksands_IF_logo.svg/250px-Leksands_IF_logo.svg.png' },
  { id: 'MIF', city: 'Malmö', name: 'Redhawks', bg: '#000000', color: '#C8102E', rival: 'RBK', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/2/2a/Malmo_Redhawks_logo.svg/250px-Malmo_Redhawks_logo.svg.png' },
  { id: 'LHC', city: 'Linköping', name: 'HC', bg: '#00205B', color: '#C8102E', rival: 'HV71', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f6/Linkoping_HC_logo.svg/250px-Linkoping_HC_logo.svg.png' },
  { id: 'OHK', city: 'Örebro', name: 'HK', bg: '#C8102E', color: '#000000', rival: 'TIK', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e0/Orebro_HK_logo.svg/250px-Orebro_HK_logo.svg.png' },
  { id: 'TIK', city: 'Timrå', name: 'IK', bg: '#C8102E', color: '#FFFFFF', rival: 'OHK', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/1a/Timra_IK_logo.svg/250px-Timra_IK_logo.svg.png' },
  { id: 'HV71', city: 'HV71', name: 'Jönköping', bg: '#00205B', color: '#FFB81C', rival: 'LHC', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/HV71_logo.svg/250px-HV71_logo.svg.png' },
  { id: 'BIF', city: 'Brynäs', name: 'IF', bg: '#000000', color: '#C8102E', rival: 'LIF', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/3/30/Brynas_IF_logo.svg/250px-Brynas_IF_logo.svg.png' },
  { id: 'MODO', city: 'MoDo', name: 'Hockey', bg: '#C8102E', color: '#00471B', rival: 'SAIK', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d4/Modo_Hockey_logo.svg/250px-Modo_Hockey_logo.svg.png' }
];

// ==========================================
// 9. LIIGA TEAMS (FINLAND)
// ==========================================
export const liigaTeams = [
  { id: 'TAP', city: 'Tappara', name: 'Tampere', bg: '#00205B', color: '#F26522', rival: 'ILK', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e0/Tappara_logo.svg/250px-Tappara_logo.svg.png' },
  { id: 'ILK', city: 'Ilves', name: 'Tampere', bg: '#00471B', color: '#FFB81C', rival: 'TAP', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/1a/Tampereen_Ilves_logo.svg/250px-Tampereen_Ilves_logo.svg.png' },
  { id: 'HIFK', city: 'HIFK', name: 'Helsinki', bg: '#C8102E', color: '#00205B', rival: 'TPS', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/b/be/HIFK_Hockey_logo.svg/250px-HIFK_Hockey_logo.svg.png' },
  { id: 'KAR', city: 'Kärpät', name: 'Oulu', bg: '#000000', color: '#FFB81C', rival: 'TAP', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/9/9f/Oulun_Karpat_logo.svg/250px-Oulun_Karpat_logo.svg.png' },
  { id: 'TPS', city: 'TPS', name: 'Turku', bg: '#000000', color: '#FFFFFF', rival: 'HIFK', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/3/30/Turun_Palloseura_logo.svg/250px-Turun_Palloseura_logo.svg.png' },
  { id: 'LUK', city: 'Lukko', name: 'Rauma', bg: '#00205B', color: '#FFB81C', rival: 'TPS', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/14/Rauman_Lukko_logo.svg/250px-Rauman_Lukko_logo.svg.png' },
  { id: 'KAL', city: 'KalPa', name: 'Kuopio', bg: '#FFB81C', color: '#000000', rival: 'JYP', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/d/df/KalPa_logo.svg/250px-KalPa_logo.svg.png' },
  { id: 'PEL', city: 'Pelicans', name: 'Lahti', bg: '#00205B', color: '#F26522', rival: 'HIFK', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f6/Lahden_Pelicans_logo.svg/250px-Lahden_Pelicans_logo.svg.png' },
  { id: 'KOO', city: 'KooKoo', name: 'Kouvola', bg: '#000000', color: '#F26522', rival: 'PEL', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/6/6f/KooKoo_logo.svg/250px-KooKoo_logo.svg.png' },
  { id: 'HPK', city: 'HPK', name: 'Hämeenlinna', bg: '#F26522', color: '#00205B', rival: 'TAP', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/5f/HPK_logo.svg/250px-HPK_logo.svg.png' },
  { id: 'JYP', city: 'JYP', name: 'Jyväskylä', bg: '#C8102E', color: '#000000', rival: 'KAL', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a2/JYP_Jyv%C3%A4skyl%C3%A4_logo.svg/250px-JYP_Jyv%C3%A4skyl%C3%A4_logo.svg.png' },
  { id: 'SAI', city: 'SaiPa', name: 'Lappeenranta', bg: '#FFB81C', color: '#000000', rival: 'KOO', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/1f/SaiPa_logo.svg/250px-SaiPa_logo.svg.png' },
  { id: 'JUK', city: 'Jukurit', name: 'Mikkeli', bg: '#00205B', color: '#FFB81C', rival: 'KAL', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/9/91/Mikkelin_Jukurit_logo.svg/250px-Mikkelin_Jukurit_logo.svg.png' },
  { id: 'SPO', city: 'Sport', name: 'Vaasa', bg: '#C8102E', color: '#FFB81C', rival: 'KAR', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/2/2f/Vaasan_Sport_logo.svg/250px-Vaasan_Sport_logo.svg.png' },
  { id: 'AKH', city: 'Kiekko-Espoo', name: 'Espoo', bg: '#00205B', color: '#FFB81C', rival: 'HIFK', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/7/7b/Kiekko-Espoo_logo.svg/250px-Kiekko-Espoo_logo.svg.png' }
];

// ==========================================
// HELPER FUNCTIONS
// ==========================================
export const euroTeams = [...shlTeams, ...liigaTeams];

export const getTeamData = (teamId, league) => {
  if (!teamId) return null;
  const pool = getOpponentPool(league);
  return pool.find(t => t.id === teamId) || { id: teamId, name: teamId, bg: '#101410', color: '#FFFFFF' };
};

export const getOpponentPool = (league) => {
  switch (league) {
    case 'NHL': return nhlTeams;
    case 'AHL': return ahlTeams;
    case 'OHL': return ohlTeams;
    case 'WHL': return whlTeams;
    case 'QMJHL': return qmjhlTeams;
    case 'USHL': return ushlTeams;
    case 'NCAA': return ncaaTeams;
    case 'SHL': return shlTeams;
    case 'LIIGA': return liigaTeams;
    default: return nhlTeams;
  }
};

export const getDeployment = (ovr, pos, league) => {
  if (pos === 'G') return ovr >= 82 ? 'Starter' : 'Backup';
  
  const isDef = pos === 'LD' || pos === 'RD';
  
  if (league === 'NHL') {
    if (ovr >= 86) return isDef ? '1st Pair Core' : '1st Line Core';
    if (ovr >= 81) return isDef ? '2nd Pair Top-Four' : '2nd Line Top-Six';
    if (ovr >= 76) return isDef ? '3rd Pair Depth' : '3rd Line Depth';
    return isDef ? '7th D Fringe' : '4th Line Fringe';
  }
  
  // Amateur / Minor Leagues
  if (ovr >= 72) return isDef ? '1st Pair Core' : '1st Line Core';
  if (ovr >= 65) return isDef ? '2nd Pair Top-Four' : '2nd Line Top-Six';
  return isDef ? '3rd Pair Depth' : '3rd Line Depth';
};

export const getPrimaryRival = (teamId, league) => {
  if (!teamId) return null;
  const pool = getOpponentPool(league);
  const team = pool.find(t => t.id === teamId);
  if (!team || !team.rival) return null;
  return pool.find(t => t.id === team.rival) || { id: team.rival, name: team.rival };
};


// ==========================================
// CONFERENCE / DIVISION / PLAYOFF HELPERS
// ==========================================
export const getTeamConference = (teamId, league) => {
  if (!teamId) return null;
  const team = getTeamData(teamId, league);
  if (!team) return null;
  // NCAA doesn't use East/West conferences
  if (league === 'NCAA') return null;
  return team.conf || null;
};

export const getTeamDivision = (teamId, league) => {
  if (!teamId) return null;
  const team = getTeamData(teamId, league);
  return team?.div || null;
};

// NCAA-specific: real hockey conference (Hockey East, Big Ten, NCHC, etc.)
export const getNcaaConference = (teamId) => {
  if (!teamId) return null;
  const team = ncaaTeams.find(t => t.id === teamId);
  return team?.ncaaConf || null;
};

export const getConferences = (league) => {
  return LEAGUE_CONFIG[league]?.conferences || [];
};

export const getDivisions = (league) => {
  return LEAGUE_CONFIG[league]?.divisions || [];
};

export const getPlayoffFormat = (league) => {
  return LEAGUE_CONFIG[league]?.playoffFormat || 'best-of-7-16';
};

export const getPlayoffRounds = (league) => {
  const fmt = getPlayoffFormat(league);
  return PLAYOFF_ROUNDS[fmt] || PLAYOFF_ROUNDS['best-of-7-16'];
};

// Group a pool of teams into { East: [...], West: [...] } or divisions.
// Falls back to a single 'All' bucket for leagues without conferences.
export const groupByConference = (league) => {
  const pool = getOpponentPool(league);
  const confs = getConferences(league);
  if (confs.length === 0) return { All: pool };
  const out = {};
  confs.forEach(c => { out[c] = pool.filter(t => t.conf === c); });
  return out;
};

export const groupByDivision = (league) => {
  const pool = getOpponentPool(league);
  const divs = getDivisions(league);
  if (divs.length === 0) return { All: pool };
  const out = {};
  divs.forEach(d => { out[d] = pool.filter(t => t.div === d); });
  return out;
};