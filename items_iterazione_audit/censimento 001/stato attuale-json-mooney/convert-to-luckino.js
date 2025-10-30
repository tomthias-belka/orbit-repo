#!/usr/bin/env node

/**
 * Design Tokens Converter: Flat JSON → Luckino Format
 *
 * Converts flat design tokens to Luckino-compatible format:
 * - Primitive tokens in tokens.json
 * - Multi-mode semantic/component tokens in variables.tokens.json
 * - NO composite types (typography/shadow atomized)
 * - Multi-theme support via $value objects
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// LUCKINO SUPPORTED TYPES
// ============================================================================

const LUCKINO_TYPES = {
  'color': 'color',
  'dimension': 'dimension',
  'string': 'string',
  'boolean': 'boolean',
  'number': 'number'
  // NOTE: typography, shadow, gradient NOT supported as composite
};

// Categories that should be in primitives file
const PRIMITIVE_CATEGORIES = ['colors', 'spacings', 'borderRadii', 'fontNames'];

// Categories that should be atomized (not composite)
const ATOMIZE_CATEGORIES = ['shadows', 'UIText'];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function parseKey(key) {
  return key.split('.');
}

function isColor(value) {
  if (typeof value !== 'string') return false;
  return /^#[0-9A-Fa-f]{3,8}$/.test(value) ||
         /^rgba?\(/.test(value) ||
         value === 'transparent';
}

function isPrimitive(keyPath) {
  return PRIMITIVE_CATEGORIES.includes(keyPath[0]);
}

function shouldAtomize(keyPath) {
  return ATOMIZE_CATEGORIES.some(cat => keyPath[0] === cat || keyPath[0].startsWith(cat));
}

function inferType(keyPath, value) {
  const firstSegment = keyPath[0];

  if (firstSegment === 'colors' || keyPath.join('.').toLowerCase().includes('color')) {
    return 'color';
  }
  if (firstSegment === 'spacings' || firstSegment === 'borderRadii') {
    return 'dimension';
  }
  if (typeof value === 'boolean') {
    return 'boolean';
  }
  if (typeof value === 'number') {
    return 'number';
  }
  return 'string';
}

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

function addDimensionUnit(value) {
  if (typeof value === 'number') {
    return `${value}px`;
  }
  return value;
}

/**
 * Convert shadow properties to CSS string
 */
function shadowToCSS(shadowProps) {
  const offsetX = shadowProps.offsetX || shadowProps['shadowOffset.width'] || 0;
  const offsetY = shadowProps.offsetY || shadowProps['shadowOffset.height'] || 0;
  const blur = shadowProps.blur || shadowProps.shadowRadius || 0;
  const spread = shadowProps.spread || 0;
  const color = shadowProps.color || shadowProps.shadowColor || '#000000';

  return `${offsetX}px ${offsetY}px ${blur}px ${spread}px ${color}`;
}

/**
 * Check if value is a reference to another token
 */
function isTokenReference(value, allTokenKeys) {
  if (typeof value !== 'string') return false;
  if (isColor(value)) return false;
  if (/^\d+$/.test(value)) return false; // pure number string

  // Check if matches a token name
  const matchingKeys = allTokenKeys.filter(key => {
    const parts = key.split('.');
    const lastName = parts[parts.length - 1];
    return lastName === value || key.endsWith('.' + value);
  });

  return matchingKeys.length > 0 ? matchingKeys[0] : null;
}

function toLuckinoReference(tokenPath) {
  // Luckino uses dot notation for references
  return `{${tokenPath}}`;
}

// ============================================================================
// SHADOW AGGREGATION
// ============================================================================

function aggregateShadows(flatTokens) {
  const shadowGroups = {};
  const shadowKeys = new Set();

  Object.keys(flatTokens).forEach(key => {
    const match = key.match(/^shadows\.([^.]+)\.(.+)$/);
    if (match) {
      const shadowName = match[1];
      const property = match[2];

      if (!shadowGroups[shadowName]) {
        shadowGroups[shadowName] = {};
      }

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

      shadowKeys.add(key);
    }
  });

  return { shadowGroups, shadowKeys };
}

// ============================================================================
// MAIN CONVERSION LOGIC
// ============================================================================

/**
 * Convert flat tokens to Luckino format
 */
function convertToLuckino(baseTokens, mooneygoTokens) {
  const allBaseKeys = Object.keys(baseTokens);
  const allMooneygoKeys = Object.keys(mooneygoTokens);

  const primitives = {};
  const variables = {};

  // Aggregate shadows first
  const { shadowGroups: baseShadows, shadowKeys: baseShadowKeys } = aggregateShadows(baseTokens);
  const { shadowGroups: mooneygoShadows, shadowKeys: mooneygoShadowKeys } = aggregateShadows(mooneygoTokens);

  // Convert shadows to CSS strings
  const allShadowNames = new Set([...Object.keys(baseShadows), ...Object.keys(mooneygoShadows)]);

  allShadowNames.forEach(shadowName => {
    const baseCSS = baseShadows[shadowName] ? shadowToCSS(baseShadows[shadowName]) : null;
    const mooneygoCSS = mooneygoShadows[shadowName] ? shadowToCSS(mooneygoShadows[shadowName]) : null;

    const shadowPath = ['shadows', shadowName];

    if (baseCSS === mooneygoCSS && baseCSS) {
      // Same value, use single value
      setNestedValue(variables, shadowPath, {
        $type: 'string',
        $value: baseCSS
      });
    } else if (baseCSS && mooneygoCSS) {
      // Different values, use multi-mode
      setNestedValue(variables, shadowPath, {
        $type: 'string',
        $value: {
          'base': baseCSS,
          'mooneygo': mooneygoCSS
        }
      });
    } else if (mooneygoCSS) {
      // Only mooneygo
      setNestedValue(variables, shadowPath, {
        $type: 'string',
        $value: mooneygoCSS
      });
    }
  });

  // Process all other tokens
  const allKeys = new Set([...allBaseKeys, ...allMooneygoKeys]);

  allKeys.forEach(key => {
    // Skip already processed shadow properties
    if (baseShadowKeys.has(key) || mooneygoShadowKeys.has(key)) {
      return;
    }

    const keyPath = parseKey(key);
    const baseValue = baseTokens[key];
    const mooneygoValue = mooneygoTokens[key];

    // Skip composite token properties (UIText.roles.h1.* will be atomized)
    if (keyPath.length > 3 && keyPath[0] === 'UIText' && keyPath[1] === 'roles') {
      // These are individual typography properties - keep them atomic
    }

    // Determine target (primitives or variables)
    const target = isPrimitive(keyPath) ? primitives : variables;

    // Infer type
    const value = mooneygoValue || baseValue;
    const type = inferType(keyPath, value);

    // Check for token references
    const baseRef = baseValue ? isTokenReference(baseValue, allMooneygoKeys) : null;
    const mooneygoRef = mooneygoValue ? isTokenReference(mooneygoValue, allMooneygoKeys) : null;

    const finalBaseValue = baseRef ? toLuckinoReference(baseRef) :
                          (type === 'dimension' ? addDimensionUnit(baseValue) : baseValue);
    const finalMooneygoValue = mooneygoRef ? toLuckinoReference(mooneygoRef) :
                               (type === 'dimension' ? addDimensionUnit(mooneygoValue) : mooneygoValue);

    // Create token
    if (baseValue !== undefined && mooneygoValue !== undefined &&
        JSON.stringify(finalBaseValue) !== JSON.stringify(finalMooneygoValue)) {
      // Different values - multi-mode
      setNestedValue(target, keyPath, {
        $type: type,
        $value: {
          'base': finalBaseValue,
          'mooneygo': finalMooneygoValue
        }
      });
    } else if (mooneygoValue !== undefined) {
      // Only mooneygo or same value
      setNestedValue(target, keyPath, {
        $type: type,
        $value: finalMooneygoValue
      });
    } else if (baseValue !== undefined) {
      // Only base
      setNestedValue(target, keyPath, {
        $type: type,
        $value: finalBaseValue
      });
    }
  });

  return { primitives, variables };
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: node convert-to-luckino.js <base-theme.json> <mooneygo-theme.json>');
    process.exit(1);
  }

  const baseFilePath = args[0];
  const mooneygoFilePath = args[1];

  console.log('🎨 Design Tokens Converter: Flat → Luckino Format');
  console.log('='.repeat(60));

  // Read input files
  console.log(`\n📖 Reading: ${baseFilePath}`);
  const baseTokens = JSON.parse(fs.readFileSync(baseFilePath, 'utf8'));

  console.log(`📖 Reading: ${mooneygoFilePath}`);
  const mooneygoTokens = JSON.parse(fs.readFileSync(mooneygoFilePath, 'utf8'));

  console.log(`\n✅ Loaded ${Object.keys(baseTokens).length} base tokens`);
  console.log(`✅ Loaded ${Object.keys(mooneygoTokens).length} mooneygo tokens`);

  // Convert
  console.log('\n🔧 Converting to Luckino format...');
  const { primitives, variables } = convertToLuckino(baseTokens, mooneygoTokens);

  // Write outputs
  const outputDir = path.dirname(baseFilePath);
  const primitivesPath = path.join(outputDir, 'mooney-tokens.json');
  const variablesPath = path.join(outputDir, 'mooney-variables.tokens.json');

  fs.writeFileSync(primitivesPath, JSON.stringify(primitives, null, 2), 'utf8');
  fs.writeFileSync(variablesPath, JSON.stringify(variables, null, 2), 'utf8');

  console.log(`✅ Created: ${primitivesPath}`);
  console.log(`✅ Created: ${variablesPath}`);

  console.log('\n🎉 Conversion complete!');
  console.log('\n📊 Summary:');
  console.log(`   Primitive tokens: ${JSON.stringify(primitives).length} bytes`);
  console.log(`   Variable tokens: ${JSON.stringify(variables).length} bytes`);
  console.log(`   Output files: 2`);

  console.log('\n💡 Next steps:');
  console.log('   1. Import mooney-tokens.json in Luckino');
  console.log('   2. Import mooney-variables.tokens.json in Luckino');
  console.log('   3. Switch between "base" and "mooneygo" modes in Figma');
}

if (require.main === module) {
  main();
}

module.exports = { convertToLuckino };
