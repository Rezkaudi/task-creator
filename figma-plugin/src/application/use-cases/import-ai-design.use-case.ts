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
      const nodes = this.parser.parseAIResponse(rawData);

      if (nodes.length === 0) {
        throw new Error('Invalid AI design data format.');
      }

      const createdNodes = await this.createNodes(nodes);

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

  private async createNodes(nodes: DesignNode[]): Promise<SceneNode[]> {
    const createdNodes: SceneNode[] = [];

    for (const nodeData of nodes) {
      if (nodeData && typeof nodeData === 'object') {
        const node = await this.nodeRepository.createNode(nodeData);
        if (node) {
          createdNodes.push(node);
        }
      }
    }

    return createdNodes;
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
