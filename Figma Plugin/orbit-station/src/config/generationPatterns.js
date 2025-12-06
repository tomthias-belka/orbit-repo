/**
 * Theme Builder - Color Variant Generation Patterns
 *
 * Defines the offset patterns for auto-generating color variants
 * from a base color selection.
 *
 * Pattern Logic:
 * - User picks a "main" color (e.g., teal.80)
 * - System auto-generates other variants using these offsets
 * - Clamping ensures we stay within available color steps (5-600)
 *
 * @example
 * User picks: teal.80 as core.main
 * Generated:
 *   - light: teal.30  (80 - 50 = 30)
 *   - soft:  teal.5   (80 - 75 = 5, clamped to min)
 *   - dark:  teal.400 (80 + 330 = 410, nearest = 400)
 *   - faded: teal.40  (80 - 40 = 40)
 */

export const VARIANT_PATTERNS = {
  /**
   * Core brand colors (primary brand identity)
   */
  core: {
    main: {
      offset: 0,
      description: 'Primary brand color'
    },
    light: {
      offset: -50,
      clamp: 'min',
      fallback: 30,
      description: 'Light variant for backgrounds'
    },
    soft: {
      offset: -75,
      clamp: 'min',
      fallback: 5,
      description: 'Very light variant, almost white'
    },
    dark: {
      offset: +330,
      clamp: 'max',
      fallback: 400,
      description: 'Dark variant for contrast'
    },
    faded: {
      offset: -40,
      clamp: 'both',
      fallback: 40,
      description: 'Slightly muted variant'
    }
  },

  /**
   * Alt colors (secondary/alternative brand colors)
   */
  alt: {
    main: {
      offset: 0,
      description: 'Alternative brand color'
    },
    soft: {
      offset: -70,
      clamp: 'min',
      fallback: 5,
      description: 'Very light alternative'
    },
    light: {
      offset: -50,
      clamp: 'min',
      fallback: 10,
      description: 'Light alternative'
    },
    dark: {
      offset: +300,
      clamp: 'max',
      fallback: 400,
      description: 'Dark alternative'
    }
  },

  /**
   * Accent colors (highlights, CTAs, focus states)
   */
  accent: {
    main: {
      offset: 0,
      description: 'Accent color for highlights'
    },
    soft: {
      offset: -60,
      clamp: 'min',
      fallback: 5,
      description: 'Soft accent'
    },
    light: {
      offset: -30,
      clamp: 'min',
      fallback: 20,
      description: 'Light accent'
    },
    dark: {
      offset: +250,
      clamp: 'max',
      fallback: 300,
      description: 'Dark accent'
    }
  }
};

/**
 * Available color steps in Clara token system
 * All color families have these steps
 */
export const AVAILABLE_STEPS = [
  5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100,
  200, 300, 400, 500, 600
];

/**
 * Minimum and maximum step values
 */
export const STEP_RANGE = {
  min: 5,
  max: 600
};

/**
 * Threshold for nearest step matching
 * If calculated step is >50 units away from nearest available, warn user
 */
export const NEAREST_STEP_THRESHOLD = 50;
