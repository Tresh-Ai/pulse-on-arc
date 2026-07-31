import type {
  AppNotification,
  Community,
  Conversation,
  CreatorStats,
  FeedFilter,
  LeaderboardBoard,
  LeaderboardEntry,
  LeaderboardRange,
  Message,
  Post,
  Prediction,
  PredictionCategory,
  SearchResults,
  TokenInfo,
  TrendingTopic,
  User,
  WalletSummary,
} from "@/types";
import { allPosts, findPost, myPosts, posts, repliesFor } from "@/mock-data/posts";
import { allUsers, currentUser, findUser, users } from "@/mock-data/users";
import { communities, findCommunity } from "@/mock-data/communities";
import { findPrediction, myPredictionStats, predictions } from "@/mock-data/predictions";
import { conversations, messages, notifications } from "@/mock-data/social";
import { buildLeaderboard, tokenList, trendingTopics } from "@/mock-data/discovery";
import {
  activityFeed,
  creatorStats,
  portfolioPreview,
  tokenInfo,
  walletSummary,
} from "@/mock-data/finance";
import { delay, MockApiError } from "./client";

/* ---------------------------------- feed ---------------------------------- */

export async function getFeed(filter: FeedFilter): Promise<Post[]> {
  const pool = [...myPosts, ...posts];
  let result = pool;
  switch (filter) {
    case "following":
      result = pool.filter((p) => p.author.isFollowing || p.author.id === currentUser.id);
      break;
    case "trending":
      result = [...pool].sort((a, b) => b.likes + b.reposts - (a.likes + a.reposts));
      break;
    case "latest":
      result = [...pool].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      break;
    case "ecosystem":
      result = pool.filter((p) =>
        p.tags.some((t) => ["ecosystem", "settlement", "validators", "infra"].includes(t)),
      );
      break;
    case "markets":
      result = pool.filter((p) => p.kind === "chart" || p.tags.includes("trading"));
      break;
    case "predictions":
      result = pool.filter((p) => p.kind === "prediction" || p.tags.includes("predictions"));
      break;
  }
  return delay(result);
}

export async function getPost(id: string): Promise<{ post: Post; replies: Post[] }> {
  const post = findPost(id);
  if (!post) throw new MockApiError("That post could not be found.");
  return delay({ post, replies: repliesFor(id) });
}

export async function getBookmarks(): Promise<Post[]> {
  return delay(allPosts.filter((p) => p.bookmarked));
}

/* --------------------------------- people --------------------------------- */

export async function getProfile(
  handle: string,
): Promise<{ user: User; posts: Post[]; predictions: Prediction[]; activity: typeof activityFeed }> {
  const user = findUser(handle);
  if (!user) throw new MockApiError("That account does not exist.");
  const authored =
    user.id === currentUser.id ? myPosts : allPosts.filter((p) => p.author.id === user.id);
  const userPredictions = predictions.filter((p) => p.creator.id === user.id);
  return delay({ user, posts: authored, predictions: userPredictions, activity: activityFeed });
}

export async function getSuggestedUsers(count = 5): Promise<User[]> {
  return delay(users.filter((u) => !u.isFollowing).slice(0, count));
}

export async function getCurrentUser(): Promise<User> {
  return delay(currentUser, 120);
}

export async function getPortfolioPreview(): Promise<typeof portfolioPreview> {
  return delay(portfolioPreview);
}

/* ------------------------------- communities ------------------------------ */

export async function getCommunities(): Promise<Community[]> {
  return delay(communities);
}

export async function getCommunity(slug: string): Promise<{
  community: Community;
  posts: Post[];
  moderators: User[];
  members: User[];
  leaderboard: LeaderboardEntry[];
  rooms: Prediction[];
}> {
  const community = findCommunity(slug);
  if (!community) throw new MockApiError("That community could not be found.");
  return delay({
    community,
    posts: allPosts.filter((p) => p.communityId === community.id),
    moderators: allUsers.filter((u) => community.moderatorIds.includes(u.id)),
    members: users.slice(0, 12),
    leaderboard: buildLeaderboard("reputation", "weekly").slice(0, 8),
    rooms: predictions.filter((p) => community.predictionRoomIds.includes(p.id)),
  });
}

/* ------------------------------- predictions ------------------------------ */

export interface PredictionQuery {
  category?: PredictionCategory | "all";
  status?: Prediction["status"] | "all";
  sort?: "volume" | "ending" | "new";
  search?: string;
}

export async function getPredictions(query: PredictionQuery = {}): Promise<Prediction[]> {
  const { category = "all", status = "all", sort = "volume", search = "" } = query;
  let result = predictions.filter((p) => {
    if (category !== "all" && p.category !== category) return false;
    if (status !== "all" && p.status !== status) return false;
    if (search && !`${p.title} ${p.description}`.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });
  result = [...result].sort((a, b) => {
    if (sort === "volume") return b.pool - a.pool;
    if (sort === "ending") return new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime();
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  return delay(result);
}

export async function getPrediction(
  id: string,
): Promise<{ prediction: Prediction; discussion: Post[]; related: Prediction[] }> {
  const prediction = findPrediction(id);
  if (!prediction) throw new MockApiError("That market could not be found.");
  return delay({
    prediction,
    discussion: allPosts.filter((p) => p.predictionId === id || p.tags.includes("predictions")).slice(0, 6),
    related: predictions.filter((p) => p.id !== id && p.category === prediction.category).slice(0, 3),
  });
}

export async function getMyPredictionStats(): Promise<typeof myPredictionStats> {
  return delay(myPredictionStats);
}

export async function submitVote(input: {
  predictionId: string;
  side: "yes" | "no";
  stake: number;
}): Promise<{ ok: true; side: "yes" | "no"; stake: number }> {
  if (input.stake <= 0) throw new MockApiError("Enter a stake above zero.");
  if (input.stake > 24_180) throw new MockApiError("Stake exceeds your available USDC balance.");
  return delay({ ok: true, side: input.side, stake: input.stake }, 600);
}

export async function createPrediction(input: {
  title: string;
  category: string;
}): Promise<{ id: string }> {
  if (!input.title.trim()) throw new MockApiError("A market needs a title.");
  return delay({ id: predictions[0]?.id ?? "p_1" }, 800);
}

/* ------------------------------ leaderboards ------------------------------ */

export async function getLeaderboard(
  board: LeaderboardBoard,
  range: LeaderboardRange,
): Promise<LeaderboardEntry[]> {
  return delay(buildLeaderboard(board, range));
}

/* ---------------------------- notifications ------------------------------- */

export async function getNotifications(): Promise<AppNotification[]> {
  return delay(notifications);
}

/* -------------------------------- messages -------------------------------- */

export async function getConversations(): Promise<Conversation[]> {
  return delay(conversations);
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const thread = messages.filter((m) => m.conversationId === conversationId);
  if (thread.length === 0) throw new MockApiError("That conversation could not be loaded.");
  return delay(thread);
}

export async function sendMessage(input: {
  conversationId: string;
  body: string;
}): Promise<Message> {
  if (!input.body.trim()) throw new MockApiError("Write something first.");
  return delay(
    {
      id: `local_${Date.now()}`,
      conversationId: input.conversationId,
      senderId: currentUser.id,
      body: input.body,
      at: new Date().toISOString(),
      read: true,
    },
    300,
  );
}

/* --------------------------------- search --------------------------------- */

export async function search(term: string): Promise<SearchResults> {
  const q = term.trim().toLowerCase();
  if (!q) {
    return delay({
      users: users.slice(0, 4),
      posts: posts.slice(0, 4),
      predictions: predictions.slice(0, 3),
      communities: communities.slice(0, 3),
      tokens: tokenList.slice(0, 4),
      topics: trendingTopics,
    });
  }
  return delay({
    users: allUsers.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        u.displayName.toLowerCase().includes(q) ||
        u.bio.toLowerCase().includes(q),
    ),
    posts: allPosts.filter((p) => p.body.toLowerCase().includes(q)),
    predictions: predictions.filter((p) => p.title.toLowerCase().includes(q)),
    communities: communities.filter(
      (c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q),
    ),
    tokens: tokenList.filter(
      (t) => t.symbol.toLowerCase().includes(q) || t.name.toLowerCase().includes(q),
    ),
    topics: trendingTopics.filter((t) => t.tag.toLowerCase().includes(q)),
  });
}

export async function getTrendingTopics(): Promise<TrendingTopic[]> {
  return delay(trendingTopics, 180);
}

/* --------------------------------- wallet --------------------------------- */

export async function getWallet(): Promise<WalletSummary> {
  return delay(walletSummary);
}

export async function submitTransfer(input: {
  kind: "deposit" | "withdraw" | "send" | "receive";
  asset: string;
  amount: number;
  destination?: string;
}): Promise<{ ok: true; hash: string }> {
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new MockApiError("Enter an amount above zero.");
  }
  if (input.kind !== "deposit") {
    const asset = walletSummary.assets.find((a) => a.symbol === input.asset);
    if (asset && input.amount > asset.balance) {
      throw new MockApiError(`Amount exceeds your ${input.asset} balance.`);
    }
  }
  if ((input.kind === "send" || input.kind === "withdraw") && !input.destination?.trim()) {
    throw new MockApiError("Add a destination address or handle.");
  }
  return delay({ ok: true, hash: `0x${Math.random().toString(16).slice(2, 14)}` }, 900);
}

/* ---------------------------- token and creator --------------------------- */

export async function getToken(): Promise<TokenInfo> {
  return delay(tokenInfo);
}

export async function getCreatorStats(): Promise<CreatorStats> {
  return delay(creatorStats);
}

/* ------------------------------- auth (mock) ------------------------------ */

export async function mockSignIn(input: {
  email: string;
  password: string;
}): Promise<{ ok: true }> {
  if (!input.email.includes("@")) throw new MockApiError("Enter a valid email address.");
  if (input.password.toLowerCase() === "wrongpassword") {
    throw new MockApiError("Those credentials do not match an account.");
  }
  return delay({ ok: true }, 700);
}

export async function mockSignUp(input: { email: string }): Promise<{ ok: true }> {
  if (input.email.endsWith("@taken.com")) {
    throw new MockApiError("An account already uses that email.");
  }
  return delay({ ok: true }, 800);
}

export async function mockRequestReset(): Promise<{ ok: true }> {
  return delay({ ok: true }, 600);
}

export async function mockVerifyEmail(code: string): Promise<{ ok: true }> {
  if (code.length < 6) throw new MockApiError("Enter the full six digit code.");
  if (code === "000000") throw new MockApiError("That code has expired. Request a new one.");
  return delay({ ok: true }, 700);
}

export async function mockConnectWallet(
  provider: string,
): Promise<{ ok: true; address: string; provider: string }> {
  return delay({ ok: true, address: currentUser.walletAddress, provider }, 1100);
}

export async function mockCompleteOnboarding(): Promise<{ ok: true }> {
  return delay({ ok: true }, 700);
}
