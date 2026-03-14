import { vi } from "vitest";

/**
 * Creates a mock Prisma client with vi.fn() stubs on common methods.
 * Used by service tests that import from '@/lib/db/prisma'.
 */
export function createMockPrismaClient() {
  return {
    $transaction: vi.fn((fn: (tx: unknown) => unknown) => fn(createMockPrismaClient())),
    claim: {
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    venue: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
    },
    user: {
      upsert: vi.fn(),
    },
  };
}

export type MockPrismaClient = ReturnType<typeof createMockPrismaClient>;
