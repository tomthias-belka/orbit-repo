#!/usr/bin/env node

/**
 * Design Tokens Converter: Flat JSON → Luckino Format (Marker-Based)
 *
 * Uses comment markers in the source JSON to identify collection boundaries:
 * - //____primitive → core collection
 * - //____Semantics Collection → semantic collection
 * - // Component Collection → component collection
 *
 * Outputs a single JSON file with 3 top-level collections for Luckino import.
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// COLLECTION MARKER DETECTION
// ============================================================================

const MARKERS = {
  CORE_START: '//____primitive',
  CORE_END: '//____end primitive',
  SEMANTIC_START: '//____Semantics Collection',
  SEMANTIC_END: '//____end Collection Semantic',
  COMPONENT_START: '// Component Collection',
  COMPONENT_END: '//____end collection component'
};

/**
 * Parse flat JSON and identify collection boundaries based on markers
 */
function parseWithMarkers(fileContent) {
  const lines = fileContent.split('\n');
  const collections = {
    core: [],
    semantic: [],
    component: []
  };

  let currentCollection = null;
  let jsonBuffer = '';
  let inObject = false;
  let braceDepth = 0;

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Detect collection markers
    if (trimmed === MARKERS.CORE_START) {
      currentCollection = 'core';
      return;
    }
    if (trimmed === MARKERS.CORE_END) {
      currentCollection = null;
      return;
    }
    if (trimmed === MARKERS.SEMANTIC_START) {
      currentCollection = 'semantic';
      return;
    }
    if (trimmed === MARKERS.SEMANTIC_END) {
      currentCollection = null;
      return;
    }
    if (trimmed === MARKERS.COMPONENT_START) {
      currentCollection = 'component';
      return;
    }
    if (trimmed === MARKERS.COMPONENT_END) {
      currentCollection = null;
      return;
    }

    // Skip comments and empty lines
    if (trimmed.startsWith('//') || trimmed === '' || trimmed === '{' || trimmed === '}') {
      return;
    }

    // Parse token lines
    if (currentCollection && trimmed) {
      // Remove trailing comma if present
      const cleanLine = trimmed.replace(/,\s*$/, '');

      // Parse key-value pair
      const match = cleanLine.match(/^"([^"]+)":\s*(.+)$/);
      if (match) {
        const key = match[1];
        let value = match[2].trim();

        // Remove quotes from string values
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        }

        // Try to parse as JSON (for numbers, booleans, objects)
        try {
          value = JSON.parse(match[2]);
        } catch (e) {
          // Keep as string if parsing fails
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
          }
        }

        collections[currentCollection].push({ key, value });
      }
    }
  });

  return collections;
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
  const keyStr = keyPath.join('.');

  if (keyPath[0] === 'colors' || keyStr.toLowerCase().includes('color')) {
    return 'color';
  }
  if (keyPath[0] === 'spacings' || keyPath[0] === 'borderRadii') {
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
  if (value.startsWith('{')) return false; // Already a reference

  // Check if matches a token name
  const matchingKeys = allTokenKeys.filter(key => {
    const parts = key.split('.');
    const lastName = parts[parts.length - 1];
    return lastName === value || key.endsWith('.' + value);
  });

  return matchingKeys.length > 0 ? matchingKeys[0] : null;
}

function toLuckinoReference(tokenPath) {
  // Luckino uses {path} WITHOUT collection name
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

function aggregateShadows(tokens) {
  const shadowGroups = {};
  const shadowKeys = new Set();

  tokens.forEach(({ key, value }) => {
    const match = key.match(/^shadows\.([^.]+)\.(.+)$/);
    if (match) {
      const shadowName = match[1];
      const property = match[2];

      if (!shadowGroups[shadowName]) {
        shadowGroups[shadowName] = {};
      }

      if (property === 'shadowColor') {
        shadowGroups[shadowName].color = value;
      } else if (property === 'shadowOffset.width') {
        shadowGroups[shadowName].offsetX = value;
      } else if (property === 'shadowOffset.height') {
        shadowGroups[shadowName].offsetY = value;
      } else if (property === 'shadowRadius') {
        shadowGroups[shadowName].blur = value;
      } else if (property === 'shadowOpacity') {
        shadowGroups[shadowName].opacity = value;
      }

      shadowKeys.add(key);
    }
  });

  return { shadowGroups, shadowKeys };
}

// ============================================================================
// MAIN CONVERSION
// ============================================================================

function convertCollection(baseTokens, mooneygoTokens, allKeys) {
  const result = {};

  // Aggregate shadows from both themes
  const { shadowGroups: baseShadows, shadowKeys: baseShadowKeys } = aggregateShadows(baseTokens);
  const { shadowGroups: mooneygoShadows, shadowKeys: mooneygoShadowKeys } = aggregateShadows(mooneygoTokens);

  // Convert shadows to CSS
  const allShadowNames = new Set([...Object.keys(baseShadows), ...Object.keys(mooneygoShadows)]);

  allShadowNames.forEach(shadowName => {
    const baseCSS = baseShadows[shadowName] ? shadowToCSS(baseShadows[shadowName]) : null;
    const mooneygoCSS = mooneygoShadows[shadowName] ? shadowToCSS(mooneygoShadows[shadowName]) : null;

    const shadowPath = ['shadows', shadowName];

    if (baseCSS === mooneygoCSS && baseCSS) {
      setNestedValue(result, shadowPath, {
        $type: 'string',
        $value: baseCSS
      });
    } else if (baseCSS && mooneygoCSS) {
      setNestedValue(result, shadowPath, {
        $type: 'string',
        $value: {
          'base': baseCSS,
          'mooneygo': mooneygoCSS
        }
      });
    } else if (mooneygoCSS) {
      setNestedValue(result, shadowPath, {
        $type: 'string',
        $value: mooneygoCSS
      });
    }
  });

  // Create lookup maps
  const baseMap = new Map(baseTokens.map(t => [t.key, t.value]));
  const mooneygoMap = new Map(mooneygoTokens.map(t => [t.key, t.value]));

  // Process all unique keys
  const uniqueKeys = new Set([...baseMap.keys(), ...mooneygoMap.keys()]);

  uniqueKeys.forEach(key => {
    // Skip already processed shadow properties
    if (baseShadowKeys.has(key) || mooneygoShadowKeys.has(key)) {
      return;
    }

    const keyPath = parseKey(key);
    const baseValue = baseMap.get(key);
    const mooneygoValue = mooneygoMap.get(key);

    // Infer type
    const value = mooneygoValue !== undefined ? mooneygoValue : baseValue;
    const type = inferType(keyPath, value);

    // Check for references
    const baseRef = baseValue !== undefined ? isTokenReference(baseValue, allKeys) : null;
    const mooneygoRef = mooneygoValue !== undefined ? isTokenReference(mooneygoValue, allKeys) : null;

    const finalBaseValue = baseRef ? toLuckinoReference(baseRef) :
                          (type === 'dimension' ? addDimensionUnit(baseValue) : baseValue);
    const finalMooneygoValue = mooneygoRef ? toLuckinoReference(mooneygoRef) :
                               (type === 'dimension' ? addDimensionUnit(mooneygoValue) : mooneygoValue);

    // Create token
    if (baseValue !== undefined && mooneygoValue !== undefined &&
        JSON.stringify(finalBaseValue) !== JSON.stringify(finalMooneygoValue)) {
      // Different values - multi-mode
      setNestedValue(result, keyPath, {
        $type: type,
        $value: {
          'base': finalBaseValue,
          'mooneygo': finalMooneygoValue
        }
      });
    } else if (mooneygoValue !== undefined) {
      // Only mooneygo or same value
      setNestedValue(result, keyPath, {
        $type: type,
        $value: finalMooneygoValue
      });
    } else if (baseValue !== undefined) {
      // Only base
      setNestedValue(result, keyPath, {
        $type: type,
        $value: finalBaseValue
      });
    }
  });

  return result;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: node convert-luckino-markers.js <base-theme.json> <mooneygo-theme.json>');
    process.exit(1);
  }

  const baseFilePath = args[0];
  const mooneygoFilePath = args[1];

  console.log('🎨 Luckino Converter: Marker-Based Collections');
  console.log('='.repeat(60));

  // Read input files as text (to preserve comments)
  console.log(`\n📖 Reading with markers: ${baseFilePath}`);
  const baseContent = fs.readFileSync(baseFilePath, 'utf8');

  console.log(`📖 Reading with markers: ${mooneygoFilePath}`);
  const mooneygoContent = fs.readFileSync(mooneygoFilePath, 'utf8');

  // Parse with markers
  console.log('\n🔍 Parsing collection markers...');
  const baseCollections = parseWithMarkers(baseContent);

  // If mooneygo doesn't have markers, parse it as regular JSON and use base markers as reference
  let mooneygoCollections;
  if (mooneygoContent.includes('//____primitive')) {
    mooneygoCollections = parseWithMarkers(mooneygoContent);
  } else {
    console.log('   ⚠️  mooneygo.json has no markers, parsing as regular JSON...');
    const mooneygoData = JSON.parse(mooneygoContent);
    const baseKeys = {
      core: new Set(baseCollections.core.map(t => t.key)),
      semantic: new Set(baseCollections.semantic.map(t => t.key)),
      component: new Set(baseCollections.component.map(t => t.key))
    };

    mooneygoCollections = { core: [], semantic: [], component: [] };

    Object.keys(mooneygoData).forEach(key => {
      const value = mooneygoData[key];
      if (baseKeys.core.has(key)) {
        mooneygoCollections.core.push({ key, value });
      } else if (baseKeys.semantic.has(key)) {
        mooneygoCollections.semantic.push({ key, value });
      } else if (baseKeys.component.has(key)) {
        mooneygoCollections.component.push({ key, value });
      } else {
        // New token only in mooneygo - try to infer collection
        const keyPath = key.split('.');
        if (['colors', 'spacings', 'borderRadii', 'fonts', 'fontNames', 'shadows'].includes(keyPath[0])) {
          mooneygoCollections.core.push({ key, value });
        } else if (keyPath[0] === 'mixins') {
          mooneygoCollections.semantic.push({ key, value });
        } else {
          mooneygoCollections.component.push({ key, value });
        }
      }
    });
  }

  console.log(`   ✅ core: ${baseCollections.core.length} base + ${mooneygoCollections.core.length} mooneygo tokens`);
  console.log(`   ✅ semantic: ${baseCollections.semantic.length} base + ${mooneygoCollections.semantic.length} mooneygo tokens`);
  console.log(`   ✅ component: ${baseCollections.component.length} base + ${mooneygoCollections.component.length} mooneygo tokens`);

  // Collect all token keys for reference resolution
  const allKeys = [
    ...baseCollections.core.map(t => t.key),
    ...baseCollections.semantic.map(t => t.key),
    ...baseCollections.component.map(t => t.key),
    ...mooneygoCollections.core.map(t => t.key),
    ...mooneygoCollections.semantic.map(t => t.key),
    ...mooneygoCollections.component.map(t => t.key)
  ];

  // Convert each collection
  console.log('\n🔧 Converting collections...');
  const output = {
    core: convertCollection(baseCollections.core, mooneygoCollections.core, allKeys),
    semantic: convertCollection(baseCollections.semantic, mooneygoCollections.semantic, allKeys),
    component: convertCollection(baseCollections.component, mooneygoCollections.component, allKeys)
  };

  // Write output
  const outputPath = path.join(path.dirname(baseFilePath), 'Luckino-try1-base.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');

  console.log(`\n✅ Created: ${outputPath}`);
  console.log('\n🎉 Conversion complete!');
  console.log('\n📊 Output structure:');
  console.log('   - core (colors, spacings, borderRadii, fonts, shadows, fontNames)');
  console.log('   - semantic (mixins)');
  console.log('   - component (UI*, Screen*)');
  console.log('\n💡 Import in Luckino: Load this file to create 3 Variable Collections');
}

if (require.main === module) {
  main();
}

module.exports = { parseWithMarkers, convertCollection };
