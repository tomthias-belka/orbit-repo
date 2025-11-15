# Clara Plugin - Complete Current State Analysis

> **Document Purpose:** Comprehensive technical analysis of the Clara Plugin's current onboarding flow and theme creation logic for redesign planning.
>
> **Date:** 2025-11-14
> **Status:** Current Production State (commit 5a11c67)

---

## 📋 Executive Summary

The **Clara Plugin** is a Figma plugin designed to import/export design tokens in W3C format. Currently, it operates with:

- ❌ **NO onboarding flow** - Users land directly on the Import tab
- ❌ **NO first-time user guidance** - No tutorials, walkthroughs, or help system
- ❌ **NO theme creation flow** - "Theme Builder" tab is an empty placeholder
- ⚠️ **Limited export functionality** - Only Text Styles export works; JSON/CSS exports are stubbed
- ✅ **Functional token import** - Can parse W3C/Token Studio formats and create Figma variables
- ✅ **Advanced alias resolution** - Handles complex token references with circular dependency detection

**Key Finding:** The plugin is a **feature-first, task-oriented tool** without user guidance or progressive disclosure. Users must understand design tokens and W3C format before using it.

---

## 🚀 Current Onboarding Flow

### TL;DR: There Is No Onboarding

The plugin opens directly to the main interface with zero user guidance.

### Initialization Sequence

#### 1. Plugin Entry Point

**File:** [src/main.ts:32-44](src/main.ts#L32-L44)

```typescript
function initializePlugin(): void {
  console.clear();

  // Initialize core systems
  errorHandler = new ProductionErrorHandler();
  tokenProcessor = new TokenProcessor();
  variableManager = new VariableManager();

  // Show UI immediately (no splash screen, no onboarding)
  figma.showUI(__html__, {
    width: UI_CONFIG.DEFAULT_WIDTH,  // 980px
    height: UI_CONFIG.DEFAULT_HEIGHT, // 700px
    themeColors: true
  });
}
```

**What happens:**
- ✅ Error handler initialized
- ✅ Token processor ready
- ✅ Variable manager ready
- ❌ No user authentication check
- ❌ No first-time user detection
- ❌ No onboarding state loaded
- ❌ UI appears immediately with all features visible

#### 2. UI Initialization

**File:** [ui.html:11346-11362](ui.html#L11346-L11362)

```javascript
document.addEventListener('DOMContentLoaded', () => {
  initPlugin();                    // Setup tabs, events, resize
  initPanelResize();              // Split panel resizing
  restorePanelWidths();           // Restore saved panel width (only persistent state!)
  initResponsiveButtons();        // Footer button handling
  initDragAndDrop();              // JSON file drag & drop
  initJSONEditor();               // Syntax highlighting
  initJSONActionButtons();        // Copy, Select All buttons

  // Default all export buttons to 'generate' state
  updateExportJsonButtonState('generate');
  updateExportCssButtonState('generate');
  updateExportTextStylesButtonState('generate');

  initTokenTooltip();             // Hover tooltips
});
```

**What the user sees:**
- Import Variables tab (active by default)
- Empty left panel (token tree)
- Empty right panel (JSON editor with placeholder text)
- 4 navigation buttons in sidebar
- No welcome message, no tutorial, no hints

#### 3. Backend-Frontend Handshake

**File:** [ui.html:7631-7649](ui.html#L7631-L7649)

```javascript
function initPlugin() {
  setupTabNavigation();          // Tab switching logic
  setupEventListeners();         // Message handlers
  setupResizeHandle();           // Window resizing
  setupGetCodeDropdowns();       // Dropdown initialization

  setTimeout(() => {
    initializeCustomComponents(); // Custom select dropdowns
  }, 100);

  // Send ready signal to backend
  sendMessage('ui-ready');

  // Request existing Figma collections
  requestCollections();
  setupThemeBuilderEventListeners();
}
```

**Backend Response:** [src/main.ts:94-113](src/main.ts#L94-L113)

```typescript
async function handleUIReady(): Promise<void> {
  try {
    // Get existing variable collections from Figma document
    const collections = await figma.variables.getLocalVariableCollectionsAsync();

    const response = {
      type: MESSAGE_TYPES.INIT_DATA,
      success: true,
      data: {
        collections: collections.map(collection => ({
          id: collection.id,
          name: collection.name,
          modes: collection.modes,
          variableIds: collection.variableIds
        }))
      }
    };

    figma.ui.postMessage(response);
  } catch (error) {
    await errorHandler.handleError(error as Error, 'figma_api',
      { operation: 'handleUIReady' });
  }
}
```

### What's Missing

| Expected Onboarding Element | Current State |
|------------------------------|---------------|
| Welcome screen | ❌ None |
| First-time user detection | ❌ None |
| Tutorial/walkthrough | ❌ None |
| Contextual help | ❌ None (only tooltips on hover) |
| Quick start guide | ❌ None |
| Example tokens | ❌ None |
| Feature discovery | ❌ All tabs visible immediately |
| User preferences setup | ❌ None |
| Documentation links | ❌ None |

### User Journey (Current)

```
Plugin opens
    ↓
[Import Variables tab - Active]
    ↓
User sees:
- Empty token tree (left panel)
- Empty JSON editor (right panel)
- "Import Variables" button (disabled)
- 4 navigation tabs (all accessible)
    ↓
User must figure out:
❓ What is this plugin for?
❓ What are design tokens?
❓ What format should the JSON be?
❓ Where do I get tokens from?
❓ What will happen when I import?
    ↓
User either:
✅ Knows W3C tokens → pastes JSON → imports successfully
❌ Doesn't know tokens → confused → closes plugin
```

---

## 🎨 UI Architecture

### Tab-Based Navigation

**File:** [ui.html:4253-4306](ui.html#L4253-L4306)

The plugin uses a **sidebar navigation** with 4 main tabs:

```html
<div class="sidebar-nav">
  <!-- Tab 1: Import (DEFAULT ACTIVE) -->
  <button class="nav-icon-button active" data-tab="json-to-variables">
    <svg><!-- Import icon --></svg>
    <span>Import Variables</span>
  </button>

  <!-- Tab 2: Export -->
  <button class="nav-icon-button" data-tab="json-export">
    <svg><!-- Export icon --></svg>
    <span>Export JSON</span>
  </button>

  <!-- Tab 3: Text Styles -->
  <button class="nav-icon-button" data-tab="text-styles-export">
    <svg><!-- Text icon --></svg>
    <span>Text Styles</span>
  </button>

  <!-- Tab 4: Theme Builder (PLACEHOLDER) -->
  <button class="nav-icon-button" data-tab="theme-builder">
    <svg><!-- Theme icon --></svg>
    <span>Theme Builder</span>
  </button>
</div>
```

### Tab 1: Import Variables (Default Active)

**Layout:** Split-panel view

```
┌─────────────────────────────────────────────────────┐
│ [Import Variables Tab - ACTIVE]                     │
├──────────────────┬──────────────────────────────────┤
│                  │                                  │
│  Token Tree      │  JSON Editor                     │
│  (left panel)    │  (right panel)                   │
│                  │                                  │
│  - Empty on      │  - Syntax highlighting          │
│    first load    │  - Line numbers                  │
│  - Populated     │  - Drag & drop JSON files        │
│    after JSON    │  - Copy/Select buttons           │
│    is parsed     │                                  │
│                  │                                  │
│  - Shows token   │  Placeholder text:               │
│    hierarchy     │  "Paste your JSON tokens here    │
│  - Expandable    │   or drag & drop a JSON file"    │
│    tree nodes    │                                  │
│  - Hover for     │                                  │
│    tooltips      │                                  │
│                  │                                  │
├──────────────────┴──────────────────────────────────┤
│  Footer: [Import Variables] button                 │
│  - Disabled when editor is empty                    │
│  - Active when valid JSON detected                  │
└─────────────────────────────────────────────────────┘
```

**Key Features:**
- **Drag & drop:** Drop JSON files onto the editor
- **Syntax highlighting:** Color-coded JSON
- **Live preview:** Token tree updates as you type
- **Validation:** Shows errors for invalid JSON

### Tab 2: Export JSON

**Layout:** Form-based view

```
┌─────────────────────────────────────────────────────┐
│ [Export JSON Tab]                                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Select Variable Collections                        │
│  ┌───────────────────────────────────────────────┐ │
│  │ ☐ Collection 1                                │ │
│  │ ☐ Collection 2                                │ │
│  │ ☐ Collection 3                                │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  Select Modes                                       │
│  ┌───────────────────────────────────────────────┐ │
│  │ ☐ Light                                       │ │
│  │ ☐ Dark                                        │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  Export Format                                      │
│  ( ) W3C Format                                     │
│  ( ) Token Studio Format                            │
│                                                     │
├─────────────────────────────────────────────────────┤
│  Footer: [Export JSON] button                       │
│  ⚠️  Currently stubbed - shows "not implemented"    │
└─────────────────────────────────────────────────────┘
```

**Current Status:** ⚠️ **Not Functional** - Backend returns "Export functionality will be implemented in next phase"

### Tab 3: Text Styles Export

**Layout:** List-based view

```
┌─────────────────────────────────────────────────────┐
│ [Text Styles Export Tab]                            │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Available Text Styles                              │
│  ┌───────────────────────────────────────────────┐ │
│  │ ☑ Heading 1 - Bold 32px                      │ │
│  │ ☑ Heading 2 - Bold 24px                      │ │
│  │ ☑ Body - Regular 16px                        │ │
│  │ ☑ Caption - Regular 12px                     │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  Export Format                                      │
│  ( ) JSON (W3C)                                     │
│  ( ) CSS                                            │
│  ( ) SCSS Variables                                 │
│                                                     │
├─────────────────────────────────────────────────────┤
│  Footer: [Export Text Styles] button                │
│  ✅ Functional - uses TextStyleExtractor            │
└─────────────────────────────────────────────────────┘
```

**Current Status:** ✅ **Functional** - Only export that works

### Tab 4: Theme Builder

**Layout:** Empty placeholder

```
┌─────────────────────────────────────────────────────┐
│ [Theme Builder Tab]                                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│                                                     │
│                                                     │
│              Theme Builder coming soon...           │
│                                                     │
│                                                     │
│                                                     │
├─────────────────────────────────────────────────────┤
│  Footer: (no buttons)                               │
└─────────────────────────────────────────────────────┘
```

**Current Status:** ❌ **Empty Placeholder** - No functionality implemented

**File:** [ui.html:4975-5043](ui.html#L4975-L5043)

```html
<div class="tab-content" id="theme-builder-tab">
  <div class="scrollable-content">
    <div style="padding: var(--space-6); text-align: center;">
      <p>Theme Builder coming soon...</p>
    </div>
  </div>
</div>
```

### Tab Switching Logic

**File:** [ui.html:7800-7829](ui.html#L7800-L7829)

```javascript
navButtons.forEach(button => {
  button.addEventListener('click', () => {
    // Deactivate all tabs
    navButtons.forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(tc =>
      tc.classList.remove('active')
    );

    // Activate clicked tab
    button.classList.add('active');
    const targetId = button.getAttribute('data-tab') + '-tab';
    document.getElementById(targetId).classList.add('active');

    // Update footer buttons visibility
    updateFooterButtons(button.getAttribute('data-tab'));

    // Load data for specific tabs
    if (targetId === 'json-export-tab') {
      requestCollections(); // Fetch latest collections from Figma
    }
    if (targetId === 'text-styles-export-tab') {
      setTimeout(() => initializeTextStylesExport(), 100);
    }
  });
});
```

---

## 🎯 Theme Creation Logic

### Current State: NO Theme Creation Flow

The plugin has **NO dedicated theme creation functionality**. The "Theme Builder" tab is an empty placeholder.

### What Exists: Token Import Flow

The closest thing to "theme creation" is the **Import Variables** workflow, which converts JSON tokens into Figma variables.

### Token Import Pipeline

```
User Input (JSON)
    ↓
┌─────────────────────────────────────────┐
│ 1. Format Detection & Normalization     │
│    - Detect W3C vs Token Studio format  │
│    - Convert Token Studio → W3C         │
│    - Validate structure                 │
└─────────────────┬───────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ 2. Recursive Token Processing           │
│    - Parse nested token structure       │
│    - Extract collections from root      │
│    - Build token tree                   │
│    - Identify token types               │
└─────────────────┬───────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ 3. Alias Resolution                     │
│    - Find all alias references ({...})  │
│    - Resolve recursively (max depth 10) │
│    - Detect circular references         │
│    - Cache resolved values              │
└─────────────────┬───────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ 4. Variable Creation in Figma           │
│    - Create/update collections          │
│    - Map token types → Figma types      │
│    - Set variable values                │
│    - Assign automatic scopes            │
└─────────────────┬───────────────────────┘
    ↓
Figma Variables Created ✅
```

### Step 1: Format Detection & Normalization

**File:** [src/classes/TokenProcessor.ts:82-90](src/classes/TokenProcessor.ts#L82-L90)

```typescript
private async normalizeTokenFormat(data: any): Promise<any> {
  // Check if Token Studio format (legacy)
  if (this.isTokenStudioFormat(data)) {
    console.log('[TokenProcessor] Detected Token Studio format, converting to W3C...');
    return this.convertTokenStudioToW3C(data);
  }

  // Assume W3C format
  console.log('[TokenProcessor] Processing as W3C format');
  return data;
}
```

**Token Studio Format Detection:**

```typescript
private isTokenStudioFormat(data: any): boolean {
  // Token Studio has top-level arrays or specific structure
  if (Array.isArray(data)) return true;

  // Check for Token Studio-specific keys
  const keys = Object.keys(data);
  const hasTokenStudioKeys = keys.some(key =>
    ['global', 'themes', 'core'].includes(key)
  );

  // Check if values use '$value' without '$type' (Token Studio style)
  const firstValue = data[keys[0]];
  if (firstValue && typeof firstValue === 'object') {
    return '$value' in firstValue && !('$type' in firstValue);
  }

  return false;
}
```

**Example Input (W3C Format):**

```json
{
  "global": {
    "colors": {
      "blue": {
        "500": {
          "$value": "#1068f6",
          "$type": "color",
          "$description": "Primary blue"
        }
      }
    },
    "spacing": {
      "md": {
        "$value": "16px",
        "$type": "dimension"
      }
    }
  }
}
```

### Step 2: Recursive Token Processing

**File:** [src/classes/TokenProcessor.ts:175-218](src/classes/TokenProcessor.ts#L175-L218)

```typescript
private async processTokensRecursive(
  obj: any,
  path: string[] = [],
  collection = DEFAULT_COLLECTION_NAME
): Promise<ProcessedToken[]> {
  const tokens: ProcessedToken[] = [];

  // ROOT LEVEL = Collections
  // First level of object = collection names
  if (path.length === 0) {
    for (const [key, value] of Object.entries(obj)) {
      if (key.startsWith('$')) continue; // Skip metadata keys

      if (typeof value === 'object') {
        const collectionTokens = await this.processTokensRecursive(
          value,
          [],
          key // Collection name
        );
        tokens.push(...collectionTokens);
      }
    }
    return tokens;
  }

  // RECURSIVE TOKEN PROCESSING
  // Build token tree depth-first
  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith('$')) continue; // Skip $type, $description, etc.

    const currentPath = [...path, key];

    // Check if this is a token (has $value or $type)
    if (this.isToken(value)) {
      const token = await this.processSingleToken(value, currentPath, collection);
      if (token) tokens.push(token);
    }
    // Otherwise, recurse deeper
    else if (typeof value === 'object') {
      const nestedTokens = await this.processTokensRecursive(
        value,
        currentPath,
        collection
      );
      tokens.push(...nestedTokens);
    }
  }

  return tokens;
}
```

**Token Detection:**

```typescript
private isToken(obj: any): boolean {
  if (typeof obj !== 'object' || obj === null) return false;

  // W3C tokens must have $value
  // May optionally have $type, $description, $extensions
  return '$value' in obj;
}
```

**Single Token Processing:**

```typescript
private async processSingleToken(
  tokenObj: any,
  path: string[],
  collection: string
): Promise<ProcessedToken | null> {
  try {
    const value = tokenObj.$value;
    const type = tokenObj.$type || this.inferType(value);
    const description = tokenObj.$description;

    // Check if value is an alias reference
    const isAlias = this.isAliasReference(value);

    return {
      name: path.join('/'),           // "colors/blue/500"
      path: path,                     // ["colors", "blue", "500"]
      type: type,                     // "color"
      value: value,                   // "#1068f6" or "{colors.blue.400}"
      collection: collection,         // "global"
      isAlias: isAlias,              // false
      resolvedValue: isAlias ? null : value,
      description: description,
      extensions: tokenObj.$extensions
    };
  } catch (error) {
    console.error(`[TokenProcessor] Failed to process token at ${path.join('/')}`, error);
    return null;
  }
}
```

### Step 3: Alias Resolution

**File:** [src/classes/TokenProcessor.ts:389-451](src/classes/TokenProcessor.ts#L389-L451)

**Alias Format:** `{path.to.token}` or `{path/to/token}`

**Example:**

```json
{
  "colors": {
    "blue": {
      "500": { "$value": "#1068f6", "$type": "color" }
    },
    "primary": {
      "$value": "{colors.blue.500}",  // ← Alias reference
      "$type": "color"
    }
  }
}
```

**Alias Resolution Algorithm:**

```typescript
private async resolveAliases(tokens: ProcessedToken[]): Promise<void> {
  const maxDepth = LIMITS.MAX_ALIAS_DEPTH; // 10
  const resolved = new Set<string>();

  // Resolve all aliases
  for (const token of tokens) {
    if (token.isAlias && !resolved.has(token.name)) {
      await this.resolveTokenAlias(token, tokens, resolved, 0, maxDepth);
    }
  }
}

private async resolveTokenAlias(
  token: ProcessedToken,
  allTokens: ProcessedToken[],
  resolved: Set<string>,
  depth: number,
  maxDepth: number
): Promise<void> {
  // Prevent infinite recursion
  if (depth > maxDepth) {
    throw new Error(`Circular reference detected: ${token.name}`);
  }

  // Extract reference path from {path.to.token}
  const aliasRef = token.value as string;
  const refPath = aliasRef.slice(1, -1); // Remove { }

  // Find referenced token (try both dot and slash notation)
  let referencedToken = allTokens.find(t => t.name === refPath);

  if (!referencedToken && refPath.includes('.')) {
    const slashPath = refPath.replace(/\./g, '/');
    referencedToken = allTokens.find(t => t.name === slashPath);
  }

  if (!referencedToken) {
    throw new Error(`Token reference not found: ${refPath}`);
  }

  // If referenced token is also an alias, resolve it first (recursion)
  if (referencedToken.isAlias && !resolved.has(referencedToken.name)) {
    await this.resolveTokenAlias(
      referencedToken,
      allTokens,
      resolved,
      depth + 1,
      maxDepth
    );
  }

  // Copy resolved value
  token.resolvedValue = referencedToken.resolvedValue;
  resolved.add(token.name);
}
```

**Circular Reference Detection:**

```
Token A → {B}
Token B → {C}
Token C → {A}  ← Circular!
```

The `depth` counter prevents infinite loops and throws an error if depth > 10.

### Step 4: Variable Creation in Figma

**File:** [src/classes/VariableManager.ts:28-83](src/classes/VariableManager.ts#L28-L83)

```typescript
async importTokensAsVariables(
  tokenCollections: TokenCollection[],
  options: ImportOptions = {}
): Promise<ImportResult> {
  try {
    let totalVariables = 0;
    let totalCollections = 0;

    // Progress update to UI
    figma.ui.postMessage({
      type: 'progress-update',
      message: PROGRESS_MESSAGES.CREATING_COLLECTIONS
    });

    // Create each collection
    for (const tokenCollection of tokenCollections) {
      // Get existing collection or create new
      const collection = await this.getOrCreateCollection(
        tokenCollection.name,
        options.overwriteExisting || false
      );

      if (!collection) continue;
      totalCollections++;

      figma.ui.postMessage({
        type: 'progress-update',
        message: `Creating variables for ${tokenCollection.name}...`
      });

      // Import tokens to collection
      const variableCount = await this.importTokensToCollection(
        tokenCollection.tokens,
        collection,
        options
      );

      totalVariables += variableCount;
    }

    return {
      success: true,
      message: `Successfully imported ${totalVariables} variables in ${totalCollections} collections`,
      variableCount: totalVariables,
      collectionCount: totalCollections
    };
  } catch (error) {
    // Error handling...
  }
}
```

**Token Type Mapping (Token → Figma):**

```typescript
private tokenTypeToFigmaType(tokenType: string): VariableResolvedType | null {
  const typeMap: Record<string, VariableResolvedType> = {
    'color': 'COLOR',
    'number': 'FLOAT',
    'dimension': 'FLOAT',
    'spacing': 'FLOAT',
    'string': 'STRING',
    'text': 'STRING',
    'boolean': 'BOOLEAN'
  };

  return typeMap[tokenType.toLowerCase()] || null;
}
```

**Variable Creation:**

```typescript
private async createOrUpdateVariable(
  token: ProcessedToken,
  collection: VariableCollection,
  options: ImportOptions
): Promise<Variable | null> {
  try {
    // Map token type to Figma type
    const figmaType = this.tokenTypeToFigmaType(token.type);
    if (!figmaType) {
      throw new Error(`Unsupported token type: ${token.type}`);
    }

    // Check if variable already exists
    let variable = await this.findExistingVariable(token.name, collection);

    if (variable) {
      // Skip if not overwriting
      if (!options.overwriteExisting) {
        return variable;
      }

      // Type mismatch? Remove and recreate
      if (variable.resolvedType !== figmaType) {
        variable.remove();
        variable = null;
      }
    }

    // Create new variable
    if (!variable) {
      variable = figma.variables.createVariable(
        token.name,
        collection,
        figmaType
      );
    }

    // Set description
    if (token.description) {
      variable.description = token.description;
    }

    // Set variable value
    await this.setVariableValues(variable, token, collection);

    // Auto-assign scopes based on token path/type
    this.assignAutomaticScopes(variable, token);

    return variable;
  } catch (error) {
    console.error(`Failed to create variable: ${token.name}`, error);
    return null;
  }
}
```

**Automatic Scope Assignment:**

```typescript
private assignAutomaticScopes(variable: Variable, token: ProcessedToken): void {
  const scopes: VariableScope[] = [];
  const pathString = token.path.join('/').toLowerCase();
  const tokenType = token.type.toLowerCase();

  // COLOR variables
  if (tokenType === 'color') {
    scopes.push('ALL_FILLS');

    if (pathString.includes('border') || pathString.includes('stroke')) {
      scopes.push('ALL_STROKES');
    }

    if (pathString.includes('text') || pathString.includes('font')) {
      scopes.push('TEXT_FILL');
    }
  }

  // NUMBER/DIMENSION variables
  if (tokenType === 'number' || tokenType === 'dimension') {
    if (pathString.includes('spacing') || pathString.includes('gap')) {
      scopes.push('GAP');
    }

    if (pathString.includes('width') || pathString.includes('height')) {
      scopes.push('WIDTH_HEIGHT');
    }

    if (pathString.includes('radius') || pathString.includes('corner')) {
      scopes.push('CORNER_RADIUS');
    }
  }

  // TYPOGRAPHY variables
  if (tokenType === 'typography' || tokenType === 'fontfamily') {
    scopes.push('TEXT_CONTENT');
  }

  // Apply scopes
  if (scopes.length > 0) {
    variable.scopes = scopes;
  }
}
```

**Example Scope Assignment:**

```
Token: colors/text/primary → Scopes: [ALL_FILLS, TEXT_FILL]
Token: spacing/md         → Scopes: [GAP]
Token: border/radius/sm   → Scopes: [CORNER_RADIUS]
Token: colors/border/dark → Scopes: [ALL_FILLS, ALL_STROKES]
```

---

## 📡 Message Passing Architecture

The plugin uses a **message-based architecture** for communication between the UI (iframe) and the backend (Figma sandbox).

### Message Flow

```
┌─────────────────┐                      ┌──────────────────┐
│   UI (iframe)   │                      │  Backend (Figma) │
│   ui.html       │                      │   src/main.ts    │
└────────┬────────┘                      └─────────┬────────┘
         │                                         │
         │  1. sendMessage('ui-ready')             │
         │────────────────────────────────────────>│
         │                                         │
         │                  2. handleUIReady()     │
         │                     - Get collections   │
         │                     - Build response    │
         │                                         │
         │  3. postMessage(INIT_DATA)              │
         │<────────────────────────────────────────│
         │                                         │
         │  4. onmessage handler                   │
         │     - Update UI with collections        │
         │                                         │
         │  5. sendMessage('import-json', {json})  │
         │────────────────────────────────────────>│
         │                                         │
         │                  6. handleImportJson()  │
         │                     - Parse JSON        │
         │                     - Process tokens    │
         │                     - Create variables  │
         │                                         │
         │  7. postMessage(IMPORT_RESULT)          │
         │<────────────────────────────────────────│
         │                                         │
         │  8. Show success notification           │
         │                                         │
```

### Message Types

**File:** [src/constants/index.ts:7-30](src/constants/index.ts#L7-L30)

```typescript
export const MESSAGE_TYPES = {
  // Initialization
  UI_READY: 'ui-ready',
  INIT_DATA: 'init-data',

  // Collections
  GET_COLLECTIONS: 'get-collections',
  COLLECTIONS_DATA: 'collections-data',

  // Import
  IMPORT_JSON: 'import-json',
  IMPORT_VARIABLES: 'import-variables',
  IMPORT_RESULT: 'import-result',
  PREVIEW_IMPORT: 'preview-import',
  PREVIEW_RESULT: 'preview-result',

  // Export
  EXPORT_JSON: 'export-json',
  EXPORT_JSON_ADVANCED: 'export-json-advanced',
  EXPORT_CSS: 'export-css',
  EXPORT_CSS_ADVANCED: 'export-css-advanced',
  EXPORT_TEXT_STYLES: 'export-text-styles',

  // Results
  JSON_RESULT: 'json-result',
  JSON_ADVANCED_RESULT: 'json-advanced-result',
  CSS_RESULT: 'css-result',
  TEXT_STYLES_RESULT: 'text-styles-export-result',

  // UI
  RESIZE: 'resize',
  PROGRESS_UPDATE: 'progress-update',
  ERROR: 'error',

  // Collection Management
  RENAME_COLLECTION: 'rename-collection',
  DELETE_COLLECTION: 'delete-collection',
  CLEAR_ALL_COLLECTIONS: 'clear-all-collections',
  COLLECTION_MANAGEMENT_RESULT: 'collection-management-result'
} as const;
```

### Backend Message Handler

**File:** [src/main.ts:48-91](src/main.ts#L48-L91)

```typescript
figma.ui.onmessage = async (msg: PluginMessage): Promise<void> => {
  try {
    const { type } = msg;

    switch (type) {
      case MESSAGE_TYPES.UI_READY:
        await handleUIReady();
        break;

      case MESSAGE_TYPES.GET_COLLECTIONS:
        await handleGetCollections();
        break;

      case MESSAGE_TYPES.IMPORT_JSON:
        await handleImportJson(msg);
        break;

      case MESSAGE_TYPES.EXPORT_JSON_ADVANCED:
        await handleExportJsonAdvanced(msg);
        break;

      case MESSAGE_TYPES.EXPORT_CSS:
        await handleExportCss(msg);
        break;

      case MESSAGE_TYPES.RESIZE:
        handleResize(msg.width, msg.height);
        break;

      default:
        console.warn(`[Plugin] Unhandled message type: ${type}`);
    }
  } catch (error) {
    const errorResult = await errorHandler.handleError(
      error as Error,
      'processing',
      { messageType: msg.type }
    );

    if (!errorResult.shouldSkip) {
      figma.notify(`Error: ${(error as Error).message}`, { error: true });
    }
  }
};
```

### UI Message Sender

**File:** [ui.html:7531](ui.html#L7531)

```javascript
function sendMessage(type, data = {}) {
  parent.postMessage({
    pluginMessage: Object.assign({ type: type }, data)
  }, '*');
}

// Usage examples:
sendMessage('ui-ready');
sendMessage('import-json', { json: jsonString });
sendMessage('export-json-advanced', {
  collections: ['global', 'semantic'],
  modes: ['light', 'dark']
});
```

---

## 💾 Data Structures & Schemas

### Token Data Structures

**File:** [src/types/tokens.ts](src/types/tokens.ts)

```typescript
// W3C Design Token (input format)
interface DesignToken {
  $value?: any;                          // Token value
  $type?: TokenType;                     // color, dimension, number, etc.
  $description?: string;                 // Human-readable description
  $extensions?: { [key: string]: any };  // Custom metadata
}

// Processed Token (internal representation)
interface ProcessedToken {
  name: string;              // Full path: "colors/blue/500"
  path: string[];            // Path array: ["colors", "blue", "500"]
  type: string;              // Token type: "color"
  value: any;                // Raw value: "#1068f6" or "{colors.blue.400}"
  collection: string;        // Collection name: "global"
  isAlias: boolean;          // Is this an alias reference?
  resolvedValue: any;        // Resolved value (after alias resolution)
  description?: string;      // Optional description
  extensions?: Record<string, any>;  // Optional extensions
}

// Token Collection
interface TokenCollection {
  name: string;              // Collection name
  tokens: ProcessedToken[];  // Array of tokens
}

// Import Options
interface ImportOptions {
  collectionName?: string;   // Target collection
  modeName?: string;         // Target mode
  overwriteExisting?: boolean;  // Overwrite existing variables?
  skipInvalid?: boolean;     // Skip invalid tokens?
}

// Processing Result
interface ProcessingResult {
  success: boolean;
  tokens: ProcessedToken[];
  collections: TokenCollection[];
  aliasCount: number;
  message: string;
  errors?: string[];
}

// Import Result
interface ImportResult {
  success: boolean;
  message: string;
  variableCount: number;
  collectionCount: number;
}
```

### Type Mappings

**Token Types → Figma Types:**

```typescript
// src/constants/index.ts
const FIGMA_TO_TOKEN_TYPE = {
  COLOR: 'color',
  FLOAT: 'number',
  STRING: 'string',
  BOOLEAN: 'boolean'
} as const;

// Reverse mapping
const TOKEN_TYPE_TO_FIGMA = {
  'color': 'COLOR',
  'number': 'FLOAT',
  'dimension': 'FLOAT',
  'spacing': 'FLOAT',
  'string': 'STRING',
  'text': 'STRING',
  'boolean': 'BOOLEAN'
} as const;
```

**Token Studio → W3C:**

```typescript
const TOKEN_STUDIO_TO_W3C_TYPE = {
  color: 'color',
  spacing: 'number',
  dimension: 'number',
  size: 'number',
  typography: 'typography',
  fontFamily: 'fontFamily',
  fontWeight: 'fontWeight',
  string: 'string',
  text: 'string',
  boolean: 'boolean'
} as const;
```

### Example Token Data

**Input (W3C Format):**

```json
{
  "global": {
    "colors": {
      "neutral": {
        "white": {
          "$value": "#ffffff",
          "$type": "color",
          "$description": "Pure white"
        },
        "black": {
          "$value": "#1e1e1e",
          "$type": "color"
        }
      },
      "blue": {
        "50": {
          "$value": "#e3f2fd",
          "$type": "color"
        },
        "500": {
          "$value": "#1068f6",
          "$type": "color"
        }
      },
      "primary": {
        "$value": "{colors.blue.500}",
        "$type": "color",
        "$description": "Primary brand color (alias)"
      }
    },
    "spacing": {
      "xs": {
        "$value": "4px",
        "$type": "dimension"
      },
      "sm": {
        "$value": "8px",
        "$type": "dimension"
      },
      "md": {
        "$value": "16px",
        "$type": "dimension"
      }
    }
  }
}
```

**After Processing (ProcessedToken[]):**

```typescript
[
  {
    name: "colors/neutral/white",
    path: ["colors", "neutral", "white"],
    type: "color",
    value: "#ffffff",
    collection: "global",
    isAlias: false,
    resolvedValue: "#ffffff",
    description: "Pure white"
  },
  {
    name: "colors/blue/500",
    path: ["colors", "blue", "500"],
    type: "color",
    value: "#1068f6",
    collection: "global",
    isAlias: false,
    resolvedValue: "#1068f6"
  },
  {
    name: "colors/primary",
    path: ["colors", "primary"],
    type: "color",
    value: "{colors.blue.500}",
    collection: "global",
    isAlias: true,
    resolvedValue: "#1068f6",  // ← Resolved from alias
    description: "Primary brand color (alias)"
  },
  {
    name: "spacing/md",
    path: ["spacing", "md"],
    type: "dimension",
    value: "16px",
    collection: "global",
    isAlias: false,
    resolvedValue: "16px"
  }
]
```

---

## 🗂️ Key Files & Responsibilities

### Backend (Figma Sandbox)

| File | Lines | Purpose |
|------|-------|---------|
| [src/main.ts](src/main.ts) | 223 | Plugin entry point, message routing, initialization |
| [src/classes/TokenProcessor.ts](src/classes/TokenProcessor.ts) | 483 | Token parsing, format detection, alias resolution |
| [src/classes/VariableManager.ts](src/classes/VariableManager.ts) | 477 | Variable CRUD, collection management, scope assignment |
| [src/classes/VariableExporter.ts](src/classes/VariableExporter.ts) | 406 | Export variables to JSON/CSS *(stubbed)* |
| [src/classes/AdvancedAliasResolver.ts](src/classes/AdvancedAliasResolver.ts) | 246 | Advanced alias resolution with LRU cache |
| [src/classes/ProductionErrorHandler.ts](src/classes/ProductionErrorHandler.ts) | 200 | Error handling, recovery strategies, logging |
| [src/classes/TextStyleExtractor.ts](src/classes/TextStyleExtractor.ts) | 480 | Extract Figma text styles to tokens |
| [src/constants/index.ts](src/constants/index.ts) | 106 | Message types, UI config, limits, type mappings |
| [src/types/tokens.ts](src/types/tokens.ts) | 205 | TypeScript type definitions |
| [src/main-figma.ts](src/main-figma.ts) | 5,291 | **DEPRECATED** Legacy monolith (pre-refactor) |

### Frontend (UI)

| File | Lines | Purpose |
|------|-------|---------|
| [ui.html](ui.html) | 11,471 | **MONOLITH:** All UI (HTML + CSS + JavaScript) |

**ui.html Breakdown:**

| Section | Lines | Content |
|---------|-------|---------|
| HTML Structure | ~1,500 | Tab layout, forms, inputs, panels |
| CSS Styles | ~3,500 | Design system, component styles, responsive |
| JavaScript | ~6,500 | UI logic, message handling, token tree rendering |

**Key JavaScript Functions:**

| Function | Line | Purpose |
|----------|------|---------|
| `initPlugin()` | 7631 | Initialize UI, setup tabs, send ready signal |
| `setupTabNavigation()` | 7800 | Tab switching logic |
| `handleFileUpload()` | ~10500 | Process uploaded JSON files |
| `initDragAndDrop()` | 10622 | Drag & drop JSON files |
| `initJSONEditor()` | 10830 | Syntax highlighting, validation |
| `renderTokenTree()` | ~6000 | Render token tree view (left panel) |
| `resolveAliasValue()` | 7100 | Resolve token aliases in UI |
| `attachTokenTreeListeners()` | 7211 | Token tree interactions (expand/collapse) |
| `initTokenTooltip()` | 11365 | Token hover tooltips |
| `sendMessage()` | 7531 | Send messages to backend |
| `updateExportJsonButtonState()` | ~9000 | Update export button states |

---

## 🔄 State Management & Persistence

### Current State: MINIMAL

The plugin has **very limited state management**:

✅ **What IS Saved:**
- Panel width (localStorage)

❌ **What IS NOT Saved:**
- First-time user flag
- User preferences (export format, default collections, etc.)
- Recent imports/exports
- Last used settings
- Theme builder state
- Onboarding progress

### Panel Width Persistence

**File:** [ui.html:~10450](ui.html)

```javascript
function savePanelWidths() {
  const leftPanel = document.querySelector('.left-panel');
  if (leftPanel) {
    localStorage.setItem('clara-plugin-left-panel-width',
      leftPanel.style.width || '400px');
  }
}

function restorePanelWidths() {
  const savedWidth = localStorage.getItem('clara-plugin-left-panel-width');
  if (savedWidth) {
    const leftPanel = document.querySelector('.left-panel');
    if (leftPanel) {
      leftPanel.style.width = savedWidth;
    }
  }
}

// Called on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  // ... other initialization
  restorePanelWidths();
});

// Called on panel resize
resizeHandle.addEventListener('mouseup', () => {
  savePanelWidths();
});
```

### No Figma clientStorage Usage

The plugin does **NOT** use Figma's `clientStorage` API, which means:

- ❌ No cross-session persistence
- ❌ No user-specific settings
- ❌ No onboarding state tracking
- ❌ No "don't show again" flags

**What COULD be stored:**

```typescript
// Example: What could be saved with clientStorage
await figma.clientStorage.setAsync('hasCompletedOnboarding', true);
await figma.clientStorage.setAsync('defaultExportFormat', 'w3c');
await figma.clientStorage.setAsync('lastUsedCollection', 'global');
await figma.clientStorage.setAsync('preferredMode', 'light');
```

---

## 📤 Export Functionality

### Current State: MOSTLY STUBBED

Only **1 out of 3** export features is functional.

### Export JSON (❌ Not Implemented)

**Backend:** [src/main.ts:182-193](src/main.ts#L182-L193)

```typescript
async function handleExportJsonAdvanced(msg: any): Promise<void> {
  try {
    figma.ui.postMessage({
      type: MESSAGE_TYPES.JSON_ADVANCED_RESULT,
      success: false,
      message: 'Export functionality will be implemented in next phase'
    });
  } catch (error) {
    await errorHandler.handleError(error as Error, 'export',
      { operation: 'handleExportJsonAdvanced' });
  }
}
```

**UI Behavior:**
- User selects collections and modes
- Clicks "Export JSON" button
- Gets error message: "Export functionality will be implemented in next phase"

### Export CSS (❌ Not Implemented)

**Backend:** [src/main.ts:195-206](src/main.ts#L195-L206)

```typescript
async function handleExportCss(msg: any): Promise<void> {
  try {
    figma.ui.postMessage({
      type: MESSAGE_TYPES.CSS_RESULT,
      success: false,
      message: 'CSS export functionality will be implemented in next phase'
    });
  } catch (error) {
    await errorHandler.handleError(error as Error, 'export',
      { operation: 'handleExportCss' });
  }
}
```

**UI Behavior:** Same as JSON export - shows "not implemented" message

### Export Text Styles (✅ Functional)

**Backend:** Uses `TextStyleExtractor.ts`

**File:** [src/classes/TextStyleExtractor.ts](src/classes/TextStyleExtractor.ts)

```typescript
export class TextStyleExtractor {
  async extractTextStyles(): Promise<ProcessedToken[]> {
    const textStyles = await figma.getLocalTextStylesAsync();
    const tokens: ProcessedToken[] = [];

    for (const style of textStyles) {
      // Extract font family, size, weight, line height, etc.
      const token = this.convertTextStyleToToken(style);
      tokens.push(token);
    }

    return tokens;
  }

  private convertTextStyleToToken(style: TextStyle): ProcessedToken {
    return {
      name: style.name,
      path: style.name.split('/'),
      type: 'typography',
      value: {
        fontFamily: style.fontName.family,
        fontSize: style.fontSize,
        fontWeight: style.fontName.style,
        lineHeight: style.lineHeight,
        letterSpacing: style.letterSpacing
      },
      collection: 'text-styles',
      isAlias: false,
      resolvedValue: { /* ... */ }
    };
  }
}
```

**Export Formats:**
- ✅ JSON (W3C typography tokens)
- ✅ CSS (CSS custom properties)
- ✅ SCSS (SCSS variables)

---

## 🚨 Critical Gaps & Missing Features

### 1. Onboarding Flow (❌ Completely Missing)

**What's Missing:**

| Feature | Current State | Impact |
|---------|---------------|--------|
| Welcome screen | ❌ None | Users confused about purpose |
| First-time detection | ❌ None | No differentiation for new users |
| Tutorial/walkthrough | ❌ None | Users must figure out interface |
| Quick start options | ❌ None | No guided entry points |
| Example tokens | ❌ None | Users can't test without own data |
| Help/documentation | ❌ None | No in-app help |
| Feature discovery | ❌ None | All features exposed at once |

**User Impact:**
- 🔴 **High friction** for first-time users
- 🔴 **Steep learning curve** (must understand W3C tokens)
- 🔴 **No guidance** on what to do first
- 🔴 **No context** on what each tab does

### 2. Theme Creation Flow (❌ Empty Placeholder)

**What's Missing:**

| Feature | Current State | Impact |
|---------|---------------|--------|
| Theme configuration UI | ❌ Placeholder | Can't create themes |
| Base token selection | ❌ None | No primitive tokens |
| Semantic layer setup | ❌ None | No semantic tokens |
| Component tokens | ❌ None | No component-specific tokens |
| Theme preview | ❌ None | Can't see theme before applying |
| Multi-theme support | ❌ None | Can't manage light/dark themes |
| Theme export | ❌ None | Can't export configured themes |

**Current State:**

```html
<!-- Theme Builder Tab -->
<div class="tab-content" id="theme-builder-tab">
  <div style="padding: var(--space-6); text-align: center;">
    <p>Theme Builder coming soon...</p>
  </div>
</div>
```

**User Impact:**
- 🔴 **No guided theme creation** - Users must craft JSON manually
- 🔴 **No theme structure** - No primitive → semantic → component hierarchy
- 🔴 **No theming workflow** - Can't create light/dark variants
- 🔴 **No validation** - Must know correct token structure

### 3. State Management (❌ Minimal)

**What's Missing:**

| State | Current | Needed For |
|-------|---------|------------|
| First-time user flag | ❌ | Onboarding flow |
| User preferences | ❌ | Default settings |
| Recent imports/exports | ❌ | Quick re-import |
| Last used settings | ❌ | Workflow continuity |
| Saved themes | ❌ | Theme management |
| Onboarding progress | ❌ | Progressive onboarding |

**User Impact:**
- 🟡 **No personalization** - Same experience every time
- 🟡 **Repetitive work** - Must reconfigure settings each session
- 🟡 **No workflow optimization** - Can't save common tasks

### 4. Export Functionality (❌ 67% Incomplete)

**What Works:**
- ✅ Export Text Styles (JSON, CSS, SCSS)

**What Doesn't:**
- ❌ Export JSON (Figma variables → W3C tokens)
- ❌ Export CSS (Figma variables → CSS custom properties)

**User Impact:**
- 🔴 **One-way flow** - Can import but can't export back
- 🔴 **No roundtrip** - Can't sync tokens between Figma and code
- 🔴 **Limited utility** - Plugin is primarily an importer, not a full token manager

---

## 🔍 Technical Details

### Performance Characteristics

**Import Performance (per REFACTORING_PLAN.md):**
- 1,000 tokens: **5-10 seconds**
- Token processing: **O(n × depth)** where depth = alias chain length
- Alias resolution: **O(n²)** worst case (without caching)

**Code Quality Issues:**
- 2,800 lines **duplicated code** (47%)
- **main-figma.ts:** 5,291 lines (legacy monolith)
- **ui.html:** 11,471 lines (HTML + CSS + JS monolith)
- **256 console.log** statements
- **319 uses of 'any'** type
- **0% test coverage**

### Error Handling

**File:** [src/classes/ProductionErrorHandler.ts](src/classes/ProductionErrorHandler.ts)

**Strategy:**
- Categorize errors (figma_api, processing, validation, etc.)
- Recovery strategies per error type
- User-friendly messages
- Detailed logging for debugging

**Example:**

```typescript
try {
  await handleImportJson(msg);
} catch (error) {
  const errorResult = await errorHandler.handleError(
    error as Error,
    'processing',
    { messageType: msg.type }
  );

  if (!errorResult.shouldSkip) {
    figma.notify(`Error: ${(error as Error).message}`, { error: true });
  }
}
```

### Constraints & Limits

**File:** [src/constants/index.ts](src/constants/index.ts)

```typescript
export const LIMITS = {
  MAX_ALIAS_DEPTH: 10,           // Max alias chain depth
  MAX_TOKEN_NAME_LENGTH: 256,    // Max token name length
  MAX_DESCRIPTION_LENGTH: 1000,  // Max description length
  MAX_BATCH_SIZE: 100            // Max tokens per batch
} as const;
```

### UI Configuration

```typescript
export const UI_CONFIG = {
  DEFAULT_WIDTH: 980,
  DEFAULT_HEIGHT: 700,
  MIN_WIDTH: 600,
  MIN_HEIGHT: 400
} as const;
```

---

## 💡 Recommendations for Redesign

### 1. Onboarding Flow Redesign

**Proposed Flow:**

```
Plugin Opens
    ↓
┌─────────────────────────────────────────┐
│ STEP 1: Welcome Screen                  │
│ ----------------------------------------│
│ "Welcome to Clara Plugin"               │
│ "Import and manage design tokens"       │
│                                         │
│ [Get Started] [Learn More]              │
└─────────────────┬───────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ STEP 2: Quick Start Options             │
│ ----------------------------------------│
│ Choose how to start:                    │
│                                         │
│ ○ Import example tokens (try it out)   │
│ ○ Import my tokens (have JSON)         │
│ ○ Create new theme (guided wizard)     │
│ ○ Connect to repository (advanced)     │
│                                         │
│ [Continue]                              │
└─────────────────┬───────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ STEP 3: Interactive Tutorial            │
│ ----------------------------------------│
│ [Overlay highlights + tooltips]         │
│                                         │
│ 1. This is where tokens appear →        │
│ 2. Paste JSON here →                    │
│ 3. Click Import to create variables →   │
│                                         │
│ [Skip Tutorial] [Next] [Finish]         │
└─────────────────────────────────────────┘
```

**Implementation:**

```typescript
// Check first-time user
async function checkFirstTimeUser(): Promise<boolean> {
  const hasCompletedOnboarding = await figma.clientStorage.getAsync('hasCompletedOnboarding');
  return !hasCompletedOnboarding;
}

// Show onboarding if first time
if (await checkFirstTimeUser()) {
  showOnboardingFlow();
} else {
  showMainInterface();
}
```

### 2. Theme Builder Redesign

**Proposed Structure:**

```
Theme Builder Tab
    ↓
┌─────────────────────────────────────────┐
│ Theme Configuration Wizard              │
├─────────────────────────────────────────┤
│                                         │
│ Step 1: Base Tokens (Primitives)       │
│ ┌─────────────────────────────────────┐ │
│ │ Colors                              │ │
│ │ - blue.100: #e3f2fd                 │ │
│ │ - blue.500: #1068f6                 │ │
│ │ - blue.900: #0d47a1                 │ │
│ │                                     │ │
│ │ Spacing                             │ │
│ │ - xs: 4px                           │ │
│ │ - sm: 8px                           │ │
│ │ - md: 16px                          │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [Import Base Tokens] [Next: Semantic]   │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ Step 2: Semantic Tokens                 │
│ ┌─────────────────────────────────────┐ │
│ │ Map base tokens to semantic roles:  │ │
│ │                                     │ │
│ │ Primary Color:                      │ │
│ │ └─> {colors.blue.500} ✓             │ │
│ │                                     │ │
│ │ Background Color:                   │ │
│ │ └─> {colors.neutral.white} ✓        │ │
│ │                                     │ │
│ │ Text Color:                         │ │
│ │ └─> {colors.neutral.black} ✓        │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [Back] [Next: Components]               │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ Step 3: Component Tokens                │
│ ┌─────────────────────────────────────┐ │
│ │ Button                              │ │
│ │ - background: {semantic.primary}    │ │
│ │ - text: {semantic.on-primary}       │ │
│ │ - border-radius: {base.radius.md}   │ │
│ │                                     │ │
│ │ Card                                │ │
│ │ - background: {semantic.surface}    │ │
│ │ - padding: {base.spacing.lg}        │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [Back] [Preview Theme]                  │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ Step 4: Theme Preview                   │
│ ┌─────────────────────────────────────┐ │
│ │ Preview in Figma:                   │ │
│ │                                     │ │
│ │ [Button] [Card] [Input] [Toggle]    │ │
│ │                                     │ │
│ │ Mode: [Light ▼] [Dark ▼]            │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [Back] [Create Theme Variables]         │
└─────────────────────────────────────────┘
```

### 3. State Management Enhancement

**Implement clientStorage:**

```typescript
// User preferences
interface UserPreferences {
  hasCompletedOnboarding: boolean;
  defaultExportFormat: 'w3c' | 'token-studio';
  defaultCollections: string[];
  lastUsedMode: string;
  panelWidth: number;
  recentImports: string[];  // Last 5 imported files
}

// Save preferences
async function savePreferences(prefs: UserPreferences): Promise<void> {
  await figma.clientStorage.setAsync('userPreferences', prefs);
}

// Load preferences
async function loadPreferences(): Promise<UserPreferences> {
  return await figma.clientStorage.getAsync('userPreferences') || {
    hasCompletedOnboarding: false,
    defaultExportFormat: 'w3c',
    defaultCollections: [],
    lastUsedMode: 'Default',
    panelWidth: 400,
    recentImports: []
  };
}
```

### 4. Export Functionality Completion

**Implement JSON Export:**

```typescript
async function handleExportJsonAdvanced(msg: any): Promise<void> {
  const { collections, modes, format } = msg;

  // Get variables from selected collections
  const exporter = new VariableExporter();
  const tokens = await exporter.exportToW3C(collections, modes);

  // Send to UI
  figma.ui.postMessage({
    type: MESSAGE_TYPES.JSON_ADVANCED_RESULT,
    success: true,
    data: {
      json: JSON.stringify(tokens, null, 2),
      filename: `tokens-${Date.now()}.json`
    }
  });
}
```

**Implement CSS Export:**

```typescript
async function handleExportCss(msg: any): Promise<void> {
  const { collections, modes } = msg;

  const exporter = new VariableExporter();
  const css = await exporter.exportToCSS(collections, modes);

  figma.ui.postMessage({
    type: MESSAGE_TYPES.CSS_RESULT,
    success: true,
    data: {
      css: css,
      filename: `tokens-${Date.now()}.css`
    }
  });
}
```

---

## 📊 Summary Table

| Feature | Current State | Completeness | Priority |
|---------|---------------|--------------|----------|
| **Onboarding Flow** | ❌ None | 0% | 🔴 Critical |
| **First-time UX** | ❌ None | 0% | 🔴 Critical |
| **Theme Builder** | ❌ Placeholder | 0% | 🔴 Critical |
| **Token Import** | ✅ Functional | 90% | 🟢 Good |
| **Alias Resolution** | ✅ Functional | 95% | 🟢 Good |
| **JSON Export** | ❌ Stubbed | 0% | 🟡 Important |
| **CSS Export** | ❌ Stubbed | 0% | 🟡 Important |
| **Text Styles Export** | ✅ Functional | 100% | 🟢 Good |
| **State Management** | ⚠️ Minimal | 10% | 🟡 Important |
| **User Preferences** | ❌ None | 0% | 🟡 Important |
| **Error Handling** | ✅ Robust | 80% | 🟢 Good |
| **Performance** | ⚠️ Acceptable | 70% | 🟡 Needs improvement |
| **Code Quality** | ⚠️ Monolithic | 40% | 🟡 Needs refactor |
| **Test Coverage** | ❌ None | 0% | 🔴 Critical |

---

## 🎯 Key Takeaways for Redesign

### What Works Well
- ✅ Token import pipeline (parsing, processing, variable creation)
- ✅ Alias resolution with circular dependency detection
- ✅ Automatic scope assignment
- ✅ Error handling system
- ✅ Split-panel UI for token tree + editor

### What Needs Complete Redesign
- 🔴 **Onboarding flow** - Build from scratch
- 🔴 **Theme Builder** - Implement full wizard
- 🔴 **Export functionality** - Complete JSON/CSS exports
- 🔴 **State management** - Add clientStorage persistence

### What Needs Enhancement
- 🟡 **UI structure** - Break up monolithic ui.html
- 🟡 **Performance** - Optimize for large token sets (5,000+)
- 🟡 **Code quality** - Remove duplicates, reduce 'any' usage
- 🟡 **Testing** - Add unit tests for core logic

---

## 📚 Appendix: File Manifest

### Current Codebase Structure

```
clara plugin/
├── src/
│   ├── main.ts (223 lines)
│   ├── main-figma.ts (5,291 lines) [DEPRECATED]
│   ├── classes/
│   │   ├── TokenProcessor.ts (483 lines)
│   │   ├── VariableManager.ts (477 lines)
│   │   ├── VariableExporter.ts (406 lines)
│   │   ├── AdvancedAliasResolver.ts (246 lines)
│   │   ├── ProductionErrorHandler.ts (200 lines)
│   │   └── TextStyleExtractor.ts (480 lines)
│   ├── constants/
│   │   └── index.ts (106 lines)
│   └── types/
│       └── tokens.ts (205 lines)
├── ui.html (11,471 lines) [MONOLITH]
├── manifest.json
├── package.json
├── tsconfig.json
└── ../../clara-tokens.json (example tokens)
```

### Total Lines of Code

| Category | Lines | Percentage |
|----------|-------|------------|
| Backend (TypeScript) | ~2,500 | 18% |
| Frontend (ui.html) | ~11,471 | 82% |
| **Total** | **~14,000** | **100%** |

**Monolith Alert:** 82% of code is in a single HTML file!

---

## 🔗 Related Documentation

- Git commit: `5a11c67` (current state snapshot)
- Previous refactoring plan: `REFACTORING_PLAN.md` (deleted)
- Example tokens: `../../clara-tokens.json`

---

**Document Version:** 1.0
**Last Updated:** 2025-11-14
**Prepared For:** Perplexity UI Redesign Planning
