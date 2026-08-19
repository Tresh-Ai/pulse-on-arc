CREATE TABLE public.user_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  notify_mentions boolean NOT NULL DEFAULT true,
  notify_market_resolutions boolean NOT NULL DEFAULT true,
  notify_new_followers boolean NOT NULL DEFAULT true,
  notify_weekly_digest boolean NOT NULL DEFAULT false,
  private_profile boolean NOT NULL DEFAULT false,
  show_positions boolean NOT NULL DEFAULT true,
  show_wallet boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_settings TO authenticated;
GRANT ALL ON public.user_settings TO service_role;

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view their own settings" ON public.user_settings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Members create their own settings" ON public.user_settings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Members update their own settings" ON public.user_settings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER user_settings_touch_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wallet_chain_id integer;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banner_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS website text;