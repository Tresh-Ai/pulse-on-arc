import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Compass } from "lucide-react";
import { ColumnHeader, EmptyState, ListSkeleton, TabStrip } from "@/components/common/states";
import { PostCard } from "@/features/feed/post-card";
import { MarketCard } from "@/features/markets/market-card";
import { UserRow } from "@/features/cards";
import { queries } from "@/services/queries";
import { cn, formatCompact } from "@/lib/utils";
import { useShell } from "@/components/layout/shell-context";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/explore")({
  head: () => ({
    meta: [
      { title: "Explore | Pulse" },
      {
        name: "description",
        content: "Trending topics, open markets and accounts worth following on Pulse.",
      },
      { property: "og:title", content: "Explore | Pulse" },
      {
        property: "og:description",
        content: "Trending topics, open markets and accounts worth following on Pulse.",
      },
    ],
  }),
  component: ExplorePage,
});

type Tab = "trending" | "markets" | "people";

const TABS: { id: Tab; label: string }[] = [
  { id: "trending", label: "Trending" },
  { id: "markets", label: "Markets" },
  { id: "people", label: "People" },
];

function ExplorePage() {
  const [tab, setTab] = useState<Tab>("trending");
  const { setSearchOpen } = useShell();

  const topics = useQuery({ ...queries.trendingTopics(), enabled: tab === "trending" });
  const feed = useQuery({ ...queries.feed("trending"), enabled: tab === "trending" });
  const markets = useQuery({ ...queries.markets({ status: "open" }), enabled: tab === "markets" });
  const people = useQuery({ ...queries.suggestedUsers(), enabled: tab === "people" });

  return (
    <div>
      <ColumnHeader
        title="Explore"
        action={
          <Button variant="secondary" size="sm" onClick={() => setSearchOpen(true)}>
            Search
          </Button>
        }
        tabs={<TabStrip value={tab} onChange={setTab} options={TABS} />}
      />

      {tab === "trending" ? (
        <>
          {topics.data?.length ? (
            <div className="border-b border-border">
              {topics.data.map((t, i) => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 border-b border-border px-4 py-3 transition-colors hover:bg-elevated/25 sm:px-5"
                >
                  <span className="w-5 text-sm font-bold tabular-nums text-muted-foreground">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">{t.category}</p>
                    <p className="truncate text-[15px] font-bold">#{t.tag}</p>
                    <p className="text-xs text-muted-foreground">{formatCompact(t.posts)} posts</p>
                  </div>
                  <span className={cn("text-sm font-semibold tabular-nums text-muted-foreground")}>
                    {formatCompact(t.change)} reactions
                  </span>
                </div>
              ))}
            </div>
          ) : null}
          {feed.isPending ? <ListSkeleton count={3} /> : null}
          {feed.data?.length === 0 && !topics.data?.length ? (
            <EmptyState
              icon={Compass}
              title="Nothing trending yet"
              description="Trends build from posts and tags as people share them."
            />
          ) : null}
          {feed.data?.slice(0, 12).map((p) => <PostCard key={p.id} post={p} />)}
        </>
      ) : null}

      {tab === "markets" ? (
        markets.isPending ? (
          <ListSkeleton count={4} />
        ) : markets.data?.length ? (
          markets.data.map((m) => <MarketCard key={m.id} market={m} />)
        ) : (
          <EmptyState
            icon={Compass}
            title="No open markets"
            description="Create the first question and it appears here."
          />
        )
      ) : null}

      {tab === "people" ? (
        people.isPending ? (
          <ListSkeleton count={5} />
        ) : people.data?.length ? (
          people.data.map((u) => <UserRow key={u.id} user={u} />)
        ) : (
          <EmptyState
            icon={Compass}
            title="No accounts yet"
            description="New members show up here as they join."
          />
        )
      ) : null}
    </div>
  );
}
