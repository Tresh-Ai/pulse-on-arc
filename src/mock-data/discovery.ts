import type {
  LeaderboardBoard,
  LeaderboardEntry,
  LeaderboardRange,
  TrendingTopic,
} from "@/types";
import { formatCompact, formatPercent, formatUsd } from "@/lib/utils";
import { users } from "./users";
import { createRng, floatBetween, intBetween } from "./random";

const BOARD_META: Record<
  LeaderboardBoard,
  { primaryLabel: string; secondaryLabel: string }
> = {
  traders: { primaryLabel: "30d return", secondaryLabel: "Volume" },
  predictors: { primaryLabel: "Accuracy", secondaryLabel: "Markets" },
  creators: { primaryLabel: "Engagement", secondaryLabel: "Followers" },
  reputation: { primaryLabel: "Reputation", secondaryLabel: "Accuracy" },
  active: { primaryLabel: "Posts", secondaryLabel: "Replies" },
};

export function buildLeaderboard(
  board: LeaderboardBoard,
  range: LeaderboardRange,
): LeaderboardEntry[] {
  const rng = createRng(`leaderboard-${board}-${range}`);
  const meta = BOARD_META[board];
  const ordered = [...users].sort(
    (a, b) => createRng(`${board}-${range}-${b.id}`)() - createRng(`${board}-${range}-${a.id}`)(),
  );

  return ordered.slice(0, 15).map((user, i) => {
    let primaryStat = "";
    let secondaryStat = "";
    switch (board) {
      case "traders":
        primaryStat = formatPercent(floatBetween(6, 92, rng, 1));
        secondaryStat = formatUsd(intBetween(120_000, 8_400_000, rng), { compact: true });
        break;
      case "predictors":
        primaryStat = `${floatBetween(58, 89, rng, 1)}%`;
        secondaryStat = `${intBetween(18, 240, rng)}`;
        break;
      case "creators":
        primaryStat = `${floatBetween(3.2, 14.8, rng, 1)}%`;
        secondaryStat = formatCompact(user.followers);
        break;
      case "reputation":
        primaryStat = `${intBetween(760, 998, rng)}`;
        secondaryStat = `${user.predictionAccuracy}%`;
        break;
      default:
        primaryStat = `${intBetween(60, 480, rng)}`;
        secondaryStat = `${intBetween(180, 2400, rng)}`;
    }
    return {
      rank: i + 1,
      user,
      primaryStat,
      primaryLabel: meta.primaryLabel,
      secondaryStat,
      secondaryLabel: meta.secondaryLabel,
      change: intBetween(-6, 8, rng),
    };
  });
}

export const trendingTopics: TrendingTopic[] = [
  { id: "tt_1", tag: "PulseSettlement", category: "Pulse Ecosystem", posts: 18240, change: 42.6 },
  { id: "tt_2", tag: "StakeWeighted", category: "Predictions", posts: 9620, change: 128.4 },
  { id: "tt_3", tag: "FundingFlip", category: "Trading", posts: 7410, change: -12.2 },
  { id: "tt_4", tag: "RealYield", category: "DeFi", posts: 6180, change: 18.9 },
  { id: "tt_5", tag: "AgentPayments", category: "AI", posts: 5240, change: 64.1 },
  { id: "tt_6", tag: "GuildTreasury", category: "Gaming", posts: 3120, change: 8.4 },
  { id: "tt_7", tag: "PlotterSeries", category: "NFTs", posts: 2260, change: 22.7 },
  { id: "tt_8", tag: "RotationFatigue", category: "Memecoins", posts: 1980, change: -31.5 },
];

export const tokenList = [
  { symbol: "PLS", name: "Pulse Network", price: 3.482, change24h: 6.42 },
  { symbol: "USDC", name: "USD Coin", price: 1.0, change24h: 0.01 },
  { symbol: "PLSX", name: "Pulse Social", price: 0.4218, change24h: 12.84 },
  { symbol: "BTC", name: "Bitcoin", price: 118420.5, change24h: 1.86 },
  { symbol: "ETH", name: "Ethereum", price: 4218.24, change24h: -0.94 },
  { symbol: "SETL", name: "Settle Protocol", price: 0.0842, change24h: 24.6 },
];
