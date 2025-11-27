import { createVariants } from '../system/variants';

/**
 * AnimatedCounter variant definitions
 */
export const animatedCounterVariants = createVariants({
  base: [
    // Display
    'inline-block',
    // Transitions
    'transition-base',
  ].join(' '),

  variants: {
    size: {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-2xl',
      xl: 'text-4xl',
    },

    mono: {
      true: 'font-mono tabular-nums',
      false: '',
    },
  },

  compoundVariants: [],

  defaultVariants: {
    size: 'md',
    mono: 'true',
  },
});
