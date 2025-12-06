// Color Utilities
// Funzioni per parsing e conversione colori

export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

export interface RGBAColor extends RGBColor {
  a: number;
}

export type ParsedColor = RGBColor | RGBAColor;

/**
 * Parsa un valore colore in formato Figma RGB/RGBA
 */
export function parseColor(colorValue: any): ParsedColor | any {

  // Handle different color formats
  if (typeof colorValue !== 'string') {
    return colorValue;
  }

  // Handle hex
  if (colorValue.startsWith('#')) {
    return parseHexColor(colorValue);
  }

  // Handle rgba/rgb
  const rgbaMatch = colorValue.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/);
  if (rgbaMatch) {
    const r = parseInt(rgbaMatch[1], 10) / 255;
    const g = parseInt(rgbaMatch[2], 10) / 255;
    const b = parseInt(rgbaMatch[3], 10) / 255;
    const a = rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1;

    return { r, g, b, a };
  }

  // Handle numeric values that might be corrupted color values
  if (typeof colorValue === 'string' && !isNaN(Number(colorValue))) {
    console.warn(`[parseColor] Received numeric string that might be corrupted color: "${colorValue}"`);
    console.warn(`[parseColor] This might indicate a hex parsing issue upstream`);
  }

  // Return as is if format isn't recognized
  return colorValue;
}

/**
 * Parsa un colore hex in formato RGB/RGBA
 */
export function parseHexColor(hexColor: string): ParsedColor {
  const hex = hexColor.substring(1);

  // Convert 3-digit hex to 6-digit
  let fullHex = hex;
  if (hex.length === 3) {
    fullHex = '';
    for (let i = 0; i < hex.length; i++) {
      fullHex += hex[i] + hex[i];
    }
  }


  // Handle hex with alpha (8 digits)
  if (fullHex.length === 8) {
    const r = parseInt(fullHex.substring(0, 2), 16) / 255;
    const g = parseInt(fullHex.substring(2, 4), 16) / 255;
    const b = parseInt(fullHex.substring(4, 6), 16) / 255;
    const a = parseInt(fullHex.substring(6, 8), 16) / 255;

    return { r, g, b, a };
  }

  // Handle standard 6-digit hex
  if (fullHex.length === 6) {
    const rHex = fullHex.substring(0, 2);
    const gHex = fullHex.substring(2, 4);
    const bHex = fullHex.substring(4, 6);

    const rInt = parseInt(rHex, 16);
    const gInt = parseInt(gHex, 16);
    const bInt = parseInt(bHex, 16);


    const r = rInt / 255;
    const g = gInt / 255;
    const b = bInt / 255;


    return { r, g, b };
  } else {
    console.warn(`[parseHexColor] Invalid hex length: ${fullHex.length} for hex: ${fullHex}`);
    throw new Error(`Invalid hex color format: ${hexColor}`);
  }
}

/**
 * Converte RGB Figma (0-1) in hex
 */
export function rgbToHex(color: RGBColor | RGBAColor): string {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);

  const toHex = (n: number) => n.toString(16).padStart(2, '0');

  if ('a' in color && color.a < 1) {
    const a = Math.round(color.a * 255);
    return `#${toHex(r)}${toHex(g)}${toHex(b)}${toHex(a)}`;
  }

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Converte RGB Figma (0-1) in CSS rgb/rgba
 */
export function rgbToCss(color: RGBColor | RGBAColor): string {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);

  if ('a' in color && color.a < 1) {
    return `rgba(${r}, ${g}, ${b}, ${color.a})`;
  }

  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Valida se un oggetto è un colore RGB valido
 */
export function isValidRgbColor(value: any): value is RGBColor {
  return value &&
         typeof value === 'object' &&
         typeof value.r === 'number' && value.r >= 0 && value.r <= 1 &&
         typeof value.g === 'number' && value.g >= 0 && value.g <= 1 &&
         typeof value.b === 'number' && value.b >= 0 && value.b <= 1;
}

/**
 * Valida se un oggetto è un colore RGBA valido
 */
export function isValidRgbaColor(value: any): value is RGBAColor {
  return isValidRgbColor(value) &&
         typeof value.a === 'number' && value.a >= 0 && value.a <= 1;
}

/**
 * Valida se una stringa è un colore valido
 */
export function isValidColorString(colorStr: string): boolean {
  // Basic color validation
  if (colorStr.startsWith('#')) {
    const hex = colorStr.slice(1);
    return /^[0-9A-F]{3}$|^[0-9A-F]{6}$|^[0-9A-F]{8}$/i.test(hex);
  }

  // RGB/RGBA validation
  if (colorStr.startsWith('rgb')) {
    return /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*[\d.]+)?\s*\)$/i.test(colorStr);
  }

  // CSS named colors (partial list)
  const namedColors = ['red', 'green', 'blue', 'black', 'white', 'yellow', 'cyan', 'magenta', 'transparent'];
  return namedColors.includes(colorStr.toLowerCase());
}

/**
 * Converte un colore in formato CSS per export
 */
export function colorToCss(value: any, format: 'hex' | 'rgb' | 'auto' = 'auto'): string {
  if (isValidRgbColor(value)) {
    switch (format) {
      case 'hex':
        return rgbToHex(value);
      case 'rgb':
        return rgbToCss(value);
      case 'auto':
      default:
        // Use RGBA if alpha < 1, otherwise hex
        return ('a' in value && value.a < 1) ? rgbToCss(value) : rgbToHex(value);
    }
  }

  if (typeof value === 'string' && isValidColorString(value)) {
    return value;
  }

  return String(value);
}

/**
 * Valida e corregge valori colore per compatibilità Figma
 */
export function validateColorValues(data: any): void {

  function validateObject(obj: any, path: string = ''): void {
    for (const [key, value] of Object.entries(obj)) {
      if (key.startsWith('$')) continue;

      const currentPath = path ? `${path}.${key}` : key;

      if (typeof value === 'object' && value !== null) {
        if ('$type' in value && value.$type === 'color') {
          const colorValue = '$value' in value ? value.$value : value.value;
          if (colorValue && typeof colorValue === 'string') {
            try {
              const parsed = parseColor(colorValue);
              if (parsed !== colorValue) {
                if ('$value' in value) {
                  value.$value = parsed;
                } else {
                  value.value = parsed;
                }
              }
            } catch (error) {
              console.warn(`[validateColorValues] Invalid color at ${currentPath}: ${colorValue}`, error);
            }
          }
        } else {
          validateObject(value, currentPath);
        }
      }
    }
  }

  validateObject(data);
}