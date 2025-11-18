// Service for managing alert rules and triggered alerts
import { PrismaClient, AlertConditionType, AlertSeverity, AlertStatus, Prisma } from '@prisma/client';
import { NotFoundError, ValidationError } from '../lib/errors';
import { logger } from '../lib/logger';
import { eventBus, createEvent } from '../events';
import { INotificationAdapter } from '../domain/adapters/INotificationAdapter';

const alertLogger = logger.child({ module: 'alert' });

export interface CreateAlertRuleInput {
  communityId: string;
  name: string;
  description?: string;
  conditionType: AlertConditionType;
  threshold: number;
  windowSize?: number;
  actionsJson: any;
  enabled?: boolean;
}

export interface UpdateAlertRuleInput {
  name?: string;
  description?: string;
  conditionType?: AlertConditionType;
  threshold?: number;
  windowSize?: number;
  actionsJson?: any;
  enabled?: boolean;
}

export class AlertService {
  constructor(
    private prisma: PrismaClient,
    private notificationAdapter?: INotificationAdapter
  ) {}

  /**
   * Create a new alert rule
   */
  async createAlertRule(input: CreateAlertRuleInput) {
    alertLogger.info({ input }, 'Creating alert rule');

    if (!input.name || input.name.trim().length === 0) {
      throw new ValidationError('Alert rule name is required');
    }

    // Verify community exists
    const community = await this.prisma.communityProfile.findUnique({
      where: { id: input.communityId },
    });

    if (!community) {
      throw new NotFoundError('CommunityProfile', input.communityId);
    }

    const rule = await this.prisma.alertRule.create({
      data: {
        communityId: input.communityId,
        name: input.name,
        description: input.description,
        conditionType: input.conditionType,
        threshold: input.threshold,
        windowSize: input.windowSize || 1,
        actionsJson: input.actionsJson,
        enabled: input.enabled !== false,
      },
    });

    alertLogger.info({ ruleId: rule.id }, 'Alert rule created');
    return rule;
  }

  /**
   * Get an alert rule by ID
   */
  async getAlertRule(id: string) {
    const rule = await this.prisma.alertRule.findUnique({
      where: { id },
      include: {
        community: true,
      },
    });

    if (!rule) {
      throw new NotFoundError('AlertRule', id);
    }

    return rule;
  }

  /**
   * List alert rules for a community
   */
  async listAlertRules(communityId: string, enabledOnly: boolean = false) {
    const where: Prisma.AlertRuleWhereInput = { communityId };

    if (enabledOnly) {
      where.enabled = true;
    }

    return this.prisma.alertRule.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update an alert rule
   */
  async updateAlertRule(id: string, input: UpdateAlertRuleInput) {
    await this.getAlertRule(id);

    const updateData: Prisma.AlertRuleUpdateInput = {};

    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.conditionType !== undefined) updateData.conditionType = input.conditionType;
    if (input.threshold !== undefined) updateData.threshold = input.threshold;
    if (input.windowSize !== undefined) updateData.windowSize = input.windowSize;
    if (input.actionsJson !== undefined) updateData.actionsJson = input.actionsJson;
    if (input.enabled !== undefined) updateData.enabled = input.enabled;

    const updated = await this.prisma.alertRule.update({
      where: { id },
      data: updateData,
    });

    alertLogger.info({ ruleId: id }, 'Alert rule updated');
    return updated;
  }

  /**
   * Delete an alert rule
   */
  async deleteAlertRule(id: string) {
    await this.getAlertRule(id);

    await this.prisma.alertRule.delete({
      where: { id },
    });

    alertLogger.info({ ruleId: id }, 'Alert rule deleted');
  }

  /**
   * Evaluate alert rules for a community after a snapshot is created
   */
  async evaluateRulesForCommunity(communityId: string, snapshotId: string) {
    const rules = await this.listAlertRules(communityId, true);

    if (rules.length === 0) {
      return;
    }

    const snapshot = await this.prisma.climateSnapshot.findUnique({
      where: { id: snapshotId },
    });

    if (!snapshot) {
      return;
    }

    // Evaluate each rule
    for (const rule of rules) {
      try {
        const shouldTrigger = await this.evaluateRule(rule, snapshot);

        if (shouldTrigger) {
          await this.triggerAlert(rule, snapshot);
        }
      } catch (error) {
        alertLogger.error({ err: error, ruleId: rule.id }, 'Failed to evaluate rule');
      }
    }
  }

  /**
   * Evaluate a single rule against a snapshot
   */
  private async evaluateRule(
    rule: any,
    snapshot: any
  ): Promise<boolean> {
    switch (rule.conditionType) {
      case 'sentiment_below':
        return snapshot.aggregateSentiment < rule.threshold;

      case 'sentiment_above':
        return snapshot.aggregateSentiment > rule.threshold;

      case 'sentiment_drop': {
        // Get previous snapshots
        const previous = await this.prisma.climateSnapshot.findMany({
          where: {
            communityId: rule.communityId,
            windowEnd: { lt: snapshot.windowStart },
          },
          orderBy: { windowEnd: 'desc' },
          take: rule.windowSize,
        });

        if (previous.length === 0) return false;

        const avgPrevious = previous.reduce((sum, s) => sum + s.aggregateSentiment, 0) / previous.length;
        const drop = avgPrevious - snapshot.aggregateSentiment;

        return drop > rule.threshold;
      }

      case 'sentiment_spike': {
        const previous = await this.prisma.climateSnapshot.findMany({
          where: {
            communityId: rule.communityId,
            windowEnd: { lt: snapshot.windowStart },
          },
          orderBy: { windowEnd: 'desc' },
          take: rule.windowSize,
        });

        if (previous.length === 0) return false;

        const avgPrevious = previous.reduce((sum, s) => sum + s.aggregateSentiment, 0) / previous.length;
        const spike = snapshot.aggregateSentiment - avgPrevious;

        return spike > rule.threshold;
      }

      default:
        alertLogger.warn({ conditionType: rule.conditionType }, 'Unknown condition type');
        return false;
    }
  }

  /**
   * Trigger an alert
   */
  private async triggerAlert(rule: any, snapshot: any) {
    const severity = this.determineSeverity(rule, snapshot);
    const message = this.buildAlertMessage(rule, snapshot);

    const alert = await this.prisma.triggeredAlert.create({
      data: {
        ruleId: rule.id,
        communityId: rule.communityId,
        severity,
        message,
        detailsJson: {
          snapshot: {
            id: snapshot.id,
            sentiment: snapshot.aggregateSentiment,
            windowStart: snapshot.windowStart,
            windowEnd: snapshot.windowEnd,
          },
          rule: {
            id: rule.id,
            name: rule.name,
            conditionType: rule.conditionType,
            threshold: rule.threshold,
          },
        },
      },
    });

    // Update rule's last triggered time
    await this.prisma.alertRule.update({
      where: { id: rule.id },
      data: { lastTriggeredAt: new Date() },
    });

    // Publish event
    await eventBus.publish(
      createEvent('alert.triggered', {
        alertId: alert.id,
        ruleId: rule.id,
        communityId: rule.communityId,
        severity,
        message,
        details: alert.detailsJson,
      })
    );

    // Send notification if adapter is configured
    if (this.notificationAdapter) {
      try {
        await this.notificationAdapter.send({
          title: `Alert: ${rule.name}`,
          body: message,
          severity,
          metadata: {
            alertId: alert.id,
            communityId: rule.communityId,
          },
        });
      } catch (error) {
        alertLogger.error({ err: error }, 'Failed to send notification');
      }
    }

    alertLogger.info({ alertId: alert.id, ruleId: rule.id }, 'Alert triggered');
    return alert;
  }

  private determineSeverity(rule: any, snapshot: any): AlertSeverity {
    // Simple logic - can be enhanced
    const deviation = Math.abs(snapshot.aggregateSentiment - rule.threshold);

    if (deviation > 0.5) return 'critical';
    if (deviation > 0.2) return 'warning';
    return 'info';
  }

  private buildAlertMessage(rule: any, snapshot: any): string {
    switch (rule.conditionType) {
      case 'sentiment_below':
        return `Community sentiment (${snapshot.aggregateSentiment.toFixed(2)}) fell below threshold (${rule.threshold})`;
      case 'sentiment_above':
        return `Community sentiment (${snapshot.aggregateSentiment.toFixed(2)}) rose above threshold (${rule.threshold})`;
      case 'sentiment_drop':
        return `Significant sentiment drop detected for ${rule.name}`;
      case 'sentiment_spike':
        return `Significant sentiment spike detected for ${rule.name}`;
      default:
        return `Alert condition met for ${rule.name}`;
    }
  }

  /**
   * Get triggered alerts for a community
   */
  async getTriggeredAlerts(communityId: string, status?: AlertStatus) {
    const where: Prisma.TriggeredAlertWhereInput = { communityId };

    if (status) {
      where.status = status;
    }

    return this.prisma.triggeredAlert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        rule: true,
      },
    });
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId: string, acknowledgedBy: string) {
    const alert = await this.prisma.triggeredAlert.update({
      where: { id: alertId },
      data: {
        status: 'acknowledged',
        acknowledgedBy,
        acknowledgedAt: new Date(),
      },
    });

    alertLogger.info({ alertId }, 'Alert acknowledged');
    return alert;
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: string) {
    const alert = await this.prisma.triggeredAlert.update({
      where: { id: alertId },
      data: {
        status: 'resolved',
        resolvedAt: new Date(),
      },
    });

    alertLogger.info({ alertId }, 'Alert resolved');
    return alert;
  }
}
