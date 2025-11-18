// Centralized logging utility using Pino
import pino from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
});

// Contextual loggers for different modules
export const createLogger = (module: string) => {
  return logger.child({ module });
};

// Specific module loggers
export const ingestionLogger = createLogger('ingestion');
export const analysisLogger = createLogger('analysis');
export const climateLogger = createLogger('climate');
export const apiLogger = createLogger('api');
