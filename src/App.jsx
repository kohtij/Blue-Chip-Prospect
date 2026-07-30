import { useState } from 'react';
import './App.css';

// --- DATABASES: TEAMS & LEAGUES ---
const nhlTeams = [
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

const ohlTeams = [ { id: 'LDN', name: 'London', color: '#006B54', bg: '#FFC425' }, { id: 'OTT', name: 'Ottawa', color: '#000000', bg: '#C8102E' }, { id: 'KIT', name: 'Kitchener', color: '#0033A0', bg: '#C8102E' }, { id: 'OSH', name: 'Oshawa', color: '#C8102E', bg: '#00205B' }, { id: 'SAG', name: 'Saginaw', color: '#002F87', bg: '#C8102E' }, { id: 'ERI', name: 'Erie', color: '#F2A900', bg: '#00205B' }, { id: 'GUE', name: 'Guelph', color: '#C8102E', bg: '#000000' }, { id: 'SOO', name: 'Sault Ste. Marie', color: '#C8102E', bg: '#FFFFFF' }, { id: 'FLN', name: 'Flint', color: '#00205B', bg: '#F2A900' }, { id: 'SBY', name: 'Sudbury', color: '#002F87', bg: '#FFFFFF' }, { id: 'PBO', name: 'Peterborough', color: '#660000', bg: '#FFFFFF' }, { id: 'KGN', name: 'Kingston', color: '#000000', bg: '#F2A900' }, { id: 'BAR', name: 'Barrie', color: '#00205B', bg: '#F2A900' }, { id: 'SAR', name: 'Sarnia', color: '#000000', bg: '#C8102E' }, { id: 'WIN', name: 'Windsor', color: '#C8102E', bg: '#00205B' }, { id: 'NIA', name: 'Niagara', color: '#000000', bg: '#C8102E' }, { id: 'NB', name: 'North Bay', color: '#000000', bg: '#4C8C2B' }, { id: 'MIS', name: 'Mississauga', color: '#00205B', bg: '#FFFFFF' } ];
const whlTeams = [ { id: 'POR', name: 'Portland', color: '#000000', bg: '#C8102E' }, { id: 'SEA', name: 'Seattle TB', color: '#002855', bg: '#00A3E0' }, { id: 'EDM', name: 'Edmonton', color: '#E31837', bg: '#041E42' }, { id: 'KEL', name: 'Kelowna', color: '#000000', bg: '#00843D' }, { id: 'KAM', name: 'Kamloops', color: '#00205B', bg: '#F2A900' }, { id: 'EVE', name: 'Everett', color: '#005826', bg: '#C2C4C6' }, { id: 'VIC', name: 'Victoria', color: '#00205B', bg: '#FFFFFF' }, { id: 'VAN', name: 'Vancouver', color: '#000000', bg: '#C8102E' }, { id: 'PG', name: 'Prince George', color: '#000000', bg: '#C8102E' }, { id: 'TC', name: 'Tri-City', color: '#00205B', bg: '#C8102E' }, { id: 'SPO', name: 'Spokane', color: '#00205B', bg: '#C8102E' }, { id: 'RD', name: 'Red Deer', color: '#000000', bg: '#C8102E' }, { id: 'MJ', name: 'Moose Jaw', color: '#000000', bg: '#C8102E' }, { id: 'SAS', name: 'Saskatoon', color: '#00205B', bg: '#F2A900' }, { id: 'MH', name: 'Medicine Hat', color: '#FF671F', bg: '#000000' }, { id: 'CAL', name: 'Calgary', color: '#000000', bg: '#F2A900' }, { id: 'LET', name: 'Lethbridge', color: '#00205B', bg: '#C8102E' }, { id: 'SC', name: 'Swift Current', color: '#0033A0', bg: '#009739' } ];
const qmjhlTeams = [ { id: 'HAL', name: 'Halifax', color: '#005A32', bg: '#C8102E' }, { id: 'QUE', name: 'Quebec', color: '#000000', bg: '#C8102E' }, { id: 'GAT', name: 'Gatineau', color: '#000000', bg: '#FFFFFF' }, { id: 'RIM', name: 'Rimouski', color: '#00205B', bg: '#FFFFFF' }, { id: 'SHE', name: 'Sherbrooke', color: '#00205B', bg: '#C8102E' }, { id: 'VIC', name: 'Victoriaville', color: '#000000', bg: '#FFB81C' }, { id: 'ROU', name: 'Rouyn-Noranda', color: '#C8102E', bg: '#000000' }, { id: 'CAP', name: 'Cape Breton', color: '#000000', bg: '#C8102E' }, { id: 'CHI', name: 'Chicoutimi', color: '#00205B', bg: '#89CFDC' }, { id: 'DRU', name: 'Drummondville', color: '#C8102E', bg: '#000000' }, { id: 'SNB', name: 'Saint John', color: '#00205B', bg: '#C8102E' }, { id: 'BAT', name: 'Acadie-Bathurst', color: '#000000', bg: '#C8102E' }, { id: 'MON', name: 'Moncton', color: '#00205B', bg: '#C8102E' }, { id: 'CHA', name: 'Charlottetown', color: '#000000', bg: '#FFB81C' }, { id: 'VDO', name: 'Val-d\'Or', color: '#005A32', bg: '#FFB81C' }, { id: 'BLB', name: 'Blainville', color: '#000000', bg: '#FFFFFF' }, { id: 'SHA', name: 'Shawinigan', color: '#00205B', bg: '#F2A900' }, { id: 'BAC', name: 'Baie-Comeau', color: '#C8102E', bg: '#FFFFFF' } ];
const ahlTeams = [ { id: 'HER', name: 'Hershey Bears', color: '#4B3029', bg: '#E4A282' }, { id: 'PRO', name: 'Providence Bruins', color: '#FFB81C', bg: '#000000' }, { id: 'SPR', name: 'Springfield Thunderbirds', color: '#FFFFFF', bg: '#041E42' }, { id: 'CV', name: 'Coachella Valley Firebirds', color: '#FFFFFF', bg: '#E31837' }, { id: 'TEX', name: 'Texas Stars', color: '#FFFFFF', bg: '#006847' }, { id: 'CHI', name: 'Chicago Wolves', color: '#C8102E', bg: '#F2A900' }, { id: 'UTI', name: 'Utica Comets', color: '#000000', bg: '#00A3E0' }, { id: 'SYR', name: 'Syracuse Crunch', color: '#FFFFFF', bg: '#002868' }, { id: 'LAV', name: 'Laval Rocket', color: '#FFFFFF', bg: '#AF1E2D' }, { id: 'BEL', name: 'Belleville Senators', color: '#000000', bg: '#C8102E' }, { id: 'ROC', name: 'Rochester Americans', color: '#00205B', bg: '#C8102E' }, { id: 'CLE', name: 'Cleveland Monsters', color: '#00205B', bg: '#C8102E' }, { id: 'GR', name: 'Grand Rapids Griffins', color: '#C8102E', bg: '#000000' }, { id: 'MIL', name: 'Milwaukee Admirals', color: '#000000', bg: '#89CFDC' }, { id: 'IA', name: 'Iowa Wild', color: '#000000', bg: '#C8102E' }, { id: 'ONT', name: 'Ontario Reign', color: '#A2AAAD', bg: '#111111' }, { id: 'COLE', name: 'Colorado Eagles', color: '#FFFFFF', bg: '#6F263D' }, { id: 'TUC', name: 'Tucson Roadrunners', color: '#8C2633', bg: '#E2D6B5' }, { id: 'TORA', name: 'Toronto Marlies', color: '#FFFFFF', bg: '#00205B' }, { id: 'CLT', name: 'Charlotte Checkers', color: '#000000', bg: '#C8102E' }, { id: 'HFD', name: 'Hartford Wolf Pack', color: '#FFFFFF', bg: '#0038A8' }, { id: 'BRI', name: 'Bridgeport Islanders', color: '#F47D30', bg: '#00539B' }, { id: 'WBS', name: 'WBS Penguins', color: '#FCB514', bg: '#000000' }, { id: 'LV', name: 'Lehigh Valley Phantoms', color: '#000000', bg: '#F74902' }, { id: 'MAN', name: 'Manitoba Moose', color: '#FFFFFF', bg: '#041E42' }, { id: 'RFD', name: 'Rockford IceHogs', color: '#FFFFFF', bg: '#CF0A2C' }, { id: 'HSK', name: 'Henderson Silver Knights', color: '#B4975A', bg: '#333F42' }, { id: 'BAK', name: 'Bakersfield Condors', color: '#FF4C00', bg: '#041E42' }, { id: 'ABB', name: 'Abbotsford Canucks', color: '#FFFFFF', bg: '#00205B' }, { id: 'CGYW', name: 'Calgary Wranglers', color: '#F62817', bg: '#111111' }, { id: 'SD', name: 'San Diego Gulls', color: '#F95602', bg: '#000000' }, { id: 'SJB', name: 'San Jose Barracuda', color: '#FFFFFF', bg: '#006D75' } ];

const euroTeams = [
  { id: 'FHC', name: 'Frölunda HC', color: '#FFFFFF', bg: '#E31837', league: 'SHL' }, { id: 'FBK', name: 'Färjestad BK', color: '#FFFFFF', bg: '#006B54', league: 'SHL' }, { id: 'SAIK', name: 'Skellefteå AIK', color: '#000000', bg: '#FFB81C', league: 'SHL' }, { id: 'DIF', name: 'Djurgårdens IF', color: '#FFFFFF', bg: '#00205B', league: 'SHL' }, { id: 'BIF', name: 'Brynäs IF', color: '#FFFFFF', bg: '#000000', league: 'SHL' },
  { id: 'TAP', name: 'Tappara', color: '#FFFFFF', bg: '#00539B', league: 'Liiga' }, { id: 'HIFK', name: 'HIFK', color: '#FFFFFF', bg: '#E31837', league: 'Liiga' }, { id: 'ILV', name: 'Ilves', color: '#000000', bg: '#FFB81C', league: 'Liiga' }, { id: 'KRP', name: 'Kärpät', color: '#FFFFFF', bg: '#000000', league: 'Liiga' }, { id: 'TPS', name: 'TPS', color: '#FFFFFF', bg: '#000000', league: 'Liiga' },
  { id: 'SKA', name: 'SKA St. Petersburg', color: '#FFFFFF', bg: '#0038A8', league: 'KHL' }, { id: 'CSK', name: 'CSKA Moscow', color: '#FFFFFF', bg: '#E31837', league: 'KHL' }, { id: 'AVA', name: 'Avangard Omsk', color: '#FFFFFF', bg: '#CE1126', league: 'KHL' }, { id: 'MET', name: 'Metallurg Mg', color: '#FFFFFF', bg: '#00205B', league: 'KHL' }, { id: 'AKB', name: 'Ak Bars Kazan', color: '#FFFFFF', bg: '#006B54', league: 'KHL' }
];

const nationalities = [
  { id: 'CAN', img: 'https://flagcdn.com/ca.svg', name: 'Canada', sentenceName: 'Canada' },
  { id: 'USA', img: 'https://flagcdn.com/us.svg', name: 'United States', sentenceName: 'the United States' },
  { id: 'SWE', img: 'https://flagcdn.com/se.svg', name: 'Sweden', sentenceName: 'Sweden' },
  { id: 'FIN', img: 'https://flagcdn.com/fi.svg', name: 'Finland', sentenceName: 'Finland' },
  { id: 'CZE', img: 'https://flagcdn.com/cz.svg', name: 'Czechia', sentenceName: 'Czechia' },
  { id: 'RUS', img: 'https://flagcdn.com/ru.svg', name: 'Russia', sentenceName: 'Russia' }
];

const getTeamData = (teamId, league) => {
  if (league === 'OHL') return ohlTeams.find(t => t.id === teamId);
  if (league === 'WHL') return whlTeams.find(t => t.id === teamId);
  if (league === 'QMJHL') return qmjhlTeams.find(t => t.id === teamId);
  if (league === 'AHL') return ahlTeams.find(t => t.id === teamId) || ahlTeams[0];
  if (['SHL', 'Liiga', 'KHL'].includes(league)) return euroTeams.find(t => t.id === teamId) || euroTeams[0];
  return nhlTeams.find(t => t.id === teamId) || nhlTeams[0];
};

const getDeployment = (ovr, pos, league) => {
  if (league === 'CHL') {
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

// --- ECONOMY & EVENTS ---
const shopItems = [
  { id: 'coach', type: 'staff', name: 'Elite Trainer', cost: 8000000, desc: 'Delays stat decline past age 30.', effect: { declineModifier: 0.5 } },
  { id: 'physio', type: 'staff', name: 'Personal Physio', cost: 6500000, desc: '+4 STM. Injury prevention.', effect: { stamina: 4 } },
  { id: 'psych', type: 'staff', name: 'Sports Psych', cost: 5000000, desc: '+5 IQ. Better event outcomes.', effect: { hockeyIQ: 5 } },
  { id: 'agent', type: 'staff', name: 'Super Agent', cost: 12000000, desc: 'Increases contract offers by 15%.', effect: { salaryModifier: 1.15 } },
  { id: 'skates', type: 'consumable', name: 'Custom Skates', cost: 1500000, descSkaters: '+4 SKT.', descGoalies: '+4 POS.', duration: 1, effect: { skating: 4 } },
  { id: 'supplements', type: 'consumable', name: 'Legal Supplements', cost: 2000000, descSkaters: '+5 PHY.', descGoalies: '+5 AGI.', duration: 2, effect: { physicality: 5 } },
  { id: 'analyst', type: 'consumable', name: 'Video Analyst', cost: 1200000, desc: '+3 IQ.', duration: 1, effect: { hockeyIQ: 3 } },
  { id: 'car', type: 'luxury', name: 'Sports Car', cost: 500000, desc: '+5 Fan Status', effect: { idolatry: 5 } },
  { id: 'house', type: 'luxury', name: 'Penthouse', cost: 3500000, desc: '+25 Fan Status', effect: { idolatry: 25 } },
  { id: 'jet', type: 'luxury', name: 'Private Jet', cost: 25000000, desc: '+100 Fan Status', effect: { idolatry: 100 } },
];

const skaterTrainingPool = [
  { id: 'ts1', name: 'Target Practice', desc: '+3 SHT', effect: { shooting: 3 }, rarity: 'Common', tag: 'SHT', flavor: 'Hours spent shooting pucks at washing machines in the driveway.' },
  { id: 'ts2', name: 'Suicide Sprints', desc: '+3 SKT', effect: { skating: 3 }, rarity: 'Common', tag: 'SKT', flavor: 'Grueling bag skates until your lungs burn and legs go numb.' },
  { id: 'ts3', name: 'Weight Room', desc: '+3 PHY', effect: { physicality: 3 }, rarity: 'Common', tag: 'PHY', flavor: 'Eating heavy, lifting heavier. Building the muscle to win the boards.' },
  { id: 'ts4', name: 'Film Session', desc: '+3 IQ', effect: { hockeyIQ: 3 }, rarity: 'Common', tag: 'MIND', flavor: 'Studying goalie tendencies and defensive coverages late into the night.' },
  { id: 'ts5', name: 'Power Skating', desc: '+2 SKT, +1 STM', effect: { skating: 2, stamina: 1 }, rarity: 'Common', tag: 'TECH', flavor: 'Refining edge work to maximize stride efficiency.' },
  { id: 'ts6', name: 'Net Front Drills', desc: '+2 SHT, +1 PHY', effect: { shooting: 2, physicality: 1 }, rarity: 'Common', tag: 'GRIT', flavor: 'Taking cross-checks while practicing deflections.' },
  { id: 'ts7', name: 'Altitude Camp', desc: '+5 STM', effect: { stamina: 5 }, rarity: 'Rare', tag: 'STM', flavor: 'A brutal month in the mountains to expand your cardiovascular limits.' },
  { id: 'ts8', name: 'Veteran Mentorship', desc: '+5 IQ', effect: { hockeyIQ: 5 }, rarity: 'Rare', tag: 'MIND', flavor: 'A retired legend takes you under their wing to teach you the nuances of the game.' },
  { id: 'ts9', name: 'Box Jumps', desc: '+3 SKT, +2 PHY', effect: { skating: 3, physicality: 2 }, rarity: 'Rare', tag: 'POW', flavor: 'Explosive plyometrics to build breakaway speed.' },
  { id: 'ts10', name: 'European Skill Coach', desc: '+3 SKT, +2 SHT', effect: { skating: 3, shooting: 2 }, rarity: 'Rare', tag: 'SKL', flavor: 'Learning edge work and deceptive release points from overseas.' },
  { id: 'ts11', name: 'Olympic Development', desc: '+4 SKT, +4 PHY', effect: { skating: 4, physicality: 4 }, rarity: 'Epic', tag: 'PRO', flavor: 'Invited to the national team’s secretive, elite summer program.' },
  { id: 'ts12', name: 'Off-Season Pro League', desc: '+5 SHT, +3 SKT', effect: { shooting: 5, skating: 3 }, rarity: 'Epic', tag: 'ELITE', flavor: 'Dominating a summer league filled with NHL superstars.' }
];

const goalieTrainingPool = [
  { id: 'tg1', name: 'Reaction Lights', desc: '+3 REF', effect: { shooting: 3 }, rarity: 'Common', tag: 'REF', flavor: 'Tracking unpredictable light boards to sharpen eye-hand coordination.' },
  { id: 'tg2', name: 'Crease Drills', desc: '+3 POS', effect: { skating: 3 }, rarity: 'Common', tag: 'POS', flavor: 'Perfecting angles and challenging shooters aggressively.' },
  { id: 'tg3', name: 'Butterfly Stretches', desc: '+3 AGI', effect: { physicality: 3 }, rarity: 'Common', tag: 'AGI', flavor: 'Extreme flexibility routines to protect the lower net.' },
  { id: 'tg4', name: 'Tape Study', desc: '+3 IQ', effect: { hockeyIQ: 3 }, rarity: 'Common', tag: 'MIND', flavor: 'Memorizing opponent shootout tendencies and set plays.' },
  { id: 'tg5', name: 'Rebound Control', desc: '+2 REF, +1 IQ', effect: { shooting: 2, hockeyIQ: 1 }, rarity: 'Common', tag: 'TECH', flavor: 'Using the blocker to safely direct pucks into the corner.' },
  { id: 'tg6', name: 'Endurance Skates', desc: '+2 POS, +1 STM', effect: { skating: 2, stamina: 1 }, rarity: 'Common', tag: 'STM', flavor: 'Skating with heavy pads until your legs feel like lead.' },
  { id: 'tg7', name: 'Vision Training', desc: '+5 REF', effect: { shooting: 5 }, rarity: 'Rare', tag: 'EYES', flavor: 'Using specialized strobe glasses to slow down the puck visually.' },
  { id: 'tg8', name: 'Goalie Guru', desc: '+5 IQ', effect: { hockeyIQ: 5 }, rarity: 'Rare', tag: 'MIND', flavor: 'Working with a legendary goalie coach to master game management.' },
  { id: 'tg9', name: 'Yoga Retreat', desc: '+3 AGI, +2 STM', effect: { physicality: 3, stamina: 2 }, rarity: 'Rare', tag: 'FLEX', flavor: 'A month of intensive yoga to increase lower body durability.' },
  { id: 'tg10', name: 'European Butterfly Camp', desc: '+3 POS, +2 REF', effect: { skating: 3, shooting: 2 }, rarity: 'Rare', tag: 'SKL', flavor: 'Learning reverse-VH mastery from Finnish goaltending legends.' },
  { id: 'tg11', name: 'National Team Camp', desc: '+4 POS, +4 AGI', effect: { skating: 4, physicality: 4 }, rarity: 'Epic', tag: 'PRO', flavor: 'Invited to be the undisputed starter for your national team.' },
  { id: 'tg12', name: 'Summer Pro Tour', desc: '+5 REF, +3 POS', effect: { shooting: 5, skating: 3 }, rarity: 'Epic', tag: 'ELITE', flavor: 'Facing down NHL snipers in high-intensity summer scrimmages.' }
];

const eventDeck = [
  {
    title: 'The Derby',
    desc: 'You play the local rivals tonight. The media asks for a quote.',
    choices: [
      { label: 'Trash talk them', isRisky: true, successChance: 0.5, successFeedback: 'The fans loved it and you backed it up with a huge win!', successEffect: { idol: 25, ovr: 0, money: 0 }, failFeedback: 'You talked big but took a bad penalty. The fans are turning on you.', failEffect: { idol: -20, ovr: 0, money: 0 } },
      { label: 'Give a boring PR answer', isRisky: false, feedback: 'Boring, but you stayed focused on the game.', effect: { idol: -5, ovr: 1, money: 0 } }
    ]
  },
  {
    title: 'Sponsorship Deal',
    desc: 'An energy drink wants to sponsor you, but requires an intense ad shoot on your only rest day.',
    choices: [
      { label: 'Take the money', isRisky: true, successChance: 0.7, successFeedback: 'You made bank and somehow still had legs for the game.', successEffect: { idol: 10, ovr: 0, money: 1500000 }, failFeedback: 'You got paid, but you looked exhausted and sluggish on the ice.', failEffect: { idol: 0, ovr: -2, money: 1500000 } },
      { label: 'Rest your body instead', isRisky: false, feedback: 'You feel fresh and ready for the next match.', effect: { idol: 0, ovr: 2, money: 0 } }
    ]
  },
  {
    title: 'Trade Rumors',
    desc: 'Your name is popping up on the trade block. The GM wants to know where your head is at.',
    choices: [
      { label: 'Demand to stay', isRisky: true, successChance: 0.6, successFeedback: 'The GM respected your loyalty. The fans adore you.', successEffect: { idol: 30, ovr: 0, money: 0 }, failFeedback: 'The GM told you it\'s a business. You feel alienated.', failEffect: { idol: -15, ovr: -1, money: 0 } },
      { label: 'Let your agent handle it', isRisky: false, feedback: 'You tuned out the noise and focused on hockey.', effect: { idol: 0, ovr: 1, money: 0 } }
    ]
  },
  {
    title: 'Locker Room Dispute',
    desc: 'Two veterans are screaming at each other after a bad loss. The room is tense.',
    choices: [
      { label: 'Step in and mediate', isRisky: true, successChance: 0.5, successFeedback: 'You calmed them down and showed real leadership.', successEffect: { idol: 10, ovr: 2, money: 0 }, failFeedback: 'They told you to mind your own business. Chemistry plummets.', failEffect: { idol: 0, ovr: -2, money: 0 } },
      { label: 'Keep your head down', isRisky: false, feedback: 'You stayed out of it, but the team vibe is definitely weird.', effect: { idol: 0, ovr: -1, money: 0 } }
    ]
  },
  {
    title: 'Charity Hospital Visit',
    desc: 'The team is visiting a children\'s hospital, but it overlaps with your extra training session.',
    choices: [
      { label: 'Go to the hospital', isRisky: false, feedback: 'The kids loved seeing you. The city embraces you.', effect: { idol: 40, ovr: 0, money: 0 } },
      { label: 'Hit the ice and train', isRisky: true, successChance: 0.2, successFeedback: 'The media didn\'t notice your absence, and the training paid off.', successEffect: { idol: 0, ovr: 2, money: 0 }, failFeedback: 'The local paper roasted you for skipping the charity event.', failEffect: { idol: -35, ovr: 1, money: 0 } }
    ]
  }
];

const shuffleArray = (array) => [...array].sort(() => Math.random() - 0.5);
const cap = (val) => Math.min(100, Math.max(0, val));
const formatMoney = (amount) => {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount}`;
};
const getIdolTier = (pts) => {
  if (pts < 100) return { label: 'Unknown', next: 100, req: 100 - pts, nextLabel: 'Known' };
  if (pts < 300) return { label: 'Known', next: 300, req: 300 - pts, nextLabel: 'Loved' };
  if (pts < 600) return { label: 'Loved', next: 600, req: 600 - pts, nextLabel: 'Icon' };
  if (pts < 1000) return { label: 'Icon', next: 1000, req: 1000 - pts, nextLabel: 'Legend' };
  return { label: 'Legend', next: 1000, req: 0, nextLabel: 'Legend' };
};

const getTransferImpact = (oldTeamId, newTeamId) => {
  if (!oldTeamId || ['OHL', 'WHL', 'QMJHL'].includes(oldTeamId)) return 0;
  if (oldTeamId === newTeamId) return 10; 
  const oldT = nhlTeams.find(t => t.id === oldTeamId);
  const newT = nhlTeams.find(t => t.id === newTeamId);
  if (!oldT || !newT) return -5;
  if (oldT.div === newT.div) return -30; 
  if (oldT.conf === newT.conf) return -15; 
  return -5; 
};

const TeamLogo = ({ teamId, league, isAHL }) => {
  const team = getTeamData(teamId, league);
  const [imgError, setImgError] = useState(false);
  const isNHL = nhlTeams.some(t => t.id === teamId) && !isAHL && !['SHL', 'Liiga', 'KHL'].includes(league);

  if (isNHL && !imgError) {
    return (
      <div className="relative w-12 h-12 flex items-center justify-center bg-white rounded-full p-1 shadow-sm border border-slate-200">
        <img 
          src={`https://assets.nhle.com/logos/nhl/svg/${teamId}_light.svg`} 
          alt={teamId} 
          className="w-full h-full object-contain" 
          onError={() => setImgError(true)} 
        />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="relative w-12 h-12 rounded-full flex items-center justify-center font-black text-sm border-2 shadow-sm bg-slate-800 text-white border-slate-600 sports-font">
        {teamId}
        {isAHL && <span className="absolute -bottom-2 -right-2 bg-amber-500 text-slate-900 text-[9px] px-1 rounded-sm font-black border border-amber-700">AHL</span>}
      </div>
    );
  }

  return (
    <div className="relative w-12 h-12 rounded-full flex items-center justify-center font-black text-sm border-2 shadow-sm sports-font" style={{ backgroundColor: team.bg, color: team.color, borderColor: team.color }}>
      {team.id}
      {isAHL && <span className="absolute -bottom-2 -right-2 bg-amber-500 text-slate-900 text-[9px] px-1 rounded-sm font-black border border-amber-700">AHL</span>}
    </div>
  );
};

// --- MAIN APP ---
function App() {
  const [screen, setScreen] = useState('creation');
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [activeTrainings, setActiveTrainings] = useState([]);
  const [activeEvent, setActiveEvent] = useState(null);
  const [activeMinigame, setActiveMinigame] = useState(null); 
  const [minigameContext, setMinigameContext] = useState('season'); 
  
  const [eventFeedback, setEventFeedback] = useState('');
  const [eventImpacts, setEventImpacts] = useState({});
  const [statChanges, setStatChanges] = useState(null); 
  
  const [seasonRecap, setSeasonRecap] = useState(null);
  const [freeAgencyOffers, setFreeAgencyOffers] = useState([]);
  const [playoffs, setPlayoffs] = useState({ deck: [], revealed: [], wins: 0, status: 'playing' });
  const [memCup, setMemCup] = useState({ round: 0, status: 'playing' }); 
  
  const [player, setPlayer] = useState({
    name: '', number: 97, pos: 'C', age: 16, ovr: 55, nat: 'CAN',
    shooting: 55, skating: 55, physicality: 55, hockeyIQ: 55, stamina: 55,
    team: null, league: null, contract: { salary: 0, years: 0 },
    stats: { 
      chl: { goals: 0, assists: 0, games: 0, plusMinus: 0, saves: 0, shots: 0, shutouts: 0 },
      ahl: { goals: 0, assists: 0, games: 0, plusMinus: 0, saves: 0, shots: 0, shutouts: 0 },
      nhl: { goals: 0, assists: 0, games: 0, plusMinus: 0, saves: 0, shots: 0, shutouts: 0 },
      titles: 0, earnings: 0, value: 50000, seasonsPlayed: 0, memCupBoost: 0 
    },
    idolatry: 0, inventory: [], buffs: [], agentRerolls: 1, teamsPlayedFor: []
  });

  const currentYear = 2026 + player.stats.seasonsPlayed;
  const isJunior = ['OHL', 'WHL', 'QMJHL'].includes(player.league);
  const isAHL = player.league === 'AHL';
  const lgKey = isJunior ? 'chl' : isAHL ? 'ahl' : 'nhl';

  const handleStart = () => {
    const leagues = ['OHL', 'WHL', 'QMJHL'];
    const assignedLeague = leagues[Math.floor(Math.random() * leagues.length)];
    let leagueTeams = assignedLeague === 'OHL' ? ohlTeams : assignedLeague === 'WHL' ? whlTeams : qmjhlTeams;
    const startTeam = leagueTeams[Math.floor(Math.random() * leagueTeams.length)];
    
    let bSht=55, bSkt=55, bPhy=55, bIq=55, bSta=55;
    if (player.pos === 'C') { bIq=65; bSkt=60; bSht=50; bPhy=50; bSta=50; }
    if (['LW', 'RW'].includes(player.pos)) { bSht=65; bSkt=60; bPhy=50; bIq=50; bSta=50; }
    if (['LD', 'RD'].includes(player.pos)) { bPhy=65; bSta=60; bIq=60; bSkt=50; bSht=40; }
    if (player.pos === 'G') { bSht=65; bSkt=65; bPhy=60; bIq=50; bSta=35; }
    
    let startOvr = Math.floor((bSht + bSkt + bPhy + bIq + bSta) / 5);

    setPlayer(p => ({
      ...p, team: startTeam.id, league: assignedLeague, teamsPlayedFor: [startTeam.id],
      shooting: bSht, skating: bSkt, physicality: bPhy, hockeyIQ: bIq, stamina: bSta, ovr: startOvr
    }));
    generateTraining(player.pos);
    setScreen('preseason');
  };

  const getActiveStat = (p, stat) => {
    let val = p[stat];
    p.buffs.forEach(b => { if (b.effect[stat]) val += b.effect[stat]; });
    return cap(val);
  };

  const advanceToOffseason = () => {
    if (player.age >= 38) { setScreen('retirement'); return; }
    
    const newBuffs = player.buffs.map(b => ({ ...b, duration: b.duration - 1 })).filter(b => b.duration > 0);
    
    let currentTeam = player.team;
    let currentLeague = player.league;
    
    if (currentLeague === 'AHL') {
       const parent = nhlTeams.find(t => t.ahlId === currentTeam);
       if (parent) {
          currentTeam = parent.id;
          currentLeague = 'NHL';
       }
    }

    setPlayer(p => ({ ...p, team: currentTeam, league: currentLeague, buffs: newBuffs }));

    if (player.age === 18 && isJunior) {
      handleDraftDay();
      return;
    }

    if (!isJunior && player.contract.years <= 0) {
      generateOffers(false, currentTeam);
    } else {
      generateTraining(player.pos);
      setScreen('preseason');
    }
  };

  const handleDraftDay = () => {
    const totalJuniorPoints = player.stats.chl.goals + player.stats.chl.assists + player.stats.memCupBoost;
    let draftStr = '';
    let idolBoost = 0;

    let isElite = player.ovr >= 66 || (['LW', 'RW', 'C'].includes(player.pos) && totalJuniorPoints > 180);
    let isGreat = player.ovr >= 63 || (['LW', 'RW', 'C'].includes(player.pos) && totalJuniorPoints > 120);

    if (isElite) { 
      draftStr = '1st Overall'; 
      idolBoost = 25; 
    } else if (isGreat) { 
      const pick = Math.floor(Math.random() * 9) + 2; 
      const suffix = pick === 2 ? 'nd' : pick === 3 ? 'rd' : 'th';
      draftStr = `with the ${pick}${suffix} Overall pick`; 
      idolBoost = 15; 
    } else { 
      const round = Math.floor(Math.random() * 6) + 2; 
      const suffix = round === 2 ? 'nd' : round === 3 ? 'rd' : 'th';
      draftStr = `in the ${round}${suffix} Round`; 
      idolBoost = 5; 
    }

    const draftedBy = nhlTeams[Math.floor(Math.random() * nhlTeams.length)];
    
    setPlayer(p => ({
      ...p, team: draftedBy.id, league: 'NHL', teamsPlayedFor: [draftedBy.id], idolatry: cap(p.idolatry + idolBoost),
      contract: { salary: 925000, years: 3 } 
    }));

    setSeasonRecap(r => ({ ...r, draftStr, draftedBy: draftedBy.name }));
    setEventFeedback(`You were drafted ${draftStr} by the ${draftedBy.name}! You signed a standard 3-year Entry Level Contract.`);
    setEventImpacts({ idol: idolBoost, money: 0, ovr: 0 });
    
    setScreen('draft');
  };

  const generateTraining = (pos) => {
    const activePool = pos === 'G' ? goalieTrainingPool : skaterTrainingPool;
    const commons = activePool.filter(t => t.rarity === 'Common');
    const rares = activePool.filter(t => t.rarity === 'Rare');
    const epics = activePool.filter(t => t.rarity === 'Epic');

    const hand = [];
    while (hand.length < 3) {
      const roll = Math.random();
      let selectedPool = commons; 
      if (roll > 0.95) selectedPool = epics; 
      else if (roll > 0.80) selectedPool = rares; 

      const randomCard = selectedPool[Math.floor(Math.random() * selectedPool.length)];
      if (!hand.find(c => c.id === randomCard.id)) { hand.push(randomCard); }
    }
    setActiveTrainings(hand);
  };

  const handleTrain = (t) => {
    const updatedPlayer = {
      ...player,
      shooting: cap(player.shooting + (t.effect.shooting || 0)),
      skating: cap(player.skating + (t.effect.skating || 0)),
      physicality: cap(player.physicality + (t.effect.physicality || 0)),
      hockeyIQ: cap(player.hockeyIQ + (t.effect.hockeyIQ || 0)),
      stamina: cap(player.stamina + (t.effect.stamina || 0)),
    };
    
    setPlayer(updatedPlayer);
    simulateSeason(updatedPlayer, t.effect);
  };

  const simulateSeason = (p, trainingEffect = {}) => {
    let currentLg = p.league;
    let waiverEvent = null;
    let currentTeam = p.team;
    let isDemoted = false;

    if (!['OHL', 'WHL', 'QMJHL'].includes(currentLg) && !['SHL', 'Liiga', 'KHL'].includes(currentLg)) {
      if (p.ovr >= 65) {
         if (currentLg === 'AHL') {
             waiverEvent = "You had a great camp and earned a call-up to the NHL roster!";
             const parentNhlTeam = nhlTeams.find(t => t.ahlId === currentTeam);
             if (parentNhlTeam) currentTeam = parentNhlTeam.id;
         }
         currentLg = 'NHL';
      } else if (p.ovr < 65) {
         if (currentLg === 'NHL') {
            const currentNhlTeam = nhlTeams.find(t => t.id === currentTeam);
            
            if (p.age <= 21) {
               currentLg = 'AHL'; 
               if (currentNhlTeam) currentTeam = currentNhlTeam.ahlId; 
               isDemoted = true;
            } else if (p.age > 33) {
               const euroDest = euroTeams[Math.floor(Math.random() * euroTeams.length)];
               currentLg = euroDest.league;
               currentTeam = euroDest.id;
               waiverEvent = "Your NHL days are over. You have signed a lucrative contract overseas in Europe.";
            } else {
               const claimed = Math.random() > 0.5;
               if (claimed) {
                 let t = nhlTeams[Math.floor(Math.random() * nhlTeams.length)];
                 currentTeam = t.id;
                 currentLg = 'NHL';
                 waiverEvent = `You were placed on waivers and claimed by the ${t.name}!`;
               } else {
                 currentLg = 'AHL';
                 if (currentNhlTeam) currentTeam = currentNhlTeam.ahlId;
                 waiverEvent = "You cleared waivers and were assigned to the AHL.";
               }
            }
         }
      }
    }

    let simSht = getActiveStat(p, 'shooting') + (trainingEffect.shooting || 0);
    let simSkt = getActiveStat(p, 'skating') + (trainingEffect.skating || 0);
    let simPhy = getActiveStat(p, 'physicality') + (trainingEffect.physicality || 0);
    let simIq = getActiveStat(p, 'hockeyIQ') + (trainingEffect.hockeyIQ || 0);
    let simSta = getActiveStat(p, 'stamina') + (trainingEffect.stamina || 0);

    if (['OHL', 'WHL', 'QMJHL'].includes(currentLg)) { simSht += 25; simSkt += 25; simIq += 25; simPhy += 25; simSta += 25; }
    if (currentLg === 'AHL') { simSht += 15; simSkt += 15; simIq += 15; simPhy += 15; simSta += 15; }
    if (['SHL', 'Liiga', 'KHL'].includes(currentLg)) { simSht += 10; simSkt += 10; simIq += 10; simPhy += 10; simSta += 10; }

    let games = ['OHL', 'WHL', 'QMJHL'].includes(currentLg) ? 68 : 70 + Math.floor(Math.random() * 12);
    if (p.pos === 'G') games = Math.floor(games * 0.8); 

    let g = 0, a = 0, pm = 0, saves = 0, shots = 0, sho = 0;
    let baseImpact = 0; 

    if (p.pos === 'G') {
      let savePctBase = 0.880 + ((simSht + simSkt + simPhy) - 150) * 0.0005;
      let actualSavePct = Math.min(0.940, Math.max(0.850, savePctBase + (Math.random() * 0.02 - 0.01)));
      shots = games * (28 + Math.floor(Math.random() * 6));
      saves = Math.floor(shots * actualSavePct);
      sho = Math.floor((actualSavePct - 0.890) * 150) + Math.floor(Math.random() * 3);
      if (sho < 0) sho = 0;
      baseImpact = (actualSavePct - 0.900) * 100; 
    } else if (['LD', 'RD'].includes(p.pos)) {
      g = Math.floor(Math.max(0, (simSht - 70) * 0.5)) + Math.floor(Math.random() * 5);
      a = Math.floor(Math.max(0, (simIq - 60) * 0.8 + (simSkt - 65) * 0.4)) + Math.floor(Math.random() * 10);
      pm = Math.floor((simPhy + simIq + simSta - 180) * 0.4) + Math.floor(Math.random() * 20 - 10);
      baseImpact = pm * 0.5;
    } else if (p.pos === 'C') {
      g = Math.floor(Math.max(0, (simSht - 63) * 1.4)) + Math.floor(Math.random() * 10);
      a = Math.floor(Math.max(0, (simIq - 63) * 1.2 + (simSkt - 63) * 0.6)) + Math.floor(Math.random() * 12);
      pm = Math.floor((simPhy + simIq + simSta - 165) * 0.4) + Math.floor(Math.random() * 15 - 5);
      baseImpact = (g + a + pm * 1.5) * 0.2;
    } else {
      g = Math.floor(Math.max(0, (simSht - 60) * 1.6 + (simSkt - 65) * 0.4)) + Math.floor(Math.random() * 12);
      a = Math.floor(Math.max(0, (simIq - 65) * 0.8 + (simSkt - 65) * 0.6)) + Math.floor(Math.random() * 8);
      pm = Math.floor((simSkt + simSht - 140) * 0.2) + Math.floor(Math.random() * 10 - 5);
      baseImpact = (g + a) * 0.25;
    }

    let titleWon = 0; 
    let rating = p.pos === 'G' ? Math.min(10, Math.max(1, 5.0 + (saves/shots - 0.900) * 100)) : Math.min(10, Math.max(1, 5.0 + (g + a + pm * 0.5) / games * 5));
    rating = Number(rating.toFixed(1));

    if (currentLg === 'AHL' && rating >= 8.0 && p.age > 21) {
       currentLg = 'NHL';
       const currentAhlTeam = ahlTeams.find(t => t.id === currentTeam);
       if (currentAhlTeam) {
           const parentNhlTeam = nhlTeams.find(t => t.ahlId === currentAhlTeam.id);
           if (parentNhlTeam) currentTeam = parentNhlTeam.id;
       }
       waiverEvent = "After tearing up the AHL in the first half of the season, you were called up to the NHL!";
       g = Math.floor(g * 0.7); 
       a = Math.floor(a * 0.7);
    }

    let standings = Math.floor(Math.random() * 16) + 1;
    if (currentLg === 'NHL') {
      let baseStanding = 32 - Math.floor((p.ovr - 60) * 0.4 + baseImpact);
      standings = Math.max(1, Math.min(32, baseStanding - Math.floor(Math.random() * 8)));
    }

    let offPercent = p.pos === 'G' ? 0 : Math.min(100, Math.round(((g + a) / ((g * 2) + 40)) * 100)); 

    let newAge = p.age + 1;
    let declineMod = p.inventory.includes('coach') ? 0.5 : 1;
    
    let st = { 
        shooting: trainingEffect.shooting || 0, 
        skating: trainingEffect.skating || 0, 
        stamina: trainingEffect.stamina || 0, 
        hockeyIQ: trainingEffect.hockeyIQ || 0, 
        physicality: trainingEffect.physicality || 0 
    };

    if (newAge <= 24) {
      let pointsToDistribute = rating >= 8.5 ? 2 : rating >= 7.0 ? 1 : 0;
      let statsToUpgrade = ['shooting', 'skating', 'stamina', 'hockeyIQ', 'physicality'];
      for(let i=0; i<pointsToDistribute; i++) {
         let s = statsToUpgrade[Math.floor(Math.random() * statsToUpgrade.length)];
         st[s]++;
      }
    } 
    
    if (newAge >= 30) {
      let agePenalty = newAge >= 34 ? 2 : 1; 
      st.skating -= Math.floor((2 * agePenalty) * declineMod);
      st.stamina -= Math.floor((3 * agePenalty) * declineMod);
      st.physicality -= Math.floor((1 * agePenalty) * declineMod);
    }

    let newSht = p.shooting + st.shooting;
    let newSkt = p.skating + st.skating;
    let newSta = p.stamina + st.stamina;
    let newIq = p.hockeyIQ + st.hockeyIQ;
    let newPhy = p.physicality + st.physicality;

    setStatChanges(st);
    setTimeout(() => setStatChanges(null), 3000);

    let salaryEarned = currentLg === 'AHL' ? 150000 : (['OHL', 'WHL', 'QMJHL'].includes(currentLg) ? 0 : p.contract.salary);
    let idolGain = ['OHL', 'WHL', 'QMJHL'].includes(currentLg) ? Math.floor((g+a)/20) : (currentLg === 'AHL' ? Math.floor((g+a+(sho*5)) / 15) : Math.floor((g+a+(sho*5)) / 3));

    const updatedLgKey = ['OHL', 'WHL', 'QMJHL'].includes(currentLg) ? 'chl' : currentLg === 'AHL' ? 'ahl' : 'nhl';

    let valIncrease = p.pos === 'G' ? (sho * 500000) + (saves * 1000) : (g * 75000) + (a * 25000) + (pm * 10000);
    let maxVal = currentLg === 'NHL' ? 20000000 : currentLg === 'AHL' ? 5000000 : 2000000;
    let newVal = Math.min(maxVal, Math.max(50000, p.stats.value + valIncrease - (declineMod < 1 ? 500000 : 0)));

    const nextOvr = Math.floor((newSht + newSkt + newPhy + newIq + newSta) / 5);

    setPlayer({
      ...p, age: newAge, team: currentTeam, league: currentLg,
      shooting: cap(newSht), skating: cap(newSkt), stamina: cap(newSta), hockeyIQ: cap(newIq), physicality: cap(newPhy),
      ovr: nextOvr,
      idolatry: cap(p.idolatry + idolGain),
      contract: { ...p.contract, years: p.contract.years > 0 ? p.contract.years - 1 : 0 },
      stats: {
        ...p.stats,
        [updatedLgKey]: {
          goals: p.stats[updatedLgKey].goals + g,
          assists: p.stats[updatedLgKey].assists + a,
          games: p.stats[updatedLgKey].games + games,
          plusMinus: p.stats[updatedLgKey].plusMinus + pm,
          saves: p.stats[updatedLgKey].saves + saves,
          shots: p.stats[updatedLgKey].shots + shots,
          shutouts: p.stats[updatedLgKey].shutouts + sho
        },
        earnings: p.stats.earnings + salaryEarned,
        value: newVal,
        seasonsPlayed: p.stats.seasonsPlayed + 1
      }
    });

    setSeasonRecap({ g, a, pm, saves, shots, sho, games, titleWon: 0, playoffWins: 0, rating, standings, offPercent, waiverEvent });
    
    const madePlayoffs = standings <= 16;
    
    if (isDemoted) {
       setActiveEvent({
         title: 'AHL DEMOTION',
         desc: `Your GM at the ${getTeamData(p.team, p.league).name} thinks you'll benefit from some time in the AHL. You've been sent down to the ${getTeamData(currentTeam, currentLg).name}.`,
         choices: [
           { label: 'Complain to the media', isRisky: true, successChance: 0.3, successFeedback: 'The fans love your fiery passion. You vow to prove the GM wrong!', successEffect: { idol: 15, ovr: 1, money: 0 }, failFeedback: 'You look like a spoiled kid. The GM fines you and the fans turn on you.', failEffect: { idol: -15, ovr: -1, money: -50000 } },
           { label: 'Put your head down and work', isRisky: false, feedback: 'You accepted the assignment like a professional and focused on your game.', effect: { idol: 5, ovr: 1, money: 0 } }
         ],
         isDemotionEvent: true,
         currentLg: currentLg,
         currentTeam: currentTeam,
         madePlayoffs: madePlayoffs
       });
       setScreen('event');
    } else {
       runPostSeasonFlow(newAge, nextOvr, currentLg, currentTeam, madePlayoffs);
    }
  };

  const runPostSeasonFlow = (pAge, pOvr, currentLg, currentTeam, madePlayoffs) => {
    if (pAge <= 19 && Math.random() > 0.4) {
        setMinigameContext('wjc');
        setScreen('intl-minigame');
    } else if (pAge > 19 && (currentYear + 1) % 4 === 0 && pOvr >= 78) {
        setMinigameContext('olympics');
        setScreen('intl-minigame');
    } else if (madePlayoffs) {
        checkPlayoffs(currentLg, currentTeam);
    } else {
       const rng = Math.random();
       if (rng < 0.4) {
         triggerMinigame();
       } else if (rng < 0.7) {
         const randomEvt = eventDeck[Math.floor(Math.random() * eventDeck.length)];
         setActiveEvent({ ...randomEvt, isDemotionEvent: false, madePlayoffs: false });
         setScreen('event');
       } else {
         setScreen('recap');
       }
    }
  };

  const triggerMinigame = () => {
    const types = player.pos === 'G' ? ['breakaway', 'shootout', 'defense', 'five_on_three', 'screened_shot'] : ['breakaway', 'shootout', 'defense', 'odd_man_rush', 'scrum'];
    setActiveMinigame(types[Math.floor(Math.random() * types.length)]);
    setMinigameContext('season');
    setScreen('minigame');
  };

  const handleMinigameChoice = (successChance, successMsg, failMsg) => {
    const scored = Math.random() < successChance;
    
    if (minigameContext === 'memcup') {
        setEventImpacts({});
        if (scored) {
           if (memCup.round === 0) { 
              setMemCup({ round: 1, status: 'playing' });
              setEventFeedback("You won the Semi-Final! " + successMsg);
           } else { 
              setMemCup({ round: 1, status: 'won' });
              setPlayer(p => ({ ...p, stats: { ...p.stats, memCupBoost: 50, titles: p.stats.titles + 1 } }));
              setEventFeedback("You won the Memorial Cup! " + successMsg);
           }
        } else {
           setMemCup({ ...memCup, status: 'lost' });
           setEventFeedback(failMsg);
        }
        setScreen('event-result');
        return;
    }
    
    if (minigameContext === 'wjc' || minigameContext === 'olympics') {
        const nat = nationalities.find(n => n.id === player.nat);
        const countryName = nat?.sentenceName || nat?.name;
        if (scored) {
           setPlayer(prev => ({ ...prev, idolatry: cap(prev.idolatry + 50), ovr: cap(prev.ovr + 1) }));
           setEventImpacts({ idol: 50, ovr: 1 });
           setEventFeedback(`You secured the Gold Medal for ${countryName}! You are a national hero! ` + successMsg);
        } else {
           setPlayer(prev => ({ ...prev, idolatry: Math.max(0, prev.idolatry - 5) }));
           setEventImpacts({ idol: -5 });
           setEventFeedback(`A devastating loss in the Gold Medal game. The fans in ${countryName} weep. ` + failMsg);
        }
        setScreen('event-result');
        return;
    }

    if (scored) {
      setPlayer(prev => ({ ...prev, idolatry: cap(prev.idolatry + 5) }));
      setEventImpacts({ idol: 5 });
      setEventFeedback(successMsg);
    } else {
      setPlayer(prev => ({ ...prev, idolatry: Math.max(0, prev.idolatry - 2) }));
      setEventImpacts({ idol: -2 });
      setEventFeedback(failMsg);
    }
    setScreen('event-result');
  };

  const handleEventChoice = (choice) => {
    let outcomeEffect;
    let outcomeFeedback;

    if (choice.isRisky) {
      const success = Math.random() < (choice.successChance || 0.5);
      outcomeEffect = success ? choice.successEffect : choice.failEffect;
      outcomeFeedback = success ? choice.successFeedback : choice.failFeedback;
    } else {
      outcomeEffect = choice.effect;
      outcomeFeedback = choice.feedback;
    }

    setPlayer(p => ({
      ...p,
      idolatry: cap(p.idolatry + (outcomeEffect.idol || 0)),
      ovr: cap(p.ovr + (outcomeEffect.ovr || 0)),
      stats: { ...p.stats, earnings: p.stats.earnings + (outcomeEffect.money || 0) }
    }));
    
    setEventImpacts(outcomeEffect);
    setEventFeedback(outcomeFeedback);
    setScreen('event-result');
  };

  const checkPlayoffs = (currentLg, currentTeamId) => {
    const wins = ['4-0', '4-1', '4-1', '4-2', '4-2', '4-2', '4-3', '4-3', '4-1', '4-2', '4-3', '4-0'];
    const losses = ['0-4', '1-4', '2-4', '3-4'];
    
    let oppPool = nhlTeams;
    if (currentLg === 'OHL') oppPool = ohlTeams;
    if (currentLg === 'WHL') oppPool = whlTeams;
    if (currentLg === 'QMJHL') oppPool = qmjhlTeams;
    if (currentLg === 'AHL') oppPool = ahlTeams;

    let validOpps = shuffleArray(oppPool.filter(t => t.id !== currentTeamId));

    const deck = shuffleArray([...wins, ...losses]).map((score, idx) => {
      let opp = validOpps[idx % validOpps.length].id; 
      return { score, opp };
    });

    setPlayoffs({ deck, revealed: [], wins: 0, status: 'playing' });
    setScreen('playoffs'); 
  };

  const handleGridClick = (index) => {
    if (playoffs.status !== 'playing' || playoffs.revealed.includes(index)) return;
    
    const result = playoffs.deck[index];
    const isLoss = result.score.endsWith('4'); 

    if (isLoss) {
      setPlayoffs({ ...playoffs, revealed: [...playoffs.revealed, index], status: 'lost' });
      return;
    }

    const newWins = playoffs.wins + 1;
    let newStatus = 'playing';

    if (newWins === 4) {
      newStatus = 'won';
      setPlayer(p => ({ 
        ...p, idolatry: cap(p.idolatry + 30), 
        stats: { ...p.stats, titles: p.stats.titles + 1 } 
      }));
    }
    setPlayoffs({ ...playoffs, revealed: [...playoffs.revealed, index], wins: newWins, status: newStatus });
  };

  const handleEndPlayoffs = () => {
    setSeasonRecap(r => ({ ...r, playoffWins: playoffs.wins, titleWon: playoffs.wins === 4 ? 1 : 0 }));
    setScreen('recap');
  };

  const proceedFromPlayoffs = () => {
    setSeasonRecap(r => ({ ...r, playoffWins: playoffs.wins, titleWon: playoffs.wins === 4 ? 1 : 0 }));
    if (playoffs.status === 'won' && ['OHL', 'WHL', 'QMJHL'].includes(player.league)) {
      setMemCup({ round: 0, status: 'playing' });
      setScreen('memorial-cup');
    } else {
      setScreen('recap');
    }
  };

  const handleEndMemCup = () => {
    setSeasonRecap(r => ({ ...r, memCupStatus: memCup.status }));
    setScreen('recap');
  };

  const generateOffers = (isTradeRequest = false, overrideTeam = null) => {
    const actingTeam = overrideTeam || player.team;
    let multi = player.inventory.includes('agent') ? 1.15 : 1.0;
    let base = (player.ovr * 100000) * multi;
    
    let offers = [];
    const isRFA = player.age === 21; 

    if (!isTradeRequest) {
      offers.push({ 
        team: actingTeam, 
        type: isRFA ? 'RFA EXTENSION' : 'EXTENSION', 
        salary: base * 1.1, 
        years: 3, 
        idolHit: 10 
      });
    }

    let offerCount = isRFA ? (Math.random() > 0.5 ? 1 : 0) : 3;
    if (isTradeRequest) offerCount = 2; 

    for(let i=0; i<offerCount; i++) {
      let t = nhlTeams[Math.floor(Math.random() * nhlTeams.length)].id;
      if (t !== actingTeam && !offers.find(o => o.team === t)) {
        offers.push({ 
          team: t, 
          type: isRFA ? 'OFFER SHEET' : (isTradeRequest ? 'TRADE' : 'FREE AGENCY'), 
          salary: base * (isRFA ? 1.5 : (0.8 + Math.random())), 
          years: Math.floor(Math.random()*3)+1, 
          idolHit: getTransferImpact(actingTeam, t) 
        });
      }
    }
    setFreeAgencyOffers(offers);
    setScreen('transfer');
  };

  const handleTradeRequest = () => {
    setPlayer(p => ({ ...p, idolatry: Math.max(0, p.idolatry - 20) })); 
    generateOffers(true, player.team);
  };

  const signContract = (o) => {
    setPlayer(p => {
      const newTeams = p.teamsPlayedFor.includes(o.team) ? p.teamsPlayedFor : [...p.teamsPlayedFor, o.team];
      return {
        ...p, team: o.team, league: 'NHL', idolatry: cap(p.idolatry + o.idolHit), teamsPlayedFor: newTeams,
        contract: { salary: o.salary, years: o.years }
      }
    });
    generateTraining(player.pos);
    setScreen('preseason');
  };

  const buyItem = (item) => {
    if (player.stats.earnings >= item.cost && !player.inventory.includes(item.id)) {
      let newP = { ...player };
      newP.stats.earnings -= item.cost;
      if (item.type === 'consumable') {
        newP.buffs.push(item);
      } else {
        newP.inventory.push(item.id);
        if (item.effect.stamina) newP.stamina = cap(newP.stamina + item.effect.stamina);
        if (item.effect.hockeyIQ) newP.hockeyIQ = cap(newP.hockeyIQ + item.effect.hockeyIQ);
        if (item.effect.idolatry) newP.idolatry = cap(newP.idolatry + item.effect.idolatry);
      }
      setPlayer(newP);
    }
  };

  const handleContinueEvent = () => {
    if (minigameContext === 'memcup') {
      setMinigameContext('season');
      setScreen('memorial-cup');
    } else if (minigameContext === 'wjc' || minigameContext === 'olympics') {
      setMinigameContext('season');
      // Fix: Safely route to playoffs from intl tournament if they qualified
      if (seasonRecap && seasonRecap.standings <= 16) {
          checkPlayoffs(player.league, player.team);
      } else {
          setScreen('recap');
      }
    } else if (activeEvent && activeEvent.isDemotionEvent) {
      const lg = activeEvent.currentLg;
      const teamId = activeEvent.currentTeam;
      const playoffs = activeEvent.madePlayoffs;
      setActiveEvent(null); 
      if (playoffs) checkPlayoffs(lg, teamId);
      else setScreen('recap');
    } else {
      setActiveEvent(null); 
      setScreen('recap');
    }
  };

  const tier = getIdolTier(player.idolatry);

  // --- SCREENS ---

  if (screen === 'creation') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-xl glass-card rounded-2xl p-10 text-center">
          <h2 className="text-emerald-600 font-bold tracking-widest mb-2 sports-font">CAREER MODE</h2>
          <h1 className="text-6xl font-black mb-10 text-slate-900 italic sports-font uppercase tracking-tighter">THE FRANCHISE</h1>
          
          <input 
            type="text" placeholder="Your Last Name" 
            className="w-full bg-white border border-slate-300 text-slate-900 p-4 rounded-lg mb-6 text-center font-bold focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all shadow-sm font-sans"
            onChange={(e) => setPlayer({...player, name: e.target.value})}
          />
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            {[
              { id: 'LW', name: 'Left Wing', num: 13 },
              { id: 'C', name: 'Center', num: 97 },
              { id: 'RW', name: 'Right Wing', num: 88 },
              { id: 'LD', name: 'Left Defense', num: 77 },
              { id: 'RD', name: 'Right Defense', num: 8 },
              { id: 'G', name: 'Goaltender', num: 31 }
            ].map(p => (
              <button 
                key={p.id} 
                onClick={() => setPlayer({...player, pos: p.id, number: p.num})} 
                className={`p-4 rounded-xl border transition-colors ${player.pos === p.id ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
              >
                <h3 className="text-3xl font-black text-slate-900 sports-font">{p.id}</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 font-sans">{p.name}</p>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-10">
            {nationalities.map(n => (
              <button 
                key={n.id} 
                onClick={() => setPlayer({...player, nat: n.id})} 
                className={`p-3 rounded-xl border transition-colors ${player.nat === n.id ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-slate-200 bg-white hover:bg-slate-50'} flex items-center justify-center`}
                title={n.name}
              >
                <img src={n.img} alt={n.name} className="w-8 h-6 object-cover rounded-sm shadow-sm" />
              </button>
            ))}
          </div>

          <button onClick={handleStart} disabled={!player.name} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-lg text-xl disabled:opacity-50 transition-colors shadow-md sports-font tracking-wide">
            LACE UP THE SKATES
          </button>
        </div>
      </div>
    );
  }

  if (screen === 'retirement') {
    const isLegend = player.idolatry >= 1000;
    const awards = [];
    if (isLegend) awards.push({ name: 'Franchise Legend', desc: 'They built you a statue outside the arena.' });
    if (player.teamsPlayedFor.length === 1) awards.push({ name: 'One Club Man', desc: 'You wore a single sweater your entire career.' });
    
    if (player.pos === 'G') {
       if (player.stats.nhl.shutouts > 50) awards.push({ name: 'Brick Wall', desc: 'Over 50 NHL shutouts.' });
       if (player.stats.nhl.games >= 800) awards.push({ name: 'Ironman', desc: 'Played over 800 NHL games.' });
    } else {
       if (player.stats.nhl.goals > 500) awards.push({ name: 'Goal Machine', desc: 'Over 500 NHL goals. An absolute sniper.' });
       if (player.stats.nhl.assists > 300) awards.push({ name: 'The Maestro', desc: 'Over 300 NHL assists. You ran the offense.' });
       if (player.stats.nhl.games >= 800) awards.push({ name: 'Ironman', desc: 'Played over 800 NHL games. You never quit.' });
    }
    
    if (player.stats.titles >= 5) awards.push({ name: 'Serial Winner', desc: '5+ Championships. The ultimate competitor.' });

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 py-12 bg-slate-100">
        <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-[2.5rem] p-12 text-slate-900 relative overflow-hidden shadow-2xl">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-amber-100 rounded-full blur-[100px] opacity-60 pointer-events-none"></div>
          
          <p className="text-emerald-600 font-bold tracking-widest uppercase mb-3 text-center sports-font">END OF CAREER</p>
          <h1 className="text-6xl font-black italic mb-12 text-center sports-font tracking-tighter uppercase">{isLegend ? 'THEY BUILT YOU A STATUE' : 'YOU HUNG UP THE SKATES'}</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
            <div className="space-y-6 text-xl font-medium text-slate-700 font-sans">
              <h2 className="text-2xl font-black text-slate-900 border-b border-slate-200 pb-2 sports-font uppercase">NHL CAREER STATS</h2>
              <div className="flex justify-between pb-2"><span className="text-slate-500">Games Played</span> <span className="font-bold text-slate-900 sports-font">{player.stats.nhl.games}</span></div>
              
              {player.pos === 'G' ? (
                <>
                  <div className="flex justify-between pb-2"><span className="text-slate-500">Career SV%</span> <span className="font-bold text-slate-900 sports-font">{player.stats.nhl.shots > 0 ? (player.stats.nhl.saves / player.stats.nhl.shots).toFixed(3).replace('0.', '.') : '.000'}</span></div>
                  <div className="flex justify-between pb-2"><span className="text-slate-500">Shutouts</span> <span className="font-bold text-slate-900 sports-font">{player.stats.nhl.shutouts}</span></div>
                </>
              ) : (
                <>
                  <div className="flex justify-between pb-2"><span className="text-slate-500">Total Goals</span> <span className="font-bold text-slate-900 sports-font">{player.stats.nhl.goals}</span></div>
                  <div className="flex justify-between pb-2"><span className="text-slate-500">Assists</span> <span className="font-bold text-slate-900 sports-font">{player.stats.nhl.assists}</span></div>
                </>
              )}

              <div className="flex justify-between pb-2"><span className="text-slate-500">Titles Won</span> <span className="text-amber-500 font-black text-2xl sports-font">{player.stats.titles}</span></div>
              <div className="flex justify-between pt-2 border-t border-slate-200"><span className="text-slate-500">Career Earnings</span> <span className="font-bold text-emerald-600 text-2xl sports-font">{formatMoney(player.stats.earnings)}</span></div>
            </div>

            <div>
               <h2 className="text-2xl font-black text-slate-900 border-b border-slate-200 pb-2 mb-6 sports-font uppercase">TROPHY CABINET</h2>
               <div className="space-y-4">
                 {awards.length === 0 && <p className="text-slate-500 italic font-sans">A solid, respectable career.</p>}
                 {awards.map((award, idx) => (
                   <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                     <p className="font-black text-slate-900 text-lg sports-font">{award.name}</p>
                     <p className="text-sm text-slate-600 mt-1 font-sans">{award.desc}</p>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const TopDashboard = () => {
    return (
      <div className="w-full max-w-5xl mx-auto flex flex-col gap-3 mb-4 z-10 relative">
        <div className="glass-card rounded-2xl p-4 px-6 relative flex justify-between items-center">
          <div className="flex items-center gap-5">
            <div className="text-center flex flex-col items-center justify-center">
              <p className="text-6xl font-black text-slate-900 sports-font leading-none">{player.ovr}</p>
              <p className="text-[10px] font-bold text-slate-500 tracking-widest mt-1 font-sans">OVR</p>
            </div>
            
            <div className="flex items-center gap-4 border-l-2 border-slate-200 pl-5 ml-1">
              <div className="bg-slate-900 text-white rounded-xl w-14 h-14 flex items-center justify-center font-black text-3xl shadow-md sports-font shrink-0">
                {player.number}
              </div>
              
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-1">
                  <img 
                    src={nationalities.find(n => n.id === player.nat)?.img} 
                    alt={player.nat} 
                    className="w-8 h-6 object-cover rounded-sm border border-slate-300 shadow-sm" 
                  />
                  <h1 className="text-3xl sm:text-4xl font-black text-slate-900 uppercase tracking-tighter sports-font leading-none m-0 p-0">
                    {player.name}
                  </h1>
                </div>
                <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-widest font-sans leading-none mt-1">
                  {player.pos} · {getDeployment(player.ovr, player.pos, player.league)} · {isJunior ? `${player.league} JUNIORS` : getTeamData(player.team, player.league).name} · {player.age} YRS OLD
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-4 items-center">
            {!isJunior && (
              <button onClick={() => setIsShopOpen(true)} className="bg-white hover:bg-slate-50 border-2 border-slate-200 rounded-xl px-5 py-3 text-sm font-bold shadow-sm transition-all flex items-center gap-2 font-sans">
                🛒 <span className="hidden sm:inline tracking-wide">SHOP</span>
              </button>
            )}
            {player.team && <TeamLogo teamId={player.team} league={player.league} isAHL={isAHL} />}
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {player.pos === 'G' ? (
            <>
              <div className="glass-card rounded-xl py-4 px-2 flex flex-col justify-center items-center">
                <p className="text-4xl font-black text-emerald-600 sports-font leading-none mb-1">{player.stats[lgKey].shots > 0 ? (player.stats[lgKey].saves / player.stats[lgKey].shots).toFixed(3).replace('0.', '.') : '.000'}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase font-sans leading-none">SV%</p>
              </div>
              <div className="glass-card rounded-xl py-4 px-2 flex flex-col justify-center items-center">
                <p className="text-4xl font-black text-slate-900 sports-font leading-none mb-1">{player.stats[lgKey].games > 0 ? ((player.stats[lgKey].shots - player.stats[lgKey].saves) / player.stats[lgKey].games).toFixed(2) : '0.00'}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase font-sans leading-none">GAA</p>
              </div>
              <div className="glass-card rounded-xl py-4 px-2 flex flex-col justify-center items-center">
                <p className="text-4xl font-black text-slate-900 sports-font leading-none mb-1">{player.stats[lgKey].shutouts}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase font-sans leading-none">SHO</p>
              </div>
            </>
          ) : (
            <>
              <div className="glass-card rounded-xl py-4 px-2 flex flex-col justify-center items-center">
                <p className="text-4xl font-black text-emerald-600 sports-font leading-none mb-1">{player.stats[lgKey].goals}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase font-sans leading-none">GOALS</p>
              </div>
              <div className="glass-card rounded-xl py-4 px-2 flex flex-col justify-center items-center">
                <p className="text-4xl font-black text-slate-900 sports-font leading-none mb-1">{player.stats[lgKey].assists}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase font-sans leading-none">ASSISTS</p>
              </div>
              <div className="glass-card rounded-xl py-4 px-2 flex flex-col justify-center items-center">
                <p className="text-4xl font-black text-slate-900 sports-font leading-none mb-1">{player.stats[lgKey].plusMinus > 0 ? `+${player.stats[lgKey].plusMinus}` : player.stats[lgKey].plusMinus}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase font-sans leading-none">+/-</p>
              </div>
            </>
          )}
          <div className="glass-card rounded-xl py-4 px-2 flex flex-col justify-center items-center">
            <p className="text-4xl font-black text-amber-500 sports-font leading-none mb-1">{player.stats.titles}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase font-sans leading-none">TITLES</p>
          </div>
          <div className="glass-card rounded-xl py-4 px-2 flex flex-col justify-center items-center bg-blue-50/50 border-blue-200">
            <p className="text-4xl font-black text-blue-600 sports-font leading-none mb-1">{formatMoney(player.stats.value)}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase font-sans leading-none">VALUE</p>
          </div>
          <div className="glass-card rounded-xl py-4 px-2 flex flex-col justify-center items-center bg-amber-50/50 border-amber-200">
            <p className="text-4xl font-black text-amber-600 sports-font leading-none mb-1">{formatMoney(player.stats.earnings)}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase font-sans leading-none">EARNED</p>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-3">
          {[
            { label: player.pos === 'G' ? 'REFLEXES' : 'SHOOTING', key: 'shooting', val: getActiveStat(player, 'shooting') },
            { label: player.pos === 'G' ? 'POSITIONING' : 'SKATING', key: 'skating', val: getActiveStat(player, 'skating') },
            { label: player.pos === 'G' ? 'AGILITY' : 'PHYSICALITY', key: 'physicality', val: getActiveStat(player, 'physicality') },
            { label: 'HOCKEY IQ', key: 'hockeyIQ', val: getActiveStat(player, 'hockeyIQ') },
            { label: 'STAMINA', key: 'stamina', val: getActiveStat(player, 'stamina') }
          ].map(attr => {
            const change = statChanges ? statChanges[attr.key] : 0;
            const isUpgraded = change > 0;
            const isDowngraded = change < 0;
            
            return (
              <div key={attr.label} className={`glass-card rounded-xl py-4 px-2 flex flex-col justify-center items-center relative transition-colors duration-500 ${isUpgraded ? 'bg-emerald-50 border-emerald-300' : isDowngraded ? 'bg-red-50 border-red-300' : 'bg-white'}`}>
                {isUpgraded && <span className="absolute top-2 right-2 text-emerald-500 text-sm font-black tracking-tighter">▲{change}</span>}
                {isDowngraded && <span className="absolute top-2 right-2 text-red-500 text-sm font-black tracking-tighter">▼{Math.abs(change)}</span>}
                <p className={`text-4xl font-black sports-font leading-none mb-1 ${isUpgraded ? 'text-emerald-600' : isDowngraded ? 'text-red-600' : 'text-slate-900'}`}>{attr.val}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase mt-1 font-sans leading-none">{attr.label}</p>
              </div>
            );
          })}
        </div>

        <div className="glass-card rounded-xl p-5 flex flex-col gap-3">
          <div className="flex justify-between items-end font-sans">
            <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1 leading-none">FAN STATUS: <span className="text-sm font-black text-slate-900 ml-1 sports-font">{tier.label}</span></p>
            {tier.req > 0 ? (
              <p className="text-[10px] font-bold text-slate-500 leading-none">Need {tier.req} pts to {tier.nextLabel}</p>
            ) : (
              <p className="text-[10px] font-bold text-emerald-600 leading-none">Max Icon Status 🏆</p>
            )}
          </div>
          <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden shadow-inner">
            <div className="h-full bg-gradient-to-r from-orange-400 via-amber-400 to-emerald-500 transition-all duration-500" style={{ width: `${(player.idolatry / 1000) * 100}%` }}></div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen p-3 md:p-6 bg-slate-50 relative flex flex-col font-sans">
      {isShopOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl h-full flex flex-col shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 bg-slate-50 rounded-t-2xl">
              <h2 className="text-2xl font-bold text-slate-900 sports-font tracking-wide">SHOP</h2>
              <div className="text-right">
                <p className="text-emerald-600 font-black text-2xl sports-font">{formatMoney(player.stats.earnings)}</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {['staff', 'consumable', 'luxury'].map(category => (
                <div key={category} className="mb-6">
                  <h3 className="text-sm font-bold text-slate-500 tracking-widest uppercase mb-3 border-b pb-2 font-sans">
                    {category === 'staff' ? '💪 PERMANENT STAFF' : category === 'consumable' ? '⏳ TEMPORARY BOOSTS' : '💎 LUXURY & FANS'}
                  </h3>
                  <div className="space-y-3">
                    {shopItems.filter(i => i.type === category).map(item => {
                      let isOwned = player.inventory.includes(item.id) || player.buffs.find(b=>b.id===item.id);
                      let canAfford = player.stats.earnings >= item.cost;
                      let displayedDesc = item.desc;
                      if (item.descSkaters && item.descGoalies) {
                         displayedDesc = player.pos === 'G' ? item.descGoalies : item.descSkaters;
                      }
                      
                      return (
                        <div key={item.id} className={`p-4 rounded-xl border ${isOwned ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-bold text-slate-900 text-lg font-sans">{item.name}</p>
                              <p className="text-xs text-slate-500 mt-1">{displayedDesc}</p>
                            </div>
                            <p className={`font-black sports-font ${isOwned ? 'text-emerald-600' : 'text-slate-500'}`}>
                              {isOwned ? '✓ OWNED' : formatMoney(item.cost)}
                            </p>
                          </div>
                          {!isOwned && (
                            <button disabled={!canAfford} onClick={() => buyItem(item)} className="w-full mt-3 bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-50 py-2 rounded text-sm font-bold border border-slate-300 transition-colors cursor-pointer relative z-10 font-sans tracking-wide">
                              BUY
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 rounded-b-2xl">
              <button onClick={() => setIsShopOpen(false)} className="w-full bg-slate-800 hover:bg-slate-700 text-white p-4 rounded-xl font-bold shadow-md transition-colors cursor-pointer relative z-10 font-sans tracking-wide">CLOSE SHOP</button>
            </div>
          </div>
        </div>
      )}

      {screen !== 'creation' && screen !== 'retirement' && <TopDashboard />}

      <div className="w-full max-w-5xl mx-auto pb-10">

        {screen === 'draft' && (
          <div className="glass-card p-10 rounded-3xl mt-2 text-center border-t-4 border-t-emerald-500 font-sans">
            <h2 className="text-4xl font-black text-slate-900 uppercase mb-6 sports-font tracking-tighter">DRAFT DAY</h2>
            <p className="text-2xl italic text-slate-700 mb-10 leading-relaxed max-w-2xl mx-auto">"{eventFeedback}"</p>
            <button onClick={() => { generateTraining(player.pos); setScreen('preseason'); }} className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg font-black py-4 px-12 rounded-xl text-xl transition-transform hover:-translate-y-1 cursor-pointer relative z-10 sports-font tracking-widest uppercase">Start Rookie Season</button>
          </div>
        )}

        {screen === 'preseason' && (
          <div className="glass-card p-10 rounded-3xl mt-2 border-t-4 border-t-emerald-500 relative overflow-hidden">
            <h2 className="text-4xl font-black italic text-slate-900 uppercase mb-2 text-center sports-font tracking-tighter">PRE-SEASON {currentYear}</h2>
            <p className="text-slate-500 text-center mb-10 font-medium text-lg font-sans">The dice rolled three upgrades. Pick one focus.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {activeTrainings.map(t => (
                <div 
                  key={t.id} onClick={() => handleTrain(t)}
                  className={`bg-white border-2 rounded-2xl cursor-pointer relative overflow-hidden transition-all hover:-translate-y-1 hover:border-emerald-500 hover:shadow-xl flex flex-col min-h-[16rem] ${t.rarity === 'Epic' ? 'border-amber-400 bg-amber-50/20' : t.rarity === 'Rare' ? 'border-blue-300 bg-blue-50/20' : 'border-slate-200'}`}
                >
                  <div className="relative z-10 p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        {t.rarity !== 'Common' ? (
                          <span className="bg-slate-900 text-white text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest font-sans">{t.rarity}</span>
                        ) : (
                          <span></span>
                        )}
                        <span className="text-4xl font-black text-slate-200 opacity-60 uppercase sports-font tracking-tighter">{t.tag}</span>
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 uppercase leading-tight mb-3 text-center sports-font mt-2">{t.name}</h3>
                      <p className="text-sm text-slate-500 leading-relaxed italic text-center font-sans mb-4">{t.flavor}</p>
                    </div>

                    <div className="mt-auto text-center pt-4">
                      <span className="inline-block bg-white text-emerald-600 border border-emerald-200 font-bold px-4 py-2 rounded-lg text-sm shadow-sm font-sans">
                        {t.desc}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {screen === 'intl-minigame' && (() => {
          const nat = nationalities.find(n => n.id === player.nat);
          const countryName = nat?.sentenceName || nat?.name;
          
          return (
          <div className="glass-card p-12 rounded-3xl mt-2 border-t-4 border-t-amber-400 text-center relative overflow-hidden font-sans">
             <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/ice-pattern.png')] pointer-events-none"></div>
             
             <h2 className="text-5xl font-black mb-4 text-amber-500 sports-font tracking-tighter uppercase relative z-10">🌍 INTERNATIONAL DUTY 🌍</h2>
             <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto relative z-10 leading-relaxed flex items-center justify-center flex-wrap gap-2">
               You are representing <span className="font-black text-slate-900 flex items-center gap-2">{countryName} <img src={nat?.img} alt={player.nat} className="w-6 h-4 object-cover rounded-[2px] border border-slate-300" /></span> in the {minigameContext === 'wjc' ? 'World Junior Gold Medal game' : 'Winter Games Final'}! The game is tied in the 3rd period. 
             </p>

             <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto relative z-10">
                {player.pos === 'G' ? (
                   <>
                      <button onClick={() => handleMinigameChoice(0.4 + player.physicality/200, "You smothered the rebound to kill the play!", "You gave up a juicy rebound and they capitalized.")} className="bg-white hover:bg-slate-50 border-2 border-slate-200 py-8 px-4 rounded-2xl font-bold text-2xl text-slate-900 transition-all hover:border-amber-400 hover:shadow-md cursor-pointer flex flex-col items-center sports-font">
                        Swallow Rebound <span className="text-sm text-amber-600 font-normal mt-3 bg-amber-50 px-3 py-1 rounded-full uppercase tracking-widest font-sans border border-amber-200">AGI</span>
                      </button>
                      <button onClick={() => handleMinigameChoice(0.4 + player.hockeyIQ/200, "You perfectly directed traffic and cut off the passing lane!", "You were out of position and they scored on a cross-crease pass.")} className="bg-white hover:bg-slate-50 border-2 border-slate-200 py-8 px-4 rounded-2xl font-bold text-2xl text-slate-900 transition-all hover:border-emerald-400 hover:shadow-md cursor-pointer flex flex-col items-center sports-font">
                        Direct Traffic <span className="text-sm text-emerald-600 font-normal mt-3 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest font-sans border border-emerald-200">IQ</span>
                      </button>
                      <button onClick={() => handleMinigameChoice(0.4 + (player.shooting+player.physicality)/400, "You made an unbelievable desperation save at the buzzer!", "You dove across the crease but couldn't get there in time.")} className="bg-white hover:bg-slate-50 border-2 border-slate-200 py-8 px-4 rounded-2xl font-bold text-2xl text-slate-900 transition-all hover:border-blue-400 hover:shadow-md cursor-pointer flex flex-col items-center sports-font">
                        Desperation Save <span className="text-sm text-blue-600 font-normal mt-3 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest font-sans border border-blue-200">REF + AGI</span>
                      </button>
                   </>
                ) : (
                   <>
                      <button onClick={() => handleMinigameChoice(0.4 + player.physicality/200, "You laid a massive hit to free up the puck!", "You missed the hit and gave up an odd-man rush.")} className="bg-white hover:bg-slate-50 border-2 border-slate-200 py-8 px-4 rounded-2xl font-bold text-2xl text-slate-900 transition-all hover:border-amber-400 hover:shadow-md cursor-pointer flex flex-col items-center sports-font">
                        Big Hit <span className="text-sm text-amber-600 font-normal mt-3 bg-amber-50 px-3 py-1 rounded-full uppercase tracking-widest font-sans border border-amber-200">PHY</span>
                      </button>
                      <button onClick={() => handleMinigameChoice(0.4 + player.hockeyIQ/200, "You found the soft spot in the zone and called for the pass!", "You read the play wrong and skated into coverage.")} className="bg-white hover:bg-slate-50 border-2 border-slate-200 py-8 px-4 rounded-2xl font-bold text-2xl text-slate-900 transition-all hover:border-emerald-400 hover:shadow-md cursor-pointer flex flex-col items-center sports-font">
                        Find Open Ice <span className="text-sm text-emerald-600 font-normal mt-3 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest font-sans border border-emerald-200">IQ</span>
                      </button>
                      <button onClick={() => handleMinigameChoice(0.4 + (player.skating+player.shooting)/400, "You flew down the wing and ripped it top shelf!", "You lost your edge and fumbled the puck.")} className="bg-white hover:bg-slate-50 border-2 border-slate-200 py-8 px-4 rounded-2xl font-bold text-2xl text-slate-900 transition-all hover:border-blue-400 hover:shadow-md cursor-pointer flex flex-col items-center sports-font">
                        Rush the Net <span className="text-sm text-blue-600 font-normal mt-3 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest font-sans border border-blue-200">SKT + SHT</span>
                      </button>
                   </>
                )}
             </div>
          </div>
          );
        })()}

        {screen === 'recap' && (() => {
          let narrative = "";
          let narrativeTitle = "";

          // --- DYNAMIC RATING PENALTY ---
          let displayRating = seasonRecap.rating;
          
          if (seasonRecap.standings > 16) {
             displayRating = Math.min(displayRating, 8.5); // Missed Playoffs
          } else if (seasonRecap.playoffWins <= 1 && seasonRecap.playoffWins !== 4) {
             displayRating = Math.min(displayRating, 8.9); // First Round Exit
          } else if (seasonRecap.playoffWins === 2) {
             displayRating = Math.min(displayRating, 9.4); // Second Round Exit
          } else if (seasonRecap.playoffWins === 3) {
             displayRating = Math.min(displayRating, 9.8); // Heartbreak in Finals
          } else if (seasonRecap.playoffWins === 4) {
             displayRating = Math.min(10.0, displayRating + 0.4); // Champions Bump
          }

          if (seasonRecap.memCupStatus === 'lost') {
             displayRating = Math.min(displayRating, 9.8);
          } else if (seasonRecap.memCupStatus === 'won') {
             displayRating = Math.min(10.0, displayRating + 0.5);
          }

          displayRating = Math.round(displayRating);

          // --- NARRATIVE ENGINE ---
          if (['OHL', 'WHL', 'QMJHL'].includes(player.league)) {
              if (seasonRecap.memCupStatus === 'won') {
                  narrativeTitle = "MEMORIAL CUP CHAMPIONS";
                  narrative = "You conquered junior hockey. You are a legend to these kids.";
              } else if (seasonRecap.memCupStatus === 'lost') {
                  narrativeTitle = "HEARTBREAK IN THE FINAL";
                  narrative = "You reached the ultimate junior stage but fell just short.";
              } else if (seasonRecap.playoffWins === 4) {
                  narrativeTitle = "LEAGUE CHAMPIONS";
                  narrative = "You won your league but fell short of the ultimate Memorial Cup prize.";
              } else if (seasonRecap.playoffWins >= 2) {
                  narrativeTitle = "SOLID JUNIOR CAMPAIGN";
                  narrative = "A good playoff run, but the ultimate prize eluded you.";
              } else {
                  narrativeTitle = "BACK TO CLASS";
                  narrative = "Your junior season ended early. Time to hit the weight room.";
              }
          } else if (player.league === 'AHL') {
              if (seasonRecap.playoffWins === 4) {
                  narrativeTitle = "CALDER CUP CHAMPIONS";
                  narrative = "You carried your squad to the AHL championship. The NHL is calling.";
              } else if (seasonRecap.playoffWins >= 2) {
                  narrativeTitle = "AHL CONTENDERS";
                  narrative = "A deep run in the minors. You're proving you belong at the next level.";
              } else if (seasonRecap.standings <= 16) {
                  narrativeTitle = "EARLY EXIT";
                  narrative = "The bus rides get longer when you lose early in the playoffs.";
              } else {
                  narrativeTitle = "MINOR LEAGUE GRIND";
                  narrative = "You missed the playoffs entirely. A tough year in the A.";
              }
          } else {
              if (seasonRecap.standings <= 16) {
                  if (seasonRecap.playoffWins === 4) {
                      narrativeTitle = "STANLEY CUP CHAMPIONS";
                      narrative = "Absolute glory. You climbed the mountain and won it all!";
                  } else if (seasonRecap.standings === 1 && seasonRecap.playoffWins < 2) {
                      narrativeTitle = "HISTORIC COLLAPSE";
                      narrative = "The fans are furious. You dominated the regular season only to choke when it mattered most.";
                  } else if (seasonRecap.standings >= 13 && seasonRecap.playoffWins === 4) {
                       narrativeTitle = "CINDERELLA STORY";
                       narrative = "From barely squeaking into the playoffs to hoisting the cup! The city will never forget this.";
                  } else if (seasonRecap.playoffWins >= 2) {
                       narrativeTitle = "VALIANT RUN";
                       narrative = "A deep playoff run that fell just short. The fans are proud, but hungry for more.";
                  } else {
                       narrativeTitle = "EARLY EXIT";
                       narrative = "A solid season erased by a quick playoff elimination. Back to the drawing board.";
                  }
              } else {
                  if (displayRating >= 8) {
                       narrativeTitle = "A ONE-MAN SHOW";
                       narrative = "You played out of your mind, but hockey is a team game. You can only carry them so far.";
                  } else {
                       narrativeTitle = "MISSED THE DANCE";
                       narrative = "A disappointing campaign. Time to hit the golf course and rebuild for next year.";
                  }
              }
          }

          return (
            <div className="glass-card p-10 rounded-3xl mt-2 border-t-4 border-t-blue-500 flex flex-col items-start w-full">
              <div className="flex justify-between items-center border-b border-slate-200 pb-4 mb-6 font-sans w-full">
                <h2 className="text-blue-600 font-bold tracking-widest uppercase text-lg sports-font">THE RINK REPORT</h2>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">
                   {isJunior ? (player.age === 17 ? 'JUNIOR YEAR 1' : 'JUNIOR YEAR 2') : (player.stats.seasonsPlayed === 3 ? 'ROOKIE SEASON' : `NHL SEASON ${player.stats.seasonsPlayed - 2}`)}
                </p>
              </div>
              
              <div className="w-full mb-8">
                <div className="flex flex-wrap items-center gap-4 mb-2">
                  <h1 className="text-4xl font-black text-slate-900 italic uppercase text-left sports-font tracking-tighter m-0">
                    {narrativeTitle}
                  </h1>
                  <div className={`px-3 py-1.5 rounded-lg flex items-center gap-2.5 border shadow-sm ${displayRating >= 8.0 ? 'bg-amber-100 border-amber-300 text-amber-700' : displayRating >= 6.0 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-100 border-slate-300 text-slate-700'}`}>
                    <div className="flex flex-col text-right justify-center mt-0.5">
                      <span className="text-[9px] font-bold tracking-widest uppercase font-sans leading-none mb-[2px]">SEASON</span>
                      <span className="text-[9px] font-bold tracking-widest uppercase font-sans leading-none">RATING</span>
                    </div>
                    <span className="text-3xl font-black sports-font leading-none">{displayRating}</span>
                  </div>
                </div>
                <p className="text-lg text-slate-600 font-sans italic text-left m-0">"{narrative}"</p>
              </div>

              {seasonRecap.waiverEvent && (
                <div className="bg-purple-50 border border-purple-200 text-purple-700 p-4 rounded-xl mb-8 font-bold text-center font-sans w-full">
                    📰 {seasonRecap.waiverEvent}
                </div>
              )}

              <ul className="space-y-4 text-slate-600 text-lg mb-10 text-left w-full font-sans">
                <li className="border-l-4 border-blue-500 pl-4 py-1">🏅 {getTeamData(player.team, player.league).name} finished <strong>#{seasonRecap.standings}</strong> in the regular season standings.</li>
                
                {seasonRecap.standings <= 16 ? (
                  <li className={`border-l-4 ${seasonRecap.playoffWins === 4 ? 'border-amber-500 text-amber-700 font-bold' : 'border-red-500'} pl-4 py-1`}>
                    {seasonRecap.playoffWins === 4 ? '🏆 You went all the way and won the Cup!' : 
                     seasonRecap.playoffWins === 3 ? '💔 Heartbreak in the Finals. Eliminated in the last round.' :
                     seasonRecap.playoffWins === 2 ? '⚔️ A deep run, but eliminated in the Conference Finals.' :
                     seasonRecap.playoffWins === 1 ? '❌ Knocked out in the second round.' :
                     '🛑 An embarrassing first-round exit.'}
                  </li>
                ) : (
                  <li className="border-l-4 border-slate-500 pl-4 py-1">
                    ⛳ Missed the playoffs entirely. 
                  </li>
                )}

                {seasonRecap.memCupStatus === 'won' && (
                  <li className="border-l-4 border-amber-500 pl-4 py-1 text-amber-700 font-bold">🏆 You conquered the Memorial Cup! The ultimate junior glory.</li>
                )}
                {seasonRecap.memCupStatus === 'lost' && (
                  <li className="border-l-4 border-red-500 pl-4 py-1">💔 A devastating loss in the Memorial Cup tournament.</li>
                )}
                
                {player.pos === 'G' ? (
                  <li className="border-l-4 border-blue-500 pl-4 py-1">🥅 You recorded a <strong className="text-slate-900">{(seasonRecap.saves / seasonRecap.shots).toFixed(3).replace('0.', '.')} SV%</strong> and <strong className="text-slate-900">{seasonRecap.sho} shutouts</strong> in {seasonRecap.games} games.</li>
                ) : ['LD', 'RD'].includes(player.pos) ? (
                  <li className="border-l-4 border-blue-500 pl-4 py-1">🛡️ You anchored the defense, logging <strong className="text-slate-900">{seasonRecap.g}G, {seasonRecap.a}A</strong> and a <strong className="text-slate-900">{seasonRecap.pm > 0 ? `+${seasonRecap.pm}` : seasonRecap.pm} rating</strong> in {seasonRecap.games} games.</li>
                ) : (
                  <li className="border-l-4 border-blue-500 pl-4 py-1">🏒 You recorded <strong className="text-slate-900">{seasonRecap.g} goals</strong> and <strong className="text-slate-900">{seasonRecap.a} assists</strong> in {seasonRecap.games} games.</li>
                )}
                
                {player.pos !== 'G' && <li className="border-l-4 border-blue-500 pl-4 py-1">🔥 You contributed to roughly <strong>{seasonRecap.offPercent}%</strong> of the team's total offensive production.</li>}
                
                <li className="border-l-4 border-blue-500 pl-4 py-1">💰 Your market value has {seasonRecap.rating >= 6 ? 'increased' : 'taken a hit'}.</li>
                {seasonRecap.draftStr && (
                  <li className="border-l-4 border-emerald-500 pl-4 py-1 text-emerald-700 font-bold">🏒 You were selected in the NHL Draft {seasonRecap.draftStr} by the {seasonRecap.draftedBy}!</li>
                )}
              </ul>

              <div className="flex gap-4 mt-8 w-full">
                <button onClick={advanceToOffseason} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl text-xl shadow-md transition-colors cursor-pointer relative z-10 uppercase tracking-widest sports-font">
                  PROCEED TO OFFSEASON
                </button>
                {!isJunior && player.league === 'NHL' && player.contract.years > 0 && (
                   <button onClick={handleTradeRequest} className="bg-white border-2 border-slate-300 hover:border-red-500 text-slate-700 font-bold py-4 px-6 rounded-xl transition-all shadow-sm cursor-pointer relative z-10 flex flex-col items-center justify-center font-sans">
                     <span>REQUEST TRADE</span>
                     <span className="text-[10px] text-red-500 mt-1 uppercase tracking-widest">(-20 FAN STATUS)</span>
                   </button>
                 )}
              </div>
            </div>
          );
        })()}

        {screen === 'event' && (
          <div className="glass-card p-10 rounded-3xl mt-2 border-t-4 border-t-amber-500 text-center">
            <h2 className="text-2xl font-black text-slate-900 uppercase mb-4 sports-font">🗣 {activeEvent.title}</h2>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed max-w-2xl mx-auto font-sans">{activeEvent.desc}</p>
            
            <div className="flex flex-col gap-4 max-w-xl mx-auto font-sans">
              {activeEvent.choices.map((c, i) => (
                <button 
                  key={i} 
                  onClick={() => handleEventChoice(c)}
                  className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 p-6 rounded-xl font-bold text-lg transition-all shadow-sm hover:shadow-md cursor-pointer relative z-10 flex justify-between items-center"
                >
                  <span>{c.label}</span>
                  {c.isRisky && <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded font-black tracking-widest uppercase border border-amber-300">RISKY</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {screen === 'minigame' && (
          <div className="glass-card p-12 rounded-3xl mt-2 border-t-4 border-t-red-500 text-center relative overflow-hidden font-sans">
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/ice-pattern.png')] pointer-events-none"></div>
            
            {activeMinigame === 'breakaway' && (
              <>
                {player.pos === 'G' ? (
                  <>
                    <h2 className="text-5xl font-black mb-4 text-red-600 sports-font tracking-tighter uppercase relative z-10">🚨 FACING A BREAKAWAY 🚨</h2>
                    <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto relative z-10 leading-relaxed">An opposing forward strips the puck and comes in all alone. Make the save.</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto relative z-10">
                      <button onClick={() => handleMinigameChoice(0.3 + (player.skating+player.hockeyIQ)/400, "You read the deke and made a sprawling pad save!", "You bit hard on the fake and he tucked it in.")} className="bg-white hover:bg-slate-50 border-2 border-slate-200 py-8 px-4 rounded-2xl font-bold text-2xl text-slate-900 transition-all hover:border-blue-400 hover:shadow-md cursor-pointer flex flex-col items-center sports-font">
                        Challenge Shooter <span className="text-sm text-blue-600 font-normal mt-3 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest font-sans border border-blue-200">POS + IQ</span>
                      </button>
                      <button onClick={() => handleMinigameChoice(0.3 + player.shooting/200, "You stayed deep and swallowed up the snapshot!", "You gave him too much net and he sniped it.")} className="bg-white hover:bg-slate-50 border-2 border-slate-200 py-8 px-4 rounded-2xl font-bold text-2xl text-slate-900 transition-all hover:border-emerald-400 hover:shadow-md cursor-pointer flex flex-col items-center sports-font">
                        Hold Your Ground <span className="text-sm text-emerald-600 font-normal mt-3 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest font-sans border border-emerald-200">REF</span>
                      </button>
                      <button onClick={() => handleMinigameChoice(0.3 + (player.shooting+player.physicality)/400, "You knocked the puck right off his stick with an aggressive poke!", "You missed the poke check and he slid it past you.")} className="bg-white hover:bg-slate-50 border-2 border-slate-200 py-8 px-4 rounded-2xl font-bold text-2xl text-slate-900 transition-all hover:border-amber-400 hover:shadow-md cursor-pointer flex flex-col items-center sports-font">
                        Aggressive Poke <span className="text-sm text-amber-600 font-normal mt-3 bg-amber-50 px-3 py-1 rounded-full uppercase tracking-widest font-sans border border-amber-200">REF + AGI</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <h2 className="text-5xl font-black mb-4 text-red-600 sports-font tracking-tighter uppercase relative z-10">🚨 OVERTIME BREAKAWAY 🚨</h2>
                    <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto relative z-10 leading-relaxed">You steal the puck at the blue line. It's just you and the goalie. The game is on your stick. Make a move.</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto relative z-10">
                      <button onClick={() => handleMinigameChoice(0.3 + (player.skating+player.hockeyIQ)/400, "You used the deke and sniped it! The crowd goes wild!", "You tried the deke, but the goalie read you perfectly.")} className="bg-white hover:bg-slate-50 border-2 border-slate-200 py-8 px-4 rounded-2xl font-bold text-2xl text-slate-900 transition-all hover:border-blue-400 hover:shadow-md cursor-pointer flex flex-col items-center sports-font">
                        Deke <span className="text-sm text-blue-600 font-normal mt-3 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest font-sans border border-blue-200">SKT + IQ</span>
                      </button>
                      <button onClick={() => handleMinigameChoice(0.3 + player.shooting/200, "You picked your spot and ripped it home!", "You shot it right into his chest.")} className="bg-white hover:bg-slate-50 border-2 border-slate-200 py-8 px-4 rounded-2xl font-bold text-2xl text-slate-900 transition-all hover:border-emerald-400 hover:shadow-md cursor-pointer flex flex-col items-center sports-font">
                        Snapshot <span className="text-sm text-emerald-600 font-normal mt-3 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest font-sans border border-emerald-200">SHT</span>
                      </button>
                      <button onClick={() => handleMinigameChoice(0.3 + (player.shooting+player.physicality)/400, "You blasted it past his ear!", "You wound up but missed the net entirely.")} className="bg-white hover:bg-slate-50 border-2 border-slate-200 py-8 px-4 rounded-2xl font-bold text-2xl text-slate-900 transition-all hover:border-amber-400 hover:shadow-md cursor-pointer flex flex-col items-center sports-font">
                        Slapshot <span className="text-sm text-amber-600 font-normal mt-3 bg-amber-50 px-3 py-1 rounded-full uppercase tracking-widest font-sans border border-amber-200">SHT + PHY</span>
                      </button>
                    </div>
                  </>
                )}
              </>
            )}

            {activeMinigame === 'shootout' && (
              <>
                <h2 className="text-5xl font-black mb-4 text-red-600 sports-font tracking-tighter uppercase relative z-10">
                   {player.pos === 'G' ? '🥅 FACING A PENALTY SHOT 🥅' : '🥅 PENALTY SHOT 🥅'}
                </h2>
                <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto relative z-10 leading-relaxed">
                   {player.pos === 'G' ? "Guess where he's going to shoot to make the save. 60% chance to stop it." : "The goalie is covering two spots. Pick where to shoot. 60% chance to score."}
                </p>
                
                <div className="grid grid-cols-2 gap-4 max-w-md mx-auto relative z-10">
                  {['Top Left', 'Top Right', 'Five Hole', 'Bottom Left', 'Bottom Right'].map((target, idx) => (
                    <button key={idx} onClick={() => handleMinigameChoice(0.6, player.pos === 'G' ? `You flashed the leather on the ${target} shot!` : `You roofed it in the ${target}!`, player.pos === 'G' ? `He picked his spot and beat you ${target}.` : `The goalie flashed the leather on the ${target} shot.`)} className={`bg-white hover:bg-slate-50 border-2 border-slate-200 py-6 px-4 rounded-2xl font-bold text-xl text-slate-900 transition-all hover:border-red-400 hover:shadow-md cursor-pointer flex flex-col items-center sports-font ${target === 'Five Hole' ? 'col-span-2' : ''}`}>
                      {target}
                    </button>
                  ))}
                </div>
              </>
            )}

            {activeMinigame === 'defense' && (
              <>
                <h2 className="text-5xl font-black mb-4 text-blue-600 sports-font tracking-tighter uppercase relative z-10">
                   {player.pos === 'G' ? '🛡️ LATE GAME FLURRY 🛡️' : '🛡️ DEFENSIVE STAND 🛡️'}
                </h2>
                <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto relative z-10 leading-relaxed">
                   {player.pos === 'G' ? "Last minute of the game, one goal lead. The opponent crashes the net with a flurry of shots." : "Last minute of the game, one goal lead. The opponent has the puck in the slot."}
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto relative z-10">
                  {player.pos === 'G' ? (
                     <>
                        <button onClick={() => handleMinigameChoice(0.4 + player.physicality/200, "You smothered the rebound to kill the play!", "You gave up a juicy rebound and they capitalized.")} className="bg-white hover:bg-slate-50 border-2 border-slate-200 py-8 px-4 rounded-2xl font-bold text-2xl text-slate-900 transition-all hover:border-amber-400 hover:shadow-md cursor-pointer flex flex-col items-center sports-font">
                          Swallow Rebound <span className="text-sm text-amber-600 font-normal mt-3 bg-amber-50 px-3 py-1 rounded-full uppercase tracking-widest font-sans border border-amber-200">AGI</span>
                        </button>
                        <button onClick={() => handleMinigameChoice(0.4 + player.hockeyIQ/200, "You perfectly directed traffic and cut off the passing lane!", "You were out of position and they scored on a cross-crease pass.")} className="bg-white hover:bg-slate-50 border-2 border-slate-200 py-8 px-4 rounded-2xl font-bold text-2xl text-slate-900 transition-all hover:border-emerald-400 hover:shadow-md cursor-pointer flex flex-col items-center sports-font">
                          Direct Traffic <span className="text-sm text-emerald-600 font-normal mt-3 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest font-sans border border-emerald-200">IQ</span>
                        </button>
                        <button onClick={() => handleMinigameChoice(0.4 + (player.shooting+player.physicality)/400, "You made an unbelievable desperation save at the buzzer!", "You dove across the crease but couldn't get there in time.")} className="bg-white hover:bg-slate-50 border-2 border-slate-200 py-8 px-4 rounded-2xl font-bold text-2xl text-slate-900 transition-all hover:border-blue-400 hover:shadow-md cursor-pointer flex flex-col items-center sports-font">
                          Desperation Save <span className="text-sm text-blue-600 font-normal mt-3 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest font-sans border border-blue-200">REF + AGI</span>
                        </button>
                     </>
                  ) : (
                     <>
                        <button onClick={() => handleMinigameChoice(0.4 + player.physicality/200, "You ate the puck and saved the game!", "You tried to block it but it deflected off you and in.")} className="bg-white hover:bg-slate-50 border-2 border-slate-200 py-8 px-4 rounded-2xl font-bold text-2xl text-slate-900 transition-all hover:border-amber-400 hover:shadow-md cursor-pointer flex flex-col items-center sports-font">
                          Block Shot <span className="text-sm text-amber-600 font-normal mt-3 bg-amber-50 px-3 py-1 rounded-full uppercase tracking-widest font-sans border border-amber-200">PHY</span>
                        </button>
                        <button onClick={() => handleMinigameChoice(0.4 + player.hockeyIQ/200, "You read the play perfectly and stripped the puck!", "You lunged for the poke check and got dangled.")} className="bg-white hover:bg-slate-50 border-2 border-slate-200 py-8 px-4 rounded-2xl font-bold text-2xl text-slate-900 transition-all hover:border-emerald-400 hover:shadow-md cursor-pointer flex flex-col items-center sports-font">
                          Poke Check <span className="text-sm text-emerald-600 font-normal mt-3 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest font-sans border border-emerald-200">IQ</span>
                        </button>
                        <button onClick={() => handleMinigameChoice(0.4 + (player.skating+player.physicality)/400, "You pinned him to the boards until the clock ran out!", "He spun off your check and scored.")} className="bg-white hover:bg-slate-50 border-2 border-slate-200 py-8 px-4 rounded-2xl font-bold text-2xl text-slate-900 transition-all hover:border-blue-400 hover:shadow-md cursor-pointer flex flex-col items-center sports-font">
                          Tie Up <span className="text-sm text-blue-600 font-normal mt-3 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest font-sans border border-blue-200">SKT + PHY</span>
                        </button>
                     </>
                  )}
                </div>
              </>
            )}

            {activeMinigame === 'scrum' && (
              <>
                <h2 className="text-5xl font-black mb-4 text-amber-600 sports-font tracking-tighter uppercase relative z-10">🥊 THE SCRUM 🥊</h2>
                <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto relative z-10 leading-relaxed">A massive brawl breaks out in front of the net after the whistle.</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto relative z-10">
                  <button onClick={() => handleMinigameChoice(0.4 + player.physicality/200, "You grabbed their enforcer and held your own!", "You bit off more than you could chew and took a beating.")} className="bg-white hover:bg-slate-50 border-2 border-slate-200 py-8 px-4 rounded-2xl font-bold text-2xl text-slate-900 transition-all hover:border-amber-400 hover:shadow-md cursor-pointer flex flex-col items-center sports-font">
                    Grab the Big Guy <span className="text-sm text-amber-600 font-normal mt-3 bg-amber-50 px-3 py-1 rounded-full uppercase tracking-widest font-sans border border-amber-200">PHY</span>
                  </button>
                  <button onClick={() => handleMinigameChoice(0.4 + player.hockeyIQ/200, "You smartly pulled your star player out of the pile!", "You grabbed the wrong guy and got a penalty.")} className="bg-white hover:bg-slate-50 border-2 border-slate-200 py-8 px-4 rounded-2xl font-bold text-2xl text-slate-900 transition-all hover:border-emerald-400 hover:shadow-md cursor-pointer flex flex-col items-center sports-font">
                    Protect the Star <span className="text-sm text-emerald-600 font-normal mt-3 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest font-sans border border-emerald-200">IQ</span>
                  </button>
                  <button onClick={() => handleMinigameChoice(0.9, "You skated away safely, but the fans booed your lack of grit.", "Somehow you still got punched in the face.")} className="bg-white hover:bg-slate-50 border-2 border-slate-200 py-8 px-4 rounded-2xl font-bold text-2xl text-slate-900 transition-all hover:border-red-400 hover:shadow-md cursor-pointer flex flex-col items-center sports-font">
                    Skate Away <span className="text-sm text-red-600 font-normal mt-3 bg-red-50 px-3 py-1 rounded-full uppercase tracking-widest font-sans border border-red-200">SAFE</span>
                  </button>
                </div>
              </>
            )}

            {activeMinigame === 'odd_man_rush' && (
              <>
                <h2 className="text-5xl font-black mb-4 text-emerald-600 sports-font tracking-tighter uppercase relative z-10">🏒 ODD-MAN RUSH 🏒</h2>
                <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto relative z-10 leading-relaxed">You cross the blue line on a 2-on-1 with a teammate.</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto relative z-10">
                  <button onClick={() => handleMinigameChoice(0.4 + player.hockeyIQ/200, "You feathered a perfect pass across for the tap-in!", "The defenseman read the pass and picked it off.")} className="bg-white hover:bg-slate-50 border-2 border-slate-200 py-8 px-4 rounded-2xl font-bold text-2xl text-slate-900 transition-all hover:border-emerald-400 hover:shadow-md cursor-pointer flex flex-col items-center sports-font">
                    Pass Across <span className="text-sm text-emerald-600 font-normal mt-3 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest font-sans border border-emerald-200">IQ</span>
                  </button>
                  <button onClick={() => handleMinigameChoice(0.4 + player.shooting/200, "You looked off the defender and ripped it far side!", "The goalie swallowed up the shot easily.")} className="bg-white hover:bg-slate-50 border-2 border-slate-200 py-8 px-4 rounded-2xl font-bold text-2xl text-slate-900 transition-all hover:border-amber-400 hover:shadow-md cursor-pointer flex flex-col items-center sports-font">
                    Shoot Far Pad <span className="text-sm text-amber-600 font-normal mt-3 bg-amber-50 px-3 py-1 rounded-full uppercase tracking-widest font-sans border border-amber-200">SHT</span>
                  </button>
                  <button onClick={() => handleMinigameChoice(0.4 + (player.skating+player.shooting)/400, "You froze the goalie with a fake and tucked it in!", "You lost control of the puck trying to get fancy.")} className="bg-white hover:bg-slate-50 border-2 border-slate-200 py-8 px-4 rounded-2xl font-bold text-2xl text-slate-900 transition-all hover:border-blue-400 hover:shadow-md cursor-pointer flex flex-col items-center sports-font">
                    Fake & Shoot <span className="text-sm text-blue-600 font-normal mt-3 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest font-sans border border-blue-200">SKT + SHT</span>
                  </button>
                </div>
              </>
            )}

            {activeMinigame === 'screened_shot' && (
              <>
                <h2 className="text-5xl font-black mb-4 text-emerald-600 sports-font tracking-tighter uppercase relative z-10">🏒 SCREENED SHOT 🏒</h2>
                <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto relative z-10 leading-relaxed">A massive forward is parked in front of you. The point man winds up for a slapshot.</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto relative z-10">
                  <button onClick={() => handleMinigameChoice(0.4 + player.physicality/200, "You violently shoved the screen aside and tracked the puck!", "You lost your balance fighting the screen and gave up a goal.")} className="bg-white hover:bg-slate-50 border-2 border-slate-200 py-8 px-4 rounded-2xl font-bold text-2xl text-slate-900 transition-all hover:border-amber-400 hover:shadow-md cursor-pointer flex flex-col items-center sports-font">
                    Fight the Screen <span className="text-sm text-amber-600 font-normal mt-3 bg-amber-50 px-3 py-1 rounded-full uppercase tracking-widest font-sans border border-amber-200">AGI</span>
                  </button>
                  <button onClick={() => handleMinigameChoice(0.4 + player.hockeyIQ/200, "You anticipated the trajectory perfectly and made a blind save!", "You guessed wrong and the puck sailed past you.")} className="bg-white hover:bg-slate-50 border-2 border-slate-200 py-8 px-4 rounded-2xl font-bold text-2xl text-slate-900 transition-all hover:border-emerald-400 hover:shadow-md cursor-pointer flex flex-col items-center sports-font">
                    Guess Trajectory <span className="text-sm text-emerald-600 font-normal mt-3 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest font-sans border border-emerald-200">IQ</span>
                  </button>
                  <button onClick={() => handleMinigameChoice(0.4 + (player.skating+player.shooting)/400, "You dropped low, stretched out, and kicked out the pad to rob him!", "The puck found a hole under your arm.")} className="bg-white hover:bg-slate-50 border-2 border-slate-200 py-8 px-4 rounded-2xl font-bold text-2xl text-slate-900 transition-all hover:border-blue-400 hover:shadow-md cursor-pointer flex flex-col items-center sports-font">
                    Drop and Stretch <span className="text-sm text-blue-600 font-normal mt-3 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest font-sans border border-blue-200">POS + REF</span>
                  </button>
                </div>
              </>
            )}

            {activeMinigame === 'five_on_three' && (
              <>
                <h2 className="text-5xl font-black mb-4 text-blue-600 sports-font tracking-tighter uppercase relative z-10">🛡️ 5-ON-3 PK 🛡️</h2>
                <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto relative z-10 leading-relaxed">Your team is down two men. The opposing powerplay is cycling the puck relentlessly.</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto relative z-10">
                  <button onClick={() => handleMinigameChoice(0.4 + player.skating/200, "You aggressively challenged the shooter and took away the angle!", "You came out too far and they passed around you for a tap-in.")} className="bg-white hover:bg-slate-50 border-2 border-slate-200 py-8 px-4 rounded-2xl font-bold text-2xl text-slate-900 transition-all hover:border-amber-400 hover:shadow-md cursor-pointer flex flex-col items-center sports-font">
                    Aggressive Challenge <span className="text-sm text-amber-600 font-normal mt-3 bg-amber-50 px-3 py-1 rounded-full uppercase tracking-widest font-sans border border-amber-200">POS</span>
                  </button>
                  <button onClick={() => handleMinigameChoice(0.4 + player.shooting/200, "You stayed deep in your crease and relied on your pure reflexes to make the save!", "You stayed deep and they sniped you through traffic.")} className="bg-white hover:bg-slate-50 border-2 border-slate-200 py-8 px-4 rounded-2xl font-bold text-2xl text-slate-900 transition-all hover:border-emerald-400 hover:shadow-md cursor-pointer flex flex-col items-center sports-font">
                    Stay Deep <span className="text-sm text-emerald-600 font-normal mt-3 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest font-sans border border-emerald-200">REF</span>
                  </button>
                  <button onClick={() => handleMinigameChoice(0.4 + (player.skating+player.physicality)/400, "You lunged across the crease in desperation and made a miraculous save!", "You couldn't move laterally fast enough.")} className="bg-white hover:bg-slate-50 border-2 border-slate-200 py-8 px-4 rounded-2xl font-bold text-2xl text-slate-900 transition-all hover:border-blue-400 hover:shadow-md cursor-pointer flex flex-col items-center sports-font">
                    Lateral Lunge <span className="text-sm text-blue-600 font-normal mt-3 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest font-sans border border-blue-200">POS + AGI</span>
                  </button>
                </div>
              </>
            )}

          </div>
        )}

        {screen === 'event-result' && (
          <div className="glass-card p-10 rounded-3xl mt-2 text-center border-t-4 border-t-emerald-500 font-sans">
            <h2 className="text-2xl font-black text-slate-900 uppercase mb-6 sports-font">THE AFTERMATH</h2>
            <p className="text-xl italic text-slate-700 mb-8 leading-relaxed max-w-2xl mx-auto">"{eventFeedback}"</p>
            
            <div className="flex justify-center gap-4 mb-10">
              {eventImpacts.idol !== undefined && eventImpacts.idol !== 0 && (
                <div className={`p-4 rounded-xl border ${eventImpacts.idol > 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                  <p className="text-xs font-bold uppercase tracking-widest mb-1">FAN STATUS</p>
                  <p className="text-2xl font-black sports-font">{eventImpacts.idol > 0 ? '+' : ''}{eventImpacts.idol}</p>
                </div>
              )}
              {eventImpacts.ovr !== undefined && eventImpacts.ovr !== 0 && (
                <div className={`p-4 rounded-xl border ${eventImpacts.ovr > 0 ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                  <p className="text-xs font-bold uppercase tracking-widest mb-1">OVR IMPACT</p>
                  <p className="text-2xl font-black sports-font">{eventImpacts.ovr > 0 ? '+' : ''}{eventImpacts.ovr}</p>
                </div>
              )}
              {eventImpacts.money !== undefined && eventImpacts.money !== 0 && (
                <div className="bg-amber-50 border border-amber-200 text-amber-700 p-4 rounded-xl">
                  <p className="text-xs font-bold uppercase tracking-widest mb-1">EARNINGS</p>
                  <p className="text-2xl font-black sports-font">+{formatMoney(eventImpacts.money)}</p>
                </div>
              )}
            </div>

            <button onClick={handleContinueEvent} className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg font-black py-4 px-12 rounded-xl text-xl transition-transform hover:-translate-y-1 cursor-pointer relative z-10 sports-font tracking-widest uppercase">Continue</button>
          </div>
        )}

        {screen === 'playoffs' && (
          <div className="glass-card p-10 rounded-3xl mt-2 border-t-4 border-t-amber-400 bg-slate-900 text-white text-center font-sans">
            <h2 className="text-4xl font-black tracking-widest mb-2 text-amber-500 sports-font">🏆 PLAYOFFS 🏆</h2>
            <p className="text-slate-400 mb-8 text-sm uppercase tracking-widest font-bold">Find 4 Wins. Avoid 4 Eliminations.</p>
            
            <h3 className="text-2xl font-bold mb-8 bg-slate-800 px-6 py-3 rounded-full border border-slate-700 inline-block sports-font tracking-wide">
              WINS FOUND: <span className="text-emerald-400">{playoffs.wins}</span> / 4
            </h3>

            <div className="grid grid-cols-4 gap-3 mb-10 max-w-2xl mx-auto">
              {playoffs.deck.map((item, index) => {
                const isRevealed = playoffs.revealed.includes(index);
                const showForcefully = playoffs.status !== 'playing' && !isRevealed;
                const isLoss = item.score.endsWith('4'); 
                
                let btnClass = "h-20 sm:h-24 text-lg sm:text-xl font-black rounded-xl border-2 transition-all duration-300 flex flex-col items-center justify-center cursor-pointer relative z-10 sports-font ";
                
                if (isRevealed || showForcefully) {
                  if (isLoss) btnClass += "bg-red-500 border-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]"; 
                  else btnClass += "bg-emerald-500 border-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]"; 
                } else {
                  btnClass += "bg-slate-800 border-slate-700 text-slate-500 hover:bg-slate-700 hover:border-slate-500 hover:text-white shadow-inner";
                }

                if (showForcefully) btnClass += " opacity-50";

                return (
                  <button key={index} onClick={() => handleGridClick(index)} className={btnClass} disabled={playoffs.status !== 'playing' || isRevealed}>
                    {(isRevealed || showForcefully) ? (
                      <>
                        <span className="text-[10px] font-bold tracking-widest uppercase mb-1 font-sans text-slate-100">{item.opp}</span>
                        <span>{item.score}</span>
                      </>
                    ) : '?'}
                  </button>
                );
              })}
            </div>

            {playoffs.status === 'won' && (
              <div className="animate-bounce mt-4">
                <h2 className="text-3xl font-black mb-6 sports-font">🎉 YOU WON THE CUP! 🎉</h2>
                <button onClick={proceedFromPlayoffs} className="bg-slate-200 hover:bg-white text-black font-black py-3 px-10 rounded-full shadow-xl cursor-pointer relative z-10 sports-font tracking-widest uppercase">
                  {isJunior ? 'Advance to Memorial Cup' : 'Continue to Recap'}
                </button>
              </div>
            )}
            {playoffs.status === 'lost' && (
              <div className="mt-4">
                <h2 className="text-3xl font-black text-slate-400 mb-6 sports-font">💀 ELIMINATED. 💀</h2>
                <button onClick={handleEndPlayoffs} className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 font-bold py-3 px-10 rounded-full cursor-pointer relative z-10 sports-font tracking-widest uppercase">Continue to Recap</button>
              </div>
            )}
          </div>
        )}

        {screen === 'memorial-cup' && (
          <div className="glass-card p-12 rounded-3xl mt-2 border-t-4 border-t-amber-400 bg-white text-center font-sans shadow-2xl relative overflow-hidden">
             <h2 className="text-5xl font-black mb-4 text-amber-500 sports-font tracking-tighter uppercase relative z-10 text-center">THE MEMORIAL CUP</h2>
             <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto relative z-10 leading-relaxed text-center">The ultimate prize in Junior Hockey. Win two games to cement your legacy.</p>

             {memCup.status === 'playing' && (
               <div className="relative z-10 flex flex-col items-center">
                 <h3 className="text-3xl font-bold mb-8 sports-font text-slate-900 text-center">{memCup.round === 0 ? 'SEMI-FINAL MATCHUP' : 'CHAMPIONSHIP FINAL'}</h3>
                 <button onClick={() => { setMinigameContext('memcup'); triggerMinigame(); }} className="bg-emerald-600 hover:bg-emerald-500 py-4 px-10 rounded-xl font-black text-xl text-white transition-all hover:scale-105 cursor-pointer shadow-lg sports-font uppercase tracking-widest">
                    PLAY MATCH
                 </button>
               </div>
             )}

             {memCup.status === 'won' && (
               <div className="relative z-10">
                  <h2 className="text-4xl font-black text-amber-500 mb-6 sports-font">🏆 MEMORIAL CUP CHAMPIONS! 🏆</h2>
                  <p className="text-slate-600 mb-8 font-bold">Your draft stock has skyrocketed.</p>
                  <button onClick={handleEndMemCup} className="bg-slate-900 hover:bg-slate-800 text-white font-black py-3 px-10 rounded-full shadow-xl cursor-pointer sports-font tracking-widest uppercase">Continue to Recap</button>
               </div>
             )}

             {memCup.status === 'lost' && (
               <div className="relative z-10 mt-4">
                  <h2 className="text-3xl font-black text-slate-400 mb-6 sports-font">💀 ELIMINATED. 💀</h2>
                  <p className="text-slate-500 mb-8 font-bold">Your season ends in heartbreak.</p>
                  <button onClick={handleEndMemCup} className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-10 rounded-full cursor-pointer sports-font tracking-widest uppercase">Continue to Recap</button>
               </div>
             )}
          </div>
        )}

        {screen === 'transfer' && (
          <div className="glass-card p-10 rounded-3xl mt-2 border-t-4 border-t-purple-500 font-sans">
            <h2 className="text-4xl font-black italic text-slate-900 uppercase mb-4 text-center sports-font tracking-tighter">FREE AGENCY</h2>
            <p className="text-slate-500 text-lg mb-10 font-medium text-center">The market speaks. Glory or money?</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {freeAgencyOffers.map((o, i) => (
                <div key={i} className={`bg-white border-2 p-6 rounded-2xl relative flex flex-col shadow-sm hover:shadow-lg transition-all ${o.type.includes('EXTENSION') ? 'border-emerald-400 bg-emerald-50/30' : 'border-slate-200'}`}>
                  {o.type.includes('EXTENSION') && <span className="absolute top-4 right-4 bg-emerald-100 text-emerald-700 border border-emerald-300 text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest font-sans">{o.type}</span>}
                  
                  <div className="flex items-center gap-3 mb-6 mt-2">
                    <TeamLogo teamId={o.team} />
                    <h3 className="text-2xl font-black text-slate-900 sports-font">{o.team}</h3>
                  </div>

                  <p className="text-3xl font-black text-emerald-600 mb-1 sports-font">{formatMoney(o.salary)}<span className="text-sm text-slate-500 font-normal font-sans"> /yr</span></p>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-6">{o.years}-year contract</p>

                  <div className="bg-slate-50 p-4 rounded-xl mb-6 flex-1 border border-slate-200">
                    {o.idolHit < 0 && <p className="text-xs text-red-500 font-bold mb-2">Leaving {player.team}: {o.idolHit} fan status.</p>}
                    {o.idolHit === 10 && <p className="text-xs text-emerald-600 font-bold mb-2">Staying home: +10 fan status.</p>}
                    <p className="text-xs text-slate-700 font-bold">🏒 You will play <span className="text-blue-600">MORE</span> than before.</p>
                  </div>

                  <button onClick={() => signContract(o)} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-lg shadow-md transition-colors cursor-pointer relative z-10 font-sans tracking-wide">
                    SIGN DEAL
                  </button>
                </div>
              ))}
            </div>

            {player.agentRerolls > 0 && (
              <button 
                onClick={() => { setPlayer(p => ({...p, agentRerolls: 0})); generateOffers(); }} 
                className="mt-8 w-full bg-white border-2 border-slate-300 hover:border-blue-500 text-slate-700 font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-3 shadow-sm hover:shadow-md cursor-pointer relative z-10 font-sans"
              >
                📞 CALL AGENT FOR NEW OFFERS (1 PER CAREER)
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default App;