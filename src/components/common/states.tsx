import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ArrowLeft, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "@tanstack/react-router";
import type { ReactNode } from "react";

/**
 * Sticky column header used at the top of every app column.
 * Compact by design: a short label, optional back control and optional tabs.
 * Pages never render long titles or descriptions.
 */
export function ColumnHeader({
  title,
  back,
  tabs,
  action,
  children,
}: {
  title?: string;
  back?: boolean;
  tabs?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
}) {
  const router = useRouter();
  return (
    <div className="sticky top-0 z-30 border-b border-border bg-background/70 backdrop-blur-xl">
      {title || back || action ? (
        <div className="flex h-[53px] items-center gap-4 px-4 sm:px-5">
          {back ? (
            <button
              onClick={() => router.history.back()}
              aria-label="Go back"
              className="-ml-2 grid size-9 shrink-0 place-items-center rounded-full transition-colors hover:bg-elevated"
            >
              <ArrowLeft className="size-[18px]" />
            </button>
          ) : null}
          {title ? <h1 className="truncate text-[17px] font-bold">{title}</h1> : null}
          {action ? <div className="ml-auto shrink-0">{action}</div> : null}
        </div>
      ) : null}
      {tabs}
      {children}
    </div>
  );
}

/** Horizontal segmented tab strip used under column headers. */
export function TabStrip<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { id: T; label: string }[];
}) {
  return (
    <div className="flex overflow-x-auto no-scrollbar" role="tablist">
      {options.map((o) => (
        <button
          key={o.id}
          role="tab"
          aria-selected={value === o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            "relative flex-1 whitespace-nowrap px-4 py-3.5 text-[15px] font-medium transition-colors hover:bg-elevated/40",
            value === o.id ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {o.label}
          {value === o.id ? (
            <span className="absolute inset-x-4 bottom-0 h-1 rounded-full gradient-fill" />
          ) : null}
        </button>
      ))}
    </div>
  );
}

export function SectionCard({
  children,
  className,
  as: Tag = "section",
}: {
  children: ReactNode;
  className?: string;
  as?: "section" | "div" | "article";
}) {
  return <Tag className={cn("surface-card p-5 sm:p-6", className)}>{children}</Tag>;
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-[15px] font-bold">{children}</h2>
      {action}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-elevated text-cyan">
        <Icon className="size-6" />
      </span>
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      {actionLabel && onAction ? (
        <Button variant="gradient" onClick={onAction} className="mt-2">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <h2 className="text-base font-semibold text-destructive">{title}</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        {description ?? "We could not load this view. Try again in a moment."}
      </p>
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry} className="mt-2">
          Try again
        </Button>
      ) : null}
    </div>
  );
}

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-4 border-b border-border px-4 py-4 sm:px-5">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-full bg-elevated" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-32 bg-elevated" />
          <Skeleton className="h-3 w-20 bg-elevated" />
        </div>
      </div>
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-3 bg-elevated"
            style={{ width: `${96 - i * 12}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function ListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="surface-card space-y-3 p-5">
          <Skeleton className="h-4 w-2/3 bg-elevated" />
          <Skeleton className="h-3 w-full bg-elevated" />
          <Skeleton className="h-3 w-4/5 bg-elevated" />
          <Skeleton className="h-16 w-full bg-elevated" />
        </div>
      ))}
    </div>
  );
}

export function StatBlock({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "positive" | "negative";
}) {
  return (
    <div className="rounded-[14px] bg-elevated/60 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 text-lg font-bold tabular-nums",
          tone === "positive" && "text-success",
          tone === "negative" && "text-destructive",
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
