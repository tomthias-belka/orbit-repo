// Figma API Type Extensions
// Estende i tipi base di @figma/plugin-typings con definizioni specifiche per il plugin

/**
 * Tipo per gli alias di variabili
 */
export interface VariableAlias {
  type: 'VARIABLE_ALIAS';
  id: string;
}

/**
 * Tipo per i valori di variabili che possono essere alias o valori diretti
 */
export type VariableValue = string | number | boolean | any | VariableAlias; // RGB/RGBA replaced with any

/**
 * Struttura per i modi delle collezioni
 */
export interface VariableMode {
  modeId: string;
  name: string;
}

/**
 * Metadata per variabili estratte
 */
export interface ExtractedVariable {
  id: string;
  name: string;
  description?: string;
  resolvedType: string;
  scopes: string[];
  valuesByMode: { [modeId: string]: VariableValue };
  variableCollectionId: string;
}

/**
 * Metadata per text styles estratti
 */
export interface ExtractedTextStyle {
  id: string;
  name: string;
  description?: string;

  // Font properties
  fontFamily: string;
  fontStyle: string;
  fontSize: number;

  // Spacing properties
  letterSpacing: string | number;
  lineHeight: string | number;
  paragraphIndent?: number;
  paragraphSpacing?: number;
  listSpacing?: number;

  // Text formatting
  textCase?: string; // Was TextCase
  textDecoration?: string; // Was TextDecoration

  // Alignment properties
  textAlignHorizontal?: 'LEFT' | 'RIGHT' | 'CENTER' | 'JUSTIFIED';
  textAlignVertical?: 'TOP' | 'CENTER' | 'BOTTOM';

  // Auto-resize and truncation
  textAutoResize?: 'WIDTH_AND_HEIGHT' | 'HEIGHT' | 'NONE' | 'TRUNCATE';
  textTruncation?: 'DISABLED' | 'ENDING';
  maxLines?: number;

  // Advanced properties
  hangingPunctuation?: boolean;
  hangingList?: boolean;
  leadingTrim?: 'CAP_HEIGHT' | 'NONE';

  // Link property
  hyperlink?: {
    type: 'URL' | 'NODE';
    value: string;
  } | null;

  // W3C Design Tokens extensions
  $extensions?: {
    fontFile?: string | { [brand: string]: string };
  };

  error?: string;
}

/**
 * Risultato di estrazione di collezioni
 */
export interface CollectionExtractionResult {
  collections: any[]; // Was VariableCollection[]
  variables: any[]; // Was Variable[]
  extractedVariables: ExtractedVariable[];
  variableMap: Map<string, any>; // Was Map<string, Variable>
}

/**
 * Opzioni per l'estrazione di variabili
 */
export interface VariableExtractionOptions {
  includeDescription?: boolean;
  includeScopes?: boolean;
  filterTypes?: string[];
  filterCollections?: string[];
  includeHidden?: boolean;
}