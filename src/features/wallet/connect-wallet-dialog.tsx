import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, ShieldCheck, Wallet } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/features/wallet/wallet-provider";
import { ARC_NETWORKS, networkByKey, type ArcNetwork } from "@/lib/arc";
import { cn } from "@/lib/utils";

/** Modern multi-wallet picker: discovers installed wallets and the target chain. */
export function ConnectWalletDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { wallets, refreshWallets, connect, connecting, preferred } = useWallet();
  const [network, setNetwork] = useState<ArcNetwork>(preferred);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (open) void refreshWallets();
  }, [open, refreshWallets]);

  useEffect(() => setNetwork(preferred), [preferred]);

  const pick = async (id: string) => {
    const wallet = wallets.find((w) => w.id === id);
    if (!wallet) return;
    setBusyId(id);
    try {
      await connect(wallet, network);
      toast.success(`Connected to ${network.chainName}`);
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not connect that wallet.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden border-border/70 bg-card/95 p-0 backdrop-blur sm:max-w-[440px]">
        <div className="bg-gradient-to-br from-primary/15 via-transparent to-cyan/10 px-6 pb-5 pt-6">
          <DialogHeader className="space-y-1.5 text-left">
            <span className="grid size-11 place-items-center rounded-2xl bg-elevated text-cyan">
              <Wallet className="size-5" />
            </span>
            <DialogTitle className="pt-2 text-lg">Connect a wallet</DialogTitle>
            <DialogDescription>
              Pick a network, then approve the request in your wallet. Pulse never holds your keys.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {ARC_NETWORKS.map((n) => (
              <button
                key={n.key}
                type="button"
                disabled={!n.live}
                onClick={() => setNetwork(networkByKey(n.key))}
                className={cn(
                  "rounded-xl border px-3 py-2.5 text-left transition-colors",
                  network.key === n.key
                    ? "border-primary/60 bg-primary/10"
                    : "border-border bg-elevated/60 hover:bg-elevated",
                  !n.live && "cursor-not-allowed opacity-50",
                )}
              >
                <p className="text-sm font-bold">{n.shortName}</p>
                <p className="text-[11px] text-muted-foreground">
                  {n.live ? `Chain ${n.chainIdDecimal}` : "Not open yet"}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2 px-6 pb-4">
          {wallets.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center">
              <p className="text-sm font-semibold">No wallet detected</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Install an EVM wallet such as MetaMask or Rabby, then reopen this dialog.
              </p>
              <Button
                variant="secondary"
                className="mt-3"
                onClick={() => void refreshWallets()}
                disabled={connecting}
              >
                Check again
              </Button>
            </div>
          ) : (
            wallets.map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => void pick(w.id)}
                disabled={busyId !== null}
                className="flex w-full items-center gap-3 rounded-xl border border-border bg-elevated/50 px-3 py-3 text-left transition-colors hover:bg-elevated disabled:opacity-60"
              >
                {w.icon ? (
                  <img src={w.icon} alt="" className="size-8 rounded-lg" loading="lazy" />
                ) : (
                  <span className="grid size-8 place-items-center rounded-lg bg-primary/15 text-primary">
                    <Wallet className="size-4" />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{w.name}</span>
                  <span className="block text-[11px] text-muted-foreground">
                    Detected in this browser
                  </span>
                </span>
                {busyId === w.id ? <Loader2 className="size-4 animate-spin" /> : null}
              </button>
            ))
          )}
        </div>

        <p className="flex items-center gap-2 border-t border-border px-6 py-3 text-[11px] text-muted-foreground">
          <ShieldCheck className="size-3.5 text-success" /> Read-only access to your address and
          balance. Every transfer needs your approval.
        </p>
      </DialogContent>
    </Dialog>
  );
}
