import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";

/**
 * Wraps a finished surface that is not open to members yet. The real UI stays
 * mounted underneath (blurred and inert) so the work is preserved, while the
 * overlay communicates the release state.
 */
export function ComingSoon({
  title = "Coming soon",
  description,
  eyebrow,
  children,
}: {
  title?: string;
  description?: string;
  eyebrow?: string;
  children: ReactNode;
}) {
  return (
    <div className="relative isolate min-h-[70vh]">
      <div
        aria-hidden="true"
        inert
        className="pointer-events-none select-none blur-[7px] saturate-[0.75] [filter:blur(7px)]"
      >
        {children}
      </div>

      <div className="absolute inset-0 z-10 flex items-start justify-center bg-background/45 px-4 pt-24 backdrop-blur-[2px]">
        <div className="surface-card w-full max-w-[380px] overflow-hidden text-center">
          <div className="gradient-fill h-1 w-full" />
          <div className="p-6">
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/15 text-primary">
              <Sparkles className="size-5" />
            </span>
            {eyebrow ? (
              <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan">
                {eyebrow}
              </p>
            ) : null}
            <h2 className="mt-2 text-xl font-bold tracking-tight">{title}</h2>
            {description ? (
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
