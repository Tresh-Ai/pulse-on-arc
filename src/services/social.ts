/**
 * Real social data layer: posts, replies, likes, bookmarks, follows and
 * notifications live in the database. Everything here runs with the signed in
 * member's session, so row level security decides what is readable and
 * writable — the client is never trusted.
 */

import { supabase } from "@/integrations/supabase/client";
import { avatarUrl, bannerUrl } from "@/lib/identity";
import type { AppNotification, Post, PostKind, User } from "@/types";

export interface ProfileRow {
  id: string;
  handle: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  wallet_address: string | null;
  created_at: string;
}

const PROFILE_COLUMNS = "id, handle, display_name, bio, avatar_url, wallet_address, created_at";
const POST_COLUMNS =
  "id, author_id, parent_id, kind, body, image_url, chart_symbol, community_id, prediction_id, tags, like_count, reply_count, view_count, created_at";

interface PostRow {
  id: string;
  author_id: string;
  parent_id: string | null;
  kind: string;
  body: string;
  image_url: string | null;
  chart_symbol: string | null;
  community_id: string | null;
  prediction_id: string | null;
  tags: string[] | null;
  like_count: number;
  reply_count: number;
  view_count: number;
  created_at: string;
}

export class SocialError extends Error {}

function fail(message: string, error: { message: string } | null): never | void {
  if (error) throw new SocialError(`${message}: ${error.message}`);
}

/** Turn a profile row into the User shape the UI already speaks. */
export function profileToUser(
  row: ProfileRow,
  stats?: { followers?: number; following?: number; postCount?: number; isFollowing?: boolean },
): User {
  return {
    id: row.id,
    username: row.handle,
    displayName: row.display_name,
    avatar: row.avatar_url ?? avatarUrl(row.handle),
    banner: bannerUrl(row.handle),
    bio: row.bio ?? "",
    verified: false,
    isCreator: false,
    followers: stats?.followers ?? 0,
    following: stats?.following ?? 0,
    postCount: stats?.postCount ?? 0,
    reputation: 0,
    predictionAccuracy: 0,
    tradingPnl30d: 0,
    joinedAt: row.created_at,
    interests: [],
    achievements: [],
    isFollowing: stats?.isFollowing ?? false,
    online: true,
    walletAddress: row.wallet_address ?? "",
  };
}

function fallbackUser(id: string): User {
  return profileToUser({
    id,
    handle: `member_${id.slice(0, 6)}`,
    display_name: "Pulse member",
    bio: null,
    avatar_url: null,
    wallet_address: null,
    created_at: new Date().toISOString(),
  });
}

async function loadProfiles(ids: string[]): Promise<Map<string, User>> {
  const unique = [...new Set(ids)].filter(Boolean);
  if (unique.length === 0) return new Map();
  const { data, error } = await supabase.from("profiles").select(PROFILE_COLUMNS).in("id", unique);
  fail("Could not load accounts", error);
  const map = new Map<string, User>();
  for (const row of (data ?? []) as ProfileRow[]) map.set(row.id, profileToUser(row));
  return map;
}

async function viewerId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

async function viewerInteractions(postIds: string[], uid: string | null) {
  if (!uid || postIds.length === 0) return { liked: new Set<string>(), saved: new Set<string>() };
  const [likes, saves] = await Promise.all([
    supabase.from("post_likes").select("post_id").eq("user_id", uid).in("post_id", postIds),
    supabase.from("post_bookmarks").select("post_id").eq("user_id", uid).in("post_id", postIds),
  ]);
  return {
    liked: new Set((likes.data ?? []).map((r) => r.post_id)),
    saved: new Set((saves.data ?? []).map((r) => r.post_id)),
  };
}

async function hydrate(rows: PostRow[]): Promise<Post[]> {
  if (rows.length === 0) return [];
  const uid = await viewerId();
  const [authors, interactions] = await Promise.all([
    loadProfiles(rows.map((r) => r.author_id)),
    viewerInteractions(
      rows.map((r) => r.id),
      uid,
    ),
  ]);

  return rows.map((row) => ({
    id: row.id,
    author: authors.get(row.author_id) ?? fallbackUser(row.author_id),
    kind: row.kind as PostKind,
    body: row.body,
    createdAt: row.created_at,
    likes: row.like_count,
    replies: row.reply_count,
    reposts: 0,
    views: row.view_count,
    liked: interactions.liked.has(row.id),
    reposted: false,
    bookmarked: interactions.saved.has(row.id),
    tags: row.tags ?? [],
    ...(row.community_id ? { communityId: row.community_id } : {}),
    ...(row.image_url ? { imageUrl: row.image_url } : {}),
    ...(row.prediction_id ? { predictionId: row.prediction_id } : {}),
    ...(row.parent_id ? { replyToId: row.parent_id } : {}),
  }));
}

/* ---------------------------------- feed ---------------------------------- */

export type Feed = "following" | "trending" | "latest" | "ecosystem" | "markets" | "predictions";

export async function listFeed(filter: Feed): Promise<Post[]> {
  const uid = await viewerId();

  let query = supabase.from("posts").select(POST_COLUMNS).is("parent_id", null).limit(60);

  if (filter === "trending") query = query.order("like_count", { ascending: false });
  else query = query.order("created_at", { ascending: false });

  if (filter === "ecosystem") query = query.overlaps("tags", ["ecosystem", "pulse", "infra"]);
  if (filter === "markets") query = query.overlaps("tags", ["markets", "trading"]);
  if (filter === "predictions") query = query.overlaps("tags", ["predictions"]);

  if (filter === "following") {
    if (!uid) return [];
    const { data: follows, error } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", uid);
    fail("Could not load who you follow", error);
    const ids = [...(follows ?? []).map((f) => f.following_id), uid];
    query = query.in("author_id", ids);
  }

  const { data, error } = await query;
  fail("Could not load the timeline", error);
  return hydrate((data ?? []) as PostRow[]);
}

export async function getPostThread(id: string): Promise<{ post: Post; replies: Post[] }> {
  const [{ data: postRow, error }, { data: replyRows, error: replyError }] = await Promise.all([
    supabase.from("posts").select(POST_COLUMNS).eq("id", id).maybeSingle(),
    supabase
      .from("posts")
      .select(POST_COLUMNS)
      .eq("parent_id", id)
      .order("created_at", { ascending: true }),
  ]);
  fail("Could not load that post", error);
  fail("Could not load replies", replyError);
  if (!postRow) throw new SocialError("That post could not be found.");

  const [post] = await hydrate([postRow as PostRow]);
  if (!post) throw new SocialError("That post could not be found.");
  const replies = await hydrate((replyRows ?? []) as PostRow[]);
  return { post, replies };
}

export async function listBookmarks(): Promise<Post[]> {
  const uid = await viewerId();
  if (!uid) return [];
  const { data, error } = await supabase
    .from("post_bookmarks")
    .select("post_id, created_at")
    .eq("user_id", uid)
    .order("created_at", { ascending: false });
  fail("Could not load your saved posts", error);
  const ids = (data ?? []).map((r) => r.post_id);
  if (ids.length === 0) return [];
  const { data: rows, error: postsError } = await supabase
    .from("posts")
    .select(POST_COLUMNS)
    .in("id", ids);
  fail("Could not load your saved posts", postsError);
  return hydrate((rows ?? []) as PostRow[]);
}

/* --------------------------------- writes --------------------------------- */

export interface NewPost {
  body: string;
  parentId?: string | undefined;
  communityId?: string | undefined;
  predictionId?: string | undefined;
  imageUrl?: string | undefined;
  tags?: string[] | undefined;
}

export async function createPost(input: NewPost): Promise<Post> {
  const uid = await viewerId();
  if (!uid) throw new SocialError("Sign in to post.");
  const body = input.body.trim();
  if (body.length === 0) throw new SocialError("Write something first.");
  if (body.length > 1000) throw new SocialError("Posts are limited to 1000 characters.");

  const tags =
    input.tags ??
    (body.match(/#[\w-]+/g) ?? []).map((t) => t.slice(1).toLowerCase()).filter(Boolean);

  const { data, error } = await supabase
    .from("posts")
    .insert({
      author_id: uid,
      body,
      kind: input.imageUrl ? "image" : "standard",
      tags,
      parent_id: input.parentId ?? null,
      community_id: input.communityId ?? null,
      prediction_id: input.predictionId ?? null,
      image_url: input.imageUrl ?? null,
    })
    .select(POST_COLUMNS)
    .single();
  fail("Could not publish that post", error);
  const [post] = await hydrate([data as PostRow]);
  if (!post) throw new SocialError("Could not publish that post.");
  return post;
}

export async function deletePost(id: string): Promise<void> {
  const { error } = await supabase.from("posts").delete().eq("id", id);
  fail("Could not delete that post", error);
}

export async function setLike(postId: string, liked: boolean): Promise<void> {
  const uid = await viewerId();
  if (!uid) throw new SocialError("Sign in to like posts.");
  if (liked) {
    const { error } = await supabase.from("post_likes").insert({ post_id: postId, user_id: uid });
    if (error && !error.message.includes("duplicate")) fail("Could not like that post", error);
  } else {
    const { error } = await supabase
      .from("post_likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", uid);
    fail("Could not remove that like", error);
  }
}

export async function setBookmark(postId: string, saved: boolean): Promise<void> {
  const uid = await viewerId();
  if (!uid) throw new SocialError("Sign in to save posts.");
  if (saved) {
    const { error } = await supabase
      .from("post_bookmarks")
      .insert({ post_id: postId, user_id: uid });
    if (error && !error.message.includes("duplicate")) fail("Could not save that post", error);
  } else {
    const { error } = await supabase
      .from("post_bookmarks")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", uid);
    fail("Could not unsave that post", error);
  }
}

export async function setFollow(userId: string, following: boolean): Promise<void> {
  const uid = await viewerId();
  if (!uid) throw new SocialError("Sign in to follow accounts.");
  if (uid === userId) throw new SocialError("You cannot follow yourself.");
  if (following) {
    const { error } = await supabase
      .from("follows")
      .insert({ follower_id: uid, following_id: userId });
    if (error && !error.message.includes("duplicate")) fail("Could not follow that account", error);
  } else {
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", uid)
      .eq("following_id", userId);
    fail("Could not unfollow that account", error);
  }
}

/* -------------------------------- profiles -------------------------------- */

export interface ProfileView {
  user: User;
  posts: Post[];
  predictions: never[];
  activity: never[];
}

export async function getProfileByHandle(handle: string): Promise<ProfileView> {
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("handle", handle)
    .maybeSingle();
  fail("Could not load that account", error);
  if (!data) throw new SocialError("That account does not exist.");
  const row = data as ProfileRow;

  const uid = await viewerId();
  const [postsResult, followers, following, isFollowing] = await Promise.all([
    supabase
      .from("posts")
      .select(POST_COLUMNS)
      .eq("author_id", row.id)
      .is("parent_id", null)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("follows")
      .select("id", { count: "exact", head: true })
      .eq("following_id", row.id),
    supabase.from("follows").select("id", { count: "exact", head: true }).eq("follower_id", row.id),
    uid
      ? supabase
          .from("follows")
          .select("id")
          .eq("follower_id", uid)
          .eq("following_id", row.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  fail("Could not load their posts", postsResult.error);

  const posts = await hydrate((postsResult.data ?? []) as PostRow[]);
  const user = profileToUser(row, {
    followers: followers.count ?? 0,
    following: following.count ?? 0,
    postCount: posts.length,
    isFollowing: Boolean(isFollowing.data),
  });
  return { user, posts, predictions: [], activity: [] };
}

export async function listSuggestedAccounts(limit = 5): Promise<User[]> {
  const uid = await viewerId();

  let followingIds: string[] = [];
  if (uid) {
    const { data: follows } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", uid);
    followingIds = (follows ?? []).map((f) => f.following_id);
  }

  const exclude = [...new Set([...followingIds, ...(uid ? [uid] : [])])];

  let query = supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (exclude.length) query = query.not("id", "in", `(${exclude.join(",")})`);

  const { data, error } = await query;
  fail("Could not load suggestions", error);

  return ((data ?? []) as ProfileRow[]).map((row) => profileToUser(row, { isFollowing: false }));
}

/* ----------------------------- notifications ------------------------------ */

interface NotificationRow {
  id: string;
  actor_id: string | null;
  kind: string;
  post_id: string | null;
  body: string | null;
  read: boolean;
  created_at: string;
}

const TITLES: Record<string, string> = {
  like: "liked your post",
  reply: "replied to your post",
  follow: "started following you",
  mention: "mentioned you",
  system: "Pulse update",
};

export async function listNotifications(): Promise<AppNotification[]> {
  const uid = await viewerId();
  if (!uid) return [];
  const { data, error } = await supabase
    .from("notifications")
    .select("id, actor_id, kind, post_id, body, read, created_at")
    .order("created_at", { ascending: false })
    .limit(60);
  fail("Could not load your notifications", error);

  const rows = (data ?? []) as NotificationRow[];
  const actors = await loadProfiles(rows.map((r) => r.actor_id ?? "").filter(Boolean));

  return rows.map((row) => {
    const actor = row.actor_id ? actors.get(row.actor_id) : undefined;
    const name = actor?.displayName ?? "Someone";
    return {
      id: row.id,
      kind: (row.kind === "system" ? "announcement" : row.kind) as AppNotification["kind"],
      ...(actor ? { actor } : {}),
      title: `${name} ${TITLES[row.kind] ?? "sent you an update"}`,
      body: row.body ?? "",
      at: row.created_at,
      read: row.read,
      ...(row.post_id ? { href: `/app/post/${row.post_id}` } : {}),
    };
  });
}

export async function markNotificationsRead(): Promise<void> {
  const uid = await viewerId();
  if (!uid) return;
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", uid)
    .eq("read", false);
  fail("Could not mark notifications as read", error);
}
