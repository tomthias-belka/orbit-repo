/**
 * Simple EventEmitter implementation
 *
 * Lightweight pub/sub pattern for state change notifications.
 * Similar to Node.js EventEmitter but simplified for browser use.
 *
 * @module eventEmitter
 */

export class EventEmitter {
  constructor() {
    this.events = {};
  }

  /**
   * Register an event listener
   *
   * @param {string} event - Event name
   * @param {Function} listener - Callback function
   * @returns {Function} - Unsubscribe function
   *
   * @example
   * const unsubscribe = emitter.on('change', (data) => console.log(data));
   * unsubscribe(); // Remove listener
   */
  on(event, listener) {
    if (!this.events[event]) {
      this.events[event] = [];
    }

    this.events[event].push(listener);

    // Return unsubscribe function
    return () => this.off(event, listener);
  }

  /**
   * Register a one-time event listener
   * Automatically removes itself after first call
   *
   * @param {string} event - Event name
   * @param {Function} listener - Callback function
   */
  once(event, listener) {
    const onceWrapper = (...args) => {
      listener(...args);
      this.off(event, onceWrapper);
    };

    this.on(event, onceWrapper);
  }

  /**
   * Remove an event listener
   *
   * @param {string} event - Event name
   * @param {Function} listener - Callback function to remove
   */
  off(event, listener) {
    if (!this.events[event]) {
      return;
    }

    this.events[event] = this.events[event].filter(l => l !== listener);
  }

  /**
   * Remove all listeners for an event (or all events if no event specified)
   *
   * @param {string} [event] - Event name (optional)
   */
  removeAllListeners(event) {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
  }

  /**
   * Emit an event with data
   *
   * @param {string} event - Event name
   * @param {...*} args - Arguments to pass to listeners
   */
  emit(event, ...args) {
    if (!this.events[event]) {
      return;
    }

    this.events[event].forEach(listener => {
      try {
        listener(...args);
      } catch (error) {
        console.error(`Error in event listener for "${event}":`, error);
      }
    });
  }

  /**
   * Get count of listeners for an event
   *
   * @param {string} event - Event name
   * @returns {number} - Number of listeners
   */
  listenerCount(event) {
    return this.events[event]?.length || 0;
  }
}
