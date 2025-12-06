/**
 * Theme Store
 *
 * Centralized state management for Theme Builder.
 * Uses EventEmitter pattern for reactive UI updates.
 *
 * Responsibilities:
 * - Manage theme CRUD operations
 * - Track active theme selection
 * - Handle unsaved changes
 * - Emit events for UI synchronization
 * - Communicate with Figma plugin via bridge
 *
 * @module themeStore
 */

import { EventEmitter } from './eventEmitter.js';
import { generateThemeColors, buildColorReference } from './colorVariantGenerator.js';

/**
 * ThemeStore class
 * Singleton that manages all theme state
 */
class ThemeStore extends EventEmitter {
  constructor(tokenData, bridge) {
    super();

    this.tokenData = tokenData;
    this.bridge = bridge;
    this.activeTheme = null;
    this.unsavedChanges = false;
    this.originalTokenData = null; // For revert functionality

    // Store original state for revert
    this.saveSnapshot();
  }

  /**
   * Save a snapshot of current state for revert
   * @private
   */
  saveSnapshot() {
    this.originalTokenData = JSON.parse(JSON.stringify(this.tokenData));
  }

  /**
   * Get list of all available themes
   * Extracts theme names from semantic.brand.core.main.$value
   *
   * @returns {Array} - Array of theme objects { id, label }
   */
  getThemes() {
    const coreMain = this.tokenData?.semantic?.brand?.core?.main?.$value;

    if (!coreMain || typeof coreMain !== 'object') {
      return [];
    }

    return Object.keys(coreMain).map(id => ({
      id,
      label: id.charAt(0).toUpperCase() + id.slice(1)
    }));
  }

  /**
   * Get theme by ID
   *
   * @param {string} themeId - Theme ID
   * @returns {Object|null} - Theme object or null if not found
   */
  getTheme(themeId) {
    const themes = this.getThemes();
    return themes.find(t => t.id === themeId) || null;
  }

  /**
   * Check if theme exists
   *
   * @param {string} themeId - Theme ID
   * @returns {boolean}
   */
  themeExists(themeId) {
    return this.getTheme(themeId) !== null;
  }

  /**
   * Select a theme as active
   *
   * @param {string} themeId - Theme ID to select
   */
  selectTheme(themeId) {
    if (!this.themeExists(themeId)) {
      console.error(`[ThemeStore] Theme "${themeId}" not found`);
      return;
    }

    this.activeTheme = themeId;
    this.emit('theme:selected', { themeId });
  }

  /**
   * Get the currently active theme ID
   *
   * @returns {string|null}
   */
  getActiveTheme() {
    return this.activeTheme;
  }

  /**
   * Create a new theme
   *
   * @param {string} themeName - New theme name (lowercase, no spaces)
   * @param {string} templateTheme - Existing theme to copy from (default: 'clara')
   * @param {Object} baseColors - { core, alt, accent } color selections
   * @returns {boolean} - Success status
   */
  createTheme(themeName, templateTheme = 'clara', baseColors = {}) {
    // Validate theme name
    if (!themeName || typeof themeName !== 'string') {
      this.emit('error', { message: 'Invalid theme name' });
      return false;
    }

    const normalizedName = themeName.toLowerCase().trim();

    // Check for duplicates
    if (this.themeExists(normalizedName)) {
      this.emit('error', { message: `Theme "${normalizedName}" already exists` });
      return false;
    }

    // Validate template exists
    if (!this.themeExists(templateTheme)) {
      this.emit('error', { message: `Template theme "${templateTheme}" not found` });
      return false;
    }

    try {
      // Generate color variants
      const colorMapping = generateThemeColors(baseColors, this.tokenData);

      console.log('[ThemeStore] Generated color mapping:', colorMapping);

      // Add theme to all semantic tokens
      this._addThemeToSemanticTokens(normalizedName, templateTheme, colorMapping);

      // Mark as having unsaved changes
      this.unsavedChanges = true;

      // Emit success event
      this.emit('theme:created', {
        themeId: normalizedName,
        template: templateTheme,
        colors: colorMapping
      });

      // Auto-select new theme
      this.selectTheme(normalizedName);

      return true;
    } catch (error) {
      console.error('[ThemeStore] Error creating theme:', error);
      this.emit('error', { message: `Failed to create theme: ${error.message}` });
      return false;
    }
  }

  /**
   * Add theme to all semantic tokens
   * @private
   */
  _addThemeToSemanticTokens(themeName, templateTheme, colorMapping) {
    const semantic = this.tokenData.semantic;

    // 1. Apply generated color variants
    this._applyColorVariants(themeName, colorMapping);

    // 2. Copy all other semantic tokens from template
    this._copySemanticTokensFromTemplate(themeName, templateTheme);
  }

  /**
   * Apply generated color variants to semantic tokens
   * @private
   */
  _applyColorVariants(themeName, colorMapping) {
    const semantic = this.tokenData.semantic;

    // Apply CORE colors
    if (colorMapping.core) {
      const { family, variants } = colorMapping.core;

      ['main', 'light', 'soft', 'dark', 'faded'].forEach(variant => {
        if (variants[variant] !== undefined) {
          const path = semantic.brand.core[variant];
          if (!path) {
            semantic.brand.core[variant] = { $type: 'color', $value: {} };
          }
          if (!path.$value) {
            path.$value = {};
          }

          path.$value[themeName] = buildColorReference(family, variants[variant]);
        }
      });
    }

    // Apply ALT colors
    if (colorMapping.alt) {
      const { family, variants } = colorMapping.alt;

      ['main', 'soft', 'light', 'dark'].forEach(variant => {
        if (variants[variant] !== undefined) {
          if (!semantic.brand.alt[variant]) {
            semantic.brand.alt[variant] = { $type: 'color', $value: {} };
          }

          const path = semantic.brand.alt[variant];
          if (!path.$value) {
            path.$value = {};
          }

          path.$value[themeName] = buildColorReference(family, variants[variant]);
        }
      });
    }

    // Apply ACCENT colors
    if (colorMapping.accent) {
      const { family, variants } = colorMapping.accent;

      ['main', 'soft', 'light', 'dark'].forEach(variant => {
        if (variants[variant] !== undefined) {
          if (!semantic.brand.accent[variant]) {
            semantic.brand.accent[variant] = { $type: 'color', $value: {} };
          }

          const path = semantic.brand.accent[variant];
          if (!path.$value) {
            path.$value = {};
          }

          path.$value[themeName] = buildColorReference(family, variants[variant]);
        }
      });
    }
  }

  /**
   * Copy all semantic tokens from template theme
   * @private
   */
  _copySemanticTokensFromTemplate(themeName, templateTheme) {
    const semantic = this.tokenData.semantic;

    const traverseAndCopy = (obj) => {
      if (!obj || typeof obj !== 'object') return;

      // If this node has $value with template theme, copy it
      if (obj.$value && typeof obj.$value === 'object' && obj.$value[templateTheme]) {
        obj.$value[themeName] = obj.$value[templateTheme];
      }

      // Recurse on all children
      for (const key in obj) {
        if (!key.startsWith('$')) {
          traverseAndCopy(obj[key]);
        }
      }
    };

    traverseAndCopy(semantic);
  }

  /**
   * Clone an existing theme
   *
   * @param {string} sourceThemeId - Theme to clone
   * @param {string} newThemeName - Name for cloned theme
   * @returns {boolean} - Success status
   */
  cloneTheme(sourceThemeId, newThemeName) {
    if (!this.themeExists(sourceThemeId)) {
      this.emit('error', { message: `Source theme "${sourceThemeId}" not found` });
      return false;
    }

    const normalizedName = newThemeName.toLowerCase().trim();

    if (this.themeExists(normalizedName)) {
      this.emit('error', { message: `Theme "${normalizedName}" already exists` });
      return false;
    }

    try {
      // Simply copy all semantic token values from source to new theme
      this._copySemanticTokensFromTemplate(normalizedName, sourceThemeId);

      this.unsavedChanges = true;

      this.emit('theme:cloned', {
        sourceThemeId,
        newThemeId: normalizedName
      });

      this.selectTheme(normalizedName);

      return true;
    } catch (error) {
      console.error('[ThemeStore] Error cloning theme:', error);
      this.emit('error', { message: `Failed to clone theme: ${error.message}` });
      return false;
    }
  }

  /**
   * Delete a theme
   *
   * @param {string} themeId - Theme to delete
   * @returns {boolean} - Success status
   */
  deleteTheme(themeId) {
    // Prevent deleting 'clara' (base theme)
    if (themeId === 'clara') {
      this.emit('error', { message: 'Cannot delete CLARA theme (base theme)' });
      return false;
    }

    if (!this.themeExists(themeId)) {
      this.emit('error', { message: `Theme "${themeId}" not found` });
      return false;
    }

    try {
      const semantic = this.tokenData.semantic;

      // Remove theme from all semantic tokens recursively
      const removeThemeFromTokens = (obj) => {
        if (!obj || typeof obj !== 'object') return;

        if (obj.$value && typeof obj.$value === 'object') {
          delete obj.$value[themeId];
        }

        for (const key in obj) {
          if (!key.startsWith('$')) {
            removeThemeFromTokens(obj[key]);
          }
        }
      };

      removeThemeFromTokens(semantic);

      this.unsavedChanges = true;

      // If deleted theme was active, clear selection
      if (this.activeTheme === themeId) {
        this.activeTheme = null;
      }

      this.emit('theme:deleted', { themeId });

      return true;
    } catch (error) {
      console.error('[ThemeStore] Error deleting theme:', error);
      this.emit('error', { message: `Failed to delete theme: ${error.message}` });
      return false;
    }
  }

  /**
   * Edit a color value in a theme
   *
   * @param {string} themeId - Theme to edit
   * @param {string} tokenPath - Path like 'brand.core.main'
   * @param {string} colorValue - New color value (e.g., '{colors.teal.80}')
   */
  editThemeColor(themeId, tokenPath, colorValue) {
    if (!this.themeExists(themeId)) {
      this.emit('error', { message: `Theme "${themeId}" not found` });
      return;
    }

    try {
      // Navigate to token path
      const parts = tokenPath.split('.');
      let current = this.tokenData.semantic;

      for (const part of parts) {
        if (!current[part]) {
          throw new Error(`Invalid token path: ${tokenPath}`);
        }
        current = current[part];
      }

      // Update value
      if (!current.$value) {
        current.$value = {};
      }

      current.$value[themeId] = colorValue;

      this.unsavedChanges = true;

      this.emit('color:changed', {
        themeId,
        tokenPath,
        colorValue
      });
    } catch (error) {
      console.error('[ThemeStore] Error editing color:', error);
      this.emit('error', { message: `Failed to edit color: ${error.message}` });
    }
  }

  /**
   * Discard all unsaved changes
   * Reverts to last saved snapshot
   */
  discardChanges() {
    if (!this.unsavedChanges) {
      return;
    }

    // Restore original data
    this.tokenData = JSON.parse(JSON.stringify(this.originalTokenData));
    this.unsavedChanges = false;

    this.emit('changes:discarded');
  }

  /**
   * Save changes to Figma
   * Sends updated token data via bridge
   */
  async saveChanges() {
    if (!this.unsavedChanges) {
      this.emit('info', { message: 'No changes to save' });
      return;
    }

    try {
      // Send to Figma plugin
      await this.bridge.postMessage('save-tokens', {
        tokens: this.tokenData
      });

      // Update snapshot
      this.saveSnapshot();
      this.unsavedChanges = false;

      this.emit('changes:saved');
    } catch (error) {
      console.error('[ThemeStore] Error saving changes:', error);
      this.emit('error', { message: `Failed to save changes: ${error.message}` });
    }
  }

  /**
   * Check if there are unsaved changes
   *
   * @returns {boolean}
   */
  hasUnsavedChanges() {
    return this.unsavedChanges;
  }

  /**
   * Get token data for export
   *
   * @returns {Object} - Full token tree
   */
  getTokenData() {
    return this.tokenData;
  }
}

export default ThemeStore;
