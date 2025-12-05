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
  ) {}

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

      // Arrange multiple pages side by side
      if (createdNodes.length > 1) {
        this.arrangeNodesHorizontally(createdNodes);
      }

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
}
