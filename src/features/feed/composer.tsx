import { useState } from "react";
import { Image as ImageIcon, BarChart3, ListChecks, Smile, TrendingUp, X } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useApp } from "@/store/app-store";
import { cn } from "@/lib/utils";

const LIMIT = 280;

function ComposerBody({
  onDone,
  autoFocus,
  placeholder = "What's happening in the markets?",
}: {
  onDone?: () => void;
  autoFocus?: boolean;
  placeholder?: string;
}) {
  const { user } = useApp();
  const [value, setValue] = useState("");
  const [pending, setPending] = useState(false);
  const remaining = LIMIT - value.length;
  const over = remaining < 0;

  const submit = async () => {
    if (!value.trim() || over) return;
    setPending(true);
    await new Promise((r) => setTimeout(r, 500));
    setPending(false);
    setValue("");
    toast.success("Posted to your followers");
    onDone?.();
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
        <div className="mt-2 flex items-center gap-1 border-t border-border pt-3">
          {[ImageIcon, BarChart3, ListChecks, TrendingUp, Smile].map((Icon, i) => (
            <button
              key={i}
              type="button"
              onClick={() => toast("Attachments are mocked in this prototype")}
              className="grid size-9 place-items-center rounded-full text-cyan transition-colors hover:bg-cyan/10"
              aria-label="Add attachment"
            >
              <Icon className="size-[18px]" />
            </button>
          ))}
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
            disabled={!value.trim() || over || pending}
            onClick={submit}
          >
            {pending ? "Posting…" : "Post"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Inline composer that sits at the top of the feed column. */
export function InlineComposer() {
  return (
    <div className="border-b border-border px-4 py-3 sm:px-5">
      <ComposerBody />
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

export function ReplyComposer({ onDone }: { onDone?: () => void }) {
  return (
    <div className="border-b border-border px-4 py-3 sm:px-5">
      <ComposerBody placeholder="Post your reply" {...(onDone ? { onDone } : {})} />
    </div>
  );
}
