import { createVariants } from '../system/variants';

/**
 * StatCard variant definitions
 */
export const statCardVariants = createVariants({
  base: [
    // Layout
    'flex flex-col',
    // Transitions
    'transition-base',
  ].join(' '),

  variants: {
    variant: {
      default: [
        'border border-dotted border-border',
        'bg-card text-card-foreground',
        'rounded-lg',
        'shadow-sm',
      ].join(' '),

      brutalist: [
        'border-[6px] border-foreground',
        'bg-background text-foreground',
        'rounded-none',
      ].join(' '),

      minimal: ['bg-transparent text-foreground'].join(' '),
    },

    size: {
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    },
  },

  compoundVariants: [],

  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});

/**
 * Stat value variants
 */
export const statValueVariants = createVariants({
  base: ['font-mono font-bold tabular-nums'].join(' '),

  variants: {
    size: {
      sm: 'text-3xl',
      md: 'text-4xl md:text-5xl',
      lg: 'text-5xl md:text-6xl',
    },
  },

  compoundVariants: [],

  defaultVariants: {
    size: 'md',
  },
});

/**
 * Stat label variants
 */
export const statLabelVariants = createVariants({
  base: ['font-semibold uppercase tracking-wide'].join(' '),

  variants: {
    size: {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
    },
  },

  compoundVariants: [],

  defaultVariants: {
    size: 'md',
  },
});

/**
 * Stat subtext variants
 */
export const statSubtextVariants = createVariants({
  base: ['text-foreground-tertiary'].join(' '),

  variants: {
    size: {
      sm: 'text-xs',
      md: 'text-xs',
      lg: 'text-sm',
    },
  },

  compoundVariants: [],

  defaultVariants: {
    size: 'md',
  },
});
