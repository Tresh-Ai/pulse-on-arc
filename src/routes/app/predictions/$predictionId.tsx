import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Clock, TrendingUp } from "lucide-react";
import { ErrorState, StatBlock } from "@/components/common/states";
import { MarketCard } from "@/features/markets/market-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { queries } from "@/services/queries";
import { listRelatedMarkets, placePosition, type MarketSide } from "@/services/markets";
import { MARKET_ESCROW_ADDRESS } from "@/lib/arc";
import { useWallet } from "@/features/wallet/wallet-provider";
import { ConnectWalletDialog } from "@/features/wallet/connect-wallet-dialog";
import { useAuth } from "@/hooks/use-auth";
import { cn, formatUsd, timeRemaining } from "@/lib/utils";

export const Route = createFileRoute("/app/predictions/$predictionId")({
  head: () => ({
    meta: [
      { title: "Market | Pulse" },
      { name: "description", content: "Market rules, live pools and your position on Pulse." },
      { property: "og:title", content: "Market | Pulse" },
      {
        property: "og:description",
        content: "Market rules, live pools and your position on Pulse.",
      },
    ],
  }),
  component: MarketDetailPage,
});

function MarketDetailPage() {
  const { predictionId } = Route.useParams();
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const market = useQuery(queries.market(predictionId));
  const positions = useQuery({ ...queries.myPositions(predictionId), enabled: Boolean(session) });

  const [side, setSide] = useState<MarketSide>("yes");
  const [amount, setAmount] = useState("50");
  const [connectOpen, setConnectOpen] = useState(false);
  const wallet = useWallet();

  const stake = useMutation({
    mutationFn: async () => {
      const value = Number(amount);
      if (!wallet.address) throw new Error("Connect a wallet to fund this position.");
      /* Move the stake on-chain first, then record the position with its hash. */
      const txHash = await wallet.send({ to: MARKET_ESCROW_ADDRESS, amount: String(value) });
      const position = await placePosition({
        marketId: predictionId,
        side,
        amount: value,
        txHash,
        chainId: wallet.chainId,
      });
      await wallet.refreshBalance();
      return position;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["market", predictionId] });
      void queryClient.invalidateQueries({ queryKey: ["my-positions"] });
      void queryClient.invalidateQueries({ queryKey: ["my-market-stats"] });
      void queryClient.invalidateQueries({ queryKey: ["markets"] });
      toast.success(`Position placed on ${side.toUpperCase()}`);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const related = useQuery({
    queryKey: ["related-markets", market.data?.id ?? "none"],
    queryFn: () => listRelatedMarkets(market.data!),
    enabled: Boolean(market.data),
  });

  if (market.isPending) {
    return (
      <div className="space-y-3 p-4 sm:p-5">
        <Skeleton className="h-6 w-2/3 bg-elevated" />
        <Skeleton className="h-24 w-full bg-elevated" />
        <Skeleton className="h-32 w-full bg-elevated" />
      </div>
    );
  }

  if (market.isError || !market.data) {
    return (
      <ErrorState
        description="This market could not be loaded."
        onRetry={() => market.refetch()}
      />
    );
  }

  const m = market.data;
  const resolved = m.status === "resolved";
  const myStake = (positions.data ?? []).reduce((sum, p) => sum + p.amount, 0);

  return (
    <div>
      <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-xl sm:px-5">
        <Button variant="ghost" size="icon" asChild className="size-9">
          <Link to="/app/predictions" aria-label="Back to markets">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-bold">Market</p>
          <p className="text-xs text-muted-foreground">{m.category}</p>
        </div>
      </div>

      <div className="border-b border-border p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge className="rounded-full bg-elevated text-[11px] text-foreground">
            {m.category}
          </Badge>
          {resolved ? (
            <span className="font-semibold text-cyan">
              Resolved {m.resolvedOutcome?.toUpperCase() ?? ""}
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Clock className="size-3" /> {timeRemaining(m.closesAt)}
            </span>
          )}
        </div>

        <h1 className="mt-3 text-xl font-bold leading-tight sm:text-2xl">{m.title}</h1>

        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-elevated">
          <div
            className="h-full rounded-full bg-success/80"
            style={{ width: `${m.yesPercent}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-sm tabular-nums">
          <span className="font-semibold text-success">YES {m.yesPercent}%</span>
          <span className="font-semibold text-destructive">NO {100 - m.yesPercent}%</span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <StatBlock label="Total pool" value={formatUsd(m.pool, { compact: true })} />
          <StatBlock label="YES pool" value={formatUsd(m.yesPool, { compact: true })} />
          <StatBlock label="NO pool" value={formatUsd(m.noPool, { compact: true })} />
        </div>
      </div>

      {m.description ? (
        <div className="border-b border-border p-4 sm:p-5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
            Resolution rules
          </h2>
          <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-foreground/90">
            {m.description}
          </p>
        </div>
      ) : null}

      <div className="border-b border-border p-4 sm:p-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Your position
        </h2>

        {!session ? (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <p className="text-sm text-muted-foreground">Sign in to take a position.</p>
            <Button variant="gradient" size="sm" asChild>
              <Link to="/auth/sign-in">Sign in</Link>
            </Button>
          </div>
        ) : resolved ? (
          <p className="mt-3 text-sm text-muted-foreground">
            This market is settled. {myStake > 0 ? `You staked ${formatUsd(myStake)}.` : ""}
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {myStake > 0 ? (
              <p className="text-sm text-muted-foreground">
                Staked so far: <span className="font-semibold text-foreground">{formatUsd(myStake)}</span>
              </p>
            ) : null}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-elevated/50 px-3 py-2 text-sm">
              {wallet.address ? (
                <>
                  <span className="text-muted-foreground">
                    {wallet.walletName ?? "Wallet"} · {wallet.address.slice(0, 6)}…
                    {wallet.address.slice(-4)}
                  </span>
                  <span className="font-semibold tabular-nums">
                    {wallet.balance === null ? "—" : formatUsd(wallet.balance)}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-muted-foreground">
                    Connect your wallet to fund positions.
                  </span>
                  <Button size="sm" variant="outline" onClick={() => setConnectOpen(true)}>
                    Connect wallet
                  </Button>
                </>
              )}
            </div>
            <div className="flex gap-2">
              {(["yes", "no"] as MarketSide[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setSide(s)}
                  className={cn(
                    "flex-1 rounded-2xl border px-4 py-3 text-sm font-bold uppercase transition-colors",
                    side === s
                      ? s === "yes"
                        ? "border-success bg-success/15 text-success"
                        : "border-destructive bg-destructive/15 text-destructive"
                      : "border-border text-muted-foreground hover:bg-elevated/50",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={amount}
                inputMode="decimal"
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Stake"
                className="h-11 rounded-2xl"
              />
              <Button
                variant="gradient"
                className="h-11 px-6"
                disabled={stake.isPending}
                onClick={() => {
                  const value = Number(amount);
                  if (!Number.isFinite(value) || value <= 0) {
                    toast.error("Enter a stake greater than zero.");
                    return;
                  }
                  if (!wallet.address) {
                    setConnectOpen(true);
                    return;
                  }
                  if (wallet.balance !== null && value > wallet.balance) {
                    toast.error("Stake is larger than your wallet balance.");
                    return;
                  }
                  stake.mutate();
                }}
              >
                {stake.isPending ? "Confirm in wallet…" : "Place"}
              </Button>
            </div>
          </div>
        )}
      </div>

      {related.data?.length ? (
        <div>
          <div className="flex items-center gap-2 px-4 py-3 sm:px-5">
            <TrendingUp className="size-4 text-cyan" />
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
              More in {m.category}
            </h2>
          </div>
          {related.data.map((r) => <MarketCard key={r.id} market={r} />)}
        </div>
      ) : null}

      <ConnectWalletDialog open={connectOpen} onOpenChange={setConnectOpen} />
    </div>
  );
}
