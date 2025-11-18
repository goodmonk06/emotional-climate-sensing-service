// Main API server
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { PrismaClient } from '@prisma/client';

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

// Import infrastructure
import { config } from './lib/config';
import { logger, apiLogger } from './lib/logger';
import { AppError, formatError } from './lib/errors';
import { metrics } from './lib/metrics';

async function start() {
  apiLogger.info('Starting Emotional Climate API...');
  apiLogger.info({ config: { port: config.PORT, env: config.NODE_ENV, provider: config.AI_PROVIDER } }, 'Configuration loaded');

  // Initialize Prisma
  const prisma = new PrismaClient({
    log: config.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

  // Initialize emotion analyzer
  const analyzer = createEmotionAnalyzer(config.AI_PROVIDER, config.OPENAI_API_KEY);
  apiLogger.info({ analyzer: analyzer.getInfo() }, 'Emotion analyzer initialized');

  // Initialize services
  const ingestionService = new IngestionService(prisma);
  const analysisService = new AnalysisService(prisma, analyzer);
  const climateService = new ClimateService(prisma, analyzer);

  // Initialize Fastify
  const fastify = Fastify({
    logger: logger as any,
    disableRequestLogging: false,
  });

  // Register CORS
  await fastify.register(cors, {
    origin: config.CORS_ORIGIN,
    credentials: true,
  });

  // Global error handler
  fastify.setErrorHandler((error, request, reply) => {
    apiLogger.error({ err: error, url: request.url, method: request.method }, 'Request error');
    metrics.incrementCounter('api_errors_total', 1, { path: request.url, method: request.method });

    const formatted = formatError(error);
    const statusCode = error instanceof AppError ? error.statusCode : 500;

    reply.code(statusCode).send(formatted);
  });

  // Health check endpoint with detailed status
  fastify.get('/health', async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        services: {
          database: 'connected',
          analyzer: analyzer.getInfo(),
        },
      };
    } catch (error) {
      return {
        status: 'degraded',
        timestamp: new Date().toISOString(),
        services: {
          database: 'error',
          analyzer: analyzer.getInfo(),
        },
      };
    }
  });

  // Metrics endpoint
  fastify.get('/metrics', async () => {
    return metrics.getMetrics();
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
    await fastify.listen({ port: config.PORT, host: config.HOST });
    apiLogger.info(`🚀 Emotional Climate API listening on http://${config.HOST}:${config.PORT}`);
    apiLogger.info('📊 API endpoints:');
    apiLogger.info('   POST   /api/signals/ingest');
    apiLogger.info('   GET    /api/signals/unanalyzed');
    apiLogger.info('   POST   /api/analysis/process');
    apiLogger.info('   GET    /api/analysis/stats');
    apiLogger.info('   GET    /api/communities');
    apiLogger.info('   GET    /api/communities/:id/climate/latest');
    apiLogger.info('   GET    /api/communities/:id/climate/history');
    apiLogger.info('   POST   /api/communities/:id/climate/snapshot');
    apiLogger.info('   GET    /health');
    apiLogger.info('   GET    /metrics');
  } catch (err) {
    apiLogger.fatal(err, 'Failed to start server');
    process.exit(1);
  }

  // Graceful shutdown
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
  signals.forEach((signal) => {
    process.on(signal, async () => {
      apiLogger.info(`Received ${signal}, shutting down gracefully...`);
      await fastify.close();
      await prisma.$disconnect();
      apiLogger.info('Server shut down successfully');
      process.exit(0);
    });
  });
}

start();
