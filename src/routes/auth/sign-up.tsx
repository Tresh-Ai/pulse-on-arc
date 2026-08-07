import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandMark } from "@/components/brand";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/auth/sign-up")({
  head: () => ({
    meta: [
      { title: "Create an account | Pulse" },
      { name: "description", content: "Create a Pulse account and start building a track record." },
      { property: "og:title", content: "Create an account | Pulse" },
      { property: "og:description", content: "Create a Pulse account." },
    ],
  }),
  component: SignUpPage,
});

function SignUpPage() {
  const navigate = useNavigate();
  const { signUpWithPassword, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [handle, setHandle] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    try {
      const { needsConfirmation } = await signUpWithPassword({
        email,
        password,
        handle,
        displayName: handle,
      });
      if (needsConfirmation) {
        toast.success("Check your email to confirm your account.");
      } else {
        void navigate({ to: "/app" });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create that account.");
    } finally {
      setPending(false);
    }
  };

  const google = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Google sign-in failed.");
    }
  };

  return (
    <div className="relative grid min-h-screen place-items-center px-4">
      <div className="app-gradient" aria-hidden="true" />
      <div className="surface-card w-full max-w-[400px] p-6">
        <Link to="/" className="flex items-center gap-2.5" aria-label="Pulse home">
          <BrandMark className="size-9" />
          <span className="text-lg font-bold tracking-tight">Pulse</span>
        </Link>
        <h1 className="mt-6 text-2xl font-bold">Create your account</h1>
        <form className="mt-5 space-y-3" onSubmit={submit}>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="handle">Handle</Label>
            <Input
              id="handle"
              required
              value={handle}
              onChange={(e) => setHandle(e.target.value.replace(/[^a-z0-9_]/gi, "").toLowerCase())}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button variant="gradient" className="w-full" type="submit" disabled={pending}>
            {pending ? "Creating" : "Create account"}
          </Button>
        </form>
        <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
        </div>
        <Button variant="secondary" className="w-full" onClick={google}>
          Continue with Google
        </Button>
        <p className="mt-4 text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/auth/sign-in" className="text-cyan">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
