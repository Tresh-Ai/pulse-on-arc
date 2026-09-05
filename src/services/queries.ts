import { queryOptions } from "@tanstack/react-query";
import type { FeedFilter, LeaderboardBoard, LeaderboardRange } from "@/types";
import * as api from "./api";
import * as social from "./social";
import * as markets from "./markets";
import { listTrendingTags } from "./discovery";
import { searchEverything } from "./search";

export const queries = {
  /* Social graph — stored in the backend. */
  feed: (filter: FeedFilter) =>
    queryOptions({ queryKey: ["feed", filter], queryFn: () => social.listFeed(filter) }),
  post: (id: string) =>
    queryOptions({ queryKey: ["post", id], queryFn: () => social.getPostThread(id) }),
  bookmarks: () => queryOptions({ queryKey: ["bookmarks"], queryFn: social.listBookmarks }),
  profile: (handle: string) =>
    queryOptions({
      queryKey: ["profile", handle],
      queryFn: () => social.getProfileByHandle(handle),
      enabled: handle.length > 0,
    }),
  suggestedUsers: () =>
    queryOptions({ queryKey: ["suggested-users"], queryFn: () => social.listSuggestedAccounts() }),
  notifications: () =>
    queryOptions({ queryKey: ["notifications"], queryFn: social.listNotifications }),

  /* Market simulation surfaces (prices, markets, portfolio). */

  portfolioPreview: () =>
    queryOptions({ queryKey: ["portfolio-preview"], queryFn: api.getPortfolioPreview }),
  communities: () => queryOptions({ queryKey: ["communities"], queryFn: api.getCommunities }),
  community: (slug: string) =>
    queryOptions({ queryKey: ["community", slug], queryFn: () => api.getCommunity(slug) }),
  markets: (query: markets.MarketQuery) =>
    queryOptions({ queryKey: ["markets", query], queryFn: () => markets.listMarkets(query) }),
  market: (id: string) =>
    queryOptions({ queryKey: ["market", id], queryFn: () => markets.getMarket(id) }),
  relatedMarkets: (market: markets.Market) =>
    queryOptions({
      queryKey: ["related-markets", market.id],
      queryFn: () => markets.listRelatedMarkets(market),
    }),
  myPositions: (marketId?: string) =>
    queryOptions({
      queryKey: ["my-positions", marketId ?? "all"],
      queryFn: () => markets.listMyPositions(marketId),
    }),
  myMarketStats: () =>
    queryOptions({ queryKey: ["my-market-stats"], queryFn: markets.getMyMarketStats }),
  leaderboard: (board: LeaderboardBoard, range: LeaderboardRange) =>
    queryOptions({
      queryKey: ["leaderboard", board, range],
      queryFn: () => api.getLeaderboard(board, range),
    }),
  conversations: () => queryOptions({ queryKey: ["conversations"], queryFn: api.getConversations }),
  messages: (id: string) =>
    queryOptions({ queryKey: ["messages", id], queryFn: () => api.getMessages(id) }),
  search: (term: string) =>
    queryOptions({ queryKey: ["search", term], queryFn: () => searchEverything(term) }),
  trendingTopics: () =>
    queryOptions({ queryKey: ["trending-topics"], queryFn: () => listTrendingTags() }),
  wallet: () => queryOptions({ queryKey: ["wallet"], queryFn: api.getWallet }),
  token: () => queryOptions({ queryKey: ["token"], queryFn: api.getToken }),
  creatorStats: () => queryOptions({ queryKey: ["creator-stats"], queryFn: api.getCreatorStats }),
};
