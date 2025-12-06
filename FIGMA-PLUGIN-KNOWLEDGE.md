# Figma Plugin Development - Knowledge Base

> Documento di reference per sviluppare plugin Figma professionali
> Creato per: Orbit Station Plugin
> Data: 2025-12-05

---

## 🎯 Core Development Principles

### 1. User Experience First
- **Immediate feedback**: Loading states, progress indicators, clear error messages
- **Intuitive UI**: Clear labels, logical grouping, familiar patterns from Figma
- **Responsive design**: Handle edge cases gracefully, validate all inputs
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support

### 2. Clean Architecture
- **Separation of concerns**: UI logic separate from Figma API logic
- **Single responsibility**: Each function does one thing well
- **Predictable state**: Clear data flow, type-safe state management
- **Error boundaries**: Catch and handle errors appropriately

### 3. Performance
- **Async operations**: Never block the main thread
- **Batch processing**: Group Figma API calls
- **Debounce/throttle**: Rate-limit expensive operations
- **Memory efficiency**: Clean up references, process incrementally

---

## 📁 Plugin Architecture

### Standard Structure (Simple Plugins)

```
plugin-name/
├── manifest.json
├── code.ts          # Plugin logic
├── ui.html          # UI
└── styles.css
```

### Advanced Structure (Complex Plugins - RECOMMENDED)

```
plugin-name/
├── manifest.json
├── package.json
├── tsconfig.json
├── src/
│   ├── code.ts              # Entry point (plugin side)
│   ├── plugin/              # Plugin-side code ONLY
│   │   ├── classes/
│   │   ├── utils/
│   │   ├── types/
│   │   └── constants/
│   └── ui/                  # UI-side code ONLY
│       ├── index.html
│       ├── App.tsx
│       ├── components/
│       ├── hooks/
│       ├── store/
│       └── styles/
└── build/
    ├── code.js          # Compiled plugin
    └── ui.html          # Compiled UI
```

**⚠️ CRITICAL**: Plugin code and UI code MUST be completely separated!
- Plugin code: Has access to `figma.*` APIs, runs in plugin sandbox
- UI code: Has access to `window`, `document`, runs in iframe
- **NEVER mix them** or you'll get runtime errors!

---

## 🔧 Build Configuration

### manifest.json

```json
{
  "name": "Plugin Name",
  "id": "unique-id",
  "api": "1.0.0",
  "main": "build/code.js",      // Plugin entry
  "ui": "build/ui.html",         // UI entry
  "editorType": ["figma"],
  "networkAccess": {
    "allowedDomains": [
      "https://api.github.com"
    ]
  },
  "capabilities": [],
  "permissions": []
}
```

### tsconfig.json (Root - Shared)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "lib": ["ES2020"],
    "moduleResolution": "node",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "typeRoots": ["./node_modules/@types", "./node_modules/@figma"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "build"]
}
```

### tsconfig.plugin.json (Plugin Code ONLY)

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "build",
    "jsx": "preserve",
    "types": ["@figma/plugin-typings"]
  },
  "include": ["src/code.ts", "src/plugin/**/*"],
  "exclude": ["node_modules", "build", "src/ui"]  // ⚠️ MUST exclude UI!
}
```

### vite.config.ts (UI Build with React)

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'path';

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  root: 'src/ui',
  build: {
    target: 'es2017',           // ⚠️ Figma compatibility!
    outDir: '../../build',
    emptyOutDir: false,
    minify: 'esbuild',
    rollupOptions: {
      input: path.resolve(__dirname, 'src/ui/index.html'),
      output: {
        entryFileNames: 'ui.js',
        assetFileNames: 'ui.[ext]',
        format: 'iife'          // ⚠️ MUST be IIFE for Figma!
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  esbuild: {
    target: 'es2017',
    supported: {
      'top-level-await': false  // ⚠️ Figma doesn't support it!
    }
  }
});
```

### package.json Scripts

```json
{
  "scripts": {
    "build": "npm run build:plugin && npm run build:ui",
    "build:plugin": "tsc --project tsconfig.plugin.json",
    "build:ui": "vite build",
    "watch": "npm run watch:plugin & npm run watch:ui",
    "watch:plugin": "tsc --watch --project tsconfig.plugin.json",
    "watch:ui": "vite build --watch",
    "dev": "npm run watch"
  }
}
```

---

## 📨 Message Passing (UI ↔ Plugin)

### Type-Safe Messages

```typescript
// src/plugin/types/messages.ts (Plugin side)

// UI → Plugin messages
export type UIMessage =
  | { type: 'UI_READY' }
  | { type: 'PROCESS_DATA'; data: { items: string[] } }
  | { type: 'CANCEL' };

// Plugin → UI messages
export type PluginMessage =
  | { type: 'INIT_DATA'; data: { collections: any[] } }
  | { type: 'PROGRESS'; current: number; total: number }
  | { type: 'SUCCESS'; message: string }
  | { type: 'ERROR'; message: string; code?: string };

// Helper to send messages to UI
export function sendToUI(message: PluginMessage): void {
  figma.ui.postMessage(message);
}
```

```typescript
// src/ui/utils/messaging.ts (UI side)

export function sendToPlugin(message: any): void {
  if (typeof window !== 'undefined' && window.parent) {
    window.parent.postMessage({ pluginMessage: message }, '*');
  }
}

// In React component
useEffect(() => {
  const handler = (event: MessageEvent) => {
    const msg = event.data.pluginMessage;

    switch (msg.type) {
      case 'PROGRESS':
        setProgress({ current: msg.current, total: msg.total });
        break;
      case 'ERROR':
        showError(msg.message);
        break;
      // ...
    }
  };

  window.addEventListener('message', handler);
  return () => window.removeEventListener('message', handler);
}, []);
```

### Plugin Message Handler

```typescript
// src/code.ts

figma.ui.onmessage = async (msg: UIMessage) => {
  try {
    switch (msg.type) {
      case 'UI_READY':
        await handleUIReady();
        break;
      case 'PROCESS_DATA':
        await handleProcess(msg.data);
        break;
      case 'CANCEL':
        figma.closePlugin();
        break;
      default:
        console.log('[Plugin] Unhandled message:', msg);
    }
  } catch (error) {
    const err = error as Error;
    sendToUI({
      type: 'ERROR',
      message: err.message
    });
  }
};
```

---

## 🎨 Variables API (Design Tokens)

### Key Concepts

```typescript
// Collection = Group of variables
// Mode = Variation (e.g., light/dark theme)
// Variable = Single token with values per mode

// Collection structure:
{
  id: string;
  name: string;
  modes: Array<{ modeId: string; name: string }>;
  variableIds: string[];
}

// Variable structure:
{
  id: string;
  name: string;
  resolvedType: 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN';
  valuesByMode: Record<string, any>;  // modeId → value
  scopes: VariableScope[];
}
```

### ALWAYS Use Async APIs! (⚠️ CRITICAL)

```typescript
// ❌ DEPRECATED - Will be removed!
const collections = figma.variables.getLocalVariableCollections();
const variables = figma.variables.getLocalVariables();
const varById = figma.variables.getVariableById(id);

// ✅ CORRECT - Always use async versions
const collections = await figma.variables.getLocalVariableCollectionsAsync();
const variables = await figma.variables.getLocalVariablesAsync();
const varById = await figma.variables.getVariableByIdAsync(id);
```

### Creating Variables

```typescript
async function createColorVariable(
  collection: VariableCollection,
  name: string,
  color: RGB
): Promise<Variable> {
  // Create variable
  const variable = figma.variables.createVariable(
    name,
    collection.id,
    'COLOR'
  );

  // Set value for each mode
  for (const mode of collection.modes) {
    variable.setValueForMode(mode.modeId, color);
  }

  // Set scopes (where it can be used)
  variable.scopes = ['ALL_FILLS', 'FRAME_FILL', 'STROKE_COLOR'];

  return variable;
}
```

### Variable Aliases (References)

```typescript
// Variable can reference another variable
async function createAliasVariable(
  collection: VariableCollection,
  name: string,
  targetVariableId: string
): Promise<Variable> {
  const variable = figma.variables.createVariable(
    name,
    collection.id,
    'COLOR'
  );

  const targetVar = await figma.variables.getVariableByIdAsync(targetVariableId);

  for (const mode of collection.modes) {
    // Set as alias instead of direct value
    variable.setValueForMode(mode.modeId, {
      type: 'VARIABLE_ALIAS',
      id: targetVariableId
    });
  }

  return variable;
}
```

### Resolving Aliases (Two-Pass System)

```typescript
// ⚠️ IMPORTANT: Aliases must be resolved AFTER all variables are created!

async function importTokens(tokens: any) {
  const collection = figma.variables.createVariableCollection('My Tokens');

  // PASS 1: Create all variables, mark aliases
  const aliasesToResolve: Array<{
    variable: Variable;
    modeId: string;
    targetPath: string;
  }> = [];

  for (const [name, token] of Object.entries(tokens)) {
    const variable = figma.variables.createVariable(
      name,
      collection.id,
      token.$type === 'color' ? 'COLOR' : 'FLOAT'
    );

    for (const mode of collection.modes) {
      if (typeof token.$value === 'string' && token.$value.startsWith('{')) {
        // This is an alias - save for later
        aliasesToResolve.push({
          variable,
          modeId: mode.modeId,
          targetPath: token.$value.slice(1, -1)  // Remove {}
        });
      } else {
        // Direct value
        variable.setValueForMode(mode.modeId, parseValue(token.$value));
      }
    }
  }

  // PASS 2: Resolve all aliases
  for (const alias of aliasesToResolve) {
    const targetVar = findVariableByPath(alias.targetPath);
    if (targetVar) {
      alias.variable.setValueForMode(alias.modeId, {
        type: 'VARIABLE_ALIAS',
        id: targetVar.id
      });
    }
  }
}
```

### Variable Scopes

```typescript
type VariableScope =
  | 'ALL_SCOPES'
  | 'ALL_FILLS'
  | 'FRAME_FILL'
  | 'SHAPE_FILL'
  | 'TEXT_FILL'
  | 'STROKE_COLOR'
  | 'EFFECT_COLOR'
  | 'WIDTH_HEIGHT'
  | 'GAP'
  | 'CORNER_RADIUS'
  | 'TEXT_CONTENT'
  | 'OPACITY'
  | 'FONT_FAMILY'
  | 'FONT_STYLE'
  | 'FONT_WEIGHT'
  | 'FONT_SIZE'
  | 'LINE_HEIGHT'
  | 'LETTER_SPACING'
  | 'PARAGRAPH_SPACING'
  | 'PARAGRAPH_INDENT';

// Assign appropriate scopes
const colorVar = figma.variables.createVariable('primary', collectionId, 'COLOR');
colorVar.scopes = ['ALL_FILLS', 'STROKE_COLOR', 'EFFECT_COLOR'];

const sizeVar = figma.variables.createVariable('spacing', collectionId, 'FLOAT');
sizeVar.scopes = ['WIDTH_HEIGHT', 'GAP'];
```

### Figma Limits

```typescript
export const FIGMA_LIMITS = {
  MAX_COLLECTIONS: 40,
  MAX_MODES_PER_COLLECTION: 20,
  MAX_VARIABLES_PER_COLLECTION: 5000,
  MAX_ALIAS_DEPTH: 10,
  BATCH_SIZE: 50  // For batch processing
} as const;

// Always validate before creating
if (collections.length >= FIGMA_LIMITS.MAX_COLLECTIONS) {
  throw new Error(`Cannot exceed ${FIGMA_LIMITS.MAX_COLLECTIONS} collections`);
}
```

---

## ⚡ Performance Best Practices

### Batch Processing

```typescript
async function batchProcess<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  options: {
    batchSize?: number;
    onProgress?: (current: number, total: number) => void;
  } = {}
): Promise<R[]> {
  const { batchSize = 50, onProgress } = options;
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    // Process batch in parallel
    const batchResults = await Promise.all(
      batch.map(item => processor(item))
    );

    results.push(...batchResults);

    // Report progress to UI
    if (onProgress) {
      onProgress(Math.min(i + batchSize, items.length), items.length);
    }

    // Yield to prevent UI blocking
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  return results;
}
```

### Font Loading

```typescript
async function loadUniqueFonts(textNodes: TextNode[]): Promise<void> {
  const fontsMap = new Map<string, FontName>();

  // Collect unique fonts
  textNodes.forEach(node => {
    if (node.fontName !== figma.mixed) {
      const key = `${node.fontName.family}-${node.fontName.style}`;
      fontsMap.set(key, node.fontName as FontName);
    }
  });

  // Load in parallel with error handling
  await Promise.all(
    Array.from(fontsMap.values()).map(font =>
      figma.loadFontAsync(font).catch(err => {
        console.warn(`Failed to load font ${font.family} ${font.style}:`, err);
        // Store missing fonts for user notification
      })
    )
  );
}
```

---

## 🎨 UI Components Best Practices

### Type-Safe State with Zustand

```typescript
// src/ui/store/appStore.ts
import { create } from 'zustand';

interface AppState {
  isProcessing: boolean;
  progress: { current: number; total: number } | null;
  error: string | null;

  setProcessing: (processing: boolean) => void;
  setProgress: (progress: { current: number; total: number } | null) => void;
  setError: (error: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isProcessing: false,
  progress: null,
  error: null,

  setProcessing: (processing) => set({ isProcessing: processing }),
  setProgress: (progress) => set({ progress }),
  setError: (error) => set({ error })
}));
```

### React Component Pattern

```typescript
// src/ui/components/ProcessButton.tsx
import React from 'react';
import { useAppStore } from '../store/appStore';
import { sendToPlugin } from '../utils/messaging';

export const ProcessButton: React.FC = () => {
  const { isProcessing, progress } = useAppStore();

  const handleClick = () => {
    sendToPlugin({ type: 'PROCESS_DATA', data: { items: [] } });
  };

  const buttonText = isProcessing && progress
    ? `Processing ${Math.round((progress.current / progress.total) * 100)}%`
    : 'Process';

  return (
    <button
      onClick={handleClick}
      disabled={isProcessing}
      className="btn btn--primary"
    >
      {buttonText}
    </button>
  );
};
```

---

## ❌ Common Mistakes & Anti-Patterns

### ❌ Mixing UI and Plugin Code

```typescript
// ❌ WRONG - messages.ts tries to use both 'parent' and 'figma'
export function sendToUI(message: any) {
  parent.postMessage(message, '*');  // ❌ 'parent' doesn't exist in plugin context!
  figma.ui.postMessage(message);     // ❌ 'figma' doesn't exist in UI context!
}

// ✅ CORRECT - Separate files for each context
// src/plugin/types/messages.ts (plugin side)
export function sendToUI(message: PluginMessage): void {
  figma.ui.postMessage(message);
}

// src/ui/utils/messaging.ts (UI side)
export function sendToPlugin(message: UIMessage): void {
  if (typeof window !== 'undefined' && window.parent) {
    window.parent.postMessage({ pluginMessage: message }, '*');
  }
}
```

### ❌ Using Deprecated Sync APIs

```typescript
// ❌ WRONG - Deprecated, will be removed!
const collections = figma.variables.getLocalVariableCollections();

// ✅ CORRECT - Always async
const collections = await figma.variables.getLocalVariableCollectionsAsync();
```

### ❌ Creating Aliases Before Target Variables

```typescript
// ❌ WRONG - Target doesn't exist yet!
const aliasVar = figma.variables.createVariable('alias', collId, 'COLOR');
aliasVar.setValueForMode(modeId, {
  type: 'VARIABLE_ALIAS',
  id: targetId  // ❌ Target not created yet!
});

// ✅ CORRECT - Two-pass system
// Pass 1: Create all variables
const variables = tokens.map(t => createVariable(t));
// Pass 2: Resolve aliases
variables.forEach(v => resolveAliases(v));
```

### ❌ Blocking Operations

```typescript
// ❌ WRONG - Blocks main thread
for (const node of nodes) {
  processNode(node);  // Synchronous operation
}

// ✅ CORRECT - Async with batching
await batchProcess(nodes, async (node) => {
  await processNode(node);
}, { batchSize: 50 });
```

### ❌ Not Handling Errors

```typescript
// ❌ WRONG - Silent failure
try {
  await processData();
} catch (e) {
  console.log('error');  // User sees nothing!
}

// ✅ CORRECT - User feedback
try {
  await processData();
  figma.notify('Success!');
} catch (error) {
  const err = error as Error;
  figma.notify(`Failed: ${err.message}`, { error: true });
  sendToUI({ type: 'ERROR', message: err.message });
}
```

---

## 🧪 Testing Checklist

Before releasing:

- [ ] **Empty selection** - Plugin handles no selection gracefully
- [ ] **Single/multiple layers** - Works with 1 and 100+ layers
- [ ] **Locked/hidden layers** - Doesn't crash on locked layers
- [ ] **Missing fonts** - Shows clear error when fonts unavailable
- [ ] **Large datasets** - 1000+ variables/tokens perform well
- [ ] **Edge cases** - Special characters, extremely long names
- [ ] **Error scenarios** - Network failures, invalid JSON, etc.
- [ ] **Keyboard navigation** - Tab, Enter, Escape work correctly
- [ ] **Screen reader** - ARIA labels present and accurate
- [ ] **Different screen sizes** - UI works on small/large screens
- [ ] **Undo/redo** - Figma's undo system works correctly

---

## 📚 Quick Reference

### Figma API

```typescript
// Selection
const selection = figma.currentPage.selection;

// Find nodes
const texts = figma.currentPage.findAll(n => n.type === 'TEXT') as TextNode[];

// Create
const rect = figma.createRectangle();
figma.currentPage.appendChild(rect);

// Variables (async!)
const collections = await figma.variables.getLocalVariableCollectionsAsync();
const variables = await figma.variables.getLocalVariablesAsync();

// Storage
await figma.clientStorage.setAsync('key', 'value');
const value = await figma.clientStorage.getAsync('key');

// Notify
figma.notify('Done!', { timeout: 2000 });
figma.notify('Error!', { error: true });

// Close
figma.closePlugin('Finished!');
```

### TypeScript Types

```typescript
// Common types
type RGB = { r: number; g: number; b: number };
type RGBA = RGB & { a: number };

type VariableValue =
  | RGB
  | number
  | string
  | boolean
  | { type: 'VARIABLE_ALIAS'; id: string };

// Type guards
function isTextNode(node: SceneNode): node is TextNode {
  return node.type === 'TEXT';
}

function isColorVariable(v: Variable): boolean {
  return v.resolvedType === 'COLOR';
}
```

---

## 🔗 Resources

- **Figma Plugin API**: https://www.figma.com/plugin-docs/
- **Variables API**: https://www.figma.com/plugin-docs/api/Variable/
- **TypeScript**: https://www.typescriptlang.org/
- **React**: https://react.dev/
- **Zustand**: https://zustand-demo.pmnd.rs/

---

## 💡 Key Takeaways for Orbit Station

1. **Separate Plugin and UI code completely** - Never mix contexts!
2. **Always use async Variables APIs** - Sync versions are deprecated
3. **Two-pass alias resolution** - Create all variables first, then resolve aliases
4. **Batch processing for performance** - Don't block the main thread
5. **Type-safe messages** - Use discriminated unions for UI↔Plugin communication
6. **User feedback** - Show progress, handle errors gracefully
7. **Test thoroughly** - Edge cases, large datasets, error scenarios

---

*Created: 2025-12-05*
*For: Orbit Station - Design Tokens Plugin*
