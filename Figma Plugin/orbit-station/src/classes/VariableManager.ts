// Variable Manager Class
import {
  DEFAULT_COLLECTION_NAME,
  DEFAULT_MODE_NAME,
  LIMITS,
  ERROR_CODES,
  PROGRESS_MESSAGES
} from '../constants/index.js';
import type {
  ProcessedToken,
  TokenCollection,
  ImportOptions
} from '../types/tokens.js';
import { ProductionErrorHandler } from './ProductionErrorHandler.js';

export class VariableManager {
  private errorHandler: ProductionErrorHandler;
  private collectionsMap: Map<string, VariableCollection> = new Map();
  private variablesMap: Map<string, Variable> = new Map();

  constructor() {
    this.errorHandler = new ProductionErrorHandler();
  }

  /**
   * Import processed tokens into Figma variables
   */
  async importTokensAsVariables(
    tokenCollections: TokenCollection[],
    options: ImportOptions = {}
  ): Promise<{ success: boolean; message: string; variableCount: number; collectionCount: number }> {
    try {
      let totalVariables = 0;
      let totalCollections = 0;

      figma.ui.postMessage({
        type: 'progress-update',
        message: PROGRESS_MESSAGES.CREATING_COLLECTIONS
      });

      // Create or get collections for each token collection
      for (const tokenCollection of tokenCollections) {
        const collection = await this.getOrCreateCollection(
          tokenCollection.name,
          options.overwriteExisting || false
        );

        if (!collection) continue;

        totalCollections++;

        figma.ui.postMessage({
          type: 'progress-update',
          message: PROGRESS_MESSAGES.CREATING_VARIABLES
        });

        // Import tokens in this collection
        const variableCount = await this.importTokensToCollection(
          tokenCollection.tokens,
          collection,
          options
        );

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

  /**
   * Get or create a variable collection
   */
  private async getOrCreateCollection(
    name: string,
    overwrite: boolean = false
  ): Promise<VariableCollection | null> {
    try {
      // Check if collection already exists
      const existingCollections = await figma.variables.getLocalVariableCollectionsAsync();
      let collection = existingCollections.find(c => c.name === name);

      if (collection && !overwrite) {
        // Use existing collection
        this.collectionsMap.set(name, collection);
        return collection;
      }

      if (collection && overwrite) {
        // Remove existing collection
        collection.remove();
      }

      // Check collection limit
      if (existingCollections.length >= LIMITS.MAX_COLLECTIONS) {
        throw new Error(`Maximum number of collections (${LIMITS.MAX_COLLECTIONS}) reached`);
      }

      // Create new collection
      collection = figma.variables.createVariableCollection(name);
      this.collectionsMap.set(name, collection);

      // Ensure default mode exists
      if (collection.modes.length === 0) {
        collection.addMode(DEFAULT_MODE_NAME);
      }

      return collection;

    } catch (error) {
      await this.errorHandler.handleError(error as Error, 'collection_creation');
      return null;
    }
  }

  /**
   * Import tokens to a specific collection
   */
  private async importTokensToCollection(
    tokens: ProcessedToken[],
    collection: VariableCollection,
    options: ImportOptions
  ): Promise<number> {
    let importedCount = 0;

    // Group tokens by mode if needed
    const tokensByMode = this.groupTokensByMode(tokens);

    // Ensure required modes exist
    await this.ensureModesExist(collection, Object.keys(tokensByMode));

    // Import each token
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

  /**
   * Group tokens by mode (if they have mode-specific values)
   */
  private groupTokensByMode(tokens: ProcessedToken[]): { [mode: string]: ProcessedToken[] } {
    const groups: { [mode: string]: ProcessedToken[] } = {};

    for (const token of tokens) {
      // Check if token value is mode-specific
      if (this.isMultiModeValue(token.resolvedValue)) {
        // Token has multiple mode values
        for (const mode of Object.keys(token.resolvedValue)) {
          if (!groups[mode]) groups[mode] = [];
          groups[mode].push({
            ...token,
            resolvedValue: token.resolvedValue[mode]
          });
        }
      } else {
        // Single mode token
        const mode = DEFAULT_MODE_NAME;
        if (!groups[mode]) groups[mode] = [];
        groups[mode].push(token);
      }
    }

    return groups;
  }

  /**
   * Check if a value is mode-specific
   */
  private isMultiModeValue(value: any): boolean {
    return value &&
           typeof value === 'object' &&
           !('r' in value) && // Not an RGB color
           !Array.isArray(value) &&
           Object.keys(value).every(key => typeof key === 'string');
  }

  /**
   * Ensure required modes exist in collection
   */
  private async ensureModesExist(collection: VariableCollection, modeNames: string[]): Promise<void> {
    const existingModes = collection.modes.map(m => m.name);

    for (const modeName of modeNames) {
      if (!existingModes.includes(modeName)) {
        // Check mode limit
        if (collection.modes.length >= LIMITS.MAX_MODES_PER_COLLECTION) {
          console.warn(`Maximum modes reached for collection: ${collection.name}`);
          break;
        }

        collection.addMode(modeName);
      }
    }
  }

  /**
   * Create or update a variable
   */
  private async createOrUpdateVariable(
    token: ProcessedToken,
    collection: VariableCollection,
    options: ImportOptions
  ): Promise<Variable | null> {
    try {
      // Determine Figma variable type
      const figmaType = this.tokenTypeToFigmaType(token.type);
      if (!figmaType) {
        throw new Error(`Unsupported token type: ${token.type}`);
      }

      // Check if variable already exists
      let variable = await this.findExistingVariable(token.name, collection);

      if (variable) {
        if (!options.overwriteExisting) {
          return variable; // Skip existing variable
        }

        // Check type compatibility
        if (variable.resolvedType !== figmaType) {
          // Remove and recreate with correct type
          variable.remove();
          variable = null;
        }
      }

      // Create new variable if needed
      if (!variable) {
        variable = figma.variables.createVariable(token.name, collection, figmaType);
      }

      // Set variable description
      if (token.description) {
        variable.description = token.description;
      }

      // Set variable value(s)
      await this.setVariableValues(variable, token, collection);

      // Assign automatic scopes based on token type and path
      this.assignAutomaticScopes(variable, token);

      this.variablesMap.set(token.name, variable);
      return variable;

    } catch (error) {
      await this.errorHandler.handleError(error as Error, 'variable_creation');
      return null;
    }
  }

  /**
   * Find existing variable by name in collection
   */
  private async findExistingVariable(
    name: string,
    collection: VariableCollection
  ): Promise<Variable | null> {
    const variables = await figma.variables.getLocalVariablesAsync();
    return variables.find(v =>
      v.name === name &&
      v.variableCollectionId === collection.id
    ) || null;
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
      case 'typography': // Store as JSON string
      case 'fontweight':
      case 'font-weight':
      case 'fontfamily':
      case 'font-family':
        return 'STRING';
      case 'boolean':
        return 'BOOLEAN';
      default:
        return null;
    }
  }

  /**
   * Set variable values for all modes
   */
  private async setVariableValues(
    variable: Variable,
    token: ProcessedToken,
    collection: VariableCollection
  ): Promise<void> {
    // Get the mode to use
    const mode = collection.modes[0]; // Use first mode for now

    // Process the value based on variable type
    const processedValue = this.processValueForFigma(token.resolvedValue, variable.resolvedType);

    // Validate value before setting
    if (!this.isValidValueForType(processedValue, variable.resolvedType)) {
      throw new Error(`Invalid value type for variable ${token.name}: expected ${variable.resolvedType}`);
    }

    // Set the value
    variable.setValueForMode(mode.modeId, processedValue);
  }

  /**
   * Process value for Figma variable
   */
  private processValueForFigma(value: any, variableType: 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN'): any {
    switch (variableType) {
      case 'COLOR':
        return this.processColorForFigma(value);
      case 'FLOAT':
        return this.processNumberForFigma(value);
      case 'STRING':
        return this.processStringForFigma(value);
      case 'BOOLEAN':
        return Boolean(value);
      default:
        return value;
    }
  }

  /**
   * Process color value for Figma
   */
  private processColorForFigma(value: any): RGB | RGBA {
    // Already in correct format
    if (value && typeof value === 'object' && 'r' in value) {
      return value;
    }

    // Should not happen if TokenProcessor did its job
    throw new Error('Color value not in expected RGB format');
  }

  /**
   * Process number value for Figma
   */
  private processNumberForFigma(value: any): number {
    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      if (!isNaN(parsed)) {
        return parsed;
      }
    }

    return 0;
  }

  /**
   * Process string value for Figma
   */
  private processStringForFigma(value: any): string {
    if (typeof value === 'string') {
      return value;
    }

    // Serialize objects (like typography tokens)
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return String(value);
  }

  /**
   * Validate value for variable type
   */
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

  /**
   * Assign automatic scopes based on token type and path
   */
  private assignAutomaticScopes(variable: Variable, token: ProcessedToken): void {
    const scopes: VariableScope[] = [];
    const pathString = token.path.join('/').toLowerCase();
    const tokenType = token.type.toLowerCase();

    // Color variables
    if (tokenType === 'color') {
      // Fill scope for all colors
      scopes.push('ALL_FILLS');

      // Stroke scope for border/outline colors
      if (pathString.includes('border') || pathString.includes('outline') || pathString.includes('stroke')) {
        scopes.push('ALL_STROKES');
      }

      // Text scope for text colors
      if (pathString.includes('text') || pathString.includes('font')) {
        scopes.push('TEXT_FILL');
      }
    }

    // Spacing/dimension variables
    if (tokenType === 'number' || tokenType === 'dimension') {
      if (pathString.includes('spacing') || pathString.includes('gap') || pathString.includes('padding') || pathString.includes('margin')) {
        scopes.push('GAP');
      }

      if (pathString.includes('width') || pathString.includes('height') || pathString.includes('size')) {
        scopes.push('WIDTH_HEIGHT');
      }

      if (pathString.includes('radius') || pathString.includes('border-radius')) {
        scopes.push('CORNER_RADIUS');
      }
    }

    // Typography variables
    if (tokenType === 'typography' || tokenType === 'fontfamily' || tokenType === 'fontweight') {
      scopes.push('TEXT_CONTENT');
    }

    // String variables for text content
    if (tokenType === 'string') {
      scopes.push('TEXT_CONTENT');
    }

    // Apply scopes if any were determined
    if (scopes.length > 0) {
      variable.scopes = scopes;
    }
  }
}