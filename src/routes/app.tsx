import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "ARC | Market intelligence app" },
      {
        name: "description",
        content: "Live feed, prediction markets, communities and portfolio tools inside ARC.",
      },
      { property: "og:title", content: "ARC | Market intelligence app" },
      {
        property: "og:description",
        content: "Live feed, prediction markets, communities and portfolio tools inside ARC.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: AppLayout,
});

function AppLayout() {
  return (
    <DashboardShell>
      <Outlet />
    </DashboardShell>
  );
}
