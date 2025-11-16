// Advanced Alias Resolver Class
// Risolve alias di variabili in modo robusto per evitare "[object Object]"
// Supporta alias cross-library (variabili da Figma Team Libraries)
import type { Variable } from '../types/figma.js';
import { LibraryManager } from './LibraryManager.js';

export interface VariableAlias {
  type: 'VARIABLE_ALIAS';
  id: string;
}

export interface AliasResolutionOptions {
  maxDepth?: number;
  format?: 'css' | 'json' | 'tokens';
  variableMap?: Map<string, Variable>;
  nameTransform?: (name: string) => string;
  resolveRemoteAliases?: boolean; // Enable cross-library alias resolution
  libraryManager?: LibraryManager; // Optional LibraryManager instance
}

export interface AliasResolutionResult {
  success: boolean;
  resolvedValue: string | null;
  originalValue?: any;
  error?: string;
  depth?: number;
  referencedVariableName?: string;
  isRemoteVariable?: boolean; // True if resolved from external library
  libraryName?: string; // Name of the library (if remote)
}

/**
 * AdvancedAliasResolver - Gestisce la risoluzione robusta degli alias di variabili
 *
 * Questo risolvitore implementa:
 * - Risoluzione ricorsiva con limite di profondità
 * - Detection di riferimenti circolari
 * - Cache per performance
 * - Fallback intelligenti per alias non trovati
 * - Supporto multi-formato (CSS, JSON, Design Tokens)
 * - Supporto cross-library (risoluzione da Figma Team Libraries)
 */
export class AdvancedAliasResolver {
  private resolutionCache = new Map<string, AliasResolutionResult>();
  private resolutionStack = new Set<string>(); // Per detection circular refs
  private defaultMaxDepth = 10;
  private libraryManager?: LibraryManager;

  constructor(
    private variableMap?: Map<string, Variable>,
    libraryManager?: LibraryManager
  ) {
    this.libraryManager = libraryManager;
  }

  /**
   * Risolve un alias di variabile (async)
   */
  async resolveAlias(
    aliasValue: any,
    options: AliasResolutionOptions = {}
  ): Promise<AliasResolutionResult> {
    // Reset stack per ogni nuova risoluzione top-level
    this.resolutionStack.clear();

    return this.resolveAliasInternal(aliasValue, options, 0);
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

    // Verifica limiti di profondità
    if (currentDepth >= maxDepth) {
      return {
        success: false,
        resolvedValue: null,
        error: `Max resolution depth (${maxDepth}) exceeded`,
        depth: currentDepth
      };
    }

    // Verifica che sia effettivamente un alias
    if (!this.isVariableAlias(aliasValue)) {
      return {
        success: false,
        resolvedValue: null,
        error: 'Value is not a variable alias',
        originalValue: aliasValue
      };
    }

    const aliasId = aliasValue.id;

    // Check cache
    const cacheKey = `${aliasId}_${options.format}_${currentDepth}`;
    if (this.resolutionCache.has(cacheKey)) {
      return this.resolutionCache.get(cacheKey)!;
    }

    // Detection circular reference
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

    // Aggiungi alla stack
    this.resolutionStack.add(aliasId);

    try {
      // Trova la variabile referenziata (async)
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

      // Genera il valore risolto in base al formato
      const resolvedValue = this.generateResolvedValue(
        referencedVariable,
        options,
        currentDepth
      );

      // Check if variable is from external library
      const isRemote = this.libraryManager?.isRemoteVariable(referencedVariable) || false;
      const libraryInfo = isRemote && this.libraryManager
        ? this.libraryManager.getLibraryInfo(referencedVariable)
        : null;

      const result: AliasResolutionResult = {
        success: true,
        resolvedValue,
        depth: currentDepth,
        referencedVariableName: referencedVariable.name,
        isRemoteVariable: isRemote,
        libraryName: libraryInfo?.libraryName
      };

      this.resolutionCache.set(cacheKey, result);
      return result;

    } finally {
      // Rimuovi dalla stack
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
   * Trova la variabile referenziata (async) con lazy loading e cache dinamica
   * Supporta anche variabili remote da Figma Team Libraries
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

    // Se disponibile, usa LibraryManager per accesso ottimizzato a variabili remote
    if (this.libraryManager) {
      try {
        const variable = await this.libraryManager.getRemoteVariable(aliasId);
        if (variable) {
          // CACHE DINAMICA: Aggiungi alla cache locale
          if (variableMap) {
            variableMap.set(aliasId, variable);
          }
          if (this.variableMap) {
            this.variableMap.set(aliasId, variable);
          }
          return variable;
        }
      } catch (error) {
        console.warn(`[AdvancedAliasResolver] LibraryManager failed for ${aliasId}, falling back to direct API`);
      }
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

      return null;
    } catch (error) {
      console.error(`[AdvancedAliasResolver] Failed to get variable by ID: ${aliasId}`, error);
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
   * Aggiorna la mappa delle variabili
   */
  updateVariableMap(variableMap: Map<string, Variable>): void {
    this.variableMap = variableMap;
    // Clear cache quando la mappa cambia
    this.resolutionCache.clear();
  }

  /**
   * Configura il LibraryManager per risoluzione cross-library
   */
  setLibraryManager(libraryManager: LibraryManager): void {
    this.libraryManager = libraryManager;
    // Clear cache per permettere risoluzione con nuovo manager
    this.resolutionCache.clear();
  }

  /**
   * Pulisce la cache
   */
  clearCache(): void {
    this.resolutionCache.clear();
  }

  /**
   * Ottiene statistiche del resolver
   */
  getStats(): {
    cacheSize: number;
    stackSize: number;
  } {
    return {
      cacheSize: this.resolutionCache.size,
      stackSize: this.resolutionStack.size
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