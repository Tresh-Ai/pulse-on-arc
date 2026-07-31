import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, Search, Feather, Bell, Command as CommandIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/store/app-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ShellContext } from "./shell-context";
import { bottomNav, primaryNav, designSystemNav } from "./nav-items";
import { CommandPalette } from "./command-palette";
import { SearchOverlay } from "./search-overlay";
import { NotificationsDrawer } from "./notifications-drawer";
import { ComposerDialog } from "@/features/feed/composer";
import { RightRail } from "./right-rail";

function useBadges() {
  const { unreadCount } = useApp();
  return { notifications: unreadCount, messages: 3 } as const;
}

function isActive(pathname: string, to: string) {
  return to === "/app" ? pathname === "/app" || pathname === "/app/" : pathname.startsWith(to);
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const [commandOpen, setCommandOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useApp();
  const badges = useBadges();

  return (
    <ShellContext.Provider
      value={{
        commandOpen,
        setCommandOpen,
        searchOpen,
        setSearchOpen,
        notificationsOpen,
        setNotificationsOpen,
        composerOpen,
        setComposerOpen,
        mobileNavOpen,
        setMobileNavOpen,
      }}
    >
      <div className="min-h-screen">
        <div className="app-gradient" aria-hidden="true" />
        <div className="app-noise" aria-hidden="true" />

        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl md:hidden">
          <button
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open menu"
            className="-ml-1 grid size-9 place-items-center rounded-full hover:bg-elevated"
          >
            <Menu className="size-5" />
          </button>
          <Link to="/app" className="mx-auto flex items-center gap-2" aria-label="ARC home">
            <span className="gradient-fill grid size-8 place-items-center rounded-xl text-sm font-bold text-primary-foreground">
              A
            </span>
          </Link>
          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
            className="grid size-9 place-items-center rounded-full hover:bg-elevated"
          >
            <Search className="size-5" />
          </button>
        </header>

        <div className="mx-auto flex w-full max-w-[1320px] justify-center gap-0 px-0 sm:px-4 lg:gap-8">
          {/* Desktop sidebar */}
          <aside className="sticky top-0 hidden h-screen shrink-0 flex-col justify-between py-3 md:flex md:w-[84px] xl:w-[268px]">
            <div className="flex flex-col gap-1">
              <Link
                to="/app"
                className="mb-2 flex items-center gap-3 rounded-full px-3 py-2"
                aria-label="ARC home"
              >
                <span className="gradient-fill grid size-10 shrink-0 place-items-center rounded-2xl text-base font-bold text-primary-foreground shadow-[var(--shadow-glow)]">
                  A
                </span>
                <span className="hidden text-lg font-bold tracking-tight xl:inline">ARC</span>
              </Link>

              <nav className="flex flex-col gap-0.5" aria-label="Primary">
                {primaryNav.map((item) => {
                  const active = isActive(pathname, item.to);
                  const badge = item.badgeKey ? badges[item.badgeKey] : 0;
                  return (
                    <Link
                      key={item.to}
                      to={item.to as never}
                      className={cn(
                        "group relative flex items-center gap-4 self-start rounded-full px-3 py-2.5 transition-colors duration-150 hover:bg-elevated/70 xl:pr-6",
                        active && "font-bold",
                      )}
                    >
                      <span className="relative">
                        <item.icon
                          className={cn("size-[24px] shrink-0", active && "text-cyan")}
                          strokeWidth={active ? 2.4 : 1.9}
                        />
                        {badge ? (
                          <span className="absolute -right-1 -top-1 grid min-w-[16px] place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                            {badge}
                          </span>
                        ) : null}
                      </span>
                      <span className="hidden text-[17px] xl:inline">{item.label}</span>
                    </Link>
                  );
                })}
                <button
                  onClick={() => setCommandOpen(true)}
                  className="group flex items-center gap-4 self-start rounded-full px-3 py-2.5 text-muted-foreground transition-colors hover:bg-elevated/70 hover:text-foreground xl:pr-6"
                >
                  <CommandIcon className="size-[24px] shrink-0" strokeWidth={1.9} />
                  <span className="hidden text-[17px] xl:inline">Command</span>
                  <kbd className="ml-2 hidden rounded border border-border px-1.5 py-0.5 text-[11px] xl:inline">
                    ⌘K
                  </kbd>
                </button>
                <Link
                  to={designSystemNav.to as never}
                  className="group flex items-center gap-4 self-start rounded-full px-3 py-2.5 text-muted-foreground transition-colors hover:bg-elevated/70 hover:text-foreground xl:pr-6"
                >
                  <designSystemNav.icon className="size-[24px] shrink-0" strokeWidth={1.9} />
                  <span className="hidden text-[17px] xl:inline">{designSystemNav.label}</span>
                </Link>
              </nav>

              <Button
                variant="gradient"
                onClick={() => setComposerOpen(true)}
                className="mt-4 hidden h-12 w-full text-base xl:flex"
              >
                Post
              </Button>
              <Button
                variant="gradient"
                size="icon-lg"
                aria-label="New post"
                onClick={() => setComposerOpen(true)}
                className="mt-4 xl:hidden"
              >
                <Feather className="size-5" />
              </Button>
            </div>

            <Link
              to={"/app/profile" as never}
              className="mb-2 flex items-center gap-3 rounded-full p-2 transition-colors hover:bg-elevated/70"
            >
              <Avatar className="size-10 shrink-0">
                <AvatarImage src={user.avatar} alt="" />
                <AvatarFallback>{user.displayName.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <span className="hidden min-w-0 flex-col xl:flex">
                <span className="truncate text-sm font-bold">{user.displayName}</span>
                <span className="truncate text-xs text-muted-foreground">@{user.username}</span>
              </span>
            </Link>
          </aside>

          {/* Main column */}
          <main className="min-h-screen w-full min-w-0 max-w-[640px] border-x border-border pb-24 md:pb-0">
            {children}
          </main>

          <RightRail />
        </div>

        {/* Mobile bottom navigation: five destinations */}
        <nav
          className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 backdrop-blur-xl md:hidden"
          aria-label="Primary mobile"
        >
          <div className="flex items-center justify-around px-1 pb-[env(safe-area-inset-bottom)] pt-1.5">
            {bottomNav.map((item) => {
              const active = isActive(pathname, item.to);
              const badge = item.badgeKey ? badges[item.badgeKey] : 0;
              return (
                <Link
                  key={item.to}
                  to={item.to as never}
                  aria-label={item.label}
                  className={cn(
                    "relative flex flex-1 flex-col items-center gap-0.5 rounded-2xl px-2 py-1.5 text-[10px] font-medium transition-colors",
                    active ? "text-cyan" : "text-muted-foreground",
                  )}
                >
                  <span className="relative">
                    <item.icon className="size-[22px]" strokeWidth={active ? 2.4 : 1.9} />
                    {badge ? (
                      <span className="absolute -right-1.5 -top-1 grid min-w-[15px] place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                        {badge}
                      </span>
                    ) : null}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Mobile floating compose button */}
        <button
          onClick={() => setComposerOpen(true)}
          aria-label="New post"
          className="gradient-fill fixed bottom-20 right-4 z-45 grid size-14 place-items-center rounded-full text-primary-foreground shadow-[var(--shadow-glow)] transition-transform duration-150 active:scale-[0.96] md:hidden"
        >
          <Feather className="size-6" />
        </button>

        {/* Mobile slide-out sidebar */}
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetContent
            side="left"
            className="w-[290px] border-border bg-surface/95 p-0 backdrop-blur-2xl"
          >
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <div className="flex h-full flex-col">
              <div className="border-b border-border p-5">
                <Link
                  to={"/app/profile" as never}
                  onClick={() => setMobileNavOpen(false)}
                  className="flex items-center gap-3"
                >
                  <Avatar className="size-11">
                    <AvatarImage src={user.avatar} alt="" />
                    <AvatarFallback>{user.displayName.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{user.displayName}</p>
                    <p className="truncate text-xs text-muted-foreground">@{user.username}</p>
                  </div>
                </Link>
                <div className="mt-3 flex gap-4 text-xs">
                  <span>
                    <strong>{user.following}</strong>{" "}
                    <span className="text-muted-foreground">Following</span>
                  </span>
                  <span>
                    <strong>{user.followers.toLocaleString()}</strong>{" "}
                    <span className="text-muted-foreground">Followers</span>
                  </span>
                </div>
              </div>

              <nav className="flex-1 overflow-y-auto p-2" aria-label="Mobile menu">
                {primaryNav.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to as never}
                    onClick={() => setMobileNavOpen(false)}
                    className={cn(
                      "flex items-center gap-4 rounded-[14px] px-3 py-3 text-[15px] transition-colors hover:bg-elevated/70",
                      isActive(pathname, item.to) && "font-bold text-foreground",
                    )}
                  >
                    <item.icon className="size-5 shrink-0" />
                    {item.label}
                  </Link>
                ))}
                <Link
                  to={designSystemNav.to as never}
                  onClick={() => setMobileNavOpen(false)}
                  className="flex items-center gap-4 rounded-[14px] px-3 py-3 text-[15px] text-muted-foreground hover:bg-elevated/70"
                >
                  <designSystemNav.icon className="size-5 shrink-0" />
                  {designSystemNav.label}
                </Link>
              </nav>

              <div className="border-t border-border p-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setMobileNavOpen(false);
                    setNotificationsOpen(true);
                  }}
                >
                  <Bell className="size-4" /> Notifications
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <CommandPalette />
        <SearchOverlay />
        <NotificationsDrawer />
        <ComposerDialog open={composerOpen} onOpenChange={setComposerOpen} />
      </div>
    </ShellContext.Provider>
  );
}
