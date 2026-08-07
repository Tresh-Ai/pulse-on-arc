import type { Prediction, PredictionCategory, PredictionStatus } from "@/types";
import { allUsers, users } from "./users";
import { agoDays, agoMinutes, createRng, floatBetween, inDays, intBetween, pick } from "./random";

interface Seed {
  title: string;
  description: string;
  rules: string;
  category: PredictionCategory;
  status: PredictionStatus;
  endsInDays: number;
  yes: number;
  communityId?: string;
  outcome?: "yes" | "no";
  myPosition?: { side: "yes" | "no"; stake: number };
}

const SEEDS: Seed[] = [
  {
    title: "Will Pulse mainnet settle more than 5M USDC in a single day before September?",
    description:
      "Daily settled volume on Pulse has climbed steadily since the payments corridor pilots opened. This market resolves on the first calendar day where public explorer data shows settled USDC volume above 5 million.",
    rules:
      "Resolves YES if any single UTC day before September 1 records settled volume above 5,000,000 USDC on the public explorer. Resolution uses the explorer daily aggregate at 00:15 UTC the following day. Reorgs beyond one hour are ignored.",
    category: "Pulse Ecosystem",
    status: "open",
    endsInDays: 24,
    yes: 68,
    communityId: "c_1",
    myPosition: { side: "yes", stake: 250 },
  },
  {
    title: "BTC closes above 140k on the last day of the quarter",
    description:
      "Quarter end close measured on the reference index. Spot only, no perpetual marks. A clean read on whether the current trend survives the next macro print.",
    rules:
      "Resolves YES if the reference spot index close on the final UTC day of the quarter is above 140,000. The index is the equal weighted average of three major venues. If a venue halts, the remaining venues are used.",
    category: "Crypto",
    status: "open",
    endsInDays: 61,
    yes: 41,
    communityId: "c_3",
  },
  {
    title: "Will stablecoin supply on Pulse double by the end of the season?",
    description:
      "Tracking total issued stablecoin supply bridged to or natively minted on Pulse. Doubling from the season open snapshot is the bar.",
    rules:
      "Resolves YES if total stablecoin supply is at least 200 percent of the season open snapshot at any point before the end date. Snapshot values come from the public indexer.",
    category: "Pulse Ecosystem",
    status: "closing-soon",
    endsInDays: 2,
    yes: 57,
    communityId: "c_2",
    myPosition: { side: "no", stake: 120 },
  },
  {
    title: "Fed delivers a cut at the next meeting",
    description:
      "Rates market is pricing this near a coin flip. Crypto beta has been sensitive to every dot plot revision this cycle.",
    rules:
      "Resolves YES if the target range is lowered at the next scheduled meeting, per the official statement. Intermeeting action also resolves YES.",
    category: "Macro",
    status: "open",
    endsInDays: 18,
    yes: 52,
  },
  {
    title: "A prediction market on this platform crosses 1M USDC in pool size",
    description:
      "Reflexive but fun. Pool size is the sum of both sides at resolution time on any single market on the network.",
    rules:
      "Resolves YES when any single market shows a combined pool above 1,000,000 USDC. Measured from the platform market list.",
    category: "Tech",
    status: "open",
    endsInDays: 45,
    yes: 34,
  },
  {
    title: "Top gaming guild treasury rotates into stablecoins above 60 percent",
    description:
      "Guild treasuries have been rebalancing after two soft seasons. This market tracks the largest publicly reporting guild.",
    rules:
      "Resolves YES if the guild published treasury report shows stablecoin allocation above 60 percent before the end date.",
    category: "Gaming",
    status: "open",
    endsInDays: 30,
    yes: 46,
    communityId: "c_6",
  },
  {
    title: "Pulse testnet validator count passes 250",
    description:
      "Validator growth has tracked the incentive program closely. Public dashboard is the source of truth.",
    rules:
      "Resolves YES if the public validator dashboard reports 250 or more active validators before the end date.",
    category: "Pulse Ecosystem",
    status: "resolved",
    endsInDays: -6,
    yes: 82,
    outcome: "yes",
    communityId: "c_1",
    myPosition: { side: "yes", stake: 400 },
  },
  {
    title: "An AI agent framework ships native USDC payments this month",
    description:
      "Agent frameworks keep promising machine to machine payments. This market asks whether one actually shipped.",
    rules:
      "Resolves YES if a framework with more than 5k stars publishes a release with native USDC payment support before month end.",
    category: "AI",
    status: "open",
    endsInDays: 11,
    yes: 63,
    communityId: "c_5",
  },
  {
    title: "Memecoin sector market cap ends the month lower",
    description:
      "Rotation fatigue is visible in volumes. Sector aggregate measured on the public index.",
    rules:
      "Resolves YES if the sector index market cap on the final day of the month is below the first day value.",
    category: "Culture",
    status: "open",
    endsInDays: 9,
    yes: 55,
    communityId: "c_4",
  },
  {
    title: "Bridge volume to Pulse beats last month by 30 percent",
    description:
      "Cross chain routing has consolidated into two dominant paths. Both report public volume.",
    rules:
      "Resolves YES if combined reported bridge volume exceeds last month by 30 percent or more.",
    category: "Crypto",
    status: "resolved",
    endsInDays: -14,
    yes: 38,
    outcome: "no",
  },
  {
    title: "A major payment processor announces Pulse support this quarter",
    description:
      "Two processors have hinted at pilots. An announcement must be public and first party.",
    rules:
      "Resolves YES on a first party public announcement from a processor handling over 1B USD annually.",
    category: "Tech",
    status: "open",
    endsInDays: 52,
    yes: 29,
  },
  {
    title: "Network reputation leader changes before the season ends",
    description:
      "The current reputation leader has held the top slot for six weeks. Challengers are close.",
    rules:
      "Resolves YES if the all time reputation leaderboard shows a different account at rank one at season end.",
    category: "Culture",
    status: "closing-soon",
    endsInDays: 1,
    yes: 44,
  },
];

export const predictions: Prediction[] = SEEDS.map((seed, index) => {
  const rng = createRng(`prediction-${index}-${seed.title}`);
  const creator = users[index % users.length] ?? allUsers[0]!;
  const participants = intBetween(64, 4800, rng);
  const pool = intBetween(12_000, 940_000, rng);
  const points = 18;
  const volumeSeries = Array.from({ length: points }, (_, i) => {
    const drift = (seed.yes - 50) * (i / points);
    return {
      t: agoDays(points - i),
      yes: Math.min(94, Math.max(6, Math.round(50 + drift + (rng() - 0.5) * 9))),
    };
  });

  const topParticipants = Array.from({ length: 6 }, (_, i) => {
    const user = users[(index + i * 3) % users.length] ?? allUsers[0]!;
    return {
      user,
      side: (rng() > (seed.yes > 50 ? 0.35 : 0.6) ? "yes" : "no") as "yes" | "no",
      stake: intBetween(80, 12_000, rng),
      at: agoMinutes(intBetween(30, 8000, rng)),
    };
  });

  const timeline = [
    {
      id: `t${index}-1`,
      label: "Market created",
      detail: `Opened by @${creator.username}`,
      at: agoDays(intBetween(12, 40, rng)),
    },
    {
      id: `t${index}-2`,
      label: "Liquidity milestone",
      detail: `Pool crossed ${Math.round(pool / 2).toLocaleString()} USDC`,
      at: agoDays(intBetween(4, 11, rng)),
    },
    {
      id: `t${index}-3`,
      label: "Odds shift",
      detail: `YES moved to ${seed.yes} percent after a volume spike`,
      at: agoDays(intBetween(1, 3, rng)),
    },
    ...(seed.outcome
      ? [
          {
            id: `t${index}-4`,
            label: "Resolved",
            detail: `Settled ${seed.outcome.toUpperCase()} using the stated resolution source`,
            at: agoDays(Math.abs(seed.endsInDays)),
          },
        ]
      : []),
  ];

  return {
    id: `p_${index + 1}`,
    title: seed.title,
    description: seed.description,
    rules: seed.rules,
    category: seed.category,
    createdAt: agoDays(intBetween(12, 40, rng)),
    endsAt: inDays(seed.endsInDays),
    creator,
    status: seed.status,
    participants,
    pool,
    yesPercent: seed.yes,
    volumeSeries,
    outcome: seed.outcome,
    communityId: seed.communityId,
    topParticipants,
    timeline,
    myPosition: seed.myPosition,
  };
});

export function findPrediction(id: string): Prediction | undefined {
  return predictions.find((p) => p.id === id);
}

export const predictionCategories: PredictionCategory[] = [
  "Crypto",
  "Pulse Ecosystem",
  "Macro",
  "Culture",
  "Tech",
  "Gaming",
  "AI",
];

/** Aggregate stats for the current account, shown on prediction history. */
export const myPredictionStats = (() => {
  const rng = createRng("my-prediction-stats");
  return {
    accuracy: 71.4,
    resolved: 46,
    open: 7,
    netPnl: 4820.5,
    bestStreak: 9,
    volumeTraded: 128_400,
    byCategory: predictionCategories.map((c) => ({
      category: c,
      accuracy: floatBetween(52, 82, rng, 1),
      markets: intBetween(3, 18, rng),
    })),
    recent: predictions.slice(0, 6).map((p) => ({
      prediction: p,
      side: pick(["yes", "no"] as const, rng),
      stake: intBetween(60, 900, rng),
      result: p.outcome ? (rng() > 0.35 ? "win" : "loss") : "pending",
    })),
  };
})();
