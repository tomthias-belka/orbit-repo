/**
 * React Native Icon Exporter
 * Extracts icon data from Figma and generates React Native components
 */

import type { IconData, RNIconExportOptions, ExportResult, GeneratedIcon } from '../types/icons';
import { transformSvgToReactNative, generateComponentName } from '../utils/svgTransformer';

export class ReactNativeIconExporter {
  /**
   * Export selected icons to React Native components
   */
  async exportIcons(options: RNIconExportOptions): Promise<ExportResult> {
    try {
      const { selectedNodeIds, isIllustrated, includeDisabled, format } = options;

      // Get selected nodes
      const selectedNodes = await this.getNodesByIds(selectedNodeIds);

      if (selectedNodes.length === 0) {
        return {
          success: false,
          icons: [],
          error: 'No valid nodes selected. Please select vector components or frames.'
        };
      }

      // Process each node and extract icon data
      const iconsData: IconData[] = [];

      for (const node of selectedNodes) {
        try {
          const iconData = await this.extractIconData(node);
          if (iconData) {
            iconsData.push(iconData);
          }
        } catch (error) {
          console.warn(`Failed to extract icon data for ${node.name}:`, error);
          // Continue with other icons
        }
      }

      if (iconsData.length === 0) {
        return {
          success: false,
          icons: [],
          error: 'Could not extract icon data from selected nodes.'
        };
      }

      // Generate React Native component code for each icon
      const generatedIcons: GeneratedIcon[] = iconsData.map(iconData => {
        const code = transformSvgToReactNative(
          iconData.svgString,
          iconData.componentName,
          { isIllustrated, includeDisabled, format }
        );

        return {
          name: iconData.name,
          componentName: iconData.componentName,
          code,
          colors: iconData.colors
        };
      });

      return {
        success: true,
        icons: generatedIcons,
        message: `Successfully exported ${generatedIcons.length} icon(s)`
      };
    } catch (error) {
      return {
        success: false,
        icons: [],
        error: `Export failed: ${(error as Error).message}`
      };
    }
  }

  /**
   * Get Figma nodes by their IDs
   */
  private async getNodesByIds(nodeIds: string[]): Promise<SceneNode[]> {
    const nodes: SceneNode[] = [];

    for (const nodeId of nodeIds) {
      try {
        const node = await figma.getNodeByIdAsync(nodeId);
        if (node && this.isValidIconNode(node)) {
          nodes.push(node as SceneNode);
        }
      } catch (error) {
        console.warn(`Could not find node with ID ${nodeId}:`, error);
      }
    }

    return nodes;
  }

  /**
   * Check if a node is valid for icon export
   */
  private isValidIconNode(node: BaseNode): boolean {
    // Accept COMPONENT, FRAME, or vector nodes
    return (
      node.type === 'COMPONENT' ||
      node.type === 'FRAME' ||
      node.type === 'VECTOR' ||
      node.type === 'BOOLEAN_OPERATION' ||
      node.type === 'STAR' ||
      node.type === 'LINE' ||
      node.type === 'ELLIPSE' ||
      node.type === 'POLYGON' ||
      node.type === 'RECTANGLE'
    );
  }

  /**
   * Extract icon data from a Figma node
   */
  private async extractIconData(node: SceneNode): Promise<IconData | null> {
    try {
      // Export node as SVG string
      const svgString = await node.exportAsync({
        format: 'SVG_STRING'
      }) as string;

      // Generate component name
      const componentName = generateComponentName(node.name);

      // Extract colors from SVG
      const colors = this.extractColorsFromSvg(svgString);

      // Get node dimensions
      const width = 'width' in node ? node.width : 24;
      const height = 'height' in node ? node.height : 24;

      return {
        name: node.name,
        figmaNodeId: node.id,
        svgString,
        componentName,
        width: Math.round(width),
        height: Math.round(height),
        colors,
        hasMultipleColors: colors.length > 1
      };
    } catch (error) {
      console.error(`Failed to extract icon data for ${node.name}:`, error);
      return null;
    }
  }

  /**
   * Extract color values from SVG string
   */
  private extractColorsFromSvg(svgString: string): string[] {
    const colorMatches = svgString.match(/fill="(#[0-9A-Fa-f]{6})"/g) || [];
    const colors = colorMatches.map(match => {
      const colorMatch = match.match(/#[0-9A-Fa-f]{6}/);
      return colorMatch ? colorMatch[0] : '';
    }).filter(Boolean);

    // Return unique colors
    return [...new Set(colors)];
  }

  /**
   * Validate selection before export
   */
  async validateSelection(): Promise<{ valid: boolean; message?: string; count?: number }> {
    const selection = figma.currentPage.selection;

    if (selection.length === 0) {
      return {
        valid: false,
        message: 'No nodes selected. Please select components or frames containing icons.'
      };
    }

    const validNodes = selection.filter(node => this.isValidIconNode(node));

    if (validNodes.length === 0) {
      return {
        valid: false,
        message: 'Selected nodes are not valid for icon export. Please select vector components or frames.'
      };
    }

    return {
      valid: true,
      count: validNodes.length
    };
  }

  /**
   * Get current selection info for UI preview
   */
  async getSelectionInfo(): Promise<{ nodes: Array<{ id: string; name: string; type: string }> }> {
    const selection = figma.currentPage.selection;
    const validNodes = selection.filter(node => this.isValidIconNode(node));

    return {
      nodes: validNodes.map(node => ({
        id: node.id,
        name: node.name,
        type: node.type
      }))
    };
  }
}
