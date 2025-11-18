// Logging event handler - logs all events
import { DomainEvent } from '../types';
import { logger } from '../../lib/logger';

const eventLogger = logger.child({ module: 'event-handler' });

export function createLoggingHandler() {
  return async (event: DomainEvent) => {
    eventLogger.info(
      {
        eventType: event.type,
        timestamp: event.timestamp,
        data: event.data,
      },
      `Event: ${event.type}`
    );
  };
}
