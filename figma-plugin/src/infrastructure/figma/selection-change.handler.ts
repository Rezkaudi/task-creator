import { INodeRepository } from '../../domain/interfaces/node-repository.interface';
import { IUIPort } from '../../domain/interfaces/ui-port.interface';

/**
 * Handler for Figma selection change events
 */
export class SelectionChangeHandler {
  constructor(
    private readonly nodeRepository: INodeRepository,
    private readonly uiPort: IUIPort
  ) {}

  /**
   * Initialize selection change listener
   */
  initialize(): void {
    figma.on('selectionchange', () => this.handleSelectionChange());
    // Send initial selection state
    this.handleSelectionChange();
  }

  private handleSelectionChange(): void {
    const selectionInfo = this.nodeRepository.getSelectionInfo();
    this.uiPort.postMessage({
      type: 'selection-changed',
      selection: selectionInfo,
    });
  }
}
