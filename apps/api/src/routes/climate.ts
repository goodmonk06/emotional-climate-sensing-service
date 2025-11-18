// Routes for climate snapshots
import { FastifyInstance } from 'fastify';
import { ClimateService } from '../services/ClimateService';

export async function climateRoutes(
  fastify: FastifyInstance,
  options: { climateService: ClimateService }
) {
  const { climateService } = options;

  // GET /api/communities
  fastify.get('/communities', async (request, reply) => {
    try {
      const communities = await climateService.getCommunities();
      return reply.send({ communities });
    } catch (error) {
      console.error('Error in /api/communities:', error);
      return reply.code(500).send({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  // GET /api/communities/:id/climate/latest
  fastify.get('/communities/:id/climate/latest', async (request, reply) => {
    try {
      const params = request.params as { id: string };
      const snapshot = await climateService.getLatestSnapshot(params.id);

      if (!snapshot) {
        return reply.code(404).send({
          success: false,
          message: `No climate snapshot found for community ${params.id}`
        });
      }

      return reply.send(snapshot);
    } catch (error) {
      console.error('Error in /api/communities/:id/climate/latest:', error);
      return reply.code(500).send({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  // GET /api/communities/:id/climate/history
  fastify.get('/communities/:id/climate/history', async (request, reply) => {
    try {
      const params = request.params as { id: string };
      const query = request.query as { limit?: string };
      const limit = query.limit ? parseInt(query.limit, 10) : 10;

      const snapshots = await climateService.getSnapshotHistory(params.id, limit);

      return reply.send({
        communityId: params.id,
        count: snapshots.length,
        snapshots
      });
    } catch (error) {
      console.error('Error in /api/communities/:id/climate/history:', error);
      return reply.code(500).send({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  // POST /api/communities/:id/climate/snapshot
  // Manually trigger snapshot creation
  fastify.post('/communities/:id/climate/snapshot', async (request, reply) => {
    try {
      const params = request.params as { id: string };
      const query = request.query as { windowHours?: string };
      const windowHours = query.windowHours ? parseInt(query.windowHours, 10) : 24;

      const snapshot = await climateService.createSnapshot(params.id, windowHours);

      return reply.code(201).send(snapshot);
    } catch (error) {
      console.error('Error in /api/communities/:id/climate/snapshot:', error);

      if (error instanceof Error && error.message.includes('No analyzed signals')) {
        return reply.code(404).send({
          success: false,
          message: error.message
        });
      }

      return reply.code(500).send({
        success: false,
        message: 'Internal server error'
      });
    }
  });
}
