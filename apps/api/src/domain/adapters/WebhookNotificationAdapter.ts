// Webhook notification adapter
import { INotificationAdapter, NotificationMessage } from './INotificationAdapter';
import { logger } from '../../lib/logger';

const webhookLogger = logger.child({ module: 'webhook' });

export class WebhookNotificationAdapter implements INotificationAdapter {
  constructor(
    private webhookUrl: string,
    private secret?: string
  ) {}

  async send(message: NotificationMessage): Promise<void> {
    try {
      const payload = {
        title: message.title,
        body: message.body,
        severity: message.severity,
        timestamp: new Date().toISOString(),
        metadata: message.metadata,
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.secret) {
        headers['X-Webhook-Secret'] = this.secret;
      }

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Webhook request failed: ${response.status} ${response.statusText}`);
      }

      webhookLogger.info({ url: this.webhookUrl }, 'Webhook notification sent');
    } catch (error) {
      webhookLogger.error({ err: error, url: this.webhookUrl }, 'Failed to send webhook notification');
      throw error;
    }
  }

  getInfo() {
    return {
      type: 'webhook',
      name: 'Webhook Notification Adapter',
    };
  }
}
