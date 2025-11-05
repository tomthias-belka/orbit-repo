/**
 * SVG Transformer for React Native Components
 * Replicates SVGR behavior (--native --typescript --icon)
 * Converts SVG strings to React Native SVG component code
 */

import type { IconExportConfig } from '../types/icons';

/**
 * Transforms SVG string to React Native component code (SVGR-compliant)
 */
export function transformSvgToReactNative(
  svgString: string,
  componentName: string,
  config: IconExportConfig
): string {
  const { format = 'tsx' } = config;

  // Parse SVG to extract attributes
  const viewBoxMatch = svgString.match(/viewBox="([^"]+)"/);
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 24 24';

  // Extract SVG content (everything between <svg> tags)
  const contentMatch = svgString.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
  if (!contentMatch) {
    throw new Error('Invalid SVG: Could not extract content');
  }

  let content = contentMatch[1];

  // Transform SVG elements to React Native SVG components
  content = transformSvgElements(content);

  // Transform attributes to React Native prop format
  content = transformAttributes(content);

  // Replace fill colors with props.fill (SVGR behavior)
  content = replaceColorsWithProps(content);

  // Generate SVGR-style component
  return generateSvgrComponent(
    componentName,
    viewBox,
    content,
    format === 'tsx'
  );
}

/**
 * Transform SVG elements to React Native SVG component names
 */
function transformSvgElements(content: string): string {
  return content
    .replace(/<path/g, '<Path')
    .replace(/<\/path>/g, '</Path>')
    .replace(/<circle/g, '<Circle')
    .replace(/<\/circle>/g, '</Circle>')
    .replace(/<rect/g, '<Rect')
    .replace(/<\/rect>/g, '</Rect>')
    .replace(/<ellipse/g, '<Ellipse')
    .replace(/<\/ellipse>/g, '</Ellipse>')
    .replace(/<line/g, '<Line')
    .replace(/<\/line>/g, '</Line>')
    .replace(/<polygon/g, '<Polygon')
    .replace(/<\/polygon>/g, '</Polygon>')
    .replace(/<polyline/g, '<Polyline')
    .replace(/<\/polyline>/g, '</Polyline>')
    .replace(/<g/g, '<G')
    .replace(/<\/g>/g, '</G>');
}

/**
 * Transform SVG attributes to React Native prop format
 */
function transformAttributes(content: string): string {
  return content
    .replace(/fill-rule=/g, 'fillRule=')
    .replace(/clip-rule=/g, 'clipRule=')
    .replace(/stroke-width=/g, 'strokeWidth=')
    .replace(/stroke-linecap=/g, 'strokeLinecap=')
    .replace(/stroke-linejoin=/g, 'strokeLinejoin=')
    .replace(/stroke-miterlimit=/g, 'strokeMiterlimit=')
    .replace(/stroke-dasharray=/g, 'strokeDasharray=')
    .replace(/stroke-dashoffset=/g, 'strokeDashoffset=');
}

/**
 * Replace fill and stroke colors with props (SVGR behavior)
 */
function replaceColorsWithProps(content: string): string {
  // Extract all unique fill colors
  const fillMatches = content.match(/fill="(#[0-9A-Fa-f]{3,6}|[a-zA-Z]+)"/g) || [];
  const fillColors = [...new Set(fillMatches.map(match => {
    const colorMatch = match.match(/fill="([^"]+)"/);
    return colorMatch ? colorMatch[1] : '';
  }).filter(Boolean))];

  // Extract all unique stroke colors
  const strokeMatches = content.match(/stroke="(#[0-9A-Fa-f]{3,6}|[a-zA-Z]+)"/g) || [];
  const strokeColors = [...new Set(strokeMatches.map(match => {
    const colorMatch = match.match(/stroke="([^"]+)"/);
    return colorMatch ? colorMatch[1] : '';
  }).filter(Boolean))];

  // Get first colors as fallbacks
  const fallbackFill = fillColors[0] || '#000';
  const fallbackStroke = strokeColors[0] || '#000';

  let transformedContent = content;

  // Replace all fill colors with dynamic props.fill
  fillColors.forEach(color => {
    const regex = new RegExp(`fill="${color}"`, 'g');
    transformedContent = transformedContent.replace(regex, `fill={props.fill || '${fallbackFill}'}`);
  });

  // Replace all stroke colors with dynamic props.stroke
  strokeColors.forEach(color => {
    const regex = new RegExp(`stroke="${color}"`, 'g');
    transformedContent = transformedContent.replace(regex, `stroke={props.stroke || '${color}'}`);
  });

  return transformedContent;
}

/**
 * Generate SVGR-style component (replicates --native --typescript --icon)
 */
function generateSvgrComponent(
  componentName: string,
  viewBox: string,
  content: string,
  isTypeScript: boolean
): string {
  // Get list of used SVG components for imports
  const usedComponents = getUsedSvgComponents(content);
  const importList = ['Svg', ...usedComponents].join(', ');

  // Add "Svg" prefix to component name (SVGR convention)
  const finalComponentName = componentName.startsWith('Svg') ? componentName : `Svg${componentName}`;

  if (isTypeScript) {
    // TypeScript version
    return `import * as React from 'react';
import ${importList} from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';

const ${finalComponentName} = (props: SvgProps) => (
  <Svg
    viewBox="${viewBox}"
    width={24}
    height={24}
    {...props}
  >
    ${content.trim()}
  </Svg>
);

export default ${finalComponentName};
`;
  } else {
    // JavaScript version (no types)
    return `import * as React from 'react';
import ${importList} from 'react-native-svg';

const ${finalComponentName} = (props) => (
  <Svg
    viewBox="${viewBox}"
    width={24}
    height={24}
    {...props}
  >
    ${content.trim()}
  </Svg>
);

export default ${finalComponentName};
`;
  }
}

/**
 * Get list of SVG components used in content
 */
function getUsedSvgComponents(content: string): string[] {
  const components: string[] = [];
  const componentNames = ['Path', 'Circle', 'Rect', 'Ellipse', 'Line', 'Polygon', 'Polyline', 'G'];

  componentNames.forEach(comp => {
    if (content.includes(`<${comp}`)) {
      components.push(comp);
    }
  });

  return components;
}

/**
 * Generate PascalCase component name from Figma node name (SVGR convention: no Svg prefix here, added in generator)
 */
export function generateComponentName(figmaName: string): string {
  // Remove any path prefixes (e.g., "icons/alert-triangle" -> "alert-triangle")
  const baseName = figmaName.split('/').pop() || figmaName;

  // Split by hyphens, underscores, or spaces and convert to PascalCase
  const pascalName = baseName
    .split(/[-_\s]+/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('');

  // Return without Svg prefix (will be added in generateSvgrComponent)
  return pascalName;
}
