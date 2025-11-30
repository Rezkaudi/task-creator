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

/**
 * Full design version with JSON
 */
export interface DesignVersionFull extends DesignVersionInfo {
  designJson: any;
}

/**
 * Messages that can be sent to the UI
 */
export type UIMessage =
  | { type: 'selection-changed'; selection: SelectionInfo }
  | { type: 'import-success' }
  | { type: 'import-error'; error: string }
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
  | { type: 'version-load-error'; error: string };

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
  | { type: 'cancel' }
  // Version management messages
  | { type: 'load-versions' }
  | { type: 'save-version'; description: string; designJson: any }
  | { type: 'load-version'; id: number }
  | { type: 'delete-version'; id: number }
  | { type: 'import-version'; designJson: any };

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
