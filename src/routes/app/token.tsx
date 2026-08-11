import { ComingSoon } from "@/components/common/coming-soon";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ColumnHeader,
  ErrorState,
  ListSkeleton,
  SectionTitle,
  StatBlock,
} from "@/components/common/states";
import { AreaTrend } from "@/components/charts";
import { queries } from "@/services/queries";
import { cn, formatCompact, formatPercent, formatRelativeTime, formatUsd } from "@/lib/utils";

export const Route = createFileRoute("/app/token")({
  head: () => ({
    meta: [
      { title: "PLS token | Pulse" },
      {
        name: "description",
        content: "PLS price, supply, holders and network utility inside Pulse.",
      },
      { property: "og:title", content: "PLS token | Pulse" },
      { property: "og:description", content: "PLS price, supply, holders and network utility." },
    ],
  }),
  component: ComingSoonRoute,
});

function TokenPage() {
  const token = useQuery(queries.token());

  if (token.isPending) {
    return (
      <div>
        <ColumnHeader title="Token" />
        <ListSkeleton count={3} />
      </div>
    );
  }
  if (token.isError || !token.data) {
    return (
      <div>
        <ColumnHeader title="Token" />
        <ErrorState description="Token data did not load." onRetry={() => token.refetch()} />
      </div>
    );
  }

  const t = token.data;

  return (
    <div>
      <ColumnHeader title={`${t.symbol} token`} />

      <div className="border-b border-border px-4 py-5 sm:px-5">
        <p className="text-sm text-muted-foreground">{t.name}</p>
        <div className="mt-1 flex items-end gap-3">
          <p className="text-3xl font-bold tabular-nums">{formatUsd(t.price)}</p>
          <span
            className={cn(
              "pb-1 text-sm font-semibold tabular-nums",
              t.change24h >= 0 ? "text-success" : "text-destructive",
            )}
          >
            {formatPercent(t.change24h)}
          </span>
        </div>
        <div className="mt-4">
          <AreaTrend
            data={t.series.map((p) => ({ label: p.t, value: p.price }))}
            xKey="label"
            yKey="value"
            height={220}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 border-b border-border p-4 sm:grid-cols-3 sm:px-5">
        <StatBlock label="Market cap" value={formatUsd(t.marketCap, { compact: true })} />
        <StatBlock label="24h volume" value={formatUsd(t.volume24h, { compact: true })} />
        <StatBlock label="Holders" value={formatCompact(t.holders)} />
        <StatBlock label="Circulating" value={formatCompact(t.circulatingSupply)} />
        <StatBlock label="Total supply" value={formatCompact(t.totalSupply)} />
        <StatBlock
          label="Float"
          value={`${((t.circulatingSupply / t.totalSupply) * 100).toFixed(1)}%`}
        />
      </div>

      <div className="border-b border-border px-4 py-4 sm:px-5">
        <SectionTitle>What the token does</SectionTitle>
        <div className="mt-3 space-y-3">
          {t.utility.map((u) => (
            <div key={u.title} className="rounded-[14px] bg-elevated/60 px-4 py-3">
              <p className="text-sm font-bold">{u.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{u.detail}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 sm:px-5">
        <SectionTitle>Network activity</SectionTitle>
      </div>
      {t.activity.map((a) => (
        <div key={a.id} className="border-b border-border px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2">
            <p className="min-w-0 flex-1 truncate text-sm font-semibold">{a.label}</p>
            <span className="shrink-0 text-xs text-muted-foreground">
              {formatRelativeTime(a.at)}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{a.detail}</p>
        </div>
      ))}
    </div>
  );
}

function ComingSoonRoute() {
  return (
    <ComingSoon eyebrow="Token" title="Launch soon" description="The PLS token page goes live with the token launch. Metrics, supply and staking are ready to switch on.">
      <TokenPage />
    </ComingSoon>
  );
}
