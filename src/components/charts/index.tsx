import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { theme } from "@/lib/theme";
import { cn } from "@/lib/utils";

/**
 * Standardised chart primitives. Every chart in the product renders through
 * one of these so the visual language stays identical.
 */

const axisProps = {
  stroke: theme.chart.axis,
  tickLine: false,
  axisLine: false,
  tick: { fontSize: 11, fill: "currentColor" },
} as const;

function ChartTooltip() {
  return (
    <Tooltip
      cursor={{ stroke: theme.color.border, strokeWidth: 1 }}
      contentStyle={{
        background: "var(--color-popover)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        fontSize: 12,
        color: "var(--color-popover-foreground)",
        boxShadow: "var(--shadow-soft)",
      }}
      labelStyle={{ color: "var(--color-muted-foreground)", fontSize: 11 }}
    />
  );
}

export function AreaTrend({
  data,
  xKey,
  yKey,
  color = theme.chart.series[0],
  height = 220,
  showAxis = true,
  className,
}: {
  data: Record<string, unknown>[];
  xKey: string;
  yKey: string;
  color?: string;
  height?: number;
  showAxis?: boolean;
  className?: string;
}) {
  const id = `area-${yKey}-${color.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <div className={cn("w-full text-muted-foreground", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.45} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          {showAxis ? <CartesianGrid stroke={theme.chart.grid} vertical={false} /> : null}
          {showAxis ? <XAxis dataKey={xKey} {...axisProps} minTickGap={24} /> : null}
          {showAxis ? <YAxis {...axisProps} width={38} /> : null}
          <ChartTooltip />
          <Area
            type="monotone"
            dataKey={yKey}
            stroke={color}
            strokeWidth={2}
            fill={`url(#${id})`}
            animationDuration={250}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MultiLine({
  data,
  xKey,
  series,
  height = 240,
}: {
  data: Record<string, unknown>[];
  xKey: string;
  series: { key: string; color: string; label: string }[];
  height?: number;
}) {
  return (
    <div className="w-full text-muted-foreground" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={theme.chart.grid} vertical={false} />
          <XAxis dataKey={xKey} {...axisProps} minTickGap={24} />
          <YAxis {...axisProps} width={44} />
          <ChartTooltip />
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2}
              dot={false}
              animationDuration={250}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BarStat({
  data,
  xKey,
  yKey,
  color = theme.chart.series[1],
  height = 200,
}: {
  data: Record<string, unknown>[];
  xKey: string;
  yKey: string;
  color?: string;
  height?: number;
}) {
  return (
    <div className="w-full text-muted-foreground" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={theme.chart.grid} vertical={false} />
          <XAxis dataKey={xKey} {...axisProps} />
          <YAxis {...axisProps} width={38} />
          <ChartTooltip />
          <Bar dataKey={yKey} fill={color} radius={[6, 6, 0, 0]} animationDuration={250} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DonutStat({
  data,
  height = 200,
}: {
  data: { name: string; value: number; color?: string }[];
  height?: number;
}) {
  return (
    <div className="w-full text-muted-foreground" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <ChartTooltip />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="58%"
            outerRadius="86%"
            paddingAngle={3}
            stroke="none"
            animationDuration={250}
          >
            {data.map((entry, i) => (
              <Cell
                key={entry.name}
                fill={entry.color ?? theme.chart.series[i % theme.chart.series.length]}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Tiny inline trend used inside rows, post cards and tickers. */
export function Sparkline({
  series,
  positive,
  className,
}: {
  series: number[];
  positive: boolean;
  className?: string;
}) {
  if (series.length < 2) return null;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const points = series
    .map((v, i) => `${(i / (series.length - 1)) * 100},${32 - ((v - min) / (max - min || 1)) * 28}`)
    .join(" ");
  return (
    <svg
      viewBox="0 0 100 32"
      preserveAspectRatio="none"
      className={cn("h-8 w-24", className)}
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        stroke={positive ? theme.chart.positive : theme.chart.negative}
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
