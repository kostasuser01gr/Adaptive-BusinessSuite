export const DURATION = {
  fast: 150,
  normal: 250,
  slow: 400,
  page: 500,
} as const;

export const EASING = {
  default: [0.25, 0.1, 0.25, 1] as const,
  easeOut: [0, 0, 0.2, 1] as const,
  easeIn: [0.4, 0, 1, 1] as const,
  spring: "spring(1, 80, 10, 0)",
} as const;

export const STAGGER = {
  fast: 0.03,
  normal: 0.05,
  slow: 0.08,
  grid: 0.04,
} as const;
