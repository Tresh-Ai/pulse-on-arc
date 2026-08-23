import { supabase } from "@/integrations/supabase/client";

/** Member notification and privacy switches, stored one row per member. */
export interface UserSettings {
  notify_mentions: boolean;
  notify_market_resolutions: boolean;
  notify_new_followers: boolean;
  notify_weekly_digest: boolean;
  private_profile: boolean;
  show_positions: boolean;
  show_wallet: boolean;
}

export const DEFAULT_SETTINGS: UserSettings = {
  notify_mentions: true,
  notify_market_resolutions: true,
  notify_new_followers: true,
  notify_weekly_digest: false,
  private_profile: false,
  show_positions: true,
  show_wallet: true,
};

const COLUMNS =
  "notify_mentions, notify_market_resolutions, notify_new_followers, notify_weekly_digest, private_profile, show_positions, show_wallet";

async function currentUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("You need to be signed in.");
  return data.user.id;
}

export async function getMySettings(): Promise<UserSettings> {
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from("user_settings")
    .select(COLUMNS)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return { ...DEFAULT_SETTINGS, ...(data ?? {}) } as UserSettings;
}

export async function updateMySettings(patch: Partial<UserSettings>): Promise<UserSettings> {
  const userId = await currentUserId();
  const current = await getMySettings();
  const next = { ...current, ...patch };
  const { error } = await supabase
    .from("user_settings")
    .upsert({ user_id: userId, ...next }, { onConflict: "user_id" });
  if (error) throw new Error(error.message);
  return next;
}

export async function changePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
}

/** Handle availability check used before saving a profile. */
export async function isHandleAvailable(handle: string, selfId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("handle", handle)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return !data || data.id === selfId;
}
