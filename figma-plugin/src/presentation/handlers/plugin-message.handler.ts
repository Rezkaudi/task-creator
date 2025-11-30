import { PluginMessage, IUIPort } from '../../domain/interfaces/ui-port.interface';
import { INotificationPort } from '../../domain/interfaces/notification-port.interface';
import {
  ImportDesignUseCase,
  ImportAIDesignUseCase,
  ExportSelectedUseCase,
  ExportAllUseCase,
} from '../../application/use-cases';

/**
 * Handler for messages received from the UI
 */
export class PluginMessageHandler {
  constructor(
    private readonly uiPort: IUIPort,
    private readonly notificationPort: INotificationPort,
    private readonly importDesignUseCase: ImportDesignUseCase,
    private readonly importAIDesignUseCase: ImportAIDesignUseCase,
    private readonly exportSelectedUseCase: ExportSelectedUseCase,
    private readonly exportAllUseCase: ExportAllUseCase
  ) { }

  /**
   * Initialize the message handler
   */
  initialize(): void {
    this.uiPort.onMessage((message) => this.handleMessage(message));
  }

  private async handleMessage(message: PluginMessage): Promise<void> {
    switch (message.type) {
      case 'design-generated-from-ai':
        await this.handleAIDesignImport(message.designData);
        break;

      case 'generate-design-from-text':
        await this.handleGenerateFromText(message.prompt);
        break;

      case 'import-design':
        await this.handleImportDesign(message.designData);
        break;

      case 'export-selected':
        await this.handleExportSelected();
        break;

      case 'export-all':
        await this.handleExportAll();
        break;

      case 'get-selection-info':
        // Selection info is handled by SelectionChangeHandler
        break;

      case 'cancel':
        this.uiPort.close();
        break;

      // Version management is handled directly in UI (HTTP calls)
      // These are just for importing version JSON to canvas
      case 'import-version':
        await this.handleImportVersion(message.designJson);
        break;

      default:
        console.warn('Unknown message type:', (message as any).type);
    }
  }

  private async handleAIDesignImport(designData: unknown): Promise<void> {
    const result = await this.importAIDesignUseCase.execute(designData);

    if (result.success) {
      this.uiPort.postMessage({ type: 'import-success' });
    } else {
      this.notificationPort.notifyError(result.error || 'Import failed');
      this.uiPort.postMessage({
        type: 'import-error',
        error: result.error || 'Import failed',
      });
    }
  }

  private async handleGenerateFromText(prompt: string): Promise<void> {
    // Forward to UI to call Claude API
    this.uiPort.postMessage({
      type: 'call-backend-for-claude',
      prompt,
    });
  }

  private async handleImportDesign(designData: unknown): Promise<void> {
    const result = await this.importDesignUseCase.execute(designData);

    if (result.success) {
      this.uiPort.postMessage({ type: 'import-success' });
    } else {
      this.notificationPort.notifyError(result.error || 'Import failed');
      this.uiPort.postMessage({
        type: 'import-error',
        error: result.error || 'Import failed',
      });
    }
  }

  private async handleExportSelected(): Promise<void> {
    const result = await this.exportSelectedUseCase.execute();

    if (result.success) {
      this.uiPort.postMessage({
        type: 'export-success',
        data: result.nodes,
        nodeCount: result.nodeCount,
      });
    } else {
      this.notificationPort.notifyError(result.error || 'Export failed');
      this.uiPort.postMessage({
        type: 'export-error',
        error: result.error || 'Export failed',
      });
    }
  }

  private async handleExportAll(): Promise<void> {
    const result = await this.exportAllUseCase.execute();

    if (result.success) {
      this.uiPort.postMessage({
        type: 'export-success',
        data: result.nodes,
        nodeCount: result.nodeCount,
      });
    } else {
      this.notificationPort.notifyError(result.error || 'Export failed');
      this.uiPort.postMessage({
        type: 'export-error',
        error: result.error || 'Export failed',
      });
    }
  }

  private async handleImportVersion(designJson: unknown): Promise<void> {
    const result = await this.importDesignUseCase.execute(designJson);

    if (result.success) {
      this.notificationPort.notify('✅ Version imported successfully!');
      this.uiPort.postMessage({ type: 'import-success' });
    } else {
      this.notificationPort.notifyError(result.error || 'Import failed');
      this.uiPort.postMessage({
        type: 'import-error',
        error: result.error || 'Import failed',
      });
    }
  }
}
