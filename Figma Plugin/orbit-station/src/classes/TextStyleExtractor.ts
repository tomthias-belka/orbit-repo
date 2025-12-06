// Text Style Extractor Class
// Estrae text styles da Figma utilizzando API asincrone (NON DEPRECATE)

// Global types - figma is available in plugin context
/// <reference types="@figma/plugin-typings" />

import type { ExtractedTextStyle, Variable } from '../types/figma.js';
import { ProductionErrorHandler } from './ProductionErrorHandler.js';
import { AdvancedAliasResolver } from './AdvancedAliasResolver.js';

export interface TextStyleExtractionOptions {
  includeDescription?: boolean;
  includeErrorDetails?: boolean;
  skipFontLoading?: boolean;
  batchSize?: number;
  preserveAliases?: boolean;
  variableMap?: Map<string, Variable>;
}

export interface TextStyleExtractionResult {
  success: boolean;
  message: string;
  styles: ExtractedTextStyle[];
  totalProcessed: number;
  successCount: number;
  errorCount: number;
  errors?: string[];
}

/**
 * TextStyleExtractor - Estrae text styles da Figma usando API asincrone moderne
 *
 * Fixes il bug delle API deprecate:
 * - figma.getLocalTextStyles() → figma.getLocalTextStylesAsync()
 * - Proper error handling per font loading
 * - Batch processing per performance
 * - Type safety completo
 */
export class TextStyleExtractor {
  private errorHandler: ProductionErrorHandler;
  private fontCache = new Set<string>();
  private aliasResolver: AdvancedAliasResolver;
  private variableMap?: Map<string, Variable>;

  // 🆕 Cache per performance optimization
  private allVariablesCache?: Variable[];
  private allCollectionsCache?: VariableCollection[];
  private variableMapByName?: Map<string, Variable>;
  private collectionMapById?: Map<string, VariableCollection>;

  constructor() {
    this.errorHandler = new ProductionErrorHandler();
    this.aliasResolver = new AdvancedAliasResolver();
  }

  /**
   * Estrae tutti i text styles utilizzando API asincrone
   */
  async extractTextStyles(options: TextStyleExtractionOptions = {}): Promise<TextStyleExtractionResult> {
    try {
      // CRITICAL FIX: Usa API asincrona NON deprecata
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

      // Update alias resolver with variable map if provided
      if (options.variableMap) {
        this.variableMap = options.variableMap;
        this.aliasResolver.updateVariableMap(options.variableMap);
      }

      // 🆕 Pre-load variables and collections for performance (once per extraction)
      this.allVariablesCache = await figma.variables.getLocalVariablesAsync();
      this.allCollectionsCache = await figma.variables.getLocalVariableCollectionsAsync();
      this.variableMapByName = new Map(this.allVariablesCache.map(v => [v.name, v]));
      this.collectionMapById = new Map(this.allCollectionsCache.map(c => [c.id, c]));

      // Process in batches for better performance
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

        // Yield control to prevent blocking
        await new Promise(resolve => setTimeout(resolve, 0));
      }

      const result: TextStyleExtractionResult = {
        success: true,
        message: `Successfully processed ${textStyles.length} text styles (${successCount} successful, ${errors.length} errors)`,
        styles: extractedStyles,
        totalProcessed: textStyles.length,
        successCount,
        errorCount: errors.length
      };

      if (options.includeErrorDetails && errors.length > 0) {
        result.errors = errors;
      }

      // 🆕 Clear cache after extraction
      this.clearVariableCache();

      return result;

    } catch (error) {
      // 🆕 Clear cache even on error
      this.clearVariableCache();
      await this.errorHandler.handleError(error, 'text_style_extraction');
      return {
        success: false,
        message: `Text styles extraction failed: ${error.message}`,
        styles: [],
        totalProcessed: 0,
        successCount: 0,
        errorCount: 1,
        errors: [error.message]
      };
    }
  }

  /**
   * Processa un batch di text styles
   */
  private async processBatch(
    textStyles: TextStyle[],
    options: TextStyleExtractionOptions
  ): Promise<ExtractedTextStyle[]> {
    const results: ExtractedTextStyle[] = [];

    for (const style of textStyles) {
      try {
        const extractedStyle = await this.extractSingleTextStyle(style, options);
        results.push(extractedStyle);
      } catch (error) {
        console.warn(`[TextStyleExtractor] Error processing style "${style.name}":`, error);

        // Create error placeholder
        results.push({
          id: style.id,
          name: style.name,
          description: options.includeDescription ? (style.description || '') : '',
          fontFamily: 'Error',
          fontStyle: 'Error',
          fontSize: 0,
          letterSpacing: 'error',
          lineHeight: 'error',
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Estrae un singolo text style
   */
  private async extractSingleTextStyle(
    style: TextStyle,
    options: TextStyleExtractionOptions
  ): Promise<ExtractedTextStyle> {
    // Load font se necessario (con cache)
    if (!options.skipFontLoading && style.fontName !== figma.mixed) {
      await this.loadFontSafely(style.fontName as FontName);
    }

    // Cast to any for extended properties
    const styleAny = style as any;

    const extractedStyle: ExtractedTextStyle = {
      id: style.id,
      name: style.name,
      description: options.includeDescription ? (style.description || '') : '',

      // Font properties
      fontFamily: style.fontName !== figma.mixed ? (style.fontName as FontName).family : 'Mixed',
      fontStyle: style.fontName !== figma.mixed ? (style.fontName as FontName).style : 'Mixed',
      fontSize: await this.extractBoundValue(style, 'fontSize', style.fontSize, options.preserveAliases),

      // Spacing properties
      letterSpacing: await this.extractBoundValueOrDefault(style, 'letterSpacing',
        this.extractLetterSpacing(style.letterSpacing), options.preserveAliases),
      lineHeight: await this.extractBoundValueOrDefault(style, 'lineHeight',
        this.extractLineHeight(style.lineHeight), options.preserveAliases),
      paragraphIndent: await this.extractBoundValue(style, 'paragraphIndent', styleAny.paragraphIndent, options.preserveAliases),
      paragraphSpacing: await this.extractBoundValue(style, 'paragraphSpacing', styleAny.paragraphSpacing, options.preserveAliases),
      listSpacing: await this.extractBoundValue(style, 'listSpacing', styleAny.listSpacing, options.preserveAliases),

      // Text formatting
      textCase: style.textCase !== figma.mixed ? style.textCase as TextCase : undefined,
      textDecoration: style.textDecoration !== figma.mixed ? style.textDecoration as TextDecoration : undefined,

      // Alignment properties
      textAlignHorizontal: styleAny.textAlignHorizontal !== figma.mixed ? styleAny.textAlignHorizontal : undefined,
      textAlignVertical: styleAny.textAlignVertical !== figma.mixed ? styleAny.textAlignVertical : undefined,

      // Auto-resize and truncation
      textAutoResize: styleAny.textAutoResize !== figma.mixed ? styleAny.textAutoResize : undefined,
      textTruncation: styleAny.textTruncation !== figma.mixed ? styleAny.textTruncation : undefined,
      maxLines: styleAny.maxLines !== figma.mixed ? styleAny.maxLines : undefined,

      // Advanced properties
      hangingPunctuation: styleAny.hangingPunctuation,
      hangingList: styleAny.hangingList,
      leadingTrim: styleAny.leadingTrim !== figma.mixed ? styleAny.leadingTrim : undefined,

      // Hyperlink property
      hyperlink: this.extractHyperlink(styleAny.hyperlink),
    };

    // 🆕 Cerca e aggiungi fontFile da variabili Figma
    const fontFileVar = await this.findFontFileVariable(style.name);
    console.log(`[TextStyleExtractor] Looking for fontFile for style: "${style.name}"`, fontFileVar ? '✅ FOUND' : '❌ NOT FOUND');
    if (fontFileVar) {
      const multiBrandValues = await this.extractMultiBrandValues(fontFileVar);
      console.log(`[TextStyleExtractor] Extracted multiBrand values:`, multiBrandValues);
      if (Object.keys(multiBrandValues).length > 0) {
        extractedStyle.$extensions = {
          fontFile: multiBrandValues
        };
        console.log(`[TextStyleExtractor] ✅ Added $extensions.fontFile to style "${style.name}"`);
      }
    }

    return extractedStyle;
  }

  /**
   * Estrae un valore che potrebbe essere legato a una variabile
   */
  private async extractBoundValue(
    style: TextStyle,
    property: string,
    defaultValue: any,
    preserveAliases?: boolean
  ): Promise<any> {
    if (!preserveAliases) {
      return defaultValue !== figma.mixed ? defaultValue : 0;
    }

    // Check if property has bound variable
    const boundVariables = (style as any).boundVariables;

    if (boundVariables && boundVariables[property]) {
      const aliasValue = boundVariables[property];

      // Use AdvancedAliasResolver for proper resolution
      const result = await this.aliasResolver.resolveTokenAlias(aliasValue, this.variableMap);
      return result;
    }

    return defaultValue !== figma.mixed ? defaultValue : 0;
  }

  /**
   * Estrae un valore bound o restituisce il default già processato
   */
  private async extractBoundValueOrDefault(
    style: TextStyle,
    property: string,
    processedDefault: any,
    preserveAliases?: boolean
  ): Promise<any> {
    if (!preserveAliases) {
      return processedDefault;
    }

    // Check if property has bound variable
    const boundVariables = (style as any).boundVariables;

    if (boundVariables && boundVariables[property]) {
      const aliasValue = boundVariables[property];

      // Use AdvancedAliasResolver for proper resolution
      const result = await this.aliasResolver.resolveTokenAlias(aliasValue, this.variableMap);
      return result;
    }

    return processedDefault;
  }

  /**
   * Estrae hyperlink in formato leggibile
   */
  private extractHyperlink(hyperlink: HyperlinkTarget | typeof figma.mixed | null): ExtractedTextStyle['hyperlink'] {
    if (!hyperlink || hyperlink === figma.mixed) return null;

    if (hyperlink.type === 'URL') {
      return {
        type: 'URL',
        value: hyperlink.value
      };
    } else if (hyperlink.type === 'NODE') {
      return {
        type: 'NODE',
        value: hyperlink.value
      };
    }

    return null;
  }

  /**
   * Carica font in modo sicuro con cache
   */
  private async loadFontSafely(fontName: FontName): Promise<void> {
    const fontKey = `${fontName.family}:${fontName.style}`;

    if (this.fontCache.has(fontKey)) {
      return; // Already loaded
    }

    try {
      await figma.loadFontAsync(fontName);
      this.fontCache.add(fontKey);
    } catch (error) {
      console.warn(`[TextStyleExtractor] Failed to load font ${fontKey}:`, error);
      throw new Error(`Font loading failed: ${fontKey}`);
    }
  }

  /**
   * Estrae letter spacing in formato leggibile
   */
  private extractLetterSpacing(letterSpacing: LetterSpacing | typeof figma.mixed): string | number {
    if (letterSpacing === figma.mixed) return 'mixed';

    if (typeof letterSpacing === 'object' && letterSpacing !== null && 'unit' in letterSpacing) {
      const spacing = letterSpacing as LetterSpacing;
      if (spacing.unit === 'PERCENT') {
        return `${spacing.value}%`;
      } else {
        return `${spacing.value}px`;
      }
    }

    return typeof letterSpacing === 'number' ? letterSpacing : 0;
  }

  /**
   * Estrae line height in formato leggibile
   */
  private extractLineHeight(lineHeight: LineHeight | typeof figma.mixed): string | number {
    if (lineHeight === figma.mixed) return 'mixed';

    if (typeof lineHeight === 'object' && lineHeight !== null && 'unit' in lineHeight) {
      const lh = lineHeight as any;
      if (lh.unit === 'AUTO') {
        return 'auto';
      }
      if ('value' in lh) {
        switch (lh.unit) {
          case 'PERCENT':
            return `${lh.value}%`;
          case 'PIXELS':
            return `${lh.value}px`;
          default:
            return lh.value;
        }
      }
    }

    return typeof lineHeight === 'number' ? lineHeight : 1.2;
  }

  /**
   * Pulisce la cache dei font
   */
  clearFontCache(): void {
    this.fontCache.clear();
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
   * Ottiene statistiche del cache
   */
  getCacheStats(): {
    loadedFonts: number;
    fontList: string[];
  } {
    return {
      loadedFonts: this.fontCache.size,
      fontList: Array.from(this.fontCache)
    };
  }

  /**
   * Formatta text styles per export in diversi formati
   */
  formatTextStyles(
    styles: ExtractedTextStyle[],
    format: 'json' | 'css' | 'w3c' | 'token-studio' = 'json'
  ): { data: string; filename: string } {
    switch (format.toLowerCase()) {
      case 'css':
        return this.formatAsCSS(styles);
      case 'w3c':
        return this.formatAsW3CTokens(styles);
      case 'token-studio':
        return this.formatAsTokenStudio(styles);
      case 'json':
      default:
        return this.formatAsJSON(styles);
    }
  }

  /**
   * Formatta come JSON standard
   */
  private formatAsJSON(styles: ExtractedTextStyle[]): { data: string; filename: string } {
    const data = {
      textStyles: styles,
      metadata: {
        exportedAt: new Date().toISOString(),
        totalStyles: styles.length,
        successfulStyles: styles.filter(s => !s.error).length,
        version: '1.0.0'
      }
    };

    return {
      data: JSON.stringify(data, null, 2),
      filename: 'text-styles.json'
    };
  }

  /**
   * Formatta come CSS classes
   */
  private formatAsCSS(styles: ExtractedTextStyle[]): { data: string; filename: string } {
    let css = '/* Text Styles exported from Figma */\n\n';

    styles.forEach(style => {
      if (style.error) return; // Skip error entries

      const className = this.convertNameToCSS(style.name);
      css += `.${className} {\n`;
      css += `  font-family: "${style.fontFamily}";\n`;
      css += `  font-size: ${style.fontSize}px;\n`;

      if (style.fontStyle && style.fontStyle !== 'Regular' && style.fontStyle !== 'Mixed') {
        const weight = this.convertFontStyleToWeightNumeric(style.fontStyle);
        css += `  font-weight: ${weight};\n`;
      }

      if (style.letterSpacing && style.letterSpacing !== 'mixed') {
        css += `  letter-spacing: ${style.letterSpacing};\n`;
      }

      if (style.lineHeight && style.lineHeight !== 'mixed') {
        css += `  line-height: ${style.lineHeight};\n`;
      }

      css += '}\n\n';
    });

    return {
      data: css,
      filename: 'text-styles.css'
    };
  }

  /**
   * Formatta come W3C Design Tokens
   */
  private formatAsW3CTokens(styles: ExtractedTextStyle[]): { data: string; filename: string } {
    const tokens: { [key: string]: any } = {};

    styles.forEach(style => {
      if (style.error) return;

      const tokenName = this.convertNameToToken(style.name);
      tokens[tokenName] = {
        $type: 'typography',
        $value: {
          fontFamily: style.fontFamily,
          fontSize: {
            value: style.fontSize,
            unit: 'px'
          },
          fontWeight: this.convertFontStyleToWeight(style.fontStyle),
          letterSpacing: this.parseSpacingValue(style.letterSpacing),
          lineHeight: this.parseLineHeightValue(style.lineHeight)
        },
        $description: style.description || `Text style: ${style.name}`
      };
    });

    return {
      data: JSON.stringify(tokens, null, 2),
      filename: 'text-styles.tokens.json'
    };
  }

  /**
   * Formatta come Token Studio
   */
  private formatAsTokenStudio(styles: ExtractedTextStyle[]): { data: string; filename: string } {
    const tokens: { [key: string]: any } = {};

    styles.forEach(style => {
      if (style.error) return;

      const tokenName = this.convertNameToToken(style.name);
      tokens[tokenName] = {
        type: 'typography',
        value: {
          fontFamily: style.fontFamily,
          fontSize: style.fontSize,
          fontWeight: this.convertFontStyleToWeight(style.fontStyle),
          letterSpacing: style.letterSpacing,
          lineHeight: style.lineHeight
        },
        description: style.description || `Text style: ${style.name}`
      };
    });

    return {
      data: JSON.stringify(tokens, null, 2),
      filename: 'text-styles-token-studio.json'
    };
  }

  // Helper methods
  private convertNameToCSS(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private convertNameToToken(name: string): string {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-');
  }

  private convertFontStyleToWeight(fontStyle: string): string {
    // Restituisce il fontStyle come stringa (es. "Bold", "Medium", "Regular")
    // Non convertiamo più a numeri (400, 700, etc.)
    const validWeights = ['Thin', 'ExtraLight', 'Light', 'Regular', 'Medium', 'SemiBold', 'Bold', 'ExtraBold', 'Black'];
    return validWeights.includes(fontStyle) ? fontStyle : 'Regular';
  }

  /**
   * Converte fontStyle in peso numerico CSS (solo per export CSS)
   */
  private convertFontStyleToWeightNumeric(fontStyle: string): number {
    const weightMap: { [key: string]: number } = {
      'Thin': 100, 'ExtraLight': 200, 'Light': 300,
      'Regular': 400, 'Medium': 500, 'SemiBold': 600,
      'Bold': 700, 'ExtraBold': 800, 'Black': 900
    };
    return weightMap[fontStyle] || 400;
  }

  private parseSpacingValue(spacing: string | number): any {
    if (typeof spacing === 'string') {
      if (spacing.includes('%')) {
        return { value: parseFloat(spacing), unit: 'percent' };
      } else if (spacing.includes('px')) {
        return { value: parseFloat(spacing), unit: 'px' };
      }
    }
    return { value: typeof spacing === 'number' ? spacing : 0, unit: 'px' };
  }

  private parseLineHeightValue(lineHeight: string | number): any {
    if (typeof lineHeight === 'string') {
      if (lineHeight === 'auto') return 'auto';
      if (lineHeight.includes('%')) {
        return { value: parseFloat(lineHeight) / 100, unit: 'percent' };
      } else if (lineHeight.includes('px')) {
        return { value: parseFloat(lineHeight), unit: 'px' };
      }
    }
    return typeof lineHeight === 'number' ? lineHeight : 1.2;
  }

  /**
   * Cerca una variabile fontFile associata al text style
   * Pattern: semantic/textStyle/{text-style-name}/fontFile
   *
   * 🆕 OTTIMIZZATO: Usa cache pre-caricata invece di chiamare API per ogni style
   */
  private async findFontFileVariable(textStyleName: string): Promise<Variable | null> {
    try {
      // 🔧 FIX: Pattern corretto senza prefisso "semantic/" (le variabili importate da orbit.json sono textStyle/...)
      const variableName = `textStyle/${textStyleName}/fontFile`;
      console.log(`[TextStyleExtractor] Searching for variable: "${variableName}"`);

      // 🆕 Usa Map cache per lookup O(1) invece di ciclo O(n)
      if (this.variableMapByName) {
        const variable = this.variableMapByName.get(variableName);
        if (variable && variable.resolvedType === 'STRING') {
          console.log(`[TextStyleExtractor] ✅ Found variable in cache`);
          return variable;
        }
        console.log(`[TextStyleExtractor] ❌ Variable not found in cache. Available variables:`, Array.from(this.variableMapByName.keys()).filter(k => k.includes('fontFile')));
        return null;
      }

      // Fallback (non dovrebbe mai accadere se extractTextStyles pre-carica)
      console.warn('[TextStyleExtractor] Variable cache not initialized, falling back to API call');
      const allVariables = await figma.variables.getLocalVariablesAsync();
      for (const variable of allVariables) {
        if (variable.name === variableName && variable.resolvedType === 'STRING') {
          return variable;
        }
      }

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
        console.warn('[TextStyleExtractor] Collection cache not initialized, falling back to API call');
        const allCollections = await figma.variables.getLocalVariableCollectionsAsync();
        collection = allCollections.find(c => c.variableIds.includes(variable.id));
      }

      if (!collection) {
        console.warn(`[TextStyleExtractor] Collection not found for variable "${variable.name}"`);
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