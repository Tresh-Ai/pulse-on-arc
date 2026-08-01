import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { MessageSquare } from "lucide-react";
import {
  ColumnHeader,
  EmptyState,
  ErrorState,
  ListSkeleton,
} from "@/components/common/states";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { queries } from "@/services/queries";
import { formatRelativeTime } from "@/lib/utils";

export const Route = createFileRoute("/app/messages/")({
  head: () => ({
    meta: [
      { title: "Messages | Pulse" },
      { name: "description", content: "Direct conversations with traders and creators." },
      { property: "og:title", content: "Messages | Pulse" },
      { property: "og:description", content: "Direct conversations with traders and creators." },
    ],
  }),
  component: MessagesPage,
});

function MessagesPage() {
  const conversations = useQuery(queries.conversations());
  const [search, setSearch] = useState("");

  const list = (conversations.data ?? []).filter((c) =>
    search.trim()
      ? `${c.participant.displayName} ${c.participant.username}`
          .toLowerCase()
          .includes(search.toLowerCase())
      : true,
  );

  return (
    <div>
      <ColumnHeader title="Messages" />

      <div className="border-b border-border px-4 py-3 sm:px-5">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search conversations"
          className="h-9 rounded-full"
        />
      </div>

      {conversations.isPending ? <ListSkeleton count={5} /> : null}
      {conversations.isError ? (
        <ErrorState
          description="Conversations did not load."
          onRetry={() => conversations.refetch()}
        />
      ) : null}
      {conversations.data && list.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No conversations"
          description="Message someone from their profile to start a thread."
        />
      ) : null}

      {list.map((c) => (
        <Link
          key={c.id}
          to={"/app/messages/$conversationId" as never}
          params={{ conversationId: c.id } as never}
          className="flex gap-3 border-b border-border px-4 py-3.5 transition-colors hover:bg-elevated/25 sm:px-5"
        >
          <div className="relative shrink-0">
            <Avatar className="size-11">
              <AvatarImage src={c.participant.avatar} alt="" />
              <AvatarFallback>{c.participant.displayName.slice(0, 2)}</AvatarFallback>
            </Avatar>
            {c.participant.online ? (
              <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-background bg-success" />
            ) : null}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-bold">{c.participant.displayName}</p>
              <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                {formatRelativeTime(c.lastAt)}
              </span>
            </div>
            <p className="truncate text-sm text-muted-foreground">
              {c.typing ? "typing…" : c.lastMessage}
            </p>
          </div>
          {c.unread ? (
            <span className="mt-3 grid size-5 shrink-0 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {c.unread}
            </span>
          ) : null}
        </Link>
      ))}
    </div>
  );
}
