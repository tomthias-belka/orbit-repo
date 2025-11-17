# Core Classes - Clara Tokens Plugin

> Documentation of the plugin's fundamental classes

[⬅️ Main Scripts](02-main-scripts.md) | [Index](../README.md) | [➡️ Utility Scripts](04-utility-scripts.md)

---

## 📋 Table of Contents

- [Overview](#overview)
- [TokenProcessor](#tokenprocessor)
- [VariableManager](#variablemanager)
- [LibraryManager](#librarymanager)
- [ProductionErrorHandler](#productionerrorhandler)
- [Other Classes](#other-classes)

---

## Overview

Core classes are the heart of Clara Tokens plugin. All are defined inline in `main-figma.ts` or as separate modules in `src/classes/`.

**Path:** `/Figma Plugin/clara plugin/src/classes/`

| Class | Responsibility | Lines | Complexity |
|-------|----------------|-------|------------|
| `TokenProcessor` | Process import/export tokens | ~400 | High |
| `VariableManager` | Manage Figma variables | ~350 | High |
| `LibraryManager` | Team Libraries support | ~250 | Medium |
| `ProductionErrorHandler` | Error handling | ~150 | Low |
| `VariableExporter` | Export JSON/CSS | ~300 | Medium |
| `TextStyleExtractor` | Extract text styles | ~200 | Medium |
| `AdvancedAliasResolver` | Complex alias resolution | ~250 | High |
| `ImportPreview` | Import preview | ~180 | Medium |
| `SimpleProgressLoader` | Progress indicators | ~100 | Low |

---

## TokenProcessor

> Class for token processing and normalization

**File:** `src/classes/TokenProcessor.ts` (modular) or inline in `main-figma.ts`

### Responsibilities

1. **Token format detection**
   - W3C Design Tokens format
   - Token Studio format
   - Custom formats

2. **Normalization**
   - Conversion to standard W3C format
   - Flatten nested structures
   - Type inference

3. **Recursive processing**
   - Parse token tree
   - Resolve aliases
   - Group by collection

### Main methods

#### processTokensForImport()

```typescript
async processTokensForImport(
  jsonData: any,
  options: ProcessingOptions
): Promise<ProcessingResult> {
  // 1. Detect format
  const format = this.detectFormat(jsonData);

  // 2. Normalize to W3C
  const normalized = this.normalizeFormat(jsonData, format);

  // 3. Process recursively
  const tokens = this.processRecursive(normalized);

  // 4. Resolve aliases
  const resolved = this.resolveAliases(tokens);

  // 5. Group by collection
  const collections = this.groupByCollection(resolved);

  return {
    success: true,
    tokens,
    collections,
    aliasCount: this.aliasCount
  };
}
```

#### detectFormat()

```typescript
private detectFormat(jsonData: any): TokenFormat {
  // Token Studio markers
  if (jsonData.$themes || jsonData.$metadata) {
    return 'TOKEN_STUDIO';
  }

  // W3C markers
  if (this.hasW3CTokens(jsonData)) {
    return 'W3C';
  }

  // Fallback
  return 'UNKNOWN';
}
```

### Usage

```typescript
const processor = new TokenProcessor();

const result = await processor.processTokensForImport(jsonData, {
  skipInvalid: true,
  inferTypes: true,
  validateReferences: true
});

if (result.success) {
  console.log(`Processed ${result.tokens.length} tokens`);
  console.log(`Found ${result.aliasCount} aliases`);
}
```

---

## VariableManager

> Manage creation and update of Figma variables

**File:** `src/classes/VariableManager.ts`

### Responsibilities

1. **CRUD Figma variables**
2. **Collections and modes management**
3. **Smart scope assignment**
4. **Type conversion token → Figma**

### Main methods

#### importTokensAsVariables()

```typescript
async importTokensAsVariables(
  tokenCollections: TokenCollection[],
  options: ImportOptions
): Promise<ImportResult> {
  let totalCreated = 0;
  let totalUpdated = 0;

  for (const tokenCol of tokenCollections) {
    // Get or create collection
    const collection = await this.getOrCreateCollection(
      tokenCol.name,
      options.overwriteExisting
    );

    // Import tokens
    const result = await this.importTokensToCollection(
      tokenCol.tokens,
      collection,
      options
    );

    totalCreated += result.created;
    totalUpdated += result.updated;
  }

  return {
    success: true,
    created: totalCreated,
    updated: totalUpdated
  };
}
```

#### assignVariableScopes()

```typescript
private assignVariableScopes(
  variable: Variable,
  tokenType: string,
  path: string
): void {
  const scopes: VariableScope[] = [];

  switch (tokenType) {
    case 'color':
      scopes.push('ALL_FILLS', 'ALL_STROKES', 'FRAME_FILL', 'SHAPE_FILL');

      if (path.includes('text')) {
        scopes.push('TEXT_FILL');
      }
      if (path.includes('border') || path.includes('stroke')) {
        scopes.push('STROKE_COLOR');
      }
      break;

    case 'spacing':
    case 'dimension':
      scopes.push('GAP', 'WIDTH_HEIGHT');
      if (path.includes('radius')) {
        scopes.push('CORNER_RADIUS');
      }
      break;

    case 'fontFamily':
    case 'string':
      scopes.push('TEXT_CONTENT', 'FONT_FAMILY');
      break;

    case 'number':
      scopes.push('WIDTH_HEIGHT', 'GAP', 'OPACITY');
      break;
  }

  if (scopes.length > 0) {
    variable.scopes = scopes;
  }
}
```

---

## LibraryManager

> Manage Figma Team Libraries

**File:** `src/classes/LibraryManager.ts`

### Responsibilities

1. **Discover available libraries**
2. **Access variables from external libraries**
3. **Cache remote variables (TTL: 5min)**
4. **Cross-library import**

### Main methods

#### discoverAvailableLibraries()

```typescript
async discoverAvailableLibraries(): Promise<LibraryInfo[]> {
  const collections = await figma.teamLibrary
    .getAvailableLibraryVariableCollectionsAsync();

  return collections.map(col => ({
    key: col.key,
    name: col.name,
    libraryName: col.libraryName,
    variableCount: 0 // Populated on demand
  }));
}
```

#### importVariablesFromLibrary()

```typescript
async importVariablesFromLibrary(
  collectionKey: string,
  variableKeys: string[],
  options: ImportOptions
): Promise<ImportResult> {
  const remoteVars = await this.getVariablesFromLibrary(collectionKey);
  const toImport = remoteVars.filter(v => variableKeys.includes(v.key));

  // Create local collection
  const localCollection = await this.createLocalCollection(
    options.targetCollectionName
  );

  // Import each variable
  let created = 0;
  for (const remoteVar of toImport) {
    await this.cloneVariable(remoteVar, localCollection);
    created++;
  }

  return { success: true, created };
}
```

---

## ProductionErrorHandler

> Centralized error handling

**File:** `src/classes/ProductionErrorHandler.ts`

### Main methods

```typescript
static handleError(
  error: any,
  context: string,
  metadata?: any
): ErrorResult {
  // Categorize
  const category = this.categorizeError(error);

  // Log
  console.error(`[${category}] ${context}:`, error, metadata);

  // User message
  const message = this.getUserMessage(error, context);

  // Send to UI
  figma.ui.postMessage({
    type: 'ERROR',
    payload: { message, category, context }
  });

  return {
    success: false,
    error: message,
    category
  };
}
```

---

## Other Classes

### VariableExporter
- Export variables → JSON (W3C format)
- Export CSS/SCSS
- Handle aliases in export

### TextStyleExtractor
- Extract local text styles
- Convert to typography tokens

### AdvancedAliasResolver
- Multi-level alias resolution
- Circular dependency handling
- Cross-collection references

### ImportPreview
- Simulate import
- Diff view (created/modified)
- Conflict detection

### SimpleProgressLoader
- Progress reporting
- Contextual messages
- Operation cancellation

---

## Useful Links

- [📖 Main Scripts](02-main-scripts.md) - Entry points
- [📖 Utility Scripts](04-utility-scripts.md) - Helper functions
- [📖 Workflow Guide](99-workflow-guide.md) - Development process

---

**Last updated:** 2025-01-16 | [⬅️ Main Scripts](02-main-scripts.md) | [➡️ Utility Scripts](04-utility-scripts.md)
