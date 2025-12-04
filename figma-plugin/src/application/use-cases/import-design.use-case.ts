import { DesignNode } from '../../domain/entities/design-node';
import { INodeRepository } from '../../domain/interfaces/node-repository.interface';
import { INotificationPort } from '../../domain/interfaces/notification-port.interface';
import { DesignDataParser } from '../services/design-data-parser.service';

/**
 * Import result
 */
export interface ImportResult {
  readonly success: boolean;
  readonly nodesCreated: number;
  readonly error?: string;
}

/**
 * Use case for importing designs into Figma
 * Handles comprehensive lossless import of all node types
 */
export class ImportDesignUseCase {
  constructor(
    private readonly nodeRepository: INodeRepository,
    private readonly notificationPort: INotificationPort,
    private readonly parser: DesignDataParser
  ) {}

  /**
   * Execute the import design use case
   */
  async execute(rawData: unknown): Promise<ImportResult> {
    try {
      // Clear component registry before import
      this.nodeRepository.clearComponentRegistry();

      const nodes = this.parser.parse(rawData);

      if (nodes.length === 0) {
        throw new Error('No valid design data found in the provided input.');
      }

      // Sort nodes by layer index if available to maintain z-order
      const sortedNodes = this.sortByLayerIndex(nodes);

      // First pass: Create all components to register them
      const componentNodes = sortedNodes.filter(n => n.type === 'COMPONENT' || n.type === 'COMPONENT_SET');
      const otherNodes = sortedNodes.filter(n => n.type !== 'COMPONENT' && n.type !== 'COMPONENT_SET');

      const createdNodes: SceneNode[] = [];

      // Create components first so they can be referenced by instances
      for (const nodeData of componentNodes) {
        const node = await this.nodeRepository.createNode(nodeData);
        if (node) {
          createdNodes.push(node);
        }
      }

      // Then create other nodes (including instances)
      for (const nodeData of otherNodes) {
        const node = await this.nodeRepository.createNode(nodeData);
        if (node) {
          createdNodes.push(node);
        }
      }

      if (createdNodes.length === 0) {
        throw new Error('No nodes were created from the provided data.');
      }

      this.nodeRepository.setSelection(createdNodes);
      this.nodeRepository.focusOnNodes(createdNodes);

      const message = `✅ Imported ${createdNodes.length} design element${createdNodes.length > 1 ? 's' : ''}!`;
      this.notificationPort.notify(message);

      return {
        success: true,
        nodesCreated: createdNodes.length,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during import';
      return {
        success: false,
        nodesCreated: 0,
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
}
