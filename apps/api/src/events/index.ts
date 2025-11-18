// Event system exports
export * from './types';
export * from './EventBus';
export { createLoggingHandler } from './handlers/LoggingHandler';
export { createMetricsHandler } from './handlers/MetricsHandler';

// Helper function to create a domain event
export function createEvent<T>(type: string, data: T, metadata?: Record<string, any>) {
  return {
    type,
    timestamp: new Date(),
    data,
    metadata,
  };
}
