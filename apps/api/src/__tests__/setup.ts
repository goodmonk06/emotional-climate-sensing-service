// Test setup file
import { beforeAll, afterAll } from 'vitest';

beforeAll(async () => {
  // Setup test environment
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'silent';
  process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/emotional_climate_test?schema=public';
  process.env.AI_PROVIDER = 'stub';
});

afterAll(async () => {
  // Cleanup
});
