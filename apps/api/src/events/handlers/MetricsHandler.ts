// Metrics event handler - records metrics for events
import { DomainEvent } from '../types';
import { metrics } from '../../lib/metrics';

export function createMetricsHandler() {
  return async (event: DomainEvent) => {
    // Increment counter for this event type
    metrics.incrementCounter('domain_events_total', 1, { type: event.type });

    // Record specific metrics based on event type
    switch (event.type) {
      case 'signal.ingested':
        metrics.incrementCounter('signals_ingested_total', 1, {
          communityId: event.data.communityId,
        });
        break;

      case 'analysis.completed':
        metrics.incrementCounter('analyses_completed_total', 1);
        metrics.recordHistogram('sentiment_score', event.data.sentimentScore);
        break;

      case 'snapshot.created':
        metrics.incrementCounter('snapshots_created_total', 1);
        metrics.setGauge(
          'community_sentiment',
          event.data.aggregateSentiment,
          { communityId: event.data.communityId }
        );
        break;

      case 'alert.triggered':
        metrics.incrementCounter('alerts_triggered_total', 1, {
          severity: event.data.severity,
          communityId: event.data.communityId,
        });
        break;
    }
  };
}
