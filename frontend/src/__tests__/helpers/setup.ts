/**
 * Global test setup for Vitest.
 * Mocks Prisma client and env variables before any test runs.
 */
import { vi } from 'vitest';

// Mock environment variables
process.env.JWT_SECRET = 'test-secret-key-for-vitest-tests-only-32chars';
process.env.JWT_EXPIRES_IN = '900';
process.env.JWT_REFRESH_EXPIRES_IN = '604800';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
