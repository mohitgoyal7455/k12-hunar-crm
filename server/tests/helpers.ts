import { vi } from 'vitest';

/**
 * Shared mock for src/db/pool. Each test file calls
 *   vi.mock('../src/db/pool', () => ({ pool: mockPool }))
 * and stubs query results with mockPool.query.mockResolvedValueOnce(...).
 */
export const mockPool = {
  query: vi.fn(),
  on: vi.fn(),
  end: vi.fn(),
};

export const pgResult = <T>(rows: T[]) => ({ rows, rowCount: rows.length });
