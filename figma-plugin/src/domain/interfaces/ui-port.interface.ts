import { SelectionInfo } from './node-repository.interface';
import { DesignNode } from '../entities/design-node';
import { FrameInfo, PrototypeConnection } from '../entities/prototype-connection.entity';

export interface CostInfo {
  inputCost: string;
  outputCost: string;
  totalCost: string;
  inputTokens: number;
  outputTokens: number;
}

export interface PointsInfo {
  deducted: number;
  remaining: number;
  wasFree: boolean;
  hasPurchased?: boolean;
}

/**
 * Messages that can be sent to the UI (UIMessage)
 */
export type UIMessage =
  | { type: 'selection-changed'; selection: SelectionInfo }
  | { type: 'import-success'; buttonId?: string }
  | { type: 'import-error'; error: string; buttonId?: string }
  | { type: 'export-success'; data: DesignNode[]; nodeCount: number }
  | { type: 'export-error'; error: string }
  | { type: 'call-backend-for-claude'; prompt: string }
  | { type: 'ai-chat-response'; message: string; designData: any; previewHtml?: string | null; cost?: CostInfo; points?: PointsInfo }
  | { type: 'ai-chat-error'; error: string; statusCode?: number }
  | { type: 'layer-selected-for-edit'; layerName: string; layerJson: any; _imageReferenceKey?: string }
  | { type: 'layer-selected-for-reference'; layerName: string; layerJson: any; _imageReferenceKey?: string }
  | { type: 'no-layer-selected' }
  | { type: 'ai-edit-response'; message: string; designData: any; previewHtml?: string | null; cost?: CostInfo; points?: PointsInfo }
  | { type: 'ai-edit-error'; error: string; statusCode?: number }
  | { type: 'ai-based-on-existing-response'; message: string; designData: any; previewHtml?: string | null; cost?: CostInfo; points?: PointsInfo } // ✨ NEW
  | { type: 'ai-based-on-existing-error'; error: string; statusCode?: number } // ✨ NEW
  | { type: 'design-updated'; layerJson: any; buttonId?: string }
  | { type: 'HEADERS_RESPONSE'; headers: any }
  | { type: 'AUTH_TOKEN_RESPONSE'; token: string | null }
  | { type: 'points-updated'; balance: number; hasPurchased: boolean }
  // Add to UIMessage type union (after existing types):
  | { type: 'frames-loaded'; frames: FrameInfo[] }
  | { type: 'frames-load-error'; error: string }
  | { type: 'prototype-connections-generated'; connections: PrototypeConnection[]; reasoning?: string; cost?: CostInfo; points?: PointsInfo }
  | { type: 'prototype-connections-error'; error: string; statusCode?: number }
  | { type: 'prototype-applied'; appliedCount: number }
  | { type: 'prototype-apply-error'; error: string }
  | { type: 'preview-image-generated'; requestId?: string; previewImage: string | null }
  | { type: 'preview-image-error'; requestId?: string; error: string }

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
  | { type: 'resize-window'; size: { w: number; h: number } }
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
  | { type: 'request-layer-selection-for-reference' }
  | {
    type: 'ai-edit-design';
    message: string;
    history?: Array<{ role: string; content: string }>;
    layerJson: any;
    model?: string;
    designSystemId?: string;
  }
  | {
    type: 'ai-generate-based-on-existing';
    message: string;
    history?: Array<{ role: string; content: string }>;
    referenceJson: any;
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
  | {
    type: 'import-based-on-existing-design';
    designData: unknown;
    buttonId?: string;
  }
  | {
    type: 'REPORT_ERROR';
    error: any;
  }
  | { type: 'import-ui-library-component'; designJson: any }
  | { type: 'GET_HEADERS' }
  | { type: 'SAVE_AUTH_TOKEN'; token: string }
  | { type: 'GET_AUTH_TOKEN' }
  | { type: 'CLEAR_AUTH_TOKEN' }
  | { type: 'OPEN_EXTERNAL_URL'; url: string }
  // Add to PluginMessage type union (after existing types):
  | { type: 'get-frames-for-prototype' }
  | { type: 'generate-prototype-connections'; frames: FrameInfo[]; modelId?: string }
  | { type: 'apply-prototype-connections'; connections: PrototypeConnection[] }
  | { type: 'generate-preview-image'; requestId?: string; maxWidth?: number }

/**
 * UI Port interface
 */
export interface IUIPort {
  postMessage(message: UIMessage): void;
  show(options: { width: number; height: number; themeColors: boolean }): void;
  close(): void;
  onMessage(handler: (message: PluginMessage) => void): void;
}
