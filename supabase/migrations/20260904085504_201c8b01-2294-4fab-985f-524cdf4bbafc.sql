ALTER TABLE public.prediction_positions
  ADD COLUMN IF NOT EXISTS tx_hash text,
  ADD COLUMN IF NOT EXISTS chain_id integer;