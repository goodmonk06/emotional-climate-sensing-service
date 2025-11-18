// Domain event types

export interface DomainEvent<T = any> {
  type: string;
  timestamp: Date;
  data: T;
  metadata?: Record<string, any>;
}

// Signal Events
export interface SignalIngestedEvent extends DomainEvent {
  type: 'signal.ingested';
  data: {
    signalId: string;
    communityId: string;
    sourceId: string;
    text: string;
  };
}

export interface AnalysisCompletedEvent extends DomainEvent {
  type: 'analysis.completed';
  data: {
    signalId: string;
    analysisId: string;
    communityId: string;
    sentimentScore: number;
    emotions: Array<{ emotion: string; weight: number }>;
  };
}

// Climate Events
export interface SnapshotCreatedEvent extends DomainEvent {
  type: 'snapshot.created';
  data: {
    snapshotId: string;
    communityId: string;
    aggregateSentiment: number;
    windowStart: Date;
    windowEnd: Date;
    signalCount: number;
  };
}

export interface ClimateShiftDetectedEvent extends DomainEvent {
  type: 'climate.shift';
  data: {
    communityId: string;
    previousSentiment: number;
    currentSentiment: number;
    change: number;
    significance: 'minor' | 'moderate' | 'major';
  };
}

// Alert Events
export interface AlertTriggeredEvent extends DomainEvent {
  type: 'alert.triggered';
  data: {
    alertId: string;
    ruleId: string;
    communityId: string;
    severity: 'info' | 'warning' | 'critical';
    message: string;
    details: any;
  };
}

export interface AlertResolvedEvent extends DomainEvent {
  type: 'alert.resolved';
  data: {
    alertId: string;
    ruleId: string;
    communityId: string;
    resolvedBy: string;
  };
}

// System Events
export interface BatchAnalysisCompletedEvent extends DomainEvent {
  type: 'analysis.batch.completed';
  data: {
    processed: number;
    failed: number;
    durationMs: number;
  };
}

// Union type of all events
export type EmotionalClimateEvent =
  | SignalIngestedEvent
  | AnalysisCompletedEvent
  | SnapshotCreatedEvent
  | ClimateShiftDetectedEvent
  | AlertTriggeredEvent
  | AlertResolvedEvent
  | BatchAnalysisCompletedEvent;
