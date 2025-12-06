# Classi Core - Clara Tokens Plugin

> Documentazione delle classi fondamentali del plugin

[⬅️ Script Principali](02-main-scripts.md) | [Indice](../README.md) | [➡️ Utility Scripts](04-utility-scripts.md)

---

## 📋 Indice

- [Overview](#overview)
- [TokenProcessor](#tokenprocessor)
- [VariableManager](#variablemanager)
- [LibraryManager](#librarymanager)
- [ProductionErrorHandler](#productionerrorhandler)
- [VariableExporter](#variableexporter)
- [TextStyleExtractor](#textstyleextractor)
- [AdvancedAliasResolver](#advancedaliasresolver)
- [ImportPreview](#importpreview)
- [SimpleProgressLoader](#simpleprogressloader)

---

## Overview

Le classi core sono il cuore del plugin Clara Tokens. Tutte sono definite inline in `main-figma.ts` o come moduli separati in `src/classes/`.

**Percorso:** `/Figma Plugin/clara plugin/src/classes/`

| Classe | Responsabilità | Linee | Complessità |
|--------|----------------|-------|-------------|
| `TokenProcessor` | Process import/export token | ~400 | Alta |
| `VariableManager` | Gestione variabili Figma | ~350 | Alta |
| `LibraryManager` | Team Libraries support | ~250 | Media |
| `ProductionErrorHandler` | Error handling | ~150 | Bassa |
| `VariableExporter` | Export JSON/CSS | ~300 | Media |
| `TextStyleExtractor` | Extract text styles | ~200 | Media |
| `AdvancedAliasResolver` | Risoluzione alias complessi | ~250 | Alta |
| `ImportPreview` | Anteprima import | ~180 | Media |
| `SimpleProgressLoader` | Progress indicators | ~100 | Bassa |

---

## TokenProcessor

> Classe per processamento e normalizzazione token

**File:** `src/classes/TokenProcessor.ts` (modulare) o inline in `main-figma.ts`

### Responsabilità

1. **Rilevamento formato token**
   - W3C Design Tokens format
   - Token Studio format
   - Custom formats

2. **Normalizzazione**
   - Conversione a formato standard W3C
   - Flatten nested structures
   - Type inference

3. **Processamento ricorsivo**
   - Parse token tree
   - Risoluzione alias
   - Raggruppamento per collection

### Metodi principali

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

#### normalizeFormat()

```typescript
private normalizeFormat(
  jsonData: any,
  format: TokenFormat
): NormalizedData {
  switch (format) {
    case 'TOKEN_STUDIO':
      return this.convertTokenStudioToW3C(jsonData);

    case 'W3C':
      return jsonData; // Already normalized

    default:
      throw new Error(`Unknown format: ${format}`);
  }
}
```

#### processRecursive()

```typescript
private processRecursive(
  data: any,
  path: string = ''
): ProcessedToken[] {
  const tokens: ProcessedToken[] = [];

  for (const [key, value] of Object.entries(data)) {
    const currentPath = path ? `${path}.${key}` : key;

    // Is token?
    if (value.$value !== undefined) {
      tokens.push({
        name: key,
        path: currentPath,
        type: value.$type || this.inferType(value.$value),
        value: value.$value,
        description: value.$description
      });
    }
    // Is group?
    else if (typeof value === 'object') {
      const nested = this.processRecursive(value, currentPath);
      tokens.push(...nested);
    }
  }

  return tokens;
}
```

#### resolveAliases()

```typescript
private resolveAliases(tokens: ProcessedToken[]): ProcessedToken[] {
  // Build path → token map
  const tokenMap = new Map();
  tokens.forEach(t => tokenMap.set(t.path, t));

  // Resolve references
  tokens.forEach(token => {
    if (this.isReference(token.value)) {
      const targetPath = this.extractPath(token.value);
      const target = tokenMap.get(targetPath);

      if (target) {
        token.resolvedValue = target.value;
        token.aliasTarget = targetPath;
      } else {
        console.warn(`Cannot resolve: ${targetPath}`);
      }
    }
  });

  return tokens;
}
```

### Utilizzo

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

### Come estendere

**Aggiungere supporto nuovo formato:**

```typescript
// 1. Aggiungi detection
private detectFormat(jsonData: any): TokenFormat {
  // ... existing

  if (jsonData.customFormatMarker) {
    return 'CUSTOM_FORMAT';
  }
}

// 2. Aggiungi conversione
private normalizeFormat(jsonData: any, format: TokenFormat) {
  switch (format) {
    // ... existing

    case 'CUSTOM_FORMAT':
      return this.convertCustomToW3C(jsonData);
  }
}

// 3. Implementa conversione
private convertCustomToW3C(data: any): NormalizedData {
  return {
    // Logica conversione
  };
}
```

---

## VariableManager

> Gestione creazione e aggiornamento variabili Figma

**File:** `src/classes/VariableManager.ts`

### Responsabilità

1. **CRUD variabili Figma**
2. **Gestione collections e modes**
3. **Assegnazione scopes intelligente**
4. **Type conversion token → Figma**

### Metodi principali

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

#### getOrCreateCollection()

```typescript
async getOrCreateCollection(
  name: string,
  overwrite: boolean = false
): Promise<VariableCollection> {
  // Find existing
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const existing = collections.find(c => c.name === name);

  if (existing) {
    if (overwrite) {
      // Clear variables
      for (const varId of existing.variableIds) {
        const variable = await figma.variables.getVariableByIdAsync(varId);
        if (variable) await variable.remove();
      }
    }
    return existing;
  }

  // Create new
  return figma.variables.createVariableCollection(name);
}
```

#### createOrUpdateVariable()

```typescript
async createOrUpdateVariable(
  token: ProcessedToken,
  collection: VariableCollection,
  mode: Mode
): Promise<Variable> {
  // Find existing
  let variable = this.findVariableByName(token.name, collection);

  // Create if not exists
  if (!variable) {
    const figmaType = this.convertTypeToFigma(token.type);
    variable = figma.variables.createVariable(
      token.name,
      collection,
      figmaType
    );
  }

  // Assign scopes
  this.assignVariableScopes(variable, token.type, token.path);

  // Set value
  const figmaValue = this.convertValueToFigma(token.value, token.type);
  variable.setValueForMode(mode.modeId, figmaValue);

  return variable;
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

### Utilizzo

```typescript
const manager = new VariableManager();

const result = await manager.importTokensAsVariables(
  processedCollections,
  {
    overwriteExisting: true,
    skipInvalid: false,
    createMissingCollections: true
  }
);

console.log(`Created: ${result.created}, Updated: ${result.updated}`);
```

---

## LibraryManager

> Gestione Figma Team Libraries

**File:** `src/classes/LibraryManager.ts`

### Responsabilità

1. **Discovery librerie disponibili**
2. **Accesso variabili da librerie esterne**
3. **Cache variabili remote (TTL: 5min)**
4. **Import cross-library**

### Metodi principali

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

#### getVariablesFromLibrary()

```typescript
async getVariablesFromLibrary(
  collectionKey: string
): Promise<Variable[]> {
  // Check cache
  const cached = this.cache.get(collectionKey);
  if (cached && !this.isCacheExpired(cached)) {
    return cached.variables;
  }

  // Fetch from library
  const variables = await figma.teamLibrary
    .getVariablesInLibraryCollectionAsync(collectionKey);

  // Cache
  this.cache.set(collectionKey, {
    variables,
    timestamp: Date.now()
  });

  return variables;
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

### Cache management

```typescript
private cache = new Map<string, CachedLibrary>();
private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

private isCacheExpired(cached: CachedLibrary): boolean {
  return Date.now() - cached.timestamp > this.CACHE_TTL;
}

clearCache(): void {
  this.cache.clear();
}
```

---

## ProductionErrorHandler

> Gestione centralizzata errori

**File:** `src/classes/ProductionErrorHandler.ts`

### Responsabilità

1. **Categorizzazione errori**
2. **Logging strutturato**
3. **User-friendly messages**
4. **Retry logic**

### Metodi principali

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

static categorizeError(error: any): ErrorCategory {
  const msg = error.message?.toLowerCase() || '';

  if (msg.includes('figma') || msg.includes('variable')) {
    return 'figma_api';
  }
  if (msg.includes('permission') || msg.includes('access')) {
    return 'permission';
  }
  if (msg.includes('network') || msg.includes('fetch')) {
    return 'network';
  }
  if (msg.includes('parse') || msg.includes('json')) {
    return 'token_processing';
  }

  return 'unknown';
}
```

---

## Altre Classi

### VariableExporter
- Export variabili → JSON (W3C format)
- Export CSS/SCSS
- Gestione alias nell'export

### TextStyleExtractor
- Estrazione text styles locali
- Conversione in typography tokens

### AdvancedAliasResolver
- Risoluzione alias multi-livello
- Gestione dipendenze circolari
- Cross-collection references

### ImportPreview
- Simulazione import
- Diff view (creato/modificato)
- Conflict detection

### SimpleProgressLoader
- Progress reporting
- Messaggi contestuali
- Cancellazione operazioni

---

## Link Utili

- [📖 Script Principali](02-main-scripts.md) - Entry points
- [📖 Utility Scripts](04-utility-scripts.md) - Helper functions
- [📖 Workflow Guide](99-workflow-guide.md) - Processo sviluppo

---

**Ultima modifica:** 2025-01-16 | [⬅️ Script Principali](02-main-scripts.md) | [➡️ Utility Scripts](04-utility-scripts.md)
