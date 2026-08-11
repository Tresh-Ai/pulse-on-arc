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
import { MultiLine } from "@/components/charts";
import { queries } from "@/services/queries";
import { theme } from "@/lib/theme";
import { cn, formatCompact, formatPercent, formatUsd } from "@/lib/utils";

export const Route = createFileRoute("/app/creator")({
  head: () => ({
    meta: [
      { title: "Creator studio | Pulse" },
      {
        name: "description",
        content: "Audience growth, revenue, subscribers and content performance for creators.",
      },
      { property: "og:title", content: "Creator studio | Pulse" },
      { property: "og:description", content: "Audience growth, revenue and content performance." },
    ],
  }),
  component: ComingSoonRoute,
});

function CreatorPage() {
  const stats = useQuery(queries.creatorStats());

  if (stats.isPending) {
    return (
      <div>
        <ColumnHeader title="Creator studio" />
        <ListSkeleton count={3} />
      </div>
    );
  }
  if (stats.isError || !stats.data) {
    return (
      <div>
        <ColumnHeader title="Creator studio" />
        <ErrorState description="Studio data did not load." onRetry={() => stats.refetch()} />
      </div>
    );
  }

  const s = stats.data;

  return (
    <div>
      <ColumnHeader title="Creator studio" />

      <div className="grid grid-cols-2 gap-2 border-b border-border p-4 sm:px-5">
        <StatBlock
          label="Followers"
          value={formatCompact(s.followers)}
          hint={`${formatPercent(s.followerChange)} this month`}
          tone={s.followerChange >= 0 ? "positive" : "negative"}
        />
        <StatBlock
          label="Revenue"
          value={formatUsd(s.revenue)}
          hint={`${formatPercent(s.revenueChange)} this month`}
          tone={s.revenueChange >= 0 ? "positive" : "negative"}
        />
        <StatBlock
          label="Subscribers"
          value={formatCompact(s.subscribers)}
          hint={`${formatPercent(s.subscriberChange)} this month`}
          tone={s.subscriberChange >= 0 ? "positive" : "negative"}
        />
        <StatBlock
          label="Engagement"
          value={`${s.engagementRate}%`}
          hint={`${formatPercent(s.engagementChange)} this month`}
          tone={s.engagementChange >= 0 ? "positive" : "negative"}
        />
      </div>

      <div className="border-b border-border px-4 py-4 sm:px-5">
        <SectionTitle>Audience and revenue</SectionTitle>
        <div className="mt-3">
          <MultiLine
            data={s.audienceSeries.map((p) => ({
              label: p.t,
              followers: p.followers,
              revenue: p.revenue,
            }))}
            xKey="label"
            series={[
              { key: "followers", color: theme.chart.series[0]!, label: "Followers" },
              { key: "revenue", color: theme.chart.series[1]!, label: "Revenue" },
            ]}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 border-b border-border p-4 sm:px-5">
        <StatBlock label="Markets created" value={String(s.predictionsCreated)} />
        <StatBlock label="Resolved" value={String(s.resolvedPredictions)} />
        <StatBlock label="Accuracy" value={`${s.predictionAccuracy}%`} tone="positive" />
      </div>

      <div className="px-4 py-4 sm:px-5">
        <SectionTitle>Top content</SectionTitle>
      </div>
      {s.topContent.map((c) => (
        <div key={c.id} className="border-b border-border px-4 py-3.5 sm:px-5">
          <div className="flex items-start gap-3">
            <p className="min-w-0 flex-1 text-sm font-semibold">{c.title}</p>
            <span className="shrink-0 rounded-full bg-elevated px-2 py-0.5 text-[11px] capitalize text-muted-foreground">
              {c.kind}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground tabular-nums">
            {formatCompact(c.impressions)} impressions ·{" "}
            <span className={cn(c.engagement >= 6 ? "text-success" : "")}>
              {c.engagement}% engagement
            </span>
          </p>
        </div>
      ))}
    </div>
  );
}

function ComingSoonRoute() {
  return (
    <ComingSoon eyebrow="Creator studio" title="Coming soon" description="Audience analytics, earnings and post performance open up for creators in the next release.">
      <CreatorPage />
    </ComingSoon>
  );
}
