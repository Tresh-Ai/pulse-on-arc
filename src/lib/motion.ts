import type { Transition, Variants } from "motion/react";
import { theme } from "./theme";

/**
 * Motion specification for the whole product.
 * Rules: nothing longer than 250ms, one easing curve, consistent registers.
 *  - Page transitions: fade + 8px Y
 *  - Cards: 4px hover lift
 *  - Buttons: 98% press scale
 *  - Modals: scale + fade
 *  - Drawers: slide
 */

export const ease = theme.easing.standard;

export const transition: Record<"fast" | "base" | "slow", Transition> = {
  fast: { duration: theme.duration.fast, ease },
  base: { duration: theme.duration.base, ease },
  slow: { duration: theme.duration.slow, ease },
};

export const pageMotion: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: transition.slow },
  exit: { opacity: 0, y: -4, transition: transition.fast },
};

export const listItemMotion: Variants = {
  initial: { opacity: 0, y: 6 },
  animate: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { ...transition.base, delay: Math.min(i * 0.02, 0.12) },
  }),
};

export const modalMotion: Variants = {
  initial: { opacity: 0, scale: 0.97 },
  animate: { opacity: 1, scale: 1, transition: transition.base },
  exit: { opacity: 0, scale: 0.98, transition: transition.fast },
};

export const drawerMotion: Variants = {
  initial: { x: "100%" },
  animate: { x: 0, transition: transition.slow },
  exit: { x: "100%", transition: transition.fast },
};

/** Interaction registers shared by pressable surfaces. */
export const press = { scale: 0.98 } as const;
export const hoverLift = { y: -4 } as const;

/** Tailwind class shorthands so non-motion elements match the same spec. */
export const motionClass = {
  press: "active:scale-[0.98] transition-transform duration-100",
  lift: "transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]",
  fade: "transition-colors duration-150",
  shimmer: "animate-[shimmer_1.6s_ease-in-out_infinite]",
} as const;
