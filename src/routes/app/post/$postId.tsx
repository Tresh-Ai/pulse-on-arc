import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import { ColumnHeader, ErrorState, ListSkeleton } from "@/components/common/states";
import { EmptyState } from "@/components/common/states";
import { PostCard } from "@/features/feed/post-card";
import { ReplyComposer } from "@/features/feed/composer";
import { queries } from "@/services/queries";

export const Route = createFileRoute("/app/post/$postId")({
  head: () => ({
    meta: [
      { title: "Post | Pulse" },
      { name: "description", content: "A post and its replies on Pulse." },
      { property: "og:title", content: "Post | Pulse" },
      { property: "og:description", content: "A post and its replies on Pulse." },
    ],
  }),
  component: PostDetail,
});

function PostDetail() {
  const { postId } = Route.useParams();
  const detail = useQuery(queries.post(postId));
  const queryClient = useQueryClient();

  if (detail.isPending) {
    return (
      <div>
        <ColumnHeader title="Post" back />
        <ListSkeleton count={3} />
      </div>
    );
  }
  if (detail.isError || !detail.data) {
    return (
      <div>
        <ColumnHeader title="Post" back />
        <ErrorState
          title="Post not found"
          description="This post may have been deleted."
          onRetry={() => detail.refetch()}
        />
      </div>
    );
  }

  return (
    <div>
      <ColumnHeader title="Post" back />
      <PostCard post={detail.data.post} />
      <ReplyComposer
        replyToId={postId}
        onDone={() => {
          void queryClient.invalidateQueries({ queryKey: ["post", postId] });
        }}
      />
      {detail.data.replies.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title="No replies yet"
          description="Be the first to add context to this post."
        />
      ) : null}
      {detail.data.replies.map((r) => (
        <PostCard key={r.id} post={r} />
      ))}
    </div>
  );
}
