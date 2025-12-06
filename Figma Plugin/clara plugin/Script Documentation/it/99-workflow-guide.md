# Workflow Guide - Clara Tokens Plugin

> Guida completa al processo di sviluppo

[⬅️ Configurazione](06-configuration.md) | [Indice](../README.md)

---

## 📋 Indice

- [Setup Iniziale](#setup-iniziale)
- [Workflow Sviluppo](#workflow-sviluppo)
- [Testing](#testing)
- [Build e Deploy](#build-e-deploy)
- [Debugging](#debugging)
- [Best Practices](#best-practices)
- [Troubleshooting Comune](#troubleshooting-comune)

---

## Setup Iniziale

### 1. Clone e installazione

```bash
# Naviga alla directory del plugin
cd "/Figma Plugin/clara plugin"

# Installa dipendenze
npm install

# Verifica installazione
npm list --depth=0
```

### 2. Verifica configurazione

```bash
# Controlla tsconfig.json
cat tsconfig.json

# Controlla manifest.json
cat manifest.json

# Controlla package.json scripts
npm run
```

### 3. Build iniziale

```bash
# Pulisci (se esistono file vecchi)
npm run clean

# Build
npm run build

# Verifica output
ls -lh code.js  # Dovrebbe essere ~175KB
```

### 4. Carica plugin in Figma

1. Apri Figma Desktop
2. Menu: Plugins → Development → Import plugin from manifest...
3. Seleziona `manifest.json` nella directory del plugin
4. Plugin appare in: Plugins → Development → Clara Tokens

---

## Workflow Sviluppo

### Workflow consigliato (Development)

```bash
# Terminal 1: Watch mode
cd "/Figma Plugin/clara plugin"
npm run dev

# Lascia girare - ricompila automaticamente quando salvi file .ts
```

Ora lavori sui file TypeScript:

```bash
# Modifica file (esempio)
vim src/classes/TokenProcessor.ts

# Salva - watch mode compila automaticamente
# Vedi output nel terminal:
# [00:01:23] File change detected. Starting incremental compilation...
# [00:01:24] Found 0 errors. Compilation complete.
```

Quando vuoi testare in Figma:

```bash
# Terminal 2: Build per Figma
npm run build

# In Figma:
# Cmd+Option+P (Mac) o Ctrl+Alt+P (Windows)
# Plugins → Development → Clara Tokens
```

### Workflow veloce (Quick Fix)

```bash
# 1. Modifica file
vim src/utils/colorUtils.ts

# 2. Build immediato
npm run build

# 3. Test in Figma
# Ricarica plugin: Cmd+Option+P → Clara Tokens
```

### Workflow completo (Feature Development)

```bash
# 1. Crea branch (se usi git)
git checkout -b feature/new-token-type

# 2. Avvia watch mode
npm run dev

# 3. Sviluppa feature
# - Modifica file .ts
# - Watch mode compila automaticamente

# 4. Scrivi test
vim tests/newFeature.test.js

# 5. Esegui test (se configurato)
npm test

# 6. Lint check
npm run lint

# 7. Fix automatico lint
npx eslint src/**/*.ts --fix

# 8. Build finale
npm run clean
npm run build

# 9. Test manuale completo in Figma
# - Carica plugin
# - Testa tutti i casi d'uso
# - Verifica nessun errore in console

# 10. Commit
git add .
git commit -m "feat: add support for new token type"
```

---

## Testing

### Testing manuale in Figma

**1. Preparazione:**
```bash
npm run build
```

**2. Carica plugin in Figma:**
- Plugins → Development → Clara Tokens

**3. Test import token:**
- Prepara file JSON di test
- Click "Import" nel plugin
- Seleziona file
- Verifica import successo
- Controlla variabili create in Figma

**4. Test export token:**
- Seleziona collections
- Click "Export"
- Verifica formato JSON output
- Valida contro schema W3C

**5. Console debugging:**
```bash
# In Figma:
# Cmd+Option+I (Mac) o Ctrl+Shift+I (Windows)
# Apre DevTools
# Tab Console → Vedi log del plugin
```

### Unit testing (se configurato)

```bash
# Esegui tutti i test
npm test

# Watch mode (ricompila al salvataggio)
npm run test:watch

# Test specifico
npm test colorVariantGenerator.test.js

# Con coverage
npm run test:coverage
```

**Interpretare results:**

```bash
 PASS  tests/colorVariantGenerator.test.js
  ✓ parseColorReference parses correctly (2 ms)
  ✓ generateCoreVariants creates all variants (3 ms)

Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
Time:        0.123 s
```

---

## Build e Deploy

### Build di produzione

```bash
# 1. Pulizia completa
npm run clean
rm code.js

# 2. Fresh install dipendenze (opzionale ma consigliato)
rm -rf node_modules package-lock.json
npm install

# 3. Lint check
npm run lint

# 4. Fix problemi lint
npx eslint src/**/*.ts --fix

# 5. Build finale
npm run build

# 6. Verifica dimensione
ls -lh code.js  # Target: ~175KB

# 7. Verifica no errori TypeScript
# (se build ha successo, non ci sono errori)

# 8. Test completo manuale in Figma
# Testa TUTTE le funzionalità:
# - Import JSON (W3C e Token Studio)
# - Export JSON
# - Export CSS
# - Library support
# - Theme builder
# - Error handling
```

### Deploy processo

**1. Versioning:**

```bash
# Bump version in package.json
npm version patch  # 1.0.0 → 1.0.1 (bug fix)
npm version minor  # 1.0.1 → 1.1.0 (new feature)
npm version major  # 1.1.0 → 2.0.0 (breaking change)

# Questo crea anche git tag
```

**2. Git workflow:**

```bash
# Commit build finale
git add .
git commit -m "release: v1.1.0"

# Tag (se non fatto da npm version)
git tag v1.1.0

# Push
git push origin main
git push origin v1.1.0
```

**3. Figma Plugin pubblicazione (se pubblico):**

- Figma: Plugins → Development → Clara Tokens → Publish
- Compila form: changelog, screenshots, descrizione
- Submit for review

---

## Debugging

### Console debugging

**In codice plugin:**

```typescript
// main-figma.ts

function handleImportJson(jsonData: any) {
  console.log('Import started');
  console.log('Data:', jsonData);

  try {
    const result = processTokens(jsonData);
    console.log('Process result:', result);

    if (result.success) {
      console.log('✅ Import successful:', result.variableCount, 'variables');
    } else {
      console.error('❌ Import failed:', result.error);
    }

  } catch (error) {
    console.error('Exception:', error);
    console.error('Stack:', error.stack);
  }
}
```

**Visualizzare in Figma:**

1. Apri plugin
2. Cmd+Option+I (Mac) o Ctrl+Shift+I (Windows)
3. Tab Console
4. Vedi tutti i `console.log()` output

### Debugging errori

**Errore import:**

```typescript
// Aggiungi logging dettagliato
async function importTokensAsVariables(tokens: ProcessedToken[]) {
  console.group('Import Tokens');
  console.log('Total tokens:', tokens.length);

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    console.log(`[${i + 1}/${tokens.length}] Processing:`, token.name);

    try {
      await createVariable(token);
      console.log('✅ Created:', token.name);
    } catch (error) {
      console.error('❌ Failed:', token.name, error);
      // Non interrompere, continua con next token
    }
  }

  console.groupEnd();
}
```

### Source maps (per debugging avanzato)

**Abilita source maps:**

```json
// tsconfig.json
{
  "compilerOptions": {
    "sourceMap": true,
    "removeComments": false
  }
}
```

```bash
npm run build
```

Ora in DevTools:
- Puoi vedere codice TypeScript originale
- Breakpoints nel .ts invece che nel .js
- Stack traces più leggibili

**⚠️ Importante:** Disabilita source maps per produzione (aumenta dimensione file)

### Debugging performance

```typescript
function processLargeTokenFile(tokens: any[]) {
  console.time('processLargeTokenFile');

  // Processing logic
  for (const token of tokens) {
    console.time(`process-${token.name}`);
    processToken(token);
    console.timeEnd(`process-${token.name}`);
  }

  console.timeEnd('processLargeTokenFile');
}

// Output:
// process-color1: 1.234ms
// process-color2: 2.345ms
// ...
// processLargeTokenFile: 123.456ms
```

---

## Best Practices

### Code organization

**1. Separazione concerns:**
```typescript
// ❌ Bad: Tutto in una funzione
function handleImport(jsonData: any) {
  // 200 righe di codice...
}

// ✅ Good: Funzioni separate
function handleImport(jsonData: any) {
  const validated = validateData(jsonData);
  const processed = processTokens(validated);
  const result = importToFigma(processed);
  return result;
}
```

**2. Error handling consistente:**
```typescript
// ✅ Good: Usa ProductionErrorHandler
try {
  const result = await dangerousOperation();
  return { success: true, data: result };
} catch (error) {
  return ProductionErrorHandler.handleError(error, 'IMPORT_JSON');
}
```

**3. Type safety:**
```typescript
// ❌ Bad: any everywhere
function processToken(token: any): any {
  return token.value;
}

// ✅ Good: Tipi espliciti
function processToken(token: ProcessedToken): FigmaValue {
  return convertValue(token.value, token.type);
}
```

### Performance

**1. Batch processing:**
```typescript
// ✅ Good: Processa in batch con progress
async function importManyTokens(tokens: ProcessedToken[]) {
  const BATCH_SIZE = 50;

  for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
    const batch = tokens.slice(i, i + BATCH_SIZE);

    // Process batch
    await processBatch(batch);

    // Update progress
    const progress = Math.round((i / tokens.length) * 100);
    figma.ui.postMessage({ type: 'PROGRESS', progress });

    // Yield per non bloccare UI
    await new Promise(resolve => setTimeout(resolve, 0));
  }
}
```

**2. Cache quando appropriato:**
```typescript
// ✅ Good: Cache variabili per alias resolution
class VariableCache {
  private cache = new Map<string, Variable>();
  private readonly TTL = 5 * 60 * 1000; // 5 min

  async get(key: string): Promise<Variable | undefined> {
    const cached = this.cache.get(key);
    if (cached && !this.isExpired(cached)) {
      return cached;
    }
    return undefined;
  }
}
```

### Commit messages

```bash
# Format: <type>: <description>

# Types:
feat: add support for gradient tokens
fix: resolve circular alias dependencies
refactor: extract TokenProcessor to separate class
docs: update README with new features
test: add unit tests for colorVariantGenerator
chore: update TypeScript to 5.3.0
perf: optimize alias resolution for large files
```

---

## Troubleshooting Comune

### Build fallisce

**Sintomo:** `npm run build` errore

```bash
# 1. Pulisci tutto
npm run clean
rm -rf node_modules package-lock.json

# 2. Reinstalla
npm install

# 3. Verifica TypeScript version
npx tsc --version  # Dovrebbe essere 5.0+

# 4. Build con verbose
npx tsc --verbose

# 5. Check errori specifici TypeScript
npx tsc --noEmit  # Solo type check, no output
```

### Plugin non si carica in Figma

**Sintomo:** Plugin non appare o errore al caricamento

```bash
# 1. Verifica code.js esiste
ls -l code.js

# 2. Verifica dimensione ragionevole
ls -lh code.js  # ~175KB

# 3. Verifica manifest.json valido
cat manifest.json | jq .  # Richiede jq installato

# 4. Rebuild clean
npm run clean
npm run build

# 5. In Figma: Remove plugin e re-import manifest
```

### Import token fallisce

**Sintomo:** Errore durante import JSON

**Debug:**

```typescript
// Aggiungi logging in handleImportJson
async function handleImportJson(jsonData: any) {
  console.log('Raw JSON:', JSON.stringify(jsonData, null, 2));

  try {
    // Step by step logging
    console.log('Step 1: Validate');
    const validated = validateTokenData(jsonData);
    console.log('Validated:', validated);

    console.log('Step 2: Process');
    const processed = await processTokens(validated);
    console.log('Processed:', processed);

    console.log('Step 3: Import');
    const result = await importToFigma(processed);
    console.log('Result:', result);

  } catch (error) {
    console.error('Error at:', error.stack);
  }
}
```

**Controlla:**
1. Formato JSON valido (W3C vs Token Studio)
2. $value e $type presenti
3. Color values formato corretto (#hex)
4. Nessun circular reference in alias
5. Collection names validi (no special chars)

### Alias non si risolvono

**Sintomo:** Variabili create ma alias restano unresolved

**Causa comune:** Two-step alias system non completato

**Fix:**

```typescript
// Verifica STEP 2 viene chiamato
async function simpleImportVariables(jsonData: any) {
  const pendingAliases: PendingAlias[] = [];

  // STEP 1
  await createAllVariables(jsonData, pendingAliases);
  console.log('Pending aliases:', pendingAliases.length);

  // STEP 2 - CRITICO
  await resolvePendingAliases(pendingAliases);
  console.log('Aliases resolved');
}
```

### Performance lenta su file grandi

**Sintomo:** Import molto lento per >500 tokens

**Ottimizzazione:**

```typescript
// 1. Batch processing
const BATCH_SIZE = 50;

// 2. Progress feedback
figma.ui.postMessage({ type: 'PROGRESS', value: 50 });

// 3. Yield periodically
await new Promise(resolve => setTimeout(resolve, 0));

// 4. Cache lookups
const variableCache = buildCache();
```

---

## Link Utili

- [📖 NPM Scripts](01-npm-scripts.md)
- [📖 Script Principali](02-main-scripts.md)
- [📖 Classi Core](03-core-classes.md)
- [📖 Configurazione](06-configuration.md)
- [🔗 Figma Plugin Docs](https://www.figma.com/plugin-docs/)

---

**Ultima modifica:** 2025-01-16 | [⬅️ Configurazione](06-configuration.md) | [⬆️ Indice](../README.md)
