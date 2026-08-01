import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ColumnHeader, ErrorState, ListSkeleton, TabStrip } from "@/components/common/states";
import { PostCard } from "@/features/feed/post-card";
import { PredictionCard } from "@/features/cards";
import { ProfileHeader } from "@/routes/app/profile";
import { queries } from "@/services/queries";
import { useApp } from "@/store/app-store";
import { formatDate, formatRelativeTime } from "@/lib/utils";

export const Route = createFileRoute("/app/u/$handle")({
  head: () => ({
    meta: [
      { title: "Profile | Pulse" },
      { name: "description", content: "Posts, markets and track record for a Pulse account." },
      { property: "og:title", content: "Profile | Pulse" },
      { property: "og:description", content: "Posts, markets and track record for an account." },
    ],
  }),
  component: UserProfilePage,
});

type Tab = "posts" | "markets" | "activity" | "achievements";

function UserProfilePage() {
  const { handle } = Route.useParams();
  const profile = useQuery(queries.profile(handle));
  const app = useApp();
  const [tab, setTab] = useState<Tab>("posts");

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

  const { user, posts, predictions, activity } = profile.data;

  return (
    <div>
      <ColumnHeader title={user.displayName} back />
      <ProfileHeader user={user} own={user.id === app.user.id} />

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
              <p className="mt-1 text-sm text-muted-foreground">{a.detail}</p>
            </div>
          ))
        : null}
      {tab === "achievements" ? (
        <div className="grid gap-3 p-4 sm:grid-cols-2 sm:px-5">
          {user.achievements.map((a) => (
            <div key={a.id} className="surface-card p-4">
              <p className="text-sm font-bold">{a.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">{a.description}</p>
              <p className="mt-2 text-xs text-muted-foreground">Earned {formatDate(a.earnedAt)}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
