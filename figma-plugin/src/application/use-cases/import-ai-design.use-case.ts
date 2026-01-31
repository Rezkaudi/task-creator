import { DesignNode } from '../../domain/entities/design-node';
import { INodeRepository } from '../../domain/interfaces/node-repository.interface';
import { INotificationPort } from '../../domain/interfaces/notification-port.interface';
import { DesignDataParser } from '../services/design-data-parser.service';

/**
 * AI Import result
 */
export interface AIImportResult {
  readonly success: boolean;
  readonly pagesCreated: number;
  readonly error?: string;
}

/**
 * Use case for importing AI-generated designs into Figma
 * Handles comprehensive lossless import of all node types
 */
export class ImportAIDesignUseCase {
  private static readonly PAGE_SPACING = 200;

  constructor(
    private readonly nodeRepository: INodeRepository,
    private readonly notificationPort: INotificationPort,
    private readonly parser: DesignDataParser
  ) { }

  /**
   * Execute the AI design import use case
   */
  async execute(rawData: unknown): Promise<AIImportResult> {
    try {
      // Clear component registry before import
      this.nodeRepository.clearComponentRegistry();

      const nodes = this.parser.parseAIResponse(rawData);

      if (nodes.length === 0) {
        throw new Error('Invalid AI design data format.');
      }

      const existingNodes = await this.getExistingDesignPositions();

      const designBounds = this.calculateAvailableSpace(existingNodes);

      // Sort nodes by layer index if available to maintain z-order
      const sortedNodes = this.sortByLayerIndex(nodes);

      // First pass: Create all components to register them
      const componentNodes = sortedNodes.filter(n => n.type === 'COMPONENT' || n.type === 'COMPONENT_SET');
      const otherNodes = sortedNodes.filter(n => n.type !== 'COMPONENT' && n.type !== 'COMPONENT_SET');

      const createdNodes: SceneNode[] = [];

      // Create components first so they can be referenced by instances
      for (const nodeData of componentNodes) {
        if (nodeData && typeof nodeData === 'object') {
          const node = await this.nodeRepository.createNode(nodeData);
          if (node) {
            createdNodes.push(node);
          }
        }
      }

      // Then create other nodes (including instances)
      for (const nodeData of otherNodes) {
        if (nodeData && typeof nodeData === 'object') {
          const node = await this.nodeRepository.createNode(nodeData);
          if (node) {
            createdNodes.push(node);
          }
        }
      }

      if (createdNodes.length === 0) {
        throw new Error('No nodes were created from the AI-generated data.');
      }

      if (createdNodes.length > 1) {
        this.arrangeNodesHorizontally(createdNodes);
      }

      this.positionNewDesign(createdNodes, designBounds);

      this.nodeRepository.setSelection(createdNodes);
      this.nodeRepository.focusOnNodes(createdNodes);

      const message = `✅ Imported ${createdNodes.length} AI-generated page${createdNodes.length > 1 ? 's' : ''}!`;
      this.notificationPort.notify(message);

      return {
        success: true,
        pagesCreated: createdNodes.length,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during AI import';
      return {
        success: false,
        pagesCreated: 0,
        error: errorMessage,
      };
    }
  }

  /**
   * Sort nodes by layer index to maintain z-order
   */
  private sortByLayerIndex(nodes: DesignNode[]): DesignNode[] {
    return [...nodes].sort((a, b) => {
      const indexA = a._layerIndex ?? 0;
      const indexB = b._layerIndex ?? 0;
      return indexA - indexB;
    });
  }

  private arrangeNodesHorizontally(nodes: SceneNode[]): void {
    let currentX = 0;

    for (const node of nodes) {
      node.x = currentX;
      node.y = 0;

      if ('width' in node && typeof node.width === 'number') {
        currentX += node.width + ImportAIDesignUseCase.PAGE_SPACING;
      }
    }
  }


  private async getExistingDesignPositions(): Promise<Array<{ x: number, y: number, width: number, height: number }>> {
    try {
      const page = figma.currentPage;
      const positions = [];

      for (const child of page.children) {
        if (child.type === 'FRAME' || child.type === 'GROUP' ||
          child.type === 'COMPONENT' || child.type === 'INSTANCE') {
          positions.push({
            x: child.x,
            y: child.y,
            width: child.width,
            height: child.height
          });
        }
      }

      return positions;
    } catch (error) {
      console.warn('Could not get existing design positions:', error);
      return [];
    }
  }

  private calculateAvailableSpace(existingDesigns: Array<{ x: number, y: number, width: number, height: number }>): {
    startX: number;
    startY: number;
    gridWidth: number;
    gridHeight: number;
  } {
    if (existingDesigns.length === 0) {
      return {
        startX: 100,
        startY: 100,
        gridWidth: 4,
        gridHeight: 4
      };
    }

    let maxX = 0;
    let maxY = 0;

    for (const design of existingDesigns) {
      const rightEdge = design.x + design.width;
      const bottomEdge = design.y + design.height;

      if (rightEdge > maxX) maxX = rightEdge;
      if (bottomEdge > maxY) maxY = bottomEdge;
    }

    const gridSpacing = 400;
    const pagePadding = 100;

    const newX = maxX + pagePadding;

    const viewportWidth = 2000;
    if (newX > viewportWidth) {
      return {
        startX: pagePadding,
        startY: maxY + pagePadding,
        gridWidth: 4,
        gridHeight: 4
      };
    }

    return {
      startX: newX,
      startY: pagePadding,
      gridWidth: 4,
      gridHeight: 4
    };
  }


  private positionNewDesign(nodes: SceneNode[], bounds: { startX: number, startY: number, gridWidth: number, gridHeight: number }): void {
    if (nodes.length === 0) return;

    const offsetX = bounds.startX - nodes[0].x;
    const offsetY = bounds.startY - nodes[0].y;

    for (const node of nodes) {
      node.x += offsetX;
      node.y += offsetY;
    }
  }
}