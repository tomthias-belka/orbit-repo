// Message types for Icon Export Plugin
export const MESSAGE_TYPES = {
  // Icon Export Messages
  EXPORT_RN_ICONS: 'export-rn-icons',
  RN_ICONS_RESULT: 'rn-icons-result',
  GET_RN_SELECTION: 'get-rn-selection',
  RN_SELECTION_INFO: 'rn-selection-info',

  // UI Ready
  UI_READY: 'ui-ready',
} as const;

export const UI_CONFIG = {
  WIDTH: 600,
  HEIGHT: 800,
  TITLE: 'Clara Icon Set'
} as const;
