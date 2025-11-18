// Routes for community management
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { CommunityService } from '../services/CommunityService';
import { ValidationError } from '../lib/errors';

const CreateCommunitySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  timezone: z.string().optional(),
  tags: z.array(z.string()).optional(),
  settingsJson: z.record(z.any()).optional(),
});

const UpdateCommunitySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  timezone: z.string().optional(),
  tags: z.array(z.string()).optional(),
  settingsJson: z.record(z.any()).optional(),
  status: z.enum(['active', 'archived', 'suspended']).optional(),
});

export async function communitiesRoutes(
  fastify: FastifyInstance,
  options: { communityService: CommunityService }
) {
  const { communityService } = options;

  // POST /api/communities/profiles - Create community
  fastify.post('/profiles', async (request, reply) => {
    try {
      const body = CreateCommunitySchema.parse(request.body);
      const community = await communityService.createCommunity(body);
      return reply.code(201).send(community);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid request body', error.errors);
      }
      throw error;
    }
  });

  // GET /api/communities/profiles/:id - Get community
  fastify.get('/profiles/:id', async (request, reply) => {
    const params = request.params as { id: string };
    const community = await communityService.getCommunity(params.id);
    return community;
  });

  // GET /api/communities/profiles - List communities
  fastify.get('/profiles', async (request, reply) => {
    const query = request.query as {
      status?: string;
      tags?: string;
      limit?: string;
      offset?: string;
    };

    const result = await communityService.listCommunities({
      status: query.status as any,
      tags: query.tags ? query.tags.split(',') : undefined,
      limit: query.limit ? parseInt(query.limit, 10) : undefined,
      offset: query.offset ? parseInt(query.offset, 10) : undefined,
    });

    return result;
  });

  // PATCH /api/communities/profiles/:id - Update community
  fastify.patch('/profiles/:id', async (request, reply) => {
    try {
      const params = request.params as { id: string };
      const body = UpdateCommunitySchema.parse(request.body);
      const updated = await communityService.updateCommunity(params.id, body);
      return updated;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid request body', error.errors);
      }
      throw error;
    }
  });

  // DELETE /api/communities/profiles/:id - Archive community
  fastify.delete('/profiles/:id', async (request, reply) => {
    const params = request.params as { id: string };
    await communityService.deleteCommunity(params.id);
    return { success: true, message: 'Community archived' };
  });

  // GET /api/communities/profiles/:id/stats - Get community statistics
  fastify.get('/profiles/:id/stats', async (request, reply) => {
    const params = request.params as { id: string };
    const stats = await communityService.getCommunityStats(params.id);
    return stats;
  });
}
