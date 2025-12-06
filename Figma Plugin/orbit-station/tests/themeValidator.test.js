/**
 * Unit Tests for themeValidator
 */

import {
  validateThemeName,
  validateColorPath,
  validateTheme,
  isDuplicateTheme,
  validateTokenStructure,
  generateValidationReport
} from '../src/utils/themeValidator.js';

// Mock token data (same as colorVariantGenerator tests)
const mockTokenData = {
  global: {
    colors: {
      teal: {
        5: { $type: 'color', $value: '#e0f7fa' },
        30: { $type: 'color', $value: '#4dd0e1' },
        70: { $type: 'color', $value: '#00aec7' },
        400: { $type: 'color', $value: '#00272a' }
      },
      gray: {
        700: { $type: 'color', $value: '#616161' }
      }
    }
  },
  semantic: {
    brand: {
      core: {
        main: {
          $type: 'color',
          $value: {
            clara: '{colors.teal.70}',
            mooney: '{colors.gray.700}'
          }
        },
        light: {
          $type: 'color',
          $value: {
            clara: '{colors.teal.30}',
            mooney: '{colors.gray.700}'
          }
        },
        soft: {
          $type: 'color',
          $value: {
            clara: '{colors.teal.5}',
            mooney: '{colors.gray.700}'
          }
        },
        dark: {
          $type: 'color',
          $value: {
            clara: '{colors.teal.400}',
            mooney: '{colors.gray.700}'
          }
        },
        faded: {
          $type: 'color',
          $value: {
            clara: '{colors.teal.30}',
            mooney: '{colors.gray.700}'
          }
        }
      },
      alt: {
        main: { $type: 'color', $value: { clara: '{colors.gray.700}' } }
      },
      accent: {
        main: { $type: 'color', $value: { clara: '{colors.teal.70}' } }
      }
    }
  }
};

describe('validateThemeName', () => {
  test('accepts valid theme name', () => {
    const result = validateThemeName('mybrand');
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('accepts hyphens and underscores', () => {
    expect(validateThemeName('my-brand').isValid).toBe(true);
    expect(validateThemeName('my_brand').isValid).toBe(true);
    expect(validateThemeName('my-brand_v2').isValid).toBe(true);
  });

  test('rejects empty name', () => {
    const result = validateThemeName('');
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test('rejects special characters', () => {
    const result = validateThemeName('my brand!');
    expect(result.isValid).toBe(false);
  });

  test('rejects reserved names', () => {
    expect(validateThemeName('default').isValid).toBe(false);
    expect(validateThemeName('null').isValid).toBe(false);
  });

  test('warns about spaces', () => {
    const result = validateThemeName('my brand');
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  test('warns about uppercase', () => {
    const result = validateThemeName('MyBrand');
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  test('rejects too short names', () => {
    const result = validateThemeName('a');
    expect(result.isValid).toBe(false);
  });

  test('rejects too long names', () => {
    const longName = 'a'.repeat(51);
    const result = validateThemeName(longName);
    expect(result.isValid).toBe(false);
  });
});

describe('validateColorPath', () => {
  test('validates correct color path with token data', () => {
    const result = validateColorPath('{colors.teal.70}', mockTokenData);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('validates short format without braces', () => {
    const result = validateColorPath('teal.70', mockTokenData);
    expect(result.isValid).toBe(true);
  });

  test('rejects non-existent family', () => {
    const result = validateColorPath('{colors.nonexistent.70}', mockTokenData);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test('rejects non-existent level', () => {
    const result = validateColorPath('{colors.teal.999}', mockTokenData);
    expect(result.isValid).toBe(false);
    expect(result.warnings.length).toBeGreaterThan(0); // suggests nearest
  });

  test('rejects invalid format', () => {
    const result = validateColorPath('invalid', mockTokenData);
    expect(result.isValid).toBe(false);
  });

  test('rejects empty reference', () => {
    const result = validateColorPath('', mockTokenData);
    expect(result.isValid).toBe(false);
  });

  test('works without token data (format validation only)', () => {
    const result = validateColorPath('{colors.teal.70}', null);
    expect(result.isValid).toBe(true); // only validates format
  });
});

describe('validateTheme', () => {
  test('validates complete theme', () => {
    const result = validateTheme('clara', mockTokenData);
    expect(result.isValid).toBe(true);
  });

  test('detects missing core colors', () => {
    const incompleteData = JSON.parse(JSON.stringify(mockTokenData));
    delete incompleteData.semantic.brand.core.main.$value.mooney;

    const result = validateTheme('mooney', incompleteData);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('brand.core.main'))).toBe(true);
  });

  test('warns about missing alt colors', () => {
    const result = validateTheme('mooney', mockTokenData);
    // mooney is incomplete in mock data
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  test('detects invalid color references', () => {
    const invalidData = JSON.parse(JSON.stringify(mockTokenData));
    invalidData.semantic.brand.core.main.$value.clara = '{colors.invalid.999}';

    const result = validateTheme('clara', invalidData);
    expect(result.isValid).toBe(false);
  });
});

describe('isDuplicateTheme', () => {
  test('detects existing theme', () => {
    expect(isDuplicateTheme('clara', mockTokenData)).toBe(true);
    expect(isDuplicateTheme('mooney', mockTokenData)).toBe(true);
  });

  test('returns false for new theme', () => {
    expect(isDuplicateTheme('newtheme', mockTokenData)).toBe(false);
  });

  test('is case-insensitive', () => {
    expect(isDuplicateTheme('CLARA', mockTokenData)).toBe(true);
    expect(isDuplicateTheme('Clara', mockTokenData)).toBe(true);
  });
});

describe('validateTokenStructure', () => {
  test('validates correct structure', () => {
    const result = validateTokenStructure(mockTokenData);
    expect(result.isValid).toBe(true);
  });

  test('detects missing global section', () => {
    const invalidData = { semantic: {} };
    const result = validateTokenStructure(invalidData);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('global'))).toBe(true);
  });

  test('detects missing semantic section', () => {
    const invalidData = { global: { colors: {} } };
    const result = validateTokenStructure(invalidData);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('semantic'))).toBe(true);
  });

  test('warns about missing alt/accent', () => {
    const incompleteData = {
      global: { colors: {} },
      semantic: { brand: { core: {} } }
    };
    const result = validateTokenStructure(incompleteData);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});

describe('generateValidationReport', () => {
  test('generates report for all themes', () => {
    const report = generateValidationReport(mockTokenData);

    expect(report).toHaveProperty('timestamp');
    expect(report).toHaveProperty('themes');
    expect(report.themes).toHaveProperty('clara');
    expect(report.themes).toHaveProperty('mooney');
  });

  test('marks overall status correctly', () => {
    const report = generateValidationReport(mockTokenData);

    // clara should be valid, mooney might have warnings
    expect(report.themes.clara.valid).toBe(true);
  });

  test('handles invalid structure', () => {
    const invalidData = {};
    const report = generateValidationReport(invalidData);

    expect(report.overallValid).toBe(false);
    expect(report).toHaveProperty('structureErrors');
  });
});
