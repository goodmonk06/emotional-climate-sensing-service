// Stub implementation for testing without AI
import { IEmotionAnalyzer } from './IEmotionAnalyzer';
import { AnalysisResult } from '../types';

/**
 * Simple rule-based emotion analyzer for development/testing
 * Uses basic keyword matching and sentiment heuristics
 */
export class StubEmotionAnalyzer implements IEmotionAnalyzer {
  private positiveWords = [
    'happy', 'joy', 'excited', 'great', 'excellent', 'wonderful', 'amazing',
    'love', 'good', 'nice', 'awesome', 'fantastic', 'brilliant', 'perfect',
    'thanks', 'thank', 'appreciate', 'grateful', 'delighted', 'pleased'
  ];

  private negativeWords = [
    'sad', 'angry', 'frustrated', 'bad', 'terrible', 'awful', 'horrible',
    'hate', 'angry', 'upset', 'disappointed', 'annoyed', 'worried', 'anxious',
    'concerned', 'problem', 'issue', 'difficult', 'wrong', 'fail', 'error'
  ];

  private emotionKeywords: Record<string, string[]> = {
    joy: ['happy', 'joy', 'excited', 'delighted', 'thrilled', 'love'],
    sadness: ['sad', 'unhappy', 'depressed', 'down', 'blue', 'disappointed'],
    anger: ['angry', 'mad', 'furious', 'annoyed', 'frustrated', 'irritated'],
    fear: ['afraid', 'scared', 'worried', 'anxious', 'nervous', 'concerned'],
    surprise: ['surprised', 'shocked', 'amazed', 'astonished', 'unexpected'],
    disgust: ['disgusted', 'revolted', 'awful', 'horrible', 'terrible'],
    trust: ['trust', 'confident', 'reliable', 'secure', 'faith'],
    anticipation: ['excited', 'looking forward', 'hopeful', 'anticipate', 'eager']
  };

  async analyze(text: string): Promise<AnalysisResult> {
    const lowerText = text.toLowerCase();
    const words = lowerText.split(/\s+/);

    // Calculate sentiment score
    let positiveCount = 0;
    let negativeCount = 0;

    for (const word of words) {
      if (this.positiveWords.some(pw => word.includes(pw))) {
        positiveCount++;
      }
      if (this.negativeWords.some(nw => word.includes(nw))) {
        negativeCount++;
      }
    }

    const totalSentimentWords = positiveCount + negativeCount;
    let sentimentScore = 0;

    if (totalSentimentWords > 0) {
      sentimentScore = (positiveCount - negativeCount) / totalSentimentWords;
    }

    // Detect emotions
    const detectedEmotions: Array<{ emotion: string; weight: number }> = [];

    for (const [emotion, keywords] of Object.entries(this.emotionKeywords)) {
      let matchCount = 0;
      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
          matchCount++;
        }
      }
      if (matchCount > 0) {
        const weight = Math.min(matchCount * 0.3, 1.0);
        detectedEmotions.push({ emotion, weight });
      }
    }

    // Sort by weight and take top emotions
    detectedEmotions.sort((a, b) => b.weight - a.weight);
    const topEmotions = detectedEmotions.slice(0, 3);

    // If no emotions detected, provide a neutral default
    if (topEmotions.length === 0) {
      if (sentimentScore > 0.3) {
        topEmotions.push({ emotion: 'joy', weight: 0.5 });
      } else if (sentimentScore < -0.3) {
        topEmotions.push({ emotion: 'sadness', weight: 0.5 });
      } else {
        topEmotions.push({ emotion: 'neutral', weight: 0.7 });
      }
    }

    // Calculate intensity based on exclamation marks, caps, and sentiment strength
    const exclamationCount = (text.match(/!/g) || []).length;
    const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
    const intensityScore = Math.min(
      (Math.abs(sentimentScore) * 0.5) +
      (exclamationCount * 0.1) +
      (capsRatio * 0.4),
      1.0
    );

    return {
      sentimentScore: Math.max(-1, Math.min(1, sentimentScore)),
      emotions: topEmotions,
      intensityScore,
      modelInfo: {
        provider: 'stub',
        model: 'rule-based-v1',
        version: '1.0.0'
      }
    };
  }

  getInfo() {
    return {
      provider: 'stub',
      model: 'rule-based-v1',
      version: '1.0.0'
    };
  }
}
