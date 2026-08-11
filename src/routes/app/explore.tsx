import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Compass } from "lucide-react";
import {
  ColumnHeader,
  EmptyState,
  GridSkeleton,
  ListSkeleton,
  TabStrip,
} from "@/components/common/states";
import { PostCard } from "@/features/feed/post-card";
import { PredictionCard, UserRow, CommunityCard } from "@/features/cards";
import { queries } from "@/services/queries";
import { Sparkline } from "@/components/charts";
import { cn, formatCompact, formatPercent, formatUsd } from "@/lib/utils";
import { useShell } from "@/components/layout/shell-context";
import { Button } from "@/components/ui/button";
import { tokenList } from "@/mock-data/discovery";

export const Route = createFileRoute("/app/explore")({
  head: () => ({
    meta: [
      { title: "Explore | Pulse" },
      {
        name: "description",
        content: "Trending topics, hot markets, rising creators and token movers on Pulse.",
      },
      { property: "og:title", content: "Explore | Pulse" },
      {
        property: "og:description",
        content: "Trending topics, hot markets, rising creators and token movers on Pulse.",
      },
    ],
  }),
  component: ExplorePage,
});

type Tab = "trending" | "markets" | "people" | "communities" | "tokens";

const TABS: { id: Tab; label: string }[] = [
  { id: "trending", label: "Trending" },
  { id: "markets", label: "Markets" },
  { id: "people", label: "People" },
  { id: "communities", label: "Rooms" },
  { id: "tokens", label: "Tokens" },
];

function ExplorePage() {
  const [tab, setTab] = useState<Tab>("trending");
  const { setSearchOpen } = useShell();

  const topics = useQuery({ ...queries.trendingTopics(), enabled: tab === "trending" });
  const feed = useQuery({ ...queries.feed("trending"), enabled: tab === "trending" });
  const markets = useQuery({ ...queries.markets({ status: "open" }), enabled: tab === "markets" });
  const people = useQuery({ ...queries.suggestedUsers(), enabled: tab === "people" });
  const rooms = useQuery({ ...queries.communities(), enabled: tab === "communities" });

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
          <div className="border-b border-border">
            {topics.isPending
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-16 animate-pulse border-b border-border bg-elevated/30"
                  />
                ))
              : topics.data?.map((t, i) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-3 border-b border-border px-4 py-3 transition-colors hover:bg-elevated/25 sm:px-5"
                  >
                    <span className="w-5 text-sm font-bold text-muted-foreground tabular-nums">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">{t.category}</p>
                      <p className="truncate text-[15px] font-bold">#{t.tag}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCompact(t.posts)} posts
                      </p>
                    </div>
                    <span
                      className={cn(
                        "text-sm font-semibold tabular-nums",
                        t.change >= 0 ? "text-success" : "text-destructive",
                      )}
                    >
                      {formatPercent(t.change)}
                    </span>
                  </div>
                ))}
          </div>
          {feed.isPending ? <ListSkeleton count={3} /> : null}
          {feed.data?.slice(0, 8).map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </>
      ) : null}

      {tab === "markets" ? (
        markets.isPending ? (
          <ListSkeleton count={4} />
        ) : markets.data?.length ? (
          markets.data.map((m) => <MarketCard key={m.id} market={m} />)
        ) : (
          <EmptyState icon={Compass} title="No markets" description="Nothing matches right now." />
        )
      ) : null}

      {tab === "people" ? (
        people.isPending ? (
          <ListSkeleton count={5} />
        ) : (
          people.data?.map((u) => <UserRow key={u.id} user={u} />)
        )
      ) : null}

      {tab === "communities" ? (
        <div className="p-4 sm:p-5">
          {rooms.isPending ? (
            <GridSkeleton count={4} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {rooms.data?.map((c) => (
                <CommunityCard key={c.id} community={c} />
              ))}
            </div>
          )}
        </div>
      ) : null}

      {tab === "tokens" ? (
        <div>
          {tokenList.map((t) => (
            <div
              key={t.symbol}
              className="flex items-center gap-4 border-b border-border px-4 py-3.5 transition-colors hover:bg-elevated/25 sm:px-5"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-bold">{t.symbol}</p>
                <p className="truncate text-xs text-muted-foreground">{t.name}</p>
              </div>
              <Sparkline
                series={[1, 1.4, 1.2, 1.8, 1.6, 2.1, t.change24h >= 0 ? 2.4 : 1.1]}
                positive={t.change24h >= 0}
                className="h-8 w-20 shrink-0"
              />
              <div className="w-24 shrink-0 text-right">
                <p className="text-sm font-semibold tabular-nums">{formatUsd(t.price)}</p>
                <p
                  className={cn(
                    "text-xs tabular-nums",
                    t.change24h >= 0 ? "text-success" : "text-destructive",
                  )}
                >
                  {formatPercent(t.change24h)}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
