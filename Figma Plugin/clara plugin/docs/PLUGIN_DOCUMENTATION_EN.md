# Luckino Import Export — Documentation (English)

This documentation mirrors the Italian version and is aimed at developers who will maintain or extend the plugin. It covers architecture, key concepts (dynamic variables, scopes, types), import/export flows, examples, API messages, and suggestions for extension.

## Summary

- Overview
- Quick contract (input/output)
- Architecture and main files
- Key concepts
  - Figma Variables and dynamic variables
  - Alias and resolution (two-pass)
  - Scopes and type mapping
- Import
  - JSON format supported
  - Flow: parsing → TokenProcessor → VariableManager
  # Luckino Import Export — Documentation (English)

  This documentation is technical and intended for developers who need to maintain or extend the plugin. It contains architecture, key concepts (dynamic variables, scopes, types), import/export flows, practical examples, API and suggestions to extend or fix behavior.

  ## Summary

  - Overview
  - Quick contract (input/output)
  - Architecture and main files
  - Key concepts
    - Figma Variables and dynamic variables
    - Alias and resolution (two-pass)
    - Scopes and type mapping
  - Import
    - JSON format supported
    - Flow: parsing → TokenProcessor → VariableManager
    - Examples
  - Export
    - Implementation status
    - Formats and generators (CSS/SCSS/JSON)
  - API and UI messages
  - Dev setup, build, quick test
  - How to extend / integration points
  - Edge cases and QA suggestions
  - Technical checklist

  ---

  ## Overview

  Luckino Import Export is a Figma plugin for importing and exporting variables/design tokens in different formats. It mainly uses the `figma.variables` APIs and an internal token/alias system that allows:

  - Importing design token JSON and converting them into Figma `Variable Collections` and `Variables`.
  - Exporting (partial / in-progress) into formats such as JSON/Tokens and CSS (CSS variables).
  - Resolving aliases between variables (e.g. a variable that points to another) with circular reference handling and fallbacks.
  - Mapping scopes and semantic types (e.g. `FONT_SIZE`, `CORNER_RADIUS`) to ensure variables are usable in the correct Figma properties.

  Current version: v1.0.0 (branch: experimental-changes) — some advanced export capabilities are still marked as "in progress" in `src/main.ts`.

  ---

  ## Quick contract

  - Main inputs
    - JSON (string or object) that represents collections of tokens/variables.
    - UI messages (via `figma.ui.postMessage`) like `IMPORT_JSON`, `EXPORT_JSON_ADVANCED`, `EXPORT_CSS`, etc.

  - Main outputs
    - Creation/update of `VariableCollections` and `Variables` in Figma.
    - Response messages sent back to the UI (e.g. `IMPORT_RESULT`, `JSON_ADVANCED_RESULT`, `CSS_RESULT`).

  - Error modes
    - `skipInvalid`: option to ignore invalid variables during import.
    - Fallback for unresolved aliases (generates placeholder CSS or token with partial ID).

  ---

  ## Architecture and main files

  `src/` folder — TypeScript code:

  - `src/main.ts` — Main entry: initializes plugin, handles UI messages, coordinates `TokenProcessor` and `VariableManager`.
  - `src/main-figma.ts` — Consolidated Figma-compatible version (contains utilities and logic: alias handling, scope->type mapping, advanced resolver).
  - `src/simple-import.ts` — Simplified import: JSON parsing and recursive creation of variables/collections.
  - `src/classes/TokenProcessor.ts` — Parsing and normalization of tokens; detects aliases and builds import structure.
  - `src/classes/VariableManager.ts` — Logic for creating/updating Figma variables and collections, setting values per mode, handling overwrites.
  - `src/classes/VariableExporter.ts` — (exports tokens from variable collections) — export functionality to JSON/Tokens.
  - `src/classes/CSSExporter.ts` — CSS/SCSS generator (export area) and alias resolution helpers for CSS output.
  - `src/classes/AdvancedAliasResolver.ts` (in `main-figma.ts` consolidated) — robust alias resolver with cache, loop protection and fallbacks.
  - `src/classes/ProductionErrorHandler.ts` — Centralized logging and error handling (notifications, send to UI).
  - `src/constants/index.ts` — Contains `MESSAGE_TYPES`, `UI_CONFIG`, mappings and limits used by the plugin.
  - `src/types/*` — TypeScript types (PluginMessage, PluginResponse, tokens, etc.).

  Other important files:
  - `manifest.json` — Figma plugin manifest.
  - `package.json` — build script (`npm run build` runs `tsc && cp dist/main-figma.js code.js`).
  - `ui.html` — Plugin UI (frontend communicates via postMessage).
  - `tokens/variables.tokens.json` — Example/reference tokens.

  ---

  ## Key concepts

  ### Figma Variables and dynamic variables

  The plugin uses `figma.variables.*` APIs to create `VariableCollection` and `Variable`. Each `Variable` can have values for multiple `modes` (e.g. "Default", "Dark"), and has Figma types: `COLOR`, `FLOAT`, `STRING`, `BOOLEAN`.

  The plugin also handles variables that contain references to other variables (aliases): these are represented internally as objects with `type: 'VARIABLE_ALIAS'` and `id: '<figma-variable-id>'`.

  ### Alias and resolution (two-pass)

  To handle aliases and cross-references the plugin uses a two-pass system:

  1. First pass: create variables and record references/aliases in `pendingAliases` (not resolved yet because referenced variable might not exist).
  2. Second pass: use `AdvancedAliasResolver` to resolve aliases, with cache and circular reference protection. If reference not found a fallback is generated (e.g. `var(--unknown-variable-xxxx)` for CSS or `{unknown-variable-xxxx}` for JSON).

  `AdvancedAliasResolver` supports options like `format` (css/tokens/json), `maxDepth`, `variableMap` and `nameTransform`.

  ### Scopes and type mapping

  Figma uses scopes to indicate where a variable can be applied (e.g. `FONT_SIZE`, `STROKE_COLOR`, `ALL_FILLS`). The plugin contains a semantic mapping `SCOPE_TO_TYPE_MAPPING` that converts scopes into more readable token types (e.g. `CORNER_RADIUS` -> `borderRadius`).

  Also `FIGMA_TO_TOKEN_TYPE` converts Figma types (`COLOR`, `FLOAT`, `STRING`, `BOOLEAN`) into token types (`color`, `number`, `string`, `boolean`).

  The function `getTokenType(variable)` (in `main-figma.ts`) decides the token type using this hierarchy:
  - If no scopes -> use `resolvedType` converted via `FIGMA_TO_TOKEN_TYPE`.
  - If `ALL_SCOPES` present -> fallback to generic type.
  - If a single scope -> use `SCOPE_TO_TYPE_MAPPING` to obtain semantic type.

  ### Mapping: Figma scope -> token type

  Below is the complete mapping used by the plugin (`SCOPE_TO_TYPE_MAPPING` in `src/main-figma.ts`) that converts Figma scopes into semantic token types used for export/import and to decide how to treat values:

  - CORNER_RADIUS -> borderRadius
  - GAP -> spacing
  - WIDTH_HEIGHT -> size
  - STROKE_FLOAT -> strokeWidth
  - STROKE -> strokeWidth
  - LAYER_OPACITY -> opacity
  - EFFECTS -> shadow
  - FILLS -> fill
  - STROKES -> stroke
  - TEXT_COLOR -> textColor
  - ALL_FILLS -> color
  - FRAME_FILL -> color
  - SHAPE_FILL -> color
  - TEXT_FILL -> color
  - STROKE_COLOR -> color
  - EFFECT_COLOR -> color
  - FONT_FAMILY -> fontFamily
  - FONT_WEIGHT -> fontWeight
  - FONT_SIZE -> fontSize
  - LINE_HEIGHT -> lineHeight
  - LETTER_SPACING -> letterSpacing
  - PARAGRAPH_SPACING -> paragraphSpacing
  - PARAGRAPH_INDENT -> paragraphIndent
  - TEXT_CONTENT -> string

  In addition, direct conversion of the Figma types used internally (`FIGMA_TO_TOKEN_TYPE`) is:

  - COLOR -> color
  - FLOAT -> number
  - STRING -> string
  - BOOLEAN -> boolean

  Usage notes:
  - When `getTokenType` finds a single scope, it applies the above mapping to obtain a semantic type (useful for exporting as `borderRadius`, `spacing`, `fontSize`, etc.).
  - If no scopes are present, the plugin falls back to the resolved type and converts it via `FIGMA_TO_TOKEN_TYPE`.
  - `ALL_FILLS` and some other scopes are normalized to `color` for compatibility with CSS/JSON generators.

  ---

  ## Import

  ### General flow

  1. The UI sends `IMPORT_JSON` with payload `{ json: '<stringified JSON>' }`.
  2. `main.ts` calls `tokenProcessor.processTokensForImport(jsonData)` to normalize, detect aliases and build the "collections" structure.
  3. `variableManager.importTokensAsVariables(collections, options)` creates/updates `VariableCollections` and `Variables` in Figma.
  4. Result sent back to the UI as `IMPORT_RESULT` (success, message, counts).

  There is also a simplified version `simpleImportVariables(jsonData)` in `src/simple-import.ts` that:
  - Reads the JSON object as a map of collections & variables.
  - Creates collection if not present.
  - Creates variables (with `createVariable`) and sets value for the `Default` mode.
  - Attempts to convert known types (color/number/string/boolean) and sets base scopes via heuristics.

  ### JSON format supported (example)

  ```json
  {
    "theme": {
      "colors": {
        "brand": {
          "primary": { "$value": "#3366FF", "$type": "color" },
          "secondary": { "$value": "#FF3366", "$type": "color" }
        }
      },
      "spacing": {
        "small": { "$value": "8", "$type": "number" },
        "medium": { "$value": "16", "$type": "number" }
      }
    }
  }
  ```

  Rules:
  - Every node representing a variable should contain `value` or `$value` and preferably `type` or `$type`.
  - Nodes starting with `$` are treated as metadata and skipped as collections.
  - Aliases can be written as strings like `"{other.collection.var}"` or as normalized objects with `type: 'VARIABLE_ALIAS'` and `id: '<figma-id>'`.

  ### Important options

  - `overwriteExisting` (bool) — if true overwrites existing variables with the same name.
  - `skipInvalid` (bool) — if true ignores variables with unsupported types.

  ### Example: step-by-step import

  1. Open the UI (Figma) and paste the example JSON.
  2. Press "Import".
  3. The plugin will create a `theme` collection with variables like `colors/brand/primary` and `spacing/small`.

  ---

  ## Export

  ### Implementation status

  In `src/main.ts`, `EXPORT_JSON_ADVANCED` and `EXPORT_CSS` handlers currently reply with "will be implemented in next phase". However, the project contains export classes (`CSSExporter`, `VariableExporter`, generators in `css-export/generators`) that define generators for CSS/SCSS/JSON.

  This means core logic to generate output exists in large part, but full integration with the UI command (and some advanced options) needs completion and testing.

  ### Supported / planned formats

  - JSON/Tokens (hierarchical structure with metadata). Good for exchanging tokens with systems like Style Dictionary.
  - CSS/SCSS: variables generated as `:root { --token-name: value; }` or using `var(--token)` for aliases.
  - SCSS: generation of maps and helper functions for integration in asset pipelines.

  ### Aliases in export

  When a variable is an alias to another, `AdvancedAliasResolver.resolveCSSAlias` returns `var(--transformed-name)` to produce readable CSS output.

  ---

  ## API and UI messages

  UI messages used (in `constants`) are:
  - `UI_READY` — UI initialized, request initial data.
  - `GET_COLLECTIONS` / `COLLECTIONS_DATA` — request and return local collections.
  - `IMPORT_JSON` / `IMPORT_RESULT` — simple/advanced import.
  - `EXPORT_JSON_ADVANCED` / `JSON_ADVANCED_RESULT` — advanced JSON export.
  - `EXPORT_CSS` / `CSS_RESULT` — CSS export.
  - `PREVIEW_IMPORT` / `PREVIEW_RESULT` — import preview (useful for sandboxing before applying changes).
  - GitHub management messages: `LOAD_GITHUB_CONFIG`, `TEST_GITHUB_CONNECTION`, `UPLOAD_TO_GITHUB`, etc. (the plugin includes utilities for GitHub upload configured in the manifest network permissions).

  Main internal APIs (files / classes):
  - `TokenProcessor.processTokensForImport(json)` → { success, collections, aliasCount, message }
  - `VariableManager.importTokensAsVariables(collections, options)` → { success, variableCount, collectionCount, message }
  - `simpleImportVariables(json)` (exported helper for quick import)
  - `AdvancedAliasResolver.resolveAlias(value, options)` → AliasResolutionResult

  ---

  ## Dev setup, build and quick test

  Prerequisites: Node.js (LTS), npm.

  1. Clone the repo.
  2. Install dev dependencies:

  ```bash
  npm install
  ```

  3. Build:

  ```bash
  npm run build
  ```

  This runs `tsc` and copies `dist/main-figma.js` to `code.js` (used by `manifest.json`).

  4. In development:

  ```bash
  npm run dev
  # or
  npm run watch
  ```

  5. Load the plugin in Figma:
  - Figma -> Plugins -> Development -> "Import plugin from manifest..." and select the project folder (ensure `manifest.json`, `code.js`, `ui.html` are present).

  6. Linting:

  ```bash
  npm run lint
  ```

  Tip: editing `src/main-figma.ts` is useful for local debugging — it contains verbose console.log and consolidated versions of classes.

  ---

  ## How to extend / integration points for a developer

  To add features (e.g. S3 integration, additional formats or UI localization):

  1. Edit `TokenProcessor` to support new fields in input JSON (e.g. `description`, `category`, `deprecated`).
  2. Complete export handlers in `src/main.ts` (`handleExportJsonAdvanced` and `handleExportCss`) to call generators under `css-export/generators`.
  3. Add unit tests for `AdvancedAliasResolver` (cases: simple alias, multi-level alias, circular reference, missing variable).
  4. For performance with large token sets: use a `Map<string, Variable>` for variable lookup and avoid repeated Figma API calls.
  5. For CI/CD integration (auto-deploy generated files to GitHub): use existing endpoints in `utils/githubApi.ts` and complete the upload flow.

  Where to find extension points in code
  - Message handlers: `src/main.ts` → add new MESSAGE_TYPES and handlers.
  - CSS/SCSS generators: `src/css-export/generators/*` → add templates or options.
  - Scope->type mapping and heuristics: `src/main-figma.ts` (SCOPE_TO_TYPE_MAPPING, assignSimpleScopes).

  ---

  ## Edge cases and QA suggestions

  - Circular aliases: `AdvancedAliasResolver` reports and falls back; test with deep nesting (>10 levels).
  - Unknown types: `simpleImport` skips unknown types (log & skip) when `skipInvalid=true`.
  - Name collisions: consider normalizing names (transforms) to avoid duplicates when importing from systems with different conventions.
  - Modes: verify `collection.modes` is present; when creating a collection the plugin uses the first available mode as `Default`.
  - Performance: large imports should be batched and report progress (e.g. `figma.notify` or progress messages to the UI).

  ---

  ## Technical checklist

  - Technical documentation updated (IT + EN)
  - Example JSON and templates (place in `tokens/` with README)
  - Unit tests for `AdvancedAliasResolver` and import/export core
  - Complete export handlers (advanced JSON and CSS) and end-to-end tests
  - Developer instructions for building and deploying to Figma
  - Add license if needed and support details in `README.md`
  - Update `package.json` with `version` and changelog
  - Verify manifest and network permissions (only required domains)

  ---

  ## Practical examples

  Example JSON for quick test (simple import):

  ```json
  {
    "demo": {
      "colors": {
        "brand": {
          "primary": { "$value": "#3366FF", "$type": "color" },
          "muted": { "$value": "#E6F0FF", "$type": "color" }
        }
      },
      "typography": {
        "heading": {
          "font-size": { "$value": "24", "$type": "number" },
          "font-family": { "$value": "Inter", "$type": "string" }
        }
      }
    }
  }
  ```

  Copy/paste into the UI and press Import. You should get a `demo` collection with variables under `colors.brand.primary` and `typography.heading.font-size`.

  ---

  ## Practical notes

  - Include a license if the project will be distributed.
  - Provide clear instructions for installing the production version (files `code.js`, `manifest.json`, UI assets).

  ---

  ## Source references (for developers)

  - `manifest.json` — Permissions and entry (`main` = `code.js`, `ui` = `ui.html`).
  - `src/main.ts` — Main orchestration and message handlers.
  - `src/main-figma.ts` — Consolidated logic, alias resolver, scope->type mapping.
  - `src/simple-import.ts` — Recursive importer and heuristics for type->scope mapping.
  - `src/classes/TokenProcessor.ts` — Normalization, parsing, alias counting.
  - `src/classes/VariableManager.ts` — Create/update Variables and Collections.
  - `src/classes/CSSExporter.ts` — CSS generation and alias resolution for CSS.
  - `src/constants/index.ts` — `MESSAGE_TYPES`, `UI_CONFIG`, `SCOPE_TO_TYPE_MAPPING`.
  - `tokens/variables.tokens.json` — Example tokens for reference.

  ---

  ## Next steps I can take

  - Run quick checks (`npm run build`, lint) to ensure references in the doc are correct and update technical docs if anything differs.
  - Create unit tests for `AdvancedAliasResolver` (Jest).
  - Help complete export handlers and add end-to-end tests.

  Tell me which next step you prefer.
