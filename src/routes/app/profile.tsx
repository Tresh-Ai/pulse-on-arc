import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CalendarDays, Link2, MapPin } from "lucide-react";
import { ColumnHeader, ErrorState, ListSkeleton, TabStrip } from "@/components/common/states";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/features/feed/post-card";
import { PredictionCard } from "@/features/cards";
import { queries } from "@/services/queries";
import { useApp } from "@/store/app-store";
import { formatCompact, formatDate, formatRelativeTime, formatUsd, truncateAddress } from "@/lib/utils";
import type { User } from "@/types";

export const Route = createFileRoute("/app/profile")({
  head: () => ({
    meta: [
      { title: "Your profile | Pulse" },
      { name: "description", content: "Your posts, markets, accuracy and activity on Pulse." },
      { property: "og:title", content: "Your profile | Pulse" },
      { property: "og:description", content: "Your posts, markets, accuracy and activity." },
    ],
  }),
  component: ProfilePage,
});

type Tab = "posts" | "markets" | "activity" | "achievements";

function ProfilePage() {
  const app = useApp();
  const profile = useQuery(queries.profile(app.user.username));
  const [tab, setTab] = useState<Tab>("posts");

  if (profile.isPending) {
    return (
      <div>
        <ColumnHeader title="Profile" />
        <ListSkeleton count={3} />
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

  const { user, posts, predictions, activity } = profile.data;

  return (
    <div>
      <ColumnHeader title={user.displayName} back />
      <ProfileHeader user={user} own />

      <ColumnHeader
        tabs={
          <TabStrip
            value={tab}
            onChange={setTab}
            options={[
              { id: "posts", label: "Posts" },
              { id: "markets", label: "Markets" },
              { id: "activity", label: "Activity" },
              { id: "achievements", label: "Badges" },
            ]}
          />
        }
      />

      {tab === "posts" ? posts.map((p) => <PostCard key={p.id} post={p} />) : null}
      {tab === "markets"
        ? predictions.map((p) => <PredictionCard key={p.id} prediction={p} />)
        : null}
      {tab === "activity"
        ? activity.map((a) => (
            <div key={a.id} className="border-b border-border px-4 py-3 sm:px-5">
              <div className="flex items-center gap-2">
                <p className="min-w-0 flex-1 truncate text-sm font-semibold">{a.label}</p>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatRelativeTime(a.at)}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {a.detail}
                {a.amount ? ` · ${formatUsd(a.amount)}` : ""}
              </p>
            </div>
          ))
        : null}
      {tab === "achievements" ? (
        <div className="grid gap-3 p-4 sm:grid-cols-2 sm:px-5">
          {user.achievements.map((a) => (
            <div key={a.id} className="surface-card p-4">
              <p className="text-sm font-bold">{a.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">{a.description}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Earned {formatDate(a.earnedAt)}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function ProfileHeader({ user, own = false }: { user: User; own?: boolean }) {
  const app = useApp();
  const following = app.isFollowing(user);

  return (
    <div className="border-b border-border">
      <img src={user.banner} alt="" className="h-36 w-full object-cover" />
      <div className="px-4 pb-4 sm:px-5">
        <div className="-mt-10 flex items-end justify-between gap-3">
          <Avatar className="size-20 border-4 border-background">
            <AvatarImage src={user.avatar} alt="" />
            <AvatarFallback>{user.displayName.slice(0, 2)}</AvatarFallback>
          </Avatar>
          {own ? (
            <Button variant="outline" asChild>
              <Link to={"/app/settings" as never}>Edit profile</Link>
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link to={"/app/messages" as never}>Message</Link>
              </Button>
              <Button
                variant={following ? "outline" : "gradient"}
                onClick={() => app.toggleFollow(user.id)}
              >
                {following ? "Following" : "Follow"}
              </Button>
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
        <p className="mt-2 text-sm">{user.bio}</p>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <CalendarDays className="size-3.5" /> Joined {formatDate(user.joinedAt)}
          </span>
          <span className="flex items-center gap-1">
            <Link2 className="size-3.5" /> {truncateAddress(user.walletAddress)}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="size-3.5" /> Reputation {user.reputation}
          </span>
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
            <strong className="tabular-nums text-cyan">{user.predictionAccuracy}%</strong>{" "}
            <span className="text-muted-foreground">accuracy</span>
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {user.interests.map((i) => (
            <Badge key={i} className="rounded-full bg-elevated text-[11px] text-foreground">
              {i}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
