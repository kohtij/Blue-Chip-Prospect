// REAL RECORDS, SOURCED ONE AT A TIME.
//
// Nothing in this file is invented. Every number below was taken from a
// published record book and checked against the holder and the season it was
// set in. Where a record could not be sourced it is simply absent, and the
// book has no entry for it: a club or a league with no record here has no
// record in the game either. That is the honest failure mode. Filling the gaps
// with plausible-looking numbers would make the whole file untrustworthy,
// because nobody reading it could tell which half was real.
//
// Sources: the 2023-24 OHL Media Guide and the 2022-23 WHL Guide and Record
// Book, both of which carry a records page for every club in the league; the
// AHL Hall of Fame record book; the ECHL's own record book; the Hershey Bears
// media guide; Wikipedia per-club record pages and hockey-reference franchise
// single-season leaders for the NHL; EliteProspects all-time single-season
// leaderboards; and club or league announcements for anything set recently.
//
// What is still missing, and why:
//   - The QMJHL's clubs. The league's media guides are published as PDFs that
//     cannot be read from here, and its records site cannot be walked club by
//     club, so eighteen books are absent rather than half-sourced.
//   - Thirty of the AHL's clubs. The AHL publishes no league-wide guide, so
//     every club is its own hunt through its own media guide, and a third of
//     the league has existed for under a decade and has no book worth the name.
//   - The European leagues, the USHL, the BCHL and the Nordic junior tiers.
//     Nothing published for them could be checked.
//
// Two notes on franchise history, because both change whose book a season is in:
//   - The NHL consolidated the original Winnipeg Jets (1979-96) into the
//     current Jets, so Selanne's 1992-93 belongs to Winnipeg and not Arizona.
//   - Utah is a new franchise. The Coyotes history stayed with the dormant
//     franchise rather than moving, so Utah's book starts in 2024-25 and is
//     the softest in the league by a distance.

/** [value, holder, season]. A missing key means the record was not sourced. */
export const NHL_CLUB_RECORDS = {
  ANA: { points: [109, 'Teemu Selanne', '1996-97'], goals: [52, 'Teemu Selanne', '1997-98'], assists: [66, 'Ryan Getzlaf', '2008-09'], wins: [36, 'Jean-Sebastien Giguere', '2006-07'], shutouts: [8, 'Jean-Sebastien Giguere', '2002-03'] },
  BOS: { points: [152, 'Phil Esposito', '1970-71'], goals: [76, 'Phil Esposito', '1970-71'], assists: [102, 'Bobby Orr', '1970-71'], wins: [40, 'Linus Ullmark', '2022-23'], shutouts: [15, 'Hal Winkler', '1927-28'] },
  BUF: { points: [148, 'Pat LaFontaine', '1992-93'], goals: [76, 'Alexander Mogilny', '1992-93'], assists: [95, 'Pat LaFontaine', '1992-93'], wins: [41, 'Ryan Miller', '2009-10'], shutouts: [13, 'Dominik Hasek', '1997-98'] },
  CAR: { points: [105, 'Mike Rogers', '1979-80'], goals: [56, 'Blaine Stoughton', '1979-80'], assists: [69, 'Ron Francis', '1989-90'], wins: [39, 'Cam Ward', '2008-09'], shutouts: [6, 'Cam Ward', '2008-09'] },
  CBJ: { points: [87, 'Artemi Panarin', '2018-19'], goals: [41, 'Rick Nash', '2003-04'], assists: [59, 'Artemi Panarin', '2018-19'], wins: [41, 'Sergei Bobrovsky', '2016-17'], shutouts: [10, 'Steve Mason', '2008-09'] },
  CGY: { points: [131, 'Kent Nilsson', '1980-81'], goals: [66, 'Lanny McDonald', '1982-83'], assists: [82, 'Kent Nilsson', '1980-81'], wins: [45, 'Miikka Kiprusoff', '2008-09'], shutouts: [10, 'Miikka Kiprusoff', '2005-06'] },
  CHI: { points: [131, 'Denis Savard', '1987-88'], goals: [58, 'Bobby Hull', '1968-69'], assists: [87, 'Denis Savard', '1987-88'], wins: [43, 'Ed Belfour', '1990-91'], shutouts: [15, 'Tony Esposito', '1969-70'] },
  COL: { points: [140, 'Nathan MacKinnon', '2023-24'], goals: [57, 'Michel Goulet', '1982-83'], assists: [93, 'Peter Stastny', '1981-82'], wins: [41, 'Semyon Varlamov', '2013-14'], shutouts: [9, 'Patrick Roy', '2001-02'] },
  DAL: { points: [114, 'Bobby Smith', '1981-82'], goals: [55, 'Brian Bellows', '1989-90'], assists: [76, 'Neal Broten', '1985-86'], wins: [41, 'Marty Turco', '2005-06'], shutouts: [9, 'Marty Turco', '2003-04'] },
  DET: { points: [155, 'Steve Yzerman', '1988-89'], goals: [65, 'Steve Yzerman', '1988-89'], assists: [90, 'Steve Yzerman', '1988-89'], wins: [44, 'Terry Sawchuk', '1951-52'], shutouts: [12, 'Terry Sawchuk', '1954-55'] },
  EDM: { points: [215, 'Wayne Gretzky', '1985-86'], goals: [92, 'Wayne Gretzky', '1981-82'], assists: [163, 'Wayne Gretzky', '1985-86'], wins: [42, 'Cam Talbot', '2016-17'], shutouts: [8, 'Tommy Salo', '2000-01'] },
  FLA: { points: [115, 'Jonathan Huberdeau', '2021-22'], goals: [59, 'Pavel Bure', '2000-01'], assists: [85, 'Jonathan Huberdeau', '2021-22'], wins: [39, 'Sergei Bobrovsky', '2021-22'], shutouts: [7, 'Tomas Vokoun', '2009-10'] },
  LAK: { points: [168, 'Wayne Gretzky', '1988-89'], goals: [70, 'Bernie Nicholls', '1988-89'], assists: [122, 'Wayne Gretzky', '1990-91'], wins: [40, 'Jonathan Quick', '2015-16'], shutouts: [9, 'Jonathan Quick', '2011-12'] },
  MIN: { points: [108, 'Kirill Kaprizov', '2021-22'], goals: [47, 'Kirill Kaprizov', '2021-22'], assists: [61, 'Kirill Kaprizov', '2021-22'], wins: [40, 'Devan Dubnyk', '2016-17'], shutouts: [8, 'Niklas Backstrom', '2008-09'] },
  MTL: { points: [136, 'Guy Lafleur', '1976-77'], goals: [60, 'Guy Lafleur', '1977-78'], assists: [82, 'Pete Mahovlich', '1974-75'], wins: [44, 'Carey Price', '2014-15'], shutouts: [22, 'George Hainsworth', '1928-29'] },
  NJD: { points: [99, 'Jack Hughes', '2022-23'], goals: [48, 'Brian Gionta', '2005-06'], assists: [67, 'Jesper Bratt', '2024-25'], wins: [48, 'Martin Brodeur', '2006-07'], shutouts: [12, 'Martin Brodeur', '2006-07'] },
  NSH: { points: [96, 'Roman Josi', '2021-22'], goals: [48, 'Filip Forsberg', '2023-24'], assists: [73, 'Roman Josi', '2021-22'], wins: [43, 'Pekka Rinne', '2011-12'], shutouts: [8, 'Pekka Rinne', '2017-18'] },
  NYI: { points: [147, 'Mike Bossy', '1981-82'], goals: [69, 'Mike Bossy', '1978-79'], assists: [87, 'Bryan Trottier', '1978-79'], wins: [38, 'Jaroslav Halak', '2014-15'], shutouts: [7, 'Ilya Sorokin', '2021-22'] },
  NYR: { points: [123, 'Jaromir Jagr', '2005-06'], goals: [54, 'Jaromir Jagr', '2005-06'], assists: [80, 'Brian Leetch', '1991-92'], wins: [42, 'Mike Richter', '1993-94'], shutouts: [13, 'John Ross Roach', '1928-29'] },
  OTT: { points: [105, 'Dany Heatley', '2006-07'], goals: [50, 'Dany Heatley', '2006-07'], assists: [71, 'Jason Spezza', '2005-06'], wins: [39, 'Patrick Lalime', '2002-03'], shutouts: [8, 'Patrick Lalime', '2002-03'] },
  PHI: { points: [123, 'Mark Recchi', '1992-93'], goals: [61, 'Reggie Leach', '1975-76'], assists: [89, 'Bobby Clarke', '1975-76'], wins: [47, 'Bernie Parent', '1973-74'], shutouts: [12, 'Bernie Parent', '1974-75'] },
  PIT: { points: [199, 'Mario Lemieux', '1988-89'], goals: [85, 'Mario Lemieux', '1988-89'], assists: [114, 'Mario Lemieux', '1988-89'], wins: [43, 'Tom Barrasso', '1992-93'], shutouts: [10, 'Marc-Andre Fleury', '2014-15'] },
  SEA: { points: [70, 'Jared McCann', '2022-23'], goals: [40, 'Jared McCann', '2022-23'], assists: [50, 'Vince Dunn', '2022-23'], wins: [27, 'Joey Daccord', '2024-25'], shutouts: [3, 'Joey Daccord', '2023-24'] },
  SJS: { points: [115, 'Macklin Celebrini', '2025-26'], goals: [56, 'Jonathan Cheechoo', '2005-06'], assists: [92, 'Joe Thornton', '2006-07'], wins: [46, 'Evgeni Nabokov', '2007-08'], shutouts: [9, 'Evgeni Nabokov', '2003-04'] },
  STL: { points: [131, 'Brett Hull', '1990-91'], goals: [86, 'Brett Hull', '1990-91'], assists: [90, 'Adam Oates', '1990-91'], wins: [42, 'Roman Turek', '1999-2000'], shutouts: [9, 'Brian Elliott', '2011-12'] },
  TBL: { points: [144, 'Nikita Kucherov', '2023-24'], goals: [60, 'Steven Stamkos', '2011-12'], assists: [100, 'Nikita Kucherov', '2023-24'], wins: [44, 'Andrei Vasilevskiy', '2017-18'], shutouts: [8, 'Andrei Vasilevskiy', '2017-18'] },
  TOR: { points: [127, 'Doug Gilmour', '1992-93'], goals: [69, 'Auston Matthews', '2023-24'], assists: [95, 'Doug Gilmour', '1992-93'], wins: [38, 'Frederik Andersen', '2017-18'], shutouts: [13, 'Harry Lumley', '1953-54'] },
  // New franchise from 2024-25; the Coyotes history stayed with the dormant
  // franchise and did not transfer (Daily Faceoff / NHL).
  UTA: { points: [90, 'Clayton Keller', '2024-25'], goals: [40, 'Dylan Guenther', '2025-26'], assists: [62, 'Clayton Keller', '2025-26'], wins: [38, 'Karel Vejmelka', '2025-26'], shutouts: [2, 'Karel Vejmelka', '2025-26'] },
  VAN: { points: [112, 'Henrik Sedin', '2009-10'], goals: [60, 'Pavel Bure', '1993-94'], assists: [83, 'Henrik Sedin', '2009-10'], wins: [47, 'Roberto Luongo', '2006-07'], shutouts: [9, 'Roberto Luongo', '2008-09'] },
  VGK: { points: [94, 'Jack Eichel', '2024-25'], goals: [43, 'William Karlsson', '2017-18'], assists: [66, 'Jack Eichel', '2024-25'], wins: [35, 'Marc-Andre Fleury', '2018-19'], shutouts: [8, 'Marc-Andre Fleury', '2018-19'] },
  // Original Winnipeg Jets NHL history (1979-96) was consolidated into this
  // franchise by the NHL, so Selanne's 1992-93 season now belongs here.
  // Assists and shutouts left unsourced: the consolidated book has not been
  // restated in a source I could verify, and the best figure I found (Ulf
  // Nilsson, 94) is from the WHA years, which the consolidation excludes.
  WPG: { points: [132, 'Teemu Selanne', '1992-93'], goals: [76, 'Teemu Selanne', '1992-93'], wins: [44, 'Connor Hellebuyck', '2017-18'] },
  WSH: { points: [136, 'Dennis Maruk', '1981-82'], goals: [65, 'Alexander Ovechkin', '2007-08'], assists: [76, 'Dennis Maruk', '1981-82'], wins: [48, 'Braden Holtby', '2015-16'], shutouts: [9, 'Braden Holtby', '2016-17'] },
};

/**
 * Junior and minor-league club books.
 *
 * The OHL and the WHL both publish an official media guide with a records page
 * for every franchise in the league, which is where all forty-one of these came
 * from in two sittings: the 2023-24 OHL Media Guide and the 2022-23 WHL Guide
 * and Record Book. Both treat franchise history as continuous through a
 * relocation, the same way the NHL does with Winnipeg, so Prince George holds
 * the Victoria Cougars' book and Wenatchee holds the Winnipeg ICE's.
 *
 * The WHL's club pages list a goaltender's shutouts but not his wins, giving
 * only the club's team win total for a season, which is a different record and
 * is not what this book keeps. So WHL clubs have no wins entry, with one
 * exception: Glen Hanlon's forty-nine for Brandon is in the league record book
 * itself, so it is known.
 *
 * The QMJHL has no equivalent guide that can be read here, and the AHL has no
 * league-wide guide at all, which is why those clubs are nearly all missing.
 * Hershey is in because Hershey publishes its own.
 */
export const OHL_CLUB_RECORDS = {
  BAR: { points: [127, 'Kevin Labanc', '2015-16'], goals: [53, 'Bryan Cameron', '2009-10'], assists: [88, 'Kevin Labanc', '2015-16'], wins: [40, 'Andrew Perugini', '2006-07'], shutouts: [6, 'Dan LaCosta', '2005-06'] },
  BFD: { points: [102, 'Arthur Kaliyev', '2018-19'], goals: [51, 'Arthur Kaliyev', '2018-19'], assists: [66, 'Logan Morrison', '2021-22'], wins: [32, 'Kaden Fulcher', '2017-18'], shutouts: [6, 'Marco Costantini', '2021-22'] },
  ERI: { points: [129, 'Dylan Strome', '2014-15'], goals: [65, 'Alex DeBrincat', '2016-17'], assists: [84, 'Dylan Strome', '2014-15'], wins: [41, 'Devin Williams', '2015-16'], shutouts: [6, 'J.F. Perras', '1999-2000'] },
  FLN: { points: [102, 'Amadeus Lombardi', '2022-23'], goals: [50, 'Brennan Othmann', '2021-22'], assists: [57, 'Amadeus Lombardi', '2022-23'], wins: [36, 'Luke Cavallin', '2021-22'], shutouts: [2, 'Luke Cavallin', '2021-22'] },
  GUE: { points: [126, 'Jeff O\'Neill', '1993-94'], goals: [54, 'Todd Bertuzzi', '1994-95'], assists: [81, 'Jeff O\'Neill', '1993-94'], wins: [36, 'Garret Sparks', '2012-13'], shutouts: [7, 'Garret Sparks', '2012-13'] },
  KGN: { points: [135, 'David Ling', '1994-95'], goals: [61, 'David Ling', '1994-95'], assists: [84, 'Keli Corpse', '1993-94'], wins: [33, 'Tyler Moss', '1994-95'], shutouts: [6, 'Jeremy Helvig', '2016-17'] },
  KIT: { points: [140, 'John Tucker', '1982-83'], goals: [63, 'Wayne Presley', '1983-84'], assists: [84, 'Jason Akeson', '2010-11'], wins: [41, 'Wendell Young', '1982-83'], shutouts: [7, 'Dan Turple', '2005-06'] },
  LDN: { points: [155, 'Dave Simpson', '1981-82'], goals: [72, 'Dino Ciccarelli', '1977-78'], assists: [91, 'Sergei Kostitsyn', '2006-07'], wins: [46, 'Michael Houser', '2011-12'], shutouts: [8, 'Gerald Coleman', '2004-05'] },
  MIS: { points: [82, 'James Hardie', '2022-23'], goals: [44, 'Owen Tippett', '2016-17'], assists: [52, 'Riley Brace', '2012-13'], wins: [32, 'Jack Flinn', '2015-16'], shutouts: [7, 'Jack Flinn', '2015-16'] },
  NIA: { points: [111, 'Luca Caputi', '2007-08'], goals: [51, 'Luca Caputi', '2007-08'], assists: [73, 'Ryan Strome', '2010-11'], wins: [38, 'Stephen Dhillon', '2018-19'], shutouts: [10, 'Mark Visentin', '2011-12'] },
  NOB: { points: [128, 'Wojtek Wolski', '2005-06'], goals: [61, 'Justin Brazeau', '2018-19'], assists: [81, 'Wojtek Wolski', '2005-06'], wins: [36, 'Dom DiVincentiis', '2022-23'], shutouts: [5, 'Patrick Killeen', '2009-10'] },
  OTT: { points: [192, 'Bobby Smith', '1977-78'], goals: [81, 'Peter Lee', '1975-76'], assists: [123, 'Bobby Smith', '1977-78'], wins: [38, 'Jim Ralph', '1980-81'], shutouts: [5, 'Michel Larocque', '1970-71'] },
  OSH: { points: [150, 'Tony Tanti', '1980-81'], goals: [81, 'Tony Tanti', '1980-81'], assists: [99, 'Scott McCrory', '1986-87'], wins: [38, 'Ken Appleby', '2014-15'], shutouts: [6, 'Ken Appleby', '2014-15'] },
  OWS: { points: [162, 'Andrew Brunette', '1992-93'], goals: [62, 'Andrew Brunette', '1992-93'], assists: [100, 'Andrew Brunette', '1992-93'], wins: [41, 'Michael McNiven', '2016-17'], shutouts: [7, 'Jordan Binnington', '2012-13'] },
  PBO: { points: [136, 'Mike Harding', '1992-93'], goals: [63, 'Scott Tottle', '1983-84'], assists: [90, 'Mark Teevens', '1984-85'], wins: [35, 'Kay Whitmore', '1984-85'], shutouts: [6, 'David Currie', '2002-03'] },
  SAG: { points: [111, 'Cole Perfetti', '2019-20'], goals: [47, 'Josh Shalla', '2010-11'], assists: [74, 'Cole Perfetti', '2019-20'], wins: [38, 'Ryan Daniels', '2006-07'], shutouts: [4, 'Mike Brown', '2003-04'] },
  SAR: { points: [130, 'Peter Sarno', '1998-99'], goals: [62, 'Reid Boucher', '2012-13'], assists: [93, 'Peter Sarno', '1998-99'], wins: [37, 'Justin Fazio', '2017-18'], shutouts: [4, 'Patrick DesRochers', '1996-97'] },
  SSM: { points: [182, 'Wayne Gretzky', '1977-78'], goals: [78, 'Steve Gatzos', '1980-81'], assists: [119, 'Mike Kaszycki', '1975-76'], wins: [40, 'Brandon Halverson', '2014-15'], shutouts: [6, 'Matt Murray', '2013-14'] },
  SUD: { points: [150, 'Mike Foligno', '1978-79'], goals: [72, 'Rod Schutt', '1975-76'], assists: [92, 'Ron Duguay', '1975-76'], wins: [40, 'Jim Bedard', '1975-76'], shutouts: [6, 'Ukko-Pekka Luukkonen', '2018-19'] },
  WIN: { points: [153, 'Ernie Godden', '1980-81'], goals: [87, 'Ernie Godden', '1980-81'], assists: [102, 'Bill Bowler', '1994-95'], wins: [46, 'Andrew Engelage', '2008-09'], shutouts: [7, 'Michael DiPietro', '2017-18'] },
};

export const WHL_CLUB_RECORDS = {
  BDN: { points: [194, 'Brian Propp', '1978-79'], goals: [108, 'Ray Ferraro', '1983-84'], assists: [118, 'Cam Plante', '1983-84'], wins: [49, 'Glen Hanlon', '1976-77'], shutouts: [6, 'Tyler Plante', '2004-05'] },
  CGY: { points: [134, 'Pavel Brendl', '1998-99'], goals: [73, 'Pavel Brendl', '1998-99'], assists: [75, 'Brandon Kozun', '2009-10'], shutouts: [11, 'Justin Pogge', '2005-06'] },
  EDM: { points: [105, 'Michael St. Croix', '2011-12'], goals: [45, 'Michael St. Croix', '2011-12'], assists: [65, 'Trey Fix-Wolansky', '2018-19'], shutouts: [8, 'Tristan Jarry', '2013-14'] },
  EVT: { points: [100, 'Patrick Bajkov', '2017-18'], goals: [47, 'Josh Winquist', '2013-14'], assists: [67, 'Patrick Bajkov', '2017-18'], shutouts: [11, 'Leland Irving', '2006-07'] },
  KAM: { points: [212, 'Rob Brown', '1986-87'], goals: [85, 'Len Barrie', '1989-90'], assists: [136, 'Rob Brown', '1986-87'], shutouts: [7, 'Dustin Butler', '2006-07'] },
  KEL: { points: [123, 'Allan Egeland', '1993-94'], goals: [60, 'John Varga', '1993-94'], assists: [79, 'Marty Flichel', '1995-96'], shutouts: [13, 'Kelly Guard', '2003-04'] },
  LET: { points: [142, 'Corey Lyons', '1989-90'], goals: [65, 'Kelly Kisio', '1979-80'], assists: [90, 'Bryan Bosch', '1989-90'], shutouts: [5, 'Logan Koopmans', '2003-04'] },
  MED: { points: [171, 'Greg Carroll', '1975-76'], goals: [88, 'Don Murdoch', '1975-76'], assists: [111, 'Greg Carroll', '1975-76'], shutouts: [7, 'Kevin Nastiuk', '2004-05'] },
  MJW: { points: [160, 'Theoren Fleury', '1987-88'], goals: [70, 'Blair Atcheynum', '1988-89'], assists: [92, 'Theoren Fleury', '1987-88'], shutouts: [6, 'Donovan Nunweiler', '1996-97'] },
  POR: { points: [167, 'Dennis Holland', '1988-89'], goals: [82, 'Randy Heath', '1982-83'], assists: [111, 'Jim Benning', '1980-81'], shutouts: [7, 'Mac Carruth', '2012-13'] },
  PRA: { points: [182, 'Dan Hodgson', '1984-85'], goals: [70, 'Dan Hodgson', '1984-85'], assists: [119, 'Dan Hodgson', '1983-84'], shutouts: [8, 'Ian Scott', '2018-19'] },
  PRG: { points: [157, 'Mel Bridgman', '1974-75'], goals: [73, 'Ken Priestley', '1984-85'], assists: [96, 'Simon Wheeldon', '1985-86'], shutouts: [6, 'Scott Bowles', '2005-06'] },
  RED: { points: [120, 'Justin Mapletoft', '2000-01'], goals: [58, 'BJ Young', '1996-97'], assists: [77, 'Justin Mapletoft', '2000-01'], shutouts: [13, 'Darcy Kuemper', '2010-11'] },
  REG: { points: [190, 'Jock Callander', '1981-82'], goals: [89, 'Doug Wickenheiser', '1979-80'], assists: [111, 'Jock Callander', '1981-82'], shutouts: [5, 'Warren Fisher', '1967-68'] },
  SAS: { points: [187, 'Bernie Federko', '1975-76'], goals: [83, 'Frank Banham', '1995-96'], assists: [125, 'Bruce Eakin', '1981-82'], shutouts: [7, 'Andrey Makarov', '2012-13'] },
  SEA: { points: [163, 'Glen Goodall', '1989-90'], goals: [76, 'Glen Goodall', '1989-90'], assists: [96, 'Victor Gervais', '1989-90'], shutouts: [13, 'Bryan Bridges', '2004-05'] },
  SPO: { points: [185, 'Ray Whitney', '1990-91'], goals: [68, 'Valeri Bure', '1992-93'], assists: [118, 'Ray Whitney', '1990-91'], shutouts: [7, 'Dustin Tokarski', '2008-09'] },
  SCB: { points: [162, 'Jason Krywulak', '1992-93'], goals: [81, 'Jason Krywulak', '1992-93'], assists: [87, 'Darren Kruger', '1988-89'], shutouts: [7, 'Landon Bow', '2014-15'] },
  TCA: { points: [162, 'Brian Sakic', '1990-91'], goals: [89, 'Kyle Reeves', '1990-91'], assists: [122, 'Brian Sakic', '1990-91'], shutouts: [8, 'Carey Price', '2004-05'] },
  VAN: { points: [115, 'Casey Pierro-Zabotel', '2008-09'], goals: [61, 'Ty Ronning', '2017-18'], assists: [79, 'Casey Pierro-Zabotel', '2008-09'], shutouts: [11, 'Dustin Slade', '2005-06'] },
  VIC: { points: [112, 'Matthew Phillips', '2017-18'], goals: [51, 'Ryan Howse', '2010-11'], assists: [74, 'Mark Santorelli', '2007-08'], shutouts: [6, 'Coleman Vollrath', '2014-15'] },
  WEN: { points: [106, 'Jarret Stoll', '2000-01'], goals: [50, 'Nigel Dawes', '2004-05'], assists: [69, 'Sam Reinhart', '2013-14'], shutouts: [8, 'Jeff Glass', '2004-05'] },
};

export const AHL_CLUB_RECORDS = {
  // From the Bears' own media guide. Ninety-odd years of it, and Red Sullivan's
  // eighty-nine assists is the AHL league record as well as Hershey's.
  HER: { points: [124, 'Tim Tookey', '1986-87'], goals: [60, 'Alexandre Giroux', '2008-09'], assists: [89, 'George Sullivan', '1953-54'], wins: [38, 'Gordon Henry', '1950-51'], shutouts: [7, 'Nick Damore', '1944-45'] },
  // Goaltending only. The Amerks guide's season-by-season tables are readable
  // and its records pages are not, so this is what could be confirmed:
  // Cheevers' forty-eight is the AHL league record too, which is as good a
  // cross-check as a number gets. The skater records are left out rather than
  // guessed at.
  ROC: { wins: [48, 'Gerry Cheevers', '1964-65'], shutouts: [8, 'Ryan Miller', '2004-05'] },
};

/** Which club book belongs to which league. A league absent here has none. */
export const CLUB_RECORDS = {
  NHL: NHL_CLUB_RECORDS,
  OHL: OHL_CLUB_RECORDS,
  WHL: WHL_CLUB_RECORDS,
  AHL: AHL_CLUB_RECORDS,
};

/** All-time single-season records for the league itself. */
export const LEAGUE_RECORDS = {
  // Cheevers' forty-eight is the same number Brodeur and Holtby share in the
  // NHL, set in a seventy-two-game schedule twenty years earlier.
  AHL: { points: [138, 'Don Biggs', '1992-93'], goals: [70, 'Stephan Lebeau', '1988-89'], assists: [89, 'George Sullivan', '1953-54'], wins: [48, 'Gerry Cheevers', '1964-65'], shutouts: [13, 'Jason LaBarbera', '2003-04'] },
  ECHL: { points: [161, 'Trevor Jobe', '1992-93'], goals: [85, 'Trevor Jobe', '1992-93'], assists: [93, 'Dan Gauthier', '1990-91'], wins: [38, 'Mark Michaud', '1993-94'], shutouts: [8, 'J.P. Lamoureux', '2008-09'] },
  // Only the scoring record is here. College hockey's goaltending records are
  // not published anywhere that could be checked, and a goaltender's book has
  // to be right or it is worse than empty.
  NCAA: { points: [116, 'Tony Hrkac', '1986-87'] },
  NHL: { points: [215, 'Wayne Gretzky', '1985-86'], goals: [92, 'Wayne Gretzky', '1981-82'], assists: [163, 'Wayne Gretzky', '1985-86'], wins: [48, 'Martin Brodeur', '2006-07'], shutouts: [22, 'George Hainsworth', '1928-29'] },
  // Engelage and Houser are tied on forty-six. The book keeps the man who got
  // there first, which is how a record book works: Houser matched it, he did
  // not take it.
  OHL: { points: [192, 'Bobby Smith', '1977-78'], goals: [87, 'Ernie Godden', '1980-81'], assists: [123, 'Bobby Smith', '1977-78'], wins: [46, 'Andrew Engelage', '2008-09'], shutouts: [10, 'Mark Visentin', '2011-12'] },
  QMJHL: { points: [282, 'Mario Lemieux', '1983-84'], goals: [133, 'Mario Lemieux', '1983-84'], assists: [149, 'Mario Lemieux', '1983-84'], wins: [58, 'Jacques Cloutier', '1978-79'], shutouts: [8, 'William Rousseau', '2023-24'] },
  // The goals record here was wrong until now: it said seventy-six, which is
  // Rob Brown's total in his two-hundred-and-twelve-point season and the most
  // anyone has scored while also setting the points record. Ray Ferraro scored
  // a hundred and eight three years earlier. The WHL's own record book says so.
  WHL: { points: [212, 'Rob Brown', '1986-87'], goals: [108, 'Ray Ferraro', '1983-84'], assists: [136, 'Rob Brown', '1986-87'], wins: [49, 'Glen Hanlon', '1976-77'], shutouts: [13, 'Kelly Guard', '2003-04'] },
};
