import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  Heart,
  MessageCircle,
  Megaphone,
  TrendingUp,
  UserPlus,
  Users,
  AtSign,
  type LucideIcon,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { queries } from "@/services/queries";
import { useApp } from "@/store/app-store";
import { useShell } from "./shell-context";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { NotificationKind } from "@/types";
import { CardSkeleton, EmptyState, ErrorState } from "@/components/common/states";

export const notificationIcon: Record<NotificationKind, LucideIcon> = {
  like: Heart,
  reply: MessageCircle,
  mention: AtSign,
  follow: UserPlus,
  prediction: TrendingUp,
  community: Users,
  announcement: Megaphone,
};

export function NotificationsDrawer() {
  const { notificationsOpen, setNotificationsOpen } = useShell();
  const { readNotifications, markNotificationsRead } = useApp();
  const q = useQuery(queries.notifications());

  return (
    <Sheet open={notificationsOpen} onOpenChange={setNotificationsOpen}>
      <SheetContent
        side="right"
        className="w-full border-border bg-surface/95 backdrop-blur-2xl sm:max-w-[420px]"
      >
        <SheetHeader className="text-left">
          <SheetTitle className="text-base">Notifications</SheetTitle>
          <SheetDescription className="text-xs">
            Market moves, replies, and network activity.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Latest 10</span>
          <Button variant="ghost" size="sm" onClick={markNotificationsRead}>
            Mark all read
          </Button>
        </div>

        <div className="mt-2 -mx-6 max-h-[calc(100vh-190px)] overflow-y-auto px-2">
          {q.isPending ? (
            <div className="space-y-3 px-4 py-2">
              <CardSkeleton lines={1} />
              <CardSkeleton lines={1} />
            </div>
          ) : null}
          {q.isError ? (
            <div className="px-4">
              <ErrorState description="Notifications did not load." onRetry={() => q.refetch()} />
            </div>
          ) : null}
          {q.data && q.data.length === 0 ? (
            <div className="px-4">
              <EmptyState
                icon={Bell}
                title="All caught up"
                description="Nothing new since your last visit."
              />
            </div>
          ) : null}

          <ul>
            {(q.data ?? []).map((n) => {
              const Icon = notificationIcon[n.kind];
              const unread = !n.read && !readNotifications.has(n.id);
              return (
                <li key={n.id}>
                  <Link
                    to="/app/notifications"
                    onClick={() => setNotificationsOpen(false)}
                    className={cn(
                      "flex gap-3 rounded-[14px] px-4 py-3 transition-colors hover:bg-elevated/60",
                      unread && "bg-primary/5",
                    )}
                  >
                    {n.actor ? (
                      <Avatar className="size-9 shrink-0">
                        <AvatarImage src={n.actor.avatar} alt="" />
                        <AvatarFallback>{n.actor.displayName.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                    ) : (
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-elevated text-cyan">
                        <Icon className="size-4" />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <span className="font-semibold">{n.actor?.displayName ?? "Pulse"}</span>{" "}
                        <span className="text-muted-foreground">{n.title}</span>
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                      <p className="mt-1 text-[11px] text-disabled-foreground">
                        {formatRelativeTime(n.at)}
                      </p>
                    </div>
                    {unread ? <span className="mt-2 size-2 shrink-0 rounded-full bg-cyan" /> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </SheetContent>
    </Sheet>
  );
}
