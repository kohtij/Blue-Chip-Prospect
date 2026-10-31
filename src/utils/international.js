// The IIHF group stage, lifted out of runPostSeasonFlow so the season can run it
// too. Three tournaments share this machinery but not the calendar:
//
//   World Juniors        late December, mid-season, under-20
//   Winter Olympics      February of every fourth year, senior, the league pauses
//   World Championship   May, after the regular season, for players already out
//
// Only the last of those is a post-season event. The other two were being played
// in the summer alongside it, months after they actually happen.
// A player's division is only ever written onto him when his nation is promoted
// or relegated, so for every career before that happens it is simply undefined.
// Trusting the caller to pass it meant an undefined division matched no nation in
// the table, the group came back empty, and the tournament hub showed a single
// competing country: the player's own. Resolved here, from the nationality table,
// so every caller and every existing career gets the right answer.
// What a skater is worth per game at a international tournament.
//
// Scaled off overall rating and tapered at both ends: a fringe selection is not
// pointless and a superstar does not score every night. Defencemen carry most
// of their production in the assist column.
const intlScoringRates = (ovr, pos) => {
  const rate = Math.max(0.08, Math.min(0.80, (ovr - 50) / 60));
  const isD = pos === 'LD' || pos === 'RD';
  return {
    goals: rate * (isD ? 0.35 : 0.85),
    assists: rate * (isD ? 0.95 : 1.05)
  };
};

// One point is the common case; a multi-point night is possible but rare, which
// a single coin flip per game could never produce.
const rollPoints = (rate) =>
  (Math.random() < rate ? 1 : 0) + (Math.random() < rate * 0.22 ? 1 : 0);

export function resolveNatDivision(player, safeNationalities) {
  if (player?.natDiv) return player.natDiv;
  const nat = (safeNationalities || []).find(n => n.id === player?.nat);
  return nat?.division || 'Top Division';
}

export function simulateTournament({ player, natDiv, pOvr, safeNationalities, isWJC, isOlympicYear }) {
  // The player's own federation, which seeds his group.
  const playerNatData = (safeNationalities || []).find(n => n.id === player.nat)
    || { tier: 4, division: 'Division I-B', id: player.nat };
  const activeNatDiv = natDiv || playerNatData.division || 'Top Division';
    const tourneyType = isWJC ? 'World Juniors' : (isOlympicYear ? 'Winter Olympics' : 'World Championship');
    const isTopDiv = activeNatDiv === 'Top Division';

    let groupA 
    let groupB = [];

    // 1. Draw the actual opponents based on real tiers
    if (isTopDiv) {
        const topTeams = (safeNationalities || []).filter(n => n.division === 'Top Division' && n.id !== player.nat);
        const shuffled = [...topTeams].sort(() => 0.5 - Math.random());
        groupA = [ { ...playerNatData, isPlayer: true }, ...shuffled.slice(0, 4) ];
        groupB = shuffled.slice(4, 9);
    } else {
        let lowerTeams = (safeNationalities || []).filter(n => n.division === activeNatDiv && n.id !== player.nat);
        // Division I-B only holds two nations, so on its own it cannot fill a
        // group. Rather than leave the player skating by himself, top it up with
        // the nearest nations by tier.
        if (lowerTeams.length < 3) {
            const filler = (safeNationalities || [])
                .filter(n => n.id !== player.nat && !lowerTeams.some(t => t.id === n.id))
                .sort((a, b) => Math.abs(a.tier - playerNatData.tier) - Math.abs(b.tier - playerNatData.tier));
            lowerTeams = [...lowerTeams, ...filler.slice(0, 5 - lowerTeams.length)];
        }
        const shuffled = [...lowerTeams].sort(() => 0.5 - Math.random());
        groupA = [ { ...playerNatData, isPlayer: true }, ...shuffled.slice(0, 5) ];
    }

    // 2. Simulate Round Robin Backend
    const simGroup = (group) => {
        let standings = group.map(t => ({ ...t, w: 0, l: 0, otl: 0, pts: 0, g: 0, a: 0 }));
        for (let i = 0; i < standings.length; i++) {
            for (let j = i + 1; j < standings.length; j++) {
                const t1 = standings[i];
                const t2 = standings[j];
                
                let t1WinChance = 0.5 + ((t2.tier - t1.tier) * 0.15);
                if (t1.isPlayer) t1WinChance += (pOvr >= 85 ? 0.2 : pOvr >= 75 ? 0.1 : 0);
                if (t2.isPlayer) t1WinChance -= (pOvr >= 85 ? 0.2 : pOvr >= 75 ? 0.1 : 0);
                t1WinChance = Math.max(0.1, Math.min(0.9, t1WinChance));

                const roll = Math.random();
                if (roll < t1WinChance - 0.1) { t1.w++; t1.pts += 3; t2.l++; }
                else if (roll < t1WinChance) { t1.w++; t1.pts += 2; t2.otl++; t2.pts += 1; }
                else if (roll < t1WinChance + 0.1) { t2.w++; t2.pts += 2; t1.otl++; t1.pts += 1; }
                else { t2.w++; t2.pts += 3; t1.l++; }

                // Every tournament a player ever skated in came back with an
                // identical line, because the scoring roll was
                // `Math.random() < pOvr/100 * 1.5`. That threshold passes 1.0 at
                // 67 overall, so for any player worth selecting it was not a
                // roll at all: a goal and an assist, guaranteed, in every group
                // game of every tournament for a whole career.
                const scorer = t1.isPlayer ? t1 : (t2.isPlayer ? t2 : null);
                if (scorer && player.pos !== 'G') {
                    const line = intlScoringRates(pOvr, player.pos);
                    scorer.g += rollPoints(line.goals);
                    scorer.a += rollPoints(line.assists);
                }
            }
        }
        return standings.sort((a, b) => b.pts - a.pts);
    };

    const groupAStandings = simGroup(groupA);
    const groupBStandings = isTopDiv ? simGroup(groupB) : [];

    const playerRecord = groupAStandings.find(t => t.isPlayer);
    const placement = groupAStandings.findIndex(t => t.isPlayer) + 1;

    let finalStakes;
    let bracket = null;

    // 3. Map the Knockout Bracket if Top Division
    if (isTopDiv) {
        // RULE: The Olympics do not have relegation/survival games.
        finalStakes = placement <= 4 ? 'QUARTERFINAL' : (isOlympicYear ? 'CONSOLATION' : 'SURVIVAL');
        
        bracket = {
            qf: [
                { id: 'QF1', t1: groupAStandings[0], t2: groupBStandings[3], winner: null },
                { id: 'QF2', t1: groupBStandings[1], t2: groupAStandings[2], winner: null },
                { id: 'QF3', t1: groupBStandings[0], t2: groupAStandings[3], winner: null },
                { id: 'QF4', t1: groupAStandings[1], t2: groupBStandings[2], winner: null }
            ],
            sf: [
                { id: 'SF1', t1: null, t2: null, winner: null, loser: null },
                { id: 'SF2', t1: null, t2: null, winner: null, loser: null }
            ],
            medal: {
                gold: { t1: null, t2: null, winner: null },
                bronze: { t1: null, t2: null, winner: null }
            }
        };
    } else {
        // RULE: The Olympics do not have promotion/relegation for lower divisions.
        finalStakes = isOlympicYear 
            ? 'CONSOLATION' 
            : (placement === 1 ? 'PROMOTION' : (placement === groupA.length ? 'SURVIVAL' : 'CONSOLATION'));
    }

    // Who the player actually draws in the opening knockout game. The bracket has
    // always known this; nothing read it, so a quarter-final against Canada played
    // exactly like one against Latvia.
    let oppTier = null;
    if (bracket) {
        const myQF = bracket.qf.find(m => m?.t1?.isPlayer || m?.t2?.isPlayer);
        if (myQF) oppTier = (myQF.t1?.isPlayer ? myQF.t2 : myQF.t1)?.tier ?? null;
    }

    return {
        intlOppTier: oppTier,
        intlData: {
            tourneyType,
            division: isOlympicYear ? 'Olympic Tournament' : activeNatDiv,
            gamesPlayed: groupA.length - 1,
            record: { w: playerRecord.w, l: playerRecord.l, otl: playerRecord.otl, pts: playerRecord.pts },
            stats: { g: playerRecord.g, a: playerRecord.a },
            placement,
            groupSize: groupA.length,
            groupA: groupAStandings,
            groupB: groupBStandings,
            bracket
        },
        intlStakes: finalStakes
    };
}