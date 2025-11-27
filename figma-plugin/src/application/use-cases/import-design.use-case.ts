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
      const nodes = this.parser.parse(rawData);

      if (nodes.length === 0) {
        throw new Error('No valid design data found in the provided input.');
      }

      const createdNodes = await this.createNodes(nodes);

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

  private async createNodes(nodes: DesignNode[]): Promise<SceneNode[]> {
    const createdNodes: SceneNode[] = [];

    for (const nodeData of nodes) {
      const node = await this.nodeRepository.createNode(nodeData);
      if (node) {
        createdNodes.push(node);
      }
    }

    return createdNodes;
  }
}
