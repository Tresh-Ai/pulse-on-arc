import logo from "@/assets/pulse-logo.png";
import { cn } from "@/lib/utils";

/** The Pulse mark. Used in the shells, the marketing header and the footer. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <img
      src={logo}
      alt=""
      width={64}
      height={64}
      className={cn("rounded-[26%] shadow-[var(--shadow-glow)]", className)}
    />
  );
}

export function BrandLockup({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <BrandMark className="size-9" />
      <span className="text-lg font-bold tracking-tight">Pulse</span>
    </span>
  );
}
