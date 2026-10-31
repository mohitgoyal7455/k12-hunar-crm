import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Tests mock the database, so no real Postgres is needed.
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      DB_SSL: 'false',
      JWT_SECRET: 'test-secret-that-is-definitely-longer-than-32-chars',
      JWT_EXPIRES_IN: '1h',
      CLIENT_ORIGIN: 'http://localhost:5173',
    },
  },
});
