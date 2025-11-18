// Service for analyzing raw signals
import { PrismaClient } from '@prisma/client';
import { IEmotionAnalyzer } from '../adapters';
import { AnalysisJobResult } from '../types';

export class AnalysisService {
  constructor(
    private prisma: PrismaClient,
    private analyzer: IEmotionAnalyzer
  ) {}

  /**
   * Analyze a single raw signal
   */
  async analyzeSignal(signalId: string) {
    try {
      const signal = await this.prisma.rawSignal.findUnique({
        where: { id: signalId },
        include: { emotionalAnalysis: true }
      });

      if (!signal) {
        throw new Error(`Signal not found: ${signalId}`);
      }

      if (signal.emotionalAnalysis) {
        console.log(`Signal ${signalId} already analyzed, skipping`);
        return signal.emotionalAnalysis;
      }

      // Perform analysis
      const result = await this.analyzer.analyze(signal.text);

      // Store analysis
      const analysis = await this.prisma.emotionalAnalysis.create({
        data: {
          rawSignalId: signal.id,
          sentimentScore: result.sentimentScore,
          emotionsJson: result.emotions,
          intensityScore: result.intensityScore,
          aiModelInfoJson: result.modelInfo || null
        }
      });

      return analysis;
    } catch (error) {
      console.error(`Error analyzing signal ${signalId}:`, error);
      throw error;
    }
  }

  /**
   * Process a batch of unanalyzed signals
   */
  async processBatch(limit: number = 50): Promise<AnalysisJobResult> {
    const signals = await this.prisma.rawSignal.findMany({
      where: {
        emotionalAnalysis: null
      },
      take: limit,
      orderBy: {
        createdAt: 'asc'
      }
    });

    const result: AnalysisJobResult = {
      processed: 0,
      failed: 0,
      errors: []
    };

    for (const signal of signals) {
      try {
        await this.analyzeSignal(signal.id);
        result.processed++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          signalId: signal.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return result;
  }

  /**
   * Get analysis statistics
   */
  async getStats() {
    const totalSignals = await this.prisma.rawSignal.count();
    const analyzedSignals = await this.prisma.emotionalAnalysis.count();
    const pendingSignals = totalSignals - analyzedSignals;

    return {
      total: totalSignals,
      analyzed: analyzedSignals,
      pending: pendingSignals,
      analyzerInfo: this.analyzer.getInfo()
    };
  }
}
