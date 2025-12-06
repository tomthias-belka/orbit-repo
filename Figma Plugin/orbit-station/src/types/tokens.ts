// Design Token Types and Interfaces

// W3C Design Tokens Standard Types
export interface DesignToken {
  $value?: any;
  $type?: TokenType;
  $description?: string;
  $extensions?: { [key: string]: any };
}

export interface TokenGroup {
  [key: string]: DesignToken | TokenGroup;
}

export type TokenType =
  | 'color'
  | 'dimension'
  | 'fontFamily'
  | 'fontWeight'
  | 'duration'
  | 'cubicBezier'
  | 'number'
  | 'string'
  | 'boolean'
  | 'typography'
  | 'border'
  | 'shadow'
  | 'gradient'
  | 'transition'
  | 'strokeStyle';

// Color Token Types
export interface ColorToken extends DesignToken {
  $type: 'color';
  $value: string | RGBColor | HSLColor;
}

export interface RGBColor {
  r: number;
  g: number;
  b: number;
  alpha?: number;
}

export interface HSLColor {
  h: number;
  s: number;
  l: number;
  alpha?: number;
}

// Typography Token Types
export interface TypographyToken extends DesignToken {
  $type: 'typography';
  $value: TypographyValue;
}

export interface TypographyValue {
  fontFamily: string;
  fontSize: DimensionValue;
  fontWeight?: FontWeightValue;
  letterSpacing?: DimensionValue;
  lineHeight?: number | DimensionValue;
  textAlign?: TextAlignValue;
  textDecoration?: TextDecorationValue;
  textTransform?: TextTransformValue;
}

export interface DimensionValue {
  value: number;
  unit: 'px' | 'rem' | 'em' | '%' | 'vw' | 'vh';
}

export type FontWeightValue = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 'normal' | 'bold';
export type TextAlignValue = 'left' | 'center' | 'right' | 'justify';
export type TextDecorationValue = 'none' | 'underline' | 'overline' | 'line-through';
export type TextTransformValue = 'none' | 'uppercase' | 'lowercase' | 'capitalize';

// Token Studio Format Types
export interface TokenStudioFormat {
  [setName: string]: TokenStudioTokenSet;
}

export interface TokenStudioFormatWithMeta {
  [setName: string]: TokenStudioTokenSet | TokenStudioTheme[] | TokenStudioMetadata;
}

export interface TokenStudioTokenSet {
  [tokenName: string]: TokenStudioToken | TokenStudioTokenSet;
}

export interface TokenStudioToken {
  value: any;
  type: string;
  description?: string;
  extensions?: { [key: string]: any };
}

export interface TokenStudioTheme {
  id: string;
  name: string;
  selectedTokenSets: { [setName: string]: 'enabled' | 'disabled' | 'source' };
  $figmaStyleReferences?: { [key: string]: string };
}

export interface TokenStudioMetadata {
  tokenSetOrder: string[];
  updatedAt?: string;
  version?: string;
}

// Format Detection Types
export interface FormatDetectionResult {
  format: 'w3c' | 'token-studio' | 'figma-variables' | 'unknown';
  confidence: number;
  features: string[];
  hasThemes?: boolean;
  hasExtensions?: boolean;
}

// Token Conversion Types
export interface ConversionOptions {
  sourceFormat: 'w3c' | 'token-studio' | 'figma-variables';
  targetFormat: 'w3c' | 'token-studio' | 'figma-variables';
  preserveExtensions?: boolean;
  flattenGroups?: boolean;
  addPrefix?: string;
  removePrefix?: string;
}

// Alias Resolution Types
export interface TokenAlias {
  original: string;
  resolved: any;
  path: string[];
  circularRef?: boolean;
}

export interface AliasMap {
  [aliasPath: string]: TokenAlias;
}

// Token Processing Types
export interface ProcessedToken {
  name: string;
  path: string[];
  type: string;
  value: any;
  collection: string;
  isAlias: boolean;
  resolvedValue: any;
  description?: string;
  extensions?: { [key: string]: any };
}

export interface TokenCollection {
  name: string;
  tokens: ProcessedToken[];
}

export interface ImportOptions {
  collectionName?: string;
  modeName?: string;
  overwriteExisting?: boolean;
  skipInvalid?: boolean;
}

export interface ProcessingResult {
  success: boolean;
  tokens: ProcessedToken[];
  collections: TokenCollection[];
  aliasCount: number;
  message: string;
  errors?: string[];
}

export interface TokenData {
  [key: string]: any;
}

// Export Options Types
export interface ExportOptions {
  collections: VariableCollection[];
  modes: string[];
  types: string[];
  exportType: 'combined' | 'separate' | 'by-collection';
  format: string;
  includeAliases?: boolean;
  includeModes?: boolean;
  flattenGroups?: boolean;
  addPrefix?: string;
  removePrefix?: string;
}

export interface VariableCollection {
  id: string;
  name: string;
  modes: VariableMode[];
  variableIds: string[];
}

export interface VariableMode {
  modeId: string;
  name: string;
}