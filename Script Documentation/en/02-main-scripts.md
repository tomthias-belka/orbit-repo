# Main Scripts - Clara Tokens Plugin

> Documentation of entry points and import system

[⬅️ NPM Scripts](01-npm-scripts.md) | [Index](../README.md) | [➡️ Core Classes](03-core-classes.md)

---

## 📋 Table of Contents

- [Overview](#overview)
- [main-figma.ts](#main-figmats)
- [main.ts](#maints)
- [simple-import.ts](#simple-importts)
- [Message Handler Architecture](#message-handler-architecture)
- [Two-Step Alias System](#two-step-alias-system)
- [How to Modify](#how-to-modify)

---

## Overview

The Clara Tokens plugin has three main scripts that handle plugin logic:

| File | Type | Status | Size | Usage |
|------|------|--------|------|-------|
| `main-figma.ts` | Consolidated entry point | ✅ Active | ~5000 lines | Production version |
| `main.ts` | Modular entry point | 🔄 Backup | ~800 lines | Version with imports |
| `simple-import.ts` | Import system | ✅ Active | ~600 lines | Simplified token import |

**Base path:** `/Figma Plugin/clara plugin/src/`

### Two-Version Architecture

The project maintains **two versions of the entry point**:

1. **`main-figma.ts`** (CURRENTLY USED)
   - All classes and utilities inline in the file
   - No `import` statements
   - Simpler build (zero runtime dependencies)
   - Very large single file

2. **`main.ts`** (MODULAR VERSION)
   - Uses `import` for classes and utilities
   - More organized and maintainable code
   - Build requires bundler
   - Currently in backup

**Entry point configured in `tsconfig.json`:**
```json
{
  "include": ["src/main-figma.ts"]
}
```

---

## main-figma.ts

> Consolidated entry point - production version

**Path:** `/Figma Plugin/clara plugin/src/main-figma.ts`
**Size:** ~175KB (compiled)
**Lines:** ~5000

### What it does

`main-figma.ts` is the **heart of the plugin**. It contains:

1. **All classes inline**
   - `TokenProcessor`
   - `VariableManager`
   - `LibraryManager`
   - `ProductionErrorHandler`
   - Other core classes

2. **UI ↔ Plugin messaging system**
   - Handlers for all UI messages
   - Bidirectional communication

3. **Import/export logic**
   - JSON import (W3C and Token Studio formats)
   - JSON, CSS export
   - Figma variables management

4. **Team Libraries support**
   - External libraries navigation
   - Cross-library import

### File structure

```typescript
// ============================================
// TYPES & INTERFACES
// ============================================

interface ProcessedToken { /* ... */ }
interface TokenCollection { /* ... */ }
// ... 20+ more interfaces

// ============================================
// CONSTANTS
// ============================================

const PLUGIN_NAME = 'Clara Tokens';
const MESSAGE_TYPES = { /* ... */ };
// ... other constants

// ============================================
// CLASSES (INLINE)
// ============================================

class ProductionErrorHandler {
  // Centralized error handling
}

class TokenProcessor {
  // Token processing
}

class VariableManager {
  // Figma variables management
}

class LibraryManager {
  // Team Libraries management
}

// ... 5-10 more classes

// ============================================
// UTILITY FUNCTIONS
// ============================================

function parseColorValue(value: string) { /* ... */ }
function assignScopes(variable, type, path) { /* ... */ }
// ... 30+ more utilities

// ============================================
// MAIN PLUGIN LOGIC
// ============================================

async function initializePlugin() {
  // Plugin initialization
}

// Central message handler
figma.ui.onmessage = async (msg) => {
  // UI message handling
};

// ============================================
// STARTUP
// ============================================

initializePlugin();
figma.showUI(__html__, { width: 980, height: 700 });
```

### Handled messages

The plugin responds to these UI messages:

| Message Type | Handler | Description |
|--------------|---------|-------------|
| `UI_READY` | `handleUIReady()` | UI initialization |
| `GET_COLLECTIONS` | `handleGetCollections()` | Load collections |
| `IMPORT_JSON` | `handleImportJson()` | Import JSON tokens |
| `EXPORT_JSON_ADVANCED` | `handleExportJsonAdvanced()` | Export JSON |
| `EXPORT_CSS` | `handleExportCss()` | Export CSS |
| `BROWSE_LIBRARY` | `handleBrowseLibrary()` | Browse libraries |
| `IMPORT_FROM_LIBRARY` | `handleImportFromLibrary()` | Import from library |
| `RENAME_COLLECTION` | `handleRenameCollection()` | Rename collection |
| `DELETE_COLLECTION` | `handleDeleteCollection()` | Delete collection |
| `CLEAR_COLLECTION` | `handleClearCollection()` | Clear collection |

### JSON Import Flow

```
UI sends IMPORT_JSON
  ↓
handleImportJson()
  ↓
TokenProcessor.processTokensForImport()
  ├─ Detect format (W3C vs Token Studio)
  ├─ Normalize structure
  ├─ Recursive token tree parse
  └─ Group by collection
  ↓
VariableManager.importTokensAsVariables()
  ├─ Create/get collections
  ├─ STEP 1: Create variables (aliases marked, not resolved)
  ├─ STEP 2: Resolve aliases (when all variables exist)
  └─ Assign scopes intelligently
  ↓
Send response to UI (success/error)
```

### How to modify

#### Add new token type

**1. Add interface:**

```typescript
// In TYPES section
interface CustomToken {
  $value: string;
  $type: 'custom';
  customProperty?: string;
}
```

**2. Extend parser:**

```typescript
// In TokenProcessor class
processTokenValue(token: any): ProcessedToken {
  // ... existing logic

  if (token.$type === 'custom') {
    return {
      name: token.name,
      type: 'STRING', // Map to Figma type
      value: token.$value,
      customProperty: token.customProperty
    };
  }
}
```

**3. Handle in VariableManager:**

```typescript
// In VariableManager class
createOrUpdateVariable(token: ProcessedToken, collection, mode) {
  // ... existing logic

  if (token.type === 'STRING' && token.customProperty) {
    // Special logic for custom token
  }
}
```

---

## main.ts

> Modular entry point - version with imports

**Path:** `/Figma Plugin/clara plugin/src/main.ts`
**Size:** ~30KB (compiled)
**Lines:** ~800
**Status:** 🔄 Backup (not currently used)

### Differences with main-figma.ts

| Feature | main.ts | main-figma.ts |
|---------|---------|---------------|
| **Structure** | Modular with imports | All inline |
| **Maintainability** | ⭐⭐⭐⭐⭐ High | ⭐⭐⭐ Medium |
| **Build complexity** | Requires bundler | Direct TypeScript build |
| **File size** | ~30KB | ~175KB |
| **Debugging** | ⭐⭐⭐⭐ Easy | ⭐⭐⭐ Medium |
| **Production** | No (requires setup) | ✅ Yes |

### Structure

```typescript
// ============================================
// IMPORTS
// ============================================

import { ProductionErrorHandler } from './classes/ProductionErrorHandler';
import { TokenProcessor } from './classes/TokenProcessor';
import { VariableManager } from './classes/VariableManager';
import { LibraryManager } from './classes/LibraryManager';

import { MESSAGE_TYPES, PLUGIN_NAME } from './constants';
import type { ProcessedToken, TokenCollection } from './types';

// ============================================
// HANDLERS (using imported classes)
// ============================================

async function handleImportJson(jsonData: any, options: any) {
  const processor = new TokenProcessor();
  const varManager = new VariableManager();

  const processed = await processor.processTokensForImport(jsonData, options);
  const result = await varManager.importTokensAsVariables(
    processed.collections,
    options
  );

  return result;
}

// ... other handlers

// ============================================
// MESSAGE HANDLER
// ============================================

figma.ui.onmessage = async (msg) => {
  switch (msg.type) {
    case MESSAGE_TYPES.IMPORT_JSON:
      const result = await handleImportJson(msg.payload.jsonData, msg.payload.options);
      figma.ui.postMessage({
        type: MESSAGE_TYPES.IMPORT_JSON_RESPONSE,
        payload: result
      });
      break;
    // ... other cases
  }
};

// ============================================
// INIT
// ============================================

initializePlugin();
figma.showUI(__html__, { width: 980, height: 700 });
```

---

## simple-import.ts

> Simplified import system with two-step aliases

**Path:** `/Figma Plugin/clara plugin/src/simple-import.ts`
**Size:** ~25KB (compiled)
**Lines:** ~600

### What it does

`simple-import.ts` provides the "simplified" import system for JSON tokens. It's "simplified" because:

- ❌ Doesn't use complex classes
- ✅ Standalone functions
- ✅ Linear and sequential logic
- ✅ Easier to debug

### Two-Step Alias System

**Problem:** If you create a variable with an alias before the target exists, Figma throws an error.

**Solution:** Two separate steps:

```
STEP 1: CREATE VARIABLES
├─ Create all variables
├─ If value is reference: mark as "pending alias"
├─ Use temporary value (e.g., #000000 for colors)
└─ Register in pendingAliases array

STEP 2: RESOLVE ALIASES
├─ All variables now exist
├─ For each pending alias:
│  ├─ Find target variable by path
│  ├─ Create VariableAlias object
│  └─ Assign with setValueForMode()
└─ Aliases fully resolved
```

### Key functions

```typescript
async function simpleImportVariables(
  jsonData: any,
  options: SimpleImportOptions = {}
) {
  const pendingAliases: PendingAlias[] = [];

  // STEP 1: Create all variables
  for (const [collectionName, collectionData] of Object.entries(jsonData)) {
    const collection = await getOrCreateCollection(collectionName);
    await processCollectionSimple(
      collectionData,
      collection,
      '',
      pendingAliases
    );
  }

  // STEP 2: Resolve aliases
  await resolvePendingAliases(pendingAliases);

  return { success: true, variableCount: totalVars };
}
```

### Smart Collection Routing

```typescript
function resolveCollectionFromAlias(aliasPath: string): string {
  // Pattern: {colors.*} → "global"
  if (aliasPath.match(/^{?colors\./)) {
    return 'global';
  }

  // Pattern: {spacing.*} → "global"
  if (aliasPath.match(/^{?spacing\./)) {
    return 'global';
  }

  // Pattern: {brand.*} → "semantic"
  if (aliasPath.match(/^{?brand\./)) {
    return 'semantic';
  }

  // Default: same collection
  return 'current';
}
```

---

## Message Handler Architecture

### Request/Response Pattern

All messages follow this pattern:

```typescript
// UI → Plugin
{
  type: 'ACTION_NAME',
  payload: {
    // request data
  }
}

// Plugin → UI
{
  type: 'ACTION_NAME_RESPONSE',
  payload: {
    success: boolean,
    data?: any,
    error?: string
  }
}
```

---

## Two-Step Alias System

### Why two steps?

**Problem:**

```typescript
// Token A references Token B
{
  "colorA": { "$value": "{colorB}", "$type": "color" },
  "colorB": { "$value": "#ff0000", "$type": "color" }
}

// If processed in order:
// 1. Create colorA variable with alias to colorB
//    ❌ ERROR: colorB doesn't exist yet!
```

**Solution:**

```typescript
// STEP 1: Create ALL variables
// - colorA: temporary value #000000
// - colorB: value #ff0000

// STEP 2: Now colorB exists, resolve alias
// - colorA: alias → colorB ✅
```

### Detailed implementation

#### STEP 1: Creation

```typescript
const pendingAliases: PendingAlias[] = [];

function createVariable(token) {
  const variable = figma.variables.createVariable(...);

  if (isReference(token.$value)) {
    // Mark as pending alias
    pendingAliases.push({
      variable: variable,
      modeId: currentModeId,
      targetPath: extractPath(token.$value)
    });

    // Temporary value (placeholder)
    const tempValue = getTemporaryValue(token.$type);
    variable.setValueForMode(currentModeId, tempValue);

  } else {
    // Direct value
    variable.setValueForMode(currentModeId, token.$value);
  }
}
```

#### STEP 2: Resolution

```typescript
async function resolvePendingAliases(pendingAliases) {
  // Build cache: path → variable
  const cache = {};
  const allVariables = await figma.variables.getLocalVariablesAsync();

  for (const variable of allVariables) {
    const path = buildPathForVariable(variable);
    cache[path] = variable;
  }

  // Resolve each alias
  for (const pending of pendingAliases) {
    const targetVar = cache[pending.targetPath];

    if (targetVar) {
      const alias = {
        type: 'VARIABLE_ALIAS',
        id: targetVar.id
      };
      pending.variable.setValueForMode(pending.modeId, alias);
    }
  }
}
```

---

## How to Modify

### Add support for new token format

**1. Add detection in TokenProcessor:**

```typescript
function detectTokenFormat(jsonData: any): string {
  // Existing: W3C, Token Studio

  // New format detection
  if (jsonData.$schema === 'https://example.com/tokens.schema.json') {
    return 'CUSTOM_FORMAT';
  }

  return 'W3C'; // default
}
```

**2. Add conversion:**

```typescript
function normalizeTokenFormat(jsonData: any): any {
  const format = detectTokenFormat(jsonData);

  switch (format) {
    case 'CUSTOM_FORMAT':
      return convertCustomFormatToW3C(jsonData);

    case 'TOKEN_STUDIO':
      return convertTokenStudioToW3C(jsonData);

    default:
      return jsonData; // already W3C
  }
}
```

### Modify scope assignment

```typescript
function assignSimpleScopes(variable, tokenType, path) {
  const scopes = [];

  // Existing scopes...

  // New: Background colors (custom logic)
  if (tokenType === 'color' && path.includes('background')) {
    scopes.push('FRAME_FILL', 'SHAPE_FILL');
    // NOT text fill
  }

  variable.scopes = scopes;
}
```

---

## Useful Links

- [📖 NPM Scripts](01-npm-scripts.md) - Build and development commands
- [📖 Core Classes](03-core-classes.md) - Class details
- [📖 Workflow Guide](99-workflow-guide.md) - Complete development process
- [🔗 Figma Plugin API](https://www.figma.com/plugin-docs/)
- [🔗 W3C Design Tokens](https://design-tokens.github.io/community-group/format/)

---

**Last updated:** 2025-01-16 | [⬅️ NPM Scripts](01-npm-scripts.md) | [➡️ Core Classes](03-core-classes.md)
