# 🌡️ Emotional Climate Sensing Service

> チャットログやアンケートから「今の場の感情温度」を推定し、ポジ/ネガの変化を追跡するエモーショナル・クライメイトセンサー。

A sophisticated service that senses the **emotional climate** of communities by analyzing text signals from various sources (chat logs, forum posts, surveys) and producing actionable insights about the collective emotional state.

## 🎯 Concept

The Emotional Climate Sensing Service provides:

- **Signal Ingestion**: Collect text signals from multiple sources (chat platforms, forums, surveys)
- **Emotion Analysis**: Detect sentiment, emotional categories, and intensity using AI or heuristic models
- **Climate Snapshots**: Aggregate emotions over time windows to produce "climate snapshots" (e.g., grounded, anxious, excited)
- **API & Dashboard**: Expose data through REST API and visualize in a Next.js dashboard

## 🏗️ Architecture

### Tech Stack

- **Backend**: Node.js + Fastify, TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **AI Models**: Adapter pattern supporting OpenAI (or heuristic fallback)
- **Frontend**: Next.js 14 with App Router, Recharts for visualization
- **Monorepo**: pnpm workspaces
- **Deployment**: Docker + docker-compose

### Domain Model

```
SignalSource        → RawSignal → EmotionalAnalysis
                          ↓
                    ClimateSnapshot
```

**Models** (Prisma):

1. **SignalSource**: Represents a source of signals (chat platform, forum, survey tool)
   - `id`, `key`, `name`, `sourceType`, `metaJson`, `createdAt`

2. **RawSignal**: Text signal ingested from a source
   - `id`, `sourceId`, `communityId`, `text`, `ts`, `authorRef`, `metaJson`

3. **EmotionalAnalysis**: AI-generated emotional analysis
   - `id`, `rawSignalId`, `sentimentScore` (-1 to +1), `emotionsJson`, `intensityScore`, `aiModelInfoJson`

4. **ClimateSnapshot**: Aggregated climate for a community over a time window
   - `id`, `communityId`, `windowStart`, `windowEnd`, `aggregateSentiment`, `dominantEmotionsJson`, `summaryMarkdown`

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm 8+
- PostgreSQL 14+ (or use Docker)
- OpenAI API key (optional, for AI-powered analysis)

### Development Setup

1. **Clone and Install**

```bash
# Clone the repository
git clone <repository-url>
cd emotional-climate-sensing-service

# Install dependencies
pnpm install
```

2. **Environment Configuration**

```bash
# Copy environment files
cp .env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Edit apps/api/.env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/emotional_climate?schema=public"
AI_PROVIDER=stub  # or 'openai'
OPENAI_API_KEY=sk-...  # if using OpenAI
PORT=3001
CORS_ORIGIN=http://localhost:3000
```

3. **Start Database**

```bash
# Option 1: Use Docker for PostgreSQL only
docker-compose -f docker-compose.dev.yml up -d

# Option 2: Use your own PostgreSQL instance
# Make sure it's running and update DATABASE_URL accordingly
```

4. **Initialize Database**

```bash
# Run migrations
pnpm db:migrate

# Seed with sample data
pnpm db:seed
```

5. **Start Development Servers**

```bash
# Start both API and Web in parallel
pnpm dev

# Or start individually:
# Terminal 1: API server
cd apps/api && pnpm dev

# Terminal 2: Web dashboard
cd apps/web && pnpm dev
```

6. **Access the Application**

- API: http://localhost:3001
- Dashboard: http://localhost:3000
- Health check: http://localhost:3001/health

## 📊 Usage Flow

### 1. Ingest Signals

Send text signals to the API:

```bash
curl -X POST http://localhost:3001/api/signals/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "sourceKey": "chat-platform-1",
    "communityId": "team-alpha",
    "text": "This is amazing! I am so excited about our progress!",
    "ts": "2024-01-15T10:30:00Z",
    "authorRef": "user-123",
    "meta": {
      "channel": "general"
    }
  }'
```

### 2. Process Analysis

Run the analysis pipeline to analyze unprocessed signals:

```bash
curl -X POST http://localhost:3001/api/analysis/process?limit=50
```

Response:
```json
{
  "success": true,
  "processed": 23,
  "failed": 0,
  "errors": []
}
```

### 3. Create Climate Snapshot

Generate a snapshot for a community:

```bash
curl -X POST http://localhost:3001/api/communities/team-alpha/climate/snapshot?windowHours=24
```

### 4. View Results

**Get Latest Snapshot:**
```bash
curl http://localhost:3001/api/communities/team-alpha/climate/latest
```

**Get Snapshot History:**
```bash
curl http://localhost:3001/api/communities/team-alpha/climate/history?limit=10
```

**View in Dashboard:**
Open http://localhost:3000 in your browser to see the visual dashboard.

## 🔌 API Reference

### Signal Ingestion

- `POST /api/signals/ingest` - Ingest a new signal
- `GET /api/signals/unanalyzed?limit=100` - Get unanalyzed signals

### Analysis

- `POST /api/analysis/process?limit=50` - Process pending signals
- `GET /api/analysis/stats` - Get analysis statistics

### Climate

- `GET /api/communities` - List all communities
- `GET /api/communities/:id/climate/latest` - Get latest snapshot
- `GET /api/communities/:id/climate/history?limit=10` - Get snapshot history
- `POST /api/communities/:id/climate/snapshot?windowHours=24` - Create new snapshot

### Health

- `GET /health` - Health check endpoint

## 🎨 Dashboard Features

The Next.js dashboard provides:

- **Communities List**: Overview of all communities with current sentiment
- **Community Detail**: Detailed view with:
  - Current climate summary with sentiment score
  - Dominant emotions with percentages
  - Emotion distribution pie chart
  - Sentiment trend line chart
  - Recent snapshots timeline

## 🔧 Configuration

### AI Provider Selection

**Stub Analyzer** (Default - no API key needed):
```env
AI_PROVIDER=stub
```
Uses rule-based keyword matching for development/testing.

**OpenAI Analyzer**:
```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
```
Uses GPT models for sophisticated emotion analysis.

### Snapshot Window

Configure the time window for climate snapshots:
```env
SNAPSHOT_WINDOW_HOURS=24  # Default: 24 hours
```

## 🐳 Docker Deployment

### Full Stack (Production)

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

Services:
- PostgreSQL: `localhost:5432`
- API: `localhost:3001`
- Web: `localhost:3000`

### Environment Variables for Docker

Create a `.env` file in the root:

```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
```

## 📦 Project Structure

```
emotional-climate-sensing-service/
├── apps/
│   ├── api/                    # Backend API service
│   │   ├── src/
│   │   │   ├── adapters/       # Emotion analyzer adapters
│   │   │   ├── routes/         # API routes
│   │   │   ├── services/       # Business logic
│   │   │   ├── types/          # TypeScript types
│   │   │   └── index.ts        # Server entry point
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # Database schema
│   │   │   └── seed.ts         # Seed data
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── web/                    # Next.js dashboard
│       ├── app/
│       │   ├── layout.tsx      # Root layout
│       │   ├── page.tsx        # Communities list
│       │   └── communities/[id]/page.tsx
│       ├── components/         # React components
│       ├── lib/                # Utilities and API client
│       ├── Dockerfile
│       └── package.json
│
├── docker-compose.yml          # Production compose
├── docker-compose.dev.yml      # Development compose
├── pnpm-workspace.yaml         # Workspace config
├── package.json                # Root package
└── README.md
```

## 🧪 Development Commands

```bash
# Install dependencies
pnpm install

# Run development servers (API + Web)
pnpm dev

# Build all apps
pnpm build

# Run tests
pnpm test

# Lint code
pnpm lint

# Database operations
pnpm db:migrate      # Run migrations
pnpm db:seed         # Seed database
pnpm db:studio       # Open Prisma Studio

# Clean build artifacts
pnpm clean
```

## 🔄 Integration Examples

### Community Health Analytics Integration

Other services can consume climate data:

```typescript
// Fetch current climate for decision-making
const climate = await fetch('http://api:3001/api/communities/team-alpha/climate/latest')
  .then(r => r.json());

if (climate.aggregateSentiment < -0.5) {
  // Trigger intervention: schedule team building
  await scheduleIntervention('team-alpha', 'team-building');
}
```

### Ritual Planner Integration

Use emotional climate to optimize ritual timing:

```typescript
// Check if community is ready for a challenging ritual
const climate = await getLatestClimate('team-alpha');
const dominantEmotion = climate.dominantEmotionsJson[0].emotion;

if (dominantEmotion === 'anxiety' || climate.aggregateSentiment < -0.3) {
  // Postpone challenging rituals
  await postponeRitual('difficult-retro');
} else if (dominantEmotion === 'joy' && climate.aggregateSentiment > 0.5) {
  // Good time for ambitious initiatives
  await scheduleRitual('innovation-sprint');
}
```

### Ingestion from External Systems

**Slack Integration Example:**

```typescript
// apps/integrations/slack-bot.ts
import { WebClient } from '@slack/web-api';

const slack = new WebClient(process.env.SLACK_TOKEN);

// Listen for messages
slackEvents.on('message', async (event) => {
  // Ingest message to climate service
  await fetch('http://api:3001/api/signals/ingest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sourceKey: 'slack-workspace-1',
      communityId: event.channel,
      text: event.text,
      ts: new Date(event.ts * 1000).toISOString(),
      authorRef: event.user,
      externalMessageId: event.client_msg_id,
      meta: { channel: event.channel }
    })
  });
});
```

## 🎯 Use Cases

1. **Team Health Monitoring**: Track emotional trends in engineering teams
2. **Community Management**: Detect early signs of burnout or excitement
3. **Customer Support**: Monitor support channel sentiment
4. **Product Feedback**: Analyze user feedback emotional patterns
5. **Event Planning**: Choose optimal times for team activities based on climate

## 🛠️ Extending the Service

### Adding New Emotion Analyzers

Implement the `IEmotionAnalyzer` interface:

```typescript
// apps/api/src/adapters/CustomAnalyzer.ts
import { IEmotionAnalyzer, AnalysisResult } from './IEmotionAnalyzer';

export class CustomAnalyzer implements IEmotionAnalyzer {
  async analyze(text: string): Promise<AnalysisResult> {
    // Your custom analysis logic
    return {
      sentimentScore: 0.5,
      emotions: [{ emotion: 'custom', weight: 0.8 }],
      intensityScore: 0.6,
      modelInfo: { provider: 'custom', model: 'v1' }
    };
  }

  getInfo() {
    return { provider: 'custom', model: 'v1' };
  }
}
```

Register in the factory:

```typescript
// apps/api/src/adapters/index.ts
export function createEmotionAnalyzer(provider: string, apiKey?: string) {
  switch (provider) {
    case 'custom':
      return new CustomAnalyzer();
    // ... other cases
  }
}
```

### Adding New Signal Sources

1. Create a signal source in the database
2. Use its `key` when ingesting signals
3. Build integration code for your platform

## 📈 Roadmap

- [ ] Real-time WebSocket updates for dashboard
- [ ] Scheduled snapshot generation (cron jobs)
- [ ] Alert system for extreme climate changes
- [ ] Multi-language support for emotion analysis
- [ ] Historical trend analysis and predictions
- [ ] Export reports (PDF, CSV)
- [ ] Admin panel for managing sources and communities
- [ ] Webhook notifications for climate changes

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes with clear commit messages
4. Add tests if applicable
5. Submit a pull request

## 📄 License

See LICENSE file for details.

## 🙏 Acknowledgments

This service provides the emotional intelligence layer for community health systems, enabling data-driven decisions about team well-being and intervention timing.

---

**Built with ❤️ for understanding community emotions**
