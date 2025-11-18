// Routes for signal ingestion
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { IngestionService } from '../services/IngestionService';

const IngestSignalSchema = z.object({
  sourceKey: z.string().min(1),
  communityId: z.string().min(1),
  externalMessageId: z.string().optional(),
  authorRef: z.string().optional(),
  text: z.string().min(1),
  ts: z.string().or(z.date()),
  meta: z.record(z.any()).optional()
});

export async function signalsRoutes(
  fastify: FastifyInstance,
  options: { ingestionService: IngestionService }
) {
  const { ingestionService } = options;

  // POST /api/signals/ingest
  fastify.post('/ingest', async (request, reply) => {
    try {
      const body = IngestSignalSchema.parse(request.body);
      const result = await ingestionService.ingestSignal(body);

      if (!result.success) {
        return reply.code(400).send(result);
      }

      return reply.code(201).send(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          message: 'Invalid request body',
          errors: error.errors
        });
      }

      console.error('Error in /api/signals/ingest:', error);
      return reply.code(500).send({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  // GET /api/signals/unanalyzed
  fastify.get('/unanalyzed', async (request, reply) => {
    try {
      const query = request.query as { limit?: string };
      const limit = query.limit ? parseInt(query.limit, 10) : 100;

      const signals = await ingestionService.getUnanalyzedSignals(limit);

      return reply.send({
        count: signals.length,
        signals
      });
    } catch (error) {
      console.error('Error in /api/signals/unanalyzed:', error);
      return reply.code(500).send({
        success: false,
        message: 'Internal server error'
      });
    }
  });
}
