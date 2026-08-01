import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ColumnHeader,
  ErrorState,
  ListSkeleton,
  SectionTitle,
  TabStrip,
} from "@/components/common/states";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/features/feed/post-card";
import { InlineComposer } from "@/features/feed/composer";
import { PredictionCard, UserRow } from "@/features/cards";
import { queries } from "@/services/queries";
import { useApp } from "@/store/app-store";
import { formatCompact } from "@/lib/utils";

export const Route = createFileRoute("/app/communities/$slug")({
  head: () => ({
    meta: [
      { title: "Community | Pulse" },
      { name: "description", content: "Community posts, markets, moderators and members." },
      { property: "og:title", content: "Community | Pulse" },
      { property: "og:description", content: "Community posts, markets, moderators and members." },
    ],
  }),
  component: CommunityDetail,
});

type Tab = "posts" | "markets" | "members" | "about";

function CommunityDetail() {
  const { slug } = Route.useParams();
  const detail = useQuery(queries.community(slug));
  const app = useApp();
  const [tab, setTab] = useState<Tab>("posts");

  if (detail.isPending) {
    return (
      <div>
        <ColumnHeader title="Community" back />
        <ListSkeleton count={3} />
      </div>
    );
  }
  if (detail.isError || !detail.data) {
    return (
      <div>
        <ColumnHeader title="Community" back />
        <ErrorState description="This room is not available." onRetry={() => detail.refetch()} />
      </div>
    );
  }

  const { community, posts, moderators, members, rooms, leaderboard } = detail.data;
  const joined = app.isJoined(community.id, community.joined);

  return (
    <div>
      <ColumnHeader title={community.name} back />

      <img src={community.banner} alt="" className="h-36 w-full object-cover" />
      <div className="border-b border-border px-4 pb-4 sm:px-5">
        <div className="-mt-8 flex items-end justify-between gap-3">
          <img
            src={community.icon}
            alt=""
            className="size-16 rounded-3xl border-4 border-background"
          />
          <Button
            variant={joined ? "outline" : "gradient"}
            onClick={() => app.toggleJoin(community.id)}
          >
            {joined ? "Joined" : "Join"}
          </Button>
        </div>
        <h1 className="mt-3 text-xl font-bold">{community.name}</h1>
        <p className="text-sm text-muted-foreground">{community.tagline}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          {formatCompact(community.members)} members · {community.onlineNow} online ·{" "}
          {community.category}
        </p>
      </div>

      <ColumnHeader
        tabs={
          <TabStrip
            value={tab}
            onChange={setTab}
            options={[
              { id: "posts", label: "Posts" },
              { id: "markets", label: "Markets" },
              { id: "members", label: "Members" },
              { id: "about", label: "About" },
            ]}
          />
        }
      />

      {tab === "posts" ? (
        <>
          {joined ? <InlineComposer communityId={community.id} /> : null}
          {posts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </>
      ) : null}

      {tab === "markets" ? rooms.map((p) => <PredictionCard key={p.id} prediction={p} />) : null}

      {tab === "members" ? (
        <>
          <div className="px-4 py-4 sm:px-5">
            <SectionTitle>Moderators</SectionTitle>
          </div>
          {moderators.map((u) => (
            <UserRow key={u.id} user={u} showBio={false} />
          ))}
          <div className="px-4 py-4 sm:px-5">
            <SectionTitle>Members</SectionTitle>
          </div>
          {members.map((u) => (
            <UserRow key={u.id} user={u} showBio={false} />
          ))}
        </>
      ) : null}

      {tab === "about" ? (
        <div className="space-y-5 px-4 py-4 sm:px-5">
          <div>
            <SectionTitle>About</SectionTitle>
            <p className="mt-2 text-sm text-muted-foreground">{community.description}</p>
          </div>
          <div>
            <SectionTitle>Top members this week</SectionTitle>
            <ol className="mt-3 space-y-3">
              {leaderboard.map((entry) => (
                <li key={entry.user.id} className="flex items-center gap-3 text-sm">
                  <span className="w-5 text-xs font-bold text-muted-foreground tabular-nums">
                    {entry.rank}
                  </span>
                  <Avatar className="size-8">
                    <AvatarImage src={entry.user.avatar} alt="" />
                    <AvatarFallback>{entry.user.displayName.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1 truncate">{entry.user.displayName}</span>
                  <span className="text-xs text-cyan tabular-nums">{entry.primaryStat}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      ) : null}
    </div>
  );
}
