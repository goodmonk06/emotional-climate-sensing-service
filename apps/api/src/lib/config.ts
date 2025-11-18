// Configuration management
import * as dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const ConfigSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001').transform(Number),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.string().default('info'),

  // Database
  DATABASE_URL: z.string(),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  // AI Provider
  AI_PROVIDER: z.enum(['stub', 'openai']).default('stub'),
  OPENAI_API_KEY: z.string().optional(),

  // Snapshot Configuration
  SNAPSHOT_WINDOW_HOURS: z.string().default('24').transform(Number),

  // Analysis Configuration
  ANALYSIS_BATCH_SIZE: z.string().default('50').transform(Number),

  // Rate Limiting (for future use)
  RATE_LIMIT_MAX: z.string().default('100').transform(Number),
  RATE_LIMIT_WINDOW_MS: z.string().default('60000').transform(Number),
});

export type Config = z.infer<typeof ConfigSchema>;

let config: Config | null = null;

export function getConfig(): Config {
  if (!config) {
    try {
      config = ConfigSchema.parse(process.env);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Configuration validation failed:');
        error.errors.forEach((err) => {
          console.error(`  ${err.path.join('.')}: ${err.message}`);
        });
        process.exit(1);
      }
      throw error;
    }
  }
  return config;
}

// Export for convenience
export const config = getConfig();
