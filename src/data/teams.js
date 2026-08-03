// --- NHL & AHL ---
export const nhlTeams = [
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
  { id: 'UTA', name: 'Utah Mammoth', city: 'Utah', bg: '#010101', color: '#6eaddc', ahlId: 'TUC', conf: 'Western', div: 'Central' },
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

export const ushlTeams = [
  // Eastern Conference
  { id: 'CR', name: 'Cedar Rapids RoughRiders', bg: '#005537', color: '#c4ced4' },
  { id: 'CHI', name: 'Chicago Steel', bg: '#c8102e', color: '#000000' },
  { id: 'DBQ', name: 'Dubuque Fighting Saints', bg: '#c8102e', color: '#ffffff' },
  { id: 'GB', name: 'Green Bay Gamblers', bg: '#002f6c', color: '#f0b323' },
  { id: 'MAD', name: 'Madison Capitols', bg: '#001e62', color: '#c8102e' },
  { id: 'MKG', name: 'Muskegon Lumberjacks', bg: '#000000', color: '#ffb81c' },
  { id: 'USN', name: 'USA Hockey NTDP', bg: '#002654', color: '#c8102e' },
  { id: 'YNG', name: 'Youngstown Phantoms', bg: '#4f2d7f', color: '#f47920' },
  
  // Western Conference
  { id: 'DSM', name: 'Des Moines Buccaneers', bg: '#00205b', color: '#c8102e' },
  { id: 'FGO', name: 'Fargo Force', bg: '#000000', color: '#004684' },
  { id: 'LIN', name: 'Lincoln Stars', bg: '#002f6c', color: '#c8102e' },
  { id: 'OMA', name: 'Omaha Lancers', bg: '#002d62', color: '#f2a900' },
  { id: 'SC', name: 'Sioux City Musketeers', bg: '#004f2f', color: '#f2a900' },
  { id: 'SF', name: 'Sioux Falls Stampede', bg: '#00205b', color: '#f2a900' },
  { id: 'TC', name: 'Tri-City Storm', bg: '#562381', color: '#000000' },
  { id: 'WAT', name: 'Waterloo Black Hawks', bg: '#000000', color: '#c8102e' }
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
  // BIG TEN (7)
  { id: 'MICH', name: 'Michigan Wolverines', city: 'Ann Arbor', bg: '#00274C', color: '#FFCB05', rivalId: 'MSU' },
  { id: 'MSU', name: 'Michigan State Spartans', city: 'East Lansing', bg: '#18453B', color: '#FFFFFF', rivalId: 'MICH' },
  { id: 'MINN', name: 'Minnesota Golden Gophers', city: 'Minneapolis', bg: '#7A0019', color: '#FFCC00', rivalId: 'UND' },
  { id: 'WIS', name: 'Wisconsin Badgers', city: 'Madison', bg: '#C5050C', color: '#FFFFFF', rivalId: 'MINN' },
  { id: 'ND', name: 'Notre Dame Fighting Irish', city: 'South Bend', bg: '#0C2340', color: '#C99700', rivalId: 'MICH' },
  { id: 'OSU', name: 'Ohio State Buckeyes', city: 'Columbus', bg: '#BB0000', color: '#666666', rivalId: 'MICH' },
  { id: 'PSU', name: 'Penn State Nittany Lions', city: 'University Park', bg: '#001E44', color: '#FFFFFF', rivalId: 'OSU' },

  // NCHC (9)
  { id: 'UND', name: 'North Dakota Fighting Hawks', city: 'Grand Forks', bg: '#009A44', color: '#FFFFFF', rivalId: 'MINN' },
  { id: 'DEN', name: 'Denver Pioneers', city: 'Denver', bg: '#8B2332', color: '#A89968', rivalId: 'CC' },
  { id: 'CC', name: 'Colorado College Tigers', city: 'Colorado Springs', bg: '#000000', color: '#CC9900', rivalId: 'DEN' },
  { id: 'UMD', name: 'Minnesota Duluth Bulldogs', city: 'Duluth', bg: '#46166B', color: '#FFC845', rivalId: 'SCSU' },
  { id: 'SCSU', name: 'St. Cloud State Huskies', city: 'St. Cloud', bg: '#A10209', color: '#000000', rivalId: 'UMD' },
  { id: 'WMU', name: 'Western Michigan Broncos', city: 'Kalamazoo', bg: '#532E1C', color: '#F1B82D', rivalId: 'MICH' },
  { id: 'UNO', name: 'Omaha Mavericks', city: 'Omaha', bg: '#000000', color: '#D14124', rivalId: 'UND' },
  { id: 'MIA', name: 'Miami RedHawks', city: 'Oxford', bg: '#B81137', color: '#FFFFFF', rivalId: 'WMU' },
  { id: 'ASU', name: 'Arizona State Sun Devils', city: 'Tempe', bg: '#8C1D40', color: '#FFC627', rivalId: 'DEN' },

  // HOCKEY EAST (11)
  { id: 'BC', name: 'Boston College Eagles', city: 'Chestnut Hill', bg: '#98002E', color: '#BC9B6A', rivalId: 'BU' },
  { id: 'BU', name: 'Boston University Terriers', city: 'Boston', bg: '#CC0000', color: '#FFFFFF', rivalId: 'BC' },
  { id: 'PROV', name: 'Providence Friars', city: 'Providence', bg: '#000000', color: '#FFFFFF', rivalId: 'BC' },
  { id: 'ME', name: 'Maine Black Bears', city: 'Orono', bg: '#003263', color: '#B0D7FF', rivalId: 'UNH' },
  { id: 'UNH', name: 'New Hampshire Wildcats', city: 'Durham', bg: '#002B49', color: '#A3B899', rivalId: 'ME' },
  { id: 'UMASS', name: 'UMass Minutemen', city: 'Amherst', bg: '#881C1C', color: '#FFFFFF', rivalId: 'UML' },
  { id: 'UML', name: 'UMass Lowell River Hawks', city: 'Lowell', bg: '#0067C5', color: '#C8102E', rivalId: 'UMASS' },
  { id: 'NEU', name: 'Northeastern Huskies', city: 'Boston', bg: '#CC0000', color: '#000000', rivalId: 'BU' },
  { id: 'UCONN', name: 'UConn Huskies', city: 'Storrs', bg: '#000E2E', color: '#FFFFFF', rivalId: 'PROV' },
  { id: 'MC', name: 'Merrimack Warriors', city: 'North Andover', bg: '#002A5C', color: '#F2A900', rivalId: 'UML' },
  { id: 'UVM', name: 'Vermont Catamounts', city: 'Burlington', bg: '#005A36', color: '#FFC72C', rivalId: 'ME' },

  // ECAC HOCKEY (12)
  { id: 'QU', name: 'Quinnipiac Bobcats', city: 'Hamden', bg: '#0A2240', color: '#EAAA00', rivalId: 'YALE' },
  { id: 'COR', name: 'Cornell Big Red', city: 'Ithaca', bg: '#B31B1B', color: '#FFFFFF', rivalId: 'HARV' },
  { id: 'HARV', name: 'Harvard Crimson', city: 'Cambridge', bg: '#A51C30', color: '#FFFFFF', rivalId: 'COR' },
  { id: 'YALE', name: 'Yale Bulldogs', city: 'New Haven', bg: '#00356B', color: '#FFFFFF', rivalId: 'HARV' },
  { id: 'CLARK', name: 'Clarkson Golden Knights', city: 'Potsdam', bg: '#004B23', color: '#FFC72C', rivalId: 'SLU' },
  { id: 'SLU', name: 'St. Lawrence Saints', city: 'Canton', bg: '#861F41', color: '#D99B26', rivalId: 'CLARK' },
  { id: 'COLG', name: 'Colgate Raiders', city: 'Hamilton', bg: '#821019', color: '#FFFFFF', rivalId: 'COR' },
  { id: 'DART', name: 'Dartmouth Big Green', city: 'Hanover', bg: '#00693E', color: '#FFFFFF', rivalId: 'UVM' },
  { id: 'PRIN', name: 'Princeton Tigers', city: 'Princeton', bg: '#FF6F00', color: '#000000', rivalId: 'YALE' },
  { id: 'UNION', name: 'Union Garnet Chargers', city: 'Schenectady', bg: '#822433', color: '#FFFFFF', rivalId: 'RPI' },
  { id: 'RPI', name: 'Rensselaer Engineers', city: 'Troy', bg: '#D6001C', color: '#FFFFFF', rivalId: 'UNION' },
  { id: 'BROWN', name: 'Brown Bears', city: 'Providence', bg: '#4E3629', color: '#E4002B', rivalId: 'PRIN' },

  // CCHA (9)
  { id: 'BSU', name: 'Bemidji State Beavers', city: 'Bemidji', bg: '#004B23', color: '#FFFFFF', rivalId: 'MTU' },
  { id: 'MTU', name: 'Michigan Tech Huskies', city: 'Houghton', bg: '#000000', color: '#FFCC00', rivalId: 'NMU' },
  { id: 'NMU', name: 'Northern Michigan Wildcats', city: 'Marquette', bg: '#003366', color: '#FFCC00', rivalId: 'MTU' },
  { id: 'MNSU', name: 'Minnesota State Mavericks', city: 'Mankato', bg: '#4B2E83', color: '#FFC72C', rivalId: 'BSU' },
  { id: 'BGSU', name: 'Bowling Green Falcons', city: 'Bowling Green', bg: '#4F2683', color: '#FF6600', rivalId: 'MIA' },
  { id: 'LSSU', name: 'Lake Superior State Lakers', city: 'Sault Ste. Marie', bg: '#003366', color: '#FFCC00', rivalId: 'MTU' },
  { id: 'FSU', name: 'Ferris State Bulldogs', city: 'Big Rapids', bg: '#CC0000', color: '#FFCC00', rivalId: 'BGSU' },
  { id: 'AUG', name: 'Augustana Vikings', city: 'Sioux Falls', bg: '#002B49', color: '#FFC72C', rivalId: 'UST' },
  { id: 'UST', name: 'St. Thomas Tommies', city: 'St. Paul', bg: '#512D6D', color: '#999999', rivalId: 'MINN' },

  // ATLANTIC HOCKEY AMERICA (11)
  { id: 'RIT', name: 'RIT Tigers', city: 'Rochester', bg: '#F36E21', color: '#51267D', rivalId: 'CAN' },
  { id: 'HC', name: 'Holy Cross Crusaders', city: 'Worcester', bg: '#60269E', color: '#FFFFFF', rivalId: 'BC' },
  { id: 'AIC', name: 'American International Yellow Jackets', city: 'Springfield', bg: '#000000', color: '#FFC72C', rivalId: 'SAC' },
  { id: 'BENT', name: 'Bentley Falcons', city: 'Waltham', bg: '#002D62', color: '#3399FF', rivalId: 'HC' },
  { id: 'SAC', name: 'Sacred Heart Pioneers', city: 'Fairfield', bg: '#C8102E', color: '#13294B', rivalId: 'QU' },
  { id: 'AF', name: 'Air Force Falcons', city: 'Colorado Springs', bg: '#003087', color: '#8A9D8F', rivalId: 'ARMY' },
  { id: 'ARMY', name: 'Army West Point Black Knights', city: 'West Point', bg: '#000000', color: '#D4AF37', rivalId: 'AF' },
  { id: 'MERC', name: 'Mercyhurst Lakers', city: 'Erie', bg: '#000000', color: '#005A36', rivalId: 'NIAG' },
  { id: 'CAN', name: 'Canisius Golden Griffins', city: 'Buffalo', bg: '#002D62', color: '#FFC72C', rivalId: 'NIAG' },
  { id: 'NIAG', name: 'Niagara Purple Eagles', city: 'Niagara Falls', bg: '#512D6D', color: '#FFFFFF', rivalId: 'CAN' },
  { id: 'RMU', name: 'Robert Morris Colonials', city: 'Moon Township', bg: '#002347', color: '#A6192E', rivalId: 'MERC' },

  // INDEPENDENTS (5)
  { id: 'UAF', name: 'Alaska Fairbanks Nanooks', city: 'Fairbanks', bg: '#002855', color: '#FFC72C', rivalId: 'UAA' },
  { id: 'UAA', name: 'Alaska Anchorage Seawolves', city: 'Anchorage', bg: '#005A36', color: '#FFC72C', rivalId: 'UAF' },
  { id: 'LIU', name: 'LIU Sharks', city: 'Brooklyn', bg: '#002D62', color: '#6CACE4', rivalId: 'SAC' },
  { id: 'LIND', name: 'Lindenwood Lions', city: 'St. Charles', bg: '#000000', color: '#B3A369', rivalId: 'UST' },
  { id: 'STONE', name: 'Stonehill Skyhawks', city: 'Easton', bg: '#002855', color: '#C8102E', rivalId: 'HC' }
];

export const nationalities = [
  { id: 'CAN', name: 'Canada', sentenceName: 'Canada', img: 'https://flagcdn.com/w40/ca.png' },
  { id: 'USA', name: 'United States', sentenceName: 'the United States', img: 'https://flagcdn.com/w40/us.png' },
  { id: 'SWE', name: 'Sweden', sentenceName: 'Sweden', img: 'https://flagcdn.com/w40/se.png' },
  { id: 'FIN', name: 'Finland', sentenceName: 'Finland', img: 'https://flagcdn.com/w40/fi.png' },
  { id: 'RUS', name: 'Russia', sentenceName: 'Russia', img: 'https://flagcdn.com/w40/ru.png' },
  { id: 'CZE', name: 'Czechia', sentenceName: 'the Czech Republic', img: 'https://flagcdn.com/w40/cz.png' }
];

export const juniorLeagues = ['OHL', 'WHL', 'QMJHL', 'USHL'];
export const euroLeagues = ['SHL', 'LIIGA'];

export const LEAGUE_CONFIG = {
  NHL: { playoffSpots: 16, teams: 32 },
  AHL: { playoffSpots: 16, teams: 32 },
  OHL: { playoffSpots: 16, teams: 20 },
  WHL: { playoffSpots: 16, teams: 22 },
  QMJHL: { playoffSpots: 16, teams: 18 },
  USHL: { playoffSpots: 8, teams: 16 },
  SHL: { playoffSpots: 8, teams: 14 },
  LIIGA: { playoffSpots: 8, teams: 16 },
  NCAA: { playoffSpots: 16, teams: 64 }
};

export const getTeamData = (teamId, league) => {
  if (league === 'NHL') return nhlTeams.find(t => t.id === teamId);
  if (league === 'AHL') return ahlTeams.find(t => t.id === teamId);
  if (league === 'OHL') return ohlTeams.find(t => t.id === teamId);
  if (league === 'WHL') return whlTeams.find(t => t.id === teamId);
  if (league === 'QMJHL') return qmjhlTeams.find(t => t.id === teamId);
  if (league === 'USHL') return ushlTeams.find(t => t.id === teamId);
  if (league === 'SHL') return shlTeams.find(t => t.id === teamId);
  if (league === 'LIIGA') return liigaTeams.find(t => t.id === teamId);
  if (league === 'NCAA') return ncaaTeams.find(t => t.id === teamId);
  return null;
};

export const getOpponentPool = (league) => {
  if (league === 'NHL') return nhlTeams;
  if (league === 'AHL') return ahlTeams;
  if (league === 'OHL') return ohlTeams;
  if (league === 'WHL') return whlTeams;
  if (league === 'QMJHL') return qmjhlTeams;
  if (league === 'USHL') return ushlTeams;
  if (league === 'SHL') return shlTeams;
  if (league === 'LIIGA') return liigaTeams;
  if (league === 'NCAA') return ncaaTeams;
  return [];
};

export const getDeployment = (ovr, pos, league) => {
  const isGoalie = pos === 'G';
  const isDefense = pos === 'LD' || pos === 'RD';

  if (league === 'NHL') {
    // ----------------------------------------------------
    // NHL TIER
    // ----------------------------------------------------
    if (isGoalie) {
      if (ovr >= 84) return 'Starter';
      if (ovr >= 78) return 'Backup';
      return 'Scratch';
    }
    if (isDefense) {
      if (ovr >= 85) return '1st Pair';
      if (ovr >= 80) return '2nd Pair';
      if (ovr >= 75) return '3rd Pair';
      return 'Scratch';
    }
    // Forwards
    if (ovr >= 85) return '1st Line';
    if (ovr >= 80) return '2nd Line';
    if (ovr >= 76) return '3rd Line';
    if (ovr >= 70) return '4th Line';
    return 'Scratch';

  } else if (league === 'AHL' || ['SHL', 'LIIGA'].includes(league)) {
    // ----------------------------------------------------
    // PRO TIER (AHL / Europe)
    // ----------------------------------------------------
    if (isGoalie) {
      if (ovr >= 74) return 'Starter';
      if (ovr >= 66) return 'Backup';
      return 'Scratch';
    }
    if (isDefense) {
      if (ovr >= 74) return '1st Pair';
      if (ovr >= 70) return '2nd Pair';
      if (ovr >= 65) return '3rd Pair';
      return 'Scratch';
    }
    // Forwards
    if (ovr >= 74) return '1st Line';
    if (ovr >= 70) return '2nd Line';
    if (ovr >= 65) return '3rd Line';
    if (ovr >= 60) return '4th Line';
    return 'Scratch';

  } else {
    // ----------------------------------------------------
    // AMATEUR TIER (Juniors & NCAA)
    // ----------------------------------------------------
    if (isGoalie) {
      if (ovr >= 60) return 'Starter';
      if (ovr >= 54) return 'Backup';
      return 'Scratch';
    }
    if (isDefense) {
      if (ovr >= 62) return '1st Pair';
      if (ovr >= 58) return '2nd Pair';
      if (ovr >= 54) return '3rd Pair';
      return 'Scratch';
    }
    // Forwards
    if (ovr >= 62) return '1st Line';
    if (ovr >= 58) return '2nd Line';
    if (ovr >= 54) return '3rd Line';
    if (ovr >= 50) return '4th Line';
    return 'Scratch';
  }
};

export const getPrimaryRival = (teamId, league) => {
  const team = getTeamData(teamId, league);
  if (!team || !team.rivalId) return null;
  return getTeamData(team.rivalId, league) || { id: team.rivalId, name: team.rivalId };
};

export const euroTeams = [...shlTeams, ...liigaTeams];