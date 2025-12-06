# Utility Scripts - Clara Tokens Plugin

> Documentation of utility scripts and helper functions

[⬅️ Core Classes](03-core-classes.md) | [Index](../README.md) | [➡️ Test Scripts](05-test-scripts.md)

---

## 📋 Table of Contents

- [Overview](#overview)
- [colorVariantGenerator.js](#colorvariantgeneratorjs)
- [themeValidator.js](#themevalidatorjs)
- [themeStore.js](#themestorejs)
- [Color & Validation Utils](#color--validation-utils)
- [Other Utilities](#other-utilities)

---

## Overview

Utility scripts provide support functionality for the plugin.

**Path:** `/Figma Plugin/clara plugin/src/utils/`

| Script | Type | Function | Lines |
|--------|------|----------|-------|
| `colorVariantGenerator.js` | ES6 Module | Generate color variants | ~300 |
| `themeValidator.js` | ES6 Module | Validate themes | ~250 |
| `themeStore.js` | Class | Theme state management | ~200 |
| `colorUtils.ts` | TypeScript | Color conversions | ~150 |
| `validationUtils.ts` | TypeScript | Generic validations | ~120 |
| `batchProcessor.ts` | TypeScript | Batch processing | ~100 |
| `logger.ts` | TypeScript | Structured logging | ~80 |
| `lruCache.ts` | TypeScript | LRU cache | ~150 |

---

## colorVariantGenerator.js

> Automatic color variant generation for themes

**File:** `src/utils/colorVariantGenerator.js`

### Main functions

#### generateCoreVariants()

Generates variants for brand.core:

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

**Example:**

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

---

## themeValidator.js

> Theme integrity and completeness validation

**File:** `src/utils/themeValidator.js`

### Main functions

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

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
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
```

### validationUtils.ts

```typescript
function isValidTokenName(name: string): boolean {
  return /^[a-zA-Z][a-zA-Z0-9\-_]*$/.test(name);
}
```

---

## Other Utilities

### batchProcessor.ts

```typescript
async function processBatch<T>(
  items: T[],
  processor: (item: T) => Promise<void>,
  options: BatchOptions = {}
): Promise<void> {
  // Batch processing implementation
}
```

### lruCache.ts

```typescript
class LRUCache<K, V> {
  get(key: K): V | undefined { /* ... */ }
  set(key: K, value: V, ttl?: number): void { /* ... */ }
}
```

---

**Last updated:** 2025-01-16 | [⬅️ Core Classes](03-core-classes.md) | [➡️ Test Scripts](05-test-scripts.md)
