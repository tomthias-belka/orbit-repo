# 🔧 Piano di Refactoring Plugin Clara
**Data creazione:** 2025-11-07
**Focus:** Performance + Manutenibilità
**Timeline:** 4-5 settimane (19-26 giorni)

---

## 📊 SITUAZIONE ATTUALE

### Problemi Critici Identificati
- ✅ **Duplicazione codice:** 2.800 righe duplicate (47%)
- ✅ **Monolite main-figma.ts:** 5.739 righe in un file
- ✅ **Monolite ui.html:** 11.958 righe (HTML+CSS+JS)
- ✅ **Console.log produzione:** 256 occorrenze
- ✅ **Type safety:** 319 utilizzi di 'any'
- ✅ **Performance:** Import 1.000 tokens = 5-10s
- ✅ **Test coverage:** 0%

### Metriche Obiettivo
| Metrica | Prima | Dopo | Miglioramento |
|---------|-------|------|---------------|
| Righe duplicate | 2.800 | 0 | -100% |
| File più grande | 5.739 | 500 | -91% |
| console.log | 256 | 0 | -100% |
| Uso 'any' | 319 | 150 | -53% |
| Import 1k tokens | 5-10s | 2-3s | -60% |
| Export CSS | 4-6s | 1-2s | -75% |
| Type coverage | 60% | 85% | +42% |
| Test coverage | 0% | 40% | +40% |

---

## 🎯 FASE 1: Setup Bundler e Architettura Modulare
**Priorità:** CRITICAL
**Tempo stimato:** 2-3 giorni
**Obiettivo:** Eliminare main-figma.ts monolite, introdurre build system

### Task 1.1: Setup esbuild
**Tempo:** 30 minuti

```bash
# Installare esbuild
npm install --save-dev esbuild
```

**Aggiornare package.json:**
```json
{
  "scripts": {
    "build": "esbuild src/main.ts --bundle --outfile=code.js --platform=neutral --target=es2017 --format=iife",
    "dev": "esbuild src/main.ts --bundle --outfile=code.js --platform=neutral --target=es2017 --format=iife --watch",
    "build:ui": "cp ui.html dist/ui.html",
    "clean": "rm -f code.js"
  }
}
```

**Aggiornare tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "es2017",
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": false,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "src/main-figma.ts"]
}
```

**✅ Checklist:**
- [ ] esbuild installato
- [ ] package.json aggiornato
- [ ] tsconfig.json aggiornato
- [ ] Build funziona: `npm run build`

---

### Task 1.2: Verificare src/main.ts
**Tempo:** 1 ora

**Controllare che main.ts importi tutte le classi:**
```typescript
// src/main.ts deve contenere:
import { ProductionErrorHandler } from './classes/ProductionErrorHandler';
import { TokenProcessor } from './classes/TokenProcessor';
import { ImportPreview } from './classes/ImportPreview';
import { VariableManager } from './classes/VariableManager';
import { VariableExporter } from './classes/VariableExporter';
import { CSSExporter } from './classes/CSSExporter';
import { TextStyleExtractor } from './classes/TextStyleExtractor';
import { AdvancedAliasResolver } from './classes/AdvancedAliasResolver';
import { MESSAGE_TYPES, UI_CONFIG } from './constants';
```

**Verificare import nelle classi:**
- Tutti i file in `src/classes/` devono usare import/export
- Path import devono essere corretti (`.js` extension per TypeScript)
- Verificare import da `../constants/index.js`

**✅ Checklist:**
- [ ] main.ts importa tutte le classi
- [ ] Tutti i file hanno import/export corretti
- [ ] Nessun errore TypeScript: `npx tsc --noEmit`

---

### Task 1.3: Test build con esbuild
**Tempo:** 1 ora

```bash
# Build
npm run build

# Verificare output
ls -lh code.js
# Dovrebbe essere ~150-200KB

# Testare in Figma
# 1. Apri Figma
# 2. Plugins → Development → Import plugin from manifest
# 3. Seleziona manifest.json
# 4. Testa funzionalità base (import/export)
```

**✅ Checklist:**
- [ ] Build completato senza errori
- [ ] code.js generato (~150-200KB)
- [ ] Plugin carica in Figma
- [ ] Import tokens funziona
- [ ] Export tokens funziona
- [ ] UI si apre correttamente

---

### Task 1.4: Deprecare main-figma.ts
**Tempo:** 15 minuti

```bash
# Backup del vecchio file
mv src/main-figma.ts src/main-figma.ts.backup

# Aggiungere nota nel file backup
echo "// DEPRECATED: This file is no longer used. Use src/main.ts instead." | cat - src/main-figma.ts.backup > temp && mv temp src/main-figma.ts.backup
```

**✅ Checklist:**
- [ ] main-figma.ts rinominato in .backup
- [ ] Build ancora funziona
- [ ] Plugin testato e funzionante

---

**🎉 Risultato FASE 1:**
- ✅ Architettura modulare funzionante
- ✅ Build automatico con esbuild
- ✅ -5.500 righe duplicate eliminate
- ✅ Codebase più pulito e manutenibile

---

## 🚀 FASE 2: Ottimizzazione Performance
**Priorità:** HIGH
**Tempo stimato:** 3-4 giorni
**Obiettivo:** Ridurre tempo import/export del 50%+

### Task 2.1: Implementare LRU cache
**Tempo:** 2 ore

```bash
npm install lru-cache
npm install --save-dev @types/lru-cache
```

**File:** `src/classes/AdvancedAliasResolver.ts`

**Modificare (linea ~37):**
```typescript
// PRIMA:
private resolutionCache = new Map<string, AliasResolutionResult>();

// DOPO:
import { LRUCache } from 'lru-cache';

private resolutionCache = new LRUCache<string, AliasResolutionResult>({
  max: 500,  // max 500 entries
  ttl: 1000 * 60 * 10,  // 10 minuti TTL
  updateAgeOnGet: true,
  allowStale: false
});
```

**Aggiornare metodi che usano cache:**
```typescript
// Sostituire .has() con .has()
// Sostituire .get() con .get()
// Sostituire .set() con .set()
// API è compatibile!
```

**Test:**
```typescript
// Creare test per verificare:
// 1. Cache funziona
// 2. Dopo 500 entries, le vecchie vengono eliminate
// 3. TTL funziona (entries scadono dopo 10 min)
```

**✅ Checklist:**
- [ ] lru-cache installato
- [ ] AdvancedAliasResolver usa LRU cache
- [ ] Build funziona
- [ ] Test manuale: import 1000 tokens 2 volte (seconda volta più veloce)

---

### Task 2.2: Parallelizzare TextStyleExtractor
**Tempo:** 2 ore

**File:** `src/classes/TextStyleExtractor.ts`

**Modificare processBatch (linea ~136-166):**
```typescript
// PRIMA (SEQUENZIALE):
private async processBatch(
  textStyles: TextStyle[],
  options: TextStyleExtractionOptions
): Promise<ExtractedTextStyle[]> {
  const results: ExtractedTextStyle[] = [];

  for (const style of textStyles) {
    try {
      const extractedStyle = await this.extractSingleTextStyle(style, options);
      results.push(extractedStyle);
    } catch (error) {
      console.error(`Error processing style ${style.name}:`, error);
      results.push({
        name: style.name,
        error: error instanceof Error ? error.message : 'Unknown error'
      } as ExtractedTextStyle);
    }
  }

  return results;
}

// DOPO (PARALLELO):
private async processBatch(
  textStyles: TextStyle[],
  options: TextStyleExtractionOptions
): Promise<ExtractedTextStyle[]> {
  const promises = textStyles.map(async (style) => {
    try {
      return await this.extractSingleTextStyle(style, options);
    } catch (error) {
      console.error(`Error processing style ${style.name}:`, error);
      return {
        name: style.name,
        error: error instanceof Error ? error.message : 'Unknown error'
      } as ExtractedTextStyle;
    }
  });

  return await Promise.all(promises);
}
```

**Test:**
```bash
# Testare con 100 text styles
# Prima: ~5s
# Dopo: ~0.5-1s (10x più veloce!)
```

**✅ Checklist:**
- [ ] processBatch usa Promise.all
- [ ] Build funziona
- [ ] Test: Export text styles è più veloce

---

### Task 2.3: Ottimizzare TokenProcessor
**Tempo:** 3 ore

**File:** `src/classes/TokenProcessor.ts`

**Problema 1: Ricerca lineare ripetuta**

Trovare codice tipo:
```typescript
// BAD:
for (const token of tokens) {
  const collection = collections.find(c => c.name === token.collection);
}
```

Sostituire con:
```typescript
// GOOD:
const collectionMap = new Map(collections.map(c => [c.name, c]));
for (const token of tokens) {
  const collection = collectionMap.get(token.collection);
}
```

**Problema 2: Spread in loop**
```typescript
// BAD:
tokens.push(...nestedTokens);

// GOOD:
tokens = tokens.concat(nestedTokens);
// O meglio:
for (const token of nestedTokens) {
  tokens.push(token);
}
```

**✅ Checklist:**
- [ ] Eliminati Array.find() in loop
- [ ] Usato Map per lookup O(1)
- [ ] Rimossi spread operator in hot paths
- [ ] Build funziona
- [ ] Test: Import 1000 tokens più veloce

---

### Task 2.4: Chunked message passing
**Tempo:** 3 ore

**File da modificare:**
- `src/main.ts` (Figma side)
- `ui.html` (UI side - JavaScript section)

**Creare utility per chunking:**
```typescript
// src/utils/messageChunking.ts
export function chunkData(data: string, chunkSize = 100 * 1024): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < data.length; i += chunkSize) {
    chunks.push(data.slice(i, i + chunkSize));
  }
  return chunks;
}

export function sendChunked(
  type: string,
  data: string,
  metadata?: any
) {
  const chunks = chunkData(data);

  chunks.forEach((chunk, index) => {
    figma.ui.postMessage({
      type: `${type}_CHUNK`,
      chunk,
      index,
      total: chunks.length,
      isLast: index === chunks.length - 1,
      metadata: index === 0 ? metadata : undefined
    });
  });
}
```

**UI side - ricevere chunks:**
```typescript
// ui.html <script> section
let receivedChunks: Record<string, string[]> = {};

window.onmessage = (event) => {
  const msg = event.data.pluginMessage;

  if (msg.type.endsWith('_CHUNK')) {
    const baseType = msg.type.replace('_CHUNK', '');

    if (!receivedChunks[baseType]) {
      receivedChunks[baseType] = [];
    }

    receivedChunks[baseType][msg.index] = msg.chunk;

    // Progress
    console.log(`Receiving ${baseType}: ${msg.index + 1}/${msg.total}`);

    if (msg.isLast) {
      const fullData = receivedChunks[baseType].join('');
      delete receivedChunks[baseType];

      // Process full data
      handleCompleteData(baseType, fullData, msg.metadata);
    }
  }
};
```

**✅ Checklist:**
- [ ] Utility chunking creata
- [ ] Export grandi usa chunking
- [ ] UI riceve e riassembla chunks
- [ ] Progress visible durante transfer
- [ ] Build funziona
- [ ] Test: Export 1000 tokens non freezes UI

---

**🎉 Risultato FASE 2:**
- ✅ Import 1000 tokens: 5-10s → 2-3s (-60%)
- ✅ Export CSS: 4-6s → 1-2s (-75%)
- ✅ Memory leaks risolti (LRU cache)
- ✅ UI non freezes con payload grandi

---

## 🔒 FASE 3: Code Quality e Type Safety
**Priorità:** HIGH
**Tempo stimato:** 5-7 giorni
**Obiettivo:** Eliminare 'any', console.log, migliorare manutenibilità

### Task 3.1: Logger configurabile
**Tempo:** 2 ore

**Creare:** `src/utils/logger.ts`
```typescript
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

class Logger {
  private level: LogLevel;

  constructor() {
    // In produzione: solo WARN e ERROR
    // In dev: tutto
    this.level = process.env.NODE_ENV === 'production'
      ? LogLevel.WARN
      : LogLevel.DEBUG;
  }

  setLevel(level: LogLevel) {
    this.level = level;
  }

  debug(message: string, ...args: any[]) {
    if (this.level <= LogLevel.DEBUG) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]) {
    if (this.level <= LogLevel.INFO) {
      console.log(`[INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]) {
    if (this.level <= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  error(message: string, ...args: any[]) {
    if (this.level <= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }
}

export const logger = new Logger();
```

**Sostituire in TUTTI i file:**
```typescript
// PRIMA:
console.log(`[AdvancedAliasResolver] Looking for variable...`);

// DOPO:
import { logger } from '../utils/logger';
logger.debug(`Looking for variable...`);
```

**File da modificare (256 occorrenze):**
- src/classes/AdvancedAliasResolver.ts
- src/classes/TokenProcessor.ts
- src/classes/TextStyleExtractor.ts
- src/classes/VariableManager.ts
- src/classes/CSSExporter.ts
- src/utils/colorUtils.ts
- src/utils/validationUtils.ts

**✅ Checklist:**
- [ ] logger.ts creato
- [ ] Tutti console.log sostituiti (256)
- [ ] Build funziona
- [ ] In produzione: solo WARN/ERROR visibili

---

### Task 3.2: Type definitions robuste
**Tempo:** 4 ore

**Creare:** `src/types/values.ts`
```typescript
// Color types
export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface RGBA extends RGB {
  a: number;
}

export type ColorValue = RGB | RGBA | string;

// Number types
export interface DimensionValue {
  value: number;
  unit: string;
}

export type NumberValue = number | DimensionValue;

// Token types
export type TokenValue = ColorValue | NumberValue | string | boolean;

export interface TokenBase {
  $type: string;
  $value: TokenValue;
  $description?: string;
}

// Figma types
export type FigmaVariableType = 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN';

// Validated value (type-safe!)
export interface ValidatedValue<T extends FigmaVariableType> {
  type: T;
  value: T extends 'COLOR' ? (RGB | RGBA) :
         T extends 'FLOAT' ? number :
         T extends 'STRING' ? string :
         T extends 'BOOLEAN' ? boolean :
         never;
}
```

**Creare type guards:** `src/utils/typeGuards.ts`
```typescript
import { RGB, RGBA, ColorValue } from '../types/values';

export function isRGB(value: any): value is RGB {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof value.r === 'number' &&
    typeof value.g === 'number' &&
    typeof value.b === 'number' &&
    !('a' in value)
  );
}

export function isRGBA(value: any): value is RGBA {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof value.r === 'number' &&
    typeof value.g === 'number' &&
    typeof value.b === 'number' &&
    typeof value.a === 'number'
  );
}

export function isColorValue(value: any): value is ColorValue {
  return isRGB(value) || isRGBA(value) || typeof value === 'string';
}

export function isError(error: unknown): error is Error {
  return error instanceof Error;
}
```

**Sostituire 'any' strategicamente (target: -50%):**

Focus su funzioni critiche:
1. `validateValueForVariableType` (validationUtils.ts)
2. `parseColor` (colorUtils.ts)
3. `processTokenValue` (TokenProcessor.ts)
4. `formatExportData` (VariableExporter.ts)

**Esempio refactor:**
```typescript
// PRIMA:
export function parseColor(colorValue: any): any {
  // ...
}

// DOPO:
export function parseColor(colorValue: ColorValue): RGB | RGBA {
  if (isRGB(colorValue) || isRGBA(colorValue)) {
    return colorValue;
  }

  if (typeof colorValue === 'string') {
    if (colorValue.startsWith('#')) {
      return parseHexColor(colorValue);
    }
    // ...
  }

  throw new Error(`Invalid color value: ${colorValue}`);
}
```

**✅ Checklist:**
- [ ] types/values.ts creato
- [ ] typeGuards.ts creato
- [ ] Top 50 'any' sostituiti con types corretti
- [ ] Build funziona senza errori TypeScript
- [ ] Da 319 'any' → ~150 'any' (-53%)

---

### Task 3.3: Refactor God Classes
**Tempo:** 6 ore

#### 3.3.1 Split TokenProcessor

**Creare:** `src/classes/TokenParser.ts`
```typescript
export class TokenParser {
  parse(data: unknown): ParsedTokens {
    // Logica parsing
  }

  detectFormat(data: unknown): 'w3c' | 'token-studio' {
    // Logica detection
  }

  isToken(obj: any): boolean {
    // Logica validazione
  }
}
```

**Creare:** `src/classes/FormatConverter.ts`
```typescript
export class FormatConverter {
  convertToW3C(data: TokenStudioFormat): W3CFormat {
    // Logica conversione Token Studio → W3C
  }

  convertTokenStudioGroup(group: any): any {
    // ...
  }
}
```

**Creare:** `src/classes/ValueProcessor.ts`
```typescript
export class ValueProcessor {
  processValue(value: TokenValue, type: string): ProcessedValue {
    // Delega a processor specifici
    const processor = this.getProcessor(type);
    return processor.process(value);
  }

  private getProcessor(type: string): ValueProcessorInterface {
    // Strategy pattern
  }
}
```

**Modificare:** `src/classes/TokenProcessor.ts`
```typescript
// DOPO: Diventa orchestratore
export class TokenProcessor {
  constructor(
    private parser: TokenParser,
    private converter: FormatConverter,
    private valueProcessor: ValueProcessor,
    private aliasResolver: AdvancedAliasResolver
  ) {}

  async processTokensForImport(data: unknown): Promise<ProcessingResult> {
    const parsed = this.parser.parse(data);
    const converted = this.converter.convertToW3C(parsed);
    const processed = this.valueProcessor.processValues(converted);
    const resolved = await this.aliasResolver.resolveAliases(processed);
    return resolved;
  }
}
```

**✅ Checklist:**
- [ ] TokenParser creato
- [ ] FormatConverter creato
- [ ] ValueProcessor creato
- [ ] TokenProcessor refactorato (orchestratore)
- [ ] Build funziona
- [ ] Import tokens funziona

---

#### 3.3.2 Split CSSExporter

**Creare:** `src/classes/CSSNameGenerator.ts`
```typescript
export class CSSNameGenerator {
  generateClassName(tokenName: string): string {
    // Logica naming
  }

  sanitizeSelector(name: string): string {
    // Sanitization
  }
}
```

**Creare:** `src/classes/CSSValueFormatter.ts`
```typescript
export class CSSValueFormatter {
  formatValue(value: any, type: string): string {
    // Formattazione CSS
  }
}
```

**Modificare:** `src/classes/CSSExporter.ts`
```typescript
// DOPO: Usa composition
export class CSSExporter {
  constructor(
    private nameGenerator: CSSNameGenerator,
    private valueFormatter: CSSValueFormatter
  ) {}

  async exportToCSS(options: CSSExportOptions): Promise<ExportResult> {
    // Orchestrazione
  }
}
```

**✅ Checklist:**
- [ ] CSSNameGenerator creato
- [ ] CSSValueFormatter creato
- [ ] CSSExporter refactorato
- [ ] Build funziona
- [ ] Export CSS funziona

---

### Task 3.4: Refactor Long Methods
**Tempo:** 4 ore

#### handleExportTextStyles (136 righe → 4 funzioni)

**Creare funzioni helper:**
```typescript
async function buildVariableMapIfNeeded(
  preserveAliases: boolean
): Promise<Map<string, Variable> | undefined> {
  if (!preserveAliases) return undefined;

  const variableMap = new Map<string, Variable>();
  const collections = await figma.variables.getLocalVariableCollectionsAsync();

  for (const collection of collections) {
    const variables = await Promise.all(
      collection.variableIds.map(id => figma.variables.getVariableByIdAsync(id))
    );

    variables.forEach(variable => {
      if (variable) variableMap.set(variable.id, variable);
    });
  }

  return variableMap;
}

function filterStylesByProperties(
  styles: ExtractedTextStyle[],
  properties: string[]
): ExtractedTextStyle[] {
  if (!properties || properties.length === 0) return styles;

  return styles.map(style => {
    const filtered: any = { name: style.name };
    properties.forEach(prop => {
      if (prop in style) {
        filtered[prop] = style[prop];
      }
    });
    return filtered;
  });
}

function formatAndSendResult(
  styles: ExtractedTextStyle[],
  format: string,
  stats: any
) {
  const formattedResult = textStyleExtractor.formatTextStyles(styles, format);

  figma.ui.postMessage({
    type: MESSAGE_TYPES.TEXT_STYLES_RESULT,
    success: true,
    message: `Successfully exported ${stats.totalProcessed} text styles`,
    data: formattedResult.data,
    filename: formattedResult.filename,
    format,
    stats
  });
}
```

**Refactorare handleExportTextStyles:**
```typescript
async function handleExportTextStyles(msg: any): Promise<void> {
  try {
    const { format = 'json', preserveAliases = false, selectedProperties } = msg;

    // 1. Build variable map
    const variableMap = await buildVariableMapIfNeeded(preserveAliases);

    // 2. Extract styles
    const result = await textStyleExtractor.extractTextStyles({
      preserveAliases,
      variableMap,
      includeHidden: msg.includeHidden
    });

    // 3. Filter properties
    let styles = result.styles;
    if (selectedProperties?.length > 0) {
      styles = filterStylesByProperties(styles, selectedProperties);
    }

    // 4. Format and send
    formatAndSendResult(styles, format, {
      totalProcessed: result.totalProcessed,
      successCount: result.successCount,
      errorCount: result.errorCount,
      errors: result.errors
    });

  } catch (error) {
    logger.error('Export text styles failed:', error);
    figma.ui.postMessage({
      type: MESSAGE_TYPES.ERROR,
      message: `Export failed: ${error}`
    });
  }
}
```

**✅ Checklist:**
- [ ] Helper functions create
- [ ] handleExportTextStyles refactorato (136 → 40 righe)
- [ ] Build funziona
- [ ] Export text styles funziona

---

**🎉 Risultato FASE 3:**
- ✅ Zero console.log in produzione
- ✅ Uso 'any' ridotto del 53%
- ✅ God classes splittate e modulari
- ✅ Long methods refactorati
- ✅ Type coverage: 60% → 85%
- ✅ Code maintainability score: +70%

---

## 🎨 FASE 4: UI Refactoring
**Priorità:** MEDIUM
**Tempo stimato:** 4-5 giorni
**Obiettivo:** Spezzare monolite ui.html (11.958 righe)

### Task 4.1: Setup Vite per UI
**Tempo:** 2 ore

```bash
npm install --save-dev vite @vitejs/plugin-html
```

**Creare:** `vite.config.js`
```javascript
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: './ui',
  build: {
    outDir: '../dist',
    emptyOutDir: false,
    rollupOptions: {
      input: {
        ui: resolve(__dirname, 'ui/index.html')
      }
    }
  },
  server: {
    port: 3000
  }
});
```

**Creare struttura:**
```bash
mkdir -p ui/src/controllers
mkdir -p ui/src/components
mkdir -p ui/src/styles
mkdir -p ui/src/utils
```

**✅ Checklist:**
- [ ] Vite installato
- [ ] vite.config.js creato
- [ ] Struttura cartelle creata

---

### Task 4.2: Estrarre HTML structure
**Tempo:** 2 ore

**Creare:** `ui/index.html` (versione pulita)
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Clara Plugin</title>
  <link rel="stylesheet" href="./src/styles/main.css">
</head>
<body>
  <div id="app">
    <!-- HTML structure qui - estratto da ui.html originale -->
  </div>

  <script type="module" src="./src/main.ts"></script>
</body>
</html>
```

**Estrarre CSS:** `ui/src/styles/main.css`
```css
/* Estrarre tutte le regole CSS da ui.html originale */
/* Organizzare in sezioni logiche */
```

**✅ Checklist:**
- [ ] ui/index.html creato (~500 righe)
- [ ] CSS estratto in main.css (~3000 righe)
- [ ] HTML structure pulita

---

### Task 4.3: Modularizzare JavaScript
**Tempo:** 8 ore

**Creare:** `ui/src/main.ts`
```typescript
import { ImportController } from './controllers/ImportController';
import { ExportController } from './controllers/ExportController';
import { MessageHandler } from './utils/MessageHandler';

class App {
  private importController: ImportController;
  private exportController: ExportController;
  private messageHandler: MessageHandler;

  constructor() {
    this.importController = new ImportController();
    this.exportController = new ExportController();
    this.messageHandler = new MessageHandler();

    this.init();
  }

  private init() {
    this.setupEventListeners();
    this.setupMessageListener();
    this.notifyReady();
  }

  private setupEventListeners() {
    // Setup UI event listeners
    document.getElementById('import-btn')?.addEventListener('click', () => {
      this.importController.handleImport();
    });

    document.getElementById('export-btn')?.addEventListener('click', () => {
      this.exportController.handleExport();
    });
  }

  private setupMessageListener() {
    window.onmessage = (event) => {
      this.messageHandler.handle(event.data.pluginMessage);
    };
  }

  private notifyReady() {
    parent.postMessage({ pluginMessage: { type: 'ui-ready' } }, '*');
  }
}

// Initialize app
new App();
```

**Creare:** `ui/src/controllers/ImportController.ts`
```typescript
export class ImportController {
  handleImport() {
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    const file = fileInput.files?.[0];

    if (!file) {
      alert('Please select a file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const json = e.target?.result as string;
      this.sendImportMessage(json);
    };
    reader.readAsText(file);
  }

  private sendImportMessage(json: string) {
    parent.postMessage({
      pluginMessage: {
        type: 'import-json',
        json
      }
    }, '*');
  }
}
```

**Creare:** `ui/src/controllers/ExportController.ts`
```typescript
export class ExportController {
  handleExport() {
    const format = this.getSelectedFormat();

    parent.postMessage({
      pluginMessage: {
        type: 'export-variables',
        format
      }
    }, '*');
  }

  private getSelectedFormat(): string {
    const select = document.getElementById('export-format') as HTMLSelectElement;
    return select.value;
  }
}
```

**Creare:** `ui/src/utils/MessageHandler.ts`
```typescript
export class MessageHandler {
  private handlers: Record<string, (data: any) => void> = {
    'export-result': this.handleExportResult.bind(this),
    'import-result': this.handleImportResult.bind(this),
    'progress-update': this.handleProgressUpdate.bind(this),
    'error': this.handleError.bind(this)
  };

  handle(message: any) {
    const handler = this.handlers[message.type];
    if (handler) {
      handler(message);
    } else {
      console.warn(`Unknown message type: ${message.type}`);
    }
  }

  private handleExportResult(data: any) {
    // Handle export result
    this.downloadFile(data.data, data.filename);
  }

  private handleImportResult(data: any) {
    // Handle import result
    alert(data.message);
  }

  private handleProgressUpdate(data: any) {
    // Update progress bar
    const progressBar = document.getElementById('progress-bar');
    if (progressBar) {
      progressBar.style.width = `${data.progress}%`;
    }
  }

  private handleError(data: any) {
    alert(`Error: ${data.message}`);
  }

  private downloadFile(content: string, filename: string) {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
```

**✅ Checklist:**
- [ ] main.ts creato (entry point)
- [ ] ImportController creato
- [ ] ExportController creato
- [ ] MessageHandler creato
- [ ] Event listeners configurati
- [ ] Message handling funziona

---

### Task 4.4: Build UI con Vite
**Tempo:** 1 ora

**Aggiornare package.json:**
```json
{
  "scripts": {
    "build": "esbuild src/main.ts --bundle --outfile=code.js --platform=neutral --target=es2017 --format=iife && npm run build:ui",
    "build:ui": "vite build",
    "dev": "npm run dev:plugin & npm run dev:ui",
    "dev:plugin": "esbuild src/main.ts --bundle --outfile=code.js --platform=neutral --target=es2017 --format=iife --watch",
    "dev:ui": "vite"
  }
}
```

**Testare:**
```bash
npm run build:ui
# Verifica che dist/index.html sia generato
```

**Aggiornare manifest.json:**
```json
{
  "ui": "dist/index.html"
}
```

**✅ Checklist:**
- [ ] Build UI funziona
- [ ] dist/index.html generato
- [ ] manifest.json aggiornato
- [ ] Plugin carica UI correttamente
- [ ] Tutte le funzionalità UI funzionano

---

### Task 4.5: Event delegation e DOM optimization
**Tempo:** 3 ore

**Ottimizzare liste lunghe con event delegation:**
```typescript
// ui/src/components/TokenList.ts
export class TokenList {
  private container: HTMLElement;

  constructor(containerId: string) {
    this.container = document.getElementById(containerId)!;
    this.setupEventDelegation();
  }

  private setupEventDelegation() {
    // GOOD: Un solo event listener per tutta la lista
    this.container.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;

      if (target.classList.contains('token-item')) {
        this.handleTokenClick(target.dataset.tokenId!);
      }

      if (target.classList.contains('token-delete')) {
        this.handleTokenDelete(target.dataset.tokenId!);
      }
    });
  }

  render(tokens: Token[]) {
    // GOOD: Batch DOM update con DocumentFragment
    const fragment = document.createDocumentFragment();

    tokens.forEach(token => {
      const div = document.createElement('div');
      div.className = 'token-item';
      div.dataset.tokenId = token.id;
      div.textContent = token.name;
      fragment.appendChild(div);
    });

    // Single reflow
    this.container.innerHTML = '';
    this.container.appendChild(fragment);
  }

  private handleTokenClick(tokenId: string) {
    // Handle click
  }

  private handleTokenDelete(tokenId: string) {
    // Handle delete
  }
}
```

**✅ Checklist:**
- [ ] Event delegation implementato
- [ ] DOM updates ottimizzati (DocumentFragment)
- [ ] Nessun memory leak (event listeners puliti)
- [ ] Performance test: 1000 tokens renderizzati velocemente

---

**🎉 Risultato FASE 4:**
- ✅ ui.html: 11.958 → 500 righe (-95%)
- ✅ UI modulare con TypeScript
- ✅ Build system moderno (Vite)
- ✅ Hot reload durante sviluppo
- ✅ Performance UI migliorata
- ✅ Manutenibilità UI +90%

---

## 🧪 FASE 5: Testing Essenziale
**Priorità:** MEDIUM
**Tempo stimato:** 3-4 giorni
**Obiettivo:** Test coverage 40-50% per codice critico

### Task 5.1: Setup Jest
**Tempo:** 1 ora

```bash
npm install --save-dev jest ts-jest @types/jest
npm install --save-dev @figma/plugin-typings
```

**Creare:** `jest.config.js`
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/main.ts',
    '!src/main-figma.ts.backup'
  ],
  coverageThreshold: {
    global: {
      branches: 40,
      functions: 40,
      lines: 40,
      statements: 40
    }
  }
};
```

**Aggiornare package.json:**
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

**✅ Checklist:**
- [ ] Jest installato
- [ ] jest.config.js creato
- [ ] Test script funziona: `npm test`

---

### Task 5.2: Test AdvancedAliasResolver
**Tempo:** 3 ore

**Creare:** `tests/AdvancedAliasResolver.test.ts`
```typescript
import { AdvancedAliasResolver } from '../src/classes/AdvancedAliasResolver';

describe('AdvancedAliasResolver', () => {
  let resolver: AdvancedAliasResolver;

  beforeEach(() => {
    resolver = new AdvancedAliasResolver();
  });

  afterEach(() => {
    resolver.clearCache();
  });

  describe('resolveAlias', () => {
    it('should resolve simple alias', async () => {
      const result = await resolver.resolveAlias('{color.primary}', {
        format: 'css',
        variableMap: new Map()
      });

      expect(result.resolved).toBe(true);
      expect(result.value).toBeDefined();
    });

    it('should handle circular references', async () => {
      // Test circular reference detection
      const result = await resolver.resolveAlias('{color.a}', {
        format: 'css',
        variableMap: new Map()
      });

      expect(result.error).toContain('Circular');
    });

    it('should respect max depth', async () => {
      const result = await resolver.resolveAlias('{deeply.nested.alias}', {
        format: 'css',
        maxDepth: 2
      });

      expect(result.error).toContain('depth');
    });
  });

  describe('cache', () => {
    it('should cache resolved aliases', async () => {
      const alias = '{color.primary}';

      // First call
      await resolver.resolveAlias(alias, { format: 'css' });

      // Second call should use cache
      const start = Date.now();
      await resolver.resolveAlias(alias, { format: 'css' });
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(10); // Should be instant from cache
    });

    it('should clear cache', async () => {
      await resolver.resolveAlias('{color.primary}', { format: 'css' });

      resolver.clearCache();

      // Cache should be empty
      // Next call should not use cache
    });
  });
});
```

**✅ Checklist:**
- [ ] Test file creato
- [ ] Test passano: `npm test`
- [ ] Coverage >80% per AdvancedAliasResolver

---

### Task 5.3: Test ColorUtils
**Tempo:** 2 ore

**Creare:** `tests/colorUtils.test.ts`
```typescript
import { parseColor, parseHexColor, rgbToHex } from '../src/utils/colorUtils';

describe('colorUtils', () => {
  describe('parseHexColor', () => {
    it('should parse 6-digit hex', () => {
      const result = parseHexColor('#FF0000');
      expect(result).toEqual({ r: 1, g: 0, b: 0 });
    });

    it('should parse 3-digit hex', () => {
      const result = parseHexColor('#F00');
      expect(result).toEqual({ r: 1, g: 0, b: 0 });
    });

    it('should parse 8-digit hex with alpha', () => {
      const result = parseHexColor('#FF0000FF');
      expect(result).toEqual({ r: 1, g: 0, b: 0, a: 1 });
    });

    it('should throw on invalid hex', () => {
      expect(() => parseHexColor('invalid')).toThrow();
      expect(() => parseHexColor('#GG0000')).toThrow();
    });
  });

  describe('parseColor', () => {
    it('should parse RGB object', () => {
      const result = parseColor({ r: 1, g: 0, b: 0 });
      expect(result).toEqual({ r: 1, g: 0, b: 0 });
    });

    it('should parse hex string', () => {
      const result = parseColor('#FF0000');
      expect(result).toEqual({ r: 1, g: 0, b: 0 });
    });

    it('should parse rgb() string', () => {
      const result = parseColor('rgb(255, 0, 0)');
      expect(result).toEqual({ r: 1, g: 0, b: 0 });
    });
  });

  describe('rgbToHex', () => {
    it('should convert RGB to hex', () => {
      const result = rgbToHex({ r: 1, g: 0, b: 0 });
      expect(result).toBe('#ff0000');
    });

    it('should convert RGBA to hex', () => {
      const result = rgbToHex({ r: 1, g: 0, b: 0, a: 0.5 });
      expect(result).toBe('#ff000080');
    });
  });
});
```

**✅ Checklist:**
- [ ] Test file creato
- [ ] Test passano
- [ ] Coverage >90% per colorUtils

---

### Task 5.4: Test TokenProcessor
**Tempo:** 4 hours

**Creare:** `tests/TokenProcessor.test.ts`
```typescript
import { TokenProcessor } from '../src/classes/TokenProcessor';

describe('TokenProcessor', () => {
  let processor: TokenProcessor;

  beforeEach(() => {
    processor = new TokenProcessor();
  });

  describe('processTokensForImport', () => {
    it('should process W3C format tokens', async () => {
      const input = {
        color: {
          primary: {
            $type: 'color',
            $value: '#FF0000'
          }
        }
      };

      const result = await processor.processTokensForImport(input);

      expect(result.success).toBe(true);
      expect(result.tokens.length).toBeGreaterThan(0);
    });

    it('should detect Token Studio format', async () => {
      const input = {
        color: {
          primary: {
            value: '#FF0000',
            type: 'color'
          }
        }
      };

      const result = await processor.processTokensForImport(input);

      expect(result.success).toBe(true);
    });

    it('should handle invalid input', async () => {
      const result = await processor.processTokensForImport(null);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('processTokenValue', () => {
    it('should process color value', () => {
      const result = processor['processTokenValue']('#FF0000', 'color');
      expect(result).toEqual({ r: 1, g: 0, b: 0 });
    });

    it('should process number value', () => {
      const result = processor['processTokenValue']('16px', 'dimension');
      expect(result).toBe(16);
    });
  });
});
```

**✅ Checklist:**
- [ ] Test file creato
- [ ] Test passano
- [ ] Coverage >60% per TokenProcessor

---

### Task 5.5: Test validationUtils
**Tempo:** 2 ore

**Creare:** `tests/validationUtils.test.ts`
```typescript
import { validateValueForVariableType, convertTypeToFigma } from '../src/utils/validationUtils';

describe('validationUtils', () => {
  describe('convertTypeToFigma', () => {
    it('should convert color type', () => {
      expect(convertTypeToFigma('color')).toBe('COLOR');
    });

    it('should convert number types', () => {
      expect(convertTypeToFigma('number')).toBe('FLOAT');
      expect(convertTypeToFigma('dimension')).toBe('FLOAT');
      expect(convertTypeToFigma('size')).toBe('FLOAT');
    });

    it('should return null for unknown type', () => {
      expect(convertTypeToFigma('unknown')).toBeNull();
    });
  });

  describe('validateValueForVariableType', () => {
    it('should validate COLOR value', () => {
      const result = validateValueForVariableType({ r: 1, g: 0, b: 0 }, 'COLOR');
      expect(result).toEqual({ r: 1, g: 0, b: 0 });
    });

    it('should validate FLOAT value', () => {
      const result = validateValueForVariableType(42, 'FLOAT');
      expect(result).toBe(42);
    });

    it('should throw on invalid COLOR', () => {
      expect(() => validateValueForVariableType('invalid', 'COLOR')).toThrow();
    });
  });
});
```

**✅ Checklist:**
- [ ] Test file creato
- [ ] Test passano
- [ ] Coverage >80% per validationUtils

---

### Task 5.6: Run coverage report
**Tempo:** 30 minuti

```bash
npm run test:coverage
```

**Analizzare report:**
- Verifica coverage >40% globale
- Identifica aree non testate
- Prioritizza test per codice critico

**✅ Checklist:**
- [ ] Coverage report generato
- [ ] Coverage globale >40%
- [ ] Coverage funzioni critiche >60%
- [ ] Report salvato in coverage/

---

**🎉 Risultato FASE 5:**
- ✅ Test framework configurato (Jest)
- ✅ Test coverage: 0% → 40-50%
- ✅ Componenti critici testati
- ✅ CI-ready (può essere integrato in pipeline)
- ✅ Regression protection

---

## 🎨 FASE 6: Polish e Ottimizzazioni Finali
**Priorità:** LOW
**Tempo stimato:** 2-3 giorni
**Obiettivo:** Cleanup finale, documentazione

### Task 6.1: Dependency Injection
**Tempo:** 3 ore

**Creare:** `src/di/container.ts`
```typescript
import { AdvancedAliasResolver } from '../classes/AdvancedAliasResolver';
import { TokenParser } from '../classes/TokenParser';
import { FormatConverter } from '../classes/FormatConverter';
import { ValueProcessor } from '../classes/ValueProcessor';
import { TokenProcessor } from '../classes/TokenProcessor';

export class DIContainer {
  private static instance: DIContainer;
  private services = new Map<string, any>();

  private constructor() {
    this.registerServices();
  }

  static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }

  private registerServices() {
    // Register singletons
    this.services.set('AliasResolver', new AdvancedAliasResolver());
    this.services.set('TokenParser', new TokenParser());
    this.services.set('FormatConverter', new FormatConverter());
    this.services.set('ValueProcessor', new ValueProcessor());

    // Register with dependencies
    this.services.set('TokenProcessor', new TokenProcessor(
      this.get('TokenParser'),
      this.get('FormatConverter'),
      this.get('ValueProcessor'),
      this.get('AliasResolver')
    ));
  }

  get<T>(serviceName: string): T {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service ${serviceName} not found`);
    }
    return service;
  }
}

// Export singleton getter
export const container = DIContainer.getInstance();
```

**Uso nel main.ts:**
```typescript
import { container } from './di/container';

// Invece di:
const tokenProcessor = new TokenProcessor();

// Usa:
const tokenProcessor = container.get<TokenProcessor>('TokenProcessor');
```

**✅ Checklist:**
- [ ] DIContainer creato
- [ ] Services registrati
- [ ] main.ts usa DI
- [ ] Build funziona

---

### Task 6.2: Error handling uniforme
**Tempo:** 3 ore

**Verificare che ProductionErrorHandler sia usato ovunque:**
```typescript
// Pattern da seguire in TUTTE le funzioni async critiche
import { productionErrorHandler } from './classes/ProductionErrorHandler';

async function criticalOperation() {
  try {
    // operation
  } catch (error) {
    const handled = await productionErrorHandler.handleError(
      error as Error,
      'operation_category',
      { context: 'additional info' },
      0 // attempt number
    );

    if (!handled.recovered) {
      throw error;
    }
  }
}
```

**Aggiungere Promise rejection handling:**
```typescript
// In main.ts, dopo figma.showUI
window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled promise rejection:', event.reason);
  productionErrorHandler.handleError(
    event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
    'unhandled_rejection',
    {},
    0
  );
});
```

**✅ Checklist:**
- [ ] ProductionErrorHandler usato uniformemente
- [ ] Unhandled rejection handler aggiunto
- [ ] Tutti i Promise hanno .catch() o try-catch
- [ ] Build funziona

---

### Task 6.3: Constants e magic numbers
**Tempo:** 2 ore

**Creare:** `src/constants/performance.ts`
```typescript
export const PERFORMANCE_LIMITS = {
  MAX_ALIAS_DEPTH: 10,
  DEFAULT_BATCH_SIZE: 10,
  MAX_CACHE_ENTRIES: 500,
  CACHE_TTL_MS: 10 * 60 * 1000,  // 10 minutes
  CHUNK_SIZE_BYTES: 100 * 1024,   // 100 KB
  LOADER_COMPLETION_DELAY_MS: 150
} as const;
```

**Creare:** `src/constants/ui.ts`
```typescript
export const UI_CONSTRAINTS = {
  MIN_WIDTH: 400,
  MIN_HEIGHT: 300,
  MAX_WIDTH: 2000,
  MAX_HEIGHT: 1500,
  DEFAULT_WIDTH: 800,
  DEFAULT_HEIGHT: 600
} as const;
```

**Sostituire magic numbers in tutti i file:**
```typescript
// PRIMA:
const batchSize = options.batchSize || 10;
const maxDepth = 10;

// DOPO:
import { PERFORMANCE_LIMITS } from '../constants/performance';
const batchSize = options.batchSize || PERFORMANCE_LIMITS.DEFAULT_BATCH_SIZE;
const maxDepth = PERFORMANCE_LIMITS.MAX_ALIAS_DEPTH;
```

**✅ Checklist:**
- [ ] performance.ts creato
- [ ] ui.ts creato
- [ ] Magic numbers sostituiti
- [ ] Build funziona

---

### Task 6.4: Input sanitization
**Tempo:** 2 ore

**Creare:** `src/utils/sanitization.ts`
```typescript
export function sanitizeJSON(data: unknown, maxDepth = 50): unknown {
  function sanitizeRecursive(value: unknown, depth: number): unknown {
    if (depth > maxDepth) {
      throw new Error(`JSON too deeply nested (max depth: ${maxDepth})`);
    }

    if (value === null || typeof value !== 'object') {
      return value;
    }

    if (Array.isArray(value)) {
      return value.map(item => sanitizeRecursive(item, depth + 1));
    }

    const sanitized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      // Block prototype pollution
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }

      // Limit key length
      if (key.length > 100) {
        continue;
      }

      sanitized[key] = sanitizeRecursive(val, depth + 1);
    }

    return sanitized;
  }

  return sanitizeRecursive(data, 0);
}

export function sanitizeCSSSelector(name: string): string {
  return name
    .replace(/[^a-z0-9-_]/gi, '-')
    .replace(/^[^a-z]/i, 'token-')
    .toLowerCase();
}
```

**Usare in handleImportJson:**
```typescript
async function handleImportJson(msg: any): Promise<void> {
  try {
    const jsonData = JSON.parse(msg.json);
    const sanitized = sanitizeJSON(jsonData);

    const result = await simpleImportVariables(sanitized);
    // ...
  }
}
```

**✅ Checklist:**
- [ ] sanitization.ts creato
- [ ] JSON sanitization implementata
- [ ] CSS selector sanitization implementata
- [ ] Usato in tutti gli input points
- [ ] Build funziona

---

### Task 6.5: Documentazione
**Tempo:** 3 ore

**Creare:** `README.md`
```markdown
# Clara Plugin - Figma Design Tokens

Plugin Figma per import/export di design tokens nel formato W3C e Token Studio.

## Features

- Import tokens da JSON (W3C, Token Studio)
- Export tokens in multiple formati (JSON, CSS, SCSS)
- Extract text styles da Figma
- Alias resolution avanzata
- Cache performance

## Development

### Setup
\`\`\`bash
npm install
\`\`\`

### Build
\`\`\`bash
npm run build
\`\`\`

### Development Mode
\`\`\`bash
npm run dev
\`\`\`

### Testing
\`\`\`bash
npm test
npm run test:coverage
\`\`\`

## Architecture

- \`src/main.ts\` - Entry point
- \`src/classes/\` - Core business logic
- \`src/utils/\` - Utility functions
- \`src/constants/\` - Configuration constants
- \`ui/\` - User interface

## Build System

- **Plugin**: esbuild (TypeScript → single JS file)
- **UI**: Vite (TypeScript + HTML + CSS)
- **Testing**: Jest

## Performance

- Import 1000 tokens: ~2-3s
- Export CSS: ~1-2s
- LRU cache for alias resolution
- Chunked message passing for large payloads
```

**Aggiungere JSDoc comments ai metodi pubblici:**
```typescript
/**
 * Resolves a token alias to its final value.
 *
 * @param aliasValue - The alias string (e.g., "{color.primary}")
 * @param options - Resolution options
 * @returns Promise with resolved value and metadata
 *
 * @example
 * ```typescript
 * const result = await resolver.resolveAlias('{color.primary}', {
 *   format: 'css',
 *   maxDepth: 10
 * });
 * ```
 */
async resolveAlias(
  aliasValue: string,
  options: AliasResolutionOptions = {}
): Promise<AliasResolutionResult> {
  // ...
}
```

**Creare:** `ARCHITECTURE.md`
```markdown
# Architecture Overview

## Component Diagram

\`\`\`
┌─────────────┐
│   main.ts   │ (Entry Point)
└──────┬──────┘
       │
       ├─────► TokenProcessor (Orchestrator)
       │         ├─► TokenParser
       │         ├─► FormatConverter
       │         ├─► ValueProcessor
       │         └─► AdvancedAliasResolver
       │
       ├─────► VariableManager
       ├─────► VariableExporter
       ├─────► CSSExporter
       └─────► TextStyleExtractor
\`\`\`

## Data Flow

1. UI sends message → main.ts
2. main.ts delegates to appropriate handler
3. Handler uses services (TokenProcessor, etc.)
4. Services process data
5. Result sent back to UI

## Performance Optimizations

- LRU cache (500 entries, 10min TTL)
- Parallel async operations (Promise.all)
- Chunked message passing (100KB chunks)
- Map-based lookups (O(1) instead of O(n))
```

**✅ Checklist:**
- [ ] README.md creato
- [ ] ARCHITECTURE.md creato
- [ ] JSDoc comments aggiunti
- [ ] Code examples provided

---

**🎉 Risultato FASE 6:**
- ✅ Dependency injection implementato
- ✅ Error handling robusto e uniforme
- ✅ Magic numbers eliminati
- ✅ Input sanitization implementata
- ✅ Documentazione completa
- ✅ Codebase production-ready

---

## ✅ CHECKLIST FINALE

### Pre-deployment
- [ ] Tutti i test passano (`npm test`)
- [ ] Coverage >40% (`npm run test:coverage`)
- [ ] Build senza errori (`npm run build`)
- [ ] Plugin testato in Figma (import/export)
- [ ] UI testata (tutte le funzionalità)
- [ ] Performance verificata (import 1000 tokens <3s)
- [ ] Memory leaks verificati (nessun leak dopo 1h uso)
- [ ] Error handling testato (scenari error comuni)

### Code Quality
- [ ] Zero console.log in produzione
- [ ] Uso 'any' <150 occorrenze
- [ ] Nessun file >1000 righe
- [ ] Tutti i magic numbers sostituiti
- [ ] Type coverage >85%
- [ ] ESLint passa senza warning

### Documentation
- [ ] README.md aggiornato
- [ ] ARCHITECTURE.md creato
- [ ] JSDoc per API pubbliche
- [ ] Changelog aggiornato

### Git
- [ ] Commit organizzati per fase
- [ ] Branch feature creati
- [ ] PR review completato
- [ ] Merge to main

---

## 📈 METRICHE FINALI ATTESE

| Metrica | Prima | Dopo | ✅ |
|---------|-------|------|----|
| Righe duplicate | 2.800 | 0 | -100% |
| File più grande | 5.739 | ~500 | -91% |
| File UI | 11.958 | ~500 | -95% |
| console.log | 256 | 0 | -100% |
| Uso 'any' | 319 | ~150 | -53% |
| Import 1k tokens | 5-10s | 2-3s | -60% |
| Export CSS | 4-6s | 1-2s | -75% |
| Type coverage | 60% | 85% | +42% |
| Test coverage | 0% | 40% | +40% |
| Build size | ~600KB | ~200KB | -67% |

---

## 🚀 QUICK START QUESTA SERA

**Se hai poco tempo, inizia con i Quick Wins:**

### Quick Wins (2-3 ore)
1. **Setup esbuild** (30 min) - Task 1.1
2. **Test build** (30 min) - Task 1.3
3. **LRU cache** (1 ora) - Task 2.1
4. **Logger setup** (1 ora) - Task 3.1

**Risultato:** Architettura modulare + Performance boost + Zero console.log produzione

---

## 🆘 TROUBLESHOOTING

### Build errors
```bash
# Pulire e ricostruire
npm run clean
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Plugin non carica
- Verifica manifest.json
- Check che code.js esista
- Verifica console Figma (Plugins → Development → Console)

### UI non funziona
- Verifica dist/index.html generato
- Check browser console
- Verifica message passing (Figma ↔ UI)

### Test falliscono
```bash
# Run singolo test
npm test -- AdvancedAliasResolver.test.ts

# Debug test
node --inspect-brk node_modules/.bin/jest --runInBand
```

---

## 📞 SUPPORTO

Se incontri problemi durante il refactoring, controlla:
1. Log di build (`npm run build`)
2. Test output (`npm test`)
3. Browser/Figma console
4. Questo documento per reference

---

**Good luck! 🎉**

Inizia con la FASE 1 e procedi sequenzialmente. Ogni fase è autocontenuta e testabile.