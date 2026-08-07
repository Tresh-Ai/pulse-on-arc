import type { Achievement, Interest, User } from "@/types";
import { avatarUrl, bannerUrl } from "@/lib/identity";
import { agoDays, createRng, floatBetween, intBetween, pickMany } from "./random";

const INTERESTS: Interest[] = [
  "Trading",
  "DeFi",
  "NFTs",
  "AI",
  "Memecoins",
  "Gaming",
  "Pulse Ecosystem",
];

const ACHIEVEMENT_POOL: Omit<Achievement, "id" | "earnedAt">[] = [
  {
    label: "Top 100 Predictor",
    description: "Finished a season inside the top 100 predictors.",
    icon: "trophy",
  },
  {
    label: "30 Day Streak",
    description: "Posted market analysis every day for a month.",
    icon: "flame",
  },
  {
    label: "Sharp Caller",
    description: "Resolved ten predictions above 70 percent accuracy.",
    icon: "target",
  },
  {
    label: "Early Pulse",
    description: "Joined during the Pulse testnet season.",
    icon: "sparkles",
  },
  {
    label: "Community Guardian",
    description: "Moderated a community with over 10k members.",
    icon: "shield",
  },
  {
    label: "Creator of the Month",
    description: "Highest engagement across the network.",
    icon: "crown",
  },
];

interface Seed {
  username: string;
  displayName: string;
  bio: string;
  creator?: boolean;
  verified?: boolean;
}

const SEEDS: Seed[] = [
  {
    username: "arcmaxi",
    displayName: "Nadia Okafor",
    bio: "Liquidity research on Pulse. Publishing settlement flow breakdowns every Tuesday.",
    creator: true,
    verified: true,
  },
  {
    username: "settlement_sam",
    displayName: "Samir Haddad",
    bio: "USDC settlement nerd. Ex market maker. Charts, spreads, and boring risk management.",
    creator: true,
    verified: true,
  },
  {
    username: "delta_neutral",
    displayName: "Priya Raman",
    bio: "Delta neutral by default. Funding rate arbitrage and prediction market pricing.",
    creator: true,
  },
  {
    username: "onchain_ops",
    displayName: "Marcus Feld",
    bio: "Reading blocks so you do not have to. Indexer diaries and Pulse validator notes.",
    verified: true,
  },
  {
    username: "memecoin_mira",
    displayName: "Mira Sol",
    bio: "Rotations, narratives, and exit liquidity. Not financial advice, obviously.",
  },
  {
    username: "vaultkeeper",
    displayName: "Tobias Lind",
    bio: "Yield curves for stablecoin desks. Builder at a treasury automation shop.",
    creator: true,
  },
  {
    username: "gm_kenji",
    displayName: "Kenji Arai",
    bio: "Perps, patience, and position sizing. Tokyo hours.",
  },
  {
    username: "zkfarmer",
    displayName: "Lea Novak",
    bio: "Proving systems, bridges, and the unglamorous parts of scaling.",
    verified: true,
  },
  {
    username: "nftcurator",
    displayName: "Ade Balogun",
    bio: "Curating onchain art. Floor prices are a lagging indicator of taste.",
  },
  {
    username: "riskrachel",
    displayName: "Rachel Kwan",
    bio: "Risk lead. I care about drawdowns more than upside. Prediction market skeptic turned believer.",
    creator: true,
    verified: true,
  },
  {
    username: "gaming_guild",
    displayName: "Iker Ruiz",
    bio: "Game economies, guild treasuries, and player incentive design.",
  },
  {
    username: "ai_alpha",
    displayName: "Hannah Weiss",
    bio: "Training small models on orderbook data. Sharing the ones that survive.",
  },
  {
    username: "stable_dan",
    displayName: "Daniyar Aliev",
    bio: "Payments corridors and FX. Stablecoins are the most boring revolution ever.",
  },
  {
    username: "quietquant",
    displayName: "Odette Marsh",
    bio: "Backtests, not vibes. Publishing weekly hit rates.",
  },
  {
    username: "bridge_ben",
    displayName: "Ben Iversen",
    bio: "Cross chain routing. Fewer hops, fewer problems.",
  },
  {
    username: "dao_dora",
    displayName: "Dora Fenn",
    bio: "Governance design and treasury policy. Long meetings, short opinions.",
  },
  {
    username: "chartsandchill",
    displayName: "Ravi Menon",
    bio: "Daily chart threads. Levels only, no narratives.",
  },
  {
    username: "yieldyara",
    displayName: "Yara Haddad",
    bio: "Hunting real yield. Allergic to emissions.",
  },
  {
    username: "nodeoperator",
    displayName: "Piotr Zielinski",
    bio: "Running validators since the first testnet. Uptime is a lifestyle.",
  },
  {
    username: "tradfi_tess",
    displayName: "Tess Buchanan",
    bio: "Twelve years on a rates desk, now onchain. Bridging both worlds.",
  },
];

function buildUser(seed: Seed, index: number): User {
  const rng = createRng(`user-${seed.username}`);
  const achievementCount = intBetween(1, 4, rng);
  const achievements: Achievement[] = pickMany(ACHIEVEMENT_POOL, achievementCount, rng).map(
    (a, i) => ({
      ...a,
      id: `${seed.username}-ach-${i}`,
      earnedAt: agoDays(intBetween(10, 400, rng)),
    }),
  );

  return {
    id: `u_${index + 1}`,
    username: seed.username,
    displayName: seed.displayName,
    avatar: avatarUrl(seed.username),
    banner: bannerUrl(seed.username),
    bio: seed.bio,
    verified: Boolean(seed.verified),
    isCreator: Boolean(seed.creator),
    followers: intBetween(820, 184000, rng),
    following: intBetween(90, 1400, rng),
    postCount: intBetween(140, 4200, rng),
    reputation: intBetween(560, 990, rng),
    predictionAccuracy: floatBetween(48, 84, rng, 1),
    tradingPnl30d: floatBetween(-18, 62, rng, 1),
    joinedAt: agoDays(intBetween(120, 900, rng)),
    interests: pickMany(INTERESTS, intBetween(2, 4, rng), rng),
    achievements,
    isFollowing: rng() > 0.45,
    online: rng() > 0.55,
    walletAddress: `0x${createRng(seed.username)().toString(16).slice(2, 10)}${seed.username
      .padEnd(8, "0")
      .slice(0, 8)
      .replace(/[^a-f0-9]/g, "c")}9f42`,
  };
}

export const users: User[] = SEEDS.map(buildUser);

export const currentUser: User = {
  ...buildUser(
    {
      username: "you",
      displayName: "Alex Rivera",
      bio: "Building on Pulse. Trading majors, writing about settlement design, and running a small prediction desk.",
      creator: true,
      verified: true,
    },
    99,
  ),
  id: "u_me",
  followers: 12480,
  following: 386,
  postCount: 742,
  reputation: 871,
  predictionAccuracy: 71.4,
  tradingPnl30d: 18.6,
  isFollowing: false,
  online: true,
  interests: ["Trading", "DeFi", "Pulse Ecosystem"],
};

export const allUsers: User[] = [currentUser, ...users];

export function findUser(idOrUsername: string): User | undefined {
  return allUsers.find(
    (u) => u.id === idOrUsername || u.username.toLowerCase() === idOrUsername.toLowerCase(),
  );
}
