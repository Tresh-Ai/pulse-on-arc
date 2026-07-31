import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Coins,
  Compass,
  LineChart,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { queries } from "@/services/queries";
import { AreaTrend } from "@/components/charts";
import { cn, formatCompact, formatPercent, formatUsd } from "@/lib/utils";
import { fadeUp, stagger } from "@/lib/motion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pulse | Social markets and market intelligence" },
      {
        name: "description",
        content:
          "Pulse is the social network for market intelligence: live discussion, prediction markets, creator communities and reputation scoring in one place.",
      },
      { property: "og:title", content: "Pulse | Social markets and market intelligence" },
      {
        property: "og:description",
        content:
          "Live discussion, prediction markets, creator communities and reputation scoring for the Pulse network.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Pulse",
          description: "Social markets and market intelligence network.",
        }),
      },
    ],
  }),
  component: LandingPage,
});

const FEATURES = [
  {
    icon: MessageSquare,
    title: "A timeline built for markets",
    body: "Charts, polls and market links render inline so every take carries its evidence.",
  },
  {
    icon: TrendingUp,
    title: "Prediction markets",
    body: "Open positions on ecosystem, macro and culture questions with transparent pools.",
  },
  {
    icon: Users,
    title: "Creator communities",
    body: "Rooms with their own markets, moderators and member-only research threads.",
  },
  {
    icon: Trophy,
    title: "Reputation that compounds",
    body: "Stake weighted accuracy, not follower count, decides who ranks on the boards.",
  },
  {
    icon: Coins,
    title: "Wallet and token",
    body: "Balances, transfers and Pulse token utility live next to the conversation.",
  },
  {
    icon: BarChart3,
    title: "Creator analytics",
    body: "Audience growth, revenue and content performance in one honest dashboard.",
  },
];

const STEPS = [
  { label: "Create your handle", detail: "Pick a name, add interests, follow a starting roster." },
  { label: "Read the signal", detail: "Follow desks, communities and markets that match your edge." },
  { label: "Take a position", detail: "Post the thesis, back it in a market, and let the record speak." },
];

function LandingPage() {
  const token = useQuery(queries.token());
  const predictions = useQuery(queries.predictions({ status: "open" }));
  const suggested = useQuery(queries.suggestedUsers());

  return (
    <div className="min-h-screen">
      <div className="app-gradient" aria-hidden="true" />
      <div className="app-noise" aria-hidden="true" />

      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center gap-4 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5" aria-label="Pulse home">
            <span className="gradient-fill grid size-9 place-items-center rounded-2xl text-sm font-bold text-primary-foreground shadow-[var(--shadow-glow)]">
              P
            </span>
            <span className="text-lg font-bold tracking-tight">Pulse</span>
          </Link>
          <nav className="ml-6 hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#product" className="transition-colors hover:text-foreground">
              Product
            </a>
            <a href="#markets" className="transition-colors hover:text-foreground">
              Markets
            </a>
            <a href="#creators" className="transition-colors hover:text-foreground">
              Creators
            </a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to={"/auth/sign-in" as never}>Sign in</Link>
            </Button>
            <Button variant="gradient" size="sm" asChild>
              <Link to={"/app" as never}>Open Pulse</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto w-full max-w-[1200px] px-4 pb-16 pt-14 sm:px-6 sm:pt-20">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]"
          >
            <div>
              <motion.div variants={fadeUp}>
                <Badge className="rounded-full border border-border bg-elevated/70 px-3 py-1 text-xs font-medium text-cyan">
                  <Sparkles className="mr-1.5 size-3" /> Season two is live
                </Badge>
              </motion.div>
              <motion.h1
                variants={fadeUp}
                className="mt-5 text-[40px] font-extrabold leading-[1.05] tracking-tight sm:text-[56px]"
              >
                The social network for{" "}
                <span className="gradient-text">market intelligence</span>
              </motion.h1>
              <motion.p
                variants={fadeUp}
                className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground"
              >
                Discussion, prediction markets, creator rooms and reputation in one product.
                Opinions carry a track record here, and every claim can be priced.
              </motion.p>
              <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-3">
                <Button variant="gradient" size="xl" asChild>
                  <Link to={"/app" as never}>
                    Open Pulse <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="xl" asChild>
                  <Link to={"/auth/sign-up" as never}>Create an account</Link>
                </Button>
              </motion.div>
              <motion.dl
                variants={fadeUp}
                className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-border pt-6"
              >
                {[
                  ["128k", "Members"],
                  ["2.4k", "Open markets"],
                  ["71%", "Median accuracy"],
                ].map(([v, l]) => (
                  <div key={l}>
                    <dt className="text-2xl font-bold tabular-nums">{v}</dt>
                    <dd className="text-xs uppercase tracking-wide text-muted-foreground">{l}</dd>
                  </div>
                ))}
              </motion.dl>
            </div>

            <motion.div variants={fadeUp} className="relative">
              <div className="surface-card overflow-hidden p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pulse token</p>
                    <p className="text-3xl font-bold tabular-nums">
                      {token.data ? formatUsd(token.data.price) : "—"}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full bg-elevated px-3 py-1 text-sm font-semibold tabular-nums",
                      (token.data?.change24h ?? 0) >= 0 ? "text-success" : "text-destructive",
                    )}
                  >
                    {token.data ? formatPercent(token.data.change24h) : "—"}
                  </span>
                </div>
                <div className="mt-4 h-[180px]">
                  {token.data ? (
                    <AreaTrend
                      data={token.data.series.map((p) => ({ label: p.t, value: p.price }))}
                      xKey="label"
                      yKey="value"
                    />
                  ) : null}
                </div>
                <div className="mt-4 space-y-2">
                  {predictions.data?.slice(0, 3).map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 rounded-[14px] bg-elevated/60 px-3 py-2.5"
                    >
                      <span className="line-clamp-1 flex-1 text-sm">{p.title}</span>
                      <span className="shrink-0 text-xs font-semibold text-success tabular-nums">
                        {p.yesPercent}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="surface-card absolute -bottom-6 -left-6 hidden w-[230px] p-4 sm:block">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Median accuracy
                </p>
                <p className="mt-2 flex items-center gap-2 text-sm">
                  <ShieldCheck className="size-4 text-cyan" /> 71% across 2.4k markets
                </p>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* Feature grid */}
        <section id="product" className="border-y border-border bg-surface/30 py-16">
          <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6">
            <h2 className="max-w-2xl text-3xl font-bold tracking-tight">
              Everything a market community needs, in one surface
            </h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <article
                  key={f.title}
                  className="surface-card p-5 transition-transform duration-200 hover:-translate-y-1"
                >
                  <span className="grid size-10 place-items-center rounded-2xl bg-elevated text-cyan">
                    <f.icon className="size-5" />
                  </span>
                  <h3 className="mt-4 text-base font-bold">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Markets */}
        <section id="markets" className="py-16">
          <div className="mx-auto grid w-full max-w-[1200px] gap-10 px-4 sm:px-6 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Price the conversation</h2>
              <p className="mt-4 text-muted-foreground">
                Every thesis on Pulse can become a market. Pools are transparent, positions are
                public, and resolution rules are written before the first stake is placed.
              </p>
              <ul className="mt-6 space-y-3">
                {STEPS.map((s, i) => (
                  <li key={s.label} className="flex gap-3">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-elevated text-xs font-bold text-cyan">
                      {i + 1}
                    </span>
                    <span>
                      <span className="font-semibold">{s.label}</span>
                      <span className="block text-sm text-muted-foreground">{s.detail}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="mt-8" asChild>
                <Link to={"/app/predictions" as never}>
                  Browse markets <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
            <div className="space-y-3">
              {predictions.data?.slice(0, 4).map((p) => (
                <Link
                  key={p.id}
                  to={"/app/predictions/$predictionId" as never}
                  params={{ predictionId: p.id } as never}
                  className="surface-card block p-5 transition-transform duration-200 hover:-translate-y-1"
                >
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge className="rounded-full bg-elevated text-[11px] text-foreground">
                      {p.category}
                    </Badge>
                    {formatCompact(p.participants)} participants
                  </div>
                  <p className="mt-2 font-semibold">{p.title}</p>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-elevated">
                    <div
                      className="h-full rounded-full bg-success"
                      style={{ width: `${p.yesPercent}%` }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                    <span className="text-success">YES {p.yesPercent}%</span>
                    <span>{formatUsd(p.pool, { compact: true })} pool</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Creators */}
        <section id="creators" className="border-y border-border bg-surface/30 py-16">
          <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="text-3xl font-bold tracking-tight">Follow people with a record</h2>
              <Button variant="ghost" asChild>
                <Link to={"/app/leaderboards" as never}>
                  See leaderboards <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {suggested.data?.slice(0, 6).map((u) => (
                <Link
                  key={u.id}
                  to={"/app/u/$handle" as never}
                  params={{ handle: u.username } as never}
                  className="surface-card flex items-start gap-3 p-5 transition-transform duration-200 hover:-translate-y-1"
                >
                  <Avatar className="size-11">
                    <AvatarImage src={u.avatar} alt="" />
                    <AvatarFallback>{u.displayName.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate font-bold">{u.displayName}</p>
                    <p className="truncate text-xs text-muted-foreground">@{u.username}</p>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{u.bio}</p>
                    <p className="mt-2 text-xs text-cyan">
                      {u.predictionAccuracy}% accuracy · {formatCompact(u.followers)} followers
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="mx-auto w-full max-w-[900px] px-4 text-center sm:px-6">
            <ShieldCheck className="mx-auto size-10 text-cyan" />
            <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
              Your track record is the product
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Post the thesis, back it in a market, and let the record compound. Your accuracy is public, permanent and portable.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button variant="gradient" size="xl" asChild>
                <Link to={"/app" as never}>Open Pulse</Link>
              </Button>
              <Button variant="outline" size="xl" asChild>
                <Link to={"/app/predictions" as never}>See open markets</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-10">
        <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center gap-x-6 gap-y-3 px-4 text-sm text-muted-foreground sm:px-6">
          <span className="flex items-center gap-2 font-semibold text-foreground">
            <span className="gradient-fill grid size-7 place-items-center rounded-xl text-xs text-primary-foreground">
              P
            </span>
            Pulse
          </span>
          <Link to={"/app/explore" as never} className="flex items-center gap-1.5">
            <Compass className="size-4" /> Explore
          </Link>
          <Link to={"/app/notifications" as never} className="flex items-center gap-1.5">
            <Bell className="size-4" /> Activity
          </Link>
          <Link to={"/app/token" as never} className="flex items-center gap-1.5">
            <LineChart className="size-4" /> Token
          </Link>
          <span className="ml-auto">© 2026 Pulse Social Markets.</span>
        </div>
      </footer>
    </div>
  );
}
