import {
  Bell,
  Bookmark,
  Compass,
  Home,
  Settings,
  TrendingUp,
  User as UserIcon,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  badgeKey?: "notifications" | "messages";
  /** Hidden from navigation until the person is signed in. */
  authOnly?: boolean;
}

/** Always visible in the sidebar: the destinations people use daily. */
export const primaryNav: NavItem[] = [
  { to: "/app", label: "Home", icon: Home },
  { to: "/app/explore", label: "Explore", icon: Compass },
  { to: "/app/predictions", label: "Markets", icon: TrendingUp },
  {
    to: "/app/notifications",
    label: "Notifications",
    icon: Bell,
    badgeKey: "notifications",
    authOnly: true,
  },
  { to: "/app/profile", label: "Profile", icon: UserIcon, authOnly: true },
];

/** Revealed behind the "More" control so the sidebar stays calm by default. */
export const moreNav: NavItem[] = [
  { to: "/app/wallet", label: "Wallet", icon: Wallet, authOnly: true },
  { to: "/app/bookmarks", label: "Bookmarks", icon: Bookmark, authOnly: true },
  { to: "/app/settings", label: "Settings", icon: Settings, authOnly: true },
];

export const allNav: NavItem[] = [...primaryNav, ...moreNav];

/** Mobile bottom bar: five destinations. */
export const bottomNav: NavItem[] = [
  { to: "/app", label: "Home", icon: Home },
  { to: "/app/explore", label: "Explore", icon: Compass },
  { to: "/app/predictions", label: "Markets", icon: TrendingUp },
  {
    to: "/app/notifications",
    label: "Alerts",
    icon: Bell,
    badgeKey: "notifications",
    authOnly: true,
  },
  { to: "/app/profile", label: "Profile", icon: UserIcon, authOnly: true },
];

export function visibleNav(items: NavItem[], signedIn: boolean): NavItem[] {
  return signedIn ? items : items.filter((item) => !item.authOnly);
}
