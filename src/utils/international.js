// Which room a nation plays in.
//
// A player's division is only ever written onto him when his nation is promoted
// or relegated, so for every career before that happens it is simply undefined.
// Trusting the caller to pass it meant an undefined division matched no nation
// in the table and the group came back empty. Resolved here, from the
// nationality table, so every caller and every existing career gets the same
// answer.
//
// The group stage used to be simulated here as well: a round robin played
// behind the player's back, printed as a table he had no part in, with the
// knockout games bolted on afterwards as random minigames. The tournament is
// played game by game now, in intlRun, so none of that is left.

// The World Juniors have their own divisions, kept on natDivU20; the Worlds
// and the Olympics read the senior one.
export function resolveNatDivision(player, safeNationalities, context = null) {
  if (context === 'wjc') {
    if (player?.natDivU20) return player.natDivU20;
  } else if (player?.natDiv) return player.natDiv;
  const nat = (safeNationalities || []).find(n => n.id === player?.nat);
  return nat?.division || 'Top Division';
}
