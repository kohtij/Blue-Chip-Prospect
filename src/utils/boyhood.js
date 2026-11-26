// THE TEAM HE GREW UP CHEERING FOR.
//
// Asked once, in his first season, by an event: three clubs a kid from where
// he's from would most likely have had on his wall, and he picks one. It's
// kept on the player (boyhoodTeam) and isn't shown anywhere. It matters in
// free agency, where it's one of the two clubs that can offer him a hometown
// discount (the other is the club that drafted him).
//
// The game doesn't know his home town, only his nationality and the league he
// started in, so the shortlists are drawn from those. A Canadian kid in the
// OHL grew up on Ontario and Quebec clubs, one in the WHL on the western ones.
// An American's is regional too. A European's is the clubs his country's
// stars made famous at home.

const BY_LEAGUE = {
  OHL: ['TOR', 'OTT', 'MTL', 'DET', 'BUF'],
  QMJHL: ['MTL', 'BOS', 'OTT', 'TOR'],
  WHL: ['EDM', 'CGY', 'VAN', 'WPG', 'SEA'],
  BCHL: ['VAN', 'SEA', 'EDM', 'CGY'],
  USHL: ['CHI', 'MIN', 'STL', 'DET', 'COL', 'DAL'],
  NTDP: ['DET', 'CHI', 'BOS', 'PIT', 'NYR'],
  NCAA: ['BOS', 'NYR', 'MIN', 'CHI', 'PHI']
};

const BY_NATION = {
  CAN: ['TOR', 'MTL', 'EDM', 'VAN', 'CGY', 'OTT', 'WPG'],
  USA: ['BOS', 'CHI', 'DET', 'NYR', 'PIT', 'MIN', 'PHI', 'STL', 'COL', 'DAL', 'LAK'],
  SWE: ['DET', 'VAN', 'NYR', 'TOR', 'COL', 'OTT'],
  FIN: ['ANA', 'DAL', 'NSH', 'COL', 'WPG', 'FLA'],
  RUS: ['WSH', 'PIT', 'TBL', 'NYR', 'DET'],
  CZE: ['PIT', 'BOS', 'BUF', 'NJD'],
  SVK: ['BOS', 'CHI', 'MTL', 'NJD'],
  SUI: ['NJD', 'NSH', 'SJS'],
  GER: ['EDM', 'DET', 'SJS'],
  DEN: ['WPG', 'TOR', 'NSH'],
  NOR: ['NYR', 'MIN', 'LAK'],
  LAT: ['NYR', 'CHI', 'BOS'],
  AUT: ['MIN', 'EDM', 'NYI']
};

// The clubs every hockey kid anywhere might have had.
const ANYWHERE = ['MTL', 'TOR', 'DET', 'BOS', 'CHI', 'PIT', 'NYR', 'EDM'];

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/**
 * Three clubs to choose from. A North American's start with his region's,
 * filled from his country's; everyone else's from his country's stars, then
 * the clubs everybody knows.
 */
export function boyhoodShortlist(player) {
  const nat = player?.nat;
  const northAmerican = nat === 'CAN' || nat === 'USA';
  const where = player?.team === 'NTDP' ? 'NTDP' : (player?.startLeague || player?.league);
  const regional = northAmerican ? (BY_LEAGUE[where] || BY_LEAGUE[player?.league] || []) : [];
  const out = [];
  for (const id of [...shuffle(regional), ...shuffle(BY_NATION[nat] || []), ...shuffle(ANYWHERE)]) {
    if (!out.includes(id)) out.push(id);
    if (out.length === 3) break;
  }
  return out;
}

// WHAT HE REMEMBERS OF THEM.
//
// The line under each club in the question. It was one of three generic
// lines handed out in order, so the Leafs and the Red Wings got the same
// couch and the same poster. Each club has its own now, from what a kid who
// grew up on them would actually remember, and a European kid's line is
// about his own country's players there, which is why he'd have followed a
// club four thousand miles away.
const BY_CLUB = {
  TOR: 'Hockey Night in Canada every Saturday, and a house that took every Leafs loss personally.',
  MTL: 'Twenty-four Stanley Cups on the banners, and a grandfather who could name every one of them.',
  OTT: 'Red sweaters at the Canadian Tire Centre, and a city that still talks about the 2007 final.',
  DET: 'Hockeytown, an octopus on the ice every spring, and a dad who swore by the Red Wings of the nineties.',
  BUF: 'The blue and gold, a Buffalo winter, and a Sabres jersey handed down from a cousin.',
  BOS: 'The Garden, and a family that thought Bobby Orr flying through the air was the best goal ever scored.',
  EDM: 'Oilers games with the whole family, and a jersey with 97 on the back.',
  CGY: 'The C of Red, and the Red Mile filling up every time the Flames went on a run.',
  VAN: 'Canucks games on every TV in the house, and a wall covered in the Sedin twins.',
  WPG: 'The Winnipeg Whiteout, the whole city dressed in white for every playoff game.',
  SEA: 'The Kraken arriving when you were a kid, the first NHL team your city ever had.',
  CHI: 'The Blackhawks winning three Cups in six years while you were learning to skate.',
  MIN: 'The State of Hockey, outdoor rinks all winter, and the Wild on TV once you came inside.',
  STL: "The Blues finally winning the Cup in 2019, and the whole city singing 'Gloria'.",
  COL: 'Mile High hockey, and the Avalanche bringing the Cup through Denver in 2022.',
  DAL: 'Hockey in Texas, the Stars on TV, and a rink next to a shopping mall where you learned to skate.',
  PIT: 'Sidney Crosby and Evgeni Malkin lifting the Cup two years running.',
  NYR: "Rangers games at Madison Square Garden, and a jersey with Lundqvist's 30 on it.",
  PHI: 'The Flyers, Gritty, and a family that still argues about the Broad Street Bullies.',
  LAK: 'The Kings winning two Cups in three years, and street hockey in the driveway in the sun.',
  ANA: 'The Ducks, and the 2007 Cup banner your parents watched go up.',
  NSH: 'The Smashville crowd, the loudest building in the league, and a catfish on the ice.',
  FLA: 'The Panthers winning the Cup two years running, and plastic rats raining down on the ice.',
  WSH: "Alex Ovechkin scoring every night on his way past Gretzky's record.",
  TBL: 'The Lightning winning back-to-back Cups in 2020 and 2021.',
  NJD: 'The Devils, and the red and black jersey you wore to every game you could get to.',
  SJS: 'The Sharks skating out of the giant shark head before every home game.',
  NYI: 'The Islanders, and four straight Cups your family told you about at every dinner.'
};

const BY_NATION_CLUB = {
  SWE: {
    DET: 'Nicklas Lidström and Henrik Zetterberg, watched at two in the morning on Swedish TV.',
    VAN: 'The Sedin twins, and staying up through the night to watch them.',
    NYR: 'Henrik Lundqvist in the Rangers net, and every save of his on the morning news.',
    TOR: "Your dad's old Mats Sundin jersey, and the Leafs games he watched in the middle of the night.",
    COL: "Peter Forsberg's old Avalanche jersey, which you wore until it fell apart.",
    OTT: 'Daniel Alfredsson and then Erik Karlsson, the Swedes who ran the Senators.'
  },
  FIN: {
    ANA: "Teemu Selänne's old Ducks highlights, the Finnish Flash your dad grew up on.",
    DAL: 'Miro Heiskanen and Roope Hintz, the Finns at the heart of the Stars.',
    NSH: 'Pekka Rinne in the Predators net, year after year.',
    WPG: "Teemu Selänne's 76 goals for the old Jets, a story every Finnish kid hears.",
    FLA: 'Aleksander Barkov captaining the Panthers to the Cup.'
  },
  RUS: {
    WSH: "Alex Ovechkin, and every goal of his on the news the next morning.",
    PIT: 'Evgeni Malkin, and the Cups he won in Pittsburgh.',
    TBL: 'Nikita Kucherov and Andrei Vasilevskiy winning the Cup twice in Tampa.',
    NYR: 'Artemi Panarin and Igor Shesterkin at Madison Square Garden.',
    DET: 'The Russian Five, the old Red Wings your father still talks about.'
  },
  CZE: {
    PIT: "Jaromír Jágr's old Penguins jersey, and the mullet in every photo.",
    BOS: 'David Pastrňák scoring for the Bruins every other night.',
    BUF: "Dominik Hašek, the Dominator, in your uncle's old Sabres tapes.",
    NJD: "Patrik Eliáš, the Czech who scored more goals than anyone in the Devils' history."
  },
  SVK: {
    BOS: 'Zdeno Chára, the tallest man in the league, lifting the Cup as Bruins captain.',
    CHI: 'Marián Hossa and his three Cups with the Blackhawks.',
    MTL: 'Juraj Slafkovský going first overall to the Canadiens.',
    NJD: 'Šimon Nemec, the Slovak kid on the Devils blue line.'
  },
  SUI: {
    NJD: 'Nico Hischier captaining the Devils, the first Swiss player taken first overall.',
    NSH: 'Roman Josi wearing the C for the Predators.',
    SJS: 'Timo Meier scoring for the Sharks.'
  },
  GER: {
    EDM: 'Leon Draisaitl in Edmonton, the best German player there has ever been.',
    DET: 'Moritz Seider on the Red Wings blue line.',
    SJS: 'Marco Sturm and the Sharks, the first German star your coach ever told you about.'
  },
  DEN: {
    WPG: 'Nikolaj Ehlers flying down the wing for the Jets.',
    TOR: 'Frederik Andersen in the Leafs net, the Dane every kid at your rink wanted to be.'
  },
  NOR: {
    NYR: 'Mats Zuccarello setting up goals at Madison Square Garden.',
    MIN: 'Mats Zuccarello in Minnesota, the best Norwegian in the league.'
  },
  AUT: {
    MIN: 'Thomas Vanek and then Marco Rossi, the Austrians in Minnesota.'
  }
};

/** The line under a club in the question. */
export const boyhoodLine = (teamId, nat) =>
  BY_NATION_CLUB[nat]?.[teamId] || BY_CLUB[teamId] || 'The club on your wall, and on the TV every night they played.';
