import { DesignNode } from '../../domain/entities/design-node';
import { INodeRepository } from '../../domain/interfaces/node-repository.interface';
import { INotificationPort } from '../../domain/interfaces/notification-port.interface';
import { NodeCounter } from '../services/node-counter.service';

/**
 * Export result
 */
export interface ExportResult {
  readonly success: boolean;
  readonly nodes: DesignNode[];
  readonly nodeCount: number;
  readonly error?: string;
}

/**
 * Use case for exporting selected nodes
 */
export class ExportSelectedUseCase {
  constructor(
    private readonly nodeRepository: INodeRepository,
    private readonly notificationPort: INotificationPort,
    private readonly nodeCounter: NodeCounter
  ) {}

  /**
   * Execute the export selected nodes use case
   */
  async execute(): Promise<ExportResult> {
    try {
      const selection = this.nodeRepository.getSelectionInfo();

      if (selection.count === 0) {
        throw new Error('No layers selected. Please select at least one layer to export.');
      }

      const exportedNodes = await this.nodeRepository.exportSelected();

      if (exportedNodes.length === 0) {
        throw new Error('No exportable layers found in selection.');
      }

      const totalNodeCount = this.nodeCounter.countTotal(exportedNodes);

      const message = `✅ Exported ${exportedNodes.length} layer${exportedNodes.length !== 1 ? 's' : ''} (${totalNodeCount} total nodes)!`;
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
