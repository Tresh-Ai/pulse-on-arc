import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowDownLeft, ArrowUpRight, Copy, Plus } from "lucide-react";
import { ColumnHeader, ErrorState, ListSkeleton, SectionTitle } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AreaTrend, Sparkline } from "@/components/charts";
import { queries } from "@/services/queries";
import { submitTransfer } from "@/services/api";
import { cn, formatCompact, formatPercent, formatRelativeTime, formatUsd, truncateAddress } from "@/lib/utils";

export const Route = createFileRoute("/app/wallet")({
  head: () => ({
    meta: [
      { title: "Wallet | Pulse" },
      { name: "description", content: "Balances, transfers and transaction history on Pulse." },
      { property: "og:title", content: "Wallet | Pulse" },
      { property: "og:description", content: "Balances, transfers and transaction history." },
    ],
  }),
  component: WalletPage,
});

type Action = "deposit" | "withdraw" | "send";

function WalletPage() {
  const wallet = useQuery(queries.wallet());
  const portfolio = useQuery(queries.portfolioPreview());
  const [action, setAction] = useState<Action | null>(null);

  if (wallet.isPending) {
    return (
      <div>
        <ColumnHeader title="Wallet" />
        <ListSkeleton count={4} />
      </div>
    );
  }
  if (wallet.isError || !wallet.data) {
    return (
      <div>
        <ColumnHeader title="Wallet" />
        <ErrorState description="Wallet did not load." onRetry={() => wallet.refetch()} />
      </div>
    );
  }

  const data = wallet.data;

  return (
    <div>
      <ColumnHeader title="Wallet" />

      <div className="border-b border-border px-4 py-5 sm:px-5">
        <p className="text-sm text-muted-foreground">Total balance</p>
        <p className="mt-1 text-3xl font-bold tabular-nums">{formatUsd(data.totalUsd)}</p>
        <p
          className={cn(
            "mt-1 text-sm font-semibold tabular-nums",
            data.change24h >= 0 ? "text-success" : "text-destructive",
          )}
        >
          {formatPercent(data.change24h)} today
        </p>

        <button
          onClick={() => {
            void navigator.clipboard?.writeText(data.address);
            toast.success("Address copied");
          }}
          className="mt-3 flex items-center gap-2 rounded-full bg-elevated px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          {truncateAddress(data.address)} <Copy className="size-3" />
        </button>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <Button variant="gradient" onClick={() => setAction("deposit")}>
            <Plus className="size-4" /> Deposit
          </Button>
          <Button variant="outline" onClick={() => setAction("send")}>
            <ArrowUpRight className="size-4" /> Send
          </Button>
          <Button variant="outline" onClick={() => setAction("withdraw")}>
            <ArrowDownLeft className="size-4" /> Withdraw
          </Button>
        </div>
      </div>

      {portfolio.data ? (
        <div className="border-b border-border px-4 py-4 sm:px-5">
          <SectionTitle>Portfolio, 30 days</SectionTitle>
          <div className="mt-3">
            <AreaTrend
              data={portfolio.data.series.map((p) => ({ label: p.t, value: p.value }))}
              xKey="label"
              yKey="value"
              height={180}
            />
          </div>
        </div>
      ) : null}

      <div className="px-4 py-4 sm:px-5">
        <SectionTitle>Assets</SectionTitle>
      </div>
      {data.assets.map((a) => (
        <div
          key={a.symbol}
          className="flex items-center gap-3 border-b border-border px-4 py-3.5 sm:px-5"
        >
          <span
            className={cn(
              "grid size-10 shrink-0 place-items-center rounded-full text-xs font-bold",
              a.logoTint === "primary" && "bg-primary/15 text-primary",
              a.logoTint === "cyan" && "bg-cyan/15 text-cyan",
              a.logoTint === "success" && "bg-success/15 text-success",
              a.logoTint === "warning" && "bg-warning/15 text-warning",
            )}
          >
            {a.symbol.slice(0, 3)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{a.name}</p>
            <p className="text-xs text-muted-foreground tabular-nums">
              {formatCompact(a.balance, 2)} {a.symbol}
            </p>
          </div>
          <Sparkline
            series={[1, 1.2, 0.9, 1.4, 1.3, 1.6].map((v) => v * (1 + a.change24h / 100))}
            positive={a.change24h >= 0}
            className="hidden sm:block"
          />
          <div className="text-right">
            <p className="text-sm font-bold tabular-nums">{formatUsd(a.usdValue)}</p>
            <p
              className={cn(
                "text-xs tabular-nums",
                a.change24h >= 0 ? "text-success" : "text-destructive",
              )}
            >
              {formatPercent(a.change24h)}
            </p>
          </div>
        </div>
      ))}

      <div className="px-4 py-4 sm:px-5">
        <SectionTitle>Transactions</SectionTitle>
      </div>
      {data.transactions.map((t) => (
        <div key={t.id} className="flex items-center gap-3 border-b border-border px-4 py-3 sm:px-5">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold capitalize">
              {t.kind} · {t.asset}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {t.counterparty} · {formatRelativeTime(t.at)}
            </p>
          </div>
          <div className="text-right">
            <p
              className={cn(
                "text-sm font-bold tabular-nums",
                t.amount >= 0 ? "text-success" : "text-destructive",
              )}
            >
              {t.amount >= 0 ? "+" : ""}
              {formatCompact(t.amount, 2)} {t.asset}
            </p>
            <p className="text-xs capitalize text-muted-foreground">{t.status}</p>
          </div>
        </div>
      ))}

      <TransferDialog
        action={action}
        onClose={() => setAction(null)}
        symbols={data.assets.map((a) => a.symbol)}
      />
    </div>
  );
}

function TransferDialog({
  action,
  onClose,
  symbols,
}: {
  action: Action | null;
  onClose: () => void;
  symbols: string[];
}) {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [asset, setAsset] = useState(symbols[0] ?? "USDC");
  const [destination, setDestination] = useState("");
  const [pending, setPending] = useState(false);

  const submit = async () => {
    if (!action) return;
    setPending(true);
    try {
      const res = await submitTransfer({
        kind: action,
        asset,
        amount: Number(amount),
        destination,
      });
      toast.success(`${action} confirmed · ${res.hash.slice(0, 10)}`);
      void queryClient.invalidateQueries({ queryKey: ["wallet"] });
      setAmount("");
      setDestination("");
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "That transfer failed.");
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={action !== null} onOpenChange={(v) => (v ? null : onClose())}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogTitle className="capitalize">{action ?? "Transfer"}</DialogTitle>
        <div className="space-y-3">
          <Select value={asset} onValueChange={setAsset}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {symbols.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={amount}
            inputMode="decimal"
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount"
          />
          {action !== "deposit" ? (
            <Input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Destination address or @handle"
            />
          ) : null}
          <Button variant="gradient" className="w-full" onClick={submit} disabled={pending}>
            {pending ? "Confirming" : "Confirm"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
