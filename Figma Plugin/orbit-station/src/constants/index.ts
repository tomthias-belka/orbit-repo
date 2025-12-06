// Plugin Constants

export const PLUGIN_NAME = 'Clara Tokens';
export const PLUGIN_VERSION = '1.0.0';

// Message Types
export const MESSAGE_TYPES = {
  UI_READY: 'ui-ready',
  INIT_DATA: 'init-data',
  GET_COLLECTIONS: 'get-collections',
  COLLECTIONS_DATA: 'collections-data',
  IMPORT_JSON: 'import-json',
  IMPORT_VARIABLES: 'import-variables',
  IMPORT_RESULT: 'import-result',
  EXPORT_JSON: 'export-json',
  EXPORT_JSON_ADVANCED: 'export-json-advanced',
  EXPORT_TEXT_STYLES: 'export-text-styles',
  JSON_RESULT: 'json-result',
  JSON_ADVANCED_RESULT: 'json-advanced-result',
  TEXT_STYLES_RESULT: 'text-styles-export-result',
  RESIZE: 'resize',
  PROGRESS_UPDATE: 'progress-update',
  ERROR: 'error',
  RENAME_COLLECTION: 'rename-collection',
  DELETE_COLLECTION: 'delete-collection',
  CLEAR_ALL_COLLECTIONS: 'clear-all-collections',
  COLLECTION_MANAGEMENT_RESULT: 'collection-management-result',
  PREVIEW_IMPORT: 'preview-import',
  PREVIEW_RESULT: 'preview-result',
  // Library support messages
  BROWSE_LIBRARY: 'browse-library',
  LIBRARY_COLLECTIONS_DATA: 'library-collections-data',
  GET_LIBRARY_VARIABLES: 'get-library-variables',
  LIBRARY_VARIABLES_DATA: 'library-variables-data',
  IMPORT_FROM_LIBRARY: 'import-from-library',
  LIBRARY_IMPORT_RESULT: 'library-import-result'
} as const;

// Export Formats
export const EXPORT_FORMATS = {
  W3C_DESIGN_TOKENS: 'w3c-design-tokens'
} as const;

// Token Types Mapping
export const FIGMA_TO_TOKEN_TYPE = {
  COLOR: 'color',
  FLOAT: 'number',
  STRING: 'string',
  BOOLEAN: 'boolean'
} as const;

export const TOKEN_STUDIO_TO_W3C_TYPE = {
  color: 'color',
  spacing: 'number',
  dimension: 'number',
  size: 'number',
  typography: 'typography',
  fontFamily: 'fontFamily',
  fontWeight: 'fontWeight',
  string: 'string',
  text: 'string',
  boolean: 'boolean'
} as const;

// Default Values
export const DEFAULT_COLLECTION_NAME = 'Imported Variables';
export const DEFAULT_MODE_NAME = 'Mode 1';

// File Extensions
export const FILE_EXTENSIONS = {
  JSON: '.json'
} as const;

// Progress Messages
export const PROGRESS_MESSAGES = {
  ANALYZING: 'Analyzing JSON structure...',
  PROCESSING: 'Processing tokens...',
  CREATING_VARIABLES: 'Creating variables...',
  CREATING_COLLECTIONS: 'Creating collections...',
  RESOLVING_ALIASES: 'Resolving token aliases...',
  VALIDATING: 'Validating data...',
  EXPORTING: 'Generating export...',
  COMPLETE: 'Operation completed successfully!'
} as const;

// Error Codes
export const ERROR_CODES = {
  INVALID_JSON: 'INVALID_JSON',
  MISSING_FONT: 'MISSING_FONT',
  TYPE_MISMATCH: 'TYPE_MISMATCH',
  ALIAS_CIRCULAR: 'ALIAS_CIRCULAR',
  ALIAS_NOT_FOUND: 'ALIAS_NOT_FOUND',
  COLLECTION_LIMIT: 'COLLECTION_LIMIT',
  MODE_LIMIT: 'MODE_LIMIT'
} as const;

// Limits
export const LIMITS = {
  MAX_COLLECTIONS: 40,
  MAX_MODES_PER_COLLECTION: 20,
  MAX_VARIABLES_PER_COLLECTION: 5000,
  MAX_ALIAS_DEPTH: 10
} as const;

// UI Configuration
export const UI_CONFIG = {
  DEFAULT_WIDTH: 800,
  DEFAULT_HEIGHT: 600,
  MIN_WIDTH: 320,
  MIN_HEIGHT: 400,
  PANEL_MIN_WIDTH: 300,
  PANEL_MAX_WIDTH_RATIO: 0.6
} as const;