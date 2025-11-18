// Notification adapter interface

export interface NotificationMessage {
  title: string;
  body: string;
  severity?: 'info' | 'warning' | 'critical';
  metadata?: Record<string, any>;
}

export interface INotificationAdapter {
  /**
   * Send a notification
   */
  send(message: NotificationMessage): Promise<void>;

  /**
   * Get adapter info
   */
  getInfo(): {
    type: string;
    name: string;
  };
}
