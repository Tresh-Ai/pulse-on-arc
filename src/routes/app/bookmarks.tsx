import { RequireAuth } from "@/components/common/require-auth";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bookmark } from "lucide-react";
import { ColumnHeader, EmptyState, ErrorState, ListSkeleton } from "@/components/common/states";
import { PostCard } from "@/features/feed/post-card";
import { queries } from "@/services/queries";

export const Route = createFileRoute("/app/bookmarks")({
  head: () => ({
    meta: [
      { title: "Bookmarks | Pulse" },
      { name: "description", content: "Posts you saved for later on Pulse." },
      { property: "og:title", content: "Bookmarks | Pulse" },
      { property: "og:description", content: "Posts you saved for later on Pulse." },
    ],
  }),
  component: GuardedRoute,
});

function BookmarksPage() {
  const bookmarks = useQuery(queries.bookmarks());

  return (
    <div>
      <ColumnHeader title="Bookmarks" />
      {bookmarks.isPending ? <ListSkeleton count={4} /> : null}
      {bookmarks.isError ? (
        <ErrorState description="Bookmarks did not load." onRetry={() => bookmarks.refetch()} />
      ) : null}
      {bookmarks.data && bookmarks.data.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="Nothing saved yet"
          description="Tap the bookmark icon on any post and it will land here."
        />
      ) : null}
      {bookmarks.data?.map((p) => (
        <PostCard key={p.id} post={p} />
      ))}
    </div>
  );
}

function GuardedRoute() {
  return (
    <RequireAuth title="Bookmarks">
      <BookmarksPage />
    </RequireAuth>
  );
}
