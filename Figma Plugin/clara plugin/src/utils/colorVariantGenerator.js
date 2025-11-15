/**
 * Color Variant Generator
 *
 * Auto-generates color variants (light, soft, dark, faded) from a base color selection.
 * Uses pattern-based offset calculation with intelligent clamping and nearest-step matching.
 *
 * @module colorVariantGenerator
 */

import { VARIANT_PATTERNS, AVAILABLE_STEPS, STEP_RANGE, NEAREST_STEP_THRESHOLD } from '../config/generationPatterns.js';

/**
 * Parse a color reference string into family and level
 *
 * @param {string} colorRef - Color reference (e.g., "{colors.teal.70}" or "teal.70")
 * @returns {Object|null} - { family: string, level: number } or null if invalid
 *
 * @example
 * parseColorReference("{colors.teal.70}") // { family: "teal", level: 70 }
 * parseColorReference("ocean.400")        // { family: "ocean", level: 400 }
 */
export function parseColorReference(colorRef) {
  if (!colorRef || typeof colorRef !== 'string') {
    return null;
  }

  // Match both formats: "{colors.teal.70}" and "teal.70"
  const match = colorRef.match(/(?:\{colors\.)?([a-z]+)\.(\d+)\}?$/i);

  if (!match) {
    return null;
  }

  const [, family, levelStr] = match;
  const level = parseInt(levelStr, 10);

  if (isNaN(level)) {
    return null;
  }

  return { family, level };
}

/**
 * Build a color reference string from family and level
 *
 * @param {string} family - Color family name (e.g., "teal")
 * @param {number} level - Color level (e.g., 70)
 * @returns {string} - Color reference (e.g., "{colors.teal.70}")
 *
 * @example
 * buildColorReference("teal", 70) // "{colors.teal.70}"
 */
export function buildColorReference(family, level) {
  return `{colors.${family}.${level}}`;
}

/**
 * Find the nearest available step to a target index
 *
 * @param {number[]} availableSteps - Array of available steps (sorted)
 * @param {number} targetIndex - Desired index
 * @param {number} threshold - Maximum distance to warn about (default: 50)
 * @returns {Object} - { step: number, distance: number, isExact: boolean }
 *
 * @example
 * findNearestStep([5, 10, 20, 30, 40, 50], 32)
 * // { step: 30, distance: 2, isExact: false }
 */
export function findNearestStep(availableSteps, targetIndex, threshold = NEAREST_STEP_THRESHOLD) {
  if (!availableSteps || availableSteps.length === 0) {
    throw new Error('No available steps provided');
  }

  // Find nearest step
  const nearest = availableSteps.reduce((prev, curr) =>
    Math.abs(curr - targetIndex) < Math.abs(prev - targetIndex) ? curr : prev
  );

  const distance = Math.abs(nearest - targetIndex);
  const isExact = distance === 0;

  // Warn if distance exceeds threshold
  if (distance > threshold) {
    console.warn(
      `[ColorVariantGenerator] Target step ${targetIndex} is ${distance} units away from nearest available step ${nearest}. ` +
      `This may result in unexpected color selection.`
    );
  }

  return { step: nearest, distance, isExact };
}

/**
 * Get available steps for a specific color family from token data
 *
 * @param {string} family - Color family name
 * @param {Object} tokenData - Full token tree data
 * @returns {number[]} - Array of available steps (sorted)
 *
 * @example
 * getAvailableStepsForFamily("teal", tokenTreeData)
 * // [5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 200, 300, 400, 500, 600]
 */
export function getAvailableStepsForFamily(family, tokenData) {
  const familyData = tokenData?.global?.colors?.[family];

  if (!familyData) {
    console.warn(`[ColorVariantGenerator] Color family "${family}" not found in token data. Using default steps.`);
    return AVAILABLE_STEPS;
  }

  // Extract numeric keys that have color type
  const steps = Object.keys(familyData)
    .map(k => parseInt(k, 10))
    .filter(n => !isNaN(n) && familyData[n]?.$type === 'color')
    .sort((a, b) => a - b);

  if (steps.length === 0) {
    console.warn(`[ColorVariantGenerator] No color steps found in family "${family}". Using default steps.`);
    return AVAILABLE_STEPS;
  }

  return steps;
}

/**
 * Calculate variant step with clamping
 *
 * @param {number} baseStep - Base step value (e.g., 80)
 * @param {number} offset - Offset to apply (e.g., -50)
 * @param {string} clampMode - Clamping mode: 'min', 'max', 'both', or 'none'
 * @param {number} fallback - Fallback value if clamping needed
 * @param {number[]} availableSteps - Available steps for the family
 * @returns {number} - Calculated step value
 */
function calculateVariantStep(baseStep, offset, clampMode, fallback, availableSteps) {
  const targetStep = baseStep + offset;
  const minStep = availableSteps[0] || STEP_RANGE.min;
  const maxStep = availableSteps[availableSteps.length - 1] || STEP_RANGE.max;

  // Handle clamping
  let clampedStep = targetStep;

  if (clampMode === 'min' && targetStep < minStep) {
    clampedStep = fallback || minStep;
  } else if (clampMode === 'max' && targetStep > maxStep) {
    clampedStep = fallback || maxStep;
  } else if (clampMode === 'both') {
    if (targetStep < minStep) {
      clampedStep = fallback || minStep;
    } else if (targetStep > maxStep) {
      clampedStep = fallback || maxStep;
    }
  }

  // Find nearest available step
  const { step } = findNearestStep(availableSteps, clampedStep);

  return step;
}

/**
 * Generate all variants for a color group (core, alt, or accent)
 *
 * @param {string} baseColorRef - Base color reference (e.g., "teal.80" or "{colors.teal.80}")
 * @param {string} groupType - Group type: 'core', 'alt', or 'accent'
 * @param {Object} tokenData - Full token tree data (optional, uses defaults if not provided)
 * @returns {Object|null} - { family: string, variants: { main, light, soft, dark, faded } } or null if invalid
 *
 * @example
 * generateVariants("teal.80", "core", tokenTreeData)
 * // {
 * //   family: "teal",
 * //   variants: {
 * //     main: 80,
 * //     light: 30,
 * //     soft: 5,
 * //     dark: 400,
 * //     faded: 40
 * //   }
 * // }
 */
export function generateVariants(baseColorRef, groupType, tokenData = null) {
  // Validate group type
  if (!VARIANT_PATTERNS[groupType]) {
    console.error(`[ColorVariantGenerator] Invalid group type: "${groupType}". Must be one of: core, alt, accent`);
    return null;
  }

  // Parse base color
  const parsed = parseColorReference(baseColorRef);
  if (!parsed) {
    console.error(`[ColorVariantGenerator] Invalid color reference: "${baseColorRef}"`);
    return null;
  }

  const { family, level: baseStep } = parsed;

  // Get available steps for this family
  const availableSteps = tokenData
    ? getAvailableStepsForFamily(family, tokenData)
    : AVAILABLE_STEPS;

  // Validate base step exists
  if (!availableSteps.includes(baseStep)) {
    console.warn(
      `[ColorVariantGenerator] Base step ${baseStep} not found in family "${family}". ` +
      `Using nearest available step.`
    );
  }

  // Get pattern for this group
  const pattern = VARIANT_PATTERNS[groupType];
  const variants = {};

  // Calculate each variant
  for (const [variantName, config] of Object.entries(pattern)) {
    const { offset, clamp = 'none', fallback } = config;

    const step = calculateVariantStep(
      baseStep,
      offset,
      clamp,
      fallback,
      availableSteps
    );

    variants[variantName] = step;
  }

  return {
    family,
    variants
  };
}

/**
 * Generate core color variants
 * Convenience wrapper for generateVariants with 'core' type
 */
export function generateCoreVariants(baseColorRef, tokenData = null) {
  return generateVariants(baseColorRef, 'core', tokenData);
}

/**
 * Generate alt color variants
 * Convenience wrapper for generateVariants with 'alt' type
 */
export function generateAltVariants(baseColorRef, tokenData = null) {
  return generateVariants(baseColorRef, 'alt', tokenData);
}

/**
 * Generate accent color variants
 * Convenience wrapper for generateVariants with 'accent' type
 */
export function generateAccentVariants(baseColorRef, tokenData = null) {
  return generateVariants(baseColorRef, 'accent', tokenData);
}

/**
 * Generate all color variants for theme creation
 * Takes 3 base colors and returns complete mapping
 *
 * @param {Object} baseColors - { core, alt, accent } color references
 * @param {Object} tokenData - Full token tree data
 * @returns {Object} - Complete variant mapping
 *
 * @example
 * generateThemeColors({
 *   core: "teal.80",
 *   alt: "gray.700",
 *   accent: "coral.50"
 * }, tokenTreeData)
 * // {
 * //   core: { family: "teal", variants: { main: 80, light: 30, soft: 5, dark: 400, faded: 40 } },
 * //   alt: { family: "gray", variants: { main: 700, soft: 5, light: 10, dark: 900 } },
 * //   accent: { family: "coral", variants: { main: 50, soft: 5, light: 20, dark: 300 } }
 * // }
 */
export function generateThemeColors(baseColors, tokenData = null) {
  const result = {};

  if (baseColors.core) {
    result.core = generateCoreVariants(baseColors.core, tokenData);
  }

  if (baseColors.alt) {
    result.alt = generateAltVariants(baseColors.alt, tokenData);
  }

  if (baseColors.accent) {
    result.accent = generateAccentVariants(baseColors.accent, tokenData);
  }

  return result;
}

/**
 * Resolve a color path reference to its HEX value
 *
 * @param {string} colorRef - Color reference (e.g., "{colors.teal.70}")
 * @param {Object} tokenData - Full token tree data
 * @returns {string|null} - HEX color value or null if not found
 *
 * @example
 * resolveColorToHex("{colors.teal.70}", tokenTreeData) // "#00aec7"
 */
export function resolveColorToHex(colorRef, tokenData) {
  const parsed = parseColorReference(colorRef);
  if (!parsed) {
    return null;
  }

  const { family, level } = parsed;
  const token = tokenData?.global?.colors?.[family]?.[level];

  if (!token || !token.$value) {
    console.warn(`[ColorVariantGenerator] Color not found: ${colorRef}`);
    return null;
  }

  return token.$value;
}
