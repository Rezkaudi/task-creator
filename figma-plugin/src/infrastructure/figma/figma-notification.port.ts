import { INotificationPort } from '../../domain/interfaces/notification-port.interface';

/**
 * Figma implementation of the Notification Port
 */
export class FigmaNotificationPort implements INotificationPort {
  private static readonly DEFAULT_TIMEOUT = 5000;

  /**
   * Show a notification message
   */
  notify(message: string, timeout: number = FigmaNotificationPort.DEFAULT_TIMEOUT): void {
    figma.notify(message, { timeout });
  }

  /**
   * Show an error notification
   */
  notifyError(message: string, timeout: number = FigmaNotificationPort.DEFAULT_TIMEOUT): void {
    figma.notify(`❌ ${message}`, { timeout, error: true });
  }
}
