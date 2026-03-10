import type { Transition, Variants } from 'motion/react';

// =============================================
// Spring Configurations (project-wide consistency)
// =============================================

export const springs = {
  /** Buttons, toggles, small elements */
  snappy: { type: 'spring', stiffness: 500, damping: 30 } as Transition,
  /** Cards, panels, modals */
  smooth: { type: 'spring', stiffness: 300, damping: 25 } as Transition,
  /** Page transitions, large elements */
  gentle: { type: 'spring', stiffness: 200, damping: 20 } as Transition,
};

// =============================================
// Page Transition Variants
// =============================================

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

// =============================================
// Staggered List Variants
// =============================================

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 25 },
  },
};
