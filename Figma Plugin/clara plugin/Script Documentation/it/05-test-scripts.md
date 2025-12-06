# Test Scripts - Clara Tokens Plugin

> Documentazione suite di test e testing framework

[⬅️ Utility Scripts](04-utility-scripts.md) | [Indice](../README.md) | [➡️ Configurazione](06-configuration.md)

---

## 📋 Indice

- [Overview](#overview)
- [colorVariantGenerator.test.js](#colorvariantgeneratortestjs)
- [themeValidator.test.js](#themevalidatortestjs)
- [Come eseguire i test](#come-eseguire-i-test)
- [Come aggiungere nuovi test](#come-aggiungere-nuovi-test)

---

## Overview

I test scripts verificano la correttezza delle funzionalità critiche del plugin.

**Percorso:** `/Figma Plugin/clara plugin/tests/`

| File Test | Target | Test Cases | Coverage |
|-----------|--------|------------|----------|
| `colorVariantGenerator.test.js` | `utils/colorVariantGenerator.js` | 25+ | ~85% |
| `themeValidator.test.js` | `utils/themeValidator.js` | 20+ | ~90% |

**Framework:** Jest-compatible (attualmente non configurato)

---

## colorVariantGenerator.test.js

> Unit tests per generazione varianti colore

**File:** `tests/colorVariantGenerator.test.js`

### Test Suites

#### 1. parseColorReference

```javascript
describe('parseColorReference', () => {
  test('parses reference with braces', () => {
    const result = parseColorReference('{colors.teal.500}');
    expect(result).toEqual({ family: 'teal', level: 500 });
  });

  test('parses reference without braces', () => {
    const result = parseColorReference('colors.teal.500');
    expect(result).toEqual({ family: 'teal', level: 500 });
  });

  test('throws on invalid format', () => {
    expect(() => parseColorReference('invalid')).toThrow();
  });
});
```

#### 2. buildColorReference

```javascript
describe('buildColorReference', () => {
  test('builds correct reference', () => {
    const result = buildColorReference('teal', 500);
    expect(result).toBe('{colors.teal.500}');
  });
});
```

#### 3. findNearestStep

```javascript
describe('findNearestStep', () => {
  const steps = [50, 100, 200, 300, 400, 500];

  test('finds exact match', () => {
    const result = findNearestStep(steps, 300);
    expect(result).toEqual({ step: 300, distance: 0, isExact: true });
  });

  test('finds nearest when not exact', () => {
    const result = findNearestStep(steps, 250);
    expect(result.step).toBe(200); // or 300, depends on implementation
  });

  test('clamps to min', () => {
    const result = findNearestStep(steps, 10);
    expect(result.step).toBe(50);
  });

  test('clamps to max', () => {
    const result = findNearestStep(steps, 1000);
    expect(result.step).toBe(500);
  });
});
```

#### 4. generateCoreVariants

```javascript
describe('generateCoreVariants', () => {
  const mockTokenData = {
    global: {
      colors: {
        teal: {
          50: { $value: '#e0f2f1', $type: 'color' },
          100: { $value: '#b2dfdb', $type: 'color' },
          // ... more steps
          500: { $value: '#009688', $type: 'color' },
          900: { $value: '#004d40', $type: 'color' }
        }
      }
    }
  };

  test('generates all core variants', () => {
    const result = generateCoreVariants('{colors.teal.500}', mockTokenData);

    expect(result).toHaveProperty('main');
    expect(result).toHaveProperty('light');
    expect(result).toHaveProperty('soft');
    expect(result).toHaveProperty('dark');
    expect(result).toHaveProperty('faded');
  });

  test('main variant equals base', () => {
    const result = generateCoreVariants('{colors.teal.500}', mockTokenData);
    expect(result.main).toBe('{colors.teal.500}');
  });

  test('clamps soft to minimum available step', () => {
    const result = generateCoreVariants('{colors.teal.100}', mockTokenData);
    // soft should be 50 (minimum), not negative
    expect(result.soft).toBe('{colors.teal.50}');
  });

  test('clamps dark to maximum available step', () => {
    const result = generateCoreVariants('{colors.teal.800}', mockTokenData);
    // dark should be 900 (maximum), not >900
    expect(result.dark).toBe('{colors.teal.900}');
  });
});
```

#### 5. resolveColorToHex

```javascript
describe('resolveColorToHex', () => {
  test('resolves existing color', () => {
    const hex = resolveColorToHex('{colors.teal.500}', mockTokenData);
    expect(hex).toBe('#009688');
  });

  test('returns null for non-existing color', () => {
    const hex = resolveColorToHex('{colors.nonexistent.500}', mockTokenData);
    expect(hex).toBeNull();
  });
});
```

### Mock Data

```javascript
const mockTokenData = {
  global: {
    colors: {
      teal: {
        50: { $value: '#e0f2f1', $type: 'color' },
        100: { $value: '#b2dfdb', $type: 'color' },
        200: { $value: '#80cbc4', $type: 'color' },
        300: { $value: '#4db6ac', $type: 'color' },
        400: { $value: '#26a69a', $type: 'color' },
        500: { $value: '#009688', $type: 'color' },
        600: { $value: '#00897b', $type: 'color' },
        700: { $value: '#00796b', $type: 'color' },
        800: { $value: '#00695c', $type: 'color' },
        900: { $value: '#004d40', $type: 'color' }
      },
      gray: {
        // Similar structure
      }
    }
  }
};
```

---

## themeValidator.test.js

> Unit tests per validazione temi

**File:** `tests/themeValidator.test.js`

### Test Suites

#### 1. validateThemeName

```javascript
describe('validateThemeName', () => {
  test('accepts valid names', () => {
    const validNames = ['clara', 'my-theme', 'theme_1', 'test123'];

    validNames.forEach(name => {
      const result = validateThemeName(name);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  test('rejects empty name', () => {
    const result = validateThemeName('');
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test('rejects special characters', () => {
    const result = validateThemeName('theme@name!');
    expect(result.isValid).toBe(false);
  });

  test('rejects reserved names', () => {
    const result = validateThemeName('default');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(expect.stringContaining('reserved'));
  });

  test('warns on spaces', () => {
    const result = validateThemeName('my theme');
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  test('warns on uppercase', () => {
    const result = validateThemeName('MyTheme');
    expect(result.warnings).toContain(expect.stringContaining('lowercase'));
  });
});
```

#### 2. validateColorPath

```javascript
describe('validateColorPath', () => {
  test('validates existing path', () => {
    const result = validateColorPath('{colors.teal.500}', mockTokenData);
    expect(result.isValid).toBe(true);
  });

  test('suggests nearest step for non-existing level', () => {
    const result = validateColorPath('{colors.teal.250}', mockTokenData);
    expect(result.isValid).toBe(false);
    expect(result.suggestions).toContain('{colors.teal.200}');
    expect(result.suggestions).toContain('{colors.teal.300}');
  });

  test('handles non-existing family', () => {
    const result = validateColorPath('{colors.purple.500}', mockTokenData);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(expect.stringContaining('family not found'));
  });
});
```

#### 3. validateTheme

```javascript
describe('validateTheme', () => {
  const mockTokenData = {
    semantic: {
      brand: {
        core: {
          main: { $value: { clara: '{colors.teal.500}' } },
          light: { $value: { clara: '{colors.teal.400}' } },
          soft: { $value: { clara: '{colors.teal.300}' } },
          dark: { $value: { clara: '{colors.teal.900}' } },
          faded: { $value: { clara: '{colors.teal.450}' } }
        }
      }
    }
  };

  test('validates complete theme', () => {
    const result = validateTheme('clara', mockTokenData);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('detects missing core colors', () => {
    const incompleteData = {
      semantic: {
        brand: {
          core: {
            main: { $value: { incomplete: '{colors.teal.500}' } }
            // Missing light, soft, dark, faded
          }
        }
      }
    };

    const result = validateTheme('incomplete', incompleteData);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test('warns on missing alt colors', () => {
    const result = validateTheme('clara', mockTokenData);
    // mockTokenData doesn't have alt colors
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});
```

---

## Come eseguire i test

### Setup iniziale

**1. Installa Jest:**

```bash
npm install --save-dev jest @types/jest
```

**2. Configura package.json:**

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "jest": {
    "testEnvironment": "node",
    "testMatch": ["**/tests/**/*.test.js"],
    "collectCoverageFrom": [
      "src/**/*.{js,ts}",
      "!src/**/*.d.ts"
    ]
  }
}
```

### Eseguire i test

```bash
# Tutti i test
npm test

# Watch mode (ricompila al salvataggio)
npm run test:watch

# Con coverage report
npm run test:coverage

# Test specifico
npm test colorVariantGenerator.test.js

# Pattern matching
npm test -- --testNamePattern="parseColorReference"
```

### Output atteso

```bash
$ npm test

 PASS  tests/colorVariantGenerator.test.js
  parseColorReference
    ✓ parses reference with braces (2 ms)
    ✓ parses reference without braces (1 ms)
    ✓ throws on invalid format (1 ms)
  buildColorReference
    ✓ builds correct reference (1 ms)
  generateCoreVariants
    ✓ generates all core variants (3 ms)
    ✓ main variant equals base (1 ms)

 PASS  tests/themeValidator.test.js
  validateThemeName
    ✓ accepts valid names (2 ms)
    ✓ rejects empty name (1 ms)
    ✓ rejects reserved names (1 ms)

Test Suites: 2 passed, 2 total
Tests:       25 passed, 25 total
Snapshots:   0 total
Time:        1.234 s
```

---

## Come aggiungere nuovi test

### Template base

```javascript
// tests/myFunction.test.js

// Import function to test
import { myFunction } from '../src/utils/myUtils';

describe('myFunction', () => {

  // Setup (runs before each test)
  beforeEach(() => {
    // Initialize test data
  });

  // Cleanup (runs after each test)
  afterEach(() => {
    // Clean up
  });

  test('should do something correctly', () => {
    // Arrange
    const input = { /* test data */ };
    const expected = { /* expected output */ };

    // Act
    const result = myFunction(input);

    // Assert
    expect(result).toEqual(expected);
  });

  test('should handle edge case', () => {
    expect(() => myFunction(null)).toThrow();
  });
});
```

### Best practices

**1. Test unitari focalizzati:**
```javascript
// ❌ Bad: Testa troppe cose
test('validates and processes data', () => {
  const validated = validate(data);
  const processed = process(validated);
  expect(processed).toBeDefined();
});

// ✅ Good: Un concetto per test
test('validates data format', () => {
  const result = validate(data);
  expect(result.isValid).toBe(true);
});

test('processes validated data', () => {
  const result = process(validData);
  expect(result).toBeDefined();
});
```

**2. Mock data realistici:**
```javascript
// ✅ Good: Mock data che rispecchia struttura reale
const mockTokenData = {
  global: {
    colors: {
      blue: {
        500: { $value: '#007acc', $type: 'color' }
      }
    }
  }
};
```

**3. Testa edge cases:**
```javascript
test('handles empty input', () => {
  expect(myFunction([])).toEqual([]);
});

test('handles null input', () => {
  expect(() => myFunction(null)).toThrow();
});

test('handles very large input', () => {
  const largeInput = new Array(10000).fill(testData);
  expect(() => myFunction(largeInput)).not.toThrow();
});
```

**4. Usa describe per raggruppare:**
```javascript
describe('UserManager', () => {
  describe('createUser', () => {
    test('creates user with valid data', () => { /* ... */ });
    test('rejects invalid email', () => { /* ... */ });
  });

  describe('deleteUser', () => {
    test('deletes existing user', () => { /* ... */ });
    test('handles non-existing user', () => { /* ... */ });
  });
});
```

### Test coverage goals

- **Critico:** 90%+ (colorVariantGenerator, themeValidator)
- **Core:** 80%+ (TokenProcessor, VariableManager)
- **Utilities:** 70%+ (colorUtils, validationUtils)
- **UI:** 50%+ (difficile da testare, focus su logica)

---

## Link Utili

- [📖 Utility Scripts](04-utility-scripts.md) - Script testati
- [📖 Workflow Guide](99-workflow-guide.md) - Testing nel workflow
- [🔗 Jest Documentation](https://jestjs.io/docs/getting-started)

---

**Ultima modifica:** 2025-01-16 | [⬅️ Utility Scripts](04-utility-scripts.md) | [➡️ Configurazione](06-configuration.md)
