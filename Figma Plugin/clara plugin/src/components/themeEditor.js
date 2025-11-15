/**
 * Theme Editor
 *
 * UI for editing existing themes.
 * Shows only the mappings for the active theme.
 * Provides live preview and save/revert functionality.
 *
 * @module themeEditor
 */

import { resolveColorToHex, parseColorReference, buildColorReference, generateVariants } from '../utils/colorVariantGenerator.js';

/**
 * ThemeEditor class
 * Manages editing UI for selected theme
 */
class ThemeEditor {
  constructor(themeStore, tokenData, containerElement) {
    this.store = themeStore;
    this.tokenData = tokenData;
    this.container = containerElement;
    this.activeTheme = null;

    // Listen for theme selection changes
    this.store.on('theme:selected', ({ themeId }) => {
      this.activeTheme = themeId;
      this.render();
    });

    // Listen for color changes to update preview
    this.store.on('color:changed', () => {
      this.render();
    });
  }

  /**
   * Render the editor UI
   */
  render() {
    if (!this.activeTheme) {
      this._renderEmptyState();
      return;
    }

    const theme = this.store.getTheme(this.activeTheme);

    if (!theme) {
      this._renderEmptyState();
      return;
    }

    this._renderEditor(theme);
  }

  /**
   * Render empty state (no theme selected)
   * @private
   */
  _renderEmptyState() {
    this.container.innerHTML = `
      <div class="editor-empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
        </svg>
        <p>Select a theme to edit</p>
      </div>
    `;
  }

  /**
   * Render editor for selected theme
   * @private
   */
  _renderEditor(theme) {
    const semantic = this.tokenData.semantic;

    // Extract theme colors
    const brandColors = this._extractBrandColors(theme.id, semantic);

    this.container.innerHTML = `
      <div class="theme-editor">
        <!-- Header -->
        <div class="editor-header">
          <div class="editor-title">
            <h2>Editing: ${theme.label}</h2>
            ${this.store.hasUnsavedChanges() ? '<span class="unsaved-indicator">• Unsaved Changes</span>' : ''}
          </div>
          <div class="editor-actions">
            <button class="button secondary small" id="regenerate-btn" title="Regenerate all variants from main colors">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M13.65 2.35A8 8 0 102.35 13.65L1 15h5v-5L4.5 11.5A6 6 0 1111.5 4.5l1.5-1.5A8 8 0 0013.65 2.35z"/>
              </svg>
              Regenerate Tints
            </button>
            <button class="button secondary small" id="discard-btn" ${this.store.hasUnsavedChanges() ? '' : 'disabled'}>
              Discard Changes
            </button>
            <button class="button primary small" id="save-btn" ${this.store.hasUnsavedChanges() ? '' : 'disabled'}>
              Save Changes
            </button>
          </div>
        </div>

        <!-- Brand Colors Section -->
        <div class="editor-section">
          <h3>Brand Colors</h3>

          <!-- Core Colors -->
          <div class="color-mapping-group">
            <h4>Core (Primary)</h4>
            ${this._renderColorMapping('brand.core', brandColors.core, theme.id)}
          </div>

          <!-- Alt Colors -->
          <div class="color-mapping-group">
            <h4>Alt (Secondary)</h4>
            ${this._renderColorMapping('brand.alt', brandColors.alt, theme.id)}
          </div>

          <!-- Accent Colors -->
          <div class="color-mapping-group">
            <h4>Accent (Highlight)</h4>
            ${this._renderColorMapping('brand.accent', brandColors.accent, theme.id)}
          </div>
        </div>

        <!-- Component Preview -->
        <div class="editor-section">
          <h3>Component Preview</h3>
          ${this._renderComponentPreview(brandColors)}
        </div>
      </div>
    `;

    // Setup event listeners
    this._setupEventListeners(theme.id);
  }

  /**
   * Extract brand colors for theme
   * @private
   */
  _extractBrandColors(themeId, semantic) {
    const extract = (basePath) => {
      const result = {};
      const node = this._getNestedValue(semantic, basePath.split('.'));

      if (!node) return result;

      for (const variant in node) {
        const value = node[variant]?.$value?.[themeId];
        if (value) {
          result[variant] = {
            path: `${basePath}.${variant}`,
            value,
            hex: resolveColorToHex(value, this.tokenData)
          };
        }
      }

      return result;
    };

    return {
      core: extract('brand.core'),
      alt: extract('brand.alt'),
      accent: extract('brand.accent')
    };
  }

  /**
   * Get nested value from object by path
   * @private
   */
  _getNestedValue(obj, path) {
    return path.reduce((current, key) => current?.[key], obj);
  }

  /**
   * Render color mapping rows
   * @private
   */
  _renderColorMapping(groupPath, colors, themeId) {
    if (!colors || Object.keys(colors).length === 0) {
      return '<p class="empty-state">No colors defined</p>';
    }

    return `
      <div class="color-mapping-rows">
        ${Object.entries(colors).map(([variant, data]) => {
          const parsed = parseColorReference(data.value);
          const family = parsed ? parsed.family : 'unknown';
          const level = parsed ? parsed.level : '?';

          return `
            <div class="color-mapping-row" data-path="${data.path}">
              <div class="mapping-info">
                <div class="mapping-swatch" style="background: ${data.hex || '#ccc'}"></div>
                <div class="mapping-label">
                  <div class="variant-name">${variant}</div>
                  <div class="variant-path">${family}.${level}</div>
                </div>
              </div>
              <div class="mapping-actions">
                <input
                  type="text"
                  class="input small color-edit-input"
                  value="${data.value}"
                  data-theme="${themeId}"
                  data-path="${data.path}"
                  placeholder="{colors.family.level}"
                />
                <button class="button secondary icon-only small edit-color-btn" title="Pick color">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M0 12.5V16h3.5l10.3-10.3-3.5-3.5L0 12.5zm16-11.5c-.4-.4-1-.4-1.4 0l-1.6 1.6 3.5 3.5 1.6-1.6c.4-.4.4-1 0-1.4l-2.1-2.1z"/>
                  </svg>
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  /**
   * Render component preview
   * @private
   */
  _renderComponentPreview(brandColors) {
    const coreMain = brandColors.core?.main?.hex || '#1068f6';
    const coreSoft = brandColors.core?.soft?.hex || '#e3f2fd';
    const accentMain = brandColors.accent?.main?.hex || '#ff6b6b';
    const altMain = brandColors.alt?.main?.hex || '#616161';

    return `
      <div class="component-preview-grid">
        <!-- Button Preview -->
        <div class="preview-item">
          <div class="preview-label">Primary Button</div>
          <button class="preview-button" style="background: ${coreMain}; color: white;">
            Accedi
          </button>
        </div>

        <!-- Card Preview -->
        <div class="preview-item">
          <div class="preview-label">Card</div>
          <div class="preview-card" style="background: ${coreSoft}; border-color: ${altMain};">
            <div class="card-icon" style="background: ${accentMain};"></div>
          </div>
        </div>

        <!-- Badge Preview -->
        <div class="preview-item">
          <div class="preview-label">Badge</div>
          <div class="preview-badge" style="background: ${accentMain}; color: white;">
            New
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Setup event listeners
   * @private
   */
  _setupEventListeners(themeId) {
    // Save button
    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        this.store.saveChanges();
      });
    }

    // Discard button
    const discardBtn = document.getElementById('discard-btn');
    if (discardBtn) {
      discardBtn.addEventListener('click', () => {
        if (confirm('Discard all unsaved changes?')) {
          this.store.discardChanges();
          this.render();
        }
      });
    }

    // Regenerate button
    const regenerateBtn = document.getElementById('regenerate-btn');
    if (regenerateBtn) {
      regenerateBtn.addEventListener('click', () => {
        this._regenerateTints(themeId);
      });
    }

    // Color edit inputs
    const colorInputs = document.querySelectorAll('.color-edit-input');
    colorInputs.forEach(input => {
      input.addEventListener('blur', (e) => {
        const newValue = e.target.value.trim();
        const path = e.target.dataset.path;

        if (newValue && this._validateColorRef(newValue)) {
          this.store.editThemeColor(themeId, path, newValue);
        }
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.target.blur();
        }
      });
    });

    // Edit color buttons (open autocomplete)
    const editBtns = document.querySelectorAll('.edit-color-btn');
    editBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const row = e.target.closest('.color-mapping-row');
        const input = row.querySelector('.color-edit-input');

        if (typeof showAutocomplete === 'function') {
          showAutocomplete(input, buildColorAutocompleteOptions(), (selectedValue) => {
            input.value = selectedValue;
            const path = input.dataset.path;
            this.store.editThemeColor(themeId, path, selectedValue);
          });
        }
      });
    });
  }

  /**
   * Validate color reference format
   * @private
   */
  _validateColorRef(ref) {
    return parseColorReference(ref) !== null;
  }

  /**
   * Regenerate all tints from main colors
   * @private
   */
  _regenerateTints(themeId) {
    if (!confirm('Regenerate all color variants from main colors? This will overwrite existing values.')) {
      return;
    }

    const semantic = this.tokenData.semantic;

    // Get current main colors
    const coreMain = semantic.brand?.core?.main?.$value?.[themeId];
    const altMain = semantic.brand?.alt?.main?.$value?.[themeId];
    const accentMain = semantic.brand?.accent?.main?.$value?.[themeId];

    if (!coreMain || !altMain || !accentMain) {
      alert('Cannot regenerate: main colors not found');
      return;
    }

    // Generate variants
    const coreVariants = generateVariants(coreMain, 'core', this.tokenData);
    const altVariants = generateVariants(altMain, 'alt', this.tokenData);
    const accentVariants = generateVariants(accentMain, 'accent', this.tokenData);

    // Apply to store
    if (coreVariants) {
      Object.entries(coreVariants.variants).forEach(([variant, level]) => {
        if (variant !== 'main') {
          const path = `brand.core.${variant}`;
          const value = buildColorReference(coreVariants.family, level);
          this.store.editThemeColor(themeId, path, value);
        }
      });
    }

    if (altVariants) {
      Object.entries(altVariants.variants).forEach(([variant, level]) => {
        if (variant !== 'main') {
          const path = `brand.alt.${variant}`;
          const value = buildColorReference(altVariants.family, level);
          this.store.editThemeColor(themeId, path, value);
        }
      });
    }

    if (accentVariants) {
      Object.entries(accentVariants.variants).forEach(([variant, level]) => {
        if (variant !== 'main') {
          const path = `brand.accent.${variant}`;
          const value = buildColorReference(accentVariants.family, level);
          this.store.editThemeColor(themeId, path, value);
        }
      });
    }

    this.render();
  }
}

export default ThemeEditor;
