# Phase 3 Overview: Emotional Climate Sensing Service

## Purpose Statement

The **Emotional Climate Sensing Service** is a specialized microservice that provides real-time emotional intelligence for community platforms, teams, and organizations. It solves the critical problem of **understanding collective emotional states** by ingesting text signals from multiple sources (chat, forums, surveys), analyzing them with AI-powered emotion detection, and producing actionable climate snapshots that enable data-driven interventions.

This service acts as the "emotional thermometer" of a larger AI-driven community ecosystem, providing the foundational layer for:
- **Predictive team health monitoring**: Detect burnout, dissatisfaction, or excitement before it becomes critical
- **Intelligent ritual planning**: Optimize timing of team activities based on emotional readiness
- **Automated intervention triggering**: Alert systems when climate crosses thresholds
- **Historical trend analysis**: Track long-term emotional patterns and correlations
- **Cross-community benchmarking**: Compare emotional climates across teams/organizations

## Current Features (as of Phase 2)

### Core Functionality
- ✅ **Signal Ingestion API**: REST endpoint for collecting text signals from external sources
- ✅ **Multi-Source Support**: Handle chat logs, forum posts, surveys with metadata tracking
- ✅ **Emotion Analysis**: Pluggable analyzer system (stub heuristic + OpenAI GPT integration)
- ✅ **Climate Snapshots**: Time-windowed aggregation of emotional data
- ✅ **Web Dashboard**: Next.js interface for visualizing community emotional states
- ✅ **Trend Visualization**: Line/pie charts showing sentiment and emotion distributions

### Technical Infrastructure
- ✅ **Monorepo Architecture**: pnpm workspaces with API + Web apps
- ✅ **PostgreSQL + Prisma**: Type-safe database access with 4 core models
- ✅ **Docker Deployment**: Full-stack docker-compose configuration
- ✅ **Logging**: Structured logging with Pino
- ✅ **Metrics**: In-memory metrics collection system
- ✅ **Error Handling**: Centralized error formatting and HTTP status mapping
- ✅ **Configuration**: Zod-validated environment configuration
- ✅ **Testing**: Vitest setup with initial test coverage

### Current Limitations

1. **Domain Model Gaps**:
   - No community profiles or configuration
   - No alert rules or threshold management
   - No user preferences or personalization
   - No analytics summaries or derived metrics
   - No webhook/notification system

2. **Integration Points**:
   - Missing event system for downstream consumers
   - No webhook adapters for external notifications
   - No plugin/extension mechanism for custom analyzers
   - Limited cross-service integration patterns

3. **Operational Gaps**:
   - No CLI tools for admin operations
   - No scheduled jobs for automatic snapshot generation
   - No data retention/archival policies
   - No rate limiting or API authentication

4. **Analytics Depth**:
   - Basic aggregation only (no statistical analysis)
   - No anomaly detection
   - No correlation tracking (e.g., events → climate shifts)
   - No predictive modeling

## Phase 3 Implementation Plan

### 1. Domain Model Expansion

**New Entities to Add**:

#### CommunityProfile
- Store community metadata, configuration, preferences
- Fields: name, description, timezone, tags, settings_json
- Use case: Customize analysis parameters per community

#### AlertRule
- Define threshold-based alerts (e.g., sentiment < -0.5 for 3 snapshots)
- Fields: condition_type, threshold, window, actions_json, enabled
- Use case: Automated notifications when climate degrades

#### AnalyticsSummary
- Pre-computed daily/weekly/monthly statistics
- Fields: period_type, stats_json (avg sentiment, emotion trends, participation)
- Use case: Fast historical queries and reporting

#### EventLog
- Track significant climate events and interventions
- Fields: event_type, severity, description, metadata_json
- Use case: Correlate interventions with climate improvements

#### IntegrationConfig
- Manage external service connections
- Fields: integration_type, credentials_json, webhook_url, enabled
- Use case: Slack, Discord, email notification setup

### 2. Event System Architecture

**Domain Events**:
- `SignalIngestedEvent`: New signal received
- `AnalysisCompletedEvent`: Emotion analysis finished
- `SnapshotCreatedEvent`: New climate snapshot generated
- `AlertTriggeredEvent`: Threshold breached
- `ClimateShiftDetectedEvent`: Significant sentiment change

**Event Handler Registry**:
- Publish-subscribe pattern with in-memory bus
- Extensible handlers for logging, metrics, notifications
- Future: Kafka/RabbitMQ integration for cross-service events

### 3. Additional Vertical Slices

#### Slice 1: Community Management
- Create/update/delete communities
- Configure alert rules per community
- View community profiles with statistics

#### Slice 2: Alert Management
- Define custom alert rules
- View triggered alerts history
- Acknowledge/resolve alerts

#### Slice 3: Analytics Dashboard
- Historical trend analysis
- Compare multiple communities
- Export reports (CSV/PDF)

### 4. Adapter Ecosystem

**Notification Adapters**:
- `INotificationAdapter`: Email, Slack, Discord, webhook
- Stub implementations for testing

**Storage Adapters**:
- `IArchiveStorage`: S3, filesystem for snapshot backups
- Implement retention policies

**External Profile Adapters**:
- `IProfileEnricher`: Enrich signals with user demographics
- Integration with HR systems, auth providers

### 5. CLI Tools

**Commands**:
- `cli analyze-community <id>`: Force analysis and snapshot
- `cli backfill <communityId> <days>`: Regenerate historical snapshots
- `cli export <communityId> <format>`: Export climate data
- `cli test-alert <ruleId>`: Test alert configuration
- `cli cleanup --older-than=90d`: Archive old data

### 6. Enhanced Seed Data

**Personas**:
- High-performing team (consistently positive)
- Struggling team (declining sentiment)
- Volatile team (high sentiment swings)
- New team (sparse data, building history)

**Scenarios**:
- Product launch excitement → post-launch fatigue
- Crisis event → recovery trajectory
- Team conflict → resolution
- Seasonal patterns (Monday blues, Friday energy)

### 7. Documentation Expansion

**New Documents**:
- `docs/ARCHITECTURE.md`: Detailed system design, layers, data flow
- `docs/DOMAIN_MODEL.md`: Entity relationships, business rules
- `docs/INTEGRATION_RECIPES.md`: How to connect external systems
- `docs/API_REFERENCE.md`: Complete API documentation
- `docs/DEPLOYMENT.md`: Production deployment guide
- `docs/CONTRIBUTING.md`: Development workflow, PR process

### 8. Quality & Robustness

- Increase test coverage to >80%
- Add integration tests for full vertical slices
- Add performance benchmarks
- Implement rate limiting
- Add request validation middleware
- Security hardening (SQL injection prevention, XSS)

## Success Metrics

By end of Phase 3, this repository should demonstrate:

1. **Richness**: 10+ domain entities, 20+ API endpoints, 100+ tests
2. **Usability**: Simple setup (`docker-compose up`), clear docs, working demo
3. **Extensibility**: 5+ adapter interfaces, plugin system, event hooks
4. **Production-Ready**: Logging, metrics, error handling, monitoring endpoints
5. **Integration-Friendly**: Clear patterns for connecting other services
6. **Well-Documented**: Architecture, API, integration guides, examples

## Timeline Estimate

- Domain expansion: 30% of effort
- Event system & adapters: 20%
- Vertical slices: 20%
- CLI & operations: 10%
- Tests & quality: 15%
- Documentation: 5%

## Next Steps

1. Expand Prisma schema with new entities
2. Implement event system foundation
3. Build community management vertical slice
4. Add notification adapters
5. Create CLI tool framework
6. Expand seed data scenarios
7. Write comprehensive tests
8. Complete documentation suite
