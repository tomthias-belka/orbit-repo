# Workflow Guide - Clara Tokens Plugin

> Complete guide to the development process

[⬅️ Configuration](06-configuration.md) | [Index](../README.md)

---

## 📋 Table of Contents

- [Initial Setup](#initial-setup)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Build & Deploy](#build--deploy)
- [Debugging](#debugging)
- [Best Practices](#best-practices)
- [Common Troubleshooting](#common-troubleshooting)

---

## Initial Setup

### 1. Clone and install

```bash
# Navigate to plugin directory
cd "/Figma Plugin/clara plugin"

# Install dependencies
npm install

# Verify installation
npm list --depth=0
```

### 2. Initial build

```bash
# Clean (if old files exist)
npm run clean

# Build
npm run build

# Verify output
ls -lh code.js  # Should be ~175KB
```

### 3. Load plugin in Figma

1. Open Figma Desktop
2. Menu: Plugins → Development → Import plugin from manifest...
3. Select `manifest.json` in plugin directory
4. Plugin appears in: Plugins → Development → Clara Tokens

---

## Development Workflow

### Recommended workflow (Development)

```bash
# Terminal 1: Watch mode
cd "/Figma Plugin/clara plugin"
npm run dev

# Leave running - automatically recompiles when you save .ts files
```

Now work on TypeScript files:

```bash
# Edit file (example)
vim src/classes/TokenProcessor.ts

# Save - watch mode compiles automatically
# See output in terminal:
# [00:01:23] File change detected. Starting incremental compilation...
# [00:01:24] Found 0 errors. Compilation complete.
```

When ready to test in Figma:

```bash
# Terminal 2: Build for Figma
npm run build

# In Figma:
# Cmd+Option+P (Mac) or Ctrl+Alt+P (Windows)
# Plugins → Development → Clara Tokens
```

### Quick workflow (Quick Fix)

```bash
# 1. Edit file
vim src/utils/colorUtils.ts

# 2. Immediate build
npm run build

# 3. Test in Figma
# Reload plugin: Cmd+Option+P → Clara Tokens
```

### Complete workflow (Feature Development)

```bash
# 1. Create branch (if using git)
git checkout -b feature/new-token-type

# 2. Start watch mode
npm run dev

# 3. Develop feature
# - Edit .ts files
# - Watch mode compiles automatically

# 4. Write tests
vim tests/newFeature.test.js

# 5. Run tests (if configured)
npm test

# 6. Lint check
npm run lint

# 7. Auto-fix lint
npx eslint src/**/*.ts --fix

# 8. Final build
npm run clean
npm run build

# 9. Complete manual test in Figma
# - Load plugin
# - Test all use cases
# - Verify no console errors

# 10. Commit
git add .
git commit -m "feat: add support for new token type"
```

---

## Testing

### Manual testing in Figma

**1. Preparation:**
```bash
npm run build
```

**2. Load plugin in Figma:**
- Plugins → Development → Clara Tokens

**3. Test token import:**
- Prepare test JSON file
- Click "Import" in plugin
- Select file
- Verify import success
- Check created variables in Figma

**4. Console debugging:**
```bash
# In Figma:
# Cmd+Option+I (Mac) or Ctrl+Shift+I (Windows)
# Opens DevTools
# Console tab → See plugin logs
```

---

## Build & Deploy

### Production build

```bash
# 1. Complete cleanup
npm run clean
rm code.js

# 2. Fresh install dependencies (optional but recommended)
rm -rf node_modules package-lock.json
npm install

# 3. Lint check
npm run lint

# 4. Fix lint issues
npx eslint src/**/*.ts --fix

# 5. Final build
npm run build

# 6. Verify size
ls -lh code.js  # Target: ~175KB

# 7. Complete manual test in Figma
```

---

## Debugging

### Console debugging

**In plugin code:**

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

**View in Figma:**

1. Open plugin
2. Cmd+Option+I (Mac) or Ctrl+Shift+I (Windows)
3. Console tab
4. See all `console.log()` output

---

## Best Practices

### Code organization

**1. Separation of concerns:**
```typescript
// ❌ Bad: Everything in one function
function handleImport(jsonData: any) {
  // 200 lines of code...
}

// ✅ Good: Separate functions
function handleImport(jsonData: any) {
  const validated = validateData(jsonData);
  const processed = processTokens(validated);
  const result = importToFigma(processed);
  return result;
}
```

**2. Type safety:**
```typescript
// ❌ Bad: any everywhere
function processToken(token: any): any {
  return token.value;
}

// ✅ Good: Explicit types
function processToken(token: ProcessedToken): FigmaValue {
  return convertValue(token.value, token.type);
}
```

---

## Common Troubleshooting

### Build fails

**Symptom:** `npm run build` error

```bash
# 1. Clean everything
npm run clean
rm -rf node_modules package-lock.json

# 2. Reinstall
npm install

# 3. Verify TypeScript version
npx tsc --version  # Should be 5.0+

# 4. Build with verbose
npx tsc --verbose
```

### Plugin doesn't load in Figma

**Symptom:** Plugin doesn't appear or error on load

```bash
# 1. Verify code.js exists
ls -l code.js

# 2. Verify reasonable size
ls -lh code.js  # ~175KB

# 3. Rebuild clean
npm run clean
npm run build
```

---

**Last updated:** 2025-01-16 | [⬅️ Configuration](06-configuration.md) | [⬆️ Index](../README.md)
