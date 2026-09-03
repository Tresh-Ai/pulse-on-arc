/**
 * Arc network helpers.
 *
 * Everything here runs in the browser against an injected EIP-1193 wallet.
 * Wallets are discovered with EIP-6963 (multi-wallet) and fall back to
 * `window.ethereum`. USDC is the native gas token on Arc.
 */

export interface ArcNetwork {
  key: "testnet" | "mainnet";
  chainIdDecimal: number;
  chainIdHex: string;
  chainName: string;
  shortName: string;
  rpcUrls: string[];
  blockExplorerUrls: string[];
  nativeCurrency: { name: string; symbol: string; decimals: number };
  /** Public mainnet is not open yet, so it is selectable but not connectable. */
  live: boolean;
  faucetUrl?: string;
}

export const ARC_TESTNET: ArcNetwork = {
  key: "testnet",
  chainIdDecimal: 5042002,
  chainIdHex: "0x4CEA52",
  chainName: "Arc Testnet",
  shortName: "Testnet",
  rpcUrls: ["https://rpc.testnet.arc.io"],
  blockExplorerUrls: ["https://testnet.arcscan.app"],
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  live: true,
  faucetUrl: "https://faucet.circle.com",
};

export const ARC_MAINNET: ArcNetwork = {
  key: "mainnet",
  chainIdDecimal: 5042000,
  chainIdHex: "0x4CEA50",
  chainName: "Arc",
  shortName: "Mainnet",
  rpcUrls: ["https://rpc.arc.io"],
  blockExplorerUrls: ["https://arcscan.app"],
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  live: false,
};

export const ARC_NETWORKS: ArcNetwork[] = [ARC_TESTNET, ARC_MAINNET];

export function networkByChainId(chainId: number | null): ArcNetwork | null {
  if (chainId === null) return null;
  return ARC_NETWORKS.find((n) => n.chainIdDecimal === chainId) ?? null;
}

export function networkByKey(key: ArcNetwork["key"]): ArcNetwork {
  return key === "mainnet" ? ARC_MAINNET : ARC_TESTNET;
}

export type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
};

export interface WalletOption {
  /** Reverse-DNS id from EIP-6963, or "injected" for the legacy provider. */
  id: string;
  name: string;
  icon?: string;
  provider: Eip1193Provider;
}

interface Eip6963Detail {
  info: { uuid: string; name: string; icon: string; rdns: string };
  provider: Eip1193Provider;
}

export class ArcWalletError extends Error {}

/**
 * Discover installed browser wallets. Resolves shortly after requesting
 * announcements so late-injecting extensions are still included.
 */
export function discoverWallets(timeoutMs = 400): Promise<WalletOption[]> {
  if (typeof window === "undefined") return Promise.resolve([]);

  return new Promise((resolve) => {
    const found = new Map<string, WalletOption>();

    const onAnnounce = (event: Event) => {
      const detail = (event as CustomEvent<Eip6963Detail>).detail;
      if (!detail?.info || !detail.provider) return;
      found.set(detail.info.rdns, {
        id: detail.info.rdns,
        name: detail.info.name,
        icon: detail.info.icon,
        provider: detail.provider,
      });
    };

    window.addEventListener("eip6963:announceProvider", onAnnounce);
    window.dispatchEvent(new Event("eip6963:requestProvider"));

    window.setTimeout(() => {
      window.removeEventListener("eip6963:announceProvider", onAnnounce);
      if (found.size === 0) {
        const legacy = (window as unknown as { ethereum?: Eip1193Provider }).ethereum;
        if (legacy) {
          found.set("injected", { id: "injected", name: "Browser wallet", provider: legacy });
        }
      }
      resolve([...found.values()]);
    }, timeoutMs);
  });
}

export function hasWallet(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean((window as unknown as { ethereum?: Eip1193Provider }).ethereum);
}

export async function requestAccounts(provider: Eip1193Provider): Promise<string> {
  const accounts = (await provider.request({ method: "eth_requestAccounts" })) as string[];
  const address = accounts?.[0];
  if (!address) throw new ArcWalletError("That wallet returned no account.");
  return address;
}

export async function getAccounts(provider: Eip1193Provider): Promise<string | null> {
  try {
    const accounts = (await provider.request({ method: "eth_accounts" })) as string[];
    return accounts?.[0] ?? null;
  } catch {
    return null;
  }
}

export async function getChainId(provider: Eip1193Provider): Promise<number | null> {
  try {
    const hex = (await provider.request({ method: "eth_chainId" })) as string;
    return Number.parseInt(hex, 16);
  } catch {
    return null;
  }
}

/** Switch the wallet to an Arc network, adding it first when unknown. */
export async function ensureNetwork(provider: Eip1193Provider, network: ArcNetwork) {
  if (!network.live) {
    throw new ArcWalletError(`${network.chainName} is not open to the public yet.`);
  }

  /* Already on the right chain: nothing to prompt. */
  const current = await getChainId(provider);
  if (current === network.chainIdDecimal) return;

  const addChain = async () => {
    await provider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: network.chainIdHex,
          chainName: network.chainName,
          rpcUrls: [...network.rpcUrls],
          blockExplorerUrls: [...network.blockExplorerUrls],
          nativeCurrency: network.nativeCurrency,
        },
      ],
    });
  };

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: network.chainIdHex }],
    });
  } catch (error) {
    const code = (error as { code?: number }).code;
    if (code === 4001) {
      throw new ArcWalletError(`Network switch to ${network.chainName} was rejected.`);
    }
    /* 4902 (and some wallets' -32603) mean the chain is unknown: add it. */
    try {
      await addChain();
    } catch (addError) {
      const addCode = (addError as { code?: number }).code;
      if (addCode === 4001) {
        throw new ArcWalletError(`Adding ${network.chainName} was rejected.`);
      }
      const message =
        (addError as { message?: string }).message ??
        (error as { message?: string }).message ??
        "";
      throw new ArcWalletError(
        message
          ? `Could not switch to ${network.chainName}: ${message}`
          : `Could not switch to ${network.chainName}. Add it manually with chain ID ${network.chainIdDecimal}.`,
      );
    }
  }
}

function fromBaseUnits(value: bigint, decimals: number): number {
  const divisor = 10n ** BigInt(decimals);
  return Number(value / divisor) + Number(value % divisor) / Number(divisor);
}

export function toBaseUnitsHex(amount: string, decimals: number): string {
  const [whole = "0", fraction = ""] = amount.trim().split(".");
  const padded = (fraction + "0".repeat(decimals)).slice(0, decimals);
  const value = BigInt(whole || "0") * 10n ** BigInt(decimals) + BigInt(padded || "0");
  return `0x${value.toString(16)}`;
}

/** Native (USDC) balance of an address, as a decimal number. */
export async function getBalance(
  provider: Eip1193Provider,
  address: string,
  decimals = 18,
): Promise<number> {
  const hex = (await provider.request({
    method: "eth_getBalance",
    params: [address, "latest"],
  })) as string;
  return fromBaseUnits(BigInt(hex), decimals);
}

export async function getTransactionCount(
  provider: Eip1193Provider,
  address: string,
): Promise<number> {
  const hex = (await provider.request({
    method: "eth_getTransactionCount",
    params: [address, "latest"],
  })) as string;
  return Number.parseInt(hex, 16);
}

export function isAddress(value: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(value.trim());
}

/** Send native USDC. Returns the transaction hash from the wallet. */
export async function sendNative(
  provider: Eip1193Provider,
  input: { from: string; to: string; amount: string; decimals?: number },
): Promise<string> {
  if (!isAddress(input.to)) throw new ArcWalletError("Enter a valid 0x wallet address.");
  const value = toBaseUnitsHex(input.amount, input.decimals ?? 18);
  if (value === "0x0") throw new ArcWalletError("Enter an amount above zero.");
  const hash = (await provider.request({
    method: "eth_sendTransaction",
    params: [{ from: input.from, to: input.to.trim(), value }],
  })) as string;
  return hash;
}

export function explorerAddressUrl(network: ArcNetwork, address: string): string {
  return `${network.blockExplorerUrls[0]}/address/${address}`;
}

export function explorerTxUrl(network: ArcNetwork, hash: string): string {
  return `${network.blockExplorerUrls[0]}/tx/${hash}`;
}
