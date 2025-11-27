import { IUIPort, UIMessage, PluginMessage } from '../../domain/interfaces/ui-port.interface';

/**
 * Figma implementation of the UI Port
 */
export class FigmaUIPort implements IUIPort {
  private messageHandler: ((message: PluginMessage) => void) | null = null;

  constructor() {
    // Set up message listener from UI
    figma.ui.onmessage = (msg: unknown) => {
      if (this.messageHandler && msg && typeof msg === 'object') {
        this.messageHandler(msg as PluginMessage);
      }
    };
  }

  /**
   * Send a message to the UI
   */
  postMessage(message: UIMessage): void {
    figma.ui.postMessage(message);
  }

  /**
   * Show the UI window
   */
  show(options: { width: number; height: number; themeColors: boolean }): void {
    figma.showUI(__html__, options);
  }

  /**
   * Close the plugin
   */
  close(): void {
    figma.closePlugin();
  }

  /**
   * Register a message handler
   */
  onMessage(handler: (message: PluginMessage) => void): void {
    this.messageHandler = handler;
  }
}
