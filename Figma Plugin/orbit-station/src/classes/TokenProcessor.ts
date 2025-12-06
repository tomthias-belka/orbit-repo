// Token Processing Class
import {
  DEFAULT_COLLECTION_NAME,
  DEFAULT_MODE_NAME,
  TOKEN_STUDIO_TO_W3C_TYPE,
  FIGMA_TO_TOKEN_TYPE,
  LIMITS,
  ERROR_CODES,
  PROGRESS_MESSAGES
} from '../constants/index.js';
import type {
  TokenData,
  ProcessedToken,
  TokenCollection,
  ImportOptions,
  ProcessingResult
} from '../types/tokens.js';
import { ProductionErrorHandler } from './ProductionErrorHandler.js';

export class TokenProcessor {
  private errorHandler: ProductionErrorHandler;
  private processedTokens: Map<string, ProcessedToken> = new Map();
  private aliasMap: Map<string, string> = new Map();

  constructor() {
    this.errorHandler = new ProductionErrorHandler();
  }

  /**
   * Process JSON tokens for import into Figma
   */
  async processTokensForImport(jsonData: any, options: ImportOptions = {}): Promise<ProcessingResult> {
    try {
      // Update progress
      figma.ui.postMessage({
        type: 'progress-update',
        message: PROGRESS_MESSAGES.ANALYZING
      });

      // Detect format and normalize
      const normalized = await this.normalizeTokenFormat(jsonData);

      // Process tokens
      figma.ui.postMessage({
        type: 'progress-update',
        message: PROGRESS_MESSAGES.PROCESSING
      });

      const processed = await this.processTokensRecursive(normalized);

      // Resolve aliases
      figma.ui.postMessage({
        type: 'progress-update',
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

  /**
   * Detect and normalize token format (Token Studio vs W3C)
   */
  private async normalizeTokenFormat(data: any): Promise<any> {
    // Check if this is Token Studio format
    if (this.isTokenStudioFormat(data)) {
      return this.convertTokenStudioToW3C(data);
    }

    // Assume W3C format
    return data;
  }

  /**
   * Check if data is in Token Studio format
   */
  private isTokenStudioFormat(data: any): boolean {
    if (!data || typeof data !== 'object') return false;

    // Check for Token Studio markers
    const hasTokenStudioMarkers = '$themes' in data || '$metadata' in data;

    // Check for Token Studio token structure (type/value vs $type/$value)
    const hasTokenStudioStructure = this.checkForTokenStudioStructure(data);

    return hasTokenStudioMarkers || hasTokenStudioStructure;
  }

  /**
   * Check for Token Studio token structure recursively
   */
  private checkForTokenStudioStructure(obj: any, depth = 0): boolean {
    if (depth > 3) return false; // Prevent deep recursion

    if (obj && typeof obj === 'object') {
      // Check if this looks like a Token Studio token
      if ('type' in obj && 'value' in obj && !('$type' in obj)) {
        return true;
      }

      // Check nested objects
      for (const value of Object.values(obj)) {
        if (this.checkForTokenStudioStructure(value, depth + 1)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Convert Token Studio format to W3C format
   */
  private convertTokenStudioToW3C(data: any): any {
    const converted: any = {};

    // Process each token set
    for (const [key, value] of Object.entries(data)) {
      // Skip metadata
      if (key.startsWith('$')) continue;

      converted[key] = this.convertTokenStudioGroup(value);
    }

    return converted;
  }

  /**
   * Convert Token Studio group/token structure
   */
  private convertTokenStudioGroup(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;

    // If this is a token (has type and value)
    if ('type' in obj && 'value' in obj) {
      const tokenType = TOKEN_STUDIO_TO_W3C_TYPE[obj.type as keyof typeof TOKEN_STUDIO_TO_W3C_TYPE] || 'string';
      return {
        $type: tokenType,
        $value: obj.value,
        ...(obj.description && { $description: obj.description })
      };
    }

    // Otherwise, process as group
    const converted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = this.convertTokenStudioGroup(value);
    }

    return converted;
  }

  /**
   * Process tokens recursively and build token tree
   */
  private async processTokensRecursive(
    obj: any,
    path: string[] = [],
    collection = DEFAULT_COLLECTION_NAME
  ): Promise<ProcessedToken[]> {
    const tokens: ProcessedToken[] = [];

    if (!obj || typeof obj !== 'object') return tokens;

    // If we're at the root level (path is empty), treat each key as a collection name
    if (path.length === 0) {
      for (const [key, value] of Object.entries(obj)) {
        if (key.startsWith('$')) continue; // Skip metadata keys

        if (typeof value === 'object') {
          // This key represents a collection
          const collectionTokens = await this.processTokensRecursive(value, [], key);
          tokens.push(...collectionTokens);
        }
      }
      return tokens;
    }

    // Process tokens at current level
    for (const [key, value] of Object.entries(obj)) {
      if (key.startsWith('$')) continue; // Skip metadata keys

      const currentPath = [...path, key];

      // If this is a token (has $type and $value)
      if (this.isToken(value)) {
        const token = await this.processSingleToken(value, currentPath, collection);
        if (token) {
          tokens.push(token);
        }
      } else if (typeof value === 'object') {
        // Process nested group
        const nestedTokens = await this.processTokensRecursive(value, currentPath, collection);
        tokens.push(...nestedTokens);
      }
    }

    return tokens;
  }

  /**
   * Check if an object is a token
   */
  private isToken(obj: any): boolean {
    return obj &&
           typeof obj === 'object' &&
           ('$value' in obj || 'value' in obj) &&
           ('$type' in obj || 'type' in obj);
  }

  /**
   * Process a single token
   */
  private async processSingleToken(
    tokenData: any,
    path: string[],
    collection: string
  ): Promise<ProcessedToken | null> {
    try {
      const tokenType = tokenData.$type || tokenData.type || 'string';
      const tokenValue = tokenData.$value || tokenData.value;
      const tokenName = path.join('/');

      // Validate token type
      if (!this.isValidTokenType(tokenType)) {
        console.warn(`Unknown token type: ${tokenType} for token: ${tokenName}`);
      }

      // Check if this is an alias
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
        description: tokenData.$description || tokenData.description,
        extensions: tokenData.$extensions
      };

    } catch (error) {
      await this.errorHandler.handleError(error as Error, 'token_processing');
      return null;
    }
  }

  /**
   * Process token value based on type
   */
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
      case 'typography':
        return this.processTypographyValue(value);
      default:
        return value;
    }
  }

  /**
   * Process color value
   */
  private processColorValue(value: any): any {
    if (typeof value === 'string') {
      // Handle hex colors
      if (value.startsWith('#')) {
        return this.hexToRgb(value);
      }
      // Handle other color formats (rgba, hsl, etc.)
      return this.parseColorString(value);
    }

    // Already an RGB object
    if (value && typeof value === 'object' && 'r' in value) {
      return value;
    }

    return value;
  }

  /**
   * Convert hex to RGB object
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number; a?: number } {
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

  /**
   * Parse color string (rgba, hsl, etc.)
   */
  private parseColorString(colorStr: string): any {
    // Simple rgba parser
    const rgbaMatch = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (rgbaMatch) {
      return {
        r: parseInt(rgbaMatch[1]) / 255,
        g: parseInt(rgbaMatch[2]) / 255,
        b: parseInt(rgbaMatch[3]) / 255,
        ...(rgbaMatch[4] && { a: parseFloat(rgbaMatch[4]) })
      };
    }

    // Return as-is for now (could add more parsers)
    return colorStr;
  }

  /**
   * Process number value
   */
  private processNumberValue(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      // Remove units (px, rem, em, etc.)
      const numberMatch = value.match(/^(-?\d*\.?\d+)/);
      if (numberMatch) {
        return parseFloat(numberMatch[1]);
      }
    }
    return 0;
  }

  /**
   * Process typography value
   */
  private processTypographyValue(value: any): any {
    if (typeof value === 'object') {
      return value;
    }

    // If it's a string, try to parse as JSON
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }

    return value;
  }

  /**
   * Resolve aliases in processed tokens
   */
  private async resolveAliases(tokens: ProcessedToken[]): Promise<void> {
    const maxDepth = LIMITS.MAX_ALIAS_DEPTH;
    const resolved = new Set<string>();

    for (const token of tokens) {
      if (token.isAlias && !resolved.has(token.name)) {
        await this.resolveTokenAlias(token, tokens, resolved, 0, maxDepth);
      }
    }
  }

  /**
   * Resolve a single token alias
   */
  private async resolveTokenAlias(
    token: ProcessedToken,
    allTokens: ProcessedToken[],
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

    // Extract reference path from alias
    const aliasRef = token.value as string;
    const refPath = aliasRef.slice(1, -1); // Remove { }

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

    // Resolve referenced token first if needed
    if (referencedToken.isAlias && !resolved.has(referencedToken.name)) {
      await this.resolveTokenAlias(referencedToken, allTokens, resolved, depth + 1, maxDepth);
    }

    // Copy resolved value
    token.resolvedValue = referencedToken.resolvedValue;
    resolved.add(token.name);
  }

  /**
   * Group tokens by collection
   */
  private groupTokensByCollection(tokens: ProcessedToken[]): TokenCollection[] {
    const collections = new Map<string, ProcessedToken[]>();

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

  /**
   * Check if token type is valid
   */
  private isValidTokenType(type: string): boolean {
    const validTypes = [
      'color', 'number', 'string', 'boolean', 'typography',
      'dimension', 'fontFamily', 'fontWeight', 'duration',
      'cubicBezier', 'border', 'shadow', 'gradient'
    ];
    return validTypes.includes(type);
  }
}