import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ARC_TESTNET,
  discoverWallets,
  ensureNetwork,
  getAccounts,
  getBalance,
  getChainId,
  networkByChainId,
  networkByKey,
  requestAccounts,
  sendNative,
  type ArcNetwork,
  type Eip1193Provider,
  type WalletOption,
} from "@/lib/arc";
import { useAuth } from "@/hooks/use-auth";

export interface WalletTx {
  hash: string;
  to: string;
  amount: string;
  chainId: number;
  at: string;
}

interface WalletState {
  wallets: WalletOption[];
  walletName: string | null;
  walletIcon: string | null;
  address: string | null;
  chainId: number | null;
  network: ArcNetwork | null;
  /** Network the person picked in the UI, even when the wallet is elsewhere. */
  preferred: ArcNetwork;
  balance: number | null;
  connecting: boolean;
  refreshing: boolean;
  transactions: WalletTx[];
  refreshWallets: () => Promise<WalletOption[]>;
  connect: (wallet: WalletOption, network?: ArcNetwork) => Promise<void>;
  disconnect: () => void;
  switchNetwork: (network: ArcNetwork) => Promise<void>;
  refreshBalance: () => Promise<void>;
  send: (input: { to: string; amount: string }) => Promise<string>;
}

const STORAGE_WALLET = "pulse.wallet.id";
const STORAGE_NETWORK = "pulse.wallet.network";
const txKey = (address: string) => `pulse.wallet.tx.${address.toLowerCase()}`;

function readTx(address: string): WalletTx[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(txKey(address)) ?? "[]") as WalletTx[];
  } catch {
    return [];
  }
}

const WalletContext = createContext<WalletState | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { session, profile, updateProfile } = useAuth();
  const providerRef = useRef<Eip1193Provider | null>(null);
  const [wallets, setWallets] = useState<WalletOption[]>([]);
  const [active, setActive] = useState<WalletOption | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<WalletTx[]>([]);
  const [preferred, setPreferred] = useState<ArcNetwork>(ARC_TESTNET);

  const refreshWallets = useCallback(async () => {
    const found = await discoverWallets();
    setWallets(found);
    return found;
  }, []);

  const readState = useCallback(async (provider: Eip1193Provider) => {
    const [addr, chain] = await Promise.all([getAccounts(provider), getChainId(provider)]);
    setAddress(addr);
    setChainId(chain);
    if (addr) {
      setTransactions(readTx(addr));
      try {
        setBalance(await getBalance(provider, addr));
      } catch {
        setBalance(null);
      }
    } else {
      setBalance(null);
    }
  }, []);

  /* Restore the last wallet the person used on this device. */
  useEffect(() => {
    let cancelled = false;
    const saved = window.localStorage.getItem(STORAGE_WALLET);
    const savedNetwork = window.localStorage.getItem(STORAGE_NETWORK);
    if (savedNetwork === "mainnet" || savedNetwork === "testnet") {
      setPreferred(networkByKey(savedNetwork));
    }
    void refreshWallets().then((found) => {
      if (cancelled || !saved) return;
      const match = found.find((w) => w.id === saved);
      if (!match) return;
      providerRef.current = match.provider;
      setActive(match);
      void readState(match.provider);
    });
    return () => {
      cancelled = true;
    };
  }, [refreshWallets, readState]);

  /* Follow account and network changes from the wallet itself. */
  useEffect(() => {
    const provider = active?.provider;
    if (!provider?.on) return;
    const onAccounts = (...args: unknown[]) => {
      const accounts = (args[0] as string[]) ?? [];
      const next = accounts[0] ?? null;
      setAddress(next);
      setTransactions(next ? readTx(next) : []);
      if (next) void getBalance(provider, next).then(setBalance).catch(() => setBalance(null));
      else setBalance(null);
    };
    const onChain = (...args: unknown[]) => {
      const hex = args[0] as string;
      setChainId(Number.parseInt(hex, 16));
      void readState(provider);
    };
    provider.on("accountsChanged", onAccounts);
    provider.on("chainChanged", onChain);
    return () => {
      provider.removeListener?.("accountsChanged", onAccounts);
      provider.removeListener?.("chainChanged", onChain);
    };
  }, [active, readState]);

  const persistAddress = useCallback(
    async (addr: string, chain: number | null) => {
      if (!session) return;
      if (profile?.wallet_address === addr && profile?.wallet_chain_id === chain) return;
      try {
        await updateProfile({ wallet_address: addr, wallet_chain_id: chain });
      } catch {
        /* Profile sync is best effort; the wallet still works. */
      }
    },
    [session, profile?.wallet_address, profile?.wallet_chain_id, updateProfile],
  );

  const connect = useCallback(
    async (wallet: WalletOption, network?: ArcNetwork) => {
      setConnecting(true);
      try {
        const target = network ?? preferred;
        const addr = await requestAccounts(wallet.provider);
        await ensureNetwork(wallet.provider, target);
        providerRef.current = wallet.provider;
        setActive(wallet);
        setPreferred(target);
        window.localStorage.setItem(STORAGE_WALLET, wallet.id);
        window.localStorage.setItem(STORAGE_NETWORK, target.key);
        await readState(wallet.provider);
        await persistAddress(addr, target.chainIdDecimal);
      } finally {
        setConnecting(false);
      }
    },
    [preferred, readState, persistAddress],
  );

  const disconnect = useCallback(() => {
    providerRef.current = null;
    setActive(null);
    setAddress(null);
    setChainId(null);
    setBalance(null);
    setTransactions([]);
    window.localStorage.removeItem(STORAGE_WALLET);
  }, []);

  const switchNetwork = useCallback(
    async (network: ArcNetwork) => {
      setPreferred(network);
      window.localStorage.setItem(STORAGE_NETWORK, network.key);
      const provider = providerRef.current;
      if (!provider) return;
      await ensureNetwork(provider, network);
      await readState(provider);
    },
    [readState],
  );

  const refreshBalance = useCallback(async () => {
    const provider = providerRef.current;
    if (!provider || !address) return;
    setRefreshing(true);
    try {
      setBalance(await getBalance(provider, address));
    } catch {
      setBalance(null);
    } finally {
      setRefreshing(false);
    }
  }, [address]);

  const send = useCallback(
    async ({ to, amount }: { to: string; amount: string }) => {
      const provider = providerRef.current;
      if (!provider || !address) throw new Error("Connect a wallet first.");
      const hash = await sendNative(provider, { from: address, to, amount });
      const record: WalletTx = {
        hash,
        to,
        amount,
        chainId: chainId ?? preferred.chainIdDecimal,
        at: new Date().toISOString(),
      };
      const next = [record, ...readTx(address)].slice(0, 30);
      window.localStorage.setItem(txKey(address), JSON.stringify(next));
      setTransactions(next);
      void refreshBalance();
      return hash;
    },
    [address, chainId, preferred, refreshBalance],
  );

  const value = useMemo<WalletState>(
    () => ({
      wallets,
      walletName: active?.name ?? null,
      walletIcon: active?.icon ?? null,
      address,
      chainId,
      network: networkByChainId(chainId),
      preferred,
      balance,
      connecting,
      refreshing,
      transactions,
      refreshWallets,
      connect,
      disconnect,
      switchNetwork,
      refreshBalance,
      send,
    }),
    [
      wallets,
      active,
      address,
      chainId,
      preferred,
      balance,
      connecting,
      refreshing,
      transactions,
      refreshWallets,
      connect,
      disconnect,
      switchNetwork,
      refreshBalance,
      send,
    ],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletState {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside WalletProvider");
  return ctx;
}
