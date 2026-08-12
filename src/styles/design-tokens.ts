/**
 * Design tokens — the single source of truth for motion and spacing.
 * Never hardcode magic numbers elsewhere in the codebase.
 */
export const motionTokens = {
  duration: {
    fast: 0.15,
    base: 0.25,
    slow: 0.4,
    page: 0.5,
  },
  ease: {
    smooth: [0.22, 1, 0.36, 1] as [number, number, number, number],
    snappy: [0.4, 0, 0.2, 1] as [number, number, number, number],
    gentle: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
  },
  stagger: {
    list: 0.05,
    cards: 0.08,
  },
} as const;

export const colorTokens = {
  gold: "#B69D6E",
  goldLight: "#D4C19C",
  goldDark: "#8C7A52",
  charcoal: "#1C1917",
  paper: "#FAFAF9",
} as const;

export const layoutTokens = {
  sidebarWidth: 280,
  headerHeight: 68,
  previewPanelWidth: 400,
} as const;
