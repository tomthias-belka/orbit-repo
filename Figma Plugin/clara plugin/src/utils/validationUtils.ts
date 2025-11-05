// Validation Utilities
// Funzioni per validazione e conversione di valori per variabili Figma

import { parseColor, isValidRgbColor } from './colorUtils.js';

/**
 * Converte un tipo token al tipo Figma corrispondente
 */
export function convertTypeToFigma(tokenType: string): 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN' | null {
  switch (tokenType.toLowerCase()) {
    case 'color':
      return 'COLOR';
    case 'number':
    case 'dimension':
    case 'size':
    case 'spacing':
    case 'borderRadius':
    case 'strokeWidth':
    case 'lineWidth':
    case 'line-width':
    case 'stroke-width':
    case 'opacity':
    case 'fontSize':
    case 'lineHeight':
    case 'letterSpacing':
    case 'paragraphSpacing':
    case 'paragraphIndent':
      return 'FLOAT';
    case 'boolean':
      return 'BOOLEAN';
    case 'string':
    case 'fontFamily':
    case 'fontWeight':
    case 'typography':
    case 'shadow':
    case 'border':
    case 'gradient':
    case 'transition':
    case 'strokeStyle':
    default:
      return 'STRING';
  }
}

/**
 * Valida e converte un valore per il tipo di variabile Figma
 */
export function validateValueForVariableType(value: any, expectedType: string): any {
  console.log(`[validateValueForVariableType] Validating value for type ${expectedType}:`, JSON.stringify(value));

  switch (expectedType) {
    case 'FLOAT':
      return validateFloatValue(value);
    case 'COLOR':
      return validateColorValue(value);
    case 'STRING':
      return validateStringValue(value);
    case 'BOOLEAN':
      return validateBooleanValue(value);
    default:
      console.log(`[validateValueForVariableType] DEFAULT: Returning value as-is for type ${expectedType}`);
      return value;
  }
}

/**
 * Valida e converte un valore float
 */
export function validateFloatValue(value: any): number {
  if (typeof value === 'number') {
    console.log(`[validateFloatValue] Value is already a number`);
    return value;
  }

  // Handle alias values that might reference other numeric tokens
  if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
    console.log(`[validateFloatValue] Alias reference detected, returning as-is for later resolution:`, value);
    return value;
  }

  // Parse string values with units
  if (typeof value === 'string') {
    const numericValue = parseFloat(value.replace(/px|pt|rem|em|%/, ''));
    if (!isNaN(numericValue)) {
      console.log(`[validateFloatValue] Parsed numeric value from string:`, numericValue);
      return numericValue;
    }
  }

  console.log(`[validateFloatValue] Converting to number, fallback to 0 if invalid`);
  return parseFloat(String(value)) || 0;
}

/**
 * Valida e converte un valore colore
 */
export function validateColorValue(value: any): any {
  // Parse color using parseColor function
  const colorValue = parseColor(value);
  console.log(`[validateColorValue] Parsed color:`, JSON.stringify(colorValue));
  return colorValue;
}

/**
 * Valida e converte un valore stringa
 */
export function validateStringValue(value: any): string {
  if (typeof value === 'string') {
    console.log(`[validateStringValue] Value is already a string`);
    return value;
  }

  // Handle composite tokens (typography, shadow) by converting objects to readable JSON
  if (typeof value === 'object' && value !== null) {
    try {
      // Convert complex objects (composite tokens) to formatted JSON strings
      const stringValue = JSON.stringify(value, null, 2);
      console.log(`[validateStringValue] Converted composite token object to JSON string:`, stringValue);
      return stringValue;
    } catch (e) {
      // Fallback if JSON.stringify fails
      console.warn(`[validateStringValue] JSON stringify failed, using fallback:`, e);
      return "[object Object]";
    }
  }

  // Convert other types to string
  const stringValue = String(value);
  console.log(`[validateStringValue] Converted to string:`, stringValue);
  return stringValue;
}

/**
 * Valida e converte un valore boolean
 */
export function validateBooleanValue(value: any): boolean {
  if (typeof value === 'boolean') {
    console.log(`[validateBooleanValue] Value is already boolean`);
    return value;
  }

  // Handle string representations
  if (typeof value === 'string') {
    const lowerValue = value.toLowerCase();
    if (lowerValue === 'true' || lowerValue === 'yes' || lowerValue === '1') return true;
    if (lowerValue === 'false' || lowerValue === 'no' || lowerValue === '0') return false;
  }

  // Default boolean conversion
  const boolValue = Boolean(value);
  console.log(`[validateBooleanValue] Converted to boolean:`, boolValue);
  return boolValue;
}

/**
 * Valida se un valore è un alias di token
 */
export function isTokenAlias(value: any): boolean {
  return typeof value === 'string' &&
         value.startsWith('{') &&
         value.endsWith('}');
}

/**
 * Estrae il nome del token da un alias
 */
export function extractAliasTokenName(aliasValue: string): string {
  return aliasValue.slice(1, -1).trim();
}

/**
 * Valida la struttura di un token
 */
export function validateTokenStructure(token: any): {
  isValid: boolean;
  errors: string[];
  tokenType?: string;
  tokenValue?: any;
} {
  const errors: string[] = [];

  if (!token || typeof token !== 'object') {
    errors.push('Token must be an object');
    return { isValid: false, errors };
  }

  // Check for $type/$value pattern (W3C Design Tokens)
  if ('$type' in token && '$value' in token) {
    return {
      isValid: true,
      errors: [],
      tokenType: token.$type,
      tokenValue: token.$value
    };
  }

  // Check for type/value pattern (Token Studio)
  if ('type' in token && 'value' in token) {
    return {
      isValid: true,
      errors: [],
      tokenType: token.type,
      tokenValue: token.value
    };
  }

  // Check if it's a group (has nested objects)
  const hasNestedObjects = Object.values(token).some(value =>
    typeof value === 'object' && value !== null
  );

  if (hasNestedObjects) {
    return {
      isValid: true,
      errors: [],
      tokenType: 'group',
      tokenValue: token
    };
  }

  errors.push('Token must have either $type/$value or type/value properties, or contain nested tokens');
  return { isValid: false, errors };
}

/**
 * Normalizza la struttura di un token (Token Studio -> W3C)
 */
export function normalizeTokenStructure(token: any): any {
  if (!token || typeof token !== 'object') {
    return token;
  }

  // Se è già in formato W3C, ritorna così com'è
  if ('$type' in token || '$value' in token) {
    return token;
  }

  // Converte da Token Studio a W3C
  if ('type' in token && 'value' in token) {
    const normalized: any = {
      $type: token.type,
      $value: token.value
    };

    if (token.description) {
      normalized.$description = token.description;
    }

    if (token.extensions) {
      normalized.$extensions = token.extensions;
    }

    return normalized;
  }

  // Se è un gruppo, normalizza ricorsivamente
  const normalized: any = {};
  for (const [key, value] of Object.entries(token)) {
    normalized[key] = normalizeTokenStructure(value);
  }

  return normalized;
}

/**
 * Valida un dataset completo di token
 */
export function validateTokenDataset(data: any): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  tokenCount: number;
  groupCount: number;
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  let tokenCount = 0;
  let groupCount = 0;

  if (!data || typeof data !== 'object') {
    errors.push('Dataset must be an object');
    return { isValid: false, errors, warnings, tokenCount: 0, groupCount: 0 };
  }

  function validateRecursive(obj: any, path: string = ''): void {
    for (const [key, value] of Object.entries(obj)) {
      if (key.startsWith('$')) continue; // Skip metadata

      const currentPath = path ? `${path}.${key}` : key;
      const validation = validateTokenStructure(value);

      if (!validation.isValid) {
        errors.push(`Invalid token at ${currentPath}: ${validation.errors.join(', ')}`);
      } else {
        if (validation.tokenType === 'group') {
          groupCount++;
          validateRecursive(value, currentPath);
        } else {
          tokenCount++;

          // Validate token value
          if (validation.tokenType && validation.tokenValue !== undefined) {
            try {
              validateValueForVariableType(validation.tokenValue,
                convertTypeToFigma(validation.tokenType) || 'STRING');
            } catch (error) {
              warnings.push(`Value validation warning at ${currentPath}: ${error.message}`);
            }
          }
        }
      }
    }
  }

  validateRecursive(data);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    tokenCount,
    groupCount
  };
}

/**
 * Funzione legacy per compatibilità
 */
export function processSimpleValue(value: any, figmaType: string): any {
  return validateValueForVariableType(value, figmaType);
}