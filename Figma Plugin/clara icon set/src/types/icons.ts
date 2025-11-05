/**
 * React Native Icon Export Types
 * Types for exporting Figma vector components to React Native SVG components
 */

/**
 * Raw icon data extracted from Figma
 */
export interface IconData {
  name: string;
  figmaNodeId: string;
  svgString: string;
  componentName: string;
  width: number;
  height: number;
  colors: string[];
  hasMultipleColors: boolean;
}

/**
 * Options for React Native icon export
 */
export interface RNIconExportOptions {
  format: 'tsx' | 'jsx';
  isIllustrated: boolean;
  includeDisabled: boolean;
  selectedNodeIds: string[];
}

/**
 * Generated React Native component
 */
export interface GeneratedIcon {
  name: string;
  componentName: string;
  code: string;
  colors: string[];
}

/**
 * Export operation result
 */
export interface ExportResult {
  success: boolean;
  icons: GeneratedIcon[];
  message?: string;
  error?: string;
}

/**
 * Icon export configuration for SVG transformation
 */
export interface IconExportConfig {
  isIllustrated: boolean;
  includeDisabled: boolean;
  format: 'tsx' | 'jsx';
}
