import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, TrendingUp } from "lucide-react";
import { queries } from "@/services/queries";
import { useShell } from "./shell-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useApp } from "@/store/app-store";
import { cn, formatCompact, formatPercent, formatUsd } from "@/lib/utils";
import { Sparkline } from "@/components/charts";

/** Persistent right column: search entry, market movers, trends and people. */
export function RightRail() {
  const { setSearchOpen } = useShell();
  const trending = useQuery(queries.trendingTopics());
  const suggested = useQuery(queries.suggestedUsers());
  const token = useQuery(queries.token());
  const app = useApp();

  return (
    <aside className="sticky top-0 hidden h-screen w-[340px] shrink-0 overflow-y-auto py-3 pl-2 no-scrollbar lg:block">
      <button
        onClick={() => setSearchOpen(true)}
        className="flex w-full items-center gap-3 rounded-full border border-transparent bg-elevated/70 px-4 py-3 text-left text-sm text-muted-foreground transition-colors hover:border-cyan/40"
      >
        <Search className="size-4" />
        Search Pulse
      </button>

      <section className="mt-4 rounded-[20px] border border-border bg-surface/50">
        <h2 className="px-4 pt-4 text-[17px] font-bold">Pulse token</h2>
        {token.isPending ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-4 w-24 bg-elevated" />
            <Skeleton className="h-14 w-full bg-elevated" />
          </div>
        ) : token.data ? (
          <Link to="/app/token" className="block px-4 pb-4 pt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tabular-nums">
                {formatUsd(token.data.price)}
              </span>
              <span
                className={cn(
                  "text-sm font-semibold tabular-nums",
                  token.data.change24h >= 0 ? "text-success" : "text-destructive",
                )}
              >
                {formatPercent(token.data.change24h)}
              </span>
            </div>
            <Sparkline
              series={token.data.series.map((p) => p.price)}
              positive={token.data.change24h >= 0}
              className="mt-2 h-16 w-full"
            />
          </Link>
        ) : null}
      </section>

      <section className="mt-4 rounded-[20px] border border-border bg-surface/50">
        <h2 className="px-4 pt-4 text-[17px] font-bold">Trending</h2>
        <div className="mt-1">
          {trending.isPending
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-2 px-4 py-3">
                  <Skeleton className="h-3 w-20 bg-elevated" />
                  <Skeleton className="h-3.5 w-32 bg-elevated" />
                </div>
              ))
            : trending.data?.slice(0, 6).map((topic) => (
                <Link
                  key={topic.id}
                  to="/app/explore"
                  className="block px-4 py-2.5 transition-colors hover:bg-elevated/50"
                >
                  <p className="text-xs text-muted-foreground">{topic.category}</p>
                  <p className="text-[15px] font-bold">#{topic.tag}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCompact(topic.posts)} posts ·{" "}
                    <span className={topic.change >= 0 ? "text-success" : "text-destructive"}>
                      {formatPercent(topic.change)}
                    </span>
                  </p>
                </Link>
              ))}
        </div>
        <Link
          to="/app/explore"
          className="block rounded-b-[20px] px-4 py-3 text-sm text-cyan transition-colors hover:bg-elevated/50"
        >
          Show more
        </Link>
      </section>

      <section className="mt-4 rounded-[20px] border border-border bg-surface/50">
        <h2 className="px-4 pt-4 text-[17px] font-bold">Who to follow</h2>
        <div className="mt-1">
          {suggested.isPending
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <Skeleton className="size-10 rounded-full bg-elevated" />
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-28 bg-elevated" />
                    <Skeleton className="h-3 w-20 bg-elevated" />
                  </div>
                </div>
              ))
            : suggested.data?.slice(0, 3).map((u) => {
                const following = app.isFollowing(u);
                return (
                  <div
                    key={u.id}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-elevated/50"
                  >
                    <Link to="/app/u/$handle" params={{ handle: u.username }}>
                      <Avatar className="size-10">
                        <AvatarImage src={u.avatar} alt="" />
                        <AvatarFallback>{u.displayName.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                    </Link>
                    <Link
                      to="/app/u/$handle"
                      params={{ handle: u.username }}
                      className="min-w-0 flex-1"
                    >
                      <p className="truncate text-sm font-bold">{u.displayName}</p>
                      <p className="truncate text-xs text-muted-foreground">@{u.username}</p>
                    </Link>
                    <Button
                      size="sm"
                      variant={following ? "outline" : "default"}
                      onClick={() => app.toggleFollow(u.id)}
                    >
                      {following ? "Following" : "Follow"}
                    </Button>
                  </div>
                );
              })}
        </div>
        <Link
          to="/app/explore"
          className="block rounded-b-[20px] px-4 py-3 text-sm text-cyan transition-colors hover:bg-elevated/50"
        >
          Show more
        </Link>
      </section>

      <section className="mt-4 rounded-[20px] border border-border bg-surface/50 p-4">
        <h2 className="flex items-center gap-2 text-[17px] font-bold">
          <TrendingUp className="size-4 text-cyan" /> Live markets
        </h2>
        <MarketMini />
      </section>

      <nav className="flex flex-wrap gap-x-3 gap-y-1 px-4 py-5 text-xs text-muted-foreground">
        <Link to="/">Landing</Link>
        <Link to="/app/settings">Settings</Link>
        <span>© 2026 Pulse</span>
      </nav>
    </aside>
  );
}

function MarketMini() {
  const { data, isPending } = useQuery(queries.predictions({ status: "open" }));
  if (isPending) {
    return (
      <div className="mt-3 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full bg-elevated" />
        ))}
      </div>
    );
  }
  return (
    <div className="mt-2 space-y-1">
      {data?.slice(0, 3).map((p) => (
        <Link
          key={p.id}
          to="/app/predictions/$predictionId"
          params={{ predictionId: p.id }}
          className="block rounded-[14px] px-2 py-2 transition-colors hover:bg-elevated/60"
        >
          <p className="line-clamp-2 text-sm font-medium">{p.title}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            <span className="text-success">YES {p.yesPercent}%</span> ·{" "}
            {formatUsd(p.pool, { compact: true })} pool
          </p>
        </Link>
      ))}
    </div>
  );
}
