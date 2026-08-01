import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Clock, Users } from "lucide-react";
import { ColumnHeader, ErrorState, ListSkeleton, SectionTitle } from "@/components/common/states";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AreaTrend } from "@/components/charts";
import { PostCard } from "@/features/feed/post-card";
import { PredictionCard } from "@/features/cards";
import { queries } from "@/services/queries";
import { submitVote } from "@/services/api";
import { useApp } from "@/store/app-store";
import { cn, formatCompact, formatUsd, timeRemaining } from "@/lib/utils";

export const Route = createFileRoute("/app/predictions/$predictionId")({
  head: () => ({
    meta: [
      { title: "Market | Pulse" },
      { name: "description", content: "Market pool, positions, rules and discussion on Pulse." },
      { property: "og:title", content: "Market | Pulse" },
      { property: "og:description", content: "Market pool, positions, rules and discussion." },
    ],
  }),
  component: MarketDetail,
});

function MarketDetail() {
  const { predictionId } = Route.useParams();
  const detail = useQuery(queries.prediction(predictionId));
  const app = useApp();
  const [side, setSide] = useState<"yes" | "no">("yes");
  const [stake, setStake] = useState("100");
  const [pending, setPending] = useState(false);

  if (detail.isPending) {
    return (
      <div>
        <ColumnHeader title="Market" back />
        <ListSkeleton count={3} />
      </div>
    );
  }
  if (detail.isError || !detail.data) {
    return (
      <div>
        <ColumnHeader title="Market" back />
        <ErrorState description="This market is not available." onRetry={() => detail.refetch()} />
      </div>
    );
  }

  const { prediction, discussion, related } = detail.data;
  const myPosition = app.votes[prediction.id] ?? prediction.myPosition;

  const place = async () => {
    const amount = Number(stake);
    setPending(true);
    try {
      const res = await submitVote({ predictionId: prediction.id, side, stake: amount });
      app.recordVote(prediction.id, res.side, res.stake);
      toast.success(`${res.side.toUpperCase()} position of ${formatUsd(res.stake)} placed`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not place that position.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div>
      <ColumnHeader title={prediction.category} back />

      <div className="border-b border-border px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge className="rounded-full bg-elevated text-[11px] text-foreground">
            {prediction.status === "resolved"
              ? `Resolved ${prediction.outcome?.toUpperCase()}`
              : "Open"}
          </Badge>
          <span className="flex items-center gap-1">
            <Clock className="size-3" /> {timeRemaining(prediction.endsAt)}
          </span>
          <span className="flex items-center gap-1">
            <Users className="size-3" /> {formatCompact(prediction.participants)} participants
          </span>
        </div>
        <h1 className="mt-2 text-xl font-bold leading-snug">{prediction.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{prediction.description}</p>

        <div className="mt-4 flex items-center gap-3">
          <Avatar className="size-9">
            <AvatarImage src={prediction.creator.avatar} alt="" />
            <AvatarFallback>{prediction.creator.displayName.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div className="text-sm">
            <p className="font-semibold">{prediction.creator.displayName}</p>
            <p className="text-xs text-muted-foreground">
              created this market · {prediction.creator.predictionAccuracy}% accuracy
            </p>
          </div>
        </div>

        <div className="mt-4 h-[200px]">
          <AreaTrend
            data={prediction.volumeSeries.map((p) => ({ label: p.t, value: p.yes }))}
            xKey="label"
            yKey="value"
          />
        </div>

        <div className="mt-2 grid grid-cols-3 gap-2 text-center text-sm">
          <div className="rounded-[14px] bg-elevated/60 py-3">
            <p className="text-xs text-muted-foreground">YES</p>
            <p className="font-bold text-success tabular-nums">{prediction.yesPercent}%</p>
          </div>
          <div className="rounded-[14px] bg-elevated/60 py-3">
            <p className="text-xs text-muted-foreground">Pool</p>
            <p className="font-bold tabular-nums">
              {formatUsd(prediction.pool, { compact: true })}
            </p>
          </div>
          <div className="rounded-[14px] bg-elevated/60 py-3">
            <p className="text-xs text-muted-foreground">NO</p>
            <p className="font-bold text-destructive tabular-nums">
              {100 - prediction.yesPercent}%
            </p>
          </div>
        </div>
      </div>

      {prediction.status === "resolved" ? null : (
        <div className="border-b border-border px-4 py-4 sm:px-5">
          <SectionTitle>Take a position</SectionTitle>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {(["yes", "no"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSide(s)}
                className={cn(
                  "rounded-[14px] border border-border py-3 text-sm font-bold uppercase transition-colors",
                  side === s
                    ? s === "yes"
                      ? "border-success/60 bg-success/15 text-success"
                      : "border-destructive/60 bg-destructive/15 text-destructive"
                    : "hover:bg-elevated/60",
                )}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <Input
              value={stake}
              inputMode="decimal"
              onChange={(e) => setStake(e.target.value)}
              placeholder="Stake in USDC"
            />
            <Button variant="gradient" onClick={place} disabled={pending}>
              {pending ? "Placing" : "Place"}
            </Button>
          </div>
          {myPosition ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Your position: {myPosition.side.toUpperCase()} · {formatUsd(myPosition.stake)}
            </p>
          ) : null}
        </div>
      )}

      <div className="border-b border-border px-4 py-4 sm:px-5">
        <SectionTitle>Resolution rules</SectionTitle>
        <p className="mt-2 text-sm text-muted-foreground">{prediction.rules}</p>
      </div>

      <div className="border-b border-border px-4 py-4 sm:px-5">
        <SectionTitle>Largest positions</SectionTitle>
        <div className="mt-3 space-y-3">
          {prediction.topParticipants.map((p) => (
            <div key={p.user.id + p.at} className="flex items-center gap-3">
              <Avatar className="size-8">
                <AvatarImage src={p.user.avatar} alt="" />
                <AvatarFallback>{p.user.displayName.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1 truncate text-sm">{p.user.displayName}</span>
              <span
                className={cn(
                  "text-xs font-bold uppercase",
                  p.side === "yes" ? "text-success" : "text-destructive",
                )}
              >
                {p.side}
              </span>
              <span className="text-sm tabular-nums">{formatUsd(p.stake)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-b border-border px-4 py-4 sm:px-5">
        <SectionTitle>Timeline</SectionTitle>
        <ol className="mt-3 space-y-3">
          {prediction.timeline.map((e) => (
            <li key={e.id} className="flex gap-3 text-sm">
              <span className="mt-1.5 size-2 shrink-0 rounded-full bg-cyan" />
              <span>
                <span className="font-semibold">{e.label}</span>
                <span className="block text-xs text-muted-foreground">{e.detail}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className="px-4 py-4 sm:px-5">
        <SectionTitle>Related markets</SectionTitle>
      </div>
      {related.map((p) => (
        <PredictionCard key={p.id} prediction={p} />
      ))}

      <div className="px-4 py-4 sm:px-5">
        <SectionTitle>Discussion</SectionTitle>
      </div>
      {discussion.map((p) => (
        <PostCard key={p.id} post={p} />
      ))}
    </div>
  );
}
