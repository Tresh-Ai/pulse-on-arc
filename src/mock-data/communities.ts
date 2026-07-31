import type { Community } from "@/types";
import { bannerUrl, avatarUrl } from "@/lib/identity";
import { users } from "./users";
import { createRng, intBetween } from "./random";

interface Seed {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category: Community["category"];
  joined: boolean;
}

const SEEDS: Seed[] = [
  {
    slug: "arc-builders",
    name: "Pulse Builders",
    tagline: "Shipping on the Pulse network",
    description:
      "The working room for teams building on Pulse. Contract patterns, settlement design, testnet incidents, and release notes. Keep it technical and keep it kind.",
    category: "Pulse Ecosystem",
    joined: true,
  },
  {
    slug: "defi",
    name: "DeFi Desk",
    tagline: "Yield, risk, and liquidity",
    description:
      "Lending markets, stablecoin curves, and real yield. We track where capital sits and why it moves, with receipts.",
    category: "DeFi",
    joined: true,
  },
  {
    slug: "trading",
    name: "Trading Floor",
    tagline: "Levels, flow, and execution",
    description:
      "Intraday levels, funding, and orderbook flow. Post your thesis with an invalidation point or do not post it.",
    category: "Trading",
    joined: true,
  },
  {
    slug: "memecoins",
    name: "Memecoin Rotation",
    tagline: "Fast narratives, faster exits",
    description:
      "Rotations, launches, and liquidity checks. High risk by definition. Size accordingly and never trust a chart alone.",
    category: "Memecoins",
    joined: false,
  },
  {
    slug: "ai",
    name: "AI and Markets",
    tagline: "Models that touch money",
    description:
      "Applied machine learning for market data. Feature engineering, evaluation discipline, and honest failure reports.",
    category: "AI",
    joined: false,
  },
  {
    slug: "gaming",
    name: "Game Economies",
    tagline: "Player incentives and treasuries",
    description:
      "Designing economies people actually enjoy. Sinks, faucets, guild treasuries, and season balancing.",
    category: "Gaming",
    joined: false,
  },
  {
    slug: "nfts",
    name: "Onchain Art",
    tagline: "Curation over speculation",
    description:
      "Artists, collectors, and curators. Long form studio notes, drop calendars, and provenance deep dives.",
    category: "NFTs",
    joined: false,
  },
];

export const communities: Community[] = SEEDS.map((seed, index) => {
  const rng = createRng(`community-${seed.slug}`);
  const mods = users.slice(index, index + 3).map((u) => u.id);
  return {
    id: `c_${index + 1}`,
    slug: seed.slug,
    name: seed.name,
    tagline: seed.tagline,
    description: seed.description,
    icon: avatarUrl(`community-${seed.slug}`),
    banner: bannerUrl(`community-${seed.slug}`),
    members: intBetween(2400, 96000, rng),
    onlineNow: intBetween(80, 2600, rng),
    joined: seed.joined,
    category: seed.category,
    moderatorIds: mods,
    predictionRoomIds: [`p_${index + 1}`, `p_${index + 4}`],
  };
});

export function findCommunity(idOrSlug: string): Community | undefined {
  return communities.find((c) => c.id === idOrSlug || c.slug === idOrSlug);
}
