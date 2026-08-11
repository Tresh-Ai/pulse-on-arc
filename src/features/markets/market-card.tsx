import { Link } from "@tanstack/react-router";
import { Clock } from "lucide-react";
import type { Market } from "@/services/markets";
import { Badge } from "@/components/ui/badge";
import { cn, formatUsd, timeRemaining } from "@/lib/utils";

export function MarketCard({ market }: { market: Market }) {
  const resolved = market.status === "resolved";
  return (
    <Link
      to="/app/predictions/$predictionId"
      params={{ predictionId: market.id }}
      className="block border-b border-border px-4 py-4 transition-colors hover:bg-elevated/25 sm:px-5"
    >
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge className="rounded-full bg-elevated text-[11px] text-foreground">
          {market.category}
        </Badge>
        {resolved ? (
          <span className="font-semibold text-cyan">
            Resolved {market.resolvedOutcome?.toUpperCase() ?? ""}
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <Clock className="size-3" /> {timeRemaining(market.closesAt)}
          </span>
        )}
      </div>

      <h3 className="mt-2 text-[15px] font-bold leading-snug">{market.title}</h3>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-elevated">
        <div
          className="h-full rounded-full bg-success/80"
          style={{ width: `${market.yesPercent}%` }}
        />
      </div>

      <div className="mt-2 flex items-center gap-4 text-xs tabular-nums">
        <span className="font-semibold text-success">YES {market.yesPercent}%</span>
        <span className={cn("font-semibold text-destructive")}>NO {100 - market.yesPercent}%</span>
        <span className="ml-auto text-muted-foreground">
          {formatUsd(market.pool, { compact: true })} pool
        </span>
      </div>
    </Link>
  );
}
