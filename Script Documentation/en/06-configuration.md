# Configuration - Clara Tokens Plugin

> Documentation of TypeScript and Figma configuration files

[⬅️ Test Scripts](05-test-scripts.md) | [Index](../README.md) | [➡️ Workflow Guide](99-workflow-guide.md)

---

## 📋 Table of Contents

- [tsconfig.json](#tsconfigjson)
- [manifest.json](#manifestjson)
- [package.json](#packagejson)

---

## tsconfig.json

> TypeScript compiler configuration

**Path:** `/Figma Plugin/clara plugin/tsconfig.json`

### Complete configuration

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "module": "none",
    "lib": ["ES2017"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": false,
    "sourceMap": false,
    "removeComments": true
  },
  "include": ["src/main-figma.ts"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### Options explained

#### target: "ES2017"
- **What it does:** Compiles TypeScript → JavaScript ES2017
- **Why:** Figma supports ES2017
- **Don't change:** Figma requires at least ES2017

#### module: "none"
- **What it does:** NO module system (no AMD, CommonJS, ESM)
- **Why:** Figma requires single JavaScript file without import/export
- **Critical:** Without this, plugin won't work in Figma

#### strict: true
- **What it does:** Enables all strict TypeScript options
- **Includes:**
  - `strictNullChecks`: Explicit null/undefined
  - `strictFunctionTypes`: Strict function type checking
  - `noImplicitAny`: Error on implicit `any`

#### sourceMap: false
- **What it does:** Doesn't generate .map files
- **Why:** Reduces output size (~50%)
- **Debug:** Change to `true` for debugging

---

## manifest.json

> Figma plugin manifest

**Path:** `/Figma Plugin/clara plugin/manifest.json`

### Complete configuration

```json
{
  "name": "Clara Tokens",
  "id": "1495722115809572711",
  "api": "1.0.0",
  "main": "code.js",
  "ui": "ui.html",
  "capabilities": ["inspect"],
  "permissions": ["teamlibrary"],
  "editorType": ["figma", "dev"],
  "documentAccess": "dynamic-page",
  "networkAccess": {
    "allowedDomains": [
      "fonts.googleapis.com",
      "fonts.gstatic.com"
    ]
  }
}
```

### Fields explained

#### name: "Clara Tokens"
- **What it does:** Name displayed in Figma
- **Modifiable:** Yes
- **Visible:** Plugin menu, marketplace

#### permissions: ["teamlibrary"]
- **What it does:** Requests Team Libraries access
- **Critical for:** LibraryManager class
- **Without:** Import from external libraries fails

**Other available permissions:**
- `"activeusers"`: See active users
- `"filelinks"`: Create file/node links
- `"fullscreen"`: Fullscreen mode

#### editorType: ["figma", "dev"]
- **What it does:** Where plugin works
- **Values:**
  - `"figma"`: Figma Design
  - `"figjam"`: FigJam
  - `"dev"`: Dev Mode

---

## package.json

> NPM configuration and dependencies

**Path:** `/Figma Plugin/clara plugin/package.json`

### Complete configuration

```json
{
  "name": "clara-tokens",
  "version": "1.0.0",
  "description": "Figma plugin for managing design tokens",
  "main": "code.js",
  "scripts": {
    "build": "tsc && cp dist/main-figma.js code.js",
    "dev": "tsc --watch",
    "lint": "eslint src/**/*.ts",
    "clean": "rm -rf dist"
  },
  "devDependencies": {
    "@figma/plugin-typings": "^1.90.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "typescript": "^5.2.0"
  }
}
```

### Key dependencies

**@figma/plugin-typings**
- **What it does:** Type definitions for Figma Plugin API
- **Includes:** `figma`, `PluginAPI`, `SceneNode`, etc.
- **Critical:** Without this, TypeScript doesn't know `figma.*`

**typescript**
- **What it does:** TypeScript compiler
- **Version:** 5.0+

---

**Last updated:** 2025-01-16 | [⬅️ Test Scripts](05-test-scripts.md) | [➡️ Workflow Guide](99-workflow-guide.md)
