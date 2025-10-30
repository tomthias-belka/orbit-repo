#!/usr/bin/env node

/**
 * Design Tokens Converter: Flat JSON → W3C DTCG Format
 *
 * Converts flat design tokens (dot notation) to W3C Design Tokens Community Group format
 * Supports:
 * - Primitive tokens (colors, spacings, borderRadii, fonts)
 * - Composite tokens (shadows, typography)
 * - Reference resolution (aliases)
 * - Multi-theme output
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// TYPE INFERENCE RULES
// ============================================================================

const TYPE_RULES = {
  'colors': 'color',
  'spacings': 'dimension',
  'borderRadii': 'dimension',
  'fonts': 'fontFamily',
  'fontNames': 'fontFamily',
  'shadows': 'shadow',
  'fontWeights': 'fontWeight'
};

// Properties that should have dimension units
const DIMENSION_PROPERTIES = ['size', 'lineHeight', 'letterSpacing', 'width', 'height', 'shadowRadius', 'borderWidth', 'padding', 'margin'];

// ============================================================================
// COMPOSITE TOKEN DETECTION
// ============================================================================

const COMPOSITE_PATTERNS = {
  // Shadow tokens: shadows.{name}.{property}
  shadow: /^shadows\.([^.]+)\.(.+)$/,

  // Typography tokens: UIText.roles.{name}.{property}
  typography: /^UIText\.roles\.([^.]+)\.(.+)$/
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Parse dot notation key into path array
 */
function parseKey(key) {
  return key.split('.');
}

/**
 * Check if value is a color
 */
function isColor(value) {
  if (typeof value !== 'string') return false;
  return /^#[0-9A-Fa-f]{3,8}$/.test(value) ||
         /^rgba?\(/.test(value) ||
         value === 'transparent';
}

/**
 * Check if value is a reference to another token
 */
function isReference(value, allTokenKeys) {
  if (typeof value !== 'string') return false;
  if (isColor(value)) return false;

  // Check if it matches a token name (without the prefix)
  const potentialRefs = allTokenKeys.filter(key => {
    const parts = key.split('.');
    const lastPart = parts[parts.length - 1];
    return lastPart === value || key.endsWith('.' + value);
  });

  return potentialRefs.length > 0 ? potentialRefs[0] : null;
}

/**
 * Convert token reference to W3C format
 */
function toReference(tokenPath) {
  return `{${tokenPath}}`;
}

/**
 * Add unit to dimension values
 */
function addDimensionUnit(value, property) {
  if (typeof value === 'number') {
    // Check if property needs units
    if (DIMENSION_PROPERTIES.some(prop => property.toLowerCase().includes(prop))) {
      return `${value}px`;
    }
  }
  return value;
}

/**
 * Infer $type from key path
 */
function inferType(keyPath) {
  const firstSegment = keyPath[0];
  return TYPE_RULES[firstSegment] || undefined;
}

/**
 * Set nested value in object
 */
function setNestedValue(obj, path, value) {
  let current = obj;
  for (let i = 0; i < path.length - 1; i++) {
    if (!current[path[i]]) {
      current[path[i]] = {};
    }
    current = current[path[i]];
  }
  current[path[path.length - 1]] = value;
}

/**
 * Get nested value from object
 */
function getNestedValue(obj, path) {
  let current = obj;
  for (const segment of path) {
    if (!current || !current[segment]) return undefined;
    current = current[segment];
  }
  return current;
}

// ============================================================================
// COMPOSITE TOKEN HANDLERS
// ============================================================================

/**
 * Aggregate shadow properties into single token
 */
function aggregateShadows(flatTokens) {
  const shadowGroups = {};
  const processedKeys = new Set();

  Object.keys(flatTokens).forEach(key => {
    const match = key.match(COMPOSITE_PATTERNS.shadow);
    if (match) {
      const shadowName = match[1];
      const property = match[2];

      if (!shadowGroups[shadowName]) {
        shadowGroups[shadowName] = {};
      }

      // Map React Native shadow properties to W3C format
      if (property === 'shadowColor') {
        shadowGroups[shadowName].color = flatTokens[key];
      } else if (property === 'shadowOffset.width') {
        shadowGroups[shadowName].offsetX = flatTokens[key];
      } else if (property === 'shadowOffset.height') {
        shadowGroups[shadowName].offsetY = flatTokens[key];
      } else if (property === 'shadowRadius') {
        shadowGroups[shadowName].blur = flatTokens[key];
      } else if (property === 'shadowOpacity') {
        shadowGroups[shadowName].opacity = flatTokens[key];
      }
      // Note: elevation is Android-specific, not part of W3C spec

      processedKeys.add(key);
    }
  });

  return { shadowGroups, processedKeys };
}

/**
 * Aggregate typography properties into single token
 */
function aggregateTypography(flatTokens) {
  const typographyGroups = {};
  const processedKeys = new Set();

  Object.keys(flatTokens).forEach(key => {
    const match = key.match(COMPOSITE_PATTERNS.typography);
    if (match) {
      const roleName = match[1];
      const property = match[2];

      if (!typographyGroups[roleName]) {
        typographyGroups[roleName] = {};
      }

      // Map to W3C typography format
      if (property === 'fontFamily') {
        typographyGroups[roleName].fontFamily = flatTokens[key];
      } else if (property === 'size') {
        typographyGroups[roleName].fontSize = flatTokens[key];
      } else if (property === 'lineHeight') {
        typographyGroups[roleName].lineHeight = flatTokens[key];
      } else if (property === 'letterSpacing') {
        typographyGroups[roleName].letterSpacing = flatTokens[key];
      } else if (property === 'fontWeight' || property === 'weight') {
        typographyGroups[roleName].fontWeight = flatTokens[key];
      }

      processedKeys.add(key);
    }
  });

  return { typographyGroups, processedKeys };
}

// ============================================================================
// MAIN CONVERSION LOGIC
// ============================================================================

/**
 * Convert flat tokens to W3C DTCG format
 */
function convertToW3C(flatTokens, allTokenKeys) {
  const w3cTokens = {};

  // First, aggregate composite tokens
  const { shadowGroups, processedKeys: shadowKeys } = aggregateShadows(flatTokens);
  const { typographyGroups, processedKeys: typographyKeys } = aggregateTypography(flatTokens);

  const allProcessedKeys = new Set([...shadowKeys, ...typographyKeys]);

  // Process shadow tokens
  Object.keys(shadowGroups).forEach(shadowName => {
    const shadow = shadowGroups[shadowName];
    setNestedValue(w3cTokens, ['shadows', shadowName], {
      $type: 'shadow',
      $value: {
        color: shadow.color || '#000000',
        offsetX: addDimensionUnit(shadow.offsetX || 0, 'offsetX'),
        offsetY: addDimensionUnit(shadow.offsetY || 0, 'offsetY'),
        blur: addDimensionUnit(shadow.blur || 0, 'blur'),
        spread: addDimensionUnit(0, 'spread') // Default spread
      }
    });
  });

  // Process typography tokens
  Object.keys(typographyGroups).forEach(roleName => {
    const typo = typographyGroups[roleName];
    const fontFamily = typo.fontFamily;

    setNestedValue(w3cTokens, ['UIText', 'roles', roleName], {
      $type: 'typography',
      $value: {
        fontFamily: Array.isArray(fontFamily) ? fontFamily : [fontFamily],
        fontSize: addDimensionUnit(typo.fontSize, 'fontSize'),
        lineHeight: addDimensionUnit(typo.lineHeight, 'lineHeight'),
        letterSpacing: addDimensionUnit(typo.letterSpacing || 0, 'letterSpacing'),
        ...(typo.fontWeight && { fontWeight: typo.fontWeight })
      }
    });
  });

  // Process remaining simple tokens
  Object.keys(flatTokens).forEach(key => {
    if (allProcessedKeys.has(key)) return; // Skip already processed composite tokens

    const keyPath = parseKey(key);
    const value = flatTokens[key];
    const type = inferType(keyPath);

    // Check if value is a reference
    const refPath = isReference(value, allTokenKeys);
    const finalValue = refPath ? toReference(refPath) : value;

    // Create token object
    const token = {
      $value: addDimensionUnit(finalValue, key),
      ...(type && { $type: type })
    };

    setNestedValue(w3cTokens, keyPath, token);
  });

  return w3cTokens;
}

/**
 * Generate Option A: Separate W3C files
 */
function generateOptionA(baseTokens, mooneygoTokens) {
  const baseKeys = Object.keys(baseTokens);
  const mooneygoKeys = Object.keys(mooneygoTokens);

  const baseW3C = convertToW3C(baseTokens, baseKeys);
  const mooneygoW3C = convertToW3C(mooneygoTokens, mooneygoKeys);

  return { baseW3C, mooneygoW3C };
}

/**
 * Generate Option B: Unified multi-theme file
 */
function generateOptionB(baseTokens, mooneygoTokens) {
  const baseKeys = Object.keys(baseTokens);
  const mooneygoKeys = Object.keys(mooneygoTokens);

  const unified = {
    $themes: [
      {
        id: 'base',
        name: 'Base Theme (White Label)',
        group: 'themes'
      },
      {
        id: 'mooneygo',
        name: 'MooneyGo Brand Theme',
        group: 'themes',
        selectedTokenSets: {
          base: 'source',
          mooneygo: 'enabled'
        }
      }
    ]
  };

  // Convert base theme
  const baseW3C = convertToW3C(baseTokens, baseKeys);
  unified.base = baseW3C;

  // For mooneygo, only include overrides
  const mooneygoOverrides = {};
  Object.keys(mooneygoTokens).forEach(key => {
    if (baseTokens[key] !== mooneygoTokens[key]) {
      mooneygoOverrides[key] = mooneygoTokens[key];
    }
  });

  const mooneygoW3C = convertToW3C(mooneygoOverrides, mooneygoKeys);
  unified.mooneygo = mooneygoW3C;

  return unified;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: node convert-to-w3c.js <base-theme.json> <mooneygo-theme.json>');
    process.exit(1);
  }

  const baseFilePath = args[0];
  const mooneygoFilePath = args[1];

  console.log('🎨 Design Tokens Converter: Flat → W3C DTCG');
  console.log('='.repeat(50));

  // Read input files
  console.log(`\n📖 Reading: ${baseFilePath}`);
  const baseTokens = JSON.parse(fs.readFileSync(baseFilePath, 'utf8'));

  console.log(`📖 Reading: ${mooneygoFilePath}`);
  const mooneygoTokens = JSON.parse(fs.readFileSync(mooneygoFilePath, 'utf8'));

  console.log(`\n✅ Loaded ${Object.keys(baseTokens).length} base tokens`);
  console.log(`✅ Loaded ${Object.keys(mooneygoTokens).length} mooneygo tokens`);

  // Generate Option A: Separate files
  console.log('\n🔧 Generating Option A: Separate W3C files...');
  const { baseW3C, mooneygoW3C } = generateOptionA(baseTokens, mooneygoTokens);

  const baseOutputPath = path.join(path.dirname(baseFilePath), 'theme-base-w3c.json');
  const mooneygoOutputPath = path.join(path.dirname(mooneygoFilePath), 'theme-mooneygo-w3c.json');

  fs.writeFileSync(baseOutputPath, JSON.stringify(baseW3C, null, 2), 'utf8');
  fs.writeFileSync(mooneygoOutputPath, JSON.stringify(mooneygoW3C, null, 2), 'utf8');

  console.log(`✅ Created: ${baseOutputPath}`);
  console.log(`✅ Created: ${mooneygoOutputPath}`);

  // Generate Option B: Unified file
  console.log('\n🔧 Generating Option B: Unified multi-theme file...');
  const unified = generateOptionB(baseTokens, mooneygoTokens);

  const unifiedOutputPath = path.join(path.dirname(baseFilePath), 'themes-unified-w3c.json');
  fs.writeFileSync(unifiedOutputPath, JSON.stringify(unified, null, 2), 'utf8');

  console.log(`✅ Created: ${unifiedOutputPath}`);

  console.log('\n🎉 Conversion complete!');
  console.log('\n📊 Summary:');
  console.log(`   Base tokens: ${Object.keys(baseTokens).length}`);
  console.log(`   MooneyGo tokens: ${Object.keys(mooneygoTokens).length}`);
  console.log(`   Output files: 3`);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { convertToW3C, generateOptionA, generateOptionB };
