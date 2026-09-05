import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, TrendingUp, Hash, MessageSquare } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { queries } from "@/services/queries";
import { useShell } from "./shell-context";
import { formatCompact, formatUsd, formatRelativeTime } from "@/lib/utils";
import { CardSkeleton, EmptyState } from "@/components/common/states";
import type { SearchPost } from "@/services/search";
import type { User } from "@/types";

export function SearchOverlay() {
  const { searchOpen, setSearchOpen } = useShell();
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const id = setTimeout(() => setDebounced(term.trim()), 250);
    return () => clearTimeout(id);
  }, [term]);

  const q = useQuery({ ...queries.search(debounced), enabled: searchOpen });
  const close = () => setSearchOpen(false);

  const results = q.data;
  const empty =
    results &&
    results.users.length === 0 &&
    results.posts.length === 0 &&
    results.markets.length === 0 &&
    results.topics.length === 0;

  return (
    <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
      <DialogContent className="max-h-[86vh] overflow-hidden border-border bg-popover/95 p-0 backdrop-blur-2xl sm:max-w-[680px]">
        <DialogTitle className="sr-only">Search Pulse</DialogTitle>
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <Input
            autoFocus
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search people, posts and markets"
            className="h-9 border-0 bg-transparent px-0 text-base focus-visible:ring-0"
          />
        </div>

        <Tabs defaultValue="top" className="max-h-[68vh] overflow-y-auto p-4">
          <TabsList className="mb-4 bg-elevated/60">
            <TabsTrigger value="top">Top</TabsTrigger>
            <TabsTrigger value="people">People</TabsTrigger>
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="markets">Markets</TabsTrigger>
          </TabsList>

          {q.isPending ? <CardSkeleton lines={2} /> : null}
          {q.isError ? (
            <EmptyState
              icon={Search}
              title="Search is unavailable"
              description="Something went wrong reaching the network. Try again."
            />
          ) : null}
          {empty ? (
            <EmptyState
              icon={Search}
              title="No results"
              description={
                debounced
                  ? `Nothing matched “${debounced}”. Try a handle or a market keyword.`
                  : "Start typing to search people, posts and markets."
              }
            />
          ) : null}

          <TabsContent value="top" className="space-y-2">
            {(results?.topics ?? []).slice(0, 4).map((t) => (
              <Link
                key={t.id}
                to="/app/explore"
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
            {(results?.posts ?? []).slice(0, 3).map((p) => (
              <PostRow key={p.id} post={p} onClick={close} />
            ))}
          </TabsContent>

          <TabsContent value="people" className="space-y-2">
            {(results?.users ?? []).map((u) => (
              <PersonRow key={u.id} user={u} onClick={close} />
            ))}
          </TabsContent>

          <TabsContent value="posts" className="space-y-2">
            {(results?.posts ?? []).map((p) => (
              <PostRow key={p.id} post={p} onClick={close} />
            ))}
          </TabsContent>

          <TabsContent value="markets" className="space-y-2">
            {(results?.markets ?? []).map((p) => (
              <Link
                key={p.id}
                to="/app/predictions/$predictionId"
                params={{ predictionId: p.id }}
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
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function PostRow({ post, onClick }: { post: SearchPost; onClick: () => void }) {
  return (
    <Link
      to="/app/post/$postId"
      params={{ postId: post.id }}
      onClick={onClick}
      className="flex items-start gap-3 rounded-[14px] px-2 py-2 hover:bg-elevated/60"
    >
      <MessageSquare className="mt-0.5 size-4 shrink-0 text-cyan" />
      <div className="min-w-0">
        <p className="line-clamp-2 text-sm">{post.body}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          @{post.author.username} · {formatRelativeTime(post.createdAt)} · {formatCompact(post.likeCount)} likes
        </p>
      </div>
    </Link>
  );
}

function PersonRow({ user, onClick }: { user: User; onClick: () => void }) {
  return (
    <Link
      to="/app/u/$handle"
      params={{ handle: user.username }}
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
