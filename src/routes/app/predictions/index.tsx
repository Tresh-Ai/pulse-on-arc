import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, TrendingUp } from "lucide-react";
import {
  ColumnHeader,
  EmptyState,
  ErrorState,
  ListSkeleton,
  StatBlock,
  TabStrip,
} from "@/components/common/states";
import { PredictionCard } from "@/features/cards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { queries } from "@/services/queries";
import { predictionCategories } from "@/mock-data/predictions";
import { formatUsd } from "@/lib/utils";
import type { PredictionCategory } from "@/types";

export const Route = createFileRoute("/app/predictions/")({
  head: () => ({
    meta: [
      { title: "Markets | Pulse" },
      {
        name: "description",
        content:
          "Open prediction markets on crypto, macro, culture and tech with transparent pools and public positions.",
      },
      { property: "og:title", content: "Markets | Pulse" },
      {
        property: "og:description",
        content: "Open prediction markets with transparent pools and public positions.",
      },
    ],
  }),
  component: MarketsPage,
});

type Tab = "open" | "closing-soon" | "resolved" | "mine";

const TABS: { id: Tab; label: string }[] = [
  { id: "open", label: "Open" },
  { id: "closing-soon", label: "Closing" },
  { id: "resolved", label: "Resolved" },
  { id: "mine", label: "My positions" },
];

function MarketsPage() {
  const [tab, setTab] = useState<Tab>("open");
  const [category, setCategory] = useState<PredictionCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const status = tab === "mine" ? "all" : tab;
  const markets = useQuery(queries.predictions({ status, category, search }));
  const stats = useQuery(queries.myPredictionStats());

  const list =
    tab === "mine" ? (markets.data ?? []).filter((p) => p.myPosition) : (markets.data ?? []);

  return (
    <div>
      <ColumnHeader
        title="Markets"
        action={
          <Button variant="gradient" size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" /> New market
          </Button>
        }
        tabs={<TabStrip value={tab} onChange={setTab} options={TABS} />}
      />

      <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3 sm:px-5">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search markets"
          className="h-9 max-w-[220px] rounded-full"
        />
        <Select
          value={category}
          onValueChange={(v) => setCategory(v as PredictionCategory | "all")}
        >
          <SelectTrigger className="h-9 w-[180px] rounded-full">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {predictionCategories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {stats.data ? (
        <div className="grid grid-cols-3 gap-2 border-b border-border p-4 sm:px-5">
          <StatBlock label="Open positions" value={String(stats.data.open)} />
          <StatBlock label="Accuracy" value={`${stats.data.accuracy}%`} tone="positive" />
          <StatBlock
            label="Net P&L"
            value={formatUsd(stats.data.netPnl)}
            tone={stats.data.netPnl >= 0 ? "positive" : "negative"}
          />
        </div>
      ) : null}

      {markets.isPending ? <ListSkeleton count={4} /> : null}
      {markets.isError ? (
        <ErrorState description="Markets did not load." onRetry={() => markets.refetch()} />
      ) : null}
      {markets.data && list.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title={tab === "mine" ? "No positions yet" : "No markets match"}
          description={
            tab === "mine"
              ? "Back a thesis in any open market and it will show up here."
              : "Try another category or clear the search."
          }
          actionLabel={tab === "mine" ? "Browse open markets" : "Clear filters"}
          onAction={() => {
            setTab("open");
            setCategory("all");
            setSearch("");
          }}
        />
      ) : null}
      {list.map((p) => (
        <PredictionCard key={p.id} prediction={p} />
      ))}

      <CreateMarketDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

function CreateMarketDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [rules, setRules] = useState("");
  const [category, setCategory] = useState<PredictionCategory>("Crypto");

  const submit = async () => {
    if (!title.trim()) {
      toast.error("A market needs a question.");
      return;
    }
    await queryClient.invalidateQueries();
    toast.success("Market drafted and sent for review");
    setTitle("");
    setRules("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogTitle>Create a market</DialogTitle>
        <div className="space-y-3">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Will PLS settle above 4 dollars before the quarter ends?"
          />
          <Select value={category} onValueChange={(v) => setCategory(v as PredictionCategory)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {predictionCategories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea
            value={rules}
            onChange={(e) => setRules(e.target.value)}
            rows={4}
            placeholder="Resolution rules: the data source, the cut off and what counts as YES."
          />
          <Button variant="gradient" className="w-full" onClick={submit}>
            Submit market
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
