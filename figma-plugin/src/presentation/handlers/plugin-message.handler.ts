import { PluginMessage, IUIPort } from '../../domain/interfaces/ui-port.interface';
import { INotificationPort } from '../../domain/interfaces/notification-port.interface';
import {
  ImportDesignUseCase,
  ImportAIDesignUseCase,
  ExportSelectedUseCase,
  ExportAllUseCase,
} from '../../application/use-cases';
import { ApiConfig } from '../../shared/constants';
import { GetUserInfoUseCase } from '@application/use-cases/getUserInfoUseCase';

/**
 * Handler for messages received from the UI
 */
export class PluginMessageHandler {
  private conversationHistory: Array<{ role: string; content: string }> = [];

  constructor(
    private readonly uiPort: IUIPort,
    private readonly notificationPort: INotificationPort,
    private readonly importDesignUseCase: ImportDesignUseCase,
    private readonly importAIDesignUseCase: ImportAIDesignUseCase,
    private readonly exportSelectedUseCase: ExportSelectedUseCase,
    private readonly exportAllUseCase: ExportAllUseCase,
    private readonly getUserInfoUseCase: GetUserInfoUseCase
  ) { }

  initialize(): void {
    this.uiPort.onMessage((message: PluginMessage) => this.handleMessage(message));
  }

  private async handleMessage(message: PluginMessage): Promise<void> {
    console.log('📨 Plugin received:', message.type);

    console.log("Plugin Message with Data", message);

    switch (message.type) {
      case 'resize-window':
        if ('size' in message) {
          figma.ui.resize(message.size.w, message.size.h);
          // Save size for persistence
          figma.clientStorage.setAsync('pluginSize', message.size).catch(() => {});
        }
        break;
      case 'ai-chat-message':
        if (message.message !== undefined) {
          await this.handleAIChatMessage(message.message, message.history, message.model, message.designSystemId);
        }
        break;

      case 'request-layer-selection-for-edit':
        await this.handleRequestLayerSelectionForEdit();
        break;

      case 'request-layer-selection-for-reference':
        await this.handleRequestLayerSelectionForReference();
        break;

      case 'ai-edit-design':
        if (message.message !== undefined && message.layerJson !== undefined) {
          await this.handleAIEditDesign(message.message, message.history, message.layerJson, message.model, message.designSystemId);
        }
        break;

      case 'ai-generate-based-on-existing':
        if (message.message !== undefined && message.referenceJson !== undefined) {
          console.log('🎨 Handling generate-based-on-existing request');
          await this.handleGenerateBasedOnExisting(
            message.message,
            message.history,
            message.referenceJson,
            message.model
          );
        }
        break;

      case 'import-design-from-chat':
        await this.handleImportDesignFromChat(message.designData, message.buttonId);
        break;

      case 'import-edited-design':
        await this.handleImportEditedDesign(message.designData, message.buttonId);
        break;

      case 'import-based-on-existing-design':
        await this.handleImportBasedOnExistingDesign(message.designData, message.buttonId);
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

      case 'import-version':
        await this.handleImportVersion(message.designJson);
        break;

      case 'GET_HEADERS':
        const headers = await this.getUserInfoUseCase.execute();
        figma.ui.postMessage({
          type: 'HEADERS_RESPONSE',
          headers: headers
        });
        break;

      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  // ==================== LAYER SELECTION FOR REFERENCE MODE ====================
  private async handleRequestLayerSelectionForReference(): Promise<void> {
    try {
      const selection = figma.currentPage.selection;

      if (selection.length === 0) {
        this.uiPort.postMessage({
          type: 'no-layer-selected'
        });
        this.notificationPort.notify('⚠️ Please select a reference layer');
        return;
      }

      if (selection.length > 1) {
        this.uiPort.postMessage({
          type: 'no-layer-selected'
        });
        this.notificationPort.notify('⚠️ Please select only one reference layer');
        return;
      }

      const selectedNode = selection[0];
      const exportResult = await this.exportSelectedUseCase.execute();

      if (!exportResult.success || exportResult.nodes.length === 0) {
        throw new Error('Failed to export selected layer');
      }

      this.uiPort.postMessage({
        type: 'layer-selected-for-reference',
        layerName: selectedNode.name,
        layerJson: exportResult.nodes[0]
      });

      this.notificationPort.notify(`✅ Reference layer "${selectedNode.name}" selected`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to select layer';
      this.notificationPort.notifyError(errorMessage);
      this.uiPort.postMessage({
        type: 'no-layer-selected'
      });
    }
  }

  // ==================== LAYER SELECTION FOR EDIT MODE ====================
  private async handleRequestLayerSelectionForEdit(): Promise<void> {
    try {
      const selection = figma.currentPage.selection;

      if (selection.length === 0) {
        this.uiPort.postMessage({
          type: 'no-layer-selected'
        });
        this.notificationPort.notify('⚠️ Please select a layer to edit');
        return;
      }

      if (selection.length > 1) {
        this.uiPort.postMessage({
          type: 'no-layer-selected'
        });
        this.notificationPort.notify('⚠️ Please select only one layer to edit');
        return;
      }

      const selectedNode = selection[0];
      const exportResult = await this.exportSelectedUseCase.execute();

      if (!exportResult.success || exportResult.nodes.length === 0) {
        throw new Error('Failed to export selected layer');
      }

      this.uiPort.postMessage({
        type: 'layer-selected-for-edit',
        layerName: selectedNode.name,
        layerJson: exportResult.nodes[0]
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to select layer';
      this.notificationPort.notifyError(errorMessage);
      this.uiPort.postMessage({
        type: 'no-layer-selected'
      });
    }
  }

  // ==================== AI EDIT DESIGN ====================
  private async handleAIEditDesign(
    userMessage: string,
    history: Array<{ role: string; content: string }> | undefined,
    layerJson: any,
    model?: string,
    designSystemId?: string
  ): Promise<void> {
    try {
      if (history && history.length > 0) {
        this.conversationHistory = history;
      }

      const selectedModel = model || 'mistralai/devstral-2512:free';

      const response = await fetch(`${ApiConfig.BASE_URL}/api/designs/edit-with-ai`, {
        method: 'POST',
        headers: await this.getUserInfoUseCase.execute(),
        body: JSON.stringify({
          message: userMessage,
          history: this.conversationHistory,
          currentDesign: layerJson,
          modelId: selectedModel,
          designSystemId: designSystemId
        })
      });

      if (!response.ok) {
        let errorMessage = `Server error: ${response.status}`;
        try {
          const errorResult = await response.json();
          errorMessage = errorResult.message || errorResult.error || errorMessage;
        } catch (e) { }
        throw new Error(errorMessage);
      }

      const result = await response.json();

      this.uiPort.postMessage({
        type: 'ai-edit-response',
        message: result.message,
        designData: result.design,
        previewHtml: result.previewHtml,
        cost: result.cost ? {
          inputCost: result.cost.inputCost,
          outputCost: result.cost.outputCost,
          totalCost: result.cost.totalCost,
          inputTokens: result.cost.inputTokens,
          outputTokens: result.cost.outputTokens
        } : undefined
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
      this.uiPort.postMessage({
        type: 'ai-edit-error',
        error: errorMessage
      });
    }
  }

  // ==================== GENERATE BASED ON EXISTING ====================
  private async handleGenerateBasedOnExisting(
    userMessage: string,
    history: Array<{ role: string; content: string }> | undefined,
    referenceJson: any,
    model?: string
  ): Promise<void> {
    try {
      let conversationHistory: Array<{ role: string; content: string }> = [];

      if (history && history.length > 0) {
        conversationHistory = history;
      }

      const selectedModel = model || 'mistralai/devstral-2512:free';

      console.log("🎨 Generating design based on existing reference");
      console.log("📍 Endpoint: /api/designs/generate-based-on-existing");

      const response = await fetch(`${ApiConfig.BASE_URL}/api/designs/generate-based-on-existing`, {
        method: 'POST',
        headers: await this.getUserInfoUseCase.execute(),
        body: JSON.stringify({
          message: userMessage,
          history: conversationHistory,
          referenceDesign: referenceJson,
          modelId: selectedModel
        })
      });

      if (!response.ok) {
        let errorMessage = `Server error: ${response.status}`;
        try {
          const errorResult = await response.json();
          errorMessage = errorResult.message || errorResult.error || errorMessage;
        } catch (e) { }
        throw new Error(errorMessage);
      }

      const result = await response.json();

      console.log("✅ Received response from generate-based-on-existing");

      this.uiPort.postMessage({
        type: 'ai-based-on-existing-response',
        message: result.message,
        designData: result.design,
        previewHtml: result.previewHtml,
        cost: result.cost ? {
          inputCost: result.cost.inputCost,
          outputCost: result.cost.outputCost,
          totalCost: result.cost.totalCost,
          inputTokens: result.cost.inputTokens,
          outputTokens: result.cost.outputTokens
        } : undefined
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
      console.error("❌ Error in handleGenerateBasedOnExisting:", errorMessage);
      this.uiPort.postMessage({
        type: 'ai-based-on-existing-error',
        error: errorMessage
      });
    }
  }

  // ==================== AI CHAT FUNCTIONS ====================
  private async handleAIChatMessage(
    userMessage: string,
    history?: Array<{ role: string; content: string }>,
    model?: string,
    designSystemId?: string
  ): Promise<void> {
    try {
      if (history && history.length > 0) {
        this.conversationHistory = history;
      }

      const selectedModel = model || 'mistralai/devstral-2512:free';

      const response = await fetch(`${ApiConfig.BASE_URL}/api/designs/generate-from-conversation`, {
        method: 'POST',
        headers: await this.getUserInfoUseCase.execute(),
        body: JSON.stringify({
          message: userMessage,
          history: this.conversationHistory,
          modelId: selectedModel,
          designSystemId: designSystemId
        })
      });

      if (!response.ok) {
        let errorMessage = `Server error: ${response.status}`;
        try {
          const errorResult = await response.json();
          errorMessage = errorResult.message || errorResult.error || errorMessage;
        } catch (e) { }
        throw new Error(errorMessage);
      }

      const result = await response.json();

      this.uiPort.postMessage({
        type: 'ai-chat-response',
        message: result.message,
        designData: result.design,
        previewHtml: result.previewHtml,
        cost: result.cost ? {
          inputCost: result.cost.inputCost,
          outputCost: result.cost.outputCost,
          totalCost: result.cost.totalCost,
          inputTokens: result.cost.inputTokens,
          outputTokens: result.cost.outputTokens
        } : undefined
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
      this.uiPort.postMessage({
        type: 'ai-chat-error',
        error: errorMessage
      });
    }
  }

  // ==================== IMPORT HANDLERS ====================
  private async handleImportDesignFromChat(designData: unknown, buttonId: any): Promise<void> {
    const result = await this.importAIDesignUseCase.execute(designData);

    if (result.success) {
      this.uiPort.postMessage({ type: 'import-success', buttonId: buttonId });
      this.notificationPort.notify('✅ Design imported successfully!');
    } else {
      this.notificationPort.notifyError(result.error || 'Import failed');
      this.uiPort.postMessage({
        type: 'import-error',
        error: result.error || 'Import failed',
        buttonId: buttonId
      });
    }
  }

  private async handleImportEditedDesign(designData: unknown, buttonId: any): Promise<void> {
    const selection = figma.currentPage.selection;
    const oldNode = selection.length === 1 ? selection[0] : null;

    const result = await this.importAIDesignUseCase.execute(designData);

    if (result.success) {
      this.notificationPort.notify('✅ Edited design imported successfully!');
      
      this.uiPort.postMessage({ type: 'import-success', buttonId: buttonId });

      try {
        const exportResult = await this.exportSelectedUseCase.execute();
        if (exportResult.success && exportResult.nodes.length > 0) {
          this.uiPort.postMessage({
            type: 'design-updated',
            layerJson: exportResult.nodes[0],
            buttonId: buttonId
          });
        }
      } catch (error) {
        console.error('Failed to export updated design:', error);
      }
    } else {
      this.notificationPort.notifyError(result.error || 'Import failed');
      this.uiPort.postMessage({
        type: 'import-error',
        error: result.error || 'Import failed',
        buttonId: buttonId
      });
    }
}

  private async handleImportBasedOnExistingDesign(designData: unknown, buttonId: any): Promise<void> {
    const result = await this.importAIDesignUseCase.execute(designData);

    if (result.success) {
      this.uiPort.postMessage({
        type: 'import-success',
        buttonId: buttonId
      });
      this.notificationPort.notify('✅ New design imported successfully!');
    } else {
      this.notificationPort.notifyError(result.error || 'Import failed');
      this.uiPort.postMessage({
        type: 'import-error',
        error: result.error || 'Import failed',
        buttonId: buttonId
      });
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

  // ==================== EXPORT HANDLERS ====================
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