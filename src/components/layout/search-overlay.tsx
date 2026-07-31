import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, TrendingUp, Users, Coins, Hash } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { queries } from "@/services/queries";
import { useShell } from "./shell-context";
import { formatCompact, formatPercent, formatUsd } from "@/lib/utils";
import { CardSkeleton, EmptyState } from "@/components/common/states";

export function SearchOverlay() {
  const { searchOpen, setSearchOpen } = useShell();
  const [term, setTerm] = useState("");
  const q = useQuery(queries.search(term));
  const close = () => setSearchOpen(false);

  const results = q.data;
  const empty =
    results &&
    results.users.length === 0 &&
    results.posts.length === 0 &&
    results.predictions.length === 0 &&
    results.communities.length === 0;

  return (
    <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
      <DialogContent className="max-h-[86vh] overflow-hidden border-border bg-popover/95 p-0 backdrop-blur-2xl sm:max-w-[680px]">
        <DialogTitle className="sr-only">Search ARC</DialogTitle>
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <Input
            autoFocus
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search ARC"
            className="h-9 border-0 bg-transparent px-0 text-base focus-visible:ring-0"
          />
        </div>

        <Tabs defaultValue="top" className="max-h-[68vh] overflow-y-auto p-4">
          <TabsList className="mb-4 bg-elevated/60">
            <TabsTrigger value="top">Top</TabsTrigger>
            <TabsTrigger value="people">People</TabsTrigger>
            <TabsTrigger value="markets">Markets</TabsTrigger>
            <TabsTrigger value="communities">Communities</TabsTrigger>
            <TabsTrigger value="tokens">Tokens</TabsTrigger>
          </TabsList>

          {q.isPending ? <CardSkeleton lines={2} /> : null}
          {empty ? (
            <EmptyState
              icon={Search}
              title="No results"
              description={`Nothing matched “${term}”. Try a handle, a ticker, or a market keyword.`}
            />
          ) : null}

          <TabsContent value="top" className="space-y-5">
            {(results?.topics ?? []).slice(0, 5).map((t) => (
              <Link
                key={t.id}
                to={"/app/explore" as never}
                onClick={close}
                className="flex items-center gap-3 rounded-[14px] px-2 py-2 hover:bg-elevated/60"
              >
                <Hash className="size-4 text-cyan" />
                <span className="text-sm font-semibold">{t.tag}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {formatCompact(t.posts)} posts
                </span>
              </Link>
            ))}
            {(results?.users ?? []).slice(0, 3).map((u) => (
              <PersonRow key={u.id} user={u} onClick={close} />
            ))}
          </TabsContent>

          <TabsContent value="people" className="space-y-2">
            {(results?.users ?? []).map((u) => (
              <PersonRow key={u.id} user={u} onClick={close} />
            ))}
          </TabsContent>

          <TabsContent value="markets" className="space-y-2">
            {(results?.predictions ?? []).map((p) => (
              <Link
                key={p.id}
                to={"/app/predictions/$predictionId" as never}
                params={{ predictionId: p.id } as never}
                onClick={close}
                className="flex items-start gap-3 rounded-[14px] px-2 py-2 hover:bg-elevated/60"
              >
                <TrendingUp className="mt-0.5 size-4 shrink-0 text-cyan" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{p.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.category} · {formatUsd(p.pool, { compact: true })} pool · {p.yesPercent}% yes
                  </p>
                </div>
              </Link>
            ))}
          </TabsContent>

          <TabsContent value="communities" className="space-y-2">
            {(results?.communities ?? []).map((c) => (
              <Link
                key={c.id}
                to={"/app/communities/$slug" as never}
                params={{ slug: c.slug } as never}
                onClick={close}
                className="flex items-center gap-3 rounded-[14px] px-2 py-2 hover:bg-elevated/60"
              >
                <Users className="size-4 shrink-0 text-cyan" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{c.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {formatCompact(c.members)} members · {c.tagline}
                  </p>
                </div>
              </Link>
            ))}
          </TabsContent>

          <TabsContent value="tokens" className="space-y-2">
            {(results?.tokens ?? []).map((t) => (
              <Link
                key={t.symbol}
                to={"/app/token" as never}
                onClick={close}
                className="flex items-center gap-3 rounded-[14px] px-2 py-2 hover:bg-elevated/60"
              >
                <Coins className="size-4 shrink-0 text-cyan" />
                <span className="text-sm font-semibold">{t.symbol}</span>
                <span className="truncate text-xs text-muted-foreground">{t.name}</span>
                <span className="ml-auto text-xs tabular-nums">{formatUsd(t.price)}</span>
                <span
                  className={
                    t.change24h >= 0
                      ? "text-xs font-semibold text-success"
                      : "text-xs font-semibold text-destructive"
                  }
                >
                  {formatPercent(t.change24h)}
                </span>
              </Link>
            ))}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function PersonRow({ user, onClick }: { user: import("@/types").User; onClick: () => void }) {
  return (
    <Link
      to={"/app/u/$handle" as never}
      params={{ handle: user.username } as never}
      onClick={onClick}
      className="flex items-center gap-3 rounded-[14px] px-2 py-2 hover:bg-elevated/60"
    >
      <Avatar className="size-9">
        <AvatarImage src={user.avatar} alt="" />
        <AvatarFallback>{user.displayName.slice(0, 2)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{user.displayName}</p>
        <p className="truncate text-xs text-muted-foreground">@{user.username}</p>
      </div>
      <span className="ml-auto shrink-0 text-xs text-muted-foreground">
        {formatCompact(user.followers)} followers
      </span>
    </Link>
  );
}
