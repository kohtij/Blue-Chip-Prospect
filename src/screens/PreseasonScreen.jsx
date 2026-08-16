import React from 'react';

// Auto-extracted from App.jsx. Receives state/handlers/App-scope components as props.
export default function PreseasonScreen({ activeTrainings, currentYear, handleTrain, player }) {
  return (
          <div className="game-panel p-6 sm:p-10 mt-2 border-t-2 border-t-[#22E748] relative z-20">
           <div className="flex flex-col items-start border-b border-[rgba(255,255,255,0.065)] pb-4 mb-6">
              <span className="text-[10px] sm:text-xs font-bold text-[#3b82f6] uppercase tracking-widest font-sans border border-[#3b82f6]/30 px-2.5 py-1 rounded bg-[#3b82f6]/10 mb-2">
                OFF-SEASON DEVELOPMENT
              </span>
              <h2 className="text-3xl sm:text-4xl font-black italic text-white uppercase sports-font tracking-tighter">PRE-SEASON {currentYear}</h2>
              <p className="text-slate-400 text-sm sm:text-base font-sans mt-1">The coaching staff has prepared three training programs. Pick your focus.</p>
            </div>

           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 w-full pb-6 pt-2">
              {activeTrainings.map(t => (
                <button
                  type="button"
                  key={t.id}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleTrain(t);
                  }}
                  className={`bg-[#101410] border border-[rgba(255,255,255,0.065)] rounded-xl cursor-pointer transition-all hover:-translate-y-1 flex flex-col min-h-[12rem] sm:min-h-[16rem] text-left relative z-30 ${t.rarity === 'Epic' ? 'hover:border-[#F59E0B]' : t.rarity === 'Rare' ? 'hover:border-[#3b82f6]' : 'hover:border-[#22E748]'}`}
                >
                  <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between w-full pointer-events-none">
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-4 w-full min-w-0">
                        {t.rarity !== 'Common' ? (
                          <span className={`shrink-0 text-[9px] sm:text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest font-sans ${t.rarity === 'Epic' ? 'bg-[#F59E0B] text-black' : 'bg-[#3b82f6] text-white'}`}>{t.rarity}</span>
                        ) : <span className="shrink-0"></span>}
                        <span className="text-sm sm:text-base lg:text-sm xl:text-base font-black text-slate-700 uppercase sports-font tracking-tight text-right leading-tight shrink min-w-0">
                          {{
                            'SHT': player.pos === 'G' ? 'REFLEXES' : 'SHOOTING', 
                            'SKT': player.pos === 'G' ? 'POSITION' : 'SKATING', 
                            'PHY': player.pos === 'G' ? 'AGILITY' : 'POWER',
                            'IQ': 'HOCKEY IQ', 'MIND': 'HOCKEY IQ',
                            'STA': 'STAMINA', 'STM': 'STAMINA',
                            'REF': 'REFLEXES', 'POS': 'POSITION', 'AGI': 'AGILITY',
                            'TECH': 'TECHNIQUE', 'GRIT': 'GRIT', 'POW': 'POWER',
                            'SKL': 'SKILL', 'PRO': 'PROGRAM', 'ELITE': 'ELITE',
                            'EYES': 'VISION', 'FLEX': 'FLEXIBILITY'
                          }[t.tag] || t.tag}
                        </span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black text-white uppercase leading-tight mb-3 text-left sports-font mt-2">{t.name}</h3>
                      <p className="text-xs sm:text-sm text-slate-400 leading-relaxed italic text-left font-sans mb-4">{t.flavor}</p>
                    </div>

                    {/* STAT PILLS — color-coded per stat, matching the international game */}
                    <div className="mt-auto text-left pt-4 border-t border-[rgba(255,255,255,0.065)] w-full flex flex-wrap items-center gap-1.5">
                      {(t.desc || '').split(',').map((boost, idx) => {
                        const trimmed = boost.trim();
                        const parts = trimmed.split(/\s+/);
                        const val = parts[0] || '';
                        const stat = (parts[1] || '').toUpperCase();
                        
                        let displayStat = stat;
                        if (player.pos === 'G') {
                           if (stat === 'PHY') displayStat = 'AGI';
                           if (stat === 'SHT') displayStat = 'REF';
                           if (stat === 'SKT') displayStat = 'POS';
                        } else {
                           if (stat === 'PHY') displayStat = 'POW';
                        }

                        let colorCls = 'text-white bg-white/10 border-white/30';
                        if (['PHY', 'POW', 'AGI'].includes(stat)) colorCls = 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30';
                        if (['SKT', 'POS'].includes(stat)) colorCls = 'text-[#22E748] bg-[#22E748]/10 border-[#22E748]/30';
                        if (['SHT', 'REF'].includes(stat)) colorCls = 'text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/30';
                        if (['IQ', 'MIND'].includes(stat)) colorCls = 'text-[#c084fc] bg-[#c084fc]/10 border-[#c084fc]/30';
                        if (['STA', 'STM'].includes(stat)) colorCls = 'text-[#06b6d4] bg-[#06b6d4]/10 border-[#06b6d4]/30';
                        
                        return (
                          <span
                            key={idx}
                            className={`text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider whitespace-nowrap border ${colorCls}`}
                          >
                            {val} {displayStat}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
}
