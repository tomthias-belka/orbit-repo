/**
 * ClaraIconSet - React Native Icon Exporter for Figma
 *
 * Export SVG icons from Figma as React Native components
 */

import { MESSAGE_TYPES, UI_CONFIG } from './constants';
import { ReactNativeIconExporter } from './classes/ReactNativeIconExporter';
import { ProductionErrorHandler } from './classes/ProductionErrorHandler';
import type { PluginMessage } from './types/plugin';
import type { RNIconExportOptions } from './types/icons';

// Initialize error handler
const errorHandler = new ProductionErrorHandler();

// Initialize icon exporter
let rnIconExporter: ReactNativeIconExporter;

/**
 * Plugin initialization
 */
async function init() {
  try {
    console.log('=== ClaraIconSet Initializing ===');

    // Initialize icon exporter
    rnIconExporter = new ReactNativeIconExporter();

    // Show UI
    figma.showUI(__html__, {
      width: UI_CONFIG.WIDTH,
      height: UI_CONFIG.HEIGHT,
      title: UI_CONFIG.TITLE
    });

    console.log('✓ ClaraIconSet initialized successfully');
  } catch (error) {
    console.error('❌ Initialization error:', error);
    await errorHandler.handleError(error as Error, 'plugin-init', {});
  }
}

/**
 * Handle icon export request
 */
async function handleExportRnIcons(msg: PluginMessage) {
  try {
    console.log('[Icon Export] Starting export with options:', msg.options);

    const options: RNIconExportOptions = msg.options;
    const result = await rnIconExporter.exportIcons(options);

    figma.ui.postMessage({
      type: MESSAGE_TYPES.RN_ICONS_RESULT,
      ...result
    });

    if (result.success) {
      console.log(`✓ Exported ${result.icons.length} icons successfully`);
      figma.notify(`✓ Exported ${result.icons.length} icons successfully`);
    } else {
      console.error('❌ Export failed:', result.error);
      figma.notify(result.error || 'Export failed', { error: true });
    }
  } catch (error) {
    console.error('[Icon Export] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    figma.ui.postMessage({
      type: MESSAGE_TYPES.RN_ICONS_RESULT,
      success: false,
      error: errorMessage
    });

    figma.notify(`Error: ${errorMessage}`, { error: true });
    await errorHandler.handleError(error as Error, 'export-icons', {});
  }
}

/**
 * Handle selection info request
 */
async function handleGetRnSelection() {
  try {
    console.log('[Selection] Getting selection info');

    const selectionInfo = await rnIconExporter.getSelectionInfo();

    figma.ui.postMessage({
      type: MESSAGE_TYPES.RN_SELECTION_INFO,
      count: selectionInfo.nodes.length,
      ...selectionInfo
    });

    console.log(`✓ Selection info: ${selectionInfo.nodes.length} nodes`);
  } catch (error) {
    console.error('[Selection] Error:', error);
    await errorHandler.handleError(error as Error, 'get-selection', {});

    figma.ui.postMessage({
      type: MESSAGE_TYPES.RN_SELECTION_INFO,
      count: 0,
      nodes: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Message handler
 */
figma.ui.onmessage = async (msg: PluginMessage) => {
  try {
    console.log('[Message] Received:', msg.type);

    switch (msg.type) {
      case MESSAGE_TYPES.UI_READY:
        console.log('✓ UI ready');
        break;

      case MESSAGE_TYPES.GET_RN_SELECTION:
        await handleGetRnSelection();
        break;

      case MESSAGE_TYPES.EXPORT_RN_ICONS:
        await handleExportRnIcons(msg);
        break;

      default:
        console.warn('[Message] Unknown message type:', msg.type);
    }
  } catch (error) {
    console.error('[Message] Handler error:', error);
    await errorHandler.handleError(error as Error, 'message-handler', {
      messageType: msg.type
    });
  }
};

// Handle plugin closing
figma.on('close', () => {
  console.log('=== ClaraIconSet Closing ===');
});

// Handle selection changes
figma.on('selectionchange', async () => {
  try {
    // Automatically update selection info when user changes selection
    await handleGetRnSelection();
  } catch (error) {
    console.error('[Selection Change] Error:', error);
  }
});

// Initialize plugin
init();
