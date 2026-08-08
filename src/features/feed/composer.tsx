import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Image as ImageIcon, TrendingUp, X } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useCreatePost } from "@/hooks/use-social";
import { postSchema } from "@/lib/validation";
import { avatarUrl } from "@/lib/identity";
import { cn } from "@/lib/utils";

const LIMIT = 1000;

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
  const { session, profile } = useAuth();
  const create = useCreatePost();
  const [value, setValue] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const remaining = LIMIT - value.length;
  const over = remaining < 0;

  if (!session) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Sign in to post, reply and follow accounts on Pulse.
        </p>
        <Button variant="gradient" size="sm" asChild>
          <Link to="/auth/sign-in">Sign in</Link>
        </Button>
      </div>
    );
  }

  const submit = async () => {
    const parsed = postSchema.safeParse({ body: value });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your post.");
      return;
    }
    setError(null);
    try {
      await create.mutateAsync({
        body: parsed.data.body,
        ...(replyToId ? { parentId: replyToId } : {}),
        ...(communityId ? { communityId } : {}),
        ...(predictionId ? { predictionId } : {}),
        ...(imageUrl ? { imageUrl } : {}),
      });
      setValue("");
      setImageUrl(null);
      toast.success(replyToId ? "Reply posted" : "Posted to your followers");
      onDone?.();
    } catch {
      // useCreatePost already surfaces the failure as a toast.
    }
  };

  const displayName = profile?.display_name ?? "You";
  const avatar = profile?.avatar_url ?? avatarUrl(profile?.handle ?? session.user.id);

  const cycleImage = () => {
    const index = imageUrl ? IMAGE_CHOICES.indexOf(imageUrl) + 1 : 0;
    setImageUrl(index >= IMAGE_CHOICES.length ? null : (IMAGE_CHOICES[index] as string));
  };

  return (
    <div className="flex gap-3">
      <Avatar className="size-10 shrink-0">
        <AvatarImage src={avatar} alt="" />
        <AvatarFallback>{displayName.slice(0, 2)}</AvatarFallback>
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
            <img
              src={imageUrl}
              alt=""
              loading="lazy"
              decoding="async"
              className="max-h-72 w-full object-cover"
            />
            <button
              onClick={() => setImageUrl(null)}
              aria-label="Remove image"
              className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-background/80 backdrop-blur"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : null}

        {error ? <p className="mt-1 text-sm text-destructive">{error}</p> : null}

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
            disabled={!value.trim() || over || create.isPending}
            onClick={submit}
          >
            {create.isPending ? "Posting…" : replyToId ? "Reply" : "Post"}
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
