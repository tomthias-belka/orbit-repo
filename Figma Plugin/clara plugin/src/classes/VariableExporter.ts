// Variable Exporter Class
import {
  EXPORT_FORMATS,
  MESSAGE_TYPES,
  FIGMA_TO_TOKEN_TYPE,
  PROGRESS_MESSAGES
} from '../constants/index.js';
import type {
  ExportOptions,
  VariableCollection as CustomVariableCollection,
  VariableMode as CustomVariableMode
} from '../types/tokens.js';
import { ProductionErrorHandler } from './ProductionErrorHandler.js';

export class VariableExporter {
  private errorHandler: ProductionErrorHandler;

  constructor() {
    this.errorHandler = new ProductionErrorHandler();
  }

  /**
   * Export variables to JSON format
   */
  async exportToJson(options: ExportOptions): Promise<{
    success: boolean;
    message: string;
    data?: any;
    files?: { filename: string; content: string }[];
  }> {
    try {
      // Update progress
      figma.ui.postMessage({
        type: MESSAGE_TYPES.PROGRESS_UPDATE,
        message: PROGRESS_MESSAGES.EXPORTING
      });

      // Get collections and variables
      const collections = await figma.variables.getLocalVariableCollectionsAsync();
      const variables = await figma.variables.getLocalVariablesAsync();

      // Filter collections based on options
      const filteredCollections = this.filterCollections(collections, options.collections);

      if (filteredCollections.length === 0) {
        throw new Error('No collections selected for export');
      }

      // Process export based on type
      switch (options.exportType) {
        case 'combined':
          return await this.exportCombined(filteredCollections, variables, options);
        case 'separate':
          return await this.exportSeparate(filteredCollections, variables, options);
        case 'by-collection':
          return await this.exportByCollection(filteredCollections, variables, options);
        default:
          return await this.exportCombined(filteredCollections, variables, options);
      }

    } catch (error) {
      await this.errorHandler.handleError(error as Error, 'variable_export');
      return {
        success: false,
        message: `Export failed: ${(error as Error).message}`
      };
    }
  }

  /**
   * Export variables as combined single file
   */
  private async exportCombined(
    collections: VariableCollection[],
    variables: Variable[],
    options: ExportOptions
  ): Promise<{ success: boolean; message: string; data?: any }> {
    const exportData: any = {};

    for (const collection of collections) {
      const collectionVariables = variables.filter(v => v.variableCollectionId === collection.id);
      const collectionData = await this.processCollectionVariables(
        collection,
        collectionVariables,
        options
      );

      if (Object.keys(collectionData).length > 0) {
        exportData[collection.name] = collectionData;
      }
    }

    // Format based on export format
    const formattedData = this.formatExportData(exportData, options.format);

    return {
      success: true,
      message: `Exported ${Object.keys(exportData).length} collections`,
      data: formattedData
    };
  }

  /**
   * Export variables as separate files
   */
  private async exportSeparate(
    collections: VariableCollection[],
    variables: Variable[],
    options: ExportOptions
  ): Promise<{ success: boolean; message: string; files?: { filename: string; content: string }[] }> {
    const files: { filename: string; content: string }[] = [];

    for (const collection of collections) {
      for (const mode of collection.modes) {
        const collectionVariables = variables.filter(v => v.variableCollectionId === collection.id);
        const modeData = await this.processModeVariables(
          collection,
          mode,
          collectionVariables,
          options
        );

        if (Object.keys(modeData).length > 0) {
          const filename = this.generateFilename(collection.name, mode.name, options.format);
          const formattedData = this.formatExportData(modeData, options.format);
          const content = JSON.stringify(formattedData, null, 2);

          files.push({ filename, content });
        }
      }
    }

    return {
      success: true,
      message: `Exported ${files.length} files`,
      files
    };
  }

  /**
   * Export variables by collection
   */
  private async exportByCollection(
    collections: VariableCollection[],
    variables: Variable[],
    options: ExportOptions
  ): Promise<{ success: boolean; message: string; files?: { filename: string; content: string }[] }> {
    const files: { filename: string; content: string }[] = [];

    for (const collection of collections) {
      const collectionVariables = variables.filter(v => v.variableCollectionId === collection.id);
      const collectionData = await this.processCollectionVariables(
        collection,
        collectionVariables,
        options
      );

      if (Object.keys(collectionData).length > 0) {
        const filename = this.generateFilename(collection.name, null, options.format);
        const formattedData = this.formatExportData(collectionData, options.format);
        const content = JSON.stringify(formattedData, null, 2);

        files.push({ filename, content });
      }
    }

    return {
      success: true,
      message: `Exported ${files.length} collections`,
      files
    };
  }

  /**
   * Process variables for a collection
   */
  private async processCollectionVariables(
    collection: VariableCollection,
    variables: Variable[],
    options: ExportOptions
  ): Promise<any> {
    const exportData: any = {};

    for (const variable of variables) {
      // Filter by types if specified
      if (options.types && options.types.length > 0) {
        const tokenType = FIGMA_TO_TOKEN_TYPE[variable.resolvedType];
        if (!options.types.includes(tokenType)) {
          continue;
        }
      }

      // Process variable values
      const tokenData = await this.processVariableForExport(variable, collection, options);
      if (tokenData) {
        this.setNestedProperty(exportData, this.getTokenPath(variable.name), tokenData);
      }
    }

    return exportData;
  }

  /**
   * Process variables for a specific mode
   */
  private async processModeVariables(
    collection: VariableCollection,
    mode: any, // Figma VariableMode type
    variables: Variable[],
    options: ExportOptions
  ): Promise<any> {
    const exportData: any = {};

    for (const variable of variables) {
      // Filter by types if specified
      if (options.types && options.types.length > 0) {
        const tokenType = FIGMA_TO_TOKEN_TYPE[variable.resolvedType];
        if (!options.types.includes(tokenType)) {
          continue;
        }
      }

      // Get value for this mode
      const value = variable.valuesByMode[mode.modeId];
      if (value !== undefined) {
        const tokenData = await this.processVariableValue(variable, value, options);
        if (tokenData) {
          this.setNestedProperty(exportData, this.getTokenPath(variable.name), tokenData);
        }
      }
    }

    return exportData;
  }

  /**
   * Process a variable for export
   */
  private async processVariableForExport(
    variable: Variable,
    collection: VariableCollection,
    options: ExportOptions
  ): Promise<any> {
    const tokenType = FIGMA_TO_TOKEN_TYPE[variable.resolvedType];

    // Handle multi-mode vs single mode
    if (collection.modes.length > 1 && options.includeModes) {
      // Multi-mode token
      const modeValues: any = {};
      for (const mode of collection.modes) {
        const value = variable.valuesByMode[mode.modeId];
        if (value !== undefined) {
          modeValues[mode.name] = await this.processVariableValue(variable, value, options);
        }
      }

      return {
        $type: tokenType,
        $value: modeValues,
        ...(variable.description && { $description: variable.description })
      };
    } else {
      // Single mode token (use first mode)
      const firstMode = collection.modes[0];
      const value = variable.valuesByMode[firstMode.modeId];

      if (value !== undefined) {
        const processedValue = await this.processVariableValue(variable, value, options);
        return {
          $type: tokenType,
          $value: processedValue,
          ...(variable.description && { $description: variable.description })
        };
      }
    }

    return null;
  }

  /**
   * Process a variable value
   */
  private async processVariableValue(variable: Variable, value: any, options: ExportOptions): Promise<any> {
    switch (variable.resolvedType) {
      case 'COLOR':
        return this.processColorValue(value);
      case 'FLOAT':
        return this.processNumberValue(value);
      case 'STRING':
        return this.processStringValue(value);
      case 'BOOLEAN':
        return value;
      default:
        return value;
    }
  }

  /**
   * Process color value for export
   */
  private processColorValue(value: any): string {
    if (value && typeof value === 'object' && 'r' in value) {
      // Convert RGB to hex
      const r = Math.round(value.r * 255).toString(16).padStart(2, '0');
      const g = Math.round(value.g * 255).toString(16).padStart(2, '0');
      const b = Math.round(value.b * 255).toString(16).padStart(2, '0');
      const hex = `#${r}${g}${b}`;

      if (value.a !== undefined && value.a < 1) {
        const a = Math.round(value.a * 255).toString(16).padStart(2, '0');
        return `${hex}${a}`;
      }

      return hex;
    }

    return value;
  }

  /**
   * Process number value for export
   */
  private processNumberValue(value: any): number {
    if (typeof value === 'number') {
      return value;
    }
    return parseFloat(value) || 0;
  }

  /**
   * Process string value for export
   */
  private processStringValue(value: any): any {
    if (typeof value === 'string') {
      // Try to parse as JSON for complex objects
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  }

  /**
   * Format export data based on format
   */
  private formatExportData(data: any, format?: string): any {
    switch (format) {
      case EXPORT_FORMATS.TOKEN_STUDIO:
        return this.convertToTokenStudioFormat(data);
      case EXPORT_FORMATS.STYLE_DICTIONARY:
        return this.convertToStyleDictionaryFormat(data);
      case EXPORT_FORMATS.W3C_DESIGN_TOKENS:
      default:
        return data; // Already in W3C format
    }
  }

  /**
   * Convert to Token Studio format
   */
  private convertToTokenStudioFormat(data: any): any {
    const converted = this.convertObjectRecursive(data, (obj) => {
      if (obj.$type && obj.$value !== undefined) {
        return {
          type: obj.$type,
          value: obj.$value,
          ...(obj.$description && { description: obj.$description })
        };
      }
      return obj;
    });

    return converted;
  }

  /**
   * Convert to Style Dictionary format
   */
  private convertToStyleDictionaryFormat(data: any): any {
    // Style Dictionary uses a flatter structure
    const flattened = this.flattenObject(data);
    const converted: any = {};

    for (const [path, token] of Object.entries(flattened)) {
      if (token && typeof token === 'object' && '$value' in token) {
        converted[path] = {
          value: (token as any).$value,
          type: (token as any).$type,
          ...(token as any).$description && { comment: (token as any).$description }
        };
      }
    }

    return converted;
  }

  /**
   * Convert object recursively
   */
  private convertObjectRecursive(obj: any, converter: (obj: any) => any): any {
    if (!obj || typeof obj !== 'object') return obj;

    const result = converter(obj);
    if (result !== obj) return result;

    const converted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = this.convertObjectRecursive(value, converter);
    }

    return converted;
  }

  /**
   * Flatten object to dot notation
   */
  private flattenObject(obj: any, prefix = ''): { [key: string]: any } {
    const flattened: { [key: string]: any } = {};

    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (value && typeof value === 'object' && !('$value' in value)) {
        Object.assign(flattened, this.flattenObject(value, newKey));
      } else {
        flattened[newKey] = value;
      }
    }

    return flattened;
  }

  /**
   * Filter collections based on options
   */
  private filterCollections(
    collections: VariableCollection[],
    selectedCollections?: CustomVariableCollection[]
  ): VariableCollection[] {
    if (!selectedCollections || selectedCollections.length === 0) {
      return collections;
    }

    const selectedIds = selectedCollections.map(c => c.id);
    return collections.filter(c => selectedIds.includes(c.id));
  }

  /**
   * Get token path from variable name
   */
  private getTokenPath(name: string): string[] {
    return name.split('/').map(part => part.trim());
  }

  /**
   * Set nested property in object
   */
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

  /**
   * Generate filename for export
   */
  private generateFilename(collectionName: string, modeName?: string | null, format?: string): string {
    const safeName = collectionName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const modeStr = modeName ? `-${modeName.toLowerCase().replace(/[^a-z0-9]/g, '-')}` : '';
    const extension = '.json'; // Always JSON for now

    return `${safeName}${modeStr}${extension}`;
  }
}