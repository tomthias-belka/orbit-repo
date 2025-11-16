// Exports for all type definitions
// Centralizes all types for easy importing

// Re-export all types from individual files
export * from './figma.js';
export * from './plugin.js';
export * from './tokens.js';
export * from './github.js';
export * from './library.js';

// Re-export utility types
export type {
  RGBColor,
  RGBAColor,
  ParsedColor
} from '../utils/colorUtils.js';

export type {
  GitHubConfig,
  GitHubUploadResult,
  GitHubFileInfo
} from '../utils/githubApi.js';

// Common utility types
export interface ProcessingResult<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
  warnings?: string[];
}

export interface BatchProcessingResult<T = any> extends ProcessingResult<T[]> {
  totalProcessed: number;
  successCount: number;
  errorCount: number;
  batchSize?: number;
}

export interface ExportResult {
  success: boolean;
  message: string;
  content?: string;
  filename?: string;
  files?: Array<{
    filename: string;
    content: string;
  }>;
}

export interface ImportResult {
  success: boolean;
  message: string;
  importedCount?: number;
  skippedCount?: number;
  errorCount?: number;
  details?: Array<{
    name: string;
    status: 'imported' | 'skipped' | 'error';
    message?: string;
  }>;
}

// Plugin-specific types
export interface PluginMessage {
  type: string;
  [key: string]: any;
}

export interface PluginState {
  isInitialized: boolean;
  currentOperation?: string;
  lastError?: string;
  collections?: VariableCollection[];
  textStyles?: TextStyle[];
}

// Error handling types
export interface ErrorContext {
  operation: string;
  details?: Record<string, any>;
  timestamp?: string;
}

export interface ErrorResult {
  shouldSkip: boolean;
  recovery?: () => void;
}

// Configuration types
export interface PluginConfig {
  ui: {
    width: number;
    height: number;
    resizable: boolean;
  };
  export: {
    defaultFormat: string;
    includeModes: boolean;
    includeMetadata: boolean;
  };
  import: {
    validateTypes: boolean;
    skipInvalidTokens: boolean;
    batchSize: number;
  };
  github?: GitHubConfig;
}

// Progress tracking types
export interface ProgressInfo {
  current: number;
  total: number;
  message?: string;
  percentage?: number;
}

export interface ProgressCallback {
  (progress: ProgressInfo): void;
}