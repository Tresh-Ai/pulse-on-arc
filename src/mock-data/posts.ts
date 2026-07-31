import type { Post, PostKind } from "@/types";
import { mediaUrl } from "@/lib/identity";
import { allUsers, currentUser, users } from "./users";
import { agoMinutes, createRng, intBetween, series } from "./random";

interface Seed {
  authorIndex: number;
  kind: PostKind;
  body: string;
  minutesAgo: number;
  tags?: string[];
  communityId?: string;
  predictionId?: string;
  symbol?: string;
  mediaLabel?: string;
  pollQuestion?: string;
  pollOptions?: string[];
  pinned?: boolean;
}

const SEEDS: Seed[] = [
  {
    authorIndex: 0,
    kind: "chart",
    body: "Settled volume on the ecosystem printed a new weekly high without a single fee spike. That is the part people keep missing: throughput went up and cost per settlement stayed flat. Chart is daily settled USDC, seven day average overlaid.",
    minutesAgo: 24,
    tags: ["ecosystem", "settlement"],
    communityId: "c_1",
    symbol: "PULSE-VOL",
  },
  {
    authorIndex: 1,
    kind: "standard",
    body: "Reminder that a prediction market is just a spread with better manners. If you cannot state your invalidation level, you are not trading a view, you are buying a story.",
    minutesAgo: 41,
    tags: ["trading"],
    communityId: "c_3",
  },
  {
    authorIndex: 2,
    kind: "prediction",
    body: "Opened a market on stablecoin supply doubling this season. My honest read is 55 to 60 percent, so anything under 50 looks like free edge to me. Sizing small until the bridge data updates.",
    minutesAgo: 66,
    tags: ["predictions", "DeFi"],
    predictionId: "p_3",
  },
  {
    authorIndex: 3,
    kind: "standard",
    body: "Spent the morning reading blocks. Two observations: median settlement finality is holding under two seconds, and the long tail of failed transactions is almost entirely one misconfigured relayer. Filed a note with the team.",
    minutesAgo: 92,
    tags: ["ecosystem", "infra"],
    communityId: "c_1",
  },
  {
    authorIndex: 4,
    kind: "poll",
    body: "Genuine question for the rotation crowd, because my timeline is split down the middle right now.",
    minutesAgo: 118,
    pollQuestion: "Where does the next rotation land?",
    pollOptions: ["Pulse ecosystem", "AI agents", "Gaming", "Nothing, cash is fine"],
    tags: ["memecoins"],
    communityId: "c_4",
  },
  {
    authorIndex: 5,
    kind: "image",
    body: "Treasury dashboard we run for a stablecoin desk. Boring on purpose. Every line item maps to a policy rule, and the policy rules are public to the whole team.",
    minutesAgo: 150,
    mediaLabel: "Treasury allocation, weekly",
    tags: ["DeFi", "treasury"],
    communityId: "c_2",
  },
  {
    authorIndex: 9,
    kind: "standard",
    body: "Risk note nobody wants to hear: your prediction accuracy means very little if your position sizing is inverted. Sixty percent hit rate with your biggest stakes on the losers is a losing desk. Track stake weighted accuracy instead.",
    minutesAgo: 180,
    tags: ["risk", "predictions"],
    pinned: true,
  },
  {
    authorIndex: 6,
    kind: "chart",
    body: "Funding flipped negative into the Asia session for the first time in eleven days. Not a signal on its own, but it changes how I carry positions over the weekend.",
    minutesAgo: 214,
    symbol: "BTC-PERP",
    tags: ["trading"],
    communityId: "c_3",
  },
  {
    authorIndex: 7,
    kind: "standard",
    body: "Wrote up why bridge design is mostly a queueing problem rather than a cryptography problem. The proofs are solved. The waiting is not.",
    minutesAgo: 260,
    tags: ["infra", "bridges"],
  },
  {
    authorIndex: 11,
    kind: "announcement",
    body: "Season two of the prediction leaderboard opens Monday. Scoring switches to stake weighted accuracy, and creator rooms get their own bracket. Full rules in the pinned thread.",
    minutesAgo: 300,
    tags: ["announcement", "predictions"],
    pinned: true,
  },
  {
    authorIndex: 13,
    kind: "standard",
    body: "Published this week's hit rate. Forty one calls, twenty six correct, average hold six days. The two worst losses came from the same mistake, which is trading into a scheduled macro print.",
    minutesAgo: 360,
    tags: ["trading", "stats"],
  },
  {
    authorIndex: 8,
    kind: "image",
    body: "New drop from a studio I have followed since their first plotter series. Physical output plus onchain provenance, and the edition is capped low enough to matter.",
    minutesAgo: 420,
    mediaLabel: "Studio series 04",
    tags: ["NFTs"],
    communityId: "c_7",
  },
  {
    authorIndex: 10,
    kind: "prediction",
    body: "Guild treasury market is mispriced. The report cadence is quarterly, which means the resolution window is tighter than most people are modelling. I am on NO.",
    minutesAgo: 480,
    predictionId: "p_6",
    tags: ["gaming", "predictions"],
    communityId: "c_6",
  },
  {
    authorIndex: 12,
    kind: "standard",
    body: "Payment corridor update: two more remittance partners moved test traffic onto USDC settlement this week. Fees are not the headline, reconciliation time is. Their ops team cut a three day close to same day.",
    minutesAgo: 540,
    tags: ["payments", "ARC"],
  },
  {
    authorIndex: 15,
    kind: "poll",
    body: "Governance question we are debating in the working group.",
    minutesAgo: 620,
    pollQuestion: "Should prediction market fees fund the reputation reward pool?",
    pollOptions: ["Yes, fully", "Yes, partially", "No, keep them separate"],
    tags: ["governance"],
  },
  {
    authorIndex: 14,
    kind: "chart",
    body: "Routing costs across the two dominant bridge paths, normalised per 10k USDC. The cheaper path is not the faster one, and the gap widens during volatility.",
    minutesAgo: 700,
    symbol: "BRIDGE-COST",
    tags: ["bridges", "infra"],
  },
  {
    authorIndex: 17,
    kind: "standard",
    body: "Real yield check for the week. Lending markets are paying less than the risk free equivalent once you account for utilisation swings. I moved two thirds of the book back to short duration.",
    minutesAgo: 820,
    tags: ["DeFi", "yield"],
    communityId: "c_2",
  },
  {
    authorIndex: 16,
    kind: "standard",
    body: "Daily levels. Reclaim above the prior range high keeps the trend intact, loss of the weekly open puts us back in chop. No narrative attached, just the map.",
    minutesAgo: 900,
    tags: ["trading"],
    communityId: "c_3",
  },
  {
    authorIndex: 19,
    kind: "standard",
    body: "Twelve years on a rates desk taught me one thing that transfers perfectly here: liquidity is a schedule, not a number. Know when your market is thin before you need the exit.",
    minutesAgo: 1020,
    tags: ["trading", "risk"],
  },
  {
    authorIndex: 18,
    kind: "standard",
    body: "Validator uptime report is up. Ninety nine point nine seven percent across the quarter, one planned maintenance window, zero missed proposals in the last three weeks.",
    minutesAgo: 1180,
    tags: ["ARC", "validators"],
    communityId: "c_1",
  },
];

function buildPost(seed: Seed, index: number): Post {
  const rng = createRng(`post-${index}-${seed.body.slice(0, 24)}`);
  const author = users[seed.authorIndex] ?? allUsers[0]!;
  const post: Post = {
    id: `po_${index + 1}`,
    author,
    kind: seed.kind,
    body: seed.body,
    createdAt: agoMinutes(seed.minutesAgo),
    likes: intBetween(24, 4200, rng),
    replies: intBetween(2, 380, rng),
    reposts: intBetween(1, 640, rng),
    views: intBetween(1800, 184000, rng),
    liked: rng() > 0.75,
    reposted: rng() > 0.88,
    bookmarked: rng() > 0.85,
    tags: seed.tags ?? [],
  };

  if (seed.communityId) post.communityId = seed.communityId;
  if (seed.pinned) post.pinned = true;
  if (seed.kind === "image") {
    post.imageUrl = mediaUrl(`media-${index}`, seed.mediaLabel ?? "Attachment");
  }
  if (seed.kind === "chart") {
    post.chart = {
      symbol: seed.symbol ?? "ARC",
      change: Number(((rng() - 0.4) * 18).toFixed(2)),
      series: series(28, 100, 0.08, rng),
    };
  }
  if (seed.kind === "prediction" && seed.predictionId) {
    post.predictionId = seed.predictionId;
  }
  if (seed.kind === "poll") {
    post.poll = {
      question: seed.pollQuestion ?? "What is your read?",
      options: (seed.pollOptions ?? ["Yes", "No"]).map((label, i) => ({
        id: `po_${index + 1}_opt_${i}`,
        label,
        votes: intBetween(120, 5400, rng),
      })),
      endsAt: agoMinutes(-1440 * intBetween(1, 3, rng)),
    };
  }
  return post;
}

export const posts: Post[] = SEEDS.map(buildPost);

const REPLY_BODIES = [
  "This matches what I am seeing on my side. The reconciliation angle is underrated.",
  "Fair, though I would want two more weeks of data before calling it a trend.",
  "Saved. The invalidation framing is the part I keep skipping and regretting.",
  "Counterpoint: the same setup failed twice last quarter for reasons that had nothing to do with flow.",
  "Stake weighted accuracy is the only metric I trust now. Everything else flatters the loud accounts.",
  "Do you publish the raw series anywhere? Would like to reproduce this.",
  "Good thread. The queueing framing finally made bridge latency click for me.",
  "Watching the same corridor. Ops time savings are the actual product here.",
];

export const replies: Post[] = posts.slice(0, 8).flatMap((parent, pi) =>
  Array.from({ length: 3 }, (_, ri) => {
    const rng = createRng(`reply-${parent.id}-${ri}`);
    const author = users[(pi * 5 + ri * 3) % users.length] ?? allUsers[0]!;
    return {
      id: `re_${parent.id}_${ri}`,
      author,
      kind: "standard" as PostKind,
      body: REPLY_BODIES[(pi + ri) % REPLY_BODIES.length] ?? "Noted.",
      createdAt: agoMinutes(intBetween(3, 200, rng)),
      likes: intBetween(0, 320, rng),
      replies: intBetween(0, 18, rng),
      reposts: intBetween(0, 40, rng),
      views: intBetween(200, 24000, rng),
      liked: false,
      reposted: false,
      bookmarked: false,
      tags: [],
      replyToId: parent.id,
    };
  }),
);

export const myPosts: Post[] = [
  {
    id: "po_me_1",
    author: currentUser,
    kind: "standard",
    body: "Running a small prediction desk for a season taught me more about market structure than two years of reading whitepapers. Pricing your own uncertainty is a skill you can only build by being wrong in public.",
    createdAt: agoMinutes(150),
    likes: 1284,
    replies: 96,
    reposts: 212,
    views: 48200,
    liked: false,
    reposted: false,
    bookmarked: true,
    tags: ["predictions"],
    pinned: true,
  },
  {
    id: "po_me_2",
    author: currentUser,
    kind: "chart",
    body: "Thirty day performance on the settlement basket. Drawdown stayed inside the band I set at the start of the month, which matters more to me than the return.",
    createdAt: agoMinutes(1450),
    likes: 642,
    replies: 41,
    reposts: 88,
    views: 22600,
    liked: false,
    reposted: false,
    bookmarked: false,
    tags: ["trading", "ARC"],
    chart: { symbol: "BASKET", change: 8.42, series: series(28, 100, 0.06, createRng("me-chart")) },
  },
];

export const allPosts: Post[] = [...myPosts, ...posts, ...replies];

export function findPost(id: string): Post | undefined {
  return allPosts.find((p) => p.id === id);
}

export function repliesFor(id: string): Post[] {
  return replies.filter((r) => r.replyToId === id);
}
