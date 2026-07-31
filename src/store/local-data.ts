import type { Message, PollOption, Post } from "@/types";
import { currentUser } from "@/mock-data/users";

/**
 * Local-first data layer for the app.
 * Everything a signed in person creates (posts, replies, messages, markets)
 * is written here and persisted to localStorage, so the product behaves like a
 * real app across reloads without a backend.
 */

const KEY = "pulse.local.v2";

interface Snapshot {
  posts: Post[];
  messages: Message[];
}

let snapshot: Snapshot = { posts: [], messages: [] };
let loaded = false;

export function loadLocal(): void {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Partial<Snapshot>;
    snapshot = { posts: parsed.posts ?? [], messages: parsed.messages ?? [] };
  } catch {
    snapshot = { posts: [], messages: [] };
  }
}

function persist(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(snapshot));
  } catch {
    /* storage full or unavailable: keep in memory only */
  }
}

if (typeof window !== "undefined") loadLocal();

export function localPosts(): Post[] {
  return snapshot.posts;
}

export function localTimeline(): Post[] {
  return snapshot.posts.filter((p) => !p.replyToId);
}

export function localRepliesFor(id: string): Post[] {
  return snapshot.posts.filter((p) => p.replyToId === id);
}

export function findLocalPost(id: string): Post | undefined {
  return snapshot.posts.find((p) => p.id === id);
}

export interface DraftPost {
  body: string;
  replyToId?: string;
  communityId?: string;
  predictionId?: string;
  imageUrl?: string;
  poll?: { question: string; options: string[] };
  tags?: string[];
}

export function addLocalPost(draft: DraftPost): Post {
  const id = `local_${Date.now().toString(36)}`;
  const tags =
    draft.tags ??
    (draft.body.match(/#[\w-]+/g) ?? []).map((t) => t.slice(1).toLowerCase());

  const poll = draft.poll
    ? {
        question: draft.poll.question,
        options: draft.poll.options.map<PollOption>((label, i) => ({
          id: `${id}_o${i}`,
          label,
          votes: 0,
        })),
        endsAt: new Date(Date.now() + 86_400_000).toISOString(),
      }
    : undefined;

  const post: Post = {
    id,
    author: currentUser,
    kind: poll ? "poll" : draft.imageUrl ? "image" : "standard",
    body: draft.body,
    createdAt: new Date().toISOString(),
    likes: 0,
    replies: 0,
    reposts: 0,
    views: 0,
    liked: false,
    reposted: false,
    bookmarked: false,
    tags,
    ...(draft.communityId ? { communityId: draft.communityId } : {}),
    ...(draft.predictionId ? { predictionId: draft.predictionId } : {}),
    ...(draft.imageUrl ? { imageUrl: draft.imageUrl } : {}),
    ...(poll ? { poll } : {}),
    ...(draft.replyToId ? { replyToId: draft.replyToId } : {}),
  };

  snapshot.posts = [post, ...snapshot.posts];
  if (draft.replyToId) {
    const parent = snapshot.posts.find((p) => p.id === draft.replyToId);
    if (parent) parent.replies += 1;
  }
  persist();
  return post;
}

export function deleteLocalPost(id: string): void {
  snapshot.posts = snapshot.posts.filter((p) => p.id !== id && p.replyToId !== id);
  persist();
}

export function setLocalPollVote(postId: string, optionId: string): void {
  const post = snapshot.posts.find((p) => p.id === postId);
  if (!post?.poll) return;
  const option = post.poll.options.find((o) => o.id === optionId);
  if (!option) return;
  option.votes += 1;
  post.poll.votedOptionId = optionId;
  persist();
}

export function localMessagesFor(conversationId: string): Message[] {
  return snapshot.messages.filter((m) => m.conversationId === conversationId);
}

export function addLocalMessage(conversationId: string, body: string): Message {
  const message: Message = {
    id: `lm_${Date.now().toString(36)}`,
    conversationId,
    senderId: currentUser.id,
    body,
    at: new Date().toISOString(),
    read: true,
  };
  snapshot.messages = [...snapshot.messages, message];
  persist();
  return message;
}

export function resetLocalData(): void {
  snapshot = { posts: [], messages: [] };
  persist();
}
