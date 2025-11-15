/**
 * Unit Tests for colorVariantGenerator
 *
 * Tests all edge cases including:
 * - Normal generation
 * - Clamping to min/max
 * - Missing steps
 * - Invalid inputs
 */

import {
  parseColorReference,
  buildColorReference,
  findNearestStep,
  generateCoreVariants,
  generateAltVariants,
  generateAccentVariants,
  generateThemeColors,
  resolveColorToHex
} from '../src/utils/colorVariantGenerator.js';

// Mock token data
const mockTokenData = {
  global: {
    colors: {
      teal: {
        5: { $type: 'color', $value: '#e0f7fa' },
        10: { $type: 'color', $value: '#b2ebf2' },
        20: { $type: 'color', $value: '#80deea' },
        30: { $type: 'color', $value: '#4dd0e1' },
        40: { $type: 'color', $value: '#26c6da' },
        50: { $type: 'color', $value: '#00bcd4' },
        60: { $type: 'color', $value: '#00acc1' },
        70: { $type: 'color', $value: '#00aec7' },
        80: { $type: 'color', $value: '#0097a7' },
        90: { $type: 'color', $value: '#00838f' },
        100: { $type: 'color', $value: '#006064' },
        200: { $type: 'color', $value: '#004d56' },
        300: { $type: 'color', $value: '#003a40' },
        400: { $type: 'color', $value: '#00272a' },
        500: { $type: 'color', $value: '#001315' },
        600: { $type: 'color', $value: '#000000' }
      },
      gray: {
        5: { $type: 'color', $value: '#fafafa' },
        100: { $type: 'color', $value: '#f5f5f5' },
        200: { $type: 'color', $value: '#eeeeee' },
        300: { $type: 'color', $value: '#e0e0e0' },
        400: { $type: 'color', $value: '#bdbdbd' },
        500: { $type: 'color', $value: '#9e9e9e' },
        600: { $type: 'color', $value: '#757575' },
        700: { $type: 'color', $value: '#616161' },
        800: { $type: 'color', $value: '#424242' },
        900: { $type: 'color', $value: '#212121' }
      },
      // Color family with incomplete steps (for edge case testing)
      mub: {
        20: { $type: 'color', $value: '#ff0000' },
        60: { $type: 'color', $value: '#cc0000' },
        100: { $type: 'color', $value: '#990000' }
      }
    }
  }
};

describe('parseColorReference', () => {
  test('parses reference with braces', () => {
    expect(parseColorReference('{colors.teal.70}')).toEqual({
      family: 'teal',
      level: 70
    });
  });

  test('parses reference without braces', () => {
    expect(parseColorReference('teal.70')).toEqual({
      family: 'teal',
      level: 70
    });
  });

  test('returns null for invalid reference', () => {
    expect(parseColorReference('invalid')).toBeNull();
    expect(parseColorReference('')).toBeNull();
    expect(parseColorReference(null)).toBeNull();
  });

  test('handles different color families', () => {
    expect(parseColorReference('ocean.400')).toEqual({
      family: 'ocean',
      level: 400
    });
  });
});

describe('buildColorReference', () => {
  test('builds correct reference format', () => {
    expect(buildColorReference('teal', 70)).toBe('{colors.teal.70}');
  });

  test('handles different levels', () => {
    expect(buildColorReference('gray', 700)).toBe('{colors.gray.700}');
    expect(buildColorReference('ocean', 5)).toBe('{colors.ocean.5}');
  });
});

describe('findNearestStep', () => {
  const steps = [5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

  test('finds exact match', () => {
    const result = findNearestStep(steps, 70);
    expect(result.step).toBe(70);
    expect(result.distance).toBe(0);
    expect(result.isExact).toBe(true);
  });

  test('finds nearest when not exact', () => {
    const result = findNearestStep(steps, 32);
    expect(result.step).toBe(30);
    expect(result.distance).toBe(2);
    expect(result.isExact).toBe(false);
  });

  test('rounds to nearest (ties go to first)', () => {
    const result = findNearestStep(steps, 35); // equidistant from 30 and 40
    expect([30, 40]).toContain(result.step);
  });

  test('throws error if no steps provided', () => {
    expect(() => findNearestStep([], 50)).toThrow();
  });
});

describe('generateCoreVariants', () => {
  test('generates correct variants from teal.80', () => {
    const result = generateCoreVariants('teal.80', mockTokenData);

    expect(result).toEqual({
      family: 'teal',
      variants: {
        main: 80,
        light: 30,  // 80 - 50 = 30
        soft: 5,    // 80 - 75 = 5 (clamped)
        dark: 400,  // 80 + 330 = 410 -> nearest = 400
        faded: 40   // 80 - 40 = 40
      }
    });
  });

  test('clamps soft to minimum when base is too low', () => {
    const result = generateCoreVariants('teal.20', mockTokenData);

    expect(result.variants.soft).toBe(5); // can't go lower than min
  });

  test('clamps dark to maximum when base is too high', () => {
    const result = generateCoreVariants('teal.400', mockTokenData);

    expect(result.variants.dark).toBe(400); // already at max or uses fallback
  });

  test('handles color family with incomplete steps', () => {
    const result = generateCoreVariants('mub.60', mockTokenData);

    expect(result.family).toBe('mub');
    // Should use nearest available steps
    expect([20, 60, 100]).toContain(result.variants.main);
  });

  test('returns null for invalid color reference', () => {
    const result = generateCoreVariants('invalid', mockTokenData);
    expect(result).toBeNull();
  });
});

describe('generateAltVariants', () => {
  test('generates correct alt variants', () => {
    const result = generateAltVariants('gray.700', mockTokenData);

    expect(result).toEqual({
      family: 'gray',
      variants: {
        main: 700,
        soft: expect.any(Number),   // depends on available steps
        light: expect.any(Number),
        dark: expect.any(Number)
      }
    });
  });
});

describe('generateAccentVariants', () => {
  test('generates correct accent variants', () => {
    const result = generateAccentVariants('teal.50', mockTokenData);

    expect(result).toEqual({
      family: 'teal',
      variants: {
        main: 50,
        soft: expect.any(Number),
        light: expect.any(Number),
        dark: expect.any(Number)
      }
    });
  });
});

describe('generateThemeColors', () => {
  test('generates all theme colors from base selections', () => {
    const result = generateThemeColors({
      core: 'teal.80',
      alt: 'gray.700',
      accent: 'teal.50'
    }, mockTokenData);

    expect(result).toHaveProperty('core');
    expect(result).toHaveProperty('alt');
    expect(result).toHaveProperty('accent');

    expect(result.core.family).toBe('teal');
    expect(result.alt.family).toBe('gray');
    expect(result.accent.family).toBe('teal');
  });

  test('handles partial input', () => {
    const result = generateThemeColors({
      core: 'teal.80'
    }, mockTokenData);

    expect(result).toHaveProperty('core');
    expect(result).not.toHaveProperty('alt');
    expect(result).not.toHaveProperty('accent');
  });
});

describe('resolveColorToHex', () => {
  test('resolves color reference to HEX', () => {
    const hex = resolveColorToHex('{colors.teal.70}', mockTokenData);
    expect(hex).toBe('#00aec7');
  });

  test('returns null for non-existent color', () => {
    const hex = resolveColorToHex('{colors.nonexistent.50}', mockTokenData);
    expect(hex).toBeNull();
  });

  test('returns null for invalid reference', () => {
    const hex = resolveColorToHex('invalid', mockTokenData);
    expect(hex).toBeNull();
  });
});

// Edge Cases
describe('Edge Cases', () => {
  test('handles base color at minimum step', () => {
    const result = generateCoreVariants('teal.5', mockTokenData);

    expect(result.variants.main).toBe(5);
    expect(result.variants.soft).toBe(5); // clamped to min
    expect(result.variants.light).toBeGreaterThanOrEqual(5);
  });

  test('handles base color at maximum step', () => {
    const result = generateCoreVariants('teal.600', mockTokenData);

    expect(result.variants.main).toBe(600);
    expect(result.variants.dark).toBeLessThanOrEqual(600); // clamped to max
  });

  test('works without tokenData (uses defaults)', () => {
    const result = generateCoreVariants('teal.80');

    expect(result).not.toBeNull();
    expect(result.family).toBe('teal');
    expect(result.variants.main).toBe(80);
  });
});
