/**
 * Theme Validator
 *
 * Validates theme integrity, color references, and token structure.
 * Provides detailed error reporting for troubleshooting.
 *
 * @module themeValidator
 */

import { parseColorReference } from './colorVariantGenerator.js';

/**
 * Validation result structure
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Overall validation status
 * @property {Array} errors - Array of error messages
 * @property {Array} warnings - Array of warning messages
 */

/**
 * Validate a theme name
 *
 * @param {string} themeName - Theme name to validate
 * @returns {ValidationResult}
 */
export function validateThemeName(themeName) {
  const errors = [];
  const warnings = [];

  if (!themeName || typeof themeName !== 'string') {
    errors.push('Theme name is required');
    return { isValid: false, errors, warnings };
  }

  const trimmed = themeName.trim();

  if (trimmed.length === 0) {
    errors.push('Theme name cannot be empty');
  }

  if (trimmed.length < 2) {
    errors.push('Theme name must be at least 2 characters');
  }

  if (trimmed.length > 50) {
    errors.push('Theme name must be less than 50 characters');
  }

  // Only allow lowercase letters, numbers, hyphens, underscores
  if (!/^[a-z0-9\-_]+$/i.test(trimmed)) {
    errors.push('Theme name can only contain letters, numbers, hyphens, and underscores');
  }

  // Warn about spaces or uppercase
  if (/\s/.test(themeName)) {
    warnings.push('Theme name contains spaces (will be converted to hyphens)');
  }

  if (/[A-Z]/.test(themeName)) {
    warnings.push('Theme name contains uppercase letters (will be converted to lowercase)');
  }

  // Reserved names
  const reservedNames = ['default', 'null', 'undefined', 'none'];
  if (reservedNames.includes(trimmed.toLowerCase())) {
    errors.push(`"${trimmed}" is a reserved name`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate a color reference path
 *
 * @param {string} colorRef - Color reference (e.g., "{colors.teal.70}")
 * @param {Object} tokenData - Full token tree data
 * @returns {ValidationResult}
 */
export function validateColorPath(colorRef, tokenData) {
  const errors = [];
  const warnings = [];

  if (!colorRef || typeof colorRef !== 'string') {
    errors.push('Color reference is required');
    return { isValid: false, errors, warnings };
  }

  // Parse reference
  const parsed = parseColorReference(colorRef);

  if (!parsed) {
    errors.push(`Invalid color reference format: "${colorRef}". Expected format: "{colors.family.level}" or "family.level"`);
    return { isValid: false, errors, warnings };
  }

  const { family, level } = parsed;

  // Check if family exists in token data
  if (tokenData) {
    const familyData = tokenData.global?.colors?.[family];

    if (!familyData) {
      errors.push(`Color family "${family}" not found in token data`);
      return { isValid: false, errors, warnings };
    }

    // Check if level exists
    const levelData = familyData[level];

    if (!levelData) {
      errors.push(`Color level "${level}" not found in family "${family}"`);

      // Suggest nearest available level
      const availableLevels = Object.keys(familyData)
        .map(k => parseInt(k, 10))
        .filter(n => !isNaN(n))
        .sort((a, b) => a - b);

      if (availableLevels.length > 0) {
        const nearest = availableLevels.reduce((prev, curr) =>
          Math.abs(curr - level) < Math.abs(prev - level) ? curr : prev
        );
        warnings.push(`Nearest available level is ${nearest}`);
      }

      return { isValid: false, errors, warnings };
    }

    // Check if it's actually a color type
    if (levelData.$type !== 'color') {
      errors.push(`Token at "${colorRef}" is not a color (type: ${levelData.$type})`);
      return { isValid: false, errors, warnings };
    }

    // Check if it has a value
    if (!levelData.$value) {
      errors.push(`Token at "${colorRef}" has no value`);
      return { isValid: false, errors, warnings };
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate a complete theme structure
 *
 * @param {string} themeId - Theme ID to validate
 * @param {Object} tokenData - Full token tree data
 * @returns {ValidationResult}
 */
export function validateTheme(themeId, tokenData) {
  const errors = [];
  const warnings = [];

  if (!tokenData || !tokenData.semantic) {
    errors.push('Invalid token data structure');
    return { isValid: false, errors, warnings };
  }

  const semantic = tokenData.semantic;

  // Check brand.core colors
  const requiredCorePaths = ['main', 'light', 'soft', 'dark', 'faded'];
  for (const variant of requiredCorePaths) {
    const path = semantic.brand?.core?.[variant];

    if (!path) {
      errors.push(`Missing semantic.brand.core.${variant}`);
      continue;
    }

    if (!path.$value || !path.$value[themeId]) {
      errors.push(`Theme "${themeId}" missing value for brand.core.${variant}`);
      continue;
    }

    // Validate the color reference
    const colorRef = path.$value[themeId];
    const validation = validateColorPath(colorRef, tokenData);

    if (!validation.isValid) {
      errors.push(`Invalid brand.core.${variant}: ${validation.errors.join(', ')}`);
    }
  }

  // Check brand.alt colors
  const requiredAltPaths = ['main', 'soft', 'light', 'dark'];
  for (const variant of requiredAltPaths) {
    const path = semantic.brand?.alt?.[variant];

    if (!path) {
      warnings.push(`Missing semantic.brand.alt.${variant}`);
      continue;
    }

    if (!path.$value || !path.$value[themeId]) {
      warnings.push(`Theme "${themeId}" missing value for brand.alt.${variant}`);
      continue;
    }

    const colorRef = path.$value[themeId];
    const validation = validateColorPath(colorRef, tokenData);

    if (!validation.isValid) {
      warnings.push(`Invalid brand.alt.${variant}: ${validation.errors.join(', ')}`);
    }
  }

  // Check brand.accent colors
  const requiredAccentPaths = ['main', 'soft', 'light', 'dark'];
  for (const variant of requiredAccentPaths) {
    const path = semantic.brand?.accent?.[variant];

    if (!path) {
      warnings.push(`Missing semantic.brand.accent.${variant}`);
      continue;
    }

    if (!path.$value || !path.$value[themeId]) {
      warnings.push(`Theme "${themeId}" missing value for brand.accent.${variant}`);
      continue;
    }

    const colorRef = path.$value[themeId];
    const validation = validateColorPath(colorRef, tokenData);

    if (!validation.isValid) {
      warnings.push(`Invalid brand.accent.${variant}: ${validation.errors.join(', ')}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Check for duplicate theme names
 *
 * @param {string} themeName - Proposed theme name
 * @param {Object} tokenData - Full token tree data
 * @returns {boolean} - True if duplicate found
 */
export function isDuplicateTheme(themeName, tokenData) {
  const coreMain = tokenData?.semantic?.brand?.core?.main?.$value;

  if (!coreMain || typeof coreMain !== 'object') {
    return false;
  }

  return Object.keys(coreMain).includes(themeName.toLowerCase());
}

/**
 * Validate complete token data structure
 * Checks for required top-level structures
 *
 * @param {Object} tokenData - Full token tree data
 * @returns {ValidationResult}
 */
export function validateTokenStructure(tokenData) {
  const errors = [];
  const warnings = [];

  if (!tokenData || typeof tokenData !== 'object') {
    errors.push('Token data must be an object');
    return { isValid: false, errors, warnings };
  }

  // Check for required top-level keys
  if (!tokenData.global) {
    errors.push('Missing "global" section in token data');
  } else {
    if (!tokenData.global.colors) {
      errors.push('Missing "global.colors" in token data');
    }
  }

  if (!tokenData.semantic) {
    errors.push('Missing "semantic" section in token data');
  } else {
    if (!tokenData.semantic.brand) {
      errors.push('Missing "semantic.brand" in token data');
    } else {
      if (!tokenData.semantic.brand.core) {
        errors.push('Missing "semantic.brand.core" in token data');
      }
      if (!tokenData.semantic.brand.alt) {
        warnings.push('Missing "semantic.brand.alt" in token data');
      }
      if (!tokenData.semantic.brand.accent) {
        warnings.push('Missing "semantic.brand.accent" in token data');
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Generate a validation report for all themes
 *
 * @param {Object} tokenData - Full token tree data
 * @returns {Object} - Report with validation results for each theme
 */
export function generateValidationReport(tokenData) {
  const report = {
    timestamp: new Date().toISOString(),
    overallValid: true,
    themes: {}
  };

  // Validate overall structure first
  const structureValidation = validateTokenStructure(tokenData);

  if (!structureValidation.isValid) {
    report.overallValid = false;
    report.structureErrors = structureValidation.errors;
    return report;
  }

  // Get all themes
  const coreMain = tokenData.semantic?.brand?.core?.main?.$value;

  if (!coreMain) {
    report.overallValid = false;
    report.error = 'No themes found';
    return report;
  }

  // Validate each theme
  for (const themeId of Object.keys(coreMain)) {
    const validation = validateTheme(themeId, tokenData);

    report.themes[themeId] = {
      valid: validation.isValid,
      errors: validation.errors,
      warnings: validation.warnings
    };

    if (!validation.isValid) {
      report.overallValid = false;
    }
  }

  return report;
}
