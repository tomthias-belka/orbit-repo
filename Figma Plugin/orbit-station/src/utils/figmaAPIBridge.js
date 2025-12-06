/**
 * Figma API Bridge
 *
 * Encapsulates communication between UI (iframe) and plugin code (main thread).
 * Provides a clean interface for postMessage communication without direct
 * dependency on Figma's global objects.
 *
 * Benefits:
 * - Easy to mock for testing
 * - Centralized error handling
 * - Type-safe message passing
 * - Decouples business logic from Figma API
 *
 * @module figmaAPIBridge
 */

/**
 * FigmaAPIBridge class
 * Singleton that handles all plugin ↔ UI communication
 */
class FigmaAPIBridge {
  constructor() {
    this.messageHandlers = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize the bridge and start listening for messages
   * Should be called once when UI loads
   */
  initialize() {
    if (this.isInitialized) {
      console.warn('[FigmaAPIBridge] Already initialized');
      return;
    }

    window.addEventListener('message', this._handleMessage.bind(this));
    this.isInitialized = true;

    console.log('[FigmaAPIBridge] Initialized');
  }

  /**
   * Internal message handler
   * Routes messages to registered handlers
   *
   * @private
   */
  _handleMessage(event) {
    const message = event.data?.pluginMessage;

    if (!message) {
      // Not a plugin message, ignore
      return;
    }

    const { type, payload } = message;

    if (!type) {
      console.warn('[FigmaAPIBridge] Received message without type:', message);
      return;
    }

    // Call registered handler for this message type
    const handler = this.messageHandlers.get(type);

    if (handler) {
      try {
        handler(payload);
      } catch (error) {
        console.error(`[FigmaAPIBridge] Error handling message type "${type}":`, error);
      }
    } else {
      console.debug(`[FigmaAPIBridge] No handler registered for message type "${type}"`);
    }
  }

  /**
   * Register a handler for a specific message type
   *
   * @param {string} type - Message type to listen for
   * @param {Function} handler - Handler function (receives payload)
   *
   * @example
   * bridge.on('theme:created', (payload) => {
   *   console.log('Theme created:', payload.name);
   * });
   */
  on(type, handler) {
    if (typeof handler !== 'function') {
      throw new Error(`Handler for "${type}" must be a function`);
    }

    this.messageHandlers.set(type, handler);
  }

  /**
   * Unregister a handler for a specific message type
   *
   * @param {string} type - Message type to stop listening for
   */
  off(type) {
    this.messageHandlers.delete(type);
  }

  /**
   * Send a message to the plugin code (main thread)
   *
   * @param {string} type - Message type
   * @param {*} payload - Message payload (will be cloned)
   *
   * @example
   * bridge.postMessage('save-tokens', { tokens: updatedTokens });
   */
  postMessage(type, payload = null) {
    if (!type) {
      throw new Error('Message type is required');
    }

    try {
      parent.postMessage(
        {
          pluginMessage: {
            type,
            payload
          }
        },
        '*'
      );

      console.debug(`[FigmaAPIBridge] Sent message: ${type}`, payload);
    } catch (error) {
      console.error(`[FigmaAPIBridge] Error sending message "${type}":`, error);
      throw error;
    }
  }

  /**
   * Send a message and wait for a response
   * Uses a request/response pattern with unique IDs
   *
   * @param {string} type - Message type
   * @param {*} payload - Message payload
   * @param {number} timeout - Timeout in milliseconds (default: 5000)
   * @returns {Promise} - Resolves with response payload, rejects on timeout
   *
   * @example
   * const result = await bridge.request('validate-theme', { themeName: 'mybrand' });
   */
  request(type, payload = null, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const requestId = `${type}_${Date.now()}_${Math.random()}`;
      const responseType = `${type}:response`;

      // Set up timeout
      const timeoutId = setTimeout(() => {
        this.off(responseType);
        reject(new Error(`Request "${type}" timed out after ${timeout}ms`));
      }, timeout);

      // Register one-time response handler
      this.on(responseType, (responsePayload) => {
        clearTimeout(timeoutId);
        this.off(responseType);

        if (responsePayload.error) {
          reject(new Error(responsePayload.error));
        } else {
          resolve(responsePayload);
        }
      });

      // Send request
      this.postMessage(type, {
        ...payload,
        _requestId: requestId
      });
    });
  }

  /**
   * Destroy the bridge and clean up listeners
   * Useful for testing or unmounting
   */
  destroy() {
    window.removeEventListener('message', this._handleMessage);
    this.messageHandlers.clear();
    this.isInitialized = false;

    console.log('[FigmaAPIBridge] Destroyed');
  }
}

// Export singleton instance
const bridge = new FigmaAPIBridge();

export default bridge;

/**
 * Export class for testing purposes
 */
export { FigmaAPIBridge };
