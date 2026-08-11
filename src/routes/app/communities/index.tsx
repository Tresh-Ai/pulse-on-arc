import { ComingSoon } from "@/components/common/coming-soon";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Users } from "lucide-react";
import {
  ColumnHeader,
  EmptyState,
  ErrorState,
  GridSkeleton,
  TabStrip,
} from "@/components/common/states";
import { CommunityCard } from "@/features/cards";
import { Input } from "@/components/ui/input";
import { queries } from "@/services/queries";
import { useApp } from "@/store/app-store";

export const Route = createFileRoute("/app/communities/")({
  head: () => ({
    meta: [
      { title: "Communities | Pulse" },
      {
        name: "description",
        content: "Join rooms with their own markets, moderators and member research threads.",
      },
      { property: "og:title", content: "Communities | Pulse" },
      { property: "og:description", content: "Rooms with their own markets and research threads." },
    ],
  }),
  component: ComingSoonRoute,
});

type Tab = "all" | "joined";

function CommunitiesPage() {
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const communities = useQuery(queries.communities());
  const app = useApp();

  const list = (communities.data ?? [])
    .filter((c) => (tab === "joined" ? app.isJoined(c.id, c.joined) : true))
    .filter((c) =>
      search.trim()
        ? `${c.name} ${c.tagline} ${c.category}`.toLowerCase().includes(search.toLowerCase())
        : true,
    );

  return (
    <div>
      <ColumnHeader
        title="Communities"
        tabs={
          <TabStrip
            value={tab}
            onChange={setTab}
            options={[
              { id: "all", label: "All" },
              { id: "joined", label: "Joined" },
            ]}
          />
        }
      />

      <div className="border-b border-border px-4 py-3 sm:px-5">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search communities"
          className="h-9 rounded-full"
        />
      </div>

      {communities.isPending ? (
        <div className="p-4 sm:p-5">
          <GridSkeleton count={4} />
        </div>
      ) : null}
      {communities.isError ? (
        <ErrorState description="Communities did not load." onRetry={() => communities.refetch()} />
      ) : null}
      {communities.data && list.length === 0 ? (
        <EmptyState
          icon={Users}
          title={tab === "joined" ? "You have not joined a room yet" : "Nothing matches"}
          description="Join a room to get its markets and member threads in your feed."
          actionLabel="Browse all"
          onAction={() => {
            setTab("all");
            setSearch("");
          }}
        />
      ) : null}

      <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
        {list.map((c) => (
          <CommunityCard key={c.id} community={c} />
        ))}
      </div>
    </div>
  );
}

function ComingSoonRoute() {
  return (
    <ComingSoon eyebrow="Communities" title="Coming soon" description="Rooms, moderation and shared feeds are on the way so groups can trade ideas together.">
      <CommunitiesPage />
    </ComingSoon>
  );
}
