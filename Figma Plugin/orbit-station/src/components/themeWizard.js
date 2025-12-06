/**
 * Theme Creation Wizard
 *
 * 3-step wizard for creating new themes with auto-generation.
 * Integrates with existing autocomplete system from ui.html.
 *
 * Steps:
 * 1. Name + Template selection
 * 2. Color selection (core, alt, accent) with live preview
 * 3. Review + confirm
 *
 * @module themeWizard
 */

import { generateThemeColors, resolveColorToHex } from '../utils/colorVariantGenerator.js';
import { validateThemeName, isDuplicateTheme } from '../utils/themeValidator.js';

/**
 * ThemeWizard class
 * Manages the 3-step theme creation flow
 */
class ThemeWizard {
  constructor(themeStore, tokenData) {
    this.store = themeStore;
    this.tokenData = tokenData;
    this.currentStep = 1;
    this.wizardData = {
      name: '',
      template: 'clara',
      colors: {
        core: null,
        alt: null,
        accent: null
      }
    };
    this.generatedVariants = null;
    this.modalElement = null;
    this.resolveCallback = null;
    this.rejectCallback = null;
  }

  /**
   * Show the wizard modal
   * Returns a promise that resolves when theme is created or rejects on cancel
   *
   * @returns {Promise}
   */
  show() {
    return new Promise((resolve, reject) => {
      this.resolveCallback = resolve;
      this.rejectCallback = reject;
      this.currentStep = 1;
      this._createModal();
      this._renderStep();
    });
  }

  /**
   * Create the modal container
   * @private
   */
  _createModal() {
    // Remove existing modal if any
    const existing = document.getElementById('theme-wizard-modal');
    if (existing) {
      existing.remove();
    }

    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.id = 'theme-wizard-modal';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-dialog theme-wizard-dialog">
        <div class="modal-header">
          <h2 id="wizard-title">Create New Theme</h2>
          <div class="wizard-steps">
            <div class="wizard-step" data-step="1">
              <div class="step-number">1</div>
              <div class="step-label">Name</div>
            </div>
            <div class="wizard-step" data-step="2">
              <div class="step-number">2</div>
              <div class="step-label">Colors</div>
            </div>
            <div class="wizard-step" data-step="3">
              <div class="step-number">3</div>
              <div class="step-label">Review</div>
            </div>
          </div>
          <button class="icon-only" id="wizard-close">
            <svg width="16" height="16" viewBox="0 0 16 16">
              <path d="M3 3L13 13M13 3L3 13" stroke="currentColor" stroke-width="2"/>
            </svg>
          </button>
        </div>
        <div class="modal-body" id="wizard-body">
          <!-- Step content goes here -->
        </div>
        <div class="modal-footer" id="wizard-footer">
          <!-- Footer buttons go here -->
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    this.modalElement = overlay;

    // Close button handler
    document.getElementById('wizard-close').addEventListener('click', () => {
      this._cancel();
    });

    // Overlay click to close
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this._cancel();
      }
    });
  }

  /**
   * Render current step
   * @private
   */
  _renderStep() {
    // Update step indicators
    document.querySelectorAll('.wizard-step').forEach((el) => {
      const step = parseInt(el.dataset.step);
      el.classList.toggle('active', step === this.currentStep);
      el.classList.toggle('completed', step < this.currentStep);
    });

    // Render step content
    switch (this.currentStep) {
      case 1:
        this._renderStep1();
        break;
      case 2:
        this._renderStep2();
        break;
      case 3:
        this._renderStep3();
        break;
    }
  }

  /**
   * Step 1: Name + Template
   * @private
   */
  _renderStep1() {
    const body = document.getElementById('wizard-body');
    const footer = document.getElementById('wizard-footer');

    // Get available templates (existing themes)
    const themes = this.store.getThemes();

    body.innerHTML = `
      <div class="wizard-step-content">
        <div class="form-group">
          <label for="theme-name-input">Theme Name</label>
          <input
            type="text"
            id="theme-name-input"
            class="input"
            placeholder="e.g., mybrand"
            value="${this.wizardData.name}"
            autocomplete="off"
          />
          <div class="input-hint">Use only letters, numbers, hyphens, and underscores</div>
          <div id="theme-name-error" class="input-error" style="display: none;"></div>
        </div>

        <div class="form-group">
          <label for="theme-template-select">Copy from Template</label>
          <select id="theme-template-select" class="select">
            ${themes.map(t => `
              <option value="${t.id}" ${this.wizardData.template === t.id ? 'selected' : ''}>
                ${t.label}
              </option>
            `).join('')}
            <option value="none">Start Fresh (no template)</option>
          </select>
          <div class="input-hint">Non-color tokens will be copied from this theme</div>
        </div>
      </div>
    `;

    footer.innerHTML = `
      <button class="button secondary" id="wizard-cancel">Cancel</button>
      <button class="button primary" id="wizard-next">Next</button>
    `;

    // Event listeners
    const nameInput = document.getElementById('theme-name-input');
    const templateSelect = document.getElementById('theme-template-select');

    nameInput.addEventListener('input', (e) => {
      this.wizardData.name = e.target.value.trim().toLowerCase();
      this._validateStep1();
    });

    templateSelect.addEventListener('change', (e) => {
      this.wizardData.template = e.target.value;
    });

    document.getElementById('wizard-cancel').addEventListener('click', () => this._cancel());
    document.getElementById('wizard-next').addEventListener('click', () => {
      if (this._validateStep1()) {
        this.currentStep = 2;
        this._renderStep();
      }
    });

    // Auto-focus name input
    nameInput.focus();
  }

  /**
   * Validate step 1
   * @private
   */
  _validateStep1() {
    const errorEl = document.getElementById('theme-name-error');
    const nameInput = document.getElementById('theme-name-input');

    // Validate name
    const validation = validateThemeName(this.wizardData.name);

    if (!validation.isValid) {
      errorEl.textContent = validation.errors[0];
      errorEl.style.display = 'block';
      nameInput.classList.add('error');
      return false;
    }

    // Check for duplicates
    if (isDuplicateTheme(this.wizardData.name, this.tokenData)) {
      errorEl.textContent = 'Theme name already exists';
      errorEl.style.display = 'block';
      nameInput.classList.add('error');
      return false;
    }

    errorEl.style.display = 'none';
    nameInput.classList.remove('error');
    return true;
  }

  /**
   * Step 2: Color Selection with Live Preview
   * @private
   */
  _renderStep2() {
    const body = document.getElementById('wizard-body');
    const footer = document.getElementById('wizard-footer');

    body.innerHTML = `
      <div class="wizard-step-content">
        <div class="wizard-color-picker-section">
          <h3>Select Brand Colors</h3>
          <p class="section-description">Pick 3 main colors. Light, soft, dark, and faded variants will be auto-generated.</p>

          <div class="color-group">
            <label>Core (Primary Brand Color)</label>
            <input
              type="text"
              id="color-core-input"
              class="input color-input"
              placeholder="e.g., teal.80"
              value="${this.wizardData.colors.core || ''}"
              autocomplete="off"
            />
            <div id="core-variants-preview" class="variants-preview"></div>
          </div>

          <div class="color-group">
            <label>Alt (Secondary/Alternative Color)</label>
            <input
              type="text"
              id="color-alt-input"
              class="input color-input"
              placeholder="e.g., gray.700"
              value="${this.wizardData.colors.alt || ''}"
              autocomplete="off"
            />
            <div id="alt-variants-preview" class="variants-preview"></div>
          </div>

          <div class="color-group">
            <label>Accent (Highlight Color)</label>
            <input
              type="text"
              id="color-accent-input"
              class="input color-input"
              placeholder="e.g., coral.50"
              value="${this.wizardData.colors.accent || ''}"
              autocomplete="off"
            />
            <div id="accent-variants-preview" class="variants-preview"></div>
          </div>
        </div>
      </div>
    `;

    footer.innerHTML = `
      <button class="button secondary" id="wizard-back">Back</button>
      <button class="button primary" id="wizard-next" disabled>Next</button>
    `;

    // Setup autocomplete for each input (reuses existing system from ui.html)
    this._setupColorInput('color-core-input', 'core', 'core-variants-preview');
    this._setupColorInput('color-alt-input', 'alt', 'alt-variants-preview');
    this._setupColorInput('color-accent-input', 'accent', 'accent-variants-preview');

    document.getElementById('wizard-back').addEventListener('click', () => {
      this.currentStep = 1;
      this._renderStep();
    });

    document.getElementById('wizard-next').addEventListener('click', () => {
      if (this._validateStep2()) {
        this.currentStep = 3;
        this._renderStep();
      }
    });

    this._validateStep2();
  }

  /**
   * Setup color input with autocomplete integration
   * @private
   */
  _setupColorInput(inputId, colorType, previewId) {
    const input = document.getElementById(inputId);
    const previewEl = document.getElementById(previewId);

    // Integrate with existing showAutocomplete from ui.html
    input.addEventListener('focus', () => {
      if (typeof showAutocomplete === 'function') {
        showAutocomplete(input, buildColorAutocompleteOptions(), (selectedValue) => {
          this.wizardData.colors[colorType] = selectedValue;
          input.value = selectedValue;
          this._updateColorPreview(colorType, selectedValue, previewEl);
          this._validateStep2();
        });
      }
    });

    input.addEventListener('input', (e) => {
      this.wizardData.colors[colorType] = e.target.value;
      this._updateColorPreview(colorType, e.target.value, previewEl);
      this._validateStep2();
    });

    // Initial preview if value exists
    if (this.wizardData.colors[colorType]) {
      this._updateColorPreview(colorType, this.wizardData.colors[colorType], previewEl);
    }
  }

  /**
   * Update live preview of generated variants
   * @private
   */
  _updateColorPreview(colorType, colorRef, previewEl) {
    if (!colorRef) {
      previewEl.innerHTML = '';
      return;
    }

    // Generate variants
    const generated = generateThemeColors({ [colorType]: colorRef }, this.tokenData);

    if (!generated[colorType]) {
      previewEl.innerHTML = '<div class="preview-error">Invalid color reference</div>';
      return;
    }

    const { family, variants } = generated[colorType];

    // Build preview HTML
    const variantNames = Object.keys(variants);
    const previewHTML = variantNames.map(variantName => {
      const level = variants[variantName];
      const colorPath = `{colors.${family}.${level}}`;
      const hex = resolveColorToHex(colorPath, this.tokenData);

      return `
        <div class="variant-swatch">
          <div class="swatch" style="background: ${hex || '#ccc'}"></div>
          <div class="variant-label">
            <span class="variant-name">${variantName}</span>
            <span class="variant-value">${level}</span>
          </div>
        </div>
      `;
    }).join('');

    previewEl.innerHTML = `<div class="variants-grid">${previewHTML}</div>`;
  }

  /**
   * Validate step 2
   * @private
   */
  _validateStep2() {
    const nextBtn = document.getElementById('wizard-next');
    const allSelected = this.wizardData.colors.core &&
                       this.wizardData.colors.alt &&
                       this.wizardData.colors.accent;

    nextBtn.disabled = !allSelected;
    return allSelected;
  }

  /**
   * Step 3: Review + Confirm
   * @private
   */
  _renderStep3() {
    const body = document.getElementById('wizard-body');
    const footer = document.getElementById('wizard-footer');

    // Generate final color mapping
    this.generatedVariants = generateThemeColors(this.wizardData.colors, this.tokenData);

    body.innerHTML = `
      <div class="wizard-step-content">
        <h3>Review Theme</h3>
        <div class="review-section">
          <div class="review-item">
            <span class="review-label">Theme Name:</span>
            <span class="review-value">${this.wizardData.name}</span>
          </div>
          <div class="review-item">
            <span class="review-label">Template:</span>
            <span class="review-value">${this.wizardData.template}</span>
          </div>
        </div>

        <h4>Generated Color Mapping</h4>
        <div class="review-colors">
          ${this._renderColorReview('Core', this.generatedVariants.core)}
          ${this._renderColorReview('Alt', this.generatedVariants.alt)}
          ${this._renderColorReview('Accent', this.generatedVariants.accent)}
        </div>

        <div class="review-note">
          <svg width="16" height="16" fill="currentColor">
            <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm1 12H7V7h2v5zm0-6H7V4h2v2z"/>
          </svg>
          <p>All other semantic tokens will be copied from "${this.wizardData.template}" theme.</p>
        </div>
      </div>
    `;

    footer.innerHTML = `
      <button class="button secondary" id="wizard-back">Back</button>
      <button class="button primary" id="wizard-create">Create Theme</button>
    `;

    document.getElementById('wizard-back').addEventListener('click', () => {
      this.currentStep = 2;
      this._renderStep();
    });

    document.getElementById('wizard-create').addEventListener('click', () => {
      this._createTheme();
    });
  }

  /**
   * Render color review section
   * @private
   */
  _renderColorReview(groupName, colorGroup) {
    if (!colorGroup) return '';

    const { family, variants } = colorGroup;

    return `
      <div class="color-review-group">
        <div class="color-review-header">${groupName}</div>
        <div class="color-review-variants">
          ${Object.entries(variants).map(([variantName, level]) => {
            const colorPath = `{colors.${family}.${level}}`;
            const hex = resolveColorToHex(colorPath, this.tokenData);
            return `
              <div class="color-review-item">
                <div class="swatch" style="background: ${hex || '#ccc'}"></div>
                <div class="color-info">
                  <div class="color-name">${variantName}</div>
                  <div class="color-path">${family}.${level}</div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Create the theme
   * @private
   */
  _createTheme() {
    const success = this.store.createTheme(
      this.wizardData.name,
      this.wizardData.template,
      this.wizardData.colors
    );

    if (success) {
      this._close();
      if (this.resolveCallback) {
        this.resolveCallback(this.wizardData.name);
      }
    } else {
      // Error is already emitted by store
      // Could show inline error here
    }
  }

  /**
   * Cancel wizard
   * @private
   */
  _cancel() {
    this._close();
    if (this.rejectCallback) {
      this.rejectCallback(new Error('Wizard cancelled'));
    }
  }

  /**
   * Close and remove modal
   * @private
   */
  _close() {
    if (this.modalElement) {
      this.modalElement.remove();
      this.modalElement = null;
    }
  }
}

export default ThemeWizard;
