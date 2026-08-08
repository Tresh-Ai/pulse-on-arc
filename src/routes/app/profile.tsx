import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Inbox, Link2, ShieldCheck } from "lucide-react";
import { ColumnHeader, EmptyState, ErrorState, ListSkeleton } from "@/components/common/states";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/features/feed/post-card";
import { queries } from "@/services/queries";
import { useAuth } from "@/hooks/use-auth";
import { useToggleFollow } from "@/hooks/use-social";
import { formatCompact, formatDate, truncateAddress } from "@/lib/utils";
import type { User } from "@/types";

export const Route = createFileRoute("/app/profile")({
  head: () => ({
    meta: [
      { title: "Your profile | Pulse" },
      { name: "description", content: "Your posts, followers and activity on Pulse." },
      { property: "og:title", content: "Your profile | Pulse" },
      { property: "og:description", content: "Your posts, followers and activity." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { profile: me, loading } = useAuth();
  const profile = useQuery(queries.profile(me?.handle ?? ""));

  if (loading || (me && profile.isPending)) {
    return (
      <div>
        <ColumnHeader title="Profile" />
        <ListSkeleton count={3} />
      </div>
    );
  }

  if (!me) {
    return (
      <div>
        <ColumnHeader title="Profile" />
        <EmptyState
          icon={ShieldCheck}
          title="Sign in to see your profile"
          description="Your posts, followers and saved items live in your account."
          actionLabel="Sign in"
          onAction={() => {
            window.location.href = "/auth/sign-in";
          }}
        />
      </div>
    );
  }

  if (profile.isError || !profile.data) {
    return (
      <div>
        <ColumnHeader title="Profile" />
        <ErrorState description="Your profile did not load." onRetry={() => profile.refetch()} />
      </div>
    );
  }

  const { user, posts } = profile.data;

  return (
    <div>
      <ColumnHeader title={user.displayName} back />
      <ProfileHeader user={user} own />

      {posts.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No posts yet"
          description="Share your first take from the composer on the home timeline."
        />
      ) : (
        posts.map((p) => <PostCard key={p.id} post={p} />)
      )}
    </div>
  );
}

export function ProfileHeader({ user, own = false }: { user: User; own?: boolean }) {
  const { session } = useAuth();
  const follow = useToggleFollow();

  return (
    <div className="border-b border-border">
      <img
        src={user.banner}
        alt=""
        loading="lazy"
        decoding="async"
        className="h-36 w-full object-cover"
      />
      <div className="px-4 pb-4 sm:px-5">
        <div className="-mt-10 flex items-end justify-between gap-3">
          <Avatar className="size-20 border-4 border-background">
            <AvatarImage src={user.avatar} alt="" />
            <AvatarFallback>{user.displayName.slice(0, 2)}</AvatarFallback>
          </Avatar>
          {own ? (
            <Button variant="outline" asChild>
              <Link to="/app/settings">Edit profile</Link>
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link to="/app/messages">Message</Link>
              </Button>
              {session ? (
                <Button
                  variant={user.isFollowing ? "outline" : "gradient"}
                  disabled={follow.isPending}
                  onClick={() => follow.mutate({ userId: user.id, following: !user.isFollowing })}
                >
                  {user.isFollowing ? "Following" : "Follow"}
                </Button>
              ) : (
                <Button variant="gradient" asChild>
                  <Link to="/auth/sign-in">Sign in to follow</Link>
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <h1 className="text-xl font-bold">{user.displayName}</h1>
          {user.verified ? (
            <Badge className="rounded-full bg-cyan/15 text-[11px] text-cyan">Verified</Badge>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground">@{user.username}</p>
        {user.bio ? <p className="mt-2 text-sm">{user.bio}</p> : null}

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <CalendarDays className="size-3.5" /> Joined {formatDate(user.joinedAt)}
          </span>
          {user.walletAddress ? (
            <span className="flex items-center gap-1">
              <Link2 className="size-3.5" /> {truncateAddress(user.walletAddress)}
            </span>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
          <span>
            <strong className="tabular-nums">{formatCompact(user.following)}</strong>{" "}
            <span className="text-muted-foreground">following</span>
          </span>
          <span>
            <strong className="tabular-nums">{formatCompact(user.followers)}</strong>{" "}
            <span className="text-muted-foreground">followers</span>
          </span>
          <span>
            <strong className="tabular-nums">{formatCompact(user.postCount)}</strong>{" "}
            <span className="text-muted-foreground">posts</span>
          </span>
        </div>
      </div>
    </div>
  );
}
