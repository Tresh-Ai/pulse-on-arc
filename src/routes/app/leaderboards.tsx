import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Trophy } from "lucide-react";
import {
  ColumnHeader,
  EmptyState,
  ErrorState,
  ListSkeleton,
  TabStrip,
} from "@/components/common/states";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { queries } from "@/services/queries";
import { cn } from "@/lib/utils";
import type { LeaderboardBoard, LeaderboardRange } from "@/types";

export const Route = createFileRoute("/app/leaderboards")({
  head: () => ({
    meta: [
      { title: "Leaderboards | Pulse" },
      {
        name: "description",
        content: "Ranked traders, predictors, creators and reputation across Pulse.",
      },
      { property: "og:title", content: "Leaderboards | Pulse" },
      { property: "og:description", content: "Ranked traders, predictors and creators on Pulse." },
    ],
  }),
  component: ComingSoonRoute,
});

const BOARDS: { id: LeaderboardBoard; label: string }[] = [
  { id: "traders", label: "Traders" },
  { id: "predictors", label: "Predictors" },
  { id: "creators", label: "Creators" },
  { id: "reputation", label: "Reputation" },
  { id: "active", label: "Most active" },
];

const RANGES: { id: LeaderboardRange; label: string }[] = [
  { id: "daily", label: "Today" },
  { id: "weekly", label: "Week" },
  { id: "monthly", label: "Month" },
  { id: "all", label: "All time" },
];

function LeaderboardsPage() {
  const [board, setBoard] = useState<LeaderboardBoard>("traders");
  const [range, setRange] = useState<LeaderboardRange>("weekly");
  const list = useQuery(queries.leaderboard(board, range));

  return (
    <div>
      <ColumnHeader
        title="Leaderboards"
        tabs={<TabStrip value={board} onChange={setBoard} options={BOARDS} />}
      />

      <div className="flex gap-2 border-b border-border px-4 py-3 sm:px-5">
        {RANGES.map((r) => (
          <button
            key={r.id}
            onClick={() => setRange(r.id)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
              range === r.id
                ? "bg-elevated text-foreground"
                : "text-muted-foreground hover:bg-elevated/50",
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      {list.isPending ? <ListSkeleton count={6} /> : null}
      {list.isError ? (
        <ErrorState description="Rankings did not load." onRetry={() => list.refetch()} />
      ) : null}
      {list.data && list.data.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No rankings yet"
          description="Nobody has qualified for this board in the selected range."
        />
      ) : null}

      {list.data?.map((entry) => (
        <Link
          key={entry.user.id}
          to="/app/u/$handle"
          params={{ handle: entry.user.username }}
          className="flex items-center gap-3 border-b border-border px-4 py-3.5 transition-colors hover:bg-elevated/25 sm:px-5"
        >
          <span
            className={cn(
              "w-6 shrink-0 text-center text-sm font-bold tabular-nums",
              entry.rank <= 3 ? "text-cyan" : "text-muted-foreground",
            )}
          >
            {entry.rank}
          </span>
          <Avatar className="size-10">
            <AvatarImage src={entry.user.avatar} alt="" />
            <AvatarFallback>{entry.user.displayName.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{entry.user.displayName}</p>
            <p className="truncate text-xs text-muted-foreground">@{entry.user.username}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold tabular-nums">{entry.primaryStat}</p>
            <p className="text-[11px] text-muted-foreground">{entry.primaryLabel}</p>
          </div>
          <div className="hidden text-right sm:block">
            <p className="text-sm tabular-nums">{entry.secondaryStat}</p>
            <p className="text-[11px] text-muted-foreground">{entry.secondaryLabel}</p>
          </div>
          <span
            className={cn(
              "w-10 text-right text-xs font-semibold tabular-nums",
              entry.change >= 0 ? "text-success" : "text-destructive",
            )}
          >
            {entry.change >= 0 ? "+" : ""}
            {entry.change}
          </span>
        </Link>
      ))}
    </div>
  );
}

function ComingSoonRoute() {
  return (
    <ComingSoon eyebrow="Leaderboards" title="Coming soon" description="Ranking traders, predictors and creators needs a full season of real activity first.">
      <LeaderboardsPage />
    </ComingSoon>
  );
}
