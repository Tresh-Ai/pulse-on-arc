import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Pulse | Market intelligence app" },
      {
        name: "description",
        content: "Live feed, prediction markets, communities and portfolio tools inside Pulse.",
      },
      { property: "og:title", content: "Pulse | Market intelligence app" },
      {
        property: "og:description",
        content: "Live feed, prediction markets, communities and portfolio tools inside Pulse.",
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
