import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { MarketCard } from "@/features/markets/market-card";
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
import { createMarket, marketCategories } from "@/services/markets";
import { useAuth } from "@/hooks/use-auth";
import { formatUsd } from "@/lib/utils";

export const Route = createFileRoute("/app/predictions/")({
  head: () => ({
    meta: [
      { title: "Markets | Pulse" },
      {
        name: "description",
        content:
          "Open prediction markets on crypto, macro, equities and commodities with transparent pools.",
      },
      { property: "og:title", content: "Markets | Pulse" },
      {
        property: "og:description",
        content: "Open prediction markets with transparent pools and live positions.",
      },
    ],
  }),
  component: MarketsPage,
});

type Tab = "open" | "closing" | "resolved" | "mine";

const TABS: { id: Tab; label: string }[] = [
  { id: "open", label: "Open" },
  { id: "closing", label: "Closing" },
  { id: "resolved", label: "Resolved" },
  { id: "mine", label: "My positions" },
];

function MarketsPage() {
  const { session } = useAuth();
  const [tab, setTab] = useState<Tab>("open");
  const [category, setCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const markets = useQuery({
    ...queries.markets({ status: tab === "mine" ? "all" : tab, category, search }),
    enabled: tab !== "mine",
  });
  const positions = useQuery({ ...queries.myPositions(), enabled: tab === "mine" });
  const stats = useQuery({ ...queries.myMarketStats(), enabled: Boolean(session) });

  return (
    <div>
      <ColumnHeader
        title="Markets"
        action={
          <Button
            variant="gradient"
            size="sm"
            onClick={() => {
              if (!session) {
                toast.error("Sign in to create a market.");
                return;
              }
              setCreateOpen(true);
            }}
          >
            <Plus className="size-4" /> New market
          </Button>
        }
        tabs={<TabStrip value={tab} onChange={setTab} options={TABS} />}
      />

      {tab !== "mine" ? (
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3 sm:px-5">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search markets"
            className="h-9 max-w-[220px] rounded-full"
          />
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-9 w-[180px] rounded-full">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {marketCategories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {session && stats.data ? (
        <div className="grid grid-cols-3 gap-2 border-b border-border p-4 sm:px-5">
          <StatBlock label="Open positions" value={String(stats.data.openPositions)} />
          <StatBlock label="Markets backed" value={String(stats.data.markets)} />
          <StatBlock label="Total staked" value={formatUsd(stats.data.staked)} tone="positive" />
        </div>
      ) : null}

      {tab === "mine" ? (
        <>
          {!session ? (
            <EmptyState
              icon={TrendingUp}
              title="Sign in to track positions"
              description="Your positions live with your account."
            />
          ) : positions.isPending ? (
            <ListSkeleton count={3} />
          ) : positions.data?.length ? (
            positions.data.map((p) =>
              p.market ? (
                <div key={p.id}>
                  <div className="flex items-center gap-2 border-b border-border bg-elevated/20 px-4 py-2 text-xs sm:px-5">
                    <span
                      className={
                        p.side === "yes"
                          ? "font-bold uppercase text-success"
                          : "font-bold uppercase text-destructive"
                      }
                    >
                      {p.side}
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {formatUsd(p.amount)} staked
                    </span>
                  </div>
                  <MarketCard market={p.market} />
                </div>
              ) : null,
            )
          ) : (
            <EmptyState
              icon={TrendingUp}
              title="No positions yet"
              description="Back a thesis in any open market and it shows up here."
              actionLabel="Browse open markets"
              onAction={() => setTab("open")}
            />
          )}
        </>
      ) : (
        <>
          {markets.isPending ? <ListSkeleton count={4} /> : null}
          {markets.isError ? (
            <ErrorState description="Markets did not load." onRetry={() => markets.refetch()} />
          ) : null}
          {markets.data?.length === 0 ? (
            <EmptyState
              icon={TrendingUp}
              title="No markets match"
              description="Try another category or clear the search."
              actionLabel="Clear filters"
              onAction={() => {
                setCategory("all");
                setSearch("");
              }}
            />
          ) : null}
          {markets.data?.map((m) => (
            <MarketCard key={m.id} market={m} />
          ))}
        </>
      )}

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
  const [category, setCategory] = useState<string>("Crypto");
  const [days, setDays] = useState("30");

  const mutation = useMutation({
    mutationFn: createMarket,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["markets"] });
      toast.success("Market created");
      setTitle("");
      setRules("");
      onOpenChange(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const submit = () => {
    if (title.trim().length < 12) {
      toast.error("Write a clear question of at least 12 characters.");
      return;
    }
    const numberOfDays = Number(days);
    if (!Number.isFinite(numberOfDays) || numberOfDays < 1 || numberOfDays > 365) {
      toast.error("Closing window must be between 1 and 365 days.");
      return;
    }
    mutation.mutate({
      title: title.trim(),
      description: rules.trim(),
      category,
      closesAt: new Date(Date.now() + numberOfDays * 86400000).toISOString(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogTitle>Create a market</DialogTitle>
        <div className="space-y-3">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Will Bitcoin close above $150,000 this year?"
          />
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {marketCategories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={days}
            inputMode="numeric"
            onChange={(e) => setDays(e.target.value)}
            placeholder="Days until it closes"
          />
          <Textarea
            value={rules}
            onChange={(e) => setRules(e.target.value)}
            rows={4}
            placeholder="Resolution rules: the data source, the cut off and what counts as YES."
          />
          <Button
            variant="gradient"
            className="w-full"
            onClick={submit}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Creating" : "Create market"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
