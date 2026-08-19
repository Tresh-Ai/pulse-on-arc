import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User as AuthUser } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export interface Profile {
  id: string;
  handle: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  location: string | null;
  website: string | null;
  wallet_address: string | null;
  wallet_chain_id: number | null;
}


interface AuthState {
  session: Session | null;
  authUser: AuthUser | null;
  profile: Profile | null;
  loading: boolean;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (input: {
    email: string;
    password: string;
    displayName?: string;
    handle?: string;
  }) => Promise<{ needsConfirmation: boolean }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (patch: Partial<Omit<Profile, "id">>) => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("id, handle, display_name, bio, avatar_url, wallet_address")
      .eq("id", userId)
      .maybeSingle();
    setProfile((data as Profile | null) ?? null);
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (next?.user) void loadProfile(next.user.id);
      else setProfile(null);
    });
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) void loadProfile(data.session.user.id);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  const value = useMemo<AuthState>(
    () => ({
      session,
      authUser: session?.user ?? null,
      profile,
      loading,
      signInWithPassword: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error(error.message);
      },
      signUpWithPassword: async ({ email, password, displayName, handle }) => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              ...(displayName ? { display_name: displayName } : {}),
              ...(handle ? { handle } : {}),
            },
          },
        });
        if (error) throw new Error(error.message);
        return { needsConfirmation: !data.session };
      },
      signInWithGoogle: async () => {
        const result = await lovable.auth.signInWithOAuth("google", {
          redirect_uri: window.location.origin,
        });
        if (result.error) throw new Error(result.error.message);
      },
      signOut: async () => {
        await supabase.auth.signOut();
        setProfile(null);
      },
      refreshProfile: async () => {
        if (session?.user) await loadProfile(session.user.id);
      },
      updateProfile: async (patch) => {
        if (!session?.user) throw new Error("You need to be signed in.");
        const { error } = await supabase.from("profiles").update(patch).eq("id", session.user.id);
        if (error) throw new Error(error.message);
        await loadProfile(session.user.id);
      },
    }),
    [session, profile, loading, loadProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
