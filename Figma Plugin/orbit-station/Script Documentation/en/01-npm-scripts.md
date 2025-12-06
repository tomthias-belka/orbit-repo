# NPM Scripts - Clara Tokens Plugin

> Complete guide to available npm commands for build, development and testing

[⬅️ Back to Index](../README.md) | [➡️ Main Scripts](02-main-scripts.md)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Available Scripts](#available-scripts)
  - [npm run build](#npm-run-build)
  - [npm run dev](#npm-run-dev)
  - [npm run watch](#npm-run-watch)
  - [npm run lint](#npm-run-lint)
  - [npm run clean](#npm-run-clean)
- [Typical Workflow](#typical-workflow)
- [Troubleshooting](#troubleshooting)
- [Modifying Scripts](#modifying-scripts)

---

## Overview

NPM scripts are defined in the [`package.json`](../../Figma%20Plugin/clara%20plugin/package.json) file and provide the main commands for developing the Clara Tokens plugin.

**Path:** `/Figma Plugin/clara plugin/package.json`

### Available scripts at a glance

| Script | Command | Primary Use |
|--------|---------|-------------|
| `build` | `tsc && cp dist/main-figma.js code.js` | Production build |
| `dev` | `tsc --watch` | Development with auto-rebuild |
| `watch` | `tsc --watch` | Alias for `dev` |
| `lint` | `eslint src/**/*.ts` | Code quality check |
| `clean` | `rm -rf dist` | Clean compiled files |

---

## Available Scripts

### npm run build

**Full command:**
```bash
tsc && cp dist/main-figma.js code.js
```

#### What it does

1. **Compiles TypeScript** (`tsc`)
   - Reads configuration from [`tsconfig.json`](../../Figma%20Plugin/clara%20plugin/tsconfig.json)
   - Compiles all `.ts` files in `src/`
   - Outputs to `dist/main-figma.js`
   - Target: ES2017
   - Module: none (required by Figma)

2. **Copies to code.js** (`cp dist/main-figma.js code.js`)
   - Figma requires plugin code to be in `code.js`
   - Copies the compiled file from `dist/` directory
   - `code.js` is the entry point defined in `manifest.json`

#### When to use it

- ✅ Before testing the plugin in Figma
- ✅ Before committing changes
- ✅ For production/release builds
- ✅ After significant code changes

#### Expected output

```bash
$ npm run build

> clara-tokens@1.0.0 build
> tsc && cp dist/main-figma.js code.js

# No output = success
# Generated files:
# - dist/main-figma.js (~175KB)
# - code.js (copy of dist/main-figma.js)
```

#### Configurable parameters

Modifiable in [`tsconfig.json`](../../Figma%20Plugin/clara%20plugin/tsconfig.json):

```json
{
  "compilerOptions": {
    "target": "ES2017",           // Output JavaScript version
    "module": "none",              // NO module system (Figma requirement)
    "outDir": "dist",              // Output directory
    "rootDir": "src",              // Source directory
    "strict": true,                // Strict type checking
    "skipLibCheck": true,          // Speeds up compilation
    "forceConsistentCasingInFileNames": true
  }
}
```

#### Troubleshooting

**Error: `Cannot find module`**
```bash
# Cause: Missing dependencies
# Solution:
npm install
```

**Error: `error TS2304: Cannot find name 'figma'`**
```bash
# Cause: Missing Figma type definitions
# Solution:
npm install --save-dev @figma/plugin-typings
```

**Error: `cp: cannot stat 'dist/main-figma.js'`**
```bash
# Cause: TypeScript compilation failed
# Solution: Check TypeScript errors above
# Verify that src/main-figma.ts exists
```

**Warning: `"target": "ES2017" may produce code that doesn't work in older browsers`**
```
# OK - Figma supports ES2017
# Ignore this warning
```

---

### npm run dev

**Full command:**
```bash
tsc --watch
```

#### What it does

Starts the TypeScript compiler in **watch mode**:
- Compiles the project initially
- Stays running
- Automatically recompiles when it detects changes to `.ts` files
- Shows compilation errors in real-time

#### When to use it

- ✅ During active development
- ✅ To see TypeScript errors in real-time
- ✅ When working on multiple files simultaneously

#### Expected output

```bash
$ npm run dev

> clara-tokens@1.0.0 dev
> tsc --watch

[00:00:00] Starting compilation in watch mode...
[00:00:05] Found 0 errors. Watching for file changes.

# Process stays running
# Every time you save a .ts file:
[00:01:23] File change detected. Starting incremental compilation...
[00:01:24] Found 0 errors. Compilation complete.
```

#### Recommended workflow

```bash
# Terminal 1: Start watch mode
npm run dev

# Leave it running, work on .ts files in src/

# Terminal 2: When ready to test in Figma
npm run build  # Copies dist/main-figma.js to code.js
```

#### Important

⚠️ **`npm run dev` does NOT automatically copy to `code.js`**

To test in Figma:
1. Save changes (watch mode compiles automatically)
2. Run `npm run build` to copy to `code.js`
3. Reload plugin in Figma (Cmd+Option+P on Mac, Ctrl+Alt+P on Windows)

#### Useful shortcuts

**Stop watch mode:**
- Mac: `Cmd + C` in terminal
- Windows/Linux: `Ctrl + C` in terminal

**Restart watch mode:**
```bash
# If watch mode gets stuck:
Ctrl+C  # Stop
npm run dev  # Restart
```

#### Troubleshooting

**Watch mode doesn't detect changes:**
```bash
# Possible causes:
# 1. File system limit (Linux/Mac)
# 2. Editor saving in non-standard way

# Solution:
# Restart watch mode
Ctrl+C
npm run dev
```

**Errors persist after fix:**
```bash
# Cause: TypeScript cache
# Solution:
npm run clean
npm run dev
```

---

### npm run watch

**Full command:**
```bash
tsc --watch
```

#### What it does

**Identical alias to `npm run dev`**

Provided for compatibility with other projects that use `npm run watch` as a convention.

#### When to use it

- ✅ Personal preference over `dev`
- ✅ Compatibility with documentation mentioning `watch`

---

### npm run lint

**Full command:**
```bash
eslint src/**/*.ts
```

#### What it does

Runs **ESLint** on all TypeScript files in `src/`:
- Checks code style
- Detects common problems
- Enforces TypeScript best practices
- Identifies unused code

#### When to use it

- ✅ Before committing
- ✅ After significant refactoring
- ✅ For code review self-check
- ✅ Before merge/PR

#### Expected output

**No issues:**
```bash
$ npm run lint

> clara-tokens@1.0.0 lint
> eslint src/**/*.ts

# No output = all good
```

**With issues:**
```bash
$ npm run lint

/path/to/src/main.ts
  45:7  error    'unusedVar' is assigned a value but never used  @typescript-eslint/no-unused-vars
  78:15 warning  Unexpected console statement                     no-console

✖ 2 problems (1 error, 1 warning)
```

#### Configured rules

ESLint rules are configured via:
- `.eslintrc.json` (if present)
- Inline in `package.json`
- TypeScript plugin (`@typescript-eslint/eslint-plugin`)

**Main rules:**
- No unused variables
- No console.log in production
- Consistent code formatting
- TypeScript-specific rules

#### Automatic fixes

ESLint can automatically fix some issues:

```bash
# Auto-fix (modifies files)
npx eslint src/**/*.ts --fix

# Preview fix (without modifying)
npx eslint src/**/*.ts --fix-dry-run
```

⚠️ **Warning:** `--fix` modifies files directly

#### Ignoring specific errors

**Inline ignore (single line):**
```typescript
// eslint-disable-next-line no-console
console.log('Debug message');
```

**Ignore block:**
```typescript
/* eslint-disable no-console */
console.log('Debug 1');
console.log('Debug 2');
/* eslint-enable no-console */
```

**Ignore entire file:**
```typescript
// At the beginning of the file
/* eslint-disable */
```

#### Troubleshooting

**Error: `ESLint not found`**
```bash
# Install dependencies
npm install
```

**Too many legacy errors:**
```bash
# Option 1: Automatic fixes
npx eslint src/**/*.ts --fix

# Option 2: Focus on errors only (ignore warnings)
npx eslint src/**/*.ts --quiet
```

**Slow performance:**
```bash
# Limit scope
npx eslint src/main.ts  # Single file
npx eslint src/classes/*.ts  # Only classes
```

---

### npm run clean

**Full command:**
```bash
rm -rf dist
```

#### What it does

Completely removes the `dist/` directory:
- Deletes all compiled JavaScript files
- Cleans compilation cache
- Forces complete rebuild on next `npm run build`

#### When to use it

- ✅ When build seems corrupted
- ✅ Before production/release build
- ✅ When `tsconfig.json` is modified
- ✅ To resolve strange compilation errors
- ✅ Before important commit (fresh build)

#### Expected output

```bash
$ npm run clean

> clara-tokens@1.0.0 clean
> rm -rf dist

# No output
# dist/ directory removed
```

#### Complete clean + build workflow

```bash
# Complete clean and rebuild
npm run clean
npm run build

# Verify
ls dist/  # Should show main-figma.js
ls -lh code.js  # Should exist
```

#### Important

⚠️ **`clean` does NOT delete `code.js`**

If you want complete cleanup:
```bash
npm run clean
rm code.js
npm run build
```

#### Troubleshooting

**Error: `rm: dist: No such file or directory`**
```
# Normal if dist/ doesn't exist
# Ignore - not an error
```

**Insufficient permissions (rare):**
```bash
# If rm fails due to permissions
sudo npm run clean  # Only if necessary
```

---

## Typical Workflow

### New Feature Development

```bash
# 1. Initial setup
cd "Figma Plugin/clara plugin"
npm install

# 2. Start watch mode
npm run dev  # Terminal 1 - leave running

# 3. Work on .ts files
# Edit src/classes/TokenProcessor.ts
# Watch mode recompiles automatically

# 4. Test in Figma
npm run build  # Terminal 2 - copy to code.js
# Reload plugin in Figma

# 5. Check code quality
npm run lint

# 6. Fix any lint issues
npx eslint src/**/*.ts --fix

# 7. Final build
npm run clean
npm run build

# 8. Final test in Figma
# Reload plugin and verify everything works
```

### Quick Bug Fix

```bash
# 1. Edit file
# Edit src/utils/colorUtils.ts

# 2. Immediate build
npm run build

# 3. Test in Figma
# Reload plugin

# 4. Lint check
npm run lint
```

### Release/Deploy

```bash
# 1. Complete cleanup
npm run clean
rm code.js

# 2. Fresh install dependencies (optional)
rm -rf node_modules
npm install

# 3. Lint check
npm run lint

# 4. Production build
npm run build

# 5. Verify size
ls -lh code.js  # Should be ~175KB

# 6. Complete test in Figma
# Load plugin and test all features

# 7. Commit
git add .
git commit -m "release: vX.Y.Z"
```

---

## Troubleshooting

### Build fails without clear errors

```bash
# 1. Complete cleanup
npm run clean
rm -rf node_modules
rm package-lock.json

# 2. Reinstall dependencies
npm install

# 3. Verify TypeScript
npx tsc --version  # Should be 5.0+

# 4. Build with verbose
npx tsc --verbose

# 5. Rebuild
npm run build
```

### Watch mode doesn't work

```bash
# 1. Check running process
ps aux | grep tsc

# 2. Kill old processes
pkill -f "tsc --watch"

# 3. Clean restart
npm run dev
```

### Lint too slow

```bash
# 1. Lint only modified files
npx eslint src/main.ts

# 2. ESLint cache
npx eslint src/**/*.ts --cache

# 3. Ignore node_modules (should already)
# Verify .eslintignore exists
```

### code.js doesn't update in Figma

```bash
# 1. Verify recent build
ls -l code.js  # Check timestamp

# 2. Force rebuild
npm run clean
npm run build

# 3. Verify size
ls -lh code.js  # ~175KB

# 4. Hard reload Figma
# Mac: Cmd+Option+P then "Reload"
# Windows: Ctrl+Alt+P then "Reload"

# 5. Close and reopen plugin
```

---

## Modifying Scripts

### Add new npm script

**Edit `package.json`:**

```json
{
  "scripts": {
    "build": "tsc && cp dist/main-figma.js code.js",
    "dev": "tsc --watch",
    "watch": "tsc --watch",
    "lint": "eslint src/**/*.ts",
    "clean": "rm -rf dist",

    // New script: Build + auto-reload
    "build:watch": "tsc --watch && npm run copy",
    "copy": "cp dist/main-figma.js code.js",

    // New script: Complete test
    "test": "npm run lint && npm run build",

    // New script: Automatic formatting
    "format": "prettier --write src/**/*.ts"
  }
}
```

### Modify build target

**Edit `tsconfig.json`:**

```json
{
  "compilerOptions": {
    // Change JavaScript version
    "target": "ES2020",  // Default: ES2017

    // Enable source maps (debug)
    "sourceMap": true,  // Default: false

    // Different output
    "outDir": "build",  // Default: dist
  }
}
```

**Update build script:**
```json
{
  "scripts": {
    "build": "tsc && cp build/main-figma.js code.js"
  }
}
```

### Add pre-build hook

```json
{
  "scripts": {
    "prebuild": "npm run lint",  // Executed BEFORE build
    "build": "tsc && cp dist/main-figma.js code.js",
    "postbuild": "ls -lh code.js"  // Executed AFTER build
  }
}
```

### Multiple builds (dev vs prod)

```json
{
  "scripts": {
    "build:dev": "tsc --sourceMap && cp dist/main-figma.js code.js",
    "build:prod": "tsc --removeComments && cp dist/main-figma.js code.js"
  }
}
```

---

## Useful Links

- [📖 Main Scripts](02-main-scripts.md) - Entry points and architecture
- [📖 Configuration](06-configuration.md) - tsconfig.json details
- [📖 Workflow Guide](99-workflow-guide.md) - Complete development process
- [🔗 TypeScript Compiler Options](https://www.typescriptlang.org/tsconfig)
- [🔗 ESLint Documentation](https://eslint.org/docs/latest/)

---

**Last updated:** 2025-01-16 | [⬅️ Index](../README.md) | [➡️ Main Scripts](02-main-scripts.md)
