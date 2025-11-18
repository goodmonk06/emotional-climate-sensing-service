import { describe, it, expect } from 'vitest';
import { StubEmotionAnalyzer } from '../../adapters/StubEmotionAnalyzer';

describe('StubEmotionAnalyzer', () => {
  const analyzer = new StubEmotionAnalyzer();

  describe('analyze', () => {
    it('should detect positive sentiment from happy text', async () => {
      const result = await analyzer.analyze('I am so happy and excited about this amazing progress!');

      expect(result.sentimentScore).toBeGreaterThan(0);
      expect(result.emotions).toHaveLength(3);
      expect(result.emotions.some((e) => e.emotion === 'joy')).toBe(true);
      expect(result.intensityScore).toBeGreaterThan(0);
      expect(result.intensityScore).toBeLessThanOrEqual(1);
    });

    it('should detect negative sentiment from sad text', async () => {
      const result = await analyzer.analyze('I am very sad and disappointed with this terrible situation.');

      expect(result.sentimentScore).toBeLessThan(0);
      expect(result.emotions).toHaveLength(3);
      expect(result.emotions.some((e) => e.emotion === 'sadness')).toBe(true);
    });

    it('should detect neutral sentiment from neutral text', async () => {
      const result = await analyzer.analyze('The meeting is scheduled for tomorrow at 2pm.');

      expect(result.sentimentScore).toBeGreaterThanOrEqual(-0.5);
      expect(result.sentimentScore).toBeLessThanOrEqual(0.5);
      expect(result.emotions).toHaveLength(1);
    });

    it('should increase intensity score for text with exclamation marks', async () => {
      const withExclamation = await analyzer.analyze('This is great!!!');
      const withoutExclamation = await analyzer.analyze('This is great');

      expect(withExclamation.intensityScore).toBeGreaterThan(withoutExclamation.intensityScore);
    });

    it('should increase intensity score for text with capitals', async () => {
      const withCaps = await analyzer.analyze('THIS IS GREAT');
      const withoutCaps = await analyzer.analyze('this is great');

      expect(withCaps.intensityScore).toBeGreaterThan(withoutCaps.intensityScore);
    });

    it('should return model info', () => {
      const info = analyzer.getInfo();

      expect(info.provider).toBe('stub');
      expect(info.model).toBe('rule-based-v1');
      expect(info.version).toBe('1.0.0');
    });

    it('should normalize sentiment score to -1 to 1 range', async () => {
      const texts = [
        'I am extremely happy and joyful and excited!',
        'I am sad and angry and frustrated and disappointed',
        'The meeting is at 3pm',
      ];

      for (const text of texts) {
        const result = await analyzer.analyze(text);
        expect(result.sentimentScore).toBeGreaterThanOrEqual(-1);
        expect(result.sentimentScore).toBeLessThanOrEqual(1);
      }
    });

    it('should detect multiple emotions in mixed text', async () => {
      const result = await analyzer.analyze('I am happy but also anxious and worried about the future.');

      expect(result.emotions.length).toBeGreaterThan(1);
      const emotionNames = result.emotions.map((e) => e.emotion);
      expect(emotionNames.some((e) => ['joy', 'fear', 'anxiety'].includes(e))).toBe(true);
    });
  });
});
