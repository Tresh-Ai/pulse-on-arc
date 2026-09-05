import { supabase } from "@/integrations/supabase/client";

export type MarketStatus = "open" | "resolved";
export type MarketSide = "yes" | "no";

export interface Market {
  id: string;
  title: string;
  description: string;
  category: string;
  status: MarketStatus;
  closesAt: string;
  createdAt: string;
  resolvedOutcome: MarketSide | null;
  yesPool: number;
  noPool: number;
  pool: number;
  yesPercent: number;
}

export interface Position {
  id: string;
  marketId: string;
  side: MarketSide;
  amount: number;
  createdAt: string;
  market?: Market | undefined;
}

export const marketCategories = [
  "Crypto",
  "Macro",
  "Equities",
  "Commodities",
  "Tech",
  "Culture",
] as const;

interface MarketRow {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
  closes_at: string;
  created_at: string;
  resolved_outcome: string | null;
  yes_pool: number | string;
  no_pool: number | string;
}

const COLUMNS =
  "id, title, description, category, status, closes_at, created_at, resolved_outcome, yes_pool, no_pool";

function toMarket(row: MarketRow): Market {
  const yesPool = Number(row.yes_pool) || 0;
  const noPool = Number(row.no_pool) || 0;
  const pool = yesPool + noPool;
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    category: row.category,
    status: row.status === "resolved" ? "resolved" : "open",
    closesAt: row.closes_at,
    createdAt: row.created_at,
    resolvedOutcome:
      row.resolved_outcome === "yes" || row.resolved_outcome === "no" ? row.resolved_outcome : null,
    yesPool,
    noPool,
    pool,
    yesPercent: pool > 0 ? Math.round((yesPool / pool) * 100) : 50,
  };
}

export interface MarketQuery {
  status?: "open" | "closing" | "resolved" | "all";
  category?: string;
  search?: string;
}

export async function listMarkets(query: MarketQuery = {}): Promise<Market[]> {
  const { status = "all", category = "all", search = "" } = query;

  let request = supabase.from("prediction_markets").select(COLUMNS);

  if (status === "resolved") request = request.eq("status", "resolved");
  if (status === "open" || status === "closing") {
    request = request.eq("status", "open").gt("closes_at", new Date().toISOString());
  }
  if (status === "closing") {
    const soon = new Date(Date.now() + 1000 * 60 * 60 * 24 * 60).toISOString();
    request = request.lt("closes_at", soon);
  }
  if (category !== "all") request = request.eq("category", category);
  if (search.trim()) request = request.ilike("title", `%${search.trim()}%`);

  const { data, error } = await request
    .order("closes_at", { ascending: status === "closing" })
    .limit(60);
  if (error) throw new Error(error.message);
  return (data as unknown as MarketRow[]).map(toMarket);
}

export async function getMarket(id: string): Promise<Market> {
  const { data, error } = await supabase
    .from("prediction_markets")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("That market could not be found.");
  return toMarket(data as unknown as MarketRow);
}

export async function listRelatedMarkets(market: Market): Promise<Market[]> {
  const { data, error } = await supabase
    .from("prediction_markets")
    .select(COLUMNS)
    .eq("category", market.category)
    .neq("id", market.id)
    .limit(3);
  if (error) throw new Error(error.message);
  return (data as unknown as MarketRow[]).map(toMarket);
}

export async function createMarket(input: {
  title: string;
  description: string;
  category: string;
  closesAt: string;
}): Promise<Market> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Sign in to create a market.");

  const { data, error } = await supabase
    .from("prediction_markets")
    .insert({
      title: input.title,
      description: input.description,
      category: input.category,
      closes_at: input.closesAt,
      created_by: auth.user.id,
    })
    .select(COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return toMarket(data as unknown as MarketRow);
}

export async function placePosition(input: {
  marketId: string;
  side: MarketSide;
  amount: number;
  txHash?: string;
  chainId?: number | null;
}): Promise<Position> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Sign in to take a position.");
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error("Enter a stake greater than zero.");
  }

  const { data, error } = await supabase
    .from("prediction_positions")
    .insert({
      market_id: input.marketId,
      user_id: auth.user.id,
      side: input.side,
      amount: input.amount,
      ...(input.txHash ? { tx_hash: input.txHash } : {}),
      ...(input.chainId ? { chain_id: input.chainId } : {}),
    })
    .select("id, market_id, side, amount, created_at")
    .single();
  if (error) throw new Error(error.message);

  const row = data as {
    id: string;
    market_id: string;
    side: string;
    amount: number | string;
    created_at: string;
  };
  return {
    id: row.id,
    marketId: row.market_id,
    side: row.side === "no" ? "no" : "yes",
    amount: Number(row.amount),
    createdAt: row.created_at,
  };
}

export async function listMyPositions(marketId?: string): Promise<Position[]> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return [];

  let request = supabase
    .from("prediction_positions")
    .select(`id, market_id, side, amount, created_at, prediction_markets(${COLUMNS})`)
    .eq("user_id", auth.user.id);
  if (marketId) request = request.eq("market_id", marketId);

  const { data, error } = await request.order("created_at", { ascending: false }).limit(100);
  if (error) throw new Error(error.message);

  return (
    data as unknown as {
      id: string;
      market_id: string;
      side: string;
      amount: number | string;
      created_at: string;
      prediction_markets: MarketRow | null;
    }[]
  ).map((row) => ({
    id: row.id,
    marketId: row.market_id,
    side: row.side === "no" ? "no" : "yes",
    amount: Number(row.amount),
    createdAt: row.created_at,
    market: row.prediction_markets ? toMarket(row.prediction_markets) : undefined,
  }));
}

export interface MarketStats {
  openPositions: number;
  staked: number;
  markets: number;
}

export async function getMyMarketStats(): Promise<MarketStats> {
  const positions = await listMyPositions();
  const openPositions = positions.filter((p) => p.market?.status === "open");
  return {
    openPositions: openPositions.length,
    staked: positions.reduce((sum, p) => sum + p.amount, 0),
    markets: new Set(positions.map((p) => p.marketId)).size,
  };
}
