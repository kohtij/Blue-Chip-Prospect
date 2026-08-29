import { useAppContext } from '../AppContext';
import { getFullTeamName } from '../utils/appHelpers';
import { formatMoney } from '../utils/gameHelpers';
import { getAwardImage } from '../data/awards';
import TeamLogo from '../components/TeamLogo';
import TrophyImage from '../components/TrophyImage';
import { useMemo, useState } from 'react';
import { computeCareerScore } from '../utils/careerScore';

export default function RetirementScreen() {
  const { handleNewGame, player, safeNationalities } = useAppContext();
  const scoreData = useMemo(() => computeCareerScore(player), [player]);
  const [expandedSeasonIdx, setExpandedSeasonIdx] = useState(null);

  const natObj = (safeNationalities || []).find(n => n.id === player.nat);
  const fullCountryName = natObj?.name || player.nat || 'UNKNOWN';

  return (() => {
    const isLegend = player.idolatry >= 800;
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

        if (intlAwards.length > 0) {
            // Deterministic simulation based on season year & player state (pure function)
            const seed = (season.year * 17 + (player.number || 1) * 31) % 100;
            const simGames = 5 + (seed % 3); // 5 to 7 games
            let simGoals = 0, simAssists = 0, simSaves = 0, simShots = 0, simShutouts = 0, simPM = 0;

            if (player.pos === 'G') {
                simShots = simGames * (20 + (seed % 15));
                simSaves = Math.floor(simShots * (0.900 + ((seed % 40) * 0.001)));
                simShutouts = seed % 2;
            } else {
                const isDef = ['LD', 'RD'].includes(player.pos);
                simGoals = Math.floor(simGames * (isDef ? (0.1 + (seed % 20) * 0.01) : (0.3 + (seed % 30) * 0.01)));
                simAssists = Math.floor(simGames * (isDef ? (0.2 + (seed % 30) * 0.01) : (0.4 + (seed % 30) * 0.01)));
                simPM = (seed % 12) - 2;
            }

            // Detect tournament name from the award string and prepend the year
            const firstAward = intlAwards[0] || '';
            let baseName = 'International Tournament';
            if (firstAward.includes('World Juniors') || firstAward.includes('WJC')) {
                baseName = 'World Junior Championship';
            } else if (firstAward.includes('Olympics')) {
                baseName = 'Winter Olympic Games';
            } else if (firstAward.includes('World Championship')) {
                baseName = 'IIHF World Championship';
            }

            const tournamentName = `${season.year} ${baseName}`;

            intlSeasons.push({
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

        // Group consecutive seasons for the SAME team into a chronological stint
        if (!currentStint || currentStint.team !== season.team || currentStint.league !== season.league) {
            if (currentStint) {
                teamStints.push(currentStint);
            }
            currentStint = {
                team: season.team, league: season.league,
                startYear: season.year, endYear: season.year,
                games: 0, goals: 0, assists: 0, saves: 0, shots: 0, shutouts: 0, plusMinus: 0,
                seasons: []
            };
        }

        currentStint.endYear = Math.max(currentStint.endYear, season.year);
        currentStint.games += season.games || 0;
        currentStint.goals += season.goals || 0;
        currentStint.assists += season.assists || 0;
        currentStint.saves += season.saves || 0;
        currentStint.shots += season.shots || 0;
        currentStint.shutouts += season.shutouts || 0;
        currentStint.plusMinus += season.plusMinus || 0;
        currentStint.seasons.push({ ...season, awards: clubAwards }); 
    });

    if (currentStint) {
        teamStints.push(currentStint);
    }
    if (intlSeasons.length > 0) {
        const totalIntlGames = intlSeasons.reduce((sum, s) => sum + s.games, 0);
        teamStints.push({
            team: player.nat || 'UNK',
            league: 'INTL',
            startYear: intlSeasons[0].year,
            endYear: intlSeasons[intlSeasons.length - 1].year,
            games: totalIntlGames,
            seasons: intlSeasons,
            isNational: true
        });
    }

    let primaryTeam = player.team;
    if (teamStints.length > 0) {
      const sortedStints = [...teamStints].filter(s => !s.isNational).sort((a, b) => b.games - a.games);
      if (sortedStints.length > 0) primaryTeam = sortedStints[0].team;
    }
    const primaryTeamName = getFullTeamName(primaryTeam, player.league);

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

    const arenaName = player.league === 'NHL' && NHL_ARENAS[primaryTeam] ? NHL_ARENAS[primaryTeam] : `${cityName} Arena`;
    const stanleyCups = (player.seasonHistory || []).filter(s => s.league === 'NHL' && s.titleWon).length;
    
    const aggregatedAwards = {};
    (player.seasonHistory || []).forEach(s => {
      (s.awards || []).forEach(aw => {
        let key = aw.replace(/^\d{4}\s/, '').replace(' Trophy', '').replace(' Memorial', '').replace(/\s*\(.+?\)\s*$/, '').trim();
        
        if (key.toLowerCase().includes('1st team all-star')) return;
        
        key = key.replace(/\s\d{4}$/, '');
        key = key.replace('Gold, Olympics', 'Olympic Gold');
        key = key.replace('Gold, World Juniors', 'WJC Gold');
        key = key.replace('Gold, World Championship', 'WC Gold');
        key = key.replace('Promotion, World Championship', 'WC Promotion');
        key = key.replace('Survival, World Championship', 'WC Survival');

        if (!aggregatedAwards[key]) aggregatedAwards[key] = { name: key, count: 0 };
        aggregatedAwards[key].count++;
      });
    });

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 bg-[#040505] text-white font-sans">
        <div className="w-full max-w-4xl space-y-4">
          
          <div className="game-panel p-6 sm:p-10 text-center border-2 border-[#3b82f6] relative overflow-hidden bg-gradient-to-b from-[#101410] to-[#080a08] shadow-[0_0_30px_rgba(59,130,246,0.15)]">
            <div className="flex flex-wrap justify-between items-center gap-2 mb-4 sm:mb-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] sm:text-xs font-black tracking-widest text-slate-400 uppercase bg-black/40 px-3.5 sm:px-4 rounded-full border border-slate-700/80 inline-flex items-center justify-center h-8 sm:h-9 leading-none">
                  RETIRED AT AGE {player.age}
                </span>
                <span className="text-[10px] sm:text-xs font-black tracking-widest text-[#22E748] uppercase bg-[#22E748]/10 px-3.5 sm:px-4 rounded-full border border-[#22E748]/30 inline-flex items-center justify-center h-8 sm:h-9 leading-none">
                  PEAK RATING · {peakOvr}
                </span>
                <span className="text-[10px] sm:text-xs font-black tracking-widest text-[#c084fc] uppercase bg-[#c084fc]/10 px-3.5 sm:px-4 rounded-full border border-[#c084fc]/30 inline-flex items-center justify-center h-8 sm:h-9 leading-none">
                  🎯 {draftLabel}
                </span>
              </div>
              <span className={`text-[10px] sm:text-xs font-black tracking-widest uppercase px-3.5 sm:px-4 rounded-full border inline-flex items-center justify-center h-8 sm:h-9 leading-none ${isLegend ? 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30' : 'text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/30'}`}>
                {isLegend ? 'HALL OF FAME CAREER' : 'CAREER ACCOMPLISHED'}
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black text-white number-font uppercase tracking-tight mb-1">
              {player.name}
            </h1>
            <p className="text-lg sm:text-2xl font-black text-[#3b82f6] sports-font uppercase tracking-wide mb-3">
              #{player.number} · {primaryTeamName.toUpperCase()} · TEAM {fullCountryName.toUpperCase()}
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
              <div className="game-panel mt-4 p-4 sm:p-6 bg-gradient-to-r from-[#F59E0B]/20 via-[#101410] to-[#F59E0B]/20 border-2 border-[#F59E0B] rounded-2xl flex items-center justify-between shadow-[0_0_25px_rgba(245,158,11,0.2)] overflow-hidden">
                <div className="flex items-center gap-4 text-left shrink-0 z-10">
                  <span className="text-4xl sm:text-5xl">💍</span>
                  <div>
                    <p className="text-xs font-black text-[#F59E0B] uppercase tracking-widest">CHAMPIONSHIP MANTLE</p>
                    <h3 className="text-xl sm:text-2xl font-black text-white sports-font">
                      {stanleyCups}x STANLEY CUP CHAMPION
                    </h3>
                  </div>
                </div>

                <div className="flex items-center justify-end pl-4">
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
                <p className="text-2xl sm:text-4xl font-black text-[#3b82f6] sports-font leading-none mb-2 drop-shadow-md">{formatMoney(player.stats?.value || 50000)}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase leading-none tracking-widest">PEAK VALUE</p>
              </div>
              <div className="bg-[#101410] p-4 rounded-xl border border-[#22E748]/30 flex flex-col items-center justify-center min-h-[90px] col-span-1 sm:col-span-3 shadow-inner">
                <p className="text-2xl sm:text-4xl font-black text-[#22E748] sports-font leading-none mb-2 drop-shadow-md">{formatMoney(player.stats?.earnings || 0)}</p>
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

            {!player.seasonHistory || player.seasonHistory.length === 0 ? (
              <p className="text-slate-500 text-sm italic font-sans">No detailed club history recorded for this career.</p>
            ) : (
              <div className="space-y-3">
                {teamStints.map((stint, rawIdx) => {
                  const isExpanded = expandedSeasonIdx === rawIdx;
                  const isG = player.pos === 'G';
                  
                  return (
                    <div key={rawIdx} className="bg-[#101410] border border-[rgba(255,255,255,0.065)] rounded-xl flex flex-col overflow-hidden transition-all duration-300">
                      <button 
                         onClick={() => setExpandedSeasonIdx(isExpanded ? null : rawIdx)} 
                         className="w-full text-left p-3 sm:p-4 flex items-center justify-between gap-2 hover:bg-[#1a2230] transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {stint.isNational ? (
                            natObj?.img ? (
                              <img src={natObj.img} alt={fullCountryName} className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-full object-cover border border-[rgba(255,255,255,0.1)]" />
                            ) : (
                              <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 bg-[#1a2230] rounded-full flex items-center justify-center border border-[rgba(255,255,255,0.1)] text-lg">🌍</div>
                            )
                          ) : (
                            <TeamLogo teamId={stint.team} league={stint.league} isAHL={stint.league === 'AHL'} size="small" className="shrink-0" />
                          )}
                          <div className="min-w-0">
                            <h4 className="text-base sm:text-lg font-black text-white sports-font leading-tight mb-0.5 break-words">
                              {stint.isNational ? `Team ${fullCountryName}` : getFullTeamName(stint.team, stint.league)}
                            </h4>
                            <p className="text-[10px] sm:text-xs text-slate-500 font-bold font-sans truncate">
                              {stint.startYear === stint.endYear ? stint.startYear : `${stint.startYear}–${stint.endYear}`} · {stint.isNational ? 'International' : stint.league}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0 flex items-center gap-3">
                          <span className="text-[10px] sm:text-sm font-black text-slate-300 font-sans whitespace-nowrap">
                            {stint.games} GP
                          </span>
                          <span className={`text-sm transition-transform duration-300 ${isExpanded ? 'rotate-180 text-[#3b82f6]' : 'text-slate-500'}`}>▼</span>
                        </div>
                      </button>

                      {isExpanded && (
                         <div className="border-t border-[rgba(255,255,255,0.05)] bg-[#0a0d0a] shadow-inner font-sans animate-fade-in overflow-x-auto">
                            <table className="w-full text-left text-sm sm:text-base whitespace-nowrap">
                                <thead className="bg-[#101410] border-b border-[rgba(255,255,255,0.05)] text-slate-500 font-bold tracking-widest uppercase text-xs">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">{stint.isNational ? 'Tournament' : 'Season'}</th>
                                        <th className="px-3 py-3 font-medium text-center">GP</th>
                                        <th className="px-3 py-3 font-medium text-center">{isG ? 'SV%' : 'G'}</th>
                                        <th className="px-3 py-3 font-medium text-center">{isG ? 'GAA' : 'A'}</th>
                                        <th className="px-3 py-3 font-medium text-center">{isG ? 'SHO' : 'PTS'}</th>
                                        <th className="px-3 py-3 font-medium text-center hidden sm:table-cell">{isG ? 'TOI' : '+/-'}</th>
                                        <th className="px-4 py-3 font-medium w-full">Hardware</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[rgba(255,255,255,0.04)] text-slate-300">
                                    {stint.seasons.map((season, sIdx) => (
                                        <tr key={sIdx} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                                            <td className="px-4 py-3.5 font-bold text-[#3b82f6] whitespace-nowrap">
                                               {season.league === 'INTL' ? season.tournamentName : `${season.year} / ${season.year + 1}`}
                                            </td>
                                            <td className="px-3 py-3.5 text-center font-black number-font text-lg">
                                               {season.games || 0}
                                            </td>
                                            <td className="px-3 py-3.5 text-center font-black text-[#22E748] number-font text-lg">
                                               {isG ? (season.shots > 0 ? (season.saves / season.shots).toFixed(3).replace('0.', '.') : '.000') : (season.goals || 0)}
                                            </td>
                                            <td className="px-3 py-3.5 text-center font-black number-font text-lg">
                                               {isG ? (season.games > 0 ? ((season.shots - season.saves) / season.games).toFixed(2) : '0.00') : (season.assists || 0)}
                                            </td>
                                            <td className="px-3 py-3.5 text-center font-black text-[#3b82f6] number-font text-lg">
                                               {isG ? (season.shutouts || 0) : ((season.goals || 0) + (season.assists || 0))}
                                            </td>
                                            <td className="px-3 py-3.5 text-center font-black number-font text-slate-400 hidden sm:table-cell text-lg">
                                               {season.league === 'INTL' ? '-' : (isG ? '60:00' : (season.plusMinus > 0 ? `+${season.plusMinus}` : (season.plusMinus || 0)))}
                                            </td>
                                            <td className="px-4 py-2 w-full">
                                               <div className="flex flex-wrap gap-2 items-center">
                                                   {season.titleWon && (
                                                       <span className="bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-[#F59E0B] text-[9px] sm:text-[10px] font-bold px-2.5 h-6 rounded uppercase tracking-wider inline-flex items-center gap-1.5 leading-none shadow-sm">
                                                         <TrophyImage league={season.league || 'NHL'} className="w-3.5 h-3.5 shrink-0" />
                                                         <span>{season.league === 'NHL' ? 'Stanley Cup' : 'Championship'}</span>
                                                       </span>
                                                   )}
                                                   {(season.awards || [])
                                                       .filter(aw => !aw.toLowerCase().includes('1st team all-star'))
                                                       .map((aw, aIdx) => {
                                                       let text = aw.replace(/^\d{4}\s/, '');
                                                       
                                                       text = text.replace(/\s\d{4}$/, '');
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
                                                           
                                                           // Shorten lengthy CHL/AHL MVP awards
                                                           if (text.includes('Most Valuable Player')) {
                                                               text = text.replace('Most Valuable Player', 'MVP');
                                                           }
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
                                                           <span key={aIdx} className={`${colorClass} border text-[9px] sm:text-[10px] font-bold px-2.5 h-6 rounded uppercase tracking-wider leading-none inline-flex items-center gap-1.5 shadow-sm`}>
                                                               {imgUrl && (
                                                                 <img
                                                                   src={imgUrl}
                                                                   alt=""
                                                                   className="w-3.5 h-3.5 shrink-0 object-contain"
                                                                   onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                                 />
                                                               )}
                                                               <span>{text}</span>
                                                           </span>
                                                       );
                                                   })}
                                               </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                         </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

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

                const totalIndividualAwards = Object.values(aggregatedAwards)
                  .filter(aw => !aw.name.includes('All-Star') && !aw.name.includes('All-American') && !aw.name.includes('Team'))
                  .reduce((sum, aw) => sum + aw.count, 0);

                const newCareer = {
                  id: Date.now(), name: player.name, pos: player.pos, number: player.number,
                  games: nhlGames, points: isGoalie ? svPct : nhlPoints,
                  cups: (player.seasonHistory || []).filter(s => s.league === 'NHL' && s.titleWon).length,
                  awards: totalIndividualAwards, earnings: player.stats?.earnings || 0,
                  team: primaryTeamName, logo: primaryTeam,
                  isLegend: scoreData.tier === 'Generational Icon' || scoreData.tier === 'Hall of Famer',
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