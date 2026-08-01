// --- NHL & AHL ---
export export const nhlTeams = [
  { id: 'ANA', name: 'Anaheim Ducks', city: 'Anaheim', bg: '#F47A38', color: '#000000', ahlId: 'SDG', conf: 'Western', div: 'Pacific' },
  { id: 'BOS', name: 'Boston Bruins', city: 'Boston', bg: '#FFB81C', color: '#000000', ahlId: 'PRO', conf: 'Eastern', div: 'Atlantic' },
  { id: 'BUF', name: 'Buffalo Sabres', city: 'Buffalo', bg: '#002654', color: '#FCB514', ahlId: 'ROC', conf: 'Eastern', div: 'Atlantic' },
  { id: 'CGY', name: 'Calgary Flames', city: 'Calgary', bg: '#C8102E', color: '#F1BE48', ahlId: 'WRN', conf: 'Western', div: 'Pacific' },
  { id: 'CAR', name: 'Carolina Hurricanes', city: 'Carolina', bg: '#CC0000', color: '#000000', ahlId: 'CHI', conf: 'Eastern', div: 'Metropolitan' },
  { id: 'CHI', name: 'Chicago Blackhawks', city: 'Chicago', bg: '#CF0A2C', color: '#000000', ahlId: 'RFD', conf: 'Western', div: 'Central' },
  { id: 'COL', name: 'Colorado Avalanche', city: 'Colorado', bg: '#6F263D', color: '#236192', ahlId: 'EAG', conf: 'Western', div: 'Central' },
  { id: 'CBJ', name: 'Columbus Blue Jackets', city: 'Columbus', bg: '#002654', color: '#CE1126', ahlId: 'CLE', conf: 'Eastern', div: 'Metropolitan' },
  { id: 'DAL', name: 'Dallas Stars', city: 'Dallas', bg: '#006847', color: '#8F8F8C', ahlId: 'TEX', conf: 'Western', div: 'Central' },
  { id: 'DET', name: 'Detroit Red Wings', city: 'Detroit', bg: '#CE1126', color: '#FFFFFF', ahlId: 'GRG', conf: 'Eastern', div: 'Atlantic' },
  { id: 'EDM', name: 'Edmonton Oilers', city: 'Edmonton', bg: '#041E42', color: '#FF4C00', ahlId: 'BAK', conf: 'Western', div: 'Pacific' },
  { id: 'FLA', name: 'Florida Panthers', city: 'Florida', bg: '#041E42', color: '#C8102E', ahlId: 'CHA', conf: 'Eastern', div: 'Atlantic' },
  { id: 'LAK', name: 'Los Angeles Kings', city: 'Los Angeles', bg: '#111111', color: '#A2AAAD', ahlId: 'ONT', conf: 'Western', div: 'Pacific' },
  { id: 'MIN', name: 'Minnesota Wild', city: 'Minnesota', bg: '#154734', color: '#A6192E', ahlId: 'IOW', conf: 'Western', div: 'Central' },
  { id: 'MTL', name: 'Montreal Canadiens', city: 'Montreal', bg: '#AF1E2D', color: '#192168', ahlId: 'LAV', conf: 'Eastern', div: 'Atlantic' },
  { id: 'NSH', name: 'Nashville Predators', city: 'Nashville', bg: '#FFB81C', color: '#041E42', ahlId: 'MIL', conf: 'Western', div: 'Central' },
  { id: 'NJD', name: 'New Jersey Devils', city: 'New Jersey', bg: '#CE1126', color: '#000000', ahlId: 'UTI', conf: 'Eastern', div: 'Metropolitan' },
  { id: 'NYI', name: 'New York Islanders', city: 'New York', bg: '#00539B', color: '#F47D30', ahlId: 'BRI', conf: 'Eastern', div: 'Metropolitan' },
  { id: 'NYR', name: 'New York Rangers', city: 'New York', bg: '#0038A8', color: '#CE1126', ahlId: 'HFD', conf: 'Eastern', div: 'Metropolitan' },
  { id: 'OTT', name: 'Ottawa Senators', city: 'Ottawa', bg: '#C52032', color: '#000000', ahlId: 'BEL', conf: 'Eastern', div: 'Atlantic' },
  { id: 'PHI', name: 'Philadelphia Flyers', city: 'Philadelphia', bg: '#F74902', color: '#000000', ahlId: 'LHV', conf: 'Eastern', div: 'Metropolitan' },
  { id: 'PIT', name: 'Pittsburgh Penguins', city: 'Pittsburgh', bg: '#000000', color: '#CFC493', ahlId: 'WBS', conf: 'Eastern', div: 'Metropolitan' },
  { id: 'SJS', name: 'San Jose Sharks', city: 'San Jose', bg: '#006D75', color: '#EA7200', ahlId: 'SJB', conf: 'Western', div: 'Pacific' },
  { id: 'SEA', name: 'Seattle Kraken', city: 'Seattle', bg: '#001628', color: '#99D9D9', ahlId: 'CVF', conf: 'Western', div: 'Pacific' },
  { id: 'STL', name: 'St. Louis Blues', city: 'St. Louis', bg: '#002F87', color: '#FCB514', ahlId: 'SPR', conf: 'Western', div: 'Central' },
  { id: 'TBL', name: 'Tampa Bay Lightning', city: 'Tampa Bay', bg: '#002868', color: '#FFFFFF', ahlId: 'SYR', conf: 'Eastern', div: 'Atlantic' },
  { id: 'TOR', name: 'Toronto Maple Leafs', city: 'Toronto', bg: '#00205B', color: '#FFFFFF', ahlId: 'MAR', conf: 'Eastern', div: 'Atlantic' },
  { id: 'UTA', name: 'Utah Hockey Club', city: 'Utah', bg: '#010101', color: '#6eaddc', ahlId: 'TUC', conf: 'Western', div: 'Central' },
  { id: 'VAN', name: 'Vancouver Canucks', city: 'Vancouver', bg: '#00205B', color: '#00843D', ahlId: 'ABB', conf: 'Western', div: 'Pacific' },
  { id: 'VGK', name: 'Vegas Golden Knights', city: 'Vegas', bg: '#B4975A', color: '#333F42', ahlId: 'HSK', conf: 'Western', div: 'Pacific' },
  { id: 'WSH', name: 'Washington Capitals', city: 'Washington', bg: '#041E42', color: '#C8102E', ahlId: 'HER', conf: 'Eastern', div: 'Metropolitan' },
  { id: 'WPG', name: 'Winnipeg Jets', city: 'Winnipeg', bg: '#041E42', color: '#004C97', ahlId: 'MAN', conf: 'Western', div: 'Central' }
];

export const ahlTeams = nhlTeams.map(t => ({ id: t.ahlId, name: `${t.city} (AHL)`, bg: t.bg, color: t.color }));

// --- THE 60 CHL TEAMS ---
export const ohlTeams = [
  { id: 'BAR', name: 'Barrie Colts', city: 'Barrie', bg: '#000000', color: '#c8102e' },
  { id: 'BFD', name: 'Brantford Bulldogs', city: 'Brantford', bg: '#000000', color: '#f2a900' },
  { id: 'ERI', name: 'Erie Otters', city: 'Erie', bg: '#00205b', color: '#fdd023' },
  { id: 'FLN', name: 'Flint Firebirds', city: 'Flint', bg: '#00205b', color: '#f47920' },
  { id: 'GUE', name: 'Guelph Storm', city: 'Guelph', bg: '#9e1b32', color: '#000000' },
  { id: 'KGN', name: 'Kingston Frontenacs', city: 'Kingston', bg: '#000000', color: '#f2a900' },
  { id: 'KIT', name: 'Kitchener Rangers', city: 'Kitchener', bg: '#0033a0', color: '#c8102e' },
  { id: 'LDN', name: 'London Knights', city: 'London', bg: '#004f2f', color: '#f7cd44' },
  { id: 'MIS', name: 'Mississauga Steelheads', city: 'Mississauga', bg: '#00205b', color: '#ffffff' },
  { id: 'NIA', name: 'Niagara IceDogs', city: 'Niagara', bg: '#c8102e', color: '#000000' },
  { id: 'NB', name: 'North Bay Battalion', city: 'North Bay', bg: '#004f2f', color: '#ffc72c' },
  { id: 'OSH', name: 'Oshawa Generals', city: 'Oshawa', bg: '#d41327', color: '#00205b' },
  { id: 'OTT', name: 'Ottawa 67\'s', city: 'Ottawa', bg: '#e03a3e', color: '#000000' },
  { id: 'OS', name: 'Owen Sound Attack', city: 'Owen Sound', bg: '#c8102e', color: '#000000' },
  { id: 'PBO', name: 'Peterborough Petes', city: 'Peterborough', bg: '#862633', color: '#ffffff' },
  { id: 'SAG', name: 'Saginaw Spirit', city: 'Saginaw', bg: '#001628', color: '#c8102e' },
  { id: 'SAR', name: 'Sarnia Sting', city: 'Sarnia', bg: '#000000', color: '#f2a900' },
  { id: 'SOO', name: 'Soo Greyhounds', city: 'Sault Ste. Marie', bg: '#d1151a', color: '#ffffff' },
  { id: 'SUD', name: 'Sudbury Wolves', city: 'Sudbury', bg: '#002f6c', color: '#7b878e' },
  { id: 'WSR', name: 'Windsor Spitfires', city: 'Windsor', bg: '#00205b', color: '#c8102e' }
];

export const whlTeams = [
  { id: 'BDN', name: 'Brandon Wheat Kings', city: 'Brandon', bg: '#000000', color: '#f2a900' },
  { id: 'CGY', name: 'Calgary Hitmen', city: 'Calgary', bg: '#000000', color: '#c99700' },
  { id: 'EDM', name: 'Edmonton Oil Kings', city: 'Edmonton', bg: '#000000', color: '#c8102e' },
  { id: 'EVT', name: 'Everett Silvertips', city: 'Everett', bg: '#004d30', color: '#c4ced4' },
  { id: 'KAM', name: 'Kamloops Blazers', city: 'Kamloops', bg: '#00205b', color: '#ef3e42' },
  { id: 'KEL', name: 'Kelowna Rockets', city: 'Kelowna', bg: '#000000', color: '#00839a' },
  { id: 'LET', name: 'Lethbridge Hurricanes', city: 'Lethbridge', bg: '#00205b', color: '#c8102e' },
  { id: 'MHT', name: 'Medicine Hat Tigers', city: 'Medicine Hat', bg: '#000000', color: '#f2a900' },
  { id: 'MJW', name: 'Moose Jaw Warriors', city: 'Moose Jaw', bg: '#000000', color: '#c8102e' },
  { id: 'POR', name: 'Portland Winterhawks', city: 'Portland', bg: '#000000', color: '#c8102e' },
  { id: 'PA', name: 'Prince Albert Raiders', city: 'Prince Albert', bg: '#004f2f', color: '#f2a900' },
  { id: 'PG', name: 'Prince George Cougars', city: 'Prince George', bg: '#d41327', color: '#000000' },
  { id: 'RD', name: 'Red Deer Rebels', city: 'Red Deer', bg: '#000000', color: '#c8102e' },
  { id: 'REG', name: 'Regina Pats', city: 'Regina', bg: '#0033a0', color: '#d1151a' },
  { id: 'SAS', name: 'Saskatoon Blades', city: 'Saskatoon', bg: '#0033a0', color: '#ffb81c' },
  { id: 'SEA', name: 'Seattle Thunderbirds', city: 'Seattle', bg: '#002855', color: '#8dc63f' },
  { id: 'SPO', name: 'Spokane Chiefs', city: 'Spokane', bg: '#c8102e', color: '#00205b' },
  { id: 'SC', name: 'Swift Current Broncos', city: 'Swift Current', bg: '#00205b', color: '#00843d' },
  { id: 'TC', name: 'Tri-City Americans', city: 'Tri-City', bg: '#00205b', color: '#c8102e' },
  { id: 'VAN', name: 'Vancouver Giants', city: 'Vancouver', bg: '#540212', color: '#c1c6c8' },
  { id: 'VIC', name: 'Victoria Royals', city: 'Victoria', bg: '#00205b', color: '#f2a900' },
  { id: 'WEN', name: 'Wenatchee Wild', city: 'Wenatchee', bg: '#00205b', color: '#8dc63f' }
];

export const qmjhlTeams = [
  { id: 'ACA', name: 'Acadie-Bathurst Titan', city: 'Acadie-Bathurst', bg: '#c8102e', color: '#d3af37' },
  { id: 'BAC', name: 'Baie-Comeau Drakkar', city: 'Baie-Comeau', bg: '#ffc72c', color: '#000000' },
  { id: 'BLA', name: 'Blainville-Boisbriand Armada', city: 'Blainville-Boisbriand', bg: '#000000', color: '#ffffff' },
  { id: 'CAP', name: 'Cape Breton Eagles', city: 'Cape Breton', bg: '#000000', color: '#f2a900' },
  { id: 'CHA', name: 'Charlottetown Islanders', city: 'Charlottetown', bg: '#000000', color: '#cfab7a' },
  { id: 'CHI', name: 'Chicoutimi Saguenéens', city: 'Chicoutimi', bg: '#00205b', color: '#ffffff' },
  { id: 'DRU', name: 'Drummondville Voltigeurs', city: 'Drummondville', bg: '#c8102e', color: '#000000' },
  { id: 'GAT', name: 'Gatineau Olympiques', city: 'Gatineau', bg: '#000000', color: '#a2a9ad' },
  { id: 'HAL', name: 'Halifax Mooseheads', city: 'Halifax', bg: '#004f2f', color: '#c8102e' },
  { id: 'MON', name: 'Moncton Wildcats', city: 'Moncton', bg: '#003057', color: '#e4002b' },
  { id: 'QUE', name: 'Quebec Remparts', city: 'Quebec', bg: '#e21836', color: '#000000' },
  { id: 'RIM', name: 'Rimouski Océanic', city: 'Rimouski', bg: '#001e62', color: '#ffffff' },
  { id: 'ROU', name: 'Rouyn-Noranda Huskies', city: 'Rouyn-Noranda', bg: '#000000', color: '#c8102e' },
  { id: 'SJD', name: 'Saint John Sea Dogs', city: 'Saint John', bg: '#00205b', color: '#000000' },
  { id: 'SHA', name: 'Shawinigan Cataractes', city: 'Shawinigan', bg: '#00205b', color: '#f2a900' },
  { id: 'SHE', name: 'Sherbrooke Phoenix', city: 'Sherbrooke', bg: '#002855', color: '#e5e1e6' },
  { id: 'VAL', name: 'Val-d\'Or Foreurs', city: 'Val-d\'Or', bg: '#004f2f', color: '#f2a900' },
  { id: 'VIC', name: 'Victoriaville Tigres', city: 'Victoriaville', bg: '#000000', color: '#ffc72c' }
];

// --- EUROPEAN PRO LEAGUES ---
export const shlTeams = [
  { id: 'BRY', name: 'Brynäs IF', bg: '#000000', color: '#e2001a' },
  { id: 'FBE', name: 'Färjestad BK', bg: '#006633', color: '#fff' },
  { id: 'FRO', name: 'Frölunda HC', bg: '#101410', color: '#e2001a' },
  { id: 'HV71', name: 'HV71', bg: '#002f6c', color: '#ffc72c' },
  { id: 'LEK', name: 'Leksands IF', bg: '#002f6c', color: '#ffffff' },
  { id: 'LHC', name: 'Linköping HC', bg: '#002f6c', color: '#e2001a' },
  { id: 'LHF', name: 'Luleå HF', bg: '#e2001a', color: '#ffc72c' },
  { id: 'MIF', name: 'Malmö Redhawks', bg: '#e2001a', color: '#000000' },
  { id: 'MOD', name: 'MoDo Hockey', bg: '#e2001a', color: '#ffffff' },
  { id: 'ORE', name: 'Örebro HK', bg: '#e2001a', color: '#000000' },
  { id: 'RBK', name: 'Rögle BK', bg: '#004a2f', color: '#fff' },
  { id: 'SKE', name: 'Skellefteå AIK', bg: '#000000', color: '#ffe600' },
  { id: 'TIK', name: 'Timrå IK', bg: '#e2001a', color: '#ffffff' },
  { id: 'VLH', name: 'Växjö Lakers', bg: '#003399', color: '#ff6600' }
];

export const liigaTeams = [
  { id: 'HIFK', name: 'HIFK', bg: '#e2001a', color: '#00205b' },
  { id: 'HPK', name: 'HPK', bg: '#f47920', color: '#000000' },
  { id: 'ILV', name: 'Ilves', bg: '#006633', color: '#ffcc00' },
  { id: 'JUK', name: 'Jukurit', bg: '#00205b', color: '#ffc72c' },
  { id: 'JYP', name: 'JYP', bg: '#000000', color: '#e2001a' },
  { id: 'KAL', name: 'KalPa', bg: '#ffc72c', color: '#000000' },
  { id: 'KIE', name: 'Kiekko-Espoo', bg: '#0033a0', color: '#ffc72c' },
  { id: 'KOO', name: 'KooKoo', bg: '#000000', color: '#f47920' },
  { id: 'KAR', name: 'Kärpät', bg: '#000000', color: '#ffcc00' },
  { id: 'LUK', name: 'Lukko', bg: '#0033a0', color: '#ffc72c' },
  { id: 'PEL', name: 'Pelicans', bg: '#00a3e0', color: '#000000' },
  { id: 'SAI', name: 'SaiPa', bg: '#ffc72c', color: '#000000' },
  { id: 'SPO', name: 'Sport', bg: '#e2001a', color: '#ffffff' },
  { id: 'TAP', name: 'Tappara', bg: '#0033a0', color: '#f47920' },
  { id: 'TPS', name: 'TPS', bg: '#000000', color: '#ffffff' },
  { id: 'ASS', name: 'Ässät', bg: '#e2001a', color: '#000000' }
];

export const ncaaTeams = [
  // Hockey East
  { id: 'BC', name: 'Boston College', bg: '#8a100b', color: '#decba4' },
  { id: 'BU', name: 'Boston University', bg: '#cc0000', color: '#ffffff' },
  { id: 'UMA', name: 'UMass Minutemen', bg: '#881c1c', color: '#ffffff' },
  { id: 'PRO', name: 'Providence Friars', bg: '#000000', color: '#ffffff' },
  { id: 'MNE', name: 'Maine Black Bears', bg: '#003263', color: '#b0d7ff' },
  { id: 'NEU', name: 'Northeastern Huskies', bg: '#cc0000', color: '#000000' },
  { id: 'UCO', name: 'UConn Huskies', bg: '#000e2f', color: '#ffffff' },
  
  // Big Ten
  { id: 'MICH', name: 'Michigan Wolverines', bg: '#00274c', color: '#ffcb05' },
  { id: 'MINN', name: 'Minnesota Gophers', bg: '#7a0019', color: '#ffcc33' },
  { id: 'MSU', name: 'Michigan State', bg: '#18453b', color: '#ffffff' },
  { id: 'WIS', name: 'Wisconsin Badgers', bg: '#c5050c', color: '#ffffff' },
  { id: 'PSU', name: 'Penn State', bg: '#041e42', color: '#ffffff' },
  { id: 'OSU', name: 'Ohio State', bg: '#bb0000', color: '#666666' },
  { id: 'ND', name: 'Notre Dame', bg: '#0c2340', color: '#c99700' },

  // NCHC
  { id: 'DEN', name: 'Denver Pioneers', bg: '#ba0c2f', color: '#a8996e' },
  { id: 'UND', name: 'North Dakota', bg: '#009a44', color: '#ffffff' },
  { id: 'UMD', name: 'Minnesota Duluth', bg: '#7a0019', color: '#ffcc33' },
  { id: 'SCSU', name: 'St. Cloud State', bg: '#a10214', color: '#ffffff' },
  { id: 'WMU', name: 'Western Michigan', bg: '#532e1f', color: '#f1c500' },
  { id: 'UNO', name: 'Omaha Mavericks', bg: '#000000', color: '#d71920' },
  { id: 'CC', name: 'Colorado College', bg: '#000000', color: '#f3c300' },

  // ECAC
  { id: 'QUN', name: 'Quinnipiac Bobcats', bg: '#0a2240', color: '#ffb81c' },
  { id: 'COR', name: 'Cornell Big Red', bg: '#b31b1b', color: '#ffffff' },
  { id: 'HAR', name: 'Harvard Crimson', bg: '#a51c30', color: '#ffffff' },
  { id: 'CLK', name: 'Clarkson Golden Knights', bg: '#03522b', color: '#ffd204' },
  { id: 'SLU', name: 'St. Lawrence Saints', bg: '#af1e2d', color: '#41221b' },

  // CCHA / Atlantic Hockey
  { id: 'MNSU', name: 'Minnesota State', bg: '#480025', color: '#f0ab00' },
  { id: 'MTU', name: 'Michigan Tech', bg: '#000000', color: '#ffcd00' },
  { id: 'BGS', name: 'Bowling Green', bg: '#4f2c1d', color: '#ff7300' },
  { id: 'RIT', name: 'RIT Tigers', bg: '#f36e21', color: '#000000' },
  { id: 'AFA', name: 'Air Force Falcons', bg: '#003087', color: '#8a8d8f' },
  { id: 'SHU', name: 'Sacred Heart', bg: '#cd1041', color: '#c4d8e2' }
];

export const nationalities = [
  { id: 'CAN', name: 'Canada', sentenceName: 'Canada', img: 'https://flagcdn.com/w40/ca.png' },
  { id: 'USA', name: 'United States', sentenceName: 'the United States', img: 'https://flagcdn.com/w40/us.png' },
  { id: 'SWE', name: 'Sweden', sentenceName: 'Sweden', img: 'https://flagcdn.com/w40/se.png' },
  { id: 'FIN', name: 'Finland', sentenceName: 'Finland', img: 'https://flagcdn.com/w40/fi.png' },
  { id: 'RUS', name: 'Russia', sentenceName: 'Russia', img: 'https://flagcdn.com/w40/ru.png' },
  { id: 'CZE', name: 'Czechia', sentenceName: 'the Czech Republic', img: 'https://flagcdn.com/w40/cz.png' }
];

export const juniorLeagues = ['OHL', 'WHL', 'QMJHL'];
export const euroLeagues = ['SHL', 'LIIGA'];

export const LEAGUE_CONFIG = {
  NHL: { playoffSpots: 16, teams: 32 },
  AHL: { playoffSpots: 16, teams: 32 },
  OHL: { playoffSpots: 16, teams: 20 },
  WHL: { playoffSpots: 16, teams: 22 },
  QMJHL: { playoffSpots: 16, teams: 18 },
  SHL: { playoffSpots: 10, teams: 14 },
  LIIGA: { playoffSpots: 10, teams: 16 },
  NCAA: { playoffSpots: 16, teams: 64 }
};

export const getTeamData = (teamId, league) => {
  if (league === 'NHL') return nhlTeams.find(t => t.id === teamId);
  if (league === 'AHL') return ahlTeams.find(t => t.id === teamId);
  if (league === 'OHL') return ohlTeams.find(t => t.id === teamId);
  if (league === 'WHL') return whlTeams.find(t => t.id === teamId);
  if (league === 'QMJHL') return qmjhlTeams.find(t => t.id === teamId);
  if (league === 'SHL') return shlTeams.find(t => t.id === teamId);
  if (league === 'LIIGA') return liigaTeams.find(t => t.id === teamId);
  if (league === 'NCAA') return ncaaTeams.find(t => t.id === teamId);
  return null;
};

export const getDeployment = (ovr, pos, league) => {
  if (league === 'NHL') {
    if (pos === 'G') return ovr >= 84 ? 'Starter' : ovr >= 79 ? 'Backup' : 'Scratch';
    if (ovr >= 85) return '1st Line';
    if (ovr >= 80) return '2nd Line';
    if (ovr >= 76) return '3rd Line';
    return '4th Line';
  } else {
    // Junior/AHL/Euro scaling
    if (pos === 'G') return ovr >= 70 ? 'Starter' : ovr >= 60 ? 'Backup' : 'Scratch';
    if (ovr >= 70) return '1st Line';
    if (ovr >= 64) return '2nd Line';
    if (ovr >= 58) return '3rd Line';
    return '4th Line';
  }
};

export const euroTeams = [...shlTeams, ...liigaTeams];

export const getOpponentPool = (league) => {
  if (league === 'NHL') return nhlTeams;
  if (league === 'AHL') return ahlTeams;
  if (league === 'OHL') return ohlTeams;
  if (league === 'WHL') return whlTeams;
  if (league === 'QMJHL') return qmjhlTeams;
  if (league === 'SHL') return shlTeams;
  if (league === 'LIIGA') return liigaTeams;
  if (league === 'NCAA') return ncaaTeams;
  return [];
};