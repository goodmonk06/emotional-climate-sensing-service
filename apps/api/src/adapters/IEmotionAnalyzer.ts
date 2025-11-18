// Adapter interface for emotion analysis
import { AnalysisResult } from '../types';

/**
 * Interface for emotion analysis adapters.
 * Implementations can use AI models (OpenAI, Anthropic, etc.) or rule-based heuristics.
 */
export interface IEmotionAnalyzer {
  /**
   * Analyze the emotional content of text
   * @param text - The text to analyze
   * @returns Analysis result with sentiment, emotions, and intensity
   */
  analyze(text: string): Promise<AnalysisResult>;

  /**
   * Get information about the analyzer
   */
  getInfo(): {
    provider: string;
    model: string;
    version?: string;
  };
}
