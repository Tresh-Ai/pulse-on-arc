import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { currentUser } from "@/mock-data/users";
import { communities } from "@/mock-data/communities";
import { users } from "@/mock-data/users";
import { conversations, notifications } from "@/mock-data/social";
import type { Message, Post, User } from "@/types";
import {
  addLocalMessage,
  addLocalPost,
  deleteLocalPost,
  resetLocalData,
  setLocalPollVote,
  type DraftPost,
} from "./local-data";

/**
 * Client side application state. Session, social interactions (follows, joins,
 * likes, bookmarks, votes) and everything the person creates locally.
 * Authored content is persisted through the local data layer.
 */

interface AppState {
  user: User;
  signedIn: boolean;
  onboarded: boolean;
  follows: Set<string>;
  joined: Set<string>;
  likes: Set<string>;
  bookmarks: Set<string>;
  reposts: Set<string>;
  votes: Record<string, { side: "yes" | "no"; stake: number }>;
  pollVotes: Record<string, string>;
  readNotifications: Set<string>;
  revision: number;
  signIn: () => void;
  signOut: () => void;
  completeOnboarding: (patch?: Partial<User>) => void;
  updateProfile: (patch: Partial<User>) => void;
  toggleFollow: (userId: string) => void;
  isFollowing: (user: User) => boolean;
  toggleJoin: (communityId: string) => void;
  isJoined: (communityId: string, fallback: boolean) => boolean;
  toggleLike: (postId: string, initial: boolean) => void;
  isLiked: (postId: string, initial: boolean) => boolean;
  toggleBookmark: (postId: string, initial: boolean) => void;
  isBookmarked: (postId: string, initial: boolean) => boolean;
  toggleRepost: (postId: string, initial: boolean) => void;
  isReposted: (postId: string, initial: boolean) => boolean;
  recordVote: (predictionId: string, side: "yes" | "no", stake: number) => void;
  recordPollVote: (pollId: string, optionId: string) => void;
  markNotificationsRead: () => void;
  unreadCount: number;
  unreadMessages: number;
  markConversationRead: (id: string) => void;
  createPost: (draft: DraftPost) => Post;
  deletePost: (id: string) => void;
  sendMessage: (conversationId: string, body: string) => Message;
  clearLocalData: () => void;
}

const AppContext = createContext<AppState | null>(null);

function toggleInSet(set: Set<string>, id: string): Set<string> {
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(currentUser);
  const [signedIn, setSignedIn] = useState(true);
  const [onboarded, setOnboarded] = useState(true);
  const [revision, setRevision] = useState(0);
  const [follows, setFollows] = useState<Set<string>>(
    () => new Set(users.filter((u) => u.isFollowing).map((u) => u.id)),
  );
  const [joined, setJoined] = useState<Set<string>>(
    () => new Set(communities.filter((c) => c.joined).map((c) => c.id)),
  );
  const [likes, setLikes] = useState<Set<string>>(new Set());
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [reposts, setReposts] = useState<Set<string>>(new Set());
  const [votes, setVotes] = useState<Record<string, { side: "yes" | "no"; stake: number }>>({});
  const [pollVotes, setPollVotes] = useState<Record<string, string>>({});
  const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set());
  const [readConversations, setReadConversations] = useState<Set<string>>(new Set());

  const bump = useCallback(() => setRevision((r) => r + 1), []);

  const toggleFollow = useCallback((userId: string) => {
    setFollows((prev) => toggleInSet(prev, userId));
  }, []);

  const toggleJoin = useCallback((communityId: string) => {
    setJoined((prev) => toggleInSet(prev, communityId));
  }, []);

  const flip = useCallback(
    (setter: React.Dispatch<React.SetStateAction<Set<string>>>, id: string) => {
      setter((prev) => {
        const next = new Set(prev);
        // Presence in the set means "flipped relative to the seeded default".
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    },
    [],
  );

  const value = useMemo<AppState>(() => {
    const unread = notifications.filter((n) => !n.read && !readNotifications.has(n.id)).length;
    const unreadMessages = conversations
      .filter((c) => !readConversations.has(c.id))
      .reduce((sum, c) => sum + c.unread, 0);

    return {
      user,
      signedIn,
      onboarded,
      follows,
      joined,
      likes,
      bookmarks,
      reposts,
      votes,
      pollVotes,
      readNotifications,
      revision,
      signIn: () => setSignedIn(true),
      signOut: () => setSignedIn(false),
      completeOnboarding: (patch) => {
        if (patch) setUser((prev) => ({ ...prev, ...patch }));
        setOnboarded(true);
        setSignedIn(true);
      },
      updateProfile: (patch) => setUser((prev) => ({ ...prev, ...patch })),
      toggleFollow,
      isFollowing: (u) => follows.has(u.id),
      toggleJoin,
      isJoined: (id, fallback) => (joined.size === 0 ? fallback : joined.has(id)),
      toggleLike: (id) => flip(setLikes, id),
      isLiked: (id, initial) => (likes.has(id) ? !initial : initial),
      toggleBookmark: (id) => flip(setBookmarks, id),
      isBookmarked: (id, initial) => (bookmarks.has(id) ? !initial : initial),
      toggleRepost: (id) => flip(setReposts, id),
      isReposted: (id, initial) => (reposts.has(id) ? !initial : initial),
      recordVote: (predictionId, side, stake) =>
        setVotes((prev) => ({ ...prev, [predictionId]: { side, stake } })),
      recordPollVote: (pollId, optionId) => {
        setPollVotes((prev) => ({ ...prev, [pollId]: optionId }));
        setLocalPollVote(pollId, optionId);
      },
      markNotificationsRead: () => setReadNotifications(new Set(notifications.map((n) => n.id))),
      unreadCount: unread,
      unreadMessages,
      markConversationRead: (id) => setReadConversations((prev) => new Set(prev).add(id)),
      createPost: (draft) => {
        const post = addLocalPost(draft);
        bump();
        return post;
      },
      deletePost: (id) => {
        deleteLocalPost(id);
        bump();
      },
      sendMessage: (conversationId, body) => {
        const message = addLocalMessage(conversationId, body);
        bump();
        return message;
      },
      clearLocalData: () => {
        resetLocalData();
        bump();
      },
    };
  }, [
    user,
    signedIn,
    onboarded,
    follows,
    joined,
    likes,
    bookmarks,
    reposts,
    votes,
    pollVotes,
    readNotifications,
    readConversations,
    revision,
    toggleFollow,
    toggleJoin,
    flip,
    bump,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
