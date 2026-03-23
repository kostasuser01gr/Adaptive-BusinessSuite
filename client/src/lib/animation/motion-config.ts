import type { Transition, Variants } from "framer-motion";

// Spring presets
export const springs = {
  snappy: { type: "spring" as const, stiffness: 400, damping: 30 },
  gentle: { type: "spring" as const, stiffness: 200, damping: 20 },
  bouncy: { type: "spring" as const, stiffness: 300, damping: 15 },
} satisfies Record<string, Transition>;

// Page transition variants
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export const pageTransition: Transition = {
  ...springs.snappy,
  mass: 0.8,
};

// Fade variants
export const fadeVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

// Slide up variants
export const slideUpVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

// Scale variants (modals/dialogs)
export const scaleVariants: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

// Stagger container
export const staggerContainer = (
  staggerChildren = 0.05,
  delayChildren = 0,
): Variants => ({
  animate: {
    transition: { staggerChildren, delayChildren },
  },
});

// Stagger child
export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springs.snappy,
  },
};

// Hover lift effect for cards
export const hoverLift = {
  whileHover: { y: -2, transition: springs.snappy },
  whileTap: { scale: 0.98, transition: springs.snappy },
};

// Button micro-interaction
export const buttonPress = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.97 },
  transition: { type: "spring" as const, stiffness: 400, damping: 17 },
};
