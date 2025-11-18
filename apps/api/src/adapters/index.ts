// Adapter factory and exports
import { IEmotionAnalyzer } from './IEmotionAnalyzer';
import { StubEmotionAnalyzer } from './StubEmotionAnalyzer';
import { OpenAIEmotionAnalyzer } from './OpenAIEmotionAnalyzer';

export { IEmotionAnalyzer } from './IEmotionAnalyzer';
export { StubEmotionAnalyzer } from './StubEmotionAnalyzer';
export { OpenAIEmotionAnalyzer } from './OpenAIEmotionAnalyzer';

/**
 * Factory to create the appropriate emotion analyzer based on configuration
 */
export function createEmotionAnalyzer(
  provider: string = 'stub',
  apiKey?: string
): IEmotionAnalyzer {
  switch (provider.toLowerCase()) {
    case 'openai':
      if (!apiKey) {
        console.warn('OpenAI API key not provided, falling back to stub analyzer');
        return new StubEmotionAnalyzer();
      }
      return new OpenAIEmotionAnalyzer(apiKey);

    case 'stub':
    default:
      return new StubEmotionAnalyzer();
  }
}
