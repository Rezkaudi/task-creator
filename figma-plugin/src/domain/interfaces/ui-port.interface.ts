import { SelectionInfo } from './node-repository.interface';
import { DesignNode } from '../entities/design-node';

/**
 * Design version info from backend
 */
export interface DesignVersionInfo {
  id: number;
  version: number;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface CostInfo {
  inputCost: string;
  outputCost: string;
  totalCost: string;
  inputTokens: number;
  outputTokens: number;
}

/**
 * Full design version with JSON
 */
export interface DesignVersionFull extends DesignVersionInfo {
  designJson: any;
}

/**
 * Messages that can be sent to the UI (UIMessage)
 */
export type UIMessage =
  | { type: 'selection-changed'; selection: SelectionInfo }
  | { type: 'import-success'; buttonId?: string } // 👈 أضفنا buttonId
  | { type: 'import-error'; error: string; buttonId?: string } // 👈 أضفنا buttonId
  | { type: 'export-success'; data: DesignNode[]; nodeCount: number }
  | { type: 'export-error'; error: string }
  | { type: 'call-backend-for-claude'; prompt: string }
  | { type: 'versions-loaded'; versions: DesignVersionInfo[] }
  | { type: 'versions-load-error'; error: string }
  | { type: 'version-saved'; version: DesignVersionInfo }
  | { type: 'version-save-error'; error: string }
  | { type: 'version-deleted'; id: number }
  | { type: 'version-delete-error'; error: string }
  | { type: 'version-loaded'; version: DesignVersionFull }
  | { type: 'version-load-error'; error: string }
  | { type: 'ai-chat-response'; message: string; designData: any; previewHtml?: string | null; cost?: CostInfo }
  | { type: 'ai-chat-error'; error: string }
  | { type: 'layer-selected-for-edit'; layerName: string; layerJson: any }
  | { type: 'no-layer-selected' }
  | { type: 'ai-edit-response'; message: string; designData: any; previewHtml?: string | null; cost?: CostInfo }
  | { type: 'ai-edit-error'; error: string }
  | { type: 'design-updated'; layerJson: any; buttonId?: string };

/**
 * Messages received from the UI (PluginMessage)
 */
export type PluginMessage =
  | { type: 'design-generated-from-ai'; designData: unknown }
  | { type: 'generate-design-from-text'; prompt: string }
  | { type: 'import-design'; designData: unknown }
  | { type: 'export-selected' }
  | { type: 'export-all' }
  | { type: 'get-selection-info' }
  | { type: 'cancel' }
  | {
      type: 'ai-chat-message';
      message: string;
      history?: Array<{ role: string; content: string }>;
      model?: string;
      designSystemId?: string;
    }
  | { 
      type: 'import-design-from-chat'; 
      designData: unknown;
      buttonId?: string; 
      isEditMode?: boolean; 
    }
  | { type: 'request-layer-selection-for-edit' }
  | {
      type: 'ai-edit-design';
      message: string;
      history?: Array<{ role: string; content: string }>;
      layerJson: any;
      model?: string;
      designSystemId?: string;
    }
  | { 
      type: 'import-edited-design'; 
      designData: unknown;
      buttonId?: string; 
      isEditMode?: boolean; 
      layerId?: string; 
    }
  // Version management messages
  | { type: 'load-versions' }
  | { type: 'save-version'; description: string; designJson: any }
  | { type: 'load-version'; id: number }
  | { type: 'delete-version'; id: number }
  | { type: 'import-version'; designJson: any }
  | { type: 'GET_HEADERS' };

/**
 * UI Port interface
 */
export interface IUIPort {
  postMessage(message: UIMessage): void;
  show(options: { width: number; height: number; themeColors: boolean }): void;
  close(): void;
  onMessage(handler: (message: PluginMessage) => void): void;
}