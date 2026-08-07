import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  Compass,
  TrendingUp,
  Users,
  Bell,
  MessageSquare,
  Wallet,
  Coins,
  BarChart3,
  Settings,
  Search,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useApp } from "@/store/app-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

export function AppShell({ children, rail }: { children: ReactNode; rail?: ReactNode }) {
  const { user, unreadCount } = useApp();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const primary: NavItem[] = [
    { to: "/", label: "Home", icon: Home },
    { to: "/explore", label: "Explore", icon: Compass },
    { to: "/predictions", label: "Predictions", icon: TrendingUp },
    { to: "/communities", label: "Communities", icon: Users },
    { to: "/leaderboards", label: "Leaderboards", icon: Trophy },
    { to: "/notifications", label: "Notifications", icon: Bell, badge: unreadCount },
    { to: "/messages", label: "Messages", icon: MessageSquare },
    { to: "/wallet", label: "Wallet", icon: Wallet },
    { to: "/token", label: "Token", icon: Coins },
    { to: "/creator", label: "Creator", icon: BarChart3 },
    { to: "/settings", label: "Settings", icon: Settings },
  ];

  const mobile = primary.slice(0, 4).concat([{ to: "/wallet", label: "Wallet", icon: Wallet }]);

  return (
    <div className="min-h-screen">
      <div className="app-gradient" aria-hidden="true" />
      <div className="app-noise" aria-hidden="true" />

      <div className="mx-auto flex w-full max-w-[1400px] gap-6 px-3 sm:px-5 lg:px-8">
        <aside className="sticky top-0 hidden h-screen shrink-0 flex-col justify-between py-6 md:flex md:w-[76px] xl:w-[248px]">
          <div className="flex flex-col gap-8">
            <Link to="/" className="flex items-center gap-3 px-2" aria-label="Pulse Social home">
              <span className="gradient-fill flex size-10 items-center justify-center rounded-2xl text-base font-bold text-primary-foreground shadow-[var(--shadow-glow)]">
                P
              </span>
              <span className="hidden text-lg font-bold tracking-tight xl:inline">Pulse Social</span>
            </Link>

            <nav className="flex flex-col gap-1" aria-label="Primary">
              {primary.map((item) => {
                const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to as never}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-[14px] px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      active
                        ? "bg-elevated/80 text-foreground"
                        : "text-muted-foreground hover:bg-elevated/50 hover:text-foreground",
                    )}
                  >
                    <item.icon className={cn("size-5 shrink-0", active && "text-cyan")} />
                    <span className="hidden xl:inline">{item.label}</span>
                    {item.badge ? (
                      <Badge className="ml-auto hidden h-5 min-w-5 justify-center rounded-full bg-primary px-1.5 text-[11px] text-primary-foreground xl:flex">
                        {item.badge}
                      </Badge>
                    ) : null}
                  </Link>
                );
              })}
            </nav>
          </div>

          <Link
            to="/"
            className="flex items-center gap-3 rounded-[14px] p-2 transition-colors hover:bg-elevated/60"
          >
            <Avatar className="size-9">
              <AvatarImage src={user.avatar} alt="" />
              <AvatarFallback>{user.displayName.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <span className="hidden min-w-0 flex-col xl:flex">
              <span className="truncate text-sm font-semibold">{user.displayName}</span>
              <span className="truncate text-xs text-muted-foreground">@{user.username}</span>
            </span>
          </Link>
        </aside>

        <main className="min-w-0 flex-1 pb-24 pt-4 md:pb-10">{children}</main>

        {rail ? (
          <aside className="sticky top-0 hidden h-screen w-[320px] shrink-0 overflow-y-auto py-6 no-scrollbar lg:block">
            {rail}
          </aside>
        ) : null}
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/85 backdrop-blur-xl md:hidden"
        aria-label="Primary mobile"
      >
        <div className="flex items-center justify-around px-2 py-2">
          {mobile.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to as never}
                aria-label={item.label}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-[14px] px-3 py-1.5 text-[11px] font-medium transition-colors",
                  active ? "text-cyan" : "text-muted-foreground",
                )}
              >
                <item.icon className="size-5" />
                {item.label}
              </Link>
            );
          })}
          <Link
            to="/search"
            aria-label="Search"
            className="flex flex-col items-center gap-1 rounded-[14px] px-3 py-1.5 text-[11px] font-medium text-muted-foreground"
          >
            <Search className="size-5" />
            Search
          </Link>
        </div>
      </nav>
    </div>
  );
}
