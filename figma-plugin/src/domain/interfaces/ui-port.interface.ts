import { DesignNode } from '../entities/design-node';
import { SelectionInfo } from './node-repository.interface';

/**
 * Messages that can be sent to the UI (UIMessage)
 */
export type UIMessage =
  | { type: 'selection-changed'; selection: SelectionInfo }
  | { type: 'import-success' }
  | { type: 'import-error'; error: string }
  | { type: 'export-success'; data: DesignNode[]; nodeCount: number }
  | { type: 'export-error'; error: string }
  | { type: 'call-backend-for-claude'; prompt: string }
  | { type: 'ai-chat-response'; message: string; designData: any; previewHtml?: string | null }
  | { type: 'ai-chat-error'; error: string };

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
  | { type: 'ai-chat-message'; message: string; history?: Array<{ role: string; content: string }> }
  | { type: 'import-design-from-chat'; designData: unknown };

/**
 * UI Port interface
 */
export interface IUIPort {
  postMessage(message: UIMessage): void;
  show(options: { width: number; height: number; themeColors: boolean }): void;
  close(): void;
  onMessage(handler: (message: PluginMessage) => void): void;
}