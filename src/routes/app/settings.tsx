import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { RequireAuth } from "@/components/common/require-auth";
import { ColumnHeader, SectionTitle } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import {
  DEFAULT_SETTINGS,
  changePassword,
  getMySettings,
  isHandleAvailable,
  updateMySettings,
  type UserSettings,
} from "@/services/settings";
import { fieldErrors, passwordSchema, profileSchema } from "@/lib/validation";

export const Route = createFileRoute("/app/settings")({
  head: () => ({
    meta: [
      { title: "Settings | Pulse" },
      { name: "description", content: "Profile details, notifications and privacy controls." },
      { property: "og:title", content: "Settings | Pulse" },
      { property: "og:description", content: "Profile details, notifications and privacy." },
    ],
  }),
  component: GuardedRoute,
});

function GuardedRoute() {
  return (
    <RequireAuth title="Settings" description="Sign in to manage your account.">
      <SettingsPage />
    </RequireAuth>
  );
}

function SettingsPage() {
  const { profile, updateProfile, authUser, signOut } = useAuth();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    display_name: "",
    handle: "",
    bio: "",
    location: "",
    website: "",
    avatar_url: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!profile) return;
    setForm({
      display_name: profile.display_name ?? "",
      handle: profile.handle ?? "",
      bio: profile.bio ?? "",
      location: profile.location ?? "",
      website: profile.website ?? "",
      avatar_url: profile.avatar_url ?? "",
    });
  }, [profile]);

  const settings = useQuery({ queryKey: ["my-settings"], queryFn: getMySettings });

  const saveProfile = useMutation({
    mutationFn: async () => {
      const parsed = profileSchema.safeParse({
        display_name: form.display_name,
        handle: form.handle,
        bio: form.bio,
      });
      if (!parsed.success) {
        setErrors(fieldErrors(parsed.error));
        throw new Error("Check the highlighted fields.");
      }
      setErrors({});
      if (
        profile &&
        parsed.data.handle !== profile.handle &&
        !(await isHandleAvailable(parsed.data.handle, profile.id))
      ) {
        setErrors({ handle: "That handle is taken." });
        throw new Error("That handle is taken.");
      }
      await updateProfile({
        display_name: parsed.data.display_name,
        handle: parsed.data.handle,
        bio: parsed.data.bio?.length ? parsed.data.bio : null,
        location: form.location.trim() || null,
        website: form.website.trim() || null,
        avatar_url: form.avatar_url.trim() || null,
      });
    },
    onSuccess: () => {
      toast.success("Profile saved");
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
      void queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const savePrefs = useMutation({
    mutationFn: (patch: Partial<UserSettings>) => updateMySettings(patch),
    onMutate: (patch) => {
      queryClient.setQueryData<UserSettings>(["my-settings"], (old) => ({
        ...(old ?? DEFAULT_SETTINGS),
        ...patch,
      }));
    },
    onError: (error: Error) => {
      toast.error(error.message);
      void queryClient.invalidateQueries({ queryKey: ["my-settings"] });
    },
  });

  const [password, setPassword] = useState({ next: "", confirm: "" });
  const updatePassword = useMutation({
    mutationFn: async () => {
      const parsed = passwordSchema.safeParse(password.next);
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Password too weak.");
      if (password.next !== password.confirm) throw new Error("Passwords do not match.");
      await changePassword(password.next);
    },
    onSuccess: () => {
      setPassword({ next: "", confirm: "" });
      toast.success("Password updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const prefs = settings.data ?? DEFAULT_SETTINGS;
  const set = (key: keyof UserSettings) => (value: boolean) => savePrefs.mutate({ [key]: value });

  return (
    <div>
      <ColumnHeader title="Settings" />

      <div className="px-4 py-4 sm:px-5">
        <SectionTitle>Profile</SectionTitle>
        {!profile ? (
          <div className="mt-3 space-y-3">
            <Skeleton className="h-10 w-full bg-elevated" />
            <Skeleton className="h-10 w-full bg-elevated" />
            <Skeleton className="h-20 w-full bg-elevated" />
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            <Field label="Display name" error={errors["display_name"]}>
              <Input
                value={form.display_name}
                onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
              />
            </Field>
            <Field label="Handle" error={errors["handle"]}>
              <Input
                value={form.handle}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    handle: e.target.value.replace(/[^a-z0-9_]/gi, "").toLowerCase(),
                  }))
                }
              />
            </Field>
            <Field label="Bio" error={errors["bio"]}>
              <Textarea
                rows={3}
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Location">
                <Input
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  placeholder="City, country"
                />
              </Field>
              <Field label="Website">
                <Input
                  value={form.website}
                  onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                  placeholder="https://"
                />
              </Field>
            </div>
            <Field label="Profile photo URL">
              <Input
                value={form.avatar_url}
                onChange={(e) => setForm((f) => ({ ...f, avatar_url: e.target.value }))}
                placeholder="https://"
              />
            </Field>
            <Button
              variant="gradient"
              disabled={saveProfile.isPending}
              onClick={() => saveProfile.mutate()}
            >
              {saveProfile.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" /> Saving
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </div>
        )}
      </div>

      <Separator />

      <div className="px-4 py-4 sm:px-5">
        <SectionTitle>Account</SectionTitle>
        <p className="mt-2 text-sm text-muted-foreground">
          Signed in as {authUser?.email ?? "your account"}.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="New password">
            <Input
              type="password"
              autoComplete="new-password"
              value={password.next}
              onChange={(e) => setPassword((p) => ({ ...p, next: e.target.value }))}
            />
          </Field>
          <Field label="Confirm password">
            <Input
              type="password"
              autoComplete="new-password"
              value={password.confirm}
              onChange={(e) => setPassword((p) => ({ ...p, confirm: e.target.value }))}
            />
          </Field>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            variant="secondary"
            disabled={updatePassword.isPending || password.next.length === 0}
            onClick={() => updatePassword.mutate()}
          >
            {updatePassword.isPending ? "Updating" : "Update password"}
          </Button>
          <Button variant="outline" onClick={() => void signOut()}>
            Sign out
          </Button>
        </div>
      </div>

      <Separator />

      <div className="px-4 py-4 sm:px-5">
        <SectionTitle>Notifications</SectionTitle>
        <div className="mt-2 divide-y divide-border">
          <ToggleRow
            label="Mentions and replies"
            checked={prefs.notify_mentions}
            onChange={set("notify_mentions")}
          />
          <ToggleRow
            label="Market resolutions"
            checked={prefs.notify_market_resolutions}
            onChange={set("notify_market_resolutions")}
          />
          <ToggleRow
            label="New followers"
            checked={prefs.notify_new_followers}
            onChange={set("notify_new_followers")}
          />
          <ToggleRow
            label="Weekly accuracy digest"
            checked={prefs.notify_weekly_digest}
            onChange={set("notify_weekly_digest")}
          />
        </div>
      </div>

      <Separator />

      <div className="px-4 py-4 sm:px-5">
        <SectionTitle>Privacy</SectionTitle>
        <div className="mt-2 divide-y divide-border">
          <ToggleRow
            label="Private profile"
            hint="Only approved followers can see your posts."
            checked={prefs.private_profile}
            onChange={set("private_profile")}
          />
          <ToggleRow
            label="Show my market positions"
            hint="Your stake sizes appear on market pages."
            checked={prefs.show_positions}
            onChange={set("show_positions")}
          />
          <ToggleRow
            label="Show my wallet address"
            hint="Displayed on your profile."
            checked={prefs.show_wallet}
            onChange={set("show_wallet")}
          />
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{label}</p>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </div>
  );
}
