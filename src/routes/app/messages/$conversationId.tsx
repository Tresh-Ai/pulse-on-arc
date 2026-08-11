import { ComingSoon } from "@/components/common/coming-soon";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Send } from "lucide-react";
import { ColumnHeader, ErrorState, ListSkeleton } from "@/components/common/states";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { queries } from "@/services/queries";
import { useApp } from "@/store/app-store";
import { cn, formatRelativeTime } from "@/lib/utils";

export const Route = createFileRoute("/app/messages/$conversationId")({
  head: () => ({
    meta: [
      { title: "Conversation | Pulse" },
      { name: "description", content: "A direct conversation thread on Pulse." },
      { property: "og:title", content: "Conversation | Pulse" },
      { property: "og:description", content: "A direct conversation thread on Pulse." },
    ],
  }),
  component: ComingSoonRoute,
});

function ThreadPage() {
  const { conversationId } = Route.useParams();
  const app = useApp();
  const queryClient = useQueryClient();
  const conversations = useQuery(queries.conversations());
  const thread = useQuery({ ...queries.messages(conversationId), refetchOnMount: "always" });
  const [draft, setDraft] = useState("");

  const conversation = useMemo(
    () => conversations.data?.find((c) => c.id === conversationId),
    [conversations.data, conversationId],
  );

  useEffect(() => {
    app.markConversationRead(conversationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  const send = () => {
    if (!draft.trim()) return;
    app.sendMessage(conversationId, draft.trim());
    setDraft("");
    void queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
    void queryClient.invalidateQueries({ queryKey: ["conversations"] });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <ColumnHeader
        back
        title={conversation?.participant.displayName ?? "Conversation"}
        action={
          conversation ? (
            <Link to="/app/u/$handle" params={{ handle: conversation.participant.username }}>
              <Avatar className="size-8">
                <AvatarImage src={conversation.participant.avatar} alt="" />
                <AvatarFallback>{conversation.participant.displayName.slice(0, 2)}</AvatarFallback>
              </Avatar>
            </Link>
          ) : null
        }
      />

      <div className="flex-1 space-y-3 px-4 py-4 sm:px-5">
        {thread.isPending ? <ListSkeleton count={3} /> : null}
        {thread.isError ? (
          <ErrorState description="This thread did not load." onRetry={() => thread.refetch()} />
        ) : null}
        {thread.data?.map((m) => {
          const mine = m.senderId === app.user.id;
          return (
            <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[78%] rounded-3xl px-4 py-2.5 text-sm",
                  mine ? "gradient-fill text-primary-foreground" : "bg-elevated text-foreground",
                )}
              >
                {m.attachment ? (
                  <img
                    src={m.attachment.url}
                    alt={m.attachment.caption ?? ""}
                    className="mb-2 rounded-2xl"
                    loading="lazy"
                  />
                ) : null}
                <p className="whitespace-pre-wrap">{m.body}</p>
                <p
                  className={cn(
                    "mt-1 text-[10px]",
                    mine ? "text-primary-foreground/70" : "text-muted-foreground",
                  )}
                >
                  {formatRelativeTime(m.at)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="sticky bottom-0 flex gap-2 border-t border-border bg-background/85 p-3 backdrop-blur-xl">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Write a message"
          className="rounded-full"
        />
        <Button variant="gradient" size="icon" aria-label="Send" onClick={send}>
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function ComingSoonRoute() {
  return (
    <ComingSoon eyebrow="Messages" title="Coming soon" description="Direct messages are built and in final testing. You will be able to DM anyone you follow shortly.">
      <ThreadPage />
    </ComingSoon>
  );
}
