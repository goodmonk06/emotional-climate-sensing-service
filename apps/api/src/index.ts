// Main API server
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

// Import services
import { IngestionService } from './services/IngestionService';
import { AnalysisService } from './services/AnalysisService';
import { ClimateService } from './services/ClimateService';

// Import adapters
import { createEmotionAnalyzer } from './adapters';

// Import routes
import { signalsRoutes } from './routes/signals';
import { analysisRoutes } from './routes/analysis';
import { climateRoutes } from './routes/climate';

// Load environment variables
dotenv.config();

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

async function start() {
  // Initialize Prisma
  const prisma = new PrismaClient();

  // Initialize emotion analyzer
  const aiProvider = process.env.AI_PROVIDER || 'stub';
  const apiKey = process.env.OPENAI_API_KEY;
  const analyzer = createEmotionAnalyzer(aiProvider, apiKey);

  console.log(`Using emotion analyzer: ${analyzer.getInfo().provider}`);

  // Initialize services
  const ingestionService = new IngestionService(prisma);
  const analysisService = new AnalysisService(prisma, analyzer);
  const climateService = new ClimateService(prisma, analyzer);

  // Initialize Fastify
  const fastify = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'development' ? 'info' : 'warn'
    }
  });

  // Register CORS
  await fastify.register(cors, {
    origin: CORS_ORIGIN,
    credentials: true
  });

  // Health check endpoint
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Register routes
  await fastify.register(signalsRoutes, {
    prefix: '/api/signals',
    ingestionService
  });

  await fastify.register(analysisRoutes, {
    prefix: '/api/analysis',
    analysisService
  });

  await fastify.register(climateRoutes, {
    prefix: '/api',
    climateService
  });

  // Start server
  try {
    await fastify.listen({ port: PORT, host: HOST });
    console.log(`🚀 Emotional Climate API listening on http://${HOST}:${PORT}`);
    console.log(`📊 API endpoints:`);
    console.log(`   POST   /api/signals/ingest`);
    console.log(`   GET    /api/signals/unanalyzed`);
    console.log(`   POST   /api/analysis/process`);
    console.log(`   GET    /api/analysis/stats`);
    console.log(`   GET    /api/communities`);
    console.log(`   GET    /api/communities/:id/climate/latest`);
    console.log(`   GET    /api/communities/:id/climate/history`);
    console.log(`   POST   /api/communities/:id/climate/snapshot`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }

  // Graceful shutdown
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
  signals.forEach((signal) => {
    process.on(signal, async () => {
      console.log(`\nReceived ${signal}, shutting down gracefully...`);
      await fastify.close();
      await prisma.$disconnect();
      process.exit(0);
    });
  });
}

start();
