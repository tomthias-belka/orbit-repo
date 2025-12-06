# Utility Scripts - Clara Tokens Plugin

> Documentazione script di utilità e helper functions

[⬅️ Classi Core](03-core-classes.md) | [Indice](../README.md) | [➡️ Test Scripts](05-test-scripts.md)

---

## 📋 Indice

- [Overview](#overview)
- [colorVariantGenerator.js](#colorvariantgeneratorjs)
- [themeValidator.js](#themevalidatorjs)
- [themeStore.js](#themestorejs)
- [Color & Validation Utils](#color--validation-utils)
- [Altri Utilities](#altri-utilities)

---

## Overview

Gli utility scripts forniscono funzionalità di supporto per il plugin.

**Percorso:** `/Figma Plugin/clara plugin/src/utils/`

| Script | Tipo | Funzione | Linee |
|--------|------|----------|-------|
| `colorVariantGenerator.js` | ES6 Module | Genera varianti colore | ~300 |
| `themeValidator.js` | ES6 Module | Valida temi | ~250 |
| `themeStore.js` | Class | State management temi | ~200 |
| `colorUtils.ts` | TypeScript | Conversioni colore | ~150 |
| `validationUtils.ts` | TypeScript | Validazioni generiche | ~120 |
| `batchProcessor.ts` | TypeScript | Batch processing | ~100 |
| `logger.ts` | TypeScript | Logging strutturato | ~80 |
| `lruCache.ts` | TypeScript | LRU cache | ~150 |

---

## colorVariantGenerator.js

> Generazione automatica varianti colore per temi

**File:** `src/utils/colorVariantGenerator.js`

### Funzioni principali

#### generateCoreVariants()

Genera varianti per brand.core:

```javascript
function generateCoreVariants(baseColorRef, tokenData) {
  const { family, level } = parseColorReference(baseColorRef);
  const steps = getAvailableSteps(family, tokenData);

  return {
    main: baseColorRef,
    light: buildColorReference(family, findNearestStep(steps, level - 50)),
    soft: buildColorReference(family, findNearestStep(steps, level - 75)),
    dark: buildColorReference(family, findNearestStep(steps, level + 330)),
    faded: buildColorReference(family, findNearestStep(steps, level - 40))
  };
}
```

**Esempio:**

```javascript
const variants = generateCoreVariants('{colors.teal.500}', tokenData);

// Output:
// {
//   main: '{colors.teal.500}',
//   light: '{colors.teal.400}',
//   soft: '{colors.teal.300}',
//   dark: '{colors.teal.900}',
//   faded: '{colors.teal.450}'
// }
```

#### generateThemeColors()

Genera tutti i colori per un tema completo:

```javascript
function generateThemeColors(selections, tokenData) {
  const { core, alt, accent } = selections;

  return {
    'brand.core': generateCoreVariants(core, tokenData),
    'brand.alt': generateAltVariants(alt, tokenData),
    'brand.accent': generateAccentVariants(accent, tokenData)
  };
}
```

#### resolveColorToHex()

Risolve reference → valore HEX:

```javascript
function resolveColorToHex(colorRef, tokenData) {
  const path = extractPathFromReference(colorRef);
  const parts = path.split('.');

  let current = tokenData;
  for (const part of parts) {
    current = current[part];
    if (!current) return null;
  }

  return current.$value; // "#00aec7"
}
```

### Utilizzo

```javascript
import {
  generateCoreVariants,
  generateThemeColors,
  resolveColorToHex
} from './colorVariantGenerator.js';

// Genera varianti core
const coreVariants = generateCoreVariants('{colors.blue.500}', tokens);

// Genera tema completo
const theme = generateThemeColors({
  core: '{colors.blue.500}',
  alt: '{colors.orange.400}',
  accent: '{colors.green.300}'
}, tokens);

// Risolvi colore
const hex = resolveColorToHex('{colors.blue.500}', tokens);
console.log(hex); // "#007acc"
```

---

## themeValidator.js

> Validazione integrità e completezza temi

**File:** `src/utils/themeValidator.js`

### Funzioni principali

#### validateThemeName()

```javascript
function validateThemeName(themeName) {
  const errors = [];
  const warnings = [];

  // Length check
  if (themeName.length < 2 || themeName.length > 50) {
    errors.push('Theme name must be 2-50 characters');
  }

  // Pattern check
  if (!/^[a-z0-9\-_]+$/.test(themeName)) {
    errors.push('Theme name can only contain lowercase, numbers, hyphens, underscores');
  }

  // Reserved names
  if (['default', 'null', 'undefined'].includes(themeName)) {
    errors.push(`"${themeName}" is a reserved name`);
  }

  // Warnings
  if (themeName.includes(' ')) {
    warnings.push('Spaces will be converted to hyphens');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
```

#### validateTheme()

```javascript
function validateTheme(themeName, tokenData) {
  const errors = [];
  const warnings = [];

  // Check theme exists
  const themeData = tokenData?.semantic?.brand?.core?.main?.$value?.[themeName];

  if (!themeData) {
    errors.push(`Theme "${themeName}" not found`);
    return { isValid: false, errors, warnings };
  }

  // Validate core colors (required)
  const requiredCoreColors = ['main', 'light', 'soft', 'dark', 'faded'];
  for (const color of requiredCoreColors) {
    const colorPath = `semantic.brand.core.${color}.$value.${themeName}`;
    if (!getValueByPath(tokenData, colorPath)) {
      errors.push(`Missing core.${color} for theme "${themeName}"`);
    }
  }

  // Validate alt colors (warning if missing)
  const altColors = ['main', 'soft', 'light', 'dark'];
  for (const color of altColors) {
    const colorPath = `semantic.brand.alt.${color}.$value.${themeName}`;
    if (!getValueByPath(tokenData, colorPath)) {
      warnings.push(`Missing alt.${color} for theme "${themeName}"`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
```

### Utilizzo

```javascript
import { validateThemeName, validateTheme } from './themeValidator.js';

// Valida nome
const nameResult = validateThemeName('my-custom-theme');
if (!nameResult.isValid) {
  console.error('Invalid name:', nameResult.errors);
}

// Valida tema
const themeResult = validateTheme('clara', tokenData);
if (!themeResult.isValid) {
  console.error('Invalid theme:', themeResult.errors);
}
```

---

## themeStore.js

> State management per Theme Builder

**File:** `src/utils/themeStore.js`

### Classe ThemeStore

```javascript
class ThemeStore extends EventEmitter {
  constructor() {
    super();
    this.tokenData = null;
    this.bridge = null;
    this.activeTheme = null;
    this.unsavedChanges = false;
    this.originalTokenData = null;
  }

  // Get themes list
  getThemes() {
    const themesData = this.tokenData?.semantic?.brand?.core?.main?.$value;
    if (!themesData) return [];

    return Object.keys(themesData).map(id => ({
      id,
      label: id.charAt(0).toUpperCase() + id.slice(1)
    }));
  }

  // Create new theme
  async createTheme(themeName, colorSelections) {
    const variants = generateThemeColors(colorSelections, this.tokenData);

    // Update tokenData
    this.applyThemeVariants(themeName, variants);

    this.unsavedChanges = true;
    this.emit('theme-created', { themeName, variants });

    return { success: true };
  }

  // Update existing theme
  async updateTheme(themeName, updates) {
    this.applyThemeUpdates(themeName, updates);

    this.unsavedChanges = true;
    this.emit('theme-updated', { themeName, updates });

    return { success: true };
  }

  // Delete theme
  async deleteTheme(themeName) {
    this.removeThemeFromAllVariables(themeName);

    this.unsavedChanges = true;
    this.emit('theme-deleted', { themeName });

    return { success: true };
  }

  // Save changes
  async save() {
    if (!this.bridge) {
      throw new Error('Bridge not initialized');
    }

    await this.bridge.sendToPlugin('SAVE_TOKENS', {
      tokenData: this.tokenData
    });

    this.originalTokenData = JSON.parse(JSON.stringify(this.tokenData));
    this.unsavedChanges = false;

    this.emit('saved');

    return { success: true };
  }

  // Revert changes
  revertChanges() {
    if (this.originalTokenData) {
      this.tokenData = JSON.parse(JSON.stringify(this.originalTokenData));
      this.unsavedChanges = false;
      this.emit('changes-reverted');
    }
  }
}
```

### Utilizzo

```javascript
import { ThemeStore } from './themeStore.js';

const store = new ThemeStore();

// Initialize
store.tokenData = loadTokenData();
store.bridge = figmaAPIBridge;

// Listen to events
store.on('theme-created', ({ themeName }) => {
  console.log('Theme created:', themeName);
});

// Create theme
await store.createTheme('custom-theme', {
  core: '{colors.blue.500}',
  alt: '{colors.orange.400}',
  accent: '{colors.green.300}'
});

// Save
await store.save();
```

---

## Color & Validation Utils

### colorUtils.ts

```typescript
// HEX → RGB (0-1 normalized)
function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  } : null;
}

// RGB → HEX
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.round(n * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Auto-detect format
function parseColorValue(value: string): ColorValue {
  if (value.startsWith('#')) {
    return { type: 'hex', value: hexToRgb(value) };
  }
  if (value.startsWith('rgb')) {
    return { type: 'rgb', value: parseRgb(value) };
  }
  if (value.startsWith('hsl')) {
    return { type: 'hsl', value: parseHsl(value) };
  }
  throw new Error(`Unknown color format: ${value}`);
}
```

### validationUtils.ts

```typescript
function isValidTokenName(name: string): boolean {
  return /^[a-zA-Z][a-zA-Z0-9\-_]*$/.test(name);
}

function isValidPath(path: string): boolean {
  return /^[a-zA-Z0-9\-_.]+$/.test(path);
}

function validateTokenType(type: string): boolean {
  const validTypes = [
    'color', 'dimension', 'fontFamily', 'fontWeight',
    'duration', 'cubicBezier', 'number', 'string', 'boolean'
  ];
  return validTypes.includes(type);
}

function validateTokenValue(value: any, type: string): ValidationResult {
  switch (type) {
    case 'color':
      return validateColorValue(value);
    case 'dimension':
      return validateDimensionValue(value);
    case 'number':
      return typeof value === 'number' ? { valid: true } : { valid: false, error: 'Not a number' };
    default:
      return { valid: true }; // Permissive for unknown types
  }
}
```

---

## Altri Utilities

### batchProcessor.ts

```typescript
async function processBatch<T>(
  items: T[],
  processor: (item: T) => Promise<void>,
  options: BatchOptions = {}
): Promise<void> {
  const {
    batchSize = 50,
    concurrency = 1,
    onProgress = () => {},
    onError = () => {}
  } = options;

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    await Promise.all(
      batch.map(async item => {
        try {
          await processor(item);
        } catch (error) {
          onError(error, item);
        }
      })
    );

    const progress = Math.round(((i + batch.length) / items.length) * 100);
    onProgress(progress);

    // Yield to not block UI
    await new Promise(resolve => setTimeout(resolve, 0));
  }
}
```

### logger.ts

```typescript
class Logger {
  private static level: LogLevel = 'INFO';

  static debug(message: string, metadata?: any): void {
    if (this.shouldLog('DEBUG')) {
      console.log(`[DEBUG] ${message}`, metadata);
    }
  }

  static info(message: string, metadata?: any): void {
    if (this.shouldLog('INFO')) {
      console.info(`[INFO] ${message}`, metadata);
    }
  }

  static error(message: string, metadata?: any): void {
    console.error(`[ERROR] ${message}`, metadata);
  }

  private static shouldLog(level: LogLevel): boolean {
    const levels = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }
}
```

### lruCache.ts

```typescript
class LRUCache<K, V> {
  private cache = new Map<K, CacheEntry<V>>();
  private capacity: number;
  private defaultTTL: number;

  constructor(capacity: number = 100, defaultTTL?: number) {
    this.capacity = capacity;
    this.defaultTTL = defaultTTL || Infinity;
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key);

    if (!entry) return undefined;

    // Check expiration
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return undefined;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  set(key: K, value: V, ttl?: number): void {
    // Remove if exists
    this.cache.delete(key);

    // Evict oldest if at capacity
    if (this.cache.size >= this.capacity) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    // Add new entry
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });
  }

  private isExpired(entry: CacheEntry<V>): boolean {
    if (entry.ttl === Infinity) return false;
    return Date.now() - entry.timestamp > entry.ttl;
  }
}
```

---

## Link Utili

- [📖 Classi Core](03-core-classes.md) - Classi principali
- [📖 Test Scripts](05-test-scripts.md) - Testing utilities
- [📖 Workflow Guide](99-workflow-guide.md) - Guida sviluppo

---

**Ultima modifica:** 2025-01-16 | [⬅️ Classi Core](03-core-classes.md) | [➡️ Test Scripts](05-test-scripts.md)
