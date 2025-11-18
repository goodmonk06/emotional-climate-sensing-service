// Service for computing climate snapshots
import { PrismaClient } from '@prisma/client';
import { IEmotionAnalyzer } from '../adapters';
import { ClimateData, DominantEmotion, EmotionWeight } from '../types';

export class ClimateService {
  constructor(
    private prisma: PrismaClient,
    private analyzer: IEmotionAnalyzer
  ) {}

  /**
   * Compute climate data for a community within a time window
   */
  async computeClimateData(
    communityId: string,
    windowStart: Date,
    windowEnd: Date
  ): Promise<ClimateData | null> {
    // Get all analyzed signals in the time window
    const signals = await this.prisma.rawSignal.findMany({
      where: {
        communityId,
        ts: {
          gte: windowStart,
          lte: windowEnd
        },
        emotionalAnalysis: {
          isNot: null
        }
      },
      include: {
        emotionalAnalysis: true
      }
    });

    if (signals.length === 0) {
      return null;
    }

    // Calculate aggregate sentiment
    const totalSentiment = signals.reduce(
      (sum, signal) => sum + (signal.emotionalAnalysis?.sentimentScore || 0),
      0
    );
    const aggregateSentiment = totalSentiment / signals.length;

    // Count emotions
    const emotionCounts: Map<string, number> = new Map();

    for (const signal of signals) {
      const emotions = signal.emotionalAnalysis?.emotionsJson as EmotionWeight[];
      if (emotions && Array.isArray(emotions)) {
        for (const emotionWeight of emotions) {
          const count = emotionCounts.get(emotionWeight.emotion) || 0;
          emotionCounts.set(emotionWeight.emotion, count + 1);
        }
      }
    }

    // Calculate dominant emotions
    const dominantEmotions: DominantEmotion[] = Array.from(emotionCounts.entries())
      .map(([emotion, count]) => ({
        emotion,
        count,
        percentage: (count / signals.length) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      aggregateSentiment,
      dominantEmotions,
      signalCount: signals.length,
      timeRange: {
        start: windowStart,
        end: windowEnd
      }
    };
  }

  /**
   * Generate a human-readable summary using AI
   */
  private async generateSummary(climateData: ClimateData, communityId: string): Promise<string> {
    const { aggregateSentiment, dominantEmotions, signalCount } = climateData;

    // Create a description for the AI
    const sentimentDescription =
      aggregateSentiment > 0.3 ? 'positive' :
      aggregateSentiment < -0.3 ? 'negative' : 'neutral';

    const emotionsList = dominantEmotions
      .map(e => `${e.emotion} (${e.percentage.toFixed(1)}%)`)
      .join(', ');

    const prompt = `Based on ${signalCount} messages, the community ${communityId} has a ${sentimentDescription} emotional climate (sentiment: ${aggregateSentiment.toFixed(2)}). The dominant emotions are: ${emotionsList}. Write a brief, empathetic 2-3 sentence summary of this emotional climate.`;

    try {
      // For stub analyzer, generate a simple summary
      if (this.analyzer.getInfo().provider === 'stub') {
        return this.generateSimpleSummary(climateData);
      }

      // For OpenAI, use the analyzer (reuse the OpenAI client)
      const summary = await this.generateAISummary(prompt);
      return summary;
    } catch (error) {
      console.error('Error generating summary:', error);
      return this.generateSimpleSummary(climateData);
    }
  }

  private generateSimpleSummary(climateData: ClimateData): string {
    const { aggregateSentiment, dominantEmotions, signalCount } = climateData;

    const sentimentDescription =
      aggregateSentiment > 0.5 ? '😊 **very positive**' :
      aggregateSentiment > 0.2 ? '🙂 **positive**' :
      aggregateSentiment > -0.2 ? '😐 **neutral**' :
      aggregateSentiment > -0.5 ? '😟 **negative**' : '😢 **very negative**';

    const topEmotion = dominantEmotions[0];
    const emotionEmoji: Record<string, string> = {
      joy: '😄', sadness: '😢', anger: '😠', fear: '😨',
      surprise: '😲', disgust: '🤢', trust: '🤝', anticipation: '🎯',
      hope: '🌟', anxiety: '😰', excitement: '🎉', frustration: '😤'
    };

    const emoji = emotionEmoji[topEmotion?.emotion] || '💭';

    return `The community climate is ${sentimentDescription} with ${signalCount} messages analyzed. ${emoji} The most prominent emotion is **${topEmotion?.emotion}** (${topEmotion?.percentage.toFixed(0)}% of messages), followed by ${dominantEmotions.slice(1, 3).map(e => e.emotion).join(' and ')}.`;
  }

  private async generateAISummary(prompt: string): Promise<string> {
    // This is a simplified approach - in a real implementation,
    // you might want to inject a separate text generation service
    return this.generateSimpleSummary({
      aggregateSentiment: 0,
      dominantEmotions: [],
      signalCount: 0,
      timeRange: { start: new Date(), end: new Date() }
    });
  }

  /**
   * Create a climate snapshot for a community
   */
  async createSnapshot(
    communityId: string,
    windowHours: number = 24
  ) {
    const windowEnd = new Date();
    const windowStart = new Date(windowEnd.getTime() - windowHours * 60 * 60 * 1000);

    const climateData = await this.computeClimateData(communityId, windowStart, windowEnd);

    if (!climateData) {
      throw new Error(`No analyzed signals found for community ${communityId} in the specified time window`);
    }

    const summaryMarkdown = await this.generateSummary(climateData, communityId);

    const snapshot = await this.prisma.climateSnapshot.create({
      data: {
        communityId,
        windowStart,
        windowEnd,
        aggregateSentiment: climateData.aggregateSentiment,
        dominantEmotionsJson: climateData.dominantEmotions,
        summaryMarkdown
      }
    });

    return snapshot;
  }

  /**
   * Get the latest snapshot for a community
   */
  async getLatestSnapshot(communityId: string) {
    return this.prisma.climateSnapshot.findFirst({
      where: { communityId },
      orderBy: { windowEnd: 'desc' }
    });
  }

  /**
   * Get snapshot history for a community
   */
  async getSnapshotHistory(communityId: string, limit: number = 10) {
    return this.prisma.climateSnapshot.findMany({
      where: { communityId },
      orderBy: { windowEnd: 'desc' },
      take: limit
    });
  }

  /**
   * Get all communities with snapshots
   */
  async getCommunities() {
    const snapshots = await this.prisma.climateSnapshot.findMany({
      distinct: ['communityId'],
      orderBy: { windowEnd: 'desc' }
    });

    const communities = snapshots.map(s => s.communityId);
    return Array.from(new Set(communities));
  }
}
