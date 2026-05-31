/**
 * BEFRIX Design Tokens
 * Centralized reference for the design system. Source of truth lives in
 * `src/styles.css` — this file mirrors values for use in TS/JS contexts
 * (charts, motion, programmatic styling).
 */

export const tokens = {
  colors: {
    background: "oklch(0.08 0.04 270)",
    surface: "oklch(0.16 0.04 265)",
    primary: "oklch(0.58 0.22 265)",
    primaryGlow: "oklch(0.7 0.24 265)",
    accent: "oklch(0.62 0.26 295)",
    accentGlow: "oklch(0.74 0.28 295)",
  },
  spacing: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
    "2xl": "3rem",
    "3xl": "4.5rem",
    "4xl": "6rem",
  },
  radius: {
    sm: "0.5rem",
    md: "0.75rem",
    lg: "1rem",
    xl: "1.5rem",
    full: "9999px",
  },
  motion: {
    easeOutExpo: [0.16, 1, 0.3, 1] as const,
    easeOutQuart: [0.25, 1, 0.5, 1] as const,
    duration: { fast: 0.2, base: 0.4, slow: 0.6, xslow: 0.9 },
  },
} as const;

export type Tokens = typeof tokens;
