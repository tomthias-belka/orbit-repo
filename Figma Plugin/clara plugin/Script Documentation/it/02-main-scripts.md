# Script Principali - Clara Tokens Plugin

> Documentazione degli entry point e del sistema di import del plugin

[⬅️ NPM Scripts](01-npm-scripts.md) | [Indice](../README.md) | [➡️ Classi Core](03-core-classes.md)

---

## 📋 Indice

- [Overview](#overview)
- [main-figma.ts](#main-figmats)
- [main.ts](#maints)
- [simple-import.ts](#simple-importts)
- [Architettura Message Handler](#architettura-message-handler)
- [Sistema Alias a Due Passaggi](#sistema-alias-a-due-passaggi)
- [Come Modificare](#come-modificare)

---

## Overview

Il plugin Clara Tokens ha tre script principali che gestiscono la logica del plugin:

| File | Tipo | Stato | Dimensione | Uso |
|------|------|-------|-----------|-----|
| `main-figma.ts` | Entry point consolidato | ✅ Attivo | ~5000 linee | Versione produzione |
| `main.ts` | Entry point modulare | 🔄 Backup | ~800 linee | Versione con import |
| `simple-import.ts` | Sistema import | ✅ Attivo | ~600 linee | Import token semplificato |

**Percorso base:** `/Figma Plugin/clara plugin/src/`

### Architettura a due versioni

Il progetto mantiene **due versioni dell'entry point**:

1. **`main-figma.ts`** (ATTUALMENTE USATO)
   - Tutte le classi e utilities sono inline nel file
   - Nessun `import` statement
   - Build più semplice (zero dipendenze runtime)
   - File singolo molto grande

2. **`main.ts`** (VERSIONE MODULARE)
   - Usa `import` per classi e utilities
   - Codice più organizzato e manutenibile
   - Build richiede bundler
   - Attualmente in backup

**Entry point configurato in `tsconfig.json`:**
```json
{
  "include": ["src/main-figma.ts"]
}
```

---

## main-figma.ts

> Entry point consolidato del plugin - versione di produzione

**Percorso:** `/Figma Plugin/clara plugin/src/main-figma.ts`
**Dimensione:** ~175KB (compilato)
**Linee:** ~5000

### Cosa fa

`main-figma.ts` è il **cuore del plugin**. Contiene:

1. **Tutte le classi inline**
   - `TokenProcessor`
   - `VariableManager`
   - `LibraryManager`
   - `ProductionErrorHandler`
   - Altre classi core

2. **Sistema di messaging UI ↔ Plugin**
   - Handler per tutti i messaggi dall'UI
   - Comunicazione bidirezionale

3. **Logica import/export**
   - Import JSON (W3C e Token Studio format)
   - Export JSON, CSS
   - Gestione variabili Figma

4. **Supporto Team Libraries**
   - Navigazione librerie esterne
   - Import cross-library

### Struttura del file

```typescript
// ============================================
// TYPES E INTERFACES
// ============================================

interface ProcessedToken { /* ... */ }
interface TokenCollection { /* ... */ }
// ... altre 20+ interfaces

// ============================================
// CONSTANTS
// ============================================

const PLUGIN_NAME = 'Clara Tokens';
const MESSAGE_TYPES = { /* ... */ };
// ... altre costanti

// ============================================
// CLASSES (INLINE)
// ============================================

class ProductionErrorHandler {
  // Gestione errori centralizzata
}

class TokenProcessor {
  // Processamento token
}

class VariableManager {
  // Gestione variabili Figma
}

class LibraryManager {
  // Gestione Team Libraries
}

class AliasMarker {
  // Sistema tracking alias
}

// ... altre 5-10 classi

// ============================================
// UTILITY FUNCTIONS
// ============================================

function parseColorValue(value: string) { /* ... */ }
function assignScopes(variable, type, path) { /* ... */ }
// ... altre 30+ utilities

// ============================================
// MAIN PLUGIN LOGIC
// ============================================

async function initializePlugin() {
  // Inizializzazione plugin
}

// Message handler centrale
figma.ui.onmessage = async (msg) => {
  // Gestione messaggi UI
};

// ============================================
// STARTUP
// ============================================

initializePlugin();
figma.showUI(__html__, { width: 980, height: 700 });
```

### Messaggi gestiti

Il plugin risponde a questi messaggi dall'UI:

| Tipo Messaggio | Handler | Descrizione |
|----------------|---------|-------------|
| `UI_READY` | `handleUIReady()` | Inizializzazione UI |
| `GET_COLLECTIONS` | `handleGetCollections()` | Carica collections |
| `IMPORT_JSON` | `handleImportJson()` | Import token JSON |
| `EXPORT_JSON_ADVANCED` | `handleExportJsonAdvanced()` | Export JSON |
| `EXPORT_CSS` | `handleExportCss()` | Export CSS |
| `BROWSE_LIBRARY` | `handleBrowseLibrary()` | Naviga librerie |
| `IMPORT_FROM_LIBRARY` | `handleImportFromLibrary()` | Import da library |
| `RENAME_COLLECTION` | `handleRenameCollection()` | Rinomina collection |
| `DELETE_COLLECTION` | `handleDeleteCollection()` | Elimina collection |
| `CLEAR_COLLECTION` | `handleClearCollection()` | Svuota collection |

### Flow Import JSON

```
UI invia IMPORT_JSON
  ↓
handleImportJson()
  ↓
TokenProcessor.processTokensForImport()
  ├─ Detect formato (W3C vs Token Studio)
  ├─ Normalizza struttura
  ├─ Parse ricorsivo token tree
  └─ Raggruppa per collection
  ↓
VariableManager.importTokensAsVariables()
  ├─ Crea/recupera collections
  ├─ STEP 1: Crea variabili (alias marcati, non risolti)
  ├─ STEP 2: Risolve alias (quando tutte variabili esistono)
  └─ Assegna scopes intelligentemente
  ↓
Invia risposta a UI (success/error)
```

### Inizializzazione

```typescript
async function initializePlugin() {
  try {
    // Carica collections locali
    const collections = await figma.variables.getLocalVariableCollectionsAsync();

    // Prepara dati per UI
    const collectionsData = collections.map(col => ({
      id: col.id,
      name: col.name,
      modes: col.modes,
      variableCount: col.variableIds.length
    }));

    // Setup message handler
    figma.ui.onmessage = async (msg) => {
      // Gestione messaggi
    };

    // Mostra UI
    figma.showUI(__html__, {
      width: 980,
      height: 700,
      themeColors: true
    });

  } catch (error) {
    figma.closePlugin('Errore inizializzazione plugin');
  }
}
```

### Message Handler Pattern

```typescript
figma.ui.onmessage = async (msg) => {
  try {
    // Routing messaggi
    switch (msg.type) {

      case 'IMPORT_JSON':
        const jsonData = msg.payload.jsonData;
        const options = msg.payload.options;

        // Processa import
        const result = await handleImportJson(jsonData, options);

        // Risposta UI
        figma.ui.postMessage({
          type: 'IMPORT_JSON_RESPONSE',
          payload: result
        });
        break;

      case 'EXPORT_JSON_ADVANCED':
        const filters = msg.payload.filters;
        const exportResult = await handleExportJsonAdvanced(filters);

        figma.ui.postMessage({
          type: 'EXPORT_JSON_ADVANCED_RESPONSE',
          payload: exportResult
        });
        break;

      // ... altri 15+ case

      default:
        console.warn('Unknown message type:', msg.type);
    }

  } catch (error) {
    // Error handling
    figma.ui.postMessage({
      type: 'ERROR',
      payload: { message: error.message }
    });
  }
};
```

### Gestione errori

```typescript
class ProductionErrorHandler {
  static handleError(error: any, context: string) {
    // Categorizza errore
    const category = this.categorizeError(error);

    // Log strutturato
    console.error(`[${category}] ${context}:`, error);

    // User-friendly message
    const userMessage = this.getUserMessage(error, context);

    // Invia a UI
    figma.ui.postMessage({
      type: 'ERROR',
      payload: {
        message: userMessage,
        category: category,
        context: context
      }
    });

    return { success: false, error: userMessage };
  }

  static categorizeError(error: any): string {
    if (error.message?.includes('figma')) return 'figma_api';
    if (error.message?.includes('permission')) return 'permission';
    if (error.message?.includes('network')) return 'network';
    return 'unknown';
  }
}
```

### Come modificare

#### Aggiungere nuovo tipo di token

**1. Aggiungi interface:**

```typescript
// Nella sezione TYPES
interface CustomToken {
  $value: string;
  $type: 'custom';
  customProperty?: string;
}
```

**2. Estendi parser:**

```typescript
// Nella classe TokenProcessor
processTokenValue(token: any): ProcessedToken {
  // ... existing logic

  if (token.$type === 'custom') {
    return {
      name: token.name,
      type: 'STRING', // Mappa a tipo Figma
      value: token.$value,
      customProperty: token.customProperty
    };
  }
}
```

**3. Gestisci in VariableManager:**

```typescript
// Nella classe VariableManager
createOrUpdateVariable(token: ProcessedToken, collection, mode) {
  // ... existing logic

  if (token.type === 'STRING' && token.customProperty) {
    // Logica speciale per custom token
  }
}
```

#### Aggiungere nuovo messaggio UI

**1. Aggiungi costante:**

```typescript
const MESSAGE_TYPES = {
  // ... existing
  NEW_FEATURE: 'NEW_FEATURE',
  NEW_FEATURE_RESPONSE: 'NEW_FEATURE_RESPONSE'
};
```

**2. Aggiungi handler:**

```typescript
async function handleNewFeature(payload: any) {
  try {
    // Logica feature
    const result = await doSomething(payload);

    return { success: true, data: result };
  } catch (error) {
    return ProductionErrorHandler.handleError(error, 'NEW_FEATURE');
  }
}
```

**3. Aggiungi al message router:**

```typescript
figma.ui.onmessage = async (msg) => {
  switch (msg.type) {
    // ... existing cases

    case MESSAGE_TYPES.NEW_FEATURE:
      const result = await handleNewFeature(msg.payload);
      figma.ui.postMessage({
        type: MESSAGE_TYPES.NEW_FEATURE_RESPONSE,
        payload: result
      });
      break;
  }
};
```

#### Modificare dimensioni UI

```typescript
// In initializePlugin()
figma.showUI(__html__, {
  width: 1200,  // Default: 980
  height: 800,  // Default: 700
  themeColors: true
});
```

#### Aggiungere logging debug

```typescript
// Aggiungi flag debug
const DEBUG = false; // Cambia a true per debug

// Usa in tutto il codice
if (DEBUG) {
  console.log('Import started with options:', options);
}

// Logging condizionale
function debugLog(message: string, data?: any) {
  if (DEBUG) {
    console.log(`[DEBUG] ${message}`, data);
  }
}
```

---

## main.ts

> Entry point modulare - versione con import

**Percorso:** `/Figma Plugin/clara plugin/src/main.ts`
**Dimensione:** ~30KB (compilato)
**Linee:** ~800
**Stato:** 🔄 Backup (non attualmente usato)

### Differenze con main-figma.ts

| Caratteristica | main.ts | main-figma.ts |
|----------------|---------|---------------|
| **Struttura** | Modulare con import | Tutto inline |
| **Manutenibilità** | ⭐⭐⭐⭐⭐ Alta | ⭐⭐⭐ Media |
| **Build complexity** | Richiede bundler | Build diretto TypeScript |
| **File size** | ~30KB | ~175KB |
| **Debugging** | ⭐⭐⭐⭐ Facile | ⭐⭐⭐ Medio |
| **Produzione** | No (richiede setup) | ✅ Si |

### Struttura

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
// HANDLERS (usando classi importate)
// ============================================

async function handleImportJson(jsonData: any, options: any) {
  const processor = new TokenProcessor();
  const varManager = new VariableManager();

  // Processa token
  const processed = await processor.processTokensForImport(jsonData, options);

  // Importa come variabili
  const result = await varManager.importTokensAsVariables(
    processed.collections,
    options
  );

  return result;
}

// ... altri handler

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
    // ... altri case
  }
};

// ============================================
// INIT
// ============================================

initializePlugin();
figma.showUI(__html__, { width: 980, height: 700 });
```

### Vantaggi versione modulare

✅ **Codice organizzato:** Ogni classe in file separato
✅ **Facilità testing:** Import classi singolarmente
✅ **Manutenibilità:** Modifiche isolate
✅ **Type safety:** Import espliciti
✅ **Code reuse:** Condivisione utilities

### Svantaggi

❌ **Build complesso:** Richiede bundler (webpack/rollup)
❌ **Setup overhead:** Configurazione aggiuntiva
❌ **Non attualmente usato:** main-figma.ts è l'entry point

### Come switchare a main.ts

**1. Modifica tsconfig.json:**

```json
{
  "include": [
    "src/main.ts"  // Cambia da main-figma.ts
  ]
}
```

**2. Setup bundler (opzionale):**

```bash
npm install --save-dev webpack webpack-cli ts-loader
```

**3. Crea webpack.config.js:**

```javascript
module.exports = {
  entry: './src/main.ts',
  output: {
    filename: 'code.js',
    path: __dirname
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js']
  }
};
```

**4. Modifica package.json:**

```json
{
  "scripts": {
    "build": "webpack --mode production",
    "dev": "webpack --mode development --watch"
  }
}
```

---

## simple-import.ts

> Sistema di import semplificato con alias a due passaggi

**Percorso:** `/Figma Plugin/clara plugin/src/simple-import.ts`
**Dimensione:** ~25KB (compilato)
**Linee:** ~600

### Cosa fa

`simple-import.ts` fornisce il sistema di import "semplificato" per token JSON. È "semplificato" perché:

- ❌ Non usa classi complesse
- ✅ Funzioni standalone
- ✅ Logica lineare e sequenziale
- ✅ Più facile da debuggare

### Sistema Alias a Due Passaggi

**Problema:** Se crei una variabile con alias prima che il target esista, Figma genera errore.

**Soluzione:** Due passaggi separati:

```
STEP 1: CREAZIONE VARIABILI
├─ Crea tutte le variabili
├─ Se il valore è reference: segna come "alias pendente"
├─ Usa valore temporaneo (es. #000000 per colori)
└─ Registra in pendingAliases array

STEP 2: RISOLUZIONE ALIAS
├─ Tutte le variabili ora esistono
├─ Per ogni alias pendente:
│  ├─ Trova variabile target per path
│  ├─ Crea VariableAlias object
│  └─ Assegna con setValueForMode()
└─ Alias completamente risolti
```

### Struttura

```typescript
// ============================================
// TYPES
// ============================================

interface PendingAlias {
  variable: Variable;
  modeId: string;
  targetPath: string;
}

interface SimpleImportOptions {
  overwriteExisting: boolean;
  createMissingCollections: boolean;
}

// ============================================
// STEP 1: CREAZIONE VARIABILI
// ============================================

async function simpleImportVariables(
  jsonData: any,
  options: SimpleImportOptions = {}
) {
  const pendingAliases: PendingAlias[] = [];

  // Parse collections dal JSON
  for (const [collectionName, collectionData] of Object.entries(jsonData)) {

    // Crea/recupera collection
    const collection = await getOrCreateCollection(collectionName);

    // Processa token nella collection
    await processCollectionSimple(
      collectionData,
      collection,
      '',  // path prefix
      pendingAliases  // accumula alias
    );
  }

  // STEP 2: Risolvi alias
  await resolvePendingAliases(pendingAliases);

  return { success: true, variableCount: totalVars };
}

// ============================================
// PROCESSAMENTO RICORSIVO
// ============================================

async function processCollectionSimple(
  data: any,
  collection: VariableCollection,
  pathPrefix: string,
  pendingAliases: PendingAlias[]
) {
  for (const [key, value] of Object.entries(data)) {
    const currentPath = pathPrefix ? `${pathPrefix}.${key}` : key;

    // Se è token (ha $value)
    if (value.$value !== undefined) {
      await createVariableFromToken(
        key,
        value,
        collection,
        currentPath,
        pendingAliases
      );
    }
    // Se è gruppo (oggetto nested)
    else if (typeof value === 'object') {
      await processCollectionSimple(
        value,
        collection,
        currentPath,
        pendingAliases
      );
    }
  }
}

// ============================================
// CREAZIONE SINGOLA VARIABILE
// ============================================

async function createVariableFromToken(
  name: string,
  token: any,
  collection: VariableCollection,
  path: string,
  pendingAliases: PendingAlias[]
) {
  // Converti tipo
  const figmaType = convertTypeToFigma(token.$type);

  // Crea variabile
  const variable = figma.variables.createVariable(
    name,
    collection,
    figmaType
  );

  // Assegna scopes
  assignSimpleScopes(variable, token.$type, path);

  // Processa valore
  const mode = collection.modes[0];

  if (isReference(token.$value)) {
    // ALIAS: Segna come pendente
    pendingAliases.push({
      variable: variable,
      modeId: mode.modeId,
      targetPath: extractPathFromReference(token.$value)
    });

    // Valore temporaneo
    const tempValue = getTemporaryValue(figmaType);
    variable.setValueForMode(mode.modeId, tempValue);

  } else {
    // VALORE DIRETTO: Assegna subito
    const figmaValue = processSimpleValue(token.$value, token.$type);
    variable.setValueForMode(mode.modeId, figmaValue);
  }
}

// ============================================
// STEP 2: RISOLUZIONE ALIAS
// ============================================

async function resolvePendingAliases(pendingAliases: PendingAlias[]) {
  // Cache variabili per path
  const variableCache = await buildVariableCache();

  for (const pending of pendingAliases) {
    const targetVariable = findVariableByPath(
      pending.targetPath,
      variableCache
    );

    if (targetVariable) {
      // Crea alias
      const alias: VariableAlias = {
        type: 'VARIABLE_ALIAS',
        id: targetVariable.id
      };

      // Assegna
      pending.variable.setValueForMode(pending.modeId, alias);
    } else {
      console.warn(`Cannot resolve alias: ${pending.targetPath}`);
    }
  }
}
```

### Collection Routing Intelligente

La funzione `resolveCollectionFromAlias()` determina automaticamente in quale collection cercare un alias:

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

  // Pattern: {colors.text.*} → "semantic"
  if (aliasPath.match(/^{?colors\.text\./)) {
    return 'semantic';
  }

  // Default: stessa collection
  return 'current';
}
```

### Type Conversion

```typescript
function convertTypeToFigma(tokenType: string): VariableResolvedDataType {
  switch (tokenType) {
    case 'color':
      return 'COLOR';
    case 'dimension':
    case 'number':
    case 'spacing':
    case 'borderRadius':
      return 'FLOAT';
    case 'fontFamily':
    case 'fontWeight':
    case 'string':
      return 'STRING';
    case 'boolean':
      return 'BOOLEAN';
    default:
      console.warn(`Unknown token type: ${tokenType}, defaulting to STRING`);
      return 'STRING';
  }
}
```

### Scope Assignment

```typescript
function assignSimpleScopes(
  variable: Variable,
  tokenType: string,
  path: string
) {
  const scopes: VariableScope[] = [];

  // Color scopes
  if (tokenType === 'color') {
    scopes.push('ALL_FILLS', 'ALL_STROKES', 'FRAME_FILL', 'SHAPE_FILL');

    if (path.includes('text')) {
      scopes.push('TEXT_FILL');
    }
  }

  // Spacing scopes
  if (tokenType === 'spacing' || tokenType === 'dimension') {
    scopes.push('GAP', 'WIDTH_HEIGHT', 'CORNER_RADIUS');
  }

  // String scopes
  if (tokenType === 'fontFamily' || tokenType === 'string') {
    scopes.push('TEXT_CONTENT', 'FONT_FAMILY');
  }

  // Number scopes
  if (tokenType === 'number') {
    scopes.push('WIDTH_HEIGHT', 'GAP');
  }

  // Radius scopes
  if (tokenType === 'borderRadius') {
    scopes.push('CORNER_RADIUS');
  }

  if (scopes.length > 0) {
    variable.scopes = scopes;
  }
}
```

### Come usare simple-import

**Da main-figma.ts:**

```typescript
import { simpleImportVariables } from './simple-import';

// Nel message handler
case 'IMPORT_JSON':
  const result = await simpleImportVariables(
    msg.payload.jsonData,
    {
      overwriteExisting: true,
      createMissingCollections: true
    }
  );

  figma.ui.postMessage({
    type: 'IMPORT_JSON_RESPONSE',
    payload: result
  });
  break;
```

### Debugging import

**Aggiungi logging:**

```typescript
// In createVariableFromToken
console.log('Creating variable:', {
  name: name,
  type: figmaType,
  path: path,
  isAlias: isReference(token.$value)
});

// In resolvePendingAliases
console.log('Resolving aliases:', pendingAliases.length);
console.log('Variable cache size:', Object.keys(variableCache).length);
```

**Test import step by step:**

```typescript
// Test solo STEP 1 (no alias resolution)
async function testStep1Only(jsonData: any) {
  const pendingAliases: PendingAlias[] = [];

  // Processa collections
  for (const [collectionName, collectionData] of Object.entries(jsonData)) {
    const collection = await getOrCreateCollection(collectionName);
    await processCollectionSimple(collectionData, collection, '', pendingAliases);
  }

  console.log('Pending aliases:', pendingAliases);
  // NON chiama resolvePendingAliases() - test creazione variabili
}

// Test solo STEP 2 (alias resolution)
async function testStep2Only() {
  // Assume variabili già esistono
  const pendingAliases = loadPendingAliasesFromSomewhere();
  await resolvePendingAliases(pendingAliases);
}
```

---

## Architettura Message Handler

### Pattern Request/Response

Tutti i messaggi seguono questo pattern:

```typescript
// UI → Plugin
{
  type: 'ACTION_NAME',
  payload: {
    // dati richiesta
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

### Tipi di messaggi

#### 1. Messaggi di inizializzazione

```typescript
// UI_READY: UI caricata e pronta
UI → Plugin: { type: 'UI_READY' }
Plugin → UI: {
  type: 'UI_READY_RESPONSE',
  payload: {
    collections: [...],
    settings: {...}
  }
}
```

#### 2. Messaggi di query

```typescript
// GET_COLLECTIONS: Richiedi lista collections
UI → Plugin: { type: 'GET_COLLECTIONS' }
Plugin → UI: {
  type: 'GET_COLLECTIONS_RESPONSE',
  payload: {
    collections: [
      { id, name, modes, variableCount }
    ]
  }
}
```

#### 3. Messaggi di azione

```typescript
// IMPORT_JSON: Importa token
UI → Plugin: {
  type: 'IMPORT_JSON',
  payload: {
    jsonData: {...},
    options: {
      overwriteExisting: true,
      createMissingCollections: true
    }
  }
}

Plugin → UI: {
  type: 'IMPORT_JSON_RESPONSE',
  payload: {
    success: true,
    variableCount: 150,
    collectionCount: 3
  }
}
```

#### 4. Messaggi di errore

```typescript
// Errore generico
Plugin → UI: {
  type: 'ERROR',
  payload: {
    message: 'Descrizione errore user-friendly',
    category: 'figma_api',
    context: 'IMPORT_JSON'
  }
}
```

### Esempio completo: Import Flow

```
[UI] User clicks "Import"
  ↓
[UI] Legge file JSON
  ↓
[UI] Invia messaggio
  {
    type: 'IMPORT_JSON',
    payload: {
      jsonData: {...},
      options: {...}
    }
  }
  ↓
[Plugin] Riceve messaggio
  ↓
[Plugin] Chiama handleImportJson()
  ↓
[Plugin] TokenProcessor.processTokensForImport()
  ↓
[Plugin] VariableManager.importTokensAsVariables()
  ↓
[Plugin] Invia risposta
  {
    type: 'IMPORT_JSON_RESPONSE',
    payload: {
      success: true,
      variableCount: 150
    }
  }
  ↓
[UI] Riceve risposta
  ↓
[UI] Mostra notifica successo
```

---

## Sistema Alias a Due Passaggi

### Perché due passaggi?

**Problema:**

```typescript
// Token A referenzia Token B
{
  "colorA": { "$value": "{colorB}", "$type": "color" },
  "colorB": { "$value": "#ff0000", "$type": "color" }
}

// Se proces si in ordine:
// 1. Crea variabile colorA con alias a colorB
//    ❌ ERROR: colorB non esiste ancora!
```

**Soluzione:**

```typescript
// STEP 1: Crea TUTTE le variabili
// - colorA: valore temporaneo #000000
// - colorB: valore #ff0000

// STEP 2: Ora colorB esiste, risolvi alias
// - colorA: alias → colorB ✅
```

### Implementazione dettagliata

#### STEP 1: Creazione

```typescript
const pendingAliases: PendingAlias[] = [];

function createVariable(token) {
  const variable = figma.variables.createVariable(...);

  if (isReference(token.$value)) {
    // Segna come alias pendente
    pendingAliases.push({
      variable: variable,
      modeId: currentModeId,
      targetPath: extractPath(token.$value)
    });

    // Valore temporaneo (placeholder)
    const tempValue = getTemporaryValue(token.$type);
    variable.setValueForMode(currentModeId, tempValue);

  } else {
    // Valore diretto
    variable.setValueForMode(currentModeId, token.$value);
  }
}
```

#### STEP 2: Risoluzione

```typescript
async function resolvePendingAliases(pendingAliases) {
  // Build cache: path → variable
  const cache = {};
  const allVariables = await figma.variables.getLocalVariablesAsync();

  for (const variable of allVariables) {
    const path = buildPathForVariable(variable);
    cache[path] = variable;
  }

  // Risolvi ogni alias
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

### Cross-collection aliases

```typescript
// Token in collection "semantic"
{
  "brand": {
    "primary": {
      "$value": "{colors.blue.500}",  // Referenzia "global" collection
      "$type": "color"
    }
  }
}

// Risoluzione intelligente
function findVariableByPath(path, cache) {
  // Determina collection da path
  const collectionName = resolveCollectionFromAlias(path);

  // Cerca in collection specifica
  const fullPath = `${collectionName}.${path}`;
  return cache[fullPath] || cache[path];
}
```

---

## Come Modificare

### Aggiungere supporto per nuovo formato token

**1. Aggiungi detection in TokenProcessor:**

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

**2. Aggiungi conversione:**

```typescript
function normalizeTokenFormat(jsonData: any): any {
  const format = detectTokenFormat(jsonData);

  switch (format) {
    case 'CUSTOM_FORMAT':
      return convertCustomFormatToW3C(jsonData);

    case 'TOKEN_STUDIO':
      return convertTokenStudioToW3C(jsonData);

    default:
      return jsonData; // già W3C
  }
}

function convertCustomFormatToW3C(data: any): any {
  // Logica conversione
  return {
    // W3C format
  };
}
```

### Modificare scope assignment

**Modifica `assignSimpleScopes()`:**

```typescript
function assignSimpleScopes(variable, tokenType, path) {
  const scopes = [];

  // Existing scopes...

  // New: Background colors (custom logic)
  if (tokenType === 'color' && path.includes('background')) {
    scopes.push('FRAME_FILL', 'SHAPE_FILL');
    // NOT text fill
  }

  // New: Icon colors (custom logic)
  if (path.includes('icon')) {
    scopes.push('ALL_FILLS', 'ALL_STROKES');
  }

  variable.scopes = scopes;
}
```

### Aggiungere validazione pre-import

```typescript
function validateTokenData(jsonData: any): ValidationResult {
  const errors = [];
  const warnings = [];

  // Valida struttura
  if (!jsonData || typeof jsonData !== 'object') {
    errors.push('Invalid JSON structure');
  }

  // Valida token
  function validateToken(token, path) {
    if (!token.$value) {
      errors.push(`Missing $value at ${path}`);
    }

    if (!token.$type) {
      warnings.push(`Missing $type at ${path} (will infer)`);
    }

    // Valida color format
    if (token.$type === 'color' && !isValidColor(token.$value)) {
      errors.push(`Invalid color value at ${path}: ${token.$value}`);
    }
  }

  // Traverse
  traverseTokens(jsonData, validateToken);

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// In handleImportJson
const validation = validateTokenData(jsonData);
if (!validation.isValid) {
  return {
    success: false,
    errors: validation.errors
  };
}
```

### Ottimizzare performance per import grandi

```typescript
// Batch processing
async function importTokensBatch(
  tokens: ProcessedToken[],
  collection: VariableCollection,
  batchSize = 50
) {
  for (let i = 0; i < tokens.length; i += batchSize) {
    const batch = tokens.slice(i, i + batchSize);

    // Processa batch
    for (const token of batch) {
      await createVariableFromToken(token, collection);
    }

    // Progress update
    const progress = Math.round((i / tokens.length) * 100);
    figma.ui.postMessage({
      type: 'IMPORT_PROGRESS',
      payload: { progress }
    });

    // Yield per non bloccare UI
    await new Promise(resolve => setTimeout(resolve, 0));
  }
}
```

---

## Link Utili

- [📖 NPM Scripts](01-npm-scripts.md) - Comandi build e sviluppo
- [📖 Classi Core](03-core-classes.md) - Dettagli classi usate
- [📖 Workflow Guide](99-workflow-guide.md) - Processo sviluppo completo
- [🔗 Figma Plugin API](https://www.figma.com/plugin-docs/)
- [🔗 W3C Design Tokens](https://design-tokens.github.io/community-group/format/)

---

**Ultima modifica:** 2025-01-16 | [⬅️ NPM Scripts](01-npm-scripts.md) | [➡️ Classi Core](03-core-classes.md)
