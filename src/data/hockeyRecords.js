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
// Sources: three official league guides, each carrying a records page for
// every club in its league, which is how a hundred and five club books got
// here instead of a handful: the 2026-27 AHL Guide and Record Book, the
// 2023-24 OHL Media Guide and the 2022-23 WHL Guide and Record Book. Then the
// ECHL's own record book, the AHL Hall of Fame record book, Wikipedia per-club
// record pages and hockey-reference franchise single-season leaders for the
// NHL, EliteProspects all-time single-season leaderboards, club or league
// announcements for anything set recently, and QuantHockey for the QMJHL's,
// the ECHL's, the SPHL's, the USHL's and every European club, and for the
// European, USHL and SPHL league books.
//
// What is still missing, and why:
//   - Bridgeport. See the note on the AHL clubs below.
//   - The BCHL and the Nordic junior tiers, clubs and league both. QuantHockey's
//     BCHL tables start around 1996, after the years that set its real marks.
//   - Clubs that joined their league this season and haven't played in it yet.
//
// Two notes on franchise history, because both change whose book a season is in:
//   - The NHL consolidated the original Winnipeg Jets (1979-96) into the
//     current Jets, so Selanne's 1992-93 belongs to Winnipeg and not Arizona.
//   - Utah is a new franchise. The Coyotes history stayed with the dormant
//     franchise rather than moving, so Utah's book starts in 2024-25 and is
//     the softest in the league by a distance.

// The NHL books were checked against hockey-reference's franchise season
// leaders in November 2026. Where a record is shared, the book keeps whoever
// set it first, the same as everywhere else in this file: the men who matched
// it didn't take it. Vegas is the one club whose page wouldn't show its
// assists, wins and shutouts tables, so those three are still from the
// earlier sources.

/** [value, holder, season]. A missing key means the record was not sourced. */
export const NHL_CLUB_RECORDS = {
  ANA: { points: [109, 'Teemu Selanne', '1996-97'], goals: [52, 'Teemu Selanne', '1997-98'], assists: [66, 'Ryan Getzlaf', '2008-09'], wins: [36, 'Jean-Sebastien Giguere', '2006-07'], shutouts: [8, 'Jean-Sebastien Giguere', '2002-03'] },
  BOS: { points: [152, 'Phil Esposito', '1970-71'], goals: [76, 'Phil Esposito', '1970-71'], assists: [102, 'Bobby Orr', '1970-71'], wins: [40, 'Pete Peeters', '1982-83'], shutouts: [15, 'Hal Winkler', '1927-28'] },
  BUF: { points: [148, 'Pat LaFontaine', '1992-93'], goals: [76, 'Alexander Mogilny', '1992-93'], assists: [95, 'Pat LaFontaine', '1992-93'], wins: [41, 'Ryan Miller', '2009-10'], shutouts: [13, 'Dominik Hasek', '1997-98'] },
  CAR: { points: [105, 'Mike Rogers', '1979-80'], goals: [56, 'Blaine Stoughton', '1979-80'], assists: [69, 'Ron Francis', '1989-90'], wins: [39, 'Cam Ward', '2008-09'], shutouts: [6, 'Arturs Irbe', '1998-99'] },
  CBJ: { points: [87, 'Artemi Panarin', '2018-19'], goals: [41, 'Rick Nash', '2003-04'], assists: [59, 'Artemi Panarin', '2018-19'], wins: [41, 'Sergei Bobrovsky', '2016-17'], shutouts: [10, 'Steve Mason', '2008-09'] },
  CGY: { points: [131, 'Kent Nilsson', '1980-81'], goals: [66, 'Lanny McDonald', '1982-83'], assists: [82, 'Kent Nilsson', '1980-81'], wins: [45, 'Miikka Kiprusoff', '2008-09'], shutouts: [10, 'Miikka Kiprusoff', '2005-06'] },
  CHI: { points: [131, 'Denis Savard', '1987-88'], goals: [58, 'Bobby Hull', '1968-69'], assists: [87, 'Denis Savard', '1981-82'], wins: [43, 'Ed Belfour', '1990-91'], shutouts: [15, 'Tony Esposito', '1969-70'] },
  COL: { points: [140, 'Nathan MacKinnon', '2023-24'], goals: [57, 'Michel Goulet', '1982-83'], assists: [93, 'Peter Stastny', '1981-82'], wins: [41, 'Semyon Varlamov', '2013-14'], shutouts: [9, 'Patrick Roy', '2001-02'] },
  DAL: { points: [114, 'Bobby Smith', '1981-82'], goals: [55, 'Dino Ciccarelli', '1981-82'], assists: [76, 'Neal Broten', '1985-86'], wins: [41, 'Marty Turco', '2005-06'], shutouts: [9, 'Ed Belfour', '1997-98'] },
  DET: { points: [155, 'Steve Yzerman', '1988-89'], goals: [65, 'Steve Yzerman', '1988-89'], assists: [90, 'Steve Yzerman', '1988-89'], wins: [44, 'Terry Sawchuk', '1950-51'], shutouts: [12, 'Terry Sawchuk', '1951-52'] },
  EDM: { points: [215, 'Wayne Gretzky', '1985-86'], goals: [92, 'Wayne Gretzky', '1981-82'], assists: [163, 'Wayne Gretzky', '1985-86'], wins: [42, 'Cam Talbot', '2016-17'], shutouts: [8, 'Curtis Joseph', '1997-98'] },
  FLA: { points: [115, 'Jonathan Huberdeau', '2021-22'], goals: [59, 'Pavel Bure', '2000-01'], assists: [85, 'Jonathan Huberdeau', '2021-22'], wins: [39, 'Sergei Bobrovsky', '2021-22'], shutouts: [7, 'Roberto Luongo', '2003-04'] },
  LAK: { points: [168, 'Wayne Gretzky', '1988-89'], goals: [70, 'Bernie Nicholls', '1988-89'], assists: [122, 'Wayne Gretzky', '1990-91'], wins: [40, 'Jonathan Quick', '2015-16'], shutouts: [9, 'Jonathan Quick', '2011-12'] },
  MIN: { points: [108, 'Kirill Kaprizov', '2021-22'], goals: [47, 'Kirill Kaprizov', '2021-22'], assists: [61, 'Kirill Kaprizov', '2021-22'], wins: [40, 'Devan Dubnyk', '2016-17'], shutouts: [8, 'Niklas Backstrom', '2008-09'] },
  MTL: { points: [136, 'Guy Lafleur', '1976-77'], goals: [60, 'Steve Shutt', '1976-77'], assists: [82, 'Pete Mahovlich', '1974-75'], wins: [44, 'Carey Price', '2014-15'], shutouts: [22, 'George Hainsworth', '1928-29'] },
  NJD: { points: [99, 'Jack Hughes', '2022-23'], goals: [48, 'Brian Gionta', '2005-06'], assists: [67, 'Jesper Bratt', '2024-25'], wins: [48, 'Martin Brodeur', '2006-07'], shutouts: [12, 'Martin Brodeur', '2006-07'] },
  NSH: { points: [96, 'Roman Josi', '2021-22'], goals: [48, 'Filip Forsberg', '2023-24'], assists: [73, 'Roman Josi', '2021-22'], wins: [43, 'Pekka Rinne', '2011-12'], shutouts: [8, 'Pekka Rinne', '2017-18'] },
  NYI: { points: [147, 'Mike Bossy', '1981-82'], goals: [69, 'Mike Bossy', '1978-79'], assists: [87, 'Bryan Trottier', '1978-79'], wins: [38, 'Jaroslav Halak', '2014-15'], shutouts: [7, 'Glenn Resch', '1975-76'] },
  NYR: { points: [123, 'Jaromir Jagr', '2005-06'], goals: [54, 'Jaromir Jagr', '2005-06'], assists: [80, 'Brian Leetch', '1991-92'], wins: [42, 'Mike Richter', '1993-94'], shutouts: [13, 'John Ross Roach', '1928-29'] },
  OTT: { points: [105, 'Dany Heatley', '2006-07'], goals: [50, 'Dany Heatley', '2005-06'], assists: [71, 'Jason Spezza', '2005-06'], wins: [39, 'Patrick Lalime', '2002-03'], shutouts: [8, 'Patrick Lalime', '2002-03'] },
  PHI: { points: [123, 'Mark Recchi', '1992-93'], goals: [61, 'Reggie Leach', '1975-76'], assists: [89, 'Bobby Clarke', '1974-75'], wins: [47, 'Bernie Parent', '1973-74'], shutouts: [12, 'Bernie Parent', '1973-74'] },
  PIT: { points: [199, 'Mario Lemieux', '1988-89'], goals: [85, 'Mario Lemieux', '1988-89'], assists: [114, 'Mario Lemieux', '1988-89'], wins: [43, 'Tom Barrasso', '1992-93'], shutouts: [10, 'Marc-Andre Fleury', '2014-15'] },
  SEA: { points: [70, 'Jared McCann', '2022-23'], goals: [40, 'Jared McCann', '2022-23'], assists: [50, 'Vince Dunn', '2022-23'], wins: [27, 'Martin Jones', '2022-23'], shutouts: [3, 'Martin Jones', '2022-23'] },
  SJS: { points: [115, 'Macklin Celebrini', '2025-26'], goals: [56, 'Jonathan Cheechoo', '2005-06'], assists: [92, 'Joe Thornton', '2006-07'], wins: [46, 'Evgeni Nabokov', '2007-08'], shutouts: [9, 'Evgeni Nabokov', '2003-04'] },
  STL: { points: [131, 'Brett Hull', '1990-91'], goals: [86, 'Brett Hull', '1990-91'], assists: [90, 'Adam Oates', '1990-91'], wins: [42, 'Roman Turek', '1999-00'], shutouts: [9, 'Brian Elliott', '2011-12'] },
  TBL: { points: [144, 'Nikita Kucherov', '2023-24'], goals: [60, 'Steven Stamkos', '2011-12'], assists: [100, 'Nikita Kucherov', '2023-24'], wins: [44, 'Andrei Vasilevskiy', '2017-18'], shutouts: [8, 'Andrei Vasilevskiy', '2017-18'] },
  TOR: { points: [127, 'Doug Gilmour', '1992-93'], goals: [69, 'Auston Matthews', '2023-24'], assists: [95, 'Doug Gilmour', '1992-93'], wins: [38, 'Frederik Andersen', '2017-18'], shutouts: [13, 'Harry Lumley', '1953-54'] },
  // New franchise from 2024-25; the Coyotes history stayed with the dormant
  // franchise and did not transfer (Daily Faceoff / NHL).
  UTA: { points: [90, 'Clayton Keller', '2024-25'], goals: [40, 'Dylan Guenther', '2025-26'], assists: [62, 'Clayton Keller', '2025-26'], wins: [38, 'Karel Vejmelka', '2025-26'], shutouts: [2, 'Karel Vejmelka', '2025-26'] },
  VAN: { points: [112, 'Henrik Sedin', '2009-10'], goals: [60, 'Pavel Bure', '1992-93'], assists: [83, 'Henrik Sedin', '2009-10'], wins: [47, 'Roberto Luongo', '2006-07'], shutouts: [9, 'Roberto Luongo', '2008-09'] },
  VGK: { points: [94, 'Jack Eichel', '2024-25'], goals: [43, 'William Karlsson', '2017-18'], assists: [66, 'Jack Eichel', '2024-25'], wins: [35, 'Marc-Andre Fleury', '2018-19'], shutouts: [8, 'Marc-Andre Fleury', '2018-19'] },
  // hockey-reference keeps the original Jets (1979-96) and the Atlanta
  // Thrashers (1999-2011) in this one franchise, so both books are in here.
  WPG: { points: [132, 'Teemu Selanne', '1992-93'], goals: [76, 'Teemu Selanne', '1992-93'], assists: [79, 'Phil Housley', '1992-93'], wins: [47, 'Connor Hellebuyck', '2024-25'], shutouts: [8, 'Connor Hellebuyck', '2024-25'] },
  WSH: { points: [136, 'Dennis Maruk', '1981-82'], goals: [65, 'Alexander Ovechkin', '2007-08'], assists: [76, 'Dennis Maruk', '1981-82'], wins: [48, 'Braden Holtby', '2015-16'], shutouts: [9, 'Jim Carey', '1995-96'] },
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
 * The AHL's clubs come from the league's own Guide and Record Book (see
 * AHL_CLUB_RECORDS), and the QMJHL's from QuantHockey (QMJHL_CLUB_RECORDS).
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
  // Penticton came over from the BCHL for 2025-26. One season, from
  // QuantHockey, and no wins entry, to match the rest of the league's clubs.
  PEN: { points: [85, 'Jacob Kvasnicka', '2025-26'], goals: [35, 'Jacob Kvasnicka', '2025-26'], assists: [50, 'Jacob Kvasnicka', '2025-26'], shutouts: [4, 'Ethan McCallum', '2025-26'] },
};

/**
 * The AHL's thirty-two, from the league's own 2026-27 Guide and Record Book.
 *
 * Every club in the league prints the same five records on its directory page,
 * which is why this arrived whole rather than club by club. Franchise history
 * carries through a relocation, so Hartford's book still holds Jason
 * LaBarbera's thirteen shutouts from 2003-04 and Rochester's holds Gerry
 * Cheevers' forty-eight wins from 1964-65, both of which are AHL records as
 * well as club ones.
 *
 * Bridgeport is the one club with nothing. The Islanders moved to Hamilton for
 * 2026-27 and the record pages moved with them, and the Hammers have not played
 * a game yet, so there is no page to read.
 */
export const AHL_CLUB_RECORDS = {
  ABB: { points: [69, 'Sheldon Rempal', '2021-22'], goals: [35, 'Sheldon Dries', '2021-22'], assists: [49, 'Christian Wolanin', '2022-23'], wins: [26, 'Arturs Silovs', '2022-23'], shutouts: [4, 'Arturs Silovs', '2022-23'] },
  BAK: { points: [80, 'Seth Griffith', '2021-22'], goals: [30, 'Seth Griffith', '2021-22'], assists: [51, 'Tyler Benson', '2018-19'], wins: [27, 'Shane Starrett', '2018-19'], shutouts: [5, 'Stuart Skinner', '2021-22'] },
  BEL: { points: [68, 'Arthur Kaliyev', '2025-26'], goals: [40, 'Arthur Kaliyev', '2025-26'], assists: [40, 'Drake Batherson', '2018-19'], wins: [21, 'Marcus Hogberg', '2018-19'], shutouts: [4, 'Leevi Merilainen', '2024-25'] },
  CGY_AHL: { points: [76, 'Matthew Phillips', '2022-23'], goals: [36, 'Matthew Phillips', '2022-23'], assists: [45, 'Dryden Hunt', '2025-26'], wins: [42, 'Dustin Wolf', '2022-23'], shutouts: [7, 'Dustin Wolf', '2022-23'] },
  CHI_AHL: { points: [122, 'Darren Haydar', '2006-07'], goals: [55, 'Brett Sterling', '2006-07'], assists: [81, 'Darren Haydar', '2006-07'], wins: [38, 'Kari Lehtonen', '2004-05'], shutouts: [7, 'Jake Allen', '2013-14'] },
  CLE: { points: [71, 'Trey Fix-Wolansky', '2022-23'], goals: [33, 'Zac Dalpe', '2018-19'], assists: [50, 'T.J. Hensick', '2009-10'], wins: [30, 'Jet Greaves', '2023-24'], shutouts: [8, 'Tyler Weiman', '2008-09'] },
  CLT: { points: [74, 'Zach Boychuk', '2013-14'], goals: [36, 'Zach Boychuk', '2013-14'], assists: [47, 'Andrew Poturalski', '2018-19'], wins: [34, 'Alex Nedeljkovic', '2018-19'], shutouts: [6, 'Justin Peters', '2012-13'] },
  COL_AHL: { points: [75, 'Kiefer Sherwood', '2021-22'], goals: [35, 'Kiefer Sherwood', '2021-22'], assists: [55, 'Jordan Gross', '2021-22'], wins: [27, 'Pavel Francouz', '2018-19'], shutouts: [3, 'Pavel Francouz', '2018-19'] },
  CV: { points: [67, 'Max McCormick', '2022-23'], goals: [32, 'Max McCormick', '2023-24'], assists: [48, 'Kole Lind', '2023-24'], wins: [26, 'Joey Daccord', '2022-23'], shutouts: [4, 'Chris Driedger', '2023-24'] },
  GR: { points: [96, 'Jiri Hudler', '2005-06'], goals: [56, 'Donald MacLean', '2005-06'], assists: [60, 'Jiri Hudler', '2005-06'], wins: [34, 'Joey MacDonald', '2004-05'], shutouts: [6, 'Marc Lamothe', '2002-03'] },
  HER: { points: [124, 'Tim Tookey', '1986-87'], goals: [60, 'Alexandre Giroux', '2008-09'], assists: [89, 'George "Red" Sullivan', '1953-54'], wins: [38, 'Gord Henry', '1950-51'], shutouts: [7, 'Alfie Moore', '1938-39'] },
  HFD: { points: [101, 'Derek Armstrong', '2000-01'], goals: [50, 'Brad Smyth', '2000-01'], assists: [69, 'Derek Armstrong', '2000-01'], wins: [34, 'Jason LaBarbera', '2003-04'], shutouts: [13, 'Jason LaBarbera', '2003-04'] },
  HSK: { points: [64, 'Gage Quinney', '2022-23'], goals: [30, 'Raphael Lavoie', '2025-26'], assists: [42, 'Tanner Laczynski', '2025-26'], wins: [24, 'Carl Lindbom', '2025-26'], shutouts: [3, 'Carl Lindbom', '2024-25'] },
  IA: { points: [70, 'Sam Anas', '2019-20'], goals: [39, 'Gerry Mayhew', '2019-20'], assists: [51, 'Cal O\'Reilly', '2018-19'], wins: [25, 'Kaapo Kahkonen', '2019-20'], shutouts: [7, 'Kaapo Kahkonen', '2019-20'] },
  LAV: { points: [71, 'Chris Terry', '2017-18'], goals: [32, 'Chris Terry', '2017-18'], assists: [48, 'Matt Taormina', '2017-18'], wins: [24, 'Jakub Dobes', '2023-24'], shutouts: [4, 'Cayden Primeau', '2019-20'] },
  LVP: { points: [105, 'Peter White', '1996-97'], goals: [47, 'Mike Maneluk', '1999-00'], assists: [78, 'Peter White', '1997-98'], wins: [33, 'Antero Niittymaki', '2004-05'], shutouts: [7, 'Antero Niittymaki', '2003-04'] },
  MB: { points: [86, 'Jason Krog', '2008-09'], goals: [37, 'Jesse Schultz', '2005-06'], assists: [66, 'Peter Sarno', '2004-05'], wins: [35, 'Cory Schneider', '2009-10'], shutouts: [6, 'Wade Flaherty', '2005-06'] },
  MIL: { points: [92, 'Darren Haydar', '2005-06'], goals: [35, 'Darren Haydar', '2005-06'], assists: [63, 'Cal O\'Reilly', '2007-08'], wins: [36, 'Brian Finley', '2004-05'], shutouts: [7, 'Brian Finley', '2004-05'] },
  ONT: { points: [98, 'T.J. Tynan', '2021-22'], goals: [43, 'Samuel Fagemo', '2023-24'], assists: [84, 'T.J. Tynan', '2021-22'], wins: [42, 'Peter Budaj', '2015-16'], shutouts: [9, 'Peter Budaj', '2015-16'] },
  PRO: { points: [102, 'Randy Robitaille', '1998-99'], goals: [41, 'Tim Sweeney', '1992-93'], assists: [74, 'Randy Robitaille', '1998-99'], wins: [37, 'John Grahame', '1998-99'], shutouts: [9, 'Tim Thomas', '2003-04'] },
  RFD: { points: [88, 'Martin St. Pierre', '2007-08'], goals: [35, 'Troy Brouwer', '2007-08'], assists: [67, 'Martin St. Pierre', '2007-08'], wins: [29, 'Corey Crawford', '2007-08'], shutouts: [5, 'Michael Leighton', '2014-15'] },
  ROC: { points: [119, 'Geordie Robertson', '1982-83'], goals: [61, 'Paul Gardner', '1985-86'], assists: [73, 'Geordie Robertson', '1982-83'], wins: [48, 'Gerry Cheevers', '1964-65'], shutouts: [8, 'Ryan Miller', '2004-05'] },
  SD: { points: [64, 'Andrew Agozzino', '2023-24'], goals: [32, 'Sam Carrick', '2018-19'], assists: [45, 'Brandon Montour', '2015-16'], wins: [24, 'Kevin Boyle', '2018-19'], shutouts: [3, 'Reto Berra', '2017-18'] },
  SJS_AHL: { points: [73, 'Andrew Poturalski', '2024-25'], goals: [30, 'Andrew Poturalski', '2024-25'], assists: [43, 'Andrew Poturalski', '2024-25'], wins: [30, 'Troy Grosenick', '2016-17'], shutouts: [10, 'Troy Grosenick', '2016-17'] },
  SPR: { points: [71, 'Adam Gaudette', '2023-24'], goals: [44, 'Adam Gaudette', '2023-24'], assists: [44, 'Sam Anas', '2021-22'], wins: [27, 'Joel Hofer', '2022-23'], shutouts: [5, 'Joel Hofer', '2022-23'] },
  SYR: { points: [84, 'Alex Barre-Boulet', '2022-23'], goals: [40, 'Lonny Bohonos', '1995-96'], assists: [60, 'Alex Barre-Boulet', '2022-23'], wins: [30, 'Corey Hirsch', '1997-98'], shutouts: [9, 'Jean-Francois Labbe', '2001-02'] },
  TEX: { points: [88, 'Travis Morin', '2013-14'], goals: [39, 'Matej Blumel', '2024-25'], assists: [56, 'Travis Morin', '2013-14'], wins: [28, 'Richard Bachman', '2010-11'], shutouts: [6, 'Richard Bachman', '2010-11'] },
  TOR_AHL: { points: [79, 'Tim Stapleton', '2008-09'], goals: [36, 'John Pohl', '2005-06'], assists: [57, 'Jeremy Bracco', '2018-19'], wins: [31, 'Garret Sparks', '2017-18'], shutouts: [6, 'Garret Sparks', '2017-18'] },
  TUC: { points: [85, 'Michael Carcone', '2022-23'], goals: [31, 'Michael Carcone', '2022-23'], assists: [54, 'Michael Carcone', '2022-23'], wins: [31, 'Matthew Villalta', '2023-24'], shutouts: [5, 'Adin Hill', '2017-18'] },
  UTI: { points: [67, 'Reid Boucher', '2019-20'], goals: [34, 'Reid Boucher', '2019-20'], assists: [51, 'Cal O\'Reilly', '2014-15'], wins: [25, 'Thatcher Demko', '2017-18'], shutouts: [5, 'Joacim Eriksson', '2013-14'] },
  WBS: { points: [82, 'Janne Pesonen', '2008-09'], goals: [34, 'Chris Minard', '2008-09'], assists: [50, 'Janne Pesonen', '2008-09'], wins: [35, 'Brad Thiessen', '2010-11'], shutouts: [12, 'Matt Murray', '2014-15'] },
};

/**
 * The QMJHL's eighteen clubs, from QuantHockey's single-season records for each
 * club, read in November 2026.
 *
 * QuantHockey keeps a club's seasons under the name it plays as now, with some
 * of its old names folded in and some not: Gatineau's book has the Hull years
 * in it, and Charlottetown's has the PEI Rocket's, but Acadie-Bathurst's starts
 * in Bathurst, without the Laval years that make Mario Lemieux's 282 points a
 * franchise record. Lemieux is in the league book either way.
 *
 * Where two men share a record the book keeps whoever set it first, as
 * everywhere else here. Where they set it in the same season, it keeps the one
 * QuantHockey lists first.
 */
export const QMJHL_CLUB_RECORDS = {
  BAT: { points: [124, 'Thomas Beauregard', '2006-07'], goals: [71, 'Thomas Beauregard', '2006-07'], assists: [80, 'Mathieu Perreault', '2007-08'], wins: [41, 'Adam Russo', '2001-02'], shutouts: [7, 'Adam Russo', '2002-03'] },
  BAC: { points: [135, 'Yanick Lehoux', '2000-01'], goals: [67, 'Yanick Lehoux', '2000-01'], assists: [80, 'Francois Bouchard', '2006-07'], wins: [36, 'Philippe Cadorette', '2013-14'], shutouts: [7, 'Philippe Cadorette', '2013-14'] },
  BLA: { points: [116, 'Alex Barre-Boulet', '2017-18'], goals: [53, 'Alex Barre-Boulet', '2017-18'], assists: [63, 'Alex Barre-Boulet', '2017-18'], wins: [33, 'Samuel Montembeault', '2014-15'], shutouts: [6, 'Samuel Montembeault', '2016-17'] },
  CBE: { points: [105, 'Dominic Noel', '2001-02'], goals: [53, 'Cam Fergus', '2006-07'], assists: [63, 'Dominic Noel', '2001-02'], wins: [35, 'Olivier Roy', '2008-09'], shutouts: [6, 'Martin Houle', '2004-05'] },
  CHA: { points: [110, 'Ben Duffy', '2012-13'], goals: [55, 'Patrick Guay', '2021-22'], assists: [71, 'Ben Duffy', '2012-13'], wins: [32, 'Matthew Welsh', '2018-19'], shutouts: [7, 'Colten Ellis', '2020-21'] },
  CHI: { points: [201, 'Marc Fortier', '1986-87'], goals: [80, 'Sylvain Locas', '1975-76'], assists: [135, 'Marc Fortier', '1986-87'], wins: [40, 'Daniel Berthiaume', '1984-85'], shutouts: [6, 'Felix Potvin', '1990-91'] },
  DRU: { points: [163, 'Daniel Briere', '1995-96'], goals: [79, 'Rene Corbet', '1992-93'], assists: [96, 'Ian Laperriere', '1992-93'], wins: [35, 'Olivier Rodrigue', '2018-19'], shutouts: [6, 'Louis-Philippe Guindon', '2013-14'] },
  GAT: { points: [191, 'Guy Rouleau', '1985-86'], goals: [91, 'Guy Rouleau', '1985-86'], assists: [123, 'Luc Robitaille', '1985-86'], wins: [34, 'Roberto Romano', '1981-82'], shutouts: [6, 'Ryan Mior', '2007-08'] },
  HAL: { points: [140, 'Jordan Dumais', '2022-23'], goals: [71, 'Ladislav Nagy', '1998-99'], assists: [86, 'Jordan Dumais', '2022-23'], wins: [45, 'Zachary Fucale', '2012-13'], shutouts: [6, 'Zachary Fucale', '2013-14'] },
  MON: { points: [129, 'Conor Garland', '2014-15'], goals: [53, 'Sebastien Roger', '1997-98'], assists: [94, 'Conor Garland', '2014-15'], wins: [43, 'Nicola Riopel', '2008-09'], shutouts: [6, 'Simon Lajeunesse', '1999-00'] },
  QUE: { points: [152, 'Alexander Radulov', '2005-06'], goals: [61, 'Alexander Radulov', '2005-06'], assists: [91, 'Alexander Radulov', '2005-06'], wins: [40, 'Maxime Ouellet', '1998-99'], shutouts: [6, 'Charles Lavigne', '2008-09'] },
  RIM: { points: [186, 'Brad Richards', '1999-00'], goals: [71, 'Brad Richards', '1999-00'], assists: [115, 'Brad Richards', '1999-00'], wins: [38, 'Sebastien Caron', '1999-00'], shutouts: [6, 'Colten Ellis', '2017-18'] },
  ROU: { points: [167, 'Mike Ribeiro', '1998-99'], goals: [67, 'Mike Ribeiro', '1998-99'], assists: [100, 'Mike Ribeiro', '1998-99'], wins: [35, 'Jean-Philippe Levasseur', '2005-06'], shutouts: [8, 'William Rousseau', '2023-24'] },
  SJD: { points: [116, 'William Dufour', '2021-22'], goals: [56, 'William Dufour', '2021-22'], assists: [70, 'Josh Lawrence', '2021-22'], wins: [37, 'Mathieu Corbeil', '2011-12'], shutouts: [6, 'Mathieu Corbeil', '2011-12'] },
  SHA: { points: [200, 'Patrice Lefebvre', '1987-88'], goals: [94, 'Stephan Lebeau', '1987-88'], assists: [136, 'Patrice Lefebvre', '1987-88'], wins: [42, 'Frederic Cloutier', '2000-01'], shutouts: [6, 'Frederic Cloutier', '2000-01'] },
  SHE: { points: [119, 'Joshua Roy', '2021-22'], goals: [51, 'Xavier Parent', '2021-22'], assists: [68, 'Joshua Roy', '2021-22'], wins: [33, 'Samuel Hlavaj', '2019-20'], shutouts: [5, 'Samuel St-Hilaire', '2023-24'] },
  VDO: { points: [184, 'Simon Gamache', '2000-01'], goals: [74, 'Simon Gamache', '2000-01'], assists: [110, 'Simon Gamache', '2000-01'], wins: [39, 'Etienne Montpetit', '2015-16'], shutouts: [7, 'Roberto Luongo', '1997-98'] },
  VIC: { points: [150, 'Marc-Andre Thinel', '2000-01'], goals: [70, 'Claude Savoie', '1992-93'], assists: [92, 'Alexandre Daigle', '1992-93'], wins: [35, 'Kevin Poulin', '2009-10'], shutouts: [7, 'Kevin Poulin', '2009-10'] },
};

/**
 * Every other league with a club book: the European leagues, the ECHL, the
 * SPHL and the USHL, from QuantHockey's single-season records for each club,
 * read in November 2026.
 *
 * QuantHockey's tables go back as far as each league's own note says, and a
 * club's book is everything it has done under the name it plays as now, along
 * with whichever older names QuantHockey folds into it. Goaltending wins and
 * shutouts are thinner the further back you go, because older seasons often
 * didn't record them.
 *
 * Where two men share a record the book keeps whoever set it first, as
 * everywhere else here. Clubs new to their league have books a season or two
 * deep, which is honest: there isn't any more history to read.
 */
/** The SHL's fourteen, back to 1975-76. Björklöven's goaltending wins aren't in QuantHockey's tables for its old SHL years. */
export const SHL_CLUB_RECORDS = {
  LHF: { points: [58, 'Linus Omark', '2021-22'], goals: [30, 'Lars-Gunnar Pettersson', '1990-91'], assists: [40, 'Stefan Nilsson', '1991-92'], wins: [30, 'Joel Lassinantti', '2018-19'], shutouts: [6, 'Jarmo Myllys', '1995-96'] },
  SAIK: { points: [71, 'Bud Holloway', '2012-13'], goals: [33, 'Martin Karlsson', '1977-78'], assists: [51, 'Bud Holloway', '2012-13'], wins: [31, 'Strauss Mann', '2025-26'], shutouts: [10, 'Strauss Mann', '2025-26'] },
  FBK: { points: [76, 'Håkan Loob', '1982-83'], goals: [42, 'Håkan Loob', '1982-83'], assists: [42, 'Marcus Nilsson', '2019-20'], wins: [25, 'Alexander Salak', '2012-13'], shutouts: [7, 'Alexander Salak', '2010-11'] },
  FHC: { points: [67, 'Kristian Huselius', '2000-01'], goals: [33, 'Magnus Kahnberg', '2003-04'], assists: [53, 'Ryan Lasch', '2021-22'], wins: [27, 'Lars Johansson', '2015-16'], shutouts: [7, 'Henrik Lundqvist', '2003-04'] },
  VHK: { points: [56, 'Elias Pettersson', '2017-18'], goals: [24, 'Elias Pettersson', '2017-18'], assists: [38, 'Lukas Elvenes', '2025-26'], wins: [25, 'Viktor Fasth', '2017-18'], shutouts: [8, 'Emil Larmi', '2022-23'] },
  RBK: { points: [50, 'Daniel Zaar', '2020-21'], goals: [28, 'Tomas Srsen', '1993-94'], assists: [37, 'Kodie Curran', '2019-20'], wins: [23, 'Roman Will', '2019-20'], shutouts: [5, 'Christoffer Rifalk', '2023-24'] },
  MIF: { points: [56, 'Juha Riihijärvi', '1999-00'], goals: [27, 'Juha Riihijärvi', '1996-97'], assists: [36, 'Juha Riihijärvi', '1999-00'], wins: [23, 'Oscar Ahlsenfelt', '2018-19'], shutouts: [9, 'Oscar Ahlsenfelt', '2016-17'] },
  LHC: { points: [71, 'Pär Arlbrandt', '2013-14'], goals: [35, 'Mattias Weinhandl', '2007-08'], assists: [50, 'Tony Mårtensson', '2007-08'], wins: [21, 'Marcus Högberg', '2023-24'], shutouts: [9, 'Fredrik Norrena', '2003-04'] },
  OHK: { points: [60, 'Derek Ryan', '2014-15'], goals: [24, 'Martin Johansson', '2014-15'], assists: [45, 'Derek Ryan', '2014-15'], wins: [26, 'Julius Hudacek', '2014-15'], shutouts: [6, 'Eero Kilpeläinen', '2017-18'] },
  TIK: { points: [55, 'Jonathan Dahlen', '2025-26'], goals: [30, 'Jonathan Dahlen', '2025-26'], assists: [31, 'Henrik Zetterberg', '2000-01'], wins: [24, 'Jacob Johansson', '2022-23'], shutouts: [8, 'Kimmo Kapanen', '2003-04'] },
  HV71: { points: [59, 'Kai Nurminen', '1995-96'], goals: [34, 'Kai Nurminen', '1995-96'], assists: [46, 'Johan Davidsson', '2009-10'], wins: [29, 'Gustaf Wesslau', '2012-13'], shutouts: [7, 'Gustaf Wesslau', '2012-13'] },
  BIF: { points: [59, 'Jan Larsson', '1998-99'], goals: [40, 'Tom Bissett', '1998-99'], assists: [43, 'Per Djoos', '1998-99'], wins: [21, 'Veini Vehviläinen', '2021-22'], shutouts: [6, 'Robert Kristan', '2006-07'] },
  DIF: { points: [64, 'Fredrik Bremberg', '2006-07'], goals: [30, 'Patric Kjellberg', '1997-98'], assists: [41, 'Fredrik Bremberg', '2006-07'], wins: [24, 'Adam Reideborn', '2018-19'], shutouts: [6, 'Daniel Larsson', '2007-08'] },
  BJO: { points: [48, 'Mikael Andersson', '1987-88'], goals: [30, 'Tore Öqvist', '1985-86'], assists: [26, 'Mikael Andersson', '1987-88'], shutouts: [2, 'Göte Wälitalo', '1980-81'] },
};

/** The Liiga's seventeen, back to the 1970s for the clubs that were there, the last years of the old SM-sarja included. Kiekko-Espoo's book starts in 2024-25, when the new club took the place. */
export const LIIGA_CLUB_RECORDS = {
  TAP: { points: [77, 'Benjamin Rautiainen', '2025-26'], goals: [36, 'Martti Jarkko', '1976-77'], assists: [52, 'Benjamin Rautiainen', '2025-26'], wins: [30, 'Jussi Markkanen', '2000-01'], shutouts: [13, 'Juha Metsola', '2013-14'] },
  ILK: { points: [81, 'Raimo Summanen', '1988-89'], goals: [45, 'Raimo Summanen', '1982-83'], assists: [46, 'Pekka Järvelä', '1988-89'], wins: [30, 'Jukka Tammi', '1987-88'], shutouts: [8, 'Marek Langhamer', '2022-23'] },
  HIFK: { points: [87, 'Matti Hagman', '1979-80'], goals: [38, 'Jan Caloun', '1999-00'], assists: [57, 'Jan Caloun', '1998-99'], wins: [28, 'Sakari Lindfors', '1987-88'], shutouts: [8, 'Dave Stathos', '2003-04'] },
  KAR: { points: [93, 'Kari Jalonen', '1986-87'], goals: [34, 'Janne Pesonen', '2007-08'], assists: [64, 'Kari Jalonen', '1986-87'], wins: [32, 'Niklas Bäckström', '2005-06'], shutouts: [10, 'Niklas Bäckström', '2005-06'] },
  TPS: { points: [78, 'Kai Nurminen', '1999-00'], goals: [47, 'Arto Javanainen', '1987-88'], assists: [56, 'Kari Jalonen', '1988-89'], wins: [31, 'Jouni Rokama', '1993-94'], shutouts: [7, 'Lassi Lehtinen', '2022-23'] },
  LUK: { points: [72, 'Juha Riihijärvi', '1995-96'], goals: [36, 'Jouni Rinne', '1975-76'], assists: [51, 'Esa Keskinen', '1990-91'], wins: [30, 'Ryan Zapolski', '2013-14'], shutouts: [10, 'Ryan Zapolski', '2015-16'] },
  KAL: { points: [60, 'Darius Rusnak', '1990-91'], goals: [30, 'Matyas Kantner', '2024-25'], assists: [42, 'Jouni Rinne', '1988-89'], wins: [23, 'Ari Ahonen', '2010-11'], shutouts: [7, 'Mikko Koskinen', '2012-13'] },
  PEL: { points: [62, 'Ryan Lasch', '2011-12'], goals: [41, 'Erkki Laine', '1982-83'], assists: [45, 'Ryan Lasch', '2023-24'], wins: [26, 'Antti Niemi', '2007-08'], shutouts: [7, 'Patrik Bartosak', '2025-26'] },
  KOO: { points: [57, 'Malte Strömwall', '2018-19'], goals: [30, 'Malte Strömwall', '2018-19'], assists: [35, 'Matt Caito', '2019-20'], wins: [25, 'Henrik Haukeland', '2019-20'], shutouts: [8, 'Henrik Haukeland', '2019-20'] },
  HPK: { points: [73, 'Teppo Kivelä', '1990-91'], goals: [30, 'Tomas Kapusta', '1992-93'], assists: [51, 'Igor Kuznetsov', '1989-90'], wins: [28, 'Kimmo Kapanen', '1999-00'], shutouts: [8, 'Teemu Lassila', '2008-09'] },
  JYP: { points: [71, 'Pekka Järvelä', '1986-87'], goals: [41, 'Risto Kurkinen', '1986-87'], assists: [54, 'Pekka Järvelä', '1986-87'], wins: [26, 'Ari-Pekka Siekkinen', '1991-92'], shutouts: [9, 'Joni Myllykoski', '2010-11'] },
  SAI: { points: [66, 'Maxime Fortier', '2025-26'], goals: [29, 'Vladimir Machulda', '2000-01'], assists: [47, 'Otto Kivenmäki', '2025-26'], wins: [21, 'Jussi Markkanen', '1997-98'], shutouts: [5, 'Jussi Markkanen', '2013-14'] },
  JUK: { points: [59, 'Petrus Palmu', '2021-22'], goals: [26, 'Petrus Palmu', '2021-22'], assists: [33, 'Miika Koivisto', '2016-17'], wins: [29, 'Oskari Salminen', '2021-22'], shutouts: [9, 'Oskari Salminen', '2021-22'] },
  SPO: { points: [63, 'Atro Leppänen', '2024-25'], goals: [22, 'Roope Talaja', '2018-19'], assists: [48, 'Simon Hjalmarsson', '2024-25'], wins: [19, 'Mika Järvinen', '2015-16'], shutouts: [7, 'Mika Järvinen', '2015-16'] },
  ASS: { points: [72, 'Veli-Pekka Ketola', '1978-79'], goals: [44, 'Arto Javanainen', '1985-86'], assists: [49, 'Veli-Pekka Ketola', '1978-79'], wins: [26, 'Juuso Riksman', '2005-06'], shutouts: [9, 'Juuso Riksman', '2005-06'] },
  AKH: { points: [41, 'Cameron Hillis', '2024-25'], goals: [19, 'Peter Quenneville', '2024-25'], assists: [29, 'Iikka Kangasniemi', '2025-26'], wins: [16, 'Petteri Rimpinen', '2024-25'], shutouts: [5, 'Petteri Rimpinen', '2025-26'] },
  JOK: { points: [77, 'Ville Leino', '2007-08'], goals: [41, 'Timo Turunen', '1972-73'], assists: [51, 'Timo Sutinen', '1973-74'], wins: [34, 'Tim Thomas', '2004-05'], shutouts: [15, 'Tim Thomas', '2004-05'] },
};

/** The KHL's twenty-two, which only go back to 2008-09, the league's first season. Kunlun's book is the Shanghai Dragons' now. */
export const KHL_CLUB_RECORDS = {
  CSKA: { points: [71, 'Alexander Radulov', '2014-15'], goals: [33, 'Kirill Kaprizov', '2019-20'], assists: [47, 'Alexander Radulov', '2014-15'], wins: [28, 'Ilya Sorokin', '2018-19'], shutouts: [11, 'Ilya Sorokin', '2018-19'] },
  SKA: { points: [82, 'Nikita Gusev', '2018-19'], goals: [40, 'Dmitri Jaskin', '2022-23'], assists: [65, 'Nikita Gusev', '2018-19'], wins: [30, 'Dmitry Nikolayev', '2022-23'], shutouts: [10, 'Igor Shesterkin', '2018-19'] },
  DYN: { points: [89, 'Nikita Gusev', '2023-24'], goals: [38, 'Dmitri Jaskin', '2020-21'], assists: [66, 'Nikita Gusev', '2023-24'], wins: [26, 'Ivan Bocharov', '2019-20'], shutouts: [9, 'Alexander Yeremenko', '2016-17'] },
  LOK: { points: [61, 'Pavol Demitra', '2010-11'], goals: [30, 'Maxim Shalunov', '2025-26'], assists: [43, 'Pavol Demitra', '2010-11'], wins: [32, 'Daniil Isaev', '2023-24'], shutouts: [13, 'Alexei Murygin', '2015-16'] },
  SPA: { points: [78, 'Nikolai Goldobin', '2023-24'], goals: [37, 'Nikolai Goldobin', '2023-24'], assists: [41, 'Nikolai Goldobin', '2023-24'], wins: [23, 'Dominik Hasek', '2010-11'], shutouts: [7, 'Dominik Hasek', '2010-11'] },
  SEV: { points: [62, 'Kirill Pilipenko', '2023-24'], goals: [32, 'Kirill Pilipenko', '2023-24'], assists: [37, 'Vadim Shipachev', '2011-12'], wins: [25, 'Vladislav Podyapolsky', '2020-21'], shutouts: [8, 'Vasily Koshechkin', '2012-13'] },
  TOR: { points: [61, 'Damir Zhafyarov', '2020-21'], goals: [35, 'Pavel Brendl', '2008-09'], assists: [40, 'Damir Zhafyarov', '2020-21'], wins: [25, 'Denis Kostin', '2025-26'], shutouts: [7, 'Ilya Proskuryakov', '2016-17'] },
  SOC: { points: [45, 'Artur Tyanulin', '2023-24'], goals: [22, 'André Petersson', '2015-16'], assists: [30, 'Artur Tyanulin', '2024-25'], wins: [24, 'Konstantin Barulin', '2015-16'], shutouts: [5, 'Magnus Hellberg', '2021-22'] },
  MIN: { points: [89, 'Sam Anas', '2025-26'], goals: [32, 'Sam Anas', '2025-26'], assists: [57, 'Sam Anas', '2025-26'], wins: [28, 'Ben Scrivens', '2016-17'], shutouts: [8, 'Ben Scrivens', '2016-17'] },
  AKB: { points: [71, 'Alexei Morozov', '2008-09'], goals: [35, 'Dmitri Jaskin', '2024-25'], assists: [39, 'Alexei Morozov', '2008-09'], wins: [30, 'Timur Bilyalov', '2023-24'], shutouts: [8, 'Timur Bilyalov', '2019-20'] },
  AVA: { points: [78, 'Reid Boucher', '2023-24'], goals: [44, 'Reid Boucher', '2023-24'], assists: [55, 'Vladimir Tkachyov', '2023-24'], wins: [35, 'Nikita Serebryakov', '2025-26'], shutouts: [8, 'Dominik Furch', '2015-16'] },
  MET: { points: [85, 'Sergei Mozyakin', '2016-17'], goals: [48, 'Sergei Mozyakin', '2016-17'], assists: [58, 'Vladimir Tkachyov', '2025-26'], wins: [32, 'Vasily Koshechkin', '2014-15'], shutouts: [9, 'Vasily Koshechkin', '2013-14'] },
  SAL: { points: [80, 'Alexander Radulov', '2010-11'], goals: [49, 'Josh Leivo', '2024-25'], assists: [60, 'Alexander Radulov', '2010-11'], wins: [29, 'Niklas Svedberg', '2015-16'], shutouts: [7, 'Juha Metsola', '2019-20'] },
  TRA: { points: [67, 'Maxim Shabanov', '2024-25'], goals: [27, 'Vitaly Kravtsov', '2024-25'], assists: [44, 'Maxim Shabanov', '2024-25'], wins: [29, 'Michael Garnett', '2011-12'], shutouts: [9, 'Zachary Fucale', '2024-25'] },
  AVT: { points: [69, 'Nigel Dawes', '2018-19'], goals: [36, 'Brooks Macek', '2022-23'], assists: [43, 'Stephane Da Costa', '2024-25'], wins: [38, 'Jakub Kovar', '2018-19'], shutouts: [8, 'Jakub Kovar', '2014-15'] },
  SIB: { points: [58, 'Trevor Murphy', '2024-25'], goals: [29, 'Alexander Sharov', '2022-23'], assists: [45, 'Trevor Murphy', '2024-25'], wins: [26, 'Alexander Salak', '2015-16'], shutouts: [6, 'Alexander Salak', '2015-16'] },
  NEF: { points: [50, 'Dan Sexton', '2016-17'], goals: [27, 'Andrei Belozyorov', '2025-26'], assists: [37, 'Dan Sexton', '2016-17'], wins: [23, 'Ilya Ezhov', '2017-18'], shutouts: [7, 'Ilya Ezhov', '2017-18'] },
  AMU: { points: [51, 'Jakub Petruzalek', '2011-12'], goals: [22, 'Jakub Petruzalek', '2011-12'], assists: [29, 'Jakub Petruzalek', '2011-12'], wins: [28, 'Juha Metsola', '2017-18'], shutouts: [7, 'Juha Metsola', '2016-17'] },
  ADM: { points: [53, 'Daniil Gutik', '2024-25'], goals: [26, 'Daniil Gutik', '2024-25'], assists: [29, 'Libor Sulak', '2025-26'], wins: [20, 'Ivan Nalimov', '2015-16'], shutouts: [5, 'Igor Bobkov', '2016-17'] },
  BAR: { points: [62, 'Nigel Dawes', '2016-17'], goals: [36, 'Nigel Dawes', '2016-17'], assists: [41, 'Brandon Bochenski', '2015-16'], wins: [25, 'Henrik Karlsson', '2016-17'], shutouts: [7, 'Henrik Karlsson', '2016-17'] },
  KUN: { points: [45, 'Nicholas Merkley', '2025-26'], goals: [24, 'Nicholas Merkley', '2025-26'], assists: [31, 'Zach Leslie', '2022-23'], wins: [16, 'Magnus Hellberg', '2017-18'], shutouts: [6, 'Magnus Hellberg', '2017-18'] },
  LAD: { points: [45, 'Riley Sawchuk', '2025-26'], goals: [23, 'Riley Sawchuk', '2025-26'], assists: [24, 'Dmitri Kugryshev', '2025-26'], wins: [19, 'Vasily Koshechkin', '2008-09'], shutouts: [8, 'Vasily Koshechkin', '2008-09'] },
};

/** The National League's fourteen, from the mid-1980s on. */
export const SWISS_CLUB_RECORDS = {
  ZSC: { points: [67, 'Randy Robitaille', '2004-05'], goals: [30, 'Pius Suter', '2019-20'], assists: [45, 'Randy Robitaille', '2004-05'], wins: [30, 'Simon Hrubec', '2023-24'], shutouts: [7, 'Lukas Flüeler', '2013-14'] },
  BERN: { points: [82, 'Gates Orlando', '1996-97'], goals: [27, 'Alan Haworth', '1990-91'], assists: [56, 'Gates Orlando', '1996-97'], wins: [34, 'Marco Bührer', '2007-08'], shutouts: [10, 'Leonardo Genoni', '2018-19'] },
  DAV: { points: [69, 'Ken Yaremchuk', '1996-97'], goals: [37, 'Michel Riesen', '2006-07'], assists: [44, 'Joe Thornton', '2004-05'], wins: [35, 'Leonardo Genoni', '2010-11'], shutouts: [8, 'Jonas Hiller', '2004-05'] },
  ZUG: { points: [71, 'Ken Yaremchuk', '1994-95'], goals: [41, 'Bill McDougall', '1996-97'], assists: [55, 'Pierre-Marc Bouchard', '2015-16'], wins: [29, 'Lars Weibel', '2006-07'], shutouts: [7, 'Tobias Stephan', '2016-17'] },
  LUG: { points: [72, 'Ville Peltonen', '2003-04'], goals: [33, 'Fredrik Pettersson', '2014-15'], assists: [49, 'Randy Robitaille', '2009-10'], wins: [30, 'Ronnie Rüeger', '2003-04'], shutouts: [6, 'Cristobal Huet', '2000-01'] },
  FRI: { points: [86, 'Andrei Khomutov', '1994-95'], goals: [41, 'Andrei Khomutov', '1994-95'], assists: [51, 'Vyacheslav Bykov', '1991-92'], wins: [28, 'Reto Berra', '2021-22'], shutouts: [6, 'Cristobal Huet', '2011-12'] },
  GEN: { points: [72, 'Juraj Kolnik', '2008-09'], goals: [28, 'Teemu Hartikainen', '2022-23'], assists: [48, 'Henrik Tömmernes', '2021-22'], wins: [31, 'Gianluca Mona', '2007-08'], shutouts: [6, 'Tobias Stephan', '2011-12'] },
  LAU: { points: [57, 'Dustin Jeffrey', '2017-18'], goals: [25, 'Nicklas Danielsson', '2017-18'], assists: [44, 'Dustin Jeffrey', '2017-18'], wins: [29, 'Kevin Pasche', '2024-25'], shutouts: [9, 'Kevin Pasche', '2024-25'] },
  BIE: { points: [61, 'Ravil Yudashev', '1992-93'], goals: [41, 'Ravil Yudashev', '1992-93'], assists: [31, 'Marc-Antoine Pouliot', '2012-13'], wins: [24, 'Jonas Hiller', '2017-18'], shutouts: [7, 'Reto Berra', '2011-12'] },
  AMB: { points: [93, 'Oleg Petrov', '1997-98'], goals: [38, 'Paul DiPietro', '1998-99'], assists: [63, 'Oleg Petrov', '1997-98'], wins: [21, 'Thomas Bäumle', '2007-08'], shutouts: [7, 'Pauli Jaks', '1998-99'] },
  RAP: { points: [65, 'Mike Richard', '1995-96'], goals: [27, 'Mike Richard', '1995-96'], assists: [46, 'Stacy Roest', '2008-09'], wins: [26, 'Melvin Nyffeler', '2021-22'], shutouts: [5, 'Daniel Manzato', '2009-10'] },
  SCL: { points: [69, 'Josh Holden', '2007-08'], goals: [26, 'Josh Holden', '2007-08'], assists: [43, 'Josh Holden', '2007-08'], wins: [22, 'Matthias Schoder', '2008-09'], shutouts: [6, 'Damiano Ciaccio', '2018-19'] },
  KLO: { points: [77, 'Kent Nilsson', '1990-91'], goals: [37, 'Kent Nilsson', '1990-91'], assists: [44, 'Kimmo Rintanen', '2008-09'], wins: [32, 'Ronnie Rüeger', '2008-09'], shutouts: [8, 'Ronnie Rüeger', '2011-12'] },
  AJO: { points: [52, 'Julius Nättinen', '2024-25'], goals: [22, 'Lane Lambert', '1992-93'], assists: [34, 'Philip-Michael Devos', '2022-23'], wins: [8, 'Tim Wolf', '2021-22'], shutouts: [3, 'Benjamin Conz', '2024-25'] },
};

/** The DEL's fourteen, back to the league's first season in 1994-95. */
export const DEL_CLUB_RECORDS = {
  BER: { points: [85, 'Steve Walker', '2007-08'], goals: [37, 'Ty Ronning', '2024-25'], assists: [58, 'Steve Walker', '2007-08'], wins: [35, 'Rob Zepp', '2009-10'], shutouts: [6, 'Rich Shulmistra', '2001-02'] },
  RBM: { points: [64, 'Keith Aucoin', '2017-18'], goals: [28, 'Trevor Parkes', '2019-20'], assists: [53, 'Keith Aucoin', '2017-18'], wins: [29, 'Mathias Niederberger', '2022-23'], shutouts: [5, 'Danny Aus den Birken', '2018-19'] },
  MAN: { points: [74, 'Jan Alston', '1999-00'], goals: [32, 'Jan Alston', '1998-99'], assists: [46, 'Pavel Gross', '1996-97'], wins: [28, 'Dennis Endras', '2014-15'], shutouts: [7, 'Mike Rosati', '2001-02'] },
  KOL: { points: [81, 'Sergei Berezin', '1995-96'], goals: [50, 'Sergei Berezin', '1995-96'], assists: [50, 'Dave McLlwain', '2005-06'], wins: [33, 'Joseph Heiß', '1995-96'], shutouts: [5, 'Chris Rogles', '2001-02'] },
  ING: { points: [73, 'Thomas Greilinger', '2009-10'], goals: [38, 'Thomas Greilinger', '2009-10'], assists: [42, 'Bob Wren', '2009-10'], wins: [29, 'Timo Pielmeier', '2014-15'], shutouts: [8, 'Jim Waite', '2003-04'] },
  STR: { points: [68, 'Jason Akeson', '2021-22'], goals: [30, 'Eric Chouinard', '2007-08'], assists: [44, 'Jason Akeson', '2021-22'], wins: [27, 'Henrik Haukeland', '2025-26'], shutouts: [4, 'Jeff Zatkoff', '2018-19'] },
  WOL: { points: [64, 'Jason Ulmer', '2008-09'], goals: [31, 'Matt Dzieduszycki', '2012-13'], assists: [47, 'Jason Ulmer', '2008-09'], wins: [28, 'Dustin Strahlmeier', '2021-22'], shutouts: [7, 'Daniar Dshunussow', '2011-12'] },
  BRE: { points: [57, 'Ziga Jeglic', '2021-22'], goals: [27, 'Jack Combs', '2016-17'], assists: [42, 'Ziga Jeglic', '2021-22'], wins: [31, 'Kristers Gudlevskis', '2023-24'], shutouts: [5, 'Kristers Gudlevskis', '2024-25'] },
  NUR: { points: [70, 'Steven Reinprecht', '2013-14'], goals: [41, 'Ahren Spylo', '2007-08'], assists: [49, 'Evan Barratt', '2025-26'], wins: [28, 'Niklas Treutle', '2019-20'], shutouts: [5, 'Andrei Mezin', '1998-99'] },
  AUG: { points: [78, 'Sergei Vostrikov', '2000-01'], goals: [36, 'Sergei Vostrikov', '1999-00'], assists: [51, 'Peter Larsson', '1999-00'], wins: [24, 'Dennis Endras', '2008-09'], shutouts: [6, 'Dennis Endras', '2008-09'] },
  SWW: { points: [67, 'Mark MacKay', '1995-96'], goals: [40, 'Andrei Kovalev', '1994-95'], assists: [43, 'Rich Chernomaz', '1995-96'], wins: [25, 'Joacim Eriksson', '2023-24'], shutouts: [4, 'Stephane Beauregard', '1999-00'] },
  FRA: { points: [58, 'Carter Rowney', '2022-23'], goals: [24, 'Dominik Bokk', '2022-23'], assists: [37, 'Carter Rowney', '2022-23'], wins: [22, 'Jake Hildebrand', '2022-23'], shutouts: [2, 'Mirko Pantkowski', '2025-26'] },
  ISE: { points: [87, 'Robert Hock', '2007-08'], goals: [44, 'Michael Wolf', '2007-08'], assists: [63, 'Robert Hock', '2007-08'], wins: [25, 'Sebastien Caron', '2011-12'], shutouts: [6, 'Jim Waite', '2002-03'] },
  KEV: { points: [75, 'Brad Purdie', '2001-02'], goals: [37, 'Chris Lindberg', '1996-97'], assists: [45, 'Adam Courchaine', '2013-14'], wins: [29, 'Scott Langkow', '2012-13'], shutouts: [8, 'Scott Langkow', '2010-11'] },
};

/** The Extraliga's fourteen, back to 1993-94, the first season after the split. */
export const CZECH_CLUB_RECORDS = {
  SPA: { points: [73, 'Roman Horak', '1996-97'], goals: [35, 'Petr Ton', '2013-14'], assists: [52, 'Roman Horak', '1996-97'], wins: [33, 'Petr Briza', '1999-00'], shutouts: [11, 'Tomas Pöpperle', '2013-14'] },
  TRI: { points: [83, 'Martin Ruzicka', '2012-13'], goals: [40, 'Martin Ruzicka', '2012-13'], assists: [53, 'Richard Kral', '1999-00'], wins: [30, 'Simon Hrubec', '2018-19'], shutouts: [7, 'Marek Novotny', '1999-00'] },
  PCE: { points: [60, 'Roman Cervenka', '2025-26'], goals: [37, 'Petr Sykora', '2006-07'], assists: [41, 'Roman Cervenka', '2025-26'], wins: [35, 'Adam Svoboda', '2002-03'], shutouts: [7, 'Adam Svoboda', '2002-03'] },
  KOM: { points: [64, 'Peter Mueller', '2020-21'], goals: [29, 'Martin Zatovic', '2019-20'], assists: [39, 'Petr Holik', '2020-21'], wins: [29, 'Marek Ciliak', '2014-15'], shutouts: [6, 'Marek Ciliak', '2017-18'] },
  VIT: { points: [64, 'David Moravec', '1997-98'], goals: [38, 'David Moravec', '1997-98'], assists: [35, 'Alexander Prokopiev', '1997-98'], wins: [29, 'Roman Malek', '2010-11'], shutouts: [8, 'Martin Prusek', '1996-97'] },
  LIB: { points: [62, 'Tomas Filippi', '2023-24'], goals: [31, 'Libor Hudacek', '2019-20'], assists: [41, 'Petr Nedved', '2010-11'], wins: [32, 'Roman Will', '2018-19'], shutouts: [7, 'Roman Will', '2016-17'] },
  MHK: { points: [50, 'Tomas Mertl', '2014-15'], goals: [25, 'Jiri Simanek', '2013-14'], assists: [36, 'Jaroslav Bednár', '2016-17'], wins: [28, 'Pavel Kantor', '2013-14'], shutouts: [9, 'Stanislav Skorvanek', '2025-26'] },
  PLZ: { points: [76, 'Milan Gulas', '2019-20'], goals: [35, 'Milan Gulas', '2019-20'], assists: [44, 'Martin Straka', '2010-11'], wins: [33, 'Miroslav Svoboda', '2017-18'], shutouts: [9, 'Dusan Salficky', '1999-00'] },
  KVA: { points: [57, 'Lukas Pech', '2012-13'], goals: [30, 'Ondrej Beranek', '2024-25'], assists: [35, 'Lukas Pech', '2012-13'], wins: [27, 'Lukas Mensator', '2008-09'], shutouts: [5, 'Petr Franek', '2002-03'] },
  MBL: { points: [52, 'David Stastny', '2020-21'], goals: [26, 'David Stastny', '2020-21'], assists: [28, 'David Vyborny', '2014-15'], wins: [26, 'David Rittich', '2015-16'], shutouts: [5, 'David Rittich', '2015-16'] },
  LIT: { points: [60, 'Tomas Vlasak', '1996-97'], goals: [27, 'Robert Kysela', '1995-96'], assists: [37, 'Viktor Hübl', '2014-15'], wins: [34, 'Pavel Francouz', '2014-15'], shutouts: [7, 'Zdenek Orct', '1998-99'] },
  OLO: { points: [46, 'David Krejcí', '2021-22'], goals: [22, 'Zbynek Irgl', '2018-19'], assists: [26, 'Jan Kana', '2021-22'], wins: [24, 'Branislav Konrad', '2015-16'], shutouts: [7, 'Pavel Cagas', '1994-95'] },
  CBU: { points: [58, 'Radek Toupal', '1997-98'], goals: [30, 'Vaclav Kral', '1998-99'], assists: [43, 'Radek Toupal', '1998-99'], wins: [29, 'Roman Turek', '2007-08'], shutouts: [7, 'Oldrich Svoboda', '1995-96'] },
  KLA: { points: [75, 'Pavel Patera', '1994-95'], goals: [35, 'Martin Procházka', '2006-07'], assists: [49, 'Pavel Patera', '1994-95'], wins: [25, 'Zdenek Orct', '2004-05'], shutouts: [4, 'Milan Hnilicka', '1996-97'] },
};

/** The Slovak Extraliga's twelve, scoring only. QuantHockey's goaltending tables for Slovakia are missing their older wins and carry shutout totals that can't be right, the same reason the league book has none. */
export const SLOVAK_CLUB_RECORDS = {
  SLO: { points: [63, 'Lubomir Kolnik', '1996-97'], goals: [41, 'Jan Plch', '2003-04'], assists: [40, 'Michal Hreus', '1999-00'] },
  KOS: { points: [74, 'Vlastimil Plavucha', '1996-97'], goals: [35, 'Vlastimil Plavucha', '1994-95'], assists: [44, 'Michal Chovan', '2020-21'] },
  ZVO: { points: [79, 'Jan Plch', '2000-01'], goals: [43, 'Vlastimil Plavucha', '1999-00'], assists: [50, 'Peter Klouda', '2007-08'] },
  POP: { points: [69, 'Marcel Hascak', '2020-21'], goals: [38, 'Marcel Hascak', '2020-21'], assists: [49, 'Andrew Calof', '2024-25'] },
  NIT: { points: [67, 'Jozef Stumpel', '2013-14'], goals: [41, 'Samuel Bucek', '2021-22'], assists: [51, 'Jozef Stumpel', '2013-14'] },
  BBY: { points: [72, 'Eric Faille', '2018-19'], goals: [32, 'Carter Turnbull', '2025-26'], assists: [48, 'Eric Faille', '2018-19'] },
  DUC: { points: [58, 'Jordan Martel', '2025-26'], goals: [31, 'Renars Krastenbergs', '2024-25'], assists: [43, 'Kaspars Daugavins', '2023-24'] },
  ZIL: { points: [60, 'Marek Hovorka', '2016-17'], goals: [37, 'Roman Tomas', '2013-14'], assists: [39, 'Peter Klouda', '2013-14'] },
  SNV: { points: [59, 'Olivier Archambault', '2023-24'], goals: [29, 'Vladimir Svitek', '1996-97'], assists: [45, 'Olivier Archambault', '2023-24'] },
  LMI: { points: [57, 'Marek Uram', '1996-97'], goals: [28, 'Marek Uram', '1996-97'], assists: [40, 'Petr Vlk', '1999-00'] },
  TRE: { points: [86, 'Jan Pardavy', '1996-97'], goals: [42, 'Jan Pardavy', '1996-97'], assists: [54, 'Pavol Demitra', '2004-05'] },
  PRE: { points: [59, 'Maxwell Gerlach', '2022-23'], goals: [34, 'Maxwell Gerlach', '2022-23'], assists: [30, 'Abbot Girduckis', '2022-23'] },
};

/** The ICE Hockey League's clubs, back to the mid-1990s for the Austrian ones. Ferencváros joined in 2025-26, so its book is one season deep, and Milano, new this season, has none yet. */
export const ICEHL_CLUB_RECORDS = {
  RBS: { points: [74, 'Thomas Koch', '2006-07'], goals: [33, 'Brett Sterling', '2015-16'], assists: [49, 'John Hughes', '2015-16'], wins: [27, 'Jordan Parise', '2008-09'], shutouts: [5, 'Jordan Parise', '2008-09'] },
  KAC: { points: [65, 'Chad Hinz', '2006-07'], goals: [28, 'Tony Iob', '2004-05'], assists: [44, 'Andy Schneider', '2008-09'], wins: [29, 'Andrew Verner', '2003-04'], shutouts: [8, 'Sebastian Dahm', '2024-25'] },
  VSV: { points: [85, 'John Hughes', '2013-14'], goals: [37, 'Danny Bousquet', '2006-07'], assists: [65, 'Corey Locke', '2016-17'], wins: [29, 'Gert Prohaska', '2006-07'], shutouts: [6, 'Bernhard Starkbaum', '2011-12'] },
  VIC: { points: [85, 'Bob Wren', '2006-07'], goals: [46, 'Francois Fortier', '2010-11'], assists: [57, 'Bob Wren', '2006-07'], wins: [33, 'Frederic Chabot', '2004-05'], shutouts: [7, 'Bernhard Starkbaum', '2021-22'] },
  HCB: { points: [54, 'Mitch Hults', '2022-23'], goals: [31, 'Brad McClure', '2025-26'], assists: [39, 'Brett Findlay', '2018-19'], wins: [30, 'Jaroslav Hübl', '2013-14'], shutouts: [7, 'Leland Irving', '2019-20'] },
  PUS: { points: [50, 'Jason Akeson', '2024-25'], goals: [20, 'Jakob Stukel', '2021-22'], assists: [36, 'Jason Akeson', '2023-24'], wins: [26, 'Eddie Pasquale', '2025-26'], shutouts: [5, 'Tomas Sholl', '2022-23'] },
  INN: { points: [98, 'Todd Elik', '2006-07'], goals: [36, 'Pierre Dagenais', '2006-07'], assists: [77, 'Todd Elik', '2006-07'], wins: [25, 'Claus Dalpiaz', '2005-06'], shutouts: [4, 'Claus Dalpiaz', '2003-04'] },
  BWL: { points: [71, 'Rob Shearer', '2006-07'], goals: [40, 'Andrew Kozek', '2015-16'], assists: [52, 'Dragan Umicevic', '2019-20'], wins: [31, 'Alex Westlund', '2011-12'], shutouts: [6, 'Pavel Nestak', '2005-06'] },
  G99: { points: [67, 'Eric Healey', '2009-10'], goals: [40, 'Warren Norris', '2004-05'], assists: [45, 'Greg Day', '2009-10'], wins: [27, 'Fabian Weinhandl', '2010-11'], shutouts: [6, 'Sebastian Dahm', '2015-16'] },
  PIO: { points: [62, 'Steven Owre', '2023-24'], goals: [31, 'Steven Owre', '2023-24'], assists: [34, 'Nick Pastujov', '2023-24'], wins: [14, 'David Madlener', '2023-24'], shutouts: [1, 'Alex Caffi', '2022-23'] },
  OLI: { points: [67, 'John Hughes', '2011-12'], goals: [30, 'Frank Banham', '2008-09'], assists: [48, 'John Hughes', '2010-11'], wins: [25, 'Jerry Kuhn', '2012-13'], shutouts: [5, 'Lukas Horak', '2023-24'] },
  FEH: { points: [66, 'Janos Hari', '2018-19'], goals: [31, 'Istvan Sofron', '2011-12'], assists: [45, 'Janos Hari', '2018-19'], wins: [25, 'Mac Carruth', '2018-19'], shutouts: [6, 'Olivier Roy', '2022-23'] },
  FTC: { points: [50, 'Brady Shaw', '2025-26'], goals: [19, 'Brady Shaw', '2025-26'], assists: [31, 'Brady Shaw', '2025-26'], wins: [9, 'Bence Bálizs', '2025-26'], shutouts: [1, 'Kristóf Nagy', '2025-26'] },
};

/** The ECHL's clubs, back to the late 1980s. New Mexico and Trenton, new this season, have no book yet. */
export const ECHL_CLUB_RECORDS = {
  ADK: { points: [75, 'Shane Harper', '2022-23'], goals: [37, 'Patrick Grasso', '2022-23'], assists: [54, 'James Henry', '2018-19'], wins: [23, 'Jeremy Brodeur', '2025-26'], shutouts: [4, 'Jeremy Brodeur', '2024-25'] },
  MNE: { points: [83, 'Alex Kile', '2023-24'], goals: [37, 'Alex Kile', '2023-24'], assists: [52, 'Timothy Doherty', '2022-23'], wins: [22, 'Bradley Arvanitis', '2025-26'], shutouts: [4, 'Nolan Maier', '2024-25'] },
  NOR: { points: [77, 'Brady Fleurent', '2024-25'], goals: [31, 'Brady Fleurent', '2025-26'], assists: [47, 'Brodie Dupont', '2017-18'], wins: [25, 'Isaac Poulter', '2025-26'], shutouts: [3, 'Brandon Anderson', '2016-17'] },
  REA: { points: [95, 'Brian McCullough', '2002-03'], goals: [39, 'Brian McCullough', '2002-03'], assists: [60, 'Brad Rooney', '2002-03'], wins: [27, 'Barry Brust', '2004-05'], shutouts: [5, 'Brandon Anderson', '2013-14'] },
  TR: { points: [67, 'Anthony Beauregard', '2024-25'], goals: [30, 'Jakov Novak', '2023-24'], assists: [42, 'Anthony Beauregard', '2024-25'], wins: [19, 'Philippe Desrosiers', '2021-22'], shutouts: [4, 'Hunter Jones', '2025-26'] },
  WOR: { points: [65, 'Anthony Repaci', '2024-25'], goals: [30, 'Jordan Lavallee-Smotherman', '2021-22'], assists: [49, 'Connor Welsh', '2024-25'], wins: [23, 'Mitch Gillam', '2017-18'], shutouts: [5, 'Mitch Gillam', '2017-18'] },
  ATL: { points: [110, 'Brad Schell', '2006-07'], goals: [38, 'Cody Sylvester', '2022-23'], assists: [85, 'Brad Schell', '2006-07'], wins: [32, 'Sean Fields', '2005-06'], shutouts: [5, 'Jeff Jakaitis', '2011-12'] },
  FLA: { points: [102, 'Kevin Baker', '2008-09'], goals: [57, 'Kevin Baker', '2008-09'], assists: [59, 'Tom Buckley', '1999-00'], wins: [37, 'Cam Johnson', '2024-25'], shutouts: [5, 'Marc Magliarditi', '1998-99'] },
  GRN: { points: [87, 'Alex Ierullo', '2022-23'], goals: [31, 'Brandon Wong', '2011-12'], assists: [60, 'Alex Ierullo', '2022-23'], wins: [24, 'Nicola Riopel', '2010-11'], shutouts: [4, 'Ryan Bednard', '2020-21'] },
  JAX: { points: [66, 'Brendan Harris', '2023-24'], goals: [29, 'Wacey Rabbit', '2018-19'], assists: [45, 'Brendan Harris', '2023-24'], wins: [25, 'Matt Vernon', '2023-24'], shutouts: [3, 'Justen Close', '2024-25'] },
  ORL: { points: [74, 'Aaron Luchuk', '2020-21'], goals: [35, 'Joe Perry', '2016-17'], assists: [46, 'Aaron Luchuk', '2020-21'], wins: [23, 'Clint Windsor', '2020-21'], shutouts: [5, 'Garret Sparks', '2014-15'] },
  SAV: { points: [59, 'Devon Paliani', '2024-25'], goals: [32, 'Devon Paliani', '2024-25'], assists: [40, 'Reece Vitelli', '2024-25'], wins: [19, 'Vincent Purpura', '2025-26'], shutouts: [4, 'Michael Bullion', '2023-24'] },
  SC: { points: [110, 'Ed Courtenay', '1996-97'], goals: [54, 'Ed Courtenay', '1996-97'], assists: [62, 'Travis Morin', '2008-09'], wins: [36, 'Kirk Daubenspeck', '2002-03'], shutouts: [8, 'Ryan Zapolski', '2012-13'] },
  CIN: { points: [106, 'David Desharnais', '2007-08'], goals: [36, 'Joe Cardarelli', '2002-03'], assists: [77, 'David Desharnais', '2007-08'], wins: [29, 'Michael Houser', '2018-19'], shutouts: [5, 'Alex Westlund', '2001-02'] },
  FW: { points: [88, 'Brandon Marino', '2013-14'], goals: [38, 'Shawn Szydlowski', '2014-15'], assists: [60, 'Jonathan Dugan', '2023-24'], wins: [28, 'Pat Nagle', '2015-16'], shutouts: [5, 'Pat Nagle', '2015-16'] },
  IND: { points: [72, 'Alex Wideman', '2022-23'], goals: [31, 'Spencer Watson', '2019-20'], assists: [50, 'Alex Wideman', '2022-23'], wins: [29, 'Matt Tomkins', '2018-19'], shutouts: [4, 'Jake Hildebrand', '2016-17'] },
  KAL: { points: [87, 'Erik Bradford', '2023-24'], goals: [38, 'Andrew Fournier', '2010-11'], assists: [57, 'Erik Bradford', '2023-24'], wins: [36, 'Joel Martin', '2015-16'], shutouts: [4, 'Joel Martin', '2014-15'] },
  TOL: { points: [93, 'Brandon Hawkins', '2023-24'], goals: [40, 'Brandon Hawkins', '2023-24'], assists: [68, 'Shane Berschbach', '2016-17'], wins: [37, 'Pat Nagle', '2017-18'], shutouts: [7, 'Jake Paterson', '2016-17'] },
  WHL: { points: [117, 'Devin Edgerton', '1992-93'], goals: [62, 'Darren Schwartz', '1992-93'], assists: [71, 'Devin Edgerton', '1992-93'], wins: [33, 'Andy Franck', '2005-06'], shutouts: [6, 'Mike Condon', '2013-14'] },
  ALN: { points: [125, 'Chad Costello', '2014-15'], goals: [49, 'Hank Crone', '2022-23'], assists: [89, 'Chad Costello', '2016-17'], wins: [33, 'Riley Gill', '2014-15'], shutouts: [7, 'Riley Gill', '2016-17'] },
  IDH: { points: [92, 'Mark Derlago', '2009-10'], goals: [45, 'Mark Derlago', '2010-11'], assists: [54, 'Matthew Register', '2023-24'], wins: [36, 'Steve Silverthorn', '2006-07'], shutouts: [5, 'Josh Robinson', '2012-13'] },
  KC: { points: [87, 'Patrick Curry', '2023-24'], goals: [40, 'Cade Borchardt', '2024-25'], assists: [72, 'Marcus Crawford', '2025-26'], wins: [24, 'Shane Starrett', '2022-23'], shutouts: [5, 'Jack LaFontaine', '2024-25'] },
  RC: { points: [79, 'Alex Aleardi', '2023-24'], goals: [35, 'Blake Bennett', '2023-24'], assists: [50, 'Ryan Wagner', '2024-25'], wins: [25, 'Danny Battochio', '2014-15'], shutouts: [4, 'Danny Battochio', '2014-15'] },
  TAH: { points: [79, 'Sloan Stanick', '2024-25'], goals: [33, 'Simon Pinard', '2024-25'], assists: [50, 'Sloan Stanick', '2024-25'], wins: [24, 'Jesper Vikman', '2024-25'], shutouts: [4, 'Jordan Papirny', '2024-25'] },
  TUL: { points: [77, 'Drew Fisher', '2014-15'], goals: [41, 'Adam Pleskach', '2014-15'], assists: [59, 'Drew Fisher', '2014-15'], wins: [30, 'Kevin Carr', '2014-15'], shutouts: [4, 'Devin Williams', '2017-18'] },
  WIC: { points: [79, 'Michal Stinil', '2022-23'], goals: [32, 'Michal Stinil', '2023-24'], assists: [52, 'Michal Stinil', '2024-25'], wins: [20, 'Tim Boron', '2014-15'], shutouts: [4, 'Stuart Skinner', '2018-19'] },
  BLO: { points: [59, 'Nikita Sedov', '2025-26'], goals: [27, 'Eddie Matsushima', '2024-25'], assists: [46, 'Nikita Sedov', '2025-26'], wins: [24, 'Dryden McKay', '2025-26'], shutouts: [4, 'Dryden McKay', '2025-26'] },
  GSO: { points: [35, 'Tyler Weiss', '2025-26'], goals: [17, 'David Gagnon', '2025-26'], assists: [21, 'Patrick Newell', '2025-26'], wins: [9, 'Nikita Quapp', '2025-26'], shutouts: [1, 'Connor Ungar', '2025-26'] },
};

/** The SPHL's clubs, back to 2004-05, its first season. Athens and Pee Dee, new this season, have no book yet. */
export const SPHL_CLUB_RECORDS = {
  PEO: { points: [80, 'Alec Baer', '2021-22'], goals: [37, 'Jordan Ernst', '2024-25'], assists: [54, 'Alec Baer', '2021-22'], wins: [29, 'Eric Levine', '2021-22'], shutouts: [8, 'Colby Muise', '2024-25'] },
  ROA: { points: [77, 'Joseph Widmar', '2025-26'], goals: [29, 'Mac Jansen', '2021-22'], assists: [49, 'Nicholas Ford', '2024-25'], wins: [29, 'Austin Roudebush', '2024-25'], shutouts: [3, 'Austin Roudebush', '2024-25'] },
  HSV: { points: [78, 'James Patterson', '2006-07'], goals: [37, 'Travis Kauffeldt', '2008-09'], assists: [52, 'James Patterson', '2006-07'], wins: [26, 'Matt Carmichael', '2004-05'], shutouts: [4, 'Dan McWhinney', '2010-11'] },
  KNO: { points: [106, 'Kevin Swider', '2004-05'], goals: [44, 'K.J. Voorhees', '2004-05'], assists: [73, 'Kevin Swider', '2004-05'], wins: [25, 'Terry Dunbar', '2006-07'], shutouts: [5, 'Bryan Hince', '2013-14'] },
  PEN: { points: [71, 'Chris Wilson', '2010-11'], goals: [39, 'Chris Wilson', '2010-11'], assists: [51, 'Garrett Milan', '2017-18'], wins: [28, 'Max Strang', '2014-15'], shutouts: [5, 'Max Strang', '2014-15'] },
  MAC: { points: [69, 'Jake Trask', '2017-18'], goals: [27, 'Jake Trask', '2017-18'], assists: [42, 'Jake Trask', '2017-18'], wins: [22, 'Garrett Bartus', '2015-16'], shutouts: [3, 'Garrett Bartus', '2015-16'] },
  EVV: { points: [65, 'Austin Plevy', '2019-20'], goals: [27, 'Shayne Morrissey', '2018-19'], assists: [48, 'Austin Plevy', '2019-20'], wins: [23, 'Kristian Stead', '2025-26'], shutouts: [4, 'Brian Billett', '2021-22'] },
  BHM: { points: [65, 'Carson Rose', '2023-24'], goals: [33, 'Drake Glover', '2023-24'], assists: [41, 'Nikita Kozyrev', '2023-24'], wins: [30, 'Mavric Parks', '2018-19'], shutouts: [6, 'Mavric Parks', '2018-19'] },
  QCS: { points: [68, 'Leif Mattson', '2024-25'], goals: [32, 'Cole Golka', '2023-24'], assists: [39, 'Leif Mattson', '2025-26'], wins: [21, 'Brent Moran', '2023-24'], shutouts: [4, 'Brent Moran', '2024-25'] },
  FAY: { points: [98, 'Rob Sich', '2009-10'], goals: [63, 'Rob Sich', '2009-10'], assists: [65, 'Chris Leveille', '2009-10'], wins: [32, 'Sean Bonar', '2016-17'], shutouts: [4, 'Chad Collins', '2004-05'] },
};

/** The USHL's sixteen, from the mid-1990s on, when QuantHockey's tables for it begin. */
export const USHL_CLUB_RECORDS = {
  CDR: { points: [79, 'Ryan Walsh', '2022-23'], goals: [35, 'Ross Colton', '2015-16'], assists: [52, 'Teddy Purcell', '2005-06'], wins: [37, 'Brady Hjelle', '2010-11'], shutouts: [8, 'Bobby Goepfert', '2001-02'] },
  CHI: { points: [101, 'Sean Farrell', '2020-21'], goals: [48, 'Matt Coronato', '2020-21'], assists: [72, 'Sean Farrell', '2020-21'], wins: [25, 'Justin Robbins', '2018-19'], shutouts: [4, 'Ales Stezka', '2016-17'] },
  DBQ: { points: [95, 'Stephen Halliday', '2021-22'], goals: [43, 'Noah Powell', '2023-24'], assists: [60, 'Stephen Halliday', '2021-22'], wins: [32, 'Hunter Miska', '2015-16'], shutouts: [4, 'Matt Morris', '2010-11'] },
  GBG: { points: [77, 'Kyle Novak', '2012-13'], goals: [44, 'Will Zellers', '2024-25'], assists: [50, 'Kyle Novak', '2012-13'], wins: [34, 'Eric Pfligler', '2001-02'], shutouts: [6, 'Eric Pfligler', '2001-02'] },
  MDS: { points: [71, 'Austin Burnevik', '2023-24'], goals: [40, 'Austin Burnevik', '2023-24'], assists: [39, 'Ben Dexheimer', '2021-22'], wins: [25, 'Caleb Heil', '2024-25'], shutouts: [3, 'Caleb Heil', '2025-26'] },
  MSK: { points: [89, 'Rem Pitlick', '2015-16'], goals: [46, 'Rem Pitlick', '2015-16'], assists: [51, 'Jacob Guevin', '2021-22'], wins: [33, 'Brandon Bussi', '2018-19'], shutouts: [8, 'Kevin Lindskoug', '2012-13'] },
  NTDP: { points: [54, 'Jack Hughes', '2017-18'], goals: [29, 'Cole Caufield', '2018-19'], assists: [36, 'Jack Hughes', '2018-19'], wins: [15, 'Drew DeRidder', '2017-18'], shutouts: [3, 'Collin Olson', '2010-11'] },
  YTP: { points: [80, 'Kyle Connor', '2014-15'], goals: [37, 'Sam Anas', '2012-13'], assists: [48, 'Josh Melnick', '2014-15'], wins: [33, 'Melvin Strahl', '2024-25'], shutouts: [5, 'Sean Romeo', '2012-13'] },
  DMB: { points: [82, 'Richard Purslow', '2006-07'], goals: [37, 'Alexander Materukhin', '2001-02'], assists: [55, 'Richard Purslow', '2006-07'], wins: [29, 'Roman Durny', '2018-19'], shutouts: [6, 'Roman Durny', '2018-19'] },
  FRG: { points: [77, 'Mac Swanson', '2023-24'], goals: [37, 'Jack Adams', '2016-17'], assists: [51, 'Mac Swanson', '2023-24'], wins: [30, 'Matthew Murray', '2016-17'], shutouts: [7, 'Zane McIntyre', '2011-12'] },
  LNC: { points: [104, 'Kevin Roy', '2011-12'], goals: [54, 'Kevin Roy', '2011-12'], assists: [58, 'Aidan Thompson', '2021-22'], wins: [29, 'Kevin Murdock', '2010-11'], shutouts: [6, 'Jean-Philippe Lamoureux', '2001-02'] },
  OMH: { points: [86, 'Jake Randolph', '2013-14'], goals: [37, 'Matt Schepke', '2005-06'], assists: [60, 'Jake Randolph', '2013-14'], wins: [36, 'Jeff Lerg', '2004-05'], shutouts: [10, 'Marty Magers', '2001-02'] },
  SCM: { points: [74, 'Giacomo Martino', '2024-25'], goals: [39, 'Ben Steeves', '2021-22'], assists: [47, 'Martin Pospisil', '2018-19'], wins: [36, 'Matiss Kivlenieks', '2016-17'], shutouts: [6, 'Matt Skoff', '2010-11'] },
  SFS: { points: [91, 'Thomas Vanek', '2001-02'], goals: [46, 'Thomas Vanek', '2001-02'], assists: [53, 'Jamie Mattie', '2000-01'], wins: [35, 'Linards Feldbergs', '2025-26'], shutouts: [6, 'Clay Witt', '2009-10'] },
  TCS: { points: [98, 'Jeremy Wilmer', '2021-22'], goals: [39, 'Mitchell Miller', '2021-22'], assists: [73, 'Jeremy Wilmer', '2021-22'], wins: [30, 'Arseni Sergeyev', '2021-22'], shutouts: [7, 'Aaron Rock', '2005-06'] },
  WAT: { points: [93, 'Taylor Cammarata', '2012-13'], goals: [38, 'Taylor Cammarata', '2012-13'], assists: [58, 'Justin Kloos', '2012-13'], wins: [28, 'Kevin Regan', '2003-04'], shutouts: [6, 'Kevin Regan', '2003-04'] },
};

/** Which club book belongs to which league. A league absent here has none. */
export const CLUB_RECORDS = {
  NHL: NHL_CLUB_RECORDS,
  OHL: OHL_CLUB_RECORDS,
  WHL: WHL_CLUB_RECORDS,
  QMJHL: QMJHL_CLUB_RECORDS,
  AHL: AHL_CLUB_RECORDS,
  SHL: SHL_CLUB_RECORDS,
  LIIGA: LIIGA_CLUB_RECORDS,
  KHL: KHL_CLUB_RECORDS,
  SWISS: SWISS_CLUB_RECORDS,
  DEL: DEL_CLUB_RECORDS,
  CZECH: CZECH_CLUB_RECORDS,
  SLOVAK: SLOVAK_CLUB_RECORDS,
  ICEHL: ICEHL_CLUB_RECORDS,
  ECHL: ECHL_CLUB_RECORDS,
  SPHL: SPHL_CLUB_RECORDS,
  USHL: USHL_CLUB_RECORDS,
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
  // The rest are from QuantHockey's league record pages, read in November 2026.
  // Its tables for these leagues reach back to the mid-1990s at the latest
  // (the SHL to 1975, the Liiga to 1933, the Swiss league to the mid-1980s),
  // which covers the whole life of the KHL, the DEL, both Extraligas and the
  // SPHL. The BCHL isn't here because its tables start around 1996, after the
  // years Brett Hull and others set the real marks. Slovakia's goaltending
  // tables are missing their older wins and carry shutout totals that can't
  // be right, so only its scoring records are in.
  SHL: { points: [76, 'Håkan Loob', '1982-83'], goals: [42, 'Håkan Loob', '1982-83'], assists: [53, 'Ryan Lasch', '2021-22'], wins: [31, 'Strauss Mann', '2025-26'], shutouts: [10, 'Strauss Mann', '2025-26'] },
  LIIGA: { points: [93, 'Kari Jalonen', '1986-87'], goals: [47, 'Arto Javanainen', '1987-88'], assists: [64, 'Kari Jalonen', '1986-87'], wins: [34, 'Tim Thomas', '2004-05'], shutouts: [15, 'Tim Thomas', '2004-05'] },
  KHL: { points: [89, 'Nikita Gusev', '2023-24'], goals: [49, 'Josh Leivo', '2024-25'], assists: [66, 'Nikita Gusev', '2023-24'], wins: [38, 'Jakub Kovář', '2018-19'], shutouts: [13, 'Alexei Murygin', '2015-16'] },
  SWISS: { points: [93, 'Oleg Petrov', '1997-98'], goals: [41, 'Ravil Yudashev', '1992-93'], assists: [63, 'Oleg Petrov', '1997-98'], wins: [35, 'Leonardo Genoni', '2010-11'], shutouts: [10, 'Leonardo Genoni', '2018-19'] },
  DEL: { points: [101, 'Robert Reichel', '1995-96'], goals: [50, 'Sergei Berezin', '1995-96'], assists: [65, 'John Chabot', '1995-96'], wins: [35, 'Rob Zepp', '2009-10'], shutouts: [9, 'Sinuhe Wallinheimo', '2000-01'] },
  CZECH: { points: [83, 'Martin Růžička', '2012-13'], goals: [40, 'Martin Růžička', '2012-13'], assists: [53, 'Richard Král', '1999-00'], wins: [35, 'Adam Svoboda', '2002-03'], shutouts: [11, 'Roman Málek', '2002-03'] },
  SLOVAK: { points: [99, 'Žigmund Pálffy', '2008-09'], goals: [52, 'Žigmund Pálffy', '2008-09'], assists: [59, 'Juraj Mikúš', '2008-09'] },
  ICEHL: { points: [98, 'Todd Elik', '2006-07'], goals: [46, 'Francois Fortier', '2010-11'], assists: [77, 'Todd Elik', '2006-07'], wins: [33, 'Frederic Chabot', '2004-05'], shutouts: [8, 'Sebastian Dahm', '2024-25'] },
  SPHL: { points: [106, 'Kevin Swider', '2004-05'], goals: [63, 'Rob Sich', '2009-10'], assists: [73, 'Kevin Swider', '2004-05'], wins: [32, 'Sean Bonar', '2016-17'], shutouts: [8, 'Kyle Rank', '2013-14'] },
  USHL: { points: [104, 'Kevin Roy', '2011-12'], goals: [54, 'Kevin Roy', '2011-12'], assists: [73, 'Jeremy Wilmer', '2021-22'], wins: [37, 'Brady Hjelle', '2010-11'], shutouts: [10, 'Marty Magers', '2001-02'] },
};
