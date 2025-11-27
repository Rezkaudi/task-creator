import { SelectionInfo } from './node-repository.interface';
import { DesignNode } from '../entities/design-node';

/**
 * Messages that can be sent to the UI
 */
export type UIMessage =
  | { type: 'selection-changed'; selection: SelectionInfo }
  | { type: 'import-success' }
  | { type: 'import-error'; error: string }
  | { type: 'export-success'; data: DesignNode[]; nodeCount: number }
  | { type: 'export-error'; error: string }
  | { type: 'call-backend-for-claude'; prompt: string };

/**
 * Messages received from the UI
 */
export type PluginMessage =
  | { type: 'design-generated-from-ai'; designData: unknown }
  | { type: 'generate-design-from-text'; prompt: string }
  | { type: 'import-design'; designData: unknown }
  | { type: 'export-selected' }
  | { type: 'export-all' }
  | { type: 'get-selection-info' }
  | { type: 'cancel' };

/**
 * UI Port interface for communication with the UI layer
 */
export interface IUIPort {
  /**
   * Send a message to the UI
   */
  postMessage(message: UIMessage): void;

  /**
   * Show the UI window
   */
  show(options: { width: number; height: number; themeColors: boolean }): void;

  /**
   * Close the plugin
   */
  close(): void;

  /**
   * Register a message handler
   */
  onMessage(handler: (message: PluginMessage) => void): void;
}
