// What the press asks, and who it makes sense to ask it of.
//
// The old pool lived in appHelpers and had eight questions filtered on one
// axis: goalie or skater. Nothing knew what league you were in, so a Wisconsin
// freshman opened his first press conference being asked about trade deadline
// rumours. There is no trade deadline in college hockey and he cannot be
// traded, so the question could not be answered honestly by anybody in the
// room. The same pool asked a defenceman why he had gone cold at the net.
//
// Two axes now decide whether a question can be asked:
//
//   scope   which leagues it makes sense in. Omitted means anywhere.
//   forPos  all | skater | forward | defence | goalie
//
// tag stays as it was ('positive' | 'negative' | 'neutral') and balances the
// three-question hand so a press conference is not all praise or all knives.

const JUNIOR = ['OHL', 'WHL', 'QMJHL', 'USHL'];
const EURO = ['SHL', 'LIIGA', 'KHL', 'SWISS', 'DEL', 'ICEHL', 'CZECH', 'SLOVAK'];
const MINOR = ['AHL', 'ECHL', 'SPHL'];

/** One tag per league, which every question's `scope` is matched against. */
export const leagueTag = (league) => {
  if (league === 'NCAA') return 'ncaa';
  if (JUNIOR.includes(league)) return 'junior';
  if (EURO.includes(league)) return 'euro';
  if (MINOR.includes(league)) return 'minor';
  if (league === 'NHL') return 'nhl';
  return 'nhl';
};

/** Forwards, defencemen and goalies get asked about different things. */
export const positionTag = (pos) => {
  if (pos === 'G') return 'goalie';
  if (pos === 'LD' || pos === 'RD') return 'defence';
  return 'forward';
};

const fitsPosition = (forPos, tag) => {
  if (!forPos || forPos === 'all') return true;
  if (forPos === 'skater') return tag !== 'goalie';
  return forPos === tag;
};

const fitsLeague = (scope, tag) => !scope || scope.includes(tag);

export const PRESS_QUESTIONS = [
  // ───────────────────────────── ANY LEAGUE, ANY POSITION ─────────────────
  {
    q: "You came up big tonight. What was going through your mind on that play?",
    forPos: 'all', tag: 'positive',
    answers: {
      professional: [
        "I was just trying to make the right read and let the puck do the work.",
        "Just sticking to our structure, taking what they give us.",
        "Saw the lane open up and trusted the systems we practice."
      ],
      passionate: [
        "The fans deserved that one. I could hear them getting louder every shift.",
        "I just wanted to step up for the boys. We needed a spark.",
        "Pure adrenaline. When the building gets that loud, you just feed off it."
      ],
      humble: [
        "The guys in front of me did all the work. I was just in the right spot.",
        "Honestly, it was a great play by my linemates. All I had to do was finish it.",
        "Just a fortunate bounce, really. Team effort all the way."
      ],
      cocky: [
        "Honestly, I saw it opening up before it happened. It's the standard I set.",
        "That's why I'm out there in those situations. I expect to make those plays.",
        "I knew I had the goalie beat before it even left my stick."
      ]
    }
  },
  {
    q: "The team's been streaking. What's clicking in the room?",
    forPos: 'all', tag: 'positive',
    answers: {
      professional: [
        "Systems. We're executing the game plan for a full sixty minutes now.",
        "We're playing a strong 200-foot game and managing the puck well.",
        "Just taking it one shift at a time, getting pucks deep."
      ],
      passionate: [
        "Everyone in there actually cares about the guy next to him. You can feel it.",
        "We're playing angry, and I love it. Nobody wants to be the one who lets go of the rope.",
        "There's a buzz in that room right now you can't manufacture."
      ],
      humble: [
        "Honestly, the coaches have us prepared. We just go out and do what they ask.",
        "The guys who don't get talked about are the reason. That's the truth of it.",
        "We've been getting bounces, and we've been smart enough not to waste them."
      ],
      cocky: [
        "We're better than the teams we're playing. It took us a while to act like it.",
        "This is what we're supposed to look like. The rest of the league is figuring that out.",
        "Nobody in this league wants to see us right now, and they know it."
      ]
    }
  },
  {
    q: "Tough loss out there. Where did the game slip away?",
    forPos: 'all', tag: 'negative',
    answers: {
      professional: [
        "We got away from our game in the second. That's where it turned.",
        "Too many turnovers through the neutral zone. We'll look at the tape.",
        "Special teams, ultimately. They won that part of the night."
      ],
      passionate: [
        "We weren't hard enough to play against. That one's on all of us.",
        "That was unacceptable, and everyone in that room knows it.",
        "We let them walk through us. I'm not going to stand here and sugarcoat it."
      ],
      humble: [
        "They were the better team tonight. Credit to them.",
        "I had a few I'd want back. I need to be better for this group.",
        "No excuses. We got beat, and we have to wear it."
      ],
      cocky: [
        "We beat ourselves. On our night that's not a close game.",
        "They'll enjoy that one. They won't get another.",
        "We gave them that. Write it down and we'll see them again."
      ]
    }
  },
  {
    q: "You just hit a big personal milestone. Take us through what it means.",
    forPos: 'all', tag: 'positive',
    answers: {
      professional: [
        "It's a marker along the way. Nice to check off, then back to work.",
        "It's a nice accomplishment, but we're focused on the bigger picture.",
        "Consistency is key. Happy to reach it, but the job isn't done."
      ],
      passionate: [
        "For my family. For everyone who believed in me when nobody else did.",
        "It's emotional. A lot of blood, sweat and tears went into this one.",
        "I love this game. To do that in front of these fans is something else."
      ],
      humble: [
        "I wouldn't have got there without every teammate I've had.",
        "I've been lucky to play with some good players who made this possible.",
        "It's a team milestone really. I just happen to be the name on it."
      ],
      cocky: [
        "Just the beginning. There's a lot more where that came from.",
        "I expect this of myself. This is exactly where I planned to be.",
        "Watch the way I play. It was only ever a matter of time."
      ]
    }
  },
  {
    q: "You've played heavy minutes for weeks now. How's the body holding up?",
    forPos: 'all', tag: 'neutral',
    answers: {
      professional: [
        "This time of year nobody's a hundred percent. You manage it and you play.",
        "The staff here are good. I do the work away from the rink and I'm fine.",
        "It's a long season. You learn what your body needs and you give it that."
      ],
      passionate: [
        "You could take a leg off me and I'd still want the next shift.",
        "I'll sleep in the summer. Right now I want every minute they'll give me.",
        "Tired is a word for February. We're past that."
      ],
      humble: [
        "Everyone in that room is sore. I'm not special.",
        "I'm fine. There are guys playing through a lot worse than me.",
        "The trainers do the hard part. I just show up and let them work."
      ],
      cocky: [
        "I'm built for this. Ask the guys trying to keep up with me.",
        "Load me up. I get better the more they play me.",
        "Other guys get tired. I get going."
      ]
    }
  },
  {
    q: "There have been some changes to the lineup this week. How's that settling?",
    forPos: 'all', tag: 'neutral',
    answers: {
      professional: [
        "That's the coach's call. My job is to be ready wherever I'm put.",
        "We've got enough depth that it shouldn't change how we play.",
        "New combinations take a few games. We'll work through it."
      ],
      passionate: [
        "Hard when you lose guys you've been through a war with. You deal with it.",
        "Whoever's beside me, I'll go to the wall for him. That doesn't change.",
        "It stings. This room was tight. But we close ranks and go again."
      ],
      humble: [
        "Not my decision to make. I just try to make it easy on whoever's out there with me.",
        "The guys coming in are good players. They'll make us better.",
        "I'll play wherever helps. That's genuinely all I care about."
      ],
      cocky: [
        "Put anyone on my wing and we'll score. That's not the issue here.",
        "I make whoever I play with better. Always have.",
        "Doesn't matter to me. The guy beside me gets dragged along either way."
      ]
    }
  },
  {
    q: "It's been a frustrating few weeks around here. What has to change?",
    forPos: 'all', tag: 'negative',
    answers: {
      professional: [
        "Details. We're losing games in the margins and that's fixable.",
        "We go back to the video, we find the pattern, and we correct it.",
        "Nothing dramatic. We've been close. We need to be clean for sixty."
      ],
      passionate: [
        "Compete. That's it. Everything else is an excuse and I'm done making them.",
        "We need somebody in that room to get angry about this. I'll be first.",
        "I'm sick of standing here saying the same things. Something has to give."
      ],
      humble: [
        "It starts with me. I haven't been good enough and that's the honest answer.",
        "I can't speak for anyone else. I know I owe this team more.",
        "We've got good people here. I just need to do my part better."
      ],
      cocky: [
        "Give me the puck more. That's a start.",
        "Some guys need to look in the mirror. I know what I'm giving this team.",
        "It'll turn. Teams like this don't stay down with players like me in the room."
      ]
    }
  },
  {
    q: "The crowd's been behind this group all year. Does that reach you out there?",
    forPos: 'all', tag: 'positive',
    answers: {
      professional: [
        "It's a good building to play in. You try not to let it swing you either way.",
        "You notice it. You can't play on emotion alone, but it helps.",
        "They've been excellent. We owe them a performance every night."
      ],
      passionate: [
        "Every single shift. When this place gets going it's the best feeling in sport.",
        "They're the reason I play. I'd run through a wall for that crowd.",
        "You feel it in your chest. There's nothing like it anywhere."
      ],
      humble: [
        "They deserve better than we've given them some nights.",
        "We're lucky. Not every player gets to play in front of people who care like that.",
        "Honestly, they carry us more than we carry them."
      ],
      cocky: [
        "They come to see players like me. I'd better give them something.",
        "They're loud because we're good. Keep winning and they stay loud.",
        "That noise is for us. Enjoy it while we're this much fun to watch."
      ]
    }
  },

  // ───────────────────────────── FORWARDS ─────────────────────────────────
  {
    q: "You've been snake-bit around the net lately. What are you seeing out there?",
    forPos: 'forward', tag: 'negative',
    answers: {
      professional: [
        "The looks are there. I keep getting to the right areas and they'll start going in.",
        "I'm not worried about the chances. The finish will come.",
        "Shooting percentage evens out over a year. I just keep shooting."
      ],
      passionate: [
        "It's eating at me. I want to score for these guys so badly it's in my head.",
        "I'm snapping sticks in the tunnel, if I'm honest. I hate letting them down.",
        "You've no idea how much this is bothering me. It'll break."
      ],
      humble: [
        "I need to be better. The chances are there and I'm not burying them.",
        "That's on me. My linemates are doing the work and I'm wasting it.",
        "I've got to find other ways to help until the goals come back."
      ],
      cocky: [
        "I'm not worried. Goalscorers score. Ask me again in ten games.",
        "The puck will find me. It always does.",
        "I've been the best player on the ice most nights. The goals are a formality."
      ]
    }
  },
  {
    q: "Your line's been generating plenty and not finishing. What's missing?",
    forPos: 'forward', tag: 'negative',
    answers: {
      professional: [
        "We're getting to the net front. We need bodies there when the puck arrives.",
        "Quality over quantity. We're settling for the perimeter shot too often.",
        "The chemistry's there. The execution on the final play isn't, yet."
      ],
      passionate: [
        "We need to get uglier. Nobody scores from the outside in this league.",
        "I want us going to the hard areas and paying the price. That's the fix.",
        "We're playing pretty hockey. Pretty hockey doesn't win anything."
      ],
      humble: [
        "The two guys with me have been great. I'm the one not finishing.",
        "We'll keep working at it. It's not for a lack of effort from them.",
        "Credit to the goalies we've faced, honestly. They've been good."
      ],
      cocky: [
        "We're the best line out there most nights. The scoresheet will catch up.",
        "Keep giving us those looks and this becomes a very different conversation.",
        "One of these nights we put up four and everyone forgets they asked."
      ]
    }
  },
  {
    q: "You've been living on the forecheck this month. What's working?",
    forPos: 'forward', tag: 'positive',
    answers: {
      professional: [
        "First man in, finish the hit, force the turnover. It's not complicated.",
        "We're getting pucks behind their D and making them turn. That's the plan.",
        "Good support from the second and third guy. That's what makes it work."
      ],
      passionate: [
        "I love that part of the game. Hunting pucks and making guys uncomfortable.",
        "If I can make a defenceman hear footsteps all night, I've done my job.",
        "That's where games get decided. In the corners, where nobody's watching."
      ],
      humble: [
        "The guys behind me are reading it well. I'd look silly out there alone.",
        "It's just work. Anyone in our room can do it if they're willing.",
        "The coaches put us in good spots. We're just doing what we're told."
      ],
      cocky: [
        "Defencemen don't want to go back for pucks when I'm coming. Simple as that.",
        "I've turned their best pair into a mess all month. It's been fun.",
        "Put me on the forecheck and somebody's night gets ruined."
      ]
    }
  },

  // ───────────────────────────── DEFENCEMEN ───────────────────────────────
  {
    q: "You drew their top line most of the night. How do you prepare for that?",
    forPos: 'defence', tag: 'positive',
    answers: {
      professional: [
        "Video. You learn their habits and you take away their first option.",
        "Good gap, stick on the right side, and don't give them the middle.",
        "You respect them without fearing them. Play your position and it's fine."
      ],
      passionate: [
        "I love that matchup. Tell me who the best player is and point me at him.",
        "That's why you play. Sixty minutes against someone who can beat you.",
        "I want them to know it's going to be a long night every single shift."
      ],
      humble: [
        "My partner made that a lot easier than it should have been.",
        "They're elite players. We got through it, that's all I'd say.",
        "The goalie bailed us out a couple of times. That's the honest version."
      ],
      cocky: [
        "They didn't get much, did they. That's not an accident.",
        "I've shut that line down before. They know where to find me.",
        "Best player on their team, and he finished the night with nothing."
      ]
    }
  },
  {
    q: "There were a couple of turnovers in your own end tonight. What happened?",
    forPos: 'defence', tag: 'negative',
    answers: {
      professional: [
        "I forced a play that wasn't there. The simple one was available.",
        "Puck management. One bad read and it's in the back of your net at this level.",
        "I'll look at it. Probably a case of trying to make too much happen."
      ],
      passionate: [
        "That's on me and it cost us. I hate giving games away like that.",
        "I'll be thinking about those two all night, I can promise you.",
        "You can't do that to your goalie. I owe him one."
      ],
      humble: [
        "Bad reads, plain and simple. I've got to be better than that.",
        "My partner had to clean up my mess twice. That isn't fair on him.",
        "No excuse for it. I'll work on it tomorrow."
      ],
      cocky: [
        "I take risks because they usually come off. Two didn't. That's the trade.",
        "I'm not going to stop making plays because two went the other way.",
        "You want a defenceman who never turns it over, you get one who never does anything."
      ]
    }
  },
  {
    q: "You've been jumping into the rush a lot more this year. Is that by design?",
    forPos: 'defence', tag: 'neutral',
    answers: {
      professional: [
        "It's in the system. If the read's there, the coaches want us activating.",
        "Only when the support's behind me. Otherwise I stay home.",
        "Fourth man high is part of the structure here. Nothing new."
      ],
      passionate: [
        "I'd be a forward if they let me. Getting up the ice is the fun part.",
        "Why stand at the blue line watching? Join the play.",
        "There's nothing better than coming in late and nobody picking you up."
      ],
      humble: [
        "The forwards cover for me when I go. All the credit's theirs.",
        "I'm only doing what the staff ask. It isn't my idea.",
        "I try to pick my spots. I get it wrong as often as I get it right."
      ],
      cocky: [
        "Nobody tracks me back. Until somebody does, I'll keep going.",
        "I'm the best skater on the ice most nights. Might as well use it.",
        "I'm not paid to stand still and watch other people play."
      ]
    }
  },

  // ───────────────────────────── GOALIES ──────────────────────────────────
  {
    q: "You've had a rough stretch in net. What are you working on?",
    forPos: 'goalie', tag: 'negative',
    answers: {
      professional: [
        "Depth in my crease and tracking pucks through traffic. Technical stuff.",
        "Working with the goalie coach on my rebound control. It's a process.",
        "Just getting back to basics. Square to the puck, control the second chance."
      ],
      passionate: [
        "I'm letting my boys down. That's what I think about when I can't sleep.",
        "I'll outwork this. Nobody will be at that rink earlier than me.",
        "It burns. I'd rather lose a tooth than lose a game like that."
      ],
      humble: [
        "I've not been good enough. The guys deserve better from me.",
        "I need to give this team a chance to win. Right now I'm not.",
        "That's on me. No shelter for a goalie and there shouldn't be."
      ],
      cocky: [
        "Every goalie has a week. Mine's over. Watch the next ten.",
        "I'm the best goalie in this league on my night, and my nights are coming back.",
        "You don't lose it. It's still there. It just needs a game to remember it."
      ]
    }
  },
  {
    q: "You stood on your head tonight. Were you seeing it that well?",
    forPos: 'goalie', tag: 'positive',
    answers: {
      professional: [
        "I was tracking well and the rebounds went where I wanted them to.",
        "The guys cleared the front of my net. That's half of it.",
        "Good preparation, good structure in front. That's what a night like that is."
      ],
      passionate: [
        "It felt like the puck was the size of a beach ball. I never wanted it to end.",
        "Those are the nights you play for. Me against the building.",
        "I would have stood in front of a car out there tonight."
      ],
      humble: [
        "A lot of those hit me. Let's be honest about it.",
        "The D blocked more than I saved. Go ask them about it.",
        "Some nights the posts are your friend. Tonight they were."
      ],
      cocky: [
        "That's the level. I expect that of myself every night I'm in there.",
        "They had their chances and they got nothing. That's the whole story.",
        "I've been telling people I'm this good. Now it's on tape."
      ]
    }
  },
  {
    q: "You're seeing a huge volume of shots most nights. Does that help or hurt?",
    forPos: 'goalie', tag: 'neutral',
    answers: {
      professional: [
        "I'd rather be busy. You stay in the game when you're touching pucks.",
        "Volume isn't the issue. The quality of what gets through is.",
        "You can't control the shot count. You control your positioning."
      ],
      passionate: [
        "Fire away. I want forty a night. That's when I feel alive back there.",
        "Bring it on. I'd play every shift of every game if they let me.",
        "The more they shoot the more I want to take something from them."
      ],
      humble: [
        "The guys block a lot that never reaches me. People don't see that.",
        "We're asking a lot of our defence right now. I'm fine."
      ],
      cocky: [
        "Shoot all you want. You still have to beat me.",
        "Forty shots, two goals. That's a good night at the office.",
        "They can keep firing. It hasn't worked yet."
      ]
    }
  },

  // ───────────────────────────── NHL ──────────────────────────────────────
  {
    q: "Trade deadline rumours have your name in them. Any comment?",
    scope: ['nhl', 'minor'], forPos: 'all', tag: 'negative',
    answers: {
      professional: [
        "That's a business matter. My focus is entirely on the next game.",
        "I don't control the front office. I control my effort on the ice.",
        "Whatever happens, happens. I'm here to play hockey."
      ],
      passionate: [
        "I love it here. I want to win here. That's all I'll say.",
        "This is my city. I don't want to go anywhere.",
        "I'll play for this crest until they tell me I can't."
      ],
      humble: [
        "Above my pay grade. I play well and let the rest sort itself out.",
        "I'm grateful to be in this league at all. The rest is noise.",
        "I just want to be a good teammate while I'm here."
      ],
      cocky: [
        "Any team would be lucky to have me. Not my problem to worry about.",
        "My value's obvious. If they move me, I'll go do it somewhere else.",
        "Teams are going to call about a player like me. That's how it works."
      ]
    }
  },
  {
    q: "Big divisional matchup coming up. Anything you want to say to them?",
    scope: ['nhl', 'minor', 'junior'], forPos: 'all', tag: 'positive',
    answers: {
      professional: [
        "They're a good hockey team. We'll prepare the way we always do.",
        "Two points, same as any other night. We'll be ready.",
        "We know them well and they know us. It usually comes down to details."
      ],
      passionate: [
        "I don't like them, they don't like us, and the building will be electric.",
        "These are the nights you circle in September. Can't wait.",
        "Everybody in our room knows what this one means. Nobody needs a speech."
      ],
      humble: [
        "They've had our number lately. We'll have to earn it.",
        "We respect them. You have to in this division.",
        "Nothing to say beforehand. Let's play and see."
      ],
      cocky: [
        "They know what's coming. Doesn't mean they can stop it.",
        "We've got their number and I think they feel it.",
        "Bring your best. It still won't be enough."
      ]
    }
  },
  {
    q: "The cap situation here has been written about all year. Does that reach the room?",
    scope: ['nhl'], forPos: 'all', tag: 'negative',
    answers: {
      professional: [
        "That's management's job. Ours is the twenty guys in that room.",
        "I've never seen a cap sheet win or lose a hockey game.",
        "We're aware of it. It doesn't change what we do on the ice."
      ],
      passionate: [
        "I don't care about any of that. I care about the guys beside me.",
        "Talk about contracts all you want. We'll talk about the game.",
        "Nobody in there is thinking about dollars when the puck drops."
      ],
      humble: [
        "I'm lucky to be paid to play. I don't spend time worrying about the rest.",
        "Smarter people than me handle it. I just play.",
        "Not for me to comment on, honestly."
      ],
      cocky: [
        "If they need cap space they know what I'm worth. That's their maths, not mine.",
        "Pay the right players and it works out. I'd start there.",
        "I'm worth every cent and I think everyone in the building knows it."
      ]
    }
  },

  // ───────────────────────────── AHL / ECHL ───────────────────────────────
  {
    q: "Everyone down here is chasing a call-up. How do you keep it out of your head?",
    scope: ['minor'], forPos: 'all', tag: 'neutral',
    answers: {
      professional: [
        "You play well here and that takes care of itself. Worrying about it doesn't.",
        "My job is this team, tonight. The rest is somebody else's decision.",
        "The guys who get called up are the ones who are good down here first."
      ],
      passionate: [
        "Of course I want it. I'd be lying if I said I didn't think about it.",
        "I want that phone call so badly it hurts. So I play like it every night.",
        "Everyone in that room is chasing the same thing. That's what makes it fun."
      ],
      humble: [
        "I've got plenty to work on right here before I think about up there.",
        "That's not my call. I just try to be useful to this team.",
        "There are guys ahead of me who've earned it. I'll wait my turn."
      ],
      cocky: [
        "I should already be up there. That's not arrogance, it's the tape.",
        "They'll call. The only question is which team figures it out first.",
        "I'm too good for this league and I think they know it."
      ]
    }
  },
  {
    q: "The parent club is deep at your position. Does that get frustrating?",
    scope: ['minor'], forPos: 'all', tag: 'negative',
    answers: {
      professional: [
        "Depth is a good problem for an organisation to have. I control my own game.",
        "Injuries happen, opportunities open. You stay ready and you take it.",
        "I can't play anybody else's games. Only mine."
      ],
      passionate: [
        "Frustrating is putting it mildly. I believe I'm better than guys up there.",
        "I didn't come this far to sit behind people. I'll make it impossible to ignore me.",
        "Yeah, it eats at me. I'd be worried if it didn't."
      ],
      humble: [
        "They're good players up there. I've got to be better to pass them.",
        "No complaints from me. I've got a jersey and a job to do.",
        "I'll keep working and see where it leaves me."
      ],
      cocky: [
        "Deep at my position? Not for long.",
        "Put me up there for ten games and that conversation ends.",
        "They're deep until they watch me play. Then they're not."
      ]
    }
  },
  {
    q: "You've been up and down all season. What's that like to live with?",
    scope: ['minor'], forPos: 'all', tag: 'negative',
    answers: {
      professional: [
        "You keep a bag packed and you don't overthink it. It's part of the job.",
        "Every org does it. You adapt or you make it harder on yourself.",
        "It's not ideal for rhythm, but it means somebody wants you in both places."
      ],
      passionate: [
        "It's exhausting, honestly. You never get to feel settled anywhere.",
        "Hard to build something with a room when you keep leaving it.",
        "I'll take the miles. Beats sitting still and being forgotten."
      ],
      humble: [
        "I'm fortunate they want me around at all. A lot of guys never get the call.",
        "It's a privilege to get up there even for a night. I won't complain.",
        "Other guys have it worse. I've no right to grumble."
      ],
      cocky: [
        "Stop sending me down and the problem solves itself.",
        "Every time I go up I produce. At some point the maths wins.",
        "I'm the best player in both rooms. Make of that what you like."
      ]
    }
  },

  // ───────────────────────────── EUROPE ───────────────────────────────────
  {
    q: "How has the bigger sheet changed your game this season?",
    scope: ['euro'], forPos: 'all', tag: 'neutral',
    answers: {
      professional: [
        "More time with the puck, less room than people think once you're wide.",
        "You have to think a half-second earlier out here. The reads are different.",
        "Skating matters more. Angles matter more. It's a thinking man's rink."
      ],
      passionate: [
        "I love it. Give me space and let me play. This is the hockey I grew up wanting.",
        "There's room to actually create something out here. It's a joy.",
        "You get to skate out here. Properly skate. I'd never go back willingly."
      ],
      humble: [
        "I'm still learning it. The guys who grew up on it make me look slow.",
        "It's taken me longer to adjust than I'd like to admit.",
        "My teammates have been patient with me while I figure it out."
      ],
      cocky: [
        "More ice for me to work with. That's bad news for everyone else.",
        "Give a player like me that much room and you've made a mistake.",
        "I've looked comfortable since week one. It suits the way I play."
      ]
    }
  },
  {
    q: "The supporters here sing for a full sixty. What's it like playing in front of that?",
    scope: ['euro'], forPos: 'all', tag: 'positive',
    answers: {
      professional: [
        "It's a serious atmosphere. You learn to use it rather than ride it.",
        "They're knowledgeable here. They know when we've been poor, too.",
        "It's a good place to play hockey. That's about the size of it."
      ],
      passionate: [
        "Hairs on the back of your neck, every warm-up. I'll never get used to it.",
        "The drums start and I'm ready to run through the boards.",
        "Nothing in North America sounds like that. Nothing."
      ],
      humble: [
        "They were here long before me and they'll be here long after.",
        "We're borrowing this club for a few years. It's theirs.",
        "They deserve more than we've given them some weeks."
      ],
      cocky: [
        "They're loud for a reason. They came to watch somebody worth watching.",
        "I give them a show and they give me that. Fair trade.",
        "Wait until the playoffs. I'll give them something to really sing about."
      ]
    }
  },
  {
    q: "There's talk of NHL clubs sending people to watch you. Does that reach you here?",
    scope: ['euro'], forPos: 'all', tag: 'neutral',
    answers: {
      professional: [
        "I'm under contract here and that's where my focus is.",
        "If they come, they come. It changes nothing about tonight.",
        "I've got a job here and I intend to do it well."
      ],
      passionate: [
        "Of course it's a dream. But I'm not going to disrespect this club chasing it.",
        "I want that one day. I want to win here first.",
        "Every kid wants that. I'm not going to pretend otherwise."
      ],
      humble: [
        "I'd be flattered if it's true. I'm not sure it is.",
        "There are better players than me in this league. Watch them.",
        "I'll keep my head down. That sort of talk has a way of going quiet."
      ],
      cocky: [
        "They should be watching. They'd be foolish not to.",
        "Tell them to come. I'll put on a show.",
        "It's a matter of when, not if. I've known that a while."
      ]
    }
  },

  // ───────────────────────────── JUNIOR ───────────────────────────────────
  {
    q: "There are scouts in this building most nights. How do you handle being watched?",
    scope: ['junior'], forPos: 'all', tag: 'neutral',
    answers: {
      professional: [
        "You can't play for the men in the stands. You play for the room.",
        "They're watching everybody. The best thing I can do is play my game.",
        "If I worry about who's here, I stop doing what got them here."
      ],
      passionate: [
        "Let them watch. I want someone in that building to leave talking about me.",
        "I love it. Big crowd, big eyes on me, that's when I'm at my best.",
        "That's the whole point, isn't it? Give them something to write down."
      ],
      humble: [
        "I try not to think about it. There are better players in this league.",
        "They're here for the team, not for me. That's how I see it.",
        "I'd rather they noticed our record than noticed me."
      ],
      cocky: [
        "They're here for me. Everybody in this rink knows that.",
        "Good. I'd hate to do this in front of nobody.",
        "They can watch. They'll see exactly what I keep telling them."
      ]
    }
  },
  {
    q: "There's a trade deadline in this league too, and your name's been mentioned.",
    scope: ['junior'], forPos: 'all', tag: 'negative',
    answers: {
      professional: [
        "I've heard it. It's not something a player my age should be managing.",
        "The club will do what's best for the club. I'll keep playing.",
        "I've been through a billet change before. You adapt."
      ],
      passionate: [
        "I don't want to leave. I've got real friends in that room.",
        "This has been home for two years. I'd hate it.",
        "I love this team. Whoever's making the call should know that."
      ],
      humble: [
        "I'm sixteen hundred miles from home already. One more move won't kill me.",
        "Whatever helps the team win. I mean that.",
        "I'll go where I'm sent and try to be useful there."
      ],
      cocky: [
        "Any club in this league would take me tomorrow. That's just true.",
        "If they want to trade their best player, that's their business.",
        "I'll go somewhere else and win there instead. Makes no difference to me."
      ]
    }
  },
  {
    q: "You're billeted a long way from home at your age. How's that been?",
    scope: ['junior'], forPos: 'all', tag: 'neutral',
    answers: {
      professional: [
        "It's part of the path. Every guy in that room has done the same thing.",
        "My billet family have been excellent. It's a professional setup here.",
        "You grow up quickly. That's not a bad thing at this age."
      ],
      passionate: [
        "I miss my mum's cooking and I miss my dog. I'd still do it again tomorrow.",
        "Homesick for about a month. Then this place became home.",
        "My family gave up a lot for this. That's fuel every single night."
      ],
      humble: [
        "My billets have been incredible to me. I owe them a lot.",
        "Plenty of guys have it harder. I've got a bed and a rink.",
        "I'm lucky. Not everyone gets looked after the way I have been."
      ],
      cocky: [
        "I didn't move across the country to be average.",
        "I came here to get drafted. So far it's going exactly to plan.",
        "Easy decision. This is where the people who matter were going to see me."
      ]
    }
  },

  // ───────────────────────────── NCAA ─────────────────────────────────────
  {
    q: "You're carrying a full course load alongside this schedule. How do you manage it?",
    scope: ['ncaa'], forPos: 'all', tag: 'neutral',
    answers: {
      professional: [
        "You plan the week out properly and you stop wasting hours. It's doable.",
        "The academic staff here are good. Nobody's doing it alone.",
        "It's a schedule. You learn it and you keep to it."
      ],
      passionate: [
        "Some weeks it's brutal. I'd still rather be busy than bored.",
        "I'm tired constantly and I love every minute of it.",
        "Bus at six, class at nine. That's the deal and I signed up for it."
      ],
      humble: [
        "Badly, some weeks. I've had a lot of help from people here.",
        "Honestly, my roommates keep me honest more than I do.",
        "There are guys in this room doing engineering. I've nothing to complain about."
      ],
      cocky: [
        "It's not hard if you're organised. Most people just aren't.",
        "I manage. Some of us can do both.",
        "Class in the morning, best player on the ice at night. It's fine."
      ]
    }
  },
  {
    q: "The portal's open and programmes are shopping. Have you thought about it?",
    scope: ['ncaa'], forPos: 'all', tag: 'negative',
    answers: {
      professional: [
        "I committed here for a reason and that reason hasn't changed.",
        "I've not spoken to anybody. My focus is finishing this season well.",
        "Everyone's name goes in a list somewhere this time of year. It means nothing."
      ],
      passionate: [
        "I'm not going anywhere. These are my guys and this is my school.",
        "I chose this programme and I'd choose it again. That's all I'll say.",
        "People leave for the wrong reasons. I'd rather finish what I started."
      ],
      humble: [
        "The staff here took a chance on me. I'm not going to forget that.",
        "I've still got things to prove here before I'd think about anywhere else.",
        "That's a question for players better than me, honestly."
      ],
      cocky: [
        "Half the country would take me tomorrow. Doesn't mean I'm interested.",
        "Let them call. They can hear me say no.",
        "I'd be the best player on any roster in the country. That's not the point."
      ]
    }
  },
  {
    q: "A lot of this room is chasing a pro contract. Does that change the locker room?",
    scope: ['ncaa'], forPos: 'all', tag: 'neutral',
    answers: {
      professional: [
        "Everyone's ambitious, but the team comes first here. The staff make sure of that.",
        "You win here and the individual stuff follows. That's well understood.",
        "No, honestly. The culture in this programme is better than that."
      ],
      passionate: [
        "If anything it makes us harder to play against. Everyone's desperate.",
        "We're all chasing the same dream. That pulls you together, not apart.",
        "Nobody in there is playing for themselves. I'd know."
      ],
      humble: [
        "I'm not sure I'm one of the ones being chased, so I can't really say.",
        "I just try to be a good teammate. The rest sorts itself out.",
        "We've got good people here. That's the main thing."
      ],
      cocky: [
        "Some guys are chasing it. I'm being chased. Different thing.",
        "It's not a worry for me. I know where I'm going.",
        "Let them chase. I'll be the first one signed."
      ]
    }
  },
  {
    q: "This programme hasn't made the tournament in a while. What would it mean to change that?",
    scope: ['ncaa'], forPos: 'all', tag: 'positive',
    answers: {
      professional: [
        "That's why we're here. You don't come to a place like this to finish mid-table.",
        "We've put ourselves in a position. Now we have to finish the job.",
        "One weekend at a time. That's genuinely how you get there."
      ],
      passionate: [
        "It would mean everything. To this school, to the people who've waited for it.",
        "I want to be part of the group that brings it back. That's the whole reason I came.",
        "You should see this campus when this team is good. I want that again."
      ],
      humble: [
        "The guys before us laid the groundwork. We'd just be finishing it.",
        "It's bigger than any of us in that room.",
        "I'd be happy just to be a small part of it."
      ],
      cocky: [
        "They've waited a long time. They got the right recruit to end it.",
        "It's changing this year. I didn't come here to watch it on television.",
        "We're going. I'd put money on it."
      ]
    }
  },
  {
    q: "An NHL club holds your rights. Are you thinking about turning pro?",
    scope: ['ncaa'], forPos: 'all', tag: 'neutral',
    answers: {
      professional: [
        "There's a conversation to have at the end of the year. Not before.",
        "I'll take the advice of people who know more than I do, when the time comes.",
        "Right now I'm a college player with games left. That's the only answer."
      ],
      passionate: [
        "I want it more than anything. I also want to finish what I started here.",
        "Ask me in April. Right now I can't think past this weekend.",
        "Every kid dreams about it. I'm not going to rush it and ruin it."
      ],
      humble: [
        "That's their decision more than mine. I've still got a lot to learn here.",
        "I'm not sure I'm ready. I'd rather be honest about that.",
        "Another year here wouldn't hurt me. I know that."
      ],
      cocky: [
        "I'm ready now. Whether they are is a different question.",
        "I could play up there tomorrow. They know it too.",
        "They're lucky I'm still developing for free."
      ]
    }
  }
];

/**
 * The three questions for one press conference.
 *
 * Filters to what fits the player's league and position, keeps media trust in
 * play (a press corps that loves you stops digging; one that hates you stops
 * handing out compliments), and balances the hand so the three are not all
 * praise or all knives.
 *
 * Falls back rather than returning short: the screen indexes questions by the
 * current question number, so a hand of two would render a blank third card.
 */
export function selectPressQuestions(player, league, count = 3) {
  const posTag = positionTag(player?.pos);
  const lgTag = leagueTag(league);
  const mediaTrust = player?.relationships?.media ?? 50;

  const eligible = PRESS_QUESTIONS.filter(q => fitsPosition(q.forPos, posTag) && fitsLeague(q.scope, lgTag));

  const byTrust = eligible.filter(q => {
    if (mediaTrust >= 75 && q.tag === 'negative') return false;
    if (mediaTrust <= 30 && q.tag === 'positive') return false;
    return true;
  });

  const take = (pool, picked) => {
    let hasPositive = picked.some(q => q.tag === 'positive');
    let hasNegative = picked.some(q => q.tag === 'negative');
    for (const q of [...pool].sort(() => 0.5 - Math.random())) {
      if (picked.includes(q)) continue;
      if (q.tag === 'positive' && hasNegative) continue;
      if (q.tag === 'negative' && hasPositive) continue;
      if (q.tag === 'positive') hasPositive = true;
      if (q.tag === 'negative') hasNegative = true;
      picked.push(q);
      if (picked.length === count) return picked;
    }
    return picked;
  };

  let picked = take(byTrust, []);
  // Relax the balance rule, then the trust rule, rather than hand back a short
  // hand. A narrow league pool plus an extreme media trust can otherwise leave
  // fewer than three, and the screen has no way to render that.
  if (picked.length < count) {
    for (const q of [...byTrust].sort(() => 0.5 - Math.random())) {
      if (!picked.includes(q)) picked.push(q);
      if (picked.length === count) break;
    }
  }
  if (picked.length < count) {
    for (const q of [...eligible].sort(() => 0.5 - Math.random())) {
      if (!picked.includes(q)) picked.push(q);
      if (picked.length === count) break;
    }
  }
  return picked;
}
