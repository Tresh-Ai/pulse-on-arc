import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ColumnHeader } from "@/components/common/states";

/** Members-only surface. Guests get a sign-in prompt instead of the page. */
export function RequireAuth({ title, children }: { title: string; children: ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div>
        <ColumnHeader title={title} />
        <div className="space-y-3 p-5">
          <div className="h-4 w-1/3 animate-pulse rounded bg-elevated" />
          <div className="h-24 w-full animate-pulse rounded-2xl bg-elevated/60" />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div>
        <ColumnHeader title={title} />
        <div className="flex flex-col items-center px-6 py-20 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-elevated text-muted-foreground">
            <Lock className="size-5" />
          </span>
          <h2 className="mt-4 text-lg font-bold">Sign in to continue</h2>
          <p className="mt-2 max-w-[320px] text-sm text-muted-foreground">
            {title} is part of your account. Sign in to see it.
          </p>
          <div className="mt-5 flex gap-2">
            <Button variant="gradient" asChild>
              <Link to="/auth/sign-in">Sign in</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/auth/sign-up">Create account</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
