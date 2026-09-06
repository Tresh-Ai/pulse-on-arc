-- Roles
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin','moderator','user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members view their own roles" ON public.user_roles;
CREATE POLICY "Members view their own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Market settlement metadata
ALTER TABLE public.prediction_markets
  ADD COLUMN IF NOT EXISTS fee_bps integer NOT NULL DEFAULT 200,
  ADD COLUMN IF NOT EXISTS resolution_source text,
  ADD COLUMN IF NOT EXISTS resolution_note text,
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz,
  ADD COLUMN IF NOT EXISTS escrow_address text;

-- Payouts ledger
CREATE TABLE IF NOT EXISTS public.market_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id uuid NOT NULL REFERENCES public.prediction_markets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  staked numeric NOT NULL DEFAULT 0,
  amount numeric NOT NULL DEFAULT 0,
  kind text NOT NULL DEFAULT 'win',
  status text NOT NULL DEFAULT 'pending',
  wallet_address text,
  tx_hash text,
  chain_id integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz,
  UNIQUE (market_id, user_id)
);
GRANT SELECT ON public.market_payouts TO authenticated;
GRANT ALL ON public.market_payouts TO service_role;
ALTER TABLE public.market_payouts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members view their own payouts" ON public.market_payouts;
CREATE POLICY "Members view their own payouts" ON public.market_payouts
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Resolve a market and write the payout ledger in one atomic step.
CREATE OR REPLACE FUNCTION public.resolve_market(_market_id uuid, _outcome text, _note text DEFAULT NULL)
RETURNS TABLE (payouts integer, distributed numeric, fee numeric)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE m public.prediction_markets;
  win_pool numeric; lose_pool numeric; fee_amount numeric; net numeric;
  n integer := 0; total numeric := 0;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only an administrator can resolve a market';
  END IF;
  IF _outcome NOT IN ('yes','no') THEN
    RAISE EXCEPTION 'Outcome must be yes or no';
  END IF;

  SELECT * INTO m FROM public.prediction_markets WHERE id = _market_id FOR UPDATE;
  IF m.id IS NULL THEN RAISE EXCEPTION 'Market not found'; END IF;
  IF m.status = 'resolved' THEN RAISE EXCEPTION 'Market is already resolved'; END IF;

  win_pool := CASE WHEN _outcome = 'yes' THEN m.yes_pool ELSE m.no_pool END;
  lose_pool := CASE WHEN _outcome = 'yes' THEN m.no_pool ELSE m.yes_pool END;
  fee_amount := round(lose_pool * coalesce(m.fee_bps, 0) / 10000.0, 6);
  net := lose_pool - fee_amount;

  IF win_pool > 0 THEN
    -- Winners get their stake back plus a pro-rata share of the losing pool.
    INSERT INTO public.market_payouts (market_id, user_id, staked, amount, kind)
    SELECT p.market_id, p.user_id, sum(p.amount),
           round(sum(p.amount) + (sum(p.amount) / win_pool) * net, 6), 'win'
    FROM public.prediction_positions p
    WHERE p.market_id = _market_id AND p.side = _outcome
    GROUP BY p.market_id, p.user_id
    ON CONFLICT (market_id, user_id) DO NOTHING;
  ELSE
    -- Nobody backed the winning side: every stake is refunded in full.
    fee_amount := 0;
    INSERT INTO public.market_payouts (market_id, user_id, staked, amount, kind)
    SELECT p.market_id, p.user_id, sum(p.amount), sum(p.amount), 'refund'
    FROM public.prediction_positions p
    WHERE p.market_id = _market_id
    GROUP BY p.market_id, p.user_id
    ON CONFLICT (market_id, user_id) DO NOTHING;
  END IF;

  SELECT count(*), coalesce(sum(amount), 0) INTO n, total
  FROM public.market_payouts WHERE market_id = _market_id;

  UPDATE public.prediction_markets
  SET status = 'resolved', resolved_outcome = _outcome, resolved_at = now(),
      resolution_note = coalesce(_note, resolution_note)
  WHERE id = _market_id;

  RETURN QUERY SELECT n, total, fee_amount;
END; $$;

REVOKE ALL ON FUNCTION public.resolve_market(uuid, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.resolve_market(uuid, text, text) TO authenticated;

-- Record that a payout was actually sent from the treasury wallet.
CREATE OR REPLACE FUNCTION public.mark_payout_paid(_payout_id uuid, _tx_hash text, _chain_id integer, _wallet_address text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only an administrator can settle payouts';
  END IF;
  IF coalesce(_tx_hash, '') = '' THEN
    RAISE EXCEPTION 'A transaction hash is required';
  END IF;
  UPDATE public.market_payouts
  SET status = 'paid', tx_hash = _tx_hash, chain_id = _chain_id,
      wallet_address = coalesce(_wallet_address, wallet_address), paid_at = now()
  WHERE id = _payout_id AND status <> 'paid';
END; $$;

REVOKE ALL ON FUNCTION public.mark_payout_paid(uuid, text, integer, text) FROM public;
GRANT EXECUTE ON FUNCTION public.mark_payout_paid(uuid, text, integer, text) TO authenticated;

-- Admins need to read every position to audit a settlement.
DROP POLICY IF EXISTS "Admins view all positions" ON public.prediction_positions;
CREATE POLICY "Admins view all positions" ON public.prediction_positions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Positions can no longer be pulled back out once staked.
DROP POLICY IF EXISTS "Members remove their own positions" ON public.prediction_positions;

-- Payout destination for a member: their saved wallet address.
CREATE OR REPLACE VIEW public.payout_queue
WITH (security_invoker = true) AS
SELECT mp.id, mp.market_id, mp.user_id, mp.staked, mp.amount, mp.kind, mp.status,
       mp.tx_hash, mp.chain_id, mp.created_at, mp.paid_at,
       m.title AS market_title, m.resolved_outcome,
       pr.handle, pr.display_name, coalesce(mp.wallet_address, pr.wallet_address) AS destination
FROM public.market_payouts mp
JOIN public.prediction_markets m ON m.id = mp.market_id
LEFT JOIN public.profiles pr ON pr.id = mp.user_id;

GRANT SELECT ON public.payout_queue TO authenticated;
GRANT ALL ON public.payout_queue TO service_role;