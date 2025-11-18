import { describe, it, expect, beforeEach } from 'vitest';
import { MetricsCollector } from '../../lib/metrics';

describe('MetricsCollector', () => {
  let metrics: MetricsCollector;

  beforeEach(() => {
    metrics = new MetricsCollector();
  });

  describe('incrementCounter', () => {
    it('should increment a counter', () => {
      metrics.incrementCounter('test_counter');
      metrics.incrementCounter('test_counter');

      const allMetrics = metrics.getMetrics();
      expect(allMetrics.counters['test_counter']).toBe(2);
    });

    it('should increment a counter with custom value', () => {
      metrics.incrementCounter('test_counter', 5);

      const allMetrics = metrics.getMetrics();
      expect(allMetrics.counters['test_counter']).toBe(5);
    });

    it('should support labels', () => {
      metrics.incrementCounter('http_requests', 1, { method: 'GET', path: '/api/test' });
      metrics.incrementCounter('http_requests', 1, { method: 'POST', path: '/api/test' });

      const allMetrics = metrics.getMetrics();
      expect(allMetrics.counters['http_requests{method="GET",path="/api/test"}']).toBe(1);
      expect(allMetrics.counters['http_requests{method="POST",path="/api/test"}']).toBe(1);
    });
  });

  describe('setGauge', () => {
    it('should set a gauge value', () => {
      metrics.setGauge('memory_usage', 100);

      const allMetrics = metrics.getMetrics();
      expect(allMetrics.gauges['memory_usage']).toBe(100);
    });

    it('should overwrite previous gauge value', () => {
      metrics.setGauge('memory_usage', 100);
      metrics.setGauge('memory_usage', 200);

      const allMetrics = metrics.getMetrics();
      expect(allMetrics.gauges['memory_usage']).toBe(200);
    });
  });

  describe('recordHistogram', () => {
    it('should record histogram values', () => {
      metrics.recordHistogram('request_duration', 10);
      metrics.recordHistogram('request_duration', 20);
      metrics.recordHistogram('request_duration', 30);

      const allMetrics = metrics.getMetrics();
      const histogram = allMetrics.histograms['request_duration'];

      expect(histogram.count).toBe(3);
      expect(histogram.sum).toBe(60);
      expect(histogram.avg).toBe(20);
      expect(histogram.min).toBe(10);
      expect(histogram.max).toBe(30);
    });
  });

  describe('timeAsync', () => {
    it('should time an async function', async () => {
      const result = await metrics.timeAsync('test_operation', async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return 'done';
      });

      expect(result).toBe('done');

      const allMetrics = metrics.getMetrics();
      const histogram = allMetrics.histograms['test_operation_duration_ms'];

      expect(histogram.count).toBe(1);
      expect(histogram.min).toBeGreaterThan(5);
    });

    it('should record duration even if function throws', async () => {
      try {
        await metrics.timeAsync('failing_operation', async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          throw new Error('Test error');
        });
      } catch (error) {
        // Expected
      }

      const allMetrics = metrics.getMetrics();
      const histogram = allMetrics.histograms['failing_operation_duration_ms{error="true"}'];

      expect(histogram.count).toBe(1);
      expect(histogram.min).toBeGreaterThan(5);
    });
  });

  describe('reset', () => {
    it('should reset all metrics', () => {
      metrics.incrementCounter('test_counter');
      metrics.setGauge('test_gauge', 100);
      metrics.recordHistogram('test_histogram', 10);

      metrics.reset();

      const allMetrics = metrics.getMetrics();
      expect(Object.keys(allMetrics.counters).length).toBe(0);
      expect(Object.keys(allMetrics.gauges).length).toBe(0);
      expect(Object.keys(allMetrics.histograms).length).toBe(0);
    });
  });
});

// Export the class for other tests
export class MetricsCollector {
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();

  incrementCounter(name: string, value: number = 1, labels?: Record<string, string | number>): void {
    const key = this.buildKey(name, labels);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);
  }

  setGauge(name: string, value: number, labels?: Record<string, string | number>): void {
    const key = this.buildKey(name, labels);
    this.gauges.set(key, value);
  }

  recordHistogram(name: string, value: number, labels?: Record<string, string | number>): void {
    const key = this.buildKey(name, labels);
    const values = this.histograms.get(key) || [];
    values.push(value);
    this.histograms.set(key, values);
  }

  async timeAsync<T>(name: string, fn: () => Promise<T>, labels?: Record<string, string | number>): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.recordHistogram(`${name}_duration_ms`, duration, labels);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.recordHistogram(`${name}_duration_ms`, duration, { ...labels, error: 'true' });
      throw error;
    }
  }

  getMetrics() {
    return {
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      histograms: Object.fromEntries(
        Array.from(this.histograms.entries()).map(([key, values]) => [
          key,
          {
            count: values.length,
            sum: values.reduce((a, b) => a + b, 0),
            avg: values.reduce((a, b) => a + b, 0) / values.length,
            min: Math.min(...values),
            max: Math.max(...values),
          },
        ])
      ),
    };
  }

  reset(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }

  private buildKey(name: string, labels?: Record<string, string | number>): string {
    if (!labels || Object.keys(labels).length === 0) {
      return name;
    }
    const labelStr = Object.entries(labels)
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    return `${name}{${labelStr}}`;
  }
}
