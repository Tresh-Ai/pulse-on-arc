import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Inbox } from "lucide-react";
import { ColumnHeader, EmptyState, ErrorState, ListSkeleton } from "@/components/common/states";
import { PostCard } from "@/features/feed/post-card";
import { ProfileHeader } from "@/routes/app/profile";
import { queries } from "@/services/queries";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/app/u/$handle")({
  head: () => ({
    meta: [
      { title: "Profile | Pulse" },
      { name: "description", content: "Posts, followers and activity for a Pulse account." },
      { property: "og:title", content: "Profile | Pulse" },
      { property: "og:description", content: "Posts, followers and activity for an account." },
    ],
  }),
  component: UserProfilePage,
});

function UserProfilePage() {
  const { handle } = Route.useParams();
  const profile = useQuery(queries.profile(handle));
  const { profile: me } = useAuth();

  if (profile.isPending) {
    return (
      <div>
        <ColumnHeader title="Profile" back />
        <ListSkeleton count={3} />
      </div>
    );
  }
  if (profile.isError || !profile.data) {
    return (
      <div>
        <ColumnHeader title="Profile" back />
        <ErrorState
          title="Account not found"
          description="That handle does not exist on Pulse."
          onRetry={() => profile.refetch()}
        />
      </div>
    );
  }

  const { user, posts } = profile.data;

  return (
    <div>
      <ColumnHeader title={user.displayName} back />
      <ProfileHeader user={user} own={user.id === me?.id} />

      {posts.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No posts yet"
          description={`@${user.username} has not posted anything.`}
        />
      ) : (
        posts.map((p) => <PostCard key={p.id} post={p} />)
      )}
    </div>
  );
}
