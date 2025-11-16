// Library Manager Class
// Handles operations with external Figma libraries (Team Library)
import { ProductionErrorHandler } from './ProductionErrorHandler.js';
import type {
  LibraryCollectionMetadata,
  LibraryVariableMetadata,
  LibraryImportOptions,
  LibraryImportResult,
  LibraryDiscoveryResult,
  LibraryError,
  LibraryErrorType,
  RemoteVariableCache
} from '../types/library.js';

export class LibraryManager {
  private errorHandler: ProductionErrorHandler;
  private remoteVariableCache: Map<string, RemoteVariableCache> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.errorHandler = new ProductionErrorHandler();
  }

  /**
   * Discover all available library variable collections
   * User must have enabled libraries via Figma UI
   */
  async discoverAvailableLibraries(): Promise<LibraryDiscoveryResult> {
    try {
      // Access Team Library API
      const libraryCollections = await figma.teamLibrary.getAvailableLibraryVariableCollectionsAsync();

      if (!libraryCollections || libraryCollections.length === 0) {
        return {
          success: true,
          libraries: [],
          message: 'No libraries enabled. Enable libraries in Figma UI first.'
        };
      }

      // Map to metadata format
      const libraries: LibraryCollectionMetadata[] = libraryCollections.map(col => ({
        name: col.name,
        key: col.key,
        libraryName: col.libraryName || 'Unknown Library',
        variableCount: undefined // We'll fetch this on-demand
      }));

      return {
        success: true,
        libraries,
        message: `Found ${libraries.length} library collection(s)`
      };
    } catch (error) {
      const errorMessage = this.errorHandler.handleError(
        error as Error,
        { operation: 'discoverAvailableLibraries' }
      );

      return {
        success: false,
        libraries: [],
        error: errorMessage.message
      };
    }
  }

  /**
   * Get all variables from a specific library collection
   * @param collectionKey - The key of the library collection
   */
  async getVariablesFromLibrary(collectionKey: string): Promise<LibraryVariableMetadata[]> {
    try {
      const libraryVariables = await figma.teamLibrary.getVariablesInLibraryCollectionAsync(collectionKey);

      if (!libraryVariables || libraryVariables.length === 0) {
        return [];
      }

      // Map to metadata format
      const variables: LibraryVariableMetadata[] = libraryVariables.map(libVar => ({
        id: libVar.key, // Library variables use 'key' as identifier
        key: libVar.key,
        name: libVar.name,
        resolvedType: libVar.resolvedType,
        variableCollectionId: '', // Not exposed by LibraryVariable API
        collectionName: 'Unknown', // Not directly available from LibraryVariable
        libraryName: 'Unknown', // Not directly available from LibraryVariable
        isRemote: true as const
      }));

      return variables;
    } catch (error) {
      this.errorHandler.handleError(
        error as Error,
        {
          operation: 'getVariablesFromLibrary',
          details: { collectionKey }
        }
      );
      throw this.createLibraryError(error as Error, collectionKey);
    }
  }

  /**
   * Import a variable from external library into current file
   * The variable will be linked to the library (stays in sync)
   * @param options - Import options including variable key
   */
  async importVariableFromLibrary(options: LibraryImportOptions): Promise<LibraryImportResult> {
    try {
      // Import variable using Figma API
      // This creates a "linked variable" that stays in sync with library
      const importedVariable = await figma.variables.importVariableByKeyAsync(options.variableKey);

      // Cache the imported variable
      this.cacheRemoteVariable(importedVariable);

      return {
        success: true,
        message: `Successfully imported variable: ${importedVariable.name}`,
        importedVariable,
        variableKey: options.variableKey
      };
    } catch (error) {
      const err = error as Error;
      const errorCode = this.categorizeError(err);

      return {
        success: false,
        message: `Failed to import variable: ${err.message}`,
        variableKey: options.variableKey,
        error: {
          code: errorCode,
          details: err.message
        }
      };
    }
  }

  /**
   * Batch import multiple variables from library
   * @param variableKeys - Array of variable keys to import
   */
  async batchImportFromLibrary(variableKeys: string[]): Promise<LibraryImportResult[]> {
    const results: LibraryImportResult[] = [];

    for (const variableKey of variableKeys) {
      const result = await this.importVariableFromLibrary({ variableKey });
      results.push(result);

      // Small delay to avoid rate limiting
      if (variableKeys.length > 10) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    return results;
  }

  /**
   * Get a remote variable by ID (from cache or fetch)
   * Used by AdvancedAliasResolver for cross-library aliases
   * @param variableId - The ID of the variable to retrieve
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
      this.errorHandler.handleError(
        error as Error,
        {
          operation: 'getRemoteVariable',
          details: { variableId }
        }
      );
      return null;
    }
  }

  /**
   * Check if a variable is from an external library
   * @param variable - The variable to check
   */
  isRemoteVariable(variable: Variable): boolean {
    // Remote variables have a 'remote' property set to true
    return variable.remote === true;
  }

  /**
   * Get library metadata for a remote variable
   * @param variable - The remote variable
   */
  getLibraryInfo(variable: Variable): { libraryName?: string; collectionName?: string } | null {
    if (!this.isRemoteVariable(variable)) {
      return null;
    }

    // Remote variables don't expose library name directly via API
    // We can only get collection info
    const collection = figma.variables.getVariableCollectionById(variable.variableCollectionId);

    return {
      libraryName: undefined, // Not directly accessible
      collectionName: collection?.name
    };
  }

  /**
   * Clear the remote variable cache
   */
  clearCache(): void {
    this.remoteVariableCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.remoteVariableCache.size,
      entries: Array.from(this.remoteVariableCache.keys())
    };
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

  /**
   * Categorize error based on error message
   */
  private categorizeError(error: Error): LibraryErrorType {
    const message = error.message.toLowerCase();

    if (message.includes('permission') || message.includes('access')) {
      return 'PERMISSION_DENIED';
    }
    if (message.includes('not found') || message.includes('does not exist')) {
      return 'NOT_FOUND';
    }
    if (message.includes('library') && message.includes('disabled')) {
      return 'LIBRARY_NOT_ENABLED';
    }
    if (message.includes('invalid') && message.includes('key')) {
      return 'INVALID_KEY';
    }

    return 'UNKNOWN';
  }

  /**
   * Create a library-specific error with context
   */
  private createLibraryError(error: Error, context?: string): Error {
    const errorType = this.categorizeError(error);
    const message = `Library error (${errorType}): ${error.message}`;

    const libraryError = new Error(message);
    libraryError.name = 'LibraryError';

    return libraryError;
  }

  /**
   * Clean expired entries from cache (called periodically)
   */
  private cleanExpiredCache(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    this.remoteVariableCache.forEach((entry, key) => {
      if (this.isCacheExpired(entry.timestamp)) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => this.remoteVariableCache.delete(key));
  }
}
