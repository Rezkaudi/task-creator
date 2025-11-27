/**
 * Notification port for user feedback
 */
export interface INotificationPort {
  /**
   * Show a notification message
   */
  notify(message: string): void;

  /**
   * Show an error notification
   */
  notifyError(message: string): void;
}
