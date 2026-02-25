import { PluginMessage, IUIPort } from '../../domain/interfaces/ui-port.interface';
import { INotificationPort } from '../../domain/interfaces/notification-port.interface';
import { FrameInfo, PrototypeConnection } from '../../domain/entities/prototype-connection.entity';
import {
  ImportDesignUseCase,
  ImportAIDesignUseCase,
  ExportSelectedUseCase,
  ExportAllUseCase,
} from '../../application/use-cases';
import { ApiConfig, defaultModel } from '../../shared/constants/plugin-config.js';
import { GetUserInfoUseCase } from '@application/use-cases/getUserInfoUseCase';
import { errorReporter } from '../../infrastructure/services/error-reporter.service';
import { ImageOptimizerService, ImageReference } from '../../infrastructure/services/plugin-image-optimizer.service'; // ← NEW

/**
 * Handler for messages received from the UI
 */
export class PluginMessageHandler {
  private conversationHistory: Array<{ role: string; content: string }> = [];
  private imageOptimizer = new ImageOptimizerService(); // ← NEW

  // Storage for image references during AI operations
  private imageReferencesStore: Map<string, ImageReference[]> = new Map(); // ← NEW

  constructor(
    private readonly uiPort: IUIPort,
    private readonly notificationPort: INotificationPort,
    private readonly importDesignUseCase: ImportDesignUseCase,
    private readonly importAIDesignUseCase: ImportAIDesignUseCase,
    private readonly exportSelectedUseCase: ExportSelectedUseCase,
    private readonly exportAllUseCase: ExportAllUseCase,
    private readonly getUserInfoUseCase: GetUserInfoUseCase
  ) { }

  // ... (keep all other methods the same until handleAIEditDesign) ...

  initialize(): void {
    this.uiPort.onMessage((message: PluginMessage) => this.handleMessage(message));
    this.initializeErrorReporter();
  }

  private async initializeErrorReporter(): Promise<void> {
    try {
      const headers = await this.getUserInfoUseCase.execute();
      errorReporter.setHeaders(headers);
    } catch (error) {
      console.warn('Failed to initialize error reporter headers:', error);
    }
  }

  private async handleMessage(message: PluginMessage): Promise<void> {
    if (message.type !== 'resize-window') {
      console.log('📨 Plugin received:', message.type);
      console.log('Full message data:', message);
    }

    try {
      switch (message.type) {
        case 'resize-window':
          if ('size' in message) {
            figma.ui.resize(message.size.w, message.size.h);
            figma.clientStorage.setAsync('pluginSize', message.size).catch(() => { });
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
          if (message.message !== undefined) {
            let editLayerJson = message.layerJson;
            // If only layerId is provided, fetch and export the node
            if (!editLayerJson && message.layerId) {
              editLayerJson = await this.exportNodeById(message.layerId);
            }
            if (editLayerJson) {
              await this.handleAIEditDesign(message.message, message.history, editLayerJson, message.model, message.designSystemId);
            }
          }
          break;
        case 'ai-generate-based-on-existing':
          if (message.message !== undefined) {
            let refJson = message.referenceJson;
            // If only referenceId is provided, fetch and export the node
            if (!refJson && message.referenceId) {
              refJson = await this.exportNodeById(message.referenceId);
            }
            if (refJson) {
              console.log('Handling generate-based-on-existing request');
              await this.handleGenerateBasedOnExisting(
                message.message,
                message.history,
                refJson,
                message.model
              );
            }
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
        case 'import-ui-library-component':
          await this.handleImportUILibraryComponent(message.designJson);
          break;
        case 'GET_HEADERS':
          const headers = await this.getUserInfoUseCase.execute();
          figma.ui.postMessage({
            type: 'HEADERS_RESPONSE',
            headers: headers
          });
          break;

        case 'SAVE_AUTH_TOKEN':
          if (message.token) {
            await figma.clientStorage.setAsync('rio_auth_token', message.token);
          }
          break;

        case 'GET_AUTH_TOKEN':
          try {
            const token = await figma.clientStorage.getAsync('rio_auth_token');
            figma.ui.postMessage({
              type: 'AUTH_TOKEN_RESPONSE',
              token: token
            });
          } catch (e) {
            console.warn('Failed to retrieve auth token:', e);
            figma.ui.postMessage({
              type: 'AUTH_TOKEN_RESPONSE',
              token: null
            });
          }
          break;

        case 'CLEAR_AUTH_TOKEN':
          await figma.clientStorage.deleteAsync('rio_auth_token');
          break;

        case 'OPEN_EXTERNAL_URL':
          // Handled by UI window.open
          break;
        case 'REPORT_ERROR':
          await this.handleReportError((message as any).errorData);
          break;
        // ==================== PROTOTYPE HANDLERS ====================
        case 'get-frames-for-prototype':
          await this.handleGetFramesForPrototype();
          break;
        case 'generate-prototype-connections':
          {
            let protoFrames = message.frames;
            // If only frameIds provided, fetch the frame info
            if (!protoFrames && message.frameIds) {
              protoFrames = await this.getFrameInfoByIds(message.frameIds);
            }
            if (protoFrames && protoFrames.length > 0) {
              await this.handleGeneratePrototypeConnections(protoFrames, message.modelId);
            }
          }
          break;
        case 'apply-prototype-connections':
          if (message.connections) {
            await this.handleApplyPrototypeConnections(message.connections);
          }
          break;
        case 'generate-preview-image':
          await this.handleGeneratePreviewImage(message.requestId, message.maxWidth);
          break;
        case 'generate-preview-from-design-data':
          await this.handleGeneratePreviewFromDesignData(message.requestId, message.designData, message.maxWidth);
          break;
        default:
          console.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      errorReporter.reportErrorAsync(error as Error, {
        componentName: 'PluginMessageHandler',
        actionType: `handleMessage:${message.type}`,
      });
      throw error;
    }
  }

  // ==================== PROTOTYPE HANDLERS ====================

  private async handleGetFramesForPrototype(): Promise<void> {
    try {
      const nodeRepository = new (await import('../../infrastructure/figma/figma-node.repository')).FigmaNodeRepository();
      const frames = await nodeRepository.getFramesWithInteractiveElements();

      this.uiPort.postMessage({
        type: 'frames-loaded',
        frames
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load frames';
      this.uiPort.postMessage({
        type: 'frames-load-error',
        error: errorMessage
      });

      errorReporter.reportErrorAsync(error as Error, {
        componentName: 'PluginMessageHandler',
        actionType: 'handleGetFramesForPrototype'
      });
    }
  }

  private async handleGeneratePrototypeConnections(
    frames: FrameInfo[],
    modelId?: string
  ): Promise<void> {
    try {
      const response = await fetch(`${ApiConfig.BASE_URL}/api/designs/generate-prototype`, {
        method: 'POST',
        headers: await this.getUserInfoUseCase.execute(),
        body: JSON.stringify({
          frames,
          modelId: modelId || defaultModel.id
        })
      });

      if (!response.ok) {
        let errorMessage = `Server error: ${response.status}`;
        try {
          const errorResult = await response.json();
          errorMessage = errorResult.message || errorResult.error || errorMessage;
        } catch (e) { }
        const error = new Error(errorMessage) as Error & { statusCode?: number };
        error.statusCode = response.status;
        throw error;
      }

      const result = await response.json();

      const points = result.points ? {
        deducted: result.points.deducted || 0,
        remaining: result.points.remaining || 0,
        wasFree: result.points.wasFree || false,
        hasPurchased: result.points.hasPurchased,
        subscription: result.points.subscription,
      } : undefined;

      this.uiPort.postMessage({
        type: 'prototype-connections-generated',
        connections: result.connections,
        reasoning: result.reasoning,
        cost: result.cost ? {
          inputCost: result.cost.inputCost,
          outputCost: result.cost.outputCost,
          totalCost: result.cost.totalCost,
          inputTokens: result.cost.inputTokens,
          outputTokens: result.cost.outputTokens
        } : undefined,
        points,
      });

      if (points) {
        this.uiPort.postMessage({
          type: 'points-updated',
          balance: points.remaining,
          hasPurchased: points.hasPurchased ?? true,
        });
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate connections';
      this.uiPort.postMessage({
        type: 'prototype-connections-error',
        error: errorMessage,
        statusCode: (error as any)?.statusCode,
      });

      errorReporter.reportErrorAsync(error as Error, {
        componentName: 'PluginMessageHandler',
        actionType: 'handleGeneratePrototypeConnections'
      });
    }
  }

  private async handleApplyPrototypeConnections(connections: PrototypeConnection[]): Promise<void> {
    try {
      const nodeRepository = new (await import('../../infrastructure/figma/figma-node.repository')).FigmaNodeRepository();
      const result = await nodeRepository.applyPrototypeConnections(connections);

      if (result.errors.length > 0) {
        console.warn('Some connections had errors:', result.errors);
      }

      this.uiPort.postMessage({
        type: 'prototype-applied',
        appliedCount: result.appliedCount
      });

      this.notificationPort.notify(`✅ Applied ${result.appliedCount} prototype connections!`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to apply connections';
      this.uiPort.postMessage({
        type: 'prototype-apply-error',
        error: errorMessage
      });

      errorReporter.reportErrorAsync(error as Error, {
        componentName: 'PluginMessageHandler',
        actionType: 'handleApplyPrototypeConnections'
      });
    }
  }

  // ==================== NODE FETCH HELPERS ====================

  /**
   * Fetch a node by ID, select it, and export its JSON representation
   */
  private async exportNodeById(nodeId: string): Promise<any | null> {
    try {
      const node = await figma.getNodeByIdAsync(nodeId);
      if (!node) {
        console.warn(`Node not found: ${nodeId}`);
        return null;
      }

      // Temporarily select the node so exportSelected works
      const previousSelection = [...figma.currentPage.selection];
      figma.currentPage.selection = [node as SceneNode];

      const exportResult = await this.exportSelectedUseCase.execute();

      // Restore previous selection
      figma.currentPage.selection = previousSelection;

      if (exportResult.success && exportResult.nodes.length > 0) {
        return exportResult.nodes[0];
      }
      return null;
    } catch (error) {
      console.error(`Failed to export node ${nodeId}:`, error);
      return null;
    }
  }

  /**
   * Get FrameInfo objects for an array of node IDs
   */
  private async getFrameInfoByIds(frameIds: string[]): Promise<FrameInfo[]> {
    try {
      const nodeRepository = new (await import('../../infrastructure/figma/figma-node.repository')).FigmaNodeRepository();
      const allFrames = await nodeRepository.getFramesWithInteractiveElements();
      const idSet = new Set(frameIds);
      return allFrames.filter(f => idSet.has(f.id));
    } catch (error) {
      console.error('Failed to get frame info by IDs:', error);
      return [];
    }
  }

  // ==================== ERROR REPORTING ====================
  private async handleReportError(errorData: any): Promise<void> {
    try {
      await errorReporter.reportError(errorData.error || errorData.message, {
        errorCode: errorData.errorCode,
        errorDetails: errorData.details,
        componentName: errorData.componentName,
        actionType: errorData.actionType,
      });
    } catch (error) {
      console.error('Failed to report error:', error);
    }
  }

  // ==================== LAYER SELECTION FOR REFERENCE MODE ====================
  private async handleRequestLayerSelectionForReference(): Promise<void> {
    try {
      const selection = figma.currentPage.selection;

      if (selection.length === 0) {
        this.uiPort.postMessage({ type: 'no-layer-selected' });
        this.notificationPort.notify('⚠️ Please select a reference layer');
        return;
      }

      if (selection.length > 1) {
        this.uiPort.postMessage({ type: 'no-layer-selected' });
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
      this.uiPort.postMessage({ type: 'no-layer-selected' });

      errorReporter.reportErrorAsync(error as Error, {
        componentName: 'PluginMessageHandler',
        actionType: 'handleRequestLayerSelectionForReference',
      });
    }
  }

  // ==================== LAYER SELECTION FOR EDIT MODE ====================
  private async handleRequestLayerSelectionForEdit(): Promise<void> {
    try {
      const selection = figma.currentPage.selection;

      if (selection.length === 0) {
        this.uiPort.postMessage({ type: 'no-layer-selected' });
        this.notificationPort.notify('⚠️ Please select a layer to edit');
        return;
      }

      if (selection.length > 1) {
        this.uiPort.postMessage({ type: 'no-layer-selected' });
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

      errorReporter.reportErrorAsync(error as Error, {
        componentName: 'PluginMessageHandler',
        actionType: 'handleRequestLayerSelectionForEdit',
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

      const selectedModel = model || defaultModel.id;

      // Strip images before sending to backend
      console.log('🔧 Plugin: Stripping images before sending to backend...');
      const originalSize = JSON.stringify(layerJson).length;

      const { cleanedDesign, imageReferences } = this.imageOptimizer.stripImages(layerJson);

      const optimizedSize = JSON.stringify(cleanedDesign).length;
      const reduction = ((1 - optimizedSize / originalSize) * 100).toFixed(1);

      console.log(`📊 Plugin: Size reduction: ${originalSize} → ${optimizedSize} chars (${reduction}% smaller)`);
      console.log(`📸 Plugin: Extracted ${imageReferences.length} images`);

      // Store image references for later restoration
      const requestKey = `edit_request_${Date.now()}`;
      this.imageReferencesStore.set(requestKey, imageReferences);

      const response = await fetch(`${ApiConfig.BASE_URL}/api/designs/edit-with-ai`, {
        method: 'POST',
        headers: await this.getUserInfoUseCase.execute(),
        body: JSON.stringify({
          message: userMessage,
          history: this.conversationHistory,
          currentDesign: cleanedDesign,
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
        const error = new Error(errorMessage) as Error & { statusCode?: number };
        error.statusCode = response.status;
        throw error;
      }

      const result = await response.json();

      // Restore images to AI response
      console.log('🔧 Plugin: Restoring images to AI response...');
      const restoredDesign = this.imageOptimizer.restoreImages(result.design, imageReferences);
      console.log('✅ Plugin: Images restored successfully');

      // Clean up stored references
      this.imageReferencesStore.delete(requestKey);

      const points = result.points ? {
        deducted: result.points.deducted || 0,
        remaining: result.points.remaining || 0,
        wasFree: result.points.wasFree || false,
        hasPurchased: result.points.hasPurchased,
        subscription: result.points.subscription,
      } : undefined;

      this.uiPort.postMessage({
        type: 'ai-edit-response',
        message: result.message,
        designData: restoredDesign,
        previewHtml: result.previewHtml,
        cost: result.cost ? {
          inputCost: result.cost.inputCost,
          outputCost: result.cost.outputCost,
          totalCost: result.cost.totalCost,
          inputTokens: result.cost.inputTokens,
          outputTokens: result.cost.outputTokens
        } : undefined,
        points,
      });

      if (points) {
        this.uiPort.postMessage({
          type: 'points-updated',
          balance: points.remaining,
          hasPurchased: points.hasPurchased ?? true,
        });
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
      this.uiPort.postMessage({
        type: 'ai-edit-error',
        error: errorMessage,
        statusCode: (error as any)?.statusCode,
      });

      errorReporter.reportErrorAsync(error as Error, {
        componentName: 'PluginMessageHandler',
        actionType: 'handleAIEditDesign',
        errorDetails: { model, designSystemId },
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

      const selectedModel = model || defaultModel.id;

      // Strip images from reference
      console.log('Plugin: Stripping images from reference design...');
      const { cleanedDesign, imageReferences } = this.imageOptimizer.stripImages(referenceJson);
      console.log(`Plugin: Extracted ${imageReferences.length} images from reference`);

      console.log("Generating design based on existing reference");
      console.log("Endpoint: /api/designs/generate-based-on-existing");

      const response = await fetch(`${ApiConfig.BASE_URL}/api/designs/generate-based-on-existing`, {
        method: 'POST',
        headers: await this.getUserInfoUseCase.execute(),
        body: JSON.stringify({
          message: userMessage,
          history: conversationHistory,
          referenceDesign: cleanedDesign,
          modelId: selectedModel
        })
      });

      if (!response.ok) {
        let errorMessage = `Server error: ${response.status}`;
        try {
          const errorResult = await response.json();
          errorMessage = errorResult.message || errorResult.error || errorMessage;
        } catch (e) { }
        const error = new Error(errorMessage) as Error & { statusCode?: number };
        error.statusCode = response.status;
        throw error;
      }

      const result = await response.json();

      console.log("✅ Received response from generate-based-on-existing");

      const points = result.points ? {
        deducted: result.points.deducted || 0,
        remaining: result.points.remaining || 0,
        wasFree: result.points.wasFree || false,
        hasPurchased: result.points.hasPurchased,
        subscription: result.points.subscription,
      } : undefined;

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
        } : undefined,
        points,
      });

      if (points) {
        this.uiPort.postMessage({
          type: 'points-updated',
          balance: points.remaining,
          hasPurchased: points.hasPurchased ?? true,
        });
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
      console.error("❌ Error in handleGenerateBasedOnExisting:", errorMessage);
      this.uiPort.postMessage({
        type: 'ai-based-on-existing-error',
        error: errorMessage,
        statusCode: (error as any)?.statusCode,
      });

      errorReporter.reportErrorAsync(error as Error, {
        componentName: 'PluginMessageHandler',
        actionType: 'handleGenerateBasedOnExisting',
        errorDetails: { model },
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

      const selectedModel = model || defaultModel.id;

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
        const error = new Error(errorMessage) as Error & { statusCode?: number };
        error.statusCode = response.status;
        throw error;
      }

      const result = await response.json();

      console.log('[PluginHandler] Backend response points:', result.points);

      const points = result.points ? {
        deducted: result.points.deducted || 0,
        remaining: result.points.remaining || 0,
        wasFree: result.points.wasFree || false,
        hasPurchased: result.points.hasPurchased,
        subscription: result.points.subscription,
      } : undefined;

      console.log('[PluginHandler] Sending points to UI:', points);

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
        } : undefined,
        points,
      });

      if (points) {
        this.uiPort.postMessage({
          type: 'points-updated',
          balance: points.remaining,
          hasPurchased: points.hasPurchased ?? true,
        });
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
      this.uiPort.postMessage({
        type: 'ai-chat-error',
        error: errorMessage,
        statusCode: (error as any)?.statusCode,
      });

      errorReporter.reportErrorAsync(error as Error, {
        componentName: 'PluginMessageHandler',
        actionType: 'handleAIChatMessage',
        errorDetails: { model, designSystemId },
      });
    }
  }

  // ==================== IMPORT HANDLERS ====================

  private async handleImportDesignFromChat(designData: unknown, buttonId: any): Promise<void> {
    try {
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
    } catch (error) {
      errorReporter.reportErrorAsync(error as Error, {
        componentName: 'PluginMessageHandler',
        actionType: 'handleImportDesignFromChat',
      });
      throw error;
    }
  }

  private async handleImportEditedDesign(designData: unknown, buttonId: any): Promise<void> {
    try {
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
    } catch (error) {
      errorReporter.reportErrorAsync(error as Error, {
        componentName: 'PluginMessageHandler',
        actionType: 'handleImportEditedDesign',
      });
      throw error;
    }
  }

  private async handleImportBasedOnExistingDesign(designData: unknown, buttonId: any): Promise<void> {
    try {
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
    } catch (error) {
      errorReporter.reportErrorAsync(error as Error, {
        componentName: 'PluginMessageHandler',
        actionType: 'handleImportBasedOnExistingDesign',
      });
      throw error;
    }
  }

  private async handleAIDesignImport(designData: unknown): Promise<void> {
    try {
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
    } catch (error) {
      errorReporter.reportErrorAsync(error as Error, {
        componentName: 'PluginMessageHandler',
        actionType: 'handleAIDesignImport',
      });
      throw error;
    }
  }

  private async handleImportDesign(designData: unknown): Promise<void> {
    try {
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
    } catch (error) {
      errorReporter.reportErrorAsync(error as Error, {
        componentName: 'PluginMessageHandler',
        actionType: 'handleImportDesign',
      });
      throw error;
    }
  }

  private async handleExportSelected(): Promise<void> {
    try {
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
    } catch (error) {
      errorReporter.reportErrorAsync(error as Error, {
        componentName: 'PluginMessageHandler',
        actionType: 'handleExportSelected',
      });
      throw error;
    }
  }

  private async handleExportAll(): Promise<void> {
    try {
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
    } catch (error) {
      errorReporter.reportErrorAsync(error as Error, {
        componentName: 'PluginMessageHandler',
        actionType: 'handleExportAll',
      });
      throw error;
    }
  }

  private async handleImportUILibraryComponent(designJson: unknown): Promise<void> {
    try {
      const result = await this.importDesignUseCase.execute(designJson);

      if (result.success) {
        this.notificationPort.notify('✅ Component imported successfully!');
        this.uiPort.postMessage({ type: 'import-success' });
      } else {
        this.notificationPort.notifyError(result.error || 'Import failed');
        this.uiPort.postMessage({
          type: 'import-error',
          error: result.error || 'Import failed',
        });
      }
    } catch (error) {
      errorReporter.reportErrorAsync(error as Error, {
        componentName: 'PluginMessageHandler',
        actionType: 'handleImportUILibraryComponent',
      });
      throw error;
    }
  }

  private async handleGeneratePreviewImage(requestId?: string, maxWidth?: number): Promise<void> {
    try {
      const selection = figma.currentPage.selection;

      if (selection.length === 0) {
        throw new Error('Please select a layer to generate a preview image');
      }

      if (selection.length > 1) {
        throw new Error('Please select only one layer to generate a preview image');
      }

      const selectedNode = selection[0] as SceneNode;
      if (!('exportAsync' in selectedNode)) {
        throw new Error('Selected layer cannot be exported as an image');
      }

      const width = Math.max(64, Math.min(maxWidth ?? 320, 2000));
      const bytes = await (selectedNode as ExportMixin).exportAsync({
        format: 'PNG',
        constraint: { type: 'WIDTH', value: width },
      });

      const base64 = figma.base64Encode(bytes);
      this.uiPort.postMessage({
        type: 'preview-image-generated',
        requestId,
        previewImage: `data:image/png;base64,${base64}`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate preview image';
      this.uiPort.postMessage({
        type: 'preview-image-error',
        requestId,
        error: errorMessage,
      });

      errorReporter.reportErrorAsync(error as Error, {
        componentName: 'PluginMessageHandler',
        actionType: 'handleGeneratePreviewImage',
      });
    }
  }

  private async handleGeneratePreviewFromDesignData(requestId?: string, designData?: unknown, maxWidth?: number): Promise<void> {
    const previousSelection = [...figma.currentPage.selection];
    const createdNodes: SceneNode[] = [];

    try {
      const result = await this.importAIDesignUseCase.execute(designData);

      if (!result.success) {
        throw new Error(result.error || 'Failed to create nodes for preview');
      }

      // The use case sets selection to the created nodes
      createdNodes.push(...(figma.currentPage.selection as SceneNode[]));

      if (createdNodes.length === 0) {
        throw new Error('No nodes were created for preview');
      }

      const nodeToExport = createdNodes[0];
      if (!('exportAsync' in nodeToExport)) {
        throw new Error('Created node cannot be exported as an image');
      }

      const width = Math.max(64, Math.min(maxWidth ?? 320, 2000));
      const bytes = await (nodeToExport as ExportMixin).exportAsync({
        format: 'PNG',
        constraint: { type: 'WIDTH', value: width },
      });

      const base64 = figma.base64Encode(bytes);

      // Delete temp nodes and restore selection
      for (const node of createdNodes) {
        node.remove();
      }
      figma.currentPage.selection = previousSelection.filter(n => !n.removed);

      this.uiPort.postMessage({
        type: 'preview-image-generated',
        requestId,
        previewImage: `data:image/png;base64,${base64}`,
      });
    } catch (error) {
      // Clean up any created nodes on error
      for (const node of createdNodes) {
        try { node.remove(); } catch (_) { /* already removed */ }
      }
      figma.currentPage.selection = previousSelection.filter(n => !n.removed);

      const errorMessage = error instanceof Error ? error.message : 'Failed to generate preview from design data';
      this.uiPort.postMessage({
        type: 'preview-image-error',
        requestId,
        error: errorMessage,
      });
    }
  }
}
