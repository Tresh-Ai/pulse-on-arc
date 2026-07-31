import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Inbox, Sparkles } from "lucide-react";
import { ColumnHeader, EmptyState, ErrorState, ListSkeleton, TabStrip } from "@/components/common/states";
import { PostCard } from "@/features/feed/post-card";
import { InlineComposer } from "@/features/feed/composer";
import { queries } from "@/services/queries";
import type { FeedFilter } from "@/types";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "Home | ARC" },
      { name: "description", content: "Your ARC timeline: market takes, charts, polls and live prediction markets." },
      { property: "og:title", content: "Home | ARC" },
      { property: "og:description", content: "Your ARC timeline: market takes, charts, polls and live prediction markets." },
    ],
  }),
  component: HomeFeed,
});

const TABS: { id: FeedFilter; label: string }[] = [
  { id: "following", label: "Following" },
  { id: "trending", label: "For you" },
  { id: "latest", label: "Latest" },
  { id: "arc", label: "ARC" },
];

function HomeFeed() {
  const [filter, setFilter] = useState<FeedFilter>("following");
  const feed = useQuery(queries.feed(filter));

  return (
    <div>
      <ColumnHeader
        tabs={<TabStrip value={filter} onChange={setFilter} options={TABS} />}
      />
      <InlineComposer />

      {feed.isPending ? <ListSkeleton count={5} /> : null}
      {feed.isError ? (
        <ErrorState description="The timeline did not load." onRetry={() => feed.refetch()} />
      ) : null}
      {feed.data?.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Nothing here yet"
          description="Follow a few desks or switch to For you to see what the network is watching."
          actionLabel="Browse For you"
          onAction={() => setFilter("trending")}
        />
      ) : null}
      {feed.data?.map((post) => <PostCard key={post.id} post={post} />)}
      {feed.data && feed.data.length > 0 ? (
        <p className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
          <Sparkles className="size-4 text-cyan" /> You are all caught up
        </p>
      ) : null}
    </div>
  );
}
