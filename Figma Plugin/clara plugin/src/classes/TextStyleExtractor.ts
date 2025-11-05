// Text Style Extractor Class
// Estrae text styles da Figma utilizzando API asincrone (NON DEPRECATE)
import type { ExtractedTextStyle } from '../types/figma.js';
import { ProductionErrorHandler } from './ProductionErrorHandler.js';

export interface TextStyleExtractionOptions {
  includeDescription?: boolean;
  includeErrorDetails?: boolean;
  skipFontLoading?: boolean;
  batchSize?: number;
  preserveAliases?: boolean;
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

  constructor() {
    this.errorHandler = new ProductionErrorHandler();
  }

  /**
   * Estrae tutti i text styles utilizzando API asincrone
   */
  async extractTextStyles(options: TextStyleExtractionOptions = {}): Promise<TextStyleExtractionResult> {
    try {
      console.log('[TextStyleExtractor] Starting text styles extraction...');

      // CRITICAL FIX: Usa API asincrona NON deprecata
      const textStyles = await figma.getLocalTextStylesAsync();
      console.log(`[TextStyleExtractor] Found ${textStyles.length} text styles`);

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

      // Process in batches for better performance
      const batchSize = options.batchSize || 10;
      const extractedStyles: ExtractedTextStyle[] = [];
      const errors: string[] = [];
      let successCount = 0;

      for (let i = 0; i < textStyles.length; i += batchSize) {
        const batch = textStyles.slice(i, i + batchSize);
        console.log(`[TextStyleExtractor] Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(textStyles.length / batchSize)}`);

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

      console.log('[TextStyleExtractor] Extraction completed:', result.message);
      return result;

    } catch (error) {
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
      await this.loadFontSafely(style.fontName);
    }

    const extractedStyle: ExtractedTextStyle = {
      id: style.id,
      name: style.name,
      description: options.includeDescription ? (style.description || '') : '',

      // Font properties
      fontFamily: style.fontName !== figma.mixed ? style.fontName.family : 'Mixed',
      fontStyle: style.fontName !== figma.mixed ? style.fontName.style : 'Mixed',
      fontSize: await this.extractBoundValue(style, 'fontSize', style.fontSize, options.preserveAliases),

      // Spacing properties
      letterSpacing: await this.extractBoundValueOrDefault(style, 'letterSpacing',
        this.extractLetterSpacing(style.letterSpacing), options.preserveAliases),
      lineHeight: await this.extractBoundValueOrDefault(style, 'lineHeight',
        this.extractLineHeight(style.lineHeight), options.preserveAliases),
      paragraphIndent: await this.extractBoundValue(style, 'paragraphIndent', style.paragraphIndent, options.preserveAliases),
      paragraphSpacing: await this.extractBoundValue(style, 'paragraphSpacing', style.paragraphSpacing, options.preserveAliases),
      listSpacing: await this.extractBoundValue(style, 'listSpacing', style.listSpacing, options.preserveAliases),

      // Text formatting
      textCase: style.textCase !== figma.mixed ? style.textCase : undefined,
      textDecoration: style.textDecoration !== figma.mixed ? style.textDecoration : undefined,

      // Alignment properties
      textAlignHorizontal: style.textAlignHorizontal !== figma.mixed ? style.textAlignHorizontal : undefined,
      textAlignVertical: style.textAlignVertical !== figma.mixed ? style.textAlignVertical : undefined,

      // Auto-resize and truncation
      textAutoResize: style.textAutoResize !== figma.mixed ? style.textAutoResize : undefined,
      textTruncation: style.textTruncation !== figma.mixed ? style.textTruncation : undefined,
      maxLines: style.maxLines !== figma.mixed ? style.maxLines : undefined,

      // Advanced properties
      hangingPunctuation: style.hangingPunctuation,
      hangingList: style.hangingList,
      leadingTrim: style.leadingTrim !== figma.mixed ? style.leadingTrim : undefined,

      // Hyperlink property
      hyperlink: this.extractHyperlink(style.hyperlink),
    };

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
    console.log(`[TextStyleExtractor] Checking ${property} for style "${style.name}"`);
    console.log(`[TextStyleExtractor] boundVariables:`, boundVariables);

    if (boundVariables && boundVariables[property]) {
      console.log(`[TextStyleExtractor] Found bound variable for ${property}:`, boundVariables[property]);
      const variableId = boundVariables[property].id;
      try {
        const variable = await figma.variables.getVariableByIdAsync(variableId);
        if (variable) {
          console.log(`[TextStyleExtractor] ✓ Resolved alias for ${property}: {${variable.name}}`);
          return `{${variable.name}}`;
        }
      } catch (error) {
        console.warn(`[TextStyleExtractor] Could not resolve variable for ${property}:`, error);
      }
    } else {
      console.log(`[TextStyleExtractor] No bound variable for ${property}, using default value`);
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
    console.log(`[TextStyleExtractor] Checking ${property} (processed) for style "${style.name}"`);

    if (boundVariables && boundVariables[property]) {
      console.log(`[TextStyleExtractor] Found bound variable for ${property}:`, boundVariables[property]);
      const variableId = boundVariables[property].id;
      try {
        const variable = await figma.variables.getVariableByIdAsync(variableId);
        if (variable) {
          console.log(`[TextStyleExtractor] ✓ Resolved alias for ${property}: {${variable.name}}`);
          return `{${variable.name}}`;
        }
      } catch (error) {
        console.warn(`[TextStyleExtractor] Could not resolve variable for ${property}:`, error);
      }
    } else {
      console.log(`[TextStyleExtractor] No bound variable for ${property}, using processed default`);
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
      console.log(`[TextStyleExtractor] Loaded font: ${fontKey}`);
    } catch (error) {
      console.warn(`[TextStyleExtractor] Failed to load font ${fontKey}:`, error);
      throw new Error(`Font loading failed: ${fontKey}`);
    }
  }

  /**
   * Estrae letter spacing in formato leggibile
   */
  private extractLetterSpacing(letterSpacing: LetterSpacing): string | number {
    if (letterSpacing === figma.mixed) return 'mixed';

    if (typeof letterSpacing === 'object') {
      if (letterSpacing.unit === 'PERCENT') {
        return `${letterSpacing.value}%`;
      } else {
        return `${letterSpacing.value}px`;
      }
    }

    return letterSpacing;
  }

  /**
   * Estrae line height in formato leggibile
   */
  private extractLineHeight(lineHeight: LineHeight): string | number {
    if (lineHeight === figma.mixed) return 'mixed';

    if (typeof lineHeight === 'object') {
      switch (lineHeight.unit) {
        case 'PERCENT':
          return `${lineHeight.value}%`;
        case 'PIXELS':
          return `${lineHeight.value}px`;
        case 'AUTO':
          return 'auto';
        default:
          return lineHeight.value;
      }
    }

    return lineHeight;
  }

  /**
   * Pulisce la cache dei font
   */
  clearFontCache(): void {
    this.fontCache.clear();
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
        const weight = this.convertFontStyleToWeight(style.fontStyle);
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

  private convertFontStyleToWeight(fontStyle: string): number {
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
}