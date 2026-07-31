import type { CreatorStats, TokenInfo, WalletSummary, WalletTransaction } from "@/types";
import { currentUser } from "./users";
import { agoDays, agoMinutes, createRng, floatBetween, intBetween, pick } from "./random";

const rng = createRng("wallet");

const TX_SEEDS: Pick<WalletTransaction, "kind" | "asset" | "amount" | "counterparty">[] = [
  { kind: "deposit", asset: "USDC", amount: 5000, counterparty: "Bank transfer" },
  { kind: "prediction", asset: "USDC", amount: -250, counterparty: "Pulse settlement market" },
  { kind: "reward", asset: "PLSX", amount: 1840, counterparty: "Season one rewards" },
  { kind: "send", asset: "USDC", amount: -420, counterparty: "@settlement_sam" },
  { kind: "receive", asset: "USDC", amount: 1200, counterparty: "@riskrachel" },
  { kind: "prediction", asset: "USDC", amount: 640, counterparty: "Validator count market" },
  { kind: "withdraw", asset: "USDC", amount: -2200, counterparty: "External wallet" },
  { kind: "send", asset: "PLS", amount: -32, counterparty: "@zkfarmer" },
  { kind: "receive", asset: "PLS", amount: 118, counterparty: "Creator payout" },
  { kind: "prediction", asset: "USDC", amount: -120, counterparty: "Stablecoin supply market" },
  { kind: "reward", asset: "PLSX", amount: 320, counterparty: "Referral bonus" },
  { kind: "deposit", asset: "USDC", amount: 3200, counterparty: "Bank transfer" },
];

export const walletSummary: WalletSummary = {
  totalUsd: 48_216.42,
  change24h: 3.18,
  address: currentUser.walletAddress,
  assets: [
    {
      symbol: "USDC",
      name: "USD Coin",
      balance: 24_180.42,
      usdValue: 24_180.42,
      change24h: 0.01,
      logoTint: "cyan",
    },
    {
      symbol: "PLS",
      name: "Pulse Network",
      balance: 4_820.5,
      usdValue: 16_785.98,
      change24h: 6.42,
      logoTint: "primary",
    },
    {
      symbol: "PLSX",
      name: "Pulse Social",
      balance: 14_240,
      usdValue: 6_006.43,
      change24h: 12.84,
      logoTint: "success",
    },
    {
      symbol: "SETL",
      name: "Settle Protocol",
      balance: 15_800,
      usdValue: 1_330.36,
      change24h: -4.12,
      logoTint: "warning",
    },
  ],
  transactions: TX_SEEDS.map((seed, i) => ({
    ...seed,
    id: `tx_${i + 1}`,
    usdValue: Math.abs(seed.amount) * (seed.asset === "USDC" ? 1 : seed.asset === "PLS" ? 3.48 : 0.42),
    at: agoMinutes(intBetween(20, 40_000, rng)),
    status: i === 1 ? "pending" : i === 7 ? "failed" : "confirmed",
    hash: `0x${createRng(`tx-${i}`)().toString(16).slice(2, 12)}${i}a4f`,
  })),
};

export const tokenInfo: TokenInfo = {
  symbol: "PLSX",
  name: "Pulse Social",
  price: 0.4218,
  change24h: 12.84,
  marketCap: 168_720_000,
  circulatingSupply: 400_000_000,
  totalSupply: 1_000_000_000,
  holders: 84_216,
  volume24h: 18_420_000,
  series: Array.from({ length: 60 }, (_, i) => ({
    t: agoDays(60 - i),
    price: Number((0.18 + i * 0.004 + (rng() - 0.45) * 0.03).toFixed(4)),
  })),
  utility: [
    {
      title: "Prediction collateral",
      detail: "Post PulseS alongside USDC to open markets and earn a share of resolution fees.",
    },
    {
      title: "Reputation weighting",
      detail: "Staked PulseS increases the weight of your calls in the accuracy leaderboards.",
    },
    {
      title: "Creator subscriptions",
      detail: "Communities can price paid rooms and research feeds directly in PulseS.",
    },
    {
      title: "Governance",
      detail: "Signal on scoring rules, fee routing, and community policy each season.",
    },
  ],
  activity: [
    { id: "ta_1", label: "Season two reward pool funded", detail: "1.2M PulseS moved to the reward contract", at: agoMinutes(120) },
    { id: "ta_2", label: "New market collateral record", detail: "184k PulseS posted as collateral in one day", at: agoMinutes(640) },
    { id: "ta_3", label: "Creator payouts settled", detail: "2,410 creators received subscription revenue", at: agoDays(2) },
    { id: "ta_4", label: "Staking tier update", detail: "Reputation weighting curve adjusted after governance signal", at: agoDays(5) },
  ],
};

export const creatorStats: CreatorStats = {
  followers: currentUser.followers,
  followerChange: 8.4,
  revenue: 12_840.5,
  revenueChange: 22.6,
  subscribers: 486,
  subscriberChange: 11.2,
  engagementRate: 7.8,
  engagementChange: -1.4,
  predictionsCreated: 34,
  predictionAccuracy: currentUser.predictionAccuracy,
  resolvedPredictions: 27,
  audienceSeries: Array.from({ length: 30 }, (_, i) => ({
    t: agoDays(30 - i),
    followers: 10_400 + i * 70 + Math.round((rng() - 0.4) * 180),
    revenue: 220 + i * 12 + Math.round((rng() - 0.4) * 90),
  })),
  topContent: [
    { id: "po_me_1", title: "Running a small prediction desk for a season taught me...", kind: "standard", impressions: 48_200, engagement: 9.4 },
    { id: "po_me_2", title: "Thirty day performance on the settlement basket", kind: "chart", impressions: 22_600, engagement: 7.1 },
    { id: "po_me_3", title: "Why I price my own uncertainty before the market does", kind: "announcement", impressions: 18_400, engagement: 6.2 },
    { id: "po_me_4", title: "Corridor volume, normalised per 10k USDC", kind: "image", impressions: 14_820, engagement: 5.8 },
    { id: "po_me_5", title: "Season one desk review, every trade listed", kind: "standard", impressions: 12_240, engagement: 5.1 },
  ],
};

export const portfolioPreview = {
  totalUsd: walletSummary.totalUsd,
  change30d: 18.6,
  positions: walletSummary.assets.slice(0, 3).map((a) => ({
    symbol: a.symbol,
    allocation: Number(((a.usdValue / walletSummary.totalUsd) * 100).toFixed(1)),
    change24h: a.change24h,
  })),
  series: Array.from({ length: 30 }, (_, i) => ({
    t: agoDays(30 - i),
    value: 40_000 + i * 280 + Math.round((rng() - 0.4) * 900),
  })),
};

export const activityFeed = Array.from({ length: 8 }, (_, i) => ({
  id: `af_${i + 1}`,
  label: pick(
    [
      "Opened a prediction position",
      "Published a chart post",
      "Joined a community",
      "Resolved a market",
      "Earned an achievement",
      "Followed a creator",
    ] as const,
    rng,
  ),
  detail: pick(
    [
      "Pulse settlement volume market, YES side",
      "Funding flip into the Asia session",
      "DeFi Desk",
      "Validator count market settled YES",
      "Sharp Caller unlocked",
      "@delta_neutral",
    ] as const,
    rng,
  ),
  at: agoMinutes(intBetween(40, 20_000, rng)),
  amount: floatBetween(-400, 900, rng, 2),
}));
