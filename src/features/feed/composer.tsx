import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Image as ImageIcon, ListChecks, TrendingUp, X, Plus } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useApp } from "@/store/app-store";
import { cn } from "@/lib/utils";

const LIMIT = 280;

const IMAGE_CHOICES = [
  "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=70",
  "https://images.unsplash.com/photo-1642790106117-e829e14a795f?auto=format&fit=crop&w=1200&q=70",
  "https://images.unsplash.com/photo-1620266757065-5ad4bc0fe2d0?auto=format&fit=crop&w=1200&q=70",
];

function ComposerBody({
  onDone,
  autoFocus,
  replyToId,
  communityId,
  predictionId,
  placeholder = "What's happening in the markets?",
}: {
  onDone?: () => void;
  autoFocus?: boolean;
  replyToId?: string;
  communityId?: string;
  predictionId?: string;
  placeholder?: string;
}) {
  const { user, createPost } = useApp();
  const queryClient = useQueryClient();
  const [value, setValue] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [pollOptions, setPollOptions] = useState<string[] | null>(null);
  const [pending, setPending] = useState(false);

  const remaining = LIMIT - value.length;
  const over = remaining < 0;
  const pollReady = !pollOptions || pollOptions.filter((o) => o.trim()).length >= 2;

  const submit = async () => {
    if (!value.trim() || over || !pollReady) return;
    setPending(true);
    createPost({
      body: value.trim(),
      ...(replyToId ? { replyToId } : {}),
      ...(communityId ? { communityId } : {}),
      ...(predictionId ? { predictionId } : {}),
      ...(imageUrl ? { imageUrl } : {}),
      ...(pollOptions
        ? {
            poll: {
              question: value.trim(),
              options: pollOptions.map((o) => o.trim()).filter(Boolean),
            },
          }
        : {}),
    });
    await queryClient.invalidateQueries();
    setPending(false);
    setValue("");
    setImageUrl(null);
    setPollOptions(null);
    toast.success(replyToId ? "Reply posted" : "Posted to your followers");
    onDone?.();
  };

  const cycleImage = () => {
    const index = imageUrl ? IMAGE_CHOICES.indexOf(imageUrl) + 1 : 0;
    setImageUrl(index >= IMAGE_CHOICES.length ? null : (IMAGE_CHOICES[index] as string));
  };

  return (
    <div className="flex gap-3">
      <Avatar className="size-10 shrink-0">
        <AvatarImage src={user.avatar} alt="" />
        <AvatarFallback>{user.displayName.slice(0, 2)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <textarea
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={3}
          placeholder={placeholder}
          className="w-full resize-none bg-transparent text-[17px] leading-relaxed outline-none placeholder:text-muted-foreground"
        />

        {imageUrl ? (
          <div className="relative mt-2 overflow-hidden rounded-[18px] border border-border">
            <img src={imageUrl} alt="" className="max-h-72 w-full object-cover" loading="lazy" />
            <button
              onClick={() => setImageUrl(null)}
              aria-label="Remove image"
              className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-background/80 backdrop-blur"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : null}

        {pollOptions ? (
          <div className="mt-3 space-y-2 rounded-[18px] border border-border p-3">
            {pollOptions.map((option, i) => (
              <Input
                key={i}
                value={option}
                placeholder={`Choice ${i + 1}`}
                onChange={(e) =>
                  setPollOptions((prev) =>
                    (prev ?? []).map((o, oi) => (oi === i ? e.target.value : o)),
                  )
                }
              />
            ))}
            <div className="flex items-center gap-2">
              {pollOptions.length < 4 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPollOptions((prev) => [...(prev ?? []), ""])}
                >
                  <Plus className="size-4" /> Add choice
                </Button>
              ) : null}
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto text-muted-foreground"
                onClick={() => setPollOptions(null)}
              >
                Remove poll
              </Button>
            </div>
          </div>
        ) : null}

        <div className="mt-2 flex items-center gap-1 border-t border-border pt-3">
          <button
            type="button"
            onClick={cycleImage}
            aria-label="Attach image"
            className="grid size-9 place-items-center rounded-full text-cyan transition-colors hover:bg-cyan/10"
          >
            <ImageIcon className="size-[18px]" />
          </button>
          <button
            type="button"
            onClick={() => setPollOptions((prev) => (prev ? null : ["", ""]))}
            aria-label="Add poll"
            className={cn(
              "grid size-9 place-items-center rounded-full text-cyan transition-colors hover:bg-cyan/10",
              pollOptions && "bg-cyan/10",
            )}
          >
            <ListChecks className="size-[18px]" />
          </button>
          <button
            type="button"
            onClick={() => setValue((v) => `${v}${v && !v.endsWith(" ") ? " " : ""}#markets `)}
            aria-label="Tag a market"
            className="grid size-9 place-items-center rounded-full text-cyan transition-colors hover:bg-cyan/10"
          >
            <TrendingUp className="size-[18px]" />
          </button>

          <span
            className={cn(
              "ml-auto text-xs tabular-nums",
              over ? "text-destructive" : "text-muted-foreground",
            )}
          >
            {remaining}
          </span>
          <Button
            variant="gradient"
            size="sm"
            className="ml-3"
            disabled={!value.trim() || over || pending || !pollReady}
            onClick={submit}
          >
            {pending ? "Posting…" : replyToId ? "Reply" : "Post"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Inline composer that sits at the top of the feed column. */
export function InlineComposer({ communityId }: { communityId?: string }) {
  return (
    <div className="border-b border-border px-4 py-3 sm:px-5">
      <ComposerBody {...(communityId ? { communityId } : {})} />
    </div>
  );
}

/** Modal composer used by the floating action button and the sidebar Post button. */
export function ComposerDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-popover/95 p-0 backdrop-blur-2xl sm:max-w-[600px]">
        <DialogTitle className="sr-only">Create post</DialogTitle>
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <button
            onClick={() => onOpenChange(false)}
            className="grid size-8 place-items-center rounded-full hover:bg-elevated"
            aria-label="Close composer"
          >
            <X className="size-4" />
          </button>
          <span className="text-sm font-semibold">New post</span>
          <span className="w-8" />
        </div>
        <div className="p-4">
          <ComposerBody autoFocus onDone={() => onOpenChange(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ReplyComposer({ replyToId, onDone }: { replyToId: string; onDone?: () => void }) {
  return (
    <div className="border-b border-border px-4 py-3 sm:px-5">
      <ComposerBody
        placeholder="Post your reply"
        replyToId={replyToId}
        {...(onDone ? { onDone } : {})}
      />
    </div>
  );
}
