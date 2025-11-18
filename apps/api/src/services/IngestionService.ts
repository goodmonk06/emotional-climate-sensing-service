// Service for ingesting raw signals
import { PrismaClient } from '@prisma/client';
import { IngestSignalRequest, IngestSignalResponse } from '../types';

export class IngestionService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Ingest a new signal from a source
   */
  async ingestSignal(request: IngestSignalRequest): Promise<IngestSignalResponse> {
    try {
      // Validate source key
      const source = await this.prisma.signalSource.findUnique({
        where: { key: request.sourceKey }
      });

      if (!source) {
        return {
          success: false,
          signalId: '',
          message: `Invalid source key: ${request.sourceKey}`
        };
      }

      // Create raw signal
      const rawSignal = await this.prisma.rawSignal.create({
        data: {
          sourceId: source.id,
          communityId: request.communityId,
          externalMessageId: request.externalMessageId,
          authorRef: request.authorRef,
          text: request.text,
          ts: new Date(request.ts),
          metaJson: request.meta || null
        }
      });

      return {
        success: true,
        signalId: rawSignal.id,
        message: 'Signal ingested successfully'
      };
    } catch (error) {
      console.error('Error ingesting signal:', error);
      return {
        success: false,
        signalId: '',
        message: `Failed to ingest signal: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get unanalyzed signals
   */
  async getUnanalyzedSignals(limit: number = 100) {
    return this.prisma.rawSignal.findMany({
      where: {
        emotionalAnalysis: null
      },
      take: limit,
      orderBy: {
        createdAt: 'asc'
      }
    });
  }
}
