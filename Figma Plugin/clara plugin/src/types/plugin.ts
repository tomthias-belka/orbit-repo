// Core plugin types and interfaces

export interface PluginMessage {
  type: string;
  [key: string]: any;
}

export interface PluginResponse {
  type: string;
  success?: boolean;
  message?: string;
  data?: any;
  error?: string;
}

// UI Message Types
export type UIMessageType =
  | 'ui-ready'
  | 'init-data'
  | 'get-collections'
  | 'import-variables'
  | 'export-json'
  | 'export-json-advanced'
  | 'export-css'
  | 'export-css-advanced'
  | 'export-text-styles'
  | 'resize'
  | 'github-upload'
  | 'github-config-save'
  | 'github-config-load'
  | 'github-config-clear';

// Variable Collection Interface
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

// Variable Interface
export interface Variable {
  id: string;
  name: string;
  resolvedType: VariableResolvedType;
  valuesByMode: { [modeId: string]: any };
  scopes?: VariableScope[];
  description?: string;
  remote?: boolean;
  key?: string;
  variableCollectionId: string;
}

export type VariableResolvedType = 'BOOLEAN' | 'COLOR' | 'FLOAT' | 'STRING';

// Official Figma API Variable Scopes (2024)
export type VariableScope =
  // Common to all types
  | 'ALL_SCOPES'
  // COLOR scopes
  | 'ALL_FILLS'
  | 'FRAME_FILL'
  | 'SHAPE_FILL'
  | 'TEXT_FILL'
  | 'STROKE_COLOR'
  | 'EFFECT_COLOR'
  // FLOAT scopes
  | 'TEXT_CONTENT'
  | 'CORNER_RADIUS'
  | 'WIDTH_HEIGHT'
  | 'GAP'
  | 'OPACITY'
  | 'STROKE_FLOAT'
  | 'EFFECT_FLOAT'
  | 'FONT_WEIGHT'
  | 'FONT_SIZE'
  | 'LINE_HEIGHT'
  | 'LETTER_SPACING'
  | 'PARAGRAPH_SPACING'
  | 'PARAGRAPH_INDENT'
  // STRING scopes
  | 'FONT_FAMILY'
  | 'FONT_STYLE';

// Text Style Interface
export interface TextStyleData {
  id: string;
  name: string;
  fontName: FontName | typeof figma.mixed;
  fontSize: number | typeof figma.mixed;
  letterSpacing: LetterSpacing | typeof figma.mixed;
  lineHeight: LineHeight | typeof figma.mixed;
  paragraphIndent: number | typeof figma.mixed;
  paragraphSpacing: number | typeof figma.mixed;
  textCase: TextCase | typeof figma.mixed;
  textDecoration: TextDecoration | typeof figma.mixed;
  hangingPunctuation?: boolean;
  hangingList?: boolean;
}

// Export Configuration Types
export interface ExportOptions {
  collections?: string[];
  modes?: string[];
  format?: string;
  exportType?: 'combined' | 'separate' | 'by-collection';
  includeScopes?: boolean;
  includeDescriptions?: boolean;
  cssFormat?: 'css' | 'scss' | 'less';
  cssNaming?: 'kebab' | 'camel' | 'snake';
  forceRemUnits?: boolean;
}

// Progress and Loading Types
export interface ProgressState {
  isLoading: boolean;
  message?: string;
  progress?: number;
  stage?: string;
}

// Error Types
export interface PluginError {
  message: string;
  code?: string;
  context?: any;
  timestamp: string;
}

// GitHub Configuration
export interface GitHubConfig {
  token: string;
  repository: string;
  branch: string;
  directory: string;
  overwrite: boolean;
}

// Import/Export Result Types
export interface ImportResult {
  success: boolean;
  message: string;
  variablesCreated?: number;
  collectionsCreated?: number;
  errors?: string[];
}

export interface ExportResult {
  success: boolean;
  content: string;
  filename?: string;
  files?: ExportFile[];
  metadata?: any;
}

export interface ExportFile {
  filename: string;
  content: string;
  type: string;
}