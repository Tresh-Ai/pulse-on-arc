import {
  BarChart3,
  Bell,
  Bookmark,
  Coins,
  Compass,
  Home,
  MessageSquare,
  Settings,
  Sparkles,
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

export const primaryNav: NavItem[] = [
  { to: "/app", label: "Home", icon: Home },
  { to: "/app/explore", label: "Explore", icon: Compass },
  { to: "/app/predictions", label: "Markets", icon: TrendingUp },
  { to: "/app/communities", label: "Communities", icon: Users },
  { to: "/app/leaderboards", label: "Leaderboards", icon: Trophy },
  { to: "/app/notifications", label: "Notifications", icon: Bell, badgeKey: "notifications" },
  { to: "/app/messages", label: "Messages", icon: MessageSquare, badgeKey: "messages" },
  { to: "/app/wallet", label: "Wallet", icon: Wallet },
  { to: "/app/token", label: "Token", icon: Coins },
  { to: "/app/creator", label: "Creator", icon: BarChart3 },
  { to: "/app/bookmarks", label: "Bookmarks", icon: Bookmark },
  { to: "/app/profile", label: "Profile", icon: UserIcon },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

/** Mobile bottom bar: exactly five destinations. */
export const bottomNav: NavItem[] = [
  { to: "/app", label: "Home", icon: Home },
  { to: "/app/explore", label: "Explore", icon: Compass },
  { to: "/app/predictions", label: "Markets", icon: TrendingUp },
  { to: "/app/notifications", label: "Alerts", icon: Bell, badgeKey: "notifications" },
  { to: "/app/messages", label: "Inbox", icon: MessageSquare, badgeKey: "messages" },
];

export const designSystemNav: NavItem = {
  to: "/design-system",
  label: "Design system",
  icon: Sparkles,
};
