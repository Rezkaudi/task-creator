import { DesignNode } from '../../domain/entities/design-node';
import { INodeRepository } from '../../domain/interfaces/node-repository.interface';
import { INotificationPort } from '../../domain/interfaces/notification-port.interface';
import { NodeCounter } from '../services/node-counter.service';

/**
 * Export result
 */
export interface ExportAllResult {
  readonly success: boolean;
  readonly nodes: DesignNode[];
  readonly nodeCount: number;
  readonly error?: string;
}

/**
 * Use case for exporting all nodes from current page
 */
export class ExportAllUseCase {
  constructor(
    private readonly nodeRepository: INodeRepository,
    private readonly notificationPort: INotificationPort,
    private readonly nodeCounter: NodeCounter
  ) {}

  /**
   * Execute the export all nodes use case
   */
  async execute(): Promise<ExportAllResult> {
    try {
      const exportedNodes = await this.nodeRepository.exportAll();

      if (exportedNodes.length === 0) {
        throw new Error('No exportable layers found on page.');
      }

      const totalNodeCount = this.nodeCounter.countTotal(exportedNodes);

      const message = `✅ Exported ${exportedNodes.length} layer${exportedNodes.length !== 1 ? 's' : ''} (${totalNodeCount} total nodes) from page!`;
      this.notificationPort.notify(message);

      return {
        success: true,
        nodes: exportedNodes,
        nodeCount: totalNodeCount,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during export';
      return {
        success: false,
        nodes: [],
        nodeCount: 0,
        error: errorMessage,
      };
    }
  }
}
