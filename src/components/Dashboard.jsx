import { getTeamData, nationalities } from '../data/teams';
import { formatMoney, getActiveStat } from '../utils/gameHelpers';
import { getDisplayDeployment, getFullTeamName } from '../utils/appHelpers';
import TeamLogo from './TeamLogo';

const Dashboard = ({ player, tier, statChanges, isJunior, isAHL, onOpenShop, onRetire, setActiveEvent, setScreen }) => {
  const safeNationalities = nationalities || [];
  const currentYear = 2026 + (player.stats?.seasonsPlayed || 0);
  const nextYear = currentYear + 1;

  const isGoalie = player.pos === 'G';
  const teamObj = getTeamData(player.team, player.league);
  
  const teamBg = player.ovr >= 90 ? '#F59E0B' : (teamObj?.bg || '#101410');
  
  let frameColor = '#8a95a1'; 
  if (player.ovr >= 75) frameColor = '#c98a4b'; 
  if (player.ovr >= 82) frameColor = '#e2e8f0'; 
  if (player.ovr >= 90) frameColor = '#F59E0B'; 

  const getIntlStatus = () => {
    if (player.age <= 19) {
      if (player.ovr >= 68) return { label: 'U20 STAR', color: 'text-[#22E748] bg-[#22E748]/10 border-[#22E748]/30' };
      if (player.ovr >= 60) return { label: 'U20 SQUAD', color: 'text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/30' };
      if (player.ovr >= 55) return { label: 'U20 BUBBLE', color: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30' };
      return { label: 'U20 RADAR', color: 'text-slate-400 bg-slate-800/50 border-[rgba(255,255,255,0.08)]' };
    } else {
      if (player.ovr >= 88) return { label: "NAT'L ICON", color: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30' };
      if (player.ovr >= 80) return { label: "NAT'L SQUAD", color: 'text-[#22E748] bg-[#22E748]/10 border-[#22E748]/30' };
      if (player.ovr >= 75) return { label: "NAT'L BUBBLE", color: 'text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/30' };
      return { label: 'DOMESTIC', color: 'text-slate-400 bg-slate-800/50 border-[rgba(255,255,255,0.08)]' };
    }
  };
  const intlStatus = getIntlStatus();

 const getBarColor = (idol) => {
    if (idol < 300) return 'linear-gradient(90deg, color-mix(in srgb, #64748b 55%, #1e293b), #94a3b8)'; // Slate
    if (idol < 600) return 'linear-gradient(90deg, color-mix(in srgb, #3b82f6 55%, #1e3a8a), #60a5fa)'; // Blue
    if (idol < 1000) return 'linear-gradient(90deg, color-mix(in srgb, #F59E0B 55%, #78350f), #fbbf24)'; // Amber
    return 'linear-gradient(90deg, color-mix(in srgb, #22E748 55%, #14532d), #4ade80)'; // Green
  };

  const activeBucket = ['OHL', 'WHL', 'QMJHL', 'USHL', 'NCAA', 'SHL', 'LIIGA'].includes(player.league) ? 'chl' : (player.league === 'AHL' ? 'ahl' : 'nhl');
  const bName = activeBucket === 'nhl' ? 'NHL' : activeBucket === 'ahl' ? 'AHL' : 'PRE-NHL';
  
  const cGP = player.stats?.[activeBucket]?.games || 0;
  const cG = player.stats?.[activeBucket]?.goals || 0;
  const cA = player.stats?.[activeBucket]?.assists || 0;
  const cPts = cG + cA;
  const cShots = player.stats?.[activeBucket]?.shots || 0;
  const cSaves = player.stats?.[activeBucket]?.saves || 0;
  const cSHO = player.stats?.[activeBucket]?.shutouts || 0;
  const cSV = cShots > 0 ? (cSaves / cShots).toFixed(3).replace('0.', '.') : '.000';
  const cGAA = cGP > 0 ? ((cShots - cSaves) / cGP).toFixed(2) : '0.00';

  const milestones = [];
  const earnings = player.stats?.earnings || 0;
  const nextMoney = earnings < 1000000 ? 1000000 : earnings < 10000000 ? 10000000 : earnings < 50000000 ? 50000000 : 100000000;
  milestones.push({ label: `EARN ${formatMoney(nextMoney)}`, pct: Math.min(100, (earnings / nextMoney) * 100), val: formatMoney(earnings), color: 'bg-amber-400' });

  if (isGoalie) {
     const nextSHO = cSHO < 10 ? 10 : cSHO < 50 ? 50 : cSHO < 125 ? 125 : cSHO + 10;
     milestones.push({ label: nextSHO === 125 ? 'ALL-TIME SHUTOUT RECORD' : `${nextSHO} CAREER SHUTOUTS`, pct: Math.min(100, (cSHO / nextSHO) * 100), val: cSHO, color: 'bg-[#22E748]' });
  } else {
     const nextPts = cPts < 100 ? 100 : cPts < 500 ? 500 : cPts < 1000 ? 1000 : cPts < 2857 ? 2857 : cPts + 100;
     milestones.push({ label: nextPts === 2857 ? 'ALL-TIME POINTS RECORD' : `${nextPts} CAREER POINTS`, pct: Math.min(100, (cPts / nextPts) * 100), val: cPts, color: 'bg-[#3b82f6]' });
  }

  return (
    <div className="w-full max-w-[440px] md:max-w-2xl lg:max-w-[440px] mx-auto mb-4 lg:mb-0 z-10 relative drop-shadow-2xl mt-2 flex-1 flex flex-col">
      <div 
        className="border border-[rgba(255,255,255,0.08)] border-t-0 rounded-[14px] overflow-hidden relative p-4 sm:p-5 flex-1 flex flex-col"
        style={{ background: `linear-gradient(180deg, color-mix(in srgb, ${teamBg} 12%, #12161c) 0%, #0a0d0a 38%)` }}
      >
        <div className="absolute top-0 left-0 right-0 h-[3px] opacity-90 z-0" style={{ background: `linear-gradient(90deg, transparent, ${frameColor}, transparent)` }}></div>
        {player.ovr >= 90 && <div className="bluechip-foil-overlay"></div>}

        <div className="relative z-10 flex flex-col gap-4 sm:gap-5 h-full w-full flex-1">

          {/* 1. TOP SECTION: PLAYER INFO & FAN STATUS */}
          <div className="flex flex-col w-full min-w-0 justify-center shrink-0">
            <div className="flex items-center justify-between gap-2 sm:gap-3 w-full">
              
              <div className="flex items-center gap-3 sm:gap-4 min-w-0 shrink">
                <div className="flex flex-col items-center shrink-0">
                 <span className="number-font text-5xl sm:text-6xl text-white leading-none">{player.ovr}</span>
                  <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1 leading-none">OVR</p>
                </div>

                <div className="flex flex-col min-w-0 justify-center">
                  <div className="flex items-center gap-2 mb-1 w-full">
                    <img src={safeNationalities.find(n => n.id === player.nat)?.img} alt={player.nat} className="h-3.5 md:h-4 w-[21px] md:w-[26px] shrink-0 rounded-[2px] object-cover border border-slate-700 shadow-sm" />
                    <p 
                      className={`font-black sports-font leading-none text-white uppercase whitespace-nowrap tracking-tight ${
                        player.name.length > 15 ? 'text-xs sm:text-sm' :
                        player.name.length > 12 ? 'text-sm sm:text-base' :
                        player.name.length > 9 ? 'text-base sm:text-lg' :
                        'text-xl sm:text-2xl lg:text-3xl'
                      }`}
                    >
                      {player.name}
                    </p>
                  </div>
                  
                  <p className="text-[11px] font-black uppercase tracking-widest text-[#3b82f6] truncate mb-1">
                    {getFullTeamName(player.team, player.league)}
                  </p>
                  
                  <div className="text-[9px] font-bold uppercase tracking-tight text-slate-500 flex items-center gap-1 mb-0.5 flex-nowrap whitespace-nowrap min-w-0">
                       <span className="shrink-0">{currentYear} / {nextYear} · {player.age} YRS OLD</span>
                       {player.league !== 'NCAA' && (() => {
                          const isJunior = ['OHL', 'WHL', 'QMJHL', 'USHL'].includes(player.league);
                          if (isJunior) {
                             if (player.age >= 20) {
                                return <span className="text-[7px] md:text-[8px] font-black px-1.5 py-0.5 rounded border uppercase tracking-widest text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]/30 shrink-0">OVERAGER</span>;
                             }
                             return null;
                          }
                          
                          if (player.contract?.years !== undefined) {
                             if (!['NHL', 'AHL'].includes(player.league)) {
                                return <span className="shrink-0">· {player.contract.years} YRS LEFT</span>;
                             }
                             const proSeasons = player.stats?.seasonsPlayed || 0;
                             const isRFA = player.age < 27 && proSeasons < 7;
                             const isELC = player.contract.salary === 925000 || (isRFA && proSeasons < 3);
                             
                             let pillClass = isELC ? 'text-[#22E748] bg-[#22E748]/10 border-[#22E748]/30' 
                                           : isRFA ? 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30' 
                                           : 'text-[#c084fc] bg-[#c084fc]/10 border-[#c084fc]/30';
                             const status = isELC ? 'ELC' : isRFA ? 'RFA' : 'UFA';
                             
                             return (
                                <>
                                  <span className="shrink-0">· {player.contract.years} YRS LEFT</span>
                                  <span className={`text-[7px] md:text-[8px] font-black px-1.5 py-0.5 rounded border uppercase tracking-widest leading-none shrink-0 ${pillClass}`}>
                                    {status}
                                  </span>
                                </>
                             );
                          }
                          return null;
                       })()}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-1.5 mt-0.5">
                    <p className="text-[9px] font-bold uppercase leading-snug tracking-wide text-slate-500">
                      {player.pos} · {player.archetype ? `${player.archetype.toUpperCase()} · ` : ''}{getDisplayDeployment(player.ovr, player.pos, player.league)}
                    </p>
                    <span className={`text-[7px] font-black px-1.5 py-0.5 rounded border uppercase tracking-widest leading-none shrink-0 ${intlStatus.color}`}>
                      {intlStatus.label}
                    </span>
                  </div>
                </div>
              </div>

              <div className="w-12 h-12 sm:w-16 sm:h-16 shrink-0 flex items-center justify-end ml-auto">
                <TeamLogo teamId={player.team} league={player.league} isAHL={isAHL} />
              </div>
            </div>

            <div className="mt-4 md:mt-5 w-full space-y-1.5">
              <div className="flex items-center justify-between text-[10px] md:text-xs font-bold uppercase tracking-wide">
                <span className="text-slate-400">Fan Status</span>
                <span className="text-slate-400"> {tier.label} · {player.idolatry} FANS</span>
              </div>
              <div className="relative w-full overflow-hidden rounded-full bg-[#0a0d0a] border border-[rgba(255,255,255,0.05)] h-2.5 md:h-3">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (player.idolatry / 1000) * 100)}%`, background: getBarColor(player.idolatry) }}></div>
              </div>
              <div className="relative h-3.5 md:h-4">
                <span className={`absolute top-0 -translate-x-1/2 text-[10px] md:text-xs leading-none transition-opacity ${(Number(player.idolatry) || 0) >= 100 ? 'opacity-100' : 'opacity-30 grayscale'}`} style={{ left: '10%' }} title="Known">👀</span>
                <span className={`absolute top-0 -translate-x-1/2 text-[10px] md:text-xs leading-none transition-opacity ${(Number(player.idolatry) || 0) >= 300 ? 'opacity-100' : 'opacity-30 grayscale'}`} style={{ left: '30%' }} title="Loved">💙</span>
                <span className={`absolute top-0 -translate-x-1/2 text-[10px] md:text-xs leading-none transition-opacity ${(Number(player.idolatry) || 0) >= 600 ? 'opacity-100' : 'opacity-30 grayscale'}`} style={{ left: '60%' }} title="Icon">⭐</span>
                <span className={`absolute top-0 -translate-x-1/2 text-[10px] md:text-xs leading-none transition-opacity ${(Number(player.idolatry) || 0) >= 1000 ? 'opacity-100' : 'opacity-30 grayscale'}`} style={{ left: '100%' }} title="Legend">🗽</span>
              </div>
              <p className="text-[9px] md:text-[10px] font-bold leading-none text-slate-400 mt-1 md:mt-1.5">
                {tier.req > 0 ? `You're ${tier.req} pts short of ${tier.nextLabel}` : <span className="text-[#F59E0B]">Max Icon Status 🏆</span>}
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.05)] w-full space-y-2">
              <div className="flex items-center justify-between text-[10px] md:text-xs font-bold uppercase tracking-wide mb-1">
                <span className="text-slate-400">Relationships</span>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest w-[85px] shrink-0">FRONT OFFICE</span>
                <div className="flex-1 h-1.5 bg-[#0a0d0a] rounded-full overflow-hidden border border-[rgba(255,255,255,0.05)] relative">
                  <div className="absolute top-0 bottom-0 left-0 bg-[#3b82f6] transition-all duration-500" style={{ width: `${player.relationships?.coach || 50}%` }}></div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest w-[85px] shrink-0">TEAMMATES</span>
                <div className="flex-1 h-1.5 bg-[#0a0d0a] rounded-full overflow-hidden border border-[rgba(255,255,255,0.05)] relative">
                  <div className="absolute top-0 bottom-0 left-0 bg-[#22E748] transition-all duration-500" style={{ width: `${player.relationships?.teammates || 50}%` }}></div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest w-[85px] shrink-0">MEDIA</span>
                <div className="flex-1 h-1.5 bg-[#0a0d0a] rounded-full overflow-hidden border border-[rgba(255,255,255,0.05)] relative">
                  <div className="absolute top-0 bottom-0 left-0 bg-[#F59E0B] transition-all duration-500" style={{ width: `${player.relationships?.media || 50}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. BOTTOM STAT GRIDS */}
          <div className="flex flex-col gap-2 w-full shrink-0">
            {(() => {
              const ls = player.seasonHistory && player.seasonHistory.length > 0 
                 ? player.seasonHistory[player.seasonHistory.length - 1] 
                 : {};
              
              return (
                <div className="grid grid-cols-5 bg-[#101410] border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden divide-x divide-[rgba(255,255,255,0.05)] text-center shadow-lg">
                  <div className="px-1 py-2 flex flex-col justify-center items-center min-h-[50px]">
                    <p className="text-lg sm:text-xl font-black text-white number-font leading-none">{ls.games || 0}</p>
                    <p className="mt-0.5 truncate text-[7px] md:text-[8px] font-black uppercase tracking-wide text-slate-400">Games</p>
                  </div>
                  <div className="px-1 py-2 flex flex-col justify-center items-center min-h-[50px] bg-gradient-to-b from-[rgba(255,255,255,0.03)] to-transparent">
                    <p className="text-lg sm:text-xl font-black text-[#22E748] number-font leading-none">{isGoalie ? ((ls.shots > 0 && ls.saves !== undefined) ? (ls.saves / ls.shots).toFixed(3).replace('0.', '.') : '.000') : (ls.goals || 0)}</p>
                    <p className="mt-0.5 truncate text-[7px] md:text-[8px] font-black uppercase tracking-wide text-slate-400">{isGoalie ? 'SV%' : 'Goals'}</p>
                  </div>
                  <div className="px-1 py-2 flex flex-col justify-center items-center min-h-[50px]">
                    <p className="text-lg sm:text-xl font-black text-white number-font leading-none">{isGoalie ? ((ls.games > 0 && ls.shots !== undefined) ? ((ls.shots - ls.saves) / ls.games).toFixed(2) : '0.00') : (ls.assists || 0)}</p>
                    <p className="mt-0.5 truncate text-[7px] md:text-[8px] font-black uppercase tracking-wide text-slate-400">{isGoalie ? 'GAA' : 'Assists'}</p>
                  </div>
                  <div className="px-1 py-2 flex flex-col justify-center items-center min-h-[50px]">
                    <p className="text-lg sm:text-xl font-black text-white number-font leading-none">{isGoalie ? (ls.shutouts || 0) : (ls.plusMinus > 0 ? `+${ls.plusMinus}` : (ls.plusMinus || 0))}</p>
                    <p className="mt-0.5 truncate text-[7px] md:text-[8px] font-black uppercase tracking-wide text-slate-400">{isGoalie ? 'SHO' : '+/-'}</p>
                  </div>
                  <div className="px-1 py-2 flex flex-col justify-center items-center min-h-[50px]">
                    <p className="text-lg sm:text-xl font-black text-sky-400 number-font leading-none">{isGoalie ? "60:00" : `${Math.floor(ls.avgToi || 0)}:${Math.round(((ls.avgToi || 0) % 1) * 60).toString().padStart(2, '0')}`}</p>
                    <p className="mt-0.5 truncate text-[7px] md:text-[8px] font-black uppercase tracking-wide text-slate-400">TOI</p>
                  </div>
                </div>
              );
            })()}

            <div className="grid grid-cols-5 bg-[#101410] border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden divide-x divide-[rgba(255,255,255,0.05)] text-center shadow-lg">
              {[
                { label: isGoalie ? 'Reflexes' : 'Shooting', key: 'shooting', val: getActiveStat(player, 'shooting') },
                { label: isGoalie ? 'Position' : 'Skating', key: 'skating', val: getActiveStat(player, 'skating') },
                { label: isGoalie ? 'Agility' : 'Power', key: 'physicality', val: getActiveStat(player, 'physicality') },
                { label: 'Hockey IQ', key: 'hockeyIQ', val: getActiveStat(player, 'hockeyIQ') },
                { label: 'Stamina', key: 'stamina', val: getActiveStat(player, 'stamina') }
              ].map(attr => {
                const change = statChanges ? statChanges[attr.key] : 0;
                const isUpgraded = change > 0;
                const isDowngraded = change < 0;
                return (
                  <div key={attr.label} className={`relative px-0.5 py-2 flex flex-col justify-center items-center min-h-[50px] transition ${isUpgraded ? 'bg-[#22E748]/10 shadow-[inset_0_0_8px_rgba(34,231,72,0.15)]' : isDowngraded ? 'bg-[#ef4444]/10 shadow-[inset_0_0_8px_rgba(239,68,68,0.15)]' : ''}`}>
                    {isUpgraded && <span className="absolute top-0.5 right-0.5 text-[#22E748] text-[7px] font-black">▲</span>}
                    {isDowngraded && <span className="absolute top-0.5 right-0.5 text-[#ef4444] text-[7px] font-black">▼</span>}
                    <p className={`text-lg sm:text-xl font-black number-font leading-none ${isUpgraded ? 'text-[#22E748]' : isDowngraded ? 'text-[#ef4444]' : 'text-white'}`}>{attr.val}</p>
                    <p className="truncate px-0.5 mt-0.5 text-[7px] md:text-[8px] font-black uppercase tracking-normal text-slate-400">{attr.label}</p>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-2 bg-[#101410] border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden divide-x divide-[rgba(255,255,255,0.05)] text-center shadow-lg">
              <div className="flex flex-col justify-center items-center py-2 min-h-[50px]">
                <p className="px-1 text-lg sm:text-xl font-black number-font leading-none text-sky-300">{formatMoney(player.stats?.value || 0)}</p>
                <p className="mt-0.5 text-[8px] font-black uppercase tracking-wide text-slate-400">Value</p>
              </div>
              <div className="flex flex-col justify-center items-center bg-amber-400/10 py-2 min-h-[50px]">
                <p className="px-1 text-lg sm:text-xl font-black number-font leading-none text-amber-300">{formatMoney(player.stats?.earnings || 0)}</p>
                <p className="mt-0.5 text-[8px] font-black uppercase tracking-wide text-slate-400">Earnings</p>
              </div>
            </div>
          </div>

          {/* 3. NEW CAREER AGGREGATES SECTION */}
          <div className="flex flex-col w-full pt-2 pb-1">
            <div className="bg-[#101410] border border-[rgba(255,255,255,0.05)] rounded-xl p-4 sm:p-5 flex flex-col shadow-inner gap-6">
              
              {/* MOVED: CAPTAIN'S TEAM MEETING BUTTON */}
              {player.isCaptain && player.storylines?.lastMeetingYear !== currentYear && (
                <button 
                  type="button" 
                  onClick={() => {
                    setActiveEvent({
                      title: '📢 CALL TEAM MEETING',
                      desc: 'As the Captain, you have the authority to lock the locker room doors and address the team. A great speech will rally the boys, but if you do this too often, they will tune you out.',
                      choices: [
                        { label: 'Deliver a Fiery Speech', isRisky: true, successChance: 0.65, successFeedback: 'The room was silent. You fired them up, and team morale skyrocketed!', successEffect: { idol: 15, ovr: 1, rel: { teammates: 25 } }, failFeedback: 'You stumbled over your words. The veterans rolled their eyes.', failEffect: { idol: -10, ovr: -1, rel: { teammates: -20 } }, action: 'TEAM_MEETING' }
                      ],
                      madePlayoffs: false
                    });
                    setScreen('event');
                  }}
                  className="w-full py-2.5 rounded-lg border border-[#3b82f6]/40 bg-[#3b82f6]/10 text-[#3b82f6] font-black sports-font uppercase tracking-widest hover:bg-[#3b82f6]/20 transition-colors shadow-[0_0_10px_rgba(59,130,246,0.1)] cursor-pointer flex items-center justify-center gap-2 -mt-2 mb-2"
                >
                   <span className="text-sm">📢</span> CALL TEAM MEETING
                </button>
              )}

              {/* ALL-TIME STATS */}
              <div>
                <h4 className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 font-sans border-b border-[rgba(255,255,255,0.05)] pb-1.5">
                  ALL-TIME {bName} TOTALS
                </h4>
                <div className="flex justify-between items-center px-1 sm:px-2">
                   <div className="text-center">
                      <p className="text-xl sm:text-2xl font-black text-white number-font leading-none">{cGP}</p>
                      <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase mt-1 tracking-wider">GAMES</p>
                   </div>
                   {isGoalie ? (
                     <>
                       <div className="text-center">
                          <p className="text-xl sm:text-2xl font-black text-white number-font leading-none">{cSV}</p>
                          <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase mt-1 tracking-wider">SV%</p>
                       </div>
                       <div className="text-center">
                          <p className="text-xl sm:text-2xl font-black text-white number-font leading-none">{cGAA}</p>
                          <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase mt-1 tracking-wider">GAA</p>
                       </div>
                       <div className="text-center">
                          <p className="text-xl sm:text-2xl font-black text-[#22E748] number-font leading-none">{cSHO}</p>
                          <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase mt-1 tracking-wider">SHO</p>
                       </div>
                     </>
                   ) : (
                     <>
                       <div className="text-center">
                          <p className="text-xl sm:text-2xl font-black text-white number-font leading-none">{cG}</p>
                          <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase mt-1 tracking-wider">GOALS</p>
                       </div>
                       <div className="text-center">
                          <p className="text-xl sm:text-2xl font-black text-white number-font leading-none">{cA}</p>
                          <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase mt-1 tracking-wider">ASTS</p>
                       </div>
                       <div className="text-center">
                          <p className="text-xl sm:text-2xl font-black text-[#22E748] number-font leading-none">{cPts}</p>
                          <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase mt-1 tracking-wider">PTS</p>
                       </div>
                     </>
                   )}
                   <div className="text-center">
                      <p className="text-xl sm:text-2xl font-black text-[#F59E0B] number-font leading-none">{player.stats?.titles || 0}</p>
                      <p className="text-[8px] sm:text-[9px] font-bold text-[#F59E0B] uppercase mt-1 tracking-wider">TROPHIES</p>
                   </div>
                </div>
              </div>

              {/* CHASING GREATNESS (MILESTONES) */}
              <div>
                <h4 className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 font-sans border-b border-[rgba(255,255,255,0.05)] pb-1.5">
                  CHASING GREATNESS
                </h4>
                <div className="flex flex-col gap-3">
                   {milestones.map((m, idx) => (
                      <div key={idx} className="w-full">
                        <div className="flex justify-between text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-300 mb-1.5 font-sans">
                           <span>{m.label}</span>
                           <span className="text-white font-black number-font">{m.val}</span>
                        </div>
                        <div className="h-1.5 w-full bg-[#0a0d0a] rounded-full overflow-hidden border border-[rgba(255,255,255,0.05)]">
                           <div className={`h-full ${m.color} transition-all duration-500`} style={{ width: `${m.pct}%` }}></div>
                        </div>
                      </div>
                   ))}
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex flex-col gap-2 mt-2">
                {!isJunior && player.league !== 'NCAA' && (
                  <button type="button" onClick={onOpenShop} className="w-full py-2.5 rounded-lg border border-[#22E748]/40 bg-[#22E748]/10 text-[#22E748] font-black sports-font uppercase tracking-widest hover:bg-[#22E748]/20 transition-colors shadow-[0_0_10px_rgba(34,231,75,0.1)] cursor-pointer flex items-center justify-center gap-2">
                     <span className="text-sm">🛒</span> OPEN SHOP
                  </button>
                )}

                <button 
                  type="button" 
                  onClick={() => {
                    if (window.confirm("Are you sure you want to retire? This will end your career permanently and calculate your final score.")) {
                      onRetire();
                    }
                  }} 
                  className="w-full py-2.5 rounded-lg border border-[#ef4444]/40 bg-[#ef4444]/10 text-[#ef4444] font-black sports-font uppercase tracking-widest hover:bg-[#ef4444]/20 transition-colors shadow-[0_0_10px_rgba(239,68,68,0.1)] cursor-pointer flex items-center justify-center gap-2"
                >
                   <span className="text-sm">🛑</span> RETIRE NOW
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;