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
// Sources: Wikipedia per-club record pages, hockey-reference franchise
// single-season leaders, The Hockey News franchise-leader round-ups,
// EliteProspects all-time single-season leaderboards, and club or league
// announcements for anything set recently.
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

/** All-time single-season records for the league itself. */
export const LEAGUE_RECORDS = {
  AHL: { points: [138, 'Don Biggs', '1992-93'], goals: [61, 'Paul Gardner', '1985-86'], assists: [89, 'George Sullivan', '1953-54'] },
  NHL: { points: [215, 'Wayne Gretzky', '1985-86'], goals: [92, 'Wayne Gretzky', '1981-82'], assists: [163, 'Wayne Gretzky', '1985-86'] },
  OHL: { points: [192, 'Bobby Smith', '1977-78'], assists: [123, 'Bobby Smith', '1977-78'] },
  QMJHL: { points: [282, 'Mario Lemieux', '1983-84'], goals: [133, 'Mario Lemieux', '1983-84'], assists: [149, 'Mario Lemieux', '1983-84'] },
  WHL: { points: [212, 'Rob Brown', '1986-87'], goals: [76, 'Rob Brown', '1986-87'], assists: [136, 'Rob Brown', '1986-87'] },
};
