CREATE TABLE public.prediction_markets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'Crypto',
  status text NOT NULL DEFAULT 'open',
  closes_at timestamp with time zone NOT NULL DEFAULT (now() + interval '30 days'),
  resolved_outcome text,
  yes_pool numeric NOT NULL DEFAULT 0,
  no_pool numeric NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.prediction_markets TO anon;
GRANT SELECT, INSERT, UPDATE ON public.prediction_markets TO authenticated;
GRANT ALL ON public.prediction_markets TO service_role;

ALTER TABLE public.prediction_markets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Markets are publicly viewable" ON public.prediction_markets
  FOR SELECT USING (true);
CREATE POLICY "Members create their own markets" ON public.prediction_markets
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Members update their own markets" ON public.prediction_markets
  FOR UPDATE TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

CREATE TRIGGER prediction_markets_touch_updated_at
  BEFORE UPDATE ON public.prediction_markets
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.prediction_positions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  market_id uuid NOT NULL REFERENCES public.prediction_markets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  side text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.prediction_positions TO authenticated;
GRANT ALL ON public.prediction_positions TO service_role;

ALTER TABLE public.prediction_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view their own positions" ON public.prediction_positions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Members create their own positions" ON public.prediction_positions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Members remove their own positions" ON public.prediction_positions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.validate_position()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE m public.prediction_markets;
BEGIN
  IF NEW.side NOT IN ('yes','no') THEN
    RAISE EXCEPTION 'side must be yes or no';
  END IF;
  IF NEW.amount <= 0 THEN
    RAISE EXCEPTION 'amount must be positive';
  END IF;
  SELECT * INTO m FROM public.prediction_markets WHERE id = NEW.market_id;
  IF m.status <> 'open' OR m.closes_at <= now() THEN
    RAISE EXCEPTION 'market is closed';
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER prediction_positions_validate
  BEFORE INSERT ON public.prediction_positions
  FOR EACH ROW EXECUTE FUNCTION public.validate_position();

CREATE OR REPLACE FUNCTION public.on_position_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    IF NEW.side = 'yes' THEN
      UPDATE public.prediction_markets SET yes_pool = yes_pool + NEW.amount WHERE id = NEW.market_id;
    ELSE
      UPDATE public.prediction_markets SET no_pool = no_pool + NEW.amount WHERE id = NEW.market_id;
    END IF;
    RETURN NEW;
  ELSE
    IF OLD.side = 'yes' THEN
      UPDATE public.prediction_markets SET yes_pool = GREATEST(yes_pool - OLD.amount, 0) WHERE id = OLD.market_id;
    ELSE
      UPDATE public.prediction_markets SET no_pool = GREATEST(no_pool - OLD.amount, 0) WHERE id = OLD.market_id;
    END IF;
    RETURN OLD;
  END IF;
END; $$;

CREATE TRIGGER prediction_positions_change
  AFTER INSERT OR DELETE ON public.prediction_positions
  FOR EACH ROW EXECUTE FUNCTION public.on_position_change();

CREATE INDEX prediction_positions_market_idx ON public.prediction_positions (market_id);
CREATE INDEX prediction_markets_status_idx ON public.prediction_markets (status, closes_at);

INSERT INTO public.prediction_markets (title, description, category, closes_at, yes_pool, no_pool) VALUES
('Will Bitcoin close above $150,000 this year?', 'Resolves YES if BTC/USD closes above $150,000 on a major spot exchange before the closing date.', 'Crypto', now() + interval '120 days', 48200, 31500),
('Will Ethereum ETF inflows top $10B in the next quarter?', 'Cumulative net inflows across US spot ETH ETFs.', 'Crypto', now() + interval '75 days', 22100, 27400),
('Will the Fed cut rates at the next meeting?', 'Resolves YES on a cut of at least 25bps in the target range.', 'Macro', now() + interval '40 days', 65300, 18700),
('Will Nvidia beat earnings expectations again?', 'Resolves YES if reported EPS exceeds consensus.', 'Equities', now() + interval '55 days', 39900, 15200),
('Will Solana outperform Ethereum over 90 days?', 'Measured by percent price change from market open date.', 'Crypto', now() + interval '90 days', 28800, 30100),
('Will gold set a new all-time high this quarter?', 'Spot gold in USD.', 'Commodities', now() + interval '65 days', 17600, 21900),
('Will the S&P 500 end the quarter green?', 'Quarter-over-quarter close comparison.', 'Equities', now() + interval '80 days', 51200, 24800),
('Will a spot XRP ETF be approved this year?', 'Resolves YES on approval by the relevant regulator.', 'Crypto', now() + interval '150 days', 14300, 33600);