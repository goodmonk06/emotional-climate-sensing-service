# Changelog

All notable changes to the Emotional Climate Sensing Service will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - Phase 3 Complete - 2024-01-XX

### Added - Domain Expansion

#### New Entities (Phase 3)
- **CommunityProfile**: Full community management with profiles, settings, and status tracking
- **AlertRule**: Configurable threshold-based monitoring rules (sentiment_below, sentiment_above, sentiment_drop, sentiment_spike, emotion_dominant, volume alerts)
- **TriggeredAlert**: Alert history with acknowledge/resolve workflow
- **AnalyticsSummary**: Pre-computed statistics for daily/weekly/monthly periods
- **EventLog**: Comprehensive audit trail for all significant events
- **IntegrationConfig**: External service connection management (Slack, Discord, Email, Webhook, Teams)

#### Event System
- **EventBus**: Pub/sub pattern for domain events with type-safe event handling
- **Domain Events**: SignalIngestedEvent, AnalysisCompletedEvent, SnapshotCreatedEvent, ClimateShiftDetectedEvent, AlertTriggeredEvent, AlertResolvedEvent
- **Event Handlers**: LoggingHandler (logs all events), MetricsHandler (records metrics automatically)
- Extensible event handler registration system

#### New Services
- **CommunityService**: CRUD operations for communities, statistics, configuration management
- **AlertService**: Alert rule management, automatic evaluation, notification triggering

#### Notification Adapters
- **INotificationAdapter**: Interface for pluggable notification systems
- **StubNotificationAdapter**: Testing implementation
- **WebhookNotificationAdapter**: Generic webhook notifications with secret support

#### CLI Tools
- `cli analyze-community <id>`: Force analysis and snapshot generation
- `cli backfill <communityId> <days>`: Regenerate historical snapshots
- `cli test-alert <ruleId>`: Test alert rule configuration
- `cli stats [communityId]`: Show global or community-specific statistics
- `cli cleanup <days>`: Archive old data
- `cli list-communities`: List all communities with stats

#### API Endpoints (Phase 3)
- `POST /api/communities/profiles`: Create community
- `GET /api/communities/profiles/:id`: Get community details
- `GET /api/communities/profiles`: List communities with filtering
- `PATCH /api/communities/profiles/:id`: Update community
- `DELETE /api/communities/profiles/:id`: Archive community
- `GET /api/communities/profiles/:id/stats`: Community statistics
- `POST /api/alerts/rules`: Create alert rule
- `GET /api/alerts/rules/:id`: Get alert rule
- `GET /api/alerts/rules`: List alert rules for community
- `PATCH /api/alerts/rules/:id`: Update alert rule
- `DELETE /api/alerts/rules/:id`: Delete alert rule
- `GET /api/alerts/triggered`: Get triggered alerts
- `POST /api/alerts/triggered/:id/acknowledge`: Acknowledge alert
- `POST /api/alerts/triggered/:id/resolve`: Resolve alert
- `GET /metrics`: Metrics endpoint for monitoring

### Added - Infrastructure (Phase 2)

#### Logging System
- **Pino**: Structured JSON logging with pretty-print in development
- Contextual loggers per module (ingestion, analysis, climate, api, events, alerts, community)
- Configurable log levels
- Request/response logging in Fastify

#### Metrics System
- **MetricsCollector**: In-memory metrics with counters, gauges, histograms
- Timing utilities for async operations
- Automatic metric recording via event handlers
- Metrics exposed via `/metrics` endpoint

#### Error Handling
- **AppError** hierarchy: ValidationError, NotFoundError, UnauthorizedError, ForbiddenError, ConflictError, ExternalServiceError
- Centralized error handler in Fastify
- Consistent error response format
- HTTP status code mapping

#### Configuration Management
- **Zod-validated** environment variables
- Type-safe config access
- Default values and validation errors
- Extended config options for analysis, snapshots, rate limiting

#### Testing Infrastructure
- **Vitest**: Fast, modern test runner
- Test coverage reporting with v8
- Test setup with silent logging
- Comprehensive test suites for adapters, metrics, errors, and services

### Changed

#### Enhanced Services
- **IngestionService**: Added metrics and event publishing
- **AnalysisService**: Enhanced error handling and logging
- **ClimateService**: Added signalCount tracking, improved summary generation
- All services now use structured logging and publish domain events

#### API Improvements
- Global error handler for consistent error responses
- Enhanced health endpoint with service status details
- Request logging and metrics tracking
- Better input validation with detailed error messages

#### Database Schema
- Added `signalCount` to ClimateSnapshot
- Added foreign key relationship: ClimateSnapshot → CommunityProfile
- Multiple new tables with proper indexes and constraints
- Comprehensive enum types for statuses and conditions

### Documentation

#### New Documentation
- **docs/PHASE3_OVERVIEW.md**: Comprehensive Phase 3 plan and implementation details
- **docs/ARCHITECTURE.md**: Detailed system architecture, layers, data flow, extension points
- **CONTRIBUTING.md**: Contribution guidelines
- **CHANGELOG.md**: This file

#### Enhanced README
- Updated with new features and endpoints
- Added examples for community management and alerts
- CLI tool documentation
- Integration patterns

### Development Experience

#### New Scripts
- `pnpm cli <command>`: Run CLI tools
- `pnpm test:watch`: Watch mode for tests
- `pnpm test:coverage`: Generate coverage reports
- `pnpm typecheck`: Type checking without emit
- `pnpm format`: Code formatting with Prettier
- `pnpm db:reset`: Reset database for development

## [1.0.0] - Initial Release - 2024-01-XX

### Added

#### Core Features
- Signal ingestion API for text signals from multiple sources
- Emotion analysis with pluggable adapter system
- Climate snapshot generation with time-window aggregation
- Next.js dashboard for visualization
- Docker deployment setup

#### Entities
- SignalSource: Signal origin tracking
- RawSignal: Ingested text with metadata
- EmotionalAnalysis: AI-generated emotion data
- ClimateSnapshot: Aggregated emotional state

#### Services
- IngestionService: Signal validation and storage
- AnalysisService: Emotion analysis pipeline
- ClimateService: Snapshot generation and aggregation

#### Adapters
- StubEmotionAnalyzer: Rule-based emotion detection
- OpenAIEmotionAnalyzer: GPT-powered emotion analysis

#### API Endpoints
- `POST /api/signals/ingest`: Ingest signals
- `GET /api/signals/unanalyzed`: Get pending signals
- `POST /api/analysis/process`: Run analysis batch
- `GET /api/analysis/stats`: Analysis statistics
- `GET /api/communities`: List communities
- `GET /api/communities/:id/climate/latest`: Latest snapshot
- `GET /api/communities/:id/climate/history`: Snapshot history
- `POST /api/communities/:id/climate/snapshot`: Create snapshot
- `GET /health`: Health check

#### Dashboard
- Communities list with sentiment overview
- Community detail page with charts
- Sentiment trend line chart
- Emotion distribution pie chart
- Responsive design with Tailwind CSS

#### Infrastructure
- Monorepo with pnpm workspaces
- PostgreSQL + Prisma ORM
- TypeScript throughout
- Docker Compose setup
- Database migrations and seeding

---

## Upgrade Guide

### Upgrading to 1.1.0 (Phase 3)

#### Database Migration

The schema has significant changes. Run:

```bash
pnpm db:migrate
```

This will add new tables: CommunityProfile, AlertRule, TriggeredAlert, AnalyticsSummary, EventLog, IntegrationConfig.

#### Environment Variables

New optional variables:
- `ANALYSIS_BATCH_SIZE` (default: 50)
- `RATE_LIMIT_MAX` (default: 100)
- `RATE_LIMIT_WINDOW_MS` (default: 60000)

#### Breaking Changes

None - all changes are additive. Existing APIs remain compatible.

#### Recommendations

1. Create CommunityProfile entries for existing communities:
   ```bash
   pnpm cli list-communities
   ```

2. Configure alert rules for monitoring:
   ```typescript
   POST /api/alerts/rules
   {
     "communityId": "team-alpha",
     "name": "Low Sentiment Alert",
     "conditionType": "sentiment_below",
     "threshold": -0.3,
     "actionsJson": { "notify": true }
   }
   ```

3. Enable event handlers in your startup code:
   ```typescript
   import { eventBus, createLoggingHandler, createMetricsHandler } from './events';

   eventBus.onAny(createLoggingHandler());
   eventBus.onAny(createMetricsHandler());
   ```
