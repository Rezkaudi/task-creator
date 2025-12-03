import { PluginMessage, IUIPort } from '../../domain/interfaces/ui-port.interface';
import { INotificationPort } from '../../domain/interfaces/notification-port.interface';
import {
  ImportDesignUseCase,
  ImportAIDesignUseCase,
  ExportSelectedUseCase,
  ExportAllUseCase,
} from '../../application/use-cases';

interface BackendChatResponse {
  success: boolean;
  message: string;
  design: any;
  previewHtml?: string | null;
}

export class PluginMessageHandler {
  private conversationHistory: Array<{ role: string; content: string }> = [];

  constructor(
    private readonly uiPort: IUIPort,
    private readonly notificationPort: INotificationPort,
    private readonly importDesignUseCase: ImportDesignUseCase,
    private readonly importAIDesignUseCase: ImportAIDesignUseCase,
    private readonly exportSelectedUseCase: ExportSelectedUseCase,
    private readonly exportAllUseCase: ExportAllUseCase
  ) {}

  initialize(): void {
    this.uiPort.onMessage((message: PluginMessage) => this.handleMessage(message));
  }

  private async handleMessage(message: PluginMessage): Promise<void> {
    console.log('📨 Plugin received:', message.type);
    
    switch (message.type) {
      case 'ai-chat-message':
        if (message.message !== undefined) {
          await this.handleAIChatMessage(message.message, message.history);
        }
        break;

      case 'import-design-from-chat':
        await this.handleImportDesignFromChat(message.designData);
        break;

      case 'design-generated-from-ai':
        await this.handleAIDesignImport(message.designData);
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
       
        break;

      case 'cancel':
        this.uiPort.close();
        break;

      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  // ==================== AI CHAT FUNCTIONS ====================
  private async handleAIChatMessage(
    userMessage: string,
    history?: Array<{ role: string; content: string }>
  ): Promise<void> {
    try {
      if (history && history.length > 0) {
        this.conversationHistory = history;
      }

      const BACKEND_URL = 'http://localhost:5000/api/designs/generate-from-conversation';
      
      const fetchPromise = fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: this.conversationHistory
        })
      });

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout after 240 seconds')), 240000);
      });

      const response = await Promise.race([fetchPromise, timeoutPromise]);

      if (!response.ok) {
        let errorMessage = `Server error: ${response.status}`;
        try {
          const errorResult = await response.json();
          errorMessage = errorResult.message || errorResult.error || errorMessage;
        } catch (e) {
          // Use default error message
        }
        throw new Error(errorMessage);
      }

      const result: BackendChatResponse = await response.json();

      this.uiPort.postMessage({
        type: 'ai-chat-response', 
        message: result.message,
        designData: result.design,
        previewHtml: result.previewHtml
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
      this.uiPort.postMessage({
        type: 'ai-chat-error', 
        error: errorMessage
      });
    }
  }

  private async handleImportDesignFromChat(designData: unknown): Promise<void> {
    const result = await this.importAIDesignUseCase.execute(designData);

    if (result.success) {
      this.uiPort.postMessage({ type: 'import-success' });
      this.notificationPort.notify('✅ Design imported successfully!');
    } else {
      this.notificationPort.notifyError(result.error || 'Import failed');
      this.uiPort.postMessage({
        type: 'import-error',
        error: result.error || 'Import failed',
      });
    }
  }

  // ==================== OLD FUNCTIONS THAT WORKED ====================
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
}