#!/usr/bin/env node

/**
 * Design Tokens Converter v2: Flat JSON → Luckino Format
 *
 * Organizes tokens into logical collections:
 * - primitives: colors, spacings, borderRadii, fontNames
 * - semantic: mixins, shadows, fonts
 * - components: All UI* and Screen* tokens grouped intelligently
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// COLLECTION STRATEGY
// ============================================================================

/**
 * Determine which collection a token belongs to based on its key path
 */
function getCollectionName(keyPath) {
  const firstSegment = keyPath[0];

  // Primitive collections (kept separate as top-level)
  if (['colors', 'spacings', 'borderRadii', 'fontNames'].includes(firstSegment)) {
    return firstSegment;
  }

  // Semantic tokens
  if (['mixins', 'shadows', 'fonts'].includes(firstSegment)) {
    return 'semantic';
  }

  // Component tokens - group by prefix
  if (firstSegment.startsWith('UI')) {
    // Group UI components by type/category
    if (firstSegment.startsWith('UIButton') ||
        firstSegment.startsWith('UILink') ||
        firstSegment.startsWith('UIIcon') ||
        firstSegment.startsWith('UIFilter') ||
        firstSegment.startsWith('UIToggle')) {
      return 'components-buttons';
    }

    if (firstSegment.startsWith('UIText') ||
        firstSegment.startsWith('UIMarkdown')) {
      return 'components-typography';
    }

    if (firstSegment.startsWith('UICard') ||
        firstSegment.startsWith('UILinkedCard')) {
      return 'components-cards';
    }

    if (firstSegment.startsWith('UIBanner') ||
        firstSegment.startsWith('UINotice') ||
        firstSegment.startsWith('UIInfo') ||
        firstSegment.startsWith('UITag') ||
        firstSegment.startsWith('UIChip')) {
      return 'components-feedback';
    }

    if (firstSegment.startsWith('UIModal') ||
        firstSegment.startsWith('UIBottomSheet') ||
        firstSegment.startsWith('UIDropdown') ||
        firstSegment.startsWith('UICombo')) {
      return 'components-overlays';
    }

    if (firstSegment.startsWith('UIInput') ||
        firstSegment.startsWith('UITextInput') ||
        firstSegment.startsWith('UISelect') ||
        firstSegment.startsWith('UICheckbox') ||
        firstSegment.startsWith('UIRadio') ||
        firstSegment.startsWith('UISwitch')) {
      return 'components-forms';
    }

    if (firstSegment.startsWith('UIHeader') ||
        firstSegment.startsWith('UIFooter') ||
        firstSegment.startsWith('UITab') ||
        firstSegment.startsWith('UINav')) {
      return 'components-navigation';
    }

    // Default UI components
    return 'components-ui';
  }

  // Screen tokens
  if (firstSegment.startsWith('Screen')) {
    return 'components-screens';
  }

  // Other component-like tokens
  if (firstSegment.includes('Card') ||
      firstSegment.includes('Button') ||
      firstSegment.includes('Item') ||
      firstSegment.includes('Section')) {
    return 'components-misc';
  }

  // Default fallback
  return 'other';
}

// ============================================================================
// UTILITIES
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

function inferType(keyPath, value) {
  const firstSegment = keyPath[0];
  const keyStr = keyPath.join('.');

  if (firstSegment === 'colors' || keyStr.toLowerCase().includes('color')) {
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

function addDimensionUnit(value) {
  if (typeof value === 'number') {
    return `${value}px`;
  }
  return value;
}

function isTokenReference(value, allTokenKeys) {
  if (typeof value !== 'string') return false;
  if (isColor(value)) return false;
  if (/^\d+$/.test(value)) return false;

  const matchingKeys = allTokenKeys.filter(key => {
    const parts = key.split('.');
    const lastName = parts[parts.length - 1];
    return lastName === value || key.endsWith('.' + value);
  });

  return matchingKeys.length > 0 ? matchingKeys[0] : null;
}

function toLuckinoReference(tokenPath) {
  return `{${tokenPath}}`;
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

// ============================================================================
// SHADOW AGGREGATION
// ============================================================================

function shadowToCSS(shadowProps) {
  const offsetX = shadowProps.offsetX || shadowProps['shadowOffset.width'] || 0;
  const offsetY = shadowProps.offsetY || shadowProps['shadowOffset.height'] || 0;
  const blur = shadowProps.blur || shadowProps.shadowRadius || 0;
  const spread = shadowProps.spread || 0;
  const color = shadowProps.color || shadowProps.shadowColor || '#000000';

  return `${offsetX}px ${offsetY}px ${blur}px ${spread}px ${color}`;
}

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
// MAIN CONVERSION
// ============================================================================

function convertToLuckino(baseTokens, mooneygoTokens) {
  const allBaseKeys = Object.keys(baseTokens);
  const allMooneygoKeys = Object.keys(mooneygoTokens);

  // Initialize collection buckets
  const collections = {
    colors: {},
    spacings: {},
    borderRadii: {},
    fontNames: {},
    semantic: {},
    'components-buttons': {},
    'components-typography': {},
    'components-cards': {},
    'components-feedback': {},
    'components-overlays': {},
    'components-forms': {},
    'components-navigation': {},
    'components-ui': {},
    'components-screens': {},
    'components-misc': {},
    other: {}
  };

  // Aggregate shadows
  const { shadowGroups: baseShadows, shadowKeys: baseShadowKeys } = aggregateShadows(baseTokens);
  const { shadowGroups: mooneygoShadows, shadowKeys: mooneygoShadowKeys } = aggregateShadows(mooneygoTokens);

  // Convert shadows to CSS and add to semantic collection
  const allShadowNames = new Set([...Object.keys(baseShadows), ...Object.keys(mooneygoShadows)]);

  allShadowNames.forEach(shadowName => {
    const baseCSS = baseShadows[shadowName] ? shadowToCSS(baseShadows[shadowName]) : null;
    const mooneygoCSS = mooneygoShadows[shadowName] ? shadowToCSS(mooneygoShadows[shadowName]) : null;

    const shadowPath = ['shadows', shadowName];

    if (baseCSS === mooneygoCSS && baseCSS) {
      setNestedValue(collections.semantic, shadowPath, {
        $type: 'string',
        $value: baseCSS
      });
    } else if (baseCSS && mooneygoCSS) {
      setNestedValue(collections.semantic, shadowPath, {
        $type: 'string',
        $value: {
          'base': baseCSS,
          'mooneygo': mooneygoCSS
        }
      });
    } else if (mooneygoCSS) {
      setNestedValue(collections.semantic, shadowPath, {
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

    // Determine target collection
    const collectionName = getCollectionName(keyPath);
    const targetCollection = collections[collectionName];

    // Build path within collection
    // For primitives (colors, spacings, etc.), remove first segment
    // For others, keep full path
    let finalPath;
    if (['colors', 'spacings', 'borderRadii', 'fontNames'].includes(collectionName)) {
      finalPath = keyPath.slice(1); // Remove "colors", "spacings", etc.
    } else if (collectionName === 'semantic') {
      // For semantic, keep structure as-is (mixins.*, fonts.*, shadows.*)
      finalPath = keyPath;
    } else {
      // For components, keep full path to maintain structure
      finalPath = keyPath;
    }

    if (finalPath.length === 0) return; // Skip empty paths

    // Infer type
    const value = mooneygoValue || baseValue;
    const type = inferType(keyPath, value);

    // Check for references
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
      setNestedValue(targetCollection, finalPath, {
        $type: type,
        $value: {
          'base': finalBaseValue,
          'mooneygo': finalMooneygoValue
        }
      });
    } else if (mooneygoValue !== undefined) {
      // Only mooneygo or same value
      setNestedValue(targetCollection, finalPath, {
        $type: type,
        $value: finalMooneygoValue
      });
    } else if (baseValue !== undefined) {
      // Only base
      setNestedValue(targetCollection, finalPath, {
        $type: type,
        $value: finalBaseValue
      });
    }
  });

  // Remove empty collections
  Object.keys(collections).forEach(key => {
    if (Object.keys(collections[key]).length === 0) {
      delete collections[key];
    }
  });

  return collections;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: node convert-to-luckino-v2.js <base-theme.json> <mooneygo-theme.json>');
    process.exit(1);
  }

  const baseFilePath = args[0];
  const mooneygoFilePath = args[1];

  console.log('🎨 Design Tokens Converter v2: Flat → Luckino Collections');
  console.log('='.repeat(70));

  // Read input
  console.log(`\n📖 Reading: ${baseFilePath}`);
  const baseTokens = JSON.parse(fs.readFileSync(baseFilePath, 'utf8'));

  console.log(`📖 Reading: ${mooneygoFilePath}`);
  const mooneygoTokens = JSON.parse(fs.readFileSync(mooneygoFilePath, 'utf8'));

  console.log(`\n✅ Loaded ${Object.keys(baseTokens).length} base tokens`);
  console.log(`✅ Loaded ${Object.keys(mooneygoTokens).length} mooneygo tokens`);

  // Convert
  console.log('\n🔧 Converting and organizing into collections...');
  const collections = convertToLuckino(baseTokens, mooneygoTokens);

  // Write each collection as a separate file
  const outputDir = path.dirname(baseFilePath);
  const collectionNames = Object.keys(collections);

  console.log(`\n📦 Generated ${collectionNames.length} collections:`);

  collectionNames.forEach(collectionName => {
    const filename = `mooney-${collectionName}.json`;
    const filepath = path.join(outputDir, filename);
    const content = collections[collectionName];

    fs.writeFileSync(filepath, JSON.stringify(content, null, 2), 'utf8');

    const tokenCount = JSON.stringify(content).split('$type').length - 1;
    console.log(`   ✅ ${collectionName.padEnd(30)} → ${filename.padEnd(40)} (${tokenCount} tokens)`);
  });

  console.log('\n🎉 Conversion complete!');
  console.log('\n💡 Import order:');
  console.log('   1. Primitives: colors, spacings, borderRadii, fontNames');
  console.log('   2. Semantic: semantic');
  console.log('   3. Components: components-*');
}

if (require.main === module) {
  main();
}

module.exports = { convertToLuckino };
