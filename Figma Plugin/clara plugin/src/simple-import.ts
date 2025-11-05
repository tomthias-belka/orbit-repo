/**
 * Simple Import System - Based on working backup
 */

export async function simpleImportVariables(jsonData: any): Promise<{
  success: boolean;
  message: string;
  variableCount: number;
  collectionCount: number;
}> {
  try {
    console.log('[simpleImport] Starting simple import process');

    let data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
    console.log('[simpleImport] Parsed JSON data:', JSON.stringify(data, null, 2));

    const collections: any = {};
    let variableCount = 0;
    let collectionCount = 0;

    // Process each top level object as a collection
    for (const collectionName in data) {
      if (collectionName.startsWith('$')) continue; // Skip metadata

      const collectionData = data[collectionName];
      console.log(`[simpleImport] Processing collection: ${collectionName}`);

      // Create or get collection
      const collection = await getOrCreateSimpleCollection(collectionName);
      if (!collection) continue;

      collections[collectionName] = collection;
      collectionCount++;

      // Process variables in this collection
      const varCount = await processCollectionSimple(collectionName, collectionData, collection);
      variableCount += varCount;
    }

    return {
      success: true,
      message: `Imported ${variableCount} variables into ${collectionCount} collections`,
      variableCount,
      collectionCount
    };

  } catch (error) {
    console.error('[simpleImport] Error:', error);
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
      console.log(`[simpleImport] Using existing collection: ${name}`);
      return { collection, modeIds: { 'Default': collection.modes[0].modeId } };
    }

    // Create new collection
    console.log(`[simpleImport] Creating new collection: ${name}`);
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

      console.log(`[simpleImport] Processing variable: ${currentPath}, type: ${tokenType}`);

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

        // Set value
        variable.setValueForMode(collectionInfo.modeIds['Default'], processedValue);

        // Set scopes
        assignSimpleScopes(variable, tokenType, currentPath);

        variableCount++;
        console.log(`[simpleImport] ✓ Created variable: ${currentPath}`);

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
  switch (figmaType) {
    case 'COLOR':
      // Handle alias references (e.g., "{semantic.colors.brand.primary}")
      if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
        return value; // Figma will resolve the reference automatically
      }
      return parseColor(value);
    case 'FLOAT':
      // Handle alias references for numeric values
      if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
        return value;
      }
      return parseFloat(String(value).replace(/px|rem|em/, '')) || 0;
    case 'STRING':
      return typeof value === 'object' ? JSON.stringify(value) : String(value);
    case 'BOOLEAN':
      return Boolean(value);
    default:
      return value;
  }
}

function parseColor(colorStr: string): { r: number; g: number; b: number } {
  if (typeof colorStr === 'object' && colorStr.r !== undefined) {
    return colorStr; // Already RGB
  }

  let hex = String(colorStr).replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }

  return {
    r: parseInt(hex.substr(0, 2), 16) / 255,
    g: parseInt(hex.substr(2, 2), 16) / 255,
    b: parseInt(hex.substr(4, 2), 16) / 255
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
    console.log(`[assignSimpleScopes] Applied scopes to ${path} (${tokenType}): ${scopes.join(', ')}`);
  } else {
    console.log(`[assignSimpleScopes] No specific scopes assigned to ${path} (type: ${tokenType})`);
  }
}