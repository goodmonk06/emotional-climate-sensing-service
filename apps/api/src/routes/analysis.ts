// Routes for emotional analysis
import { FastifyInstance } from 'fastify';
import { AnalysisService } from '../services/AnalysisService';

export async function analysisRoutes(
  fastify: FastifyInstance,
  options: { analysisService: AnalysisService }
) {
  const { analysisService } = options;

  // POST /api/analysis/process
  // Trigger analysis of pending signals
  fastify.post('/process', async (request, reply) => {
    try {
      const query = request.query as { limit?: string };
      const limit = query.limit ? parseInt(query.limit, 10) : 50;

      const result = await analysisService.processBatch(limit);

      return reply.send({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('Error in /api/analysis/process:', error);
      return reply.code(500).send({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  // GET /api/analysis/stats
  fastify.get('/stats', async (request, reply) => {
    try {
      const stats = await analysisService.getStats();
      return reply.send(stats);
    } catch (error) {
      console.error('Error in /api/analysis/stats:', error);
      return reply.code(500).send({
        success: false,
        message: 'Internal server error'
      });
    }
  });
}
