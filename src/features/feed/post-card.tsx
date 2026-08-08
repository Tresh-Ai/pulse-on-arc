import { Link, useRouter } from "@tanstack/react-router";
import {
  Heart,
  MessageCircle,
  Repeat2,
  Bookmark,
  Share2,
  BadgeCheck,
  Pin,
  BarChart2,
  MoreHorizontal,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import type { Post } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sparkline } from "@/components/charts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, formatCompact, formatPercent, formatRelativeTime, timeRemaining } from "@/lib/utils";
import { useApp } from "@/store/app-store";
import { useAuth } from "@/hooks/use-auth";
import { useDeletePost, useToggleBookmark, useToggleLike } from "@/hooks/use-social";

/**
 * Timeline post row. Borderless, full bleed and edge to edge like a native
 * social timeline: avatar column on the left, content and actions on the right.
 * Likes, bookmarks and deletes write straight to the backend.
 */
export function PostCard({ post, compact = false }: { post: Post; compact?: boolean }) {
  const app = useApp();
  const router = useRouter();
  const { profile: me } = useAuth();
  const like = useToggleLike();
  const bookmark = useToggleBookmark();
  const removePost = useDeletePost();
  const liked = post.liked;
  const reposted = app.isReposted(post.id, post.reposted);
  const bookmarked = post.bookmarked;
  const isMine = me?.id === post.author.id;

  const pollTotal = post.poll?.options.reduce((sum, o) => sum + o.votes, 0) ?? 0;
  const votedOption = post.poll ? app.pollVotes[post.id] : undefined;

  const stop = (fn: () => void) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fn();
  };


  return (
    <article className="relative border-b border-border transition-colors duration-150 hover:bg-elevated/25">
      <Link
        to="/app/post/$postId"
        params={{ postId: post.id }}
        aria-label="Open post"
        className="absolute inset-0 z-0"
      />
      <div className="relative z-10 px-4 py-3 sm:px-5 [&_a]:relative [&_button]:relative">
        {post.pinned ? (
          <p className="mb-1.5 flex items-center gap-1.5 pl-[52px] text-xs font-medium text-muted-foreground">
            <Pin className="size-3.5" /> Pinned
          </p>
        ) : null}

        <div className="flex gap-3">
          <Avatar className="size-10 shrink-0">
            <AvatarImage src={post.author.avatar} alt="" />
            <AvatarFallback>{post.author.displayName.slice(0, 2)}</AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-[15px] font-bold">{post.author.displayName}</span>
              {post.author.verified ? (
                <BadgeCheck className="size-[15px] shrink-0 text-cyan" />
              ) : null}
              <span className="truncate text-[15px] text-muted-foreground">
                @{post.author.username}
              </span>
              <span className="text-muted-foreground" aria-hidden="true">
                ·
              </span>
              <time
                className="shrink-0 text-[15px] text-muted-foreground"
                dateTime={post.createdAt}
              >
                {formatRelativeTime(post.createdAt)}
              </time>
              <DropdownMenu>
                <DropdownMenuTrigger
                  onClick={(e) => e.preventDefault()}
                  className="ml-auto grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground"
                  aria-label="Post options"
                >
                  <MoreHorizontal className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onSelect={() => toast("Muted for this session")}>
                    Mute @{post.author.username}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => toast("Report submitted")}>
                    Report post
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => toast.success("Link copied")}>
                    Copy link
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <p className="mt-0.5 whitespace-pre-wrap text-[15px] leading-relaxed">{post.body}</p>

            {post.tags.length > 0 ? (
              <p className="mt-1 flex flex-wrap gap-x-2 text-[15px] text-cyan">
                {post.tags.slice(0, 4).map((t) => (
                  <span key={t}>#{t}</span>
                ))}
              </p>
            ) : null}

            {post.imageUrl && !compact ? (
              <img
                src={post.imageUrl}
                alt=""
                loading="lazy"
                className="mt-3 w-full rounded-[16px] border border-border object-cover"
              />
            ) : null}

            {post.chart && !compact ? (
              <div className="mt-3 rounded-[16px] border border-border bg-surface/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">{post.chart.symbol}</span>
                  <span
                    className={cn(
                      "text-sm font-semibold tabular-nums",
                      post.chart.change >= 0 ? "text-success" : "text-destructive",
                    )}
                  >
                    {formatPercent(post.chart.change)}
                  </span>
                </div>
                <Sparkline
                  series={post.chart.series}
                  positive={post.chart.change >= 0}
                  className="mt-2 h-20 w-full"
                />
              </div>
            ) : null}

            {post.poll && !compact ? (
              <div className="mt-3 space-y-2">
                <p className="text-sm font-medium">{post.poll.question}</p>
                {post.poll.options.map((o) => {
                  const pct = pollTotal ? Math.round((o.votes / pollTotal) * 100) : 0;
                  const chosen = votedOption === o.id;
                  return (
                    <button
                      key={o.id}
                      onClick={stop(() => {
                        app.recordPollVote(post.id, o.id);
                        toast.success(`Voted: ${o.label}`);
                      })}
                      className={cn(
                        "relative w-full overflow-hidden rounded-full border border-border px-4 py-2 text-left text-sm transition-colors hover:border-cyan/60",
                        chosen && "border-cyan",
                      )}
                    >
                      <span
                        className="absolute inset-y-0 left-0 bg-primary/25 transition-[width] duration-200"
                        style={{ width: `${pct}%` }}
                        aria-hidden="true"
                      />
                      <span className="relative flex justify-between">
                        <span>{o.label}</span>
                        <span className="tabular-nums text-muted-foreground">{pct}%</span>
                      </span>
                    </button>
                  );
                })}
                <p className="text-xs text-muted-foreground">
                  {formatCompact(pollTotal)} votes · {timeRemaining(post.poll.endsAt)}
                </p>
              </div>
            ) : null}

            {post.predictionId && !compact ? (
              <Link
                to="/app/predictions/$predictionId"
                params={{ predictionId: post.predictionId }}
                onClick={(e) => e.stopPropagation()}
                className="mt-3 flex items-center gap-3 rounded-[16px] border border-border bg-surface/50 px-4 py-3 transition-colors hover:border-cyan/50"
              >
                <TrendingUp className="size-4 shrink-0 text-cyan" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  Open the linked market
                </span>
                <span className="text-xs text-muted-foreground">View</span>
              </Link>
            ) : null}

            <div className="-ml-2 mt-2.5 flex max-w-[440px] items-center justify-between text-muted-foreground">
              <Action
                icon={MessageCircle}
                label="Reply"
                value={post.replies}
                hoverClass="group-hover:bg-cyan/10 group-hover:text-cyan"
                onClick={stop(() => router.navigate({ to: `/app/post/${post.id}` }))}
              />
              <Action
                icon={Repeat2}
                label="Repost"
                value={post.reposts + (reposted !== post.reposted ? (reposted ? 1 : -1) : 0)}
                active={reposted}
                activeClass="text-success"
                hoverClass="group-hover:bg-success/10 group-hover:text-success"
                onClick={stop(() => {
                  app.toggleRepost(post.id, post.reposted);
                  toast.success(reposted ? "Repost removed" : "Reposted");
                })}
              />
              <Action
                icon={Heart}
                label="Like"
                value={post.likes + (liked !== post.liked ? (liked ? 1 : -1) : 0)}
                active={liked}
                activeClass="text-destructive"
                fill={liked}
                hoverClass="group-hover:bg-destructive/10 group-hover:text-destructive"
                onClick={stop(() => app.toggleLike(post.id, post.liked))}
              />
              <Action
                icon={BarChart2}
                label="Views"
                value={post.views}
                hoverClass="group-hover:bg-primary/10 group-hover:text-primary"
                onClick={stop(() => toast(`${formatCompact(post.views)} views on this post`))}
              />
              <div className="flex items-center">
                <Action
                  icon={Bookmark}
                  label="Bookmark"
                  active={bookmarked}
                  fill={bookmarked}
                  activeClass="text-cyan"
                  hoverClass="group-hover:bg-cyan/10 group-hover:text-cyan"
                  onClick={stop(() => {
                    bookmark.mutate(
                      { postId: post.id, saved: !bookmarked },
                      {
                        onSuccess: () =>
                          toast.success(
                            bookmarked ? "Removed from bookmarks" : "Saved to bookmarks",
                          ),
                      },
                    );
                  })}
                />

                <Action
                  icon={Share2}
                  label="Share"
                  hoverClass="group-hover:bg-cyan/10 group-hover:text-cyan"
                  onClick={stop(() => toast.success("Link copied"))}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function Action({
  icon: Icon,
  label,
  value,
  onClick,
  active,
  activeClass,
  hoverClass,
  fill,
}: {
  icon: typeof Heart;
  label: string;
  value?: number;
  onClick: (e: React.MouseEvent) => void;
  active?: boolean;
  activeClass?: string;
  hoverClass?: string;
  fill?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn("group flex items-center gap-1 text-[13px]", active && activeClass)}
    >
      <span
        className={cn(
          "grid size-8 place-items-center rounded-full transition-colors duration-150",
          hoverClass,
        )}
      >
        <Icon className={cn("size-[17px]", fill && "fill-current")} />
      </span>
      {typeof value === "number" ? (
        <span className="tabular-nums">{value > 0 ? formatCompact(value) : ""}</span>
      ) : null}
    </button>
  );
}
