# Test Scripts - Clara Tokens Plugin

> Documentation of test suites and testing framework

[⬅️ Utility Scripts](04-utility-scripts.md) | [Index](../README.md) | [➡️ Configuration](06-configuration.md)

---

## 📋 Table of Contents

- [Overview](#overview)
- [colorVariantGenerator.test.js](#colorvariantgeneratortestjs)
- [themeValidator.test.js](#themevalidatortestjs)
- [How to run tests](#how-to-run-tests)
- [How to add new tests](#how-to-add-new-tests)

---

## Overview

Test scripts verify the correctness of critical plugin functionalities.

**Path:** `/Figma Plugin/clara plugin/tests/`

| Test File | Target | Test Cases | Coverage |
|-----------|--------|------------|----------|
| `colorVariantGenerator.test.js` | `utils/colorVariantGenerator.js` | 25+ | ~85% |
| `themeValidator.test.js` | `utils/themeValidator.js` | 20+ | ~90% |

**Framework:** Jest-compatible (currently not configured)

---

## colorVariantGenerator.test.js

> Unit tests for color variant generation

**File:** `tests/colorVariantGenerator.test.js`

### Test Suites

```javascript
describe('generateCoreVariants', () => {
  test('generates all core variants', () => {
    const result = generateCoreVariants('{colors.teal.500}', mockTokenData);

    expect(result).toHaveProperty('main');
    expect(result).toHaveProperty('light');
    expect(result).toHaveProperty('soft');
    expect(result).toHaveProperty('dark');
    expect(result).toHaveProperty('faded');
  });

  test('clamps soft to minimum available step', () => {
    const result = generateCoreVariants('{colors.teal.100}', mockTokenData);
    expect(result.soft).toBe('{colors.teal.50}');
  });
});
```

---

## How to run tests

### Initial setup

**1. Install Jest:**

```bash
npm install --save-dev jest @types/jest
```

**2. Configure package.json:**

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

### Run tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage
```

---

## How to add new tests

### Base template

```javascript
import { myFunction } from '../src/utils/myUtils';

describe('myFunction', () => {
  test('should do something correctly', () => {
    // Arrange
    const input = { /* test data */ };

    // Act
    const result = myFunction(input);

    // Assert
    expect(result).toBeDefined();
  });
});
```

### Best practices

**1. Focused unit tests**
**2. Realistic mock data**
**3. Test edge cases**
**4. Use describe for grouping**

### Test coverage goals

- **Critical:** 90%+ (colorVariantGenerator, themeValidator)
- **Core:** 80%+ (TokenProcessor, VariableManager)
- **Utilities:** 70%+ (colorUtils, validationUtils)

---

**Last updated:** 2025-01-16 | [⬅️ Utility Scripts](04-utility-scripts.md) | [➡️ Configuration](06-configuration.md)
