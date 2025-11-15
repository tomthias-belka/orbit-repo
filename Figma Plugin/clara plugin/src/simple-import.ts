/**
 * Simple Import System - Based on working backup
 */

/// <reference types="@figma/plugin-typings" />

// ================== ALIAS/REFERENCE SYSTEM TYPES ==================

// Marker object for unresolved aliases
interface AliasMarker {
  __isAlias: true;
  referencePath: string; // e.g., "stroke.inverted" or "collection.variable"
  targetCollectionName: string; // The collection where the target variable is located
}

// Structure for storing pending aliases (STEP 1)
interface PendingAlias {
  variable: Variable; // The variable that will receive the alias
  modeId: string;
  referencePath: string; // e.g., "stroke.inverted"
  targetCollectionName: string; // The collection where the target variable is located
  figmaType: 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN';
}

// Type guard for AliasMarker
function isAliasMarker(value: any): value is AliasMarker {
  return typeof value === 'object' && value !== null && value.__isAlias === true;
}

/**
 * Determines which collection contains the target token based on alias path
 * Rules from clara-tokens.json:
 * - {colors.*}, {spacing.*}, {radius.*}, {typography.*} → "global"
 * - {brand.*}, {shadow.*}, {size.*}, {booleans.*} → "semantic"
 * - {colors.text.*}, {colors.border.*}, {colors.feedback.*}, {colors.background.*}, {colors.icon.*}, {colors.specific.*} → "semantic"
 */
function resolveCollectionFromAlias(aliasPath: string): string {
  const parts = aliasPath.split('.');

  if (parts.length === 0) return 'global'; // fallback

  const firstPart = parts[0];
  const secondPart = parts[1];

  // Check for global collection patterns
  const globalPrefixes = ['spacing', 'radius', 'typography'];
  if (globalPrefixes.includes(firstPart)) {
    return 'global';
  }

  // Special case: colors can be in both global and semantic
  if (firstPart === 'colors') {
    // If it's a direct color scale (e.g., colors.ocean.70), it's in global
    // If it's a semantic category (e.g., colors.text.main), it's in semantic
    const semanticColorCategories = ['text', 'border', 'feedback', 'background', 'icon', 'specific'];
    if (secondPart && semanticColorCategories.includes(secondPart)) {
      return 'semantic';
    }
    // Otherwise it's a color scale in global
    return 'global';
  }

  // Check for semantic collection patterns
  const semanticPrefixes = ['brand', 'shadow', 'size', 'booleans'];
  if (semanticPrefixes.includes(firstPart)) {
    return 'semantic';
  }

  // Default fallback to global
  return 'global';
}

// Global arrays for two-pass system
const pendingAliases: PendingAlias[] = [];
let localVariablesCache: Variable[] | null = null;

// ================== END ALIAS SYSTEM TYPES ==================

export async function simpleImportVariables(jsonData: any): Promise<{
  success: boolean;
  message: string;
  variableCount: number;
  collectionCount: number;
}> {
  try {

    let data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

    const collections: any = {};
    let variableCount = 0;
    let collectionCount = 0;

    // Process each top level object as a collection
    for (const collectionName in data) {
      if (collectionName.startsWith('$')) continue; // Skip metadata

      const collectionData = data[collectionName];

      // Create or get collection
      const collection = await getOrCreateSimpleCollection(collectionName);
      if (!collection) continue;

      collections[collectionName] = collection;
      collectionCount++;

      // Process variables in this collection
      const varCount = await processCollectionSimple(collectionName, collectionData, collection);
      variableCount += varCount;
    }

    // === STEP 1 COMPLETED ===
    console.log(`[simpleImport] ✅ STEP 1 completed: ${variableCount} variables created in ${collectionCount} collections`);

    // === STEP 2: RESOLVE ALIASES ===
    let aliasResults = { resolved: 0, failed: 0 };
    if (pendingAliases.length > 0) {
      console.log(`[simpleImport] 🔗 STEP 2: Resolving ${pendingAliases.length} pending aliases...`);
      aliasResults = await resolvePendingAliases();

      // Cleanup
      pendingAliases.length = 0;
      localVariablesCache = null;

      console.log(`[simpleImport] ✅ STEP 2 completed: ${aliasResults.resolved} aliases resolved, ${aliasResults.failed} failed`);
    } else {
      console.log(`[simpleImport] ℹ️ No aliases to resolve`);
    }

    const finalMessage = aliasResults.resolved > 0
      ? `Successfully imported ${variableCount} variables (${aliasResults.resolved} aliases resolved) into ${collectionCount} collections`
      : `Successfully imported ${variableCount} variables into ${collectionCount} collections`;

    console.log(`[simpleImport] 🎉 Import completed successfully`);

    return {
      success: true,
      message: finalMessage,
      variableCount,
      collectionCount
    };

  } catch (error) {
    console.error('[simpleImport] Error:', error);

    // Cleanup on error
    pendingAliases.length = 0;
    localVariablesCache = null;

    return {
      success: false,
      message: `Import failed: ${(error as Error).message}`,
      variableCount: 0,
      collectionCount: 0
    };
  }
}

async function getOrCreateSimpleCollection(name: string) {
  try {
    // Check if collection already exists
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    let collection = collections.find(c => c.name === name);

    if (collection) {
      return { collection, modeIds: { 'Default': collection.modes[0].modeId } };
    }

    // Create new collection
    collection = figma.variables.createVariableCollection(name);

    return {
      collection,
      modeIds: { 'Default': collection.modes[0].modeId }
    };

  } catch (error) {
    console.error(`[simpleImport] Failed to create collection ${name}:`, error);
    return null;
  }
}

async function processCollectionSimple(
  collectionName: string,
  data: any,
  collectionInfo: any,
  path: string = ''
): Promise<number> {
  let variableCount = 0;

  for (const key in data) {
    if (key.startsWith('$')) continue; // Skip metadata

    const value = data[key];
    const currentPath = path ? `${path}/${key}` : key;

    if (value.$value !== undefined || value.value !== undefined) {
      // This is a variable
      const tokenType = value.$type || value.type || 'string';
      const tokenValue = value.$value || value.value;


      // Convert type to Figma type
      const figmaType = convertTypeToFigma(tokenType);
      if (!figmaType) {
        console.warn(`[simpleImport] Unsupported type ${tokenType} for ${currentPath}`);
        continue;
      }

      // Process the value
      const processedValue = processSimpleValue(tokenValue, figmaType);

      // Create variable
      try {
        const variable = figma.variables.createVariable(
          currentPath,
          collectionInfo.collection,
          figmaType
        );

        // Check if value is an alias marker
        if (isAliasMarker(processedValue)) {
          // Add to pending aliases for second pass
          pendingAliases.push({
            variable,
            modeId: collectionInfo.modeIds['Default'],
            referencePath: processedValue.referencePath,
            targetCollectionName: processedValue.targetCollectionName,
            figmaType
          });
          console.log(`[simpleImport] Alias detected: ${currentPath} -> {${processedValue.referencePath}} in collection "${processedValue.targetCollectionName}"`);
        } else {
          // Set value immediately for non-alias tokens
          variable.setValueForMode(collectionInfo.modeIds['Default'], processedValue);
        }

        // Set scopes
        assignSimpleScopes(variable, tokenType, currentPath);

        variableCount++;

      } catch (error) {
        console.error(`[simpleImport] Failed to create variable ${currentPath}:`, error);
      }

    } else if (typeof value === 'object') {
      // This is a group, process recursively
      const groupCount = await processCollectionSimple(
        collectionName,
        value,
        collectionInfo,
        currentPath
      );
      variableCount += groupCount;
    }
  }

  return variableCount;
}

function convertTypeToFigma(tokenType: string): 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN' | null {
  switch (tokenType.toLowerCase()) {
    case 'color':
      return 'COLOR';
    case 'number':
    case 'dimension':
    case 'size':
    case 'spacing':
    case 'lineWidth':
    case 'line-width':
    case 'strokeWidth':
    case 'stroke-width':
      return 'FLOAT';
    case 'string':
    case 'text':
    case 'typography':
      return 'STRING';
    case 'boolean':
      return 'BOOLEAN';
    default:
      return null;
  }
}

function processSimpleValue(value: any, figmaType: string): any {
  // Detect alias references (e.g., "{semantic.colors.brand.primary}")
  if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
    // Extract reference path (remove { })
    const aliasPath = value.slice(1, -1); // e.g., "brand.core.main"
    const referencePath = aliasPath.replace(/\./g, '/'); // Convert dots to slashes for Figma
    const targetCollectionName = resolveCollectionFromAlias(aliasPath); // Determine target collection

    return {
      __isAlias: true,
      referencePath,
      targetCollectionName
    } as AliasMarker;
  }

  switch (figmaType) {
    case 'COLOR':
      return parseColor(value);
    case 'FLOAT':
      return parseFloat(String(value).replace(/px|rem|em/, '')) || 0;
    case 'STRING':
      return typeof value === 'object' ? JSON.stringify(value) : String(value);
    case 'BOOLEAN':
      return Boolean(value);
    default:
      return value;
  }
}

function parseColor(colorStr: string | { r: number; g: number; b: number }): { r: number; g: number; b: number } {
  if (typeof colorStr === 'object' && 'r' in colorStr && colorStr.r !== undefined) {
    return colorStr; // Already RGB
  }

  let hex = String(colorStr).replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }

  return {
    r: parseInt(hex.substring(0, 2), 16) / 255,
    g: parseInt(hex.substring(2, 4), 16) / 255,
    b: parseInt(hex.substring(4, 6), 16) / 255
  };
}

function assignSimpleScopes(variable: any, tokenType: string, path: string): void {
  const scopes: string[] = [];
  const pathLower = path.toLowerCase();

  // Scope mapping based on Figma API official documentation (2024)
  if (tokenType === 'color') {
    // Color-specific scopes - using official Figma API scope names
    if (pathLower.includes('text') || pathLower.includes('foreground')) {
      scopes.push('TEXT_FILL');
    } else if (pathLower.includes('border') || pathLower.includes('stroke')) {
      scopes.push('STROKE_COLOR');
    } else if (pathLower.includes('effect') || pathLower.includes('shadow')) {
      scopes.push('EFFECT_COLOR');
    } else if (pathLower.includes('background') || pathLower.includes('surface') || pathLower.includes('fill')) {
      scopes.push('ALL_FILLS');
    } else {
      // For generic colors, use conservative fill approach
      scopes.push('ALL_FILLS');
    }
  }

  // Direct type-to-scope mapping (highest priority)
  const tokenTypeLower = tokenType.toLowerCase();

  // Typography scopes based on EXACT token type
  if (tokenTypeLower === 'fontfamily' || tokenTypeLower === 'font-family') {
    scopes.push('FONT_FAMILY');
  } else if (tokenTypeLower === 'fontsize' || tokenTypeLower === 'font-size') {
    scopes.push('FONT_SIZE');
  } else if (tokenTypeLower === 'fontweight' || tokenTypeLower === 'font-weight') {
    scopes.push('FONT_WEIGHT');
  } else if (tokenTypeLower === 'lineheight' || tokenTypeLower === 'line-height') {
    scopes.push('LINE_HEIGHT');
  } else if (tokenTypeLower === 'borderradius' || tokenTypeLower === 'border-radius' || tokenTypeLower === 'radius') {
    scopes.push('CORNER_RADIUS');
  } else if (tokenTypeLower === 'linewidth' || tokenTypeLower === 'line-width' || 
             tokenTypeLower === 'strokewidth' || tokenTypeLower === 'stroke-width') {
    scopes.push('STROKE');
  } else if (tokenTypeLower === 'opacity') {
    scopes.push('LAYER_OPACITY');
  } else if (tokenTypeLower === 'shadow' || tokenTypeLower === 'effects') {
    scopes.push('EFFECTS');
  }

  // Fallback: Typography-specific scopes (for generic STRING types)
  else if (tokenType === 'string') {
    if (pathLower.includes('font-family') || pathLower.includes('fontfamily')) {
      scopes.push('FONT_FAMILY');
    } else if (pathLower.includes('font-weight') || pathLower.includes('fontweight')) {
      scopes.push('FONT_WEIGHT');
    }
    // No scope for generic strings
  }

  // Fallback: Number/dimension-specific scopes (FLOAT type)
  else if (tokenType === 'number' || tokenType === 'spacing' || tokenType === 'dimension') {

    if (pathLower.includes('radius')) {
      scopes.push('CORNER_RADIUS');
    } else if (pathLower.includes('font-size') || pathLower.includes('fontsize')) {
      scopes.push('FONT_SIZE');
    } else if (pathLower.includes('line-height') || pathLower.includes('lineheight')) {
      scopes.push('LINE_HEIGHT');
    } else if (pathLower.includes('font-weight') || pathLower.includes('fontweight')) {
      scopes.push('FONT_WEIGHT');
    } else if (pathLower.includes('letter-spacing')) {
      scopes.push('LETTER_SPACING');
    } else if (pathLower.includes('paragraph-spacing')) {
      scopes.push('PARAGRAPH_SPACING');
    } else if (pathLower.includes('paragraph-indent')) {
      scopes.push('PARAGRAPH_INDENT');
    } else if (pathLower.includes('border') || pathLower.includes('stroke') || pathLower.includes('line-width')) {
      scopes.push('STROKE_FLOAT');
    } else if (pathLower.includes('opacity')) {
      scopes.push('LAYER_OPACITY');
    } else if (pathLower.includes('width') || pathLower.includes('height') || pathLower.includes('size')) {
      scopes.push('WIDTH_HEIGHT');
    } else if (pathLower.includes('gap') || pathLower.includes('spacing')) {
      scopes.push('GAP');
    } else if (pathLower.includes('effect') || pathLower.includes('shadow') || pathLower.includes('blur')) {
      scopes.push('EFFECT_FLOAT');
    }
    // Don't assign any scope if path doesn't clearly indicate usage
  }

  if (scopes.length > 0) {
    variable.scopes = scopes as any;
  }
}

// ================== ALIAS RESOLUTION FUNCTIONS ==================

/**
 * Find a variable by its Figma path (e.g., "colors/primary/main") in a specific collection
 */
async function findVariableByPath(figmaPath: string, targetCollectionName: string): Promise<Variable | null> {
  // Lazy-load and cache all local variables
  if (localVariablesCache === null) {
    localVariablesCache = await figma.variables.getLocalVariablesAsync();
    console.log(`[findVariableByPath] Loaded ${localVariablesCache.length} local variables into cache`);
  }

  // Get the target collection
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const targetCollection = collections.find(c => c.name === targetCollectionName);

  if (!targetCollection) {
    console.warn(`[findVariableByPath] Collection not found: "${targetCollectionName}"`);
    return null;
  }

  // Search for the variable in the target collection
  const targetVariable = localVariablesCache.find(v =>
    v.variableCollectionId === targetCollection.id &&
    v.name === figmaPath
  );

  if (targetVariable) {
    console.log(`[findVariableByPath] Found variable "${figmaPath}" in collection "${targetCollectionName}"`);
    return targetVariable;
  }

  console.warn(`[findVariableByPath] Variable "${figmaPath}" not found in collection "${targetCollectionName}"`);
  return null;
}

/**
 * STEP 2: Resolve all pending aliases.
 * Creates VariableAlias objects and assigns them using setValueForMode.
 */
async function resolvePendingAliases(): Promise<{ resolved: number; failed: number }> {
  let resolvedCount = 0;
  let failedCount = 0;

  console.log(`[resolvePendingAliases] Starting resolution of ${pendingAliases.length} pending aliases...`);

  // Reset cache to get fresh data
  localVariablesCache = null;

  for (const pending of pendingAliases) {
    const { variable, modeId, referencePath, targetCollectionName, figmaType } = pending;

    // 1. Find the target variable by path in the correct collection
    const targetVariable = await findVariableByPath(referencePath, targetCollectionName);

    if (targetVariable) {
      // 2. Check type compatibility (important!)
      if (targetVariable.resolvedType !== figmaType) {
        console.warn(
          `[resolvePendingAliases] Type mismatch: ${variable.name} -> ${targetVariable.name}. ` +
          `Expected: ${figmaType}, Found: ${targetVariable.resolvedType}. Attempting resolution anyway...`
        );
      }

      // 3. Create VariableAlias object and assign
      try {
        const aliasObj = figma.variables.createVariableAlias(targetVariable);
        variable.setValueForMode(modeId, aliasObj);
        resolvedCount++;
        console.log(`[resolvePendingAliases] ✓ Resolved: ${variable.name} -> ${targetVariable.name} (collection: ${targetCollectionName})`);
      } catch (e) {
        console.error(`[resolvePendingAliases] ✗ Error creating/assigning alias for ${variable.name}:`, e);
        failedCount++;
      }
    } else {
      // Target variable not found
      console.warn(`[resolvePendingAliases] ✗ Target variable not found: {${referencePath}} in collection "${targetCollectionName}" for ${variable.name}`);
      failedCount++;
    }
  }

  console.log(`[resolvePendingAliases] Completed: ${resolvedCount} resolved, ${failedCount} failed`);
  return { resolved: resolvedCount, failed: failedCount };
}

// ================== END ALIAS RESOLUTION FUNCTIONS ==================