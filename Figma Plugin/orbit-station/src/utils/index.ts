// Utilities Index
// Centralizes all utility functions for easy importing

// Color utilities
export {
  parseColor,
  parseHexColor,
  rgbToHex,
  rgbToCss,
  isValidRgbColor,
  isValidRgbaColor,
  isValidColorString,
  colorToCss,
  validateColorValues
} from './colorUtils.js';

export type {
  RGBColor,
  RGBAColor,
  ParsedColor
} from './colorUtils.js';

// Validation utilities
export {
  convertTypeToFigma,
  validateValueForVariableType,
  validateFloatValue,
  validateColorValue,
  validateStringValue,
  validateBooleanValue,
  isTokenAlias,
  extractAliasTokenName,
  validateTokenStructure,
  normalizeTokenStructure,
  validateTokenDataset,
  processSimpleValue
} from './validationUtils.js';

// GitHub utilities
export {
  uploadToGitHub,
  uploadMultipleFilesToGitHub,
  validateGitHubConfig,
  generateFileName,
  parseRepositoryUrl,
  testGitHubConnection
} from './githubApi.js';

export type {
  GitHubConfig,
  GitHubUploadResult,
  GitHubFileInfo
} from './githubApi.js';

// Utility functions that might be commonly used together
export function createProgressCallback(
  onProgress?: (current: number, total: number, message?: string) => void
) {
  return (current: number, total: number, message?: string) => {
    if (onProgress) {
      onProgress(current, total, message);
    }

    // Also send to Figma UI if available
    if (typeof figma !== 'undefined' && figma.ui) {
      figma.ui.postMessage({
        type: 'progress-update',
        progress: {
          current,
          total,
          percentage: Math.round((current / total) * 100),
          message
        }
      });
    }
  };
}

// Common validation helpers
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function generateTimestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as unknown as T;
  }

  const cloned = {} as T;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }

  return cloned;
}