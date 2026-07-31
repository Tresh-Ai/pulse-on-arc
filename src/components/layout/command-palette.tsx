import { useEffect, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { users } from "@/mock-data/users";
import { communities } from "@/mock-data/communities";
import { predictions } from "@/mock-data/predictions";
import { tokenList } from "@/mock-data/discovery";
import { primaryNav } from "./nav-items";
import { useShell } from "./shell-context";
import { formatCompact, formatPercent } from "@/lib/utils";

export function CommandPalette() {
  const { commandOpen, setCommandOpen } = useShell();
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandOpen(!commandOpen);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [commandOpen, setCommandOpen]);

  const go = (to: string) => {
    setCommandOpen(false);
    void navigate({ to: to as never });
  };

  const people = useMemo(() => users.slice(0, 8), []);

  return (
    <Dialog open={commandOpen} onOpenChange={setCommandOpen}>
      <DialogContent className="overflow-hidden border-border bg-popover/95 p-0 backdrop-blur-2xl sm:max-w-[640px]">
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <Command className="bg-transparent [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-muted-foreground">
          <CommandInput placeholder="Search people, markets, communities, tokens…" />
          <CommandList className="max-h-[420px]">
            <CommandEmpty>No matches. Try a handle or a market keyword.</CommandEmpty>

            <CommandGroup heading="Navigate">
              {primaryNav.map((item) => (
                <CommandItem key={item.to} value={`go ${item.label}`} onSelect={() => go(item.to)}>
                  <item.icon className="mr-2 size-4 text-cyan" />
                  {item.label}
                  {item.to === "/app" ? <CommandShortcut>⌘1</CommandShortcut> : null}
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="People">
              {people.map((u) => (
                <CommandItem
                  key={u.id}
                  value={`${u.displayName} ${u.username}`}
                  onSelect={() => go(`/app/u/${u.username}`)}
                >
                  <img src={u.avatar} alt="" className="mr-2 size-5 rounded-full" />
                  <span className="truncate">{u.displayName}</span>
                  <span className="ml-2 truncate text-xs text-muted-foreground">@{u.username}</span>
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandGroup heading="Markets">
              {predictions.slice(0, 6).map((p) => (
                <CommandItem
                  key={p.id}
                  value={p.title}
                  onSelect={() => go(`/app/predictions/${p.id}`)}
                >
                  <span className="truncate">{p.title}</span>
                  <CommandShortcut>{p.yesPercent}% yes</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandGroup heading="Communities">
              {communities.slice(0, 6).map((c) => (
                <CommandItem
                  key={c.id}
                  value={c.name}
                  onSelect={() => go(`/app/communities/${c.slug}`)}
                >
                  <span className="truncate">{c.name}</span>
                  <CommandShortcut>{formatCompact(c.members)} members</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandGroup heading="Tokens">
              {tokenList.map((t) => (
                <CommandItem key={t.symbol} value={`${t.symbol} ${t.name}`} onSelect={() => go("/app/token")}>
                  <span className="font-semibold">{t.symbol}</span>
                  <span className="ml-2 truncate text-xs text-muted-foreground">{t.name}</span>
                  <CommandShortcut>{formatPercent(t.change24h)}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
