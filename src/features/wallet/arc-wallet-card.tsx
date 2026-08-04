import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ExternalLink, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  ARC_TESTNET,
  arcExplorerAddressUrl,
  connectArcWallet,
  getArcBalance,
  getConnectedAddress,
  hasWallet,
} from "@/lib/arc";
import { truncateAddress } from "@/lib/utils";

/**
 * Arc Testnet wallet connection card.
 * Reads the address and native USDC balance straight from the browser wallet.
 * When someone is signed in, the address is stored on their profile.
 */
export function ArcWalletCard() {
  const { session, profile, updateProfile } = useAuth();
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [pending, setPending] = useState(false);

  const readBalance = useCallback(async (addr: string) => {
    try {
      setBalance(await getArcBalance(addr));
    } catch {
      setBalance(null);
    }
  }, []);

  useEffect(() => {
    void getConnectedAddress().then((addr) => {
      if (!addr) return;
      setAddress(addr);
      void readBalance(addr);
    });
  }, [readBalance]);

  const connect = async () => {
    setPending(true);
    try {
      const { address: addr } = await connectArcWallet();
      setAddress(addr);
      await readBalance(addr);
      if (session && profile?.wallet_address !== addr) {
        await updateProfile({ wallet_address: addr });
      }
      toast.success("Connected to Arc Testnet");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not connect wallet.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="border-b border-border px-4 py-5 sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-elevated text-cyan">
            <Wallet className="size-5" />
          </span>
          <div>
            <p className="text-[15px] font-bold">{ARC_TESTNET.chainName}</p>
            <p className="text-xs text-muted-foreground">
              {address
                ? `${truncateAddress(address)} · ${balance === null ? "—" : balance.toFixed(2)} USDC`
                : hasWallet()
                  ? "Connect your wallet to read your on-chain balance"
                  : "No browser wallet detected"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {address ? (
            <a
              href={arcExplorerAddressUrl(address)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-elevated px-3 py-2 text-sm font-medium transition-colors hover:bg-elevated/70"
            >
              Explorer <ExternalLink className="size-3.5" />
            </a>
          ) : null}
          <Button variant={address ? "secondary" : "gradient"} onClick={connect} disabled={pending}>
            {pending ? "Connecting" : address ? "Switch account" : "Connect wallet"}
          </Button>
        </div>
      </div>
    </div>
  );
}
