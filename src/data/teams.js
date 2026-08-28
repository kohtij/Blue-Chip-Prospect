// ==========================================
// LEAGUE LOGOS & CONFIGURATION
// ==========================================
export const leagueLogos = {
  NHL: 'https://assets.nhle.com/logos/nhl/svg/NHL_light.svg',
  AHL: 'https://upload.wikimedia.org/wikipedia/en/thumb/7/7b/American_Hockey_League_logo.svg/250px-American_Hockey_League_logo.svg.png',
  ECHL: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_leagues/echl.png',
  OHL: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/07/Ontario_Hockey_League_logo.svg/250px-Ontario_Hockey_League_logo.svg.png',
  WHL: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/4e/Western_Hockey_League_logo.svg/250px-Western_Hockey_League_logo.svg.png',
  QMJHL: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f6/QMJHL_logo.svg/250px-QMJHL_logo.svg.png',
  USHL: 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d7/USHL_logo.svg/250px-USHL_logo.svg.png',
  NCAA: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/NCAA_logo.svg/250px-NCAA_logo.svg.png',
  SHL: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/18/Swedish_Hockey_League_logo.svg/250px-Swedish_Hockey_League_logo.svg.png',
  LIIGA: 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d1/Liiga_logo.svg/250px-Liiga_logo.svg.png',
  KHL: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_leagues/kontinental_hockey_league.png',
  SWISS: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_leagues/national_league.png',
  DEL: 'https://upload.wikimedia.org/wikipedia/en/thumb/7/74/Deutsche_Eishockey_Liga_logo.svg/250px-Deutsche_Eishockey_Liga_logo.svg.png',
  ICEHL: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f6/ICE_Hockey_League_logo.svg/250px-ICE_Hockey_League_logo.svg.png',
  BCHL: '',
  SPHL: '',
  CZECH: '',
  SLOVAK: ''
};

export const LEAGUE_CONFIG = {
  NHL:   { name: 'National Hockey League',           games: 84, playoffSpots: 16, logo: leagueLogos.NHL,   conferences: ['East','West'], divisions: ['Atlantic','Metropolitan','Central','Pacific'], playoffFormat: 'best-of-7-16' },
  AHL:   { name: 'American Hockey League',           games: 72, playoffSpots: 16, logo: leagueLogos.AHL,   conferences: ['East','West'], divisions: ['Atlantic','North','Central','Pacific'],       playoffFormat: 'ahl-16' },
  ECHL:  { name: 'ECHL',                             games: 72, playoffSpots: 16, logo: leagueLogos.ECHL,  conferences: ['East','West'], divisions: ['North','South','Central','Mountain'],         playoffFormat: 'best-of-7-16' },
  OHL:   { name: 'Ontario Hockey League',            games: 68, playoffSpots: 16, logo: leagueLogos.OHL,   conferences: ['East','West'], divisions: ['East','Central','Midwest','West'],           playoffFormat: 'best-of-7-16' },
  WHL:   { name: 'Western Hockey League',            games: 68, playoffSpots: 16, logo: leagueLogos.WHL,   conferences: ['East','West'], divisions: ['East','Central','BC','US'],                  playoffFormat: 'best-of-7-16' },
  QMJHL: { name: 'Quebec Maritimes Junior Hockey League', games: 64, playoffSpots: 16, logo: leagueLogos.QMJHL, conferences: [],          divisions: ['East','Central','West'],                     playoffFormat: 'best-of-7-16' },
  USHL:  { name: 'United States Hockey League',      games: 62, playoffSpots: 8,  logo: leagueLogos.USHL,  conferences: ['East','West'], divisions: ['Eastern','Western'],                         playoffFormat: 'ushl-8' },
  NCAA:  { name: 'NCAA Division I Hockey',           games: 34, playoffSpots: 16, logo: leagueLogos.NCAA,  conferences: [],              divisions: [], ncaaConferences: ['Hockey East','Big Ten','NCHC','ECAC','CCHA','Atlantic Hockey America','Independent'], playoffFormat: 'ncaa-3' },
  SHL:   { name: 'Swedish Hockey League',            games: 52, playoffSpots: 8,  logo: leagueLogos.SHL,   conferences: [],              divisions: [], playoffFormat: 'best-of-7-8' },
  LIIGA: { name: 'Finnish Liiga',                    games: 60, playoffSpots: 8,  logo: leagueLogos.LIIGA, conferences: [],              divisions: [], playoffFormat: 'best-of-7-8' },
  KHL:   { name: 'Kontinental Hockey League',        games: 68, playoffSpots: 16, logo: leagueLogos.KHL,   conferences: ['West','East'], divisions: ['Bobrov','Tarasov','Kharlamov','Chernyshev'], playoffFormat: 'best-of-7-16' },
  SWISS: { name: 'National League',                  games: 52, playoffSpots: 10, logo: leagueLogos.SWISS, conferences: [],              divisions: [], playoffFormat: 'shl-10' },
  DEL:   { name: 'Deutsche Eishockey Liga',          games: 52, playoffSpots: 8,  logo: leagueLogos.DEL,   conferences: [],              divisions: [], playoffFormat: 'best-of-7-8' },
  ICEHL: { name: 'ICE Hockey League',                games: 52, playoffSpots: 8,  logo: leagueLogos.ICEHL, conferences: [],              divisions: [], playoffFormat: 'best-of-7-8' },
  BCHL:  { name: 'British Columbia Hockey League',   games: 54, playoffSpots: 16, logo: leagueLogos.BCHL,  conferences: ['Coastal', 'Interior'], divisions: [], playoffFormat: 'best-of-7-16' },
  SPHL:  { name: 'Southern Professional Hockey League', games: 56, playoffSpots: 8, logo: leagueLogos.SPHL, conferences: [], divisions: [], playoffFormat: 'best-of-7-8' },
  CZECH: { name: 'Czech Extraliga',                  games: 52, playoffSpots: 12, logo: leagueLogos.CZECH, conferences: [],              divisions: [], playoffFormat: 'best-of-7-12' },
  SLOVAK: { name: 'Slovak Extraliga',                games: 50, playoffSpots: 10, logo: leagueLogos.SLOVAK, conferences: [],             divisions: [], playoffFormat: 'shl-10' }
};

export const juniorLeagues = ['OHL', 'WHL', 'QMJHL', 'USHL'];
// Added DEL and ICEHL to professional Euro loop
export const euroLeagues = ['SHL', 'LIIGA', 'KHL', 'SWISS', 'DEL', 'ICEHL', 'CZECH', 'SLOVAK'];

export const PLAYOFF_ROUNDS = {
  'best-of-7-16': [
    { name: 'First Round',       teams: 16, gamesPerMatchup: 7 },
    { name: 'Quarterfinal',      teams: 8,  gamesPerMatchup: 7 },
    { name: 'Semifinal',         teams: 4,  gamesPerMatchup: 7 },
    { name: 'Championship',      teams: 2,  gamesPerMatchup: 7 }
  ],
  'ahl-16': [
    { name: 'Division Semifinals', teams: 16, gamesPerMatchup: 5 },
    { name: 'Division Finals',     teams: 8,  gamesPerMatchup: 5 },
    { name: 'Conference Finals',   teams: 4,  gamesPerMatchup: 7 },
    { name: 'Calder Cup Final',    teams: 2,  gamesPerMatchup: 7 }
  ],
  'ushl-8': [
    { name: 'Conference Semis',  teams: 8,  gamesPerMatchup: 5 },
    { name: 'Conference Finals', teams: 4,  gamesPerMatchup: 5 },
    { name: 'Clark Cup Final',   teams: 2,  gamesPerMatchup: 5 }
  ],
  'best-of-7-8': [
    { name: 'Quarterfinal',      teams: 8,  gamesPerMatchup: 7 },
    { name: 'Semifinal',         teams: 4,  gamesPerMatchup: 7 },
    { name: 'Championship',      teams: 2,  gamesPerMatchup: 7 }
  ],
  'best-of-7-12': [
    { name: 'Pre-Playoffs',      teams: 8,  gamesPerMatchup: 5 },
    { name: 'Quarterfinal',      teams: 8,  gamesPerMatchup: 7 },
    { name: 'Semifinal',         teams: 4,  gamesPerMatchup: 7 },
    { name: 'Championship',      teams: 2,  gamesPerMatchup: 7 }
  ],
  'shl-10': [
    { name: 'Play-In Round',     teams: 4,  gamesPerMatchup: 3 },
    { name: 'Quarterfinal',      teams: 8,  gamesPerMatchup: 7 },
    { name: 'Semifinal',         teams: 4,  gamesPerMatchup: 7 },
    { name: 'Championship',      teams: 2,  gamesPerMatchup: 7 }
  ],
  'ncaa-3': [
    { name: 'Regional Semifinal',    teams: 16, gamesPerMatchup: 3 },
    { name: 'Regional Final',        teams: 8,  gamesPerMatchup: 3 },
    { name: 'Frozen Four',           teams: 4,  gamesPerMatchup: 3 },
    { name: 'National Championship', teams: 2,  gamesPerMatchup: 3 }
  ]
};

// ==========================================
// NATIONALITIES (Ranked by IIHF Strength)
// ==========================================
export const nationalities = [
  // TIER 1: The Superpowers (Medal Contenders)
  { id: 'CAN', name: 'Canada', sentenceName: 'Canada', img: 'https://flagcdn.com/w40/ca.png', iihfRank: 1, tier: 1, division: 'Top Division' },
  { id: 'USA', name: 'United States', sentenceName: 'the United States', img: 'https://flagcdn.com/w40/us.png', iihfRank: 4, tier: 1, division: 'Top Division' },
  { id: 'SWE', name: 'Sweden', sentenceName: 'Sweden', img: 'https://flagcdn.com/w40/se.png', iihfRank: 5, tier: 1, division: 'Top Division' },
  { id: 'FIN', name: 'Finland', sentenceName: 'Finland', img: 'https://flagcdn.com/w40/fi.png', iihfRank: 3, tier: 1, division: 'Top Division' },
  { id: 'RUS', name: 'Russia', sentenceName: 'Russia', img: 'https://flagcdn.com/w40/ru.png', iihfRank: 2, tier: 1, division: 'Top Division' },
  { id: 'SUI', name: 'Switzerland', sentenceName: 'Switzerland', img: 'https://flagcdn.com/w40/ch.png', iihfRank: 6, tier: 1, division: 'Top Division' },
  { id: 'CZE', name: 'Czechia', sentenceName: 'Czechia', img: 'https://flagcdn.com/w40/cz.png', iihfRank: 7, tier: 1, division: 'Top Division' },
  
  // TIER 2: Strong Contenders (Upset Potential)
  { id: 'GER', name: 'Germany', sentenceName: 'Germany', img: 'https://flagcdn.com/w40/de.png', iihfRank: 8, tier: 2, division: 'Top Division' },
  { id: 'SVK', name: 'Slovakia', sentenceName: 'Slovakia', img: 'https://flagcdn.com/w40/sk.png', iihfRank: 9, tier: 2, division: 'Top Division' },
  { id: 'LAT', name: 'Latvia', sentenceName: 'Latvia', img: 'https://flagcdn.com/w40/lv.png', iihfRank: 10, tier: 2, division: 'Top Division' },
  
  // TIER 3: Top Division Regulars (Fighting Relegation)
  { id: 'DNK', name: 'Denmark', sentenceName: 'Denmark', img: 'https://flagcdn.com/w40/dk.png', iihfRank: 11, tier: 3, division: 'Division I-A' },
  { id: 'NOR', name: 'Norway', sentenceName: 'Norway', img: 'https://flagcdn.com/w40/no.png', iihfRank: 12, tier: 3, division: 'Division I-A' },
  { id: 'AUT', name: 'Austria', sentenceName: 'Austria', img: 'https://flagcdn.com/w40/at.png', iihfRank: 13, tier: 3, division: 'Division I-A' },
  { id: 'FRA', name: 'France', sentenceName: 'France', img: 'https://flagcdn.com/w40/fr.png', iihfRank: 14, tier: 3, division: 'Division I-A' },
  { id: 'KAZ', name: 'Kazakhstan', sentenceName: 'Kazakhstan', img: 'https://flagcdn.com/w40/kz.png', iihfRank: 15, tier: 3, division: 'Division I-A' },
  { id: 'BLR', name: 'Belarus', sentenceName: 'Belarus', img: 'https://flagcdn.com/w40/by.png', iihfRank: 16, tier: 3, division: 'Division I-A' },
  
  // TIER 4: Lower Divisions (Development Programs)
  { id: 'GBR', name: 'United Kingdom', sentenceName: 'the United Kingdom', img: 'https://flagcdn.com/w40/gb.png', iihfRank: 17, tier: 4, division: 'Division I-B' },
  { id: 'SVN', name: 'Slovenia', sentenceName: 'Slovenia', img: 'https://flagcdn.com/w40/si.png', iihfRank: 18, tier: 4, division: 'Division I-B' },
  { id: 'ITA', name: 'Italy', sentenceName: 'Italy', img: 'https://flagcdn.com/w40/it.png', iihfRank: 19, tier: 4, division: 'Division I-B' },
  { id: 'KOR', name: 'South Korea', sentenceName: 'South Korea', img: 'https://flagcdn.com/w40/kr.png', iihfRank: 20, tier: 4, division: 'Division I-B' },
  { id: 'UKR', name: 'Ukraine', sentenceName: 'Ukraine', img: 'https://flagcdn.com/w40/ua.png', iihfRank: 21, tier: 4, division: 'Division I-B' },
  { id: 'JPN', name: 'Japan', sentenceName: 'Japan', img: 'https://flagcdn.com/w40/jp.png', iihfRank: 22, tier: 4, division: 'Division I-B' },
  { id: 'CHN', name: 'China', sentenceName: 'China', img: 'https://flagcdn.com/w40/cn.png', iihfRank: 23, tier: 4, division: 'Division II-A' },
  { id: 'AUS', name: 'Australia', sentenceName: 'Australia', img: 'https://flagcdn.com/w40/au.png', iihfRank: 24, tier: 4, division: 'Division II-A' },
];

// ==========================================
// 1. NHL TEAMS
// ==========================================
export const nhlTeams = [
  { id: 'BOS', conf: 'East', div: 'Atlantic', city: 'Boston', name: 'Bruins', bg: '#000000', color: '#FFB81C', ahlId: 'PRO', rival: 'MTL', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/boston_bruins.png' },
  { id: 'BUF', conf: 'East', div: 'Atlantic', city: 'Buffalo', name: 'Sabres', bg: '#002654', color: '#FCB514', ahlId: 'ROC', rival: 'TOR', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/buffalo_sabres.png' },
  { id: 'DET', conf: 'East', div: 'Atlantic', city: 'Detroit', name: 'Red Wings', bg: '#CE1126', color: '#FFFFFF', ahlId: 'GR', rival: 'CHI', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/detroit_red_wings.png' },
  { id: 'FLA', conf: 'East', div: 'Atlantic', city: 'Florida', name: 'Panthers', bg: '#041E42', color: '#C8102E', ahlId: 'CLT', rival: 'TBL', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/florida_panthers.png' },
  { id: 'MTL', conf: 'East', div: 'Atlantic', city: 'Montreal', name: 'Canadiens', bg: '#AF1E2D', color: '#192168', ahlId: 'LAV', rival: 'BOS', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/montreal_canadiens.png' },
  { id: 'OTT', conf: 'East', div: 'Atlantic', city: 'Ottawa', name: 'Senators', bg: '#C8102E', color: '#D69F3D', ahlId: 'BEL', rival: 'TOR', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/ottawa_senators.png' },
  { id: 'TBL', conf: 'East', div: 'Atlantic', city: 'Tampa Bay', name: 'Lightning', bg: '#002868', color: '#FFFFFF', ahlId: 'SYR', rival: 'FLA', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/tampa_bay_lightning.png' },
  { id: 'TOR', conf: 'East', div: 'Atlantic', city: 'Toronto', name: 'Maple Leafs', bg: '#00205B', color: '#FFFFFF', ahlId: 'TOR_AHL', rival: 'MTL', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/toronto_maple_leafs.png' },
  { id: 'CAR', conf: 'East', div: 'Metropolitan', city: 'Carolina', name: 'Hurricanes', bg: '#CC0000', color: '#000000', ahlId: 'CHI_AHL', rival: 'WSH', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/carolina_hurricanes.png' },
  { id: 'CBJ', conf: 'East', div: 'Metropolitan', city: 'Columbus', name: 'Blue Jackets', bg: '#002654', color: '#CE1126', ahlId: 'CLE', rival: 'PIT', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/columbus_blue_jackets.png' },
  { id: 'NJD', conf: 'East', div: 'Metropolitan', city: 'New Jersey', name: 'Devils', bg: '#CE1126', color: '#000000', ahlId: 'UTI', rival: 'NYR', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/new_jersey_devils.png' },
  { id: 'NYI', conf: 'East', div: 'Metropolitan', city: 'New York', name: 'Islanders', bg: '#00539B', color: '#F47D30', ahlId: 'BRI', rival: 'NYR', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/new_york_islanders.png' },
  { id: 'NYR', conf: 'East', div: 'Metropolitan', city: 'New York', name: 'Rangers', bg: '#0038A8', color: '#CE1126', ahlId: 'HFD', rival: 'NYI', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/new_york_rangers.png' },
  { id: 'PHI', conf: 'East', div: 'Metropolitan', city: 'Philadelphia', name: 'Flyers', bg: '#F74902', color: '#000000', ahlId: 'LVP', rival: 'PIT', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/philadelphia_flyers.png' },
  { id: 'PIT', conf: 'East', div: 'Metropolitan', city: 'Pittsburgh', name: 'Penguins', bg: '#000000', color: '#FCB514', ahlId: 'WBS', rival: 'PHI', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/pittsburgh_penguins.png' },
  { id: 'WSH', conf: 'East', div: 'Metropolitan', city: 'Washington', name: 'Capitals', bg: '#041E42', color: '#C8102E', ahlId: 'HER', rival: 'PIT', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/washington_capitals.png' },
  { id: 'CHI', conf: 'West', div: 'Central', city: 'Chicago', name: 'Blackhawks', bg: '#CF0A2C', color: '#000000', ahlId: 'RFD', rival: 'STL', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/chicago_blackhawks.png' },
  { id: 'COL', conf: 'West', div: 'Central', city: 'Colorado', name: 'Avalanche', bg: '#6F263D', color: '#236192', ahlId: 'COL_AHL', rival: 'MIN', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/colorado_avalanche.png' },
  { id: 'DAL', conf: 'West', div: 'Central', city: 'Dallas', name: 'Stars', bg: '#006847', color: '#8F8F8C', ahlId: 'TEX', rival: 'NSH', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/dallas_stars.png' },
  { id: 'MIN', conf: 'West', div: 'Central', city: 'Minnesota', name: 'Wild', bg: '#154734', color: '#A6192E', ahlId: 'IA', rival: 'COL', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/minnesota_wild.png' },
  { id: 'NSH', conf: 'West', div: 'Central', city: 'Nashville', name: 'Predators', bg: '#FFB81C', color: '#041E42', ahlId: 'MIL', rival: 'STL', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/nashville_predators.png' },
  { id: 'STL', conf: 'West', div: 'Central', city: 'St. Louis', name: 'Blues', bg: '#002F87', color: '#FCB514', ahlId: 'SPR', rival: 'CHI', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/st__louis_blues.png' },
  { id: 'UTA', conf: 'West', div: 'Central', city: 'Utah', name: 'Mammoth', bg: '#010101', color: '#6CACE4', ahlId: 'TUC', rival: 'VGK', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/utah_mammoth.png' },
  { id: 'WPG', conf: 'West', div: 'Central', city: 'Winnipeg', name: 'Jets', bg: '#041E42', color: '#004C97', ahlId: 'MB', rival: 'MIN', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/winnipeg_jets.png' },
  { id: 'ANA', conf: 'West', div: 'Pacific', city: 'Anaheim', name: 'Ducks', bg: '#F47A38', color: '#000000', ahlId: 'SD', rival: 'LAK', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/anaheim_ducks.png' },
  { id: 'CGY', conf: 'West', div: 'Pacific', city: 'Calgary', name: 'Flames', bg: '#C8102E', color: '#F15A24', ahlId: 'CGY_AHL', rival: 'EDM', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/calgary_flames.png' },
  { id: 'EDM', conf: 'West', div: 'Pacific', city: 'Edmonton', name: 'Oilers', bg: '#041E42', color: '#FF4C00', ahlId: 'BAK', rival: 'CGY', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/edmonton_oilers.png' },
  { id: 'LAK', conf: 'West', div: 'Pacific', city: 'Los Angeles', name: 'Kings', bg: '#111111', color: '#A2AAAD', ahlId: 'ONT', rival: 'ANA', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/los_angeles_kings.png' },
  { id: 'SJS', conf: 'West', div: 'Pacific', city: 'San Jose', name: 'Sharks', bg: '#006D75', color: '#EA6D13', ahlId: 'SJS_AHL', rival: 'VGK', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/san_jose_sharks.png' },
  { id: 'SEA', conf: 'West', div: 'Pacific', city: 'Seattle', name: 'Kraken', bg: '#001628', color: '#99D9D9', ahlId: 'CV', rival: 'VAN', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/seattle_kraken.png' },
  { id: 'VAN', conf: 'West', div: 'Pacific', city: 'Vancouver', name: 'Canucks', bg: '#00205B', color: '#00843D', ahlId: 'ABB', rival: 'EDM', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/vancouver_canucks.png' },
  { id: 'VGK', conf: 'West', div: 'Pacific', city: 'Vegas', name: 'Golden Knights', bg: '#B3A369', color: '#333F48', ahlId: 'HSK', rival: 'SJS', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/vegas_golden_knights.png' }
];

// ==========================================
// 2. OHL TEAMS
// ==========================================
export const ohlTeams = [
  { id: 'BAR', conf: 'East', div: 'East', city: 'Barrie', name: 'Colts', bg: '#002B54', color: '#FFFFFF', rival: 'OS', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/barrie_colts.png' },
  { id: 'BFD', conf: 'East', div: 'Central', city: 'Brantford', name: 'Bulldogs', bg: '#000000', color: '#FDB913', rival: 'NIA', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/brantford_bulldogs.png' },
  { id: 'ERI', conf: 'West', div: 'Midwest', city: 'Erie', name: 'Otters', bg: '#002D62', color: '#FDBB30', rival: 'LDN', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/erie_otters.png' },
  { id: 'FLN', conf: 'West', div: 'West', city: 'Flint', name: 'Firebirds', bg: '#002B54', color: '#F26122', rival: 'SAG', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/flint_firebirds.png' },
  { id: 'GUE', conf: 'West', div: 'Midwest', city: 'Guelph', name: 'Storm', bg: '#B31B1B', color: '#000000', rival: 'KIT', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/guelph_storm.png' },
  { id: 'KGN', conf: 'East', div: 'East', city: 'Kingston', name: 'Frontenacs', bg: '#000000', color: '#FFB81C', rival: 'PBO', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/kingston_frontenacs.png' },
  { id: 'KIT', conf: 'West', div: 'Midwest', city: 'Kitchener', name: 'Rangers', bg: '#0033A0', color: '#C8102E', rival: 'LDN', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/kitchener_rangers.png' },
  { id: 'LDN', conf: 'West', div: 'Midwest', city: 'London', name: 'Knights', bg: '#006B54', color: '#B3995D', rival: 'KIT', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/london_knights.png' },
  { id: 'MIS', conf: 'East', div: 'Central', city: 'Mississauga', name: 'Steelheads', bg: '#00205B', color: '#FFFFFF', rival: 'BFD', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/mississauga_steelheads.png' },
  { id: 'NIA', conf: 'East', div: 'Central', city: 'Niagara', name: 'IceDogs', bg: '#C8102E', color: '#000000', rival: 'BFD', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/niagara_icedogs.png' },
  { id: 'NOB', conf: 'East', div: 'Central', city: 'North Bay', name: 'Battalion', bg: '#344A27', color: '#FFB81C', rival: 'SUD', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/north_bay_battalion.png' },
  { id: 'OSH', conf: 'East', div: 'East', city: 'Oshawa', name: 'Generals', bg: '#C8102E', color: '#00205B', rival: 'PBO', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/oshawa_generals.png' },
  { id: 'OTT', conf: 'East', div: 'East', city: 'Ottawa', name: "67's", bg: '#000000', color: '#C8102E', rival: 'GAT', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/ottawa_67_s.png' },
  { id: 'OWS', conf: 'West', div: 'Midwest', city: 'Owen Sound', name: 'Attack', bg: '#C8102E', color: '#000000', rival: 'BAR', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/owen_sound_attack.png' },
  { id: 'PBO', conf: 'East', div: 'East', city: 'Peterborough', name: 'Petes', bg: '#862633', color: '#FFFFFF', rival: 'OSH', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/peterborough_petes.png' },
  { id: 'SAG', conf: 'West', div: 'West', city: 'Saginaw', name: 'Spirit', bg: '#00205B', color: '#C8102E', rival: 'FLNT', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/saginaw_spirit.png' },
  { id: 'SAR', conf: 'West', div: 'West', city: 'Sarnia', name: 'Sting', bg: '#000000', color: '#FFB81C', rival: 'WIN', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/sarnia_sting.png' },
  { id: 'SSM', conf: 'West', div: 'West', city: 'Sault Ste. Marie', name: 'Greyhounds', bg: '#C8102E', color: '#FFFFFF', rival: 'SUD', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/sault_ste__marie_greyhounds.png' },
  { id: 'SUD', conf: 'East', div: 'Central', city: 'Sudbury', name: 'Wolves', bg: '#00205B', color: '#FFFFFF', rival: 'NB', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/sudbury_wolves.png' },
  { id: 'WIN', conf: 'West', div: 'West', city: 'Windsor', name: 'Spitfires', bg: '#00205B', color: '#C8102E', rival: 'SAR', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/windsor_spitfires.png' }
];

// ==========================================
// 3. WHL TEAMS
// ==========================================
export const whlTeams = [
  { id: 'BDN', conf: 'East', div: 'East', city: 'Brandon', name: 'Wheat Kings', bg: '#000000', color: '#FDBB30', rival: 'REG', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/brandon_wheat_kings.png' },
  { id: 'CGY', conf: 'East', div: 'Central', city: 'Calgary', name: 'Hitmen', bg: '#000000', color: '#E32636', rival: 'EDM', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/calgary_hitmen.png' },
  { id: 'EDM', conf: 'East', div: 'Central', city: 'Edmonton', name: 'Oil Kings', bg: '#D31245', color: '#041E42', rival: 'CGY', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/edmonton_oil_kings.png' },
  { id: 'EVT', conf: 'West', div: 'US', city: 'Everett', name: 'Silvertips', bg: '#00471B', color: '#8A8D8F', rival: 'SEA', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/everett_silvertips.png' },
  { id: 'KAM', conf: 'West', div: 'BC', city: 'Kamloops', name: 'Blazers', bg: '#0033A0', color: '#E32636', rival: 'KEL', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/kamloops_blazers.png' },
  { id: 'KEL', conf: 'West', div: 'BC', city: 'Kelowna', name: 'Rockets', bg: '#008394', color: '#C8102E', rival: 'KAM', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/kelowna_rockets.png' },
  { id: 'LET', conf: 'East', div: 'Central', city: 'Lethbridge', name: 'Hurricanes', bg: '#041E42', color: '#C8102E', rival: 'MH', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/lethbridge_hurricanes.png' },
  { id: 'MED', conf: 'East', div: 'Central', city: 'Medicine Hat', name: 'Tigers', bg: '#F26522', color: '#000000', rival: 'LET', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/medicine_hat_tigers.png' },
  { id: 'MJW', conf: 'East', div: 'East', city: 'Moose Jaw', name: 'Warriors', bg: '#000000', color: '#C8102E', rival: 'REG', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/moose_jaw_warriors.png' },
  { id: 'POR', conf: 'West', div: 'US', city: 'Portland', name: 'Winterhawks', bg: '#C8102E', color: '#000000', rival: 'SEA', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/portland_winterhawks.png' },
  { id: 'PRA', conf: 'East', div: 'East', city: 'Prince Albert', name: 'Raiders', bg: '#00471B', color: '#FFB81C', rival: 'SAS', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/prince_albert_raiders.png' },
  { id: 'PRG', conf: 'West', div: 'BC', city: 'Prince George', name: 'Cougars', bg: '#D31245', color: '#000000', rival: 'KAM', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/prince_george_cougars.png' },
  { id: 'RED', conf: 'East', div: 'Central', city: 'Red Deer', name: 'Rebels', bg: '#862633', color: '#000000', rival: 'EDM', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/red_deer_rebels.png' },
  { id: 'REG', conf: 'East', div: 'East', city: 'Regina', name: 'Pats', bg: '#041E42', color: '#C8102E', rival: 'MJ', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/regina_pats.png' },
  { id: 'SAS', conf: 'East', div: 'East', city: 'Saskatoon', name: 'Blades', bg: '#0033A0', color: '#FFB81C', rival: 'PA', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/saskatoon_blades.png' },
  { id: 'SEA', conf: 'West', div: 'US', city: 'Seattle', name: 'Thunderbirds', bg: '#002855', color: '#8DC63F', rival: 'POR', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/seattle_thunderbirds.png' },
  { id: 'SPO', conf: 'West', div: 'US', city: 'Spokane', name: 'Chiefs', bg: '#C8102E', color: '#041E42', rival: 'TC', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/spokane_chiefs.png' },
  { id: 'SCB', conf: 'East', div: 'East', city: 'Swift Current', name: 'Broncos', bg: '#00471B', color: '#0033A0', rival: 'MJ', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/swift_current_broncos.png' },
  { id: 'TCA', conf: 'West', div: 'US', city: 'Tri-City', name: 'Americans', bg: '#041E42', color: '#C8102E', rival: 'SPO', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/tri-city_americans.png' },
  { id: 'VAN', conf: 'West', div: 'BC', city: 'Vancouver', name: 'Giants', bg: '#000000', color: '#C8102E', rival: 'VIC', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/vancouver_giants.png' },
  { id: 'VIC', conf: 'West', div: 'BC', city: 'Victoria', name: 'Royals', bg: '#00205B', color: '#C8102E', rival: 'VAN', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/victoria_royals.png' },
  { id: 'WEN', conf: 'West', div: 'US', city: 'Wenatchee', name: 'Wild', bg: '#002855', color: '#54B948', rival: 'TC', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/wenatchee_wild.png' }
];

// ==========================================
// 4. QMJHL TEAMS
// ==========================================
export const qmjhlTeams = [
  { id: 'BAT', div: 'East', city: 'Acadie-Bathurst', name: 'Titan', bg: '#862633', color: '#B3995D', rival: 'MON', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/acadie-bathurst_titan.png' },
  { id: 'BAC', div: 'Central', city: 'Baie-Comeau', name: 'Drakkar', bg: '#C8102E', color: '#FFB81C', rival: 'RIM', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/baie-comeau_drakkar.png' },
  { id: 'BLA', div: 'West', city: 'Blainville-Boisbriand', name: 'Armada', bg: '#000000', color: '#FFFFFF', rival: 'GAT', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/blainville-boisbriand_armada.png' },
  { id: 'CBE', div: 'East', city: 'Cape Breton', name: 'Eagles', bg: '#000000', color: '#FFB81C', rival: 'HAL', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/cape_breton_eagles.png' },
  { id: 'CHA', div: 'East', city: 'Charlottetown', name: 'Islanders', bg: '#000000', color: '#FFB81C', rival: 'MON', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/charlottetown_islanders.png' },
  { id: 'CHI', div: 'Central', city: 'Chicoutimi', name: 'Saguenéens', bg: '#00205B', color: '#88D0F6', rival: 'QUE', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/chicoutimi_saguen%C3%A9ens.png' },
  { id: 'DRU', div: 'West', city: 'Drummondville', name: 'Voltigeurs', bg: '#C8102E', color: '#000000', rival: 'SHA', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/drummondville_voltigeurs.png' },
  { id: 'GAT', div: 'West', city: 'Gatineau', name: 'Olympiques', bg: '#000000', color: '#FFFFFF', rival: 'OTT', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/gatineau_olympiques.png' },
  { id: 'HAL', div: 'East', city: 'Halifax', name: 'Mooseheads', bg: '#00471B', color: '#C8102E', rival: 'CBE', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/halifax_mooseheads.png' },
  { id: 'MON', div: 'East', city: 'Moncton', name: 'Wildcats', bg: '#C8102E', color: '#041E42', rival: 'SJD', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/moncton_wildcats.png' },
  { id: 'QUE', div: 'Central', city: 'Quebec', name: 'Remparts', bg: '#C8102E', color: '#000000', rival: 'RIM', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/qu%C3%A9bec_remparts.png' },
  { id: 'RIM', div: 'Central', city: 'Rimouski', name: 'Océanic', bg: '#00205B', color: '#FFFFFF', rival: 'QUE', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/rimouski_oc%C3%A9anic.png' },
  { id: 'ROU', div: 'West', city: 'Rouyn-Noranda', name: 'Huskies', bg: '#C8102E', color: '#000000', rival: 'VDO', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/rouyn-noranda_huskies.png' },
  { id: 'SJD', div: 'East', city: 'Saint John', name: 'Sea Dogs', bg: '#00205B', color: '#88D0F6', rival: 'MON', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/saint_john_sea_dogs.png' },
  { id: 'SHA', div: 'West', city: 'Shawinigan', name: 'Cataractes', bg: '#002855', color: '#FFB81C', rival: 'DRU', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/shawinigan_cataractes.png' },
  { id: 'SHE', div: 'Central', city: 'Sherbrooke', name: 'Phoenix', bg: '#002855', color: '#88D0F6', rival: 'DRU', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/sherbrooke_phoenix.png' },
  { id: 'VDO', div: 'West', city: 'Val-d\'Or', name: 'Foreurs', bg: '#00471B', color: '#FFB81C', rival: 'ROU', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/val-d_or_foreurs.png' },
  { id: 'VIC', div: 'Central', city: 'Victoriaville', name: 'Tigres', bg: '#000000', color: '#FFB81C', rival: 'DRU', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/victoriaville_tigres.png' }
];

// ==========================================
// 5. USHL TEAMS
// ==========================================
export const ushlTeams = [
  { id: 'CDR', conf: 'West', div: 'Western', city: 'Cedar Rapids', name: 'RoughRiders', bg: '#00205B', color: '#C8102E', rival: 'WAT', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/Cedar_Rapids_RoughRiders.png' },
  { id: 'CHI', conf: 'East', div: 'Eastern', city: 'Chicago', name: 'Steel', bg: '#000000', color: '#54B948', rival: 'GB', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/chicago_steel.png' },
  { id: 'DBQ', conf: 'East', div: 'Eastern', city: 'Dubuque', name: 'Fighting Saints', bg: '#862633', color: '#FFB81C', rival: 'CR', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/dubuque_fighting_saints.png' },
  { id: 'GBG', conf: 'East', div: 'Eastern', city: 'Green Bay', name: 'Gamblers', bg: '#00471B', color: '#FFB81C', rival: 'CHI', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/green_bay_gamblers.png' },
  { id: 'MDS', conf: 'East', div: 'Eastern', city: 'Madison', name: 'Capitols', bg: '#041E42', color: '#C8102E', rival: 'GB', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/madison_capitols.png' },
  { id: 'MSK', conf: 'East', div: 'Eastern', city: 'Muskegon', name: 'Lumberjacks', bg: '#00205B', color: '#FFB81C', rival: 'YNG', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/Muskegon_Lumberjacks.png' },
  { id: 'NTDP', conf: 'East', div: 'Eastern', city: 'USA', name: 'NTDP', bg: '#041E42', color: '#C8102E', rival: 'CHI', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/u_s__national_team_development_program.png' },
  { id: 'YTP', conf: 'East', div: 'Eastern', city: 'Youngstown', name: 'Phantoms', bg: '#000000', color: '#C8102E', rival: 'MUS', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/youngstown_phantoms.png' },
  { id: 'DMB', conf: 'West', div: 'Western', city: 'Des Moines', name: 'Buccaneers', bg: '#00471B', color: '#C8102E', rival: 'OMA', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/des_moines_buccaneers.png' },
  { id: 'FRG', conf: 'West', div: 'Western', city: 'Fargo', name: 'Force', bg: '#00205B', color: '#54B948', rival: 'SF', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/fargo_force.png' },
  { id: 'LNC', conf: 'West', div: 'Western', city: 'Lincoln', name: 'Stars', bg: '#000000', color: '#C8102E', rival: 'OMA', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/lincoln_stars.png' },
  { id: 'OMH', conf: 'West', div: 'Western', city: 'Omaha', name: 'Lancers', bg: '#00205B', color: '#F26522', rival: 'LIN', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/omaha_lancers.png' },
  { id: 'SCM', conf: 'West', div: 'Western', city: 'Sioux City', name: 'Musketeers', bg: '#00471B', color: '#FFB81C', rival: 'SF', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/sioux_city_musketeers.png' },
  { id: 'SFS', conf: 'West', div: 'Western', city: 'Sioux Falls', name: 'Stampede', bg: '#00205B', color: '#FFB81C', rival: 'SC', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/sioux_falls_stampede.png' },
  { id: 'TCS', conf: 'West', div: 'Western', city: 'Tri-City', name: 'Storm', bg: '#002855', color: '#8DC63F', rival: 'OMA', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/tri-city_storm.png' },
  { id: 'WAT', conf: 'East', div: 'Eastern', city: 'Waterloo', name: 'Black Hawks', bg: '#000000', color: '#C8102E', rival: 'CR', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/Waterloo_Black_Hawks.png' }
];

// ==========================================
// 6. AHL TEAMS
// ==========================================
export const ahlTeams = [
  { id: 'PRO', conf: 'East', div: 'Atlantic', city: 'Providence', name: 'Bruins', bg: '#000000', color: '#FFB81C', rival: 'HFD', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/Providence_Bruins.png' },
  { id: 'ROC', conf: 'East', div: 'North', city: 'Rochester', name: 'Americans', bg: '#00205B', color: '#C8102E', rival: 'SYR', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/Rochester_Americans.png' },
  { id: 'GR', conf: 'West', div: 'Central', city: 'Grand Rapids', name: 'Griffins', bg: '#000000', color: '#B3995D', rival: 'MIL', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/Grand_Rapids_Griffins.png' },
  { id: 'HER', conf: 'East', div: 'Atlantic', city: 'Hershey', name: 'Bears', bg: '#3B2314', color: '#C5B358', rival: 'WBS', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/Hershey_Bears.png' },
  { id: 'WBS', conf: 'East', div: 'Atlantic', city: 'Wilkes-Barre/Scranton', name: 'Penguins', bg: '#000000', color: '#FFB81C', rival: 'HER', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/Wilkes-Barre_Scranton_Penguins.png' },
  { id: 'SYR', conf: 'East', div: 'North', city: 'Syracuse', name: 'Crunch', bg: '#00205B', color: '#88D0F6', rival: 'ROC', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/Syracuse_Crunch.png' },
  { id: 'CLE', conf: 'East', div: 'North', city: 'Cleveland', name: 'Monsters', bg: '#000000', color: '#002D62', rival: 'GR', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/Cleveland_Monsters.png' },
  { id: 'MIL', conf: 'West', div: 'Central', city: 'Milwaukee', name: 'Admirals', bg: '#00205B', color: '#88D0F6', rival: 'CHI_AHL', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/Milwaukee_Admirals.png' },
  { id: 'CHI_AHL', conf: 'West', div: 'Central', city: 'Chicago', name: 'Wolves', bg: '#000000', color: '#FFB81C', rival: 'MIL', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/Chicago_Wolves.png' },
  { id: 'TEX', conf: 'West', div: 'Central', city: 'Texas', name: 'Stars', bg: '#006847', color: '#8F8F8C', rival: 'BAK', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/Texas_Stars.png' },
  { id: 'BAK', conf: 'West', div: 'Pacific', city: 'Bakersfield', name: 'Condors', bg: '#00205B', color: '#F26522', rival: 'ONT', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/Bakersfield_Condors.png' },
  { id: 'ONT', conf: 'West', div: 'Pacific', city: 'Ontario', name: 'Reign', bg: '#000000', color: '#A2AAAD', rival: 'SD', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/Ontario_Reign.png' },
  { id: 'SD', conf: 'West', div: 'Pacific', city: 'San Diego', name: 'Gulls', bg: '#F47A38', color: '#00205B', rival: 'ONT', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/San_Diego_Gulls.png' },
  { id: 'CV', conf: 'West', div: 'Pacific', city: 'Coachella Valley', name: 'Firebirds', bg: '#001628', color: '#FF4C00', rival: 'SD', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/coachella_valley_firebirds.png' },
  { id: 'ABB', conf: 'West', div: 'Pacific', city: 'Abbotsford', name: 'Canucks', bg: '#00205B', color: '#00843D', rival: 'CGY_AHL', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/abbotsford_canucks.png' },
  { id: 'CGY_AHL', conf: 'West', div: 'Pacific', city: 'Calgary', name: 'Wranglers', bg: '#C8102E', color: '#F15A24', rival: 'ABB', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/calgary_wranglers.png' },
  { id: 'BRI', conf: 'East', div: 'Atlantic', city: 'Bridgeport', name: 'Islanders', bg: '#00539B', color: '#F47D30', rival: 'HFD', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/bridgeport_islanders.png' },
  { id: 'CLT', conf: 'East', div: 'Atlantic', city: 'Charlotte', name: 'Checkers', bg: '#000000', color: '#C8102E', rival: 'HER', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/Charlotte_Checkers.png' },
  { id: 'HFD', conf: 'East', div: 'Atlantic', city: 'Hartford', name: 'Wolf Pack', bg: '#C8102E', color: '#0038A8', rival: 'BRI', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/Hartford_Wolf_Pack.png' },
  { id: 'LVP', conf: 'East', div: 'Atlantic', city: 'Lehigh Valley', name: 'Phantoms', bg: '#000000', color: '#F26522', rival: 'WBS', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/Lehigh_Valley_Phantoms.png' },
  { id: 'SPR', conf: 'East', div: 'Atlantic', city: 'Springfield', name: 'Thunderbirds', bg: '#002F87', color: '#FCB514', rival: 'HER', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/Springfield_Thunderbirds.png' },
  { id: 'BEL', conf: 'East', div: 'North', city: 'Belleville', name: 'Senators', bg: '#C8102E', color: '#000000', rival: 'TOR_AHL', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/belleville_senators.png' },
  { id: 'LAV', conf: 'East', div: 'North', city: 'Laval', name: 'Rocket', bg: '#003C71', color: '#FFFFFF', rival: 'SYR', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/laval_rocket.png' },
  { id: 'TOR_AHL', conf: 'East', div: 'North', city: 'Toronto', name: 'Marlies', bg: '#00205B', color: '#FFFFFF', rival: 'BEL', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/Toronto_Marlies.png' },
  { id: 'UTI', conf: 'East', div: 'North', city: 'Utica', name: 'Comets', bg: '#CE1126', color: '#000000', rival: 'SYR', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/utica_comets.png' },
  { id: 'IA', conf: 'West', div: 'Central', city: 'Iowa', name: 'Wild', bg: '#154734', color: '#A6192E', rival: 'MIL', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/Iowa_Wild.png' },
  { id: 'MB', conf: 'West', div: 'Central', city: 'Manitoba', name: 'Moose', bg: '#041E42', color: '#A2AAAD', rival: 'IA', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/Manitoba_Moose.png' },
  { id: 'RFD', conf: 'West', div: 'Central', city: 'Rockford', name: 'IceHogs', bg: '#000000', color: '#CF0A2C', rival: 'MIL', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/Rockford_Icehogs.png' },
  { id: 'COL_AHL', conf: 'West', div: 'Pacific', city: 'Colorado', name: 'Eagles', bg: '#6F263D', color: '#A2AAAD', rival: 'TUC', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/colorado_eagles.png' },
  { id: 'HSK', conf: 'West', div: 'Pacific', city: 'Henderson', name: 'Silver Knights', bg: '#333F48', color: '#B3A369', rival: 'COL_AHL', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/henderson_silver_knights.png' },
  { id: 'SJS_AHL', conf: 'West', div: 'Pacific', city: 'San Jose', name: 'Barracuda', bg: '#006D75', color: '#EA6D13', rival: 'ONT', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/San_Jose_Barracuda.png' },
  { id: 'TUC', conf: 'West', div: 'Pacific', city: 'Tucson', name: 'Roadrunners', bg: '#010101', color: '#C8102E', rival: 'COL_AHL', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/Tucson_Roadrunners.png' }
];

// ==========================================
// 7. NCAA TEAMS (60+ D1 Programs)
// ==========================================
export const ncaaTeams = [
  // Hockey East
  { id: 'BC', ncaaConf: 'Hockey East', name: 'Boston College Eagles', bg: '#862633', color: '#BC9B6A', rival: 'BU', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/boston_college_eagles.png' },
  { id: 'BU', ncaaConf: 'Hockey East', name: 'Boston University Terriers', bg: '#CC0000', color: '#FFFFFF', rival: 'BC', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/boston_university_terriers.png' },
  { id: 'UCONN', ncaaConf: 'Hockey East', name: 'UConn Huskies', bg: '#000E2F', color: '#FFFFFF', rival: 'UMASS', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/connecticut_huskies.png' },
  { id: 'MAINE', ncaaConf: 'Hockey East', name: 'Maine Black Bears', bg: '#003263', color: '#B0D7FF', rival: 'UNH', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/maine_black_bears.png' },
  { id: 'UMASS', ncaaConf: 'Hockey East', name: 'UMass Minutemen', bg: '#881C1C', color: '#FFFFFF', rival: 'UML', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/umass_minutemen.png' },
  { id: 'UML', ncaaConf: 'Hockey East', name: 'UMass Lowell River Hawks', bg: '#003E7E', color: '#C8102E', rival: 'UMASS', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/umass_lowell_river_hawks.png' },
  { id: 'MER', ncaaConf: 'Hockey East', name: 'Merrimack Warriors', bg: '#002855', color: '#F3A900', rival: 'UML', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/merrimack_warriors.png' },
  { id: 'UNH', ncaaConf: 'Hockey East', name: 'New Hampshire Wildcats', bg: '#041E42', color: '#FFFFFF', rival: 'MAINE', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/new_hampshire_wildcats.png' },
  { id: 'NU', ncaaConf: 'Hockey East', name: 'Northeastern Huskies', bg: '#CC0000', color: '#000000', rival: 'BU', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/northeastern_huskies.png' },
  { id: 'PROV', ncaaConf: 'Hockey East', name: 'Providence Friars', bg: '#000000', color: '#FFFFFF', rival: 'BC', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/providence_friars.png' },
  { id: 'UVM', ncaaConf: 'Hockey East', name: 'Vermont Catamounts', bg: '#005710', color: '#FFC72C', rival: 'UNH', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/vermont_catamounts.png' },

  // Big Ten
  { id: 'UMICH', ncaaConf: 'Big Ten', name: 'Michigan Wolverines', bg: '#00274C', color: '#FFCB05', rival: 'MSU', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/michigan_wolverines.png' },
  { id: 'MSU', ncaaConf: 'Big Ten', name: 'Michigan State Spartans', bg: '#18453B', color: '#FFFFFF', rival: 'UMICH', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/michigan_state_spartans.png' },
  { id: 'MINN', ncaaConf: 'Big Ten', name: 'Minnesota Golden Gophers', bg: '#7A0019', color: '#FFCC33', rival: 'WIS', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/minnesota_golden_gophers.png' },
  { id: 'ND', ncaaConf: 'Big Ten', name: 'Notre Dame Fighting Irish', bg: '#0C2340', color: '#C99700', rival: 'UMICH', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/notre_dame_fighting_irish.png' },
  { id: 'OSU', ncaaConf: 'Big Ten', name: 'Ohio State Buckeyes', bg: '#CE1126', color: '#666666', rival: 'UMICH', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/ohio_state_buckeyes.png' },
  { id: 'PSU', ncaaConf: 'Big Ten', name: 'Penn State Nittany Lions', bg: '#041E42', color: '#FFFFFF', rival: 'OSU', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/penn_state_nittany_lions.png' },
  { id: 'WIS', ncaaConf: 'Big Ten', name: 'Wisconsin Badgers', bg: '#C5050C', color: '#FFFFFF', rival: 'MINN', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/wisconsin_badgers.png' },

  // NCHC
  { id: 'CC', ncaaConf: 'NCHC', name: 'Colorado College Tigers', bg: '#000000', color: '#F3A900', rival: 'DU', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/colorado_college_tigers.png' },
  { id: 'DU', ncaaConf: 'NCHC', name: 'Denver Pioneers', bg: '#8B2332', color: '#8B6F4E', rival: 'CC', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/denver_pioneers.png' },
  { id: 'MIA', ncaaConf: 'NCHC', name: 'Miami RedHawks', bg: '#B61E2E', color: '#000000', rival: 'WMU', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/miami_redhawks.png' },
  { id: 'UMD', ncaaConf: 'NCHC', name: 'Minnesota Duluth Bulldogs', bg: '#7A0019', color: '#FFCC33', rival: 'MINN', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/minnesota-duluth_bulldogs.png' },
  { id: 'UND', ncaaConf: 'NCHC', name: 'North Dakota Fighting Hawks', bg: '#009A44', color: '#000000', rival: 'MINN', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/north_dakota_fighting_hawks.png' },
  { id: 'OMA', ncaaConf: 'NCHC', name: 'Omaha Mavericks', bg: '#000000', color: '#D71920', rival: 'UND', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/nebraska-omaha_mavericks.png' },
  { id: 'SCSU', ncaaConf: 'NCHC', name: 'St. Cloud State Huskies', bg: '#A10214', color: '#000000', rival: 'UMD', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/st__cloud_state_huskies.png' },
  { id: 'WMU', ncaaConf: 'NCHC', name: 'Western Michigan Broncos', bg: '#532E1C', color: '#F1B82D', rival: 'MIA', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/western_michigan_broncos.png' },

  // ECAC
  { id: 'BRN', ncaaConf: 'ECAC', name: 'Brown Bears', bg: '#4E3629', color: '#C00404', rival: 'YALE', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/brown_bears.png' },
  { id: 'CLK', ncaaConf: 'ECAC', name: 'Clarkson Golden Knights', bg: '#00553F', color: '#FFD204', rival: 'SLU', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/clarkson_golden_knights.png' },
  { id: 'COLG', ncaaConf: 'ECAC', name: 'Colgate Raiders', bg: '#821019', color: '#FFFFFF', rival: 'COR', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/colgate_raiders.png' },
  { id: 'COR', ncaaConf: 'ECAC', name: 'Cornell Big Red', bg: '#B31B1B', color: '#FFFFFF', rival: 'HAR', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/cornell_big_red.png' },
  { id: 'DAR', ncaaConf: 'ECAC', name: 'Dartmouth Big Green', bg: '#00693E', color: '#FFFFFF', rival: 'HAR', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/dartmouth_big_green.png' },
  { id: 'HAR', ncaaConf: 'ECAC', name: 'Harvard Crimson', bg: '#A51C30', color: '#FFFFFF', rival: 'YALE', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/harvard_crimson.png' },
  { id: 'PRI', ncaaConf: 'ECAC', name: 'Princeton Tigers', bg: '#FF6000', color: '#000000', rival: 'COR', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/princeton_tigers.png' },
  { id: 'QU', ncaaConf: 'ECAC', name: 'Quinnipiac Bobcats', bg: '#0A2240', color: '#EAAA00', rival: 'YALE', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/quinnipiac_bobcats.png' },
  { id: 'RPI', ncaaConf: 'ECAC', name: 'RPI Engineers', bg: '#E2231A', color: '#000000', rival: 'UNI', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/rpi_engineers.png' },
  { id: 'SLU', ncaaConf: 'ECAC', name: 'St. Lawrence Saints', bg: '#AF1E2D', color: '#41273B', rival: 'CLK', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/st__lawrence_saints.png' },
  { id: 'UNI', ncaaConf: 'ECAC', name: 'Union Garnet Chargers', bg: '#822433', color: '#FFFFFF', rival: 'RPI', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/union_garnet_chargers.png' },
  { id: 'YALE', ncaaConf: 'ECAC', name: 'Yale Bulldogs', bg: '#0F4D92', color: '#FFFFFF', rival: 'HAR', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/yale_bulldogs.png' },

  // CCHA
  { id: 'AUG', ncaaConf: 'CCHA', name: 'Augustana Vikings', bg: '#002D62', color: '#FFC72C', rival: 'BSU', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/augustana_vikings.png' },
  { id: 'BSU', ncaaConf: 'CCHA', name: 'Bemidji State Beavers', bg: '#004D44', color: '#FFFFFF', rival: 'MSU', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/bemidji_state_beavers.png' },
  { id: 'BGSU', ncaaConf: 'CCHA', name: 'Bowling Green Falcons', bg: '#4F2C1D', color: '#FF7300', rival: 'TOL', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/bowling_green_falcons.png' },
  { id: 'FSU', ncaaConf: 'CCHA', name: 'Ferris State Bulldogs', bg: '#BA0C2F', color: '#FFD100', rival: 'LSSU', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/ferris_state_bulldogs.png' },
  { id: 'LSSU', ncaaConf: 'CCHA', name: 'Lake Superior State Lakers', bg: '#003F87', color: '#FFC61E', rival: 'MTU', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/lake_superior_lakers.png' },
  { id: 'MTU', ncaaConf: 'CCHA', name: 'Michigan Tech Huskies', bg: '#000000', color: '#FFCD00', rival: 'NMU', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/michigan_tech_huskies.png' },
  { id: 'MSUM', ncaaConf: 'CCHA', name: 'Minnesota State Mavericks', bg: '#480059', color: '#F1E6B2', rival: 'BSU', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/minnesota_state_mavericks.png' },
  { id: 'NMU', ncaaConf: 'CCHA', name: 'Northern Michigan Wildcats', bg: '#005A3B', color: '#FFC72A', rival: 'MTU', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/northern_michigan_wildcats.png' },
  { id: 'STT', ncaaConf: 'CCHA', name: 'St. Thomas Tommies', bg: '#500000', color: '#999999', rival: 'MSUM', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/st__thomas_tommies.png' },

  // Atlantic Hockey
  { id: 'AFA', ncaaConf: 'Atlantic Hockey America', name: 'Air Force Falcons', bg: '#003087', color: '#8A8D8F', rival: 'ARMY', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/air_force_falcons.png' },
  { id: 'AIC', ncaaConf: 'Atlantic Hockey America', name: 'AIC Yellow Jackets', bg: '#000000', color: '#F2A900', rival: 'HC', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/american_international_yellowjackets.png' },
  { id: 'ARMY', ncaaConf: 'Atlantic Hockey America', name: 'Army Black Knights', bg: '#000000', color: '#D4BF91', rival: 'AFA', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/army_black_knights.png' },
  { id: 'BEN', ncaaConf: 'Atlantic Hockey America', name: 'Bentley Falcons', bg: '#005A8B', color: '#FFFFFF', rival: 'HC', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/bentley_falcons.png' },
  { id: 'CAN', ncaaConf: 'Atlantic Hockey America', name: 'Canisius Golden Griffins', bg: '#00274C', color: '#F2A900', rival: 'NIA', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/canisius_golden_griffins.png' },
  { id: 'HC', ncaaConf: 'Atlantic Hockey America', name: 'Holy Cross Crusaders', bg: '#602D89', color: '#FFFFFF', rival: 'BEN', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/holy_cross_crusaders.png' },
  { id: 'MERC', ncaaConf: 'Atlantic Hockey America', name: 'Mercyhurst Lakers', bg: '#005A3B', color: '#FFFFFF', rival: 'CAN', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/mercyhurst_lakers.png' },
  { id: 'NIAE', ncaaConf: 'Atlantic Hockey America', name: 'Niagara Purple Eagles', bg: '#582C83', color: '#FFFFFF', rival: 'CAN', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/niagara_purple_eagles.png' },
  { id: 'RIT', ncaaConf: 'Atlantic Hockey America', name: 'RIT Tigers', bg: '#F36E21', color: '#000000', rival: 'NIAE', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/rit_tigers.png' },
  { id: 'RMU', ncaaConf: 'Atlantic Hockey America', name: 'Robert Morris Colonials', bg: '#001E41', color: '#AA182C', rival: 'MERC', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/robert_morris_colonials.png' },
  { id: 'SHU', ncaaConf: 'Atlantic Hockey America', name: 'Sacred Heart Pioneers', bg: '#C8102E', color: '#C1C6C8', rival: 'QU', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/sacred_heart_pioneers.png' },

  // Independents
  { id: 'UAF', ncaaConf: 'Independent', name: 'Alaska Nanooks', bg: '#0047AB', color: '#F3D54E', rival: 'UAA', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/alaska_nanooks.png' },
  { id: 'UAA', ncaaConf: 'Independent', name: 'Alaska Anchorage Seawolves', bg: '#00583D', color: '#FFC425', rival: 'UAF', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/alaska-anchorage_seawolves.png' },
  { id: 'LIND', ncaaConf: 'Independent', name: 'Lindenwood Lions', bg: '#000000', color: '#B5A36A', rival: 'SHU', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/lindenwood_lions.png' },
  { id: 'STO', ncaaConf: 'Independent', name: 'Stonehill Skyhawks', bg: '#4B2682', color: '#FFFFFF', rival: 'MERC', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/stonehill_skyhawks.png' }
];

// ==========================================
// 8. SHL TEAMS (SWEDEN)
// ==========================================
export const shlTeams = [
  { id: 'LHF', city: 'Luleå', name: 'HF', bg: '#C8102E', color: '#FFB81C', rival: 'SAIK', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/lule%C3%A5_hf.png' },
  { id: 'SAIK', city: 'Skellefteå', name: 'AIK', bg: '#000000', color: '#FFB81C', rival: 'LHF', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/skellefte%C3%A5_aik.png' },
  { id: 'FBK', city: 'Färjestad', name: 'BK', bg: '#00471B', color: '#FFB81C', rival: 'FHC', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/f%C3%A4rjestads_bk.png' },
  { id: 'FHC', city: 'Frölunda', name: 'HC', bg: '#C8102E', color: '#00471B', rival: 'FBK', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/fr%C3%B6lunda_hc.png' },
  { id: 'VHK', city: 'Växjö', name: 'Lakers', bg: '#00205B', color: '#F26522', rival: 'RBK', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/v%C3%A4xj%C3%B6_lakers_hc.png' },
  { id: 'RBK', city: 'Rögle', name: 'BK', bg: '#00471B', color: '#FFFFFF', rival: 'MIF', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/r%C3%B6gle_bk.png' },
  { id: 'LIF', city: 'Leksands', name: 'IF', bg: '#00205B', color: '#FFFFFF', rival: 'MIF', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/leksands_if.png' },
  { id: 'MIF', city: 'Malmö', name: 'Redhawks', bg: '#000000', color: '#C8102E', rival: 'RBK', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/if_malm%C3%B6_redhawks.png' },
  { id: 'LHC', city: 'Linköping', name: 'HC', bg: '#00205B', color: '#C8102E', rival: 'HV71', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/link%C3%B6ping_hc.png' },
  { id: 'OHK', city: 'Örebro', name: 'HK', bg: '#C8102E', color: '#000000', rival: 'TIK', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/%C3%B6rebro_hk.png' },
  { id: 'TIK', city: 'Timrå', name: 'IK', bg: '#C8102E', color: '#FFFFFF', rival: 'OHK', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/timr%C3%A5_ik.png' },
  { id: 'HV71', city: 'HV71', name: 'Jönköping', bg: '#00205B', color: '#FFB81C', rival: 'LHC', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/hv71.png' },
  { id: 'BIF', city: 'Brynäs', name: 'IF', bg: '#000000', color: '#C8102E', rival: 'LIF', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/bryn%C3%A4s_if.png' },
  { id: 'MODO', city: 'MoDo', name: 'Hockey', bg: '#C8102E', color: '#00471B', rival: 'SAIK', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/modo_hockey.png' }
];

// ==========================================
// 9. LIIGA TEAMS (FINLAND)
// ==========================================
export const liigaTeams = [
  { id: 'TAP', city: 'Tappara', name: 'Tampere', bg: '#00205B', color: '#F26522', rival: 'ILK', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/tampere_tappara.png' },
  { id: 'ILK', city: 'Ilves', name: 'Tampere', bg: '#00471B', color: '#FFB81C', rival: 'TAP', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/tampere_ilves.png' },
  { id: 'HIFK', city: 'HIFK', name: 'Helsinki', bg: '#C8102E', color: '#00205B', rival: 'TPS', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/helsinki_hifk.png' },
  { id: 'KAR', city: 'Kärpät', name: 'Oulu', bg: '#000000', color: '#FFB81C', rival: 'TAP', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/oulu_k%C3%A4rp%C3%A4t.png' },
  { id: 'TPS', city: 'TPS', name: 'Turku', bg: '#000000', color: '#FFFFFF', rival: 'HIFK', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/turku_tps.png' },
  { id: 'LUK', city: 'Lukko', name: 'Rauma', bg: '#00205B', color: '#FFB81C', rival: 'TPS', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/rauma_lukko.png' },
  { id: 'KAL', city: 'KalPa', name: 'Kuopio', bg: '#FFB81C', color: '#000000', rival: 'JYP', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/kuopio_kalpa.png' },
  { id: 'PEL', city: 'Pelicans', name: 'Lahti', bg: '#00205B', color: '#F26522', rival: 'HIFK', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/lahti_pelicans.png' },
  { id: 'KOO', city: 'KooKoo', name: 'Kouvola', bg: '#000000', color: '#F26522', rival: 'PEL', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/kouvola_kookoo.png' },
  { id: 'HPK', city: 'HPK', name: 'Hämeenlinna', bg: '#F26522', color: '#00205B', rival: 'TAP', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/h%C3%A4meenlinna_hpk.png' },
  { id: 'JYP', city: 'JYP', name: 'Jyväskylä', bg: '#C8102E', color: '#000000', rival: 'KAL', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/jyv%C3%A4skyl%C3%A4_jyp.png' },
  { id: 'SAI', city: 'SaiPa', name: 'Lappeenranta', bg: '#FFB81C', color: '#000000', rival: 'KOO', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/lappeenranta_saipa.png' },
  { id: 'JUK', city: 'Jukurit', name: 'Mikkeli', bg: '#00205B', color: '#FFB81C', rival: 'KAL', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/jukurit_mikkeli.png' },
  { id: 'SPO', city: 'Sport', name: 'Vaasa', bg: '#C8102E', color: '#FFB81C', rival: 'KAR', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/vaasa_sport.png' },
  { id: 'AKH', city: 'Kiekko-Espoo', name: 'Espoo', bg: '#00205B', color: '#FFB81C', rival: 'HIFK', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/kiekko-espoo.png' }
];

// ==========================================
// 10. ECHL TEAMS
// ==========================================
export const echlTeams = [
  { id: 'ADK', conf: 'East', div: 'North', city: 'Adirondack', name: 'Thunder', bg: '#C8102E', color: '#000000', rival: 'WOR', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/adirondack_thunder.png' },
  { id: 'MNE', conf: 'East', div: 'North', city: 'Maine', name: 'Mariners', bg: '#041E42', color: '#64A70B', rival: 'WOR', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/maine_mariners.png' },
  { id: 'NOR', conf: 'East', div: 'North', city: 'Norfolk', name: 'Admirals', bg: '#002855', color: '#F2A900', rival: 'REA', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/norfolk_admirals.png' },
  { id: 'REA', conf: 'East', div: 'North', city: 'Reading', name: 'Royals', bg: '#4F2683', color: '#B3A369', rival: 'NOR', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/reading_royals.png' },
  { id: 'TR',  conf: 'East', div: 'North', city: 'Trois-Rivières', name: 'Lions', bg: '#00205B', color: '#FFFFFF', rival: 'MNE', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/trois-rivi%C3%A8res_lions.png' },
  { id: 'WOR', conf: 'East', div: 'North', city: 'Worcester', name: 'Railers', bg: '#00205B', color: '#708090', rival: 'ADK', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/worcester_railers.png' },
  { id: 'ATL', conf: 'East', div: 'South', city: 'Atlanta', name: 'Gladiators', bg: '#002D62', color: '#F2A900', rival: 'SC', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/atlanta_gladiators.png' },
  { id: 'FLA', conf: 'East', div: 'South', city: 'Florida', name: 'Everblades', bg: '#00471B', color: '#00205B', rival: 'ORL', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/florida_everblades.png' },
  { id: 'GRN', conf: 'East', div: 'South', city: 'Greenville', name: 'Swamp Rabbits', bg: '#002855', color: '#FFB81C', rival: 'SC', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/greenville_swamp_rabbits.png' },
  { id: 'JAX', conf: 'East', div: 'South', city: 'Jacksonville', name: 'Icemen', bg: '#00205B', color: '#00B2E1', rival: 'ORL', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/jacksonville_icemen.png' },
  { id: 'ORL', conf: 'East', div: 'South', city: 'Orlando', name: 'Solar Bears', bg: '#00205B', color: '#00B2E1', rival: 'FLA', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/orlando_solar_bears.png' },
  { id: 'SAV', conf: 'East', div: 'South', city: 'Savannah', name: 'Ghost Pirates', bg: '#000000', color: '#00B2E1', rival: 'JAX', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/savannah_ghost_pirates.png' },
  { id: 'SC',  conf: 'East', div: 'South', city: 'South Carolina', name: 'Stingrays', bg: '#041E42', color: '#C8102E', rival: 'ATL', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/south_carolina_stingrays.png' },
  { id: 'CIN', conf: 'West', div: 'Central', city: 'Cincinnati', name: 'Cyclones', bg: '#000000', color: '#C8102E', rival: 'TOL', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/cincinnati_cyclones.png' },
  { id: 'FW',  conf: 'West', div: 'Central', city: 'Fort Wayne', name: 'Komets', bg: '#F26522', color: '#000000', rival: 'TOL', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/fort_wayne_komets.png' },
  { id: 'IND', conf: 'West', div: 'Central', city: 'Indy', name: 'Fuel', bg: '#C8102E', color: '#000000', rival: 'CIN', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/indy_fuel.png' },
  { id: 'IOW', conf: 'West', div: 'Central', city: 'Iowa', name: 'Heartlanders', bg: '#000000', color: '#FFB81C', rival: 'KAL', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/iowa_heartlanders.png' },
  { id: 'KAL', conf: 'West', div: 'Central', city: 'Kalamazoo', name: 'Wings', bg: '#00471B', color: '#C8102E', rival: 'TOL', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/kalamazoo_wings.png' },
  { id: 'TOL', conf: 'West', div: 'Central', city: 'Toledo', name: 'Walleye', bg: '#00205B', color: '#FFB81C', rival: 'FW', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/toledo_walleye.png' },
  { id: 'WHL', conf: 'West', div: 'Central', city: 'Wheeling', name: 'Nailers', bg: '#000000', color: '#FFB81C', rival: 'CIN', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/wheeling_nailers.png' },
  { id: 'ALN', conf: 'West', div: 'Mountain', city: 'Allen', name: 'Americans', bg: '#C8102E', color: '#00205B', rival: 'TUL', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/allen_americans.png' },
  { id: 'IDH', conf: 'West', div: 'Mountain', city: 'Idaho', name: 'Steelheads', bg: '#000000', color: '#A2AAAD', rival: 'UTA', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/idaho_steelheads.png' },
  { id: 'KC',  conf: 'West', div: 'Mountain', city: 'Kansas City', name: 'Mavericks', bg: '#000000', color: '#F26522', rival: 'WIC', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/kansas_city_mavericks.png' },
  { id: 'RC',  conf: 'West', div: 'Mountain', city: 'Rapid City', name: 'Rush', bg: '#C8102E', color: '#000000', rival: 'IDH', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/rapid_city_rush.png' },
  { id: 'TAH', conf: 'West', div: 'Mountain', city: 'Tahoe', name: 'Knight Monsters', bg: '#000000', color: '#B3A369', rival: 'IDH', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/tahoe_knight_monsters.png' },
  { id: 'TUL', conf: 'West', div: 'Mountain', city: 'Tulsa', name: 'Oilers', bg: '#00205B', color: '#C8102E', rival: 'WIC', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/tulsa_oilers.png' },
  { id: 'UTA', conf: 'West', div: 'Mountain', city: 'Utah', name: 'Grizzlies', bg: '#00471B', color: '#000000', rival: 'IDH', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/utah_grizzlies.png' },
  { id: 'WIC', conf: 'West', div: 'Mountain', city: 'Wichita', name: 'Thunder', bg: '#00205B', color: '#A2AAAD', rival: 'TUL', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/wichita_thunder.png' }
];

// ==========================================
// 11. KHL TEAMS
// ==========================================
export const khlTeams = [
  { id: 'CSKA', conf: 'West', div: 'Tarasov', city: 'Moscow', name: 'CSKA', bg: '#C8102E', color: '#00205B', rival: 'SKA', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/moscow_cska.png' },
  { id: 'SKA',  conf: 'West', div: 'Bobrov', city: 'St. Petersburg', name: 'SKA', bg: '#00205B', color: '#C8102E', rival: 'CSKA', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/ska_st__petersburg_u14.png' },
  { id: 'DYN',  conf: 'West', div: 'Tarasov', city: 'Moscow', name: 'Dynamo', bg: '#00539B', color: '#FFFFFF', rival: 'CSKA', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/moscow_dynamo.png' },
  { id: 'LOK',  conf: 'West', div: 'Tarasov', city: 'Yaroslavl', name: 'Lokomotiv', bg: '#C8102E', color: '#00205B', rival: 'SKA', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/Yaroslavl_Lokomotiv.png' },
  { id: 'SPA',  conf: 'West', div: 'Bobrov', city: 'Moscow', name: 'Spartak', bg: '#C8102E', color: '#FFFFFF', rival: 'DYN', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/moscow_mhk_spartak.png' },
  { id: 'SEV',  conf: 'West', div: 'Tarasov', city: 'Cherepovets', name: 'Severstal', bg: '#000000', color: '#FFB81C', rival: 'LOK', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/Cherepovets_Severstal.png' },
  { id: 'TOR',  conf: 'West', div: 'Bobrov', city: 'Nizhny Novgorod', name: 'Torpedo', bg: '#00205B', color: '#C8102E', rival: 'VIT', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/nizhny_novgorod_torpedo.png' },
  { id: 'VIT',  conf: 'West', div: 'Bobrov', city: 'Moscow Region', name: 'Vityaz', bg: '#C8102E', color: '#FFFFFF', rival: 'TOR', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/moscow_region_vityaz.png' },
  { id: 'SOC',  conf: 'West', div: 'Bobrov', city: 'Sochi', name: 'HC Sochi', bg: '#00205B', color: '#FFB81C', rival: 'SKA', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/hc_sochi.png' },
  { id: 'MIN',  conf: 'West', div: 'Tarasov', city: 'Minsk', name: 'Dinamo', bg: '#00B2E1', color: '#FFFFFF', rival: 'DYN', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/minsk_dinamo.png' },
  { id: 'AKB',  conf: 'East', div: 'Kharlamov', city: 'Kazan', name: 'Ak Bars', bg: '#00471B', color: '#C8102E', rival: 'SAL', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/kazan_ak_bars.png' },
  { id: 'AVA',  conf: 'East', div: 'Chernyshev', city: 'Omsk', name: 'Avangard', bg: '#C8102E', color: '#000000', rival: 'MET', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/omsk_avangard.png' },
  { id: 'MET',  conf: 'East', div: 'Kharlamov', city: 'Magnitogorsk', name: 'Metallurg', bg: '#00205B', color: '#C8102E', rival: 'TRA', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/magnitogorsk_metallurg.png' },
  { id: 'SAL',  conf: 'East', div: 'Chernyshev', city: 'Ufa', name: 'Salavat Yulaev', bg: '#00471B', color: '#FFFFFF', rival: 'AKB', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/ufa_salavat_yulaev.png' },
  { id: 'TRA',  conf: 'East', div: 'Kharlamov', city: 'Chelyabinsk', name: 'Traktor', bg: '#000000', color: '#FFFFFF', rival: 'MET', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/chelyabinsk_traktor.png' },
  { id: 'AVT',  conf: 'East', div: 'Kharlamov', city: 'Yekaterinburg', name: 'Avtomobilist', bg: '#C8102E', color: '#000000', rival: 'TRA', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/yekaterinburg_avtomobilist.png' },
  { id: 'SIB',  conf: 'East', div: 'Chernyshev', city: 'Novosibirsk', name: 'Sibir', bg: '#00539B', color: '#FFFFFF', rival: 'AVA', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/novosibirsk_sibir.png' },
  { id: 'NEF',  conf: 'East', div: 'Kharlamov', city: 'Nizhnekamsk', name: 'Neftekhimik', bg: '#00539B', color: '#FFFFFF', rival: 'AKB', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/nizhnekamsk_neftekhimik.png' },
  { id: 'AMU',  conf: 'East', div: 'Chernyshev', city: 'Khabarovsk', name: 'Amur', bg: '#F26522', color: '#000000', rival: 'ADM', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/khabarovsk_amur.png' },
  { id: 'ADM',  conf: 'East', div: 'Chernyshev', city: 'Vladivostok', name: 'Admiral', bg: '#000000', color: '#F26522', rival: 'AMU', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/vladivostok_admiral.png' },
  { id: 'BAR',  conf: 'East', div: 'Chernyshev', city: 'Astana', name: 'Barys', bg: '#00539B', color: '#FFB81C', rival: 'AVA', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/astana_barys.png' },
  { id: 'KUN',  conf: 'East', div: 'Bobrov', city: 'Beijing', name: 'Kunlun Red Star', bg: '#C8102E', color: '#FFB81C', rival: 'AMU', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/Kunlun_Red_Star.png' },
  { id: 'LAD',  conf: 'East', div: 'Kharlamov', city: 'Togliatti', name: 'Lada', bg: '#00539B', color: '#FFFFFF', rival: 'NEF', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/togliatti_lada.png' }
];

// ==========================================
// 12. SWISS LEAGUE (National League)
// ==========================================
export const swissTeams = [
  { id: 'ZSC', city: 'Zürich', name: 'ZSC Lions', bg: '#00205B', color: '#C8102E', rival: 'KLO', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/zsc_lions.png' },
  { id: 'BERN', city: 'Bern', name: 'SC Bern', bg: '#000000', color: '#FFB81C', rival: 'BIE', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/sc_bern.png' },
  { id: 'DAV', city: 'Davos', name: 'HC Davos', bg: '#00539B', color: '#FFB81C', rival: 'ZSC', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/hc_davos.png' },
  { id: 'ZUG', city: 'Zug', name: 'EV Zug', bg: '#00205B', color: '#FFFFFF', rival: 'ZSC', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/ev_zug.png' },
  { id: 'LUG', city: 'Lugano', name: 'HC Lugano', bg: '#000000', color: '#FFB81C', rival: 'AMB', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/hc_lugano.png' },
  { id: 'FRI', city: 'Fribourg', name: 'Fribourg-Gottéron', bg: '#000000', color: '#FFFFFF', rival: 'BERN', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/hc_fribourg-gott%C3%A9ron.png' },
  { id: 'GEN', city: 'Geneva', name: 'Genève-Servette HC', bg: '#862633', color: '#FFB81C', rival: 'LAU', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/gen%C3%A8ve-servette_hc.png' },
  { id: 'LAU', city: 'Lausanne', name: 'Lausanne HC', bg: '#C8102E', color: '#FFFFFF', rival: 'GEN', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/lausanne_hc.png' },
  { id: 'BIE', city: 'Biel', name: 'EHC Biel-Bienne', bg: '#C8102E', color: '#FFB81C', rival: 'BERN', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/ehc_biel.png' },
  { id: 'AMB', city: 'Ambrì', name: 'HC Ambrì-Piotta', bg: '#00205B', color: '#FFFFFF', rival: 'LUG', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/hc_ambr%C3%AC-piotta.png' },
  { id: 'RAP', city: 'Rapperswil', name: 'SC Rapperswil-Jona Lakers', bg: '#C8102E', color: '#00539B', rival: 'ZSC', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/sc_rapperswil-jona_lakers.png' },
  { id: 'SCL', city: 'Langnau', name: 'SCL Tigers', bg: '#C8102E', color: '#FFB81C', rival: 'BERN', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/sc_langnau_tigers.png' },
  { id: 'KLO', city: 'Kloten', name: 'EHC Kloten', bg: '#00205B', color: '#C8102E', rival: 'ZSC', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/ehc_kloten.png' },
  { id: 'AJO', city: 'Porrentruy', name: 'HC Ajoie', bg: '#000000', color: '#FFB81C', rival: 'BIE', logo: 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/hc_ajoie.png' }
];

// ==========================================
// 13. BCHL TEAMS (Junior A)
// ==========================================
export const bchlTeams = [
  { id: 'PEN', conf: 'Interior', city: 'Penticton', name: 'Vees', bg: '#00205B', color: '#FFFFFF', rival: 'VER' },
  { id: 'VER', conf: 'Interior', city: 'Vernon', name: 'Vipers', bg: '#041E42', color: '#F2A900', rival: 'PEN' },
  { id: 'SAL', conf: 'Interior', city: 'Salmon Arm', name: 'Silverbacks', bg: '#000000', color: '#C8102E', rival: 'VER' },
  { id: 'CHI', conf: 'Coastal', city: 'Chilliwack', name: 'Chiefs', bg: '#622438', color: '#D4AF37', rival: 'SUR' },
  { id: 'SUR', conf: 'Coastal', city: 'Surrey', name: 'Eagles', bg: '#00471B', color: '#FFFFFF', rival: 'CHI' },
  { id: 'NAN', conf: 'Coastal', city: 'Nanaimo', name: 'Clippers', bg: '#F26522', color: '#000000', rival: 'VIC' },
  { id: 'VIC', conf: 'Coastal', city: 'Victoria', name: 'Grizzlies', bg: '#000000', color: '#FFB81C', rival: 'NAN' },
  { id: 'ALB', conf: 'Coastal', city: 'Alberni Valley', name: 'Bulldogs', bg: '#00205B', color: '#C8102E', rival: 'NAN' }
];

// ==========================================
// 14. SPHL TEAMS (Grinder Pro)
// ==========================================
export const sphlTeams = [
  { id: 'PEO', city: 'Peoria', name: 'Rivermen', bg: '#00205B', color: '#FFB81C', rival: 'ROA' },
  { id: 'ROA', city: 'Roanoke', name: 'Rail Yard Dawgs', bg: '#000000', color: '#C8102E', rival: 'PEO' },
  { id: 'HSV', city: 'Huntsville', name: 'Havoc', bg: '#000000', color: '#C8102E', rival: 'KNO' },
  { id: 'KNO', city: 'Knoxville', name: 'Ice Bears', bg: '#582C83', color: '#FFFFFF', rival: 'HSV' },
  { id: 'PEN', city: 'Pensacola', name: 'Ice Flyers', bg: '#00205B', color: '#88D0F6', rival: 'MAC' },
  { id: 'MAC', city: 'Macon', name: 'Mayhem', bg: '#C8102E', color: '#00205B', rival: 'PEN' }
];

// ==========================================
// 15. CZECH EXTRALIGA TEAMS
// ==========================================
export const czechTeams = [
  { id: 'SPA', city: 'Prague', name: 'HC Sparta', bg: '#862633', color: '#FFB81C', rival: 'KOM' },
  { id: 'TRI', city: 'Třinec', name: 'HC Oceláři', bg: '#C8102E', color: '#FFFFFF', rival: 'VIT' },
  { id: 'PCE', city: 'Pardubice', name: 'HC Dynamo', bg: '#C8102E', color: '#FFFFFF', rival: 'MHK' },
  { id: 'KOM', city: 'Brno', name: 'HC Kometa', bg: '#00205B', color: '#FFFFFF', rival: 'SPA' },
  { id: 'VIT', city: 'Ostrava', name: 'HC Vítkovice', bg: '#00205B', color: '#88D0F6', rival: 'TRI' },
  { id: 'LIB', city: 'Liberec', name: 'Bílí Tygři', bg: '#00205B', color: '#FFFFFF', rival: 'MBL' },
  { id: 'MHK', city: 'Hradec Králové', name: 'Mountfield HK', bg: '#000000', color: '#C8102E', rival: 'PCE' },
  { id: 'PLZ', city: 'Plzeň', name: 'HC Škoda', bg: '#00205B', color: '#FFFFFF', rival: 'KVA' }
];

// ==========================================
// 16. SLOVAK EXTRALIGA TEAMS
// ==========================================
export const slovakTeams = [
  { id: 'SLO', city: 'Bratislava', name: 'HC Slovan', bg: '#00205B', color: '#C8102E', rival: 'KOS' },
  { id: 'KOS', city: 'Košice', name: 'HC Košice', bg: '#F26522', color: '#000000', rival: 'SLO' },
  { id: 'ZVO', city: 'Zvolen', name: 'HKM Zvolen', bg: '#C8102E', color: '#00205B', rival: 'BBY' },
  { id: 'POP', city: 'Poprad', name: 'HK Poprad', bg: '#00205B', color: '#FFFFFF', rival: 'SNV' },
  { id: 'NIT', city: 'Nitra', name: 'HK Nitra', bg: '#00205B', color: '#FFFFFF', rival: 'NZA' },
  { id: 'BBY', city: 'Banská Bystrica', name: 'HC 05', bg: '#C8102E', color: '#FFFFFF', rival: 'ZVO' },
  { id: 'DUC', city: 'Michalovce', name: 'HK Dukla', bg: '#F26522', color: '#000000', rival: 'KOS' }
];

// ==========================================
// 17. DEL (GERMANY)
// ==========================================
export const delTeams = [
  { id: 'BER', city: 'Berlin', name: 'Eisbären', bg: '#00205B', color: '#C8102E', rival: 'RBM' },
  { id: 'RBM', city: 'München', name: 'Red Bull', bg: '#00205B', color: '#E32636', rival: 'BER' },
  { id: 'MAN', city: 'Mannheim', name: 'Adler', bg: '#00205B', color: '#FFFFFF', rival: 'KOL' },
  { id: 'KOL', city: 'Köln', name: 'Haie', bg: '#C8102E', color: '#000000', rival: 'DEG' },
  { id: 'DEG', city: 'Düsseldorf', name: 'EG', bg: '#FFB81C', color: '#C8102E', rival: 'KOL' },
  { id: 'ING', city: 'Ingolstadt', name: 'ERC', bg: '#00205B', color: '#FFFFFF', rival: 'AUG' },
  { id: 'STR', city: 'Straubing', name: 'Tigers', bg: '#00205B', color: '#FFFFFF', rival: 'NUR' },
  { id: 'WOL', city: 'Wolfsburg', name: 'Grizzlys', bg: '#F26522', color: '#000000', rival: 'BRE' },
  { id: 'BRE', city: 'Bremerhaven', name: 'Pinguins', bg: '#C8102E', color: '#000000', rival: 'WOL' },
  { id: 'NUR', city: 'Nürnberg', name: 'Ice Tigers', bg: '#C8102E', color: '#00205B', rival: 'STR' },
  { id: 'AUG', city: 'Augsburg', name: 'Panther', bg: '#00471B', color: '#C8102E', rival: 'ING' },
  { id: 'SWW', city: 'Schwenningen', name: 'Wild Wings', bg: '#00205B', color: '#FFFFFF', rival: 'MAN' },
  { id: 'FRA', city: 'Frankfurt', name: 'Löwen', bg: '#F26522', color: '#000000', rival: 'MAN' },
  { id: 'ISE', city: 'Iserlohn', name: 'Roosters', bg: '#00205B', color: '#FFFFFF', rival: 'DEG' }
];

// ==========================================
// 18. ICEHL (AUSTRIA & CENTRAL EUROPE)
// ==========================================
export const icehlTeams = [
  { id: 'RBS', city: 'Salzburg', name: 'Red Bull', bg: '#00205B', color: '#E32636', rival: 'VIC' },
  { id: 'KAC', city: 'Klagenfurt', name: 'EC-KAC', bg: '#C8102E', color: '#FFFFFF', rival: 'VSV' },
  { id: 'VSV', city: 'Villach', name: 'EC VSV', bg: '#00205B', color: '#FFFFFF', rival: 'KAC' },
  { id: 'VIC', city: 'Vienna', name: 'Capitals', bg: '#FFB81C', color: '#000000', rival: 'RBS' },
  { id: 'HCB', city: 'Bolzano', name: 'Foxes', bg: '#C8102E', color: '#FFFFFF', rival: 'PUS' },
  { id: 'PUS', city: 'Bruneck', name: 'Pustertal', bg: '#FFB81C', color: '#000000', rival: 'HCB' },
  { id: 'INN', city: 'Innsbruck', name: 'Die Haie', bg: '#C8102E', color: '#000000', rival: 'PIO' },
  { id: 'BWL', city: 'Linz', name: 'Black Wings', bg: '#000000', color: '#F26522', rival: 'VIC' },
  { id: 'G99', city: 'Graz', name: '99ers', bg: '#F26522', color: '#000000', rival: 'BWL' },
  { id: 'PIO', city: 'Vorarlberg', name: 'Pioneers', bg: '#C8102E', color: '#FFFFFF', rival: 'INN' },
  { id: 'OLI', city: 'Ljubljana', name: 'Olimpija', bg: '#00471B', color: '#FFFFFF', rival: 'FEH' },
  { id: 'FEH', city: 'Székesfehérvár', name: 'AV19', bg: '#00205B', color: '#FFFFFF', rival: 'OLI' },
  { id: 'ASI', city: 'Asiago', name: 'Hockey', bg: '#FFB81C', color: '#C8102E', rival: 'HCB' }
];

// ==========================================
// HELPER FUNCTIONS
// ==========================================

export const getTeamData = (teamId, league) => {
  if (!teamId) return null;
  const pool = getOpponentPool(league);
  return pool.find(t => t.id === teamId) || { id: teamId, name: teamId, bg: '#101410', color: '#FFFFFF' };
};

export const getOpponentPool = (league) => {
  switch (league) {
    case 'NHL': return nhlTeams;
    case 'AHL': return ahlTeams;
    case 'ECHL': return echlTeams;
    case 'OHL': return ohlTeams;
    case 'WHL': return whlTeams;
    case 'QMJHL': return qmjhlTeams;
    case 'USHL': return ushlTeams;
    case 'NCAA': return ncaaTeams;
    case 'SHL': return shlTeams;
    case 'LIIGA': return liigaTeams;
    case 'KHL': return khlTeams;
    case 'SWISS': return swissTeams;
    case 'DEL': return delTeams;
    case 'ICEHL': return icehlTeams;
    case 'BCHL': return bchlTeams;
    case 'SPHL': return sphlTeams;
    case 'CZECH': return czechTeams;
    case 'SLOVAK': return slovakTeams;
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