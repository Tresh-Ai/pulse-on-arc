/**
 * Domain types for the ARC Social Trading Network prototype.
 * These mirror the shapes the future API layer is expected to return.
 */

export type Interest =
  | "Trading"
  | "DeFi"
  | "NFTs"
  | "AI"
  | "Memecoins"
  | "Gaming"
  | "ARC Ecosystem";

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  banner: string;
  bio: string;
  verified: boolean;
  isCreator: boolean;
  followers: number;
  following: number;
  postCount: number;
  reputation: number;
  predictionAccuracy: number;
  tradingPnl30d: number;
  joinedAt: string;
  interests: Interest[];
  achievements: Achievement[];
  isFollowing: boolean;
  online: boolean;
  walletAddress: string;
}

export interface Achievement {
  id: string;
  label: string;
  description: string;
  icon: "trophy" | "flame" | "target" | "sparkles" | "shield" | "crown";
  earnedAt: string;
}

export type PostKind =
  | "standard"
  | "image"
  | "chart"
  | "prediction"
  | "poll"
  | "announcement";

export interface PollOption {
  id: string;
  label: string;
  votes: number;
}

export interface Post {
  id: string;
  author: User;
  kind: PostKind;
  body: string;
  createdAt: string;
  likes: number;
  replies: number;
  reposts: number;
  views: number;
  liked: boolean;
  reposted: boolean;
  bookmarked: boolean;
  tags: string[];
  communityId?: string;
  imageUrl?: string;
  chart?: { symbol: string; change: number; series: number[] };
  predictionId?: string;
  poll?: { question: string; options: PollOption[]; endsAt: string; votedOptionId?: string };
  pinned?: boolean;
  replyToId?: string;
}

export type FeedFilter =
  | "following"
  | "trending"
  | "latest"
  | "arc"
  | "markets"
  | "predictions";

export interface Community {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  banner: string;
  members: number;
  onlineNow: number;
  joined: boolean;
  category: Interest;
  moderatorIds: string[];
  predictionRoomIds: string[];
}

export type PredictionStatus = "open" | "closing-soon" | "resolved" | "cancelled";
export type PredictionCategory =
  | "Crypto"
  | "ARC Ecosystem"
  | "Macro"
  | "Culture"
  | "Tech"
  | "Gaming";

export interface PredictionParticipant {
  user: User;
  side: "yes" | "no";
  stake: number;
  at: string;
}

export interface PredictionTimelineEvent {
  id: string;
  label: string;
  detail: string;
  at: string;
}

export interface Prediction {
  id: string;
  title: string;
  description: string;
  rules: string;
  category: PredictionCategory;
  createdAt: string;
  endsAt: string;
  creator: User;
  status: PredictionStatus;
  participants: number;
  pool: number;
  yesPercent: number;
  volumeSeries: { t: string; yes: number }[];
  outcome?: "yes" | "no";
  communityId?: string;
  topParticipants: PredictionParticipant[];
  timeline: PredictionTimelineEvent[];
  myPosition?: { side: "yes" | "no"; stake: number };
}

export type LeaderboardBoard =
  | "traders"
  | "predictors"
  | "creators"
  | "reputation"
  | "active";
export type LeaderboardRange = "daily" | "weekly" | "monthly" | "all";

export interface LeaderboardEntry {
  rank: number;
  user: User;
  primaryStat: string;
  primaryLabel: string;
  secondaryStat: string;
  secondaryLabel: string;
  change: number;
}

export type NotificationKind =
  | "like"
  | "reply"
  | "mention"
  | "follow"
  | "prediction"
  | "community"
  | "announcement";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  actor?: User;
  title: string;
  body: string;
  at: string;
  read: boolean;
  href?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  at: string;
  attachment?: { type: "image" | "chart"; url: string; caption?: string };
  read: boolean;
}

export interface Conversation {
  id: string;
  participant: User;
  lastMessage: string;
  lastAt: string;
  unread: number;
  typing: boolean;
}

export interface WalletAsset {
  symbol: string;
  name: string;
  balance: number;
  usdValue: number;
  change24h: number;
  logoTint: "primary" | "cyan" | "success" | "warning";
}

export type TxKind = "deposit" | "withdraw" | "send" | "receive" | "prediction" | "reward";

export interface WalletTransaction {
  id: string;
  kind: TxKind;
  asset: string;
  amount: number;
  usdValue: number;
  counterparty: string;
  at: string;
  status: "confirmed" | "pending" | "failed";
  hash: string;
}

export interface WalletSummary {
  totalUsd: number;
  change24h: number;
  address: string;
  assets: WalletAsset[];
  transactions: WalletTransaction[];
}

export interface TokenInfo {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  marketCap: number;
  circulatingSupply: number;
  totalSupply: number;
  holders: number;
  volume24h: number;
  series: { t: string; price: number }[];
  utility: { title: string; detail: string }[];
  activity: { id: string; label: string; detail: string; at: string }[];
}

export interface CreatorStats {
  followers: number;
  followerChange: number;
  revenue: number;
  revenueChange: number;
  subscribers: number;
  subscriberChange: number;
  engagementRate: number;
  engagementChange: number;
  predictionsCreated: number;
  predictionAccuracy: number;
  resolvedPredictions: number;
  audienceSeries: { t: string; followers: number; revenue: number }[];
  topContent: { id: string; title: string; kind: PostKind; impressions: number; engagement: number }[];
}

export interface TrendingTopic {
  id: string;
  tag: string;
  category: string;
  posts: number;
  change: number;
}

export interface SearchResults {
  users: User[];
  posts: Post[];
  predictions: Prediction[];
  communities: Community[];
  tokens: { symbol: string; name: string; price: number; change24h: number }[];
  topics: TrendingTopic[];
}

export interface SessionUser {
  user: User;
  onboarded: boolean;
}
