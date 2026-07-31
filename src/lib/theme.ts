/**
 * Single source of truth for design constants.
 * Colors live in src/styles.css as oklch tokens; this file names the scales
 * that TypeScript code (charts, motion, layout) needs to reference.
 */

export const theme = {
  /** Semantic CSS variables. Use these in JS-driven surfaces such as charts. */
  color: {
    background: "var(--color-background)",
    surface: "var(--color-surface)",
    elevated: "var(--color-elevated)",
    foreground: "var(--color-foreground)",
    muted: "var(--color-muted-foreground)",
    border: "var(--color-border)",
    primary: "var(--color-primary)",
    cyan: "var(--color-cyan)",
    success: "var(--color-success)",
    warning: "var(--color-warning)",
    destructive: "var(--color-destructive)",
  },
  chart: {
    series: [
      "var(--color-chart-1)",
      "var(--color-chart-2)",
      "var(--color-chart-3)",
      "var(--color-chart-4)",
      "var(--color-chart-5)",
    ],
    grid: "var(--color-border)",
    axis: "var(--color-muted-foreground)",
    positive: "var(--color-success)",
    negative: "var(--color-destructive)",
  },
  /** 4px base spacing scale, expressed as Tailwind step numbers. */
  spacing: {
    xs: 1,
    sm: 2,
    md: 4,
    lg: 6,
    xl: 8,
    "2xl": 12,
  },
  radius: {
    sm: "var(--radius-sm)",
    md: "var(--radius-md)",
    lg: "var(--radius-lg)",
    xl: "var(--radius-xl)",
    "2xl": "var(--radius-2xl)",
    full: "9999px",
  },
  elevation: {
    flat: "none",
    soft: "var(--shadow-soft)",
    lift: "var(--shadow-lift)",
    glow: "var(--shadow-glow)",
  },
  typography: {
    display: "text-4xl font-bold tracking-tight sm:text-5xl",
    h1: "text-2xl font-bold tracking-tight sm:text-3xl",
    h2: "text-xl font-bold tracking-tight",
    h3: "text-base font-semibold",
    body: "text-[15px] leading-relaxed",
    small: "text-sm",
    caption: "text-xs text-muted-foreground",
    mono: "font-mono text-sm tabular-nums",
  },
  /** Motion specification. Nothing in the product exceeds 250ms. */
  duration: {
    instant: 0.08,
    fast: 0.12,
    base: 0.18,
    slow: 0.25,
  },
  easing: {
    standard: [0.22, 1, 0.36, 1] as const,
    exit: [0.4, 0, 1, 1] as const,
  },
  zIndex: {
    base: 0,
    rail: 20,
    header: 30,
    bottomNav: 40,
    fab: 45,
    overlay: 50,
    toast: 60,
  },
  breakpoint: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    "2xl": 1536,
  },
} as const;

export type Theme = typeof theme;
