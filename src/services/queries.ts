import { queryOptions } from "@tanstack/react-query";
import type {
  FeedFilter,
  LeaderboardBoard,
  LeaderboardRange,
} from "@/types";
import * as api from "./api";

export const queries = {
  feed: (filter: FeedFilter) =>
    queryOptions({ queryKey: ["feed", filter], queryFn: () => api.getFeed(filter) }),
  post: (id: string) => queryOptions({ queryKey: ["post", id], queryFn: () => api.getPost(id) }),
  bookmarks: () => queryOptions({ queryKey: ["bookmarks"], queryFn: api.getBookmarks }),
  profile: (handle: string) =>
    queryOptions({ queryKey: ["profile", handle], queryFn: () => api.getProfile(handle) }),
  suggestedUsers: () =>
    queryOptions({ queryKey: ["suggested-users"], queryFn: () => api.getSuggestedUsers() }),
  portfolioPreview: () =>
    queryOptions({ queryKey: ["portfolio-preview"], queryFn: api.getPortfolioPreview }),
  communities: () => queryOptions({ queryKey: ["communities"], queryFn: api.getCommunities }),
  community: (slug: string) =>
    queryOptions({ queryKey: ["community", slug], queryFn: () => api.getCommunity(slug) }),
  predictions: (query: api.PredictionQuery) =>
    queryOptions({ queryKey: ["predictions", query], queryFn: () => api.getPredictions(query) }),
  prediction: (id: string) =>
    queryOptions({ queryKey: ["prediction", id], queryFn: () => api.getPrediction(id) }),
  myPredictionStats: () =>
    queryOptions({ queryKey: ["my-prediction-stats"], queryFn: api.getMyPredictionStats }),
  leaderboard: (board: LeaderboardBoard, range: LeaderboardRange) =>
    queryOptions({
      queryKey: ["leaderboard", board, range],
      queryFn: () => api.getLeaderboard(board, range),
    }),
  notifications: () => queryOptions({ queryKey: ["notifications"], queryFn: api.getNotifications }),
  conversations: () => queryOptions({ queryKey: ["conversations"], queryFn: api.getConversations }),
  messages: (id: string) =>
    queryOptions({ queryKey: ["messages", id], queryFn: () => api.getMessages(id) }),
  search: (term: string) =>
    queryOptions({ queryKey: ["search", term], queryFn: () => api.search(term) }),
  trendingTopics: () =>
    queryOptions({ queryKey: ["trending-topics"], queryFn: api.getTrendingTopics }),
  wallet: () => queryOptions({ queryKey: ["wallet"], queryFn: api.getWallet }),
  token: () => queryOptions({ queryKey: ["token"], queryFn: api.getToken }),
  creatorStats: () => queryOptions({ queryKey: ["creator-stats"], queryFn: api.getCreatorStats }),
};
