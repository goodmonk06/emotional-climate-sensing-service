// Stub notification adapter for testing
import { INotificationAdapter, NotificationMessage } from './INotificationAdapter';
import { logger } from '../../lib/logger';

const notificationLogger = logger.child({ module: 'notification' });

export class StubNotificationAdapter implements INotificationAdapter {
  private sentMessages: NotificationMessage[] = [];

  async send(message: NotificationMessage): Promise<void> {
    notificationLogger.info(
      { notification: message },
      `[STUB] Notification: ${message.title}`
    );

    this.sentMessages.push(message);
  }

  getInfo() {
    return {
      type: 'stub',
      name: 'Stub Notification Adapter',
    };
  }

  // Helper for testing
  getSentMessages(): NotificationMessage[] {
    return [...this.sentMessages];
  }

  clearMessages(): void {
    this.sentMessages = [];
  }
}
