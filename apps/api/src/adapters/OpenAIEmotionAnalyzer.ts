// OpenAI-based emotion analyzer
import OpenAI from 'openai';
import { IEmotionAnalyzer } from './IEmotionAnalyzer';
import { AnalysisResult, EmotionWeight } from '../types';

/**
 * Emotion analyzer using OpenAI GPT models
 */
export class OpenAIEmotionAnalyzer implements IEmotionAnalyzer {
  private openai: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string = 'gpt-3.5-turbo') {
    this.openai = new OpenAI({ apiKey });
    this.model = model;
  }

  async analyze(text: string): Promise<AnalysisResult> {
    const systemPrompt = `You are an expert emotion and sentiment analyzer. Analyze the emotional content of text and respond ONLY with valid JSON in this exact format:
{
  "sentimentScore": <number between -1 and 1>,
  "emotions": [
    {"emotion": "<emotion_name>", "weight": <number between 0 and 1>}
  ],
  "intensityScore": <number between 0 and 1>
}

Sentiment score: -1 = very negative, 0 = neutral, 1 = very positive
Emotions can include: joy, sadness, anger, fear, surprise, disgust, trust, anticipation, hope, anxiety, excitement, frustration, contentment, confusion, etc.
List up to 3 most prominent emotions with their weights (0-1).
Intensity: 0 = mild/calm, 1 = very intense/strong`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze this text: "${text}"` }
        ],
        temperature: 0.3,
        max_tokens: 200
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Parse the JSON response
      const parsed = JSON.parse(content);

      // Validate and normalize the response
      const sentimentScore = Math.max(-1, Math.min(1, parsed.sentimentScore || 0));
      const intensityScore = Math.max(0, Math.min(1, parsed.intensityScore || 0.5));

      const emotions: EmotionWeight[] = (parsed.emotions || [])
        .slice(0, 3)
        .map((e: any) => ({
          emotion: e.emotion,
          weight: Math.max(0, Math.min(1, e.weight || 0))
        }));

      // Ensure we have at least one emotion
      if (emotions.length === 0) {
        if (sentimentScore > 0.3) {
          emotions.push({ emotion: 'joy', weight: 0.6 });
        } else if (sentimentScore < -0.3) {
          emotions.push({ emotion: 'sadness', weight: 0.6 });
        } else {
          emotions.push({ emotion: 'neutral', weight: 0.7 });
        }
      }

      return {
        sentimentScore,
        emotions,
        intensityScore,
        modelInfo: {
          provider: 'openai',
          model: this.model,
          version: completion.model
        }
      };
    } catch (error) {
      console.error('OpenAI analysis error:', error);

      // Fallback to a neutral analysis if API fails
      return {
        sentimentScore: 0,
        emotions: [{ emotion: 'neutral', weight: 0.5 }],
        intensityScore: 0.3,
        modelInfo: {
          provider: 'openai',
          model: this.model,
          version: 'error-fallback'
        }
      };
    }
  }

  getInfo() {
    return {
      provider: 'openai',
      model: this.model
    };
  }
}
