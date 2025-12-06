// Luckino Import Export Plugin - Figma-Compatible Version
// This file consolidates all modules into a single file for Figma compatibility

// console.clear();

// ================== ALIAS/REFERENCE SYSTEM TYPES ==================

// Marker object for unresolved aliases
interface AliasMarker {
  __isAlias: true;
  referencePath: string; // e.g., "stroke.inverted" or "collection.variable"
}

// Structure for storing pending aliases (STEP 1)
interface PendingAlias {
  variable: Variable; // The variable that will receive the alias
  modeId: string;
  referencePath: string; // e.g., "stroke.inverted"
  figmaType: 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN';
}

// Type guard for AliasMarker
function isAliasMarker(value: any): value is AliasMarker {
  return typeof value === 'object' && value !== null && value.__isAlias === true;
}

// Global arrays for two-pass system
const pendingAliases: PendingAlias[] = [];
let localVariablesCache: Variable[] | null = null;

// ================== END ALIAS SYSTEM TYPES ==================

// Constants (from constants/index.ts)
const MESSAGE_TYPES = {
  UI_READY: 'ui-ready',
  INIT_DATA: 'init-data',
  GET_COLLECTIONS: 'get-collections',
  COLLECTIONS_DATA: 'collections-data',
  IMPORT_JSON: 'import-json',
  IMPORT_VARIABLES: 'import-variables',
  IMPORT_RESULT: 'import-result',
  EXPORT_JSON: 'export-json',
  EXPORT_JSON_ADVANCED: 'export-json-advanced',
  EXPORT_CSS: 'export-css',
  EXPORT_CSS_ADVANCED: 'export-css-advanced',
  EXPORT_TEXT_STYLES: 'export-text-styles',
  JSON_RESULT: 'json-result',
  JSON_ADVANCED_RESULT: 'json-advanced-result',
  CSS_RESULT: 'css-result',
  CSS_ADVANCED_RESULT: 'css-advanced-result',
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
  LIBRARY_IMPORT_RESULT: 'library-import-result',
  // GitHub integration messages
  GITHUB_TEST_CONNECTION: 'github-test-connection',
  GITHUB_CONFIG_SAVE: 'github-config-save',
  GITHUB_CONFIG_LOAD: 'github-config-load',
  GITHUB_PUSH: 'github-push'
} as const;

const UI_CONFIG = {
  DEFAULT_WIDTH: 980,
  DEFAULT_HEIGHT: 700,
  MIN_WIDTH: 400,
  MIN_HEIGHT: 300
} as const;

const FIGMA_TO_TOKEN_TYPE = {
  COLOR: 'color',
  FLOAT: 'number',
  STRING: 'string',
  BOOLEAN: 'boolean'
} as const;

// Enhanced scope-to-type mapping based on variable usage - aligned with diagram
const SCOPE_TO_TYPE_MAPPING = {
  // Dimension/Size scopes - aligned with diagram
  'CORNER_RADIUS': 'borderRadius',
  'GAP': 'spacing',
  'WIDTH_HEIGHT': 'size',
  'STROKE_FLOAT': 'strokeWidth',
  'STROKE': 'strokeWidth', // Also covers lineWidth from diagram

  // Opacity/Effects - aligned with diagram (effects/shadow)
  'LAYER_OPACITY': 'opacity',
  'EFFECTS': 'shadow',

  // Color scopes
  'FILLS': 'fill',
  'STROKES': 'stroke',
  'TEXT_COLOR': 'textColor', // Also covers text-color from diagram
  'ALL_FILLS': 'color',
  'FRAME_FILL': 'color',
  'SHAPE_FILL': 'color',
  'TEXT_FILL': 'color',
  'STROKE_COLOR': 'color',
  'EFFECT_COLOR': 'color',

  // Typography scopes - aligned with diagram variants
  'FONT_FAMILY': 'fontFamily', // Also covers font-family from diagram
  'FONT_WEIGHT': 'fontWeight', // Also covers font-weight from diagram
  'FONT_STYLE': 'fontWeight', // Figma uses FONT_STYLE scope for fontWeight strings
  'FONT_SIZE': 'fontSize', // Also covers font-size from diagram
  'LINE_HEIGHT': 'lineHeight', // Also covers line-height from diagram
  'LETTER_SPACING': 'letterSpacing', // Also covers letter-spacing from diagram
  'PARAGRAPH_SPACING': 'paragraphSpacing', // Also covers paragraph-spacing from diagram
  'PARAGRAPH_INDENT': 'paragraphIndent', // Also covers paragraph-indent from diagram
  'TEXT_CONTENT': 'string'
} as const;

// Enhanced function to determine type based on scopes and fallback to resolvedType
// ========================
// AdvancedAliasResolver
// ========================

interface VariableAlias {
  type: 'VARIABLE_ALIAS';
  id: string;
}

interface AliasResolutionOptions {
  maxDepth?: number;
  format?: 'css' | 'json' | 'tokens';
  variableMap?: Map<string, Variable>;
  nameTransform?: (name: string) => string;
}

interface AliasResolutionResult {
  success: boolean;
  resolvedValue: string | null;
  originalValue?: any;
  error?: string;
  depth?: number;
  referencedVariableName?: string;
}

/**
 * AdvancedAliasResolver - Gestisce la risoluzione robusta degli alias di variabili
 */
class AdvancedAliasResolver {
  private resolutionCache = new Map<string, AliasResolutionResult>();
  private resolutionStack = new Set<string>();
  private defaultMaxDepth = 10;

  constructor(private variableMap?: Map<string, Variable>) { }

  /**
   * Risolve un alias di variabile
   */
  async resolveAlias(
    aliasValue: any,
    options: AliasResolutionOptions = {}
  ): Promise<AliasResolutionResult> {
    this.resolutionStack.clear();
    return await this.resolveAliasInternal(aliasValue, options, 0);
  }

  /**
   * Risoluzione interna ricorsiva
   */
  private async resolveAliasInternal(
    aliasValue: any,
    options: AliasResolutionOptions,
    currentDepth: number
  ): Promise<AliasResolutionResult> {
    const maxDepth = options.maxDepth || this.defaultMaxDepth;

    if (currentDepth >= maxDepth) {
      return {
        success: false,
        resolvedValue: null,
        error: `Max resolution depth (${maxDepth}) exceeded`,
        depth: currentDepth
      };
    }

    if (!this.isVariableAlias(aliasValue)) {
      return {
        success: false,
        resolvedValue: null,
        error: 'Value is not a variable alias',
        originalValue: aliasValue
      };
    }

    const aliasId = aliasValue.id;
    const cacheKey = `${aliasId}_${options.format}_${currentDepth}`;

    if (this.resolutionCache.has(cacheKey)) {
      return this.resolutionCache.get(cacheKey)!;
    }

    if (this.resolutionStack.has(aliasId)) {
      const result: AliasResolutionResult = {
        success: false,
        resolvedValue: null,
        error: `Circular reference detected for variable ID: ${aliasId}`,
        depth: currentDepth
      };
      this.resolutionCache.set(cacheKey, result);
      return result;
    }

    this.resolutionStack.add(aliasId);

    try {
      const referencedVariable = await this.findReferencedVariable(aliasId, options.variableMap);

      if (!referencedVariable) {
        const result: AliasResolutionResult = {
          success: false,
          resolvedValue: this.generateFallbackValue(aliasId, options.format),
          error: `Referenced variable not found for ID: ${aliasId}`,
          depth: currentDepth
        };
        this.resolutionCache.set(cacheKey, result);
        return result;
      }

      const resolvedValue = this.generateResolvedValue(referencedVariable, options, currentDepth);

      const result: AliasResolutionResult = {
        success: true,
        resolvedValue,
        depth: currentDepth,
        referencedVariableName: referencedVariable.name
      };

      this.resolutionCache.set(cacheKey, result);
      return result;

    } finally {
      this.resolutionStack.delete(aliasId);
    }
  }

  /**
   * Verifica se un valore è un alias di variabile
   */
  private isVariableAlias(value: any): value is VariableAlias {
    return value &&
      typeof value === 'object' &&
      value.type === 'VARIABLE_ALIAS' &&
      typeof value.id === 'string';
  }

  /**
   * Trova la variabile referenziata
   */
  private async findReferencedVariable(
    aliasId: string,
    variableMap?: Map<string, Variable>
  ): Promise<Variable | null> {

    // Prova prima con la mappa fornita (più veloce)
    if (variableMap && variableMap.has(aliasId)) {
      return variableMap.get(aliasId)!;
    }

    // Prova con la mappa interna
    if (this.variableMap && this.variableMap.has(aliasId)) {
      return this.variableMap.get(aliasId)!;
    }

    // DIAGNOSTIC: Log available keys if not found
    if (variableMap && variableMap.size > 0) {
      const sampleKeys = Array.from(variableMap.keys()).slice(0, 5);
      console.warn(`[AdvancedAliasResolver] ❌ Not found in map. Sample available keys:`, sampleKeys);
    }

    // Fallback alle API Figma (ASYNC - NON deprecato)
    // Questo risolve anche variabili remote/external
    try {
      const variable = await figma.variables.getVariableByIdAsync(aliasId);

      if (variable) {

        // CACHE DINAMICA: Aggiungi alla cache per prossime ricerche
        if (variableMap) {
          variableMap.set(aliasId, variable);
        }
        if (this.variableMap) {
          this.variableMap.set(aliasId, variable);
        }

        return variable;
      }

      console.warn(`[AdvancedAliasResolver] ❌ API returned null for ID: ${aliasId}`);
      return null;
    } catch (error) {
      console.error(`[AdvancedAliasResolver] ❌ Failed to get variable by ID: ${aliasId}`, error);
      return null;
    }
  }

  /**
   * Genera il valore risolto in base al formato
   */
  private generateResolvedValue(
    variable: Variable,
    options: AliasResolutionOptions,
    currentDepth: number
  ): string {
    const nameTransform = options.nameTransform || this.getDefaultNameTransform(options.format);
    const transformedName = nameTransform(variable.name);

    switch (options.format) {
      case 'css':
        return `var(--${transformedName})`;
      case 'json':
      case 'tokens':
        return `{${transformedName}}`;
      default:
        return `var(--${transformedName})`;
    }
  }

  /**
   * Genera un valore di fallback per alias non trovati
   */
  private generateFallbackValue(aliasId: string, format?: string): string {
    switch (format) {
      case 'css':
        return `var(--unknown-variable-${aliasId.slice(-8)})`;
      case 'json':
      case 'tokens':
        return `{unknown-variable-${aliasId.slice(-8)}}`;
      default:
        return `var(--unknown-variable-${aliasId.slice(-8)})`;
    }
  }

  /**
   * Ottiene la trasformazione di nome di default per il formato
   */
  private getDefaultNameTransform(format?: string): (name: string) => string {
    if (format === 'tokens' || format === 'json') {
      // Per token formats, preserve hierarchy with dot notation
      return (name: string) => name.replace(/\//g, '.');
    }

    // Conversione standard kebab-case per CSS
    return (name: string) => {
      return name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    };
  }

  /**
   * Metodo helper per il CSS - risolve alias specificamente per CSS (async)
   */
  async resolveCSSAlias(aliasValue: any, variableMap?: Map<string, Variable>): Promise<string> {
    const result = await this.resolveAlias(aliasValue, {
      format: 'css',
      variableMap,
      nameTransform: (name) => name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
    });

    if (result.success && result.resolvedValue) {
      return result.resolvedValue;
    }

    if (result.error) {
      console.warn(`[AdvancedAliasResolver] CSS alias resolution failed:`, result.error);
    }

    return result.resolvedValue || `/* ALIAS ERROR: ${result.error} */`;
  }

  /**
   * Metodo helper per JSON/Tokens - risolve alias per formati token (async)
   */
  async resolveTokenAlias(aliasValue: any, variableMap?: Map<string, Variable>): Promise<string> {
    const result = await this.resolveAlias(aliasValue, {
      format: 'tokens',
      variableMap
    });

    return result.resolvedValue || `{error-${aliasValue.id?.slice(-8) || 'unknown'}}`;
  }
}

// ========================
// Main Functions
// ========================

function getTokenType(variable: Variable): string {

  // Handle no scopes or empty array
  if (!variable.scopes || !Array.isArray(variable.scopes) || variable.scopes.length === 0) {
    return FIGMA_TO_TOKEN_TYPE[variable.resolvedType as keyof typeof FIGMA_TO_TOKEN_TYPE] || 'string';
  }

  // Handle ALL_SCOPES - use value inference when possible
  if (variable.scopes.includes('ALL_SCOPES')) {
    return FIGMA_TO_TOKEN_TYPE[variable.resolvedType as keyof typeof FIGMA_TO_TOKEN_TYPE] || 'string';
  }

  // Handle single scope
  if (variable.scopes.length === 1) {
    const scope = variable.scopes[0];
    const mappedType = SCOPE_TO_TYPE_MAPPING[scope as keyof typeof SCOPE_TO_TYPE_MAPPING];

    if (mappedType) {
      return mappedType;
    } else {
      return FIGMA_TO_TOKEN_TYPE[variable.resolvedType as keyof typeof FIGMA_TO_TOKEN_TYPE] || 'string';
    }
  }

  // Handle multiple scopes - use priority order

  // Priority order: more specific scopes first
  const scopePriority = [
    // Most specific typography scopes
    'LETTER_SPACING', 'PARAGRAPH_SPACING', 'PARAGRAPH_INDENT',
    'FONT_FAMILY', 'FONT_WEIGHT', 'FONT_STYLE', 'FONT_SIZE', 'LINE_HEIGHT', 'TEXT_CONTENT',

    // Specific dimension scopes
    'CORNER_RADIUS', 'STROKE_FLOAT', 'STROKE',

    // Color scopes (specific to general)
    'TEXT_COLOR', 'STROKE_COLOR', 'EFFECT_COLOR', 'TEXT_FILL', 'SHAPE_FILL', 'FRAME_FILL',

    // Effects and opacity
    'LAYER_OPACITY', 'EFFECTS',

    // General scopes
    'GAP', 'WIDTH_HEIGHT', 'ALL_FILLS', 'FILLS', 'STROKES'
  ];

  // Find the highest priority scope that has a mapping
  for (const priorityScope of scopePriority) {
    if (variable.scopes.includes(priorityScope as any) && SCOPE_TO_TYPE_MAPPING[priorityScope as keyof typeof SCOPE_TO_TYPE_MAPPING]) {
      const mappedType = SCOPE_TO_TYPE_MAPPING[priorityScope as keyof typeof SCOPE_TO_TYPE_MAPPING];
      return mappedType;
    }
  }

  // If no priority scope found, use the first scope that has a mapping
  for (const scope of variable.scopes) {
    const mappedType = SCOPE_TO_TYPE_MAPPING[scope as keyof typeof SCOPE_TO_TYPE_MAPPING];
    if (mappedType) {
      return mappedType;
    }
  }

  // Final fallback to generic type mapping
  const fallbackType = FIGMA_TO_TOKEN_TYPE[variable.resolvedType as keyof typeof FIGMA_TO_TOKEN_TYPE] || 'string';
  return fallbackType;
}

const TOKEN_STUDIO_TO_W3C_TYPE = {
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

const DEFAULT_COLLECTION_NAME = 'Imported Variables';
const DEFAULT_MODE_NAME = 'Mode 1';

const PROGRESS_MESSAGES = {
  ANALYZING: 'Analyzing JSON structure...',
  PROCESSING: 'Processing tokens...',
  CREATING_VARIABLES: 'Creating variables...',
  CREATING_COLLECTIONS: 'Creating collections...',
  RESOLVING_ALIASES: 'Resolving token aliases...',
  VALIDATING: 'Validating data...',
  EXPORTING: 'Generating export...',
  COMPLETE: 'Operation completed successfully!'
} as const;

const LIMITS = {
  MAX_COLLECTIONS: 40,
  MAX_MODES_PER_COLLECTION: 20,
  MAX_VARIABLES_PER_COLLECTION: 5000,
  MAX_ALIAS_DEPTH: 10
} as const;

// Types (from types/plugin.ts)
interface PluginMessage {
  type: string;
  [key: string]: any;
}

interface PluginResponse {
  type: string;
  success?: boolean;
  message?: string;
  data?: any;
  error?: string;
}

// ProductionErrorHandler Class (from classes/ProductionErrorHandler.ts)
class ProductionErrorHandler {
  async handleError(error: Error, context: string, details: any = {}): Promise<{ shouldSkip: boolean }> {
    console.error(`[${context}]`, error, details);
    return { shouldSkip: false };
  }
}

// ================== LIBRARY TYPES ==================
// Type definitions for Figma Library support

type LibraryErrorType = 'PERMISSION_DENIED' | 'NOT_FOUND' | 'LIBRARY_NOT_ENABLED' | 'INVALID_KEY' | 'UNKNOWN';

interface RemoteVariableCache {
  variableId: string;
  variable: Variable;
  timestamp: number;
}

// ================== LIBRARY MANAGER ==================
// Simplified LibraryManager for JSON export (only needed methods)
class LibraryManager {
  private errorHandler: ProductionErrorHandler;
  private remoteVariableCache: Map<string, RemoteVariableCache> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.errorHandler = new ProductionErrorHandler();
  }

  /**
   * Get a remote variable by ID (from cache or fetch)
   * Used for cross-library alias resolution
   */
  async getRemoteVariable(variableId: string): Promise<Variable | null> {
    // Check cache first
    const cached = this.remoteVariableCache.get(variableId);
    if (cached && !this.isCacheExpired(cached.timestamp)) {
      return cached.variable;
    }

    try {
      // Fetch variable by ID (works for both local and remote variables)
      const variable = await figma.variables.getVariableByIdAsync(variableId);

      if (variable) {
        this.cacheRemoteVariable(variable);
      }

      return variable;
    } catch (error) {
      console.warn(`[LibraryManager] Failed to get remote variable ${variableId}:`, error);
      return null;
    }
  }

  /**
   * Check if a variable is from an external library
   */
  isRemoteVariable(variable: Variable): boolean {
    return variable.remote === true;
  }

  /**
   * Get library metadata for a remote variable
   */
  async getLibraryInfo(variable: Variable): Promise<{ libraryName?: string; collectionName?: string } | null> {
    if (!this.isRemoteVariable(variable)) {
      return null;
    }

    // Remote variables don't expose library name directly via API
    // We can only get collection info
    try {
      const collection = await figma.variables.getVariableCollectionByIdAsync(variable.variableCollectionId);

      return {
        libraryName: undefined, // Not directly accessible
        collectionName: collection?.name
      };
    } catch (error) {
      console.warn(`[LibraryManager] Failed to get collection for variable ${variable.id}:`, error);
      return null;
    }
  }

  /**
   * Clear the remote variable cache
   */
  clearCache(): void {
    this.remoteVariableCache.clear();
  }

  // ==================== PRIVATE METHODS ====================

  /**
   * Cache a remote variable for faster subsequent access
   */
  private cacheRemoteVariable(variable: Variable): void {
    if (!variable) return;

    const cacheEntry: RemoteVariableCache = {
      variableId: variable.id,
      variable,
      timestamp: Date.now()
    };

    this.remoteVariableCache.set(variable.id, cacheEntry);
  }

  /**
   * Check if a cache entry has expired
   */
  private isCacheExpired(timestamp: number): boolean {
    return (Date.now() - timestamp) > this.CACHE_TTL;
  }
}

// SimpleProgressLoader Class (from classes/SimpleProgressLoader.ts)
/**
 * Simple progress loader for displaying operation progress to the UI
 * Provides sophisticated loading animation with progress tracking
 */
class SimpleProgressLoader {
  private isVisible: boolean = false;
  private currentProgress: number = 0;

  constructor() {
    this.isVisible = false;
    this.currentProgress = 0;
  }

  /**
   * Show the progress loader
   */
  show(): void {
    this.isVisible = true;
    this.currentProgress = 0;

    figma.ui.postMessage({
      type: 'sophisticated-loader-show'
    });
  }

  /**
   * Update progress percentage
   * @param percentage - Progress percentage (0-100)
   */
  updateProgress(percentage: number): void {
    if (!this.isVisible) return;

    this.currentProgress = Math.min(100, Math.max(0, percentage));
    figma.ui.postMessage({
      type: 'sophisticated-loader-update',
      percentage: this.currentProgress
    });
  }

  /**
   * Hide the progress loader
   * Completes the progress bar before hiding
   */
  async hide(): Promise<void> {
    if (!this.isVisible) return;

    // Complete the progress bar before hiding
    if (this.currentProgress < 100) {
      this.updateProgress(100);
      await new Promise<void>(resolve => setTimeout(resolve, 150));
    }

    this.isVisible = false;

    figma.ui.postMessage({
      type: 'sophisticated-loader-hide'
    });
  }

  /**
   * Set progress with validation and message
   * @param percentage - Progress percentage (0-100)
   * @param message - Optional message to display
   */
  setProgress(percentage: number, message?: string): void {
    this.updateProgress(percentage);

    if (message) {
      figma.ui.postMessage({
        type: 'sophisticated-loader-message',
        message
      });
    }
  }

  /**
   * Show error state and hide loader
   * @param errorMessage - Error message to display
   */
  async showError(errorMessage: string): Promise<void> {
    figma.ui.postMessage({
      type: 'sophisticated-loader-error',
      message: errorMessage
    });

    await new Promise<void>(resolve => setTimeout(resolve, 500));
    await this.hide();
  }

  /**
   * Check if loader is currently visible
   */
  get visible(): boolean {
    return this.isVisible;
  }

  /**
   * Get current progress percentage
   */
  get progress(): number {
    return this.currentProgress;
  }
}

// TokenProcessor Class (from classes/TokenProcessor.ts)
class TokenProcessor {
  private errorHandler: ProductionErrorHandler;
  private aliasMap: Map<string, string> = new Map();

  constructor() {
    this.errorHandler = new ProductionErrorHandler();
  }

  async processTokensForImport(jsonData: any): Promise<{
    success: boolean;
    tokens: any[];
    collections: any[];
    aliasCount: number;
    message: string;
  }> {
    try {
      figma.ui.postMessage({
        type: MESSAGE_TYPES.PROGRESS_UPDATE,
        message: PROGRESS_MESSAGES.ANALYZING
      });

      const normalized = await this.normalizeTokenFormat(jsonData);

      figma.ui.postMessage({
        type: MESSAGE_TYPES.PROGRESS_UPDATE,
        message: PROGRESS_MESSAGES.PROCESSING
      });

      const processed = await this.processTokensRecursive(normalized);

      figma.ui.postMessage({
        type: MESSAGE_TYPES.PROGRESS_UPDATE,
        message: PROGRESS_MESSAGES.RESOLVING_ALIASES
      });

      await this.resolveAliases(processed);

      return {
        success: true,
        tokens: processed,
        collections: this.groupTokensByCollection(processed),
        aliasCount: this.aliasMap.size,
        message: 'Tokens processed successfully'
      };

    } catch (error) {
      await this.errorHandler.handleError(error as Error, 'token_processing');
      return {
        success: false,
        tokens: [],
        collections: [],
        aliasCount: 0,
        message: `Processing failed: ${(error as Error).message}`
      };
    }
  }

  private async normalizeTokenFormat(data: any): Promise<any> {
    if (this.isTokenStudioFormat(data)) {
      return this.convertTokenStudioToW3C(data);
    }
    return data;
  }

  private isTokenStudioFormat(data: any): boolean {
    if (!data || typeof data !== 'object') return false;

    const hasTokenStudioMarkers = '$themes' in data || '$metadata' in data;
    const hasTokenStudioStructure = this.checkForTokenStudioStructure(data);

    return hasTokenStudioMarkers || hasTokenStudioStructure;
  }

  private checkForTokenStudioStructure(obj: any, depth = 0): boolean {
    if (depth > 3) return false;

    if (obj && typeof obj === 'object') {
      if ('type' in obj && 'value' in obj && !('$type' in obj)) {
        return true;
      }

      for (const value of Object.values(obj)) {
        if (this.checkForTokenStudioStructure(value, depth + 1)) {
          return true;
        }
      }
    }

    return false;
  }

  private convertTokenStudioToW3C(data: any): any {
    const converted: any = {};

    for (const [key, value] of Object.entries(data)) {
      if (key.startsWith('$')) continue;
      converted[key] = this.convertTokenStudioGroup(value);
    }

    return converted;
  }

  private convertTokenStudioGroup(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;

    if ('type' in obj && 'value' in obj) {
      const tokenType = (TOKEN_STUDIO_TO_W3C_TYPE as any)[obj.type] || 'string';
      return {
        $type: tokenType,
        $value: obj.value,
        ...(obj.description && { $description: obj.description })
      };
    }

    const converted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = this.convertTokenStudioGroup(value);
    }

    return converted;
  }

  private async processTokensRecursive(
    obj: any,
    path: string[] = [],
    collection = DEFAULT_COLLECTION_NAME
  ): Promise<any[]> {
    const tokens: any[] = [];

    if (!obj || typeof obj !== 'object') return tokens;

    for (const [key, value] of Object.entries(obj)) {
      const currentPath = [...path, key];

      if (this.isToken(value)) {
        const token = await this.processSingleToken(value, currentPath, collection);
        if (token) {
          tokens.push(token);
        }
      } else if (typeof value === 'object') {
        const nestedTokens = await this.processTokensRecursive(value, currentPath, collection);
        tokens.push(...nestedTokens);
      }
    }

    return tokens;
  }

  private isToken(obj: any): boolean {
    return obj &&
      typeof obj === 'object' &&
      ('$value' in obj || 'value' in obj) &&
      ('$type' in obj || 'type' in obj);
  }

  private async processSingleToken(tokenData: any, path: string[], collection: string): Promise<any> {
    try {
      const tokenType = tokenData.$type || tokenData.type || 'string';
      const tokenValue = tokenData.$value || tokenData.value;
      const tokenName = path.join('/');

      const isAlias = typeof tokenValue === 'string' &&
        (tokenValue.startsWith('{') && tokenValue.endsWith('}'));

      if (isAlias) {
        this.aliasMap.set(tokenName, tokenValue);
      }

      return {
        name: tokenName,
        path,
        type: tokenType,
        value: tokenValue,
        collection,
        isAlias,
        resolvedValue: isAlias ? null : this.processTokenValue(tokenValue, tokenType),
        description: tokenData.$description || tokenData.description
      };
    } catch (error) {
      await this.errorHandler.handleError(error as Error, 'token_processing');
      return null;
    }
  }

  private processTokenValue(value: any, type: string): any {
    switch (type) {
      case 'color':
        return this.processColorValue(value);
      case 'number':
      case 'dimension':
        return this.processNumberValue(value);
      case 'string':
        return String(value);
      case 'boolean':
        return Boolean(value);
      default:
        return value;
    }
  }

  private processColorValue(value: any): any {
    if (typeof value === 'string') {
      if (value.startsWith('#')) {
        return this.hexToRgb(value);
      }
      return this.parseColorString(value);
    }

    if (value && typeof value === 'object' && 'r' in value) {
      return value;
    }

    return value;
  }

  private hexToRgb(hex: string): any {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hex);
    if (!result) {
      throw new Error(`Invalid hex color: ${hex}`);
    }

    return {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255,
      ...(result[4] && { a: parseInt(result[4], 16) / 255 })
    };
  }

  private parseColorString(colorStr: string): any {
    const rgbaMatch = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (rgbaMatch) {
      return {
        r: parseInt(rgbaMatch[1]) / 255,
        g: parseInt(rgbaMatch[2]) / 255,
        b: parseInt(rgbaMatch[3]) / 255,
        ...(rgbaMatch[4] && { a: parseFloat(rgbaMatch[4]) })
      };
    }
    return colorStr;
  }

  private processNumberValue(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const numberMatch = value.match(/^(-?\d*\.?\d+)/);
      if (numberMatch) {
        return parseFloat(numberMatch[1]);
      }
    }
    return 0;
  }

  private async resolveAliases(tokens: any[]): Promise<void> {
    const maxDepth = LIMITS.MAX_ALIAS_DEPTH;
    const resolved = new Set<string>();

    for (const token of tokens) {
      if (token.isAlias && !resolved.has(token.name)) {
        await this.resolveTokenAlias(token, tokens, resolved, 0, maxDepth);
      }
    }
  }

  private async resolveTokenAlias(
    token: any,
    allTokens: any[],
    resolved: Set<string>,
    depth: number,
    maxDepth: number
  ): Promise<void> {
    if (depth > maxDepth) {
      throw new Error(`Circular reference detected for token: ${token.name}`);
    }

    if (!token.isAlias || token.resolvedValue !== null) {
      resolved.add(token.name);
      return;
    }

    const aliasRef = token.value;
    const refPath = aliasRef.slice(1, -1);

    // Find referenced token - try both dot and slash notation
    let referencedToken = allTokens.find(t => t.name === refPath);

    // If not found with original format, try converting dots to slashes
    if (!referencedToken && refPath.includes('.')) {
      const slashPath = refPath.replace(/\./g, '/');
      referencedToken = allTokens.find(t => t.name === slashPath);
    }

    // If not found with slashes, try converting slashes to dots
    if (!referencedToken && refPath.includes('/')) {
      const dotPath = refPath.replace(/\//g, '.');
      referencedToken = allTokens.find(t => t.name === dotPath);
    }

    if (!referencedToken) {
      throw new Error(`Referenced token not found: ${refPath}`);
    }

    if (referencedToken.isAlias && !resolved.has(referencedToken.name)) {
      await this.resolveTokenAlias(referencedToken, allTokens, resolved, depth + 1, maxDepth);
    }

    token.resolvedValue = referencedToken.resolvedValue;
    resolved.add(token.name);
  }

  private groupTokensByCollection(tokens: any[]): any[] {
    const collections = new Map<string, any[]>();

    for (const token of tokens) {
      if (!collections.has(token.collection)) {
        collections.set(token.collection, []);
      }
      collections.get(token.collection)!.push(token);
    }

    return Array.from(collections.entries()).map(([name, tokens]) => ({
      name,
      tokens
    }));
  }
}

// ImportPreview Class (from classes/ImportPreview.ts)
class ImportPreview {
  private tokenProcessor: TokenProcessor;
  private errorHandler: ProductionErrorHandler;

  constructor() {
    this.tokenProcessor = new TokenProcessor();
    this.errorHandler = new ProductionErrorHandler();
  }

  async generatePreview(jsonData: any, options: any = {}): Promise<any> {
    try {
      const processingResult = await this.tokenProcessor.processTokensForImport(jsonData);

      if (!processingResult.success) {
        return {
          success: false,
          items: [],
          stats: { total: 0, new: 0, overwrite: 0, conflict: 0, invalid: 0, unchanged: 0 },
          errors: [processingResult.message]
        };
      }

      const existingVariables = await figma.variables.getLocalVariablesAsync();
      const existingCollections = await figma.variables.getLocalVariableCollectionsAsync();

      const existingVarMap = new Map(existingVariables.map(v => [v.name, v]));
      const existingCollMap = new Map(existingCollections.map(c => [c.name, c]));

      const previewItems: any[] = [];

      for (const tokenCollection of processingResult.collections) {
        for (const token of tokenCollection.tokens) {
          const previewItem = await this.createPreviewItem(
            token, tokenCollection.name, existingVarMap, existingCollMap, options
          );

          if (!options.includeUnchanged && previewItem.status === 'unchanged') {
            continue;
          }

          previewItems.push(previewItem);
        }
      }

      const stats = this.calculateStats(previewItems);

      return { success: true, items: previewItems, stats };
    } catch (error) {
      await this.errorHandler.handleError(error as Error, 'preview_generation');
      return {
        success: false,
        items: [],
        stats: { total: 0, new: 0, overwrite: 0, conflict: 0, invalid: 0, unchanged: 0 },
        errors: [(error as Error).message]
      };
    }
  }

  private async createPreviewItem(
    token: any, collectionName: string, existingVarMap: Map<string, Variable>,
    existingCollMap: Map<string, VariableCollection>, options: any
  ): Promise<any> {
    const existingVar = existingVarMap.get(token.name);
    const existingColl = existingCollMap.get(collectionName);

    let status: 'new' | 'overwrite' | 'conflict' | 'invalid' | 'unchanged' = 'new';
    let existingValue: string | undefined;
    let errorMessage: string | undefined;

    if (existingVar) {
      const modes = existingColl?.modes || [];
      const firstMode = modes[0];
      if (firstMode) {
        const value = existingVar.valuesByMode[firstMode.modeId];
        existingValue = this.formatValue(value, existingVar.resolvedType);
      }

      const expectedType = this.tokenTypeToFigmaType(token.type);
      if (expectedType && existingVar.resolvedType !== expectedType) {
        status = 'conflict';
        errorMessage = `Type mismatch: existing ${existingVar.resolvedType}, new ${expectedType}`;
      } else {
        const newValueStr = this.formatValue(token.resolvedValue, existingVar.resolvedType);
        if (existingValue === newValueStr) {
          status = 'unchanged';
        } else {
          status = 'overwrite';
        }
      }
    }

    if (options.validateTypes) {
      const validation = this.validateToken(token);
      if (!validation.valid) {
        status = 'invalid';
        errorMessage = validation.error;
      }
    }

    return {
      id: `${collectionName}/${token.path.join('/')}`,
      name: token.name,
      path: token.path,
      type: token.type,
      value: this.formatValueForDisplay(token.resolvedValue, token.type),
      status,
      existingValue,
      selected: status !== 'unchanged',
      collection: collectionName,
      description: token.description,
      errorMessage
    };
  }

  private formatValueForDisplay(value: any, type: string): string {
    switch (type.toLowerCase()) {
      case 'color':
        if (value && typeof value === 'object' && 'r' in value) {
          const r = Math.round(value.r * 255);
          const g = Math.round(value.g * 255);
          const b = Math.round(value.b * 255);
          return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        }
        return String(value);
      case 'number':
      case 'dimension':
        return typeof value === 'number' ? `${value}px` : String(value);
      case 'typography':
        if (typeof value === 'object') {
          return JSON.stringify(value, null, 0).substring(0, 50) + '...';
        }
        return String(value);
      default:
        if (typeof value === 'object') {
          return JSON.stringify(value);
        }
        return String(value);
    }
  }

  private formatValue(value: any, variableType: string): string {
    switch (variableType) {
      case 'COLOR':
        if (value && typeof value === 'object' && 'r' in value) {
          return `rgb(${value.r},${value.g},${value.b})`;
        }
        return String(value);
      case 'FLOAT':
        return String(value);
      case 'STRING':
      case 'BOOLEAN':
      default:
        return String(value);
    }
  }

  private validateToken(token: any): { valid: boolean; error?: string } {
    if (!token.name || token.name.trim() === '') {
      return { valid: false, error: 'Token name is required' };
    }
    if (!token.type) {
      return { valid: false, error: 'Token type is required' };
    }
    if (token.resolvedValue === undefined || token.resolvedValue === null) {
      return { valid: false, error: 'Token value is required' };
    }

    switch (token.type.toLowerCase()) {
      case 'color':
        if (typeof token.resolvedValue === 'object' && 'r' in token.resolvedValue) {
          const { r, g, b } = token.resolvedValue;
          if (r < 0 || r > 1 || g < 0 || g > 1 || b < 0 || b > 1) {
            return { valid: false, error: 'Color values must be between 0 and 1' };
          }
        }
        break;
      case 'number':
      case 'dimension':
        if (typeof token.resolvedValue !== 'number') {
          return { valid: false, error: 'Number type requires numeric value' };
        }
        break;
    }

    return { valid: true };
  }

  private tokenTypeToFigmaType(tokenType: string): 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN' | null {
    switch (tokenType.toLowerCase()) {
      case 'color':
        return 'COLOR';
      case 'number':
      case 'dimension':
      case 'size':
      case 'spacing':
        return 'FLOAT';
      case 'string':
      case 'text':
      case 'typography':
        return 'STRING';
      case 'boolean':
        return 'BOOLEAN';
      default:
        return null;
    }
  }

  private calculateStats(items: any[]) {
    const stats = {
      total: items.length,
      new: 0,
      overwrite: 0,
      conflict: 0,
      invalid: 0,
      unchanged: 0
    };

    for (const item of items) {
      stats[item.status as keyof typeof stats]++;
    }

    return stats;
  }
}

// VariableManager Class (from classes/VariableManager.ts)
class VariableManager {
  private errorHandler: ProductionErrorHandler;

  constructor() {
    this.errorHandler = new ProductionErrorHandler();
  }

  async importTokensAsVariables(
    tokenCollections: any[],
    options: any = {}
  ): Promise<{ success: boolean; message: string; variableCount: number; collectionCount: number }> {
    try {
      let totalVariables = 0;
      let totalCollections = 0;

      figma.ui.postMessage({
        type: MESSAGE_TYPES.PROGRESS_UPDATE,
        message: PROGRESS_MESSAGES.CREATING_COLLECTIONS
      });

      for (const tokenCollection of tokenCollections) {
        const collection = await this.getOrCreateCollection(tokenCollection.name, options.overwriteExisting || false);
        if (!collection) continue;

        totalCollections++;

        figma.ui.postMessage({
          type: MESSAGE_TYPES.PROGRESS_UPDATE,
          message: PROGRESS_MESSAGES.CREATING_VARIABLES
        });

        const variableCount = await this.importTokensToCollection(tokenCollection.tokens, collection, options);
        totalVariables += variableCount;
      }

      return {
        success: true,
        message: `Successfully imported ${totalVariables} variables across ${totalCollections} collections`,
        variableCount: totalVariables,
        collectionCount: totalCollections
      };

    } catch (error) {
      await this.errorHandler.handleError(error as Error, 'variable_import');
      return {
        success: false,
        message: `Import failed: ${(error as Error).message}`,
        variableCount: 0,
        collectionCount: 0
      };
    }
  }

  private async getOrCreateCollection(name: string, overwrite = false): Promise<VariableCollection | null> {
    try {
      const existingCollections = await figma.variables.getLocalVariableCollectionsAsync();
      let collection = existingCollections.find(c => c.name === name);

      if (collection && !overwrite) {
        return collection;
      }

      if (collection && overwrite) {
        collection.remove();
      }

      if (existingCollections.length >= LIMITS.MAX_COLLECTIONS) {
        throw new Error(`Maximum number of collections (${LIMITS.MAX_COLLECTIONS}) reached`);
      }

      collection = figma.variables.createVariableCollection(name);

      if (collection.modes.length === 0) {
        collection.addMode(DEFAULT_MODE_NAME);
      }

      return collection;
    } catch (error) {
      await this.errorHandler.handleError(error as Error, 'collection_creation');
      return null;
    }
  }

  private async importTokensToCollection(tokens: any[], collection: VariableCollection, options: any): Promise<number> {
    let importedCount = 0;

    for (const token of tokens) {
      try {
        const variable = await this.createOrUpdateVariable(token, collection, options);
        if (variable) {
          importedCount++;
        }
      } catch (error) {
        if (options.skipInvalid) {
          console.warn(`Skipping invalid token: ${token.name}`, error);
          continue;
        } else {
          throw error;
        }
      }
    }

    return importedCount;
  }

  private async createOrUpdateVariable(token: any, collection: VariableCollection, options: any): Promise<Variable | null> {
    try {
      const figmaType = this.tokenTypeToFigmaType(token.type);
      if (!figmaType) {
        throw new Error(`Unsupported token type: ${token.type}`);
      }

      let variable = await this.findExistingVariable(token.name, collection);

      if (variable) {
        if (!options.overwriteExisting) {
          return variable;
        }
        if (variable.resolvedType !== figmaType) {
          variable.remove();
          variable = null;
        }
      }

      if (!variable) {
        variable = figma.variables.createVariable(token.name, collection, figmaType);
      }

      if (token.description) {
        variable.description = token.description;
      }

      await this.setVariableValues(variable, token, collection);
      return variable;

    } catch (error) {
      await this.errorHandler.handleError(error as Error, 'variable_creation');
      return null;
    }
  }

  private async findExistingVariable(name: string, collection: VariableCollection): Promise<Variable | null> {
    const variables = await figma.variables.getLocalVariablesAsync();
    return variables.find(v => v.name === name && v.variableCollectionId === collection.id) || null;
  }

  private tokenTypeToFigmaType(tokenType: string): 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN' | null {
    switch (tokenType.toLowerCase()) {
      case 'color':
        return 'COLOR';
      case 'number':
      case 'dimension':
      case 'size':
      case 'spacing':
        return 'FLOAT';
      case 'string':
      case 'text':
      case 'typography':
        return 'STRING';
      case 'boolean':
        return 'BOOLEAN';
      default:
        return null;
    }
  }

  private async setVariableValues(variable: Variable, token: any, collection: VariableCollection): Promise<void> {
    const mode = collection.modes[0];
    const processedValue = this.processValueForFigma(token.resolvedValue, variable.resolvedType);

    if (!this.isValidValueForType(processedValue, variable.resolvedType)) {
      throw new Error(`Invalid value type for variable ${token.name}: expected ${variable.resolvedType}`);
    }

    variable.setValueForMode(mode.modeId, processedValue);
  }

  private processValueForFigma(value: any, variableType: 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN'): any {
    switch (variableType) {
      case 'COLOR':
        if (value && typeof value === 'object' && 'r' in value) {
          return value;
        }
        throw new Error('Color value not in expected RGB format');
      case 'FLOAT':
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
          const parsed = parseFloat(value);
          if (!isNaN(parsed)) return parsed;
        }
        return 0;
      case 'STRING':
        if (typeof value === 'string') return value;
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
      case 'BOOLEAN':
        return Boolean(value);
      default:
        return value;
    }
  }

  private isValidValueForType(value: any, type: 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN'): boolean {
    switch (type) {
      case 'COLOR':
        return value && typeof value === 'object' && 'r' in value && 'g' in value && 'b' in value;
      case 'FLOAT':
        return typeof value === 'number' && !isNaN(value);
      case 'STRING':
        return typeof value === 'string';
      case 'BOOLEAN':
        return typeof value === 'boolean';
      default:
        return false;
    }
  }
}

// CSS Export Options Interface
interface CSSExportOptions {
  collections?: any[];
  modes?: string[];
  types?: string[];
  exportType?: 'single' | 'separate' | 'by-collection';
  format?: 'css' | 'scss' | 'less';
  cssOptions?: {
    // Selectors
    naming?: 'kebab' | 'camel' | 'snake';
    baseSelector?: string;
    themeSelector?: string;
    includeComments?: boolean;

    // Token Names
    tokenNameStyle?: 'kebab' | 'camel' | 'pascal' | 'snake';
    tokenNameStructure?: 'path-name' | 'name-only' | 'collection-path-name';
    globalPrefix?: string;
    customizeTypePrefixes?: boolean;
    typePrefixes?: {
      color?: string;
      typography?: string;
      dimension?: string;
      size?: string;
      space?: string;
      opacity?: string;
      fontSize?: string;
      lineHeight?: string;
      letterSpacing?: string;
      paragraphSpacing?: string;
      borderWidth?: string;
      borderRadius?: string;
      duration?: string;
      zIndex?: string;
      shadow?: string;
    };

    // Token Values
    colorFormat?: 'hex' | 'rgb' | 'rgba' | 'hsl' | 'hsla' | 'hex-alpha';
    forceRemUnits?: boolean;
    useTokenReferences?: boolean;
    colorPrecision?: number;
    useFallbackValues?: boolean;

    // Other
    showTokenDescriptions?: boolean;
    showFileDisclaimer?: boolean;
    disclaimerMessage?: string;
    indentation?: number;
  };
}

// CSSExporter Class
class CSSExporter {
  private errorHandler: ProductionErrorHandler;
  private aliasResolver: AdvancedAliasResolver;
  private variableMap: Map<string, Variable> = new Map();

  constructor() {
    this.errorHandler = new ProductionErrorHandler();
    this.aliasResolver = new AdvancedAliasResolver();
  }

  async exportToCSS(options: CSSExportOptions): Promise<{
    success: boolean;
    message: string;
    css?: string;
    files?: { filename: string; content: string }[];
  }> {
    try {
      figma.ui.postMessage({
        type: MESSAGE_TYPES.PROGRESS_UPDATE,
        message: PROGRESS_MESSAGES.EXPORTING
      });

      const collections = await figma.variables.getLocalVariableCollectionsAsync();
      const variables = await figma.variables.getLocalVariablesAsync();

      // CRITICAL FIX: Build variable map for alias resolution
      this.variableMap.clear();
      variables.forEach(variable => {
        this.variableMap.set(variable.id, variable);
      });

      // Filter collections based on options
      const filteredCollections = this.filterCollections(collections, options.collections);

      if (filteredCollections.length === 0) {
        throw new Error('No collections selected for export');
      }

      // Process export based on type
      switch (options.exportType) {
        case 'single':
          return await this.exportSingleCSS(filteredCollections, variables, options);
        case 'separate':
          return await this.exportSeparateCSS(filteredCollections, variables, options);
        case 'by-collection':
          return await this.exportByCollectionCSS(filteredCollections, variables, options);
        default:
          return await this.exportSingleCSS(filteredCollections, variables, options);
      }

    } catch (error) {
      await this.errorHandler.handleError(error as Error, 'css_export');
      return {
        success: false,
        message: `CSS export failed: ${(error as Error).message}`
      };
    }
  }

  private async exportSingleCSS(
    collections: VariableCollection[],
    variables: Variable[],
    options: CSSExportOptions
  ): Promise<{ success: boolean; message: string; css?: string }> {
    let cssContent = '';

    // Add header comment
    if (options.cssOptions?.includeComments !== false) {
      cssContent += this.generateHeader();
    }

    // 🚀 PERFORMANCE: Create variable lookup map for O(1) access
    const variableMap = new Map<string, Variable>();
    variables.forEach(variable => {
      variableMap.set(variable.id, variable);
    });

    // Determine which modes to export
    const modesToExport = this.getModesToExport(collections, options);

    // Generate CSS for each mode
    for (const modeInfo of modesToExport) {
      const { mode, collection, selector } = modeInfo;

      if (options.cssOptions?.includeComments !== false) {
        cssContent += `/* Mode: ${mode.name} - Collection: ${collection.name} */\n`;
      }

      cssContent += `${selector} {\n`;

      // 🔧 FIX: Use collection.variableIds to preserve Figma's variable order
      const orderedVariables = collection.variableIds.map(id => variableMap.get(id));

      for (const variable of orderedVariables) {
        if (!variable) continue; // Skip if variable was deleted

        // Filter by types if specified
        if (options.types && options.types.length > 0) {
          const tokenType = FIGMA_TO_TOKEN_TYPE[variable.resolvedType];
          if (!options.types.includes(tokenType)) {
            continue;
          }
        }

        const cssVariable = await this.generateCSSVariable(variable, collection, options, mode);
        if (cssVariable) {
          cssContent += `  ${cssVariable}\n`;
        }
      }

      cssContent += '}\n\n';
    }

    return {
      success: true,
      message: `Exported ${collections.length} collections with ${modesToExport.length} modes to CSS`,
      css: cssContent
    };
  }

  private async exportSeparateCSS(
    collections: VariableCollection[],
    variables: Variable[],
    options: CSSExportOptions
  ): Promise<{ success: boolean; message: string; files?: { filename: string; content: string }[] }> {
    const files: { filename: string; content: string }[] = [];

    // 🚀 PERFORMANCE: Create variable lookup map for O(1) access
    const variableMap = new Map<string, Variable>();
    variables.forEach(variable => {
      variableMap.set(variable.id, variable);
    });

    for (const collection of collections) {
      for (const mode of collection.modes) {
        // Filter by selected modes if specified
        if (options.modes && options.modes.length > 0) {
          if (!options.modes.includes(mode.modeId) && !options.modes.includes(mode.name)) {
            continue; // Skip non-selected modes
          }
        }

        const cssContent = await this.generateCSSForMode(collection, mode, options, variableMap);

        if (cssContent.trim()) {
          const filename = this.generateCSSFilename(collection.name, mode.name, options);
          files.push({ filename, content: cssContent });
        }
      }
    }

    return {
      success: true,
      message: `Exported ${files.length} CSS files`,
      files
    };
  }

  private async exportByCollectionCSS(
    collections: VariableCollection[],
    variables: Variable[],
    options: CSSExportOptions
  ): Promise<{ success: boolean; message: string; files?: { filename: string; content: string }[] }> {
    const files: { filename: string; content: string }[] = [];

    // 🚀 PERFORMANCE: Create variable lookup map for O(1) access
    const variableMap = new Map<string, Variable>();
    variables.forEach(variable => {
      variableMap.set(variable.id, variable);
    });

    for (const collection of collections) {
      const cssContent = await this.generateCSSForCollection(collection, options, variableMap);

      if (cssContent.trim()) {
        const filename = this.generateCSSFilename(collection.name, null, options);
        files.push({ filename, content: cssContent });
      }
    }

    return {
      success: true,
      message: `Exported ${files.length} CSS files`,
      files
    };
  }

  private async generateCSSForMode(
    collection: VariableCollection,
    mode: any,
    options: CSSExportOptions,
    variableMap?: Map<string, Variable>
  ): Promise<string> {
    let cssContent = '';

    if (options.cssOptions?.includeComments !== false) {
      cssContent += this.generateHeader();
      cssContent += `/* Collection: ${collection.name} - Mode: ${mode.name} */\n\n`;
    }

    const selector = options.cssOptions?.baseSelector || ':root';
    cssContent += `${selector} {\n`;

    // 🔧 FIX: Use collection.variableIds to preserve Figma's variable order
    let orderedVariables: (Variable | null | undefined)[];

    if (variableMap) {
      // 🚀 PERFORMANCE: Use pre-fetched variables from the map (O(N) lookups vs N API calls)
      orderedVariables = collection.variableIds.map(id => variableMap.get(id));
    } else {
      // Fallback to API calls if map is not provided
      orderedVariables = await Promise.all(
        collection.variableIds.map(id => figma.variables.getVariableByIdAsync(id))
      );
    }

    for (const variable of orderedVariables) {
      if (!variable) continue; // Skip if variable was deleted

      // Filter by types if specified
      if (options.types && options.types.length > 0) {
        const tokenType = FIGMA_TO_TOKEN_TYPE[variable.resolvedType];
        if (!options.types.includes(tokenType)) {
          continue;
        }
      }

      const cssVariable = await this.generateCSSVariable(variable, collection, options, mode);
      if (cssVariable) {
        cssContent += `  ${cssVariable}\n`;
      }
    }

    cssContent += '}\n';
    return cssContent;
  }

  private async generateCSSForCollection(
    collection: VariableCollection,
    options: CSSExportOptions,
    variableMap?: Map<string, Variable>
  ): Promise<string> {
    let cssContent = '';

    if (options.cssOptions?.includeComments !== false) {
      cssContent += this.generateHeader();
      cssContent += `/* Collection: ${collection.name} */\n\n`;
    }

    // Determine which modes to export for this collection
    const modesToExport = this.getModesToExport([collection], options);

    // 🔧 FIX: Use collection.variableIds to preserve Figma's variable order
    let orderedVariables: (Variable | null | undefined)[];

    if (variableMap) {
      // 🚀 PERFORMANCE: Use pre-fetched variables from the map (O(N) lookups vs N API calls)
      orderedVariables = collection.variableIds.map(id => variableMap.get(id));
    } else {
      // Fallback to API calls if map is not provided
      orderedVariables = await Promise.all(
        collection.variableIds.map(id => figma.variables.getVariableByIdAsync(id))
      );
    }

    // Generate CSS for each mode
    for (const modeInfo of modesToExport) {
      const { mode, selector } = modeInfo;

      if (options.cssOptions?.includeComments !== false) {
        cssContent += `/* Mode: ${mode.name} */\n`;
      }

      cssContent += `${selector} {\n`;

      for (const variable of orderedVariables) {
        if (!variable) continue; // Skip if variable was deleted

        // Filter by types if specified
        if (options.types && options.types.length > 0) {
          const tokenType = FIGMA_TO_TOKEN_TYPE[variable.resolvedType];
          if (!options.types.includes(tokenType)) {
            continue;
          }
        }

        const cssVariable = await this.generateCSSVariable(variable, collection, options, mode);
        if (cssVariable) {
          cssContent += `  ${cssVariable}\n`;
        }
      }

      cssContent += '}\n\n';
    }

    return cssContent;
  }

  private async generateCSSVariable(
    variable: Variable,
    collection: VariableCollection,
    options: CSSExportOptions,
    specificMode?: any
  ): Promise<string | null> {
    try {
      const mode = specificMode || collection.modes[0];
      const value = variable.valuesByMode[mode.modeId];

      if (value === undefined || value === null) {
        return null;
      }

      const cssName = this.generateCSSVariableName(variable.name, options);
      const cssValue = await this.processCSSValue(variable, value, options);

      if (cssValue === null) {
        return null;
      }

      return `--${cssName}: ${cssValue};`;
    } catch (error) {
      console.warn(`Failed to generate CSS variable for ${variable.name}:`, error);
      return null;
    }
  }

  private generateCSSVariableName(name: string, options: CSSExportOptions): string {
    const style = options.cssOptions?.tokenNameStyle || 'kebab';
    const structure = options.cssOptions?.tokenNameStructure || 'path-name';
    const prefix = options.cssOptions?.globalPrefix || '';

    // Step 1: Apply structure (how much of the path to include)
    let processedName = name;
    switch (structure) {
      case 'name-only':
        // Use only the last segment (e.g., "colors/primary/500" → "500")
        processedName = name.split('/').pop() || name;
        break;
      case 'collection-path-name':
        // Keep full path (default behavior)
        processedName = name;
        break;
      case 'path-name':
      default:
        // Keep full path (default)
        processedName = name;
        break;
    }

    // Step 2: Apply naming style
    switch (style) {
      case 'camel':
        // camelCase: colors/primary → colorsPrimary
        processedName = processedName
          .split(/[^a-zA-Z0-9]/)
          .filter(Boolean)
          .map((word, index) =>
            index === 0
              ? word.toLowerCase()
              : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          )
          .join('');
        break;

      case 'pascal':
        // PascalCase: colors/primary → ColorsPrimary
        processedName = processedName
          .split(/[^a-zA-Z0-9]/)
          .filter(Boolean)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join('');
        break;

      case 'snake':
        // snake_case: colors/primary → colors_primary
        processedName = processedName
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_|_$/g, '');
        break;

      case 'kebab':
      default:
        // kebab-case: colors/primary → colors-primary
        processedName = processedName
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
        break;
    }

    // Step 3: Apply global prefix
    if (prefix) {
      // Ensure prefix ends with appropriate separator
      const separator = style === 'snake' ? '_' : style === 'camel' || style === 'pascal' ? '' : '-';
      processedName = prefix + (prefix.endsWith(separator) ? '' : separator) + processedName;
    }

    return processedName;
  }

  private async processCSSValue(variable: Variable, value: any, options: CSSExportOptions): Promise<string | null> {
    // CRITICAL FIX: Handle variable aliases FIRST before type-specific processing
    if (value && typeof value === 'object' && value.type === 'VARIABLE_ALIAS') {
      // Check if we should use token references (var()) or resolve to values
      if (options.cssOptions?.useTokenReferences) {
        // Return CSS var() reference
        const referencedVar = this.variableMap.get(value.id);
        if (referencedVar) {
          const refName = this.generateCSSVariableName(referencedVar.name, options);
          return `var(--${refName})`;
        }
      }
      // Fallback: resolve the alias to its value
      return await this.aliasResolver.resolveCSSAlias(value, this.variableMap);
    }

    // Handle any other object types that might cause [object Object]
    // BUT exclude valid RGB/RGBA color objects
    if (value && typeof value === 'object' && !this.isValidColorObject(value)) {
      // Check if it's a malformed alias (has id but no type)
      if (value.id && !value.type) {
        return await this.aliasResolver.resolveCSSAlias({ type: 'VARIABLE_ALIAS', id: value.id }, this.variableMap);
      }

      // Log debug info for troubleshooting
      console.warn(`[CSSExporter] Unexpected object value for variable "${variable.name}":`, {
        valueType: typeof value,
        objectKeys: Object.keys(value),
        hasType: !!value.type,
        hasId: !!value.id,
        serialized: JSON.stringify(value)
      });

      // Last resort: return a debug comment instead of [object Object]
      return `/* OBJECT DEBUG: ${JSON.stringify(value)} */`;
    }

    // Type-specific processing for primitive values
    switch (variable.resolvedType) {
      case 'COLOR':
        return this.processColorForCSS(value, options);
      case 'FLOAT':
        return this.processNumberForCSS(value, options);
      case 'STRING':
        return this.processStringForCSS(value);
      case 'BOOLEAN':
        return String(value);
      default:
        return String(value);
    }
  }

  /**
   * Check if the value is a valid RGB/RGBA color object
   */
  private isValidColorObject(value: any): boolean {
    return value &&
      typeof value === 'object' &&
      'r' in value &&
      'g' in value &&
      'b' in value &&
      typeof value.r === 'number' &&
      typeof value.g === 'number' &&
      typeof value.b === 'number';
  }

  private processColorForCSS(value: any, options: CSSExportOptions): string {
    if (value && typeof value === 'object' && 'r' in value) {
      const r = Math.round(value.r * 255);
      const g = Math.round(value.g * 255);
      const b = Math.round(value.b * 255);
      const a = 'a' in value ? value.a : 1;
      const precision = options.cssOptions?.colorPrecision || 3;
      const format = options.cssOptions?.colorFormat || 'hex';

      switch (format) {
        case 'hex':
        case 'hex-alpha':
          // Convert to hex
          const rHex = r.toString(16).padStart(2, '0');
          const gHex = g.toString(16).padStart(2, '0');
          const bHex = b.toString(16).padStart(2, '0');
          if (format === 'hex-alpha' && a < 1) {
            const aHex = Math.round(a * 255).toString(16).padStart(2, '0');
            return `#${rHex}${gHex}${bHex}${aHex}`;
          }
          return `#${rHex}${gHex}${bHex}`;

        case 'rgba':
          const alpha = Math.round(a * Math.pow(10, precision)) / Math.pow(10, precision);
          return `rgba(${r}, ${g}, ${b}, ${alpha})`;

        case 'rgb':
          if (a < 1) {
            const alpha2 = Math.round(a * Math.pow(10, precision)) / Math.pow(10, precision);
            return `rgba(${r}, ${g}, ${b}, ${alpha2})`;
          }
          return `rgb(${r}, ${g}, ${b})`;

        case 'hsl':
        case 'hsla':
          // Convert RGB to HSL
          const hsl = this.rgbToHsl(r, g, b);
          if (format === 'hsla' || a < 1) {
            const alphaHsl = Math.round(a * Math.pow(10, precision)) / Math.pow(10, precision);
            return `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${alphaHsl})`;
          }
          return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;

        default:
          // Fallback to rgba
          if (a < 1) {
            const alphaFallback = Math.round(a * Math.pow(10, precision)) / Math.pow(10, precision);
            return `rgba(${r}, ${g}, ${b}, ${alphaFallback})`;
          }
          return `rgb(${r}, ${g}, ${b})`;
      }
    }
    return String(value);
  }

  private rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  }

  private processNumberForCSS(value: any, options: CSSExportOptions): string {
    if (typeof value === 'number') {
      if (options.cssOptions?.forceRemUnits) {
        // Convert px to rem (assuming 16px base)
        const remValue = value / 16;
        return `${remValue}rem`;
      }
      return `${value}px`;
    }
    return String(value);
  }

  private processStringForCSS(value: any): string {
    return `"${String(value)}"`;
  }

  private generateHeader(): string {
    const date = new Date().toISOString().split('T')[0];
    return `/*\n * Design tokens exported from Luckino Figma Plugin, made with care by Mattia Marinangeli\n * Generated on ${date}\n * DO NOT EDIT DIRECTLY\n */\n\n`;
  }

  /**
   * Determine which modes to export based on options
   * Returns an array of { mode, collection, selector } objects
   */
  private getModesToExport(
    collections: VariableCollection[],
    options: CSSExportOptions
  ): Array<{ mode: any; collection: VariableCollection; selector: string }> {
    const result: Array<{ mode: any; collection: VariableCollection; selector: string }> = [];
    const baseSelector = options.cssOptions?.baseSelector || ':root';
    const themeSelector = options.cssOptions?.themeSelector || '.theme-{theme}';

    for (const collection of collections) {
      // If specific modes are selected in options, use only those
      if (options.modes && options.modes.length > 0) {
        for (const modeName of options.modes) {
          const mode = collection.modes.find(m => m.name === modeName);
          if (mode) {
            // Generate selector: first mode uses baseSelector, others use theme selector
            const isFirstMode = collection.modes[0].modeId === mode.modeId;
            const selector = isFirstMode
              ? baseSelector
              : themeSelector.replace('{theme}', mode.name.toLowerCase().replace(/\s+/g, '-'));

            result.push({ mode, collection, selector });
          }
        }
      } else {
        // No specific modes selected - export all modes
        for (const mode of collection.modes) {
          const isFirstMode = collection.modes[0].modeId === mode.modeId;
          const selector = isFirstMode
            ? baseSelector
            : themeSelector.replace('{theme}', mode.name.toLowerCase().replace(/\s+/g, '-'));

          result.push({ mode, collection, selector });
        }
      }
    }

    return result;
  }

  private generateCSSFilename(collectionName: string, modeName?: string | null, options?: CSSExportOptions): string {
    const format = options?.format || 'css';
    const safeName = collectionName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const safeModeName = modeName ? modeName.toLowerCase().replace(/[^a-z0-9]/g, '-') : null;

    if (safeModeName) {
      return `${safeName}-${safeModeName}.${format}`;
    }
    return `${safeName}.${format}`;
  }

  private filterCollections(collections: VariableCollection[], selectedCollections?: any[]): VariableCollection[] {
    if (!selectedCollections || selectedCollections.length === 0) {
      return collections;
    }

    const selectedIds = selectedCollections.map(c => typeof c === 'string' ? c : c.id);
    return collections.filter(collection => selectedIds.includes(collection.id));
  }
}

// JSON Export Options Interface
interface JSONExportOptions {
  collections?: any[];
  modes?: string[];
  types?: string[];
  exportType?: 'single' | 'combined' | 'separate' | 'by-collection';
  format?: 'w3c' | 'token-studio' | 'figma' | 'style-dictionary' | 'ant-design' | 'figma-raw';
  includeModes?: boolean; // 🆕 Include all modes as multi-mode values
  jsonOptions?: {
    includeMetadata?: boolean;
    includeAliases?: boolean;
    useW3CKeys?: boolean;
    prettify?: boolean;
  };
}

// JSONExporter Class
class JSONExporter {
  private errorHandler: ProductionErrorHandler;
  private libraryManager: LibraryManager;

  constructor() {
    this.errorHandler = new ProductionErrorHandler();
    this.libraryManager = new LibraryManager();
  }

  async exportToJSON(options: JSONExportOptions): Promise<{
    success: boolean;
    message: string;
    json?: string;
    files?: { filename: string; content: string }[];
  }> {
    try {
      figma.ui.postMessage({
        type: MESSAGE_TYPES.PROGRESS_UPDATE,
        message: PROGRESS_MESSAGES.EXPORTING
      });

      const collections = await figma.variables.getLocalVariableCollectionsAsync();
      const variables = await figma.variables.getLocalVariablesAsync();

      // Filter collections based on options
      const filteredCollections = this.filterCollections(collections, options.collections);

      if (filteredCollections.length === 0) {
        throw new Error('No collections selected for export');
      }

      // Process export based on type
      switch (options.exportType) {
        case 'single':
        case 'combined':
          return await this.exportSingleJSON(filteredCollections, variables, options);
        case 'separate':
          return await this.exportSeparateJSON(filteredCollections, variables, options);
        case 'by-collection':
          return await this.exportByCollectionJSON(filteredCollections, variables, options);
        default:
          return await this.exportSingleJSON(filteredCollections, variables, options);
      }

    } catch (error) {
      await this.errorHandler.handleError(error as Error, 'json_export');
      return {
        success: false,
        message: `JSON export failed: ${(error as Error).message}`
      };
    }
  }

  private async exportSingleJSON(
    collections: VariableCollection[],
    variables: Variable[],
    options: JSONExportOptions
  ): Promise<{ success: boolean; message: string; json?: string }> {
    // Create variable lookup map for alias resolution
    const variableMap = new Map<string, Variable>();
    variables.forEach(variable => {
      variableMap.set(variable.id, variable);
    });

    let tokens = await this.processCollectionsToTokens(collections, variables, options, variableMap);

    // Post-process for specific formats
    if (options.format === 'style-dictionary') {
      tokens = this.flattenForStyleDictionary(tokens);
    } else if (options.format === 'ant-design') {
      tokens = this.wrapForAntDesign(tokens);
    }

    const jsonContent = this.formatJSON(tokens, options);

    return {
      success: true,
      message: `Exported ${collections.length} collections to JSON`,
      json: jsonContent
    };
  }

  private async exportSeparateJSON(
    collections: VariableCollection[],
    variables: Variable[],
    options: JSONExportOptions
  ): Promise<{ success: boolean; message: string; files?: { filename: string; content: string }[] }> {
    const files: { filename: string; content: string }[] = [];

    // Create variable lookup map for alias resolution
    const variableMap = new Map<string, Variable>();
    variables.forEach(variable => {
      variableMap.set(variable.id, variable);
    });

    for (const collection of collections) {
      for (const mode of collection.modes) {
        // Filter by selected modes if specified
        if (options.modes && options.modes.length > 0) {
          if (!options.modes.includes(mode.modeId) && !options.modes.includes(mode.name)) {
            continue; // Skip non-selected modes
          }
        }

        const tokens = await this.processCollectionModeToTokens(collection, mode, options, variableMap);

        if (Object.keys(tokens).length > 0) {
          const jsonContent = this.formatJSON(tokens, options);
          const filename = this.generateJSONFilename(collection.name, mode.name, options);
          files.push({ filename, content: jsonContent });
        }
      }
    }

    return {
      success: true,
      message: `Exported ${files.length} JSON files`,
      files
    };
  }

  private async exportByCollectionJSON(
    collections: VariableCollection[],
    variables: Variable[],
    options: JSONExportOptions
  ): Promise<{ success: boolean; message: string; files?: { filename: string; content: string }[] }> {
    const files: { filename: string; content: string }[] = [];

    // Create variable lookup map for alias resolution
    const variableMap = new Map<string, Variable>();
    variables.forEach(variable => {
      variableMap.set(variable.id, variable);
    });

    for (const collection of collections) {
      const tokens = await this.processCollectionToTokens(collection, options, variableMap);

      if (Object.keys(tokens).length > 0) {
        const jsonContent = this.formatJSON(tokens, options);
        const filename = this.generateJSONFilename(collection.name, null, options);
        files.push({ filename, content: jsonContent });
      }
    }

    return {
      success: true,
      message: `Exported ${files.length} JSON files`,
      files
    };
  }

  private async processCollectionsToTokens(
    collections: VariableCollection[],
    variables: Variable[],
    options: JSONExportOptions,
    variableMap?: Map<string, Variable>
  ): Promise<any> {
    const tokens: any = {};

    for (const collection of collections) {
      const collectionTokens = await this.processCollectionToTokens(collection, options, variableMap);

      // ⚠️ CRITICAL: DO NOT use Object.assign() here!
      // Object.assign(tokens, collectionTokens) would merge flat and LOSE collections
      // Example: primitives gets overwritten by semantic, components gets lost
      // MUST wrap under collection.name to preserve structure for multi-collection export
      tokens[collection.name] = collectionTokens;
    }

    return tokens;
  }

  private async processCollectionToTokens(
    collection: VariableCollection,
    options: JSONExportOptions,
    variableMap?: Map<string, Variable>
  ): Promise<any> {
    const tokens: any = {};

    // 🔧 FIX: Use collection.variableIds to preserve Figma's variable order
    // This ensures variables appear in the JSON in the same order as in Figma UI
    let orderedVariables: (Variable | null | undefined)[];

    if (variableMap) {
      // 🚀 PERFORMANCE: Use pre-fetched variables from the map (O(N) lookups vs N API calls)
      orderedVariables = collection.variableIds.map(id => variableMap.get(id));
    } else {
      // Fallback to API calls if map is not provided
      orderedVariables = await Promise.all(
        collection.variableIds.map(id => figma.variables.getVariableByIdAsync(id))
      );
    }

    for (const variable of orderedVariables) {
      if (!variable) continue; // Skip if variable was deleted

      // Filter by types if specified
      if (options.types && options.types.length > 0) {
        const tokenType = FIGMA_TO_TOKEN_TYPE[variable.resolvedType];
        // Check against both raw Figma type and converted token type for compatibility
        if (!options.types.includes(variable.resolvedType) && !options.types.includes(tokenType)) {
          continue;
        }
      }

      const tokenPath = this.generateTokenPath(variable.name);
      const tokenData = await this.generateTokenData(variable, collection, options, variableMap);

      if (tokenData) {
        this.setNestedProperty(tokens, tokenPath, tokenData);
      }
    }
    return tokens;
  }

  private async processCollectionModeToTokens(
    collection: VariableCollection,
    mode: any,
    options: JSONExportOptions,
    variableMap?: Map<string, Variable>
  ): Promise<any> {
    const tokens: any = {};

    // 🔧 FIX: Use collection.variableIds to preserve Figma's variable order
    let orderedVariables: (Variable | null | undefined)[];

    if (variableMap) {
      // 🚀 PERFORMANCE: Use pre-fetched variables from the map (O(N) lookups vs N API calls)
      orderedVariables = collection.variableIds.map(id => variableMap.get(id));
    } else {
      // Fallback to API calls if map is not provided
      orderedVariables = await Promise.all(
        collection.variableIds.map(id => figma.variables.getVariableByIdAsync(id))
      );
    }

    for (const variable of orderedVariables) {
      if (!variable) continue; // Skip if variable was deleted

      // Filter by types if specified
      if (options.types && options.types.length > 0) {
        const tokenType = FIGMA_TO_TOKEN_TYPE[variable.resolvedType];
        // Check against both raw Figma type and converted token type for compatibility
        if (!options.types.includes(variable.resolvedType) && !options.types.includes(tokenType)) {
          continue;
        }
      }

      const tokenPath = this.generateTokenPath(variable.name);
      const tokenData = await this.generateTokenDataForMode(variable, mode, options, variableMap);

      if (tokenData) {
        this.setNestedProperty(tokens, tokenPath, tokenData);
      }
    }

    return tokens;
  }

  private async generateTokenData(
    variable: Variable,
    collection: VariableCollection,
    options: JSONExportOptions,
    variableMap?: Map<string, Variable>
  ): Promise<any> {
    const format = options.format || 'w3c';
    const useW3CKeys = options.jsonOptions?.useW3CKeys !== false;

    if (!collection.modes || collection.modes.length === 0) {
      console.warn(`Collection ${collection.name} has no modes`);
      return null;
    }

    const tokenType = getTokenType(variable);

    // 🆕 MULTI-MODE SUPPORT: Check if we should include all modes
    if (options.includeModes && collection.modes.length > 1) {

      // Create multi-mode value object: { "mode-1": value1, "mode-2": value2, ... }
      const multiModeValue: Record<string, any> = {};
      let hasAnyValue = false;

      for (const mode of collection.modes) {
        // Filter by selected modes if specified
        if (options.modes && options.modes.length > 0) {
          if (!options.modes.includes(mode.modeId) && !options.modes.includes(mode.name)) {
            continue; // Skip non-selected modes
          }
        }

        const modeValue = variable.valuesByMode[mode.modeId];
        if (modeValue !== undefined) {
          const processedValue = await this.processValue(modeValue, variable.resolvedType, variableMap);
          multiModeValue[mode.name] = processedValue;
          hasAnyValue = true;
        }
      }

      if (!hasAnyValue) {
        return null;
      }


      // Build token with multi-mode value
      switch (format) {
        case 'w3c':
          const token: any = {
            [useW3CKeys ? '$value' : 'value']: multiModeValue,
            [useW3CKeys ? '$type' : 'type']: tokenType
          };

          if (variable.description && options.jsonOptions?.includeMetadata) {
            token[useW3CKeys ? '$description' : 'description'] = variable.description;
          }

          if (options.jsonOptions?.includeMetadata) {
            token[useW3CKeys ? '$extensions' : 'extensions'] = {
              'com.figma': {
                variableId: variable.id,
                collectionId: collection.id,
                modes: collection.modes.map(m => m.name)
              }
            };
          }

          return token;

        case 'token-studio':
        case 'style-dictionary':
        case 'ant-design':
        case 'figma':
        case 'figma-raw':
        default:
          // For other formats, use multi-mode value as-is
          return {
            value: multiModeValue,
            type: tokenType,
            ...(variable.description ? { description: variable.description } : {})
          };
      }
    }

    // SINGLE MODE: Original logic for backwards compatibility
    // 🔧 FIX: Respect mode selection even in single-mode export
    let selectedMode = collection.modes[0]; // Default to first mode

    // If user has selected specific modes, use the first selected mode instead
    if (options.modes && options.modes.length > 0) {
      const foundMode = collection.modes.find(mode =>
        options.modes!.includes(mode.modeId) || options.modes!.includes(mode.name)
      );
      if (foundMode) {
        selectedMode = foundMode;
      } else {
        // No selected mode found for this collection, skip this variable
        return null;
      }
    }

    if (!selectedMode || !selectedMode.modeId) {
      console.warn(`Invalid mode for collection ${collection.name}`);
      return null;
    }

    const value = variable.valuesByMode[selectedMode.modeId];
    if (value === undefined) {
      return null;
    }

    const processedValue = await this.processValue(value, variable.resolvedType, variableMap);


    switch (format) {
      case 'w3c':
        const token: any = {
          [useW3CKeys ? '$value' : 'value']: processedValue,
          [useW3CKeys ? '$type' : 'type']: tokenType
        };

        // Add description only if it exists and metadata is enabled
        if (variable.description && options.jsonOptions?.includeMetadata) {
          token[useW3CKeys ? '$description' : 'description'] = variable.description;
        }

        // Add extensions only if explicitly requested (keep clean W3C format by default)
        if (options.jsonOptions?.includeMetadata) {
          token[useW3CKeys ? '$extensions' : 'extensions'] = {
            'com.figma': {
              variableId: variable.id,
              collectionId: collection.id
            }
          };
        }

        return token;

      case 'token-studio':
        return {
          value: processedValue,
          type: this.mapToTokenStudioType(tokenType),
          ...(variable.description ? { description: variable.description } : {})
        };

      case 'style-dictionary':
        // Style Dictionary format - hierarchical structure, NO type field
        // Style Dictionary deduces type from CTI structure
        return {
          value: processedValue,
          // NO type field - Style Dictionary uses CTI structure
          ...(variable.description ? { comment: variable.description } : {})
          // NO attributes - generated by Style Dictionary 'attribute/cti' transform
        };

      case 'ant-design':
        // Ant Design v5 token format - uses specific structure
        const antToken: any = {
          value: processedValue
        };

        // Add Ant Design specific metadata
        if (tokenType === 'color') {
          antToken.type = 'color';
        } else if (tokenType === 'number' || tokenType === 'spacing' || tokenType === 'size') {
          antToken.type = 'number';
        } else {
          antToken.type = tokenType;
        }

        if (variable.description) {
          antToken.desc = variable.description;
        }

        return antToken;

      case 'figma':
      case 'figma-raw':
      default:
        return {
          value: processedValue,
          type: tokenType,
          resolvedType: variable.resolvedType,
          ...(variable.description ? { description: variable.description } : {}),
          ...(options.jsonOptions?.includeMetadata ? {
            metadata: {
              variableId: variable.id,
              collectionId: collection.id,
              modes: Object.keys(variable.valuesByMode)
            }
          } : {})
        };
    }
  }

  private async generateTokenDataForMode(
    variable: Variable,
    mode: any,
    options: JSONExportOptions,
    variableMap?: Map<string, Variable>
  ): Promise<any> {
    const format = options.format || 'w3c';
    const useW3CKeys = options.jsonOptions?.useW3CKeys !== false;

    if (!mode || !mode.modeId) {
      console.warn(`Invalid mode provided for variable ${variable.name}`);
      return null;
    }

    const value = variable.valuesByMode[mode.modeId];
    if (value === undefined) return null;

    const processedValue = await this.processValue(value, variable.resolvedType, variableMap);
    const tokenType = getTokenType(variable);

    switch (format) {
      case 'w3c':
        return {
          [useW3CKeys ? '$value' : 'value']: processedValue,
          [useW3CKeys ? '$type' : 'type']: tokenType
        };

      case 'token-studio':
        return {
          value: processedValue,
          type: this.mapToTokenStudioType(tokenType)
        };

      case 'style-dictionary':
        // Style Dictionary format - consistent with main function
        return {
          value: processedValue,
          // NO type field - Style Dictionary uses CTI structure
          ...(variable.description ? { comment: variable.description } : {})
          // NO attributes - generated by Style Dictionary transform
        };

      case 'ant-design':
        // Ant Design v5 format - consistent with main function
        const antModeToken: any = {
          value: processedValue
        };

        if (tokenType === 'color') {
          antModeToken.type = 'color';
        } else if (tokenType === 'number' || tokenType === 'spacing' || tokenType === 'size') {
          antModeToken.type = 'number';
        } else {
          antModeToken.type = tokenType;
        }

        if (variable.description) {
          antModeToken.desc = variable.description;
        }

        return antModeToken;

      case 'figma':
      case 'figma-raw':
      default:
        return {
          value: processedValue,
          type: tokenType,
          resolvedType: variable.resolvedType
        };
    }
  }

  private async processValue(value: any, type: string, variableMap?: Map<string, Variable>): Promise<any> {
    try {
      // Check if value is a VariableAlias (reference to another variable)
      if (value && typeof value === 'object' && value.type === 'VARIABLE_ALIAS') {
        return await this.processVariableAlias(value, variableMap);
      }

      switch (type) {
        case 'COLOR':
          return await this.processColorValue(value, variableMap);
        case 'FLOAT':
          return typeof value === 'number' ? value : parseFloat(value) || 0;
        case 'STRING':
          return typeof value === 'string' ? value : String(value);
        case 'BOOLEAN':
          return Boolean(value);
        default:
          return value;
      }
    } catch (error) {
      console.warn(`Error processing value:`, value, `for type:`, type, error);
      return null;
    }
  }

  private async processVariableAlias(aliasValue: any, variableMap?: Map<string, Variable>): Promise<string> {
    try {
      // Use the variable map if available, otherwise fall back to API
      let referencedVariable: Variable | null = null;

      if (variableMap && aliasValue.id) {
        referencedVariable = variableMap.get(aliasValue.id) || null;
      }

      // If not found in local map, try to get it from remote libraries
      if (!referencedVariable && aliasValue.id) {
        // Try LibraryManager first (optimized with cache)
        try {
          referencedVariable = await this.libraryManager.getRemoteVariable(aliasValue.id);

          // Add to variableMap for future lookups (dynamic cache)
          if (referencedVariable && variableMap) {
            variableMap.set(aliasValue.id, referencedVariable);
          }
        } catch (error) {
          console.warn(`[JSONExporter] LibraryManager failed for ${aliasValue.id}, falling back to direct API`);
        }

        // Fallback to async Figma API (works for both local and remote variables)
        if (!referencedVariable) {
          try {
            referencedVariable = await figma.variables.getVariableByIdAsync(aliasValue.id);

            // Add to variableMap for future lookups (dynamic cache)
            if (referencedVariable && variableMap) {
              variableMap.set(aliasValue.id, referencedVariable);
            }
          } catch (error) {
            console.warn(`[JSONExporter] Failed to get variable by ID: ${aliasValue.id}`, error);
          }
        }
      }

      if (referencedVariable) {
        // Check if variable is from external library
        const isRemote = this.libraryManager.isRemoteVariable(referencedVariable);

        if (isRemote) {
          // For remote variables, try to get library info
          const libraryInfo = await this.libraryManager.getLibraryInfo(referencedVariable);

          // Build alias name with library/collection prefix if available
          // Format: {libraryName/collectionName/variableName} or {collectionName/variableName}
          let aliasName = '';

          if (libraryInfo?.collectionName) {
            // Use collection name as prefix for remote variables
            aliasName = `${libraryInfo.collectionName}/${referencedVariable.name}`;
          } else {
            // Fallback: just use variable name
            aliasName = referencedVariable.name;
          }

          // Convert slashes to dots for consistency
          aliasName = aliasName.replace(/\//g, '.');
          return `{${aliasName}}`;
        } else {
          // For local variables, use the standard format
          // Convert color/blue/500 -> color.blue.500
          const aliasName = referencedVariable.name.replace(/\//g, '.');
          return `{${aliasName}}`;
        }
      } else {
        console.warn(`Referenced variable not found for alias ID: ${aliasValue.id}`);
        return `{unknown-variable-${aliasValue.id}}`;
      }
    } catch (error) {
      console.warn(`Error processing variable alias:`, aliasValue, error);
      return `{alias-error-${aliasValue.id || 'unknown'}}`;
    }
  }

  private async processColorValue(value: any, variableMap?: Map<string, Variable>): Promise<string> {
    try {
      // Check if color value is a VariableAlias
      if (value && typeof value === 'object' && value.type === 'VARIABLE_ALIAS') {
        return await this.processVariableAlias(value, variableMap);
      }

      if (value && typeof value === 'object' && 'r' in value) {
        const r = Math.round((value.r || 0) * 255);
        const g = Math.round((value.g || 0) * 255);
        const b = Math.round((value.b || 0) * 255);

        if (value.a !== undefined && value.a < 1) {
          // Round alpha to 3 decimal places to avoid floating point precision issues
          const alpha = Math.round(value.a * 1000) / 1000;
          return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }

        // Convert to hex
        const toHex = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0');
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
      }

      return String(value);
    } catch (error) {
      console.warn(`Error processing color value:`, value, error);
      return '#000000'; // Default fallback color
    }
  }

  private mapToTokenStudioType(w3cType: string): string {
    const typeMap: { [key: string]: string } = {
      'color': 'color',
      'number': 'spacing',
      'string': 'string',
      'boolean': 'boolean',
      'typography': 'typography',
      'fontFamily': 'fontFamilies'
    };

    return typeMap[w3cType] || w3cType;
  }

  private generateTokenPath(name: string): string[] {
    return name.split('/').map(part =>
      part.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-')
    );
  }

  private setNestedProperty(obj: any, path: string[], value: any): void {
    let current = obj;
    for (let i = 0; i < path.length - 1; i++) {
      if (!current[path[i]]) {
        current[path[i]] = {};
      }
      current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
  }

  private formatJSON(tokens: any, options: JSONExportOptions): string {
    const prettify = options.jsonOptions?.prettify !== false;
    return prettify ? JSON.stringify(tokens, null, 2) : JSON.stringify(tokens);
  }

  private flattenForStyleDictionary(tokens: any): any {
    // Style Dictionary expects nested structure with "value" property ONLY
    // NO type field - Style Dictionary deduces type from CTI hierarchy
    // Supports both W3C ($value) and legacy (value) formats
    const styleDictionaryTokens: any = {};

    const convertToStyleDictionary = (obj: any, currentPath: string[] = []): any => {
      const result: any = {};

      for (const [key, value] of Object.entries(obj)) {
        if (value && typeof value === 'object') {
          // Check if this is a token (has $value or value property)
          if ((value as any).$value !== undefined || (value as any).value !== undefined) {
            // This is a token - convert to Style Dictionary format
            const tokenValue = (value as any).$value || (value as any).value;
            const tokenDescription = (value as any).$description || (value as any).description || (value as any).comment;

            result[key] = {
              value: tokenValue,
              // NO type field
              ...(tokenDescription ? { comment: tokenDescription } : {})
            };
          } else {
            // This is a group - recurse to preserve hierarchy
            result[key] = convertToStyleDictionary(value, [...currentPath, key]);
          }
        }
      }

      return result;
    };

    const converted = convertToStyleDictionary(tokens);

    // Apply CTI organization
    const organized = this.organizeToCTI(converted);
    return organized;
  }

  /**
   * Organize tokens into CTI (Category/Type/Item) structure for Style Dictionary
   * CTI levels: Category → Type → Item → Sub-item → State
   */
  private organizeToCTI(tokens: any): any {
    const organized: any = {};

    const processToken = (path: string[], token: any): void => {
      if (path.length === 0) return;

      // Extract CTI from path
      const cti = this.extractCTIFromPath(path, token);

      // Build nested structure based on CTI
      const ctiPath = [
        cti.category,
        cti.type,
        cti.item,
        cti.subitem,
        cti.state,
        ...path.slice(cti.consumedSegments || path.length)
      ].filter(Boolean); // Remove undefined/null values

      // Set token at CTI path
      this.setNestedProperty(organized, ctiPath, token);
    };

    const traverse = (obj: any, currentPath: string[] = []): void => {
      for (const [key, value] of Object.entries(obj)) {
        const newPath = [...currentPath, key];

        if (value && typeof value === 'object' && (value as any).value !== undefined) {
          // This is a token
          processToken(newPath, value);
        } else if (value && typeof value === 'object') {
          // This is a group - recurse
          traverse(value, newPath);
        }
      }
    };

    traverse(tokens);
    return organized;
  }

  /**
   * Extract CTI (Category/Type/Item/Sub-item/State) from token path
   */
  private extractCTIFromPath(path: string[], token: any): any {
    // Infer category from token value type or path
    let category = 'base';
    let consumedSegments = 0;

    const firstSegment = path[0]?.toLowerCase() || '';

    // Deduce category from first path segment
    if (firstSegment.includes('color') || firstSegment.includes('colours')) {
      category = 'color';
      consumedSegments = 1;
    } else if (firstSegment.includes('size') || firstSegment.includes('sizing') || firstSegment.includes('spacing')) {
      category = 'size';
      consumedSegments = 1;
    } else if (firstSegment.includes('font') || firstSegment.includes('typography')) {
      category = 'font';
      consumedSegments = 1;
    } else if (firstSegment.includes('time') || firstSegment.includes('duration')) {
      category = 'time';
      consumedSegments = 1;
    } else if (firstSegment.includes('border')) {
      category = 'border';
      consumedSegments = 1;
    } else if (firstSegment.includes('shadow')) {
      category = 'shadow';
      consumedSegments = 1;
    } else {
      // Try to infer from value
      if (typeof token.value === 'string' && token.value.startsWith('#')) {
        category = 'color';
      } else if (typeof token.value === 'number') {
        category = 'size';
      }
    }

    // Type is usually the second segment (background, text, border, etc.)
    const type = path[consumedSegments] || undefined;

    // Item is the third segment (button, input, card, etc.)
    const item = path[consumedSegments + 1] || undefined;

    // Sub-item is the fourth segment (primary, secondary, etc.)
    const subitem = path[consumedSegments + 2] || undefined;

    // State is the fifth segment (hover, active, disabled, etc.)
    const state = path[consumedSegments + 3] || undefined;

    return { category, type, item, subitem, state, consumedSegments };
  }

  private wrapForAntDesign(tokens: any): any {
    // Ant Design v5 expects tokens to be wrapped in {token: {}, components: {}} structure
    // Need to flatten the hierarchical structure and map to Ant Design naming conventions
    const antDesignTokens: any = {};

    const mapToAntDesignTokens = (obj: any, prefix: string = ''): void => {
      for (const [key, value] of Object.entries(obj)) {
        if (value && typeof value === 'object') {
          // Check if this is a token (has $value or value property)
          if ((value as any).$value !== undefined || (value as any).value !== undefined) {
            // This is a token - map to Ant Design naming
            const tokenValue = (value as any).$value || (value as any).value;
            const tokenType = (value as any).$type || (value as any).type;
            const antDesignKey = this.mapToAntDesignKey(key, prefix, tokenType);

            if (antDesignKey) {
              antDesignTokens[antDesignKey] = tokenValue;
            }
          } else {
            // This is a group - recurse with prefix
            const newPrefix = prefix ? `${prefix}/${key}` : key;
            mapToAntDesignTokens(value, newPrefix);
          }
        }
      }
    };

    mapToAntDesignTokens(tokens);

    // Generate component-specific overrides
    const components = this.generateAntDesignComponents(tokens);

    const wrapped = {
      token: antDesignTokens,
      components
    };

    return wrapped;
  }

  /**
   * Generate Ant Design component-specific token overrides
   */
  private generateAntDesignComponents(tokens: any): any {
    const components: any = {};

    const mapToComponent = (obj: any, prefix: string = ''): void => {
      for (const [key, value] of Object.entries(obj)) {
        if (value && typeof value === 'object') {
          const fullPath = prefix ? `${prefix}/${key}` : key;
          const pathLower = fullPath.toLowerCase();

          // Check if this is a token
          if ((value as any).$value !== undefined || (value as any).value !== undefined) {
            const tokenValue = (value as any).$value || (value as any).value;
            const componentMatch = this.matchTokenToComponent(pathLower, tokenValue);

            if (componentMatch) {
              if (!components[componentMatch.component]) {
                components[componentMatch.component] = {};
              }
              components[componentMatch.component][componentMatch.property] = tokenValue;
            }
          } else {
            // Recurse into nested objects
            mapToComponent(value, fullPath);
          }
        }
      }
    };

    mapToComponent(tokens);
    return components;
  }

  /**
   * Match token path to Ant Design component and property
   */
  private matchTokenToComponent(pathLower: string, value: any): { component: string; property: string } | null {
    // Button component
    if (pathLower.includes('button')) {
      if (pathLower.includes('height') || pathLower.includes('size')) {
        return { component: 'Button', property: 'controlHeight' };
      }
      if (pathLower.includes('radius')) {
        return { component: 'Button', property: 'borderRadius' };
      }
      if (pathLower.includes('primary') && pathLower.includes('bg')) {
        return { component: 'Button', property: 'primaryColor' };
      }
    }

    // Input component
    if (pathLower.includes('input')) {
      if (pathLower.includes('height') || pathLower.includes('size')) {
        return { component: 'Input', property: 'controlHeight' };
      }
      if (pathLower.includes('radius')) {
        return { component: 'Input', property: 'borderRadius' };
      }
      if (pathLower.includes('padding')) {
        return { component: 'Input', property: 'paddingBlock' };
      }
    }

    // Card component
    if (pathLower.includes('card')) {
      if (pathLower.includes('radius')) {
        return { component: 'Card', property: 'borderRadius' };
      }
      if (pathLower.includes('padding')) {
        return { component: 'Card', property: 'paddingLG' };
      }
      if (pathLower.includes('shadow')) {
        return { component: 'Card', property: 'boxShadow' };
      }
    }

    // Table component
    if (pathLower.includes('table')) {
      if (pathLower.includes('header') && pathLower.includes('bg')) {
        return { component: 'Table', property: 'headerBg' };
      }
      if (pathLower.includes('row') && pathLower.includes('hover')) {
        return { component: 'Table', property: 'rowHoverBg' };
      }
    }

    // Modal component
    if (pathLower.includes('modal') || pathLower.includes('dialog')) {
      if (pathLower.includes('radius')) {
        return { component: 'Modal', property: 'borderRadius' };
      }
      if (pathLower.includes('padding')) {
        return { component: 'Modal', property: 'contentPadding' };
      }
    }

    // Dropdown component
    if (pathLower.includes('dropdown') || pathLower.includes('menu')) {
      if (pathLower.includes('radius')) {
        return { component: 'Dropdown', property: 'borderRadius' };
      }
    }

    // Switch component
    if (pathLower.includes('switch') || pathLower.includes('toggle')) {
      if (pathLower.includes('size') || pathLower.includes('height')) {
        return { component: 'Switch', property: 'handleSize' };
      }
    }

    return null;
  }

  private mapToAntDesignKey(key: string, prefix: string, tokenType: string): string | null {
    // Map token paths to Ant Design v5 token naming conventions
    const fullPath = prefix ? `${prefix}/${key}` : key;
    const pathLower = fullPath.toLowerCase();

    // Color mapping - comprehensive mapping with fallback
    if (tokenType === 'color') {
      if (pathLower.includes('primary')) return 'colorPrimary';
      if (pathLower.includes('success') || pathLower.includes('green')) return 'colorSuccess';
      if (pathLower.includes('warning') || pathLower.includes('yellow') || pathLower.includes('orange')) return 'colorWarning';
      if (pathLower.includes('error') || pathLower.includes('danger') || pathLower.includes('red')) return 'colorError';
      if (pathLower.includes('info') || pathLower.includes('blue')) return 'colorInfo';
      if (pathLower.includes('text')) return 'colorText';
      if (pathLower.includes('link')) return 'colorLink';
      if (pathLower.includes('border')) return 'colorBorder';
      if (pathLower.includes('background') || pathLower.includes('bg')) return 'colorBgContainer';
      if (pathLower.includes('surface')) return 'colorBgElevated';
      if (pathLower.includes('fill')) return 'colorFill';
      // Enhanced fallback - preserve full path for custom colors
      const sanitizedKey = fullPath.replace(/[^a-zA-Z0-9]/g, '').replace(/^./, str => str.toUpperCase());
      return `color${sanitizedKey}`;
    }

    // Border radius mapping - improved with more variants
    if (tokenType === 'borderRadius' || pathLower.includes('radius') || pathLower.includes('rounded')) {
      if (pathLower.includes('small') || pathLower.includes('xs') || pathLower.includes('2')) return 'borderRadiusXS';
      if (pathLower.includes('large') || pathLower.includes('lg') || pathLower.includes('8')) return 'borderRadiusLG';
      if (pathLower.includes('none') || pathLower.includes('0')) return 'borderRadiusOuter';
      const sanitizedKey = fullPath.replace(/[^a-zA-Z0-9]/g, '').replace(/^./, str => str.toUpperCase());
      return `borderRadius${sanitizedKey}`;
    }

    // Size/spacing mapping - include ALL spacing tokens with proper mapping
    if (tokenType === 'spacing' || tokenType === 'size' || tokenType === 'dimension' || tokenType === 'number') {
      if (pathLower.includes('margin')) return 'margin';
      if (pathLower.includes('padding')) return 'padding';
      if (pathLower.includes('gap')) return 'marginXS'; // Map gaps to margin variants
      if (pathLower.includes('xs') || pathLower.includes('4')) return 'marginXS';
      if (pathLower.includes('sm') || pathLower.includes('8')) return 'marginSM';
      if (pathLower.includes('md') || pathLower.includes('16')) return 'margin';
      if (pathLower.includes('lg') || pathLower.includes('24')) return 'marginLG';
      if (pathLower.includes('xl') || pathLower.includes('32')) return 'marginXL';
      if (pathLower.includes('xxl') || pathLower.includes('48')) return 'marginXXL';
      // Fallback for all other spacing/dimension tokens
      const sanitizedKey = fullPath.replace(/[^a-zA-Z0-9]/g, '').replace(/^./, str => str.toUpperCase());
      return `size${sanitizedKey}`;
    }

    // Typography mapping - comprehensive font handling
    if (tokenType === 'fontSize' || tokenType === 'fontFamily' || tokenType === 'fontWeight' ||
      tokenType === 'lineHeight' || tokenType === 'letterSpacing' || pathLower.includes('font')) {
      if (pathLower.includes('size')) {
        if (pathLower.includes('xs') || pathLower.includes('12')) return 'fontSizeXS';
        if (pathLower.includes('sm') || pathLower.includes('14')) return 'fontSizeSM';
        if (pathLower.includes('lg') || pathLower.includes('18')) return 'fontSizeLG';
        if (pathLower.includes('xl') || pathLower.includes('20')) return 'fontSizeXL';
        return 'fontSize';
      }
      if (pathLower.includes('family')) return 'fontFamily';
      if (pathLower.includes('weight')) return 'fontWeightStrong';
      if (pathLower.includes('height') || pathLower.includes('leading')) return 'lineHeight';
      if (pathLower.includes('spacing') || pathLower.includes('tracking')) return 'letterSpacing';
      // Default font mapping
      const sanitizedKey = fullPath.replace(/[^a-zA-Z0-9]/g, '').replace(/^./, str => str.toUpperCase());
      return `font${sanitizedKey}`;
    }

    // Shadow mapping
    if (tokenType === 'boxShadow' || pathLower.includes('shadow') || pathLower.includes('elevation')) {
      if (pathLower.includes('none') || pathLower.includes('0')) return 'boxShadowTertiary';
      if (pathLower.includes('sm') || pathLower.includes('1')) return 'boxShadowSecondary';
      if (pathLower.includes('lg') || pathLower.includes('2')) return 'boxShadow';
      const sanitizedKey = fullPath.replace(/[^a-zA-Z0-9]/g, '').replace(/^./, str => str.toUpperCase());
      return `boxShadow${sanitizedKey}`;
    }

    // Motion/Duration mapping
    if (tokenType === 'duration' || pathLower.includes('duration') || pathLower.includes('transition')) {
      if (pathLower.includes('fast') || pathLower.includes('100')) return 'motionDurationFast';
      if (pathLower.includes('mid') || pathLower.includes('200')) return 'motionDurationMid';
      if (pathLower.includes('slow') || pathLower.includes('300')) return 'motionDurationSlow';
      const sanitizedKey = fullPath.replace(/[^a-zA-Z0-9]/g, '').replace(/^./, str => str.toUpperCase());
      return `motionDuration${sanitizedKey}`;
    }

    // Z-index mapping
    if (tokenType === 'zIndex' || pathLower.includes('zindex') || pathLower.includes('layer')) {
      const sanitizedKey = fullPath.replace(/[^a-zA-Z0-9]/g, '').replace(/^./, str => str.toUpperCase());
      return `zIndex${sanitizedKey}`;
    }

    // Opacity mapping
    if (tokenType === 'opacity' || pathLower.includes('opacity') || pathLower.includes('alpha')) {
      const sanitizedKey = fullPath.replace(/[^a-zA-Z0-9]/g, '').replace(/^./, str => str.toUpperCase());
      return `opacity${sanitizedKey}`;
    }

    // Generic fallback - ensure ALL tokens are included
    const sanitizedKey = fullPath.replace(/[^a-zA-Z0-9]/g, '').replace(/^./, str => str.toUpperCase());
    return `token${sanitizedKey}`;
  }

  private generateJSONFilename(collectionName: string, modeName?: string | null, options?: JSONExportOptions): string {
    // If no mode filter (combined/all modes), use pelican.json
    if (!modeName) {
      return 'pelican.json';
    }
    // With mode/brand filter: {collection-name}-{mode-name}-tokens.json
    const safeName = collectionName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const modeStr = modeName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    return `${safeName}-${modeStr}-tokens.json`;
  }

  private filterCollections(collections: VariableCollection[], selectedCollections?: any[]): VariableCollection[] {
    if (!selectedCollections || selectedCollections.length === 0) {
      return collections;
    }

    const selectedIds = selectedCollections.map(c => c.id);
    return collections.filter(collection => selectedIds.includes(collection.id));
  }
}

// TextStyleExtractor Class (from classes/TextStyleExtractor.ts)
interface ExtractedTextStyle {
  id: string;
  name: string;
  description?: string;
  fontFamily: string;
  fontStyle: string;
  fontSize: number | string; // Allow string for aliases like "{fontSize-large}"
  letterSpacing: string | number;
  lineHeight: string | number;
  paragraphIndent?: number | string; // Allow string for aliases
  paragraphSpacing?: number | string; // Allow string for aliases
  listSpacing?: number;
  textCase?: TextCase;
  textDecoration?: TextDecoration;
  textAlignHorizontal?: 'LEFT' | 'RIGHT' | 'CENTER' | 'JUSTIFIED';
  textAlignVertical?: 'TOP' | 'CENTER' | 'BOTTOM';
  hangingPunctuation?: boolean;
  hangingList?: boolean;
  $extensions?: {
    fontFile?: { [brand: string]: string } | string;
  };
  error?: string;
}

class TextStyleExtractor {
  private errorHandler: ProductionErrorHandler;
  private fontCache = new Set<string>();
  private aliasResolver: AdvancedAliasResolver;

  // 🆕 Cache per performance optimization
  private allVariablesCache?: Variable[];
  private allCollectionsCache?: VariableCollection[];
  private variableMapByName?: Map<string, Variable>;
  private collectionMapById?: Map<string, VariableCollection>;

  constructor(errorHandler: ProductionErrorHandler) {
    this.errorHandler = errorHandler;
    this.aliasResolver = new AdvancedAliasResolver();
  }

  async extractTextStyles(options: any = {}): Promise<{
    success: boolean;
    message: string;
    styles: ExtractedTextStyle[];
    totalProcessed: number;
    successCount: number;
    errorCount: number;
    errors?: string[];
  }> {
    try {

      // CRITICAL FIX: Use async API instead of deprecated sync version
      const textStyles = await figma.getLocalTextStylesAsync();

      if (textStyles.length === 0) {
        return {
          success: true,
          message: 'No text styles found in this document',
          styles: [],
          totalProcessed: 0,
          successCount: 0,
          errorCount: 0
        };
      }

      // 🆕 Pre-load variables and collections for performance (once per extraction)
      this.allVariablesCache = await figma.variables.getLocalVariablesAsync();
      this.allCollectionsCache = await figma.variables.getLocalVariableCollectionsAsync();
      this.variableMapByName = new Map(this.allVariablesCache.map(v => [v.name, v]));
      this.collectionMapById = new Map(this.allCollectionsCache.map(c => [c.id, c]));

      const batchSize = options.batchSize || 10;
      const extractedStyles: ExtractedTextStyle[] = [];
      const errors: string[] = [];
      let successCount = 0;

      for (let i = 0; i < textStyles.length; i += batchSize) {
        const batch = textStyles.slice(i, i + batchSize);

        const batchResults = await this.processBatch(batch, options);

        batchResults.forEach(result => {
          if (result.error) {
            errors.push(`Style "${result.name}": ${result.error}`);
          } else {
            successCount++;
          }
          extractedStyles.push(result);
        });

        await new Promise(resolve => setTimeout(resolve, 0));
      }

      const result = {
        success: true,
        message: `Successfully processed ${textStyles.length} text styles (${successCount} successful, ${errors.length} errors)`,
        styles: extractedStyles,
        totalProcessed: textStyles.length,
        successCount,
        errorCount: errors.length,
        ...(options.includeErrorDetails && errors.length > 0 && { errors })
      };

      // 🆕 Clear cache after extraction
      this.clearVariableCache();

      return result;

    } catch (error) {
      // 🆕 Clear cache even on error
      this.clearVariableCache();
      await this.errorHandler.handleError(error as Error, 'text_style_extraction');
      return {
        success: false,
        message: `Text styles extraction failed: ${(error as Error).message}`,
        styles: [],
        totalProcessed: 0,
        successCount: 0,
        errorCount: 1,
        errors: [(error as Error).message]
      };
    }
  }

  private async processBatch(textStyles: TextStyle[], options: any): Promise<ExtractedTextStyle[]> {
    const results: ExtractedTextStyle[] = [];

    for (const style of textStyles) {
      try {
        const extractedStyle = await this.extractSingleTextStyle(style, options);
        results.push(extractedStyle);
      } catch (error) {
        console.warn(`[TextStyleExtractor] Error processing style "${style.name}":`, error);
        results.push({
          id: style.id,
          name: style.name,
          description: options.includeDescription ? (style.description || '') : '',
          fontFamily: 'Error',
          fontStyle: 'Error',
          fontSize: 0,
          letterSpacing: 'error',
          lineHeight: 'error',
          error: (error as Error).message
        });
      }
    }

    return results;
  }

  private async extractSingleTextStyle(style: TextStyle, options: any): Promise<ExtractedTextStyle> {
    // Load font if not mixed and not skipping font loading
    if (!options.skipFontLoading && typeof style.fontName === 'object' && style.fontName) {
      await this.loadFontSafely(style.fontName);
    }

    // Check if preserve references is enabled (support both preserveAliases and preserveReferences)
    const preserveReferences = options.preserveAliases || options.preserveReferences || false;
    const boundVariables = style.boundVariables || {};


    // Helper to resolve bound variable
    const resolveBoundVar = async (prop: string, defaultValue: any) => {
      const boundVars = boundVariables as any;
      if (preserveReferences && boundVars[prop]) {
        const alias = await this.aliasResolver.resolveTokenAlias(boundVars[prop]);
        return alias;
      }
      return defaultValue;
    };

    const extractedStyle: ExtractedTextStyle = {
      id: style.id,
      name: style.name,
      description: options.includeDescription ? (style.description || '') : '',
      fontFamily: await resolveBoundVar('fontFamily',
        typeof style.fontName === 'object' && style.fontName ? style.fontName.family : 'Mixed'),
      fontStyle: typeof style.fontName === 'object' && style.fontName ? style.fontName.style : 'Mixed',
      fontSize: await resolveBoundVar('fontSize', style.fontSize),
      letterSpacing: await resolveBoundVar('letterSpacing', this.extractLetterSpacing(style.letterSpacing)),
      lineHeight: await resolveBoundVar('lineHeight', this.extractLineHeight(style.lineHeight)),
      paragraphIndent: await resolveBoundVar('paragraphIndent', style.paragraphIndent),
      paragraphSpacing: await resolveBoundVar('paragraphSpacing', style.paragraphSpacing),
      listSpacing: style.listSpacing,
      textCase: style.textCase,
      textDecoration: style.textDecoration,
      hangingPunctuation: style.hangingPunctuation,
      hangingList: style.hangingList,
    };

    // 🆕 Cerca e aggiungi fontFile da variabili Figma
    const fontFileVar = await this.findFontFileVariable(style.name);
    if (fontFileVar) {
      const multiBrandValues = await this.extractMultiBrandValues(fontFileVar);
      if (Object.keys(multiBrandValues).length > 0) {
        if (options.selectedBrand) {
          // Filter for specific brand
          if (multiBrandValues[options.selectedBrand]) {
            extractedStyle.$extensions = {
              fontFile: multiBrandValues[options.selectedBrand]
            };
          }
        } else {
          // Return all brands
          extractedStyle.$extensions = {
            fontFile: multiBrandValues
          };
        }
      }
    }

    return extractedStyle;
  }

  private async loadFontSafely(fontName: FontName): Promise<void> {
    const fontKey = `${fontName.family}:${fontName.style}`;
    if (this.fontCache.has(fontKey)) return;

    try {
      await figma.loadFontAsync(fontName);
      this.fontCache.add(fontKey);
    } catch (error) {
      console.warn(`[TextStyleExtractor] Failed to load font ${fontKey}:`, error);
      throw new Error(`Font loading failed: ${fontKey}`);
    }
  }

  private extractLetterSpacing(letterSpacing: LetterSpacing): string | number {
    // Check if it's mixed (figma.mixed is a symbol)
    if (typeof letterSpacing === 'symbol') return 'mixed';
    if (typeof letterSpacing === 'object' && letterSpacing !== null) {
      return (letterSpacing as any).unit === 'PERCENT' ? `${(letterSpacing as any).value}%` : `${(letterSpacing as any).value}px`;
    }
    return letterSpacing as number;
  }

  private extractLineHeight(lineHeight: LineHeight): string | number {
    // Check if it's mixed (figma.mixed is a symbol)
    if (typeof lineHeight === 'symbol') return 'mixed';
    if (typeof lineHeight === 'object' && lineHeight !== null) {
      const lh = lineHeight as any;
      switch (lh.unit) {
        case 'PERCENT': return `${lh.value}%`;
        case 'PIXELS': return `${lh.value}px`;
        case 'AUTO': return 'auto';
        default: return lh.value;
      }
    }
    return lineHeight as number;
  }

  formatTextStyles(styles: ExtractedTextStyle[], format: string = 'json'): { data: string; filename: string } {
    switch (format.toLowerCase()) {
      case 'json':
      default:
        return {
          data: JSON.stringify({
            textStyles: styles,
            metadata: {
              exportedAt: new Date().toISOString(),
              totalStyles: styles.length,
              successfulStyles: styles.filter(s => !s.error).length,
              version: '1.0.0'
            }
          }, null, 2),
          filename: 'text-styles.json'
        };
    }
  }
  /**
   * 🆕 Pulisce la cache delle variabili e collezioni
   */
  private clearVariableCache(): void {
    this.allVariablesCache = undefined;
    this.allCollectionsCache = undefined;
    this.variableMapByName = undefined;
    this.collectionMapById = undefined;
  }

  /**
   * Cerca una variabile fontFile associata al text style
   * Pattern: semantic/textStyle/{text-style-name}/fontFile
   *
   * 🆕 OTTIMIZZATO: Usa cache pre-caricata invece di chiamare API per ogni style
   */
  private async findFontFileVariable(textStyleName: string): Promise<Variable | null> {
    try {
      // Candidate paths to check
      const candidates = [
        `textStyle/${textStyleName}/fontFile`,          // Standard pattern
        `semantic/textStyle/${textStyleName}/fontFile`, // With semantic prefix
        `textStyle/${textStyleName.replace(/\//g, '.')}/fontFile` // Dot notation fallback
      ];

      console.log(`[TextStyleExtractor] Searching for fontFile variable for "${textStyleName}". Candidates:`, candidates);

      // 1. Try exact matches from cache
      if (this.variableMapByName) {
        for (const name of candidates) {
          const variable = this.variableMapByName.get(name);
          if (variable && variable.resolvedType === 'STRING') {
            console.log(`[TextStyleExtractor] ✅ Found variable (exact match): "${name}"`);
            return variable;
          }
        }
      }

      // 2. Fallback: Fuzzy search in cache
      // This helps if there are casing differences or slight naming variations
      if (this.allVariablesCache) {
        const targetSuffix = `/${textStyleName}/fontFile`.toLowerCase();
        const normalizedTarget = textStyleName.toLowerCase().replace(/\//g, '.');

        for (const variable of this.allVariablesCache) {
          if (variable.resolvedType !== 'STRING') continue;

          const varNameLower = variable.name.toLowerCase();

          // Check for suffix match (e.g. ".../texts/body1/bold/fontFile")
          if (varNameLower.endsWith(targetSuffix)) {
            console.log(`[TextStyleExtractor] ✅ Found variable (fuzzy suffix match): "${variable.name}"`);
            return variable;
          }

          // Check for dot notation match
          if (varNameLower.includes(normalizedTarget) && varNameLower.includes('fontfile')) {
            console.log(`[TextStyleExtractor] ✅ Found variable (fuzzy dot match): "${variable.name}"`);
            return variable;
          }
        }
      }

      // 3. API Fallback (only if cache is missing, unlikely)
      if (!this.variableMapByName && !this.allVariablesCache) {
        console.warn('[TextStyleExtractor] Cache missing, falling back to API scan');
        const allVariables = await figma.variables.getLocalVariablesAsync();
        for (const variable of allVariables) {
          if (variable.resolvedType !== 'STRING') continue;
          if (candidates.includes(variable.name)) return variable;
        }
      }

      console.log(`[TextStyleExtractor] ❌ No fontFile variable found for "${textStyleName}"`);
      return null;
    } catch (error) {
      console.warn(`[TextStyleExtractor] Error finding fontFile variable for "${textStyleName}":`, error);
      return null;
    }
  }

  /**
   * Estrae i valori multi-brand da una variabile
   *
   * 🆕 OTTIMIZZATO: Usa cache pre-caricata invece di chiamare API per ogni variable
   */
  private async extractMultiBrandValues(variable: Variable): Promise<{ [brand: string]: string }> {
    try {
      const values: { [key: string]: string } = {};

      // 🆕 Usa Map cache per lookup O(1)
      let collection: VariableCollection | undefined;

      if (this.collectionMapById) {
        // Cerca collection usando variableCollectionId
        collection = this.collectionMapById.get(variable.variableCollectionId);
      } else {
        // Fallback (non dovrebbe mai accadere se extractTextStyles pre-carica)
        const allCollections = await figma.variables.getLocalVariableCollectionsAsync();
        collection = allCollections.find(c => c.variableIds.includes(variable.id));
      }

      if (!collection) {
        return {};
      }

      // Estrai valori per ogni mode (orbit, mooney, AGI, comersud)
      for (const mode of collection.modes) {
        const value = variable.valuesByMode[mode.modeId];
        if (typeof value === 'string') {
          values[mode.name] = value;
        }
      }

      return values;
    } catch (error) {
      console.warn(`[TextStyleExtractor] Error extracting multi-brand values:`, error);
      return {};
    }
  }
}

// Global instances
let errorHandler: ProductionErrorHandler;
let tokenProcessor: TokenProcessor;
let variableManager: VariableManager;
let cssExporter: CSSExporter;
let jsonExporter: JSONExporter;
let textStyleExtractor: TextStyleExtractor;

// ================== INITIALIZATION ==================

// Initialize plugin
function initializePlugin(): void {
  // console.clear();

  errorHandler = new ProductionErrorHandler();
  tokenProcessor = new TokenProcessor();
  variableManager = new VariableManager();
  cssExporter = new CSSExporter();
  jsonExporter = new JSONExporter();
  textStyleExtractor = new TextStyleExtractor(errorHandler);

  figma.showUI(__html__, {
    width: UI_CONFIG.DEFAULT_WIDTH,
    height: UI_CONFIG.DEFAULT_HEIGHT,
    themeColors: true
  });

}

// Message handler
figma.ui.onmessage = async (msg: PluginMessage): Promise<void> => {
  console.log('[Plugin] 📩 Received message:', msg.type);
  try {
    const { type } = msg;

    switch (type) {
      case MESSAGE_TYPES.UI_READY:
        await handleUIReady();
        break;

      case MESSAGE_TYPES.GET_COLLECTIONS:
        await handleGetCollections();
        break;

      case MESSAGE_TYPES.IMPORT_JSON:
        await handleImportJson(msg);
        break;

      case MESSAGE_TYPES.EXPORT_JSON:
        await handleExportJson(msg);
        break;

      case MESSAGE_TYPES.EXPORT_JSON_ADVANCED:
        await handleExportJsonAdvanced(msg);
        break;

      case MESSAGE_TYPES.EXPORT_CSS:
        await handleExportCss(msg);
        break;

      case MESSAGE_TYPES.EXPORT_CSS_ADVANCED:
        await handleExportCss(msg);
        break;

      case MESSAGE_TYPES.EXPORT_TEXT_STYLES:
        await handleExportTextStyles(msg);
        break;

      case MESSAGE_TYPES.RESIZE:
        handleResize(msg.width, msg.height);
        break;

      case MESSAGE_TYPES.RENAME_COLLECTION:
        await handleRenameCollection(msg);
        break;

      case MESSAGE_TYPES.DELETE_COLLECTION:
        await handleDeleteCollection(msg);
        break;

      case MESSAGE_TYPES.CLEAR_ALL_COLLECTIONS:
        await handleClearAllCollections();
        break;

      case MESSAGE_TYPES.PREVIEW_IMPORT:
        await handlePreviewImport(msg);
        break;

      case MESSAGE_TYPES.BROWSE_LIBRARY:
        await handleBrowseLibrary();
        break;

      case MESSAGE_TYPES.GET_LIBRARY_VARIABLES:
        await handleGetLibraryVariables(msg);
        break;

      case MESSAGE_TYPES.IMPORT_FROM_LIBRARY:
        await handleImportFromLibrary(msg);
        break;

      // GitHub integration handlers
      case MESSAGE_TYPES.GITHUB_CONFIG_SAVE:
        await handleGitHubConfigSave(msg);
        break;

      case MESSAGE_TYPES.GITHUB_CONFIG_LOAD:
        await handleGitHubConfigLoad();
        break;

      case MESSAGE_TYPES.GITHUB_TEST_CONNECTION:
        await handleGitHubTestConnection(msg);
        break;

      case MESSAGE_TYPES.GITHUB_PUSH:
        await handleGitHubPush(msg);
        break;

      default:
        console.warn(`[Plugin] Unhandled message type: ${type}`);
    }
  } catch (error) {
    const errorResult = await errorHandler.handleError(
      error as Error,
      'processing',
      { messageType: msg.type }
    );

    if (!errorResult.shouldSkip) {
      figma.notify(`Error: ${(error as Error).message}`, { error: true });
    }
  }
};

// ================== IMPORT UTILITIES ==================

// Enhanced validation function from backup
function validateColorValues(data: any) {

  function validateObject(obj: any, path: string = '') {
    for (const [key, value] of Object.entries(obj)) {
      if (key.startsWith('$')) continue;

      const currentPath = path ? `${path}.${key}` : key;

      if (value && typeof value === 'object') {
        const tokenObj = value as any;
        if (tokenObj.$value !== undefined || tokenObj.value !== undefined) {
          // This is a token
          const tokenValue = tokenObj.$value || tokenObj.value;
          const tokenType = tokenObj.$type || tokenObj.type || 'string';

          if (tokenType === 'color' && typeof tokenValue === 'string') {
            if (!isValidColorString(tokenValue)) {
              console.warn(`[validateColorValues] Invalid color at ${currentPath}: ${tokenValue}`);
            }
          }
        } else {
          // This is a group, recurse
          validateObject(value, currentPath);
        }
      }
    }
  }

  validateObject(data);
}

function isValidColorString(colorStr: string): boolean {
  // Allow aliases (e.g., "{brand.core.main}", "{colors.primary}")
  if (colorStr.startsWith('{') && colorStr.endsWith('}')) {
    return true; // Aliases are valid
  }

  // Basic color validation
  if (colorStr.startsWith('#')) {
    const hex = colorStr.slice(1);
    return /^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$|^[0-9A-Fa-f]{8}$/.test(hex);
  }
  if (colorStr.startsWith('rgb') || colorStr.startsWith('hsl')) {
    return true; // Basic assumption - could be more rigorous
  }
  return false;
}

function countVariables(obj: any, depth = 0): number {
  if (depth > 20) return 0; // Prevent infinite recursion

  let count = 0;
  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith('$')) continue;

    if (value && typeof value === 'object') {
      const tokenObj = value as any;
      if (tokenObj.$value !== undefined || tokenObj.value !== undefined) {
        count++;
      } else {
        count += countVariables(value, depth + 1);
      }
    }
  }
  return count;
}

// PHASE 1: Create all variable structures (no values)
async function createVariablesFirstPass(data: any, collections: any, variables: any) {

  for (const collectionName in data) {
    if (collectionName.startsWith('$')) continue;

    const collectionData = data[collectionName];
    const collection = collections[collectionName];

    if (!collection) continue;

    await createCollectionVariables(collectionName, collectionData, '', collection, variables);
  }

}

async function createCollectionVariables(
  collectionName: string,
  obj: any,
  currentPath: string,
  collection: any,
  variables: any
) {

  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith('$')) {
      continue;
    }

    const path = currentPath ? `${currentPath}/${key}` : key;
    const fullPath = `${collectionName}/${path}`;

    if (value && typeof value === 'object') {
      const tokenObj = value as any;
      if (tokenObj.$value !== undefined || tokenObj.value !== undefined) {
        // This is a token - create variable
        const tokenType = tokenObj.$type || tokenObj.type || 'string';
        const figmaType = convertTypeToFigma(tokenType);

        if (!figmaType) {
          console.warn(`[createCollectionVariables] Unsupported type ${tokenType} for ${path}`);
          continue;
        }

        try {
          // Check if variable already exists
          const existingVars = await figma.variables.getLocalVariablesAsync();
          const existingVar = existingVars.find(
            v => v.name === path && v.variableCollectionId === collection.collection.id
          );


          let variable;
          if (existingVar && existingVar.resolvedType === figmaType) {
            variable = existingVar;
          } else {
            if (existingVar) {
              console.warn(`[createCollectionVariables] Type mismatch for ${path}, removing and recreating`);
              existingVar.remove();
            }
            variable = figma.variables.createVariable(path, collection.collection, figmaType);
          }

          // Apply automatic scopes with error handling
          try {
            assignSimpleScopes(variable, tokenType, path);
          } catch (scopeError) {
            console.warn(`[createCollectionVariables] Failed to assign scopes to ${path}:`, scopeError);
            // Continue without scopes if assignment fails
          }

          // Store reference
          variables[fullPath] = variable;

        } catch (error) {
          console.error(`[createCollectionVariables] Failed to create variable ${path}:`, error);
        }

      } else {
        // This is a group - recurse
        await createCollectionVariables(collectionName, value, path, collection, variables);
      }
    }
  }
}

// PHASE 2: Populate all values with alias queue (from backup)
async function populateValuesSecondPassWithAliases(data: any, collections: any, variables: any, modes: string[]): Promise<number> {
  const aliasQueue: any[] = [];

  for (const collectionName in data) {
    if (collectionName.startsWith('$')) continue;

    const collectionData = data[collectionName];
    const collection = collections[collectionName];

    if (!collection) continue;

    await populateCollectionValuesWithAliases(collectionName, collectionData, '', collection, variables, modes, aliasQueue);
  }

  // Process aliases after all direct values are set
  const processedAliases = await processAliasQueue(aliasQueue, collections, variables, modes);

  return processedAliases;
}

// Enhanced version that separates direct values from aliases
async function populateCollectionValuesWithAliases(
  collectionName: string,
  obj: any,
  currentPath: string,
  collection: any,
  variables: any,
  modes: string[],
  aliasQueue: any[]
): Promise<void> {
  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith('$')) continue;

    const path = currentPath ? `${currentPath}/${key}` : key;
    const fullPath = `${collectionName}/${path}`;

    if (value && typeof value === 'object') {
      const tokenObj = value as any;
      if (tokenObj.$value !== undefined || tokenObj.value !== undefined) {
        // This is a token - assign value or queue alias
        const variable = variables[fullPath];
        if (!variable) {
          console.warn(`[populateCollectionValuesWithAliases] Variable not found: ${fullPath}`);
          continue;
        }

        try {
          const tokenValue = tokenObj.$value || tokenObj.value;
          const tokenType = tokenObj.$type || tokenObj.type || 'string';

          // Check if this is an alias
          if (typeof tokenValue === 'string' && isAliasValue(tokenValue)) {
            // Queue alias for later processing
            aliasQueue.push({
              path: path,
              fullPath: fullPath,
              value: tokenValue,
              tokenType: tokenType,
              collectionName: collectionName,
              variable: variable,
              modes: modes
            });
          } else if (typeof tokenValue === 'object' && tokenValue.r === undefined) {
            // Multi-mode value - check each mode for aliases
            let hasAliases = false;
            const modeAliases: any = {};

            for (const [modeName, modeValue] of Object.entries(tokenValue)) {
              if (typeof modeValue === 'string' && isAliasValue(modeValue)) {
                hasAliases = true;
                modeAliases[modeName] = modeValue;
              }
            }

            if (hasAliases) {
              // Queue multi-mode alias
              aliasQueue.push({
                path: path,
                fullPath: fullPath,
                value: tokenValue,
                tokenType: tokenType,
                collectionName: collectionName,
                variable: variable,
                modes: modes,
                isMultiMode: true,
                modeAliases: modeAliases
              });
            } else {
              // Direct multi-mode value
              for (const [modeName, modeValue] of Object.entries(tokenValue)) {
                const modeId = collection.modeIds[modeName];
                if (modeId) {
                  const processedValue = processSimpleValue(modeValue, variable.resolvedType);
                  variable.setValueForMode(modeId, processedValue);
                }
              }
            }
          } else {
            // Direct single value
            const processedValue = processSimpleValue(tokenValue, variable.resolvedType);
            for (const modeName of modes) {
              const modeId = collection.modeIds[modeName] ||
                collection.modeIds['Default'] ||
                Object.values(collection.modeIds)[0];
              if (modeId) {
                variable.setValueForMode(modeId, processedValue);
              } else {
                console.error(`[populateCollectionValuesWithAliases] No valid mode found for ${path}, mode: ${modeName}`);
              }
            }
          }

        } catch (error) {
          console.error(`[populateCollectionValuesWithAliases] Failed to set value for ${path}:`, error);
        }

      } else {
        // This is a group - recurse
        await populateCollectionValuesWithAliases(collectionName, value, path, collection, variables, modes, aliasQueue);
      }
    }
  }
}

// Process alias queue using Advanced Alias Resolver
async function processAliasQueue(aliasQueue: any[], collections: any, variables: any, modes: string[]): Promise<number> {
  if (aliasQueue.length === 0) {
    return 0;
  }

  let processedCount = 0;

  for (const aliasItem of aliasQueue) {
    try {
      if (aliasItem.isMultiMode) {
        // Handle multi-mode aliases
        for (const [modeName, aliasValue] of Object.entries(aliasItem.modeAliases)) {
          const resolvedAlias = await resolveAliasValue(aliasValue as string, variables, aliasItem.collectionName);
          if (resolvedAlias !== null) {
            const collection = collections[aliasItem.collectionName];
            const modeId = collection.modeIds[modeName];
            if (modeId) {
              // Don't process alias through processSimpleValue - use directly
              aliasItem.variable.setValueForMode(modeId, resolvedAlias);
              processedCount++;
            }
          }
        }
      } else {
        // Handle single aliases
        const resolvedAlias = await resolveAliasValue(aliasItem.value, variables, aliasItem.collectionName);
        if (resolvedAlias !== null) {
          // Apply alias to all modes (or default mode)
          for (const modeName of aliasItem.modes) {
            const collection = collections[aliasItem.collectionName];
            const modeId = collection.modeIds[modeName] ||
              collection.modeIds['Default'] ||
              Object.values(collection.modeIds)[0];
            if (modeId) {
              aliasItem.variable.setValueForMode(modeId, resolvedAlias);
            } else {
              console.error(`[processAliasQueue] No valid mode found for ${aliasItem.path}, mode: ${modeName}`);
            }
          }
          processedCount++;
        }
      }
    } catch (error) {
      console.error(`[processAliasQueue] Failed to resolve alias ${aliasItem.path}:`, error);
    }
  }

  return processedCount;
}

// Correct alias resolution - returns Figma VARIABLE_ALIAS object
async function resolveAliasValue(aliasStr: string, variables: any, currentCollection: string): Promise<any> {
  const aliasPath = aliasStr.slice(1, -1); // Remove { }

  // Try different path variations - prioritizing slash format
  const variations = [
    `${currentCollection}/${aliasPath}`,
    `${currentCollection}/${aliasPath.replace(/\./g, '/')}`,
    aliasPath,
    aliasPath.replace(/\./g, '/'),
    aliasPath.replace(/\//g, '.'),
    `${currentCollection}.${aliasPath}`,
    `${currentCollection}.${aliasPath.replace(/\./g, '/')}`
  ];

  for (const variation of variations) {
    const targetVariable = variables[variation];
    if (targetVariable) {
      // Return Figma VARIABLE_ALIAS object, not the resolved value
      const aliasValue = { type: 'VARIABLE_ALIAS', id: targetVariable.id };
      return aliasValue;
    } else {
    }
  }

  console.warn(`[resolveAliasValue] Could not resolve alias: ${aliasPath}`);
  return null;
}

function isAliasValue(value: string): boolean {
  return typeof value === 'string' && value.startsWith('{') && value.endsWith('}');
}

async function populateCollectionValues(
  collectionName: string,
  obj: any,
  currentPath: string,
  collection: any,
  variables: any,
  modes: string[]
): Promise<number> {
  let count = 0;

  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith('$')) continue;

    const path = currentPath ? `${currentPath}/${key}` : key;
    const fullPath = `${collectionName}/${path}`;

    if (value && typeof value === 'object') {
      const tokenObj = value as any;
      if (tokenObj.$value !== undefined || tokenObj.value !== undefined) {
        // This is a token - assign value
        const variable = variables[fullPath];
        if (!variable) {
          console.warn(`[populateCollectionValues] Variable not found: ${fullPath}`);
          continue;
        }

        try {
          const tokenValue = tokenObj.$value || tokenObj.value;
          const tokenType = tokenObj.$type || tokenObj.type || 'string';

          // Process value based on type and modes
          if (typeof tokenValue === 'object' && tokenValue.r === undefined) {
            // Multi-mode value
            for (const [modeName, modeValue] of Object.entries(tokenValue)) {
              const modeId = collection.modeIds[modeName];
              if (modeId) {
                const processedValue = processSimpleValue(modeValue, variable.resolvedType);
                variable.setValueForMode(modeId, processedValue);
              }
            }
          } else {
            // Single value for all modes
            const processedValue = processSimpleValue(tokenValue, variable.resolvedType);
            for (const modeName of modes) {
              const modeId = collection.modeIds[modeName] ||
                collection.modeIds['Default'] ||
                Object.values(collection.modeIds)[0];
              if (modeId) {
                variable.setValueForMode(modeId, processedValue);
              } else {
                console.error(`[populateCollectionValues] No valid mode found for ${path}, mode: ${modeName}`);
              }
            }
          }

          count++;

        } catch (error) {
          console.error(`[populateCollectionValues] Failed to set value for ${path}:`, error);
        }

      } else {
        // This is a group - recurse
        count += await populateCollectionValues(collectionName, value, path, collection, variables, modes);
      }
    }
  }

  return count;
}

// Enhanced scope assignment from backup
function assignSimpleScopes(variable: any, tokenType: string, path: string): void {
  const scopes: string[] = [];
  const pathLower = path.toLowerCase();

  // Scope mapping based on Figma API official documentation (2024)
  if (tokenType === 'color') {
    // Color-specific scopes - using official Figma API scope names
    if (pathLower.includes('text') || pathLower.includes('foreground')) {
      scopes.push('TEXT_FILL');
    } else if (pathLower.includes('border') || pathLower.includes('stroke')) {
      scopes.push('STROKE_COLOR');
    } else if (pathLower.includes('effect') || pathLower.includes('shadow')) {
      scopes.push('EFFECT_COLOR');
    } else if (pathLower.includes('background') || pathLower.includes('surface') || pathLower.includes('fill')) {
      scopes.push('ALL_FILLS');
    } else {
      // For generic colors, use conservative fill approach
      scopes.push('ALL_FILLS');
    }
  }

  // Direct type-to-scope mapping (highest priority)
  const tokenTypeLower = tokenType.toLowerCase();

  // Typography scopes based on EXACT token type
  if (tokenTypeLower === 'fontfamily' || tokenTypeLower === 'font-family') {
    scopes.push('FONT_FAMILY');
  } else if (tokenTypeLower === 'fontsize' || tokenTypeLower === 'font-size') {
    scopes.push('FONT_SIZE');
  } else if (tokenTypeLower === 'fontweight' || tokenTypeLower === 'font-weight') {
    scopes.push('FONT_WEIGHT');
  } else if (tokenTypeLower === 'lineheight' || tokenTypeLower === 'line-height') {
    scopes.push('LINE_HEIGHT');
  } else if (tokenTypeLower === 'borderradius' || tokenTypeLower === 'border-radius' || tokenTypeLower === 'radius') {
    scopes.push('CORNER_RADIUS');
  }

  // Fallback: Typography-specific scopes (for generic STRING types)
  else if (tokenType === 'string') {
    if (pathLower.includes('font-family') || pathLower.includes('fontfamily')) {
      scopes.push('FONT_FAMILY');
    } else if (pathLower.includes('font-weight') || pathLower.includes('fontweight')) {
      scopes.push('FONT_WEIGHT');
    }
    // No scope for generic strings
  }

  // Fallback: Number/dimension-specific scopes (FLOAT type)
  else if (tokenType === 'number' || tokenType === 'spacing' || tokenType === 'dimension') {

    if (pathLower.includes('radius')) {
      scopes.push('CORNER_RADIUS');
    } else if (pathLower.includes('font-size') || pathLower.includes('fontsize')) {
      scopes.push('FONT_SIZE');
    } else if (pathLower.includes('line-height') || pathLower.includes('lineheight')) {
      scopes.push('LINE_HEIGHT');
    } else if (pathLower.includes('font-weight') || pathLower.includes('fontweight')) {
      scopes.push('FONT_WEIGHT');
    } else if (pathLower.includes('letter-spacing')) {
      scopes.push('LETTER_SPACING');
    } else if (pathLower.includes('paragraph-spacing')) {
      scopes.push('PARAGRAPH_SPACING');
    } else if (pathLower.includes('paragraph-indent')) {
      scopes.push('PARAGRAPH_INDENT');
    } else if (pathLower.includes('border') || pathLower.includes('stroke') || pathLower.includes('line-width')) {
      scopes.push('STROKE_FLOAT');
    } else if (pathLower.includes('opacity')) {
      scopes.push('OPACITY');
    } else if (pathLower.includes('width') || pathLower.includes('height') || pathLower.includes('size')) {
      scopes.push('WIDTH_HEIGHT');
    } else if (pathLower.includes('gap') || pathLower.includes('spacing')) {
      scopes.push('GAP');
    } else if (pathLower.includes('effect') || pathLower.includes('shadow') || pathLower.includes('blur')) {
      scopes.push('EFFECT_FLOAT');
    }
    // Don't assign any scope if path doesn't clearly indicate usage
  }

  if (scopes.length > 0) {
    variable.scopes = scopes as any;
  } else {
  }
}

// Simplified import system using existing utility functions
async function simpleImportVariables(
  jsonData: any,
  preserveScopes: boolean = false
): Promise<{
  success: boolean;
  message: string;
  variableCount: number;
  collectionCount: number;
}> {
  const progressLoader = new SimpleProgressLoader();

  try {
    // 🚀 Show progress bar and start at 0%
    progressLoader.show();
    progressLoader.updateProgress(5);

    let data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

    // Check if this is Token Studio format and convert if needed
    if (detectTokenStudioFormat(data)) {
      data = convertTokenStudioFormat(data);
    }

    // Pre-validate colors to prevent crashes
    validateColorValues(data);

    progressLoader.updateProgress(10); // Validation complete

    let variableCount = 0;
    let collectionCount = 0;

    // Count total collections for progress calculation
    const totalCollections = Object.keys(data).filter(key => !key.startsWith('$')).length;
    let processedCollections = 0;

    // Process each collection
    for (const collectionName in data) {
      if (collectionName.startsWith('$')) continue; // Skip metadata

      const collectionData = data[collectionName];

      // Extract modes for this collection
      const modes = extractModes(collectionData);

      // Create or get collection
      const collection = await getOrCreateSimpleCollection(collectionName, modes);
      if (!collection) continue;

      collectionCount++;

      // Calculate progress: 10% to 80% for processing collections
      const collectionProgress = 10 + Math.floor((processedCollections / totalCollections) * 70);
      progressLoader.updateProgress(collectionProgress);

      // Process variables in this collection using existing utility
      const varCount = await processCollectionSimple(
        collectionName,
        collectionData,
        collection,
        '',
        undefined,
        progressLoader, // Pass progress loader
        collectionProgress,
        collectionProgress + Math.floor(70 / totalCollections), // End progress for this collection
        preserveScopes
      );
      variableCount += varCount;

      processedCollections++;
    }

    // === PASSAGGIO 1 COMPLETATO ===
    progressLoader.updateProgress(80);

    // === PASSAGGIO 2: RISOLUZIONE ALIAS ===
    let aliasResults = { resolved: 0, failed: 0 };
    if (pendingAliases.length > 0) {
      progressLoader.updateProgress(85);
      aliasResults = await resolvePendingAliases();

      // Cleanup
      pendingAliases.length = 0;
      localVariablesCache = null;

    } else {
    }

    progressLoader.updateProgress(95);

    const finalMessage = aliasResults.resolved > 0
      ? `Successfully imported ${variableCount} variables (${aliasResults.resolved} aliases resolved) into ${collectionCount} collections`
      : `Successfully imported ${variableCount} variables into ${collectionCount} collections`;

    // Complete and hide
    progressLoader.updateProgress(100);
    await progressLoader.hide();

    return {
      success: true,
      message: finalMessage,
      variableCount,
      collectionCount
    };

  } catch (error) {
    console.error('[simpleImport] Error:', error);

    // Cleanup on error
    pendingAliases.length = 0;
    localVariablesCache = null;

    // Show error and hide progress
    await progressLoader.showError(`Import failed: ${(error as Error).message}`);

    return {
      success: false,
      message: `Import failed: ${(error as Error).message}`,
      variableCount: 0,
      collectionCount: 0
    };
  }
}

async function getOrCreateSimpleCollection(name: string, modes: string[] = ['Default']) {
  try {
    // Check if collection already exists
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    let collection = collections.find(c => c.name === name);

    if (collection) {

      // Get mode IDs from existing collection
      const modeIds: any = {};
      collection.modes.forEach(mode => {
        modeIds[mode.name] = mode.modeId;
      });

      // Check if we need to add missing modes
      const existingModeNames = collection.modes.map(m => m.name);
      const missingModes = modes.filter(mode => !existingModeNames.includes(mode));

      if (missingModes.length > 0) {

        // Add missing modes (respecting Figma's mode limit)
        for (const modeName of missingModes) {
          if (collection.modes.length < LIMITS.MAX_MODES_PER_COLLECTION) {
            try {
              const modeId = collection.addMode(modeName);
              modeIds[modeName] = modeId;
            } catch (error) {
              console.warn(`[simpleImport] Cannot add mode "${modeName}" to existing collection - Account limited to ${collection.modes.length} modes only`);
            }
          } else {
            console.warn(`[simpleImport] Cannot add mode "${modeName}" - collection already has ${LIMITS.MAX_MODES_PER_COLLECTION} modes (Figma limit)`);
          }
        }
      }

      return { collection, modeIds, isExisting: true };
    }

    // Create new collection
    // Check collection limit (Figma max: 40 collections)
    if (collections.length >= 40) {
      throw new Error(`Cannot create collection "${name}": Maximum collections limit (40) reached. Please delete unused collections first.`);
    }

    collection = figma.variables.createVariableCollection(name);

    // Keep track of mode IDs
    const modeIds: any = {};

    // Rename the default mode
    collection.renameMode(collection.modes[0].modeId, modes[0]);
    modeIds[modes[0]] = collection.modes[0].modeId;

    // Add additional modes (up to MAX_MODES_PER_COLLECTION total, but respect account limits)
    for (let i = 1; i < modes.length && i < LIMITS.MAX_MODES_PER_COLLECTION; i++) {
      try {
        const modeId = collection.addMode(modes[i]);
        modeIds[modes[i]] = modeId;
      } catch (error) {
        console.warn(`[simpleImport] Cannot add mode "${modes[i]}" to new collection - Account limited to ${collection.modes.length} modes only`);
        break;
      }
    }

    return { collection, modeIds, isExisting: false };

  } catch (error) {
    console.error(`[simpleImport] Failed to create collection ${name}:`, error);
    return null;
  }
}

async function processCollectionSimple(
  collectionName: string,
  data: any,
  collectionInfo: any,
  path: string = '',
  existingVarsCache?: Variable[],
  progressLoader?: SimpleProgressLoader,
  startProgress: number = 0,
  endProgress: number = 100,
  preserveScopes: boolean = false
): Promise<number> {
  let variableCount = 0;

  // 🚀 PERFORMANCE FIX: Get existing variables ONCE at the start instead of in the loop
  const existingVars = existingVarsCache || await figma.variables.getLocalVariablesAsync();

  // 📊 Count total items for progress tracking (only at root level)
  let totalItems = 0;
  let processedItems = 0;
  const isRootLevel = !path;

  if (isRootLevel && progressLoader) {
    for (const key in data) {
      if (key.startsWith('$')) continue;
      totalItems++;
    }

    // 🛡️ EDGE CASE: Se non ci sono items, imposta il progresso finale e termina
    if (totalItems === 0) {
      progressLoader.updateProgress(endProgress);
      return 0;
    }
  }

  const BATCH_SIZE = 50; // Process 50 items per batch
  let batchCount = 0;

  for (const key in data) {
    if (key.startsWith('$')) continue; // Skip metadata

    const value = data[key];
    const currentPath = path ? `${path}/${key}` : key;

    if (value.$value !== undefined || value.value !== undefined) {
      // This is a variable
      const tokenType = value.$type || value.type || 'string';
      const tokenValue = value.$value || value.value;


      // Convert type to Figma type
      const figmaType = convertTypeToFigma(tokenType);
      if (!figmaType) {
        console.warn(`[simpleImport] Unsupported type ${tokenType} for ${currentPath}`);
        continue;
      }

      // Check if tokenValue is a multi-mode object
      const isMultiMode = typeof tokenValue === 'object' &&
        tokenValue !== null &&
        !tokenValue.r &&
        !tokenValue.g &&
        !tokenValue.b &&
        !tokenValue.$value &&
        !tokenValue.value;

      // Check for existing variable with same name (using cached list)
      let variable = existingVars.find(v =>
        v.name === currentPath &&
        v.variableCollectionId === collectionInfo.collection.id
      );

      // Save scopes BEFORE any modifications (if preserveScopes is DISABLED - inverted logic!)
      // preserveScopes=false (DEFAULT): Preserve existing Figma scopes, don't overwrite
      // preserveScopes=true: Overwrite with automatic scopes from JSON/rules
      let scopesToPreserve: VariableScope[] | null = null;
      if (!preserveScopes && variable && variable.scopes && variable.scopes.length > 0) {
        scopesToPreserve = [...variable.scopes];
        console.log(`[simpleImport] Saving scopes for ${currentPath}: ${scopesToPreserve.join(', ')}`);
      }

      // Create or update variable
      let isNewOrRecreatedVariable = false;
      try {
        if (variable) {
          // Variable exists - check type compatibility
          if (variable.resolvedType !== figmaType) {
            console.log(`[simpleImport] Removing ${currentPath} (type changed from ${variable.resolvedType} to ${figmaType})`);
            variable.remove();
            variable = figma.variables.createVariable(
              currentPath,
              collectionInfo.collection,
              figmaType
            );
            isNewOrRecreatedVariable = true; // Type changed - variable was recreated
          } else {
            // Type is the same - check if scope and value are identical
            const shouldSkipUpdate = await shouldSkipVariableUpdate(
              variable,
              tokenValue,
              figmaType,
              collectionInfo,
              isMultiMode
            );

            if (shouldSkipUpdate) {
              variableCount++; // Count it but don't update
              continue; // Skip to next variable
            }

            // Variable is being reused (type didn't change)
            isNewOrRecreatedVariable = false;
          }
        } else {
          // Create new variable
          variable = figma.variables.createVariable(
            currentPath,
            collectionInfo.collection,
            figmaType
          );
          isNewOrRecreatedVariable = true; // New variable created
        }

        // Ensure variable is defined before proceeding
        if (!variable) {
          throw new Error(`Failed to create variable: ${currentPath}`);
        }

        // 🔄 PROCESS VALUE: Check if alias or concrete value
        const createdVariable = variable; // Capture for closure
        const processValue = (modeValue: any, modeId: string) => {
          const processedModeValue = validateValueForVariableType(modeValue, figmaType);

          if (isAliasMarker(processedModeValue)) {
            // 🛑 ALIAS: Store for STEP 2 resolution
            pendingAliases.push({
              variable: createdVariable,
              modeId: modeId,
              referencePath: processedModeValue.referencePath,
              figmaType: figmaType
            });
          } else {
            // ✅ CONCRETE VALUE: Assign immediately
            createdVariable.setValueForMode(modeId, processedModeValue);
          }
        };

        // Handle multi-mode values or single value
        if (isMultiMode) {
          // Multi-mode value: process each mode value individually
          for (const modeName in tokenValue) {
            if (collectionInfo.modeIds[modeName]) {
              processValue(tokenValue[modeName], collectionInfo.modeIds[modeName]);
            } else {
              console.warn(`[simpleImport] Mode ${modeName} not found in collection for variable ${currentPath}`);
            }
          }
        } else {
          // Single value: process for default/first mode
          const modeNames = Object.keys(collectionInfo.modeIds);
          const targetMode = collectionInfo.modeIds['Default'] ? 'Default' : modeNames[0];
          const targetModeId = collectionInfo.modeIds[targetMode];

          processValue(tokenValue, targetModeId);
        }

        // Apply preserved or automatic scopes
        if (scopesToPreserve) {
          // Checkbox OFF + had existing scopes
          if (isNewOrRecreatedVariable) {
            // Variable was recreated (type changed) OR newly created: REAPPLY saved scopes
            variable.scopes = scopesToPreserve;
            console.log(`[simpleImport] ✓ Reapplied preserved scopes to ${isNewOrRecreatedVariable ? 'recreated' : 'new'} variable ${currentPath}: ${scopesToPreserve.join(', ')}`);
          } else {
            // Variable was reused (only value changed): DON'T touch scopes
            console.log(`[simpleImport] ✓ Scopes preserved (not modified) for reused variable ${currentPath}: ${scopesToPreserve.join(', ')}`);
          }
        } else {
          // Checkbox ON OR new variable without existing scopes: Apply automatic scopes
          assignSimpleScopes(variable, tokenType, currentPath);
          if (!preserveScopes) {
            console.log(`[simpleImport] ✓ Applied automatic scopes for ${currentPath} (no existing scopes to preserve)`);
          } else {
            console.log(`[simpleImport] ✓ Applied automatic scopes for ${currentPath} (checkbox ON - overwrite mode)`);
          }
        }

        variableCount++;

      } catch (error) {
        console.error(`[simpleImport] Failed to create variable ${currentPath}:`, error);
      }

    } else if (typeof value === 'object') {
      // This is a group, process recursively (pass cache to avoid re-fetching)
      const groupCount = await processCollectionSimple(
        collectionName,
        value,
        collectionInfo,
        currentPath,
        existingVars, // 🚀 Pass the cached variables list
        progressLoader,
        startProgress,
        endProgress,
        preserveScopes
      );
      variableCount += groupCount;
    }

    // 🎯 UPDATE PROGRESS every BATCH_SIZE items (only at root level)
    if (isRootLevel && progressLoader && totalItems > 0) {
      processedItems++;
      batchCount++;

      if (batchCount >= BATCH_SIZE || processedItems === totalItems) {
        // Calculate progress within the range [startProgress, endProgress]
        const progress = startProgress + Math.floor((processedItems / totalItems) * (endProgress - startProgress));
        progressLoader.updateProgress(progress);

        // 🔄 YIELD TO UI THREAD - prevents freezing
        await new Promise<void>(resolve => setTimeout(resolve, 0));

        batchCount = 0; // Reset batch counter
      }
    }
  }

  return variableCount;
}

// ================== HELPER: SKIP UPDATE CHECK ==================

/**
 * Check if a variable update should be skipped to protect manual configurations.
 * An update is skipped if the variable's value(s) are identical to the incoming token values.
 * This preserves any manual changes to properties like scopes.
 *
 * @param variable - The existing Figma variable
 * @param tokenValue - The new value from the import JSON
 * @param figmaType - The Figma variable type
 * @param collectionInfo - Collection and mode information
 * @param isMultiMode - Whether the token value is multi-mode
 * @returns true if the update should be skipped (value unchanged)
 */
async function shouldSkipVariableUpdate(
  variable: Variable,
  tokenValue: any,
  figmaType: 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN',
  collectionInfo: any,
  isMultiMode: boolean
): Promise<boolean> {
  try {
    // Get current variable value(s) for comparison
    const collection = collectionInfo.collection as VariableCollection;

    // Compare values for all modes
    if (isMultiMode) {
      // Multi-mode: check all mode values
      for (const modeName in tokenValue) {
        const modeId = collectionInfo.modeIds[modeName];
        if (!modeId) continue;

        const currentValue = variable.valuesByMode[modeId];
        const newValue = validateValueForVariableType(tokenValue[modeName], figmaType);

        // If it's an alias, don't skip (aliases need to be resolved)
        if (isAliasMarker(newValue)) {
          return false;
        }

        // Compare values
        if (!areValuesEqual(currentValue, newValue, figmaType)) {
          return false; // Values differ, don't skip
        }
      }
    } else {
      // Single mode: check default mode value
      const modeNames = Object.keys(collectionInfo.modeIds);
      const targetMode = collectionInfo.modeIds['Default'] ? 'Default' : modeNames[0];
      const targetModeId = collectionInfo.modeIds[targetMode];

      const currentValue = variable.valuesByMode[targetModeId];
      const newValue = validateValueForVariableType(tokenValue, figmaType);

      // If it's an alias, don't skip
      if (isAliasMarker(newValue)) {
        return false;
      }

      // Compare values
      if (!areValuesEqual(currentValue, newValue, figmaType)) {
        return false; // Values differ, don't skip
      }
    }

    // Values are the same - now check scopes
    // We skip only if values match (scopes are considered "manually configured")
    return true;

  } catch (error) {
    console.error(`[shouldSkipVariableUpdate] Error checking variable ${variable.name}:`, error);
    return false; // On error, proceed with update
  }
}

/**
 * Compare two variable values for equality based on type.
 *
 * @param currentValue - Current value in Figma
 * @param newValue - New value from import
 * @param figmaType - Variable type
 * @returns true if values are equal
 */
function areValuesEqual(
  currentValue: any,
  newValue: any,
  figmaType: 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN'
): boolean {
  // Handle variable alias references
  if (typeof currentValue === 'object' && currentValue !== null && 'id' in currentValue) {
    // Current value is an alias reference - don't skip (we want to update)
    return false;
  }

  switch (figmaType) {
    case 'COLOR':
      if (!currentValue || !newValue) return false;
      // Compare RGB values with small tolerance for floating point
      const tolerance = 0.001;
      return Math.abs(currentValue.r - newValue.r) < tolerance &&
        Math.abs(currentValue.g - newValue.g) < tolerance &&
        Math.abs(currentValue.b - newValue.b) < tolerance &&
        (currentValue.a === undefined || newValue.a === undefined ||
          Math.abs((currentValue.a ?? 1) - (newValue.a ?? 1)) < tolerance);

    case 'FLOAT':
      // Compare numbers with small tolerance
      return Math.abs(currentValue - newValue) < 0.0001;

    case 'STRING':
      return String(currentValue) === String(newValue);

    case 'BOOLEAN':
      return Boolean(currentValue) === Boolean(newValue);

    default:
      return false;
  }
}

// ================== ALIAS RESOLUTION FUNCTIONS (STEP 2) ==================

/**
 * Find a variable by its reference path (e.g., "stroke.inverted" or "Collection.variable").
 * Handles both same-collection and cross-collection references.
 * @param path The reference path (e.g., "stroke.inverted" or "globals.spacing.xl")
 * @returns The variable found or null
 */
async function findVariableByPath(path: string): Promise<Variable | null> {
  // Convert dots to slashes (W3C convention -> Figma convention)
  const figmaPath = path.replace(/\./g, '/');

  // ========== STEP 1: TRY LOCAL VARIABLES FIRST ==========
  if (localVariablesCache === null) {
    // Load all variables once for efficiency
    localVariablesCache = await figma.variables.getLocalVariablesAsync();
  }

  // First try: search by direct name
  let targetVar = localVariablesCache.find(v => v.name === figmaPath);
  if (targetVar) {
    console.log(`[findVariableByPath] ✓ Found locally: ${figmaPath}`);
    return targetVar;
  }

  // Second try: handle cross-collection references {Collection.variable}
  const pathParts = figmaPath.split('/');
  if (pathParts.length > 1) {
    const collectionNameGuess = pathParts[0];
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    const targetCollection = collections.find(c => c.name === collectionNameGuess);

    if (targetCollection) {
      const variableOnlyPath = pathParts.slice(1).join('/');
      const crossCollectionVar = localVariablesCache.find(v =>
        v.variableCollectionId === targetCollection.id &&
        v.name === variableOnlyPath
      );
      if (crossCollectionVar) {
        console.log(`[findVariableByPath] ✓ Found locally (cross-collection): ${figmaPath}`);
        return crossCollectionVar;
      }
    }
  }

  // ========== STEP 2: TRY REMOTE LIBRARIES ==========
  console.log(`[findVariableByPath] Not found locally, searching in libraries: ${figmaPath}`);
  const remoteVar = await findRemoteVariableByName(figmaPath);

  if (remoteVar) {
    console.log(`[findVariableByPath] ✓ Found and imported from library: ${remoteVar.name}`);
    // Add to cache for future lookups to avoid re-importing
    localVariablesCache.push(remoteVar);
    return remoteVar;
  }

  // ========== NOT FOUND ANYWHERE ==========
  console.warn(`[findVariableByPath] ✗ Variable not found (local or remote): ${figmaPath}`);
  return null;
}

/**
 * Search for a variable in enabled Figma Team Libraries by name
 * If found, imports it as a linked variable
 * @param variableName - The variable name to search for (supports both . and / notation)
 * @returns The imported variable or null if not found
 */
async function findRemoteVariableByName(variableName: string): Promise<Variable | null> {
  try {
    console.log(`[findRemoteVariableByName] Searching for: ${variableName}`);

    // Get all enabled libraries
    const libraryCollections = await figma.teamLibrary.getAvailableLibraryVariableCollectionsAsync();

    if (!libraryCollections || libraryCollections.length === 0) {
      console.log(`[findRemoteVariableByName] No libraries enabled`);
      return null;
    }

    console.log(`[findRemoteVariableByName] Found ${libraryCollections.length} library collection(s):`,
      libraryCollections.map(l => `"${l.name}" (key: ${l.key})`));

    // Search each library for matching variable
    for (const libCollection of libraryCollections) {
      try {
        console.log(`[findRemoteVariableByName] Fetching variables from "${libCollection.name}"...`);
        const libraryVariables = await figma.teamLibrary.getVariablesInLibraryCollectionAsync(libCollection.key);
        console.log(`[findRemoteVariableByName] Got ${libraryVariables.length} variables from "${libCollection.name}"`);

        if (!libraryVariables || libraryVariables.length === 0) {
          continue;
        }

        // Try exact match first
        let matchingVar = libraryVariables.find(v => v.name === variableName);

        // Try with slash conversion (semantic.color.background -> semantic/color/background)
        if (!matchingVar) {
          const withSlashes = variableName.replace(/\./g, '/');
          matchingVar = libraryVariables.find(v => v.name === withSlashes);
        }

        // Try with dot conversion (semantic/color/background -> semantic.color.background)
        if (!matchingVar) {
          const withDots = variableName.replace(/\//g, '.');
          matchingVar = libraryVariables.find(v => v.name === withDots);
        }

        if (matchingVar) {
          console.log(`[findRemoteVariableByName] ✓ Found in library "${libCollection.name}": ${matchingVar.name}`);

          // Import the variable as linked (stays in sync with library)
          const importedVariable = await figma.variables.importVariableByKeyAsync(matchingVar.key);
          console.log(`[findRemoteVariableByName] ✓ Imported as linked variable: ${importedVariable.name}`);

          return importedVariable;
        }
      } catch (error) {
        console.error(`[findRemoteVariableByName] ERROR fetching from "${libCollection.name}":`, {
          collectionKey: libCollection.key,
          collectionName: libCollection.name,
          errorMessage: (error as Error).message,
          errorStack: (error as Error).stack,
          errorName: (error as Error).name,
          fullError: error
        });
        continue;
      }
    }

    console.log(`[findRemoteVariableByName] ✗ Not found in any library`);
    return null;
  } catch (error) {
    console.error('[findRemoteVariableByName] CRITICAL ERROR:', {
      message: (error as Error).message,
      stack: (error as Error).stack,
      name: (error as Error).name,
      fullError: error
    });
    return null;
  }
}

/**
 * STEP 2: Resolve all pending aliases.
 * Creates VariableAlias objects and assigns them using setValueForMode.
 * @returns Object with counts of resolved and failed aliases
 */
async function resolvePendingAliases(): Promise<{ resolved: number, failed: number }> {
  let resolvedCount = 0;
  let failedCount = 0;


  // Reset cache to get fresh data
  localVariablesCache = null;

  for (const pending of pendingAliases) {
    const { variable, modeId, referencePath, figmaType } = pending;

    // 1. Find the target variable by path
    const targetVariable = await findVariableByPath(referencePath);

    if (targetVariable) {
      // 2. Check type compatibility (important!)
      if (targetVariable.resolvedType !== figmaType) {
        console.warn(
          `[resolvePendingAliases] Type mismatch: ${variable.name} -> ${targetVariable.name}. ` +
          `Expected: ${figmaType}, Found: ${targetVariable.resolvedType}. Attempting resolution anyway...`
        );
      }

      // 3. Create VariableAlias object and assign
      try {
        const aliasObj = figma.variables.createVariableAlias(targetVariable);
        variable.setValueForMode(modeId, aliasObj);
        resolvedCount++;
      } catch (e) {
        console.error(`[resolvePendingAliases] ✗ Error creating/assigning alias for ${variable.name}:`, e);
        failedCount++;
      }
    } else {
      // Target variable not found
      console.warn(`[resolvePendingAliases] ✗ Target variable not found: {${referencePath}} for ${variable.name}`);
      failedCount++;
    }
  }

  return { resolved: resolvedCount, failed: failedCount };
}

// ================== END ALIAS RESOLUTION FUNCTIONS ==================

function convertTypeToFigma(tokenType: string): 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN' | null {
  switch (tokenType.toLowerCase()) {
    case 'color':
      return 'COLOR';

    // Number/dimension types
    case 'number':
    case 'dimension':
    case 'size':
    case 'spacing':
    case 'radius':           // Standard radius
    case 'border-radius':    // With hyphen
    case 'borderradius':     // Without hyphen ← MISSING TYPE FIXED!
    case 'corner-radius':    // Alternative naming
    case 'fontsize':         // Typography size ← MISSING TYPE FIXED!
    case 'font-size':        // With hyphen
    case 'lineheight':       // Typography line height ← MISSING TYPE FIXED!
    case 'line-height':      // With hyphen
    case 'fontweight':       // Typography weight ← MISSING TYPE FIXED!
    case 'font-weight':      // With hyphen
    case 'lineWidth':        // Line width (from diagram)
    case 'line-width':       // Line width with hyphen
    case 'strokeWidth':      // Stroke width
    case 'stroke-width':     // Stroke width with hyphen
      return 'FLOAT';

    // String types
    case 'string':
    case 'text':
    case 'typography':
    case 'fontfamily':       // Typography family ← MISSING TYPE FIXED!
    case 'font-family':      // With hyphen
      return 'STRING';

    case 'boolean':
      return 'BOOLEAN';
    default:
      console.warn(`[convertTypeToFigma] Unsupported token type: ${tokenType}`);
      return null;
  }
}


// Keep processSimpleValue for backward compatibility, but redirect to enhanced function
function processSimpleValue(value: any, figmaType: string): any {
  return validateValueForVariableType(value, figmaType);
}

function parseColor(colorValue: any): any {

  // Handle different color formats
  if (typeof colorValue !== 'string') {
    return colorValue;
  }

  // Handle hex
  if (colorValue.startsWith('#')) {
    const hex = colorValue.substring(1);

    // Convert 3-digit hex to 6-digit
    let fullHex = hex;
    if (hex.length === 3) {
      fullHex = '';
      for (let i = 0; i < hex.length; i++) {
        fullHex += hex[i] + hex[i];
      }
    }


    // Handle hex with alpha (8 digits)
    if (fullHex.length === 8) {
      const r = parseInt(fullHex.substring(0, 2), 16) / 255;
      const g = parseInt(fullHex.substring(2, 4), 16) / 255;
      const b = parseInt(fullHex.substring(4, 6), 16) / 255;
      const a = parseInt(fullHex.substring(6, 8), 16) / 255;

      return { r, g, b, a };
    }

    // Handle regular hex (6 digits)
    if (fullHex.length === 6) {
      const rHex = fullHex.substring(0, 2);
      const gHex = fullHex.substring(2, 4);
      const bHex = fullHex.substring(4, 6);

      const rInt = parseInt(rHex, 16);
      const gInt = parseInt(gHex, 16);
      const bInt = parseInt(bHex, 16);


      const r = rInt / 255;
      const g = gInt / 255;
      const b = bInt / 255;


      return { r, g, b };
    } else {
      console.error(`[parseColor] Invalid hex format: expected 6 or 8 characters, got ${fullHex.length}: ${fullHex}`);
      throw new Error(`Invalid hex color format: ${colorValue}. Expected format: #RRGGBB or #RRGGBBAA`);
    }
  }

  // Handle rgba
  const rgbaMatch = colorValue.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/);
  if (rgbaMatch) {
    const r = parseInt(rgbaMatch[1], 10) / 255;
    const g = parseInt(rgbaMatch[2], 10) / 255;
    const b = parseInt(rgbaMatch[3], 10) / 255;
    const a = rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1;

    return { r, g, b, a };
  }

  // Handle numeric values that might be corrupted color values
  if (typeof colorValue === 'string' && !isNaN(Number(colorValue))) {
    console.warn(`[parseColor] Received numeric string that might be corrupted color: "${colorValue}"`);
    console.warn(`[parseColor] This might indicate a hex parsing issue upstream`);
  }

  // Unrecognized format - throw error instead of returning invalid value
  console.error(`[parseColor] Unrecognized color format: ${colorValue}. Expected hex (#RGB, #RRGGBB, #RRGGBBAA) or rgba(r,g,b,a)`);
  throw new Error(`Invalid color format: ${colorValue}. Expected hex or rgba() format`);
}


// Extract modes from JSON data
function extractModes(data: any): string[] {
  const modes = new Set<string>();
  let hasMultiModeValues = false;

  function findModes(obj: any): void {
    if (!obj || typeof obj !== 'object') return;

    if (obj.$value && typeof obj.$value === 'object' && !obj.$value.r && !obj.$value.g && !obj.$value.b) {
      // This is a multi-mode value (not an RGB color object)
      hasMultiModeValues = true;
      for (const modeName in obj.$value) {
        modes.add(modeName);
      }
    }

    // Check nested objects
    for (const key in obj) {
      if (key !== '$value' && typeof obj[key] === 'object') {
        findModes(obj[key]);
      }
    }
  }

  // Start recursive search
  for (const key in data) {
    findModes(data[key]);
  }

  // Only add "Default" if no multi-mode values were found
  if (!hasMultiModeValues && modes.size === 0) {
    modes.add("Default");
  }

  const result = Array.from(modes).slice(0, LIMITS.MAX_MODES_PER_COLLECTION); // Limit to MAX_MODES_PER_COLLECTION modes (Figma limitation)
  return result;
}

// Validate and convert value to match expected variable type
function validateValueForVariableType(value: any, expectedType: string): any | AliasMarker {

  // 🔍 CHECK FOR ALIAS REFERENCE FIRST (before any type-specific processing)
  if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
    const referencePath = value.replace(/[{}]/g, '').trim().replace(/\./g, '/'); // Convert dots to slashes
    if (referencePath.length > 0) {
      return {
        __isAlias: true,
        referencePath: referencePath
      } as AliasMarker;
    }
  }

  // 🎯 PROCESS CONCRETE VALUES
  switch (expectedType) {
    case 'FLOAT':
      if (typeof value === 'number') {
        return value;
      }

      // Parse string values like "8px", "1.5rem"
      if (typeof value === 'string') {
        const numericValue = parseFloat(value.replace(/px|pt|rem|em|%/, ''));
        if (!isNaN(numericValue)) {
          return numericValue;
        }
      }

      return parseFloat(String(value)) || 0;

    case 'COLOR':
      // Parse color using parseColor function
      try {
        const colorValue = parseColor(value);
        return colorValue;
      } catch (error) {
        console.error(`[validateValueForVariableType] COLOR parsing failed for value:`, value, error);
        throw error; // Re-throw to be handled by caller
      }

    case 'STRING':
      if (typeof value === 'string') {
        return value;
      }
      // Handle composite tokens (typography, shadow) by converting objects to readable JSON
      if (typeof value === 'object' && value !== null) {
        try {
          // Convert complex objects (composite tokens) to formatted JSON strings
          const stringValue = JSON.stringify(value, null, 2);
          return stringValue;
        } catch (e) {
          // Fallback if JSON.stringify fails
          console.warn(`[validateValueForVariableType] STRING: JSON stringify failed, using fallback:`, e);
          return "[object Object]";
        }
      }
      // Convert other types to string
      const stringValue = String(value);
      return stringValue;

    case 'BOOLEAN':
      if (typeof value === 'boolean') {
        return value;
      }

      // Handle string representations of booleans
      if (typeof value === 'string') {
        const lowerValue = value.toLowerCase();
        if (lowerValue === 'true') return true;
        if (lowerValue === 'false') return false;
      }

      // Default boolean conversion
      const boolValue = Boolean(value);
      return boolValue;

    default:
      return value;
  }
}

// Token Studio format detection and conversion
function detectTokenStudioFormat(data: any): boolean {
  if (!data || typeof data !== 'object') return false;

  // Check for Token Studio indicators
  const hasTokenSets = Object.keys(data).some(key =>
    key !== '$themes' &&
    key !== '$metadata' &&
    typeof data[key] === 'object'
  );

  // Look for Token Studio structure: tokens with 'value' and 'type' (not $value/$type)
  if (hasTokenSets) {
    for (const setName of Object.keys(data)) {
      if (setName === '$themes' || setName === '$metadata') continue;

      const tokenSet = data[setName];
      if (typeof tokenSet === 'object') {
        // Check if any tokens use 'value' and 'type' instead of '$value' and '$type'
        const hasTokenStudioTokens = Object.values(tokenSet).some((token: any) =>
          token &&
          typeof token === 'object' &&
          token.hasOwnProperty('value') &&
          token.hasOwnProperty('type') &&
          !token.hasOwnProperty('$value') &&
          !token.hasOwnProperty('$type')
        );

        if (hasTokenStudioTokens) {
          return true;
        }
      }
    }
  }

  return false;
}

function convertTokenStudioFormat(data: any): any {

  const converted: any = {};
  const metadata = data.$metadata || {};
  const themes = data.$themes || [];

  // Get token set order from metadata, fallback to object keys
  const tokenSetOrder = metadata.tokenSetOrder ||
    Object.keys(data).filter(key => key !== '$themes' && key !== '$metadata');


  // Process each token set
  for (const setName of tokenSetOrder) {
    if (!data[setName] || typeof data[setName] !== 'object') continue;

    converted[setName] = {};

    // Convert tokens in this set
    convertTokenSetRecursive(data[setName], converted[setName]);
  }

  return converted;
}

// Recursively convert token set structure
function convertTokenSetRecursive(source: any, target: any): void {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      // Check if this is a token (has 'value' and 'type' properties)
      if ((value as any).hasOwnProperty('value') && (value as any).hasOwnProperty('type')) {
        // Convert Token Studio token to plugin format
        target[key] = {
          $value: (value as any).value,
          $type: convertTokenStudioType((value as any).type)
        };

        // Copy description if present
        if ((value as any).description) {
          target[key].$description = (value as any).description;
        }

      } else {
        // This is a nested group, recurse
        target[key] = {};
        convertTokenSetRecursive(value, target[key]);
      }
    }
  }
}

// Convert Token Studio token types to plugin types
function convertTokenStudioType(tokenStudioType: string): string {
  if (!tokenStudioType) return 'color'; // Default fallback

  const typeMap: { [key: string]: string } = {
    'color': 'color',
    'spacing': 'number', // Token Studio spacing maps to number
    'dimension': 'number', // dimensions are numbers in Figma
    'size': 'number',
    'borderRadius': 'number',
    'borderWidth': 'number',
    'fontWeight': 'string', // Font weights stored as strings
    'fontFamily': 'string',
    'fontSize': 'number',
    'lineHeight': 'number',
    'letterSpacing': 'number',
    'typography': 'string', // Complex typography stored as JSON string
    'boxShadow': 'string',
    'text': 'string',
    'opacity': 'number',
    'other': 'string'
  };

  const convertedType = typeMap[tokenStudioType.toLowerCase()] || 'string';
  return convertedType;
}

// Handler functions
async function handleUIReady(): Promise<void> {
  try {
    const collections = await figma.variables.getLocalVariableCollectionsAsync();

    // 🆕 Export W3C JSON for Token Tree View
    let w3cJson: string = '{}';
    let modesArray: Array<{ id: string; name: string }> = [];

    // Extract all unique modes from all collections FIRST
    const allModes = new Map<string, { id: string; name: string }>();
    for (const collection of collections) {
      for (const mode of collection.modes) {
        if (!allModes.has(mode.modeId)) {
          allModes.set(mode.modeId, { id: mode.modeId, name: mode.name });
        }
      }
    }
    modesArray = Array.from(allModes.values());

    // Only export if we have collections with variables
    if (collections.length > 0 && collections.some(c => c.variableIds.length > 0)) {
      try {
        // Export all collections as W3C format
        const exportOptions = {
          collectionIds: collections.map(c => c.id), // All collections
          includeModes: true, // Include all modes
          format: 'w3c' as const,
          exportType: 'combined' as const
        };

        const exportResult = await jsonExporter.exportToJSON(exportOptions);

        if (exportResult.success && exportResult.json) {
          w3cJson = exportResult.json;
        } else {
          console.warn('[handleUIReady] Export failed:', exportResult.message);
        }
      } catch (exportError) {
        console.error('[handleUIReady] Failed to export W3C JSON:', exportError);
        // Continue with empty JSON if export fails
      }
    } else {
    }

    const response: PluginResponse = {
      type: MESSAGE_TYPES.INIT_DATA,
      success: true,
      data: {
        collections: collections.map(collection => ({
          id: collection.id,
          name: collection.name,
          modes: collection.modes.map(mode => mode.name),
          variableIds: collection.variableIds
        })),
        // 🆕 Add W3C JSON and modes for Token Tree
        w3cJson: w3cJson,
        modes: modesArray
      }
    };
    figma.ui.postMessage(response);
  } catch (error) {
    await errorHandler.handleError(error as Error, 'figma_api', { operation: 'handleUIReady' });
  }
}

async function handleGetCollections(): Promise<void> {
  try {
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    figma.ui.postMessage({
      type: MESSAGE_TYPES.COLLECTIONS_DATA,
      collections: collections.map(collection => ({
        id: collection.id,
        name: collection.name,
        modes: collection.modes.map(mode => mode.name),
        variableIds: collection.variableIds
      }))
    });
  } catch (error) {
    await errorHandler.handleError(error as Error, 'figma_api', { operation: 'handleGetCollections' });
  }
}

async function handlePreviewImport(msg: any): Promise<void> {
  try {
    const { json, options } = msg;

    if (!json || !json.trim()) {
      throw new Error('No JSON data provided');
    }

    let jsonData: any;
    try {
      jsonData = JSON.parse(json);
    } catch (error) {
      throw new Error('Invalid JSON format');
    }

    // Generate preview
    const importPreview = new ImportPreview();
    const previewResult = await importPreview.generatePreview(jsonData, options || {
      includeUnchanged: false,
      checkConflicts: true,
      validateTypes: true
    });

    figma.ui.postMessage({
      type: MESSAGE_TYPES.PREVIEW_RESULT,
      ...previewResult
    });

  } catch (error) {
    await errorHandler.handleError(error as Error, 'preview_import');
    figma.ui.postMessage({
      type: MESSAGE_TYPES.PREVIEW_RESULT,
      success: false,
      items: [],
      stats: { total: 0, new: 0, overwrite: 0, conflict: 0, invalid: 0, unchanged: 0 },
      errors: [(error as Error).message]
    });
  }
}

async function handleImportJson(msg: any): Promise<void> {
  try {
    const { json, preserveScopes } = msg;

    if (!json || !json.trim()) {
      throw new Error('No JSON data provided');
    }

    let jsonData: any;
    try {
      jsonData = JSON.parse(json);
    } catch (error) {
      throw new Error('Invalid JSON format');
    }

    // Use simple import system with preserveScopes option
    const importResult = await simpleImportVariables(jsonData, preserveScopes || false);

    figma.ui.postMessage({
      type: MESSAGE_TYPES.IMPORT_RESULT,
      success: importResult.success,
      message: importResult.message,
      data: {
        variableCount: importResult.variableCount,
        collectionCount: importResult.collectionCount,
        aliasCount: 0
      }
    });

  } catch (error) {
    await errorHandler.handleError(error as Error, 'import_json');
    figma.ui.postMessage({
      type: MESSAGE_TYPES.IMPORT_RESULT,
      success: false,
      message: (error as Error).message
    });
  }
}

async function handleExportJson(msg: any): Promise<void> {
  try {
    const { options } = msg;

    // Default options if none provided
    const exportOptions: JSONExportOptions = {
      collections: options?.collections || [],
      modes: options?.modes || [],
      types: options?.types || [],
      exportType: options?.exportType || 'combined',
      format: options?.format || 'w3c',
      includeModes: options?.includeModes || false,
      jsonOptions: {
        includeMetadata: options?.jsonOptions?.includeMetadata === true,
        includeAliases: options?.jsonOptions?.includeAliases !== false,
        useW3CKeys: options?.jsonOptions?.useW3CKeys !== false,
        prettify: options?.jsonOptions?.prettify !== false
      }
    };

    const result = await jsonExporter.exportToJSON(exportOptions);

    if (result.success) {
      figma.ui.postMessage({
        type: MESSAGE_TYPES.JSON_ADVANCED_RESULT,
        success: true,
        message: result.message,
        json: result.json,
        files: result.files
      });
    } else {
      figma.ui.postMessage({
        type: MESSAGE_TYPES.JSON_ADVANCED_RESULT,
        success: false,
        message: result.message
      });
    }

  } catch (error) {
    await errorHandler.handleError(error as Error, 'export_json_advanced');
    figma.ui.postMessage({
      type: MESSAGE_TYPES.JSON_ADVANCED_RESULT,
      success: false,
      message: (error as Error).message
    });
  }
}

async function handleExportJsonAdvanced(msg: any): Promise<void> {
  try {
    const { options } = msg;

    // Default options if none provided
    const exportOptions: JSONExportOptions = {
      collections: options?.collections || [],
      modes: options?.modes || [],
      types: options?.types || [],
      exportType: options?.exportType || 'combined',
      format: options?.format || 'w3c',
      includeModes: options?.includeModes || false,
      jsonOptions: {
        includeMetadata: options?.jsonOptions?.includeMetadata === true,
        includeAliases: options?.jsonOptions?.includeAliases !== false,
        useW3CKeys: options?.jsonOptions?.useW3CKeys !== false,
        prettify: options?.jsonOptions?.prettify !== false
      }
    };

    const result = await jsonExporter.exportToJSON(exportOptions);

    if (result.success) {
      const messageType = MESSAGE_TYPES.JSON_ADVANCED_RESULT;

      figma.ui.postMessage({
        type: messageType,
        success: true,
        message: result.message,
        json: result.json,
        files: result.files
      });
    } else {
      figma.ui.postMessage({
        type: MESSAGE_TYPES.JSON_ADVANCED_RESULT,
        success: false,
        message: result.message
      });
    }

  } catch (error) {
    await errorHandler.handleError(error as Error, 'export_json');
    figma.ui.postMessage({
      type: MESSAGE_TYPES.JSON_ADVANCED_RESULT,
      success: false,
      message: (error as Error).message
    });
  }
}

async function handleExportCss(msg: any): Promise<void> {
  try {
    const { options } = msg;

    // Default options if none provided
    const exportOptions: CSSExportOptions = {
      collections: options?.collections || [],
      modes: options?.modes || [],
      types: options?.types || [],
      exportType: options?.exportType || 'single',
      format: options?.format || 'css',
      cssOptions: {
        // Selectors
        naming: options?.cssOptions?.naming || 'kebab',
        baseSelector: options?.cssOptions?.baseSelector || ':root',
        themeSelector: options?.cssOptions?.themeSelector || '.theme-{theme}',
        includeComments: options?.cssOptions?.includeComments !== false,

        // Token Names
        tokenNameStyle: options?.cssOptions?.tokenNameStyle || 'kebab',
        tokenNameStructure: options?.cssOptions?.tokenNameStructure || 'path-name',
        globalPrefix: options?.cssOptions?.globalPrefix || '',
        customizeTypePrefixes: options?.cssOptions?.customizeTypePrefixes || false,
        typePrefixes: options?.cssOptions?.typePrefixes || {},

        // Token Values
        colorFormat: options?.cssOptions?.colorFormat || 'hex',
        forceRemUnits: options?.cssOptions?.forceRemUnits || false,
        useTokenReferences: options?.cssOptions?.useTokenReferences !== false,
        colorPrecision: options?.cssOptions?.colorPrecision || 3,
        useFallbackValues: options?.cssOptions?.useFallbackValues || false,

        // Other
        showTokenDescriptions: options?.cssOptions?.showTokenDescriptions !== false,
        showFileDisclaimer: options?.cssOptions?.showFileDisclaimer !== false,
        disclaimerMessage: options?.cssOptions?.disclaimerMessage || 'This file was generated automatically',
        indentation: options?.cssOptions?.indentation || 2
      }
    };

    const result = await cssExporter.exportToCSS(exportOptions);

    if (result.success) {
      const messageType = msg.type === MESSAGE_TYPES.EXPORT_CSS_ADVANCED ?
        MESSAGE_TYPES.CSS_ADVANCED_RESULT : MESSAGE_TYPES.CSS_RESULT;

      figma.ui.postMessage({
        type: messageType,
        success: true,
        message: result.message,
        css: result.css,
        files: result.files
      });
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    await errorHandler.handleError(error as Error, 'export_css');

    const messageType = msg.type === MESSAGE_TYPES.EXPORT_CSS_ADVANCED ?
      MESSAGE_TYPES.CSS_ADVANCED_RESULT : MESSAGE_TYPES.CSS_RESULT;

    figma.ui.postMessage({
      type: messageType,
      success: false,
      message: `CSS export failed: ${(error as Error).message}`
    });
  }
}

async function handleExportTextStyles(msg: any): Promise<void> {
  console.log('[handleExportTextStyles] 🚀 STARTING EXPORT', msg);
  try {
    const { format = 'json', preserveAliases = false, selectedProperties = [] } = msg;

    // Build variable map if preserveAliases is true
    let variableMap: Map<string, Variable> | undefined;
    if (preserveAliases) {
      variableMap = new Map();

      const collections = await figma.variables.getLocalVariableCollectionsAsync();

      for (const collection of collections) {
        const variables = collection.variableIds.map(id => figma.variables.getVariableByIdAsync(id));
        const resolvedVariables = await Promise.all(variables);

        resolvedVariables.forEach(variable => {
          if (variable) {
            variableMap!.set(variable.id, variable);
          }
        });
      }


      // DIAGNOSTIC: Log sample variable IDs and names
      if (variableMap.size > 0) {
        const sampleKeys = Array.from(variableMap.keys()).slice(0, 5);

        sampleKeys.forEach(key => {
          const variable = variableMap!.get(key);
        });
      } else {
        console.warn('[Text Styles] ⚠️ Variable map is EMPTY!');
      }
    }

    // Extract text styles using the new async API
    const result = await textStyleExtractor.extractTextStyles({
      includeDescription: true,
      includeErrorDetails: true,
      skipFontLoading: false,
      batchSize: 10,
      preserveAliases: preserveAliases,
      variableMap: variableMap,
      selectedBrand: msg.selectedBrand // 🆕 Pass selected brand option
    });

    if (!result.success) {
      throw new Error(result.message);
    }


    // Debug: Log all available properties from first style
    if (result.styles.length > 0) {
      const firstStyle: any = result.styles[0];

    }

    // Filter properties based on user selection
    let filteredStyles = result.styles;
    if (selectedProperties && selectedProperties.length > 0) {

      filteredStyles = result.styles.map((style, index) => {
        const filtered: any = {};

        // Add ONLY selected properties (full control)
        selectedProperties.forEach((prop: string) => {
          if (prop in style) {
            filtered[prop] = style[prop as keyof typeof style];
            if (index === 0) {
            }
          } else if (index === 0) {
          }
        });

        // 🆕 SEMPRE preserva $extensions se presente (W3C Design Tokens metadata)
        if (style.$extensions) {
          filtered.$extensions = style.$extensions;
        }

        // Always include error if present
        if (style.error) {
          filtered.error = style.error;
        }

        return filtered;
      });

    }

    // Format the extracted styles
    const formattedResult = textStyleExtractor.formatTextStyles(filteredStyles, format);

    figma.ui.postMessage({
      type: MESSAGE_TYPES.TEXT_STYLES_RESULT,
      success: true,
      message: `Successfully exported ${result.totalProcessed} text styles (${result.successCount} successful, ${result.errorCount} errors)`,
      data: formattedResult.data,
      filename: formattedResult.filename,
      format: format,
      stats: {
        totalProcessed: result.totalProcessed,
        successCount: result.successCount,
        errorCount: result.errorCount,
        errors: result.errors,
        selectedProperties: selectedProperties.length
      }
    });


  } catch (error) {
    await errorHandler.handleError(error as Error, 'export_text_styles');
    figma.ui.postMessage({
      type: MESSAGE_TYPES.TEXT_STYLES_RESULT,
      success: false,
      message: `Text styles export failed: ${(error as Error).message}`
    });
  }
}

function handleResize(width: number, height: number): void {
  const constrainedWidth = Math.max(UI_CONFIG.MIN_WIDTH, Math.min(width, 2000));
  const constrainedHeight = Math.max(UI_CONFIG.MIN_HEIGHT, Math.min(height, 1500));
  figma.ui.resize(constrainedWidth, constrainedHeight);
}

// Collection Management Functions
async function handleRenameCollection(msg: any): Promise<void> {
  try {
    const { collectionId, newName } = msg;

    // Find the collection
    const collection = await figma.variables.getVariableCollectionByIdAsync(collectionId);
    if (!collection) {
      throw new Error('Collection not found');
    }

    // Rename the collection
    collection.name = newName;

    figma.ui.postMessage({
      type: MESSAGE_TYPES.COLLECTION_MANAGEMENT_RESULT,
      success: true,
      action: 'rename',
      message: `Collection renamed to "${newName}"`
    });

    figma.notify(`✅ Collection renamed to "${newName}"`, { timeout: 2000 });

  } catch (error) {
    console.error('Error renaming collection:', error);
    figma.ui.postMessage({
      type: MESSAGE_TYPES.COLLECTION_MANAGEMENT_RESULT,
      success: false,
      action: 'rename',
      message: (error as Error).message
    });
    figma.notify(`❌ Failed to rename collection: ${(error as Error).message}`, { error: true });
  }
}

async function handleDeleteCollection(msg: any): Promise<void> {
  try {
    const { collectionId } = msg;

    // Find the collection
    const collection = await figma.variables.getVariableCollectionByIdAsync(collectionId);
    if (!collection) {
      throw new Error('Collection not found');
    }

    const collectionName = collection.name;
    const variableCount = collection.variableIds.length;

    // Delete all variables in the collection first
    for (const variableId of collection.variableIds) {
      try {
        const variable = await figma.variables.getVariableByIdAsync(variableId);
        if (variable) {
          variable.remove();
        }
      } catch (varError) {
        console.warn(`Failed to remove variable ${variableId}:`, varError);
      }
    }

    // Remove the collection
    collection.remove();

    figma.ui.postMessage({
      type: MESSAGE_TYPES.COLLECTION_MANAGEMENT_RESULT,
      success: true,
      action: 'delete',
      message: `Collection "${collectionName}" and ${variableCount} variables deleted`
    });

    figma.notify(`✅ Collection "${collectionName}" deleted (${variableCount} variables removed)`, { timeout: 3000 });

  } catch (error) {
    console.error('Error deleting collection:', error);
    figma.ui.postMessage({
      type: MESSAGE_TYPES.COLLECTION_MANAGEMENT_RESULT,
      success: false,
      action: 'delete',
      message: (error as Error).message
    });
    figma.notify(`❌ Failed to delete collection: ${(error as Error).message}`, { error: true });
  }
}

async function handleClearAllCollections(): Promise<void> {
  try {
    // Get all collections
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    let totalVariables = 0;
    let totalCollections = collections.length;

    // Delete all variables first
    for (const collection of collections) {
      totalVariables += collection.variableIds.length;

      for (const variableId of collection.variableIds) {
        try {
          const variable = await figma.variables.getVariableByIdAsync(variableId);
          if (variable) {
            variable.remove();
          }
        } catch (varError) {
          console.warn(`Failed to remove variable ${variableId}:`, varError);
        }
      }
    }

    // Then delete all collections
    for (const collection of collections) {
      try {
        collection.remove();
      } catch (collError) {
        console.warn(`Failed to remove collection ${collection.name}:`, collError);
      }
    }

    figma.ui.postMessage({
      type: MESSAGE_TYPES.COLLECTION_MANAGEMENT_RESULT,
      success: true,
      action: 'clear-all',
      message: `Cleared ${totalCollections} collections and ${totalVariables} variables`
    });

    figma.notify(`✅ Cleared all collections (${totalCollections} collections, ${totalVariables} variables removed)`, { timeout: 3000 });

  } catch (error) {
    console.error('Error clearing all collections:', error);
    figma.ui.postMessage({
      type: MESSAGE_TYPES.COLLECTION_MANAGEMENT_RESULT,
      success: false,
      action: 'clear-all',
      message: (error as Error).message
    });
    figma.notify(`❌ Failed to clear collections: ${(error as Error).message}`, { error: true });
  }
}

// ================== LIBRARY SUPPORT HANDLERS ==================

/**
 * Handle browse library request - discover available library collections
 */
async function handleBrowseLibrary(): Promise<void> {
  try {
    // Access Team Library API
    const libraryCollections = await figma.teamLibrary.getAvailableLibraryVariableCollectionsAsync();

    if (!libraryCollections || libraryCollections.length === 0) {
      figma.ui.postMessage({
        type: MESSAGE_TYPES.LIBRARY_COLLECTIONS_DATA,
        success: true,
        libraries: [],
        message: 'No libraries enabled. Enable libraries in Figma UI first.'
      });
      figma.notify('ℹ️ No libraries enabled. Enable libraries in Figma UI.', { timeout: 3000 });
      return;
    }

    // Map to metadata format
    const libraries = libraryCollections.map(col => ({
      name: col.name,
      key: col.key,
      libraryName: col.libraryName || 'Unknown Library'
    }));

    figma.ui.postMessage({
      type: MESSAGE_TYPES.LIBRARY_COLLECTIONS_DATA,
      success: true,
      libraries,
      message: `Found ${libraries.length} library collection(s)`
    });

    figma.notify(`✅ Found ${libraries.length} library collection(s)`, { timeout: 2000 });

  } catch (error) {
    console.error('Error browsing libraries:', error);
    figma.ui.postMessage({
      type: MESSAGE_TYPES.LIBRARY_COLLECTIONS_DATA,
      success: false,
      libraries: [],
      error: (error as Error).message
    });
    figma.notify(`❌ Failed to browse libraries: ${(error as Error).message}`, { error: true });
  }
}

/**
 * Handle get library variables request - get variables from a specific library collection
 */
async function handleGetLibraryVariables(msg: any): Promise<void> {
  try {
    const { collectionKey } = msg;

    if (!collectionKey) {
      throw new Error('Missing collection key');
    }

    const libraryVariables = await figma.teamLibrary.getVariablesInLibraryCollectionAsync(collectionKey);

    if (!libraryVariables || libraryVariables.length === 0) {
      figma.ui.postMessage({
        type: MESSAGE_TYPES.LIBRARY_VARIABLES_DATA,
        success: true,
        variables: [],
        message: 'No variables found in this library collection'
      });
      return;
    }

    // Map to metadata format
    const variables = libraryVariables.map(libVar => ({
      id: libVar.key,
      key: libVar.key,
      name: libVar.name,
      resolvedType: libVar.resolvedType,
      isRemote: true
    }));

    figma.ui.postMessage({
      type: MESSAGE_TYPES.LIBRARY_VARIABLES_DATA,
      success: true,
      variables,
      collectionKey
    });

    figma.notify(`✅ Found ${variables.length} variables`, { timeout: 2000 });

  } catch (error) {
    console.error('Error getting library variables:', error);
    figma.ui.postMessage({
      type: MESSAGE_TYPES.LIBRARY_VARIABLES_DATA,
      success: false,
      variables: [],
      error: (error as Error).message
    });
    figma.notify(`❌ Failed to get library variables: ${(error as Error).message}`, { error: true });
  }
}

/**
 * Handle import from library request - import variables from external library
 */
async function handleImportFromLibrary(msg: any): Promise<void> {
  try {
    const { variableKeys } = msg;

    if (!variableKeys || !Array.isArray(variableKeys) || variableKeys.length === 0) {
      throw new Error('No variable keys provided');
    }

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    figma.ui.postMessage({
      type: MESSAGE_TYPES.PROGRESS_UPDATE,
      message: `Importing ${variableKeys.length} variable(s) from library...`
    });

    for (const variableKey of variableKeys) {
      try {
        // Import variable using Figma API
        // This creates a "linked variable" that stays in sync with library
        const importedVariable = await figma.variables.importVariableByKeyAsync(variableKey);

        results.push({
          success: true,
          variableKey,
          variableName: importedVariable.name,
          variableId: importedVariable.id
        });
        successCount++;

        // Small delay to avoid rate limiting
        if (variableKeys.length > 10) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      } catch (error) {
        const err = error as Error;
        results.push({
          success: false,
          variableKey,
          error: err.message
        });
        errorCount++;
      }
    }

    figma.ui.postMessage({
      type: MESSAGE_TYPES.LIBRARY_IMPORT_RESULT,
      success: successCount > 0,
      results,
      successCount,
      errorCount,
      totalCount: variableKeys.length,
      message: `Imported ${successCount} of ${variableKeys.length} variable(s)`
    });

    if (successCount > 0) {
      figma.notify(`✅ Imported ${successCount} variable(s) from library`, { timeout: 3000 });
    }
    if (errorCount > 0) {
      figma.notify(`⚠️ ${errorCount} variable(s) failed to import`, { error: true });
    }

  } catch (error) {
    console.error('Error importing from library:', error);
    figma.ui.postMessage({
      type: MESSAGE_TYPES.LIBRARY_IMPORT_RESULT,
      success: false,
      error: (error as Error).message
    });
    figma.notify(`❌ Failed to import from library: ${(error as Error).message}`, { error: true });
  }
}

// ================== GITHUB INTEGRATION HANDLERS ==================

/**
 * Save GitHub configuration to client storage
 */
async function handleGitHubConfigSave(msg: any): Promise<void> {
  try {
    const config = {
      token: msg.token || '',
      repository: msg.repository || '',
      branch: msg.branch || 'main',
      path: msg.path || 'tokens/'
    };

    await figma.clientStorage.setAsync('github-config', config);

    figma.ui.postMessage({
      type: 'github-config-saved',
      success: true
    });

    console.log('[GitHub] Config saved successfully');
  } catch (error) {
    console.error('[GitHub] Error saving config:', error);
    figma.ui.postMessage({
      type: 'github-config-saved',
      success: false,
      error: (error as Error).message
    });
  }
}

/**
 * Load GitHub configuration from client storage
 */
async function handleGitHubConfigLoad(): Promise<void> {
  try {
    const config = await figma.clientStorage.getAsync('github-config');

    figma.ui.postMessage({
      type: 'github-config-loaded',
      config: config || null
    });

    console.log('[GitHub] Config loaded:', config ? 'found' : 'not found');
  } catch (error) {
    console.error('[GitHub] Error loading config:', error);
    figma.ui.postMessage({
      type: 'github-config-loaded',
      config: null,
      error: (error as Error).message
    });
  }
}

/**
 * Test GitHub connection by verifying repository access
 */
async function handleGitHubTestConnection(msg: any): Promise<void> {
  try {
    const { token, repository } = msg;

    if (!token || !repository) {
      throw new Error('Token and repository are required');
    }

    const [owner, repo] = repository.split('/');
    if (!owner || !repo) {
      throw new Error('Repository must be in format "owner/repo"');
    }

    // Note: Figma plugins can't make direct HTTP requests
    // We need to use the UI to make the fetch request
    figma.ui.postMessage({
      type: 'github-test-connection-request',
      token,
      repository,
      owner,
      repo
    });

  } catch (error) {
    console.error('[GitHub] Test connection error:', error);
    figma.ui.postMessage({
      type: 'github-test-result',
      success: false,
      message: (error as Error).message
    });
  }
}

/**
 * Push content to GitHub repository
 */
async function handleGitHubPush(msg: any): Promise<void> {
  try {
    const { content, filename, config } = msg;

    if (!content || !filename) {
      throw new Error('Content and filename are required');
    }

    // Load saved config if not provided
    let githubConfig = config;
    if (!githubConfig) {
      githubConfig = await figma.clientStorage.getAsync('github-config');
    }

    if (!githubConfig || !githubConfig.token || !githubConfig.repository) {
      throw new Error('GitHub configuration not found. Please configure GitHub settings first.');
    }

    // Send to UI to make the actual HTTP request (Figma plugin limitation)
    figma.ui.postMessage({
      type: 'github-push-request',
      content,
      filename,
      config: githubConfig
    });

  } catch (error) {
    console.error('[GitHub] Push error:', error);
    figma.ui.postMessage({
      type: 'github-push-result',
      success: false,
      error: (error as Error).message
    });
    figma.notify(`❌ GitHub push failed: ${(error as Error).message}`, { error: true });
  }
}

// Initialize the plugin
initializePlugin();