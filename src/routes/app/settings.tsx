import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ColumnHeader, SectionTitle } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useApp } from "@/store/app-store";

export const Route = createFileRoute("/app/settings")({
  head: () => ({
    meta: [
      { title: "Settings | Pulse" },
      { name: "description", content: "Profile details, notifications and privacy controls." },
      { property: "og:title", content: "Settings | Pulse" },
      { property: "og:description", content: "Profile details, notifications and privacy." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const app = useApp();
  const [displayName, setDisplayName] = useState(app.user.displayName);
  const [username, setUsername] = useState(app.user.username);
  const [bio, setBio] = useState(app.user.bio);
  const [prefs, setPrefs] = useState({
    mentions: true,
    marketResolutions: true,
    newFollowers: true,
    weeklyDigest: false,
    privateProfile: false,
    showPositions: true,
  });

  const save = () => {
    app.updateProfile({ displayName, username, bio });
    toast.success("Profile updated");
  };

  return (
    <div>
      <ColumnHeader title="Settings" />

      <div className="px-4 py-4 sm:px-5">
        <SectionTitle>Profile</SectionTitle>
        <div className="mt-3 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="displayName">Display name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="username">Handle</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/[^a-z0-9_]/gi, "").toLowerCase())}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
          </div>
          <Button variant="gradient" onClick={save}>
            Save changes
          </Button>
        </div>
      </div>

      <Separator />

      <div className="px-4 py-4 sm:px-5">
        <SectionTitle>Notifications</SectionTitle>
        <div className="mt-2 divide-y divide-border">
          <ToggleRow
            label="Mentions and replies"
            checked={prefs.mentions}
            onChange={(v) => setPrefs((p) => ({ ...p, mentions: v }))}
          />
          <ToggleRow
            label="Market resolutions"
            checked={prefs.marketResolutions}
            onChange={(v) => setPrefs((p) => ({ ...p, marketResolutions: v }))}
          />
          <ToggleRow
            label="New followers"
            checked={prefs.newFollowers}
            onChange={(v) => setPrefs((p) => ({ ...p, newFollowers: v }))}
          />
          <ToggleRow
            label="Weekly accuracy digest"
            checked={prefs.weeklyDigest}
            onChange={(v) => setPrefs((p) => ({ ...p, weeklyDigest: v }))}
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
            checked={prefs.privateProfile}
            onChange={(v) => setPrefs((p) => ({ ...p, privateProfile: v }))}
          />
          <ToggleRow
            label="Show my market positions"
            hint="Your stake sizes appear on market pages."
            checked={prefs.showPositions}
            onChange={(v) => setPrefs((p) => ({ ...p, showPositions: v }))}
          />
        </div>
      </div>

      <Separator />

      <div className="px-4 py-4 sm:px-5">
        <SectionTitle>Appearance</SectionTitle>
        <p className="mt-2 text-sm text-muted-foreground">
          Pulse uses a single dark surface tuned for long chart sessions.
        </p>
      </div>
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
