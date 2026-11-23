// WHO RUNS THE BENCH, AND WHERE HE'S FROM.
//
// Every coach and general manager used to come out of one list of North
// American names, so a Liiga club in Oulu was coached by "Darryl Mulcahy" and
// the KHL was full of Gerards and Todds. A club hires mostly from its own
// country, and the leagues that import coaches (Germany, Austria, Switzerland)
// import them from Canada first. Names are made up, first name and surname
// from the same country, so nobody's bench gets a real coach by accident.

const POOLS = {
  CAN: {
    first: ['Mike', 'Dave', 'Rick', 'Craig', 'Paul', 'Gerard', 'Bruce', 'Dean', 'Glen', 'Barry', 'Kevin', 'Todd', 'Randy', 'Marc', 'Darryl', 'Wayne', 'Guy', 'Gord', 'Doug', 'Brent', 'Shawn', 'Trent', 'Denis', 'Rejean'],
    last: ['Halloran', 'Desrosiers', 'Kowalchuk', 'Pellerin', 'Brannigan', 'Ostrander', 'Lavigne', 'McTavish', 'Danforth', 'Gendron', 'Rowntree', 'Beaudette', 'Lachance', 'Harwood', 'Kerrigan', 'Mulcahy', 'Fairbairn', 'Kilbride', 'Cormier', 'Delorme', 'Haldane', 'Kinsella', 'Pellow', 'Rourke', 'Tallis', 'Whitmore', 'Brannock', 'Dumoulin']
  },
  USA: {
    first: ['Jim', 'Steve', 'Tom', 'Jeff', 'Brian', 'Kyle', 'Brad', 'Ed', 'Rob', 'Chuck', 'Frank', 'Matt', 'Joe', 'Pat', 'Tim', 'Bill', 'Scott', 'Dan'],
    last: ['Corrigan', 'Pruitt', 'Holtzman', 'Wexler', 'Danforth', 'Armitage', 'Caldwell', 'Hartigan', 'Mackey', 'Ashby', 'Gillick', 'Wexford', 'Sullivan', 'Brightman', 'Callahan', 'Dorsey', 'Kendrick', 'Mahler']
  },
  SWE: {
    first: ['Lars', 'Mats', 'Anders', 'Peter', 'Magnus', 'Johan', 'Stefan', 'Mikael', 'Roger', 'Leif', 'Thomas', 'Bengt', 'Fredrik', 'Ulf', 'Håkan', 'Göran'],
    last: ['Nordqvist', 'Lundgren', 'Stenlund', 'Ahlqvist', 'Bergsten', 'Ekdahl', 'Hagström', 'Järnberg', 'Lindvall', 'Malmqvist', 'Nyberg', 'Ståhlberg', 'Sundell', 'Tegnér', 'Wikström', 'Öhrlund']
  },
  FIN: {
    first: ['Jukka', 'Kari', 'Pekka', 'Matti', 'Hannu', 'Jarmo', 'Markku', 'Petri', 'Raimo', 'Tapio', 'Risto', 'Sami', 'Ville', 'Ari', 'Jussi', 'Harri'],
    last: ['Halonen', 'Kauppila', 'Lahtinen', 'Mäkelä', 'Nurmela', 'Ojanperä', 'Peltola', 'Rantanen', 'Saarela', 'Toivanen', 'Uotila', 'Vuorinen', 'Heikkilä', 'Kivelä', 'Laaksonen', 'Seppälä']
  },
  RUS: {
    first: ['Sergei', 'Igor', 'Oleg', 'Vladimir', 'Andrei', 'Dmitri', 'Yuri', 'Alexei', 'Viktor', 'Mikhail', 'Valeri', 'Gennadi', 'Boris', 'Anatoli'],
    last: ['Belyakov', 'Chernykh', 'Fedotov', 'Gorshkov', 'Kalinin', 'Lebedev', 'Morozov', 'Nesterov', 'Prokhorov', 'Ryabov', 'Shatalov', 'Tikhonin', 'Usachev', 'Zaitsev']
  },
  BLR: {
    first: ['Alexander', 'Sergei', 'Dmitri', 'Andrei', 'Vadim'],
    last: ['Hlinsky', 'Kovalenko', 'Lapotko', 'Starikevich', 'Zhuk']
  },
  CZE: {
    first: ['Jiří', 'Josef', 'Pavel', 'Vladimír', 'Miroslav', 'Jaroslav', 'Petr', 'Zdeněk', 'Karel', 'Milan', 'Radim', 'Aleš'],
    last: ['Bednář', 'Dvořáček', 'Horák', 'Kolář', 'Kratochvíl', 'Malý', 'Navrátil', 'Pospíšil', 'Šebek', 'Tichý', 'Vlček', 'Zeman']
  },
  SVK: {
    first: ['Ján', 'Jozef', 'Miroslav', 'Róbert', 'Ľubomír', 'Peter', 'Vladimír', 'Igor', 'Dušan'],
    last: ['Baláž', 'Dobrovodský', 'Hanula', 'Kováčik', 'Lipták', 'Mráz', 'Oravec', 'Sedlák', 'Turček', 'Žiak']
  },
  GER: {
    first: ['Thomas', 'Uwe', 'Jürgen', 'Stefan', 'Andreas', 'Michael', 'Klaus', 'Frank', 'Ralf', 'Dirk', 'Jochen', 'Markus'],
    last: ['Brenner', 'Dietrich', 'Falkner', 'Gerlach', 'Hartwig', 'Kessler', 'Lindemann', 'Maurer', 'Oberländer', 'Pfeiffer', 'Rademacher', 'Schuster', 'Vogler', 'Wendt']
  },
  AUT: {
    first: ['Christian', 'Manfred', 'Gerhard', 'Herbert', 'Roland', 'Wolfgang', 'Dieter', 'Reinhard'],
    last: ['Aigner', 'Gruber', 'Hofstätter', 'Kogler', 'Lackner', 'Pichler', 'Steinbauer', 'Wallner']
  },
  SUI: {
    first: ['Reto', 'Urs', 'Beat', 'Christian', 'Marco', 'Patrick', 'Daniel', 'Luca', 'Jean-Marc', 'Didier'],
    last: ['Ammann', 'Bühler', 'Christen', 'Fehr', 'Gerber', 'Lüthi', 'Probst', 'Rüegg', 'Steiner', 'Zurbriggen', 'Bonvin', 'Rochat']
  },
  DEN: {
    first: ['Jesper', 'Henrik', 'Søren', 'Mads', 'Jens', 'Lars', 'Morten', 'Kim', 'Bo', 'Niels', 'Rasmus', 'Torben'],
    last: ['Kjærgaard', 'Holmgaard', 'Damgaard', 'Bækgaard', 'Lindholt', 'Østergaard', 'Brøndum', 'Skovsted', 'Nørgaard', 'Hvidberg', 'Mølholm', 'Kragelund']
  },
  NOR: {
    first: ['Petter', 'Ole', 'Tore', 'Espen', 'Knut', 'Geir', 'Stian', 'Trond', 'Bjørn', 'Rune', 'Håvard', 'Eirik'],
    last: ['Haugland', 'Bråten', 'Myrvold', 'Solheim', 'Fjeldstad', 'Lysgaard', 'Strømsnes', 'Aasland', 'Vikhammer', 'Grøndahl', 'Ekornes', 'Tveit']
  },
  FRA: {
    first: ['Philippe', 'Laurent', 'Stéphane', 'Pierre', 'Julien', 'Olivier', 'Yann', 'Sébastien', 'Benoît', 'Fabrice'],
    last: ['Bertrand', 'Chauvel', 'Delattre', 'Fournel', 'Garnier', 'Lemaître', 'Marchal', 'Perrin', 'Rousseau', 'Vasseur', 'Boisset', 'Ternier']
  },
  GBR: {
    first: ['Gary', 'Neil', 'Ian', 'Stuart', 'Colin', 'Graham', 'Martin', 'Andy', 'Steve', 'Paul'],
    last: ['Ashworth', 'Brindley', 'Catterall', 'Fenwick', 'Hepburn', 'Lockwood', 'Moffat', 'Pennington', 'Rawcliffe', 'Strachan', 'Thwaite', 'Whitlock']
  },
  ITA: {
    first: ['Marco', 'Luca', 'Stefano', 'Andrea', 'Paolo', 'Giorgio', 'Matteo', 'Fabio', 'Roberto', 'Davide'],
    last: ['Bernardi', 'Casagrande', 'Dalmonte', 'Fontana', 'Gasser', 'Lazzaro', 'Moroder', 'Pichler', 'Rinaldi', 'Senoner', 'Tessaro', 'Zanon']
  },
  SVN: {
    first: ['Matjaž', 'Tomaž', 'Gregor', 'Boštjan', 'Rok', 'Uroš', 'Jure', 'Aleš', 'Marko', 'Primož'],
    last: ['Kranjc', 'Novak', 'Zupančič', 'Hribar', 'Kos', 'Vidmar', 'Golob', 'Rozman', 'Kavčič', 'Jerman']
  },
  AUS: {
    first: ['Brett', 'Shane', 'Darren', 'Glenn', 'Wade', 'Craig', 'Luke', 'Troy', 'Nathan', 'Jason'],
    last: ['Ashcroft', 'Bramwell', 'Cullinan', 'Dempster', 'Fitzroy', 'Harrold', 'McAllister', 'Penrose', 'Tilbury', 'Wakefield']
  }
};

// Where a league's benches are filled from, as weights. Read as "most clubs
// hire at home, a few look abroad", with the real imports where they happen.
const HIRES = {
  NA:     { CAN: 72, USA: 22, SWE: 3, FIN: 3 },
  NCAA:   { USA: 80, CAN: 20 },
  USHL:   { USA: 75, CAN: 25 },
  SHL:    { SWE: 85, FIN: 8, CAN: 7 },
  J20:    { SWE: 95, FIN: 5 },
  LIIGA:  { FIN: 92, SWE: 4, CAN: 4 },
  U20:    { FIN: 100 },
  KHL:    { RUS: 78, BLR: 6, FIN: 8, CAN: 8 },
  CZECH:  { CZE: 92, SVK: 6, FIN: 2 },
  SLOVAK: { SVK: 70, CZE: 20, CAN: 6, FIN: 4 },
  SWISS:  { SUI: 40, CAN: 30, SWE: 12, FIN: 10, USA: 8 },
  DEL:    { GER: 35, CAN: 40, USA: 15, FIN: 5, SWE: 5 },
  ICEHL:  { AUT: 35, CAN: 35, USA: 10, FIN: 10, GER: 10 },
  ALLSV:  { SWE: 92, FIN: 4, CAN: 4 },
  ETTAN:  { SWE: 100 },
  J18:    { SWE: 100 },
  MESTIS: { FIN: 96, SWE: 4 },
  SUOMI:  { FIN: 100 },
  U20M:   { FIN: 100 },
  U18:    { FIN: 100 },
  U18M:   { FIN: 100 },
  METAL:  { DEN: 60, SWE: 20, CAN: 12, FIN: 8 },
  DEN1:   { DEN: 90, SWE: 10 },
  DENU20: { DEN: 100 },
  DENU18: { DEN: 100 },
  EHL:    { NOR: 65, SWE: 25, FIN: 10 },
  NOR1:   { NOR: 90, SWE: 10 },
  NORU20: { NOR: 100 },
  NORU18: { NOR: 100 },
  SL:     { SUI: 70, CAN: 15, FIN: 10, SWE: 5 },
  DEL2:   { GER: 50, CAN: 35, USA: 10, FIN: 5 },
  ALPS:   { AUT: 35, ITA: 35, SVN: 15, CAN: 15 },
  MAGNUS: { FRA: 60, CAN: 25, FIN: 10, SWE: 5 },
  EIHL:   { CAN: 45, GBR: 35, USA: 20 },
  VHL:    { RUS: 95, BLR: 5 },
  MHL:    { RUS: 100 },
  AIHL:   { AUS: 40, CAN: 40, USA: 20 }
};
const NA_LEAGUES = ['NHL', 'AHL', 'ECHL', 'SPHL', 'OHL', 'WHL', 'QMJHL', 'BCHL'];

const weighted = (table) => {
  const entries = Object.entries(table);
  const total = entries.reduce((n, [, w]) => n + w, 0);
  let r = Math.random() * total;
  for (const [k, w] of entries) { r -= w; if (r <= 0) return k; }
  return entries[0][0];
};
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/** Which country a club in this league hires its coach from, this time. */
export function staffNation(league) {
  const table = HIRES[league] || (NA_LEAGUES.includes(league) ? HIRES.NA : HIRES.NA);
  return weighted(table);
}

/**
 * A made-up name from one country, first name and surname together, that
 * isn't already taken. Returns { name, nat }.
 */
export function staffName(nat, avoid = []) {
  const pool = POOLS[nat] || POOLS.CAN;
  const taken = new Set((avoid || []).filter(Boolean));
  let name = `${pick(pool.first)} ${pick(pool.last)}`;
  for (let i = 0; i < 40 && taken.has(name); i++) name = `${pick(pool.first)} ${pick(pool.last)}`;
  return { name, nat: POOLS[nat] ? nat : 'CAN' };
}

/** A coach's or GM's name for a club in this league. */
export function staffFor(league, avoid = []) {
  return staffName(staffNation(league), avoid);
}

// The league a coach from each country most likely played and coached in
// before this job, for the line that introduces him.
export const HOME_LEAGUE = {
  SWE: 'the SHL', FIN: 'the Liiga', RUS: 'the KHL', BLR: 'the Belarusian league', CZE: 'the Czech Extraliga',
  SVK: 'the Slovak Extraliga', GER: 'the DEL', AUT: 'the ICE Hockey League', SUI: 'the National League'
};
