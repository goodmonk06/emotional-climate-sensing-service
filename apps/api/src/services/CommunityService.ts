// Service for managing communities
import { PrismaClient, CommunityStatus, Prisma } from '@prisma/client';
import { NotFoundError, ValidationError } from '../lib/errors';
import { logger } from '../lib/logger';

const communityLogger = logger.child({ module: 'community' });

export interface CreateCommunityInput {
  id?: string;
  name: string;
  description?: string;
  timezone?: string;
  tags?: string[];
  settingsJson?: any;
}

export interface UpdateCommunityInput {
  name?: string;
  description?: string;
  timezone?: string;
  tags?: string[];
  settingsJson?: any;
  status?: CommunityStatus;
}

export class CommunityService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new community profile
   */
  async createCommunity(input: CreateCommunityInput) {
    communityLogger.info({ input }, 'Creating community');

    if (!input.name || input.name.trim().length === 0) {
      throw new ValidationError('Community name is required');
    }

    const community = await this.prisma.communityProfile.create({
      data: {
        id: input.id,
        name: input.name,
        description: input.description,
        timezone: input.timezone || 'UTC',
        tags: input.tags || [],
        settingsJson: input.settingsJson || null,
      },
    });

    communityLogger.info({ communityId: community.id }, 'Community created');
    return community;
  }

  /**
   * Get a community by ID
   */
  async getCommunity(id: string) {
    const community = await this.prisma.communityProfile.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            snapshots: true,
            alertRules: true,
            eventLogs: true,
          },
        },
      },
    });

    if (!community) {
      throw new NotFoundError('CommunityProfile', id);
    }

    return community;
  }

  /**
   * List all communities
   */
  async listCommunities(options?: {
    status?: CommunityStatus;
    tags?: string[];
    limit?: number;
    offset?: number;
  }) {
    const where: Prisma.CommunityProfileWhereInput = {};

    if (options?.status) {
      where.status = options.status;
    }

    if (options?.tags && options.tags.length > 0) {
      where.tags = {
        hasSome: options.tags,
      };
    }

    const [communities, total] = await Promise.all([
      this.prisma.communityProfile.findMany({
        where,
        take: options?.limit || 50,
        skip: options?.offset || 0,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              snapshots: true,
              alertRules: true,
            },
          },
        },
      }),
      this.prisma.communityProfile.count({ where }),
    ]);

    return { communities, total };
  }

  /**
   * Update a community
   */
  async updateCommunity(id: string, input: UpdateCommunityInput) {
    // Check if exists
    await this.getCommunity(id);

    const updateData: Prisma.CommunityProfileUpdateInput = {};

    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.timezone !== undefined) updateData.timezone = input.timezone;
    if (input.tags !== undefined) updateData.tags = input.tags;
    if (input.settingsJson !== undefined) updateData.settingsJson = input.settingsJson;
    if (input.status !== undefined) updateData.status = input.status;

    const updated = await this.prisma.communityProfile.update({
      where: { id },
      data: updateData,
    });

    communityLogger.info({ communityId: id }, 'Community updated');
    return updated;
  }

  /**
   * Delete a community (soft delete by archiving)
   */
  async deleteCommunity(id: string) {
    await this.updateCommunity(id, { status: 'archived' });
    communityLogger.info({ communityId: id }, 'Community archived');
  }

  /**
   * Get community statistics
   */
  async getCommunityStats(id: string) {
    const community = await this.getCommunity(id);

    // Get latest snapshot
    const latestSnapshot = await this.prisma.climateSnapshot.findFirst({
      where: { communityId: id },
      orderBy: { windowEnd: 'desc' },
    });

    // Get signal count
    const signalCount = await this.prisma.rawSignal.count({
      where: { communityId: id },
    });

    // Get active alerts
    const activeAlerts = await this.prisma.triggeredAlert.count({
      where: {
        communityId: id,
        status: 'pending',
      },
    });

    return {
      community,
      latestSnapshot,
      signalCount,
      activeAlerts,
    };
  }
}
