// Luckino Import Export Plugin - TypeScript Main File
// Consolidated version for Figma Plugin compatibility

// Import extracted classes
import { ProductionErrorHandler } from './classes/ProductionErrorHandler';
import { TokenProcessor } from './classes/TokenProcessor';
import { VariableManager } from './classes/VariableManager';

// Import constants
import {
  MESSAGE_TYPES,
  UI_CONFIG,
  FIGMA_TO_TOKEN_TYPE,
  TOKEN_STUDIO_TO_W3C_TYPE,
  DEFAULT_COLLECTION_NAME,
  DEFAULT_MODE_NAME,
  PROGRESS_MESSAGES,
  LIMITS
} from './constants';

// Import types
import type { PluginMessage, PluginResponse } from './types/plugin';

console.clear();

// Global instances
let errorHandler: ProductionErrorHandler;
let tokenProcessor: TokenProcessor;
let variableManager: VariableManager;

// Initialize plugin
function initializePlugin(): void {
  console.clear();

  errorHandler = new ProductionErrorHandler();
  tokenProcessor = new TokenProcessor();
  variableManager = new VariableManager();

  figma.showUI(__html__, {
    width: UI_CONFIG.DEFAULT_WIDTH,
    height: UI_CONFIG.DEFAULT_HEIGHT,
    themeColors: true
  });

}

// Message handler
figma.ui.onmessage = async (msg: PluginMessage): Promise<void> => {
  try {
    const { type } = msg;

    switch (type) {
      case MESSAGE_TYPES.UI_READY:
        await handleUIReady();
        break;

      case MESSAGE_TYPES.GET_COLLECTIONS:
        await handleGetCollections();
        break;

      case MESSAGE_TYPES.IMPORT_JSON:
        await handleImportJson(msg);
        break;

      case MESSAGE_TYPES.EXPORT_JSON_ADVANCED:
        await handleExportJsonAdvanced(msg);
        break;

      case MESSAGE_TYPES.EXPORT_CSS:
        await handleExportCss(msg);
        break;

      case MESSAGE_TYPES.RESIZE:
        handleResize(msg.width, msg.height);
        break;

      default:
        console.warn(`[Plugin] Unhandled message type: ${type}`);
    }
  } catch (error) {
    const errorResult = await errorHandler.handleError(
      error as Error,
      'processing',
      { messageType: msg.type }
    );

    if (!errorResult.shouldSkip) {
      figma.notify(`Error: ${(error as Error).message}`, { error: true });
    }
  }
};

// Handler functions
async function handleUIReady(): Promise<void> {
  try {
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    const response = {
      type: MESSAGE_TYPES.INIT_DATA,
      success: true,
      data: {
        collections: collections.map(collection => ({
          id: collection.id,
          name: collection.name,
          modes: collection.modes,
          variableIds: collection.variableIds
        }))
      }
    };
    figma.ui.postMessage(response);
  } catch (error) {
    await errorHandler.handleError(error as Error, 'figma_api', { operation: 'handleUIReady' });
  }
}

async function handleGetCollections(): Promise<void> {
  try {
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    figma.ui.postMessage({
      type: MESSAGE_TYPES.COLLECTIONS_DATA,
      collections: collections.map(collection => ({
        id: collection.id,
        name: collection.name,
        modes: collection.modes,
        variableIds: collection.variableIds
      }))
    });
  } catch (error) {
    await errorHandler.handleError(error as Error, 'figma_api', { operation: 'handleGetCollections' });
  }
}

async function handleImportJson(msg: any): Promise<void> {
  try {
    const { json } = msg;

    if (!json || !json.trim()) {
      throw new Error('No JSON data provided');
    }

    let jsonData: any;
    try {
      jsonData = JSON.parse(json);
    } catch (error) {
      throw new Error('Invalid JSON format');
    }

    const processingResult = await tokenProcessor.processTokensForImport(jsonData);

    if (!processingResult.success) {
      throw new Error(processingResult.message);
    }

    const importResult = await variableManager.importTokensAsVariables(
      processingResult.collections,
      {
        overwriteExisting: true,
        skipInvalid: true
      }
    );

    figma.ui.postMessage({
      type: MESSAGE_TYPES.IMPORT_RESULT,
      success: importResult.success,
      message: importResult.message,
      data: {
        variableCount: importResult.variableCount,
        collectionCount: importResult.collectionCount,
        aliasCount: processingResult.aliasCount
      }
    });

  } catch (error) {
    await errorHandler.handleError(error as Error, 'import_json');
    figma.ui.postMessage({
      type: MESSAGE_TYPES.IMPORT_RESULT,
      success: false,
      message: (error as Error).message
    });
  }
}

async function handleExportJsonAdvanced(msg: any): Promise<void> {
  try {
    figma.ui.postMessage({
      type: MESSAGE_TYPES.JSON_ADVANCED_RESULT,
      success: false,
      message: 'Export functionality will be implemented in next phase'
    });
  } catch (error) {
    await errorHandler.handleError(error as Error, 'export_json');
    figma.ui.postMessage({
      type: MESSAGE_TYPES.JSON_ADVANCED_RESULT,
      success: false,
      message: (error as Error).message
    });
  }
}

async function handleExportCss(msg: any): Promise<void> {
  try {
    figma.ui.postMessage({
      type: MESSAGE_TYPES.CSS_RESULT,
      success: false,
      message: 'CSS export functionality will be implemented in next phase'
    });
  } catch (error) {
    await errorHandler.handleError(error as Error, 'export_css');
    figma.ui.postMessage({
      type: MESSAGE_TYPES.CSS_RESULT,
      success: false,
      message: (error as Error).message
    });
  }
}

function handleResize(width: number, height: number): void {
  const constrainedWidth = Math.max(UI_CONFIG.MIN_WIDTH, Math.min(width, 2000));
  const constrainedHeight = Math.max(UI_CONFIG.MIN_HEIGHT, Math.min(height, 1500));
  figma.ui.resize(constrainedWidth, constrainedHeight);
}

// Initialize the plugin
initializePlugin();