import { useAppContext } from '../AppContext';
import { getFullTeamName } from '../utils/appHelpers';
import { careerTrophies, formatMoney } from '../utils/gameHelpers';
import { classTable, groupName, peerUnit, peerValue, posGroup } from '../utils/peers';
import { getAwardImage } from '../data/awards';
import TeamLogo from '../components/TeamLogo';
import TrophyImage from '../components/TrophyImage';
import { Fragment, useMemo } from 'react';
import { computeCareerScore } from '../utils/careerScore';

// What a year won, in the last column of the register.
//
// This was sixty lines of nested JSX inside the history table, which meant the
// international table could not have it without a second copy. It is one place
// now and both tables call it.
function Hardware({ season }) {
  const awards = (season.awards || [])
    .filter(aw => !aw.toLowerCase().includes('1st team all-star'))
    // The championship already has its own pill, drawn from titleWon, and the
    // same cup is also written into the season's award list. Both were being
    // rendered, which is why a cup-winning year showed two identical trophies.
    .filter(aw => {
      if (!season.titleWon) return true;
      const own = season.league === 'NHL' ? 'stanley cup'
        : season.league === 'AHL' ? 'calder cup'
          : 'championship';
      return !aw.toLowerCase().includes(own);
    });

  if (!season.titleWon && awards.length === 0) {
    return <span className="text-slate-700">&ndash;</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {season.titleWon && (
        <span className="bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-[#F59E0B] text-[9px] sm:text-[10px] font-bold px-2 h-5 rounded uppercase tracking-wider inline-flex items-center gap-1.5 leading-none shadow-sm">
          <TrophyImage league={season.league || 'NHL'} className="w-3 h-3 shrink-0" />
          <span>{season.league === 'NHL' ? 'Stanley Cup' : 'Championship'}</span>
        </span>
      )}
      {awards.map((aw, aIdx) => {
        let text = aw.replace(/^\d{4}\s/, '').replace(/\s\d{4}$/, '');
        if (season.league === 'INTL') {
          if (text.includes('Gold')) text = 'Gold Medal';
          else if (text.includes('Silver')) text = 'Silver Medal';
          else if (text.includes('Bronze')) text = 'Bronze Medal';
          else if (text.includes('Promotion')) text = 'Promotion';
          else if (text.includes('Survival')) text = 'Survival';
        } else {
          text = text.replace('Gold, Olympics', 'Olympic Gold');
          text = text.replace('Gold, World Juniors', 'WJC Gold');
          text = text.replace('Gold, World Championship', 'WC Gold');
          text = text.replace('Promotion, World Championship', 'WC Promotion');
          text = text.replace('Survival, World Championship', 'WC Survival');
          if (text.includes('Most Valuable Player')) text = text.replace('Most Valuable Player', 'MVP');
          // A register column is not the place for "James Norris Memorial
          // Trophy". Every league's hardware ends in some arrangement of
          // Memorial, Trophy and Award, and none of those words identify it.
          text = text.replace(/\s+Memorial\s+(Trophy|Award)$/, '')
                     .replace(/\s+(Trophy|Award)$/, '')
                     .replace(/^Frank J\.\s+/, '');
        }

        const imgUrl = getAwardImage(aw) || getAwardImage(text);
        let colorClass = 'text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/30';
        if (text.includes('Cup') || text.includes('Gold') || text.includes('Conn Smythe')) {
          colorClass = 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30';
        } else if (text.includes('Hart') || text.includes('Art Ross') || text.includes('Maurice') || text.includes('Lindsay') || text.includes('Rocket')) {
          colorClass = 'text-[#c084fc] bg-[#c084fc]/10 border-[#c084fc]/30';
        } else if (text.includes('Norris') || text.includes('Vezina') || text.includes('Selke') || text.includes('Calder')) {
          colorClass = 'text-[#22E748] bg-[#22E748]/10 border-[#22E748]/30';
        } else if (text.includes('Silver') || text.includes('Bronze')) {
          colorClass = 'text-slate-300 bg-slate-500/10 border-slate-500/30';
        }

        return (
          <span key={aIdx} className={`${colorClass} border text-[9px] sm:text-[10px] font-bold px-2 h-5 rounded uppercase tracking-wider leading-none inline-flex items-center gap-1.5 shadow-sm`}>
            {imgUrl && (
              <img src={imgUrl} alt="" className="w-3 h-3 shrink-0 object-contain"
                   onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            )}
            <span>{text}</span>
          </span>
        );
      })}
    </div>
  );
}

// The C and the A, next to the year they were worn. Same pill on a club season
// and on a tournament, because it is the same thing.
function Letter({ captain, alternate, long = false }) {
  if (!captain && !alternate) return null;
  const c = captain;
  return (
    <span className={`shrink-0 text-[9px] font-black px-1.5 h-4 rounded uppercase tracking-widest inline-flex items-center justify-center leading-none shadow-sm ${
      c ? 'bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444]'
        : 'bg-[#3b82f6]/10 border border-[#3b82f6]/30 text-[#3b82f6]'} ${long ? '' : 'min-w-[18px]'}`}>
      {long ? (c ? 'Captain' : 'Alternate') : (c ? 'C' : 'A')}
    </span>
  );
}

export default function RetirementScreen() {
  const { handleNewGame, player, safeNationalities } = useAppContext();
  const scoreData = useMemo(() => computeCareerScore(player), [player]);

  const natObj = (safeNationalities || []).find(n => n.id === player.nat);
  const fullCountryName = natObj?.name || player.nat || 'UNKNOWN';

  // Some countries go by a short, commonly-known team name rather than the
  // literal country name (e.g. "Team USA", not "Team United States").
  const TEAM_NAME_OVERRIDES = { USA: 'USA' };
  const teamNatName = TEAM_NAME_OVERRIDES[player.nat] || fullCountryName;

  return (() => {
    // The badge on this screen and the record saved into the Hall of Records used
    // two different tests for the same thing. The badge read fan status alone,
    // which is popularity rather than achievement, and 800 is a number a career
    // does not actually reach: across 1200 long, strong careers the highest seen
    // was 494, so "HALL OF FAME CAREER" never once appeared, not even for a player
    // the game then filed as a legend. Both now read the career score, which is
    // what the Hall of Fame is actually about.
    const isLegend = scoreData.tier === 'Generational Icon' || scoreData.tier === 'Hall of Famer';
    const isGoalie = player.pos === 'G';
    const peakOvr = player.stats?.peakOvr || player.ovr;

    // Deep search across player object and season history for draft info
    let foundPick = player.draftPick || player.stats?.draftPick;
    let foundRound = player.draftRound || player.stats?.draftRound;

    if (!foundPick && player.seasonHistory) {
      for (const s of player.seasonHistory) {
        if (s.draftPick) {
          foundPick = s.draftPick;
          foundRound = s.draftRound;
          break;
        }
      }
    }

    let draftLabel = 'UNDRAFTED FREE AGENT';
    if (foundPick && foundRound) {
      draftLabel = `DRAFTED #${foundPick} OVERALL`;
    } else if (foundPick) {
      const estimatedRound = Math.ceil(foundPick / 32);
      draftLabel = `SELECTED IN ROUND ${estimatedRound}, #${foundPick} OVERALL`;
    } else if (player.draftTeam || player.rights) {
      draftLabel = 'DRAFTED PROSPECT';
    }

    const proGames = (player.stats?.nhl?.games || 0) + (player.stats?.ahl?.games || 0);
    const proGoals = (player.stats?.nhl?.goals || 0) + (player.stats?.ahl?.goals || 0);
    const proAssists = (player.stats?.nhl?.assists || 0) + (player.stats?.ahl?.assists || 0);
    const proSaves = (player.stats?.nhl?.saves || 0) + (player.stats?.ahl?.saves || 0);
    const proShots = (player.stats?.nhl?.shots || 0) + (player.stats?.ahl?.shots || 0);
    
    const poGames = (player.stats?.nhlPlayoffs?.games || 0) + (player.stats?.ahlPlayoffs?.games || 0);
    const poGoals = (player.stats?.nhlPlayoffs?.goals || 0) + (player.stats?.ahlPlayoffs?.goals || 0);
    const poAssists = (player.stats?.nhlPlayoffs?.assists || 0) + (player.stats?.ahlPlayoffs?.assists || 0);
    const poSaves = (player.stats?.nhlPlayoffs?.saves || 0) + (player.stats?.ahlPlayoffs?.saves || 0);
    const poShots = (player.stats?.nhlPlayoffs?.shots || 0) + (player.stats?.ahlPlayoffs?.shots || 0);
    
    const otherGames = (player.stats?.chl?.games || 0);
    const otherGoals = (player.stats?.chl?.goals || 0);
    const otherAssists = (player.stats?.chl?.assists || 0);
    const otherSaves = (player.stats?.chl?.saves || 0);
    const otherShots = (player.stats?.chl?.shots || 0);

    let totalProMinutes = 0;
    let totalProGamesWithToi = 0;
    (player.seasonHistory || []).forEach(s => {
        if (['NHL', 'AHL'].includes(s.league) && s.avgToi) {
            totalProMinutes += s.avgToi * s.games;
            totalProGamesWithToi += s.games;
        }
    });
    const careerAvgToi = totalProGamesWithToi > 0 ? (totalProMinutes / totalProGamesWithToi) : 0;
    const formattedToi = careerAvgToi > 0 
        ? `${Math.floor(careerAvgToi)}:${Math.round((careerAvgToi % 1) * 60).toString().padStart(2, '0')}` 
        : '--:--';
    
    const teamStints = []; 
    const intlSeasons = [];
    let currentStint = null;

    (player.seasonHistory || []).forEach(season => {
        const clubAwards = [];
        const intlAwards = [];

        (season.awards || []).forEach(aw => {
            const lowerAw = aw.toLowerCase();
            if (lowerAw.includes('olympic') || lowerAw.includes('world junior') || lowerAw.includes('world championship') || lowerAw.includes('wjc') || lowerAw.includes('wc gold') || lowerAw.includes('wc survival') || lowerAw.includes('wc promotion')) {
                intlAwards.push(aw);
            } else {
                clubAwards.push(aw);
            }
        });

        // Check if we saved native stats, OR if it's an old save with a medal
        if (season.intlData || intlAwards.length > 0) {
            const seed = (season.year * 17 + (player.number || 1) * 31) % 100;
            
            // Use real data if available, fallback to faking it for legacy saves
            const simGames = season.intlData?.gamesPlayed ?? (5 + (seed % 3));
            let simGoals = season.intlData?.stats?.g ?? 0;
            let simAssists = season.intlData?.stats?.a ?? 0;
            let simSaves = 0, simShots = 0, simShutouts = 0, simPM = 0;

            if (player.pos === 'G') {
                simShots = season.intlData?.stats?.shots ?? (simGames * (20 + (seed % 15)));
                simSaves = season.intlData?.stats?.saves ?? Math.floor(simShots * (0.900 + ((seed % 40) * 0.001)));
                simShutouts = season.intlData?.stats?.sho ?? (seed % 2);
            } else {
                if (!season.intlData) {
                    const isDef = ['LD', 'RD'].includes(player.pos);
                    simGoals = Math.floor(simGames * (isDef ? (0.1 + (seed % 20) * 0.01) : (0.3 + (seed % 30) * 0.01)));
                    simAssists = Math.floor(simGames * (isDef ? (0.2 + (seed % 30) * 0.01) : (0.4 + (seed % 30) * 0.01)));
                }
                simPM = season.intlData?.stats?.pm ?? ((seed % 12) - 2);
            }

            let tournamentName = season.intlData?.tournamentName;
            if (!tournamentName) {
                const firstAward = intlAwards[0] || '';
                let baseName = 'International Tournament';
                if (firstAward.includes('World Juniors') || firstAward.includes('WJC')) baseName = 'World Junior Championship';
                else if (firstAward.includes('Olympics')) baseName = 'Winter Olympic Games';
                else if (firstAward.includes('World Championship')) baseName = 'IIHF World Championship';
                tournamentName = `${season.year} ${baseName}`;
            }

            intlSeasons.push({
                letter: season.intlData?.letter || null,
                // The tournament rows read the same fields the club seasons
                // do, so the C and A pills in the table are drawn by the one
                // piece of markup rather than a second copy for INTL.
                isCaptain: season.intlData?.letter === 'C',
                isAlternate: season.intlData?.letter === 'A',
                year: season.year,
                tournamentName,
                awards: intlAwards,
                games: simGames, 
                goals: simGoals, 
                assists: simAssists, 
                saves: simSaves, 
                shots: simShots, 
                shutouts: simShutouts, 
                plusMinus: simPM,
                league: 'INTL',
                team: player.nat || 'UNK'
            });
        }

        // A season is not always one club.
        //
        // This read season.team and nothing else, so a year with a deadline
        // trade or a call-up was filed whole under whichever club the player
        // finished it with, and the other one vanished from the career: no
        // stint, no games, no row. A player traded twice could retire having
        // apparently never played for the team he was traded from. The season's
        // own stint list is what records the split, so walk that instead and
        // treat each leg as its own piece of the career.
        const legs = (Array.isArray(season.stints) && season.stints.length > 1)
            ? season.stints.map(st => ({
                team: st.team, league: st.league,
                games: st.games || 0,
                wins: st.wins || 0, losses: st.losses || 0, otl: st.otl || 0,
                goals: st.g ?? st.goals ?? 0,
                assists: st.a ?? st.assists ?? 0,
                saves: st.saves || 0,
                shots: st.shots || 0,
                shutouts: st.sho ?? st.shutouts ?? 0,
                plusMinus: st.pm ?? st.plusMinus ?? 0
              }))
            : [{
                team: season.team, league: season.league,
                wins: season.wins || 0, losses: season.losses || 0, otl: season.otl || 0,
                games: season.games || 0, goals: season.goals || 0, assists: season.assists || 0,
                saves: season.saves || 0, shots: season.shots || 0,
                shutouts: season.shutouts || 0, plusMinus: season.plusMinus || 0
              }];

        legs.forEach((leg, legIdx) => {
            // Group consecutive seasons for the SAME team into a chronological stint
            if (!currentStint || currentStint.team !== leg.team || currentStint.league !== leg.league) {
                if (currentStint) {
                    teamStints.push(currentStint);
                }
                currentStint = {
                    team: leg.team, league: leg.league,
                    startYear: season.year, endYear: season.year,
                    games: 0, goals: 0, assists: 0, saves: 0, shots: 0, shutouts: 0, plusMinus: 0,
                    seasons: []
                };
            }

            currentStint.endYear = Math.max(currentStint.endYear, season.year);
            currentStint.games += leg.games;
            currentStint.goals += leg.goals;
            currentStint.assists += leg.assists;
            currentStint.saves += leg.saves;
            currentStint.shots += leg.shots;
            currentStint.shutouts += leg.shutouts;
            currentStint.plusMinus += leg.plusMinus;

            // The hardware and the letters belong to the year, so they are shown
            // once, against the club he was with when the season ended. So does
            // the postseason: a player traded in March plays the playoffs for
            // exactly one of the two clubs on his season, and spreading the
            // season onto both legs gave each of them the same playoff line.
            const isLast = legIdx === legs.length - 1;
            currentStint.seasons.push({
                ...season,
                ...leg,
                titleWon: isLast ? season.titleWon : 0,
                isCaptain: isLast ? season.isCaptain : false,
                isAlternate: isLast ? season.isAlternate : false,
                playoffGames: isLast ? (season.playoffGames || 0) : 0,
                playoffGoals: isLast ? (season.playoffGoals || 0) : 0,
                playoffAssists: isLast ? (season.playoffAssists || 0) : 0,
                playoffSaves: isLast ? (season.playoffSaves || 0) : 0,
                playoffShots: isLast ? (season.playoffShots || 0) : 0,
                playoffShutouts: isLast ? (season.playoffShutouts || 0) : 0,
                awards: isLast ? clubAwards : []
            });
        });
    });

    if (currentStint) {
        teamStints.push(currentStint);
    }
    if (intlSeasons.length > 0) {
        const totalIntlGames = intlSeasons.reduce((sum, s) => sum + s.games, 0);
        // Captaining your country is the kind of thing a career is remembered
        // for, and it lived only on the tournament screen while the tournament
        // was happening. The C outranks the A if he wore both.
        const intlLetters = intlSeasons.map(ss => ss.letter).filter(Boolean);
        const bestLetter = intlLetters.includes('C') ? 'C' : intlLetters.includes('A') ? 'A' : null;
        const letterYears = intlSeasons.filter(ss => ss.letter === bestLetter).length;
        teamStints.push({
            letter: bestLetter,
            letterYears,
            team: player.nat || 'UNK',
            league: 'INTL',
            startYear: intlSeasons[0].year,
            endYear: intlSeasons[intlSeasons.length - 1].year,
            games: totalIntlGames,
            seasons: intlSeasons,
            isNational: true
        });
    }

    // THE CAREER, ONE ROW A YEAR.
    //
    // The history used to be a stack of folded-shut cards, one a club, each
    // hiding a table you had to open. Three things were wrong with that. You
    // could not read a career down the page, because every year was behind a
    // click. A season split between two clubs sat in two different cards, so
    // the year it happened was impossible to see. And the postseason was not
    // recorded anywhere on the screen at all, which for a player who had won
    // something was the half of the career he would want to look at.
    //
    // It reads like a hockey register now: a line a year, in order, club and
    // league named on each, the regular season and the playoffs side by side.
    // The logos, the letters and the hardware are the parts of the old card
    // worth keeping, so they stay.
    const clubRows = teamStints
      .filter(s => !s.isNational)
      .flatMap(s => s.seasons);

    // Totals the way a register does them: one line per league, in the order
    // he first turned up in it, so a player who went junior, AHL, NHL reads
    // down to three summaries rather than one number for a whole career.
    const leagueTotals = [];
    clubRows.forEach(r => {
      let t = leagueTotals.find(x => x.league === r.league);
      if (!t) {
        t = { league: r.league, games: 0, goals: 0, assists: 0, saves: 0, shots: 0,
              shutouts: 0, plusMinus: 0, wins: 0, losses: 0, otl: 0,
              poGames: 0, poGoals: 0, poAssists: 0,
              poSaves: 0, poShots: 0, poShutouts: 0, seasons: 0 };
        leagueTotals.push(t);
      }
      t.seasons += 1;
      t.games += r.games || 0;
      t.goals += r.goals || 0;
      t.assists += r.assists || 0;
      t.saves += r.saves || 0;
      t.shots += r.shots || 0;
      t.shutouts += r.shutouts || 0;
      t.plusMinus += r.plusMinus || 0;
      t.wins += r.wins || 0;
      t.losses += r.losses || 0;
      t.otl += r.otl || 0;
      t.poGames += r.playoffGames || 0;
      t.poGoals += r.playoffGoals || 0;
      t.poAssists += r.playoffAssists || 0;
      t.poSaves += r.playoffSaves || 0;
      t.poShots += r.playoffShots || 0;
      t.poShutouts += r.playoffShutouts || 0;
    });

    // The one stint that is not a club. It keeps its own table because a
    // tournament is not a season and the columns do not line up with one.
    const intlStint = teamStints.find(s => s.isNational) || null;

    let primaryTeam = player.team;
    let primaryLeague = player.league; // NEW: Track the league of your most played team!
    
    if (teamStints.length > 0) {
      const sortedStints = [...teamStints].filter(s => !s.isNational).sort((a, b) => b.games - a.games);
      if (sortedStints.length > 0) {
          primaryTeam = sortedStints[0].team;
          primaryLeague = sortedStints[0].league; 
      }
    }
    const primaryTeamName = getFullTeamName(primaryTeam, primaryLeague);

    const cityWords = primaryTeamName.split(' ');
    const cityName = cityWords.length > 1 ? cityWords[0] : primaryTeamName;

    const NHL_ARENAS = {
      'ANA': 'Honda Center', 'BOS': 'TD Garden', 'BUF': 'KeyBank Center', 'CGY': 'Scotiabank Saddledome',
      'CAR': 'Lenovo Center', 'CHI': 'United Center', 'COL': 'Ball Arena', 'CBJ': 'Nationwide Arena',
      'DAL': 'American Airlines Center', 'DET': 'Little Caesars Arena', 'EDM': 'Rogers Place', 'FLA': 'Amerant Bank Arena',
      'LAK': 'Crypto.com Arena', 'MIN': 'Grand Casino Arena', 'MTL': 'Bell Centre', 'NSH': 'Bridgestone Arena',
      'NJD': 'Prudential Center', 'NYI': 'UBS Arena', 'NYR': 'Madison Square Garden', 'OTT': 'Canadian Tire Centre',
      'PHI': 'Xfinity Mobile Arena', 'PIT': 'PPG Paints Arena', 'SJS': 'SAP Center', 'SEA': 'Climate Pledge Arena',
      'STL': 'Enterprise Center', 'TBL': 'Benchmark International Arena', 'TOR': 'Scotiabank Arena', 'VAN': 'Rogers Arena',
      'VGK': 'T-Mobile Arena', 'WSH': 'Capital One Arena', 'WPG': 'Canada Life Centre', 'UTA': 'Delta Center'
    };

    const arenaName = primaryLeague === 'NHL' && NHL_ARENAS[primaryTeam] ? NHL_ARENAS[primaryTeam] : `${cityName} Arena`;
    const stanleyCups = (player.seasonHistory || []).filter(s => s.league === 'NHL' && s.titleWon).length;
    
    const aggregatedAwards = {};
    (player.seasonHistory || []).forEach(s => {
      // PREVENT DOUBLE COUNTING: Use a Set to ensure an award is only counted once per season
      const uniqueSeasonAwards = Array.from(new Set(s.awards || []));
      
      uniqueSeasonAwards.forEach(aw => {
        let key = aw.replace(/^\d{4}\s/, '').replace(' Trophy', '').replace(' Memorial', '').replace(/\s*\(.+?\)\s*$/, '').trim();
        
        if (key.toLowerCase().includes('1st team all-star')) return;
        if (key.toLowerCase() === 'stanley cup') return; // Handled separately by stanleyCups counter
        
        key = key.replace(/\s\d{4}$/, '');
        key = key.replace('Gold, Olympics', 'Olympic Gold Medalist');
        key = key.replace('Silver, Olympics', 'Olympic Silver Medalist');
        key = key.replace('Bronze, Olympics', 'Olympic Bronze Medalist');
        
        key = key.replace('Gold, World Juniors', 'WJC Gold Medalist');
        key = key.replace('Silver, World Juniors', 'WJC Silver Medalist');
        key = key.replace('Bronze, World Juniors', 'WJC Bronze Medalist');
        
        key = key.replace('Gold, World Championship', 'WC Gold Medalist');
        key = key.replace('Silver, World Championship', 'WC Silver Medalist');
        key = key.replace('Bronze, World Championship', 'WC Bronze Medalist');
        
        // Strip out non-medal international events from the final legacy screen
        if (key.includes('Promotion') || key.includes('Survival')) return;

        if (!aggregatedAwards[key]) aggregatedAwards[key] = { name: key, count: 0 };
        aggregatedAwards[key].count++;
      });
    });

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 bg-[#040505] text-white font-sans">
        <div className="w-full max-w-4xl space-y-4">
          
          <div className="game-panel p-6 sm:p-10 text-center border-2 border-[#3b82f6] relative overflow-hidden bg-gradient-to-b from-[#101410] to-[#080a08] shadow-[0_0_30px_rgba(59,130,246,0.15)]">
            {/* Unified flex container centered together */}
            <div className="flex flex-wrap justify-center items-center gap-2 mb-4 sm:mb-6">
                <span className="text-[10px] sm:text-xs font-black tracking-widest text-slate-400 uppercase bg-black/40 px-3.5 sm:px-4 rounded-full border border-slate-700/80 inline-flex items-center justify-center h-8 sm:h-9 leading-none">
                  RETIRED AT AGE {player.age}
                </span>
                <span className="text-[10px] sm:text-xs font-black tracking-widest text-[#22E748] uppercase bg-[#22E748]/10 px-3.5 sm:px-4 rounded-full border border-[#22E748]/30 inline-flex items-center justify-center h-8 sm:h-9 leading-none">
                  PEAK RATING · {peakOvr}
                </span>
                <span className="text-[10px] sm:text-xs font-black tracking-widest text-[#c084fc] uppercase bg-[#c084fc]/10 px-3.5 sm:px-4 rounded-full border border-[#c084fc]/30 inline-flex items-center justify-center h-8 sm:h-9 leading-none">
                  🎯 {draftLabel}
                </span>
                <span className={`text-[10px] sm:text-xs font-black tracking-widest uppercase px-3.5 sm:px-4 rounded-full border inline-flex items-center justify-center h-8 sm:h-9 leading-none ${isLegend ? 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30' : 'text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/30'}`}>
                  {isLegend ? 'HALL OF FAME CAREER' : 'CAREER ACCOMPLISHED'}
                </span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black text-white number-font uppercase tracking-tight mb-1">
              {player.name}
            </h1>
            <p className="text-lg sm:text-2xl font-black text-[#3b82f6] sports-font uppercase tracking-wide mb-3">
              #{player.number} · {primaryTeamName.toUpperCase()} · TEAM {teamNatName.toUpperCase()}
            </p>
            <p className="text-xs sm:text-sm text-slate-400 font-sans italic mb-6">
              {isLegend ? `Your jersey hangs proudly in the rafters of ${arenaName}.` : 'You officially hang up the skates after a hard-fought career.'}
            </p>
            
            <div className="bg-[#101410] border border-[rgba(255,255,255,0.065)] p-6 sm:p-10 rounded-xl mb-8 flex flex-col items-center shadow-lg relative overflow-hidden">
                <div className={`absolute top-0 w-full h-2 bg-gradient-to-r from-transparent via-current to-transparent ${scoreData.color} opacity-50`}></div>
                
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">FINAL CAREER SCORE</p>
                
                <h1 className="text-7xl sm:text-8xl font-black sports-font tracking-tighter text-white drop-shadow-md mb-2">
                  {scoreData.total.toLocaleString()}
                </h1>
                
                <h2 className={`text-2xl sm:text-3xl font-black sports-font uppercase tracking-widest ${scoreData.color}`}>
                  {scoreData.tier}
                </h2>
            </div>

            {stanleyCups > 0 && (
              <div className="game-panel mt-4 p-4 sm:p-6 bg-gradient-to-r from-[#F59E0B]/20 via-[#101410] to-[#F59E0B]/20 border-2 border-[#F59E0B] rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_0_25px_rgba(245,158,11,0.2)] overflow-hidden">
                
                {/* Changed to min-w-0 to allow text wrapping, removed shrink-0 */}
                <div className="flex items-center gap-3 sm:gap-4 text-left z-10 min-w-0 w-full sm:w-auto">
                  <span className="text-4xl sm:text-5xl shrink-0">💍</span>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs font-black text-[#F59E0B] uppercase tracking-widest leading-tight mb-0.5">CHAMPIONSHIP MANTLE</p>
                    <h3 className="text-lg sm:text-2xl font-black text-white sports-font leading-none break-words">
                      {stanleyCups}x STANLEY CUP CHAMPION
                    </h3>
                  </div>
                </div>

                <div className="flex items-center justify-center sm:justify-end pl-0 sm:pl-4 w-full sm:w-auto">
                  {Array.from({ length: stanleyCups }).map((_, i) => {
                    // Dynamically increase the overlap if the player has a massive dynasty
                    let overlapClass = "-ml-6 sm:-ml-6"; // Default overlap
                    if (stanleyCups > 8) overlapClass = "-ml-10 sm:-ml-12"; // Heavy overlap for 9+ cups
                    else if (stanleyCups > 5) overlapClass = "-ml-8 sm:-ml-8"; // Medium overlap for 6-8 cups

                    return (
                      <div 
                        key={i} 
                        className={`transition-transform hover:scale-110 hover:z-30 cursor-pointer ${i === 0 ? '' : overlapClass}`}
                        style={{ zIndex: i + 1 }}
                      >
                        <TrophyImage 
                          league="NHL" 
                          className="w-14 h-14 sm:w-20 sm:h-20 shrink-0 drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] filter brightness-105" 
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {(stanleyCups > 0 || Object.keys(aggregatedAwards).length > 0) && (
              <div className="pt-5 mt-5 border-t border-[rgba(255,255,255,0.065)] flex flex-wrap justify-center gap-3">
                {stanleyCups > 0 && (
                    <div key="Stanley Cup" className="text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/30 flex items-center h-9 sm:h-10 gap-2 px-3.5 rounded-lg shadow-sm">
                        <TrophyImage league="NHL" className="w-5 h-5 shrink-0 object-contain" />
                        <span className="text-xs sm:text-sm font-black uppercase tracking-widest leading-none">Stanley Cup</span>
                        <span className="text-xs sm:text-sm font-black opacity-75 ml-1 leading-none">×{stanleyCups}</span>
                    </div>
                )}
                {Object.values(aggregatedAwards).sort((a,b) => b.count - a.count).map((aw) => {
                    const text = aw.name;
                    const imgUrl = getAwardImage(text);
                    let colorClass = 'text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/30';

                    if (text.includes('Cup') || text.includes('Gold') || text.includes('Conn Smythe')) {
                        colorClass = 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30'; 
                    } else if (text.includes('Hart') || text.includes('Art Ross') || text.includes('Maurice') || text.includes('Lindsay') || text.includes('Rocket')) {
                        colorClass = 'text-[#c084fc] bg-[#c084fc]/10 border-[#c084fc]/30'; 
                    } else if (text.includes('Norris') || text.includes('Vezina') || text.includes('Selke') || text.includes('Calder')) {
                        colorClass = 'text-[#22E748] bg-[#22E748]/10 border-[#22E748]/30'; 
                    } else if (text.includes('Silver') || text.includes('Bronze')) {
                        colorClass = 'text-slate-300 bg-slate-500/10 border-slate-500/30'; 
                    }

                    return (
                        <div key={text} className={`${colorClass} border flex items-center h-9 sm:h-10 gap-2 px-3.5 rounded-lg shadow-sm`}>
                            {imgUrl && (
                              <img
                                src={imgUrl}
                                alt=""
                                className="w-5 h-5 shrink-0 object-contain"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                            )}
                            <span className="text-xs sm:text-sm font-black uppercase tracking-widest leading-none">{text}</span>
                            <span className="text-xs sm:text-sm font-black opacity-75 ml-1 leading-none">×{aw.count}</span>
                        </div>
                    );
                })}
              </div>
            )}
          </div>

          <div className="game-panel p-4 sm:p-6 bg-[#0a0d0a] border border-[rgba(255,255,255,0.065)]">
            <h3 className="text-xs sm:text-sm font-bold text-slate-400 tracking-widest uppercase mb-3 ml-2 font-sans">
              PRO CAREER TOTALS
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-center mb-6">
             <div className="bg-[#101410] p-4 rounded-xl border border-[rgba(255,255,255,0.04)] flex flex-col items-center col-span-1 sm:col-span-3">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-[rgba(255,255,255,0.065)] pb-2 w-full mb-3">REGULAR SEASON</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 w-full divide-x divide-[rgba(255,255,255,0.05)]">
                    <div className="text-center">
                      <p className="text-xl sm:text-3xl font-black text-[#22E748] sports-font leading-none mb-1">
                        {isGoalie ? (proShots > 0 ? (proSaves / proShots).toFixed(3).replace('0.', '.') : '.000') : proGoals}
                      </p>
                      <p className="text-[9px] font-bold text-slate-500 uppercase leading-none tracking-widest">{isGoalie ? 'SV%' : 'GOALS'}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl sm:text-3xl font-black text-white sports-font leading-none mb-1">
                        {isGoalie ? (proGames > 0 ? ((proShots - proSaves) / proGames).toFixed(2) : '0.00') : proAssists}
                      </p>
                      <p className="text-[9px] font-bold text-slate-500 uppercase leading-none tracking-widest">{isGoalie ? 'GAA' : 'ASSISTS'}</p>
                    </div>
                    <div className="text-center hidden sm:block">
                      <p className="text-xl sm:text-3xl font-black text-sky-400 sports-font leading-none mb-1">
                        {isGoalie ? '60:00' : formattedToi}
                      </p>
                      <p className="text-[9px] font-bold text-slate-500 uppercase leading-none tracking-widest">AVG TOI</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl sm:text-3xl font-black text-white sports-font leading-none mb-1">{proGames}</p>
                      <p className="text-[9px] font-bold text-slate-500 uppercase leading-none tracking-widest">GP</p>
                    </div>
                </div>
              </div>

              <div className="bg-[#101410] p-4 rounded-xl border border-[rgba(255,255,255,0.04)] flex flex-col items-center col-span-1 sm:col-span-2">
                <p className="text-[10px] font-bold text-[#F59E0B] uppercase tracking-widest border-b border-[rgba(255,255,255,0.065)] pb-2 w-full mb-3">PRO PLAYOFFS</p>
                <div className="grid grid-cols-3 w-full divide-x divide-[rgba(255,255,255,0.05)]">
                    <div className="text-center">
                      <p className="text-xl sm:text-3xl font-black text-white sports-font leading-none mb-1">
                        {isGoalie ? (poShots > 0 ? (poSaves / poShots).toFixed(3).replace('0.', '.') : '.000') : poGoals}
                      </p>
                      <p className="text-[9px] font-bold text-slate-500 uppercase leading-none tracking-widest">{isGoalie ? 'SV%' : 'GOALS'}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl sm:text-3xl font-black text-white sports-font leading-none mb-1">
                        {isGoalie ? (poGames > 0 ? ((poShots - poSaves) / poGames).toFixed(2) : '0.00') : poAssists}
                      </p>
                      <p className="text-[9px] font-bold text-slate-500 uppercase leading-none tracking-widest">{isGoalie ? 'GAA' : 'ASSISTS'}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl sm:text-3xl font-black text-white sports-font leading-none mb-1">{poGames}</p>
                      <p className="text-[9px] font-bold text-slate-500 uppercase leading-none tracking-widest">GP</p>
                    </div>
                </div>
              </div>
              
              <div className="bg-[#101410] p-4 rounded-xl border border-[#3b82f6]/30 flex flex-col items-center justify-center min-h-[90px] col-span-1 sm:col-span-2 shadow-inner">
                <p className="text-2xl sm:text-4xl font-black text-[#3b82f6] sports-font leading-none mb-2 drop-shadow-md">{formatMoney(player.stats?.peakValue || player.stats?.value || 50000)}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase leading-none tracking-widest">PEAK VALUE</p>
              </div>
              <div className="bg-[#101410] p-4 rounded-xl border border-[#22E748]/30 flex flex-col items-center justify-center min-h-[90px] col-span-1 sm:col-span-3 shadow-inner">
                <p className="text-2xl sm:text-4xl font-black text-[#22E748] sports-font leading-none mb-2 drop-shadow-md">{formatMoney(player.stats?.careerEarnings || player.stats?.earnings || 0)}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase leading-none tracking-widest">CAREER EARNINGS</p>
              </div>
            </div>

            {otherGames > 0 && (
              <>
                <h3 className="text-xs sm:text-sm font-bold text-slate-400 tracking-widest uppercase mb-3 ml-2 font-sans border-t border-[rgba(255,255,255,0.065)] pt-5">
                  PRE-NHL & DEVELOPMENT TOTALS
                </h3>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-[#101410] p-4 rounded-xl border border-[rgba(255,255,255,0.04)] flex flex-col items-center justify-center">
                    <p className="text-xl sm:text-3xl font-black text-[#22E748] sports-font leading-none mb-2">
                      {isGoalie ? (otherShots > 0 ? (otherSaves / otherShots).toFixed(3).replace('0.', '.') : '.000') : otherGoals}
                    </p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase leading-none tracking-widest">{isGoalie ? 'SV%' : 'GOALS'}</p>
                  </div>
                  <div className="bg-[#101410] p-4 rounded-xl border border-[rgba(255,255,255,0.04)] flex flex-col items-center justify-center">
                    <p className="text-xl sm:text-3xl font-black text-white sports-font leading-none mb-2">
                      {isGoalie ? (otherGames > 0 ? ((otherShots - otherSaves) / otherGames).toFixed(2) : '0.00') : otherAssists}
                    </p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase leading-none tracking-widest">{isGoalie ? 'GAA' : 'ASSISTS'}</p>
                  </div>
                  <div className="bg-[#101410] p-4 rounded-xl border border-[rgba(255,255,255,0.04)] flex flex-col items-center justify-center">
                    <p className="text-xl sm:text-3xl font-black text-white sports-font leading-none mb-2">{otherGames}</p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase leading-none tracking-widest">GAMES PLAYED</p>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="game-panel p-4 sm:p-6 bg-[#0a0d0a] border border-[rgba(255,255,255,0.065)] text-left">
            <h3 className="text-xs sm:text-sm font-bold text-slate-400 tracking-widest uppercase mb-4 font-sans border-b border-[rgba(255,255,255,0.065)] pb-3">
              CAREER HISTORY
            </h3>

            {clubRows.length === 0 && !intlStint ? (
              <p className="text-slate-500 text-sm italic font-sans">No detailed club history recorded for this career.</p>
            ) : (
              <div className="space-y-6">
                {clubRows.length > 0 && (
                  <div className="-mx-4 sm:-mx-6 overflow-x-auto">
                    <table className="w-full min-w-[500px] sm:min-w-[760px] text-left font-sans whitespace-nowrap">
                      {/* Two tiers of heading, the way a register does it: the
                          season's columns and the playoffs' columns carry the
                          same four labels, and the only thing telling them
                          apart is the band above them. */}
                      <thead>
                        <tr className="text-[9px] font-black uppercase tracking-widest text-slate-600">
                          <th className="px-4 py-1.5" colSpan={3}></th>
                          <th className="px-1.5 sm:px-2 py-1.5 text-center border-l border-[rgba(255,255,255,0.065)]" colSpan={5}>
                            Regular Season
                          </th>
                          <th className="px-1.5 sm:px-2 py-1.5 text-center border-l border-[rgba(255,255,255,0.065)]" colSpan={4}>
                            Playoffs
                          </th>
                        </tr>
                        <tr className="bg-[#101410] border-y border-[rgba(255,255,255,0.065)] text-[10px] font-bold uppercase tracking-widest text-slate-500">
                          <th className="px-3 sm:px-4 py-2.5 font-medium">Season</th>
                          <th className="px-1.5 sm:px-2 py-2.5 font-medium">Team</th>
                          <th className="px-1.5 sm:px-2 py-2.5 font-medium">Lge</th>
                          <th className="px-1.5 sm:px-2 py-2.5 font-medium text-center border-l border-[rgba(255,255,255,0.065)]">GP</th>
                          {/* A goalie is quoted by his record first. The table
                              had save percentage, goals against and shutouts
                              and no way at all to say how a season went. */}
                          {isGoalie && <th className="px-1.5 sm:px-2 py-2.5 font-medium text-center">W&ndash;L&ndash;OTL</th>}
                          <th className="px-1.5 sm:px-2 py-2.5 font-medium text-center">{isGoalie ? 'SV%' : 'G'}</th>
                          <th className="px-1.5 sm:px-2 py-2.5 font-medium text-center">{isGoalie ? 'GAA' : 'A'}</th>
                          <th className="px-1.5 sm:px-2 py-2.5 font-medium text-center">{isGoalie ? 'SO' : 'Pts'}</th>
                          {!isGoalie && <th className="px-1.5 sm:px-2 py-2.5 font-medium text-center">+/-</th>}
                          <th className="px-1.5 sm:px-2 py-2.5 font-medium text-center border-l border-[rgba(255,255,255,0.065)]">GP</th>
                          <th className="px-1.5 sm:px-2 py-2.5 font-medium text-center">{isGoalie ? 'SV%' : 'G'}</th>
                          <th className="px-1.5 sm:px-2 py-2.5 font-medium text-center">{isGoalie ? 'GAA' : 'A'}</th>
                          <th className="px-1.5 sm:px-2 py-2.5 font-medium text-center">{isGoalie ? 'SO' : 'Pts'}</th>
                          <th className="w-full"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[rgba(255,255,255,0.04)] text-sm">
                        {clubRows.map((r, idx) => {
                          const sv = r.shots > 0 ? (r.saves / r.shots) : 0;
                          const gaa = r.games > 0 ? ((r.shots - r.saves) / r.games) : 0;
                          const poSv = r.playoffShots > 0 ? (r.playoffSaves / r.playoffShots) : 0;
                          const poGaa = r.playoffGames > 0 ? ((r.playoffShots - r.playoffSaves) / r.playoffGames) : 0;
                          const po = r.playoffGames > 0;
                          const row = (
                            <tr key={`${r.year}-${r.team}-${idx}`} className="hover:bg-[rgba(255,255,255,0.025)] transition-colors">
                              <td className="px-3 sm:px-4 py-2.5 font-bold text-slate-300 tabular-nums text-[11px] sm:text-sm">
                                <span className="flex items-center gap-2">
                                  <span>{r.year}&ndash;{String((r.year + 1) % 100).padStart(2, '0')}</span>
                                  <Letter captain={r.isCaptain} alternate={r.isAlternate && !r.isCaptain} />
                                </span>
                              </td>
                              <td className="px-1.5 sm:px-2 py-2.5">
                                <span className="flex items-center gap-2 min-w-0">
                                  <span className="shrink-0 w-6 h-6 flex items-center justify-center">
                                    <TeamLogo teamId={r.team} league={r.league} isAHL={r.league === 'AHL'} size="tiny" />
                                  </span>
                                  {/* On a phone the crest carries the club on its
                                      own: leaving the name in pushed every
                                      number off the right-hand edge, so the
                                      first thing a career history showed was no
                                      statistics at all. On anything wider the
                                      name is back, capped, because
                                      "Wilkes-Barre/Scranton Penguins" is
                                      three times the width of "Oilers" and one
                                      club like it pushed the hardware column
                                      clean off the end of the table. */}
                                  <span className="hidden sm:inline font-bold text-white truncate max-w-[150px] md:max-w-[220px]" title={getFullTeamName(r.team, r.league)}>{getFullTeamName(r.team, r.league)}</span>
                                </span>
                              </td>
                              <td className="px-1.5 sm:px-2 py-2.5 text-[11px] font-black uppercase tracking-wider text-slate-500">{r.league}</td>

                              <td className="px-1.5 sm:px-2 py-2.5 text-center font-black number-font border-l border-[rgba(255,255,255,0.065)] text-slate-200">{r.games || 0}</td>
                              {isGoalie && (
                                <td className="px-1.5 sm:px-2 py-2.5 text-center font-black number-font text-slate-200 whitespace-nowrap">
                                  {(r.wins || 0)}&ndash;{(r.losses || 0)}&ndash;{(r.otl || 0)}
                                </td>
                              )}
                              <td className="px-1.5 sm:px-2 py-2.5 text-center font-black number-font text-[#22E748]">
                                {isGoalie ? sv.toFixed(3).replace('0.', '.') : (r.goals || 0)}
                              </td>
                              <td className="px-1.5 sm:px-2 py-2.5 text-center font-black number-font text-slate-200">
                                {isGoalie ? gaa.toFixed(2) : (r.assists || 0)}
                              </td>
                              <td className="px-1.5 sm:px-2 py-2.5 text-center font-black number-font text-[#3b82f6]">
                                {isGoalie ? (r.shutouts || 0) : ((r.goals || 0) + (r.assists || 0))}
                              </td>
                              {!isGoalie && (
                                <td className={`px-1.5 sm:px-2 py-2.5 text-center font-black number-font ${
                                  (r.plusMinus || 0) > 0 ? 'text-slate-300' : (r.plusMinus || 0) < 0 ? 'text-[#ef4444]' : 'text-slate-600'}`}>
                                  {(r.plusMinus || 0) > 0 ? `+${r.plusMinus}` : (r.plusMinus || 0)}
                                </td>
                              )}

                              {/* A year with no playoffs gets dashes rather than
                                  a row of zeroes, which is the difference between
                                  "did not qualify" and "played and scored none". */}
                              <td className="px-1.5 sm:px-2 py-2.5 text-center font-black number-font border-l border-[rgba(255,255,255,0.065)] text-slate-200">
                                {po ? r.playoffGames : <span className="text-slate-700">&ndash;</span>}
                              </td>
                              <td className="px-1.5 sm:px-2 py-2.5 text-center font-black number-font text-[#22E748]">
                                {po ? (isGoalie ? poSv.toFixed(3).replace('0.', '.') : (r.playoffGoals || 0)) : <span className="text-slate-700">&ndash;</span>}
                              </td>
                              <td className="px-1.5 sm:px-2 py-2.5 text-center font-black number-font text-slate-200">
                                {po ? (isGoalie ? poGaa.toFixed(2) : (r.playoffAssists || 0)) : <span className="text-slate-700">&ndash;</span>}
                              </td>
                              <td className="px-1.5 sm:px-2 py-2.5 text-center font-black number-font text-[#3b82f6]">
                                {po
                                  ? (isGoalie ? (r.playoffShutouts || 0) : ((r.playoffGoals || 0) + (r.playoffAssists || 0)))
                                  : <span className="text-slate-700">&ndash;</span>}
                              </td>

                              <td className="w-full"></td>
                            </tr>
                          );

                          // WHAT THE YEAR WON, UNDER THE YEAR.
                          //
                          // This was a last column, and with a goalie's record
                          // in the table there were twelve of them: the one
                          // column anybody actually reads was the one hanging
                          // off the right-hand edge. A trophy is not a
                          // statistic, so it does not need to be in the grid.
                          // It sits under its own season, where it has the
                          // whole width and can wrap.
                          const hasHardware = r.titleWon
                            || (r.awards || []).some(aw => !aw.toLowerCase().includes('1st team all-star'));
                          if (!hasHardware) return row;
                          return (
                            <Fragment key={`${r.year}-${r.team}-${idx}-g`}>
                              {row}
                              {/* No rule between a season and its own
                                  hardware: the divider the table puts between
                                  every pair of rows made the trophies look
                                  like they belonged to the year below. */}
                              <tr style={{ borderTopWidth: 0 }}>
                                <td className="px-3 sm:px-4 pb-2.5 pt-0 whitespace-normal" colSpan={12}>
                                  <Hardware season={r} />
                                </td>
                              </tr>
                            </Fragment>
                          );
                        })}
                      </tbody>

                      {/* One line a league, which is the number a career gets
                          remembered by. The old screen had career totals in
                          tiles above and nothing tying them to where they were
                          made, so 641 games said nothing about how many of them
                          were in the NHL. */}
                      <tfoot className="border-t-2 border-[rgba(255,255,255,0.1)]">
                        {leagueTotals.filter(t => t.games > 0).map(t => {
                          const sv = t.shots > 0 ? (t.saves / t.shots) : 0;
                          const gaa = t.games > 0 ? ((t.shots - t.saves) / t.games) : 0;
                          const poSv = t.poShots > 0 ? (t.poSaves / t.poShots) : 0;
                          const poGaa = t.poGames > 0 ? ((t.poShots - t.poSaves) / t.poGames) : 0;
                          const po = t.poGames > 0;
                          return (
                            <tr key={t.league} className="bg-[#101410] text-sm">
                              <td className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500" colSpan={3}>
                                {t.league} Totals
                                <span className="text-slate-600 font-bold"> · {t.seasons} {t.seasons === 1 ? 'season' : 'seasons'}</span>
                              </td>
                              <td className="px-1.5 sm:px-2 py-2.5 text-center font-black number-font border-l border-[rgba(255,255,255,0.065)] text-white">{t.games}</td>
                              {isGoalie && (
                                <td className="px-1.5 sm:px-2 py-2.5 text-center font-black number-font text-white whitespace-nowrap">
                                  {t.wins}&ndash;{t.losses}&ndash;{t.otl}
                                </td>
                              )}
                              <td className="px-1.5 sm:px-2 py-2.5 text-center font-black number-font text-[#22E748]">
                                {isGoalie ? sv.toFixed(3).replace('0.', '.') : t.goals}
                              </td>
                              <td className="px-1.5 sm:px-2 py-2.5 text-center font-black number-font text-white">
                                {isGoalie ? gaa.toFixed(2) : t.assists}
                              </td>
                              <td className="px-1.5 sm:px-2 py-2.5 text-center font-black number-font text-[#3b82f6]">
                                {isGoalie ? t.shutouts : (t.goals + t.assists)}
                              </td>
                              {!isGoalie && (
                                <td className={`px-1.5 sm:px-2 py-2.5 text-center font-black number-font ${
                                  t.plusMinus > 0 ? 'text-white' : t.plusMinus < 0 ? 'text-[#ef4444]' : 'text-slate-600'}`}>
                                  {t.plusMinus > 0 ? `+${t.plusMinus}` : t.plusMinus}
                                </td>
                              )}
                              <td className="px-1.5 sm:px-2 py-2.5 text-center font-black number-font border-l border-[rgba(255,255,255,0.065)] text-white">
                                {po ? t.poGames : <span className="text-slate-700">&ndash;</span>}
                              </td>
                              <td className="px-1.5 sm:px-2 py-2.5 text-center font-black number-font text-[#22E748]">
                                {po ? (isGoalie ? poSv.toFixed(3).replace('0.', '.') : t.poGoals) : <span className="text-slate-700">&ndash;</span>}
                              </td>
                              <td className="px-1.5 sm:px-2 py-2.5 text-center font-black number-font text-white">
                                {po ? (isGoalie ? poGaa.toFixed(2) : t.poAssists) : <span className="text-slate-700">&ndash;</span>}
                              </td>
                              <td className="px-1.5 sm:px-2 py-2.5 text-center font-black number-font text-[#3b82f6]">
                                {po ? (isGoalie ? t.poShutouts : (t.poGoals + t.poAssists)) : <span className="text-slate-700">&ndash;</span>}
                              </td>
                              <td></td>
                            </tr>
                          );
                        })}
                      </tfoot>
                    </table>
                  </div>
                )}

                {/* INTERNATIONAL.
                    A tournament is not a season and never had playoffs, so it
                    keeps a table of its own rather than being forced into the
                    columns above. The letter he wore for his country is a pill
                    against each tournament, the same pill a club season gets,
                    and the heading says how many of them he wore it for. */}
                {intlStint && (
                  <div>
                    <div className="flex items-center gap-2.5 mb-2 px-0.5">
                      {natObj?.img && (
                        <img src={natObj.img} alt="" className="w-6 h-6 shrink-0 rounded-full object-cover border border-[rgba(255,255,255,0.1)]" />
                      )}
                      {/* The letter and the games both lived on this line and
                          both said something the rows underneath already say:
                          the C sits against each tournament he wore it for,
                          and the games are in the GP column. */}
                      <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                        Team {fullCountryName}
                      </h4>
                    </div>
                    <div className="-mx-4 sm:-mx-6 overflow-x-auto">
                      <table className="w-full min-w-[560px] text-left font-sans whitespace-nowrap">
                        <thead>
                          <tr className="bg-[#101410] border-y border-[rgba(255,255,255,0.065)] text-[10px] font-bold uppercase tracking-widest text-slate-500">
                            <th className="px-4 py-2.5 font-medium">Tournament</th>
                            <th className="px-2 py-2.5 font-medium text-center border-l border-[rgba(255,255,255,0.065)]">GP</th>
                            <th className="px-2 py-2.5 font-medium text-center">{isGoalie ? 'SV%' : 'G'}</th>
                            <th className="px-2 py-2.5 font-medium text-center">{isGoalie ? 'GAA' : 'A'}</th>
                            <th className="px-2 py-2.5 font-medium text-center">{isGoalie ? 'SO' : 'Pts'}</th>
                            <th className="px-4 py-2.5 font-medium w-full border-l border-[rgba(255,255,255,0.065)]">Hardware</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[rgba(255,255,255,0.04)] text-sm">
                          {intlStint.seasons.map((t, tIdx) => {
                            const sv = t.shots > 0 ? (t.saves / t.shots) : 0;
                            const gaa = t.games > 0 ? ((t.shots - t.saves) / t.games) : 0;
                            return (
                              <tr key={tIdx} className="hover:bg-[rgba(255,255,255,0.025)] transition-colors">
                                <td className="px-4 py-2.5 font-bold text-slate-300">
                                  <span className="flex items-center gap-2">
                                    <span>{t.tournamentName}</span>
                                    <Letter captain={t.isCaptain} alternate={t.isAlternate && !t.isCaptain} />
                                  </span>
                                </td>
                                <td className="px-2 py-2.5 text-center font-black number-font border-l border-[rgba(255,255,255,0.065)] text-slate-200">{t.games || 0}</td>
                                <td className="px-2 py-2.5 text-center font-black number-font text-[#22E748]">
                                  {isGoalie ? sv.toFixed(3).replace('0.', '.') : (t.goals || 0)}
                                </td>
                                <td className="px-2 py-2.5 text-center font-black number-font text-slate-200">
                                  {isGoalie ? gaa.toFixed(2) : (t.assists || 0)}
                                </td>
                                <td className="px-2 py-2.5 text-center font-black number-font text-[#3b82f6]">
                                  {isGoalie ? (t.shutouts || 0) : ((t.goals || 0) + (t.assists || 0))}
                                </td>
                                <td className="px-4 py-2 w-full min-w-[180px] whitespace-normal border-l border-[rgba(255,255,255,0.065)]">
                                  <Hardware season={t} />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* THE DRAFT CLASS.
              A career used to end with its totals sitting next to nothing.
              These are the players who came up with you, where they finished,
              and where you finished among them. */}
          {(() => {
            // Goalies are ranked on shutouts. They used to be filtered out of
            // the class entirely and saw no table at all.
            const table = classTable(player.peers, 8, player.pos);
            if (!table.length) return null;
            const mine = isGoalie
              ? (player.stats?.nhl?.shutouts || 0)
              : (player.stats?.nhl?.goals || 0) + (player.stats?.nhl?.assists || 0);
            const mineGp = player.stats?.nhl?.games || 0;
            const unit = peerUnit(isGoalie);
            const myCups = (player.seasonHistory || []).filter(ss => ss.titleWon).length;
            const myTrophies = careerTrophies(player).individual;
            const rows = [
              ...table.map(c => ({
                name: c.name, nat: c.nat, pos: c.pos, gp: c.career.gp,
                pts: peerValue(c, isGoalie), pick: c.pick, team: c.draftedBy,
                cups: c.career.titles || 0, trophies: c.career.trophies || 0, me: false
              })),
              { name: player.name, nat: player.nat, pos: player.pos, gp: mineGp, pts: mine,
                pick: player.draftPick, team: player.draftTeam,
                cups: myCups, trophies: myTrophies, me: true }
            ].sort((x, y) => y.pts - x.pts).slice(0, 9);

            return (
              <div className="game-panel p-4 sm:p-6 bg-[#0a0d0a] border border-[rgba(255,255,255,0.065)]">
                <h3 className="text-xs sm:text-sm font-bold text-slate-400 tracking-widest uppercase mb-1 ml-2 font-sans">
                  YOUR DRAFT CLASS
                </h3>
                {/* Which players, and on what. The table used to rank the
                    whole year group on one number without saying whose
                    number it was, so a defenceman was placed ninth behind
                    eight centres. */}
                <p className="text-[10px] text-slate-500 mb-3 ml-2">
                  The {groupName(posGroup(player.pos))} of your year, by NHL career {unit}.
                </p>
                {/* A header, because the purple number had nothing anywhere
                    on the screen telling anyone what it was. */}
                <div className="flex items-center gap-3 px-3 sm:px-4 pb-1.5 text-[9px] font-black uppercase tracking-widest text-slate-600">
                  <span className="w-5 shrink-0" />
                  <span className="flex-1">Player</span>
                  <span className="w-20 text-right">Drafted</span>
                  <span className="w-20 text-right">Awards</span>
                  <span className="w-14 text-right">Games</span>
                  <span className="w-20 text-right">{isGoalie ? 'Shutouts' : 'Points'}</span>
                </div>
                <div className="rounded-xl border border-[rgba(255,255,255,0.05)] overflow-hidden">
                  {rows.map((r, i) => (
                    <div
                      key={`${r.name}-${i}`}
                      className={`flex items-center gap-3 px-3 sm:px-4 py-2.5 text-sm border-b border-[rgba(255,255,255,0.04)] last:border-0 ${
                        r.me ? 'bg-[#22E748]/10' : 'bg-[#101410]'}`}
                    >
                      <span className="w-5 text-[10px] font-black number-font text-slate-600 shrink-0">{i + 1}</span>
                      <span className={`flex-1 truncate font-bold ${r.me ? 'text-[#22E748]' : 'text-slate-300'}`}>
                        {r.name}
                      </span>
                      {/* Where he was taken and by whom, which is the thing
                          that makes this a draft class rather than a list. */}
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 shrink-0 w-20 text-right">
                        {r.pick ? `#${r.pick} ${r.team || ''}` : ''}
                      </span>
                      {/* What they won while they were doing it. The class
                          used to be ranked on one number with no sense of
                          whether the man above you had four rings. */}
                      <span className="shrink-0 w-20 text-right text-[10px] number-font">
                        {r.cups > 0 && <span className="text-[#F59E0B] font-bold">{r.cups} cup{r.cups === 1 ? '' : 's'}</span>}
                        {r.cups > 0 && r.trophies > 0 && <span className="text-slate-700"> · </span>}
                        {r.trophies > 0 && <span className="text-[#c084fc] font-bold">{r.trophies}</span>}
                        {r.cups === 0 && r.trophies === 0 && <span className="text-slate-700">None</span>}
                      </span>
                      <span className="text-[11px] number-font text-slate-500 shrink-0 w-14 text-right">{r.gp} GP</span>
                      <span className={`font-black number-font shrink-0 w-20 text-right ${r.me ? 'text-[#22E748]' : 'text-white'}`}>
                        {r.pts}<span className="text-[9px] font-bold text-slate-600 ml-1">{unit}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          <div className="text-center pt-4">
            <button 
              onClick={() => {
                const savedCareers = JSON.parse(localStorage.getItem('hockey_career_history') || '[]');
                const nhlGames = player.stats?.nhl?.games || 0;
                const nhlGoals = player.stats?.nhl?.goals || 0;
                const nhlAssists = player.stats?.nhl?.assists || 0;
                const nhlPoints = nhlGoals + nhlAssists;
                const nhlSaves = player.stats?.nhl?.saves || 0;
                const nhlShots = player.stats?.nhl?.shots || 0;
                const svPct = nhlShots > 0 ? (nhlSaves / nhlShots).toFixed(3).replace('0.', '.') : '.000';

                // One definition, shared with the dashboard's trophy cell,
                // which used to count cups plus majors plus medals while this
                // ran its own filter and produced a different number for the
                // same career.
                const totalIndividualAwards = careerTrophies(player).individual;

                const newCareer = {
                  id: Date.now(), name: player.name, pos: player.pos, number: player.number,
                  games: nhlGames, points: isGoalie ? svPct : nhlPoints,
                  cups: (player.seasonHistory || []).filter(s => s.league === 'NHL' && s.titleWon).length,
                  awards: totalIndividualAwards, earnings: player.stats?.careerEarnings || player.stats?.earnings || 0,
                  team: primaryTeamName, logo: primaryTeam, league: primaryLeague,
                  isLegend,
                  careerScore: scoreData.total, 
                };
                
                localStorage.setItem('hockey_career_history', JSON.stringify([newCareer, ...savedCareers]));
                handleNewGame();
              }} 
              className="btn-primary w-full sm:w-auto py-4 px-12 rounded-xl text-lg sm:text-xl cursor-pointer sports-font tracking-widest uppercase shadow-2xl"
            >
              START NEW CAREER
            </button>
          </div>

        </div>
      </div>
    );
  })();
}