# Architecture Documentation

## Overview

The Emotional Climate Sensing Service is built as a modular microservice with clear separation of concerns. It follows Domain-Driven Design principles and clean architecture patterns.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     External Systems                        │
│  (Chat Platforms, Forums, Surveys, Webhooks, etc.)        │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Gateway (Fastify)                     │
│  ┌────────────────────────────────────────────────────────┐│
│  │  Routes: Signals, Analysis, Climate, Communities,     ││
│  │         Alerts, Health, Metrics                        ││
│  └────────────────────────────────────────────────────────┘│
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                            │
│  ┌───────────────┐ ┌────────────────┐ ┌─────────────────┐ │
│  │  Ingestion    │ │   Analysis     │ │    Climate      │ │
│  │   Service     │ │    Service     │ │    Service      │ │
│  └───────────────┘ └────────────────┘ └─────────────────┘ │
│  ┌───────────────┐ ┌────────────────┐                     │
│  │  Community    │ │     Alert      │                     │
│  │   Service     │ │    Service     │                     │
│  └───────────────┘ └────────────────┘                     │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    Domain Layer                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Adapters: Emotion Analysis, Notifications, Storage  │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Events: EventBus, DomainEvents, Handlers           │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                   Data Layer (Prisma + PostgreSQL)          │
│  ┌────────────────────────────────────────────────────────┐│
│  │  Entities: SignalSource, RawSignal,                   ││
│  │           EmotionalAnalysis, ClimateSnapshot,         ││
│  │           CommunityProfile, AlertRule, EventLog, etc.  ││
│  └────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## Layers

### 1. API Layer (`src/routes/`)

**Responsibilities**:
- HTTP request/response handling
- Input validation (Zod schemas)
- Error transformation
- Route registration

**Key Files**:
- `signals.ts`: Signal ingestion endpoints
- `analysis.ts`: Analysis pipeline control
- `climate.ts`: Climate snapshot access
- `communities.ts`: Community management
- `alerts.ts`: Alert configuration and monitoring

### 2. Service Layer (`src/services/`)

**Responsibilities**:
- Business logic implementation
- Cross-entity operations
- Transaction management
- Event publishing

**Services**:

**IngestionService**:
- Validate and store incoming signals
- Source validation
- Metadata handling

**AnalysisService**:
- Process raw signals through emotion analyzers
- Batch processing
- Error handling and retries

**ClimateService**:
- Aggregate emotional data over time windows
- Generate climate snapshots
- Produce human-readable summaries

**CommunityService**:
- CRUD operations for communities
- Community configuration
- Statistics aggregation

**AlertService**:
- Alert rule management
- Rule evaluation logic
- Alert triggering and notifications

### 3. Domain Layer (`src/domain/`, `src/events/`, `src/adapters/`)

**Adapter Interfaces**:

**IEmotionAnalyzer** (`src/adapters/`):
- Interface for emotion analysis systems
- Implementations: StubEmotionAnalyzer, OpenAIEmotionAnalyzer
- Extensible for other AI providers (Anthropic, local models, etc.)

**INotificationAdapter** (`src/domain/adapters/`):
- Interface for notification systems
- Implementations: StubNotificationAdapter, WebhookNotificationAdapter
- Future: Slack, Discord, Email adapters

**Event System** (`src/events/`):
- EventBus: Pub/sub pattern for domain events
- Event Types: Typed events for all significant operations
- Event Handlers: Logging, Metrics, Custom handlers

### 4. Infrastructure Layer (`src/lib/`)

**Logging** (`lib/logger.ts`):
- Pino-based structured logging
- Contextual loggers per module
- Development-friendly output

**Metrics** (`lib/metrics.ts`):
- In-memory metrics collection
- Counters, gauges, histograms
- Timing utilities

**Error Handling** (`lib/errors.ts`):
- Custom error hierarchy
- HTTP status code mapping
- Consistent error responses

**Configuration** (`lib/config.ts`):
- Zod-validated environment variables
- Type-safe configuration access
- Default values

### 5. Data Layer (`prisma/`)

**Entities**:

**Core Entities**:
- SignalSource: Origin of text signals
- RawSignal: Ingested text with metadata
- EmotionalAnalysis: AI-generated emotion data
- ClimateSnapshot: Aggregated emotional state

**Extended Entities (Phase 3)**:
- CommunityProfile: Community configuration
- AlertRule: Automated monitoring rules
- TriggeredAlert: Alert history
- AnalyticsSummary: Pre-computed statistics
- EventLog: Audit trail
- IntegrationConfig: External service connections

## Data Flow

### Signal Processing Flow

```
1. External System → POST /api/signals/ingest
2. IngestionService validates and stores RawSignal
3. Event: signal.ingested published
4. Manual or scheduled: POST /api/analysis/process
5. AnalysisService fetches unanalyzed signals
6. IEmotionAnalyzer analyzes each signal
7. EmotionalAnalysis created and linked
8. Event: analysis.completed published
9. Manual or scheduled: POST /api/communities/:id/climate/snapshot
10. ClimateService aggregates analyses in time window
11. ClimateSnapshot created with summary
12. Event: snapshot.created published
13. AlertService evaluates rules
14. If threshold met: TriggeredAlert created
15. Event: alert.triggered published
16. INotificationAdapter sends notifications
```

### Event Flow

```
EventBus (Singleton)
    ├─> on('signal.ingested', handler)
    ├─> on('analysis.completed', handler)
    ├─> on('snapshot.created', handler)
    ├─> on('alert.triggered', handler)
    └─> onAny(globalHandler)

Default Handlers:
    - LoggingHandler: Logs all events
    - MetricsHandler: Records metrics
    - Custom handlers can be registered
```

## Extension Points

### Adding a New Emotion Analyzer

1. Implement `IEmotionAnalyzer` interface
2. Add to `createEmotionAnalyzer` factory in `adapters/index.ts`
3. Configure via `AI_PROVIDER` environment variable

### Adding a New Notification Channel

1. Implement `INotificationAdapter` interface
2. Inject into `AlertService` constructor
3. Configure via `IntegrationConfig` entity

### Adding Custom Event Handlers

```typescript
import { eventBus } from './events';

eventBus.on('snapshot.created', async (event) => {
  // Custom logic
  await customAnalytics.track(event.data);
});
```

### Adding Custom Alert Conditions

1. Add new `AlertConditionType` enum value in Prisma schema
2. Implement evaluation logic in `AlertService.evaluateRule()`
3. Update API validation schemas

## Security Considerations

**Authentication**: Not implemented in Phase 2/3 (add JWT/OAuth for production)

**Authorization**: Not implemented (add RBAC per community)

**Input Validation**: All API inputs validated with Zod schemas

**SQL Injection**: Prevented by Prisma parameterized queries

**Secrets Management**: Store sensitive config in environment variables, encrypt `IntegrationConfig.configJson`

**Rate Limiting**: Not implemented (add per-route rate limits for production)

## Scalability Patterns

### Horizontal Scaling

- Stateless API servers (scale with load balancer)
- Database connection pooling (Prisma)
- Event bus can be swapped for distributed queue (Kafka, RabbitMQ)

### Caching Strategy

- Community statistics (5-minute TTL)
- Latest snapshots (1-minute TTL)
- Alert rules (in-memory cache, invalidate on update)

### Async Processing

- Analysis batch processing (background jobs)
- Snapshot generation (scheduled tasks)
- Alert evaluation (event-driven)

## Monitoring & Observability

**Metrics Exposed** (`/metrics` endpoint):
- `domain_events_total`: Event counts by type
- `signals_ingested_total`: Signal ingestion rate
- `analyses_completed_total`: Analysis throughput
- `snapshots_created_total`: Snapshot generation
- `alerts_triggered_total`: Alert frequency
- `sentiment_score`: Sentiment histogram
- `community_sentiment`: Per-community gauge

**Logging**:
- Structured JSON logs (Pino)
- Module-level context
- Request/response logging
- Error stack traces

**Health Checks**:
- `/health`: Database connectivity, service status
- Includes analyzer info and version

## Technology Choices

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| API Framework | Fastify | High performance, TypeScript support, plugin ecosystem |
| Database | PostgreSQL | JSONB support, reliability, ACID compliance |
| ORM | Prisma | Type safety, migrations, excellent DX |
| Validation | Zod | Runtime + compile-time type safety |
| Logging | Pino | Fast, structured logging |
| Testing | Vitest | Fast, modern, Vite-based |
| AI Provider | OpenAI (pluggable) | State-of-the-art emotion understanding, adapter pattern allows swapping |

## Future Enhancements

1. **Real-time Updates**: WebSocket support for live climate updates
2. **Machine Learning**: Train custom emotion models on historical data
3. **Multi-language Support**: Analyze non-English text
4. **Anomaly Detection**: ML-based outlier detection
5. **Predictive Analytics**: Forecast future climate trends
6. **Data Export**: CSV, PDF report generation
7. **Admin UI**: Manage communities, alerts, integrations
8. **API Authentication**: JWT-based auth with API keys
9. **Rate Limiting**: Per-user/per-community limits
10. **Distributed Events**: Kafka integration for cross-service communication
