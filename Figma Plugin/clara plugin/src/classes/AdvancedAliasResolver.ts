// Advanced Alias Resolver Class
// Risolve alias di variabili in modo robusto per evitare "[object Object]"
import type { Variable } from '../types/figma.js';

export interface VariableAlias {
  type: 'VARIABLE_ALIAS';
  id: string;
}

export interface AliasResolutionOptions {
  maxDepth?: number;
  format?: 'css' | 'json' | 'tokens';
  variableMap?: Map<string, Variable>;
  nameTransform?: (name: string) => string;
}

export interface AliasResolutionResult {
  success: boolean;
  resolvedValue: string | null;
  originalValue?: any;
  error?: string;
  depth?: number;
  referencedVariableName?: string;
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
 */
export class AdvancedAliasResolver {
  private resolutionCache = new Map<string, AliasResolutionResult>();
  private resolutionStack = new Set<string>(); // Per detection circular refs
  private defaultMaxDepth = 10;

  constructor(private variableMap?: Map<string, Variable>) {}

  /**
   * Risolve un alias di variabile
   */
  resolveAlias(
    aliasValue: any,
    options: AliasResolutionOptions = {}
  ): AliasResolutionResult {
    // Reset stack per ogni nuova risoluzione top-level
    this.resolutionStack.clear();

    return this.resolveAliasInternal(aliasValue, options, 0);
  }

  /**
   * Risoluzione interna ricorsiva
   */
  private resolveAliasInternal(
    aliasValue: any,
    options: AliasResolutionOptions,
    currentDepth: number
  ): AliasResolutionResult {
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
      // Trova la variabile referenziata
      const referencedVariable = this.findReferencedVariable(aliasId, options.variableMap);

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

      const result: AliasResolutionResult = {
        success: true,
        resolvedValue,
        depth: currentDepth,
        referencedVariableName: referencedVariable.name
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
   * Trova la variabile referenziata
   */
  private findReferencedVariable(
    aliasId: string,
    variableMap?: Map<string, Variable>
  ): Variable | null {
    // Prova prima con la mappa fornita
    if (variableMap && variableMap.has(aliasId)) {
      return variableMap.get(aliasId)!;
    }

    // Prova con la mappa interna
    if (this.variableMap && this.variableMap.has(aliasId)) {
      return this.variableMap.get(aliasId)!;
    }

    // Fallback alle API Figma (sincrono)
    try {
      return figma.variables.getVariableById(aliasId);
    } catch (error) {
      console.warn(`[AdvancedAliasResolver] Failed to get variable by ID: ${aliasId}`, error);
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
    return (name: string) => {
      // Conversione standard kebab-case per CSS
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
   * Metodo helper per il CSS - risolve alias specificamente per CSS
   */
  resolveCSSAlias(aliasValue: any, variableMap?: Map<string, Variable>): string {
    const result = this.resolveAlias(aliasValue, {
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

    // Fallback con informazioni di debug
    if (result.error) {
      console.warn(`[AdvancedAliasResolver] CSS alias resolution failed:`, result.error);
    }

    return result.resolvedValue || `/* ALIAS ERROR: ${result.error} */`;
  }

  /**
   * Metodo helper per JSON/Tokens - risolve alias per formati token
   */
  resolveTokenAlias(aliasValue: any, variableMap?: Map<string, Variable>): string {
    const result = this.resolveAlias(aliasValue, {
      format: 'tokens',
      variableMap
    });

    return result.resolvedValue || `{error-${aliasValue.id?.slice(-8) || 'unknown'}}`;
  }
}