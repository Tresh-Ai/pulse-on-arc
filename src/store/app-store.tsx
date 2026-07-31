import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { currentUser } from "@/mock-data/users";
import { communities } from "@/mock-data/communities";
import { users } from "@/mock-data/users";
import { notifications } from "@/mock-data/social";
import type { User } from "@/types";

/**
 * Client side prototype state: mock session plus the social interactions that
 * need to persist while navigating (follows, joins, likes, bookmarks, votes).
 * No credentials and no persistence layer, by design for the prototype phase.
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
  signIn: () => void;
  signOut: () => void;
  completeOnboarding: (patch?: Partial<User>) => void;
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

  const toggleFollow = useCallback((userId: string) => {
    setFollows((prev) => toggleInSet(prev, userId));
  }, []);

  const toggleJoin = useCallback((communityId: string) => {
    setJoined((prev) => toggleInSet(prev, communityId));
  }, []);

  const flip = useCallback(
    (
      setter: React.Dispatch<React.SetStateAction<Set<string>>>,
      id: string,
      initial: boolean,
    ) => {
      setter((prev) => {
        const next = new Set(prev);
        const overridden = next.has(id);
        // Presence in the set means "flipped relative to the mock default".
        if (overridden) next.delete(id);
        else next.add(id);
        void initial;
        return next;
      });
    },
    [],
  );

  const value = useMemo<AppState>(() => {
    const unread = notifications.filter((n) => !n.read && !readNotifications.has(n.id)).length;
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
      signIn: () => setSignedIn(true),
      signOut: () => setSignedIn(false),
      completeOnboarding: (patch) => {
        if (patch) setUser((prev) => ({ ...prev, ...patch }));
        setOnboarded(true);
        setSignedIn(true);
      },
      toggleFollow,
      isFollowing: (u) => (follows.has(u.id) ? true : false),
      toggleJoin,
      isJoined: (id, fallback) => (joined.size === 0 ? fallback : joined.has(id)),
      toggleLike: (id, initial) => flip(setLikes, id, initial),
      isLiked: (id, initial) => (likes.has(id) ? !initial : initial),
      toggleBookmark: (id, initial) => flip(setBookmarks, id, initial),
      isBookmarked: (id, initial) => (bookmarks.has(id) ? !initial : initial),
      toggleRepost: (id, initial) => flip(setReposts, id, initial),
      isReposted: (id, initial) => (reposts.has(id) ? !initial : initial),
      recordVote: (predictionId, side, stake) =>
        setVotes((prev) => ({ ...prev, [predictionId]: { side, stake } })),
      recordPollVote: (pollId, optionId) =>
        setPollVotes((prev) => ({ ...prev, [pollId]: optionId })),
      markNotificationsRead: () => setReadNotifications(new Set(notifications.map((n) => n.id))),
      unreadCount: unread,
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
    toggleFollow,
    toggleJoin,
    flip,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
