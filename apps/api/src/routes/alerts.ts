// Routes for alert management
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { AlertService } from '../services/AlertService';
import { ValidationError } from '../lib/errors';

const CreateAlertRuleSchema = z.object({
  communityId: z.string(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  conditionType: z.enum([
    'sentiment_below',
    'sentiment_above',
    'sentiment_drop',
    'sentiment_spike',
    'emotion_dominant',
    'signal_volume_low',
    'signal_volume_high',
  ]),
  threshold: z.number(),
  windowSize: z.number().int().positive().optional(),
  actionsJson: z.record(z.any()),
  enabled: z.boolean().optional(),
});

const UpdateAlertRuleSchema = CreateAlertRuleSchema.partial().omit({ communityId: true });

export async function alertsRoutes(
  fastify: FastifyInstance,
  options: { alertService: AlertService }
) {
  const { alertService } = options;

  // POST /api/alerts/rules - Create alert rule
  fastify.post('/rules', async (request, reply) => {
    try {
      const body = CreateAlertRuleSchema.parse(request.body);
      const rule = await alertService.createAlertRule(body);
      return reply.code(201).send(rule);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid request body', error.errors);
      }
      throw error;
    }
  });

  // GET /api/alerts/rules/:id - Get alert rule
  fastify.get('/rules/:id', async (request, reply) => {
    const params = request.params as { id: string };
    const rule = await alertService.getAlertRule(params.id);
    return rule;
  });

  // GET /api/alerts/rules - List alert rules for a community
  fastify.get('/rules', async (request, reply) => {
    const query = request.query as { communityId: string; enabledOnly?: string };

    if (!query.communityId) {
      throw new ValidationError('communityId query parameter is required');
    }

    const rules = await alertService.listAlertRules(
      query.communityId,
      query.enabledOnly === 'true'
    );

    return { rules };
  });

  // PATCH /api/alerts/rules/:id - Update alert rule
  fastify.patch('/rules/:id', async (request, reply) => {
    try {
      const params = request.params as { id: string };
      const body = UpdateAlertRuleSchema.parse(request.body);
      const updated = await alertService.updateAlertRule(params.id, body);
      return updated;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid request body', error.errors);
      }
      throw error;
    }
  });

  // DELETE /api/alerts/rules/:id - Delete alert rule
  fastify.delete('/rules/:id', async (request, reply) => {
    const params = request.params as { id: string };
    await alertService.deleteAlertRule(params.id);
    return { success: true, message: 'Alert rule deleted' };
  });

  // GET /api/alerts/triggered - Get triggered alerts for a community
  fastify.get('/triggered', async (request, reply) => {
    const query = request.query as { communityId: string; status?: string };

    if (!query.communityId) {
      throw new ValidationError('communityId query parameter is required');
    }

    const alerts = await alertService.getTriggeredAlerts(
      query.communityId,
      query.status as any
    );

    return { alerts };
  });

  // POST /api/alerts/triggered/:id/acknowledge - Acknowledge an alert
  fastify.post('/triggered/:id/acknowledge', async (request, reply) => {
    const params = request.params as { id: string };
    const body = request.body as { acknowledgedBy: string };

    const alert = await alertService.acknowledgeAlert(params.id, body.acknowledgedBy);
    return alert;
  });

  // POST /api/alerts/triggered/:id/resolve - Resolve an alert
  fastify.post('/triggered/:id/resolve', async (request, reply) => {
    const params = request.params as { id: string };
    const alert = await alertService.resolveAlert(params.id);
    return alert;
  });
}
