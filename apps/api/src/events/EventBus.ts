// Simple in-memory event bus with pub/sub pattern
import { DomainEvent, EmotionalClimateEvent } from './types';
import { logger } from '../lib/logger';

const eventLogger = logger.child({ module: 'events' });

export type EventHandler<T extends DomainEvent = DomainEvent> = (event: T) => Promise<void> | void;

export class EventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private globalHandlers: Set<EventHandler> = new Set();

  /**
   * Subscribe to a specific event type
   */
  on<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }

    const handlers = this.handlers.get(eventType)!;
    handlers.add(handler as EventHandler);

    // Return unsubscribe function
    return () => {
      handlers.delete(handler as EventHandler);
      if (handlers.size === 0) {
        this.handlers.delete(eventType);
      }
    };
  }

  /**
   * Subscribe to all events
   */
  onAny(handler: EventHandler): () => void {
    this.globalHandlers.add(handler);

    return () => {
      this.globalHandlers.delete(handler);
    };
  }

  /**
   * Publish an event
   */
  async publish(event: DomainEvent): Promise<void> {
    eventLogger.debug({ event }, `Publishing event: ${event.type}`);

    const typeHandlers = this.handlers.get(event.type) || new Set();
    const allHandlers = [...typeHandlers, ...this.globalHandlers];

    if (allHandlers.length === 0) {
      eventLogger.debug(`No handlers registered for event: ${event.type}`);
      return;
    }

    // Execute all handlers (fire-and-forget, but log errors)
    const promises = allHandlers.map(async (handler) => {
      try {
        await handler(event);
      } catch (error) {
        eventLogger.error(
          { err: error, event },
          `Error in event handler for ${event.type}`
        );
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Get statistics about registered handlers
   */
  getStats() {
    return {
      eventTypes: Array.from(this.handlers.keys()),
      handlerCounts: Object.fromEntries(
        Array.from(this.handlers.entries()).map(([type, handlers]) => [type, handlers.size])
      ),
      globalHandlers: this.globalHandlers.size,
    };
  }

  /**
   * Clear all handlers (useful for testing)
   */
  clear(): void {
    this.handlers.clear();
    this.globalHandlers.clear();
  }
}

// Singleton instance
export const eventBus = new EventBus();
