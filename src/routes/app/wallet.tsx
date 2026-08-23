import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowUpRight,
  Copy,
  ExternalLink,
  Droplets,
  RefreshCw,
  Wallet as WalletIcon,
} from "lucide-react";
import { ColumnHeader, EmptyState, SectionTitle } from "@/components/common/states";
import { RequireAuth } from "@/components/common/require-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConnectWalletDialog } from "@/features/wallet/connect-wallet-dialog";
import { useWallet } from "@/features/wallet/wallet-provider";
import {
  ARC_NETWORKS,
  explorerAddressUrl,
  explorerTxUrl,
  isAddress,
  networkByChainId,
  type ArcNetwork,
} from "@/lib/arc";
import { cn, formatRelativeTime, truncateAddress } from "@/lib/utils";

export const Route = createFileRoute("/app/wallet")({
  head: () => ({
    meta: [
      { title: "Wallet | Pulse" },
      { name: "description", content: "Connect a wallet and move USDC on the Arc network." },
      { property: "og:title", content: "Wallet | Pulse" },
      { property: "og:description", content: "Balances, transfers and network switching on Arc." },
    ],
  }),
  component: WalletRoute,
});

function WalletRoute() {
  return (
    <RequireAuth title="Wallet">
      <WalletPage />
    </RequireAuth>
  );
}

function WalletPage() {
  const wallet = useWallet();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);

  const network = wallet.network ?? wallet.preferred;
  const onWrongChain = Boolean(
    wallet.address && wallet.chainId !== null && !networkByChainId(wallet.chainId),
  );

  const copy = async () => {
    if (!wallet.address) return;
    await navigator.clipboard.writeText(wallet.address);
    toast.success("Address copied");
  };

  const switchTo = async (next: ArcNetwork) => {
    try {
      await wallet.switchNetwork(next);
      toast.success(`Switched to ${next.chainName}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not switch network");
    }
  };

  return (
    <div>
      <ColumnHeader
        title="Wallet"
        action={
          wallet.address ? (
            <Button variant="outline" size="sm" onClick={() => wallet.disconnect()}>
              Disconnect
            </Button>
          ) : (
            <Button variant="gradient" size="sm" onClick={() => setPickerOpen(true)}>
              Connect
            </Button>
          )
        }
      />

      <div className="px-4 py-4 sm:px-5">
        <div className="flex flex-wrap gap-2">
          {ARC_NETWORKS.map((net) => {
            const active = wallet.preferred.key === net.key;
            return (
              <button
                key={net.key}
                onClick={() => void switchTo(net)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                  active
                    ? "border-primary bg-primary/15 text-foreground"
                    : "border-border text-muted-foreground hover:bg-elevated",
                )}
              >
                {net.chainName}
                {!net.live ? " · soon" : ""}
              </button>
            );
          })}
        </div>

        {!wallet.address ? (
          <div className="mt-4 rounded-2xl border border-border bg-elevated/40 p-6 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-elevated text-muted-foreground">
              <WalletIcon className="size-5" />
            </span>
            <h2 className="mt-4 text-lg font-bold">Connect a wallet</h2>
            <p className="mx-auto mt-2 max-w-[340px] text-sm text-muted-foreground">
              Pulse uses the Arc network, where USDC is the native gas token. Connect to check your
              balance and send transfers.
            </p>
            <Button className="mt-5" variant="gradient" onClick={() => setPickerOpen(true)}>
              Connect wallet
            </Button>
          </div>
        ) : (
          <>
            <div className="mt-4 rounded-2xl border border-border bg-elevated/40 p-5">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{wallet.walletName ?? "Wallet"}</Badge>
                <Badge variant={onWrongChain ? "destructive" : "outline"}>
                  {onWrongChain ? "Unsupported network" : network.chainName}
                </Badge>
              </div>
              <p className="mt-4 text-3xl font-bold tracking-tight">
                {wallet.balance === null ? "—" : wallet.balance.toFixed(4)}{" "}
                <span className="text-base font-semibold text-muted-foreground">USDC</span>
              </p>
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-mono">{truncateAddress(wallet.address)}</span>
                <button onClick={() => void copy()} aria-label="Copy address">
                  <Copy className="size-3.5" />
                </button>
                <a
                  href={explorerAddressUrl(network, wallet.address)}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="View on explorer"
                >
                  <ExternalLink className="size-3.5" />
                </a>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Button variant="gradient" size="sm" onClick={() => setSendOpen(true)}>
                  <ArrowUpRight className="size-4" /> Send
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={wallet.refreshing}
                  onClick={() => void wallet.refreshBalance()}
                >
                  <RefreshCw className={cn("size-4", wallet.refreshing && "animate-spin")} />
                  Refresh
                </Button>
                {network.faucetUrl ? (
                  <Button variant="outline" size="sm" asChild>
                    <a href={network.faucetUrl} target="_blank" rel="noreferrer">
                      <Droplets className="size-4" /> Get test USDC
                    </a>
                  </Button>
                ) : null}
              </div>
            </div>

            <Separator className="my-5" />

            <SectionTitle>Transfers</SectionTitle>
            {wallet.transactions.length === 0 ? (
              <EmptyState
                icon={ArrowUpRight}
                title="No transfers yet"
                body="Transfers you sign from this device show up here with their explorer link."
              />
            ) : (
              <ul className="mt-2 divide-y divide-border">
                {wallet.transactions.map((tx) => {
                  const txNetwork = networkByChainId(tx.chainId) ?? network;
                  return (
                    <li key={tx.hash} className="flex items-center gap-3 py-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-elevated">
                        <ArrowUpRight className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          Sent {tx.amount} USDC to {truncateAddress(tx.to)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatRelativeTime(tx.at)} · {txNetwork.chainName}
                        </p>
                      </div>
                      <a
                        href={explorerTxUrl(txNetwork, tx.hash)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-primary"
                      >
                        View
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </div>

      <ConnectWalletDialog open={pickerOpen} onOpenChange={setPickerOpen} />
      <SendDialog open={sendOpen} onOpenChange={setSendOpen} />
    </div>
  );
}

function SendDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const wallet = useWallet();
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!isAddress(to)) {
      toast.error("Enter a valid 0x wallet address.");
      return;
    }
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Enter an amount above zero.");
      return;
    }
    if (wallet.balance !== null && value > wallet.balance) {
      toast.error("That is more than your balance.");
      return;
    }
    setBusy(true);
    try {
      const hash = await wallet.send({ to, amount });
      toast.success(`Transfer submitted · ${truncateAddress(hash)}`);
      setTo("");
      setAmount("");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The transfer failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Send USDC</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="to">Recipient</Label>
            <Input
              id="to"
              placeholder="0x…"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="amount">Amount (USDC)</Label>
            <Input
              id="amount"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
            />
            {wallet.balance !== null ? (
              <p className="text-xs text-muted-foreground">
                Balance {wallet.balance.toFixed(4)} USDC
              </p>
            ) : null}
          </div>
          <Button variant="gradient" className="w-full" disabled={busy} onClick={() => void submit()}>
            {busy ? "Confirm in your wallet…" : "Send"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
