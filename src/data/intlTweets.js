// WHAT THE REPORTERS SAID.
//
// A tournament game used to end on the score and one line about the play you
// picked, which said whether the plan worked and nothing about how you played.
// Now the people covering the tournament post about it: a reporter from your
// own country on your night, and a second post on what the result means, or
// on your numbers when they're worth a post of their own.
//
// Every reporter here is made up, and so are their handles.

const BEAT = {
  CAN: { name: 'Marty Coyle', handle: '@CoyleOnHockey' },
  USA: { name: 'Jen Whitacre', handle: '@JWhitacreHockey' },
  SWE: { name: 'Elin Bergsten', handle: '@BergstenHockey' },
  FIN: { name: 'Sami Kivelä', handle: '@KivelaKiekko' },
  CZE: { name: 'Petra Navrátilová', handle: '@NavratilovaHokej' },
  SVK: { name: 'Marek Hanula', handle: '@HanulaHokej' },
  SUI: { name: 'Reto Ammann', handle: '@AmmannEishockey' },
  GER: { name: 'Lena Hartwig', handle: '@HartwigEishockey' },
  RUS: { name: 'Dmitri Kalinin', handle: '@KalininHockey' },
  DEN: { name: 'Mads Kjeldsen', handle: '@KjeldsenIshockey' },
  NOR: { name: 'Ida Lunde', handle: '@LundeIshockey' },
  LAT: { name: 'Edgars Ozols', handle: '@OzolsHokejs' }
};
const BEAT_DEFAULT = { name: 'Chris Adair', handle: '@AdairOnIntl' };
const WIRE = { name: 'Tom Rennick', handle: '@RennickWrites' };
const NUMBERS = { name: 'Puck Ledger', handle: '@PuckLedger' };

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
// A score the way a reporter writes it, winner's number first. The run
// keeps it from our side, so a loss reads 2-4.
const asReported = (score, won) => {
  const m = String(score || '').match(/^(\d+)-(\d+)(.*)$/);
  if (!m || won) return score;
  return `${m[2]}-${m[1]}${m[3]}`;
};
const surnameOf = (name) => {
  const parts = String(name || '').trim().split(/\s+/);
  return parts[parts.length - 1] || 'He';
};

function skaterPost({ S, C, Cs, O, score, won, line, entry, isD }) {
  const g = line.g || 0, a = line.a || 0, pts = g + a;
  const ptsText = g && a ? `${g === 1 ? 'a goal' : `${g} goals`} and ${a === 1 ? 'an assist' : `${a} assists`}`
    : g ? (g === 1 ? 'a goal' : `${g} goals`) : (a === 1 ? 'an assist' : `${a} assists`);

  if (line.soWinner) return pick([
    `${S} beats the goalie in the shootout and ${Cs} get out of there with the win. ${score} over ${O}.`,
    `Shootout, and they sent ${S} out with the game on his stick. He scored. ${Cs} win.`
  ]);
  if (entry.rescued && won && g > 0) return pick([
    `${S} in overtime! ${Cs} beat ${O} ${score}.`,
    `It was tied and going nowhere, and then ${S} ended it. ${Cs} survive, ${score}.`
  ]);
  if (g >= 3) return won
    ? pick([
      `Hat trick for ${S}. ${Cs} beat ${O} ${score}, and he was the best player on the ice by a mile.`,
      `Three goals for ${S} against ${O}. Somebody go and find out when ${C} last had one of those at this tournament.`
    ])
    : `${S} scored three and ${C} still lost ${score} to ${O}. That one is going to sting.`;
  if (pts >= 3) return won
    ? pick([
      `${S} tonight: ${ptsText}. ${O} never worked out how to stop him.`,
      `${pts} points for ${S} in the ${score} win over ${O}. He's driving this team right now.`
    ])
    : `${pts} points for ${S}, and it wasn't enough. ${Cs} drop this one ${score} to ${O}.`;
  if (pts === 2) return won
    ? pick([
      `Two-point night for ${S}. ${Cs} take care of ${O}, ${score}.`,
      `${S} finished with ${ptsText} against ${O}. He's been one of the best players here.`
    ])
    : `${S} had ${ptsText}, which was about the only thing that went right for ${C} tonight.`;
  if (g === 1) return won
    ? pick([
      `${S} scores, and ${C} beat ${O} ${score}.`,
      `Lovely finish from ${S}. That's the goal the coaches picked him for. ${Cs} win ${score}.`
    ])
    : `${S} got one back, but ${C} lose ${score} to ${O}.`;
  if (a === 1) return won
    ? pick([
      `${S} with the assist. He won't get the headline, but watch the replay: he started it.`,
      `${Cs} win ${score}. ${S} picked up an assist and did a lot of work nobody will write about.`
    ])
    : `One assist for ${S} in the ${score} loss to ${O}.`;
  if (isD && (line.blk || 0) >= 4) return won
    ? `${line.blk} blocked shots for ${S} in the ${score} win. He's going to be sore tomorrow.`
    : `${S} blocked ${line.blk} shots and ${C} still lost ${score}. He gave them everything he had.`;
  if (won) return pick([
    `${Cs} win ${score}. ${S} didn't get on the scoresheet, but ${O} hated playing against him.`,
    `Quiet night for ${S}, and ${C} didn't need him to be loud. ${score} over ${O}.`
  ]);
  if ((line.pm || 0) <= -2) return `${S} was on the ice for ${-line.pm} goals against tonight. Rough one, and ${C} lose ${score} to ${O}.`;
  return pick([
    `No points for ${S} and a ${score} loss to ${O}. He'll want that one back.`,
    `${S} spent the night chasing it. ${Cs} lose ${score} to ${O}.`
  ]);
}

function goaliePost({ S, C, Cs, O, score, won, line }) {
  const shots = line.shots || 0, saves = line.saves || 0, ga = Math.max(0, shots - saves);
  const pct = shots ? saves / shots : 0;
  if (line.sho) return pick([
    `Shutout for ${S}. ${saves} saves, and ${O} never found a way past him.`,
    `${S} stops all ${saves}. Clean sheet for ${C}, ${score}.`
  ]);
  if (won && shots >= 35) return `${O} threw ${shots} shots at ${S} and got ${ga} past him. He stole this one for ${C}.`;
  if (won && pct >= 0.94) return `${S} made ${saves} saves on ${shots} shots. ${Cs} are winning games here because of their goalie.`;
  if (won) return pick([
    `Solid from ${S}: ${saves} saves in the ${score} win over ${O}.`,
    `${S} didn't have to be great tonight, and he wasn't asked to be. ${saves} saves, ${Cs} win ${score}.`
  ]);
  if (pct >= 0.92) return `${S} made ${saves} saves and lost anyway. There isn't much more he could have done.`;
  if (ga >= 5) return `${ga} goals against for ${S} on ${shots} shots. A tough night, and the questions about the net start now.`;
  return `${S} let in ${ga} on ${shots} shots in the ${score} loss to ${O}.`;
}

// The result itself, when it means something: a medal, an exit, promotion.
function stagePost({ C, Cs, O, won, entry, S, isG }) {
  const key = entry.key;
  if (entry.decider === 'PROMOTION') return won ? `${Cs} are promoted. Next year they play with the big nations.` : `${O} go up instead. ${Cs} will be back in this division next year.`;
  if (entry.decider === 'SURVIVAL') return won ? `${Cs} stay up. They needed that one.` : `${Cs} are relegated. That's a long year coming for that program.`;
  if (key === 'FINAL' || key === 'DECIDER') return won
    ? pick([
      `GOLD. ${Cs} are champions, and ${S} has a medal around his neck for the rest of his life.`,
      `${Cs} win it all! Somebody get ${S} a phone, his family will want to hear from him.`
    ])
    : `${O} win gold. ${Cs} take silver, and right now that feels like losing.`;
  if (key === 'BRONZE') return won
    ? `Bronze for ${C}. They lost the semi and came back two days later to win their last game, which counts for something.`
    : `${Cs} finish fourth and go home with nothing. That's the cruellest place to finish.`;
  if (key === 'SF') return won ? `${Cs} are going to the gold medal game.` : `${O} end the gold medal dream. ${Cs} play for bronze.`;
  if (key === 'QF') return won ? `${Cs} are into the semifinals.` : `${Cs} are out in the quarterfinals.${isG ? '' : ' Early flights home for a lot of good players.'}`;
  return null;
}

// His tournament so far, when the numbers are worth posting.
function numbersPost({ S, isG, totals, tourney }) {
  if (!totals || (totals.games || 0) < 2) return null;
  if (isG) {
    const pct = totals.shots ? totals.saves / totals.shots : 0;
    if (pct < 0.925) return null;
    return `${S} at the ${tourney}: ${pct.toFixed(3).replace(/^0/, '')} save percentage through ${totals.games} games${totals.sho ? `, ${totals.sho} shutout${totals.sho === 1 ? '' : 's'}` : ''}.`;
  }
  const pts = (totals.g || 0) + (totals.a || 0);
  if (pts < totals.games) return null;
  return `${S} at the ${tourney}: ${totals.g}G ${totals.a}A, ${pts} points in ${totals.games} games.`;
}

/**
 * The posts after one game: one about his night, one about the result or
 * his numbers. Returns [{ name, handle, text }].
 */
export function intlTweets({ player, entry, countryName, tourney, totals }) {
  if (!player || !entry) return [];
  const isG = player.pos === 'G';
  const S = surnameOf(player.name);
  const C = countryName || 'his country';
  const ctx = {
    S, C, Cs: cap(C), O: entry.opponent?.name || 'the other side', score: asReported(entry.score, !!entry.won),
    won: !!entry.won, line: entry.line || {}, entry, isG,
    isD: player.pos === 'LD' || player.pos === 'RD'
  };
  const beat = BEAT[player.nat] || BEAT_DEFAULT;
  const posts = [{ ...beat, text: isG ? goaliePost(ctx) : skaterPost(ctx) }];
  const stage = stagePost(ctx);
  const nums = numbersPost({ S, isG, totals, tourney });
  if (stage) posts.push({ ...WIRE, text: stage });
  else if (nums) posts.push({ ...NUMBERS, text: nums });
  return posts;
}
