/**
 * Search runs against the real database: member profiles, posts and markets.
 */

import { supabase } from "@/integrations/supabase/client";
import { profileToUser, type ProfileRow } from "./social";
import { listMarkets, type Market } from "./markets";
import { listTrendingTags } from "./discovery";
import type { Post, TrendingTopic, User } from "@/types";
import { avatarUrl, bannerUrl } from "@/lib/identity";

export interface SearchPost {
  id: string;
  body: string;
  createdAt: string;
  likeCount: number;
  replyCount: number;
  author: User;
}

export interface SearchPayload {
  users: User[];
  posts: SearchPost[];
  markets: Market[];
  topics: TrendingTopic[];
}

const PROFILE_COLUMNS =
  "id, handle, display_name, bio, avatar_url, wallet_address, website, created_at";

function escape(term: string) {
  return term.replace(/[%,()]/g, " ").trim();
}

async function searchPeople(q: string, limit: number): Promise<User[]> {
  let request = supabase.from("profiles").select(PROFILE_COLUMNS).limit(limit);
  if (q) request = request.or(`handle.ilike.%${q}%,display_name.ilike.%${q}%,bio.ilike.%${q}%`);
  const { data, error } = await request;
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as ProfileRow[]).map((row) => profileToUser(row));
}

async function searchPosts(q: string, limit: number): Promise<SearchPost[]> {
  let request = supabase
    .from("posts")
    .select("id, body, created_at, like_count, reply_count, author_id")
    .is("parent_id", null)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (q) request = request.ilike("body", `%${q}%`);
  const { data, error } = await request;
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as unknown as {
    id: string;
    body: string;
    created_at: string;
    like_count: number;
    reply_count: number;
    author_id: string;
  }[];
  if (rows.length === 0) return [];

  const ids = [...new Set(rows.map((r) => r.author_id))];
  const { data: profiles } = await supabase.from("profiles").select(PROFILE_COLUMNS).in("id", ids);
  const byId = new Map(
    ((profiles ?? []) as unknown as ProfileRow[]).map((p) => [p.id, profileToUser(p)]),
  );

  return rows.map((row) => ({
    id: row.id,
    body: row.body,
    createdAt: row.created_at,
    likeCount: row.like_count ?? 0,
    replyCount: row.reply_count ?? 0,
    author:
      byId.get(row.author_id) ??
      ({
        id: row.author_id,
        username: "member",
        displayName: "Member",
        avatar: avatarUrl(row.author_id),
        banner: bannerUrl(row.author_id),
        bio: "",
        verified: false,
        isCreator: false,
        followers: 0,
        following: 0,
        postCount: 0,
        reputation: 0,
        predictionAccuracy: 0,
        tradingPnl30d: 0,
        joinedAt: row.created_at,
        interests: [],
        achievements: [],
        isFollowing: false,
        online: false,
        walletAddress: "",
      } satisfies Post["author"]),
  }));
}

export async function searchEverything(term: string): Promise<SearchPayload> {
  const q = escape(term).toLowerCase();
  const [users, posts, markets, topics] = await Promise.all([
    searchPeople(q, q ? 12 : 5),
    searchPosts(q, q ? 12 : 5),
    listMarkets(q ? { search: q } : { status: "open" }),
    listTrendingTags(6),
  ]);

  return {
    users,
    posts,
    markets: markets.slice(0, q ? 12 : 5),
    topics: q ? topics.filter((t) => t.tag.toLowerCase().includes(q)) : topics,
  };
}
