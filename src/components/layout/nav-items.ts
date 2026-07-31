import {
  BarChart3,
  Bell,
  Bookmark,
  Coins,
  Compass,
  Home,
  MessageSquare,
  Settings,
  TrendingUp,
  Trophy,
  User as UserIcon,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  badgeKey?: "notifications" | "messages";
}

/** Always visible in the sidebar: the six destinations people use daily. */
export const primaryNav: NavItem[] = [
  { to: "/app", label: "Home", icon: Home },
  { to: "/app/explore", label: "Explore", icon: Compass },
  { to: "/app/predictions", label: "Markets", icon: TrendingUp },
  { to: "/app/notifications", label: "Notifications", icon: Bell, badgeKey: "notifications" },
  { to: "/app/messages", label: "Messages", icon: MessageSquare, badgeKey: "messages" },
  { to: "/app/profile", label: "Profile", icon: UserIcon },
];

/** Revealed behind the "More" control so the sidebar stays calm by default. */
export const moreNav: NavItem[] = [
  { to: "/app/communities", label: "Communities", icon: Users },
  { to: "/app/leaderboards", label: "Leaderboards", icon: Trophy },
  { to: "/app/wallet", label: "Wallet", icon: Wallet },
  { to: "/app/token", label: "Token", icon: Coins },
  { to: "/app/creator", label: "Creator studio", icon: BarChart3 },
  { to: "/app/bookmarks", label: "Bookmarks", icon: Bookmark },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

export const allNav: NavItem[] = [...primaryNav, ...moreNav];

/** Mobile bottom bar: exactly five destinations. */
export const bottomNav: NavItem[] = [
  { to: "/app", label: "Home", icon: Home },
  { to: "/app/explore", label: "Explore", icon: Compass },
  { to: "/app/predictions", label: "Markets", icon: TrendingUp },
  { to: "/app/notifications", label: "Alerts", icon: Bell, badgeKey: "notifications" },
  { to: "/app/messages", label: "Inbox", icon: MessageSquare, badgeKey: "messages" },
];
