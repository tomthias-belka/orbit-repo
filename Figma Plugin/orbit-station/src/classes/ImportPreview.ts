// Import Preview Class
import { TokenProcessor } from './TokenProcessor.js';
import { ProductionErrorHandler } from './ProductionErrorHandler.js';
import type { PreviewItem, PreviewResult, PreviewOptions } from '../types/preview.js';
import type { ProcessedToken, TokenCollection } from '../types/tokens.js';

export class ImportPreview {
  private tokenProcessor: TokenProcessor;
  private errorHandler: ProductionErrorHandler;

  constructor() {
    this.tokenProcessor = new TokenProcessor();
    this.errorHandler = new ProductionErrorHandler();
  }

  /**
   * Generate preview of tokens to be imported
   */
  async generatePreview(
    jsonData: any,
    options: PreviewOptions = {}
  ): Promise<PreviewResult> {
    try {
      // Process tokens from JSON
      const processingResult = await this.tokenProcessor.processTokens(jsonData);

      if (!processingResult.success) {
        return {
          success: false,
          items: [],
          stats: {
            total: 0,
            new: 0,
            overwrite: 0,
            conflict: 0,
            invalid: 0,
            unchanged: 0
          },
          errors: processingResult.errors
        };
      }

      // Get existing variables
      const existingVariables = await figma.variables.getLocalVariablesAsync();
      const existingCollections = await figma.variables.getLocalVariableCollectionsAsync();

      // Build lookup maps
      const existingVarMap = new Map(
        existingVariables.map(v => [v.name, v])
      );
      const existingCollMap = new Map(
        existingCollections.map(c => [c.name, c])
      );

      // Generate preview items
      const previewItems: PreviewItem[] = [];

      for (const tokenCollection of processingResult.collections) {
        for (const token of tokenCollection.tokens) {
          const previewItem = await this.createPreviewItem(
            token,
            tokenCollection.name,
            existingVarMap,
            existingCollMap,
            options
          );

          // Filter out unchanged if not requested
          if (
            !options.includeUnchanged &&
            previewItem.status === 'unchanged'
          ) {
            continue;
          }

          previewItems.push(previewItem);
        }
      }

      // Calculate stats
      const stats = this.calculateStats(previewItems);

      return {
        success: true,
        items: previewItems,
        stats
      };
    } catch (error) {
      await this.errorHandler.handleError(error as Error, 'preview_generation');
      return {
        success: false,
        items: [],
        stats: {
          total: 0,
          new: 0,
          overwrite: 0,
          conflict: 0,
          invalid: 0,
          unchanged: 0
        },
        errors: [(error as Error).message]
      };
    }
  }

  /**
   * Create preview item for a single token
   */
  private async createPreviewItem(
    token: ProcessedToken,
    collectionName: string,
    existingVarMap: Map<string, Variable>,
    existingCollMap: Map<string, VariableCollection>,
    options: PreviewOptions
  ): Promise<PreviewItem> {
    const existingVar = existingVarMap.get(token.name);
    const existingColl = existingCollMap.get(collectionName);

    let status: PreviewItem['status'] = 'new';
    let existingValue: string | undefined;
    let errorMessage: string | undefined;

    // Check if variable exists
    if (existingVar) {
      // Get existing value
      const modes = existingColl?.modes || [];
      const firstMode = modes[0];
      if (firstMode) {
        const value = existingVar.valuesByMode[firstMode.modeId];
        existingValue = this.formatValue(value, existingVar.resolvedType);
      }

      // Check if type matches
      const expectedType = this.tokenTypeToFigmaType(token.type);
      if (expectedType && existingVar.resolvedType !== expectedType) {
        status = 'conflict';
        errorMessage = `Type mismatch: existing ${existingVar.resolvedType}, new ${expectedType}`;
      } else {
        // Compare values
        const newValueStr = this.formatValue(token.resolvedValue, existingVar.resolvedType);
        if (existingValue === newValueStr) {
          status = 'unchanged';
        } else {
          status = 'overwrite';
        }
      }
    }

    // Validate token if requested
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
      selected: status !== 'unchanged', // Auto-select changed items
      collection: collectionName,
      description: token.description,
      errorMessage
    };
  }

  /**
   * Format value for display in UI
   */
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

  /**
   * Format value for comparison
   */
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

  /**
   * Validate token structure and value
   */
  private validateToken(token: ProcessedToken): { valid: boolean; error?: string } {
    // Check required fields
    if (!token.name || token.name.trim() === '') {
      return { valid: false, error: 'Token name is required' };
    }

    if (!token.type) {
      return { valid: false, error: 'Token type is required' };
    }

    if (token.resolvedValue === undefined || token.resolvedValue === null) {
      return { valid: false, error: 'Token value is required' };
    }

    // Validate type-specific values
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

  /**
   * Convert token type to Figma variable type
   */
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

  /**
   * Calculate statistics
   */
  private calculateStats(items: PreviewItem[]) {
    const stats = {
      total: items.length,
      new: 0,
      overwrite: 0,
      conflict: 0,
      invalid: 0,
      unchanged: 0
    };

    for (const item of items) {
      stats[item.status]++;
    }

    return stats;
  }

  /**
   * Filter items based on selection
   */
  filterSelectedItems(items: PreviewItem[]): PreviewItem[] {
    return items.filter(item => item.selected);
  }
}
