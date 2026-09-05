import { RequireAuth } from "@/components/common/require-auth";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  AtSign,
  Bell,
  Heart,
  MessageCircle,
  Megaphone,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import {
  ColumnHeader,
  EmptyState,
  ErrorState,
  ListSkeleton,
  TabStrip,
} from "@/components/common/states";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { queries } from "@/services/queries";
import { useMarkNotificationsRead } from "@/hooks/use-social";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { NotificationKind } from "@/types";

export const Route = createFileRoute("/app/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications | Pulse" },
      { name: "description", content: "Replies, mentions, follows and market activity." },
      { property: "og:title", content: "Notifications | Pulse" },
      { property: "og:description", content: "Replies, mentions, follows and market activity." },
    ],
  }),
  component: GuardedRoute,
});

const ICONS: Record<NotificationKind, typeof Heart> = {
  like: Heart,
  reply: MessageCircle,
  mention: AtSign,
  follow: UserPlus,
  prediction: TrendingUp,
  community: Users,
  announcement: Megaphone,
};

type Tab = "all" | "mentions" | "markets";

function NotificationsPage() {
  const [tab, setTab] = useState<Tab>("all");
  const list = useQuery(queries.notifications());
  const markRead = useMarkNotificationsRead();
  const hasUnread = (list.data ?? []).some((n) => !n.read);
  const marked = useRef(false);

  useEffect(() => {
    if (!hasUnread || marked.current) return;
    marked.current = true;
    markRead.mutate(undefined);
  }, [hasUnread, markRead]);


  const items = (list.data ?? []).filter((n) =>
    tab === "mentions"
      ? n.kind === "mention" || n.kind === "reply"
      : tab === "markets"
        ? n.kind === "prediction"
        : true,
  );

  return (
    <div>
      <ColumnHeader
        title="Notifications"
        action={
          <Button variant="ghost" size="sm" onClick={() => markRead.mutate(undefined)}>
            Mark all read
          </Button>
        }
        tabs={
          <TabStrip
            value={tab}
            onChange={setTab}
            options={[
              { id: "all", label: "All" },
              { id: "mentions", label: "Mentions" },
              { id: "markets", label: "Markets" },
            ]}
          />
        }
      />

      {list.isPending ? <ListSkeleton count={6} /> : null}
      {list.isError ? (
        <ErrorState description="Activity did not load." onRetry={() => list.refetch()} />
      ) : null}
      {list.data && items.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Nothing here yet"
          description="Follows, replies and market resolutions will show up in this tab."
        />
      ) : null}

      {items.map((n) => {
        const Icon = ICONS[n.kind];
        const unread = !n.read;
        return (
          <div
            key={n.id}
            className={cn(
              "flex gap-3 border-b border-border px-4 py-3.5 sm:px-5",
              unread && "bg-elevated/25",
            )}
          >
            <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-elevated text-cyan">
              <Icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-2">
                {n.actor ? (
                  <Link to="/app/u/$handle" params={{ handle: n.actor.username }}>
                    <Avatar className="size-6">
                      <AvatarImage src={n.actor.avatar} alt="" />
                      <AvatarFallback>{n.actor.displayName.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                  </Link>
                ) : null}
                <p className="min-w-0 flex-1 text-sm font-semibold">{n.title}</p>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatRelativeTime(n.at)}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function GuardedRoute() {
  return (
    <RequireAuth title="Notifications">
      <NotificationsPage />
    </RequireAuth>
  );
}
