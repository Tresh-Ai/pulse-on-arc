/**
 * Arc Testnet network helpers.
 *
 * Everything here runs in the browser against an injected EIP-1193 wallet.
 * No backend is involved: we add/switch the Arc Testnet chain, read the
 * connected account and its native balance (USDC is the gas token on Arc).
 */

export const ARC_TESTNET = {
  chainIdDecimal: 5042002,
  chainIdHex: "0x4CEA52",
  chainName: "Arc Testnet",
  rpcUrls: ["https://rpc.testnet.arc.io"],
  blockExplorerUrls: ["https://testnet.arcscan.app"],
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 6 },
} as const;

type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
};

export function getInjectedProvider(): Eip1193Provider | null {
  if (typeof window === "undefined") return null;
  const injected = (window as unknown as { ethereum?: Eip1193Provider }).ethereum;
  return injected ?? null;
}

export function hasWallet(): boolean {
  return getInjectedProvider() !== null;
}

export class ArcWalletError extends Error {}

async function ensureArcNetwork(provider: Eip1193Provider) {
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: ARC_TESTNET.chainIdHex }],
    });
  } catch {
    // Chain unknown to the wallet — add it, then the wallet switches for us.
    await provider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: ARC_TESTNET.chainIdHex,
          chainName: ARC_TESTNET.chainName,
          rpcUrls: [...ARC_TESTNET.rpcUrls],
          blockExplorerUrls: [...ARC_TESTNET.blockExplorerUrls],
          nativeCurrency: ARC_TESTNET.nativeCurrency,
        },
      ],
    });
  }
}

export async function connectArcWallet(): Promise<{ address: string }> {
  const provider = getInjectedProvider();
  if (!provider) {
    throw new ArcWalletError(
      "No browser wallet detected. Install MetaMask or another EVM wallet to connect to Arc Testnet.",
    );
  }
  const accounts = (await provider.request({ method: "eth_requestAccounts" })) as string[];
  const address = accounts?.[0];
  if (!address) throw new ArcWalletError("Wallet returned no account.");
  await ensureArcNetwork(provider);
  return { address };
}

export async function getConnectedAddress(): Promise<string | null> {
  const provider = getInjectedProvider();
  if (!provider) return null;
  try {
    const accounts = (await provider.request({ method: "eth_accounts" })) as string[];
    return accounts?.[0] ?? null;
  } catch {
    return null;
  }
}

/** Native (USDC) balance of an Arc Testnet address, as a decimal number. */
export async function getArcBalance(address: string): Promise<number> {
  const provider = getInjectedProvider();
  if (!provider) return 0;
  const hex = (await provider.request({
    method: "eth_getBalance",
    params: [address, "latest"],
  })) as string;
  const wei = BigInt(hex);
  const divisor = 10n ** BigInt(ARC_TESTNET.nativeCurrency.decimals);
  return Number(wei / divisor) + Number(wei % divisor) / Number(divisor);
}

export function arcExplorerAddressUrl(address: string): string {
  return `${ARC_TESTNET.blockExplorerUrls[0]}/address/${address}`;
}
