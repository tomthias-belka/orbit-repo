// Export Manager - Handles W3C complete, per-brand, and Figma native exports
import { VariableExporter } from '../classes/VariableExporter.js';
import type { ExportOptions } from '../types/tokens.js';

export interface ExportManagerOptions {
  brand?: string;           // Specific brand to export (orbit, mooney, AGI, etc.)
  format: 'w3c-complete' | 'w3c-per-brand' | 'figma-native';
  includeFigmaExtensions?: boolean;  // Add $extensions for re-import
}

export interface ExportResult {
  success: boolean;
  message: string;
  files: {
    filename: string;
    content: string;
    size: number;
  }[];
}

export class ExportManager {
  private exporter: VariableExporter;

  constructor() {
    this.exporter = new VariableExporter();
  }

  /**
   * Main export method - routes to specific export type
   */
  async export(options: ExportManagerOptions): Promise<ExportResult> {
    try {
      switch (options.format) {
        case 'w3c-complete':
          return await this.exportW3CComplete();
        case 'w3c-per-brand':
          if (!options.brand) {
            throw new Error('Brand must be specified for per-brand export');
          }
          return await this.exportW3CPerBrand(options.brand);
        case 'figma-native':
          return await this.exportFigmaNative();
        default:
          throw new Error(`Unknown export format: ${options.format}`);
      }
    } catch (error) {
      return {
        success: false,
        message: `Export failed: ${(error as Error).message}`,
        files: []
      };
    }
  }

  /**
   * Export W3C Complete - all tokens, all brands
   * File: orbit-tokens.json
   */
  private async exportW3CComplete(): Promise<ExportResult> {
    // Get all collections
    const collections = await figma.variables.getLocalVariableCollectionsAsync();

    const exportOptions: ExportOptions = {
      collections,
      modes: [],
      types: [],
      exportType: 'combined',
      format: 'w3c-design-tokens',
      includeModes: true,
      includeAliases: true
    };

    const result = await this.exporter.exportToJson(exportOptions);

    if (!result.success || !result.data) {
      throw new Error(result.message);
    }

    const filename = 'orbit-tokens.json';
    const content = JSON.stringify(result.data, null, 2);

    return {
      success: true,
      message: `Exported complete W3C tokens`,
      files: [{
        filename,
        content,
        size: content.length
      }]
    };
  }

  /**
   * Export W3C Per-Brand - semantic tokens only for specified brand
   * File: {brand}-semantic.tokens.json
   */
  private async exportW3CPerBrand(brand: string): Promise<ExportResult> {
    // First, export all tokens
    const collections = await figma.variables.getLocalVariableCollectionsAsync();

    const exportOptions: ExportOptions = {
      collections,
      modes: [],
      types: [],
      exportType: 'combined',
      format: 'w3c-design-tokens',
      includeModes: true,
      includeAliases: true
    };

    const result = await this.exporter.exportToJson(exportOptions);

    if (!result.success || !result.data) {
      throw new Error(result.message);
    }

    // Extract semantic tokens for this brand
    const brandTokens = this.extractBrandTokens(result.data, brand);

    if (Object.keys(brandTokens).length === 0) {
      throw new Error(`No semantic tokens found for brand: ${brand}`);
    }

    const filename = `${brand}-semantic.tokens.json`;
    const content = JSON.stringify(brandTokens, null, 2);

    return {
      success: true,
      message: `Exported ${brand} semantic tokens`,
      files: [{
        filename,
        content,
        size: content.length
      }]
    };
  }

  /**
   * Export Figma Native Format - with $extensions for re-import
   * File: Default.tokens.json
   */
  private async exportFigmaNative(): Promise<ExportResult> {
    const collections = await figma.variables.getLocalVariableCollectionsAsync();

    const exportOptions: ExportOptions = {
      collections,
      modes: [],
      types: [],
      exportType: 'combined',
      format: 'w3c-design-tokens',
      includeModes: true,
      includeAliases: true
    };

    const result = await this.exporter.exportToJson(exportOptions);

    if (!result.success || !result.data) {
      throw new Error(result.message);
    }

    // Add Figma $extensions to all tokens
    const figmaData = await this.addFigmaExtensions(result.data);

    const filename = 'Default.tokens.json';
    const content = JSON.stringify(figmaData, null, 2);

    return {
      success: true,
      message: `Exported Figma native format (re-import safe)`,
      files: [{
        filename,
        content,
        size: content.length
      }]
    };
  }

  /**
   * Extract semantic tokens for a specific brand from multi-brand structure
   *
   * Handles W3C tokens like:
   * {
   *   "semantic": {
   *     "color": {
   *       "primary": {
   *         "$type": "color",
   *         "$value": {
   *           "orbit": "#FF5733",
   *           "mooney": "#3366FF"
   *         }
   *       }
   *     }
   *   }
   * }
   *
   * Returns single-brand structure:
   * {
   *   "semantic": {
   *     "color": {
   *       "primary": {
   *         "$type": "color",
   *         "$value": "#FF5733"
   *       }
   *     }
   *   }
   * }
   */
  private extractBrandTokens(allTokens: any, brand: string): any {
    const extracted: any = {};

    // Look for "semantic" collection (brand-specific tokens live here)
    if (allTokens.semantic || allTokens.Semantic) {
      const semanticData = allTokens.semantic || allTokens.Semantic;
      extracted.semantic = this.extractBrandFromObject(semanticData, brand);
    }

    return extracted;
  }

  /**
   * Recursively extract brand-specific values from multi-brand object
   */
  private extractBrandFromObject(obj: any, brand: string): any {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    // Check if this is a token with $value
    if (obj.$value !== undefined) {
      // Multi-brand value?
      if (typeof obj.$value === 'object' && !Array.isArray(obj.$value) && obj.$value[brand] !== undefined) {
        return {
          ...obj,
          $value: obj.$value[brand]  // Extract only this brand's value
        };
      }
      // Single value or alias - keep as-is
      return obj;
    }

    // Recurse into object
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = this.extractBrandFromObject(value, brand);
    }
    return result;
  }

  /**
   * Add Figma $extensions to all tokens for re-import safety
   *
   * Adds metadata like:
   * {
   *   "$extensions": {
   *     "figma": {
   *       "variableId": "VariableID:123:456",
   *       "collectionId": "VariableCollectionID:78:90",
   *       "scopes": ["ALL_SCOPES"],
   *       "codeSyntax": {}
   *     }
   *   }
   * }
   */
  private async addFigmaExtensions(data: any): Promise<any> {
    // Get all Figma variables to map IDs
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    const variables = await figma.variables.getLocalVariablesAsync();

    // Create lookup map: variableName → variable
    const variableMap = new Map<string, Variable>();
    for (const variable of variables) {
      variableMap.set(variable.name, variable);
    }

    // Create collection map: collectionId → collection
    const collectionMap = new Map<string, VariableCollection>();
    for (const collection of collections) {
      collectionMap.set(collection.id, collection);
    }

    // Recursively add extensions
    return this.addExtensionsRecursive(data, variableMap, collectionMap, []);
  }

  /**
   * Recursively add Figma extensions to tokens
   */
  private addExtensionsRecursive(
    obj: any,
    variableMap: Map<string, Variable>,
    collectionMap: Map<string, VariableCollection>,
    pathParts: string[]
  ): any {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    // Check if this is a token with $value
    if (obj.$value !== undefined) {
      const variableName = pathParts.join('/');
      const variable = variableMap.get(variableName);

      if (variable) {
        const collection = collectionMap.get(variable.variableCollectionId);
        return {
          ...obj,
          $extensions: {
            figma: {
              variableId: variable.id,
              collectionId: variable.variableCollectionId,
              collectionName: collection?.name,
              scopes: variable.scopes,
              codeSyntax: variable.codeSyntax
            }
          }
        };
      }
      return obj;
    }

    // Recurse into object
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = this.addExtensionsRecursive(
        value,
        variableMap,
        collectionMap,
        [...pathParts, key]
      );
    }
    return result;
  }
}

// Export singleton instance
export const exportManager = new ExportManager();
