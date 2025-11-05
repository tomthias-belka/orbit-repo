// Figma API Type Extensions
// Estende i tipi base di @figma/plugin-typings con definizioni specifiche per il plugin

/**
 * Estende il tipo Variable di Figma con proprietà aggiuntive utili
 */
export type Variable = VariableNode;

/**
 * Estende il tipo VariableCollection
 */
export type VariableCollection = VariableCollectionNode;

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
export type VariableValue = string | number | boolean | RGB | RGBA | VariableAlias;

/**
 * Tipo per text styles esteso
 */
export type TextStyle = TextStyleNode;

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
  resolvedType: VariableResolvedDataType;
  scopes: VariableScope[];
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
  textCase?: TextCase;
  textDecoration?: TextDecoration;

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

  error?: string;
}

/**
 * Risultato di estrazione di collezioni
 */
export interface CollectionExtractionResult {
  collections: VariableCollection[];
  variables: Variable[];
  extractedVariables: ExtractedVariable[];
  variableMap: Map<string, Variable>;
}

/**
 * Opzioni per l'estrazione di variabili
 */
export interface VariableExtractionOptions {
  includeDescription?: boolean;
  includeScopes?: boolean;
  filterTypes?: VariableResolvedDataType[];
  filterCollections?: string[];
  includeHidden?: boolean;
}