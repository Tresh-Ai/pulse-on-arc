import { supabase } from "@/integrations/supabase/client";

/**
 * Settlement: how a market turns into money moving.
 *
 * 1. Staking escrows funds. Placing a position sends the stake from the
 *    member's wallet to the escrow address, and the position row stores the
 *    transaction hash, so every pool number is backed by an on-chain transfer.
 * 2. Resolution is a single trusted step. `resolve_market` runs in the
 *    database, is admin-only, cannot run twice, and writes the payout ledger
 *    atomically with the market status.
 * 3. Payout maths is parimutuel. Winners get their stake back plus a
 *    pro-rata share of the losing pool after the platform fee. If nobody
 *    backed the winning side, every stake is refunded in full.
 * 4. Paying out is recorded. An admin sends each payout from the treasury
 *    wallet and `mark_payout_paid` stores the transaction hash, so the ledger
 *    is auditable and a payout can never be marked paid without a transfer.
 */

export type PayoutStatus = "pending" | "paid";

export interface Payout {
  id: string;
  marketId: string;
  marketTitle: string;
  outcome: "yes" | "no" | null;
  staked: number;
  amount: number;
  kind: "win" | "refund";
  status: PayoutStatus;
  txHash: string | null;
  createdAt: string;
  paidAt: string | null;
  /** Only present for admins working the queue. */
  destination?: string | null;
  handle?: string | null;
  displayName?: string | null;
}

interface QueueRow {
  id: string;
  market_id: string;
  market_title: string | null;
  resolved_outcome: string | null;
  staked: number | string;
  amount: number | string;
  kind: string;
  status: string;
  tx_hash: string | null;
  created_at: string;
  paid_at: string | null;
  destination: string | null;
  handle: string | null;
  display_name: string | null;
}

function toPayout(row: QueueRow): Payout {
  return {
    id: row.id,
    marketId: row.market_id,
    marketTitle: row.market_title ?? "Market",
    outcome: row.resolved_outcome === "yes" || row.resolved_outcome === "no" ? row.resolved_outcome : null,
    staked: Number(row.staked) || 0,
    amount: Number(row.amount) || 0,
    kind: row.kind === "refund" ? "refund" : "win",
    status: row.status === "paid" ? "paid" : "pending",
    txHash: row.tx_hash,
    createdAt: row.created_at,
    paidAt: row.paid_at,
    destination: row.destination,
    handle: row.handle,
    displayName: row.display_name,
  };
}

const QUEUE_COLUMNS =
  "id, market_id, market_title, resolved_outcome, staked, amount, kind, status, tx_hash, created_at, paid_at, destination, handle, display_name";

export async function isAdmin(): Promise<boolean> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return false;
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", auth.user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (error) return false;
  return Boolean(data);
}

/** Every payout owed to the signed-in member. */
export async function listMyPayouts(): Promise<Payout[]> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return [];
  const { data, error } = await supabase
    .from("payout_queue")
    .select(QUEUE_COLUMNS)
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  return (data as unknown as QueueRow[]).map(toPayout);
}

/** Admin view: everything still waiting to be sent from the treasury. */
export async function listPayoutQueue(status: PayoutStatus | "all" = "pending"): Promise<Payout[]> {
  let request = supabase.from("payout_queue").select(QUEUE_COLUMNS);
  if (status !== "all") request = request.eq("status", status);
  const { data, error } = await request.order("created_at", { ascending: true }).limit(200);
  if (error) throw new Error(error.message);
  return (data as unknown as QueueRow[]).map(toPayout);
}

export async function resolveMarket(input: {
  marketId: string;
  outcome: "yes" | "no";
  note?: string;
}): Promise<{ payouts: number; distributed: number; fee: number }> {
  const { data, error } = await supabase.rpc("resolve_market", {
    _market_id: input.marketId,
    _outcome: input.outcome,
    _note: input.note ?? null,
  });
  if (error) throw new Error(error.message);
  const row = (data as unknown as { payouts: number; distributed: number; fee: number }[] | null)?.[0];
  return {
    payouts: Number(row?.payouts ?? 0),
    distributed: Number(row?.distributed ?? 0),
    fee: Number(row?.fee ?? 0),
  };
}

export async function markPayoutPaid(input: {
  payoutId: string;
  txHash: string;
  chainId: number | null;
  walletAddress?: string | null;
}): Promise<void> {
  const { error } = await supabase.rpc("mark_payout_paid", {
    _payout_id: input.payoutId,
    _tx_hash: input.txHash,
    _chain_id: input.chainId,
    _wallet_address: input.walletAddress ?? null,
  });
  if (error) throw new Error(error.message);
}

/**
 * What a stake would return if that side wins, using the pools as they stand.
 * Same parimutuel formula the database uses on resolution.
 */
export function estimatePayout(input: {
  stake: number;
  side: "yes" | "no";
  yesPool: number;
  noPool: number;
  feeBps: number;
}): { payout: number; profit: number; multiple: number } {
  const { stake, side, yesPool, noPool, feeBps } = input;
  if (!Number.isFinite(stake) || stake <= 0) return { payout: 0, profit: 0, multiple: 1 };
  const winPool = (side === "yes" ? yesPool : noPool) + stake;
  const losePool = side === "yes" ? noPool : yesPool;
  const net = losePool - (losePool * feeBps) / 10_000;
  const payout = stake + (stake / winPool) * net;
  return { payout, profit: payout - stake, multiple: payout / stake };
}
