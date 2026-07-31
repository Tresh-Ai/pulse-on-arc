import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Inbox, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState, ErrorState, ListSkeleton, PageHeader, SectionCard } from "@/components/common/states";
import { PostCard } from "@/features/feed/post-card";
import { queries } from "@/services/queries";
import { Button } from "@/components/ui/button";
import { cn, formatCompact, formatPercent } from "@/lib/utils";
import type { FeedFilter } from "@/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ARC Social | Social trading and prediction markets" },
      {
        name: "description",
        content:
          "Discuss markets, build reputation, and trade prediction markets with the ARC community. Live feed, creator rooms, and leaderboards.",
      },
      { property: "og:title", content: "ARC Social | Social trading and prediction markets" },
      {
        property: "og:description",
        content:
          "Discuss markets, build reputation, and trade prediction markets with the ARC community.",
      },
    ],
  }),
  component: HomePage,
});

const FILTERS: { id: FeedFilter; label: string }[] = [
  { id: "following", label: "Following" },
  { id: "trending", label: "Trending" },
  { id: "latest", label: "Latest" },
  { id: "arc", label: "ARC" },
  { id: "markets", label: "Markets" },
  { id: "predictions", label: "Predictions" },
];

function HomePage() {
  const [filter, setFilter] = useState<FeedFilter>("trending");
  const feed = useQuery(queries.feed(filter));
  const topics = useQuery(queries.trendingTopics());

  return (
    <AppShell
      rail={
        <div className="space-y-4">
          <SectionCard>
            <h2 className="text-sm font-semibold">Trending on ARC</h2>
            <ul className="mt-4 space-y-3">
              {(topics.data ?? []).slice(0, 6).map((topic) => (
                <li key={topic.id} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">#{topic.tag}</p>
                    <p className="text-xs text-muted-foreground">
                      {topic.category} · {formatCompact(topic.posts)} posts
                    </p>
                  </div>
                  <span
                    className={cn(
                      "text-xs font-semibold tabular-nums",
                      topic.change >= 0 ? "text-success" : "text-destructive",
                    )}
                  >
                    {formatPercent(topic.change)}
                  </span>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>
      }
    >
      <PageHeader
        title="Home"
        description="Market insight from the accounts and communities you follow across the ARC network."
        action={
          <Button className="gradient-fill rounded-[14px] text-primary-foreground">
            <Sparkles className="size-4" /> New post
          </Button>
        }
      />

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1 no-scrollbar" role="tablist" aria-label="Feed filters">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            role="tab"
            aria-selected={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              filter === f.id
                ? "gradient-fill text-primary-foreground"
                : "bg-elevated/60 text-muted-foreground hover:text-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {feed.isPending ? <ListSkeleton count={4} /> : null}
      {feed.isError ? (
        <ErrorState description="The feed could not be loaded." onRetry={() => feed.refetch()} />
      ) : null}
      {feed.data && feed.data.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Nothing here yet"
          description="Follow a few analysts or switch to Trending to see what the network is discussing."
          actionLabel="Show trending"
          onAction={() => setFilter("trending")}
        />
      ) : null}

      <div className="space-y-4">
        {(feed.data ?? []).map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </AppShell>
  );
}
