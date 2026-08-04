import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandMark } from "@/components/brand";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/auth/sign-in")({
  head: () => ({
    meta: [
      { title: "Sign in | Pulse" },
      {
        name: "description",
        content: "Sign in to Pulse to follow desks, markets and communities.",
      },
      { property: "og:title", content: "Sign in | Pulse" },
      { property: "og:description", content: "Sign in to Pulse." },
    ],
  }),
  component: SignInPage,
});

function SignInPage() {
  const navigate = useNavigate();
  const { signInWithPassword, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    try {
      await signInWithPassword(email, password);
      toast.success("Welcome back");
      void navigate({ to: "/app" as never });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not sign in.");
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
        <h1 className="mt-6 text-2xl font-bold">Sign in</h1>
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
            {pending ? "Signing in" : "Sign in"}
          </Button>
        </form>
        <p className="mt-4 text-sm text-muted-foreground">
          New here?{" "}
          <Link to={"/auth/sign-up" as never} className="text-cyan">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
