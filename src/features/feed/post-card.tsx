import { Heart, MessageCircle, Repeat2, Bookmark, Share2, BadgeCheck, Pin } from "lucide-react";
import { motion } from "motion/react";
import type { Post } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn, formatCompact, formatPercent, formatRelativeTime } from "@/lib/utils";
import { useApp } from "@/store/app-store";
import { toast } from "sonner";

function Sparkline({ series, positive }: { series: number[]; positive: boolean }) {
  const min = Math.min(...series);
  const max = Math.max(...series);
  const points = series
    .map((v, i) => `${(i / (series.length - 1)) * 100},${40 - ((v - min) / (max - min || 1)) * 36}`)
    .join(" ");
  return (
    <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-24 w-full" aria-hidden="true">
      <polyline
        points={points}
        fill="none"
        stroke={positive ? "var(--color-success)" : "var(--color-destructive)"}
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function PostCard({ post }: { post: Post }) {
  const app = useApp();
  const liked = app.isLiked(post.id, post.liked);
  const reposted = app.isReposted(post.id, post.reposted);
  const bookmarked = app.isBookmarked(post.id, post.bookmarked);

  const pollTotal = post.poll?.options.reduce((sum, o) => sum + o.votes, 0) ?? 0;
  const votedOption = post.poll ? app.pollVotes[post.id] : undefined;

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2 }}
      className="surface-card p-5 transition-shadow duration-200 hover:shadow-[var(--shadow-lift)]"
    >
      {post.pinned ? (
        <p className="mb-3 flex items-center gap-1.5 text-xs font-medium text-cyan">
          <Pin className="size-3.5" /> Pinned
        </p>
      ) : null}

      <header className="flex items-start gap-3">
        <Avatar className="size-11">
          <AvatarImage src={post.author.avatar} alt="" />
          <AvatarFallback>{post.author.displayName.slice(0, 2)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="truncate text-sm font-semibold">{post.author.displayName}</span>
            {post.author.verified ? <BadgeCheck className="size-4 shrink-0 text-cyan" /> : null}
            <span className="truncate text-sm text-muted-foreground">@{post.author.username}</span>
            <span className="text-muted-foreground" aria-hidden="true">
              ·
            </span>
            <time className="text-sm text-muted-foreground" dateTime={post.createdAt}>
              {formatRelativeTime(post.createdAt)}
            </time>
          </div>
          {post.kind === "announcement" ? (
            <Badge className="mt-1 bg-primary/20 text-cyan">Announcement</Badge>
          ) : null}
        </div>
      </header>

      <p className="mt-3 text-[15px] leading-relaxed text-subtle-foreground">{post.body}</p>

      {post.imageUrl ? (
        <img
          src={post.imageUrl}
          alt="Post attachment"
          loading="lazy"
          className="mt-4 w-full rounded-[14px] border border-border"
        />
      ) : null}

      {post.chart ? (
        <div className="mt-4 rounded-[14px] bg-elevated/60 p-4">
          <div className="flex items-center justify-between text-sm font-semibold">
            <span>{post.chart.symbol}</span>
            <span className={post.chart.change >= 0 ? "text-success" : "text-destructive"}>
              {formatPercent(post.chart.change)}
            </span>
          </div>
          <Sparkline series={post.chart.series} positive={post.chart.change >= 0} />
        </div>
      ) : null}

      {post.poll ? (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-semibold">{post.poll.question}</p>
          {post.poll.options.map((option) => {
            const share = pollTotal ? Math.round((option.votes / pollTotal) * 100) : 0;
            const chosen = votedOption === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => app.recordPollVote(post.id, option.id)}
                className={cn(
                  "relative w-full overflow-hidden rounded-[14px] bg-elevated/60 px-4 py-2.5 text-left text-sm transition-colors hover:bg-elevated",
                  chosen && "ring-1 ring-cyan",
                )}
                aria-pressed={chosen}
              >
                <span
                  className="gradient-fill absolute inset-y-0 left-0 opacity-25"
                  style={{ width: `${share}%` }}
                  aria-hidden="true"
                />
                <span className="relative flex justify-between">
                  <span>{option.label}</span>
                  <span className="tabular-nums text-muted-foreground">{share}%</span>
                </span>
              </button>
            );
          })}
          <p className="text-xs text-muted-foreground">
            {formatCompact(pollTotal)} votes · closes {formatRelativeTime(post.poll.endsAt)}
          </p>
        </div>
      ) : null}

      {post.tags.length > 0 ? (
        <ul className="mt-4 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <li key={tag}>
              <span className="rounded-full bg-elevated/70 px-2.5 py-1 text-xs text-muted-foreground">
                #{tag}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <footer className="mt-4 flex items-center justify-between text-muted-foreground">
        <button
          type="button"
          onClick={() => app.toggleLike(post.id, post.liked)}
          aria-label={liked ? "Unlike post" : "Like post"}
          aria-pressed={liked}
          className="flex items-center gap-1.5 rounded-full px-2 py-1 text-sm transition-colors hover:text-destructive"
        >
          <Heart className={cn("size-4", liked && "fill-destructive text-destructive")} />
          <span className="tabular-nums">{formatCompact(post.likes + (liked !== post.liked ? (liked ? 1 : -1) : 0))}</span>
        </button>
        <button
          type="button"
          onClick={() => toast("Reply composer opens in the post detail view")}
          aria-label="Reply to post"
          className="flex items-center gap-1.5 rounded-full px-2 py-1 text-sm transition-colors hover:text-cyan"
        >
          <MessageCircle className="size-4" />
          <span className="tabular-nums">{formatCompact(post.replies)}</span>
        </button>
        <button
          type="button"
          onClick={() => app.toggleRepost(post.id, post.reposted)}
          aria-label={reposted ? "Undo repost" : "Repost"}
          aria-pressed={reposted}
          className="flex items-center gap-1.5 rounded-full px-2 py-1 text-sm transition-colors hover:text-success"
        >
          <Repeat2 className={cn("size-4", reposted && "text-success")} />
          <span className="tabular-nums">{formatCompact(post.reposts)}</span>
        </button>
        <button
          type="button"
          onClick={() => app.toggleBookmark(post.id, post.bookmarked)}
          aria-label={bookmarked ? "Remove bookmark" : "Bookmark post"}
          aria-pressed={bookmarked}
          className="rounded-full px-2 py-1 transition-colors hover:text-cyan"
        >
          <Bookmark className={cn("size-4", bookmarked && "fill-cyan text-cyan")} />
        </button>
        <button
          type="button"
          onClick={() => toast.success("Link copied to clipboard")}
          aria-label="Share post"
          className="rounded-full px-2 py-1 transition-colors hover:text-foreground"
        >
          <Share2 className="size-4" />
        </button>
      </footer>
    </motion.article>
  );
}
